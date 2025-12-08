
import urllib.request
import json

# Fetch sample and save 10 rows
req = urllib.request.Request(
    'http://localhost:3000/api/aqi/sample-data', 
    data=json.dumps({'site_id': '1.0'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req) as response:
    sample_res = json.loads(response.read().decode())

payload = {
    'site_id': 'site_1',
    'data': sample_res['data'][:10]
}

with open('payload.json', 'w') as f:
    json.dump(payload, f)
print("Created payload.json")
