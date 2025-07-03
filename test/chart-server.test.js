import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { generateChart } from '../dist/chart-generator.js';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const examplesDir = path.join(projectRoot, 'examples');

// Test wrapper that uses the shared chart generation logic and saves to examples
async function generateChartForTest(chartConfig, outputFilename = 'chart.png') {
  // Use the actual source code for chart generation
  const result = await generateChart(chartConfig, false);
  
  if (result.success) {
    // For tests, we save to examples folder for documentation
    const outputPath = path.join(examplesDir, outputFilename);
    await fs.writeFile(outputPath, result.buffer);
    
    return {
      success: true,
      outputPath,
      buffer: result.buffer,
      message: result.message
    };
  } else {
    return result;
  }
}

// Helper function to load example configuration or use fallback
async function loadChartConfig(chartType, fallbackConfig) {
  const exampleFiles = {
    'bar': 'bar-chart.json',
    'line': 'line-chart.json',
    'pie': 'pie-chart.json',
    'doughnut': 'doughnut-chart.json',
    'radar': 'radar-chart.json',
    'polarArea': 'polar-area-chart.json',
    'scatter': 'scatter-chart.json',
    'bubble': 'bubble-chart.json'
  };

  const exampleFile = exampleFiles[chartType];
  if (exampleFile) {
    try {
      const configPath = path.join(examplesDir, exampleFile);
      const configData = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.log(`Could not load ${exampleFile}, using fallback config`);
      return fallbackConfig;
    }
  }
  
  return fallbackConfig;
}

// Fallback configurations for chart types without example files
const fallbackConfigs = {
  scatter: {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Scatter Dataset',
        data: [
          { x: -10, y: 0 },
          { x: 0, y: 10 },
          { x: 10, y: 5 },
          { x: 0.5, y: 5.5 }
        ],
        backgroundColor: 'rgb(255, 99, 132)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Test Scatter Chart'
        }
      }
    }
  },

  bubble: {
    type: 'bubble',
    data: {
      datasets: [{
        label: 'Bubble Dataset',
        data: [
          { x: 20, y: 30, r: 15 },
          { x: 40, y: 10, r: 10 },
          { x: 30, y: 20, r: 20 }
        ],
        backgroundColor: 'rgb(255, 99, 132)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Test Bubble Chart'
        }
      }
    }
  }
};

// Helper function to check if output file exists and has content
async function checkOutputFile(filename) {
  const outputPath = path.join(examplesDir, filename);
  try {
    const stats = await fs.stat(outputPath);
    return stats.size > 0;
  } catch (error) {
    return false;
  }
}

// Helper function to cleanup output file
async function cleanupOutputFile(filename) {
  const outputPath = path.join(examplesDir, filename);
  try {
    await fs.unlink(outputPath);
  } catch (error) {
    // File doesn't exist, ignore
  }
}

