const express = require("express");

const app = express();
app.use(express.json());

let tasks = [];
let nextId = 1;

app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.post("/tasks", (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({
      error: "A valid task title is required"
    });
  }

  const task = {
    id: nextId++,
    title: title.trim(),
    completed: false
  };

  tasks.push(task);
  res.status(201).json(task);
});

app.get("/tasks/:id", (req, res) => {
  const task = tasks.find(item => item.id === Number(req.params.id));

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const index = tasks.findIndex(
    item => item.id === Number(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  tasks.splice(index, 1);
  res.status(204).end();
});

if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
  return res.status(400).json({
    error: "Request body must be a valid JSON object"
  });
}

const { title } = req.body;

if (
  typeof title !== "string" ||
  !title.trim() ||
  title.trim().length > 100
) {
  return res.status(400).json({
    error: "Title must be a non-empty string of at most 100 characters"
  });
}

module.exports = app;
