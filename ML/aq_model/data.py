"""Loading and feature engineering for the precomputed-forecast pipeline.

Features come in two groups:
- exogenous: forecast/met/satellite inputs, calendar and site. Available for
  every hour that has an input row.
- context: what was measured on the most recent observed day, `ref_gap_days`
  before the target day. This makes the model a day-ahead (or k-days-ahead)
  forecaster that never looks at same-day or future observations.
"""
from pathlib import Path

import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "Data_SIH_2025_with_blh"
SITE_IDS = list(range(1, 8))
TARGETS = ["O3_target", "NO2_target"]
MAX_GAP_DAYS = 14


def load_sites() -> pd.DataFrame:
    df = pd.read_csv(DATA_DIR / "lat_lon_sites.txt", sep=r"\t+", engine="python")
    df.columns = ["site", "lat", "lon"]
    return df


def _load(kind: str) -> pd.DataFrame:
    frames = []
    for s in SITE_IDS:
        df = pd.read_csv(DATA_DIR / f"site_{s}_{kind}.csv")
        df["site"] = s
        frames.append(df)
    df = pd.concat(frames, ignore_index=True)
    df["datetime"] = pd.to_datetime(df[["year", "month", "day", "hour"]].astype(int))
    df["date"] = df["datetime"].dt.normalize()
    df = df.merge(load_sites(), on="site", how="left")
    return df.sort_values(["site", "datetime"]).reset_index(drop=True)


def load_train() -> pd.DataFrame:
    return _load("train_data")


def load_unseen() -> pd.DataFrame:
    return _load("unseen_input_data")


def add_exogenous_features(df: pd.DataFrame) -> pd.DataFrame:
    """Expects train + unseen rows together so rolling windows see every input hour."""
    df = df.sort_values(["site", "datetime"]).reset_index(drop=True)
    dt = df["datetime"]
    hour, month, doy = dt.dt.hour, dt.dt.month, dt.dt.dayofyear

    df["hour"] = hour
    df["hour_sin"] = np.sin(2 * np.pi * hour / 24)
    df["hour_cos"] = np.cos(2 * np.pi * hour / 24)
    df["month_sin"] = np.sin(2 * np.pi * month / 12)
    df["month_cos"] = np.cos(2 * np.pi * month / 12)
    df["doy_sin"] = np.sin(2 * np.pi * doy / 365.25)
    df["doy_cos"] = np.cos(2 * np.pi * doy / 365.25)
    df["dow"] = dt.dt.dayofweek

    df["wind_speed"] = np.hypot(df["u_forecast"], df["v_forecast"])
    df["log_blh"] = np.log1p(df["blh_forecast"].clip(lower=0))
    df["NO2_fc_per_blh"] = df["NO2_forecast"] / df["blh_forecast"].clip(lower=10)

    # Inputs are noisy hour to hour, so smoothed versions carry most of the signal.
    # Windows are time-based so gaps in the record don't stretch them.
    smooth = ["O3_forecast", "NO2_forecast", "T_forecast", "q_forecast", "blh_forecast", "wind_speed"]
    for s, idx in df.groupby("site").groups.items():
        part = df.loc[idx].set_index("datetime")[smooth]
        for w in ["6h", "24h"]:
            rolled = part.rolling(w, min_periods=1).mean()
            for col in smooth:
                df.loc[idx, f"{col}_roll{w}"] = rolled[col].to_numpy()
        daily = part.resample("D").mean()
        day_vals = daily.reindex(df.loc[idx, "date"]).to_numpy()
        for j, col in enumerate(smooth):
            df.loc[idx, f"{col}_daymean"] = day_vals[:, j]

    # Satellite data is daily and ~97% missing: carry the latest value forward
    for col in ["NO2_satellite", "HCHO_satellite", "ratio_satellite"]:
        df[f"{col}_ffill"] = df.groupby("site")[col].transform(lambda s: s.ffill(limit=72))
    return df


def daily_target_matrix(train: pd.DataFrame) -> dict:
    """{(site, date): array(24, 2)} of observed hourly O3/NO2 for complete days."""
    out = {}
    for (s, d), g in train.groupby(["site", "date"]):
        if len(g) == 24:
            out[(s, d)] = g.sort_values("hour")[TARGETS].to_numpy()
    return out


