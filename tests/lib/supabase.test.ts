import { describe, it, expect } from "vitest";
import { supabase } from "@/lib/supabase";

describe("supabase client", () => {
  it("is initialized", () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });
});
