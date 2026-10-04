const express = require("express");
const taskStore = require("./src/taskStore");
const { validateNewTask } = require("./src/validation");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "StudyTask API is running"
  });
});

app.post("/tasks", (req, res) => {
  const { errors, value } = validateNewTask(req.body);

  if (errors) {
    return res.status(400).json({ error: errors });
  }

  return res.status(201).json(taskStore.createTask(value));
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: ["Request body must be valid JSON."] });
  }

  console.error(err);

  return res.status(500).json({ error: ["Internal server error."] });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`StudyTask running on http://localhost:${PORT}`);
  });
}
