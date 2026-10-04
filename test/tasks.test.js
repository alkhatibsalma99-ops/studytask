const test = require("node:test");
const assert = require("node:assert/strict");
const taskStore = require("../src/taskStore");
const app = require("../server");

let server;
let baseUrl;

function postTasks(rawBody) {
  return fetch(`${baseUrl}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: rawBody
  }).then(async (res) => ({ status: res.status, body: await res.json() }));
}

function postTask(body) {
  return postTasks(JSON.stringify(body));
}

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise((resolve) => server.close(resolve)));

test.beforeEach(() => taskStore.reset());

test("creates a task and returns 201", async () => {
  const { status, body } = await postTask({
    title: "Finish calculus homework",
    deadline: "2026-10-10T23:59"
  });

  assert.equal(status, 201);
  assert.equal(body.title, "Finish calculus homework");
  assert.equal(body.deadline, new Date("2026-10-10T23:59").toISOString());
  assert.equal(body.completed, false);
  assert.equal(typeof body.id, "number");
  assert.equal(typeof body.createdAt, "string");
});

test("keeps the created task in memory", async () => {
  const created = await postTask({ title: "Read chapter 4", deadline: "2026-10-11" });

  const stored = taskStore.listTasks();

  assert.equal(stored.length, 1);
  assert.deepEqual(stored[0], created.body);
});

test("assigns unique ids to each task", async () => {
  const first = await postTask({ title: "Task A", deadline: "2026-10-10" });
  const second = await postTask({ title: "Task B", deadline: "2026-10-11" });

  assert.notEqual(first.body.id, second.body.id);
  assert.equal(taskStore.listTasks().length, 2);
});

test("trims surrounding whitespace from the title", async () => {
  const { status, body } = await postTask({ title: "  Revise notes  ", deadline: "2026-10-10" });

  assert.equal(status, 201);
  assert.equal(body.title, "Revise notes");
});

test("rejects a missing title with a clear error", async () => {
  const { status, body } = await postTask({ deadline: "2026-10-10" });

  assert.equal(status, 400);
  assert.deepEqual(body.error, ["Title is required and must be a non-empty string."]);
  assert.equal(taskStore.listTasks().length, 0);
});

test("rejects an empty or whitespace-only title", async () => {
  for (const title of ["", "   ", "\t\n"]) {
    const { status, body } = await postTask({ title, deadline: "2026-10-10" });

    assert.equal(status, 400);
    assert.deepEqual(body.error, ["Title is required and must be a non-empty string."]);
  }

  assert.equal(taskStore.listTasks().length, 0);
});

test("rejects a non-string title", async () => {
  for (const title of [42, null, true, { text: "nope" }, ["list"]]) {
    const { status, body } = await postTask({ title, deadline: "2026-10-10" });

    assert.equal(status, 400);
    assert.deepEqual(body.error, ["Title is required and must be a non-empty string."]);
  }
});

test("rejects a title longer than the maximum", async () => {
  const { status, body } = await postTask({ title: "a".repeat(201), deadline: "2026-10-10" });

  assert.equal(status, 400);
  assert.deepEqual(body.error, ["Title must be at most 200 characters."]);
});

test("rejects a missing deadline", async () => {
  const { status, body } = await postTask({ title: "Lab report" });

  assert.equal(status, 400);
  assert.deepEqual(body.error, [
    'Deadline is required and must be a date string, for example "2026-10-10T23:59".'
  ]);
});

test("rejects an unparsable deadline", async () => {
  const { status, body } = await postTask({ title: "Lab report", deadline: "next friday" });

  assert.equal(status, 400);
  assert.deepEqual(body.error, ['Deadline "next friday" is not a valid date.']);
});

test("reports every invalid field at once", async () => {
  const { status, body } = await postTask({ title: "", deadline: "not-a-date" });

  assert.equal(status, 400);
  assert.equal(body.error.length, 2);
  assert.deepEqual(body.error, [
    "Title is required and must be a non-empty string.",
    'Deadline "not-a-date" is not a valid date.'
  ]);
});

test("rejects a body that is not a JSON object", async () => {
  const { status, body } = await postTasks("[]");

  assert.equal(status, 400);
  assert.deepEqual(body.error, ["Request body must be a JSON object."]);
});

test("rejects malformed JSON with a clear error", async () => {
  const { status, body } = await postTasks("{ not json");

  assert.equal(status, 400);
  assert.deepEqual(body.error, ["Request body must be valid JSON."]);
});

test("the root endpoint still responds", async () => {
  const res = await fetch(`${baseUrl}/`);
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(body, { message: "StudyTask API is running" });
});
