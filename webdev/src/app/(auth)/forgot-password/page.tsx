"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
        // @ts-ignore - method capability depends on version/plugins
        await authClient.forgetPassword({
            email,
            redirectTo: "/reset-password",
        }, {
            onSuccess: () => {
                setSuccess(true);
                setLoading(false);
            },
            onError: (ctx: any) => {
                 setError(ctx.error.message);
                 setLoading(false);
            }
        });
    } catch (err) {
        // Fallback if authClient.forgetPassword signature is different/wraps error
        setError("Failed to send reset email.");
        setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We have sent a password reset link to {email}.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link href="/sign-in" className="text-primary hover:underline">
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we will send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/sign-in" className="text-primary hover:underline">
          Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}
