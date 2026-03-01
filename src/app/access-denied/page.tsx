"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gold-50">
      <Card className="mx-4 w-full max-w-md shadow-lg">
        <CardHeader className="items-center space-y-4 pb-2">
          <Image
            src="/logo.png"
            alt="SNU Chennai"
            width={72}
            height={72}
            priority
          />

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-light">
            <svg
              className="h-8 w-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <div>
            <h1 className="font-heading text-xl font-bold text-gray-900">
              Access Restricted
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You don&apos;t have permission to view this page. This section is
              restricted to administrators only.
            </p>
          </div>

          <div className="rounded-md bg-blue-50 px-4 py-3 text-left text-sm text-blue-700">
            <p className="font-medium">Need access?</p>
            <p className="mt-1 text-blue-600">
              Contact the placement cell admin to upgrade your role in the
              Access sheet.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
            <Button
              asChild
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
