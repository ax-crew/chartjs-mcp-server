#!/bin/bash

# Single Chart Test Script
# Usage: ./test-single.sh [chart-type] [config-file]

CHART_TYPE=${1:-"bar"}
CONFIG_FILE=${2:-"examples/bar-chart.json"}

echo "🧪 Testing single chart: $CHART_TYPE"
echo "📁 Using config file: $CONFIG_FILE"
echo "=================================="

# Check if the server is built
if [ ! -f "dist/index.js" ]; then
    echo "❌ Server not built. Running npm run build..."
    npm run build
fi

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    echo "Available examples:"
    ls examples/*.json
    exit 1
fi

echo ""
echo "📋 Listing available tools..."
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/list | jq '.tools[].name'

echo ""
echo "🔧 Generating chart..."
CHART_CONFIG=$(cat "$CONFIG_FILE" | jq -c .)
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call \
  --tool-name generateChart \
  --tool-arg "chartConfig=${CHART_CONFIG}"

echo ""
echo "✅ Test completed!"
echo "📁 Check output.png for the generated chart" 