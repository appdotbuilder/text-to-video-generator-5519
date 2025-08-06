
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test input for creating a task to delete
const testTaskInput: CreateTaskInput = {
  title: 'Test Task to Delete',
  description: 'A task created for deletion testing',
  status: 'pending'
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // First, create a task
    const createResult = await db.insert(tasksTable)
      .values({
        title: testTaskInput.title,
        description: testTaskInput.description,
        status: testTaskInput.status
      })
      .returning()
      .execute();

    const createdTask = createResult[0];

    // Delete the task
    const deleteInput: DeleteTaskInput = { id: createdTask.id };
    const result = await deleteTask(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);
  });

  it('should remove task from database', async () => {
    // First, create a task
    const createResult = await db.insert(tasksTable)
      .values({
        title: testTaskInput.title,
        description: testTaskInput.description,
        status: testTaskInput.status
      })
      .returning()
      .execute();

    const createdTask = createResult[0];

    // Delete the task
    const deleteInput: DeleteTaskInput = { id: createdTask.id };
    await deleteTask(deleteInput);

    // Verify task no longer exists in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should throw error when task does not exist', async () => {
    // Try to delete a non-existent task
    const deleteInput: DeleteTaskInput = { id: 999 };

    // Expect the deletion to fail
    expect(deleteTask(deleteInput)).rejects.toThrow(/not found/i);
  });

  it('should handle multiple tasks correctly', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        status: 'pending'
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        status: 'completed'
      })
      .returning()
      .execute();

    // Delete only the first task
    const deleteInput: DeleteTaskInput = { id: task1[0].id };
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify first task is deleted
    const remainingTask1 = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task1[0].id))
      .execute();

    expect(remainingTask1).toHaveLength(0);

    // Verify second task still exists
    const remainingTask2 = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2[0].id))
      .execute();

    expect(remainingTask2).toHaveLength(1);
    expect(remainingTask2[0].title).toEqual('Task 2');
  });
});
