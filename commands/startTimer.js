const TimeTracker = require('../services/timeTracker');
const { success, error, info } = require('../utils/formatter');

function startTimer(id) {
  try {
    const result = TimeTracker.startTimer(id);
    if (result.error) {
      error(result.error);
      return;
    }
    success(`Timer started for task #${id} "${result.task.title}"`);
    info(`Run 'taskcli stop-timer ${id}' to stop tracking`);
  } catch (err) {
    error(`Failed to start timer: ${err.message}`);
  }
}

module.exports = startTimer;
