
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
  });

  it('should return all tasks', async () => {
    // Create test tasks directly in database
    const testTasks = [
      {
        title: 'Task 1',
        description: 'First task',
        status: 'pending' as const
      },
      {
        title: 'Task 2', 
        description: null,
        status: 'completed' as const
      },
      {
        title: 'Task 3',
        description: 'Third task',
        status: 'pending' as const
      }
    ];

    // Insert test tasks
    await db.insert(tasksTable)
      .values(testTasks)
      .execute();

    const result = await getTasks();

    // Should return all 3 tasks
    expect(result).toHaveLength(3);

    // Verify task properties
    expect(result[0].title).toEqual('Task 1');
    expect(result[0].description).toEqual('First task');
    expect(result[0].status).toEqual('pending');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second task with null description
    expect(result[1].title).toEqual('Task 2');
    expect(result[1].description).toBeNull();
    expect(result[1].status).toEqual('completed');

    // Verify third task
    expect(result[2].title).toEqual('Task 3');
    expect(result[2].description).toEqual('Third task');
    expect(result[2].status).toEqual('pending');
  });

  it('should return tasks in insertion order', async () => {
    // Create tasks with specific titles for order verification
    const taskTitles = ['First', 'Second', 'Third'];
    
    for (const title of taskTitles) {
      await db.insert(tasksTable)
        .values({
          title,
          description: `${title} task`,
          status: 'pending'
        })
        .execute();
    }

    const result = await getTasks();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('First');
    expect(result[1].title).toEqual('Second');
    expect(result[2].title).toEqual('Third');
  });
});
