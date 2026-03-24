const fs = require('fs');
const TaskService = require('./taskService');

class ExportService {
  static toJSON(filePath) {
    const tasks = TaskService.getAllTasks();
    const data = JSON.stringify(tasks, null, 2);
    fs.writeFileSync(filePath, data, 'utf-8');
    return { count: tasks.length, path: filePath };
  }

  static toCSV(filePath) {
    const tasks = TaskService.getAllTasks();
    const headers = [
      'ID', 'Title', 'Description', 'Status', 'Priority', 'Deadline',
      'Project', 'Tags', 'GitHub Issue', 'Time Spent (s)', 'Created At', 'Updated At'
    ];

    const rows = tasks.map(t => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.deadline || '',
      t.project_name || '',
      `"${(t.tags || []).map(tag => tag.name).join(', ')}"`,
      t.github_issue || '',
      t.time_spent || 0,
      t.created_at,
      t.updated_at,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    fs.writeFileSync(filePath, csv, 'utf-8');
    return { count: tasks.length, path: filePath };
  }
}

module.exports = ExportService;