describe('Chart.js MCP Server - Core Functionality Tests', () => {
  
  describe('Valid Chart Generation', () => {
    
    const chartTypes = ['bar', 'line', 'pie', 'doughnut', 'scatter', 'bubble', 'radar', 'polarArea'];
    
    chartTypes.forEach((chartType) => {
      test(`should generate ${chartType} chart successfully`, async () => {
        const outputFilename = `${chartType}.png`;
        await cleanupOutputFile(outputFilename);
        
        // Load example config or use fallback
        const config = await loadChartConfig(chartType, fallbackConfigs[chartType]);
        
        const result = await generateChartForTest(config, outputFilename);
        
        // Check that generation was successful
        assert(result.success, `Chart generation should succeed: ${result.message}`);
        assert(result.buffer, 'Should have buffer data');
        assert(result.outputPath, 'Should have output path');
        
        // Check that output file was created and has content
        const fileExists = await checkOutputFile(outputFilename);
        assert(fileExists, 'Output file should exist and have content');
        
        // Verify buffer is a valid PNG (starts with PNG signature)
        assert(result.buffer.length > 8, 'Buffer should have content');
        assert(result.buffer[0] === 0x89, 'Should start with PNG signature');
        assert(result.buffer[1] === 0x50, 'Should have PNG signature');
        assert(result.buffer[2] === 0x4E, 'Should have PNG signature');
        assert(result.buffer[3] === 0x47, 'Should have PNG signature');
        
        console.log(`✅ Generated ${chartType}.png in examples folder`);
      });
    });
  });

  describe('Error Handling', () => {
    
    test('should handle invalid chart type', async () => {
      const outputFilename = 'error-test.png';
      await cleanupOutputFile(outputFilename);
      
      const invalidConfig = {
        type: 'invalidType',
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [{
            label: 'Test',
            data: [1, 2, 3]
          }]
        }
      };
      
      const result = await generateChartForTest(invalidConfig, outputFilename);
      
      // Should get an error response
      assert(!result.success, 'Should fail for invalid chart type');
      assert(result.error, 'Should have error message');
      assert(result.message.includes('Error'), 'Should contain error in message');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });

    test('should handle missing datasets', async () => {
      const outputFilename = 'error-test.png';
      await cleanupOutputFile(outputFilename);
      
      const invalidConfig = {
        type: 'bar',
        data: {
          labels: ['A', 'B', 'C']
          // Missing datasets
        }
      };
      
      const result = await generateChartForTest(invalidConfig, outputFilename);
      
      // Should get an error response
      assert(!result.success, 'Should fail for missing datasets');
      assert(result.error, 'Should have error message');
      assert(result.error.includes('datasets'), 'Should mention datasets in error');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });

    test('should handle empty datasets array', async () => {
      const outputFilename = 'error-test.png';
      await cleanupOutputFile(outputFilename);
      
      const invalidConfig = {
        type: 'bar',
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [] // Empty array
        }
      };
      
      const result = await generateChartForTest(invalidConfig, outputFilename);
      
      // Should get an error response
      assert(!result.success, 'Should fail for empty datasets');
      assert(result.error, 'Should have error message');
      assert(result.error.includes('at least one dataset'), 'Should mention dataset requirement');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });

    test('should handle null data', async () => {
      const outputFilename = 'error-test.png';
      await cleanupOutputFile(outputFilename);
      
      const invalidConfig = {
        type: 'bar',
        data: null
      };
      
      const result = await generateChartForTest(invalidConfig, outputFilename);
      
      // Should get an error response
      assert(!result.success, 'Should fail for null data');
      assert(result.error, 'Should have error message');
      assert(result.error.includes('datasets'), 'Should mention datasets requirement');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });
  });

  describe('Chart Type Specific Tests', () => {
    
    test('should handle scatter chart with correct data format', async () => {
      const outputFilename = 'scatter-test.png';
      await cleanupOutputFile(outputFilename);
      
      const result = await generateChartForTest(fallbackConfigs.scatter, outputFilename);
      
      assert(result.success, `Scatter chart should succeed: ${result.message}`);
      
      const fileExists = await checkOutputFile(outputFilename);
      assert(fileExists, 'Output file should exist');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });

    test('should handle bubble chart with r values', async () => {
      const outputFilename = 'bubble-test.png';
      await cleanupOutputFile(outputFilename);
      
      const result = await generateChartForTest(fallbackConfigs.bubble, outputFilename);
      
      assert(result.success, `Bubble chart should succeed: ${result.message}`);
      
      const fileExists = await checkOutputFile(outputFilename);
      assert(fileExists, 'Output file should exist');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });

    test('should handle charts without labels (pie chart)', async () => {
      const outputFilename = 'pie-no-labels-test.png';
      await cleanupOutputFile(outputFilename);
      
      const configWithoutLabels = {
        type: 'pie',
        data: {
          datasets: [{
            data: [300, 50, 100],
            backgroundColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 205, 86)'
            ]
          }]
        }
      };
      
      const result = await generateChartForTest(configWithoutLabels, outputFilename);
      
      assert(result.success, `Pie chart without labels should succeed: ${result.message}`);
      
      const fileExists = await checkOutputFile(outputFilename);
      assert(fileExists, 'Output file should exist');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });

    test('should handle malformed data for scatter chart', async () => {
      const outputFilename = 'scatter-malformed-test.png';
      await cleanupOutputFile(outputFilename);
      
      const invalidConfig = {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Test',
            data: [1, 2, 3] // Should be {x, y} objects
          }]
        }
      };
      
      const result = await generateChartForTest(invalidConfig, outputFilename);
      
      // Chart.js might handle this gracefully or throw an error
      // Let's check that it either succeeds or fails appropriately
      if (result.success) {
        // If it succeeds, verify the output file was created
        const fileExists = await checkOutputFile(outputFilename);
        assert(fileExists, 'Output file should exist if chart generation succeeded');
      } else {
        // If it fails, should have an error message
        assert(result.error, 'Should have error message if chart generation failed');
      }
      
      // Either outcome is acceptable since Chart.js behavior may vary
      assert(typeof result.success === 'boolean', 'Should have a boolean success status');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });
  });

  describe('Advanced Features', () => {
    
    test('should handle complex chart options', async () => {
      const outputFilename = 'complex-test.png';
      await cleanupOutputFile(outputFilename);
      
      const complexConfig = {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          datasets: [{
            label: 'Dataset 1',
            data: [10, 20, 30, 40],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
          }]
        },
        options: {
          responsive: true,
          interaction: {
            intersect: false,
          },
          plugins: {
            title: {
              display: true,
              text: 'Complex Chart'
            },
            legend: {
              position: 'bottom'
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Month'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Value'
              },
              suggestedMin: 0,
              suggestedMax: 50
            }
          }
        }
      };
      
      const result = await generateChartForTest(complexConfig, outputFilename);
      
      assert(result.success, `Complex chart should succeed: ${result.message}`);
      
      const fileExists = await checkOutputFile(outputFilename);
      assert(fileExists, 'Output file should exist');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });

    test('should handle multiple datasets', async () => {
      const outputFilename = 'multi-dataset-test.png';
      await cleanupOutputFile(outputFilename);
      
      const multiDatasetConfig = {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          datasets: [
            {
              label: 'Dataset 1',
              data: [10, 20, 30, 40],
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
            },
            {
              label: 'Dataset 2',
              data: [15, 25, 35, 45],
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
            },
            {
              label: 'Dataset 3',
              data: [5, 15, 25, 35],
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
            }
          ]
        }
      };
      
      const result = await generateChartForTest(multiDatasetConfig, outputFilename);
      
      assert(result.success, `Multi-dataset chart should succeed: ${result.message}`);
      
      const fileExists = await checkOutputFile(outputFilename);
      assert(fileExists, 'Output file should exist');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });

    test('should handle additional Chart.js configuration properties', async () => {
      const outputFilename = 'additional-props-test.png';
      await cleanupOutputFile(outputFilename);
      
      const configWithAdditionalProps = {
        type: 'bar',
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [{
            label: 'Test Dataset',
            data: [10, 20, 30]
          }]
        },
        options: {
          responsive: true
        },
        // Additional properties that Chart.js might support
        plugins: [],
        customProperty: 'test'
      };
      
      const result = await generateChartForTest(configWithAdditionalProps, outputFilename);
      
      assert(result.success, `Chart with additional properties should succeed: ${result.message}`);
      
      const fileExists = await checkOutputFile(outputFilename);
      assert(fileExists, 'Output file should exist');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });
  });

  describe('File Operations', () => {
    
    test('should create PNG file with correct format', async () => {
      const outputFilename = 'format-test.png';
      await cleanupOutputFile(outputFilename);
      
      const config = await loadChartConfig('bar', fallbackConfigs.bar);
      const result = await generateChartForTest(config, outputFilename);
      
      assert(result.success, 'Chart generation should succeed');
      
      // Read the file and verify it's a valid PNG
      const outputPath = path.join(examplesDir, outputFilename);
      const fileBuffer = await fs.readFile(outputPath);
      
      assert(fileBuffer.length > 0, 'File should have content');
      assert(fileBuffer[0] === 0x89, 'Should start with PNG signature');
      assert(fileBuffer[1] === 0x50, 'Should have PNG signature');
      assert(fileBuffer[2] === 0x4E, 'Should have PNG signature');
      assert(fileBuffer[3] === 0x47, 'Should have PNG signature');
      
      // Verify the buffer returned matches the file
      assert(Buffer.compare(result.buffer, fileBuffer) === 0, 'Returned buffer should match file contents');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });
  });

  describe('Example Configurations Integration', () => {
    
    test('should generate all example chart types with real configurations', async () => {
      const exampleTypes = ['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea'];
      
      for (const chartType of exampleTypes) {
        const outputFilename = `example-${chartType}.png`;
        await cleanupOutputFile(outputFilename);
        
        const config = await loadChartConfig(chartType, null);
        if (config) {
          const result = await generateChartForTest(config, outputFilename);
          
          assert(result.success, `Example ${chartType} chart should succeed: ${result.message}`);
          
          const fileExists = await checkOutputFile(outputFilename);
          assert(fileExists, `Example ${chartType} output file should exist`);
          
          console.log(`✅ Generated example-${chartType}.png in examples folder`);
          
          // Clean up example files (keep the main charttype.png files)
          await cleanupOutputFile(outputFilename);
        }
      }
    });
  });

  describe('Performance Tests', () => {
    
    test('should generate chart within reasonable time', async () => {
      const outputFilename = 'performance-test.png';
      await cleanupOutputFile(outputFilename);
      
      const startTime = process.hrtime();
      const config = await loadChartConfig('bar', fallbackConfigs.bar);
      const result = await generateChartForTest(config, outputFilename);
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const milliseconds = seconds * 1000 + nanoseconds / 1000000;
      
      assert(result.success, 'Chart generation should succeed');
      assert(milliseconds < 5000, `Chart generation should complete within 5 seconds, took ${milliseconds}ms`);
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });

    test('should handle large datasets efficiently', async () => {
      const outputFilename = 'large-dataset-test.png';
      await cleanupOutputFile(outputFilename);
      
      // Create a chart with many data points
      const largeDataConfig = {
        type: 'line',
        data: {
          labels: Array.from({ length: 1000 }, (_, i) => `Point ${i}`),
          datasets: [{
            label: 'Large Dataset',
            data: Array.from({ length: 1000 }, () => Math.random() * 100),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
          }]
        }
      };
      
      const startTime = process.hrtime();
      const result = await generateChartForTest(largeDataConfig, outputFilename);
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const milliseconds = seconds * 1000 + nanoseconds / 1000000;
      
      assert(result.success, 'Large dataset chart should succeed');
      assert(milliseconds < 10000, `Large dataset should complete within 10 seconds, took ${milliseconds}ms`);
      
      const fileExists = await checkOutputFile(outputFilename);
      assert(fileExists, 'Output file should exist');
      
      // Clean up
      await cleanupOutputFile(outputFilename);
    });
  });

  describe('Cleanup', () => {
    test('ensure no test artifacts remain', async () => {
      const testFiles = [
        'error-test.png',
        'scatter-test.png', 
        'bubble-test.png',
        'pie-no-labels-test.png',
        'scatter-malformed-test.png',
        'complex-test.png',
        'multi-dataset-test.png',
        'additional-props-test.png',
        'format-test.png',
        'performance-test.png',
        'large-dataset-test.png'
      ];
      
      for (const filename of testFiles) {
        await cleanupOutputFile(filename);
        const fileExists = await checkOutputFile(filename);
        assert(!fileExists, `Test artifact ${filename} should be cleaned up`);
      }
    });
  });
}); 