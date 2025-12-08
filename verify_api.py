
import urllib.request
import json

def test_forecast():
    # 1. Get Sample Data
    print("Fetching sample data...")
    req = urllib.request.Request(
        'http://localhost:3000/api/aqi/sample-data', 
        data=json.dumps({'site_id': '1.0'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            sample_res = json.loads(response.read().decode())
    except Exception as e:
        print(f"Failed to get sample data: {e}")
        return

    sample_data = sample_res['data']
    print(f"Got {len(sample_data)} sample records")

    # 2. Call Forecast
    print("Calling forecast endpoint...")
    payload = {
        'site_id': 'site_1',
        'data': sample_data,
        'historical_points': 72
    }
    
    req = urllib.request.Request(
        'http://localhost:3000/api/aqi/forecast/timeseries', 
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
    except Exception as e:
        print(f"Forecast failed: {e}")
        # Try to read error body if possible
        return

    # 3. Verify Structure
    keys = result.keys()
    print(f"Response keys: {list(keys)}")
    
    required_keys = [
        'historical_timestamps', 'forecast_timestamps', 
        'historical_O3_target', 'forecast_O3_target'
    ]
    
    missing = [k for k in required_keys if k not in result]
    
    if missing:
        print(f"❌ FAILED: Missing keys: {missing}")
    else:
        print("✅ SUCCESS: structure matches!")
        print(f"Historical points: {len(result['historical_timestamps'])}")
        print(f"Forecast points: {len(result['forecast_timestamps'])}")

if __name__ == "__main__":
    test_forecast()
