const { getConnection } = require('../database/connection');

class Project {
  static create(name) {
    const db = getConnection();
    const stmt = db.prepare('INSERT INTO projects (name) VALUES (?)');
    const result = stmt.run(name);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const db = getConnection();
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  }

  static findByName(name) {
    const db = getConnection();
    return db.prepare('SELECT * FROM projects WHERE name = ?').get(name);
  }

  static findOrCreate(name) {
    let project = this.findByName(name);
    if (!project) {
      project = this.create(name);
    }
    return project;
  }

  static getAll() {
    const db = getConnection();
    return db.prepare('SELECT * FROM projects ORDER BY name').all();
  }

  static delete(id) {
    const db = getConnection();
    return db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }
}

module.exports = Project;
