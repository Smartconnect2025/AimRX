import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/tailwind-utils";
import { Session } from "../../types/session";
import { SessionCard } from "./SessionCard";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";

interface SessionsListProps {
  sessions: Session[];
  onJoinSession?: (sessionId: string) => void;
  onSessionClick?: (sessionId: string) => void;
  className?: string;
}

export function SessionsList({
  sessions,
  onJoinSession,
  onSessionClick,
  className,
}: SessionsListProps) {
  const router = useRouter();
  // Show all sessions instead of filtering by status
  const allSessions = sessions;

  const handleBookProvider = () => {
    router.push("/provider-search");
  };

  const renderSessionSection = (
    title: string,
    sectionSessions: Session[],
    _emptyMessage: string,
  ) => (
    <div className="space-y-4">
      {sectionSessions.length === 0 ? (
        <Card className="bg-slate-50 border-none">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-700">
                  No active sessions
                </h3>
              </div>
              <Button
                onClick={handleBookProvider}
                className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Book a Provider
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {sectionSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onJoin={onJoinSession}
              onCancel={onSessionClick}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-8", className)}>
      {renderSessionSection(
        "Your Appointments",
        allSessions,
        "No upcoming appointments.",
      )}
    </div>
  );
}
