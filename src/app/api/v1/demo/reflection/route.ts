import { NextRequest, NextResponse } from "next/server";

import { demoReflectionRequestSchema } from "@/lib/validation/demo-feedback";
import { assertSameOrigin } from "@/server/http/origin";
import { apiErrorResponse } from "@/server/http/responses";
import { generateDemoReflection } from "@/server/services/demo-feedback-service";

export const runtime = "nodejs";

const DEMO_REFLECTION_COOKIE = "mindtrace_demo_reflections";
const DEMO_REFLECTION_LIMIT = 3;
const DEMO_REFLECTION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;

function getDemoReflectionCount(request: NextRequest): number {
  const rawValue = request.cookies.get(DEMO_REFLECTION_COOKIE)?.value;
  const parsed = Number.parseInt(rawValue ?? "0", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function setDemoReflectionCount(response: NextResponse, count: number): void {
  response.cookies.set(DEMO_REFLECTION_COOKIE, String(count), {
    httpOnly: true,
    maxAge: DEMO_REFLECTION_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);

    const currentCount = getDemoReflectionCount(request);

    if (currentCount >= DEMO_REFLECTION_LIMIT) {
      return NextResponse.json(
        {
          error: {
            code: "DEMO_LIMIT_REACHED",
          },
        },
        { status: 429 },
      );
    }

    const body = demoReflectionRequestSchema.parse(await request.json());
    const reflection = await generateDemoReflection(body.note, body.locale);
    const response = NextResponse.json({
      data: {
        reflection,
        remaining: Math.max(0, DEMO_REFLECTION_LIMIT - currentCount - 1),
      },
    });

    setDemoReflectionCount(response, currentCount + 1);

    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
