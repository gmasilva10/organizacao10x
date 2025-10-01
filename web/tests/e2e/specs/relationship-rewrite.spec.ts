import { expect, test } from "@playwright/test";
import { TEST_CONFIG } from "../fixtures/test-config";

test.describe("legacy relacionamento rewrite", () => {
  test("serves new relationship health endpoint", async ({ request }) => {
    const response = await request.get("/api/relacionamento/_health", {
      timeout: TEST_CONFIG.API_TIMEOUT,
    });

    expect(response.status(), "status code").toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");

    const payload = await response.json();
    expect(payload).toEqual({ status: "ok" });
  });
});
