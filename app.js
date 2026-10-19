
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
  const trimmedTitle =
    typeof title === "string" ? title.trim() : "";

  if (
    typeof title !== "string" ||
    !trimmedTitle ||
    [...trimmedTitle].length > 100
  ) {
    return res.status(400).json({
      error: "Title must be a non-empty string of at most 100 characters"
    });
  }

  const task = {
    id: nextId++,
    title: trimmedTitle,
    completed: false
  };

  tasks.push(task);

  return res.status(201).json(task);
});

// Validate task IDs consistently for GET and DELETE
function parseTaskId(rawId) {
  if (!/^[1-9]\d*$/.test(rawId)) {
    return null;
  }

  const id = Number(rawId);

  if (!Number.isSafeInteger(id)) {
    return null;
  }

  return id;
}

// Get a task by ID
app.get("/tasks/:id", (req, res) => {
  const id = parseTaskId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "Task ID must be a positive safe integer"
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
  const id = parseTaskId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: "Task ID must be a positive safe integer"
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
