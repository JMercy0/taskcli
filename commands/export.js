const path = require('path');
const ExportService = require('../services/exportService');
const { success, error } = require('../utils/formatter');

function exportTasks(options) {
  try {
    const format = options.format || 'json';
    const outputPath = options.output || path.join(process.cwd(), `tasks.${format}`);

    let result;
    if (format === 'csv') {
      result = ExportService.toCSV(outputPath);
    } else if (format === 'json') {
      result = ExportService.toJSON(outputPath);
    } else {
      error(`Unsupported format: ${format}. Use "json" or "csv"`);
      return;
    }

    success(`Exported ${result.count} task(s) to ${result.path}`);
  } catch (err) {
    error(`Failed to export tasks: ${err.message}`);
  }
}

module.exports = exportTasks;
