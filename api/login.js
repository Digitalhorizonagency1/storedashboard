export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { password } = req.body || {};

  if (!process.env.DASHBOARD_PASSWORD) {
    return res.status(500).json({ error: 'DASHBOARD_PASSWORD non configuré côté serveur' });
  }

  if (password === process.env.DASHBOARD_PASSWORD) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ error: 'Mot de passe incorrect' });
}