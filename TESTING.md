# Testing Guide for Chart.js MCP Server

This project includes comprehensive testing infrastructure using Node.js's native test runner and Chart.js libraries to validate chart generation functionality.

## Prerequisites

- Node.js 18+ (for native test runner support)
- All project dependencies installed (`npm install`)
- Built project (`npm run build`)

## Running Tests

### Main Test Suite (Node.js Native)

The primary test suite uses Node.js's built-in test runner and directly tests the chart generation logic:

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

**Key Features:**
- ✅ **No external dependencies** - Uses only Node.js built-in test runner
- ✅ **Direct function testing** - Tests chart generation logic directly
- ✅ **Comprehensive coverage** - All 8 chart types + error handling
- ✅ **Performance testing** - Includes timing and large dataset tests
- ✅ **File validation** - Verifies PNG output format and content
- ✅ **Fast execution** - Runs in ~800ms for 25 tests

### Test Categories

1. **Valid Chart Generation**: Tests all supported chart types (bar, line, pie, doughnut, scatter, bubble, radar, polarArea)
2. **Error Handling**: Invalid configurations, missing data, empty datasets
3. **Chart Type Specific**: Format-specific validations (scatter x/y, bubble r values)
4. **Advanced Features**: Complex options, multiple datasets, custom properties
5. **File Operations**: PNG format validation, buffer verification
6. **Integration**: Tests with example configurations from `examples/` folder
7. **Performance**: Timing tests and large dataset handling

### Integration Tests (Optional)

For end-to-end testing of the MCP server itself:

```bash
# Test using MCP CLI tools (requires build)
npm run test:integration

# Test individual chart types
npm run test:single

# List available MCP tools
npm run test:tools

# Run both unit and integration tests
npm run test:all
```

## Chart Types Tested

All Chart.js v4 supported types:

| Chart Type | Data Format | Special Notes |
|------------|-------------|---------------|
| `bar` | `[number, ...]` | Basic bar charts |
| `line` | `[number, ...]` | Line charts with tension |
| `pie` | `[number, ...]` | Circular pie charts |
| `doughnut` | `[number, ...]` | Donut-style charts |
| `scatter` | `[{x, y}, ...]` | X/Y coordinate pairs |
| `bubble` | `[{x, y, r}, ...]` | X/Y coordinates + radius |
| `radar` | `[number, ...]` | Multi-axis radar charts |
| `polarArea` | `[number, ...]` | Polar area charts |

## Test Structure

### Core Test Function

The test suite extracts and directly tests the chart generation logic:

```javascript
const result = await generateChart(chartConfig);

// Success case
assert(result.success, 'Chart generation should succeed');
assert(result.buffer, 'Should return PNG buffer');
assert(result.outputPath, 'Should specify output file');

// Error case
assert(!result.success, 'Should fail for invalid config');
assert(result.error, 'Should have error message');
```

### Example Test Configuration

```javascript
const barChartConfig = {
  type: 'bar',
  data: {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [{
      label: 'Sample Data',
      data: [12, 19, 3],
      backgroundColor: ['rgba(255, 99, 132, 0.2)', ...]
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Test Chart' }
    }
  }
};
```

## Creating Custom Tests

To add new test cases:

1. **Add test configuration** to `testConfigs` object in `test/chart-server.test.js`
2. **Create test case** using Node.js test syntax:

```javascript
test('should handle custom chart type', async () => {
  await cleanupOutputFile();
  
  const customConfig = { /* your config */ };
  const result = await generateChart(customConfig);
  
  assert(result.success, 'Custom chart should succeed');
  
  const fileExists = await checkOutputFile();
  assert(fileExists, 'Output file should exist');
});
```

## Error Testing Patterns

### Invalid Configuration
```javascript
test('should handle invalid config', async () => {
  const invalidConfig = { type: 'invalid', data: null };
  const result = await generateChart(invalidConfig);
  
  assert(!result.success, 'Should fail');
  assert(result.error.includes('datasets'), 'Should mention specific error');
});
```

### Malformed Data
```javascript
test('should handle malformed data', async () => {
  const malformedConfig = {
    type: 'scatter',
    data: { datasets: [{ data: [1, 2, 3] }] } // Should be {x,y} objects
  };
  
  const result = await generateChart(malformedConfig);
  // Chart.js may handle gracefully or throw error
  assert(typeof result.success === 'boolean');
});
```

## Performance Benchmarks

The test suite includes performance validation:

- **Standard charts**: Should complete within 5 seconds
- **Large datasets** (1000+ points): Should complete within 10 seconds
- **Memory usage**: Validates no memory leaks during generation

## File Output Validation

Tests verify:
- PNG file creation and valid format
- Buffer content matches file content
- Proper PNG signature bytes (89 50 4E 47)
- Non-zero file size

## Troubleshooting

### Common Issues

1. **Canvas/Node-canvas errors**: Ensure native dependencies are installed
2. **Test timeouts**: Large datasets may take longer on slower systems
3. **File permission errors**: Ensure write access to project directory
4. **Missing examples**: Integration tests skip missing example files gracefully

### Debug Tips

```bash
# Check if Chart.js can generate basic charts
node -e "
const { Chart, registerables } = require('chart.js');
const { createCanvas } = require('canvas');
Chart.register(...registerables);
console.log('Chart.js working:', !!Chart);
"

# Test specific chart type
npm run test:single bar examples/bar-chart.json
```

## Continuous Integration

For CI/CD environments:

```yaml
- name: Run Tests
  run: |
    npm ci
    npm run build
    npm test
    npm run test:integration
```

The native Node.js tests are designed to be fast and reliable in CI environments without requiring external services or complex setup. 