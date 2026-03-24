const blessed = require('blessed');
const TaskService = require('../services/taskService');
const TimeTracker = require('../services/timeTracker');
const Project = require('../models/Project');
const { isValidDate } = require('../utils/validators');

// -- State --
let currentTasks = [];
let currentFilter = 'all';
const FILTERS = ['all', 'pending', 'in-progress', 'completed'];
let currentSearch = null;
let popupOpen = false;
let timerInterval = null;

// -- Blessed Tag Helpers --

function colorPriority(p) {
  if (p === 'high') return '{red-fg}{bold}HIGH{/bold}{/red-fg}';
  if (p === 'medium') return '{yellow-fg}MEDIUM{/yellow-fg}';
  return '{white-fg}LOW{/white-fg}';
}

function colorStatus(s) {
  if (s === 'completed') return '{green-fg}done{/green-fg}';
  if (s === 'in-progress') return '{blue-fg}active{/blue-fg}';
  return '{yellow-fg}pending{/yellow-fg}';
}

function plainPriority(p) {
  if (p === 'high') return 'HIGH';
  if (p === 'medium') return 'MEDIUM';
  return 'LOW';
}

function plainStatus(s) {
  if (s === 'completed') return 'done';
  if (s === 'in-progress') return 'active';
  return 'pending';
}

function deadlineLabel(d) {
  if (!d) return '-';
  var dl = new Date(d + 'T00:00:00');
  var now = new Date(); now.setHours(0,0,0,0);
  var diff = Math.ceil((dl - now) / 864e5);
  if (diff < 0) return d + ' !';
  if (diff === 0) return d + ' *';
  return d;
}

function colorDeadline(d) {
  if (!d) return '{white-fg}-{/white-fg}';
  var dl = new Date(d + 'T00:00:00');
  var now = new Date(); now.setHours(0,0,0,0);
  var diff = Math.ceil((dl - now) / 864e5);
  if (diff < 0) return '{red-fg}' + d + ' (overdue){/red-fg}';
  if (diff === 0) return '{red-fg}{bold}' + d + ' (today){/red-fg}{/bold}';
  if (diff <= 3) return '{yellow-fg}' + d + '{/yellow-fg}';
  return '{white-fg}' + d + '{/white-fg}';
}

function getElapsed(task) {
  if (!task.timer_started_at) return task.time_spent || 0;
  var extra = Math.floor((Date.now() - new Date(task.timer_started_at).getTime()) / 1000);
  return (task.time_spent || 0) + extra;
}

// -- Build Detail Content --

function buildDetail(task) {
  if (!task) return '{center}{gray-fg}No task selected{/gray-fg}{/center}';
  var tags = (task.tags || []).map(function(t) { return '{cyan-fg}#' + t.name + '{/cyan-fg}'; }).join(' ') || '{gray-fg}-{/gray-fg}';
  var timer = task.timer_started_at
    ? '{green-fg}Running{/green-fg} (' + TimeTracker.formatTime(getElapsed(task)) + ')'
    : '{gray-fg}Stopped{/gray-fg}';
  var lines = [
    '{bold}Task #' + task.id + '{/bold}',
    '{bold}' + task.title + '{/bold}',
    '{gray-fg}' + Array(27).join('-') + '{/gray-fg}',
    '',
    task.description ? 'Desc: ' + task.description : '',
    'Status:   ' + colorStatus(task.status),
    'Priority: ' + colorPriority(task.priority),
    'Deadline: ' + colorDeadline(task.deadline),
    'Project:  ' + (task.project_name ? '{magenta-fg}' + task.project_name + '{/magenta-fg}' : '{gray-fg}-{/gray-fg}'),
    'Tags:     ' + tags,
    task.github_issue ? 'GitHub:   {blue-fg}' + task.github_issue + '{/blue-fg}' : '',
    'Time:     ' + TimeTracker.formatTime(getElapsed(task)),
    'Timer:    ' + timer,
    '',
    '{gray-fg}Created:  ' + task.created_at + '{/gray-fg}',
    '{gray-fg}Updated:  ' + task.updated_at + '{/gray-fg}',
  ];
  return lines.filter(Boolean).join('\n');
}

// -- Build Table Rows --

