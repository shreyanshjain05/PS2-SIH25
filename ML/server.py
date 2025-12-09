# RUN USING python -m uvicorn server:app --reload

import warnings
import io
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

import numpy as np
import pandas as pd
import xgboost as xgb

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException, Body, Query
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# --- Configuration ---
warnings.filterwarnings("ignore")
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'Data_SIH_2025_with_blh'
ARTIFACT_DIR = BASE_DIR / "artifacts/FINAL_PRODUCTION_MODELS"
ERA5_DATA_PATH = DATA_DIR / "era5_station_timeseries.csv"
SITES_DATA_PATH = DATA_DIR / "lat_lon_sites.txt"

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AirQualityServer")

# Global State
models = {}
era5_data = None
site_dates_cache = {}  # Cache for site available dates

# --- Feature Columns ---
FEATURE_COLS = [
    "O3_forecast", "NO2_forecast",
    "T_forecast", "q_forecast", "u_forecast", "v_forecast", "w_forecast",
    "NO2_satellite", "HCHO_satellite", "ratio_satellite", "NO2_to_HCHO_ratio",
    "O3_lag_1h", "O3_lag_3h", "O3_lag_6h", "O3_lag_12h", "O3_lag_24h",
    "NO2_lag_1h", "NO2_lag_3h", "NO2_lag_6h", "NO2_lag_12h", "NO2_lag_24h",
    "O3_roll24_mean", "NO2_roll24_mean",
    "hour_sin", "hour_cos", "month_sin", "month_cos",
    "wind_speed", "O3_forecast_x_wind", "NO2_forecast_x_wind",
    "lat", "lon", "site",
    "O3_city_mean_lag1", "O3_city_std_lag1", 
    "NO2_city_mean_lag1", "NO2_city_std_lag1",
    "O3_idw_lag1", "NO2_idw_lag1",
    "O3_diff_mean_lag1", "NO2_diff_mean_lag1",
    "era5_blh", "era5_tcc", "era5_t2m", "era5_d2m", "era5_ssrd", "era5_tp"
]

# --- Helper Logic ---

def load_era5_data():
    global era5_data
    if ERA5_DATA_PATH.exists():
        logger.info(f"Loading ERA5 data from {ERA5_DATA_PATH}...")
        era5_data = pd.read_csv(ERA5_DATA_PATH)
        era5_data["datetime"] = pd.to_datetime(era5_data["datetime"])
    else:
        logger.warning(f"⚠️ ERA5 data not found at {ERA5_DATA_PATH}.")

def load_site_dates():
    """
    Load available dates for each site from train and unseen data files.
    Returns a dict: {site_id: {"available_dates": [...], "predictable_dates": [...]}}
    """
    global site_dates_cache
    from datetime import timedelta
    
    site_dates = {}
    
    # Scan for site files (site_1_train_data.csv, site_1_unseen_input_data.csv, etc.)
    for site_id in range(1, 8):  # Sites 1-7
        all_dates = set()
        
        # Check both train and unseen data files
        for file_type in ["train_data", "unseen_input_data"]:
            file_path = DATA_DIR / f"site_{site_id}_{file_type}.csv"
            if file_path.exists():
                try:
                    df = pd.read_csv(file_path)
                    # Create date from year, month, day columns
                    if all(col in df.columns for col in ["year", "month", "day"]):
                        df["date"] = pd.to_datetime(
                            df[["year", "month", "day"]].astype(int).assign(
                                year=lambda x: x["year"].astype(int),
                                month=lambda x: x["month"].astype(int),
                                day=lambda x: x["day"].astype(int)
                            )
                        )
                        unique_dates = df["date"].dt.strftime("%Y-%m-%d").unique()
                        all_dates.update(unique_dates)
                except Exception as e:
                    logger.warning(f"Error loading dates from {file_path}: {e}")
        
        # Sort dates
        available_dates = sorted(list(all_dates))
        
        # Calculate predictable dates (each available date + 1 day)
        predictable_dates = []
        for date_str in available_dates:
            next_date = pd.to_datetime(date_str) + timedelta(days=1)
            predictable_dates.append(next_date.strftime("%Y-%m-%d"))
        
        # Remove duplicates and sort
        predictable_dates = sorted(list(set(predictable_dates)))
        
        site_dates[str(site_id)] = {
            "available_dates": available_dates,
            "predictable_dates": predictable_dates
        }
        
        logger.info(f"Site {site_id}: {len(available_dates)} available dates, {len(predictable_dates)} predictable dates")
    
    site_dates_cache = site_dates
    return site_dates

