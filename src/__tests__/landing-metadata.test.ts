import { describe, expect, it } from "vitest";
import { metadata } from "@/app/page";

describe("metadata halaman depan", () => {
  it("mengikuti janji hero, tanpa klaim lolos ATS", () => {
    const title = typeof metadata.title === "object" && metadata.title && "absolute" in metadata.title ? metadata.title.absolute : metadata.title;
    expect(String(title)).toContain("belum dipanggil");
    const text = `${String(title)} ${metadata.description}`;
    expect(text).not.toMatch(/lolos ATS|ATS-friendly|dijamin|pasti/i);
    expect(metadata.alternates?.canonical).toBeTruthy();
  });
});
