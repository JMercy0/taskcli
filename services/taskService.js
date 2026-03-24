const Task = require('../models/Task');
const Project = require('../models/Project');
const Tag = require('../models/Tag');

class TaskService {
  static createTask({ title, description, priority, deadline, projectName, tags, githubIssue }) {
    let project_id = null;
    if (projectName) {
      const project = Project.findOrCreate(projectName);
      project_id = project.id;
    }

    const task = Task.create({
      title,
      description,
      priority,
      deadline,
      project_id,
      github_issue: githubIssue,
    });

    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const tag = Tag.findOrCreate(tagName.trim());
        Tag.addTagToTask(task.id, tag.id);
      }
    }

    return this.getTaskWithTags(task.id);
  }

  static getTaskWithTags(id) {
    const task = Task.findById(id);
    if (!task) return null;
    task.tags = Tag.getTagsForTask(id);
    return task;
  }

  static getAllTasks() {
    const tasks = Task.getAll();
    return tasks.map(task => {
      task.tags = Tag.getTagsForTask(task.id);
      return task;
    });
  }

  static updateTask(id, updates) {
    const task = Task.findById(id);
    if (!task) return null;

    const fields = {};

    if (updates.title !== undefined) fields.title = updates.title;
    if (updates.description !== undefined) fields.description = updates.description;
    if (updates.priority !== undefined) fields.priority = updates.priority;
    if (updates.deadline !== undefined) fields.deadline = updates.deadline;
    if (updates.status !== undefined) fields.status = updates.status;
    if (updates.githubIssue !== undefined) fields.github_issue = updates.githubIssue;

    if (updates.projectName !== undefined) {
      if (updates.projectName) {
        const project = Project.findOrCreate(updates.projectName);
        fields.project_id = project.id;
      } else {
        fields.project_id = null;
      }
    }

    if (Object.keys(fields).length > 0) {
      Task.update(id, fields);
    }

    if (updates.tags !== undefined) {
      Tag.removeAllTagsFromTask(id);
      if (updates.tags && updates.tags.length > 0) {
        for (const tagName of updates.tags) {
          const tag = Tag.findOrCreate(tagName.trim());
          Tag.addTagToTask(id, tag.id);
        }
      }
    }

    return this.getTaskWithTags(id);
  }

  static deleteTask(id) {
    const task = Task.findById(id);
    if (!task) return null;
    Tag.removeAllTagsFromTask(id);
    Task.delete(id);
    return task;
  }

  static completeTask(id) {
    const task = Task.findById(id);
    if (!task) return null;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    if (newStatus === 'completed' && task.timer_started_at) {
      const elapsed = Math.floor((Date.now() - new Date(task.timer_started_at).getTime()) / 1000);
      Task.update(id, {
        status: newStatus,
        time_spent: (task.time_spent || 0) + elapsed,
        timer_started_at: null,
      });
    } else {
      Task.update(id, { status: newStatus });
    }

    return this.getTaskWithTags(id);
  }

  static filterTasks(filters) {
    const tasks = Task.filter(filters);
    return tasks.map(task => {
      task.tags = Tag.getTagsForTask(task.id);
      return task;
    });
  }

  static searchTasks(query) {
    const tasks = Task.search(query);
    return tasks.map(task => {
      task.tags = Tag.getTagsForTask(task.id);
      return task;
    });
  }

  static getStats() {
    return Task.getStats();
  }
}

module.exports = TaskService;
