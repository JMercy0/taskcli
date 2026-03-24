#!/usr/bin/env node

const { Command } = require('commander');
const { initializeDatabase } = require('../database/setup');
const pkg = require('../package.json');

// Initialize database on startup
initializeDatabase();

const program = new Command();

program
  .name('taskcli')
  .description('A command-line task management tool for developers')
  .version(pkg.version);

// === Add Task ===
program
  .command('add')
  .description('Create a new task (interactive if no --title flag)')
  .option('-t, --title <title>', 'Task title')
  .option('-d, --description <desc>', 'Task description')
  .option('-p, --priority <priority>', 'Priority: low, medium, high')
  .option('--deadline <date>', 'Deadline (YYYY-MM-DD)')
  .option('--project <name>', 'Project name')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--github <url>', 'GitHub issue URL')
  .action(async (options) => {
    const addTask = require('../commands/add');
    await addTask(options);
  });

// === List Tasks ===
program
  .command('list')
  .alias('ls')
  .description('List all tasks')
  .option('-v, --verbose', 'Show detailed view for each task')
  .action((options) => {
    const listTasks = require('../commands/list');
    listTasks(options);
  });

// === Update Task ===
program
  .command('update <id>')
  .description('Update a task interactively')
  .action(async (id) => {
    const updateTask = require('../commands/update');
    await updateTask(parseInt(id));
  });

// === Delete Task ===
program
  .command('delete <id>')
  .alias('rm')
  .description('Delete a task')
  .option('-f, --force', 'Skip confirmation prompt')
  .action(async (id, options) => {
    const deleteTask = require('../commands/delete');
    await deleteTask(parseInt(id), options);
  });

// === Complete Task ===
program
  .command('complete <id>')
  .alias('done')
  .description('Toggle task completion status')
  .action((id) => {
    const completeTask = require('../commands/complete');
    completeTask(parseInt(id));
  });

// === Start Timer ===
program
  .command('start-timer <id>')
  .description('Start time tracking for a task')
  .action((id) => {
    const startTimer = require('../commands/startTimer');
    startTimer(parseInt(id));
  });

// === Stop Timer ===
program
  .command('stop-timer <id>')
  .description('Stop time tracking for a task')
  .action((id) => {
    const stopTimer = require('../commands/stopTimer');
    stopTimer(parseInt(id));
  });

// === Filter Tasks ===
program
  .command('filter')
  .description('Filter tasks by project, tag, status, or priority')
  .option('--project <name>', 'Filter by project name')
  .option('--tag <tag>', 'Filter by tag')
  .option('--status <status>', 'Filter by status: pending, in-progress, completed')
  .option('--priority <priority>', 'Filter by priority: low, medium, high')
  .action((options) => {
    const filterTasks = require('../commands/filter');
    filterTasks(options);
  });

// === Search Tasks ===
program
  .command('search <query>')
  .description('Search tasks by title or description')
  .action((query) => {
    const searchTasks = require('../commands/search');
    searchTasks(query);
  });

// === Export Tasks ===
program
  .command('export')
  .description('Export tasks to JSON or CSV file')
  .option('-f, --format <format>', 'Export format: json or csv', 'json')
  .option('-o, --output <path>', 'Output file path')
  .action((options) => {
    const exportTasks = require('../commands/export');
    exportTasks(options);
  });

// === Daily Summary ===
program
  .command('summary')
  .description('Show daily task summary with stats and alerts')
  .action(() => {
    const showSummary = require('../commands/summary');
    showSummary();
  });

// === Interactive TUI Dashboard ===
program
  .command('ui')
  .alias('dashboard')
  .description('Launch interactive TUI dashboard')
  .action(() => {
    const launchDashboard = require('../ui/dashboard');
    launchDashboard();
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.help();
}
