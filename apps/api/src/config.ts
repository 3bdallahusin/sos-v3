import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Helper to load env file if process.env values are not already populated
function loadLocalEnv() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    path.resolve(currentDir, '..', '.env.local'),
    path.resolve(currentDir, '..', '..', '..', '.env.local'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'apps', 'api', '.env.local')
  ];

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!(key in process.env)) {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch {
        // Ignore read errors
      }
    }
  }
}

loadLocalEnv();

const EnvSchema = z.object({
  DATABASE_URL: z.string().url().default('postgresql://sos_v3_app:jYJBTJlIQD2E5R4bZIbCoCLypRrzgsNb@127.0.0.1:5432/sos_v3_dev'),
  API_PORT: z.coerce.number().default(3001),
  HOST: z.string().default('127.0.0.1'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development')
});

export type AppConfig = z.infer<typeof EnvSchema>;

export function getConfig(): AppConfig {
  return EnvSchema.parse(process.env);
}
