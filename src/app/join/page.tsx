"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody } from "@/components/Card";
import { useAuth } from "@/components/AuthProvider";

export default function JoinPage() {
  const router = useRouter();
  const { join, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
    setSubmitting(true);

    const result = await join(name, email);

    if (result.success) {
      router.push("/my-picks");
    } else {
      setError(result.error ?? "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Join the League"
        subtitle="Make your World Cup 2026 predictions and compete with friends."
        icon="⚽"
      />

      <section className="py-10 sm:py-14">
        <Container>
          <div className="max-w-md mx-auto">
            <Card className="border-accent/20">
              <CardBody>
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-400">
                    New? Enter your name and email to get started.
                    <br />
                    Returning? Use the same name and email to get back in.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Your Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={30}
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="What should we call you?"
                      className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-3 text-white placeholder-gray-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-base"
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
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-3 text-white placeholder-gray-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-base"
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      Only used to identify you. Never shared.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full font-heading rounded-lg bg-accent px-6 py-3.5 text-lg font-bold uppercase tracking-wide text-navy shadow-lg shadow-accent/20 transition-all hover:bg-green-300 hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Joining..." : "Let's Go! ⚽"}
                  </button>
                </form>
              </CardBody>
            </Card>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600">
                $10 buy-in to play. You will confirm payment when you submit your picks.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
