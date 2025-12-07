from pathlib import Path
import pandas as pd
import numpy as np
from math import radians, sin, cos, sqrt, atan2

# Directories and paths
BASE_DIR = Path(__file__).resolve().parent 
DATA_DIR = BASE_DIR.parent / "Data_SIH_2025 2"
ARTIFACT_DIR = Path("artifacts/xgb_models-2.0")
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
coords_path = DATA_DIR / "lat_lon_sites.txt"

# Load coordinates
coords_raw = pd.read_csv(coords_path, sep=r"\s+", engine="python")
coords = pd.DataFrame({
    "site": coords_raw["Site"].astype(int),
    "lat": coords_raw["Latitude"].astype(float),
    "lon": coords_raw["N"].astype(float),  # 'N' column actually holds longitude
})

print("Loaded coordinates:")
print(coords)

# Load all site train data
dfs = []
for site_id in range(1, 8):
    csv_path = DATA_DIR / f"site_{site_id}_train_data.csv"
    df = pd.read_csv(csv_path)
    df["site"] = site_id
    dfs.append(df)

data = pd.concat(dfs, ignore_index=True)
print("Total rows after loading all 7 sites:", len(data))

# Attach coordinates
data = data.merge(coords, on="site", how="left")

# Make datetime
data["datetime"] = pd.to_datetime(
    dict(
        year=data["year"].astype(int),
        month=data["month"].astype(int),
        day=data["day"].astype(int),
        hour=data["hour"].astype(int),
    ),
    errors="coerce"
)

# Fill satellite data
satellite_cols = ["NO2_satellite", "HCHO_satellite", "ratio_satellite"]
for col in satellite_cols:
    data[col] = data.groupby(["year", "month", "day"])[col].ffill().bfill()

print("Satellite columns filled per day (forward + backward fill).")

# Sort data by site and datetime
data = data.sort_values(["site", "datetime"])

# Add lag features
def add_lags(group):
    group = group.sort_values("datetime").copy()
    
    # Lags
    for h in [1, 3, 6, 12, 24]:
        group[f"O3_lag_{h}h"] = group["O3_target"].shift(h)
        group[f"NO2_lag_{h}h"] = group["NO2_target"].shift(h)

    # Rolling 24h mean based only on PAST values
    group["O3_roll24_mean"] = group["O3_target"].shift(1).rolling(24, min_periods=12).mean()
    group["NO2_roll24_mean"] = group["NO2_target"].shift(1).rolling(24, min_periods=12).mean()

    return group

data = data.groupby("site", group_keys=False).apply(add_lags).reset_index(drop=True)

# Calculate city-level statistics for each datetime
city_stats = (
    data.groupby("datetime")
    .agg(
        O3_city_mean_lag1=("O3_lag_1h", "mean"),
        O3_city_std_lag1=("O3_lag_1h", "std"),
        NO2_city_mean_lag1=("NO2_lag_1h", "mean"),
        NO2_city_std_lag1=("NO2_lag_1h", "std"),
    )
    .reset_index()
)

data = data.merge(city_stats, on="datetime", how="left")

# Haversine function to compute distance between lat/lon pairs
def haversine(lat1, lon1, lat2, lon2):
    """Distance in km between two lat/lon points."""
    R = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))

# Compute IDW-based smoothed O3/NO2 from lag1 per datetime group
def compute_idw_from_lag1(group, power=2, eps=1e-6):
    """Compute IDW-based smoothed O3/NO2 from lag1 per datetime group."""
    lats = group["lat"].values
    lons = group["lon"].values
    o3_vals = group["O3_lag_1h"].values
    no2_vals = group["NO2_lag_1h"].values

    o3_idw, no2_idw = [], []

    for i in range(len(group)):
        num_o3 = num_no2 = den = 0.0
        for j in range(len(group)):
            if i == j:
                continue
            d = haversine(lats[i], lons[i], lats[j], lons[j]) + eps
            w = 1.0 / (d ** power)
            num_o3 += w * o3_vals[j]
            num_no2 += w * no2_vals[j]
            den += w

        if den == 0:
            o3_idw.append(o3_vals[i])
            no2_idw.append(no2_vals[i])
        else:
            o3_idw.append(num_o3 / den)
            no2_idw.append(num_no2 / den)

    group["O3_idw_lag1"] = o3_idw
    group["NO2_idw_lag1"] = no2_idw
    return group

data = data.groupby("datetime", group_keys=False).apply(compute_idw_from_lag1).reset_index(drop=True)

# Difference from city mean (based on lag1)
data["O3_diff_mean_lag1"] = data["O3_lag_1h"] - data["O3_city_mean_lag1"]
data["NO2_diff_mean_lag1"] = data["NO2_lag_1h"] - data["NO2_city_mean_lag1"]

# Clean up NaNs in spatial std / IDW / diff columns
spatial_fill_zero = [
    "O3_city_std_lag1", "NO2_city_std_lag1", "O3_diff_mean_lag1", "NO2_diff_mean_lag1",
]

for col in spatial_fill_zero:
    if col in data.columns:
        data[col] = data[col].fillna(0.0)

# If any IDW values are NaN (e.g., all neighbors missing), fallback to lag1 at that site
for col_lag, col_idw in [("O3_lag_1h", "O3_idw_lag1"), ("NO2_lag_1h", "NO2_idw_lag1")]:
    if col_idw in data.columns:
        data[col_idw] = data[col_idw].fillna(data[col_lag])

# ---------------------------------------------------------
# Time encodings
# ---------------------------------------------------------
data["hour_sin"] = np.sin(2 * np.pi * data["hour"] / 24)
data["hour_cos"] = np.cos(2 * np.pi * data["hour"] / 24)
data["month_sin"] = np.sin(2 * np.pi * data["month"] / 12)
data["month_cos"] = np.cos(2 * np.pi * data["month"] / 12)

# ---------------------------------------------------------
# Interactions
# ---------------------------------------------------------
data["wind_speed"] = np.sqrt(data["u_forecast"]**2 + data["v_forecast"]**2)
data["O3_forecast_x_wind"] = data["O3_forecast"] * data["wind_speed"]
data["NO2_forecast_x_wind"] = data["NO2_forecast"] * data["wind_speed"]

# Chemistry ratio (after satellite fill)
data["NO2_to_HCHO_ratio"] = data["NO2_satellite"] / (data["HCHO_satellite"] + 1e-6)

# ---------------------------------------------------------
# Drop rows with missing lag/rolling (warm-up period)
# ---------------------------------------------------------
print("Total rows BEFORE dropping lag-related rows:", len(data))
lag_cols = [c for c in data.columns if "lag_" in c or "roll24" in c]
data_clean = data.dropna(subset=lag_cols).reset_index(drop=True)
print("Total rows AFTER dropping lag-related rows:", len(data_clean))
print("Rows removed due to lag/rolling history:", len(data) - len(data_clean))

# Save cleaned dataset
output_path = DATA_DIR / "train_dataset_engineered.csv"
data_clean.to_csv(output_path, index=False)

print("Feature engineering completed!")
print(f"Saved engineered dataset to: {output_path}")

# Load and plot results
df_1 = pd.read_csv('artifacts/xgb_models-2.0/train_dataset_engineered.csv')
df_1.head()