const TaskService = require('../services/taskService');
const { displayTaskTable, displayTask, info, error } = require('../utils/formatter');

function listTasks(options) {
  try {
    const tasks = TaskService.getAllTasks();

    if (options.verbose && tasks.length > 0) {
      tasks.forEach(task => displayTask(task));
    } else {
      displayTaskTable(tasks);
    }

    if (tasks.length > 0) {
      info(`Showing ${tasks.length} task(s)`);
    }
  } catch (err) {
    error(`Failed to list tasks: ${err.message}`);
  }
}

module.exports = listTasks;
