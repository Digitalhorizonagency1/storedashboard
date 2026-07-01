import { checkAuth, getSupabaseAdmin, sanitizeFilename } from './_shared.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  let authorized;
  try {
    authorized = checkAuth(req);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
  if (!authorized) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const { filename, base64Data, mimeType } = req.body || {};
  if (!filename || !base64Data) {
    return res.status(400).json({ error: 'filename et base64Data requis' });
  }

  try {
    const supabase = getSupabaseAdmin();
    const cleanName = sanitizeFilename(filename);
    const uniqueName = Date.now() + '-' + cleanName;

    const buffer = Buffer.from(base64Data, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('articles-photos')
      .upload(uniqueName, buffer, {
        contentType: mimeType || 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('articles-photos')
      .getPublicUrl(uniqueName);

    return res.status(200).json({ photo_url: publicUrlData.publicUrl });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erreur upload' });
  }
}