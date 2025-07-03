import { Chart, registerables, ChartConfiguration, ChartItem } from 'chart.js';
import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// Register Chart.js components
Chart.register(...registerables);

type ChartGenerationSuccess = {
  success: true;
  buffer?: Buffer;
  filePath?: string;
  message: string;
};

type ChartGenerationError = {
  success: false;
  error: string;
  message: string;
};

type ChartGenerationResult = ChartGenerationSuccess | ChartGenerationError;

export async function generateChart(
  chartConfig: ChartConfiguration, 
  saveToFile: boolean = false
): Promise<ChartGenerationResult> {
  try {
    const width = 800;
    const height = 600;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Validate basic required structure
    if (!chartConfig.data || !chartConfig.data.datasets || !Array.isArray(chartConfig.data.datasets)) {
      throw new Error('Invalid chart configuration: data.datasets is required and must be an array');
    }

    if (chartConfig.data.datasets.length === 0) {
      throw new Error('Invalid chart configuration: at least one dataset is required');
    }

    // Create the chart directly with chartConfig - Chart.js will handle detailed validation
    const chart = new Chart(ctx as unknown as ChartItem, chartConfig);

    const buffer = canvas.toBuffer('image/png');

    if (saveToFile) {
      // Generate file path with timestamp
      const fileName = `img-${Date.now()}.png`;
      const filePath = path.join(process.cwd(), fileName);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save to file
      await fs.promises.writeFile(filePath, buffer);
      
      // Return file:// URL
      const fileUrl = `file://${filePath}`;
      
      return {
        success: true,
        filePath: fileUrl,
        message: `Chart saved to ${fileUrl}`
      };
    } else {
      return {
        success: true,
        buffer,
        message: "Chart generated successfully"
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: `Error generating chart: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 