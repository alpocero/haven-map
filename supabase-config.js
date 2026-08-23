// Публичные параметры проекта Supabase.
// SUPABASE_ANON_KEY — это "Publishable key" (или старый "anon key"): он специально
// предназначен для использования в браузере и безопасен для публикации в репозитории.
// Реальный доступ на запись контролируется политиками RLS в базе + Supabase Auth —
// see markers table policies.
const SUPABASE_URL = 'https://fnuguncavppqnpnrioyn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YZmhi7V0tKvWF1ks_VTA2g_pgOfviP4';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
