const SUPABASE_URL = 'https://fnuguncavppqnpnrioyn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YZmhi7V0tKvWF1ks_VTA2g_pgOfviP4';

// Библиотека Supabase грузится с CDN и может не загрузиться (например, если CDN
// недоступен). Тогда сайт всё равно читает данные напрямую через fetch
// (script.js → restGet), но вход и запись недоступны. Поэтому не падаем.
const supabaseClient = typeof supabase !== 'undefined'
	? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
	: null;
