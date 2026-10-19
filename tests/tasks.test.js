const request = require("supertest");
const app = require("../app");

describe("Task API", () => {
  describe("GET /tasks", () => {
    test("returns an array of tasks", async () => {
      const response = await request(app).get("/tasks");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("POST /tasks", () => {
    test("creates a task with a trimmed title and ID", async () => {
      const response = await request(app)
        .post("/tasks")
        .send({ title: "  Assessment task  " });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        title: "Assessment task",
        completed: false,
      });
    });

    test("persists the created task for subsequent GET requests", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({ title: "Persistence test" });

      expect(created.status).toBe(201);

      const fetched = await request(app).get(
        `/tasks/${created.body.id}`
      );

      expect(fetched.status).toBe(200);
      expect(fetched.body).toEqual(created.body);
    });

    test("rejects an empty title", async () => {
      const response = await request(app)
        .post("/tasks")
        .send({ title: "   " });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Title must be a non-empty string of at most 100 characters"
      );
    });

    test("rejects a missing title", async () => {
      const response = await request(app)
        .post("/tasks")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Title must be a non-empty string of at most 100 characters"
      );
    });

    test("rejects a non-string title", async () => {
      const response = await request(app)
        .post("/tasks")
        .send({ title: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Title must be a non-empty string of at most 100 characters"
      );
    });

    test("rejects an array request body", async () => {
      const response = await request(app)
        .post("/tasks")
        .send([{ title: "Invalid task" }]);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Request body must be a valid JSON object"
      );
    });

    test("accepts a title containing exactly 100 characters", async () => {
      const title = "a".repeat(100);

      const response = await request(app)
        .post("/tasks")
        .send({ title });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(title);
      expect([...response.body.title]).toHaveLength(100);
    });

    test("rejects a title containing 101 characters", async () => {
      const response = await request(app)
        .post("/tasks")
        .send({ title: "a".repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Title must be a non-empty string of at most 100 characters"
      );
    });

    test("trims whitespace before validating title length", async () => {
      const title = " ".repeat(5) + "a".repeat(100) + " ".repeat(5);

      const response = await request(app)
        .post("/tasks")
        .send({ title });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe("a".repeat(100));
      expect([...response.body.title]).toHaveLength(100);
    });

    test("rejects malformed JSON with a clear error", async () => {
      const response = await request(app)
        .post("/tasks")
        .set("Content-Type", "application/json")
        .send('{"title":');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Invalid JSON request body"
      );
    });
  });

  describe("GET /tasks/:id", () => {
    test.each(["abc", "1e0", "0x1", "0", "-1", "1.5"])(
      "rejects invalid task ID: %s",
      async (id) => {
        const response = await request(app).get(`/tasks/${id}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(
          "Task ID must be a positive safe integer"
        );
      }
    );

    test("returns an existing task", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({ title: "Retrieve task" });

      const response = await request(app).get(
        `/tasks/${created.body.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(created.body);
    });

    test("returns 404 when a task does not exist", async () => {
      const response = await request(app).get("/tasks/999999");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Task not found");
    });
  });

  describe("DELETE /tasks/:id", () => {
    test("deletes an existing task", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({ title: "Delete task" });

      const id = created.body.id;

      const deleted = await request(app).delete(`/tasks/${id}`);

      expect(deleted.status).toBe(204);
      expect(deleted.text).toBe("");

      const fetched = await request(app).get(`/tasks/${id}`);

      expect(fetched.status).toBe(404);
      expect(fetched.body.error).toBe("Task not found");
    });

    test("returns 404 when deleting a nonexistent task", async () => {
      const response = await request(app).delete("/tasks/999999");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Task not found");
    });

    test("rejects an invalid task ID", async () => {
      const response = await request(app).delete("/tasks/1e0");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Task ID must be a positive safe integer"
      );
    });
  });
});
