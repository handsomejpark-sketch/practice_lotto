import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@supabase/supabase-js";

async function readEnv(name: string) {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const fromBinding = (ctx.env as Record<string, unknown>)[name];

    if (typeof fromBinding === "string" && fromBinding.length > 0) {
      return fromBinding;
    }
  } catch {
    // Local/non-Cloudflare runtime falls back to process.env.
  }

  return process.env[name];
}

async function required(name: string) {
  const value = await readEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function getSupabaseAdmin() {
  return createClient(
    await required("NEXT_PUBLIC_SUPABASE_URL"),
    await required("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
