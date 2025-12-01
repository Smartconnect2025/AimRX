"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Video, MessageSquare, Phone, User } from "lucide-react";
import { ProviderInfoCardProps } from "../types/provider-profile";
import { cn } from "@/utils/tailwind-utils";

export function ProviderInfoCard({ provider }: ProviderInfoCardProps) {
  const getServiceTypeIcon = (serviceType: string) => {
    const type = serviceType.toLowerCase();
    if (type.includes("video") || type.includes("telehealth")) {
      return <Video className="w-4 h-4" />;
    }
    if (type.includes("chat")) {
      return <MessageSquare className="w-4 h-4" />;
    }
    if (type.includes("phone")) {
      return <Phone className="w-4 h-4" />;
    }
    if (type.includes("person") || type.includes("in-person")) {
      return <User className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Provider Avatar and Basic Info */}
          <div className="flex flex-col md:flex-row items-start gap-4">
            <Avatar className="h-20 w-20 rounded-full overflow-hidden">
              <img
                src={
                  provider.avatar_url || "/images/avatars/DrDavid_avatar.jpg"
                }
                alt={`${provider.first_name} ${provider.last_name}`}
                className="h-full w-full object-cover"
              />
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {provider.first_name} {provider.last_name}
                  </h1>
                  <p className="text-lg text-gray-600 mb-3">
                    {provider.specialty}
                  </p>

                  {/* Experience */}
                  {provider.years_of_experience && (
                    <p className="text-sm text-gray-500 mb-3">
                      {provider.years_of_experience} years of experience
                    </p>
                  )}

                  {/* Service Types */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array.isArray(provider.serviceTypes) &&
                      provider.serviceTypes.map((serviceType) => (
                        <Badge
                          key={serviceType}
                          variant="secondary"
                          className="flex items-center gap-1 text-xs"
                        >
                          {getServiceTypeIcon(serviceType)}
                          {serviceType}
                        </Badge>
                      ))}
                  </div>

                  {/* Licensed States */}
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(provider.licensedStates) &&
                      provider.licensedStates.slice(0, 3).map((state) => (
                        <Badge
                          key={state}
                          variant="outline"
                          className="text-xs px-2 py-1"
                        >
                          {state}
                        </Badge>
                      ))}
                    {Array.isArray(provider.licensedStates) &&
                      provider.licensedStates.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          +{provider.licensedStates.length - 3} more
                        </Badge>
                      )}
                  </div>
                </div>

                {/* Availability Status */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        provider.availability.status === "scheduled"
                          ? "bg-green-400"
                          : "bg-gray-400",
                      )}
                    />
                    <span className="text-gray-600">
                      {provider.availability.status === "scheduled"
                        ? "Available for appointments"
                        : "Currently unavailable"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
