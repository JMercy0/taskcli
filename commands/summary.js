const NotificationService = require('../services/notificationService');
const { error } = require('../utils/formatter');

function showSummary() {
  try {
    NotificationService.generateDailySummary();
  } catch (err) {
    error(`Failed to generate summary: ${err.message}`);
  }
}

module.exports = showSummary;
