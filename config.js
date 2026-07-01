export default function handler(req, res) {
  return res.status(200).json({
    shopName: process.env.SHOP_NAME || 'Catalogue'
  });
}
