const request = require("supertest");
const { app } = require("../../index");

describe("Backend health", () => {
  test("GET /api/health returns healthy response", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Backend is healthy",
    });
  });
});
