import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gold-50">
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 text-center">
        <Image
          src="/logo_blue.png"
          alt="SNU Chennai"
          width={72}
          height={72}
          priority
        />

        <p className="mt-8 font-heading text-8xl font-bold text-blue-500" aria-hidden="true">
          404
        </p>

        <div className="mt-4 h-1 w-16 rounded-full bg-gold-400" />

        <h1 className="mt-6 font-heading text-xl font-semibold text-gray-900">
          Page Not Found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          If you believe this is an error, contact the placement cell.
        </p>

        <div className="mt-8 flex gap-3">
          <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Back to Login</Link>
          </Button>
        </div>

        <p className="mt-12 text-xs text-muted-foreground">
          Shiv Nadar University Chennai — Placement Dashboard
        </p>
      </div>
    </div>
  );
}
