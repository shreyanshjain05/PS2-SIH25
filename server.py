import warnings
import math
from pathlib import Path
import numpy as np
import pandas as pd
import torch
from torch import nn
from torch.utils.data import Dataset
from sklearn.preprocessing import StandardScaler
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
import uvicorn
import json
from typing import List, Dict, Any, Optional
import io

# --- Suppress Warnings ---
warnings.filterwarnings("ignore")

# --- Global Configuration ---
ARTIFACT_DIR = Path("artifacts/final_models")
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
SITE_IDS = [f"site_{i}" for i in range(1, 8)]
TARGET_COLUMNS = ["O3_target", "NO2_target"]

SITES_COORDINATES = {
    "site_1": {"latitude": 28.69536, "longitude": 77.18168},
    "site_2": {"latitude": 28.5718, "longitude": 77.07125},
    "site_3": {"latitude": 28.58278, "longitude": 77.23441},
    "site_4": {"latitude": 28.82286, "longitude": 77.10197},
    "site_5": {"latitude": 28.53077, "longitude": 77.27123},
    "site_6": {"latitude": 28.72954, "longitude": 77.09601},
    "site_7": {"latitude": 28.71052, "longitude": 77.24951},
}

# --- Helper Functions and Classes ---

def add_time_signals(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df[["year", "month", "day", "hour"]], errors="coerce")
    df["hour_sin"] = np.sin(2 * math.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * math.pi * df["hour"] / 24)
    df["dayofweek"] = df["timestamp"].dt.dayofweek
    df["dow_sin"] = np.sin(2 * math.pi * df["dayofweek"] / 7)
    df["dow_cos"] = np.cos(2 * math.pi * df["dayofweek"] / 7)
    return df


def add_rolling_features(df: pd.DataFrame, columns: list[str], windows: list[int]) -> pd.DataFrame:
    df = df.copy()
    for col in columns:
        if col not in df.columns:
            continue
        for window in windows:
            feature_name = f"{col}_roll_mean_{window}"
            df[feature_name] = df.groupby("site_id")[col].transform(
                lambda s: s.shift(1).rolling(window, min_periods=1).mean()
            )
    return df


def build_feature_matrix(df: pd.DataFrame, add_site_one_hot: bool = True):
    base = df.copy()
    base = add_time_signals(base)
    if add_site_one_hot:
        site_dummies = pd.get_dummies(base["site_id"], prefix="site")
        # Ensure all known sites have a column
        for site_id in SITE_IDS:
            col_name = f"site_{site_id}"
            if col_name not in site_dummies.columns:
                site_dummies[col_name] = 0
        base = pd.concat([base, site_dummies], axis=1)
    feature_cols = [
        col for col in base.columns
        if col not in TARGET_COLUMNS + ["timestamp", "site_id"]
    ]
    return base, feature_cols


def generate_sequences(df: pd.DataFrame, feature_cols: list[str], window: int) -> list[dict]:
    sequences = []
    grouped = df.groupby("site_id") if "site_id" in df.columns else [(None, df)]
    for site_id, site_df in grouped:
        site_df = site_df.reset_index(drop=True)
        feat_vals = site_df[feature_cols].to_numpy(dtype=np.float32, na_value=np.nan)

        if len(site_df) >= window:
            idx = len(site_df)
            x_window = feat_vals[idx - window: idx]

            # Guard against non-finite values
            if not np.isfinite(x_window).all():
                continue

            sequences.append({"x": x_window})
    return sequences


def inverse_transform_predictions(preds: np.ndarray, scaler: StandardScaler) -> np.ndarray:
    flat = preds.reshape(-1, preds.shape[-1])
    restored = scaler.inverse_transform(flat)
    return restored.reshape(preds.shape)


class SequenceDataset(Dataset):
    def __init__(self, sequences: list[dict]):
        self.features = torch.tensor(
            np.stack([s["x"] for s in sequences]), dtype=torch.float32
        )

    def __len__(self):
        return self.features.shape[0]

    def __getitem__(self, idx: int):
        return self.features[idx]


class TemporalLSTM(nn.Module):
    def __init__(self, input_size, hidden_size, horizon, target_dim, num_layers=2, dropout=0.2):
        super().__init__()
        self.horizon, self.target_dim = horizon, target_dim
        self.lstm = nn.LSTM(
            input_size,
            hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout,
        )
        self.fc = nn.Linear(hidden_size, horizon * target_dim)

    def forward(self, x):
        output, _ = self.lstm(x)
        preds = self.fc(output[:, -1, :])
        return preds.view(-1, self.horizon, self.target_dim)


