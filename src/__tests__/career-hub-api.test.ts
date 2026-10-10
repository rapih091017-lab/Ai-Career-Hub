import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() } }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));

describe("Career Hub public API visibility", () => {
  it("public detail returns not found when post is a draft", async () => {
    const { db } = await import("@/db");
    const chain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
    chain.from.mockReturnValue(chain); chain.where.mockReturnValue(chain); chain.limit.mockResolvedValue([]);
    vi.mocked(db.select).mockReturnValue(chain as never);
    const { GET } = await import("@/app/api/career-hub/[slug]/route");
    const response = await GET(new Request("http://localhost/api/career-hub/draft") as never, { params: Promise.resolve({ slug: "draft" }) });
    expect(response.status).toBe(404);
  });

  it("rejects invalid search filters before querying", async () => {
    const { db } = await import("@/db");
    vi.mocked(db.select).mockClear();
    const { GET } = await import("@/app/api/career-hub/route");
    const request = { nextUrl: new URL("http://localhost/api/career-hub?page=0") };
    const response = await GET(request as never);
    expect(response.status).toBe(400);
    expect(db.select).not.toHaveBeenCalled();
  });
});
