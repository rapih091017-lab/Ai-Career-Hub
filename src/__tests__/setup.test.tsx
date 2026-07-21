import { describe, it, expect } from "vitest";

describe("Project setup", () => {
  it("should have proper environment", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
  });

  it("should handle basic math", () => {
    expect(1 + 1).toBe(2);
  });
});
