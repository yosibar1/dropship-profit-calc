# מחשבון רווח – חנות דרופ שיפינג

כלי מעקב רווח חודשי לחנות Shopify: הכנסות, הוצאות, פרסום ורווח נקי — עם אפשרות **למשוך מכירות אוטומטית משופיפי**.

- `index.html` — האפליקציה (frontend, סטטי, נשמר בדפדפן).
- `api/shopify.js` — פונקציית Serverless שמתחברת ל-Shopify Admin API בצד השרת ומחזירה מכירות מצורפות לפי חודש. הטוקן נשאר בשרת בלבד.

---

## פריסה ל-Vercel (פעם אחת, ~4 קליקים)

1. היכנס ל-**https://vercel.com** והתחבר עם חשבון GitHub.
2. **Add New… → Project** → בחר את הריפו `dropship-profit-calc` → **Import**.
3. לפני Deploy, פתח **Environment Variables** והוסף:
   | Name | Value |
   |------|-------|
   | `SHOPIFY_STORE` | כתובת החנות, למשל `noam-store.myshopify.com` |
   | `SHOPIFY_ADMIN_TOKEN` | הטוקן מ-Shopify (ראה למטה) |
4. לחץ **Deploy**. תוך דקה מתקבל קישור קבוע (למשל `https://dropship-profit-calc.vercel.app`) — זה הקישור לשלוח לנועם.

> חשוב: השתמשו בקישור של **Vercel** (לא ב-GitHub Pages) — רק שם כפתור "משוך משופיפי" עובד, כי ה-API רץ באותו דומיין.

---

## הפקת הטוקן ב-Shopify (Custom App)

1. בממשק הניהול של החנות: **Settings → Apps and sales channels → Develop apps**.
2. **Create an app** → תן שם (למשל "Profit Tool") → **Create app**.
3. לשונית **Configuration → Admin API integration → Configure** → סמן הרשאות:
   - `read_orders`
   - `read_products`
   → **Save**.
4. לשונית **API credentials → Install app**.
5. תחת **Admin API access token** לחץ **Reveal token once** — זהו ה-`SHOPIFY_ADMIN_TOKEN`. העתק אותו ל-Vercel (שלב 3 למעלה). מוצג פעם אחת בלבד.

לאחר עדכון משתני סביבה ב-Vercel — הרץ **Redeploy** כדי שייכנסו לתוקף.

---

## שימוש

1. פתח את קישור ה-Vercel.
2. בחר חודש → לחץ **🔄 משוך מכירות משופיפי**. הכלי ימלא אוטומטית לכל מוצר את הכמות שנמכרה וההכנסות.
3. השלם ידנית: **עלות לספק** לכל מוצר, ואת ההוצאות הקבועות והפרסום. הרווח מחושב אוטומטית.

הטוקן לעולם לא נחשף לדפדפן — רק פונקציית השרת ניגשת אליו.
