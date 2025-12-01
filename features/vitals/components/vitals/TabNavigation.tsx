import { Button } from "@/components/ui/button";

export type VitalsTab =
  | "sleep"
  | "activity"
  | "body-composition"
  | "cardiovascular"
  | "metabolic";

interface TabNavigationProps {
  activeTab: VitalsTab;
  onTabChange: (tab: VitalsTab) => void;
}

export const TabNavigation = ({
  activeTab,
  onTabChange,
}: TabNavigationProps) => {
  const tabs = [
    { value: "sleep" as VitalsTab, label: "Sleep Health" },
    { value: "activity" as VitalsTab, label: "Physical Activity & Workouts" },
    { value: "body-composition" as VitalsTab, label: "Body Composition" },
    { value: "cardiovascular" as VitalsTab, label: "Cardiovascular Health" },
    { value: "metabolic" as VitalsTab, label: "Metabolic Health" },
  ];

  return (
    <div className="w-full mb-6">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              variant={activeTab === tab.value ? "default" : "outline"}
              onClick={() => onTabChange(tab.value)}
              className="rounded-full whitespace-nowrap border border-border"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
