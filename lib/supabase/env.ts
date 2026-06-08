export function getSupabasePublicEnv() {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!publicUrl || !publicAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return {
    url: publicUrl,
    anonKey: publicAnonKey
  };
}
