const TimeTracker = require('../services/timeTracker');
const { success, error, info } = require('../utils/formatter');

function stopTimer(id) {
  try {
    const result = TimeTracker.stopTimer(id);
    if (result.error) {
      error(result.error);
      return;
    }
    success(`Timer stopped for task #${id} "${result.task.title}"`);
    info(`Session: ${TimeTracker.formatTime(result.elapsed)} | Total: ${TimeTracker.formatTime(result.totalTime)}`);
  } catch (err) {
    error(`Failed to stop timer: ${err.message}`);
  }
}

module.exports = stopTimer;
