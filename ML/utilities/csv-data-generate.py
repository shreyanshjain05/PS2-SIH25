import pandas as pd
from pathlib import Path

# ==============================================================================
# 1. CONFIGURATION
# ==============================================================================
# Use relative path anchoring so it works from any terminal location
BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR.parent / "artifacts"
DATA_DIR = BASE_DIR.parent / "Data_SIH_2025 2"

# Input Files
ENGINEERED_DATA_PATH = DATA_DIR / "train_dataset_engineered.csv"
ERA5_DATA_PATH = DATA_DIR / "era5_station_timeseries.csv"

# Settings
SITE_ID = 1             
TEST_YEAR = 2024        
ROWS_TO_TAKE = 72       
OUTPUT_CSV_PATH = "test_payload_2024.csv"

# ==============================================================================
# 2. LOAD & MERGE
# ==============================================================================
print("Loading datasets...")
if not ENGINEERED_DATA_PATH.exists() or not ERA5_DATA_PATH.exists():
    raise FileNotFoundError("❌ Missing data files. Check paths.")

# Load Data
df_eng = pd.read_csv(ENGINEERED_DATA_PATH)
df_eng["datetime"] = pd.to_datetime(df_eng["datetime"])

df_era5 = pd.read_csv(ERA5_DATA_PATH)
df_era5["datetime"] = pd.to_datetime(df_era5["datetime"])

# Merge
print(f"Merging Engineered + ERA5 Data...")
df = df_eng.merge(df_era5, on=["site", "datetime"], how="left")

# ==============================================================================
# 3. FILTER FOR UNSEEN DATA
# ==============================================================================
# Filter by Site & Year
df_site = df[df["site"] == SITE_ID].copy()
df_2024 = df_site[df_site["datetime"].dt.year == TEST_YEAR].copy()
df_2024 = df_2024.sort_values("datetime")

if df_2024.empty:
    raise ValueError(f"❌ No data found for Site {SITE_ID} in Year {TEST_YEAR}!")

# Take last N rows
df_final = df_2024.tail(ROWS_TO_TAKE).copy()

# ==============================================================================
# 4. EXPORT TO CSV
# ==============================================================================
df_final.to_csv(OUTPUT_CSV_PATH, index=False)

print(f"✅ CSV payload saved to: {OUTPUT_CSV_PATH}")
print(f"   Contains {len(df_final)} rows. Use this file for /plots/ and /forecast/ endpoints.")