// Mariyam Shebaloy V7 - Supabase Configuration

const SUPABASE_URL =
  "https://cvbdtlvaygzdmlabbswr.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_eCXswayP6l9PXdUGD-Pqbw_2bfBUW6O";

// Names expected by the V7 application
window.MARIYAM_SUPABASE_URL = SUPABASE_URL;
window.MARIYAM_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Compatibility names
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_ANON_KEY;

window.MARIYAM_SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY
};
