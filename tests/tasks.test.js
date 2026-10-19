const request = require("supertest");
const app = require("../app");

describe("Task API", () => {
  // GET all tasks
  test("GET /tasks returns an array", async () => {
    const response = await request(app).get("/tasks");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // Create tasks
  test("POST /tasks creates a task", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({ title: "Assessment task" });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Assessment task");
    expect(response.body.completed).toBe(false);
    expect(response.body.id).toEqual(expect.any(Number));
  });

  test("POST /tasks rejects an empty title", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({ title: "   " });

    expect(response.status).toBe(400);
  });

  test("POST /tasks rejects a non-string title", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({ title: 123 });

    expect(response.status).toBe(400);
  });

  test("POST /tasks accepts a title of exactly 100 characters", async () => {
    const title = "a".repeat(100);

    const response = await request(app)
      .post("/tasks")
      .send({ title });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe(title);
    expect([...response.body.title]).toHaveLength(100);
  });

  test("POST /tasks rejects a title of 101 characters", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({ title: "a".repeat(101) });

    expect(response.status).toBe(400);
  });

  test("POST /tasks rejects an array as the request body", async () => {
    const response = await request(app)
      .post("/tasks")
      .send([{ title: "Invalid task" }]);

    expect(response.status).toBe(400);
  });

  test("POST /tasks returns 400 for malformed JSON", async () => {
    const response = await request(app)
      .post("/tasks")
      .set("Content-Type", "application/json")
      .send('{"title":');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid JSON request body");
  });

  // Get task by ID
  test.each(["1e0", "0x1", "0", "-1", "abc"])(
    "GET /tasks/%s rejects an invalid ID",
    async (id) => {
      const response = await request(app).get(`/tasks/${id}`);

      expect(response.status).toBe(400);
    }
  );

  test("GET /tasks/:id returns a task that exists", async () => {
    const created = await request(app)
      .post("/tasks")
      .send({ title: "Task to retrieve" });

    const response = await request(app)
      .get(`/tasks/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(created.body.id);
    expect(response.body.title).toBe("Task to retrieve");
  });

  test("GET /tasks/:id returns 404 for a missing task", async () => {
    const response = await request(app).get("/tasks/999999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });

  // Delete tasks
  test("DELETE /tasks/:id deletes an existing task", async () => {
    const created = await request(app)
      .post("/tasks")
      .send({ title: "Task to delete" });

    const response = await request(app)
      .delete(`/tasks/${created.body.id}`);

    expect(response.status).toBe(204);
    expect(response.text).toBe("");

    const lookup = await request(app)
      .get(`/tasks/${created.body.id}`);

    expect(lookup.status).toBe(404);
  });

  test("DELETE /tasks/:id returns 404 for a missing task", async () => {
    const response = await request(app).delete("/tasks/999999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Task not found");
  });

  test("DELETE /tasks/:id rejects an invalid ID", async () => {
    const response = await request(app).delete("/tasks/1e0");

    expect(response.status).toBe(400);
  });
});
