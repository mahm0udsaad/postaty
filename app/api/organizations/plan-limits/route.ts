import { NextResponse } from "next/server";

const PLAN_LIMITS = {
  free: { credits: 10, brandKits: 1, members: 1 },
  starter: { credits: 10, brandKits: 3, members: 3 },
  pro: { credits: 25, brandKits: 10, members: 10 },
  agency: { credits: 50, brandKits: 25, members: 25 },
};

export async function GET() {
  return NextResponse.json({ planLimits: PLAN_LIMITS });
}
