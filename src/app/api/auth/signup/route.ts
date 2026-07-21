import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { name, email, confirmEmail, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Email dan password harus diisi" },
        { status: 400 }
      );
    }

    // ── Confirm email check ──
    if (email !== confirmEmail) {
      return NextResponse.json(
        { error: "EMAIL_MISMATCH", message: "Email dan konfirmasi email tidak cocok." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Format email tidak valid" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "EMAIL_EXISTS", message: "Email sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    await db.insert(users).values({
      name: name || email.split("@")[0],
      email: email.toLowerCase(),
      passwordHash,
      status: "pending",
    });

    return NextResponse.json(
      { message: "Akun berhasil dibuat! Silakan tunggu konfirmasi admin sebelum login." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
