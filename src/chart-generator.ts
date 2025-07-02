import { Chart, registerables, ChartConfiguration, ChartItem } from 'chart.js';
import { createCanvas } from 'canvas';

// Register Chart.js components
Chart.register(...registerables);

type ChartGenerationSuccess = {
  success: true;
  buffer: Buffer;
  message: string;
};

type ChartGenerationError = {
  success: false;
  error: string;
  message: string;
};

type ChartGenerationResult = ChartGenerationSuccess | ChartGenerationError;

export async function generateChart(chartConfig: any): Promise<ChartGenerationResult> {
  try {
    const { type, data, options, ...additionalConfig } = chartConfig;
    const width = 800;
    const height = 600;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Validate basic required structure
    if (!data || !data.datasets || !Array.isArray(data.datasets)) {
      throw new Error('Invalid chart configuration: data.datasets is required and must be an array');
    }

    if (data.datasets.length === 0) {
      throw new Error('Invalid chart configuration: at least one dataset is required');
    }

    // Construct the full Chart.js configuration
    const config = { 
      type, 
      data, 
      options,
      ...additionalConfig
    };

    // Create the chart - Chart.js will handle detailed validation
    const chart = new Chart(ctx as unknown as ChartItem, config);

    const buffer = canvas.toBuffer('image/png');

    return {
      success: true,
      buffer,
      message: "Chart generated successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: `Error generating chart: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 