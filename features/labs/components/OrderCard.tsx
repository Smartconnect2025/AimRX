import { JunctionOrder } from "@/app/api/labs/junction/orders/route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/tailwind-utils";
import { Calendar, Clock, MapPin } from "lucide-react";

interface OrderCardProps {
  order: JunctionOrder;
  onSchedule: (orderId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "collecting_sample":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "received":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getMethodLabel = (method: string) => {
  switch (method) {
    case "walk_in_test":
      return "Walk-in Test";
    case "at_home_phlebotomy":
      return "At-Home Collection";
    case "testkit":
      return "Test Kit";
    default:
      return method;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusLabel = (order: JunctionOrder): string => {
  const statusSections =
    order.events[order.events.length - 1]?.status.split(".");
  const lowLevelStatus = statusSections?.[statusSections.length - 1];
  return lowLevelStatus?.replace(/_/g, " ") ?? "Unknown Status";
};

export const OrderCard = ({ order, onSchedule }: OrderCardProps) => {
  return (
    <Card className="h-full border-0 rounded-2xl hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">
            {order.lab_test?.name || `Order #${order.id.slice(-6)}`}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(getStatusColor(order.status), "capitalize")}
          >
            {/* {order.status.replace(/_/g, " ")} */}
            {getStatusLabel(order)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          {order.lab_test ? (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{getMethodLabel(order.lab_test.method)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  {order.lab_test.fasting
                    ? "Fasting required"
                    : "No fasting required"}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>Appointment required</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>Ordered {formatDate(order.created_at)}</span>
          </div>
        </div>

        {order.lab_test?.price && order.lab_test.price > 0 && (
          <div className="pt-2 border-t">
            <div className="text-lg font-semibold text-primary">
              ${(order.lab_test.price / 100).toFixed(2)}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <Button
            onClick={() => onSchedule(order.id)}
            className="w-full"
            size="sm"
          >
            Schedule Appointment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
