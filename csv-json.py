import pandas as pd
import json

# ---- CONFIG ----
csv_path = "Data_SIH_2025 2/site_1_train_data.csv"     
site_id = "site_1"             
output_json_path = "test_72.json"  
# ---- LOAD CSV ----
df = pd.read_csv(csv_path)

# ---- TAKE LAST 72 ROWS ONLY ----
# (If CSV has >72 rows, you can also do: df.iloc[:72] to get the first 72)
df_72 = df.tail(72).copy()

# ---- DROP TARGET COLUMNS (if present) ----
target_cols = ["O3_target", "NO2_target"]
df_72 = df_72.drop(columns=[col for col in target_cols if col in df_72.columns], errors="ignore")

# ---- CONVERT TO JSON LIST ----
json_data = {
    "site_id": site_id,
    "data": df_72.to_dict(orient="records")   # convert rows to list of dicts
}

# ---- PRINT TO CONSOLE ----
print(json.dumps(json_data, indent=4))

# ---- SAVE TO FILE (optional) ----
with open(output_json_path, "w") as f:
    json.dump(json_data, f, indent=4)

print(f"Saved JSON to {output_json_path}")
