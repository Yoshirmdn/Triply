import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  NEXT_PUBLIC_AUTH_USERNAME: z.string().optional(),
  NEXT_PUBLIC_AUTH_PASSWORD: z.string().optional(),
  GEOAPIFY_API_KEY: z.string().min(1).optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const keys = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(`Invalid or missing environment variables: ${keys}`);
  }
  cached = parsed.data;
  return cached;
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}
