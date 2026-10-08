import { NextRequest, NextResponse } from "next/server";
import { writeFileSync } from "fs";

export const runtime = "nodejs";

/** TEMP: save PDF generated in browser for stream validation. */
export async function POST(request: NextRequest) {
  try {
    const { base64 } = await request.json();
    const buf = Buffer.from(base64, "base64");
    writeFileSync("/tmp/pdf-browser-test.pdf", buf);
    return NextResponse.json({ ok: true, bytes: buf.length });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}