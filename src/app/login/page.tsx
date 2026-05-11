"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
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

    const result = await login(name, passcode);

    if (result.success) {
      router.push("/my-picks");
    } else {
      setError(result.error ?? "Login failed");
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Log In"
        subtitle="Access your picks and predictions."
        icon="🔑"
      />

      <section className="py-10 sm:py-14">
        <Container>
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Welcome Back
                </h2>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your display name"
                      className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white placeholder-gray-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="passcode" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Passcode
                    </label>
                    <input
                      id="passcode"
                      type="password"
                      required
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Your passcode"
                      className="w-full rounded-lg border border-white/10 bg-navy-lighter/80 px-4 py-2.5 text-white placeholder-gray-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full font-heading rounded-lg bg-pitch px-6 py-3 text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-pitch/20 transition-all hover:bg-pitch-light hover:shadow-pitch/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Logging in..." : "Log In"}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                  <p className="text-sm text-gray-500">
                    New here?{" "}
                    <Link href="/join" className="text-accent hover:text-green-300 transition-colors">
                      Join the contest
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
