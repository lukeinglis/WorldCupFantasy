"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { useAuth } from "@/components/AuthProvider";

export default function JoinPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  if (user) {
    router.push("/my-picks");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (passcode !== confirmPasscode) {
      setError("Passcodes do not match.");
      return;
    }

    setSubmitting(true);

    const result = await register(name, email, passcode);

    if (result.success) {
      router.push("/my-picks");
    } else {
      setError(result.error ?? "Registration failed");
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Join the Contest"
        subtitle="Sign up to make your World Cup 2026 predictions."
        icon="🎟️"
      />

      <section className="py-10 sm:py-14">
        <Container>
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Create Your Account
                </h2>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Display Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={30}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white placeholder-gray-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white placeholder-gray-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      Used for communication only, not shared publicly.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="passcode" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Passcode
                    </label>
                    <input
                      id="passcode"
                      type="password"
                      required
                      minLength={4}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Choose a passcode (4+ characters)"
                      className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white placeholder-gray-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPasscode" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Confirm Passcode
                    </label>
                    <input
                      id="confirmPasscode"
                      type="password"
                      required
                      minLength={4}
                      value={confirmPasscode}
                      onChange={(e) => setConfirmPasscode(e.target.value)}
                      placeholder="Confirm your passcode"
                      className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white placeholder-gray-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="rounded-lg bg-gold/5 border border-gold/20 px-4 py-3">
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-gold">$10 buy-in required.</span>{" "}
                      You will confirm payment when submitting your picks. Pay via Venmo, PayPal, or arrange with Luke.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full font-heading rounded-lg bg-pitch px-6 py-3 text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-pitch/20 transition-all hover:bg-pitch-light hover:shadow-pitch/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Creating Account..." : "Join the Contest"}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                  <p className="text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/login" className="text-accent hover:text-green-300 transition-colors">
                      Log in
                    </Link>
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}
