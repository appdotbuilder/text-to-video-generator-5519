
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';

export const getTasks = async (): Promise<Task[]> => {
  try {
    // Fetch all tasks from database
    const results = await db.select()
      .from(tasksTable)
      .execute();

    // Return results directly - no numeric conversions needed for this table
    return results;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};
