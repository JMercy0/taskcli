# TaskCLI

A command-line task management tool for developers to create, organize, and track tasks efficiently from the terminal.

## Features

- **Task Management** — Create, update, delete, and complete tasks
- **Projects & Tags** — Organize tasks by project and tags
- **Priority & Deadlines** — Set priority levels (low/medium/high) and due dates
- **Time Tracking** — Start/stop timer per task, tracks total time spent
- **GitHub Integration** — Link tasks to GitHub issues
- **Filtering & Search** — Filter by project, tag, status, priority; full-text search
- **Export** — Export tasks to JSON or CSV
- **Daily Summary** — Dashboard with stats, overdue alerts, and running timers
- **Colorized Output** — Clean table formatting with color-coded priorities and statuses

## Installation

```bash
git clone https://github.com/<your-username>/taskcli.git
cd taskcli
npm install
npm link   # optional: makes 'taskcli' available globally
```

## Usage

```bash
# Show all commands
taskcli --help

# Create a task (interactive)
taskcli add

# Create a task (with flags)
taskcli add -t "Fix login bug" -p high --deadline 2025-04-01 --project WebApp --tags "bug,urgent"

# List all tasks
taskcli list
taskcli list -v          # detailed view

# Update / complete / delete
taskcli update 1         # interactive editor
taskcli complete 1       # toggle done/pending
taskcli delete 1         # with confirmation
taskcli delete 1 -f      # skip confirmation

# Time tracking
taskcli start-timer 1
taskcli stop-timer 1

# Filter and search
taskcli filter --project WebApp --status pending
taskcli filter --tag bug --priority high
taskcli search "authentication"

# Export
taskcli export -f json -o backup.json
taskcli export -f csv

# Daily summary
taskcli summary
```

## Tech Stack

- **Node.js** with ES6+
- **Commander.js** — CLI command framework
- **Inquirer.js** — Interactive prompts
- **better-sqlite3** — SQLite database
- **chalk** — Colorized terminal output
- **cli-table3** — Table formatting
- **axios** — GitHub API integration

## Project Structure

```
taskcli/
├── bin/index.js          — CLI entry point
├── commands/             — Command handlers
├── config/               — Configuration
├── database/             — SQLite connection & schema
├── models/               — Data access (Task, Project, Tag)
├── services/             — Business logic
└── utils/                — Formatting & validation helpers
```

## License

MIT
