import { createClient } from '@supabase/supabase-js';

// Essas variáveis virão do .env (local) e da configuração da Vercel (produção)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Atenção: Variáveis do Supabase ausentes no .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
