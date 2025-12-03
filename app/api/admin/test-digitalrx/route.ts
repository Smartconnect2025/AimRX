import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("=== Test DigitalRx API Route Called ===");

  try {
    // Read API credentials from request body (from localStorage)
    const body = await request.json();
    const apiKey = body.apiKey;

    console.log("API Key received:", apiKey ? `${apiKey.substring(0, 20)}...` : "NONE");

    // Default to sandbox URL if env var not set
    const apiUrl =
      process.env.DIGITALRX_API_URL || "https://sandbox.h2hdigitalrx.com/api/v1/health";
    const apiKeyToUse = apiKey || process.env.DIGITALRX_API_KEY || "sk_test_demo_h2h";

    console.log("Testing connection to:", apiUrl);
    console.log("Using API key:", apiKeyToUse ? `${apiKeyToUse.substring(0, 20)}...` : "NONE");

    // Make GET request to DigitalRx health endpoint
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKeyToUse}`,
        "Content-Type": "application/json",
      },
    });

    console.log("DigitalRx response status:", response.status);

    if (response.ok) {
      const data = await response.json().catch(() => ({ status: "ok" }));
      console.log("✅ DigitalRx connection successful:", data);

      return NextResponse.json({
        success: true,
        message: "Connected successfully",
        status: response.status,
        data,
      });
    } else {
      // Handle non-200 responses
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("❌ DigitalRx connection failed:", response.status, errorText);

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      if (response.status === 401) {
        errorMessage = "Invalid API key - please check your credentials";
      } else if (response.status === 404) {
        errorMessage = "API endpoint not found - check the URL";
      } else if (response.status === 403) {
        errorMessage = "Access forbidden - check API key permissions";
      } else if (response.status >= 500) {
        errorMessage = "DigitalRx server error - try again later";
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          status: response.status,
          details: errorText,
        },
        { status: 200 } // Return 200 to client, but success: false
      );
    }
  } catch (error) {
    console.error("❌ Test DigitalRx exception:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unable to reach DigitalRx API";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 200 } // Return 200 to client, but success: false
    );
  }
}
