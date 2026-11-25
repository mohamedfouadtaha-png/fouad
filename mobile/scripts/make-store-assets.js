// يولّد صور المتاجر: أيقونة Play 512، وصورة الغلاف 1024×500، ولقطات شاشة لـ Google Play و App Store
// التشغيل: node scripts/make-store-assets.js  (يحتاج playwright متاحًا في النظام، و python3 مع Pillow)
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WEB = path.join(ROOT, "../seerah");
const OUT = path.join(ROOT, "store");
fs.mkdirSync(OUT, { recursive: true });
const b64 = f => fs.readFileSync(f).toString("base64");
const FONTS = `
@font-face{font-family:Ruqaa;font-weight:700;src:url(data:font/woff2;base64,${b64(path.join(__dirname, "fonts/aref-ruqaa-arabic-700-normal.woff2"))})}
@font-face{font-family:Amiri;font-weight:700;src:url(data:font/woff2;base64,${b64(path.join(WEB, "fonts/amiri-arabic-700-normal.woff2"))})}
@font-face{font-family:Tajawal;font-weight:500;src:url(data:font/woff2;base64,${b64(path.join(WEB, "fonts/tajawal-arabic-500-normal.woff2"))})}`;

(async () => {
  const b = await chromium.launch();

  // 1) الأيقونة 512 (من أيقونة iOS 1024 اللي بيعملها make-assets.js)
  execFileSync("python3", ["-I", "-c",
    "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').resize((512,512),Image.LANCZOS).save(sys.argv[2])",
    path.join(ROOT, "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"), path.join(OUT, "icon-512.png")]);

  // 2) صورة الغلاف 1024×500
  const fg = await b.newPage({ viewport: { width: 1024, height: 500 } });
  await fg.setContent(`<style>${FONTS}body{margin:0}</style>
  <div dir="rtl" style="width:1024px;height:500px;display:flex;align-items:center;justify-content:center;gap:56px;
    background:radial-gradient(circle at 30% 45%,#1a7f63 0%,#0f5643 55%,#0b3f32 100%);color:#f6ead0;position:relative;overflow:hidden">
    <svg width="760" height="760" viewBox="0 0 100 100" style="position:absolute;left:-180px;top:-130px;opacity:.12">
      <g fill="none" stroke="#d8ac52" stroke-width=".6"><rect x="17" y="17" width="66" height="66"/><rect x="17" y="17" width="66" height="66" transform="rotate(45 50 50)"/><circle cx="50" cy="50" r="30"/></g></svg>
    <div style="display:flex;flex-direction:column;align-items:center;line-height:1;position:relative">
      <div style="font-family:Amiri;font-weight:700;color:#d8ac52;font-size:62px">ﷺ</div>
      <div style="font-family:Ruqaa;font-weight:700;font-size:150px;margin-top:-6px">محمد</div>
    </div>
    <div style="position:relative;max-width:470px">
      <div style="font-family:Amiri;font-weight:700;font-size:64px;line-height:1.2">السيرة النبوية</div>
      <div style="font-family:Tajawal;font-weight:500;font-size:27px;color:#f3e4bf;margin-top:12px;line-height:1.6;white-space:nowrap">شجرة النسب الشريف · الغزوات<br>الصحابة · وما لا يسع المسلم جهله</div>
    </div>
  </div>`);
  await fg.evaluate(() => document.fonts.ready);
  await fg.screenshot({ path: path.join(OUT, "feature-1024x500.png") });

  // 3) لقطات الشاشة: Google Play بمقاس 1080×1920، و App Store (آيفون 6.9") بمقاس 1290×2796
  async function shots(dir, width, height) {
    fs.mkdirSync(path.join(OUT, dir), { recursive: true });
    const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.goto("file://" + path.join(WEB, "index.html"));
    await p.evaluate(() => { localStorage.clear(); localStorage.setItem("seerah.theme", "light"); });
    await p.reload(); await p.waitForTimeout(900);
    const shot = async name => { await p.waitForTimeout(500); await p.screenshot({ path: path.join(OUT, dir, name + ".png") }); };
    const hideHint = () => p.evaluate(() => document.getElementById("treeHint").classList.add("gone"));
    await hideHint(); await shot("1-tree-circle");
    await p.tap('[data-tid="prophet"] .dot'); await shot("2-profile");
    await p.click("#sheetClose"); await p.waitForTimeout(400);
    await p.click('.seg-btn[data-mode="tree"]'); await p.click("#centerBtn"); await hideHint(); await shot("3-tree-classic");
    await p.click('.nav-btn[data-view="seerah"]'); await p.click(".ev-card >> nth=0"); await shot("4-seerah");
    await p.click('.nav-btn[data-view="ghazawat"]'); await shot("5-battles");
    await p.click(".g-card >> nth=0"); await shot("6-badr");
    await p.click("#sheetClose"); await p.waitForTimeout(400);
    await p.click('.nav-btn[data-view="people"]'); await shot("7-people");
    await p.click('.nav-btn[data-view="essentials"]'); await shot("8-essentials");
    await ctx.close();
  }
  await shots("screenshots", 360, 640);
  await shots("ios-screenshots", 430, 932);
  await b.close();
  console.log("store assets written to", OUT);
})();