# --- FastAPI App ---
app = FastAPI()


# --- Load Models and Scalers ---
models: Dict[str, Any] = {}
for target_col in TARGET_COLUMNS:
    try:
        checkpoint_path = ARTIFACT_DIR / f"lstm_{target_col}_champion.pt"
        checkpoint = torch.load(checkpoint_path, map_location=DEVICE, weights_only=False)

        params = checkpoint["params"]
        feature_cols_from_training = checkpoint["feature_cols"]

        model = TemporalLSTM(
            input_size=len(feature_cols_from_training),
            hidden_size=params["hidden_size"],
            horizon=params["horizon"],
            target_dim=1,
            num_layers=params["num_layers"],
            dropout=params["dropout"],
        ).to(DEVICE)
        model.load_state_dict(checkpoint["model_state"])
        model.eval()

        models[target_col] = {
            "model": model,
            "params": params,
            "feature_cols": feature_cols_from_training,
            "feature_scaler": checkpoint["feature_scaler"],
            "target_scaler": checkpoint["target_scaler"],
        }
        print(f"[INFO] Loaded LSTM model for {target_col}")
    except FileNotFoundError:
        print(f"[ERROR] Model file not found for {target_col} at {checkpoint_path}")
        models[target_col] = None


# --- Pydantic Models for API ---

class DataPoint(BaseModel):
    year: float
    month: float
    day: float
    hour: float
    O3_forecast: float
    NO2_forecast: float
    T_forecast: float
    q_forecast: float
    u_forecast: float
    v_forecast: float
    w_forecast: float
    NO2_satellite: Optional[float] = None
    HCHO_satellite: Optional[float] = None
    ratio_satellite: Optional[float] = None

    # OPTIONAL past surface observations – if provided,
    # they will be used to build rolling target features.
    O3_target: Optional[float] = None
    NO2_target: Optional[float] = None


class InputData(BaseModel):
    site_id: str
    data: List[DataPoint]


class TimeseriesInputData(InputData):
    historical_points: int = 72


# --- Core Prediction Logic ---

def get_forecast(df: pd.DataFrame, site_id: str) -> Dict[str, Any]:
    # Attach site_id to every row
    df = df.copy()
    df["site_id"] = site_id

    # Use only numeric columns for rolling features (skip strings like site_id, etc.)
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    base_df = add_rolling_features(df, numeric_cols, [6, 24])

    # Add time features + one-hot for sites
    feature_df, _ = build_feature_matrix(base_df, add_site_one_hot=True)

    predictions: Dict[str, Any] = {}

    for target_col in TARGET_COLUMNS:
        # Skip if model didn't load
        if models.get(target_col) is None:
            predictions[target_col] = f"Model not loaded for {target_col}"
            continue

        model_info = models[target_col]
        model = model_info["model"]
        params = model_info["params"]
        feature_cols = model_info["feature_cols"]
        feature_scaler = model_info["feature_scaler"]
        target_scaler = model_info["target_scaler"]

        # Ensure all required feature columns exist
        for col in feature_cols:
            if col not in feature_df.columns:
                feature_df[col] = 0.0

        # Keep only model features, in the right order
        feature_df_model = feature_df[feature_cols].copy()

        # Clean NaN/inf
        feature_df_model = feature_df_model.replace([np.inf, -np.inf], np.nan)
        feature_df_model = feature_df_model.fillna(0.0)

        # Build sequences
        sequences = generate_sequences(feature_df_model, feature_cols, params["window"])

        if not sequences:
            predictions[target_col] = "Not enough data to generate sequences."
            continue

        # Scale features using the training scaler
        try:
            scaled_sequences = [
                {"x": feature_scaler.transform(seq["x"])}
                for seq in sequences
            ]
        except Exception as e:
            predictions[target_col] = f"Feature scaling failed: {str(e)}"
            continue

        # Convert to tensor and run model
        dataset = SequenceDataset(scaled_sequences)
        input_tensor = dataset[0].unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            pred_scaled = model(input_tensor).cpu().numpy()

        # Inverse transform to original target scale
        pred_restored = inverse_transform_predictions(pred_scaled, target_scaler)
        predictions[target_col] = pred_restored[0, :, 0].tolist()

    return predictions