def add_context_features(df: pd.DataFrame, days: dict, gaps: pd.Series) -> pd.DataFrame:
    """Attach measurements from the observed day `gaps[(site, date)]` days earlier.

    `gaps` gives the *minimum* gap per site-day; if that day wasn't observed we
    walk further back, so `ref_gap_days` is the real distance used.
    """
    rows = []
    for (s, d), k in gaps.items():
        ref = None
        while k <= MAX_GAP_DAYS:
            ref = days.get((s, d - pd.Timedelta(days=k)))
            if ref is not None:
                break
            k += 1
        week = [days.get((s, d - pd.Timedelta(days=k + j))) for j in range(7)]
        week = [w for w in week if w is not None]
        rows.append((s, d, k if ref is not None else np.nan, ref, week))

    recs = []
    for s, d, k, ref, week in rows:
        base = {"site": s, "date": d, "ref_gap_days": k}
        if ref is not None:
            wk = np.stack(week)
            for t, name in enumerate(["O3", "NO2"]):
                base[f"{name}_ref_mean"] = ref[:, t].mean()
                base[f"{name}_ref_max"] = ref[:, t].max()
                base[f"{name}_ref_last"] = ref[-1, t]
                base[f"{name}_week_mean"] = wk[:, :, t].mean()
                base[f"_{name}_ref_hourly"] = ref[:, t]
                base[f"_{name}_week_hourly"] = wk[:, :, t].mean(axis=0)
        recs.append(base)
    ctx = pd.DataFrame(recs)
    df = df.merge(ctx, on=["site", "date"], how="left")

    # Same-hour values from the reference day / reference week
    h = df["hour"].astype(int).to_numpy()
    for name in ["O3", "NO2"]:
        for src, dst in [(f"_{name}_ref_hourly", f"{name}_ref_samehour"),
                         (f"_{name}_week_hourly", f"{name}_week_samehour")]:
            vals = df[src].to_numpy()
            df[dst] = [v[i] if isinstance(v, np.ndarray) else np.nan for v, i in zip(vals, h)]
        df = df.drop(columns=[f"_{name}_ref_hourly", f"_{name}_week_hourly"])
    return df


def add_climatology(df: pd.DataFrame, clim: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["month"] = df["datetime"].dt.month
    return df.merge(clim, on=["site", "month", "hour"], how="left")


def fit_climatology(train: pd.DataFrame) -> pd.DataFrame:
    t = train.assign(month=train["datetime"].dt.month, hour=train["datetime"].dt.hour)
    return (t.groupby(["site", "month", "hour"])[TARGETS].mean()
            .rename(columns={"O3_target": "O3_clim", "NO2_target": "NO2_clim"})
            .reset_index())


EXOGENOUS = [
    "O3_forecast", "NO2_forecast", "T_forecast", "q_forecast",
    "u_forecast", "v_forecast", "w_forecast", "blh_forecast",
    "NO2_satellite_ffill", "HCHO_satellite_ffill", "ratio_satellite_ffill",
    "hour", "hour_sin", "hour_cos", "month_sin", "month_cos", "doy_sin", "doy_cos",
    "dow", "site", "lat", "lon",
    "wind_speed", "log_blh", "NO2_fc_per_blh",
    *[f"{c}_{w}" for c in ["O3_forecast", "NO2_forecast", "T_forecast", "q_forecast",
                           "blh_forecast", "wind_speed"]
      for w in ["roll6h", "roll24h", "daymean"]],
]
CLIMATOLOGY = ["O3_clim", "NO2_clim"]
CONTEXT = [
    "ref_gap_days",
    *[f"{n}_{f}" for n in ["O3", "NO2"]
      for f in ["ref_mean", "ref_max", "ref_last", "week_mean", "ref_samehour", "week_samehour"]],
]
# No year/trend feature: the forecast inputs change scale between years
# (e.g. yearly mean O3_forecast ranges 23-153), and trees can't extrapolate a trend
FEATURES = EXOGENOUS + CLIMATOLOGY + CONTEXT
