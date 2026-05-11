import { NextResponse } from "next/server";
import { getUser } from "@/lib/storage";
import { hashPasscode } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, passcode } = body as {
      name?: string;
      passcode?: string;
    };

    if (!name || !passcode) {
      return NextResponse.json(
        { error: "Name and passcode are required." },
        { status: 400 }
      );
    }

    const user = await getUser(name);
    if (!user) {
      return NextResponse.json(
        { error: "No participant found with that name. Try registering first." },
        { status: 404 }
      );
    }

    const hash = await hashPasscode(passcode);
    if (hash !== user.passcodeHash) {
      return NextResponse.json(
        { error: "Incorrect passcode." },
        { status: 401 }
      );
    }

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
    const message = err instanceof Error ? err.message : "Login failed";
    console.error("Login error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
