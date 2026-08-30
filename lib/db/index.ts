import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

type DigiKathaDatabase = DrizzleD1Database<typeof schema>;

export function getDb(): DigiKathaDatabase {
  const { env } = getCloudflareContext();
  if (!env.DB) throw new Error("D1 binding DB is not configured");
  return drizzle(env.DB, { schema });
}

// Preserves the existing query surface while resolving a fresh D1 client
// inside each request's Cloudflare context.
export const db = new Proxy({} as DigiKathaDatabase, {
  get(_target, property) {
    const client = getDb();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
