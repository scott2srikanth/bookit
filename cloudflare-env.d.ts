interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  AUTH_EMAIL: string;
  AUTH_PASSWORD_HASH: string;
  OPENAI_API_KEY?: string;
}
