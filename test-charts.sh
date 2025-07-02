#!/bin/bash

# Chart.js MCP Server Test Script
# This script tests the generateChart tool with various chart configurations

echo "🧪 Testing Chart.js MCP Server with CLI tools..."
echo "================================================="

# Check if the server is built
if [ ! -f "dist/index.js" ]; then
    echo "❌ Server not built. Running npm run build..."
    npm run build
fi

echo ""
echo "📋 Listing available tools..."
echo "------------------------------"
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/list

echo ""
echo "🔧 Testing chart generation with various configurations..."
echo "--------------------------------------------------------"

# Test 1: Simple Bar Chart
echo ""
echo "📊 Test 1: Simple Bar Chart"
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call \
  --tool-name generateChart \
  --tool-arg 'chartConfig={"type":"bar","data":{"labels":["Red","Blue","Yellow","Green","Purple","Orange"],"datasets":[{"label":"# of Votes","data":[12,19,3,5,2,3],"backgroundColor":["rgba(255,99,132,0.8)","rgba(54,162,235,0.8)","rgba(255,205,86,0.8)","rgba(75,192,192,0.8)","rgba(153,102,255,0.8)","rgba(255,159,64,0.8)"]}]}}'

# Test 2: Line Chart from examples
echo ""
echo "📈 Test 2: Line Chart with Options"
LINE_CONFIG=$(cat examples/line-chart.json | jq -c .)
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call \
  --tool-name generateChart \
  --tool-arg "chartConfig=${LINE_CONFIG}"

# Test 3: Pie Chart
echo ""
echo "🥧 Test 3: Pie Chart"
PIE_CONFIG=$(cat examples/pie-chart.json | jq -c .)
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call \
  --tool-name generateChart \
  --tool-arg "chartConfig=${PIE_CONFIG}"

# Test 4: Doughnut Chart
echo ""
echo "🍩 Test 4: Doughnut Chart"
DOUGHNUT_CONFIG=$(cat examples/doughnut-chart.json | jq -c .)
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call \
  --tool-name generateChart \
  --tool-arg "chartConfig=${DOUGHNUT_CONFIG}"

# Test 5: Radar Chart
echo ""
echo "🕷️ Test 5: Radar Chart"
RADAR_CONFIG=$(cat examples/radar-chart.json | jq -c .)
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call \
  --tool-name generateChart \
  --tool-arg "chartConfig=${RADAR_CONFIG}"

# Test 6: Polar Area Chart
echo ""
echo "🎯 Test 6: Polar Area Chart"
POLAR_CONFIG=$(cat examples/polar-area-chart.json | jq -c .)
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call \
  --tool-name generateChart \
  --tool-arg "chartConfig=${POLAR_CONFIG}"

# Test 7: Scatter Chart
echo ""
echo "📍 Test 7: Scatter Chart"
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call \
  --tool-name generateChart \
  --tool-arg 'chartConfig={"type":"scatter","data":{"datasets":[{"label":"Scatter Dataset","data":[{"x":-10,"y":0},{"x":0,"y":10},{"x":10,"y":5},{"x":0.5,"y":5.5}],"backgroundColor":"rgb(255, 99, 132)"}]},"options":{"scales":{"x":{"type":"linear","position":"bottom"}}}}'

# Test 8: Bubble Chart
echo ""
echo "🫧 Test 8: Bubble Chart"
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call \
  --tool-name generateChart \
  --tool-arg 'chartConfig={"type":"bubble","data":{"datasets":[{"label":"First Dataset","data":[{"x":20,"y":30,"r":15},{"x":40,"y":10,"r":10}],"backgroundColor":"rgb(255, 99, 132)"}]}}'

# Test 9: Error Test - Invalid Configuration
echo ""
echo "❌ Test 9: Error Handling - Invalid Configuration"
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call \
  --tool-name generateChart \
  --tool-arg 'chartConfig={"type":"invalidType","data":{}}'

# Test 10: Error Test - Missing Data
echo ""
echo "❌ Test 10: Error Handling - Missing Required Data"
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call \
  --tool-name generateChart \
  --tool-arg 'chartConfig={"type":"bar"}'

echo ""
echo "✅ All tests completed!"
echo "📁 Check output.png for the last generated chart"
echo "=================================================" 