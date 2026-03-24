const inquirer = require('inquirer');
const TaskService = require('../services/taskService');
const Project = require('../models/Project');
const { displayTask, success, error } = require('../utils/formatter');
const { isValidDate, isValidGitHubUrl } = require('../utils/validators');

async function addTask(options) {
  try {
    let answers;

    if (options.title) {
      // Non-interactive mode via flags
      answers = {
        title: options.title,
        description: options.description || '',
        priority: options.priority || 'medium',
        deadline: options.deadline || '',
        projectName: options.project || '',
        tags: options.tags || '',
        githubIssue: options.github || '',
      };
    } else {
      // Interactive mode
      const projects = Project.getAll();
      const projectChoices = [
        { name: '(none)', value: '' },
        { name: '+ Create new project', value: '__new__' },
        ...projects.map(p => ({ name: p.name, value: p.name })),
      ];

      answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Task title:',
          validate: input => input.trim() ? true : 'Title is required',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description (optional):',
        },
        {
          type: 'list',
          name: 'priority',
          message: 'Priority:',
          choices: ['low', 'medium', 'high'],
          default: 'medium',
        },
        {
          type: 'input',
          name: 'deadline',
          message: 'Deadline (YYYY-MM-DD, optional):',
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
          message: 'Tags (comma-separated, optional):',
        },
        {
          type: 'input',
          name: 'githubIssue',
          message: 'GitHub issue URL (optional):',
          validate: input => {
            if (!input) return true;
            return isValidGitHubUrl(input) ? true : 'Invalid GitHub issue URL format';
          },
        },
      ]);

      if (answers.projectName === '__new__') {
        answers.projectName = answers.newProjectName;
      }
    }

    const tags = answers.tags
      ? answers.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const task = TaskService.createTask({
      title: answers.title,
      description: answers.description,
      priority: answers.priority,
      deadline: answers.deadline || null,
      projectName: answers.projectName || null,
      tags,
      githubIssue: answers.githubIssue || null,
    });

    success('Task created successfully!');
    displayTask(task);
  } catch (err) {
    error(`Failed to create task: ${err.message}`);
  }
}

module.exports = addTask;
