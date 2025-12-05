"""
Feature Engineering Module for Air Quality Prediction
Includes temporal, festival, seasonal, and calendar features.
"""

import pandas as pd
import numpy as np
from datetime import datetime
import requests
from functools import lru_cache

# ============================================================
# INDIAN FESTIVALS DATABASE (2019-2024)
# Major events known to affect air quality
# ============================================================

INDIAN_FESTIVALS = {
    # 2019
    "2019-10-27": ("diwali", 3),
    "2019-10-26": ("diwali_eve", 1),
    "2019-10-08": ("dussehra", 1),
    "2019-12-31": ("new_year_eve", 1),
    
    # 2020
    "2020-11-14": ("diwali", 3),
    "2020-11-13": ("diwali_eve", 1),
    "2020-10-25": ("dussehra", 1),
    "2020-03-10": ("holi", 1),
    "2020-01-13": ("lohri", 1),
    "2020-12-31": ("new_year_eve", 1),
    
    # 2021
    "2021-11-04": ("diwali", 3),
    "2021-11-03": ("diwali_eve", 1),
    "2021-10-15": ("dussehra", 1),
    "2021-03-29": ("holi", 1),
    "2021-01-13": ("lohri", 1),
    "2021-12-31": ("new_year_eve", 1),
    
    # 2022
    "2022-10-24": ("diwali", 3),
    "2022-10-23": ("diwali_eve", 1),
    "2022-10-05": ("dussehra", 1),
    "2022-03-18": ("holi", 1),
    "2022-01-13": ("lohri", 1),
    "2022-12-31": ("new_year_eve", 1),
    
    # 2023
    "2023-11-12": ("diwali", 3),
    "2023-11-11": ("diwali_eve", 1),
    "2023-10-24": ("dussehra", 1),
    "2023-03-08": ("holi", 1),
    "2023-01-13": ("lohri", 1),
    "2023-12-31": ("new_year_eve", 1),
    
    # 2024
    "2024-11-01": ("diwali", 3),
    "2024-10-31": ("diwali_eve", 1),
    "2024-10-12": ("dussehra", 1),
    "2024-03-25": ("holi", 1),
    "2024-01-13": ("lohri", 1),
}

# Festival impact weights (based on pollution contribution)
FESTIVAL_WEIGHTS = {
    'diwali': 1.0,
    'diwali_eve': 0.8,
    'holi': 0.5,
    'dussehra': 0.4,
    'lohri': 0.3,
    'new_year_eve': 0.3,
    'new_year': 0.2,
    'independence_day': 0.1,
    'republic_day': 0.1,
}


