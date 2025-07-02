#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generateChart } from './chart-generator.js';

// Create MCP server instance
const server = new McpServer({
  name: "@ax-crew/chartjs-mcp-server",
  version: "1.0.0",
});

// Register the chart generation tool
server.registerTool(
  "generateChart",
  {
    title: "Generate Chart",
    description: "Generates a chart using Chart.js and returns it as an image. Supports full Chart.js v4 configuration options.",
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
      }).passthrough().describe("Complete Chart.js configuration object supporting full v4 schema")
    }
  },
  async ({ chartConfig }) => {
    const result = await generateChart(chartConfig);

    if (result.success) {
      console.log('Chart successfully generated');

      return {
        content: [
          { type: "text", text: result.message },
          { 
            type: "image", 
            data: result.buffer.toString('base64'), 
            mimeType: "image/png" 
          }
        ]
      };
    } else {
      console.error('Chart generation error:', result.error);
      
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
  console.log("Starting Chart.js MCP Server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Chart.js MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});