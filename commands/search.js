const TaskService = require('../services/taskService');
const { displayTaskTable, info, error } = require('../utils/formatter');

function searchTasks(query) {
  try {
    if (!query || !query.trim()) {
      info('Please provide a search query');
      return;
    }
    const tasks = TaskService.searchTasks(query);
    displayTaskTable(tasks);
    info(`Found ${tasks.length} task(s) matching "${query}"`);
  } catch (err) {
    error(`Failed to search tasks: ${err.message}`);
  }
}

module.exports = searchTasks;
