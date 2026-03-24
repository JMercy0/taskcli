const TaskService = require('../services/taskService');
const { displayTaskTable, info, error } = require('../utils/formatter');

function filterTasks(options) {
  try {
    const filters = {};
    if (options.project) filters.project = options.project;
    if (options.tag) filters.tag = options.tag;
    if (options.status) filters.status = options.status;
    if (options.priority) filters.priority = options.priority;

    if (Object.keys(filters).length === 0) {
      info('No filter criteria specified. Use --project, --tag, --status, or --priority');
      return;
    }

    const tasks = TaskService.filterTasks(filters);
    displayTaskTable(tasks);
    info(`Found ${tasks.length} task(s) matching filters`);
  } catch (err) {
    error(`Failed to filter tasks: ${err.message}`);
  }
}

module.exports = filterTasks;
