import { createClient } from '@supabase/supabase-js';

export function checkAuth(req) {
  const password = req.headers['x-dashboard-password'];
  if (!process.env.DASHBOARD_PASSWORD) {
    throw new Error('DASHBOARD_PASSWORD non configuré côté serveur');
  }
  return password === process.env.DASHBOARD_PASSWORD;
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant côté serveur');
  }
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

export function sanitizeFilename(nom) {
  const parts = nom.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'jpg';
  const base = parts
    .join('.')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return (base || 'photo') + '.' + ext;
}