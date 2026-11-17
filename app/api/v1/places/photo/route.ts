import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findPlacePhoto } from "@/lib/place-photo";
import { photoQuerySchema } from "@/lib/validations/place.schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const parsed = photoQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
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

    const photo = await findPlacePhoto(parsed.data);

    return NextResponse.json(
      {
        success: true,
        status: 200,
        message: "Data fetched successfully!",
        data: photo,
      },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        status: 500,
        message: "Internal server error!",
      },
      { status: 500 },
    );
  }
}