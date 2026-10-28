"""Precompute hourly O3/NO2 predictions for every site-day and export them.

- Labelled days get out-of-fold predictions: each calendar year is predicted
  by a model trained on the other years, so the accuracy shown next to the
  actuals is out-of-sample.
- Unseen days (inputs only, no observations) get predictions from the
  production models in artifacts/.

Both use the most recent observed day before the target day as context
(day-ahead when the previous day was observed, further back otherwise).

Outputs:
- output/predictions.csv: one row per site-hour
- ../../webdev/data/forecasts/site_<id>.json: what the dashboard reads

Run from ML/ after training:  python -m aq_model.export
"""
import json
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd

from .data import (FEATURES, TARGETS, add_climatology, add_context_features,
                   add_exogenous_features, daily_target_matrix, fit_climatology,
                   load_sites, load_train, load_unseen)
from .train import OUT as ARTIFACTS, PARAMS, SEED, build, gap_distribution, metrics

HERE = Path(__file__).resolve().parent
CSV_OUT = HERE / "output" / "predictions.csv"
WEB_OUT = HERE.parent.parent / "webdev" / "data" / "forecasts"


def with_context(frame, days, clim):
    site_days = frame[["site", "date"]].drop_duplicates()
    gaps = pd.Series(1, index=pd.MultiIndex.from_frame(site_days))
    return add_climatology(add_context_features(frame, days, gaps), clim)


def main():
    report = json.loads((ARTIFACTS / "metrics.json").read_text())
    rounds = {s: int(report["best_iterations"][s] * 1.1) for s in ["O3", "NO2"]}

    train_raw, unseen_raw = load_train(), load_unseen()
    allx = add_exogenous_features(pd.concat([train_raw, unseen_raw], ignore_index=True))
    labelled = allx[allx["O3_target"].notna()].copy()
    unseen = allx[allx["O3_target"].isna()].copy()
    days_all = daily_target_matrix(labelled)
    dist = gap_distribution(train_raw, unseen_raw)
    rng = np.random.default_rng(SEED)

    # Out-of-fold predictions, one fold per calendar year
    folds = []
    for year in sorted(labelled["datetime"].dt.year.unique()):
        hold = labelled["datetime"].dt.year == year
        fit_part, pred_part = labelled[~hold], labelled[hold]
        clim = fit_climatology(fit_part)
        # Train with sampled gaps like the production model; predict day-ahead
        Xf = build(fit_part, days_all, dist, clim, rng)
        Xp = with_context(pred_part, days_all, clim)
        out = Xp[["site", "datetime", "ref_gap_days", *TARGETS]].copy()
        for target, short in zip(TARGETS, ["O3", "NO2"]):
            m = lgb.train(PARAMS, lgb.Dataset(Xf[FEATURES], np.log1p(Xf[target])),
                          num_boost_round=rounds[short])
            out[f"{short}_pred"] = np.expm1(m.predict(Xp[FEATURES])).clip(min=0)
        out["kind"] = "backtest"
        folds.append(out)
        print(f"fold {year}: {len(out)} rows")

    # Unseen days with the production models
    clim_all = pd.read_csv(ARTIFACTS / "climatology.csv")
    Xu = with_context(unseen, days_all, clim_all)
    fut = Xu[["site", "datetime", "ref_gap_days"]].copy()
    for short in ["O3", "NO2"]:
        m = lgb.Booster(model_file=str(ARTIFACTS / f"lgbm_{short}.txt"))
        fut[f"{short}_pred"] = np.expm1(m.predict(Xu[FEATURES])).clip(min=0)
    fut["kind"] = "forecast"

    preds = pd.concat(folds + [fut], ignore_index=True).sort_values(["site", "datetime"])
    preds = preds.rename(columns={"O3_target": "O3_actual", "NO2_target": "NO2_actual"})

    site_metrics = {}
    bt = preds[preds["kind"] == "backtest"]
    for s, g in bt.groupby("site"):
        site_metrics[int(s)] = {short: {k: v for k, v in metrics(g[f"{short}_actual"], g[f"{short}_pred"]).items()
                                        if k != "n"} for short in ["O3", "NO2"]}
    overall = {short: metrics(bt[f"{short}_actual"], bt[f"{short}_pred"]) for short in ["O3", "NO2"]}
    report["backtest_out_of_fold"] = {"overall": overall, "per_site": site_metrics}
    (ARTIFACTS / "metrics.json").write_text(json.dumps(report, indent=2))
    print("out-of-fold overall:", overall)

    CSV_OUT.parent.mkdir(parents=True, exist_ok=True)
    cols = ["site", "datetime", "kind", "ref_gap_days", "O3_pred", "NO2_pred", "O3_actual", "NO2_actual"]
    preds[cols].round({"O3_pred": 2, "NO2_pred": 2}).to_csv(CSV_OUT, index=False, date_format="%Y-%m-%d %H:%M:%S")

    export_web(preds, site_metrics)


def _hourly(g: pd.DataFrame, col: str):
    vals = [None] * 24
    for h, v in zip(g["datetime"].dt.hour, g[col]):
        if pd.notna(v):
            vals[h] = round(float(v), 1)
    return vals


def export_web(preds: pd.DataFrame, site_metrics: dict):
    WEB_OUT.mkdir(parents=True, exist_ok=True)
    sites = load_sites()
    index = []
    for s, gs in preds.groupby("site"):
        days = {}
        for d, g in gs.groupby(gs["datetime"].dt.normalize()):
            if len(g) < 24:
                continue  # partial days (only 2024-06-30 at the data's edge)
            observed = bool(g["O3_actual"].notna().any())
            day = {"kind": g["kind"].iloc[0], "gap": int(g["ref_gap_days"].max()) if g["ref_gap_days"].notna().any() else None,
                   "O3_pred": _hourly(g, "O3_pred"), "NO2_pred": _hourly(g, "NO2_pred")}
            if observed:
                day["O3_actual"] = _hourly(g, "O3_actual")
                day["NO2_actual"] = _hourly(g, "NO2_actual")
            days[d.strftime("%Y-%m-%d")] = day
        site_id = int(s)
        (WEB_OUT / f"site_{site_id}.json").write_text(
            json.dumps({"site": site_id, "metrics": site_metrics[site_id], "days": days}, separators=(",", ":")))
        row = sites[sites["site"] == site_id].iloc[0]
        index.append({"id": str(site_id), "name": f"Site {site_id}",
                      "latitude": float(row["lat"]), "longitude": float(row["lon"]),
                      "predictable_dates": sorted(days)})
    (WEB_OUT / "sites.json").write_text(json.dumps(index, separators=(",", ":")))
    print("wrote", WEB_OUT)


if __name__ == "__main__":
    main()