def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add comprehensive temporal features for pollution prediction.
    """
    df = df.copy()
    
    if 'datetime' not in df.columns:
        df['datetime'] = pd.to_datetime(df[['year', 'month', 'day', 'hour']].astype(int))
    
    # Basic time features
    df['hour'] = df['datetime'].dt.hour
    df['day_of_week'] = df['datetime'].dt.dayofweek
    df['day_of_month'] = df['datetime'].dt.day
    df['month'] = df['datetime'].dt.month
    df['day_of_year'] = df['datetime'].dt.dayofyear
    df['week_of_year'] = df['datetime'].dt.isocalendar().week.astype(int)
    
    # Cyclical encoding
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    df['dow_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['dow_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    df['doy_sin'] = np.sin(2 * np.pi * df['day_of_year'] / 365)
    df['doy_cos'] = np.cos(2 * np.pi * df['day_of_year'] / 365)
    
    # Weekend / Weekday
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    
    # Peak traffic hours
    df['is_morning_rush'] = ((df['hour'] >= 7) & (df['hour'] <= 10)).astype(int)
    df['is_evening_rush'] = ((df['hour'] >= 17) & (df['hour'] <= 21)).astype(int)
    df['is_rush_hour'] = (df['is_morning_rush'] | df['is_evening_rush']).astype(int)
    
    # Night hours
    df['is_night'] = ((df['hour'] >= 23) | (df['hour'] <= 5)).astype(int)
    
    # Business hours
    df['is_business_hours'] = (
        (df['day_of_week'] < 5) &
        (df['hour'] >= 9) &
        (df['hour'] <= 18)
    ).astype(int)
    
    return df


def add_festival_features(df: pd.DataFrame, festivals_dict: dict = None) -> pd.DataFrame:
    """
    Add festival/event features that impact air quality.
    """
    df = df.copy()
    
    if festivals_dict is None:
        festivals_dict = INDIAN_FESTIVALS
    
    if 'datetime' not in df.columns:
        df['datetime'] = pd.to_datetime(df[['year', 'month', 'day', 'hour']].astype(int))
    
    df['date_str'] = df['datetime'].dt.strftime('%Y-%m-%d')
    
    # Initialize columns
    df['is_festival_day'] = 0
    df['festival_impact'] = 0.0
    df['is_diwali_period'] = 0
    
    for date_str, (festival_name, impact_days) in festivals_dict.items():
        festival_date = pd.to_datetime(date_str)
        weight = FESTIVAL_WEIGHTS.get(festival_name, 0.2)
        
        # Mark the festival day
        mask = df['date_str'] == date_str
        df.loc[mask, 'is_festival_day'] = 1
        df.loc[mask, 'festival_impact'] = np.maximum(df.loc[mask, 'festival_impact'], weight)
        
        # Mark impact days after festival
        for d in range(1, impact_days + 1):
            impact_date = (festival_date + pd.Timedelta(days=d)).strftime('%Y-%m-%d')
            mask = df['date_str'] == impact_date
            df.loc[mask, 'is_festival_day'] = 1
            df.loc[mask, 'festival_impact'] = np.maximum(
                df.loc[mask, 'festival_impact'],
                weight * (1 - d / (impact_days + 1))
            )
        
        # Special: Diwali period (1 week before to 3 days after)
        if 'diwali' in festival_name and festival_name != 'diwali_eve':
            for d in range(-7, 4):
                period_date = (festival_date + pd.Timedelta(days=d)).strftime('%Y-%m-%d')
                mask = df['date_str'] == period_date
                df.loc[mask, 'is_diwali_period'] = 1
    
    df = df.drop(columns=['date_str'])
    return df


def add_seasonal_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add Indian seasonal features relevant to pollution.
    """
    df = df.copy()
    
    if 'datetime' not in df.columns:
        df['datetime'] = pd.to_datetime(df[['year', 'month', 'day', 'hour']].astype(int))
    
    month = df['datetime'].dt.month
    
    # Season flags
    df['is_winter'] = ((month >= 11) | (month <= 2)).astype(int)
    df['is_summer'] = ((month >= 3) & (month <= 5)).astype(int)
    df['is_monsoon'] = ((month >= 6) & (month <= 9)).astype(int)
    df['is_post_monsoon'] = (month == 10).astype(int)
    
    # Crop burning season (Oct-Nov in North India)
    df['is_crop_burning_season'] = ((month >= 10) & (month <= 11)).astype(int)
    
    # Temperature inversion likely (cold nights + calm winds)
    df['is_inversion_likely'] = (
        df['is_winter'] &
        ((df['datetime'].dt.hour >= 20) | (df['datetime'].dt.hour <= 8))
    ).astype(int)
    
    return df


def fetch_calendarific_holidays(api_key: str, country: str, year: int) -> dict:
    """
    Fetch holidays from Calendarific API.
    """
    url = "https://calendarific.com/api/v2/holidays"
    params = {
        "api_key": api_key,
        "country": country,
        "year": year
    }
    
    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        holidays = {}
        for holiday in data.get("response", {}).get("holidays", []):
            date = holiday["date"]["iso"][:10]
            name = holiday["name"].lower().replace(" ", "_")
            holidays[date] = name
        
        return holidays
    except Exception as e:
        print(f"[WARN] Calendarific API error for {year}: {e}")
        return {}


def add_calendarific_features(
    df: pd.DataFrame,
    api_key: str,
    country: str = "IN"
) -> pd.DataFrame:
    """
    Add holiday features from Calendarific API.
    """
    df = df.copy()
    
    if 'datetime' not in df.columns:
        df['datetime'] = pd.to_datetime(df[['year', 'month', 'day', 'hour']].astype(int))
    
    # Get unique years in the dataset
    years = df['datetime'].dt.year.unique()
    
    # Fetch holidays for each year
    all_holidays = {}
    for year in years:
        print(f"   Fetching holidays for {year}...")
        holidays = fetch_calendarific_holidays(api_key, country, year)
        all_holidays.update(holidays)
        print(f"   Found {len(holidays)} holidays for {year}")
    
    # Add holiday flag
    df['date_str'] = df['datetime'].dt.strftime('%Y-%m-%d')
    df['is_public_holiday'] = df['date_str'].isin(all_holidays.keys()).astype(int)
    df = df.drop(columns=['date_str'])
    
    return df, all_holidays


def create_lag_features(df: pd.DataFrame, targets: list, lags: list) -> pd.DataFrame:
    """Creates lagged features for the target variables."""
    df_lagged = df.copy()
    for target in targets:
        for lag in lags:
            df_lagged[f'{target}_lag_{lag}'] = df_lagged[target].shift(lag)
    return df_lagged


def create_rolling_features(df: pd.DataFrame, targets: list, windows: list = [6, 24]) -> pd.DataFrame:
    """Creates rolling mean features for target variables."""
    df_rolled = df.copy()
    for target in targets:
        for window in windows:
            df_rolled[f'{target}_rolling_mean_{window}'] = df_rolled[target].rolling(window=window, min_periods=1).mean()
            df_rolled[f'{target}_rolling_std_{window}'] = df_rolled[target].rolling(window=window, min_periods=1).std()
    return df_rolled
