
const express = require("express");

const app = express();
app.use(express.json());

let tasks = [];
let nextId = 1;

// Get all tasks
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// Create a task
app.post("/tasks", (req, res) => {
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Array.isArray(req.body)
  ) {
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

  const task = {
    id: nextId++,
    title: title.trim(),
    completed: false
  };

  tasks.push(task);

  return res.status(201).json(task);
});

// Get a task by ID
app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "Task ID must be a positive integer"
    });
  }

  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  return res.json(task);
});

// Delete a task by ID
app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "Task ID must be a positive integer"
    });
  }

  const index = tasks.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  tasks.splice(index, 1);

  return res.status(204).end();
});

// Handle malformed JSON requests
app.use((err, req, res, next) => {
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      error: "Invalid JSON request body"
    });
  }

  return next(err);
});

module.exports = app;
