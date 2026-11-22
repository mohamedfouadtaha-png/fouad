// يولّد أيقونات وشاشات البداية لتطبيقي iOS و Android من رسم واحد
// التشغيل: node scripts/make-assets.js  (يحتاج playwright متاحًا في النظام، و python3 مع Pillow)
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TMP = fs.mkdtempSync(path.join(require("os").tmpdir(), "seerah-assets-"));

const mark = (s = 1) => `
  <g transform="translate(256 256) scale(${s}) translate(-256 -256)">
    <path d="M256 70 300 160 400 176 328 246 346 346 256 298 166 346 184 246 112 176 212 160z" fill="none" stroke="#d8ac52" stroke-width="10" stroke-linejoin="round" opacity=".35"/>
    <g stroke="#f3e4bf" stroke-width="14" stroke-linecap="round" fill="none"><path d="M256 170v80M256 250l-90 60M256 250l90 60M256 250v80M166 310v40M346 310v40"/></g>
    <g fill="#d8ac52"><circle cx="256" cy="150" r="30"/><circle cx="166" cy="372" r="22"/><circle cx="256" cy="352" r="22"/><circle cx="346" cy="372" r="22"/></g>
  </g>`;
const grad = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b3f32"/><stop offset="1" stop-color="#187a60"/></linearGradient></defs>`;

const SVGS = {
  // أيقونة كاملة بدون حواف دائرية (النظام يقصّها بنفسه)
  icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${grad}<rect width="512" height="512" fill="url(#g)"/>${mark(1.05)}</svg>`,
  // الطبقة الأمامية للأيقونة المتكيفة في أندرويد (المحتوى داخل المنطقة الآمنة 66%)
  fg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${mark(0.68)}</svg>`,
  // شاشة البداية
  splash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732">${grad}<rect width="2732" height="2732" fill="url(#g)"/>
    <g transform="translate(1366 1250) scale(1.4) translate(-256 -256)">${mark(1)}</g>
    <text x="1366" y="1800" font-family="Amiri, serif" font-size="150" font-weight="700" fill="#f3e4bf" text-anchor="middle">السيرة النبوية</text></svg>`
};

(async () => {
  const b = await chromium.launch();
  const render = async (name, size) => {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    const font = fs.readFileSync(path.join(ROOT, "../seerah/fonts/amiri-arabic-700-normal.woff2")).toString("base64");
    await p.setContent(`<style>@font-face{font-family:Amiri;font-weight:700;src:url(data:font/woff2;base64,${font})}body{margin:0}</style>` +
      SVGS[name].replace("<svg ", `<svg width="${size}" height="${size}" `));
    await p.evaluate(() => document.fonts.ready);
    const out = path.join(TMP, name + ".png");
    await p.screenshot({ path: out, omitBackground: true });
    await p.close();
    return out;
  };
  const icon = await render("icon", 1024), fg = await render("fg", 1024), splash = await render("splash", 2732);
  await b.close();

  // التحجيم والقص بـ Pillow
  const py = `
import sys, glob, os
from PIL import Image, ImageDraw
root, icon, fg, splash = sys.argv[1:5]
I, F, S = Image.open(icon).convert("RGB"), Image.open(fg).convert("RGBA"), Image.open(splash).convert("RGB")
# iOS
ios = os.path.join(root, "ios/App/App/Assets.xcassets")
I.save(os.path.join(ios, "AppIcon.appiconset/AppIcon-512@2x.png"))
for f in glob.glob(os.path.join(ios, "Splash.imageset/*.png")): S.save(f)
# Android
res = os.path.join(root, "android/app/src/main/res")
for f in glob.glob(res + "/mipmap-*/ic_launcher*.png"):
    w = Image.open(f).size[0]
    if f.endswith("_foreground.png"): F.resize((w, w), Image.LANCZOS).save(f)
    elif f.endswith("_round.png"):
        im = I.resize((w, w), Image.LANCZOS).convert("RGBA"); m = Image.new("L", (w, w), 0)
        ImageDraw.Draw(m).ellipse((0, 0, w - 1, w - 1), fill=255); im.putalpha(m); im.save(f)
    else: I.resize((w, w), Image.LANCZOS).save(f)
for f in glob.glob(res + "/drawable*/splash.png"):
    w, h = Image.open(f).size; s = max(w, h)
    big = S.resize((s, s), Image.LANCZOS); big.crop(((s - w) // 2, (s - h) // 2, (s - w) // 2 + w, (s - h) // 2 + h)).save(f)
open(res + "/values/ic_launcher_background.xml", "w").write('<?xml version="1.0" encoding="utf-8"?>\\n<resources>\\n    <color name="ic_launcher_background">#0D4A3A</color>\\n</resources>\\n')
print("assets written")
`;
  execFileSync("python3", ["-I", "-c", py, ROOT, icon, fg, splash], { stdio: "inherit" });
  fs.rmSync(TMP, { recursive: true, force: true });
})();
