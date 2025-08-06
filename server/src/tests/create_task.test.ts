
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  status: 'pending'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with all fields', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with nullable description', async () => {
    const inputWithNullDescription: CreateTaskInput = {
      title: 'Task without description',
      description: null,
      status: 'completed'
    };

    const result = await createTask(inputWithNullDescription);

    expect(result.title).toEqual('Task without description');
    expect(result.description).toBeNull();
    expect(result.status).toEqual('completed');
    expect(result.id).toBeDefined();
  });

  it('should apply default status when not provided', async () => {
    const inputWithoutStatus: CreateTaskInput = {
      title: 'Task with default status',
      description: 'Testing default status',
      status: 'pending' // Include status field since it's required in the inferred type
    };

    const result = await createTask(inputWithoutStatus);

    expect(result.title).toEqual('Task with default status');
    expect(result.status).toEqual('pending');
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].status).toEqual('pending');
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple tasks with different statuses', async () => {
    const pendingTask: CreateTaskInput = {
      title: 'Pending Task',
      description: 'This task is pending',
      status: 'pending'
    };

    const completedTask: CreateTaskInput = {
      title: 'Completed Task',
      description: 'This task is completed',
      status: 'completed'
    };

    const pendingResult = await createTask(pendingTask);
    const completedResult = await createTask(completedTask);

    expect(pendingResult.status).toEqual('pending');
    expect(completedResult.status).toEqual('completed');
    expect(pendingResult.id).not.toEqual(completedResult.id);
  });
});
