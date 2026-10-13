<div align="center">

<img src="assets/banner.png" alt="KataBumpUT" width="100%">

![License](https://img.shields.io/badge/license-MIT%20%C2%A9%206amirreza6-8b5cf6)
![Node](https://img.shields.io/badge/node-18%2B-blue)
![Author](https://img.shields.io/badge/author-6amirreza6-purple)
![Vault](https://img.shields.io/badge/vault-AES--256--GCM-8b5cf6)
![Terminal](https://img.shields.io/badge/terminal-not%20needed-22d3ee)

**تمدید خودکار سرور رایگان KataBump — همه‌چیز از داخل سایت، بدون ترمینال**
**Auto-renew your free KataBump server — everything from the site, no terminal**

[🌐 وب‌سایت / Website](https://6amirreza6.github.io/KatabumpUT/) · [GitHub](https://github.com/6amirreza6/KatabumpUT)

</div>

---

## 🇮🇷 فارسی

### این چیست؟

سرورهای **رایگان** [KataBump](https://katabump.com) باید هر چند روز از پنل تمدید (Renew) بشن، وگرنه خاموش می‌شن. **KataBumpUT** یک **پنل حساب داخل سایت** است: ایمیل، رمز و شناسه‌ی سرورهات رو همون‌جا وارد می‌کنی، اکانتت رو می‌سازی، سرورها رو اضافه/حذف/تغییر می‌کنی و آخرش یک دکمه یک فایل **`index.js` شخصی‌سازی‌شده** بهت می‌ده که همه‌چیز داخلش قفل شده. اون فایل رو در پنل کاتابامپ آپلود می‌کنی و Restart می‌زنی — تمام! از اون به بعد **هر ۲۴ ساعت خودش تمدید می‌کنه**.

**چرا بدون ترمینال؟** چون توی ترمینال هاست کاتابامپ نمی‌شه اسکریپت تعاملی زد — نه دستور می‌شه تایپ کرد، نه از ویزارد ورودی گرفت. پس دیگه هیچ‌چیز از ترمینال نمی‌خواد: اطلاعات از **سایت** میاد، توی فایل ساخته‌شده **قفل** می‌شه و اسکریپت کاملاً **بی‌سؤال** اجرا می‌شه.

- 🖥️ **همه‌چیز از داخل سایت:** ورود اطلاعات، ساخت اکانت، مدیریت سرورها (افزودن/حذف/تغییر)، دانلود اسکریپت و حذف اطلاعات
- 🔐 **گاوصخچه‌ی رمزنگاری‌شده:** اطلاعات توی مرورگر خودت با **AES-256-GCM** قفل می‌شه و هیچ‌جا ارسال نمی‌شه؛ داخل فایل ساخته‌شده هم به‌صورت رمزنگاری‌شده جاسازی می‌شه (بدون هیچ متن ساده‌ای)
- ⏰ **چرخه‌ی ۲۴ ساعته:** هر شب یک تمدید؛ تلاش ناموفق ۱۵ دقیقه بعد دوباره امتحان می‌شه
- 🚫 **نه ترمینال، نه تایپ، نه وابستگی:** فایل ساخته‌شده فقط به Node.js 18+ نیاز داره
- 🧩 **چند سرور:** هر چند سرور که داری، از داخل سایت مدیریت‌شون کن
- 🧯 **حذف خودکار:** هم داخل سایت (یک کلیک) و هم داخل اسکریپت (`delete` یا `--delete` با حذف خود فایل)

<div align="center">
<img src="assets/demo.png" alt="نمونه اجرا" width="720">
</div>

### سه قدم (بدون حتی یک دستور)

1. **[سایت](https://6amirreza6.github.io/KatabumpUT/) را باز کن** → بخش «پنل حساب من» → ایمیل، رمز و سرورهات را وارد و ذخیره کن
2. **«ساخت و دانلود اسکریپت»** را بزن → فایل `index.js` شخصی خودت بگیر
3. در پنل کاتابامپ: تب **Files** → `index.js` را **Upload** کن → **Restart** بزن

تمام! لاگ پنل از این به بعد هر ۲۴ ساعت یک تمدید موفق نشان می‌دهد.

### قابلیت‌های فایل `index.js` ساخته‌شده

| دستور | کار |
|---|---|
| `node index.js` | همین حالا تمدید می‌کند و بعدش هر ۲۴ ساعت خودکار تمدید می‌کند (پیش‌فرض) |
| `node index.js --once` | فقط یک تمدید و خروج |
| `node index.js --status` | وضعیت آخرین تمدید و بازه |
| `node index.js --delete` | 🔥 **حذف اطلاعات من:** فایل شخصی و سشن همان لحظه پاک می‌شوند (خود-حذفی) |
| `node index.js --login` | حالت مرورگر برای کپچای Turnstile — فقط روی کامپیوتر خودت با playwright |

وقتی اسکریپت در حال اجراست، کنسول زنده هم در دسترس است: `renew` · `status` · `delete` · `exit`.

### امنیت اطلاعات

- **داخل سایت:** اطلاعات فقط در مرورگر خودت (localStorage) با AES-256-GCM ذخیره می‌شود؛ به هیچ سروری ارسال نمی‌شود. با دکمه‌ی «حذف اطلاعات من» داده و کلید با هم نابود می‌شوند.
- **داخل `index.js`:** اطلاعات با AES-256-GCM رمز و کلید به دو نیمه‌ی جدا و ماسک‌شده تقسیم می‌شود — جست‌وجوی ساده‌ی فایل هیچی را لو نمی‌دهد. یادت باشد این فایل **شخصی** است؛ مثل رمزت با آن رفتار کن.
- سشن کوکی‌ها هم در فایل جداگانه‌ی `.kbu-session.json` (بدون هیچ رمزی) کنار اسکریپت نگه‌داری می‌شود.

### کپچا (Cloudflare Turnstile)

اگر لاگین HTTP با کپچا روبه‌رو شد، اسکریپت ناامید نمی‌شود: هر ۱۵ دقیقه خودش دوباره تلاش می‌کند. برای حل قطعی، یک بار روی کامپیوتر خودت `node index.js --login` را اجرا کن (playwright کپچا را خودکار حل می‌کند و سشن ذخیره می‌شود) — بعد فایل `.kbu-session.json` را کنار `index.js` روی هاست بگذار.

### 🔥 حذف اطلاعات من (کاملاً خودکار)

- **از سایت:** بخش «پنل حساب من» → کارت «حذف حساب از سایت» → یک کلیک؛ همه‌چیز از مرورگر پاک می‌شود
- **از اسکریپت:** تایپ `delete` در کنسول، یا `node index.js --delete` — فایل شخصی و سشن همان لحظه حذف می‌شوند (اگر خود-حذفی ممکن نباشد، فقط `index.js` را از تب Files پنل پاک کن)

### عیب‌یابی

- **کپچا / لاگین نشد:** بخش کپچای بالا — یک بار `--login` روی کامپیوتر خودت.
- **دکمه‌ی Renew پیدا نشد:** احتمالاً هنوز در بازه‌ی تمدید نیستی؛ چرخه‌ی بعدی (فردا) دوباره امتحان می‌کند. برای دیدن صفحات واقعی پنل: `KATA_DEBUG=1 node index.js --once`
- **تغییر اطلاعات:** در سایت به‌روزرسانی کن، دوباره `index.js` بساز و جایگزین قبلی کن (فایل‌های کوکی سالم می‌مانند).
- **کدهای خروج:** `0` موفق/لازم‌نبود، `2` مشکل لاگین، `3` چالش کلادفلر، `4` دکمه پیدا نشد، `5` کپچا روی تمدید — در حالت پیش‌فرض اسکریپت بعد از این‌ها زنده می‌ماند و هر ۱۵ دقیقه دوباره تلاش می‌کند.

### ⚠️ سلب مسئولیت

این ابزار فقط برای **سرور خودت** و با **اکانت خودت** است و صرفاً جنبهٔ آموزشی و صرفه‌جویی در زمان دارد. استفاده از اتوماسیون ممکن است با قوانین استفادهٔ KataBump ناسازگار باشد؛ مسئولیت استفاده با خودِ توست. رفتار اسکریپت عمداً ملایم است (حداقل ۲۳ ساعت فاصله بین تمدیدهای موفق).

### 👤 نویسنده و مالک

ساخته شده توسط **[6amirreza6](https://github.com/6amirreza6)** در گیتهاب ❤️

> ⚖️ این پروژه و تمام اجزای آن — کد، سایت، اسکریپت ساخته‌شده، تصاویر و ایده — به‌طور کامل متعلق به **6amirreza6** است. واترمارک و نام نویسنده در تمام بخش‌ها (سایت و فایل ساخته‌شده) تعبیه شده است.

### 📄 لایسنس

[MIT](LICENSE) © 2026 **6amirreza6** — تمام حقوق این پروژه متعلق به 6amirreza6 است. بر اساس MIT، هر کپی از این کد **باید** اعلان کپی‌رایت و نام نویسنده را حفظ کند؛ حذف واترمارک نقض لایسنس است.

---

## 🇬🇧 English

### What is this?

**Free** [KataBump](https://katabump.com) servers must be renewed from the panel every few days or they go offline. **KataBumpUT** is an **account panel that lives on the website**: you enter your email, password and Server IDs right there, set up your account, add/remove/change servers — and one button hands you a personalized **`index.js`** with everything sealed inside. Upload that file in the KataBump panel and hit Restart — done! From then on it renews your server automatically **every 24 hours**.

**Why no terminal?** Because the KataBump host terminal cannot run interactive scripts — no commands, no wizard input. So nothing is asked from the terminal anymore: your info comes from the **site**, gets **sealed** into the generated file, and the script runs **silently and fully automatically**.

- 🖥️ **Everything from the site:** enter info, create your account, manage servers (add/remove/change), download the script, delete your info
- 🔐 **Encrypted vault:** your info is locked in your own browser with **AES-256-GCM** and never sent anywhere; inside the generated file it is embedded encrypted as well (no plain text)
- ⏰ **24h cycle:** one renewal per day; failed attempts retry after 15 minutes
- 🚫 **No terminal, no typing, no dependencies:** the generated file only needs Node.js 18+
- 🧩 **Multiple servers:** manage as many free servers as you have, right on the site
- 🧯 **Automatic delete:** one click on the site — or `delete` / `--delete` inside the script (which even removes its own file)

<div align="center">
<img src="assets/demo.png" alt="Demo run" width="720">
</div>

### Three steps (without a single command)

1. **Open the [site](https://6amirreza6.github.io/KatabumpUT/)** → “My account panel” → enter your email, password and servers → Save
2. Press **“Build & download script”** → get your personal `index.js`
3. In the KataBump panel: **Files** tab → **Upload** `index.js` → **Restart**

That's it! The panel log now shows a successful renewal every 24 hours.

### What the generated `index.js` can do

| Command | What it does |
|---|---|
| `node index.js` | Renews now, then keeps auto-renewing every 24h (default) |
| `node index.js --once` | Single renewal, then exits |
| `node index.js --status` | Show last renewal state and interval |
| `node index.js --delete` | 🔥 **Delete my info:** wipes the personal file and session instantly (self-delete) |
| `node index.js --login` | Browser mode for the Turnstile captcha — only on your own PC with playwright |

While running, a live console is also available: `renew` · `status` · `delete` · `exit`.

### Where your info lives

- **On the site:** only inside your own browser (localStorage), sealed with AES-256-GCM, never sent to any server. The “Delete my info” button destroys both data and key.
- **Inside `index.js`:** your info is AES-256-GCM encrypted and the key is split into two masked halves — a casual grep of the file reveals nothing. Remember this file is **personal**; treat it like your password.
- Session cookies live in a separate `.kbu-session.json` (no secrets inside) next to the script.

### Captcha (Cloudflare Turnstile)

If the HTTP login hits a captcha, the script does not give up: it retries automatically every 15 minutes. For a definitive fix, run `node index.js --login` once on your own PC (playwright solves the captcha and saves the session) — then place `.kbu-session.json` next to `index.js` on the host.

### 🔥 Delete my information (fully automatic)

- **From the site:** “My account panel” → “Delete account from the site” card → one click wipes everything from your browser
- **From the script:** type `delete` in the console, or run `node index.js --delete` — the personal file and session are wiped instantly (if self-delete is not possible, just remove `index.js` in the panel Files tab)

### Troubleshooting

- **Captcha / login fails:** see the captcha section above — run `--login` once on your own PC.
- **Renew button not found:** you are probably outside the renewal window; the next daily cycle retries. Inspect real panel pages with `KATA_DEBUG=1 node index.js --once`
- **Changed your info?** Update it on the site, build a fresh `index.js` and replace the old one (session cookies stay valid).
- **Exit codes:** `0` ok / not needed, `2` login problem, `3` Cloudflare challenge, `4` button not found, `5` captcha on renew — in the default mode the script stays alive after these and retries every 15 minutes.

### ⚠️ Disclaimer

This tool is for **your own server** and **your own account** — educational and time-saving purposes only. Automation may violate KataBump's Terms of Service; use it at your own risk. The script is deliberately gentle (at least 23 hours between successful renewals).

### 👤 Author & Owner

Made by **[6amirreza6](https://github.com/6amirreza6)** on GitHub ❤️

> ⚖️ This project and all of its parts — code, website, generated script, artwork and the idea — fully belong to **6amirreza6**. Watermarks and author credits are embedded in every part (site and generated file).

### 📄 License

[MIT](LICENSE) © 2026 **6amirreza6** — all rights of this project belong to 6amirreza6. Under MIT, every copy of this code **must** keep the copyright notice and author credit; removing the watermark is a license violation.

---

<div align="center">
<img src="https://img.shields.io/badge/KataBumpUT-%E2%AD%90%20Star%20if%20it%20helped-8b5cf6" alt="star">
</div>
