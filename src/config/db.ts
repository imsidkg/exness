import { Pool } from "pg";

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "timescaledb",
  password: "secret",
  port: 5432,
});
