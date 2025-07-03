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

// Register the chart generation tool
server.registerTool(
  "generateChart",
  {
    title: "Generate Chart",
    description: "Generates a chart using Chart.js and returns it as an image or saves it to file. Supports full Chart.js v4 configuration options.",
    inputSchema: {
      chartConfig: z.object({
        type: z.enum(['bar', 'line', 'scatter', 'bubble', 'pie', 'doughnut', 'polarArea', 'radar']).describe("Chart type"),
        data: z.object({
          labels: z.array(z.string()).optional().describe("Chart labels (optional for some chart types)"),
          datasets: z.array(z.object({
            label: z.string().optional().describe("Dataset label"),
            data: z.array(z.any()).describe("Data points - format varies by chart type"),
            // Allow any additional dataset properties for full Chart.js compatibility
          }).passthrough()).describe("Chart datasets"),
        }).describe("Chart data"),
        options: z.any().optional().describe("Chart.js options object - supports full Chart.js v4 configuration"),
        // Allow any additional top-level properties for full Chart.js compatibility
      }).passthrough().describe("Complete Chart.js configuration object supporting full v4 schema"),
      saveToFile: z.boolean().optional().default(false).describe("Whether to save the chart to a file and return file:// path via image_url property instead of base64 data.")
    }
  },
  async ({ chartConfig, saveToFile }) => {
    const result = await generateChart(chartConfig, saveToFile);

    if (result.success) {
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
      } else if (result.filePath) {
        // Return file path as custom JSON inside content, with type property
        return {
          content: [
            {
              type: 'text',
              text: result.filePath
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