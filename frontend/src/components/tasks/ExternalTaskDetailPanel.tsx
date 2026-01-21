import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  X,
  Calendar,
  Flag,
  Clock,
  Tag,
  FileText,
  CheckSquare,
  History,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExternalTaskDisplay } from '@/hooks/useExternalTasks';

interface ExternalTaskDetailPanelProps {
  task: ExternalTaskDisplay;
  onClose: () => void;
  onEdit: (task: ExternalTaskDisplay) => void;
  onDelete: (taskId: string) => Promise<void>;
}

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  high: {
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
    label: 'High Priority',
  },
  medium: {
    color: 'text-yellow-600',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'Medium Priority',
  },
  low: {
    color: 'text-slate-500',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    label: 'Low Priority',
  },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'bg-slate-500' },
  inprogress: { label: 'In Progress', color: 'bg-blue-500' },
  done: { label: 'Done', color: 'bg-green-500' },
};

export function ExternalTaskDetailPanel({
  task,
  onClose,
  onEdit,
  onDelete,
}: ExternalTaskDetailPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.todo;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== 'done';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const originalId = task.id.replace('external-', '');
      await onDelete(originalId);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-white', status.color)}>
              {status.label}
            </Badge>
            <Badge variant="outline" className={cn(priority.bg, priority.color)}>
              <Flag className="h-3 w-3 mr-1" />
              {priority.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-xl font-semibold">{task.title}</h2>
            {task.category && (
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <Tag className="h-3 w-3" />
                {task.category}
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Description
              </h3>
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {task.due_date && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </h3>
                <p
                  className={cn(
                    'text-sm font-medium',
                    isOverdue && 'text-red-500'
                  )}
                >
                  {formatDate(task.due_date)}
                  {isOverdue && ' (Overdue)'}
                </p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Created
              </h3>
              <p className="text-sm">{formatDate(task.created_at)}</p>
            </div>
          </div>

          {/* Context */}
          {task.context && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Context / Notes
              </h3>
              <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                {task.context}
              </div>
            </div>
          )}

          {/* Next Actions */}
          {task.next_actions && task.next_actions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <CheckSquare className="h-4 w-4" />
                Next Actions
              </h3>
              <ul className="space-y-2">
                {task.next_actions.map((action, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm bg-muted p-2 rounded"
                  >
                    <span className="text-muted-foreground">{index + 1}.</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Progress Log */}
          {task._external.progress_log &&
            task._external.progress_log.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <History className="h-4 w-4" />
                  Progress Log
                </h3>
                <ul className="space-y-2">
                  {task._external.progress_log.map((entry, index) => (
                    <li
                      key={index}
                      className="text-sm bg-muted p-2 rounded border-l-2 border-blue-400"
                    >
                      {entry}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Resource References */}
          {task._external.resource_refs &&
            task._external.resource_refs.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <ExternalLink className="h-4 w-4" />
                  Resources
                </h3>
                <ul className="space-y-1">
                  {task._external.resource_refs.map((ref, index) => (
                    <li key={index} className="text-sm">
                      {ref.startsWith('http') ? (
                        <a
                          href={ref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {ref}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{ref}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Estimated Time */}
          {task._external.estimated_time && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Estimated Time
              </h3>
              <p className="text-sm">{task._external.estimated_time} minutes</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <p>ID: {task._external.id}</p>
            {task._external.filename && <p>File: {task._external.filename}</p>}
            <p>Last updated: {formatDate(task.updated_at)}</p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "{task.title}"? This action cannot
            be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
