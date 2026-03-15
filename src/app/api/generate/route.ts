import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { triggerWorkflow } from "@/lib/github";

// Valid CLI flags from the stats generator
const VALID_FLAGS = new Set([
  "--sections",
  "--gender",
  "--companies",
  "--ctc-brackets",
  "--class-status",
  "--no-ctc",
  "--no-timeline",
]);

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { flags?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { flags } = body;

  if (!Array.isArray(flags) || !flags.every((f) => typeof f === "string")) {
    return NextResponse.json(
      { error: "flags must be an array of strings" },
      { status: 400 }
    );
  }

  for (const flag of flags as string[]) {
    if (!VALID_FLAGS.has(flag)) {
      return NextResponse.json(
        { error: `Unknown flag: ${flag}` },
        { status: 400 }
      );
    }
  }

  try {
    const runId = await triggerWorkflow(flags as string[]);
    return NextResponse.json({ runId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
