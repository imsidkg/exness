import { pool } from "../config/db";

export const getAllUserIds = async (): Promise<number[]> => {
  try {
    const result = await pool.query("SELECT id FROM users");
    return result.rows.map((row) => row.id);
  } catch (error) {
    console.error("Error fetching all user IDs:", error);
    return [];
  }
};