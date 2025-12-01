"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Search, Heart, Target, Thermometer, BookOpen } from "lucide-react";
import { NavigationCard } from "@/features/shared";

export interface DashboardNavigationProps {
  className?: string;
}

export const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  className,
}) => {
  const router = useRouter();

  const navigationItems = [
    {
      title: "Find Provider",
      description: "Search and book appointments with healthcare providers",
      icon: Search,
      onClick: () => router.push("/provider-search"),
    },
    {
      title: "Track Moods",
      description: "Monitor your daily mood and emotional well-being",
      icon: Heart,
      onClick: () => router.push("/mood-tracker"),
    },
    {
      title: "Track Goals",
      description: "Set and monitor your health and wellness goals",
      icon: Target,
      onClick: () => router.push("/goals"),
    },
    {
      title: "Track Symptoms",
      description: "Log and analyze your symptoms over time",
      icon: Thermometer,
      onClick: () => router.push("/symptom-tracker"),
    },
    {
      title: "Journal",
      description: "Record your thoughts, experiences, and daily reflections",
      icon: BookOpen,
      onClick: () => router.push("/journal"),
    },
  ];

  return (
    <section className={className}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
        <p className="text-muted-foreground text-sm">
          Access your health tracking tools and find care providers
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Find Provider - Takes 2 columns on large screens */}
        <NavigationCard
          {...navigationItems[0]}
          variant="large"
          className="lg:col-span-2"
        />

        {/* Track Moods */}
        <NavigationCard {...navigationItems[1]} />

        {/* Track Goals */}
        <NavigationCard {...navigationItems[2]} />

        {/* Track Symptoms */}
        <NavigationCard {...navigationItems[3]} />

        {/* Journal */}
        <NavigationCard {...navigationItems[4]} />
      </div>
    </section>
  );
};
