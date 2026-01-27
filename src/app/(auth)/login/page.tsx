"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/app/actions/auth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const msg = searchParams.get("message");
    if (msg) {
      setMessage(msg);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await signIn(formData);
      if (result && !result.success) {
        setError(result.error || "Login failed");
        setLoading(false);
      }
      // If successful, redirect happens automatically - don't set loading to false
    } catch (err) {
      // Ignore NEXT_REDIRECT errors - they're expected
      if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
        return; // Let Next.js handle the redirect
      }
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F1EA] px-4">
      <Card className="w-full max-w-md border-[#D4B5A0]/30 shadow-lg">
        <CardHeader className="space-y-2">
          <div className="text-center">
            <h1 className="text-3xl font-serif text-[#2C2C2C]">PanEcho</h1>
            <p className="text-sm text-[#5C5C5C] mt-1">Pancreatic Cancer Screening</p>
          </div>
          <CardTitle className="text-center text-[#2C2C2C]">Sign In</CardTitle>
          <CardDescription className="text-center text-[#5C5C5C]">Enter your credentials to access PanEcho</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full bg-[#D4B5A0] hover:bg-[#C4A590] text-[#2C2C2C]" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <div>
              Don't have an account?{" "}
              <Link href="/signup" className="font-medium text-[#D4B5A0] hover:underline">
                Sign up
              </Link>
            </div>
            <Link href="#" className="block text-[#D4B5A0] hover:underline">
              Forgot password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
