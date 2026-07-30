import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ status: null }, { status: 200 });
  }

  try {
    const [user] = await db
      .select({ status: users.status })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    return NextResponse.json(
      { status: user?.status ?? null },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ status: null }, { status: 200 });
  }
}
