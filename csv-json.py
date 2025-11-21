import pandas as pd
import json

# ---- CONFIG ----
csv_path = "Data_SIH_2025 2/site_1_train_data.csv"     # your CSV path
site_id = "site_1"                                      # change as needed
output_json_path = "test_72.json"                      # output JSON

# ---- LOAD CSV ----
df = pd.read_csv(csv_path)

# ---- TAKE LAST 72 ROWS FOR TESTING ----
df_72 = df.tail(72).copy()

# ---- KEEP TARGET COLUMNS IF AVAILABLE ----
# DO NOT DROP THEM — they are now OPTIONAL but USEFUL
# If any column missing, it's fine — model handles gracefully.

# ---- CONVERT DATA TO JSON ----
json_data = {
    "site_id": site_id,
    "data": df_72.to_dict(orient="records")   # full rows including O3_target & NO2_target if present
}

# ---- PRINT TO CONSOLE ----
print(json.dumps(json_data, indent=4))

# ---- SAVE TO JSON FILE ----
with open(output_json_path, "w") as f:
    json.dump(json_data, f, indent=4)

print(f"Saved JSON to {output_json_path}")
