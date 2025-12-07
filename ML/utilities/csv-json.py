import pandas as pd
import json
from pathlib import Path

# ==============================================================================
# 1. CONFIGURATION
# ==============================================================================

BASE_DIR = Path(__file__).resolve().parent 

# Now define subdirectories relative to 'ML/'
ARTIFACT_DIR = BASE_DIR.parent / "artifacts"
DATA_DIR = BASE_DIR.parent / "Data_SIH_2025 2"

# Input Files
ENGINEERED_DATA_PATH = DATA_DIR / "train_dataset_engineered.csv"
ERA5_DATA_PATH = DATA_DIR / "era5_station_timeseries.csv"

# Verify paths printout (for debugging)
print(f"Script location: {BASE_DIR}")
print(f"Looking for data at: {DATA_DIR}")

# Settings
SITE_ID = 1             # Change to the site you want to test
TEST_YEAR = 2024        # Strictly use 2024 data
ROWS_TO_TAKE = 72       # Last 72 hours of 2024
OUTPUT_JSON_PATH = "test_payload_2024.json"

# ==============================================================================
# 2. LOAD & MERGE
# ==============================================================================
print("Loading datasets...")
if not ENGINEERED_DATA_PATH.exists() or not ERA5_DATA_PATH.exists():
    raise FileNotFoundError("❌ Missing data files. Check paths.")

# Load Engineered Data
df_eng = pd.read_csv(ENGINEERED_DATA_PATH)
df_eng["datetime"] = pd.to_datetime(df_eng["datetime"])

# Load ERA5 Data
df_era5 = pd.read_csv(ERA5_DATA_PATH)
df_era5["datetime"] = pd.to_datetime(df_era5["datetime"])

# Merge
print(f"Merging Engineered + ERA5 Data...")
df = df_eng.merge(df_era5, on=["site", "datetime"], how="left")

# ==============================================================================
# 3. FILTER FOR UNSEEN DATA (2024)
# ==============================================================================
# Filter by Site
df_site = df[df["site"] == SITE_ID].copy()

# Filter by Year (Crucial Step)
df_2024 = df_site[df_site["datetime"].dt.year == TEST_YEAR].copy()
df_2024 = df_2024.sort_values("datetime")

if df_2024.empty:
    raise ValueError(f"❌ No data found for Site {SITE_ID} in Year {TEST_YEAR}!")

print(f"Found {len(df_2024)} rows for Site {SITE_ID} in {TEST_YEAR}.")

# Take the last N rows (The most recent 'unseen' data)
df_final = df_2024.tail(ROWS_TO_TAKE).copy()

# ==============================================================================
# 4. EXPORT TO JSON
# ==============================================================================
# Convert Datetime to String
df_final["datetime"] = df_final["datetime"].dt.strftime("%Y-%m-%d %H:%M:%S")

# Handle NaNs (JSON standard compliance)
df_final = df_final.where(pd.notnull(df_final), None)

json_data = {
    "site_id": str(SITE_ID),
    "data": df_final.to_dict(orient="records")
}

# Save
with open(OUTPUT_JSON_PATH, "w") as f:
    json.dump(json_data, f, indent=4)

print(f"✅ JSON payload saved to: {OUTPUT_JSON_PATH}")
print(f"   Contains {len(df_final)} rows from {TEST_YEAR} (Unseen Data).")