def load_sites_data():
    global site_dates_cache
    if SITES_DATA_PATH.exists():
        try:
            # Read tab-separated file with flexible whitespace
            df = pd.read_csv(SITES_DATA_PATH, sep=r'\t+', engine='python')
            # Clean column names (strip whitespace)
            df.columns = df.columns.str.strip()
            
            sites = []
            for _, row in df.iterrows():
                site_id = str(int(row["Site"]))
                site_info = {
                    "id": site_id,
                    "latitude": row["Latitude N"],
                    "longitude": row["Longitude E"],
                    "name": f"Site {site_id}",
                    "available_dates": [],
                    "predictable_dates": []
                }
                
                # Add dates from cache if available
                if site_id in site_dates_cache:
                    site_info["available_dates"] = site_dates_cache[site_id]["available_dates"]
                    site_info["predictable_dates"] = site_dates_cache[site_id]["predictable_dates"]
                
                sites.append(site_info)
            return sites
        except Exception as e:
            logger.error(f"Error loading sites data: {e}")
            return []
    else:
        logger.warning(f"⚠️ Sites data not found at {SITES_DATA_PATH}.")
        return []

def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    if "datetime" in df.columns:
        if not pd.api.types.is_datetime64_any_dtype(df["datetime"]):
            df["datetime"] = pd.to_datetime(df["datetime"])
        df = df.sort_values(["site", "datetime"]).reset_index(drop=True)
    
    # Coerce numeric columns (handle JSON string inputs)
    for col in df.columns:
        if col not in ["site", "datetime", "date", "timestamp", "name", "id"]:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Merge ERA5
    if era5_data is not None and "era5_blh" not in df.columns:
        if "site" in df.columns and "datetime" in df.columns:
            df = df.merge(era5_data, on=["site", "datetime"], how="left")
    
    # Engineer Lags/Rolling
    if "O3_roll24_mean" not in df.columns and "O3_target" in df.columns:
        df["O3_roll24_mean"] = df.groupby("site")["O3_target"].shift(1).rolling(24, min_periods=1).mean()
        df["NO2_roll24_mean"] = df.groupby("site")["NO2_target"].shift(1).rolling(24, min_periods=1).mean()
        lags = [1, 3, 6, 12, 24]
        for lag in lags:
            df[f"O3_lag_{lag}h"] = df.groupby("site")["O3_target"].shift(lag)
            df[f"NO2_lag_{lag}h"] = df.groupby("site")["NO2_target"].shift(lag)

    # Time Features
    if "hour" not in df.columns and "datetime" in df.columns:
        df["hour"] = df["datetime"].dt.hour
        df["month"] = df["datetime"].dt.month
        
    if "hour_sin" not in df.columns and "hour" in df.columns:
        df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
        df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12.0)
        df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12.0)

    return df

def predict_single_step(df: pd.DataFrame) -> Dict[str, List[float]]:
    for col in FEATURE_COLS:
        if col not in df.columns: df[col] = 0.0
            
    X = df[FEATURE_COLS]
    results = {}
    
    if "O3_target" in models:
        results["O3_target"] = models["O3_target"].predict(X).tolist()
    if "NO2_target" in models:
        results["NO2_target"] = models["NO2_target"].predict(X).tolist()
        
    return results

def sanitize_list(data_list: List[Any]) -> List[Any]:
    return [None if isinstance(x, float) and (np.isnan(x) or np.isinf(x)) else x for x in data_list]

