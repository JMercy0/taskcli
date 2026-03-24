const inquirer = require('inquirer');
const TaskService = require('../services/taskService');
const { success, error, info } = require('../utils/formatter');

async function deleteTask(id, options) {
  try {
    const task = TaskService.getTaskWithTags(id);
    if (!task) {
      error(`Task #${id} not found`);
      return;
    }

    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Delete task #${id} "${task.title}"?`,
          default: false,
        },
      ]);

      if (!confirm) {
        info('Deletion cancelled');
        return;
      }
    }

    TaskService.deleteTask(id);
    success(`Task #${id} "${task.title}" deleted`);
  } catch (err) {
    error(`Failed to delete task: ${err.message}`);
  }
}

module.exports = deleteTask;
