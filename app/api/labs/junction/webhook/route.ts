import { NextRequest, NextResponse } from "next/server";
import { JunctionWebhookData } from "@/features/labs/services/junctionLabData";

interface WebhookCategory {
  category: string;
  tests: Array<{
    id: string;
    testName: string;
    value: number | null;
    unit: string;
    normalRangeMin: number;
    normalRangeMax: number;
    date: string;
    status: string;
  }>;
}

interface FinalTestResult {
  id: string;
  testName: string;
  value: number | null;
  unit: string;
  normalRangeMin: number;
  normalRangeMax: number;
  date: string;
  status: string;
  category: string;
}

export async function POST(request: NextRequest) {
  try {
    const webhookData: JunctionWebhookData = await request.json();
    console.log("Received Junction webhook:", webhookData);

    // Handle different webhook events
    if (webhookData.type === "lab_test.results.ready") {
      const orderId = webhookData.order_id;
      console.log(`Lab results ready for order ${orderId}`);

      // Check if we have lab results data
      if (webhookData.data && webhookData.data.categories) {
        // Filter to only process final results
        const finalCategories = webhookData.data.categories.filter(
          (category: WebhookCategory) =>
            category.category.toLowerCase().includes("final"),
        );

        console.log(
          `Found ${finalCategories.length} final categories out of ${webhookData.data.categories.length} total categories`,
        );

        if (finalCategories.length > 0) {
          // Process only the final lab results
          console.log("Processing final lab results:", finalCategories);

          // Extract all tests from final categories
          const finalTests = finalCategories.flatMap(
            (category: WebhookCategory) =>
              category.tests.map((test) => ({
                ...test,
                category: category.category,
              })),
          );

          console.log(`Processing ${finalTests.length} final test results`);

          // TODO: Add your lab results processing logic here
          // Examples:
          // - Store results in database
          // - Update patient records
          // - Send notifications to providers
          // - Trigger UI updates

          // For now, log the final test results
          finalTests.forEach((test: FinalTestResult) => {
            console.log(
              `Final Test: ${test.testName} - ${test.value} ${test.unit} (${test.status})`,
            );
          });
        } else {
          console.log("No final results found - skipping processing");
        }
      } else {
        console.log("No lab results data found in webhook");
      }
    }

    return NextResponse.json({
      received: true,
      processed: webhookData.type === "lab_test.results.ready",
    });
  } catch (error) {
    console.error("Error processing Junction webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
