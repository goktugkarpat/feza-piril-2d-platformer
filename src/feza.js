/* feza.js – Feza modeli ve animasyonları (drawFeza, fezaUpdate)
   Klasik script: üst düzey const/let/function'lar diğer dosyalarla ortak (ortak.js önce yüklenir).
   Bu dosyadaki bütün yardımcı adlar fz/FZ ile başlar (başka dosyalarla çakışmasın).
   Yerel koordinat: ayak tabanı (0,0), sağa bakıyor, yukarı = -y. Boy ~60 birim, ekrana 1.3 ölçekle çizilir.
   Uzuv açıları: aşağıdan ölçülür, + = ileri. Diz bükülmesi (-), dirsek bükülmesi (+).
   Animasyonlar: yürüyüş↔koşu (hıza göre adım), olaylarla: ziplatti (yıldız pozu, önden; Büyük Pofuduk'ta takla),
   uyandi (mutlu sekme), cicek/tohum (uzanır, sonra önden kollar havada sevinir), carpti (iter), kurtarildi (Pırıl'ın
   patisine Peter Pan gibi tutunur), uçurum kenarında "eyvah", hareketli cisimde denge, Büyük Pofuduk/ağaca hayranlık,
   uzun beklemede el sallama / esneme / gerinme / oturma / uyuklama; uçurum kenarında bir süre durunca kenara oturup
   ayaklarını boşlukta sallar; fırlatıldıktan sonra yere inince önden "ta-da!"; iterken gözler > <.
   İnce ayar katmanı (ikincil hareket/duygu): ivmeye bağlı eğilme (P.a_ax), koşudan duruşta kısa fren duruşu (P.a_brk), inişe hazırlık
   (P.a_pre: düşerken zemine yakınsa bacaklar uzanır), gömlek etek ucunun gecikmeli savrulması (P.a_cl yay), koşuda uçuş evresi (bob),
   şaşırma tepkileri (buyukAsama/aydinlat/uyandi → P.a_sur), çift zıplama ezilme-uzama (P.a_dj), yer gölgesi (fzShadow), yakındaki
   açık çiçeğin sıcak kenar ışığı, bakışta mikro sakkad, Pırıl hızla yakından geçerse gözle takip.
   OLAY 'adim' {x, y, hiz, inis?}: her ayak basışında (ses için).
   Dışa açık: P.a_elX, P.a_elY (ön elin dünya konumu; Pırıl taşırken tutar), P.a_state, fezaCizPoz (ara sahneler, en altta).
   Çizim konumu P.rx/P.ry varsa onu kullanır.
   Bölüm 3: P.ucus doluyken çizmez (ucus.js fezaCizPoz 'binis' ile çizer); P.poz === 'kayma' iken gökkuşağı kayma pozu; OLAY 'kuzu' → sarılma + sevinç;
   esintide süzülme; bulut zeminde yaylanan iniş ve "bulutu okşama" beklemesi; gün doğumu ışığı (FZ_AMB3). Dönüşte 3/4 yüz (P.a_yaw). Ayrıntı: src/BOLUM3.md "FEZA notları". */
'use strict';

// ── renkler ──
const FZ = {
  skin: '#f8d5bc', skinHi: '#fee9da', skinS: '#e6b498', skinD: '#cf9a7e', skinF: '#e7bba0',
  hair: ['#33221a', '#4b3324', '#5f412d', '#77543a', '#a07a58'],
  pj: '#f8f2e5', pjS: '#ddd4c3', pjF: '#ddd3c1', pjLine: '#bdb2a0',
  brow: '#5b3a24', lash: '#26150b', lip: '#b05a48', mouth: '#6e2626', tongue: '#d4606c',
  shoe: '#f6f6f3', shoeF: '#d4d5d8', blue: '#3b7be2', blueF: '#2d5fb0', sole: '#d9dbe2', soleF: '#b4b6bf',
  cloud: '#97a1b4', pink: '#f28fae', sky: '#86bbea', yel: '#f3c94c', star: '#f07c9c'
};
const FZ_TH = 8.0, FZ_SH = 7.6, FZ_FT = 2.1, FZ_AIRHIP = -18.6, FZ_UA = 6.6, FZ_FA = 6.0, FZ_SC = 1.4;
const FZ_HAIR0 = FZ.hair.slice(), FZ_HAIR_B2 = ['#26160f', '#37241a', '#47301f', '#5a3f2a', '#7a5a3b'];   // Bölüm 2 oyun içi saç daha koyu kestane (yalnız drawFeza; ara sahne pozları hep orijinal tonla)
const FZ_KEYS = ['lean', 'hx', 'bob', 'lt1', 'lt2', 'bt1', 'bt2', 'la1', 'la2', 'ba1', 'ba2', 'shr', 'head', 'gx', 'gy',
  'lid', 'happy', 'sq', 'brow', 'mSmile', 'mOpen', 'mRound', 'sx', 'sy', 'air', 'breath', 'hOpen', 'arm', 'spr'];
const FZ_REST = { lean: 0.03, hx: 0, bob: 0, lt1: 0.04, lt2: -0.08, bt1: -0.04, bt2: -0.06, la1: 0.12, la2: 0.35,
  ba1: -0.1, ba2: 0.35, shr: 0, head: 0, gx: 0.5, gy: 0.05, lid: 1, happy: 0, sq: 0, brow: 0, mSmile: 0.7, mOpen: 0, mRound: 0,
  sx: 1, sy: 1, air: 0, breath: 0, hOpen: 0, arm: 1, spr: 0 };
const FZ_VMAX = { la1: 18, la2: 20, ba1: 18, ba2: 20, lt1: 22, lt2: 22, bt1: 22, bt2: 22, lean: 6, head: 7 };   // rad/sn
const fzC = document.createElement('canvas'), fzX = fzC.getContext('2d');
const fzR = document.createElement('canvas'), fzRX = fzR.getContext('2d');
// poz nesneleri hep aynı biçimde (sabit alanlar, ondalık değerler): kare başına sözlük/kutu ayırma olmasın.
// Yaylar düz Float64Array'lerde çalışır (FZ_KEYS sırası); nesnelere adıyla tek tek kopyalanır.
function fzPose() { return { lean: 0.5, hx: 0.5, bob: 0.5, lt1: 0.5, lt2: 0.5, bt1: 0.5, bt2: 0.5, la1: 0.5, la2: 0.5, ba1: 0.5, ba2: 0.5, shr: 0.5, head: 0.5, gx: 0.5, gy: 0.5, lid: 0.5, happy: 0.5, sq: 0.5, brow: 0.5, mSmile: 0.5, mOpen: 0.5, mRound: 0.5, sx: 0.5, sy: 0.5, air: 0.5, breath: 0.5, hOpen: 0.5, arm: 0.5, spr: 0.5 }; }
function fzPack(o, a) { a[0] = o.lean; a[1] = o.hx; a[2] = o.bob; a[3] = o.lt1; a[4] = o.lt2; a[5] = o.bt1; a[6] = o.bt2; a[7] = o.la1; a[8] = o.la2; a[9] = o.ba1; a[10] = o.ba2; a[11] = o.shr; a[12] = o.head; a[13] = o.gx; a[14] = o.gy; a[15] = o.lid; a[16] = o.happy; a[17] = o.sq; a[18] = o.brow; a[19] = o.mSmile; a[20] = o.mOpen; a[21] = o.mRound; a[22] = o.sx; a[23] = o.sy; a[24] = o.air; a[25] = o.breath; a[26] = o.hOpen; a[27] = o.arm; a[28] = o.spr; }
function fzUnpack(a, o) { o.lean = a[0]; o.hx = a[1]; o.bob = a[2]; o.lt1 = a[3]; o.lt2 = a[4]; o.bt1 = a[5]; o.bt2 = a[6]; o.la1 = a[7]; o.la2 = a[8]; o.ba1 = a[9]; o.ba2 = a[10]; o.shr = a[11]; o.head = a[12]; o.gx = a[13]; o.gy = a[14]; o.lid = a[15]; o.happy = a[16]; o.sq = a[17]; o.brow = a[18]; o.mSmile = a[19]; o.mOpen = a[20]; o.mRound = a[21]; o.sx = a[22]; o.sy = a[23]; o.air = a[24]; o.breath = a[25]; o.hOpen = a[26]; o.arm = a[27]; o.spr = a[28]; }
const FZ_N = FZ_KEYS.length, FZ_I_AIR = FZ_KEYS.indexOf('air'), FZ_I_GX = FZ_KEYS.indexOf('gx');
const FZ_RESTA = new Float64Array(FZ_N), FZ_VMAXA = new Float64Array(FZ_N), FZ_TA = new Float64Array(FZ_N);
for (let i = 0; i < FZ_N; i++) { FZ_RESTA[i] = FZ_REST[FZ_KEYS[i]]; FZ_VMAXA[i] = FZ_VMAX[FZ_KEYS[i]] || 0; }
const FZ_T = fzPose();
// çizim fonksiyonlarının okuduğu durum: oyunda P, ara sahnelerde fzCS (oyundaki sprite durumuna dokunmadan)
let fzQ = P;
// büyük çizim katsayısı: ara sahne yakın çekimlerinde (birim başına ≥ 12 piksel) 1, oyun boyunda 0. İnce çizgiler,
// uçuşan teller ve tutam ton farkları buna göre yumuşar; oyundaki çizim (drawFeza) hep 0 ile çizilir.
let fzBuyuk = 0;

// ── yardımcı şekiller ──
function fzJ(ax, ay, l1, a1, l2, a2) {   // eklem zinciri: [kökx, köky, dizx, dizy, uçx, uçy, uç açısı]
  const kx = ax + Math.sin(a1) * l1, ky = ay + Math.cos(a1) * l1;
  return [ax, ay, kx, ky, kx + Math.sin(a1 + a2) * l2, ky + Math.cos(a1 + a2) * l2, a1 + a2];
}
function fzTaper(x, ax, ay, bx, by, r1, r2, col) {   // iki ucu yuvarlak, incelen kapsül
  const a = Math.atan2(by - ay, bx - ax);
  x.fillStyle = col; x.beginPath();
  x.arc(ax, ay, r1, a + 1.5708, a - 1.5708);
  x.arc(bx, by, r2, a - 1.5708, a + 1.5708);
  x.closePath(); x.fill();
}
// sabit renk geçişleri: yerel koordinatta bir kez kurulur, her karede yeniden kullanılır (kare başına yeni gradyan yok).
// Geçişler çizim anındaki dönüşümle yorumlanır; konumu değişenler translate/scale ile yerine oturtulur.
function fzGrad(x, id) {
  const m = x.__fzG || (x.__fzG = []);
  let gr = m[id]; if (gr) return gr;
  const H = FZ.hair;
  switch (id) {
    case 0: gr = x.createLinearGradient(-6.5, 0, 7.5, 0);   // gövde (yan)
      gr.addColorStop(0, 'rgba(70,58,110,0.32)'); gr.addColorStop(0.42, 'rgba(70,58,110,0)'); gr.addColorStop(0.8, 'rgba(255,250,240,0.08)'); gr.addColorStop(1, 'rgba(70,58,110,0.16)'); break;
    case 1: gr = x.createLinearGradient(-7, 0, 7, 0);       // gövde (önden)
      gr.addColorStop(0, 'rgba(70,58,110,0.3)'); gr.addColorStop(0.3, 'rgba(70,58,110,0)'); gr.addColorStop(0.7, 'rgba(70,58,110,0)'); gr.addColorStop(1, 'rgba(70,58,110,0.3)'); break;
    case 2: gr = x.createRadialGradient(3.6, -1.6, 1, 2.0, 0.5, 11.5);   // yüz (yan)
      gr.addColorStop(0, FZ.skinHi); gr.addColorStop(0.5, FZ.skin); gr.addColorStop(1, FZ.skinS); break;
    case 3: gr = x.createRadialGradient(0, -1.0, 1, 0, 0.5, 11.5);       // yüz (önden)
      gr.addColorStop(0, FZ.skinHi); gr.addColorStop(0.55, FZ.skin); gr.addColorStop(1, FZ.skinS); break;
    case 4: gr = x.createLinearGradient(0, -14, 0, 5); gr.addColorStop(0, H[3]); gr.addColorStop(0.45, H[2]); gr.addColorStop(1, H[1]); break;   // saç kütlesi
    case 5: gr = x.createLinearGradient(0, -15, 0, 0); gr.addColorStop(0, H[3]); gr.addColorStop(0.5, H[2]); gr.addColorStop(1, H[1]); break;    // saç kütlesi (önden)
    case 6: case 7: {   // saçtaki parlak halka (merkez y=0; çizerken cy kadar kaydırılır)
      const cx = id === 7 ? 0.4 : 0.2, r = id === 7 ? 10.2 : 10.0;
      gr = x.createRadialGradient(cx, 0, r - 2.6, cx, 0, r + 1.6);
      gr.addColorStop(0, 'rgba(225,175,120,0)'); gr.addColorStop(0.5, 'rgba(225,175,120,0.3)'); gr.addColorStop(0.62, 'rgba(240,196,140,0.36)'); gr.addColorStop(1, 'rgba(225,175,120,0)'); break;
    }
    case 8: gr = x.createLinearGradient(0, -16, 0, 6);
      gr.addColorStop(0, 'rgba(255,200,140,0.16)'); gr.addColorStop(0.4, 'rgba(60,30,15,0)'); gr.addColorStop(1, 'rgba(35,16,8,0.5)'); break;
    case 9: gr = x.createLinearGradient(0, 0, 0, 1); gr.addColorStop(0, 'rgba(70,32,16,0.45)'); gr.addColorStop(1, 'rgba(70,32,16,0)'); break;   // kapak gölgesi (birim)
    case 10: case 11: case 12: case 13: {   // iris (merkez 0,0)
      const ri = (id & 1 ? 1.5 : 1.78) * (id & 2 ? 0.86 : 1);
      gr = x.createRadialGradient(0, ri * 0.5, ri * 0.05, 0, 0, ri);
      gr.addColorStop(0, '#d59d5e'); gr.addColorStop(0.38, '#9a5d2e'); gr.addColorStop(0.78, '#5a2f17'); gr.addColorStop(1, '#2c1408'); break;
    }
    case 14: gr = x.createRadialGradient(0, 0, 0, 0, 0, 1);   // yanak (birim)
      gr.addColorStop(0, 'rgba(255,112,108,0.42)'); gr.addColorStop(0.55, 'rgba(255,120,112,0.2)'); gr.addColorStop(1, 'rgba(255,125,115,0)'); break;
    case 15: gr = x.createLinearGradient(-2.25, 0, 2.25, 0);  // kol ağzı (dönmüş çerçevede)
      gr.addColorStop(0, 'rgba(255,252,246,0.25)'); gr.addColorStop(0.5, 'rgba(70,58,110,0)'); gr.addColorStop(1, 'rgba(70,58,110,0.24)'); break;
    case 16: case 17: case 18: {   // Bölüm 8: kabak tulum (yan / önden) ve kabak sepeti (merkez 0,0)
      const r = id === 18 ? 5.2 : 9.6;
      gr = x.createRadialGradient(id === 16 ? r * 0.3 : r * 0.18, -r * 0.42, r * 0.08, 0, 0, r);
      gr.addColorStop(0, '#ffcf86'); gr.addColorStop(0.45, '#ffa548'); gr.addColorStop(0.85, '#f07f2e'); gr.addColorStop(1, '#d9661f'); break;
    }
  }
  return (m[id] = gr);
}
function fzEl(x, cx, cy, rx, ry) { x.moveTo(cx + rx, cy); x.ellipse(cx, cy, rx, ry, 0, 0, 6.2832); }
// ── pijama deseni: bulut, uçak, yıldız ──
function fzCloud(x, cx, cy, s) {
  x.beginPath(); x.moveTo(cx - 1.25 * s, cy + 0.35 * s);
  x.arc(cx - 0.7 * s, cy, 0.5 * s, 2.6, 5.2); x.arc(cx + 0.05 * s, cy - 0.3 * s, 0.68 * s, 3.6, 6.0);
  x.arc(cx + 0.8 * s, cy + 0.05 * s, 0.45 * s, 4.4, 1.0); x.closePath();
  x.fillStyle = '#ffffff'; x.fill(); x.strokeStyle = FZ.cloud; x.lineWidth = 0.28; x.stroke();
}
function fzPlane(x, cx, cy, s, col, rot) {
  x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(s, s); x.fillStyle = col;
  x.beginPath(); x.ellipse(0, 0, 1.55, 0.42, 0, 0, 6.2832); x.fill();
  x.beginPath(); x.moveTo(0.35, 0); x.lineTo(-0.35, -1.3); x.lineTo(-0.75, -1.25); x.lineTo(-0.35, 0);
  x.lineTo(-0.75, 1.25); x.lineTo(-0.35, 1.3); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(-1.1, 0); x.lineTo(-1.55, -0.6); x.lineTo(-1.7, 0.6); x.closePath(); x.fill();
  x.restore();
}
function fzStar(x, cx, cy, r) {
  x.beginPath();
  for (let i = 0; i < 10; i++) { const a = -1.5708 + i * 0.6283, rr = i & 1 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  x.closePath(); x.fill();
}
function fzPrint(x) {
  fzCloud(x, -2.4, -11.4, 1.1); fzCloud(x, 2.6, -4.8, 1.0); fzCloud(x, -3.4, -1.0, 0.9);
  fzPlane(x, 2.7, -11.6, 1.0, FZ.pink, -0.3); fzPlane(x, -2.5, -6.4, 0.95, FZ.sky, 0.25); fzPlane(x, 3.5, 0.0, 0.85, FZ.yel, -0.15);
  x.fillStyle = FZ.star;
  fzStar(x, -4.5, -13.4, 0.6); fzStar(x, 0.2, -8.6, 0.55); fzStar(x, 4.8, -7.8, 0.55); fzStar(x, -0.4, -2.8, 0.5); fzStar(x, -5.0, -4.6, 0.5); fzStar(x, 0.9, 0.9, 0.45);
}

// ── uzuvlar ──
function fzShoe(x, ax, ay, rot, far) {
  x.save(); x.translate(ax, ay); x.rotate(rot); x.scale(0.86, 0.86);
  x.fillStyle = far ? '#d2cdc4' : '#f3efe7'; x.beginPath(); x.ellipse(0.1, -0.3, 1.85, 1.1, 0, 0, 6.2832); x.fill();  // çorap
  x.fillStyle = far ? FZ.shoeF : FZ.shoe; x.beginPath();
  x.moveTo(-2.5, 1.7); x.lineTo(-2.6, -0.3); x.quadraticCurveTo(-2.4, -1.2, -1.3, -1.05); x.lineTo(0.6, -0.85);
  x.quadraticCurveTo(1.9, -0.55, 2.9, 0.15); x.quadraticCurveTo(4.7, 0.5, 4.7, 1.7); x.closePath(); x.fill();
  x.fillStyle = far ? FZ.blueF : FZ.blue;
  x.beginPath(); x.moveTo(2.4, -0.1); x.quadraticCurveTo(4.6, 0.4, 4.7, 1.6); x.lineTo(3.0, 1.6); x.quadraticCurveTo(3.1, 0.6, 2.4, -0.1); x.fill();  // burun
  x.fillRect(-2.65, -0.5, 0.9, 2.0);                                                                                                      // topuk
  x.strokeStyle = far ? FZ.blueF : FZ.blue; x.lineWidth = 0.55; x.lineCap = 'round';
  x.beginPath(); x.moveTo(-1.5, 1.1); x.quadraticCurveTo(0.6, 1.0, 2.0, 0.1); x.stroke();                                               // şerit
  x.strokeStyle = far ? '#9fb3d6' : '#bcd3f5'; x.lineWidth = 0.35;
  x.beginPath(); x.moveTo(0.2, -0.75); x.lineTo(0.7, -0.25); x.moveTo(1.1, -0.55); x.lineTo(1.6, -0.05); x.stroke();                    // bağcık
  x.fillStyle = far ? FZ.soleF : FZ.sole; x.beginPath(); x.roundRect(-2.75, 1.5, 7.6, 0.95, 0.45); x.fill();                            // taban
  x.restore();
}
function fzLeg(x, j, far, R) {
  const k8 = fzKos ? fz8BacakRenk(far) : null;   // Bölüm 8 kostümü: çorap / tayt / tulum rengi
  const sk = k8 || (far ? FZ.skinF : FZ.skin), pj = far ? FZ.pjF : FZ.pj;
  const [hx, hy, kx, ky, ax, ay, sa] = j;
  const lift = clamp(-(ay + FZ_FT) / 2.5, 0, 1), swim = BOLUM_NO === 4 && (P.deniz || fzQ.a_suPoz);
  let rot = swim ? -sa + 0.2 + (far ? -0.08 : 0.06) : clamp(-sa * 0.6, -0.55, 1.0) * lerp(lift, 1, R.air);
  if (BOLUM_NO === 12 && fzQ.a_ayak12) rot = fzQ.a_ayak12[far ? 1 : 0];   // Bölüm 12: pedalda/tablada ayakkabı açısını poz verir (fezapoz12.js)
  fzTaper(x, kx, ky, ax, ay, 2.45, 1.7, sk);    // baldır
  fzTaper(x, lerp(kx, ax, 0.12), lerp(ky, ay, 0.12), lerp(kx, ax, 0.5), lerp(ky, ay, 0.5), 2.55, 2.1, sk);   // tombul baldır kası
  fzTaper(x, hx, hy, kx, ky, 2.85, 2.5, sk);    // uyluk
  if (k8) fz8BacakDesen(x, j, far);
  else if (!far) { x.fillStyle = 'rgba(255,240,228,0.55)'; x.beginPath(); x.ellipse(kx + 0.5, ky - 0.2, 0.9, 0.7, 0, 0, 6.2832); x.fill(); }
  fzShoe(x, ax, ay, rot, far);
  if (k8 && fzKos !== 'cadi') return;   // tulum / tayt: şort paçası yok
  const mx = lerp(hx, kx, 0.55), my = lerp(hy, ky, 0.55);
  fzTaper(x, hx, hy, mx, my, 3.4, 3.15, pj);    // şort paçası
  x.strokeStyle = far ? '#b9ae9a' : FZ.pjLine; x.lineWidth = 0.4;
  const a = Math.atan2(my - hy, mx - hx), c = Math.cos(a + 1.5708) * 3.0, s = Math.sin(a + 1.5708) * 3.0;
  x.beginPath(); x.moveTo(mx + c, my + s); x.lineTo(mx - c, my - s); x.stroke();
  if (!far) { x.fillStyle = FZ.sky; x.beginPath(); x.arc(lerp(hx, mx, 0.55) + 0.8, lerp(hy, my, 0.55), 0.4, 0, 6.2832); x.fill(); }
}
function fzArm(x, sx, sy, a1, a2, far, open, al) {   // al: kol boyu çarpanı (çizgi film esnemesi)
  const j = fzJ(sx, sy, FZ_UA * al, a1, FZ_FA * al, a2);
  const sk = far ? FZ.skinF : FZ.skin, pj = far ? FZ.pjF : FZ.pj, k8 = fzKos ? fz8KolRenk(far) : null;   // k8: Bölüm 8 uzun kollu kostüm
  if (!far && fzQ.a_kenar) {   // kol yüzün/tenin önünden geçerken ince koyu ten kenarı (ten üstünde ten okunsun)
    const dx0 = Math.sin(j[6]), dy0 = Math.cos(j[6]), kd = k8 ? 'rgba(30,20,60,0.55)' : FZ.skinD;
    fzTaper(x, j[2], j[3], j[4], j[5], 1.85, 1.65, kd); fzTaper(x, j[0], j[1], j[2], j[3], 2.0, 1.85, kd);
    x.fillStyle = FZ.skinD; x.beginPath(); x.ellipse(j[4] + dx0 * 1.2, j[5] + dy0 * 1.2, 2.35, 2.1, 1.5708 - j[6], 0, 6.2832); x.fill();
  }
  fzTaper(x, j[2], j[3], j[4], j[5], 1.55, 1.35, k8 || sk);   // ön kol
  fzTaper(x, j[0], j[1], j[2], j[3], 1.8, 1.55, k8 || sk);    // üst kol
  // el: avuç + başparmak
  const dx = Math.sin(j[6]), dy = Math.cos(j[6]), hx = j[4] + dx * 1.2, hy = j[5] + dy * 1.2;
  if (fzKos) { if (k8) fz8KolUst(x, j[0], j[1], j[2], j[3], j[4], j[5], far); fz8El(x, j[2], j[3], hx, hy, dx, dy, far, 0, fz8M.tm); }
  x.fillStyle = sk; x.beginPath(); x.ellipse(hx, hy, 2.05, 1.8, 1.5708 - j[6], 0, 6.2832); x.fill();
  if (open > 0.4) {   // açık el (el sallarken): yelpaze gibi dört parmak
    for (let f = 0; f < 4; f++) {
      const fa = j[6] - 0.45 + f * 0.3, fl = 1.5 + (f === 1 || f === 2 ? 0.3 : 0) * open;
      fzTaper(x, hx + dx * 0.8, hy + dy * 0.8, hx + Math.sin(fa) * (0.8 + fl), hy + Math.cos(fa) * (0.8 + fl), 0.55, 0.45, sk);
    }
  }
  x.beginPath(); x.arc(hx + dy * 1.3 + dx * 0.2, hy - dx * 1.3 + dy * 0.2, 0.75, 0, 6.2832); x.fill();
  x.strokeStyle = 'rgba(190,120,95,0.45)'; x.lineWidth = 0.3; x.beginPath(); x.moveTo(hx + dx * 0.4, hy + dy * 0.4); x.lineTo(hx + dx * 1.5, hy + dy * 1.5); x.stroke();
  if (k8) return;   // uzun kollu kostüm: pijama kol ağzı yok
  // kol ağzı
  const mx = lerp(j[0], j[2], 0.56), my = lerp(j[1], j[3], 0.56);
  fzTaper(x, j[0], j[1], mx, my, 2.75, 2.5, pj);
  x.strokeStyle = far ? '#b9ae9a' : FZ.pjLine; x.lineWidth = 0.4;
  const a = Math.atan2(my - j[1], mx - j[0]), c = Math.cos(a + 1.5708) * 2.4, s = Math.sin(a + 1.5708) * 2.4;
  x.beginPath(); x.moveTo(mx + c, my + s); x.lineTo(mx - c, my - s); x.stroke();
  if (!far) { x.fillStyle = FZ.star; fzStar(x, lerp(j[0], mx, 0.45), lerp(j[1], my, 0.45), 0.45); }
}

// tombul eldiven el: avuç (kol yönünde biraz uzun), içe bakan başparmak, uçta iki yumuşak parmak çizgisi.
// (hx,hy) avuç merkezi, (dx,dy) bilekten parmak ucuna birim yön, th: başparmağın yanı (+1/-1), r: avuç yarıçapı
function fzMitt(x, hx, hy, dx, dy, th, r, col, open) {
  const px = -dy * th, py = dx * th;   // başparmak yönü
  x.fillStyle = col; x.beginPath();
  x.ellipse(hx, hy, r * 1.1, r * 0.94, Math.atan2(dy, dx), 0, 6.2832);
  x.ellipse(hx + px * r * 0.78 - dx * r * 0.12, hy + py * r * 0.78 - dy * r * 0.12, r * 0.52, r * 0.4, Math.atan2(dy, dx) + th * 0.5, 0, 6.2832);
  x.fill();
  if (open > 0.4) {   // açık el: yelpaze gibi dört parmak
    const a0 = Math.atan2(dy, dx);
    for (let f = 0; f < 4; f++) { const fa = a0 - th * (0.5 - f * 0.3); fzTaper(x, hx, hy, hx + Math.cos(fa) * r * 1.85, hy + Math.sin(fa) * r * 1.85, r * 0.3, r * 0.25, col); }
    return;
  }
  if (col !== FZ.skin) return;
  // parmak çizgileri (uçta, kısa ve yumuşak) + başparmak kıvrımı; büyük çizimde biraz daha belirgin, ince değil
  x.strokeStyle = `rgba(190,118,92,${(0.38 + 0.12 * fzBuyuk).toFixed(3)})`; x.lineWidth = r * (0.15 + 0.03 * fzBuyuk); x.lineCap = 'round';
  x.beginPath();
  for (let f = -1; f <= 1; f += 2) {
    const o = f * 0.3 - th * 0.12, bx = hx + dx * r * 0.55 + px * r * o, by = hy + dy * r * 0.55 + py * r * o;
    x.moveTo(bx, by); x.lineTo(bx + dx * r * 0.48, by + dy * r * 0.48);
  }
  x.moveTo(hx + px * r * 0.42 - dx * r * 0.45, hy + py * r * 0.42 - dy * r * 0.45);
  x.quadraticCurveTo(hx + px * r * 0.3, hy + py * r * 0.3, hx + px * r * 0.45 + dx * r * 0.35, hy + py * r * 0.45 + dy * r * 0.35);
  x.stroke();
}
// önden kol ağzı: omzun biraz içinden başlar (gövdeye bağlı), dışa doğru gölgeli, ucunda dikiş çizgisi
function fzSleeve(x, sx, sy, ex, ey, sd) {
  const ax = sx - sd * 0.9, ay = sy - 0.15, mx = lerp(sx, ex, 0.55), my = lerp(sy, ey, 0.55);
  const a = Math.atan2(my - ay, mx - ax), r1 = 2.5, r2 = 2.25;
  x.beginPath(); x.arc(ax, ay, r1, a + 1.5708, a - 1.5708); x.arc(mx, my, r2, a - 1.5708, a + 1.5708); x.closePath();
  x.fillStyle = FZ.pj; x.fill();
  x.save(); x.clip();
  const nx = Math.cos(a + 1.5708), ny = Math.sin(a + 1.5708), s2 = nx * sd >= 0 ? 1 : -1;   // dış yan
  x.translate(mx, my); x.rotate(a + (s2 > 0 ? 1.5708 : 4.7124));   // x ekseni = dış yan normali
  x.fillStyle = fzGrad(x, 15); x.fillRect(-10, -10, 20, 20);
  x.restore();
  x.strokeStyle = FZ.pjLine; x.lineWidth = 0.4; x.lineCap = 'round';
  x.beginPath(); x.moveTo(mx + nx * r2 * 0.92, my + ny * r2 * 0.92); x.lineTo(mx - nx * r2 * 0.92, my - ny * r2 * 0.92); x.stroke();
}
// önden görünüşte hedef noktalı kol (iki kemikli ters kinematik): omuz sx,sy → el tx,ty; bend: dirseğin yanı
function fzArmIK(x, sx, sy, tx, ty, ust, open, al) {   // ust: yüzün önünde (kenar çizgisi olsun)
  let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy) || 0.01;
  const L1 = FZ_UA * al, L2 = (FZ_FA + 1.0) * al, dd = clamp(d, 1.2, L1 + L2 - 0.05);
  const a0 = Math.atan2(dy, dx), ac = Math.acos(clamp((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), -1, 1)), sd = Math.sign(sx) || 1;
  // dirsek: iki çözümden dışa ve aşağı bakanı
  const sc = a => sd * Math.cos(a) + 0.6 * Math.sin(a), a = sc(a0 + ac) >= sc(a0 - ac) ? a0 + ac : a0 - ac;
  const ex = sx + Math.cos(a) * L1, ey = sy + Math.sin(a) * L1;
  const hx = sx + dx / d * dd, hy = sy + dy / d * dd;
  const fl = Math.hypot(hx - ex, hy - ey) || 1, fdx = (hx - ex) / fl, fdy = (hy - ey) / fl;
  const th = fdy * sd >= 0 ? 1 : -1;   // başparmak gövdeye (içe) baksın
  if (ust) {   // ten üstünde ten: ince koyu kenar
    fzTaper(x, ex, ey, hx, hy, 1.9, 1.7, FZ.skinD);
    fzMitt(x, hx, hy, fdx, fdy, th, 2.2, FZ.skinD, open);
  }
  const k8 = fzKos ? fz8KolRenk(false) : null;   // Bölüm 8 uzun kollu kostüm
  fzTaper(x, ex, ey, hx, hy, 1.55, 1.35, k8 || FZ.skin);
  fzTaper(x, sx, sy, ex, ey, 1.8, 1.55, k8 || FZ.skin);
  if (fzKos) { if (k8) fz8KolUst(x, sx, sy, ex, ey, hx - fdx * 1.2, hy - fdy * 1.2, false); fz8El(x, ex, ey, hx, hy, fdx, fdy, false, sd, fz8M.tm); }
  fzMitt(x, hx, hy, fdx, fdy, th, 1.85, FZ.skin, open);
  if (!k8) fzSleeve(x, sx, sy, ex, ey, sd);
}

// ── gövde ──
function fzTorso(x, R, tm) {
  if (fzKos === 'kabak') { fz8KabakGovde(x, R, tm, false); return; }   // Bölüm 8: kabak tulum
  const k8 = fzKos ? fz8GovdeRenk() : null;   // Bölüm 8: tulum rengi (iskelet / yarasa)
  const ew = fzQ.a_esW || 0, lift = R.air * clamp(fzQ.vy / 700, -0.4, 1) * 1.4 + ew * 1.6, fl = (R.air + ew) * Math.sin(tm * 23) * 0.35;
  const rz = Math.max(0, R.shr) * 0.4, hb = 1.4 - lift + fl - rz, hf = 1.4 - lift * 0.7 - fl - rz, b = R.breath, cl = fzQ.a_cl || 0, ca = Math.abs(cl) * 0.22;   // cl: etek ucunun gecikmeli savrulması
  x.save(); x.scale((1 + 0.026 * b) * 1.06, (1 + 0.038 * b) * 0.9);
  x.beginPath();
  x.moveTo(-5.4 + cl * 0.55, hb - ca);
  x.quadraticCurveTo(-6.1 + cl * 0.22, -5, -5.7, -9.4);
  x.quadraticCurveTo(-5.6, -13.7, -2.5, -15.0);
  x.quadraticCurveTo(0.9, -16.0, 3.9, -14.6);
  x.quadraticCurveTo(6.1, -13.1, 5.9, -9.4);
  x.quadraticCurveTo(7.6 + cl * 0.22, -4.6, 6.1 + cl * 0.55, hf - ca);
  x.quadraticCurveTo(0.3 + cl * 0.8, (hb + hf) / 2 + 1.1 - ca, -5.4 + cl * 0.55, hb - ca);
  x.closePath();
  x.fillStyle = k8 || FZ.pj; x.fill();
  x.save(); x.clip();
  if (!k8) fzPrint(x);
  x.fillStyle = fzGrad(x, 0); x.fillRect(-8, -17, 17, 21);
  if (k8) fz8GovdeDesen(x, false);
  x.strokeStyle = k8 ? 'rgba(18,12,48,0.42)' : 'rgba(140,122,140,0.45)'; x.lineWidth = 0.42; x.lineCap = 'round';
  x.beginPath(); x.moveTo(2.4, -10.6); x.quadraticCurveTo(3.8, -8.7, 3.3, -6.9);      // koltuk altı kırışığı
  x.moveTo(-1.4, -1.0); x.quadraticCurveTo(1.6, -0.2, 4.0, -1.4);                      // göbek kırışığı
  x.moveTo(-4.7, -8.3); x.quadraticCurveTo(-4.1, -5.6, -4.8, -2.8); x.stroke();          // sırt
  const fo = clamp((Math.abs(R.lean) - 0.05) * 4 + R.sq * 0.4 + Math.max(0, -R.bob) * 0.03, 0, 1);   // öne eğilince / sıkılınca bel kıvrımları
  if (fo > 0.03) {
    x.strokeStyle = k8 ? `rgba(18,12,48,${(0.4 * fo).toFixed(3)})` : `rgba(140,122,140,${(0.4 * fo).toFixed(3)})`; x.lineWidth = 0.4; x.beginPath();
    x.moveTo(-3.8, -5.0 + R.lean * 4); x.quadraticCurveTo(0.2, -4.0 + R.lean * 4, 4.6, -5.4 + R.lean * 4);
    x.moveTo(-2.2, -3.0 + R.lean * 3); x.quadraticCurveTo(1.0, -2.2 + R.lean * 3, 3.8, -3.4 + R.lean * 3); x.stroke();
  }
  x.fillStyle = 'rgba(70,58,110,0.12)'; x.fillRect(-8, hb - 1.4, 17, 4);                // etek gölgesi
  x.restore();
  x.strokeStyle = k8 ? 'rgba(18,12,48,0.5)' : FZ.pjLine; x.lineWidth = 0.45;
  x.beginPath(); x.moveTo(-5.2 + cl * 0.55, hb - 0.45 - ca); x.quadraticCurveTo(0.3 + cl * 0.8, (hb + hf) / 2 + 0.6 - ca, 5.95 + cl * 0.55, hf - 0.45 - ca); x.stroke();
  x.save(); x.setLineDash([0.8, 0.6]); x.strokeStyle = k8 ? 'rgba(230,220,255,0.3)' : 'rgba(160,148,170,0.55)'; x.lineWidth = 0.22;   // etek dikişi (kesik kesik)
  x.beginPath(); x.moveTo(-5.0 + cl * 0.55, hb - 1.25 - ca); x.quadraticCurveTo(0.3 + cl * 0.8, (hb + hf) / 2 - 0.2 - ca, 5.8 + cl * 0.55, hf - 1.25 - ca); x.stroke(); x.restore();
  x.restore();
}
function fzShorts(x) {
  if (fzKos && fz8Sort(x, false)) return;   // Bölüm 8: tulum / tayt
  x.fillStyle = FZ.pj; x.beginPath(); x.ellipse(0.3, 0.6, 5.9, 3.7, 0, 0, 6.2832); x.fill();
  x.fillStyle = 'rgba(70,58,110,0.14)'; x.beginPath(); x.ellipse(-1.4, 1.6, 4.4, 2.6, 0, 0, 6.2832); x.fill();
  fzPlane(x, -2.2, 1.6, 0.7, FZ.sky, 0.2); x.fillStyle = FZ.star; fzStar(x, 2.6, 2.0, 0.45);
}

// ── kafa ──
// out: gözün dış köşesinin yönü (-1 sol, +1 sağ)
let fzEyeV = 1;   // 1: fotoğrafa daha yakın (biraz küçük iris, yumuşak kirpik; oyun boyunda da net okunuyor) · 0: eski büyük göz
function fzEye(x, cx, cy, w, h, R, far, pd, out) {
  const lid = R.lid * fzQ.a_lidM, ev = fzEyeV;
  if (ev) h *= 0.88;
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (R.sq > 0.5) {      // sıkı sıkı kapalı (itme, zorlanma): > <  (uç burna doğru)
    pd = pd || 1; x.strokeStyle = FZ.lash; x.lineWidth = far ? 0.62 : 0.78;
    x.beginPath(); x.moveTo(cx - w * 0.75 * pd, cy - h * 0.45); x.lineTo(cx + w * 0.7 * pd, cy + 0.25); x.lineTo(cx - w * 0.75 * pd, cy + h * 0.55); x.stroke(); return;
  }
  if (R.happy > 0.5) {   // mutlu kapalı göz: kalın, yumuşak hilal ^ ^
    x.fillStyle = FZ.lash; x.beginPath();
    x.moveTo(cx - w * 1.05, cy + 0.75); x.quadraticCurveTo(cx, cy - h * 1.3, cx + w * 1.05, cy + 0.75);
    x.quadraticCurveTo(cx + w * 0.9, cy + 0.85, cx + w * 0.8, cy + 0.6); x.quadraticCurveTo(cx, cy - h * 0.4, cx - w * 0.8, cy + 0.6);
    x.quadraticCurveTo(cx - w * 0.9, cy + 0.85, cx - w * 1.05, cy + 0.75); x.fill(); return;
  }
  if (lid < 0.2) {       // göz kırpma
    x.strokeStyle = FZ.lash; x.lineWidth = far ? 0.55 : 0.7;
    x.beginPath(); x.moveTo(cx - w, cy + 0.5); x.quadraticCurveTo(cx, cy + 1.3, cx + w, cy + 0.5); x.stroke(); return;
  }
  const eh = h * Math.min(lid, 1.15), ec = cy + h - eh;
  // gülümserken yanaklar alt kapağı hafifçe yukarı iter (fotoğraftaki gibi gülen gözler)
  const ch = clamp((R.mSmile - 0.7) / 0.3, 0, 1) * (1 - clamp(R.mOpen, 0, 1) * 0.4) * (1 - R.mRound) * 0.3 * h;
  x.save();
  x.beginPath(); x.ellipse(cx, ec, w, eh, 0, 0, 6.2832); x.fillStyle = '#fdf8f3'; x.fill(); x.clip();
  const ri = (far ? 1.5 : 1.78) * (ev ? 0.86 : 1), rx = far ? ri * 0.7 : ri * 0.9;
  const ix = cx + R.gx * w * 0.3 + (far ? 0.12 : 0.05), iy = cy + R.gy * h * 0.25 + 0.2;
  x.translate(ix, iy); x.fillStyle = fzGrad(x, 10 + (far ? 1 : 0) + (ev ? 2 : 0)); x.beginPath(); x.ellipse(0, 0, rx, ri, 0, 0, 6.2832); x.fill(); x.translate(-ix, -iy);
  x.fillStyle = '#160803'; x.beginPath(); x.ellipse(ix, iy - ri * 0.04, rx * 0.47, ri * 0.5, 0, 0, 6.2832); x.fill();
  if (eh > 0.01) {   // üst kapağın gölgesi (birim geçiş, kapak yüksekliğine ölçeklenir)
    x.save(); x.translate(cx - w, ec - eh); x.scale(1, eh * 0.9); x.fillStyle = fzGrad(x, 9); x.fillRect(0, 0, w * 2, 1 / 0.9); x.restore();
  }
  x.strokeStyle = 'rgba(255,205,150,0.45)'; x.lineWidth = 0.22;     // irisin altında sıcak yansıma
  x.beginPath(); x.arc(ix, iy, ri * 0.72, 0.55, 2.55); x.stroke();
  x.fillStyle = '#ffffff'; 
  const shn = fzQ.a_shine || 0, gd = fzQ.a_dim == null ? 1 : fzQ.a_dim;   // gd: uykuya dalarken ışık yansıması sönümlenir   // sabah ışığında gözbebeği parlaması (ara sahne): ana yansıma büyür, ek minik ışık belirir
  x.globalAlpha = 0.2 + 0.8 * gd; x.beginPath(); x.ellipse(ix + rx * 0.34, iy - ri * 0.38, ri * 0.32 * (1 + 0.45 * shn), ri * 0.28 * (1 + 0.45 * shn), -0.4, 0, 6.2832); x.fill();
  x.beginPath(); x.arc(ix - rx * 0.36, iy + ri * 0.42, ri * 0.13 * (1 + 0.8 * shn), 0, 6.2832); x.fill(); x.globalAlpha = 1;
  if (shn > 0.05) { x.globalAlpha = shn; x.beginPath(); x.arc(ix + rx * 0.05, iy + ri * 0.05, ri * 0.09, 0, 6.2832); x.fill(); x.globalAlpha = 1; x.fillStyle = 'rgba(255,214,150,' + (0.22 * shn).toFixed(3) + ')'; x.beginPath(); x.ellipse(ix, iy + ri * 0.3, rx * 0.8, ri * 0.5, 0, 0, 6.2832); x.fill(); x.fillStyle = '#ffffff'; }
  if (ch > 0.02) { x.fillStyle = FZ.skin; x.beginPath(); x.ellipse(cx, cy + h + h * 0.95 - ch, w * 1.5, h, 0, 0, 6.2832); x.fill(); }
  x.restore();
  // kirpik çizgisi + dış köşede küçük kıvrım
  x.strokeStyle = ev ? '#3a2416' : FZ.lash; x.lineWidth = (far ? 0.55 : 0.72) * (ev ? 0.78 : 1);
  x.beginPath(); x.ellipse(cx, ec, w * 1.02, eh * 1.02, 0, Math.PI * 1.06, Math.PI * 1.96); x.stroke();
  if (out) {
    const ox = cx + out * w * 0.93, oy = ec - eh * 0.32;
    x.lineWidth = far ? 0.36 : 0.42; x.beginPath(); x.moveTo(ox, oy); x.quadraticCurveTo(ox + out * 0.3, oy - 0.05, ox + out * 0.42, oy - 0.3); x.stroke();
  }
  if (ch > 0.02) {   // alt kapak kıvrımı
    x.strokeStyle = 'rgba(180,108,84,0.35)'; x.lineWidth = 0.22;
    x.beginPath(); x.ellipse(cx, cy + h + h * 0.95 - ch, w * 1.05, h, 0, Math.PI * 1.34, Math.PI * 1.66); x.stroke();
  }
}
// kaş: dış uç (ox,oy) → iç uç (ix,iy); içe doğru kalınlaşır. brow>0 kalkar (ağız yuvarlaksa iç uç daha çok: şaşkın/endişeli),
// brow<0 iç uç aşağı (kararlı, itme), gülerken hafif kavis.
function fzBrow(x, ox, oy, ix, iy, R, far) {
  const up = Math.max(R.brow, 0) * 0.75, fur = Math.max(-R.brow, 0), wor = up * clamp(R.mRound * 1.4, 0, 1);
  const hap = Math.max(R.happy, clamp((R.mSmile - 0.8) * 5, 0, 1)) * 0.22;
  const oy2 = oy - up * 0.85 + fur * 0.05, iy2 = iy - up - wor * 0.45 + fur * 0.75;
  const mx = (ox + ix) / 2, my = (oy2 + iy2) / 2 - 0.45 - hap - up * 0.2 + wor * 0.3 + fur * 0.15;
  const th = far ? 0.55 : 0.72, s = ix > ox ? 1 : -1;
  x.fillStyle = FZ.brow; x.beginPath();
  x.moveTo(ox, oy2);
  x.quadraticCurveTo(mx, my - th * 0.6, ix, iy2 - th * 0.5);
  x.quadraticCurveTo(ix + s * th * 0.6, iy2, ix, iy2 + th * 0.5);
  x.quadraticCurveTo(mx, my + th * 0.45, ox, oy2 + 0.08);
  x.closePath(); x.fill();
}
// yumuşak yanak pembeliği (radyal geçiş)
function fzBlush(x, cx, cy, r, a) {
  x.globalAlpha = a; x.fillStyle = fzGrad(x, 14); x.save(); x.translate(cx, cy); x.scale(r, r * 0.78);
  x.beginPath(); x.arc(0, 0, 1, 0, 6.2832); x.fill(); x.restore(); x.globalAlpha = 1;
}
// ağız. fr: önden görünüş (simetrik, yaramaz tarafı sağda)
function fzMouth(x, R, fr) {
  const cx = 4.9, cy = 5.0, sm = R.mSmile, op = R.mOpen, ro = R.mRound;
  const w = lerp(lerp(3.0, 4.3, sm) + op * 0.5, 1.7, ro), h = op * lerp(2.2, 2.3, ro), up = sm * 0.8 * (1 - ro);
  const lx = cx - w * 0.55, rx = cx + w * 0.45, ly = cy - up * (fr ? 0.85 : 1), ry = cy - up * (fr ? 1.15 : 0.55);
  x.lineCap = 'round'; x.lineJoin = 'round';
  if (h < 0.4) {   // kapalı, yaramaz sırıtış: dudaklar birleşik, köşeler yanaklara gömülü
    const dip = 0.3 + sm * 0.75, mx = fr ? cx - 0.1 : cx - 0.3;
    x.fillStyle = '#86382f'; x.beginPath(); x.moveTo(lx, ly);
    x.quadraticCurveTo(mx, cy + dip, rx, ry);
    x.quadraticCurveTo(mx, cy + dip + 0.75 + sm * 0.3, lx, ly); x.fill();
    x.strokeStyle = 'rgba(168,88,70,0.6)'; x.lineWidth = 0.28;   // köşe kıvrımları (gamze)
    x.beginPath(); x.moveTo(lx + 0.25, ly - 0.05); x.quadraticCurveTo(lx - 0.45, ly - 0.1, lx - 0.4, ly - 0.75 * sm);
    if (fr || sm > 0.85) { x.moveTo(rx - 0.25, ry - 0.05); x.quadraticCurveTo(rx + 0.4, ry - 0.15, rx + 0.3, ry - 0.8 * sm); }
    x.stroke();
    x.fillStyle = 'rgba(225,118,105,0.2)'; x.beginPath(); x.ellipse(mx + 0.05, (ly + ry) / 2 * 0.5 + (cy + dip) * 0.5 + 0.9, w * 0.24, 0.32, 0, 0, 6.2832); x.fill();   // alt dudak
    x.fillStyle = 'rgba(255,240,230,0.45)'; x.beginPath(); x.ellipse(mx + 0.2, (ly + ry) / 2 * 0.5 + (cy + dip) * 0.5 + 0.85, w * 0.08, 0.14, 0, 0, 6.2832); x.fill();
    if (fz11P() && sm > 0.6) fz11Disler(x, lx, rx, 0, false, mx, (ly + ry) * 0.25 + (cy + dip) * 0.5 + 0.12);   // Bölüm 11: iki minik dişçik
    return;
  }
  const yol = () => {
    x.beginPath(); x.moveTo(lx, ly);
    x.quadraticCurveTo(cx, (ly + ry) / 2 + 0.25 * (1 - ro) - ro * h * 0.9, rx, ry);
    x.quadraticCurveTo(cx + 0.1, cy + h * (1.7 - ro * 0.3), lx, ly); x.closePath();
  };
  yol(); x.fillStyle = FZ.mouth; x.fill();
  x.save(); x.clip();
  x.fillStyle = FZ.tongue; x.beginPath(); x.ellipse(cx + 0.3, cy + h * 1.25, w * 0.26, h * 0.4, 0, 0, 6.2832); x.fill();
  if (ro < 0.5) { x.fillStyle = '#fbf8f3'; x.fillRect(lx, Math.min(ly, ry) - 1, rx - lx, 1.15 + up * 0.35); if (fz11P() && sm > 0.6) fz11Disler(x, lx, rx, Math.min(ly, ry) + 0.15 + up * 0.35, true); }
  x.restore();
  yol(); x.strokeStyle = FZ.lip; x.lineWidth = 0.35; x.stroke();
}
// ── saç: yumuşak, dalgalı tutamlar. Her tutam kübik (S) eğri boyunca incelen, ucu yuvarlak bir şerit.
// tutam: [kökx, köky, k1x, k1y, k2x, k2y, uçx, uçy, yarı kalınlık, uç yarıçapı, ton, yay etkisi]  (kafa merkezine göre)
// Yan ve önden görünüş aynı kesim: tepede kabarık dalgalar, bir yana taranmış kakül, kulağın üstünü örten yanlar, kısa yumuşak ense.
const FZ_LN = 12, fzLS = new Float32Array((FZ_LN + 1) * 4), fzLW = new Float32Array(8);
function fzLkPath(x, w, tw, mode) {   // fzLW'deki eğri; mode 0: kapalı şerit, 1: alt kenar çizgisi, 2: parlak orta çizgi
  const p = fzLW, a = p[0], b = p[1], c = p[2], d = p[3], e = p[4], f = p[5], g2 = p[6], h = p[7], S4 = fzLS;
  for (let i = 0; i <= FZ_LN; i++) {
    const t = i / FZ_LN, u = 1 - t, A = u * u * u, B = 3 * u * u * t, Cc = 3 * u * t * t, Dd = t * t * t;
    const dx = 3 * u * u * (c - a) + 6 * u * t * (e - c) + 3 * t * t * (g2 - e), dy = 3 * u * u * (d - b) + 6 * u * t * (f - d) + 3 * t * t * (h - f);
    const L = Math.sqrt(dx * dx + dy * dy) || 1, ww = (w + (tw - w) * t * t) * (1 + 0.14 * Math.sin(t * 3.1416)), k = i * 4;
    S4[k] = A * a + B * c + Cc * e + Dd * g2; S4[k + 1] = A * b + B * d + Cc * f + Dd * h;
    S4[k + 2] = -dy / L * ww; S4[k + 3] = dx / L * ww;
  }
  if (mode === 0) {
    x.moveTo(S4[0] + S4[2], S4[1] + S4[3]);
    for (let i = 1; i <= FZ_LN; i++) { const k = i * 4; x.lineTo(S4[k] + S4[k + 2], S4[k + 1] + S4[k + 3]); }
    const k = FZ_LN * 4, an = Math.atan2(S4[k + 3], S4[k + 2]);
    x.arc(S4[k], S4[k + 1], tw, an, an - Math.PI, true);
    for (let i = FZ_LN - 1; i >= 0; i--) { const k = i * 4; x.lineTo(S4[k] - S4[k + 2], S4[k + 1] - S4[k + 3]); }
    // kök ucu da yumuşak yuvarlak (düz kesik kenar görünmesin; tepede hafif, doğal bir tümsek verir)
    x.ellipse(S4[0], S4[1], w * 0.5, w, Math.atan2(S4[3], S4[2]) - 1.5708, -1.5708, 1.5708, true);
    x.closePath();
  } else if (mode === 1) {   // tutamı komşusundan ayıran ince gölge (uç tarafta)
    x.moveTo(S4[28] - S4[30] * 0.8, S4[29] - S4[31] * 0.8);
    for (let i = 8; i <= FZ_LN; i++) { const k = i * 4, q = i === FZ_LN ? 0.6 : 0.8; x.lineTo(S4[k] - S4[k + 2] * q, S4[k + 1] - S4[k + 3] * q); }
  } else {                   // ışık alan taraf: kısa parlak çizgi
    x.moveTo(S4[4] + S4[6] * 0.35, S4[5] + S4[7] * 0.35);
    for (let i = 2; i <= 6; i++) { const k = i * 4; x.lineTo(S4[k] + S4[k + 2] * 0.35, S4[k + 1] + S4[k + 3] * 0.35); }
  }
}
// mode 0: her tutamı kendi tonuyla doldur · 1: yalnız yolu ekle (birleşik kırpma) · 2: ayırma çizgileri · 3: parlak çizgiler
const fzHC = {};
let fzSwF = 1.7, fzSwA = 1;   // tutam salınımının hızı/genliği (rüzgârda: binis/kayma pozları büyütür; çizimden sonra geri alınır)
function fzHairC(t) {   // büyük çizimde tutam tonları ortaya yaklaşır (yakın çekimde alacalı/lekeli görünmesin)
  const q = Math.round(fzBuyuk * 10), key = t * 16 + q;
  return fzHC[key] || (fzHC[key] = mixc(FZ.hair[t], '#694832', q * 0.05));
}
function fzLocks(x, D, tm, hx, hy, k, mode) {
  const H = FZ.hair, bg = fzBuyuk, tk = 1 - 0.45 * bg;   // büyükken uçlar incelir (yuvarlak damla gibi değil, sivri tutam)
  for (let i = 0; i < D.length; i++) {
    const l = D[i], sp = l[11], ph = l.length > 12 ? l[12] : i * 1.9 + k, sw = Math.sin(tm * fzSwF + ph) * 0.16 * sp * fzSwA;
    const ex = hx * sp + sw, ey = hy * sp + (fzSwA > 1 ? Math.sin(tm * fzSwF * 1.31 + ph * 1.7) * 0.07 * sp * fzSwA : 0);
    fzLW[0] = l[0]; fzLW[1] = l[1]; fzLW[2] = l[2] + ex * 0.3; fzLW[3] = l[3] + ey * 0.3;
    fzLW[4] = l[4] + ex * 0.7; fzLW[5] = l[5] + ey * 0.7; fzLW[6] = l[6] + ex; fzLW[7] = l[7] + ey;
    if (mode === 0) { x.beginPath(); fzLkPath(x, l[8], l[9] * tk, 0); x.fillStyle = bg > 0.05 ? fzHairC(l[10]) : H[l[10]]; x.fill(); }
    else if (mode === 1) fzLkPath(x, l[8], l[9] * tk, 0);
    else if (l[10] >= 2) { x.beginPath(); fzLkPath(x, l[8], l[9] * tk, mode - 1); x.stroke(); }
  }
}
// saç kütlesi (tutamların altında); yollar tutamlarla aynı yönde (birleşik kırpma delik açmasın)
function fzMass(x, front, bx, by) {
  if (front) {
    // yanlar kulağın üstünü örter (fotoğraftaki gibi), kulak memesi görünür
    x.moveTo(9.5, 0.2); x.quadraticCurveTo(10.8, -7.6, 8.4, -11.4 + by * 0.6);
    x.quadraticCurveTo(5.6 + bx, -14.5 + by * 0.5, 1.0, -14.5 + by * 0.5); x.quadraticCurveTo(-3.6 + bx, -14.5 + by * 0.5, -7.4, -11.8 + by * 0.6);
    x.quadraticCurveTo(-10.8, -7.8, -9.5, 0.2); x.quadraticCurveTo(-8.6, 0.2, -8.0, -0.6);
    x.quadraticCurveTo(-7.8, -6.2, -4.0, -8.4); x.quadraticCurveTo(0, -9.4, 4.0, -8.4); x.quadraticCurveTo(7.8, -6.2, 8.0, -0.6); x.quadraticCurveTo(8.6, 0.2, 9.5, 0.2);
  } else {
    x.moveTo(8.2, -6.4); x.quadraticCurveTo(9.4, -10.6 + by, 5.4, -12.4 + by);
    x.quadraticCurveTo(1.2 + bx, -14.0 + by, -3.4, -12.9 + by); x.quadraticCurveTo(-8.2 + bx, -12.0 + by, -9.8, -6.8);
    // ense: kulağın arkasından boyuna doğru uzun (kısa "mullet"), kulağın üstünü örter
    x.quadraticCurveTo(-11.0, -1.0, -9.3, 2.6); x.quadraticCurveTo(-8.0, 4.6, -6.2, 4.4); x.lineTo(-5.0, 3.6);
    x.quadraticCurveTo(-4.7, 1.8, -4.1, 0.8); x.quadraticCurveTo(-2.4, -0.3, -0.4, 0.4); x.quadraticCurveTo(0.2, -2.6, 0.8, -5.2);
  }
  x.closePath();
}
// yan görünüş (sağa bakar)
const FZ_HS_NAPE = [
  [-7.0, -3.0, -10.0, 0.6, -9.2, 5.4, -11.3, 5.5, 1.9, 0.7, 1, 0.9], [-5.6, -0.6, -7.6, 2.6, -7.0, 7.0, -9.1, 6.8, 1.8, 0.7, 0, 0.8],
  [-4.8, 1.0, -5.6, 3.8, -4.8, 6.6, -6.5, 6.7, 1.3, 0.6, 1, 0.7]];
const FZ_HS = [
  [-5.0, -11.2, -7.6, -12.2, -9.8, -9.8, -10.0, -6.6, 2.4, 1.15, 2, 0.6],
  [-7.0, -8.0, -10.8, -4.6, -9.8, 0.4, -10.8, 3.0, 2.3, 0.9, 1, 0.75],
  [-4.2, -9.6, -8.2, -5.6, -6.6, -0.4, -8.2, 2.6, 2.3, 0.95, 2, 0.65],
  [-4.5, -11.8, -2.0, -14.8, 2.6, -14.6, 6.0, -12.6, 2.4, 1.2, 3, 0.45],
  [-1.6, -11.0, -4.4, -7.0, -2.0, -3.8, -4.3, 0.2, 2.5, 1.05, 3, 0.5],
  [0.8, -10.4, -0.8, -7.2, 1.2, -4.2, -0.9, 0.0, 1.7, 0.9, 2, 0.4]];
const FZ_HS_FR = [
  [0.0, -12.8, 1.2, -9.6, -0.6, -7.6, 1.4, -5.4, 2.4, 1.1, 2, 0.55],
  [2.2, -13.2, 4.0, -10.2, 2.4, -8.0, 4.2, -5.0, 2.5, 1.15, 3, 0.6],
  [4.4, -12.9, 6.6, -10.4, 5.2, -8.0, 6.9, -5.2, 2.4, 1.1, 2, 0.65],
  [6.0, -12.2, 8.6, -10.6, 7.6, -8.2, 8.8, -5.8, 2.0, 1.0, 3, 0.65],
  [3.2, -12.9, 4.4, -10.2, 3.4, -8.2, 5.4, -6.4, 1.0, 0.6, 3, 0.6]];
// önden görünüş (kakül sağdan ayrılıp sola taranmış)
const FZ_HF_NAPE = [
  [-7.4, -4.0, -10.0, -1.0, -9.6, 2.4, -11.8, 2.6, 1.3, 0.6, 1, 0.75], [7.4, -4.0, 10.0, -1.0, 9.6, 2.4, 11.8, 2.6, 1.3, 0.6, 1, 0.75]];
const FZ_HF = [
  [0.6, -13.6, 2.4, -15.2, 4.8, -15.1, 6.6, -13.4, 2.1, 1.5, 3, 0.2],
  [-6.4, -11.0, -10.0, -8.4, -9.0, -3.0, -11.6, -1.4, 1.8, 0.7, 2, 0.65], [6.4, -11.0, 10.0, -8.4, 9.0, -3.0, 11.6, -1.4, 1.8, 0.7, 2, 0.65],
  [-4.4, -12.2, -8.4, -9.0, -6.8, -4.8, -8.8, -1.6, 2.2, 1.0, 3, 0.5], [5.0, -12.2, 8.6, -9.0, 7.2, -4.8, 9.0, -1.8, 2.0, 0.95, 2, 0.5],
  [2.8, -12.6, -0.6, -15.0, -4.6, -14.6, -7.6, -11.6, 2.6, 1.25, 3, 0.45], [4.2, -12.6, 6.8, -14.2, 8.6, -12.6, 9.1, -9.4, 2.5, 1.2, 3, 0.45]];
const FZ_HF_FR = [
  [1.4, -13.4, -3.0, -12.6, -6.8, -10.0, -7.0, -5.8, 2.5, 1.15, 2, 0.6],
  [2.4, -13.4, -0.8, -11.4, -5.0, -9.6, -4.5, -5.2, 2.7, 1.2, 3, 0.6],
  [3.4, -13.2, 1.6, -11.0, -2.4, -9.0, -1.7, -5.0, 2.6, 1.2, 2, 0.6],
  [4.3, -13.0, 3.4, -10.4, 0.6, -8.8, 1.3, -5.3, 2.4, 1.1, 3, 0.6],
  [5.1, -12.8, 5.4, -10.4, 3.6, -8.4, 4.4, -5.7, 2.1, 1.0, 2, 0.6],
  [5.8, -12.6, 8.2, -11.0, 7.4, -8.0, 8.4, -5.6, 1.9, 0.95, 1, 0.55],
  [2.8, -13.4, 0.8, -11.0, -2.4, -9.2, -2.2, -6.2, 0.9, 0.55, 3, 0.6]];
// ── dönüşte saç: tutamlar yandan görünüşteki yerlerinden önden görünüşteki yerlerine kayar (çizim değişmez, saç döner).
// Her yuva bir yan tutamı ile bir ön tutamı eşler (en yakın komşu; eşi kalmayan tutamlara da yuva açılır).
// Önden görünüş EKRANA göre sabittir (kakül hep aynı yana taranmış): yön değişip tuval aynalanınca (dönüşün ortası)
// önden tutamlar da aynalanmış veriden okunur, böylece kakül hiçbir karede yer değiştirmez. Yuva eşleştirmesi iki
// durum için ayrı ayrı (normal / aynalı önden düzen) yapılır.
const FZ_HSA = FZ_HS_NAPE.concat(FZ_HS, FZ_HS_FR), FZ_HFA = FZ_HF_NAPE.concat(FZ_HF, FZ_HF_FR);
const FZ_SN = FZ_HS_NAPE.length, FZ_FN = FZ_HF_NAPE.length;
const fzMirL = l => { const m = l.slice(); m[0] = -m[0]; m[2] = -m[2]; m[4] = -m[4]; m[6] = -m[6]; return m; };
const FZ_HFM = [[FZ_HF_NAPE, FZ_HF, FZ_HF_FR], [FZ_HF_NAPE.map(fzMirL), FZ_HF.map(fzMirL), FZ_HF_FR.map(fzMirL)]];
function fzSlots(HFA) {
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) + Math.hypot(a[4] - b[4], a[5] - b[5]) + Math.hypot(a[6] - b[6], a[7] - b[7]);
  const near = (l, L) => { let bi = 0, bd = 1e9; L.forEach((m, j) => { const q = d(l, m); if (q < bd) { bd = q; bi = j; } }); return bi; };
  const sl = [], usedS = new Set();
  HFA.forEach((f, j) => { const i = near(f, FZ_HSA); sl.push([i, j]); usedS.add(i); });
  FZ_HSA.forEach((sv, i) => { if (!usedS.has(i)) sl.push([i, near(sv, HFA)]); });
  const S = sl.map(([i, j], n) => ({ i, j, ph: n * 1.9 + 0.7, l: new Array(13).fill(0) }));
  // çizim sıraları: yanda (ense yuvaları kütlenin arkasında), önden (ense yuvaları başın arkasında)
  const SO = S.slice().sort((a, b) => a.i - b.i || a.j - b.j), FO = S.slice().sort((a, b) => a.j - b.j || a.i - b.i);
  return { HFA, sl: S, SB: [SO.filter(q => q.i < FZ_SN).map(q => q.l), SO.filter(q => q.i >= FZ_SN).map(q => q.l)],
    FB: [FO.filter(q => q.j < FZ_FN).map(q => q.l), FO.filter(q => q.j >= FZ_FN).map(q => q.l)] };
}
const FZ_HV = [fzSlots(FZ_HFA), fzSlots(FZ_HFA.map(fzMirL))];
const FZ_NONE = [];
let fzFS = 1;   // tuvalin yatay işareti (sola bakarken -1); önden düzen buna göre aynalanır
function fzHairMix(w, V) {   // w: 0 yan … 1 önden
  for (const q of V.sl) {
    const a = FZ_HSA[q.i], b = V.HFA[q.j], l = q.l;
    for (let k = 0; k < 12; k++) l[k] = a[k] + (b[k] - a[k]) * w;
    l[10] = Math.round(l[10]); l[12] = q.ph;
  }
}
function fzMassF(x, bx, by) { x.save(); x.scale(fzFS, 1); fzMass(x, true, bx * fzFS, by); x.restore(); }   // önden kütle (ekrana göre sabit)
// kırpılmış gölgelendirme: alt taraf koyu, tepe sıcak, kafanın eğrisini izleyen yumuşak parlak bant
function fzHairShade(x, front, tm, hx, hy, bx, by, A, B) {
  x.save(); x.beginPath(); if (front) fzMassF(x, bx, by); else fzMass(x, false, bx, by); fzLocks(x, A, tm, hx, hy, 2, 1); fzLocks(x, B, tm, hx, hy, 3, 1); x.clip();
  // parlak halka: kafanın eğrisini izleyen, kenarları yumuşak bant (tutam kenarlarında kırılır)
  const cy = -1.4 + hy * 0.15;
  x.translate(0, cy); x.fillStyle = fzGrad(x, front ? 7 : 6); x.fillRect(-14, -18 - cy, 28, 26); x.translate(0, -cy);
  x.fillStyle = fzGrad(x, 8); x.fillRect(-14, -18, 28, 26);
  x.restore();
  x.lineCap = 'round'; x.lineJoin = 'round';
  const bg = fzBuyuk;
  x.strokeStyle = bg > 0.01 ? `rgba(45,24,12,${(0.22 * (1 - 0.72 * bg)).toFixed(3)})` : 'rgba(45,24,12,0.22)'; x.lineWidth = 0.3 + 0.75 * bg;
  fzLocks(x, A, tm, hx, hy, 2, 2); fzLocks(x, B, tm, hx, hy, 3, 2);
}
function fzHair(x, tm) {
  const w = fzQ.a_hw || 0, hx = fzQ.a_hx * (1 - 0.5 * w), hy = fzQ.a_hy, bx = hx * 0.25, by = hy * 0.3;
  let A = FZ_HS, B = FZ_HS_FR, N = FZ_HS_NAPE;
  if (w > 0.001) { const V = FZ_HV[fzFS < 0 ? 1 : 0]; fzHairMix(w, V); N = V.SB[0]; A = V.SB[1]; B = FZ_NONE; }
  fzLocks(x, N, tm, hx, hy, 0, 0);
  x.fillStyle = fzGrad(x, 4); x.beginPath(); fzMass(x, false, bx, by); x.fill();
  if (w > 0.001) { x.globalAlpha = w * w; x.beginPath(); fzMassF(x, bx, by); x.fill(); }
  x.globalAlpha = 1;
  fzLocks(x, A, tm, hx, hy, 2, 0); fzLocks(x, B, tm, hx, hy, 3, 0);
  fzHairShade(x, false, tm, hx, hy, bx, by, A, B);
  // birkaç ince uçuşan tel
  if (fzBuyuk > 0.95) return;
  x.strokeStyle = fzBuyuk > 0.01 ? `rgba(135,92,58,${(0.75 * (1 - fzBuyuk)).toFixed(3)})` : 'rgba(135,92,58,0.75)'; x.lineWidth = 0.22;
  x.beginPath(); x.moveTo(-3.4, -13.8); x.quadraticCurveTo(-4.4, -16.4 + hy * 0.4, -6.8 + hx * 0.5, -16.2 + hy * 0.5);
  x.moveTo(-9.8, -7.0); x.quadraticCurveTo(-12.4, -5.4, -12.2 + hx * 0.6, -2.4 + hy * 0.5); x.stroke();
}
function fzHairFront(x, tm, back) {
  const w = fzQ.a_hw === undefined ? 1 : fzQ.a_hw, hx = fzQ.a_hx * (1 - 0.5 * w), hy = fzQ.a_hy, H = FZ.hair, bx = hx * 0.25, by = hy * 0.3;
  const HM = FZ_HFM[fzFS < 0 ? 1 : 0];
  let A = HM[1], B = HM[2], N = HM[0];
  if (w < 0.999) { const V = FZ_HV[fzFS < 0 ? 1 : 0]; fzHairMix(w, V); N = V.FB[0]; A = V.FB[1]; B = FZ_NONE; }
  if (back) {   // başın arkasında kalan saç ve kısa, yumuşak ense uçları
    x.fillStyle = H[1]; x.beginPath();
    x.moveTo(9.2, 1.4); x.quadraticCurveTo(10.9, -6.0, 7.4, -11.8); x.quadraticCurveTo(0, -16.0, -7.4, -11.8);
    x.quadraticCurveTo(-10.9, -6.0, -9.2, 1.4); x.quadraticCurveTo(0, 3.0, 9.2, 1.4); x.closePath(); x.fill();
    fzLocks(x, N, tm, hx, hy, 0, 0);
    return;
  }
  x.fillStyle = fzGrad(x, 5); x.beginPath(); fzMassF(x, bx, by); x.fill();
  fzLocks(x, A, tm, hx, hy, 2, 0); fzLocks(x, B, tm, hx, hy, 3, 0);
  fzHairShade(x, true, tm, hx, hy, bx, by, A, B);
  if (fzBuyuk > 0.95) return;
  x.strokeStyle = fzBuyuk > 0.01 ? `rgba(135,92,58,${(0.75 * (1 - fzBuyuk)).toFixed(3)})` : 'rgba(135,92,58,0.75)'; x.lineWidth = 0.22;
  const fs = fzFS; x.beginPath(); x.moveTo(1.6 * fs, -14.8); x.quadraticCurveTo(0.8 * fs, -17.2 + hy * 0.4, -1.8 * fs + hx * 0.5, -17.0 + hy * 0.5);
  x.moveTo(-9.6 * fs, -7.0); x.quadraticCurveTo(-11.8 * fs, -6.0, -11.8 * fs + hx * 0.6, -3.4 + hy * 0.5); x.stroke();
}
function fzHead(x, R, tm) {
  // kafa ve yüz şekli: kafatası + yanak + çene
  x.fillStyle = fzGrad(x, 2); x.beginPath();
  fzEl(x, -0.3, -1.6, 8.6, 8.6); fzEl(x, 3.0, 3.0, 6.0, 5.0); fzEl(x, 6.7, 2.6, 2.8, 3.3);
  fzEl(x, 4.0, 5.6, 3.0, 2.4); fzEl(x, -1.2, 2.8, 5.6, 4.6);
  x.fill();
  x.save(); x.clip();
  // çene altı gölgesi, saç çizgisi gölgesi, yanak pembeliği (yüzün içinde kalsın)
  x.fillStyle = 'rgba(190,115,90,0.22)'; x.beginPath(); x.ellipse(1.6, 7.6, 5.0, 1.3, 0.1, 0, 6.2832); x.fill();
  x.fillStyle = 'rgba(150,80,55,0.14)'; x.beginPath(); x.ellipse(4.4, -5.0, 6.0, 1.2, 0, 0, 6.2832); x.fill();
  const bl = clamp((R.mSmile - 0.5) / 0.5, 0, 1), ba = 0.8 + 0.35 * bl + 0.2 * R.happy;
  fzBlush(x, 1.5, 3.5 - 0.35 * bl, 3.3, ba); fzBlush(x, 7.9, 3.0 - 0.3 * bl, 1.9, ba * 0.85);
  x.restore();
  // kulak
  x.fillStyle = FZ.skin; x.beginPath(); x.ellipse(-2.3, 2.0, 1.9, 2.55, 0.1, 0, 6.2832); x.fill();
  x.strokeStyle = 'rgba(190,115,90,0.7)'; x.lineWidth = 0.4; x.lineCap = 'round';
  x.beginPath(); x.arc(-2.1, 2.1, 1.05, -1.4, 1.9); x.stroke();
  x.beginPath(); x.arc(-2.0, 2.3, 0.45, -0.5, 2.2); x.stroke();
  // gözler ve kaşlar
  fzEye(x, 2.0, -0.4, 1.65, 2.15, R, false, 1, -1);
  fzEye(x, 6.5, -0.6, 1.1, 2.0, R, true, 1, 1);
  // burun
  x.strokeStyle = 'rgba(200,120,95,0.55)'; x.lineWidth = 0.42;
  x.beginPath(); x.moveTo(6.5, 1.0); x.quadraticCurveTo(7.4, 2.4, 6.4, 3.0); x.stroke();
  x.fillStyle = 'rgba(200,120,95,0.5)'; x.beginPath(); x.ellipse(5.8, 3.0, 0.75, 0.35, 0, 0, 6.2832); x.fill();
  x.fillStyle = 'rgba(255,245,236,0.85)'; x.beginPath(); x.arc(6.0, 1.9, 0.38, 0, 6.2832); x.fill();
  fzMouth(x, R, false);
  fzHair(x, tm);
  // kaşlar saçın üstünde (duygu her zaman okunsun)
  fzBrow(x, 0.3, -3.5, 3.5, -3.9, R, false); fzBrow(x, 8.0, -3.8, 5.9, -4.0, R, true);
  if (fzKos) fz8Bas(x, R, tm, false);   // Bölüm 8: şapka / sap başlık / taç
}

// ── tüm vücut (yerel koordinat) ──
function fzDraw(x, tm) {
  const R = fzQ.a_R, hip = fzQ.a_hipY, hx = R.hx;
  const legF = fzJ(hx + 0.8, hip, FZ_TH, R.lt1, FZ_SH, R.lt2), legB = fzJ(hx - 1.2, hip, FZ_TH, R.bt1, FZ_SH, R.bt2);
  const by = -0.28 * R.breath - R.shr;
  if (fzKos === 'cadi' || fzKos === 'yarasa') fz8PelerinYan(x, R, hip, by);   // Bölüm 8: pelerin her şeyin arkasında (yarasada taraklı)
  if (fzKos === 'yarasa') fz8KanatYan(x, R, hip, by, false);                   // arka kanat (arka kola bağlı)
  const p11 = fz11P(); if (p11) { fz11PelerinYan(x, R, hip, by); fz11KanatYan(x, R, hip, by, false); }   // Bölüm 11: pelerin + uzak kanat (astar)
  x.save(); x.translate(hx, hip); x.rotate(R.lean);
  fzArm(x, -0.8, -11.8 + by * 0.6, R.ba1, R.ba2, true, 0, R.arm);
  x.restore();
  if (!fzQ.a_noFar) fzLeg(x, legB, true, R);   // binis: uzak bacak Pırıl'ın gövdesinin öbür yanında (görünmez)
  x.save(); x.translate(hx, hip); x.rotate(R.lean * 0.4); fzShorts(x); x.restore();
  const tuck = R.lt1 > 0.9;   // diz göğse çekilince ön bacak gövdenin önünde
  if (!tuck) fzLeg(x, legF, false, R);
  if (fzKos === 'yarasa') fz8KanatYan(x, R, hip, by, true);   // ön kanat: gövdenin arkasında, kol kalkınca açılır
  if (p11) fz11KanatYan(x, R, hip, by, true);                 // Bölüm 11: yakın kanat (dış yüz), kol açılınca
  x.save(); x.translate(hx, hip); x.rotate(R.lean);
  fzTorso(x, R, tm);
  x.restore();
  if (tuck) fzLeg(x, legF, false, R);
  x.save(); x.translate(hx, hip); x.rotate(R.lean);
  // boyun ve yaka
  fzTaper(x, 1.6, -11.6 + by, 2.0, -14.6 + by, 2.3, 2.2, FZ.skinS);
  if (!fzKos || fzKos === 'cadi' || p11) { x.strokeStyle = FZ.pjS; x.lineWidth = 0.8; x.beginPath(); x.ellipse(1.7, -13.2 + by, 2.5, 0.9, -0.12, 0.25, 2.9); x.stroke(); }
  if (fzKos) fz8Yaka(x, by, false);
  x.save(); x.translate(1.9, -14.4 + by); x.rotate(R.head); x.scale(1.03, 1.03); x.translate(1.3, -7.7);
  fzHead(x, R, tm);
  if (BOLUM_NO === 12 && fzQ.a_kask12 > 0.01) fz12Kask(x, R, tm);   // Bölüm 12: bisiklet/scooter kaskı (fezapoz12.js)
  fzNefesBalonu(x, tm, false);
  x.restore();
  fzArm(x, 1.2, -11.4 + by, R.la1, R.la2, false, R.hOpen, R.arm);
  x.restore();
  if (fzKos && fz8M.sapX === fz8M.sapX) fz8SepetAs(x, fz8M.sapX, fz8M.sapY, tm);   // süpürgede: sepet sapta asılı
}

// ── önden görünüş: dönüşlerde ve ara sıra kameraya bakarken ──
// yw (0..1): dönüşün başında/sonunda yüz yerel +x'e (bakılan yana) dönük 3/4 görünüş: yüz çizgileri o yana kayar, uzak göz daralır,
// arka kulak öne gelir, yakın kulak yüzün arkasında kaybolur, çene hafifçe o yana. (0: tam önden)
function fzHeadFront(x, R, tm) {
  const yw = fzQ.a_yaw || 0, fx = 2.7 * yw;
  fzHairFront(x, tm, true);
  x.fillStyle = FZ.skinS;   // kulaklar
  x.beginPath(); x.ellipse(-8.5 + 1.6 * yw, 1.8, 1.6, 2.3, 0.15, 0, 6.2832); if (yw < 0.45) x.ellipse(8.5 + yw * 1.4, 1.8, 1.6 * (1 - yw * 1.6), 2.3, -0.15, 0, 6.2832); x.fill();
  x.fillStyle = fzGrad(x, 3); x.beginPath();
  fzEl(x, 0.35 * yw, -1.6, 8.5, 8.5); fzEl(x, -4.0 + 1.1 * yw, 3.2, 4.7, 4.5); fzEl(x, 4.0 + 1.5 * yw, 3.2, 4.7 - 0.5 * yw, 4.5); fzEl(x, 1.4 * yw, 5.4, 4.2, 2.8);
  x.fill();
  x.save(); x.clip();
  x.fillStyle = 'rgba(150,80,55,0.14)'; x.beginPath(); x.ellipse(0.6 * yw, -5.1, 7.4, 1.2, 0, 0, 6.2832); x.fill();
  const bl = clamp((R.mSmile - 0.5) / 0.5, 0, 1), ba = 0.8 + 0.35 * bl + 0.2 * R.happy;
  fzBlush(x, -4.8 + 2.2 * yw, 3.3 - 0.35 * bl, 3.1, ba); fzBlush(x, 4.8 + 2.4 * yw, 3.3 - 0.35 * bl, 3.1 * (1 - 0.3 * yw), ba);
  if (yw > 0.02) {   // 3/4: yüzün öbür yanında hafif gölge (yuvarlak hacim)
    x.fillStyle = `rgba(170,100,80,${(0.16 * yw).toFixed(3)})`; x.beginPath(); x.ellipse(-8.6 + 1.2 * yw, 1.0, 2.6, 8.5, 0, 0, 6.2832); x.fill();
  }
  x.restore();
  fzEye(x, -3.2 + 2.9 * yw, -0.4, 1.6 * (1 - 0.06 * yw), 2.15, R, false, 1, -1);
  fzEye(x, 3.2 + 2.3 * yw, -0.4, 1.6 * (1 - 0.32 * yw), 2.15, R, false, -1, 1);
  x.fillStyle = 'rgba(200,120,95,0.5)'; x.beginPath(); x.ellipse(fx * 1.25, 2.9, 0.85, 0.38, 0, 0, 6.2832); x.fill();
  x.fillStyle = fzBuyuk > 0.01 ? `rgba(255,245,236,${(0.85 - 0.4 * fzBuyuk).toFixed(3)})` : 'rgba(255,245,236,0.85)'; x.beginPath(); x.arc(0.1 + fx * 1.3, 1.9, 0.4, 0, 6.2832); x.fill();
  x.save(); x.translate(fx * 1.1, 0); x.scale(fzFS, 1); x.translate(-4.6, 0.3); fzMouth(x, R, true); x.restore();
  fzHairFront(x, tm, false);
  fzBrow(x, -4.8 + 2.8 * yw, -3.5, -1.8 + 2.9 * yw, -3.8, R, false); fzBrow(x, 4.8 + 1.8 * yw, -3.5, 1.8 + 2.4 * yw, -3.8, R, false);
  if (fzKos) fz8Bas(x, R, tm, true);   // Bölüm 8: şapka / sap başlık / taç
}
// ── yastıktaki baş (yalnız yatış pozları; Q.a_pil = yatış 0..1). Baş yerel çerçevesinde: yerel -y = yastığa doğru, yerel -x = basan yanak ──
const FZ_PS = []; (function () {   // yastığa yayılan tutamlar: açı, uzunluk, dalga, eğilim, ton, kalınlık, parlak mı
  for (let i = 0; i < 17; i++) { const a = -1.3 + i * 0.16 + ((i * 7) % 5 - 2) * 0.03; FZ_PS.push([a, 4.5 + ((i * 5) % 7) * 1.05, i * 1.7, ((i * 3) % 5 - 2) * 0.55, i % 4, 0.55 + ((i * 3) % 4) * 0.13, i % 3 === 0]); }
})();
function fzYastikArka(x, tm, R) {
  const k = fzQ.a_pil, H = FZ.hair, sw = Math.sin(tm * 1.5) * 0.12, lt = fzQ.a_isik || 0;   // lt: -1 gece (mavi) … +1 sabah (altın)
  x.save(); x.lineCap = 'round';
  // yanak yastığa hafif basık: alt yanak yana doğru yayılır, kenarı koyulaşır
  x.fillStyle = FZ.skin; x.beginPath(); x.ellipse(-7.6, 3.4, 2.2 + 0.6 * k, 4.6, 0.12, 0, 6.2832); x.fill();
  x.strokeStyle = 'rgba(165,92,72,' + (0.28 * k).toFixed(3) + ')'; x.lineWidth = 0.45; x.beginPath(); x.ellipse(-7.6, 3.6, 2.2 + 0.6 * k, 4.4, 0.12, Math.PI * 0.62, Math.PI * 1.38); x.stroke();
  x.fillStyle = 'rgba(255,170,150,' + (0.3 * k).toFixed(3) + ')'; x.beginPath(); x.ellipse(-7.0, 3.6, 1.2, 2.3, 0.1, 0, 6.2832); x.fill();
  // saç tutamları: yastığa yayılan yumuşak, uca doğru incelen, hafif dalgalı kurdeleler
  for (let i = 0; i < FZ_PS.length; i++) {
    const q = FZ_PS[i], a = q[0], dx = Math.sin(a), dy = -Math.cos(a), sx = 8.3 * dx, sy = -1.6 + 8.3 * dy;
    const L = (1.6 + q[1] * 0.3) * k * (Math.abs(a) > 0.95 ? 0.6 : 1), wv = Math.sin(tm * 1.5 + q[2]) * 0.18 + sw, tx = -dy * Math.sign(a || 1), ty = dx * Math.sign(a || 1);
    const bend = (0.35 + 0.12 * q[3]) * L, cx = sx + dx * L * 0.55 + tx * bend * 0.4 + wv, cy = sy + dy * L * 0.55 + ty * bend * 0.4;
    const ex = sx + dx * L * 0.95 + tx * bend + wv * 1.8, ey = sy + dy * L * 0.95 + ty * bend, w = q[5] * 1.3 + 0.6, nx = -(ey - sy), ny = ex - sx, nl = Math.hypot(nx, ny) || 1;
    x.fillStyle = H[q[4]]; x.beginPath();
    x.moveTo(sx - nx / nl * w, sy - ny / nl * w); x.quadraticCurveTo(cx - nx / nl * w * 0.7, cy - ny / nl * w * 0.7, ex, ey);
    x.quadraticCurveTo(cx + nx / nl * w * 0.7, cy + ny / nl * w * 0.7, sx + nx / nl * w, sy + ny / nl * w); x.closePath(); x.fill();
    x.beginPath(); x.arc(ex, ey, w * 0.42, 0, 6.2832); x.fill();   // yuvarlak uç
    if (q[6]) {   // ışıkta parlak kenar
      x.strokeStyle = lt > 0.2 ? 'rgba(255,226,165,0.6)' : 'rgba(210,226,255,0.42)'; x.lineWidth = 0.2;
      x.beginPath(); x.moveTo(sx - nx / nl * w * 0.4, sy - ny / nl * w * 0.4); x.quadraticCurveTo(cx - nx / nl * w * 0.3, cy - ny / nl * w * 0.3, ex, ey); x.stroke();
    }
  }
  x.restore();
}
function fzIkArms(x, by, R) { for (let i = 0; i < 2; i++) { const k = fzQ.ik[i]; fzArmIK(x, (i ? 5.5 : -5.5), -11.0 + by, k[0], k[1], !!fzQ.ikUst, k[2] || 0, R.arm); } }
function fzDrawFront(x, tm) {
  const R = fzQ.a_R, hip = fzQ.a_hipY, by = -0.28 * R.breath - R.shr;
  if (fzKos) fz8OnArka(x, R, hip, by);   // Bölüm 8: pelerin / kanatlar her şeyin arkasında
  const k8 = fzKos ? fz8BacakRenk(false) : null;
  // bacaklar (önden: uzunluk dikey izdüşüm)
  for (let i = 0; i < 2; i++) {
    const sd = i ? 1 : -1, a1 = i ? R.lt1 : R.bt1, a2 = i ? R.lt2 : R.bt2;
    const sa = Math.sin(R.spr * 0.6), ca = Math.cos(R.spr * 0.6);   // spr: bacaklar iki yana açılır (yıldız pozu)
    const hx0 = sd * 2.5, ky = hip + ca * FZ_TH * Math.cos(a1), fy = ky + ca * FZ_SH * Math.cos(a1 + a2), kx = sd * (2.8 + sa * FZ_TH), fx = kx + sd * (sa * FZ_SH - 0.1);
    fzTaper(x, kx, ky, fx, fy, 2.45, 1.7, k8 || FZ.skin);
    fzTaper(x, hx0, hip, kx, ky, 2.85, 2.5, k8 || FZ.skin);
    if (k8) { const J = FZ8_J; J[0] = hx0; J[1] = hip; J[2] = kx; J[3] = ky; J[4] = fx; J[5] = fy; fz8BacakDesen(x, J, false); }
    else { x.fillStyle = 'rgba(255,240,228,0.5)'; x.beginPath(); x.ellipse(kx, ky, 1.0, 0.8, 0, 0, 6.2832); x.fill(); }
    x.fillStyle = '#f3efe7'; x.beginPath(); x.ellipse(fx, fy - 0.2, 1.6, 1.0, 0, 0, 6.2832); x.fill();   // çorap
    x.fillStyle = FZ.shoe; x.beginPath(); x.ellipse(fx, fy + 0.9, 2.1, 1.35, 0, 0, 6.2832); x.fill();   // ayakkabı önden
    x.fillStyle = FZ.blue; x.beginPath(); x.ellipse(fx, fy + 1.35, 1.7, 0.8, 0, 0, 3.1416); x.fill();
    x.fillStyle = FZ.sole; x.fillRect(fx - 2.1, fy + 1.7, 4.2, 0.55);
    if (!k8 || fzKos === 'cadi') fzTaper(x, hx0, hip, lerp(hx0, kx, 0.5), lerp(hip, ky, 0.5), 3.3, 3.1, FZ.pj);   // şort paçası
  }
  x.save(); x.translate(0, hip);
  if (fzQ.a_tilt) x.rotate(fzQ.a_tilt);   // ara sahne: gövde hafifçe yana eğilir (sarılma)
  if (!(fzKos && fz8Sort(x, true))) {
    x.fillStyle = FZ.pj; x.beginPath(); x.roundRect(-6.0, -1.0, 12.0, 4.6, 2.0); x.fill();
    x.strokeStyle = FZ.pjLine; x.lineWidth = 0.4; x.beginPath(); x.moveTo(0, 1.0); x.lineTo(0, 3.6); x.stroke();
    x.save(); x.scale(fzFS, 1); fzPlane(x, -3.2, 2.0, 0.65, FZ.sky, 0.2); x.fillStyle = FZ.star; fzStar(x, 3.2, 2.2, 0.45); x.restore();
  }
  // boyun gövdenin arkasında (yakanın altında ten görünmesin)
  fzTaper(x, 0, -11.4 + by, 0, -14.6 + by, 2.4, 2.3, FZ.skinS);
  // gövde
  const lift = R.air * clamp(fzQ.vy / 700, -0.4, 1) * 1.4, fl = R.air * Math.sin(tm * 23) * 0.35, hb = 1.4 - lift + fl, b = R.breath;
  if (fzKos === 'kabak') fz8KabakGovde(x, R, tm, true);   // Bölüm 8: kabak tulum
  else {
  const g8 = fzKos ? fz8GovdeRenk() : null;
  x.save(); x.scale(1 + 0.024 * b, 1 + 0.035 * b);
  x.beginPath(); x.moveTo(-6.1, hb);
  x.quadraticCurveTo(-7.0, -5, -6.3, -9.4); x.quadraticCurveTo(-6.5, -12.9, -3.2, -13.6);
  x.quadraticCurveTo(0, -14.3, 3.2, -13.6); x.quadraticCurveTo(6.5, -12.9, 6.3, -9.4);
  x.quadraticCurveTo(7.0, -5, 6.1, hb - fl * 2); x.quadraticCurveTo(0, hb + 1.1, -6.1, hb); x.closePath();
  x.fillStyle = g8 || FZ.pj; x.fill();
  x.save(); x.clip();
  if (!g8) { x.save(); x.scale(fzFS, 1); x.translate(0.4, 1.8); x.scale(1.1, 0.92); fzPrint(x); x.restore(); }
  x.fillStyle = fzGrad(x, 1); x.fillRect(-8, -15, 16, 19);
  if (g8) fz8GovdeDesen(x, true);
  x.fillStyle = 'rgba(70,58,110,0.12)'; x.fillRect(-8, hb - 1.4, 16, 4);
  x.restore();
  x.restore();
  }
  // ara sahne: kucaktaki oyuncak gövdenin önüne, kolların arkasına çizilir
  if (fzQ.ara) fzQ.ara();
  // kollar iki yanda (ara sahnede hedef noktalı kollar: ovuşturma, sarılma, kollar havada)
  if (fzQ.ik) { if (!fzQ.ikUst) fzIkArms(x, by, R); }
  else for (let i = 0; i < 2; i++) {
    const sd = i ? 1 : -1, a1 = i ? R.la1 : R.ba1, a2 = i ? R.la2 : R.ba2, op = i ? R.hOpen : 0;
    const sx = sd * 5.5, sy = -11.0 + by;
    const ex = sx + sd * (0.5 + 0.3 * FZ_UA * Math.abs(Math.sin(a1))), ey = sy + FZ_UA * Math.cos(a1);
    const b2 = a1 + a2, wx = ex + sd * (0.2 + 0.25 * FZ_FA * Math.abs(Math.sin(b2))), wy = ey + FZ_FA * Math.cos(b2);
    const c8 = fzKos ? fz8KolRenk(false) : null;   // Bölüm 8 uzun kollu kostüm
    fzTaper(x, ex, ey, wx, wy, 1.55, 1.35, c8 || FZ.skin);
    fzTaper(x, sx, sy, ex, ey, 1.8, 1.55, c8 || FZ.skin);
    const dl = Math.hypot(wx - ex, wy - ey) || 1, fdx = (wx - ex) / dl, fdy = (wy - ey) / dl, hx2 = wx + fdx * 1.0, hy2 = wy + fdy * 1.0;
    if (fzKos) { if (c8) fz8KolUst(x, sx, sy, ex, ey, wx, wy, false); fz8El(x, ex, ey, hx2, hy2, fdx, fdy, false, sd, fz8M.tm); }
    fzMitt(x, hx2, hy2, fdx, fdy, fdy * sd >= 0 ? 1 : -1, 1.85, FZ.skin, op);
    if (!c8) fzSleeve(x, sx, sy, ex, ey, sd);
  }
  // boyun, yaka, kafa
  if (!fzKos || fzKos === 'cadi' || fz11P()) { x.strokeStyle = FZ.pjS; x.lineWidth = 0.8; x.beginPath(); x.ellipse(0, -13.0 + by, 2.7, 1.0, 0, 0.15, 2.99); x.stroke(); }
  if (fzKos) fz8Yaka(x, by, true);
  x.save(); x.translate(0, -14.4 + by); x.rotate(R.head * 0.3); x.scale(1.03, 1.03); x.translate(0, -7.7);
  if (fzQ.a_pil > 0.01) fzYastikArka(x, tm, R);   // yastıkta: saç tutamları yayılır, yanak basık
  fzHeadFront(x, R, tm);
  fzNefesBalonu(x, tm, true);
  x.restore();
  if (fzQ.ik && fzQ.ikUst) fzIkArms(x, by, R);   // eller yüzün önünde (göz ovuşturma)
  x.restore();
}

// ── kenar ışığı (Ori tarzı): silueti ışığa doğru kaydırıp çıkarınca ince parlak kenar kalır ──
// Tek bant tuvali: fzR = renk (iki bandın birleşik saydamlığıyla); silueti yarım kaydırarak kısmen, tam kaydırarak tamamen sil;
// sonra Feza'nın üstüne bir kez 'source-atop'. (Eski hali: bant + yarım kaymış bant, iki ayrı çizim; sonuç aynı, 6 yerine 4 geçiş.)
function fzRim(lx, ly, d, col, al) {
  if (al < 0.02) return;
  const px = fzC.width, r = fzRX, a1 = al * 0.5, a2 = al * 0.6, au = 1 - (1 - a1) * (1 - a2);
  r.globalCompositeOperation = 'copy'; r.globalAlpha = au; r.fillStyle = col; r.fillRect(0, 0, px, px);
  r.globalCompositeOperation = 'destination-out';
  r.globalAlpha = 1 - a1 / au; r.drawImage(fzC, -lx * d * 0.5, -ly * d * 0.5);   // dış yarım bant: iki çizim, iç yarım: yalnız ilki
  r.globalAlpha = 1; r.drawImage(fzC, -lx * d, -ly * d);
  r.globalCompositeOperation = 'source-over';
  fzX.globalCompositeOperation = 'source-atop'; fzX.drawImage(fzR, 0, 0); fzX.globalCompositeOperation = 'source-over';
}

// bölgenin ışık rengi (dunya.js'in bölge ağırlıklarından): [ay kenarı, zemin yansıması]
const FZ_AMB = { patika: [[150, 225, 255], [90, 150, 220]], pofuduk: [[255, 190, 235], [210, 120, 190]], gol: [[130, 190, 255], [70, 120, 240]],
  dallar: [[140, 255, 225], [60, 190, 170]], sakli: [[205, 170, 255], [150, 100, 235]], aciklik: [[255, 225, 160], [235, 170, 90]] };
const FZ_AMB2 = [[175, 190, 255], [120, 96, 220]];   // Bölüm 2: ay/yıldız kenarı soluk mavi, gölün yansıması mor
const FZ_AMB4 = [[189, 236, 217], [96, 150, 178]];
const FZ_AMB3 = [[255, 216, 166], [217, 166, 236]];   // Bölüm 3: gün doğumu – güneşin pembe-altın kenarı, alttan bulutların lila yansıması
const FZ_AMB9 = [[255, 214, 158], [126, 206, 160]];
const FZ_AMB11 = [[214, 232, 255], [170, 128, 236]];   // Bölüm 11: ay ışığının gümüş-mavi kenarı, alttan lila yer sisinin yansıması   // Bölüm 9: altın saat – güneşin şeftali-altın kenarı, alttan çayırın zümrüt yansıması
const fzAmbS = ['', ''], fzAmbK = [-1, -1], FZ_AMB_N = Object.keys(FZ_AMB);
const FZ_HALE = [[0, 1], [0.22, 0.55], [0.5, 0.16], [1, 0]], FZ_HALE_K = 0.24 * 0.85;   // ortak.js glow() profili × hale gücü
function fzAmb() {
  const w = typeof DNR !== 'undefined' && DNR ? DNR : null;
  for (let j = 0; j < 2; j++) {
    let r = 0, gg = 0, b = 0, t = 0;
    if (w && !(typeof BOLUM_NO !== 'undefined' && BOLUM_NO >= 2)) for (let i = 0; i < FZ_AMB_N.length; i++) { const k = FZ_AMB_N[i], q = w[k] || 0; if (q > 0) { const c = FZ_AMB[k][j]; r += c[0] * q; gg += c[1] * q; b += c[2] * q; t += q; } }
    if (t < 0.01) {   // bölge ağırlığı yoksa: Bölüm 2'de yıldızlı göl gecesi (mavi-mor), değilse patika
      const bn = typeof BOLUM_NO !== 'undefined' ? BOLUM_NO : 1, c = (bn === 11 ? FZ_AMB11 : bn === 9 ? FZ_AMB9 : bn === 8 ? FZ_AMB8 : bn === 4 ? FZ_AMB4 : bn === 3 ? FZ_AMB3 : bn === 2 ? FZ_AMB2 : FZ_AMB.patika)[j]; r = c[0]; gg = c[1]; b = c[2]; t = 1;
    }
    const L = j || (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 3) ? 0 : light * 0.35;   // gün ağarınca ay kenarı beyazlaşır
    const R = Math.round(lerp(r / t, 255, L)), G = Math.round(lerp(gg / t, 250, L)), B = Math.round(lerp(b / t, 235, L)), key = R * 65536 + G * 256 + B;
    if (key !== fzAmbK[j]) { fzAmbK[j] = key; fzAmbS[j] = `rgb(${R},${G},${B})`; }   // dize yalnız renk değişince
  }
  return fzAmbS;
}

let fzLgK = -1, fzLg = null;
const fzHaloS = [null, null];
function fzHaloSpr(i) {   // Pırıl halesinin çıkarılacak görüntüsü (bir kez çizilir; 0: büyük mor, 1: küçük pembe-beyaz)
  let c = fzHaloS[i]; if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 256; const h = c.getContext('2d');
  const k = FZ_HALE_K * (i ? 0.46 : 1), cr = i ? 255 : 184, cg = i ? 224 : 138, cb = 255;
  const rg = h.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (let j = 0; j < FZ_HALE.length; j++) { const f = FZ_HALE[j][1]; rg.addColorStop(FZ_HALE[j][0], `rgb(${Math.round(cr * f * k)},${Math.round(cg * f * k)},${Math.round(cb * f * k)})`); }
  h.fillStyle = rg; h.fillRect(0, 0, 256, 256);
  return (fzHaloS[i] = c);
}
// ── yer gölgesi: ayağın altında yumuşak, koyu elips; havada zemine uzaklaştıkça küçülüp silinir (yere "basıyor" hissi) ──
let fzShSpr = null;
function fzShadowSpr() {
  if (fzShSpr) return fzShSpr;
  const c = document.createElement('canvas'); c.width = 96; c.height = 32; const h = c.getContext('2d');
  h.translate(48, 16); h.scale(1, 1 / 3);
  const rg = h.createRadialGradient(0, 0, 0, 0, 0, 48);
  rg.addColorStop(0, 'rgba(6,10,26,0.55)'); rg.addColorStop(0.55, 'rgba(6,10,26,0.3)'); rg.addColorStop(1, 'rgba(6,10,26,0)');
  h.fillStyle = rg; h.fillRect(-48, -48, 96, 96);
  return (fzShSpr = c);
}
function fzShadow(bx, by, al) {
  if (P.a_tasW > 0.4 || al < 0.05 || P.a_carryT < FZ_CARRY) return;
  const gd = P.ground ? 0 : fzGDist();
  if (gd > 170) return;
  const k = 1 - gd / 170, w = (26 + 8 * k) * (1 - 0.0 * k), sp = fzShadowSpr();
  g.globalAlpha = al * 0.9 * k * k * (P.ground ? 1 : 0.8);
  g.drawImage(sp, (bx - cam.x - w / 2) * S, (by + gd - cam.y - w / 6 + 1) * S, w * S, w / 3 * S);
  g.globalAlpha = 1;
}
const FZ_KAY_OPT = { aci: 0, isik: 0, hiz: 1 };   // oyun içi kayma pozu seçenekleri (tek nesne)
function drawFeza(tm) {
  if (BOLUM_NO === 14 && window.AILE14) { g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S); if (AILE14.cizFeza(tm)) return; }
  const p12 = BOLUM_NO === 12 && typeof fz12Tam === 'function' ? fz12Tam() : null;   // Bölüm 12: scooter/bisiklet/kayık/bağdaş/sarılma (fezapoz12.js; binişte P.ucus doluyken de)
  if (P.ucus && !p12 && !(BOLUM_NO === 12 && P.ucus.fezaCiz)) { fzKa = 0; return; }   // (Bölüm 12: P.ucus.fezaCiz iken normal yürüyüşle çizilir: finalde örtüye yürür)   // Bölüm 3 uçuş: Feza'yı ucus.js çizer (fezaCizPoz 'binis')
  if (P.isilDe) return;   // Bölüm 3 finali: Feza Işıl'ın sırtındayken bulut.js/isil.js çizer
  if (P.fade > 0 && !P.respawned) return;
  if (!P.a_R) fezaInit();
  fzQ = P; FZ_SU_BAL_M.valid = false;
  fzKos = fz8V8Kos(); fz8M = FZ8_P; if (fzKos) { fz8IsikN = 0; fz8NkS = fz8NkA = false; }   // Bölüm 8 kostümü (yoksa null)
  const kay = P.poz === 'kayma', deniz = BOLUM_NO === 4 && P.deniz, p9 = BOLUM_NO === 9 && FZ9.poz ? FZ9.poz : null;   // p9: Bölüm 9 oyun içi poz (fezaPoz9)
  const an11 = BOLUM_NO === 11 ? fz11BaloAn() : -1, p11 = an11 >= 0 ? 'dans11' : null;   // Bölüm 11: Ay Balosu valsi
  if (BOLUM_NO === 9 || BOLUM_NO === 11) fz9Gecis(p9 || p11, tm);
  else if (BOLUM_NO === 12) fz9Gecis(fz12GecisAnahtar(p12), tm);   // Bölüm 12: yalnız poz içinde yön değişince (otururken anneye dönüş) kısa çapraz geçiş   // Bölüm 9: poz değişirken son kareyi sakla (kısa çapraz geçiş; yandan koşudan önden kucağa sıçramasın)
  const SZ = fzKos ? 140 : 124, OY = fzKos ? SZ - 12 : SZ - 26, need = Math.ceil(SZ * S), x = fzX, R = P.a_R;   // kostümde şapka ucu için üstte daha çok yer
  // kamera yakınlaşırken S her karede biraz değişir: tuvali yalnızca yetmezse ya da çok büyük kalırsa yeniden ayır (32 px adımlarla, %15 pay)
  if (fzC.width < need || fzC.width > need * 1.3 || fzC.height !== fzC.width || fzR.width !== fzC.width || fzR.height !== fzC.width) { /* tuval varsayılanı 300x150: yükseklik de denetlenir, yoksa Feza belden kesilir */ const n = Math.ceil(need * 1.15 / 32) * 32; fzC.width = fzC.height = n; fzR.width = fzR.height = n; }
  const px = fzC.width;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, px, px);
  // dönüş: yan -> önden -> yeni yan. Genişlik hiç 0.92'nin altına inmez; ayna çevirme önden görünüşteyken olur.
  const u = P.a_turnU < 1 ? P.a_turnU : P.a_fu > 0 ? P.a_fu : 1, front = u > 0.3 && u < 0.72;
  P.a_hw = smooth(clamp((0.45 - Math.abs(u - 0.5)) / 0.3, 0, 1));   // saç dönüşü: yan → önden → yan
  P.a_yaw = u < 1 ? 0.75 * smooth(clamp((Math.abs(u - 0.51) - 0.02) / 0.19, 0, 1)) : 0;   // önden görünüşün başı/sonu 3/4 (yüz bakılan yana dönük)
  const fsc = P.a_side * (u < 0.3 ? lerp(1, 0.92, u / 0.3) : u >= 0.72 && u < 1 ? lerp(0.92, 1, (u - 0.72) / 0.28) : 1);
  x.setTransform(S, 0, 0, S, SZ / 2 * S, OY * S);
  const hb2 = typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 2;
  if (kay) {   // gökkuşağından kayma (Bölüm 3): oturma noktası = P.x,P.y; eğim kendiliğinden (fezaUpdate) ya da P.kaymaAci
    FZ_KAY_OPT.aci = P.a_kAci; fezaCizPoz(x, 0, 0, P.a_kSide, 'kayma', P.a_t, null, FZ_KAY_OPT);
  } else if (p12) {   // Bölüm 12: fezaPoz12 tüm beden pozu (oyundaki ışık ve konturla; eklemler pozlar arasında karışır)
    fz12Ciz(x, tm);
  } else if (p9) {   // Bölüm 9: yumurtaya sarılma / meyve uzatma / kucak / dans (oyundaki ışık ve konturla, fizik yerinde)
    fz9OptDoldur(); fezaCizPoz(x, 0, 0, FZ9.yon, p9, FZ9.ilerle ? FZ9.t : P.a_t, null, FZ9.o);
  } else if (p11) {   // Bölüm 11: baloda vals (final saatiyle; oyundaki ışık ve konturla)
    FZ11_DO.nabiz = typeof baloFinalNabiz === 'function' ? clamp(+baloFinalNabiz() || 0, 0, 1) : 0;
    fezaCizPoz(x, 0, 0, P.a_side || 1, 'dans11', an11 - FZ11_VALS0, null, FZ11_DO);
  } else {
    if (deniz) { x.translate(0, -32); x.rotate((P.a_suA || 0) * P.a_side * (u < 1 ? smooth(clamp(Math.abs(u - 0.5) * 2, 0, 1)) : 1)); x.translate(0, 32); }
    x.scale(fsc * R.sx * FZ_SC, R.sy * FZ_SC);
    if (P.a_spin) {   // Suda takla ayakların/başın değil, toplanan gövdenin merkezinden döner.
      const cx = deniz ? R.hx : 0, cy = deniz ? P.a_hipY - 6.2 : -30;
      x.translate(cx, cy); x.rotate(P.a_spin); x.translate(-cx, -cy);
    }
    fzFS = P.a_side < 0 ? -1 : 1;
    if (hb2) FZ.hair = FZ_HAIR_B2;
    try { if (front) fzDrawFront(x, tm); else fzDraw(x, tm);
    } finally { fzFS = 1; FZ.hair = FZ_HAIR0; }
  }
  fzQ = P;
  // çizim yeri: (varsa) ara değerli fizik konumu + animasyon kayması (Pırıl taşırken havada)
  const bx = (P.rx ?? P.x) + (kay ? 0 : p9 ? FZ9.ox : p12 ? FZ12.ox : P.a_ox), by = (P.ry ?? P.y) + (kay || p9 ? 0 : p12 ? FZ12.oy : P.a_oy + P.a_lf);
  if (window.fzDbgHook) window.fzDbgHook(fzC, (bx - cam.x - SZ / 2) * S, (by - cam.y - OY) * S);   // yalnız test (renk ölçümü)
  // ışıklandırma: renk tonu değil, değer. Saç kestane, ten sıcak kalsın; sahnenin rengi yalnız ince kenar ışıklarında.
  // 1) ayaklara doğru koyulaşan, nötre yakın gölge (gece mavisi saçı/teni mora çevirmesin)
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  const b3 = typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 3, b9 = BOLUM_NO === 9, Lf = deniz ? Math.max(light, 0.76) : b3 ? Math.max(light, 0.85) : b9 ? Math.max(light, 0.8) : BOLUM_NO === 12 ? Math.max(light, 0.9) : light;   // Bölüm 3 gün doğumu: Feza hep aydınlık (Bölüm 9 altın saat de; Bölüm 12 kampüste gündüz)
  const nq = Math.round((1 - Lf) * 200), lk = need * 1000 + nq + (fzKos ? 0.5 : 0);
  if (lk !== fzLgK) {   // yalnız boy ya da ışık (1/200 adım) değişince yeni geçiş
    const nt = nq / 200; fzLgK = lk; fzLg = fzKos ? x.createLinearGradient(0, (OY - 85.6) * S, 0, (OY + 26) * S) : x.createLinearGradient(0, need * 0.1, 0, need);   // kostümde büyük tuval: geçiş ayağa göre aynı yerde
    fzLg.addColorStop(0, `rgba(34,18,12,${(0.06 + 0.06 * nt).toFixed(3)})`); fzLg.addColorStop(0.55, `rgba(22,16,24,${(0.12 + 0.1 * nt).toFixed(3)})`);
    fzLg.addColorStop(1, `rgba(14,16,32,${(0.3 + 0.14 * nt).toFixed(3)})`);
  }
  x.fillStyle = fzLg; x.fillRect(0, 0, px, px);
  // 2) Pırıl'ın halesi (oyun.js omPirilHale: '#b88aff' r150 ×0.24 ve '#ffe0ff' r40 ×0.11, 'lighter') Feza'nın üstüne
  //    mor ışık EKLER; saç ve ten mora döner. Aynı haleyi burada önceden ÇIKARIRIZ ('difference' = çıkarma, taban ≥ ek
  //    olduğundan), ekleme sonrası renk doğal kalır. Pırıl'ın ışığından yalnız küçük leylak kenar ışığı (3) kalır.
  //    Hale bir kez çizilmiş küçük bir görüntüden ölçeklenir (kare başına gradyan yok), siluetle maskelenip tek geçişte çıkarılır.
  const dx = (D.x - bx) * S + SZ / 2 * S, dy = (D.y - by) * S + OY * S, pd = Math.hypot(D.x - bx, D.y - (by - 30));
  if (pd < 190 && !b3 && !deniz && !(BOLUM_NO === 12 && P.ucus)) {   // Bölüm 3'te hâle küçük ve çok hafif (oyun.js): çıkarılacak bir şey yok (Bölüm 12 binişinde oyun.js hâleyi çizmez: çıkarma da yok)
    const r = fzRX, R1 = 150 * S;
    r.globalCompositeOperation = 'source-over'; r.globalAlpha = 1; r.clearRect(0, 0, px, px);
    r.drawImage(fzHaloSpr(0), dx - R1, dy - R1, R1 * 2, R1 * 2);
    if (pd < 60) { const R2 = 40 * S; r.globalCompositeOperation = 'lighter'; r.drawImage(fzHaloSpr(1), dx - R2, dy - R2, R2 * 2, R2 * 2); }
    r.globalCompositeOperation = 'destination-in'; r.drawImage(fzC, 0, 0);
    r.globalCompositeOperation = 'source-over';
    x.globalCompositeOperation = 'difference'; x.drawImage(fzR, 0, 0);
  }
  x.globalCompositeOperation = 'source-over';
  // 3) kenar ışıkları: sağ üstteki ay (bölgenin rengiyle), aşağıdan zeminin yansıması, Pırıl'ın küçük leylak kenarı
  const b2 = typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 2;
  if (b2) {   // Bölüm 2: gece-göl ortamının mavi-mor tonu ten ve pijamaya hafifçe karışır (gri/soluk kalmasın)
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.03 * (1 - light * 0.6); x.fillStyle = '#6c5ee0'; x.fillRect(0, 0, px, px);
    x.globalAlpha = 0.15 * (1 - light * 0.4); x.fillStyle = '#ffc99a'; x.fillRect(0, 0, px, px);   // pijama sıcak krem-pembe kalsın, ortamdan ayrışsın (0,34 idi: her şeyi soluk şeftaliye boğuyordu, saç/göz kontrastı kayboluyordu)
    x.globalAlpha = 0.06 * (1 - light * 0.5); x.fillStyle = '#34358f'; x.fillRect(0, 0, px, px);   // soğuk mavi-mor gölge: beyaz patlamasın, ortamla birleşsin
    x.globalAlpha = 0.03; x.fillStyle = '#fff4e6'; x.fillRect(0, 0, px, px);   // hafif krem aydınlatma: karartılmış sahnelerde de soluk kalmasın
    x.globalAlpha = 0.12 * (1 - light * 0.5); x.fillStyle = '#2a1f6a'; x.fillRect(0, px * 0.6, px, px * 0.4);   // alt yarı biraz daha koyu (suya/zemine doğru)
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  }
  if (b3) {   // Bölüm 3 (gün doğumu): tende/pijamada hafif şeftali sıcaklık, alt yarıda bulutların lila gölgesi
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.1; x.fillStyle = '#ffbc96'; x.fillRect(0, 0, px, px);
    x.globalAlpha = 0.07; x.fillStyle = '#9a6ec8'; x.fillRect(0, px * 0.62, px, px * 0.38);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  }
  if (b9) {   // Bölüm 9 (altın saat): tende/pijamada hafif şeftali-altın sıcaklık, alt yarıda çayırın yeşil yansıması
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.07; x.fillStyle = '#ffc89a'; x.fillRect(0, 0, px, px);
    x.globalAlpha = 0.05; x.fillStyle = '#3fbf8a'; x.fillRect(0, px * 0.66, px, px * 0.34);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  }
  const b11 = BOLUM_NO === 11;
  if (b11) {   // Bölüm 11 (ay ışığı gecesi): tende/pijamada çok hafif gümüş-lila gece tonu, alt yarıda yer sisinin lila gölgesi (sıcak ten korunur)
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.06; x.fillStyle = '#8f9cff'; x.fillRect(0, 0, px, px);
    x.globalAlpha = 0.07; x.fillStyle = '#5a3f9e'; x.fillRect(0, px * 0.64, px, px * 0.36);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  }
  if (deniz) {
    // Suyun üstten mint yansıması; arkadaki koyu, sıcak saç/ten korunur.
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.055; x.fillStyle = '#559cab'; x.fillRect(0, px * 0.43, px, px * 0.57);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    fzRim(-0.45, -0.9, 0.58 * S, '#bdecd9', 0.32); fzRim(0.68, 0.6, 0.45 * S, '#37687e', 0.23);
  }
  const amb = fzAmb();
  fzRim(b3 ? 0.8 : 0.72, b3 ? -0.6 : -0.69, 0.75 * S, amb[0], b3 ? 0.8 : (0.7 - light * 0.25) * (b2 ? 1.2 : 1));
  fzRim(-0.25, 0.97, 0.6 * S, amb[1], 0.4);
  if (b3) fzRim(-0.85, -0.3, 0.55 * S, '#ffb3cf', 0.42);   // arkadan pembe gökyüzü kenarı (Gris tadında)
  if (b9) fzRim(-0.85, -0.35, 0.5 * S, '#ffb3cf', 0.3);    // Bölüm 9: arkadan gül rengi gök kenarı
  if (b11) { fzRim(0.72, -0.69, 0.42 * S, '#f2f8ff', 0.38); fzRim(-0.88, -0.3, 0.5 * S, '#c9a6ff', 0.32); }   // Bölüm 11: ayın ince parlak gümüş kenarı + arkadan lila gece göğü kenarı
  if (b2) fzRim(0.9, 0.1, 0.6 * S, '#ffe2a8', 0.32 * (1 - light * 0.5));   // yıldız ışığının sıcak altın kenarı
  const ddx = D.x - bx, ddy = D.y - (by - 38), dd = Math.hypot(ddx, ddy) || 1;
  fzRim(ddx / dd, ddy / dd, 0.7 * S, '#e2b8ff', 0.5 * clamp(1.2 - dd / 220, 0, 1));
  // Pırıl taşırken: sıcak bir kenar ışığı ve hafif sıcak dolgu (karanlık boşlukta solgun görünmesin, net okunsun)
  const tw = P.a_tasW || 0;
  if (tw > 0.02) {
    x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.2 * tw; x.fillStyle = '#ffd2a0'; x.fillRect(0, 0, px, px);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    fzRim(-0.35, -0.94, 0.85 * S, '#ffc77a', 0.85 * tw);
    fzRim(0.9, 0.42, 0.6 * S, '#ffb26b', 0.45 * tw);
  }
  // yakındaki açık ışık çiçeğinin sıcak yansıması (kenar ışığı, yönü çiçeğe doğru)
  if (typeof FLOWERS !== 'undefined' && FLOWERS) {
    let bf = null, bs = 0;
    for (let i = 0; i < FLOWERS.length; i++) { const o = FLOWERS[i], dx = o.x - bx, dy = o.y - 12 - (by - 30), q = (o.open || 0) * (1 - Math.hypot(dx, dy) / 230); if (q > bs) { bs = q; bf = o; } }
    if (bf && bs > 0.03) { const dx = bf.x - bx, dy = bf.y - 12 - (by - 30), dl = Math.hypot(dx, dy) || 1; fzRim(dx / dl, dy / dl, 0.8 * S, '#ffd9b0', 0.7 * clamp(bs * 1.4, 0, 1)); }
  }
  let a = 1; if (P.fade > 0) a = 1 - clamp((P.fade - 0.22) / 0.38, 0, 1);
  const gk = b9 || BOLUM_NO === 11 || BOLUM_NO === 12 ? fz9GecisK(tm) : 1;   // Bölüm 9 çapraz geçiş: yeni poz (ve konturu) gk ile belirir, eski kare 1-gk ile söner
  if (!kay && !deniz && !(p12 && fz12Golgesiz())) fzShadow(bx, by, a);   // (Bölüm 12 kayıkta yer gölgesi yok)
  const gx0 = (bx - cam.x - SZ / 2) * S, gy0 = (by - cam.y - OY) * S;
  // okunurluk: (1) çok hafif sıcak-krem karakter hâlesi (yavaş nefesli), (2) ince açık-krem dış kenar + ince koyu-lacivert iç hat (yumuşak, çıkartma gibi değil)
  if (a > 0.05) {
    const hv = (b2 ? 0.14 : 0.12) * (0.88 + 0.12 * Math.sin(tm * 1.9)) * (1 - Lf * 0.5) * a;
    g.globalAlpha = hv; g.drawImage(fzHaloS2(), (bx - cam.x - 36) * S, (by - cam.y - 34 - 46) * S, 72 * S, 92 * S); g.globalAlpha = 1;
    const d1 = Math.max(1, 0.26 * S), d2 = d1 + Math.max(0.9, 0.27 * S);
    if (!fzO || fzO.width !== px) { if (!fzO) { fzO = document.createElement('canvas'); fzOX = fzO.getContext('2d'); } fzO.width = fzO.height = px; }
    fzRing(fzOX, fzO, d2, b3 ? '#a8668f' : b9 ? '#8a5878' : '#fff1d6');   // Bölüm 3 (aydınlık gök): krem yerine yumuşak erik tonu dış kenar – açık zeminde de seçilsin (Bölüm 9 pastel vadi de: krem kenar pijamayı zemine eritiyordu)
    g.globalAlpha = a * (gk < 1 ? smooth(clamp(gk * 2, 0, 1)) : 1) * (b2 ? 0.32 : b3 ? 0.24 : b9 ? 0.3 : 0.32); g.drawImage(fzO, gx0, gy0);
    fzRing(fzRX, fzR, d1, b3 ? '#3a1d3c' : b9 ? '#3a1d3c' : '#0c1233');
    g.globalAlpha = a * (gk < 1 ? smooth(clamp(gk * 2, 0, 1)) : 1) * (b3 ? 0.55 : b9 ? 0.72 : 0.6); g.drawImage(fzR, gx0, gy0);
    fzKx = gx0; fzKy = gy0; fzKa = a; fzKb2 = b2;
  } else fzKa = 0;
  if (gk < 1) {   // önce eski kare, üstüne yeni: ilk yarıda eski tam, yeni belirir; ikinci yarıda yeni tam, eski söner (gövde hiç saydamlaşmaz)
    const k0 = S / FZ9G.S; g.globalAlpha = a * (1 - smooth(clamp(gk * 2 - 1, 0, 1)));
    g.drawImage(fz9SnC, (FZ9G.bx - FZ9G.px + (P.rx ?? P.x) - FZ9G.sz / 2 - cam.x) * S, (FZ9G.by - FZ9G.py + (P.ry ?? P.y) - FZ9G.oy - cam.y) * S, fz9SnC.width * k0, fz9SnC.height * k0);
  }
  g.globalAlpha = gk < 1 ? a * smooth(clamp(gk * 2, 0, 1)) : a;
  g.drawImage(fzC, gx0, gy0);
  if (b9 || BOLUM_NO === 11 || BOLUM_NO === 12) { FZ9G.lbx = bx; FZ9G.lby = by; FZ9G.lsz = SZ; FZ9G.loy = OY; FZ9G.lS = S; FZ9G.lpx = P.rx ?? P.x; FZ9G.lpy = P.ry ?? P.y; FZ9G.lt = tm; FZ9G.la = a; }   // bu karenin yeri (sonraki geçişin eski karesi)
  if (fzKos) fz8Sonra(gx0, gy0, bx, by, SZ, OY, a);   // Bölüm 8: asa/kabak yüzü ışıkları, sepet ağzının dünya konumu
  if (deniz && FZ_SU_BAL_M.valid) { const m = FZ_SU_BAL_M; g.save(); g.setTransform(m.a, m.b, m.c, m.d, m.e + gx0, m.f + gy0); fzNefesZari(g, tm, m.front); g.restore(); }
  g.globalAlpha = 1;
  fzKos = null;
}
// Feza'nın çizimi parçacıkların/ışıkların ALTINDA kalırsa: oyun.js bunu parlak katmanlardan (drawFx vb.) sonra çağırırsa ince krem kontur Feza'yı yine okunur kılar
function drawFezaKontur() {
  if (P.ucus || P.isilDe || !(fzKa > 0.05) || !fzO) return;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over';
  g.globalAlpha = fzKa * 0.3; g.drawImage(fzO, fzKx, fzKy); g.globalAlpha = 1;
}
let fzO = null, fzOX = null, fzKx = 0, fzKy = 0, fzKa = 0, fzKb2 = false, fzHaloS3 = null;
const FZ_HEX = [[1, 0], [0.5, 0.866], [-0.5, 0.866], [-1, 0], [-0.5, -0.866], [0.5, -0.866]];
function fzRing(r, cv, d, col) {   // fzC silüetinin d piksel dışındaki halka (altıgen genişletme − silüet)
  r.globalCompositeOperation = 'source-over'; r.globalAlpha = 1; r.clearRect(0, 0, cv.width, cv.height);
  for (let k = 0; k < 6; k++) r.drawImage(fzC, FZ_HEX[k][0] * d, FZ_HEX[k][1] * d);
  r.globalCompositeOperation = 'source-in'; r.fillStyle = col; r.fillRect(0, 0, cv.width, cv.height);
  r.globalCompositeOperation = 'destination-out'; r.drawImage(fzC, 0, 0); r.globalCompositeOperation = 'source-over';
}
function fzHaloS2() {
  if (fzHaloS3) return fzHaloS3;
  const c = document.createElement('canvas'); c.width = 64; c.height = 80; const h = c.getContext('2d');
  const rg = h.createRadialGradient(32, 40, 0, 32, 40, 40);
  rg.addColorStop(0, 'rgba(255,238,206,0.9)'); rg.addColorStop(0.5, 'rgba(255,230,196,0.4)'); rg.addColorStop(1, 'rgba(255,225,190,0)');
  h.fillStyle = rg; h.fillRect(0, 0, 64, 80); return (fzHaloS3 = c);
}

// ── animasyon ──
const FZ_CARRY = 0.95;
const FZ_HUG = 0.85;     // kuzucuğa sarılma süresi (sn), ardından sevinç sekmesi   // Pırıl'ın taşıma süresi (kurtarildi → yere konma)
const FZ_STAR_IK = [[-12.6, -25.5, 1], [12.6, -25.5, 1]];   // yıldız pozunda eller (önden)
const FZ_GER_IK = [[-7.6, 0.8, 0], [7.6, 0.8, 0]];          // gerinirken eller (önden, değişir)
const FZ_SEV_IK = [[-12.4, -25.5, 1], [12.4, -25.5, 1]];     // sevinirken eller (önden)
const FZ_TADA_IK = [[-6.6, 1.6, 1], [6.6, 1.6, 1]];          // fırlatmadan sonra yere inince "ta-da!" (önden, değişir)
const FZ_IKB = [[-6.6, 1.6, 0], [6.6, 1.6, 0]];              // o karede çizilen (karışmış) el hedefleri
const FZ_SEQ = [[4, 'wave'], [9.5, 'yawn'], [15, 'stretch'], [20.5, 'sit'], [26, 'look'], [31, 'wave']];   // uzun beklemede sırayla
const FZ_ACT = { wave: 2.8, yawn: 2.7, stretch: 2.5, look: 2.2, nod: 3.2, sway: 3.4, peek: 2.8, pat: 2.7, toz: 3.4, yansima: 3.0 };
// ── final kutlaması: ağaç yandıktan sonra ağacın önünde sevinç döngüsü ──
// önce ağaca hayranlıkla bakar (~1,5 sn), sonra önden kollar havada zıplar; müziğin ölçü başında dansa başlar.
// Ölçüler (2,4 sn, Pofuduk'larla aynı vuruş): 0 dans (sek · sek · el çırp (önden) · önden geçerek dönüp öbür gruba),
// 1 Pırıl'a el sallama (yakındaysa), 2 düşen yaprağa uzanıp yakalama, 3 kollar havada. Fizik konumu hiç değişmez.
const FZ_FIN_IK = [[-6.6, 1.6, 1], [6.6, 1.6, 1]], FZ_FIN_G = new Float64Array(4), FZ_FIN_V = new Float64Array(4);
const FZ_FIN_SEQ = [0, 1, 2, 0, 3, 0], FZ_BAR = 2.4, FZ_BEAT = 0.6, FZ_PET = new Float64Array(2);
function fzFinal() {
  return (typeof DURUM !== 'undefined' && DURUM === 'final') || (typeof TREE !== 'undefined' && !!TREE && !!TREE.done && DURUM === 'oyun') || fzSenlik6() || fzKuzey7() || fzCadi8() || fzEjder9() || fzBalo11();
}
// Bölüm 6 avlu şenliği (V6.final, oyun sürerken): aynı dans döngüsü; ölçü saati şenliğin müziğine (SN.avlu.age, 0,6 sn vuruş) oturur.
// Sıra: dans · kollar havada · dans · Pırıl'a el sallama · dans · kollar havada (yaprak yakalama yok); doruk anında (25-31 sn)
// kollar havada, gözler gökteki ışık tacında. Havadayken (senlik.js'in vuruş zıplamaları) kollar havada sevinç pozu.
const FZ_FIN_SEQ6 = [0, 3, 0, 1, 0, 3];
function fzSenlik6() {
  return typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 6 && typeof V6 !== 'undefined' && !!V6 && !!V6.final && typeof DURUM !== 'undefined' && DURUM === 'oyun';
}
// Bölüm 7 kuzey tepesi finali (V7.final, oyun sürerken): Bölüm 6 ile aynı sıra ve havada sevinç pozları. Saat: kar.js'in 'kuzeyTepe'
// nesnesi o.age (final başından saniye) verirse ona oturur; o.doruk true iken kollar havada, gözler gökteki kuzey ışıklarında.
function fzKuzey7() {
  return typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 7 && typeof V7 !== 'undefined' && !!V7 && !!V7.final && typeof DURUM !== 'undefined' && DURUM === 'oyun';
}
let fzTepeO;   // undefined: aranmadı
function fzKuzeyTepe() {
  if (fzTepeO === undefined) fzTepeO = typeof NESNELER !== 'undefined' ? NESNELER.find(o => o.tip === 'kuzeyTepe') || null : null;
  return fzTepeO && Number.isFinite(fzTepeO.age) && Number.isFinite(fzTepeO.x) && Number.isFinite(fzTepeO.y) ? fzTepeO : null;
}
const fzSenlik67 = () => fzSenlik6() || fzKuzey7() || fzCadi8() || fzEjder9() || fzBalo11();   // (Bölüm 8 meydan finali de aynı dans/zıplama düzeni)
function fzSenlikAvlu() { return typeof SN !== 'undefined' && SN && SN.avlu && SN.avlu.basla && Number.isFinite(SN.avlu.age) ? SN.avlu : null; }
function fzPetal(i, out) {   // dunya.js drawPetals'teki i. yaprağın dünya konumu (aynı formül; yaprak ekranda kayar)
  if (typeof DN_PETALS === 'undefined' || !DN_PETALS[i] || typeof VW === 'undefined') return false;
  const p = DN_PETALS[i], tm = now, w = VW + 200;
  const x = ((p.x + tm * 14 * p.sp + Math.sin(tm * p.sp + p.ph) * 40 - cam.x * 1.1) % w + w) % w - 100;
  const hv = H / S + 200, y = ((p.y + tm * 22 * p.sp - cam.y) % hv + hv) % hv - 80;
  out[0] = x + cam.x; out[1] = y + cam.y; return true;
}
function fzPetOk(out) { const dx = out[0] - P.x, dy = out[1] - (P.y - 110); return dx > -130 && dx < 130 && dy > -120 && dy < 55; }
function fzFinPetal(out, bt) {   // uzanılacak yaprak: seçilen gerçek yaprak; çerçeveden çıkarsa hayali, süzülen bir yaprak
  if (P.a_finPet >= 0 && fzPetal(P.a_finPet, out) && fzPetOk(out)) return;
  P.a_finPet = -1;
  out[0] = P.x + P.a_finDir * 48 + 8 * Math.sin(P.a_t * 1.3); out[1] = P.y - 118 + 40 * (bt / FZ_BAR);
}
function fezaInit() {
  // bütün P.a_* alanları burada bir kez, sabit sırayla kurulur (sonradan alan eklenmesin: P'nin biçimi kare kare değişmesin)
  P.a_pose = new Float64Array(FZ_RESTA); P.a_pv = new Float64Array(FZ_N); P.a_R = fzPose(); fzUnpack(FZ_RESTA, P.a_R);
  P.a_t = 0; P.a_face = P.f; P.a_side = P.f; P.a_turnU = 1; P.a_turnTo = P.f; P.a_turnDur = 0.16; P.a_front = false; P.a_fu = 0; P.a_state = 'idle'; P.a_sw = 1; P.a_wasG = P.ground; P.a_prevVy = 0;
  P.a_landT = 9; P.a_landP = 0; P.a_take = 0; P.a_skid = 0; P.a_skidDir = 1; P.a_idle = 0; P.a_waveDir = 1;
  P.a_lookT = 1.2; P.a_look = 0; P.a_blink = 2.5; P.a_lidM = 1; P.a_spin = 0;
  P.a_suHamleT = 9; P.a_suHamleSide = P.f || 1; P.a_suHamleSign = 1; P.a_suTuck = 0; P.a_suExtend = 0;
  P.a_hx = P.a_hy = P.a_hvx = P.a_hvy = 0; P.a_hipY = -(FZ_TH + FZ_SH + FZ_FT); P.a_hipV = 0;
  P.a_ph = 0; P.a_j6 = 0; P.a_launch = 0; P.a_launchBig = false; P.a_stomp = 0; P.a_cheerT = 9; P.a_cheerO = null; P.a_cheerDir = 1;
  P.a_push = 0; P.a_bump = 0; P.a_carryT = 9; P.a_wasCarry = false; P.a_ox = 0; P.a_oy = 0; P.a_elX = P.x; P.a_elY = P.y; P.a_tutun = 0;
  P.a_act = ''; P.a_actT = 0; P.a_seq = 0; P.a_nextAct = FZ_SEQ[0][0]; P.a_sit = 0; P.a_edgeT = 0; P.a_edge = 0;
  P.a_bal = 0; P.a_balKick = 0; P.a_awe = 0; P.a_big = null;
  P.a_tadaT = 9; P.a_fromL = false; P.a_ledge = 0; P.a_ledgeW = 0; P.a_ledgeOx = 0; P.a_stepN = 0;
  P.a_takeP = 1; P.a_getup = 0; P.a_edgeX = 0; P.a_hipV = 0; P.a_tasW = 0; P.a_ikW = 0; P.a_ikSrc = null; P.a_ikLast = null;
  P.a_hw = 0; P.a_yaw = 0; P.ik = null;
  P.a_kAci = 0; P.a_kSide = P.f || 1; P.a_kpx = P.x; P.a_kpy = P.y; P.a_wasKay = false; P.a_hug = 0; P.a_esW = 0; P.a_esL = null; P.a_kenar = false; P.a_brkT = 9; P.a_brkK = 0; P.a_dinT = 0; P.a_ohBek = 0; P.a_ohT = 9; P.a_arkT = 0; P.a_ark = 0; P.a_arkG = 1; P.a_arkN = 4; P.a_surD2 = 1;   // Bölüm 3: kayma eğimi/yönü, kuzucuğa sarılma
  P.a_cl = 0; P.a_clv = 0; P.a_ax = 0; P.a_pvx = P.vx; P.a_brk = 0; P.a_spPrev = 0; P.a_gd = 99; P.a_pre = 0; P.a_sur = 0; P.a_surK = 0; P.a_surD = 1; P.a_sacT = 1; P.a_sacX = 0; P.a_sacY = 0; P.a_dj = 0; P.a_skyT = 0; P.a_skyK = 0; P.a_skyW = 0; P.a_lf = 0; P.a_pry = P.ry ?? P.y;
  // final kutlaması
  P.a_finT = 0; P.a_finClk = 0; P.a_finBar0 = -1; P.a_finBar = -1; P.a_finKind = 0; P.a_finDir = 1; P.a_finHand = 1; P.a_finPet = -1;
  for (let i = 0; i < 4; i++) { FZ_FIN_G[i] = FZ_FIN_V[i] = 0; }
  FZ_FIN_IK[0][0] = -6.6; FZ_FIN_IK[0][1] = 1.6; FZ_FIN_IK[1][0] = 6.6; FZ_FIN_IK[1][1] = 1.6;
}

// ── oyun olayları → animasyon ──
if (typeof OLAY !== 'undefined') {
  OLAY.on('ziplatti', o => { if (!P.a_pose) return; P.a_launch = 1; P.a_launchBig = !!(o && o.tip === 'buyukPofuduk'); P.a_stomp = 0; P.a_sit = 0; P.a_fromL = true; });
  OLAY.on('uyandi', o => { if (!P.a_pose || !o || o.tip !== 'pofuduk' || Math.abs(o.x - P.x) > 90 || P.ground) return; P.a_stomp = 1; });
  const sevin = o => {
    if (!P.a_pose || !o || Math.abs(o.x - P.x) > 300) return;
    P.a_cheerT = 0; P.a_cheerO = o; P.a_hug = 0; P.a_cheerDir = Math.sign(o.x - P.x) || P.f; P.a_sit = 0; P.a_act = '';
  };
  // Bölüm 3: kuzucuk renklendi → kısa sarılma (gözler mutlulukla kapalı, kollar sarar), sonra önden kollar havada sevinç sekmesi
  OLAY.on('kuzu', e => { const o = e && e.o ? e.o : e; if (!P.a_pose || !o || typeof o.x !== 'number' || Math.abs(o.x - P.x) > 300) return; sevin(o); P.a_cheerT = 0.55 - FZ_HUG; P.a_hug = 1; });
  OLAY.on('ucusBitti', () => { if (P.a_pose) { P.a_fromL = true; P.a_sit = 0; P.a_act = ''; } });   // Pırıl'ın sırtından inince "ta-da!"
  OLAY.on('ciftZiplama', () => { if (P.a_pose) P.a_dj = 1; });   // Pırıl itti: kısa ezilme, sonra uzama
  OLAY.on('cicek', sevin); OLAY.on('tohum', sevin);
  // şaşırma tepkileri: Büyük Pofuduk'un uyanış aşamaları (irkilme), karanlık gölün aydınlanması (hayranlık), yakında uyanan Pofuduk (küçük "oo")
  const saskin = (k, dur) => { if (!P.a_pose) return; P.a_sur = 1; P.a_surK = k; P.a_surD = dur; P.a_sit = 0; P.a_act = ''; };
  OLAY.on('buyukAsama', e => saskin(1, 1.3));
  // Bölüm 2: yıldız uyandı (sevinç: önce uzanır sonra zıplar), yıldız göğe yerleşti (başı kalkık, el sallar), hayvan uyanırken irkilme / uyanınca sevinç sekmesi
  const gok = (dur, k) => { if (!P.a_pose) return; P.a_skyT = Math.max(P.a_skyT, dur); P.a_skyK = Math.max(P.a_skyT > dur ? P.a_skyK : 0, k); };   // gökyüzüne bakış: üst üste gelen olaylarda uzun/güçlü olan kalır
  OLAY.on('yildiz', o => { sevin(o); gok(1.3, 0.55); });
  OLAY.on('yildizYerlesti', () => { saskin(4, 1.7); gok(1.8, 1); });
  OLAY.on('hayvanAsama', () => saskin(1, 1.2));
  const hayvanSev = o => { if (!P.a_pose || !o) return; P.a_cheerT = 0.6; P.a_cheerO = o; P.a_cheerDir = Math.sign(o.x - P.x) || P.f; P.a_sit = 0; P.a_act = ''; P.a_sur = 0; };
  OLAY.on('hayvanUyandi', hayvanSev); OLAY.on('hayvanFirlat', () => { if (P.a_pose) P.a_sur = 0; });
  OLAY.on('aydinlat', () => saskin(2, 1.6));
  OLAY.on('gokkusagiBasla', () => { saskin(2, 2.4); gok(3.2, 1); });   // Bölüm 3: gökyüzünde gökkuşağı belirirken başını kaldırıp hayranlıkla bakar
  OLAY.on('uyandi', o => { if (o && o.tip === 'pofuduk' && P.ground && Math.abs(o.x - P.x) < 240) { saskin(5, 1.5); P.a_surD2 = Math.sign(o.x - P.x) || P.f; } });   // kısa "oo", sonra kıkırdama
  // Pırıl konuşurken ona bakar (yürürken yalnız gözler)
  OLAY.on('konusma', e => { if (P.a_pose && e && e.kim === 'p') P.a_dinT = clamp((+e.sure || 2) + 0.3, 0.8, 4.5); });
  OLAY.on('kurtarildi', () => { if (P.a_pose) P.a_ohBek = 1; });   // Pırıl taşıyıp bırakınca "ohh" rahatlama
  OLAY.on('carpti', o => { if (!P.a_pose || !o) return; if (P.a_push <= 0) P.a_bump = 1; P.a_push = 0.2; });
  OLAY.on('kurtarildi', () => { if (!P.a_pose) return; P.a_carryT = 0; P.a_fromL = false; P.a_oy = -50; P.a_sit = 0; P.a_act = ''; });
}
function fzMover() {   // üstünde durduğu cisim hareket ediyor mu
  const o = typeof ustundeki !== 'undefined' ? ustundeki : null;
  return !!(o && o.cisim && (Math.abs(o.cisim.dx || 0) + Math.abs(o.cisim.dy || 0) > 0.02));
}
function fzGDist() {   // ayağın altındaki en yakın zemin/dal yüzeyine uzaklık (ızgaradan; yoksa 99)
  if (typeof cell !== 'function') return 99;
  const c0 = Math.floor((P.x - 4) / T), c1 = Math.floor((P.x + 4) / T), r0 = Math.floor(P.y / T);
  for (let r = r0; r <= r0 + 3; r++) {
    const a = cell(c0, r), b = cell(c1, r), d = r * T - P.y;
    if ((a === 1 || a === 2 || b === 1 || b === 2) && d >= -2) return d;
  }
  return 99;
}
function fzEdge() {    // ayakta dururken uçurum kenarı: + sağda, - solda (0..1 güç)
  if (typeof cell !== 'function' || (typeof ustundeki !== 'undefined' && ustundeki)) return 0;
  const ty = Math.round(P.y / T);
  if (Math.abs(P.y - ty * T) > 1) return 0;
  const cx = Math.floor(P.x / T);
  for (let s = 1; s >= -1; s -= 2) {
    const nx = cx + s;
    if (fzZemin(nx, ty) || fzZemin(nx, ty - 1) || fzZemin(nx, ty + 1)) continue;   // zemin devam ediyor / duvar / küçük basamak
    const ex = s > 0 ? (cx + 1) * T : cx * T, dist = (ex - P.x) * s; P.a_edgeX = ex;           // kenara uzaklık (eksi = kenarın ötesinde)
    const k = clamp((13 - dist) / 10, 0, 1);
    if (k > 0) return s * k;
  }
  return 0;
}
function fzZemin(cx, r) { const c = cell(cx, r); return c === 1 || c === 2; }
function fzFy(a1, a2) { return FZ_TH * Math.cos(a1) + FZ_SH * Math.cos(a1 + a2) + FZ_FT; }
// ayak sesi olayı: tek nesne, her basışta yeniden doldurulur (dinleyici (muzik.js) yalnız o anda okur)
const FZ_ADIM = { x: 0, y: 0, hiz: 0, inis: false };
function fzAdim(sp, inis) {
  if (BOLUM_NO === 12 && typeof fz12Tam === 'function' && fz12Tam()) return;   // Bölüm 12: araçta/kayıkta/otururken adım sesi yok (fizik P.vx'i araç hızıyla taşır)
  FZ_ADIM.x = P.x; FZ_ADIM.y = P.y; FZ_ADIM.hiz = sp; FZ_ADIM.inis = inis; OLAY.emit('adim', FZ_ADIM);
  if (typeof dn7Iz === 'function') { try { dn7Iz(P.x + (P.f || 1) * ((P.a_stepN & 1) ? 3 : -3), P.y, inis ? 'inis' : 'feza'); } catch (e) {} }   // Bölüm 7: karda ayak izi (dunya7.js)
  if (BOLUM_NO === 9 && typeof dn9Iz === 'function') { try { dn9Iz(P.x + (P.f || 1) * ((P.a_stepN & 1) ? 3 : -3), P.y, inis ? 'inis' : 'feza'); } catch (e) {} }   // Bölüm 9: çimende minik çiçek / ışık tozu (dunya9.js)
}
const FZ_RAND_ACT = ['wave', 'yawn', 'stretch', 'nod', 'look', 'sway', 'peek', 'sway', 'peek'];
function fzEsinti() {   // Bölüm 3: içinde bulunduğu yukarı hava akımının gücü (0..1)
  if (!P.a_esL) { P.a_esL = []; if (typeof NESNELER !== 'undefined') for (const o of NESNELER) if (o.tip === 'esinti') P.a_esL.push(o); }
  let e = 0; for (let i = 0; i < P.a_esL.length; i++) { const o = P.a_esL[i]; if (o.ic && o.guc > e) e = o.guc; }
  return e;
}
function fzBig() {     // hayranlıkla bakılacak büyük şeyler
  if (P.a_big) return P.a_big;
  P.a_big = [];
  if (typeof NESNELER !== 'undefined') for (const o of NESNELER) if (o.tip === 'buyukPofuduk' || o.tip === 'agac') P.a_big.push(o);
  return P.a_big;
}

// oyun.js her karede fizikten sonra çağırır
function fezaUpdate(dt) {
  if (!P.a_pose) fezaInit();
  if (!(dt > 0)) return;
  dt = Math.min(dt, 0.05);
  const t = (P.a_t += dt), sp = Math.abs(P.vx), vy = P.vy;
  if (BOLUM_NO === 9) fz9Adim(dt);   // Bölüm 9 oyun içi poz saati (fezaPoz9)
  if (P.ucus) { P.a_suHamleT = 9; P.a_suTuck = P.a_suExtend = 0; }   // Vatoza binerken eski takla sonradan yeniden başlamaz.
  if (BOLUM_NO === 4 && P.deniz && !P.ucus) { fzDenizAdim(dt, t); return; }
  {   // gökkuşağından kayma (Bölüm 3, P.poz === 'kayma'): yön ve eğim konum değişiminden (ya da P.kaymaAci'den), yumuşatılmış
    const kx = P.rx ?? P.x, ky = P.ry ?? P.y, dx = kx - P.a_kpx, dy = ky - P.a_kpy, kay = P.poz === 'kayma'; P.a_kpx = kx; P.a_kpy = ky;
    if (kay) {
      if (!P.a_wasKay) { P.a_kSide = P.f || 1; P.a_kAci = 0; }
      if (Math.abs(dx) > 0.25) P.a_kSide = dx > 0 ? 1 : -1;
      const ta = typeof P.kaymaAci === 'number' ? P.kaymaAci : Math.hypot(dx, dy) > 0.3 ? Math.atan2(dy * P.a_kSide, dx * P.a_kSide) : P.a_kAci;
      P.a_kAci += (clamp(ta, -0.75, 0.75) - P.a_kAci) * (1 - Math.exp(-dt * 8));
    } else if (P.a_wasKay) { P.a_fromL = true; P.a_sit = 0; P.a_act = ''; }   // kayma bitti: yere inince "ta-da!"
    P.a_wasKay = kay;
  }
  {   // fizikteki ani yukarı sıçrama (kenara tutunma affı, basamağa çıkış): çizim eski yerinden yumuşakça yükselir, "ışınlanma" olmaz
    const ry = P.ry ?? P.y, an = (ry - P.a_pry) - vy * dt; P.a_pry = ry;
    if (an < -2.2 && an > -40 && P.fade <= 0) P.a_lf = Math.min(14, P.a_lf - an);
    P.a_lf *= Math.exp(-dt * 8); if (P.a_lf < 0.02) P.a_lf = 0;
  }
  // Pırıl'ın kurtarması: patilerine tutunmuş, sallanarak yavaşça iner
  if (P.fade > 0 && !P.respawned) P.a_carryT = 9;
  P.a_carryT += dt;
  let carry = P.a_carryT < FZ_CARRY;
  if (carry && P.fade <= 0 && (sp > 30 || vy < -100)) { P.a_carryT = 9; carry = false; }
  const gr = P.ground && P.fade <= 0 && !carry;
  // olaylar: yere iniş, kalkış, kayma (ters yöne dönerken)
  if (gr && !P.a_wasG) {
    P.a_landT = 0; P.a_landP = P.a_wasCarry ? 0.34 : clamp(P.a_prevVy / 850, 0.18, 0.88) * (1 - 0.22 * clamp((sp - 120) / 130, 0, 1));   // koşarak inişte daha az çöker
    if (fzMover()) P.a_balKick = 1;
    if (P.a_fromL) { P.a_tadaT = 0; P.a_fromL = false; }
    if (!P.a_wasCarry) { P.a_pose[FZ_I_AIR] = Math.min(P.a_pose[FZ_I_AIR], 0.15); P.a_pv[FZ_I_AIR] = Math.min(P.a_pv[FZ_I_AIR], 0); }   // ayak yere değince kalça hemen yere göre (iniş yumuşak ama gecikmesiz)
    if (!P.a_wasCarry) fzAdim(sp, true);   // parmak ucuyla yumuşak iniş
  }
  if (!gr && P.a_wasG && vy < -300 && P.a_launch <= 0 && P.a_stomp <= 0) { P.a_take = 1; P.a_takeP = clamp(-vy / 730, 0.5, 1.25); if (fzSenlik67()) P.a_j6++; }   // ne kadar hızlı kalkarsa o kadar uzar
  P.a_wasG = gr; P.a_prevVy = vy; P.a_wasCarry = carry;
  P.a_landT += dt; P.a_tadaT += dt; P.a_take = Math.max(0, P.a_take - dt / 0.18);
  if (gr) { P.a_launch = 0; P.a_stomp = 0; }
  P.a_launch = Math.max(0, P.a_launch - dt / (P.a_launchBig ? 1.05 : 0.8));
  P.a_stomp = Math.max(0, P.a_stomp - dt / 0.55);
  P.a_push = Math.max(0, P.a_push - dt); P.a_bump = Math.max(0, P.a_bump - dt / 0.3);
  P.a_balKick = Math.max(0, P.a_balKick - dt / 1.1);
  P.a_cheerT += dt;
  const cheer = P.a_cheerT < 1.9 && P.a_cheerO;
  if (P.a_tadaT < 1.1 && (!gr || (sp > 60 && (P.a_tadaT > 0.14 || (typeof axis !== 'undefined' && axis !== 0))) || cheer)) P.a_tadaT = 9;   // koşmaya devam ederse ta-da yok (inişteki kısa kayma sayılmaz)   // koşmaya devam ederse ta-da yok
  if (P.a_tadaT < 1.1 && fzFinal()) P.a_tadaT = 9;   // finalde "ta-da" yok: önce ağaca hayranlık
  const tada = P.a_tadaT < 1.1;
  // final kutlaması: bu karede ne yapılacak (fk: 1 hayranlık, 2 kollar havada, 3 dans, 4 el sallama, 5 yaprağa uzanma)
  const fin = gr && sp < 5 && fzFinal();
  let fk = 0, fb = 0, fbu = 0, fbt = 0, fFt = 0, fFront = false;
  const FB = BOLUM_NO === 8 || BOLUM_NO === 9 || BOLUM_NO === 11 ? 2.0 : FZ_BAR, FBT = BOLUM_NO === 8 || BOLUM_NO === 9 || BOLUM_NO === 11 ? 0.5 : FZ_BEAT;   // (Bölüm 9 şöleni de 120 BPM)   // ölçü ve vuruş (Bölüm 8: 120 BPM, vuruş 0,5 sn, ölçü 2 sn)
  if (fin) {
    P.a_finT += dt; P.a_finClk += dt;
    const pf = typeof pfFinal !== 'undefined' && pfFinal ? pfFinal : null, av6 = fzSenlik6() ? fzSenlikAvlu() : fzKuzey7() ? fzKuzeyTepe() : fzCadi8() ? fz8Meydan() : fzEjder9() ? fz9Yuva() : fzBalo11() ? fz11Balo() : null;
    if (av6) P.a_finClk = av6.age;   // Bölüm 6 (ve 7): saat doğrudan şenliğin müziği (vuruş 0,6 sn, ölçü 2,4 sn); havada geçen süre kaymaz
    else if (pf && typeof pf.t === 'number') {   // Pofuduk'ların (müziğin) ölçüsüne otur: dans başlayana dek tam, sonra küçük düzeltmeler
      let d = (pf.t - (pf.faz || 0) - P.a_finClk) % FZ_BAR;
      if (d > FZ_BAR / 2) d -= FZ_BAR; else if (d < -FZ_BAR / 2) d += FZ_BAR;
      P.a_finClk += P.a_finBar0 < 0 ? d : clamp(d, -0.01, 0.01);
    }
    const ct = P.a_finT, clk = P.a_finClk, bar = Math.floor(clk / FB);
    if (P.a_finBar0 < 0 && ct >= 2.3) P.a_finBar0 = bar + 1;
    fbt = clk - bar * FB; fb = Math.min(3, Math.floor(fbt / FBT)); fbu = fbt / FBT - fb;
    if (ct < 1.5) fk = 1;
    else if (P.a_finBar0 < 0 || bar < P.a_finBar0) fk = 2;
    else {
      if (bar !== P.a_finBar) {   // yeni ölçü: ne yapılacak, hangi yöne
        P.a_finBar = bar;
        let kd = fzSenlik67() ? (fzCadi8() ? FZ_FIN_SEQ8[(bar - P.a_finBar0) % FZ_FIN_SEQ8.length] : FZ_FIN_SEQ6[(bar - P.a_finBar0) % FZ_FIN_SEQ6.length]) : FZ_FIN_SEQ[(bar - P.a_finBar0) % FZ_FIN_SEQ.length];
        if (fzSenlik6()) { const av = fzSenlikAvlu(); if (av && av.age >= 23.8 && av.age < 31) kd = 3; }   // doruk (25. sn) ölçüsünden itibaren: kollar havada
        else if (fzKuzey7()) { const tp = fzKuzeyTepe(); if (tp && tp.doruk) kd = 3; }   // Bölüm 7 doruk: kuzey ışıkları en parlak
        else if (fzCadi8()) { const my = fz8Meydan(); if (my && my.doruk) kd = 3; }   // Bölüm 8 doruk (28. sn): havai fişekler, kollar havada
        else if (fzEjder9()) { const y9 = fz9Yuva(); if (y9 && y9.doruk) kd = 3; }
        else if (fzBalo11()) { const b11 = fz11Balo(); if (b11 && (b11.doruk || b11.age >= 30.5)) kd = b11.age >= 32.5 ? 1 : 3; }   // Bölüm 11: doruk kollar havada, sonda el sallama   // Bölüm 9 doruk (28. sn): Kalp parlar, gökte ışık halkaları
        const pdx = D.x - P.x, pdy = D.y - (P.y - 60);
        if (kd === 1 && pdx * pdx + pdy * pdy > 240 * 240) kd = 0;   // Pırıl uzaktaysa dans
        P.a_finKind = kd; P.a_finDir = P.a_turnU < 1 ? P.a_turnTo : P.a_side;
        if (kd === 1) P.a_finHand = pdx * P.a_finDir >= 0 ? 1 : 0;
        if (kd === 2) {   // en yakın düşen yaprak (başının üstünde, önünde)
          P.a_finPet = -1; let best = 1e9;
          for (let i = 0; i < 13; i++) if (fzPetal(i, FZ_PET) && fzPetOk(FZ_PET)) {
            const dx = FZ_PET[0] - P.x, dy = FZ_PET[1] - (P.y - 110), d2 = dx * dx + dy * dy;
            if (d2 < best) { best = d2; P.a_finPet = i; }
          }
          fzFinPetal(FZ_PET, 0);
          if (Math.abs(FZ_PET[0] - P.x) > 10) P.a_finDir = FZ_PET[0] > P.x ? 1 : -1;
        }
      }
      const kd = P.a_finKind;
      fk = kd === 0 ? 3 : kd === 1 ? 4 : kd === 2 ? 5 : kd === 4 ? 6 : 2;   // 6: Bölüm 8 kostüm gösterisi
    }
    if (fk === 1) { const hx = typeof TREE !== 'undefined' && TREE ? TREE.x : ((fzCadi8() ? fz8Meydan() : fzEjder9() ? fz9Yuva() : fzBalo11() ? fz11Balo() : fzSenlikAvlu()) || {}).x; if (Number.isFinite(hx) && Math.abs(hx - P.x) > 14) fFt = hx > P.x ? 1 : -1; }
    else if (fk === 2 || fk === 4 || fk === 6) fFront = true;
    else if (fk === 3) { if (fb === 2) fFront = true; else fFt = fb === 3 ? -P.a_finDir : P.a_finDir; }
    else if (fk === 5) fFt = P.a_finDir;
  }
  if (gr && sp > 75 && Math.sign(P.vx) !== P.f) {
    if (P.a_skid <= 0) {
      P.a_skidDir = Math.sign(P.vx); P.a_skid = 0.16;
      if (typeof burst === 'function') burst(P.x - P.a_skidDir * 6, P.y - 2, 6, ['#ffffff', '#ffe8a0', '#d8ccff', '#bfe3ff'], 70, 0.55, 6);
    }
  } else P.a_skid = gr ? P.a_skid - dt : 0;
  if (gr && P.a_skid > 0 && Math.random() < dt * 20 && typeof burst === 'function') {
    burst(P.x - (P.a_skidDir || 1) * 8, P.y - 2, 1, ['#ffeeb5', '#ffffff'], 35, 0.35, 4);
  }
  // bekleme: el sallama, esneme, gerinme, oturma...
  const mover = gr && fzMover();
  const still = gr && sp < 5 && !P.flip && P.a_push <= 0;
  if (still && P.a_state === 'run' && (P.a_spPrev > 130 || sp > 100)) P.a_pant = 1;
  P.a_pant = Math.max(0, (P.a_pant || 0) - dt * 0.38);
  P.a_idle = still ? P.a_idle + dt : 0;
  const edge = still && !mover && !fin ? fzEdge() : 0;
  P.a_edgeT = edge ? P.a_edgeT + dt : 0;
  if (edge) P.a_edge = edge;
  const oops = edge && ((P.a_edgeT - 0.25) % 8) > 0 && ((P.a_edgeT - 0.25) % 8) < 1.9;
  P.a_getup = Math.max(0, P.a_getup - dt);
  if (!still || fin) { if (P.a_sit > 0.5) P.a_getup = 0.5; P.a_act = ''; P.a_seq = 0; P.a_nextAct = FZ_SEQ[0][0]; P.a_sit = 0; P.a_ledge = 0; }
  else if (!P.a_act && !cheer && !oops && !tada && P.a_idle >= P.a_nextAct) {
    let a;
    if (P.a_seq < FZ_SEQ.length) { a = FZ_SEQ[P.a_seq++][1]; P.a_nextAct = P.a_seq < FZ_SEQ.length ? FZ_SEQ[P.a_seq][0] : P.a_idle + 7; }
    else { a = FZ_RAND_ACT[Math.floor(Math.random() * FZ_RAND_ACT.length)]; P.a_nextAct = P.a_idle + 6 + Math.random() * 4; }
    if (!P.a_sit && !edge && a !== 'wave' && a !== 'sit' && Math.random() < 0.4 && typeof BOLUM_NO !== 'undefined') a = BOLUM_NO === 3 ? 'pat' : BOLUM_NO === 2 ? 'yansima' : 'toz';   // bölüme göre: bulutu okşar / sudaki yıldız yansımasına bakar / ışık tozu yakalar
    if (edge && !P.a_sit && a !== 'wave') a = 'sit';              // uçurum kenarında bir süre: kenara oturup ayaklarını sallar
    if (P.a_ledge && (a === 'stretch' || a === 'yawn')) a = 'nod';  // kenarda otururken önden poz yok
    if (P.a_sit && (a === 'sway' || a === 'peek')) a = 'look';
    if (a === 'sit' && P.a_sit) a = 'look';
    if (a === 'nod' && !P.a_sit) a = 'look';
    if (a === 'sit') { P.a_sit = 0.001; P.a_ledge = edge ? Math.sign(edge) : 0; } else { P.a_act = a; P.a_actT = 0; }
    if (a === 'wave') P.a_waveDir = P.a_sit > 0 ? P.a_side : Math.sign(D.x - P.x) || P.f;   // otururken dönmez (kalça kayardı)
  }
  if (P.a_act) { P.a_actT += dt; if (P.a_actT > FZ_ACT[P.a_act]) P.a_act = ''; }
  if (P.a_sit > 0) P.a_sit += dt;
  const act = still ? P.a_act : '';
  if (BOLUM_NO === 8 || BOLUM_NO === 11) {   // Bölüm 8 (ve 11 pelerin) zamanlayıcıları: kostüm sevinci (havadaysa inişi bekler), kapı tık tık (P.kapiCal = sn da olur), dinleme, sepet sekmesi
    const D8 = FZ8D;
    D8.donT = !gr && D8.donT < 0.05 ? 0 : D8.donT + dt; D8.tapT += dt; D8.kapiT += dt; D8.hopT += dt; D8.flapT += dt; D8.dinT = Math.max(0, D8.dinT - dt);
    if (P.kapiCal > 0) { P.kapiCal -= dt; D8.calT -= dt; if (D8.calT <= 0) { D8.calT = 0.3; fz8Tak(); } } else D8.calT = 0.12;
    D8.kapiW += ((D8.kapiT < 0.75 ? 1 : 0) - D8.kapiW) * (1 - Math.exp(-dt * 14));
    if (fin || P.ucus) { D8.donT = Math.max(D8.donT, 9); D8.kapiW = 0; D8.hopT = 9; }
  }
  // yön: dönüşte genişlik sıfırdan geçerek yumuşak çevrilir
  let ft = P.f, ft8 = 0;
  if (fin) {   // finalde yön kutlamadan; önden görünüşten öbür yana geçiş = önden geçen küçük bir dönüş (yeniden yandan başlamaz)
    ft = fFt || (P.a_turnU < 1 ? P.a_turnTo : P.a_side);
    if (ft !== P.a_side && P.a_turnU >= 1 && P.a_fu > 0) { P.a_turnU = P.a_fu <= 0.5 ? P.a_fu : 1 - P.a_fu; P.a_turnTo = ft; P.a_turnDur = 0.24; P.a_fu = 0; }
  }
  else if ((BOLUM_NO === 8 || BOLUM_NO === 11) && (ft8 = fz8Yon(still)) !== 0) ft = ft8;   // Bölüm 8: kostüm sevincinde dönüş, kapıya bakış
  else if (P.a_skid > 0) ft = P.a_skidDir;
  else if (P.a_ledge && P.a_sit > 0) ft = P.a_ledge;
  else if (act === 'wave') ft = P.a_waveDir;
  else if (still && cheer && Math.abs(P.a_cheerO.x - P.x) > 14) ft = P.a_cheerDir;
  if (P.a_turnU >= 1 && ft !== P.a_side) {
    P.a_turnU = 0; P.a_turnTo = ft; P.a_turnDur = sp > 60 || !gr ? 0.1 : 0.16;
    if (gr && sp > 40 && typeof burst === 'function') burst(P.x - ft * 6, P.y - 2, 4, ['#fff8d0', '#ffd880', '#e0d0ff', '#ffffff'], 65, 0.45, 6);
  }
  else if (P.a_turnU < 1 && ft !== P.a_turnTo) { P.a_turnTo = ft; P.a_turnU = 1 - P.a_turnU; }   // yarıda vazgeçti
  if (P.a_turnU < 1) {
    P.a_turnU = Math.min(1, P.a_turnU + dt / P.a_turnDur);
    if (P.a_turnU >= 0.5 && P.a_side !== P.a_turnTo) {   // ayna çevirme (önden görünüşün içinde, görünmez)
      P.a_side = P.a_turnTo; P.a_pose[FZ_I_GX] = -P.a_pose[FZ_I_GX]; P.a_pv[FZ_I_GX] = -P.a_pv[FZ_I_GX]; P.a_hx = -P.a_hx; P.a_hvx = -P.a_hvx;
    }
  }
  P.a_face = P.a_side;
  const sd = P.a_side;
  // kameraya bakma: aynı geçiş (önce gözler, kısa daralma, önden görünüş; dönüşte geri)
  if (P.a_turnU < 1) P.a_fu = 0;
  else if (P.a_front) { if (P.a_fu > 0.5) P.a_fu = 1 - P.a_fu; if (P.a_fu < 0.5) P.a_fu = Math.min(0.5, P.a_fu + dt / 0.16); }   // çıkarken yeniden istenirse geri döner
  else if (P.a_fu > 0) { P.a_fu += (P.a_fu < 0.3 ? -1 : 1) * dt / 0.16; if (P.a_fu >= 1 || P.a_fu <= 0) P.a_fu = 0; }
  const lvx = P.vx * ft;
  {   // ileri ivme (yüzün yönüne göre; yumuşatılmış): hızlanırken öne, frenlerken arkaya eğilme ve giysinin gecikmesi buradan
    const fa = (P.vx - P.a_pvx) / dt * sd; P.a_pvx = P.vx;
    P.a_ax += (clamp(fa, -3000, 3000) - P.a_ax) * (1 - Math.exp(-dt * 14));
    // fren: hızlı koşudan duruşta kısa bir "kayarak durma" duruşu
    P.a_spPrev = Math.max(sp, P.a_spPrev - 400 * dt);
    if (gr && sp <= 5 && P.a_spPrev > 90 && P.a_skid <= 0 && P.a_push <= 0 && !fin) { P.a_brk = clamp(P.a_spPrev / 250, 0.35, 1); P.a_brkT = 0; P.a_brkK = P.a_brk; P.a_spPrev = 0; if (P.a_brk > 0.75 && typeof burst === 'function') burst(P.x + P.a_side * 8, P.y - 2, 4, ['#fff8d0', '#e8dcff', '#ffffff'], 45, 0.45, 6); }
    else if (!gr || sp > 5) P.a_brk = 0;
    P.a_brk = Math.max(0, P.a_brk - dt / 0.36);
    // yere inmeye hazırlık: düşerken zemine yakınsa bacaklar uzanır, kollar dengeye açılır
    const gd = !gr && vy > 120 ? fzGDist() : 99;
    P.a_pre += ((clamp(1 - gd / 64, 0, 1) * clamp((vy - 120) / 180, 0, 1)) - P.a_pre) * (1 - Math.exp(-dt * 16));
  }
  // Pırıl'a bakış yönü (yerel)
  const gpx = clamp((D.x - P.x) * sd / 45, -1, 1), gpy = clamp((D.y - (P.y - 58)) / 45, -1, 1);
  // koşu adımı: yavaş yürüyüşte kısa adım, koşuda uzun adım (ayak kaymasın)
  const r = clamp(sp / 250, 0, 1);
  if (gr) P.a_ph += dt * 6.2832 * sp / lerp(64, 122, clamp((r - 0.45) / 0.55, 0, 1));
  {   // ayak basışı: bacak en önden geri dönmeye başlarken (her yarım döngüde bir ayak)
    const n = Math.floor((P.a_ph - 1.75) / Math.PI);
    if (n !== P.a_stepN) { P.a_stepN = n; if (gr && sp > 5 && P.a_skid <= 0) fzAdim(sp, false); }
  }
  // durum
  let st;
  const cirp8 = FZ8D.flapT < 0.55 && (BOLUM_NO === 8 ? fz8V8Kos() === 'yarasa' : BOLUM_NO === 11 && !!fz8V8Kos());   // (Bölüm 11: pelerin kanat çırpar)   // Bölüm 8 yarasa: çift zıplamada takla yerine kanat çırpar
  if (carry) st = 'carry';
  else if (P.flip > 0 && !cirp8) st = 'flip';
  else if (!gr) st = P.a_launch > 0 ? 'launch' : P.a_stomp > 0 ? 'stomp' : vy < -170 ? 'rise' : vy < 170 ? 'apex' : 'fall';
  else if (P.a_push > 0) st = 'push';
  else if (P.a_skid > 0) st = 'skid';
  else if (sp > 5) st = 'run';
  else if (P.a_sit > 0) st = 'sit';
  else if (oops) st = 'edge';
  else st = 'idle';
  if (st !== P.a_state) { P.a_state = st; P.a_sw = 0; }
  P.a_sw += dt;
  const T = FZ_T; fzUnpack(FZ_RESTA, T);
  P.a_front = false; P.a_ikSrc = null;
  let kmax = 32, kmin = 10;
  const pant = P.a_pant || 0;
  const bRate = lerp(2.2, 3.8, pant);
  const bAmp = lerp(1.0, 1.6, pant);
  const b = Math.sin(t * bRate) * bAmp, s = Math.sin(t * 0.8);
  if (st === 'idle' || st === 'sit' || st === 'edge') {
    T.breath = b; T.hx = s * 0.45; T.lean = 0.02 + 0.018 * b - s * 0.015;
    T.shr = 0.08 * b;
    T.lt1 = 0.05 + 0.08 * Math.max(0, s); T.lt2 = -0.08 - 0.24 * Math.max(0, s);
    T.bt1 = -0.04 + 0.06 * Math.max(0, -s); T.bt2 = -0.06 - 0.22 * Math.max(0, -s);
    T.la1 = 0.12 + 0.05 * b; T.ba1 = -0.1 + 0.04 * b; T.head = -0.025 * b;
    // etrafa bakınma
    P.a_lookT -= dt;
    if (P.a_lookT <= 0) {
      const q = Math.random();
      P.a_look = P.a_idle < 1.5 ? (q < 0.5 ? 0 : 1) : q < 0.35 ? 1 : q < 0.55 ? 0 : q < 0.7 ? 2 : q < 0.8 ? 3 : q < 0.9 ? 4 : 5;
      P.a_lookT = 1.2 + Math.random() * 2.2;
    }
    const lk = act === 'look' ? 1 : P.a_look;
    if (lk === 1) { T.gx = gpx; T.gy = gpy; T.head = -gpy * 0.18 + Math.sin(t * 1.5) * 0.04; T.brow = 0.25; T.mSmile = 1; T.happy = 0.25; }
    else if (lk === 2) { T.gx = 0.3; T.gy = -0.85; T.head = -0.14; T.brow = 0.35; T.mSmile = 0.85; }
    else if (lk === 3) { T.gx = 0.5; T.gy = 0.8; T.head = 0.12; T.brow = 0.1; }
    else if (lk === 4) { T.gx = -1; T.gy = 0; T.head = 0.05; T.brow = 0.2; }
    else if (lk === 5 && st === 'idle' && !act && !cheer && P.a_turnU >= 1) { P.a_front = true; T.gx = 0; T.gy = 0; T.brow = 0.25; T.mSmile = 0.95; }   // kameraya bakar
    if (lk === 0 && !act) {   // bakışta minik sıçramalar (mikro sakkad): canlı, odaklı bir göz + hafif canlı baş kıpırtısı
      P.a_sacT -= dt;
      if (P.a_sacT <= 0) { P.a_sacT = 0.35 + Math.random() * 1.1; P.a_sacX = (Math.random() - 0.5) * 0.5; P.a_sacY = (Math.random() - 0.5) * 0.35; }
      T.gx += P.a_sacX; T.gy += P.a_sacY; T.head += P.a_sacY * 0.04;
    }
    {   // Pırıl yakında uçuşuyorsa veya omzunda/yanında duruyorsa gözler ve baş onu sevgiyle izler
      const pdx = D.x - P.x, pdy = D.y - (P.y - 58), pdist = Math.hypot(pdx, pdy);
      const pw = 0.65 * clamp(1 - pdist / 140, 0, 1) * (clamp(Math.hypot(D.vx || 0, D.vy || 0) / 100, 0, 1) * 0.5 + 0.5);
      if (pw > 0.01 && !act && lk !== 1) {
        T.gx = lerp(T.gx, gpx, pw); T.gy = lerp(T.gy, gpy, pw); T.head = lerp(T.head, -gpy * 0.15, pw);
        if (pdist < 85) { T.mSmile = lerp(T.mSmile, 1, pw); T.happy = Math.max(T.happy, 0.3 * pw); }
      }
    }
    T.mSmile = act === 'look' ? 1 : Math.max(T.mSmile, 0.78);
    if (st === 'sit') {   // oturur: önce çömelir, sonra bacaklar önde, ayaklar sallanır
      kmin = kmax = 7;
      if (P.a_ledge && P.a_sit >= 0.35) {   // uçurum kenarında: popo kenarda, bacaklar boşlukta sallanır, eller kenarı tutar
        const w = Math.sin(t * 2.6), w2 = Math.sin(t * 2.6 + 2.4);
        T.lt1 = 1.48 + 0.06 * w; T.lt2 = -1.25 + 0.4 * w; T.bt1 = 1.42 + 0.06 * w2; T.bt2 = -1.25 + 0.4 * w2;
        T.lean = -0.05 + 0.012 * b; T.hx = -1.0;
        T.la1 = -0.22; T.la2 = 0.08; T.ba1 = -0.42; T.ba2 = 0.06; T.shr = 0.35;
        T.head = (lk === 1 ? -gpy * 0.16 : 0.06) - 0.02 * b; if (lk !== 1 && lk !== 2) { T.gy = 0.75; T.gx = 0.6; }
        T.mSmile = 1;
      } else if (P.a_sit < 0.5) {
        T.lt1 = 1.25; T.lt2 = -2.2; T.bt1 = 1.1; T.bt2 = -2.1; T.lean = 0.22; T.hx = -1.5;
        T.la1 = 0.8; T.la2 = 0.7; T.ba1 = 0.6; T.ba2 = 0.7; T.head = 0.05;
      } else {
        const w = Math.sin(t * 2.3), w2 = Math.sin(t * 2.3 + 2.2);
        T.lt1 = 1.38 + 0.12 * w; T.lt2 = -0.18 - 0.22 * Math.max(0, w); T.bt1 = 1.3 + 0.12 * w2; T.bt2 = -0.2 - 0.22 * Math.max(0, w2);
        T.lean = -0.13 + 0.012 * b; T.hx = -4.2;
        T.la1 = 0.62; T.la2 = 0.5; T.ba1 = 0.35; T.ba2 = 0.55; T.head = -0.03 * b + (lk === 1 ? -gpy * 0.16 : 0);
      }
    } else if (st === 'edge') {   // uçurum kenarı: "eyvah" sallanması, kollar çark gibi döner
      const k = Math.abs(P.a_edge), sl = Math.sign(P.a_edge) * sd, e = (P.a_edgeT - 0.25) % 8;
      const fade = clamp(e / 0.15, 0, 1) * clamp((1.9 - e) / 0.35, 0, 1), ro = Math.sin(e * 8.5);
      kmin = kmax = 18;
      T.lean = sl * (0.08 + 0.14 * ro) * (0.5 + 0.5 * k) * fade; T.hx = sl * ro * 0.9 * fade;
      T.la1 = 1.6 + 1.5 * Math.sin(e * 13) * fade; T.la2 = 0.35; T.ba1 = 1.6 + 1.5 * Math.sin(e * 13 + 3.1) * fade; T.ba2 = 0.35; T.hOpen = 1;
      if (sl > 0) { T.lt1 = 0.25 + 0.15 * ro; T.lt2 = -0.35; } else { T.bt1 = -0.3 + 0.12 * ro; T.bt2 = -0.35; }
      T.shr = 0.5; T.mRound = 1; T.mOpen = 0.7; T.mSmile = 0.1; T.brow = 1; T.lid = 1.15; T.gx = sl; T.gy = 0.9; T.head = 0.12 * sl;
      if (e > 1.5) { T.mRound = 0; T.mOpen = 0.35; T.mSmile = 1; T.brow = 0.3; T.lid = 0.8; }   // oh, kurtuldum
    }
    P.a_brkT += dt;
    if (P.a_brkT < 1.1 && st === 'idle' && !act && P.a_brk <= 0.01) {   // frenden sonra küçük denge kaybı: gövde öne sallanır, kollar çırpar, sonra oturur
      const u = P.a_brkT - 0.26, k = P.a_brkK * Math.exp(-u * 3.6) * smooth(clamp(u / 0.06, 0, 1)), wv = Math.sin(u * 12);
      T.lean += 0.2 * k * Math.max(wv, -0.4); T.hx += 1.0 * k * wv; T.la1 += 1.1 * k * (0.7 + wv); T.ba1 -= 1.0 * k * (0.7 - wv); T.hOpen = Math.max(T.hOpen, k);
      T.lt1 += 0.12 * k * Math.max(0, wv); T.mRound = lerp(T.mRound, 0.6, k); T.mOpen = lerp(T.mOpen, 0.45, k); T.brow = lerp(T.brow, 0.6, k); kmin = kmax = 20;
    }
    if (P.a_brk > 0.01 && st === 'idle' && !act) {   // koşudan duruş: kısa süre geri yaslanıp ön ayak uzanır, kollar dengeler
      const bk = smooth(clamp(P.a_brk * 1.6, 0, 1)); kmin = kmax = 20;
      T.lean = lerp(T.lean, -0.1, bk); T.hx = lerp(T.hx, -0.7, bk); T.head = lerp(T.head, 0.04, bk);
      T.lt1 = lerp(T.lt1, 0.34, bk); T.lt2 = lerp(T.lt2, -0.12, bk); T.bt1 = lerp(T.bt1, -0.2, bk); T.bt2 = lerp(T.bt2, -0.3, bk);
      T.la1 = lerp(T.la1, 0.85, bk); T.la2 = lerp(T.la2, 0.5, bk); T.ba1 = lerp(T.ba1, -0.55, bk); T.ba2 = lerp(T.ba2, 0.45, bk);
      T.mOpen = lerp(T.mOpen, 0.3, bk); T.mSmile = 1;
    }
    // bekleme hareketleri
    const at = P.a_actT;
    if (act === 'wave') {   // Pırıl'a dönüp el sallar
      T.shr = 0.6; T.la1 = 1.65; T.la2 = 0.75 + 0.4 * Math.sin(t * 11); if (st !== 'sit') T.lean = -0.06;
      T.gx = gpx; T.gy = gpy; T.head = -0.12 - gpy * 0.1; T.mOpen = 0.6; T.hOpen = 1; T.mSmile = 1; T.brow = 0.4;
    } else if (act === 'yawn') {   // esneme: baş geride, ağız kocaman açık; sonunda el ağza pat pat
      const w = smooth(clamp(at / 0.45, 0, 1)) * smooth(clamp((2.7 - at) / 0.6, 0, 1));
      const big = smooth(clamp((at - 0.25) / 0.4, 0, 1)) * smooth(clamp((1.95 - at) / 0.45, 0, 1));
      const hand = smooth(clamp((at - 1.25) / 0.3, 0, 1)) * smooth(clamp((2.35 - at) / 0.3, 0, 1)), fold = smooth(clamp((at - 1.15) / 0.2, 0, 1)) * smooth(clamp((2.5 - at) / 0.25, 0, 1));
      const pat = hand * Math.max(0, Math.sin((at - 1.55) * 15)) * (at > 1.55 && at < 2.15 ? 1 : 0);
      kmin = kmax = 12;
      T.head = lerp(T.head, -0.32, big * (1 - 0.5 * hand)); T.lean = lerp(T.lean, -0.06, big); T.shr = 0.8 * big;
      T.mRound = big; T.mOpen = lerp(0.1, 1.15, big); T.mSmile = lerp(0.6, 0, big); T.lid = lerp(1, 0.05, w); T.brow = 0.7 * big;
      T.ba1 = lerp(T.ba1, -0.75, big); T.ba2 = lerp(T.ba2, 0.7, big);
      T.la2 = lerp(T.la2, 2.1, fold) - 0.6 * hand; T.la1 = lerp(T.la1, 1.62 - 0.12 * pat, hand); T.hOpen = hand;
      if (at > 2.0) { T.lid = lerp(T.lid, 0.6, w); T.mSmile = 0.5; }
    } else if (act === 'stretch') {   // gerinme: kollar havada, parmak ucunda
      const w = clamp(at / 0.55, 0, 1) * clamp((2.5 - at) / 0.6, 0, 1), ws = smooth(w);
      kmin = kmax = 9;
      // önden: kollar yukarıda V, yumruklar sıkılı, gözler kapalı
      if (P.a_turnU >= 1 && at < 2.35) { P.a_front = true; P.a_ikSrc = FZ_GER_IK; }
      const up = smooth(clamp((at - 0.12) / 0.5, 0, 1)) * smooth(clamp((2.3 - at) / 0.5, 0, 1)), wig = Math.sin(at * 9) * 0.5 * up;
      FZ_GER_IK[0][0] = -lerp(7.6, 12.8, up) - wig; FZ_GER_IK[1][0] = lerp(7.6, 12.8, up) + wig;
      FZ_GER_IK[0][1] = FZ_GER_IK[1][1] = lerp(0.8, -26.5, up); T.arm = lerp(1, 1.27, up);
      T.la1 = 0.2; T.ba1 = 0.1; T.lean = lerp(T.lean, -0.1, ws); T.head = lerp(T.head, -0.22, ws); T.shr = 0.8 * ws;
      T.happy = ws; T.mOpen = 0.55 * ws; T.mRound = 0.5 * ws; T.sy = 1 + 0.035 * ws; T.sx = 1 - 0.02 * ws;
      if (st !== 'sit') { T.bob = -1.6 * ws; T.lt1 = lerp(T.lt1, 0.04, ws); T.bt1 = lerp(T.bt1, -0.04, ws); T.lt2 = lerp(T.lt2, -0.02, ws); T.bt2 = lerp(T.bt2, -0.02, ws); }
    } else if (act === 'sway') {   // içinden şarkı mırıldanır: yavaşça yana sallanır, gözler yarı kapalı gülümser, kollar hafif savrulur
      const w = smooth(clamp(at / 0.5, 0, 1)) * smooth(clamp((3.4 - at) / 0.5, 0, 1)), sw = Math.sin(at * 3.6);
      kmin = kmax = 9;
      T.hx = 1.1 * sw * w; T.lean = lerp(T.lean, 0.03 * sw, w); T.head = 0.07 * sw * w; T.bob = -0.5 * Math.abs(Math.cos(at * 3.6)) * w;
      T.lt1 += 0.1 * sw * w; T.bt1 -= 0.1 * sw * w; T.la1 = lerp(T.la1, 0.3 + 0.3 * sw, w); T.ba1 = lerp(T.ba1, -0.1 - 0.3 * sw, w);
      T.lid = lerp(1, 0.55, w); T.mSmile = 1; T.mOpen = 0.2 * w; T.brow = 0.2 * w; T.gx = 0.6; T.gy = 0.5;
    } else if (act === 'peek') {   // öne eğilip merakla uzaklara bakar
      const w = smooth(clamp(at / 0.45, 0, 1)) * smooth(clamp((2.8 - at) / 0.45, 0, 1)), pk = Math.sin(at * 2.2);
      kmin = kmax = 12;
      T.la1 = lerp(T.la1, 0.55, w); T.la2 = lerp(T.la2, 1.1, w); T.ba1 = lerp(T.ba1, -0.5, w); T.shr = 0.3 * w;   // eller belde, öne eğilip merakla bakar
      T.lean = lerp(T.lean, 0.1, w); T.head = lerp(T.head, -0.1, w); T.gx = lerp(T.gx, 1, w); T.gy = lerp(T.gy, -0.1, w);
      T.lid = lerp(1, 0.85, w); T.brow = 0.5 * w; T.mRound = 0.4 * w; T.mOpen = 0.25 * w; T.mSmile = 0.6; T.hx += 0.4 * pk * w;
    } else if (act === 'toz') {   // Bölüm 1: süzülen bir ışık tozunu gözüyle izler, uzanıp sekerek yakalar, avucunun içine bakar, açınca sevinir
      const w = smooth(clamp(at / 0.35, 0, 1)) * smooth(clamp((3.4 - at) / 0.4, 0, 1));
      const ex = Math.sin(at * 2.1) * 0.6 + 0.3, ey = -0.6 - 0.3 * Math.sin(at * 1.3);   // tozun bakıştaki yeri
      const rch = smooth(clamp((at - 1.15) / 0.25, 0, 1)) * smooth(clamp((1.85 - at) / 0.2, 0, 1)), hop = Math.sin(clamp((at - 1.25) / 0.45, 0, 1) * Math.PI);
      const cup = smooth(clamp((at - 1.75) / 0.2, 0, 1)) * smooth(clamp((3.0 - at) / 0.25, 0, 1)), opn = smooth(clamp((at - 2.55) / 0.2, 0, 1));
      kmin = kmax = 16;
      if (at < 1.2) { T.gx = lerp(T.gx, ex, w); T.gy = lerp(T.gy, ey, w); T.head = lerp(T.head, -0.2 - 0.06 * Math.sin(at * 1.3), w); T.mRound = 0.5 * w; T.mOpen = 0.35 * w; T.brow = 0.6 * w; }
      T.la1 = lerp(T.la1, 2.05, rch); T.la2 = lerp(T.la2, 0.2, rch); T.ba1 = lerp(T.ba1, 1.9, rch); T.hOpen = Math.max(T.hOpen * (1 - cup), rch); T.arm = lerp(1, 1.12, rch);
      T.bob -= 3.5 * hop; T.lt1 += 0.35 * hop; T.lt2 -= 0.6 * hop; T.bt2 -= 0.5 * hop; if (rch > 0.3) { T.gx = 0.6; T.gy = -0.9; T.head = -0.24; T.mOpen = 0.5; T.mRound = 0.3; }
      T.la1 = lerp(T.la1, 0.62, cup); T.la2 = lerp(T.la2, 1.3 - 0.5 * opn, cup); T.ba1 = lerp(T.ba1, 0.58, cup); T.ba2 = lerp(T.ba2, 1.35 - 0.5 * opn, cup);
      if (at < 1.2) T.head = lerp(T.head, -0.12 + 0.1 * Math.sin(at * 2.1), w);   // başıyla da izler
      if (cup > 0.3) { T.head = lerp(T.head, 0.4, cup); T.gx = 0.8; T.gy = 0.95; T.lean = lerp(T.lean, 0.08, cup); T.mRound = 0.6 * (1 - opn); T.mOpen = 0.35 + 0.35 * opn; T.mSmile = lerp(0.6, 1, opn); T.happy = opn > 0.5 ? 1 : 0; T.hOpen = opn; }
    } else if (act === 'yansima') {   // Bölüm 2: öne eğilip ellerini dizlerine koyar, aşağıda sudaki yıldızların yansımasına bakar, gülümser, el sallar
      const w = smooth(clamp(at / 0.45, 0, 1)) * smooth(clamp((3.0 - at) / 0.45, 0, 1)), wv = at > 1.7 && at < 2.5 ? Math.sin(at * 11) : 0;
      kmin = kmax = 11;
      T.lean = lerp(T.lean, 0.32, w); T.hx = lerp(T.hx, -1.0, w); T.head = lerp(T.head, 0.3, w);
      T.lt1 = lerp(T.lt1, 0.35, w); T.lt2 = lerp(T.lt2, -0.55, w); T.bt1 = lerp(T.bt1, 0.2, w); T.bt2 = lerp(T.bt2, -0.5, w);
      T.la1 = lerp(T.la1, at > 1.6 && at < 2.6 ? 1.0 : 0.62, w); T.la2 = lerp(T.la2, at > 1.6 && at < 2.6 ? 0.45 + 0.3 * wv : 0.55, w); T.ba1 = lerp(T.ba1, 0.55, w); T.ba2 = lerp(T.ba2, 0.6, w); T.hOpen = at > 1.6 && at < 2.6 ? w : 0;
      T.gx = lerp(T.gx, 0.7, w); T.gy = lerp(T.gy, 1, w); T.mRound = at < 1.3 ? 0.55 * w : 0; T.mOpen = 0.4 * w; T.mSmile = at < 1.3 ? 0.6 : 1; T.brow = 0.55 * w; T.lid = lerp(T.lid, 1.08, w);
      if (at > 2.2 && at < 2.7) T.happy = 1;
    } else if (act === 'pat') {   // Bölüm 3: çömelip yumuşacık bulut zemini iki eliyle pıt pıt okşar, kıkırdar
      const w = smooth(clamp(at / 0.45, 0, 1)) * smooth(clamp((2.7 - at) / 0.5, 0, 1)), on = at > 0.55 && at < 2.15 ? 1 : 0;
      const p1 = Math.max(0, Math.sin(at * 12)) * on, p2 = Math.max(0, Math.sin(at * 12 + 2.2)) * on;
      kmin = kmax = 12;
      T.lean = lerp(T.lean, 0.62, w); T.hx = lerp(T.hx, -1.8, w); T.bob = 0;
      T.lt1 = lerp(T.lt1, 1.3, w); T.lt2 = lerp(T.lt2, -2.15, w); T.bt1 = lerp(T.bt1, 1.05, w); T.bt2 = lerp(T.bt2, -2.05, w);
      T.la1 = lerp(T.la1, 0.95 + 0.3 * p1, w); T.la2 = lerp(T.la2, 0.15, w); T.ba1 = lerp(T.ba1, 0.85 + 0.3 * p2, w); T.ba2 = lerp(T.ba2, 0.2, w); T.hOpen = w; T.arm = lerp(1, 1.12, w);
      T.head = lerp(T.head, -0.3, w); T.gx = lerp(T.gx, 0.7, w); T.gy = lerp(T.gy, 0.95, w); T.shr = lerp(T.shr, 0.3, w);
      T.happy = at > 0.9 && at < 2.05 ? 1 : 0; T.mSmile = 1; T.mOpen = lerp(T.mOpen, 0.35 + 0.25 * Math.max(p1, p2), w); T.brow = 0.35 * w;
    } else if (act === 'nod') {   // uykulu baş düşmesi (otururken), sonra silkinip uyanır
      const w = clamp(at / 1.2, 0, 1), up = clamp((at - 2.3) / 0.25, 0, 1);
      kmin = kmax = at > 2.3 ? 20 : 5;
      T.lid = lerp(lerp(1, 0.05, w), 1.15, up); T.head = lerp(0.32 * w, -0.1, up); T.lean = lerp(T.lean, 0.06, w * (1 - up));
      T.mSmile = 0.4; T.mOpen = up * 0.4; T.mRound = up; T.brow = up * 0.9;
    }
  } else if (st === 'run') {
    // yürüyüş (yavaş) ↔ koşu (hızlı) karışımı (Ori tarzı yaylanan adım ve esnek uzuvlar)
    const q = P.a_ph, sq = Math.sin(q), wr = smooth(clamp((r - 0.5) / 0.4, 0, 1));
    const ka = Math.max(0, Math.cos(q - 0.5)), kb = Math.max(0, Math.cos(q + Math.PI - 0.5));
    const amp = lerp(0.44, 0.88, wr);
    T.lt1 = sq * amp + 0.09 * wr; T.lt2 = -(lerp(0.08, 0.14, wr) + lerp(0.68, 1.48, wr) * ka);
    T.bt1 = -sq * amp + 0.09 * wr; T.bt2 = -(lerp(0.08, 0.14, wr) + lerp(0.68, 1.48, wr) * kb);
    const aa = lerp(0.32, 1.05, wr);
    // önkol, üst kolun gerisinden gelir (ikincil hareket): kamçı gibi esnek savruluş
    const fl1 = Math.sin(q - 0.72) * 0.42 * wr, fl2 = Math.sin(q + Math.PI - 0.72) * 0.42 * wr;
    T.la1 = -sq * aa + lerp(0.08, 0.12, wr) + Math.cos(q * 2) * 0.05 * wr;
    T.la2 = lerp(0.35, 1.35, wr) - fl1;
    T.ba1 = sq * aa + lerp(0.02, 0.12, wr) - Math.cos(q * 2) * 0.05 * wr;
    T.ba2 = lerp(0.35, 1.35, wr) + fl2;
    T.lean = lerp(0.04, 0.24, wr) + clamp(P.a_ax * 0.00012, -0.08, 0.08); T.hx = lerp(0.15, 0.65, wr);
    T.head = -T.lean * 0.55 + lerp(0.025, 0.05, wr) * Math.cos(2 * q);
    T.bob = -3.0 * wr * sq * sq; T.sy = 1 + 0.035 * wr * sq * sq; T.sx = 1 - 0.02 * wr * sq * sq;   // koşuda ayaklar iki adım arası yerden hafif kesilir (uçuş evresi)
    T.shr = 0.28 * wr * Math.cos(2 * q + 0.4); T.hx += 0.24 * wr * Math.sin(q);   // omuz iniş-çıkışı, kalça hafif yalpa
    T.mSmile = 1; T.mOpen = wr > 0.6 ? 0.5 * wr : 0; T.gx = lerp(0.7, 0.9, wr); T.gy = 0.1; T.brow = 0.1; T.breath = 0;
  } else if (st === 'push') {   // katı Pofuduk'u itmeye çalışır
    const q = t * 5.5, pq = Math.sin(q);
    T.lean = 0.4; T.hx = 1.4;
    T.lt1 = 0.3 + 0.2 * pq; T.lt2 = -0.6 - 0.35 * Math.max(0, Math.cos(q));
    T.bt1 = -0.55 - 0.18 * pq; T.bt2 = -0.12 - 0.35 * Math.max(0, -Math.cos(q));
    T.la1 = 1.55; T.la2 = 0.35; T.ba1 = 1.4; T.ba2 = 0.4; T.hOpen = 1; T.shr = 0.3;
    T.sq = 1; T.brow = -0.75; T.mSmile = 0.55; T.mRound = 0; T.mOpen = 0.4; T.gx = 1; T.gy = 0.1; T.head = -0.12;   // > < gözler, dişler sıkılı gülüş
  } else if (st === 'skid') {
    T.lean = -0.32; T.hx = -1.0; T.lt1 = 0.75; T.lt2 = -0.15; T.bt1 = 0.05; T.bt2 = -0.9;
    T.la1 = 1.3; T.la2 = 0.3; T.ba1 = 1.0; T.ba2 = 0.35; T.head = -0.18;
    T.mRound = 0.8; T.mOpen = 0.5; T.mSmile = 0.3; T.brow = 0.8; T.gx = 1; T.lid = 1.1;
  } else if (st === 'carry') {   // Pırıl'ın patilerine tutunmuş, bacaklar sallanır
    const cu = P.a_carryT / FZ_CARRY, sw = Math.sin(t * 5.2);
    // Peter Pan gibi: ön el ileri-yukarıda Pırıl'ın patisinde (kol çizgi film gibi esner), gövde geride,
    // arka kol neşeyle açık, bacaklar sırayla tekmeler; yere yaklaşınca Pırıl bırakır, ayaklar yere uzanır
    T.air = 1; kmin = kmax = 22;
    const dn = smooth(clamp((cu - 0.62) / 0.3, 0, 1)), sw2 = Math.sin(t * 5.2 + 1.7);
    T.arm = lerp(1.6, 1, dn); T.la1 = lerp(2.62, 0.4, dn);   // el başın önünde-üstünde: Pırıl yüzünü örtmesin
    T.la2 = lerp(0.04, 0.4, dn); T.hOpen = 0;
    T.ba1 = lerp(-1.05 + 0.25 * Math.sin(t * 4.4), -0.1, dn); T.ba2 = lerp(0.5, 0.35, dn); T.shr = 0.6 * (1 - dn);
    T.lt1 = lerp(0.05 + 0.32 * sw, 0.06, dn); T.lt2 = lerp(-0.35 - 0.45 * Math.max(0, -sw), -0.05, dn);
    T.bt1 = lerp(-0.35 + 0.25 * sw2, -0.05, dn); T.bt2 = lerp(-0.4 - 0.45 * Math.max(0, -sw2), -0.08, dn);
    T.lean = lerp(-0.32 + 0.04 * Math.sin(t * 3.1), 0.02, dn); T.head = lerp(-0.28, 0.05, dn);
    T.gx = 1; T.gy = lerp(-0.6, 0.6, dn); T.mSmile = 1; T.mOpen = lerp(0.6, 0.3, dn); T.brow = 0.5; T.happy = cu > 0.15 && cu < 0.55 ? 1 : 0;
  } else if (st === 'launch') {   // minder / Büyük Pofuduk fırlattı: sevinçli yıldız pozu, sonra toparlanma
    const el = (1 - P.a_launch) * (P.a_launchBig ? 1.05 : 0.8), star = P.a_launchBig ? 0.42 : 0.32;
    T.air = 1; kmin = kmax = 26;
    if (el < star) {   // önden: kollar ve bacaklar iki yana açık (X)
      if (P.a_turnU >= 1) { P.a_front = true; P.a_ikSrc = FZ_STAR_IK; }
      T.spr = P.a_fu >= 0.3 ? 0.85 : 0; T.lt1 = 0.2; T.lt2 = -0.35; T.bt1 = 0.2; T.bt2 = -0.35; T.arm = 1.15;
      T.la1 = 2.3; T.la2 = 0.1; T.ba1 = -2.2; T.ba2 = 0; T.hOpen = 1; T.shr = 0.7;
      T.lean = 0; T.head = -0.1; T.happy = 1; T.mOpen = 0.75; T.mSmile = 1; T.brow = 0.6; T.sy = 1.04; T.sx = 0.97; T.gx = 0;
    } else {
      T.lt1 = 2.0; T.lt2 = -2.4; T.bt1 = 1.8; T.bt2 = -2.3;
      T.la1 = 0.7; T.la2 = 0.5; T.ba1 = 0.55; T.ba2 = 0.6; T.lean = 0.2; T.head = 0.2;
      T.happy = 1; T.mOpen = 0.8; T.mSmile = 1; T.brow = 0.3;
    }
  } else if (st === 'stomp') {   // uyuyan Pofuduk'un üstüne bastı: mutlu sekme
    T.air = 1; kmin = kmax = 26;
    T.lt1 = 1.35; T.lt2 = -2.0; T.bt1 = 1.0; T.bt2 = -1.9;
    T.arm = 1.15; T.la1 = 1.9; T.la2 = 0.45; T.ba1 = 1.75; T.ba2 = 0.4; T.hOpen = 1; T.shr = 0.6;
    T.lean = 0.05; T.head = 0.1; T.happy = 1; T.mOpen = 0.9; T.mSmile = 1; T.brow = 0.5; T.gy = 0.6;
  } else if (st === 'rise') {
    T.air = 1; T.lt1 = 1.35; T.lt2 = -1.95; T.bt1 = -0.2; T.bt2 = -0.6;
    T.la1 = -2.15; T.la2 = 0.3; T.hOpen = 1; T.ba1 = 1.2; T.ba2 = 0.35; T.shr = 0.8; T.lean = -0.04; T.head = -0.12;
    T.mOpen = 0.75; T.mSmile = 1; T.gx = 0.6; T.gy = -0.5; T.brow = 0.4; T.lid = 1.05;
    { const w1 = Math.sin(t * 7.5), w2 = Math.sin(t * 7.5 + 2.1); T.la1 += 0.16 * w1; T.ba1 += 0.14 * w2; T.lt2 -= 0.12 * w2; T.bt1 += 0.12 * w1; T.lean += clamp(vy / 1400, -0.5, 0.5) * 0.18; }
  } else if (st === 'apex') {
    T.air = 1; T.lt1 = 1.0; T.lt2 = -1.5; T.bt1 = 0.25; T.bt2 = -0.9;
    T.la1 = -2.05; T.la2 = 0.4; T.ba1 = 1.25; T.ba2 = 0.45; T.shr = 0.5; T.lean = 0; T.head = -0.05;
    T.mOpen = 0.5; T.mSmile = 1; T.gx = 0.6; T.gy = 0.3; T.brow = 0.3;
    { const w1 = Math.sin(t * 5.2), w2 = Math.sin(t * 5.2 + 2.3);   // tepede süzülürken kollar ve bacaklar yumuşakça salınır
      T.la1 += 0.26 * w1; T.la2 += 0.15 * w2; T.ba1 += 0.22 * w2; T.lt1 += 0.18 * w2; T.lt2 -= 0.1 * w1; T.bt1 += 0.2 * w1; T.lean += clamp(vy / 600, -0.5, 0.5) * 0.14; T.head += 0.05 * w1; }
  } else if (st === 'fall') {
    const f = clamp((vy - 170) / 600, 0.3, 1);
    T.air = 1; T.lt1 = 0.3 + 0.12 * Math.sin(t * 9); T.lt2 = -0.5; T.bt1 = -0.12 - 0.1 * Math.sin(t * 9 + 1); T.bt2 = -0.35;
    T.hOpen = 1; T.la1 = -2.15 + 0.3 * Math.sin(t * 13) * f; T.la2 = 0.5 + 0.2 * Math.sin(t * 11);
    T.ba1 = 1.35 + 0.2 * Math.sin(t * 13 + 2) * f; T.ba2 = 0.3; T.shr = 0.5;
    T.lean = 0.05; T.head = -0.04; T.mRound = 0.3 + 0.45 * f; T.mOpen = 0.62; T.mSmile = 0.95 - 0.35 * f;   // korku değil "vuuu!" heyecanı: ağız açık, gülümseme kalır
    T.brow = 0.3 + 0.35 * f; T.lid = 1.12; T.gx = 0.5; T.gy = 0.7;
    const pw = smooth(P.a_pre);   // inişe hazırlık: bacaklar yere uzanır, kollar yana açılır, yüz sakinleşir
    if (pw > 0.01) {
      T.lt1 = lerp(T.lt1, 0.3, pw); T.lt2 = lerp(T.lt2, -0.2, pw); T.bt1 = lerp(T.bt1, -0.22, pw); T.bt2 = lerp(T.bt2, -0.2, pw);
      T.la1 = lerp(T.la1, 1.15, pw); T.la2 = lerp(T.la2, 0.3, pw); T.ba1 = lerp(T.ba1, -0.95, pw); T.ba2 = lerp(T.ba2, 0.3, pw);
      T.lean = lerp(T.lean, 0.1, pw); T.head = lerp(T.head, 0.05, pw); T.shr = lerp(T.shr, 0.2, pw);
      T.mRound = lerp(T.mRound, 0, pw); T.mOpen = lerp(T.mOpen, 0.35, pw); T.mSmile = lerp(T.mSmile, 0.9, pw); T.brow = lerp(T.brow, 0.15, pw); T.gy = lerp(T.gy, 0.9, pw);
    }
  } else {   // flip: Pırıl iter, toparlanıp ileri takla
    T.air = 1; T.lt1 = 2.05; T.lt2 = -2.45; T.bt1 = 1.85; T.bt2 = -2.35;
    T.la1 = 0.7; T.la2 = 0.5; T.ba1 = 0.55; T.ba2 = 0.6; T.lean = 0.25; T.head = 0.3;
    T.happy = 1; T.mOpen = 0.9; T.mSmile = 1; T.brow = 0.3;
  }
  if (P.a_getup > 0 && gr) { kmin = kmax = 6.5; T.lean += 0.15; }   // oturduğu yerden kalkarken acele etmeden
  // Bölüm 3 esinti: yukarı taşıyan rüzgârda süzülme – kollar kanat gibi açık, yavaşça çırpar; bacaklar gevşek sallanır; saç ve etek yukarı uçuşur
  P.a_esW += ((gr ? 0 : fzEsinti()) - P.a_esW) * (1 - Math.exp(-dt * 4));
  if (P.a_esW > 0.02 && (st === 'rise' || st === 'apex' || st === 'fall')) {
    const w = smooth(clamp(P.a_esW * 1.3, 0, 1)), f1 = Math.sin(t * 3.4), f2 = Math.sin(t * 3.4 + 1.4);
    T.la1 = lerp(T.la1, 1.95 + 0.28 * f1, w); T.la2 = lerp(T.la2, 0.25 + 0.1 * f2, w); T.ba1 = lerp(T.ba1, -2.0 - 0.28 * f1, w); T.ba2 = lerp(T.ba2, 0.3, w); T.hOpen = Math.max(T.hOpen, w);
    T.lt1 = lerp(T.lt1, 0.3 + 0.22 * f2, w); T.lt2 = lerp(T.lt2, -0.55 - 0.3 * Math.max(0, f1), w); T.bt1 = lerp(T.bt1, -0.15 - 0.2 * f2, w); T.bt2 = lerp(T.bt2, -0.6 - 0.2 * Math.max(0, -f1), w);
    T.lean = lerp(T.lean, -0.03 + 0.04 * f2, w); T.head = lerp(T.head, -0.14 + 0.04 * f1, w); T.shr = lerp(T.shr, 0.35, w);
    T.mRound = lerp(T.mRound, 0, w); T.mOpen = lerp(T.mOpen, 0.7, w); T.mSmile = lerp(T.mSmile, 1, w); T.brow = lerp(T.brow, 0.5, w); T.gy = lerp(T.gy, -0.35, w); T.lid = lerp(T.lid, 1.05, w);
    if (w > 0.5 && (t % 3.2) < 1.5) T.happy = 1;
    kmin = kmax = 9;
  }
  // ── üst katmanlar ──
  // büyük şeylere hayranlıkla bakma (Büyük Pofuduk, Işık Ağacı)
  let aw = 0, agx = 0, agy = 0;
  if (gr && (st === 'idle' || st === 'run' || st === 'sit')) {
    const big = fzBig();
    for (let bi = 0; bi < big.length; bi++) {
      const o = big[bi];
      const tree = o.tip === 'agac', range = tree ? 470 : 330, d = Math.abs(o.x - P.x);
      if (d > range) continue;
      const w = smooth(clamp((range - d) / (range * 0.45), 0, 1));
      if (w > aw) {
        aw = w; const tx = (o.x - P.x) * sd, ty = (o.y - (tree ? 300 : 150)) - (P.y - 55), L = Math.hypot(tx, ty) || 1;
        agx = clamp(tx / L * 1.4, -1, 1); agy = clamp(ty / L * 2, -1, 0.2);
      }
    }
  }
  P.a_awe += (aw * (act || cheer || fin ? 0 : 1) - P.a_awe) * (1 - Math.exp(-dt * 2.5));
  if (P.a_awe > 0.01) {
    const w = P.a_awe;
    T.gx = lerp(T.gx, agx, w); T.gy = lerp(T.gy, agy, w); T.head = lerp(T.head, agy * 0.45 * Math.max(0, agx * 0.5 + 0.5), w); T.lean -= 0.06 * w * Math.max(0, -agy);
    T.mRound = lerp(T.mRound, 0.85, w); T.mOpen = lerp(T.mOpen, 0.55, w); T.mSmile = lerp(T.mSmile, 0.35, w); T.brow = lerp(T.brow, 0.85, w); T.lid = lerp(T.lid, 1.12, w);
  }
  // şaşırma: irkilip geri yaslanma + göğse el (1), geniş gözlü hayranlık (2), kısa "oo" (3); sonra gülümseyerek geçer
  P.a_sur = Math.max(0, P.a_sur - dt / P.a_surD);
  if (P.a_sur > 0 && (!gr || cheer || fin || P.a_push > 0)) P.a_sur = 0;
  if (P.a_sur > 0 && (st === 'idle' || st === 'run')) {
    const u = 1 - P.a_sur, w = smooth(clamp(P.a_sur * 4, 0, 1)) * smooth(clamp(u * 12, 0, 1)), k = P.a_surK;
    const hp = k === 1 && u < 0.2 ? Math.sin(u / 0.2 * Math.PI) : 0;   // irkilirken minik sekme
    kmin = kmax = k === 1 ? 24 : 14;
    if (k === 1) {
      T.lean = lerp(T.lean, -0.12, w); T.hx = lerp(T.hx, -0.9, w); T.head = lerp(T.head, -0.06, w);
      if (st === 'idle') { T.la1 = lerp(T.la1, 0.55, w); T.la2 = lerp(T.la2, 1.9, w); T.ba1 = lerp(T.ba1, 0.35, w); T.ba2 = lerp(T.ba2, 1.5, w); T.hOpen = 0; }
      T.shr = lerp(T.shr, 0.8, w);
      T.mRound = lerp(T.mRound, u < 0.5 ? 1 : 0.4, w); T.mOpen = lerp(T.mOpen, 0.6, w); T.mSmile = lerp(T.mSmile, u < 0.5 ? 0.1 : 0.9, w);
      T.brow = lerp(T.brow, 1, w); T.lid = lerp(T.lid, 1.15, w); T.gx = lerp(T.gx, 0.8, w); T.gy = lerp(T.gy, -0.3, w);
      T.bob -= 2.4 * hp; T.lt2 -= 0.4 * hp * w;
    } else if (k === 4) {   // yukarıda yerine oturan yıldıza bakar, başı kalkık; el sallar
      const wv = Math.sin(P.a_t * 9);
      T.head = lerp(T.head, -0.28, w); T.lean = lerp(T.lean, -0.06, w); T.shr = lerp(T.shr, 0.4, w);
      T.gx = lerp(T.gx, 0.4, w); T.gy = lerp(T.gy, -0.95, w); T.mRound = lerp(T.mRound, 0.3, w); T.mOpen = lerp(T.mOpen, 0.5, w);
      T.mSmile = lerp(T.mSmile, 0.95, w); T.brow = lerp(T.brow, 0.8, w); T.lid = lerp(T.lid, 1.12, w);
      if (st === 'idle') { T.la1 = lerp(T.la1, 2.3, w); T.la2 = lerp(T.la2, 0.5 + 0.35 * wv, w); T.hOpen = w; }
    } else if (k === 2) {
      T.head = lerp(T.head, -0.2, w); T.lean = lerp(T.lean, -0.04, w); T.shr = lerp(T.shr, 0.3, w);
      T.gx = lerp(T.gx, 0.7, w); T.gy = lerp(T.gy, -0.45, w); T.mRound = lerp(T.mRound, 0.6, w); T.mOpen = lerp(T.mOpen, 0.45, w);
      T.mSmile = lerp(T.mSmile, 0.7, w); T.brow = lerp(T.brow, 0.8, w); T.lid = lerp(T.lid, 1.12, w);
      if (st === 'idle') { T.la1 = lerp(T.la1, 0.7, w); T.la2 = lerp(T.la2, 1.2, w); T.hOpen = 0; }
    } else if (k === 5 && u > 0.28) {   // Pofuduk uyandı: "oo"dan sonra kıkırdar – gözler ^ ^, omuzlar kıkır kıkır sarsılır, el ağza
      const gg = Math.abs(Math.sin(P.a_t * 17)) * w;
      T.happy = 1; T.mSmile = 1; T.mOpen = lerp(T.mOpen, 0.35 + 0.25 * gg, w); T.mRound = 0; T.brow = lerp(T.brow, 0.4, w);
      T.shr = lerp(T.shr, 0.35 + 0.3 * gg, w); T.bob -= 0.6 * gg; T.head = lerp(T.head, 0.06 + 0.05 * gg, w); T.lean = lerp(T.lean, 0.05, w);
      if (st === 'idle') { T.la1 = lerp(T.la1, 1.55, w); T.la2 = lerp(T.la2, 1.7, w); T.hOpen = 0; }
    } else {
      T.lean = lerp(T.lean, -0.06, w); T.mRound = lerp(T.mRound, 0.7, w); T.mOpen = lerp(T.mOpen, 0.5, w); T.mSmile = lerp(T.mSmile, 0.5, w);
      T.brow = lerp(T.brow, 0.9, w); T.lid = lerp(T.lid, 1.12, w); T.head = lerp(T.head, -0.08, w);
    }
  }
  // Pırıl konuşuyor: ona bakar (durunca baş da döner, kaşlar hafif kalkık, gülümser); başka bir hareket sürüyorsa yalnız gözler
  P.a_dinT = Math.max(0, P.a_dinT - dt);
  if (P.a_dinT > 0 && (st === 'idle' || st === 'run') && !cheer && !fin) {
    const w = smooth(clamp(P.a_dinT / 0.3, 0, 1)) * (act || P.a_sur > 0 ? 0.6 : 1);
    T.gx = lerp(T.gx, gpx, w); T.gy = lerp(T.gy, gpy, w);
    if (st === 'idle' && !act) { T.head = lerp(T.head, -gpy * 0.18, w); T.brow = lerp(T.brow, 0.3, w); T.mSmile = lerp(T.mSmile, 0.95, w); }
  }
  // uzun düşüşten kurtarıldı: yere konunca "ohh" – derin nefes verir, omuzlar düşer, el göğse, sonra gülümser
  if (P.a_ohBek && gr && !carry) { P.a_ohBek = 0; P.a_ohT = 0; }
  P.a_ohT += dt;
  if (P.a_ohT < 1.5 && st === 'idle' && !cheer) {
    const u = P.a_ohT, w = smooth(clamp(u / 0.2, 0, 1)) * smooth(clamp((1.5 - u) / 0.35, 0, 1)), ex = smooth(clamp((u - 0.15) / 0.5, 0, 1));
    kmin = kmax = 12;
    T.shr = lerp(T.shr, lerp(0.5, -0.4, ex), w); T.breath = lerp(T.breath, lerp(1.5, -1.2, ex), w); T.lean = lerp(T.lean, 0.06 * ex, w); T.head = lerp(T.head, lerp(-0.12, 0.1, ex), w);
    T.mRound = lerp(T.mRound, u < 0.9 ? 0.8 : 0, w); T.mOpen = lerp(T.mOpen, u < 0.9 ? 0.32 : 0.25, w); T.mSmile = lerp(T.mSmile, u < 0.9 ? 0.5 : 1, w);
    T.lid = lerp(T.lid, u < 0.9 ? 0.45 : 1, w); T.brow = lerp(T.brow, u < 0.9 ? 0.5 : 0.25, w);
    T.la1 = lerp(T.la1, 0.75, w); T.la2 = lerp(T.la2, 1.9, w); T.hOpen = 0;   // el göğüste
  }
  // arkasından gelen kuzucuklara / Pofuduklara arada bir dönüp bakar (yürürken gözler + baş hafif, gülümser)
  P.a_arkT -= dt;
  if (P.a_arkT <= 0) {
    P.a_arkT = 0.5; P.a_ark = 0;
    if (gr && sp > 30 && typeof NESNELER !== 'undefined' && (P.a_t > P.a_arkN)) {
      for (let i = 0; i < NESNELER.length; i++) {
        const o = NESNELER[i], f = (o.tip === 'kuzu' && o.kz && o.kz.durum === 'takip') || (o.tip === 'pofuduk' && o.uyandi) || (BOLUM_NO === 8 && o.tip === 'hayaletcik' && (o.bulundu || o.takip));
        if (f && (o.x - P.x) * P.a_side < -30 && (o.x - P.x) * P.a_side > -260 && Math.abs(o.y - P.y) < 120) { P.a_arkG = 0; P.a_arkN = P.a_t + 5 + Math.random() * 4; break; }
      }
    }
  }
  if (P.a_arkG < 1) {
    P.a_arkG += dt / 0.9;
    const w = Math.sin(clamp(P.a_arkG, 0, 1) * Math.PI);
    if ((st === 'run' || st === 'idle') && !act && !cheer) { T.gx = lerp(T.gx, -1, w); T.gy = lerp(T.gy, 0.3, w); T.head = lerp(T.head, 0.06, w); T.mSmile = lerp(T.mSmile, 1, w); T.mOpen = lerp(T.mOpen, 0.35, w); T.brow = lerp(T.brow, 0.3, w); }
  }
  // çiçek açtı / tohum bulundu: önce uzanır, sonra kollar havada sevinir
  if (cheer && st !== 'carry' && st !== 'flip' && st !== 'launch') {
    const ct = P.a_cheerT, o = P.a_cheerO;
    const ox = (o.x - P.x) * sd, oy = (o.y - 22) - (P.y - 44), ang = clamp(Math.atan2(ox, oy), 0.35, 2.7);
    if (ct < 0.55 && P.a_hug) {   // kuzucuğa sarılma: öne eğilip kollarıyla sarar, yanağını yaslar, gözler ^ ^, iki kez sıkar
      const hu = ct - (0.55 - FZ_HUG), w = smooth(clamp(hu / 0.16, 0, 1)), sq = Math.max(0, Math.sin((hu - 0.12) * 10)) * w * (hu < 0.75 ? 1 : 0);
      kmin = kmax = 22;
      T.lean = 0.3 + 0.04 * sq; T.hx = 0.9; T.bob = -0.4;
      T.lt1 = 0.32; T.lt2 = -0.6; T.bt1 = -0.3; T.bt2 = -0.45;
      T.la1 = 1.0; T.la2 = 1.6 + 0.25 * sq; T.ba1 = 1.15; T.ba2 = 1.5 + 0.25 * sq; T.hOpen = 0; T.arm = 1.06; T.shr = 0.55 + 0.25 * sq;
      T.happy = w > 0.4 ? 1 : 0; T.mSmile = 1; T.mOpen = 0.2 + 0.15 * sq; T.mRound = 0; T.brow = 0.35; T.head = 0.24 + 0.05 * sq; T.gx = 1; T.gy = 0.6;
      T.sx = 1 + 0.035 * sq; T.sy = 1 - 0.03 * sq;
    } else if (ct < 0.55) {
      T.la1 = ang; T.la2 = 0.1; T.hOpen = 1; T.lean += 0.08; T.ba1 = 0.3; T.bob = -1.1 * smooth(clamp(ct / 0.25, 0, 1)); T.shr = 0.4 * smooth(clamp(ct / 0.25, 0, 1));
      T.gx = clamp(ox / 30, -1, 1); T.gy = clamp(oy / 30, -1, 1); T.head = 0.15 * clamp(oy / 40, -1, 1);
      T.mRound = 0.8; T.mOpen = 0.5; T.mSmile = 0.5; T.brow = 0.8; T.lid = 1.12;
    } else {
      const c2 = ct - 0.55, wv = Math.sin(c2 * 14);
      // yerinde: önden, kollar havada V, zıplar; koşarken/havada: yandan yumruk havada
      if (still && P.a_turnU >= 1 && ct < 1.75) {
        P.a_front = true; P.a_ikSrc = FZ_SEV_IK;
        const hp = Math.abs(Math.sin(c2 * Math.PI / 0.4)), sw = c2 < 1.2 ? 1 : 0;   // sekmeyle uyumlu: kollar sekmede yukarı çıkar, inerken hafifçe iner
        FZ_SEV_IK[0][0] = -12.4 - wv * 0.8 * (1 - sw) + (1 - hp) * 1.6 * sw; FZ_SEV_IK[1][0] = 12.4 - wv * 0.8 * (1 - sw) - (1 - hp) * 1.6 * sw;
        FZ_SEV_IK[0][1] = FZ_SEV_IK[1][1] = -25.5 + Math.abs(wv) * 0.8 * (1 - sw) + (1 - hp) * 3.2 * sw;
      }
      T.arm = 1.15; T.la1 = 1.9 + 0.1 * wv; T.la2 = 0.45; T.ba1 = 1.9 - 0.12 * wv; T.ba2 = 0.35; T.hOpen = 1; T.shr = 0.7;
      T.happy = 1; T.mOpen = 0.9; T.mSmile = 1; T.mRound = 0; T.brow = 0.5; T.head = -0.1; T.lean = st === 'run' ? T.lean : -0.04; T.lid = 1;
      if (still) {   // her sekmede: iniş ezilmesi (squash) → kalkışta uzama (stretch), bacaklar havada toplanır
        const ah = Math.abs(Math.sin(c2 * Math.PI / 0.4)), sw = c2 < 1.2 ? 1 : 0, hop = ah * sw, sqh = Math.pow(1 - ah, 4) * sw;
        T.bob = -6.5 * hop; T.lt1 = 0.05 + 0.55 * hop; T.lt2 = -0.1 - 0.95 * hop; T.bt1 = 0.35 * hop; T.bt2 = -0.1 - 0.8 * hop; kmin = kmax = 30;
        T.sy = 1 + 0.045 * hop - 0.07 * sqh; T.sx = 1 - 0.03 * hop + 0.05 * sqh; T.head = -0.1 + 0.05 * Math.sin(c2 * 7.85);
      }
    }
  }
  // gökyüzüne bakış (Bölüm 2: yıldız uyanır / göğe yükselip yerleşir): baş yukarı, ağız açık "vay", parmak ucunda yükselme; koşarken hafif
  P.a_skyT = Math.max(0, P.a_skyT - dt); if (P.a_skyT <= 0) P.a_skyK = 0;
  P.a_skyW += (P.a_skyK - P.a_skyW) * (1 - Math.exp(-dt * 6));
  if (P.a_skyW > 0.01 && gr && (st === 'idle' || st === 'run')) {
    const w = P.a_skyW * (st === 'run' ? 0.45 : 1);
    T.head = lerp(T.head, -0.3, w); T.gx = lerp(T.gx, 0.4, w); T.gy = lerp(T.gy, -0.95, w); T.lid = lerp(T.lid, 1.12, w); T.brow = lerp(T.brow, 0.8, w);
    T.mOpen = lerp(T.mOpen, 0.55, w); T.mRound = lerp(T.mRound, 0.55, w); T.mSmile = lerp(T.mSmile, 0.75, w); T.lean -= 0.05 * w;
    if (st === 'idle') { T.bob -= 1.2 * w; T.shr += 0.3 * w; }
  }
  // fırlatıldıktan sonra yere inince: önden "ta-da!" (kollar iki yana-yukarı, parmak ucunda)
  if (tada && (st === 'idle' || st === 'edge' || st === 'run')) {
    const tt = P.a_tadaT, up = smooth(clamp((tt - 0.12) / 0.2, 0, 1)) * smooth(clamp((1.0 - tt) / 0.26, 0, 1));
    if (P.a_turnU >= 1 && tt > 0.06 && tt < 0.98) { P.a_front = true; P.a_ikSrc = FZ_TADA_IK; }
    const wg = Math.sin(tt * 16) * 0.5 * up;
    FZ_TADA_IK[0][0] = -lerp(6.6, 16.0, up) - wg; FZ_TADA_IK[1][0] = lerp(6.6, 16.0, up) + wg;
    FZ_TADA_IK[0][1] = FZ_TADA_IK[1][1] = lerp(1.6, -21.0, up); T.arm = lerp(1, 1.18, up);
    T.la1 = lerp(T.la1, 1.9, up); T.la2 = lerp(T.la2, 0.4, up); T.ba1 = lerp(T.ba1, 1.8, up); T.ba2 = lerp(T.ba2, 0.4, up); T.hOpen = 1; T.shr = 0.6 * up;
    T.happy = up > 0.25 ? 1 : 0; T.mOpen = 0.9 * up; T.mSmile = 1; T.mRound = 0; T.brow = 0.5 * up; T.head = -0.06 * up;
    T.bob = -1.6 * up; T.sy = 1 + 0.03 * up; T.sx = 1 - 0.02 * up; T.lt1 = lerp(T.lt1, 0.04, up); T.bt1 = lerp(T.bt1, -0.04, up); T.lt2 = lerp(T.lt2, -0.02, up); T.bt2 = lerp(T.bt2, -0.02, up);
    kmin = kmax = 18;
  }
  // Bölüm 6 şenliği, havada (vuruş zıplaması): sırayla kollar havada V + toplanmış bacaklar / yıldız zıplaması (kollar, bacaklar açık)
  if (!gr && (st === 'rise' || st === 'apex' || st === 'fall') && !cheer && fzSenlik67()) {
    const wv = Math.sin(t * 14), tep = 1 - clamp(Math.abs(vy) / 520, 0, 1);   // tep: tepe noktasında 1
    kmin = kmax = 26;
    T.arm = 1.15; T.hOpen = 1; T.shr = 0.7; T.happy = 1; T.mOpen = 0.9; T.mSmile = 1; T.mRound = 0; T.brow = 0.5; T.lid = 1; T.lean = -0.04;
    if (P.a_j6 % 2) {   // yıldız zıplaması
      T.la1 = 1.75 + 0.1 * wv; T.la2 = 0.3; T.ba1 = -1.35 - 0.1 * wv; T.ba2 = 0.3;
      T.lt1 = 0.2 + 0.3 * tep; T.lt2 = -0.25; T.bt1 = -0.2 - 0.3 * tep; T.bt2 = -0.25; T.head = -0.1; T.gx = 0.6; T.gy = -0.3;
    } else {            // kollar havada, dizler toplanır
      T.la1 = 1.9 + 0.1 * wv; T.la2 = 0.45; T.ba1 = 1.9 - 0.12 * wv; T.ba2 = 0.35;
      T.lt1 = 0.35 + 0.25 * tep; T.lt2 = -0.7 - 0.35 * tep; T.bt1 = 0.2 + 0.2 * tep; T.bt2 = -0.6 - 0.3 * tep; T.head = -0.14; T.gx = 0.3; T.gy = -0.7;
    }
  }
  // final kutlaması (yerde, durmuşken). Önden pozlarda eller yaylı hedeflere gider (FZ_FIN_IK).
  let g0x = -6.6, g0y = 1.6, g1x = 6.6, g1y = 1.6;
  if (fk && st === 'idle') {
    const hop = Math.sin(Math.PI * clamp((fbu - 0.08) / 0.62, 0, 1));   // vuruş başına bir sekme: yumuşak kalkış ve iniş
    T.sq = 0; T.lid = 1; T.mRound = 0; T.mSmile = 1; T.breath = 0; T.spr = 0;
    FZ_FIN_IK[0][2] = FZ_FIN_IK[1][2] = 1;
    if (fk === 1) {   // ağaca hayranlık: gözler ve baş tepeye, ağız "o", eller hafifçe öne açılır; sonunda kocaman gülümser
      const tr = typeof TREE !== 'undefined' && TREE, av6 = !tr ? (fzKuzey7() ? fzKuzeyTepe() : fzCadi8() ? fz8Meydan() : fzEjder9() ? fz9Yuva() : fzBalo11() ? fz11Balo() : fzSenlikAvlu()) : null;   // Bölüm 6: kalenin üstündeki ışık tacına / göğe bakar
      const tx = tr ? (TREE.x - P.x) * sd : av6 ? (av6.x - P.x) * sd : 40, ty = tr ? (TREE.y - 300) - (P.y - 55) : av6 ? (av6.y - (fzCadi8() ? 200 : fzEjder9() ? 230 : 330)) - (P.y - 55) : -250;   // Bölüm 8: meydandaki dev kabak fenerine
      const L = Math.hypot(tx, ty) || 1, agx = clamp(tx / L * 1.4, -1, 1), agy = clamp(ty / L * 2, -1, 0.2), sm = smooth(clamp((P.a_finT - 1.05) / 0.4, 0, 1));
      kmin = kmax = 11;
      T.gx = agx; T.gy = agy; T.head = agy * 0.45 * Math.max(0.4, agx * 0.5 + 0.5); T.lean = 0.01 - 0.07 * Math.max(0, -agy);
      T.mRound = 0.85 * (1 - sm); T.mOpen = lerp(0.55, 0.7, sm); T.mSmile = lerp(0.35, 1, sm); T.brow = lerp(0.85, 0.5, sm); T.lid = lerp(1.12, 1, sm);
      T.la1 = 0.6 + 0.08 * Math.sin(t * 2.2); T.la2 = 0.55; T.ba1 = 0.35; T.ba2 = 0.5; T.hOpen = 0.7; T.shr = 0.25;
    } else if (fk === 2) {   // kollar havada, vuruşta zıplar (önden)
      const wv = Math.sin(t * 14);
      kmin = kmax = 28;
      g0x = -12.4 - wv * 0.8; g1x = 12.4 - wv * 0.8; g0y = g1y = -25.5 + Math.abs(wv) * 0.8;
      T.arm = 1.15; T.la1 = 1.9 + 0.1 * wv; T.la2 = 0.45; T.ba1 = 1.9 - 0.12 * wv; T.ba2 = 0.35; T.hOpen = 1; T.shr = 0.7;
      T.happy = 1; T.mOpen = 0.9; T.brow = 0.5; T.head = -0.1; T.lean = -0.04;
      T.bob = -4.5 * hop; T.lt1 = 0.05 + 0.4 * hop; T.lt2 = -0.1 - 0.7 * hop; T.bt1 = 0.3 * hop; T.bt2 = -0.1 - 0.6 * hop;
      if (fzSenlik6()) { const av = fzSenlikAvlu(); if (av && av.age >= 24.6) { T.gy = -0.85; T.gx = 0; T.head = -0.2; } }   // doruk: gökteki ışık tacına bakar
      else if (fzKuzey7()) { const tp = fzKuzeyTepe(); if (tp && tp.doruk) { T.gy = -0.85; T.gx = 0; T.head = -0.2; } }   // Bölüm 7: göğü kaplayan kuzey ışıklarına bakar
      else if (fzCadi8()) { const my = fz8Meydan(); if (my && my.doruk) { T.gy = -0.85; T.gx = 0; T.head = -0.2; } }
      else if (fzBalo11()) { const b11 = fz11Balo(); if (b11 && (b11.doruk || b11.age < 9)) { T.gy = -0.85; T.gx = 0; T.head = -0.2; } }   // Bölüm 11: çıkan Ay'a / ay ışığı halkasına bakar   // Bölüm 8: şeker renkli havai fişeklere bakar
      else if (fzEjder9()) { const y9 = fz9Yuva(); if (y9 && y9.doruk) { T.gy = -0.85; T.gx = 0; T.head = -0.2; } }   // Bölüm 9: gökte ışık halkası çizen ejderhalara bakar
    } else if (fk === 3) {   // dans
      kmin = kmax = 24;
      if (fb < 2) {          // sek, sek: Pofuduk'lara dönük, yumruklar sırayla, gözler gülüyor
        const cr = (1 - hop) * 0.6, sh = fb ? -1 : 1;
        T.bob = -3.2 * hop; T.hx = 0.6 * sh * hop;
        T.lt1 = 0.12 + 0.25 * hop + 0.3 * cr; T.lt2 = -0.2 - 0.45 * hop - 0.55 * cr; T.bt1 = 0.02 + 0.2 * hop + 0.25 * cr; T.bt2 = -0.2 - 0.4 * hop - 0.5 * cr;
        T.la1 = 0.9 + (sh > 0 ? 0.9 : 0.25) * hop; T.la2 = 1.4 - 0.4 * hop; T.ba1 = 0.7 + (sh > 0 ? 0.25 : 0.8) * hop; T.ba2 = 1.3; T.hOpen = 0;
        T.lean = 0.03 + 0.06 * hop; T.head = 0.04 - 0.08 * hop; T.gx = 1; T.gy = 0.45; T.happy = 1; T.mOpen = 0.6; T.brow = 0.35;
      } else if (fb === 2) { // önden iki kez el çırpar
        const s2 = Math.abs(Math.sin(fbu * 6.2832));
        kmin = kmax = 28;
        g0x = -(0.9 + 5.2 * s2); g1x = 0.9 + 5.2 * s2; g0y = g1y = -7.6 - 1.6 * s2;
        T.la1 = 1.3; T.la2 = 1.4; T.ba1 = 1.3; T.ba2 = 1.4; T.hOpen = 1;
        T.bob = -1.2 * s2; T.lt1 = 0.1 + 0.15 * (1 - s2); T.lt2 = -0.2 - 0.3 * (1 - s2); T.bt1 = 0.1 + 0.15 * (1 - s2); T.bt2 = -0.2 - 0.3 * (1 - s2);
        T.happy = 1; T.mOpen = 0.8; T.brow = 0.45; T.head = -0.05; T.gx = 0; T.gy = 0.2;
      } else {               // önden geçerek öbür yana dönüş, kollar açık, küçük zıplama
        kmin = kmax = 26;
        T.bob = -5.5 * hop; T.lt1 = 0.1 + 0.5 * hop; T.lt2 = -0.15 - 0.95 * hop; T.bt1 = 0.05 + 0.3 * hop; T.bt2 = -0.15 - 0.85 * hop;
        T.la1 = 1.75; T.la2 = 0.3; T.ba1 = -1.35; T.ba2 = 0.3; T.hOpen = 1; T.shr = 0.4; T.arm = 1.08;
        T.happy = 1; T.mOpen = 0.9; T.brow = 0.5; T.head = -0.08; T.lean = -0.03; T.gx = 0.8; T.gy = 0.2;
      }
    } else if (fk === 4) {   // önden, yukarıda dans eden Pırıl'a el sallar; gözleriyle onu izler
      kmin = kmax = 20;
      if (P.a_finHand) { g1x = 12.0 + 2.8 * Math.sin(t * 11); g1y = -30.0 + 0.8 * Math.cos(t * 22); g0x = -7.0; g0y = 0.6 - 0.8 * hop; FZ_FIN_IK[0][2] = 0; }
      else { g0x = -12.0 - 2.8 * Math.sin(t * 11); g0y = -30.0 + 0.8 * Math.cos(t * 22); g1x = 7.0; g1y = 0.6 - 0.8 * hop; FZ_FIN_IK[1][2] = 0; }
      T.arm = 1.1; T.la1 = 2.4; T.la2 = 0.6 + 0.3 * Math.sin(t * 11); T.hOpen = 1; T.ba1 = 0.15; T.shr = 0.35;
      T.gx = clamp((D.x - P.x) * sd / 50, -1, 1); T.gy = clamp((D.y - (P.y - 58)) / 45, -1, 1); T.head = -0.14;
      T.mOpen = 0.65; T.brow = 0.45; T.bob = -1.5 * hop; T.lt1 = 0.08 + 0.12 * (1 - hop); T.lt2 = -0.12 - 0.25 * (1 - hop); T.bt1 = 0.08 + 0.12 * (1 - hop); T.bt2 = -0.12 - 0.25 * (1 - hop);
    } else if (fk === 6) {   // Bölüm 8 kostüm gösterisi (önden): cadı asayı başının üstünde çevirir, kabak kalça sallar, iskelet kemik titretir, yarasa kanat çırpar
      const ks = fz8V8Kos() || 'cadi', ph = fbt / FB, sdA = P.a_side < 0 ? 1 : -1;   // sdA: asanın elinin yerel yanı (sepet ekranda hep öbür elde)
      kmin = kmax = 26; T.happy = 1; T.mSmile = 1; T.mOpen = 0.85; T.brow = 0.5; T.arm = 1.12; T.lean = -0.03;
      if (ks === 'cadi') {   // iki tur: asa başının üstünde dönerken yıldız tozu saçar; öbür el (sepet) belde
        const a = ph * 6.2832 * 2, cx = sdA * (12.6 + Math.cos(a) * 3.0), cy = -23.5 + Math.sin(a) * 2.4;   // yüzün dışında (el yüzü örtmesin)
        if (sdA < 0) { g0x = cx; g0y = cy; g1x = 7.6; g1y = -1.0 - 1.2 * hop; FZ_FIN_IK[1][2] = 0; } else { g1x = cx; g1y = cy; g0x = -7.6; g0y = -1.0 - 1.2 * hop; FZ_FIN_IK[0][2] = 0; }
        FZ8_P.don = sdA * Math.sin(a) * 0.6; FZ8D.kivT = 1;
        T.bob = -2.6 * hop; T.lt1 = 0.05 + 0.25 * hop; T.lt2 = -0.1 - 0.45 * hop; T.bt1 = 0.2 * hop; T.bt2 = -0.1 - 0.4 * hop;
        T.gx = sdA * 0.5; T.gy = -0.8; T.head = -0.14;
      } else if (ks === 'kabak') {   // eller belde, her vuruşta öbür yana kalça sallama (jöle gibi kabak)
        g0x = -8.2; g0y = -4.6; g1x = 8.2; g1y = -4.6; FZ_FIN_IK[0][2] = FZ_FIN_IK[1][2] = 0;
        FZ8D.tilt = 0.17 * Math.sin(fbu * Math.PI) * (fb % 2 ? -1 : 1); FZ8_P.jv += 0.4 * Math.sin(fbu * 6.2832);
        T.bob = -1.6 * hop; T.lt1 = 0.05 + 0.2 * hop; T.lt2 = -0.1 - 0.35 * hop; T.bt1 = 0.15 * hop; T.bt2 = -0.1 - 0.3 * hop; T.gx = 0; T.gy = 0.3;
      } else if (ks === 'iskelet') {   // komik kemik titremesi: kollar iki yanda, omuzlar, dizler ve baş takır takır
        const s1 = Math.sin(t * 31), s3 = Math.cos(t * 27);
        g0x = -13.6 + 2.0 * s1; g0y = -15 + 2.4 * s3; g1x = 13.6 - 2.0 * s1; g1y = -15 - 2.4 * s3;
        T.shr = 0.45 + 0.35 * Math.sin(t * 25); T.bob = -1.4 * Math.abs(Math.sin(t * 13)); T.lt1 = 0.1 + 0.14 * s1; T.bt1 = 0.1 - 0.14 * s1; T.lt2 = T.bt2 = -0.3;
        T.head = 0.1 * Math.sin(t * 17); T.mOpen = 0.95; T.gx = 0.3 * Math.sin(t * 9); T.gy = 0;
      } else {   // yarasa: her vuruşta bir kanat çırpışı (kollar havadan aşağı), çırparken minik zıplama
        const fl = 0.5 - 0.5 * Math.cos(fbu * 6.2832);
        g0x = -lerp(12.8, 13.6, fl); g0y = lerp(-26, -7.5, fl); g1x = -g0x; g1y = g0y;
        T.bob = -4.2 * (1 - fl); T.lt1 = 0.05 + 0.35 * (1 - fl); T.lt2 = -0.1 - 0.6 * (1 - fl); T.bt1 = 0.25 * (1 - fl); T.bt2 = -0.1 - 0.5 * (1 - fl);
        FZ8D.kn8 = 0.8; T.gx = 0; T.gy = -0.4;
      }
    } else {                 // düşen yaprağa uzanır (parmak ucunda, sonra küçük zıplama), sonunda yakalayıp göğsüne bastırır
      fzFinPetal(FZ_PET, fbt);
      const ox = (FZ_PET[0] - P.x) * sd, oy = FZ_PET[1] - (P.y - 44), ey = FZ_PET[1] - (P.y - 58);
      kmin = kmax = 18;
      if (fb < 3) {
        const ang = clamp(Math.atan2(ox, oy), 0.5, 2.45), jp = fb === 2 ? hop : 0;
        T.la1 = ang; T.la2 = 0.08; T.hOpen = 1; T.arm = 1.12; T.ba1 = ang - 0.5; T.ba2 = 0.25; T.shr = 0.45;
        T.bob = -1.8 - 4.5 * jp; T.sy = 1.03; T.sx = 0.985; T.lean = -0.06;
        T.lt1 = 0.05 + 0.3 * jp; T.lt2 = -0.03 - 0.6 * jp; T.bt1 = -0.05 + 0.2 * jp; T.bt2 = -0.03 - 0.5 * jp;
        T.gx = clamp(ox / 35, -1, 1); T.gy = clamp(ey / 35, -1, 1); T.head = clamp(ey / 160, -0.32, 0.05);
        T.mRound = 0.55; T.mOpen = 0.5; T.mSmile = 0.6; T.brow = 0.65; T.lid = 1.1;
      } else {
        T.la1 = 1.05; T.la2 = 1.75; T.ba1 = 0.95; T.ba2 = 1.7; T.hOpen = 0; T.shr = 0.3;
        T.bob = -2.5 * hop; T.lt1 = 0.05 + 0.25 * hop; T.lt2 = -0.1 - 0.45 * hop; T.bt1 = 0.15 * hop; T.bt2 = -0.1 - 0.4 * hop;
        T.happy = 1; T.mOpen = 0.7; T.brow = 0.4; T.head = 0.08; T.gx = 0.5; T.gy = 0.6;
      }
    }
    if (fFront && P.a_turnU >= 1) { P.a_front = true; P.a_ikSrc = FZ_FIN_IK; }
  }
  if (fin) {   // önden el hedefleri: kritik sönümlü yay (çırpma, el sallama, kollar havada arasında sıçrama olmaz)
    FZ_FIN_G[0] = g0x; FZ_FIN_G[1] = g0y; FZ_FIN_G[2] = g1x; FZ_FIN_G[3] = g1y;
    const om = 34, ee = Math.exp(-om * dt);
    for (let i = 0; i < 4; i++) {
      const a = FZ_FIN_IK[i >> 1], j = i & 1, x0 = a[j] - FZ_FIN_G[i], c = (FZ_FIN_V[i] + om * x0) * dt;
      a[j] = FZ_FIN_G[i] + (x0 + c) * ee; FZ_FIN_V[i] = (FZ_FIN_V[i] - om * c) * ee;
    }
  }
  // Bölüm 8: kapı çalma (ön el tık tık, sepet dirseğe kayar), kapıda kapıya/komşuya bakış ve dinleme, sepet dolunca sekme,
  // kostüm giyilince kollar açık iki hızlı dönüş ve önden "ta-da"
  if ((BOLUM_NO === 8 || BOLUM_NO === 11) && !fin && gr && st !== 'carry') {
    const D8 = FZ8D;
    if (D8.kapiW > 0.01 && (st === 'idle' || st === 'run')) {
      const w = smooth(clamp(D8.kapiW, 0, 1)), tp = Math.sin(clamp(D8.tapT / 0.17, 0, 1) * Math.PI);
      kmin = kmax = 26;
      T.la1 = lerp(T.la1, 1.72 - 0.12 * tp, w); T.la2 = lerp(T.la2, 0.78 - 0.62 * tp, w); T.hOpen = lerp(T.hOpen, 0, w); T.arm = lerp(T.arm, 1.08, w);
      T.lean = lerp(T.lean, 0.06 + 0.03 * tp, w); T.head = lerp(T.head, -0.08, w); T.shr = lerp(T.shr, 0.35, w);
      T.gx = lerp(T.gx, 1, w); T.gy = lerp(T.gy, -0.25, w); T.mSmile = 1; T.mOpen = lerp(T.mOpen, 0.25 + 0.2 * tp, w); T.brow = lerp(T.brow, 0.4, w);
    }
    if (P.a_t - D8.kapiBasT < 7.5 && st === 'idle' && D8.kapiW < 0.5) {
      const w = smooth(clamp((P.a_t - D8.kapiBasT) / 0.3, 0, 1)), dn = D8.dinT > 0 ? smooth(clamp(D8.dinT / 0.4, 0, 1)) : 0;
      T.gx = lerp(T.gx, 1, w); T.gy = lerp(T.gy, -0.3 - 0.15 * dn, w); T.mSmile = Math.max(T.mSmile, 0.95);
      if (dn > 0) { T.brow = lerp(T.brow, 0.45, dn); T.mOpen = lerp(T.mOpen, 0.3, dn); T.head = lerp(T.head, -0.1 + 0.045 * Math.sin(t * 5.2), dn); T.lean = lerp(T.lean, 0.0, dn); }
    }
    if (D8.hopT < 0.55 && st === 'idle') {   // sepete şeker düştü: küçük sevinç sekmesi, sepetli kol kalkar
      const hp = Math.sin(D8.hopT / 0.55 * Math.PI);
      kmin = kmax = 26; T.bob -= 3.2 * hp; T.lt1 += 0.25 * hp; T.lt2 -= 0.5 * hp; T.bt2 -= 0.45 * hp;
      T.la1 = lerp(T.la1, 0.95, hp); T.la2 = lerp(T.la2, 0.7, hp); T.happy = 1; T.mOpen = Math.max(T.mOpen, 0.6); T.mSmile = 1;
    }
    if (D8.donT < 1.25) {
      const u = D8.donT; kmin = kmax = 28;
      if (u < 0.62) {   // kollar iki yana açık, zıplayarak dönüyor
        const hp = Math.sin(clamp((u - 0.04) / 0.56, 0, 1) * Math.PI);
        T.bob = -5.5 * hp; T.lt1 = 0.1 + 0.5 * hp; T.lt2 = -0.15 - 0.9 * hp; T.bt1 = 0.05 + 0.3 * hp; T.bt2 = -0.15 - 0.8 * hp;
        T.la1 = 1.75; T.la2 = 0.3; T.ba1 = -1.35; T.ba2 = 0.3; T.hOpen = 1; T.arm = 1.08; T.shr = 0.4; T.lean = -0.03;
        if (BOLUM_NO === 11) { FZ8D.kn8 = 1; T.la1 = 2.05; T.ba1 = -1.85; }   // Bölüm 11: dönerken pelerin kanat gibi açılır
        T.happy = 1; T.mOpen = 0.9; T.mSmile = 1; T.brow = 0.5; T.mRound = 0;
      } else {          // önden "ta-da": kollar yana-yukarı, parmak ucunda
        const tt = u - 0.62, up = smooth(clamp(tt / 0.16, 0, 1)) * smooth(clamp((0.63 - tt) / 0.22, 0, 1)), wg = Math.sin(tt * 16) * 0.5 * up;
        if (P.a_turnU >= 1) { P.a_front = true; P.a_ikSrc = FZ8_TADA; }
        FZ8_TADA[0][0] = -lerp(6.6, 15.5, up) - wg; FZ8_TADA[1][0] = lerp(6.6, 15.5, up) + wg; FZ8_TADA[0][1] = FZ8_TADA[1][1] = lerp(1.6, -21.5, up);
        T.arm = lerp(1, 1.18, up); T.hOpen = 1; T.happy = up > 0.25 ? 1 : 0; T.mOpen = 0.9 * up; T.mSmile = 1; T.brow = 0.5 * up; T.mRound = 0;
        T.bob = -1.8 * up; T.sy = 1 + 0.03 * up; T.sx = 1 - 0.02 * up;
      }
    }
  }
  if (BOLUM_NO === 11 && !gr && !cirp8 && (st === 'rise' || st === 'apex' || st === 'fall' || st === 'launch') && fz8V8Kos()) fz11Havada(T, st, t, vy);   // Bölüm 11: pelerini kanat gibi açar
  if (cirp8 && !gr && (st === 'rise' || st === 'apex' || st === 'fall')) {   // yarasa: çift zıplamada iki kanat çırpışı
    const f = 0.5 - 0.5 * Math.cos(FZ8D.flapT / 0.55 * 6.2832 * 2);
    kmin = kmax = 32; FZ8D.kn8 = 1;
    T.la1 = lerp(2.75, 0.55, f); T.ba1 = lerp(2.6, 0.45, f); T.la2 = 0.25; T.ba2 = 0.3; T.hOpen = 1; T.arm = 1.1; T.shr = 0.5;
    T.lt1 = 0.75; T.lt2 = -1.25; T.bt1 = 0.45; T.bt2 = -1.05; T.happy = 1; T.mOpen = 0.85; T.mSmile = 1; T.mRound = 0; T.brow = 0.5; T.head = -0.08;
  }
  if (BOLUM_NO === 8 || BOLUM_NO === 11) { P.a_tilt = lerp(P.a_tilt || 0, FZ8D.tilt, 1 - Math.exp(-dt * 14)); FZ8D.tilt = 0; }   // kabak kalça sallaması (önden gövde eğimi)
  // hareketli cismin üstünde denge
  P.a_bal += ((mover ? 1 : 0) - P.a_bal) * (1 - Math.exp(-dt * 6));
  const bal = Math.max(P.a_bal * 0.6, P.a_balKick);
  if (bal > 0.01 && (st === 'idle' || st === 'run' || st === 'sit') && !cheer && !act && !fk) {
    const bw = Math.sin(t * 7.5) * P.a_balKick;
    T.la1 = lerp(T.la1, 1.45 + 0.6 * bw, bal); T.la2 = lerp(T.la2, 0.25, bal); T.ba1 = lerp(T.ba1, -1.15 - 0.6 * bw, bal); T.ba2 = lerp(T.ba2, 0.3, bal); T.hOpen = Math.max(T.hOpen, bal);
    if (st !== 'sit') { T.lt2 -= 0.3 * bal; T.bt2 -= 0.3 * bal; T.lean += 0.08 * bw + 0.04 * Math.sin(t * 2.6) * bal; }
    T.mRound = lerp(T.mRound, 0.6, P.a_balKick); T.mOpen = lerp(T.mOpen, 0.45, P.a_balKick); T.brow = lerp(T.brow, 0.7, P.a_balKick);
  }
  // yumuşak geçiş (üstel yaklaşım); durum değişiminden sonra hız artar
  const k = st === 'flip' ? lerp(16, 30, clamp(P.a_sw / 0.12, 0, 1)) : lerp(kmin, kmax, clamp(P.a_sw / 0.3, 0, 1)), cur = P.a_pose;
  if (P.a_turnU < 0.5) { T.gx = -1; T.gy = 0; }   // dönüşte önce gözler yeni yöne bakar
  // kritik sönümlü yay (tam çözüm): hareket yavaş başlar, yavaş biter — durum değişiminde hız sıçraması (pop) olmaz.
  // om = 1.7k: eski üstel yaklaşımla aynı sürede %90'a varır, en yüksek hızı ~%40 daha düşük.
  const om = 1.7 * k, ee = Math.exp(-om * dt), V = P.a_pv, TA = FZ_TA;
  fzPack(T, TA);
  for (let i = 0; i < FZ_N; i++) {
    const x0 = cur[i] - TA[i], c = (V[i] + om * x0) * dt;
    cur[i] = TA[i] + (x0 + c) * ee; V[i] = (V[i] - om * c) * ee;
    const vm = FZ_VMAXA[i];   // uzuvlar en çok ~0.37 rad/kare döner (60 Hz): uzak pozlara geçişte bile kol "ışınlanmaz"
    if (vm > 0 && Math.abs(V[i]) > vm) { const v2 = V[i] > 0 ? vm : -vm; cur[i] -= (V[i] - v2) * dt * 0.5; V[i] = v2; }
  }
  // göz kırpma (bazen çift)
  P.a_blink -= dt;
  if (P.a_blink < -0.13) P.a_blink = Math.random() < 0.2 ? 0.22 : 1.8 + Math.random() * 3;
  P.a_lidM += ((P.a_blink < 0 ? 0 : 1) - P.a_lidM) * (1 - Math.exp(-dt * 45));
  // çizim pozu = yumuşak poz + iniş çökmesi + kalkış uzaması + çarpma
  const R = P.a_R, lt = P.a_landT; fzUnpack(cur, R);
  // kalkış uzaması iki karede yükselir (tek karede bacak düzelip kalça sıçramasın), sonra söner
  // iniş çökmesi fiziğe bağlı: kalça yere düşüş hızıyla değer ve hemen yavaşlamaya başlar. c(t) = p·A·(e^(-t/τ2) − e^(-t/τ1)):
  // ilk karede en hızlı çöker (dünyadaki kalça hızı düşüşten kesintisiz devam eder, sonra tekdüze yavaşlar; net iniş),
  // ~55 ms'de en dipte, ~0.13 sn zaman sabitiyle yumuşak kalkar. Sert inişte daha derin ve biraz daha çabuk.
  // Kalkış uzaması: 6.75 p (1-p)², kalkış hızıyla ölçekli (sonu yumuşak).
  const t1 = lerp(0.042, 0.032, P.a_landP), t2 = 0.13, tpk = Math.log(t2 / t1) * t1 * t2 / (t2 - t1);
  const lA = 1 / (Math.exp(-tpk / t2) - Math.exp(-tpk / t1)), tp = Math.pow(1 - P.a_take, 1.3);
  // Tatlı diz bükülmesi (landing squash) & yumuşak yaylanma
  const yay = gr && lt > tpk ? ((typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 3 ? -0.42 : -0.22) * P.a_landP * Math.sin((lt - tpk) * 18) * Math.exp(-(lt - tpk) * (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 3 ? 7.5 : 12))) : 0;
  const cr0 = gr ? P.a_landP * lA * (Math.exp(-lt / t2) - Math.exp(-lt / t1)) + yay : 0, cr = Math.max(0, cr0), tk = P.a_take > 0 ? 6.75 * tp * (1 - tp) * (1 - tp) * P.a_takeP : 0;
  if (gr && P.a_state !== 'skid') { const al = clamp(P.a_ax * 0.00018, -0.1, 0.09); R.lean += al; R.head -= al * 0.45; R.hx += al * 1.5; }
  // İnişte tatlı diz kırılması & kolların dengeye açılması
  R.lt1 += 0.9 * cr; R.lt2 -= 1.68 * cr; R.bt1 += 0.68 * cr; R.bt2 -= 1.55 * cr; R.lean += 0.26 * cr; R.head += 0.14 * cr;
  R.la1 += 0.58 * cr; R.ba1 += 0.48 * cr; R.sx += 0.13 * cr; R.sy -= 0.11 * cr; R.lid *= (1 - 0.35 * cr); R.happy = Math.max(R.happy, 0.4 * cr);
  if (cr0 < 0) { R.sy -= 0.14 * cr0; R.sx += 0.09 * cr0; R.la1 -= 0.35 * cr0; R.ba1 -= 0.35 * cr0; }   // yaylanmanın yukarı evresi: diz bükülmeden hafif uzama, kollar kalkar
  R.sy += 0.08 * tk; R.sx -= 0.06 * tk; R.lt1 -= 0.6 * tk * R.lt1; R.lt2 *= 1 - 0.7 * tk;
  if (P.a_take > 0.7 && !gr) {   // kalkışın ilk ~55 ms'si: dizler hâlâ bükük, gövde basık (itme) – gecikme yok, gövde zaten yükseliyor; çömelme hissi verir
    const pu = (P.a_take - 0.7) / 0.3 * P.a_takeP;
    R.lt1 += 0.55 * pu; R.lt2 -= 1.0 * pu; R.bt1 += 0.4 * pu; R.bt2 -= 0.9 * pu; R.sy -= 0.07 * pu; R.sx += 0.05 * pu; R.lean += 0.12 * pu; R.la1 -= 0.5 * pu; R.ba1 -= 0.4 * pu;
  }
  P.a_dj = Math.max(0, P.a_dj - dt / 0.45);
  if (P.a_dj > 0) { const ud = 1 - P.a_dj, os = Math.sin(ud * Math.PI * 2.4) * Math.exp(-ud * 2.2); R.sy -= 0.12 * os; R.sx += 0.09 * os; }
  const bu = P.a_bump * P.a_bump;   // Pofuduk'a tosladı: kısa geri sekme
  R.lean -= 0.3 * bu; R.head -= 0.2 * bu; R.sx += 0.06 * bu; R.sy -= 0.05 * bu; R.hx -= 1.2 * bu;
  const su = (1 - P.a_stomp) / 0.24, sb = P.a_stomp > 0 && su < 1 ? Math.sin(su * Math.PI) : 0;   // basınca kısa ezilme (3 karede iner, yumuşak döner)
  R.sy -= 0.1 * sb; R.sx += 0.08 * sb;
  // takla açısı (başı ve sonu yavaş); büyük fırlatmada toparlanınca ağır bir takla
  const u = P.flip > 0 ? 1 - P.flip : 0;
  let spin = u > 0 && !cirp8 ? (u - Math.sin(u * 6.2832) / 6.2832) * 6.2832 : 0;
  if (st === 'launch' && P.a_launchBig) {
    const el = (1 - P.a_launch) * 1.05, u2 = clamp((el - 0.45) / 0.6, 0, 1);
    spin = (u2 - Math.sin(u2 * 6.2832) / 6.2832) * 6.2832;
  }
  P.a_spin = spin;
  P.a_kenar = R.la1 - R.lean > 1.6;   // kol yüz hizasına kalkınca ince ten kenarı (ten üstünde ten okunsun)
  if (BOLUM_NO === 12 && typeof fz12Kol === 'function') fz12Kol(R, dt, t);   // Bölüm 12: uçurtma ipi / el sallama kolu, poz saatleri, tüm beden pozundan yumuşak dönüş (fezapoz12.js)
  // kalça yüksekliği: yerdeyken en alttaki ayak tam yere bassın
  const hipG = -Math.max(fzFy(R.lt1, R.lt2), fzFy(R.bt1, R.bt2));
  P.a_ledgeW += (((st === 'sit' && P.a_ledge && P.a_sit > 0.35) ? 1 : 0) - P.a_ledgeW) * (1 - Math.exp(-dt * 5));
  const hip = lerp(lerp(hipG, FZ_AIRHIP, R.air) + R.bob, -2.4, P.a_ledgeW);
  // popo kenarın tam üstüne gelsin (kalça yerel x ≈ hx)
  const lox = P.a_ledge ? clamp(P.a_edgeX - P.a_ledge * 2.5 - P.x - sd * FZ_SC * R.hx, -16, 16) : 0;
  P.a_hipV = (hip - P.a_hipY) / dt; P.a_hipY = hip;
  // taşınırken çizim kayması: yukarıdan sallanarak yavaşça iner (Pırıl P.a_elX/elY'deki ellere tutunabilir)
  {   // hedefe yumuşak yaklaşım: piril.js taşıma bitince süreyi ileri atlatsa da sıçrama olmaz
    const cu = carry ? clamp(P.a_carryT / FZ_CARRY, 0, 1) : 1, dk = 1 - Math.exp(-dt * 12);
    P.a_oy += (-50 * (1 - cu) * (1 - cu) - P.a_oy) * dk; P.a_ox += (Math.sin(t * 3.1) * 2.5 * (1 - cu) + lox * P.a_ledgeW - P.a_ox) * dk;
  }
  P.a_tasW += (((typeof D !== 'undefined' && D.tasiyor) || carry ? 1 : 0) - P.a_tasW) * (1 - Math.exp(-dt * 5));
  P.a_tutun += ((carry ? 1 : 0) - P.a_tutun) * (1 - Math.exp(-dt * 20));
  {   // ön elin dünya konumu (Pırıl taşırken bu ele tutunur)
    const cl = Math.cos(R.lean), sl = Math.sin(R.lean), sx0 = 1.2, sy0 = -11.4;
    const shx = R.hx + sx0 * cl - sy0 * sl, shy = hip + sx0 * sl + sy0 * cl, aa = R.la1 + R.lean, L = (FZ_UA + FZ_FA) * R.arm + 1.4;
    P.a_elX = (P.rx ?? P.x) + P.a_ox + sd * FZ_SC * (shx + Math.sin(aa) * L);
    P.a_elY = (P.ry ?? P.y) + P.a_oy + P.a_lf + FZ_SC * (shy + Math.cos(aa) * L);
  }
  // saç yayları: hız, ivme ve yerçekimine gecikmeli tepki (zıplarken havada süzülüş & inişte yaylanma)
  const lim = st === 'launch' ? 4.2 : 3.4;
  const inAir = !gr && (st === 'rise' || st === 'apex' || st === 'fall' || st === 'launch');
  const hairLoft = inAir ? (st === 'apex' ? -0.85 : vy > 120 ? -0.95 : -0.35) - Math.sin(t * 7.2) * 0.4 : 0;
  const tx = clamp(-lvx * 0.012, -3.2, 3.2) + (st === 'flip' ? -1.2 : 0) + (inAir ? Math.sin(t * 5.4) * 0.35 : 0);
  const ty = clamp(-vy * 0.0042, -lim, lim) + clamp(-P.a_hipV * 0.05, -1.5, 1.5) + (st === 'flip' ? -1.5 : 0) + (st === 'carry' ? 1.2 : 0)
    - P.a_esW * (2.6 + 0.8 * Math.sin(t * 9.1)) + hairLoft + cr * 1.8;   // inişte saçın yumuşakça çöküp toparlanması
  for (let i = 0; i < 2; i++) {
    const h = dt / 2;
    P.a_hvx += ((tx - P.a_hx) * 230 - P.a_hvx * 10) * h; P.a_hx += P.a_hvx * h;
    P.a_hvy += ((ty - P.a_hy) * 230 - P.a_hvy * 10) * h;
    P.a_hvx = clamp(P.a_hvx, -48, 48); P.a_hvy = clamp(P.a_hvy, -48, 48);   // fırlatmada bile saç bir karede sıçramasın
    P.a_hy += P.a_hvy * h;
  }
  P.a_hx = clamp(P.a_hx, -3.8, 3.8); P.a_hy = clamp(P.a_hy, -3.8, lim + 0.8);
  {   // giysi (etek ucu): hıza ters yönde sürüklenir, ivmelenince gecikir, yaylı sallanıp oturur
    const ctg = clamp(-P.vx * sd * 0.0085 - P.a_ax * 0.0009 + (st === 'launch' ? 0 : 0), -2.4, 2.4) * (carry ? 0.3 : 1);
    for (let i = 0; i < 2; i++) { const h = dt / 2; P.a_clv += ((ctg - P.a_cl) * 190 - P.a_clv * 11) * h; P.a_clv = clamp(P.a_clv, -40, 40); P.a_cl += P.a_clv * h; }
    P.a_cl = clamp(P.a_cl, -3, 3);
  }
  // önden pozlarda eller hedefe, önden görünüş belirdikten sonra yumuşakça gider (sıçrama olmasın)
  if (P.a_ikSrc) P.a_ikLast = P.a_ikSrc;
  P.a_ikW += (((P.a_ikSrc && P.a_fu >= 0.3) ? 1 : 0) - P.a_ikW) * (1 - Math.exp(-dt * 20));
  if (P.a_ikLast && (P.a_fu > 0 || P.a_ikW > 0.02)) {
    const w = P.a_ikW, src = P.a_ikLast;
    for (let i = 0; i < 2; i++) { const sd2 = i ? 1 : -1; FZ_IKB[i][0] = lerp(sd2 * 6.6, src[i][0], w); FZ_IKB[i][1] = lerp(1.6, src[i][1], w); FZ_IKB[i][2] = w > 0.5 ? src[i][2] : 0; }
    P.ik = FZ_IKB;
  } else { P.ik = null; P.a_ikW = 0; P.a_ikLast = null; }
  if (BOLUM_NO === 8 || BOLUM_NO === 11) fz8Adim(dt, t, gr);   // Bölüm 8: kostümün (Bölüm 11: pelerinin) ikincil hareketi
}

// ── ara sahne çizimi: fezaCizPoz(ctx, x, y, olcek, poz, tm, ara) ──
// Herhangi bir dönüşümle verilen ctx'e çizer; oyundaki Feza'nın durumuna dokunmaz.
// olcek 1 = oyundaki boy (≈62 birim); eksi olcek aynalar. Pozlar:
//   'uyku'   : yatakta yan yatmış uyuyor, kucağında bir şeye sarılmış. x,y = yatağın üstünde, poposunun altındaki
//              nokta (kalça bunun ~5 birim solunda, baş daha solda; eksi olcek → baş sağda). ara(ctx, kx, ky, olcek) verilirse kolların ARKASINA, gövdenin önüne çizilir
//              (Pırıl peluşu için); kx,ky = kucak noktası (ctx koordinatında).
//   'uyanis' : tm = pozun başından beri geçen saniye. 0–1.1 sn yattığı yerden doğrulur, 1.1–2.4 gözlerini ovuşturur,
//              2.4–3.6 kollarını açıp esner/gerinir, 3.6–4.2 kollar iner ve kocaman gülümser (sonra öyle kalır).
//              x,y = uyku ile aynı nokta (geçiş kesintisiz). Otururken bacaklar önden kısa görünür: üstüne yorgan çizin.
//   'uykuya_dalis' : 'uyku' ile aynı yatış/sarılma; tm = başından beri saniye. Gözler açık ve ağır, 0.5–2.4 sn arası 3 yavaş
//              göz kırpma, 1.5–2.8 sn bir büyük iç çekiş (küçük "o" ağız), ~3.05 sn'de gözler kapanır; 3 sn'den sonra 'uyku' ile aynı görünür.
//   'bakis'  : 'uyku' ile aynı yatış/sarılma, gözler açık, yukarıdaki Pırıl'a hayranlıkla bakar (ara sıra kırpar).
//   'sevinc' : önden, kollar havada zıplıyor (tm ile döngü). x,y = ayak tabanı (yer).
//   'ayakta' : önden ayakta, gülümsüyor. 'ayakta_yan' : yandan (3/4) ayakta, sağa bakar. x,y = ayak tabanı.
//   'uyanis' 3.6 sn'den sonra: kollar iner, omuzlar gevşer. ara verilmişse eller kucaktaki peluşu tutar (peluş sahne.js
//              SH_KUC_OTUR yerinde varsayılır), verilmemişse eller yorganın üstünde dinlenir.
//   'sarilma': oturuyor, Pırıl'ı yanağına bastırıp iki koluyla sarılıyor, gözler mutlulukla kapalı (göz kırpma anı ve bitiş ekranı).
//              x,y ve kucak noktası 'uyanis' ile aynı (geçiş kesintisiz). tm = pozun başından beri saniye: 0–1.4 sn eller
//              kucaktaki tutuştan (SH_KUC_OTUR) yanaktaki sarılmaya (SH_KUC_KIRP) smooth() ile kayar; sahne.js kirpK'yi aynı anda
//              (P.yak-0.2 … P.yak+1.2) yükselttiği için peluşla birlikte gider. Öneri: t >= P.yak-0.2 iken 'sarilma',
//              pozTm = t-(P.yak-0.2); bitiş ekranında pozTm büyük (ör. 9). SH_KUC_* değişirse feza.js FZ_PL_OTUR/FZ_PL_KIRP de değişmeli.
// Dönüş: kucak noktası {x, y} (ctx koordinatında).
const fzCS = { a_R: Object.assign({}, FZ_REST), a_hipY: 0, a_hx: 0, a_hy: 0, a_lidM: 1, vy: 0, ik: null, ikUst: false, ara: null, a_tilt: 0, a_noFar: false, a_cl: 0, a_kenar: false, a_yaw: 0 };
const FZ_BOS = {};
// yandan görünüşte kol hedefi (iki kemik; fzArm açılarıyla): omuz (sx,sy) → avuç merkezi (tx,ty), gövdenin eğik çerçevesinde.
// Dirsek aşağıda kalır. out[0] = üst kol açısı (aşağıdan, + ileri), out[1] = dirsek bükülmesi (+), out[2] = hedefe uzaklık / erişim
const FZ_IKO = [0, 0, 0];
function fzSideIK(sx, sy, tx, ty, al, out) {
  const L1 = FZ_UA * al, L2 = FZ_FA * al + 1.2, dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy) || 0.01, dd = clamp(d, 2, L1 + L2 - 0.05);
  const a0 = Math.atan2(dx, dy), ac = Math.acos(clamp((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), -1, 1)), a1 = a0 - ac;
  const kx = sx + Math.sin(a1) * L1, ky = sy + Math.cos(a1) * L1, hx = sx + dx / d * dd, hy = sy + dy / d * dd;
  out[0] = a1; out[1] = Math.atan2(hx - kx, hy - ky) - a1; out[2] = d / (L1 + L2);
  out[1] = ((out[1] + Math.PI) % 6.2832 + 6.2832) % 6.2832 - Math.PI;
  return out;
}
// kucaktaki peluş (sahne.js SH_KUC_OTUR / SH_KUC_KIRP ile aynı): kucak noktasına göre kayma (ölçek birimi) ve boy
const FZ_PL_OTUR = [4, 11, 1], FZ_PL_KIRP = [29, -15, 1.3];
// otururken peluşu tutan eller (kalçaya göre, önden): sol el peluşun yanağının altında, sağ el gövdesinin yanında
const FZ_TUT = [[-3.0, -1.2], [8.0, -0.8]];
// sarılma: eller peluşun merkezine göre (peluş birimi ×boy): sol el göğsünün önünden karnına, sağ el karnının yanına
const FZ_SAR = [[-12.0, 9.4], [-4.5, 11.5]];
function fzPlPos(k) {   // k: 0 kucakta … 1 yanağının yanında (sahne.js kirpK). Dönüş: peluş merkezi (kalçaya göre) ve boyu
  const dx = lerp(FZ_PL_OTUR[0], FZ_PL_KIRP[0], k), dy = lerp(FZ_PL_OTUR[1], FZ_PL_KIRP[1], k) - Math.sin(k * Math.PI) * 3;
  return [dx / FZ_SC, -6.5 + dy / FZ_SC, lerp(FZ_PL_OTUR[2], FZ_PL_KIRP[2], k)];
}
let fzTB = null;   // ışık tonu ara tuvali (önbellekli)
const FZ_GIR_SURE = 4.4;   // 'yatagaGir' süresi (sn); sonrası 'uykuya_dalis' tm=0
const FZ_UYAN = [   // t, yatış, sol el x,y, sağ el x,y, kapak, ağız açık, yuvarlak, gülüş, mutlu, baş, kaş, kollar üstte
  [0.0, 1, 2.0, -7.5, -2.2, -6.2, 0.05, 0.1, 0.4, 0.4, 0, 0.3, 0, 0],
  [0.5, 0.88, 2.0, -7.5, -2.2, -6.2, 0.05, 0.15, 0.4, 0.4, 0, 0.25, 0.1, 0],
  [1.1, 0, -2.5, -15.5, 2.5, -15.5, 0.05, 0.3, 0.7, 0.2, 0, -0.05, 0.3, 1],
  [1.4, 0, -3.4, -21.8, 3.4, -21.8, 0.05, 0.3, 0.8, 0.1, 0, 0.1, 0.4, 1],
  [2.4, 0, -3.4, -21.8, 3.4, -21.8, 0.05, 0.3, 0.8, 0.1, 0, -0.1, 0.4, 1],
  [2.9, 0, -12.6, -26.5, 12.6, -26.5, 0.05, 1.0, 0.9, 0, 0, -0.35, 0.8, 1],
  [3.6, 0, -13.0, -26.8, 13.0, -26.8, 0.05, 1.1, 0.9, 0, 0, -0.4, 0.8, 1],
  [3.85, 0, -10.6, -13.0, 10.6, -13.0, 0.5, 0.85, 0.9, 0.1, 0, -0.15, 0.8, 1],   // göz yarı aralanır
  [3.98, 0, -9.2, -3.0, 9.2, -3.0, 0.12, 0.7, 0.5, 0.5, 0, 0, 0.65, 0],       // tekrar kırpar (kapalı)
  [4.2, 0, -8.2, 1.8, 8.2, 1.8, 1, 0.6, 0, 1, 0, 0.1, 0.5, 0],
  [9.9, 0, -8.2, 1.8, 8.2, 1.8, 1, 0.6, 0, 1, 0, 0.1, 0.5, 0]];
function fezaCizPoz(ctx, x, y, olcek, poz, tm, ara, opt) {
  tm = tm || 0; let gT = null;
  const Q = fzCS, R = Object.assign(Q.a_R, FZ_REST);
  Q.ik = null; Q.ikUst = false; Q.ara = null; Q.a_hx = Q.a_hy = 0; Q.vy = 0; Q.a_tilt = 0; Q.a_shine = 0; Q.a_pil = 0; Q.a_isik = 0; Q.a_dim = null;
  Q.a_noFar = false; Q.a_cl = 0; Q.a_kenar = false; Q.a_suPoz = false;
  if (BOLUM_NO === 12) { Q.a_ayak12 = null; Q.a_kask12 = 0; }   // Bölüm 12 poz alanları (fz12Poz doldurur)
  Q.a_lidM = ((tm + 1.5) % 3.9) < 0.12 ? 0 : 1;
  let front = true, lie = 0, seated = false, seatT = false, rotA = 0, retX = null, retY = 0, piv = 0;
  const kos8 = fz8PozKos(poz, opt), eKos = fzKos, eM8 = fz8M;   // Bölüm 8 kostümü (yalnız bu çizim için; Bölüm 1–7'de null)
  if (kos8) { fz8CDoldur(poz, tm, opt, olcek); fz8IsikN = 0; fz8NkS = fz8NkA = false; }
  const b = Math.sin(tm * 2.2); R.breath = b; R.mSmile = 0.8;
  if (poz === 'uyku' || poz === 'uykuya_dalis' || poz === 'bakis') {
    lie = 1; seated = true; R.breath = Math.sin(tm * 1.5) * 1.4;
    R.lt1 = 0.9; R.lt2 = -1.3; R.bt1 = 0.8; R.bt2 = -1.2; R.lid = 0.05; Q.a_lidM = 1;
    R.mSmile = 0.4; R.mOpen = 0.1 + 0.05 * Math.sin(tm * 1.5); R.head = 0.3;
    if (poz === 'uykuya_dalis') {   // ağır kapaklar, 3 yavaş göz kırpma, ~3 sn'de kapanır; arada bir büyük iç çekiş (küçük "o" ağız)
      let lid = lerp(0.8, 0.45, clamp(tm / 2.6, 0, 1));
      for (let k = 0; k < 3; k++) { const u = (tm - 0.5 - k * 0.75) / 0.42; if (u > 0 && u < 1) lid = lerp(lid, 0.05, Math.sin(u * Math.PI)); }
      if (tm > 2.6) lid = lerp(lid, 0.05, smooth(clamp((tm - 2.6) / 0.45, 0, 1)));
      R.lid = lid; R.gy = 0.35 * (1 - lid); R.gx = 0.1; R.brow = 0.15 * (1 - clamp(tm / 3, 0, 1));
      const s = clamp((tm - 1.5) / 1.3, 0, 1), sg = Math.sin(s * Math.PI);   // iç çekiş: 1.5–2.8 sn
      if (tm > 2.75 && tm < 3.9) { const mu = Math.max(0, Math.sin((tm - 2.75) * 9)) * smooth(clamp((3.9 - tm) / 0.5, 0, 1)); R.mOpen = Math.max(R.mOpen, 0.05 + 0.3 * mu); R.mSmile = 0.25 + 0.2 * (1 - mu); }   // uykuya dalarken kısa mırıltı: dudaklar iki kez kıpırdar
      R.breath += 2.4 * sg; R.mRound = sg > 0.35 ? 1 : 0; R.mOpen = lerp(R.mOpen, 0.42, sg > 0.35 ? sg : 0); R.mSmile = lerp(0.4, 0.15, sg);
    } else if (poz === 'bakis') {   // gözler açık, yukarıdaki parlayan Pırıl'a hayranlıkla bakar (yatarken ekranda yukarı = yerel +x)
      R.lid = 1.08; Q.a_lidM = ((tm + 0.7) % 3.4) < 0.13 ? 0 : 1; R.gx = 1; R.gy = -0.1;
      R.mRound = 0.55; R.mOpen = 0.45 + 0.06 * Math.sin(tm * 1.3); R.mSmile = 0.6; R.brow = 0.6; R.head = 0.15;
    }
    Q.ik = [[2.0, -7.5 + 0.2 * R.breath, 0], [-2.2, -6.2 + 0.2 * R.breath, 0]];
    Q.a_hx = -2.5;
  } else if (poz === 'uyanis') {
    seated = true;
    let i = 0; while (i < FZ_UYAN.length - 2 && tm >= FZ_UYAN[i + 1][0]) i++;
    const A = FZ_UYAN[i], B = FZ_UYAN[i + 1], w = smooth(clamp((tm - A[0]) / (B[0] - A[0]), 0, 1)), L = j => lerp(A[j], B[j], w);
    lie = L(1);
    R.lt1 = lerp(1.45, 0.9, lie); R.lt2 = lerp(-0.1, -1.3, lie); R.bt1 = lerp(1.4, 0.8, lie); R.bt2 = lerp(-0.12, -1.2, lie);
    let rub = 0; if (tm > 1.3 && tm < 2.5) rub = Math.sin(clamp((tm - 1.3) / 1.2, 0, 1) * Math.PI);
    const rx = Math.cos(tm * 13) * 0.8 * rub, ry = Math.sin(tm * 13) * 0.6 * rub;
    Q.ik = [[L(2) + rx, L(3) + ry, 0], [L(4) - rx, L(5) + ry, 0]];
    if (tm > 0.4 && tm < 1.15) {   // yorgan itme: eller yorganı yukarı-geri iter, ayak ucu yorgan altında kıpırdar
      const pu = Math.sin(clamp((tm - 0.4) / 0.75, 0, 1) * Math.PI) * (1 - smooth(clamp((tm - 0.8) / 0.3, 0, 1)) * 0.3);
      Q.ik[0][0] += 3.2 * pu; Q.ik[0][1] -= 3.5 * pu; Q.ik[1][0] += 3.0 * pu; Q.ik[1][1] -= 2.5 * pu; R.shr += 0.3 * pu;
    }
    if (tm < 1.0) { const fw = Math.sin(clamp(tm / 1.0, 0, 1) * Math.PI), wg = Math.sin(tm * 14) * 0.16 * fw; R.lt1 += wg; R.bt1 -= wg * 0.8; }
    const gerin = smooth(clamp((tm - 2.5) / 0.4, 0, 1)) * smooth(clamp((4.0 - tm) / 0.4, 0, 1));
    Q.ik[0][2] = Q.ik[1][2] = gerin; R.arm = 1 + 0.27 * gerin;
    Q.ikUst = L(13) > 0.5;
    R.lid = L(6); if (R.lid < 0.2) Q.a_lidM = 1;
    if (tm < 0.55) { const kp = Math.sin(clamp(tm / 0.55, 0, 1) * Math.PI); R.head += 0.1 * Math.sin(tm * 11) * kp; R.brow += 0.25 * kp; R.lid = 0.05 + 0.12 * kp; R.mSmile = 0.25; R.mOpen = 0.1 + 0.12 * kp; }   // kıpırdanma: kaşlar kalkar, kafa hafif döner
    if (tm > 4.2) R.gx = 0.2 * Math.sin(tm * 0.7);
    R.mOpen = L(7); R.mRound = L(8); R.mSmile = L(9); R.head = L(11); R.brow = L(12);
    if (tm > 4.0) { R.happy = clamp((4.6 - tm) / 0.3, 0, 1) > 0.5 ? 1 : 0; R.gx = 0.2 * Math.sin(tm * 0.7); }
    Q.a_shine = smooth(clamp((tm - 4.6) / 0.6, 0, 1));
    R.breath = b * (1 - lie * 0.5);
    Q.a_hx = -2.5 * lie;
    const wh = smooth(clamp((tm - 3.6) / 0.6, 0, 1));
    if (wh > 0) {   // kollar iner: omuzlar gevşer; kucakta peluş varsa eller onu tutar, yoksa yorganın üstünde dinlenir
      R.shr = -0.35 * wh; R.arm = lerp(R.arm, 1, wh);
      for (let i = 0; i < 2; i++) {
        const tx = typeof ara === 'function' ? FZ_TUT[i][0] : (i ? 6.8 : -6.8), ty = (typeof ara === 'function' ? FZ_TUT[i][1] : 0.8) + 0.15 * R.breath;
        Q.ik[i][0] = lerp(Q.ik[i][0], tx, wh); Q.ik[i][1] = lerp(Q.ik[i][1], ty, wh);
      }
      if (tm > 4.2) { R.mSmile = 1; R.mOpen = lerp(0.6, 0.4, smooth(clamp((tm - 4.6) / 0.8, 0, 1))); R.gy = 0.15; }
    }
  } else if (poz === 'sarilma') {   // oturuyor, peluşu yanağına bastırıp sarılıyor; gözler mutlulukla kapalı
    seated = true;
    const k = smooth(clamp(tm / 1.4, 0, 1)), [px, py, ps] = fzPlPos(k);
    R.lt1 = 1.45; R.lt2 = -0.1; R.bt1 = 1.4; R.bt2 = -0.12;
    Q.a_tilt = 0.045 * k; R.head = 0.45 * k; R.shr = -0.35 + 0.25 * k; R.arm = 1 + 0.14 * k;
    const ca = Math.cos(-Q.a_tilt), sa = Math.sin(-Q.a_tilt), sq = 0.35 * Math.sin(tm * 2.1) * k;   // hafif sıkıp bırakma
    Q.ik = [[0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 2; i++) {
      const hx = px + lerp(FZ_TUT[i][0] - fzPlPos(0)[0], FZ_SAR[i][0] * ps / FZ_SC + sq, k);
      const hy = py + lerp(FZ_TUT[i][1] - fzPlPos(0)[1], FZ_SAR[i][1] * ps / FZ_SC, k) + 0.15 * R.breath * (1 - k);
      Q.ik[i][0] = hx * ca - hy * sa; Q.ik[i][1] = hx * sa + hy * ca;
    }
    R.mSmile = 1; R.mOpen = lerp(0.4, 0.3, k); R.brow = lerp(0.5, 0.35, k); R.gy = 0.15;
    if (k > 0.55) R.happy = 1;
    R.breath = b;
  } else if (poz === 'yatagaGir') {   // ayakta (yatağın önünde) → kenara oturur → uzanır → 'uykuya_dalis' tm=0 ile aynı duruş (süre FZ_GIR_SURE)
    seated = true;
    const gx0 = opt && opt.gx != null ? opt.gx : 8, gy0 = opt && opt.gy != null ? opt.gy : 11;
    const e = (a, b2) => smooth(clamp((tm - a) / (b2 - a), 0, 1));
    const eSit = e(0.9, 1.9), eLie = e(1.9, 3.4), eSet = e(3.4, FZ_GIR_SURE);
    lie = eLie;
    const stU = 1 - eSit;   // 1 ayakta … 0 oturmuş
    R.lt1 = lerp(lerp(0.04, 1.45, eSit), 0.9, lie); R.lt2 = lerp(lerp(-0.08, -0.1, eSit), -1.3, lie);
    R.bt1 = lerp(lerp(-0.04, 1.4, eSit), 0.8, lie); R.bt2 = lerp(lerp(-0.06, -0.12, eSit), -1.2, lie);
    const b0 = Math.sin(tm * 2.2);
    R.breath = lerp(b0, Math.sin(0) * 1.4, eLie);
    // yüz: gülümseyen → uykulu; 0.3–0.9 sn küçük esneme; uyku yüzüne bağlanır
    const yw = Math.sin(clamp((tm - 0.3) / 0.6, 0, 1) * Math.PI);
    const lidU = lerp(lerp(1, 0.6, e(0.2, 1.2)), 0.8, eLie) * (1 - 0.35 * yw);
    R.lid = lidU; Q.a_lidM = tm < 0.8 ? (((tm + 1.5) % 3.9) < 0.12 ? 0 : 1) : 1;
    R.mSmile = lerp(lerp(1, 0.7, e(0, 1.2)), 0.4, eLie); R.mOpen = lerp(lerp(0.25, 0.2, e(0, 1)), 0.1, eLie) + 0.5 * yw * (1 - eLie); R.mRound = yw * 0.8;
    R.brow = lerp(lerp(0.2, 0.05, e(0, 1.2)), 0.15, eLie); R.head = lerp(lerp(0, 0.1, eSit), 0.3, lie);
    R.gx = lerp(0.3, 0.1, eLie); R.gy = lerp(0, 0.07, eLie);
    R.mSmile = lerp(R.mSmile, 0.15, 0.6 * yw);
    // kollar: ayakta serbest (la1/ba1 ile aynı uç), sonra yatağa dayanır, sonra uyku sarılma konumu
    const by0 = -0.28 * R.breath - R.shr, sh0 = [[-5.5, -11 + by0], [5.5, -11 + by0]];
    const a1 = [0.12 + 0.04 * b0, 0.12 + 0.04 * b0], a2v = [R.ba2, R.la2];
    Q.ik = [[0, 0, 0], [0, 0, 0]];
    const lieT = [[2.0, -7.5 + 0.2 * R.breath], [-2.2, -6.2 + 0.2 * R.breath]], sitT = [[-6.8, 0.8], [6.8, 0.8]];
    for (let i = 0; i < 2; i++) {
      const sd = i ? 1 : -1, ex = sh0[i][0] + sd * (0.5 + 0.3 * FZ_UA * Math.abs(Math.sin(a1[i]))), ey = sh0[i][1] + FZ_UA * Math.cos(a1[i]);
      const b2 = a1[i] + a2v[i], wx = ex + sd * (0.2 + 0.25 * FZ_FA * Math.abs(Math.sin(b2))), wy = ey + FZ_FA * Math.cos(b2);
      const sx = wx + sd * 0.0, sy = wy + 1.0, mid = [lerp(sx, sitT[i][0], eSit), lerp(sy, sitT[i][1], eSit)];
      Q.ik[i][0] = lerp(mid[0], lieT[i][0], lie); Q.ik[i][1] = lerp(mid[1], lieT[i][1], lie);
    }
    Q.a_hx = -2.5 * lie;
    gT = [gx0, gy0]; gT.sit = eSit;
  } else if (poz === 'binis' || poz === 'kayma') {   // Bölüm 3: Pırıl'ın sırtında / gökkuşağından kayarken (yandan, oturur; rüzgârda saç ve giysi)
    front = false;
    const o = opt && typeof opt === 'object' ? opt : FZ_BOS, vy = +o.vy || 0, dive = clamp(vy / 320, -1, 1);
    const rz = o.ruzgar != null ? clamp(+o.ruzgar, 0, 1) : o.hiz != null ? clamp(+o.hiz, 0, 1) : 1;
    rotA = +o.aci || 0; Q.a_kenar = true;
    fzSwF = 9.5; fzSwA = 1 + 4 * rz;   // tutamlar rüzgârda hızlı ve geniş titrer
    Q.a_cl = (-1.9 + 0.5 * Math.sin(tm * 13.7) + 0.3 * Math.sin(tm * 21.3)) * rz;   // gömlek eteği geriye savrulur, çırpınır
    Q.a_hx = (-4.4 + 0.5 * Math.sin(tm * 8.3)) * rz; Q.a_hy = clamp(-vy * 0.004, -2.5, 2.5) - 0.5 * rz + 0.45 * Math.sin(tm * 6.1) * rz;
    const w7 = typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 7 ? fz7Karisim(poz, tm) : 0;   // Bölüm 7 kızak: binis ↔ kayma geçişi ~0,22 sn'de karışır (sıçrama olmasın)
    const kol = pp => {
    if (pp === 'binis') {
      Q.a_noFar = true;
      let sv;   // sevinç: kolunu kaldırıp "yihuu" (verilmezse ~5,6 sn'de bir, 1,5 sn)
      if (o.sevinc != null) sv = smooth(clamp(+o.sevinc, 0, 1));
      else { const c = (tm + 1.6) % 5.6; sv = smooth(clamp(c / 0.35, 0, 1)) * smooth(clamp((1.5 - c) / 0.4, 0, 1)); }
      const kk = Math.sin(tm * 4.2), kk2 = Math.sin(tm * 4.2 + 1.3);   // ayaklar keyifle sallanır
      R.lt1 = 0.95 + 0.07 * kk2; R.lt2 = -1.05 + 0.24 * kk; R.bt1 = R.lt1; R.bt2 = R.lt2;
      R.breath = Math.sin(tm * 2.6) * 0.6; R.shr = 0.2 + 0.08 * Math.sin(tm * 5.2) + 0.25 * sv;
      R.head = -0.1 - 0.1 * sv + 0.035 * Math.sin(tm * 3.1) + 0.06 * dive; R.gx = 0.9; R.gy = -0.15 + 0.6 * Math.max(0, dive) - 0.3 * sv;
      R.mSmile = 1; R.mOpen = 0.42 + 0.48 * sv + 0.25 * Math.max(0, dive) * (1 - sv); R.mRound = 0.45 * Math.max(0, dive) * (1 - sv);
      R.happy = sv > 0.45 ? 1 : 0; R.brow = 0.3 + 0.35 * sv + 0.3 * Math.abs(dive); R.lid = 1.05;
      const hip = -Math.max(fzFy(R.lt1, R.lt2), fzFy(R.bt1, R.bt2)), sx1 = olcek * FZ_SC, sy1 = Math.abs(sx1);
      // tutunma noktası (oturma noktasına göre ctx birimi → yerel, döndürmeden önceki çerçeve)
      let ex = o.el && o.el.x != null ? +o.el.x : 17 * olcek, ey = o.el && o.el.y != null ? +o.el.y : -10 * Math.abs(olcek);
      if (rotA) { const c = Math.cos(-rotA), s = Math.sin(-rotA), ex2 = ex * c - ey * s; ey = ex * s + ey * c; ex = ex2; }
      const tbx = ex / sx1, tby = ey / sy1 + hip + 3.2, by = -0.28 * R.breath - R.shr;
      // gerekirse öne eğilir (jokey gibi), kollar biraz uzar: el boyuna yetişsin
      let lean = 0.18, al = 1;
      for (let k = 0; k < 12; k++) {
        const c = Math.cos(-lean), s = Math.sin(-lean), qx = tbx * c - (tby - hip) * s, qy = tbx * s + (tby - hip) * c;
        fzSideIK(1.2, -11.4 + by, qx, qy, al, FZ_IKO);
        if (FZ_IKO[2] <= 0.96) break;
        if (lean < 0.4) lean += 0.04; else if (al < 1.26) al += 0.03; else break;   // çok öne kapanmasın: önce biraz eğilir, sonra kollar (çizgi film gibi) uzar
      }
      lean += 0.02 * Math.sin(tm * 2.1) - 0.1 * sv;
      R.lean = lean; R.arm = al; R.hx = 0; R.head -= (lean - 0.18) * 0.75;   // çok eğilince başını kaldırıp ileri bakar
      const c = Math.cos(-lean), s = Math.sin(-lean), qx = tbx * c - (tby - hip) * s, qy = tbx * s + (tby - hip) * c;
      fzSideIK(1.2, -11.4 + by, qx, qy, al, FZ_IKO);
      const wv = Math.sin(tm * 10.5);
      R.la1 = lerp(FZ_IKO[0], 2.02 + 0.14 * wv, sv); R.la2 = lerp(FZ_IKO[1], 0.22 + 0.12 * wv, sv); R.hOpen = sv; R.arm = lerp(al, 1.1, sv);
      fzSideIK(-0.8, -11.8 + by * 0.6, qx - 0.4, qy - 0.9, al, FZ_IKO);
      R.ba1 = FZ_IKO[0]; R.ba2 = FZ_IKO[1];
      retX = x + ex * Math.cos(rotA) - ey * Math.sin(rotA); retY = y + ex * Math.sin(rotA) + ey * Math.cos(rotA);
    } else {   // kayma: bacaklar önde uzanmış, gövde hafif geride, iki kol havada "yihuu"
      const k1 = Math.sin(tm * 5.1), wv = Math.sin(tm * 8.5);
      R.lt1 = 1.42 + 0.05 * k1; R.lt2 = -0.1 - 0.12 * Math.max(0, k1); R.bt1 = 1.3 + 0.05 * Math.sin(tm * 5.1 + 1.9); R.bt2 = -0.24;
      R.lean = -0.27 + 0.03 * Math.sin(tm * 3.3); R.hx = -0.6; R.breath = Math.sin(tm * 2.9) * 0.5;
      R.la1 = 1.74 + 0.13 * wv; R.la2 = 0.22 + 0.12 * Math.sin(tm * 8.5 + 1); R.ba1 = 2.02 - 0.12 * wv; R.ba2 = 0.25; R.hOpen = 1; R.arm = 1.12; R.shr = 0.6;
      const eo = ((tm + 0.6) % 3.4) < 1.1;   // ara sıra gözlerini kocaman açıp aşağı bakar, sonra yine ^ ^ güler
      R.happy = eo ? 0 : 1; R.lid = 1.12; R.gx = 0.9; R.gy = 0.45; R.brow = eo ? 0.75 : 0.55;
      R.mSmile = 1; R.mOpen = 0.82 + 0.12 * Math.sin(tm * 4); R.mRound = eo ? 0.25 : 0; R.head = -0.08 + 0.03 * Math.sin(tm * 3.3);
    }
    };
    if (w7 > 0.001) {   // önce öbür poz (eski), alanları saklanır; sonra asıl poz, eskiye doğru w7 kadar karıştırılır
      const nf = Q.a_noFar, rx0 = retX, ry0 = retY;
      kol(poz === 'binis' ? 'kayma' : 'binis');
      for (let i = 0; i < FZ7_KAR.length; i++) FZ7_TMP[i] = R[FZ7_KAR[i]];
      Q.a_noFar = nf; retX = rx0; retY = ry0;
      kol(poz);
      for (let i = 0; i < FZ7_KAR.length; i++) R[FZ7_KAR[i]] = lerp(R[FZ7_KAR[i]], FZ7_TMP[i], w7);
      if (poz === 'kayma' && w7 > 0.5) Q.a_noFar = true;   // binis'te uzak bacak gizli: yarıdan sonra görünür
    } else kol(poz);
    seatT = true;
  } else if (poz === 'yuzme' || poz === 'denizBinek') {
    front = false; const o = opt || FZ_BOS, sit = poz === 'denizBinek' ? smooth(clamp(+o.otur || 0, 0, 1)) : 0;
    fzSuHedef(R, tm * 4.0, 0.8, 0, tm); Q.a_suPoz = true;
    const sw = Math.sin(tm * 2.2), leg = 0.035 * sw;
    R.lt1 = lerp(R.lt1, 0.95 + leg, sit); R.lt2 = lerp(R.lt2, -1.05 - leg, sit);
    R.bt1 = lerp(R.bt1, 0.92 - leg * 0.7, sit); R.bt2 = lerp(R.bt2, -1.0 + leg * 0.5, sit);
    Q.a_hx = -0.65; Q.a_hy = 0.2 * Math.sin(tm * 2); Q.a_cl = 0.2 * Math.sin(tm * 2.6);
    if (sit > 0) {
      const hip = -Math.max(fzFy(R.lt1, R.lt2), fzFy(R.bt1, R.bt2)), lean = (0.18 + 0.015 * sw) * sit, al = 1.12;
      const tbx = 17 / FZ_SC, tby = -10 / FZ_SC + hip + 3.2, c = Math.cos(-lean), s = Math.sin(-lean), qx = tbx * c - (tby - hip) * s, qy = tbx * s + (tby - hip) * c;
      const by = -0.28 * R.breath - R.shr; fzSideIK(1.2, -11.4 + by, qx, qy, al, FZ_IKO);
      R.la1 = lerp(R.la1, FZ_IKO[0], sit); R.la2 = lerp(R.la2, FZ_IKO[1], sit);
      fzSideIK(-0.8, -11.8 + by * 0.6, qx - 0.4, qy - 0.9, al, FZ_IKO);
      R.ba1 = lerp(R.ba1, FZ_IKO[0], sit); R.ba2 = lerp(R.ba2, FZ_IKO[1], sit); R.arm = lerp(R.arm, al, sit); R.lean = lean; Q.a_noFar = sit > 0.7;
      R.head = lerp(R.head, -0.09 + 0.025 * Math.sin(tm * 1.7), sit); R.hOpen = lerp(R.hOpen, 0.18, sit);
    }
    rotA = lerp(1.32 + clamp((+o.vy || 0) / 360, -0.6, 0.6), +o.aci || 0, sit); seatT = poz === 'denizBinek';
  } else if (poz === 'supurge' || poz === 'binis9') {   // Bölüm 8: süpürgede ata biner gibi oturur (yandan, sağa uçar); iki el sapta, ayaklar sallanır; saç ve kostüm rüzgârda
    // Bölüm 9 'binis9': Büyükanne Ejderha'nın sırtında aynı ata biniş; eller boynundaki örgü atkıda (vars. biraz daha yukarıda), bacaklar geniş sırtın iki yanına sarkar
    front = false; const b9 = poz === 'binis9';
    const o = opt && typeof opt === 'object' ? opt : FZ_BOS, vy = +o.vy || 0, dive = clamp(vy / 320, -1, 1);
    const rz = o.ruzgar != null ? clamp(+o.ruzgar, 0, 1) : b9 ? 0.8 : 0.7;
    rotA = +o.aci || 0; Q.a_kenar = true; Q.a_noFar = true;
    fzSwF = 9.5; fzSwA = 1 + 4 * rz;
    Q.a_cl = (-1.9 + 0.5 * Math.sin(tm * 13.7) + 0.3 * Math.sin(tm * 21.3)) * rz;
    Q.a_hx = (-4.4 + 0.5 * Math.sin(tm * 8.3)) * rz; Q.a_hy = clamp(-vy * 0.004, -2.5, 2.5) - 0.5 * rz + 0.45 * Math.sin(tm * 6.1) * rz;
    const sv = o.sevinc != null ? smooth(clamp(+o.sevinc || 0, 0, 1)) : 0, sl = o.salla != null ? smooth(clamp(+o.salla || 0, 0, 1)) : 0, up = Math.max(sv, sl);
    const kk = Math.sin(tm * 4.6), kk2 = Math.sin(tm * 4.6 + 1.3);   // sapın iki yanında sarkan bacaklar keyifle sallanır
    R.lt1 = (b9 ? 0.78 : 0.6) + 0.08 * kk2; R.lt2 = (b9 ? -0.95 : -0.74) + 0.26 * kk; R.bt1 = R.lt1; R.bt2 = R.lt2;
    R.breath = Math.sin(tm * 2.6) * 0.6; R.shr = 0.2 + 0.08 * Math.sin(tm * 5.2) + 0.25 * up;
    R.head = -0.08 - 0.1 * sv - 0.18 * sl + 0.035 * Math.sin(tm * 3.1) + 0.06 * dive; R.gx = lerp(0.9, 0.45, sl); R.gy = -0.15 + 0.6 * Math.max(0, dive) * (1 - up) - 0.3 * sv - 0.6 * sl;
    R.mSmile = 1; R.mOpen = 0.42 + 0.48 * sv + 0.3 * sl + 0.25 * Math.max(0, dive) * (1 - up); R.mRound = 0.45 * Math.max(0, dive) * (1 - up);
    R.happy = sv > 0.45 || (sl > 0.5 && (tm % 2.6) < 1.1) ? 1 : 0; R.brow = 0.3 + 0.35 * up + 0.3 * Math.abs(dive); R.lid = 1.05;
    const hip = -Math.max(fzFy(R.lt1, R.lt2), fzFy(R.bt1, R.bt2)), sx1 = olcek * FZ_SC, sy1 = Math.abs(sx1);
    let ex = o.el && o.el.x != null ? +o.el.x : 17 * olcek, ey = o.el && o.el.y != null ? +o.el.y : (b9 ? -4 : 1) * Math.abs(olcek);
    if (rotA) { const c = Math.cos(-rotA), s = Math.sin(-rotA), ex2 = ex * c - ey * s; ey = ex * s + ey * c; ex = ex2; }
    const tbx = ex / sx1, tby = ey / sy1 + hip + 3.2, by = -0.28 * R.breath - R.shr;
    let lean = 0.2, al = 1;   // sapı tutmak için öne eğilir (jokey gibi), gerekirse kollar çizgi film gibi uzar
    for (let k = 0; k < 14; k++) {
      const c = Math.cos(-lean), s = Math.sin(-lean), qx = tbx * c - (tby - hip) * s, qy = tbx * s + (tby - hip) * c;
      fzSideIK(1.2, -11.4 + by, qx, qy, al, FZ_IKO);
      if (FZ_IKO[2] <= 0.96) break;
      if (lean < 0.52) lean += 0.04; else if (al < 1.3) al += 0.03; else break;
    }
    lean += 0.02 * Math.sin(tm * 2.1) - 0.1 * up;
    R.lean = lean; R.arm = al; R.hx = 0; R.head -= (lean - 0.2) * 0.75;
    const c = Math.cos(-lean), s = Math.sin(-lean), qx = tbx * c - (tby - hip) * s, qy = tbx * s + (tby - hip) * c;
    fzSideIK(1.2, -11.4 + by, qx, qy, al, FZ_IKO);
    // serbest (yakın) kol: "yihuu" (öne-yukarı) / aya el sallama (kol öne uzanır, ön kol yukarıda bilekten sallanır; el yüzün önüne gelmez)
    const wv = Math.sin(tm * 10.5), ua = lerp(2.02 + 0.14 * wv, b9 ? 2.1 + 0.05 * Math.sin(tm * 3.2) : 1.7 + 0.05 * Math.sin(tm * 3.2), sl), ub = lerp(0.22 + 0.12 * wv, b9 ? 0.3 + 0.32 * Math.sin(tm * 11) : 0.95 + 0.35 * Math.sin(tm * 11), sl);   // Bölüm 9: el uzakta, yüzün önüne gelmez
    R.la1 = lerp(FZ_IKO[0], ua, up); R.la2 = lerp(FZ_IKO[1], ub, up); R.hOpen = up; R.arm = lerp(al, lerp(1.1, 1.28, sl), up);
    fzSideIK(-0.8, -11.8 + by * 0.6, qx - 0.5, qy - 0.9, al, FZ_IKO);
    R.ba1 = FZ_IKO[0]; R.ba2 = FZ_IKO[1];
    retX = x + ex * Math.cos(rotA) - ey * Math.sin(rotA); retY = y + ex * Math.sin(rotA) + ey * Math.cos(rotA);
    if (kos8) {   // sepet sapta, ellerin biraz önünde asılı (yerel çizim çerçevesi)
      const dx = tbx, dy = tby - (hip + 3.2), dl = Math.hypot(dx, dy) || 1;
      FZ8_C.sapX = tbx + dx / dl * 7.2; FZ8_C.sapY = tby + dy / dl * 7.2 - 0.4;
    }
    seatT = true;
  } else if (poz === 'dans8') {   // Bölüm 8 final dansı (önden döngü; ölçü 2 sn = 4 vuruş, 120 BPM): sek-sek kollar havada · el çırp · kostüm gösterisi
    const bt = tm % 2.0, fb = Math.min(3, Math.floor(bt / 0.5)), fu = bt / 0.5 - fb, hop = Math.sin(Math.PI * clamp((fu - 0.08) / 0.62, 0, 1)), wv = Math.sin(tm * 14);
    R.happy = 1; R.mSmile = 1; R.mOpen = 0.85; R.brow = 0.5; R.arm = 1.15; R.mRound = 0;
    const leg = h => { R.lt1 = 0.05 + 0.4 * h; R.lt2 = -0.1 - 0.7 * h; R.bt1 = 0.3 * h; R.bt2 = -0.1 - 0.6 * h; };
    if (fb < 2) { R.bob = -4.5 * hop; leg(hop); Q.ik = [[-12.4 - wv * 0.8, -25.5 + Math.abs(wv) * 0.8, 1], [12.4 - wv * 0.8, -25.5 + Math.abs(wv) * 0.8, 1]]; }
    else if (fb === 2) { const s2 = Math.abs(Math.sin(fu * 6.2832)); R.bob = -1.2 * s2; leg(0.15 * (1 - s2)); Q.ik = [[-(0.9 + 5.2 * s2), -7.6 - 1.6 * s2, 1], [0.9 + 5.2 * s2, -7.6 - 1.6 * s2, 1]]; }
    else {
      const ks = kos8 || 'cadi';
      if (ks === 'cadi') { const a = fu * 6.2832; R.bob = -2.5 * hop; leg(0.5 * hop); Q.ik = [[-12.6 + Math.cos(a) * 3.0, -23.5 + Math.sin(a) * 2.4, 1], [7.4, -1.0 - 1.2 * hop, 0]]; FZ8_C.don = a; R.gx = -0.6; R.gy = -0.8; }
      else if (ks === 'kabak') { Q.a_tilt = 0.17 * Math.sin(fu * Math.PI * 2); R.bob = -1.4 * hop; leg(0.3 * hop); Q.ik = [[-8.2, -4.6, 0], [8.2, -4.6, 0]]; }
      else if (ks === 'iskelet') { const s1 = Math.sin(tm * 31), s3 = Math.cos(tm * 27); R.shr = 0.45 + 0.35 * Math.sin(tm * 25); R.bob = -1.2 * Math.abs(Math.sin(tm * 13)); R.lt1 = 0.1 + 0.12 * s1; R.bt1 = 0.1 - 0.12 * s1; R.lt2 = R.bt2 = -0.3; Q.ik = [[-13.2 + 1.4 * s1, -15 + 1.8 * s3, 1], [13.2 - 1.4 * s1, -15 - 1.8 * s3, 1]]; R.mOpen = 0.95; }
      else { const fl = 0.5 - 0.5 * Math.cos(fu * 6.2832); R.bob = -4.2 * (1 - fl); leg(0.6 * (1 - fl)); Q.ik = [[-lerp(12.6, 13.4, fl), lerp(-26, -7.5, fl), 1], [lerp(12.6, 13.4, fl), lerp(-26, -7.5, fl), 1]]; FZ8_C.kn = 1; }
    }
    Q.a_hy = Math.cos(fu * 6.2832) * 1.6;
  } else if (poz === 'ucus11' || poz === 'dans11') {   // Bölüm 11: pelerinle süzülme / Ay Balosu valsi (fz11Poz)
    const r11 = fz11Poz(poz, tm, opt, R, Q, olcek, x, y);
    front = r11.front; rotA = r11.rotA; piv = r11.piv;
  } else if (BOLUM_NO === 12 && typeof fz12Poz === 'function' && FZ12_TAM[poz]) {   // Bölüm 12: scooter, bisiklet, biniş/iniş, kayık, bağdaş, sarılma (fezapoz12.js)
    const r12 = fz12Poz(poz, tm, opt, R, Q, olcek, x, y);
    front = r12.front; rotA = r12.rotA;
  } else if (poz === 'sarilYumurta') {   // Bölüm 9: üşüyen yumurtaya sevgiyle sarılma (yandan, yumurtaya dönük; yumurta Feza'dan ÖNCE çizilir)
    // u: 0–.16 diz çöküp uzanır · .16–.84 iki kolla sarar, yanağını yaslar, gözler ^ ^, iki kez sıkar · .84–1 doğrulur, mutlu bakar
    front = false;
    const o = opt && typeof opt === 'object' ? opt : FZ_BOS, u = o.u != null ? clamp(+o.u || 0, 0, 1) : clamp(tm / 2.5, 0, 1);
    const k = smooth(clamp(u / 0.16, 0, 1)) * (1 - smooth(clamp((u - 0.86) / 0.14, 0, 1))), hu = clamp((u - 0.16) / 0.68, 0, 1);
    const sq = Math.max(0, Math.sin(hu * Math.PI * 4 - 0.3)) * k, sw = Math.sin(tm * 2.4) * k;   // iki sıkma + hafif beşik sallanması
    const d = (o.d != null ? +o.d : 21) / FZ_SC, rr = (o.r != null ? +o.r : 16) / FZ_SC, hh = (o.h != null ? +o.h : 40) / FZ_SC;
    R.lt1 = lerp(0.04, 0.3, k); R.lt2 = lerp(-0.08, -1.86, k); R.bt1 = lerp(-0.04, 0.18, k); R.bt2 = lerp(-0.06, -1.74, k);   // diz çöker
    R.lean = lerp(0.03, 0.27 + 0.05 * sq + 0.025 * sw, k); R.hx = lerp(0, 0.6, k);
    R.head = lerp(0.02, 0.3 + 0.06 * sq, k); R.breath = b * (1 - 0.5 * k); R.shr = 0.12 * sq;
    const bak = u < 0.16 ? 1 : u > 0.86 ? smooth(clamp((u - 0.86) / 0.1, 0, 1)) : 0;   // önce/sonra yumurtaya bakar (açık göz), sarılırken ^ ^
    R.happy = bak > 0.5 ? 0 : 1; R.gx = 0.85; R.gy = 0.45 * bak; R.lid = 1.05; R.mSmile = 1; R.mOpen = lerp(0.3, 0.12 + 0.12 * sq, k); R.mRound = 0; R.brow = 0.35 + 0.15 * bak;
    const hip = -Math.max(fzFy(R.lt1, R.lt2), fzFy(R.bt1, R.bt2)), by = -0.28 * R.breath - R.shr, c = Math.cos(-R.lean), s = Math.sin(-R.lean);
    const yer = (tx, ty, sx, sy, out) => {   // yumurta yüzeyindeki hedef (ayağa göre yerel) → eğik gövde çerçevesinde kol açıları
      const qx = (tx - R.hx) * c - (ty - hip) * s, qy = (tx - R.hx) * s + (ty - hip) * c;
      let al = 1; for (let i = 0; i < 8; i++) { fzSideIK(sx, sy, qx, qy, al, out); if (out[2] <= 0.97 || al >= 1.28) break; al += 0.04; }
      return al;
    };
    const al1 = yer(d + rr * 0.12, -hh * (0.5 + 0.02 * sq), 1.2, -11.4 + by, FZ_IKO);
    R.la1 = lerp(0.12 + 0.04 * b, FZ_IKO[0], k); R.la2 = lerp(0.35, FZ_IKO[1] - 0.12 * sq, k); R.hOpen = k; R.arm = lerp(1, al1, k);
    yer(d - rr * 0.05, -hh * 0.68, -0.8, -11.8 + by * 0.6, FZ_IKO);
    R.ba1 = lerp(-0.1 + 0.03 * b, FZ_IKO[0], k); R.ba2 = lerp(0.3, FZ_IKO[1] - 0.1 * sq, k);
    Q.a_kenar = true; Q.a_hx = -0.6 * k; Q.a_hy = 0.25 * sw;
    { const hc = Math.cos(R.lean), hs = Math.sin(R.lean), lx = 3.2 + 4.6, ly = -22.1 + by + 2.5;   // yanağın değdiği nokta (dönüş değeri)
      const wx = R.hx + lx * hc - ly * hs, wy = hip + lx * hs + ly * hc, sc0 = olcek * FZ_SC;
      retX = x + wx * sc0; retY = y + wy * Math.abs(sc0); }
  } else if (poz === 'meyveUzat') {   // Bölüm 9: meyveyi yavruya uzatıp atma (yandan): göğsüne alır, yaylanır, kolunu öne-yukarı savurup bırakır, bakar
    front = false;
    const o = opt && typeof opt === 'object' ? opt : FZ_BOS, u = o.u != null ? clamp(+o.u || 0, 0, 1) : (tm % 1.2) / 1.2, hy = clamp(+o.hedefY || 0, -1, 1);
    const al = smooth(clamp(u / 0.33, 0, 1)), at = smooth(clamp((u - 0.33) / 0.15, 0, 1)), bk = smooth(clamp((u - 0.55) / 0.3, 0, 1));
    const dip = Math.sin(clamp(u / 0.4, 0, 1) * Math.PI);   // atmadan önce dizler bükülür
    R.lt1 = 0.04 + 0.22 * dip + 0.06 * at; R.lt2 = -0.08 - 0.42 * dip; R.bt1 = -0.04 + 0.12 * dip - 0.12 * at; R.bt2 = -0.06 - 0.36 * dip;
    R.lean = lerp(lerp(0.03, -0.1, al), 0.16, at) - 0.06 * bk; R.bob = -1.6 * Math.sin(clamp((u - 0.4) / 0.45, 0, 1) * Math.PI);   // parmak ucunda yükselir
    const up = 0.28 * hy;
    R.la1 = lerp(lerp(0.12, 0.62, al), 2.3 - up, at) - 0.18 * bk; R.la2 = lerp(lerp(0.35, 1.55, al), 0.12, at) + 0.12 * bk;   // göğüste tutar → savurur
    R.ba1 = lerp(lerp(-0.1, -0.5, al), 0.5, at) - 0.2 * bk; R.ba2 = lerp(0.3, 0.55, al);
    R.hOpen = at; R.arm = 1 + 0.08 * at;
    R.gx = 0.9; R.gy = lerp(-0.1, -0.45, at) - 0.3 * hy * at; R.head = -0.12 * at - 0.1 * hy * at;
    R.mSmile = 1; R.mOpen = lerp(0.3, 0.55, at) + 0.25 * Math.sin(clamp((u - 0.36) / 0.2, 0, 1) * Math.PI); R.mRound = at > 0.2 && bk < 0.4 ? 0.5 : 0; R.brow = 0.3 + 0.3 * at;
    R.happy = bk > 0.6 && ((tm * 1.3) % 2) < 1.2 ? 1 : 0;
    Q.a_kenar = R.la1 > 1.5; Q.a_cl = -0.6 * at + 0.3 * bk;
    { const hip = -Math.max(fzFy(R.lt1, R.lt2), fzFy(R.bt1, R.bt2)) + R.bob, by = -0.28 * R.breath - R.shr, L1 = FZ_UA * R.arm, L2 = FZ_FA * R.arm + 1.2;   // elin yeri (dönüş)
      const ax = 1.2 + L1 * Math.sin(R.la1) + L2 * Math.sin(R.la1 + R.la2), ay = -11.4 + by + L1 * Math.cos(R.la1) + L2 * Math.cos(R.la1 + R.la2);
      const hc = Math.cos(R.lean), hs = Math.sin(R.lean), wx = R.hx + ax * hc - ay * hs, wy = hip + ax * hs + ay * hc, sc0 = olcek * FZ_SC;
      retX = x + wx * sc0; retY = y + wy * Math.abs(sc0); }
  } else if (poz === 'dans9') {   // Bölüm 9 final dansı (önden; ölçü vars. 2 sn = 4 vuruş): kanat çırparak sekme · salınma · el çırpma · yıldız zıplaması
    const o = opt && typeof opt === 'object' ? opt : FZ_BOS, ol = o.olcu > 0.6 ? +o.olcu : 2.0, vu = ol / 4;
    const ph = (tm / ol) % 4, bar = Math.floor(ph), bt = (tm % ol) / vu, fb = Math.floor(bt), fu = bt - fb;
    const hop = Math.sin(Math.PI * clamp((fu - 0.06) / 0.6, 0, 1)), nb = o.nabiz != null ? clamp(+o.nabiz, 0, 1) : hop;
    R.happy = 1; R.mSmile = 1; R.mOpen = 0.8; R.brow = 0.5; R.arm = 1.15; R.mRound = 0;
    const leg = h => { R.lt1 = 0.05 + 0.4 * h; R.lt2 = -0.1 - 0.7 * h; R.bt1 = 0.3 * h; R.bt2 = -0.1 - 0.6 * h; };
    if (bar === 0) {   // minik ejderha gibi: kollar iki yanda kanat çırpar, her vuruşta sek
      const f = Math.sin(fu * Math.PI * 4); R.bob = -4 * hop; leg(hop * 0.8);
      Q.ik = [[-13.6, -13 + 4.2 * f, 1], [13.6, -13 + 4.2 * f, 1]]; R.shr = 0.25 + 0.2 * f;
    } else if (bar === 1) {   // sağa sola salınma, kollar havada sallanır
      const a = Math.sin((bt / 4) * Math.PI * 4), wv = Math.sin(tm * 9) * 0.7;
      Q.a_tilt = 0.14 * a; R.bob = -1.4 * Math.abs(a); leg(0.12 * Math.abs(a));
      Q.ik = [[-12.4 + wv + 2 * a, -25.5, 1], [12.4 - wv + 2 * a, -25.5, 1]]; R.head = -0.12 * a;
    } else if (bar === 2) {   // el çırpma (her vuruşta iki çırpış)
      const s2 = Math.abs(Math.sin(fu * 6.2832)); R.bob = -1.2 * s2; leg(0.15 * (1 - s2));
      Q.ik = [[-(0.9 + 5.2 * s2), -8.6 - 1.6 * s2, 1], [0.9 + 5.2 * s2, -8.6 - 1.6 * s2, 1]];
    } else {   // yıldız zıplaması: çömel → büyük sekme (kollar, bacaklar açık) → in
      const big = fb === 2 ? Math.sin(Math.PI * fu) : 0, cr = fb === 1 ? Math.sin(Math.PI * fu * 0.5) : 0;
      R.bob = -9 * big + 2.2 * cr; R.lt1 = 0.05 + 0.5 * cr; R.lt2 = -0.1 - 0.9 * cr; R.bt1 = 0.4 * cr; R.bt2 = -0.1 - 0.8 * cr;
      R.sy = 1 + 0.06 * big - 0.05 * cr; R.sx = 2 - R.sy;
      Q.ik = big > 0.05 ? [[-14, -24 - 2 * big, 1], [14, -24 - 2 * big, 1]] : [[-7.6 - 4 * (1 - cr), -4 + 6 * cr, 0], [7.6 + 4 * (1 - cr), -4 + 6 * cr, 0]];
      R.mOpen = 0.6 + 0.4 * big; R.mRound = big > 0.5 ? 0.4 : 0;
    }
    if (o.nabiz != null) R.bob -= 1.6 * nb;
    Q.a_hy = Math.cos(fu * 6.2832) * 1.6;
  } else if (poz === 'kucak9') {   // Bölüm 9: kucaklaşma (önden): kollar açılır "gel!" → sımsıkı sarılır, gözler ^ ^, hafif sallanır
    const o = opt && typeof opt === 'object' ? opt : FZ_BOS, u = o.u != null ? clamp(+o.u || 0, 0, 1) : smooth(clamp(tm / 1.2, 0, 1)), bg = clamp(+o.boy || 0, 0, 1);
    const k = smooth(clamp((u - 0.3) / 0.7, 0, 1)), ac = smooth(clamp(u / 0.22, 0, 1)) * (1 - k), sw = Math.sin(tm * 2.2) * k, sq = Math.max(0, Math.sin(tm * 3.3)) * k;
    const hx0 = lerp(lerp(-2.6, -10.8, bg), lerp(-6.8, -13.8, ac), 1 - k), hy0 = lerp(lerp(-7.2, -10.2, bg), lerp(0.6, -17, ac), 1 - k);
    const hx1 = lerp(lerp(3.4, 10.8, bg), lerp(6.8, 13.8, ac), 1 - k), hy1 = lerp(lerp(-8.2, -10.2, bg), lerp(0.6, -17, ac), 1 - k);
    Q.ik = [[hx0 - 0.6 * sq, hy0, ac > 0.3 ? 1 : 0], [hx1 + 0.6 * sq, hy1, ac > 0.3 ? 1 : 0]]; Q.ikUst = k > 0.5;
    Q.a_tilt = 0.05 * sw; R.head = 0.22 * k + 0.08 * sw; R.shr = 0.2 * k + 0.1 * sq; R.arm = 1 + 0.1 * bg;
    R.bob = -1.2 * ac; R.lt1 = 0.06 * sq; R.bt1 = -0.06 * sq;
    R.happy = k > 0.45 || ac > 0.6 ? 1 : 0; R.mSmile = 1; R.mOpen = lerp(0.55, 0.3, k); R.brow = 0.4; R.gy = 0.15;
    R.sy = 1 - 0.025 * sq; R.sx = 2 - R.sy;
  } else if (poz === 'sevinc') {
    const ph = (tm % 0.72) / 0.72, hop = Math.sin(ph * Math.PI);
    R.bob = -8 * hop; R.lt1 = 0.6 * hop; R.lt2 = -1.1 * hop; R.bt1 = 0.5 * hop; R.bt2 = -1.0 * hop;
    R.happy = 1; R.mOpen = 0.9; R.mSmile = 1; R.brow = 0.5;
    const wv = Math.sin(tm * 9) * 0.6;
    Q.ik = [[-12.6 + wv, -26 - hop * 1.2, 1], [12.6 - wv, -26 - hop * 1.2, 1]]; R.arm = 1.22;
    Q.a_hy = Math.cos(ph * 6.2832) * 2;
    R.sy = 1 + 0.06 * hop - (ph < 0.08 || ph > 0.92 ? 0.05 : 0); R.sx = 2 - R.sy;
  } else if (poz === 'ayakta_yan') {
    front = false; R.la1 = 0.12 + 0.04 * b; R.ba1 = -0.1 + 0.03 * b; R.mSmile = 0.85; R.gx = 0.5;
  } else {   // 'ayakta' önden
    R.mSmile = 1; R.mOpen = 0.25; R.brow = 0.2; R.la1 = 0.12 + 0.04 * b; R.ba1 = 0.12 + 0.04 * b;
  }
  Q.a_pil = lie; if (lie > 0.5) Q.a_dim = clamp((R.lid - 0.1) / 0.7, 0, 1);
  Q.a_isik = opt && typeof opt === 'object' && opt.isik != null ? opt.isik : (poz === 'uyanis' || poz === 'sarilma') ? 1 : lie > 0.3 || poz === 'yatagaGir' ? -1
    : seatT && typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 3 ? 2 : typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 9 ? 2 : 0;   // Bölüm 9: bütün pozlarda aynı sıcak gün batımı tonu (poz değişince renk sıçramasın)
  const fy = (a1, a2) => FZ_TH * Math.cos(a1) + FZ_SH * Math.cos(a1 + a2) + FZ_FT;
  const hip = -Math.max(fy(R.lt1, R.lt2), fy(R.bt1, R.bt2)) + R.bob;
  Q.a_hipY = hip;
  // ışığa göre ton (gece: soğuk ay + sıcak lamba kenarı; sabah: altın): Feza küçük bir ara tuvale çizilir, 'source-atop' ile boyanır, sonra asıl tuvale konur
  let gercek = null, tbx = 0, tby = 0, tpu = 1;
  const isk = Q.a_isik;
  if (isk && ctx.canvas && typeof document !== 'undefined' && !(opt && opt.isik === 0)) {
    const M0 = ctx.getTransform(), s0 = Math.abs(olcek * FZ_SC), cw = ctx.canvas.width, ch = ctx.canvas.height;
    tpu = Math.hypot(M0.a, M0.b) * Math.abs(olcek);
    const tY = kos8 ? -92 : -66;   // kostümde şapka ucu da ara tuvale sığsın
    const pts = [[-62, tY], [62, tY], [62, 34], [-62, 34]].map(([a, b]) => M0.transformPoint(new DOMPoint(x + a * s0, y + b * s0)));
    const x0 = Math.max(0, Math.floor(Math.min(...pts.map(p => p.x)))), x1 = Math.min(cw, Math.ceil(Math.max(...pts.map(p => p.x))));
    const y0 = Math.max(0, Math.floor(Math.min(...pts.map(p => p.y)))), y1 = Math.min(ch, Math.ceil(Math.max(...pts.map(p => p.y))));
    if (x1 - x0 > 8 && y1 - y0 > 8) {
      const B = fzTB || (fzTB = document.createElement('canvas'));
      if (B.width !== x1 - x0 || B.height !== y1 - y0) { B.width = x1 - x0; B.height = y1 - y0; }
      const bc = B.getContext('2d'); bc.setTransform(1, 0, 0, 1, 0, 0); bc.clearRect(0, 0, B.width, B.height);
      bc.setTransform(M0.a, M0.b, M0.c, M0.d, M0.e - x0, M0.f - y0);
      gercek = ctx; tbx = x0; tby = y0; ctx = bc;
    }
  }
  ctx.save();
  const m0 = ctx.getTransform();
  const sc = olcek * FZ_SC;
  ctx.translate(x, y); if (rotA) { if (piv) ctx.translate(0, -piv * Math.abs(sc)); ctx.rotate(rotA); if (piv) ctx.translate(0, piv * Math.abs(sc)); } ctx.scale(sc * R.sx, Math.abs(sc) * R.sy);   // piv: gövde ortası etrafında döner (ucus11)
  if (seatT) ctx.translate(0, -hip - 3.2);   // binis/kayma: kalça oturma noktasının 3,2 birim üstünde (popo yüzeye değer)
  if (seated) {   // yatağa göre: yatarken kalçanın yanı, otururken kalçanın altı yatağa değer
    ctx.rotate(-1.5708 * lie);            // kalçanın alt-arka köşesi etrafında devrilir (kitap gibi)
    if (gT) ctx.translate(lerp(gT[0], 6.6, gT.sit), lerp(gT[1], -hip - 3.6, gT.sit)); else ctx.translate(6.6, -hip - 3.6);
  }
  const pxu = Math.hypot(m0.a, m0.b) * Math.abs(sc);   // birim başına piksel (oyunda ≈ 4, sabah yakın çekiminde ≈ 16)
  fzBuyuk = smooth(clamp((pxu - 5.5) / 6.5, 0, 1));
  const mm = ctx.getTransform(), inv = m0.inverse();
  const kucak = inv.multiply(mm).transformPoint(new DOMPoint(0, hip - 6.5));
  if (typeof ara === 'function') Q.ara = () => { ctx.save(); ctx.setTransform(m0); ara(ctx, kucak.x, kucak.y, olcek); ctx.restore(); };
  const eski = fzQ; fzQ = Q; fzKos = kos8; fz8M = FZ8_C;
  try { const dtm = poz === 'yatagaGir' ? tm - FZ_GIR_SURE : tm; if (front) fzDrawFront(ctx, dtm); else fzDraw(ctx, dtm); }   // yatagaGir: saç zamanı 4.4 sn'de 0 olur (uykuya_dalis ile kesintisiz)
  finally { fzQ = eski; fzBuyuk = 0; fzSwF = 1.7; fzSwA = 1; fzKos = eKos; fz8M = eM8; ctx.restore(); }
  if (gercek) {
    const B = ctx.canvas, w = B.width, h = B.height; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-atop';
    if (isk === 2) {   // gün doğumu (Bölüm 3): hafif şeftali sıcaklık, üst-önden pembe-altın kenar ışığı, alttan bulutların lila yansıması
      ctx.fillStyle = 'rgba(255,188,150,0.1)'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(150,110,200,0.07)'; ctx.fillRect(0, h * 0.62, w, h * 0.38);
      ctx.globalCompositeOperation = 'source-over';
      fzRimB(B, ctx, 0.8, -0.6, 0.8 * tpu, '#ffd8a6', 0.8);
      fzRimB(B, ctx, -0.85, -0.3, 0.55 * tpu, '#ffb3cf', 0.42);
      fzRimB(B, ctx, -0.2, 0.98, 0.6 * tpu, '#d9a6ec', 0.4);
    } else if (isk < 0) {   // gece: soğuk mavi ortam + gece lambasından sıcak kenar ışığı
      ctx.fillStyle = 'rgba(255,176,140,0.09)'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(96,118,240,0.19)'; ctx.fillRect(0, 0, w, h);
      const lx = opt && opt.lamp ? opt.lamp.x - tbx : w * 0.9, ly = opt && opt.lamp ? opt.lamp.y - tby : h * 0.25, gr = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(w, h) * 0.6);
      gr.addColorStop(0, 'rgba(255,170,90,0.42)'); gr.addColorStop(1, 'rgba(255,176,98,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    } else {         // sabah: sıcak altın ışık, üstten
      ctx.fillStyle = 'rgba(255,205,140,0.12)'; ctx.fillRect(0, 0, w, h);
      const gr = ctx.createLinearGradient(0, 0, w * 0.4, h); gr.addColorStop(0, 'rgba(255,224,160,0.28)'); gr.addColorStop(0.6, 'rgba(255,224,160,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
    gercek.save(); gercek.setTransform(1, 0, 0, 1, 0, 0); gercek.drawImage(B, tbx, tby); gercek.restore();
    ctx = gercek;
  }
  let sep8 = null;
  if (kos8) {   // Bölüm 8: asa/kabak yüzü ışıkları; ana tuvale çizildiyse sepet ağzının ve asa ucunun dünya konumu
    const ox = gercek ? tbx : 0, oy = gercek ? tby : 0, ana = typeof cv !== 'undefined' && ctx.canvas === cv && typeof cam !== 'undefined' && S > 0;
    fz8IsikCiz(ctx, ox, oy, 1);
    if (fz8NkS) {
      if (ana) { P.a_sepetX = cam.x + (FZ8_NK[0] + ox) / S; P.a_sepetY = cam.y + (FZ8_NK[1] + oy) / S; FZ8D.sepT = now; }
      sep8 = fz8CtxNokta(m0, FZ8_NK[0], FZ8_NK[1]);
    }
    if (fz8NkA && ana) { FZ8D.asaWX = cam.x + (FZ8_NK[2] + ox) / S; FZ8D.asaWY = cam.y + (FZ8_NK[3] + oy) / S; FZ8D.asaT = now; }
  }
  if (retX !== null) return sep8 ? { x: retX, y: retY, sepet: sep8 } : { x: retX, y: retY };
  return { x: kucak.x, y: kucak.y };
}
let fzTB2 = null;   // kenar ışığı ara tuvali (fezaCizPoz ışık tonu)
function fzRimB(B, bc, lx, ly, d, col, al) {   // B'deki silüetin ışığa bakan kenarına d piksellik ince renkli bant (fzRim'in ara sahne eşi)
  const C2 = fzTB2 || (fzTB2 = document.createElement('canvas'));
  if (C2.width !== B.width || C2.height !== B.height) { C2.width = B.width; C2.height = B.height; }
  const r = C2.getContext('2d'); r.setTransform(1, 0, 0, 1, 0, 0);
  r.globalCompositeOperation = 'copy'; r.globalAlpha = al; r.fillStyle = col; r.fillRect(0, 0, C2.width, C2.height);
  r.globalCompositeOperation = 'destination-out'; r.globalAlpha = 1; r.drawImage(B, -lx * d, -ly * d);
  r.globalCompositeOperation = 'source-over';
  bc.globalCompositeOperation = 'source-atop'; bc.drawImage(C2, 0, 0); bc.globalCompositeOperation = 'source-over';
}

// İnci Denizi: omuz ve dirsek, elin kesintisiz erişme–yakalama–çekme–geri alma yayını takip eder.
// Döngüsel Catmull-Rom yalnız sayılarla çalışır; kare başına yeni nesne/tuval ayrılmaz.
const FZ_SU_YAY = [[3.6, -23.8], [10.2, -19.0], [10.4, -8.2], [4.8, -1.4], [-1.6, -11.4]];
const FZ_SU_T = Object.assign({}, FZ_REST), FZ_SU_EL = [0, 0], FZ_SU_ANG = ['lt1', 'lt2', 'bt1', 'bt2', 'la1', 'la2', 'ba1', 'ba2', 'head', 'lean'];
function fzSuYay(ph, out) {
  const q = ((ph / (Math.PI * 2)) % 1 + 1) % 1 * 5, i = Math.floor(q), u = q - i, u2 = u * u, u3 = u2 * u;
  const a = FZ_SU_YAY[(i + 4) % 5], b = FZ_SU_YAY[i], c = FZ_SU_YAY[(i + 1) % 5], d = FZ_SU_YAY[(i + 2) % 5];
  for (let k = 0; k < 2; k++) out[k] = 0.5 * ((2 * b[k]) + (-a[k] + c[k]) * u + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * u3);
}
function fzSuHedef(R, ph, moving, dash, tm) {
  Object.assign(R, FZ_REST);
  const kick = Math.sin(ph * 2), bk = Math.sin(ph * 2 + Math.PI), amplitude = 0.13 + moving * 0.23 + dash * 0.04;
  // Dash anında güçlü ve senkronize yunus kuyruk vuruşu (dolphin kick)
  const dKick = Math.sin(ph * 3.6);
  const k1 = lerp(kick * amplitude, dKick * 0.18, dash);
  const k2 = lerp(bk * amplitude, dKick * 0.15, dash);
  R.lt1 = k1; R.bt1 = k2;
  // Diz yalnız yukarı dönen tekmede hafifçe kırılır; dash'te bacaklar zarifçe gerilir
  R.lt2 = lerp(-0.11 - Math.max(0, -kick) * (0.1 + moving * 0.18), -0.06 - Math.max(0, -dKick) * 0.12, dash);
  R.bt2 = lerp(-0.11 - Math.max(0, -bk) * (0.1 + moving * 0.18), -0.06 - Math.max(0, -dKick) * 0.12, dash);
  R.arm = 1.04; R.breath = Math.sin(tm * 1.7) * 0.55; R.shr = 0.08 + Math.sin(ph * 2) * moving * 0.14;
  for (let i = 0; i < 2; i++) {
    const p = ph + i * Math.PI, sx = i ? -0.8 : 1.2, sy = i ? -11.8 : -11.4;
    fzSuYay(p, FZ_SU_EL);
    // Dururken eller omuz hizasında küçük daireler çizer; dash anında kollar öne uzanıp torpido gibi süzülür
    const hx = lerp(8 + Math.sin(p) * 2.2, FZ_SU_EL[0], moving), hy = lerp(-8.8 + Math.cos(p) * 2.1, FZ_SU_EL[1], moving);
    const dhx = i ? 1.2 : 2.8, dhy = -26;
    fzSideIK(sx, sy, lerp(hx, dhx, dash * 0.95), lerp(hy, dhy, dash * 0.95), lerp(R.arm, 1.24, dash * 0.25), FZ_IKO);
    if (i) { R.ba1 = FZ_IKO[0]; R.ba2 = FZ_IKO[1]; } else { R.la1 = FZ_IKO[0]; R.la2 = FZ_IKO[1]; }
  }
  R.lean = lerp(Math.sin(ph * 2 - 0.5) * moving * 0.018, 0, dash);
  R.head = lerp(-0.12 - moving * 0.22 + Math.sin(ph - 0.4) * moving * 0.035, -0.05, dash);
  R.bob = Math.sin(tm * 1.7) * (0.7 - moving * 0.4);
  // Gövde burgu ve süzülüş esnekliği (streamline elongation & roll width)
  R.sx = lerp(1 + Math.sin(ph * 2) * moving * 0.012, 0.94 + 0.08 * Math.sin(ph * 3.6), dash);
  R.sy = lerp(1 - Math.sin(ph * 2) * moving * 0.008, 1.07, dash);
  R.gx = 0.78; R.gy = 0;
  R.mSmile = 1;
  R.mOpen = lerp(0.18 + Math.sin(tm * 1.7) * 0.035, 0.46, dash);
  R.brow = 0.3;
  R.hOpen = lerp(0.6, 0.9, dash);
  R.happy = lerp(0, 1, dash);
  R.air = 1;
}
function fzSuAci(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
// Hamle fiziğine dokunmayan eklem pozu: 0,5 sn takla + 0,18 sn suya yeniden uzanma.
function fzSuHamlePoz(R, age, ph, moving) {
  const tuck = smooth(clamp(age / .075, 0, 1)) * (1 - smooth(clamp((age - .29) / .2, 0, 1)));
  const extend = smooth(clamp((age - .33) / .13, 0, 1)) * (1 - smooth(clamp((age - .5) / .18, 0, 1)));
  P.a_suTuck = tuck; P.a_suExtend = extend;
  R.lt1 += fzSuAci(R.lt1, 2.16) * tuck; R.lt2 += fzSuAci(R.lt2, -2.48) * tuck;
  R.bt1 += fzSuAci(R.bt1, 1.94) * tuck; R.bt2 += fzSuAci(R.bt2, -2.36) * tuck;
  R.lt1 = lerp(R.lt1, .08, extend); R.lt2 = lerp(R.lt2, -.12, extend);
  R.bt1 = lerp(R.bt1, -.05, extend); R.bt2 = lerp(R.bt2, -.16, extend);
  const arm = lerp(R.arm, 1, tuck); R.arm = lerp(arm, 1.13, extend);
  for (let i = 0; i < 2; i++) {
    const sx = i ? -.8 : 1.2, sy = i ? -11.8 : -11.4, a = i ? 'ba1' : 'la1', b = i ? 'ba2' : 'la2';
    // Geçiş elin yolu üzerinde yapılır; ±π sınırında dirsekler ters yöne sıçramaz.
    const phase = ph + i * Math.PI; fzSuYay(phase, FZ_SU_EL);
    let hx = lerp(8 + Math.sin(phase) * 2.2, FZ_SU_EL[0], moving), hy = lerp(-8.8 + Math.cos(phase) * 2.1, FZ_SU_EL[1], moving);
    hx = lerp(hx, i ? 7 : 9.2, tuck); hy = lerp(hy, i ? -5.7 : -4.2, tuck);
    const reach = extend * (i ? .92 : 1);
    hx = lerp(hx, i ? -.8 : 3.8, reach); hy = lerp(hy, i ? -23.6 : -25.7, reach);
    fzSideIK(sx, sy, hx, hy, R.arm, FZ_IKO); R[a] = FZ_IKO[0]; R[b] = FZ_IKO[1];
  }
  R.lean = lerp(R.lean, .23, tuck); R.lean = lerp(R.lean, -.025, extend);
  R.head = lerp(R.head, .34, tuck); R.head = lerp(R.head, -.1, extend);
  R.sx = lerp(R.sx, 1.035, tuck); R.sy = lerp(R.sy, .965, tuck);
  R.sx = lerp(R.sx, .98, extend); R.sy = lerp(R.sy, 1.035, extend);
  R.shr = lerp(R.shr, .55, tuck); R.hOpen = lerp(R.hOpen, .2, tuck);
  R.happy = Math.max(R.happy, .65 * tuck + .35 * extend); R.mSmile = 1;
  R.mOpen = lerp(R.mOpen, .2, tuck); R.brow = lerp(R.brow, .42, tuck);
}
function fzDenizAdim(dt, t) {
  if (!(dt > 0) || !Number.isFinite(dt)) return;
  const interrupted = P.kilit > 0 || DURUM !== 'oyun' || (typeof DENIZ !== 'undefined' && DENIZ.aktif) || (typeof INCI !== 'undefined' && INCI.active);
  P.a_suHamleT = interrupted ? 9 : Math.min(9, P.a_suHamleT + dt);
  const age = P.a_suHamleT, hamle = age < .68, rolling = age < .5;
  const R = P.a_R, total = Math.hypot(P.vx, P.vy), speed = clamp(total / 250, 0, 1), k = 1 - Math.exp(-dt * (hamle ? 28 : 16));
  const oldMoving = P.a_suMoving || 0, targetMoving = smooth(clamp((total - 12) / 120, 0, 1)), decay = Math.exp(-dt * 5);
  P.a_suMoving = targetMoving + (oldMoving - targetMoving) * decay;
  const movingTime = targetMoving * dt + (oldMoving - targetMoving) * (1 - decay) / 5;
  const friend = P.a_suSevT > 0 && total < 40 ? P.a_suSevO : null;
  const moving = P.a_suMoving, side = rolling ? P.a_suHamleSide : friend && Math.abs(friend.x - P.x) > 30 ? Math.sign(friend.x - P.x) : Math.abs(P.vx) > 24 ? Math.sign(P.vx) : P.f || 1, dash = rolling ? clamp(1 - age / .5, 0, 1) : 0;
  if (friend) P.f = side;
  if (P.a_turnU == null) P.a_turnU = 1;
  if (rolling) {   // Dönüşün ortasında ayna yönü değişip dünya taklasını tersine çevirmesin.
    P.a_suTo = P.a_suHamleSide; P.a_side = P.a_suHamleSide;
    P.a_turnU = Math.min(1, P.a_turnU + dt / .1);
  } else {
    if (P.a_turnU >= 1 && P.a_side !== side) { P.a_turnU = 0; P.a_suTo = side; }
    if (P.a_turnU < 1) { P.a_turnU = Math.min(1, P.a_turnU + dt / .38); if (P.a_turnU >= .5) P.a_side = P.a_suTo; }
  }
  P.a_fu = 0; P.a_ox = P.a_oy = P.a_lf = 0;

  // Önce toplanır, sonra hızlanarak döner; son açı tam turda kalır, açılma sırasında sıçramaz.
  const dashU = clamp((age - .065) / .435, 0, 1);
  const rollEase = dashU * dashU * dashU * (dashU * (dashU * 6 - 15) + 10);
  const rollSpin = hamle ? rollEase * Math.PI * 2 * P.a_suHamleSign : 0;
  P.a_spin = rollSpin;

  P.a_suPh = (P.a_suPh || 0) + dt * (1.4 + dash * 2.2) + movingTime * 3.4;
  const ph = P.a_suPh;
  // Yön suya bakar: yükselirken gövde doğrulur, alçalırken baş yumuşakça öne dalar.
  const aim = 1.34 + clamp(P.vy / Math.max(100, Math.abs(P.vx)) * 0.44, -1.04, 0.58);
  P.a_suA = lerp(P.a_suA || 0, lerp(0.12 + Math.sin(t * 1.2) * 0.035, aim, moving), 1 - Math.exp(-dt * (dash > 0 ? 8 : 5)));
  fzSuHedef(FZ_SU_T, ph, moving, 0, t);
  if (hamle) fzSuHamlePoz(FZ_SU_T, age, ph, moving); else P.a_suTuck = P.a_suExtend = 0;
  P.a_suSevT = Math.max(0, (P.a_suSevT || 0) - dt);
  const party = typeof INCI !== 'undefined' && INCI.active ? INCI.joy : 0;
  const salute = P.a_suSevT > 0 ? Math.sin(clamp(P.a_suSevT / 2.6, 0, 1) * Math.PI) * (1 - moving * .72) : 0;
  const joy = Math.max(party, salute) * (1 - P.a_suTuck) * (1 - P.a_suExtend);
  if (joy > .001) {
    // Su içinde de sevinç okunur: bir kol dostuna uzanır, diğeri yumuşakça el sallar.
    fzSideIK(1.2, -11.4, 11.2 + Math.sin(t * 6.2) * 1.2, -23.8 + Math.cos(t * 6.2) * 1.4, 1.18, FZ_IKO);
    FZ_SU_T.la1 += fzSuAci(FZ_SU_T.la1, FZ_IKO[0]) * joy; FZ_SU_T.la2 += fzSuAci(FZ_SU_T.la2, FZ_IKO[1]) * joy;
    fzSideIK(-.8, -11.8, -8.4, -21.5 + Math.sin(t * 4.5) * 1.3, 1.18, FZ_IKO);
    FZ_SU_T.ba1 += fzSuAci(FZ_SU_T.ba1, FZ_IKO[0]) * joy; FZ_SU_T.ba2 += fzSuAci(FZ_SU_T.ba2, FZ_IKO[1]) * joy;
    FZ_SU_T.arm = lerp(FZ_SU_T.arm, 1.18, joy); FZ_SU_T.mOpen = lerp(FZ_SU_T.mOpen, .65, joy);
    FZ_SU_T.happy = joy; FZ_SU_T.mSmile = 1; FZ_SU_T.brow = lerp(FZ_SU_T.brow, .5, joy);
    FZ_SU_T.bob -= Math.abs(Math.sin(t * 2.15)) * joy * 1.2;
    P.a_suA = lerp(P.a_suA, .1 + Math.sin(t * 2.15) * .05, joy * k);
  }
  FZ_SU_T.gx = P.a_turnU < 0.5 ? -0.85 : 0.78; FZ_SU_T.gy = friend ? clamp(((friend.dnz ? friend.dnz.hy : friend.y - 42) - (P.y - 57)) / 180, -.4, .4) : clamp(P.vy / 500, -0.3, 0.3);
  // Baş, dönüşte önce yeni yöne bakar; orta anda yüz kameraya dönerken gövde doğrulur.
  FZ_SU_T.head += (P.a_turnU < 1 ? -0.13 * Math.sin(P.a_turnU * Math.PI) : 0);
  for (let i = 0; i < FZ_KEYS.length; i++) {
    const key = FZ_KEYS[i], old = Number.isFinite(R[key]) ? R[key] : FZ_SU_T[key], delta = FZ_SU_ANG.indexOf(key) >= 0 ? fzSuAci(old, FZ_SU_T[key]) : FZ_SU_T[key] - old;
    // Kısa toparlanmada eklem hızları saniyeyle sınırlı; yüksek Hz'de de aynı yumuşak yay çizilir.
    const maxStep = age < .9 ? (FZ_VMAX[key] || 0) * dt : 0;
    R[key] = old + (maxStep ? clamp(delta * k, -maxStep, maxStep) : delta * k);
  }
  P.a_hipY = -17.7 + Math.sin(ph * 2) * moving * 0.12 - P.a_suTuck * .65; P.a_kenar = true; P.a_noFar = false;
  P.a_blink -= dt; if (P.a_blink < -0.13) P.a_blink = 2.2 + Math.random() * 3;
  P.a_lidM = lerp(P.a_lidM, P.a_blink < 0 ? 0 : 1, 1 - Math.exp(-dt * 35));
  P.a_cl = (0.16 * Math.sin(ph * 1.3 - 0.8) + moving * .12) * (1 - P.a_suTuck * .65) - P.a_suTuck * .2 - P.a_suExtend * .12;
  P.a_hx = lerp(P.a_hx || 0, -1.25 * moving + .14 * Math.sin(ph * .7) - P.a_suTuck * .8 - P.a_suExtend * 1.3, k);
  P.a_hy = lerp(P.a_hy || 0, -P.vy * .002 + .18 * Math.sin(ph * .6) + Math.sin(rollSpin) * P.a_suTuck * .8, k);
}

// Baloncuk gövdeye değil kafa eklemine bağlıdır: eğilme, boyun dönüşü ve saç salınımını birlikte izler.
// İçine renk/bulanıklık doldurulmaz; tek ince zar ve kısa sedef yansıması yüzü örtmez.
const FZ_SU_BAL_M = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, valid: false, front: false };
function fzNefesBalonu(x, tm, front) {
  if (BOLUM_NO !== 4 || !(fzQ === P ? P.deniz : fzQ.a_suPoz)) return;
  if (fzQ === P && x === fzX) { const q = x.getTransform(), m = FZ_SU_BAL_M; m.a = q.a; m.b = q.b; m.c = q.c; m.d = q.d; m.e = q.e; m.f = q.f; m.front = front; m.valid = true; return; }
  fzNefesZari(x, tm, front);
}
function fzNefesZari(x, tm, front) {
  const hair = Math.max(Math.abs(fzQ.a_hx || 0), Math.abs(fzQ.a_hy || 0));
  const cx = front ? 0 : -0.2, cy = -3.6, rx = 14.9 + hair * 0.15, ry = 16.8 + hair * 0.1;
  const breath = Math.sin(tm * 1.4) * 0.14, tilt = Math.sin(tm * 0.8) * 0.018;
  x.save(); x.strokeStyle = 'rgba(200,242,231,0.28)'; x.lineWidth = 0.42;
  x.beginPath(); x.ellipse(cx, cy, rx + breath, ry - breath * 0.55, tilt, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = 'rgba(250,253,235,0.52)'; x.lineWidth = 0.7; x.lineCap = 'round';
  x.beginPath(); x.ellipse(cx, cy, rx - 0.5 + breath, ry - 0.4, tilt, 3.8, 4.55); x.stroke();
  x.strokeStyle = 'rgba(148,216,221,0.18)'; x.lineWidth = 0.5;
  x.beginPath(); x.ellipse(cx, cy, rx + breath, ry - breath * 0.55, tilt, 0.4, 1.1); x.stroke(); x.restore();
}

OLAY.on('denizHamle', () => {
  if (BOLUM_NO !== 4 || !P.deniz || !P.a_R || P.ucus || P.kilit > 0 || DURUM !== 'oyun') return;
  P.a_suHamleT = 0; P.a_suHamleSide = P.a_side || P.f || 1;
  const dir = Math.abs(P.denizDX || 0) > .12 ? Math.sign(P.denizDX) : P.a_suHamleSide;
  P.a_suHamleSign = dir * P.a_suHamleSide;
});
function fzDenizSevin(e) {
  if (BOLUM_NO !== 4 || !P.deniz) return;
  const o = e && (e.o || e); if (!o || Math.abs(o.x - P.x) > 520) return;
  P.a_suSevO = o; P.a_suSevT = 2.6;
}
OLAY.on('denizati', fzDenizSevin);
OLAY.on('denizatiOyun', fzDenizSevin);

// ══════════════════ Bölüm 8 (Balkabağı Gecesi): kostümler, kabak sepeti, kapı çalma, süpürge ve final pozları ══════════════════
// Kostüm (V8.kostum: 'cadi' | 'kabak' | 'iskelet' | 'yarasa') her pozda çizilir: oyunda drawFeza, ara sahnede fezaCizPoz (yalnız
// DURUM 'oyun' iken; yatak/sabah pozlarında pijama — opt.kostum ile zorlanabilir). fzKos o çizimin kostümüdür: Bölüm 1–7'de hep null,
// bütün kancalar hiçbir şey yapmaz (çizim birebir aynı). Kostüm parçaları düz renkli yollar; geçişler fzGrad'da bir kez kurulur.
//   CADI: yıldızlı mor sivri şapka (eğri ucu yaylı sallanır), yıldızlı mor pelerin (gecikmeli savrulur), ucu yıldız asa (arka elde,
//         parlar ve ışıltı saçar), mor-lila çizgili çorap.
//   KABAK: yuvarlak dilimli turuncu kabak tulum (göbekte gülen oyma yüz, içi sıcak ışık; inişte jöle gibi sarsılır), yeşil kollu alt
//          giysi ve yeşil tayt, yeşil sap-yapraklı başlık.
//   ISKELET: lacivert tulum üstünde hafifçe parlayan tombul beyaz kemikler (yuvarlak kaburgalar, kol/bacak kemikleri), yaylı taçta
//            gülen yuvarlak minik kafatası (yayın ucunda sallanır).
//   YARASA: mor tulum (açık lila göbek), kollara bağlı lila kanat pelerini (taraklı kenar; kollar kalkınca kanatlar açılır), iki sivri
//           kulaklı taç.
// Ön elde gülen KABAK SEPETİ (sarkaç gibi sallanır, şeker toplandıkça dolar; kapı çalarken dirseğe kayar).
// Dışa açık: fezaSepetCiz(c, x, y, s, dolu) · fezaSepetKonum() = fezaSepetYer() → {x, y} sepet ağzının dünya konumu (P.a_sepetX/Y
// de her karede) · fezaKostumIkon(c, ad, x, y, s, tm) · fezaPozVar(ad) · fezaKapiTak(i) · fezaCizPoz 'supurge' ve 'dans8' pozları.
// Olaylar: 'kostumSec' (döne döne sevinç), 'sekerKapiBasla' / 'sekerKapiTak' / 'komsuSoz' / 'sekerSaka' / 'seker' / 'sekerKapi'
// (kapı sahnesi: kapıya bakış, tık tık, dinleme, şaşırıp kıkırdama, sepet dolunca sekme), 'kabakFener', 'hayaletBuldu', mini oyun
// bitişleri, 'supurgeBitti' (ta-da), 'cadiFinal'/'cadiDoruk' (final dansı: kabak.js cadiFinalAn() saatine, 120 BPM, ölçü 2 sn).
let fzKos = null;
const FZ8_KOS = { cadi: 1, kabak: 1, iskelet: 1, yarasa: 1 };
const FZ8 = {
  mor: '#8a5ad8', morA: '#b58cf0', morK: '#5f39b0', morC: '#36206e', astar: '#4a2b8c', yil: '#ffd76a', yilA: '#fff4bd', yilK: '#d18f22',
  cizA: '#dcc4ff', cizK: '#8152d6', cizF: '#a98bd6', cizFK: '#5d3aa0', asa: '#5c3a86', asaA: '#b393dc',
  kab: '#ff9a3c', kabA: '#ffc06e', kabK: '#e8702a', kabC: '#a5461a', isik: '#ffd36b', isikA: '#fff3c0', isikK: '#7a3210',
  yes: '#4f9e3e', yesA: '#86cc62', yesK: '#2f6b28', yesF: '#3c7d31', sap: '#7a8a2e', sapK: '#4a5418',
  lac: '#36438f', lacA: '#5262b3', lacK: '#232b63', lacF: '#2a346f', kem: '#f7f4ff', kemF: '#c9c6ea', kemH: '#9fc3ff',
  lila: '#c2a0f4', lilaA: '#dcc6fb', lilaK: '#9a78d6', lilaC: '#4a2f8a', tul: '#7656c2', tulA: '#cdb2f4', tulK: '#553a98', tulF: '#5e45a5', pem: '#ff9fcd',
  sek: ['#ff8fc8', '#7dffc4', '#e8ff8a', '#c39bff', '#ffb347', '#8fd8ff']
};
function fz8V8Kos() {   // Bölüm 8 kostümü; Bölüm 11'de pelerin ('p11' + V11.pelerin)
  if (typeof BOLUM_NO === 'undefined') return null;
  if (BOLUM_NO === 8) return typeof V8 !== 'undefined' && V8 && FZ8_KOS[V8.kostum] ? V8.kostum : null;
  if (BOLUM_NO === 11) return typeof V11 !== 'undefined' && V11 && V11.pelerin ? fz11Kos(V11.pelerin) : null;
  return null;
}
// ikincil hareket durumu: pa pelerin savrulma açısı (+ geriye) · pf dalgalanma · su şapka/sap ucu yayı · kb taç yayı · se sepet sarkacı
// (ekran açısı, + sağa) · dw sepet dirsekte · j kabak jölesi · giy giyme (0→1, büyüyerek belirir) · parla kemik ışığı · kn kanat açıklığı
// · ruz rüzgâr · sapX/sapY sepetin süpürge sapındaki yeri (yerel; NaN: elde) · dolu sepet doluluğu · don asanın dönüşü (dans)
function fz8Durum() { return { pa: 0.12, pf: 0, su: 0, kb: 0, se: 0, dw: 0, j: 0, giy: 1, parla: 0.9, kn: 0, ruz: 0, tm: 0, sapX: NaN, sapY: NaN, dolu: 0, don: 0, pav: 0, suv: 0, kbv: 0, sev: 0, jv: 0 }; }
const FZ8_P = fz8Durum(), FZ8_C = fz8Durum();
let fz8M = FZ8_P;
// oyundaki yay hızları ve olay zamanlayıcıları (P'nin biçimine dokunmadan ayrı nesnede)
const FZ8D = { pv: 0, fv: 0, suv: 0, kbv: 0, sev: 0, jv: 0, ex: NaN, ey: NaN, evx: 0, evy: 0, kos: null, side: 1,
  donT: 9, donS: 1, tapT: 9, kapiT: 9, kapiW: 0, hopT: 9, dinT: 0, kapiX: NaN, kapiBasT: -99, calT: 0, dorukT: -99, kivT: 0, tilt: 0,
  sonTak: -9, asaPT: 0, flapT: 9, kn8: 0, asaWX: NaN, asaWY: NaN, asaT: -9, sepT: -9 };
const FZ8_NK = new Float64Array(4);   // son çizimde sepet ağzı ve asa ucu (çizim tuvalinin aygıt pikseli)
let fz8NkS = false, fz8NkA = false;
function fz8Nokta(x, lx, ly, i) { const m = x.getTransform(); FZ8_NK[i] = m.a * lx + m.c * ly + m.e; FZ8_NK[i + 1] = m.b * lx + m.d * ly + m.f; }
// çizimden sonra ana tuvale 'lighter' ile eklenen yumuşak ışıklar (asa yıldızı, kabak yüzü); sabit yuvalar
const FZ8_ISIK = []; for (let i = 0; i < 8; i++) FZ8_ISIK.push({ x: 0, y: 0, r: 0, c: '#ffffff', a: 0 });
let fz8IsikN = 0;
function fz8Isik(x, lx, ly, r, col, a) {
  if (fz8IsikN >= FZ8_ISIK.length || !(a > 0.01)) return;
  const m = x.getTransform(), q = FZ8_ISIK[fz8IsikN++];
  q.x = m.a * lx + m.c * ly + m.e; q.y = m.b * lx + m.d * ly + m.f; q.r = r * Math.hypot(m.a, m.b); q.c = col; q.a = a;
}
function fz8IsikCiz(c, ox, oy, al) {
  if (!fz8IsikN) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < fz8IsikN; i++) { const q = FZ8_ISIK[i]; c.globalAlpha = Math.min(1, q.a * al); c.drawImage(glow(q.c), ox + q.x - q.r, oy + q.y - q.r, q.r * 2, q.r * 2); }
  c.restore(); fz8IsikN = 0;
}
// tuvalin o anki dönüşümünde ekran yönünün yerel karşılığı (birim): pelerin/sepet/kanat yerçekimine göre sarksın (ayna, eğim, dönüş dahil)
const FZ8_V = [0, 1], FZ8_V2 = [0, 1];
function fz8EkranYon(x, a, out) {   // a: ekranda aşağıdan ölçülen açı (+ ekranın sağına)
  const m = x.getTransform(), det = m.a * m.d - m.b * m.c || 1, sx = Math.sin(a), sy = Math.cos(a);
  const vx = (m.d * sx - m.c * sy) / det, vy = (-m.b * sx + m.a * sy) / det, L = Math.hypot(vx, vy) || 1;
  out[0] = vx / L; out[1] = vy / L; return out;
}
function fz8Buyu() { const u = fz8M.giy; if (!(u < 1)) return 1; const v = clamp(u, 0, 1) - 1; return 1 + 2.70158 * v * v * v + 1.70158 * v * v; }   // geri esneyen büyüme
// ── küçük yardımcılar ──
function fz8Kemik(x, ax, ay, bx, by, r) {   // tombul kemik: kalın gövde + iki uçta ikişer yuvarlak topuz (renk önceden)
  const L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L * r * 0.62, ny = (bx - ax) / L * r * 0.62, k = r * 0.68;
  x.lineWidth = r * 1.1; x.lineCap = 'round'; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
  x.beginPath();
  fzEl(x, ax + nx, ay + ny, k, k); fzEl(x, ax - nx, ay - ny, k, k); fzEl(x, bx + nx, by + ny, k, k); fzEl(x, bx - nx, by - ny, k, k);
  x.fill();
}
function fz8KemikP(x, ax, ay, bx, by, r, far) {   // parlayan kemik: önce açık mavi hâle, sonra beyaz kemik
  const p = fz8M.parla;
  x.globalAlpha = (far ? 0.25 : 0.42) * p; x.fillStyle = x.strokeStyle = FZ8.kemH; fz8Kemik(x, ax, ay, bx, by, r * 1.55);
  x.globalAlpha = 1; x.fillStyle = x.strokeStyle = far ? FZ8.kemF : FZ8.kem; fz8Kemik(x, ax, ay, bx, by, r);
}
function fz8TaperYol(x, ax, ay, bx, by, r1, r2) { const a = Math.atan2(by - ay, bx - ax); x.moveTo(ax + Math.cos(a + 1.5708) * r1, ay + Math.sin(a + 1.5708) * r1); x.arc(ax, ay, r1, a + 1.5708, a - 1.5708); x.arc(bx, by, r2, a - 1.5708, a + 1.5708); x.closePath(); }
function fz8Yildiz(x, cx, cy, r, rot) { x.save(); x.translate(cx, cy); if (rot) x.rotate(rot); fzStar(x, 0, 0, r); x.restore(); }
// ── renkler: kostüme göre kol, bacak, gövde (null: pijama) ──
function fz8KolRenk(far) { const k = fzKos; return k === 'kabak' ? (far ? FZ8.yesF : FZ8.yes) : k === 'iskelet' ? (far ? FZ8.lacF : FZ8.lac) : k === 'yarasa' ? (far ? FZ8.tulF : FZ8.tul) : null; }
function fz8BacakRenk(far) { const k = fzKos; return k === 'cadi' ? (far ? FZ8.cizF : FZ8.cizA) : k === 'kabak' ? (far ? FZ8.yesF : FZ8.yes) : k === 'iskelet' ? (far ? FZ8.lacF : FZ8.lac) : k === 'yarasa' ? (far ? FZ8.tulF : FZ8.tul) : null; }
function fz8GovdeRenk() { return fzKos === 'iskelet' ? FZ8.lac : fzKos === 'yarasa' ? FZ8.tul : null; }

// ── bacak deseni: çizgili çorap (cadı), kemikler (iskelet); j = fzJ zinciri (kalça, diz, bilek) ──
function fz8BacakDesen(x, j, far) {
  const hx = j[0], hy = j[1], kx = j[2], ky = j[3], ax = j[4], ay = j[5];
  if (fzKos === 'cadi') {
    x.save(); x.beginPath(); fz8TaperYol(x, kx, ky, ax, ay, 2.45, 1.7); fz8TaperYol(x, hx, hy, kx, ky, 2.85, 2.5); x.clip();
    x.strokeStyle = far ? FZ8.cizFK : FZ8.cizK; x.lineWidth = 0.85; x.lineCap = 'butt'; x.beginPath();
    for (let s = 0; s < 2; s++) {   // uyluk ve baldır boyunca, kemiğe dik şeritler
      const x0 = s ? kx : hx, y0 = s ? ky : hy, x1 = s ? ax : kx, y1 = s ? ay : ky, L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L;
      for (let d = s ? 1.2 : 1.0; d < L + (s ? 0.2 : 0.8); d += 1.75) { const cx = x0 + ux * d, cy = y0 + uy * d; x.moveTo(cx - uy * 4, cy + ux * 4); x.lineTo(cx + uy * 4, cy - ux * 4); }
    }
    x.stroke(); x.restore();
  } else if (fzKos === 'iskelet') {
    fz8KemikP(x, lerp(hx, kx, 0.22), lerp(hy, ky, 0.22), lerp(hx, kx, 0.8), lerp(hy, ky, 0.8), 0.78, far);
    fz8KemikP(x, lerp(kx, ax, 0.2), lerp(ky, ay, 0.2), lerp(kx, ax, 0.72), lerp(ky, ay, 0.72), 0.7, far);
  } else if (!far) {   // tulum/tayt: dizde yumuşak parlaklık
    x.fillStyle = 'rgba(255,255,255,0.13)'; x.beginPath(); x.ellipse(kx + 0.6, ky - 0.4, 1.0, 0.75, 0, 0, 6.2832); x.fill();
  }
}
// ── kol: uzun kollu kostümde kol ağzı yerine bilekte manşet + iskelet kemikleri ──
function fz8KolUst(x, sx, sy, ex, ey, wx, wy, far) {
  const k = fzKos;
  fzTaper(x, lerp(ex, wx, 0.8), lerp(ey, wy, 0.8), lerp(ex, wx, 0.97), lerp(ey, wy, 0.97), 1.62, 1.5, k === 'kabak' ? (far ? FZ8.yesK : FZ8.yesA) : k === 'iskelet' ? (far ? FZ8.lacK : FZ8.lacA) : far ? FZ8.tulK : FZ8.tulA);
  if (k === 'iskelet') { fz8KemikP(x, lerp(sx, ex, 0.25), lerp(sy, ey, 0.25), lerp(sx, ex, 0.82), lerp(sy, ey, 0.82), 0.6, far); fz8KemikP(x, lerp(ex, wx, 0.15), lerp(ey, wy, 0.15), lerp(ex, wx, 0.66), lerp(ey, wy, 0.66), 0.56, far); }
}
// el kancası (avuç çizilmeden hemen önce): (hx,hy) avuç, (dx,dy) bilekten parmağa birim yön, sd: önden görünüşte kolun yanı
// (0: yandan), far: yandan görünüşte arka el. Sepet ön elde (önden: ekranda hep aynı elde), asa öbür elde.
function fz8El(x, ex, ey, hx, hy, dx, dy, far, sd, tm) {
  if (fz11P()) return;   // Bölüm 11: elde sepet / asa yok
  const sepet = sd ? sd === fzFS : !far, asa = fzKos === 'cadi' && (sd ? sd === -fzFS : far);
  if (sepet && !(fz8M.sapX === fz8M.sapX)) {   // sepet elde (süpürgede sapta asılı: sapX NaN değil)
    const w = fz8M.dw;
    fz8SepetAs(x, lerp(hx + dx * 0.4, ex + dx * 0.2, w), lerp(hy + dy * 0.4, ey + dy * 0.2 - 0.4, w), tm);
  }
  if (asa) {
    let ax, ay;
    if (sd) { const ph = sd * lerp(1.15, 0.45, clamp(-dy, 0, 1)) + fz8M.don; ax = Math.sin(ph); ay = -Math.cos(ph); }
    else { const c = Math.cos(-1.92 + fz8M.don), s = Math.sin(-1.92 + fz8M.don); ax = dx * c - dy * s; ay = dx * s + dy * c; }
    fz8Asa(x, hx, hy, ax, ay, tm, far && !sd);
  }
}
function fz8Asa(x, hx, hy, ax, ay, tm, arka) {   // ucu yıldız asa (avuçtan geçer: alt ucu yumruğun altında kısa görünür)
  const b = fz8Buyu(), L = 8.6 * b, tx = hx + ax * L, ty = hy + ay * L;
  x.lineCap = 'round'; x.strokeStyle = arka ? '#4a2f6e' : FZ8.asa; x.lineWidth = 0.95;
  x.beginPath(); x.moveTo(hx - ax * 1.9, hy - ay * 1.9); x.lineTo(tx - ax * 1.2, ty - ay * 1.2); x.stroke();
  x.strokeStyle = FZ8.asaA; x.lineWidth = 0.28; x.beginPath(); x.moveTo(hx + ax * 1.5 - ay * 0.22, hy + ay * 1.5 + ax * 0.22); x.lineTo(tx - ax * 1.6 - ay * 0.22, ty - ay * 1.6 + ax * 0.22); x.stroke();
  const r = 2.45 * b, rot = Math.atan2(ax, -ay) + Math.sin(tm * 2.6) * 0.14 + fz8M.don * 0.6;
  x.fillStyle = FZ8.yilK; fz8Yildiz(x, tx, ty, r * 1.17, rot); x.fillStyle = FZ8.yil; fz8Yildiz(x, tx, ty, r, rot);
  x.fillStyle = FZ8.yilA; x.beginPath(); x.arc(tx - 0.45, ty - 0.55, 0.62 * b, 0, 6.2832); x.fill();
  fz8Isik(x, tx, ty, 7.5 * b, '#ffe2a0', (arka ? 0.32 : 0.42) + 0.12 * Math.sin(tm * 5.3));
  fz8Nokta(x, tx, ty, 2); fz8NkA = true;
}

// ── kabak sepeti (yerel: sap tepesi (0,0), aşağısı +y; boyu ≈ 12,7 birim) ──
const FZ8_SK = [[-2.1, -0.35, 0], [0.25, -0.75, 1], [2.3, -0.3, 2], [-1.0, -1.85, 3], [1.35, -1.95, 4], [-2.7, -1.45, 5], [2.75, -1.5, 0], [0.15, -3.1, 2], [-1.5, -3.3, 1], [1.6, -3.4, 3]];
function fz8Seker(x, cx, cy, k) {   // minik şeker: 0 sarma, 1 lolipop, 2 şeker mısır, 3 nane, 4 kalp, 5 yıldız
  const col = FZ8.sek[k % FZ8.sek.length];
  if (k === 1) {
    x.strokeStyle = '#fff7ee'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(cx, cy + 0.6); x.lineTo(cx + 0.3, cy + 2.6); x.stroke();
    x.fillStyle = col; x.beginPath(); x.arc(cx, cy, 1.15, 0, 6.2832); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 0.32; x.beginPath(); x.arc(cx, cy, 0.6, 0.4, 4.6); x.stroke();
  } else if (k === 2) {
    x.fillStyle = '#ffe9a0'; x.beginPath(); x.moveTo(cx - 1.1, cy + 0.9); x.lineTo(cx + 1.1, cy + 0.9); x.lineTo(cx, cy - 1.3); x.closePath(); x.fill();
    x.fillStyle = '#ff9a3c'; x.beginPath(); x.moveTo(cx - 0.75, cy + 0.15); x.lineTo(cx + 0.75, cy + 0.15); x.lineTo(cx + 0.38, cy - 0.55); x.lineTo(cx - 0.38, cy - 0.55); x.closePath(); x.fill();
    x.fillStyle = '#fffaf0'; x.beginPath(); x.moveTo(cx - 0.3, cy - 0.7); x.lineTo(cx + 0.3, cy - 0.7); x.lineTo(cx, cy - 1.3); x.closePath(); x.fill();
  } else if (k === 3) {
    x.fillStyle = '#fffaf6'; x.beginPath(); x.arc(cx, cy, 1.05, 0, 6.2832); x.fill();
    x.strokeStyle = '#ff6f9c'; x.lineWidth = 0.38; x.beginPath(); x.moveTo(cx - 0.9, cy - 0.45); x.lineTo(cx + 0.9, cy + 0.45); x.moveTo(cx - 0.45, cy - 0.9); x.lineTo(cx + 0.45, cy + 0.9); x.moveTo(cx - 0.9, cy + 0.45); x.lineTo(cx + 0.9, cy - 0.45); x.stroke();
  } else if (k === 4) {
    x.fillStyle = col; x.beginPath(); x.moveTo(cx, cy + 1.0); x.bezierCurveTo(cx - 1.6, cy - 0.1, cx - 0.9, cy - 1.4, cx, cy - 0.5); x.bezierCurveTo(cx + 0.9, cy - 1.4, cx + 1.6, cy - 0.1, cx, cy + 1.0); x.fill();
  } else if (k === 5) {
    x.fillStyle = '#ffe47a'; fz8Yildiz(x, cx, cy, 1.25, 0.2);
  } else {
    x.fillStyle = col; x.beginPath(); x.moveTo(cx - 0.9, cy); x.lineTo(cx - 1.9, cy - 0.65); x.lineTo(cx - 1.9, cy + 0.65); x.closePath();
    x.moveTo(cx + 0.9, cy); x.lineTo(cx + 1.9, cy - 0.65); x.lineTo(cx + 1.9, cy + 0.65); x.closePath(); x.moveTo(cx + 1.0, cy); x.arc(cx, cy, 1.0, 0, 6.2832); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.6)'; x.beginPath(); x.arc(cx - 0.35, cy - 0.35, 0.32, 0, 6.2832); x.fill();
  }
}
function fz8SepetCiz(x, dolu, tm, kayit) {
  x.lineCap = 'round'; x.lineJoin = 'round';
  // sap (tutulan yer: tepe)
  x.strokeStyle = '#5a3320'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(-3.75, 5.6); x.bezierCurveTo(-3.7, 0.1, 3.7, 0.1, 3.75, 5.6); x.stroke();
  x.strokeStyle = 'rgba(255,214,160,0.5)'; x.lineWidth = 0.26; x.beginPath(); x.moveTo(-3.3, 4.6); x.bezierCurveTo(-3.1, 1.0, 2.0, 0.6, 2.9, 2.4); x.stroke();
  // gövde: dilimli kabak
  x.save(); x.translate(0, 8.8);
  x.fillStyle = fzGrad(x, 18); x.beginPath(); fzEl(x, 0, 0, 4.75, 3.85); x.fill();
  x.save(); x.beginPath(); fzEl(x, 0, 0, 4.75, 3.85); x.clip();
  x.strokeStyle = 'rgba(165,70,26,0.5)'; x.lineWidth = 0.4; x.beginPath();
  x.moveTo(-1.7, -3.7); x.quadraticCurveTo(-2.9, 0, -1.7, 3.8); x.moveTo(1.7, -3.7); x.quadraticCurveTo(2.9, 0, 1.7, 3.8); x.stroke();
  x.restore();
  x.strokeStyle = FZ8.kabC; x.lineWidth = 0.42; x.beginPath(); fzEl(x, 0, 0, 4.75, 3.85); x.stroke();
  // gülen oyma yüz (içi sıcak ışık): ^ ^ gözler, kocaman gülücük
  for (let p = 0; p < 2; p++) {
    const g2 = p ? 0.18 : 0; x.fillStyle = p ? FZ8.isik : FZ8.isikK; x.beginPath();
    x.moveTo(-2.65 + g2, -0.55); x.quadraticCurveTo(-1.75, -2.25 + g2 * 1.6, -0.85 - g2, -0.55); x.quadraticCurveTo(-1.75, -1.35 + g2, -2.65 + g2, -0.55);
    x.moveTo(0.85 + g2, -0.55); x.quadraticCurveTo(1.75, -2.25 + g2 * 1.6, 2.65 - g2, -0.55); x.quadraticCurveTo(1.75, -1.35 + g2, 0.85 + g2, -0.55);
    x.moveTo(-2.5 + g2, 0.75 + g2 * 0.6); x.quadraticCurveTo(0, 3.6 - g2 * 2.2, 2.5 - g2, 0.75 + g2 * 0.6); x.quadraticCurveTo(0, 1.9, -2.5 + g2, 0.75 + g2 * 0.6); x.fill();
  }
  x.fillStyle = 'rgba(255,170,170,0.5)'; x.beginPath(); fzEl(x, -3.3, 0.6, 0.75, 0.45); fzEl(x, 3.3, 0.6, 0.75, 0.45); x.fill();
  x.fillStyle = 'rgba(255,240,215,0.55)'; x.beginPath(); x.ellipse(1.9, -2.3, 1.2, 0.55, -0.3, 0, 6.2832); x.fill();
  x.restore();
  // ağız (iç) + şekerler + ön dudak
  x.fillStyle = '#6a2c12'; x.beginPath(); fzEl(x, 0, 5.4, 3.55, 1.05); x.fill();
  const n = Math.round(clamp(dolu, 0, 1) * FZ8_SK.length);
  for (let i = 0; i < n; i++) { const q = FZ8_SK[i]; fz8Seker(x, q[0], 5.4 + q[1], q[2]); }
  x.strokeStyle = FZ8.kabK; x.lineWidth = 0.9; x.beginPath(); x.ellipse(0, 5.4, 3.55, 1.05, 0, 0.15, Math.PI - 0.15); x.stroke();
  x.strokeStyle = 'rgba(255,220,170,0.6)'; x.lineWidth = 0.3; x.beginPath(); x.ellipse(0, 5.2, 3.6, 1.1, 0, 3.6, 5.8); x.stroke();
  if (kayit) { fz8Nokta(x, 0, 4.6 - 1.2 * Math.min(1, dolu), 0); fz8NkS = true; }
  fz8Isik(x, 0, 9.6, 5.2, '#ffb84a', 0.16);
}
function fz8SepetAs(x, px, py, tm) {   // sepeti (px,py)'deki elden/dirsekten ekranda aşağı sarkıt (fz8M.se sarkaç açısıyla)
  const v = fz8EkranYon(x, fz8M.se, FZ8_V2), b = fz8Buyu();
  x.save(); x.translate(px, py); x.rotate(Math.atan2(-v[0], v[1])); if (b !== 1) x.scale(b, b); x.scale(0.94, 0.94);
  fz8SepetCiz(x, fz8M.dolu, tm, true);
  x.restore();
}
function fz8Dolu() { const n = typeof V8 !== 'undefined' && V8 ? +V8.seker || 0 : 0; return n > 0 ? 1 - Math.exp(-n / 14) : 0; }

// ── başlıklar (kafa yerel çerçevesinde; on: önden görünüş) ──
function fz8Bas(x, R, tm, on) {
  const k = fzKos;
  if (k === 'cadi') fz8Sapka(x, on, tm);
  else if (k === 'kabak') fz8SapBasi(x, on, tm);
  else if (k === 'iskelet') fz8Tac(x, on, tm, 0);
  else if (k === 'yarasa') fz8Tac(x, on, tm, 1);
  else if (fz11P()) fz11Tac(x, on, tm);   // Bölüm 11: yarasa kanatlı taç
}
function fz8Sapka(x, on, tm) {   // cadı şapkası: geniş siper, eğri uçlu külah (uç yaylı sallanır), altın kurdele, minik yıldızlar
  const b = fz8Buyu(), yw = on ? (fzQ.a_yaw || 0) : 0;
  x.save();
  if (on) { x.translate(0.6 * yw, -13.1); x.rotate(-0.04 + 0.05 * yw); } else { x.translate(0.2, -12.6); x.rotate(-0.17); }
  if (b !== 1) x.scale(b, b);
  const rx = on ? 12.6 : 11.8, ry = on ? 3.1 : 2.35, bw = on ? 6.3 : 6.0;
  x.lineJoin = 'round';
  // siper
  x.fillStyle = FZ8.morK; x.beginPath(); fzEl(x, 0, 0, rx, ry); x.fill();
  x.strokeStyle = FZ8.morC; x.lineWidth = 0.45; x.stroke();
  // külah orta çizgisi: taban (0,-0.3) → diz → uç (eğri; uç geriye yatar, yayla sallanır)
  const bend = (on ? 0.5 + 0.35 * yw : 1.05) + fz8M.su, kx = on ? 0.2 : -1.1, ky = -14.2, L2 = 9.2;
  const tx = kx - Math.sin(bend) * L2, ty = ky - Math.cos(bend) * L2;
  fzKulahYol(x, kx, ky, tx, ty, bw, 10);
  x.fillStyle = FZ8.mor; x.fill();
  x.save(); x.clip();
  x.fillStyle = 'rgba(40,16,96,0.28)'; x.beginPath(); x.ellipse(-bw * 0.95, -8, bw * 0.75, 18, 0.12, 0, 6.2832); x.fill();   // ay ışığına uzak yan gölgede
  x.fillStyle = 'rgba(255,235,255,0.14)'; x.beginPath(); x.ellipse(bw * 0.55, -7, 1.6, 9, 0.12, 0, 6.2832); x.fill();
  x.fillStyle = FZ8.yil; x.fillRect(-12, -3.4, 24, 2.6);                                                                   // altın kurdele
  x.fillStyle = 'rgba(160,90,20,0.35)'; x.fillRect(-12, -1.15, 24, 0.5);
  x.fillStyle = FZ8.yilA;
  fz8Yildiz(x, kx * 0.55 + 1.8, -6.4, 0.95, 0.2); fz8Yildiz(x, kx * 0.8 - 1.6, -11.0, 0.8, -0.3);
  fz8Yildiz(x, lerp(kx, tx, 0.35) + 0.5, lerp(ky, ty, 0.35) + 0.2, 0.62, 0.5);
  x.restore();
  fzKulahYol(x, kx, ky, tx, ty, bw, 10); x.strokeStyle = FZ8.morC; x.lineWidth = 0.5; x.stroke();
  // kurdelede yıldız toka
  x.fillStyle = FZ8.yilK; fz8Yildiz(x, on ? 0 : 2.6, -2.1, 1.55, 0.1); x.fillStyle = FZ8.yil; fz8Yildiz(x, on ? 0 : 2.6, -2.1, 1.25, 0.1);
  // ucun ucunda minik ışıltı topu
  x.fillStyle = FZ8.yil; x.beginPath(); x.arc(tx, ty, 0.75, 0, 6.2832); x.fill();
  // siperin ön yarısı külah tabanının önünde
  x.fillStyle = FZ8.mor; x.beginPath(); x.moveTo(rx, 0); x.ellipse(0, 0, rx, ry, 0, 0, Math.PI); x.closePath(); x.fill();
  x.strokeStyle = FZ8.morC; x.lineWidth = 0.45; x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0, Math.PI); x.stroke();
  x.strokeStyle = 'rgba(225,200,255,0.55)'; x.lineWidth = 0.35; x.beginPath(); x.ellipse(0, 0.1, rx - 0.6, ry - 0.5, 0, 0.35, Math.PI - 0.35); x.stroke();
  x.restore();
}
// külah yolu: taban (0,-0.3) → diz (kx,ky) → uç (tx,ty) eğrisi boyunca incelen dolgu (n parça). Pırıl'ın şapkası da kullanır.
function fzKulahYol(x, kx, ky, tx, ty, bw, n) {
  x.beginPath();
  for (let s = 0; s < 2; s++) for (let i = 0; i <= n; i++) {
    const t = s ? 1 - i / n : i / n, u = 1 - t;
    const px = 2 * u * t * kx + t * t * tx, py = u * u * -0.3 + 2 * u * t * ky + t * t * ty;
    const qx = 2 * u * kx + 2 * t * (tx - kx), qy = 2 * u * (ky + 0.3) + 2 * t * (ty - ky), ql = Math.hypot(qx, qy) || 1;
    const w = (bw * Math.pow(u, 0.95) + 0.32) * (s ? -1 : 1);
    if (!s && !i) x.moveTo(px - qy / ql * w, py + qx / ql * w); else x.lineTo(px - qy / ql * w, py + qx / ql * w);
  }
  x.closePath();
}
function fz8SapBasi(x, on, tm) {   // kabak başlığı: yeşil çanak (alt kenarı yuvarlak dilimli), kıvrık sap, yaprak, kıvır kıvır filiz
  const b = fz8Buyu(), sw = fz8M.su, yw = on ? (fzQ.a_yaw || 0) : 0;
  x.save();
  if (on) x.translate(0.5 * yw, -13.9); else { x.translate(-0.5, -13.5); x.rotate(-0.12); }
  if (b !== 1) x.scale(b, b);
  const w = on ? 6.9 : 6.5;
  x.lineJoin = 'round'; x.lineCap = 'round';
  x.fillStyle = FZ8.yes; x.beginPath(); x.moveTo(-w, 1.0); x.bezierCurveTo(-w + 0.3, -3.9, w - 0.3, -4.1, w, 0.8);
  for (let i = 0; i < 5; i++) { const a0 = w - i * (2 * w / 5), a1 = a0 - 2 * w / 5; x.quadraticCurveTo((a0 + a1) / 2, 3.4, a1, i === 4 ? 1.0 : 0.9); }
  x.closePath(); x.fill(); x.strokeStyle = FZ8.yesK; x.lineWidth = 0.45; x.stroke();
  x.strokeStyle = 'rgba(30,80,25,0.45)'; x.lineWidth = 0.35; x.beginPath();
  for (let i = 1; i < 5; i++) { const a = w - i * (2 * w / 5); x.moveTo(a * 0.75, -2.2 + Math.abs(a) * 0.12); x.lineTo(a, 0.9); }
  x.stroke();
  x.strokeStyle = 'rgba(210,255,180,0.55)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(-w * 0.55, -1.7); x.quadraticCurveTo(0, -3.5, w * 0.45, -2.0); x.stroke();
  // sap (yaylı)
  x.save(); x.translate(0.1, -2.9); x.rotate(-0.25 + sw * 0.9);
  x.strokeStyle = FZ8.sapK; x.lineWidth = 2.4; x.beginPath(); x.moveTo(0, 0.4); x.quadraticCurveTo(0.5, -2.6, -0.9, -4.6); x.stroke();
  x.strokeStyle = FZ8.sap; x.lineWidth = 1.6; x.stroke();
  x.strokeStyle = 'rgba(235,255,190,0.5)'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(0.35, -0.4); x.quadraticCurveTo(0.6, -2.4, -0.3, -3.9); x.stroke();
  x.fillStyle = FZ8.sapK; x.beginPath(); fzEl(x, -0.95, -4.7, 1.0, 0.75); x.fill();
  x.restore();
  // yaprak
  x.save(); x.translate(on ? 1.0 : 0.9, -2.6); x.rotate((on ? -0.45 : -0.6) - sw * 0.6);
  x.fillStyle = FZ8.yesA; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(2.0, -3.0, 5.9, -0.9); x.quadraticCurveTo(2.9, 1.8, 0, 0); x.fill();
  x.strokeStyle = FZ8.yesK; x.lineWidth = 0.38; x.stroke();
  x.beginPath(); x.moveTo(0.4, -0.1); x.quadraticCurveTo(2.8, -0.9, 5.2, -0.8); x.stroke();
  x.restore();
  // filiz
  x.strokeStyle = FZ8.yesA; x.lineWidth = 0.42; x.beginPath(); x.moveTo(-0.8, -2.6);
  x.quadraticCurveTo(-2.6, -4.2 - sw, -4.0, -3.4); x.arc(-3.7, -2.7, 0.75, 3.6, 8.8); x.stroke();
  x.restore();
}
function fz8Tac(x, on, tm, tur) {   // taç bandı + (0) yaylı gülen kafatası / (1) iki sivri yarasa kulağı
  const b = fz8Buyu(), kb = fz8M.kb, yw = on ? (fzQ.a_yaw || 0) : 0;
  x.save(); if (b !== 1) { x.translate(0, -9); x.scale(b, b); x.translate(0, 9); }
  x.lineCap = 'round';
  const c1 = tur ? FZ8.lilaC : FZ8.lacK, c2 = tur ? FZ8.lila : FZ8.lacA;
  x.strokeStyle = c1; x.lineWidth = 1.9; x.beginPath();
  if (on) x.ellipse(0.5 * yw, -1.6, 9.5, 14.0, 0, Math.PI * 1.07, Math.PI * 1.93); else { x.moveTo(-2.9, -2.0); x.quadraticCurveTo(-4.6, -12.9, 2.4, -15.1); }
  x.stroke(); x.strokeStyle = c2; x.lineWidth = 0.75; x.stroke();
  if (tur) {
    if (on) { fz8Kulak(x, -5.0 + 0.8 * yw, -13.3, -0.5 - kb * 0.35, -1, false); fz8Kulak(x, 5.0 + 0.8 * yw, -13.3, 0.5 + kb * 0.35, 1, false); }
    else { fz8Kulak(x, -3.6, -13.4, -0.62 + kb * 0.45, 1, true); fz8Kulak(x, 2.1, -14.8, -0.12 + kb * 0.55, 1, false); }
  } else {
    const bx = on ? 2.2 + 0.6 * yw : 1.0, by0 = on ? -15.3 : -15.2, Ls = 6.0, sx = bx + Math.sin(kb) * Ls, sy = by0 - Math.cos(kb) * Ls;
    x.strokeStyle = '#d6d9f6'; x.lineWidth = 0.5; x.lineJoin = 'round'; x.beginPath(); x.moveTo(bx, by0);
    const nx = -(sy - by0) / Ls, ny = (sx - bx) / Ls;
    for (let i = 1; i < 7; i++) { const t = i / 7, z = (i & 1 ? 0.8 : -0.8); x.lineTo(lerp(bx, sx, t) + nx * z, lerp(by0, sy, t) + ny * z); }
    x.lineTo(sx, sy); x.stroke();
    fz8Kafatasi(x, sx, sy - 3.1, 1.18, kb);
  }
  x.restore();
}
function fz8Kulak(x, px, py, rot, sd, far) {   // iri, yuvarlak yarasa kulağı (yaprak gibi: geniş taban, yumuşak uç; dış lila, iç pembe, iki minik kıvrım)
  x.save(); x.translate(px, py); x.rotate(rot); x.scale(sd, 1);
  x.fillStyle = far ? FZ8.lilaK : FZ8.lila; x.beginPath();
  x.moveTo(-2.9, 0.9); x.bezierCurveTo(-3.8, -3.0, -2.0, -7.3, 1.0, -7.6); x.bezierCurveTo(3.6, -7.9, 5.4, -4.9, 4.6, -1.7); x.quadraticCurveTo(4.2, -0.2, 3.8, 0.9); x.closePath();
  x.fill(); x.strokeStyle = FZ8.lilaC; x.lineWidth = 0.45; x.lineJoin = 'round'; x.stroke();
  x.fillStyle = far ? '#d88ab8' : FZ8.pem; x.beginPath();
  x.moveTo(-1.6, 0.4); x.bezierCurveTo(-2.3, -2.3, -1.1, -5.4, 1.0, -5.6); x.bezierCurveTo(2.8, -5.8, 3.8, -3.6, 3.3, -1.3); x.quadraticCurveTo(3.0, -0.2, 2.7, 0.4); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(200,80,140,0.45)'; x.lineWidth = 0.3; x.lineCap = 'round'; x.beginPath();
  x.moveTo(0.2, -0.8); x.quadraticCurveTo(1.1, -1.6, 2.0, -0.9); x.moveTo(0.6, -2.6); x.quadraticCurveTo(1.5, -3.3, 2.3, -2.6); x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(-1.4, -3.0, 0.45, 1.4, 0.5, 0, 6.2832); x.fill();
  x.restore();
}
function fz8Kafatasi(x, cx, cy, s, rot) {   // sevimli yuvarlak kafatası: iri parlak boncuk gözler, minik burun, gülücük, pembe yanaklar
  x.save(); x.translate(cx, cy); x.rotate(rot * 0.5); if (s !== 1) x.scale(s, s);
  x.fillStyle = FZ8.kem; x.beginPath(); fzEl(x, 0, -0.2, 3.9, 3.55); fzEl(x, 0, 2.15, 2.45, 1.6); x.fill();
  x.fillStyle = 'rgba(150,140,205,0.28)'; x.beginPath(); x.ellipse(0.7, 2.2, 2.6, 1.3, 0, 0, 6.2832); x.fill();
  x.strokeStyle = 'rgba(105,95,170,0.55)'; x.lineWidth = 0.32; x.beginPath(); x.ellipse(0, -0.2, 3.9, 3.55, 0, 3.6, 8.9); x.stroke();
  x.fillStyle = '#231a3c'; x.beginPath(); fzEl(x, -1.4, -0.35, 1.08, 1.28); fzEl(x, 1.4, -0.35, 1.08, 1.28); x.fill();
  x.fillStyle = '#ffffff'; x.beginPath(); fzEl(x, -1.08, -0.85, 0.4, 0.4); fzEl(x, 1.72, -0.85, 0.4, 0.4); fzEl(x, -1.7, 0.2, 0.18, 0.18); fzEl(x, 1.1, 0.2, 0.18, 0.18); x.fill();
  x.fillStyle = '#3a2c58'; x.beginPath(); x.moveTo(-0.45, 1.0); x.quadraticCurveTo(0, 1.75, 0.45, 1.0); x.closePath(); x.fill();
  x.strokeStyle = '#3a2c58'; x.lineWidth = 0.32; x.lineCap = 'round'; x.beginPath(); x.moveTo(-1.25, 2.15); x.quadraticCurveTo(0, 3.05, 1.25, 2.15);
  x.moveTo(-0.42, 2.5); x.lineTo(-0.42, 2.95); x.moveTo(0.42, 2.5); x.lineTo(0.42, 2.95); x.stroke();
  x.fillStyle = 'rgba(255,140,185,0.5)'; x.beginPath(); fzEl(x, -2.5, 1.15, 0.8, 0.5); fzEl(x, 2.5, 1.15, 0.8, 0.5); x.fill();
  x.restore();
}

// ── yaka (gövdeden sonra, boyunda): cadı pelerin yakası + yıldız toka, kabak çanak yaprakları, tulum yakaları ──
function fz8Yaka(x, by, on) {
  const k = fzKos; x.lineCap = 'round'; x.lineJoin = 'round';
  if (fz11P()) { fz11Yaka(x, by, on); return; }   // Bölüm 11: dik vampir yakası + toka
  if (k === 'cadi' || k === 'yarasa') {
    const c = k === 'cadi' ? FZ8.morK : FZ8.lilaK, cA = k === 'cadi' ? FZ8.mor : FZ8.lila;
    x.strokeStyle = c; x.lineWidth = 1.9; x.beginPath();
    if (on) { x.moveTo(-5.0, -13.6 + by); x.quadraticCurveTo(0, -11.1 + by, 5.0, -13.6 + by); } else { x.moveTo(-2.8, -14.6 + by); x.quadraticCurveTo(0.6, -12.6 + by, 3.9, -13.4 + by); }
    x.stroke(); x.strokeStyle = cA; x.lineWidth = 0.8; x.stroke();
    const sx = on ? 0 : 3.4, sy = on ? -12.3 + by : -13.1 + by;
    if (k === 'cadi') { x.fillStyle = FZ8.yilK; fz8Yildiz(x, sx, sy, 1.45, 0); x.fillStyle = FZ8.yil; fz8Yildiz(x, sx, sy, 1.15, 0); }
    else { x.fillStyle = FZ8.pem; x.beginPath(); x.arc(sx, sy, 0.8, 0, 6.2832); x.fill(); }
  } else if (k === 'kabak') {   // kabağın tepesindeki yeşil çanak yaprakları (boynun çevresinde)
    x.fillStyle = FZ8.yes; x.strokeStyle = FZ8.yesK; x.lineWidth = 0.38; x.beginPath();
    const n = on ? 5 : 4, x0 = on ? -5.2 : -3.0, x1 = on ? 5.2 : 4.4, y0 = on ? -13.9 : -14.9;
    for (let i = 0; i < n; i++) {
      const a = lerp(x0, x1, i / (n - 1)), yy = y0 + by + (on ? Math.abs(a) * 0.1 : 0);
      x.moveTo(a - 1.5, yy); x.quadraticCurveTo(a - 0.5, yy + 2.6, a + 0.3, yy + 2.9); x.quadraticCurveTo(a + 0.9, yy + 1.4, a + 1.5, yy); x.closePath();
    }
    x.fill(); x.stroke();
  } else if (k === 'iskelet') {
    x.strokeStyle = FZ8.lacK; x.lineWidth = 0.9; x.beginPath();
    if (on) x.ellipse(0, -13.0 + by, 2.7, 1.0, 0, 0.15, 2.99); else x.ellipse(1.7, -13.2 + by, 2.5, 0.9, -0.12, 0.25, 2.9);
    x.stroke();
  }
}

// ── gövde: kabak (yeni biçim), tulumların deseni (fzTorso'nun kırpması içinde) ──
const FZ8_KB_Y = [[-3.6, 0.15, 5.3, 7.9], [3.9, 0.15, 4.9, 7.9], [0.1, -0.1, 6.3, 8.6]];
const FZ8_KB_O = [[-6.5, 0.3, 3.9, 7.2], [6.5, 0.3, 3.9, 7.2], [-3.4, 0.05, 4.7, 8.2], [3.4, 0.05, 4.7, 8.2], [0, -0.1, 5.1, 8.7]];
function fz8KabakGovde(x, R, tm, on) {
  const M = fz8M, j = M.j, br = R.breath, L = on ? FZ8_KB_O : FZ8_KB_Y, b = fz8Buyu();
  x.save(); x.translate(on ? 0 : 0.6, -6.6); x.scale((1 + j) * (1 + 0.022 * br) * (0.6 + 0.4 * b), (1 - j * 0.9) * (1 + 0.028 * br) * (0.6 + 0.4 * b));
  x.beginPath(); for (let i = 0; i < L.length; i++) { const q = L[i]; fzEl(x, q[0], q[1], q[2], q[3]); }
  x.fillStyle = fzGrad(x, on ? 17 : 16); x.fill();
  x.save(); x.clip();
  x.fillStyle = 'rgba(120,40,12,0.18)'; x.beginPath(); x.ellipse(on ? -8 : -7.5, 2, 5, 10, 0, 0, 6.2832); x.fill();
  x.strokeStyle = 'rgba(165,70,26,0.55)'; x.lineWidth = 0.5; x.lineCap = 'round'; x.beginPath();
  if (on) { for (let a = -1; a <= 1; a += 2) { x.moveTo(a * 1.7, -8.2); x.quadraticCurveTo(a * 3.2, 0, a * 1.7, 8.2); x.moveTo(a * 5.0, -7.4); x.quadraticCurveTo(a * 7.0, 0, a * 5.0, 7.4); } }
  else { x.moveTo(-1.4, -8.2); x.quadraticCurveTo(-3.6, 0, -1.4, 8.3); x.moveTo(3.0, -8.0); x.quadraticCurveTo(5.0, 0, 3.0, 8.1); x.moveTo(-5.4, -6.6); x.quadraticCurveTo(-8.0, 0, -5.4, 6.8); }
  x.stroke();
  x.fillStyle = 'rgba(255,236,190,0.32)'; x.beginPath(); x.ellipse(on ? 2.6 : 3.8, -5.4, 2.0, 1.1, -0.5, 0, 6.2832); x.fill();
  x.restore();
  x.strokeStyle = FZ8.kabC; x.lineWidth = 0.48; x.beginPath(); for (let i = 0; i < L.length; i++) { const q = L[i]; fzEl(x, q[0], q[1], q[2], q[3]); } x.stroke();
  // gülen oyma yüz: yuvarlatılmış üçgen gözler, iki dişli kocaman gülücük (içi ışık; önce koyu oyma kenarı, sonra ışık)
  const fx = on ? 0 : 4.3, ew = on ? 2.7 : 2.2;
  for (let p = 0; p < 2; p++) {
    x.fillStyle = p ? FZ8.isik : FZ8.isikK; const g2 = p ? -0.3 : 0;
    x.beginPath();
    for (let e = -1; e <= 1; e += 2) {
      const ex = fx + e * (on ? 3.2 : e > 0 ? 1.45 : 2.0), w = (e > 0 && !on ? ew * 0.7 : ew) + g2, ey = -2.9, b0 = ey + 1.0 + g2 * 0.3;
      x.moveTo(ex - w * 0.5, b0); x.quadraticCurveTo(ex, ey - 1.9 - g2 * 0.4, ex + w * 0.5, b0); x.quadraticCurveTo(ex, ey + 1.35, ex - w * 0.5, b0);
    }
    const mw = (on ? 5.2 : 3.6) + g2, mx = fx + (on ? 0 : 0.3);
    x.moveTo(mx - mw, 0.6 - g2 * 0.2); x.quadraticCurveTo(mx, 6.0 + g2 * 0.6, mx + mw * (on ? 1 : 0.95), 0.5 - g2 * 0.2);
    x.lineTo(mx + mw * 0.45, 1.5); x.lineTo(mx + mw * 0.3, 0.9 - g2 * 0.4); x.lineTo(mx - mw * 0.3, 1.2 - g2 * 0.4); x.lineTo(mx - mw * 0.45, 1.8); x.closePath();
    x.fill();
  }
  x.fillStyle = 'rgba(255,248,215,0.7)'; x.beginPath(); fzEl(x, fx - (on ? 3.2 : 2.0), -2.1, 0.55, 0.38); fzEl(x, fx + (on ? 3.2 : 1.45), -2.1, 0.5, 0.36); x.fill();
  fz8Isik(x, fx, -0.5, 9, '#ffb24a', 0.2 + 0.05 * Math.sin(tm * 3.1));
  x.restore();
}
function fz8GovdeDesen(x, on) {   // tulumun göğüs deseni (kırpma içinde): iskelet kaburgaları / yarasa göbeği
  if (fzKos === 'iskelet') {
    const p = fz8M.parla;
    for (let s = 0; s < 2; s++) {
      x.lineCap = 'round'; x.strokeStyle = s ? FZ8.kem : FZ8.kemH; x.globalAlpha = s ? 1 : 0.42 * p; x.lineWidth = s ? 1.25 : 2.5;
      x.beginPath();
      if (on) {
        x.moveTo(0, -12.6); x.lineTo(0, -6.0);
        for (let k = 0; k < 3; k++) { const y = -11.4 + k * 2.55; x.moveTo(-0.5, y); x.quadraticCurveTo(-3.8, y - 0.5, -5.1, y + 1.7); x.moveTo(0.5, y); x.quadraticCurveTo(3.8, y - 0.5, 5.1, y + 1.7); }
      } else {
        x.moveTo(3.9, -12.6); x.lineTo(3.7, -6.2);
        for (let k = 0; k < 3; k++) { const y = -11.4 + k * 2.6; x.moveTo(-4.4, y - 0.4); x.quadraticCurveTo(-0.2, y + 0.9 + k * 0.2, 3.3, y + 0.2); }
      }
      x.stroke();
      if (s) {   // omurga uçlarında yuvarlak topuzlar
        x.fillStyle = FZ8.kem; x.beginPath();
        if (on) { fzEl(x, 0, -12.8, 1.0, 0.85); fzEl(x, 0, -5.8, 0.95, 0.8); } else { fzEl(x, 3.9, -12.8, 0.95, 0.8); fzEl(x, 3.7, -6.0, 0.9, 0.75); }
        x.fill();
      }
    }
    x.globalAlpha = 1;
  } else if (fzKos === 'yarasa') {
    const cx = on ? 0 : 2.9, sq = on ? 1 : 0.72;
    x.fillStyle = FZ8.tulA; x.beginPath(); if (on) fzEl(x, 0, -6.2, 4.3, 5.4); else fzEl(x, cx, -6.3, 3.2, 5.1); x.fill();
    // göğüste minik yarasa: yuvarlak gövde, iki taraklı kanat, iki kulak (koyu mor)
    x.save(); x.translate(cx, -7.4); x.scale(0.62 * sq, 0.62);
    x.fillStyle = FZ8.lilaC; x.beginPath(); x.moveTo(-1.2, -1.2);
    x.quadraticCurveTo(-3.6, -3.2, -6.6, -1.6); x.quadraticCurveTo(-5.4, -0.6, -5.2, 0.9); x.quadraticCurveTo(-4.2, 0.0, -3.3, 1.2); x.quadraticCurveTo(-2.4, 0.4, -1.3, 1.6);
    x.lineTo(1.3, 1.6); x.quadraticCurveTo(2.4, 0.4, 3.3, 1.2); x.quadraticCurveTo(4.2, 0.0, 5.2, 0.9); x.quadraticCurveTo(5.4, -0.6, 6.6, -1.6); x.quadraticCurveTo(3.6, -3.2, 1.2, -1.2); x.closePath(); x.fill();
    x.beginPath(); fzEl(x, 0, 0, 1.9, 2.0); x.moveTo(-1.5, -1.0); x.lineTo(-1.1, -3.0); x.lineTo(-0.3, -1.6); x.closePath(); x.moveTo(1.5, -1.0); x.lineTo(1.1, -3.0); x.lineTo(0.3, -1.6); x.closePath(); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); fzEl(x, -0.65, -0.3, 0.42, 0.48); fzEl(x, 0.65, -0.3, 0.42, 0.48); x.fill();
    x.restore();
  }
}
function fz8Sort(x, on) {   // şort yerine tulum rengi (iskelet: kalçada minik kemik), kabak: yeşil taytın üstü; cadı: pijama (false)
  const c = fzKos === 'kabak' ? FZ8.yes : fz8GovdeRenk();
  if (!c) return false;
  x.fillStyle = c; x.beginPath(); if (on) x.roundRect(-6.0, -1.0, 12.0, 4.6, 2.0); else x.ellipse(0.3, 0.6, 5.9, 3.7, 0, 0, 6.2832); x.fill();
  x.fillStyle = 'rgba(20,10,50,0.16)'; x.beginPath(); if (on) x.ellipse(0, 2.6, 5.4, 1.6, 0, 0, 6.2832); else x.ellipse(-1.4, 1.6, 4.4, 2.6, 0, 0, 6.2832); x.fill();
  if (fzKos === 'iskelet') {
    x.globalAlpha = 0.4 * fz8M.parla; x.fillStyle = FZ8.kemH; x.beginPath(); if (on) { fzEl(x, -2.3, 1.2, 2.2, 1.6); fzEl(x, 2.3, 1.2, 2.2, 1.6); } else fzEl(x, 0.8, 0.9, 2.6, 1.7); x.fill(); x.globalAlpha = 1;
    x.fillStyle = FZ8.kem; x.beginPath(); if (on) { fzEl(x, -2.2, 1.2, 1.6, 1.05); fzEl(x, 2.2, 1.2, 1.6, 1.05); } else fzEl(x, 0.8, 0.9, 1.9, 1.1); x.fill();
  }
  return true;
}

// ── pelerin (cadı): boyundan sarkar; ekran aşağısına göre durur, hızla/düşüşle geriye savrulur, ucu dalgalanır ──
const FZ8_PY = [[-2.4, 4.6, 1.0], [-4.0, 10.6, 1.12], [-0.6, 12.6, 0.9], [-4.4, 16.2, 0.95], [0.8, 6.8, 0.78], [-1.9, 17.0, 0.82], [-5.6, 13.4, 0.7]];
let fz8Ax = 0, fz8Ay = 1, fz8Fx = 1, fz8Fy = 0;   // pelerin ekseni (aşağı) ve ileri yönü (yerel)
function fz8P(x, u, v, m) { const px = u * fz8Fx + v * fz8Ax, py = u * fz8Fy + v * fz8Ay; if (m) x.moveTo(px, py); else x.lineTo(px, py); }
function fz8Q(x, cu, cv, u, v) { x.quadraticCurveTo(cu * fz8Fx + cv * fz8Ax, cu * fz8Fy + cv * fz8Ay, u * fz8Fx + v * fz8Ax, u * fz8Fy + v * fz8Ay); }
function fz8PelerinEksen(x, a) {   // ekran aşağısını a kadar geriye (yerel -x) döndür
  const d = fz8EkranYon(x, 0, FZ8_V), ca = Math.cos(a), sa = Math.sin(a);
  fz8Ax = d[0] * ca - d[1] * sa; fz8Ay = d[0] * sa + d[1] * ca; fz8Fx = fz8Ay; fz8Fy = -fz8Ax;
}
function fz8Dalga(i) { const M = fz8M; return Math.sin(M.tm * (7.4 + 2 * M.pf) + i * 1.9) * (0.25 + 1.0 * M.pf); }
function fz8PelerinYolY(x, Lc, fl, pf, bat) {
  x.beginPath(); fz8P(x, 2.9, -0.9, true); fz8Q(x, 0.6, -1.6, -1.8, -0.2);
  fz8Q(x, -4.6 - 0.8 * pf + fz8Dalga(5) * 0.4, 7.2, -5.6 - fl, Lc + fz8Dalga(0) * 0.5);
  if (bat) {   // yarasa pelerini: etek üç taraklı (sivri uçlar arasında içe kıvrık yaylar)
    const u0 = -5.6 - fl, u3 = 1.8, v3 = Lc - 0.9;
    for (let i = 1; i <= 3; i++) {
      const ua = lerp(u0, u3, (i - 1) / 3), ub = lerp(u0, u3, i / 3), va = i === 1 ? Lc + fz8Dalga(0) * 0.5 : Lc + 0.9 - i * 0.35 + fz8Dalga(i) * 0.5, vb = i === 3 ? v3 : Lc + 0.9 - (i + 1) * 0.35 + fz8Dalga(i + 1) * 0.5;
      fz8Q(x, (ua + ub) / 2, Math.min(va, vb) - 2.2, ub, vb);
    }
  } else {
    fz8Q(x, -4.7 - fl * 0.6, Lc + 1.2 + fz8Dalga(1), -3.3 - fl * 0.3, Lc + fz8Dalga(2) * 0.6);
    fz8Q(x, -2.1, Lc + 1.1 + fz8Dalga(3), -0.6, Lc - 0.2 + fz8Dalga(4) * 0.5);
    fz8Q(x, 0.7, Lc + 0.6, 1.8, Lc - 0.9);
  }
  fz8Q(x, 3.6, 7.0, 2.9, -0.9); x.closePath();
}
function fz8PelerinYan(x, R, hip, by) {
  const M = fz8M, b = fz8Buyu(), pf = M.pf, bat = fzKos === 'yarasa';
  x.save(); x.translate(R.hx, hip); x.rotate(R.lean); x.translate(-1.9, -13.6 + by); if (b !== 1) x.scale(b, b);
  fz8PelerinEksen(x, M.pa * (bat ? 0.85 : 1));
  const Lc = (bat ? 17.2 : 18.6) - 1.2 * clamp(M.pa - 0.9, 0, 1), fl = (bat ? 1.8 : 1.0) + 1.6 * pf + (bat ? 1.4 * M.kn : 0);
  fz8PelerinYolY(x, Lc, fl, pf, bat); x.fillStyle = bat ? FZ8.lila : FZ8.mor; x.fill();
  if (bat) {   // yarasa: kanat zarının parmak kemikleri, gölge; yıldız yok
    x.save(); x.clip();
    x.fillStyle = 'rgba(60,30,120,0.3)'; x.beginPath(); fz8P(x, -1.0, -1, true); fz8P(x, -7.5 - fl, Lc + 3); fz8P(x, -12, Lc + 3); fz8P(x, -12, -2); x.fill();
    x.strokeStyle = 'rgba(79,53,144,0.55)'; x.lineWidth = 0.42; x.lineCap = 'round'; x.beginPath();
    for (let i = 1; i < 3; i++) { fz8P(x, -1.4, 1.0, true); fz8Q(x, lerp(-5.6 - fl, 1.8, i / 3) - 1.0, Lc * 0.55, lerp(-5.6 - fl, 1.8, i / 3), Lc + 0.9 - (i + 1) * 0.35); }
    x.stroke(); x.restore();
    fz8PelerinYolY(x, Lc, fl, pf, true); x.strokeStyle = FZ8.lilaC; x.lineWidth = 0.5; x.lineJoin = 'round'; x.stroke();
    x.restore(); return;
  }
  x.save(); x.clip();
  x.fillStyle = 'rgba(40,16,96,0.3)'; x.beginPath(); fz8P(x, -1.0, -1, true); fz8P(x, -7.5 - fl, Lc + 3); fz8P(x, -12, Lc + 3); fz8P(x, -12, -2); x.fill();   // geride kalan kenar gölgede
  x.fillStyle = FZ8.astar; x.beginPath(); fz8P(x, -8 - fl, Lc - 0.2 + fz8Dalga(1) * 0.3, true); fz8P(x, 2.5, Lc - 0.7); fz8P(x, 2.5, Lc + 3); fz8P(x, -8 - fl, Lc + 3); x.fill();   // etekte astar kalınlığı
  x.strokeStyle = 'rgba(30,12,80,0.35)'; x.lineWidth = 0.45; x.lineCap = 'round'; x.beginPath();
  fz8P(x, -1.2, 2.5, true); fz8Q(x, -2.4 - 0.4 * pf, 9, -3.0 - fl * 0.4, Lc - 0.6); fz8P(x, 0.8, 4.0, true); fz8Q(x, 0.1, 10, -0.6, Lc - 1.0); x.stroke();
  x.fillStyle = FZ8.yil;
  for (let i = 0; i < FZ8_PY.length; i++) { const q = FZ8_PY[i], u = q[0] - (q[1] / Lc) * fl * 0.4, v = q[1]; fz8Yildiz(x, u * fz8Fx + v * fz8Ax, u * fz8Fy + v * fz8Ay, q[2], i * 0.7); }
  x.restore();
  fz8PelerinYolY(x, Lc, fl, pf); x.strokeStyle = FZ8.morC; x.lineWidth = 0.5; x.lineJoin = 'round'; x.stroke();
  x.restore();
}
function fz8PelerinYolO(x, Lc, fl) {
  x.beginPath(); fz8P(x, -5.4, 0.2, true); fz8Q(x, -8.4, 7, -10.0 - fl + fz8Dalga(0) * 0.3, Lc + fz8Dalga(1) * 0.4);
  fz8Q(x, -6.8, Lc + 1.4 + fz8Dalga(2), -3.4, Lc + 0.1 + fz8Dalga(3) * 0.5); fz8Q(x, 0, Lc + 1.3 + fz8Dalga(4), 3.4, Lc + 0.1 + fz8Dalga(5) * 0.5);
  fz8Q(x, 6.8, Lc + 1.4 + fz8Dalga(6), 10.0 + fl + fz8Dalga(7) * 0.3, Lc + fz8Dalga(8) * 0.4); fz8Q(x, 8.4, 7, 5.4, 0.2); fz8Q(x, 0, -1.8, -5.4, 0.2); x.closePath();
}
function fz8PelerinOn(x, hip, by) {   // önden: gövdenin arkasında iki yana açılan pelerin (içi koyu astar, kenarlarda yıldızlı dış kumaş)
  const M = fz8M, b = fz8Buyu(), pf = M.pf;
  x.save(); x.translate(0, hip); if (fzQ.a_tilt) x.rotate(fzQ.a_tilt * 0.6); x.translate(0, -13.2 + by); if (b !== 1) x.scale(b, b);
  fz8PelerinEksen(x, 0);
  const Lc = 19.2 - 1.5 * clamp(M.pa - 0.6, 0, 1), fl = 1.2 + 1.4 * pf + 0.8 * clamp(M.pa, 0, 1.2);
  fz8PelerinYolO(x, Lc, fl); x.fillStyle = FZ8.astar; x.fill();
  x.save(); x.clip();
  x.strokeStyle = FZ8.mor; x.lineWidth = 5.0; x.lineJoin = 'round'; x.beginPath();
  fz8P(x, -5.4, 0.2, true); fz8Q(x, -8.4, 7, -10.0 - fl + fz8Dalga(0) * 0.3, Lc + fz8Dalga(1) * 0.4); fz8P(x, 5.4, 0.2, true); fz8Q(x, 8.4, 7, 10.0 + fl + fz8Dalga(7) * 0.3, Lc + fz8Dalga(8) * 0.4); x.stroke();
  x.fillStyle = FZ8.yil;
  for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 3; i++) { const v = 4 + i * 5.2, u = s * (lerp(6.4, 9.6 + fl, v / Lc) - 0.4); fz8Yildiz(x, u * fz8Fx + v * fz8Ax, u * fz8Fy + v * fz8Ay, 0.85, i + s); }
  x.restore();
  fz8PelerinYolO(x, Lc, fl); x.strokeStyle = FZ8.morC; x.lineWidth = 0.5; x.stroke();
  x.restore();
}
// ── yarasa kanat zarı: omuz → dirsek → bilek, bilekten gövdeye (bx,by) taraklı kenar (ekran aşağısına sarkar, rüzgârda geriye) ──
const FZ8_KP = new Float64Array(8);
function fz8Zar(x, sx, sy, ex, ey, wx, wy, bx, by, far) {
  const M = fz8M, b = fz8Buyu();
  if (b !== 1) { ex = lerp(sx, ex, b); ey = lerp(sy, ey, b); wx = lerp(sx, wx, b); wy = lerp(sy, wy, b); bx = lerp(sx, bx, b); by = lerp(sy, by, b); }
  const d = fz8EkranYon(x, 0, FZ8_V), rz = M.ruz, sag = 1.5 + 0.8 * M.kn + 1.4 * rz;
  let dx = d[0] - rz * 1.2, dy = d[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  // kenar bilekten gövdeye uzanırken dışa doğru yelpaze gibi açılır (kol kalktıkça kanat genişler), aşağı da biraz sarkar
  const span = Math.hypot(wx - bx, wy - by) || 1; let nx = -(by - wy) / span, ny = (bx - wx) / span;
  if (nx * ((wx + bx) / 2 - sx) + ny * ((wy + by) / 2 - sy) < 0) { nx = -nx; ny = -ny; }
  const bul = span * (0.3 + 0.12 * M.kn) + 0.6;
  x.fillStyle = far ? FZ8.lilaK : FZ8.lila; x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.lineTo(wx, wy);
  let qx = wx, qy = wy;
  for (let i = 1; i <= 3; i++) {
    const t = i / 3, sn = Math.sin(t * Math.PI), s = sn * sag + (i < 3 ? Math.sin(M.tm * 9 + i) * 0.3 * (M.kn + rz) : 0), o = sn * bul * (i === 3 ? 0 : 1);
    const px = lerp(wx, bx, t) + dx * s + nx * o, py = lerp(wy, by, t) + dy * s + ny * o, mx = (qx + px) / 2, my = (qy + py) / 2;
    x.quadraticCurveTo(mx + (sx - mx) * 0.16, my + (sy - my) * 0.16, px, py);
    FZ8_KP[i * 2 - 2] = px; FZ8_KP[i * 2 - 1] = py; qx = px; qy = py;
  }
  x.closePath(); x.fill();
  x.strokeStyle = FZ8.lilaC; x.lineWidth = 0.42; x.lineJoin = 'round'; x.stroke();
  x.strokeStyle = far ? 'rgba(60,36,120,0.5)' : 'rgba(79,53,144,0.55)'; x.lineWidth = 0.42; x.lineCap = 'round'; x.beginPath();
  x.moveTo(ex, ey); x.lineTo(FZ8_KP[0], FZ8_KP[1]); x.moveTo(ex, ey); x.lineTo(FZ8_KP[2], FZ8_KP[3]); x.stroke();
  if (!far) { x.strokeStyle = 'rgba(240,225,255,0.4)'; x.lineWidth = 0.35; x.beginPath(); x.moveTo(lerp(sx, ex, 0.2), lerp(sy, ey, 0.2) + 0.5); x.lineTo(lerp(ex, wx, 0.8), lerp(ey, wy, 0.8) + 0.5); x.stroke(); }
}
function fz8KanatYan(x, R, hip, by, near) {
  const sx = near ? 1.2 : -0.8, sy = near ? -11.4 + by : -11.8 + by * 0.6, j = fzJ(sx, sy, FZ_UA * R.arm, near ? R.la1 : R.ba1, FZ_FA * R.arm, near ? R.la2 : R.ba2);
  x.save(); x.translate(R.hx, hip); x.rotate(R.lean);
  fz8Zar(x, j[0], j[1], j[2], j[3], j[4] + Math.sin(j[6]) * 0.8, j[5] + Math.cos(j[6]) * 0.8, near ? -3.6 : -5.0, near ? 0.9 : 0.5, !near);
  x.restore();
}
const FZ8_KG = new Float64Array(4), FZ8_J = new Float64Array(6);   // önden kol / bacak zinciri (her karede yeni dizi yok)
function fz8OnKol(i, R, by, out) {   // önden görünüşte i. kolun dirseği ve bileği (fzDrawFront / fzArmIK ile aynı hesap; çizmeden)
  const sd = i ? 1 : -1, sx = sd * 5.5, sy = -11.0 + by;
  if (fzQ.ik) {
    const k = fzQ.ik[i], al = R.arm, dx = k[0] - sx, dy = k[1] - sy, d = Math.hypot(dx, dy) || 0.01;
    const L1 = FZ_UA * al, L2 = (FZ_FA + 1.0) * al, dd = clamp(d, 1.2, L1 + L2 - 0.05);
    const a0 = Math.atan2(dy, dx), ac = Math.acos(clamp((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), -1, 1));
    const p1 = a0 + ac, p2 = a0 - ac, a = sd * Math.cos(p1) + 0.6 * Math.sin(p1) >= sd * Math.cos(p2) + 0.6 * Math.sin(p2) ? p1 : p2;
    out[0] = sx + Math.cos(a) * L1; out[1] = sy + Math.sin(a) * L1; out[2] = sx + dx / d * dd; out[3] = sy + dy / d * dd;
  } else {
    const a1 = i ? R.la1 : R.ba1, a2 = i ? R.la2 : R.ba2, ex = sx + sd * (0.5 + 0.3 * FZ_UA * Math.abs(Math.sin(a1))), ey = sy + FZ_UA * Math.cos(a1), b2 = a1 + a2;
    out[0] = ex; out[1] = ey; out[2] = ex + sd * (0.2 + 0.25 * FZ_FA * Math.abs(Math.sin(b2))); out[3] = ey + FZ_FA * Math.cos(b2);
  }
  return out;
}
const FZ8_KG2 = new Float64Array(4);
function fz8YarasaKenar(x, wx, wy, cx, cy, ox, oy, bul, nx, ny) {   // (wx,wy) → (cx,cy) üç taraklı kenar, uçlar (nx,ny) yönünde dışa açılır; iki ara ucu FZ8_KP'ye yazar
  let qx = wx, qy = wy;
  for (let i = 1; i <= 3; i++) {
    const t = i / 3, o = i === 3 ? 0 : Math.sin(t * Math.PI) * bul;
    const px = lerp(wx, cx, t) + nx * o, py = lerp(wy, cy, t) + ny * o + Math.sin(t * Math.PI) * 1.2, mx = (qx + px) / 2, my = (qy + py) / 2;
    x.quadraticCurveTo(mx + (ox - mx) * 0.14, my + (oy - my) * 0.14, px, py);
    if (i < 3) { FZ8_KP[i * 2 - 2] = px; FZ8_KP[i * 2 - 1] = py; }
    qx = px; qy = py;
  }
}
function fz8OnArka(x, R, hip, by) {   // önden görünüşte her şeyin arkası: pelerin (cadı); yarasa kanat pelerini (bilekten etek ortasına, taraklı)
  if (fzKos === 'cadi') { fz8PelerinOn(x, hip, by); return; }
  if (fz11P()) { fz11PelerinOn(x, R, hip, by); return; }   // Bölüm 11
  if (fzKos !== 'yarasa') return;
  const M = fz8M, b = fz8Buyu();
  x.save(); x.translate(0, hip); if (fzQ.a_tilt) x.rotate(fzQ.a_tilt);
  const L = fz8OnKol(0, R, by, FZ8_KG), Rr = fz8OnKol(1, R, by, FZ8_KG2), hy = 9.4 + 1.2 * M.kn, sy = -11.6 + by;
  const sc = (v, c) => lerp(c, v, b);   // giyerken omuzdan büyüyerek açılır
  // kanadın ön kenarı kolun biraz dışından geçer (kol üstte çizilince kolun ardından lila bir şerit taşar)
  const lex = sc(L[0] - 2.4, -5), ley = sc(L[1], sy), lwx = sc(L[2] - 2.1, -5), lwy = sc(L[3] + 1.0, sy), rex = sc(Rr[0] + 2.4, 5), rey = sc(Rr[1], sy), rwx = sc(Rr[2] + 2.1, 5), rwy = sc(Rr[3] + 1.0, sy), cy = sc(hy, sy);
  const spanL = Math.hypot(lwx, cy - lwy), spanR = Math.hypot(rwx, cy - rwy), bl = (5.8 + 0.22 * spanL + 1.5 * M.kn) * b, br = (5.8 + 0.22 * spanR + 1.5 * M.kn) * b;   // katlıyken de kolların ardından taşar
  x.fillStyle = FZ8.lila; x.beginPath(); x.moveTo(-3.2, -13.4 + by); x.lineTo(-7.4, sy + 0.8); x.lineTo(lex, ley); x.lineTo(lwx, lwy);
  fz8YarasaKenar(x, lwx, lwy, 0, cy, 0, -5, bl, -0.86, 0.5);
  const k0x = FZ8_KP[0], k0y = FZ8_KP[1], k1x = FZ8_KP[2], k1y = FZ8_KP[3];
  fz8YarasaKenar(x, 0, cy, rwx, rwy, 0, -5, br, 0.86, 0.5);
  x.lineTo(rex, rey); x.lineTo(7.4, sy + 0.8); x.lineTo(3.2, -13.4 + by); x.closePath();
  x.fill(); x.strokeStyle = FZ8.lilaC; x.lineWidth = 0.45; x.lineJoin = 'round'; x.stroke();
  x.strokeStyle = 'rgba(79,53,144,0.55)'; x.lineWidth = 0.42; x.lineCap = 'round'; x.beginPath();
  x.moveTo(lex, ley); x.lineTo(k0x, k0y); x.moveTo(lex, ley); x.lineTo(k1x, k1y); x.moveTo(rex, rey); x.lineTo(FZ8_KP[0], FZ8_KP[1]); x.moveTo(rex, rey); x.lineTo(FZ8_KP[2], FZ8_KP[3]); x.stroke();
  x.restore();
}

// ── oyundaki ikincil hareket (fezaUpdate'in sonunda, yalnız Bölüm 8): pelerin, şapka ucu, taç yayı, sepet sarkacı, kabak jölesi ──
function fz8Yay(o, k, kv, t, w, z, dt) { const n = dt > 0.02 ? 2 : 1, h = dt / n; for (let i = 0; i < n; i++) { o[kv] += ((t - o[k]) * w * w - o[kv] * 2 * z * w) * h; o[k] += o[kv] * h; } }
const FZ8_TOZ = ['#fff2b0', '#ffd76a', '#ffffff', '#ffc8f0', '#e9d6ff'];
function fz8Adim(dt, t, gr) {
  const M = FZ8_P, D8 = FZ8D, kos = fz8V8Kos();
  M.tm = t;
  if (kos !== D8.kos) { if (kos) M.giy = D8.kos ? 0.3 : 0; D8.kos = kos; D8.side = P.a_side; }   // yeni kostüm: geri esneyerek büyüyüp belirir
  if (!kos) return;
  M.giy = Math.min(1, M.giy + dt / 0.42);
  const sp = Math.abs(P.vx), vy = P.vy, air = !gr;
  if (P.a_side !== D8.side) { D8.side = P.a_side; M.pav += 4.2; M.suv += 4.5; M.kbv -= 5.5; }   // dönüşte pelerin, şapka ucu ve taç savrulur
  // pelerin: koşuda ve düşüşte geriye savrulur, yükselişte sarkar; ivmede gecikir
  const paT = 0.1 + clamp(sp / 250, 0, 1) * 0.72 + (air ? 0.08 + clamp(vy / 650, -0.25, 1) * 0.62 : 0) + clamp(P.a_ax * 0.00006, -0.12, 0.22);
  fz8Yay(M, 'pa', 'pav', paT, 7.5, 0.4, dt); M.pa = clamp(M.pa, -0.35, 1.55);
  M.pf += (clamp(sp / 260 + (air ? Math.abs(vy) / 700 : 0), 0, 1) - M.pf) * (1 - Math.exp(-dt * 4));
  // şapka ucu / kabak sapı: hız ve ivmeyle geriye, dikey harekette gecikmeli sallanır
  fz8Yay(M, 'su', 'suv', clamp(sp * 0.0009 + P.a_ax * 0.00012 + (air ? -vy * 0.00045 : 0), -0.45, 0.6), 10, 0.2, dt); M.su = clamp(M.su, -0.8, 1.0);
  // taç yayı (kafatası / kulaklar): ivmeyle ters yana, koşu adımıyla hafif zıplar
  fz8Yay(M, 'kb', 'kbv', clamp(-P.a_ax * 0.00014 - sp * 0.0006, -0.6, 0.6) + (gr ? 0.06 * Math.sin(P.a_ph * 2) * clamp(sp / 200, 0, 1) : 0), 13, 0.16, dt); M.kb = clamp(M.kb, -0.9, 0.9);
  if (P.a_landT < dt * 1.5 && P.a_landP > 0.2) { M.kbv += 5 * P.a_landP * (Math.random() < 0.5 ? -1 : 1); M.suv -= 4 * P.a_landP; M.jv += 3 * P.a_landP; }   // inişte zıp
  // sepet sarkacı: elin dünya ivmesiyle (P.a_elX/Y); ekran açısı, + sağa. Düşerken uçmasın diye etkin yerçekimi sınırlı
  const ex = P.a_elX, ey = P.a_elY;
  if (!(dt > 0) || !(D8.ex === D8.ex) || !Number.isFinite(ex) || !Number.isFinite(ey) || Math.abs(ex - D8.ex) + Math.abs(ey - D8.ey) > 90) { D8.ex = ex; D8.ey = ey; D8.evx = D8.evy = 0; }
  else {
    const vx2 = (ex - D8.ex) / dt, vy2 = (ey - D8.ey) / dt, ax = clamp((vx2 - D8.evx) / dt, -5000, 5000), ay = clamp((vy2 - D8.evy) / dt, -5000, 5000);
    D8.ex = ex; D8.ey = ey; D8.evx = vx2; D8.evy = vy2;
    const L = 15, ge = clamp(980 - ay, 160, 2600), th = M.se;
    M.sev += (-ge / L * Math.sin(th) - ax / L * Math.cos(th) - M.sev * 3.4) * dt;
    M.sev = clamp(M.sev, -14, 14); M.se = clamp(th + M.sev * dt, -1.25, 1.25);
  }
  M.dw += ((D8.kapiW > 0.3 ? 1 : 0) - M.dw) * (1 - Math.exp(-dt * 9));
  fz8Yay(M, 'j', 'jv', clamp(P.a_hipV * 0.0022, -0.12, 0.12), 15, 0.28, dt); M.j = clamp(M.j, -0.16, 0.16);
  const dans = fzCadi8();
  M.parla = Math.min(1, 0.82 + 0.18 * Math.sin(t * 2.3) + (dans ? 0.25 : 0));
  M.kn += ((air ? 0.65 : 0) + D8.kn8 - M.kn) * (1 - Math.exp(-dt * 6)); D8.kn8 = 0;
  M.dolu = fz8Dolu(); M.ruz = 0; M.sapX = M.sapY = NaN;
  M.don *= Math.exp(-dt * 6);
  // asa ışıltısı (cadı): asa ucundan arada bir minik yıldız tozu (dansta asayı çevirirken bol)
  if (kos === 'cadi' && typeof parca === 'function' && Number.isFinite(D8.asaWX) && typeof now !== 'undefined' && now - D8.asaT < 0.25) {
    D8.asaPT -= dt * (1.8 + 5 * clamp(sp / 250, 0, 1) + 16 * D8.kivT);
    if (D8.asaPT <= 0) {
      D8.asaPT += 1;
      parca(D8.asaWX + (Math.random() - 0.5) * 5, D8.asaWY + (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 36 - P.vx * 0.12, -18 - Math.random() * 26, 0.6 + Math.random() * 0.45, FZ8_TOZ[(Math.random() * 5) | 0], 3.2 + Math.random() * 2.8);
    }
  }
  D8.kivT = 0;
  if (BOLUM_NO === 11) fz11Adim(dt, kos, sp, air);
}
// kapı çalma: tek "tık" (SOKAK 'sekerKapiTak' yayar ya da fezaKapiTak çağırır; P.kapiCal = sn ile kendiliğinden tık tık)
function fz8Tak() { if (P.a_t - FZ8D.sonTak < 0.1) return; FZ8D.sonTak = P.a_t; FZ8D.tapT = 0; FZ8D.kapiT = 0; P.a_sit = 0; P.a_act = ''; }
function fezaKapiTak(i) { if (BOLUM_NO === 8 && P.a_pose) fz8Tak(); }
function fz8Sevin(o) {   // (feza.js'in 'sevin' tepkisinin eşi) uzanıp sonra kollar havada sevinme
  if (!P.a_pose || !o || !Number.isFinite(o.x) || !Number.isFinite(o.y) || Math.abs(o.x - P.x) > 300) return;
  P.a_cheerT = 0; P.a_cheerO = o; P.a_hug = 0; P.a_cheerDir = Math.sign(o.x - P.x) || P.f; P.a_sit = 0; P.a_act = '';
}
function fz8Saskin(k, dur) { if (!P.a_pose) return; P.a_sur = 1; P.a_surK = k; P.a_surD = dur; P.a_sit = 0; P.a_act = ''; }
// final saati: kabak.js cadiFinalAn() (sn) > cadiMeydan nesnesinin o.age; doruk: o.doruk > 'cadiDoruk' olayı > 28. sn
function fzCadi8() { return BOLUM_NO === 8 && typeof V8 !== 'undefined' && !!V8 && !!V8.final && typeof DURUM !== 'undefined' && DURUM === 'oyun'; }
let fz8MeydanO;   // undefined: aranmadı
const FZ8_MY = { age: 0, x: 0, y: 0, doruk: false };
function fz8Meydan() {
  if (fz8MeydanO === undefined) fz8MeydanO = typeof NESNELER !== 'undefined' ? NESNELER.find(o => o.tip === 'cadiMeydan') || null : null;
  const o = fz8MeydanO; let a = NaN;
  if (typeof cadiFinalAn === 'function') { try { a = +cadiFinalAn(); } catch (e) { a = NaN; } }
  if (!Number.isFinite(a) && o && Number.isFinite(o.age)) a = o.age;
  if (!Number.isFinite(a)) return null;
  FZ8_MY.age = a; FZ8_MY.x = o && Number.isFinite(o.x) ? o.x : P.x; FZ8_MY.y = o && Number.isFinite(o.y) ? o.y : P.y;
  FZ8_MY.doruk = o && o.doruk != null ? !!o.doruk : (a >= 27.6 && a < 33.5) || (P.a_t - FZ8D.dorukT < 5.5);
  return FZ8_MY;
}
const FZ_FIN_SEQ8 = [0, 4, 0, 1, 4, 3];   // dans · kostüm gösterisi · dans · Pırıl'a el sallama · kostüm gösterisi · kollar havada
const FZ8_TADA = [[-6.6, 1.6, 1], [6.6, 1.6, 1]];
// yön: kostüm sevincinde iki hızlı dönüş, kapı sahnesinde kapıya dönük (0: karışma)
function fz8Yon(still) {
  const D8 = FZ8D;
  if (D8.donT < 0.62) return D8.donT < 0.31 ? -D8.donS : D8.donS;
  if (still && P.a_t - D8.kapiBasT < 7.5 && Number.isFinite(D8.kapiX) && Math.abs(D8.kapiX - P.x) > 6) return Math.sign(D8.kapiX - P.x);
  return 0;
}
// çizimden sonra (drawFeza): ışıklar ana tuvale, sepet ağzının ve asa ucunun dünya konumu
function fz8Sonra(gx0, gy0, bx, by, SZ, OY, a) {
  fz8IsikCiz(g, gx0, gy0, a);
  if (fz8NkS) { P.a_sepetX = bx - SZ / 2 + FZ8_NK[0] / S; P.a_sepetY = by - OY + FZ8_NK[1] / S; FZ8D.sepT = now; }
  if (fz8NkA) { FZ8D.asaWX = bx - SZ / 2 + FZ8_NK[2] / S; FZ8D.asaWY = by - OY + FZ8_NK[3] / S; FZ8D.asaT = now; }
}
function fezaSepetKonum() {   // sepet ağzının dünya konumu (şekerler buraya uçar); bu karede çizilmediyse tahmin
  if (Number.isFinite(P.a_sepetX) && Number.isFinite(P.a_sepetY) && typeof now !== 'undefined' && now - (FZ8D.sepT || -9) < 0.3) return { x: P.a_sepetX, y: P.a_sepetY };
  return { x: P.x + (P.f || 1) * 14, y: P.y - 34 };
}
function fezaSepetYer() { return fezaSepetKonum(); }
// sepeti ayrı çiz: (x, y) = sepetin tabanının ortası, s = 1 oyundaki boy, dolu 0..1 (verilmezse V8.seker'den)
function fezaSepetCiz(c, x, y, s, dolu) {
  const eM = fz8M, n0 = fz8IsikN, nk = fz8NkS; fz8M = FZ8_C; const g0 = FZ8_C.giy; FZ8_C.giy = 1;
  const sc = (Number.isFinite(+s) ? +s : 1) * FZ_SC;
  c.save(); c.translate(x, y); c.scale(sc, sc); c.translate(0, -12.65);
  try { fz8SepetCiz(c, dolu == null ? fz8Dolu() : clamp(+dolu || 0, 0, 1), typeof now !== 'undefined' ? now : 0, false); }
  finally { c.restore(); fz8M = eM; FZ8_C.giy = g0; fz8IsikN = n0; fz8NkS = nk; }
}
// kostüm simgesi (kostum.js baloncukları, sonuç kartı): (x, y) merkez, s ≈ simgenin yarıçapı (piksel/birim)
const FZ8_IKR = { breath: 0 };
function fezaKostumIkon(c, ad, x, y, s, tm) {
  if (!FZ8_KOS[ad]) return;
  const eK = fzKos, eM = fz8M, eQ = fzQ, n0 = fz8IsikN, na = fz8NkA, ns = fz8NkS, M = FZ8_C;
  fzKos = ad; fz8M = M; fzQ = fzCS; fzCS.a_yaw = 0; tm = tm || 0;
  M.giy = 1; M.tm = tm; M.pf = 0.2; M.pa = 0; M.su = 0.12 * Math.sin(tm * 2.2); M.kb = 0.18 * Math.sin(tm * 2.9); M.se = 0; M.dw = 0; M.j = 0; M.parla = 0.95; M.kn = 0.3; M.ruz = 0; M.don = 0;
  c.save(); c.translate(x, y); c.scale(s / 14, s / 14);
  try {
    if (ad === 'cadi') {   // eğri uçlu yıldızlı şapka + parlayan asa
      c.save(); c.translate(-0.4, 12.6); c.scale(0.86, 0.86); fz8Sapka(c, true, tm); c.restore();
      c.save(); c.translate(7.2, 8.6); fz8Asa(c, 0, 0, -0.42, -0.9, tm, false); c.restore();
    } else if (ad === 'kabak') {   // gülen kabak tulum + sap-yaprak başlık
      c.save(); c.translate(0, 9.6); c.scale(1.18, 1.18); fz8KabakGovde(c, FZ8_IKR, tm, true); c.restore();
      c.save(); c.translate(0, 14.4); c.scale(1.0, 1.0); fz8SapBasi(c, true, tm); c.restore();
    } else if (ad === 'iskelet') {   // minik iskelet: lacivert tulumda parlayan kaburgalar, üstünde gülen yuvarlak kafa
      c.save(); c.translate(0, 13.5); c.scale(1.05, 1.05);
      c.fillStyle = FZ8.lac; c.beginPath(); c.moveTo(-6.2, 0.6); c.quadraticCurveTo(-7.0, -7, -4.2, -11.2); c.quadraticCurveTo(0, -12.8, 4.2, -11.2); c.quadraticCurveTo(7.0, -7, 6.2, 0.6); c.quadraticCurveTo(0, 2.4, -6.2, 0.6); c.fill();
      c.save(); c.translate(0, 1.2); fz8GovdeDesen(c, true); c.restore();
      c.restore();
      fz8Kafatasi(c, 0, -6.6, 1.75, M.kb);
    } else {   // sevimli yarasa: açık taraklı kanatlar, iri yuvarlak kulaklar, gülen yüz
      M.kn = 0.8;
      c.save(); c.translate(0, 1.5);
      fz8Zar(c, -2.0, -4.5, -7.8, -7.8, -13.8, -4.6, -1.4, 7.5, false); fz8Zar(c, 2.0, -4.5, 7.8, -7.8, 13.8, -4.6, 1.4, 7.5, false);
      fz8Kulak(c, -4.0, -7.0, -0.45 - M.kb * 0.3, -1, false); fz8Kulak(c, 4.0, -7.0, 0.45 + M.kb * 0.3, 1, false);
      c.fillStyle = FZ8.tul; c.beginPath(); fzEl(c, 0, 0, 6.2, 6.6); c.fill(); c.strokeStyle = FZ8.lilaC; c.lineWidth = 0.45; c.stroke();
      c.fillStyle = FZ8.tulA; c.beginPath(); fzEl(c, 0, 2.6, 3.6, 3.4); c.fill();
      c.strokeStyle = '#2a1a48'; c.lineWidth = 0.7; c.lineCap = 'round'; c.beginPath();
      c.moveTo(-3.2, -1.4); c.quadraticCurveTo(-2.2, -2.8, -1.2, -1.4); c.moveTo(1.2, -1.4); c.quadraticCurveTo(2.2, -2.8, 3.2, -1.4);
      c.moveTo(-1.3, 0.6); c.quadraticCurveTo(0, 1.8, 1.3, 0.6); c.stroke();
      c.fillStyle = 'rgba(255,140,190,0.55)'; c.beginPath(); fzEl(c, -3.9, 0.4, 1.0, 0.6); fzEl(c, 3.9, 0.4, 1.0, 0.6); c.fill();
      c.restore();
    }
  } finally { c.restore(); fzKos = eK; fz8M = eM; fzQ = eQ; fz8IsikN = n0; fz8NkA = na; fz8NkS = ns; }
}
const FZ8_POZLAR = { uyku: 1, uykuya_dalis: 1, bakis: 1, uyanis: 1, sarilma: 1, yatagaGir: 1, binis: 1, kayma: 1, yuzme: 1, denizBinek: 1, sevinc: 1, ayakta: 1, ayakta_yan: 1, supurge: 1, dans8: 1, ucus11: 1, dans11: 1 };
function fezaPozVar(ad) { return !!FZ8_POZLAR[ad]; }
// ara sahne pozunun kostümü: opt.kostum > (Bölüm 8, DURUM 'oyun', yatak pozu değil) V8.kostum
function fz8PozKos(poz, opt) {
  if (opt && typeof opt === 'object' && opt.pelerin !== undefined) return opt.pelerin ? fz11Kos(opt.pelerin) : null;   // Bölüm 11: opt.pelerin 'mor'… (null: pelerinsiz)
  if (opt && typeof opt === 'object' && opt.kostum !== undefined) return FZ8_KOS[opt.kostum] || FZ11_KOS[opt.kostum] ? opt.kostum : null;
  if (poz === 'uyku' || poz === 'uykuya_dalis' || poz === 'bakis' || poz === 'uyanis' || poz === 'sarilma' || poz === 'yatagaGir') return null;
  if (typeof DURUM !== 'undefined' && DURUM !== 'oyun') return null;
  return fz8V8Kos();
}
function fz8CDoldur(poz, tm, o, olcek) {   // ara sahnede kostümün ikincil hareketi tm'den (rüzgârlı pozlarda savrulur)
  const M = FZ8_C, oo = o && typeof o === 'object' ? o : FZ_BOS;
  const rz = poz === 'supurge' || poz === 'binis' || poz === 'kayma' ? (oo.ruzgar != null ? clamp(+oo.ruzgar, 0, 1) : oo.hiz != null ? clamp(+oo.hiz, 0, 1) : poz === 'supurge' ? 0.7 : 1) : 0;
  const vy = +oo.vy || 0, sg = olcek < 0 ? -1 : 1;
  M.tm = tm; M.ruz = rz; M.giy = oo.giy != null ? clamp(+oo.giy, 0, 1) : 1;
  M.pa = 0.12 + 0.05 * Math.sin(tm * 1.7) + rz * (1.25 + 0.1 * Math.sin(tm * 9.1) + clamp(vy / 600, -0.3, 0.4));
  M.pf = clamp(0.15 + rz, 0, 1);
  M.su = 0.08 * Math.sin(tm * 2.3) + rz * (0.55 + 0.12 * Math.sin(tm * 10.3));
  M.kb = 0.14 * Math.sin(tm * 3.1) - rz * (0.45 + 0.15 * Math.sin(tm * 11.7));
  M.se = (0.08 * Math.sin(tm * 2.1) - rz * 0.45) * sg;
  M.dw = 0; M.j = 0.025 * Math.sin(tm * 4.1); M.parla = 0.85 + 0.15 * Math.sin(tm * 2.3); M.kn = rz * 0.5; M.don = 0;
  M.dolu = oo.dolu != null ? clamp(+oo.dolu || 0, 0, 1) : fz8Dolu();
  M.sapX = M.sapY = NaN;
  if (poz === 'sevinc') { const ph = (tm % 0.72) / 0.72, c = Math.cos(ph * 6.2832); M.su = 0.35 * c; M.kb = 0.3 * Math.sin(ph * 6.2832); M.pa = 0.1 + 0.3 * Math.max(0, -c); M.pf = 0.5; M.kn = 0.6; M.j = -0.05 * c; }
  else if (poz === 'ucus11' || poz === 'dans11') fz11CDoldur(poz, tm, oo, M);
  else if (poz === 'dans8') { const ph = (tm % 0.5) / 0.5, c = Math.cos(ph * 6.2832); M.su = 0.3 * c; M.kb = 0.35 * Math.sin(tm * 9); M.pa = 0.15 + 0.3 * Math.max(0, -c); M.pf = 0.6; M.kn = 0.5; M.j = -0.06 * c; M.parla = 1; }
}
// dönüş noktasını (aygıt pikseli → ctx birimi) çevir
function fz8CtxNokta(m0, px, py) { const det = m0.a * m0.d - m0.b * m0.c || 1, dx = px - m0.e, dy = py - m0.f; return { x: (m0.d * dx - m0.c * dy) / det, y: (-m0.b * dx + m0.a * dy) / det }; }
// Bölüm 8 ay ışığı: bal rengi ay kenarı, alttan mor-pembe sis yansıması
const FZ_AMB8 = [[255, 228, 172], [196, 126, 222]];
if (typeof OLAY !== 'undefined') {
  const b8 = () => BOLUM_NO === 8 && !!P.a_pose;
  OLAY.on('kostumSec', () => { if (!b8()) return; FZ8D.donT = 0; FZ8D.donS = P.a_side || P.f || 1; P.a_sit = 0; P.a_act = ''; P.a_cheerT = 9; P.a_tadaT = 9; });
  OLAY.on('sekerKapiBasla', e => {
    if (!b8()) return;
    FZ8D.kapiBasT = P.a_t; FZ8D.kapiX = e && Number.isFinite(e.kapiX) ? e.kapiX : e && e.o && Number.isFinite(e.o.x) ? e.o.x : P.x + (P.f || 1) * 46;
    P.a_sit = 0; P.a_act = '';
  });
  OLAY.on('sekerKapiTak', () => { if (b8()) fz8Tak(); });
  OLAY.on('komsuSoz', e => { if (b8() && !(e && e.an === 'veda')) FZ8D.dinT = 2.8; });
  OLAY.on('sekerSaka', () => { if (b8()) fz8Saskin(5, 1.7); });
  OLAY.on('seker', () => { if (b8()) FZ8D.hopT = 0; });
  OLAY.on('sekerKapi', () => { if (b8()) { FZ8D.kapiBasT = -99; FZ8D.dinT = 0; } });
  OLAY.on('kabakFener', e => { if (!b8()) return; const o = e && (e.o || e); if (P.a_t - FZ8D.kapiBasT > 7.5) fz8Sevin(o); });
  OLAY.on('hayaletBuldu', e => { if (!b8()) return; const o = e && (e.o || e); if (!o || !Number.isFinite(o.x) || Math.abs(o.x - P.x) < 320) fz8Saskin(5, 1.5); });
  for (const ev of ['kabakYuzBitti', 'iskeletBitti', 'kazanBitti']) OLAY.on(ev, e => { if (b8()) fz8Sevin(e && (e.o || e)); });
  OLAY.on('supurgeBitti', () => { if (b8()) { P.a_fromL = true; P.a_sit = 0; P.a_act = ''; } });
  OLAY.on('cadiDoruk', () => { if (b8()) FZ8D.dorukT = P.a_t; });
  OLAY.on('ciftZiplama', () => { if (b8()) FZ8D.flapT = 0; });   // yarasa kanat çırpar
}

// ════════════════════════ Bölüm 9 (Pırıl'ın Ejderha Vadisi): oyun içi pozlar ════════════════════════
// fezaPoz9(poz, sure, opt): Feza'yı fizik yerinde (P.x, P.y) 'sarilYumurta' | 'meyveUzat' | 'kucak9' | 'dans9' | 'sevinc' pozunda
// oyundaki ışık/konturla `sure` sn çizer (drawFeza p9 dalı). opt: { yon ±1, ox (çizim kayması, birim), kilit (P.kilit = sure),
// ...poz seçenekleri (d, r, h, boy, nabiz, hedefY ...) }. İlerlemeli pozlarda (sarilYumurta, meyveUzat, kucak9) opt.u = geçen/sure.
// fezaPoz9(null) erken bitirir. OLAY 'fezaPoz9' {poz, sure, yon, ox, opt} aynısı. Yalnız Bölüm 9'da; P.ucus doluyken hiçbir şey yapmaz.
// OLAY 'yumurtaIsit' {o|x,y, sure (2.5), r, h} (yavru.js): Feza yumurtaya döner, yanına (çizimde) sokulur ve sarılır; bitince
// kayma gerçek konuma işlenir (zemin varsa), yavru çıkınca ('yavruCikti') uzanıp sevinir.
const FZ9_POZ = { sarilYumurta: 1, meyveUzat: 1, binis9: 1, dans9: 1, kucak9: 1 };
const FZ9_ILER = { sarilYumurta: 1, meyveUzat: 1, kucak9: 1 };
const FZ9 = { poz: null, t: 0, sure: 0, yon: 1, ox: 0, ox0: 0, oxH: 0, o: {}, src: null, ilerle: false, yum: false, isle: false, yak: null };
function fz9OptDoldur() {   // kare başına yeni nesne yok: kaynak seçenekler tek bir nesneye kopyalanır
  const o = FZ9.o, s0 = FZ9.src;
  for (const k in o) delete o[k];
  if (s0 && typeof s0 === 'object') for (const k in s0) o[k] = s0[k];
  o.isik = 0;   // oyunda drawFeza kendi ışığını verir
  if (FZ9.ilerle && o.u == null) o.u = FZ9.poz === 'kucak9' ? clamp(FZ9.t / 1.2, 0, 1) : FZ9.sure > 0 ? clamp(FZ9.t / FZ9.sure, 0, 1) : 1;   // kucak: 1,2 sn'de sarılır, sonra sarılı kalır
}
function fezaPoz9(poz, sure, opt) {
  if (typeof BOLUM_NO === 'undefined' || BOLUM_NO !== 9) return false;
  if (!poz) { FZ9.yak = null; fz9Bitir(); return true; }
  if (!FZ9_POZ[poz] && poz !== 'sevinc' && poz !== 'ayakta' && poz !== 'ayakta_yan') return false;
  if (P.ucus || !P.a_pose) return false;
  const o = opt && typeof opt === 'object' ? opt : FZ_BOS, su = isFinite(sure) && sure > 0 ? Math.min(+sure, 40) : 2.5;
  FZ9.poz = poz; FZ9.t = 0; FZ9.sure = su; FZ9.src = o; FZ9.ilerle = !!FZ9_ILER[poz] && o.u == null;
  FZ9.yon = o.yon < 0 ? -1 : o.yon > 0 ? 1 : (P.f || 1); P.f = FZ9.yon;
  FZ9.ox0 = 0; FZ9.oxH = isFinite(o.ox) ? clamp(+o.ox, -70, 70) : 0; FZ9.ox = 0; FZ9.isle = !!o.isle; FZ9.yum = false;
  if (o.kilit) P.kilit = Math.max(P.kilit || 0, su);
  P.a_sit = 0; P.a_act = '';
  return true;
}
function fz9Bitir() {
  if (!FZ9.poz) return;
  if (FZ9.isle && Math.abs(FZ9.ox) > 0.5 && typeof cell === 'function') {   // çizim kaymasını gerçek konuma işle (aynı zemin varsa)
    const nx2 = P.x + FZ9.ox, c = Math.floor(nx2 / T), r = Math.floor((P.y + 2) / T), v = cell(c, r);
    if ((v === 1 || v === 2) && cell(c, r - 1) === 0 && cell(c, r - 2) === 0) { P.x = nx2; if (P.rx !== undefined) P.rx = P.x; P.safeX = P.x; }
  }
  FZ9.poz = null; FZ9.ox = 0; FZ9.src = null; FZ9.yum = false;
}
// poz geçişi (yalnız Bölüm 9): FZ9.poz değiştiği karede bir önceki karenin bitmiş görüntüsü (ışık dahil) saklanır, FZ9G_SURE boyunca söner
const FZ9G = { on: undefined, t: -9, bx: 0, by: 0, sz: 0, oy: 0, S: 1, px: 0, py: 0, lpx: 0, lpy: 0, lbx: 0, lby: 0, lsz: 0, loy: 0, lS: 1, lt: -9, la: 0 }, FZ9G_SURE = 0.2;
let fz9SnC = null;
function fz9Gecis(p9, tm) {
  const cur = p9 || '';
  if (FZ9G.on !== undefined && cur !== FZ9G.on && tm - FZ9G.lt < 0.12 && FZ9G.la > 0.95 && !(P.fade > 0) && fzC.width > 0) {
    if (!fz9SnC) fz9SnC = document.createElement('canvas');
    if (fz9SnC.width !== fzC.width || fz9SnC.height !== fzC.height) { fz9SnC.width = fzC.width; fz9SnC.height = fzC.height; }
    const sx = fz9SnC.getContext('2d'); sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalAlpha = 1; sx.globalCompositeOperation = 'source-over';
    sx.clearRect(0, 0, fz9SnC.width, fz9SnC.height); sx.drawImage(fzC, 0, 0);
    FZ9G.t = tm; FZ9G.bx = FZ9G.lbx; FZ9G.by = FZ9G.lby; FZ9G.sz = FZ9G.lsz; FZ9G.oy = FZ9G.loy; FZ9G.S = FZ9G.lS; FZ9G.px = FZ9G.lpx; FZ9G.py = FZ9G.lpy;   // eski kare Feza'yla birlikte gider (geçişte yürüse de çift görüntü kalmasın)
  }
  FZ9G.on = cur;
}
function fz9GecisK(tm) { const u = (tm - FZ9G.t) / FZ9G_SURE; return fz9SnC && u >= 0 && u < 1 ? smooth(u) : 1; }
// Bölüm 7 kızak (kizak.js havadayken 'kayma', yerde 'binis' çizer): poz değişince eski poz w ile söner (tm = çağıranın saati)
const FZ7K = { p: null, w: 0, t: -1 }, FZ7_KAR = ['lt1', 'lt2', 'bt1', 'bt2', 'lean', 'hx', 'la1', 'la2', 'ba1', 'ba2', 'arm', 'shr', 'head', 'hOpen', 'breath'], FZ7_TMP = new Float64Array(15);
function fz7Karisim(poz, tm) {
  const dt = tm - FZ7K.t;
  if (FZ7K.p === null || !(dt >= 0) || dt > 0.5) { FZ7K.p = poz; FZ7K.w = 0; FZ7K.t = tm; return 0; }
  if (poz !== FZ7K.p) { FZ7K.p = poz; FZ7K.w = 1 - FZ7K.w; }
  FZ7K.w = Math.max(0, FZ7K.w - dt / 0.22); FZ7K.t = tm;
  return smooth(FZ7K.w);
}
function fz9Aktif() { return BOLUM_NO === 9 && (!!FZ9.poz || !!FZ9.yak); }
function fz9Yaklas(dt) {   // yumurtanın yanına koşma (P.kilit sürerken hızı biz veririz; çarpışmayı fizik yapar)
  const q = FZ9.yak; q.t += dt;
  if (P.ucus || P.fade > 0 || (typeof DURUM !== 'undefined' && DURUM !== 'oyun')) { FZ9.yak = null; return; }
  const dx = q.tx - P.x, sg = Math.sign(dx);
  if (Math.abs(dx) > 10 && q.t < 1.1 && P.ground) { P.vx = sg * Math.min(230, 40 + Math.abs(dx) * 5); P.f = sg; P.idle = 0; return; }
  FZ9.yak = null; P.vx = 0;
  const kal = Math.max(1.6, q.sure - q.t);
  if (!P.ground || Math.abs(q.tx - P.x) > 50) {   // yetişemedi (basamak/duvar): sarılma yok, yumurtaya uzanıp sevinir (Pırıl yine ısıtır)
    P.kilit = Math.min(P.kilit || 0, 0.1); if (typeof fz8Sevin === 'function') fz8Sevin({ x: q.tx + q.yon * q.d, y: P.y }); return;
  }
  fezaPoz9('sarilYumurta', kal, { yon: q.yon, ox: clamp(q.tx - P.x, -40, 40), d: q.d, r: q.r, h: q.h, isle: true });
  FZ9.yum = true; P.kilit = Math.max(P.kilit || 0, kal);
}
function fz9Adim(dt) {
  if (FZ9.yak && !FZ9.poz) { fz9Yaklas(dt); return; }
  if (!FZ9.poz) return;
  if (P.ucus || P.fade > 0 || (typeof DURUM !== 'undefined' && DURUM !== 'oyun' && DURUM !== 'final')) { FZ9.ox = 0; FZ9.isle = false; fz9Bitir(); return; }
  FZ9.t += dt; P.f = FZ9.yon; P.idle = 0;
  const T0 = Math.min(0.35, FZ9.sure * 0.2), u = FZ9.t;
  FZ9.ox = FZ9.oxH * (FZ9.isle ? smooth(clamp(u / T0, 0, 1)) : smooth(clamp(u / T0, 0, 1)) * (1 - smooth(clamp((u - (FZ9.sure - T0)) / T0, 0, 1))));
  if (FZ9.yum && Math.random() < dt * 2.2 && typeof burst === 'function' && FZ9.t > FZ9.sure * 0.2 && FZ9.t < FZ9.sure * 0.85) {   // sarılırken minik kalp/ışıltı
    burst(P.x + FZ9.ox + FZ9.yon * 10, P.y - 46, 1, ['#ffb3cf', '#ffd27a', '#fff2f8'], 26, 0.9, 5);
  }
  if (FZ9.t >= FZ9.sure) fz9Bitir();
}
if (typeof OLAY !== 'undefined') {
  OLAY.on('fezaPoz9', e => { if (BOLUM_NO !== 9 || !e) return; const o = Object.assign({}, e.opt || {}); if (e.yon != null) o.yon = e.yon; if (e.ox != null) o.ox = e.ox; fezaPoz9(e.poz, e.sure, o); });
  OLAY.on('yumurtaIsit', e => {   // yumurta (yavru.js): yanına sokul, sarıl
    if (BOLUM_NO !== 9 || !e || P.ucus || !P.a_pose || FZ9.yak || FZ9.poz === 'sarilYumurta') return;   // zaten sarılıyor
    const ob = e.o && typeof e.o === 'object' ? e.o : null, ex = isFinite(e.x) ? +e.x : ob && isFinite(ob.x) ? ob.x : NaN;
    if (!isFinite(ex) || Math.abs(ex - P.x) > 220 || !P.ground) return;   // havadaysa sarılma pozu yok (Pırıl yine üfler)
    const yon = Math.sign(ex - P.x) || P.f || 1, r = isFinite(e.r) ? +e.r : 16, h = isFinite(e.h) ? +e.h : 40, d = r + 5;
    const su = isFinite(e.sure) && e.sure > 0 ? +e.sure : 2.5, tx = ex - yon * d;
    if (Math.abs(tx - P.x) > 44) {   // uzaktaysa önce koşarak yanına gelir (fizikle), sonra sarılır (kalan sürede)
      FZ9.yak = { tx, t: 0, sure: su, yon, d, r, h }; P.kilit = Math.max(P.kilit || 0, Math.min(su, 1.2)); return;
    }
    fezaPoz9('sarilYumurta', su, { yon, ox: tx - P.x, d, r, h, isle: true });
    FZ9.yum = true; P.kilit = Math.max(P.kilit || 0, su); P.vx = 0;
  });
  // pul çiçeği açılınca / yavru çıkınca: uzanıp kollar havada sevinç (Bölüm 1'in çiçek tepkisi)
  const fz9Sev = e => { if (BOLUM_NO !== 9 || !P.a_pose || FZ9.poz) return; const o = e && e.o ? e.o : e; fz8Sevin(o); };
  OLAY.on('pulCicek', fz9Sev); OLAY.on('yavruCikti', fz9Sev);
}

// Bölüm 9 şöleni (V9.final, oyun sürerken): Bölüm 6–8 ile aynı dans düzeni (120 BPM, ölçü 2 sn). Saat: yuva.js ejderFinalAn() (sn) >
// ejderYuva nesnesinin o.age > 'ejderFinal' olayından beri geçen süre; doruk: o.doruk > 'ejderDoruk' olayı > 27,6–33,5 sn.
function fzEjder9() { return BOLUM_NO === 9 && typeof V9 !== 'undefined' && !!V9 && !!V9.final && typeof DURUM !== 'undefined' && DURUM === 'oyun'; }
let fz9YuvaO;   // undefined: aranmadı
const FZ9_YV = { age: 0, x: 0, y: 0, doruk: false }, FZ9_FN = { t0: -1, dorukT: -99 };
function fz9Yuva() {
  if (fz9YuvaO === undefined) fz9YuvaO = typeof NESNELER !== 'undefined' ? NESNELER.find(o => o.tip === 'ejderYuva') || null : null;
  const o = fz9YuvaO; let a = NaN;
  if (typeof ejderFinalAn === 'function') { try { a = +ejderFinalAn(); } catch (e) { a = NaN; } }
  if (!Number.isFinite(a) && o && Number.isFinite(o.age)) a = o.age;
  if (!Number.isFinite(a) && FZ9_FN.t0 >= 0) a = P.a_t - FZ9_FN.t0;
  if (!Number.isFinite(a)) return null;
  FZ9_YV.age = a; FZ9_YV.x = o && Number.isFinite(o.x) ? o.x : P.x; FZ9_YV.y = o && Number.isFinite(o.y) ? o.y : P.y;
  FZ9_YV.doruk = o && o.doruk != null ? !!o.doruk : (a >= 27.6 && a < 33.5) || (P.a_t - FZ9_FN.dorukT < 5.5);
  return FZ9_YV;
}
if (typeof OLAY !== 'undefined') {
  OLAY.on('ejderFinal', () => { if (BOLUM_NO === 9 && P.a_pose) FZ9_FN.t0 = P.a_t; });
  OLAY.on('ejderDoruk', () => { if (BOLUM_NO === 9 && P.a_pose) FZ9_FN.dorukT = P.a_t; });
}

// ════════════════════════ Bölüm 11 (Ay Işığı Şatosu): sihirli pelerin ════════════════════════
// V11.pelerin: 'mor' | 'lacivert' | 'kirmizi' | 'pembe'. Bölüm 8 kostüm altyapısıyla çizilir: fzKos = 'p11' + ad (fz8V8Kos), aynı ikincil
// hareket (fz8Adim: pa savrulma, pf dalgalanma, kn kanat açıklığı, giy büyüyerek belirme) ve aynı kancalar; Bölüm 1–10'da hiç çalışmaz.
// Feza pijamasıyla kalır; üstünde:
//   PELERİN: dışı renkli ve işlemeli (mor: altın yıldızlar · lacivert: gümüş aylar · kırmızı: minik kalpler · pembe: gümüş yıldız tozu),
//     astarı çilek kırmızısı (kırmızı ve pembede pembe); etek yumuşak taraklı (yarasa kanadı gibi). Yürürken dalgalanır, koşunca
//     savrulur; zıplayınca, dönerken ve kollar kalkınca kollara bağlı KANAT gibi açılır (yandan: yakın kanadın dış yüzü, uzak kanadın
//     astarı; önden: astar görünür, bileklerden eteğe taraklı). Dik vampir yakası (içi astar), boyunda toka (yıldız / ay / kalp / yıldız).
//   TAÇ: başta yarasa kanatlı minik taç (ortada tokanın süsü; kanatçıklar pırpır eder).
//   DİŞÇİK: gülerken iki minik, yuvarlak uçlu oyuncak dişçik (ağız açıkken üst dişlerin altında; kapalıyken iki minik beyaz nokta).
// Dışa açık: fezaPelerinCiz(c, x, y, s, acik, renk) · fezaPelerinIkon(c, ad, x, y, s, tm) · fezaCizPoz 'ucus11' (pelerin açık süzülme)
// ve 'dans11' (vals). Oyun içi: Ay Balosu sürerken (V11.final, yerde, dururken) Feza 'dans11' valsini baloFinalAn() saatiyle yapar.
// Olaylar: 'pelerinSec' (döne döne sevinç, pelerin açılıp kapanır), 'aynaDondu' / mini oyun bitişleri (uzanıp sevinme),
// 'ciftZiplama' (çift zıplamada takla yerine pelerin kanat çırpar), 'pelerinUcusBitti' (inişte ta-da).
const FZ11_PAL = {   // d dış, dA dış açık, dK dış koyu, dC kontur, a astar, aK astar koyu, m motif, mK motif kenarı, t taç bandı, tC taç kenarı, kn taç kanadı
  mor:      { d: '#7c53d8', dA: '#a988f2', dK: '#58349f', dC: '#2f1b66', a: '#ff4f7a', aK: '#c9345f', m: '#ffd76a', mK: '#c88a22', t: '#ffd76a', tC: '#a8721c', kn: '#6a44c4', tur: 0, mr: 1.0 },
  lacivert: { d: '#3a4ba8', dA: '#6a80dc', dK: '#26327c', dC: '#141b4a', a: '#ff5a85', aK: '#c63a64', m: '#e4eeff', mK: '#8496c8', t: '#e8efff', tC: '#7884b4', kn: '#3a4ba8', tur: 1, mr: 1.15 },
  kirmizi:  { d: '#ff4f7a', dA: '#ff8aa8', dK: '#d2335e', dC: '#8a1c45', a: '#ff7fb6', aK: '#d84d8a', m: '#fff0f6', mK: '#e0709a', t: '#ffd76a', tC: '#a8721c', kn: '#ff4f7a', tur: 2, mr: 0.95 },
  pembe:    { d: '#d2a0f6', dA: '#ecd6ff', dK: '#ab7ade', dC: '#664796', a: '#ff8fbc', aK: '#df6e9d', m: '#ffffff', mK: '#aab8e0', t: '#eef3ff', tC: '#8d97c2', kn: '#b98ae6', tur: 3, mr: 1.0 }
};
for (const k in FZ11_PAL) { const c = FZ11_PAL[k]; c.gol = 'rgba(30,14,70,0.28)'; c.kat = 'rgba(30,12,80,0.32)'; c.aKat = 'rgba(140,20,70,0.3)'; }
const FZ11_KOS = { p11mor: FZ11_PAL.mor, p11lacivert: FZ11_PAL.lacivert, p11kirmizi: FZ11_PAL.kirmizi, p11pembe: FZ11_PAL.pembe };
const FZ11_ADLAR = ['mor', 'lacivert', 'kirmizi', 'pembe'], FZ11_2PI = Math.PI * 2;
// ── hacim (kalite): kumaş kıvrımı dokuları, silindir gölgesi ve yumuşak lekeler YALNIZ ilk kullanımda bir kez pişirilir (gradyan
//    yalnız burada); karede yalnız drawImage + kırpma. Doku 128×128 px = yerel (u −16..16, v 0..32), tepeden yelpaze gibi açılan kıvrımlar.
const FZ11_DK = {};
let fz11BlobC = null, fz11SilC = null;
function fz11Rgb(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function fz11Doku(C, astar) {
  const k = (astar ? 'a' : 'd') + C.d + C.a; let c = FZ11_DK[k]; if (c) return c;
  c = FZ11_DK[k] = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), koyu = astar ? C.aK : C.dK, acik = astar ? '#ffe2ec' : C.dA, KV = [-0.44, -0.3, -0.17, -0.05, 0.08, 0.2, 0.33, 0.45], KW = [16, 12, 18, 13, 17, 12, 16, 14];
  for (let i = 0; i < KV.length; i++) {   // her kıvrım: önce gölge, sonra parlak sırt (kesit boyunca gradyan)
    x.save(); x.translate(64 + (i % 2 ? 3 : -2), -46); x.rotate(KV[i]);
    const w = KW[i], g = x.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, fz11Rgb(koyu, 0)); g.addColorStop(0.32, fz11Rgb(koyu, astar ? 0.5 : 0.62)); g.addColorStop(0.55, fz11Rgb(koyu, 0.05));
    g.addColorStop(0.72, fz11Rgb(acik, astar ? 0.42 : 0.5)); g.addColorStop(1, fz11Rgb(acik, 0));
    x.fillStyle = g; x.fillRect(-w / 2, 30, w, 230); x.restore();
  }
  x.globalCompositeOperation = 'destination-in';   // kıvrımlar boyunda incelir, etekte belirginleşir
  let g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(0.45, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,1)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.globalCompositeOperation = 'source-over';   // yakanın altında yumuşak gölge, etek ucunda hafif koyulaşma
  g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, fz11Rgb(koyu, 0.55)); g.addColorStop(0.16, fz11Rgb(koyu, 0)); g.addColorStop(0.86, fz11Rgb(koyu, 0)); g.addColorStop(1, fz11Rgb(koyu, 0.3));
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return c;
}
function fz11Sil() {   // yandan silindir gölgesi (sol: arka, gölgede · sağ: aya bakan ön kenar)
  if (fz11SilC) return fz11SilC;
  const c = fz11SilC = document.createElement('canvas'); c.width = 128; c.height = 8;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 128, 0);
  g.addColorStop(0, 'rgba(16,6,46,0.55)'); g.addColorStop(0.3, 'rgba(16,6,46,0.22)'); g.addColorStop(0.55, 'rgba(16,6,46,0)');
  g.addColorStop(0.74, 'rgba(255,255,255,0.2)'); g.addColorStop(0.87, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(16,6,46,0.2)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 8); return c;
}
function fz11Leke(i) {   // 0 koyu gölge lekesi · 1 beyaz ışık lekesi · 2 gümüş-mavi ay ışığı lekesi
  if (!fz11BlobC) {
    fz11BlobC = [];
    for (const r of ['22,10,52', '255,255,255', '200,225,255']) {
      const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, `rgba(${r},1)`); g.addColorStop(0.4, `rgba(${r},0.6)`); g.addColorStop(0.75, `rgba(${r},0.16)`); g.addColorStop(1, `rgba(${r},0)`);
      x.fillStyle = g; x.fillRect(0, 0, 64, 64); fz11BlobC.push(c);
    }
  }
  return fz11BlobC[i];
}
const FZ11_LV = [0, 1];
// ay ışığı kenarı (kırpma içinde): şekilden, aydan uzağa kaydırılmış kendisi çıkınca aya bakan ince kenar kalır (ekranda sağ üst)
function fz11Rim(x, yol, a, d, col) {
  const L = fz8EkranYon(x, 2.34, FZ11_LV);
  x.save(); x.translate(-L[0] * d, -L[1] * d); yol(); x.restore(); x.rect(-90, -90, 180, 180);
  x.globalAlpha = a; x.fillStyle = col; x.fill('evenodd'); x.globalAlpha = 1;
  x.beginPath();   // yardımcı dikdörtgen geçerli yolda kalmasın (sonraki bir stroke() onu çizmesin)
}
function fz11P() { return fzKos ? FZ11_KOS[fzKos] || null : null; }
function fz11Kos(ad) { return FZ11_KOS['p11' + ad] ? 'p11' + ad : null; }
function fz11Acik() { const k = fz8M.kn; return k > 0.08 ? smooth(clamp((k - 0.08) / 0.72, 0, 1)) : 0; }   // kanat açıklığı 0..1
// pelerin işlemesi: 0 yıldız, 1 hilal, 2 kalp, 3 dört köşeli parıltı (yolu kurar ve doldurur; renk önceden)
function fz11Motif(x, px, py, r, tur, rot) {
  if (tur === 0) { fz8Yildiz(x, px, py, r, rot); return; }
  x.beginPath();
  if (tur === 1) {
    const c = Math.cos(rot * 0.5 - 0.5), s = Math.sin(rot * 0.5 - 0.5), P2 = (u, v) => [px + u * c - v * s, py + u * s + v * c];
    let q = P2(0.35 * r, -r); x.moveTo(q[0], q[1]);
    let k = P2(-1.5 * r, 0); q = P2(0.35 * r, r); x.quadraticCurveTo(k[0], k[1], q[0], q[1]);
    k = P2(-0.42 * r, 0); q = P2(0.35 * r, -r); x.quadraticCurveTo(k[0], k[1], q[0], q[1]);
  } else if (tur === 2) {
    x.moveTo(px, py + 0.9 * r); x.bezierCurveTo(px - 1.35 * r, py - 0.05 * r, px - 0.65 * r, py - 1.15 * r, px, py - 0.4 * r);
    x.bezierCurveTo(px + 0.65 * r, py - 1.15 * r, px + 1.35 * r, py - 0.05 * r, px, py + 0.9 * r);
  } else {
    x.moveTo(px, py - r); x.quadraticCurveTo(px, py, px + r, py); x.quadraticCurveTo(px, py, px, py + r); x.quadraticCurveTo(px, py, px - r, py); x.quadraticCurveTo(px, py, px, py - r);
  }
  x.fill();
}
const FZ11_PY = [[-2.4, 4.8, 1.0], [-4.2, 10.4, 1.1], [-0.8, 12.8, 0.9], [-4.6, 16.4, 0.95], [0.8, 7.0, 0.8], [-2.2, 17.6, 0.85], [-6.0, 13.2, 0.75]];
const FZ11_TOZ = [[-1.6, 3.6, 0.9], [-3.8, 6.6, 0.55], [0.6, 8.4, 0.7], [-2.6, 9.8, 1.0], [-5.6, 11.0, 0.6], [-0.4, 13.0, 0.8], [-4.0, 14.6, 0.95],
  [-6.6, 16.0, 0.55], [-1.8, 16.6, 0.6], [0.9, 15.4, 0.5], [-3.2, 18.4, 0.7], [-5.2, 4.6, 0.5]];
function fz11Isleme(x, C, Lc, fl, tm) {   // yandan pelerinin işlemesi (fz8P çerçevesinde; kırpma içinde)
  if (C.tur === 3) {   // gümüş yıldız tozu: minik parıltılar + noktalar, yavaşça pırıldar
    for (let i = 0; i < FZ11_TOZ.length; i++) {
      const q = FZ11_TOZ[i], v = q[1] * Lc / 19, u = q[0] - (v / Lc) * fl * 0.4, px = u * fz8Fx + v * fz8Ax, py = u * fz8Fy + v * fz8Ay, tw = 0.75 + 0.25 * Math.sin(tm * 3.1 + i * 1.7);
      x.fillStyle = i % 3 ? '#ffffff' : '#dfe8ff'; x.globalAlpha = 0.65 + 0.35 * tw;
      if (i % 2) { x.beginPath(); x.arc(px, py, 0.32 * q[2], 0, 6.2832); x.fill(); } else fz11Motif(x, px, py, 1.05 * q[2] * tw, 3, 0);
    }
    x.globalAlpha = 1; return;
  }
  x.fillStyle = C.m;
  for (let i = 0; i < FZ11_PY.length; i++) { const q = FZ11_PY[i], v = q[1] * Lc / 19, u = q[0] - (v / Lc) * fl * 0.4; fz11Motif(x, u * fz8Fx + v * fz8Ax, u * fz8Fy + v * fz8Ay, q[2] * C.mr, C.tur, i * 0.7); }
}
// ── yandan pelerin (her şeyin arkasında): boyundan sarkar, dalgalanır, taraklı etekte kıvrılan astar görünür ──
function fz11PelerinYan(x, R, hip, by) {
  const C = fz11P(), M = fz8M, b = fz8Buyu(), pf = M.pf, ac = fz11Acik();
  x.save(); x.translate(R.hx, hip); x.rotate(R.lean); x.translate(-1.9, -13.6 + by); if (b !== 1) x.scale(b, b);
  fz8PelerinEksen(x, M.pa * (0.92 + 0.2 * ac));
  const Lc = 26.4 - 2.0 * clamp(M.pa - 0.9, 0, 1) - 2.6 * ac, fl = 1.5 + 1.7 * pf + 1.8 * ac;   // yandan da baldıra kadar uzun
  fz8PelerinYolY(x, Lc, fl, pf, true); x.fillStyle = C.d; x.fill();
  x.save(); x.clip();
  {   // hacim: kumaş kıvrımları (pişmiş doku; rüzgârda ikincil dalga — etekte daha çok salınır) + silindir gölgesi (arka gölgede, ön aya bakar)
    const tm = M.tm, sw = Math.sin(tm * 2.9) * (0.035 + 0.075 * pf) + Math.sin(tm * 4.7 + 1.0) * 0.03 * pf + 0.04 * ac, kay = Math.sin(tm * 3.7) * 0.45 * pf, w = 9 + fl * 0.9;
    x.save(); x.transform(fz8Fx, fz8Fy, fz8Ax, fz8Ay, 0, 0);
    x.save(); x.transform(1, 0, sw, 1, 0, 0); x.drawImage(fz11Doku(C, 0), -1.6 - fl * 0.55 + kay - w, -1.2, w * 2, Lc + 4.2); x.restore();
    x.drawImage(fz11Sil(), -6.8 - fl, -2, 10.6 + fl, Lc + 5);
    x.restore();
  }
  const ah = 0.9 + 1.7 * pf + 1.2 * ac;   // etekte kıvrılan astar (hareketle görünür): üstte ışık alan kıvrım, altta içe dönük koyu kısım
  const asY = (dv) => { x.beginPath(); fz8P(x, -9 - fl, Lc - ah + fz8Dalga(1) * 0.3 + dv, true); fz8Q(x, -3.2, Lc - ah - 0.7 + fz8Dalga(2) * 0.4 + dv, 2.8, Lc - ah * 0.45 - 1.0 + dv); fz8P(x, 2.8, Lc + 3); fz8P(x, -9 - fl, Lc + 3); };
  x.fillStyle = C.a; asY(0); x.fill();
  x.fillStyle = C.aK; x.globalAlpha = 0.7; asY(0.9 + 0.3 * pf); x.fill(); x.globalAlpha = 1;
  x.strokeStyle = 'rgba(255,226,236,0.75)'; x.lineWidth = 0.42; x.beginPath(); fz8P(x, -9 - fl, Lc - ah + fz8Dalga(1) * 0.3 + 0.2, true); fz8Q(x, -3.2, Lc - ah - 0.5 + fz8Dalga(2) * 0.4, 2.8, Lc - ah * 0.45 - 0.8); x.stroke();
  x.strokeStyle = C.kat; x.lineWidth = 0.45; x.lineCap = 'round'; x.beginPath();
  fz8P(x, -1.2, 2.5, true); fz8Q(x, -2.4 - 0.4 * pf, 9, -3.2 - fl * 0.4, Lc - ah - 0.6); fz8P(x, 0.8, 4.0, true); fz8Q(x, 0.1, 10, -0.6, Lc - ah - 0.9); x.stroke();
  fz11Isleme(x, C, Lc - ah * 0.6, fl, M.tm);
  fz11Rim(x, () => fz8PelerinYolY(x, Lc, fl, pf, true), 0.6, 0.85, '#dcecff');   // ay ışığından gümüş kenar
  x.restore();
  fz8PelerinYolY(x, Lc, fl, pf, true); x.strokeStyle = C.dC; x.lineWidth = 0.5; x.lineJoin = 'round'; x.stroke();
  x.restore();
}
// ── yandan kanat: kol açılınca pelerin omuz → dirsek → bilekten sırttaki etek noktasına taraklı zar gibi gerilir ──
// (yakın kanat: dış yüz + işleme; uzak kanat: astar). Kapalıyken (ac → 0) dirsek/bilek noktaları sırta katlanır.
const FZ11_KP = new Float64Array(6);
function fz11Zar(x, sx, sy, ex, ey, wx, wy, bx, by, far, ac, C) {
  const M = fz8M, b = fz8Buyu();
  if (b !== 1) { ex = lerp(sx, ex, b); ey = lerp(sy, ey, b); wx = lerp(sx, wx, b); wy = lerp(sy, wy, b); bx = lerp(sx, bx, b); by = lerp(sy, by, b); }
  const d = fz8EkranYon(x, 0, FZ8_V), rz = M.ruz, sag = 1.0 + 1.0 * ac + 1.4 * rz;
  let dx = d[0] - rz * 1.2, dy = d[1]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  const span = Math.hypot(wx - bx, wy - by) || 1; let nx = -(by - wy) / span, ny = (bx - wx) / span;
  if (nx * ((wx + bx) / 2 - sx) + ny * ((wy + by) / 2 - sy) < 0) { nx = -nx; ny = -ny; }
  const bul = span * (0.22 + 0.1 * ac) + 0.5;
  const yol = () => {
    x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.lineTo(wx, wy);
    let qx = wx, qy = wy;
    for (let i = 1; i <= 3; i++) {
      const t = i / 3, sn = Math.sin(t * Math.PI), s = sn * sag + (i < 3 ? Math.sin(M.tm * 8 + i) * 0.3 * (ac + rz) : 0), o = sn * bul * (i === 3 ? 0 : 1);
      const px = lerp(wx, bx, t) + dx * s + nx * o, py = lerp(wy, by, t) + dy * s + ny * o, mx = (qx + px) / 2, my = (qy + py) / 2;
      x.quadraticCurveTo(mx + (sx - mx) * 0.14, my + (sy - my) * 0.14, px, py);
      FZ11_KP[i * 2 - 2] = px; FZ11_KP[i * 2 - 1] = py; qx = px; qy = py;
    }
    x.closePath();
  };
  yol(); x.fillStyle = far ? C.a : C.d; x.fill();
  x.save(); x.clip();
  {   // zar hissi: ay ışığı açık kanadın içinden yumuşakça geçer (yarı saydam ışık), gövdeye yakın kök gölgede (pişmiş lekeler)
    const cx = (ex + wx + bx + FZ11_KP[2]) / 4, cy = (ey + wy + by + FZ11_KP[3]) / 4, r = span * (0.55 + 0.1 * ac) + 2;
    x.globalAlpha = far ? 0.5 : 0.42; x.drawImage(fz11Leke(0), sx - 5, sy - 3, 10, 12);
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = (far ? 0.2 : 0.26) * (0.35 + 0.65 * ac);
    x.drawImage(fz11Leke(far ? 1 : 2), cx - r, cy - r * 0.8, r * 2, r * 1.6);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  }
  if (far) { x.fillStyle = 'rgba(120,20,60,0.22)'; x.beginPath(); x.moveTo(sx, sy); x.lineTo(bx, by); x.lineTo(lerp(wx, bx, 0.5), lerp(wy, by, 0.5) + 6); x.closePath(); x.fill(); }   // gövdeye yakın astar gölgede
  else {
    x.fillStyle = 'rgba(255,255,255,0.14)'; x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.lineTo(wx, wy); x.lineTo(lerp(wx, FZ11_KP[0], 0.35), lerp(wy, FZ11_KP[1], 0.35)); x.lineTo(lerp(ex, bx, 0.3), lerp(ey, by, 0.3)); x.closePath(); x.fill();   // üst kenarda parlaklık
    if (ac > 0.35) {   // dış yüzde iki işleme
      if (C.tur === 3) x.fillStyle = '#ffffff'; else x.fillStyle = C.m;
      const r = 0.95 * C.mr * ac;
      fz11Motif(x, (ex + wx + bx) / 3, (ey + wy + by) / 3 + 0.6, r, C.tur, 0.3);
      fz11Motif(x, (ex + FZ11_KP[2] + bx * 2) / 4, (ey + FZ11_KP[3] + by * 2) / 4, r * 0.8, C.tur, 1.1);
    }
  }
  x.restore();
  yol(); x.strokeStyle = C.dC; x.lineWidth = 0.42; x.lineJoin = 'round'; x.stroke();
  x.strokeStyle = far ? C.aKat : C.kat; x.lineWidth = 0.42; x.lineCap = 'round'; x.beginPath();   // kumaş kıvrımları (dirsekten tarak uçlarına)
  x.moveTo(ex, ey); x.lineTo(FZ11_KP[0], FZ11_KP[1]); x.moveTo(ex, ey); x.lineTo(FZ11_KP[2], FZ11_KP[3]); x.stroke();
  x.strokeStyle = far ? 'rgba(255,225,236,0.4)' : 'rgba(235,240,255,0.32)'; x.lineWidth = 0.38; x.beginPath();   // kıvrım sırtında ışık (iki tonlu kıvrım)
  x.moveTo(ex + 0.45, ey + 0.35); x.lineTo(FZ11_KP[0] + 0.45, FZ11_KP[1] + 0.2); x.moveTo(ex + 0.45, ey + 0.35); x.lineTo(FZ11_KP[2] + 0.45, FZ11_KP[3] + 0.2); x.stroke();
  if (!far) { x.strokeStyle = 'rgba(222,238,255,0.6)'; x.lineWidth = 0.32; x.beginPath(); x.moveTo(sx + 0.2, sy + 0.25); x.lineTo(ex + 0.1, ey + 0.35); x.lineTo(wx - 0.1, wy + 0.35); x.stroke(); }   // üst kenarda gümüş ay ışığı
  if (!far) { x.strokeStyle = C.a; x.lineWidth = 0.5; x.beginPath(); x.moveTo(lerp(sx, ex, 0.4), lerp(sy, ey, 0.4)); x.lineTo(ex, ey); x.lineTo(wx, wy); x.stroke(); }   // kolun kenarında kıvrılan astar
}
function fz11KanatYan(x, R, hip, by, near) {
  const ac = fz11Acik(); if (ac < 0.02) return;
  const C = fz11P(), sx = near ? 1.0 : -0.9, sy = near ? -11.6 + by : -12.0 + by * 0.6;
  const j = fzJ(sx, sy, FZ_UA * R.arm, near ? R.la1 : R.ba1, FZ_FA * R.arm, near ? R.la2 : R.ba2);
  const bx = near ? -3.6 : -5.0, byy = near ? 6.0 : 5.4, e = smooth(ac);
  const ex = lerp(lerp(sx, bx, 0.35) - 1.4, j[2], e), ey = lerp(lerp(sy, byy, 0.35), j[3], e);
  const wx = lerp(lerp(sx, bx, 0.68) - 1.8, j[4] + Math.sin(j[6]) * 0.8, e), wy = lerp(lerp(sy, byy, 0.68), j[5] + Math.cos(j[6]) * 0.8, e);
  x.save(); x.translate(R.hx, hip); x.rotate(R.lean);
  fz11Zar(x, sx, sy, ex, ey, wx, wy, bx, byy, !near, ac, C);
  x.restore();
}
// ── önden pelerin (her şeyin arkasında; astar görünür): omuzlardan eteğe; kollar kalkınca / açılınca bileklerden taraklı kanat ──
const FZ11_ON = new Float64Array(16);
function fz11Tarak(x, ax, ay, bx, by, n, bul, nx, ny, kp) {   // (ax,ay) → (bx,by) n taraklı kenar: uçlar arasında içe kıvrık yaylar, orta uçlar dışa (nx,ny)
  for (let i = 1; i <= n; i++) {
    const t0 = (i - 1) / n, t1 = i / n, o1 = i === n ? 0 : Math.sin(t1 * Math.PI) * bul;
    const px = lerp(ax, bx, t1) + nx * o1, py = lerp(ay, by, t1) + ny * o1, o0 = i === 1 ? 0 : Math.sin(t0 * Math.PI) * bul;
    const qx = lerp(ax, bx, t0) + nx * o0, qy = lerp(ay, by, t0) + ny * o0, mx = (qx + px) / 2 - nx * (0.9 + bul * 0.15), my = (qy + py) / 2 - ny * (0.9 + bul * 0.15);
    x.quadraticCurveTo(mx, my, px, py);
    if (kp && i < n) { kp[i * 2 - 2] = px; kp[i * 2 - 1] = py; }
  }
}
function fz11OnYol(x, A) {   // A: [nL, sL(x,y), eL, aL, cL, …] (FZ11_ON düzeni) — sol kenar, taraklı etek, sağ kenar
  const sy = A[0], hem = A[1], ac = A[2], fl = A[3], tm = fz8M.tm;
  x.beginPath(); x.moveTo(-3.0, sy - 1.8); x.lineTo(-7.2, sy + 0.6);
  x.lineTo(A[4], A[5]); x.lineTo(A[6], A[7]);
  const cLx = -(10.0 + fl) + Math.sin(tm * 5.3) * 0.3 * fl, cRx = 10.0 + fl + Math.sin(tm * 5.3 + 1.7) * 0.3 * fl;
  fz11Tarak(x, A[6], A[7], cLx, hem + fz8Dalga(1) * 0.35, 3, 0.9 + 2.6 * ac, -0.9, -0.2 + 0.4 * ac, null);
  for (let i = 1; i <= 4; i++) {   // etek: dört yumuşak tarak (aralarında yukarı kıvrık)
    const t = i / 4, px = lerp(cLx, cRx, t), py = hem + (i === 4 ? fz8Dalga(7) * 0.35 : fz8Dalga(i + 2) * 0.5), qx = lerp(cLx, cRx, t - 0.125);
    x.quadraticCurveTo(qx, hem - 1.6 - 0.4 * fl, px, py);
  }
  fz11Tarak(x, cRx, hem + fz8Dalga(7) * 0.35, A[14], A[15], 3, 0.9 + 2.6 * ac, 0.9, -0.2 + 0.4 * ac, null);
  x.lineTo(A[12], A[13]); x.lineTo(7.2, sy + 0.6); x.lineTo(3.0, sy - 1.8); x.closePath();
  return cLx;
}
function fz11PelerinOn(x, R, hip, by) {
  const C = fz11P(), M = fz8M, b = fz8Buyu(), pf = M.pf;
  x.save(); x.translate(0, hip); if (fzQ.a_tilt) x.rotate(fzQ.a_tilt * 0.7);
  const L = fz8OnKol(0, R, by, FZ8_KG), Rr = fz8OnKol(1, R, by, FZ8_KG2), sy = -11.6 + by;
  const yuk = Math.max(clamp((sy + 7 - L[3]) / 9, 0, 1), clamp((sy + 7 - Rr[3]) / 9, 0, 1));   // bilekler göğsün üstünde: pelerin kollarla açılır
  const ac = Math.max(fz11Acik(), smooth(yuk)), hem = 12.6 - 1.4 * clamp(M.pa - 0.6, 0, 1) - 1.4 * ac, fl = 0.8 + 1.1 * pf + 0.5 * clamp(M.pa, 0, 1.2);
  if (b !== 1) { x.translate(0, sy - 1.8); x.scale(b, b); x.translate(0, -(sy - 1.8)); }
  const A = FZ11_ON, hy = lerp(sy, hem, 0.42);
  A[0] = sy; A[1] = hem; A[2] = ac; A[3] = fl;
  A[4] = lerp(-8.0 - 0.3 * fl, L[0] - 2.2, ac); A[5] = lerp(lerp(sy, hy, 0.5), L[1], ac);       // sol dirsek
  A[6] = lerp(-8.6 - 0.6 * fl, L[2] - 2.0, ac); A[7] = lerp(hy, L[3] + 0.9, ac);                // sol bilek
  A[12] = lerp(8.0 + 0.3 * fl, Rr[0] + 2.2, ac); A[13] = lerp(lerp(sy, hy, 0.5), Rr[1], ac);    // sağ dirsek
  A[14] = lerp(8.6 + 0.6 * fl, Rr[2] + 2.0, ac); A[15] = lerp(hy, Rr[3] + 0.9, ac);             // sağ bilek
  const cLx = fz11OnYol(x, A), cRx = -cLx; x.fillStyle = C.a; x.fill();
  x.save(); x.clip();
  {   // hacim: astarda kumaş kıvrımları (pişmiş doku, rüzgârda ikincil dalga), gövdenin ardında yumuşak gölge, açık kanatta ışık geçişi
    const tm = M.tm, sw = Math.sin(tm * 2.9) * (0.03 + 0.06 * pf), kay = Math.sin(tm * 3.7) * 0.4 * pf, w = Math.max(10, (A[14] - A[6]) * 0.5 + 3);
    x.save(); x.translate(0, sy - 1.4); x.transform(1, 0, sw, 1, 0, 0); x.drawImage(fz11Doku(C, 1), -w + kay, 0, w * 2, hem - sy + 4); x.restore();
    x.globalAlpha = 0.6; x.drawImage(fz11Leke(0), -8.5, sy - 2, 17, (hem - sy) * 1.15); x.globalAlpha = 1;
    if (ac > 0.15) {
      x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.22 * ac;
      for (let s = -1; s <= 1; s += 2) { const qx = s < 0 ? (A[6] + cLx) / 2 : (A[14] + cRx) / 2, qy = lerp(s < 0 ? A[7] : A[15], hem, 0.45); x.drawImage(fz11Leke(1), qx - 7, qy - 6, 14, 12); }
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    }
  }
  x.strokeStyle = 'rgba(255,224,236,0.55)'; x.lineWidth = 4.6; x.lineJoin = 'round'; x.beginPath();   // astarın kenarı ışık alır, ardından dışa kıvrılan dış kumaş
  x.moveTo(-7.2, sy + 0.6); x.lineTo(A[4], A[5]); x.lineTo(A[6], A[7]); x.moveTo(7.2, sy + 0.6); x.lineTo(A[12], A[13]); x.lineTo(A[14], A[15]); x.stroke();
  x.strokeStyle = C.d; x.lineWidth = 3.4; x.stroke();
  x.strokeStyle = C.dA; x.lineWidth = 1.3; x.stroke();
  if (ac > 0.25) {   // açık kanatta kumaş kıvrımları
    x.strokeStyle = C.aKat; x.lineWidth = 0.42; x.lineCap = 'round'; x.beginPath();
    for (let s = -1; s <= 1; s += 2) { const ex = s < 0 ? A[4] : A[12], ey = s < 0 ? A[5] : A[13]; x.moveTo(ex, ey); x.lineTo(s * (7.5 + 2 * ac), hem - 0.5); x.moveTo(ex, ey); x.lineTo(s * 3.8, hem - 0.3); }
    x.stroke();
  }
  fz11Rim(x, () => fz11OnYol(x, A), 0.5, 0.8, '#dcecff');   // ay ışığından gümüş kenar
  x.restore();
  fz11OnYol(x, A); x.strokeStyle = C.dC; x.lineWidth = 0.5; x.lineJoin = 'round'; x.stroke();
  x.restore();
}
// ── dik vampir yakası (gövdeden sonra, başın arkasında) + boyunda toka ──
function fz11Toka(x, px, py, r, C) {
  x.fillStyle = C.mK; fz11Motif(x, px, py, r * 1.22, C.tur === 3 ? 0 : C.tur, 0.1);
  x.fillStyle = C.tur === 2 ? '#ff6f96' : C.m; fz11Motif(x, px, py, r, C.tur === 3 ? 0 : C.tur, 0.1);
  x.fillStyle = 'rgba(40,16,60,0.22)'; x.beginPath(); x.ellipse(px + r * 0.15, py + r * 0.38, r * 0.62, r * 0.34, 0, 0, 6.2832); x.fill();   // alt yarı gölgede (hacim)
  x.fillStyle = 'rgba(255,255,255,0.85)'; x.beginPath(); x.arc(px - r * 0.3, py - r * 0.35, r * 0.2, 0, 6.2832); x.fill();
}
function fz11Yaka(x, by, on) {
  const C = fz11P(), b = fz8Buyu();
  x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
  if (b !== 1) { const ny = -13.4 + by; x.translate(on ? 0 : 1.8, ny); x.scale(b, b); x.translate(on ? 0 : -1.8, -ny); }
  if (on) {
    x.globalAlpha = 0.34; x.drawImage(fz11Leke(0), -6.2, -14.6 + by, 12.4, 5.2); x.globalAlpha = 1;   // pelerinin ve yakanın Feza'ya düşen yumuşak gölgesi
    for (let s = -1; s <= 1; s += 2) {
      x.beginPath(); x.moveTo(s * 2.2, -13.9 + by); x.lineTo(s * 5.9, -12.7 + by); x.quadraticCurveTo(s * 9.2, -14.2 + by, s * 10.4, -19.4 + by);
      x.quadraticCurveTo(s * 10.6, -21.3 + by, s * 9.0, -20.9 + by); x.quadraticCurveTo(s * 6.2, -17.8 + by, s * 2.6, -14.9 + by); x.closePath();
      x.fillStyle = C.a; x.fill();
      x.save(); x.clip(); x.fillStyle = C.aK; x.globalAlpha = 0.5; x.beginPath(); x.ellipse(s * 4.2, -14.6 + by, 2.4, 1.6, 0, 0, 6.2832); x.fill(); x.globalAlpha = 1; x.restore();
      x.strokeStyle = C.d; x.lineWidth = 1.1; x.beginPath(); x.moveTo(s * 5.9, -12.7 + by); x.quadraticCurveTo(s * 9.2, -14.2 + by, s * 10.4, -19.4 + by); x.quadraticCurveTo(s * 10.6, -21.3 + by, s * 9.0, -20.9 + by); x.stroke();
      x.strokeStyle = s > 0 ? 'rgba(222,238,255,0.85)' : C.dA; x.lineWidth = 0.4; x.stroke();   // yakanın dış kenarında ay ışığı (hacim)
      x.strokeStyle = 'rgba(255,226,238,0.7)'; x.lineWidth = 0.35; x.beginPath(); x.moveTo(s * 8.7, -20.2 + by); x.quadraticCurveTo(s * 6.0, -17.4 + by, s * 3.0, -15.0 + by); x.stroke();   // astarın iç kıvrımı ışık alır
      x.strokeStyle = C.dC; x.lineWidth = 0.42; x.beginPath(); x.moveTo(s * 2.2, -13.9 + by); x.lineTo(s * 5.9, -12.7 + by); x.quadraticCurveTo(s * 9.2, -14.2 + by, s * 10.4, -19.4 + by);
      x.quadraticCurveTo(s * 10.6, -21.3 + by, s * 9.0, -20.9 + by); x.quadraticCurveTo(s * 6.2, -17.8 + by, s * 2.6, -14.9 + by); x.stroke();
    }
    x.strokeStyle = C.dK; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-5.0, -13.5 + by); x.quadraticCurveTo(0, -11.2 + by, 5.0, -13.5 + by); x.stroke();   // omuzdaki pelerin kenarı
    x.strokeStyle = C.d; x.lineWidth = 0.7; x.stroke();
    fz11Toka(x, 0, -12.2 + by, 1.3, C);
  } else {
    x.globalAlpha = 0.32; x.drawImage(fz11Leke(0), -5.4, -15.4 + by, 9.6, 5.0); x.globalAlpha = 1;   // yakanın boyna düşen yumuşak gölgesi
    x.beginPath(); x.moveTo(1.4, -12.3 + by); x.lineTo(-1.6, -12.9 + by); x.quadraticCurveTo(-7.0, -14.0 + by, -9.6, -20.4 + by);
    x.quadraticCurveTo(-10.6, -22.8 + by, -8.4, -22.0 + by); x.quadraticCurveTo(-4.2, -18.8 + by, -0.6, -15.9 + by); x.lineTo(1.4, -14.6 + by); x.closePath();
    x.fillStyle = C.d; x.fill();
    x.save(); x.clip(); x.fillStyle = 'rgba(30,14,70,0.22)'; x.beginPath(); x.ellipse(-4.2, -15.0 + by, 2.8, 1.6, -0.6, 0, 6.2832); x.fill(); x.restore();
    x.strokeStyle = C.a; x.lineWidth = 1.0; x.beginPath(); x.moveTo(-8.6, -21.6 + by); x.quadraticCurveTo(-4.2, -18.6 + by, -0.8, -15.6 + by); x.stroke();   // içteki astar kenarı
    x.strokeStyle = 'rgba(255,228,238,0.75)'; x.lineWidth = 0.35; x.stroke();
    x.strokeStyle = 'rgba(222,238,255,0.8)'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(-1.6, -12.9 + by); x.quadraticCurveTo(-7.0, -14.0 + by, -9.6, -20.4 + by); x.stroke();   // yakanın sırtında gümüş ay ışığı
    x.strokeStyle = C.dC; x.lineWidth = 0.42; x.beginPath(); x.moveTo(1.4, -12.3 + by); x.lineTo(-1.6, -12.9 + by); x.quadraticCurveTo(-7.0, -14.0 + by, -9.6, -20.4 + by); x.quadraticCurveTo(-10.6, -22.8 + by, -8.4, -22.0 + by); x.stroke();
    x.strokeStyle = C.dK; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-2.8, -14.6 + by); x.quadraticCurveTo(0.6, -12.6 + by, 3.9, -13.4 + by); x.stroke();
    x.strokeStyle = C.d; x.lineWidth = 0.7; x.stroke();
    fz11Toka(x, 3.3, -13.0 + by, 1.25, C);
  }
  x.restore();
}
// ── yarasa kanatlı minik taç (kafa yerel çerçevesinde; fz8Tac gibi) ──
function fz11Kanatcik(x, C) {   // sağa uzanan minik yarasa kanadı (alt kenar iki taraklı)
  x.beginPath(); x.moveTo(0.4, -0.7); x.quadraticCurveTo(2.0, -3.7, 5.3, -3.3);
  x.quadraticCurveTo(4.1, -2.0, 3.7, -0.6); x.quadraticCurveTo(2.7, -1.3, 1.7, 0.3); x.quadraticCurveTo(1.1, -0.4, 0.4, 0.4); x.closePath();
  x.fillStyle = C.kn; x.fill();
  x.save(); x.clip();   // hacim: alt kenar gölgede, üst kenar parlak, ince zar kemikleri
  x.fillStyle = C.dC; x.globalAlpha = 0.38; x.beginPath(); x.ellipse(2.4, 0.9, 3.6, 1.7, -0.15, 0, 6.2832); x.fill();
  x.fillStyle = '#ffffff'; x.globalAlpha = 0.3; x.beginPath(); x.ellipse(2.6, -2.7, 2.6, 0.8, -0.12, 0, 6.2832); x.fill(); x.globalAlpha = 1;
  x.strokeStyle = 'rgba(30,14,70,0.35)'; x.lineWidth = 0.22; x.beginPath(); x.moveTo(0.8, -1.0); x.lineTo(3.7, -0.6); x.moveTo(0.8, -1.0); x.lineTo(1.7, 0.3); x.stroke();
  x.restore();
  x.strokeStyle = C.dC; x.lineWidth = 0.35; x.stroke();
  x.strokeStyle = 'rgba(232,242,255,0.85)'; x.lineWidth = 0.3; x.beginPath(); x.moveTo(1.0, -1.3); x.quadraticCurveTo(2.4, -3.1, 4.8, -3.1); x.stroke();
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(3.9, -2.75, 0.32, 0, 6.2832); x.fill();   // parlak nokta
}
function fz11Tac(x, on, tm) {
  const C = fz11P(), b = fz8Buyu(), kb = fz8M.kb, yw = on ? (fzQ.a_yaw || 0) : 0, ac = fz11Acik();
  x.save(); if (b !== 1) { x.translate(0, -9); x.scale(b, b); x.translate(0, 9); }
  x.lineCap = 'round';
  x.strokeStyle = C.tC; x.lineWidth = 0.95; x.beginPath();
  if (on) x.ellipse(0.5 * yw, -1.6, 9.5, 14.0, 0, Math.PI * 1.07, Math.PI * 1.93); else { x.moveTo(-2.9, -2.0); x.quadraticCurveTo(-4.6, -12.9, 2.4, -15.1); }
  x.stroke(); x.strokeStyle = C.t; x.lineWidth = 0.42; x.stroke();
  x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 0.18; x.stroke();   // taç bandında parlak çizgi (metal)
  const fl = Math.sin(tm * (3.2 + 10 * ac)) * (0.08 + 0.22 * ac) + kb * 0.45;   // kanatçıklar pırpır
  x.translate(on ? 0.5 * yw : 0.9, on ? -15.5 : -15.4); x.rotate(on ? 0.05 * yw : -0.16);
  for (let s = -1; s <= 1; s += 2) { x.save(); x.scale(s * (on || s > 0 ? 1 : 0.72), 1); x.rotate(-0.12 - fl * s); fz11Kanatcik(x, C); x.restore(); }
  fz11Toka(x, 0, -0.4, 1.35, C);
  x.restore();
}
// ── oyuncak dişçik (fzMouth'tan): açık ağızda üst dişlerin altında iki yuvarlak uçlu dişçik; kapalıyken iki minik nokta ──
function fz11Disler(x, lx, rx, ty, acik, mx, my) {
  x.fillStyle = '#fffaf3';
  if (acik) {
    const w = rx - lx;
    for (let i = 0; i < 2; i++) { const fx = lx + w * (i ? 0.7 : 0.3); x.beginPath(); x.moveTo(fx - 0.42, ty - 0.1); x.quadraticCurveTo(fx - 0.36, ty + 0.72, fx, ty + 0.92); x.quadraticCurveTo(fx + 0.36, ty + 0.72, fx + 0.42, ty - 0.1); x.closePath(); x.fill(); }
  } else { x.beginPath(); fzEl(x, mx - 0.75, my, 0.3, 0.26); fzEl(x, mx + 0.75, my, 0.3, 0.26); x.fill(); }
}
// oyunda havadayken (Bölüm 11, pelerinli): kollar iki yana-yukarı açılır, pelerin kanat gibi gerilir; tepede süzülürken yavaşça çırpar
function fz11Havada(T, st, t, vy) {
  const w = st === 'rise' ? 0.8 : st === 'launch' ? 0.6 : st === 'apex' ? 1 : smooth(clamp(1.15 - (vy - 170) / 900, 0.55, 1)) * (1 - 0.6 * smooth(P.a_pre || 0));
  if (w < 0.02) return;
  const f1 = Math.sin(t * 4.2), f2 = Math.sin(t * 4.2 + 1.3);
  T.la1 = lerp(T.la1, 2.0 + 0.22 * f1, w); T.la2 = lerp(T.la2, 0.28 + 0.1 * f2, w); T.ba1 = lerp(T.ba1, -1.95 - 0.22 * f1, w); T.ba2 = lerp(T.ba2, 0.3, w);
  T.hOpen = Math.max(T.hOpen, w); T.shr = lerp(T.shr, 0.45, w); T.arm = lerp(T.arm, 1.08, w);
  T.mSmile = 1; T.mRound = lerp(T.mRound, 0, w); T.mOpen = Math.max(T.mOpen, 0.6 * w);
  FZ8D.kn8 = Math.max(FZ8D.kn8, 0.6 + 0.4 * w);
}
// pelerinin ikincil hareketine Bölüm 11 eki (fz8Adim'in sonunda): pembe pelerinden koşarken/uçarken gümüş yıldız tozu dökülür
const FZ11D = { tozT: 0 }, FZ11_TOZR = ['#ffffff', '#eef3ff', '#ffe6f6', '#e6dcff'];
function fz11Adim(dt, kos, sp, air) {
  if (kos !== 'p11pembe' || typeof parca !== 'function' || !(dt > 0)) return;
  FZ11D.tozT -= dt * (0.6 + 4.5 * clamp(sp / 250, 0, 1) + (air ? 3 : 0));
  if (FZ11D.tozT > 0) return;
  FZ11D.tozT += 1;
  const sd = P.a_side || P.f || 1;
  parca(P.x - sd * (8 + Math.random() * 8), P.y - 22 - Math.random() * 18, -sd * 12 - P.vx * 0.08 + (Math.random() - 0.5) * 16, -10 - Math.random() * 18, 0.55 + Math.random() * 0.4, FZ11_TOZR[(Math.random() * 4) | 0], 2.2 + Math.random() * 2);
}
if (typeof OLAY !== 'undefined') {
  const b11 = () => BOLUM_NO === 11 && !!P.a_pose;
  OLAY.on('pelerinSec', () => { if (!b11()) return; FZ8D.donT = 0; FZ8D.donS = P.a_side || P.f || 1; P.a_sit = 0; P.a_act = ''; P.a_cheerT = 9; P.a_tadaT = 9; });
  OLAY.on('ciftZiplama', () => { if (b11()) FZ8D.flapT = 0; });   // çift zıplamada pelerin kanat çırpar
  OLAY.on('aynaDondu', e => { if (!b11() || P.ucus) return; const o = e && (e.o || e); if (FZ8D.donT > 1.3) fz8Sevin(o && Number.isFinite(o.x) ? o : (e && Number.isFinite(e.x) ? e : null)); });
  for (const ev of ['salonBitti', 'orgBitti', 'pastaBitti']) OLAY.on(ev, e => { if (b11() && !P.ucus) fz8Sevin(e && e.o && Number.isFinite(e.o.x) ? e.o : { x: P.x + (P.f || 1) * 40, y: P.y }); });
  OLAY.on('pelerinUcusBitti', () => { if (b11()) { P.a_fromL = true; P.a_sit = 0; P.a_act = ''; } });
}
// ── ara sahne pozları: 'ucus11' (yandan, pelerin kanat gibi açık süzülme) ve 'dans11' (önden vals) ──
// 'ucus11' opt: { vy (dikey hız: dalışta öne eğilir, tırmanışta kalkar), ruzgar 0..1 (vars. 0,8), cirp 0..1 (kanat çırpma; vars. hafif,
//   tırmanırken artar), sevinc 0..1 (kollar havada "yihuu"), acik 0..1 (kanat açıklığı, vars. 1), aci (ek eğim, radyan) }.
//   x,y = ayak tabanı hizası (öteki pozlar gibi); eğim gövde ortası etrafında (ayak noktası değil) döner. Uzak bacak/kol görünür.
// 'dans11' opt: { olcu (ölçü sn; vars. 3/4 104 BPM = 1,731), nabiz 0..1 }. tm = dansın saati (balo11 baloFinalAn()).
//   Dört ölçülük döngü: sola salınan vals adımı (bir kol pelerini açar) · sağa salınan adım · kollar açık pelerinli dönüş · reverans + ta-da.
const FZ11_POZ = { front: false, rotA: 0, piv: 0 };
function fz11Poz(poz, tm, opt, R, Q, olcek, x, y) {
  const o = opt && typeof opt === 'object' ? opt : FZ_BOS, P2 = FZ11_POZ;
  P2.front = poz === 'dans11'; P2.rotA = 0; P2.piv = 0;
  if (poz === 'ucus11') {
    const vy = +o.vy || 0, rz = o.ruzgar != null ? clamp(+o.ruzgar, 0, 1) : 0.8, sv = o.sevinc != null ? smooth(clamp(+o.sevinc || 0, 0, 1)) : 0;
    const ci = o.cirp != null ? clamp(+o.cirp || 0, 0, 1) : clamp(0.25 - vy / 500, 0.15, 0.8), f = Math.sin(tm * 7.2) * ci, k1 = Math.sin(tm * 3.1), k2 = Math.sin(tm * 3.1 + 1.6);
    P2.rotA = (0.34 + clamp(vy / 520, -0.3, 0.38)) * (1 - 0.5 * sv) + (+o.aci || 0); P2.piv = 22;
    Q.a_kenar = true; Q.a_noFar = false;
    fzSwF = 9.5; fzSwA = 1 + 3.5 * rz;
    Q.a_cl = (-1.6 + 0.45 * Math.sin(tm * 13.7) + 0.3 * Math.sin(tm * 21.3)) * rz;
    Q.a_hx = (-3.8 + 0.5 * Math.sin(tm * 8.3)) * rz; Q.a_hy = clamp(-vy * 0.004, -2.5, 2.5) - 0.6 * rz + 0.45 * Math.sin(tm * 6.1) * rz;
    R.lean = 0.1 + 0.03 * k1; R.hx = 0;
    R.lt1 = -0.12 + 0.16 * k1; R.lt2 = -0.95 - 0.25 * Math.max(0, k2); R.bt1 = 0.22 - 0.14 * k1; R.bt2 = -0.6 - 0.2 * Math.max(0, -k2);   // bacaklar geriye, keyifle sallanır
    R.la1 = lerp(2.05 + 0.4 * f, 2.2 + 0.12 * Math.sin(tm * 10), sv); R.la2 = lerp(0.26 + 0.1 * f, 0.15, sv);
    R.ba1 = lerp(-1.95 - 0.4 * f, 2.75 - 0.1 * Math.sin(tm * 10), sv); R.ba2 = lerp(0.3, 0.2, sv);
    R.hOpen = 1; R.arm = 1.1; R.shr = 0.35 + 0.1 * f + 0.2 * sv; R.breath = Math.sin(tm * 2.6) * 0.6;
    const ak = o.acik != null ? smooth(clamp(+o.acik || 0, 0, 1)) : 1, el = o.el != null ? smooth(clamp(+o.el || 0, 0, 1)) : 0;
    if (ak < 1) { R.la1 = lerp(0.4, R.la1, ak); R.la2 = lerp(0.5, R.la2, ak); R.ba1 = lerp(-0.2, R.ba1, ak); R.ba2 = lerp(0.4, R.ba2, ak); }   // balkonda: pelerin kapalı, kollar yanda
    if (el > 0) { R.la1 = lerp(R.la1, 1.5, el); R.la2 = lerp(R.la2, 1.25 + 0.35 * Math.sin(tm * 11), el); R.arm = lerp(R.arm, 1.18, el); R.head = lerp(R.head, -0.4, el); R.gy = lerp(R.gy, -0.7, el); R.mOpen = Math.max(R.mOpen, 0.7 * el); }   // ay anında Ay'a el sallar
    R.head = -0.22 - 0.1 * sv + 0.04 * Math.sin(tm * 3.1) + 0.08 * clamp(vy / 300, -1, 1); R.gx = 0.9; R.gy = -0.1 + 0.4 * clamp(vy / 320, -0.5, 1) - 0.3 * sv;
    R.mSmile = 1; R.mOpen = 0.45 + 0.45 * sv + 0.15 * ci; R.mRound = 0; R.happy = sv > 0.45 || (tm % 3.7) < 0.9 ? 1 : 0; R.brow = 0.35 + 0.3 * sv; R.lid = 1.05;
    return P2;
  }
  // dans11: önden vals
  const ol = o.olcu > 0.6 ? +o.olcu : 1.731, vu = ol / 3, tt = Math.max(0, tm), bar = Math.floor(tt / ol) % 4, bu = (tt % ol) / ol, bt = bu * 3, fb = Math.min(2, Math.floor(bt)), fu = bt - fb;
  const dip = fb === 0 ? Math.sin(Math.PI * fu) : 0, up = fb > 0 ? Math.sin(Math.PI * (bt - 1) / 2) : 0, nb = o.nabiz != null ? clamp(+o.nabiz, 0, 1) : 0;
  R.happy = 1; R.mSmile = 1; R.mOpen = 0.7; R.brow = 0.45; R.arm = 1.12; R.mRound = 0;
  const leg = (h, sd) => { R.lt1 = 0.05 + (sd > 0 ? 0.35 : 0.1) * h; R.lt2 = -0.1 - (sd > 0 ? 0.6 : 0.2) * h; R.bt1 = 0.05 + (sd < 0 ? 0.35 : 0.1) * h; R.bt2 = -0.1 - (sd < 0 ? 0.6 : 0.2) * h; };
  if (bar < 2) {   // vals adımı: 1. vuruşta diz kırar, 2–3'te parmak ucunda yükselir; bir kol yana-yukarı pelerini açar, öbür el göğüste
    const sd = bar === 0 ? -1 : 1, sw = Math.sin(Math.PI * bu);
    Q.a_tilt = 0.11 * sd * sw; R.bob = 1.3 * dip - 1.9 * up; leg(dip, sd); R.sy = 1 - 0.02 * dip + 0.02 * up; R.sx = 2 - R.sy;
    const ax = sd * (11.8 + 2.2 * sw), ay = -13.5 - 6.5 * sw;
    Q.ik = sd < 0 ? [[ax, ay, 1], [3.2, -6.8, 0]] : [[-3.2, -6.8, 0], [ax, ay, 1]];
    R.head = 0.1 * sd * sw; R.gx = sd * 0.45; R.gy = -0.25; R.shr = 0.2 * up;
  } else if (bar === 2) {   // pelerinli dönüş: kollar iki yana açık, pelerin kanat gibi; gövde dönüyormuş gibi daralıp genişler
    const s2 = Math.sin(Math.PI * bu), wv = Math.sin(tt * 9) * 0.6;
    R.sx = 1 - 0.07 * s2; R.sy = 1 + 0.02 * s2; R.bob = -2.4 * s2; leg(0.35 * s2, bar & 1 ? 1 : -1); Q.a_tilt = 0.07 * Math.sin(FZ11_2PI * bu);   // (daralmadan) salınarak döner; pelerin kanat gibi açık
    Q.ik = [[-13.8 - wv, -12.5 - 3.5 * s2, 1], [13.8 + wv, -12.5 - 3.5 * s2, 1]]; R.shr = 0.35;
    R.gx = 0; R.gy = -0.4; R.mOpen = 0.85; R.head = 0.06 * Math.sin(tt * 4);
  } else {   // reverans (eğilir, pelerinin uçlarını tutar) → ta-da (kollar havada, pelerin ardına açılır)
    if (fb === 0) {
      const bw = Math.sin(Math.PI * fu);
      R.head = 0.32 * bw; R.bob = 1.6 * bw; leg(0.6 * bw, 1); R.lt1 = 0.05 + 0.4 * bw; R.lt2 = -0.1 - 0.8 * bw; R.bt1 = -0.15 * bw;
      Q.ik = [[-10.5 - 1.5 * bw, 2.6 + 0.8 * bw, 0], [10.5 + 1.5 * bw, 2.6 + 0.8 * bw, 0]]; R.gy = 0.5 * bw; R.mOpen = 0.45; R.happy = bw > 0.4 ? 1 : 0;
    } else {
      const u2 = smooth(clamp((bt - 1) / 0.45, 0, 1)), wg = Math.sin(tt * 14) * 0.5 * u2;
      Q.ik = [[-lerp(10.5, 15.4, u2) - wg, lerp(2.6, -21.5, u2), 1], [lerp(10.5, 15.4, u2) + wg, lerp(2.6, -21.5, u2), 1]];
      R.bob = -1.8 * u2; R.sy = 1 + 0.03 * u2; R.sx = 2 - R.sy; R.mOpen = 0.9; R.brow = 0.55; R.gy = -0.3;
    }
  }
  if (nb > 0) R.bob -= 1.2 * nb;
  Q.a_hy = Math.cos(bu * 6.2832) * 1.4 - 0.6 * up;
  return P2;
}
function fz11CDoldur(poz, tm, o, M) {
  if (poz === 'ucus11') {
    const rz = o.ruzgar != null ? clamp(+o.ruzgar, 0, 1) : 0.8, vy = +o.vy || 0, ci = o.cirp != null ? clamp(+o.cirp || 0, 0, 1) : clamp(0.25 - vy / 500, 0.15, 0.8);
    M.ruz = rz; M.kn = o.acik != null ? clamp(+o.acik, 0, 1) : 1;
    M.pa = 0.2 + rz * (0.95 + 0.08 * Math.sin(tm * 9.1)) + clamp(vy / 700, -0.25, 0.3); M.pf = clamp(0.35 + 0.7 * rz, 0, 1);
    M.kb = 0.15 * Math.sin(tm * 7.2) * ci - 0.35 * rz; M.su = 0;
    return;
  }
  const ol = o.olcu > 0.6 ? +o.olcu : 1.731, tt = Math.max(0, tm), bar = Math.floor(tt / ol) % 4, bu = (tt % ol) / ol, fb = Math.min(2, Math.floor(bu * 3));
  M.ruz = 0; M.pf = 0.45; M.kb = 0.3 * Math.sin(tm * 6.1);
  if (bar < 2) { M.kn = 0.35 + 0.2 * Math.sin(Math.PI * bu); M.pa = 0.1 + 0.15 * Math.sin(Math.PI * bu); }
  else if (bar === 2) { M.kn = 1; M.pa = 0.15 + 0.4 * Math.sin(Math.PI * bu); M.pf = 0.8; }
  else { M.kn = fb ? 1 : 0.3; M.pa = 0.12; }
}
// ── pelerini tek başına çiz: (x, y) = yaka ortası (boyun), s = 1 oyundaki boy, acik 0..1 (0 sarkık … 1 kanat gibi açık),
//    renk 'mor'|'lacivert'|'kirmizi'|'pembe' (vars. V11.pelerin), arka: true → arkadan (dış yüz + işleme), false → önden (astar) ──
const FZ11_IK = [[-7, 0.6, 0], [7, 0.6, 0]];
const FZ11_ARKA = [[-5.6, -5.4, 1], [5.6, -5.4, 1], [0, -1.6, 1.1], [-9.6, 0.4, 0.9], [9.6, 0.4, 0.9], [-4.8, 3.6, 1], [4.8, 3.6, 1], [0, 6.6, 0.9], [-9.0, 6.4, 0.8], [9.0, 6.4, 0.8], [-2.6, -8.8, 0.7], [2.6, -8.8, 0.7]];
function fezaPelerinCiz(c, x, y, s, acik, renk, tm, arka) {
  const kos = fz11Kos(renk || (typeof V11 !== 'undefined' && V11 && V11.pelerin) || 'mor'); if (!kos || !c) return;
  const eK = fzKos, eM = fz8M, eQ = fzQ, M = FZ8_C, Q = fzCS, R = Q.a_R, eIk = Q.ik, eT = Q.a_tilt;
  const a = clamp(+acik || 0, 0, 1); tm = Number.isFinite(tm) ? tm : (typeof now !== 'undefined' ? now : 0);
  fzKos = kos; fz8M = M; fzQ = Q;
  M.giy = 1; M.tm = tm; M.pf = 0.3 + 0.3 * a; M.pa = 0.1; M.kn = a; M.ruz = 0; M.kb = 0.15 * Math.sin(tm * 3);
  Object.assign(R, FZ_REST); Q.a_tilt = 0; Q.ik = FZ11_IK;
  const wx = lerp(7.4, 16.6, a), wy = lerp(0.6, -19.5, a); FZ11_IK[0][0] = -wx; FZ11_IK[1][0] = wx; FZ11_IK[0][1] = FZ11_IK[1][1] = wy;
  const sc = (Number.isFinite(+s) ? +s : 1) * FZ_SC;
  c.save(); c.translate(x, y); c.scale(sc, sc); c.translate(0, 13.4);
  try {
    if (arka) fz11PelerinArka(c, a, tm);
    else { fz11PelerinOn(c, R, 0, 0); fz11Yaka(c, 0, true); }
  } finally { c.restore(); fzKos = eK; fz8M = eM; fzQ = eQ; Q.ik = eIk; Q.a_tilt = eT; }
}
function fz11PelerinArka(c, a, tm) {   // arkadan: dış yüz ve işleme, kenarlarda kıvrılan astar, dik yaka (fezaPelerinCiz çerçevesinde, kalça 0)
  const C = fz11P(), M = fz8M, R = fzQ.a_R, sy = -11.6;
  const L = fz8OnKol(0, R, 0, FZ8_KG), Rr = fz8OnKol(1, R, 0, FZ8_KG2), ac = Math.max(a, 0.001), hem = 10.8 - 1.2 * ac, fl = 0.8 + 1.1 * M.pf, A = FZ11_ON, hy = lerp(sy, hem, 0.42);
  A[0] = sy; A[1] = hem; A[2] = ac; A[3] = fl;
  A[4] = lerp(-8.0 - 0.3 * fl, L[0] - 2.2, ac); A[5] = lerp(lerp(sy, hy, 0.5), L[1], ac); A[6] = lerp(-8.6 - 0.6 * fl, L[2] - 2.0, ac); A[7] = lerp(hy, L[3] + 0.9, ac);
  A[12] = lerp(8.0 + 0.3 * fl, Rr[0] + 2.2, ac); A[13] = lerp(lerp(sy, hy, 0.5), Rr[1], ac); A[14] = lerp(8.6 + 0.6 * fl, Rr[2] + 2.0, ac); A[15] = lerp(hy, Rr[3] + 0.9, ac);
  fz11OnYol(c, A); c.fillStyle = C.d; c.fill();
  c.save(); c.clip();
  c.strokeStyle = C.a; c.lineWidth = 2.2; c.lineJoin = 'round'; c.beginPath();
  c.moveTo(-7.2, sy + 0.6); c.lineTo(A[4], A[5]); c.lineTo(A[6], A[7]); c.moveTo(7.2, sy + 0.6); c.lineTo(A[12], A[13]); c.lineTo(A[14], A[15]); c.stroke();
  { const w = Math.max(10, (A[14] - A[6]) * 0.5 + 3), sw = Math.sin(tm * 2.9) * 0.05; c.save(); c.translate(0, sy - 1.4); c.transform(1, 0, sw, 1, 0, 0); c.drawImage(fz11Doku(C, 0), -w, 0, w * 2, hem - sy + 4); c.restore(); }   // kumaş kıvrımları (hacim)
  if (ac > 0.15) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.2 * ac; c.drawImage(fz11Leke(2), A[6] - 2, A[7] - 4, 12, 12); c.drawImage(fz11Leke(2), A[14] - 10, A[15] - 4, 12, 12); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }   // açık kanatta ışık geçişi
  c.globalAlpha = 0.7; c.drawImage(fz11Leke(1), -7.5, -11, 7, 12); c.globalAlpha = 1;
  c.strokeStyle = C.kat; c.lineWidth = 0.45; c.lineCap = 'round'; c.beginPath();
  for (let s = -1; s <= 1; s += 2) { const ex = s < 0 ? A[4] : A[12], ey = s < 0 ? A[5] : A[13]; c.moveTo(ex, ey); c.quadraticCurveTo(s * (6 + ac), lerp(ey, hem, 0.5), s * (7.5 + 2 * ac), hem - 0.8); }
  c.stroke();
  for (let i = 0; i < FZ11_ARKA.length; i++) {
    const q = FZ11_ARKA[i], px = q[0] * (0.75 + 0.35 * ac), py = q[1] + 1.5 * (1 - ac);
    if (C.tur === 3) { c.fillStyle = i % 3 ? '#ffffff' : '#dfe8ff'; c.globalAlpha = 0.7 + 0.3 * Math.sin(tm * 3.1 + i * 1.7); if (i % 2) { c.beginPath(); c.arc(px, py, 0.4 * q[2], 0, 6.2832); c.fill(); } else fz11Motif(c, px, py, 1.15 * q[2], 3, 0); c.globalAlpha = 1; }
    else { c.fillStyle = C.m; fz11Motif(c, px, py, q[2] * C.mr, C.tur, i * 0.9); }
  }
  fz11Rim(c, () => fz11OnYol(c, A), 0.55, 0.8, '#dcecff');
  c.restore();
  fz11OnYol(c, A); c.strokeStyle = C.dC; c.lineWidth = 0.5; c.lineJoin = 'round'; c.stroke();
  // dik yaka arkadan: boynu saran yüksek, iki yana kıvrık yaka (dış yüz)
  c.beginPath(); c.moveTo(-5.0, -12.4); c.quadraticCurveTo(-7.0, -13.4, -7.6, -16.4); c.quadraticCurveTo(-5.8, -15.6, -4.2, -15.3); c.quadraticCurveTo(0, -16.2, 4.2, -15.3);
  c.quadraticCurveTo(5.8, -15.6, 7.6, -16.4); c.quadraticCurveTo(7.0, -13.4, 5.0, -12.4); c.quadraticCurveTo(0, -11.2, -5.0, -12.4); c.closePath();
  c.fillStyle = C.d; c.fill(); c.strokeStyle = C.dC; c.lineWidth = 0.45; c.stroke();
  c.strokeStyle = C.a; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-7.1, -16.0); c.quadraticCurveTo(-5.8, -15.6, -4.2, -15.3); c.quadraticCurveTo(0, -16.2, 4.2, -15.3); c.quadraticCurveTo(5.8, -15.6, 7.1, -16.0); c.stroke();
}
// pelerin simgesi (pelerin11.js baloncukları, sonuç kartı): (x, y) merkez, s ≈ yarıçap. Arkadan görülen, yarasa kanadı gibi açık pelerin
// (üst kenar yakadan kanat uçlarına kalkar, alt kenar dörder taraklı); kanatlar tm ile yavaşça açılıp kapanır. Kare başına yalnız yollar.
const FZ11_IK_T = new Float64Array(20);
function fz11IkonYol(c, ac, sd) {   // bir yarım (sd = ±1): boyun → kanat ucu → taraklı alt kenar → orta alt
  const tx = sd * lerp(13.5, 16.8, ac), ty = lerp(-4.5, -10.5, ac), K = FZ11_IK_T;
  c.moveTo(sd * 2.6, -7.4); c.quadraticCurveTo(sd * lerp(8, 9.5, ac), lerp(-6.5, -9.8, ac), tx, ty);
  const pts = 4; let qx = tx, qy = ty;
  for (let i = 1; i <= pts; i++) {
    const t = i / pts, px = lerp(tx, 0, t) + sd * Math.sin(t * Math.PI) * 2.2, py = lerp(ty, 11.5, Math.pow(t, 0.8)) + Math.sin(t * Math.PI) * 3.0;
    const mx = (qx + px) / 2, my = (qy + py) / 2; c.quadraticCurveTo(mx - sd * 0.9 - 0.0, my - 2.2, px, py);
    K[i * 2] = px; K[i * 2 + 1] = py; qx = px; qy = py;
  }
}
function fezaPelerinIkon(c, ad, x, y, s, tm) {
  const kos = fz11Kos(ad); if (!kos || !c) return;
  const C = FZ11_KOS[kos], k = s / 15.8, ac = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin((tm || 0) * 2.6)), K = FZ11_IK_T;
  c.save(); c.translate(x, y + 0.5 * k); c.scale(k, k); c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath(); fz11IkonYol(c, ac, -1); c.lineTo(0, -7.6); c.closePath(); fz11IkonYol(c, ac, 1); c.lineTo(0, -7.6); c.closePath();
  c.fillStyle = C.d; c.fill();
  c.save(); c.clip();
  c.drawImage(fz11Doku(C, 0), -19, -9.5, 38, 23);   // kumaş kıvrımları (hacim)
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 + 0.12 * ac; c.drawImage(fz11Leke(2), -19, -12, 13, 14); c.drawImage(fz11Leke(2), 6, -12, 13, 14); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;   // kanatlarda ışık geçişi
  c.globalAlpha = 0.55; c.drawImage(fz11Leke(0), -5, -9, 10, 7); c.globalAlpha = 1;   // yakanın altında gölge
  c.fillStyle = 'rgba(255,255,255,0.15)'; c.beginPath(); c.ellipse(-5, -3, 6, 3.2, -0.25, 0, 6.2832); c.fill();
  c.strokeStyle = C.kat; c.lineWidth = 0.4; c.beginPath();
  for (let sd = -1; sd <= 1; sd += 2) { c.moveTo(0, 0); fz11IkonYol(c, ac, sd); c.moveTo(0, 0); for (let i = 1; i < 4; i++) { c.moveTo(sd * 1.5, -6.5); c.quadraticCurveTo(lerp(sd * 1.5, K[i * 2], 0.5) - sd * 0.8, lerp(-6.5, K[i * 2 + 1], 0.5), K[i * 2], K[i * 2 + 1] - 0.6); } }
  c.stroke();
  if (C.tur === 3) { c.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 3 + (i * 5) % 10; const px = Math.cos(a) * r * 1.2, py = 1 + Math.sin(a) * r * 0.6; if (i % 2) { c.beginPath(); c.arc(px, py, 0.45, 0, 6.2832); c.fill(); } else fz11Motif(c, px, py, 1.2, 3, 0); } }
  else { c.fillStyle = C.m; const M6 = [[-8, -3.5], [8, -3.5], [-3.5, 0.5], [3.5, 0.5], [-9.5, 2.5], [9.5, 2.5], [0, 5.5], [-5, 6.5], [5, 6.5], [0, -3]]; for (let i = 0; i < M6.length; i++) fz11Motif(c, M6[i][0] * (0.85 + 0.15 * ac), M6[i][1], 1.25 * C.mr, C.tur, i * 0.8); }
  c.restore();
  c.beginPath(); fz11IkonYol(c, ac, -1); c.lineTo(0, -7.6); c.closePath(); fz11IkonYol(c, ac, 1); c.lineTo(0, -7.6); c.closePath();
  c.save(); c.clip(); fz11Rim(c, () => { c.beginPath(); fz11IkonYol(c, ac, -1); c.lineTo(0, -7.6); c.closePath(); fz11IkonYol(c, ac, 1); c.lineTo(0, -7.6); c.closePath(); }, 0.6, 0.9, '#dcecff'); c.restore();
  c.strokeStyle = C.a; c.lineWidth = 0.9; c.beginPath();   // kanat üst kenarında kıvrılan astar
  for (let sd = -1; sd <= 1; sd += 2) { c.moveTo(sd * 3.2, -7.2); c.quadraticCurveTo(sd * lerp(8, 9.5, ac), lerp(-6.3, -9.6, ac), sd * lerp(13.2, 16.4, ac), lerp(-4.3, -10.2, ac)); }
  c.stroke();
  c.beginPath(); fz11IkonYol(c, ac, -1); fz11IkonYol(c, ac, 1); c.strokeStyle = C.dC; c.lineWidth = 0.6; c.stroke();
  // dik yaka + toka
  c.beginPath(); c.moveTo(-3.6, -7.6); c.quadraticCurveTo(-5.4, -9.4, -5.6, -12.0); c.quadraticCurveTo(-2.8, -10.8, 0, -11.2); c.quadraticCurveTo(2.8, -10.8, 5.6, -12.0); c.quadraticCurveTo(5.4, -9.4, 3.6, -7.6); c.quadraticCurveTo(0, -6.6, -3.6, -7.6); c.closePath();
  c.fillStyle = C.a; c.fill(); c.strokeStyle = C.dC; c.lineWidth = 0.5; c.stroke();
  fz11Toka(c, 0, -7.4, 1.6, C);
  c.restore();
}
// Ay Balosu sürerken oyunda vals (drawFeza): yerde, dururken, final saati ilerlerken
const FZ11_DO = { isik: 0, olcu: 1.7308, nabiz: 0 }, FZ11_VALS0 = 9;
function fz11BaloAn() {
  if (typeof BOLUM_NO === 'undefined' || BOLUM_NO !== 11 || typeof V11 === 'undefined' || !V11 || !V11.final || DURUM !== 'oyun' || P.ucus) return -1;
  let a = NaN; if (typeof baloFinalAn === 'function') { try { a = +baloFinalAn(); } catch (e) { a = NaN; } }
  return Number.isFinite(a) && a >= FZ11_VALS0 && a < 30.5 && P.ground && Math.abs(P.vx) < 20 ? a : -1;   // 9. sn vals başlar; 30,5'ten sonra hep birlikte poz (el sallama)
}
// Ay Balosu (V11.final, oyun sürerken): 0–9 sn Ay'a hayranlık ve kollar havada (Bölüm 6–9 final düzeni), 9–30,5 sn vals ('dans11',
// drawFeza), dorukta (27,7 sn) balo11'in zıplatmalarında havada kollar havada, 30,5 sn'den sonra kollar havada / el sallama.
function fzBalo11() { return BOLUM_NO === 11 && typeof V11 !== 'undefined' && !!V11 && !!V11.final && typeof DURUM !== 'undefined' && DURUM === 'oyun'; }
let fz11BaloO;   // undefined: aranmadı
const FZ11_BL = { age: 0, x: 0, y: 0, doruk: false }, FZ11_FN = { t0: -1, dorukT: -99 };
function fz11Balo() {
  if (fz11BaloO === undefined) fz11BaloO = typeof NESNELER !== 'undefined' ? NESNELER.find(o => o.tip === 'ayBalosu') || null : null;
  const o = fz11BaloO; let a = NaN;
  if (typeof baloFinalAn === 'function') { try { a = +baloFinalAn(); } catch (e) { a = NaN; } }
  if (!(a > 0) && FZ11_FN.t0 >= 0) a = P.a_t - FZ11_FN.t0;
  if (!Number.isFinite(a)) return null;
  FZ11_BL.age = a; FZ11_BL.x = o && Number.isFinite(o.x) ? o.x : P.x; FZ11_BL.y = o && Number.isFinite(o.y) ? o.y : P.y;
  FZ11_BL.doruk = o && o.doruk != null ? !!o.doruk && a < 31.3 : (a >= 27.6 && a < 31.3) || (P.a_t - FZ11_FN.dorukT < 3.6);
  return FZ11_BL;
}
if (typeof OLAY !== 'undefined') {
  OLAY.on('baloFinal', () => { if (BOLUM_NO === 11 && P.a_pose) FZ11_FN.t0 = P.a_t; });
  OLAY.on('baloDoruk', () => { if (BOLUM_NO === 11 && P.a_pose) FZ11_FN.dorukT = P.a_t; });
}
