const { getConnection } = require('../database/connection');

class Task {
  static create({ title, description, priority, deadline, project_id, github_issue }) {
    const db = getConnection();
    const stmt = db.prepare(`
      INSERT INTO tasks (title, description, priority, deadline, project_id, github_issue)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      title,
      description || '',
      priority || 'medium',
      deadline || null,
      project_id || null,
      github_issue || null
    );
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const db = getConnection();
    return db.prepare(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `).get(id);
  }

  static getAll() {
    const db = getConnection();
    return db.prepare(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      ORDER BY
        CASE t.status
          WHEN 'in-progress' THEN 0
          WHEN 'pending' THEN 1
          WHEN 'completed' THEN 2
        END,
        CASE t.priority
          WHEN 'high' THEN 0
          WHEN 'medium' THEN 1
          WHEN 'low' THEN 2
        END,
        t.created_at DESC
    `).all();
  }

  static update(id, fields) {
    const db = getConnection();
    const allowedFields = [
      'title', 'description', 'status', 'priority', 'deadline',
      'project_id', 'github_issue', 'time_spent', 'timer_started_at'
    ];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return null;

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);
    return this.findById(id);
  }

  static delete(id) {
    const db = getConnection();
    return db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }

  static filter({ project, tag, status, priority }) {
    const db = getConnection();
    let sql = `
      SELECT DISTINCT t.*, p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_tags tt ON t.id = tt.task_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
      WHERE 1=1
    `;
    const params = [];

    if (project) {
      sql += ' AND p.name = ?';
      params.push(project);
    }
    if (tag) {
      sql += ' AND tg.name = ?';
      params.push(tag.toLowerCase());
    }
    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }
    if (priority) {
      sql += ' AND t.priority = ?';
      params.push(priority);
    }

    sql += ' ORDER BY t.created_at DESC';
    return db.prepare(sql).all(...params);
  }

  static search(query) {
    const db = getConnection();
    const pattern = `%${query}%`;
    return db.prepare(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.title LIKE ? OR t.description LIKE ?
      ORDER BY t.created_at DESC
    `).all(pattern, pattern);
  }

  static getStats() {
    const db = getConnection();
    return {
      total: db.prepare('SELECT COUNT(*) as count FROM tasks').get().count,
      pending: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get().count,
      inProgress: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in-progress'").get().count,
      completed: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get().count,
      overdue: db.prepare("SELECT COUNT(*) as count FROM tasks WHERE deadline < date('now') AND status != 'completed'").get().count,
    };
  }
}

module.exports = Task;
