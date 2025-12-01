import { Goal } from '../../types';
import { GoalCard } from '../GoalCard';

interface GoalListProps {
  goals: Goal[];
  onUpdateProgress?: (goal: Goal) => void;
  onDeleteGoal?: (goalId: string) => void;
}

export function GoalList({ goals, onUpdateProgress, onDeleteGoal }: GoalListProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onUpdateProgress={onUpdateProgress} onDeleteGoal={onDeleteGoal} />
        ))}
        {goals.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No goals. Create one to get started!
          </p>
        )}
      </div>
    </div>
  );
} 