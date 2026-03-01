"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Unable to verify access. Please try again later.",
  OAuthCallback: "Authentication failed. Please try again.",
  default: "An error occurred during sign in.",
};

export function LoginCard({
  error,
  callbackUrl,
}: {
  error?: string;
  callbackUrl?: string;
}) {
  const errorMessage = error
    ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.default
    : null;

  return (
    <Card className="relative z-10 w-full max-w-md overflow-hidden border border-white/30 bg-white/90 ring-1 ring-blue-200/30 backdrop-blur-xl shadow-2xl">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-gold-400" />
      <CardHeader className="items-center space-y-4 pb-2">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-blue-500">
            Placement Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shiv Nadar University Chennai
          </p>
          <Badge variant="secondary" className="mt-2">
            <GraduationCap className="h-3 w-3" />
            Batch 2022-26
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <div className="rounded-md bg-error-light px-4 py-3 text-sm text-error">
            {errorMessage}
          </div>
        )}

        <Button
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 text-white font-medium py-5"
          onClick={() =>
            signIn("google", {
              callbackUrl: callbackUrl ?? "/dashboard",
            })
          }
        >
          <svg
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#ffffff" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#ffffff" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#ffffff" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ffffff" />
          </svg>
          Sign in with Google
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Sign in with your Google account
        </p>
      </CardContent>
    </Card>
  );
}
