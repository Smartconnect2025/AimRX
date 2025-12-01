import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/utils/tailwind-utils";
import { Session } from "../../types/session";
import { CalendarIcon, ClockIcon, LogIn, Trash2, Video } from "lucide-react";

interface SessionCardProps {
  session: Session;
  onJoin?: (sessionId: string) => void;
  onCancel?: (sessionId: string) => void;
  className?: string;
}

export function SessionCard({
  session,
  onJoin,
  onCancel,
  className,
}: SessionCardProps) {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isJoining && onJoin) {
      setIsJoining(true);
      onJoin(session.id);
    }
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Removed status-related functions since sessions don't have status
  // Always show both join and cancel buttons

  return (
    <Card
      className={cn(
        "w-full bg-white p-6 transition-shadow duration-300 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]",
        isJoining ? "opacity-50" : "",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
        {session.provider.photoUrl ? (
          <img
            src={session.provider.photoUrl}
            alt={`${session.provider.first_name} ${session.provider.last_name}`}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
            {session.provider.first_name?.charAt(0) || ""}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">
            {session.provider.first_name} {session.provider.last_name}
          </h3>
          <p className="text-slate-600">{session.provider.specialty}</p>
          {/* Removed status badge since sessions don't have status */}
        </div>
      </div>

      <div className="space-y-2 text-slate-600 mb-6">
        <div className="flex items-center">
          <CalendarIcon className="w-4 h-4 mr-3 text-slate-400 flex-shrink-0" />
          <span className="text-sm sm:text-base">
            {session.date}, {session.time}
          </span>
        </div>
        <div className="flex items-center">
          <ClockIcon className="w-4 h-4 mr-3 text-slate-400 flex-shrink-0" />
          <span className="text-sm sm:text-base">
            {session.duration} minutes
          </span>
        </div>
        <div className="flex items-center">
          <Video className="w-4 h-4 mr-3 text-slate-400 flex-shrink-0" />
          <span className="text-sm sm:text-base">{session.type}</span>
        </div>
      </div>

      {/* Meeting Reason */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-sm sm:text-base text-slate-700">
          <span className="font-medium">Reason: </span>
          {session.reason || "General consultation"}
        </p>
      </div>

      {/* Join Button */}
      {onJoin && (
        <div className="mt-4">
          <Button
            onClick={handleJoinClick}
            disabled={isJoining}
            variant="default"
            className="w-full"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Join Call
          </Button>
        </div>
      )}

      {/* Cancel Button at Bottom */}
      {onCancel && (
        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleCancelClick}
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Cancel Appointment
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border border-border">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently cancel
                  your appointment with {session.provider.first_name}{" "}
                  {session.provider.last_name}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border border-border">
                  Keep Appointment
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onCancel(session.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Yes, Cancel Appointment
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Card>
  );
}