def format_data_response(df, predictions, error_metrics=False):
    response = {
        "dates": [],
        "actual": {},
        "predicted": {},
        "forecast": {},
        "historical": {},
        "metrics": {}
    }

    # Dates
    date_col = next((c for c in df.columns if c.lower() in ["datetime", "date", "timestamp", "time"]), None)
    if date_col:
        try:
            if not pd.api.types.is_datetime64_any_dtype(df[date_col]):
                df[date_col] = pd.to_datetime(df[date_col])
            response["dates"] = df[date_col].dt.strftime("%Y-%m-%d %H:%M:%S").tolist()
        except:
            response["dates"] = df[date_col].astype(str).tolist()
    else:
        response["dates"] = list(range(len(df)))

    # Actual (Ground Truth)
    for col in ["O3_target", "NO2_target"]:
        if col in df.columns:
            response["actual"][col] = sanitize_list(df[col].tolist())
            response["historical"][col] = sanitize_list(df[col].tolist())
    
    # Predicted & Forecast
    for col, preds in predictions.items():
        pred_values = sanitize_list(preds)
        response["predicted"][col] = pred_values
        response["forecast"][col] = pred_values

    # Metrics
    if error_metrics:
        for col in ["O3", "NO2"]:
            target_col = f"{col}_target"
            if target_col in df.columns and target_col in predictions:
                try:
                    actual = np.array(df[target_col].fillna(np.nan))
                    pred = np.array([np.nan if x is None else x for x in predictions[target_col]])
                    
                    mask = ~(np.isnan(actual) | np.isnan(pred))
                    if mask.sum() > 0:
                        actual_valid = actual[mask]
                        pred_valid = pred[mask]
                        mae = np.mean(np.abs(pred_valid - actual_valid))
                        rmse = np.sqrt(np.mean((pred_valid - actual_valid) ** 2))
                        ss_res = np.sum((actual_valid - pred_valid) ** 2)
                        ss_tot = np.sum((actual_valid - np.mean(actual_valid)) ** 2)
                        r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
                        
                        response["metrics"][col] = {
                            "mae": round(float(mae), 3),
                            "rmse": round(float(rmse), 3),
                            "r2": round(float(r2), 4)
                        }
                except Exception as e:
                    logger.warning(f"Error computing metrics for {col}: {e}")

    return response

async def parse_uploaded_file(file: UploadFile) -> pd.DataFrame:
    contents = await file.read()
    filename = file.filename.lower()
    
    if filename.endswith(".json"):
        try:
            json_content = json.loads(contents)
            if isinstance(json_content, dict) and "data" in json_content:
                df = pd.DataFrame(json_content["data"])
            elif isinstance(json_content, list):
                df = pd.DataFrame(json_content)
            else:
                df = pd.DataFrame([json_content])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON file: {str(e)}")
    else:
        try:
            df = pd.read_csv(io.BytesIO(contents))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")

    if "datetime" in df.columns:
        df["datetime"] = pd.to_datetime(df["datetime"])
        
    return df

# --- App Lifecycle ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_era5_data()
    load_site_dates()  # Load available dates for all sites
    
    o3_path = ARTIFACT_DIR / "production_O3_era5_spatial.json"
    no2_path = ARTIFACT_DIR / "production_NO2_era5_spatial.json"
    
    if o3_path.exists():
        models["O3_target"] = xgb.XGBRegressor()
        models["O3_target"].load_model(str(o3_path))
        logger.info("✅ O3 Model Loaded")
    
    if no2_path.exists():
        models["NO2_target"] = xgb.XGBRegressor()
        models["NO2_target"].load_model(str(no2_path))
        logger.info("✅ NO2 Model Loaded")
        
    yield
    models.clear()
    site_dates_cache.clear()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JsonInput(BaseModel):
    site_id: str
    data: List[Dict[str, Any]]

# ==============================================================================
# 1. CORE PIPELINE (Auto-Recursive)
# ==============================================================================

