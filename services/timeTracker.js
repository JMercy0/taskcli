const Task = require('../models/Task');

class TimeTracker {
  static startTimer(taskId) {
    const task = Task.findById(taskId);
    if (!task) return { error: 'Task not found' };
    if (task.status === 'completed') return { error: 'Cannot start timer on a completed task' };
    if (task.timer_started_at) return { error: 'Timer is already running for this task' };

    Task.update(taskId, {
      timer_started_at: new Date().toISOString(),
      status: 'in-progress',
    });

    return { success: true, task: Task.findById(taskId) };
  }

  static stopTimer(taskId) {
    const task = Task.findById(taskId);
    if (!task) return { error: 'Task not found' };
    if (!task.timer_started_at) return { error: 'No timer is running for this task' };

    const startTime = new Date(task.timer_started_at).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const totalTime = (task.time_spent || 0) + elapsed;

    Task.update(taskId, {
      time_spent: totalTime,
      timer_started_at: null,
    });

    return { success: true, elapsed, totalTime, task: Task.findById(taskId) };
  }

  static formatTime(seconds) {
    if (!seconds || seconds === 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(' ');
  }
}

module.exports = TimeTracker;
