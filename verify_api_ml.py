
import urllib.request
import json

def test_forecast():
    # 1. Get Sample Data (from Web App as it works)
    print("Fetching sample data via Web App...")
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

    # 2. Call ML Service Directly
    print("Calling ML Service endpoints...")
    
    # Try /plots/timeseries/json/
    payload = {
        'site_id': 'site_1',
        'data': sample_data
    }
    
    req = urllib.request.Request(
        'http://localhost:8000/plots/timeseries/json/', 
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            print("✅ Call to /plots/timeseries/json/ SUCCEEDED")
            
            # Inspect structure
            print("\nKeys in response:", result.keys())
            if "dates" in result:
                print(f"Dates count: {len(result['dates'])}")
            if "historical" in result:
                print("Historical keys:", result["historical"].keys())
            if "forecast" in result:
                print("Forecast keys:", result["forecast"].keys())
                
    except Exception as e:
        print(f"❌ Call to /plots/timeseries/json/ FAILED: {e}")
        try:
           print(e.read().decode())
        except:
           pass

if __name__ == "__main__":
    test_forecast()
