const TaskService = require('../services/taskService');
const { displayTask, success, error } = require('../utils/formatter');

function completeTask(id) {
  try {
    const task = TaskService.completeTask(id);
    if (!task) {
      error(`Task #${id} not found`);
      return;
    }

    if (task.status === 'completed') {
      success(`Task #${id} marked as completed!`);
    } else {
      success(`Task #${id} marked as pending`);
    }
    displayTask(task);
  } catch (err) {
    error(`Failed to update task: ${err.message}`);
  }
}

module.exports = completeTask;
