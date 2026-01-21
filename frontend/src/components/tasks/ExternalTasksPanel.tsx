import { memo, useMemo, useCallback } from 'react';
import {
  type DragEndEvent,
  KanbanBoard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban';
import { ExternalTaskCard } from './ExternalTaskCard';
import { useExternalTasks, useExternalTaskMutations } from '@/hooks/useExternalTasks';
import type { ExternalTaskDisplay } from '@/hooks/useExternalTasks';
import { Cloud, RefreshCw, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TaskStatus = 'todo' | 'inprogress' | 'done';

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  done: 'Done',
};

const statusColors: Record<TaskStatus, string> = {
  todo: 'bg-slate-400',
  inprogress: 'bg-blue-400',
  done: 'bg-green-400',
};

interface ExternalTasksPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onViewDetails?: (task: ExternalTaskDisplay) => void;
  selectedTaskId?: string;
}

function ExternalTasksPanelContent({
  onViewDetails,
  selectedTaskId,
}: {
  onViewDetails?: (task: ExternalTaskDisplay) => void;
  selectedTaskId?: string;
}) {
  const { tasks, isLoading, isError, error, refetch, isConfigured } =
    useExternalTasks();
  const { updateStatus } = useExternalTaskMutations();

  const columns = useMemo(() => {
    const cols: Record<TaskStatus, ExternalTaskDisplay[]> = {
      todo: [],
      inprogress: [],
      done: [],
    };

    tasks.forEach((task) => {
      const status = task.status as TaskStatus;
      if (cols[status]) {
        cols[status].push(task);
      }
    });

    return cols;
  }, [tasks]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !active.data.current) return;

      const draggedTaskId = active.id as string;
      const newStatus = over.id as TaskStatus;

      // Extract the original Supabase ID from the prefixed ID
      const originalId = draggedTaskId.replace('external-', '');
      const task = tasks.find((t) => t.id === draggedTaskId);

      if (!task || task.status === newStatus) return;

      try {
        await updateStatus({ id: originalId, status: newStatus });
      } catch (err) {
        console.error('Failed to update external task status:', err);
      }
    },
    [tasks, updateStatus]
  );

  const handleViewDetails = useCallback(
    (task: ExternalTaskDisplay) => {
      onViewDetails?.(task);
    },
    [onViewDetails]
  );

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Settings className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Supabase Not Configured</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          To display external tasks, configure your Supabase credentials in the
          environment variables:
        </p>
        <code className="text-xs bg-muted p-2 rounded block">
          VITE_SUPABASE_URL=https://your-project.supabase.co
          <br />
          VITE_SUPABASE_ANON_KEY=your-anon-key
        </code>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading external tasks...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load tasks</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {error?.message || 'Unknown error occurred'}
        </p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Cloud className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No External Tasks</h3>
        <p className="text-sm text-muted-foreground">
          Tasks from your Supabase database will appear here.
        </p>
      </div>
    );
  }

  return (
    <KanbanProvider onDragEnd={handleDragEnd}>
      {(['todo', 'inprogress', 'done'] as TaskStatus[]).map((status) => {
        const statusTasks = columns[status];
        return (
          <KanbanBoard key={status} id={status}>
            <KanbanHeader
              name={statusLabels[status]}
              color={statusColors[status]}
            />
            <KanbanCards>
              {statusTasks.map((task, index) => (
                <ExternalTaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  status={status}
                  onViewDetails={handleViewDetails}
                  isOpen={selectedTaskId === task.id}
                />
              ))}
            </KanbanCards>
          </KanbanBoard>
        );
      })}
    </KanbanProvider>
  );
}

function ExternalTasksPanel({
  isOpen,
  onToggle,
  onViewDetails,
  selectedTaskId,
}: ExternalTasksPanelProps) {
  const { tasks, isConfigured } = useExternalTasks();

  return (
    <div
      className={cn(
        'border-t bg-background transition-all duration-300',
        isOpen ? 'h-[400px]' : 'h-12'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full h-12 px-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-400" />
          <span className="font-medium">External Tasks (Supabase)</span>
          {isConfigured && tasks.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {isOpen ? 'Click to collapse' : 'Click to expand'}
        </span>
      </button>

      {isOpen && (
        <div className="h-[calc(100%-48px)] overflow-x-auto overflow-y-auto p-4">
          <ExternalTasksPanelContent
            onViewDetails={onViewDetails}
            selectedTaskId={selectedTaskId}
          />
        </div>
      )}
    </div>
  );
}

export default memo(ExternalTasksPanel);