async def run_forecast_pipeline(df: pd.DataFrame, site_id: str, resample: Optional[str] = None) -> Dict[str, List[float]]:
    """
    Automatically handles recursive forecasting if future data (NaN targets) is detected.
    """
    
    # --- A. PREPARE ---
    if "datetime" in df.columns:
        df = df.sort_values("datetime").reset_index(drop=True)
    
    # Init targets if missing (Essential for recursion)
    if "site" not in df.columns: 
        # Extract numeric site ID
        import re
        try:
            num = re.search(r'\d+', str(site_id))
            val = float(num.group()) if num else 0.0
            df["site"] = val
        except:
            df["site"] = 0.0
            
    if "O3_target" not in df.columns: df["O3_target"] = np.nan
    if "NO2_target" not in df.columns: df["NO2_target"] = np.nan
        
    # Detect Future Gaps (Where O3_target is missing)
    nan_indices = df[df["O3_target"].isna()].index
    
    # --- B. EXECUTE ---
    if len(nan_indices) > 0:
        # FUTURE DETECTED: Use Recursive Loop
        start_idx = nan_indices[0]
        
        # 1. Loop through missing rows
        window_size = 60
        for i in range(start_idx, len(df)):
            # Optimization: Slice window to avoid recalculating features for entire history
            # We need enough history for lags (24h) + rolling windows (24h) -> ~48h + buffer
            w_start = max(0, i - window_size)
            w_end = i + 1
            df_window = df.iloc[w_start:w_end].copy()
            
            # Recalculate features on small window
            df_prep = prepare_features(df_window)
            
            # Take the last row (corresponding to current step 'i')
            # prepare_features resets index, so it's always the last row
            row_df = df_prep.iloc[[-1]].copy()
            
            # Predict single step
            step_preds = predict_single_step(row_df)
            
            # Fill Gap in main dataframe
            if "O3_target" in step_preds: df.at[i, "O3_target"] = step_preds["O3_target"][0]
            if "NO2_target" in step_preds: df.at[i, "NO2_target"] = step_preds["NO2_target"][0]
        
        # 2. Final batch predict (to ensure consistent formatting/smoothing later)
        final_prep = prepare_features(df)
        preds_dict = predict_single_step(final_prep)
        
    else:
        # HISTORY ONLY: Use Fast Batch Predict
        df_prep = await run_in_threadpool(lambda: prepare_features(df))
        preds_dict = await run_in_threadpool(lambda: predict_single_step(df_prep))

    # --- C. RESAMPLING (Optional) ---
    if resample and isinstance(resample, str):
        try:
            for k, v in preds_dict.items():
                df[k] = v
            
            if "datetime" in df.columns:
                numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
                df_res = df.set_index("datetime")[numeric_cols].resample(resample).mean().reset_index()
                preds_dict = {k: df_res[k].tolist() for k in preds_dict.keys()}
                df = df_res
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Resampling failed: {str(e)}")

    return format_data_response(df, preds_dict, error_metrics=True)

# ==============================================================================
# 2. ENDPOINTS
# ==============================================================================

# --- A. Forecast (Default) ---
@app.get("/sites/")
async def get_sites():
    sites = await run_in_threadpool(load_sites_data)
    if not sites:
        raise HTTPException(status_code=404, detail="No sites data available")
    return sites

@app.post("/forecast/json/")
async def forecast_json(
    payload: JsonInput, 
    resample: Optional[str] = Query(None, description="Resample frequency (e.g., 'D', 'W')")
):
    df = pd.DataFrame(payload.data)
    if "datetime" in df.columns: df["datetime"] = pd.to_datetime(df["datetime"])
    return await run_forecast_pipeline(df, payload.site_id, resample)

@app.post("/forecast/file/")
async def forecast_file(
    site_id: str = Form(...), 
    file: UploadFile = File(...),
    resample: Optional[str] = Query(None, description="Resample frequency (e.g., 'D', 'W')")
):
    df = await parse_uploaded_file(file)
    return await run_forecast_pipeline(df, site_id, resample)

# --- B. Performance (12H Smoothed) ---
@app.post("/plots/performance/json/")
async def perf_json(payload: JsonInput):
    df = pd.DataFrame(payload.data)
    if "datetime" in df.columns: df["datetime"] = pd.to_datetime(df["datetime"])
    return await process_view(df, payload.site_id, "performance")

@app.post("/plots/performance/file/")
async def perf_file(site_id: str = Form(...), file: UploadFile = File(...)):
    df = await parse_uploaded_file(file)
    return await process_view(df, site_id, "performance")

# --- C. Diagnostic (6H Resampled) ---
@app.post("/plots/diagnostic/json/")
async def diag_json(payload: JsonInput):
    df = pd.DataFrame(payload.data)
    if "datetime" in df.columns: df["datetime"] = pd.to_datetime(df["datetime"])
    return await process_view(df, payload.site_id, "diagnostic")

@app.post("/plots/diagnostic/file/")
async def diag_file(site_id: str = Form(...), file: UploadFile = File(...)):
    df = await parse_uploaded_file(file)
    return await process_view(df, site_id, "diagnostic")

# --- D. Time Series (Raw) ---
@app.post("/plots/timeseries/json/")
async def ts_json(payload: JsonInput):
    df = pd.DataFrame(payload.data)
    if "datetime" in df.columns: df["datetime"] = pd.to_datetime(df["datetime"])
    return await run_forecast_pipeline(df, payload.site_id)

