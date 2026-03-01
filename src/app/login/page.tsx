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
    <div className="relative flex min-h-screen items-center justify-center bg-brand-gradient-bold overflow-hidden">
      {/* Decorative blur orbs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gold-400/20 blur-3xl" />
      <LoginCard
        error={params.error}
        callbackUrl={params.callbackUrl}
      />
    </div>
  );
}
