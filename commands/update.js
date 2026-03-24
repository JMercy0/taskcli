const inquirer = require('inquirer');
const TaskService = require('../services/taskService');
const Project = require('../models/Project');
const { displayTask, success, error } = require('../utils/formatter');
const { isValidDate, isValidGitHubUrl } = require('../utils/validators');

async function updateTask(id) {
  try {
    const task = TaskService.getTaskWithTags(id);
    if (!task) {
      error(`Task #${id} not found`);
      return;
    }

    const projects = Project.getAll();
    const projectChoices = [
      { name: '(none)', value: '' },
      { name: '+ Create new project', value: '__new__' },
      ...projects.map(p => ({ name: p.name, value: p.name })),
    ];

    const currentTags = (task.tags || []).map(t => t.name).join(', ');

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Title:',
        default: task.title,
        validate: input => input.trim() ? true : 'Title is required',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: task.description,
      },
      {
        type: 'list',
        name: 'status',
        message: 'Status:',
        choices: ['pending', 'in-progress', 'completed'],
        default: task.status,
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Priority:',
        choices: ['low', 'medium', 'high'],
        default: task.priority,
      },
      {
        type: 'input',
        name: 'deadline',
        message: 'Deadline (YYYY-MM-DD):',
        default: task.deadline || '',
        validate: input => {
          if (!input) return true;
          return isValidDate(input) ? true : 'Invalid date format. Use YYYY-MM-DD';
        },
      },
      {
        type: 'list',
        name: 'projectName',
        message: 'Project:',
        choices: projectChoices,
        default: task.project_name || '',
      },
      {
        type: 'input',
        name: 'newProjectName',
        message: 'New project name:',
        when: ans => ans.projectName === '__new__',
        validate: input => input.trim() ? true : 'Project name is required',
      },
      {
        type: 'input',
        name: 'tags',
        message: 'Tags (comma-separated):',
        default: currentTags,
      },
      {
        type: 'input',
        name: 'githubIssue',
        message: 'GitHub issue URL:',
        default: task.github_issue || '',
        validate: input => {
          if (!input) return true;
          return isValidGitHubUrl(input) ? true : 'Invalid GitHub issue URL format';
        },
      },
    ]);

    if (answers.projectName === '__new__') {
      answers.projectName = answers.newProjectName;
    }

    const tags = answers.tags
      ? answers.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const updated = TaskService.updateTask(id, {
      title: answers.title,
      description: answers.description,
      status: answers.status,
      priority: answers.priority,
      deadline: answers.deadline || null,
      projectName: answers.projectName || null,
      tags,
      githubIssue: answers.githubIssue || null,
    });

    success('Task updated successfully!');
    displayTask(updated);
  } catch (err) {
    error(`Failed to update task: ${err.message}`);
  }
}

module.exports = updateTask;