@app.post("/plots/timeseries/file/")
async def ts_file(site_id: str = Form(...), file: UploadFile = File(...)):
    df = await parse_uploaded_file(file)
    return await run_forecast_pipeline(df, site_id)

# --- E. Extreme Pollution ---
@app.post("/plots/extreme/json/")
async def extreme_json(payload: JsonInput, o3_thresh: float = 180.0, no2_thresh: float = 200.0):
    df = pd.DataFrame(payload.data)
    if "datetime" in df.columns: df["datetime"] = pd.to_datetime(df["datetime"])
    return await run_extreme_logic(df, payload.site_id, o3_thresh, no2_thresh)

@app.post("/plots/extreme/file/")
async def extreme_file(
    site_id: str = Form(...),
    file: UploadFile = File(...),
    o3_thresh: float = 180.0,
    no2_thresh: float = 200.0
):
    df = await parse_uploaded_file(file)
    return await run_extreme_logic(df, site_id, o3_thresh, no2_thresh)

# --- Shared View Logic ---
async def process_view(df, site_id, view_type):
    preds_dict = await run_forecast_pipeline(df, site_id)
    
    # Flatten for manipulation
    for k, v in preds_dict["forecast"].items():
        df[f"{k}_pred"] = v
    
    if view_type == "performance":
        if "datetime" in df.columns:
            cols = df.select_dtypes(include=[np.number]).columns.tolist()
            df = df.set_index("datetime")[cols].rolling(12, min_periods=1).mean().reset_index()
        else:
            df = df.rolling(12, min_periods=1).mean()
    elif view_type == "diagnostic":
        if "datetime" in df.columns:
            cols = df.select_dtypes(include=[np.number]).columns.tolist()
            df = df.set_index("datetime")[cols].resample("6H").mean().reset_index()
            
    # Re-extract
    final_preds = {k.replace("_pred", ""): df[k].tolist() for k in df.columns if "_pred" in k}
    return format_data_response(df, final_preds, error_metrics=True)

async def run_extreme_logic(df, site_id, o3_thresh, no2_thresh):
    preds_dict = await run_forecast_pipeline(df, site_id)
    for k, v in preds_dict["forecast"].items(): df[f"{k}_pred"] = v
    
    mask = pd.Series([False]*len(df), index=df.index)
    if "O3_target" in df.columns: mask |= (df["O3_target"] > o3_thresh)
    if "NO2_target" in df.columns: mask |= (df["NO2_target"] > no2_thresh)
    
    df_filtered = df[mask].copy()
    filt_preds = {k.replace("_pred", ""): df_filtered[k].tolist() for k in df.columns if "_pred" in k}
    return format_data_response(df_filtered, filt_preds, error_metrics=True)

# ==============================================================================
# 3. LEGACY / WEBSOCKET
# ==============================================================================

@app.post("/predict/")
async def predict_simple(input_data: JsonInput):
    df = pd.DataFrame(input_data.data)
    # Run pipeline and get full response with actual vs predicted
    res = await run_forecast_pipeline(df, input_data.site_id)
    return {
        "site_id": input_data.site_id,
        "dates": res.get("dates", []),
        "actual": res.get("actual", {}),
        "historical": res.get("historical", {}),
        "predicted": res.get("predicted", {}),
        "forecast": res.get("forecast", {}),
        "metrics": res.get("metrics", {})
    }

@app.websocket("/ws/predict/")
async def websocket_predict(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            input_data = json.loads(data)
            df = pd.DataFrame(input_data["data"])
            
            # Run full pipeline to ensure lags are handled correctly
            res = await run_forecast_pipeline(df, input_data.get("site_id", "1"))
            
            # Send response with actual, historical, predicted, forecast, and metrics
            ws_response = {
                "dates": res.get("dates", []),
                "historical": historical,
                "actual": res.get("actual", {}),
                "historical": res.get("historical", {}),
                "predicted": res.get("predicted", {}),
                "forecast": res.get("forecast", {}),
                "metrics": res.get("metrics", {})
            }
            await websocket.send_text(json.dumps(ws_response))
    except WebSocketDisconnect:
        print("WebSocket disconnected")

@app.get("/health/")
def health_check():
    return {"status": "ok", "models": list(models.keys())}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)