def format_timeseries_response(df: pd.DataFrame, predictions: dict, historical_points: int) -> Dict[str, Any]:
    # Take last N points for plotting
    historical = df.tail(historical_points).copy()
    if historical.empty:
        return {"error": "Not enough historical data for timeseries plot."}

    # Build timestamps from year-month-day-hour
    ts = pd.to_datetime(historical[["year", "month", "day", "hour"]], errors="coerce")

    # Drop rows where timestamp couldn't be parsed
    valid_mask = ts.notna()
    ts = ts[valid_mask]
    historical = historical.loc[valid_mask]

    if historical.empty:
        return {"error": "Historical timestamps could not be parsed."}

    last_timestamp = ts.iloc[-1]

    # Forecast horizon = length of O3 predictions if available, else NO2, else 0
    o3_pred = predictions.get("O3_target")
    no2_pred = predictions.get("NO2_target")

    if isinstance(o3_pred, list):
        forecast_horizon = len(o3_pred)
    elif isinstance(no2_pred, list):
        forecast_horizon = len(no2_pred)
    else:
        forecast_horizon = 0

    if forecast_horizon > 0:
        forecast_timestamps = pd.date_range(
            start=last_timestamp,
            periods=forecast_horizon + 1,
            freq="H",
        )[1:].strftime("%Y-%m-%dT%H:%M:%S").tolist()
    else:
        forecast_timestamps = []

    response: Dict[str, Any] = {
        "historical_timestamps": ts.dt.strftime("%Y-%m-%dT%H:%M:%S").tolist(),
        "forecast_timestamps": forecast_timestamps,
        "forecast_O3_target": o3_pred if isinstance(o3_pred, list) else [],
        "forecast_NO2_target": no2_pred if isinstance(no2_pred, list) else [],
    }

    # Optionally include historical targets if they exist (useful for evaluation/backtest)
    if "O3_target" in historical.columns:
        response["historical_O3_target"] = historical["O3_target"].tolist()
    else:
        response["historical_O3_target"] = []

    if "NO2_target" in historical.columns:
        response["historical_NO2_target"] = historical["NO2_target"].tolist()
    else:
        response["historical_NO2_target"] = []

    return response


# --- API Endpoints ---

@app.get("/sites/")
async def get_sites():
    """Returns a list of available sites and their coordinates."""
    return SITES_COORDINATES


@app.post("/predict/")
async def predict(input_data: InputData):
    """Accepts JSON data and returns a simple forecast."""
    df = pd.DataFrame([row.dict() for row in input_data.data])
    return await run_in_threadpool(get_forecast, df=df, site_id=input_data.site_id)


@app.post("/predict-from-csv/")
async def predict_from_csv(site_id: str = Form(...), file: UploadFile = File(...)):
    """Accepts a CSV file and returns a simple forecast."""
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    return await run_in_threadpool(get_forecast, df=df, site_id=site_id)


@app.post("/forecast/timeseries/")
async def forecast_timeseries(input_data: TimeseriesInputData):
    """Accepts JSON data and returns data formatted for a time series plot."""
    df = pd.DataFrame([row.dict() for row in input_data.data])
    predictions = await run_in_threadpool(get_forecast, df=df.copy(), site_id=input_data.site_id)
    return format_timeseries_response(df, predictions, input_data.historical_points)


@app.post("/forecast/timeseries-from-csv/")
async def forecast_timeseries_from_csv(
    site_id: str = Form(...),
    file: UploadFile = File(...),
    historical_points: int = Form(72),
):
    """Accepts a CSV file and returns data formatted for a time series plot."""
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    predictions = await run_in_threadpool(get_forecast, df=df.copy(), site_id=site_id)
    return format_timeseries_response(df, predictions, historical_points)


@app.websocket("/ws/predict/")
async def websocket_predict(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            input_data_dict = json.loads(data)
            df = pd.DataFrame(input_data_dict["data"])
            predictions = await run_in_threadpool(
                get_forecast, df=df, site_id=input_data_dict["site_id"]
            )
            await websocket.send_text(json.dumps(predictions))
    except WebSocketDisconnect:
        print("Client disconnected from WebSocket.")


@app.get("/model-features/")
def model_features():
    out = {}
    for target_col, model_info in models.items():
        if model_info is None:
            out[target_col] = "Model not loaded"
        else:
            out[target_col] = model_info["feature_cols"]
    return out


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
