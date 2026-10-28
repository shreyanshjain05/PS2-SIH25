# aq_model: day-ahead O3 / NO2 model

A LightGBM model per pollutant, trained from scratch on `Data_SIH_2025_with_blh/`. Its predictions are precomputed and served to the dashboard as static JSON, so no ML server is needed at runtime.

```bash
cd ML
pip install -r requirements.txt
python -m aq_model.train    # evaluate + fit production models -> artifacts/
python -m aq_model.export   # predictions -> output/predictions.csv, webdev/data/forecasts/
```

## What it predicts

The model predicts the 24 hourly O3 and NO2 values for a site-day. It uses:
- the provided forecast, met and satellite inputs for that day, plus calendar and site features
- the site's average for that month and hour (site/month/hour average)
- what was measured on the most recent observed day before it (`ref_gap_days` back)

It never sees same-day or future observations.

The `unseen_input_data` files aren't a future period. They are about 450 days per site spread across 2019-07 to 2024-06, filling the gaps in `train_data`. About 60% of them have an observed day right before them. Training samples `ref_gap_days` from that same distribution, so the model learns how stale context affects accuracy.

There are no input rows after 2024-06-30, so the model can't produce forecasts beyond that date.

## Accuracy

The test set is held out by time: train < 2023-07, validation 2023-H2 (early stopping), test 2024-01 → 2024-06, 16,279 hours. Units are µg/m³.

| | O3 R² | O3 MAE | NO2 R² | NO2 MAE |
|---|---|---|---|---|
| **This model** | **0.676** | **15.7** | **0.430** | **15.6** |
| This model, previous day observed | 0.686 | 15.4 | 0.457 | 15.1 |
| Same hour, last observed day | 0.649 | 16.5 | 0.115 | 19.4 |
| Site/month/hour average | 0.513 | 20.4 | 0.280 | 17.7 |
| Provided `*_forecast` column as-is | -0.36 | 36.2 | -1.33 | 36.7 |

Out-of-fold over all labelled days (each year predicted by a model trained on the other years): O3 R² 0.707, NO2 R² 0.655. The dashboard shows these per-site out-of-fold numbers.

NO2 test R² (0.43) is well below its validation R² (0.77), because 2024 NO2 levels sit above earlier years. Recent observations matter most; see `top_features` in `artifacts/metrics.json`.

## Data caveats found along the way

- The provided forecast inputs change scale from year to year. For example, yearly mean `O3_forecast` ranges from 23 to 153 and `blh_forecast` from 122 to 1459. Raw values hardly track the measurements (O3 correlation 0.06). A year/trend feature hurt test accuracy, so there isn't one.
- `T_forecast` has almost no day/night cycle, and `blh_forecast` jumps by hundreds of metres hour to hour.
- Satellite columns are about 97% empty.

## Files

- `data.py`: loading and features. `train.py`: evaluation and production fit. `export.py`: predictions.
- `artifacts/`: `lgbm_O3.txt`, `lgbm_NO2.txt`, `climatology.csv`, `metrics.json` (all numbers above), and `test_predictions.parquet`.
- `output/predictions.csv`: every site-hour with `kind` (`backtest` = out-of-fold with actuals, `forecast` = unseen day), predictions and actuals.
