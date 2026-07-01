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
      const { data: commandes, error: errCommandes } = await supabase
        .from('commandes')
        .select('*')
        .order('created_at', { ascending: false });
      if (errCommandes) throw errCommandes;

      // Jointure manuelle avec les articles (pas de dependance a une relation FK Supabase)
      const articleIds = [...new Set((commandes || []).map(c => c.article_id).filter(Boolean))];
      let articlesParId = {};
      if (articleIds.length > 0) {
        const { data: articles, error: errArticles } = await supabase
          .from('articles')
          .select('id, nom, photo_url')
          .in('id', articleIds);
        if (errArticles) throw errArticles;
        articlesParId = Object.fromEntries((articles || []).map(a => [a.id, a]));
      }

      const commandesEnrichies = (commandes || []).map(c => ({
        ...c,
        article_nom: articlesParId[c.article_id]?.nom || 'Article introuvable',
        article_photo: articlesParId[c.article_id]?.photo_url || null
      }));

      return res.status(200).json({ commandes: commandesEnrichies });
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { statut } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id manquant' });
      if (!statut) return res.status(400).json({ error: 'statut manquant' });

      const { data, error } = await supabase
        .from('commandes')
        .update({ statut })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json({ commande: data });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erreur serveur' });
  }
}
