import { NextRequest, NextResponse } from "next/server";
import { BASIC_AUTH_CHALLENGE, validateBasicAuth } from "@/utils/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const isAuthorized = validateBasicAuth(request);
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          status: 401,
          message: "Unauthorized!",
        },
        { status: 401, headers: { "WWW-Authenticate": BASIC_AUTH_CHALLENGE } },
      );
    }

    return NextResponse.json({
      success: true,
      status: 200,
      message: "API guard credentials are valid!",
      data: { status: "guard-ok" },
    });
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