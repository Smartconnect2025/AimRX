"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Heart, Target, BookOpen, Thermometer } from "lucide-react";
import { cn } from "@/utils/tailwind-utils";

interface QuickAction {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  route: string;
  isActive: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: "find-provider",
    title: "Find Provider",
    icon: Search,
    iconBgColor: "bg-green-100",
    route: "/provider-search",
    isActive: true,
  },
  {
    id: "track-mood",
    title: "Mood",
    icon: Heart,
    iconBgColor: "bg-purple-100",
    route: "/mood-tracker",
    isActive: true,
  },
  {
    id: "track-symptoms",
    title: "Symptoms",
    icon: Thermometer,
    iconBgColor: "bg-blue-100",
    route: "/symptom-tracker",
    isActive: true,
  },
  {
    id: "track-goals",
    title: "Goals",
    icon: Target,
    iconBgColor: "bg-green-600",
    route: "/goals",
    isActive: true,
  },
  {
    id: "journal",
    title: "Journal",
    icon: BookOpen,
    iconBgColor: "bg-green-100",
    route: "/journal",
    isActive: true,
  },
];

export function QuickActions() {
  const router = useRouter();

  const handleActionClick = (action: QuickAction) => {
    if (action.isActive && action.route) {
      router.push(action.route);
    }
  };

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-3 auto-rows-fr">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Card
              key={action.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md h-20",
                action.isActive
                  ? "border border-gray-200 hover:border-gray-300"
                  : "border border-gray-100 bg-gray-50",
              )}
              onClick={() => handleActionClick(action)}
            >
              <CardContent className="p-3 h-full">
                <div className="flex items-center gap-3 h-full">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ml-5",
                      action.iconBgColor,
                      !action.isActive && "bg-gray-100",
                    )}
                  >
                    <IconComponent
                      className={cn(
                        "w-5 h-5",
                        action.isActive
                          ? action.id === "track-goals"
                            ? "text-white"
                            : "text-gray-700"
                          : "text-gray-400",
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "font-medium x",
                      action.isActive ? "text-gray-900" : "text-gray-400",
                    )}
                  >
                    {action.title}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
