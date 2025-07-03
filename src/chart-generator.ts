import { Chart, registerables, ChartConfiguration, ChartItem } from 'chart.js';
import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// Register Chart.js components
Chart.register(...registerables);

type OutputFormat = 'png' | 'html';

type ChartGenerationSuccess = {
  success: true;
  buffer?: Buffer;           // PNG data (when format = 'png')
  htmlSnippet?: string;      // HTML div snippet (when format = 'html')
  pngFilePath?: string;      // PNG file path (when format = 'png' && saveToFile = true)
  message: string;
};

type ChartGenerationError = {
  success: false;
  error: string;
  message: string;
};

type ChartGenerationResult = ChartGenerationSuccess | ChartGenerationError;

function generateHtmlSnippet(chartConfig: ChartConfiguration): string {
  const uniqueId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const template = `<div id="chart-container-${uniqueId}" style="width: 800px; height: 400px; margin: 0 auto; position: relative;">
  <canvas id="chart-${uniqueId}"></canvas>
  <script>
    (function() {
      if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.5.0';
        script.onload = function() { createChart(); };
        document.head.appendChild(script);
      } else {
        createChart();
      }
      
      function createChart() {
        const ctx = document.getElementById('chart-${uniqueId}').getContext('2d');
        const config = ${JSON.stringify(chartConfig, null, 2)};
        new Chart(ctx, config);
      }
    })();
  </script>
</div>`;

  return template.trim();
}

export async function generateChart(
  chartConfig: ChartConfiguration, 
  outputFormat: OutputFormat = 'png',
  saveToFile: boolean = false
): Promise<ChartGenerationResult> {
  try {
    // Validate basic required structure
    if (!chartConfig.data || !chartConfig.data.datasets || !Array.isArray(chartConfig.data.datasets)) {
      throw new Error('Invalid chart configuration: data.datasets is required and must be an array');
    }

    if (chartConfig.data.datasets.length === 0) {
      throw new Error('Invalid chart configuration: at least one dataset is required');
    }

    // Handle HTML format
    if (outputFormat === 'html') {
      const htmlSnippet = generateHtmlSnippet(chartConfig);
      return {
        success: true,
        htmlSnippet,
        message: "HTML chart generated successfully"
      };
    }

    // Handle PNG format (existing logic)
    const width = 800;
    const height = 600;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

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
        pngFilePath: fileUrl,
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