
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Test input for creating initial task
const createTaskInput: CreateTaskInput = {
  title: 'Original Task',
  description: 'Original description',
  status: 'pending'
};

// Helper function to create a task for testing
const createTestTask = async (input: CreateTaskInput) => {
  const result = await db.insert(tasksTable)
    .values({
      title: input.title,
      description: input.description,
      status: input.status
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title', async () => {
    // Create initial task
    const createdTask = await createTestTask(createTaskInput);
    
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual(createdTask.description); // Should remain unchanged
    expect(result.status).toEqual(createdTask.status); // Should remain unchanged
    expect(result.created_at).toEqual(createdTask.created_at); // Should remain unchanged
    expect(result.updated_at).not.toEqual(createdTask.updated_at); // Should be updated
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task description', async () => {
    const createdTask = await createTestTask(createTaskInput);
    
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual(createdTask.title); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.status).toEqual(createdTask.status); // Should remain unchanged
    expect(result.updated_at).not.toEqual(createdTask.updated_at);
  });

  it('should update task status', async () => {
    const createdTask = await createTestTask(createTaskInput);
    
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      status: 'completed'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual(createdTask.title); // Should remain unchanged
    expect(result.description).toEqual(createdTask.description); // Should remain unchanged
    expect(result.status).toEqual('completed');
    expect(result.updated_at).not.toEqual(createdTask.updated_at);
  });

  it('should update multiple fields', async () => {
    const createdTask = await createTestTask(createTaskInput);
    
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'Multi-updated Title',
      description: 'Multi-updated description',
      status: 'completed'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Multi-updated Title');
    expect(result.description).toEqual('Multi-updated description');
    expect(result.status).toEqual('completed');
    expect(result.created_at).toEqual(createdTask.created_at); // Should remain unchanged
    expect(result.updated_at).not.toEqual(createdTask.updated_at);
  });

  it('should set description to null when explicitly provided', async () => {
    const createdTask = await createTestTask(createTaskInput);
    
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      description: null
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.description).toBeNull();
    expect(result.title).toEqual(createdTask.title); // Should remain unchanged
    expect(result.status).toEqual(createdTask.status); // Should remain unchanged
  });

  it('should save updated task to database', async () => {
    const createdTask = await createTestTask(createTaskInput);
    
    const updateInput: UpdateTaskInput = {
      id: createdTask.id,
      title: 'DB Updated Task'
    };

    await updateTask(updateInput);

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('DB Updated Task');
    expect(tasks[0].description).toEqual(createdTask.description);
    expect(tasks[0].status).toEqual(createdTask.status);
    expect(tasks[0].updated_at).not.toEqual(createdTask.updated_at);
  });

  it('should throw error when task not found', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999999, // Non-existent ID
      title: 'Should fail'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/task with id 999999 not found/i);
  });

  it('should handle updating task with no fields changed gracefully', async () => {
    const createdTask = await createTestTask(createTaskInput);
    
    const updateInput: UpdateTaskInput = {
      id: createdTask.id
      // No fields to update except id
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual(createdTask.title);
    expect(result.description).toEqual(createdTask.description);
    expect(result.status).toEqual(createdTask.status);
    expect(result.created_at).toEqual(createdTask.created_at);
    expect(result.updated_at).not.toEqual(createdTask.updated_at); // Should still update timestamp
  });
});
