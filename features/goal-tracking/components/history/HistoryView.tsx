'use client';
import { useState } from 'react';
import { Goal, GoalHistoryEntry } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft, CalendarDays, History } from 'lucide-react';
import { PerformanceChart } from './PerformanceChart';

interface HistoryViewProps {
  goals: Goal[];
  historyData: Record<string, GoalHistoryEntry[]>;
  onBackToGoals: () => void;
}

export function HistoryView({ goals, historyData, onBackToGoals }: HistoryViewProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(goals[0]?.id || '');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');

  if (goals.length === 0) {
    return <div className="text-center text-muted-foreground py-12">No goals to show history for.</div>;
  }

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const goalHistory = selectedGoal ? historyData[selectedGoal.id] || [] : [];

  const today = new Date();
  const timeframeInDays = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const cutoffDate = new Date(today);
  cutoffDate.setDate(today.getDate() - timeframeInDays);
  const filteredHistory = goalHistory
    .filter(entry => entry.date >= cutoffDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-6 w-full px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBackToGoals}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <History className="h-5 w-5" /> Goal History
        </h2>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-6 w-full max-w-full">
        <Card className="w-full md:col-span-2">
          <CardHeader>
            <CardTitle>Select Goal</CardTitle>
            <CardDescription>Choose a goal to view its performance history</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    <div className="flex items-center gap-2">
                      <span>{goal.metric}</span>
                      {goal.type === 'provider' ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Provider</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Personal</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedGoal && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-medium">{selectedGoal.target_value} {selectedGoal.unit}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Timeframe:</span>
                  <span className="font-medium">{selectedGoal.timeframe}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{format(selectedGoal.created_at, 'MMM d, yyyy')}</span>
                </div>
              </div>
            )}
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Time Period</p>
              <Tabs defaultValue="7d" value={timeframe} onValueChange={v => setTimeframe(v as '7d' | '30d' | '90d')}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="7d">7 Days</TabsTrigger>
                  <TabsTrigger value="30d">30 Days</TabsTrigger>
                  <TabsTrigger value="90d">90 Days</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
        <Card className="w-full md:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Performance History</CardTitle>
              <CardDescription>
                {selectedGoal ? (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    Last {timeframeInDays} days of {selectedGoal.metric}
                  </span>
                ) : 'Select a goal to view history'}
              </CardDescription>
            </div>
            {selectedGoal && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Target: {selectedGoal.target_value} {selectedGoal.unit}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="w-full overflow-x-auto">
            {selectedGoal ? (
              filteredHistory.length > 0 ? (
                <PerformanceChart goal={selectedGoal} historyData={filteredHistory} />
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available for the selected timeframe</p>
                </div>
              )
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Select a goal to view performance history</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 