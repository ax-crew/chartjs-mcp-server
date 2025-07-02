import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const serverPath = path.join(projectRoot, 'dist', 'index.js');
const examplesDir = path.join(projectRoot, 'examples');

// Helper function to check if output file exists and has content
async function checkOutputFile(filename) {
  const outputPath = path.join(projectRoot, filename);
  try {
    const stats = await fs.stat(outputPath);
    return stats.size > 0;
  } catch (error) {
    return false;
  }
}

// Helper function to cleanup output file
async function cleanupOutputFile(filename) {
  const outputPath = path.join(projectRoot, filename);
  try {
    await fs.unlink(outputPath);
  } catch (error) {
    // File doesn't exist, ignore
  }
}

// Helper function to load example configuration
async function loadExampleConfig(chartType) {
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
      console.log(`Could not load ${exampleFile}`);
      return null;
    }
  }
  return null;
}

// Create a client connection to the MCP server
async function createMCPClient() {
  const client = new Client(
    {
      name: "integration-test-client", 
      version: "1.0.0"
    },
    {
      capabilities: {}
    }
  );

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath]
  });

  await client.connect(transport);

  return { client, transport };
}

describe('Chart.js MCP Server - Integration Tests', () => {
  
  describe('Server Connection and Tools', () => {
    
    test('should connect to MCP server and list tools', async () => {
      const { client, transport } = await createMCPClient();
      
      try {
        // List available tools
        const toolsResponse = await client.listTools();
        
        assert(toolsResponse.tools, 'Should return tools list');
        assert(Array.isArray(toolsResponse.tools), 'Tools should be an array');
        assert(toolsResponse.tools.length > 0, 'Should have at least one tool');
        
        // Check for generateChart tool
        const generateChartTool = toolsResponse.tools.find(tool => tool.name === 'generateChart');
        assert(generateChartTool, 'Should have generateChart tool');
        assert(generateChartTool.description, 'Tool should have description');
        assert(generateChartTool.inputSchema, 'Tool should have input schema');
        
      } finally {
        await transport.close();
      }
    });
  });

  describe('Chart Generation via MCP', () => {
    
    test('should generate bar chart via MCP call', async () => {
      await cleanupOutputFile('output.png');
      
      const { client, transport } = await createMCPClient();
      
      try {
        const barConfig = {
          type: 'bar',
          data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
              label: '# of Votes',
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 205, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 159, 64, 0.8)'
              ]
            }]
          }
        };

        const result = await client.callTool({
          name: 'generateChart',
          arguments: { chartConfig: barConfig }
        });

        assert(result.content, 'Should return content');
        assert(Array.isArray(result.content), 'Content should be an array');
        
        // Check for text response
        const textContent = result.content.find(item => item.type === 'text');
        assert(textContent, 'Should have text content');
        assert(textContent.text.includes('Chart generated successfully'), 'Should mention successful generation');
        
        // Check for image response
        const imageContent = result.content.find(item => item.type === 'image');
        assert(imageContent, 'Should have image content');
        assert(imageContent.data, 'Should have image data');
        assert(imageContent.mimeType === 'image/png', 'Should be PNG format');
        
        // Verify image data is valid PNG (no file checking needed)
        const imageBuffer = Buffer.from(imageContent.data, 'base64');
        assert(imageBuffer.length > 8, 'Image data should have content');
        assert(imageBuffer[0] === 0x89, 'Should start with PNG signature');
        assert(imageBuffer[1] === 0x50, 'Should have PNG signature');
        assert(imageBuffer[2] === 0x4E, 'Should have PNG signature');
        assert(imageBuffer[3] === 0x47, 'Should have PNG signature');
        
      } finally {
        await transport.close();
        await cleanupOutputFile('output.png');
      }
    });

    test('should generate line chart from example config via MCP', async () => {
      await cleanupOutputFile('output.png');
      
      const { client, transport } = await createMCPClient();
      
      try {
        const lineConfig = await loadExampleConfig('line');
        
        if (lineConfig) {
          const result = await client.callTool({
            name: 'generateChart',
            arguments: { chartConfig: lineConfig }
          });

          assert(result.content, 'Should return content');
          
          const textContent = result.content.find(item => item.type === 'text');
          assert(textContent, 'Should have text content');
          assert(textContent.text.includes('Chart generated successfully'), 'Should mention successful generation');
          
          const imageContent = result.content.find(item => item.type === 'image');
          assert(imageContent, 'Should have image content');
          assert(imageContent.data, 'Should have image data');
        }
        
      } finally {
        await transport.close();
        await cleanupOutputFile('output.png');
      }
    });

    test('should handle invalid chart configuration via MCP', async () => {
      await cleanupOutputFile('output.png');
      
      const { client, transport } = await createMCPClient();
      
      try {
        const invalidConfig = {
          type: 'invalidType',
          data: {}
        };

        // Should throw MCP validation error before reaching server
        let errorThrown = false;
        try {
          await client.callTool({
            name: 'generateChart',
            arguments: { chartConfig: invalidConfig }
          });
        } catch (error) {
          errorThrown = true;
          assert(error.code === -32602, 'Should be MCP validation error');
          assert(error.message.includes('Invalid arguments'), 'Should mention invalid arguments');
        }
        
        assert(errorThrown, 'Should throw validation error for invalid config');
        
      } finally {
        await transport.close();
        await cleanupOutputFile('output.png');
      }
    });

    test('should generate multiple chart types via MCP', async () => {
      const chartTypes = ['bar', 'line', 'pie'];
      
      for (const chartType of chartTypes) {
        await cleanupOutputFile('output.png');
        
        const { client, transport } = await createMCPClient();
        
        try {
          const config = await loadExampleConfig(chartType);
          
          if (config) {
            const result = await client.callTool({
              name: 'generateChart',
              arguments: { chartConfig: config }
            });

            assert(result.content, `Should return content for ${chartType} chart`);
            
            const textContent = result.content.find(item => item.type === 'text');
            assert(textContent, `Should have text content for ${chartType} chart`);
            assert(textContent.text.includes('Chart generated successfully'), `Should mention successful generation for ${chartType} chart`);
            
            const imageContent = result.content.find(item => item.type === 'image');
            assert(imageContent, `Should have image content for ${chartType} chart`);
            assert(imageContent.data, `Should have image data for ${chartType} chart`);
          }
          
        } finally {
          await transport.close();
          await cleanupOutputFile('output.png');
        }
      }
    });
  });

  describe('Error Handling via MCP', () => {
    
    test('should handle missing datasets via MCP', async () => {
      await cleanupOutputFile('output.png');
      
      const { client, transport } = await createMCPClient();
      
      try {
        const invalidConfig = {
          type: 'bar',
          data: {
            labels: ['A', 'B', 'C']
            // Missing datasets
          }
        };

        // Should throw MCP validation error before reaching server
        let errorThrown = false;
        try {
          await client.callTool({
            name: 'generateChart',
            arguments: { chartConfig: invalidConfig }
          });
        } catch (error) {
          errorThrown = true;
          assert(error.code === -32602, 'Should be MCP validation error');
          assert(error.message.includes('Invalid arguments'), 'Should mention invalid arguments');
          assert(error.message.includes('datasets'), 'Should mention datasets in error');
        }
        
        assert(errorThrown, 'Should throw validation error for missing datasets');
        
      } finally {
        await transport.close();
        await cleanupOutputFile('output.png');
      }
    });
  });

  describe('Performance via MCP', () => {
    
    test('should generate chart within reasonable time via MCP', async () => {
      await cleanupOutputFile('output.png');
      
      const { client, transport } = await createMCPClient();
      
      try {
        const config = {
          type: 'bar',
          data: {
            labels: ['A', 'B', 'C'],
            datasets: [{
              label: 'Test Dataset',
              data: [10, 20, 30]
            }]
          }
        };

        const startTime = process.hrtime();
        
        const result = await client.callTool({
          name: 'generateChart',
          arguments: { chartConfig: config }
        });
        
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const milliseconds = seconds * 1000 + nanoseconds / 1000000;

        assert(result.content, 'Should return content');
        assert(milliseconds < 10000, `Chart generation should complete within 10 seconds via MCP, took ${milliseconds}ms`);
        
        const textContent = result.content.find(item => item.type === 'text');
        assert(textContent, 'Should have text content');
        assert(textContent.text.includes('Chart generated successfully'), 'Should mention successful generation');
        
        const imageContent = result.content.find(item => item.type === 'image');
        assert(imageContent, 'Should have image content');
        assert(imageContent.data, 'Should have image data');
        
      } finally {
        await transport.close();
        await cleanupOutputFile('output.png');
      }
    });
  });
}); 