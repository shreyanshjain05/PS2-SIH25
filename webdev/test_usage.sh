#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/business/credits/consume"
USER_ID="pUdbk0FSgSJ7k7fE12lmuRT9pncm0c3n" # Replace with your actual User ID from the database or logs
COUNT=10
RESOURCE="/test/resource"

echo "Simulating API Usage for User: $USER_ID"
echo "Consuming $COUNT credits..."

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$USER_ID"'",
    "count": '"$COUNT"',
    "resource": "'"$RESOURCE"'"
  }'

echo -e "\n\nDone. Check the Usage History in the Dashboard."
