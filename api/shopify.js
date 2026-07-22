// Vercel Serverless Function — pulls & aggregates Shopify orders for one month.
// Reads secrets from environment variables (never exposed to the browser):
//   SHOPIFY_STORE        e.g. "noam-store.myshopify.com"
//   SHOPIFY_ADMIN_TOKEN  Admin API access token (scopes: read_orders, read_products)
//   SHOPIFY_API_VERSION  optional, defaults to "2024-10"
//
// Request:  GET /api/shopify?month=YYYY-MM
// Response: { month, currency, orderCount, products: [{ id, name, units, revenue }] }

export default async function handler(req, res) {
  const store = process.env.SHOPIFY_STORE;
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  const apiVer = process.env.SHOPIFY_API_VERSION || "2024-10";

  if (!store || !token) {
    return res.status(500).json({
      error: "השרת לא מוגדר. חסרים משתני הסביבה SHOPIFY_STORE ו-SHOPIFY_ADMIN_TOKEN ב-Vercel.",
    });
  }

  const month = String(req.query.month || "");
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "פרמטר month חייב להיות בפורמט YYYY-MM." });
  }

  const [y, m] = month.split("-").map(Number);
  const startISO = new Date(Date.UTC(y, m - 1, 1)).toISOString();
  const endISO = new Date(Date.UTC(y, m, 1)).toISOString(); // first day of next month
  const base = `https://${store}/admin/api/${apiVer}`;

  const fields = "id,created_at,currency,cancelled_at,financial_status,line_items";
  let url =
    `${base}/orders.json?status=any&limit=250` +
    `&created_at_min=${encodeURIComponent(startISO)}` +
    `&created_at_max=${encodeURIComponent(endISO)}` +
    `&fields=${fields}`;

  const agg = Object.create(null);
  let orderCount = 0;
  let currency = null;

  try {
    while (url) {
      const r = await fetch(url, {
        headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" },
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        return res.status(r.status).json({
          error: `שגיאת שופיפי (${r.status}). בדוק את הטוקן וההרשאות (read_orders).`,
          detail: txt.slice(0, 300),
        });
      }

      const data = await r.json();
      const orders = Array.isArray(data.orders) ? data.orders : [];

      for (const o of orders) {
        if (o.cancelled_at) continue; // skip cancelled orders
        orderCount++;
        if (!currency && o.currency) currency = o.currency;

        for (const li of o.line_items || []) {
          const key = String(li.product_id || li.title || "unknown");
          if (!agg[key]) agg[key] = { name: li.title || "מוצר", units: 0, revenue: 0 };
          const qty = Number(li.quantity) || 0;
          const price = Number(li.price) || 0;
          const discount = Number(li.total_discount) || 0;
          agg[key].units += qty;
          agg[key].revenue += price * qty - discount;
        }
      }

      // Pagination via the Link header ( rel="next" )
      const link = r.headers.get("link") || r.headers.get("Link");
      url = null;
      if (link && link.includes('rel="next"')) {
        const part = link.split(",").find((s) => s.includes('rel="next"'));
        const match = part && part.match(/<([^>]+)>/);
        if (match) url = match[1];
      }
    }
  } catch (e) {
    return res.status(502).json({ error: "כשל בפנייה לשופיפי.", detail: String(e).slice(0, 200) });
  }

  const products = Object.keys(agg)
    .map((k) => ({
      id: k,
      name: agg[k].name,
      units: agg[k].units,
      revenue: Math.round(agg[k].revenue * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ month, currency, orderCount, products });
}
