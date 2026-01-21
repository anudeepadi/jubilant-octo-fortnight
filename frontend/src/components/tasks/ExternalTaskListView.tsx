import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeaderCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Flag, Calendar, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ExternalTaskDisplay } from '@/hooks/useExternalTasks';

interface ExternalTaskListViewProps {
  tasks: ExternalTaskDisplay[];
  selectedTaskId?: string;
  selectedTaskIds?: Set<string>;
  onSelectTask: (task: ExternalTaskDisplay) => void;
  onToggleSelect?: (taskId: string) => void;
  onEdit: (task: ExternalTaskDisplay) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
}

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'High' },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Medium' },
  low: { color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800/50', label: 'Low' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  inprogress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  done: { label: 'Done', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

export function ExternalTaskListView({
  tasks,
  selectedTaskId,
  selectedTaskIds = new Set(),
  onSelectTask,
  onToggleSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: ExternalTaskListViewProps) {
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (task: ExternalTaskDisplay) =>
    task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div className="rounded-md border">
      <Table>
        <TableHead>
          <TableRow>
            {onToggleSelect && (
              <TableHeaderCell className="w-12">
                <span className="sr-only">Select</span>
              </TableHeaderCell>
            )}
            <TableHeaderCell className="w-[40%]">Task</TableHeaderCell>
            <TableHeaderCell className="w-[100px]">Status</TableHeaderCell>
            <TableHeaderCell className="w-[100px]">Priority</TableHeaderCell>
            <TableHeaderCell className="w-[120px]">Due Date</TableHeaderCell>
            <TableHeaderCell className="w-[120px]">Category</TableHeaderCell>
            <TableHeaderCell className="w-[80px] text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={onToggleSelect ? 7 : 6}
                className="text-center text-muted-foreground py-8"
              >
                No tasks found
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
              const priority = priorityConfig[task.priority] || priorityConfig.medium;
              const status = statusConfig[task.status] || statusConfig.todo;
              const overdue = isOverdue(task);

              return (
                <TableRow
                  key={task.id}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50',
                    selectedTaskId === task.id && 'bg-muted'
                  )}
                  onClick={() => onSelectTask(task)}
                >
                  {onToggleSelect && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedTaskIds.has(task.id)}
                        onCheckedChange={() => onToggleSelect(task.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-md">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Badge
                          variant="outline"
                          className={cn('cursor-pointer', status.color)}
                        >
                          {status.label}
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(task.id.replace('external-', ''), 'todo');
                          }}
                        >
                          To Do
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(task.id.replace('external-', ''), 'inprogress');
                          }}
                        >
                          In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(task.id.replace('external-', ''), 'done');
                          }}
                        >
                          Done
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('flex items-center gap-1 w-fit', priority.bg, priority.color)}
                    >
                      <Flag className="h-3 w-3" />
                      {priority.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.due_date ? (
                      <span
                        className={cn(
                          'flex items-center gap-1 text-sm',
                          overdue && 'text-red-500 font-medium'
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatDate(task.due_date)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.category ? (
                      <Badge variant="secondary">{task.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(task);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(task);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task.id.replace('external-', ''));
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
