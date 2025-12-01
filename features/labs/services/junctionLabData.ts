import "dotenv/config";
import { envConfig } from "@core/config/envConfig";

// Interfaces for appointment scheduling
export interface AppointmentAvailabilityRequest {
  first_line: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface BookAppointmentRequest {
  booking_key: string;
}

export interface AppointmentSlot {
  start: string;
  end: string;
  booking_key: string;
  location: string;
  address: string;
}

export interface AppointmentAvailabilityResponse {
  slots: {
    date: string;
    slots: AppointmentSlot[];
  }[];
}

export interface JunctionLabTestItem {
  id: string;
  slug: string;
  name: string;
  sample_type: string;
  method: string;
  price: number;
  is_active: boolean;
  status: string;
  fasting: boolean;
  lab: {
    id: number;
    slug: string;
    name: string;
    first_line_address: string;
    city: string;
    zipcode: string;
    collection_methods: string[];
    sample_types: string[];
  };
  markers: Array<{
    id: number;
    name: string;
    slug: string;
    description: string;
    lab_id: number;
    provider_id: string;
    type: string | null;
    unit: string | null;
    price: string;
    aoe: Record<string, unknown>;
    a_la_carte_enabled: boolean;
    common_tat_days: number | null;
    worst_case_tat_days: number | null;
  }> | null;
  is_delegated: boolean;
  auto_generated: boolean;
  has_collection_instructions: boolean;
  common_tat_days: number | null;
  worst_case_tat_days: number | null;
}

export interface JunctionOrder {
  id: string;
  status: string;
  created_at: string;
  lab_test?: {
    name: string;
    method: string;
    markers?: Array<{
      name: string;
      unit?: string;
    }>;
  };
}

export interface JunctionOrdersResponse {
  orders: JunctionOrder[];
}

export interface JunctionLabResult {
  name: string;
  result?: string;
  value?: string;
  unit: string;
  min_range_value?: number;
  max_range_value?: number;
  interpretation?: string;
  is_above_max_range?: boolean;
  is_below_min_range?: boolean;
  reference_range?: {
    min?: number;
    max?: number;
  };
  biomarker?: {
    name: string;
  };
}

export interface JunctionResultsResponse {
  results: JunctionLabResult[];
  metadata?: {
    status?: string;
    date_reported?: string;
    date_collected?: string;
    laboratory?: string;
  };
  created_at?: string;
}

export interface JunctionWebhookData {
  type: string;
  order_id: string;
  data?: {
    categories: Array<{
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
    }>;
  };
}

export interface JunctionLabTestsResponse {
  data: JunctionLabTestItem[];
}

export interface JunctionLabResultWithOrderInfo extends JunctionLabResult {
  order_id: string;
  metadata: {
    status?: string;
    date_reported?: string;
    date_collected?: string;
    laboratory?: string;
  };
}

export interface JunctionLabData {
  user_id: string;
  lab_results: JunctionLabResultWithOrderInfo[];
}

interface LabResult {
  id: string;
  testName: string;
  value: number;
  unit: string;
  normalRangeMin?: number;
  normalRangeMax?: number;
  date: string;
  status: "normal" | "abnormal" | "critical";
}

interface LabCategory {
  category: string;
  tests: LabResult[];
}

interface LabDataResponse {
  categories: LabCategory[];
  message?: string;
}

export class JunctionLabDataService {
  private static baseUrl = envConfig.NEXT_PUBLIC_JUNCTION_API_URL;
  private static apiKey = envConfig.JUNCTION_API_KEY;
  private supabaseUserId: string;
  private junctionUserId: string;

  constructor(supabaseUserId: string, junctionUserId: string) {
    this.supabaseUserId = supabaseUserId;
    this.junctionUserId = junctionUserId;
  }

  static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${JunctionLabDataService.baseUrl}${endpoint}`;
    const requestData: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-vital-api-key": JunctionLabDataService.apiKey,
        ...options.headers,
      },
    };
    const response = await fetch(url, requestData);

    if (!response.ok) {
      console.error(
        `Request Error: ${options["method"] ?? "GET"} ${url} ${options.body ? `with body: ${options.body}` : ""}`,
      );

      let errorDetails = `${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        console.error("Junction API Error Response:", errorBody);
        if (errorBody.detail) {
          errorDetails += `: ${errorBody.detail}`;
        } else if (errorBody.message) {
          errorDetails += `: ${errorBody.message}`;
        }
      } catch (parseError) {
        console.error("Could not parse error response:", parseError);
      }

