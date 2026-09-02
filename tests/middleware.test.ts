// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import middleware from "@/middleware";

describe("Admin route protection — /admin/* middleware", () => {
  beforeAll(() => {
    process.env.NEXTAUTH_SECRET ??= "test-only-secret";
  });

  it("redirects an unauthenticated request to /admin/dashboard to /admin/login", async () => {
    const req = new NextRequest("http://localhost/admin/dashboard");
    const res = await middleware(req as never, {} as never);
    expect(res).toBeTruthy();
    expect(res!.status).toBe(307);
    const location = res!.headers.get("location");
    expect(location).toContain("/admin/login");
  });

  it("does not protect /admin/login itself (matcher excludes it)", async () => {
    // The matcher config is what actually excludes /admin/login from invoking this
    // middleware in Next.js routing; verified directly against the exported config.
    const { config } = await import("@/middleware");
    expect(config.matcher).toEqual(["/admin/((?!login).*)"]);
    expect("/admin/login").not.toMatch(/^\/admin\/((?!login).*)$/);
    expect("/admin/dashboard").toMatch(/^\/admin\/((?!login).*)$/);
  });
});
