const tasks = [];
let nextId = 1;

function createTask({ title, deadline }) {
  const task = {
    id: nextId++,
    title,
    deadline,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(task);

  return task;
}

function listTasks() {
  return tasks;
}

function reset() {
  tasks.length = 0;
  nextId = 1;
}

module.exports = { createTask, listTasks, reset };
