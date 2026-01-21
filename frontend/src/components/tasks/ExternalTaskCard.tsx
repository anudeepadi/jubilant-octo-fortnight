import { useCallback, useRef, useEffect } from 'react';
import { KanbanCard } from '@/components/ui/shadcn-io/kanban';
import { Cloud, Calendar, Flag } from 'lucide-react';
import { TaskCardHeader } from './TaskCardHeader';
import type { ExternalTaskDisplay } from '@/hooks/useExternalTasks';
import { cn } from '@/lib/utils';

interface ExternalTaskCardProps {
  task: ExternalTaskDisplay;
  index: number;
  status: string;
  onViewDetails: (task: ExternalTaskDisplay) => void;
  isOpen?: boolean;
}

const priorityConfig = {
  high: {
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-300 dark:border-red-700',
    label: 'High',
  },
  medium: {
    color: 'text-yellow-600',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-300 dark:border-yellow-700',
    label: 'Medium',
  },
  low: {
    color: 'text-slate-500',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    border: 'border-slate-300 dark:border-slate-600',
    label: 'Low',
  },
};

export function ExternalTaskCard({
  task,
  index,
  status,
  onViewDetails,
  isOpen,
}: ExternalTaskCardProps) {
  const handleClick = useCallback(() => {
    onViewDetails(task);
  }, [task, onViewDetails]);

  const localRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !localRef.current) return;
    const el = localRef.current;
    requestAnimationFrame(() => {
      el.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: 'smooth',
      });
    });
  }, [isOpen]);

  const formatDueDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil(
      (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date() && status !== 'done';

  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <KanbanCard
      key={task.id}
      id={task.id}
      name={task.title}
      index={index}
      parent={status}
      onClick={handleClick}
      isOpen={isOpen}
      forwardedRef={localRef}
    >
      <div className="flex flex-col gap-2">
        <TaskCardHeader
          title={task.title}
          right={
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border',
                  priority.bg,
                  priority.border,
                  priority.color
                )}
              >
                <Flag className="h-2.5 w-2.5" />
                {priority.label}
              </span>
              <Cloud className="h-4 w-4 text-blue-400" />
            </div>
          }
        />
        {task.description && (
          <p className="text-sm text-secondary-foreground break-words">
            {task.description.length > 130
              ? `${task.description.substring(0, 130)}...`
              : task.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          {task.due_date && (
            <span
              className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded',
                isOverdue
                  ? 'text-red-600 bg-red-100 dark:bg-red-900/30 font-medium'
                  : 'bg-muted'
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDueDate(task.due_date)}
            </span>
          )}
          {task.category && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
              {task.category}
            </span>
          )}
          <span className="ml-auto text-blue-400 text-[10px] uppercase tracking-wider">
            External
          </span>
        </div>
      </div>
    </KanbanCard>
  );
}
