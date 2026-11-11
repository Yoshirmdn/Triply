import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveActor } from "@/lib/permissions";
import { PlacesApiError, autocompleteLocations } from "@/lib/geoapify";
import { autocompleteQuerySchema } from "@/lib/validations/place.schema";
import { BASIC_AUTH_CHALLENGE, validateBasicAuth } from "@/utils/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { actor, inactive } = await resolveActor();
    if (inactive) {
      return NextResponse.json(
        { success: false, status: 403, message: "Account is inactive!" },
        { status: 403 },
      );
    }
    if (!actor && !validateBasicAuth(request)) {
      return NextResponse.json(
        { success: false, status: 401, message: "Unauthorized!" },
        { status: 401, headers: { "WWW-Authenticate": BASIC_AUTH_CHALLENGE } },
      );
    }

    const parsed = autocompleteQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          message: "Validation failed!",
          errors: z.flattenError(parsed.error),
        },
        { status: 400 },
      );
    }

    const suggestions = await autocompleteLocations({
      text: parsed.data.input,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
    });

    return NextResponse.json({
      success: true,
      status: 200,
      message: "Data fetched successfully!",
      data: suggestions,
      meta: { total: suggestions.length },
    });
  } catch (error) {
    if (error instanceof PlacesApiError) {
      return NextResponse.json(
        { success: false, status: error.status, message: error.message },
        { status: error.status },
      );
    }
    console.error(error);
    return NextResponse.json(
      { success: false, status: 500, message: "Internal server error!" },
      { status: 500 },
    );
  }
}
