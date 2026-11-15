import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { getConfig } from './config.js';

let sqlClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getSqlClient() {
  if (!sqlClient) {
    const config = getConfig();
    sqlClient = postgres(config.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10
    });
  }
  return sqlClient;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getSqlClient());
  }
  return dbInstance;
}

export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  databaseName?: string;
  databaseUser?: string;
  error?: string;
}> {
  try {
    const sql = getSqlClient();
    const result = await sql`SELECT current_database() as db_name, current_user as user_name;`;
    if (result && result.length > 0) {
      const row = result[0];
      return {
        connected: true,
        databaseName: String(row.db_name),
        databaseUser: String(row.user_name)
      };
    }
    return {
      connected: false,
      error: 'No result returned from query'
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      error: errorMsg
    };
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  if (sqlClient) {
    await sqlClient.end();
    sqlClient = null;
    dbInstance = null;
  }
}
