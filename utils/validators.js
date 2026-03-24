function isValidDate(dateStr) {
  if (!dateStr) return true;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00');
  return !isNaN(date.getTime());
}

function isValidPriority(priority) {
  return ['low', 'medium', 'high'].includes(priority);
}

function isValidStatus(status) {
  return ['pending', 'in-progress', 'completed'].includes(status);
}

function isValidGitHubUrl(url) {
  if (!url) return true;
  return /^https?:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+/.test(url);
}

function isPositiveInteger(val) {
  const num = parseInt(val, 10);
  return !isNaN(num) && num > 0;
}

module.exports = {
  isValidDate,
  isValidPriority,
  isValidStatus,
  isValidGitHubUrl,
  isPositiveInteger,
};
