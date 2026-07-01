import { checkAuth, getSupabaseAdmin } from './_shared.js';

export default async function handler(req, res) {
  let authorized;
  try {
    authorized = checkAuth(req);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
  if (!authorized) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const supabase = getSupabaseAdmin();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ articles: data });
    }

    if (req.method === 'POST') {
      const payload = buildPayload(req.body);
      const { data, error } = await supabase
        .from('articles')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json({ article: data });
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id manquant' });
      const payload = buildPayload(req.body);
      const { data, error } = await supabase
        .from('articles')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json({ article: data });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erreur serveur' });
  }
}

function buildPayload(body) {
  const stockParPointure = body.stock_par_pointure || {};
  const stockTotal = Object.values(stockParPointure).reduce(
    (sum, q) => sum + (parseInt(q, 10) || 0),
    0
  );
  const pointuresDispo = Object.keys(stockParPointure).join(',');

  let tagsOccasion = '';
  if ((body.categorie === 'homme' || body.categorie === 'femme') && body.occasion) {
    tagsOccasion = body.occasion;
  }

  return {
    nom: (body.nom || '').trim(),
    categorie: body.categorie || 'homme',
    type: (body.type || '').toLowerCase().trim(),
    tags_occasion: tagsOccasion,
    couleur: body.couleur || '',
    prix: parseFloat(body.prix) || 0,
    pointures_dispo: pointuresDispo,
    stock_total: stockTotal,
    stock_par_pointure: stockParPointure,
    description: body.description || '',
    photo_url: body.photo_url || null,
    actif: body.actif !== undefined ? body.actif : true,
    qualite: body.qualite || null
  };
}