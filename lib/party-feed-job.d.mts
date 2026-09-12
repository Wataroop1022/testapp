import type { SupabaseClient } from "@supabase/supabase-js";
import type Anthropic from "@anthropic-ai/sdk";

export interface UpdateJobResult {
  itemsInserted: number;
  itemsSkipped: number;
  error: string | null;
  log?: string[];
}

export function runUpdateJob(deps: {
  supabase: SupabaseClient;
  anthropic: Anthropic;
}): Promise<UpdateJobResult>;
