import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  Calendar,
  Flag,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExternalTaskDisplay } from '@/hooks/useExternalTasks';

interface ExternalTaskDashboardProps {
  tasks: ExternalTaskDisplay[];
  onFilterByStatus?: (status: string) => void;
  onFilterByPriority?: (priority: string) => void;
  onFilterByCategory?: (category: string) => void;
}

export function ExternalTaskDashboard({
  tasks,
  onFilterByStatus,
  onFilterByPriority,
  onFilterByCategory,
}: ExternalTaskDashboardProps) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const inProgress = tasks.filter((t) => t.status === 'inprogress').length;
    const done = tasks.filter((t) => t.status === 'done').length;

    const overdue = tasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < new Date() &&
        t.status !== 'done'
    ).length;

    const dueToday = tasks.filter((t) => {
      if (!t.due_date || t.status === 'done') return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      return (
        dueDate.getDate() === today.getDate() &&
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getFullYear() === today.getFullYear()
      );
    }).length;

    const dueSoon = tasks.filter((t) => {
      if (!t.due_date || t.status === 'done') return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      const diffDays = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays > 0 && diffDays <= 7;
    }).length;

    const highPriority = tasks.filter(
      (t) => t.priority === 'high' && t.status !== 'done'
    ).length;

    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    // Category breakdown
    const categories: Record<string, number> = {};
    tasks.forEach((t) => {
      const cat = t.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    // Priority breakdown
    const priorities = {
      high: tasks.filter((t) => t.priority === 'high').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      low: tasks.filter((t) => t.priority === 'low').length,
    };

    return {
      total,
      todo,
      inProgress,
      done,
      overdue,
      dueToday,
      dueSoon,
      highPriority,
      completionRate,
      categories,
      priorities,
    };
  }, [tasks]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.due_date && t.status !== 'done')
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
      )
      .slice(0, 5);
  }, [tasks]);

  return (
    <div className="space-y-6 p-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={cn(
            'cursor-pointer hover:bg-muted/50 transition-colors',
            onFilterByStatus && 'hover:border-primary'
          )}
          onClick={() => onFilterByStatus?.('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completionRate}% complete
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer hover:bg-muted/50 transition-colors',
            onFilterByStatus && 'hover:border-blue-500'
          )}
          onClick={() => onFilterByStatus?.('inprogress')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.inProgress}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.todo} in backlog
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer hover:bg-muted/50 transition-colors',
            onFilterByStatus && 'hover:border-green-500'
          )}
          onClick={() => onFilterByStatus?.('done')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.done}</div>
            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer hover:bg-muted/50 transition-colors border-red-200 dark:border-red-900',
            stats.overdue > 0 && 'bg-red-50 dark:bg-red-900/20'
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              {stats.dueToday} due today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Priority Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Priority Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={cn(
                'flex items-center justify-between cursor-pointer hover:bg-muted p-2 rounded -mx-2',
                onFilterByPriority && 'hover:bg-red-50 dark:hover:bg-red-900/20'
              )}
              onClick={() => onFilterByPriority?.('high')}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">High</span>
              </div>
              <span className="font-medium">{stats.priorities.high}</span>
            </div>
            <div
              className={cn(
                'flex items-center justify-between cursor-pointer hover:bg-muted p-2 rounded -mx-2',
                onFilterByPriority && 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
              )}
              onClick={() => onFilterByPriority?.('medium')}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Medium</span>
              </div>
              <span className="font-medium">{stats.priorities.medium}</span>
            </div>
            <div
              className={cn(
                'flex items-center justify-between cursor-pointer hover:bg-muted p-2 rounded -mx-2',
                onFilterByPriority && 'hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
              onClick={() => onFilterByPriority?.('low')}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-sm">Low</span>
              </div>
              <span className="font-medium">{stats.priorities.low}</span>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Object.entries(stats.categories)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between cursor-pointer hover:bg-muted p-2 rounded -mx-2"
                    onClick={() => onFilterByCategory?.(category)}
                  >
                    <span className="text-sm truncate">{category}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Due */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No upcoming deadlines
                </p>
              ) : (
                upcomingTasks.map((task) => {
                  const isOverdue =
                    task.due_date && new Date(task.due_date) < new Date();
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm truncate max-w-[60%]">
                        {task.title}
                      </span>
                      <span
                        className={cn(
                          'text-xs',
                          isOverdue
                            ? 'text-red-500 font-medium'
                            : 'text-muted-foreground'
                        )}
                      >
                        {task.due_date &&
                          new Date(task.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Created{' '}
                      {new Date(task.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {task.priority === 'high' && (
                      <Flag className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        task.status === 'done'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : task.status === 'inprogress'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      )}
                    >
                      {task.status === 'inprogress'
                        ? 'In Progress'
                        : task.status === 'done'
                        ? 'Done'
                        : 'To Do'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
