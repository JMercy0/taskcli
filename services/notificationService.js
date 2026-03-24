const chalk = require('chalk');
const Task = require('../models/Task');
const TimeTracker = require('./timeTracker');

class NotificationService {
  static generateDailySummary() {
    const stats = Task.getStats();
    const tasks = Task.getAll();

    const overdueTasks = tasks.filter(t =>
      t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'
    );

    const dueTodayTasks = tasks.filter(t => {
      if (!t.deadline || t.status === 'completed') return false;
      const deadline = new Date(t.deadline).toDateString();
      const today = new Date().toDateString();
      return deadline === today;
    });

    const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
    const runningTimers = tasks.filter(t => t.timer_started_at);

    console.log('');
    console.log(chalk.bold.cyan('  ========================================'));
    console.log(chalk.bold.cyan('         TaskCLI Daily Summary'));
    console.log(chalk.bold.cyan('  ========================================'));
    console.log('');
    console.log(chalk.bold('  Overview:'));
    console.log(`    Total tasks:    ${chalk.white(stats.total)}`);
    console.log(`    Pending:        ${chalk.yellow(stats.pending)}`);
    console.log(`    In Progress:    ${chalk.blue(stats.inProgress)}`);
    console.log(`    Completed:      ${chalk.green(stats.completed)}`);

    if (stats.overdue > 0) {
      console.log(`    Overdue:        ${chalk.red(stats.overdue)}`);
    }

    if (overdueTasks.length > 0) {
      console.log('');
      console.log(chalk.bold.red('  Overdue Tasks:'));
      overdueTasks.forEach(t => {
        console.log(`    - [#${t.id}] ${t.title} (due: ${t.deadline})`);
      });
    }

    if (dueTodayTasks.length > 0) {
      console.log('');
      console.log(chalk.bold.yellow('  Due Today:'));
      dueTodayTasks.forEach(t => {
        console.log(`    - [#${t.id}] ${t.title}`);
      });
    }

    if (inProgressTasks.length > 0) {
      console.log('');
      console.log(chalk.bold.blue('  In Progress:'));
      inProgressTasks.forEach(t => {
        const time = t.time_spent ? ` (${TimeTracker.formatTime(t.time_spent)})` : '';
        console.log(`    - [#${t.id}] ${t.title}${time}`);
      });
    }

    if (runningTimers.length > 0) {
      console.log('');
      console.log(chalk.bold.magenta('  Running Timers:'));
      runningTimers.forEach(t => {
        const elapsed = Math.floor((Date.now() - new Date(t.timer_started_at).getTime()) / 1000);
        console.log(`    - [#${t.id}] ${t.title} (running: ${TimeTracker.formatTime(elapsed)})`);
      });
    }

    console.log('');
    console.log(chalk.bold.cyan('  ========================================'));
    console.log('');
  }
}

module.exports = NotificationService;
