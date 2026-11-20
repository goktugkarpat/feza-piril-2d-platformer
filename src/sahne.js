/* sahne.js – açılış (yatak odası → Işık Ormanı rüyası) ve kapanış (sabah) sahneleri. Sözleşme: src/SPEC.md.
   Oda "oda birimi" ile çizilir: ekran yüksekliği = 100 birim, x = 0 ekranın ortası (genişlik ekran oranına göre değişir).
   Pahalı her şey (oda duvarları, orman fonu) ekran boyunda bir kez tuvale çizilir (önbellek); her karede yalnızca
   değişen parçalar (perde/sarmaşık, battaniye/yosun, lamba/ay, halı/mantar, karakterler, ışıklar) çizilir.
   Bütün özel adlar sh/SH ile başlar. */
'use strict';

// ── küçük yardımcılar ──
const shSeg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const shEase = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const shEase2 = t => shEase(shEase(t));
function shMix(a, b, t, al = 1) { return mixc(a, b, clamp(t, 0, 1), al); }
function shSure(k, yedek = 4) {   // seslendirme süresi (yoksa metin uzunluğundan tahmin)
  if (window.VOICE_DUR && VOICE_DUR[k]) return VOICE_DUR[k];
  if (typeof SES !== 'undefined' && SES.sure) { const d = SES.sure(k); if (d > 0.5) return d; }
  const m = typeof SES !== 'undefined' && SES.LINES && SES.LINES[k];
  return m ? clamp(m.length / 13.5 + 0.6, 2.5, 9) : yedek;
}
function shSoyle(k) { if (typeof SES !== 'undefined' && SES.soyle) SES.soyle(k, { oncelik: 3 }); }
function shSus() { if (typeof SES === 'undefined') return; try { if (SES.sus) SES.sus(); else if (SES.dur) SES.dur(); } catch (e) {} }
// sahne anları: ses/müzik geçişleri için OLAY 'sahneAn' {ad} (her an bir kez)
function shSfx(ad, v) { try { if (typeof AU !== 'undefined' && AU && AU.sfx) AU.sfx(ad, v || 0); } catch (e) {} }
function shBir(k, at, ad, v) { if (!sh.sesler['s_' + k] && sh.t >= at) { sh.sesler['s_' + k] = 1; shSfx(ad, v); shAn(k); } }   // zamanı gelince bir kez
function shAn(ad) { if (sh.anlar[ad]) return; sh.anlar[ad] = 1; try { OLAY.emit('sahneAn', { ad, mod: sh.mod }); } catch (e) {} }
// Deniz'in ilk final özeti dünyadaki kutlamaya aittir; sabah akışı bu
// kaydı yeniden istemez. İnci'nin ilk kısa sözüne yer bırak, sonra bir kez anlat.
const shInciOzetleri = new WeakSet();
OLAY.on('inciSahne', e => {
  if (typeof BOLUM_NO === 'undefined' || BOLUM_NO !== 4 || DURUM !== 'oyun' || !e || !e.o || shInciOzetleri.has(e.o) || typeof omZamanla !== 'function') return;
  shInciOzetleri.add(e.o);
  omZamanla(0.7 + shSure('p_i_inci_uyan') + 0.7, () => {
    if (DURUM === 'oyun' && !e.o.done && e.o.dnz && e.o.dnz.faz === 'uyan') shSoyle('a_i_final1');
  });
});

// ── renk paletleri: gece / sabah ──
const SH_GECE = {
  wallTop: '#10173a', wallBot: '#1b2756', paper: '#9fb2ff', paperA: 0.09, base: '#0c1230', baseHi: '#2c3a78',
  floorTop: '#1c1a3e', floorBot: '#0a0a1d', seam: 'rgba(0,0,0,0.28)', seamHi: 'rgba(140,160,255,0.06)',
  frame: '#262c5c', frameHi: '#55639f', glassTop: '#081430', glassBot: '#1f3f73', sky: 'gece',
  stand: '#251f45', standHi: '#3a3268', standD: '#16122e', pic: '#2d2858', picBg: '#232a55', picA: 0.55,
  rod: '#3b3570', curtain: ['#2c2f6e', '#3d4290', '#23255a'], tie: '#6f6ab8',
  bed: '#3a2f63', bedHi: '#54488a', bedD: '#231c42', sheet: '#3f4f8c', sheetHi: '#5a6cb0', sheetD: '#2f3b70', pillow: '#5c6aa8', pillowHi: '#8090cc', pillowD: '#434e86', pillowEdge: '#363f73', pillowSeam: 'rgba(170,185,245,0.55)',
  blanket: '#2e4486', blanketHi: '#4562b0', blanketD: '#1c2c60', star: '#ffe6a8', starA: 0.55,
  rug: '#3a2c66', rugRing: '#5a4796', rugDot: '#8e78d6', amb: 'rgba(30,40,110,0.0)',
};
const SH_SABAH = {
  wallTop: '#fbe9d2', wallBot: '#f0cfae', paper: '#ffffff', paperA: 0.32, base: '#e2b893', baseHi: '#fff1de',
  floorTop: '#d7a57a', floorBot: '#a9744f', seam: 'rgba(120,66,34,0.22)', seamHi: 'rgba(255,240,215,0.25)',
  frame: '#fff7ec', frameHi: '#ffffff', glassTop: '#a9d8ff', glassBot: '#ffe8c8', sky: 'sabah',
  stand: '#e0ae84', standHi: '#f3c9a0', standD: '#b98563', pic: '#e7b07a', picBg: '#fffaf0', picA: 1,
  rod: '#c99a6c', curtain: ['#f7b9c6', '#ffdcae', '#e698ad'], tie: '#ffd27a',
  bed: '#e2a878', bedHi: '#f6c99a', bedD: '#b47c55', sheet: '#f5f2ff', sheetHi: '#ffffff', sheetD: '#ddd6f0', pillow: '#fbf8ff', pillowHi: '#ffffff', pillowD: '#ddd3ee', pillowEdge: '#cbbfe2', pillowSeam: 'rgba(165,140,210,0.5)',
  blanket: '#5b86d8', blanketHi: '#86aaf0', blanketD: '#3d64b4', star: '#ffe08a', starA: 0.95,
  rug: '#e98fae', rugRing: '#f7c0d2', rugDot: '#fff2b0', amb: 'rgba(255,200,140,0.0)',
};

// ── oda yerleşimi (oda birimi) ──
const SH_ZEMIN = 74;                       // duvar/zemin birleşimi
const SH_YER = 84.5;                       // orman fonunda toprağın üst kenarı
const SH_PEN = { x0: 14, x1: 40, ust: 12, alt: 50 };   // pencere
const SH_YATAK = { x0: -48, x1: 3, ust: 60 };
const SH_KOMODIN = { x0: -65, x1: -53, ust: 61 };
const SH_LAMBA = { x: -59, y: 56.2 };
const SH_HALI = { x: 27, y: 88.5, rx: 25, ry: 4.6 };
const SH_AY = { x: 36, y: 19 };            // lamba bu noktaya süzülüp ay olur
const SH_FEZA = { x: -33.5, y: 59.2 };     // yatarken gövde ortası (yatak yüzeyi)
const SH_PIRIL = { x: -32.5, y: 55.2 };    // kollarındaki peluş
// halı desenindeki noktalar (mantar olurlar): [x, y, boy, şapka]
const SH_MANTAR = [[-16, 0.4, 7.5, 3.2], [-8.5, -1.6, 4.6, 2.2], [-1, 1.2, 9.5, 3.8], [6.5, -1.2, 5.4, 2.5], [13.5, 0.8, 7, 3], [19.5, -0.6, 4, 1.9], [-21.5, -0.4, 3.6, 1.7]];
// perde katları: [üst x, alt x kayması, genişlik, sarmaşık boyu]
const SH_KAT = [[0, -1.2, 3.4, 44], [2.6, 0.4, 3.1, 31], [5.0, 1.6, 2.8, 52], [7.2, 2.2, 2.4, 38]];
const SH_YILDIZ = [[-26, 63], [-15, 61.6], [-6, 64.5], [-19, 68.5], [-2, 69.5], [-11, 66.6], [-29, 69]];   // battaniye yıldızları

// ── durum ──
const sh = {
  mod: null, t: 0, bitti: null, tam: false, plan: null, atla: -1, sesler: {}, sonGorunum: false,
  zoom: 1, fx: 0, fy: 0, tx: 0, ty: 0, k0: 1, wu: 133,
  oda: null, odaSabah: null, orman: null, bw: 0, bh: 0,
  parca: [], zz: [], anlar: {},
};

// ── ölçüler & dönüşümler ──
// Ana ekrana eklenen iPad'de durum çubuğu tuvalin üzerine gelebilir. Yalnız seçim ekranının
// başlık/balon katmanı aşağı iner; oda resmi ve oyun içi kamera esnetilmez, kesilmez.
const shSecGuvenli = { kirli: true, ust: 0, alt: 0, asagi: 0 };
function shSecGuvenliOlc() {
  shSecGuvenli.kirli = false;
  let ust = 0, alt = 0;
  if (typeof document !== 'undefined' && document.body) {
    const e = document.createElement('div');
    e.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
    document.body.appendChild(e);
    const css = getComputedStyle(e); ust = parseFloat(css.paddingTop) || 0; alt = parseFloat(css.paddingBottom) || 0;
    e.remove();
  }
  // Aynı ekran oranında masaüstü ve iPad aynı yerleşimi kullanır. Tasarımın 32 CSS piksellik
  // üst boşluğu hep korunur; cihaz daha büyük bir güvenli alan bildirirse onun altına geçilir.
  const pay = Math.max(32, ust + 8);
  shSecGuvenli.ust = ust; shSecGuvenli.alt = alt;
  shSecGuvenli.asagi = Math.min(pay * H / Math.max(1, innerHeight), H * 0.09);
}
function shOlc() {
  if (shSecGuvenli.kirli) shSecGuvenliOlc();
  sh.k0 = H / 100; sh.wu = 100 * W / H;
  // dar (dikey) ekranda oda sağa kayar: yatak tam görünsün (yatay ekranda kayma yok). Bölüm 3 sabahında daha az kayar:
  // pencere (gökkuşağı) de görünsün
  const oxp = clamp((110 - sh.wu) / 35, 0, 1) * ((sh.fBolum || 1) === 3 && (sh.mod === 'final' || sh.sonGorunum) ? 6 : 16) * sh.k0;
  if (sh.bw !== W || sh.bh !== H || Math.abs(oxp - (sh.oxp || 0)) > 0.5) {   // ölçü ya da kayma değişti: önbellekler yeniden
    for (const ad of SH_ONBELLEK) { const v = sh[ad]; sh[ad] = shBirak(v && v.c ? v.c : v); if (shYap[ad]) { shBirak(shYap[ad].c); shYap[ad] = null; } }
    sh.bw = W; sh.bh = H;
  }
  sh.oxp = oxp;
  if (sh.balon && sh.balonK !== W + 'x' + H) { sh.balon = {}; sh.balonK = W + 'x' + H; }
}
function shCX() { return W / 2 + (sh.oxp || 0); }
const shPX = x => W / 2 + (sh.oxp || 0) + x * sh.k0;           // oda birimi → piksel (zoom yok)
const shPY = y => y * sh.k0;
// kamera: odadaki (fx,fy) pikseli ekranda (tx,ty)'ye gelir, zoom kadar büyür; resim ekranı hep kaplar
function shKamera(fx, fy, z, tx, ty) {
  sh.zoom = z; sh.fx = fx; sh.fy = fy;
  sh.tx = clamp(tx, W - (W - fx) * z, fx * z); sh.ty = clamp(ty, H - (H - fy) * z, fy * z);
}
function shOdaT(ctx = g) {                       // oda koordinatı + zoom
  const z = sh.zoom, a = sh.k0 * z;
  ctx.setTransform(a, 0, 0, a, sh.tx + (W / 2 + (sh.oxp || 0) - sh.fx) * z, sh.ty - sh.fy * z + (sh.yDy || 0) * a);   // yDy: yatak grubunu aşağı kaydırma (oda birimi; seçim ekranında rafın altı)
}
function shResimT() { const z = sh.zoom; g.setTransform(z, 0, 0, z, sh.tx - sh.fx * z, sh.ty - sh.fy * z); }
function shEkranX(x) { return sh.tx + (shPX(x) - sh.fx) * sh.zoom; }
function shEkranY(y) { return sh.ty + (shPY(y) - sh.fy) * sh.zoom + (sh.yDy || 0) * sh.k0 * sh.zoom; }
// Seçim ekranında kavanoz rafı yatağın başlığına değmesin: yatak grubu (yatak, Feza, Pırıl, battaniye) rafın altına iner.
// Kayma ekran oranına göre hesaplanır (başlığın topuzu oda y≈40,5; rafın alt kenarı + %2,5 H boşluk), en çok 14 oda birimi.
function shSecimDy() {
  if (typeof shKavYer !== 'function') return 0;
  const K = shKavYer(), alt = K.yp + K.pt + H * 0.025, sx = sh.k0 * sh.zoom, ust = sh.ty + (shPY(40.5) - sh.fy) * sh.zoom;
  return clamp((alt - ust) / sx, 0, 14);
}
function shTuval() { const c = document.createElement('canvas'); c.width = Math.max(2, W); c.height = Math.max(2, H); return c; }
// tuvalin belleğini hemen geri ver (Safari'de çöp toplamayı beklemeden); dönüş null → referansı da bırak
function shBirak(c) { try { if (c && c.width) { c.width = 0; c.height = 0; } } catch (e) {} return null; }

// ── büyük önbellekler parça parça hazırlanır (her adım kısa; kareler arasında, gerekmeden önce) ──
const SH_ONBELLEK = ['oda', 'orman', 'gol', 'bulut', 'deniz', 'denizOyun', 'onPlan', 'onPlanB', 'onPlanI', 'odaSabah', 'odaYakin'];
const SH_KUR = {
  oda: () => shOdaAdim(SH_GECE),
  orman: () => shOrmanAdim(),
  gol: () => shGolAdim(),
  deniz: () => shDenizFonAdim(),
  bulut: () => shBulutFonAdim(),
  onPlanI: () => { const A = { c: null, W, H, adim: [() => { A.c = shDenizOnPlan(); }] }; return A; },
  onPlanB: () => { const A = { c: null, W, H, adim: [() => { A.c = shOnPlanBulutCiz(); }] }; return A; },
  onPlan: () => { const A = { c: null, W, H, adim: [() => { A.c = shOnPlanCiz(); }] }; return A; },
  odaSabah: () => shOdaAdim(SH_SABAH),
  odaYakin: () => shYakinAdim(),
};
const shYap = {};
function shYapAdim(ad) {   // bir adım; bitince true
  let A = shYap[ad];
  if (A && (A.W !== W || A.H !== H)) { shBirak(A.c); A = shYap[ad] = null; }
  if (sh[ad]) return true;
  if (!A) { A = shYap[ad] = SH_KUR[ad](); A.i = 0; }
  A.adim[A.i++]();
  if (A.i >= A.adim.length) { sh[ad] = A.deger || A.c; shYap[ad] = null; return true; }
  return false;
}
function shHazir(ad) { if (!sh[ad]) { shOlc(); while (!shYapAdim(ad)); } return sh[ad]; }   // gerekirse kalanını hemen bitir
let shBoyaX = null;
function shBoya(c) {   // bir kez minicik çiz: tarayıcı tuvali şimdi boyasın (ilk kullanımda takılmasın)
  try { if (!c || !c.width) return; if (!shBoyaX) { const t = document.createElement('canvas'); t.width = t.height = 2; shBoyaX = t.getContext('2d'); } shBoyaX.drawImage(c, 0, 0, 2, 2); } catch (e) {}
}
const shIsQ = []; let shIsZ = 0;
function shOnceden(ad, kosul) { if (sh[ad] || shIsQ.some(q => q.ad === ad)) return; shIsQ.push({ ad, kosul }); if (!shIsZ) shIsZ = setTimeout(shIsCalis, 40); }
function shIsCalis() {
  shIsZ = 0;
  while (shIsQ.length) {
    const q = shIsQ[0];
    if (sh[q.ad] || !q.kosul()) { shIsQ.shift(); continue; }
    if (!(W > 2 && H > 2)) break;
    shOlc();
    let bitti = false;
    try { bitti = shYapAdim(q.ad); } catch (e) { shHata('hazirla:' + q.ad, e); if (shYap[q.ad]) { shBirak(shYap[q.ad].c); shYap[q.ad] = null; } shIsQ.shift(); break; }
    const v = bitti ? sh[q.ad] : shYap[q.ad]; shBoya(v && v.c ? v.c : v);
    if (bitti) shIsQ.shift();
    break;
  }
  if (shIsQ.length) shIsZ = setTimeout(shIsCalis, 40);
}
function shGeceBirak() {   // açılışın üç tam ekran önbelleği (≈67 MB, 2732×2048'de) oyun boyunca tutulmaz
  for (const ad of ['oda', 'orman', 'gol', 'bulut', 'deniz', 'denizOyun', 'onPlan', 'onPlanB', 'onPlanI', 'cadi', 'onPlanC', 'ejderha', 'onPlanE', 'sato', 'onPlanS']) { sh[ad] = shBirak(sh[ad]); if (shYap[ad]) { shBirak(shYap[ad].c); shYap[ad] = null; } }
}

// ── küçük şekiller ──
function shYildiz4(x, cx, cy, r, ince = 0.28) {   // dört köşeli parıltı
  x.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * ince : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  x.closePath();
}
function shYildiz5(x, cx, cy, r) {
  x.beginPath();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.48 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  x.closePath();
}
function shRR(x, x0, y0, w, h, r) {
  x.beginPath(); x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
  x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath();
}
// parıltı sprite'ı (dört köşeli yıldız + hale), bir kez
let shSpark = null;
function shSparkSprite() {
  if (shSpark) return shSpark;
  const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d');
  const gr = x.createRadialGradient(48, 48, 0, 48, 48, 48);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.18, 'rgba(255,240,255,0.35)'); gr.addColorStop(1, 'rgba(255,240,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 96, 96);
  x.fillStyle = '#fff'; shYildiz4(x, 48, 48, 44, 0.09); x.fill();
  return shSpark = c;
}
function shParilti(px, py, r, a) {   // ekran pikseli
  if (a <= 0.01) return;
  g.globalAlpha = Math.min(1, a); g.drawImage(shSparkSprite(), px - r, py - r, r * 2, r * 2); g.globalAlpha = 1;
}

// ══════════════════ ODA (önbelleğe çizilir) ══════════════════
// yak: { sc, ox, oy, w, h } → odanın yalnız bir bölgesi, sc kat çözünürlükle (yakın çekimde bulanık görünmesin)
function shOdaAdim(p, yak) {   // oda önbelleği, parça parça çizilebilen adımlar (her biri kısa)
  const sc = yak ? yak.sc : 1, ox = yak ? yak.ox : 0, oy = yak ? yak.oy : 0;
  const c = yak ? document.createElement('canvas') : shTuval(), x = c.getContext('2d');
  if (yak) { c.width = Math.max(2, Math.ceil(yak.w)); c.height = Math.max(2, Math.ceil(yak.h)); }
  const k = sh.k0, L = -sh.wu / 2 - 19, R = sh.wu / 2 + 19;
  let gr; const A = { c, W, H, adim: [] };
  A.adim.push(() => {
  x.setTransform(k * sc, 0, 0, k * sc, (shCX() - ox) * sc, -oy * sc);
  // duvar
  gr = x.createLinearGradient(0, 0, 0, SH_ZEMIN);
  gr.addColorStop(0, p.wallTop); gr.addColorStop(1, p.wallBot);
  x.fillStyle = gr; x.fillRect(L, -1, R - L, SH_ZEMIN + 1);
  // duvar kâğıdı: küçük yıldızlar ve hilaller (seyrek, ofsetli ızgara)
  x.fillStyle = p.paper; x.globalAlpha = p.paperA;
  for (let row = 0, y = 6; y < SH_ZEMIN - 4; row++, y += 9) {
    for (let xx = L + (row % 2 ? 4.5 : 0); xx < R; xx += 9) {
      if ((Math.round(xx * 7 + y * 3) & 3) === 0) { x.beginPath(); x.arc(xx, y, 1.15, 0.75 * Math.PI, 1.95 * Math.PI, true); x.arc(xx + 0.5, y - 0.4, 0.95, 1.85 * Math.PI, 0.82 * Math.PI, false); x.fill(); }
      else { shYildiz5(x, xx, y, 0.85); x.fill(); }
    }
  }
  x.globalAlpha = 1;
  // boyalı duvar dokusu: büyük, çok silik fırça lekeleri (açık/koyu)
  { const rw = rng(31), gece = p.sky === 'gece';
    for (let i = 0; i < 46; i++) {
      const bx = L + rw() * (R - L), by = rw() * SH_ZEMIN, br = 6 + rw() * 14, acik = rw() < 0.5;
      const rg = x.createRadialGradient(bx, by, 0, bx, by, br);
      const c0 = gece ? (acik ? 'rgba(150,170,255,0.045)' : 'rgba(2,4,24,0.07)') : (acik ? 'rgba(255,255,240,0.14)' : 'rgba(210,140,90,0.07)');
      rg.addColorStop(0, c0); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(bx - br, by - br, br * 2, br * 2);
    }
    // duvarın alt yarısında hafif lambriyi andıran yumuşak şerit
    const lg = x.createLinearGradient(0, SH_ZEMIN - 14, 0, SH_ZEMIN); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(1, gece ? 'rgba(2,4,24,0.28)' : 'rgba(150,90,50,0.14)');
    x.fillStyle = lg; x.fillRect(L, SH_ZEMIN - 14, R - L, 14);
  }
  // pencereden duvara düşen ışık (yumuşak)
  gr = x.createRadialGradient(27, 32, 2, 27, 32, 46);
  gr.addColorStop(0, p.sky === 'gece' ? 'rgba(140,175,255,0.16)' : 'rgba(255,240,205,0.45)'); gr.addColorStop(1, 'rgba(140,175,255,0)');
  x.fillStyle = gr; x.fillRect(L, -1, R - L, SH_ZEMIN + 1);
  });
  A.adim.push(() => {
  x.setTransform(k * sc, 0, 0, k * sc, (shCX() - ox) * sc, -oy * sc);
  // süpürgelik
  x.fillStyle = p.base; x.fillRect(L, SH_ZEMIN - 2.2, R - L, 2.4);
  x.fillStyle = p.baseHi; x.globalAlpha = 0.5; x.fillRect(L, SH_ZEMIN - 2.2, R - L, 0.3); x.globalAlpha = 1;
  // zemin (tahtalar)
  gr = x.createLinearGradient(0, SH_ZEMIN, 0, 100);
  gr.addColorStop(0, p.floorTop); gr.addColorStop(1, p.floorBot);
  x.fillStyle = gr; x.fillRect(L, SH_ZEMIN, R - L, 27);
  const r = rng(7);
  for (let i = 0, y = SH_ZEMIN; y < 101; i++) {
    const h = 3 + i * 1.2;
    x.fillStyle = p.seam; x.fillRect(L, y, R - L, 0.28);
    x.fillStyle = p.seamHi; x.fillRect(L, y + 0.3, R - L, 0.25);
    for (let xx = L + r() * 20; xx < R; xx += 16 + r() * 14) { x.fillStyle = p.seam; x.fillRect(xx, y, 0.25, h); }
    y += h;
  }
  // pencere ışığının zemindeki izi
  gr = x.createRadialGradient(8, 90, 1, 8, 90, 40);
  gr.addColorStop(0, p.sky === 'gece' ? 'rgba(130,170,255,0.10)' : 'rgba(255,225,170,0.4)'); gr.addColorStop(1, 'rgba(130,170,255,0)');
  x.fillStyle = gr; x.save(); x.translate(8, 90); x.scale(1.6, 0.35); x.translate(-8, -90); x.fillRect(-40, 50, 100, 80); x.restore();
  });
  A.adim.push(() => {
  x.setTransform(k * sc, 0, 0, k * sc, (shCX() - ox) * sc, -oy * sc);
  // pencere
  const P0 = SH_PEN, cxw = (P0.x0 + P0.x1) / 2, rw = (P0.x1 - P0.x0) / 2, ya = P0.ust + rw;
  const pencereYolu = (pad) => { x.beginPath(); x.moveTo(P0.x0 - pad, P0.alt + pad); x.lineTo(P0.x0 - pad, ya); x.arc(cxw, ya, rw + pad, Math.PI, 0); x.lineTo(P0.x1 + pad, P0.alt + pad); x.closePath(); };
  pencereYolu(1.6); x.fillStyle = p.frame; x.fill();
  pencereYolu(0);
  gr = x.createLinearGradient(0, P0.ust, 0, P0.alt);
  gr.addColorStop(0, p.glassTop); gr.addColorStop(1, p.glassBot); x.fillStyle = gr; x.fill();
  x.save(); pencereYolu(0); x.clip();
  if (p.sky === 'gece') {
    const rr = rng(3);
    x.fillStyle = '#ffffff';
    for (let i = 0; i < 26; i++) { x.globalAlpha = 0.3 + rr() * 0.6; x.beginPath(); x.arc(P0.x0 + rr() * 26, P0.ust + rr() * 34, 0.16 + rr() * 0.22, 0, 6.283); x.fill(); }
    x.globalAlpha = 1;
    // hilal (uzak, sakin)
    const mg = x.createRadialGradient(33, 21, 0, 33, 21, 9); mg.addColorStop(0, 'rgba(200,220,255,0.35)'); mg.addColorStop(1, 'rgba(200,220,255,0)');
    x.fillStyle = mg; x.fillRect(20, 10, 26, 24);
    x.save(); x.beginPath(); x.arc(33, 21, 2.6, 0, 6.283); x.fillStyle = '#eef3ff'; x.fill(); x.clip();
    const cg = x.createLinearGradient(0, P0.ust, 0, P0.alt); cg.addColorStop(0, p.glassTop); cg.addColorStop(1, p.glassBot);
    x.fillStyle = cg; x.beginPath(); x.arc(34.4, 19.9, 2.25, 0, 6.283); x.fill(); x.restore();
    // ufukta soluk ışık, uzak tepeler, ağaçlar arasında minik ışık noktaları
    { const hg = x.createLinearGradient(0, P0.alt - 18, 0, P0.alt); hg.addColorStop(0, 'rgba(90,120,220,0)'); hg.addColorStop(1, 'rgba(110,140,235,0.4)'); x.fillStyle = hg; x.fillRect(P0.x0, P0.alt - 18, 30, 18);
      x.fillStyle = '#162b60'; x.beginPath(); x.moveTo(P0.x0 - 1, P0.alt); for (let i = 0; i <= 12; i++) x.lineTo(P0.x0 - 1 + i * 2.4, P0.alt - 6 - 3.2 * Math.sin(i * 0.9 + 1) - 2 * Math.sin(i * 2.1)); x.lineTo(P0.x1 + 1, P0.alt); x.fill(); }
    // pencerenin dışında uzak ağaç siluetleri
    x.fillStyle = '#0a1532';
    for (let i = 0; i < 6; i++) { const tx = P0.x0 - 2 + i * 5.5; x.beginPath(); x.arc(tx, P0.alt - 2 + (i % 2) * 1.5, 4 + (i % 3), 0, 6.283); x.fill(); }
    x.fillRect(P0.x0 - 2, P0.alt - 2, 30, 4);
    x.fillStyle = '#d8ff9a'; for (const [fx, fy] of [[17, 46], [21, 44.5], [26, 47], [31, 45], [35, 46.5], [24, 43]]) { x.globalAlpha = 0.85; x.beginPath(); x.arc(fx, fy, 0.22, 0, 6.283); x.fill(); x.globalAlpha = 0.18; x.beginPath(); x.arc(fx, fy, 0.9, 0, 6.283); x.fill(); } x.globalAlpha = 1;
  } else {
    // sabah: yumuşak bulutlar, güneşin parıltısı
    const sg = x.createRadialGradient(36, 18, 0, 36, 18, 16); sg.addColorStop(0, 'rgba(255,250,225,1)'); sg.addColorStop(0.3, 'rgba(255,240,200,0.6)'); sg.addColorStop(1, 'rgba(255,240,200,0)');
    x.fillStyle = sg; x.fillRect(14, 2, 30, 34);
    { const hg = x.createLinearGradient(0, 20, 0, P0.alt); hg.addColorStop(0, 'rgba(255,190,140,0)'); hg.addColorStop(1, 'rgba(255,200,150,0.55)'); x.fillStyle = hg; x.fillRect(P0.x0, 20, 30, 32);
      x.fillStyle = 'rgba(255,170,190,0.45)'; x.beginPath(); x.ellipse(24, 24, 7, 0.9, 0, 0, 6.283); x.ellipse(33, 29, 6, 0.8, 0, 0, 6.283); x.fill();
      x.fillStyle = '#d6ecc4'; x.beginPath(); x.moveTo(P0.x0 - 1, P0.alt); for (let i = 0; i <= 12; i++) x.lineTo(P0.x0 - 1 + i * 2.4, P0.alt - 6 - 3 * Math.sin(i * 0.9 + 1) - 1.8 * Math.sin(i * 2.1)); x.lineTo(P0.x1 + 1, P0.alt); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,0.85)';
    for (const [bx, by, s] of [[20, 27, 1], [30, 36, 1.3], [17, 42, 0.8]]) { x.beginPath(); x.arc(bx, by, 2.2 * s, 0, 6.283); x.arc(bx + 2.6 * s, by - 1 * s, 2.8 * s, 0, 6.283); x.arc(bx + 5.4 * s, by, 2 * s, 0, 6.283); x.rect(bx, by, 5.4 * s, 2 * s); x.fill(); }
    x.fillStyle = '#b8dca0';
    for (let i = 0; i < 6; i++) { const tx = P0.x0 - 2 + i * 5.5; x.beginPath(); x.arc(tx, P0.alt - 1 + (i % 2) * 1.5, 4 + (i % 3), 0, 6.283); x.fill(); }
  }
  x.restore();
  // kayıtlar (pervaz)
  x.fillStyle = p.frame;
  x.fillRect(cxw - 0.6, P0.ust, 1.2, P0.alt - P0.ust); x.fillRect(P0.x0, 31, P0.x1 - P0.x0, 1.2);
  x.strokeStyle = p.frameHi; x.lineWidth = 0.3; x.globalAlpha = 0.6; pencereYolu(1.6); x.stroke(); x.globalAlpha = 1;
  // pencere önü (denizlik)
  x.fillStyle = p.frame; shRR(x, P0.x0 - 3, P0.alt, P0.x1 - P0.x0 + 6, 2.2, 0.6); x.fill();
  x.fillStyle = p.frameHi; x.globalAlpha = 0.5; x.fillRect(P0.x0 - 2.6, P0.alt + 0.1, P0.x1 - P0.x0 + 5.2, 0.35); x.globalAlpha = 1;
  // perde çubuğu
  x.fillStyle = p.rod; x.fillRect(8.5, 8.7, 37, 0.9);
  x.beginPath(); x.arc(8.3, 9.15, 1.1, 0, 6.283); x.arc(45.7, 9.15, 1.1, 0, 6.283); x.fill();
  });
  A.adim.push(() => {
  x.setTransform(k * sc, 0, 0, k * sc, (shCX() - ox) * sc, -oy * sc);
  // duvardaki çocuk resmi: mor ejderha + yıldız (Feza çizmiş)
  const fx0 = -17, fy0 = 21, fw = 14, fh = 11;
  x.fillStyle = p.pic; shRR(x, fx0 - 0.9, fy0 - 0.9, fw + 1.8, fh + 1.8, 0.6); x.fill();
  x.fillStyle = p.picBg; x.fillRect(fx0, fy0, fw, fh);
  x.save(); x.beginPath(); x.rect(fx0, fy0, fw, fh); x.clip();
  x.globalAlpha = p.picA;
  x.fillStyle = '#7bc96f'; x.beginPath(); x.ellipse(fx0 + 7, fy0 + fh + 1, 9, 3.4, 0, 0, 6.283); x.fill();
  // Pırıl (pastel boyayla): lila gövde, kıvrık kuyruk, koyu yeşil taraklı ibik, açık yeşil karın, kulak yüzgeci, yeşil göz
  x.lineCap = 'round'; x.lineJoin = 'round';
  x.strokeStyle = '#b79be8'; x.lineWidth = 1.1;
  x.beginPath(); x.moveTo(fx0 + 4.2, fy0 + 7.6); x.quadraticCurveTo(fx0 + 1.4, fy0 + 8.6, fx0 + 1.8, fy0 + 6.4); x.quadraticCurveTo(fx0 + 2.2, fy0 + 5.2, fx0 + 3.2, fy0 + 5.9); x.stroke();
  x.fillStyle = '#2f8a2c';   // sırt dikenleri + ibik (taraklı)
  for (const [qx, qy, qr] of [[4.6, 5.2, 0.75], [5.9, 4.5, 0.8], [7.4, 2.7, 0.8], [8.6, 2.1, 0.85], [9.8, 2.4, 0.75]]) { x.beginPath(); x.arc(fx0 + qx, fy0 + qy, qr, 0, 6.283); x.fill(); }
  x.fillStyle = '#b79be8'; x.beginPath(); x.ellipse(fx0 + 6.2, fy0 + 7.0, 2.9, 2.2, -0.15, 0, 6.283); x.fill();
  x.beginPath(); x.ellipse(fx0 + 9.0, fy0 + 4.6, 2.0, 1.75, 0.1, 0, 6.283); x.fill();
  x.fillStyle = '#bde43a'; x.beginPath(); x.ellipse(fx0 + 7.2, fy0 + 7.6, 1.3, 1.5, -0.3, 0, 6.283); x.fill();   // karın
  x.strokeStyle = '#93bd28'; x.lineWidth = 0.2; x.beginPath(); x.moveTo(fx0 + 6.4, fy0 + 7.2); x.lineTo(fx0 + 7.9, fy0 + 7.0); x.moveTo(fx0 + 6.4, fy0 + 8.0); x.lineTo(fx0 + 7.9, fy0 + 7.9); x.stroke();
  x.fillStyle = '#bde43a'; x.beginPath(); x.moveTo(fx0 + 8.0, fy0 + 3.6); x.lineTo(fx0 + 7.0, fy0 + 2.9); x.lineTo(fx0 + 7.6, fy0 + 4.4); x.fill();   // kulak yüzgeci
  x.fillStyle = '#4fae37'; x.beginPath(); x.arc(fx0 + 9.6, fy0 + 4.4, 0.6, 0, 6.283); x.fill();
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(fx0 + 9.8, fy0 + 4.2, 0.22, 0, 6.283); x.fill();
  x.beginPath(); x.moveTo(fx0 + 10.1, fy0 + 5.6); x.lineTo(fx0 + 10.3, fy0 + 6.2); x.lineTo(fx0 + 10.5, fy0 + 5.6); x.fill();   // minik diş
  x.fillStyle = '#b79be8'; x.beginPath(); x.ellipse(fx0 + 5.0, fy0 + 9.0, 0.8, 0.5, 0, 0, 6.283); x.ellipse(fx0 + 7.6, fy0 + 9.1, 0.8, 0.5, 0, 0, 6.283); x.fill();
  x.fillStyle = '#ffd34d'; shYildiz5(x, fx0 + 11.6, fy0 + 2.4, 1.5); x.fill();
  x.strokeStyle = '#ff8fb8'; x.lineWidth = 0.35; x.beginPath(); x.moveTo(fx0 + 1.4, fy0 + 2); x.quadraticCurveTo(fx0 + 2.6, fy0 + 0.8, fx0 + 3.4, fy0 + 2.2); x.stroke();
  x.globalAlpha = 1; x.restore();
  // duvar rafı: kitaplar, peluş ayıcık, ışık kavanozu
  { const gece = p.sky === 'gece', sx0 = -53, sx1 = -27, sy = 38;
    x.fillStyle = p.standD; x.beginPath(); x.moveTo(sx0 + 3, sy + 1); x.lineTo(sx0 + 3, sy + 4); x.lineTo(sx0 + 6, sy + 1); x.moveTo(sx1 - 3, sy + 1); x.lineTo(sx1 - 3, sy + 4); x.lineTo(sx1 - 6, sy + 1); x.fill();
    const kt = gece ? ['#4a5fa8', '#7a4f9a', '#3f8a8a', '#a8607a'] : ['#6aa6e8', '#f08ab0', '#7cc9a8', '#ffc86a'];
    const kh = [6.2, 5, 6.8, 4.6]; let kx = sx0 + 1.5;
    for (let i = 0; i < 4; i++) { const w = 1.5 + (i % 2) * 0.4; x.fillStyle = kt[i]; shRR(x, kx, sy - kh[i], w, kh[i], 0.25); x.fill(); x.fillStyle = 'rgba(255,255,255,0.28)'; x.fillRect(kx + 0.25, sy - kh[i] + 0.8, w - 0.5, 0.25); kx += w + 0.15; }
    x.save(); x.translate(kx + 0.5, sy - 5); x.rotate(0.28); x.fillStyle = kt[1]; shRR(x, 0, 0, 1.5, 5, 0.25); x.fill(); x.restore();
    const bx = sx0 + 17, by = sy;   // ayıcık
    x.fillStyle = gece ? '#9a7a6a' : '#d9a273'; x.beginPath(); x.ellipse(bx, by - 2.2, 2.3, 2.4, 0, 0, 6.283); x.fill(); x.beginPath(); x.arc(bx, by - 5.4, 1.9, 0, 6.283); x.fill();
    x.beginPath(); x.arc(bx - 1.4, by - 7, 0.7, 0, 6.283); x.arc(bx + 1.4, by - 7, 0.7, 0, 6.283); x.fill();
    x.fillStyle = gece ? '#c8a898' : '#f3d2b0'; x.beginPath(); x.ellipse(bx, by - 4.9, 0.9, 0.7, 0, 0, 6.283); x.ellipse(bx, by - 2.0, 1.3, 1.5, 0, 0, 6.283); x.fill();
    x.fillStyle = '#2b1a14'; x.beginPath(); x.arc(bx - 0.7, by - 5.7, 0.2, 0, 6.283); x.arc(bx + 0.7, by - 5.7, 0.2, 0, 6.283); x.arc(bx, by - 5.2, 0.28, 0, 6.283); x.fill();
    const jx = sx1 - 4.5;   // kavanoz
    x.fillStyle = gece ? 'rgba(180,200,255,0.2)' : 'rgba(255,255,255,0.35)'; shRR(x, jx - 1.6, by - 4.4, 3.2, 4.4, 0.8); x.fill();
    x.strokeStyle = gece ? 'rgba(190,210,255,0.55)' : 'rgba(255,255,255,0.8)'; x.lineWidth = 0.18; shRR(x, jx - 1.6, by - 4.4, 3.2, 4.4, 0.8); x.stroke();
    x.fillStyle = p.standHi; x.fillRect(jx - 1.3, by - 5, 2.6, 0.7);
    if (gece) { const jg = x.createRadialGradient(jx, by - 2.4, 0, jx, by - 2.4, 5); jg.addColorStop(0, 'rgba(220,255,160,0.55)'); jg.addColorStop(1, 'rgba(220,255,160,0)'); x.fillStyle = jg; x.fillRect(jx - 5, by - 7.4, 10, 10); x.fillStyle = '#e8ffb0'; for (const [dx, dy] of [[-0.6, -3.4], [0.5, -2.2], [-0.2, -1.2]]) { x.beginPath(); x.arc(jx + dx, by + dy, 0.2, 0, 6.283); x.fill(); } }
    x.fillStyle = p.stand; shRR(x, sx0, sy, sx1 - sx0, 1.3, 0.35); x.fill();
    x.fillStyle = p.standHi; x.globalAlpha = 0.6; x.fillRect(sx0 + 0.3, sy + 0.1, sx1 - sx0 - 0.6, 0.3); x.globalAlpha = 1;
  }
  // komodin
  const K = SH_KOMODIN;
  x.fillStyle = p.standD; x.fillRect(K.x0 + 0.8, K.ust + 2, 0.9, SH_ZEMIN + 4 - K.ust); x.fillRect(K.x1 - 1.7, K.ust + 2, 0.9, SH_ZEMIN + 4 - K.ust);
  x.fillStyle = p.stand; shRR(x, K.x0, K.ust, K.x1 - K.x0, 10, 0.8); x.fill();
  x.fillStyle = p.standHi; shRR(x, K.x0 - 0.6, K.ust - 0.6, K.x1 - K.x0 + 1.2, 1.6, 0.6); x.fill();
  x.fillStyle = p.standD; x.globalAlpha = 0.6; shRR(x, K.x0 + 1.2, K.ust + 3, K.x1 - K.x0 - 2.4, 5.2, 0.5); x.fill(); x.globalAlpha = 1;
  x.fillStyle = p.standHi; x.beginPath(); x.arc((K.x0 + K.x1) / 2, K.ust + 5.6, 0.55, 0, 6.283); x.fill();
  // komodinin üstünde küçük bir kitap
  x.fillStyle = p.sky === 'gece' ? '#3c4f8a' : '#7fb3e8'; shRR(x, K.x0 + 6.4, K.ust - 1.6, 4.4, 1.1, 0.25); x.fill();
  x.fillStyle = p.sky === 'gece' ? '#6b3f7a' : '#f59ab8'; shRR(x, K.x0 + 6.8, K.ust - 2.6, 3.8, 1.0, 0.25); x.fill();
  // köşelerde yumuşak gölge (vinyet)
  x.setTransform(sc, 0, 0, sc, -ox * sc, -oy * sc);
  gr = x.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, Math.hypot(W, H) * 0.62);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, p.sky === 'gece' ? 'rgba(2,3,14,0.6)' : 'rgba(120,60,30,0.22)');
  x.fillStyle = gr; x.fillRect(0, 0, W, H);
  });
  return A;
}
function shOdaCiz(p, yak) { const A = shOdaAdim(p, yak); for (const f of A.adim) f(); return A.c; }

// ══════════════════ ORMAN FONU (önbelleğe) – oyunun gece paletiyle ══════════════════
function shOrmanAdim() {
  const c = shTuval(), x = c.getContext('2d');
  const k = sh.k0, L = -sh.wu / 2 - 20, R = sh.wu / 2 + 20;
  let gr; const A = { c, W, H, adim: [] };
  A.adim.push(() => {
  x.setTransform(k, 0, 0, k, shCX(), 0);
  gr = x.createLinearGradient(0, 0, 0, 82);
  gr.addColorStop(0, '#060b1e'); gr.addColorStop(0.45, '#10204a'); gr.addColorStop(0.85, '#1d4470'); gr.addColorStop(1, '#1d4470');
  x.fillStyle = gr; x.fillRect(L, -1, R - L, 102);
  const r = rng(11);
  x.fillStyle = '#ffffff';
  for (let i = 0; i < 70; i++) { x.globalAlpha = 0.15 + r() * 0.5; x.beginPath(); x.arc(L + r() * (R - L), r() * 45, 0.12 + r() * 0.2, 0, 6.283); x.fill(); }
  x.globalAlpha = 1;
  // ay ışığının sise saçılması
  gr = x.createRadialGradient(SH_AY.x, SH_AY.y, 0, SH_AY.x, SH_AY.y, 70);
  gr.addColorStop(0, 'rgba(150,200,255,0.30)'); gr.addColorStop(0.4, 'rgba(110,160,230,0.12)'); gr.addColorStop(1, 'rgba(110,160,230,0)');
  x.fillStyle = gr; x.fillRect(L, -1, R - L, 102);
  // uzak tepe ve ağaç siluetleri (katmanlar)
  const katman = (col, y0, n, hMin, hMax, tw, cr, seed, al) => {
    const q = rng(seed); x.fillStyle = col; x.globalAlpha = al;
    for (let i = 0; i < n; i++) {
      const tx = L + (i + q() * 0.6) * (R - L) / n, top = y0 - hMin - q() * (hMax - hMin);
      x.fillRect(tx - tw / 2, top, tw, 100 - top);
      const rr = cr * (0.7 + q() * 0.6);
      x.beginPath(); x.ellipse(tx, top, rr, rr * (1.1 + q() * 0.5), 0, 0, 6.283); x.fill();
      if (q() < 0.6) { x.beginPath(); x.ellipse(tx + rr * 0.7, top + rr * 0.6, rr * 0.7, rr * 0.8, 0, 0, 6.283); x.fill(); }
    }
    x.globalAlpha = 1;
  };
  katman('#13284c', 80, 16, 18, 32, 1.1, 7, 21, 0.9);
  gr = x.createLinearGradient(0, 50, 0, 82); gr.addColorStop(0, 'rgba(42,90,138,0)'); gr.addColorStop(1, 'rgba(42,90,138,0.35)');
  x.fillStyle = gr; x.fillRect(L, 50, R - L, 32);
  katman('#0f2244', 82, 10, 24, 46, 2, 9, 33, 1);
  gr = x.createLinearGradient(0, 60, 0, 84); gr.addColorStop(0, 'rgba(42,90,138,0)'); gr.addColorStop(1, 'rgba(60,120,170,0.28)');
  x.fillStyle = gr; x.fillRect(L, 60, R - L, 24);
  });
  A.adim.push(() => {
  x.setTransform(k, 0, 0, k, shCX(), 0);
  // yakın gövdeler (kenarlarda) ve tepe yaprakları
  x.fillStyle = '#081530';
  for (const [tx, w] of [[L + 6, 7], [R - 9, 9], [L + 24, 3.2], [R - 30, 3.6]]) {
    x.beginPath(); x.moveTo(tx - w / 2, -2); x.bezierCurveTo(tx - w / 2 - 1, 40, tx - w / 2 + 1, 70, tx - w, 86); x.lineTo(tx + w, 86);
    x.bezierCurveTo(tx + w / 2 - 1, 70, tx + w / 2 + 1, 40, tx + w / 2, -2); x.fill();
  }
  x.fillStyle = '#060f26';
  for (let i = 0, xx = L; xx < R; i++) { const rr = 7 + ((i * 37) % 9); x.beginPath(); x.ellipse(xx, -3 + ((i * 13) % 5), rr * 1.3, rr, 0, 0, 6.283); x.fill(); xx += rr * 1.5; }
  // zemin: koyu toprak, camgöbeği kenar ışığı (oyundaki gibi)
  const zemin = (yy) => SH_YER + Math.sin(yy * 0.09) * 1.2 + Math.sin(yy * 0.23 + 1) * 0.6;
  x.beginPath(); x.moveTo(L, 102);
  for (let xx = L; xx <= R; xx += 1.5) x.lineTo(xx, zemin(xx));
  x.lineTo(R, 102); x.closePath();
  x.fillStyle = '#03060f'; x.fill();
  x.save(); x.clip();
  gr = x.createLinearGradient(0, SH_YER - 2, 0, 100); gr.addColorStop(0, 'rgba(40,90,140,0.25)'); gr.addColorStop(0.3, 'rgba(10,20,40,0)'); x.fillStyle = gr; x.fillRect(L, 76, R - L, 26);
  x.restore();
  x.lineCap = 'round';
  for (const [lw, al] of [[1.6, 0.12], [0.8, 0.25], [0.32, 0.9]]) {
    x.strokeStyle = `rgba(127,232,255,${al})`; x.lineWidth = lw; x.beginPath();
    for (let xx = L; xx <= R; xx += 1.5) x.lineTo(xx, zemin(xx) + 0.1); x.stroke();
  }
  // ot uçları
  const q = rng(5); x.strokeStyle = '#0a1830'; x.lineWidth = 0.35;
  for (let xx = L; xx < R; xx += 0.9 + q() * 1.4) { const h = 0.8 + q() * 1.8, y0 = zemin(xx); x.beginPath(); x.moveTo(xx, y0 + 0.4); x.quadraticCurveTo(xx + 0.3, y0 - h * 0.6, xx + (q() - 0.5) * 1.2, y0 - h); x.stroke(); }
  x.setTransform(1, 0, 0, 1, 0, 0);
  gr = x.createRadialGradient(W / 2, H * 0.5, H * 0.4, W / 2, H * 0.5, Math.hypot(W, H) * 0.62);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(1,3,12,0.55)');
  x.fillStyle = gr; x.fillRect(0, 0, W, H);
  });
  return A;
}
function shOrmanCiz() { const A = shOrmanAdim(); for (const f of A.adim) f(); return A.c; }

// ══════════════════ KARAKTERLER ══════════════════
// x, y oda birimi; olc = oyundaki boya göre ölçek (1 = oyundaki boy)
// kucakPoz: Feza'nın kollarının arasına çizilecek Pırıl pozu (null = boş kucak). Dönüş: kucak noktası (oda birimi).
const shKucak = { x: SH_PIRIL.x, y: SH_PIRIL.y, px: SH_PIRIL.x, py: SH_PIRIL.y };   // px,py: peluşun çizildiği yer
// kucaktaki peluşun kucak noktasına göre yeri (oyun birimi) ve boyu: yüzü Feza'nın yanağına binmesin, kolların arasında dursun
const SH_KUC = { dx: 4, dy: -7, s: 0.86 };   // peluş boyu: Feza'nın başı kadar (1.18 yatak ölçeğinde); hiçbir durumda bundan büyümez
const SH_KUC_OTUR = { dx: 4, dy: 11, s: 0.82 };   // otururken: kucağında, başı çenesinin altında kalır (yüzü örtülmesin)
const SH_KUC_OTUR8 = { dx: 16, dy: 4, s: 0.8 };   // Bölüm 8 sabahı: peluş biraz yana oturur, cadı şapkası Feza'nın yüzünün yanında görünür
const SH_KUC_KIRP = { dx: 27, dy: -14, s: 0.9 };   // sabah göz kırpma: Feza onu yanağının yanına kaldırır (bütün başı görünür)
const shKucOfs = { dx: 0, dy: 0, s: 1 };
// pozTm: pozun kendi zamanı (uyanis için); verilmezse tm.
function shFeza(x, y, olc, poz, tm, kucakPoz, kucakU, kucakTm, pozTm) {
  const pxu = sh.k0 * sh.zoom;
  if (typeof fezaCizPoz === 'function') {
    g.save(); const px = shEkranX(x), py = shEkranY(y);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const pirilVar = kucakPoz && typeof pirilCizPoz === 'function';
    // yatış → oturuş ('uyanis' 0.5–1.1 sn) arasında peluşun yeri de yumuşakça değişir
    const ptm = pozTm == null ? tm : pozTm, otur = poz === 'uyanis' ? shEase(shSeg(ptm, 0.45, 1.15)) : poz === 'sarilma' ? 1 : 0;
    const KO = typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 8 && sh.mod !== 'giris' ? SH_KUC_OTUR8 : SH_KUC_OTUR;   // Bölüm 8 sabahı: şapkası Feza'nın başının arkasında kalmasın
    shKucOfs.dx = lerp(SH_KUC.dx, KO.dx, otur); shKucOfs.dy = lerp(SH_KUC.dy, KO.dy, otur); shKucOfs.s = lerp(SH_KUC.s, KO.s, otur);
    const kk = sh.kirpK || 0;
    if (kk > 0) { shKucOfs.dx = lerp(shKucOfs.dx, SH_KUC_KIRP.dx, kk); shKucOfs.dy = lerp(shKucOfs.dy, SH_KUC_KIRP.dy, kk) - Math.sin(kk * Math.PI) * 3; shKucOfs.s = lerp(shKucOfs.s, SH_KUC_KIRP.s, kk); }
    shKucOfs.s = Math.min(shKucOfs.s, 0.92);   // üst sınır: peluş asla Feza'dan büyük görünmesin
    const ara = pirilVar ? (c, kx, ky, o) => {
      sh.prEk = { x: kx + shKucOfs.dx * o, y: ky + shKucOfs.dy * o, s: o * shKucOfs.s };   // Pırıl'ın ekrandaki yeri (göz kırpma parıltısı için)
      if (sh.tema === 'ejderha' && sh.mod === 'giris' && c.getTransform) sh.prM = c.getTransform();   // Bölüm 9: gözlerin parlaması için (yalnız girişte)
      if (pirilVar) try { pirilCizPoz(c, sh.prEk.x, sh.prEk.y, sh.prEk.s, kucakPoz, kucakTm == null ? tm : kucakTm, kucakU); } catch (e) { shHata('pirilCizPoz', e); }
    } : null;
    const k8 = typeof V8 !== 'undefined' && V8 ? V8.kostum : null;   // Bölüm 8: kostüm rüyada kalır, odada (akşam ve sabah) pijamalı
    if (k8) V8.kostum = null;
    try {
      const k = fezaCizPoz(g, px, py, olc * S * sh.zoom, poz, pozTm == null ? tm : pozTm, ara, sh.fzOpt || undefined);
      if (k) { shKucak.x = (k.x - shEkranX(0)) / pxu; shKucak.y = (k.y - shEkranY(0)) / pxu; const o = olc * S / sh.k0; shKucak.px = shKucak.x + shKucOfs.dx * o; shKucak.py = shKucak.y + shKucOfs.dy * o; }
    } catch (e) { shHata('fezaCizPoz', e); }
    if (k8) V8.kostum = k8;
    g.restore(); return;
  }
  shFezaYedek(x, y, olc * 100 / VH, poz, pozTm == null ? tm : pozTm);
  if (kucakPoz) shPiril(SH_PIRIL.x, SH_PIRIL.y, olc * 0.92, kucakPoz, tm, 1, kucakU);
}
function shPiril(x, y, olc, poz, tm, f = 1, u) {
  if (typeof pirilCizPoz === 'function') {
    g.save(); const px = shEkranX(x), py = shEkranY(y);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (f < 0) { g.translate(px, 0); g.scale(-1, 1); g.translate(-px, 0); }
    try { pirilCizPoz(g, px, py, olc * S * sh.zoom, poz, tm, u); } catch (e) { shHata('pirilCizPoz', e); }
    g.restore(); return;
  }
  shPirilYedek(x, y, olc * 100 / VH, poz, tm, f);
}
// feza.js bu pozu biliyor mu? (bilinmeyen poz 'ayakta' çizilir; o yüzden kaynak metninde poz adı aranır, bir kez)
const shPozlar = {};
function shPozVar(p) {
  if (shPozlar[p] === undefined) { try { shPozlar[p] = typeof fezaCizPoz === 'function' && String(fezaCizPoz).indexOf("'" + p + "'") >= 0; } catch (e) { shPozlar[p] = false; } }
  return shPozlar[p];
}
const shHatalar = {};
function shHata(ad, e) { if (!shHatalar[ad]) { shHatalar[ad] = 1; console.warn('[sahne] ' + ad, e); } }
// yer tutucular (gerçek pozlar gelene kadar): oda biriminde, s = oyun birimi başına oda birimi
function shFezaYedek(x, y, s, poz, tm) {
  shOdaT(); g.save(); g.translate(x, y); g.scale(s, s);
  if (poz === 'uyku') {
    g.fillStyle = '#e9e2d4'; g.beginPath(); g.ellipse(4, -10, 30, 10, 0, 0, 6.283); g.fill();          // pijama
    g.fillStyle = '#f8d5bc'; g.beginPath(); g.arc(-34, -16, 14, 0, 6.283); g.fill();                // baş
    g.fillStyle = '#4a2e1c'; g.beginPath(); g.arc(-36, -20, 14.5, Math.PI * 0.95, Math.PI * 2.15); g.fill();
    g.strokeStyle = '#26150b'; g.lineWidth = 1.6; g.beginPath(); g.arc(-29, -15, 3.2, 0.3, 2.8); g.stroke();
    g.fillStyle = 'rgba(240,140,140,0.5)'; g.beginPath(); g.arc(-27, -10, 3, 0, 6.283); g.fill();
    g.fillStyle = '#f8d5bc'; g.beginPath(); g.ellipse(-12, -16, 9, 4, -0.3, 0, 6.283); g.fill();     // kol
  } else {
    g.fillStyle = '#e9e2d4'; g.beginPath(); g.ellipse(0, -22, 13, 22, 0, 0, 6.283); g.fill();
    g.fillStyle = '#f8d5bc'; g.beginPath(); g.arc(0, -52, 14, 0, 6.283); g.fill();
    g.fillStyle = '#4a2e1c'; g.beginPath(); g.arc(-1, -56, 14.5, Math.PI * 0.95, Math.PI * 2.1); g.fill();
    const ov = Math.sin(tm * 6) * 2;
    g.fillStyle = '#f8d5bc'; g.beginPath(); g.ellipse(8 + ov, -50, 5, 4, 0, 0, 6.283); g.fill();
    g.strokeStyle = '#26150b'; g.lineWidth = 1.6; g.beginPath(); g.arc(-5, -52, 2.6, 3.4, 6); g.stroke();
    g.strokeStyle = '#b05a48'; g.beginPath(); g.arc(0, -46, 3.5, 0.3, 2.8); g.stroke();
  }
  g.restore();
}
function shPirilYedek(x, y, s, poz, tm, f) {
  shOdaT(); g.save(); g.translate(x, y); g.scale(s * f, s);
  if (poz === 'ucus') g.translate(0, Math.sin(tm * 3) * 2);
  g.fillStyle = '#8550ee'; g.beginPath(); g.ellipse(0, 0, 13, 10, 0, 0, 6.283); g.fill();
  g.beginPath(); g.arc(11, -9, 9, 0, 6.283); g.fill();
  g.fillStyle = '#ecdcff'; g.beginPath(); g.ellipse(2, 3, 7, 5, 0, 0, 6.283); g.fill();
  g.fillStyle = '#a77cff'; const fl = poz === 'ucus' ? Math.sin(tm * 12) * 0.5 : 0;
  g.beginPath(); g.moveTo(-2, -6); g.lineTo(-12, -20 - fl * 8); g.lineTo(-14, -6); g.closePath(); g.fill();
  g.fillStyle = '#fff1d6'; g.beginPath(); g.moveTo(9, -16); g.lineTo(8, -22); g.lineTo(12, -17); g.fill();
  const acik = poz === 'uyaniyor' || poz === 'ucus';
  g.strokeStyle = '#2b1450'; g.lineWidth = 1.5;
  if (acik) { g.fillStyle = '#2b1450'; g.beginPath(); g.arc(14, -10, 2.4, 0, 6.283); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(14.8, -11, 0.8, 0, 6.283); g.fill(); }
  else { g.beginPath(); g.arc(14, -10, 2.2, 0.2, 2.9); g.stroke(); }
  g.restore();
}

// ══════════════════ DEĞİŞEN PARÇALAR ══════════════════
// perdeler → sarmaşıklar (c: 0 perde, 1 sarmaşık)
function shPerdeler(p, c, tm, acik) {
  shOdaT();
  const gece0 = p.sky === 'gece', bu = sh.tema === 'bulut' && c > 0, gl = sh.tema === 'gol' && c > 0;
  for (const yon of [-1, 1]) {
    const kenar = yon < 0 ? SH_PEN.x0 - 4.5 : SH_PEN.x1 + 4.5;
    for (let i = 0; i < SH_KAT.length; i++) {
      const [ux, ak, w0, boy] = SH_KAT[i];
      const yayil = lerp(1, 2.6, c) + (acik || 0) * 0.5;
      const tx = kenar - yon * ux * 0.55 * yayil + yon * c * (i - 1.5) * 1.2 + (acik ? -yon * 1.5 * acik : 0);
      const ust = bu ? lerp(9.6, 13 + (i % 2) * 2 - i * 1.2, shEase(c)) : lerp(9.6, -4 - (i % 2) * 3, shEase(c));
      const alt = bu ? lerp(58 + (i % 2) * 0.8, 27 + (i % 2) * 3 + i * 1.5, shEase(c)) : lerp(58 + (i % 2) * 0.8, ust + boy * 0.9, shEase(c));
      const w = bu ? lerp(w0, w0 * 1.5, shEase(c)) : lerp(w0, 0.75, shEase(c));
      const salin = Math.sin(tm * (0.7 + i * 0.13) + i * 1.7 + yon) * (0.35 + c * 1.6);
      const bx = tx + ak * yon * (1 - c) * 0.6 + salin, mx = (tx + bx) / 2 + salin * 0.4;
      // bağlama (tie-back) etkisi: gece kapalıya yakın, sabah biraz açık
      const bel = lerp(0, -yon * 1.4, (1 - c) * (acik || 0));
      const ort = (ust + alt) / 2;
      const col = shMix(p.curtain[i % 2], bu ? '#ffd3e3' : gl ? '#2a3a8a' : '#1e5b54', c), colD = shMix(p.curtain[2], bu ? '#f0a8c4' : gl ? '#141d52' : '#0e3330', c);
      g.beginPath();
      g.moveTo(tx - w / 2, ust);
      g.quadraticCurveTo(mx - w / 2 + bel, ort, bx - w / 2, alt);
      // etek: küçük dalgalı kıvrım
      g.quadraticCurveTo(bx, alt + 0.9 * (1 - c) + 0.3, bx + w / 2, alt);
      g.quadraticCurveTo(mx + w / 2 + bel, ort, tx + w / 2, ust);
      g.closePath();
      const gr = g.createLinearGradient(tx - w / 2, 0, tx + w / 2, 0);
      gr.addColorStop(0, colD); gr.addColorStop(0.28, col); gr.addColorStop(0.5, c > 0.5 ? col : shMix(p.curtain[i % 2], '#ffffff', 0.16 * (1 - c))); gr.addColorStop(0.72, col); gr.addColorStop(1, colD);
      g.globalAlpha = lerp(gece0 ? 0.84 : 0.8, 1, c) * (bu ? 1 - shSeg(c, 0.35, 0.8) : 1); g.fillStyle = gr; g.fill(); g.globalAlpha = 1;
      if (c < 0.6) {   // kıvrım gölgeleri, etek bandı, pencereye bakan kenarda ay/güneş ışığı geçişi
        const va = 1 - c / 0.6;
        g.save(); g.clip(); g.lineCap = 'round';
        for (const kk of [-0.24, 0.2]) {
          g.strokeStyle = colD; g.lineWidth = 0.2; g.globalAlpha = 0.4 * va; g.beginPath(); g.moveTo(tx + w * kk, ust); g.quadraticCurveTo(mx + w * kk + bel, ort, bx + w * kk, alt); g.stroke();
          g.strokeStyle = '#ffffff'; g.lineWidth = 0.14; g.globalAlpha = (gece0 ? 0.1 : 0.24) * va; g.beginPath(); g.moveTo(tx + w * (kk + 0.1), ust); g.quadraticCurveTo(mx + w * (kk + 0.1) + bel, ort, bx + w * (kk + 0.1), alt); g.stroke();
        }
        g.globalAlpha = 0.34 * va; g.fillStyle = colD; g.fillRect(bx - w, alt - 1.5, w * 2, 2);
        g.globalAlpha = 0.6 * va; g.fillStyle = p.tie; g.fillRect(bx - w, alt - 1.55, w * 2, 0.16);
        const lg = g.createLinearGradient(tx - w / 2, 0, tx + w / 2, 0), kp = yon < 0 ? 1 : 0;
        lg.addColorStop(kp, gece0 ? 'rgba(170,200,255,0.34)' : 'rgba(255,238,190,0.5)'); lg.addColorStop(1 - kp, 'rgba(255,255,255,0)');
        g.globalAlpha = va; g.fillStyle = lg; g.fillRect(tx - w, ust, w * 2 + 2, alt - ust + 2);
        g.restore(); g.globalAlpha = 1;
        // çubuğa takılı halkalar
        g.strokeStyle = p.rod; g.lineWidth = 0.28; g.globalAlpha = va; g.beginPath(); g.arc(tx - w * 0.22, ust - 0.1, 0.55, 0, 6.283); g.stroke(); g.beginPath(); g.arc(tx + w * 0.22, ust - 0.1, 0.55, 0, 6.283); g.stroke(); g.globalAlpha = 1;
      }
      if (bu && c > 0.12) {   // perde kumaşı kabarık pembe bulutlara dönüşür (üç katman: gölge, gövde, ışık)
        const lc = shEase(shSeg(c, 0.12, 0.9)), n = 5;
        for (let ps = 0; ps < 3; ps++) {
          g.fillStyle = ps === 0 ? '#e7a0c2' : ps === 1 ? '#ffd8e6' : '#fff4f2'; g.globalAlpha = ps === 2 ? 0.7 : 0.97; g.beginPath();
          for (let j = 0; j < n; j++) {
            const tt = j / (n - 1), yy0 = lerp(ust, alt, tt) - c * 2.5 * (1 - tt) + Math.sin(tm * 0.5 + j + i) * 0.3 * c;
            const xx0 = lerp(lerp(tx, mx + bel, tt), lerp(mx + bel, bx, tt), tt) + yon * (tt * 6 + i * 1.2) * shEase(c) + Math.sin(tm * 0.4 + j * 1.3 + i) * 0.6 * c;   // bulut aşağıda dışa doğru kabarır
            const rr = (2.2 + ((i + j) % 3) * 0.7) * lc * (1.3 - 0.5 * Math.abs(tt - 0.4)) * (ps === 2 ? 0.55 : 1);
            const xx = xx0 + (ps === 2 ? -rr * 0.3 : 0), yy = yy0 + (ps === 0 ? rr * 0.22 : ps === 2 ? -rr * 0.5 : -rr * 0.05);
            g.moveTo(xx + rr, yy); g.arc(xx, yy, rr, 0, 6.283);
          }
          g.fill();
        }
        g.globalAlpha = 1;
      }
      // sarmaşık yaprakları
      if (c > 0.25 && !bu) {
        const lc = shSeg(c, 0.25, 1), n = Math.floor((alt - ust) / 4.2);
        for (let j = 1; j <= n; j++) {
          const tt = j / (n + 0.6), yy = lerp(ust, alt, tt);
          const xx = lerp(lerp(tx, mx + bel, tt), lerp(mx + bel, bx, tt), tt);
          const sc = lc * shEase(clamp(lc * 1.6 - tt * 0.6, 0, 1)) * (0.8 + ((i + j) % 3) * 0.15);
          if (sc < 0.05) continue;
          const sag = (i + j) % 2 ? 1 : -1, a = sag * (0.7 + Math.sin(tm * 1.3 + j + i) * 0.12);
          g.save(); g.translate(xx, yy); g.rotate(a); g.scale(sc, sc);
          if (gl) { g.fillStyle = j % 3 ? '#ffe9a8' : '#cfe0ff'; g.globalAlpha = 0.6 + 0.4 * Math.sin(tm * 2.3 + i * 1.3 + j * 2.1); shYildiz4(g, 1.4 * sag, 0, 1.05, 0.3); g.fill(); g.globalAlpha = 1; }   // yıldız damlaları
          else {
          g.fillStyle = j % 3 ? '#2c7a6a' : '#3b9a7e';
          g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(1.6 * sag, -0.9, 3.2 * sag, 0); g.quadraticCurveTo(1.6 * sag, 0.9, 0, 0); g.fill();
          }
          g.restore();
        }
      }
    }
  }
  if (c < 0.4) {   // tutma bağı: kumaşı belinden toplar; duvarda altın kanca, altında püskül
    shOdaT(); const va = 1 - c / 0.4, ac = acik || 0;
    for (const yon of [-1, 1]) {
      const kenar = yon < 0 ? SH_PEN.x0 - 4.5 : SH_PEN.x1 + 4.5, cx = kenar - yon * (2 + 0.7 * ac), hw = 3.3 - ac * 0.7, yb = 33.6;
      g.globalAlpha = va;
      g.fillStyle = p.tie; shRR(g, cx - hw, yb, hw * 2, 1.15, 0.5); g.fill();
      g.fillStyle = '#ffffff'; g.globalAlpha = va * 0.45; g.fillRect(cx - hw + 0.4, yb + 0.15, hw * 2 - 0.8, 0.22); g.globalAlpha = va;
      g.strokeStyle = p.rod; g.lineWidth = 0.28; g.beginPath(); g.arc(cx + yon * (hw + 0.55), yb + 0.58, 0.6, 0, 6.283); g.stroke();
      const tx2 = cx - yon * (hw - 0.4);   // püskül
      g.strokeStyle = p.tie; g.lineWidth = 0.2; g.beginPath(); g.moveTo(tx2, yb + 1.1); g.lineTo(tx2, yb + 2.4); g.stroke();
      g.fillStyle = p.tie; g.beginPath(); g.arc(tx2, yb + 2.7, 0.45, 0, 6.283); g.fill(); g.beginPath(); g.moveTo(tx2 - 0.45, yb + 2.9); g.lineTo(tx2 + 0.45, yb + 2.9); g.lineTo(tx2 + 0.3, yb + 4.2); g.lineTo(tx2 - 0.3, yb + 4.2); g.fill();
      g.globalAlpha = 1;
    }
  }
  // sarmaşık uçlarında ışıklı tomurcuklar
  if (c > 0.5 && !bu) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
    const a = shSeg(c, 0.5, 1);
    for (const yon of [-1, 1]) {
      const kenar = yon < 0 ? SH_PEN.x0 - 4.5 : SH_PEN.x1 + 4.5;
      for (let i = 0; i < SH_KAT.length; i++) {
        const [ux, , , boy] = SH_KAT[i], yayil = 2.6;
        const tx = kenar - yon * ux * 0.55 * yayil + yon * (i - 1.5) * 1.2 + Math.sin(tm * (0.7 + i * 0.13) + i * 1.7 + yon) * 1.9;
        const alt = -4 - (i % 2) * 3 + boy * 0.9;
        const px = shEkranX(tx), py = shEkranY(alt), r = sh.k0 * sh.zoom;
        dglow(gl ? '#ffe39a' : '#7fe8ff', px, py + r * 0.8, r * 3.5, a * (0.55 + 0.2 * Math.sin(tm * 2 + i)));
        dglow('#ffffff', px, py + r * 0.8, r * 0.9, a * 0.7);
      }
    }
    g.globalCompositeOperation = 'source-over';
  }
}

// ahşap tahta (oda biriminde): yuvarlak köşe, yanal ışık-gölge, boyalı damar, ince kenar; mod 1/2: başlık/ayak (damar dikey)
function shAhsap(x0, y0, w, h, r, p, mod) {
  const fa = g.globalAlpha;
  shRR(g, x0, y0, w, h, r);
  const gr = g.createLinearGradient(x0, 0, x0 + w, 0);
  gr.addColorStop(0, p.bedD); gr.addColorStop(0.12, p.bed); gr.addColorStop(0.35, p.bedHi); gr.addColorStop(0.6, p.bed); gr.addColorStop(1, p.bedD);
  g.fillStyle = gr; g.fill();
  g.save(); shRR(g, x0, y0, w, h, r); g.clip();
  g.lineCap = 'round'; g.strokeStyle = p.bedD; g.lineWidth = 0.13; g.globalAlpha = fa * 0.38;
  for (let i = 1; i < 6; i++) { const gx = x0 + w * i / 6 + (mod * 0.13); g.beginPath(); g.moveTo(gx, y0); for (let t = 0; t <= 1.001; t += 0.1) g.lineTo(gx + Math.sin(t * 5 + i * 2.3 + mod) * 0.22, y0 + h * t); g.stroke(); }
  g.strokeStyle = p.bedHi; g.globalAlpha = fa * 0.3;
  for (let i = 0; i < 3; i++) { const gx = x0 + w * (0.25 + i * 0.22); g.beginPath(); g.moveTo(gx, y0 + h * 0.05); g.quadraticCurveTo(gx + 0.25, y0 + h * 0.45, gx - 0.1, y0 + h * 0.95); g.stroke(); }
  g.globalAlpha = fa * 0.4; g.fillStyle = p.bedD; g.fillRect(x0, y0 + h - 0.8, w, 0.8);
  g.restore(); g.globalAlpha = fa;
  g.strokeStyle = p.bedD; g.lineWidth = 0.16; g.globalAlpha = fa * 0.7; shRR(g, x0, y0, w, h, r); g.stroke(); g.globalAlpha = fa;
}
// yatak → yosun tümseği (b: 0 yatak, 1 yosun); f: çerçevenin kayboluşu
function shYatakArka(p, b, f, tm) {
  shOdaT();
  const Y = SH_YATAK;
  // yosun tümseği (toprak) – yatağın yerini alır
  const fa = 1 - f;
  if (fa > 0.01) {
    g.globalAlpha = fa;
    const bat = f * 6;   // çerçeve toprağa gömülür
    // yatağın zemine düşen yumuşak gölgesi
    { const sg0 = g.createRadialGradient((Y.x0 + Y.x1) / 2, 79.6 + bat, 1, (Y.x0 + Y.x1) / 2, 79.6 + bat, 33);
      sg0.addColorStop(0, p.sky === 'gece' ? 'rgba(2,3,18,0.5)' : 'rgba(90,50,30,0.28)'); sg0.addColorStop(1, 'rgba(0,0,0,0)');
      g.save(); g.translate((Y.x0 + Y.x1) / 2, 79.6 + bat); g.scale(1, 0.1); g.translate(-(Y.x0 + Y.x1) / 2, -(79.6 + bat)); g.fillStyle = sg0; g.fillRect(Y.x0 - 36, 79.6 + bat - 36, 108, 72); g.restore(); }
    // ayaklar (arka ayaklar koyu, ön ayaklar ışıklı; aşağı doğru hafif incelen)
    for (const lx of [Y.x0 + 2.2, Y.x1 - 4.4]) {
      g.fillStyle = p.bedD; g.beginPath(); g.moveTo(lx, 70 + bat); g.lineTo(lx + 2.2, 70 + bat); g.lineTo(lx + 1.8, 79.4 + bat); g.quadraticCurveTo(lx + 1.1, 79.9 + bat, lx + 0.4, 79.4 + bat); g.closePath(); g.fill();
      g.fillStyle = p.bedHi; g.globalAlpha = fa * 0.35; g.fillRect(lx + 0.2, 71 + bat, 0.35, 8); g.globalAlpha = fa;
    }
    // başlık (yuvarlak tepeli) + ayak ucu: ahşap
    shAhsap(Y.x0 - 3, 43 + bat, 4.2, 37, 1.5, p, 1);
    shAhsap(Y.x1 - 0.5, 53 + bat, 3.6, 27, 1.3, p, 2);
    // başlık tepesinde topuz, tahta üzerinde oyma panel + yıldız
    g.fillStyle = p.bed; g.beginPath(); g.arc(Y.x0 - 0.9, 42.2 + bat, 1.7, 0, 6.283); g.fill();
    g.fillStyle = p.bedHi; g.globalAlpha = fa * 0.7; g.beginPath(); g.arc(Y.x0 - 1.35, 41.7 + bat, 0.55, 0, 6.283); g.fill(); g.globalAlpha = fa;
    g.strokeStyle = p.bedD; g.lineWidth = 0.18; g.globalAlpha = fa * 0.55; shRR(g, Y.x0 - 2.2, 45 + bat, 2.6, 13, 1.1); g.stroke(); shRR(g, Y.x0 - 2.2, 59 + bat, 2.6, 12, 0.6); g.stroke(); g.globalAlpha = fa;
    g.fillStyle = p.bedHi; shYildiz5(g, Y.x0 - 0.9, 51 + bat, 1.05); g.fill();
    g.fillStyle = p.bed; g.beginPath(); g.arc(Y.x1 + 1.3, 52.5 + bat, 1.4, 0, 6.283); g.fill();
    g.fillStyle = p.bedHi; g.globalAlpha = fa * 0.7; g.beginPath(); g.arc(Y.x1 + 0.85, 52 + bat, 0.45, 0, 6.283); g.fill(); g.globalAlpha = fa;
    // yatak gövdesi (çerçeve)
    { const fg = g.createLinearGradient(0, 66 + bat, 0, 72.5 + bat); fg.addColorStop(0, p.bedHi); fg.addColorStop(0.18, p.bed); fg.addColorStop(1, p.bedD);
      g.fillStyle = fg; shRR(g, Y.x0, 66 + bat, Y.x1 - Y.x0, 6.5, 1); g.fill();
      g.strokeStyle = p.bedD; g.lineWidth = 0.14; g.globalAlpha = fa * 0.3;
      for (let i = 0; i < 9; i++) { const gy = 67.4 + bat + i * 0.55; g.beginPath(); g.moveTo(Y.x0 + 1, gy); for (let xx = 0; xx <= 1.001; xx += 0.1) g.lineTo(Y.x0 + 1 + (Y.x1 - Y.x0 - 2) * xx, gy + Math.sin(xx * 7 + i * 1.9) * 0.18); g.stroke(); }
      g.globalAlpha = fa; }
    g.fillStyle = p.bedHi; g.globalAlpha = fa * 0.7; g.fillRect(Y.x0 + 1, 66.3 + bat, Y.x1 - Y.x0 - 2, 0.45); g.globalAlpha = fa;
    // çarşaf/şilte
    // çarşaf: üstten yumuşak ışık, alta doğru hafif gölge; önde ince kıvrık kenar (dikiş) ve iki yumuşak kırışık
    const sg = g.createLinearGradient(0, Y.ust, 0, Y.ust + 6.6);
    sg.addColorStop(0, p.sheetHi); sg.addColorStop(0.55, p.sheet); sg.addColorStop(1, p.sheetD);
    g.fillStyle = sg; shRR(g, Y.x0 + 0.5, Y.ust, Y.x1 - Y.x0 - 1, 6.6, 1.6); g.fill();
    g.strokeStyle = p.sheetD; g.lineWidth = 0.18; g.globalAlpha = fa * 0.8;
    g.setLineDash([0.55, 0.4]); g.beginPath(); g.moveTo(Y.x0 + 1.6, Y.ust + 5.4); g.lineTo(Y.x1 - 1.6, Y.ust + 5.4); g.stroke(); g.setLineDash([]);
    // şilte kenarı: yumuşak biyeli (piping) hat ve altına düşen gölge
    g.globalAlpha = fa * 0.55; g.strokeStyle = p.sheetD; g.lineWidth = 0.4; g.beginPath(); g.moveTo(Y.x0 + 1.2, Y.ust + 6.1); g.lineTo(Y.x1 - 1.2, Y.ust + 6.1); g.stroke();
    g.strokeStyle = p.sheetHi; g.lineWidth = 0.14; g.globalAlpha = fa * 0.8; g.beginPath(); g.moveTo(Y.x0 + 1.2, Y.ust + 5.85); g.lineTo(Y.x1 - 1.2, Y.ust + 5.85); g.stroke();
    { const og = g.createLinearGradient(0, Y.ust + 6.5, 0, Y.ust + 8.4); og.addColorStop(0, 'rgba(0,0,0,0.28)'); og.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = fa; g.fillStyle = og; g.fillRect(Y.x0 + 1, Y.ust + 6.5, Y.x1 - Y.x0 - 2, 1.9); }
    g.strokeStyle = p.sheetD; g.lineWidth = 0.18; g.globalAlpha = fa * 0.8;
    g.lineWidth = 0.22; g.lineCap = 'round'; g.globalAlpha = fa * 0.45;
    g.beginPath(); g.moveTo(Y.x0 + 15, Y.ust + 1.6); g.quadraticCurveTo(Y.x0 + 17.5, Y.ust + 3.1, Y.x0 + 16.4, Y.ust + 4.6);
    g.stroke();
    g.globalAlpha = 1;
  }
  // yastık → yumuşak yosun yastığı
  const yx = Y.x0 + 6.6, yy = Y.ust - 2.4;
  // yastık → yamaca kaynaşan yumuşak yosun tümseği
  const bb = shEase(b), yyy = yy + 1.6 * bb, bu = sh.tema === 'bulut';
  // yastık (gece / sabah): kabarık, köşeleri hafif sivri; üstten ışık alır, altı gölgeli; kenarında dikiş, üstünde
  // battaniyedeki gibi minik yıldızlar. Yosuna dönüşürken yumuşakça yosun tümseğine karışır.
  if (bb < 0.999) { g.globalAlpha = 1 - bb; shYastik(p, yx, yy); g.globalAlpha = 1; }
  if (bb > 0.001) {
  g.globalAlpha = bb;
  g.fillStyle = shMix(p.pillow, bu ? '#ffe4ee' : '#2c8069', b);
  g.beginPath(); g.ellipse(yx + 0.6 * bb, yyy, 7 + 1.2 * bb, 3.1 + 2.2 * bb, -0.05 - 0.12 * bb, 0, 6.283); g.fill();
  g.fillStyle = shMix(p.pillowHi, bu ? '#ffffff' : '#4fb592', b, 0.6 - 0.3 * b);
  g.beginPath(); g.ellipse(yx - 1, yyy - 1.3 - 0.8 * bb, 4.8, 1.3, -0.05, 0, 6.283); g.fill();
  g.globalAlpha = 1;
  }
  if (bb > 0.05 && !bu) {   // yosun saçakları
    g.strokeStyle = '#3d9c7e'; g.lineWidth = 0.38; g.lineCap = 'round'; g.globalAlpha = bb; g.beginPath();
    for (let i = 0; i < 9; i++) { const ax = yx - 6.5 + i * 1.5, ay = yyy - Math.sqrt(Math.max(0, 1 - Math.pow((ax - yx) / 8, 2))) * (3.1 + 2.2 * bb) + 0.4; g.moveTo(ax, ay); g.quadraticCurveTo(ax + 0.2, ay - 0.6, ax + ((i % 3) - 1) * 0.4, ay - 1.1 - (i % 2) * 0.4); }
    g.stroke(); g.globalAlpha = 1;
  }
}
// yastık (oda biriminde, shOdaT kurulu): merkez (cx, cy)
const SH_YASTIK_YILDIZ = [[-4.6, -0.9, 0.62], [-1.2, 0.9, 0.5], [2.4, -1.1, 0.58], [5.0, 0.7, 0.46], [-5.6, 1.4, 0.4], [0.9, -2.0, 0.38]];
function shYastikYol(w, h) {
  g.beginPath();
  g.moveTo(-w, -h * 0.82);
  g.bezierCurveTo(-w * 0.45, -h * 1.32, w * 0.45, -h * 1.32, w, -h * 0.82);     // üst: kabarık
  g.bezierCurveTo(w * 0.86, -h * 0.3, w * 0.86, h * 0.3, w, h * 0.82);          // sağ: köşeler hafif dışa
  g.bezierCurveTo(w * 0.45, h * 1.22, -w * 0.45, h * 1.22, -w, h * 0.82);       // alt
  g.bezierCurveTo(-w * 0.86, h * 0.3, -w * 0.86, -h * 0.3, -w, -h * 0.82);      // sol
  g.closePath();
}
function shYastik(p, cx, cy) {
  const w = 7.3, h = 3.2, a0 = g.globalAlpha;
  g.save(); g.translate(cx, cy); g.rotate(-0.05);
  // çarşafa düşen yumuşak gölge
  g.fillStyle = p.sky === 'gece' ? 'rgba(10,12,40,0.35)' : 'rgba(120,90,150,0.16)';
  g.beginPath(); g.ellipse(0.4, h * 0.95, w * 0.95, h * 0.32, 0, 0, 6.283); g.fill();
  shYastikYol(w, h);
  const gr = g.createLinearGradient(0, -h * 1.2, 0, h * 1.1);
  gr.addColorStop(0, p.pillowHi); gr.addColorStop(0.45, p.pillow); gr.addColorStop(1, p.pillowD);
  g.fillStyle = gr; g.fill();
  g.save(); g.clip();
  // sol üstten ışık, sağ altta kabarıklığın gölgesi
  const hg = g.createRadialGradient(-w * 0.35, -h * 0.55, 0, -w * 0.35, -h * 0.55, w * 0.75);
  hg.addColorStop(0, 'rgba(255,255,255,0.75)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hg; g.fillRect(-w * 1.2, -h * 1.5, w * 2.4, h * 3);
  const dg = g.createRadialGradient(w * 0.75, h * 0.7, 0, w * 0.75, h * 0.7, w * 0.7);
  dg.addColorStop(0, p.sky === 'gece' ? 'rgba(20,24,70,0.35)' : 'rgba(150,120,190,0.22)'); dg.addColorStop(1, 'rgba(150,120,190,0)');
  g.fillStyle = dg; g.fillRect(-w * 1.2, -h * 1.5, w * 2.4, h * 3);
  // minik yıldızlar (battaniyedeki desen)
  g.fillStyle = p.star;
  for (const [sx, sy, sr] of SH_YASTIK_YILDIZ) { g.globalAlpha = a0 * (p.sky === 'gece' ? 0.5 : 0.9); shYildiz5(g, sx, sy, sr); g.fill(); }
  g.globalAlpha = a0;
  // basınç çukuru: ortada yumuşak gölge, çevresinde ışık kenarı
  { const cg = g.createRadialGradient(0, h * 0.1, 0, 0, h * 0.1, w * 0.62);
    cg.addColorStop(0, p.sky === 'gece' ? 'rgba(18,22,66,0.36)' : 'rgba(150,120,190,0.26)'); cg.addColorStop(0.6, p.sky === 'gece' ? 'rgba(18,22,66,0.12)' : 'rgba(150,120,190,0.08)'); cg.addColorStop(1, 'rgba(150,120,190,0)');
    g.save(); g.scale(1, 0.55); g.fillStyle = cg; g.fillRect(-w * 1.2, -h * 3, w * 2.4, h * 6); g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 0.22; g.lineCap = 'round'; g.beginPath(); g.moveTo(-w * 0.62, -h * 0.58); g.quadraticCurveTo(0, -h * 1.02, w * 0.62, -h * 0.58); g.stroke();
    g.strokeStyle = p.pillowD; g.lineWidth = 0.16; g.globalAlpha = a0 * 0.5; g.beginPath();
    g.moveTo(-w * 0.8, -h * 0.1); g.quadraticCurveTo(-w * 0.5, h * 0.05, -w * 0.28, h * 0.12); g.moveTo(w * 0.8, -h * 0.05); g.quadraticCurveTo(w * 0.5, h * 0.1, w * 0.28, h * 0.14);
    g.moveTo(-w * 0.25, h * 0.55); g.quadraticCurveTo(0, h * 0.7, w * 0.3, h * 0.55); g.stroke(); g.globalAlpha = a0; }
  // köşelerdeki kumaş kıvrımları
  g.strokeStyle = p.pillowD; g.lineWidth = 0.2; g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-w * 0.93, -h * 0.72); g.quadraticCurveTo(-w * 0.78, -h * 0.5, -w * 0.62, -h * 0.55);
  g.moveTo(w * 0.93, -h * 0.72); g.quadraticCurveTo(w * 0.78, -h * 0.5, w * 0.62, -h * 0.55);
  g.moveTo(-w * 0.93, h * 0.72); g.quadraticCurveTo(-w * 0.8, h * 0.5, -w * 0.64, h * 0.56);
  g.moveTo(w * 0.93, h * 0.72); g.quadraticCurveTo(w * 0.8, h * 0.5, w * 0.64, h * 0.56);
  g.stroke();
  g.restore();
  // dikiş (içeride kesik çizgi) + kenar
  g.strokeStyle = p.pillowSeam; g.lineWidth = 0.1; g.setLineDash([0.32, 0.26]);
  g.save(); g.scale(0.86, 0.78); shYastikYol(w, h); g.restore(); g.stroke(); g.setLineDash([]);
  g.strokeStyle = p.pillowEdge; g.lineWidth = 0.2; shYastikYol(w, h); g.stroke();
  g.restore();
}
function shBattaniye(p, b, tm, nefes, otur = 0) {
  shOdaT();
  const Y = SH_YATAK, n = nefes || 0, bb = shEase(b), bu = sh.tema === 'bulut';
  const kalcaH = lerp(3.2 + n * 0.35, 0.9, otur), dizH = lerp(1.6, 2.2, otur);
  // yatarken battaniye Feza'nın göğsünden ayak ucuna kadar bütün gövdesini örter (bacaklar dışarıda kalmasın):
  // gövdenin üstünde yumuşak, yuvarlak bir tümsek (oda biriminde gövde ≈ x −37…−29, üst kenarı y ≈ 54.5)
  const yat = 1 - otur;
  const ust = (xx) => {   // battaniyenin üst kenarı (Feza'nın gövdesinin üstünden geçer)
    const t = (xx - -38) / 41;
    const kalca = Math.exp(-Math.pow((xx + 25.5) / 4.6, 2)) * kalcaH, diz = Math.exp(-Math.pow((xx + 17 + otur * 3) / 4, 2)) * dizH;
    const taban = 58.8 - kalca - diz + t * 0.6 - Math.max(0, -(xx + 33)) * 0.1;
    if (yat <= 0.001) return taban;
    const w = shEase(clamp((xx + 35.2) / 2.6, 0, 1)) * (1 - shEase(clamp((xx + 28.6) / 4.2, 0, 1)));
    const govde = 54.0 - n * 0.25 + Math.pow((xx + 31) / 5, 2) * 0.9;
    return lerp(taban, Math.min(taban, govde), w * yat);
  };
  const x0 = lerp(-37.6, -34.5, otur), x1 = Y.x1 + 0.6, altY = lerp(69.6, SH_YER + 2, bb);
  // yatak örtüsü (b=0) → yumuşak yosun tepeciği (b=1): kenar noktaları birlikte kayar
  const sagK = { x: lerp(x1 + 2.2, x1 + 8, bb), y: lerp(ust(x1) + 1, ust(x1) + 1.5, bb) };
  const sagA = { x: lerp(x1 + 2, x1 + 15, bb), y: altY };
  const solA = { x: lerp(x0 - 1, -64, bb), y: altY };
  const solK1 = { x: lerp(x0 - 2.4, -55, bb), y: lerp(altY - 1, 70, bb) }, solK2 = { x: lerp(x0 - 2.2, -50, bb), y: lerp(65.6, 60.4, bb) };
  const yol = new Path2D();
  yol.moveTo(x0, ust(x0));
  for (let xx = x0; xx <= x1; xx += 1) yol.lineTo(xx, ust(xx));
  yol.quadraticCurveTo(sagK.x, sagK.y, sagA.x, sagA.y);
  const dal = 0.5 * (1 - bb);
  for (let xx = sagA.x; xx >= solA.x; xx -= 2) yol.lineTo(xx, altY + Math.sin(xx * 0.9) * dal);
  yol.bezierCurveTo(solK1.x, solK1.y, solK2.x, solK2.y, x0 - 0.5 * bb, ust(x0) + 1.2 * bb);
  yol.closePath();
  const deniz = sh.tema === 'deniz', gol = sh.tema === 'gol';
  const topC = bu ? '#fff4f8' : deniz ? '#30b0b8' : gol ? '#287a6d' : '#2f8a72';
  const midC = bu ? '#ffd6e6' : deniz ? '#166a78' : gol ? '#1a5048' : '#1d5f52';
  const botC = bu ? '#e7a3c4' : deniz ? '#072430' : gol ? '#081f20' : '#06141c';
  const gr = g.createLinearGradient(0, 52, 0, altY);
  gr.addColorStop(0, shMix(p.blanketHi, topC, bb)); gr.addColorStop(0.3, shMix(p.blanket, midC, bb)); gr.addColorStop(1, shMix(p.blanketD, botC, bb));
  g.fillStyle = gr; g.fill(yol);
  // yosun dokusu: yumuşak açık/koyu lekeler (yalnız tepecikte)
  if (bb > 0.02) {
    g.save(); g.clip(yol);
    if (!shYosun) { const r = rng(91); shYosun = []; for (let i = 0; i < 46; i++) shYosun.push([-66 + r() * 86, 58 + r() * 30, 1.5 + r() * 4.5, 0.8 + r() * 1.8, r() < 0.55]); }
    for (const [mx, my, rx, ry, acik] of shYosun) {
      g.globalAlpha = bb * (bu ? (acik ? 0.35 : 0.18) : deniz ? (acik ? 0.32 : 0.22) : (acik ? 0.22 : 0.3));
      g.fillStyle = bu ? (acik ? '#ffffff' : '#e7a3c4') : deniz ? (acik ? '#5fe0e8' : '#0f4852') : gol ? (acik ? '#48cfb0' : '#0c3832') : (acik ? '#4fb592' : '#0b2e2c');
      g.beginPath(); g.ellipse(mx, my, rx, ry, 0, 0, 6.283); g.fill();
    }
    // yosunun üst kenarında masalsı yumuşak filizler & ay ışığı parıltısı
    if (bb > 0.15) {
      const spA = smooth(clamp((bb - 0.15) / 0.7, 0, 1));
      g.strokeStyle = bu ? 'rgba(255,240,250,0.55)' : deniz ? 'rgba(160,255,245,0.55)' : gol ? 'rgba(140,255,220,0.5)' : 'rgba(150,255,200,0.55)';
      g.lineWidth = 0.35;
      g.beginPath();
      for (let xx = x0 + 1; xx <= x1 - 1; xx += 2.2) {
        const uy = ust(xx), fz = Math.sin(xx * 2.3 + tm * 1.6) * 0.7;
        g.moveTo(xx, uy + 0.5); g.lineTo(xx + fz * 0.4, uy - 1.2 * spA + fz * 0.3);
      }
      g.stroke();
    }
    // tepeden süzülen ay ışığı (üst kenara yakın açık bant)
    const ug = g.createLinearGradient(0, 55, 0, 66); ug.addColorStop(0, bu ? 'rgba(255,236,210,0.5)' : deniz ? 'rgba(160,245,255,0.32)' : 'rgba(120,230,200,0.28)'); ug.addColorStop(1, bu ? 'rgba(255,236,210,0)' : 'rgba(120,230,200,0)');
    g.globalAlpha = bb; g.fillStyle = ug; g.fillRect(-70, 50, 100, 18);
    g.restore(); g.globalAlpha = 1;
  }
  // kat izi
  g.strokeStyle = shMix(p.blanketHi, bu ? '#ffffff' : deniz ? '#68f0f8' : '#46a88a', bb, 0.55); g.lineWidth = 0.45;
  g.beginPath(); for (let xx = x0 + 1; xx <= x1; xx += 1) g.lineTo(xx, ust(xx) + 0.9); g.stroke();
  // kumaş: üst kenar bandı (kıvrık, dalgalı kenarlı), yumuşak kıvrım gölgeleri, bulut ve ay deseni (yosuna dönüşürken silinir)
  if (bb < 0.98) {
    const va = 1 - bb, gece = p.sky === 'gece';
    g.save(); g.clip(yol);
    g.beginPath(); for (let xx = x0 - 1; xx <= x1 + 1; xx += 0.8) g.lineTo(xx, ust(xx) + 0.6);
    for (let xx = x1 + 1; xx >= x0 - 1; xx -= 0.8) g.lineTo(xx, ust(xx) + 2.9 + Math.sin(xx * 1.7) * 0.18);
    g.closePath(); g.fillStyle = p.blanketHi; g.globalAlpha = va * 0.42; g.fill();
    g.strokeStyle = p.blanketD; g.lineWidth = 0.22; g.globalAlpha = va * 0.55; g.beginPath(); for (let xx = x0 - 1; xx <= x1 + 1; xx += 0.8) g.lineTo(xx, ust(xx) + 2.9 + Math.sin(xx * 1.7) * 0.18); g.stroke();
    g.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      g.strokeStyle = p.blanketD; g.lineWidth = 0.34; g.globalAlpha = va * (0.34 - k * 0.06); g.beginPath();
      for (let xx = x0; xx <= x1; xx += 1.2) g.lineTo(xx, ust(xx) + 4.6 + k * 2.6 + Math.sin(xx * 0.33 + k * 2.1) * 0.55);
      g.stroke();
      g.strokeStyle = p.blanketHi; g.lineWidth = 0.22; g.globalAlpha = va * 0.3; g.beginPath();
      for (let xx = x0; xx <= x1; xx += 1.2) g.lineTo(xx, ust(xx) + 4.0 + k * 2.6 + Math.sin(xx * 0.33 + k * 2.1) * 0.55);
      g.stroke();
    }
    // bulutlar ve hilal
    g.fillStyle = gece ? '#b9c8ff' : '#ffffff'; g.globalAlpha = va * (gece ? 0.28 : 0.55);
    for (const [cx0, cy0, cs] of [[-23.5, 66.7, 1], [-6.5, 67.8, 0.85], [-30.5, 64.7, 0.6]]) { g.beginPath(); g.arc(cx0, cy0, 0.9 * cs, 0, 6.283); g.arc(cx0 + 1.1 * cs, cy0 - 0.5 * cs, 1.2 * cs, 0, 6.283); g.arc(cx0 + 2.3 * cs, cy0, 0.85 * cs, 0, 6.283); g.rect(cx0, cy0, 2.3 * cs, 0.85 * cs); g.fill(); }
    g.globalAlpha = va * p.starA; g.fillStyle = p.star; g.beginPath(); g.arc(-13, 66, 1.35, 0.55 * Math.PI, 1.55 * Math.PI, false); g.arc(-12.3, 66.4, 1.1, 1.5 * Math.PI, 0.5 * Math.PI, true); g.fill();
    g.restore(); g.globalAlpha = 1;
  }
  // yıldız deseni → ışıklı çiçekler (her yıldız sırayla küçülür, aynı yerde bir çiçek açar)
  const cicekler = [];
  for (let i = 0; i < SH_YILDIZ.length; i++) {
    const [sx, sy0] = SH_YILDIZ[i]; if (sx <= x0 + 1) continue;
    const sy = sy0 - 1.5 + (sx < -20 ? n * 0.2 : 0);
    const f = shEase(shSeg(b, 0.22 + i * 0.045, 0.52 + i * 0.045));
    if (f < 1) { g.fillStyle = p.star; g.globalAlpha = p.starA * (1 - f) + 0.4 * Math.sin(f * Math.PI); shYildiz5(g, sx, sy, 0.95 * (1 - f * 0.7) + Math.sin(f * Math.PI) * 0.6, 0); g.fill(); g.globalAlpha = 1; }
    if (f > 0) cicekler.push([sx, sy, f, i]);
  }
  if (bu) {   // bulutta yıldızlar altın ışıltılara dönüşür
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; const k = sh.k0 * sh.zoom;
    for (const [cx, cy, f, i] of cicekler) { const tw = 0.6 + 0.4 * Math.sin(tm * 2.2 + i * 1.9); dglow('#ffd9a0', shEkranX(cx), shEkranY(cy), k * 3.5 * f, f * 0.5 * tw); shParilti(shEkranX(cx), shEkranY(cy), k * (1.4 + 1.2 * tw) * f, f * tw); }
    g.globalCompositeOperation = 'source-over';
  } else for (const [cx, cy, f, i] of cicekler) shCicek(cx, cy, f, tm, i, 1);
  // yosun saçakları, eğrelti otları ve ışıklı uçlar
  if (b > 0.05 && bu) {   // bulut tepeciği: üst kenarda kabarık tümsekler, sıcak kenar ışığı, pembe-altın zerreler
    shOdaT();
    const ka = shSeg(b, 0.1, 0.6);
    for (let ps = 0; ps < 2; ps++) {   // yamaçlarda büyük kabarık bulutlar (düz kenarlar görünmesin)
      g.fillStyle = ps ? '#ffe2ee' : '#f0b2ce'; g.globalAlpha = ka; g.beginPath();
      for (let j = 0; j < 4; j++) {
        const u = (j + 0.5) / 4;
        for (const [ax, ay, bx2, by2, sg] of [[x0 - 1, ust(x0) + 3, solA.x + 3, altY - 2, -1], [x1 + 2, ust(x1) + 1.5, sagA.x - 3, altY - 2, 1]]) {
          const px = lerp(ax, bx2, u) + sg * 1.2, py = lerp(ay, by2, u), rr = (2.6 + u * 3.4 + (j % 2) * 0.8) * bb * (ps ? 0.9 : 1);
          g.moveTo(px + rr, py - (ps ? rr * 0.18 : 0)); g.arc(px, py - (ps ? rr * 0.18 : 0), rr, 0, 6.283);
        }
      }
      g.fill();
    }
    for (let ps = 0; ps < 2; ps++) {
      g.fillStyle = ps ? '#ffffff' : '#ffe6f0'; g.globalAlpha = ka * (ps ? 0.5 : 1); g.beginPath();
      for (let xx = x0 + 2.5, i = 0; xx < x1 + 4; xx += 4.4, i++) {
        if (otur > 0.2 && xx < -29.5) continue;
        const rr = (2.0 + ((i * 7) % 4) * 0.3) * bb * (ps ? 0.5 : 1), y0 = ust(Math.min(xx, x1)) + 0.9 - (ps ? rr * 0.5 : 0) + Math.sin(tm * 0.8 + i) * 0.12;
        g.moveTo(xx - (ps ? rr * 0.3 : 0) + rr, y0); g.arc(xx - (ps ? rr * 0.3 : 0), y0, rr, 0, 6.283);
      }
      g.fill();
    }
    g.globalAlpha = 1;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
    const r = sh.k0 * sh.zoom;
    for (let i = 0; i < 7; i++) {
      const xx = x0 + 3 + i * 5.7, y0 = ust(xx) - 1.6 * bb, tw = 0.5 + 0.5 * Math.sin(tm * 1.6 + i * 1.7);
      if (otur > 0.2 && xx < -29.5) continue;
      dglow(i % 3 ? '#ffe0ee' : '#fff3c8', shEkranX(xx), shEkranY(y0), r * (1.6 + tw * 0.8), bb * (0.12 + tw * 0.2));
    }
    for (const [sx, sy, ph] of SH_SPOR) {
      const tw = 0.5 + 0.5 * Math.sin(tm * 1.3 + ph);
      dglow(ph % 2 > 1 ? '#ffc6dc' : '#ffe9b8', shEkranX(sx), shEkranY(sy + Math.sin(tm * 0.8 + ph) * 0.3), r * (0.8 + tw * 0.5), bb * bb * (0.25 + tw * 0.4));
    }
    g.globalCompositeOperation = 'source-over';
  } else if (b > 0.05) {
    shOdaT();
    g.strokeStyle = '#2f8a72'; g.lineWidth = 0.42; g.lineCap = 'round'; g.globalAlpha = shSeg(b, 0.12, 0.4);
    g.beginPath();
    for (let xx = x0 + 0.5, i = 0; xx < x1; xx += 1.1, i++) {
      if (otur > 0.2 && xx < -29.5) continue;   // doğrulunca saçaklar gövdesinin önünden geçmesin
      const y0 = ust(xx) + 0.3, h = (0.8 + ((i * 7) % 5) * 0.35) * bb, sw = Math.sin(tm * 1.6 + i) * 0.25;
      g.moveTo(xx, y0); g.quadraticCurveTo(xx + sw, y0 - h * 0.6, xx + sw * 2 + ((i % 3) - 1) * 0.4, y0 - h);
    }
    g.stroke(); g.globalAlpha = 1;
    // eğreltiler: kıvrık doğar, yavaşça açılır
    for (let i = 0; i < SH_EGRELTI.length; i++) {
      const [ex, ey, boy, aci, ust2] = SH_EGRELTI[i];
      const ac = shEase(shSeg(b, 0.7 + i * 0.025, 1));
      if (ac <= 0.01) continue;
      const yy = ust2 ? ust(ex) + 0.6 : ey;
      shEgrelti(ex, yy, boy * (0.35 + 0.65 * ac), aci + Math.sin(tm * 0.9 + i * 1.3) * 0.04, ac, i);
    }
    // tepenin üst kenarında oyundaki gibi camgöbeği kenar ışığı
    shOdaT(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
    for (const [lw, al] of [[1.4, 0.10], [0.6, 0.22], [0.22, 0.75]]) {
      g.strokeStyle = `rgba(127,232,255,${al * bb})`; g.lineWidth = lw; g.beginPath();
      for (let xx = x0 + 0.5; xx <= x1; xx += 1) g.lineTo(xx, ust(xx) - 0.05);
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
    const r = sh.k0 * sh.zoom;
    for (let i = 0; i < 14; i++) {
      const xx = x0 + 2 + i * 2.85, y0 = ust(xx) - 1.6 * bb, tw = 0.5 + 0.5 * Math.sin(tm * 2.1 + i * 1.7);
      if (otur > 0.2 && xx < -29.5) continue;
      dglow(i % 3 ? '#9ff0d0' : '#bff4ff', shEkranX(xx), shEkranY(y0), r * (1.1 + tw * 0.6), bb * (0.35 + tw * 0.4));
    }
    // tepeciğin yamaçlarında ışıklı sporlar
    for (const [sx, sy, ph] of SH_SPOR) {
      const tw = 0.5 + 0.5 * Math.sin(tm * 1.3 + ph);
      dglow(ph % 2 > 1 ? '#7fe8ff' : '#b9ffd8', shEkranX(sx), shEkranY(sy + Math.sin(tm * 0.8 + ph) * 0.3), r * (0.8 + tw * 0.5), bb * bb * (0.25 + tw * 0.45));
    }
    g.globalCompositeOperation = 'source-over';
  }
}
let shYosun = null;
// eğrelti kökleri: [x, y, boy, açı, üst kenarda mı]
const SH_EGRELTI = [[-57, 73, 7.5, -0.55, 0], [-62, 81, 6, -0.8, 0], [-50.5, 64, 6, -0.35, 0], [9.5, 67, 7, 0.5, 0], [14.5, 77, 6.2, 0.75, 0], [-6, 0, 5.2, 0.15, 1], [1.5, 0, 4.4, 0.4, 1], [-15, 0, 4, -0.2, 1]];
function shEgrelti(x, y, boy, aci, ac, i) {   // oda biriminde (shOdaT ayarlı)
  const n = 9, bukul = lerp(4.2, 0.9, ac) * (aci < 0 ? -1 : 1), parca = boy / n;
  let px = x, py = y, a = aci - Math.PI / 2;
  g.strokeStyle = '#2a7a63'; g.lineWidth = 0.32; g.lineCap = 'round';
  const pts = [];
  for (let j = 0; j <= n; j++) { pts.push([px, py, a]); a += bukul / n * (0.4 + j / n); px += Math.cos(a) * parca; py += Math.sin(a) * parca; }
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const q of pts) g.lineTo(q[0], q[1]); g.stroke();
  for (let j = 1; j < n; j++) {
    const [qx, qy, qa] = pts[j], L = boy * 0.2 * (1 - j / (n + 1)) * ac;
    if (L < 0.08) continue;
    for (const s of [-1, 1]) {
      const la = qa + s * 1.1;
      g.fillStyle = (j + (s > 0 ? 1 : 0) + i) % 3 ? '#2f8a72' : '#48ab8a';
      g.beginPath(); g.ellipse(qx + Math.cos(la) * L * 0.5, qy + Math.sin(la) * L * 0.5, L * 0.55, L * 0.2, la, 0, 6.283); g.fill();
    }
  }
}
// ışıklı küçük çiçek (oda biriminde x,y; f 0..1 açılma). ek: parıltı gücü
function shCicek(x, y, f, tm, i, ek) {
  shOdaT();
  const r = 1.25 * shEase(f) * (1 + 0.15 * Math.sin(f * Math.PI)), don = (1 - f) * 1.8 + i;
  g.save(); g.translate(x, y); g.rotate(don);
  g.fillStyle = i % 2 ? '#d9c6ff' : '#bff4ff';
  for (let k = 0; k < 5; k++) { g.rotate(1.2566); g.beginPath(); g.ellipse(0, -r * 0.62, r * 0.36, r * 0.6, 0, 0, 6.283); g.fill(); }
  g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(0, 0, r * 0.3, 0, 6.283); g.fill();
  g.restore();
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const k = sh.k0 * sh.zoom, tw = 0.75 + 0.25 * Math.sin(tm * 1.9 + i * 2.3);
  dglow(i % 2 ? '#c9a8ff' : '#8ff0ff', shEkranX(x), shEkranY(y), k * 4.5 * f, f * 0.45 * tw * ek);
  dglow('#ffffff', shEkranX(x), shEkranY(y), k * 1.1 * f, f * 0.5 * ek);
  if (f < 1) shParilti(shEkranX(x), shEkranY(y), k * 3 * Math.sin(f * Math.PI), Math.sin(f * Math.PI) * 0.9);
  g.globalCompositeOperation = 'source-over';
}
const SH_SPOR = [[-50, 66, 0.3], [-44, 71, 2.1], [-30, 68, 1.2], [-19, 74, 3.3], [-8, 69, 0.8], [2, 73, 2.7], [9, 78, 1.9], [-56, 77, 3.9], [-36, 79, 1.5], [-12, 80, 0.2]];

// gece lambası → ay (l: 0 lamba, 1 ay)
function shLambaYer(l) {
  const ee = shEase2(l);
  return { x: lerp(SH_LAMBA.x, SH_AY.x, ee), y: lerp(SH_LAMBA.y, SH_AY.y, ee) - Math.sin(ee * Math.PI) * 18 };
}
function shLamba(p, l, tm, gece, yanik = 1) {
  const ee = shEase2(l);
  // yay şeklinde süzülüş
  const lx = lerp(SH_LAMBA.x, SH_AY.x, ee), ly = lerp(SH_LAMBA.y, SH_AY.y, ee) - Math.sin(ee * Math.PI) * 18;
  const bu = sh.tema === 'bulut' && gece, rr = lerp(2.3, 6.5, shEase(l));
  // gövde (ayak) – yıldız tozuna dönüşerek kaybolur
  if (l < 1) {
    shOdaT(); g.globalAlpha = 1 - shSeg(l, 0, 0.38);
    { const bx0 = SH_LAMBA.x, ku = SH_KOMODIN.ust, cg = g.createLinearGradient(bx0 - 2.8, 0, bx0 + 2.8, 0);
      cg.addColorStop(0, gece ? '#241e48' : '#c9976b'); cg.addColorStop(0.35, gece ? '#4c4388' : '#f5d6b0'); cg.addColorStop(1, gece ? '#241e48' : '#c9976b');
      g.fillStyle = cg; g.beginPath(); g.moveTo(bx0 - 2.8, ku); g.quadraticCurveTo(bx0 - 2.4, ku - 2.9, bx0, ku - 3); g.quadraticCurveTo(bx0 + 2.4, ku - 2.9, bx0 + 2.8, ku); g.closePath(); g.fill();
      g.fillRect(bx0 - 0.5, SH_LAMBA.y + 1, 1, ku - SH_LAMBA.y - 3.4);
      g.fillStyle = gece ? '#ffe6a8' : '#f2b968'; shYildiz5(g, bx0, ku - 1.3, 0.62); g.fill(); }
    g.globalAlpha = 1;
  }
  const px = shEkranX(lx), py = shEkranY(ly), k = sh.k0 * sh.zoom;
  // ışık: sıcak turuncu → serin, masalsı ay ışığı aurası
  const sicak = '#ffcf8a', ay = bu ? '#ffdcae' : '#cfe6ff';
  const nab = 1 + Math.sin(tm * 1.4) * 0.04;
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (gece && yanik > 0) {
    g.globalCompositeOperation = 'lighter';
    const auraR = k * lerp(26, 82, l) * nab, auraA = yanik * lerp(0.42, bu ? 0.35 : 0.55, l);
    dglow(l < 0.45 ? sicak : ay, px, py, auraR, auraA);
    dglow(l < 0.45 ? '#ffe2b8' : bu ? '#fff4dc' : '#ffffff', px, py, k * rr * 2.8, yanik * lerp(0.65, 0.58, l));
    if (l > 0.1 && l < 0.9) {
      // yükselirken lambanın çevresinde narin ay ışığı hareleri
      const haloU = Math.sin(shSeg(l, 0.1, 0.9) * Math.PI);
      dglow('#f0e4ff', px, py, k * rr * 5.4, yanik * 0.32 * haloU);
    }
    if (bu && l > 0.3) dglow('#ffb0a0', px, py, k * rr * 9, yanik * 0.3 * shSeg(l, 0.3, 1));
    if (l < 0.6) {   // komodinin üstüne ve zemine yumuşak sıcak ışık havuzu
      const hv = yanik * (1 - shSeg(l, 0, 0.6)); shOdaT(); g.globalCompositeOperation = 'lighter';
      for (const [hx, hy, hr, hs, ha] of [[SH_LAMBA.x, SH_KOMODIN.ust - 0.2, 8, 0.14, 0.4], [SH_LAMBA.x + 9, SH_ZEMIN + 10, 22, 0.17, 0.26]]) {
        const pg = g.createRadialGradient(0, 0, 0, 0, 0, hr); pg.addColorStop(0, 'rgba(255,200,130,' + (ha * hv) + ')'); pg.addColorStop(1, 'rgba(255,190,120,0)');
        g.save(); g.translate(hx, hy); g.scale(1, hs * 2); g.fillStyle = pg; g.fillRect(-hr, -hr, hr * 2, hr * 2); g.restore();
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
    }
    g.globalCompositeOperation = 'source-over';
  }
  // küre / ay diski
  shOdaT();
  if (l > 0.5) {
    const a = shSeg(l, 0.5, 1);
    g.fillStyle = shMix('#ffe9c4', bu ? '#fff3d2' : '#f2f7ff', a);
    g.beginPath(); g.arc(lx, ly, rr, 0, 6.283); g.fill();
    g.fillStyle = bu ? `rgba(255,255,255,${0.5 * a})` : `rgba(180,200,235,${0.35 * a})`;   // yumuşak ay lekeleri (güneşte parlak benek)
    if (bu) { g.beginPath(); g.arc(lx - rr * 0.3, ly - rr * 0.3, rr * 0.4, 0, 6.283); g.fill(); } else
    g.beginPath(); g.arc(lx - rr * 0.3, ly - rr * 0.15, rr * 0.22, 0, 6.283); g.moveTo(lx + rr * 0.47, ly + rr * 0.3); g.arc(lx + rr * 0.32, ly + rr * 0.3, rr * 0.15, 0, 6.283); g.moveTo(lx + rr * 0.2, ly - rr * 0.45); g.arc(lx + rr * 0.1, ly - rr * 0.45, rr * 0.1, 0, 6.283); g.fill();
  } else {
    // lamba kubbesi (hilal biçimli gece lambası)
    const sh2 = shSeg(l, 0, 0.5);
    { const lg2 = g.createRadialGradient(lx - rr * 0.25, ly - rr * 0.3, rr * 0.1, lx, ly, rr);
      lg2.addColorStop(0, gece ? shMix('#fffbe8', '#ffffff', sh2) : '#fffdf4'); lg2.addColorStop(0.65, gece ? shMix('#ffe2ad', '#f2f7ff', sh2) : '#fff0d4'); lg2.addColorStop(1, gece ? shMix('#ffb870', '#cfdcf6', sh2) : '#ecc89c');
      g.fillStyle = lg2; g.beginPath(); g.arc(lx, ly, rr, 0, 6.283); g.fill();
      if (sh2 < 0.2) { g.fillStyle = gece ? '#4c4388' : '#d8a577'; g.beginPath(); g.moveTo(lx - rr * 0.5, ly + rr * 0.86); g.lineTo(lx + rr * 0.5, ly + rr * 0.86); g.lineTo(lx + rr * 0.42, ly + rr * 1.22); g.lineTo(lx - rr * 0.42, ly + rr * 1.22); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.2; g.beginPath(); g.arc(lx, ly, rr * 0.82, 3.6, 4.5); g.stroke(); }
    if (sh2 < 1) {
      g.fillStyle = gece ? `rgba(255,190,120,${0.55 * (1 - sh2)})` : 'rgba(225,190,150,0.6)';
      g.beginPath(); g.arc(lx + rr * 0.35, ly - rr * 0.2, rr * 0.75, 0, 6.283); g.fill();
    }
  }
}

// halı → ışıklı mantarlar (r: 0 halı, 1 mantar)
function shHali(p, r, tm) {
  const H0 = SH_HALI;
  if (r < 1) {
    shOdaT(); g.globalAlpha = 1 - shEase(r);
    const ga = g.globalAlpha, gece = p.sky === 'gece';
    // zemine gölge + halının kalınlığı (alt kenar), sonra üst yüz: ortası aydınlık, kenarı koyu
    g.fillStyle = gece ? 'rgba(2,3,16,0.45)' : 'rgba(100,60,40,0.3)'; g.beginPath(); g.ellipse(H0.x + 0.5, H0.y + 1.0, H0.rx + 0.9, H0.ry + 0.6, 0, 0, 6.283); g.fill();
    g.fillStyle = gece ? '#241a46' : '#c5708c'; g.beginPath(); g.ellipse(H0.x, H0.y + 0.55, H0.rx, H0.ry, 0, 0, 6.283); g.fill();
    g.fillStyle = p.rug; g.beginPath(); g.ellipse(H0.x, H0.y, H0.rx, H0.ry, 0, 0, 6.283); g.fill();
    g.save(); g.translate(H0.x, H0.y); g.scale(1, H0.ry / H0.rx); const R0 = H0.rx;
    { const rg = g.createRadialGradient(-R0 * 0.2, -R0 * 0.25, 0, 0, 0, R0); rg.addColorStop(0, 'rgba(255,255,255,' + (gece ? 0.1 : 0.2) + ')'); rg.addColorStop(0.7, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.2)'); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, R0, 0, 6.283); g.fill(); }
    g.strokeStyle = p.rugRing; g.lineWidth = 2.6; g.globalAlpha = ga * 0.5; g.beginPath(); g.arc(0, 0, R0 - 2.6, 0, 6.283); g.stroke();
    g.lineWidth = 1.1; g.globalAlpha = ga; g.beginPath(); g.arc(0, 0, R0 - 0.9, 0, 6.283); g.stroke();
    g.setLineDash([1.2, 1.6]); g.strokeStyle = p.rugDot; g.lineWidth = 0.7; g.globalAlpha = ga * 0.85; g.beginPath(); g.arc(0, 0, R0 - 2.6, 0, 6.283); g.stroke(); g.setLineDash([]);
    g.fillStyle = p.rugRing; g.globalAlpha = ga * 0.6;   // yaprak/çiçek halkası
    for (let k = 0; k < 16; k++) { const aa = k * 0.3927; g.save(); g.rotate(aa); g.translate(R0 * 0.7, 0); g.beginPath(); g.ellipse(0, 0, 2.4, 1.05, 0, 0, 6.283); g.fill(); g.restore(); }
    g.globalAlpha = ga; g.beginPath(); g.arc(0, 0, R0 * 0.5, 0, 6.283); g.lineWidth = 0.8; g.strokeStyle = p.rugRing; g.stroke();
    g.fillStyle = p.rugRing; g.globalAlpha = ga * 0.8; shYildiz5(g, 0, 0, R0 * 0.3); g.fill();
    g.fillStyle = p.rugDot; g.globalAlpha = ga * 0.9; shYildiz5(g, 0, 0, R0 * 0.14); g.fill();
    g.restore(); g.globalAlpha = ga;
    // püsküller
    g.strokeStyle = p.rugRing; g.lineWidth = 0.22; g.lineCap = 'round'; g.beginPath();
    for (const s of [-1, 1]) for (let j = -4; j <= 4; j++) { const yy = H0.y + j * 0.78, x1 = H0.x + s * (H0.rx - 0.2) * Math.sqrt(Math.max(0, 1 - Math.pow(j * 0.78 / H0.ry, 2))); g.moveTo(x1, yy); g.quadraticCurveTo(x1 + s * 0.9, yy + 0.25, x1 + s * (1.5 + (j & 1) * 0.3), yy + 0.1); }
    g.stroke();
    g.globalAlpha = 1;
  }
  // desen noktaları → mantarlar
  for (let i = 0; i < SH_MANTAR.length; i++) {
    const [dx, dy, boy, sap] = SH_MANTAR[i];
    const bx = H0.x + dx, by = lerp(H0.y + dy, SH_YER + 1.2 + dy * 0.9 + (i % 3) * 0.6, shEase(shSeg(r, 0, 0.5)));
    const yr = shEase(shSeg(r, 0.05 * i, 0.55 + 0.06 * i));
    shOdaT();
    if (yr <= 0.01) {
      g.fillStyle = p.rugDot; g.beginPath(); g.arc(bx, by, 0.75, 0, 6.283); g.fill();
      continue;
    }
    if (sh.tema === 'gol') {   // Yıldız Gölü: her nokta suyun üstünde açan ışıklı bir nilüfer olur
      const w = sap * (0.8 + 0.6 * yr) * 1.25, sw = Math.sin(tm * 0.9 + i) * 0.15 * yr, cx = bx + sw;
      g.fillStyle = shMix(p.rugDot, '#2f8a6a', yr); g.beginPath(); g.ellipse(cx, by, w * 1.3, w * 0.42, 0, 0.18, Math.PI * 2 - 0.18); g.lineTo(cx, by); g.closePath(); g.fill();   // yaprak (çentikli)
      g.fillStyle = '#4fb592'; g.globalAlpha = 0.7 * yr; g.beginPath(); g.ellipse(cx - w * 0.2, by - w * 0.08, w * 0.8, w * 0.2, 0, Math.PI, Math.PI * 2); g.fill(); g.globalAlpha = 1;
      const ac = shEase(shSeg(yr, 0.35, 1));
      if (ac > 0.01) {   // pembe çiçek açar
        g.fillStyle = i % 2 ? '#ffb6d9' : '#ffd0e8';
        for (let k = 0; k < 5; k++) { const an = -Math.PI / 2 + (k - 2) * 0.45 * ac; g.save(); g.translate(cx, by - w * 0.1); g.rotate(an + Math.PI / 2); g.beginPath(); g.ellipse(0, -w * 0.45 * ac, w * 0.16, w * 0.42 * ac, 0, 0, 6.283); g.fill(); g.restore(); }
        g.fillStyle = '#fff2b0'; g.beginPath(); g.arc(cx, by - w * 0.3 * ac, w * 0.12 * ac, 0, 6.283); g.fill();
      }
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
      const k = sh.k0 * sh.zoom, tw = 0.75 + 0.25 * Math.sin(tm * 1.7 + i * 2.1);
      dglow(i % 2 ? '#ff9ad0' : '#ffd6f0', shEkranX(cx), shEkranY(by - w * 0.3), k * w * 3.2, yr * 0.42 * tw);
      dglow('#9fd8ff', shEkranX(cx), shEkranY(by + w * 0.2), k * w * 2.6, yr * 0.22);   // suya düşen ışık
      g.globalCompositeOperation = 'source-over'; continue;
    }
    if (sh.tema === 'bulut') {   // her nokta bir gökkuşağı rengine bürünüp havalanır (yedi renk = yedi kuzucuk)
      const col = SH_GK[i % 7], oy = by - yr * (4 + (i % 3) * 2.5) - Math.sin(tm * 1.2 + i) * 0.6 * yr, rr = 0.75 + yr * 0.9;
      g.fillStyle = shMix(p.rugDot, col, yr); g.beginPath(); g.arc(bx, oy, rr, 0, 6.283); g.fill();
      g.fillStyle = '#ffffff'; g.globalAlpha = 0.7 * yr; g.beginPath(); g.arc(bx - rr * 0.3, oy - rr * 0.3, rr * 0.35, 0, 6.283); g.fill(); g.globalAlpha = 1;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
      const k = sh.k0 * sh.zoom; dglow(col, shEkranX(bx), shEkranY(oy), k * rr * 4.5, yr * 0.55); dglow('#ffffff', shEkranX(bx), shEkranY(oy), k * rr * 1.2, yr * 0.35);
      g.globalCompositeOperation = 'source-over'; continue;
    }
    const h = boy * yr * 1.15, sw = Math.sin(tm * 1.1 + i) * 0.2 * yr, w = sap * (0.5 + 0.5 * yr) * 1.15;
    g.fillStyle = '#cfe9ef'; g.globalAlpha = 0.95;
    g.beginPath(); g.moveTo(bx - 0.45, by); g.quadraticCurveTo(bx - 0.5 + sw, by - h * 0.5, bx - 0.35 + sw * 2, by - h); g.lineTo(bx + 0.35 + sw * 2, by - h); g.quadraticCurveTo(bx + 0.5 + sw, by - h * 0.5, bx + 0.45, by); g.fill();
    const cx = bx + sw * 2, cy = by - h;
    g.fillStyle = '#5fd0e8';
    g.beginPath(); g.ellipse(cx, cy, w, w * 0.62, 0, Math.PI, 0); g.quadraticCurveTo(cx, cy + w * 0.25, cx - w, cy); g.fill();
    g.fillStyle = '#c8fbff'; g.globalAlpha = 0.85;
    g.beginPath(); g.arc(cx - w * 0.35, cy - w * 0.32, w * 0.14, 0, 6.283); g.arc(cx + w * 0.25, cy - w * 0.4, w * 0.1, 0, 6.283); g.fill();
    g.globalAlpha = 1;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
    const tw = 0.75 + 0.25 * Math.sin(tm * 1.7 + i * 2.1), k = sh.k0 * sh.zoom;
    dglow('#5fd8ff', shEkranX(cx), shEkranY(cy - w * 0.1), k * w * 4.2, yr * 0.5 * tw);
    dglow('#e0fdff', shEkranX(cx), shEkranY(cy - w * 0.15), k * w * 1.3, yr * 0.45 * tw);
    g.globalCompositeOperation = 'source-over';
  }
}

// ay ışığı huzmesi (gece) / güneş huzmesi (sabah)
function shHuzme(gece, a, tm, renk) {
  if (a <= 0.01) return;
  const pm = renk === 'pembe';
  shOdaT();
  g.globalCompositeOperation = 'lighter';
  const P0 = SH_PEN, kay = gece ? 30 : 26;
  const gr = g.createLinearGradient(0, P0.ust, 0, 98);
  if (pm) { gr.addColorStop(0, `rgba(255,170,205,${0.22 * a})`); gr.addColorStop(1, 'rgba(255,190,170,0)'); }
  else if (gece) { gr.addColorStop(0, `rgba(140,175,255,${0.13 * a * (1 + 0.16 * Math.sin(tm * 0.43) + 0.07 * Math.sin(tm * 1.1 + 1))})`); gr.addColorStop(1, 'rgba(140,175,255,0)'); }
  else { gr.addColorStop(0, `rgba(255,226,170,${0.34 * a})`); gr.addColorStop(1, 'rgba(255,214,150,0)'); }
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(P0.x0 + 1, P0.ust + 5); g.lineTo(P0.x1 - 1, P0.ust + 5); g.lineTo(P0.x1 - kay - 4, 98); g.lineTo(P0.x0 - kay - 12, 98); g.closePath(); g.fill();
  g.globalCompositeOperation = 'source-over';
  // huzmedeki toz zerreleri
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const k = sh.k0 * sh.zoom;
  for (let i = 0; i < 16; i++) {
    const u = ((i * 0.618 + tm * 0.018 * (1 + (i % 3) * 0.3)) % 1), v = ((i * 0.37) % 1);
    const yy = lerp(P0.ust + 8, 92, v) + Math.sin(tm * 0.5 + i) * 2, xx = lerp(P0.x0, P0.x1, u) - (yy - P0.ust) * (kay / 86) - 4;
    dglow(pm ? '#ffd6e6' : gece ? '#cfe0ff' : '#fff2c8', shEkranX(xx), shEkranY(yy), k * 0.7, a * (0.25 + 0.2 * Math.sin(tm * 1.3 + i * 2)));
  }
  g.globalCompositeOperation = 'source-over';
}

// ══════════════════ AÇILIŞ ══════════════════
function shYatakPlani(P) {
  P.dogrudan = true;
  P.son = P.uyudu + 0.6;
  const sonra = 1e9;
  P.b2 = P.s2 = P.b3 = P.s3 = P.b4 = P.uyan = P.kalk = P.isik = P.dunya = P.bk0 = P.bk1 = P.bk2 = P.bk3 = sonra;
  P.erime = 2.4;
  sh78IsikPlan(P);   // Bölüm 1-8: oda kesilmeden Pırıl'ın ışığıyla rüyaya geçilir
  return sh9ErimePlan(P);   // Bölüm 9: oda vadiye erir (öbür bölümlerde olduğu gibi döner)
}
function shGirisPlan() {
  const d1 = shSure('a_giris1'), d2 = shSure('a_giris2'), d3 = shSure('a_giris3'), dU = shSure('p_uyan', 4);
  const P = { karar: 0.7, acil: 2.6, s1: 1.6 };
  P.yat0 = P.acil; P.walk = P.yat0 + 2.2; P.gir = 1; P.land = P.walk + 0.9 / 1; P.yat1 = P.walk + 4.4;   // Feza odaya girer, yatağa sıçrar, yerleşir
  P.uyku0 = P.yat1;                                // göz kapakları ağırlaşmaya başlar
  P.uyudu = Math.max(P.s1 + Math.max(d1 * 0.82, 5.6), P.uyku0 + 3.6);       // gözler kapandı
  P.ic = P.uyudu - 1.2;                            // derin, tatlı bir iç çekiş
  P.b2 = Math.max(P.s1 + d1 + 1.0, P.uyudu + 2.6); // Pırıl uyanmaya başlar
  P.s2 = P.b2 + 0.7;
  P.b3 = P.s2 + Math.max(d2 + 0.9, 5.6);           // erime
  P.s3 = P.b3 + 0.4;
  P.erime = Math.max(d3 + 2.0, 7.6);              // anlatıcı susunca uzun bir sessizlik kalmasın (≈2 sn)
  P.b4 = P.b3 + P.erime;                           // orman tamam
  P.uyan = P.b4 + 0.35;                            // Pırıl: "Feza, uyan!" (kulağına süzülürken)
  P.kalk = P.uyan + 1.1;                           // Feza doğrulur, gözlerini ovuşturur
  P.isik = Math.max(P.kalk + 2.7, P.uyan + dU - 0.9);   // parlama yükselir
  P.dunya = P.isik + 1.4;                          // tamEkran → false (oyun dünyası ışığın içinde)
  P.son = P.dunya + 2.3;
  // feza.js 'uykuya_dalis' pozu: gözler ~3.05 sn'de kapanır; o süreyi uyku0→uyudu aralığına yayarız (yavaş, ağır kırpmalar)
  P.dalK = 3.05 / Math.max(1, P.uyudu - P.uyku0);
  if (shPozVar('uykuya_dalis')) P.ic = P.uyku0 + 2.15 / P.dalK - 0.9;   // battaniyenin iç çekişi pozunkiyle aynı anda
  // yarı uyanış: Feza gözlerini aralar, parlayan Pırıl'ı görür, hayranlıkla bakar; Pırıl havalanınca gözleri yine kapanır
  P.bk0 = P.b3 - 3.4;              // kapaklar aralanmaya başlar
  P.bk1 = P.bk0 + 1.25;            // 'bakis' (bir göz kırpmasının içinde başlar)
  P.bk2 = P.bk1 + 3.46;            // 'bakis' biter (yine bir kırpmanın içinde)
  P.bk3 = P.bk2 + 1.3;             // gözler yeniden kapandı
  return shYatakPlani(P);
}
function shKisaPlan() {
  const uk = sh.uykuK || 'p_y_uyku', var1 = typeof SES !== 'undefined' && SES.LINES && SES.LINES[uk], d = var1 ? shSure(uk, 2) : 0;
  const P = { karar: 0.3, acil: 1.3, s1: 1.8 };
  P.yat0 = P.acil; P.walk = P.yat0 + 0.9; P.gir = 4.4 / 2.7; P.land = P.walk + 0.9 / P.gir; P.yat1 = P.walk + 2.7;
  P.uyku0 = P.yat1;
  P.dalK = 1.3; P.uyudu = P.uyku0 + 3.05 / P.dalK; P.ic = P.uyudu - 1.1;
  P.b2 = Math.max(P.uyudu + 0.5, P.s1 + d + 0.6); P.s2 = P.b2; P.b3 = P.b2 + 1.5; P.s3 = P.b3;
  P.erime = 2.4; P.b4 = P.b3 + P.erime; P.son = P.b4 + 2.3;
  const yok = 1e9; P.uyan = P.kalk = P.isik = P.dunya = P.bk0 = P.bk1 = P.bk2 = P.bk3 = yok;
  return shYatakPlani(P);
}
// açılışta yatan Feza'nın pozu ve poz zamanı: [poz, pozTm] ya da null (yeni pozlar yoksa eski yüz ayarı kullanılır)
function shYatisPoz(t, P, tm) {
  if (!shPozVar('uykuya_dalis')) return null;
  if (sh.atla >= 0) return ['uykuya_dalis', 3.2 + tm];
  if (t < P.uyudu) { const d = t - P.uyku0; return ['uykuya_dalis', d < 0 ? d : d * P.dalK]; }
  const bakis = shPozVar('bakis');
  if (!bakis || t < P.bk0 || t >= P.bk3) return ['uykuya_dalis', 3.05 + (t - (t >= P.bk3 && bakis ? P.bk3 : P.uyudu))];
  if (t < P.bk1) return ['uykuya_dalis', 3.05 - 0.45 * shEase(shSeg(t, P.bk0, P.bk0 + 0.9))];   // ağır kapaklar yarı aralanır
  if (t < P.bk2) return ['bakis', 2.7 + (t - P.bk1)];
  return ['uykuya_dalis', 2.6 + 0.45 * shEase(shSeg(t, P.bk2, P.bk3))];                        // gülümseyerek yine dalar
}
// canlı oyundaki Feza'nın ekran yeri (gövde ortası) – açılışın son karesi buraya oturur
function shCanliFeza() {
  if (typeof cam === 'undefined' || typeof P === 'undefined') return { x: W * 0.3, y: H * 0.7 };
  return { x: (P.x - cam.x) * S, y: (P.y - 32 - cam.y) * S };
}
function shCanliAyak() {
  if (typeof cam === 'undefined' || typeof P === 'undefined') return { x: W * 0.3, y: H * 0.76 };
  return { x: (P.x - cam.x) * S, y: (P.y - cam.y) * S };
}
// ekran pikseli → oda birimi (shEkranX/Y'nin tersi)
const shOdaX = sx => ((sx - sh.tx) / sh.zoom - W / 2 - (sh.oxp || 0) + sh.fx) / sh.k0;
const shOdaY = sy => ((sy - sh.ty) / sh.zoom + sh.fy) / sh.k0;
function shGirisDogrudanGuncelle(dt) {
  const t = sh.t, P = sh.plan;
  if (sh.atla < 0) {
    const key = sh.kisa ? sh.uykuK || 'p_y_uyku' : 'a_giris1';
    if (!sh.sesler.yatak && t >= P.s1) { sh.sesler.yatak = 1; shSoyle(key); }
    shBir('yatagaGir', P.yat1 - 2.5 / P.gir, 'yatagaGir');
    shBir('yastik', P.yat1 - 2.2 / P.gir, 'yastik');
    shBir('lambaKis', P.uyudu - 0.5, 'lambaKis');
    shBir('uykuNefes', P.uyudu + 0.3, 'uykuNefes');
    if (t >= P.ic) shAn('ic_cek');
    if (t >= P.uyudu) shAn('uyudu');
    if (P.isikGec) { shBir('k_goz', P.goz + 0.2, 'parilti'); shBir('k_isik', P.isik, 'ruyayaGec'); if (t >= P.isik) shAn('isik'); }
    if (P.ejder) { shBir('ej_goz', P.goz + 0.3, 'parilti'); if (t >= P.b3) { shAn('eriyor'); shBir('ej_erime', P.b3, 'ruyayaGec'); } if (t >= P.isik) shAn('isik'); }   // Bölüm 9: gözler parlar, oda vadiye erir, ışık
  }
  if (t >= P.karar) shAn('oda');
  sh.tam = t >= P.karar && t < P.son;
  const yuz = sh.kisa || sh.atla >= 0 ? 0 : shEase(shSeg(t, P.uyku0 - 0.8, P.uyudu + 0.6));
  const fx = shPX(lerp(-26, SH_FEZA.x - 3, yuz)), fy = shPY(lerp(56, SH_FEZA.y - 4, yuz));
  const z = 1 + 0.08 * shEase(shSeg(t, P.karar, P.uyudu)) + 0.42 * yuz;
  if (P.ejder) {   // Bölüm 9: oda eridikçe kamera yavaşça geri çekilir, vadinin tamamı görünür
    const gr = shEase(shSeg(t, P.b3 + 0.2, P.b4));
    shKamera(lerp(fx, W / 2, gr), lerp(fy, H / 2, gr), lerp(z, 1, gr), lerp(lerp(fx, W * 0.45, yuz * 0.7), W / 2, gr), lerp(lerp(fy, H * 0.55, yuz * 0.7), H / 2, gr));
  } else shKamera(fx, fy, z, lerp(fx, W * 0.45, yuz * 0.7), lerp(fy, H * 0.55, yuz * 0.7));
  sh.nefesFaz = (sh.nefesFaz || 0) + dt * lerp(1.7, 1.15, shEase(shSeg(t, P.uyku0, P.uyudu + 1.5)));
  sh.fzOlc = 1.18; sh.prOlc = 1; sh.prOyun = 0;
  if (t >= P.son && sh.bitti) {
    if (!sh.izlendi) { sh.izlendi = 1; try { localStorage.setItem(shGirisAnahtar(sh.gBolum || 1), '1'); } catch (e) {} }
    if ((P.ejder || P.isikGec) && sh.atla < 0) sh.devir = { t: 0 };   // Bölüm 9: oyunda Pırıl'ın ışığı kenarlardan içe çözülür (sh9Devir)
    const f = sh.bitti; sh.bitti = null; sh.mod = null; sh.tam = false; shGeceBirak(); f();
  }
}
function shGirisGuncelle(dt) {
  if (sh.plan.dogrudan) { shGirisDogrudanGuncelle(dt); return; }
  const t = sh.t, P = sh.plan;
  const ses = (k, at) => { if (!sh.sesler[k] && t >= at) { sh.sesler[k] = 1; shSoyle(shFk(k)); } };
  if (sh.kisa) { if (!sh.sesler.uyku && t >= P.s1) { sh.sesler.uyku = 1; shSoyle(sh.uykuK || 'p_y_uyku'); } }
  else if (sh.atla < 0) { ses('a_giris1', P.s1); ses('a_giris2', P.s2); ses('a_giris3', P.s3); }
  if (!sh.kisa) ses('p_uyan', P.uyan);
  if (sh.atla < 0) {   // yatak odası sesleri (akşam)
    shBir('yatagaGir', P.yat1 - 2.5 / P.gir, 'yatagaGir'); shBir('yastik', P.yat1 - 2.2 / P.gir, 'yastik');
    shBir('lambaKis', P.uyudu - 0.5, 'lambaKis'); shBir('uykuNefes', P.uyudu + 0.3, 'uykuNefes');
    if (t > P.uyudu + 4.5 && t < P.b3 - 1 && Math.floor((t - P.uyudu) / 4.5) !== sh.nefesN) { sh.nefesN = Math.floor((t - P.uyudu) / 4.5); shSfx('uykuNefes', 0); }
  }
  // sahne anları (müzik geçişleri için)
  if (t >= P.karar) shAn('oda');
  if (sh.atla < 0) { if (t >= P.ic) shAn('ic_cek'); if (t >= P.uyudu) shAn('uyudu'); if (t >= P.b2 + 0.3) shAn('piril_uyandi'); if (t >= P.bk1 && shPozVar('bakis')) shAn('feza_bakti'); }
  if (t >= P.b3) shAn('eriyor');
  if (t >= P.b4) { shAn('orman'); if (!sh.izlendi) { sh.izlendi = 1; try { localStorage.setItem(shGirisAnahtar(sh.gBolum || 1), '1'); } catch (e) {} } }
  if (t >= P.uyan) shAn('feza_uyan');
  if (t >= P.isik) shAn('isik');
  if (t >= P.dunya) shAn('oyun');
  sh.tam = t >= P.karar && t < (sh.kisa ? P.son + 5 : P.dunya);
  // oyun kamerasını ışık tam doluyken yerine oturt (oyuna geçişte kamera kıpırdamasın)
  if (t >= P.dunya && !sh.camOturdu) { sh.camOturdu = 1; try { if (typeof stepCam === 'function') stepCam(0, true); } catch (e) {} }
  // kamera: önce yatağa çok yavaş yaklaşır, Pırıl uyanırken ona yakınlaşır, oda eriyince geniş açıya döner,
  // en sonda uyanan Feza'ya yaklaşıp onu oyundaki yerine taşır (ışık patlaması aynı noktadan doğar)
  const yakin = shEase(shSeg(t, P.b2 - 0.6, P.b2 + 3.2)), acil = shEase(shSeg(t, P.b3 + 0.5, P.b3 + P.erime * 0.6));
  // uzun girişte: gözler ağırlaşırken kamera Feza'nın yüzüne yavaşça yaklaşır (iç çekiş, kapanan gözler okunsun)
  const yuz = sh.kisa || sh.atla >= 0 ? 0 : shEase(shSeg(t, P.uyku0 - 0.8, P.uyudu + 0.6));
  let fx = shPX(lerp(lerp(lerp(-26, SH_FEZA.x - 3, yuz), shKucak.px, yakin), -12, acil)), fy = shPY(lerp(lerp(lerp(56, SH_FEZA.y - 4, yuz), shKucak.py + 1, yakin), 50, acil));
  let z = lerp(lerp(1 + 0.08 * shEase(shSeg(t, P.karar, P.b2)) + 0.42 * yuz, 1.45, yakin), 1, acil);
  let tx = lerp(lerp(fx, W * 0.45, yuz * 0.7), W * 0.42, yakin * (1 - acil)), ty = lerp(lerp(fy, H * 0.55, yuz * 0.7), H * 0.56, yakin * (1 - acil));
  const od = sh.kisa ? 0 : shEase(shSeg(t, P.b4 - 0.5, P.isik + 0.4));
  sh.nefesFaz = (sh.nefesFaz || 0) + dt * lerp(1.7, 1.15, shEase(shSeg(t, P.uyku0, P.uyudu + 1.5)));   // uykuya daldıkça nefes yavaşlar (hız değişse de faz kopmaz)
  sh.fzOlc = 1.18; sh.prOlc = 1; sh.prOyun = 0;
  if (od > 0) {
    // devir: Feza'nın oturduğu nokta, oyundaki Feza'nın ayaklarına göre öyle yerleşir ki başı oyundaki başıyla aynı yerde olsun;
    // boyu da (o anki kamera ölçeği S ile) oyundaki boyuna iner → ışık çözülünce Feza ne büyür ne kayar.
    const A = shCanliAyak(), ofx = shPX(SH_FEZA.x), ofy = shPY(SH_FEZA.y), hx = A.x - 5 * S, hy = A.y - 20 * S;
    // fon resmi ekranı hep kaplasın: hedef noktaya ulaşmak için gereken en küçük yakınlık
    const zSon = clamp(Math.max(1.12, hx / ofx, (W - hx) / (W - ofx), hy / ofy, (H - hy) / (H - ofy)) * 1.01, 1.12, 1.7);
    fx = lerp(fx, ofx, od); fy = lerp(fy, ofy, od); z = lerp(z, zSon, od);
    tx = lerp(tx, hx, od); ty = lerp(ty, hy, od);
    sh.fzOlc = lerp(1.18, 1 / z, od); sh.prOlc = lerp(1, 1 / z, od);
    sh.prOyun = shEase(shSeg(t, P.isik - 1.4, P.isik + 0.4));
  }
  shKamera(fx, fy, z, tx, ty);
  // Zzz (uykuya dalınca başlar)
  const gozAcik = shPozVar('bakis') && sh.atla < 0 && t > P.bk0 - 2.2 && t < P.bk3 + 0.5;   // yarı uyanıkken Zzz çıkmaz
  if (t > P.uyudu + 0.6 && t < P.b3 + 2 && !gozAcik && (sh.zz.length === 0 || t - sh.zz[sh.zz.length - 1].t0 > 1.6)) sh.zz.push({ t0: t });
  if (t >= P.son && sh.bitti) { const f = sh.bitti; sh.bitti = null; sh.mod = null; sh.tam = false; shGeceBirak(); f(); }
}
// akşam: Feza odaya yürür, yatağa sıçrar, yerleşir; sonra uzanma pozuna yumuşak geçer (geçici: ayakta + sevinç pozlarıyla)
function shGirisEnt(t, P) {
  if (!P.yat1 || sh.atla >= 0 || t >= P.yat1) return null;
  const u = 1.18 * 1.4 * S / sh.k0, gx = 8, gy = 11, sx = SH_FEZA.x + gx * u, sy = SH_FEZA.y + gy * u;   // 'yatagaGir' pozunun ayakta başlangıç noktası (oda birimi)
  const E = { gx, gy, poz: 'ayakta', x: sx, y: sy, tm: 0 };
  // Feza yatakta başlar (ayakla yatağa uçar gibi görünen yürüyüş kaldırıldı): oturmuş, Pırıl kolunda; sonra yavaşça uzanır.
  const tmSon = 4.4, tmOtur = 1.9, tmSure = (tmSon - tmOtur) / P.gir;
  E.poz = 'yatagaGir'; E.standA = 1;
  E.tm = t < P.yat1 - tmSure ? tmOtur + 0.08 * (0.5 + 0.5 * Math.sin(t * 1.3)) : tmSon - (P.yat1 - t) * P.gir;
  E.bump = 0;   // sıçrama yok
  return E;
}
function shNefes(t, P, tm) {
  const taban = shEase(Math.sin(sh.nefesFaz || tm * 1.5) * 0.5 + 0.5);   // yavaş nefes: iç çekiş ve verişte hafif duraklar
  if (!P || sh.atla >= 0) return taban;
  const u = shSeg(t, P.ic, P.ic + 2.6);
  const s = u <= 0 || u >= 1 ? 0 : (u < 0.35 ? shEase(u / 0.35) : 1 - shEase((u - 0.35) / 0.65));
  return taban * (1 - s) + 2.2 * s;
}
// ── sihirli zerreler (oda biriminde): eşyalar dönüşürken onlardan akan ışık ──
function shZerreEkle(x, y, vx, vy, col, omur, r) {
  if (sh.parca.length > 280) return;
  sh.parca.push({ x, y, vx, vy, col, omur, max: omur, r, ph: Math.random() * 6.28 });
}
function shZerreAkit(dt, tm) {
  const k = sh.k0 * sh.zoom;
  if (!sh.parca.length) return;
  const Dq = sh.parca.length > 12 ? shDusuk() : null;   // çok zerre varken haleler ¼ tamponda toplanır
  if (Dq) Dq.x.globalCompositeOperation = 'lighter';
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  for (let i = sh.parca.length - 1; i >= 0; i--) {
    const q = sh.parca[i]; q.omur -= dt;
    if (q.omur <= 0) { sh.parca[i] = sh.parca[sh.parca.length - 1]; sh.parca.pop(); continue; }
    q.x += (q.vx + Math.sin(tm * 2.3 + q.ph) * 0.8) * dt; q.y += q.vy * dt; q.vx *= Math.exp(-dt * 0.8);
    const u = q.omur / q.max, a = Math.sin(u * Math.PI) * 0.85, px = shEkranX(q.x), py = shEkranY(q.y);
    if (Dq) shParlakX(Dq.x, q.col, px, py, k * q.r * (1.2 + u * 0.8), a * 0.38); else dglow(q.col, px, py, k * q.r * (1.2 + u * 0.8), a * 0.38);
    if (q.r > 0.8 && (i & 3) === 0) shParilti(px, py, k * q.r * 1.3, a * 0.8);
  }
  if (Dq) { Dq.x.globalCompositeOperation = 'source-over'; shDusukBas(Dq, 'lighter', 1); }
  g.globalCompositeOperation = 'source-over';
}
function shPirilPozVar(p) { const k = 'P_' + p; if (shPozlar[k] === undefined) { try { shPozlar[k] = typeof pirilCizPoz === 'function' && String(pirilCizPoz).indexOf("'" + p + "'") >= 0; } catch (e) { shPozlar[k] = false; } } return shPozlar[k]; }
function shPirilYer(t, P, tm) {
  const kuc = { x: shKucak.px, y: shKucak.py };
  if (P.dogrudan && P.ejder && t >= P.goz && sh.atla < 0) return { x: kuc.x, y: kuc.y, kucak: true, poz: 'uyaniyor', u: 0.44 * shEase(shSeg(t, P.goz, P.goz + 1.0)), f: 1, pat: 0 };   // Bölüm 9: peluş gözlerini açar
  if (P.dogrudan) return { x: kuc.x, y: kuc.y, kucak: true, poz: shPirilPozVar('pelus_sik') ? 'pelus_sik' : 'pelus', u: 0.5 + 0.3 * Math.sin(tm * 1.5), f: 1, pat: 0 };
  const hav = { x: -22 + Math.sin(tm * 0.7) * 3, y: 36 + Math.sin(tm * 1.3) * 1.6 };
  const kulak = { x: -38.5, y: 48.6 + Math.sin(tm * 2.2) * 0.6 };
  const yan = { x: -24.5 + Math.sin(tm * 0.9) * 0.6, y: 41 + Math.sin(tm * 2.2) * 0.8 };   // Feza doğrulunca karşısında
  const uyan = shSeg(t, P.b2 + 0.3, P.b3 + 0.2);
  if (sh.atla >= 0 && t < P.b4 + 0.01) return { x: kuc.x, y: kuc.y, kucak: true, poz: 'uyaniyor', u: Math.max(uyan, 0.6), f: 1, pat: 0 };
  if (t < P.b2 + 0.3) return { x: kuc.x, y: kuc.y, kucak: true, poz: shPirilPozVar('pelus_sik') ? 'pelus_sik' : 'pelus', u: 0.5 + 0.3 * Math.sin(tm * 1.5), f: 1, pat: 0 };   // sarılırken peluş hafifçe sıkılır (nefesle)
  if (t < P.b3 + 0.4) return { x: kuc.x, y: kuc.y, kucak: true, poz: 'uyaniyor', u: uyan, f: 1, pat: shSeg(t, P.b3 + 0.1, P.b3 + 0.4) };
  if (!sh.kalkis) sh.kalkis = { x: kuc.x, y: kuc.y };
  const k0 = sh.kalkis, pat = 1 - shSeg(t, P.b3 + 0.4, P.b3 + 0.9);
  const kalk = shEase(shSeg(t, P.b3 + 0.4, P.b3 + 2.4));
  if (t < P.b4) {
    const x = lerp(k0.x, hav.x, kalk), y = lerp(k0.y, hav.y, kalk) - Math.sin(kalk * Math.PI) * 4;
    return { x, y, kucak: false, poz: 'ucus', f: 1, pat };
  }
  if (sh.kisa) return { x: hav.x, y: hav.y, kucak: false, poz: 'ucus', f: 1, pat: 0 };
  const in2 = shEase(shSeg(t, P.b4, P.b4 + 1.1)), ks = shEase(shSeg(t, P.kalk - 0.4, P.kalk + 1.0));
  const x1 = lerp(hav.x, kulak.x, in2), y1 = lerp(hav.y, kulak.y, in2) - Math.sin(in2 * Math.PI) * 3;
  let x = lerp(x1, yan.x, ks), y = lerp(y1, yan.y, ks) - Math.sin(ks * Math.PI) * 2.5;
  // devirde oyundaki Pırıl'ın yerine süzülür (ışık çözülünce aynı yerde belirir)
  if (sh.prOyun > 0 && typeof D !== 'undefined' && typeof cam !== 'undefined' && isFinite(D.x) && isFinite(D.y)) {
    const gx = shOdaX((D.x - cam.x) * S), gy = shOdaY((D.y - cam.y) * S);
    if (isFinite(gx) && isFinite(gy) && Math.abs(gx - x) < 80 && Math.abs(gy - y) < 60) { x = lerp(x, gx, sh.prOyun); y = lerp(y, gy, sh.prOyun); }
  }
  return { x, y, kucak: false, poz: 'ucus', f: in2 > 0.35 ? -1 : 1, pat: 0 };
}
// ay ışığı huzmeleri (ormanda, yavaşça nefes alır) – oda biriminde
function shOrmanHuzme(a, tm) {
  if (a <= 0.01) return;
  shOdaT(); g.globalCompositeOperation = 'lighter';
  const bu = sh.tema === 'bulut' || sh.tema === 'cadi' || sh.tema === 'ejderha';   // bulut, Balkabağı Gecesi ve Ejderha Vadisi: sıcak (bal rengi) ışık
  for (let i = 0; i < 5; i++) {
    const ax = SH_AY.x - 4 + i * 2, aci = 1.95 + i * 0.13 + Math.sin(tm * 0.17 + i * 1.7) * 0.03, L = 110, w = 2.2 + (i % 3) * 1.6;
    const ex = ax + Math.cos(aci) * L, ey = SH_AY.y + Math.sin(aci) * L, nx = -Math.sin(aci) * w, ny = Math.cos(aci) * w;
    const al = a * (0.05 + 0.035 * Math.sin(tm * 0.5 + i * 2.1)) * (bu ? 1.5 : 1);
    const gr = g.createLinearGradient(ax, SH_AY.y, ex, ey);
    if (bu) { gr.addColorStop(0, `rgba(255,236,200,${al})`); gr.addColorStop(0.6, `rgba(255,210,200,${al * 0.5})`); gr.addColorStop(1, 'rgba(255,200,200,0)'); }
    else { gr.addColorStop(0, `rgba(170,215,255,${al})`); gr.addColorStop(0.6, `rgba(150,200,255,${al * 0.5})`); gr.addColorStop(1, 'rgba(150,200,255,0)'); }
    g.fillStyle = gr; g.beginPath(); g.moveTo(ax, SH_AY.y); g.lineTo(ex + nx * 3, ey + ny * 3); g.lineTo(ex - nx * 3, ey - ny * 3); g.closePath(); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
}
// ön plan: köşelerde koyu yaprak siluetleri (kameradan daha hızlı kayar → derinlik)
function shOnPlanCiz() {
  const c = shTuval(), x = c.getContext('2d'), k = H / 100;
  x.setTransform(k, 0, 0, k, W / 2, 0);
  const R = sh.wu / 2;
  const yaprak = (bx, by, L, aci, gen) => {
    x.save(); x.translate(bx, by); x.rotate(aci);
    x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(L * 0.5, -gen, L, 0); x.quadraticCurveTo(L * 0.5, gen, 0, 0); x.fill();
    x.restore();
  };
  const r = rng(17);
  for (const [cx, yon] of [[-R, 1], [R, -1]]) {
    x.fillStyle = '#02050d';
    x.beginPath(); x.ellipse(cx, 104, 26, 13, 0, 0, 6.283); x.fill();
    for (let i = 0; i < 14; i++) {
      const aci = -Math.PI / 2 + yon * (0.25 + r() * 1.15), L = 9 + r() * 13;
      yaprak(cx + yon * (r() * 14), 98 + r() * 4, L, aci, 1.6 + r() * 2.2);
    }
    // yaprak uçlarında ince camgöbeği kenar (oyundaki ışıkla uyumlu)
    x.strokeStyle = 'rgba(127,232,255,0.18)'; x.lineWidth = 0.25;
    x.beginPath(); x.ellipse(cx, 104, 26, 13, 0, Math.PI * 1.1, Math.PI * 1.9); x.stroke();
  }
  return c;
}
const shOnPlanAd = () => sh.tema === 'sato' ? 'onPlanS' : sh.tema === 'ejderha' ? 'onPlanE' : sh.tema === 'cadi' ? 'onPlanC' : sh.tema === 'kar' ? 'onPlanK' : sh.tema === 'senlik' ? 'onPlanF' : sh.tema === 'volkan' ? 'onPlanV' : sh.tema === 'deniz' ? 'onPlanI' : sh.tema === 'bulut' ? 'onPlanB' : 'onPlan';
function shOnPlan(a, tm) {
  if (a <= 0.01 || sh.tema === 'ipek') return;
  const ad = shOnPlanAd(), OP = shHazir(ad);
  const z = sh.zoom, zf = 1 + (z - 1) * 1.35, ox = (sh.tx - sh.fx * z) * 1.35, oy = (sh.ty - sh.fy * z) * 1.35;
  g.setTransform(zf, 0, 0, zf, ox + (W - W * zf) * 0.5 * 0, oy);
  g.globalAlpha = a; g.drawImage(OP, 0, 0); g.globalAlpha = 1;
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (sh.tema === 'kar') sh7OnKar(tm || 0, a);   // ön planda iri, yavaş kar taneleri (canlı)
  if (sh.tema === 'cadi') sh8OnToz(tm || 0, a);   // ön planda süzülen iri ışık tozları
  if (sh.tema === 'ejderha') sh9OnToz(tm || 0, a);
  if (sh.tema === 'sato' && typeof sh11OnToz === 'function') sh11OnToz(tm || 0, a);   // ön planda ay ışığı tozu, yarasa flamaları   // ön planda süzülen taç yaprakları
}
function shGirisCiz(tm, dt) {
  const t = sh.t, P = sh.plan;
  if (!sh.tam) {
    if (t < P.karar) {   // başlık → gece: zerreler süzülmeye devam eder, ekran yumuşakça kararır
      g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(4,5,14,${sh.dan ? 1 : shEase(t / P.karar)})`; g.fillRect(0, 0, W, H);
      shZerreler(tm, 0.6 * shEase(t / P.karar), true);
      return;
    }
    shGirisAcilis(tm, t, P); return;
  }
  shHazir('oda'); const fon = P.dogrudan && !(P.ejder && t >= P.b3) ? null : shHazir(sh.fon || 'orman');   // Bölüm 9: doğrudan planda da vadiye erir
  const p = SH_GECE;
  const m = shSeg(t, P.b3, P.b4);                         // erime ilerlemesi
  const halka = shEase(shSeg(m, 0.04, 0.72));
  const ej = !!P.ejder, perde = ej ? 0 : shSeg(m, 0.1, 0.6), lamba = ej ? 0 : shSeg(m, 0.12, 0.72), batt = ej ? 0 : shSeg(m, 0.22, 0.72), cerceve = ej ? 0 : shSeg(m, 0.2, 0.58), hali = ej ? 0 : shSeg(m, 0.38, 0.95);   // Bölüm 9 erimesinde eşyalar dönüşmez: oda olduğu gibi vadiye erir
  // Pırıl'ın yeri: kollarında → yükselir → süzülür → Feza'nın kulağına iner
  const pr = shPirilYer(t, P, tm);
  // 1) orman fonu, 2) erimeyen oda (dalgalı ışık halkasının dışı)
  shResimT();
  if (halka > 0) { g.drawImage(fon, 0, 0); if (sh.tema === 'deniz') { shDenizDalga(tm, halka); shResimT(); } if (sh.tema === 'bulut') { shBulutKayan(tm, halka); shResimT(); } if (sh.tema === 'senlik') { sh6Canli(0, 0, W, H, tm, halka, 0); shResimT(); } if (sh.tema === 'kar') { sh7Canli(0, 0, W, H, tm, halka, 0); shResimT(); } if (sh.tema === 'cadi') { sh8Canli(0, 0, W, H, tm, halka, 0); shResimT(); } if (sh.tema === 'ejderha') { sh9Canli(0, 0, W, H, tm, halka, 0); shResimT(); } if (sh.tema === 'ipek' && typeof sh13Canli === 'function') { sh13Canli(0, 0, W, H, tm, halka, 0); shResimT(); } }
  if (halka < 1) {
    if (halka <= 0) g.drawImage(sh.oda, 0, 0);
    else {
      const cxp = shPX(pr.x), cyp = shPY(pr.y), Rm = Math.hypot(W, H) * 1.15, Rr = halka * Rm;
      const kenar = (i, n) => { const a = i / n * 6.283; return [a, Rr * (1 + 0.07 * Math.sin(a * 5 + tm * 1.3) + 0.04 * Math.sin(a * 9 - tm * 2.1))]; };
      g.save(); g.beginPath(); g.rect(-W, -H, W * 3, H * 3);
      for (let i = 0; i <= 120; i++) { const [a, rr] = kenar(i, 120), xx = cxp + Math.cos(a) * rr, yy = cyp + Math.sin(a) * rr; if (i === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy); }
      g.closePath();
      if (sh.odaDesenC !== sh.oda) { sh.odaDesenC = sh.oda; sh.odaDesen = null; try { sh.odaDesen = g.createPattern(sh.oda, 'no-repeat'); } catch (e) {} }
      if (sh.odaDesen) { g.fillStyle = sh.odaDesen; g.fill('evenodd'); } else { g.clip('evenodd'); g.drawImage(sh.oda, 0, 0); }
      g.restore();
      // halkanın ışıklı kenarı
      const bu3 = sh.tema === 'bulut', ej9 = sh.tema === 'ejderha';
      { const Dq = shDusuk(), x = Dq.x, z = sh.zoom, q = Dq.q;
        x.setTransform(z * q, 0, 0, z * q, (sh.tx - sh.fx * z) * q, (sh.ty - sh.fy * z) * q);
        x.lineJoin = 'round'; x.lineWidth = sh.k0 * 2.4; x.strokeStyle = bu3 ? `rgba(255,190,220,${0.22 * (1 - halka)})` : ej9 ? `rgba(170,240,200,${0.24 * (1 - halka)})` : `rgba(190,160,255,${0.16 * (1 - halka)})`;
        x.beginPath();
        for (let i = 0; i <= 120; i++) { const [a, rr] = kenar(i, 120); if (i === 0) x.moveTo(cxp + Math.cos(a) * rr, cyp + Math.sin(a) * rr); else x.lineTo(cxp + Math.cos(a) * rr, cyp + Math.sin(a) * rr); }
        x.stroke(); x.lineWidth = Math.max(sh.k0 * 0.45, 1.6 / (z * q)); x.strokeStyle = bu3 ? `rgba(255,240,225,${0.6 * (1 - halka)})` : ej9 ? `rgba(240,255,235,${0.62 * (1 - halka)})` : `rgba(240,225,255,${0.5 * (1 - halka)})`; x.stroke();
        shDusukBas(Dq, 'lighter', 1); shResimT(); }
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 26; i++) {
        const [a, rr] = kenar(i + tm * 0.6, 26), tw = 0.5 + 0.5 * Math.sin(tm * 3 + i * 2.3);
        shParilti(cxp + Math.cos(a) * rr, cyp + Math.sin(a) * rr, sh.k0 * (1.2 + tw * 1.6), (1 - halka) * (0.4 + tw * 0.5));
      }
      g.globalCompositeOperation = 'source-over';
    }
  }
  // 3) ay ışığı huzmesi (oda eridikçe söner); ormanda aydan inen yumuşak ışık huzmeleri
  shHuzme(true, 1 - halka, tm);
  shOrmanHuzme(halka, tm);
  // gece lambası Feza uyuyunca kısılır; oda biraz kararır (Pırıl'ın ışığı öne çıksın)
  const kis = sh.atla >= 0 ? 1 : shEase(shSeg(t, P.uyudu - 0.5, P.uyudu + 2.6));
  if (kis > 0 && halka < 1) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(5,6,22,${0.26 * kis * (1 - halka)})`; g.fillRect(0, 0, W, H); }
  if (halka < 1) { const wa = 0.08 * (1 - kis) * (1 - halka); if (wa > 0.003) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,190,110,${wa})`; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; } }   // lamba yanıkken oda sıcak aydınlık
  // 4) değişen parçalar (Bölüm 3: önce pencerede şafak söker, odaya pembe ışık düşer)
  const B3 = sh.tema === 'bulut';
  if (B3) shPencerePembe(shEase(shSeg(t, P.b2 - 0.8, P.b3 + 0.3)) * (1 - halka), tm);
  const lyan = lerp(1.15, 0.5, kis) + 0.55 * shEase(lamba);
  if (B3) shLamba(p, lamba, tm, true, lyan);   // güneş bulut perdelerin ARKASINDA doğar
  shPerdeler(p, perde, tm, 0);
  if (!B3) shLamba(p, lamba, tm, true, lyan);
  if (sh.tema === 'kar') sh7Oda(p, tm, 1 - halka, sh.atla >= 0 ? 1 : shEase(shSeg(t, P.uyudu - 1.0, P.uyudu + 0.4)));   // Kuzey Işıkları: kâğıt kar taneleri
  if (sh.tema === 'cadi') { const uy = sh.atla >= 0 ? 1 : shEase(shSeg(t, P.uyudu - 1.0, P.uyudu + 0.4)), kg = sh.atla >= 0 ? 0 : Math.sin(Math.PI * shSeg(t, P.uyudu - 0.7, P.uyudu - 0.15)); sh8Oda(p, tm, 1 - halka, uy, kg); }

  if (sh.tema === 'sato' && typeof sh11Oda === 'function') sh11Oda(tm, 1 - halka, true);   // Bölüm 11 (sahne11.js)
  if (sh.tema === 'ejderha') { const uy = sh.atla >= 0 ? 1 : shEase(shSeg(t, P.uyudu - 1.0, P.uyudu + 0.4)), sl = sh.atla >= 0 ? 0 : Math.sin(Math.PI * 3 * shSeg(t, P.uyudu - 0.9, P.uyudu - 0.1)) * (1 - shSeg(t, P.uyudu - 0.9, P.uyudu - 0.1)); sh9Oda(p, tm, 1 - halka, uy, sl); }   // Ejderha Vadisi: pul flamalar, kâğıt ejderha, yumurta gece lambası   // Balkabağı Gecesi: kâğıt yarasa süsü, kabak gece lambası
  shHali(p, hali, tm);
  sh.yDy = (sh.secDy || 0) * (1 - shEase(clamp(cerceve * 1.6, 0, 1)));   // seçimden gelen yatak kayması oda eridikçe söner
  shYatakArka(p, batt, cerceve, tm);
  // Bölüm 9: halkanın kenarından vadinin renkleriyle ışık zerreleri saçılır
  if (ej && m > 0 && m < 0.85 && dt > 0) { const r = Math.random, Rr = halka * Math.hypot(W, H) * 1.15 / sh.k0; for (let i = 0; i < 2; i++) if (r() < dt * 30) { const an = r() * 6.283; shZerreEkle(pr.x + Math.cos(an) * Rr, pr.y + Math.sin(an) * Rr, Math.cos(an) * 4, Math.sin(an) * 4 - 2, SH9_RENK[(r() * 6) | 0], 1.2 + r() * 0.8, 0.6 + r() * 0.6); } }
  // dönüşen eşyalardan akan ışık zerreleri
  if (m > 0 && m < 1 && dt > 0 && !ej) {
    const r = Math.random;
    if (lamba > 0.03 && lamba < 0.97) { const L = shLambaYer(lamba); if (r() < dt * 26) shZerreEkle(L.x + (r() - 0.5) * 2, L.y + (r() - 0.5) * 2, (r() - 0.5) * 3, (r() - 0.3) * 3, lamba < 0.5 || B3 ? '#ffd9a0' : '#cfe6ff', 1.0 + r() * 0.6, 0.5 + r() * 0.5); }
    if (perde > 0.08 && perde < 0.92 && r() < dt * 40) { const yon = r() < 0.5 ? -1 : 1; shZerreEkle((yon < 0 ? SH_PEN.x0 - 4.5 : SH_PEN.x1 + 4.5) - yon * r() * 7, lerp(6, 52, r()), (r() - 0.5) * 1.5, 1.5 + r() * 2.5, B3 ? (r() < 0.5 ? '#ffd0e4' : '#fff0d0') : sh.tema === 'kar' ? (r() < 0.5 ? '#eef6ff' : '#bff5dc') : sh.tema === 'cadi' ? (r() < 0.5 ? '#ffc27a' : '#d8c2ff') : sh.tema === 'senlik' ? (r() < 0.5 ? '#ffd6ee' : '#ffe6a0') : sh.tema === 'gol' ? (r() < 0.5 ? '#ffe9a8' : '#cfe0ff') : r() < 0.5 ? '#9ff0d0' : '#7fe8ff', 1.6 + r(), 0.6 + r() * 0.5); }
    if (cerceve > 0.05 && cerceve < 0.95 && r() < dt * 30) shZerreEkle(lerp(SH_YATAK.x0 - 2, SH_YATAK.x1 + 2, r()), lerp(62, 74, r()), (r() - 0.5) * 1.5, -2 - r() * 3, r() < 0.5 ? '#c9b2ff' : '#ffe0ff', 1.4 + r(), 0.5 + r() * 0.5);
    if (hali > 0.02 && hali < 0.75 && r() < dt * 36) { const qi = Math.floor(r() * SH_MANTAR.length), q = SH_MANTAR[qi]; shZerreEkle(SH_HALI.x + q[0] + (r() - 0.5), SH_HALI.y + q[1], (r() - 0.5) * 2.5, -3 - r() * 4, B3 ? SH_GK[qi % 7] : sh.tema === 'kar' ? SH7_RENK[qi % 4] : sh.tema === 'cadi' ? SH8_RENK[qi % 5] : sh.tema === 'senlik' ? SH6_RENK[qi % 5] : sh.tema === 'gol' ? (r() < 0.6 ? '#ffb6d9' : '#fff0f8') : r() < 0.6 ? '#5fd8ff' : '#e0fdff', 1.2 + r() * 0.8, 0.5 + r() * 0.6); }
    if (batt > 0.15 && batt < 0.9 && r() < dt * 22) shZerreEkle(lerp(-60, 15, r()), lerp(60, 84, r()), (r() - 0.5) * 2, -1.5 - r() * 2.5, B3 ? (r() < 0.5 ? '#ffe0ee' : '#fff0c8') : r() < 0.5 ? '#b9ffd8' : '#d9c6ff', 1.6 + r(), 0.5 + r() * 0.5);
  }
  // Feza: önce gözleri açık; yavaşça uykuya dalar (iç çeker), Pırıl kollarında. Ormanda uyanıp doğrulur.
  const nefes = shNefes(t, P, tm);
  let pirilParla = shEase(shSeg(t, P.b2 + 1.2, P.b3 + 0.5));
  if (sh.kisa) pirilParla = Math.max(pirilParla, 0.45 * shEase(shSeg(t, P.acil, P.acil + 1.2)) * (0.8 + 0.2 * Math.sin(tm * 2.2)));   // Pırıl baştan hafifçe nabız atar
  if (P.ejder && sh.atla < 0) pirilParla = Math.max(pirilParla, shEase(shSeg(t, P.goz, P.b3 + 0.4)) * (0.9 + 0.1 * Math.sin(tm * 3)));   // Bölüm 9: Pırıl uyanır, ışığı büyür
  if (pr.kucak) shPirilIsik(shKucak.px, shKucak.py, tm, pirilParla);
  const kalkT = t - P.kalk, ent = shGirisEnt(t, P);
  if (kalkT > 0) {
    const suPoz = sh.tema === 'deniz' && kalkT > 4.4;
    shFeza(SH_FEZA.x, SH_FEZA.y - (suPoz ? shEase(shSeg(kalkT, 4.4, 5.7)) * 2 : 0), sh.fzOlc, suPoz ? 'yuzme' : 'uyanis', tm, null, undefined, undefined, suPoz ? tm : kalkT);
  } else {
    const ic = sh.atla >= 0 ? 0 : shSeg(t, P.ic + 0.75, P.ic + 2.4), ac = Math.sin(ic * Math.PI);
    const yp = shYatisPoz(t, P, tm);
    // feza.js 'uykuya_dalis'/'bakis' bilmiyorsa yedek: düz 'uyku'
    if (ent) shPiril(SH_PIRIL.x, SH_PIRIL.y + 0.5, sh.fzOlc * 0.92, 'pelus', tm, 1);   // peluş Pırıl yastıkta bekler
    if (ent && ent.poz === 'ayakta') { if (ent.standA > 0.01) { g.globalAlpha = ent.standA; shFeza(ent.x, ent.y, sh.fzOlc, 'ayakta', tm); g.globalAlpha = 1; } }
    else if (ent) { shFeza(SH_FEZA.x, SH_FEZA.y, sh.fzOlc, 'yatagaGir', ent.tm); }
    else if (!ent) shFeza(SH_FEZA.x, SH_FEZA.y, sh.fzOlc, yp ? yp[0] : 'uyku', tm, pr.kucak ? pr.poz : null, pr.u, undefined, yp ? yp[1] : tm);
    if (ac > 0.05) {   // iç çekişin minik, ışıklı nefesi
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
      const k = sh.k0 * sh.zoom;
      for (let i = 0; i < 3; i++) { const q = clamp(ic * 1.3 - i * 0.15, 0, 1); dglow('#e6dcff', shEkranX(-39.5 + q * 5 + i), shEkranY(56.5 - q * 4 - i * 0.6), k * (0.8 + q * 1.4), Math.sin(q * Math.PI) * 0.22); }
      g.globalCompositeOperation = 'source-over';
    }
  }
  shBattaniye(p, batt, tm, nefes + (ent ? ent.bump * 1.8 : 0), kalkT > 0 ? shEase(shSeg(kalkT, 0, 1.1)) : 0);
  if (P.ejder && t > P.goz && sh.atla < 0) sh9Gozler(tm, shEase(shSeg(t, P.goz + 0.25, P.goz + 0.9)) * (1 - 0.6 * shSeg(t, P.b3 + 0.6, P.b4)));   // Pırıl'ın gözleri parlar
  if (!pr.kucak) { shPirilIsik(pr.x, pr.y, tm, pirilParla * (0.55 + 0.45 * sh.prOlc)); shPiril(pr.x, pr.y, sh.prOlc, pr.poz, tm, pr.f); }
  if (pr.pat > 0) {   // kucaktan havalanırken ışık pırıltısı (poz değişimini yumuşatır)
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
    const k = sh.k0 * sh.zoom; dglow('#f4e6ff', shEkranX(pr.x), shEkranY(pr.y), k * 9 * pr.pat, pr.pat * 0.9);
    g.globalCompositeOperation = 'source-over';
  }
  sh.yDy = 0;
  shZerreAkit(dt, tm);
  shOnPlan(shEase(shSeg(m, 0.45, 1)), tm);
  // Zzz
  shZzz(t, tm, P);
  // süzülen ışık zerreleri (erirken çoğalır)
  if (B3) { shZerreler(tm, (0.25 + 0.75 * halka) * (1 - halka), true); shZerreler(tm, (0.25 + 0.75 * halka) * halka, 'bulut'); }
  else shZerreler(tm, 0.25 + 0.75 * halka, true);
  // ışık patlaması: Pırıl, Feza'yı uyandırırken (Bölüm 9: Pırıl'ın ışığı vadiyi doldurur, oyuna onun içinden geçilir)
  if (P.isikGec && t > P.goz && sh.atla < 0) {   // Bölüm 1-8: kucaktaki Pırıl rüyanın renginde ışıldar (kar: nane, cadı: kabak altını)
    const u = shEase(shSeg(t, P.goz, P.isik + 0.4)), k = sh.k0 * sh.zoom, cx = shEkranX(shKucak.px), cy = shEkranY(shKucak.py - 1), nb = 1 + 0.08 * Math.sin(tm * 3);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
    dglow(sh.tema === 'kar' ? '#9ff0d0' : sh.tema === 'cadi' ? '#ffc27a' : SH_BALON_RENK[sh.fon] || '#9ff0d0', cx, cy, k * 16 * u * nb, 0.45 * u); dglow('#e6d6ff', cx, cy, k * 7 * u, 0.55 * u);
    for (let i = 0; i < 6; i++) { const an = tm * 1.2 + i * 1.047, rr = k * (4 + 3 * u); shParilti(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * 0.7, k * 0.9 * u, u * (0.6 + 0.4 * Math.sin(tm * 4 + i))); }
    g.globalCompositeOperation = 'source-over';
  }
  if ((P.ejder || P.isikGec) && t > P.isik) { const yk = shEase(shSeg(t, P.isik, P.son)), cx = shEkranX(shKucak.px), cy = shEkranY(shKucak.py - 1); g.setTransform(1, 0, 0, 1, 0, 0); shIsikPerde(cx, cy, Math.hypot(W, H) * (0.25 + 0.9 * yk), yk, yk, yk * yk); }
  else if (t > P.isik - 0.01) shParlama(t, P, tm);
  // açılışta karanlıktan beliriş
  const kar = 1 - shEase(shSeg(t, P.karar, P.acil));
  if (kar > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(4,5,14,${kar})`; g.fillRect(0, 0, W, H); shZerreler(tm, 0.6 * kar, true); }
  if (sh.kisa && !P.dogrudan) {   // eski dönüşüm planının kısa kapanışı; doğrudan yatak planında çalışmaz
    const u = shEase(shSeg(t, P.b4 + 1.0, P.son));
    if (u > 0) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      // Bölüm 3: perde önce koyu gül rengi, sonra gece laciverti (bitişte tam rgb 4,5,14)
      g.fillStyle = B3 ? shMix('#5a2a5e', '#04050e', shEase(shSeg(u, 0.35, 1)), u) : `rgba(4,5,14,${u})`; g.fillRect(0, 0, W, H);
    }
  }
}
function shPirilIsik(x, y, tm, parla) {
  if (sh.tema === 'deniz') parla *= 0.38;
  if (parla <= 0) return;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const px = shEkranX(x), py = shEkranY(y - 1), k = sh.k0 * sh.zoom, nb = 1 + Math.sin(tm * 2.4) * 0.08;
  dglow('#b88aff', px, py, k * 22 * parla * nb, 0.5 * parla);
  dglow('#ffe0ff', px, py, k * 6 * parla, 0.3 * parla);
  for (let i = 0; i < 6; i++) {   // etrafında dönen küçük parıltılar
    const a = tm * 0.9 + i * 1.047, rr = k * (6 + 2.2 * Math.sin(tm * 1.7 + i)) * parla;
    shParilti(px + Math.cos(a) * rr, py + Math.sin(a) * rr * 0.6, k * (0.7 + 0.5 * Math.sin(tm * 4 + i)), parla * 0.8);
  }
  g.globalCompositeOperation = 'source-over';
}
function shZzz(t, tm, P) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const k = sh.k0 * sh.zoom;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = sh.zz.length - 1; i >= 0; i--) {
    const z = sh.zz[i], u = (t - z.t0) / 3.6;
    if (u >= 1) { sh.zz.splice(i, 1); continue; }
    const x = SH_FEZA.x - 8 + u * 8 + Math.sin(u * 6) * 1.4, y = SH_FEZA.y - 9 - u * 15;
    let a = Math.sin(u * Math.PI) * 0.85 * (1 - shSeg(t, P.b3, P.b3 + 1.5));
    if (P.bk0 && shPozVar('bakis') && sh.atla < 0) a *= 1 - shSeg(t, P.bk0 - 0.8, P.bk0 + 0.2);
    if (a <= 0) continue;
    g.globalAlpha = a; g.fillStyle = '#d9ccff';
    g.font = `700 ${Math.round(k * (2.6 + u * 2.4))}px ui-rounded, "Trebuchet MS", system-ui, sans-serif`;
    g.fillText('z', shEkranX(x), shEkranY(y));
  }
  g.globalAlpha = 1;
}
const shZer = [];
function shZerreler(tm, a, gece) {   // gece: true (camgöbeği/lila), false (altın), 'bulut' (pembe/altın)
  if (!shZer.length) { const r = rng(42); for (let i = 0; i < 34; i++) shZer.push({ x: r(), y: r(), s: 0.5 + r(), h: r() * 6.28, v: 0.004 + r() * 0.01 }); }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  for (const z of shZer) {
    const yy = ((z.y - tm * z.v) % 1 + 1) % 1, xx = z.x + Math.sin(tm * 0.4 + z.h) * 0.02;
    const tw = 0.5 + 0.5 * Math.sin(tm * 1.5 + z.h * 3);
    dglow(gece === 'bulut' ? (z.s > 1.1 ? '#ffc6de' : '#ffe9b8') : gece ? (z.s > 1.1 ? '#c9b2ff' : '#9ff0ff') : '#fff0c0', xx * W, yy * H, H * 0.008 * z.s * (1 + tw), a * (0.25 + 0.45 * tw));
  }
  g.globalCompositeOperation = 'source-over';
}
// mor-beyaz ışık: tepe noktasında dünya görünür olur
function shParlama(t, P, tm) {
  const yuksel = shEase(shSeg(t, P.isik, P.dunya));
  g.setTransform(1, 0, 0, 1, 0, 0);
  const L = shCanliFeza(), cx = L.x, cy = L.y;   // açılıştaki çözülmeyle aynı merkez
  shIsikPerde(cx, cy, Math.hypot(W, H) * (0.3 + 0.75 * yuksel), yuksel, yuksel, yuksel * yuksel);
}
// açılışın sonundaki ışık perdesi: iki taraf (sahne ve oyun) aynı renk ve biçimi kullanır; tepe noktasında tamamen opak
function shIsikPerde(cx, cy, R, aIc, aOrta, aDis) {
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R);
  gr.addColorStop(0, `rgba(255,248,255,${aIc})`); gr.addColorStop(0.3, `rgba(230,212,255,${Math.max(aOrta, aIc * 0.8)})`);
  gr.addColorStop(0.65, `rgba(205,178,255,${aOrta})`); gr.addColorStop(1, `rgba(186,156,255,${aDis})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
// tamEkran bitti: gerçek dünya alttan, ışık kenarlardan içe doğru çözülür; Feza ışığın içinden belirir
function shGirisAcilis(tm, t, P) {
  const u = shSeg(t, P.dunya, P.son);
  g.setTransform(1, 0, 0, 1, 0, 0);
  const L = shCanliFeza(), fx = L.x, fy = L.y;
  // ışık kenarlardan içe doğru çözülür, Feza'nın etrafı en son açılır
  shIsikPerde(fx, fy, Math.hypot(W, H) * lerp(1.05, 0.7, shEase(u)), 1 - shEase(shSeg(u, 0.2, 1)), 1 - shEase(shSeg(u, 0.05, 0.75)), 1 - shEase(shSeg(u, 0, 0.55)));
  // ekranda süzülerek sönen ışık zerreleri + Feza'nın etrafında dönen parıltılar
  shZerreler(tm, (1 - u) * 0.9, true);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const a = tm * 1.6 + i * 0.449, rr = H * (0.05 + 0.1 * u) * (0.7 + 0.3 * Math.sin(i * 2.1));
    shParilti(fx + Math.cos(a) * rr, fy + Math.sin(a) * rr * 0.75, H * 0.012 * (1 + Math.sin(tm * 5 + i) * 0.4), (1 - u) * 0.9);
  }
  g.globalCompositeOperation = 'source-over';
}

// ══════════════════ KAPANIŞ ══════════════════
// Bölüm 2'de final anlatımı için 'a_y_final1..3' cümleleri varsa (ses.js) onlar söylenir; yoksa Bölüm 1 metni
// Bölüm 3'te 'a_b_final1..3' (yoksa Bölüm 1 metni: yıldız cümleleri bulut rüyasına uymaz)
function shFk(k) {
  try {
    const b = sh.fBolum || (typeof BOLUM_NO !== 'undefined' ? BOLUM_NO : 1);
    if (b === 14 && /^a_final[123]$/.test(k)) return k === 'a_final1' && !(typeof V14 !== 'undefined' && V14.reunited) ? 'a_uz_final1_dost' : 'a_uz_final' + k.slice(-1);
    if (b >= 2 && typeof SES !== 'undefined' && SES.LINES) { const k2 = (b === 13 ? 'a_ip_' : b === 12 ? 'a_q_' : b === 11 ? 'a_s_' : b === 9 ? 'a_e_' : b === 8 ? sh8Harf('a_') : b === 7 ? sh7Harf('a_') : b === 6 ? 'a_f_' : b === 5 ? 'a_v_' : b === 4 ? 'a_i_' : b === 3 ? 'a_b_' : 'a_y_') + k.slice(2); if (SES.LINES[k2] || (window.VOICE_DUR && VOICE_DUR[k2])) return k2; }
  } catch (e) {}
  return k;
}
// Bölüm 6–8: ilk final cümlesi dünyadaki kutlamada söylendiyse sabaha durmadan geçilir (Bölüm 4/5 gibi)
function shF6Hizli() { const b = sh.fBolum || 1; return (b === 6 || b === 7 || b === 8 || b === 9 || b === 11) && !!sh.f6Ozet || b === 13; }
function shFinalPlan() {
  const d1 = shSure(shFk('a_final1')), d2 = shSure(shFk('a_final2')), d3 = shSure(shFk('a_final3'));
  const P = { s1: 0.6 };
  P.isik = P.s1 + Math.max(d1 + 0.8, 4.6);   // altın ışık dolmaya başlar
  P.dolu = P.isik + 2.6;                     // ekran tamamen ışık → oda
  P.oda = P.dolu + 5.0;                      // ışık bir süre çiçek açar (müziğin doruğu), sonra sabah odası belirir
  if ((sh.fBolum || 1) === 4 || (sh.fBolum || 1) === 5 || shF6Hizli()) { P.isik = .35; P.dolu = P.isik + 1.8; P.oda = P.dolu + .35; }   // inci kutlaması dünyada tamamlandı; sabaha durmadan geç
  P.f6Hizli = shF6Hizli();
  P.s2 = P.oda + 1.6;
  P.yak = P.s2 + Math.max(d2 * 0.45, 2.6);   // Feza peluş Pırıl'ı yanağına kaldırır, kamera iki yüze yaklaşır
  // Bölüm 3: anlatıcı "Pencereden bakmış ki..." derken pencerede gökkuşağı çizilir, kamera pencereye döner;
  // "göz kırpmış"ta yüzlere yaklaşılır
  P.gk = P.oda + 0.9;
  if ((sh.fBolum || 1) === 3) { P.gk = P.s2 + Math.min(3.0, d2 * 0.31); P.yak = Math.max(P.s2 + d2 * 0.78, P.gk + 4.4); }
  P.kirp = Math.max(P.yak + 1.5, P.s2 + d2 - 0.8);   // göz kırpma: anlatıcı "göz kırpmış" derken
  P.kirpBit = P.kirp + 1.7;
  P.s3 = P.kirpBit + 0.2;
  P.son = P.s3 + Math.max(d3 + 1.2, 4.0);
  return P;
}
function shFinalGuncelle(dt) {
  const t = sh.t, P = sh.plan;
  const ses = (k, at) => { if (!sh.sesler[k] && t >= at) { sh.sesler[k] = 1; shSoyle(k); } };
  if ((sh.fBolum || 1) !== 4 && (sh.fBolum || 1) !== 5 && !sh.plan.f6Hizli) { if ((sh.fBolum || 1) >= 6) sh.f6Ozet = 1; ses(shFk('a_final1'), P.s1); }   // deniz ve yanardağ son sözü dünyadaki kutlama içinde söylendi
  ses(shFk('a_final2'), P.s2); ses(shFk('a_final3'), P.s3);
  shAn('kutlama');
  shBir('kus0', P.isik + 0.6, 'sabahKus', 0); shBir('kus1', P.isik + 2.2, 'sabahKus', 1); shBir('kus2', P.dolu + 1.2, 'sabahKus', 2);   // ışık dolarken kuşlar
  shBir('gerinme', P.oda + 1.3, 'gerinme'); shBir('esneme', P.oda + 2.6, 'fezaEsne'); shBir('kus3', P.oda + 2.0, 'sabahKus', 1);
  shBir('gozKirpSfx', P.kirp + 0.15, 'gozKirp');
  if (t >= P.isik) shAn('isik'); if (t >= P.dolu) shAn('beyaz'); if (t >= P.oda) shAn('sabah');
  if (t >= P.oda + 0.9) shAn('feza_uyandi'); if (t >= P.kirp) shAn('goz_kirp'); if (t >= P.s3) shAn('son_soz');
  if (!sh.cin && t >= P.kirp) { sh.cin = 1; if (typeof AU !== 'undefined' && AU.sfx) try { AU.sfx('bloom', 0); } catch (e) {} }
  // ekran ışıkla tamamen dolunca dünya artık çizilmez (tamEkran), kopya tuvali de bırakılır
  sh.tam = t >= P.dolu || (t >= P.isik && shEase(shSeg(shEase(shSeg(t, P.isik, P.dolu)), 0.55, 1)) >= 0.999);
  if (sh.tam && shKopya) shKopya = shBirak(shKopya);
  if (t >= P.dolu + 0.6 && !sh.yakinHazir) { sh.yakinHazir = 1; try { shSabahYakin(true); } catch (e) { shHata('odaYakin', e); } }
  // sabah: önce bütün oda (yatakta uyuyan Feza), Feza doğrulunca ona yaklaşılır; Pırıl'ı yanağına kaldırınca
  // iki yüz ekranı doldurur (göz kırpma büyük ve açık okunsun)
  sh.kirpK = shEase(shSeg(t, P.yak - 0.2, P.yak + 1.2));
  let yu = shEase(shSeg(t, P.oda + 1.2, P.oda + 4.2));
  const yk = shEase(shSeg(t, P.yak - 0.4, P.yak + 1.6));
  // Bölüm 3: Feza uyanırken kamera önce pencereye (gökkuşağına) döner, sonra yüzlere yaklaşır
  const pb = (sh.fBolum || 1) === 3 ? shEase(shSeg(t, P.gk - 1.0, P.gk + 0.7)) * (1 - shEase(shSeg(t, P.yak - 1.4, P.yak - 0.1))) : 0;
  if (pb > 0) yu *= 1 - pb;
  const yatay = W > H * 1.1, px0 = yatay ? -3 : 30, py0 = yatay ? 42 : 36, pz = yatay ? 1.42 : 1.3;
  const fx = shPX(lerp(lerp(shKucak.x, shKucak.x + 3.8, yk), px0, pb)), fy = shPY(lerp(lerp(lerp(shKucak.y, shKucak.y - 2, yu), shKucak.y - 2.9, yk), py0, pb));
  const z = lerp(1.14 + 0.86 * yu, pz, pb) + 1.42 * yk + 0.06 * shSeg(t, P.kirp, P.son);   // göz kırpma yakın çekimi ≈ 3.4×
  shKamera(fx, fy, z, lerp(lerp(lerp(W * 0.4, W * 0.5, yu), W * 0.5, yk), W * 0.5, pb), lerp(lerp(lerp(fy, H * 0.55, yu), H * 0.5, yk), H * 0.5, pb));
  if (t >= P.son && sh.bitti) { shAn('son'); const f = sh.bitti; sh.bitti = null; sh.sonGorunum = true; f(); }
}
// sabah odasının yakın çekim kopyası: yatak ve pencere çevresi, 2 kat çözünürlük (bir kez, ekran ışıkla doluyken hazırlanır)
// bölge yalnız yakın çekimlerde (zoom >= 1.7: uyanış, göz kırpma, bitiş ekranı) görünen kısım, 1.8 kat çözünürlük
// (eskiden 80×62 birim 2 kat: 3279×2540 = 33 MB; şimdi 76×63 birim 1.8 kat: 2802×2323 = 26 MB, 3.4× yakın çekimde fark seçilmez)
function shYakinAdim() {
  const k = sh.k0, sc = 1.8, yw = Math.max(40, sh.wu * 0.3);
  const ox = shPX(-26 - yw), oy = shPY(25), w = (Math.min(yw * 2 - 4, sh.wu + 2) * k) * sc, h = (63 * k) * sc;   // dik ekranda ekran genişliğinden geniş olmasın
  const A = shOdaAdim(SH_SABAH, { sc, ox, oy, w, h });
  A.deger = { c: A.c, sc, ox, oy, w: A.c.width, h: A.c.height, W, H };
  return A;
}
function shSabahYakin(hazirla) {
  if (sh.odaYakin && sh.odaYakin.W === W && sh.odaYakin.H === H) return sh.odaYakin;
  return hazirla ? shHazir('odaYakin') : null;
}
// sabah odası sahnesi (bitiş ekranının arkasında da kullanılır)
function shSabahCiz(tm, t, P, sonKirp) {
  const p = SH_SABAH;
  // yakın çekimde (zoom ≥ 1.7) yatağın çevresinin 2 kat çözünürlüklü kopyası (duvar kâğıdı, pencere keskin kalsın)
  const Y = sh.zoom >= 1.7 && shSabahYakin(!sh.mod), z = sh.zoom;
  if (Y && (0 - sh.tx) / z + sh.fx >= Y.ox && (W - sh.tx) / z + sh.fx <= Y.ox + Y.w / Y.sc && (0 - sh.ty) / z + sh.fy >= Y.oy && (H - sh.ty) / z + sh.fy <= Y.oy + Y.h / Y.sc) {
    g.setTransform(z / Y.sc, 0, 0, z / Y.sc, sh.tx + (Y.ox - sh.fx) * z, sh.ty + (Y.oy - sh.fy) * z);
    g.imageSmoothingQuality = 'high'; g.drawImage(Y.c, 0, 0); sh.sabahY = 1;
  } else { const B = shHazir('odaSabah'); shResimT(); g.drawImage(B, 0, 0); sh.sabahY = 0; }
  shHuzme(false, 1, tm);
  const fb = sh.fBolum || 1, b2 = fb === 2, b3 = fb === 3;
  if (fb === 4) shDenizSabah(tm);
  if (fb === 4) shSabahPencere(tm, true);
  else if (fb === 14) { if (typeof sh14Sabah === 'function') sh14Sabah(tm,P?shEase(shSeg(t,P.oda-1.2,P.oda+1.4)):1); }
  else if (fb === 13) { if (typeof sh13Sabah === 'function') sh13Sabah(tm, P ? shEase(shSeg(t, P.oda - 1.2, P.oda + 1.4)) : 1); }
  else if (fb === 12) { if (typeof sh12Sabah === 'function') sh12Sabah(tm, P ? shEase(shSeg(t, P.oda - 1.2, P.oda + 1.4)) : 1); }
  else if (fb === 11) { if (typeof sh11Sabah === 'function') sh11Sabah(tm, P ? shEase(shSeg(t, P.oda - 1.2, P.oda + 1.4)) : 1); }
  else if (fb === 9) sh9Sabah(tm, P ? shEase(shSeg(t, P.oda - 1.2, P.oda + 1.4)) : 1);
  else if (fb === 8) sh8Sabah(tm, P ? shEase(shSeg(t, P.oda - 1.2, P.oda + 1.4)) : 1);
  else if (fb === 7) sh7Sabah(tm, P ? shEase(shSeg(t, P.oda - 1.2, P.oda + 1.4)) : 1);
  else if (fb === 6) sh6Sabah(tm, P ? shEase(shSeg(t, P.oda - 1.2, P.oda + 1.4)) : 1);   // kamera yaklaşmadan pencerede görünsün
  else if (fb === 5) sh5Sabah(tm, P ? shEase(shSeg(t, P.oda + .6, P.oda + 3.5)) : 1);
  else if (b3) { shSabahGokkusagi(tm, P ? shSeg(t, P.gk, P.gk + 2.6) : 1); shSabahPencere(tm, true); }
  else if (b2) shSabahPencere(tm);
  else shSabahAgac(tm, P ? shEase(shSeg(t, P.oda + 0.6, P.oda + 3.5)) : 1);
  shPerdeler(p, 0, tm * 0.6, 1);
  shLamba(p, 0, tm, false, 0);
  if (fb === 7) { sh7Oda(p, tm, 1, 0); sh7Hediye(tm, 1, P ? shSeg(t, P.oda + 1.0, P.oda + 1.9) : 1); }   // kâğıt kar taneleri gün ışığında; komodinde kar küresi ve buz kristali
  if (fb === 8) { sh8Oda(p, tm, 1, 0, 0); sh8Hediye(tm, 1, P ? shSeg(t, P.oda + 1.0, P.oda + 1.6) : 1); }
  if (fb === 14 && typeof sh14Hediye === 'function') sh14Hediye(tm,1,P?shSeg(t,P.oda+1,P.oda+1.9):1);
  if (fb === 13 && typeof sh13Hediye === 'function') sh13Hediye(tm, 1, P ? shSeg(t, P.oda + 1.0, P.oda + 1.9) : 1);
  if (fb === 12 && typeof sh12Hediye === 'function') sh12Hediye(tm, 1, P ? shSeg(t, P.oda + 1.0, P.oda + 1.9) : 1);   // komodinde rüyadan kalan kampüs hatırası (sahne12.js)
  if (fb === 11 && typeof sh11Hediye === 'function') { sh11Oda(tm, 1, false); sh11Hediye(tm, P ? shSeg(t, P.oda + 1.0, P.oda + 1.9) : 1); }   // komodinde lila yarasa peluşu + çilek (sahne11.js)

  if (fb === 9) { sh9Oda(p, tm, 1, 0, 0); sh9Hediye(tm, 1, P ? shSeg(t, P.oda + 1.0, P.oda + 1.9) : 1); }   // süsler gün ışığında; komodinde rüyadan kalan ejderha pulu ve yumurta kabuğu   // gece süsleri gün ışığında; komodinde rüyadan kalan kabak ve şeker
  shHali(p, 0, tm);
  shYatakArka(p, 0, 0, tm);
  // Feza önce uyuyor, sonra doğrulup gözlerini ovuşturur, gerinir, gülümser; peluş Pırıl kucağında
  const uT = P ? t - (P.oda + 0.9) : 99;
  const kirp = P ? (t >= P.kirp && t < P.kirpBit) : !!sonKirp;
  const otur = uT <= 0 ? 0 : shEase(shSeg(uT, 0, 1.1));
  // Pırıl yanağına kaldırılınca Feza ona sarılır ('sarilma': elleri kirpK eğrisiyle birlikte Pırıl'la yükselir)
  const sar = (!P || t >= P.yak - 0.2) && shPozVar('sarilma');
  shFeza(SH_FEZA.x, SH_FEZA.y, 1.18, uT <= 0 ? 'uyku' : sar ? 'sarilma' : 'uyanis', uT <= 0 ? tm : sar ? (P ? t - (P.yak - 0.2) : 9) : uT, kirp ? 'goz_kirp' : (P && t < P.oda + 2.2 && shPirilPozVar('sabah') ? 'sabah' : 'pelus'), P && t < P.oda + 2.2 ? shEase(shSeg(t, P.oda - 0.6, P.oda + 2.2)) : undefined, tm);   // Pırıl: canlıdan peluşa ~2,8 sn
  shBattaniye(p, 0, tm, uT <= 0 ? Math.sin(tm * 1.5) * 0.5 + 0.5 : 0, otur);
  if (P && t >= P.kirp) {   // göz kırpınca masalsı, sıcak altın yıldız ve kalp ışıltısı
    const u = shSeg(t, P.kirp + 0.05, P.kirp + 1.6);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
    const q = sh.prEk || { x: shEkranX(shKucak.px), y: shEkranY(shKucak.py), s: sh.k0 * sh.zoom * 0.2 };
    const px = q.x + 17 * q.s, py = q.y - 25 * q.s, r = q.s * 9;
    const sinU = Math.sin(u * Math.PI);
    dglow('#ffdd98', px, py, r * 2.2 * sinU, sinU * 0.55);
    dglow('#ffffff', px, py, r * 0.9 * sinU, sinU * 0.85);
    shParilti(px, py, r * 1.3 * sinU, sinU);
    if (u > 0.2 && u < 0.8) {
      const u2 = (u - 0.2) / 0.6;
      shParilti(px + Math.cos(u2 * 3.14) * r * 0.6, py - Math.sin(u2 * 3.14) * r * 0.6, r * 0.5 * Math.sin(u2 * Math.PI), Math.sin(u2 * Math.PI) * 0.7);
    }
    g.globalCompositeOperation = 'source-over';
  }
  // gün doğumu rengi: odaya süzülen altın sabah güneşi huzmeleri ve sıcacık uyanış
  { const u = P ? shEase(shSeg(t, P.oda, P.oda + 4.5)) : 1, sn = P ? 1 - 0.4 * shEase(shSeg(t, P.yak, P.yak + 3)) : 0.6;
    const wa = 0.11 * u * sn * (1 + 0.14 * Math.sin(tm * 0.6)), ca = 0.045 * (1 - u);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (ca > 0.003) { g.fillStyle = `rgba(185,200,255,${ca})`; g.fillRect(0, 0, W, H); }
    if (wa > 0.003) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,200,125,${wa})`; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; } }
  if (fb >= 6) sh6Hatira(tm, P ? shEase(shSeg(t, P.oda + 1.5, P.oda + 4.5)) : 1);
  shSabahTozu(tm, b3 ? 3 : b2 ? 2 : 1);
  shZerreler(tm, 0.75, false);
}
// Bölüm 3 sabahı: pencereden GERÇEK bir gökkuşağı (soldan sağa yavaşça çizilir, sonra yumuşakça ışıldar) + duvarda
// gökkuşağı ışığı lekesi (yakın çekimlerde de görünür). a: 0..1 beliriş
function shSabahGokkusagi(tm, a) {
  if (a <= 0.004) return;
  const sw = shEase(a), cx = 27.5, cy = 49, R0 = 17.5, bw = 1.05, a0 = Math.PI * 1.0, a1 = a0 + Math.PI * sw;
  shOdaT(); g.save(); shPencereYol(g, 0); g.clip();
  g.lineCap = 'butt';
  g.globalCompositeOperation = 'lighter';   // yayın altında yumuşak beyaz ışık
  g.strokeStyle = 'rgba(255,250,235,0.18)'; g.lineWidth = bw * 11; g.beginPath(); g.arc(cx, cy, R0 - bw * 3, a0, a1); g.stroke();
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 7; i++) {
    g.strokeStyle = SH_GK[i];
    g.globalAlpha = 0.22; g.lineWidth = bw * 1.9; g.beginPath(); g.arc(cx, cy, R0 - i * bw, a0, a1); g.stroke();   // yumuşak kenar
    g.globalAlpha = 0.6; g.lineWidth = bw * 0.95; g.beginPath(); g.arc(cx, cy, R0 - i * bw, a0, a1); g.stroke();
  }
  g.globalAlpha = 1;
  // yay boyunca yavaşça kayan parlaklık
  const ph = (tm * 0.12) % 1.4 - 0.2, ap = a0 + Math.PI * clamp(ph, 0, 1);
  if (ph > 0 && ph < 1 && sw > 0.99) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = bw * 7; g.beginPath(); g.arc(cx, cy, R0 - bw * 3, Math.max(a0, ap - 0.12), Math.min(a1, ap + 0.12)); g.stroke(); g.globalCompositeOperation = 'source-over'; }
  g.restore();
  // pencere kayıtları yayın önünde kalsın
  g.fillStyle = SH_SABAH.frame; const cxw = (SH_PEN.x0 + SH_PEN.x1) / 2;
  g.fillRect(cxw - 0.6, SH_PEN.ust, 1.2, SH_PEN.alt - SH_PEN.ust); g.fillRect(SH_PEN.x0, 31, SH_PEN.x1 - SH_PEN.x0, 1.2);
  // çizilirken yayın ucunda ışıltı; sonra yay üstünde ara sıra ışıltılar
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const k = sh.k0 * sh.zoom;
  if (sw < 0.999) { const ex = cx + Math.cos(a1) * (R0 - bw * 3), ey = cy + Math.sin(a1) * (R0 - bw * 3); if (ex > SH_PEN.x0 && ex < SH_PEN.x1 && ey < SH_PEN.alt) { dglow('#fff4d8', shEkranX(ex), shEkranY(ey), k * 5, 0.6); shParilti(shEkranX(ex), shEkranY(ey), k * 3, 0.9); } }
  for (let i = 0; i < 4; i++) {
    const an = a0 + Math.PI * ((i * 0.27 + 0.12) % 1), tw = Math.pow(0.5 + 0.5 * Math.sin(tm * 1.7 + i * 2.3), 3), ex = cx + Math.cos(an) * (R0 - bw * (i % 7)), ey = cy + Math.sin(an) * (R0 - bw * (i % 7));
    if (an < a1 && ex > SH_PEN.x0 + 1 && ex < SH_PEN.x1 - 1 && ey < SH_PEN.alt - 1) shParilti(shEkranX(ex), shEkranY(ey), k * (0.8 + 1.4 * tw), a * tw * 0.9);
  }
  g.globalCompositeOperation = 'source-over';
  // duvarda gökkuşağı ışığı (cam kenarından kırılan sabah ışığı): yatağın üstünde yumuşak, hafifçe kıpırdayan yay
  const pa = shEase(shSeg(a, 0.35, 1)) * (0.85 + 0.15 * Math.sin(tm * 0.9));
  if (pa > 0.01) {
    shOdaT(); const px = -12 + Math.sin(tm * 0.21) * 0.6, py = 47, pr = 7.5;
    g.lineCap = 'round';
    for (let i = 0; i < 7; i++) { g.strokeStyle = SH_GK[i]; g.globalAlpha = 0.16 * pa; g.lineWidth = 0.75; g.beginPath(); g.arc(px, py, pr - i * 0.62, Math.PI * 1.2, Math.PI * 1.75); g.stroke(); }
    g.globalAlpha = 1;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; dglow('#fff0d8', shEkranX(px), shEkranY(py - pr + 2), k * 6, 0.12 * pa); g.globalCompositeOperation = 'source-over';
  }
}
// Bölüm 1 sabahı: pencereden uzak tepede Işık Ağacı yumuşakça parlar (rüyanın izi), etrafında minik ışık tanecikleri
function sh5Sabah(tm, a) {
  if (a <= .01) return;
  shOdaT(); g.save(); shPencereYol(g, 0); g.clip(); g.globalAlpha=a;
  g.fillStyle='#a79ab3';g.beginPath();g.moveTo(14,47);g.bezierCurveTo(24,44,26,38,29,34);g.quadraticCurveTo(31,34.8,33,34);g.bezierCurveTo(35,39,39,44,46,47);g.closePath();g.fill();
  g.fillStyle='#7e839f';g.beginPath();g.moveTo(31,35);g.lineTo(29,43);g.lineTo(24,47);g.lineTo(39,47);g.lineTo(33,34);g.closePath();g.fill();
  g.strokeStyle='#f8d3ad';g.lineWidth=.25;g.beginPath();g.moveTo(29.1,34.1);g.quadraticCurveTo(31,35.2,32.9,34.1);g.moveTo(30.2,35);g.bezierCurveTo(29.8,39,31.5,40,28.7,45);g.stroke();
  // Uzak sıcak dağ ve pencereden geçen üç küçük altın kâğıt kuş: rüyadan sabaha kalan iz.
  for(let i=0;i<3;i++){
    const u=(tm*.028+i*.29)%1,bx=15+u*26,by=25+i*3+Math.sin(tm*.7+i)*.5,fl=Math.sin(tm*3.1+i)*.55;
    g.fillStyle=i%2?'#eabf9b':'#f4d99d';g.beginPath();g.moveTo(bx-1.2,by-.3);g.lineTo(bx-.3,by+.1);g.lineTo(bx+.7,by-.2);g.lineTo(bx+1.6,by-.1);g.lineTo(bx+.6,by+.5);g.lineTo(bx-.5,by+.4);g.fill();
    g.fillStyle='#fff0ce';g.beginPath();g.moveTo(bx,by+.2);g.lineTo(bx-1.5,by-1.2-fl);g.lineTo(bx-.4,by+.4);g.lineTo(bx+.7,by-1.6-fl);g.lineTo(bx+.6,by+.2);g.fill();
  }
  g.restore(); g.globalAlpha=1;
}
function shSabahAgac(tm, a) {
  if (a <= 0.01) return;
  const ax = 33.5, ay = 44.6, nb = 0.5 + 0.5 * Math.sin(tm * 1.1);
  shOdaT(); g.save(); shPencereYol(g, 0); g.clip();
  g.globalAlpha = a; g.fillStyle = '#8fbf86';
  g.beginPath(); g.moveTo(ax - 0.25, ay + 2); g.lineTo(ax - 0.12, ay); g.lineTo(ax + 0.12, ay); g.lineTo(ax + 0.25, ay + 2); g.fill();
  g.fillStyle = '#a8d896'; g.beginPath(); g.arc(ax, ay - 0.8, 1.5, 0, 6.283); g.arc(ax - 1.1, ay - 0.2, 1.0, 0, 6.283); g.arc(ax + 1.1, ay - 0.3, 1.05, 0, 6.283); g.fill();
  g.restore(); g.globalAlpha = 1;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const k = sh.k0 * sh.zoom, px = shEkranX(ax), py = shEkranY(ay - 0.7);
  dglow('#fff0a8', px, py, k * (3.6 + 0.6 * nb), a * (0.45 + 0.15 * nb)); dglow('#ffffff', px, py, k * 1.2, a * 0.35);
  for (let i = 0; i < 5; i++) { const u = (tm * 0.12 + i / 5) % 1, x = ax + Math.sin(i * 2.3 + tm * 0.7) * 1.6, y = ay - 1 - u * 5; if (y > SH_PEN.ust + 14) shParilti(shEkranX(x), shEkranY(y), k * 0.5, a * Math.sin(u * Math.PI) * 0.8); }
  g.globalCompositeOperation = 'source-over';
}
// Bölüm 2 sabahı: pencerede sönmekte olan birkaç yıldız, lambanın yıldız ışıkları, odada rüyadan kalan yıldız tozu
function shSabahPencere(tm, yildizYok) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const k = sh.k0 * sh.zoom;
  const Y = [[18, 17, 1.2], [23, 25, 1], [28, 16, 1.3], [34, 24, 1.1], [37, 17, 0.9], [20, 33, 0.8], [31, 32, 0.9]];
  for (let i = 0; i < (yildizYok ? 0 : Y.length); i++) {
    const q = Y[i], tw = 0.5 + 0.5 * Math.sin(tm * 1.6 + i * 2.1), px = shEkranX(q[0]), py = shEkranY(q[1]), r = k * 1.15 * q[2] * (0.7 + 0.5 * tw);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.75 + 0.25 * tw; g.fillStyle = '#ffc23a'; g.strokeStyle = '#fff2b0'; g.lineWidth = Math.max(1, r * 0.12); g.lineJoin = 'round'; shYildiz5(g, px, py, r * 1.3); g.fill(); g.stroke(); g.globalAlpha = 1; g.globalCompositeOperation = 'lighter'; dglow('#ffe9a0', px, py, r * 2.4, 0.2 * tw);
  }
  // pencereden geçen kuş siluetleri (kanat çırpar)
  g.globalCompositeOperation = 'source-over'; g.strokeStyle = 'rgba(70,60,90,0.75)'; g.lineWidth = Math.max(1.2, k * 0.22); g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const u = ((tm * (0.03 + i * 0.006) + i * 0.33) % 1), bx = 15 + u * 24, by = 20 + i * 5 + Math.sin(tm * 0.7 + i) * 1.3, fl = Math.sin(tm * (6 + i) + i * 2) * 0.9, s2 = 1.4 - i * 0.2;
    const px = shEkranX(bx), py = shEkranY(by), w = k * s2 * 1.4;
    g.beginPath(); g.moveTo(px - w, py - w * 0.2 * (1 - fl)); g.quadraticCurveTo(px - w * 0.4, py - w * 0.6 * (0.4 + fl), px, py); g.quadraticCurveTo(px + w * 0.4, py - w * 0.6 * (0.4 + fl), px + w, py - w * 0.2 * (1 - fl)); g.stroke();
  }
}
// rüyadan odaya kalan toz: Bölüm 1 ışıklı yaprakçıklar, Bölüm 2 yıldız tozu (+ lambada yıldızlar), Bölüm 3 gökkuşağı ışıltıları
function shSabahTozu(tm, fb) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const k = sh.k0 * sh.zoom, lx = shEkranX(SH_LAMBA.x), ly = shEkranY(SH_LAMBA.y - 3);
  if (fb !== 2) {
    for (let i = 0; i < 16; i++) {
      const u = (tm * (0.016 + (i % 5) * 0.004) + i * 0.137) % 1, x = -52 + ((i * 37) % 80) + Math.sin(tm * 0.5 + i) * 1.8, y = fb === 1 ? 18 + u * 64 : 82 - u * 66;   // yaprakçıklar süzülerek iner, ışıltılar yükselir
      const e = Math.sin(u * Math.PI), tw = 0.5 + 0.5 * Math.sin(tm * 2.2 + i * 1.7), px = shEkranX(x), py = shEkranY(y);
      if (fb === 1) {
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = e * (0.45 + 0.35 * tw); g.fillStyle = i % 3 ? '#7fd8e8' : '#f59ac8';
        g.save(); g.translate(px, py); g.rotate(tm * 0.8 + i); g.beginPath(); g.ellipse(0, 0, k * 0.75, k * 0.32, 0, 0, 6.283); g.fill(); g.restore();
        g.globalCompositeOperation = 'lighter'; dglow(i % 3 ? '#9ff0ff' : '#ffb0e0', px, py, k * 1.6, e * 0.18 * tw);
      } else {
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = e * (0.4 + 0.4 * tw); g.fillStyle = SH_GK[i % 7]; shYildiz4(g, px, py, k * (0.45 + (i % 4) * 0.18) * (0.6 + 0.5 * tw), 0.25); g.fill();
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    return;
  }
  for (let i = 0; i < 3; i++) { const tw = 0.5 + 0.5 * Math.sin(tm * 1.8 + i * 2.2), a = -0.5 + i * 0.9; g.globalAlpha = 0.35 + 0.4 * tw; g.fillStyle = '#ffe8a0'; shYildiz4(g, lx + Math.sin(a) * k * 5, ly - Math.cos(a) * k * 5.5, k * 1.1 * (0.6 + 0.5 * tw), 0.25); g.fill(); }
  for (let i = 0; i < 18; i++) {
    const u = (tm * (0.018 + (i % 5) * 0.004) + i * 0.137) % 1, x = -52 + ((i * 37) % 80) + Math.sin(tm * 0.5 + i) * 1.6, y = 82 - u * 66;
    const e = Math.sin(u * Math.PI), tw = 0.5 + 0.5 * Math.sin(tm * 2.4 + i * 1.7);
    g.globalAlpha = e * (0.35 + 0.45 * tw); g.fillStyle = i % 3 ? '#ffe9a8' : '#e6d2ff'; shYildiz4(g, shEkranX(x), shEkranY(y), k * (0.5 + (i % 4) * 0.22) * (0.6 + 0.5 * tw), 0.25); g.fill();
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
// kutlama çekimi: Pofuduklar Feza ile Pırıl'ın çevresinde dans ederken kamera grubu ortalayıp yavaşça yaklaşır (çizilmiş kare
// kopyalanıp büyütülerek geri çizilir); ışık yükselirken odak ağacın parlayan gövdesine kayar.
let shKopya = null;
const shGrup = { x0: 0, x1: 0, y0: 0, y1: 0 };
function shFinalOdak() {   // grubun ekran pikseli cinsinden merkezi ve ona yakışan yakınlık
  if (typeof cam === 'undefined' || typeof OYUN === 'undefined') return { x: W / 2, y: H * 0.55, z: 1.15 };
  const F = OYUN.P, G = shGrup;
  if ((sh.fBolum || 1) === 4 && typeof INCI !== 'undefined') { const b = INCI.kameraKutu(); if (b) return { x: ((b.x0 + b.x1) / 2 - cam.x) * S, y: ((b.y0 + b.y1) / 2 - cam.y) * S, z: 1.025 }; }
  G.x0 = F.x - 30; G.x1 = F.x + 30; G.y0 = F.y - 90; G.y1 = F.y;
  const ekle = (x, y, r) => { if (!isFinite(x) || !isFinite(y)) return; G.x0 = Math.min(G.x0, x - r); G.x1 = Math.max(G.x1, x + r); G.y0 = Math.min(G.y0, y - r); G.y1 = Math.max(G.y1, y + r * 0.3); };
  for (const o of NESNELER) {
    if ((o.tip === 'pofuduk' || o.tip === 'kuzu') && Math.abs(o.x - F.x) < 420 && Math.abs(o.y - F.y) < 260) ekle(o.x, o.y - 24, 34);
    // Büyük Pofuduk grubun yanına (yere) gelince bütünüyle kadraja girsin (kenarda yarım kıvrık tutam görünmesin)
    else if (o.tip === 'buyukPofuduk' && Math.abs(o.x - F.x) < 480 && Math.abs(o.y - F.y) < 90) { ekle(o.x, o.y - 100, 104); G.y0 = Math.min(G.y0, o.y - 240); }
  }
  if (typeof D !== 'undefined' && Math.abs(D.x - F.x) < 360 && Math.abs(D.y - F.y) < 300) ekle(D.x, D.y, 34);
  const wpx = (G.x1 - G.x0 + 80) * S, hpx = (G.y1 - G.y0 + 120) * S;
  return { x: ((G.x0 + G.x1) / 2 - cam.x) * S, y: ((G.y0 + G.y1) / 2 - cam.y) * S, z: clamp(Math.min(W * 0.78 / wpx, H * 0.62 / hpx), 1.06, 1.26) };
}
function shFinalKamera(t, P, dt) {
  // cihaz zorlanıyorsa (kareler uzun) bu süsü yumuşakça bırak: ekran kopyası tam ekran iki çizim demek
  sh.kareOrt = lerp(sh.kareOrt || 1 / 60, dt || 1 / 60, 0.05);
  if (sh.kareOrt > 1 / 42) sh.kamYavas = Math.min(1, (sh.kamYavas || 0) + (dt || 0) * 0.5);
  const yav = 1 - (sh.kamYavas || 0);
  // hedef: dans eden grup → (ışık yükselirken) ağacın parlayan gövdesi
  const o = shFinalOdak();
  let tx = o.x, ty = o.y, tz = o.z;
  if (typeof TREE !== 'undefined' && TREE && typeof cam !== 'undefined') {
    const w = shEase(shSeg(t, P.isik - 0.6, P.dolu));
    tx = lerp(tx, (TREE.x - cam.x) * S, w * 0.6); ty = lerp(ty, (TREE.y - 170 - cam.y) * S, w * 0.5); tz += 0.05 * w;
  }
  const f = sh.fo || (sh.fo = { x: tx, y: ty, z: 1, tz }), k = 1 - Math.exp(-(dt || 0) * 0.8);
  f.x = lerp(f.x, tx, k); f.y = lerp(f.y, ty, k); f.tz = lerp(f.tz, tz, k * 0.7);   // grup büyüyünce (yeni gelen Pofuduk) yakınlık da yavaşça değişir
  // yaklaşma: ilk 3 sn'de yumuşakça gruba, sonra çok yavaş sürüklenme
  const yak = shEase(shSeg(t, 0.25, 3.2));
  f.z = 1 + (f.tz - 1) * yak * yav + 0.025 * shSeg(t, 3.2, P.dolu) * yav;
  const z = f.z;
  if (z <= 1.0005) return { z: 1, cx: 0, cy: 0, sx: 0, sy: 0 };
  // grup ekranın ortasına (biraz aşağıya: üstte ağacın taç ışığı görünsün) yavaşça gelir; resim ekranı hep kaplar
  const cx = clamp(f.x, 0, W), cy = clamp(f.y, 0, H), ort = yak * 0.85;
  const sx = clamp(lerp(cx, W * 0.5 + W * 0.02 * shSeg(t, 0, P.dolu), ort), W - z * (W - cx), z * cx);
  const sy = clamp(lerp(cy, H * 0.6, ort), H - z * (H - cy), z * cy);
  // yalnız ekranda görünecek kısım (1/z²'si) kopyalanır ve geri büyütülür (1.06–1.3×: çift doğrusal yeterli, 'high' gereksiz pahalı)
  const ax = cx - sx / z, ay = cy - sy / z;
  const x0 = Math.max(0, Math.floor(ax) - 1), y0 = Math.max(0, Math.floor(ay) - 1);
  const kw = Math.min(W, Math.ceil(ax + W / z) + 1) - x0, kh = Math.min(H, Math.ceil(ay + H / z) + 1) - y0;
  if (kw < 2 || kh < 2) return { z: 1, cx: 0, cy: 0, sx: 0, sy: 0 };
  if (!shKopya || shKopya.width !== W || shKopya.height !== H) { shKopya = shBirak(shKopya) || shTuval(); }
  const kx = shKopya.getContext('2d');
  kx.setTransform(1, 0, 0, 1, 0, 0); kx.clearRect(0, 0, kw, kh); kx.drawImage(g.canvas, x0, y0, kw, kh, 0, 0, kw, kh);   // 'copy' bütün tuvali silerdi
  g.setTransform(z, 0, 0, z, sx - z * cx, sy - z * cy);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'low';
  g.drawImage(shKopya, 0, 0, kw, kh, x0, y0, kw, kh);
  g.setTransform(1, 0, 0, 1, 0, 0);
  return { z, cx, cy, sx, sy };
}
// ¼ çözünürlüklü ekran tamponu: büyük, yumuşak ışıklar (tam ekran parıltılar, huzmeler, ışık dolgusu) burada küçük çizilir
// ve ekrana tek seferde büyütülerek basılır (3–5 tam ekran geçiş yerine 1)
let shDus = null;
function shDusuk() {
  const q = 0.25, w = Math.max(2, Math.ceil(W * q)), h = Math.max(2, Math.ceil(H * q));
  if (!shDus || shDus.c.width !== w || shDus.c.height !== h) {
    if (shDus) shBirak(shDus.c);
    const c = document.createElement('canvas'); c.width = w; c.height = h; shDus = { c, x: c.getContext('2d'), q };
  }
  const x = shDus.x;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, w, h);
  x.setTransform(q, 0, 0, q, 0, 0);
  return shDus;
}
function shDusukBas(Dq, op, a) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = op; g.globalAlpha = a;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'low';
  g.drawImage(Dq.c, 0, 0, Dq.c.width / Dq.q, Dq.c.height / Dq.q);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
function shParlakX(x, col, px, py, r, a) { if (a <= 0.004 || r <= 0) return; x.globalAlpha = Math.min(1, a); x.drawImage(glow(col), px - r, py - r, r * 2, r * 2); x.globalAlpha = 1; }
function shFinalCiz(tm, dt) {
  const t = sh.t, P = sh.plan;
  g.setTransform(1, 0, 0, 1, 0, 0);
  if ((sh.fBolum || 1) === 4 && !sh.tam) {
    // Büyük ışık patlaması yerine incinin renginden sakin sabah kremine çözülme.
    const u = shEase(shSeg(t, P.isik, P.dolu));
    if (u > 0) { g.globalAlpha = u; g.fillStyle = '#f5f1df'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    return;
  }
  if (!sh.tam) {
    // ekran tamamen ışıkla dolduysa: dünyayı büyütüp ışıkları çizmeye gerek yok (en ağır an)
    const tamDolu = t >= P.isik && shEase(shSeg(shEase(shSeg(t, P.isik, P.dolu)), 0.55, 1)) >= 0.999;
    const K = tamDolu ? sh.sonK || { z: 1, cx: 0, cy: 0, sx: 0, sy: 0 } : (sh.sonK = shFinalKamera(t, P, dt));
    const ek = (x, y) => K.z === 1 ? [x, y] : [K.sx + (x - K.cx) * K.z, K.sy + (y - K.cy) * K.z];
    // kutlama: aydınlık ormanın üstünde yükselen altın zerreler + ağaçtan yayılan ışık
    const a = shEase(shSeg(t, 0, 1.5));
    if (!tamDolu) shAltinZerre(tm, a);
    if (t >= P.isik) {
      const u = shEase(shSeg(t, P.isik, P.dolu));
      let tx = W / 2, ty = H * 0.4;
      if (typeof TREE !== 'undefined' && TREE && typeof cam !== 'undefined') { [tx, ty] = ek((TREE.x - cam.x) * S, (TREE.y - 200 - cam.y) * S); tx = clamp(tx, W * 0.15, W * 0.85); ty = clamp(ty, H * 0.15, H * 0.7); }
      else if (typeof BOLUM !== 'undefined' && BOLUM && BOLUM.gokkusagi && typeof cam !== 'undefined' && isFinite(BOLUM.gokkusagi.x)) { [tx, ty] = ek((BOLUM.gokkusagi.x - cam.x) * S, (BOLUM.gokkusagi.y - 160 - cam.y) * S); tx = clamp(tx, W * 0.15, W * 0.85); ty = clamp(ty, H * 0.15, H * 0.7); }
      // önce eklemeli ışık (parlar, bulanıklaştırmaz), sonra krem-altın beyazlık ekranı doldurur
      const D2 = Math.hypot(W, H);
      if (!tamDolu) {
      // üç büyük parıltı + huzmeler ¼ tamponda toplanır, ekrana tek 'lighter' geçişle basılır
      const Dq = shDusuk(), x = Dq.x, gk3 = (sh.fBolum || 1) === 3, ak = gk3 ? 0.3 : 1;   // Bölüm 3: pembe dünyada beyaza doymasın
      x.globalCompositeOperation = 'lighter';
      shParlakX(x, '#ffd890', tx, ty, D2 * (0.3 + 1.1 * u), Math.min(1, u * 2) * ak);
      shParlakX(x, '#ffe2a0', tx, ty, D2 * (0.2 + 0.7 * u), Math.min(1, u * 2) * ak);
      shParlakX(x, '#fff6dc', tx, ty, D2 * (0.08 + 0.5 * u), Math.min(1, u * 1.8) * (gk3 ? 0.5 : 1));
      // ağaçtan yükselen ışık huzmeleri (yavaşça döner): tek degrade, her huzme döndürülmüş birim üçgen
      const ha = 0.22 * Math.min(1, u * 2.5);
      if (ha > 0.003 && !gk3) {
        if (!sh.huzmeGr) { sh.huzmeGr = x.createLinearGradient(0, 0, 1, 0); sh.huzmeGr.addColorStop(0, 'rgba(255,236,190,1)'); sh.huzmeGr.addColorStop(1, 'rgba(255,236,190,0)'); }
        x.fillStyle = sh.huzmeGr; x.globalAlpha = ha;
        const gk = (sh.fBolum || 1) === 3;   // Bölüm 3: yedi huzme gökkuşağının yedi rengi
        if (gk && !sh.huzmeGk) sh.huzmeGk = SH_GK.map(c => { const q = x.createLinearGradient(0, 0, 1, 0); q.addColorStop(0, mixc(c, '#ffffff', 0.35)); q.addColorStop(1, mixc(c, '#ffffff', 0.35, 0)); return q; });
        for (let i = 0; i < 7; i++) {
          if (gk) { x.fillStyle = sh.huzmeGk[i]; x.globalAlpha = ha * 1.3; }
          const aci = -Math.PI / 2 + (i - 3) * 0.33 + Math.sin(tm * 0.3 + i) * 0.05, L = D2 * (0.25 + 0.6 * u), w = 0.05 + 0.02 * Math.sin(tm + i);
          const c = Math.cos(aci) * L, sn = Math.sin(aci) * L;   // birim üçgen (0,0)-(cos w, ±sin w) → döndür + ölçekle
          x.setTransform(c * Dq.q, sn * Dq.q, -sn * Dq.q, c * Dq.q, tx * Dq.q, ty * Dq.q);
          x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(w), -Math.sin(w)); x.lineTo(Math.cos(w), Math.sin(w)); x.closePath(); x.fill();
        }
        x.globalAlpha = 1;
      }
      x.globalCompositeOperation = 'source-over';
      shDusukBas(Dq, 'lighter', 1);
      if (gk3 && ha > 0.003) {   // yedi doygun renk huzme: normal karışım (beyaza doymaz, renkler okunur), yavaşça döner
        if (!sh.huzmeGk3) sh.huzmeGk3 = SH_GK.map(c => { const q = g.createLinearGradient(0, 0, 1, 0); q.addColorStop(0, mixc(c, '#ffffff', 0.15, 0.85)); q.addColorStop(0.55, mixc(c, '#ffffff', 0.1, 0.45)); q.addColorStop(1, mixc(c, '#ffffff', 0, 0)); return q; });
        const L = D2 * (0.3 + 0.7 * u), al = Math.min(1, u * 2.2) * (1 - shEase(shSeg(u, 0.6, 1)) * 0.5);
        for (let i = 0; i < 14; i++) {   // çepeçevre iki tur yedi renk (merkez ekran kenarında olsa da görünür)
          const aci = i / 14 * 6.283 + tm * 0.12 + Math.sin(tm * 0.3 + i) * 0.03, w = 0.1 + 0.02 * Math.sin(tm + i);
          const c = Math.cos(aci) * L * 1.4, sn = Math.sin(aci) * L * 1.4;
          g.setTransform(c, sn, -sn, c, tx, ty); g.globalAlpha = al * 0.5; g.fillStyle = sh.huzmeGk3[i % 7];
          g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(w), -Math.sin(w)); g.lineTo(Math.cos(w), Math.sin(w)); g.closePath(); g.fill();
        }
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
      }
      }
      const v = shEase(shSeg(u, 0.55, 1));
      if (v > 0) {
        const gr = g.createRadialGradient(tx, ty, 0, tx, ty, D2 * (0.2 + 1.2 * v));
        if ((sh.fBolum || 1) === 3) { gr.addColorStop(0, `rgba(255,248,236,${v})`); gr.addColorStop(0.6, `rgba(255,236,222,${v})`); gr.addColorStop(1, `rgba(255,224,190,${v * v})`); }
        else { gr.addColorStop(0, `rgba(255,252,238,${v})`); gr.addColorStop(0.6, `rgba(255,240,205,${v})`); gr.addColorStop(1, `rgba(255,228,175,${v * v})`); }
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
      }
    }
    return;
  }
  // altın ışıktan sabaha
  const s = 1 - shEase(shSeg(t, P.oda, P.oda + 2.4));
  if (s < 0.999) shSabahCiz(tm, t, P);
  if (s > 0) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    // ışık nefes alır: merkez yavaşça süzülür, kenarlar sıcak altın
    const nb = Math.sin((t - P.dolu) * 0.9), cx = W * (0.55 + 0.04 * Math.sin((t - P.dolu) * 0.35)), cy = H * (0.38 + 0.03 * nb);
    // yumuşak degrade ¼ tamponda çizilir, tek geçişte büyütülür (saydamlık s → globalAlpha; renkler aynı)
    const Dq = shDusuk(), x = Dq.x;
    const gr = x.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, H) * (0.75 + 0.05 * nb));
    gr.addColorStop(0, 'rgb(255,253,240)'); gr.addColorStop(0.55, 'rgb(255,242,214)'); gr.addColorStop(1, 'rgb(255,222,165)');
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    shDusukBas(Dq, 'source-over', s);
    shIsikCicek(t - P.dolu, tm, s * shEase(shSeg(t, P.dolu, P.dolu + 1.2)));
  }
}
// beyaz ışığın içinde: yavaşça yükselen, parıldayan altın yıldızcıklar ve yumuşak ışık topları (müziğin doruğunda)
const shIsikZ = [];
let shTop = null;
function shTopSprite() {
  if (shTop) return shTop;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,206,150,1)'); gr.addColorStop(1, 'rgba(255,214,160,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  return shTop = c;
}
function shIsikCicek(u, tm, a) {
  if (a <= 0.01) return;
  if (!shIsikZ.length) { const r = rng(64); for (let i = 0; i < 40; i++) shIsikZ.push({ x: r(), y: r(), s: 0.5 + r(), v: 0.025 + r() * 0.035, h: r() * 6.28, top: i < 9 }); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  const D2 = Math.min(W, H);
  for (const z of shIsikZ) {
    const yy = ((z.y - u * z.v) % 1 + 1) % 1, xx = z.x + Math.sin(u * 0.5 + z.h) * 0.03;
    const kenar = Math.min(1, yy * 5, (1 - yy) * 5), tw = 0.5 + 0.5 * Math.sin(tm * 2.1 + z.h * 3);
    if (z.top) {   // yumuşak, şeftali renkli ışık topu (önbellekteki sprite)
      const r = D2 * 0.06 * z.s, al = 0.4 * a * kenar;
      if (al > 0.003) { g.globalAlpha = Math.min(1, al); g.drawImage(shTopSprite(), xx * W - r, yy * H - r, r * 2, r * 2); g.globalAlpha = 1; }
    } else {   // dört köşeli altın parıltı
      const r = D2 * 0.022 * z.s * (0.55 + 0.6 * tw);
      g.globalAlpha = a * kenar * (0.45 + 0.45 * tw); g.fillStyle = z.s > 1.1 ? '#ffb84a' : '#ffcf6e';
      shYildiz4(g, xx * W, yy * H, r, 0.22); g.fill();
    }
  }
  g.globalAlpha = 1;
}
function shAltinZerre(tm, a) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  if (!shZer.length) shZerreler(0, 0, true);
  for (let i = 0; i < shZer.length; i++) {
    const z = shZer[i], yy = ((z.y - tm * z.v * 3) % 1 + 1) % 1, xx = z.x + Math.sin(tm * 0.6 + z.h) * 0.03;
    const tw = 0.5 + 0.5 * Math.sin(tm * 2 + z.h * 3);
    dglow(i % 3 ? '#ffe6a0' : '#ffd0f0', xx * W, yy * H, H * 0.012 * z.s * (1 + tw * 0.5), a * (0.3 + 0.4 * tw));
  }
  g.globalCompositeOperation = 'source-over';
}

// ── dokunuş: açılışta 2 sn'den sonra atla ──
// atla düğmesi: sağ üstte yuvarlak "▶▶" (yazı yok; Feza simgeden anlar). Yalnız daha önce izlendiyse görünür
function shGirisAnahtar(b) { return b > 1 ? 'fezaIsikGiris' + b : 'fezaIsikGiris'; }   // Bölüm 1 eski anahtarı korur
function shDahaOnce(b) {   // bu rüya daha önce oynandı mı: girişi izlendi ya da bölüm tamamlandı
  try {
    if (Q.has('atlanir') || localStorage.getItem(shGirisAnahtar(b)) === '1') return true;
    return typeof omTamamOku === 'function' && omTamamOku().indexOf(b) >= 0;
  } catch (e) { return false; }
}
function shAtlaYer() { const r = Math.max(30, Math.min(W, H) * 0.055); return { x: W - r * 1.7, y: r * 1.7, r }; }
function shAtlaCiz(tm) {
  const P = sh.plan; if (!P || !sh.atlanabilir || sh.atla >= 0 || sh.t < 2 || sh.t >= P.b4) return;
  const y = shAtlaYer(), a = shEase(shSeg(sh.t, 2, 3)), nb = 1 + Math.sin(tm * 3) * 0.05;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.translate(y.x, y.y); g.scale(nb, nb);
  g.fillStyle = 'rgba(20,24,60,0.55)'; g.beginPath(); g.arc(0, 0, y.r, 0, 7); g.fill();
  g.lineWidth = y.r * 0.09; g.strokeStyle = 'rgba(255,236,170,0.95)'; g.stroke();
  g.fillStyle = 'rgba(255,236,170,0.98)';
  for (const dx of [-0.34, 0.1]) { g.beginPath(); g.moveTo((dx - 0.1) * y.r, -0.4 * y.r); g.lineTo((dx + 0.4) * y.r, 0); g.lineTo((dx - 0.1) * y.r, 0.4 * y.r); g.closePath(); g.fill(); }
  g.restore();
}
OLAY.on('dokunus', v => {
  if (sh.mod !== 'giris' || sh.atla >= 0) return;
  const P = sh.plan;
  // ilk izleyişte masal kesilmez; daha önce izlendiyse yalnız atla düğmesine (ya da klavyeye) basınca atlanır
  if (!sh.atlanabilir || sh.t < 2 || sh.t >= P.b4) return;
  if (v && v.x != null) { const y = shAtlaYer(), d = DPR || 1; if (Math.hypot(v.x * d - y.x, v.y * d - y.y) > y.r * 1.5) return; }   // v: CSS px, shAtlaYer: tuval px
  sh.atla = sh.t; shSus();
  if (P.dogrudan) { P.son = sh.t + 0.08; shAn('atlandi'); return; }
  // planı kısalt: hemen Pırıl uyandırır, ışık yükselir, dünya görünür
  P.b3 = Math.min(P.b3, sh.t); P.b4 = sh.t; P.erime = 0.001;
  if (sh.kisa) { P.son = sh.t + 1.8; }   // kısa giriş: rüya belirir, hemen yumuşakça kararıp bölüm açılır (parlama yok)
  else { P.uyan = sh.t + 0.25; P.kalk = sh.t + 0.3; P.isik = sh.t; P.dunya = sh.t + 0.6; P.son = P.dunya + 1.6; }
  shAn('atlandi');
});
OLAY.on('boyut', () => { sh.bw = -1; shSecGuvenli.kirli = true; if (sh.sec && !sh.sec.secili) sh.sec.pos.length = 0; });
// başlık ekranındayken oda ve orman fonunu önceden hazırla ve bir kez boyat (dokununca takılma olmasın)
setTimeout(function shIsit() {
  if (DURUM !== 'baslik' || sh.mod) return;
  if (!(W > 2 && H > 2)) { setTimeout(shIsit, 400); return; }   // tuval henüz boyutlanmadı: biraz sonra yine dene
  shGeceHazirla();
}, 1200);
function shGeceHazirla() { const k = () => DURUM === 'baslik' || sh.mod === 'giris' || sh.mod === 'secim'; shOnceden('oda', k); if (sh.mod !== 'secim' && !(sh.plan && sh.plan.dogrudan) && sh.mod !== 'giris') { shOnceden(sh.fon || 'orman', k); shOnceden(shOnPlanAd(), k); } }

// ══════════════════ YILDIZ GÖLÜ FONU (kısa uyku girişinde oda buraya erir) ══════════════════
function shGolAdim() {
  const c = shTuval(), x = c.getContext('2d');
  const k = sh.k0, L = -sh.wu / 2 - 16, R = sh.wu / 2 + 16, SU = 66;
  const A = { c, W, H, adim: [] };
  A.adim.push(() => {
    x.setTransform(k, 0, 0, k, shCX(), 0);
    let gr = x.createLinearGradient(0, 0, 0, SU);
    gr.addColorStop(0, '#050a28'); gr.addColorStop(0.6, '#1b2a70'); gr.addColorStop(1, '#4a58b8');
    x.fillStyle = gr; x.fillRect(L, -1, R - L, SU + 1);
    const r = rng(23); x.fillStyle = '#fff6d0';
    for (let i = 0; i < 90; i++) { x.globalAlpha = 0.25 + r() * 0.7; shYildiz5(x, L + r() * (R - L), r() * (SU - 6), 0.2 + r() * 0.5); x.fill(); }
    x.globalAlpha = 1;
    gr = x.createRadialGradient(SH_AY.x, SH_AY.y, 0, SH_AY.x, SH_AY.y, 40); gr.addColorStop(0, 'rgba(230,236,255,0.45)'); gr.addColorStop(1, 'rgba(160,180,255,0)');
    x.fillStyle = gr; x.fillRect(L, -1, R - L, SU + 1);
    x.fillStyle = '#fff6d6'; x.beginPath(); x.arc(SH_AY.x, SH_AY.y, 4.2, 0, 6.283); x.fill();
    x.fillStyle = '#e4e9ff'; x.beginPath(); x.arc(SH_AY.x + 0.6, SH_AY.y - 0.3, 3.9, 0, 6.283); x.fill();
    // uzak tepeler
    x.fillStyle = 'rgba(16,24,78,0.9)'; x.beginPath(); x.moveTo(L, SU);
    for (let xx = L; xx <= R; xx += 2) x.lineTo(xx, SU - 7 - 6 * Math.sin(xx * 0.07) - 4 * Math.sin(xx * 0.19 + 1));
    x.lineTo(R, SU); x.closePath(); x.fill();
  });
  A.adim.push(() => {
    x.setTransform(k, 0, 0, k, shCX(), 0);
    let gr = x.createLinearGradient(0, SU, 0, 100); gr.addColorStop(0, '#3a4aa8'); gr.addColorStop(0.3, '#1a2670'); gr.addColorStop(1, '#070d34');
    x.fillStyle = gr; x.fillRect(L, SU, R - L, 40);
    // yansımalar: yıldız sütunları ve ay
    const r = rng(29);
    for (let i = 0; i < 60; i++) {
      const px = L + r() * (R - L), py = SU + 1.5 + r() * 28, w = 0.3 + r() * 1.4;
      x.fillStyle = `rgba(255,240,190,${0.1 + r() * 0.4})`; x.beginPath(); x.ellipse(px, py, w, 0.16, 0, 0, 6.283); x.fill();
    }
    gr = x.createLinearGradient(0, SU, 0, SU + 30); gr.addColorStop(0, 'rgba(235,238,255,0.5)'); gr.addColorStop(1, 'rgba(235,238,255,0)');
    x.fillStyle = gr; x.beginPath(); x.moveTo(SH_AY.x - 3, SU); x.lineTo(SH_AY.x + 3, SU); x.lineTo(SH_AY.x + 6, SU + 30); x.lineTo(SH_AY.x - 6, SU + 30); x.fill();
    x.strokeStyle = 'rgba(190,205,255,0.22)'; x.lineWidth = 0.2;
    for (let i = 0; i < 40; i++) { const py = SU + 2 + r() * 30, px = L + r() * (R - L); x.beginPath(); x.moveTo(px, py); x.lineTo(px + 2 + r() * 6, py); x.stroke(); }
    x.setTransform(1, 0, 0, 1, 0, 0);
    gr = x.createRadialGradient(W / 2, H * 0.5, H * 0.4, W / 2, H * 0.5, Math.hypot(W, H) * 0.62);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(1,3,12,0.5)'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
  });
  return A;
}

// ══════════════════ BULUT ÜLKESİ FONU (Bölüm 3 kısa uyku girişinde oda gün doğumu bulutlarına erir) ══════════════════
const SH_GK = ['#ff6b6b', '#ffa64d', '#ffe066', '#7ed67e', '#6ab8ff', '#7b7bf0', '#c08af0'];   // gökkuşağı (kırmızı → mor)
// yan yana kabarık bulut sırası (oda biriminde): önce gölge rengi, sonra biraz yukarı kaymış açık gövde (altta yumuşak gölge bandı kalır)
function shBulutKume(x, L, R, y0, n, rMin, rMax, col, sd, alt, colAcik) {
  const q = rng(sd), P = [];
  for (let i = 0; i <= n * 2; i++) { const px = L + (i + q() * 0.8) / (n * 2) * (R - L), pr = (rMin + q() * (rMax - rMin)) * (i % 2 ? 0.7 : 1); P.push([px, y0 - pr * (0.2 + q() * 0.35), pr]); }
  const ciz = (cc, dy, k) => { x.fillStyle = cc; x.beginPath(); for (const [px, py, pr] of P) { x.moveTo(px + pr * k, py + dy * pr); x.arc(px, py + dy * pr, pr * k, 0, 6.283); } x.rect(L - 2, y0 + (dy > 0 ? 0 : 0), R - L + 4, (alt || 102) - y0); x.fill(); };
  ciz(col, 0, 1);
  if (colAcik) ciz(colAcik, -0.2, 0.9);
}
function shBulutFonAdim() {
  const c = shTuval(), x = c.getContext('2d');
  const k = sh.k0, L = -sh.wu / 2 - 20, R = sh.wu / 2 + 20;
  const A = { c, W, H, adim: [] };
  A.adim.push(() => {
    x.setTransform(k, 0, 0, k, shCX(), 0);
    let gr = x.createLinearGradient(0, 0, 0, 86);
    gr.addColorStop(0, '#5d58b8'); gr.addColorStop(0.3, '#a679c4'); gr.addColorStop(0.55, '#ee94b6'); gr.addColorStop(0.78, '#ffb89a'); gr.addColorStop(1, '#ffdca4');
    x.fillStyle = gr; x.fillRect(L, -1, R - L, 103);
    const r = rng(19); x.fillStyle = '#ffffff';   // sönmekte olan son yıldızlar
    for (let i = 0; i < 40; i++) { const yy = r() * 34; x.globalAlpha = (0.15 + r() * 0.55) * (1 - yy / 40); x.beginPath(); x.arc(L + r() * (R - L), yy, 0.12 + r() * 0.2, 0, 6.283); x.fill(); }
    x.globalAlpha = 1;
    // güneşin (lamba buraya süzülür) sıcak ışığı göğe yayılır
    gr = x.createRadialGradient(SH_AY.x, SH_AY.y, 0, SH_AY.x, SH_AY.y, 90);
    gr.addColorStop(0, 'rgba(255,244,214,0.75)'); gr.addColorStop(0.18, 'rgba(255,214,180,0.4)'); gr.addColorStop(0.5, 'rgba(255,180,190,0.14)'); gr.addColorStop(1, 'rgba(255,180,190,0)');
    x.fillStyle = gr; x.fillRect(L, -1, R - L, 103);
    // uzak bulut dağları (lila → pembe), üst kenarlarında güneşten altın ışık
    x.globalAlpha = 0.8; shBulutKume(x, L, R, 60, 10, 4, 9, '#b98ac8', 31, 102, '#d9a6d6'); x.globalAlpha = 1;
    shBulutKume(x, L, R, 68, 9, 5, 10, '#de96bd', 37, 102, '#f5bcd4');
    // uzakta yüzen küçük bulut adaları
    for (const [ax, ay, as] of [[-40, 44, 1], [52, 50, 0.8], [8, 38, 0.6]]) {
      x.fillStyle = '#f3b6d2'; x.beginPath(); x.ellipse(ax, ay, 7 * as, 2.2 * as, 0, 0, 6.283); x.arc(ax - 2.5 * as, ay - 1.4 * as, 2.6 * as, 0, 6.283); x.arc(ax + 2 * as, ay - 1.8 * as, 3.2 * as, 0, 6.283); x.fill();
      x.fillStyle = 'rgba(255,240,220,0.7)'; x.beginPath(); x.arc(ax + 2 * as, ay - 2.4 * as, 2.4 * as, Math.PI * 1.1, Math.PI * 1.9); x.arc(ax - 2.5 * as, ay - 1.9 * as, 1.9 * as, Math.PI * 1.1, Math.PI * 1.9); x.fill();
    }
  });
  A.adim.push(() => {
    x.setTransform(k, 0, 0, k, shCX(), 0);
    // yakın bulut denizi (Feza'nın bulut tepeciği bunun içinde yükselir)
    shBulutKume(x, L, R, 77, 8, 6, 11, '#eaa8c8', 43, 102, '#fbd0e0');
    shBulutKume(x, L, R, SH_YER, 7, 7, 12, '#f3bcd4', 47, 102, '#ffe4ee');
    let gr = x.createLinearGradient(0, SH_YER - 12, 0, 100); gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(214,130,180,0.3)');
    x.fillStyle = gr; x.fillRect(L, SH_YER - 12, R - L, 112 - SH_YER);
    x.setTransform(1, 0, 0, 1, 0, 0);
    gr = x.createRadialGradient(W / 2, H * 0.5, H * 0.4, W / 2, H * 0.5, Math.hypot(W, H) * 0.62);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(90,40,100,0.35)'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
  });
  return A;
}
// ön plan (bulut): köşelerde kameradan hızlı kayan, yumuşak gölgeli büyük bulutlar
function shOnPlanBulutCiz() {
  const c = shTuval(), x = c.getContext('2d'), k = H / 100;
  x.setTransform(k, 0, 0, k, W / 2, 0);
  const Rr = sh.wu / 2;
  for (const [cx, yon, sd] of [[-Rr, 1, 3], [Rr, -1, 5]]) {
    const q = rng(sd);
    const yol = () => { x.beginPath(); for (let i = 0; i < 7; i++) { const px = cx + yon * (q() * 26 - 4), py = 100 + q() * 6 - i * 0.6, pr = 7 + q() * 8; x.moveTo(px + pr, py); x.arc(px, py, pr, 0, 6.283); } };
    yol(); x.fillStyle = '#e8a6c8'; x.fill();
    const q2 = rng(sd); const yol2 = () => { x.beginPath(); for (let i = 0; i < 7; i++) { const px = cx + yon * (q2() * 26 - 4), py = 100 + q2() * 6 - i * 0.6 - 1.2, pr = (7 + q2() * 8) * 0.9; x.moveTo(px + pr, py); x.arc(px, py, pr, 0, 6.283); } };
    yol2(); const gr = x.createLinearGradient(0, 84, 0, 104); gr.addColorStop(0, '#fff3f8'); gr.addColorStop(1, '#f6c4da'); x.fillStyle = gr; x.fill();
  }
  return c;
}
// fonun önünde yavaşça kayan bulutlar (ekran pikseli; oda biriminden)
function shBulutKayan(tm, a) {
  if (a <= 0.01) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const k = sh.k0 * sh.zoom, L = -sh.wu / 2 - 30, Rr = sh.wu / 2 + 30;
  for (let i = 0; i < 6; i++) {
    const w = [26, 18, 32, 14, 22, 16][i], y = [22, 33, 46, 15, 55, 40][i], v = [0.9, 1.4, 0.6, 1.8, 0.8, 1.2][i];
    const x = L + (((tm * v + i * 37) % (Rr - L)) + (Rr - L)) % (Rr - L);
    g.globalAlpha = a * [0.75, 0.6, 0.55, 0.7, 0.5, 0.65][i];
    g.drawImage(shBulutSprite(i % 3 === 1 ? 'altin' : i % 2 ? 'beyaz' : 'koyu'), shEkranX(x - w / 2), shEkranY(y - w / 4), w * k, w * k / 2);
  }
  g.globalAlpha = 1;
}
function shPencereYol(x, pad) { const P0 = SH_PEN, cxw = (P0.x0 + P0.x1) / 2, rw = (P0.x1 - P0.x0) / 2, ya = P0.ust + rw; x.beginPath(); x.moveTo(P0.x0 - pad, P0.alt + pad); x.lineTo(P0.x0 - pad, ya); x.arc(cxw, ya, rw + pad, Math.PI, 0); x.lineTo(P0.x1 + pad, P0.alt + pad); x.closePath(); }
// Bölüm 3 kısa girişi: pencerede şafak söker (pembe-altın), odaya pembe ışık düşer
function shPencerePembe(a, tm) {
  if (a <= 0.01) return;
  shOdaT(); g.save(); shPencereYol(g, 0); g.clip();
  const gr = g.createLinearGradient(0, SH_PEN.ust, 0, SH_PEN.alt);
  gr.addColorStop(0, 'rgba(160,120,220,0.5)'); gr.addColorStop(0.55, 'rgba(255,150,190,0.85)'); gr.addColorStop(1, 'rgba(255,214,160,1)');
  g.globalAlpha = a * 0.85; g.fillStyle = gr; g.fillRect(SH_PEN.x0 - 1, SH_PEN.ust - 1, SH_PEN.x1 - SH_PEN.x0 + 2, SH_PEN.alt - SH_PEN.ust + 2);
  g.globalAlpha = a; g.fillStyle = '#fbc0d6'; g.beginPath(); for (let i = 0; i <= 6; i++) { const px = SH_PEN.x0 + i * 4.4, pr = 2.4 + (i % 3) * 0.9; g.moveTo(px + pr, SH_PEN.alt - 4); g.arc(px, SH_PEN.alt - 4 - pr * 0.3, pr, 0, 6.283); } g.rect(SH_PEN.x0 - 1, SH_PEN.alt - 4, 30, 6); g.fill();
  g.restore(); g.globalAlpha = 1;
  // pencere çerçevesi yeniden (önbellekteki kayıtların üstüne şafak çizildi)
  g.fillStyle = SH_GECE.frame; g.globalAlpha = a; const cxw = (SH_PEN.x0 + SH_PEN.x1) / 2;
  g.fillRect(cxw - 0.6, SH_PEN.ust, 1.2, SH_PEN.alt - SH_PEN.ust); g.fillRect(SH_PEN.x0, 31, SH_PEN.x1 - SH_PEN.x0, 1.2); g.globalAlpha = 1;
  shHuzme(true, a, tm, 'pembe');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const k = sh.k0 * sh.zoom; dglow('#ff9fc4', shEkranX(27), shEkranY(33), k * 38, a * 0.32); dglow('#ffd9a8', shEkranX(27), shEkranY(42), k * 14, a * 0.3);
  g.globalCompositeOperation = 'source-over';
}

// ══════════════════ SEÇİM EKRANI: RÜYA KAVANOZLARI (başlık ekranı = yatak başı) ══════════════════
// Yatağın üstünde, duvar boyunca uzun, büyülü bir ahşap raf; Pırıl her rüyayı ışıldayan bir cam kavanozda saklar. Kavanozun içinde
// o rüyanın canlı resmi (eski balon resimleri: önbellekte DURAĞAN iç resim shBalonIc + her karede CANLI katman shIkonCanli) kavanoz
// biçiminde kesilmiş olarak oynar, içinde ışık tozları süzülür; üstünde önbellekli cam, rüyanın renginde kurdele, simgeli etiket ve
// mantar tıpa. Raf parmakla kaydırılır (atalet, ortaya yumuşak oturma, uçlarda lastik gibi esneme); fare sürükleme, tekerlek ve ok
// tuşları da çalışır. Ortadaki kavanoz büyük (≈1,36×), nefes alır ve ışıldar. Sürükleme kavanoz açmaz (eşik); TEK dokunuş yeter:
// kavanoz ortaya kayar, mantarı fırlar, ışık süzülür, sonra eski balondaki gibi rüyaya dalınır (onSec → oyun.js aynı yükleme yolu).
// Liste veriye dayalı: yeni rüya = oyun.js listesinde bir satır (resmi yoksa genel bir rüya resmi, etikette yıldız çizilir).
const SH_BALON_RENK = { orman: '#ffe6a8', gol: '#a8b8ff', bulut: '#ffc8e0', deniz: '#9fe6ff', dag: '#ffd9a0', volkan: '#ffba87', senlik: '#e2b6ff', kar: '#c4e2ff', cadi: '#ffa94d', ejderha: '#8fe8b8' };
const shEaseOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const shEaseBack = t => { t = clamp(t, 0, 1); const c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
// yumuşak bulut sprite'ı (bir kez): kabarık üst, düz alt, üstten ışık alan pembe-beyaz
const shBulutSpr = {};
function shBulutSprite(tur) {
  if (shBulutSpr[tur]) return shBulutSpr[tur];
  const w = 256, h = 128, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const renk = tur === 'koyu' ? ['#f6c3d6', '#e49ab8', '#fbe1ea'] : tur === 'altin' ? ['#fff1d6', '#ffc89a', '#ffffff'] : ['#ffffff', '#f6c6da', '#ffffff'];
  const yol = () => { x.beginPath(); for (const [px, py, r] of [[0.2, 0.68, 0.17], [0.36, 0.5, 0.25], [0.56, 0.42, 0.3], [0.76, 0.56, 0.22], [0.88, 0.7, 0.13]]) { x.moveTo(px * w + r * h * 1.6, py * h); x.arc(px * w, py * h, r * h * 1.6 * 0.5 * 1.25, 0, 6.283); } x.rect(0.12 * w, 0.62 * h, 0.8 * w, 0.24 * h); };
  yol(); const gr = x.createLinearGradient(0, h * 0.1, 0, h * 0.9); gr.addColorStop(0, renk[0]); gr.addColorStop(0.55, renk[0]); gr.addColorStop(1, renk[1]); x.fillStyle = gr; x.fill();
  x.save(); yol(); x.clip(); const hg = x.createRadialGradient(w * 0.45, h * 0.18, 0, w * 0.45, h * 0.18, h * 0.6); hg.addColorStop(0, 'rgba(255,255,255,0.9)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = hg; x.fillRect(0, 0, w, h); x.restore();
  return shBulutSpr[tur] = c;
}
// kuzucuk (yerel birim: r = boy): yünlü beyaz gövde, gülen yüz; yalnız gövdenin üstü (ayaklar bulutta)
function shKuzu(x, cx, cy, r, yon, goz) {
  x.save(); x.translate(cx, cy); x.scale(yon, 1);
  const govde = (k, cc) => { x.fillStyle = cc; x.beginPath(); for (const [px, py, pr] of [[-0.55, -0.05, 0.4], [-0.15, -0.25, 0.45], [0.3, -0.15, 0.42], [0.0, 0.05, 0.45], [-0.45, 0.2, 0.32], [0.05, 0.25, 0.45], [0.5, 0.12, 0.38]]) { x.moveTo(px * r + (pr + k) * r, py * r); x.arc(px * r, py * r, (pr + k) * r, 0, 6.283); } x.fill(); };
  govde(0.07, 'rgba(150,100,160,0.45)');   // yumuşak dış hat (açık zeminde seçilsin)
  x.fillStyle = 'rgba(150,100,160,0.45)'; x.beginPath(); x.ellipse(0.72 * r, -0.12 * r, 0.39 * r, 0.34 * r, 0.2, 0, 6.283); x.fill();
  govde(0, '#eedbe8');
  x.fillStyle = '#ffffff'; x.beginPath(); for (const [px, py, pr] of [[-0.55, -0.1, 0.33], [-0.15, -0.3, 0.38], [0.3, -0.2, 0.35], [0.0, -0.02, 0.36]]) { x.moveTo(px * r + pr * r, py * r); x.arc(px * r, py * r, pr * r, 0, 6.283); } x.fill();
  x.fillStyle = '#f9dbe7'; x.beginPath(); x.ellipse(0.72 * r, -0.12 * r, 0.32 * r, 0.27 * r, 0.2, 0, 6.283); x.fill();   // yüz
  x.fillStyle = '#e9b9cc'; x.beginPath(); x.ellipse(0.55 * r, -0.36 * r, 0.16 * r, 0.08 * r, -0.6, 0, 6.283); x.fill();   // kulak
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0.62 * r, -0.38 * r, 0.16 * r, 0, 6.283); x.fill();   // perçem
  x.strokeStyle = '#6a4a6a'; x.lineWidth = Math.max(0.8, r * 0.055); x.lineCap = 'round';
  x.beginPath(); if (goz) x.arc(0.8 * r, -0.16 * r, 0.06 * r, Math.PI * 1.1, Math.PI * 1.9); else x.arc(0.8 * r, -0.2 * r, 0.06 * r, 0.1, Math.PI - 0.1); x.stroke();
  x.fillStyle = 'rgba(255,140,170,0.55)'; x.beginPath(); x.arc(0.86 * r, -0.03 * r, 0.07 * r, 0, 6.283); x.fill();
  x.restore();
}
function shIkonCiz(x, ad, d) {   // DURAĞAN iç resim, d×d kare; çağıran daireyle keser (canlı parçalar shIkonCanli'de)
  let gr;
  if (ad === 'volkan') { sh5Fon(x, d, d); return; }
  if (ad === 'senlik') { sh6Fon(x, d, d); return; }
  if (ad === 'kar') { sh7Fon(x, d, d); return; }
  if (ad === 'cadi') { sh8Fon(x, d, d); return; }

  if (ad === 'uzay') { if (typeof sh14Fon === 'function') sh14Fon(x,d,d); return; }
  if (ad === 'ipek') { if (typeof sh13Fon === 'function') sh13Fon(x,d,d); return; }
  if (ad === 'kampus') { if(typeof sh12Fon==='function') sh12Fon(x,d,d); return; }
  if (ad === 'sato') { if (typeof sh11Fon === 'function') sh11Fon(x, d, d); return; }
  if (ad === 'ejderha') { sh9Fon(x, d, d); return; }
  if (ad === 'deniz') { shDenizResim(x, d); return; }
  if (ad === 'orman') {   // gece ormanı: katmanlı siluetler, ay ışığı hüzmesi, ışıklı ağaç, parlayan çiçek
    gr = x.createLinearGradient(0, 0, 0, d); gr.addColorStop(0, '#0e2a66'); gr.addColorStop(0.4, '#2a74a8'); gr.addColorStop(0.75, '#5cc4b8'); gr.addColorStop(1, '#a8f0c8');
    x.fillStyle = gr; x.fillRect(0, 0, d, d);
    let r = rng(5); x.fillStyle = '#fff';
    for (let i = 0; i < 14; i++) { x.globalAlpha = 0.3 + r() * 0.6; x.beginPath(); x.arc(r() * d, r() * d * 0.35, d * (0.004 + r() * 0.005), 0, 6.283); x.fill(); }
    x.globalAlpha = 1;
    const katman = (col, taban, n, h0, h1, sd) => {
      const q = rng(sd); x.fillStyle = col;
      for (let i = 0; i < n; i++) { const px = (i + 0.2 + q() * 0.6) / n * d * 1.1 - d * 0.05, h = h0 + q() * (h1 - h0), w = d * (0.05 + q() * 0.03);
        x.beginPath(); x.moveTo(px - w, taban * d); x.lineTo(px, (taban - h) * d); x.lineTo(px + w, taban * d); x.fill();
        x.beginPath(); x.moveTo(px - w * 1.3, (taban - h * 0.35) * d); x.lineTo(px, (taban - h * 0.95) * d); x.lineTo(px + w * 1.3, (taban - h * 0.35) * d); x.fill(); }
    };
    katman('rgba(30,110,140,0.6)', 0.8, 9, 0.35, 0.55, 3);
    x.globalCompositeOperation = 'lighter';
    for (const [a0, w] of [[0.52, 0.14], [0.6, 0.1], [0.68, 0.16]]) { const g2 = x.createLinearGradient(d * 0.62, 0, d * a0, d * 0.85); g2.addColorStop(0, 'rgba(200,235,255,0.5)'); g2.addColorStop(1, 'rgba(200,235,255,0)');
      x.fillStyle = g2; x.beginPath(); x.moveTo(d * 0.58, 0); x.lineTo(d * 0.68, 0); x.lineTo(d * (a0 + w + 0.08), d * 0.85); x.lineTo(d * (a0 - w), d * 0.85); x.fill(); }
    x.globalCompositeOperation = 'source-over';
    katman('rgba(10,62,92,0.85)', 0.84, 7, 0.4, 0.7, 8);
    x.fillStyle = '#07303f';   // büyük ışık ağacı
    x.beginPath(); x.moveTo(d * 0.5, d * 0.86); x.quadraticCurveTo(d * 0.54, d * 0.62, d * 0.5, d * 0.44); x.lineTo(d * 0.62, d * 0.44); x.quadraticCurveTo(d * 0.62, d * 0.62, d * 0.68, d * 0.86); x.fill();
    for (const [px, py, pr] of [[0.56, 0.3, 0.2], [0.42, 0.37, 0.14], [0.71, 0.36, 0.15], [0.56, 0.18, 0.13], [0.47, 0.25, 0.12], [0.66, 0.24, 0.11]]) { x.beginPath(); x.arc(px * d, py * d, pr * d, 0, 6.283); x.fill(); }
    x.globalCompositeOperation = 'lighter';
    let rg = x.createRadialGradient(d * 0.56, d * 0.3, 0, d * 0.56, d * 0.3, d * 0.34); rg.addColorStop(0, 'rgba(255,235,160,0.45)'); rg.addColorStop(1, 'rgba(255,235,160,0)');
    x.fillStyle = rg; x.fillRect(0, 0, d, d);
    r = rng(9);
    for (let i = 0; i < 16; i++) { const a2 = r() * 6.283, rr = r() * d * 0.17; x.fillStyle = 'rgba(255,238,170,0.8)'; x.beginPath(); x.arc(d * 0.56 + Math.cos(a2) * rr * 1.2, d * 0.3 + Math.sin(a2) * rr, d * (0.005 + r() * 0.005), 0, 6.283); x.fill(); }
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#04241f'; x.beginPath(); x.moveTo(0, d * 0.87); for (let i = 0; i <= 12; i++) x.lineTo(i / 12 * d, d * (0.855 + 0.012 * Math.sin(i * 1.7))); x.lineTo(d, d); x.lineTo(0, d); x.fill();
    x.strokeStyle = 'rgba(127,255,230,0.6)'; x.lineWidth = d * 0.006; x.beginPath(); for (let i = 0; i <= 24; i++) x.lineTo(i / 24 * d, d * (0.858 + 0.012 * Math.sin(i * 0.85))); x.stroke();
    const fx = d * 0.24, fy = d * 0.76;   // parlayan çiçek
    x.strokeStyle = '#2fb08a'; x.lineWidth = d * 0.022; x.lineCap = 'round'; x.beginPath(); x.moveTo(fx, d * 0.9); x.quadraticCurveTo(fx - d * 0.04, fy + d * 0.08, fx, fy); x.stroke();
    x.fillStyle = '#ffa6d6'; for (let i = 0; i < 6; i++) { x.save(); x.translate(fx, fy); x.rotate(i * 1.047); x.beginPath(); x.ellipse(0, -d * 0.055, d * 0.032, d * 0.06, 0, 0, 6.283); x.fill(); x.restore(); }
    x.fillStyle = '#fff0a0'; x.beginPath(); x.arc(fx, fy, d * 0.03, 0, 6.283); x.fill();
    // ışıklı mantarlar (sağ önde)
    for (const [mx, my, ms] of [[0.8, 0.86, 1], [0.87, 0.875, 0.7]]) {
      x.fillStyle = '#cfe9ef'; x.fillRect(d * (mx - 0.006 * ms), d * (my - 0.05 * ms), d * 0.012 * ms, d * 0.05 * ms);
      x.fillStyle = '#5fd0e8'; x.beginPath(); x.ellipse(d * mx, d * (my - 0.05 * ms), d * 0.03 * ms, d * 0.022 * ms, 0, Math.PI, 0); x.fill();
    }
  } else if (ad === 'gol') {   // yıldız gölü: gece göğü, katmanlı dağlar, ay, yıldızlar, yansıma (yıldızların ışıltısı ve uyuyan yıldız canlı)
    gr = x.createLinearGradient(0, 0, 0, d * 0.64); gr.addColorStop(0, '#070c3a'); gr.addColorStop(0.6, '#2c3490'); gr.addColorStop(1, '#6a6ad0');
    x.fillStyle = gr; x.fillRect(0, 0, d, d * 0.64);
    gr = x.createLinearGradient(0, d * 0.64, 0, d); gr.addColorStop(0, '#4a52b8'); gr.addColorStop(0.25, '#1e2a78'); gr.addColorStop(1, '#080f3c'); x.fillStyle = gr; x.fillRect(0, d * 0.64, d, d * 0.36);
    x.globalCompositeOperation = 'lighter'; let rg = x.createRadialGradient(d * 0.74, d * 0.2, 0, d * 0.74, d * 0.2, d * 0.4); rg.addColorStop(0, 'rgba(230,236,255,0.5)'); rg.addColorStop(1, 'rgba(230,236,255,0)'); x.fillStyle = rg; x.fillRect(0, 0, d, d); x.globalCompositeOperation = 'source-over';
    const rr = rng(77); x.fillStyle = '#ffffff';
    for (let i = 0; i < 30; i++) { x.globalAlpha = 0.25 + rr() * 0.5; x.beginPath(); x.arc(rr() * d, rr() * d * 0.5, d * (0.002 + rr() * 0.004), 0, 6.283); x.fill(); } x.globalAlpha = 1;
    const dag = (col, taban, amp, f1, f2, ph) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, d * 0.64); for (let i = 0; i <= 40; i++) { const u = i / 40; x.lineTo(u * d, d * (taban - amp * (0.5 + 0.5 * Math.sin(u * f1 + ph)) - amp * 0.4 * Math.sin(u * f2 + ph * 2))); } x.lineTo(d, d * 0.64); x.fill(); };
    dag('rgba(60,66,160,0.8)', 0.55, 0.12, 7, 17, 1); dag('rgba(26,32,100,0.95)', 0.6, 0.1, 5, 13, 3.5);
    x.fillStyle = '#fff6d6'; x.beginPath(); x.arc(d * 0.74, d * 0.2, d * 0.075, 0, 6.283); x.fill();
    x.fillStyle = '#2f3aa0'; x.beginPath(); x.arc(d * 0.77, d * 0.185, d * 0.07, 0, 6.283); x.fill();
    for (const [px, py, pr] of SH_GOL_YILDIZ) {
      x.globalCompositeOperation = 'lighter'; rg = x.createRadialGradient(px * d, py * d, 0, px * d, py * d, pr * d * 3); rg.addColorStop(0, 'rgba(255,240,170,0.45)'); rg.addColorStop(1, 'rgba(255,240,170,0)'); x.fillStyle = rg; x.fillRect(px * d - pr * d * 3, py * d - pr * d * 3, pr * d * 6, pr * d * 6); x.globalCompositeOperation = 'source-over';
      x.fillStyle = '#fff4c0'; shYildiz4(x, px * d, py * d, pr * d * 1.3, 0.3); x.fill();
      x.fillStyle = 'rgba(255,242,184,0.4)'; x.beginPath(); x.ellipse(px * d, d * 0.64 + (d * 0.64 - py * d) * 0.5, pr * d * 0.7, pr * d * 0.26, 0, 0, 6.283); x.fill();
    }
    x.fillStyle = 'rgba(235,238,255,0.3)'; x.beginPath(); x.moveTo(d * 0.7, d * 0.64); x.lineTo(d * 0.8, d * 0.64); x.lineTo(d * 0.86, d * 0.95); x.lineTo(d * 0.64, d * 0.95); x.fill();
    // kıyıda sazlar
    x.strokeStyle = '#0a1240'; x.lineWidth = d * 0.008; x.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const bx = d * (0.02 + i * 0.022), h = d * (0.08 + (i % 3) * 0.03); x.beginPath(); x.moveTo(bx, d); x.quadraticCurveTo(bx + d * 0.01, d - h * 0.6, bx + d * 0.02 * Math.sin(i), d - h); x.stroke(); }
  } else if (ad === 'bulut') {   // bulut ülkesi: gün doğumu; pembe bulut denizi, ufukta güneş, yumuşak gökkuşağı (kayan bulutlar, kuzucuk canlı)
    gr = x.createLinearGradient(0, 0, 0, d); gr.addColorStop(0, '#7f74d6'); gr.addColorStop(0.3, '#d98fc6'); gr.addColorStop(0.55, '#ffb6a6'); gr.addColorStop(0.72, '#ffd9a6'); gr.addColorStop(1, '#ffe9c4');
    x.fillStyle = gr; x.fillRect(0, 0, d, d);
    const rr = rng(41); x.fillStyle = '#ffffff';
    for (let i = 0; i < 12; i++) { x.globalAlpha = 0.25 + rr() * 0.45 * (1 - i / 14); x.beginPath(); x.arc(rr() * d, rr() * d * 0.28, d * (0.003 + rr() * 0.004), 0, 6.283); x.fill(); } x.globalAlpha = 1;
    // güneş ışığı (ufukta)
    x.globalCompositeOperation = 'lighter';
    let rg = x.createRadialGradient(d * 0.5, d * 0.72, 0, d * 0.5, d * 0.72, d * 0.5); rg.addColorStop(0, 'rgba(255,240,200,0.6)'); rg.addColorStop(0.25, 'rgba(255,214,170,0.3)'); rg.addColorStop(1, 'rgba(255,200,170,0)');
    x.fillStyle = rg; x.fillRect(0, 0, d, d); x.globalCompositeOperation = 'source-over';
    // yumuşak gökkuşağı (yedi renk, dış kenarı silik)
    const GK = ['#ff6b6b', '#ffa64d', '#ffe066', '#7ed67e', '#6ab8ff', '#7b7bf0', '#c08af0'];
    x.lineCap = 'butt';
    for (let i = 0; i < 7; i++) { x.strokeStyle = GK[i]; x.globalAlpha = 0.5; x.lineWidth = d * 0.026; x.beginPath(); x.arc(d * 0.5, d * 0.78, d * (0.47 - i * 0.025), Math.PI * 1.04, Math.PI * 1.96); x.stroke(); }
    x.globalAlpha = 0.22; x.strokeStyle = '#ffffff'; x.lineWidth = d * 0.05; x.beginPath(); x.arc(d * 0.5, d * 0.78, d * 0.3, Math.PI * 1.04, Math.PI * 1.96); x.stroke(); x.globalAlpha = 1;
    // güneş diski
    x.fillStyle = '#fff1cf'; x.beginPath(); x.arc(d * 0.5, d * 0.71, d * 0.075, 0, 6.283); x.fill();
    // uzak bulut kıyısı
    const kume = (y0, n, rMin, rMax, col, sd) => { const q = rng(sd); x.fillStyle = col; x.beginPath(); for (let i = 0; i <= n; i++) { const px = i / n * d * 1.1 - d * 0.05, pr = d * (rMin + q() * (rMax - rMin)); x.moveTo(px + pr, y0 * d); x.arc(px, y0 * d, pr, 0, 6.283); } x.rect(-2, y0 * d, d + 4, d); x.fill(); };
    kume(0.72, 9, 0.05, 0.09, '#f7b9cf', 3);
    x.globalAlpha = 0.6; kume(0.715, 9, 0.03, 0.05, '#ffe0ea', 3); x.globalAlpha = 1;
    kume(0.8, 7, 0.07, 0.11, '#fbd0de', 7);
    // yakın bulut denizi: kabarık, üstten ışık
    kume(0.88, 6, 0.09, 0.14, '#f8cfe0', 11);
    rg = x.createLinearGradient(0, d * 0.76, 0, d); rg.addColorStop(0, 'rgba(255,255,255,0.3)'); rg.addColorStop(1, 'rgba(220,140,190,0.25)');
    x.fillStyle = rg; x.fillRect(0, d * 0.76, d, d * 0.24);
  } else {   // genel rüya: yumuşak gökyüzü, bulutlar, ay, yıldızlar (deniz / dag ve bilinmeyenler)
    const ton = { deniz: ['#0a2a5a', '#2a8ac0', '#bff0ff'], dag: ['#2a1f58', '#c46a8a', '#ffd9a0'] }[ad] || ['#1a2a68', '#6a5ac8', '#ffd0f0'];
    gr = x.createLinearGradient(0, 0, 0, d); gr.addColorStop(0, ton[0]); gr.addColorStop(0.65, ton[1]); gr.addColorStop(1, ton[2]);
    x.fillStyle = gr; x.fillRect(0, 0, d, d);
    x.fillStyle = 'rgba(255,255,255,0.8)';
    for (const [px, py, pr] of [[0.3, 0.55, 0.12], [0.42, 0.52, 0.16], [0.56, 0.56, 0.12], [0.7, 0.7, 0.1], [0.2, 0.75, 0.09]]) { x.beginPath(); x.arc(px * d, py * d, pr * d, 0, 6.283); x.fill(); }
    x.fillStyle = '#fff6d0'; x.beginPath(); x.arc(d * 0.72, d * 0.25, d * 0.08, 0, 6.283); x.fill();
    for (const [px, py] of [[0.2, 0.2], [0.4, 0.12], [0.5, 0.3], [0.85, 0.5]]) { x.fillStyle = '#fff2b8'; shYildiz5(x, px * d, py * d, d * 0.035); x.fill(); }
  }
}
const SH_GOL_YILDIZ = [[0.2, 0.17, 0.05], [0.42, 0.09, 0.034], [0.34, 0.33, 0.04], [0.56, 0.26, 0.055], [0.1, 0.4, 0.03], [0.9, 0.42, 0.034], [0.5, 0.44, 0.028], [0.64, 0.07, 0.025], [0.26, 0.5, 0.025]];
// canlı katman: (ox, oy) iç resmin sol üstü, q kenar (ekran pikseli); g üzerinde, çağıran daireyle keser. a: saydamlık. hov: üzerine gelindiğinde minyatür nefes alma
function shIkonCanli(ad, ox, oy, q, tm, a, i0, hov) {
  hov = hov || 0;
  if (ad === 'volkan') { sh5Canli(ox,oy,q,tm,a,hov); return; }
  if (ad === 'senlik') { sh6Canli(ox, oy, q, q, tm, a, hov); return; }
  if (ad === 'kar') { sh7Canli(ox, oy, q, q, tm, a, hov); return; }
  if (ad === 'cadi') { sh8Canli(ox, oy, q, q, tm, a, hov); return; }

  if (ad === 'uzay') { if (typeof sh14Canli === 'function') sh14Canli(ox,oy,q,q,tm,a,hov); return; }
  if (ad === 'ipek') { if (typeof sh13Canli === 'function') sh13Canli(ox,oy,q,q,tm,a,hov); return; }
  if (ad === 'kampus') { if(typeof sh12Canli==='function') sh12Canli(ox,oy,q,q,tm,a,hov); return; }
  if (ad === 'sato') { if (typeof sh11Canli === 'function') sh11Canli(ox, oy, q, q, tm, a, hov); return; }
  if (ad === 'ejderha') { sh9Canli(ox, oy, q, q, tm, a, hov); return; }
  const hovAmp = 1 + 0.35 * hov;
  const U = (u, v) => [ox + u * q, oy + v * q];
  if (ad === 'deniz') {
    // denizin dalgalanması: su altı ışık dalgaları, sedef kabarcıklar, salınan yosunlar ve ışıldayan planktonlar
    g.save();
    // 1) Sualtı ışık dalgaları (caustics)
    g.globalCompositeOperation = 'lighter';
    for (let j = 0; j < 5; j++) {
      const cy = oy + q * (0.32 + j * 0.13 + Math.sin(tm * 1.1 + j * 1.5) * 0.02 * hovAmp);
      g.strokeStyle = j % 2 ? 'rgba(94, 246, 228, 0.28)' : 'rgba(167, 243, 208, 0.22)';
      g.lineWidth = Math.max(1.5, q * (0.012 + (j % 3) * 0.005));
      g.beginPath();
      for (let s = 0; s <= 20; s++) {
        const u = s / 20, cx = ox + u * q;
        const wave = Math.sin(tm * (1.6 + j * 0.3) + u * 7 + j) * q * 0.022 * hovAmp;
        if (s === 0) g.moveTo(cx, cy + wave); else g.lineTo(cx, cy + wave);
      }
      g.stroke();
    }
    // 2) Yükselen sedef kabarcıklar
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = a * 0.75;
    for (let i = 0; i < 9; i++) {
      const spd = 0.038 + (i % 3) * 0.018;
      const prog = (tm * spd + i * 0.111) % 1;
      const bx = ox + q * (0.12 + ((i * 0.147) % 0.76) + Math.sin(tm * 1.4 + i * 2) * 0.035 * hovAmp);
      const by = oy + q * (0.92 - prog * 0.85);
      const br = q * (0.01 + (i % 4) * 0.004) * (0.7 + 0.3 * Math.sin(prog * Math.PI));
      g.strokeStyle = i % 2 ? '#bbf7d0' : '#cffafe';
      g.lineWidth = Math.max(1, q * 0.004);
      g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.45)';
      g.beginPath(); g.arc(bx - br * 0.3, by - br * 0.3, br * 0.3, 0, Math.PI * 2); g.fill();
    }
    // 3) Tabanda salınan yosunlar / mercanlar
    g.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      const kx = ox + q * (0.18 + k * 0.13);
      const ky = oy + q * 0.94;
      const kh = q * (0.16 + (k % 3) * 0.06);
      const kSway = Math.sin(tm * 1.3 + k * 1.1) * q * 0.035 * hovAmp;
      g.strokeStyle = k % 2 ? 'rgba(45, 212, 191, 0.65)' : 'rgba(20, 184, 166, 0.7)';
      g.lineWidth = Math.max(1.8, q * 0.01);
      g.beginPath();
      g.moveTo(kx, ky);
      g.quadraticCurveTo(kx + kSway * 0.5, ky - kh * 0.5, kx + kSway, ky - kh);
      g.stroke();
    }
    // 4) Işıldayan plankton parıltıları
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 7; k++) {
      const tw = 0.5 + 0.5 * Math.sin(tm * (2.4 + (k % 3) * 0.8) + k * 1.9);
      const [px, py] = U(0.15 + (k * 0.13) % 0.7, 0.25 + (k * 0.11) % 0.6 + Math.sin(tm * 0.8 + k) * 0.02);
      shParilti(px, py, q * 0.028 * (0.6 + tw * 0.8), a * tw * 0.85);
    }
    g.restore();
    return;
  }
  g.globalCompositeOperation = 'lighter';
  if (ad === 'orman') {
    const nb = 0.5 + 0.5 * Math.sin(tm * 1.3 + i0);
    let [px, py] = U(0.56, 0.3); dglow('#ffe9a0', px, py, q * (0.3 + 0.05 * nb * hovAmp), a * (0.22 + 0.18 * nb * hovAmp));   // ağaç tacı nefes alır
    [px, py] = U(0.24, 0.76); dglow('#ff9ad6', px, py, q * (0.14 + 0.04 * nb * hovAmp), a * (0.35 + 0.28 * nb * hovAmp));     // çiçek
    // orman yapraklarının kımıldaması (rustling leaves & swaying branches)
    g.save();
    g.globalCompositeOperation = 'source-over';
    for (let lf = 0; lf < 8; lf++) {
      const lu = 0.2 + (lf * 0.11) % 0.6 + Math.sin(tm * 1.2 + lf * 1.7) * 0.02 * hovAmp;
      const lv = 0.2 + (lf * 0.09) % 0.45 + Math.sin(tm * 1.5 + lf * 2.1) * 0.018 * hovAmp;
      const rot = Math.sin(tm * 2.1 + lf * 1.4) * 0.35 * hovAmp;
      const [lx, ly] = U(lu, lv);
      g.save(); g.translate(lx, ly); g.rotate(rot);
      g.fillStyle = lf % 2 ? 'rgba(110, 231, 183, 0.75)' : 'rgba(52, 211, 153, 0.75)';
      g.beginPath(); g.ellipse(0, 0, q * 0.018, q * 0.009, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    g.restore();
    for (let k = 0; k < 11; k++) {   // süzülen ışık küreleri: yavaş, kıvrımlı yollar
      const s = k * 1.37 + i0, u = 0.12 + 0.76 * (0.5 + 0.5 * Math.sin(tm * (0.13 + (k % 4) * 0.03) + s)), v = 0.44 + 0.36 * (0.5 + 0.5 * Math.sin(tm * (0.19 + (k % 3) * 0.04) + s * 2.1));
      const tw = 0.5 + 0.5 * Math.sin(tm * (2.2 + (k % 3) * 0.7) + s * 3);
      [px, py] = U(u, v); dglow(k % 3 ? '#d8ffb0' : '#b0fff0', px, py, q * 0.035 * (0.7 + tw * 0.6), a * (0.25 + 0.6 * tw));
      if (tw > 0.55) dglow('#ffffff', px, py, q * 0.008, a * (tw - 0.5) * 1.6);
    }
    for (let k = 0; k < 5; k++) {   // taçtan süzülen ışık tozu
      const u = (tm * 0.07 + k / 5) % 1, sx = 0.48 + 0.16 * Math.sin(k * 2.3) + 0.03 * Math.sin(tm * 0.9 + k);
      [px, py] = U(sx, 0.32 + u * 0.5); dglow('#fff0b0', px, py, q * 0.02, a * Math.sin(u * Math.PI) * 0.8);
    }
  } else if (ad === 'gol') {
    for (let k = 0; k < SH_GOL_YILDIZ.length; k++) {   // yıldızlar ışıldar, yansımaları titrer
      const [u, v, r] = SH_GOL_YILDIZ[k], tw = 0.5 + 0.5 * Math.sin(tm * (1.4 + (k % 3) * 0.5) + k * 2.2 + i0);
      let [px, py] = U(u, v); shParilti(px, py, q * r * (1.2 + 1.3 * tw), a * tw * 0.75);
      [px, py] = U(u + 0.012 * Math.sin(tm * 1.7 + k), 0.64 + (0.64 - v) * 0.5); dglow('#fff0c0', px, py, q * r * 0.9, a * (0.15 + 0.2 * tw));
    }
    // göl suyunun parıldaması: yüzeyde parıldayan dalgacıklar
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let gw = 0; gw < 5; gw++) {
      const gwy = oy + q * (0.65 + gw * 0.06 + Math.sin(tm * 1.4 + gw) * 0.01 * hovAmp);
      g.strokeStyle = 'rgba(219, 234, 254, 0.45)';
      g.lineWidth = Math.max(1.2, q * 0.005);
      g.beginPath();
      for (let s = 0; s <= 16; s++) {
        const u = s / 16, gwx = ox + u * q;
        const wave = Math.sin(tm * 2.2 + u * 12 + gw * 1.7) * q * 0.008 * hovAmp;
        if (s === 0) g.moveTo(gwx, gwy + wave); else g.lineTo(gwx, gwy + wave);
      }
      g.stroke();
    }
    g.restore();
    for (let k = 0; k < 7; k++) {   // suda kayan ışıltılar
      const u = ((tm * 0.025 * (1 + (k % 3) * 0.4) + k * 0.31) % 1.2) - 0.1, v = 0.68 + (k * 0.043) % 0.26, al = Math.sin(clamp(u, 0, 1) * Math.PI) * (0.5 + 0.5 * Math.sin(tm * 1.9 + k));
      const [px, py] = U(u, v); g.globalAlpha = a * al * 0.5; g.fillStyle = '#dfe6ff'; g.fillRect(px - q * 0.04, py, q * 0.08, Math.max(1, q * 0.005)); g.globalAlpha = 1;
    }
    const kz = (tm * 0.11 + i0 * 0.3) % 1;   // ara sıra kayan yıldız
    if (kz < 0.14) { const u = kz / 0.14, [sx, sy] = U(0.15 + u * 0.45, 0.05 + u * 0.16), L = q * 0.12; g.globalAlpha = a * Math.sin(u * Math.PI); g.strokeStyle = '#fff6dc'; g.lineWidth = Math.max(1, q * 0.006); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx - L * 0.94, sy - L * 0.34); g.stroke(); g.globalAlpha = 1; dglow('#fff6dc', sx, sy, q * 0.03, a * Math.sin(u * Math.PI)); }
    // gölde uyuyan küçük yıldız (hafifçe iner-çıkar, nefes alır)
    const bob = Math.sin(tm * 1.3 + i0) * 0.008 * hovAmp, [sx, sy] = U(0.4, 0.8 + bob), nb = 0.5 + 0.5 * Math.sin(tm * 1.1);
    dglow('#ffe6a0', sx, sy, q * (0.15 + 0.04 * nb * hovAmp), a * (0.5 + 0.25 * nb));
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = a;
    g.fillStyle = '#ffe49a'; shYildiz5(g, sx, sy, q * 0.065); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)'; shYildiz5(g, sx - q * 0.008, sy - q * 0.01, q * 0.03); g.fill();
    g.strokeStyle = '#7a5a20'; g.lineWidth = Math.max(1, q * 0.007); g.lineCap = 'round';
    g.beginPath(); g.arc(sx - q * 0.016, sy + q * 0.004, q * 0.01, 0.2, 2.9); g.stroke(); g.beginPath(); g.arc(sx + q * 0.016, sy + q * 0.004, q * 0.01, 0.2, 2.9); g.stroke();
    g.globalAlpha = 1;
  } else if (ad === 'bulut') {
    // güneş ışınları yavaşça döner
    const [gx, gy] = U(0.5, 0.71);
    g.save(); g.translate(gx, gy); g.rotate(tm * 0.05); g.fillStyle = '#fff2d0';
    for (let k = 0; k < 9; k++) { g.rotate(0.698); g.globalAlpha = a * (0.045 + 0.03 * Math.sin(tm * 0.8 + k * 1.3)); g.beginPath(); g.moveTo(0, 0); g.lineTo(q * 0.7, -q * 0.045); g.lineTo(q * 0.7, q * 0.045); g.closePath(); g.fill(); }
    g.restore(); g.globalAlpha = 1;
    dglow('#fff0c8', gx, gy, q * (0.17 + 0.02 * Math.sin(tm * 1.1) * hovAmp), a * 0.3);
    g.globalCompositeOperation = 'source-over';
    // kayan bulutlar (üç katman, farklı hız - bulutların süzülmesi)
    for (let k = 0; k < 4; k++) {
      const w = q * [0.34, 0.24, 0.2, 0.28][k], v = [0.22, 0.36, 0.5, 0.12][k], hz = [0.012, 0.02, 0.028, 0.008][k] * hovAmp;
      const u = ((tm * hz + k * 0.37 + i0 * 0.1) % 1.5) - 0.3, [px, py] = U(u, v + 0.01 * Math.sin(tm * 0.6 + k) * hovAmp);
      g.globalAlpha = a * [0.85, 0.75, 0.95, 0.6][k]; g.drawImage(shBulutSprite(k === 2 ? 'beyaz' : k === 3 ? 'altin' : 'koyu'), px - w / 2, py - w / 4, w, w / 2);
    }
    g.globalAlpha = 1;
    // kuzucuk ön bulutta hafifçe zıplar
    g.globalAlpha = a;
    for (const [u, v, r, yon, ph] of [[0.63, 0.8, 0.11, -1, 0], [0.34, 0.835, 0.08, 1, 1.9]]) {
      const zp = Math.abs(Math.sin(tm * (1.5 + ph * 0.2) + i0 + ph)) * q * 0.022 * hovAmp, [kx, ky] = U(u, v);
      shKuzu(g, kx, ky - zp, q * r, yon, ((tm + ph) % 3.2) < 0.15);
    }
    // önde bir sıra kabarık bulut (kuzucukların ayaklarını örter)
    g.drawImage(shBulutSprite('koyu'), ox + q * 0.42, oy + q * 0.83, q * 0.5, q * 0.25); g.drawImage(shBulutSprite('koyu'), ox + q * 0.1, oy + q * 0.855, q * 0.46, q * 0.23); g.drawImage(shBulutSprite('beyaz'), ox - q * 0.12, oy + q * 0.88, q * 0.4, q * 0.2); g.drawImage(shBulutSprite('beyaz'), ox + q * 0.72, oy + q * 0.88, q * 0.4, q * 0.2);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) {   // gökkuşağının üstünde ışıltılar
      const an = Math.PI * (1.12 + k * 0.18), tw = 0.5 + 0.5 * Math.sin(tm * 2 + k * 1.9 + i0), [px, py] = U(0.5 + Math.cos(an) * 0.4, 0.78 + Math.sin(an) * 0.4);
      shParilti(px, py, q * 0.035 * (0.5 + tw), a * tw * 0.8);
    }
  } else {
    for (let k = 0; k < 4; k++) { const tw = 0.5 + 0.5 * Math.sin(tm * 2 + k * 1.7), [px, py] = U([0.2, 0.4, 0.5, 0.85][k], [0.2, 0.12, 0.3, 0.5][k]); shParilti(px, py, q * 0.06 * (0.5 + tw), a * tw); }
  }
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
}
function shBalonIc(ad, q) {   // iç resim (q×q, kesilmemiş), önbellekte
  sh.balon = sh.balon || {};
  const key = 'ic_' + ad + '_' + q;
  if (sh.balon[key]) return sh.balon[key];
  const c = document.createElement('canvas'); c.width = c.height = q; shIkonCiz(c.getContext('2d'), ad, q);
  return sh.balon[key] = c;
}
let shBaslikC = null;
function shBaslikSprite() {   // "Feza ve Pırıl" + altyazı: arayuz.js başlığının stili (Georgia, mor-krem degrade, ışıma)
  if (shBaslikC && shBaslikC.W === W && shBaslikC.H === H) return shBaslikC;
  const fs = Math.round(Math.min(H * 0.1, W * 0.088)), fs2 = Math.round(fs * 0.38), h = Math.round(fs * 2.3), pad = fs * 0.55, FS = 'Georgia, "Times New Roman", serif';
  // Ana başlığın üzerinde biraz daha nefes: yazıları birbirine yaklaştır, balonları aşağı itme.
  // Kısa ekranlarda bu boşluklar da yazı boyuyla küçülür; font ve oranlar aynı kalır.
  const anaPay = Math.min(12 * H / Math.max(1, innerHeight), fs * 0.2), altPay = Math.min(4 * H / Math.max(1, innerHeight), fs * 0.07);
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = h; return c; };
  const metin = mk(), glow = mk();
  const yaz = (x, renk) => {
    x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.font = `400 ${fs}px ${FS}`;
    if (renk) { const gr = x.createLinearGradient(0, pad * 0.4 + anaPay, 0, pad + fs * 0.2 + anaPay); gr.addColorStop(0, '#fbf6ff'); gr.addColorStop(0.5, '#e6d6ff'); gr.addColorStop(1, '#bfa0f4'); x.fillStyle = gr; }
    x.fillText('Feza ve Pırıl', W / 2, pad + fs * 0.2 + anaPay);
    x.font = `italic 400 ${fs2}px ${FS}`;
    if (renk) { const gr = x.createLinearGradient(0, pad + fs * 0.5 - altPay, 0, pad + fs * 1.05 - altPay); gr.addColorStop(0, '#fff6dc'); gr.addColorStop(1, '#bff4ff'); x.fillStyle = gr; }
    x.fillText('Işıklı Rüyalar', W / 2, pad + fs * 0.88 - altPay);
  };
  const gx = glow.getContext('2d');
  for (const [blur, col] of [[fs * 0.5, 'rgba(160,120,255,0.9)'], [fs * 0.2, 'rgba(220,200,255,0.9)']]) {
    gx.save(); gx.shadowColor = col; gx.shadowBlur = blur; gx.shadowOffsetX = W * 2; gx.translate(-W * 2, 0); gx.fillStyle = '#000'; yaz(gx, false); gx.restore();
  }
  const mx = metin.getContext('2d'); mx.save(); mx.shadowColor = 'rgba(40,20,90,0.6)'; mx.shadowBlur = fs * 0.06; mx.shadowOffsetY = fs * 0.03; yaz(mx, true); mx.restore();
  return shBaslikC = { metin, glow, h, W, H };
}
// rüyaya dalışta ekranı dolduracak keskin iç resim boyu; balonlar yerine oturunca boşta, birer birer hazırlanır (dokunuşta takılma olmasın)
function shHiQ() { return Math.min(1400, Math.round(Math.max(W, H) * 0.6 / 8) * 8); }
function shBalonBirak() { if (sh.balon) for (const k in sh.balon) shBirak(sh.balon[k]); sh.balon = {}; }
// ── RÜYA KAVANOZLARI: ölçüler, önbellekli parçalar, dokunuş / sürükleme ──
const SH_KAV_SURE = 2.1;    // kavanoz açılışından onSec'e (sn): mantar fırlar → ışık süzülür → rüyaya dalış
const SH_KAV_BUYUK = 1.3;   // ortadaki kavanozun yandakilere oranı
const SH_KAV_EN = 0.9;      // kavanozun eni / boyu (mantar dahil)
const SH_KAV_ESIK = 12;     // bu kadar (CSS px) kayan dokunuş sürüklemedir: kavanoz açmaz
// raf ve kavanoz ölçüleri (ekran pikseli). Raf tahtasının alt kenarı ≈0,476 H: yatakta Feza'nın ve Pırıl'ın yüzleri (≈0,485 H ve
// altı) hiç örtülmez. Ortadaki kavanoz başlığın altındaki bandı doldurur; yatayda ≈3–4, dikeyde ≈2–3 kavanoz görünür.
function shKavYer() {
  const K = sh.kavYer, asagi = shSecGuvenli.asagi;
  if (K && K.W === W && K.H === H && K.asagi === asagi) return K;
  const yatay = W > H * 1.1, fs = Math.min(H * 0.1, W * 0.088), tb = H * (yatay ? 0.025 : 0.035) + fs * 1.62 + asagi;
  const pt = H * 0.028, yp = H * 0.448, ts = pt * 0.34;
  const hc = 0.87 * clamp(Math.min(yp - tb - H * 0.016, H * 0.245), H * 0.12, W * (yatay ? 0.2 : 0.36) / SH_KAV_EN), hs = hc / SH_KAV_BUYUK;
  const sp = yatay ? Math.max(hs * SH_KAV_EN * 1.95, W * 0.225) : Math.max(hs * SH_KAV_EN * 1.35, W * 0.31);   // ebeveyn isteği: kavanozlar ≈%13 küçük
  const h0 = Math.max(48, Math.round(hc / 8) * 8);   // önbellek boyu (ortadaki kavanoz); yandakiler küçültülerek çizilir
  return sh.kavYer = { W, H, asagi, yatay, tb, yp, pt, ts, hc, hs, sp, h0, q0: Math.max(64, Math.round(h0 * 1.02 / 8) * 8) };
}
// kavanoz gövdesinin hattı ((x, y) taban ortası, h boy; ic > 0: camın iç hattı): yuvarlak karınlı, omuzlu, kısa boyunlu
function shKavYol(c, x, y, h, ic) {
  const k = ic || 0, hb = 0.36 - k, bw = 0.455 - k, nw = 0.265 - k * 0.6, yb = -k * 0.7, yn = -0.8 + k * 0.15;
  c.beginPath(); c.moveTo(x, y + yb * h);
  c.lineTo(x + (hb - 0.07) * h, y + yb * h); c.quadraticCurveTo(x + (hb + 0.02) * h, y + yb * h, x + (hb + 0.05) * h, y + (yb - 0.07) * h);
  c.bezierCurveTo(x + (bw + 0.01) * h, y - 0.2 * h, x + (bw + 0.01) * h, y - 0.5 * h, x + (bw - 0.06) * h, y - 0.63 * h);
  c.bezierCurveTo(x + (bw - 0.12) * h, y - 0.71 * h, x + (nw + 0.05) * h, y - 0.72 * h, x + nw * h, y - 0.755 * h);
  c.lineTo(x + nw * h, y + yn * h); c.lineTo(x - nw * h, y + yn * h); c.lineTo(x - nw * h, y - 0.755 * h);
  c.bezierCurveTo(x - (nw + 0.05) * h, y - 0.72 * h, x - (bw - 0.12) * h, y - 0.71 * h, x - (bw - 0.06) * h, y - 0.63 * h);
  c.bezierCurveTo(x - (bw + 0.01) * h, y - 0.5 * h, x - (bw + 0.01) * h, y - 0.2 * h, x - (hb + 0.05) * h, y + (yb - 0.07) * h);
  c.quadraticCurveTo(x - (hb + 0.02) * h, y + yb * h, x - (hb - 0.07) * h, y + yb * h);
  c.closePath();
}
// önbellekli parça: tuval (c.ox, c.oy: çizim merkezi), sh.balon içinde (ölçü ya da sahne değişince bırakılır)
function shKavSpr(key, w, h, ciz) {
  sh.balon = sh.balon || {};
  let c = sh.balon[key]; if (c) return c;
  c = document.createElement('canvas'); c.width = Math.max(2, Math.ceil(w)); c.height = Math.max(2, Math.ceil(h)); c.ox = 0; c.oy = 0;
  ciz(c.getContext('2d'), c);
  return sh.balon[key] = c;
}
function shKavBas(S, X, Y, s, a) { if (a <= 0.01) return; g.globalAlpha = Math.min(1, a); g.drawImage(S, X - S.ox * s, Y - S.oy * s, S.width * s, S.height * s); g.globalAlpha = 1; }
// cam kabuk (resmin üstüne): içte derinlik veren hafif koyuluk ve rüyanın rengi, kırılan kenar ışığı, ince parlak dış hat, solda uzun
// kavisli parıltı, sağ omuzda ışık, kalın cam taban, boyun halkası; rafta yumuşak gölge
function shKavCam(h0, col) {
  return shKavSpr('kav_cam_' + h0 + col, h0 * 1.1, h0 * 0.96, (x, S) => {
    S.ox = S.width / 2; S.oy = h0 * 0.88; const X = S.ox, Y = S.oy, h = h0;
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.save(); x.beginPath(); x.rect(0, Y - h * 0.012, S.width, S.height); x.clip();
    x.fillStyle = 'rgba(8,5,24,0.42)'; x.beginPath(); x.ellipse(X, Y + h * 0.004, h * 0.44, h * 0.045, 0, 0, 6.283); x.fill(); x.restore();
    x.save(); shKavYol(x, X, Y, h, 0.028); x.clip();
    let gr = x.createRadialGradient(X - h * 0.06, Y - h * 0.42, h * 0.12, X, Y - h * 0.4, h * 0.56);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(30,18,70,0.03)'); gr.addColorStop(1, 'rgba(22,12,55,0.26)');
    x.fillStyle = gr; x.fillRect(X - h * 0.6, Y - h, h * 1.2, h * 1.05);
    x.globalCompositeOperation = 'lighter'; x.fillStyle = mixc(col, col, 0, 0.07); x.fillRect(X - h * 0.6, Y - h, h * 1.2, h * 1.05); x.globalCompositeOperation = 'source-over';
    shKavYol(x, X, Y, h, 0.028); x.strokeStyle = 'rgba(255,255,255,0.16)'; x.lineWidth = h * 0.055; x.stroke();
    x.strokeStyle = mixc(col, '#ffffff', 0.3, 0.32); x.lineWidth = h * 0.022; x.stroke();
    x.restore();
    shKavYol(x, X, Y, h, 0); x.strokeStyle = 'rgba(14,10,40,0.38)'; x.lineWidth = h * 0.026; x.stroke();
    x.strokeStyle = 'rgba(235,240,255,0.75)'; x.lineWidth = Math.max(1, h * 0.011); x.stroke();
    gr = x.createLinearGradient(0, Y - h * 0.6, 0, Y - h * 0.1); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.beginPath(); x.moveTo(X - h * 0.37, Y - h * 0.58); x.quadraticCurveTo(X - h * 0.445, Y - h * 0.34, X - h * 0.37, Y - h * 0.1); x.quadraticCurveTo(X - h * 0.405, Y - h * 0.34, X - h * 0.33, Y - h * 0.58); x.closePath(); x.fill();
    x.globalAlpha = 0.5; x.beginPath(); x.moveTo(X - h * 0.29, Y - h * 0.55); x.quadraticCurveTo(X - h * 0.33, Y - h * 0.42, X - h * 0.3, Y - h * 0.3); x.quadraticCurveTo(X - h * 0.315, Y - h * 0.42, X - h * 0.275, Y - h * 0.55); x.closePath(); x.fill(); x.globalAlpha = 1;
    x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.ellipse(X + h * 0.27, Y - h * 0.6, h * 0.06, h * 0.022, -0.55, 0, 6.283); x.fill();
    x.beginPath(); x.arc(X + h * 0.335, Y - h * 0.52, h * 0.013, 0, 6.283); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.14)'; x.beginPath(); x.ellipse(X, Y - h * 0.04, h * 0.33, h * 0.03, 0, 0, 6.283); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.4)'; x.lineWidth = Math.max(1, h * 0.01); x.beginPath(); x.ellipse(X, Y - h * 0.045, h * 0.33, h * 0.03, 0, 0.2, Math.PI - 0.2); x.stroke();
    x.fillStyle = 'rgba(220,230,255,0.22)'; x.beginPath(); x.ellipse(X, Y - h * 0.8, h * 0.295, h * 0.032, 0, 0, 6.283); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = Math.max(1, h * 0.011); x.stroke();
  });
}
// mantar tıpa (çizim merkezi: tıpanın alt ortası = kavanoz boyunu, boyun ağzının hemen altı)
function shKavMantar(h0) {
  return shKavSpr('kav_mantar_' + h0, h0 * 0.62, h0 * 0.3, (x, S) => {
    S.ox = S.width / 2; S.oy = h0 * 0.26; const X = S.ox, Y = S.oy, h = h0, r = rng(17);
    const yol = () => { x.beginPath(); x.moveTo(X - h * 0.235, Y); x.lineTo(X - h * 0.262, Y - h * 0.2); x.ellipse(X, Y - h * 0.2, h * 0.262, h * 0.045, 0, Math.PI, 0); x.lineTo(X + h * 0.235, Y); x.ellipse(X, Y, h * 0.235, h * 0.035, 0, 0, Math.PI); x.closePath(); };
    x.fillStyle = '#5e3c28'; x.save(); x.translate(X, Y - h * 0.1); x.scale(1.06, 1.1); x.translate(-X, -(Y - h * 0.1)); yol(); x.fill(); x.restore();   // yumuşak kontur
    const gr = x.createLinearGradient(X - h * 0.26, 0, X + h * 0.26, 0); gr.addColorStop(0, '#9c6e48'); gr.addColorStop(0.32, '#dcb07e'); gr.addColorStop(0.7, '#b8865a'); gr.addColorStop(1, '#8a5e3c');
    x.fillStyle = gr; yol(); x.fill();
    x.save(); yol(); x.clip(); x.fillStyle = 'rgba(110,70,40,0.45)'; for (let i = 0; i < 26; i++) { x.beginPath(); x.arc(X + (r() - 0.5) * h * 0.5, Y - r() * h * 0.22, h * (0.005 + r() * 0.007), 0, 6.283); x.fill(); } x.restore();   // mantar benekleri
    x.fillStyle = '#e8c494'; x.beginPath(); x.ellipse(X, Y - h * 0.2, h * 0.255, h * 0.04, 0, 0, 6.283); x.fill();
    x.strokeStyle = 'rgba(140,95,60,0.5)'; x.lineWidth = Math.max(0.6, h * 0.006); x.beginPath(); x.ellipse(X, Y - h * 0.2, h * 0.17, h * 0.026, 0, 0, 6.283); x.stroke();
    x.fillStyle = 'rgba(255,240,210,0.5)'; x.beginPath(); x.ellipse(X - h * 0.1, Y - h * 0.205, h * 0.07, h * 0.012, 0, 0, 6.283); x.fill();
  });
}
// boyna bağlı, rüyanın renginde kurdele ve fiyonk (çizim merkezi: kavanoz tabanı)
function shKavKurdele(h0, col) {
  return shKavSpr('kav_kur_' + h0 + col, h0 * 0.9, h0 * 0.42, (x, S) => {
    S.ox = S.width / 2; S.oy = h0 * 0.9; const X = S.ox, Y = S.oy, h = h0, koyu = mixc(col, '#2a1f4e', 0.38), acik = mixc(col, '#ffffff', 0.45);
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.fillStyle = koyu; x.beginPath(); x.moveTo(X - h * 0.287, Y - h * 0.79); x.quadraticCurveTo(X, Y - h * 0.77, X + h * 0.287, Y - h * 0.79); x.lineTo(X + h * 0.287, Y - h * 0.718); x.quadraticCurveTo(X, Y - h * 0.698, X - h * 0.287, Y - h * 0.718); x.closePath(); x.fill();
    x.fillStyle = col; x.beginPath(); x.moveTo(X - h * 0.282, Y - h * 0.784); x.quadraticCurveTo(X, Y - h * 0.765, X + h * 0.282, Y - h * 0.784); x.lineTo(X + h * 0.282, Y - h * 0.727); x.quadraticCurveTo(X, Y - h * 0.708, X - h * 0.282, Y - h * 0.727); x.closePath(); x.fill();
    x.strokeStyle = acik; x.lineWidth = Math.max(0.6, h * 0.007); x.beginPath(); x.moveTo(X - h * 0.27, Y - h * 0.762); x.quadraticCurveTo(X, Y - h * 0.745, X + h * 0.27, Y - h * 0.762); x.stroke();
    const bx = X + h * 0.13, by = Y - h * 0.752;   // fiyonk: iki ilmek, düğüm, iki V kesik uç (biraz iri)
    x.save(); x.translate(bx, by); x.scale(1.4, 1.4); x.translate(-bx, -by);
    for (const sd of [-1, 1]) {
      x.fillStyle = koyu; x.beginPath(); x.moveTo(bx, by); x.bezierCurveTo(bx + sd * h * 0.05, by - h * 0.09, bx + sd * h * 0.15, by - h * 0.07, bx + sd * h * 0.13, by - h * 0.005); x.bezierCurveTo(bx + sd * h * 0.11, by + h * 0.03, bx + sd * h * 0.04, by + h * 0.02, bx, by); x.fill();
      x.fillStyle = col; x.beginPath(); x.moveTo(bx, by); x.bezierCurveTo(bx + sd * h * 0.05, by - h * 0.075, bx + sd * h * 0.125, by - h * 0.06, bx + sd * h * 0.115, by - h * 0.01); x.bezierCurveTo(bx + sd * h * 0.095, by + h * 0.018, bx + sd * h * 0.04, by + h * 0.012, bx, by); x.fill();
      x.fillStyle = sd < 0 ? koyu : col; x.beginPath(); x.moveTo(bx - sd * h * 0.008, by + h * 0.01); x.quadraticCurveTo(bx + sd * h * 0.035, by + h * 0.05, bx + sd * h * 0.045, by + h * 0.095); x.lineTo(bx + sd * h * 0.062, by + h * 0.08); x.lineTo(bx + sd * h * 0.078, by + h * 0.102); x.quadraticCurveTo(bx + sd * h * 0.065, by + h * 0.045, bx + sd * h * 0.022, by + h * 0.004); x.closePath(); x.fill();
    }
    x.fillStyle = koyu; x.beginPath(); x.ellipse(bx, by, h * 0.028, h * 0.024, 0, 0, 6.283); x.fill();
    x.fillStyle = acik; x.beginPath(); x.ellipse(bx - h * 0.006, by - h * 0.006, h * 0.012, h * 0.009, 0, 0, 6.283); x.fill();
    x.restore();
  });
}
// etiketin minik resmi (yazı yok): her rüyanın simgesi; bilinmeyen rüyada yıldız
function shKavIkon(x, ad, cx, cy, r, col) {
  x.save(); x.translate(cx, cy); x.lineJoin = 'round'; x.lineCap = 'round';
  const daire = (px, py, pr, c) => { x.fillStyle = c; x.beginPath(); x.arc(px * r, py * r, pr * r, 0, 6.283); x.fill(); };
  if (ad === 'orman') { x.fillStyle = '#8a6040'; x.fillRect(-0.12 * r, 0.1 * r, 0.24 * r, 0.75 * r); daire(0, -0.22, 0.62, '#3fae74'); daire(-0.4, 0.05, 0.38, '#3fae74'); daire(0.4, 0.05, 0.38, '#3fae74'); daire(-0.15, -0.4, 0.2, '#9be8b0'); daire(0.3, -0.1, 0.1, '#ffe27a'); daire(-0.3, 0.15, 0.09, '#ffa6d6'); }
  else if (ad === 'gol') { x.strokeStyle = '#6a8ae8'; x.lineWidth = r * 0.16; x.beginPath(); x.moveTo(-0.85 * r, 0.62 * r); x.quadraticCurveTo(-0.42 * r, 0.4 * r, 0, 0.62 * r); x.quadraticCurveTo(0.42 * r, 0.84 * r, 0.85 * r, 0.62 * r); x.stroke(); x.fillStyle = '#ffc94d'; shYildiz5(x, 0, -0.18 * r, 0.72 * r); x.fill(); x.strokeStyle = '#e0962a'; x.lineWidth = r * 0.07; x.stroke(); }
  else if (ad === 'bulut') { x.fillStyle = '#f2a8c8'; x.beginPath(); x.arc(-0.42 * r, 0.12 * r, 0.42 * r, 0, 6.283); x.arc(0.08 * r, -0.12 * r, 0.56 * r, 0, 6.283); x.arc(0.5 * r, 0.16 * r, 0.38 * r, 0, 6.283); x.rect(-0.42 * r, 0.1 * r, 0.92 * r, 0.44 * r); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(-0.4 * r, 0.08 * r, 0.32 * r, 0, 6.283); x.arc(0.06 * r, -0.16 * r, 0.44 * r, 0, 6.283); x.arc(0.48 * r, 0.12 * r, 0.28 * r, 0, 6.283); x.fill(); }
  else if (ad === 'deniz') { x.fillStyle = '#ff9fc4'; x.beginPath(); x.moveTo(0, 0.7 * r); x.lineTo(-0.78 * r, -0.1 * r); x.quadraticCurveTo(0, -1.0 * r, 0.78 * r, -0.1 * r); x.closePath(); x.fill(); x.strokeStyle = '#e06a98'; x.lineWidth = r * 0.08; for (const a of [-0.55, -0.2, 0.2, 0.55]) { x.beginPath(); x.moveTo(0, 0.62 * r); x.lineTo(Math.sin(a) * 0.82 * r, -Math.cos(a) * 0.62 * r); x.stroke(); } daire(0, 0.66, 0.16, '#e06a98'); }
  else if (ad === 'volkan') { x.fillStyle = '#8a5a4a'; x.beginPath(); x.moveTo(-0.9 * r, 0.75 * r); x.lineTo(-0.25 * r, -0.4 * r); x.lineTo(0.25 * r, -0.4 * r); x.lineTo(0.9 * r, 0.75 * r); x.closePath(); x.fill(); x.fillStyle = '#ff8a3c'; x.beginPath(); x.moveTo(-0.27 * r, -0.38 * r); x.lineTo(0.27 * r, -0.38 * r); x.lineTo(0.12 * r, 0.1 * r); x.lineTo(0.02 * r, -0.1 * r); x.lineTo(-0.1 * r, 0.2 * r); x.closePath(); x.fill(); daire(-0.15, -0.68, 0.16, '#d8c8d0'); daire(0.12, -0.86, 0.2, '#e8dce2'); }
  else if (ad === 'senlik') { x.fillStyle = '#d6c2ec'; x.fillRect(-0.36 * r, -0.3 * r, 0.72 * r, 1.05 * r); x.fillStyle = '#f08fbd'; x.beginPath(); x.moveTo(-0.5 * r, -0.28 * r); x.lineTo(0, -0.95 * r); x.lineTo(0.5 * r, -0.28 * r); x.closePath(); x.fill(); x.strokeStyle = '#8a6a9a'; x.lineWidth = r * 0.06; x.beginPath(); x.moveTo(0, -0.95 * r); x.lineTo(0, -1.25 * r); x.stroke(); x.fillStyle = '#ffd36b'; x.beginPath(); x.moveTo(0, -1.25 * r); x.lineTo(0.38 * r, -1.13 * r); x.lineTo(0, -1.02 * r); x.fill(); x.fillStyle = '#ffd98a'; x.beginPath(); x.moveTo(-0.13 * r, 0.75 * r); x.lineTo(-0.13 * r, 0.32 * r); x.arc(0, 0.32 * r, 0.13 * r, Math.PI, 0); x.lineTo(0.13 * r, 0.75 * r); x.fill(); }
  else if (ad === 'kar') { x.strokeStyle = '#7ab8f0'; x.lineWidth = r * 0.13; for (let k = 0; k < 3; k++) { x.save(); x.rotate(k * Math.PI / 3); x.beginPath(); x.moveTo(0, -0.85 * r); x.lineTo(0, 0.85 * r); for (const sd of [-1, 1]) { x.moveTo(0, sd * 0.5 * r); x.lineTo(0.24 * r, sd * 0.72 * r); x.moveTo(0, sd * 0.5 * r); x.lineTo(-0.24 * r, sd * 0.72 * r); } x.stroke(); x.restore(); } daire(0, 0, 0.14, '#cfe6ff'); }
  else if (ad === 'cadi') { x.fillStyle = '#c4581f'; for (const [px, rr] of [[-0.38, 0.5], [0.38, 0.5], [0, 0.58]]) { x.beginPath(); x.ellipse(px * r, 0.15 * r, rr * r, 0.62 * r, 0, 0, 6.283); x.fill(); } x.fillStyle = '#ff9a3c'; for (const [px, rr] of [[-0.38, 0.42], [0.38, 0.42], [0, 0.5]]) { x.beginPath(); x.ellipse(px * r, 0.15 * r, rr * r, 0.55 * r, 0, 0, 6.283); x.fill(); } x.strokeStyle = '#4f7a34'; x.lineWidth = r * 0.16; x.beginPath(); x.moveTo(0, -0.38 * r); x.quadraticCurveTo(0.04 * r, -0.62 * r, 0.24 * r, -0.7 * r); x.stroke(); x.fillStyle = '#7a3414'; x.beginPath(); x.arc(-0.24 * r, 0.02 * r, 0.1 * r, 0, 6.283); x.arc(0.24 * r, 0.02 * r, 0.1 * r, 0, 6.283); x.fill(); x.beginPath(); x.moveTo(-0.3 * r, 0.3 * r); x.quadraticCurveTo(0, 0.58 * r, 0.3 * r, 0.3 * r); x.quadraticCurveTo(0, 0.42 * r, -0.3 * r, 0.3 * r); x.fill(); }
  else if (ad === 'uzay' && typeof sh14Ikon === 'function') sh14Ikon(x,r);
  else if (ad === 'ipek' && typeof sh13Ikon === 'function') sh13Ikon(x,r);
  else if (ad === 'kampus' && typeof sh12Ikon === 'function') sh12Ikon(x,r);
  else if (ad === 'sato' && typeof sh11Ikon === 'function') sh11Ikon(x, r);
  else if (ad === 'ejderha') sh9Ikon(x, r);
  else { x.fillStyle = mixc(col, '#ffffff', 0.15); shYildiz5(x, 0, 0, 0.8 * r); x.fill(); x.strokeStyle = mixc(col, '#2a1f4e', 0.4); x.lineWidth = r * 0.08; x.stroke(); }
  x.restore();
}
// kurdeleden ipe asılı kraft kâğıdı etiket, üstünde rüyanın simgesi (çizim merkezi: etiketin deliği = ipin ucu; sallanır)
function shKavEtiket(h0, ad, col) {
  return shKavSpr('kav_etk_' + h0 + ad, h0 * 0.34, h0 * 0.32, (x, S) => {
    S.ox = h0 * 0.05; S.oy = h0 * 0.035; const h = h0, X = S.ox, Y = S.oy, w = h * 0.25, hh = h * 0.21, x0 = X - h * 0.03, y0 = Y - h * 0.014;
    x.save(); x.translate(x0 + w / 2, y0 + hh / 2); x.rotate(0.12); x.translate(-(x0 + w / 2), -(y0 + hh / 2));
    x.fillStyle = 'rgba(30,18,40,0.35)'; shRR(x, x0 + h * 0.006, y0 + h * 0.009, w, hh, h * 0.03); x.fill();
    x.fillStyle = '#f6e6c6'; shRR(x, x0, y0, w, hh, h * 0.03); x.fill();
    x.strokeStyle = '#c9a473'; x.lineWidth = Math.max(0.8, h * 0.007); shRR(x, x0 + h * 0.009, y0 + h * 0.009, w - h * 0.018, hh - h * 0.018, h * 0.022); x.stroke();
    shKavIkon(x, ad, x0 + w * 0.55, y0 + hh * 0.56, hh * 0.3, col);
    x.restore();
    x.fillStyle = '#d9c09a'; x.beginPath(); x.arc(X, Y, h * 0.013, 0, 6.283); x.fill(); x.fillStyle = '#6a4a32'; x.beginPath(); x.arc(X, Y, h * 0.006, 0, 6.283); x.fill();   // delik
  });
}
// raf tahtası: dikişsiz tekrarlanan karo (üst yüz biraz görünür, ön yüzde ahşap damarları ve oyma yıldızlar, altında duvara gölge)
function shKavTahta(K) {
  const TW = Math.max(64, Math.round(K.sp * 2)), gl = Math.ceil(K.pt * 0.8);
  return shKavSpr('kav_raf_' + TW + '_' + Math.round(K.pt), TW, K.ts + K.pt + gl, (x, S) => {
    S.ox = 0; S.oy = K.ts; const ts = K.ts, pt = K.pt, w = TW, r = rng(33);
    let gr = x.createLinearGradient(0, 0, 0, ts); gr.addColorStop(0, '#5f4560'); gr.addColorStop(1, '#8d6a78'); x.fillStyle = gr; x.fillRect(0, 0, w, ts);
    gr = x.createLinearGradient(0, ts, 0, ts + pt); gr.addColorStop(0, '#80596a'); gr.addColorStop(0.45, '#634359'); gr.addColorStop(1, '#452d45'); x.fillStyle = gr; x.fillRect(0, ts, w, pt);
    x.strokeStyle = 'rgba(36,20,40,0.32)'; x.lineWidth = Math.max(0.6, pt * 0.05);
    for (let k = 0; k < 4; k++) {   // ahşap damarları (karonun iki ucu aynı: tam sayı dalga)
      const y0 = ts + pt * (0.22 + k * 0.19), ph = r() * 6.283, a1 = pt * 0.06; x.beginPath();
      for (let i = 0; i <= 48; i++) { const u = i / 48, yy = y0 + Math.sin(u * 6.283 * 2 + ph) * a1 + Math.sin(u * 6.283 * 5 + ph * 2) * a1 * 0.4; if (i) x.lineTo(u * w, yy); else x.moveTo(0, yy); }
      x.stroke();
    }
    x.strokeStyle = 'rgba(255,220,240,0.1)'; x.lineWidth = Math.max(0.6, pt * 0.035);
    for (let k = 0; k < 2; k++) { const y0 = ts + pt * (0.32 + k * 0.32), ph = r() * 6.283; x.beginPath(); for (let i = 0; i <= 48; i++) { const u = i / 48, yy = y0 + Math.sin(u * 6.283 * 3 + ph) * pt * 0.05; if (i) x.lineTo(u * w, yy); else x.moveTo(0, yy); } x.stroke(); }
    for (const [u, ay] of [[0.08, 1], [0.58, 0]]) {   // iki kavanozun arasına oyulmuş hilal ve yıldızlar (ay ışığında hafifçe parlar)
      const cx = u * w, cy = ts + pt * 0.5;
      if (ay) {
        x.fillStyle = 'rgba(30,16,34,0.45)'; x.beginPath(); x.arc(cx + pt * 0.03, cy + pt * 0.03, pt * 0.3, 0, 6.283); x.arc(cx + pt * 0.15, cy - pt * 0.07, pt * 0.26, 0, 6.283, true); x.fill();
        x.fillStyle = 'rgba(255,226,170,0.42)'; x.beginPath(); x.arc(cx, cy, pt * 0.3, 0, 6.283); x.arc(cx + pt * 0.13, cy - pt * 0.09, pt * 0.25, 0, 6.283, true); x.fill();
        for (const [dx, dy, rr] of [[0.55, -0.15, 0.13], [0.85, 0.12, 0.09]]) { x.fillStyle = 'rgba(255,226,170,0.38)'; shYildiz5(x, cx + dx * pt, cy + dy * pt, rr * pt); x.fill(); }
      } else {
        x.fillStyle = 'rgba(30,16,34,0.45)'; shYildiz5(x, cx + pt * 0.03, cy + pt * 0.03, pt * 0.27); x.fill();
        x.fillStyle = 'rgba(255,226,170,0.38)'; shYildiz5(x, cx, cy, pt * 0.25); x.fill();
      }
    }
    // tahtanın üst kenarında kıvrılan ince sarmaşık, minik yapraklar (uçları ışıl ışıl: canlı katmanda)
    x.strokeStyle = '#3f6a52'; x.lineWidth = Math.max(1, pt * 0.07); x.beginPath();
    for (let i = 0; i <= 64; i++) { const u = i / 64, yy = ts * 0.9 + Math.sin(u * 6.283 * 4) * pt * 0.1; if (i) x.lineTo(u * w, yy); else x.moveTo(0, yy); } x.stroke();
    for (let k = 0; k < 16; k++) { const u = (k + 0.5) / 16, px = u * w, py = ts * 0.9 + Math.sin(u * 6.283 * 4) * pt * 0.1, sd = k % 2 ? 1 : -1;
      x.fillStyle = k % 3 ? '#4f9a66' : '#6fbf7a'; x.save(); x.translate(px, py); x.rotate(sd * 0.7 - 0.3); x.beginPath(); x.ellipse(pt * 0.16, 0, pt * 0.17, pt * 0.08, 0, 0, 6.283); x.fill(); x.restore(); }
    x.fillStyle = 'rgba(255,215,200,0.4)'; x.fillRect(0, ts, w, Math.max(1, pt * 0.09));   // ön kenar ışığı
    x.fillStyle = 'rgba(20,10,30,0.5)'; x.fillRect(0, ts + pt - Math.max(1, pt * 0.08), w, Math.max(1, pt * 0.08));
    gr = x.createLinearGradient(0, ts + pt, 0, ts + pt + gl); gr.addColorStop(0, 'rgba(6,6,22,0.45)'); gr.addColorStop(1, 'rgba(6,6,22,0)'); x.fillStyle = gr; x.fillRect(0, ts + pt, w, gl);
  });
}
// rüyaya dalışın büyük, keskin resmi; en çok iki tanesi bellekte kalır (rüya sayısı arttıkça bellek büyümesin)
function shKavHi(ikon) {
  const S2 = sh.sec, q = shHiQ(), key = 'ic_' + ikon + '_' + q;
  if (S2 && S2.hiK && S2.hiK.indexOf(key) < 0) { S2.hiK.push(key); while (S2.hiK.length > 2) { const k = S2.hiK.shift(); if (sh.balon && sh.balon[k]) { shBirak(sh.balon[k]); delete sh.balon[k]; } } }
  return shBalonIc(ikon, q);
}
function shSecimBaslat(opts, onSec) {
  shSecimIptal();
  shOlc();
  sh.mod = 'secim'; sh.t = 0; sh.sonGorunum = false; sh.tam = true; sh.kisa = false; sh.dan = false; sh.anlar = {}; sh.sesler = {}; sh.parca.length = 0; sh.zz.length = 0; sh.tema = null;
  // Menünün açıkça verilen sırasını koru; yeni/oynanmamış rüyayı başa taşıma.
  const L = (opts || []).slice(0, 80);
  // Raf her açılışta baştan görünür; tamamlanma ve son oynanan işaretleri korunur.
  const bas = 0;
  sh.sec = { opts: L, onSec, secili: null, si: -1, ts: 0, gec: 0, nab: -9, nabX: 0, nabY: 0, pos: [], hi: null, hiK: [], kapli: false,
    kay: bas, hedef: bas, v: 0, bas, cin: bas, el: null, acil: -1, acT: 0, teker: 0, tekerT: 0, oturT: 0 };
  sh.plan = null; sh.bitti = null;
  sh.odaSabah = shBirak(sh.odaSabah); sh.odaYakin = shBirak(sh.odaYakin); if (shDus) { shBirak(shDus.c); shDus = null; }
  if (shKopya) shKopya = shBirak(shKopya);
  shGeceHazirla();
  // ekran dışındaki kavanozların resimleri ve camları boşta birer birer hazırlanır (hızlı kaydırırken takılma olmasın)
  const S2 = sh.sec;
  S2.opts.forEach((o, i) => setTimeout(() => {
    if (sh.mod !== 'secim' || sh.sec !== S2 || S2.secili) return;
    try { const K = shKavYer(), col = SH_BALON_RENK[o.ikon] || '#e6d6ff'; shBoya(shBalonIc(o.ikon, K.q0)); shKavCam(K.h0, col); shKavKurdele(K.h0, col); shKavEtiket(K.h0, o.ikon, col); } catch (e) {}
  }, 2400 + i * 160));
}
const shKavEsnek = (k, n) => { const m = Math.max(0, n - 1), c = clamp(k, 0, m), o = k - c; return c + o * 0.38 / (1 + Math.abs(o) * 0.9); };   // uçlarda lastik gibi
// tek dokunuş (CSS pikseli): kavanoza dokunulduysa o kavanoz ortaya kayar ve açılır; boş yere dokunuş yakındakileri nabız attırır
function shSecimDokun(cx, cy) {
  shOlc();
  const S2 = sh.sec; if (sh.mod !== 'secim' || !S2 || S2.secili || S2.acil >= 0 || sh.t < 0.6) return false;
  const px = cx / innerWidth * W, py = cy / innerHeight * H;
  let en = -1, ed = 1e9;
  for (let i = 0; i < S2.pos.length; i++) {
    const b = S2.pos[i]; if (!b || !b.gor || b.hazir < 0.5) continue;
    const dx = Math.abs(px - b.x);
    if (dx < b.h * SH_KAV_EN * 0.6 && py > b.y - b.h * 1.08 && py < b.y + b.h * 0.12 && dx < ed) { en = i; ed = dx; }
  }
  if (en < 0) { S2.nab = sh.t; S2.nabX = px; S2.nabY = py; return false; }
  shKavSec(en);
  return true;
}
function shKavSec(i) {   // kavanoz seçildi: ortaya kayar (yay), oraya varınca açılır
  const S2 = sh.sec; if (!S2 || S2.secili || i < 0 || i >= S2.opts.length) return;
  S2.acil = i; S2.acT = sh.t; S2.hedef = i;
  try { S2.hi = shKavHi(S2.opts[i].ikon); } catch (e) { S2.hi = null; }   // büyük resim şimdi (dokunuşta), açılırken takılma olmasın
}
function shKavAc(i) {   // mantar fırlar: rüyaya geçiş başlar (balondaki olaylar ve sesler)
  const S2 = sh.sec, o = S2.opts[i];
  S2.secili = o; S2.si = i; S2.ts = sh.t;
  if (!S2.hi) { try { S2.hi = shKavHi(o.ikon); } catch (e) { S2.hi = null; } }
  try { OLAY.emit('secim', { id: o.id, i }); } catch (e) {}
  shSfx('secim', i);
  shAn('ruyayaGec');
  try { OLAY.emit('ruyayaGec', { id: o.id }); } catch (e) {}
  shSfx('ruyayaGec');
}
// raf fiziği: parmak bırakınca hız korunur, yay kavanozu yumuşakça ortaya oturtur; oturunca bir kez cam çınlaması
function shKavFizik(S2, dt) {
  const n = S2.opts.length; if (!n || S2.el) return;
  const h = Math.min(dt, 0.05); if (!(h > 0)) return;
  const K = 52, C = 2 * Math.sqrt(K) * 0.6;   // az sönümlü: yerine otururken minicik sekme
  S2.v += (K * (S2.hedef - S2.kay) - C * S2.v) * h; S2.kay += S2.v * h;
  if (!isFinite(S2.kay) || !isFinite(S2.v)) { S2.kay = S2.hedef; S2.v = 0; }
  if (Math.abs(S2.hedef - S2.kay) < 0.03 && Math.abs(S2.v) < 0.5) {
    if (S2.cin !== S2.hedef) { S2.cin = S2.hedef; S2.oturT = sh.t; if (S2.acil < 0) shSfx('parilti', 0); }
  }
}
function shSecimBas(e) {   // parmak / fare bastı (CSS pikseli)
  const S2 = sh.sec; if (sh.mod !== 'secim' || !S2 || S2.secili || S2.acil >= 0 || S2.el) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const now = performance.now(), px = e.clientX / innerWidth * W;
  S2.el = { id: e.pointerId, hedef: e.target, x0: px, cx0: e.clientX, cy0: e.clientY, k0: S2.kay, son: px, sonT: now, kaydi: false, hareket: false };
  S2.v = 0;   // parmak rafı yakalar
  try { if (e.target && e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId); } catch (_) {}
}
function shSecimSurukle(e) {
  const S2 = sh.sec, E = S2 && S2.el; if (!E || e.pointerId !== E.id || sh.mod !== 'secim') return;
  if (Math.hypot(e.clientX - E.cx0, e.clientY - E.cy0) > SH_KAV_ESIK) E.hareket = true;
  if (!E.kaydi && Math.abs(e.clientX - E.cx0) > SH_KAV_ESIK) { E.kaydi = true; E.x0 = e.clientX / innerWidth * W; E.son = E.x0; E.k0 = S2.kay; }   // eşikte yakala: sıçrama olmasın
  if (!E.kaydi) return;
  const now = performance.now(), px = e.clientX / innerWidth * W, K = shKavYer(), dts = Math.max(0.004, (now - E.sonT) / 1000);
  S2.kay = shKavEsnek(E.k0 - (px - E.x0) / K.sp, S2.opts.length);
  S2.v = lerp(S2.v, -(px - E.son) / K.sp / dts, 0.4); E.son = px; E.sonT = now;
}
function shSecimBirak(e, iptal) {
  const S2 = sh.sec, E = S2 && S2.el; if (!E || e.pointerId !== E.id) return;
  S2.el = null;
  try { if (E.hedef && E.hedef.releasePointerCapture) E.hedef.releasePointerCapture(E.id); } catch (_) {}
  if (sh.mod !== 'secim' || S2.secili) return;
  // Seyrek pointermove veya dikey kaydırma da seçim sayılmaz; iptalde raf fırlamaz.
  if (E.kaydi || E.hareket || iptal || Math.hypot(e.clientX - E.cx0, e.clientY - E.cy0) > SH_KAV_ESIK) {
    if (iptal || performance.now() - E.sonT > 90) S2.v = 0;
    S2.v = clamp(S2.v, -14, 14);
    S2.hedef = clamp(Math.round(S2.kay + S2.v * 0.28), 0, S2.opts.length - 1);
    return;
  }
  shSecimDokun(e.clientX, e.clientY);
}
function shSecimIptal() {
  const E = sh.sec && sh.sec.el;
  if (E) shSecimBirak({ pointerId: E.id }, true);
}
function shSecimTus(e) {   // klavye yedeği: oklar rafı kaydırır, Enter / Boşluk ortadakini açar
  const S2 = sh.sec; if (sh.mod !== 'secim' || !S2 || S2.secili || S2.acil >= 0 || sh.t < 0.6) return;
  const n = S2.opts.length; if (!n) return;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') S2.hedef = clamp(Math.round(S2.hedef) + 1, 0, n - 1);
  else if (e.code === 'ArrowLeft' || e.code === 'KeyA') S2.hedef = clamp(Math.round(S2.hedef) - 1, 0, n - 1);
  else if ((e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') && !e.repeat) shKavSec(clamp(Math.round(S2.hedef), 0, n - 1));
}
function shSecimTeker(e) {   // fare tekerleği / dokunmatik yüzey: her ≈60 px bir kavanoz
  const S2 = sh.sec; if (sh.mod !== 'secim' || !S2 || S2.secili || S2.acil >= 0 || S2.el) return;
  const n = S2.opts.length, d = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
  S2.teker += d; S2.tekerT = sh.t;
  while (Math.abs(S2.teker) >= 60) { const s = Math.sign(S2.teker); S2.hedef = clamp(Math.round(S2.hedef) + s, 0, n - 1); S2.teker -= s * 60; }
}
function shAltinRozet(cx, cy, r, tm, a) {   // altın yıldız rozeti
  if (a <= 0.01 || r <= 0.5) return;
  g.save(); g.translate(cx, cy);
  g.globalCompositeOperation = 'lighter'; dglow('#ffd870', 0, 0, r * 2.6, a * (0.45 + 0.1 * Math.sin(tm * 2))); g.globalCompositeOperation = 'source-over';
  g.globalAlpha = a; g.fillStyle = 'rgba(40,30,90,0.6)'; g.beginPath(); g.arc(0, 0, r * 1.25, 0, 6.283); g.fill();
  g.strokeStyle = '#fff1b8'; g.lineWidth = Math.max(1.5, r * 0.12); g.stroke();
  g.rotate(Math.sin(tm * 1.2) * 0.1); shYildiz5(g, 0, 0, r * 0.95); g.fillStyle = '#ffcf4a'; g.fill(); g.strokeStyle = '#fff4c8'; g.lineWidth = r * 0.1; g.lineJoin = 'round'; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.55)'; shYildiz5(g, -r * 0.12, -r * 0.14, r * 0.38); g.fill();
  g.restore(); g.globalAlpha = 1;
}
// pencerede ışıldayan yıldızlar, ara sıra kayan yıldız (oda biriminde; perdelerden önce çizilir)
function shPencereCanli(tm, a) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const k = sh.k0 * sh.zoom;
  for (const [x, y, ph] of [[17.5, 15.5, 0], [23, 13.2, 1.7], [26.5, 24.5, 3.1], [19.5, 29, 4.4], [37.5, 30.5, 2.2], [29.5, 34.5, 5.3], [36.8, 13.5, 0.9]]) {
    const tw = Math.pow(0.5 + 0.5 * Math.sin(tm * (0.9 + ph * 0.13) + ph * 2.3), 3);
    shParilti(shEkranX(x), shEkranY(y), k * (0.5 + 1.3 * tw), a * (0.25 + 0.7 * tw));
  }
  const kz = (tm / 9.5) % 1;
  if (kz < 0.09) {
    const u = kz / 0.09, x = lerp(16.5, 30, u), y = lerp(13.5, 24, u), L = k * 4.5, px = shEkranX(x), py = shEkranY(y);
    g.globalAlpha = a * Math.sin(u * Math.PI) * 0.9; g.strokeStyle = '#eef3ff'; g.lineWidth = Math.max(1, k * 0.18); g.lineCap = 'round';
    g.beginPath(); g.moveTo(px, py); g.lineTo(px - L * 0.79, py - L * 0.61); g.stroke(); g.globalAlpha = 1;
    dglow('#eef3ff', px, py, k * 1.4, a * Math.sin(u * Math.PI) * 0.8);
  }
  g.globalCompositeOperation = 'source-over';
}
// seçim odasının canlı ışık oyunu: ay huzmesinde süzülen toz, lambanın sıcak zerreleri, pencere önünde ışık küreleri (ayırma yok, her kare ucuz)
function shSecimIsik(tm) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const k = sh.k0;
  for (let i = 0; i < 14; i++) {   // ay huzmesi: pencereden yatağa doğru yavaş süzülen toz
    const u = (i * 0.618 + tm * (0.012 + (i % 4) * 0.004)) % 1, v = (i * 0.377) % 1;
    const x = lerp(lerp(18, 36, v), lerp(-14, 6, v), u) + Math.sin(tm * 0.35 + i * 1.7) * 1.6, y = lerp(16, 76, u) + Math.cos(tm * 0.3 + i) * 1.2;
    const tw = 0.5 + 0.5 * Math.sin(tm * 1.1 + i * 2.1), al = Math.sin(u * Math.PI) * (0.25 + 0.4 * tw);
    dglow('#d9e6ff', shPX(x), shPY(y), k * (0.5 + 0.5 * tw), al * 0.6);
  }
  for (let i = 0; i < 7; i++) {   // lamba: sıcak, yukarı süzülen minik zerreler
    const u = (i * 0.29 + tm * 0.045) % 1, x = SH_LAMBA.x + Math.sin(tm * 0.8 + i * 2.3) * (1 + u * 3), y = SH_LAMBA.y - 1 - u * 13;
    dglow('#ffd9a0', shPX(x), shPY(y), k * (0.45 + 0.5 * (1 - u)), Math.sin(u * Math.PI) * 0.5);
  }
  for (let i = 0; i < 6; i++) {   // pencerenin dışında süzülen ışık küreleri (böcek değil: yumuşak, soluk renkli; yavaş sekiz çizerler, nabız gibi yanıp söner)
    const x = 22 + (i % 3) * 6.5 + Math.sin(tm * 0.31 + i * 2.2) * 2.4, y = 40 + (i % 2) * 4 + Math.sin(tm * 0.47 + i * 1.3) * 1.8;
    const pu = Math.pow(0.5 + 0.5 * Math.sin(tm * 0.9 + i * 1.9), 2);
    dglow(i % 2 ? '#e6dcff' : '#d4ecff', shPX(x), shPY(y), k * (0.9 + 0.9 * pu), 0.2 + 0.5 * pu);
  }
  g.globalCompositeOperation = 'source-over';
}
function shSecimOda(tm, dt, sec) {   // gece odası: lamba, uyuyan Feza, parlayan Pırıl
  const p = SH_GECE;
  shKamera(W / 2, H / 2, 1, W / 2, H / 2);
  shResimT(); g.drawImage(sh.oda, 0, 0);
  shHuzme(true, 1, tm);
  shPencereCanli(tm, 1);
  shSecimIsik(tm);
  shPerdeler(p, 0, tm, 0);
  shLamba(p, 0, tm, true, 0.85 + 0.06 * Math.sin(tm * 0.9) + 0.025 * Math.sin(tm * 2.3 + 1));
  shHali(p, 0, tm);
  sh.secDy = shSecimDy(); sh.yDy = sh.secDy;   // yatak grubu rafın altına
  shYatakArka(p, 0, 0, tm);
  sh.fzOlc = 1.18; sh.prOlc = 1; sh.kirpK = 0;
  const S2 = sh.sec, nu = S2 ? clamp((sh.t - S2.nab) / 1.1, 0, 1) : 1;
  const fl = S2 && S2.secili ? Math.sin(shSeg(sec, 0, 0.6) * Math.PI) : Math.max(nu < 1 ? Math.sin(nu * Math.PI) * 0.45 : 0, S2 && S2.oturT > 0 ? 0.4 * Math.sin(shSeg(sh.t, S2.oturT, S2.oturT + 1.1) * Math.PI) : 0);   // kavanoz ortaya oturunca Pırıl da hafifçe parlar   // dokununca (boş dokunuşta da hafifçe) Pırıl parlar
  shPirilIsik(shKucak.px, shKucak.py, tm, 1 + 0.4 * fl);
  const cy = (tm + 4) % 12.5, sok = cy > 7 && cy < 9.2 ? Math.sin((cy - 7) / 2.2 * Math.PI) : 0;   // ≈12 sn'de bir: iç çekip Pırıl'a sokulur
  shFeza(SH_FEZA.x + 0.25 * sok, SH_FEZA.y + 0.12 * sok, 1.18, shPozVar('uykuya_dalis') ? 'uykuya_dalis' : 'uyku', tm, shPirilPozVar('pelus_sik') ? 'pelus_sik' : 'pelus', shPirilPozVar('pelus_sik') ? 0.45 + 0.25 * Math.sin(tm * 1.5) + 0.3 * sok : undefined, undefined, shPozVar('uykuya_dalis') ? 3.3 + tm * 0.2 : tm);
  shBattaniye(p, 0, tm, Math.sin(tm * 1.5) * 0.5 + 0.5 + 1.4 * sok, 0);
  // Pırıl'ın etrafında ışık nefesi (rüya çağıran parıltı)
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const nb = 0.5 + 0.5 * Math.sin(tm * 1.1), px = shEkranX(shKucak.px), py = shEkranY(shKucak.py - 1);
  dglow('#c9a8ff', px, py, sh.k0 * (26 + 5 * nb + 10 * fl), 0.28 + 0.1 * nb + 0.25 * fl);
  g.globalCompositeOperation = 'source-over';
  sh.yDy = 0;
  shZerreAkit(dt, tm);
}
// Pırıl'dan ortadaki kavanoza süzülen rüya tozu (ince ışık izi): (px, py) Pırıl, (ex, ey) kavanozun karnı, d kavanoz boyu
function shRuyaIzi(px, py, ex, ey, d, col, tm, i, a) {
  if (a <= 0.01) return;
  const mx = lerp(px, ex, 0.35) - (ex - px) * 0.1, my = Math.min(py, ey) - d * 0.35;
  for (let k = 0; k < 9; k++) {
    const u = (tm * 0.08 + k / 9 + i * 0.137) % 1, v = 1 - u;
    const x = v * v * px + 2 * v * u * mx + u * u * ex + Math.sin(tm * 1.3 + k * 2 + i) * d * 0.02, y = v * v * py + 2 * v * u * my + u * u * ey;
    const tw = 0.6 + 0.4 * Math.sin(tm * 3 + k * 1.7 + i), al = a * Math.sin(u * Math.PI) * tw;
    dglow(col, x, y, d * 0.06 * (0.6 + 0.6 * Math.sin(u * Math.PI)), al * 0.7);
    dglow('#ffffff', x, y, d * (k % 2 ? 0.01 : 0.016), al * 0.95);
  }
}
const SH_KAV_IS = ['#ffd98a', '#ffc2a0', '#ffe6a8', '#ffb6c8', '#fff0c0'];   // sıcak tonlar   // rafın peri ışıkları
// raf: uzun büyülü tahta (kavanozlarla birlikte kayar; iki ucu yuvarlak, havada durur), ön yüzünde ışıldayan peri ışıkları
function shKavRaf(K, S2, tm, a) {
  if (a <= 0.01) return;
  const n = S2.opts.length, x0 = W / 2 + (-0.66 - S2.kay) * K.sp, x1 = W / 2 + (n - 1 + 0.66 - S2.kay) * K.sp, T = shKavTahta(K), yt = K.yp - K.ts;
  const c0 = Math.max(x0, -4), c1 = Math.min(x1, W + 4); if (c1 <= c0) return;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
  // altında yumuşak, büyülü bir ışık (raf havada durur)
  g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { const px = lerp(c0, c1, (k + 0.5) / 3); g.globalAlpha = a * 0.16; g.drawImage(glow('#b9a0ff'), px - (c1 - c0) * 0.22, K.yp + K.pt * 0.6 - K.pt * 1.4, (c1 - c0) * 0.44, K.pt * 2.8); }
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = a;
  g.save(); g.beginPath(); g.rect(c0, yt - 2, c1 - c0, T.height + 4); g.clip();
  for (let x = x0 + Math.floor((c0 - x0) / T.width) * T.width; x < c1; x += T.width) g.drawImage(T, x, yt);
  g.restore();
  // yuvarlak uçlar ve uçlarda minik oyma kıvrım
  for (const sd of [-1, 1]) {
    const ux = sd < 0 ? x0 : x1; if (ux < -K.pt * 2 || ux > W + K.pt * 2) continue;
    g.fillStyle = '#4a3046'; g.beginPath(); g.ellipse(ux, K.yp + K.pt * 0.4, K.pt * 0.42, K.pt * 0.66, 0, 0, 6.283); g.fill();
    g.fillStyle = '#7a5468'; g.beginPath(); g.ellipse(ux - sd * K.pt * 0.06, K.yp + K.pt * 0.32, K.pt * 0.3, K.pt * 0.5, 0, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(255,226,170,0.45)'; g.lineWidth = Math.max(1, K.pt * 0.08); g.beginPath(); g.arc(ux - sd * K.pt * 0.06, K.yp + K.pt * 0.34, K.pt * 0.18, 0, Math.PI * 1.5); g.stroke();
  }
  // peri ışıkları: tahtanın ön yüzünde kancadan kancaya sarkan ince ip ve sırayla göz kırpan minik ampuller
  const ad = K.sp / 2, k0 = Math.floor((c0 - x0) / ad), k1 = Math.ceil((c1 - x0) / ad);
  g.strokeStyle = 'rgba(60,40,70,0.85)'; g.lineWidth = Math.max(1, K.pt * 0.06); g.beginPath();
  for (let k = k0; k < k1; k++) { const xa = x0 + k * ad; g.moveTo(xa, K.yp + K.pt * 0.22); g.quadraticCurveTo(xa + ad / 2, K.yp + K.pt * 0.95, xa + ad, K.yp + K.pt * 0.22); }
  g.stroke();
  g.globalCompositeOperation = 'lighter';
  for (let k = k0; k < k1; k++) for (let j = 1; j <= 3; j++) {
    const u = j / 4, bx = x0 + (k + u) * ad, by = K.yp + K.pt * (0.28 + 1.46 * u * (1 - u));
    if (bx < -10 || bx > W + 10) continue;
    const m = ((k * 3 + j) % 5 + 5) % 5, tw = 0.55 + 0.45 * Math.sin(tm * 2.1 + k * 1.3 + j * 2.1);
    dglow(SH_KAV_IS[m], bx, by, K.pt * 0.75, a * 0.42 * tw);
    g.globalAlpha = a * (0.65 + 0.35 * tw); g.fillStyle = '#fff2d0'; g.beginPath(); g.arc(bx, by, Math.max(1, K.pt * 0.11), 0, 6.283); g.fill();
  }
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
}
function shKavT(b) { const c = Math.cos(b.egim || 0), sn = Math.sin(b.egim || 0); g.setTransform(c, sn, -sn, c, b.x - c * b.x + sn * b.y, b.y - sn * b.x - c * b.y); }   // tabandan eğik
// tek kavanoz: arkasında ışık, içinde rüyanın canlı resmi (kavanoz biçiminde kesilir) ve süzülen ışık tozları, üstünde cam,
// kurdele, sallanan etiket ve mantar; durum işaretleri (tamam: altın yıldız, son: dönen ışık halkası, yeni: ışıltılar)
function shKavCiz(K, S2, o, i, b, tm, al, odak, hov, ilk, u) {
  const X = b.x, Y = b.y, h = b.h, col = SH_BALON_RENK[o.ikon] || '#e6d6ff', s = h / K.h0, cy = Y - h * 0.41, acilan = S2.secili && S2.si === i;
  const t = sh.t, nu = clamp((t - S2.nab) / 0.9, 0, 1), nd = Math.hypot(S2.nabX - X, S2.nabY - cy), nb = nu < 1 ? Math.sin(nu * Math.PI) * clamp(1.4 - nd / (Math.max(W, H) * 0.5), 0.3, 1) : 0;
  const parla = acilan ? Math.sin(shSeg(u, 0, 0.5) * Math.PI) : 0, yeni = !o.tamam;
  shKavT(b);   // kayarken kavanoz tabanının üstünde hafifçe sallanır
  // arkadaki ışık ve rafa düşen renkli ışık
  g.globalCompositeOperation = 'lighter';
  dglow(col, X, cy, h * (0.7 + 0.25 * odak + 0.2 * parla), al * (0.1 + 0.26 * odak * (0.85 + 0.15 * Math.sin(tm * 1.6)) + 0.25 * nb + 0.5 * parla + 0.12 * hov));
  dglow('#ffd9a0', X, Y + K.pt * 0.15, h * 0.5, al * (0.14 + 0.24 * odak)); dglow(col, X, Y + K.pt * 0.2, h * 0.34, al * (0.12 + 0.22 * odak));   // tahtada kavanozun altına biriken sıcak ışık
  g.globalCompositeOperation = 'source-over';
  // içerideki rüya: kavanozun iç hattıyla kesilir; yandakiler biraz soluk
  const dim = lerp(0.76, 1, odak), q = h * 1.0;   // yandakiler biraz soluk ama resimleri okunur
  g.save(); shKavYol(g, X, Y, h, 0.028); g.clip();
  g.globalAlpha = al * dim; g.drawImage(shBalonIc(o.ikon, K.q0), X - q / 2, cy - q / 2, q, q); g.globalAlpha = 1;
  g.translate(X, cy); shIkonCanli(o.ikon, -q / 2, -q / 2, q, tm, al * dim, i, hov); shKavT(b);
  g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 5; k++) {   // kavanozun içinde yavaşça yükselen ışık tozları
    const uu = (tm * (0.07 + k * 0.012) + k * 0.21 + i * 0.13) % 1, px = X + Math.sin(k * 2.1 + tm * 0.7 + i) * h * 0.24, py = Y - h * (0.08 + uu * 0.62), aa = Math.sin(uu * Math.PI) * al * (0.6 + 0.4 * odak);
    dglow(k % 2 ? col : '#ffffff', px, py, h * 0.04, aa * 0.5);
    if (k % 2 === 0) shParilti(px, py, h * 0.022, aa * 0.85);
  }
  if (odak > 0.02) { g.globalAlpha = al * odak * (0.07 + 0.03 * Math.sin(tm * 1.6)); g.fillStyle = mixc(col, '#ffffff', 0.5); g.fillRect(X - h * 0.5, Y - h, h, h); g.globalAlpha = 1; }   // ortadaki: içi ışıl ışıl
  if (parla > 0) { g.globalAlpha = parla * 0.35; g.fillStyle = col; g.fillRect(X - h * 0.5, Y - h, h, h); g.globalAlpha = 1; }   // açılırken içi ışıl ışıl
  g.globalCompositeOperation = 'source-over';
  g.restore(); shKavT(b);
  // cam, mantar (açılırken fırlar, döner, söner), boyna bağlı kurdele, iple sarkan etiket
  shKavBas(shKavCam(K.h0, col), X, Y, s, al);
  const mp = acilan ? shEaseOut(shSeg(u, 0, 0.2)) : 0, ma = acilan ? 1 - shSeg(u, 0.12, 0.3) : 1;
  if (ma > 0.01) {
    // ara sıra bir kavanozun mantarı kendiliğinden kıpırdar (içindeki rüya dışarı çıkmak istiyormuş gibi); sırayla, tek tek
    const n2 = S2.opts.length, per = 3.3, jz = tm / per, ji = !acilan && !S2.secili && sh.t > 3.5 && n2 > 0 && (Math.floor(jz) * 5 + 2) % n2 === i ? shSeg(jz % 1, 0, 0.26) : 0;
    const jw = ji > 0 && ji < 1 ? Math.sin(ji * Math.PI) : 0, jr = jw * Math.sin(ji * 34) * 0.13, jy = jw * h * 0.035;
    const M = shKavMantar(K.h0), mx = X + h * 0.12 * mp, my = Y - h * 0.78 - h * 0.5 * mp + h * 0.25 * mp * mp - jy;
    if (jw > 0.05) { g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const a2 = -Math.PI / 2 + (k - 1) * 0.7; shParilti(X + Math.cos(a2) * h * 0.2 * (0.6 + ji), Y - h * 0.82 + Math.sin(a2) * h * 0.14 * (0.6 + ji), h * 0.035 * jw, al * jw); } dglow(col, X, Y - h * 0.8, h * 0.22, al * jw * 0.35); g.globalCompositeOperation = 'source-over'; }   // mantarın kenarından sızan ışık
    g.save(); g.translate(mx, my); g.rotate(0.9 * mp + jr); g.globalAlpha = al * ma; g.drawImage(M, -M.ox * s, -M.oy * s, M.width * s, M.height * s); g.restore(); g.globalAlpha = 1;
  }
  shKavBas(shKavKurdele(K.h0, col), X, Y, s, al);
  // etiket: fiyonktan ince iple sarkar, hafifçe sallanır (raf kayarken biraz daha)
  const sx0 = X + h * 0.15, sy0 = Y - h * 0.74, ex = X + h * 0.3, ey = Y - h * 0.62, an = Math.sin(tm * 1.3 + i * 1.7) * 0.07 + clamp(S2.v, -3, 3) * 0.06;
  g.globalAlpha = al; g.strokeStyle = 'rgba(235,215,185,0.85)'; g.lineWidth = Math.max(1, h * 0.006); g.beginPath(); g.moveTo(sx0, sy0); g.quadraticCurveTo(lerp(sx0, ex, 0.5) + h * 0.02, lerp(sy0, ey, 0.5) + h * 0.03, ex, ey); g.stroke();
  const E = shKavEtiket(K.h0, o.ikon, col);
  g.save(); g.translate(ex, ey); g.rotate(an); g.drawImage(E, -E.ox * s, -E.oy * s, E.width * s, E.height * s); g.restore(); g.globalAlpha = 1;
  g.globalCompositeOperation = 'lighter';
  if (acilan && u < 0.3) {   // mantar fırlarken ağızdan ışıltı patlaması
    const e = shSeg(u, 0.01, 0.24);
    if (e > 0 && e < 1) for (let k = 0; k < 12; k++) { const a2 = -Math.PI / 2 + (k - 5.5) * 0.24, rr = h * (0.08 + 0.42 * shEaseOut(e)); shParilti(X + Math.cos(a2) * rr, Y - h * 0.8 + Math.sin(a2) * rr * 0.8, h * 0.05 * (1 - e * 0.6), (1 - e) * al); }
    dglow('#ffffff', X, Y - h * 0.8, h * 0.3, (1 - shSeg(u, 0, 0.25)) * 0.7);
  }
  if (acilan && u > 0.06 && u < 0.6) {   // ağızdan sarmal çizerek yükselen ışık
    for (let k = 0; k < 16; k++) {
      const e = shSeg(u, 0.06 + k * 0.012, 0.42 + k * 0.012); if (e <= 0 || e >= 1) continue;
      const a2 = e * 7 + k * 0.7, rr = h * (0.05 + 0.32 * e), px = X + Math.cos(a2) * rr, py = Y - h * 0.82 - e * h * 0.9;
      dglow(k % 3 ? col : '#ffffff', px, py, h * 0.07, Math.sin(e * Math.PI) * 0.6); shParilti(px, py, h * 0.03, Math.sin(e * Math.PI));
    }
  }
  if (yeni && !acilan) {   // hiç oynanmamış rüya: çok hafif, ara sıra bir ışıltı (rozet/halka yok)
    for (let k = 0; k < 2; k++) { const a2 = tm * 0.4 + k * 3.1 + i, tw = Math.pow(Math.max(0, Math.sin(tm * 1.3 + k * 2.4 + i * 1.7)), 3); shParilti(X + Math.cos(a2) * h * 0.5, cy + Math.sin(a2) * h * 0.46, h * 0.04 * tw, al * tw * 0.55); }
  }
  if (ilk && odak > 0.9 && !S2.secili && S2.acil < 0) {   // ilk kez: ortadaki kavanozda dokunma ipucu (nabız halkaları, el çizimi yok)
    const ia = shEase(shSeg(t, 2.6, 3.6)) * al;
    // halkalar camın dışından başlar (içindeki resmi örtmez), yumuşakça büyüyüp söner; arkada usulca nabız atan ışık
    for (let k = 0; k < 2; k++) { const uu = (tm * 0.5 + k * 0.5) % 1, fa = Math.sin(Math.min(1, uu * 4) * Math.PI / 2) * (1 - uu); g.strokeStyle = `rgba(255,248,225,${ia * fa * 0.7})`; g.lineWidth = Math.max(2, h * 0.018 * (1 - uu * 0.6)); g.beginPath(); g.ellipse(X, cy - h * 0.03, h * (0.56 + 0.24 * uu), h * (0.54 + 0.22 * uu), 0, 0, 6.283); g.stroke(); }
    const bs = 0.5 + 0.5 * Math.sin(tm * 3.14); dglow(col, X, cy, h * 0.75 * (0.9 + 0.2 * bs), ia * 0.22 * bs);
  }
  g.globalCompositeOperation = 'source-over';
}
// ok ipucu: rafın ekran kenarındaki ucunda (ön yüzünde), ekranın dışında başka kavanoz varsa yumuşakça nabız atan ışıklı ok ve o yöne süzülen ışıltılar
function shKavOk(K, sd, tm, a) {
  if (a <= 0.01) return;
  const r = Math.max(K.pt * 0.85, K.hs * 0.075), x = sd < 0 ? r * 1.6 : W - r * 1.6, y = K.yp + K.pt * 0.45, nb = 0.5 + 0.5 * Math.sin(tm * 2.4), dx = sd * r * 0.25 * Math.sin(tm * 2.4);   // rafın ön yüzünde, kavanozların altında
  g.globalCompositeOperation = 'lighter'; dglow('#d8c2ff', x + dx, y, r * 2.6, a * (0.25 + 0.2 * nb)); g.globalCompositeOperation = 'source-over';
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = `rgba(40,25,80,${a * 0.5})`; g.lineWidth = r * 0.5; g.beginPath(); g.moveTo(x + dx - sd * r * 0.45, y - r); g.lineTo(x + dx + sd * r * 0.45, y); g.lineTo(x + dx - sd * r * 0.45, y + r); g.stroke();
  g.strokeStyle = `rgba(250,244,255,${a * (0.6 + 0.35 * nb)})`; g.lineWidth = r * 0.3; g.stroke();
  g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { const uu = (tm * 0.6 + k / 3) % 1; shParilti(x + dx + sd * r * (0.6 + uu * 1.6), y + Math.sin(k * 2.3 + tm) * r * 0.6, r * 0.35 * (1 - uu), a * Math.sin(uu * Math.PI)); }
  g.globalCompositeOperation = 'source-over';
}
function shSecimCiz(tm, dt) {
  const S2 = sh.sec; if (!S2) return;
  sh.t += dt; const t = sh.t, n = S2.opts.length, K = shKavYer();
  // dokunulan kavanoz ortaya geldi (ya da kayış uzadı): mantar fırlar
  if (S2.acil >= 0 && !S2.secili && (Math.abs(S2.kay - S2.acil) < 0.06 || t - S2.acT > 0.9)) shKavAc(S2.acil);
  shKavFizik(S2, dt);
  if (S2.teker && t - S2.tekerT > 0.35) S2.teker = 0;
  const u = S2.secili ? clamp((t - S2.ts) / SH_KAV_SURE, 0, 1) : 0;   // açılış ilerlemesi
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (S2.kapli) { g.fillStyle = '#04050e'; g.fillRect(0, 0, W, H); }   // seçilen rüya ekranı kapladı: oda çizilmez
  else if (!sh.oda) {   // oda hazırlanana dek yumuşak gece rengi
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, SH_GECE.wallTop); gr.addColorStop(1, SH_GECE.floorBot); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    shGeceHazirla();
  } else shSecimOda(tm, dt, u);
  // üstte yumuşak karartma (başlık ve kavanozlar okunsun)
  if (!sh.ustGr || sh.ustGrH !== H) { sh.ustGr = g.createLinearGradient(0, 0, 0, H * 0.7); sh.ustGr.addColorStop(0, 'rgba(5,7,24,0.55)'); sh.ustGr.addColorStop(1, 'rgba(5,7,24,0)'); sh.ustGrH = H; }
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = sh.ustGr; g.fillRect(0, 0, W, H * 0.7);
  shZerreler(tm, 0.45, true);
  const gir = shEase(shSeg(t, 0, 1.5)), yz = 1 - shEase(shSeg(u, 0.22, 0.42));
  // odak: duvarın rafın çevresindeki kısmı hafifçe kararır (kavanozlar öne çıkar), yatak sıcak ve aydınlık kalır
  if (!sh.kavGr || sh.kavGrH !== H) { const y1 = K.yp + K.pt; sh.kavGr = g.createLinearGradient(0, 0, 0, y1 + H * 0.07); sh.kavGr.addColorStop(0, 'rgba(4,5,20,0.16)'); sh.kavGr.addColorStop(clamp((y1 - H * 0.03) / (y1 + H * 0.07), 0, 1), 'rgba(4,5,20,0.26)'); sh.kavGr.addColorStop(1, 'rgba(4,5,20,0)'); sh.kavGrH = H; }
  { const da = shEase(shSeg(t, 0.2, 1.4)) * yz; if (da > 0.01) { g.globalAlpha = da; g.fillStyle = sh.kavGr; g.fillRect(0, 0, W, K.yp + K.pt + H * 0.07); g.globalAlpha = 1; } }
  // başlık
  const B = shBaslikSprite(), by = H * (W > H * 1.1 ? 0.025 : 0.035) + shSecGuvenli.asagi - H * 0.02 * shEase(shSeg(u, 0, 0.4)), nf = 0.72 + 0.22 * Math.sin(tm * 1.3);
  g.globalAlpha = Math.min(1, gir * yz * nf); g.drawImage(B.glow, 0, by);
  g.globalAlpha = gir * yz; g.drawImage(B.metin, 0, by); g.globalAlpha = 1;
  if (!n) { if (gir < 1) { g.fillStyle = `rgba(4,5,14,${1 - gir})`; g.fillRect(0, 0, W, H); } return; }
  // raf (kavanozlarla birlikte kayar) ve kavanozların yerleri: ortadaki büyük, uzaklaştıkça küçülür
  const ra = shEase(shSeg(t, 0.15, 1.0)) * yz;
  shKavRaf(K, S2, tm, ra);
  const mx = shMoverX * DPR, my = shMoverY * DPR, ilk = !S2.opts.some(o => o.tamam);
  for (let i = 0; i < n; i++) {
    const dx = i - S2.kay, ad = Math.abs(dx), dk = Math.abs(i - S2.bas);
    const sc = ad < 1 ? lerp(SH_KAV_BUYUK, 1, shEase(ad)) : Math.max(0.84, 1 - (ad - 1) * 0.08);
    const em = shSeg(t, 0.35 + dk * 0.16, 1.05 + dk * 0.16), odak = 1 - clamp(ad, 0, 1);
    const b = S2.pos[i] || (S2.pos[i] = { x: 0, y: 0, h: 0, gor: false, hazir: 0, ad: 0 });
    b.x = W / 2 + dx * K.sp; b.y = K.yp - K.ts * 0.45; b.ad = ad; b.hazir = em;
    b.h = K.hs * sc * (0.15 + 0.85 * shEaseBack(em)) * (1 + 0.018 * Math.sin(tm * 1.6) * odak);   // ortadaki yavaşça nefes alır
    b.egim = clamp(-S2.v * 0.035 * (0.6 + 0.4 * odak), -0.13, 0.13) + Math.sin(tm * 1.1 + i * 1.9) * 0.008;   // kayarken sallanır
    if (S2.secili && S2.si === i) {   // açılırken: mantar fırlarken esner, sonra resim kavanozdan taşacakmış gibi şişer
      const sq = Math.sin(shSeg(u, 0, 0.16) * Math.PI) * 0.07; b.h *= (1 - sq) * (1 + 0.32 * shEase(shSeg(u, 0.18, 0.4))); b.egim = 0;
    }
    if (i === S2.cin && S2.oturT > 0 && !S2.secili && S2.acil < 0) {   // raf yerine oturunca ortadaki kavanoz sevinçle minicik zıplar
      const hu = shSeg(t - S2.oturT, 0.05, 0.55); if (hu > 0 && hu < 1) { const zp = Math.sin(hu * Math.PI); b.y -= K.hs * 0.07 * zp; b.h *= 1 + 0.03 * Math.sin(hu * Math.PI * 2); }
    }
    b.gor = em > 0 && b.x > -b.h && b.x < W + b.h;
  }
  // Pırıl'dan ortadaki kavanoza süzülen rüya tozu
  const ci = clamp(Math.round(S2.kay), 0, n - 1), bc = S2.pos[ci];
  if (sh.oda && bc && bc.gor) { g.globalCompositeOperation = 'lighter'; shRuyaIzi(shEkranX(shKucak.px), shEkranY(shKucak.py - 2) + (sh.secDy || 0) * sh.k0 * sh.zoom, bc.x, bc.y - bc.h * 0.3, bc.h, SH_BALON_RENK[S2.opts[ci].ikon] || '#e6d6ff', tm, ci, shSeg(t, 1.6, 3) * (1 - bc.ad) * yz * (0.85 + 0.6 * (1 - shSeg(t, S2.oturT, S2.oturT + 1.2)))); g.globalCompositeOperation = 'source-over'; }
  // kavanozlar: uzaktakiler önce, ortadaki en son (komşusunun önünde kalsın)
  const ciz = i => {
    const b = S2.pos[i]; if (!b.gor) return;
    const o = S2.opts[i], acilan = S2.secili && S2.si === i, al = Math.min(1, b.hazir * 3) * (acilan ? 1 - shSeg(u, 0.5, 0.62) : yz) * lerp(0.82, 1, 1 - clamp(b.ad - 1, 0, 1));
    const hov = !S2.secili && !S2.el && Math.abs(mx - b.x) < b.h * SH_KAV_EN * 0.5 && my > b.y - b.h && my < b.y ? 1 : 0;
    shKavCiz(K, S2, o, i, b, tm, al, 1 - clamp(b.ad, 0, 1), hov, ilk, u);
    if (b.hazir > 0 && b.hazir < 1) { g.globalCompositeOperation = 'lighter'; dglow(SH_BALON_RENK[o.ikon] || '#e6d6ff', b.x, b.y - b.h * 0.42, b.h * 0.7, (1 - b.hazir) * 0.8); g.globalCompositeOperation = 'source-over'; }   // belirirken ışık
  };
  for (let i = 0; i < ci; i++) ciz(i);
  for (let i = n - 1; i > ci; i--) ciz(i);
  ciz(ci);
  g.setTransform(1, 0, 0, 1, 0, 0);
  // uç ipuçları: ekranın dışında başka kavanoz varsa
  if (!S2.secili) {
    const oa = shEase(shSeg(t, 2.2, 3.2)) * yz;
    if (S2.pos[0] && S2.pos[0].x < -K.hs * 0.1) shKavOk(K, -1, tm, oa);
    if (S2.pos[n - 1] && S2.pos[n - 1].x > W + K.hs * 0.1) shKavOk(K, 1, tm, oa);
  }
  // seçilen kavanozdan rüyaya dalış: kavanozun karnında açılan ışık penceresi büyüyüp ekranı kaplar (balondaki dalışın aynısı)
  if (S2.secili) {
    const o = S2.secili, b = S2.pos[S2.si], col = SH_BALON_RENK[o.ikon] || '#e6d6ff';
    const pu = Math.pow(shSeg(u, 0.3, 0.78), 2.1), mv = shEase(shSeg(u, 0.32, 0.62));
    const cx = lerp(b.x, W / 2, mv), cy = lerp(b.y - b.h * 0.42, H / 2, mv), R = lerp(b.h * 0.4, Math.hypot(W, H) * 0.62, pu), pa = shSeg(u, 0.3, 0.34);
    if (pa > 0) {
      g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.clip();
      const q = R * 2.16, ic = S2.hi && R > b.h * 0.45 ? S2.hi : shBalonIc(o.ikon, K.q0);
      g.globalAlpha = pa; g.drawImage(ic, cx - q / 2, cy - q / 2, q, q); g.globalAlpha = 1;
      g.translate(cx, cy); shIkonCanli(o.ikon, -q / 2, -q / 2, q, tm, pa, S2.si, 0);
      g.restore(); g.setTransform(1, 0, 0, 1, 0, 0);
      if (pu < 1) {   // pencerenin kenarı: yayılan ışık halkası ve kenarda parıltılar
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = `rgba(255,250,235,${pa * (1 - pu) * 0.85})`; g.lineWidth = Math.max(2, b.h * 0.03 * (1 - pu * 0.5)); g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.stroke();
        for (let k = 0; k < 14; k++) { const a2 = k * 0.449 + tm * 0.8; shParilti(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R, b.h * 0.05, pa * (1 - pu)); }
        g.globalCompositeOperation = 'source-over';
      } else S2.kapli = true;
    }
    const isik = Math.sin(shSeg(u, 0.5, 0.95) * Math.PI) * (o.ikon === 'bulut' ? 0.16 : 0.35);
    if (isik > 0.003) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = isik; g.fillStyle = col; g.fillRect(0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    if (u > 0.45) {   // masalsı sarmal yıldızlar ve rüya tozu
      g.globalCompositeOperation = 'lighter';
      const e = shSeg(u, 0.45, 1), rot = tm * 0.9 + e * 4.5;
      for (let k = 0; k < 22; k++) {
        const a2 = k * (Math.PI * 2 / 22) + rot, rr = Math.hypot(W, H) * (0.05 + 0.65 * e) * (0.35 + (k % 4) * 0.2);
        shParilti(W / 2 + Math.cos(a2) * rr, H * 0.5 + Math.sin(a2) * rr * 0.72, H * 0.018 * (1 + (k % 3) * 0.4), Math.sin(e * Math.PI) * (0.6 + 0.4 * Math.sin(k + tm * 3)));
      }
      g.globalCompositeOperation = 'source-over';
    }
    const dk = shEase(shSeg(u, 0.72, 1));
    if (dk > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(4,5,14,${dk})`; g.fillRect(0, 0, W, H); }
    if (u >= 1 && !S2.gec) { S2.gec = 1; sh.secBitti = o; const f = S2.onSec; if (f) { try { f(o.id); } catch (e) { shHata('onSec', e); } } }
  } else if (gir < 1) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(4,5,14,${1 - gir})`; g.fillRect(0, 0, W, H); }
}
let shMoverX = -999, shMoverY = -999;
if (typeof document !== 'undefined') {
  const shCv = (typeof g !== 'undefined' && g && g.canvas) || document.getElementById('c');
  if (shCv) {
    shCv.addEventListener('pointerdown', e => { if (sh.mod === 'secim') shSecimBas(e); });
    shCv.addEventListener('pointermove', e => { shMoverX = e.clientX; shMoverY = e.clientY; if (sh.mod === 'secim') shSecimSurukle(e); }, { passive: true });
    shCv.addEventListener('pointerup', e => shSecimBirak(e, false));
    shCv.addEventListener('pointercancel', e => shSecimBirak(e, true));
    shCv.addEventListener('lostpointercapture', e => shSecimBirak(e, true));
    shCv.addEventListener('wheel', e => { if (sh.mod === 'secim') shSecimTeker(e); }, { passive: true });
  }
  addEventListener('keydown', e => { if (sh.mod === 'secim') shSecimTus(e); });
  addEventListener('blur', shSecimIptal);
  addEventListener('pagehide', shSecimIptal);
  addEventListener('resize', shSecimIptal);
  document.addEventListener('visibilitychange', () => { if (document.hidden) shSecimIptal(); });
}

const SAHNE = {
  giris(bitince, opt) {
    shSecimIptal();
    opt = opt || {};
    const bolum = opt.bolum || 1, kisa = opt.kisa === true || (bolum >= 2 && opt.kisa !== false);
    shBalonBirak();
    sh.dan = sh.mod === 'secim' || kisa; sh.kisa = kisa; sh.fon = bolum === 14 ? 'uzay' : bolum === 13 ? 'ipek' : bolum === 12 ? 'kampus' : bolum === 11 ? 'sato' : bolum === 9 ? 'ejderha' : bolum === 8 ? 'cadi' : bolum === 7 ? 'kar' : bolum === 6 ? 'senlik' : bolum === 5 ? 'volkan' : bolum === 4 ? 'deniz' : bolum === 1 ? 'orman' : bolum === 3 ? 'bulut' : 'gol'; sh.secBitti = null;
    sh.tema = bolum === 14 ? 'uzay' : bolum === 13 ? 'ipek' : bolum === 12 ? 'kampus' : bolum === 11 ? 'sato' : bolum === 9 ? 'ejderha' : bolum === 8 ? 'cadi' : bolum === 7 ? 'kar' : bolum === 6 ? 'senlik' : bolum === 5 ? 'volkan' : bolum === 4 ? 'deniz' : bolum === 3 ? 'bulut' : bolum === 2 ? 'gol' : null; sh.uykuK = bolum === 14 ? 'p_uz_uyku' : bolum === 13 ? 'p_ip_uyku' : bolum === 12 ? 'p_q_uyku' : bolum === 11 ? 'p_s_uyku' : bolum === 9 ? 'p_e_uyku' : bolum === 8 ? sh8Harf('p_') + 'uyku' : bolum === 7 ? sh7Harf('p_') + 'uyku' : bolum === 6 ? 'p_f_uyku' : bolum === 5 ? 'p_v_uyku' : bolum === 4 ? 'p_i_uyku' : bolum === 3 ? 'p_b_uyku' : 'p_y_uyku';
    shOlc(); sh.mod = 'giris'; sh.t = 0; sh.nefesFaz = 0;  sh.kirpK = 0; sh.kalkis = null; sh.bitti = bitince; sh.atla = -1; sh.sesler = {}; sh.nefesN = -1; sh.zz.length = 0; sh.tam = false;
    sh.anlar = {}; sh.parca.length = 0; sh.camOturdu = 0; sh.izlendi = 0;
    sh.gBolum = bolum; sh.atlanabilir = shDahaOnce(bolum);   // atla düğmesi: bu rüya daha önce oynandıysa (her bölümde)
    sh.plan = kisa ? shKisaPlan() : shGirisPlan(); shKamera(W / 2, H / 2, 1, W / 2, H / 2);
    // pahalı önbellekler başlık ekranında parça parça hazırlandı; bitmediyse kalanı kareler arasında sürer (gerekirse çizimde biter)
    shGeceHazirla();
    sh.devir = null;
    if (sh.plan.ejder) { const k9 = () => sh.mod === 'giris' && !!sh.plan && !!sh.plan.ejder && sh.atla < 0; setTimeout(() => { shOnceden('ejderha', k9); shOnceden('onPlanE', k9); }, 900); }   // Bölüm 9: erime resmi Feza uykuya dalarken parça parça hazırlanır
  },
  final(bitince, opt) {
    sh.fBolum = (opt && opt.bolum) || (typeof BOLUM_NO !== 'undefined' ? BOLUM_NO : 1); sh.kisa = false; sh.dan = false; sh.tema = null; shBalonBirak();
    shOlc(); sh.mod = 'final'; sh.t = 0; sh.kirpK = 0; sh.bitti = bitince; sh.sesler = {}; sh.tam = false; sh.cin = 0; sh.anlar = {}; sh.parca.length = 0; sh.kareOrt = 1 / 60; sh.kamYavas = 0; sh.sonK = null; sh.fo = null; sh.yakinHazir = 0;
    sh.plan = shFinalPlan(); shKamera(W / 2, H / 2, 1, W / 2, H / 2);
    shGeceBirak();   // gece önbellekleri (açılış sonunda zaten bırakıldı)
    // sabah odası ve yakın çekim kopyası kutlama sürerken parça parça hazırlanır (ışık dolunca gerekir)
    const k = () => sh.mod === 'final' || DURUM === 'son';
    setTimeout(() => { shOnceden('odaSabah', k); shOnceden('odaYakin', k); }, 1200);
  },
  secim(opts, onSec) { shSecimBaslat(opts, onSec); },
  secimDokun(x, y) { return shSecimDokun(x, y); },
  tamEkran() { return sh.tam || (sh.sonGorunum && DURUM === 'son'); },
  // bir ara sahne oynuyor mu (açılışın ışık çözülmesi dahil)? arayuz ipuçları bunu sorar
  aktif() { return !!sh.mod; },
  ciz(tm, dt) {
    if (!sh.mod && !sh.sonGorunum) { if (sh.devir) { try { sh9Devir(tm, dt); } catch (e) { sh.devir = null; } } return; }   // Bölüm 9: oyunun ilk anında Pırıl'ın ışığı çözülür
    shOlc();
    // çizimde bir hata olsa bile sahne ilerler ve sonunda oyuna geçer (Feza asla takılı kalmaz)
    const dene = fn => { try { fn(); } catch (e) { shHata('ciz:' + sh.mod, e); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } };
    if (sh.mod === 'giris') {
      sh.t += dt; shGirisGuncelle(dt);
      if (sh.mod === 'giris') { dene(() => shGirisCiz(tm, dt)); dene(() => shAtlaCiz(tm)); }
    } else if (sh.mod === 'secim') {
      dene(() => shSecimCiz(tm, dt));
    } else if (sh.mod === 'final') {
      sh.t += dt; shFinalGuncelle(dt);
      dene(() => shFinalCiz(tm, dt));
      if (sh.sonGorunum) { sh.mod = null; }
    } else if (sh.sonGorunum && DURUM === 'son') {
      // bitiş ekranının arkasında: Feza ile Pırıl görünür kalır (yatay ekranda solda, kart sağda; dikte üstte, kart altta);
      // Pırıl ara sıra yine göz kırpar
      const k = 1 - Math.exp(-dt * 1.2), yatay = W > H * 1.15;
      sh.kirpK = 1;
      const fx = shPX(shKucak.x + 3.8), fy = shPY(shKucak.y - 2.9);
      shKamera(lerp(sh.fx, fx, k), lerp(sh.fy, fy, k), lerp(sh.zoom, yatay ? 2.85 : 2.3, k), lerp(sh.tx, yatay ? W * 0.22 : W * 0.5, k), lerp(sh.ty, yatay ? H * 0.5 : H * 0.24, k));
      sh.sonT = (sh.sonT || 0) + dt;
      dene(() => shSabahCiz(tm, 99, null, (sh.sonT % 4.5) > 2.8));
      // kamera yerine oturdu ve yakın çekim kopyası ekranı kaplıyor: tam ekran sabah odası artık gerekmez (≈22 MB)
      if (sh.sabahY && sh.sonT > 3 && sh.odaSabah) sh.odaSabah = shBirak(sh.odaSabah);
      if (shDus) { shBirak(shDus.c); shDus = null; }
    }
  },
  // test kancası
  get _durum() { return { mod: sh.mod, t: sh.t, tam: sh.tam, plan: sh.plan }; },
  get _kavanoz() { const S2 = sh.sec; return S2 ? { kay: S2.kay, hedef: S2.hedef, n: S2.opts.length, acil: S2.acil, si: S2.si, pos: S2.pos.map(b => b && { x: b.x, y: b.y, h: b.h, gor: b.gor }), yer: shKavYer() } : null; },
};

// Uyuyan Yanardağ: seçim baloncuğu ve odadan rüyaya geçiş aynı resimli manzarayı paylaşır.
function sh5Fon(x,w,h) {
  const sky=x.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#2c3154');sky.addColorStop(.43,'#73517a');sky.addColorStop(.76,'#bd758e');sky.addColorStop(1,'#d59784');x.fillStyle=sky;x.fillRect(0,0,w,h);
  const haze=x.createRadialGradient(w*.61,h*.4,0,w*.61,h*.4,w*.48);haze.addColorStop(0,'#ffb87d38');haze.addColorStop(1,'#f08e7100');x.fillStyle=haze;x.fillRect(0,0,w,h);
  x.fillStyle='#fff5d7';x.beginPath();x.arc(w*.23,h*.19,Math.min(w,h)*.055,0,Math.PI*2);x.fill();
  for(let i=0;i<34;i++){const px=(Math.sin(i*72.18)*.5+.5)*w,py=(Math.cos(i*31.43)*.5+.5)*h*.47;x.globalAlpha=.25+(i%4)*.14;x.beginPath();x.arc(px,py,Math.max(.7,w*.0018)*(1+i%2),0,Math.PI*2);x.fill();}x.globalAlpha=1;
  for(let layer=0;layer<3;layer++){x.fillStyle=['#665779','#5a4b72','#4c4268'][layer];x.beginPath();x.moveTo(0,h);for(let i=0;i<=16;i++)x.lineTo(i*w/16,h*(.58+layer*.08)+Math.sin(i*.8+layer*2)*h*.047);x.lineTo(w,h);x.closePath();x.fill();}
  // Large folded basalt shoulders keep the crater gentle rather than jagged.
  const mountain=x.createLinearGradient(w*.35,h*.4,w*.8,h*.92);mountain.addColorStop(0,'#5a4066');mountain.addColorStop(.42,'#382c56');mountain.addColorStop(1,'#2b304f');x.fillStyle=mountain;x.beginPath();x.moveTo(w*.2,h*.88);x.bezierCurveTo(w*.4,h*.69,w*.45,h*.54,w*.53,h*.42);x.quadraticCurveTo(w*.59,h*.45,w*.65,h*.41);x.bezierCurveTo(w*.72,h*.59,w*.82,h*.75,w*1.05,h*.9);x.closePath();x.fill();
  const facets=[[[.2,.88],[.53,.42],[.48,.78]],[[.53,.42],[.6,.5],[.48,.78]],[[.65,.41],[.6,.5],[.85,.88]],[[.53,.42],[.46,.66],[.34,.78]],[[.65,.41],[.72,.6],[.68,.7]]];
  facets.forEach((p,i)=>{x.fillStyle=['#95689a2d','#c28ba22d','#1b1e3c65','#d39d9c1c','#b2618628'][i];x.beginPath();p.forEach((q,k)=>k?x.lineTo(q[0]*w,q[1]*h):x.moveTo(q[0]*w,q[1]*h));x.closePath();x.fill();});
  x.fillStyle='#4a294e';x.beginPath();x.ellipse(w*.589,h*.421,w*.06,h*.012,-.02,0,Math.PI*2);x.fill();x.fillStyle='#ff965f';x.beginPath();x.ellipse(w*.589,h*.423,w*.053,h*.007,-.02,0,Math.PI*2);x.fill();
  x.strokeStyle='#ffd790';x.lineWidth=w*.0045;x.lineCap='round';x.beginPath();x.moveTo(w*.531,h*.421);x.quadraticCurveTo(w*.59,h*.45,w*.648,h*.414);x.stroke();
  for(const side of[-1,1]){x.strokeStyle='#ed865f';x.lineWidth=w*.009;x.beginPath();x.moveTo(w*(.59+side*.035),h*.433);x.bezierCurveTo(w*(.59+side*.07),h*.56,w*(.58+side*.1),h*.65,w*(.59+side*.25),h*.87);x.stroke();x.strokeStyle='#ffd48e';x.lineWidth=Math.max(.8,w*.0018);x.stroke();}
  const river=x.createLinearGradient(0,h*.45,0,h);river.addColorStop(0,'#ffd084');river.addColorStop(.38,'#ff9c62');river.addColorStop(1,'#d85d68');x.fillStyle=river;x.beginPath();x.moveTo(w*.584,h*.44);x.bezierCurveTo(w*.55,h*.58,w*.74,h*.64,w*.57,h*.75);x.bezierCurveTo(w*.48,h*.82,w*.36,h*.89,w*.21,h);x.lineTo(w*.67,h);x.bezierCurveTo(w*.83,h*.86,w*.85,h*.75,w*.69,h*.68);x.bezierCurveTo(w*.6,h*.61,w*.65,h*.5,w*.611,h*.442);x.closePath();x.fill();
  x.strokeStyle='#ffe9b6a0';x.lineWidth=Math.max(1.5,w*.005);x.beginPath();x.moveTo(w*.6,h*.46);x.bezierCurveTo(w*.56,h*.6,w*.77,h*.65,w*.61,h*.77);x.bezierCurveTo(w*.52,h*.84,w*.47,h*.93,w*.48,h);x.stroke();
  for(let i=0;i<8;i++){const xx=w*(.05+i*.13),yy=h*(.88+Math.sin(i*2)*.045);x.fillStyle=i%2?'#353453':'#464063';x.beginPath();x.moveTo(xx-w*.075,h);x.lineTo(xx-w*.05,yy);x.lineTo(xx+w*.018,yy-h*.018);x.lineTo(xx+w*.08,h);x.fill();x.strokeStyle='#cbb3ba40';x.lineWidth=Math.max(1,w*.002);x.beginPath();x.moveTo(xx-w*.05,yy);x.lineTo(xx+w*.018,yy-h*.018);x.stroke();}
  for(const [px,py,sc,kind]of[[.13,.97,.084,0],[.87,.97,.096,1],[.96,1.03,.06,0]]){
    const r=Math.min(w,h)*sc;x.save();x.translate(w*px,h*py);x.strokeStyle='#4c8b86';x.lineWidth=Math.max(1,r*.065);x.beginPath();x.moveTo(0,r*.3);x.bezierCurveTo(-r*.34,-r*.2,r*.25,-r*.8,0,-r*1.3);x.stroke();
    for(const side of[-1,1]){x.fillStyle=side<0?'#4e8b88':'#697d99';x.beginPath();x.moveTo(0,-r*.2);x.quadraticCurveTo(side*r*.8,-r*.7,side*r*.65,-r*1.05);x.quadraticCurveTo(side*r*.12,-r*.85,0,-r*.2);x.fill();}
    x.translate(0,-r*1.3);for(let layer=0;layer<2;layer++)for(let j=0;j<7;j++){const len=r*(layer?.58:.94),wide=len*.34;x.save();x.rotate(j*Math.PI*2/7+layer*.4);const petal=x.createLinearGradient(-wide,-len,wide,0);petal.addColorStop(0,kind?'#e997d8':'#ff969e');petal.addColorStop(.5,kind?'#a345bd':'#d83e69');petal.addColorStop(1,kind?'#572a79':'#74254f');x.fillStyle=petal;x.beginPath();x.moveTo(0,len*.1);x.bezierCurveTo(-wide,-len*.2,-wide,-len*.7,0,-len);x.bezierCurveTo(wide,-len*.7,wide,-len*.2,0,len*.1);x.fill();x.strokeStyle='#f7c3c783';x.lineWidth=Math.max(.5,r*.012);x.beginPath();x.moveTo(0,0);x.lineTo(0,-len*.94);x.stroke();x.restore();}
    x.fillStyle='#f5c37c';x.beginPath();x.arc(0,0,r*.13,0,Math.PI*2);x.fill();x.restore();
  }
}
function sh5Canli(ox,oy,q,tm,a,hov) {
  g.save();g.lineCap='round';
  // Baloncukta da lav yükselip dağın yamaçlarına geri döner; sabit sayıda analitik damla.
  for(let i=0;i<12;i++){
    const u=(tm*(.25+(i%3)*.025)+i*.173)%1,side=i%2?1:-1,spread=side*(.055+(i%4)*.022),height=.15+(i%3)*.032;
    const x=ox+q*(.589+spread*u),y=oy+q*(.423+u*u*.11-Math.sin(u*Math.PI)*height);
    const v=Math.max(0,u-.075),tx=ox+q*(.589+spread*v),ty=oy+q*(.423+v*v*.11-Math.sin(v*Math.PI)*height);
    g.globalAlpha=a*Math.sin(u*Math.PI)*.9;g.strokeStyle='#ef573c';g.lineWidth=Math.max(1,q*.009);g.beginPath();g.moveTo(tx,ty);g.lineTo(x,y);g.stroke();
    g.fillStyle=i%3?'#ffd36b':'#ff9a44';g.beginPath();g.ellipse(x,y,q*.0045,q*.007,-side*.35,0,Math.PI*2);g.fill();
  }
  g.globalAlpha=a*(.5+Math.sin(tm*1.6)*.09);g.fillStyle='#ffd96c';g.beginPath();g.ellipse(ox+q*.589,oy+q*.423,q*.049,q*.006,0,0,Math.PI*2);g.fill();
  g.restore();
}
SH_ONBELLEK.push('volkan','onPlanV');
SH_KUR.volkan=()=>{const A={c:shTuval(),W,H,adim:[]};A.adim.push(()=>sh5Fon(A.c.getContext('2d'),W,H));return A;};
SH_KUR.onPlanV=()=>{const A={c:shTuval(),W,H,adim:[]};A.adim.push(()=>{const x=A.c.getContext('2d');x.fillStyle='#302b4caa';for(let i=0;i<7;i++){const px=i*W/6;x.beginPath();x.moveTo(px-W*.08,H);x.quadraticCurveTo(px-W*.04,H*.83,px,H*(.87+(i%3)*.03));x.lineTo(px+W*.08,H);x.fill();}});return A;};

// ══════════════════ BÖLÜM 6: ŞENLİK KALESİ ══════════════════
// Seçim baloncuğu ve odadan rüyaya geçiş aynı resmi paylaşır: alacakaranlıkta mor-lacivert gök, bulutların üstünde bayraklı
// masal kalesi, kuleler arasında ışık bayrakları, yuvarlak çatılı uyuyan kasaba ve tepede ışıklı küçük bir midilli.
// Durağan kısım (sh6Fon) önbellekte; havai fişekler, dalgalanan bayraklar, yanıp sönen bayrak ışıkları ve midillinin
// ışıltısı her karede (sh6Canli) çizilir. İkisi aynı ölçüleri (sh6Olcu) kullanır; resim w×h, nesneler kısa kenara (s) göre.
const SH6_RENK = ['#ffd36b', '#ff9ed2', '#9fe6ff', '#c6a8ff', '#a8f0c0'];   // şenlik pastelleri (fişek, bayrak, ışık)
function sh6Olcu(w, h) {
  const s = Math.min(w, h), cx = w * 0.6, by = h * 0.6;
  // bayrak dizileri: ana kuleden yan kulelere sarkan iki ip [x0, y0, x1, y1, sarkma]
  const ip = [[cx - s * 0.07, by - s * 0.27, cx - s * 0.19, by - s * 0.19, s * 0.045], [cx + s * 0.07, by - s * 0.27, cx + s * 0.19, by - s * 0.19, s * 0.045],
    [cx - s * 0.19, by - s * 0.12, cx + s * 0.19, by - s * 0.12, s * 0.05]];
  return { s, cx, by, ip,
    tepe: [[cx, by - s * 0.5, 1.25], [cx - s * 0.19, by - s * 0.37, 1], [cx + s * 0.19, by - s * 0.37, 1]],   // bayrak direği uçları [x, y, boy]
    fisek: [[w * 0.24, h * 0.34], [w * 0.92, h * 0.44], [w * 0.45, h * 0.11]],                      // havai fişek patlama yerleri
    mid: { x: w * 0.26, y: h * 0.9, u: s * 0.085 } };                                                       // midilli (toynak tabanı, gövde boyu)
}
const sh6IpNokta = (q, u) => [lerp(q[0], q[2], u), lerp(q[1], q[3], u) + Math.sin(u * Math.PI) * q[4]];
// küçük midilli (sağa bakar; (0,0) toynak tabanı, u gövde boyu): açık leylak gövde, pembe-turkuaz yele, mutlu kapalı göz
function sh6Midilli(x, px, py, u) {
  x.save(); x.translate(px, py); x.scale(u, u); x.lineCap = 'round'; x.lineJoin = 'round';
  const halo = x.createRadialGradient(0, -0.7, 0, 0, -0.7, 1.3); halo.addColorStop(0, 'rgba(255,236,250,0.5)'); halo.addColorStop(1, 'rgba(255,220,250,0)');
  x.fillStyle = halo; x.fillRect(-1.4, -2, 2.8, 2.4);
  x.strokeStyle = '#c9b4ea'; x.lineWidth = 0.13;   // arka bacaklar (biraz koyu)
  for (const bx of [-0.25, 0.32]) { x.beginPath(); x.moveTo(bx, -0.5); x.lineTo(bx + 0.03, -0.04); x.stroke(); }
  x.strokeStyle = '#d98fc0'; x.lineWidth = 0.15;   // kuyruk
  x.beginPath(); x.moveTo(-0.45, -0.68); x.bezierCurveTo(-0.85, -0.78, -0.8, -0.3, -0.62, -0.22); x.stroke();
  x.strokeStyle = '#8fdcf0'; x.lineWidth = 0.08; x.beginPath(); x.moveTo(-0.47, -0.66); x.bezierCurveTo(-0.76, -0.7, -0.72, -0.4, -0.58, -0.3); x.stroke();
  const gv = x.createLinearGradient(0, -1, 0, -0.3); gv.addColorStop(0, '#fdf7ff'); gv.addColorStop(1, '#dccbf4'); x.fillStyle = gv;
  x.beginPath(); x.ellipse(0, -0.62, 0.5, 0.25, 0, 0, Math.PI * 2); x.fill();   // gövde
  x.beginPath(); x.moveTo(0.22, -0.78); x.quadraticCurveTo(0.42, -1.05, 0.5, -1.2); x.lineTo(0.72, -1.08); x.quadraticCurveTo(0.56, -0.8, 0.46, -0.52); x.closePath(); x.fill();   // boyun
  x.beginPath(); x.ellipse(0.66, -1.13, 0.22, 0.14, 0.45, 0, Math.PI * 2); x.fill();   // baş
  x.beginPath(); x.moveTo(0.52, -1.24); x.lineTo(0.56, -1.42); x.lineTo(0.64, -1.25); x.fill();   // kulak
  x.strokeStyle = '#efe4ff'; x.lineWidth = 0.13;   // ön bacaklar
  for (const bx of [-0.12, 0.42]) { x.beginPath(); x.moveTo(bx, -0.5); x.lineTo(bx, -0.04); x.stroke(); }
  x.fillStyle = '#b79ad8'; for (const bx of [-0.25, 0.32, -0.12, 0.42]) { x.beginPath(); x.ellipse(bx + 0.01, -0.03, 0.08, 0.04, 0, 0, Math.PI * 2); x.fill(); }   // toynaklar
  x.strokeStyle = '#ff9ed2'; x.lineWidth = 0.12;   // yele: pembe + turkuaz tutamlar
  x.beginPath(); x.moveTo(0.5, -1.27); x.quadraticCurveTo(0.3, -1.1, 0.22, -0.8); x.stroke();
  x.strokeStyle = '#9fe6ff'; x.lineWidth = 0.07; x.beginPath(); x.moveTo(0.46, -1.2); x.quadraticCurveTo(0.33, -1.02, 0.27, -0.84); x.stroke();
  x.fillStyle = '#ffb3dc'; x.beginPath(); x.ellipse(0.47, -1.3, 0.09, 0.05, -0.5, 0, Math.PI * 2); x.fill();   // perçem
  x.strokeStyle = '#5b4a7a'; x.lineWidth = 0.035; x.beginPath(); x.arc(0.71, -1.17, 0.045, 0.2, Math.PI - 0.2); x.stroke();   // gülen kapalı göz
  x.fillStyle = 'rgba(255,150,190,0.5)'; x.beginPath(); x.arc(0.76, -1.08, 0.04, 0, Math.PI * 2); x.fill();   // yanak
  x.restore();
}
function sh6Fon(x, w, h) {
  const O = sh6Olcu(w, h), s = O.s, cx = O.cx, by = O.by, r = rng(61);
  // gök: yukarıda lacivert, ufukta mor-pembe alacakaranlık
  let gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#171a48'); gr.addColorStop(0.32, '#33296a'); gr.addColorStop(0.55, '#6a4588'); gr.addColorStop(0.72, '#b979a8'); gr.addColorStop(1, '#efb3a0');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  gr = x.createRadialGradient(cx, by - s * 0.15, 0, cx, by - s * 0.15, s * 0.6); gr.addColorStop(0, 'rgba(255,196,214,0.35)'); gr.addColorStop(1, 'rgba(255,170,200,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  x.fillStyle = '#fff6dc';
  for (let i = 0; i < 46; i++) { x.globalAlpha = 0.25 + r() * 0.6; x.beginPath(); x.arc(r() * w, r() * h * 0.5, Math.max(0.6, s * (0.002 + r() * 0.003)), 0, Math.PI * 2); x.fill(); }
  x.globalAlpha = 1;
  // hilal ay (sol üstte, yumuşak haleli)
  const ax = w * 0.24, ay = h * 0.16, ar = s * 0.045;
  gr = x.createRadialGradient(ax, ay, 0, ax, ay, ar * 3.2); gr.addColorStop(0, 'rgba(255,240,210,0.35)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); x.fillStyle = gr; x.fillRect(ax - ar * 4, ay - ar * 4, ar * 8, ar * 8);
  x.save(); x.beginPath(); x.arc(ax, ay, ar, 0, Math.PI * 2); x.clip(); x.fillStyle = '#fff3d2'; x.beginPath(); x.rect(ax - ar, ay - ar, ar * 2, ar * 2); x.arc(ax + ar * 0.42, ay - ar * 0.2, ar * 0.86, 0, Math.PI * 2); x.fill('evenodd'); x.restore();
  // uzak tepeler
  for (let k = 0; k < 2; k++) {
    x.fillStyle = k ? '#4a3a7c' : '#5d4789'; x.beginPath(); x.moveTo(0, h);
    for (let i = 0; i <= 20; i++) x.lineTo(i / 20 * w, by - s * (0.06 - k * 0.04) + Math.sin(i * 0.9 + k * 2.3) * s * 0.025);
    x.lineTo(w, h); x.fill();
  }
  // kalenin tepesi
  x.fillStyle = '#3d2f6c'; x.beginPath(); x.ellipse(cx, by + s * 0.05, s * 0.36, s * 0.085, 0, Math.PI, 0); x.lineTo(cx + s * 0.36, h); x.lineTo(cx - s * 0.36, h); x.fill();
  // ── kale: soluk leylak taş, pembe konik çatılar, altın pencereler ──
  const tas = x.createLinearGradient(cx - s * 0.2, 0, cx + s * 0.2, 0); tas.addColorStop(0, '#e6d4f2'); tas.addColorStop(0.55, '#c3acde'); tas.addColorStop(1, '#8f78b8');
  const cati = (x0, x1, yb, yt, c1, c2) => {   // konik çatı: hafif kavisli kenarlar, sağ yarısı gölgede
    const m = (x0 + x1) / 2; x.fillStyle = c1; x.beginPath(); x.moveTo(x0, yb); x.quadraticCurveTo(m - (x1 - x0) * 0.12, yb - (yb - yt) * 0.45, m, yt); x.quadraticCurveTo(m + (x1 - x0) * 0.12, yb - (yb - yt) * 0.45, x1, yb); x.closePath(); x.fill();
    x.fillStyle = c2; x.beginPath(); x.moveTo(m, yt); x.quadraticCurveTo(m + (x1 - x0) * 0.12, yb - (yb - yt) * 0.45, x1, yb); x.lineTo(m + (x1 - x0) * 0.12, yb); x.closePath(); x.fill();
    x.fillStyle = 'rgba(80,40,90,0.35)'; x.fillRect(x0 - s * 0.004, yb - s * 0.006, x1 - x0 + s * 0.008, s * 0.012);
  };
  const pencere = (px, py, pw, ph) => {   // kemerli altın pencere
    x.fillStyle = '#ffd98a'; x.beginPath(); x.moveTo(px - pw / 2, py + ph / 2); x.lineTo(px - pw / 2, py - ph / 2 + pw / 2); x.arc(px, py - ph / 2 + pw / 2, pw / 2, Math.PI, 0); x.lineTo(px + pw / 2, py + ph / 2); x.fill();
  };
  // arka kulecikler
  for (const sd of [-1, 1]) { const tx = cx + sd * s * 0.11; x.fillStyle = '#a58fc8'; x.fillRect(tx - s * 0.025, by - s * 0.24, s * 0.05, s * 0.14); cati(tx - s * 0.035, tx + s * 0.035, by - s * 0.24, by - s * 0.34, '#c973a6', '#a65a8c'); }
  // sur duvarı ve mazgallar
  x.fillStyle = tas; x.fillRect(cx - s * 0.2, by - s * 0.13, s * 0.4, s * 0.16);
  for (let i = 0; i < 11; i++) { const mx = cx - s * 0.2 + i * s * 0.04; x.fillRect(mx, by - s * 0.155, s * 0.022, s * 0.03); }
  // ana kule
  x.fillStyle = tas; x.fillRect(cx - s * 0.075, by - s * 0.3, s * 0.15, s * 0.2);
  for (let i = 0; i < 4; i++) x.fillRect(cx - s * 0.085 + i * s * 0.05, by - s * 0.32, s * 0.03, s * 0.03);
  cati(cx - s * 0.095, cx + s * 0.095, by - s * 0.31, by - s * 0.46, '#ef8fbd', '#c96b9b');
  // yan kuleler (yuvarlak gövde: yan gölge)
  for (const sd of [-1, 1]) {
    const tx = cx + sd * s * 0.19;
    const tg = x.createLinearGradient(tx - s * 0.045, 0, tx + s * 0.045, 0); tg.addColorStop(0, '#e9dbf5'); tg.addColorStop(0.6, '#bea6da'); tg.addColorStop(1, '#8a72b3');
    x.fillStyle = tg; x.fillRect(tx - s * 0.045, by - s * 0.21, s * 0.09, s * 0.24);
    cati(tx - s * 0.06, tx + s * 0.06, by - s * 0.21, by - s * 0.335, '#ef8fbd', '#c96b9b');
    pencere(tx, by - s * 0.14, s * 0.022, s * 0.04); pencere(tx, by - s * 0.06, s * 0.018, s * 0.03);
  }
  // bayrak direkleri (bayraklar canlı katmanda dalgalanır)
  x.strokeStyle = '#f3e3c0'; x.lineWidth = Math.max(1, s * 0.005); x.lineCap = 'round';
  for (const [tx, ty] of O.tepe) { x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx, ty + s * 0.05); x.stroke(); x.fillStyle = '#ffe9a8'; x.beginPath(); x.arc(tx, ty, s * 0.006, 0, Math.PI * 2); x.fill(); }
  // pencereler, yuvarlak gül pencere, kapı
  pencere(cx - s * 0.035, by - s * 0.21, s * 0.026, s * 0.05); pencere(cx + s * 0.035, by - s * 0.21, s * 0.026, s * 0.05);
  x.fillStyle = '#ffe3a0'; x.beginPath(); x.arc(cx, by - s * 0.265, s * 0.016, 0, Math.PI * 2); x.fill();
  for (const px of [-0.15, -0.1, 0.1, 0.15]) pencere(cx + px * s, by - s * 0.07, s * 0.016, s * 0.028);
  x.fillStyle = '#5a3f6e'; x.beginPath(); x.moveTo(cx - s * 0.04, by + s * 0.03); x.lineTo(cx - s * 0.04, by - s * 0.03); x.arc(cx, by - s * 0.03, s * 0.04, Math.PI, 0); x.lineTo(cx + s * 0.04, by + s * 0.03); x.fill();
  x.fillStyle = '#ffcf86'; x.beginPath(); x.moveTo(cx - s * 0.03, by + s * 0.03); x.lineTo(cx - s * 0.03, by - s * 0.03); x.arc(cx, by - s * 0.03, s * 0.03, Math.PI, 0); x.lineTo(cx + s * 0.03, by + s * 0.03); x.fill();
  // pencerelerin sıcak ışığı
  x.globalCompositeOperation = 'lighter';
  gr = x.createRadialGradient(cx, by - s * 0.15, 0, cx, by - s * 0.15, s * 0.3); gr.addColorStop(0, 'rgba(255,205,130,0.22)'); gr.addColorStop(1, 'rgba(255,190,120,0)'); x.fillStyle = gr; x.fillRect(cx - s * 0.3, by - s * 0.45, s * 0.6, s * 0.6);
  x.globalCompositeOperation = 'source-over';
  // bayrak dizileri: ince ip + üçgen flamalar (ışıkları canlı katmanda yanıp söner)
  for (let j = 0; j < O.ip.length; j++) {
    const q = O.ip[j], n = 7;
    x.strokeStyle = 'rgba(70,45,90,0.7)'; x.lineWidth = Math.max(0.8, s * 0.0025); x.beginPath();
    for (let i = 0; i <= 16; i++) { const [px, py] = sh6IpNokta(q, i / 16); if (i) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke();
    for (let i = 0; i < n; i++) {
      const [px, py] = sh6IpNokta(q, (i + 0.5) / n), fw = s * 0.011, fh = s * 0.026;
      x.fillStyle = SH6_RENK[(i + j * 2) % 5]; x.beginPath(); x.moveTo(px - fw, py); x.lineTo(px + fw, py); x.lineTo(px, py + fh); x.closePath(); x.fill();
    }
  }
  // kalenin önünde bulut denizi (kale bulutların arasında süzülüyor gibi)
  // kabarık bulut öbekleri: farklı boy ve yükseklikte toplar, üstlerinde sola-yukarı kaymış açık ışık
  const bulut = (y0, n, r0, r1, col, acik, sd) => {
    const q = rng(sd), T = [];
    for (let i = 0; i <= n; i++) T.push([(i + (q() - 0.5) * 0.7) / n * w * 1.1 - w * 0.05, y0 + (q() - 0.5) * s * 0.06, s * (r0 + q() * (r1 - r0))]);
    x.fillStyle = col; x.beginPath(); for (const [px, py, pr] of T) { x.moveTo(px + pr * 1.25, py); x.ellipse(px, py, pr * 1.25, pr, 0, 0, Math.PI * 2); } x.rect(-2, y0 + s * 0.01, w + 4, h); x.fill();
    x.save(); x.clip(); x.fillStyle = acik; x.globalAlpha = 0.4; x.beginPath(); for (const [px, py, pr] of T) { x.moveTo(px + pr * 1.05, py - pr * 0.3); x.ellipse(px, py - pr * 0.3, pr * 1.05, pr * 0.72, 0, 0, Math.PI * 2); } x.fill(); x.restore();
  };
  bulut(by + s * 0.06, Math.ceil(w / s * 16), 0.02, 0.05, '#93709f', '#e4b2d0', 4);
  bulut(by + s * 0.15, Math.ceil(w / s * 12), 0.025, 0.06, '#6d5690', '#a988bf', 9);
  // ön kasaba: yuvarlak çatılı masal evleri, pencerelerde altın ışık
  const yT = h * 0.86, ev = rng(23);
  for (let px = -s * 0.04; px < w + s * 0.1;) {
    const ew = s * (0.085 + ev() * 0.05), eh = s * (0.06 + ev() * 0.05), ex = px + ew / 2, ey = yT - eh + s * 0.02 * ev(), tur = ev();
    x.fillStyle = ev() < 0.5 ? '#3a2d63' : '#33285a'; x.fillRect(px, ey, ew, h - ey);
    x.fillStyle = ['#4f3a7c', '#5a3a72', '#45396f'][Math.floor(ev() * 3)]; x.beginPath();
    if (tur < 0.45) x.ellipse(ex, ey, ew * 0.58, eh * 0.55, 0, Math.PI, 0);   // kubbe çatı
    else { x.moveTo(px - ew * 0.08, ey); x.quadraticCurveTo(ex - ew * 0.1, ey - eh * 0.4, ex, ey - eh * 0.85); x.quadraticCurveTo(ex + ew * 0.1, ey - eh * 0.4, px + ew * 1.08, ey); }   // sivri masal çatısı
    x.fill();
    const pn = ev() < 0.5 ? 1 : 2;
    for (let k = 0; k < pn; k++) { const wx = px + ew * (pn === 1 ? 0.5 : 0.3 + k * 0.4), wy = ey + eh * 0.35; x.fillStyle = 'rgba(255,200,120,0.25)'; x.beginPath(); x.arc(wx, wy, s * 0.02, 0, Math.PI * 2); x.fill(); pencere(wx, wy, s * 0.014, s * 0.022); }
    px += ew * (0.92 + ev() * 0.15);
  }
  // midillinin çimenli tepeciği ve ışıklı midilli
  const M = O.mid;
  x.fillStyle = '#2f4a6e'; x.beginPath(); x.ellipse(M.x, h * 1.02, s * 0.2, h * 1.02 - M.y + s * 0.012, 0, Math.PI, 0); x.fill();
  x.fillStyle = '#3f6688'; x.beginPath(); x.ellipse(M.x, h * 1.02 + s * 0.006, s * 0.19, h * 1.02 - M.y + s * 0.006, 0, Math.PI * 1.15, Math.PI * 1.85); x.lineTo(M.x, h); x.fill();
  sh6Midilli(x, M.x, M.y + s * 0.004, M.u);
}
function sh6Canli(ox, oy, w, h, tm, a, hov) {
  if (a <= 0.01) return;
  hov = hov || 0;
  const O = sh6Olcu(w, h), s = O.s, hz = 1 + 0.35 * hov;
  g.save(); g.lineCap = 'round';
  // 1) havai fişekler: yükselen ışık izi, sonra pastel ışık çiçeği (yavaşça aşağı süzülüp söner)
  g.globalCompositeOperation = 'lighter';
  for (let j = 0; j < O.fisek.length; j++) {
    const per = 3.1 + j * 0.45, u = (tm * hz / per + j * 0.37) % 1, fx = ox + O.fisek[j][0], fy = oy + O.fisek[j][1], col = SH6_RENK[(j * 2 + Math.floor(tm * hz / per + j * 0.37)) % 5];
    if (u < 0.2) {   // yükseliş
      const e = u / 0.2, yy = fy + s * 0.28 * (1 - shEaseOut(e));
      g.globalAlpha = a * 0.7; g.fillStyle = '#fff1c8'; g.beginPath(); g.arc(fx, yy, Math.max(1, s * 0.005), 0, Math.PI * 2); g.fill();
      g.globalAlpha = a * 0.25; g.fillRect(fx - Math.max(0.5, s * 0.002), yy, Math.max(1, s * 0.004), s * 0.05);
      continue;
    }
    const e = (u - 0.2) / 0.8, R = s * (0.085 + 0.02 * (j % 2)) * shEaseOut(Math.min(1, e * 1.6)), dus = e * e * s * 0.035, al = a * Math.pow(1 - e, 1.4);
    if (e < 0.18) shParilti(fx, fy, s * 0.05 * (1 - e / 0.18), a * (1 - e / 0.18));
    g.strokeStyle = col; g.lineWidth = Math.max(1, s * 0.0045); dglow(col, fx, fy + dus, R * 1.3, al * 0.18);
    for (let k = 0; k < 12; k++) {
      const an = k / 12 * Math.PI * 2 + j, cx = fx + Math.cos(an) * R, cy = fy + Math.sin(an) * R + dus;
      g.globalAlpha = al * 0.6; g.beginPath(); g.moveTo(fx + Math.cos(an) * R * 0.6, fy + Math.sin(an) * R * 0.6 + dus * 0.6); g.lineTo(cx, cy); g.stroke();
      dglow(col, cx, cy, s * 0.02, al * 0.55);
      g.globalAlpha = al * (0.8 + 0.2 * Math.sin(tm * 9 + k)); g.fillStyle = k % 3 ? col : '#fff8e0'; g.beginPath(); g.arc(cx, cy, Math.max(1, s * 0.007), 0, Math.PI * 2); g.fill();
    }
  }
  // 2) bayrak ışıkları: ip boyunca minik ampuller, sırayla yanıp söner
  for (let j = 0; j < O.ip.length; j++) {
    const q = O.ip[j];
    for (let i = 0; i <= 7; i++) {
      const [px, py] = sh6IpNokta(q, i / 7), tw = 0.55 + 0.45 * Math.sin(tm * 2.4 * hz - i * 0.9 + j * 1.7);
      dglow(i % 2 ? '#ffe2a0' : '#ffc6e6', ox + px, oy + py, s * 0.022, a * 0.5 * tw);
      g.globalAlpha = a * (0.6 + 0.4 * tw); g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(ox + px, oy + py, Math.max(0.8, s * 0.0045), 0, Math.PI * 2); g.fill();
    }
  }
  g.globalCompositeOperation = 'source-over';
  // 3) kule tepelerinde dalgalanan flamalar
  for (let j = 0; j < O.tepe.length; j++) {
    const [tx0, ty0, boy] = O.tepe[j], tx = ox + tx0, ty = oy + ty0, L = s * 0.06 * boy, fh = s * 0.026 * boy;
    const dal = (k) => Math.sin(tm * 3.6 * hz - k * 2.2 + j) * fh * 0.28;
    g.globalAlpha = a; g.fillStyle = ['#ff8fbf', '#ffd36b', '#9fe6ff'][j];
    g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + L * 0.5, ty + dal(0.5) - fh * 0.05, tx + L, ty + fh * 0.45 + dal(1));
    g.quadraticCurveTo(tx + L * 0.5, ty + fh + dal(0.5), tx, ty + fh); g.closePath(); g.fill();
    g.globalAlpha = a * 0.35; g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(tx, ty + fh * 0.15); g.quadraticCurveTo(tx + L * 0.45, ty + fh * 0.2 + dal(0.5), tx + L * 0.8, ty + fh * 0.42 + dal(0.9)); g.lineTo(tx, ty + fh * 0.4); g.fill();
  }
  // 4) midillinin yelesinde ışıltı, toynaklarından yükselen yıldız tozu
  const M = O.mid, mx = ox + M.x, my = oy + M.y;
  g.globalCompositeOperation = 'lighter';
  dglow('#ffd6f4', mx + M.u * 0.3, my - M.u * 0.8, M.u * 1.3, a * (0.22 + 0.08 * Math.sin(tm * 1.7)));
  for (let i = 0; i < 5; i++) {
    const u = (tm * (0.35 + i * 0.05) * hz + i * 0.23) % 1, px = mx + M.u * (-0.3 + i * 0.18 + Math.sin(tm + i * 2) * 0.08), py = my - M.u * (0.1 + u * 1.3);
    shParilti(px, py, M.u * (0.1 + 0.08 * (i % 2)), a * Math.sin(u * Math.PI) * 0.85);
  }
  shParilti(mx + M.u * 0.42, my - M.u * 1.15, M.u * 0.22 * (0.6 + 0.4 * Math.sin(tm * 2.6)), a * 0.6);
  g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
// uyku → rüya geçişinin ön planı: köşelerde koyu çatı/çalı siluetleri, üstte sarkan bir flama dizisi (paralaksla kayar)
function sh6OnPlan() {
  const c = shTuval(), x = c.getContext('2d'), s = Math.min(W, H), r = rng(7);
  x.fillStyle = '#2a2148cc';
  for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
    const px = sd < 0 ? W * (0.0 + i * 0.05) : W * (1 - i * 0.05), rr = s * (0.06 + r() * 0.05);
    x.beginPath(); x.ellipse(px, H * (1.0 - (i % 2) * 0.02), rr * 1.3, rr, 0, Math.PI, 0); x.fill();
  }
  x.lineCap = 'round'; x.strokeStyle = 'rgba(60,40,80,0.65)'; x.lineWidth = Math.max(1, s * 0.003);
  const q = [-W * 0.05, H * 0.03, W * 1.05, H * 0.03, H * 0.075];
  x.beginPath(); for (let i = 0; i <= 24; i++) { const [px, py] = sh6IpNokta(q, i / 24); if (i) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke();
  const n = Math.max(9, Math.round(W / s * 9));
  for (let i = 0; i < n; i++) {
    const [px, py] = sh6IpNokta(q, (i + 0.5) / n), fw = s * 0.018, fh = s * 0.045;
    x.globalAlpha = 0.8; x.fillStyle = SH6_RENK[i % 5]; x.beginPath(); x.moveTo(px - fw, py); x.lineTo(px + fw, py); x.lineTo(px, py + fh); x.closePath(); x.fill();
  }
  x.globalAlpha = 1;
  return c;
}
SH_ONBELLEK.push('senlik', 'onPlanF');
SH_KUR.senlik = () => { const A = { c: shTuval(), W, H, adim: [] }; A.adim.push(() => sh6Fon(A.c.getContext('2d'), W, H)); return A; };
SH_KUR.onPlanF = () => { const A = { c: null, W, H, adim: [() => { A.c = sh6OnPlan(); }] }; return A; };
// Bölüm 6 sabahı (son rüya): pencereden uzak tepede bayraklı kale, bayrakları sabah rüzgârında dalgalanır; yatağın üstünde
// altı rüyanın altı küçük hatıra ışığı (her balonun rengi) yavaşça döner. a: 0..1 beliriş
function sh6Sabah(tm, a) {
  if (a <= 0.01) return;
  shOdaT(); g.save(); shPencereYol(g, 0); g.clip(); g.globalAlpha = a;
  g.fillStyle = '#c3b4d6'; g.beginPath(); g.ellipse(29, 50, 18, 6.5, 0, Math.PI, 0); g.fill();   // tepe
  const cx = 29, by = 44.2;
  g.fillStyle = '#d9cce6'; g.fillRect(cx - 4.2, by - 2.6, 8.4, 3);   // sur
  g.fillRect(cx - 1.4, by - 6, 2.8, 4);   // ana kule
  for (const sd of [-1, 1]) g.fillRect(cx + sd * 4 - 0.9, by - 4.3, 1.8, 4.6);   // yan kuleler
  g.fillStyle = '#eba6c4';
  const cati = (m, yb, yt, yw) => { g.beginPath(); g.moveTo(m - yw, yb); g.lineTo(m, yt); g.lineTo(m + yw, yb); g.closePath(); g.fill(); };
  cati(cx, by - 6, by - 9, 1.8); cati(cx - 4, by - 4.3, by - 6.6, 1.25); cati(cx + 4, by - 4.3, by - 6.6, 1.25);
  g.fillStyle = '#ffd98a'; g.fillRect(cx - 0.5, by - 0.9, 1, 1.2);
  const flama = (fx, fy, col, k) => { const d = Math.sin(tm * 3 + k) * 0.25; g.fillStyle = col; g.beginPath(); g.moveTo(fx, fy); g.quadraticCurveTo(fx + 0.8, fy + d, fx + 1.6, fy + 0.35 + d); g.lineTo(fx, fy + 0.8); g.fill(); };
  g.strokeStyle = '#efe2c8'; g.lineWidth = 0.15;
  for (const [fx, fy, col, k] of [[cx, by - 9, '#ff8fbf', 0], [cx - 4, by - 6.6, '#ffc94d', 1.3], [cx + 4, by - 6.6, '#7fd6f0', 2.4]]) { g.beginPath(); g.moveTo(fx, fy + 0.6); g.lineTo(fx, fy - 1); g.stroke(); flama(fx, fy - 1, col, k); }
  g.restore(); g.globalAlpha = 1;
}
// rüyaların hatıra ışıkları (orman, göl, bulut, deniz, yanardağ, şenlik; Bölüm 7'de + kuzey ışıkları, Bölüm 8'de + balkabağı): odanın eşyalarının önünde, yatağın üstünde süzülür
function sh6Hatira(tm, a) {
  if (a <= 0.01) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const R = ['orman', 'gol', 'bulut', 'deniz', 'volkan', 'senlik', 'kar', 'cadi', 'ejderha', 'sato'].slice(0, Math.min(11, Math.max(6, sh.fBolum || 1))), n = R.length;
  const k = sh.k0 * sh.zoom, hx = SH_FEZA.x + 7, hy = 38.5;   // Feza ile Pırıl'ın başlarının üstünde
  for (let i = 0; i < n; i++) {
    const an = tm * 0.22 + i * Math.PI * 2 / n, nf = 0.5 + 0.5 * Math.sin(tm * 1.3 + i * 1.9);
    const px = shEkranX(hx + Math.cos(an) * 13), py = shEkranY(hy + Math.sin(an) * 2 + Math.sin(tm * 0.8 + i) * 0.7), col = SH_BALON_RENK[R[i]];
    const ak = a * (0.75 + 0.25 * Math.sin(an));   // arkadakiler biraz soluk
    g.globalCompositeOperation = 'source-over'; dglow(col, px, py, k * (3 + 0.6 * nf), ak * 0.8);   // aydınlık duvarda da rengi seçilsin
    g.globalAlpha = ak * 0.85; g.fillStyle = col; g.beginPath(); g.arc(px, py, k * 0.42, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    g.globalCompositeOperation = 'lighter'; dglow('#ffffff', px, py, k * 0.5, ak * 0.6);
  }
  g.globalCompositeOperation = 'source-over';
}
// Son sözün ilk cümlesi ('a_f_final1') dünyadaki şenlik kutlamasının içinde söylenir (oyun.js, senlikFinal + 5 sn; Bölüm 4/5 gibi);
// o zaman sabah akışı durmadan kalan ikisini anlatır. Kutlama bir sebeple erken kesilirse sabah sahnesi bu cümleyi kendisi söyler.
OLAY.on('senlikFinal', () => {
  if (typeof BOLUM_NO === 'undefined' || BOLUM_NO !== 6 || typeof omZamanla !== 'function') return;
  omZamanla(5.05, () => { if (DURUM === 'oyun' && !sh.mod) sh.f6Ozet = 1; });
});

// ══════════════════ BÖLÜM 7: KUZEY IŞIKLARI ══════════════════
// Seçim baloncuğu ve odadan rüyaya geçiş aynı resmi paylaşır: mavi-mor kış gecesi, gökte dalgalanan yeşil-pembe-mor kuzey
// ışıkları, karlı dağlar ve çam ormanı, uzakta ışıklı küçük bir kulübe, önde boynuzunda minik kristaller olan yavru ren geyiği
// ve atkılı bir kardan adam. Durağan kısım (sh7Fon) önbellekte; kuzey ışığı perdeleri, yağan kar, kristal ve pencere ışıltısı,
// bacadan çıkan duman her karede (sh7Canli) çizilir. İkisi aynı ölçüleri (sh7Olcu) kullanır; resim w×h, nesneler kısa kenara (s) göre.
// (geyik.js yalnız Bölüm 7 sayfasında yüklenir; seçim ekranı ona güvenmez, bu yüzden geyik burada ayrıca, basitçe çizilir.)
const SH7_RENK = ['#8dffc8', '#ffa6dc', '#c3a2ff', '#a8e8ff'];   // kuzey ışığı yeşili, pembe, mor, buz mavisi
// ses harfi: CORE 'k' önerisini kullanmadıysa ses.js'teki yeni Bölüm 7 cümlelerinden bulunur (önek 'p_X_' / 'a_X_')
let sh7H = null;
function sh7Harf(on) {
  if (!sh7H) {
    try {
      const L = typeof SES !== 'undefined' && SES.LINES;
      if (L) { let h = 'k'; if (!L.p_k_uyku) for (const k in L) { const m = /^p_([a-z]+)_uyku$/.exec(k); if (m && 'y b i v f'.split(' ').indexOf(m[1]) < 0) { h = m[1]; break; } } sh7H = h; }
    } catch (e) {}
  }
  return on + (sh7H || 'k') + '_';
}
const sh7Hs = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };   // sabit sözde rastgele (kar taneleri)
function sh7Olcu(w, h) {
  const s = Math.min(w, h);
  return { s,
    // kuzey ışığı perdeleri: [alt kenar (h oranı), boy (h oranı), eğim, renk, faz]
    perde: [[0.27, 0.17, 0.08, '#c3a2ff', 1.7], [0.37, 0.3, -0.1, '#7dffbe', 0], [0.43, 0.16, -0.04, '#ffa6dc', 3.2]],
    gy: { x: w * 0.38, y: h * 0.87, u: s * 0.15 },     // yavru ren geyiği (toynak tabanı, gövde boyu)
    kd: { x: w * 0.7, y: h * 0.865, u: s * 0.085 },      // kardan adam
    kl: { x: w * 0.21, y: h * 0.655, u: s * 0.05 } };   // kulübe
}
// kuzey ışığı perdesi şeridi (dikey: üstte saydam, altta parlak kenar), renk başına bir kez
const sh7Spr = {};
function sh7PerdeSpr(col) {
  if (sh7Spr[col]) return sh7Spr[col];
  const c = document.createElement('canvas'); c.width = 4; c.height = 128; const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, mixc(col, col, 0, 0)); gr.addColorStop(0.45, mixc(col, col, 0, 0.26)); gr.addColorStop(0.8, mixc(col, col, 0, 0.85));
  gr.addColorStop(0.93, mixc(col, '#ffffff', 0.45, 0.95)); gr.addColorStop(1, mixc(col, col, 0, 0));
  x.fillStyle = gr; x.fillRect(0, 0, 4, 128);
  return sh7Spr[col] = c;
}
// karlı çam: katman katman koyu dal, her katmanın üstünde kabarık kar
function sh7Cam(x, bx, by, hh, col, kar) {
  x.fillStyle = '#2a2440'; x.fillRect(bx - hh * 0.035, by - hh * 0.08, hh * 0.07, hh * 0.1);
  for (let k = 0; k < 4; k++) {
    const yb = by - hh * (0.06 + k * 0.2), th = hh * (0.4 - k * 0.04), ww = hh * 0.33 * (1 - k * 0.2);
    x.fillStyle = col; x.beginPath(); x.moveTo(bx - ww, yb); x.quadraticCurveTo(bx - ww * 0.4, yb - th * 0.45, bx, yb - th);
    x.quadraticCurveTo(bx + ww * 0.4, yb - th * 0.45, bx + ww, yb); x.quadraticCurveTo(bx, yb - th * 0.14, bx - ww, yb); x.fill();
    x.fillStyle = kar; x.beginPath(); x.moveTo(bx - ww * 0.66, yb - th * 0.33); x.quadraticCurveTo(bx - ww * 0.3, yb - th * 0.72, bx, yb - th * 1.02);
    x.quadraticCurveTo(bx + ww * 0.3, yb - th * 0.72, bx + ww * 0.66, yb - th * 0.33); x.quadraticCurveTo(bx + ww * 0.4, yb - th * 0.24, bx + ww * 0.22, yb - th * 0.4);
    x.quadraticCurveTo(bx, yb - th * 0.28, bx - ww * 0.22, yb - th * 0.42); x.quadraticCurveTo(bx - ww * 0.42, yb - th * 0.24, bx - ww * 0.66, yb - th * 0.33); x.fill();
  }
}
// yavru ren geyiği (sağa bakar; (0,0) toynak tabanı, u gövde boyu): sıcak kahve gövde, krem benekler, pembe atkı,
// minik boynuzların uçlarında buz kristalleri (ışıltısı canlı katmanda)
const SH7_UC = [[0.39, -1.62], [0.5, -1.53], [0.75, -1.66], [0.64, -1.55]];   // boynuz kristallerinin yerleri (u birimi)
function sh7Geyik(x, px, py, u) {
  x.save(); x.translate(px, py); x.scale(u, u); x.lineCap = 'round'; x.lineJoin = 'round';
  const halo = x.createRadialGradient(0.2, -0.9, 0, 0.2, -0.9, 1.3); halo.addColorStop(0, 'rgba(220,240,255,0.4)'); halo.addColorStop(1, 'rgba(220,240,255,0)');
  x.fillStyle = halo; x.fillRect(-1.2, -2.2, 2.8, 2.4);
  x.fillStyle = 'rgba(90,100,170,0.28)'; x.beginPath(); x.ellipse(0.08, -0.01, 0.62, 0.06, 0, 0, Math.PI * 2); x.fill();   // karda gölge
  x.strokeStyle = '#8a5f48'; x.lineWidth = 0.12;   // arka bacaklar (koyu)
  for (const bx of [-0.27, 0.3]) { x.beginPath(); x.moveTo(bx, -0.52); x.lineTo(bx + 0.03, -0.05); x.stroke(); }
  const gv = x.createLinearGradient(0, -0.9, 0, -0.35); gv.addColorStop(0, '#c99a74'); gv.addColorStop(1, '#a8755a'); x.fillStyle = gv;
  x.beginPath(); x.ellipse(0, -0.64, 0.47, 0.25, 0, 0, Math.PI * 2); x.fill();   // gövde
  x.beginPath(); x.moveTo(0.2, -0.78); x.quadraticCurveTo(0.4, -1.02, 0.5, -1.16); x.lineTo(0.72, -1.06); x.quadraticCurveTo(0.56, -0.8, 0.44, -0.52); x.closePath(); x.fill();   // boyun
  x.fillStyle = '#f2e2cc'; x.beginPath(); x.ellipse(0.04, -0.5, 0.3, 0.1, 0, 0, Math.PI * 2); x.fill();   // açık karın
  x.beginPath(); x.ellipse(-0.47, -0.74, 0.08, 0.07, 0, 0, Math.PI * 2); x.fill();   // pamuk kuyruk
  x.fillStyle = 'rgba(255,244,226,0.85)'; for (const [bx, by, br] of [[-0.22, -0.76, 0.04], [-0.05, -0.8, 0.035], [0.1, -0.76, 0.03], [-0.32, -0.66, 0.03], [0.02, -0.69, 0.028]]) { x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill(); }   // yavru benekleri
  x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(-0.12, -0.87, 0.2, 0.05, 0.05, Math.PI, 0); x.fill();   // sırtta biraz kar
  x.strokeStyle = '#b8876a'; x.lineWidth = 0.12;   // ön bacaklar
  for (const bx of [-0.13, 0.42]) { x.beginPath(); x.moveTo(bx, -0.5); x.lineTo(bx, -0.05); x.stroke(); }
  x.fillStyle = '#5a4038'; for (const bx of [-0.27, 0.33, -0.13, 0.42]) { x.beginPath(); x.ellipse(bx + 0.01, -0.035, 0.075, 0.04, 0, 0, Math.PI * 2); x.fill(); }   // toynaklar
  // boynuzlar (açık krem, kısa, iki çatallı)
  x.strokeStyle = '#efe0c6'; x.lineWidth = 0.055;
  x.beginPath(); x.moveTo(0.53, -1.26); x.quadraticCurveTo(0.44, -1.42, 0.39, -1.62); x.moveTo(0.46, -1.4); x.quadraticCurveTo(0.5, -1.47, 0.5, -1.53); x.stroke();
  x.beginPath(); x.moveTo(0.65, -1.27); x.quadraticCurveTo(0.7, -1.45, 0.75, -1.66); x.moveTo(0.69, -1.42); x.quadraticCurveTo(0.64, -1.48, 0.64, -1.55); x.stroke();
  x.fillStyle = '#e8f7ff'; for (const [cx2, cy2] of SH7_UC) { x.beginPath(); x.moveTo(cx2, cy2 - 0.06); x.lineTo(cx2 + 0.035, cy2); x.lineTo(cx2, cy2 + 0.05); x.lineTo(cx2 - 0.035, cy2); x.closePath(); x.fill(); }
  // baş, kulaklar, burun
  x.fillStyle = '#c4946f'; x.beginPath(); x.ellipse(0.62, -1.14, 0.21, 0.155, 0.3, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.ellipse(0.42, -1.25, 0.12, 0.05, -0.5, 0, Math.PI * 2); x.fill();   // kulak
  x.fillStyle = '#f0c4b8'; x.beginPath(); x.ellipse(0.42, -1.25, 0.07, 0.025, -0.5, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#ecd6bd'; x.beginPath(); x.ellipse(0.78, -1.05, 0.11, 0.085, 0.25, 0, Math.PI * 2); x.fill();   // ağız
  x.fillStyle = '#ef8fa4'; x.beginPath(); x.arc(0.87, -1.08, 0.045, 0, Math.PI * 2); x.fill();   // pembe burun
  x.fillStyle = '#ffffff'; x.globalAlpha = 0.7; x.beginPath(); x.arc(0.86, -1.095, 0.014, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
  x.fillStyle = '#3a2a2e'; x.beginPath(); x.ellipse(0.66, -1.18, 0.038, 0.045, 0, 0, Math.PI * 2); x.fill();   // iri, parlak göz
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0.675, -1.195, 0.014, 0, Math.PI * 2); x.fill();
  x.fillStyle = 'rgba(255,140,170,0.45)'; x.beginPath(); x.arc(0.7, -1.08, 0.04, 0, Math.PI * 2); x.fill();   // yanak
  // pembe atkı (ucu arkaya uçuşur)
  x.strokeStyle = '#ff8fb8'; x.lineWidth = 0.09; x.beginPath(); x.moveTo(0.4, -0.86); x.quadraticCurveTo(0.55, -0.8, 0.66, -0.92); x.stroke();
  x.lineWidth = 0.07; x.beginPath(); x.moveTo(0.44, -0.86); x.quadraticCurveTo(0.3, -0.84, 0.22, -0.72); x.stroke();
  x.strokeStyle = '#ffd6e6'; x.lineWidth = 0.02; x.beginPath(); x.moveTo(0.47, -0.85); x.quadraticCurveTo(0.56, -0.82, 0.63, -0.9); x.stroke();
  x.restore();
}
// kardan adam ((0,0) taban ortası, u ölçek): üç kar topu, kömür gözler, havuç burun, atkı, örgü bere, dal kollar
function sh7Kardan(x, px, py, u) {
  x.save(); x.translate(px, py); x.scale(u, u); x.lineCap = 'round';
  x.fillStyle = 'rgba(90,100,170,0.28)'; x.beginPath(); x.ellipse(0.05, 0, 0.55, 0.07, 0, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#7a5a48'; x.lineWidth = 0.06;   // dal kollar
  x.beginPath(); x.moveTo(-0.24, -1.0); x.lineTo(-0.66, -1.32); x.moveTo(-0.52, -1.21); x.lineTo(-0.58, -1.38); x.moveTo(0.24, -1.02); x.lineTo(0.64, -1.3); x.moveTo(0.5, -1.2); x.lineTo(0.62, -1.18); x.stroke();
  for (const [cy, r] of [[-0.4, 0.42], [-1.0, 0.31], [-1.5, 0.23]]) {
    x.fillStyle = '#c9d4f0'; x.beginPath(); x.arc(0, cy, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#f8fbff'; x.beginPath(); x.arc(-r * 0.12, cy - r * 0.1, r * 0.88, 0, Math.PI * 2); x.fill();
  }
  x.fillStyle = '#3a3448'; for (const [bx, by, br] of [[-0.08, -1.55, 0.035], [0.1, -1.55, 0.035], [0.0, -1.06, 0.035], [0.0, -0.9, 0.035], [0.0, -0.5, 0.04]]) { x.beginPath(); x.arc(bx, by, br, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = '#ff9d4a'; x.beginPath(); x.moveTo(0.0, -1.5); x.lineTo(0.24, -1.46); x.lineTo(0.0, -1.43); x.closePath(); x.fill();   // havuç
  x.strokeStyle = '#3a3448'; x.lineWidth = 0.025; x.beginPath(); x.arc(0.01, -1.47, 0.09, 0.35, Math.PI - 0.35); x.stroke();   // gülümseme
  x.fillStyle = 'rgba(255,150,180,0.5)'; x.beginPath(); x.arc(-0.13, -1.44, 0.04, 0, Math.PI * 2); x.arc(0.15, -1.44, 0.04, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#7fd6c8'; x.lineWidth = 0.09; x.beginPath(); x.moveTo(-0.2, -1.29); x.quadraticCurveTo(0, -1.22, 0.2, -1.29); x.stroke();   // atkı
  x.lineWidth = 0.075; x.beginPath(); x.moveTo(0.12, -1.26); x.quadraticCurveTo(0.2, -1.12, 0.16, -1.0); x.stroke();
  x.fillStyle = '#b79cff'; x.beginPath(); x.ellipse(0, -1.66, 0.2, 0.15, 0, Math.PI, 0); x.fill();   // bere
  x.fillStyle = '#e6dcff'; x.fillRect(-0.21, -1.68, 0.42, 0.05); x.beginPath(); x.arc(0, -1.83, 0.055, 0, Math.PI * 2); x.fill();
  x.restore();
}
// kar altında küçük kulübe ((0,0) taban ortası, u ölçek): sıcak ışıklı pencere, karlı çatı, baca
function sh7Kulube(x, px, py, u) {
  x.save(); x.translate(px, py); x.scale(u, u);
  const hl = x.createRadialGradient(0, -0.5, 0, 0, -0.5, 2.2); hl.addColorStop(0, 'rgba(255,200,130,0.35)'); hl.addColorStop(1, 'rgba(255,190,120,0)');
  x.fillStyle = hl; x.fillRect(-2.4, -2.6, 4.8, 3.2);
  x.fillStyle = '#4b3f6c'; x.fillRect(-0.8, -0.9, 1.6, 0.92);   // duvar
  x.fillStyle = '#3c3360'; x.fillRect(0.38, -1.55, 0.2, 0.5);   // baca
  x.fillStyle = '#f4f7ff'; x.beginPath(); x.ellipse(0.48, -1.55, 0.15, 0.06, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#eef3ff'; x.beginPath(); x.moveTo(-1.08, -0.82); x.lineTo(0, -1.52); x.lineTo(1.08, -0.82);   // karlı çatı (kenarından sarkan kar)
  x.quadraticCurveTo(0.95, -0.66, 0.78, -0.8); x.quadraticCurveTo(0.6, -0.7, 0.42, -0.8); x.quadraticCurveTo(0.2, -0.68, 0, -0.8); x.quadraticCurveTo(-0.3, -0.66, -0.5, -0.8); x.quadraticCurveTo(-0.8, -0.68, -1.08, -0.82); x.fill();
  x.fillStyle = '#ffd98a'; x.fillRect(-0.52, -0.62, 0.36, 0.3); x.fillRect(0.2, -0.6, 0.3, 0.6);   // pencere + kapı
  x.fillStyle = '#4b3f6c'; x.fillRect(-0.355, -0.62, 0.03, 0.3); x.fillRect(-0.52, -0.485, 0.36, 0.03);
  x.fillStyle = '#eef3ff'; x.beginPath(); x.ellipse(0, 0.02, 1.3, 0.14, 0, Math.PI, 0); x.fill();   // önündeki kar
  x.restore();
}
function sh7Fon(x, w, h) {
  const O = sh7Olcu(w, h), s = O.s, r = rng(71);
  // gök: tepede derin lacivert, ufka doğru mor-leylak (kış gecesi)
  let gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1034'); gr.addColorStop(0.3, '#1a2260'); gr.addColorStop(0.5, '#33377c'); gr.addColorStop(0.62, '#5b5a9f'); gr.addColorStop(1, '#8d8cc4');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  // kuzey ışıklarının göğe vurduğu yumuşak renk (perdeler canlı katmanda dalgalanır)
  for (const [px, py, pr, col] of [[0.32, 0.24, 0.42, 'rgba(110,255,190,0.16)'], [0.72, 0.18, 0.38, 'rgba(190,150,255,0.18)'], [0.55, 0.36, 0.3, 'rgba(255,160,220,0.1)']]) {
    gr = x.createRadialGradient(w * px, h * py, 0, w * px, h * py, s * pr); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  }
  x.fillStyle = '#f2f4ff';
  for (let i = 0; i < 60; i++) { x.globalAlpha = 0.25 + r() * 0.6; x.beginPath(); x.arc(r() * w, r() * h * 0.55, Math.max(0.6, s * (0.0018 + r() * 0.003)), 0, Math.PI * 2); x.fill(); }
  x.globalAlpha = 1;
  // uzak karlı dağlar: leylak-mavi gövde, tepelerde kar
  const dag = (taban, tepe, n, col, kar, sd) => {
    const q = rng(sd), T = []; for (let i = 0; i <= n; i++) T.push([(i + (q() - 0.5) * 0.5) / n * w * 1.2 - w * 0.1, h * (taban - tepe * (0.55 + q() * 0.45))]);
    x.fillStyle = col; x.beginPath(); x.moveTo(-2, h); x.lineTo(-2, h * taban);
    for (let i = 0; i < T.length; i++) { const [px, py] = T[i], ox2 = i ? T[i - 1][0] : -w * 0.1; x.lineTo((ox2 + px) / 2, h * taban - (h * taban - py) * 0.3); x.lineTo(px, py); }
    x.lineTo(w + 2, h * taban); x.lineTo(w + 2, h); x.fill();
    x.fillStyle = kar; for (const [px, py] of T) { const kh = (h * taban - py) * 0.35, kw = kh * 0.8; x.beginPath(); x.moveTo(px, py); x.lineTo(px + kw, py + kh); x.quadraticCurveTo(px + kw * 0.3, py + kh * 0.7, px, py + kh * 1.05); x.quadraticCurveTo(px - kw * 0.3, py + kh * 0.7, px - kw, py + kh); x.closePath(); x.fill(); }
  };
  dag(0.62, 0.24, 5, '#6a6cae', '#d9def8', 3);
  dag(0.66, 0.13, 7, '#565a9c', '#c4cbef', 8);
  // uzak orman (küçük karlı çamlar), karlı tepeler
  const tepe = (y0, amp, col, sd) => { const q = rng(sd); x.fillStyle = col; x.beginPath(); x.moveTo(-2, h); for (let i = 0; i <= 24; i++) x.lineTo(i / 24 * w, h * y0 + Math.sin(i * 0.7 + q() * 0.6 + sd) * s * amp); x.lineTo(w + 2, h); x.fill(); };
  tepe(0.67, 0.012, '#a7afe0', 4);
  { const q = rng(12); for (let px = -s * 0.02; px < w + s * 0.03; px += s * (0.03 + q() * 0.03)) sh7Cam(x, px, h * (0.675 + q() * 0.02), s * (0.06 + q() * 0.05), '#3d4683', '#b8c2ee'); }
  sh7Kulube(x, O.kl.x, O.kl.y, O.kl.u);
  tepe(0.72, 0.016, '#c9d2f2', 6);
  { const q = rng(19); for (let px = -s * 0.01; px < w + s * 0.05; px += s * (0.07 + q() * 0.08)) { const bx = px + q() * s * 0.02; if (Math.abs(bx - O.gy.x) < s * 0.1 || Math.abs(bx - O.kl.x) < s * 0.07) continue; sh7Cam(x, bx, h * (0.735 + q() * 0.03), s * (0.13 + q() * 0.09), '#26315f', '#eef3ff'); } }
  // ön kar: yumuşak tümsekler, mavi gölgeler, parlak üst kenar
  gr = x.createLinearGradient(0, h * 0.78, 0, h); gr.addColorStop(0, '#eef3ff'); gr.addColorStop(1, '#b4c0e8'); x.fillStyle = gr;
  x.beginPath(); x.moveTo(-2, h); x.lineTo(-2, h * 0.82);
  x.bezierCurveTo(w * 0.2, h * 0.76, w * 0.35, h * 0.83, w * 0.5, h * 0.81); x.bezierCurveTo(w * 0.68, h * 0.78, w * 0.85, h * 0.84, w + 2, h * 0.8); x.lineTo(w + 2, h); x.fill();
  x.fillStyle = 'rgba(120,135,200,0.25)'; x.beginPath(); x.ellipse(w * 0.22, h * 0.93, s * 0.22, s * 0.035, 0.05, 0, Math.PI * 2); x.ellipse(w * 0.82, h * 0.95, s * 0.18, s * 0.03, -0.05, 0, Math.PI * 2); x.fill();
  // geyiğin karda bıraktığı küçük ayak izleri
  x.fillStyle = 'rgba(130,145,205,0.45)';
  for (let i = 0; i < 6; i++) { const px = O.gy.x - O.gy.u * (0.9 + i * 0.42), py = O.gy.y - O.gy.u * (0.02 + i * 0.07) + (i % 2) * O.gy.u * 0.06; x.beginPath(); x.ellipse(px, py, O.gy.u * 0.05, O.gy.u * 0.025, 0, 0, Math.PI * 2); x.fill(); }
  sh7Kardan(x, O.kd.x, O.kd.y, O.kd.u);
  sh7Geyik(x, O.gy.x, O.gy.y, O.gy.u);
}
function sh7Canli(ox, oy, w, h, tm, a, hov) {
  if (a <= 0.01) return;
  hov = hov || 0;
  const O = sh7Olcu(w, h), s = O.s, hz = 1 + 0.35 * hov;
  g.save();
  // 1) kuzey ışığı perdeleri: dikey ışık şeritleri, alt kenarları dalga dalga kıvrılır, boyları nefes alır
  g.globalCompositeOperation = 'lighter';
  const N = Math.round(clamp(w / 6, 30, 160)), sw = w / N;
  for (let j = 0; j < O.perde.length; j++) {
    const [ty, hy, eg, col, fz] = O.perde[j], spr = sh7PerdeSpr(col);
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N, env = Math.pow(Math.sin(u * Math.PI), 0.8);
      const by = oy + h * (ty + (u - 0.5) * eg) + Math.sin(u * 5.2 + tm * 0.42 * hz + fz) * s * 0.045 + Math.sin(u * 12 - tm * 0.75 * hz + fz * 2) * s * 0.012;
      const hh = h * hy * (0.6 + 0.4 * Math.sin(u * 7.3 + tm * 0.55 * hz + fz));
      g.globalAlpha = Math.min(1, a * env * (0.68 + 0.27 * Math.sin(u * 9.5 - tm * 1.05 * hz + fz * 3) + 0.15 * Math.sin(u * 23 + tm * 0.6 + fz)));
      g.drawImage(spr, 1, 0, 2, 128, ox + i * sw, by - hh, sw, hh);   // şeridin yalnız ortası (kenar yumuşaması dikiş çizgisi yapmasın), üst üste binmeden
    }
  }
  // 2) geyiğin boynuz kristalleri: renk renk yanıp söner (kuzey ışığı renkleri)
  const G = O.gy;
  for (let i = 0; i < SH7_UC.length; i++) {
    const [ux, uy] = SH7_UC[i], px = ox + G.x + ux * G.u, py = oy + G.y + uy * G.u, tw = 0.55 + 0.45 * Math.sin(tm * 2.1 * hz + i * 1.6);
    dglow(SH7_RENK[(i + Math.floor(tm * 0.5)) % 3], px, py, G.u * 0.28, a * 0.75 * tw);
    if (i % 2 === 0) shParilti(px, py, G.u * 0.12 * (0.6 + 0.4 * tw), a * tw * 0.9);
  }
  // 3) kulübenin sıcak penceresi titreşir, bacadan ince duman süzülür
  const K = O.kl, kx = ox + K.x, ky = oy + K.y;
  dglow('#ffcf86', kx - K.u * 0.34, ky - K.u * 0.47, K.u * (1 + 0.08 * Math.sin(tm * 3.1)), a * 0.45);
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 4; i++) {
    const u = (tm * 0.12 * hz + i / 4) % 1, px = kx + K.u * (0.48 + u * 0.9 + Math.sin(tm + i * 2) * 0.12), py = ky - K.u * (1.65 + u * 2.4);
    g.globalAlpha = a * 0.28 * Math.sin(u * Math.PI); g.fillStyle = '#dfe2fa'; g.beginPath(); g.arc(px, py, K.u * (0.12 + u * 0.3), 0, Math.PI * 2); g.fill();
  }
  // 4) karda parıltılar
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) { const tw = Math.max(0, Math.sin(tm * 1.3 * hz + i * 2.4)); shParilti(ox + w * (0.12 + i * 0.19), oy + h * (0.84 + (i % 3) * 0.045), s * 0.016 * tw, a * tw * 0.8); }
  // 5) yağan kar: uzakta küçük ve yavaş, önde iri ve biraz hızlı; rüzgârla hafifçe salınır
  g.globalCompositeOperation = 'source-over';
  const n = Math.round(clamp(w * h / (s * s), 1, 2.2) * 40);
  for (let pas = 0; pas < 2; pas++) {
    g.fillStyle = pas ? '#ffffff' : '#dfe8ff'; g.globalAlpha = a * (pas ? 0.85 : 0.55); g.beginPath();
    for (let i = pas; i < n; i += 2) {
      const r1 = sh7Hs(i * 3 + 1), r2 = sh7Hs(i * 3 + 2), r3 = sh7Hs(i * 3 + 3), hiz = (pas ? 0.07 : 0.038) * (0.7 + 0.6 * r3) * hz;
      const yy = (r2 + tm * hiz) % 1, xx = ((r1 + Math.sin(tm * (0.5 + r3 * 0.6) + i) * 0.018 + tm * 0.005) % 1 + 1) % 1;
      const rr = Math.max(0.6, s * (pas ? 0.0055 + 0.0045 * r3 : 0.0025 + 0.0018 * r3)), px = ox + xx * w, py = oy + yy * h * 1.04 - h * 0.02;
      g.moveTo(px + rr, py); g.arc(px, py, rr, 0, Math.PI * 2);
    }
    g.fill();
  }
  g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
// uyku → rüya geçişinin ön planı: üst köşelerden sarkan karlı çam dalları, alt köşelerde kar yığınları (paralaksla kayar)
function sh7OnPlan() {
  const c = shTuval(), x = c.getContext('2d'), s = Math.min(W, H), r = rng(17);
  x.lineCap = 'round'; x.lineJoin = 'round';
  // alt köşelerde kabarık kar yığınları (yarı saydam, mavi gölgeli)
  for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
    const px = sd < 0 ? W * (0.0 + i * 0.055) : W * (1 - i * 0.055), rr = s * (0.06 + r() * 0.05), py = H * (1.0 - (i % 2) * 0.02);
    x.fillStyle = 'rgba(150,165,220,0.75)'; x.beginPath(); x.ellipse(px, py, rr * 1.35, rr, 0, Math.PI, 0); x.fill();
    x.fillStyle = 'rgba(236,242,255,0.85)'; x.beginPath(); x.ellipse(px - rr * 0.12, py - rr * 0.06, rr * 1.15, rr * 0.86, 0, Math.PI, 0); x.fill();
  }
  // karlı dal: köşeden içeri uzanan koyu sap, iki yana iğne yaprak tutamları, üstünde kalın kar
  const dal = (x0, y0, x1, y1, kal) => {
    const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux;
    x.strokeStyle = '#1e2448'; x.lineWidth = kal; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
    x.strokeStyle = '#243063'; x.lineWidth = Math.max(1, kal * 0.28);
    for (let k = 0; k < 26; k++) { const u = k / 26, px = x0 + (x1 - x0) * u, py = y0 + (y1 - y0) * u, ll = kal * (3.2 - u * 1.6);
      for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(px, py); x.lineTo(px + (nx * sd * 0.8 + ux * 0.6) * ll, py + (ny * sd * 0.8 + uy * 0.6) * ll); x.stroke(); } }
    x.fillStyle = '#f2f6ff'; x.beginPath();   // dalın üstündeki kar (aşağı bakan yüzü açık mavi)
    for (let k = 0; k <= 8; k++) { const u = k / 8, px = x0 + (x1 - x0) * u, py = y0 + (y1 - y0) * u - kal * (1.2 + 0.6 * Math.sin(k * 1.7)); const rr = kal * (1.9 - u * 0.9); x.moveTo(px + rr, py); x.ellipse(px, py, rr, rr * 0.7, 0, 0, Math.PI * 2); }
    x.fill();
    x.fillStyle = 'rgba(170,190,240,0.6)'; x.beginPath();
    for (let k = 0; k <= 8; k++) { const u = k / 8, px = x0 + (x1 - x0) * u, py = y0 + (y1 - y0) * u - kal * 0.6; const rr = kal * (1.4 - u * 0.7); x.moveTo(px + rr, py); x.ellipse(px, py, rr, rr * 0.35, 0, 0, Math.PI); }
    x.fill();
  };
  const k = Math.max(3, s * 0.012);
  dal(-W * 0.02, H * 0.05, W * 0.2, H * 0.13, k); dal(-W * 0.02, H * 0.2, W * 0.1, H * 0.24, k * 0.8);
  dal(W * 1.02, H * 0.03, W * 0.8, H * 0.1, k); dal(W * 1.02, H * 0.17, W * 0.9, H * 0.22, k * 0.8);
  return c;
}
// ön planda süzülen iri, yumuşak kar taneleri (ekran pikseli; derinlik için biraz bulanık hale)
function sh7OnKar(tm, a) {
  if (a <= 0.01) return;
  const s = Math.min(W, H);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 16; i++) {
    const r1 = sh7Hs(i * 5 + 91), r2 = sh7Hs(i * 5 + 92), r3 = sh7Hs(i * 5 + 93), yy = (r2 + tm * (0.05 + 0.03 * r3)) % 1;
    const px = (r1 + Math.sin(tm * 0.4 + i * 1.3) * 0.025) * W, py = yy * H * 1.1 - H * 0.05, rr = s * (0.008 + 0.008 * r3);
    dglow('#ffffff', px, py, rr * 2.6, a * 0.35);
    g.globalAlpha = a * 0.8; g.fillStyle = '#f6f9ff'; g.beginPath(); g.arc(px, py, rr, 0, Math.PI * 2); g.fill();
  }
  g.restore(); g.globalAlpha = 1;
}
SH_ONBELLEK.push('kar', 'onPlanK');
SH_KUR.kar = () => { const A = { c: shTuval(), W, H, adim: [] }; A.adim.push(() => sh7Fon(A.c.getContext('2d'), W, H)); return A; };
SH_KUR.onPlanK = () => { const A = { c: null, W, H, adim: [() => { A.c = sh7OnPlan(); }] }; return A; };
// Bölüm 7 sabahı: pencereden karlı dağlar ve çamlar, gökte sönmekte olan son kuzey ışığı, ince ince yağan kar;
// pencere pervazında kabarık kar. Yatağın üstünde yedi rüyanın yedi hatıra ışığı döner (sh6Hatira). a: 0..1 beliriş
function sh7Sabah(tm, a) {
  if (a <= 0.01) return;
  shOdaT(); g.save(); shPencereYol(g, 0); g.clip(); g.globalAlpha = a;
  // karlı sabahın serin göğü (ufukta leylak-pembe) ve üstünde sönmekte olan son kuzey ışığı perdeleri
  const gk = g.createLinearGradient(0, SH_PEN.ust, 0, 46); gk.addColorStop(0, '#9ec4ef'); gk.addColorStop(0.55, '#c9d6f4'); gk.addColorStop(1, '#f1d9ea');
  g.globalAlpha = a * 0.9; g.fillStyle = gk; g.fillRect(SH_PEN.x0 - 1, SH_PEN.ust - 1, SH_PEN.x1 - SH_PEN.x0 + 2, 47 - SH_PEN.ust);
  for (let j = 0; j < 2; j++) {
    const spr = sh7PerdeSpr(j ? '#e87fcf' : '#3fd99a');
    for (let i = 0; i < 26; i++) {
      const u = (i + 0.5) / 26, px = 14 + u * 26, by = 29 + j * 4 + Math.sin(u * 5 + tm * 0.35 + j * 2) * 1.6 - u * 4, hh = 9 * (0.6 + 0.4 * Math.sin(u * 7 + tm * 0.5 + j));
      g.globalAlpha = a * (0.42 + 0.12 * Math.sin(tm * 0.7 + j)) * Math.sin(u * Math.PI); g.drawImage(spr, 1, 0, 2, 128, px - 0.5, by - hh, 1, hh);
    }
  }
  g.globalAlpha = a;
  // karlı dağlar ve tepeler
  g.fillStyle = '#c8cfe8'; g.beginPath(); g.moveTo(13, 46); g.lineTo(19, 37.5); g.lineTo(23, 41); g.lineTo(29, 35); g.lineTo(35, 40.5); g.lineTo(38, 38); g.lineTo(42, 44); g.lineTo(42, 51); g.lineTo(13, 51); g.fill();
  g.fillStyle = '#f6f8ff'; for (const [px, py] of [[19, 37.5], [29, 35], [38, 38]]) { g.beginPath(); g.moveTo(px, py); g.lineTo(px + 1.8, py + 1.9); g.lineTo(px + 0.5, py + 1.5); g.lineTo(px - 0.4, py + 2.1); g.lineTo(px - 1.7, py + 1.8); g.closePath(); g.fill(); }
  g.fillStyle = '#eef2ff'; g.beginPath(); g.moveTo(13, 51); g.lineTo(13, 46.5); g.quadraticCurveTo(22, 44, 30, 46.2); g.quadraticCurveTo(36, 47.4, 42, 45.5); g.lineTo(42, 51); g.fill();
  for (const [px, py, hh] of [[19.6, 46.7, 5.6], [21.9, 46.3, 3.9], [32.6, 46.6, 4.4], [35, 46.4, 6.2]]) sh7Cam(g, px, py, hh, '#55639a', '#ffffff');
  // ince ince yağan kar
  g.fillStyle = '#ffffff'; g.globalAlpha = a * 0.85; g.beginPath();
  for (let i = 0; i < 16; i++) { const yy = (sh7Hs(i + 40) + tm * (0.03 + 0.02 * sh7Hs(i + 60))) % 1, px = 14 + sh7Hs(i + 20) * 26 + Math.sin(tm * 0.6 + i) * 0.5, py = 12 + yy * 38, rr = 0.14 + 0.12 * sh7Hs(i + 80); g.moveTo(px + rr, py); g.arc(px, py, rr, 0, Math.PI * 2); }
  g.fill();
  g.restore();
  // pencere kayıtları göğün önünde kalsın
  g.globalAlpha = a; g.fillStyle = SH_SABAH.frame; const cxw = (SH_PEN.x0 + SH_PEN.x1) / 2;
  g.fillRect(cxw - 0.6, SH_PEN.ust, 1.2, SH_PEN.alt - SH_PEN.ust); g.fillRect(SH_PEN.x0, 31, SH_PEN.x1 - SH_PEN.x0, 1.2);
  // pencere önünde (denizlik) kabarık kar
  g.fillStyle = '#b4c2ea'; g.beginPath(); g.moveTo(11.3, 50.9); for (let i = 1; i <= 10; i++) { const px = 11.3 + i * 3.14; g.quadraticCurveTo(px - 1.57, 48.5 - (i % 3) * 0.35, px, 49.6 + (i === 10 ? 1.2 : 0)); } g.closePath(); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(11.6, 50.5); for (let i = 1; i <= 10; i++) { const px = 11.6 + i * 3.08; g.quadraticCurveTo(px - 1.54, 48.2 - (i % 3) * 0.35, px, 49.3 + (i === 10 ? 1.1 : 0)); } g.closePath(); g.fill();
  g.fillStyle = '#dfe7ff'; g.beginPath(); g.ellipse(27, 50.45, 15.6, 0.35, 0, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  const k = sh.k0 * sh.zoom; for (let i = 0; i < 3; i++) { const tw = Math.max(0, Math.sin(tm * 1.4 + i * 2.2)); shParilti(shEkranX(17 + i * 9), shEkranY(49.4), k * 0.7 * tw, a * tw * 0.8); }
  g.globalCompositeOperation = 'source-over';
}
// ── Bölüm 7 odası: kâğıt kar tanesi süsü (Bölüm 8'in yarasa ipiyle aynı yer), camda yapışkan kâğıt kar taneleri;
// sabah komodinde rüyadan kalan minik kar küresi (içinde karlı çam ve yavru geyik) ve ışıldayan buz kristali
// kâğıt kar tanesi ((0,0) merkez, r kol boyu): altı kol, her kolda iki küçük dal, ortada yuvarlak
function sh7KagitKar(r, col, kenar) {
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const c = Math.cos(k * Math.PI / 3), s = Math.sin(k * Math.PI / 3);
    g.moveTo(0, 0); g.lineTo(c * r, s * r);
    const bx = c * r * 0.55, by = s * r * 0.55;
    for (const sd of [-1, 1]) { const a2 = k * Math.PI / 3 + sd * 0.75; g.moveTo(bx, by); g.lineTo(bx + Math.cos(a2) * r * 0.32, by + Math.sin(a2) * r * 0.32); }
  }
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = kenar; g.lineWidth = r * 0.34; g.stroke();
  g.strokeStyle = col; g.lineWidth = r * 0.2; g.stroke();
  g.fillStyle = col; g.beginPath(); g.arc(0, 0, r * 0.24, 0, 6.283); g.fill();
}
// a saydamlık (oda eridikçe söner), uyu 0..1 (Feza uyudukça ortadaki kar tanesi usulca döner ve ışıldar)
function sh7Oda(p, tm, a, uyu) {
  if (a <= 0.01) return;
  const gece = p.sky === 'gece';
  shOdaT(); g.globalAlpha = a;
  // camda yapışkan kâğıt kar taneleri (gece ay ışığında buz mavisi, sabah bembeyaz)
  const cam = gece ? '#b9cdf6' : '#ffffff', camK = gece ? 'rgba(60,80,150,0.45)' : 'rgba(140,170,220,0.55)';
  for (const [cx, cy, cr, ca] of [[18.6, 16.8, 1.7, 0.2], [36.2, 42.4, 1.5, 0.5], [21.6, 44.8, 1.05, 0.1]]) { g.save(); g.translate(cx, cy); g.rotate(ca); sh7KagitKar(cr, cam, camK); g.restore(); }
  // ipte sallanan kâğıt kar taneleri (kuzey ışığı renklerinde: buz mavisi, nane, lila)
  const Su = SH8_SUS, ip = gece ? 'rgba(150,170,230,0.7)' : 'rgba(170,120,80,0.7)';
  g.strokeStyle = ip; g.lineWidth = 0.16; g.beginPath();
  for (let i = 0; i <= 24; i++) { const u = i / 24, px = lerp(Su.x0, Su.x1, u), py = lerp(Su.y0, Su.y1, u) + Math.sin(u * Math.PI) * Su.sark; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
  g.stroke();
  g.fillStyle = gece ? '#8fa6dc' : '#9fd0ff'; g.beginPath(); g.arc(Su.x0, Su.y0, 0.42, 0, 6.283); g.arc(Su.x1, Su.y1, 0.42, 0, 6.283); g.fill();   // raptiyeler
  const renk = gece ? ['#c9dcff', '#a8e8cf', '#d6c4ff'] : ['#ffffff', '#c8f2e0', '#e6dcff'], kenar = gece ? 'rgba(30,40,90,0.55)' : 'rgba(100,130,190,0.45)';
  for (let i = 0; i < Su.n; i++) {
    const u = (i + 0.5) / Su.n, px = lerp(Su.x0, Su.x1, u), py = lerp(Su.y0, Su.y1, u) + Math.sin(u * Math.PI) * Su.sark;
    const sal = Math.sin(tm * (gece ? 1.0 : 0.7) + i * 0.9) * 0.1 + Math.sin(tm * 0.37 + i * 2.1) * 0.05, r = 1.25 + (i % 3 === 1 ? 0.25 : 0), L = 0.8 + (i % 2) * 0.6;
    const ox = px + Math.sin(sal) * (L + r), oy = py + Math.cos(sal) * (L + r), don = i === 5 ? tm * 0.6 * uyu : 0;
    g.strokeStyle = ip; g.lineWidth = 0.1; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.sin(sal) * L, py + Math.cos(sal) * L); g.stroke();
    g.save(); g.translate(ox, oy); g.rotate(-sal * 1.5 + i * 0.4 + don); sh7KagitKar(r, renk[i % 3], kenar); g.restore();
    if (i === 5 && uyu > 0.05) {   // rüya başlıyor: ortadaki kar tanesi döner, çevresinde kuzey ışığı renginde ışıltılar
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
      const k = sh.k0 * sh.zoom, bx = shEkranX(ox), by = shEkranY(oy);
      dglow('#9ff0d0', bx, by, k * r * 2.6, a * 0.32 * uyu);
      for (let j = 0; j < 3; j++) { const an = tm * 1.3 + j * 2.1, tw = Math.pow(Math.max(0, Math.sin(tm * 3 + j * 2)), 2); shParilti(bx + Math.cos(an) * k * r * 1.6, by + Math.sin(an) * k * r * 1.3, k * 0.7 * tw, a * uyu * tw); }
      g.globalCompositeOperation = 'source-over'; shOdaT(); g.globalAlpha = a;
    }
  }
  g.globalAlpha = 1;
}
// sabah komodinde (dar ekranda yatağın üstündeki rafta): kar küresi ve buz kristali. uyan: Feza uyanınca kürede kar savrulur
function sh7Hediye(tm, a, uyan) {
  if (a <= 0.01) return;
  const kom = -(W / 2 + (sh.oxp || 0)) / sh.k0 < -57.5;
  const cs = kom ? 1.3 : 1, kx = kom ? -55.2 : -40.2, ky = kom ? SH_KOMODIN.ust - 0.55 : 38, bx = kom ? -63.0 : -27.8, by = kom ? SH_KOMODIN.ust - 0.55 : 38;
  const k = sh.k0 * sh.zoom, R = 1.55 * cs, cy = ky - 0.75 * cs - R * 0.92, ii = uyan > 0 && uyan < 1 ? Math.sin(uyan * Math.PI) : 0;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  dglow('#bfe4ff', shEkranX(kx), shEkranY(cy), k * R * (2.6 + ii), a * (0.3 + 0.05 * Math.sin(tm * 1.4) + 0.25 * ii));
  dglow('#9ff0d0', shEkranX(bx), shEkranY(by - 1.1 * cs), k * 2.4 * cs, a * (0.3 + 0.08 * Math.sin(tm * 1.7)));
  g.globalCompositeOperation = 'source-over';
  shOdaT(); g.globalAlpha = a; g.lineJoin = 'round'; g.lineCap = 'round';
  // buz kristali: üç altıgen uçlu sütun, buz mavisi ve nane
  g.save(); g.translate(bx, by); g.scale(cs, cs);
  g.fillStyle = 'rgba(90,110,160,0.22)'; g.beginPath(); g.ellipse(0, 0.05, 1.1, 0.16, 0, 0, 6.283); g.fill();
  for (const [ox, h, w, an, c1, c2] of [[-0.45, 1.5, 0.5, -0.32, '#a8d8ff', '#e6f4ff'], [0.42, 1.25, 0.46, 0.3, '#a8f0d4', '#eafff6'], [0, 2.1, 0.6, 0, '#bcd8ff', '#f4f9ff']]) {
    g.save(); g.translate(ox, 0); g.rotate(an);
    g.fillStyle = c1; g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-w / 2, -h + w * 0.5); g.lineTo(0, -h); g.lineTo(w / 2, -h + w * 0.5); g.lineTo(w / 2, 0); g.closePath(); g.fill();
    g.fillStyle = c2; g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-w / 2, -h + w * 0.5); g.lineTo(0, -h); g.lineTo(0, 0); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(110,140,200,0.55)'; g.lineWidth = 0.07; g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-w / 2, -h + w * 0.5); g.lineTo(0, -h); g.lineTo(w / 2, -h + w * 0.5); g.lineTo(w / 2, 0); g.stroke();
    g.restore();
  }
  g.restore();
  // kar küresi: tahta ayak, cam küre; içinde karlı tepe, minik çam ve yavru geyik, usul usul yağan kar
  g.fillStyle = 'rgba(90,70,60,0.25)'; g.beginPath(); g.ellipse(kx, ky + 0.05, R * 1.05, R * 0.14, 0, 0, 6.283); g.fill();
  g.fillStyle = '#b77a52'; g.beginPath(); g.moveTo(kx - R * 0.95, ky); g.lineTo(kx - R * 0.72, ky - 0.75 * cs); g.lineTo(kx + R * 0.72, ky - 0.75 * cs); g.lineTo(kx + R * 0.95, ky); g.closePath(); g.fill();
  g.fillStyle = '#d99b6c'; g.fillRect(kx - R * 0.8, ky - 0.62 * cs, R * 1.6, 0.18 * cs);
  g.save(); g.beginPath(); g.arc(kx, cy, R, 0, 6.283); g.clip();
  const gr = g.createLinearGradient(0, cy - R, 0, cy + R); gr.addColorStop(0, '#cfe8ff'); gr.addColorStop(1, '#eef6ff'); g.fillStyle = gr; g.fillRect(kx - R, cy - R, R * 2, R * 2);
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(kx, cy + R * 0.95, R * 1.1, R * 0.5, 0, 0, 6.283); g.fill();   // karlı tepe
  // minik çam
  const tx = kx - R * 0.38, ty = cy + R * 0.55;
  g.fillStyle = '#4f8a78'; for (let j = 0; j < 3; j++) { const w2 = R * (0.34 - j * 0.08), y2 = ty - j * R * 0.24; g.beginPath(); g.moveTo(tx - w2, y2); g.lineTo(tx, y2 - R * 0.36); g.lineTo(tx + w2, y2); g.closePath(); g.fill(); }
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(tx, ty - R * 0.8, R * 0.05, 0, 6.283); g.fill();
  // yavru geyik (yan duruş): kahve gövde, krem karın, minik boynuz
  const gx = kx + R * 0.28, gy = cy + R * 0.52, s2 = R * 0.2;
  g.strokeStyle = '#8a5a3c'; g.lineWidth = s2 * 0.32; g.beginPath(); for (const lx of [-0.7, -0.35, 0.45, 0.8]) { g.moveTo(gx + lx * s2, gy - s2 * 0.2); g.lineTo(gx + lx * s2, gy + s2 * 0.55); } g.stroke();
  g.fillStyle = '#a8704a'; g.beginPath(); g.ellipse(gx, gy - s2 * 0.35, s2 * 1.05, s2 * 0.55, 0, 0, 6.283); g.fill();
  g.beginPath(); g.ellipse(gx + s2 * 1.05, gy - s2 * 1.05, s2 * 0.5, s2 * 0.42, -0.3, 0, 6.283); g.fill();   // baş
  g.fillStyle = '#f3dcc0'; g.beginPath(); g.ellipse(gx, gy - s2 * 0.18, s2 * 0.7, s2 * 0.26, 0, 0, 6.283); g.fill();
  g.fillStyle = '#ff8f9a'; g.beginPath(); g.arc(gx + s2 * 1.5, gy - s2 * 1.0, s2 * 0.13, 0, 6.283); g.fill();   // burun
  g.strokeStyle = '#e8d2a8'; g.lineWidth = s2 * 0.18; g.beginPath(); g.moveTo(gx + s2 * 0.95, gy - s2 * 1.4); g.lineTo(gx + s2 * 0.8, gy - s2 * 1.95); g.lineTo(gx + s2 * 0.55, gy - s2 * 2.15); g.moveTo(gx + s2 * 0.83, gy - s2 * 1.8); g.lineTo(gx + s2 * 1.05, gy - s2 * 2.1); g.stroke();
  // kar: Feza uyanınca savrulur, sonra yine usul usul yağar
  g.fillStyle = '#ffffff'; g.beginPath();
  for (let i = 0; i < 9; i++) { const v = (sh7Hs(i + 200) + tm * (0.05 + 0.03 * sh7Hs(i + 220)) + ii * 0.4) % 1, px = kx + (sh7Hs(i + 210) - 0.5) * R * 1.6 + Math.sin(tm * 0.8 + i + ii * 6) * R * 0.12 * (1 + 3 * ii), py = cy - R * 0.9 + v * R * 1.6, rr = R * (0.035 + 0.025 * sh7Hs(i + 230)); g.moveTo(px + rr, py); g.arc(px, py, rr, 0, 6.283); }
  g.fill();
  g.restore();
  g.strokeStyle = 'rgba(150,180,230,0.6)'; g.lineWidth = 0.1 * cs; g.beginPath(); g.arc(kx, cy, R, 0, 6.283); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 0.16 * cs; g.beginPath(); g.arc(kx, cy, R * 0.78, Math.PI * 1.1, Math.PI * 1.45); g.stroke();   // camda parlaklık
  g.globalAlpha = 1;
  // rüya tozu ışıltıları
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) { const tw = Math.pow(Math.max(0, Math.sin(tm * 1.3 + i * 1.7)), 2), an = i * 1.9 + tm * 0.2, cx2 = i < 3 ? kx : bx, cy2 = i < 3 ? cy : by - 1.2 * cs; shParilti(shEkranX(cx2 + Math.cos(an) * R * 1.4), shEkranY(cy2 + Math.sin(an) * R * 1.1), k * (0.9 + 0.6 * ii) * tw, a * tw * 0.9); }
  g.globalCompositeOperation = 'source-over';
}
// Son sözün ilk cümlesi dünyadaki kuzey ışığı kutlamasında söylendiyse (CORE, Bölüm 6 gibi) sabah onu tekrar etmez
OLAY.on('konusma', e => {
  if (typeof BOLUM_NO === 'undefined' || BOLUM_NO !== 7 || !e || sh.mod) return;
  if (e.anahtar === sh7Harf('a_') + 'final1') sh.f6Ozet = 1;
});

// ══════════════════ BÖLÜM 8: BALKABAĞI GECESİ ══════════════════
// Seçim baloncuğu ve odadan rüyaya geçiş aynı resmi paylaşır: mor-lacivert Cadılar Bayramı gecesi, kocaman gülümseyen bal rengi
// ay, tepede eğri büğrü sevimli evler (pencerelerde sıcak ışık, aralarında bayrak süsleri), yerde parlayan pembe-mor sis, kabak
// tarlası; önde minik cadı şapkalı, gülen kocaman bir balkabağı ve yanında lila bir yarasa dost. Durağan kısım (sh8Fon) önbellekte;
// kabak yüzlerindeki sihirli ışık ve göz kırpma, pencerelerin titreşmesi, süzülen yarasalar, sis ve ışık tozları her karede (sh8Canli).
// İkisi aynı yerleşimi (sh8Yer) kullanır; resim w×h, nesneler kısa kenara (s) göre. Korkutucu hiçbir şey yok: her şey yuvarlak ve güler.
const SH8_RENK = ['#ffb347', '#c39bff', '#ff8fc8', '#7dffc4', '#ffd27a'];   // kabak turuncusu, lila, şeker pembesi, nane, fener ışığı
// ses harfi: CORE 'c' önerisini kullanmadıysa ses.js'teki yeni Bölüm 8 cümlelerinden bulunur (önek 'p_X_' / 'a_X_')
let sh8H = null;
function sh8Harf(on) {
  if (!sh8H) {
    try {
      const L = typeof SES !== 'undefined' && SES.LINES;
      if (L) { let h = 'c'; if (!L.p_c_uyku) for (const k in L) { const m = /^p_([a-z]+)_uyku$/.exec(k); if (m && 'y b i v f k'.split(' ').indexOf(m[1]) < 0 && m[1] !== sh7H) { h = m[1]; break; } } sh8H = h; }
    } catch (e) {}
  }
  return on + (sh8H || 'c') + '_';
}
// köy tepesinin sırtı (evler bunun üstüne oturur)
const sh8Tepe = (px, h, s) => h * 0.705 - Math.sin(px / s * 4.2 + 0.6) * s * 0.013 - Math.sin(px / s * 9.7 + 1.3) * s * 0.005;
// yerleşim: ölçü başına bir kez (balon nefes aldıkça boyu birkaç piksel oynar → küçük, sınırlı önbellek; karede ayırma yok)
const sh8YerB = new Map();
function sh8Yer(w, h) {
  const key = Math.round(w) * 8192 + Math.round(h);
  let O = sh8YerB.get(key);
  if (O) return O;
  const s = Math.min(w, h), r = rng(83), kare = w < h * 1.2;   // kare balonda kabak biraz daha büyük ve ortada (simge gibi okunsun)
  O = { s,
    ay: { x: w * (kare ? 0.63 : 0.69), y: h * (kare ? 0.265 : 0.255), r: s * (kare ? 0.135 : 0.15) },   // bal rengi ay (balonda biraz solda: altın yıldız rozeti yüzünü örtmesin)
    kb: { x: w * (kare ? 0.43 : 0.4), y: h * (kare ? 0.865 : 0.875), u: s * (kare ? 0.175 : 0.15) },   // şapkalı büyük kabak (taban ortası, yarım en)
    yr: { x: w * (kare ? 0.68 : 0.635), y: h * (kare ? 0.54 : 0.56), u: s * (kare ? 0.045 : 0.04) },  // yarasa dost (gövde ortası, gövde yarıçapı)
    // küçük kabaklar [x, taban y, yarım en, yüz (1 göz kırpan, 2 şaşkın-sevinçli, 3 mutlu uykulu)]
    kk: [[w * 0.135, h * 0.905, s * 0.062, 1], [w * 0.71, h * 0.885, s * 0.072, 2], [w * 0.9, h * 0.935, s * 0.05, 3], [w * 0.585, h * 0.805, s * 0.034, 3]],
    ev: [], ip: [] };
  // eğri büğrü evler: tepenin sırtı boyunca, büyük kabağın arkasında seyrek (ay ışığı ve şapka seçilsin)
  for (let px = -s * 0.03, i = 0; px < w + s * 0.06; i++) {
    const ew = s * (0.058 + r() * 0.03), eh = s * (0.042 + r() * 0.036), c = s * (0.045 + r() * 0.045), e = (r() - 0.5) * 0.36;
    const x0 = px + ew / 2, yb = sh8Tepe(x0, h, s) + s * 0.008, arka = Math.abs(x0 - O.kb.x) < O.kb.u * 0.9;
    if (!arka || r() < 0.4) {
      const E = { x: x0, y: yb, w: ew, h: eh, c, e, renk: i % 4, cati: r(), kivrim: r() < 0.5 ? -1 : 1, baca: r() < 0.45, pen: [] };
      const nk = r() < 0.5 ? 2 : 1;
      for (let k = 0; k < nk; k++) { const lx = nk === 1 ? (r() - 0.5) * ew * 0.2 : (k ? 0.22 : -0.22) * ew, ly = -eh * (0.5 + r() * 0.12); E.pen.push([x0 + lx - e * ly, yb + ly, Math.max(0.7, ew * 0.11), r() * 6]); }
      if (c > s * 0.07) E.pen.push([x0 - e * (-eh - c * 0.3), yb - eh - c * 0.3, Math.max(0.6, ew * 0.07), r() * 6]);   // çatı arası yuvarlak pencere
      O.ev.push(E);
    }
    px += ew + s * (0.035 + r() * 0.06);
  }
  // evlerin arasında sarkan bayrak süsleri (yakın komşu çatı saçakları arasında) [x0, y0, x1, y1, sarkma]
  for (let i = 0; i + 1 < O.ev.length; i++) {
    const A = O.ev[i], B = O.ev[i + 1], x0 = A.x + A.w * 0.46 + A.e * A.h, x1 = B.x - B.w * 0.46 + B.e * B.h;
    if (x1 - x0 > s * 0.02 && x1 - x0 < s * 0.16 && (i % 2 === 0)) O.ip.push([x0, A.y - A.h, x1, B.y - B.h, s * 0.018]);
  }
  if (sh8YerB.size > 12) sh8YerB.delete(sh8YerB.keys().next().value);
  sh8YerB.set(key, O);
  return O;
}
const sh8IpNokta = (q, u, R) => { R[0] = lerp(q[0], q[2], u); R[1] = lerp(q[1], q[3], u) + Math.sin(u * Math.PI) * q[4]; return R; };
const sh8Ip = [0, 0];   // yeniden kullanılır
// balkabağı gövdesi ((px,py) taban ortası, u yarım en): dilim dilim yuvarlak, kalın yumuşak kontur, üstten ışık; yüz canlı katmanda
// (x: herhangi bir bağlam; degradeler yalnız önbelleğe çizilirken). n: 3 ya da 5 dilim
function sh8KabakGovde(x, px, py, u, n, ton) {
  const L = n === 3 ? [[-0.45, 0.5, 0.7], [0.45, 0.5, 0.7], [0, 0.58, 0.76]] : [[-0.6, 0.42, 0.7], [0.6, 0.42, 0.7], [-0.31, 0.46, 0.75], [0.31, 0.46, 0.75], [0, 0.5, 0.78]];
  const cy = py - 0.74 * u;
  x.fillStyle = 'rgba(20,10,40,0.38)'; x.beginPath(); x.ellipse(px, py + u * 0.02, u * 1.02, u * 0.11, 0, 0, 6.283); x.fill();   // yerde gölge
  x.fillStyle = ton > 0.5 ? '#c0622a' : '#6e2f14'; x.beginPath();   // kontur
  for (const [lx, rx, ry] of L) { x.moveTo(px + lx * u + (rx + 0.06) * u, cy); x.ellipse(px + lx * u, cy, (rx + 0.06) * u, (ry + 0.05) * u, 0, 0, 6.283); }
  x.fill();
  for (const [lx, rx, ry] of L) {
    const gr = x.createRadialGradient(px + (lx - 0.15) * u, cy - 0.32 * u, u * 0.05, px + lx * u, cy, ry * u * 1.15);
    gr.addColorStop(0, ton > 0.5 ? '#ffd08a' : '#ffc46b'); gr.addColorStop(0.55, ton > 0.5 ? '#ffac5c' : '#ff9a3c'); gr.addColorStop(1, ton > 0.5 ? '#e5813e' : '#d4621f');
    x.fillStyle = gr; x.beginPath(); x.ellipse(px + lx * u, cy, rx * u, ry * u, 0, 0, 6.283); x.fill();
  }
  x.strokeStyle = ton > 0.5 ? 'rgba(190,95,40,0.5)' : 'rgba(150,60,20,0.45)'; x.lineWidth = Math.max(0.6, u * 0.035);   // dilim çizgileri
  for (const [lx, , ry] of L) if (lx) { x.beginPath(); x.moveTo(px + lx * u * 0.72, cy - ry * u * 0.86); x.quadraticCurveTo(px + lx * u * 0.9, cy, px + lx * u * 0.72, cy + ry * u * 0.86); x.stroke(); }
  x.fillStyle = 'rgba(255,240,205,0.55)'; x.beginPath(); x.ellipse(px - 0.34 * u, cy - 0.42 * u, 0.15 * u, 0.065 * u, -0.55, 0, 6.283); x.fill();   // parlak benek
  // sap ve kıvrık sarmaşık, bir yaprak
  x.lineCap = 'round'; x.strokeStyle = '#3e5a22'; x.lineWidth = u * 0.2; x.beginPath(); x.moveTo(px + u * 0.02, cy - 0.66 * u); x.quadraticCurveTo(px + u * 0.02, cy - 0.92 * u, px + u * 0.16, cy - 1.02 * u); x.stroke();
  x.strokeStyle = '#7a9a44'; x.lineWidth = u * 0.13; x.stroke();
  x.strokeStyle = '#6fbf5a'; x.lineWidth = Math.max(0.6, u * 0.035); x.beginPath(); x.moveTo(px + u * 0.08, cy - 0.74 * u);
  for (let i = 1; i <= 14; i++) { const a = i * 0.55, rr = u * (0.05 + i * 0.012); x.lineTo(px + u * 0.36 + Math.cos(a) * rr, cy - 0.84 * u + Math.sin(a) * rr); }
  x.stroke();
  x.fillStyle = '#6fbf5a'; x.beginPath(); x.moveTo(px - u * 0.04, cy - 0.72 * u); x.quadraticCurveTo(px - u * 0.32, cy - 1.02 * u, px - u * 0.54, cy - 0.86 * u); x.quadraticCurveTo(px - u * 0.3, cy - 0.66 * u, px - u * 0.04, cy - 0.72 * u); x.fill();
  x.strokeStyle = 'rgba(40,90,40,0.6)'; x.lineWidth = Math.max(0.5, u * 0.02); x.beginPath(); x.moveTo(px - u * 0.06, cy - 0.74 * u); x.quadraticCurveTo(px - u * 0.3, cy - 0.84 * u, px - u * 0.5, cy - 0.86 * u); x.stroke();
}
// minik cadı şapkası ((px,py) kenar ortası, u kabağın yarım eni, aci eğim): yıldızlı mor, ucu kıvrık, turuncu bantlı
function sh8Sapka(x, px, py, u, aci) {
  x.save(); x.translate(px, py); x.rotate(aci); x.scale(u, u); x.lineJoin = 'round'; x.lineCap = 'round';
  const koni = () => { x.beginPath(); x.moveTo(-0.34, -0.06); x.bezierCurveTo(-0.24, -0.5, -0.08, -0.84, 0.12, -0.94); x.quadraticCurveTo(0.32, -1.02, 0.44, -0.86); x.quadraticCurveTo(0.27, -0.87, 0.17, -0.72); x.bezierCurveTo(0.24, -0.45, 0.3, -0.2, 0.34, -0.06); x.closePath(); };
  x.fillStyle = '#2a1a52'; x.beginPath(); x.ellipse(0, -0.02, 0.68, 0.17, 0, 0, 6.283); x.fill();   // kontur
  x.lineWidth = 0.09; x.strokeStyle = '#2a1a52'; koni(); x.stroke();
  x.fillStyle = '#4b2f8f'; x.beginPath(); x.ellipse(0, -0.02, 0.62, 0.12, 0, 0, 6.283); x.fill();   // kenar
  x.fillStyle = '#6a46b4'; x.beginPath(); x.ellipse(0, -0.05, 0.6, 0.08, 0, Math.PI, 0); x.fill();
  const gr = x.createLinearGradient(-0.34, 0, 0.34, 0); gr.addColorStop(0, '#8a62d6'); gr.addColorStop(0.45, '#6a43b8'); gr.addColorStop(1, '#4e2f98');
  x.fillStyle = gr; koni(); x.fill();
  x.fillStyle = '#ffb347'; x.beginPath(); x.moveTo(-0.33, -0.08); x.quadraticCurveTo(0, -0.02, 0.33, -0.08); x.lineTo(0.31, -0.2); x.quadraticCurveTo(0, -0.14, -0.3, -0.2); x.closePath(); x.fill();   // bant
  x.fillStyle = '#ffe27a'; shYildiz5(x, 0.02, -0.14, 0.085); x.fill();   // bant yıldızı
  x.fillStyle = '#ffe7a8'; shYildiz5(x, -0.1, -0.42, 0.05); x.fill(); shYildiz5(x, 0.1, -0.6, 0.035); x.fill();   // şapkadaki minik yıldızlar
  x.strokeStyle = 'rgba(200,170,255,0.6)'; x.lineWidth = 0.035; x.beginPath(); x.moveTo(-0.24, -0.24); x.quadraticCurveTo(-0.16, -0.6, 0.02, -0.84); x.stroke();   // parlak kenar
  x.fillStyle = '#ffe27a'; shYildiz5(x, 0.45, -0.86, 0.07); x.fill();   // ucundaki yıldız
  x.restore();
}
// kabak yüzü (canlı; g üzerinde): (px,py) taban ortası, u yarım en. tip 0 büyük gülen, 1 göz kırpan, 2 şaşkın-sevinçli, 3 mutlu uykulu.
// İçindeki ışık alev değil, sihirli ışık: yumuşakça nefes alır. kirp 0..1 (1 kapalı)
function sh8Yuz(px, py, u, tip, kirp, isik, a) {
  if (a <= 0.01 || u < 0.6) return;
  const cy = py - 0.74 * u, gz = 1 - kirp;
  g.globalCompositeOperation = 'lighter';
  dglow('#ffb347', px, cy, u * 1.9, a * 0.3 * isik);
  dglow('#ffd27a', px, cy + u * 0.05, u * 0.9, a * 0.35 * isik);
  g.globalCompositeOperation = 'source-over';
  const goz = (ex, ey, rx, ry, acik) => {
    if (acik > 0.3) { g.moveTo(ex + rx, ey); g.ellipse(ex, ey, rx, ry * acik, 0, 0, 6.283); }
    else { g.moveTo(ex - rx, ey + ry * 0.1); g.quadraticCurveTo(ex, ey - ry * 1.05, ex + rx, ey + ry * 0.1); g.quadraticCurveTo(ex, ey - ry * 0.45, ex - rx, ey + ry * 0.1); }   // mutlu kapalı göz (^)
  };
  const yol = (dy) => {
    g.beginPath();
    if (tip === 0) {
      goz(px - 0.34 * u, cy - 0.17 * u + dy, 0.15 * u, 0.19 * u, gz); goz(px + 0.34 * u, cy - 0.17 * u + dy, 0.15 * u, 0.19 * u, gz);
      g.moveTo(px - 0.07 * u, cy + 0.06 * u + dy); g.lineTo(px + 0.07 * u, cy + 0.06 * u + dy); g.lineTo(px, cy - 0.04 * u + dy); g.closePath();   // burun
      g.moveTo(px - 0.5 * u, cy + 0.14 * u + dy); g.quadraticCurveTo(px, cy + 0.62 * u + dy, px + 0.5 * u, cy + 0.14 * u + dy); g.quadraticCurveTo(px, cy + 0.34 * u + dy, px - 0.5 * u, cy + 0.14 * u + dy);   // gülümseme
    } else {
      const sol = tip === 3 ? 0 : tip === 1 ? 0 : gz, sag = tip === 3 ? 0 : gz;
      goz(px - 0.3 * u, cy - 0.14 * u + dy, 0.13 * u, 0.16 * u, sol); goz(px + 0.3 * u, cy - 0.14 * u + dy, 0.13 * u, 0.16 * u, sag);
      if (tip === 2) { g.moveTo(px + 0.13 * u, cy + 0.26 * u + dy); g.ellipse(px, cy + 0.26 * u + dy, 0.13 * u, 0.15 * u, 0, 0, 6.283); }   // "o" ağız
      else { g.moveTo(px - 0.36 * u, cy + 0.16 * u + dy); g.quadraticCurveTo(px, cy + 0.5 * u + dy, px + 0.36 * u, cy + 0.16 * u + dy); g.quadraticCurveTo(px, cy + 0.3 * u + dy, px - 0.36 * u, cy + 0.16 * u + dy); }
    }
  };
  g.globalAlpha = a; g.fillStyle = '#7a3414'; yol(u * 0.035); g.fill();   // oyuğun gölgeli kenarı
  g.fillStyle = mixc('#ffb347', '#ffd27a', isik, 1); yol(0); g.fill();
  g.globalAlpha = a * (0.45 + 0.5 * isik); g.fillStyle = '#fff3c0'; g.save(); g.translate(px, cy + u * 0.02); g.scale(0.9, 0.86); g.translate(-px, -cy - u * 0.02); yol(0); g.fill(); g.restore();
  if (gz > 0.5) {   // gözlerde minik parıltı (canlı bakış)
    const ex = tip === 0 ? 0.34 : 0.3, ey = tip === 0 ? -0.17 : -0.14, er = (tip === 0 ? 0.05 : 0.04) * u * gz;
    g.globalAlpha = a * 0.85; g.fillStyle = '#ffffff'; g.beginPath();
    if (tip !== 1 && tip !== 3) { g.moveTo(px - ex * u - 0.04 * u + er, cy + ey * u - 0.06 * u); g.arc(px - ex * u - 0.04 * u, cy + ey * u - 0.06 * u, er, 0, 6.283); }
    if (tip !== 3) { g.moveTo(px + ex * u - 0.04 * u + er, cy + ey * u - 0.06 * u); g.arc(px + ex * u - 0.04 * u, cy + ey * u - 0.06 * u, er, 0, 6.283); }
    g.fill();
  }
  g.globalAlpha = 1;
}
// yarasa dost (canlı; g üzerinde): (px,py) gövde ortası, u gövde yarıçapı, k kanat çırpışı -1..1, goz 0..1 açıklık, yon ±1.
// Lila top gövde, iri parlak gözler, gülümseme, pembe yanak; sivri diş yok.
function sh8Yarasa(px, py, u, k, goz, yon, al) {
  if (al <= 0.01 || u < 1.2) return;
  g.save(); g.translate(px, py); g.scale(yon * u, u); g.globalAlpha = al; g.lineJoin = 'round'; g.lineCap = 'round';
  for (const sd of [-1, 1]) {   // kanatlar (omuzdan çırpar)
    g.save(); g.scale(sd, 1); g.translate(0.74, -0.08); g.rotate(-0.2 - k * 0.5); g.scale(1, 0.8 + 0.3 * k);
    g.fillStyle = '#7c5fcf'; g.beginPath(); g.moveTo(0, -0.14);
    g.quadraticCurveTo(0.7, -0.8, 1.6, -0.58); g.quadraticCurveTo(1.5, -0.12, 1.22, 0.12);
    g.quadraticCurveTo(1.06, -0.08, 0.84, 0.18); g.quadraticCurveTo(0.64, -0.02, 0.42, 0.24); g.quadraticCurveTo(0.2, 0.04, 0, 0.18); g.closePath(); g.fill();
    g.strokeStyle = '#a58cf0'; g.lineWidth = 0.07; g.beginPath(); g.moveTo(0.06, -0.06); g.quadraticCurveTo(0.62, -0.42, 1.22, 0.1); g.moveTo(0.06, 0); g.quadraticCurveTo(0.5, -0.12, 0.84, 0.16); g.stroke();
    g.restore();
  }
  g.fillStyle = '#a98ae8';   // kulaklar
  g.beginPath(); g.moveTo(-0.74, -0.46); g.quadraticCurveTo(-0.8, -1.12, -0.56, -1.3); g.quadraticCurveTo(-0.32, -0.96, -0.12, -0.86); g.closePath();
  g.moveTo(0.74, -0.46); g.quadraticCurveTo(0.8, -1.12, 0.56, -1.3); g.quadraticCurveTo(0.32, -0.96, 0.12, -0.86); g.closePath(); g.fill();
  g.fillStyle = '#ffb3dc'; g.beginPath(); g.moveTo(-0.6, -0.6); g.quadraticCurveTo(-0.62, -1.0, -0.52, -1.1); g.quadraticCurveTo(-0.38, -0.9, -0.28, -0.84); g.closePath();
  g.moveTo(0.6, -0.6); g.quadraticCurveTo(0.62, -1.0, 0.52, -1.1); g.quadraticCurveTo(0.38, -0.9, 0.28, -0.84); g.closePath(); g.fill();
  g.fillStyle = '#5a3f9e'; g.beginPath(); g.arc(0, 0, 1.06, 0, 6.283); g.fill();   // yumuşak kontur
  g.fillStyle = '#ab8cec'; g.beginPath(); g.arc(0, 0, 1, 0, 6.283); g.fill();
  g.fillStyle = '#c9b2ff'; g.beginPath(); g.arc(-0.22, -0.3, 0.62, 0, 6.283); g.fill();
  g.fillStyle = '#ab8cec'; g.beginPath(); g.arc(0.12, 0.12, 0.82, 0, 6.283); g.fill();
  g.fillStyle = '#dccdff'; g.beginPath(); g.ellipse(0, 0.36, 0.56, 0.46, 0, 0, 6.283); g.fill();   // açık karın
  const ac = Math.max(0.1, goz);
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(-0.37, -0.2, 0.27, 0.31 * ac, 0, 0, 6.283); g.ellipse(0.37, -0.2, 0.27, 0.31 * ac, 0, 0, 6.283); g.fill();
  if (goz > 0.35) {
    g.fillStyle = '#2a1f4e'; g.beginPath(); g.ellipse(-0.32, -0.16, 0.17, 0.2 * ac, 0, 0, 6.283); g.ellipse(0.42, -0.16, 0.17, 0.2 * ac, 0, 0, 6.283); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(-0.27, -0.24, 0.07, 0, 6.283); g.arc(0.47, -0.24, 0.07, 0, 6.283); g.fill();
  } else { g.strokeStyle = '#2a1f4e'; g.lineWidth = 0.08; g.beginPath(); g.moveTo(-0.6, -0.2); g.quadraticCurveTo(-0.37, -0.36, -0.14, -0.2); g.moveTo(0.14, -0.2); g.quadraticCurveTo(0.37, -0.36, 0.6, -0.2); g.stroke(); }
  g.fillStyle = 'rgba(255,130,190,0.6)'; g.beginPath(); g.ellipse(-0.62, 0.16, 0.14, 0.09, 0, 0, 6.283); g.ellipse(0.62, 0.16, 0.14, 0.09, 0, 0, 6.283); g.fill();
  g.strokeStyle = '#4a2f7a'; g.lineWidth = 0.09; g.beginPath(); g.arc(0, 0.16, 0.2, 0.4, Math.PI - 0.4); g.stroke();   // gülümseme
  g.restore(); g.globalAlpha = 1;
}
// eğri büğrü sevimli ev (önbelleğe): yana yatık duvar, ucu kıvrık sivri çatı, sıcak ışıklı pencereler, kemerli kapı
const SH8_DUVAR = ['#5a4396', '#4f3a88', '#634a9e', '#493884'], SH8_CATI = ['#2e2258', '#3c2366', '#5a2f6e', '#25365e'];
function sh8Ev(x, E, s) {
  const { x: bx, y: by, w: ew, h: eh, c, e } = E;
  x.save(); x.translate(bx, by); x.transform(1, 0, -e, 1, 0, 0); x.lineJoin = 'round'; x.lineCap = 'round';
  // pencere ışığının duvara ve çevreye yumuşak taşması
  for (const q of E.pen) { const gx = q[0] - bx + e * (q[1] - by), gy = q[1] - by, gr = x.createRadialGradient(gx, gy, 0, gx, gy, q[2] * 4.5); gr.addColorStop(0, 'rgba(255,200,110,0.35)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); x.fillStyle = gr; x.fillRect(gx - q[2] * 4.5, gy - q[2] * 4.5, q[2] * 9, q[2] * 9); }
  x.fillStyle = '#21183f'; x.beginPath(); x.moveTo(-ew * 0.53, 0.5); x.lineTo(-ew * 0.47, -eh - 0.5); x.lineTo(ew * 0.47, -eh - 0.5); x.lineTo(ew * 0.53, 0.5); x.closePath(); x.fill();   // kontur
  x.fillStyle = SH8_DUVAR[E.renk]; x.beginPath(); x.moveTo(-ew * 0.5, 0); x.lineTo(-ew * 0.45, -eh); x.lineTo(ew * 0.45, -eh); x.lineTo(ew * 0.5, 0); x.closePath(); x.fill();
  x.fillStyle = 'rgba(20,12,45,0.28)'; x.beginPath(); x.moveTo(ew * 0.12, 0); x.lineTo(ew * 0.1, -eh); x.lineTo(ew * 0.45, -eh); x.lineTo(ew * 0.5, 0); x.closePath(); x.fill();   // gölgeli yan
  if (E.baca) { x.fillStyle = '#2b2150'; x.fillRect(ew * 0.18, -eh - c * 0.72, ew * 0.13, c * 0.5); x.fillStyle = '#3a2d66'; x.fillRect(ew * 0.16, -eh - c * 0.75, ew * 0.17, ew * 0.05); }
  // çatı: iki kavisli kenar, ucu yana kıvrılır (cadı şapkası gibi)
  const kv = E.kivrim, tx = kv * ew * 0.16, ty = -eh - c;
  const cati = () => { x.beginPath(); x.moveTo(-ew * 0.62, -eh + 0.3); x.quadraticCurveTo(-ew * 0.22, -eh - c * 0.28, tx * 0.4, ty + c * 0.08); x.quadraticCurveTo(tx * 1.2, ty - c * 0.08, tx * 2.1, ty + c * 0.14); x.quadraticCurveTo(tx * 1.1, ty + c * 0.16, tx * 0.7, ty + c * 0.3); x.quadraticCurveTo(ew * 0.24, -eh - c * 0.25, ew * 0.62, -eh + 0.3); x.quadraticCurveTo(0, -eh + s * 0.006, -ew * 0.62, -eh + 0.3); x.closePath(); };
  x.lineWidth = Math.max(1, s * 0.005); x.strokeStyle = '#1a1238'; cati(); x.stroke();
  x.fillStyle = SH8_CATI[(E.renk + 1) % 4]; cati(); x.fill();
  x.fillStyle = 'rgba(190,160,255,0.16)'; x.beginPath(); x.moveTo(-ew * 0.58, -eh + 0.2); x.quadraticCurveTo(-ew * 0.22, -eh - c * 0.3, tx * 0.4, ty + c * 0.1); x.quadraticCurveTo(-ew * 0.1, -eh - c * 0.3, -ew * 0.3, -eh); x.closePath(); x.fill();   // ay ışığı alan yüzü
  x.fillStyle = '#ffe27a'; shYildiz5(x, tx * 2.1, ty + c * 0.14, Math.max(0.8, ew * 0.07)); x.fill();   // çatı ucunda minik yıldız
  // pencereler (kemerli, sıcak ışık, haç kayıtlı) ve kapı
  for (const q of E.pen) {
    const gx = q[0] - bx + e * (q[1] - by), gy = q[1] - by, pr = q[2];
    x.fillStyle = '#2a1f4e'; x.beginPath(); x.arc(gx, gy, pr * 1.35, 0, 6.283); x.fill();
    x.fillStyle = '#ffd27a'; x.beginPath(); x.arc(gx, gy, pr, 0, 6.283); x.fill();
    x.fillStyle = '#fff2c0'; x.beginPath(); x.arc(gx - pr * 0.25, gy - pr * 0.25, pr * 0.45, 0, 6.283); x.fill();
    x.strokeStyle = '#6a3f3a'; x.lineWidth = Math.max(0.5, pr * 0.2); x.beginPath(); x.moveTo(gx - pr, gy); x.lineTo(gx + pr, gy); x.moveTo(gx, gy - pr); x.lineTo(gx, gy + pr); x.stroke();
  }
  if (eh > s * 0.05) { const dw = ew * 0.16, dx = E.pen.length > 1 ? 0 : ew * 0.25; x.fillStyle = '#2c1f3e'; x.beginPath(); x.moveTo(dx - dw, 0); x.lineTo(dx - dw, -eh * 0.3); x.arc(dx, -eh * 0.3, dw, Math.PI, 0); x.lineTo(dx + dw, 0); x.fill(); x.fillStyle = '#ffb347'; x.beginPath(); x.arc(dx + dw * 0.45, -eh * 0.18, Math.max(0.5, dw * 0.14), 0, 6.283); x.fill(); }
  x.restore();
}
// kıvrık ağaç silueti (önbelleğe): eğik gövde, sarmal dallar, ucunda yuvarlak taç (lolipop ağacı)
function sh8Agac(x, px, py, hh, col, kv) {
  x.save(); x.translate(px, py); x.strokeStyle = col; x.fillStyle = col; x.lineCap = 'round';
  x.lineWidth = hh * 0.07; x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(hh * 0.12 * kv, -hh * 0.35, -hh * 0.1 * kv, -hh * 0.62, hh * 0.06 * kv, -hh * 0.82); x.stroke();
  x.lineWidth = hh * 0.035; x.beginPath(); x.moveTo(hh * 0.02 * kv, -hh * 0.5); x.quadraticCurveTo(hh * 0.25 * kv, -hh * 0.6, hh * 0.26 * kv, -hh * 0.72); x.arc(hh * 0.2 * kv, -hh * 0.72, hh * 0.06, 0, Math.PI * 1.5 * kv); x.stroke();
  x.beginPath(); x.arc(hh * 0.06 * kv, -hh * 0.9, hh * 0.15, 0, 6.283); x.fill();
  x.restore();
}
function sh8Fon(x, w, h) {
  const O = sh8Yer(w, h), s = O.s, r = rng(88), A = O.ay;
  // gök: tepede derin lacivert-mor, ufka doğru sıcak leylak (köyün ışıkları ufku pembeleştirir)
  let gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a1238'); gr.addColorStop(0.32, '#2a1f4e'); gr.addColorStop(0.52, '#3b2a6e'); gr.addColorStop(0.66, '#5a3a8a'); gr.addColorStop(0.74, '#8a4f98'); gr.addColorStop(1, '#3b2a6e');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  gr = x.createRadialGradient(w * 0.5, h * 0.72, 0, w * 0.5, h * 0.72, s * 0.75); gr.addColorStop(0, 'rgba(255,150,130,0.26)'); gr.addColorStop(1, 'rgba(255,140,170,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
  // yıldızlar
  x.fillStyle = '#fff2dc';
  for (let i = 0; i < 56; i++) { const px = r() * w, py = r() * h * 0.6; if (Math.hypot(px - A.x, py - A.y) < A.r * 1.3) continue; x.globalAlpha = 0.25 + r() * 0.6; x.beginPath(); x.arc(px, py, Math.max(0.6, s * (0.0018 + r() * 0.003)), 0, 6.283); x.fill(); }
  x.globalAlpha = 0.85; for (const [px, py, pr] of [[0.12, 0.14, 0.016], [0.3, 0.07, 0.012], [0.45, 0.3, 0.01], [0.92, 0.12, 0.014], [0.22, 0.42, 0.009]]) { shYildiz4(x, px * w, py * h, pr * s, 0.3); x.fill(); }
  x.globalAlpha = 1;
  // gökte yumuşak, yarı saydam lila bulut kümeleri (resme derinlik; üst kenarları ay ışığı alır)
  for (const [bx, by, br, sd] of [[0.16, 0.33, 0.11, 3], [0.42, 0.13, 0.08, 5], [0.93, 0.46, 0.1, 7], [0.3, 0.52, 0.07, 9]]) {
    const q = rng(sd), cx = bx * w, cy = by * h, R = br * s;
    const T = []; for (let i = 0; i < 6; i++) { const e = Math.sin(Math.PI * (i + 0.5) / 6); T.push([cx + (i - 2.5) * R * 0.5 + (q() - 0.5) * R * 0.25, R * (0.22 + 0.42 * e + q() * 0.12)]); }   // ortası kabarık
    x.fillStyle = 'rgba(120,92,190,0.16)'; x.beginPath();
    for (const [px, pr] of T) { x.moveTo(px + pr, cy - pr * 0.4); x.arc(px, cy - pr * 0.4, pr, 0, 6.283); }
    x.moveTo(cx - R * 1.2, cy - R * 0.2); x.lineTo(cx + R * 1.2, cy - R * 0.2); x.lineTo(cx + R * 1.45, cy); x.quadraticCurveTo(cx, cy + R * 0.22, cx - R * 1.45, cy); x.closePath(); x.fill();   // düz alt (yaylarla aynı yönde: delik kalmaz)
    x.fillStyle = 'rgba(225,200,255,0.08)'; x.beginPath();
    for (const [px, pr] of T) { x.moveTo(px + pr * 0.7, cy - pr * 0.7); x.arc(px - pr * 0.1, cy - pr * 0.7, pr * 0.7, 0, 6.283); }
    x.fill();
  }
  // kocaman bal rengi ay: geniş yumuşak hale, sıcak disk, hafif lekeler ve uykulu gülen bir yüz
  gr = x.createRadialGradient(A.x, A.y, A.r * 0.8, A.x, A.y, A.r * 3.6); gr.addColorStop(0, 'rgba(255,231,168,0.34)'); gr.addColorStop(0.45, 'rgba(255,214,160,0.12)'); gr.addColorStop(1, 'rgba(255,200,160,0)');
  x.fillStyle = gr; x.fillRect(A.x - A.r * 3.6, A.y - A.r * 3.6, A.r * 7.2, A.r * 7.2);
  gr = x.createRadialGradient(A.x - A.r * 0.3, A.y - A.r * 0.35, A.r * 0.1, A.x, A.y, A.r); gr.addColorStop(0, '#fff8de'); gr.addColorStop(0.6, '#ffe7a8'); gr.addColorStop(1, '#f6c46e');
  x.fillStyle = gr; x.beginPath(); x.arc(A.x, A.y, A.r, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(232,176,92,0.28)'; for (const [dx, dy, dr] of [[-0.42, -0.36, 0.16], [0.46, -0.12, 0.12], [0.3, 0.5, 0.1], [-0.55, 0.3, 0.08], [0.05, -0.62, 0.07]]) { x.beginPath(); x.arc(A.x + dx * A.r, A.y + dy * A.r, dr * A.r, 0, 6.283); x.fill(); }
  x.strokeStyle = '#c9893e'; x.lineWidth = Math.max(1, A.r * 0.045); x.lineCap = 'round';
  x.beginPath(); x.arc(A.x - A.r * 0.32, A.y - A.r * 0.02, A.r * 0.13, Math.PI * 1.15, Math.PI * 1.85); x.moveTo(A.x + A.r * 0.19, A.y - A.r * 0.06); x.arc(A.x + A.r * 0.32, A.y - A.r * 0.02, A.r * 0.13, Math.PI * 1.15, Math.PI * 1.85); x.stroke();   // kapalı gülen gözler
  x.beginPath(); x.arc(A.x, A.y + A.r * 0.16, A.r * 0.2, 0.25, Math.PI - 0.25); x.stroke();   // gülümseme
  x.fillStyle = 'rgba(255,140,150,0.35)'; x.beginPath(); x.arc(A.x - A.r * 0.52, A.y + A.r * 0.2, A.r * 0.12, 0, 6.283); x.arc(A.x + A.r * 0.52, A.y + A.r * 0.2, A.r * 0.12, 0, 6.283); x.fill();
  // ayın önünden geçen ince lila bulut tülleri
  x.fillStyle = 'rgba(195,155,255,0.3)'; for (const [dx, dy, rw, rh] of [[-0.6, 0.62, 0.9, 0.09], [0.5, 0.78, 0.75, 0.07], [-1.6, 0.3, 0.6, 0.06]]) { x.beginPath(); x.ellipse(A.x + dx * A.r, A.y + dy * A.r, rw * A.r, rh * A.r, 0, 0, 6.283); x.fill(); }
  // uzak tepeler ve kıvrık ağaç siluetleri
  x.fillStyle = '#41307a'; x.beginPath(); x.moveTo(-2, h); for (let i = 0; i <= 30; i++) { const px = i / 30 * w; x.lineTo(px, h * 0.655 - Math.sin(px / s * 3.1 + 1.7) * s * 0.03 - Math.sin(px / s * 7.3) * s * 0.008); } x.lineTo(w + 2, h); x.fill();
  { const q = rng(5); for (let px = s * 0.05; px < w; px += s * (0.12 + q() * 0.14)) sh8Agac(x, px, h * 0.665 - Math.sin(px / s * 3.1 + 1.7) * s * 0.03, s * (0.06 + q() * 0.05), '#382a6c', q() < 0.5 ? -1 : 1); }
  // köy tepesi ve eğri büğrü evler
  x.fillStyle = '#30245f'; x.beginPath(); x.moveTo(-2, h); for (let i = 0; i <= 40; i++) { const px = i / 40 * w; x.lineTo(px, sh8Tepe(px, h, s)); } x.lineTo(w + 2, h); x.fill();
  x.strokeStyle = 'rgba(195,155,255,0.22)'; x.lineWidth = Math.max(1, s * 0.004); x.beginPath(); for (let i = 0; i <= 40; i++) { const px = i / 40 * w; if (i) x.lineTo(px, sh8Tepe(px, h, s) + 1); else x.moveTo(px, sh8Tepe(px, h, s) + 1); } x.stroke();
  for (const E of O.ev) sh8Ev(x, E, s);
  // evlerin arasındaki bayrak süsleri (ampuller canlı katmanda ışıldar)
  for (let j = 0; j < O.ip.length; j++) {
    const q = O.ip[j], n = 6;
    x.strokeStyle = 'rgba(30,20,60,0.8)'; x.lineWidth = Math.max(0.6, s * 0.0022); x.beginPath();
    for (let i = 0; i <= 12; i++) { sh8IpNokta(q, i / 12, sh8Ip); if (i) x.lineTo(sh8Ip[0], sh8Ip[1]); else x.moveTo(sh8Ip[0], sh8Ip[1]); } x.stroke();
    for (let i = 0; i < n; i++) { sh8IpNokta(q, (i + 0.5) / n, sh8Ip); const fw = s * 0.008, fh = s * 0.017; x.fillStyle = SH8_RENK[(i + j) % 4]; x.beginPath(); x.moveTo(sh8Ip[0] - fw, sh8Ip[1]); x.lineTo(sh8Ip[0] + fw, sh8Ip[1]); x.lineTo(sh8Ip[0], sh8Ip[1] + fh); x.closePath(); x.fill(); }
  }
  // yerde parlayan pembe-mor sis kuşağı
  gr = x.createLinearGradient(0, h * 0.68, 0, h * 0.84); gr.addColorStop(0, 'rgba(255,143,200,0)'); gr.addColorStop(0.45, 'rgba(255,150,210,0.34)'); gr.addColorStop(0.7, 'rgba(195,155,255,0.26)'); gr.addColorStop(1, 'rgba(195,155,255,0)');
  x.fillStyle = gr; x.fillRect(0, h * 0.68, w, h * 0.16);
  // kabak tarlası: dalgalı yakın tepe, uzakta ufacık kabaklar, kıvrım kıvrım parlayan sarmaşıklar
  const tarla = px => h * 0.79 - Math.sin(px / s * 2.6 + 0.4) * s * 0.022;
  gr = x.createLinearGradient(0, h * 0.76, 0, h); gr.addColorStop(0, '#2d2160'); gr.addColorStop(0.5, '#231a4c'); gr.addColorStop(1, '#170f34');
  x.fillStyle = gr; x.beginPath(); x.moveTo(-2, h); for (let i = 0; i <= 32; i++) { const px = i / 32 * w; x.lineTo(px, tarla(px)); } x.lineTo(w + 2, h); x.fill();
  x.strokeStyle = 'rgba(255,170,220,0.3)'; x.lineWidth = Math.max(1, s * 0.004); x.beginPath(); for (let i = 0; i <= 32; i++) { const px = i / 32 * w; if (i) x.lineTo(px, tarla(px)); else x.moveTo(px, tarla(px)); } x.stroke();
  { const q = rng(14); for (let i = 0; i < Math.ceil(w / s * 9); i++) { const px = q() * w, py = tarla(px) + s * (0.012 + q() * 0.03), pu = s * (0.009 + q() * 0.008); if (Math.abs(px - O.kb.x) < O.kb.u * 1.1 && py > h * 0.8) continue; x.fillStyle = '#c4581f'; x.beginPath(); x.ellipse(px, py - pu * 0.6, pu * 1.15, pu * 0.75, 0, 0, 6.283); x.fill(); x.fillStyle = '#ff9a3c'; x.beginPath(); x.ellipse(px, py - pu * 0.7, pu * 0.95, pu * 0.6, 0, 0, 6.283); x.fill(); x.fillStyle = 'rgba(255,215,150,0.5)'; x.beginPath(); x.ellipse(px - pu * 0.3, py - pu * 1.0, pu * 0.35, pu * 0.15, -0.3, 0, 6.283); x.fill(); x.fillStyle = '#4f7a34'; x.fillRect(px - pu * 0.1, py - pu * 1.55, pu * 0.2, pu * 0.45); if (q() < 0.5) { x.fillStyle = 'rgba(255,215,122,0.9)'; x.beginPath(); x.arc(px - pu * 0.3, py - pu * 0.75, pu * 0.14, 0, 6.283); x.arc(px + pu * 0.3, py - pu * 0.75, pu * 0.14, 0, 6.283); x.fill(); } } }
  // sarmaşıklar: tarlada kıvrıla kıvrıla uzanan saplar (uçları sarmal), yuvarlak kabak yaprakları, uçlarında nane rengi ışık
  { const q = rng(21); x.lineCap = 'round'; x.lineJoin = 'round';
    const n = Math.max(4, Math.round(w / s * 4));
    for (let j = 0; j < n; j++) {
      const arka = j % 2 === 0, x0 = (j + q() * 0.5 - 0.2) / n * w, L = s * (0.28 + q() * 0.2), y0 = h * (arka ? 0.835 : 0.9) + q() * s * 0.03, dal = s * (0.012 + q() * 0.01), ph = q() * 6, yon = q() < 0.5 ? -1 : 1;
      const yy = u => y0 + Math.sin(u * 5.5 + ph) * dal - u * s * 0.02 * yon;
      for (const [lw, col] of [[arka ? 0.007 : 0.009, arka ? '#2f5a46' : '#356a4a'], [arka ? 0.0025 : 0.0035, arka ? 'rgba(125,255,196,0.25)' : 'rgba(125,255,196,0.4)']]) {
        x.strokeStyle = col; x.lineWidth = Math.max(0.8, s * lw); x.beginPath();
        for (let i = 0; i <= 20; i++) { const u = i / 20, px = x0 + u * L, py = yy(u) - (lw < 0.005 ? s * 0.002 : 0); if (i) x.lineTo(px, py); else x.moveTo(px, py); }
        for (let k = 1; k <= 16; k++) { const a = -1.57 + k * 0.55, rr = s * 0.022 * (1 - k / 19); x.lineTo(x0 + L + s * 0.012 + Math.cos(a) * rr, yy(1) - s * 0.012 + Math.sin(a) * rr); }   // sarmal uç
        x.stroke();
      }
      x.fillStyle = 'rgba(125,255,196,0.8)'; x.beginPath(); x.arc(x0 + L + s * 0.012, yy(1) - s * 0.012, Math.max(0.7, s * 0.004), 0, 6.283); x.fill();
      const ny = Math.max(2, Math.round(L / (s * 0.07)));
      for (let k = 0; k < ny; k++) {   // yapraklar: yuvarlak, üç dilimli, sapın iki yanında sırayla
        const u = (k + 0.5) / ny, px = x0 + u * L, py = yy(u), sd = k % 2 ? 1 : -1, lr = s * (arka ? 0.014 : 0.019) * (0.8 + q() * 0.4);
        x.save(); x.translate(px, py); x.rotate(sd * (0.5 + q() * 0.4) - Math.PI / 2 * (sd < 0 ? 1 : 0.2));
        x.fillStyle = arka ? '#3a6e52' : '#47875c'; x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(lr * 0.2, -lr * 1.1, lr * 1.7, -lr * 1.3, lr * 1.6, 0); x.bezierCurveTo(lr * 1.7, lr * 0.9, lr * 0.4, lr * 0.8, 0, 0); x.fill();
        x.strokeStyle = arka ? 'rgba(160,255,210,0.25)' : 'rgba(170,255,215,0.4)'; x.lineWidth = Math.max(0.6, lr * 0.09); x.beginPath(); x.moveTo(lr * 0.1, 0); x.quadraticCurveTo(lr * 0.8, -lr * 0.15, lr * 1.4, -lr * 0.05); x.stroke();
        x.restore();
        if (!arka && k % 2 === 0) { x.strokeStyle = '#4f9a66'; x.lineWidth = Math.max(0.6, s * 0.0025); x.beginPath(); x.moveTo(px, py); for (let m = 1; m <= 12; m++) { const a = m * 0.6 * sd, r2 = s * 0.011 * (0.3 + m * 0.07); x.lineTo(px + Math.cos(a - 1.57) * r2 + sd * s * 0.006, py - s * 0.016 + Math.sin(a - 1.57) * r2); } x.stroke(); }   // ince kıvrım
      }
    } }
  // büyük kabağın altında sıcak ışık havuzu
  const K = O.kb;
  gr = x.createRadialGradient(K.x, K.y - K.u * 0.3, 0, K.x, K.y - K.u * 0.3, K.u * 2.4); gr.addColorStop(0, 'rgba(255,179,71,0.32)'); gr.addColorStop(1, 'rgba(255,170,80,0)');
  x.fillStyle = gr; x.fillRect(K.x - K.u * 2.4, K.y - K.u * 2.7, K.u * 4.8, K.u * 4.8);
  // küçük kabaklar, büyük kabak ve minik cadı şapkası (yüzler canlı katmanda)
  for (const [px, py, pu] of O.kk) sh8KabakGovde(x, px, py, pu, 3, 0);
  sh8KabakGovde(x, K.x, K.y, K.u, 5, 0);
  x.fillStyle = 'rgba(255,130,170,0.32)'; x.beginPath(); x.ellipse(K.x - K.u * 0.62, K.y - K.u * 0.62, K.u * 0.13, K.u * 0.08, 0, 0, 6.283); x.ellipse(K.x + K.u * 0.62, K.y - K.u * 0.62, K.u * 0.13, K.u * 0.08, 0, 0, 6.283); x.fill();   // pembe yanaklar
  sh8Sapka(x, K.x + K.u * 0.1, K.y - K.u * 1.36, K.u, -0.16);
  // ön plan: şeker renkli benekli mantarlar, bir lolipop, ot tutamları
  for (const [px, py, pr, col] of [[w * 0.05, h * 0.985, 0.03, '#ff8fc8'], [w * 0.1, h * 0.99, 0.02, '#7dffc4'], [w * 0.255, h * 0.975, 0.018, '#c39bff'], [w * 0.955, h * 0.99, 0.024, '#ff8fc8']]) {
    const mr = s * pr;
    x.fillStyle = '#efe2f6'; x.beginPath(); x.moveTo(px - mr * 0.28, py); x.quadraticCurveTo(px - mr * 0.3, py - mr * 0.6, px - mr * 0.2, py - mr * 0.85); x.lineTo(px + mr * 0.2, py - mr * 0.85); x.quadraticCurveTo(px + mr * 0.3, py - mr * 0.6, px + mr * 0.28, py); x.fill();
    x.fillStyle = col; x.beginPath(); x.ellipse(px, py - mr * 0.85, mr, mr * 0.62, 0, Math.PI, 0); x.quadraticCurveTo(px, py - mr * 0.7, px - mr, py - mr * 0.85); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.85)'; for (const [dx, dy, dr] of [[-0.45, -1.1, 0.13], [0.15, -1.3, 0.11], [0.55, -1.0, 0.09]]) { x.beginPath(); x.arc(px + dx * mr, py + dy * mr, dr * mr, 0, 6.283); x.fill(); }
  }
  { const lx = w * 0.815, ly = h * 0.97, lr = s * 0.026;   // lolipop
    x.strokeStyle = '#f4ecf8'; x.lineWidth = Math.max(1, s * 0.005); x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx + s * 0.004, ly - s * 0.075); x.stroke();
    x.fillStyle = '#ffd6ec'; x.beginPath(); x.arc(lx + s * 0.004, ly - s * 0.075 - lr, lr, 0, 6.283); x.fill();
    x.strokeStyle = '#ff6fb8'; x.lineWidth = lr * 0.28; x.beginPath(); for (let i = 0; i <= 26; i++) { const a = i * 0.45, rr = lr * i / 28; if (i) x.lineTo(lx + s * 0.004 + Math.cos(a) * rr, ly - s * 0.075 - lr + Math.sin(a) * rr); else x.moveTo(lx + s * 0.004, ly - s * 0.075 - lr); } x.stroke(); }
  x.strokeStyle = '#2f5a44'; x.lineWidth = Math.max(1, s * 0.004); x.lineCap = 'round';
  { const q = rng(9); for (let i = 0; i < Math.ceil(w / s * 14); i++) { const px = q() * w, py = h * (0.975 + q() * 0.03), hh = s * (0.015 + q() * 0.02); x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + hh * 0.2, py - hh * 0.6, px + hh * 0.35 * (q() - 0.3), py - hh); x.moveTo(px, py); x.quadraticCurveTo(px - hh * 0.25, py - hh * 0.5, px - hh * 0.4, py - hh * 0.8); x.stroke(); } }
}
function sh8Canli(ox, oy, w, h, tm, a, hov) {
  if (a <= 0.01) return;
  hov = hov || 0;
  const O = sh8Yer(w, h), s = O.s, hz = 1 + 0.35 * hov, t = tm * hz;
  g.save(); g.lineCap = 'round';
  g.globalCompositeOperation = 'lighter';
  // 1) ay halesi yavaşça nefes alır; gökte ışıldayan yıldızcıklar
  const A = O.ay; dglow('#ffe7a8', ox + A.x, oy + A.y, A.r * (2.5 + 0.18 * Math.sin(tm * 0.7)), a * 0.3);
  for (let i = 0; i < 6; i++) {
    const tw = Math.pow(0.5 + 0.5 * Math.sin(t * (1.1 + i * 0.17) + i * 2.3), 3), px = w * (0.08 + 0.15 * i + 0.04 * Math.sin(i * 3.7)), py = h * (0.08 + 0.32 * sh7Hs(i + 300));
    if (Math.abs(px - A.x) < A.r * 1.2 && Math.abs(py - A.y) < A.r * 1.2) continue;
    shParilti(ox + px, oy + py, s * 0.02 * (0.4 + tw), a * tw * 0.9);
  }
  // 2) pencereler: sıcak ışık hafifçe titreşir (her biri kendi evresinde)
  for (let j = 0; j < O.ev.length; j++) { const P0 = O.ev[j].pen; for (let k = 0; k < P0.length; k++) { const q = P0[k], tw = 0.7 + 0.3 * Math.sin(t * (1.3 + q[3] * 0.2) + q[3] * 7); dglow('#ffd27a', ox + q[0], oy + q[1], q[2] * 3.6, a * 0.42 * tw); } }
  // 3) bayrak süslerinin ampulleri sırayla yanıp söner
  for (let j = 0; j < O.ip.length; j++) for (let i = 0; i <= 6; i++) { sh8IpNokta(O.ip[j], i / 6, sh8Ip); const tw = 0.5 + 0.5 * Math.sin(t * 2.6 - i * 1.1 + j * 1.9); dglow(i % 2 ? '#ffe2a0' : '#ffb0d8', ox + sh8Ip[0], oy + sh8Ip[1], s * 0.012, a * 0.6 * tw); }
  // 4) yerde süzülen pembe-mor sis bulutları
  for (let i = 0; i < 5; i++) { const u = (tm * 0.014 * hz + i * 0.23) % 1, px = (u * 1.3 - 0.15) * w, py = h * (0.755 + 0.025 * Math.sin(i * 1.7 + tm * 0.3)); dglow(i % 2 ? '#c39bff' : '#ff8fc8', ox + px, oy + py, s * (0.15 + 0.04 * (i % 3)), a * 0.13 * Math.sin(u * Math.PI)); }
  g.globalCompositeOperation = 'source-over';
  // 5) kabak yüzleri: içlerindeki sihirli ışık nefes alır, gözler ara sıra kırpılır
  const K = O.kb, kc = (t / 3.7) % 1, kirp = kc > 0.93 ? Math.sin((kc - 0.93) / 0.07 * Math.PI) : 0, isik = 0.82 + 0.12 * Math.sin(tm * 1.6) + 0.06 * Math.sin(tm * 3.7 + 1);
  sh8Yuz(ox + K.x, oy + K.y, K.u, 0, kirp, isik, a);
  for (let i = 0; i < O.kk.length; i++) { const q = O.kk[i], kc2 = (t / (4.3 + i * 0.7) + i * 0.31) % 1, kp = q[3] === 2 && kc2 > 0.92 ? Math.sin((kc2 - 0.92) / 0.08 * Math.PI) : 0; sh8Yuz(ox + q[0], oy + q[1], q[2], q[3], kp, 0.75 + 0.2 * Math.sin(tm * 1.9 + i * 2), a); }
  // 6) şapkanın ucundaki yıldız ışıldar
  g.globalCompositeOperation = 'lighter';
  { const c = Math.cos(-0.16), sn = Math.sin(-0.16), hx = K.x + K.u * 0.1 + (0.45 * c + 0.86 * sn) * K.u, hy = K.y - K.u * 1.36 + (0.45 * sn - 0.86 * c) * K.u, tw = 0.5 + 0.5 * Math.sin(t * 2.3);
    shParilti(ox + hx, oy + hy, K.u * (0.18 + 0.12 * tw), a * (0.5 + 0.4 * tw)); }
  // 7) ışık tozları: tarladan yükselen pastel tanecikler (ateşböceği değil: yumuşak ışık zerresi)
  for (let i = 0; i < 14; i++) {
    const r1 = sh7Hs(i * 3 + 501), r2 = sh7Hs(i * 3 + 502), u = (tm * (0.05 + 0.03 * r2) * hz + r1) % 1, px = w * ((r1 * 1.7 + r2) % 1) + Math.sin(tm * 0.7 + i) * s * 0.02, py = h * (0.92 - u * 0.5);
    const al = a * Math.sin(u * Math.PI) * (0.5 + 0.5 * Math.sin(tm * 2.1 + i * 1.3));
    dglow(SH8_RENK[i % 5], ox + px, oy + py, s * (0.012 + 0.01 * r2), al * 0.7);
    if (i % 3 === 0) shParilti(ox + px, oy + py, s * 0.012, al);
  }
  g.globalCompositeOperation = 'source-over';
  // 8) yarasa dost: büyük kabağın yanında süzülür, kanat çırpar, ara sıra göz kırpar; uzakta ayın önünden iki minik yarasa geçer
  { const Y = O.yr, bx = ox + Y.x + Math.sin(tm * 0.55 * hz) * s * 0.03, by = oy + Y.y + Math.sin(tm * 1.3 * hz) * s * 0.018, k = Math.sin(t * 7.5), gc = (t / 4.1 + 0.5) % 1;
    sh8Yarasa(bx, by, Y.u, k, gc > 0.95 ? 0 : 1, -1, a); }
  for (let i = 0; i < 2; i++) {
    const u = (tm * (0.022 + i * 0.006) * hz + i * 0.5) % 1, px = ox + w * (-0.1 + u * 1.2), py = oy + A.y + A.r * (i ? 0.9 : -0.6) + Math.sin(u * 9 + i) * s * 0.02;
    sh8Yarasa(px, py, s * (i ? 0.012 : 0.016), Math.sin(tm * 9 + i * 2), 1, 1, a * 0.85 * Math.sin(u * Math.PI));
  }
  g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
// uyku → rüya geçişinin ön planı: alt köşelerde koyu kabak yaprakları, kıvrık sarmaşıklar ve iki küçük kabak silueti (ince sıcak
// kenar ışığıyla); üstte sarkan kabak / yarasa / yıldız biçimli flamalar (paralaksla kayar)
function sh8OnPlan() {
  const c = shTuval(), x = c.getContext('2d'), s = Math.min(W, H), r = rng(29);
  x.lineCap = 'round'; x.lineJoin = 'round';
  const kol = 'rgba(22,14,48,0.9)';
  for (const sd of [-1, 1]) {
    const bx = sd < 0 ? 0 : W;
    x.fillStyle = kol;
    for (let i = 0; i < 6; i++) {   // iri yuvarlak kabak yaprakları
      const px = bx + sd * s * (0.01 + i * 0.045 + r() * 0.02), py = H * (1.0 - r() * 0.05), rr = s * (0.05 + r() * 0.04), an = -Math.PI / 2 + sd * (0.3 + r() * 0.9);
      x.save(); x.translate(px, py); x.rotate(an); x.beginPath(); x.moveTo(0, 0);
      x.bezierCurveTo(rr * 0.6, -rr * 0.5, rr * 1.4, -rr * 0.45, rr * 1.5, 0); x.bezierCurveTo(rr * 1.4, rr * 0.45, rr * 0.6, rr * 0.5, 0, 0); x.fill(); x.restore();
    }
    x.strokeStyle = kol; x.lineWidth = Math.max(2, s * 0.007);   // kıvrık sarmaşık
    for (let j = 0; j < 2; j++) { const px = bx + sd * s * (0.12 + j * 0.1), py = H * (0.93 - j * 0.04), rr = s * 0.035; x.beginPath(); x.moveTo(bx, py + s * 0.03); x.quadraticCurveTo(px - sd * rr, py + s * 0.02, px, py); for (let k = 1; k <= 18; k++) { const a = k * 0.5 * sd, r2 = rr * (1 - k / 22); x.lineTo(px + Math.cos(a + (sd < 0 ? 0 : Math.PI)) * r2 * sd, py - rr + Math.sin(a) * r2); } x.stroke(); }
    const kx = bx + sd * s * 0.1, ky = H * 1.005, ku = s * 0.07;   // kabak silueti + ince sıcak kenar
    x.fillStyle = kol; x.beginPath(); for (const [lx, rx2] of [[-0.45, 0.55], [0.45, 0.55], [0, 0.62]]) { x.moveTo(kx + lx * ku + rx2 * ku, ky - 0.7 * ku); x.ellipse(kx + lx * ku, ky - 0.7 * ku, rx2 * ku, 0.72 * ku, 0, 0, 6.283); } x.fill();
    x.strokeStyle = 'rgba(255,170,90,0.35)'; x.lineWidth = Math.max(1, s * 0.003); x.beginPath(); x.ellipse(kx, ky - 0.7 * ku, 0.95 * ku, 0.72 * ku, 0, Math.PI * 1.15, Math.PI * 1.75); x.stroke();
  }
  // üstte sarkan flama dizisi
  x.strokeStyle = 'rgba(40,28,70,0.7)'; x.lineWidth = Math.max(1, s * 0.003);
  const q = [-W * 0.05, H * 0.025, W * 1.05, H * 0.025, H * 0.07];
  x.beginPath(); for (let i = 0; i <= 24; i++) { sh8IpNokta(q, i / 24, sh8Ip); if (i) x.lineTo(sh8Ip[0], sh8Ip[1]); else x.moveTo(sh8Ip[0], sh8Ip[1]); } x.stroke();
  const n = Math.max(9, Math.round(W / s * 9));
  for (let i = 0; i < n; i++) {
    sh8IpNokta(q, (i + 0.5) / n, sh8Ip); const px = sh8Ip[0], py = sh8Ip[1], fs = s * 0.022;
    x.globalAlpha = 0.85; x.fillStyle = SH8_RENK[i % 5];
    if (i % 3 === 0) { x.beginPath(); x.ellipse(px, py + fs * 1.1, fs * 0.9, fs * 0.75, 0, 0, 6.283); x.fill(); }   // kabak
    else if (i % 3 === 1) { x.beginPath(); x.ellipse(px, py + fs * 0.9, fs * 0.42, fs * 0.38, 0, 0, 6.283); x.moveTo(px, py + fs * 0.8); x.quadraticCurveTo(px + fs * 0.7, py + fs * 0.2, px + fs * 1.3, py + fs * 0.6); x.quadraticCurveTo(px + fs * 0.8, py + fs * 0.9, px, py + fs); x.quadraticCurveTo(px - fs * 0.8, py + fs * 0.9, px - fs * 1.3, py + fs * 0.6); x.quadraticCurveTo(px - fs * 0.7, py + fs * 0.2, px, py + fs * 0.8); x.fill(); }   // yarasa
    else { shYildiz5(x, px, py + fs, fs * 0.85); x.fill(); }   // yıldız
  }
  x.globalAlpha = 1;
  return c;
}
// ön planda süzülen iri, yumuşak ışık tozları (canlı, ekran pikseli)
function sh8OnToz(tm, a) {
  if (a <= 0.01) return;
  const s = Math.min(W, H);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 10; i++) {
    const r1 = sh7Hs(i * 5 + 701), r2 = sh7Hs(i * 5 + 702), u = (r2 + tm * (0.03 + 0.02 * r1)) % 1, px = (r1 + Math.sin(tm * 0.4 + i * 1.3) * 0.03) * W, py = H * (1.05 - u * 1.1);
    dglow(SH8_RENK[i % 5], px, py, s * (0.02 + 0.012 * r1), a * 0.35 * Math.sin(u * Math.PI));
  }
  g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
SH_ONBELLEK.push('cadi', 'onPlanC');
SH_KUR.cadi = () => { const A = { c: shTuval(), W, H, adim: [] }; A.adim.push(() => sh8Fon(A.c.getContext('2d'), W, H)); return A; };
SH_KUR.onPlanC = () => { const A = { c: null, W, H, adim: [() => { A.c = sh8OnPlan(); }] }; return A; };

// ── Bölüm 8 gecesinin yatak odası: küçük bir Cadılar Bayramı dokunuşu (oda birimi; her karede ucuz vektör, degrade yok) ──
// Yatağın üstünde duvarda kâğıttan yarasa süsü (ipte hafifçe sallanır), yatağın ayak ucunda prize takılı gülen kabak gece lambası,
// pencere camında yapışkan kâğıt yarasalar. Sabah aynı süsler gün ışığında; gece lambası söner.
const SH8_SUS = { x0: -60, y0: 10.2, x1: 8.6, y1: 9.3, sark: 7.2, n: 11 };   // yarasa süsünün ipi (perde çubuğunun soluna bağlı)
const SH8_GL = { x: 11.4, y: 67.2 };                                       // gece lambası (priz)
// kâğıt yarasa ((0,0) asılma noktası, r yarım kanat): düz kâğıt; kanatları taraklı, iki yuvarlak göz ve gülümseme çizilmiş
function sh8KagitYarasa(r, col, kenar, kanat) {
  const k = kanat || 0;
  g.fillStyle = col; g.strokeStyle = kenar; g.lineWidth = r * 0.07; g.lineJoin = 'round';
  g.beginPath();
  for (const sd of [-1, 1]) {
    const ky = -k * 0.25 * r;
    g.moveTo(0, r * 0.55); g.quadraticCurveTo(sd * r * 0.5, r * 0.05 + ky, sd * r * 1.15, r * 0.2 + ky);
    g.quadraticCurveTo(sd * r * 1.02, r * 0.6 + ky * 0.5, sd * r * 0.82, r * 0.78); g.quadraticCurveTo(sd * r * 0.68, r * 0.56, sd * r * 0.5, r * 0.84); g.quadraticCurveTo(sd * r * 0.36, r * 0.62, 0, r * 0.95);
  }
  g.fill(); g.stroke();
  g.strokeStyle = kenar; g.lineWidth = r * 0.04; g.beginPath(); for (const sd of [-1, 1]) { g.moveTo(sd * r * 0.3, r * 0.5); g.quadraticCurveTo(sd * r * 0.62, r * 0.4, sd * r * 0.92, r * 0.42); } g.stroke();   // kâğıt kıvrımları
  g.lineWidth = r * 0.07; g.beginPath(); g.ellipse(0, r * 0.62, r * 0.36, r * 0.4, 0, 0, 6.283); g.fill(); g.stroke();   // gövde
  g.beginPath(); g.moveTo(-r * 0.3, r * 0.4); g.lineTo(-r * 0.24, r * 0.12); g.lineTo(-r * 0.08, r * 0.3); g.lineTo(r * 0.08, r * 0.3); g.lineTo(r * 0.24, r * 0.12); g.lineTo(r * 0.3, r * 0.4); g.fill();   // kulaklar
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(-r * 0.13, r * 0.56, r * 0.1, 0, 6.283); g.arc(r * 0.13, r * 0.56, r * 0.1, 0, 6.283); g.fill();
  g.fillStyle = '#2a1f4e'; g.beginPath(); g.arc(-r * 0.12, r * 0.58, r * 0.055, 0, 6.283); g.arc(r * 0.14, r * 0.58, r * 0.055, 0, 6.283); g.fill();
  g.strokeStyle = '#2a1f4e'; g.lineWidth = r * 0.05; g.beginPath(); g.arc(0, r * 0.68, r * 0.1, 0.3, Math.PI - 0.3); g.stroke();
}
// kabak gece lambası ((x,y) gövde ortası, oda biriminde). yanik: 0 sönük (gündüz) .. 1 ışıl ışıl; kirp 0..1
function sh8GeceLambasi(p, tm, a, yanik, kirp) {
  const gece = p.sky === 'gece', L = SH8_GL, u = 2.15, k = sh.k0 * sh.zoom;
  if (yanik > 0.01) {   // duvara ve zemine sıcak ışık
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
    const px = shEkranX(L.x), py = shEkranY(L.y), nf = 1 + 0.05 * Math.sin(tm * 1.3);
    dglow('#ff9a3c', px, py, k * 17 * nf, a * 0.34 * yanik);
    dglow('#ffc46b', px, py, k * 6.5, a * 0.32 * yanik);
    g.globalAlpha = a * 0.42 * yanik; g.drawImage(glow('#ffb347'), px - k * 16, shEkranY(SH_ZEMIN + 1.8) - k * 3.2, k * 32, k * 6.4); g.globalAlpha = 1;   // zeminde sıcak ışık havuzu
    g.globalCompositeOperation = 'source-over';
  }
  shOdaT(); g.globalAlpha = a; g.lineJoin = 'round'; g.lineCap = 'round';
  g.fillStyle = gece ? '#4a4380' : '#f6ebdd'; shRR(g, L.x - 1.6, L.y - 2.3, 3.2, 4.6, 0.6); g.fill();   // priz kapağı
  g.strokeStyle = gece ? 'rgba(160,150,230,0.35)' : 'rgba(170,130,100,0.45)'; g.lineWidth = 0.14; g.stroke();
  const cy = L.y + 0.15, gv = yanik > 0.5 ? (gece ? '#ffb45c' : '#ffb870') : (gece ? '#c8743a' : '#ffad66'), kv = gece ? (yanik > 0.5 ? '#e9792e' : '#8a4a2a') : '#e48a48';
  g.fillStyle = gece ? '#5a2a1a' : '#c46a30'; g.beginPath(); for (const [lx, rx] of [[-0.5, 0.56], [0.5, 0.56], [0, 0.64]]) { g.moveTo(L.x + lx * u + (rx + 0.08) * u, cy); g.ellipse(L.x + lx * u, cy, (rx + 0.08) * u, 0.76 * u, 0, 0, 6.283); } g.fill();
  for (const [lx, rx, c2] of [[-0.5, 0.56, kv], [0.5, 0.56, kv], [0, 0.64, gv]]) { g.fillStyle = c2; g.beginPath(); g.ellipse(L.x + lx * u, cy, rx * u, 0.7 * u, 0, 0, 6.283); g.fill(); }
  g.fillStyle = gece ? 'rgba(255,240,200,0.35)' : 'rgba(255,250,235,0.6)'; g.beginPath(); g.ellipse(L.x - 0.45 * u, cy - 0.38 * u, 0.16 * u, 0.07 * u, -0.5, 0, 6.283); g.fill();
  g.strokeStyle = '#4f7a34'; g.lineWidth = 0.55; g.beginPath(); g.moveTo(L.x, cy - 0.66 * u); g.quadraticCurveTo(L.x + 0.05, cy - 0.92 * u, L.x + 0.42, cy - 1.0 * u); g.stroke();
  // yüz: gece içi ışıl ışıl (yumuşak, sıcak); gündüz sönük oyuk
  const yz = yanik > 0.5 ? (gece ? '#fff0b0' : '#ffe6a0') : (gece ? '#6a2f18' : '#c8662a'), gz = 1 - (kirp || 0);
  g.fillStyle = yz; g.beginPath();
  for (const sd of [-1, 1]) { const ex = L.x + sd * 0.3 * u, ey = cy - 0.12 * u; if (gz > 0.3) { g.moveTo(ex + 0.13 * u, ey); g.ellipse(ex, ey, 0.13 * u, 0.17 * u * gz, 0, 0, 6.283); } else { g.moveTo(ex - 0.14 * u, ey + 0.02); g.quadraticCurveTo(ex, ey - 0.2 * u, ex + 0.14 * u, ey + 0.02); g.quadraticCurveTo(ex, ey - 0.08 * u, ex - 0.14 * u, ey + 0.02); } }
  g.moveTo(L.x - 0.42 * u, cy + 0.14 * u); g.quadraticCurveTo(L.x, cy + 0.6 * u, L.x + 0.42 * u, cy + 0.14 * u); g.quadraticCurveTo(L.x, cy + 0.32 * u, L.x - 0.42 * u, cy + 0.14 * u); g.fill();
  g.fillStyle = gece ? 'rgba(255,140,170,0.4)' : 'rgba(255,120,140,0.45)'; g.beginPath(); g.arc(L.x - 0.56 * u, cy + 0.2 * u, 0.12 * u, 0, 6.283); g.arc(L.x + 0.56 * u, cy + 0.2 * u, 0.12 * u, 0, 6.283); g.fill();
  g.globalAlpha = 1;
  if (yanik > 0.5) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; dglow('#ffd27a', shEkranX(L.x), shEkranY(cy + 0.1 * u), k * 1.6, a * 0.45 * yanik); g.globalCompositeOperation = 'source-over'; }
}
// odanın süsleri: a saydamlık (oda eridikçe söner), uyu 0..1 (Feza uyudukça ortadaki kâğıt yarasa, sanki rüya başlıyormuş gibi,
// kanatlarını usulca oynatır), kirpG 0..1 (gece lambasının göz kırpışı)
function sh8Oda(p, tm, a, uyu, kirpG) {
  if (a <= 0.01) return;
  const gece = p.sky === 'gece';
  shOdaT(); g.globalAlpha = a;
  // pencere camında yapışkan kâğıt yarasalar (gece ay ışığında koyu siluet, sabah lila)
  const cam = gece ? '#7d68c4' : '#a88ae0', camK = gece ? 'rgba(170,150,255,0.5)' : 'rgba(255,255,255,0.7)';
  for (const [cx, cy, cr, ca] of [[19.4, 23.4, 2.0, -0.2], [35.4, 41.4, 1.75, 0.25], [22.2, 44.6, 1.25, 0.1]]) { g.save(); g.translate(cx, cy - 0.6 * cr); g.rotate(ca); sh8KagitYarasa(cr, cam, camK, 0); g.restore(); }
  // gece lambası
  const gl = gece ? 1 : 0, gk = (tm / 5.3) % 1, kirp = gk > 0.95 ? Math.sin((gk - 0.95) / 0.05 * Math.PI) : 0;
  sh8GeceLambasi(p, tm, a, gl, Math.max(kirp, kirpG || 0));   // kirpG: Feza uykuya dalarken bir kez tatlıca göz kırpar
  // kâğıt yarasa süsü: ip, iki uçta minik raptiye, ipte sallanan yarasalar
  shOdaT(); g.globalAlpha = a;
  const Su = SH8_SUS, ip = gece ? 'rgba(150,140,210,0.75)' : 'rgba(170,120,80,0.7)';
  g.strokeStyle = ip; g.lineWidth = 0.16; g.beginPath();
  for (let i = 0; i <= 24; i++) { const u = i / 24, px = lerp(Su.x0, Su.x1, u), py = lerp(Su.y0, Su.y1, u) + Math.sin(u * Math.PI) * Su.sark; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
  g.stroke();
  g.fillStyle = gece ? '#8f86c8' : '#ff9fc4'; g.beginPath(); g.arc(Su.x0, Su.y0, 0.42, 0, 6.283); g.arc(Su.x1, Su.y1, 0.42, 0, 6.283); g.fill();   // raptiyeler
  const renk = gece ? ['#7f6cc8', '#5f4fae', '#d9843f'] : ['#c4aef8', '#a88ae8', '#ffad66'], kenar = gece ? 'rgba(30,20,70,0.55)' : 'rgba(110,70,140,0.35)';
  for (let i = 0; i < Su.n; i++) {
    const u = (i + 0.5) / Su.n, px = lerp(Su.x0, Su.x1, u), py = lerp(Su.y0, Su.y1, u) + Math.sin(u * Math.PI) * Su.sark;
    const sal = Math.sin(tm * (gece ? 1.05 : 0.7) + i * 0.9) * 0.11 + Math.sin(tm * 0.37 + i * 2.1) * 0.05, r = 1.6 + (i % 3 === 1 ? 0.25 : 0);
    const kanat = i === 6 && uyu > 0 ? Math.sin(tm * 5.2) * Math.min(1, uyu * 2) * 0.8 : 0;
    g.strokeStyle = ip; g.lineWidth = 0.1; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.sin(sal) * 0.7, py + Math.cos(sal) * 0.7); g.stroke();
    g.save(); g.translate(px + Math.sin(sal) * 0.7, py + Math.cos(sal) * 0.7); g.rotate(-sal); sh8KagitYarasa(r, renk[i % 3], kenar, kanat); g.restore();
    if (kanat && uyu > 0.05) {   // rüya başlıyor: kanat oynatan kâğıt yarasanın çevresinde minik ışıltılar
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
      const k = sh.k0 * sh.zoom, bx = shEkranX(px), by = shEkranY(py + r);
      dglow('#d8c2ff', bx, by, k * r * 2.2, a * 0.3 * uyu);
      for (let j = 0; j < 3; j++) { const an = tm * 1.4 + j * 2.1, tw = Math.pow(Math.max(0, Math.sin(tm * 3 + j * 2)), 2); shParilti(bx + Math.cos(an) * k * r * 1.5, by + Math.sin(an) * k * r * 1.1, k * 0.7 * tw, a * uyu * tw); }
      g.globalCompositeOperation = 'source-over'; shOdaT(); g.globalAlpha = a;
    }
  }
  g.globalAlpha = 1;
}
// sabah komodinin üstünde (dar ekranda komodin resmin dışında kalır: o zaman yatağın üstündeki rafta) rüyadan kalmış gibi
// gülen küçük bir balkabağı ve parlak ambalajlı bir şeker; çevrelerinde ara sıra ışıltı. a: beliriş, uyan: Feza uyanınca kabak gülümser
function sh8Hediye(tm, a, uyan) {
  if (a <= 0.01) return;
  const kom = -(W / 2 + (sh.oxp || 0)) / sh.k0 < -57.5;
  const cs = kom ? 1.3 : 1.15, kx = kom ? -55.5 : -40.3, ky = kom ? SH_KOMODIN.ust - 0.55 : 38, sx = kom ? -62.1 : -28.4, sy = kom ? SH_KOMODIN.ust - 0.6 - 0.56 * cs : 38 - 0.56 * cs, u = kom ? 1.75 : 1.55;   // komodinde lambanın önünde
  const k = sh.k0 * sh.zoom;
  // kabağın içinden rüyanın ışığı (yumuşak)
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  dglow('#ffcf8a', shEkranX(kx), shEkranY(ky - u * 0.8), k * u * 2.6, a * (0.28 + 0.06 * Math.sin(tm * 1.4)));
  g.globalCompositeOperation = 'source-over';
  shOdaT(); g.globalAlpha = a;
  // şeker: pembe-beyaz çizgili top, iki yanda nane rengi kıvrık ambalaj
  g.save(); g.translate(sx, sy); g.rotate(-0.12); g.scale(cs, cs); g.lineJoin = 'round';
  for (const sd of [-1, 1]) { g.fillStyle = '#7de8c0'; g.beginPath(); g.moveTo(sd * 0.55, 0); g.lineTo(sd * 1.45, -0.55); g.quadraticCurveTo(sd * 1.3, 0, sd * 1.45, 0.55); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 0.08; g.beginPath(); g.moveTo(sd * 0.7, -0.05); g.lineTo(sd * 1.3, -0.38); g.moveTo(sd * 0.7, 0.08); g.lineTo(sd * 1.3, 0.3); g.stroke(); }
  g.fillStyle = '#c0508a'; g.beginPath(); g.ellipse(0, 0, 0.74, 0.56, 0, 0, 6.283); g.fill();
  g.fillStyle = '#ff8fc8'; g.beginPath(); g.ellipse(0, 0, 0.68, 0.5, 0, 0, 6.283); g.fill();
  g.save(); g.beginPath(); g.ellipse(0, 0, 0.68, 0.5, 0, 0, 6.283); g.clip(); g.strokeStyle = '#fff4fa'; g.lineWidth = 0.16; g.beginPath(); for (let i = -3; i <= 3; i++) { g.moveTo(i * 0.32 - 0.4, -0.6); g.lineTo(i * 0.32 + 0.4, 0.6); } g.stroke(); g.restore();
  g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(-0.25, -0.22, 0.2, 0.08, -0.3, 0, 6.283); g.fill();
  g.restore();
  // gülen küçük balkabağı: Feza rüyada ona yüz yaptıysa o yüzle (kabakyuz.js ortak çizicisi), yoksa kendi tatlı yüzü
  const L = [[-0.5, 0.56], [0.5, 0.56], [0, 0.64]], cy = ky - 0.74 * u;
  const gc = (tm / 4.6) % 1, kp = gc > 0.94 ? Math.sin((gc - 0.94) / 0.06 * Math.PI) : 0, gz = 1 - Math.max(kp, uyan > 0 && uyan < 1 ? Math.sin(uyan * Math.PI) : 0);
  let ortak = false;
  if (typeof kabakYuzCiz === 'function') {
    try { kabakYuzCiz(g, kx, ky + 0.05, u * 2.4 / 212, tm, { secim: (typeof V8 !== 'undefined' && V8 && V8.kabakYuzSecim) || undefined, zemin: false, yanik: 1, isik: 1, kirp: 1 - gz, mutlu: 0.55, gulumse: 0.6 }); ortak = true; }
    catch (e) { shHata('kabakYuzCiz', e); }
    shOdaT(); g.globalAlpha = a;
  }
  if (!ortak) {
    g.fillStyle = 'rgba(120,70,40,0.28)'; g.beginPath(); g.ellipse(kx, ky + 0.05, u * 1.0, u * 0.12, 0, 0, 6.283); g.fill();
    g.fillStyle = '#c4581f'; g.beginPath(); for (const [lx, rx] of L) { g.moveTo(kx + lx * u + (rx + 0.07) * u, cy); g.ellipse(kx + lx * u, cy, (rx + 0.07) * u, 0.76 * u, 0, 0, 6.283); } g.fill();
    for (const [lx, rx] of L) { g.fillStyle = lx ? '#f28a3c' : '#ffa24a'; g.beginPath(); g.ellipse(kx + lx * u, cy, rx * u, 0.7 * u, 0, 0, 6.283); g.fill(); }
    g.fillStyle = 'rgba(255,245,215,0.6)'; g.beginPath(); g.ellipse(kx - 0.42 * u, cy - 0.38 * u, 0.16 * u, 0.07 * u, -0.5, 0, 6.283); g.fill();
    g.strokeStyle = '#4f7a34'; g.lineWidth = 0.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(kx, cy - 0.64 * u); g.quadraticCurveTo(kx + 0.04, cy - 0.95 * u, kx + 0.3, cy - 1.04 * u); g.stroke();
    g.fillStyle = '#6fbf5a'; g.beginPath(); g.moveTo(kx - 0.05, cy - 0.7 * u); g.quadraticCurveTo(kx - 0.45 * u, cy - 1.05 * u, kx - 0.75 * u, cy - 0.86 * u); g.quadraticCurveTo(kx - 0.4 * u, cy - 0.62 * u, kx - 0.05, cy - 0.7 * u); g.fill();
    g.fillStyle = '#ffd27a'; g.beginPath();
    for (const sd of [-1, 1]) { const ex = kx + sd * 0.3 * u, ey = cy - 0.12 * u; if (gz > 0.3) { g.moveTo(ex + 0.12 * u, ey); g.ellipse(ex, ey, 0.12 * u, 0.16 * u * gz, 0, 0, 6.283); } else { g.moveTo(ex - 0.13 * u, ey); g.quadraticCurveTo(ex, ey - 0.2 * u, ex + 0.13 * u, ey); g.quadraticCurveTo(ex, ey - 0.08 * u, ex - 0.13 * u, ey); } }
    g.moveTo(kx - 0.4 * u, cy + 0.14 * u); g.quadraticCurveTo(kx, cy + 0.58 * u, kx + 0.4 * u, cy + 0.14 * u); g.quadraticCurveTo(kx, cy + 0.3 * u, kx - 0.4 * u, cy + 0.14 * u); g.fill();
    g.fillStyle = 'rgba(255,120,150,0.45)'; g.beginPath(); g.arc(kx - 0.56 * u, cy + 0.18 * u, 0.12 * u, 0, 6.283); g.arc(kx + 0.56 * u, cy + 0.18 * u, 0.12 * u, 0, 6.283); g.fill();
  }
  g.globalAlpha = 1;
  // rüya tozu ışıltıları
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) { const tw = Math.pow(Math.max(0, Math.sin(tm * 1.3 + i * 1.7)), 2), an = i * 1.9 + tm * 0.2, cx2 = i < 3 ? kx : sx, cy2 = i < 3 ? cy : sy; shParilti(shEkranX(cx2 + Math.cos(an) * u * 1.3), shEkranY(cy2 - 0.4 * u + Math.sin(an) * u * 0.9), k * 0.9 * tw, a * tw * 0.9); }
  g.globalCompositeOperation = 'source-over';
}
// Bölüm 8 sabahı: pencereden sonbahar sabahı: şeftali-lila gök, solgun gülen ay batıyor, uzakta eğri büğrü köy evleri, altın tarlada
// küçük balkabakları, turuncu yapraklı bir ağaç; pencerenin önünden usul usul sonbahar yaprakları süzülür. a: 0..1 beliriş
function sh8Sabah(tm, a) {
  if (a <= 0.01) return;
  shOdaT(); g.save(); shPencereYol(g, 0); g.clip(); g.globalAlpha = a;
  const gk = g.createLinearGradient(0, SH_PEN.ust, 0, 46); gk.addColorStop(0, '#a9c8f2'); gk.addColorStop(0.5, '#dcd2f2'); gk.addColorStop(1, '#ffdcc2');
  g.fillStyle = gk; g.fillRect(SH_PEN.x0 - 1, SH_PEN.ust - 1, SH_PEN.x1 - SH_PEN.x0 + 2, 47 - SH_PEN.ust);
  // solgun ay (batıyor, hâlâ gülümsüyor)
  g.fillStyle = 'rgba(255,246,222,0.85)'; g.beginPath(); g.arc(35.2, 20.5, 2.5, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(214,160,110,0.6)'; g.lineWidth = 0.14; g.lineCap = 'round'; g.beginPath(); g.arc(34.4, 20.4, 0.38, Math.PI * 1.15, Math.PI * 1.85); g.moveTo(35.65, 20.3); g.arc(36.0, 20.4, 0.38, Math.PI * 1.15, Math.PI * 1.85); g.moveTo(35.75, 21.2); g.arc(35.2, 20.95, 0.6, 0.3, Math.PI - 0.3); g.stroke();
  // uzak lila tepeler ve köy
  g.fillStyle = '#c9b6e4'; g.beginPath(); g.moveTo(13, 46); g.quadraticCurveTo(19, 38.5, 26, 40.6); g.quadraticCurveTo(33, 37.6, 42, 41.5); g.lineTo(42, 51); g.lineTo(13, 51); g.fill();
  for (const [hx, hy, hw, hh, e, rc] of [[20.6, 41.2, 2.2, 1.8, 0.12, '#9a7cc8'], [23.9, 40.5, 1.8, 2.3, -0.1, '#b0739e'], [28.4, 40.0, 2.4, 1.9, 0.08, '#8f78c0'], [37.4, 41.2, 1.6, 1.5, -0.14, '#a07ab8']]) {
    g.save(); g.translate(hx, hy); g.transform(1, 0, -e, 1, 0, 0);
    g.fillStyle = '#e8dcf4'; g.fillRect(-hw / 2, -hh, hw, hh);
    g.fillStyle = rc; g.beginPath(); g.moveTo(-hw * 0.62, -hh); g.quadraticCurveTo(-hw * 0.1, -hh - hh * 0.6, hw * 0.12, -hh - hh * 1.05); g.quadraticCurveTo(hw * 0.4, -hh - hh * 1.1, hw * 0.5, -hh - hh * 0.9); g.quadraticCurveTo(hw * 0.3, -hh - hh * 0.6, hw * 0.62, -hh); g.closePath(); g.fill();
    g.fillStyle = '#ffd98a'; g.beginPath(); g.arc(0, -hh * 0.5, hw * 0.14, 0, 6.283); g.fill();
    g.restore();
  }
  // altın tarla ve küçük balkabakları
  g.fillStyle = '#efc98f'; g.beginPath(); g.moveTo(13, 51); g.lineTo(13, 45.6); g.quadraticCurveTo(22, 43.2, 30, 45.4); g.quadraticCurveTo(36, 46.8, 42, 44.8); g.lineTo(42, 51); g.fill();
  g.fillStyle = 'rgba(214,150,90,0.35)'; g.beginPath(); g.ellipse(27, 48.6, 14, 1.2, 0, 0, 6.283); g.fill();
  for (const [px, py, pr] of [[17.5, 47.2, 0.62], [21.2, 46.5, 0.5], [25.6, 47.6, 0.72], [29.8, 46.8, 0.55], [33.6, 47.9, 0.66], [37.8, 47.0, 0.5], [23.4, 49.2, 0.58], [35.2, 49.6, 0.6]]) {
    g.fillStyle = '#d9692a'; g.beginPath(); g.ellipse(px, py, pr * 1.15, pr * 0.8, 0, 0, 6.283); g.fill();
    g.fillStyle = '#ff9a3c'; g.beginPath(); g.ellipse(px - pr * 0.1, py - pr * 0.08, pr * 0.9, pr * 0.62, 0, 0, 6.283); g.fill();
    g.fillStyle = '#5f8a3a'; g.fillRect(px - 0.06, py - pr * 0.95, 0.14, pr * 0.32);
  }
  // turuncu yapraklı ağaç (köyün sağında, ayın altında)
  { const ax = 33.4, ay = 46.4;
    g.fillStyle = '#8a6048'; g.beginPath(); g.moveTo(ax - 0.6, ay); g.quadraticCurveTo(ax - 0.1, ay - 4.4, ax - 0.8, ay - 7.2); g.lineTo(ax + 0.2, ay - 7.2); g.quadraticCurveTo(ax + 0.8, ay - 4.4, ax + 0.6, ay); g.fill();
    for (const [dx, dy, pr, col] of [[0, -9.2, 2.4, '#f29a4a'], [-1.6, -8.0, 1.6, '#e8703a'], [1.7, -8.1, 1.7, '#ffb85c'], [0.1, -10.9, 1.5, '#ffc46b'], [-0.6, -8.6, 0.7, 'rgba(255,240,200,0.5)']]) { g.fillStyle = col; g.beginPath(); g.arc(ax + dx, ay + dy, pr, 0, 6.283); g.fill(); } }
  // süzülen sonbahar yaprakları
  for (let i = 0; i < 9; i++) {
    const yy = (sh7Hs(i + 140) + tm * (0.025 + 0.015 * sh7Hs(i + 160))) % 1, px = 14 + sh7Hs(i + 120) * 26 + Math.sin(tm * 0.8 + i * 1.7) * 1.2, py = 12 + yy * 38, rr = 0.5 + 0.28 * sh7Hs(i + 180);
    g.save(); g.translate(px, py); g.rotate(tm * (0.8 + sh7Hs(i + 200)) + i); g.scale(1, 0.55 + 0.45 * Math.sin(tm * 2.2 + i)); g.fillStyle = ['#f28a3c', '#ffb347', '#e0603a'][i % 3];
    g.beginPath(); g.moveTo(-rr, 0); g.quadraticCurveTo(0, -rr * 0.8, rr, 0); g.quadraticCurveTo(0, rr * 0.8, -rr, 0); g.fill(); g.restore();
  }
  g.restore();
  // pencere kayıtları göğün önünde kalsın
  g.globalAlpha = a; g.fillStyle = SH_SABAH.frame; const cxw = (SH_PEN.x0 + SH_PEN.x1) / 2;
  g.fillRect(cxw - 0.6, SH_PEN.ust, 1.2, SH_PEN.alt - SH_PEN.ust); g.fillRect(SH_PEN.x0, 31, SH_PEN.x1 - SH_PEN.x0, 1.2);
  // denizlikte iki düşmüş yaprak
  for (const [px, py, an, col] of [[18.6, 49.75, 0.3, '#f28a3c'], [34.2, 49.8, -0.5, '#ffb347']]) { g.save(); g.translate(px, py); g.rotate(an); g.fillStyle = col; g.beginPath(); g.moveTo(-0.6, 0); g.quadraticCurveTo(0, -0.45, 0.6, 0); g.quadraticCurveTo(0, 0.45, -0.6, 0); g.fill(); g.restore(); }
  g.globalAlpha = 1;
}
// Son sözün ilk cümlesi dünyadaki Balkabağı Şenliği'nde söylendiyse (CORE, Bölüm 7 gibi) sabah onu tekrar etmez
OLAY.on('konusma', e => {
  if (typeof BOLUM_NO === 'undefined' || BOLUM_NO !== 8 || !e || sh.mod) return;
  if (e.anahtar === sh8Harf('a_') + 'final1') sh.f6Ozet = 1;
});

// İnci Denizi rüya baloncuğu ve uyku geçişi aynı sualtı sanatını paylaşır; durağan doku önbellekte kalır.
function shDenizResim(x, d) {
  const gr = x.createLinearGradient(0, 0, 0, d); gr.addColorStop(0, '#135f97'); gr.addColorStop(0.35, '#154e8a'); gr.addColorStop(0.72, '#102f60'); gr.addColorStop(1, '#081d3b');
  x.fillStyle = gr; x.fillRect(0, 0, d, d);
  for (let i = 0; i < 5; i++) { x.fillStyle = 'rgba(102,236,231,0.15)'; x.beginPath(); x.moveTo(d * (0.1 + i * 0.18), 0); x.lineTo(d * (0.16 + i * 0.18), 0); x.lineTo(d * (0.46 + i * 0.18), d); x.lineTo(d * (0.26 + i * 0.18), d); x.fill(); }
  x.fillStyle = '#185578'; x.beginPath(); x.moveTo(0, d); x.lineTo(0, d * 0.65); x.bezierCurveTo(d * 0.3, d * 0.58, d * 0.64, d * 0.82, d, d * 0.61); x.lineTo(d, d); x.fill();
  const sand = x.createLinearGradient(0, d * 0.77, 0, d); sand.addColorStop(0, '#c8b687'); sand.addColorStop(1, '#557b89');
  x.fillStyle = sand; x.beginPath(); x.moveTo(0, d); x.lineTo(0, d * 0.82); x.bezierCurveTo(d * 0.35, d * 0.74, d * 0.62, d * 0.93, d, d * 0.79); x.lineTo(d, d); x.fill();
  x.lineCap = 'round';
  for (let j = 0; j < 6; j++) { const px = d * (j < 3 ? 0.12 + j * 0.07 : 0.77 + (j - 3) * 0.07), py = d * 0.87, h = d * (0.18 + j % 3 * 0.035); x.strokeStyle = j % 2 ? '#e882b7' : '#63cdb9'; x.lineWidth = d * 0.014;
    x.beginPath(); x.moveTo(px, py); x.bezierCurveTo(px - d * 0.02, py - h * 0.4, px + d * 0.018, py - h * 0.8, px, py - h); x.stroke();
    for (let k = 0; k < 3; k++) { const yy = py - h * (0.3 + k * 0.2), s = k % 2 ? -1 : 1; x.beginPath(); x.moveTo(px, yy); x.quadraticCurveTo(px + s * d * 0.055, yy - d * 0.01, px + s * d * 0.047, yy - d * 0.045); x.stroke(); }
  }
  const halo = x.createRadialGradient(d * 0.51, d * 0.77, 0, d * 0.51, d * 0.77, d * 0.28); halo.addColorStop(0, 'rgba(255,216,117,0.25)'); halo.addColorStop(0.35, 'rgba(184,204,183,0.09)'); halo.addColorStop(1, 'rgba(99,161,190,0)'); x.fillStyle = halo; x.fillRect(0, d * 0.45, d, d * 0.55);
  shDenizKabuk(x, d * 0.51, d * 0.835, d * 0.165);
  shDenizAti(x, d * 0.265, d * 0.565, d * 0.105);
  x.strokeStyle = '#ead6c9'; x.lineWidth = d * 0.008;
  for (let i = 0; i < 7; i++) { x.beginPath(); x.moveTo(d * 0.51, d * 0.87); x.lineTo(d * (0.36 + i * 0.05), d * (0.81 - Math.sin(i / 6 * Math.PI) * 0.035)); x.stroke(); }
  const pearl = x.createRadialGradient(d * 0.49, d * 0.74, 0, d * 0.51, d * 0.77, d * 0.064); pearl.addColorStop(0, '#fff8df'); pearl.addColorStop(0.48, '#daeecf'); pearl.addColorStop(1, '#a2c9c6'); x.fillStyle = pearl; x.beginPath(); x.arc(d * 0.51, d * 0.77, d * 0.061, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(247,253,231,0.8)'; x.lineWidth = d * 0.003; x.beginPath(); x.arc(d * 0.51, d * 0.77, d * 0.057, 3.5, 5.1); x.stroke();
  const sr = rng(43); x.fillStyle = 'rgba(230,241,211,0.22)'; for (let i = 0; i < 90; i++) { const xx = sr() * d, yy = d * (0.86 + sr() * 0.14); x.beginPath(); x.ellipse(xx, yy, d * (0.002 + sr() * 0.002), d * 0.0013, sr(), 0, Math.PI * 2); x.fill(); }
  for (let i = 0; i < 5; i++) { const px = d * (0.17 + i * 0.14), py = d * (0.37 + Math.sin(i * 1.8) * 0.08); x.fillStyle = i % 2 ? '#dbb2cb' : '#bddfcb'; x.beginPath(); x.ellipse(px, py, d * 0.026, d * 0.014, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(px - d * 0.02, py); x.lineTo(px - d * 0.044, py - d * 0.018); x.lineTo(px - d * 0.044, py + d * 0.018); x.fill(); x.fillStyle = '#41657a'; x.beginPath(); x.arc(px + d * 0.015, py - d * 0.003, d * 0.0025, 0, Math.PI * 2); x.fill(); x.strokeStyle = 'rgba(244,246,218,0.7)'; x.lineWidth = d * 0.002; x.beginPath(); x.ellipse(px, py, d * 0.02, d * 0.008, 0, 3.6, 5.2); x.stroke(); }
}
function shDenizFonAdim() {
  const c = shTuval(), x = c.getContext('2d');
  return { c, W, H, adim: [() => { x.save(); x.scale(W / Math.max(W, H), H / Math.max(W, H)); shDenizResim(x, Math.max(W, H)); x.restore(); }] };
}
function shDenizDalga(tm, a) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 0.09 * a; g.strokeStyle = '#c8f7e3'; g.lineWidth = Math.max(2, H * 0.004);
  for (let k = 0; k < 5; k++) { g.beginPath(); for (let i = 0; i <= 16; i++) { const px = W * i / 16, py = H * (0.17 + k * 0.145) + Math.sin(i * 0.6 + tm * 0.7 + k) * H * 0.016; if (!i) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); } g.restore();
}
function shDenizSabah(tm) {
  shResimT(); g.save(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.065; g.fillStyle = '#75d6cd'; g.fillRect(0, 0, W, H); g.restore();
  shDenizDalga(tm * 0.35, 0.38);
  // Rüyadan kalan sakin su yansımaları, yalnız bu sabahın pencere ışığında.
  shOdaT(); g.save(); shPencereYol(g, 0); g.clip(); g.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const yy = 31 + i * 4.3, swing = Math.sin(tm * .42 + i) * .45; g.strokeStyle = i % 2 ? 'rgba(255,241,202,.15)' : 'rgba(161,228,221,.19)'; g.lineWidth = .18; g.beginPath(); g.moveTo(14, yy); g.bezierCurveTo(20, yy - 1.3 + swing, 32, yy + 1.8 - swing, 40, yy - .2); g.stroke(); }
  g.restore();
}

function shDenizOnPlan() {
  const c = shTuval(), x = c.getContext('2d'); x.lineCap = 'round';
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
    const px = side < 0 ? W * (0.015 + i * 0.014) : W * (0.985 - i * 0.014), py = H * 1.03, h = H * (0.08 + (i % 3) * 0.035);
    x.strokeStyle = i % 2 ? '#244c60' : '#2b626c'; x.lineWidth = Math.max(2, H * 0.006);
    x.beginPath(); x.moveTo(px, py); x.bezierCurveTo(px + side * 8, py - h * 0.4, px - side * 13, py - h * 0.75, px, py - h); x.stroke();
    for (let k = 0; k < 3; k++) { const yy = py - h * (0.25 + k * 0.21); x.beginPath(); x.moveTo(px, yy); x.quadraticCurveTo(px - side * W * 0.028, yy - h * 0.04, px - side * W * 0.024, yy - h * 0.24); x.stroke(); }
  }
  return c;
}

function shDenizKabuk(x, cx, cy, r) {
  x.save(); x.translate(cx, cy); x.scale(r, r);
  const cup = x.createLinearGradient(0, -0.4, 0, 0.28); cup.addColorStop(0, '#ecd4c8'); cup.addColorStop(0.42, '#c2a8b8'); cup.addColorStop(1, '#71839d');
  x.fillStyle = cup; x.beginPath(); x.moveTo(-1, -0.04); x.bezierCurveTo(-0.95, -0.3, -0.6, -0.42, 0, -0.37); x.bezierCurveTo(0.6, -0.42, 0.95, -0.3, 1, -0.04); x.bezierCurveTo(0.6, 0.37, -0.6, 0.37, -1, -0.04); x.fill();
  x.strokeStyle = 'rgba(246,218,207,0.86)'; x.lineWidth = 0.035; x.beginPath(); x.moveTo(-0.96, -0.03); x.bezierCurveTo(-0.52, 0.22, 0.52, 0.22, 0.96, -0.03); x.stroke();
  x.strokeStyle = 'rgba(136,125,158,0.52)'; x.lineWidth = 0.018;
  for (let i = 0; i < 9; i++) { const u = (i - 4) / 4; x.beginPath(); x.moveTo(u * 0.12, 0.25); x.quadraticCurveTo(u * 0.65, 0.13, u * 0.95, -0.075 - (1 - Math.abs(u)) * 0.25); x.stroke(); }
  x.fillStyle = 'rgba(67,94,114,0.13)'; x.beginPath(); x.ellipse(0, -0.07, 0.39, 0.065, 0, 0, Math.PI * 2); x.fill(); x.restore();
}
function shDenizAti(x, cx, cy, r) {
  x.save(); x.translate(cx, cy); x.scale(r, r); x.lineCap = 'round';
  const body = x.createLinearGradient(-0.15, -0.7, 0.4, 0.6); body.addColorStop(0, '#f2d5bd'); body.addColorStop(0.5, '#d9a8ad'); body.addColorStop(1, '#ae90b4');
  x.strokeStyle = '#b4cdbd'; x.lineWidth = 0.12; x.beginPath(); x.moveTo(-0.14, -0.25); x.bezierCurveTo(-0.4, -0.18, -0.47, 0.13, -0.24, 0.25); x.stroke();
  x.fillStyle = body; x.beginPath(); x.moveTo(0.02, -0.45); x.bezierCurveTo(-0.25, -0.2, -0.29, 0.04, -0.13, 0.28); x.bezierCurveTo(0.11, 0.57, -0.04, 0.91, -0.28, 0.75); x.bezierCurveTo(-0.45, 0.64, -0.34, 0.45, -0.2, 0.51); x.bezierCurveTo(-0.28, 0.54, -0.3, 0.64, -0.21, 0.66); x.bezierCurveTo(0.06, 0.7, 0.03, 0.48, -0.02, 0.38); x.bezierCurveTo(-0.24, 0.1, -0.11, -0.22, 0.1, -0.37); x.closePath(); x.fill();
  x.fillStyle = body; x.beginPath(); x.ellipse(0.05, -0.52, 0.29, 0.24, -0.1, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(0.31, -0.42, 0.22, 0.105, 0.12, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(243,220,193,0.64)'; x.lineWidth = 0.036; x.beginPath(); x.moveTo(-0.1, -0.26); x.quadraticCurveTo(-0.19, 0.06, -0.04, 0.25); x.stroke();
  x.fillStyle = '#42637a'; x.beginPath(); x.arc(0.19, -0.55, 0.047, 0, Math.PI * 2); x.fill(); x.fillStyle = '#f7f6db'; x.beginPath(); x.arc(0.202, -0.565, 0.016, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#7da7a0'; x.lineWidth = 0.038; x.beginPath(); x.moveTo(-0.14, -0.76); x.lineTo(-0.16, -0.83); x.lineTo(-0.08, -0.8); x.lineTo(-0.01, -0.9); x.lineTo(0.025, -0.77); x.stroke(); x.restore();
}

// Son beş saniye: oda açıkça sualtı rüyasına dönüşür, iki arkadaş görünür şekilde yüzmeye başlar.
function shDenizGirisCiz(tm, t, P0) {
  const fon = shDenizOyunResmi(tm), u = shEase(shSeg(t, P0.b3, P0.b4)), sc = Math.min(W / 750, H / 420);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  if (u < 1) { sh.denizBase = true; try { shGirisCiz(tm, 0); } finally { sh.denizBase = false; } g.setTransform(1, 0, 0, 1, 0, 0); }
  g.globalAlpha = u; g.drawImage(fon, 0, 0); g.globalAlpha = 1; shDenizDalga(tm, 0.5 * u);
  // Büyük su damlaları yukarı yükselir; parlak çizgi değil, saydam kabuk ve ufak yansıma.
  g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = 'rgba(137,239,228,0.45)'; g.lineWidth = Math.max(1, sc * 0.6);
  for (let i = 0; i < 9; i++) { const bx = W * (0.08 + i * 0.108) + Math.sin(tm * 0.4 + i) * W * 0.012, by = H * (0.85 - ((tm * 0.07 + i * 0.103) % 0.76)), r = sc * (4 + i % 3 * 2); g.globalAlpha = u * 0.7; g.beginPath(); g.arc(bx, by, r, 0, Math.PI * 2); g.stroke(); }
  const enter = shEase(shSeg(u, 0.25, 0.9));
  // son ~2 sn: kamera/karakterler oyunun başlangıç çerçevesine (Feza ve Pırıl'ın oyundaki ekran yeri ve boyu) yumuşakça oturur
  const kk = shEase(shSeg(t, P0.son - 2.0, P0.son - 0.15)), LF = shCanliFeza(), LD = (typeof D !== 'undefined' && typeof cam !== 'undefined') ? { x: (D.x - cam.x) * S, y: (D.y - cam.y) * S } : null;
  const fx0 = W * (0.24 + 0.17 * enter), fy0 = H * (0.6 - 0.08 * enter) + Math.sin(tm * 1.5) * sc * 2;
  const fx = lerp(fx0, LF.x, kk), fy = lerp(fy0, LF.y + 30 * S, kk), fsc = lerp(sc * 1.7, S * 1.4, kk);
  g.globalAlpha = enter;
  if (typeof fezaCizPoz === 'function') fezaCizPoz(g, fx, fy, fsc, 'yuzme', tm, null, { vy: -18, isik: 0 });
  if (typeof pirilCizPoz === 'function') pirilCizPoz(g, lerp(fx0 - sc * 20, LD ? LD.x : fx0 - sc * 20, kk), lerp(fy0 - sc * 90, LD ? LD.y : fy0 - sc * 90, kk), lerp(sc * 1.8, S * 1.0, kk), 'ucus', tm);
  g.globalAlpha = 1;
  if (enter > 0.65 && typeof dnzAtCiz === 'function' && typeof DNZ !== 'undefined' && DNZ.ati[0]) {
    const o = DNZ.ati[0], px = W * 0.72, py = H * 0.51 + Math.sin(tm * 1.1) * sc * 5;
    g.globalCompositeOperation = 'lighter'; dglow('#ffc987', px, py - 18 * sc, sc * 38, 0.14 * enter); g.globalCompositeOperation = 'source-over';
    dnzAtCiz(g, px, py, sc * 0.46, tm, o.dnz.renk, true, 0, null);
  }
  // sahne sonunda kararma YOK: son kare oyunun ilk karesine yumuşak çapraz geçişle bağlanır (oyun.js omGecisKare)
  g.restore();
}

function shDenizOyunResmi(tm) {
  if (sh.denizOyun) return sh.denizOyun;
  if (BOLUM_NO !== 4 || typeof dn4Background !== 'function' || typeof dn4World !== 'function') return shHazir('deniz');
  // Tek karelik gerçek bölüm resmi: aynı kaplamalar/mercanlar, fotoğraf gibi önbellekte; açılışta ikinci dünya çizim yükü olmaz.
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.fillStyle = '#082145'; g.fillRect(0, 0, W, H);
  dn4Background(tm); dn4World(tm); if (typeof dn4Foreground === 'function') dn4Foreground(tm);
  const c = shTuval(); c.getContext('2d').drawImage(g.canvas, 0, 0); g.restore();
  return sh.denizOyun = c;
}

// ══════════════════ BÖLÜM 9: PIRIL'IN EJDERHA VADİSİ ══════════════════
// Seçim kavanozu ve odadan rüyaya erime aynı resmi paylaşır: altın saate dönen sıcak bir gün. Turkuaz-şeftali gök, uzakta lavanta
// dağlar; sağda Büyükanne'nin yumuşacık yuvarlak dağı (tepesindeki yaprak yuvada lila-altın-nane ışıyan Ejderha Kalbi); solda altından
// kökler ve ince bir şelale sarkan uçan adacık; ortada iki basamaklı yumuşak şelale; yemyeşil yuvarlak tepeler, çiçekli dev ağaçlar;
// önde pul çiçekli çayır ve başında yumurta kabuğu şapkalı minik leylak bir yavru ejderha (yanında ılık bir yumurta). Durağan kısım
// (sh9Fon) önbellekte; güneş, Kalp'in nabzı, akan su, süzülen yetişkin ejderhalar, taç yaprakları, ışık tozu ve yavru her karede
// (sh9Canli). İkisi aynı yerleşimi (sh9Yer) kullanır; resim w×h, nesneler kısa kenara (s) göre. Korkutucu hiçbir şey yok.
const SH9_RENK = ['#b89cff', '#6fd8a8', '#ffd27a', '#ff9fc0', '#7fe0f0', '#c8f08a'];   // Pırıl leylağı, yeşim, altın, gül, gök turkuazı, fıstık
// pul çiçeklerinin yanardöner üçlüleri [dış taç, iç taç, göbek]
const SH9_PUL = [['#b89cff', '#7fe0f0', '#ffd27a'], ['#6fd8a8', '#d9c8ff', '#fff0b0'], ['#ff9fc0', '#ffd27a', '#fff6d8'], ['#7fe0f0', '#c8f08a', '#ffe08a'], ['#d9c8ff', '#ff9fc0', '#ffffff']];
const sh9Hs = i => { const v = Math.sin(i * 91.7 + 17.3) * 43758.5453; return v - Math.floor(v); };   // sabit sözde rastgele
// tepe hatları (px → y): uzak tepeler (şelalenin çıktığı yükselti dahil), yakın tepeler, çayır
const sh9Uzak = (px, O) => { const s = O.s, d = (px - O.sel.x) / (s * 0.075); return O.h * 0.615 - Math.sin(px / s * 3.3 + 0.8) * s * 0.026 - Math.sin(px / s * 7.1) * s * 0.008 - Math.exp(-d * d) * s * 0.085; };
const sh9Yakin = (px, O) => { const s = O.s; return O.h * 0.735 - Math.sin(px / s * 2.4 + 2.1) * s * 0.026 - Math.sin(px / s * 5.3 + 0.4) * s * 0.008; };
const sh9Cayir = (px, O) => { const s = O.s; return O.h * 0.84 - Math.sin(px / s * 1.9 + 0.3) * s * 0.018 - Math.sin(px / s * 4.6 + 1.1) * s * 0.006; };
const sh9YerB = new Map();
function sh9Yer(w, h) {
  const key = Math.round(w) * 8192 + Math.round(h);
  let O = sh9YerB.get(key);
  if (O) return O;
  const s = Math.min(w, h), kare = w < h * 1.2, r = rng(97);   // kare (kavanoz): nesneler biraz daha iri ve ortaya yakın
  O = { s, w, h, kare,
    gun: { x: w * (kare ? 0.43 : 0.44), y: h * 0.555, r: s * 0.07 },                                  // alçalan altın güneş (tepelerin ardında)
    dag: { x: w * (kare ? 0.7 : 0.77), y: h * (kare ? 0.33 : 0.27), g: s * (kare ? 0.27 : 0.34) },    // Büyükanne'nin dağı: tepe noktası, yarım en
    ada: { x: w * (kare ? 0.25 : 0.17), y: h * (kare ? 0.37 : 0.31), u: s * (kare ? 0.12 : 0.13) },   // büyük uçan adacık (üst yüzün ortası, yarım en)
    ada2: { x: w * (kare ? 0.5 : 0.53), y: h * (kare ? 0.2 : 0.15), u: s * 0.042 },
    sel: { x: w * (kare ? 0.42 : 0.38), u: s * (kare ? 0.04 : 0.036) },                                  // şelale (yarım en)
    yv: { x: w * (kare ? 0.58 : 0.58), y: h * (kare ? 0.865 : 0.9), u: s * (kare ? 0.088 : 0.078) },  // yavru (taban ortası, gövde birimi)
    pc: [], ag: [], cic: [], lam: [] };
  O.kalp = { x: O.dag.x, r: s * (kare ? 0.046 : 0.042) }; O.kalp.y = O.dag.y + s * 0.002 - O.kalp.r * 0.55;   // kristalin tabanı yuvanın içinde
  O.sel.y0 = sh9Uzak(O.sel.x, O) + s * 0.004; O.sel.y1 = sh9Yakin(O.sel.x, O) + s * 0.012; O.sel.ym = lerp(O.sel.y0, O.sel.y1, 0.46);
  O.yum = { x: O.yv.x + O.yv.u * 1.9, y: O.yv.y + O.yv.u * 0.12, u: O.yv.u * 0.62 };
  // pul çiçekleri [x, taban y, taç yarıçapı, renk, sap boyu] (yavrunun ve yumurtanın önünü kapatmaz)
  const pc = kare ? [[0.12, 0.885, 1.1], [0.3, 0.9, 0.9], [0.43, 0.875, 0.75], [0.82, 0.885, 1.0], [0.92, 0.93, 0.8]] : [[0.05, 0.95, 1.1], [0.18, 0.9, 0.9], [0.3, 0.94, 1.15], [0.42, 0.885, 0.8], [0.8, 0.91, 1.0], [0.9, 0.95, 1.2], [0.97, 0.885, 0.75]];
  pc.forEach(([u, v, k], i) => O.pc.push([w * u, h * v, s * 0.024 * k, i % SH9_PUL.length, s * (0.03 + 0.02 * k)]));
  // çiçekli dev ağaçlar [x, kök y, boy, taç rengi, yön]: yakın tepelerde ikisi iri, uzakta küçükler
  O.ag.push([w * (kare ? 0.1 : 0.06), sh9Yakin(w * (kare ? 0.1 : 0.06), O) + s * 0.03, s * (kare ? 0.24 : 0.27), 0, 1]);
  O.ag.push([w * (kare ? 0.9 : 0.95), sh9Yakin(w * (kare ? 0.9 : 0.95), O) + s * 0.03, s * (kare ? 0.2 : 0.24), 1, -1]);
  for (let px = s * 0.04; px < w; px += s * (0.07 + r() * 0.07)) { if (Math.abs(px - O.sel.x) < s * 0.09) continue; O.ag.push([px, sh9Uzak(px, O) + s * 0.006, s * (0.045 + r() * 0.03), 2 + (r() * 3 | 0), r() < 0.5 ? 1 : -1, 1]); }
  // çayırdaki minik çiçekler [x, y, r, renk]
  for (let i = 0; i < Math.ceil(w / s * 70); i++) { const px = r() * w, py = sh9Cayir(px, O) + r() * (h - sh9Cayir(px, O)) * 0.95; O.cic.push([px, py, s * (0.0035 + r() * 0.004) * (0.6 + (py - h * 0.8) / (h * 0.2) * 0.8), i % 5]); }
  // dağdaki fenerler (yuvaya kıvrılan patika boyunca)
  for (let i = 0; i < 6; i++) { const u = i / 5, a = u * 5.2; O.lam.push([O.dag.x + Math.sin(a) * O.dag.g * (0.45 - u * 0.33), lerp(h * 0.6, O.dag.y + s * 0.05, u), i]); }
  if (sh9YerB.size > 12) sh9YerB.delete(sh9YerB.keys().next().value);
  sh9YerB.set(key, O);
  return O;
}
// yumuşak bulut kümesi (önbelleğe): şeftali ışıklı üst, lila gölgeli alt
function sh9Bulut(x, cx, cy, R, sd) {
  const q = rng(sd), T = [];
  for (let i = 0; i < 6; i++) { const e = Math.sin(Math.PI * (i + 0.5) / 6); T.push([cx + (i - 2.5) * R * 0.48 + (q() - 0.5) * R * 0.2, R * (0.22 + 0.4 * e + q() * 0.1)]); }
  x.fillStyle = 'rgba(214,170,206,0.42)'; x.beginPath();
  for (const [px, pr] of T) { x.moveTo(px + pr, cy - pr * 0.3); x.arc(px, cy - pr * 0.3, pr, 0, 6.283); }
  x.fill();
  x.fillStyle = 'rgba(255,246,236,0.82)'; x.beginPath();
  for (const [px, pr] of T) { x.moveTo(px + pr * 0.86, cy - pr * 0.46); x.arc(px - pr * 0.06, cy - pr * 0.46, pr * 0.86, 0, 6.283); }
  x.fill();
  x.fillStyle = 'rgba(255,214,170,0.35)'; x.beginPath();
  for (const [px, pr] of T) { x.moveTo(px - pr * 0.1 + pr * 0.5, cy - pr * 0.8); x.arc(px - pr * 0.1, cy - pr * 0.8, pr * 0.5, 0, 6.283); }
  x.fill();
}
// çiçekli ağaç (önbelleğe): kıvrık yumuşak gövde, top top çiçek taçları; uzaktakiler (uzak = 1) daha soluk ve sade
const SH9_TAC = [['#ffb3cf', '#ff9fc0', '#ffe0ec'], ['#ffd2a8', '#ffc29a', '#fff0dc'], ['#e6d6ff', '#cdb8ff', '#f6efff'], ['#ffc8de', '#f7a8c8', '#fff0f6'], ['#d8f0b0', '#b8e090', '#f4ffe0']];
function sh9Agac(x, px, py, hh, ti, yon, uzak) {
  const T = SH9_TAC[ti % SH9_TAC.length], q = rng(Math.round(px * 7 + hh));
  x.save(); x.translate(px, py); x.lineCap = 'round'; x.lineJoin = 'round';
  if (uzak) {
    x.globalAlpha = 0.85; x.strokeStyle = '#7a8f86'; x.lineWidth = hh * 0.08; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(hh * 0.08 * yon, -hh * 0.35, 0, -hh * 0.6); x.stroke();
    for (const [dx, dy, rr, k] of [[0, -0.74, 0.3, 0], [-0.24, -0.6, 0.22, 1], [0.24, -0.62, 0.22, 1], [-0.06, -0.86, 0.18, 2]]) { x.fillStyle = mixc(T[k], '#cfe8e0', 0.35); x.beginPath(); x.arc(dx * hh, dy * hh, rr * hh, 0, 6.283); x.fill(); }
    x.restore(); return;
  }
  // gövde: tombul, kıvrık, iki dal
  x.strokeStyle = '#6e5446'; x.lineWidth = hh * 0.095; x.beginPath(); x.moveTo(0, hh * 0.02); x.bezierCurveTo(hh * 0.1 * yon, -hh * 0.25, -hh * 0.08 * yon, -hh * 0.45, hh * 0.04 * yon, -hh * 0.62); x.stroke();
  x.strokeStyle = '#8a6a58'; x.lineWidth = hh * 0.07; x.stroke();
  x.lineWidth = hh * 0.04; x.strokeStyle = '#8a6a58'; x.beginPath(); x.moveTo(hh * 0.02 * yon, -hh * 0.44); x.quadraticCurveTo(hh * 0.22 * yon, -hh * 0.52, hh * 0.3 * yon, -hh * 0.66); x.moveTo(0, -hh * 0.5); x.quadraticCurveTo(-hh * 0.18 * yon, -hh * 0.56, -hh * 0.26 * yon, -hh * 0.7); x.stroke();
  x.strokeStyle = 'rgba(255,230,200,0.35)'; x.lineWidth = hh * 0.02; x.beginPath(); x.moveTo(-hh * 0.02, -hh * 0.05); x.bezierCurveTo(hh * 0.06 * yon, -hh * 0.25, -hh * 0.1 * yon, -hh * 0.42, hh * 0.0, -hh * 0.58); x.stroke();
  // taç: koyu alt top, orta, açık üst benekler; aralarda minik çiçekler
  const B = [[0, -0.78, 0.32], [-0.3, -0.68, 0.24], [0.3, -0.7, 0.25], [-0.16, -0.95, 0.22], [0.18, -0.93, 0.23], [0.42, -0.84, 0.16], [-0.42, -0.84, 0.15]];
  x.fillStyle = mixc(T[1], '#6a4a7a', 0.25); x.beginPath(); for (const [dx, dy, rr] of B) { x.moveTo(dx * hh + rr * hh * 1.04, (dy + 0.03) * hh); x.arc(dx * hh, (dy + 0.03) * hh, rr * hh * 1.04, 0, 6.283); } x.fill();
  x.fillStyle = T[1]; x.beginPath(); for (const [dx, dy, rr] of B) { x.moveTo(dx * hh + rr * hh, dy * hh); x.arc(dx * hh, dy * hh, rr * hh, 0, 6.283); } x.fill();
  x.fillStyle = T[0]; x.beginPath(); for (const [dx, dy, rr] of B) { x.moveTo((dx - rr * 0.18) * hh + rr * hh * 0.72, (dy - rr * 0.2) * hh); x.arc((dx - rr * 0.18) * hh, (dy - rr * 0.2) * hh, rr * hh * 0.72, 0, 6.283); } x.fill();
  x.fillStyle = T[2]; x.beginPath(); for (const [dx, dy, rr] of B) { x.moveTo((dx - rr * 0.35) * hh + rr * hh * 0.3, (dy - rr * 0.42) * hh); x.arc((dx - rr * 0.35) * hh, (dy - rr * 0.42) * hh, rr * hh * 0.3, 0, 6.283); } x.fill();
  x.fillStyle = '#fff8fb'; for (let i = 0; i < 22; i++) { const a = q() * 6.283, rr = Math.sqrt(q()) * hh * 0.42, cx = Math.cos(a) * rr * 1.2, cy = -hh * 0.8 + Math.sin(a) * rr * 0.75, fr = hh * (0.012 + q() * 0.012); x.globalAlpha = 0.6 + q() * 0.4; for (let k = 0; k < 5; k++) { const b = k * 1.2566; x.beginPath(); x.arc(cx + Math.cos(b) * fr, cy + Math.sin(b) * fr, fr * 0.75, 0, 6.283); x.fill(); } }
  x.globalAlpha = 1; x.restore();
}
// pul çiçeği (önbelleğe): ejderha pulu gibi yuvarlak uçlu taç yapraklar, yanardöner (dış → iç), parlayan göbek; ince sap, iki yaprak
function sh9PulCicek(x, px, py, rr, ci, sap) {
  const C = SH9_PUL[ci % SH9_PUL.length], fy = py - sap;
  x.lineCap = 'round';
  x.strokeStyle = '#2f7a5a'; x.lineWidth = Math.max(1, rr * 0.16); x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + rr * 0.4, py - sap * 0.5, px, fy); x.stroke();
  for (const sd of [-1, 1]) { x.fillStyle = sd < 0 ? '#3f9f74' : '#4fb884'; x.save(); x.translate(px + rr * 0.15, py - sap * (sd < 0 ? 0.35 : 0.55)); x.rotate(sd * 0.9 - 0.2); x.beginPath(); x.ellipse(rr * 0.5, 0, rr * 0.55, rr * 0.2, 0, 0, 6.283); x.fill(); x.restore(); }
  const pul = (a, L, wdt, col, kenar) => {   // tek pul: yuvarlak uçlu kalkan
    x.save(); x.translate(px, fy); x.rotate(a);
    x.beginPath(); x.moveTo(-wdt * 0.45, 0); x.bezierCurveTo(-wdt * 0.62, -L * 0.55, -wdt * 0.42, -L, 0, -L); x.bezierCurveTo(wdt * 0.42, -L, wdt * 0.62, -L * 0.55, wdt * 0.45, 0); x.closePath();
    x.fillStyle = col; x.fill(); x.strokeStyle = kenar; x.lineWidth = Math.max(0.6, rr * 0.06); x.stroke();
    x.restore();
  };
  for (let k = 0; k < 7; k++) pul(-1.35 + k * 0.45, rr * 1.05, rr * 0.62, C[0], mixc(C[0], '#3a2a6a', 0.35));   // dış halka
  for (let k = 0; k < 5; k++) pul(-0.95 + k * 0.475, rr * 0.78, rr * 0.5, C[1], mixc(C[1], '#ffffff', 0.4, 0.8));  // iç halka
  const gr = x.createRadialGradient(px - rr * 0.1, fy - rr * 0.42, 0, px, fy - rr * 0.3, rr * 0.42); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, C[2]); gr.addColorStop(1, mixc(C[2], C[0], 0.5));
  x.fillStyle = gr; x.beginPath(); x.ellipse(px, fy - rr * 0.32, rr * 0.3, rr * 0.34, 0, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.ellipse(px - rr * 0.1, fy - rr * 0.45, rr * 0.09, rr * 0.06, -0.4, 0, 6.283); x.fill();
}
// kıvrık eğrelti otu (önbelleğe): ana sap ucunda sarmal (koru), iki yanda yuvarlak yaprakçıklar
function sh9Egrelti(x, px, py, L, aci, sd, col, kenar) {
  x.save(); x.translate(px, py); x.rotate(aci); x.lineCap = 'round';
  const N = 22, P0 = [];
  for (let i = 0; i <= N; i++) { const u = i / N, a = u * u * 4.2 * sd, rr = L * (1 - u * 0.82); P0.push([Math.sin(a) * rr * 0.35 * sd + u * L * 0.15 * sd, -u * L * 0.92 + (1 - Math.cos(a)) * rr * 0.12]); }
  x.strokeStyle = col; x.lineWidth = Math.max(1, L * 0.035); x.beginPath(); P0.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke();
  x.fillStyle = col;
  for (let i = 2; i < N - 3; i++) { const [a, b] = P0[i], [c2, d2] = P0[i + 1], an = Math.atan2(d2 - b, c2 - a), lw = L * 0.12 * (1 - i / N); for (const s2 of [-1, 1]) { x.save(); x.translate(a, b); x.rotate(an + s2 * 1.35); x.beginPath(); x.ellipse(lw * 0.9, 0, lw, lw * 0.38, 0, 0, 6.283); x.fill(); x.restore(); } }
  if (kenar) { x.strokeStyle = kenar; x.lineWidth = Math.max(0.6, L * 0.012); x.beginPath(); P0.forEach(([a, b], i) => i ? x.lineTo(a - L * 0.01, b) : x.moveTo(a - L * 0.01, b)); x.stroke(); }
  x.restore();
}
// uçan adacık (önbelleğe): çimenli üst yüz, yosunlu yuvarlak alt, sarkan kökler; (ax, ay) üst yüzün ortası, u yarım en
function sh9Ada(x, ax, ay, u, sd, agacli, selale) {
  const q = rng(sd);
  x.lineCap = 'round'; x.lineJoin = 'round';
  // altı: yumuşak toprak çanağı (yeşim-kahve), katman çizgileri
  const alt = () => { x.beginPath(); x.moveTo(ax - u, ay); x.bezierCurveTo(ax - u * 0.95, ay + u * 0.42, ax - u * 0.35, ay + u * 0.7, ax + u * 0.08, ay + u * 0.92); x.bezierCurveTo(ax + u * 0.4, ay + u * 0.62, ax + u * 0.98, ay + u * 0.4, ax + u, ay); x.closePath(); };
  let gr = x.createLinearGradient(0, ay, 0, ay + u * 0.92); gr.addColorStop(0, '#8a8f74'); gr.addColorStop(0.55, '#76806e'); gr.addColorStop(1, '#5f6c66');
  x.fillStyle = gr; alt(); x.fill();
  x.save(); alt(); x.clip();
  x.strokeStyle = 'rgba(60,70,60,0.28)'; x.lineWidth = Math.max(0.8, u * 0.025);
  for (let k = 1; k <= 3; k++) { x.beginPath(); x.moveTo(ax - u, ay + u * 0.18 * k); x.quadraticCurveTo(ax, ay + u * (0.18 * k + 0.08), ax + u, ay + u * 0.18 * k - u * 0.03); x.stroke(); }
  x.fillStyle = 'rgba(255,214,170,0.22)'; x.beginPath(); x.ellipse(ax - u * 0.5, ay + u * 0.2, u * 0.4, u * 0.25, 0.3, 0, 6.283); x.fill();   // gün ışığı alan yan
  x.fillStyle = 'rgba(111,216,168,0.5)'; for (let k = 0; k < 7; k++) { x.beginPath(); x.arc(ax + (q() - 0.5) * u * 1.4, ay + u * (0.25 + q() * 0.45), u * (0.04 + q() * 0.05), 0, 6.283); x.fill(); }   // yosun benekleri
  x.restore();
  // sarkan kökler: kıvrım kıvrım, uçları minik kıvrık
  x.strokeStyle = '#6a5a4a';
  for (let k = 0; k < 6; k++) {
    const rx = ax + u * (-0.6 + k * 0.24 + (q() - 0.5) * 0.1), t0 = Math.abs(rx - (ax + u * 0.08)) / u, ry = ay + u * (0.92 - t0 * 0.6) - u * 0.05, L = u * (0.3 + q() * 0.4);
    x.lineWidth = Math.max(0.8, u * 0.03); x.beginPath(); x.moveTo(rx, ry); x.bezierCurveTo(rx + u * 0.08, ry + L * 0.4, rx - u * 0.08, ry + L * 0.7, rx + u * 0.02, ry + L);
    for (let m = 1; m <= 8; m++) { const a = m * 0.7, r2 = u * 0.05 * (1 - m / 10); x.lineTo(rx + u * 0.02 + Math.cos(a) * r2 - u * 0.05, ry + L + Math.sin(a) * r2); }
    x.stroke();
    x.fillStyle = '#5fbf80'; x.beginPath(); x.ellipse(rx + u * 0.04, ry + L * 0.45, u * 0.05, u * 0.022, 0.6, 0, 6.283); x.fill();
  }
  // üst yüz: çimen, kenarında sarkan yosun saçakları, fıstık yeşili ışık
  x.fillStyle = '#2e8f6f'; x.beginPath(); x.ellipse(ax, ay, u * 1.03, u * 0.24, 0, 0, 6.283); x.fill();
  x.fillStyle = '#3fbf8a'; x.beginPath(); x.ellipse(ax, ay - u * 0.03, u, u * 0.21, 0, 0, 6.283); x.fill();
  x.fillStyle = '#6fd8a8'; x.beginPath(); x.ellipse(ax - u * 0.12, ay - u * 0.07, u * 0.8, u * 0.14, 0, 0, 6.283); x.fill();
  x.fillStyle = '#3a9f78'; for (let k = 0; k < 9; k++) { const sx = ax + u * (-0.9 + k * 0.225), sy = ay + u * 0.15 * Math.sqrt(1 - Math.pow((sx - ax) / u, 2)); x.beginPath(); x.ellipse(sx, sy + u * 0.04, u * 0.07, u * (0.06 + q() * 0.07), 0, 0, 6.283); x.fill(); }   // yosun saçakları
  x.strokeStyle = 'rgba(200,240,138,0.8)'; x.lineWidth = Math.max(0.8, u * 0.025); x.beginPath(); x.ellipse(ax, ay - u * 0.03, u * 0.98, u * 0.2, 0, Math.PI * 1.08, Math.PI * 1.7); x.stroke();
  // çimen tutamları ve minik çiçekler
  x.strokeStyle = '#2e8f6f'; x.lineWidth = Math.max(0.7, u * 0.018);
  for (let k = 0; k < 10; k++) { const gx = ax + u * (-0.85 + q() * 1.7), gy = ay - u * 0.05 + q() * u * 0.1, gh = u * (0.06 + q() * 0.06); x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx - gh * 0.3, gy - gh); x.moveTo(gx, gy); x.lineTo(gx + gh * 0.3, gy - gh * 0.9); x.stroke(); }
  for (let k = 0; k < 6; k++) { x.fillStyle = SH9_RENK[(k + sd) % 6]; x.beginPath(); x.arc(ax + u * (-0.7 + q() * 1.4), ay - u * (0.02 + q() * 0.08), u * 0.025, 0, 6.283); x.fill(); }
  if (agacli) sh9Agac(x, ax - u * 0.35, ay - u * 0.06, u * 0.95, 0, 1, 0);
  if (agacli) {   // adacığın üstünde minik yaprak yuva ve içinde benekli bir yumurta
    const nx = ax + u * 0.38, ny = ay - u * 0.08;
    x.fillStyle = '#9a6a44'; x.beginPath(); x.ellipse(nx, ny, u * 0.2, u * 0.07, 0, 0, Math.PI); x.fill();
    x.fillStyle = '#ffe2c8'; x.beginPath(); x.ellipse(nx, ny - u * 0.06, u * 0.08, u * 0.1, 0, 0, 6.283); x.fill();
    x.fillStyle = '#b89cff'; x.beginPath(); x.arc(nx - u * 0.025, ny - u * 0.09, u * 0.018, 0, 6.283); x.arc(nx + u * 0.03, ny - u * 0.04, u * 0.014, 0, 6.283); x.fill();
    x.strokeStyle = '#c8925a'; x.lineWidth = Math.max(0.7, u * 0.02); x.beginPath(); x.ellipse(nx, ny, u * 0.2, u * 0.05, 0, 0.1, Math.PI - 0.1); x.stroke();
    x.fillStyle = '#6fd8a8'; x.beginPath(); x.ellipse(nx - u * 0.2, ny - u * 0.01, u * 0.06, u * 0.025, -0.5, 0, 6.283); x.ellipse(nx + u * 0.21, ny - u * 0.01, u * 0.06, u * 0.025, 0.5, 0, 6.283); x.fill();
  }
  if (selale) {   // kenardan dökülen ince su (akış çizgileri canlı katmanda)
    const sx = ax + u * 0.78, sy = ay + u * 0.05, L = u * 2.1;
    gr = x.createLinearGradient(0, sy, 0, sy + L); gr.addColorStop(0, 'rgba(235,252,255,0.9)'); gr.addColorStop(0.6, 'rgba(200,240,250,0.45)'); gr.addColorStop(1, 'rgba(200,240,250,0)');
    x.fillStyle = gr; x.beginPath(); x.moveTo(sx - u * 0.05, sy); x.quadraticCurveTo(sx + u * 0.02, sy + L * 0.5, sx - u * 0.04, sy + L); x.lineTo(sx + u * 0.07, sy + L); x.quadraticCurveTo(sx + u * 0.1, sy + L * 0.5, sx + u * 0.05, sy); x.closePath(); x.fill();
  }
}
// Büyükanne'nin dağının tepesindeki yaprak yuva ve Ejderha Kalbi kristali (önbelleğe; ışıması canlı katmanda nabız atar)
function sh9KalpTasi(x, cx, cy, R) {
  x.save(); x.translate(cx, cy); x.lineJoin = 'round';
  const yol = () => { x.beginPath(); x.moveTo(0, -1.25 * R); x.lineTo(0.55 * R, -0.55 * R); x.lineTo(0.48 * R, 0.32 * R); x.lineTo(0, 0.62 * R); x.lineTo(-0.48 * R, 0.32 * R); x.lineTo(-0.55 * R, -0.55 * R); x.closePath(); };
  yol(); x.strokeStyle = '#6a58a8'; x.lineWidth = R * 0.14; x.stroke();
  const gr = x.createLinearGradient(-0.5 * R, -1.2 * R, 0.5 * R, 0.6 * R); gr.addColorStop(0, '#f6f0ff'); gr.addColorStop(0.3, '#c9b2ff'); gr.addColorStop(0.62, '#8fe8c0'); gr.addColorStop(1, '#ffd27a');
  x.fillStyle = gr; yol(); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = R * 0.06; x.beginPath(); x.moveTo(0, -1.2 * R); x.lineTo(0, 0.58 * R); x.moveTo(-0.53 * R, -0.53 * R); x.lineTo(0, -0.1 * R); x.lineTo(0.53 * R, -0.53 * R); x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.85)'; x.beginPath(); x.moveTo(-0.32 * R, -0.62 * R); x.lineTo(-0.12 * R, -0.95 * R); x.lineTo(-0.1 * R, -0.45 * R); x.closePath(); x.fill();
  x.restore();
}
// sh9Fon üç adımda çizilebilir (tam ekran erime resmi kareler arasında hazırlanırken takılma olmasın); kavanozda tek seferde
function sh9Fon(x, w, h) { sh9FonA(x, w, h); sh9FonB(x, w, h); sh9FonC(x, w, h); }
function sh9FonA(x, w, h) {   // gök, güneş, bulutlar, uzak dağlar, Büyükanne'nin dağı ve yuvası, uçan adacıklar
  const O = sh9Yer(w, h), s = O.s, G = O.gun, Dg = O.dag;
  let gr = x.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#6fcbe6'); gr.addColorStop(0.22, '#a6e0ec'); gr.addColorStop(0.42, '#e8efe0'); gr.addColorStop(0.54, '#ffe2c4'); gr.addColorStop(0.64, '#ffcfae'); gr.addColorStop(1, '#ffc29a');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  gr = x.createRadialGradient(G.x, G.y, 0, G.x, G.y, s * 0.75); gr.addColorStop(0, 'rgba(255,228,160,0.75)'); gr.addColorStop(0.35, 'rgba(255,205,160,0.3)'); gr.addColorStop(1, 'rgba(255,190,170,0)');
  x.fillStyle = gr; x.fillRect(0, 0, w, h);
  // güneşten yelpaze gibi açılan yumuşak ışık huzmeleri
  x.save(); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.95 + i * Math.PI * 0.11, L = s * 1.2, wd = 0.035 + (i % 3) * 0.012; x.fillStyle = `rgba(255,236,190,${0.035 + (i % 2) * 0.025})`; x.beginPath(); x.moveTo(G.x, G.y); x.lineTo(G.x + Math.cos(a - wd) * L, G.y + Math.sin(a - wd) * L); x.lineTo(G.x + Math.cos(a + wd) * L, G.y + Math.sin(a + wd) * L); x.closePath(); x.fill(); }
  x.restore();
  // bulutlar
  for (const [bx, by, br, sd] of [[0.08, 0.12, 0.09, 3], [0.36, 0.08, 0.07, 5], [0.62, 0.11, 0.08, 7], [0.92, 0.2, 0.09, 9], [0.27, 0.45, 0.05, 11]]) {
    if (O.kare && (bx < 0.15 || bx > 0.88)) continue;
    sh9Bulut(x, bx * w, by * h, br * s, sd);
  }
  // güneş: tepelerin ardına alçalmış sıcak disk
  gr = x.createRadialGradient(G.x, G.y, G.r * 0.2, G.x, G.y, G.r); gr.addColorStop(0, '#fffbe8'); gr.addColorStop(0.7, '#fff0c0'); gr.addColorStop(1, '#ffe2a0');
  x.fillStyle = gr; x.beginPath(); x.arc(G.x, G.y, G.r, 0, 6.283); x.fill();
  // uzak lavanta dağlar (iki kat, sisli)
  for (const [y0, A, f, col] of [[0.55, 0.06, 2.3, 'rgba(190,180,232,0.75)'], [0.585, 0.04, 3.7, 'rgba(160,196,214,0.8)']]) {
    x.fillStyle = col; x.beginPath(); x.moveTo(-2, h);
    for (let i = 0; i <= 48; i++) { const px = i / 48 * w; x.lineTo(px, h * y0 - Math.abs(Math.sin(px / s * f + y0 * 9)) * s * A - Math.sin(px / s * f * 2.7) * s * A * 0.2); }
    x.lineTo(w + 2, h); x.fill();
  }
  // Büyükanne'nin dağı: yumuşacık yuvarlak, güneş yanında ışıklı kenar, yosunlu başlık
  const dyol = () => { x.beginPath(); x.moveTo(Dg.x - Dg.g * 1.7, h * 0.64); x.bezierCurveTo(Dg.x - Dg.g * 1.05, h * 0.6, Dg.x - Dg.g * 0.62, Dg.y + s * 0.05, Dg.x - Dg.g * 0.3, Dg.y + s * 0.012); x.quadraticCurveTo(Dg.x, Dg.y - s * 0.012, Dg.x + Dg.g * 0.3, Dg.y + s * 0.012); x.bezierCurveTo(Dg.x + Dg.g * 0.62, Dg.y + s * 0.05, Dg.x + Dg.g * 1.05, h * 0.6, Dg.x + Dg.g * 1.7, h * 0.64); x.lineTo(Dg.x + Dg.g * 1.7, h); x.lineTo(Dg.x - Dg.g * 1.7, h); x.closePath(); };
  gr = x.createLinearGradient(0, Dg.y, 0, h * 0.64); gr.addColorStop(0, '#8fcdbf'); gr.addColorStop(1, '#73aeb0');
  x.fillStyle = gr; dyol(); x.fill();
  x.save(); dyol(); x.clip();
  gr = x.createLinearGradient(Dg.x - Dg.g, 0, Dg.x + Dg.g * 0.4, 0); gr.addColorStop(0, 'rgba(255,226,180,0.45)'); gr.addColorStop(1, 'rgba(255,226,180,0)');
  x.fillStyle = gr; x.fillRect(Dg.x - Dg.g * 1.7, Dg.y - s * 0.02, Dg.g * 2.1, h);
  x.fillStyle = 'rgba(90,150,150,0.35)'; x.beginPath(); x.ellipse(Dg.x + Dg.g * 0.55, Dg.y + s * 0.2, Dg.g * 0.5, s * 0.16, -0.3, 0, 6.283); x.fill();   // gölgeli yamaç
  x.fillStyle = '#6fd8a8'; x.globalAlpha = 0.55; x.beginPath(); x.ellipse(Dg.x, Dg.y + s * 0.02, Dg.g * 0.42, s * 0.035, 0, 0, 6.283); x.fill(); x.globalAlpha = 1;   // yosunlu başlık
  x.strokeStyle = 'rgba(255,240,215,0.55)'; x.lineWidth = Math.max(1, s * 0.004); x.setLineDash([s * 0.008, s * 0.01]); x.beginPath();   // yuvaya kıvrılan patika
  for (let i = 0; i <= 30; i++) { const u = i / 30, a = u * 5.2, px = Dg.x + Math.sin(a) * Dg.g * (0.45 - u * 0.33), py = lerp(h * 0.6, Dg.y + s * 0.05, u); if (i) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke(); x.setLineDash([]);
  x.restore();
  x.strokeStyle = 'rgba(255,236,200,0.6)'; x.lineWidth = Math.max(1, s * 0.004); x.beginPath(); x.moveTo(Dg.x - Dg.g * 1.3, h * 0.615); x.bezierCurveTo(Dg.x - Dg.g * 0.9, h * 0.59, Dg.x - Dg.g * 0.62, Dg.y + s * 0.05, Dg.x - Dg.g * 0.3, Dg.y + s * 0.012); x.stroke();
  // yuva: dev kuş yuvası gibi örgü dallar, kenarında yaprak, pembe battaniye ucu; ortasında Kalp
  const K = O.kalp, nw = Dg.g * 0.36, ny = Dg.y + s * 0.004, nh = s * 0.016;
  gr = x.createRadialGradient(K.x, K.y, 0, K.x, K.y, K.r * 5); gr.addColorStop(0, 'rgba(230,215,255,0.5)'); gr.addColorStop(0.45, 'rgba(200,240,220,0.22)'); gr.addColorStop(1, 'rgba(184,245,216,0)');
  x.fillStyle = gr; x.fillRect(K.x - K.r * 5, K.y - K.r * 5, K.r * 10, K.r * 10);
  x.fillStyle = '#5a3a26'; x.beginPath(); x.ellipse(Dg.x, ny - nh * 0.4, nw * 0.94, nh, 0, 0, 6.283); x.fill();   // yuvanın içi (koyu oyuk)
  x.fillStyle = '#ff9fc0'; x.beginPath(); x.ellipse(Dg.x - nw * 0.45, ny - nh * 0.3, nw * 0.3, nh * 0.55, 0.1, 0, 6.283); x.fill();   // pembe battaniye
  x.fillStyle = '#ffd0e0'; x.beginPath(); x.ellipse(Dg.x - nw * 0.5, ny - nh * 0.5, nw * 0.16, nh * 0.25, 0.1, 0, 6.283); x.fill();
  sh9KalpTasi(x, K.x, K.y, K.r);
  // ön kenar: yaprak döşeli örgü çanak
  const cyol = () => { x.beginPath(); x.moveTo(Dg.x - nw * 1.04, ny - nh * 0.4); x.bezierCurveTo(Dg.x - nw * 0.98, ny + nh * 2.4, Dg.x + nw * 0.98, ny + nh * 2.4, Dg.x + nw * 1.04, ny - nh * 0.4); x.ellipse(Dg.x, ny - nh * 0.4, nw * 1.04, nh * 0.9, 0, 0, Math.PI); x.closePath(); };
  x.fillStyle = '#7a5236'; x.save(); x.translate(0, s * 0.002); cyol(); x.fill(); x.restore();
  x.fillStyle = '#a8744a'; cyol(); x.fill();
  x.save(); cyol(); x.clip(); x.lineCap = 'round';
  for (let k = 0; k < 4; k++) { x.strokeStyle = k % 2 ? '#c8925a' : '#8a5e3c'; x.lineWidth = Math.max(0.8, s * 0.0035); x.beginPath(); for (let i = 0; i <= 16; i++) { const u = i / 16, px = Dg.x + (u * 2 - 1) * nw, py = ny + nh * (0.4 + k * 0.45) + Math.sin(u * 18 + k * 1.7) * nh * 0.18 - Math.pow(u * 2 - 1, 2) * nh * k * 0.3; if (i) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke(); }
  x.restore();
  x.strokeStyle = '#d8a874'; x.lineWidth = Math.max(1, s * 0.004); x.beginPath(); x.ellipse(Dg.x, ny - nh * 0.4, nw * 1.0, nh * 0.85, 0, 0.15, Math.PI - 0.15); x.stroke();   // kenarda ışık
  x.fillStyle = '#6fd8a8'; for (const [dx, dy, an] of [[-1.0, 0.2, -0.9], [1.0, 0.2, 0.9], [0.62, 1.0, 0.35], [-0.5, 1.1, -0.25], [0.1, 1.3, 0.05]]) { x.save(); x.translate(Dg.x + dx * nw, ny + dy * nh); x.rotate(an); x.beginPath(); x.ellipse(0, 0, s * 0.014, s * 0.006, 0, 0, 6.283); x.fill(); x.restore(); }
  // uçan adacıklar
  sh9Ada(x, O.ada2.x, O.ada2.y, O.ada2.u, 4, false, false);
  sh9Ada(x, O.ada.x, O.ada.y, O.ada.u, 2, true, true);
}
function sh9FonB(x, w, h) {   // uzak tepeler ve küçük çiçekli ağaçlar, şelale ve kayası, yakın tepeler
  const O = sh9Yer(w, h), s = O.s, Sl = O.sel;
  let gr = x.createLinearGradient(0, h * 0.5, 0, h * 0.78); gr.addColorStop(0, '#9ad8b4'); gr.addColorStop(1, '#6fc49a');
  x.fillStyle = gr; x.beginPath(); x.moveTo(-2, h); for (let i = 0; i <= 64; i++) { const px = i / 64 * w; x.lineTo(px, sh9Uzak(px, O)); } x.lineTo(w + 2, h); x.fill();
  x.strokeStyle = 'rgba(232,250,200,0.7)'; x.lineWidth = Math.max(1, s * 0.004); x.beginPath(); for (let i = 0; i <= 64; i++) { const px = i / 64 * w; if (i) x.lineTo(px, sh9Uzak(px, O) + 1); else x.moveTo(px, sh9Uzak(px, O) + 1); } x.stroke();
  for (const A of O.ag) if (A[5]) sh9Agac(x, A[0], A[1], A[2], A[3], A[4], 1);
  // şelalenin kayası: suyun ardında yumuşak kaya duvarı, iki yanda üst üste yosunlu yuvarlak kayalar
  const kx = Sl.x, ku = Sl.u;
  x.fillStyle = '#5f9486'; x.beginPath(); x.moveTo(kx - ku * 1.9, Sl.y1); x.lineTo(kx - ku * 1.5, Sl.y0 + s * 0.006); x.quadraticCurveTo(kx, Sl.y0 - s * 0.014, kx + ku * 1.5, Sl.y0 + s * 0.006); x.lineTo(kx + ku * 1.9, Sl.y1); x.closePath(); x.fill();
  const kaya = (cx, cy, rx, ry) => {
    x.fillStyle = '#4f8073'; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 6.283); x.fill();
    x.fillStyle = '#6f9f8e'; x.beginPath(); x.ellipse(cx - rx * 0.08, cy - ry * 0.1, rx * 0.9, ry * 0.86, 0, 0, 6.283); x.fill();
    x.fillStyle = 'rgba(255,226,180,0.28)'; x.beginPath(); x.ellipse(cx - rx * 0.35, cy - ry * 0.3, rx * 0.4, ry * 0.32, -0.3, 0, 6.283); x.fill();
    x.fillStyle = '#4fae78'; x.beginPath(); x.ellipse(cx - rx * 0.05, cy - ry * 0.72, rx * 0.8, ry * 0.32, 0, 0, 6.283); x.fill();   // yosun başlık
    x.fillStyle = '#7fd89a'; x.beginPath(); x.ellipse(cx - rx * 0.18, cy - ry * 0.82, rx * 0.5, ry * 0.16, 0, 0, 6.283); x.fill();
    x.fillStyle = '#4fae78'; for (let k = 0; k < 4; k++) { x.beginPath(); x.ellipse(cx + rx * (-0.6 + k * 0.4), cy - ry * 0.48, rx * 0.09, ry * (0.14 + 0.06 * (k % 2)), 0, 0, 6.283); x.fill(); }   // sarkan yosun
  };
  for (const sd of [-1, 1]) {
    kaya(kx + sd * ku * 1.75, Sl.y0 + s * 0.016, ku * 0.95, s * 0.026);
    kaya(kx + sd * ku * 2.15, Sl.ym + s * 0.012, ku * 1.25, s * 0.036);
    kaya(kx + sd * ku * 2.6, Sl.y1 - s * 0.018, ku * 1.55, s * 0.038);
  }
  // su perdesi: üst basamak ve daha geniş alt basamak, kenarlara doğru saydam, ortası ışıl ışıl
  const perde = (y0, y1, a0, a1) => {
    gr = x.createLinearGradient(kx - a1, 0, kx + a1, 0); gr.addColorStop(0, 'rgba(190,240,245,0.35)'); gr.addColorStop(0.3, 'rgba(230,252,255,0.9)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.8, 'rgba(210,246,250,0.85)'); gr.addColorStop(1, 'rgba(190,240,245,0.35)');
    x.fillStyle = gr; x.beginPath(); x.moveTo(kx - a0, y0); x.bezierCurveTo(kx - a0 * 1.05, lerp(y0, y1, 0.4), kx - a1, lerp(y0, y1, 0.7), kx - a1, y1); x.lineTo(kx + a1, y1); x.bezierCurveTo(kx + a1, lerp(y0, y1, 0.7), kx + a0 * 1.05, lerp(y0, y1, 0.4), kx + a0, y0); x.closePath(); x.fill();
  };
  perde(Sl.y0, Sl.ym, ku * 0.85, ku * 1.05);
  x.fillStyle = '#6aa892'; x.beginPath(); x.ellipse(kx, Sl.ym + s * 0.004, ku * 1.6, s * 0.012, 0, 0, 6.283); x.fill();   // ara basamak
  x.fillStyle = '#5fbf80'; x.beginPath(); x.ellipse(kx - ku * 0.9, Sl.ym - s * 0.002, ku * 0.6, s * 0.006, 0, 0, 6.283); x.fill();
  perde(Sl.ym + s * 0.004, Sl.y1, ku * 1.15, ku * 1.45);
  x.fillStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < 7; k++) { x.beginPath(); x.arc(kx + (k - 3) * ku * 0.36, Sl.ym + s * 0.008 + Math.sin(k * 1.7) * s * 0.003, ku * 0.22, 0, 6.283); x.fill(); }   // basamakta köpük
  // yakın tepeler: yeşim yeşili, fıstık yeşili ışıklı sırt
  gr = x.createLinearGradient(0, h * 0.68, 0, h * 0.9); gr.addColorStop(0, '#5fc99a'); gr.addColorStop(1, '#3fae84');
  x.fillStyle = gr; x.beginPath(); x.moveTo(-2, h); for (let i = 0; i <= 64; i++) { const px = i / 64 * w; x.lineTo(px, sh9Yakin(px, O)); } x.lineTo(w + 2, h); x.fill();
  x.strokeStyle = 'rgba(200,240,138,0.85)'; x.lineWidth = Math.max(1, s * 0.005); x.beginPath(); for (let i = 0; i <= 64; i++) { const px = i / 64 * w; if (i) x.lineTo(px, sh9Yakin(px, O) + 1.2); else x.moveTo(px, sh9Yakin(px, O) + 1.2); } x.stroke();
  // şelalenin gölü: turkuaz, beyaz köpük halkası
  x.fillStyle = '#7fe0f0'; x.beginPath(); x.ellipse(kx, Sl.y1, ku * 3.2, s * 0.018, 0, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.55)'; x.beginPath(); x.ellipse(kx - ku * 0.6, Sl.y1 - s * 0.004, ku * 1.6, s * 0.006, 0, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.92)'; for (let k = 0; k < 8; k++) { x.beginPath(); x.arc(kx + (k - 3.5) * ku * 0.42, Sl.y1 - s * 0.002 + Math.sin(k * 2.1) * s * 0.003, ku * (0.28 + 0.08 * Math.sin(k)), 0, 6.283); x.fill(); }
  // iki büyük çiçekli ağaç (resmi kenarlardan çerçeveler)
  for (const A of O.ag) if (!A[5]) sh9Agac(x, A[0], A[1], A[2], A[3], A[4], 0);
}
function sh9FonC(x, w, h) {   // önde çayır: pul çiçekleri, minik çiçekler, yosunlu taşlar, kıvrık eğreltiler
  const O = sh9Yer(w, h), s = O.s, Y = O.yv;
  let gr = x.createLinearGradient(0, h * 0.8, 0, h); gr.addColorStop(0, '#4cc08c'); gr.addColorStop(0.5, '#38a57a'); gr.addColorStop(1, '#2e8f6f');
  x.fillStyle = gr; x.beginPath(); x.moveTo(-2, h); for (let i = 0; i <= 64; i++) { const px = i / 64 * w; x.lineTo(px, sh9Cayir(px, O)); } x.lineTo(w + 2, h); x.fill();
  x.strokeStyle = 'rgba(200,240,138,0.75)'; x.lineWidth = Math.max(1, s * 0.004); x.beginPath(); for (let i = 0; i <= 64; i++) { const px = i / 64 * w; if (i) x.lineTo(px, sh9Cayir(px, O) + 1); else x.moveTo(px, sh9Cayir(px, O) + 1); } x.stroke();
  // çayıra düşen altın ışık lekesi (güneş tarafı)
  gr = x.createRadialGradient(O.gun.x, h * 0.86, 0, O.gun.x, h * 0.86, s * 0.5); gr.addColorStop(0, 'rgba(255,226,150,0.28)'); gr.addColorStop(1, 'rgba(255,226,150,0)');
  x.fillStyle = gr; x.fillRect(0, h * 0.78, w, h * 0.22);
  // minik çiçekler
  for (const [px, py, pr, ci] of O.cic) { x.fillStyle = ['#ffe9f2', '#ffd27a', '#d9c8ff', '#ff9fc0', '#ffffff'][ci]; x.beginPath(); x.arc(px, py, pr, 0, 6.283); x.fill(); }
  // yavrunun oturduğu yosunlu tümsek ve yanında yuvarlak taş
  x.fillStyle = 'rgba(30,90,60,0.35)'; x.beginPath(); x.ellipse(Y.x + Y.u * 0.6, Y.y + Y.u * 0.12, Y.u * 2.4, Y.u * 0.3, 0, 0, 6.283); x.fill();
  x.fillStyle = '#86a48e'; x.beginPath(); x.ellipse(Y.x - Y.u * 1.9, Y.y - Y.u * 0.3, Y.u * 0.75, Y.u * 0.55, 0, 0, 6.283); x.fill();
  x.fillStyle = '#a2bfa6'; x.beginPath(); x.ellipse(Y.x - Y.u * 2.05, Y.y - Y.u * 0.45, Y.u * 0.42, Y.u * 0.28, -0.3, 0, 6.283); x.fill();
  x.fillStyle = '#5fbf80'; x.beginPath(); x.ellipse(Y.x - Y.u * 1.85, Y.y - Y.u * 0.78, Y.u * 0.55, Y.u * 0.16, 0.1, 0, 6.283); x.fill();
  // yumurtanın yaprak yuvası
  const M = O.yum;
  x.fillStyle = '#9a6a44'; x.beginPath(); x.ellipse(M.x, M.y, M.u * 1.35, M.u * 0.38, 0, 0, 6.283); x.fill();
  x.strokeStyle = '#c8925a'; x.lineWidth = Math.max(0.8, M.u * 0.08); x.lineCap = 'round'; for (let k = 0; k < 6; k++) { const u0 = -1.1 + k * 0.42; x.beginPath(); x.moveTo(M.x + u0 * M.u, M.y - M.u * 0.12); x.quadraticCurveTo(M.x + (u0 + 0.2) * M.u, M.y + M.u * 0.2, M.x + (u0 + 0.4) * M.u, M.y - M.u * 0.05); x.stroke(); }
  x.fillStyle = '#6fd8a8'; for (const sd of [-1, 1]) { x.save(); x.translate(M.x + sd * M.u * 1.25, M.y - M.u * 0.08); x.rotate(sd * 0.5); x.beginPath(); x.ellipse(sd * M.u * 0.25, 0, M.u * 0.38, M.u * 0.13, 0, 0, 6.283); x.fill(); x.restore(); }
  // pul çiçekleri
  for (const [px, py, rr, ci, sap] of O.pc) sh9PulCicek(x, px, py, rr, ci, sap);
  // kıvrık eğreltiler ve çimen tutamları (kenarlarda)
  sh9Egrelti(x, w * (O.kare ? 0.16 : 0.1), h * 1.01, s * 0.15, -0.35, 1, '#2f7a5a', 'rgba(200,240,138,0.5)');
  sh9Egrelti(x, w * (O.kare ? 0.86 : 0.93), h * 1.01, s * 0.14, 0.35, -1, '#2f7a5a', 'rgba(200,240,138,0.5)');
  if (!O.kare) { sh9Egrelti(x, w * 0.02, h * 1.0, s * 0.11, -0.1, 1, '#2a6e52', null); sh9Egrelti(x, w * 0.75, h * 1.01, s * 0.1, 0.25, -1, '#2a6e52', null); }
  x.strokeStyle = '#2f8a64'; x.lineWidth = Math.max(1, s * 0.0035); x.lineCap = 'round';
  { const q = rng(19); for (let i = 0; i < Math.ceil(w / s * 16); i++) { const px = q() * w, py = h * (0.97 + q() * 0.04), hh = s * (0.015 + q() * 0.02); if (Math.abs(px - Y.x) < Y.u * 1.5) continue; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + hh * 0.2, py - hh * 0.6, px + hh * 0.35 * (q() - 0.3), py - hh); x.moveTo(px, py); x.quadraticCurveTo(px - hh * 0.25, py - hh * 0.5, px - hh * 0.4, py - hh * 0.8); x.stroke(); } }
}
// minik yavru ejderha (canlı; g üzerinde): (px, py) taban ortası, u gövde birimi. Pırıl'ın ailesinden: leylak tombul gövde, fıstık
// yeşili çizgili karın, koyu yeşil yumuşak ibik, açık yeşil yüzgeç kulaklar, iri yeşil gözler, pembe yanaklar, minik iki diş; başında
// yumurta kabuğu şapka. kirp 0..1 (1 kapalı), kanat -1..1 çırpış, kuyruk -1..1 sallanış, egim baş eğimi, nf nefes 0..1
const SH9_YV = { L: '#6a4fb8', G: '#c9b2ff', GA: '#ddd0ff', K: '#e8f6b4', KC: '#c4dc84', IB: '#3f9a6a', KU: '#a8eac0', KUC: '#5fb88a' };
function sh9Yavru(px, py, u, kirp, kanat, kuyruk, egim, nf, al) {
  if (al <= 0.01 || u < 1.2) return;
  const C = SH9_YV;
  g.save(); g.translate(px, py); g.scale(u, u); g.globalAlpha = al; g.lineJoin = 'round'; g.lineCap = 'round';
  g.fillStyle = 'rgba(20,70,50,0.3)'; g.beginPath(); g.ellipse(0.1, 0.02, 1.05, 0.15, 0, 0, 6.283); g.fill();   // gölge
  // kuyruk: sağ arkadan kıvrılır, ucunda yaprak gibi yumuşak yüzgeç
  g.save(); g.translate(0.5, -0.3); g.rotate(kuyruk * 0.22);
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(0.85, 0.12, 1.0, -0.42); g.quadraticCurveTo(1.06, -0.72, 0.84, -0.8);
  g.strokeStyle = C.L; g.lineWidth = 0.42; g.stroke(); g.strokeStyle = C.G; g.lineWidth = 0.3; g.stroke();
  g.fillStyle = C.IB; g.beginPath(); g.moveTo(0.84, -0.8); g.quadraticCurveTo(0.6, -1.05, 0.78, -1.22); g.quadraticCurveTo(1.02, -1.05, 0.84, -0.8); g.fill();
  g.restore();
  // kanatlar (arkada): omuzlardan minik yuvarlak kanatlar, çırpar
  for (const sd of [-1, 1]) {
    g.save(); g.translate(sd * 0.5, -1.22); g.rotate(sd * (-0.35 - kanat * 0.4)); g.scale(sd, 1);
    const kyol = () => { g.beginPath(); g.moveTo(0, 0.05); g.quadraticCurveTo(0.3, -0.72, 0.92, -0.72); g.quadraticCurveTo(0.84, -0.42, 0.96, -0.2); g.quadraticCurveTo(0.66, -0.16, 0.66, 0.04); g.quadraticCurveTo(0.36, -0.02, 0.1, 0.16); g.closePath(); };
    kyol(); g.fillStyle = C.L; g.save(); g.lineWidth = 0.12; g.strokeStyle = C.L; g.stroke(); g.restore(); g.fill();
    kyol(); g.fillStyle = C.KU; g.save(); g.translate(0.05, 0); g.scale(0.9, 0.88); g.fill(); g.restore();
    g.strokeStyle = C.KUC; g.lineWidth = 0.05; g.beginPath(); g.moveTo(0.08, 0.02); g.quadraticCurveTo(0.42, -0.4, 0.86, -0.66); g.moveTo(0.12, 0.04); g.quadraticCurveTo(0.5, -0.2, 0.88, -0.24); g.stroke();
    g.restore();
  }
  // gövde: armut gibi tombul (nefesle hafifçe şişer)
  const bs = 1 + 0.025 * nf;
  g.fillStyle = C.L; g.beginPath(); g.ellipse(0, -0.86, 0.8 * bs, 0.88, 0, 0, 6.283); g.fill();
  g.fillStyle = C.G; g.beginPath(); g.ellipse(0, -0.86, 0.73 * bs, 0.81, 0, 0, 6.283); g.fill();
  g.fillStyle = C.GA; g.beginPath(); g.ellipse(-0.24, -1.12, 0.36, 0.3, -0.3, 0, 6.283); g.fill();
  g.fillStyle = C.K; g.beginPath(); g.ellipse(0.02, -0.72, 0.46 * bs, 0.58, 0, 0, 6.283); g.fill();   // karın
  g.strokeStyle = C.KC; g.lineWidth = 0.055; g.beginPath(); for (const yy of [-1.02, -0.82, -0.62, -0.42]) { const hw = 0.4 * Math.sqrt(Math.max(0, 1 - Math.pow((yy + 0.72) / 0.58, 2))); g.moveTo(0.02 - hw, yy); g.quadraticCurveTo(0.02, yy + 0.07, 0.02 + hw, yy); } g.stroke();
  // ayaklar: tombul, üç yuvarlak parmak (pençe yok)
  for (const sd of [-1, 1]) {
    g.fillStyle = C.L; g.beginPath(); g.ellipse(sd * 0.38, -0.09, 0.27, 0.16, 0, 0, 6.283); g.fill();
    g.fillStyle = C.G; g.beginPath(); g.ellipse(sd * 0.38, -0.11, 0.23, 0.12, 0, 0, 6.283); g.fill();
    g.fillStyle = C.GA; g.beginPath(); for (let k = -1; k <= 1; k++) { g.moveTo(sd * 0.38 + k * 0.1 + 0.045, -0.04); g.arc(sd * 0.38 + k * 0.1, -0.04, 0.045, 0, 6.283); } g.fill();
  }
  // kısa kollar: karnın önünde birleşir
  for (const sd of [-1, 1]) { g.strokeStyle = C.L; g.lineWidth = 0.25; g.beginPath(); g.moveTo(sd * 0.5, -1.16); g.quadraticCurveTo(sd * 0.48, -0.92, sd * 0.24, -0.86); g.stroke(); g.strokeStyle = C.G; g.lineWidth = 0.17; g.stroke(); }
  // baş: iri, yuvarlak, hafif yana yatık
  g.save(); g.translate(0, -1.76); g.rotate(egim);
  for (const sd of [-1, 1]) {   // yüzgeç kulaklar
    g.save(); g.translate(sd * 0.7, -0.16); g.rotate(sd * (0.45 + 0.05 * Math.sin(kanat * 2))); g.scale(sd, 1);
    const fyol = () => { g.beginPath(); g.moveTo(0, 0.12); g.quadraticCurveTo(0.22, -0.42, 0.58, -0.48); g.quadraticCurveTo(0.44, -0.24, 0.6, -0.04); g.quadraticCurveTo(0.4, 0.04, 0.5, 0.22); g.quadraticCurveTo(0.22, 0.26, 0, 0.12); g.closePath(); };
    fyol(); g.strokeStyle = C.L; g.lineWidth = 0.11; g.stroke(); g.fillStyle = C.KU; g.fill();
    g.strokeStyle = C.KUC; g.lineWidth = 0.045; g.beginPath(); g.moveTo(0.06, 0.1); g.lineTo(0.46, -0.36); g.moveTo(0.08, 0.12); g.lineTo(0.5, -0.02); g.stroke();
    g.restore();
  }
  // ibik: başın tepesinde üç yumuşak dilim (koyu yeşil)
  g.fillStyle = C.L; g.beginPath(); for (const [cx, cy, cr] of [[-0.3, -0.6, 0.19], [0.0, -0.72, 0.22], [0.3, -0.62, 0.18]]) { g.moveTo(cx + cr + 0.05, cy); g.arc(cx, cy, cr + 0.05, 0, 6.283); } g.fill();
  g.fillStyle = C.IB; g.beginPath(); for (const [cx, cy, cr] of [[-0.3, -0.6, 0.19], [0.0, -0.72, 0.22], [0.3, -0.62, 0.18]]) { g.moveTo(cx + cr, cy); g.arc(cx, cy, cr, 0, 6.283); } g.fill();
  g.fillStyle = 'rgba(160,230,180,0.5)'; g.beginPath(); g.arc(-0.05, -0.8, 0.07, 0, 6.283); g.fill();
  // kafa
  g.fillStyle = C.L; g.beginPath(); g.ellipse(0, 0, 0.87, 0.75, 0, 0, 6.283); g.fill();
  g.fillStyle = C.G; g.beginPath(); g.ellipse(0, 0, 0.8, 0.68, 0, 0, 6.283); g.fill();
  g.fillStyle = C.GA; g.beginPath(); g.ellipse(-0.3, -0.32, 0.34, 0.18, -0.35, 0, 6.283); g.fill();
  g.fillStyle = '#e6dcff'; g.beginPath(); g.ellipse(0, 0.3, 0.44, 0.27, 0, 0, 6.283); g.fill();   // burun (ağızlık)
  g.fillStyle = '#8a70d0'; g.beginPath(); g.ellipse(-0.12, 0.2, 0.04, 0.03, 0, 0, 6.283); g.ellipse(0.12, 0.2, 0.04, 0.03, 0, 0, 6.283); g.fill();
  // gözler: iri, yeşil, iki parlak benek; kırpınca mutlu yay
  const ac = 1 - kirp;
  for (const sd of [-1, 1]) {
    const ex = sd * 0.35, ey = -0.08;
    if (ac > 0.25) {
      g.fillStyle = '#26324a'; g.beginPath(); g.ellipse(ex, ey, 0.18, 0.22 * ac, 0, 0, 6.283); g.fill();
      g.fillStyle = '#3fae74'; g.beginPath(); g.ellipse(ex + 0.01, ey + 0.04 * ac, 0.13, 0.15 * ac, 0, 0, 6.283); g.fill();
      g.fillStyle = '#1a2438'; g.beginPath(); g.ellipse(ex + 0.01, ey + 0.05 * ac, 0.07, 0.09 * ac, 0, 0, 6.283); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ex - 0.06, ey - 0.08 * ac, 0.06, 0, 6.283); g.arc(ex + 0.06, ey + 0.08 * ac, 0.028, 0, 6.283); g.fill();
    } else { g.strokeStyle = '#26324a'; g.lineWidth = 0.07; g.beginPath(); g.moveTo(ex - 0.16, ey + 0.02); g.quadraticCurveTo(ex, ey - 0.13, ex + 0.16, ey + 0.02); g.stroke(); }
  }
  g.fillStyle = 'rgba(255,130,180,0.55)'; g.beginPath(); g.ellipse(-0.54, 0.16, 0.14, 0.08, 0, 0, 6.283); g.ellipse(0.54, 0.16, 0.14, 0.08, 0, 0, 6.283); g.fill();
  g.strokeStyle = C.L; g.lineWidth = 0.055; g.beginPath(); g.moveTo(-0.17, 0.36); g.quadraticCurveTo(0, 0.5, 0.17, 0.36); g.stroke();   // gülümseme
  g.fillStyle = '#ffffff'; shRR(g, -0.085, 0.405, 0.06, 0.065, 0.02); g.fill(); shRR(g, 0.025, 0.405, 0.06, 0.065, 0.02); g.fill();   // minik iki diş (yuvarlak)
  // yumurta kabuğu şapka: yana yatık, kırık kenarlı, şeftali benekli
  g.save(); g.translate(0.1, -0.56); g.rotate(0.22 + egim * 0.4);
  const syol = () => { g.beginPath(); g.moveTo(-0.5, 0.06); for (let k = 1; k <= 7; k++) g.lineTo(-0.5 + k * (1 / 7), k % 2 ? -0.06 : 0.06); g.bezierCurveTo(0.52, -0.42, 0.24, -0.72, 0, -0.72); g.bezierCurveTo(-0.24, -0.72, -0.52, -0.42, -0.5, 0.06); g.closePath(); };
  syol(); g.strokeStyle = '#c9a07a'; g.lineWidth = 0.1; g.stroke(); g.fillStyle = '#fff4e0'; g.fill();
  g.fillStyle = '#ffc29a'; g.beginPath(); g.ellipse(-0.2, -0.32, 0.08, 0.06, 0.3, 0, 6.283); g.moveTo(0.24, -0.46); g.ellipse(0.18, -0.46, 0.06, 0.05, 0, 0, 6.283); g.moveTo(0.29, -0.16); g.ellipse(0.24, -0.16, 0.05, 0.04, 0, 0, 6.283); g.fill();
  g.fillStyle = '#d9c8ff'; g.beginPath(); g.ellipse(-0.02, -0.56, 0.05, 0.04, 0, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 0.06; g.beginPath(); g.arc(-0.05, -0.32, 0.3, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
  g.restore();
  g.restore();   // baş
  g.restore(); g.globalAlpha = 1;
}
// ılık ejderha yumurtası (canlı): benekli şeftali, hafif sallanır; (px, py) taban ortası, u yarım en
function sh9Yumurta(px, py, u, sal, isik, al) {
  if (al <= 0.01 || u < 0.8) return;
  g.save(); g.translate(px, py); g.rotate(sal * 0.12); g.scale(u, u); g.globalAlpha = al;
  g.fillStyle = '#d8946a'; g.beginPath(); g.ellipse(0, -1.0, 0.8, 1.06, 0, 0, 6.283); g.fill();
  g.fillStyle = mixc('#ffd8b8', '#ffe8cc', isik); g.beginPath(); g.ellipse(0, -1.0, 0.74, 1.0, 0, 0, 6.283); g.fill();
  g.fillStyle = 'rgba(255,170,130,0.55)'; g.beginPath(); g.ellipse(0.2, -0.75, 0.48, 0.65, 0, 0, 6.283); g.fill();
  g.fillStyle = '#b89cff'; g.beginPath(); g.arc(-0.28, -1.3, 0.12, 0, 6.283); g.moveTo(0.4, -0.9); g.arc(0.3, -0.9, 0.1, 0, 6.283); g.moveTo(-0.02, -0.55); g.arc(-0.1, -0.55, 0.08, 0, 6.283); g.fill();
  g.fillStyle = '#6fd8a8'; g.beginPath(); g.arc(0.18, -1.45, 0.08, 0, 6.283); g.arc(-0.38, -0.85, 0.07, 0, 6.283); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(-0.3, -1.5, 0.14, 0.24, -0.4, 0, 6.283); g.fill();
  g.restore(); g.globalAlpha = 1;
}
// uzakta süzülen yetişkin ejderha (canlı siluet): yuvarlak baş, kısa yüzgeç kulak, geniş yumuşak kanatlar, kıvrık kuyruk
function sh9UzakEjder(px, py, u, k, yon, col, al) {
  if (al <= 0.01 || u < 0.8) return;
  g.save(); g.translate(px, py); g.scale(yon * u, u); g.globalAlpha = al; g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  g.lineWidth = 0.5; g.beginPath(); g.moveTo(-1.0, 0.1); g.quadraticCurveTo(-2.1, 0.3, -2.4, -0.3); g.stroke();   // kuyruk
  g.beginPath(); g.ellipse(-0.1, 0, 1.15, 0.55, -0.08, 0, 6.283); g.fill();   // gövde
  g.lineWidth = 0.55; g.beginPath(); g.moveTo(0.8, -0.15); g.quadraticCurveTo(1.25, -0.45, 1.35, -0.75); g.stroke();   // boyun
  g.beginPath(); g.arc(1.5, -0.85, 0.5, 0, 6.283); g.fill();   // baş
  g.beginPath(); g.ellipse(1.95, -0.75, 0.32, 0.22, 0.2, 0, 6.283); g.fill();   // burun
  g.beginPath(); g.moveTo(1.3, -1.2); g.quadraticCurveTo(1.15, -1.65, 0.85, -1.6); g.quadraticCurveTo(1.05, -1.35, 1.1, -1.1); g.fill();   // yüzgeç kulak
  const kk = k * 0.9;   // kanat: omuzdan yukarı-aşağı çırpar
  g.beginPath(); g.moveTo(0.4, -0.35); g.quadraticCurveTo(0.1, -1.6 * kk - 0.3, -0.9, -2.2 * kk - 0.1); g.quadraticCurveTo(-0.6, -1.0 * kk - 0.2, -1.2, -0.9 * kk); g.quadraticCurveTo(-0.6, -0.5, -0.4, -0.3); g.closePath(); g.fill();
  g.restore(); g.globalAlpha = 1;
}
function sh9Canli(ox, oy, w, h, tm, a, hov) {
  if (a <= 0.01) return;
  hov = hov || 0;
  const O = sh9Yer(w, h), s = O.s, hz = 1 + 0.35 * hov, t = tm * hz, G = O.gun, K = O.kalp, Sl = O.sel;
  g.save(); g.lineCap = 'round';
  g.globalCompositeOperation = 'lighter';
  // 1) güneş yumuşakça nefes alır
  dglow('#ffe6a8', ox + G.x, oy + G.y, G.r * (3.2 + 0.25 * Math.sin(tm * 0.6)), a * 0.22);
  dglow('#fff6d8', ox + G.x, oy + G.y, G.r * 1.3, a * 0.22);
  // 2) Ejderha Kalbi: kalp gibi çift vuruşlu ışık nabzı (lila-altın-nane), çevresinde dönen parıltılar
  const nb = Math.pow(Math.max(0, Math.sin(t * 2.0)), 10) + 0.6 * Math.pow(Math.max(0, Math.sin(t * 2.0 - 0.55)), 10), np = 0.75 + 0.25 * Math.sin(t * 0.9);
  dglow('#b89cff', ox + K.x, oy + K.y, K.r * (5 + 1.5 * nb), a * (0.3 + 0.22 * nb) * np);
  dglow('#ffd27a', ox + K.x, oy + K.y - K.r * 0.3, K.r * (2.4 + nb), a * (0.2 + 0.15 * nb));
  dglow('#7fe0c0', ox + K.x, oy + K.y, K.r * 1.4, a * (0.18 + 0.22 * nb));
  for (let i = 0; i < 4; i++) { const an = t * 0.8 + i * 1.571, tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7); shParilti(ox + K.x + Math.cos(an) * K.r * 2.2, oy + K.y - K.r * 0.3 + Math.sin(an) * K.r * 1.1, K.r * 0.5 * (0.5 + tw), a * (0.4 + 0.5 * tw)); }
  // 3) patikadaki fenerler göz kırpar
  for (const [lx, ly, i] of O.lam) { const tw = 0.6 + 0.4 * Math.sin(t * 1.7 + i * 2.3); dglow('#ffd27a', ox + lx, oy + ly, s * 0.012, a * 0.55 * tw); }
  // 4) şelale: akan ışık çizgileri, basamakta ve gölde köpük, yükselen su tozu (gökkuşağı değil: ışıltı)
  for (let k = 0; k < 14; k++) {
    const ust = k < 6, y0 = ust ? Sl.y0 : Sl.ym + s * 0.004, y1 = ust ? Sl.ym : Sl.y1, hw = ust ? Sl.u * 0.85 : Sl.u * 1.25, lane = sh9Hs(k + 5) * 2 - 1;
    const uu = (t * (0.55 + 0.25 * sh9Hs(k + 31)) + sh9Hs(k + 17)) % 1, py = lerp(y0, y1, uu), L = (y1 - y0) * 0.22, px = Sl.x + lane * hw * (0.85 + uu * 0.2);
    g.globalAlpha = a * 0.55 * Math.sin(uu * Math.PI); g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(0.8, s * 0.0035);
    g.beginPath(); g.moveTo(ox + px, oy + py); g.lineTo(ox + px + lane * s * 0.001, oy + Math.min(y1, py + L)); g.stroke();
  }
  g.globalAlpha = 1;
  for (let k = 0; k < 6; k++) { const ph = t * 1.6 + k * 1.3, rr = Sl.u * (0.5 + 0.25 * Math.sin(ph)); dglow('#ffffff', ox + Sl.x + (k - 2.5) * Sl.u * 0.55, oy + Sl.y1 - s * 0.006 + Math.sin(ph * 0.7) * s * 0.003, rr, a * 0.45); }
  dglow('#e8fbff', ox + Sl.x, oy + Sl.ym, Sl.u * 2.2, a * 0.25 * (0.8 + 0.2 * Math.sin(t * 1.3)));
  for (let k = 0; k < 5; k++) { const uu = (t * 0.12 + k / 5) % 1; dglow('#e8fbff', ox + Sl.x + Math.sin(k * 2.3 + t * 0.4) * Sl.u * 1.8, oy + Sl.y1 - uu * s * 0.12, Sl.u * (1.2 + uu * 1.5), a * 0.22 * Math.sin(uu * Math.PI)); if (k % 2 === 0) shParilti(ox + Sl.x + Math.cos(k * 1.9 + t) * Sl.u * 2, oy + Sl.y1 - uu * s * 0.1, s * 0.008, a * Math.sin(uu * Math.PI) * 0.8); }
  // adacığın ince şelalesi
  { const A = O.ada, sx = A.x + A.u * 0.8, sy = A.y + A.u * 0.05, L = A.u * 2.1;
    for (let k = 0; k < 4; k++) { const uu = (t * 0.5 + k / 4) % 1; g.globalAlpha = a * 0.6 * Math.sin(uu * Math.PI); g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(0.7, A.u * 0.025); g.beginPath(); g.moveTo(ox + sx, oy + sy + uu * L * 0.8); g.lineTo(ox + sx, oy + sy + uu * L * 0.8 + L * 0.12); g.stroke(); }
    g.globalAlpha = 1;
    dglow('#b8f5d8', ox + A.x, oy + A.y + A.u * 0.5, A.u * 1.4, a * 0.12 * (0.8 + 0.2 * Math.sin(t * 0.7)));   // adacığın altında usul ışık
    for (let k = 0; k < 3; k++) { const uu = (t * 0.18 + k / 3) % 1; shParilti(ox + A.x + A.u * (-0.5 + k * 0.4), oy + A.y + A.u * (0.8 + uu * 1.2), A.u * 0.06, a * Math.sin(uu * Math.PI) * 0.8); }   // köklerden süzülen ışık tozu
  }
  // 5) pul çiçekleri usulca ışır
  for (let i = 0; i < O.pc.length; i++) { const [px, py, rr, ci, sap] = O.pc[i], tw = 0.6 + 0.4 * Math.sin(t * 1.4 + i * 1.9); dglow(SH9_PUL[ci][0], ox + px, oy + py - sap - rr * 0.3, rr * 2.4, a * 0.32 * tw); if (i % 2 === 0) shParilti(ox + px + rr * 0.3, oy + py - sap - rr * 0.6, rr * 0.4 * tw, a * tw * 0.8); }
  // 6) ışık tozu: çayırdan yükselen pastel tanecikler (böcek değil, yumuşak ışık zerresi)
  for (let i = 0; i < 12; i++) {
    const r1 = sh9Hs(i * 3 + 501), r2 = sh9Hs(i * 3 + 502), u = (tm * (0.05 + 0.03 * r2) * hz + r1) % 1, px = w * ((r1 * 1.7 + r2) % 1) + Math.sin(tm * 0.7 + i) * s * 0.02, py = h * (0.95 - u * 0.5);
    const al = a * Math.sin(u * Math.PI) * (0.5 + 0.5 * Math.sin(tm * 2.1 + i * 1.3));
    dglow(SH9_RENK[i % 6], ox + px, oy + py, s * (0.011 + 0.008 * r2), al * 0.7);
    if (i % 3 === 0) shParilti(ox + px, oy + py, s * 0.011, al);
  }
  g.globalCompositeOperation = 'source-over';
  // 7) uzakta süzülen iki yetişkin ejderha (yavaş, kanat çırparak; biri gökte geniş daire çizer)
  for (let i = 0; i < 2; i++) {
    const u = (tm * (0.018 + i * 0.006) * hz + i * 0.55) % 1, px = ox + w * (i ? 1.1 - u * 1.2 : -0.1 + u * 1.2), py = oy + h * (i ? 0.13 : 0.25) + Math.sin(u * 7 + i) * s * 0.02;
    sh9UzakEjder(px, py, s * (i ? 0.011 : 0.015), Math.sin(tm * (2.2 + i * 0.4)) * 0.5 + 0.5, i ? -1 : 1, i ? '#b9a6e6' : '#a894dc', a * 0.75 * Math.min(1, Math.sin(u * Math.PI) * 3));
  }
  // 8) süzülen pembe taç yaprakları
  for (let i = 0; i < 9; i++) {
    const r1 = sh9Hs(i + 140), r2 = sh9Hs(i + 160), uu = (r1 + tm * (0.03 + 0.02 * r2) * hz) % 1, px = ox + w * ((r2 + uu * 0.35) % 1) + Math.sin(tm * 0.9 + i * 1.7) * s * 0.02, py = oy + h * (0.15 + uu * 0.8), pr = s * (0.006 + 0.004 * r1);
    g.save(); g.translate(px, py); g.rotate(tm * (0.8 + r2) + i); g.scale(1, 0.5 + 0.45 * Math.sin(tm * 2.2 + i)); g.globalAlpha = a * 0.9 * Math.sin(uu * Math.PI);
    g.fillStyle = i % 3 ? '#ffc8dc' : '#ffe6f0'; g.beginPath(); g.moveTo(-pr, 0); g.quadraticCurveTo(0, -pr * 0.9, pr, 0); g.quadraticCurveTo(0, pr * 0.9, -pr, 0); g.fill(); g.restore();
  }
  g.globalAlpha = 1;
  // 9) ılık yumurta: ara sıra minik sallanır, içinden sıcak ışık
  const M = O.yum, sc = (t / 3.9) % 1, sal = sc > 0.86 ? Math.sin((sc - 0.86) / 0.14 * Math.PI * 3) * (1 - (sc - 0.86) / 0.14) : 0;
  g.globalCompositeOperation = 'lighter'; dglow('#ffd27a', ox + M.x, oy + M.y - M.u, M.u * 2.4, a * (0.25 + 0.1 * Math.sin(t * 1.5))); g.globalCompositeOperation = 'source-over';
  sh9Yumurta(ox + M.x, oy + M.y - M.u * 0.1, M.u, sal, 0.5 + 0.5 * Math.sin(t * 1.5), a);
  // 10) yavru: nefes alır, göz kırpar, kanat çırpar, kuyruk sallar; ara sıra hapşırır gibi minik ışık baloncukları üfler
  const Y = O.yv, kc = (t / 3.3) % 1, kirp = kc > 0.93 ? Math.sin((kc - 0.93) / 0.07 * Math.PI) : 0, cc = (t / 5.1) % 1, cirp = cc < 0.18 ? Math.sin(cc / 0.18 * Math.PI * 4) : Math.sin(t * 1.6) * 0.15;
  const zip = cc < 0.18 ? Math.sin(cc / 0.18 * Math.PI) * Y.u * 0.18 : 0, nf = 0.5 + 0.5 * Math.sin(t * 2.1);
  sh9Yavru(ox + Y.x, oy + Y.y - zip, Y.u, kirp, cirp, Math.sin(t * 2.4), 0.12 * Math.sin(t * 0.9) + 0.06, nf, a);
  { const bc = (t / 6.3 + 0.4) % 1;   // ışık baloncukları (ateş değil)
    if (bc < 0.35) { g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) { const e = clamp(bc / 0.35 * 1.4 - k * 0.1, 0, 1); if (e <= 0 || e >= 1) continue; const bx = ox + Y.x + Y.u * (0.35 + e * 1.4 + Math.sin(k * 2.1) * 0.15), by = oy + Y.y - Y.u * (1.55 + e * 1.1 + k * 0.08); dglow(SH9_RENK[(k + 1) % 6], bx, by, Y.u * (0.14 + 0.1 * e), a * 0.6 * Math.sin(e * Math.PI)); if (k % 2 === 0) shParilti(bx, by, Y.u * 0.12, a * Math.sin(e * Math.PI)); } g.globalCompositeOperation = 'source-over'; } }
  g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
// uyku → rüya erimesinin ön planı: alt köşelerde koyu yeşil kıvrık eğreltiler ve çiçekli dallar (ince altın kenar ışığıyla), üstte
// sol köşeden sarkan çiçekli bir dal (paralaksla kayar)
function sh9OnPlan() {
  const c = shTuval(), x = c.getContext('2d'), s = Math.min(W, H), r = rng(39);
  x.lineCap = 'round'; x.lineJoin = 'round';
  const kol = 'rgba(14,52,40,0.92)';
  for (const sd of [-1, 1]) {
    const bx = sd < 0 ? 0 : W;
    sh9Egrelti(x, bx + sd * s * 0.04, H * 1.02, s * 0.3, sd * 0.45, -sd, kol, 'rgba(255,220,150,0.3)');
    sh9Egrelti(x, bx + sd * s * 0.15, H * 1.03, s * 0.2, sd * 0.2, -sd, kol, null);
    x.fillStyle = kol;
    for (let i = 0; i < 7; i++) {   // iri yuvarlak yapraklar
      const px = bx + sd * s * (0.0 + i * 0.04 + r() * 0.02), py = H * (1.0 - r() * 0.04), rr = s * (0.045 + r() * 0.035), an = -Math.PI / 2 + sd * (0.3 + r() * 0.9);
      x.save(); x.translate(px, py); x.rotate(an); x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(rr * 0.6, -rr * 0.5, rr * 1.4, -rr * 0.45, rr * 1.5, 0); x.bezierCurveTo(rr * 1.4, rr * 0.45, rr * 0.6, rr * 0.5, 0, 0); x.fill(); x.restore();
    }
  }
  // üst sol köşeden sarkan çiçekli dal
  x.strokeStyle = 'rgba(60,40,50,0.85)'; x.lineWidth = Math.max(2, s * 0.012);
  x.beginPath(); x.moveTo(-s * 0.02, H * 0.02); x.bezierCurveTo(s * 0.12, H * 0.03, s * 0.2, H * 0.1, s * 0.3, H * 0.08); x.stroke();
  x.lineWidth = Math.max(1, s * 0.006); x.beginPath(); x.moveTo(s * 0.12, H * 0.04); x.quadraticCurveTo(s * 0.16, H * 0.12, s * 0.14, H * 0.17); x.moveTo(s * 0.22, H * 0.085); x.quadraticCurveTo(s * 0.27, H * 0.14, s * 0.25, H * 0.19); x.stroke();
  for (const [px, py, pr] of [[0.06, 0.03, 0.03], [0.14, 0.17, 0.026], [0.2, 0.07, 0.03], [0.25, 0.19, 0.024], [0.3, 0.08, 0.026], [0.1, 0.09, 0.02]]) {
    const cx = px * s, cy = py * H, rr = pr * s;
    x.fillStyle = 'rgba(120,60,90,0.9)'; x.beginPath(); for (let k = 0; k < 5; k++) { const b = k * 1.2566; x.moveTo(cx + Math.cos(b) * rr * 0.55 + rr * 0.5, cy + Math.sin(b) * rr * 0.55); x.arc(cx + Math.cos(b) * rr * 0.55, cy + Math.sin(b) * rr * 0.55, rr * 0.5, 0, 6.283); } x.fill();
    x.fillStyle = 'rgba(255,170,200,0.45)'; x.beginPath(); x.arc(cx - rr * 0.2, cy - rr * 0.2, rr * 0.35, 0, 6.283); x.fill();
  }
  return c;
}
// ön planda süzülen iri, yumuşak taç yaprakları ve ışık tozları (canlı, ekran pikseli)
function sh9OnToz(tm, a) {
  if (a <= 0.01) return;
  const s = Math.min(W, H);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 7; i++) {
    const r1 = sh9Hs(i * 5 + 701), r2 = sh9Hs(i * 5 + 702), u = (r2 + tm * (0.035 + 0.02 * r1)) % 1, px = (r1 + u * 0.3 + Math.sin(tm * 0.5 + i * 1.3) * 0.03) % 1 * W, py = H * (-0.05 + u * 1.1), pr = s * (0.012 + 0.008 * r1);
    g.save(); g.translate(px, py); g.rotate(tm * (0.6 + r2) + i); g.scale(1, 0.5 + 0.45 * Math.sin(tm * 1.8 + i)); g.globalAlpha = a * 0.8 * Math.sin(u * Math.PI);
    g.fillStyle = i % 2 ? '#ffc8dc' : '#ffe6f0'; g.beginPath(); g.moveTo(-pr, 0); g.quadraticCurveTo(0, -pr * 0.9, pr, 0); g.quadraticCurveTo(0, pr * 0.9, -pr, 0); g.fill(); g.restore();
  }
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 8; i++) { const r1 = sh9Hs(i * 5 + 801), r2 = sh9Hs(i * 5 + 802), u = (r2 + tm * (0.03 + 0.02 * r1)) % 1; dglow(SH9_RENK[i % 6], (r1 + Math.sin(tm * 0.4 + i) * 0.03) * W, H * (1.05 - u * 1.1), s * (0.018 + 0.01 * r1), a * 0.3 * Math.sin(u * Math.PI)); }
  g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
SH_ONBELLEK.push('ejderha', 'onPlanE');
SH_KUR.ejderha = () => { const A = { c: shTuval(), W, H, adim: [] }; for (const f of [sh9FonA, sh9FonB, sh9FonC]) A.adim.push(() => f(A.c.getContext('2d'), W, H)); return A; };
SH_KUR.onPlanE = () => { const A = { c: null, W, H, adim: [() => { A.c = sh9OnPlan(); }] }; return A; };
// etiketteki minik ejderha başı (yazı yok): leylak yuvarlak baş, yeşil yüzgeç kulaklar, koyu yeşil ibik, iri göz, pembe yanak
function sh9Ikon(x, r) {
  x.fillStyle = '#5fb88a';
  for (const sd of [-1, 1]) { x.save(); x.translate(sd * 0.62 * r, -0.12 * r); x.rotate(sd * 0.5); x.scale(sd, 1); x.beginPath(); x.moveTo(0, 0.12 * r); x.quadraticCurveTo(0.2 * r, -0.4 * r, 0.52 * r, -0.44 * r); x.quadraticCurveTo(0.42 * r, -0.1 * r, 0.46 * r, 0.18 * r); x.closePath(); x.fill(); x.restore(); }
  x.fillStyle = '#3f9a6a'; x.beginPath(); for (const [cx, cy, cr] of [[-0.28, -0.6, 0.18], [0, -0.72, 0.21], [0.28, -0.6, 0.17]]) { x.moveTo(cx * r + cr * r, cy * r); x.arc(cx * r, cy * r, cr * r, 0, 6.283); } x.fill();
  x.fillStyle = '#6a4fb8'; x.beginPath(); x.ellipse(0, 0, 0.8 * r, 0.7 * r, 0, 0, 6.283); x.fill();
  x.fillStyle = '#c9b2ff'; x.beginPath(); x.ellipse(0, 0, 0.72 * r, 0.62 * r, 0, 0, 6.283); x.fill();
  x.fillStyle = '#e6dcff'; x.beginPath(); x.ellipse(0, 0.28 * r, 0.4 * r, 0.24 * r, 0, 0, 6.283); x.fill();
  x.fillStyle = '#26324a'; x.beginPath(); x.ellipse(-0.3 * r, -0.08 * r, 0.14 * r, 0.18 * r, 0, 0, 6.283); x.ellipse(0.3 * r, -0.08 * r, 0.14 * r, 0.18 * r, 0, 0, 6.283); x.fill();
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(-0.34 * r, -0.14 * r, 0.05 * r, 0, 6.283); x.arc(0.26 * r, -0.14 * r, 0.05 * r, 0, 6.283); x.fill();
  x.fillStyle = 'rgba(255,130,180,0.7)'; x.beginPath(); x.ellipse(-0.5 * r, 0.15 * r, 0.12 * r, 0.07 * r, 0, 0, 6.283); x.ellipse(0.5 * r, 0.15 * r, 0.12 * r, 0.07 * r, 0, 0, 6.283); x.fill();
}

// ── Bölüm 9 gecesinin yatak odası: küçük bir ejderha dokunuşu (oda birimi; her karede ucuz vektör, degrade yok) ──
// Yatağın üstünde duvarda ejderha pulu biçimli kâğıt flamalar (ortada kâğıttan minik bir ejderha; Feza uyurken kanat oynatır),
// prizde ejderha yumurtası biçimli gece lambası (leylak-nane ışıkla nefes alır). Sabah aynı süsler gün ışığında; lamba söner.
const SH9_SUS = { x0: -60, y0: 10.2, x1: 8.6, y1: 9.3, sark: 7.2, n: 11 };
const SH9_GL = { x: 11.4, y: 67.2 };
function sh9KagitPul(r, col, kenar) {   // (0,0) asılma noktası; kalkan biçimli kâğıt pul, ortasında pul çizgisi
  g.fillStyle = col; g.strokeStyle = kenar; g.lineWidth = r * 0.09; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-r * 0.62, 0); g.lineTo(r * 0.62, 0); g.bezierCurveTo(r * 0.66, r * 0.7, r * 0.3, r * 1.25, 0, r * 1.45); g.bezierCurveTo(-r * 0.3, r * 1.25, -r * 0.66, r * 0.7, -r * 0.62, 0); g.closePath(); g.fill(); g.stroke();
  g.lineWidth = r * 0.06; g.beginPath(); g.moveTo(-r * 0.4, r * 0.35); g.quadraticCurveTo(0, r * 0.85, r * 0.4, r * 0.35); g.moveTo(-r * 0.22, r * 0.75); g.quadraticCurveTo(0, r * 1.1, r * 0.22, r * 0.75); g.stroke();
}
function sh9KagitEjder(r, gece, kanat) {   // kâğıttan düz minik ejderha (önden): leylak gövde, yeşil ibik ve kulaklar, iki göz, gülümseme
  const G = gece ? '#8f7ad8' : '#c9b2ff', L = gece ? 'rgba(30,20,70,0.6)' : 'rgba(106,79,184,0.6)', Y = gece ? '#4f9a7a' : '#6fd8a8';
  g.lineJoin = 'round'; g.lineWidth = r * 0.07; g.strokeStyle = L;
  for (const sd of [-1, 1]) { g.save(); g.translate(sd * r * 0.4, r * 0.95); g.rotate(sd * (-0.4 - kanat * 0.5)); g.scale(sd, 1); g.fillStyle = Y; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(r * 0.3, -r * 0.6, r * 0.85, -r * 0.55); g.quadraticCurveTo(r * 0.7, -r * 0.2, r * 0.8, 0.0); g.quadraticCurveTo(r * 0.4, -r * 0.05, 0, r * 0.15); g.closePath(); g.fill(); g.stroke(); g.restore(); }
  g.fillStyle = G; g.beginPath(); g.ellipse(0, r * 1.15, r * 0.48, r * 0.55, 0, 0, 6.283); g.fill(); g.stroke();
  g.fillStyle = Y; g.beginPath(); for (const [cx, cy, cr] of [[-0.2, 0.2, 0.13], [0, 0.12, 0.15], [0.2, 0.2, 0.12]]) { g.moveTo(cx * r + cr * r, cy * r); g.arc(cx * r, cy * r, cr * r, 0, 6.283); } g.fill();
  g.fillStyle = G; g.beginPath(); g.ellipse(0, r * 0.52, r * 0.5, r * 0.42, 0, 0, 6.283); g.fill(); g.stroke();
  g.fillStyle = gece ? '#d8e6b0' : '#e8f6b4'; g.beginPath(); g.ellipse(0, r * 1.25, r * 0.26, r * 0.32, 0, 0, 6.283); g.fill();
  g.fillStyle = '#26324a'; g.beginPath(); g.arc(-r * 0.18, r * 0.48, r * 0.08, 0, 6.283); g.arc(r * 0.18, r * 0.48, r * 0.08, 0, 6.283); g.fill();
  g.strokeStyle = '#26324a'; g.lineWidth = r * 0.05; g.beginPath(); g.arc(0, r * 0.6, r * 0.12, 0.3, Math.PI - 0.3); g.stroke();
}
// yumurta gece lambası ((x, y) oda biriminde priz ortası). yanik 0 sönük (gündüz) .. 1 ışıl ışıl; sal 0..1 tatlı bir sallanış
function sh9GeceLambasi(p, tm, a, yanik, sal) {
  const gece = p.sky === 'gece', L = SH9_GL, u = 2.1, k = sh.k0 * sh.zoom, nf = 0.85 + 0.15 * Math.sin(tm * 1.2);
  if (yanik > 0.01) {   // duvara ve zemine leylak-nane ışık
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
    const px = shEkranX(L.x), py = shEkranY(L.y - 0.6);
    dglow('#b89cff', px, py, k * 16 * nf, a * 0.3 * yanik);
    dglow('#9ff0c8', px, py, k * 6.5, a * 0.3 * yanik * nf);
    g.globalAlpha = a * 0.4 * yanik; g.drawImage(glow('#b8f5d8'), px - k * 15, shEkranY(SH_ZEMIN + 1.8) - k * 3, k * 30, k * 6); g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }
  shOdaT(); g.globalAlpha = a; g.lineJoin = 'round'; g.lineCap = 'round';
  g.fillStyle = gece ? '#4a4380' : '#f6ebdd'; shRR(g, L.x - 1.6, L.y - 2.3, 3.2, 4.6, 0.6); g.fill();   // priz kapağı
  g.strokeStyle = gece ? 'rgba(160,150,230,0.35)' : 'rgba(170,130,100,0.45)'; g.lineWidth = 0.14; g.stroke();
  g.save(); g.translate(L.x, L.y + 1.5); g.rotate(sal * 0.1);
  const ic = yanik > 0.5 ? (gece ? '#e8dcff' : '#f2ecff') : (gece ? '#7a6aa8' : '#ece4fa');
  g.fillStyle = gece ? '#5a4a8a' : '#b9a6e6'; g.beginPath(); g.ellipse(0, -u * 0.9, u * 0.72, u * 0.98, 0, 0, 6.283); g.fill();
  g.fillStyle = ic; g.beginPath(); g.ellipse(0, -u * 0.9, u * 0.64, u * 0.9, 0, 0, 6.283); g.fill();
  g.fillStyle = yanik > 0.5 ? (gece ? '#b8f5d8' : '#c8f0dc') : (gece ? '#5f8a7a' : '#bfe8d4'); g.beginPath(); g.arc(-u * 0.25, -u * 1.25, u * 0.12, 0, 6.283); g.moveTo(u * 0.4, -u * 0.85); g.arc(u * 0.3, -u * 0.85, u * 0.1, 0, 6.283); g.moveTo(-u * 0.04, -u * 0.5); g.arc(-u * 0.12, -u * 0.5, u * 0.08, 0, 6.283); g.fill();
  g.fillStyle = yanik > 0.5 ? (gece ? '#ffd27a' : '#ffe08a') : (gece ? '#8a7a5a' : '#f0d8a0'); g.beginPath(); g.arc(u * 0.18, -u * 1.45, u * 0.08, 0, 6.283); g.arc(-u * 0.35, -u * 0.8, u * 0.07, 0, 6.283); g.fill();
  g.fillStyle = gece ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(-u * 0.28, -u * 1.35, u * 0.12, u * 0.22, -0.4, 0, 6.283); g.fill();
  g.fillStyle = gece ? '#6a5a9a' : '#c9b2ff'; shRR(g, -u * 0.5, -u * 0.12, u, u * 0.3, u * 0.1); g.fill();   // tabanlık
  g.restore();
  g.globalAlpha = 1;
  if (yanik > 0.5) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; dglow('#f2ecff', shEkranX(L.x), shEkranY(L.y + 1.5 - u * 0.9), k * 1.8 * nf, a * 0.5 * yanik); g.globalCompositeOperation = 'source-over'; }
}
// odanın süsleri: a saydamlık (oda eridikçe söner), uyu 0..1 (Feza uyudukça ortadaki kâğıt ejderha usulca kanat çırpar), sal (lamba)
function sh9Oda(p, tm, a, uyu, sal) {
  if (a <= 0.01) return;
  const gece = p.sky === 'gece';
  sh9GeceLambasi(p, tm, a, gece ? 1 : 0, sal || 0);
  shOdaT(); g.globalAlpha = a;
  const Su = SH9_SUS, ip = gece ? 'rgba(150,140,210,0.75)' : 'rgba(170,120,80,0.7)';
  g.strokeStyle = ip; g.lineWidth = 0.16; g.beginPath();
  for (let i = 0; i <= 24; i++) { const u = i / 24, px = lerp(Su.x0, Su.x1, u), py = lerp(Su.y0, Su.y1, u) + Math.sin(u * Math.PI) * Su.sark; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
  g.stroke();
  g.fillStyle = gece ? '#8f86c8' : '#9fe0c0'; g.beginPath(); g.arc(Su.x0, Su.y0, 0.42, 0, 6.283); g.arc(Su.x1, Su.y1, 0.42, 0, 6.283); g.fill();
  const renk = gece ? ['#7f6cc8', '#4f9a7a', '#c89a4a'] : ['#c9b2ff', '#8fe0b8', '#ffd27a'], kenar = gece ? 'rgba(30,20,70,0.55)' : 'rgba(110,70,140,0.35)';
  for (let i = 0; i < Su.n; i++) {
    const u = (i + 0.5) / Su.n, px = lerp(Su.x0, Su.x1, u), py = lerp(Su.y0, Su.y1, u) + Math.sin(u * Math.PI) * Su.sark;
    const sl = Math.sin(tm * (gece ? 1.0 : 0.7) + i * 0.9) * 0.1 + Math.sin(tm * 0.37 + i * 2.1) * 0.05;
    g.strokeStyle = ip; g.lineWidth = 0.1; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.sin(sl) * 0.5, py + Math.cos(sl) * 0.5); g.stroke();
    g.save(); g.translate(px + Math.sin(sl) * 0.5, py + Math.cos(sl) * 0.5); g.rotate(-sl);
    if (i === 5) {
      const kanat = uyu > 0 ? Math.sin(tm * 5) * Math.min(1, uyu * 2) * 0.8 : Math.sin(tm * 0.8) * 0.1;
      sh9KagitEjder(1.9, gece, kanat); g.restore();
      if (uyu > 0.05) {   // rüya başlıyor: kanat çırpan kâğıt ejderhanın çevresinde minik ışıltılar
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
        const k = sh.k0 * sh.zoom, bx = shEkranX(px), by = shEkranY(py + 2.2);
        dglow('#c8f0dc', bx, by, k * 4, a * 0.3 * uyu);
        for (let j = 0; j < 3; j++) { const an = tm * 1.4 + j * 2.1, tw = Math.pow(Math.max(0, Math.sin(tm * 3 + j * 2)), 2); shParilti(bx + Math.cos(an) * k * 2.8, by + Math.sin(an) * k * 2, k * 0.7 * tw, a * uyu * tw); }
        g.globalCompositeOperation = 'source-over'; shOdaT(); g.globalAlpha = a;
      }
      continue;
    }
    sh9KagitPul(1.3 + (i % 3 === 1 ? 0.2 : 0), renk[i % 3], kenar); g.restore();
  }
  g.globalAlpha = 1;
}
// Pırıl'ın gözleri parlar: uyandığı an iki gözünde nane-leylak ışık ve minik yıldızlar (ekran pikseli; e 0..1)
function sh9Gozler(tm, e) {
  const q = sh.prEk, M = sh.prM; if (!q || !M || e <= 0.01) return;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  for (const sd of [-1, 1]) {
    const lx = q.x + SH9_GOZ.x * sd * q.s, ly = q.y + SH9_GOZ.y * q.s, px = M.a * lx + M.c * ly + M.e, py = M.b * lx + M.d * ly + M.f, k = Math.hypot(M.a, M.b) * q.s;
    const tw = 0.75 + 0.25 * Math.sin(tm * 4.2 + sd);
    dglow('#b8f5d8', px, py, k * 9 * tw, e * 0.55);
    dglow('#e6dcff', px, py, k * 4, e * 0.7);
    shParilti(px, py, k * 5.5 * tw, e * 0.95);
  }
  g.globalCompositeOperation = 'source-over';
}
const SH9_GOZ = { x: 6.4, y: -13.6 };   // Pırıl'ın (önden) gözlerinin gövde merkezine göre yeri (pirilCizPoz birimi)
// sabah komodinin üstünde (dar ekranda yatağın üstündeki rafta) rüyadan kalmış gibi parıldayan leylak bir ejderha pulu ve minik bir
// yumurta kabuğu; pulun üstünde yavaşça kayan yanardöner parıltı, çevrede ara sıra ışıltı. a: beliriş, uyan: Feza uyanınca pul bir kez ışır
function sh9Hediye(tm, a, uyan) {
  if (a <= 0.01) return;
  const kom = -(W / 2 + (sh.oxp || 0)) / sh.k0 < -57.5;
  const cs = kom ? 1.25 : 1, px = kom ? -55.3 : -40.6, py = kom ? SH_KOMODIN.ust - 0.25 : 38.2, bx = kom ? -62.9 : -36.6, by = kom ? SH_KOMODIN.ust - 0.2 : 38.3;
  const k = sh.k0 * sh.zoom, R = 1.25 * cs, ii = uyan > 0 && uyan < 1 ? Math.sin(uyan * Math.PI) : 0;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  dglow('#c9b2ff', shEkranX(px), shEkranY(py - R), k * R * (3.2 + 1.5 * ii), a * (0.32 + 0.06 * Math.sin(tm * 1.4) + 0.3 * ii));
  dglow('#b8f5d8', shEkranX(px), shEkranY(py - R * 1.1), k * R * 1.3, a * (0.22 + 0.2 * ii));
  g.globalCompositeOperation = 'source-over';
  shOdaT(); g.globalAlpha = a; g.lineJoin = 'round'; g.lineCap = 'round';
  // yumurta kabuğu: yarım, kırık kenarlı, şeftali benekli; yanına yatmış
  g.save(); g.translate(bx, by); g.scale(cs, cs); g.rotate(0.15);
  g.fillStyle = 'rgba(120,80,60,0.25)'; g.beginPath(); g.ellipse(0, 0.05, 1.25, 0.18, 0, 0, 6.283); g.fill();
  const syol = () => { g.beginPath(); g.moveTo(-1.0, 0); g.bezierCurveTo(-1.0, -1.15, 0.6, -1.25, 0.95, -0.35); for (let i = 1; i <= 5; i++) g.lineTo(0.95 - i * 0.39, i % 2 ? -0.62 : -0.3); g.lineTo(-1.0, 0); g.closePath(); };
  syol(); g.fillStyle = '#c9a07a'; g.save(); g.translate(0, 0.06); g.fill(); g.restore();
  syol(); g.fillStyle = '#fff4e0'; g.fill();
  g.fillStyle = '#ffe0c4'; g.beginPath(); g.moveTo(0.95, -0.35); for (let i = 1; i <= 5; i++) g.lineTo(0.95 - i * 0.39, i % 2 ? -0.62 : -0.3); g.lineTo(-0.8, -0.2); g.quadraticCurveTo(0, -0.1, 0.95, -0.35); g.fill();   // kabuğun içi
  g.fillStyle = '#ffc29a'; g.beginPath(); g.ellipse(-0.5, -0.45, 0.13, 0.09, 0.3, 0, 6.283); g.ellipse(-0.15, -0.75, 0.09, 0.07, 0, 0, 6.283); g.fill();
  g.fillStyle = '#d9c8ff'; g.beginPath(); g.ellipse(-0.72, -0.2, 0.08, 0.06, 0, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 0.08; g.beginPath(); g.arc(-0.3, -0.25, 0.55, Math.PI * 1.08, Math.PI * 1.4); g.stroke();
  g.restore();
  // ejderha pulu: yuvarlak uçlu kalkan, leylak; iç bantta nane, ucunda altın ışık; üstünde yavaşça kayan parıltı bandı
  g.save(); g.translate(px, py); g.rotate(-0.12);
  const pyol = (sc) => { const r = R * sc; g.beginPath(); g.moveTo(-r * 0.72, -r * 1.9); g.quadraticCurveTo(0, -r * 2.05, r * 0.72, -r * 1.9); g.bezierCurveTo(r * 0.8, -r * 0.9, r * 0.4, -r * 0.2, 0, 0); g.bezierCurveTo(-r * 0.4, -r * 0.2, -r * 0.8, -r * 0.9, -r * 0.72, -r * 1.9); g.closePath(); };
  g.fillStyle = 'rgba(90,60,140,0.25)'; g.beginPath(); g.ellipse(0, 0.05, R * 0.9, R * 0.16, 0, 0, 6.283); g.fill();
  pyol(1.08); g.fillStyle = '#6a4fb8'; g.fill();
  pyol(1); g.fillStyle = '#b89cff'; g.fill();
  g.save(); pyol(1); g.clip();
  g.fillStyle = '#d9c8ff'; g.beginPath(); g.ellipse(-R * 0.25, -R * 1.45, R * 0.5, R * 0.7, -0.2, 0, 6.283); g.fill();
  g.fillStyle = '#9ff0c8'; g.globalAlpha = a * 0.85; g.beginPath(); g.moveTo(-R * 0.6, -R * 1.2); g.quadraticCurveTo(0, -R * 0.55, R * 0.6, -R * 1.2); g.lineTo(R * 0.5, -R * 0.85); g.quadraticCurveTo(0, -R * 0.3, -R * 0.5, -R * 0.85); g.closePath(); g.fill();
  g.fillStyle = '#ffe08a'; g.globalAlpha = a; g.beginPath(); g.ellipse(0, -R * 0.35, R * 0.22, R * 0.28, 0, 0, 6.283); g.fill();
  const sw = ((tm * 0.22) % 1.6) - 0.3;   // kayan yanardöner parıltı
  g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(R * (-1 + sw * 2), -R * 2.1); g.lineTo(R * (-0.6 + sw * 2), -R * 2.1); g.lineTo(R * (-1.3 + sw * 2), 0); g.lineTo(R * (-1.7 + sw * 2), 0); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
  g.restore();
  g.strokeStyle = 'rgba(106,79,184,0.55)'; g.lineWidth = 0.1; g.beginPath(); g.moveTo(-R * 0.45, -R * 1.55); g.quadraticCurveTo(0, -R * 1.2, R * 0.45, -R * 1.55); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(-R * 0.35, -R * 1.62, R * 0.12, R * 0.07, -0.3, 0, 6.283); g.fill();
  g.restore();
  g.globalAlpha = 1;
  // rüya tozu ışıltıları
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) { const tw = Math.pow(Math.max(0, Math.sin(tm * 1.3 + i * 1.7)), 2), an = i * 1.9 + tm * 0.2, cx2 = i < 4 ? px : bx, cy2 = i < 4 ? py - R : by - 0.5; shParilti(shEkranX(cx2 + Math.cos(an) * R * 1.4), shEkranY(cy2 + Math.sin(an) * R * 1.1), k * (0.9 + 0.6 * ii) * tw, a * tw * 0.9); }
  g.globalCompositeOperation = 'source-over';
}
// Bölüm 9 sabahı: pencereden yaz sabahı: şeftali-turkuaz gök, yemyeşil yuvarlak tepeler, uzakta tepesi usulca ışıyan yuvarlak bir dağ
// (sanki Ejderha Kalbi), gökte çok uzakta süzülen minicik bir ejderha; pencerenin önünden pembe taç yaprakları süzülür. a: 0..1
let sh9SabahGk = null;
function sh9Sabah(tm, a) {
  if (a <= 0.01) return;
  shOdaT(); g.save(); shPencereYol(g, 0); g.clip(); g.globalAlpha = a;
  if (!sh9SabahGk) { sh9SabahGk = g.createLinearGradient(0, SH_PEN.ust, 0, 46); sh9SabahGk.addColorStop(0, '#8fd4ee'); sh9SabahGk.addColorStop(0.55, '#e6f0e4'); sh9SabahGk.addColorStop(1, '#ffdcc2'); }   // oda biriminde: bir kez
  g.fillStyle = sh9SabahGk; g.fillRect(SH_PEN.x0 - 1, SH_PEN.ust - 1, SH_PEN.x1 - SH_PEN.x0 + 2, 47 - SH_PEN.ust);
  g.fillStyle = 'rgba(255,250,240,0.85)'; for (const [cx, cy, rr] of [[18.5, 18.5, 1.6], [20.4, 17.8, 2.0], [22.4, 18.6, 1.4], [33.6, 25.4, 1.3], [35.3, 24.8, 1.7]]) { g.beginPath(); g.arc(cx, cy, rr, 0, 6.283); g.fill(); }   // bulutçuklar
  // uzak lavanta dağ ve tepesinde usul ışık
  g.fillStyle = '#b9c6e8'; g.beginPath(); g.moveTo(13, 44); g.quadraticCurveTo(22, 36, 29, 39.5); g.quadraticCurveTo(33, 33.4, 37.4, 33.6); g.quadraticCurveTo(41, 34.5, 42, 38); g.lineTo(42, 51); g.lineTo(13, 51); g.fill();
  g.globalCompositeOperation = 'lighter'; const nb = 0.6 + 0.4 * Math.sin(tm * 1.6);
  g.setTransform(1, 0, 0, 1, 0, 0); dglow('#d9c8ff', shEkranX(36.6), shEkranY(33.3), sh.k0 * sh.zoom * 2.4 * (0.9 + 0.2 * nb), a * 0.6 * nb); dglow('#ffe08a', shEkranX(36.6), shEkranY(33.3), sh.k0 * sh.zoom * 0.8, a * 0.7);
  shOdaT(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = a;
  // yeşil tepeler, çiçekli minik ağaçlar
  g.fillStyle = '#8fd4b0'; g.beginPath(); g.moveTo(13, 51); g.lineTo(13, 43.5); g.quadraticCurveTo(20, 40.4, 27, 42.6); g.quadraticCurveTo(34, 44.4, 42, 41.6); g.lineTo(42, 51); g.fill();
  for (const [px, py, pr, col] of [[17.2, 42.4, 1.1, '#ffb3cf'], [24.6, 42.0, 0.9, '#ffd2a8'], [38.8, 42.2, 1.0, '#e6d6ff']]) { g.fillStyle = '#8a6a58'; g.fillRect(px - 0.12, py - pr * 0.2, 0.24, pr * 1.2); g.fillStyle = col; g.beginPath(); g.arc(px, py - pr * 0.6, pr, 0, 6.283); g.fill(); }
  g.fillStyle = '#5fc99a'; g.beginPath(); g.moveTo(13, 51); g.lineTo(13, 46.2); g.quadraticCurveTo(22, 43.8, 30, 46.4); g.quadraticCurveTo(36, 47.8, 42, 45.6); g.lineTo(42, 51); g.fill();
  g.fillStyle = '#ffe9f2'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(14 + sh9Hs(i + 300) * 27, 47 + sh9Hs(i + 320) * 3, 0.16, 0, 6.283); g.fill(); }
  // çok uzakta süzülen minicik ejderha (rüya gerçekmiş gibi)
  { const u = (tm * 0.03) % 1, ex = lerp(15, 41, u), ey = 24 + Math.sin(u * 9) * 1.2; g.setTransform(1, 0, 0, 1, 0, 0); sh9UzakEjder(shEkranX(ex), shEkranY(ey), sh.k0 * sh.zoom * 0.55, Math.sin(tm * 2.4) * 0.5 + 0.5, 1, '#9f8fd0', a * 0.8 * Math.min(1, Math.sin(u * Math.PI) * 4)); shOdaT(); g.globalAlpha = a; }
  // süzülen pembe taç yaprakları
  for (let i = 0; i < 9; i++) {
    const yy = (sh9Hs(i + 140) + tm * (0.025 + 0.015 * sh9Hs(i + 160))) % 1, px = 14 + sh9Hs(i + 120) * 26 + Math.sin(tm * 0.8 + i * 1.7) * 1.2, py = 12 + yy * 38, rr = 0.42 + 0.22 * sh9Hs(i + 180);
    g.save(); g.translate(px, py); g.rotate(tm * (0.8 + sh9Hs(i + 200)) + i); g.scale(1, 0.55 + 0.45 * Math.sin(tm * 2.2 + i)); g.fillStyle = ['#ffc8dc', '#ffe6f0', '#ffb3cf'][i % 3];
    g.beginPath(); g.moveTo(-rr, 0); g.quadraticCurveTo(0, -rr * 0.8, rr, 0); g.quadraticCurveTo(0, rr * 0.8, -rr, 0); g.fill(); g.restore();
  }
  g.restore();
  g.globalAlpha = a; g.fillStyle = SH_SABAH.frame; const cxw = (SH_PEN.x0 + SH_PEN.x1) / 2;   // pencere kayıtları göğün önünde
  g.fillRect(cxw - 0.6, SH_PEN.ust, 1.2, SH_PEN.alt - SH_PEN.ust); g.fillRect(SH_PEN.x0, 31, SH_PEN.x1 - SH_PEN.x0, 1.2);
  for (const [px, py, an] of [[18.4, 49.75, 0.3], [34.6, 49.8, -0.5]]) { g.save(); g.translate(px, py); g.rotate(an); g.fillStyle = '#ffc8dc'; g.beginPath(); g.moveTo(-0.5, 0); g.quadraticCurveTo(0, -0.4, 0.5, 0); g.quadraticCurveTo(0, 0.4, -0.5, 0); g.fill(); g.restore(); }   // denizlikte iki taç yaprağı
  g.globalAlpha = 1;
}
// odadan rüyaya erime (yalnız Bölüm 9): Feza uyuyunca peluş Pırıl'ın gözleri açılıp parlar, oda Pırıl'dan yayılan dalgalı bir ışık
// halkasıyla yemyeşil vadiye erir (kamera geri çekilir), sonra Pırıl'ın ışığı ekranı doldurur; oyuna geçince ışık kenarlardan içe
// çözülür (sh9Devir) ve Feza vadide belirir. SH9_ERIME = false: Bölüm 8 gibi doğrudan geçiş.
const SH9_ERIME = true;
function sh9ErimePlan(P) {
  if (!SH9_ERIME || sh.tema !== 'ejderha') return P;
  P.ejder = true;
  P.goz = P.uyudu + 0.15;          // Pırıl'ın gözleri açılır ve parlar
  P.b3 = P.goz + 1.1;              // erime başlar
  P.erime = 2.5; P.b4 = P.b3 + P.erime;
  P.isik = P.b4 - 0.5;             // Pırıl'ın ışığı yükselir
  P.son = P.isik + 1.05;           // ışık tam: oyuna geçiş
  return P;
}
const SH9_DEVIR = { dunya: 0, son: 1.35 };
// Bölüm 1-8: Feza uyuyunca kucağındaki Pırıl usulca ışıldar (rüyanın renginde), ışığı odayı doldurur; oyun o ışığın içinden açılır
// (Bölüm 9'daki sh9Devir ile aynı). Bölüm 9'un kendi erimesi var.
function sh78IsikPlan(P) {
  if (sh.tema === 'ejderha') return P;
  P.isikGec = true;
  P.goz = P.uyudu + 0.05;          // peluş Pırıl ışıldamaya başlar
  P.isik = P.uyudu + 0.75;         // ışığı odayı doldurur
  P.son = P.isik + 1.05;           // ışık tam: oyuna geçiş
  return P;
}
function sh9Devir(tm, dt) {
  const D9 = sh.devir; D9.t += dt;
  if (D9.t >= SH9_DEVIR.son || DURUM !== 'oyun') { sh.devir = null; return; }
  try { shGirisAcilis(tm, D9.t, SH9_DEVIR); } catch (e) { sh.devir = null; shHata('sh9Devir', e); }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
// Son sözün ilk cümlesi dünyadaki Ejderha Kalbi Şöleni'nde söylendiyse (CORE, Bölüm 8 gibi) sabah onu tekrar etmez
OLAY.on('konusma', e => {
  if (typeof BOLUM_NO === 'undefined' || BOLUM_NO !== 9 || !e || sh.mod) return;
  if (e.anahtar === 'a_e_final1') sh.f6Ozet = 1;
});
