import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { externalTasksApi } from '@/lib/external-tasks-api';
import { ExternalTask, mapExternalStatus, isSupabaseConfigured } from '@/lib/supabase';
import type { TaskStatus } from 'shared/types';

// Convert external task to Vibe Kanban task-like structure
export interface ExternalTaskDisplay {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  category: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  context: string | null;
  next_actions: string[] | null;
  // Mark as external for UI differentiation
  isExternal: true;
  // Original external data
  _external: ExternalTask;
}

function normalizePriority(priority: string | null | undefined): 'low' | 'medium' | 'high' {
  if (!priority) return 'medium';
  const p = priority.toLowerCase();
  if (['high', 'urgent', 'critical'].includes(p)) return 'high';
  if (['low', 'minor'].includes(p)) return 'low';
  return 'medium';
}

function convertToDisplayTask(task: ExternalTask): ExternalTaskDisplay {
  return {
    id: `external-${task.id}`,
    title: task.title,
    description: task.description || null,
    status: mapExternalStatus(task.status) as TaskStatus,
    priority: normalizePriority(task.priority),
    category: task.category || null,
    due_date: task.due_date || null,
    created_at: task.created_at || new Date().toISOString(),
    updated_at: task.updated_at || new Date().toISOString(),
    context: task.context || null,
    next_actions: task.next_actions || null,
    isExternal: true,
    _external: task,
  };
}

export function useExternalTasks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['external-tasks'],
    queryFn: externalTasksApi.getAll,
    enabled: isSupabaseConfigured(),
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const subscription = externalTasksApi.subscribe(() => {
      // Invalidate and refetch on any change
      queryClient.invalidateQueries({ queryKey: ['external-tasks'] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const displayTasks: ExternalTaskDisplay[] = (query.data || []).map(
    convertToDisplayTask
  );

  return {
    tasks: displayTasks,
    rawTasks: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isConfigured: isSupabaseConfigured(),
  };
}

export function useExternalTaskMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (
      task: Omit<ExternalTask, 'id' | 'created_at' | 'updated_at'>
    ) => externalTasksApi.create(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-tasks'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ExternalTask>;
    }) => externalTasksApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-tasks'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => externalTasksApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-tasks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => externalTasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-tasks'] });
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending || updateStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
