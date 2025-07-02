import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Chart, registerables, ChartConfiguration, ChartItem } from 'chart.js';
import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// Create MCP server instance
const server = new McpServer({
  name: "chartjs-mcp-server",
  version: "1.0.0",
});

// Register the chart generation tool
server.registerTool(
  "generateChart",
  {
    title: "Generate Chart",
    description: "Generates a chart using Chart.js and saves it as output.png. Supports full Chart.js v4 configuration options.",
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
    try {
      const { type, data, options, ...additionalConfig } = chartConfig;
      const width = 800;
      const height = 600;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      Chart.register(...registerables);

      console.error('Generating chart with configuration:', JSON.stringify({ type, data, options, ...additionalConfig }, null, 2));

      // Validate basic required structure
      if (!data || !data.datasets || !Array.isArray(data.datasets)) {
        throw new Error('Invalid chart configuration: data.datasets is required and must be an array');
      }

      if (data.datasets.length === 0) {
        throw new Error('Invalid chart configuration: at least one dataset is required');
      }

      // Construct the full Chart.js configuration
      const config: ChartConfiguration = { 
        type, 
        data, 
        options,
        ...additionalConfig // Support any additional Chart.js properties
      };

      // Create the chart - Chart.js will handle detailed validation
      const chart = new Chart(ctx as unknown as ChartItem, config);

      const outputPath = path.join(process.cwd(), 'output.png');
      const buffer = canvas.toBuffer('image/png');
      await fs.promises.writeFile(outputPath, buffer);

      console.error(`Chart successfully saved to ${outputPath}`);

      return {
        content: [
          { type: "text", text: `Chart saved to ${outputPath}` },
          { 
            type: "image", 
            data: buffer.toString('base64'), 
            mimeType: "image/png" 
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Chart generation error:', errorMessage);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
      
      return {
        content: [
          { 
            type: "text", 
            text: `Error generating chart: ${errorMessage}\n\nPlease ensure your configuration follows the Chart.js v4 schema. Common issues:\n- Check data format matches chart type (e.g., scatter charts need {x, y} objects)\n- Verify all required dataset properties are provided\n- Ensure chart type is supported: ${['bar', 'line', 'scatter', 'bubble', 'pie', 'doughnut', 'polarArea', 'radar'].join(', ')}` 
          }
        ]
      };
    }
  }
);

// Main function to start the server
async function main() {
  console.error("DEBUG: Starting Chart.js MCP Server...");
  
  const transport = new StdioServerTransport();
  
  console.error("DEBUG: Connecting to transport...");
  await server.connect(transport);
  
  console.error("DEBUG: Chart.js MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});