"""Train and evaluate the O3/NO2 day-ahead models.

Split is by time: train < 2023-07-01 <= valid < 2024-01-01 <= test.
Valid drives early stopping; test is only scored once at the end.
The production models are then refit on all labelled data.

Run from ML/:  python -m aq_model.train
"""
import json
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd

from .data import (CONTEXT, EXOGENOUS, FEATURES, TARGETS, add_climatology,
                   add_context_features, add_exogenous_features,
                   daily_target_matrix, fit_climatology, load_train, load_unseen)

OUT = Path(__file__).resolve().parent / "artifacts"
VALID_START = pd.Timestamp("2023-07-01")
TEST_START = pd.Timestamp("2024-01-01")
SEED = 42

PARAMS = dict(
    objective="regression", learning_rate=0.03, num_leaves=63, min_data_in_leaf=50,
    feature_fraction=0.8, bagging_fraction=0.8, bagging_freq=1, lambda_l2=1.0,
    verbose=-1, seed=SEED,
)


def gap_distribution(train: pd.DataFrame, unseen: pd.DataFrame) -> pd.Series:
    """How many days back the last observed day is, for each unseen day."""
    observed = set(zip(train["site"], train["date"]))
    gaps = []
    for s, d in unseen[["site", "date"]].drop_duplicates().itertuples(index=False):
        k = next((k for k in range(1, 60) if (s, d - pd.Timedelta(days=k)) in observed), None)
        if k is not None:
            gaps.append(min(k, 14))
    return pd.Series(gaps).value_counts(normalize=True).sort_index()


def sample_gaps(site_days: pd.DataFrame, dist: pd.Series, rng) -> pd.Series:
    k = rng.choice(dist.index.to_numpy(), size=len(site_days), p=dist.to_numpy())
    return pd.Series(k, index=pd.MultiIndex.from_frame(site_days[["site", "date"]]))


def metrics(y, p) -> dict:
    y, p = np.asarray(y, float), np.asarray(p, float)
    m = ~(np.isnan(y) | np.isnan(p))
    y, p = y[m], p[m]
    ss_res, ss_tot = ((y - p) ** 2).sum(), ((y - y.mean()) ** 2).sum()
    return {"mae": round(float(np.abs(y - p).mean()), 3),
            "rmse": round(float(np.sqrt(((y - p) ** 2).mean())), 3),
            "r2": round(float(1 - ss_res / ss_tot), 4),
            "n": int(m.sum())}


def build(frame, days, dist, clim, rng):
    site_days = frame[["site", "date"]].drop_duplicates()
    out = add_context_features(frame, days, sample_gaps(site_days, dist, rng))
    return add_climatology(out, clim)


def fit(X, y, Xv=None, yv=None, rounds=None):
    dtrain = lgb.Dataset(X, np.log1p(y))
    if rounds is not None:
        return lgb.train(PARAMS, dtrain, num_boost_round=rounds)
    dvalid = lgb.Dataset(Xv, np.log1p(yv), reference=dtrain)
    return lgb.train(PARAMS, dtrain, num_boost_round=5000, valid_sets=[dvalid],
                     callbacks=[lgb.early_stopping(200, verbose=False)])


def predict(model, X):
    return np.expm1(model.predict(X, num_iteration=model.best_iteration or None)).clip(min=0)


def main():
    rng = np.random.default_rng(SEED)
    OUT.mkdir(parents=True, exist_ok=True)

    train_raw, unseen_raw = load_train(), load_unseen()
    allx = add_exogenous_features(pd.concat([train_raw, unseen_raw], ignore_index=True))
    labelled = allx[allx["O3_target"].notna()].copy()
    dist = gap_distribution(train_raw, unseen_raw)
    print("gap distribution (days):", dist.round(3).to_dict())

    tr = labelled[labelled["datetime"] < VALID_START]
    va = labelled[(labelled["datetime"] >= VALID_START) & (labelled["datetime"] < TEST_START)]
    te = labelled[labelled["datetime"] >= TEST_START]

    # Context and climatology for every split only use train-split observations
    days_tr = daily_target_matrix(tr)
    days_all = daily_target_matrix(labelled)
    clim_tr = fit_climatology(tr)
    tr_f = build(tr, days_tr, dist, clim_tr, rng)
    # Valid/test may use earlier valid/test days as context: that's what
    # forecasting with a k-day gap looks like in practice
    va_f = build(va, days_all, dist, clim_tr, rng)
    te_f = build(te, days_all, dist, clim_tr, rng)
    te_f1 = add_climatology(add_context_features(
        te, days_all, pd.Series(1, index=pd.MultiIndex.from_frame(te[["site", "date"]].drop_duplicates()))
    ), clim_tr)

    report = {"split": {"train_end": str(VALID_START.date()), "test_start": str(TEST_START.date()),
                        "rows": {"train": len(tr_f), "valid": len(va_f), "test": len(te_f)}},
              "gap_distribution": {int(k): round(float(v), 4) for k, v in dist.items()},
              "test": {}, "best_iterations": {}}

    models = {}
    for target, short in zip(TARGETS, ["O3", "NO2"]):
        results = {}
        for name, cols in [("exogenous_only", EXOGENOUS + ["O3_clim", "NO2_clim"]), ("full", FEATURES)]:
            m = fit(tr_f[cols], tr_f[target], va_f[cols], va_f[target])
            results[name] = {"model": m, "cols": cols,
                             "test": metrics(te_f[target], predict(m, te_f[cols]))}
        full = results["full"]["model"]
        report["test"][short] = {
            "lightgbm_full": results["full"]["test"],
            "lightgbm_full_gap1": metrics(te_f1[target], predict(full, te_f1[FEATURES])),
            "lightgbm_exogenous_only": results["exogenous_only"]["test"],
            "baseline_climatology": metrics(te_f[target], te_f[f"{short}_clim"]),
            "baseline_persistence": metrics(te_f[target], te_f[f"{short}_ref_samehour"]),
            "baseline_given_forecast": metrics(te_f[target], te_f[f"{short}_forecast"]),
        }
        report["best_iterations"][short] = full.best_iteration
        imp = pd.Series(full.feature_importance("gain"), index=FEATURES).sort_values(ascending=False)
        report.setdefault("top_features", {})[short] = imp.head(12).round(0).astype(int).to_dict()
        models[target] = full

    print(json.dumps(report["test"], indent=2))

    # Refit on all labelled data with the tuned number of rounds
    clim_all = fit_climatology(labelled)
    all_f = build(labelled, days_all, dist, clim_all, rng)
    for target, short in zip(TARGETS, ["O3", "NO2"]):
        rounds = int(report["best_iterations"][short] * 1.1)
        final = fit(all_f[FEATURES], all_f[target], rounds=rounds)
        final.save_model(str(OUT / f"lgbm_{short}.txt"))

    # Test-period predictions from the held-out models, kept for the dashboard
    te_out = te_f[["site", "datetime", *TARGETS, "ref_gap_days"]].copy()
    for target, short in zip(TARGETS, ["O3", "NO2"]):
        te_out[f"{short}_pred"] = predict(models[target], te_f[FEATURES])
    te_out.to_parquet(OUT / "test_predictions.parquet", index=False)

    clim_all.to_csv(OUT / "climatology.csv", index=False)
    (OUT / "metrics.json").write_text(json.dumps(report, indent=2))
    print("saved to", OUT)


if __name__ == "__main__":
    main()
