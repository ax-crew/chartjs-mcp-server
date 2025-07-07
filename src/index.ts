#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generateChart } from './chart-generator.js';

// Create MCP server instance
const server = new McpServer({
  name: "@ax-crew/chartjs-mcp-server",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

// Validation function for chart configuration
function validateChartConfig(chartConfig: any) {
  // Check if chartConfig is an object
  if (!chartConfig || typeof chartConfig !== 'object') {
    throw new Error('Chart configuration must be an object');
  }

  // Check for valid chart type
  const validTypes = ['bar', 'line', 'scatter', 'bubble', 'pie', 'doughnut', 'polarArea', 'radar'];
  if (!chartConfig.type || !validTypes.includes(chartConfig.type)) {
    throw new Error(`Invalid chart type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Check for data object
  if (!chartConfig.data || typeof chartConfig.data !== 'object') {
    throw new Error('Chart configuration must include a data object');
  }

  // Check for datasets array
  if (!chartConfig.data.datasets || !Array.isArray(chartConfig.data.datasets)) {
    throw new Error('Chart data must include a datasets array');
  }

  // Check for at least one dataset
  if (chartConfig.data.datasets.length === 0) {
    throw new Error('Chart data must include at least one dataset');
  }
}

// Register the chart generation tool
server.registerTool(
  "generateChart",
  {
    title: "Generate Chart",
    description: "Generates charts using Chart.js. Can output PNG images or interactive HTML divs. Supports full Chart.js v4 configuration options.",
    inputSchema: {
      chartConfig: z.any().describe("Complete Chart.js configuration object supporting full v4 schema"),
      outputFormat: z.enum(['png', 'html']).optional().default('png').describe("Output format: 'png' for static image, 'html' for interactive HTML div"),
      saveToFile: z.boolean().optional().default(false).describe("Whether to save PNG to file (only applies to PNG format)")
    }
  },
  async ({ chartConfig, outputFormat, saveToFile }) => {
    // Validate chart configuration first
    try {
      validateChartConfig(chartConfig);
    } catch (validationError) {
      // Return validation error as content
      const message = validationError instanceof Error ? validationError.message : String(validationError);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${message}`
          }
        ]
      };
    }

    const result = await generateChart(chartConfig, outputFormat, saveToFile);

    if (result.success) {
      // Handle HTML format
      if (result.htmlSnippet) {
        return {
          content: [
            {
              type: 'text',
              text: result.htmlSnippet
            }
          ]
        };
      }

      // Handle PNG format
      if (result.buffer) {
        // Return base64 image data
        return {
          content: [
            { 
              type: "image", 
              data: result.buffer.toString('base64'), 
              mimeType: "image/png" 
            }
          ]
        };
      } else if (result.pngFilePath) {
        // Return file path
        return {
          content: [
            {
              type: 'text',
              text: result.pngFilePath
            }
          ]
        };
      } else {
        // Fallback - shouldn't happen
        return {
          content: [
            { type: "text", text: result.message }
          ]
        };
      }
    } else {
      return {
        content: [
          {
            type: "text", 
            text: `${result.message}\n\nPlease ensure your configuration follows the Chart.js v4 schema. Common issues:\n- Check data format matches chart type (e.g., scatter charts need {x, y} objects)\n- Verify all required dataset properties are provided\n- Ensure chart type is supported: ${['bar', 'line', 'scatter', 'bubble', 'pie', 'doughnut', 'polarArea', 'radar'].join(', ')}` 
          }
        ]
      };
    }
  }
);

// Main function to start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});