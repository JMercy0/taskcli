const axios = require('axios');
const { GITHUB_TOKEN } = require('../config');

class GitHubService {
  static parseIssueUrl(url) {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2], number: parseInt(match[3]) };
  }

  static async fetchIssueDetails(url) {
    const parsed = this.parseIssueUrl(url);
    if (!parsed) {
      return { error: 'Invalid GitHub issue URL' };
    }

    if (!GITHUB_TOKEN) {
      return {
        title: `Issue #${parsed.number} (${parsed.owner}/${parsed.repo})`,
        url,
        note: 'Set GITHUB_TOKEN env var to fetch full issue details',
      };
    }

    try {
      const response = await axios.get(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/issues/${parsed.number}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      return {
        title: response.data.title,
        state: response.data.state,
        url: response.data.html_url,
        labels: response.data.labels.map(l => l.name),
      };
    } catch (err) {
      return { error: `Failed to fetch issue: ${err.message}`, url };
    }
  }
}

module.exports = GitHubService;
