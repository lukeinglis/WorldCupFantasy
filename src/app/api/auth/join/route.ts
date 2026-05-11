import { NextResponse } from "next/server";
import { getUser, createUser, type UserRecord } from "@/lib/storage";
import { generateId } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = body as {
      name?: string;
      email?: string;
    };

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Check if user already exists with that name
    const existing = await getUser(trimmedName);

    if (existing) {
      // Name exists. Check if email matches (case-insensitive).
      const existingEmail = (existing.emailLower ?? existing.email ?? "").toLowerCase();
      if (existingEmail === trimmedEmail) {
        // Match: log them in
        return NextResponse.json({
          success: true,
          returning: true,
          user: {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            paymentConfirmed: existing.paymentConfirmed,
          },
        });
      } else {
        // Name taken with different email
        return NextResponse.json(
          {
            error:
              "That name is already taken. Use a different name or the email you originally signed up with.",
          },
          { status: 409 }
        );
      }
    }

    // New user: create account
    const user: UserRecord = {
      id: generateId(),
      name: trimmedName,
      nameLower: trimmedName.toLowerCase(),
      email: trimmedEmail,
      emailLower: trimmedEmail,
      paymentConfirmed: false,
      createdAt: new Date().toISOString(),
    };

    await createUser(user);

    return NextResponse.json({
      success: true,
      returning: false,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        paymentConfirmed: user.paymentConfirmed,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    console.error("Join error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