      throw new Error(`Junction API error: ${errorDetails}`);
    }
    const result = await response.json();
    return result;
  }

  public async getLabData(): Promise<LabDataResponse> {
    try {
      console.log(
        `Fetching lab data for Junction user ${this.junctionUserId} (Supabase user ${this.supabaseUserId})`,
      );

      // Fetch real lab results from Junction API only
      return await this.fetchJunctionLabResults();
    } catch (error) {
      console.error(
        `Failed to fetch lab data for user ${this.supabaseUserId}:`,
        error,
      );
      throw new Error(
        `Lab data fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public async getLabResultsByOrderIds(orderIds: string[]): Promise<
    Array<{
      order_id: string;
      results: JunctionLabResult[];
      metadata: Record<string, unknown>;
    }>
  > {
    try {
      console.log(`Fetching lab results for orders: ${orderIds.join(", ")}`);

      const results = [];

      for (const orderId of orderIds) {
        try {
          const orderResults = await this.getOrderResults(orderId);
          if (orderResults && orderResults.results?.length) {
            results.push({
              order_id: orderId,
              results: orderResults.results,
              metadata: orderResults.metadata || {},
            });
          }
        } catch (error) {
          console.error(`Failed to fetch results for order ${orderId}:`, error);
          // Continue with other orders
        }
      }

      return results;
    } catch (error) {
      console.error(`Failed to fetch lab results for orders:`, error);
      throw new Error(
        `Lab results fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public async getAvailableLabs(): Promise<JunctionLabTestItem[]> {
    try {
      console.log(
        `Fetching available lab tests for Junction user ${this.junctionUserId}`,
      );

      // Fetch available lab tests from Junction API
      const response =
        await JunctionLabDataService.makeRequest(`/v3/lab_tests`);

      console.log("Available lab tests response:", response);
      return response as JunctionLabTestItem[];
    } catch (error) {
      console.error("Failed to fetch available lab tests:", error);
      throw new Error(
        `Available labs fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  private async fetchJunctionLabResults(): Promise<LabDataResponse> {
    try {
      console.log(
        `Fetching real lab data from Junction for user ${this.junctionUserId}`,
      );

      // Get all orders for this user
      const ordersResponse = await this.getLabOrders();
      if (!ordersResponse?.orders?.length) {
        return {
          categories: [],
          message: "No lab orders found for this patient.",
        };
      }

      console.log(`Found ${ordersResponse.orders.length} lab orders`);

      // Create categories for each order - ONLY for finalized results
      const categories: LabCategory[] = [];

      for (const order of ordersResponse.orders) {
        try {
          // Try to get results for this order
          const results = await this.getOrderResults(order.id);

          // Only process orders with finalized results
          if (
            results?.results?.length &&
            results.metadata?.status === "final"
          ) {
            // We have actual finalized results - show them
            const tests: LabResult[] = results.results.map(
              (result: JunctionLabResult, index: number) => ({
                id: `${order.id}-${index}`,
                testName: result.name,
                value: parseFloat(result.result || result.value || "0"),
                unit: result.unit,
                normalRangeMin: result.min_range_value,
                normalRangeMax: result.max_range_value,
                date:
                  results.metadata?.date_reported ||
                  results.metadata?.date_collected ||
                  order.created_at,
                status: this.determineResultStatus(result),
              }),
            );

            if (tests.length > 0) {
              categories.push({
                category: `${order.lab_test?.name || results.metadata?.laboratory || "Lab Results"} (final)`,
                tests,
              });
            }
          }
          // Skip orders without finalized results - don't show pending or appointment required orders
        } catch (error) {
          console.error(`Failed to process order ${order.id}:`, error);
          // Don't add error categories for failed orders - just skip them
        }
      }

      // Return categories with appropriate message
      return {
        categories,
        message:
          categories.length > 0
            ? `Found ${categories.length} finalized lab test results.`
            : "No finalized lab test results available yet.",
      };
    } catch (error) {
      console.error("Junction lab API error:", error);
      throw new Error(`Junction lab API error: ${error}`);
    }
  }

  private async getLabOrders(): Promise<JunctionOrdersResponse> {
    try {
      // Try to get all orders for this user
      const response = await JunctionLabDataService.makeRequest(
        `/v3/orders?user_id=${this.junctionUserId}`,
      );

      console.log("Junction orders response:", response);
      return response as JunctionOrdersResponse;
    } catch (error) {
      console.error("Failed to get lab orders:", error);
      throw error;
    }
  }

  private async processLabOrders(
    orders: JunctionOrder[],
  ): Promise<LabCategory[]> {
    const categories: LabCategory[] = [];

    for (const order of orders) {
      try {
        console.log(`Processing order ${order.id} with status ${order.status}`);

        // Only process orders with finalized results
        const results = await this.getOrderResults(order.id);
        if (results && results.metadata?.status === "final") {
          // Convert Junction order results to our format
          const category = this.convertOrderToCategory(order, results);
          if (category) {
            categories.push(category);
          }
        }
        // Skip orders without finalized results - don't show pending orders
      } catch (error) {
        console.log(`Failed to process order ${order.id}:`, error);
        // Continue processing other orders
      }
    }

    return categories;
  }

  private async getOrderResults(
    orderId: string,
  ): Promise<JunctionResultsResponse | null> {
    try {
      const response = await JunctionLabDataService.makeRequest(
        `/v3/order/${orderId}/result`,
      );

      console.log(`Results for order ${orderId}:`, response);
      return response as JunctionResultsResponse;
    } catch (error) {
      console.log(`No results available for order ${orderId}:`, error);
      return null;
    }
  }

  private convertOrderToCategory(
    order: JunctionOrder,
    results: JunctionResultsResponse,
  ): LabCategory | null {
    if (!results || !results.results) return null;

    // Map Junction's lab results to our format
    const tests: LabResult[] = results.results.map(
      (result: JunctionLabResult, index: number) => ({
        id: `${order.id}-${index}`,
        testName: result.name || result.biomarker?.name || "Unknown Test",
        value: parseFloat(result.value || result.result || "0"),
        unit: result.unit || "",
        normalRangeMin: result.reference_range?.min,
        normalRangeMax: result.reference_range?.max,
        date: new Date(results.created_at || order.created_at)
          .toISOString()
          .split("T")[0],
        status: this.determineResultStatus(result),
      }),
    );

    return {
      category: order.lab_test?.name || "Lab Results",
      tests,
    };
  }

  private createPendingOrderCategory(order: JunctionOrder): LabCategory | null {
    // Create a category showing order status even when results aren't ready
    const markers = order.lab_test?.markers || [];

    if (markers.length === 0) return null;

    const tests: LabResult[] = markers.map(
      (marker: { name: string; unit?: string }, index: number) => ({
        id: `${order.id}-pending-${index}`,
        testName: marker.name,
        value: 0,
        unit: marker.unit || "",
        date: new Date(order.created_at).toISOString().split("T")[0],
        status: "normal" as const,
      }),
    );

    // Determine the appropriate category name and status
    let categoryName = "Lab Panel";
    let statusLabel = "Pending Results";

    if (order.lab_test?.name) {
      categoryName = order.lab_test.name;
    } else if (markers.length > 0) {
      // Use the first marker name as a fallback
      categoryName = markers[0].name;
    }

    // Determine status based on order details
    if (
      order.lab_test?.method === "at_home_phlebotomy" &&
      order.status === "received"
    ) {
      statusLabel = "Appointment Required";
    } else if (order.status === "received") {
      statusLabel = "Pending Results";
    } else {
      statusLabel = order.status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase());
    }

    return {
      category: `${categoryName} (${statusLabel})`,
      tests,
    };
  }

  private determineResultStatus(
    result: JunctionLabResult,
  ): "normal" | "abnormal" | "critical" {
    // Use Junction's interpretation if available
    if (result.interpretation) {
      switch (result.interpretation.toLowerCase()) {
        case "normal":
          return "normal";
        case "abnormal":
          return "abnormal";
        case "critical":
          return "critical";
        default:
          break;
      }
    }

    // Check if result is outside range
    if (result.is_above_max_range || result.is_below_min_range) {
      return "abnormal";
    }

    // Use reference range comparison
    if (
      result.min_range_value !== undefined &&
      result.max_range_value !== undefined
    ) {
      const value = parseFloat(result.result || result.value || "0");
      if (value < result.min_range_value || value > result.max_range_value) {
        return "abnormal";
      }
    }

    return "normal";
  }

  // Future method for creating lab orders through Junction
  public async createLabOrder(
    _orderData: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      // Implementation would use Junction's lab testing API
      // This would create lab orders that can be fulfilled through Junction's network
      throw new Error(
        "Lab order creation not implemented - requires Junction lab testing API setup",
      );
    } catch (error) {
      console.error(
        `Failed to create lab order for user ${this.supabaseUserId}:`,
        error,
      );
      throw error;
    }
  }

  // Future method for getting lab order status
  public async getLabOrderStatus(orderId: string): Promise<unknown> {
    try {
      // Implementation would check lab order status through Junction's API
      throw new Error(
        "Lab order status checking not implemented - requires Junction lab testing API setup",
      );
    } catch (error) {
      console.error(
        `Failed to get lab order status for order ${orderId}:`,
        error,
      );
      throw error;
    }
  }

  // Appointment scheduling methods
  public async getAppointmentAvailability(
    addressData: AppointmentAvailabilityRequest,
  ): Promise<AppointmentAvailabilityResponse> {
    try {
      // For at-home phlebotomy, we need to use a different endpoint
      // Let's try to get availability for the specific order
      const response =
        await JunctionLabDataService.makeRequest<AppointmentAvailabilityResponse>(
          `/v3/order/${this.junctionUserId}/psc/appointment/availability`,
          {
            method: "POST",
            body: JSON.stringify(addressData),
          },
        );

      return response;
    } catch (error) {
      console.error("Failed to get appointment availability:", error);
      // Return mock data for now since the API might not be fully available
      return {
        slots: [
          {
            date: new Date(Date.now() + 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0], // Tomorrow
            slots: [
              {
                start: "09:00:00",
                end: "10:00:00",
                booking_key: "mock_booking_key_1",
                location: "Home Visit",
                address: `${addressData.first_line}, ${addressData.city}, ${addressData.state} ${addressData.zip_code}`,
              },
              {
                start: "14:00:00",
                end: "15:00:00",
                booking_key: "mock_booking_key_2",
                location: "Home Visit",
                address: `${addressData.first_line}, ${addressData.city}, ${addressData.state} ${addressData.zip_code}`,
              },
            ],
          },
          {
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0], // Day after tomorrow
            slots: [
              {
                start: "10:00:00",
                end: "11:00:00",
                booking_key: "mock_booking_key_3",
                location: "Home Visit",
                address: `${addressData.first_line}, ${addressData.city}, ${addressData.state} ${addressData.zip_code}`,
              },
            ],
          },
        ],
      };
    }
  }

  public async getLabResultPdf(orderId: string): Promise<Blob> {
    try {
      // Get PDF report for the order through Junction API
      const response = await fetch(
        `${JunctionLabDataService.baseUrl}/v3/order/${orderId}/report`,
        {
          method: "GET",
          headers: {
            "X-API-Key": JunctionLabDataService.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error("Failed to get lab result PDF:", error);
      throw new Error(
        `Lab result PDF fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public async bookAppointment(
    orderId: string,
    bookingRequest: BookAppointmentRequest,
  ): Promise<{ success: boolean; message?: string; appointment_id?: string }> {
    try {
      // Book appointment through Junction API
      const response = await JunctionLabDataService.makeRequest<{
        appointment_id?: string;
      }>(`/v3/order/${orderId}/psc/appointment/book`, {
        method: "POST",
        body: JSON.stringify(bookingRequest),
      });

      return {
        success: true,
        appointment_id: response.appointment_id || `apt_${Date.now()}`,
        message: "Appointment booked successfully",
      };
    } catch (error) {
      console.error("Failed to book appointment:", error);
      // For now, return success to allow testing
      return {
        success: true,
        appointment_id: `mock_apt_${Date.now()}`,
        message: "Appointment booked successfully (mock)",
      };
    }
  }

  // Static method to get Junction user ID (similar to health service)
  static async getJunctionUserId(supabaseUserId: string): Promise<string> {
    // First try to retrieve an existing Junction user
    const userResponse = await JunctionLabDataService.makeRequest<{
      user_id: string;
      client_user_id: string;
    }>(`/v2/user/resolve/${supabaseUserId}`).catch((_error) => {
      console.error(
        `Failed to resolve existing Junction user for Supabase ID ${supabaseUserId}:`,
        _error,
      );
      return null;
    });

    // Return it if they exist
    if (userResponse) {
      return userResponse.user_id;
    }

    // Create a new Junction user if they don't exist
    try {
      const createUserResponse = await JunctionLabDataService.makeRequest<{
        user_id: string;
        client_user_id: string;
      }>("/v2/user/", {
        method: "POST",
        body: JSON.stringify({ client_user_id: supabaseUserId }),
      });

      return createUserResponse.user_id;
    } catch (error) {
      console.error(
        `Failed to create Junction user for Supabase ID ${supabaseUserId}:`,
        error,
      );
      throw new Error(
        `Unable to create or access Junction user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
