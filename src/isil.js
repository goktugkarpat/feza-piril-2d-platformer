/* isil.js – Işıl: Feza'nın özel isteği, gökkuşağında Feza'yı sırtında kaydıran yunikorn (Bölüm 3 finali).
   Canvas çizimi; sevimli "chibi" midilli-yunikorn: yuvarlak hatlar, inci beyazı → şeftali/pembe gövde, turkuaz karın gölgesi,
   kocaman parlak gözler, spiral kabartmalı altın boynuz, çok renkli (gökkuşağı pastel) dalgalı yele ve kuyruk.
   (Mor yalnız Pırıl'a ait: Işıl'da yok.) Yerel çerçeve: sağa bakar, toynakların yere değdiği nokta (0,0), yukarı = -y.
   Kullanım (bulut.js 'gokkusagi'): ISIL.ciz(g, x, y, rot, st, tm); st = {poz, hiz, ruzgar, hop, feza, fvy, sevinc, iz}
     poz: 'dur' | 'tırıs' | 'kay' (süzülme/kayma) | 'sal' (el sallama) | 'sicra' (sıçrayış); feza: Feza'yı sırtında çiz.
   Performans: ağır parçalar (gövde, baş, bacak, kulak, boynuz, ışıltı) ilk kullanımda 2x çözünürlükte bir kez offscreen tuvallere çizilir;
   kare başına yalnız drawImage + yele/kuyruk şeritleri (düz renk) çizilir, gradyan kurulmaz. */
