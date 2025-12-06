#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/aqi/sites"

# Check if Key provided
if [ -z "$1" ]; then
  echo "Usage: ./test_api_key.sh <YOUR_API_KEY>"
  echo "Example: ./test_api_key.sh sk_live_12345..."
  echo "You can generate a key at http://localhost:3000/dashboard/api-keys"
  exit 1
fi

API_KEY="$1"

echo "Testing Authenticated API Call with Key: $API_KEY"
echo "Target: $API_URL"
echo "---------------------------------------------------"

# Make Request
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$API_URL" \
  -H "Authorization: Bearer $API_KEY")

# Extract Body and Status
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')
BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS:.*//')

echo "Response Status: $HTTP_STATUS"
echo "Response Body: $BODY"

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "---------------------------------------------------"
  echo "✅ Success! API Call authorized and executed."
  echo "Please check your Dashboard to see if 1 credit was deducted."
elif [ "$HTTP_STATUS" -eq 402 ]; then
  echo "---------------------------------------------------"
  echo "❌ Payment Required. Insufficient Credits."
  echo "Please top up your credits on the Dashboard."
elif [ "$HTTP_STATUS" -eq 401 ]; then
  echo "---------------------------------------------------"
  echo "❌ Unauthorized. Invalid API Key."
else
  echo "---------------------------------------------------"
  echo "⚠️ Unexpected Error."
fi
