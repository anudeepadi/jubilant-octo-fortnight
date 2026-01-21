import {
  supabase,
  ExternalTask,
  mapToExternalStatus,
  isSupabaseConfigured,
} from './supabase';

export const externalTasksApi = {
  /**
   * Fetch all tasks from Supabase
   */
  getAll: async (): Promise<ExternalTask[]> => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, returning empty tasks');
      return [];
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching external tasks:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetch tasks by category
   */
  getByCategory: async (category: string): Promise<ExternalTask[]> => {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching category tasks:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Create a new task in Supabase
   */
  create: async (
    task: Omit<ExternalTask, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ExternalTask> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      console.error('Error creating external task:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update a task in Supabase
   */
  update: async (
    id: string,
    updates: Partial<ExternalTask>
  ): Promise<ExternalTask> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating external task:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update task status (for drag-and-drop)
   */
  updateStatus: async (
    id: string,
    status: string
  ): Promise<ExternalTask> => {
    const externalStatus = mapToExternalStatus(status);
    return externalTasksApi.update(id, { status: externalStatus });
  },

  /**
   * Delete a task from Supabase
   */
  delete: async (id: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting external task:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time changes on tasks table
   */
  subscribe: (
    callback: (payload: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      new: ExternalTask | null;
      old: ExternalTask | null;
    }) => void
  ) => {
    if (!isSupabaseConfigured()) {
      return { unsubscribe: () => {} };
    }

    const channel = supabase
      .channel('external-tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as ExternalTask | null,
            old: payload.old as ExternalTask | null,
          });
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },
};
