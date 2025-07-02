# Chart.js MCP Server Examples

This directory contains example chart configurations and their visual outputs for the Chart.js MCP Server.

## Configuration Files

Each JSON file contains a complete Chart.js v4 configuration:

- **`bar-chart.json`** - Bar chart with colorful styling and titles
- **`line-chart.json`** - Multi-dataset line chart with weather data
- **`pie-chart.json`** - Pie chart with category data
- **`doughnut-chart.json`** - Doughnut chart variation of pie chart
- **`radar-chart.json`** - Multi-axis radar chart for skill assessment
- **`polar-area-chart.json`** - Polar area chart with radial data

## Generated Chart Images

When you run `npm test`, the following PNG files are generated using the JSON configurations:

| Chart Type | File | Configuration Source |
|------------|------|---------------------|
| Bar Chart | `bar.png` | `bar-chart.json` |
| Line Chart | `line.png` | `line-chart.json` |  
| Pie Chart | `pie.png` | `pie-chart.json` |
| Doughnut Chart | `doughnut.png` | `doughnut-chart.json` |
| Radar Chart | `radar.png` | `radar-chart.json` |
| Polar Area Chart | `polarArea.png` | `polar-area-chart.json` |
| Scatter Plot | `scatter.png` | *Generated from test fallback* |
| Bubble Chart | `bubble.png` | *Generated from test fallback* |

## Usage

### Testing with Example Configurations

```bash
# Generate all chart images
npm test

# Test specific chart type using CLI
npm run test:single bar examples/bar-chart.json
```

### Using in MCP Client

```bash
# Generate a chart using example configuration
npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/call \
  --tool-name generateChart \
  --tool-arg "chartConfig=$(cat examples/bar-chart.json | jq -c .)"
```

### Customizing Configurations

Each JSON file can be modified to test different:
- **Data values and labels**
- **Color schemes and styling** 
- **Chart options and plugins**
- **Responsive behavior**
- **Animations and interactions**

## Chart Type Support

All Chart.js v4 chart types are supported:

- ✅ **Bar Charts** - Vertical and horizontal bars
- ✅ **Line Charts** - With tension, fill, and multiple datasets
- ✅ **Pie Charts** - Circular segments
- ✅ **Doughnut Charts** - Hollow center pie charts
- ✅ **Scatter Plots** - X/Y coordinate data points
- ✅ **Bubble Charts** - X/Y coordinates with radius
- ✅ **Radar Charts** - Multi-axis radial charts
- ✅ **Polar Area Charts** - Radial bar charts

## Visual References

The generated PNG files serve as visual references for:
- 🎨 **Design validation** - Ensuring charts render correctly
- 📊 **Configuration testing** - Verifying JSON configurations work
- 🔍 **Debugging** - Visual inspection of chart outputs
- 📝 **Documentation** - Examples for developers and users

## Output Specifications

All generated charts are:
- **Resolution**: 800x600 pixels
- **Format**: PNG with transparency support
- **Quality**: High-resolution for documentation use
- **Styling**: Uses Chart.js v4 default themes with custom colors 