(function () {
  const PI = Math.PI, PI2 = Math.PI * 2, S = 2;   // S: önbellek çözünürlük çarpanı (iPad retina için)
  const CC = ['#ff8fb8', '#ffb26b', '#ffe070', '#8fe3a6', '#5fd8d8', '#8ec5ff', '#ffa6dc'];   // yele/kuyruk tutamları (mor yok)
  const SEAT = { x: -6, y: -82 };   // Feza'nın oturma noktası (sırt)
  const RIM = '#e8aec3', RIM_FAR = '#dcaebf';
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  let SP = null, LAST = { bob: 0, roll: 0 };

  // ───────── önbellek yardımcıları ─────────
  function mk(w, h, ox, oy, fn) {
    const cv = document.createElement('canvas'); cv.width = Math.ceil(w * S); cv.height = Math.ceil(h * S);
    const q = cv.getContext('2d'); q.scale(S, S); q.translate(ox, oy); fn(q);
    return { c: cv, w, h, ox, oy };
  }
  function blit(c, sp, x, y) { c.drawImage(sp.c, x - sp.ox, y - sp.oy, sp.w, sp.h); }
  function lg(q, x0, y0, x1, y1, st) { const gr = q.createLinearGradient(x0, y0, x1, y1); for (let i = 0; i < st.length; i += 2) gr.addColorStop(st[i], st[i + 1]); return gr; }
  function rg(q, x, y, r, st) { const gr = q.createRadialGradient(x, y, 0, x, y, r); for (let i = 0; i < st.length; i += 2) gr.addColorStop(st[i], st[i + 1]); return gr; }
  function blob(q, cx, cy, rx, ry, rgb, a) {   // yumuşak, kenarı kaybolan renk lekesi
    q.save(); q.translate(cx, cy); q.scale(1, ry / rx);
    q.fillStyle = rg(q, 0, 0, rx, [0, 'rgba(' + rgb + ',' + a + ')', 1, 'rgba(' + rgb + ',0)']); q.fillRect(-rx, -rx, rx * 2, rx * 2); q.restore();
  }
  function ell(q, x, y, rx, ry, rot) { rot = rot || 0; q.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx); q.ellipse(x, y, rx, ry, rot, 0, PI2); }
  function star5(q, x, y, R, r) { q.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, k = i % 2 ? r : R; q.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); } q.closePath(); }

  // ───────── gövde ─────────
  function torsoPath(q) {
    q.beginPath(); q.moveTo(26, -84);
    q.bezierCurveTo(14, -85, 4, -81, -6, -81);
    q.bezierCurveTo(-18, -81, -28, -90, -39, -84);
    q.bezierCurveTo(-52, -78, -56, -62, -51, -50);
    q.bezierCurveTo(-47, -43, -37, -38, -25, -40);
    q.bezierCurveTo(-10, -35, 8, -35, 22, -39);
    q.bezierCurveTo(36, -41, 47, -50, 46, -62);
    q.bezierCurveTo(45, -74, 38, -80, 26, -84); q.closePath();
    // boyun (aynı yönde, birleşik kırpma için)
    q.moveTo(18, -82); q.lineTo(30, -56); q.lineTo(46, -62);
    q.bezierCurveTo(50, -78, 62, -92, 68, -104);
    q.bezierCurveTo(62, -120, 54, -132, 44, -132);
    q.bezierCurveTo(32, -118, 24, -100, 18, -82); q.closePath();
  }
  function bakeTorso() {
    return mk(140, 110, 70, 132, q => {
      torsoPath(q); q.lineJoin = 'round'; q.strokeStyle = RIM; q.lineWidth = 3.4; q.stroke();
      q.fillStyle = lg(q, 0, -100, 0, -32, [0, '#ffffff', 0.45, '#fffbf8', 0.78, '#ffe8e2', 1, '#ffd2e0']); q.fill();
      q.save(); torsoPath(q); q.clip();
      blob(q, -4, -29, 44, 24, '140,224,226', 0.62);          // karın altı turkuaz gölge
      blob(q, -44, -52, 28, 26, '255,190,180', 0.5);          // kalça şeftali gölgesi
      blob(q, 38, -46, 24, 22, '255,185,208', 0.42);          // göğüs pembe
      blob(q, 62, -94, 22, 16, '255,190,205', 0.55);          // baş altı boyun gölgesi
      blob(q, 32, -62, 16, 12, '255,196,205', 0.3);
      blob(q, -10, -80, 36, 9, '255,255,255', 0.95);          // sırt üst ışık yansıması
      blob(q, -34, -78, 14, 8, '255,255,255', 0.8);
      blob(q, 30, -112, 9, 17, '255,255,255', 0.9);           // boyun sırtı ışığı
      q.strokeStyle = 'rgba(232,160,185,0.55)'; q.lineWidth = 1.7; q.lineCap = 'round';   // kalça ve omuz hatları
      q.beginPath(); q.moveTo(-14, -73); q.bezierCurveTo(1, -66, -1, -46, -17, -38); q.stroke();
      q.beginPath(); q.moveTo(32, -72); q.bezierCurveTo(22, -64, 24, -48, 36, -41); q.stroke();
      q.restore();
      // minik altın yıldız (kalçada)
      star5(q, -30, -62, 6.6, 3.2); q.lineJoin = 'round'; q.strokeStyle = '#f3b95a'; q.lineWidth = 2.2; q.stroke();
      q.fillStyle = lg(q, 0, -69, 0, -56, [0, '#fff3b8', 1, '#ffd060']); q.fill();
    });
  }

  // ───────── baş (göz modu: 'a' açık, 'b' kırpma, 'c' sevinç) ─────────
  const EX = 7, EY = -1, ERX = 8.4, ERY = 10.2;
  function lashes(q, ang, up) {
    q.strokeStyle = '#3d2631'; q.lineCap = 'round'; q.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) {
      const a = ang[i], px = EX + ERX * Math.cos(a), py = EY + ERY * Math.sin(a), L = 3.6 - i * 0.6;
      q.beginPath(); q.moveTo(px, py); q.quadraticCurveTo(px + Math.cos(a) * L * 0.6 - 1.6, py + Math.sin(a) * L * 0.6 + up * 1.2, px + Math.cos(a) * L - 3.2, py + Math.sin(a) * L + up * 2.4); q.stroke();
    }
  }
  function eye(q, mode) {
    if (mode === 'a') {
      q.save(); q.beginPath(); q.ellipse(EX, EY, ERX, ERY, 0, 0, PI2); q.clip();
      q.fillStyle = lg(q, 0, EY - ERY, 0, EY + ERY, [0, '#d6e4f0', 0.3, '#ffffff', 1, '#fff2f5']); q.fillRect(EX - ERX, EY - ERY, ERX * 2, ERY * 2);
      const ix = EX + 1.2, iy = EY + 1.0, irx = 7.3, iry = 9.4;
      q.save(); q.translate(ix, iy); q.scale(1, iry / irx);
      q.fillStyle = rg(q, 0, 2.5, irx * 1.25, [0, '#e2fffa', 0.28, '#90ece6', 0.62, '#44b2e0', 1, '#2a78bd']);
      q.beginPath(); q.arc(0, 0, irx, 0, PI2); q.fill();
      q.strokeStyle = 'rgba(30,90,150,0.55)'; q.lineWidth = 0.9; q.stroke(); q.restore();
      q.fillStyle = lg(q, 0, EY - ERY, 0, EY + 1, [0, 'rgba(16,40,92,0.7)', 1, 'rgba(16,40,92,0)']); q.fillRect(EX - ERX, EY - ERY, ERX * 2, ERY * 2);   // üst göz kapağı gölgesi
      blob(q, ix, iy + 6.8, 5.6, 3.2, '255,150,195', 0.95);   // alt pembe parıltı
      q.fillStyle = '#14284a'; q.beginPath(); q.ellipse(ix + 0.2, iy - 0.4, 3.1, 4.5, 0, 0, PI2); q.fill();
      q.fillStyle = '#fff'; q.beginPath(); q.arc(ix + 2.9, iy - 5.2, 3.0, 0, PI2); q.fill();
      q.beginPath(); q.arc(ix - 2.5, iy + 4.4, 1.5, 0, PI2); q.fill();
      q.globalAlpha = 0.85; q.beginPath(); q.arc(ix + 3.9, iy + 2.2, 0.9, 0, PI2); q.fill(); q.globalAlpha = 1;
      q.restore();
      q.strokeStyle = '#3d2631'; q.lineWidth = 2.9; q.lineCap = 'round';
      q.beginPath(); q.ellipse(EX, EY, ERX + 0.3, ERY + 0.3, 0, PI * 1.02, PI * 1.98); q.stroke();
      q.lineWidth = 1; q.strokeStyle = 'rgba(61,38,49,0.5)'; q.beginPath(); q.ellipse(EX, EY, ERX, ERY, 0, PI * 0.1, PI * 0.9); q.stroke();
      lashes(q, [PI * 1.1, PI * 1.2, PI * 1.31], -1);
      q.lineWidth = 1.6; q.strokeStyle = '#3d2631'; q.beginPath(); q.moveTo(EX + ERX - 0.5, EY - 3); q.quadraticCurveTo(EX + ERX + 2.4, EY - 4.6, EX + ERX + 3.2, EY - 7); q.stroke();
    } else if (mode === 'b') {
      q.strokeStyle = '#3d2631'; q.lineWidth = 2.7; q.lineCap = 'round';
      q.beginPath(); q.moveTo(EX - ERX, EY + 1); q.quadraticCurveTo(EX, EY + 9, EX + ERX + 0.6, EY + 1); q.stroke();
      q.lineWidth = 1.8; for (let i = 0; i < 3; i++) { const t = 0.08 + i * 0.1, x = (1 - t) * (1 - t) * (EX - ERX) + 2 * t * (1 - t) * EX + t * t * (EX + ERX), y = (1 - t) * (1 - t) * (EY + 1) + 2 * t * (1 - t) * (EY + 9) + t * t * (EY + 1); q.beginPath(); q.moveTo(x, y); q.quadraticCurveTo(x - 2, y + 1.5, x - 4.4 + i * 0.8, y + 2.6 - i * 0.4); q.stroke(); }
    } else {
      q.strokeStyle = '#3d2631'; q.lineWidth = 2.8; q.lineCap = 'round';
      q.beginPath(); q.moveTo(EX - ERX - 0.4, EY + 4); q.quadraticCurveTo(EX + 0.4, EY - 11, EX + ERX + 0.6, EY + 4); q.stroke();
      q.lineWidth = 1.8; for (let i = 0; i < 3; i++) { const t = 0.08 + i * 0.1, x = (1 - t) * (1 - t) * (EX - ERX - 0.4) + 2 * t * (1 - t) * (EX + 0.4) + t * t * (EX + ERX + 0.6), y = (1 - t) * (1 - t) * (EY + 4) + 2 * t * (1 - t) * (EY - 11) + t * t * (EY + 4); q.beginPath(); q.moveTo(x, y); q.quadraticCurveTo(x - 2, y - 1.5, x - 4.4 + i * 0.8, y - 3 + i * 0.4); q.stroke(); }
    }
  }
  function headPath(q) { q.beginPath(); ell(q, 0, 0, 21, 20); ell(q, 5, 7, 18, 15); ell(q, 18, 10, 13, 10.5, 0.15); }
  function bakeHead(mode) {
    return mk(84, 74, 36, 36, q => {
      headPath(q); q.lineJoin = 'round'; q.strokeStyle = RIM; q.lineWidth = 3.4; q.stroke();
      q.fillStyle = rg(q, -6, -10, 40, [0, '#ffffff', 0.5, '#fffbf8', 1, '#ffe5e2']); q.fill();
      q.save(); headPath(q); q.clip();
      blob(q, 25, 13, 15, 11, '255,185,205', 0.55);   // burun ucu pembe
      blob(q, 8, 26, 22, 10, '255,200,205', 0.55);    // çene gölgesi
      blob(q, -10, 20, 16, 12, '150,226,226', 0.34);  // çene turkuaz ince gölge
      blob(q, -4, -16, 15, 7, '255,255,255', 0.95);   // alın ışığı
      blob(q, 11, 11, 9, 6, '255,128,170', 0.8);      // yanak
      q.restore();
      q.fillStyle = '#e88aa4'; q.beginPath(); q.ellipse(29.6, 8.2, 1.3, 2.1, -0.35, 0, PI2); q.fill();   // burun deliği
      q.strokeStyle = '#cf6c89'; q.lineCap = 'round'; q.lineWidth = 1.6;
      if (mode === 'c') {
        q.beginPath(); q.moveTo(18.5, 15.8); q.quadraticCurveTo(24.5, 25.5, 30.5, 14.8); q.closePath();
        q.fillStyle = '#d9506f'; q.fill(); q.stroke();
        q.save(); q.beginPath(); q.moveTo(18.5, 15.8); q.quadraticCurveTo(24.5, 25.5, 30.5, 14.8); q.closePath(); q.clip(); blob(q, 24.5, 22.5, 5.5, 3.2, '255,150,170', 1); q.restore();
      } else { q.beginPath(); q.moveTo(19, 16.5); q.quadraticCurveTo(24.5, 20.6, 30, 15.2); q.stroke(); }
      eye(q, mode);
    });
  }

  // ───────── kulak / boynuz / çiçek ─────────
  function bakeEar(far) {
    return mk(24, 30, 12, 26, q => {
      const P = () => { q.beginPath(); q.moveTo(-5.6, 1); q.bezierCurveTo(-8, -8, -5, -17, 0.4, -22); q.bezierCurveTo(5.4, -17, 8, -8, 5.8, 1); q.quadraticCurveTo(0, 4, -5.6, 1); q.closePath(); };
      P(); q.lineJoin = 'round'; q.strokeStyle = far ? RIM_FAR : RIM; q.lineWidth = 3.2; q.stroke();
      q.fillStyle = lg(q, 0, -22, 0, 3, far ? [0, '#fff1ee', 1, '#f6d3dc'] : [0, '#ffffff', 1, '#ffe3e2']); q.fill();
      q.save(); P(); q.clip();
      q.beginPath(); q.moveTo(-3, 1); q.bezierCurveTo(-4.4, -6, -2.6, -12, 0.3, -15.5); q.bezierCurveTo(3, -12, 4.6, -6, 3.4, 1); q.closePath();
      q.fillStyle = lg(q, 0, -15, 0, 2, [0, '#ffd2e0', 1, far ? '#ff9db8' : '#ff8fb0']); q.fill(); q.restore();
    });
  }
  function bakeHorn() {
    return mk(24, 50, 12, 42, q => {
      const P = () => { q.beginPath(); q.moveTo(-6.6, 1); q.quadraticCurveTo(-3.4, -18, 0, -36); q.quadraticCurveTo(3.6, -18, 6.6, 1); q.quadraticCurveTo(0, 5, -6.6, 1); q.closePath(); };
      P(); q.lineJoin = 'round'; q.strokeStyle = '#e8b457'; q.lineWidth = 2.8; q.stroke();
      q.fillStyle = lg(q, -7, 0, 7, 0, [0, '#fffaf0', 0.45, '#ffeaa6', 1, '#f6c35e']); q.fill();
      q.save(); P(); q.clip();
      const ys = [-4, -10.5, -16.5, -22, -26.8, -30.6];
      for (let i = 0; i < ys.length; i++) {
        const y = ys[i], k = 1 - i * 0.12;
        q.lineCap = 'round'; q.strokeStyle = 'rgba(232,160,60,0.75)'; q.lineWidth = 2.1 - i * 0.2;
        q.beginPath(); q.moveTo(-9, y + 2.6 * k); q.quadraticCurveTo(0, y + 5.4 * k, 9, y - 3.6 * k); q.stroke();
        q.strokeStyle = 'rgba(255,255,255,0.9)'; q.lineWidth = 1.2;
        q.beginPath(); q.moveTo(-9, y + 0.8 * k); q.quadraticCurveTo(0, y + 3.5 * k, 9, y - 5.4 * k); q.stroke();
      }
      q.strokeStyle = 'rgba(255,255,255,0.85)'; q.lineWidth = 1.3; q.beginPath(); q.moveTo(-3.2, -2); q.quadraticCurveTo(-2, -16, -0.2, -33); q.stroke();
      q.restore();
      q.beginPath(); q.ellipse(0, 1.5, 7.6, 3.2, 0, 0, PI2); q.fillStyle = lg(q, 0, -2, 0, 5, [0, '#ffe58f', 1, '#f2b24c']); q.fill(); q.strokeStyle = '#e8b457'; q.lineWidth = 1.2; q.stroke();
    });
  }
  function bakeFlower() {
    return mk(20, 20, 10, 10, q => {
      for (let i = 0; i < 5; i++) { q.save(); q.rotate(i * PI2 / 5); q.beginPath(); q.ellipse(0, -4.6, 3.3, 4.4, 0, 0, PI2); q.fillStyle = lg(q, 0, -9, 0, 0, [0, '#ffd0e2', 1, '#ff8fb8']); q.fill(); q.strokeStyle = '#f07aa4'; q.lineWidth = 0.8; q.stroke(); q.restore(); }
      q.beginPath(); q.arc(0, 0, 3.2, 0, PI2); q.fillStyle = rg(q, -0.6, -0.6, 3.6, [0, '#fffbd0', 1, '#ffd34f']); q.fill();
    });
  }

  // ───────── bacak parçaları ─────────
  const L1 = 22, L2 = 24;
  function bakeUpper(far, hind) {
    return mk(30, 36, 15, 8, q => {
      const w0 = hind ? 10 : 7.6, w1 = hind ? 5.2 : 4.7;
      const P = () => { q.beginPath(); q.moveTo(-w0, 0); q.bezierCurveTo(-w0 - 0.6, 8, -w1 - 0.8, 15, -w1, L1); q.quadraticCurveTo(0, L1 + 5.4, w1, L1); q.bezierCurveTo(w1 + 0.8, 15, w0 + 0.6, 8, w0, 0); q.quadraticCurveTo(0, -5, -w0, 0); q.closePath(); };
      P(); q.lineJoin = 'round'; q.strokeStyle = far ? RIM_FAR : RIM; q.lineWidth = 3.2; q.stroke();
      q.fillStyle = lg(q, -w0, 0, w0, 0, far ? [0, '#f9e6ee', 1, '#efd2de'] : [0, '#ffffff', 0.55, '#fff6f3', 1, '#ffdfe4']); q.fill();
      q.save(); P(); q.clip(); blob(q, 3, 16, 6, 9, '255,196,205', far ? 0.35 : 0.45); q.restore();
      q.globalCompositeOperation = 'destination-in'; q.fillStyle = lg(q, 0, -5, 0, 4, [0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,1)']); q.fillRect(-20, -8, 40, 50); q.globalCompositeOperation = 'source-over';
    });
  }
  function bakeLower(far) {
    return mk(30, 36, 15, 6, q => {
      const cannon = () => { q.beginPath(); q.moveTo(-5.2, 0); q.bezierCurveTo(-5, 5, -4.4, 9, -4.5, 16); q.lineTo(4.5, 16); q.bezierCurveTo(4.4, 9, 5, 5, 5.2, 0); q.quadraticCurveTo(0, -5, -5.2, 0); q.closePath(); };
      const hoof = () => { q.beginPath(); q.moveTo(-5.4, 14.4); q.lineTo(5.6, 14.4); q.quadraticCurveTo(8.8, 19.6, 8.8, 23.2); q.quadraticCurveTo(8.8, 25, 7, 25); q.lineTo(-6.8, 25); q.quadraticCurveTo(-8.4, 25, -8.4, 23.2); q.quadraticCurveTo(-8, 18.6, -5.4, 14.4); q.closePath(); };
      cannon(); q.lineJoin = 'round'; q.strokeStyle = far ? RIM_FAR : RIM; q.lineWidth = 3.2; q.stroke();
      q.fillStyle = lg(q, -4.6, 0, 4.6, 0, far ? [0, '#f9e6ee', 1, '#eed0dc'] : [0, '#ffffff', 0.6, '#fff4f1', 1, '#ffdbe2']); q.fill();
      hoof(); q.strokeStyle = far ? '#d99a42' : '#e8a540'; q.lineWidth = 2.2; q.stroke();
      q.fillStyle = lg(q, 0, 15, 0, 25, far ? [0, '#f4d487', 1, '#dd9d45'] : [0, '#fff0b8', 0.45, '#ffd277', 1, '#f0a645']); q.fill();
      q.fillStyle = 'rgba(255,255,255,0.75)'; q.beginPath(); q.ellipse(-2.4, 20.2, 1.5, 2.6, 0.2, 0, PI2); q.fill();
      // tüylü bilek tutamı (pembe-beyaz)
      q.beginPath(); q.moveTo(-5.6, 9); q.quadraticCurveTo(-10, 12, -7.6, 16.4); q.quadraticCurveTo(-5.8, 18.4, -3.6, 16.2); q.quadraticCurveTo(-2, 18.8, 0.4, 16.6); q.quadraticCurveTo(2.4, 18.4, 4.4, 15.8); q.quadraticCurveTo(7.8, 13, 5.8, 9); q.quadraticCurveTo(0, 6.6, -5.6, 9); q.closePath();
      q.strokeStyle = far ? RIM_FAR : RIM; q.lineWidth = 2.4; q.stroke();
      q.fillStyle = lg(q, 0, 8, 0, 21, far ? [0, '#f7e3ea', 1, '#f2b6cb'] : [0, '#fffaf7', 0.5, '#ffe3ea', 1, '#ffb4cf']); q.fill();
      q.strokeStyle = 'rgba(255,255,255,0.8)'; q.lineWidth = 1; q.beginPath(); q.moveTo(-3, 11); q.quadraticCurveTo(-4.4, 14, -3.6, 16.4); q.stroke();
    });
  }
  // ───────── ışıltılar ─────────
  function bakeStar() {
    return mk(32, 32, 16, 16, q => {
      q.fillStyle = rg(q, 0, 0, 16, [0, 'rgba(255,250,225,0.95)', 0.25, 'rgba(255,240,190,0.45)', 1, 'rgba(255,240,190,0)']); q.fillRect(-16, -16, 32, 32);
      const r = 12.5, k = 1.7; q.beginPath(); q.moveTo(0, -r); q.quadraticCurveTo(k, -k, r, 0); q.quadraticCurveTo(k, k, 0, r); q.quadraticCurveTo(-k, k, -r, 0); q.quadraticCurveTo(-k, -k, 0, -r); q.closePath();
      q.fillStyle = '#fffdf0'; q.fill();
    });
  }
  function bakeGlow(rgb, a, R) { return mk(R * 2, R * 2, R, R, q => { q.fillStyle = rg(q, 0, 0, R, [0, 'rgba(' + rgb + ',' + a + ')', 0.4, 'rgba(' + rgb + ',' + a * 0.35 + ')', 1, 'rgba(' + rgb + ',0)']); q.fillRect(-R, -R, R * 2, R * 2); }); }

  function build() {
    if (SP) return SP;
    SP = { torso: bakeTorso(), head: { a: bakeHead('a'), b: bakeHead('b'), c: bakeHead('c') }, earN: bakeEar(false), earF: bakeEar(true), horn: bakeHorn(), flower: bakeFlower(),
      upN: bakeUpper(false, false), upNH: bakeUpper(false, true), upF: bakeUpper(true, false), upFH: bakeUpper(true, true), loN: bakeLower(false), loF: bakeLower(true),
      star: bakeStar(), hglow: bakeGlow('255,244,200', 0.95, 32), aura: bakeGlow('255,236,248', 0.9, 90), cg: CC.map(c => bakeGlow(hex2rgb(c), 0.9, 16)) };
    return SP;
  }
  function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); }
  function spark(c, x, y, r, a, rot) { if (a <= 0.02) return; c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot || 0); c.drawImage(SP.star.c, -r, -r, r * 2, r * 2); c.restore(); }

  // ───────── yele / kuyruk şeritleri (düz renk, kare başına yalnız yol) ─────────
  const NP = 12, PX = new Float32Array(NP + 1), PY = new Float32Array(NP + 1), LX = new Float32Array(NP + 1), LY = new Float32Array(NP + 1), RX = new Float32Array(NP + 1), RY = new Float32Array(NP + 1);
  let TX = 0, TY = 0;
  function strand(c, bx, by, dx, dy, L, W, col, ph, amp, tm, grav, wv, wsp) {
    const m = Math.hypot(dx, dy); dx /= m; dy /= m;
    for (let i = 0; i <= NP; i++) {
      const u = i / NP, s = u * L;
      const wave = Math.sin(tm * wv - u * wsp + ph) * amp * u + Math.sin(tm * wv * 0.57 - u * wsp * 0.55 + ph * 1.7) * amp * 0.5 * u * u;
      PX[i] = bx + dx * s - dy * wave; PY[i] = by + dy * s + dx * wave + grav * u * u;
    }
    for (let i = 0; i <= NP; i++) {
      const a = i ? i - 1 : 0, b = i < NP ? i + 1 : NP; let tx = PX[b] - PX[a], ty = PY[b] - PY[a]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const u = i / NP, wd = Math.max(3, W * Math.pow(1 - u, 0.5) * Math.min(1, 0.5 + u * 7)) * 0.5;
      LX[i] = PX[i] - ty * wd; LY[i] = PY[i] + tx * wd; RX[i] = PX[i] + ty * wd; RY[i] = PY[i] - tx * wd;
    }
    c.beginPath(); c.moveTo(LX[0], LY[0]);
    for (let i = 1; i < NP; i++) c.quadraticCurveTo(LX[i], LY[i], (LX[i] + LX[i + 1]) / 2, (LY[i] + LY[i + 1]) / 2);
    c.lineTo(LX[NP], LY[NP]); c.lineTo(RX[NP], RY[NP]);
    for (let i = NP - 1; i > 0; i--) c.quadraticCurveTo(RX[i + 1], RY[i + 1], (RX[i] + RX[i + 1]) / 2, (RY[i] + RY[i + 1]) / 2);
    c.lineTo(RX[0], RY[0]); c.closePath();
    c.fillStyle = col; c.fill(); c.lineWidth = 0.9; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke();
    c.beginPath(); c.arc(PX[NP], PY[NP], 1.1, 0, PI2); c.arc(PX[0], PY[0], Math.hypot(LX[0] - PX[0], LY[0] - PY[0]), 0, PI2); c.fill();
    // parlak şerit (ışık)
    c.beginPath(); c.moveTo(PX[0] + (LX[0] - PX[0]) * 0.45, PY[0] + (LY[0] - PY[0]) * 0.45);
    for (let i = 1; i <= 8; i++) c.lineTo(PX[i] + (LX[i] - PX[i]) * 0.42, PY[i] + (LY[i] - PY[i]) * 0.42);
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = Math.max(0.9, W * 0.2); c.lineCap = 'round'; c.stroke();
    TX = PX[NP]; TY = PY[NP];
  }
  const TAIL_N = 14;
  function kuyruk(c, tm, w, kay) {
    const wv = 2.6 + 3.2 * w, amp = 4 + 9 * w, grav = (1 - w) * 30 + 6;
    for (let k = 0; k < TAIL_N; k++) {
      const f = (k * 5 % TAIL_N) / (TAIL_N - 1), L = 50 + 34 * (0.5 + 0.5 * Math.sin(k * 2.3)) + 22 * w, sp = k - 6.5;
      strand(c, -49, -72 + sp * 1.2, -0.95, 0.12 + (1 - w) * 0.42 + sp * 0.04 + kay * 0.05, L, 15 - 3 * Math.abs(sp) / 6.5, CC[k % 7], k * 0.85, amp * (0.8 + 0.4 * f), tm, grav * (0.8 + 0.4 * f), wv, 3.4);
      if (k % 3 === 0) { const tw = Math.sin(tm * 5 + k * 1.9); spark(c, TX, TY, 4.5 + 2 * tw, 0.55 + 0.4 * tw, tm * 0.9 + k); }
    }
  }
  function crest(t) { const u = 1 - t; return [u * u * 24 + 2 * u * t * 30 + t * t * 44, u * u * -88 + 2 * u * t * -108 + t * t * -128]; }
  function yele(c, tm, w) {
    const wv = 2.9 + 3 * w, amp = 3.4 + 7 * w, grav = (1 - w) * 26 + 4;
    for (let k = 0; k < 11; k++) {
      const t = 0.06 + k / 10 * 0.9, p = crest(t), L = (38 + 20 * (0.5 + 0.5 * Math.sin(k * 1.9 + 1)) + 16 * w) * (1 - 0.25 * t);
      strand(c, p[0], p[1], -0.9 + t * 0.2, -0.15 + (1 - w) * 0.55 - t * 0.3, L, 13 - 2 * t, CC[(k * 3 + 1) % 7], k * 0.7 + 1, amp, tm, grav * (1 - 0.4 * t), wv, 3.2);
      if (k % 4 === 1) { const tw = Math.sin(tm * 5.3 + k * 2.1); spark(c, TX, TY, 4 + 1.8 * tw, 0.55 + 0.4 * tw, tm + k); }
    }
  }
  function perca(c, tm, w) {   // alın perçemi: yüzün önüne sevimli kıvrılan 3 tutam (baş çerçevesinde)
    const cols = [CC[4], CC[2], CC[0]], X0 = [-2, 3, 8], A0 = [-1.1, -0.95, -0.8];
    for (let k = 0; k < 3; k++) {
      let x = X0[k], y = -17 - k * 0.5, a = A0[k] + Math.sin(tm * 2.4 + k) * 0.05 - w * 0.2;
      const pts = []; for (let i = 0; i <= 10; i++) { pts.push(x, y); const u = i / 10; a += 0.19 + 0.25 * u; x += Math.cos(a) * 2.8; y += Math.sin(a) * 2.8; }
      for (let i = 0; i <= 10; i++) { PX[i] = pts[i * 2]; PY[i] = pts[i * 2 + 1]; }
      for (let i = 0; i <= 10; i++) {
        const a2 = i ? i - 1 : 0, b = i < 10 ? i + 1 : 10; let tx = PX[b] - PX[a2], ty = PY[b] - PY[a2]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
        const wd = Math.max(1.4, 8.2 * Math.pow(1 - i / 10, 0.6) * Math.min(1, 0.5 + i / 2.5)) * 0.5; LX[i] = PX[i] - ty * wd; LY[i] = PY[i] + tx * wd; RX[i] = PX[i] + ty * wd; RY[i] = PY[i] - tx * wd;
      }
      c.beginPath(); c.moveTo(LX[0], LY[0]); for (let i = 1; i < 10; i++) c.quadraticCurveTo(LX[i], LY[i], (LX[i] + LX[i + 1]) / 2, (LY[i] + LY[i + 1]) / 2);
      c.lineTo(LX[10], LY[10]); c.lineTo(RX[10], RY[10]); for (let i = 9; i > 0; i--) c.quadraticCurveTo(RX[i + 1], RY[i + 1], (RX[i] + RX[i + 1]) / 2, (RY[i] + RY[i + 1]) / 2);
      c.lineTo(RX[0], RY[0]); c.closePath(); c.fillStyle = cols[k]; c.fill(); c.lineWidth = 0.9; c.strokeStyle = 'rgba(255,255,255,0.6)'; c.stroke(); c.beginPath(); c.arc(PX[0], PY[0], Math.hypot(LX[0] - PX[0], LY[0] - PY[0]) * 0.8, 0, PI2); c.fill();
    }
  }

  // ───────── bacak açıları ─────────
  // front: [a1 üst, b alt]; çıkış LEG (yeniden kullanılır, çöp yok)
  const LEG = { a: 0, b: 0 };
  function onBacak(p, tm, mod, ph) {   // ön bacak
    if (mod === 'kay') { LEG.a = 0.95 + 0.08 * Math.sin(tm * 3 + ph); LEG.b = LEG.a + 0.3 + 0.08 * Math.sin(tm * 4 + ph); }
    else if (mod === 'tris') { const s = Math.sin(p), f = Math.max(0, Math.cos(p)); LEG.a = 0.03 + 0.6 * s; LEG.b = LEG.a - 1.05 * f; }
    else { LEG.a = 0.03 + 0.015 * Math.sin(tm * 1.7 + ph); LEG.b = LEG.a; }
  }
  function arkaBacak(p, tm, mod, ph) {   // arka bacak (diz geriye bakar)
    if (mod === 'kay') { LEG.a = -0.85 + 0.08 * Math.sin(tm * 3.3 + ph); LEG.b = LEG.a - 0.35 + 0.1 * Math.sin(tm * 4.1 + ph); }
    else if (mod === 'tris') { const s = Math.sin(p), f = Math.max(0, Math.cos(p)); LEG.a = -0.2 + 0.55 * s; LEG.b = 0.12 + 0.5 * s - 0.9 * f; }
    else { LEG.a = -0.2; LEG.b = 0.12; }
  }
  function bacak(c, up, lo, hx, hy, a, b) {
    c.save(); c.translate(hx, hy); c.rotate(-b === 0 ? 0 : 0);
    // alt parça: dizden toynağa (önce alt, sonra üst parça üstünde)
    const kx = Math.sin(a) * L1, ky = Math.cos(a) * L1;
    c.save(); c.translate(kx, ky); c.rotate(-b); blit(c, lo, 0, 0); c.restore();
    c.save(); c.rotate(-a); blit(c, up, 0, 0); c.restore();
    c.restore();
  }

  // ───────── durum (bacak/gövde salınımı) ─────────
  function durum(st, tm) {
    const poz = st.poz || 'dur', hiz = cl(st.hiz == null ? 0 : st.hiz, 0, 1), w = cl(st.ruzgar == null ? hiz : st.ruzgar, 0, 1);
    const kay = poz === 'kay' || poz === 'sicra' ? 1 : 0, sal = poz === 'sal' ? 1 : 0, tris = poz === 'tırıs' ? 1 : 0;
    const ph = tm * (tris ? 9 : 5);
    let bob, roll, nod;
    if (tris) { bob = -2.6 * (0.5 + 0.5 * Math.cos(2 * ph)); roll = 0.03 * Math.sin(ph); nod = 0.05 * Math.sin(2 * ph + 1); }
    else if (kay) { bob = Math.sin(tm * 3.1) * 1.3; roll = 0.02 * Math.sin(tm * 2.3); nod = 0.04 * Math.sin(tm * 2.7) - 0.05; }
    else { bob = Math.sin(tm * 2.1) * 0.9; roll = 0.012 * Math.sin(tm * 1.4); nod = 0.03 * Math.sin(tm * 1.9) + (sal ? 0.06 * Math.sin(tm * 3) : 0); }
    return { poz, w, kay, sal, tris, ph, bob, roll, nod };
  }
  function bodyT(c, D) { c.translate(0, D.bob); c.translate(0, -45); c.rotate(D.roll); c.translate(0, 45); }

  function ciz(ctx, x, y, rot, st, tm) {
    st = st || {}; tm = tm || 0;
    const c = ctx || g; build();
    const D = durum(st, tm), hop = st.hop || 0, w = D.w, kay = D.kay;
    LAST = D;
    c.save(); c.translate(x, y); c.rotate(rot || 0); c.translate(0, -hop);
    c.globalAlpha = 0.3 + 0.14 * w; blit(c, SP.aura, 4, -62); c.globalAlpha = 1;
    const mod = kay ? 'kay' : D.tris ? 'tris' : 'dur', ph = D.ph, hyH = -47 + D.bob, hyF = -45 + D.bob;
    // uzak bacaklar (gövdenin arkasında)
    onBacak(ph + PI, tm, mod, 1.1); bacak(c, SP.upF, SP.loF, 33, hyF, LEG.a, LEG.b);
    arkaBacak(ph, tm, mod, 2.0); bacak(c, SP.upFH, SP.loF, -25, hyH, LEG.a, LEG.b);
    // kuyruk + gövde + boyun
    c.save(); bodyT(c, D);
    kuyruk(c, tm, w, kay);
    const br = 1 + 0.012 * Math.sin(tm * 2.6);
    c.save(); c.translate(0, -34); c.scale(1, br); c.translate(0, 34); blit(c, SP.torso, 0, 0); c.restore();
    c.restore();
    // yakın bacaklar
    if (D.sal) { const q = Math.sin(tm * 9); onBacak(0, tm, 'dur', 0.5); LEG.a = 2.15 + 0.08 * Math.sin(tm * 4); LEG.b = LEG.a - 0.3 + 0.7 * q; }
    else onBacak(ph, tm, mod, 0);
    bacak(c, SP.upN, SP.loN, 27, hyF + 1, LEG.a, LEG.b);
    arkaBacak(ph + PI, tm, mod, 0.4); bacak(c, SP.upNH, SP.loN, -31, hyH + 1, LEG.a, LEG.b);
    // yele + baş
    c.save(); bodyT(c, D);
    yele(c, tm, w);
    const hx = 56, hy = -109 + 1.0 * Math.sin(tm * 2.1) + (kay ? 3 : 0);
    const blinkT = tm % 3.9, blink = blinkT > 3.74 || (tm % 7.3) > 7.16, happy = st.sevinc > 0.5 || D.sal && st.sevinc == null && 0;
    const hd = happy ? SP.head.c : blink ? SP.head.b : SP.head.a;
    c.save(); c.translate(hx, hy); c.rotate(D.nod + (kay ? 0.08 : 0)); c.scale(1.22, 1.22);
    const flick = Math.max(0, Math.sin(tm * 1.1 + 1)) > 0.985 ? 0.35 : 0;
    c.save(); c.translate(5, -19); c.rotate(0.3 + 0.05 * Math.sin(tm * 2)); blit(c, SP.earF, 0, 0); c.restore();
    blit(c, hd, 0, 0);
    c.save(); c.translate(-9, -16); c.rotate(-0.25 - 0.05 * w - flick); blit(c, SP.earN, 0, 0); c.restore();
    // boynuz
    c.save(); c.translate(9, -18); c.rotate(0.32); blit(c, SP.horn, 0, 0); c.restore();
    const tx = 9 + Math.sin(0.32) * 35, ty = -18 - Math.cos(0.32) * 35, gl = 0.5 + 0.5 * Math.sin(tm * 3.4);
    perca(c, tm, w);
    blit(c, SP.flower, -15, -9);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 + 0.4 * gl; c.drawImage(SP.hglow.c, tx - 24, ty - 24, 48, 48); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    spark(c, tx, ty, 7 + 3 * gl, 0.7 + 0.3 * gl, tm * 0.8);
    if (Math.sin(tm * 2.3) > 0.2) spark(c, tx - 9 + 3 * Math.sin(tm * 3), ty + 10, 3 + 1.6 * Math.sin(tm * 6), 0.7, -tm);
    c.restore();
    c.restore();
    c.restore();
  }
  // Feza'yı Işıl'ın sırtında çiz: çağıran, Işıl'ın çerçevesinde (x,y,rot) çizilen Feza'yı ISIL.fezaCiz ile çizer (Işıl'dan sonra)
  const FO = { el: { x: 17, y: -10 }, vy: 0, sevinc: undefined, aci: 0 };
  function fezaCiz(x, y, rot, st, tm, ctx) {
    if (typeof fezaCizPoz !== 'function') return;
    st = st || {}; tm = tm || 0;
    const c = ctx || g, hop = st.hop || 0;
    c.save(); c.translate(x, y); c.rotate(rot || 0); c.translate(0, -hop);
    c.translate(0, LAST.bob); c.translate(0, -45); c.rotate(LAST.roll); c.translate(0, 45);
    FO.vy = st.fvy || 0; FO.sevinc = st.sevinc; FO.aci = 0; FO.ruzgar = cl(st.ruzgar == null ? 0.6 : st.ruzgar, 0, 1);
    FO.el.x = 22; FO.el.y = -14;
    try { fezaCizPoz(c, SEAT.x, SEAT.y + 6, 1, 'binis', tm, null, FO); } catch (e) {}
    c.restore();
  }
  // kayarken Işıl'ın arkasında kalan çok renkli ışıltı izi (noktalar dünya koordinatında; çağıran listeyi tutar)
  function iz(liste, tm, ctx) {
    if (!liste || liste.length < 2) return;
    const c = ctx || g; build();
    c.save(); c.globalCompositeOperation = 'lighter';
    const n = liste.length;
    for (let k = 0; k < n; k += 2) {
      const p = liste[k], u = k / (n - 1), a = u * u * 0.8, tw = 0.5 + 0.5 * Math.sin(tm * 8 + k * 1.7), r = 9 + 8 * u;
      c.globalAlpha = a * 0.5; c.drawImage(SP.cg[k % 7].c, p.x - r, p.y - 14 + Math.sin(k) * 6 - r, r * 2, r * 2);
      if (tw > 0.45) { const rr = 2.5 + 3 * tw; spark(c, p.x + Math.cos(k * 2.3) * 9, p.y - 22 + Math.sin(k * 1.3) * 14, rr * 1.6, a * tw, tm + k); }
    }
    c.restore();
  }
  try { setTimeout(() => { try { build(); } catch (e) {} }, 1200); } catch (e) {}
  window.ISIL = { ciz, fezaCiz, iz, SEAT, CC };
})();
