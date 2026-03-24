const { getConnection } = require('../database/connection');

class Tag {
  static create(name) {
    const db = getConnection();
    const stmt = db.prepare('INSERT INTO tags (name) VALUES (?)');
    const result = stmt.run(name.toLowerCase());
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const db = getConnection();
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
  }

  static findByName(name) {
    const db = getConnection();
    return db.prepare('SELECT * FROM tags WHERE name = ?').get(name.toLowerCase());
  }

  static findOrCreate(name) {
    let tag = this.findByName(name);
    if (!tag) {
      tag = this.create(name);
    }
    return tag;
  }

  static getAll() {
    const db = getConnection();
    return db.prepare('SELECT * FROM tags ORDER BY name').all();
  }

  static getTagsForTask(taskId) {
    const db = getConnection();
    return db.prepare(`
      SELECT t.* FROM tags t
      JOIN task_tags tt ON t.id = tt.tag_id
      WHERE tt.task_id = ?
      ORDER BY t.name
    `).all(taskId);
  }

  static addTagToTask(taskId, tagId) {
    const db = getConnection();
    const stmt = db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)');
    return stmt.run(taskId, tagId);
  }

  static removeTagFromTask(taskId, tagId) {
    const db = getConnection();
    return db.prepare('DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?').run(taskId, tagId);
  }

  static removeAllTagsFromTask(taskId) {
    const db = getConnection();
    return db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(taskId);
  }
}

module.exports = Tag;
