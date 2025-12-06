import cdsapi
import yaml
from pathlib import Path
config_path = Path(__file__).parent / ".cdsapirc"

ERA5_DIR = Path("era5_raw")
ERA5_DIR.mkdir(parents=True, exist_ok=True)
print(f'\n the path is {ERA5_DIR}')

with config_path.open() as f:
    cfg = yaml.safe_load(f)

c = cdsapi.Client(
    url=cfg["url"],
    key=cfg["key"],
    verify=cfg.get("verify", 1)
)


variables = [
    "boundary_layer_height",
    "total_cloud_cover",
    "surface_solar_radiation_downwards",
    "total_precipitation",
    "2m_temperature",
    "2m_dewpoint_temperature",
]

# Delhi bounding box: [North, West, South, East]
area = [28.9, 76.9, 28.4, 77.4]

day_list = [f"{d:02d}" for d in range(1, 32)]
hour_list = [f"{h:02d}:00" for h in range(24)]

# Helper: which months to request per year
def months_for_year(y: int):
    if y == 2019:
        return [7, 8, 9, 10, 11, 12]       # Jul–Dec 2019
    elif y in [2020, 2021, 2022, 2023]:
        return list(range(1, 13))          # Jan–Dec
    elif y == 2024:
        return [1, 2, 3, 4, 5, 6]          # Jan–Jun 2024
    else:
        return []

years = [2019, 2020, 2021, 2022, 2023, 2024]

for y in years:
    months = months_for_year(y)
    for m in months:
        year_str = str(y)
        month_str = f"{m:02d}"
        target_file = ERA5_DIR / f"era5_delhi_{year_str}_{month_str}.nc"

        if target_file.exists():
            print(f"Already exists, skipping: {target_file}")
            continue

        print(f"\n=== Requesting ERA5 for {year_str}-{month_str} ===")
        c.retrieve(
            "reanalysis-era5-single-levels",
            {
                "product_type": "reanalysis",
                "variable": variables,
                "year": [year_str],
                "month": [month_str],
                "day": day_list,
                "time": hour_list,
                "area": area,
                "format": "netcdf",
            },
            str(target_file),
        )

print("\nAll monthly ERA5 downloads finished (or skipped if already present).")
