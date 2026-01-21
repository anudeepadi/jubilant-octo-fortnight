import { memo, useMemo, useCallback, useState } from 'react';
import {
  type DragEndEvent,
  KanbanBoard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban';
import { ExternalTaskCard } from '@/components/tasks/ExternalTaskCard';
import { ExternalTaskFormDialog } from '@/components/tasks/ExternalTaskFormDialog';
import { ExternalTaskDetailPanel } from '@/components/tasks/ExternalTaskDetailPanel';
import { ExternalTaskListView } from '@/components/tasks/ExternalTaskListView';
import { ExternalTaskDashboard } from '@/components/tasks/ExternalTaskDashboard';
import {
  useExternalTasks,
  useExternalTaskMutations,
} from '@/hooks/useExternalTasks';
import type { ExternalTaskDisplay } from '@/hooks/useExternalTasks';
import type { ExternalTask } from '@/lib/supabase';
import {
  Cloud,
  RefreshCw,
  AlertCircle,
  Settings,
  Filter,
  ArrowUpDown,
  Plus,
  LayoutGrid,
  List,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type TaskStatus = 'todo' | 'inprogress' | 'done';
type ViewMode = 'kanban' | 'list' | 'dashboard';

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

function ExternalTasksContent() {
  const { tasks, isLoading, isError, error, refetch, isConfigured } =
    useExternalTasks();
  const { updateStatus, create, update, delete: deleteTask, queueAutomation } =
    useExternalTaskMutations();

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('due_date');
  const [selectedTask, setSelectedTask] = useState<ExternalTaskDisplay | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<ExternalTask | null>(null);

  // Priority order for sorting
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

  // Get unique categories from tasks
  const categories = useMemo(() => {
    const cats = new Set<string>();
    tasks.forEach((task) => {
      if (task.category) cats.add(task.category);
    });
    return Array.from(cats).sort();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query);
        const matchesCategory = task.category?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesCategory) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'all' && task.category !== categoryFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, categoryFilter, priorityFilter]);

  // Sort function
  const sortTasks = useCallback(
    (tasksToSort: ExternalTaskDisplay[]): ExternalTaskDisplay[] => {
      return [...tasksToSort].sort((a, b) => {
        switch (sortBy) {
          case 'due_date': {
            if (!a.due_date && !b.due_date) return 0;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          }
          case 'priority': {
            const aPriority = priorityOrder[a.priority] ?? 1;
            const bPriority = priorityOrder[b.priority] ?? 1;
            return aPriority - bPriority;
          }
          case 'created': {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          case 'title': {
            return a.title.localeCompare(b.title);
          }
          default:
            return 0;
        }
      });
    },
    [sortBy, priorityOrder]
  );

  // Sorted and filtered tasks for list view
  const sortedTasks = useMemo(() => sortTasks(filteredTasks), [filteredTasks, sortTasks]);

  // Columns for Kanban view
  const columns = useMemo(() => {
    const cols: Record<TaskStatus, ExternalTaskDisplay[]> = {
      todo: [],
      inprogress: [],
      done: [],
    };

    filteredTasks.forEach((task) => {
      const status = task.status as TaskStatus;
      if (cols[status]) {
        cols[status].push(task);
      }
    });

    cols.todo = sortTasks(cols.todo);
    cols.inprogress = sortTasks(cols.inprogress);
    cols.done = sortTasks(cols.done);

    return cols;
  }, [filteredTasks, sortTasks]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !active.data.current) return;

      const draggedTaskId = active.id as string;
      const newStatus = over.id as TaskStatus;

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

  const handleSelectTask = useCallback((task: ExternalTaskDisplay) => {
    setSelectedTask((prev) => (prev?.id === task.id ? null : task));
  }, []);

  const handleEditTask = useCallback((task: ExternalTaskDisplay) => {
    setEditingTask(task._external);
    setShowTaskForm(true);
  }, []);

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        await deleteTask(taskId);
        if (selectedTask?.id === `external-${taskId}`) {
          setSelectedTask(null);
        }
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    },
    [deleteTask, selectedTask]
  );

  const handleStatusChange = useCallback(
    async (taskId: string, status: string) => {
      try {
        await updateStatus({ id: taskId, status });
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    },
    [updateStatus]
  );

  const handleCreateTask = useCallback(() => {
    setEditingTask(null);
    setShowTaskForm(true);
  }, []);

  const handleSubmitTask = useCallback(
    async (data: Partial<ExternalTask>) => {
      if (editingTask) {
        await update({ id: editingTask.id, updates: data });
      } else {
        await create(data as Omit<ExternalTask, 'id' | 'created_at' | 'updated_at'>);
      }
    },
    [editingTask, create, update]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedTask(null);
  }, []);

  const handleQueueAutomation = useCallback(
    async (taskId: string) => {
      try {
        await queueAutomation(taskId);
      } catch (err) {
        console.error('Failed to queue automation:', err);
      }
    },
    [queueAutomation]
  );

  // Dashboard filter handlers
  const handleDashboardStatusFilter = useCallback((status: string) => {
    if (status === 'all') {
      setPriorityFilter('all');
      setCategoryFilter('all');
    }
    setViewMode('list');
  }, []);

  const handleDashboardPriorityFilter = useCallback((priority: string) => {
    setPriorityFilter(priority);
    setViewMode('list');
  }, []);

  const handleDashboardCategoryFilter = useCallback((category: string) => {
    setCategoryFilter(category === 'Uncategorized' ? 'all' : category);
    setViewMode('list');
  }, []);

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Settings className="h-16 w-16 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-semibold mb-3">Supabase Not Configured</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          To display your external tasks, configure your Supabase credentials in
          the environment variables:
        </p>
        <code className="text-sm bg-muted p-4 rounded-lg block">
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
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-lg text-muted-foreground">
          Loading tasks from Supabase...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="h-16 w-16 text-destructive mb-6" />
        <h2 className="text-2xl font-semibold mb-3">Failed to load tasks</h2>
        <p className="text-muted-foreground mb-6">
          {error?.message || 'Unknown error occurred'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header / Filters Bar */}
        <div className="shrink-0 border-b bg-background p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-500" />
              <h1 className="text-lg font-semibold">External Tasks</h1>
              <span className="text-sm text-muted-foreground">
                ({filteredTasks.length} of {tasks.length})
              </span>
            </div>

            <div className="flex-1" />

            {/* View Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="gap-1 rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-1 rounded-none border-x"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </Button>
              <Button
                variant={viewMode === 'dashboard' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('dashboard')}
                className="gap-1 rounded-l-none"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </div>

            <Button onClick={handleCreateTask} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Task
            </Button>
          </div>

          {/* Filters Row - hide on dashboard */}
          {viewMode !== 'dashboard' && (
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />

              {categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="created">Created Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'dashboard' ? (
            <div className="h-full overflow-y-auto">
              <ExternalTaskDashboard
                tasks={tasks}
                onFilterByStatus={handleDashboardStatusFilter}
                onFilterByPriority={handleDashboardPriorityFilter}
                onFilterByCategory={handleDashboardCategoryFilter}
              />
            </div>
          ) : viewMode === 'list' ? (
            <div className="h-full overflow-y-auto p-4">
              <ExternalTaskListView
                tasks={sortedTasks}
                selectedTaskId={selectedTask?.id}
                onSelectTask={handleSelectTask}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Cloud className="h-16 w-16 text-muted-foreground mb-6" />
              <h2 className="text-xl font-medium mb-2">
                {tasks.length === 0 ? 'No Tasks Found' : 'No Matching Tasks'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {tasks.length === 0
                  ? 'Tasks from your Supabase database will appear here.'
                  : 'Try adjusting your search or filters.'}
              </p>
              <Button onClick={handleCreateTask}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Task
              </Button>
            </div>
          ) : (
            <div className="h-full overflow-x-auto overflow-y-auto p-4">
              <KanbanProvider onDragEnd={handleDragEnd}>
                <div className="flex gap-4 min-w-max h-full">
                  {(['todo', 'inprogress', 'done'] as TaskStatus[]).map((status) => {
                    const statusTasks = columns[status];
                    return (
                      <KanbanBoard
                        key={status}
                        id={status}
                        className="w-80 shrink-0"
                      >
                        <KanbanHeader
                          name={`${statusLabels[status]} (${statusTasks.length})`}
                          color={statusColors[status]}
                        />
                        <KanbanCards>
                          {statusTasks.map((task, index) => (
                            <ExternalTaskCard
                              key={task.id}
                              task={task}
                              index={index}
                              status={status}
                              onViewDetails={handleSelectTask}
                              isOpen={selectedTask?.id === task.id}
                            />
                          ))}
                        </KanbanCards>
                      </KanbanBoard>
                    );
                  })}
                </div>
              </KanbanProvider>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedTask && (
        <div className="w-96 shrink-0 border-l">
          <ExternalTaskDetailPanel
            task={selectedTask}
            onClose={handleCloseDetail}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onQueueAutomation={handleQueueAutomation}
          />
        </div>
      )}

      {/* Task Form Dialog */}
      <ExternalTaskFormDialog
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
        task={editingTask}
        onSubmit={handleSubmitTask}
        categories={categories}
      />
    </div>
  );
}

export function ExternalTasks() {
  return (
    <div className="h-full">
      <ExternalTasksContent />
    </div>
  );
}

export default memo(ExternalTasks);
