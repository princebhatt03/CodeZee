
const express = require("express");

const app = express();

app.use(express.json());

let tasks = [];
let nextId = 1;

const TITLE_ERROR =
  "Title must be a non-empty string of at most 100 characters";

const BODY_ERROR = "Request body must be a valid JSON object";

const ID_ERROR = "Task ID must be a positive safe integer";

// Validate and normalize a task title.
function validateTitle(title) {
  if (typeof title !== "string") {
    return null;
  }

  const trimmedTitle = title.trim();

  if (!trimmedTitle || [...trimmedTitle].length > 100) {
    return null;
  }

  return trimmedTitle;
}

// Parse positive decimal task IDs safely.
function parseTaskId(rawId) {
  if (
    typeof rawId !== "string" ||
    !/^[1-9]\d*$/.test(rawId)
  ) {
    return null;
  }

  const id = Number(rawId);

  return Number.isSafeInteger(id) ? id : null;
}

// Validate that a request body is a JSON object.
function isValidBody(body) {
  return (
    body !== null &&
    typeof body === "object" &&
    !Array.isArray(body)
  );
}

// Get all tasks.
app.get("/tasks", (req, res) => {
  return res.status(200).json(tasks);
});

// Create a task.
app.post("/tasks", (req, res) => {
  if (!isValidBody(req.body)) {
    return res.status(400).json({
      error: BODY_ERROR
    });
  }

  const title = validateTitle(req.body.title);

  if (title === null) {
    return res.status(400).json({
      error: TITLE_ERROR
    });
  }

  const task = {
    id: nextId++,
    title,
    completed: false
  };

  tasks.push(task);

  return res.status(201).json(task);
});

// Get a task by ID.
app.get("/tasks/:id", (req, res) => {
  const id = parseTaskId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: ID_ERROR
    });
  }

  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  return res.status(200).json(task);
});

// Update a task's title, completion status, or both.
app.put("/tasks/:id", (req, res) => {
  const id = parseTaskId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: ID_ERROR
    });
  }

  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return res.status(404).json({
      error: "Task not found"
    });
  }

  if (!isValidBody(req.body)) {
    return res.status(400).json({
      error: BODY_ERROR
    });
  }

  const fields = Object.keys(req.body);

  if (
    fields.length === 0 ||
    fields.some(
      (field) => !["title", "completed"].includes(field)
    )
  ) {
    return res.status(400).json({
      error: "Provide title, completed, or both fields"
    });
  }

  // Validate all supplied fields before changing the task.
  let updatedTitle = task.title;
  let updatedCompleted = task.completed;

  if (Object.hasOwn(req.body, "title")) {
    updatedTitle = validateTitle(req.body.title);

    if (updatedTitle === null) {
      return res.status(400).json({
        error: TITLE_ERROR
      });
    }
  }

  if (Object.hasOwn(req.body, "completed")) {
    if (typeof req.body.completed !== "boolean") {
      return res.status(400).json({
        error: "Completed must be a boolean"
      });
    }

    updatedCompleted = req.body.completed;
  }

  task.title = updatedTitle;
  task.completed = updatedCompleted;

  return res.status(200).json(task);
});

// Delete a task by ID.
app.delete("/tasks/:id", (req, res) => {
  const id = parseTaskId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: ID_ERROR
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

// Handle malformed JSON request bodies.
app.use((err, req, res, next) => {
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    Object.hasOwn(err, "body")
  ) {
    return res.status(400).json({
      error: "Invalid JSON request body"
    });
  }

  return next(err);
});

module.exports = app;
