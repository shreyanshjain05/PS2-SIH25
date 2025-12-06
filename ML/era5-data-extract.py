from pathlib import Path
import zipfile
import xarray as xr
import pandas as pd

# -------------------------------------------------
# PATHS (adjust BASE_DIR if needed)
# -------------------------------------------------
BASE_DIR = Path("/Users/shreyanshjain/SIH25/PS2-SIH25/ML").resolve()
DATA_DIR = BASE_DIR / "Data_SIH_2025 2"

ERA5_ZIP_DIR = BASE_DIR / "era5_raw"       # where era5_delhi_*.nc (ZIPs) are
INSTANT_DIR = ERA5_ZIP_DIR / "instant_nc"  # extracted instantaneous .nc
ACCUM_DIR = ERA5_ZIP_DIR / "accum_nc"      # extracted accumulated .nc

INSTANT_DIR.mkdir(parents=True, exist_ok=True)
ACCUM_DIR.mkdir(parents=True, exist_ok=True)

print("BASE_DIR:", BASE_DIR)
print("ERA5_ZIP_DIR:", ERA5_ZIP_DIR)

# -------------------------------------------------
# 1. UNZIP ALL CHUNKS INTO SEPARATE NC FILES
# -------------------------------------------------
zip_files = sorted(ERA5_ZIP_DIR.glob("era5_delhi_*.nc"))
print(f"Found {len(zip_files)} zipped ERA5 chunk files.")

if not zip_files:
    raise SystemExit("No zipped ERA5 files found in era5_raw/. Run downloader first.")

for f in zip_files:
    print(f"Unzipping: {f.name}")
    with zipfile.ZipFile(f, "r") as z:
        for member in z.namelist():
            data = z.read(member)

            if "instant" in member.lower():
                out_path = INSTANT_DIR / f"{f.stem}_instant.nc"
            elif "accum" in member.lower():
                out_path = ACCUM_DIR / f"{f.stem}_accum.nc"
            else:
                print("  Skipping unknown member:", member)
                continue

            with open(out_path, "wb") as out_f:
                out_f.write(data)

print("\nExtraction done.")
print("Instant files:", len(list(INSTANT_DIR.glob('*.nc'))))
print("Accum files:", len(list(ACCUM_DIR.glob('*.nc'))))

# -------------------------------------------------
# 2. OPEN AND MERGE INSTANT + ACCUM DATASETS (NO DASK)
# -------------------------------------------------
inst_files = sorted(INSTANT_DIR.glob("*.nc"))
acc_files = sorted(ACCUM_DIR.glob("*.nc"))

if not inst_files:
    raise SystemExit("No instant_nc/*.nc files found after unzip.")
if not acc_files:
    raise SystemExit("No accum_nc/*.nc files found after unzip.")

print("\nOpening instantaneous dataset WITHOUT dask...")
inst_ds_list = [xr.open_dataset(str(f)) for f in inst_files]
ds_inst = xr.combine_by_coords(inst_ds_list, combine_attrs="override")
print("Instantaneous variables:", list(ds_inst.data_vars))

print("\nOpening accumulated dataset WITHOUT dask...")
acc_ds_list = [xr.open_dataset(str(f)) for f in acc_files]
ds_acc = xr.combine_by_coords(acc_ds_list, combine_attrs="override")
print("Accumulated variables:", list(ds_acc.data_vars))

# Use the variables exactly as they appear in the files
# From your log: blh, tcc, t2m, d2m, ssrd, tp
inst_vars = list(ds_inst.data_vars)
acc_vars = list(ds_acc.data_vars)

print("\nUsing instantaneous vars:", inst_vars)
print("Using accumulated vars:", acc_vars)

ds = xr.merge(
    [
        ds_inst[inst_vars],
        ds_acc[acc_vars],
    ]
)

print("\nMerged ERA5 dataset:")
print(ds)

# -------------------------------------------------
# 2.5 DETECT LAT / LON COORD NAMES
# -------------------------------------------------
coord_names = list(ds.coords)
lat_candidates = [c for c in coord_names if "lat" in c.lower()]
lon_candidates = [c for c in coord_names if "lon" in c.lower()]

if not lat_candidates or not lon_candidates:
    raise SystemExit(f"Could not find lat/lon coords in {coord_names}")

lat_name = lat_candidates[0]
lon_name = lon_candidates[0]

print(f"\nUsing latitude coord: {lat_name}")
print(f"Using longitude coord: {lon_name}")

# -------------------------------------------------
# 3. INTERPOLATE TO YOUR 7 DELHI STATIONS
# -------------------------------------------------
coords_path = DATA_DIR / "lat_lon_sites.txt"
coords_raw = pd.read_csv(coords_path, sep=r"\s+", engine="python")
coords = pd.DataFrame({
    "site": coords_raw["Site"].astype(int),
    "lat": coords_raw["Latitude"].astype(float),
    "lon": coords_raw["N"].astype(float),  # 'N' column is longitude
})

print("\nStation coordinates:")
print(coords)

rows = []

for _, r in coords.iterrows():
    site_id = r["site"]
    lat = r["lat"]
    lon = r["lon"]

    print(f"Interpolating for site {site_id} at (lat={lat}, lon={lon})")
    # Use detected coordinate names here
    site_ds = ds.interp({lat_name: lat, lon_name: lon})

    df_site = site_ds.to_dataframe().reset_index()
    df_site["site"] = site_id
    rows.append(df_site)

era5_df = pd.concat(rows, ignore_index=True)

# -------------------------------------------------
# 4. CLEAN COLUMNS AND RENAME TO era5_*
# -------------------------------------------------
print("\nColumns before renaming:", era5_df.columns)

# 1. Handle time column renaming (ERA5 often uses 'valid_time')
if "valid_time" in era5_df.columns:
    era5_df = era5_df.rename(columns={"valid_time": "datetime"})
elif "time" in era5_df.columns:
    era5_df = era5_df.rename(columns={"time": "datetime"})

# 2. Verify datetime exists
if "datetime" not in era5_df.columns:
    # If we still can't find it, print available columns to debug
    raise KeyError(f"Could not find 'time' or 'valid_time' column. Available columns: {list(era5_df.columns)}")

era5_df["datetime"] = pd.to_datetime(era5_df["datetime"])

# 3. Map ERA5 short names -> your feature names
rename_map = {
    "blh": "era5_blh",
    "tcc": "era5_tcc",
    "ssrd": "era5_ssrd",
    "tp": "era5_tp",
    "t2m": "era5_t2m",
    "d2m": "era5_d2m",
}

# Apply renames only if columns exist
era5_df = era5_df.rename(columns=rename_map)

# 4. Filter to keep only relevant columns
# We dynamically select columns that start with "era5_" plus site and datetime
keep_cols = ["site", "datetime"] + [c for c in era5_df.columns if c.startswith("era5_")]

# Ensure we don't try to keep columns that aren't there
final_cols = [c for c in keep_cols if c in era5_df.columns]
era5_df = era5_df[final_cols]

print("\nFinal ERA5 station dataframe:")
print(era5_df.head())
print("Shape:", era5_df.shape)
# -------------------------------------------------
# 5. SAVE CSV FOR COLAB / MODEL TRAINING
# -------------------------------------------------
out_path = BASE_DIR / "era5_station_timeseries.csv"
era5_df.to_csv(out_path, index=False)

print("\nSaved ERA5 station CSV to:", out_path)
