
const request = require("supertest");
const app = require("../app");

describe("Task API", () => {
  test("GET /tasks returns an array", async () => {
    const response = await request(app).get("/tasks");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("POST /tasks creates a task", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({ title: "Assessment task" });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Assessment task");
    expect(response.body.completed).toBe(false);
  });

  test("POST /tasks rejects an empty title", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({ title: "   " });

    expect(response.status).toBe(400);
  });

  test("POST /tasks rejects a title longer than 100 characters", async () => {
    const response = await request(app)
      .post("/tasks")
      .send({ title: "a".repeat(101) });

    expect(response.status).toBe(400);
  });

  test("GET /tasks/:id rejects a malformed ID", async () => {
    const response = await request(app).get("/tasks/1e0");

    expect(response.status).toBe(400);
  });

  test("GET /tasks/:id returns 404 for a missing task", async () => {
    const response = await request(app).get("/tasks/999999");

    expect(response.status).toBe(404);
  });
});
