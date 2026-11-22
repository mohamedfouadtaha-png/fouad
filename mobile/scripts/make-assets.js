// يولّد شعار «محمد ﷺ» وأيقونات وشاشات البداية لتطبيقي iOS و Android ولنسخة الويب
// التشغيل: node scripts/make-assets.js  (يحتاج playwright متاحًا في النظام، و python3 مع Pillow)
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WEB = path.join(ROOT, "../seerah");
const TMP = fs.mkdtempSync(path.join(require("os").tmpdir(), "seerah-assets-"));
const b64 = f => fs.readFileSync(f).toString("base64");

const FONTS = `
@font-face{font-family:Ruqaa;font-weight:700;src:url(data:font/woff2;base64,${b64(path.join(__dirname, "fonts/aref-ruqaa-arabic-700-normal.woff2"))})}
@font-face{font-family:Amiri;font-weight:700;src:url(data:font/woff2;base64,${b64(path.join(WEB, "fonts/amiri-arabic-700-normal.woff2"))})}`;

// النجمة الثمانية (مربعان متداخلان) كإطار خفيف
const star = (size, op) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="position:absolute;inset:0;margin:auto">
  <g fill="none" stroke="#d8ac52" stroke-width="1.2" opacity="${op}"><rect x="17" y="17" width="66" height="66"/><rect x="17" y="17" width="66" height="66" transform="rotate(45 50 50)"/>
  <circle cx="50" cy="50" r="30" stroke-width=".7"/></g></svg>`;

// الشعار: ﷺ فوق كلمة محمد. u = وحدة القياس بالبكسل
const logo = u => `<div dir="rtl" style="display:flex;flex-direction:column;align-items:center;line-height:1">
  <div style="font-family:Amiri;font-weight:700;color:#d8ac52;font-size:${u * 0.22}px;margin-bottom:${-u * 0.01}px;transform:translateX(${-u * 0.02}px)">ﷺ</div>
  <div style="font-family:Ruqaa;font-weight:700;color:#f6ead0;font-size:${u * 0.44}px;transform:translate(${u * 0.035}px,${-u * 0.03}px);text-shadow:0 ${u * 0.01}px ${u * 0.03}px rgba(0,0,0,.25)">محمد</div></div>`;

const bg = "background:radial-gradient(circle at 50% 42%,#1a7f63 0%,#0f5643 55%,#0b3f32 100%)";
const PAGES = {
  // أيقونة كاملة بدون حواف دائرية (النظام يقصّها بنفسه)
  icon: s => `<div style="width:${s}px;height:${s}px;position:relative;${bg};display:flex;align-items:center;justify-content:center">
    ${star(s * 0.96, 0.35)}<div style="position:relative;margin-top:${s * 0.02}px">${logo(s)}</div></div>`,
  // الطبقة الأمامية للأيقونة المتكيفة في أندرويد (داخل المنطقة الآمنة)
  fg: s => `<div style="width:${s}px;height:${s}px;display:flex;align-items:center;justify-content:center"><div style="margin-top:${s * 0.02}px">${logo(s * 0.66)}</div></div>`,
  // شاشة البداية
  splash: s => `<div style="width:${s}px;height:${s}px;position:relative;${bg};display:flex;flex-direction:column;align-items:center;justify-content:center">
    <div style="position:relative;width:${s * 0.36}px;height:${s * 0.36}px;display:flex;align-items:center;justify-content:center">${star(s * 0.36, 0.4)}${logo(s * 0.36)}</div>
    <div dir="rtl" style="font-family:Amiri;font-weight:700;color:#f3e4bf;font-size:${s * 0.05}px;margin-top:${s * 0.03}px">السيرة النبوية</div></div>`
};

(async () => {
  const b = await chromium.launch();
  const render = async (name, size) => {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<style>${FONTS}body{margin:0}</style>${PAGES[name](size)}`);
    await p.evaluate(() => document.fonts.ready);
    const out = path.join(TMP, name + ".png");
    await p.screenshot({ path: out, omitBackground: true });
    await p.close();
    return out;
  };
  const icon = await render("icon", 1024), fg = await render("fg", 1024), splash = await render("splash", 2732);
  await b.close();

  const py = `
import sys, glob, os
from PIL import Image, ImageDraw
root, web, icon, fg, splash = sys.argv[1:6]
I, F, S = Image.open(icon).convert("RGB"), Image.open(fg).convert("RGBA"), Image.open(splash).convert("RGB")
# الويب (PWA + الشعار في الهيدر)
for w in (192, 512): I.resize((w, w), Image.LANCZOS).save(os.path.join(web, "icons/icon-%d.png" % w))
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
open(res + "/values/ic_launcher_background.xml", "w").write('<?xml version="1.0" encoding="utf-8"?>\\n<resources>\\n    <color name="ic_launcher_background">#0F5643</color>\\n</resources>\\n')
print("assets written")
`;
  execFileSync("python3", ["-I", "-c", py, ROOT, WEB, icon, fg, splash], { stdio: "inherit" });
  fs.rmSync(TMP, { recursive: true, force: true });
})();