function buildRows(tasks) {
  var header = ['ID', 'Title', 'Status', 'Priority', 'Project', 'Deadline', 'Time'];
  var rows = tasks.map(function(t) {
    var title = t.title.length > 24 ? t.title.slice(0, 22) + '..' : t.title;
    return [
      String(t.id),
      title,
      plainStatus(t.status),
      plainPriority(t.priority),
      t.project_name || '-',
      deadlineLabel(t.deadline),
      TimeTracker.formatTime(getElapsed(t)),
    ];
  });
  return [header].concat(rows);
}

// -- Launch Dashboard --

function launchDashboard() {
  var screen = blessed.screen({
    smartCSR: true,
    title: 'TaskCLI Dashboard',
    fullUnicode: true,
  });

  // -- Top Bar --
  var topBar = blessed.box({
    parent: screen,
    top: 0, left: 0, width: '100%', height: 3,
    border: { type: 'line' },
    tags: true,
    style: { border: { fg: 'cyan' } },
  });

  // -- Task List (left) --
  var taskList = blessed.listtable({
    parent: screen,
    top: 3, left: 0, width: '70%', height: '100%-6',
    border: { type: 'line' },
    label: ' Tasks ',
    tags: true,
    keys: true,
    vi: false,
    mouse: true,
    noCellBorders: true,
    pad: 1,
    scrollbar: { ch: ' ', style: { bg: 'blue' } },
    style: {
      border: { fg: 'cyan' },
      header: { bold: true, fg: 'white', bg: 'blue' },
      cell: { selected: { bg: 'blue', fg: 'white' } },
    },
  });

  // -- Detail Panel (right) --
  var detailPanel = blessed.box({
    parent: screen,
    top: 3, right: 0, width: '30%', height: '100%-6',
    border: { type: 'line' },
    label: ' Details ',
    tags: true,
    scrollable: true,
    padding: { left: 1, right: 1, top: 1 },
    style: { border: { fg: 'cyan' } },
  });

  // -- Bottom Bar --
  var bottomBar = blessed.box({
    parent: screen,
    bottom: 0, left: 0, width: '100%', height: 3,
    border: { type: 'line' },
    tags: true,
    style: { border: { fg: 'cyan' } },
  });

  // -- Prompt & Question widgets --
  var searchPrompt = blessed.prompt({
    parent: screen,
    top: 'center', left: 'center',
    width: '50%', height: 'shrink',
    border: { type: 'line' },
    label: ' Search ',
    tags: true,
    keys: true,
    vi: false,
    style: { border: { fg: 'yellow' } },
  });

  var confirmBox = blessed.question({
    parent: screen,
    top: 'center', left: 'center',
    width: '50%', height: 'shrink',
    border: { type: 'line' },
    label: ' Confirm ',
    tags: true,
    keys: true,
    vi: false,
    style: { border: { fg: 'red' } },
  });

  // -- Data Layer --

  function getSelectedTask() {
    var idx = taskList.selected - 1;
    if (idx >= 0 && idx < currentTasks.length) return currentTasks[idx];
    return null;
  }

  function refreshData() {
    if (currentSearch) {
      currentTasks = TaskService.searchTasks(currentSearch);
    } else if (currentFilter !== 'all') {
      currentTasks = TaskService.filterTasks({ status: currentFilter });
    } else {
      currentTasks = TaskService.getAllTasks();
    }

    var rows = buildRows(currentTasks);
    taskList.setData(rows);

    if (currentTasks.length > 0) {
      if (taskList.selected < 1) taskList.select(1);
    }

    updateDetail();

    var stats = TaskService.getStats();
    var filterLabel = currentSearch
      ? '{yellow-fg}Search: "' + currentSearch + '"{/yellow-fg}'
      : (currentFilter !== 'all' ? '{yellow-fg}Filter: ' + currentFilter + '{/yellow-fg}' : '{green-fg}All Tasks{/green-fg}');
    topBar.setContent(
      ' {bold}{cyan-fg}TaskCLI Dashboard{/cyan-fg}{/bold}' +
      '  |  Total:{bold}' + stats.total + '{/bold}' +
      '  Pending:{yellow-fg}' + stats.pending + '{/yellow-fg}' +
      '  Active:{blue-fg}' + stats.inProgress + '{/blue-fg}' +
      '  Done:{green-fg}' + stats.completed + '{/green-fg}' +
      (stats.overdue > 0 ? '  {red-fg}Overdue:' + stats.overdue + '{/red-fg}' : '') +
      '  |  ' + filterLabel
    );

    var fLabel = currentFilter === 'all' ? 'All' :
      currentFilter === 'pending' ? 'Pending' :
      currentFilter === 'in-progress' ? 'Active' : 'Done';
    bottomBar.setContent(
      ' {bold}a{/bold}:Add  {bold}e{/bold}:Edit  {bold}d{/bold}:Delete  {bold}c{/bold}:Complete  {bold}t{/bold}:Timer' +
      '  {bold}s{/bold}:Search  {bold}f{/bold}:Filter[' + fLabel + ']  {bold}Esc{/bold}:Clear  {bold}q{/bold}:Quit'
    );

    screen.render();
  }

  function updateDetail() {
    var task = getSelectedTask();
    detailPanel.setContent(buildDetail(task));
    screen.render();
  }

  // -- Keyboard Handlers --

  screen.key(['q', 'C-c'], function() {
    if (popupOpen) return;
    doCleanup();
  });

  screen.key(['escape'], function() {
    if (popupOpen) return;
    if (currentSearch) {
      currentSearch = null;
      refreshData();
    } else {
      doCleanup();
    }
  });

  function doCleanup() {
    if (timerInterval) clearInterval(timerInterval);
    screen.destroy();
    process.exit(0);
  }

  taskList.key(['up', 'down', 'pageup', 'pagedown', 'home', 'end'], function() {
    process.nextTick(function() { updateDetail(); });
  });

  // Complete toggle
  screen.key(['c'], function() {
    if (popupOpen) return;
    var task = getSelectedTask();
    if (!task) return;
    TaskService.completeTask(task.id);
    refreshData();
  });

  // Timer toggle
  screen.key(['t'], function() {
    if (popupOpen) return;
    var task = getSelectedTask();
    if (!task) return;
    if (task.timer_started_at) {
      TimeTracker.stopTimer(task.id);
    } else {
      TimeTracker.startTimer(task.id);
    }
    refreshData();
  });

  // Filter cycle
  screen.key(['f'], function() {
    if (popupOpen) return;
    currentSearch = null;
    var idx = FILTERS.indexOf(currentFilter);
    currentFilter = FILTERS[(idx + 1) % FILTERS.length];
    refreshData();
  });

  // Search
  screen.key(['s', '/'], function() {
    if (popupOpen) return;
    popupOpen = true;
    searchPrompt.input('Search tasks:', currentSearch || '', function(err, value) {
      popupOpen = false;
      if (err || value === null || value === undefined) {
        taskList.focus();
        screen.render();
        return;
      }
      currentSearch = value.trim() || null;
      currentFilter = 'all';
      refreshData();
      taskList.focus();
    });
  });

  // Delete
  screen.key(['d'], function() {
    if (popupOpen) return;
    var task = getSelectedTask();
    if (!task) return;
    popupOpen = true;
    confirmBox.ask('Delete task #' + task.id + ' "' + task.title + '"?', function(err, ok) {
      popupOpen = false;
      if (ok) {
        TaskService.deleteTask(task.id);
        refreshData();
      }
      taskList.focus();
      screen.render();
    });
  });

  // -- Add / Edit Form --

  function showTaskForm(existingTask) {
    popupOpen = true;
    var isEdit = !!existingTask;

    var formBox = blessed.box({
      parent: screen,
      top: 'center', left: 'center',
      width: '65%', height: '85%',
      border: { type: 'line' },
      label: isEdit ? ' Edit Task ' : ' Add Task ',
      tags: true,
      padding: { left: 1, right: 1 },
      style: { border: { fg: 'green' } },
    });

    var fields = [];
    var currentField = 0;

    var fieldDefs = [
      { label: 'Title',                      val: isEdit ? existingTask.title : '' },
      { label: 'Description',                val: isEdit ? (existingTask.description || '') : '' },
      { label: 'Priority (low/medium/high)', val: isEdit ? existingTask.priority : 'medium' },
      { label: 'Deadline (YYYY-MM-DD)',       val: isEdit ? (existingTask.deadline || '') : '' },
      { label: 'Project',                    val: isEdit ? (existingTask.project_name || '') : '' },
      { label: 'Tags (comma-separated)',      val: isEdit ? (existingTask.tags || []).map(function(t) { return t.name; }).join(', ') : '' },
      { label: 'GitHub Issue URL',            val: isEdit ? (existingTask.github_issue || '') : '' },
    ];

    fieldDefs.forEach(function(fd, i) {
      blessed.text({
        parent: formBox,
        top: i * 3, left: 0,
        content: fd.label + ':',
        tags: true,
        style: { bold: true },
      });

      var tb = blessed.textbox({
        parent: formBox,
        top: i * 3 + 1, left: 0,
        width: '100%-4', height: 1,
        inputOnFocus: false,
        style: {
          fg: 'white',
          bg: 'black',
          focus: { bg: 'blue', fg: 'white' },
        },
        value: fd.val,
      });

      fields.push(tb);
    });

    var instrTop = fieldDefs.length * 3 + 1;
    blessed.text({
      parent: formBox,
      top: instrTop, left: 0,
      tags: true,
      content: '{gray-fg}Tab: next field | Enter: edit field | Ctrl-S: save | Escape: cancel{/gray-fg}',
    });

    function focusField(idx) {
      currentField = idx;
      fields.forEach(function(f, i) {
        if (i === idx) {
          f.style.bg = 'blue';
          f.style.fg = 'white';
        } else {
          f.style.bg = 'black';
          f.style.fg = 'white';
        }
      });
      fields[idx].focus();
      screen.render();
    }

    function closeForm() {
      formBox.destroy();
      popupOpen = false;
      taskList.focus();
      screen.render();
    }

    function saveForm() {
      var values = fields.map(function(f) { return f.getValue(); });
      var title = values[0];
      var description = values[1];
      var priority = values[2];
      var deadline = values[3];
      var projectName = values[4];
      var tagsStr = values[5];
      var github = values[6];

      if (!title.trim()) {
        fields[0].style.bg = 'red';
        screen.render();
        setTimeout(function() { fields[0].style.bg = 'blue'; screen.render(); }, 500);
        return;
      }

      var validPriority = ['low', 'medium', 'high'].indexOf(priority.trim().toLowerCase()) >= 0
        ? priority.trim().toLowerCase() : 'medium';

      var tags = tagsStr ? tagsStr.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];

      if (isEdit) {
        TaskService.updateTask(existingTask.id, {
          title: title.trim(),
          description: description.trim(),
          priority: validPriority,
          deadline: deadline.trim() || null,
          projectName: projectName.trim() || null,
          tags: tags,
          githubIssue: github.trim() || null,
        });
      } else {
        TaskService.createTask({
          title: title.trim(),
          description: description.trim(),
          priority: validPriority,
          deadline: deadline.trim() || null,
          projectName: projectName.trim() || null,
          tags: tags,
          githubIssue: github.trim() || null,
        });
      }

      closeForm();
      refreshData();
    }

    fields.forEach(function(tb, i) {
      tb.key(['tab'], function() {
        focusField((i + 1) % fields.length);
      });
      tb.key(['S-tab'], function() {
        focusField((i - 1 + fields.length) % fields.length);
      });
      tb.key(['escape'], function() {
        closeForm();
      });
      tb.key(['C-s'], function() {
        saveForm();
      });
      tb.key(['enter'], function() {
        tb.readInput();
      });
    });

    formBox.key(['escape'], function() { closeForm(); });
    formBox.key(['C-s'], function() { saveForm(); });

    focusField(0);
    screen.render();
  }

  // Add task
  screen.key(['a'], function() {
    if (popupOpen) return;
    showTaskForm(null);
  });

  // Edit task
  screen.key(['e'], function() {
    if (popupOpen) return;
    var task = getSelectedTask();
    if (!task) return;
    var full = TaskService.getTaskWithTags(task.id);
    showTaskForm(full);
  });

  // -- Timer Interval --
  timerInterval = setInterval(function() {
    var hasActiveTimer = currentTasks.some(function(t) { return t.timer_started_at; });
    if (hasActiveTimer) {
      taskList.setData(buildRows(currentTasks));
      updateDetail();
    }
  }, 1000);

  // -- Initial Load --
  refreshData();
  taskList.focus();
  screen.render();
}

module.exports = launchDashboard;
