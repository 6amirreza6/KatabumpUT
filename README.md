# KataBumpUT ⚡

**🇮🇷 فارسی** | [English below](#english)

پنل تحت وب برای زنده نگه‌داشتن سرورهای رایگان **کاتابامپ** — با یک دکمه‌ی مرورگری، همه‌ی سرورهات رو **با یک کلیک** تمدید کن.

> 🔒 **قانون طلایی: هیچ فایلی داخل کاتابامپ قرار نمی‌گیره.**
> نه آپلود، نه اجرا، نه ترمینال — هیچ ردی روی هاست که باعث بن شدن بشه وجود نداره. همه‌چیز فقط توی مرورگر خودت اتفاق می‌افته.

**Made by [6amirreza6](https://github.com/6amirreza6) on GitHub** — MIT © 2026 6amirreza6

🌐 **سایت:** https://6amirreza6.github.io/KatabumpUT/

---

## ✨ چیکار می‌کنه؟

| قابلیت | توضیح |
|---|---|
| ⚡ دکمه‌ی تمدید مرورگری (بوکمارکلت) | یک دکمه می‌گیری، می‌ندازی توی نوار بوکمارک‌ها؛ روی داشبورد کاتابامپ که کلیکش کنی، **همه‌ی دکمه‌های Renew خودکار زده می‌شن** |
| 🤖 حالت کاملاً خودکار (اختیاری) | اسکریپت Tampermonkey رو از پنل کپی کن؛ هر وقت داشبورد باز باشه، تمدید خودش انجام می‌شه — بدون حتی یک کلیک |
| 🔄 همگام‌سازی خودکار | بعد از هر تمدید، نتیجه خودکار به پنل سایت برمی‌گرده و تایمر ۴ روزه از نو شروع می‌شه |
| 🖥️ مدیریت سرورها | داخل سایت سرور اضافه کن، حذف کن، شمارش معکوس ۴ روزه‌ی هرکدوم رو ببین؛ کمتر از ۲۴ ساعت مونده هشدار می‌ده |
| 🔐 گاوصخچه‌ی رمزنگاری‌شده | ایمیل و رمزت با **AES-256-GCM** قفل می‌شن و کلید فقط توی مرورگر خودت می‌مونه |
| 🗑️ حذف کامل حساب | یک دکمه — همه‌ی داده‌ها و کلید رمزنگاری همان لحظه و بدون رد پا نابود می‌شن |
| 🌐 دوزبانه | فارسی و انگلیسی، با یک کلیک |

## 🚀 استفاده (۳ قدم — بدون هیچ نصبی)

1. **سایت رو باز کن:** [6amirreza6.github.io/KatabumpUT](https://6amirreza6.github.io/KatabumpUT/) — اطلاعاتت رو وارد کن و سرورهات رو اضافه کن (همه‌چیز محلی و رمزنگاری‌شده می‌مونه).
2. **دکمه‌ی «⚡ تمدید سرورهای من» رو بکش و بنداز توی نوار بوکمارک‌های مرورگرت.** (یا دکمه‌ی «کپی کد دکمه» رو بزن و یه بوکمارک جدید با اون آدرس بساز.)
3. **وارد [dashboard.katabump.com](https://dashboard.katabump.com) شو و روی همون بوکمارک کلیک کن.** تمام! همه‌ی Renew ها زده می‌شن و نتیجه خودکار به پنل سایت برمی‌گرده.

### 🤖 حالت کاملاً خودکار (بدون کلیک)

افزونه‌ی رایگان [Tampermonkey](https://www.tampermonkey.net/) رو نصب کن → توی سایت دکمه‌ی «کپی اسکریپت خودکار» رو بزن → توی Tampermonkey یه اسکریپت جدید بساز و کد رو ذخیره کن. از این به بعد هر وقت داشبورد کاتابامپ باز باشه، تمدید خودش انجام می‌شه.

## 🛡️ چرا بن نمی‌خوری؟

- **هیچ فایلی** روی هاست کاتابامپ آپلود یا اجرا نمی‌شه — نه اسکریپت، نه کد، هیچی.
- دکمه‌ی تمدید فقط همون دکمه‌های **Renew** رو توی مرورگر **خودت** کلیک می‌کنه؛ همون‌کاری که خودت هر ۴ روز دستی می‌کنی.
- هیچ داده‌ای از مرورگرت خارج نمی‌شه — نه به کاتابامپ، نه به هیچ سرور دیگه‌ای.

> با این حال مثل هر ابزاری، ازش فقط برای **اکانت خودت** استفاده کن؛ مسئولیت استفاده با خودته.

## 🔐 امنیت اطلاعات

- داده‌ها فقط توی `localStorage` مرورگر خودت ذخیره می‌شن و با **AES-256-GCM** رمز می‌شن؛ کلید ۲۵۶ بیتی تصادفی هم فقط همون‌جاست.
- هیچ متن ساده‌ای ذخیره نمی‌شه (نه ایمیل، نه رمز، نه شناسه سرور).
- دکمه‌ی «حذف اطلاعات من» هم داده و هم کلید رو برای همیشه نابود می‌کنه.
- دکمه‌ی تمدید هم **هیچ رمز یا اطلاعاتی داخلش قفل نیست** — فقط کلیک می‌کنه.

## ❓ سؤالات پرتکرار

- **Server ID از کجا پیداش کنم؟** وارد پنل شو، روی سرورت کلیک کن؛ عدد آخر آدرس مثل `/server/84521` همون شناسه‌ست. خالی گذاشتنش هم اشکالی نداره — دکمه‌ی تمدید همه‌ی سرورهای اکانتت رو پوشش می‌ده.
- **چرا از خود سایت تمدید نمی‌شه؟** چون داشبورد کاتابامپ اجازه‌ی درخواست از سایت‌های دیگه (CORS) نمی‌ده و لاگینش کپچا داره؛ به همین دلیل تمدید توی مرورگر خودت و روی خود داشبورد انجام می‌شه — که هم مطمئن‌تره هم بی‌خطرتر.
- **همه‌چیز رایگانه؟** آره، متن‌باز با لایسنس MIT.

---

<a id="english"></a>
## 🇬🇧 English

A web panel that keeps your free **KataBump** servers alive — renew **all of them with one click** using a browser button.

> 🔒 **Golden rule: ZERO files are ever placed inside KataBump.**
> No uploads, no execution, no terminal — nothing left on the host that could get you banned. Everything happens only inside your own browser.

**Made by [6amirreza6](https://github.com/6amirreza6) on GitHub** — MIT © 2026 6amirreza6

### Features

- ⚡ **Browser renew button (bookmarklet)** — drag it to your bookmarks bar; clicking it on the KataBump dashboard automatically presses every Renew button
- 🤖 **Fully automatic mode (optional)** — copy the Tampermonkey userscript from the panel; renewal happens by itself whenever the dashboard is open
- 🔄 **Automatic sync** — every renewal is recorded back to the site panel and the 4-day timer restarts
- 🖥️ **Server manager** — add/remove servers, see a live 4-day countdown per server, get warned under 24h
- 🔐 **AES-256-GCM encrypted vault** — credentials sealed locally; the key never leaves your browser
- 🗑️ **One-click full wipe** — data + key destroyed instantly, no trace
- 🌐 **Bilingual** — Persian / English

### Usage (3 steps — nothing to install)

1. Open [the site](https://6amirreza6.github.io/KatabumpUT/) — enter your info and add your servers (stays local & encrypted).
2. Drag the **“⚡ Renew my servers”** button into your bookmarks bar (or press “Copy button code” and create a bookmark with it).
3. Open [dashboard.katabump.com](https://dashboard.katabump.com) and click that bookmark. Done — all renewals are pressed and the result syncs back to the panel automatically.

**Full-auto:** install [Tampermonkey](https://www.tampermonkey.net/) → press “Copy auto userscript” on the site → save it as a new userscript. Whenever the dashboard is open, renewal runs by itself.

### Why it won't get you banned

- **No file** is ever uploaded or executed on the KataBump host — no script, no code, nothing.
- The renew button only clicks the same **Renew** buttons in **your own** browser — exactly what you do by hand every 4 days.
- No data ever leaves your browser — not to KataBump, not to any other server.

> As with any tool, use it only for **your own account**; use it at your own risk.

### Privacy

- Data lives only in your browser's `localStorage`, sealed with **AES-256-GCM**; the random 256-bit key stays there too.
- No plain text is ever stored (no email, no password, no server IDs).
- “Delete my info” destroys both data and key forever.
- The renew button itself contains **no credentials at all** — it only clicks.

## 👤 Author & Owner

This project is fully owned and maintained by **6amirreza6**.

- GitHub: [github.com/6amirreza6](https://github.com/6amirreza6)
- Repository: [github.com/6amirreza6/KatabumpUT](https://github.com/6amirreza6/KatabumpUT)
- Site: [6amirreza6.github.io/KatabumpUT](https://6amirreza6.github.io/KatabumpUT/)

Watermarks and copyright notices are present across the site and the generated scripts — please keep the attribution when forking (MIT requires it anyway).

## 📄 License

**MIT © 2026 6amirreza6** — see [LICENSE](LICENSE).
