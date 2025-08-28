import { Pool } from "pg";

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "timescaledb",
  password: "newpassword",
  port: 5432,
});
