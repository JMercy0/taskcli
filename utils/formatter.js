const chalk = require('chalk');
const Table = require('cli-table3');
const TimeTracker = require('../services/timeTracker');

function formatPriority(priority) {
  switch (priority) {
    case 'high':   return chalk.red.bold('HIGH');
    case 'medium': return chalk.yellow('MEDIUM');
    case 'low':    return chalk.gray('LOW');
    default:       return priority;
  }
}

function formatStatus(status) {
  switch (status) {
    case 'completed':   return chalk.green('done');
    case 'in-progress': return chalk.blue('active');
    case 'pending':     return chalk.yellow('pending');
    default:            return status;
  }
}

function formatDeadline(deadline) {
  if (!deadline) return chalk.gray('-');
  const d = new Date(deadline + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return chalk.red(deadline + ' (overdue)');
  if (diffDays === 0) return chalk.red.bold(deadline + ' (today)');
  if (diffDays <= 3) return chalk.yellow(deadline);
  return chalk.white(deadline);
}

function formatTags(tags) {
  if (!tags || tags.length === 0) return chalk.gray('-');
  return tags.map(t => chalk.cyan(`#${t.name}`)).join(' ');
}

function displayTask(task) {
  console.log('');
  console.log(chalk.bold(`  Task #${task.id}: ${task.title}`));
  console.log(chalk.gray('  ' + '-'.repeat(40)));
  if (task.description) console.log(`  Description:  ${task.description}`);
  console.log(`  Status:       ${formatStatus(task.status)}`);
  console.log(`  Priority:     ${formatPriority(task.priority)}`);
  console.log(`  Deadline:     ${formatDeadline(task.deadline)}`);
  console.log(`  Project:      ${task.project_name ? chalk.magenta(task.project_name) : chalk.gray('-')}`);
  console.log(`  Tags:         ${formatTags(task.tags)}`);
  if (task.github_issue) console.log(`  GitHub:       ${chalk.blue.underline(task.github_issue)}`);
  console.log(`  Time Spent:   ${TimeTracker.formatTime(task.time_spent || 0)}`);
  if (task.timer_started_at) {
    const elapsed = Math.floor((Date.now() - new Date(task.timer_started_at).getTime()) / 1000);
    console.log(`  Timer:        ${chalk.green('Running')} (${TimeTracker.formatTime(elapsed)})`);
  }
  console.log(`  Created:      ${chalk.gray(task.created_at)}`);
  console.log(`  Updated:      ${chalk.gray(task.updated_at)}`);
  console.log('');
}

function displayTaskTable(tasks) {
  if (tasks.length === 0) {
    console.log(chalk.yellow('\n  No tasks found.\n'));
    return;
  }

  const table = new Table({
    head: ['ID', 'Title', 'Status', 'Priority', 'Project', 'Tags', 'Deadline', 'Time'].map(h => chalk.bold(h)),
    colWidths: [6, 28, 10, 10, 14, 18, 22, 10],
    wordWrap: true,
    style: { head: [], border: ['gray'] },
  });

  for (const task of tasks) {
    table.push([
      chalk.white(task.id),
      task.title.length > 26 ? task.title.substring(0, 24) + '..' : task.title,
      formatStatus(task.status),
      formatPriority(task.priority),
      task.project_name ? chalk.magenta(task.project_name) : chalk.gray('-'),
      formatTags(task.tags),
      formatDeadline(task.deadline),
      TimeTracker.formatTime(task.time_spent || 0),
    ]);
  }

  console.log('');
  console.log(table.toString());
  console.log('');
}

function success(message) {
  console.log(chalk.green(`\n  + ${message}\n`));
}

function error(message) {
  console.log(chalk.red(`\n  x ${message}\n`));
}

function info(message) {
  console.log(chalk.blue(`  i ${message}`));
}

function warn(message) {
  console.log(chalk.yellow(`\n  ! ${message}\n`));
}

module.exports = {
  formatPriority,
  formatStatus,
  formatDeadline,
  formatTags,
  displayTask,
  displayTaskTable,
  success,
  error,
  info,
  warn,
};
