(() => {
  "use strict";
  const P = window.PEOPLE, TREE = window.TREE;
  const G = Object.fromEntries(window.GHAZAWAT.map(g => [g.id, g]));
  const EV = Object.fromEntries(window.EVENTS.filter(e => e.id).map(e => [e.id, e]));
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
  };

  // ===== أدوات الأسماء =====
  const FEMALE = new Set(["amina", "thuwayba", "atika", "umayma", "barra", "arwa", "ummhakim"]);
  const SHORT = {
    prophet: "محمد ﷺ", zaynabjahsh: "زينب بنت جحش", zaynabkhuzayma: "زينب بنت خزيمة", zaynab_d: "زينب",
    safiyya: "صفية بنت حيي", safiyya_aunt: "صفية", abusufyanharith: "أبو سفيان بن الحارث",
    ibnabbas: "عبد الله بن عباس", zubayrAM: "الزبير", zubayr: "الزبير بن العوام", abdullah: "عبد الله",
    abdullah_son: "عبد الله", ummkulthumali: "أم كلثوم", zaynabali: "زينب", fadl: "الفضل", umama: "أمامة"
  };
  const isF = id => P[id] && (P[id].h === "f" || FEMALE.has(id));
  const shortName = id => SHORT[id] || P[id].name.replace(/\s*\(.*?\)\s*/g, " ").split(/\s+(?:بن|بنت)\s+/)[0].trim();
  const shortTitle = id => (P[id].title || "").split("،")[0];
  const honor = h => h === "m" ? "رضي الله عنه" : h === "f" ? "رضي الله عنها" : h === "p" ? "ﷺ" : "";
  const initial = id => { const n = (SHORT[id] || P[id].name).replace(/^(أبو|أبي|أم|عبد|ال)\s?/, ""); return n.trim().charAt(0); };
  const avatar = id => `<span class="avatar ${id === "prophet" ? "p" : isF(id) ? "f" : ""}">${id === "prophet" ? "ﷺ" : esc(initial(id))}</span>`;

  // ===== التنقل بين الصفحات =====
  const views = ["tree", "seerah", "ghazawat", "people", "essentials"];
  function showView(name) {
    if (!views.includes(name)) name = "tree";
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + name));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === name));
    $("#viewSub").textContent = $("#view-" + name).dataset.sub;
    store.set("seerah.view", name);
    window.scrollTo({ top: 0 });
    // أول مرة تظهر الشجرة: نعرضها كاملة داخل الإطار
    if (name === "tree" && !treeFitted) requestAnimationFrame(() => { if (!treeFitted) { initialView(); treeFitted = !!wrap.clientWidth; } });
  }
  let treeFitted = false;
  $("#nav").addEventListener("click", e => { const b = e.target.closest(".nav-btn"); if (b) showView(b.dataset.view); });

  // ===== المظهر =====
  const root = document.documentElement;
  const savedTheme = store.get("seerah.theme");
  if (savedTheme) root.dataset.theme = savedTheme;
  $("#themeBtn").addEventListener("click", () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    store.set("seerah.theme", root.dataset.theme);
  });

  // ===== النسب =====
  $("#lineage").innerHTML = window.LINEAGE.map(([n, id], i) =>
    (i ? '<span class="sep">بن</span>' : "") +
    (id ? `<button class="ln link" data-open="${id}">${esc(n)}</button>` : `<span class="ln">${esc(n)}</span>`)
  ).join("");

  // ===== الشجرة =====
  let mode = store.get("seerah.treeMode") || "tree";
  const collapsedState = new Map(); // مفتاح المسار -> مطوي؟

  function nodeHTML(n, path) {
    const kids = n.children || [];
    const key = path;
    if (!collapsedState.has(key)) collapsedState.set(key, !!n.collapsed);
    const collapsed = kids.length && collapsedState.get(key);
    const ordered = mode === "tree" ? [...kids].reverse() : kids;
    let box;
    if (n.id) {
      const cls = n.id === "prophet" ? "prophet" : isF(n.id) ? "f" : "";
      const sp = (n.spouses || []).map(s => `<button class="spouse" data-open="${s}">${esc(shortName(s))}</button>`).join("");
      box = `<button class="node ${cls}" data-open="${n.id}" data-tid="${n.id}"><span class="nm">${esc(shortName(n.id))}</span><span class="tt">${esc(shortTitle(n.id))}</span></button>` +
        (sp ? `<div class="spouses">${sp}</div>` : "");
    } else {
      box = `<button class="node group" data-toggle="${key}"><span class="nm">${n.icon ? n.icon + " " : ""}${esc(n.label)}</span><span class="tt">${kids.length} أشخاص</span></button>`;
    }
    const tog = kids.length ? `<button class="toggle" data-toggle="${key}" aria-label="فتح وطي">${collapsed ? kids.length : ""}</button>` : "";
    const sub = kids.length ? `<ul>${ordered.map(c => nodeHTML(c, key + "/" + kids.indexOf(c))).join("")}</ul>` : "";
    return `<li class="${collapsed ? "collapsed" : ""}" data-key="${key}"><div class="node-box">${box}${tog}</div>${sub}</li>`;
  }

  // ----- الشجرة الدائرية: النبي ﷺ في المركز والفروع حوله بخطوط منحنية -----
  const L = (id, children) => children ? { id, children } : { id };
  const RADIAL = { id: "prophet", children: [
    { label: "الآباء والأجداد", b: 0, children: [L("abdullah", [L("abdulmuttalib", [L("hashim", [L("abdmanaf", [L("qusay")])])])]), L("amina")] },
    { label: "الأعمام", b: 1, children: [L("harith", [L("abusufyanharith")]), L("abutalib", [L("ali"), L("jafar"), L("aqil"), L("ummhani")]), L("hamza"),
      L("abbas", [L("ibnabbas"), L("fadl")]), L("abulahab"), L("zubayrAM")] },
    { label: "العمات", b: 2, children: [L("safiyya_aunt", [L("zubayr")]), L("atika"), L("umayma"), L("barra"), L("arwa"), L("ummhakim")] },
    { label: "الأبناء والأحفاد", b: 3, children: [L("qasim"), L("zaynab_d", [L("umama")]), L("ruqayya"), L("ummkulthum"),
      L("fatima", [L("hasan"), L("husayn"), L("zaynabali"), L("ummkulthumali")]), L("abdullah_son"), L("ibrahim")] },
    { label: "أمهات المؤمنين", b: 4, children: ["khadija", "sawda", "aisha", "hafsa", "zaynabkhuzayma", "ummsalama", "zaynabjahsh", "juwayriya", "ummhabiba", "safiyya", "maymuna", "mariya"].map(id => L(id)) },
    { label: "المرضعات والحاضنة", b: 5, children: [L("thuwayba"), L("halima"), L("ummayman")] }
  ] };
  const RSTEP = 150, LABEL_W = 78;
  function radialSVG() {
    // 1) كل فرع ياخد زاوية على قد المساحة اللي أسماؤه محتاجاها
    let scale = 1;
    const R = d => d === 0 ? 0 : (130 + (d - 1) * RSTEP) * scale;
    const need = (n, d) => { n.d = d; const kids = n.children || []; n.need = kids.length ? kids.reduce((s, c) => s + need(c, d + 1), 0) : 0; n.need = Math.max(n.need, d ? LABEL_W / R(d) : 0); return n.need; };
    let total = need(RADIAL, 0);
    if (total > Math.PI * 2) { scale = total / (Math.PI * 2); total = need(RADIAL, 0); }
    const start = -Math.PI / 2 - RADIAL.children[0].need / total * Math.PI; // فرع الأجداد لفوق
    const nodes = [], links = [];
    const place = (n, a0, a1, branch, parent) => {
      n.a = (a0 + a1) / 2; n.r = R(n.d); n.x = n.r * Math.cos(n.a); n.y = n.r * Math.sin(n.a);
      n.branch = n.b !== undefined ? n.b : branch;
      nodes.push(n); if (parent) links.push([parent, n]);
      let acc = a0;
      (n.children || []).forEach(c => { const span = (a1 - a0) * c.need / n.need; place(c, acc, acc + span, n.branch, n); acc += span; });
    };
    place(RADIAL, start, start + Math.PI * 2, -1, null);
    // 2) أبعاد الرسم
    const pad = 70, xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad + 20;
    const W = maxX - minX, H = maxY - minY, P = (x, y) => `${(x - minX).toFixed(1)},${(y - minY).toFixed(1)}`;
    const pol = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
    // 3) دواير خلفية + خطوط منحنية + الأشخاص
    const maxD = Math.max(...nodes.map(n => n.d));
    let rings = "";
    for (let d = 1; d <= maxD; d++) { const [cx, cy] = [-minX, -minY]; rings += `<circle class="ring" cx="${cx}" cy="${cy}" r="${R(d)}"/>`; }
    const paths = links.map(([p, c]) => {
      const rm = (p.r + c.r) / 2;
      // من المركز: خط يطلع من حافة دايرة النبي ﷺ في اتجاه الفرع، بانحناءة خفيفة
      const [sx, sy] = p.d === 0 ? pol(56, c.a) : [p.x, p.y];
      const [x1, y1] = p.d === 0 ? pol(rm * 0.8, c.a - 0.12) : pol(rm, p.a), [x2, y2] = pol(rm, c.a);
      return `<path class="rl b${c.branch} d${Math.min(c.d, 4)}" d="M${P(sx, sy)} C${P(x1, y1)} ${P(x2, y2)} ${P(c.x, c.y)}"/>`;
    }).join("");
    const circles = nodes.map(n => {
      const [cx, cy] = P(n.x, n.y).split(",");
      if (n.d === 0) return `<g class="rnode prophet" data-open="prophet" data-tid="prophet" transform="translate(${cx} ${cy})">
        <circle r="54" class="halo"/><circle r="46"/><text class="ps" y="-10">ﷺ</text><text class="pn" y="22">محمد</text></g>`;
      if (!n.id) return `<g class="rnode grp b${n.branch}" transform="translate(${cx} ${cy})"><circle r="34"/>
        ${n.label.split(" ").length > 2 ? `<text y="-3">${esc(n.label.split(" ").slice(0, 1).join(" "))}</text><text y="14">${esc(n.label.split(" ").slice(1).join(" "))}</text>` : n.label.split(" ").map((w, i, a) => `<text y="${(i - (a.length - 1) / 2) * 16 + 5}">${esc(w)}</text>`).join("")}</g>`;
      const f = isF(n.id), nm = shortName(n.id);
      return `<g class="rnode ${f ? "f" : "m"}" data-open="${n.id}" data-tid="${n.id}" transform="translate(${cx} ${cy})">
        <circle r="17"/><text class="ini" y="6">${esc(initial(n.id))}</text><text class="lbl" y="35">${esc(nm)}</text></g>`;
    }).join("");
    return `<svg class="radial" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" direction="rtl">
      <g class="rings">${rings}</g><g class="links">${paths}</g><g>${circles}</g></svg>`;
  }

  function renderTree() {
    const z = $("#treeZoom");
    z.className = "tree-zoom mode-" + mode;
    z.innerHTML = mode === "tree" ? radialSVG() : `<ul>${nodeHTML(TREE, "r")}</ul>`;
    $("#expandAll").hidden = mode === "tree";
    document.querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
  }

  function toggleKey(key) {
    collapsedState.set(key, !collapsedState.get(key));
    const li = document.querySelector(`li[data-key="${CSS.escape(key)}"]`);
    if (!li) return;
    const c = collapsedState.get(key);
    li.classList.toggle("collapsed", c);
    const t = li.querySelector(":scope > .node-box > .toggle");
    if (t) t.textContent = c ? li.querySelectorAll(":scope > ul > li").length : "";
  }

  // ----- التحريك والتكبير (مثل الخرائط) -----
  const wrap = $("#treeWrap"), zEl = $("#treeZoom");
  const view = { s: 1, x: 0, y: 0 };
  const MIN_S = 0.1, MAX_S = 2.5;
  const clampS = s => Math.min(MAX_S, Math.max(MIN_S, s));
  function applyView(anim) {
    zEl.style.transition = anim ? "transform .3s ease" : "none";
    zEl.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`;
  }
  function zoomAt(ns, cx, cy, anim) {
    ns = clampS(ns);
    const k = ns / view.s;
    view.x = cx - (cx - view.x) * k; view.y = cy - (cy - view.y) * k; view.s = ns;
    applyView(anim);
  }
  // عرض الشجرة كاملة داخل الإطار
  function fitTree(anim) {
    const W = wrap.clientWidth, H = wrap.clientHeight, w = zEl.offsetWidth, h = zEl.offsetHeight;
    if (!W || !w) return;
    const s = clampS(mode === "list" ? Math.min(W / w, 1) : Math.min(W / w, H / h, 1));
    view.s = s; view.x = (W - w * s) / 2; view.y = mode === "list" ? 0 : Math.max(0, (H - h * s) / 2);
    applyView(anim);
  }
  function centerOn(id, flash) {
    if (mode === "list") {
      // افتح كل الآباء حتى يظهر الشخص في القائمة
      const path = findPath(TREE, id, "r");
      if (!path) return false;
      path.slice(0, -1).forEach(k => collapsedState.set(k, false));
      renderTree();
    }
    const el = focusNode(id, Math.max(view.s, 0.85), mode === "tree" ? 0.5 : 1 / 3, true);
    if (!el) return false;
    treeFitted = true;
    if (flash) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
    return true;
  }
  // يحرّك الشجرة بحيث يكون الشخص في منتصف العرض وعلى ارتفاع yFrac من الإطار
  function focusNode(id, s, yFrac, anim) {
    const el = zEl.querySelector(`[data-tid="${CSS.escape(id)}"]`);
    if (!el || !wrap.clientWidth) return null;
    const zr = zEl.getBoundingClientRect(), er = el.getBoundingClientRect();
    const ex = (er.left - zr.left) / view.s, ey = (er.top - zr.top) / view.s, ew = er.width / view.s;
    view.s = clampS(s);
    view.x = wrap.clientWidth / 2 - (ex + ew / 2) * view.s;
    view.y = wrap.clientHeight * yFrac - ey * view.s;
    applyView(anim);
    return el;
  }
  // البداية: الشجرة كاملة لو مقروءة، وإلا تصغير مريح حول النبي ﷺ
  const START_S = 0.4;
  function initialView() {
    fitTree();
    if (mode === "tree" && view.s < START_S) focusNode("prophet", START_S, 0.42, false);
  }
  function findPath(n, id, key) {
    if (n.id === id) return [key];
    const kids = n.children || [];
    for (let i = 0; i < kids.length; i++) {
      const r = findPath(kids[i], id, key + "/" + i);
      if (r) return [key, ...r];
    }
    return null;
  }
  const inTree = id => !!(findPath(RADIAL, id, "r") || findPath(TREE, id, "r"));

  $("#treeZoom").addEventListener("click", e => {
    const t = e.target.closest("[data-toggle]");
    if (t) { toggleKey(t.dataset.toggle); return; }
  });
  document.querySelectorAll(".seg-btn").forEach(b => b.addEventListener("click", () => {
    mode = b.dataset.mode; store.set("seerah.treeMode", mode); renderTree(); initialView();
  }));
  const zoomCenter = f => zoomAt(view.s * f, wrap.clientWidth / 2, wrap.clientHeight / 2, true);
  $("#zoomIn").addEventListener("click", () => zoomCenter(1.4));
  $("#zoomOut").addEventListener("click", () => zoomCenter(1 / 1.4));
  $("#zoomFit").addEventListener("click", () => fitTree(true));
  let allOpen = false;
  $("#expandAll").addEventListener("click", () => {
    allOpen = !allOpen;
    if (allOpen) { for (const k of collapsedState.keys()) collapsedState.set(k, false); }
    else collapsedState.clear(); // رجوع للوضع الافتراضي
    $("#expandAll").textContent = allOpen ? "طي الكل" : "فتح الكل";
    renderTree(); fitTree(true);
  });
  $("#centerBtn").addEventListener("click", () => centerOn("prophet", true));

  // إصبع واحد للتحريك، وإصبعان للتكبير والتصغير (يعمل باللمس والماوس)
  (() => {
    const pts = new Map();
    let start = null, moved = false, suppressClick = false;
    const local = (x, y) => { const r = wrap.getBoundingClientRect(); return { x: x - r.left, y: y - r.top }; };
    const snapshot = () => {
      const p = [...pts.values()];
      start = { s: view.s, x: view.x, y: view.y, p };
      if (p.length >= 2) {
        start.d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1;
        start.c = local((p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2);
      }
    };
    const hideHint = () => $("#treeHint").classList.add("gone");
    wrap.addEventListener("pointerdown", e => {
      if (e.target.closest(".zoom-ctl") || (e.pointerType === "mouse" && e.button !== 0)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) moved = false;
      snapshot();
    });
    window.addEventListener("pointermove", e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const p = [...pts.values()];
      if (p.length === 1 && start.p.length === 1) {
        const dx = p[0].x - start.p[0].x, dy = p[0].y - start.p[0].y;
        if (!moved && Math.hypot(dx, dy) < 6) return;
        moved = true; wrap.classList.add("dragging"); hideHint();
        view.x = start.x + dx; view.y = start.y + dy; applyView(false);
      } else if (p.length >= 2 && start.d) {
        moved = true; hideHint();
        const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        const c = local((p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2);
        const ns = clampS(start.s * d / start.d);
        // النقطة اللي تحت الإصبعين تفضل تحتهم
        const px = (start.c.x - start.x) / start.s, py = (start.c.y - start.y) / start.s;
        view.s = ns; view.x = c.x - px * ns; view.y = c.y - py * ns; applyView(false);
      }
    });
    const end = e => {
      if (!pts.delete(e.pointerId)) return;
      if (pts.size) snapshot();
      else { wrap.classList.remove("dragging"); if (moved) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 80); } }
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    // بعد السحب ما نفتحش النبذة بالغلط
    wrap.addEventListener("click", e => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; } }, true);
    // عجلة الماوس / لوحة اللمس في الكمبيوتر
    wrap.addEventListener("wheel", e => {
      e.preventDefault(); hideHint();
      const c = local(e.clientX, e.clientY);
      if (e.ctrlKey || e.deltaMode === 1) zoomAt(view.s * Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.01)), c.x, c.y, false);
      else { view.x -= e.deltaX; view.y -= e.deltaY; applyView(false); }
    }, { passive: false });
    // منع تكبير الصفحة كلها في iOS
    ["gesturestart", "gesturechange"].forEach(t => wrap.addEventListener(t, e => e.preventDefault()));
    window.addEventListener("resize", () => { if (!moved) initialView(); });
  })();

  // ===== السيرة =====
  let period = "all";
  function renderPeriods() {
    const items = [{ id: "all", title: "الكل" }, ...window.PERIODS];
    $("#periodChips").innerHTML = items.map(p => `<button class="chip ${p.id === period ? "active" : ""}" data-p="${p.id}">${esc(p.title)}</button>`).join("");
  }
  function renderTimeline() {
    const out = window.PERIODS.filter(p => period === "all" || p.id === period).map(p => {
      const evs = window.EVENTS.filter(e => e.p === p.id).map((e, i) => {
        const links = (e.people || []).filter(id => P[id]).map(id => `<button class="plink" data-open="${id}">${esc(shortName(id))}</button>`).join("");
        const gz = e.ghazwa ? `<button class="plink gold" data-open="${e.ghazwa}">تفاصيل الغزوة ‹</button>` : "";
        return `<div class="ev ${e.ghazwa ? "is-ghazwa" : ""}">
          <div class="ev-card card" role="button" tabindex="0" data-ev>
            <div class="ev-top"><span class="badge">${esc(e.when)}</span>${e.age ? `<span class="badge age">${esc(e.age)}</span>` : ""}${e.ghazwa ? '<span class="badge gz">غزوة</span>' : ""}</div>
            <div class="ev-title"><span>${esc(e.title)}</span><span class="chev">▼</span></div>
            <div class="ev-body"><p style="margin:0">${esc(e.text)}</p>${links || gz ? `<div class="ev-links">${gz}${links}</div>` : ""}</div>
          </div></div>`;
      }).join("");
      return `<div class="period-h"><h2>${esc(p.title)}</h2><span>${esc(p.sub)}</span></div><div class="tl">${evs}</div>`;
    }).join("");
    $("#timeline").innerHTML = out;
  }
  $("#periodChips").addEventListener("click", e => {
    const c = e.target.closest(".chip"); if (!c) return;
    period = c.dataset.p; renderPeriods(); renderTimeline();
  });
  $("#timeline").addEventListener("click", e => {
    if (e.target.closest("[data-open]")) return;
    const c = e.target.closest("[data-ev]"); if (c) c.parentElement.classList.toggle("open");
  });

  // ===== الغزوات =====
  const num = s => { const m = String(s).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).match(/\d+/); return m ? +m[0] : 0; };
  const resLabel = { win: "انتصار", mixed: "ابتلاء", peace: "صلح" };
  function renderGhazawat() {
    $("#ghazawatList").innerHTML = window.GHAZAWAT.map(g => {
      const m = num(g.muslims), en = num(g.enemy);
      const bar = m && en ? `<div class="vs"><div class="vs-row"><span>المسلمون <b>${esc(g.muslims)}</b></span><span>العدو <b>${esc(g.enemy)}</b></span></div>
        <div class="vs-bar"><i class="m" style="width:${(m / (m + en) * 100).toFixed(1)}%"></i><i class="e" style="flex:1"></i></div></div>` : "";
      return `<button class="g-card card" data-open="${g.id}" data-r="${g.resultType}">
        <div class="g-head"><div><div class="g-name">${esc(g.name)}</div><div class="g-meta">${esc(g.date)} · ${esc(g.place)}</div></div>
        <span class="res">${esc(g.tag || resLabel[g.resultType])}</span></div>${bar}
        <div class="g-meta" style="margin-top:6px">${esc(g.result)}</div></button>`;
    }).join("");
  }

  // ===== الأعلام =====
  let group = "wives";
  function renderPeopleChips() {
    $("#peopleChips").innerHTML = window.PEOPLE_GROUPS.map(g => `<button class="chip ${g.id === group ? "active" : ""}" data-g="${g.id}">${esc(g.label)}</button>`).join("");
  }
  function renderPeople() {
    let ids = Object.keys(P).filter(id => group === "all" ? !P[id].tags.includes("ancestor") || P[id].tags.length > 1 : P[id].tags.includes(group));
    if (group === "wives") ids.sort((a, b) => P[a].order - P[b].order);
    $("#peopleGrid").innerHTML = ids.map(id => `<button class="p-card card" data-open="${id}">${avatar(id)}<div><div class="p-name">${esc(P[id].name)}</div><div class="p-title">${esc(P[id].title)}</div></div></button>`).join("");
  }
  $("#peopleChips").addEventListener("click", e => {
    const c = e.target.closest(".chip"); if (!c) return;
    group = c.dataset.g; renderPeopleChips(); renderPeople();
  });

  // ===== المختصر =====
  $("#essentials").innerHTML = window.ESSENTIALS.map((x, i) =>
    `<details class="ess card"${i < 2 ? " open" : ""}><summary><span><span class="num">${i + 1}</span>${esc(x.q)}</span></summary><p>${esc(x.a)}</p></details>`).join("");

  // ===== الاختبار =====
  let quiz = null;
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function showBest() { const b = store.get("seerah.best"); $("#bestScore").textContent = b ? `أفضل نتيجة: ${b} من 10` : ""; }
  function startQuiz() {
    quiz = { qs: shuffle(window.QUIZ).slice(0, 10).map(q => { const o = shuffle(q.o.map((t, i) => ({ t, ok: i === q.a }))); return { q: q.q, o }; }), i: 0, score: 0, answered: false };
    $("#quizCta").classList.add("hidden"); $("#quiz").classList.remove("hidden");
    renderQ();
  }
  function renderQ() {
    const q = quiz.qs[quiz.i], n = quiz.qs.length;
    $("#quiz").innerHTML = `<div class="q-progress"><i style="width:${quiz.i / n * 100}%"></i></div>
      <div class="q-count">السؤال ${quiz.i + 1} من ${n} · النتيجة ${quiz.score}</div>
      <div class="q-text">${esc(q.q)}</div>
      <div class="q-opts">${q.o.map((o, i) => `<button class="q-opt" data-i="${i}">${esc(o.t)}</button>`).join("")}</div>
      <div class="q-foot"><button class="btn-ghost" data-quit>إنهاء</button><button class="btn-gold hidden" data-next>${quiz.i + 1 < n ? "التالي" : "النتيجة"}</button></div>`;
    quiz.answered = false;
  }
  function finishQuiz() {
    const s = quiz.score, best = +(store.get("seerah.best") || 0);
    if (s > best) store.set("seerah.best", s);
    const msg = s >= 9 ? "ما شاء الله! معلوماتك ممتازة" : s >= 7 ? "أحسنت! معلومات جيدة جدًا" : s >= 5 ? "جيد، ويمكنك مراجعة السيرة لتزداد" : "راجع أحداث السيرة وحاول مرة أخرى";
    $("#quiz").innerHTML = `<div class="q-result"><div class="score">${s} / ${quiz.qs.length}</div><p>${msg}</p>
      <div class="q-foot" style="justify-content:center"><button class="btn-ghost" data-quit>رجوع</button><button class="btn-gold" data-again>اختبار جديد</button></div></div>`;
  }
  $("#startQuiz").addEventListener("click", startQuiz);
  $("#quiz").addEventListener("click", e => {
    const opt = e.target.closest(".q-opt");
    if (opt && !quiz.answered) {
      quiz.answered = true;
      const q = quiz.qs[quiz.i], i = +opt.dataset.i;
      if (q.o[i].ok) quiz.score++;
      $("#quiz").querySelectorAll(".q-opt").forEach((b, k) => { if (q.o[k].ok) b.classList.add("right"); else if (k === i) b.classList.add("wrong"); });
      $("#quiz [data-next]").classList.remove("hidden");
      $("#quiz .q-count").textContent = `السؤال ${quiz.i + 1} من ${quiz.qs.length} · النتيجة ${quiz.score}`;
      return;
    }
    if (e.target.closest("[data-next]")) { quiz.i++; quiz.i < quiz.qs.length ? renderQ() : finishQuiz(); return; }
    if (e.target.closest("[data-again]")) { startQuiz(); return; }
    if (e.target.closest("[data-quit]")) { $("#quiz").classList.add("hidden"); $("#quizCta").classList.remove("hidden"); showBest(); }
  });

  // ===== لوحة التفاصيل =====
  const stack = [];
  const linkChip = id => {
    if (P[id]) return `<button class="plink" data-open="${id}">${esc(shortName(id))}</button>`;
    if (G[id]) return `<button class="plink gold" data-open="${id}">${esc(G[id].name)}</button>`;
    if (EV[id]) return `<button class="plink gold" data-open="${id}">${esc(EV[id].title)}</button>`;
    return "";
  };
  function personHTML(id) {
    const p = P[id];
    const facts = p.facts && p.facts.length ? `<div class="sh-sec"><h3>أبرز المعلومات</h3><ul>${p.facts.map(f => `<li>${esc(f)}</li>`).join("")}</ul></div>` : "";
    // روابط تلقائية: من يذكر هذا الشخص في علاقاته
    const rel = [...new Set([...(p.related || []), ...Object.keys(P).filter(k => k !== id && (P[k].related || []).includes(id))])];
    const evs = window.EVENTS.filter(e => (e.people || []).includes(id));
    const gz = window.GHAZAWAT.filter(g => g.people.includes(id) && !rel.includes(g.id));
    return `<div class="sh-head">${avatar(id)}<h2 class="sh-name">${esc(p.name)}</h2>
        ${p.h ? `<div class="sh-honor">${honor(p.h)}</div>` : ""}<div class="sh-title">${esc(p.title)}</div>
        <span class="badge sh-rel">${esc(p.rel)}</span></div>
      <div class="sh-sec"><h3>نبذة</h3><p>${esc(p.bio)}</p></div>${facts}
      ${rel.length ? `<div class="sh-sec"><h3>مرتبط به</h3><div class="ev-links">${rel.map(linkChip).join("")}</div></div>` : ""}
      ${evs.length || gz.length ? `<div class="sh-sec"><h3>في أحداث السيرة</h3><div class="ev-links">${gz.map(g => linkChip(g.id)).join("")}${evs.map(e => `<button class="plink" data-event="${window.EVENTS.indexOf(e)}">${esc(e.title)}</button>`).join("")}</div></div>` : ""}
      ${inTree(id) ? `<div class="sh-actions"><button class="btn-gold" data-showtree="${id}">عرض في الشجرة</button></div>` : ""}`;
  }
  function ghazwaHTML(g) {
    return `<div class="sh-head"><h2 class="sh-name">${esc(g.name)}</h2><div class="sh-title">${esc(g.date)} · ${esc(g.place)}</div>
      <span class="badge sh-rel">${esc(g.result)}</span></div>
      <div class="sh-stats">
        <div><small>عدد المسلمين</small><b>${esc(g.muslims)}</b></div>
        <div><small>العدو</small><b>${esc(g.enemy)}</b></div>
        <div><small>الطرف الآخر</small><b>${esc(g.enemyName)}</b></div>
        <div><small>الشهداء</small><b>${esc(g.martyrs)}</b></div>
      </div>
      <div class="sh-sec"><h3>السبب</h3><p>${esc(g.cause)}</p></div>
      <div class="sh-sec"><h3>الأحداث</h3><ul>${g.events.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="sh-sec"><h3>النتائج</h3><p>${esc(g.outcome)}</p></div>
      <div class="sh-sec"><h3>دروس وعبر</h3><ul>${g.lessons.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      ${g.people.length ? `<div class="sh-sec"><h3>أعلام في الغزوة</h3><div class="ev-links">${g.people.map(linkChip).join("")}</div></div>` : ""}`;
  }
  function eventHTML(e) {
    return `<div class="sh-head"><h2 class="sh-name">${esc(e.title)}</h2><div class="sh-title">${esc(e.when)}${e.age ? " · عمر النبي ﷺ: " + esc(e.age) : ""}</div></div>
      <div class="sh-sec"><p>${esc(e.text)}</p></div>
      ${(e.people || []).length || e.ghazwa ? `<div class="sh-sec"><h3>مرتبط بالحدث</h3><div class="ev-links">${e.ghazwa ? linkChip(e.ghazwa) : ""}${e.people.map(linkChip).join("")}</div></div>` : ""}`;
  }
  function renderSheet(item) {
    let html = "";
    if (item.t === "p") html = personHTML(item.id);
    else if (item.t === "g") html = ghazwaHTML(G[item.id]);
    else if (item.t === "e") html = eventHTML(item.e);
    $("#sheetBody").innerHTML = html;
    $("#sheetBody").scrollTop = 0;
    updateFavBtn(item);
  }

  // ===== المفضلة =====
  const favKey = it => it.t === "e" ? "e:" + it.e.title : it.t + ":" + it.id;
  const loadFavs = () => { try { const a = JSON.parse(store.get("seerah.favs") || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } };
  let favs = loadFavs();
  function updateFavBtn(item) {
    const on = favs.includes(favKey(item)), b = $("#sheetFav");
    b.textContent = on ? "★" : "☆"; b.setAttribute("aria-pressed", on);
    b.setAttribute("aria-label", on ? "إزالة من المفضلة" : "إضافة إلى المفضلة");
  }
  function renderFavs() {
    const chips = favs.map(k => {
      const [t, ...rest] = k.split(":"), v = rest.join(":");
      if (t === "p" && P[v]) return `<button class="plink" data-open="${v}">${esc(shortName(v))}</button>`;
      if (t === "g" && G[v]) return `<button class="plink gold" data-open="${v}">${esc(G[v].name)}</button>`;
      const i = window.EVENTS.findIndex(e => e.title === v);
      return t === "e" && i >= 0 ? `<button class="plink" data-event="${i}">${esc(v)}</button>` : "";
    }).join("");
    $("#favs").innerHTML = `<h3><span>★</span> مفضلتي</h3>` +
      (chips ? `<div class="ev-links">${chips}</div>` : `<div class="empty">اضغط ☆ في أي نبذة أو غزوة أو حدث لحفظها هنا.</div>`);
  }
  $("#sheetFav").addEventListener("click", () => {
    const it = stack[stack.length - 1]; if (!it) return;
    const k = favKey(it);
    favs = favs.includes(k) ? favs.filter(x => x !== k) : [...favs, k];
    store.set("seerah.favs", JSON.stringify(favs));
    updateFavBtn(it); renderFavs();
  });

  // ===== حدث اليوم والتذكير اليومي =====
  const Cap = window.Capacitor;
  const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const LN = isNative && Cap.Plugins ? Cap.Plugins.LocalNotifications : null;
  const dayNo = d => Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5);
  const eventForDay = n => ((n % window.EVENTS.length) + window.EVENTS.length) % window.EVENTS.length;
  const NOTIFY_HOUR = 20, NOTIFY_DAYS = 30;
  function renderToday() {
    const i = eventForDay(dayNo(new Date())), e = window.EVENTS[i];
    const on = store.get("seerah.notify") === "1";
    $("#today").innerHTML = `<div class="today-k">من السيرة اليوم</div><h2>${esc(e.title)}</h2><p>${esc(e.text)}</p>
      <div class="today-foot"><button class="btn-ghost" data-event="${i}">اقرأ المزيد</button>
      ${LN ? `<button class="switch" id="notifySw" role="switch" aria-checked="${on}"><i></i>تذكير يومي الساعة 8 مساءً</button>` : ""}</div>`;
  }
  async function scheduleDaily() {
    if (!LN) return;
    const pending = await LN.getPending();
    if (pending.notifications.length) await LN.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    if (store.get("seerah.notify") !== "1") return;
    const now = new Date(), list = [];
    for (let d = 0; d < NOTIFY_DAYS; d++) {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, NOTIFY_HOUR, 0, 0);
      if (at <= now) continue;
      const i = eventForDay(dayNo(at)), e = window.EVENTS[i];
      list.push({ id: 1000 + d, title: "من السيرة اليوم: " + e.title, body: e.text.length > 140 ? e.text.slice(0, 140) + "…" : e.text, schedule: { at, allowWhileIdle: true }, extra: { event: i } });
    }
    if (list.length) await LN.schedule({ notifications: list });
    // schedule() قد ينجح ظاهريًا بينما يرفض النظام الحفظ، فنتحقق من العدد الفعلي
    return list.length ? (await LN.getPending()).notifications.length : -1;
  }
  $("#today").addEventListener("click", async e => {
    const sw = e.target.closest("#notifySw"); if (!sw) return;
    const turnOn = sw.getAttribute("aria-checked") !== "true";
    if (turnOn) {
      const perm = await LN.requestPermissions();
      if (perm.display !== "granted") { alert("لازم تسمح بالإشعارات من إعدادات الموبايل عشان التذكير يشتغل."); return; }
    }
    store.set("seerah.notify", turnOn ? "1" : "0");
    sw.setAttribute("aria-checked", turnOn);
    if (!turnOn) { scheduleDaily().catch(() => {}); return; }
    const count = await scheduleDaily().catch(() => 0);
    if (count === 0) {
      store.set("seerah.notify", "0");
      sw.setAttribute("aria-checked", "false");
      alert("ما قدرناش نفعّل التذكير. اتأكد إن الإشعارات مسموحة للتطبيق من الإعدادات، واقفل التطبيق وافتحه وجرّب تاني.");
    }
  });
  function openItem(item) {
    stack.push(item);
    history.pushState({ sheet: stack.length }, "");
    renderSheet(item);
    $("#sheet").classList.add("show"); $("#backdrop").classList.add("show");
  }
  function open(id) {
    if (P[id]) openItem({ t: "p", id });
    else if (G[id]) openItem({ t: "g", id });
    else if (EV[id]) openItem({ t: "e", e: EV[id] });
  }
  function hideSheet() { $("#sheet").classList.remove("show"); $("#backdrop").classList.remove("show"); }
  function closeAll() { if (stack.length) history.go(-stack.length); }
  window.addEventListener("popstate", () => {
    stack.pop();
    if (stack.length) renderSheet(stack[stack.length - 1]); else hideSheet();
  });
  $("#sheetClose").addEventListener("click", closeAll);
  $("#backdrop").addEventListener("click", closeAll);
  // سحب اللوحة لأسفل للإغلاق
  (() => {
    const sh = $("#sheet"); let y0 = null, dy = 0;
    sh.addEventListener("touchstart", e => { if ($("#sheetBody").scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
    sh.addEventListener("touchmove", e => { if (y0 === null) return; dy = e.touches[0].clientY - y0; if (dy > 0) { sh.style.transition = "none"; sh.style.transform = `translateY(${dy}px)`; } }, { passive: true });
    sh.addEventListener("touchend", () => { if (y0 === null) return; sh.style.transition = ""; sh.style.transform = ""; if (dy > 110) closeAll(); y0 = null; });
  })();

  // نقرات عامة على أي عنصر قابل للفتح
  document.addEventListener("click", e => {
    const o = e.target.closest("[data-open]");
    if (o) { e.stopPropagation(); open(o.dataset.open); return; }
    const ev = e.target.closest("[data-event]");
    if (ev) { openItem({ t: "e", e: window.EVENTS[+ev.dataset.event] }); return; }
    const st = e.target.closest("[data-showtree]");
    if (st) {
      const id = st.dataset.showtree;
      closeAll();
      setTimeout(() => { showView("tree"); centerOn(id, true); }, 320);
    }
  });

  // ===== البحث =====
  const norm = s => String(s).replace(/[ً-ْـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").toLowerCase();
  const index = [
    ...Object.keys(P).map(id => ({ kind: "شخص", title: P[id].name, sub: P[id].title, hay: norm([P[id].name, P[id].title, P[id].rel, SHORT[id] || ""].join(" ")), body: norm(P[id].bio), go: () => open(id) })),
    ...window.GHAZAWAT.map(g => ({ kind: "غزوة", title: g.name, sub: g.date, hay: norm(g.name + " " + g.place), body: norm(g.cause + g.events.join(" ")), go: () => open(g.id) })),
    ...window.EVENTS.map(e => ({ kind: "حدث", title: e.title, sub: e.when, hay: norm(e.title), body: norm(e.text), go: () => openItem({ t: "e", e }) }))
  ];
  let results = [];
  function doSearch(q) {
    const n = norm(q.trim());
    if (!n) { $("#searchResults").innerHTML = '<div class="empty">اكتب اسم صحابي أو غزوة أو حدث</div>'; return; }
    const head = index.filter(x => x.hay.includes(n));
    const body = index.filter(x => !x.hay.includes(n) && x.body.includes(n));
    results = [...head, ...body].slice(0, 40);
    $("#searchResults").innerHTML = results.length ? results.map((r, i) =>
      `<button class="sr" data-r="${i}"><span class="kind">${r.kind}</span><span><b>${esc(r.title)}</b><small>${esc(r.sub)}</small></span></button>`).join("")
      : '<div class="empty">لا توجد نتائج</div>';
  }
  function openSearch() { $("#searchLayer").classList.remove("hidden"); $("#searchInput").value = ""; doSearch(""); setTimeout(() => $("#searchInput").focus(), 50); }
  function closeSearch() { $("#searchLayer").classList.add("hidden"); }
  $("#searchBtn").addEventListener("click", openSearch);
  $("#searchClose").addEventListener("click", closeSearch);
  $("#searchInput").addEventListener("input", e => doSearch(e.target.value));
  $("#searchResults").addEventListener("click", e => { const b = e.target.closest(".sr"); if (b) { const r = results[+b.dataset.r]; closeSearch(); r.go(); } });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { if (!$("#searchLayer").classList.contains("hidden")) closeSearch(); else closeAll(); } });

  // ===== البداية =====
  renderTree(); renderPeriods(); renderTimeline(); renderGhazawat(); renderPeopleChips(); renderPeople(); showBest();
  renderToday(); renderFavs();
  showView(store.get("seerah.view") || "tree");

  if (isNative) {
    // داخل تطبيق الموبايل: إخفاء شاشة البداية بعد الرسم، شريط الحالة، تجديد الإشعارات، وفتح الحدث عند الضغط على الإشعار
    if (Cap.Plugins.SplashScreen) requestAnimationFrame(() => Cap.Plugins.SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {}));
    const SB = Cap.Plugins.StatusBar;
    if (SB) { SB.setStyle({ style: "DARK" }).catch(() => {}); SB.setBackgroundColor && SB.setBackgroundColor({ color: "#0b3f32" }).catch(() => {}); }
    if (LN) {
      scheduleDaily().catch(() => {});
      LN.addListener("localNotificationActionPerformed", a => {
        const i = a.notification && a.notification.extra && a.notification.extra.event;
        if (window.EVENTS[i]) { showView("essentials"); openItem({ t: "e", e: window.EVENTS[i] }); }
      });
    }
  } else if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
