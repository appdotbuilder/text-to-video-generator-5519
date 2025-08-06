
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  
  // Form state for creating tasks
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: null,
    status: 'pending'
  });

  // Edit dialog state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateTaskInput>({
    id: 0,
    title: '',
    description: null,
    status: 'pending'
  });

  // Delete confirmation state
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(formData);
      setTasks((prev: Task[]) => [...prev, newTask]);
      setFormData({
        title: '',
        description: null,
        status: 'pending'
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status
    });
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title?.trim() || !editingTask) return;
    
    setIsLoading(true);
    try {
      const updatedTask = await trpc.updateTask.mutate(editFormData);
      setTasks((prev: Task[]) => 
        prev.map(task => task.id === updatedTask.id ? updatedTask : task)
      );
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    
    setIsLoading(true);
    try {
      await trpc.deleteTask.mutate({ id: deletingTaskId });
      setTasks((prev: Task[]) => prev.filter(task => task.id !== deletingTaskId));
      setDeletingTaskId(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'pending' ? 'completed' : 'pending';
    
    setIsLoading(true);
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: task.id,
        status: newStatus
      });
      setTasks((prev: Task[]) => 
        prev.map(t => t.id === updatedTask.id ? updatedTask : t)
      );
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tasks based on selected filter
  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter);

  const pendingCount = tasks.filter(task => task.status === 'pending').length;
  const completedCount = tasks.filter(task => task.status === 'completed').length;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📝 Task Management</h1>
        <p className="text-gray-600">Organize your tasks and stay productive</p>
        
        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <Badge variant="secondary" className="text-sm">
            📋 Total: {tasks.length}
          </Badge>
          <Badge variant="outline" className="text-sm text-orange-600">
            ⏳ Pending: {pendingCount}
          </Badge>
          <Badge variant="outline" className="text-sm text-green-600">
            ✅ Completed: {completedCount}
          </Badge>
        </div>
      </div>

      {/* Create Task Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Task</CardTitle>
          <CardDescription>Add a new task to your list</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <Input
              placeholder="Task title *"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
              }
              required
              className="text-base"
            />
            <Textarea
              placeholder="Task description (optional)"
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateTaskInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              rows={3}
            />
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Select
                  value={formData.status}
                  onValueChange={(value: TaskStatus) =>
                    setFormData((prev: CreateTaskInput) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">⏳ Pending</SelectItem>
                    <SelectItem value="completed">✅ Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isLoading || !formData.title.trim()} className="px-8">
                {isLoading ? 'Creating...' : '➕ Create Task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="mb-6">
        <Select
          value={filter}
          onValueChange={(value: TaskStatus | 'all') => setFilter(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">📋 All Tasks</SelectItem>
            <SelectItem value="pending">⏳ Pending</SelectItem>
            <SelectItem value="completed">✅ Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
            <p className="text-gray-600 text-center">
              {filter === 'all' 
                ? 'Create your first task above to get started!' 
                : `No ${filter} tasks yet.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task: Task) => (
            <Card key={task.id} className={`transition-all ${task.status === 'completed' ? 'opacity-75' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h3>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status === 'pending' ? '⏳ Pending' : '✅ Completed'}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className={`text-gray-600 mb-3 ${task.status === 'completed' ? 'line-through' : ''}`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>Created: {task.created_at.toLocaleDateString()}</span>
                      <span>Updated: {task.updated_at.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTaskStatus(task)}
                      disabled={isLoading}
                    >
                      {task.status === 'pending' ? '✅ Complete' : '⏳ Pending'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTask(task)}
                      disabled={isLoading}
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingTaskId(task.id)}
                      disabled={isLoading}
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={editingTask !== null} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <Input
              placeholder="Task title *"
              value={editFormData.title || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEditFormData((prev: UpdateTaskInput) => ({ ...prev, title: e.target.value }))
              }
              required
            />
            <Textarea
              placeholder="Task description (optional)"
              value={editFormData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEditFormData((prev: UpdateTaskInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              rows={3}
            />
            <Select
              value={editFormData.status || 'pending'}
              onValueChange={(value: TaskStatus) =>
                setEditFormData((prev: UpdateTaskInput) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">⏳ Pending</SelectItem>
                <SelectItem value="completed">✅ Completed</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !editFormData.title?.trim()}>
                {isLoading ? 'Updating...' : 'Update Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingTaskId !== null} onOpenChange={(open) => !open && setDeletingTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
