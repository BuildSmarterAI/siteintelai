/**
 * Sprint Dashboard - Executive-level task tracking for production readiness
 * Displays sprint progress, task status, and key metrics
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Target,
  Shield,
  TestTube2,
  Sparkles,
  TrendingUp,
  Code2,
  Bug,
} from "lucide-react";

type TaskStatus = "todo" | "in_progress" | "blocked" | "complete" | "skipped";
type TaskComplexity = "XS" | "S" | "M" | "L" | "XL";

interface SprintTask {
  id: string;
  sprint_number: number;
  task_id: string;
  title: string;
  description: string | null;
  complexity: TaskComplexity | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  status: TaskStatus;
  owner: string | null;
  files_involved: string[] | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const SPRINT_INFO = [
  { number: 1, name: "Security Hardening", icon: Shield, color: "text-red-400" },
  { number: 2, name: "Testing Foundation", icon: TestTube2, color: "text-blue-400" },
  { number: 3, name: "Polish & Launch", icon: Sparkles, color: "text-purple-400" },
];

const STATUS_CONFIG: Record<TaskStatus, { icon: typeof Circle; color: string; label: string }> = {
  todo: { icon: Circle, color: "text-muted-foreground", label: "To Do" },
  in_progress: { icon: Clock, color: "text-yellow-400", label: "In Progress" },
  blocked: { icon: AlertTriangle, color: "text-red-400", label: "Blocked" },
  complete: { icon: CheckCircle2, color: "text-green-400", label: "Complete" },
  skipped: { icon: Circle, color: "text-muted-foreground/50", label: "Skipped" },
};

const COMPLEXITY_COLORS: Record<TaskComplexity, string> = {
  XS: "bg-green-500/20 text-green-400 border-green-500/30",
  S: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  M: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  L: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  XL: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function SprintDashboard() {
  const queryClient = useQueryClient();
  const [selectedSprint, setSelectedSprint] = useState<number | null>(null);

  // Fetch all sprint tasks
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["sprint-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sprint_tasks")
        .select("*")
        .order("sprint_number", { ascending: true })
        .order("task_id", { ascending: true });

      if (error) throw error;
      return data as SprintTask[];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const updates: Partial<SprintTask> = { status };
      if (status === "complete") {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("sprint_tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprint-tasks"] });
      toast.success("Task status updated");
    },
    onError: () => {
      toast.error("Failed to update task status");
    },
  });

  const handleStatusToggle = (task: SprintTask) => {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      todo: "in_progress",
      in_progress: "complete",
      complete: "todo",
      blocked: "in_progress",
      skipped: "todo",
    };
    updateTaskMutation.mutate({ taskId: task.id, status: nextStatus[task.status] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <span>Failed to load sprint tasks. Make sure you have admin access.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate metrics per sprint
  const sprintMetrics = SPRINT_INFO.map((sprint) => {
    const sprintTasks = tasks?.filter((t) => t.sprint_number === sprint.number) || [];
    const completedTasks = sprintTasks.filter((t) => t.status === "complete");
    const inProgressTasks = sprintTasks.filter((t) => t.status === "in_progress");
    const blockedTasks = sprintTasks.filter((t) => t.status === "blocked");
    const totalHours = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    const completedHours = completedTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

    return {
      ...sprint,
      total: sprintTasks.length,
      completed: completedTasks.length,
      inProgress: inProgressTasks.length,
      blocked: blockedTasks.length,
      progress: sprintTasks.length > 0 ? (completedTasks.length / sprintTasks.length) * 100 : 0,
      totalHours,
      completedHours,
      tasks: sprintTasks,
    };
  });

  // Overall metrics
  const totalTasks = tasks?.length || 0;
  const completedTotal = tasks?.filter((t) => t.status === "complete").length || 0;
  const inProgressTotal = tasks?.filter((t) => t.status === "in_progress").length || 0;
  const overallProgress = totalTasks > 0 ? (completedTotal / totalTasks) * 100 : 0;

  // Executive metrics (hardcoded for now - could be computed from codebase analysis)
  const executiveMetrics = {
    featureCompletion: 85,
    securityIssues: 30, // From linter
    testCoverage: 0,
    anyTypeCount: 805,
  };

  const filteredTasks = selectedSprint
    ? tasks?.filter((t) => t.sprint_number === selectedSprint)
    : tasks;

  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Feature Completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{executiveMetrics.featureCompletion}%</div>
            <Progress value={executiveMetrics.featureCompletion} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{executiveMetrics.securityIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">Linter warnings</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TestTube2 className="w-4 h-4" />
              Test Coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{executiveMetrics.testCoverage}%</div>
            <p className="text-xs text-muted-foreground mt-1">Target: 25%</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              TypeScript `any`
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-400">{executiveMetrics.anyTypeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Target: &lt;200</p>
          </CardContent>
        </Card>
      </div>

      {/* Sprint Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sprintMetrics.map((sprint) => {
          const Icon = sprint.icon;
          const isActive = sprint.inProgress > 0 || (sprint.progress > 0 && sprint.progress < 100);
          const isComplete = sprint.progress === 100;

          return (
            <Card
              key={sprint.number}
              className={`border-border/50 bg-card/50 cursor-pointer transition-all hover:border-primary/50 ${
                selectedSprint === sprint.number ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedSprint(selectedSprint === sprint.number ? null : sprint.number)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${sprint.color}`} />
                    Sprint {sprint.number}
                  </CardDescription>
                  {isComplete ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Complete</Badge>
                  ) : isActive ? (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">In Progress</Badge>
                  ) : (
                    <Badge variant="outline">Not Started</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{sprint.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={sprint.progress} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {sprint.completed}/{sprint.total} tasks
                    </span>
                    <span className="font-medium">{Math.round(sprint.progress)}%</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{sprint.completedHours}/{sprint.totalHours}h</span>
                    {sprint.blocked > 0 && (
                      <span className="text-red-400">{sprint.blocked} blocked</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overall Progress */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Sprint Progress
              </CardTitle>
              <CardDescription>
                {completedTotal} of {totalTasks} tasks complete ({Math.round(overallProgress)}%)
                {inProgressTotal > 0 && ` • ${inProgressTotal} in progress`}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["sprint-tasks"] })}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3 mb-4" />

          {/* Task Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Task ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[80px]">Sprint</TableHead>
                <TableHead className="w-[80px]">Size</TableHead>
                <TableHead className="w-[80px]">Hours</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks?.map((task) => {
                const StatusIcon = STATUS_CONFIG[task.status].icon;
                return (
                  <TableRow key={task.id} className={task.status === "complete" ? "opacity-60" : ""}>
                    <TableCell className="font-mono text-sm">{task.task_id}</TableCell>
                    <TableCell>
                      <div>
                        <div className={task.status === "complete" ? "line-through" : ""}>
                          {task.title}
                        </div>
                        {task.notes && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                            {task.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">S{task.sprint_number}</Badge>
                    </TableCell>
                    <TableCell>
                      {task.complexity && (
                        <Badge className={COMPLEXITY_COLORS[task.complexity]}>
                          {task.complexity}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.estimated_hours ? `${task.estimated_hours}h` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className={`w-4 h-4 ${STATUS_CONFIG[task.status].color}`} />
                        <span className="text-sm">{STATUS_CONFIG[task.status].label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusToggle(task)}
                        disabled={updateTaskMutation.isPending}
                      >
                        {task.status === "complete" ? "Reopen" : task.status === "in_progress" ? "Done" : "Start"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
