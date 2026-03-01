import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginCard } from "./login-card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gold-50">
      <LoginCard
        error={params.error}
        callbackUrl={params.callbackUrl}
      />
    </div>
  );
}
