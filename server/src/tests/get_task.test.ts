
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput, type CreateTaskInput } from '../schema';
import { getTask } from '../handlers/get_task';

// Test helper to create a task directly in the database
const createTestTask = async (taskData: Omit<CreateTaskInput, 'status'> & { status?: 'pending' | 'completed' }) => {
  const result = await db.insert(tasksTable)
    .values({
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'pending'
    })
    .returning()
    .execute();

  return result[0];
};

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a task when found', async () => {
    // Create test task
    const createdTask = await createTestTask({
      title: 'Test Task',
      description: 'Test description',
      status: 'pending'
    });

    const input: GetTaskInput = { id: createdTask.id };
    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTask.id);
    expect(result!.title).toEqual('Test Task');
    expect(result!.description).toEqual('Test description');
    expect(result!.status).toEqual('pending');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when task not found', async () => {
    const input: GetTaskInput = { id: 999 };
    const result = await getTask(input);

    expect(result).toBeNull();
  });

  it('should handle task with null description', async () => {
    // Create test task with null description
    const createdTask = await createTestTask({
      title: 'Task without description',
      description: null
    });

    const input: GetTaskInput = { id: createdTask.id };
    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTask.id);
    expect(result!.title).toEqual('Task without description');
    expect(result!.description).toBeNull();
    expect(result!.status).toEqual('pending');
  });

  it('should handle completed task status', async () => {
    // Create test task with completed status
    const createdTask = await createTestTask({
      title: 'Completed Task',
      description: 'This task is done',
      status: 'completed'
    });

    const input: GetTaskInput = { id: createdTask.id };
    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('completed');
  });
});
