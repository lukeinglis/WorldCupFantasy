import { NextResponse } from "next/server";
import { getUser, createUser, type UserRecord } from "@/lib/storage";
import { hashPasscode, generateId } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, passcode } = body as {
      name?: string;
      email?: string;
      passcode?: string;
    };

    if (!name || !email || !passcode) {
      return NextResponse.json(
        { error: "Name, email, and passcode are required." },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (passcode.length < 4) {
      return NextResponse.json(
        { error: "Passcode must be at least 4 characters." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await getUser(name);
    if (existing) {
      return NextResponse.json(
        { error: "A participant with that name already exists. Try logging in instead." },
        { status: 409 }
      );
    }

    const user: UserRecord = {
      id: generateId(),
      name: name.trim(),
      nameLower: name.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      passcodeHash: await hashPasscode(passcode),
      paymentConfirmed: false,
      createdAt: new Date().toISOString(),
    };

    await createUser(user);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        paymentConfirmed: user.paymentConfirmed,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    console.error("Registration error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
