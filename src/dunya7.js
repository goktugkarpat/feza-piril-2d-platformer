/* dunya7.js — Kuzey Işıkları: mavi-mor kış gecesi gökyüzü, yıldızlar ve ay, sönük (fenerler yandıkça canlanan) kuzey ışığı
   perdeleri, puslu uzak karlı dağlar, katmanlı karlı çam ormanı, sıcak ışıklı uzak kulübe (bacadan duman), yumuşak kar zemini
   (mavi gölgeli, ışıkta parıldayan kristaller), buzlu göl (yansıma, çatlaklar, parıltı), karda ayak izleri, nefes buharı ve
   HİÇ DURMAYAN katmanlı kar yağışı. Finalde dev kuzey ışıkları ve renklenen kar taneleri; sonra pembe-altın sabah.
   Mimari dunya6.js ile aynı: büyük resimler yalnız önbellek tuvallerinde bir kez boyanır (gök, dağ ve orman şeritleri,
   zemin parçaları, sprite'lar); karede yeni gradyan/filtre/gölge yok. Kuzey ışıkları her karede küçük bir ara tuvale
   (384×240) dilim dilim çizilir ve tek seferde büyütülerek göğe eklenir (yumuşak ve ucuz).
   oyun.js kancaları (omDr 'dn7' öneki): dn7Background dn7Motes dn7World dn7Petals dn7Foreground dn7Vignette, ısıtma dn7Isit.
   Diğer modüllere: dn7Iz(x, y, tip) karda iz, dn7Nefes(x, y, yon, s) nefes buharı, DN7_AUR (fener / kuzey ışığı renkleri). */
'use strict';
const DN7={sky:null,dawn:null,vig:null,mtn:[],orman:[],chunks:new Map(),prep:0,fx:{},aurBuf:null,aurC:null,
 lit:[],perde:[],renk:0,sabah:0,fin:0,finT:null,dorukT:null,tamT:null,isiklar:[],nIsik:0,dokulme:[],dokT:0,
 nefesT:0,pirNefesT:1.3,kulubeler:[],camlar:null,uzakKar:0,kare:0,zeminKare:-9,kayCi:0,gokAlt:0,aurKare:-9,durumT:null,guc:0,manz:null};
const dn7Hash=v=>{const s=Math.sin(v*127.1+311.7)*43758.5453;return s-Math.floor(s);};   // sabit sözde rastgele (0..1)
// Kuzey ışığı / fener renkleri (geyik.js GY_KUZEY ile aynı sıra: i. fener ↔ i. boynuz kristali ↔ i. gök şeridi)
const DN7_AUR=(typeof GY_KUZEY!=='undefined'&&GY_KUZEY.length>=10)?GY_KUZEY.slice(0,10):['#7dffc4','#ff8fd0','#8fd8ff','#c39bff','#a6ffde','#ffa6c9','#6fe8ff','#e0a8ff','#b8ff9e','#9fb8ff'];
// perdenin üst ucunun rengi (gerçek kuzey ışığı: yeşilin üstü mor-pembe)
const DN7_AUR_UST=['#b48cff','#c79bff','#b9a4ff','#ff9fd8','#9fb4ff','#d8a0ff','#a890ff','#ffb0e0','#8fe8ff','#e0a0ff'];
const DN7_BUZ=['#dff0ff','#c8e4ff','#e8dcff','#d0fff0'];
const DN7_GAP0=339*T,DN7_GAP1=470*T;   // kızak yolculuğu boşluğu (dunya7 yalnız inen karlı tepeleri çizer; katı değil)
const dn7Cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const dn7Mix=(a,b,t)=>{const A=hex(a),B=hex(b);return '#'+[0,1,2].map(i=>Math.round(lerp(A[i],B[i],t)).toString(16).padStart(2,'0')).join('');};
const dn7Rgb=h=>{const a=hex(h);return a[0]+','+a[1]+','+a[2];};
function dn7Ready(){return W>0&&H>0&&S>0&&typeof cam!=='undefined'&&Number.isFinite(cam.x)&&Number.isFinite(cam.y);}
function dn7Glow(col,x,y,rx,ry,a){if(a<=.003)return;g.globalAlpha=a>1?1:a;g.drawImage(glow(col),x-rx,y-ry,rx*2,ry*2);g.globalAlpha=1;}
function dn7KizakY(x){const K=typeof BOLUM!=='undefined'&&BOLUM.kizak;if(K&&typeof K.zemin==='function')return K.zemin(x);return lerp(13*T,18*T,clamp((x-DN7_GAP0)/(DN7_GAP1-DN7_GAP0),0,1));}
// zemin yüzeyi (dünya y'si): boşlukta kızak tepelerinin yumuşak profili
function dn7Surface(x){if(x>=DN7_GAP0&&x<DN7_GAP1)return dn7KizakY(x);const c=Math.max(0,Math.min(COLS-1,Math.floor(x/T)));return topOf(c)*T;}
const dn7Buz=()=>typeof BOLUM!=='undefined'&&BOLUM.buz?BOLUM.buz:{x0:207*T,x1:281*T,y:800};
const dn7V7=()=>typeof V7!=='undefined'&&V7?V7:null;
// rüzgâr: kar tanelerinin yatay kayması (zamanın kapalı biçimli işlevi; hız hep biraz sağa, ara sıra hafif esinti)
// + yaklaşık 26 sn'de bir yumuşak rüzgâr hamlesi: hız payı 4·(1-cos ωt)² (tepe +16), integrali kapalı biçimde
const DN7_HW=6.2832/26,dn7Hamle=tm=>{const v=(1-Math.cos(tm*DN7_HW))*.5;return v*v;};   // 0..1 (hamlenin gücü)
const dn7Ruzgar=tm=>tm*10+26*Math.sin(tm*.21)+12*Math.sin(tm*.53+1.3)+4*(1.5*tm-2*Math.sin(tm*DN7_HW)/DN7_HW+.25*Math.sin(2*tm*DN7_HW)/DN7_HW);
const dn7RuzgarHiz=tm=>10+5.46*Math.cos(tm*.21)+6.36*Math.cos(tm*.53+1.3)+16*dn7Hamle(tm);
// kar yoğunluğu yavaşça nefes alır: sakinde seyrek, hamlede yoğun (0..1; tanenin 'yo' eşiğiyle karşılaştırılır)
const dn7Yogun=tm=>.74+.22*dn7Hamle(tm)+.07*Math.sin(tm*.071+.8);

// ════════ Işık durumu: fenerler → yeni kuzey ışığı şeritleri; final → dev kuzey ışıkları; tamam → sabah ════════
function dn7FenerRenk(e,n){
 if(e&&typeof e.renk==='string'&&e.renk[0]==='#'){const i=DN7_AUR.indexOf(e.renk);if(i>=0)return i;}
 if(e&&e.o&&Number.isFinite(e.o.renk))return ((e.o.renk|0)%10+10)%10;
 if(e&&Number.isFinite(e.renk))return ((e.renk|0)%10+10)%10;
 return (((n||1)-1)%10+10)%10;
}
function dn7PerdeEkle(ci,x){
 // yanan fenerin renginde yeni bir perde: rastgele ama sabit (fener sırasına göre) biçim, 3 sn'de belirir
 const k=DN7.perde.length,h=a=>dn7Hash(k*7.31+a);
 DN7.perde.push({ci,t0:now,x0:-.05+h(1)*.5,x1:0,y:.34+h(2)*.24,hg:.3+h(3)*.22,amp:.07+h(4)*.06,k1:2.5+h(5)*3,k2:6+h(6)*5,sp:.14+h(7)*.16,ph:h(8)*6.283,a:.3+h(9)*.14,par:.4+h(10)*.6,n:34});
 const P0=DN7.perde[DN7.perde.length-1];P0.x1=Math.min(1.02,P0.x0+.4+h(11)*.45);
 if(Number.isFinite(x))DN7.lit.push({x,y:dn7Surface(x)-40,t:now,ci});
}
OLAY.on('karFener',e=>{
 const o=e&&e.o,x=o&&Number.isFinite(o.x)?o.x:e&&Number.isFinite(e.x)?e.x:P.x,y=o&&Number.isFinite(o.y)?o.y:e&&Number.isFinite(e.y)?e.y:dn7Surface(x);
 const ci=dn7FenerRenk(e,e&&e.n);dn7PerdeEkle(ci,x);const L=DN7.lit[DN7.lit.length-1];if(L)L.y=y-34;
});
OLAY.on('kuzeyFinal',()=>{if(DN7.finT===null)DN7.finT=now;});
OLAY.on('kuzeyDoruk',()=>{DN7.dorukT=now;});
OLAY.on('kuzeyTamam',()=>{if(DN7.tamT===null)DN7.tamT=now;});
function dn7Durum(){
 // 60 Hz'deki eski geçiş süresi korunur; 120 Hz'de hızlanmaz, aynı zamanda tekrar çizilince ilerlemez.
 const adim=DN7.durumT===null?0:clamp((now-DN7.durumT)*60,0,15);DN7.durumT=now;
 const v=dn7V7(),top=v&&v.fenerTop?v.fenerTop:10,f=v?clamp((v.fener||0)/top,0,1):0;
 // fener olayı kaçtıysa (ör. test ya da kayıttan devam) perde sayısını yetiştir
 if(v&&(v.fener||0)>DN7.perde.length&&DN7.perde.length<10)dn7PerdeEkle(DN7.perde.length%10,NaN);
 if(v&&v.final&&DN7.finT===null)DN7.finT=now;
 DN7.fin=DN7.finT===null?0:smooth(clamp((now-DN7.finT)/4,0,1));
 const hedef=Math.max(smooth(f)*.85,DN7.fin);DN7.renk+=(hedef-DN7.renk)*(1-Math.pow(.97,adim));if(adim>0&&Math.abs(hedef-DN7.renk)<.002)DN7.renk=hedef;
 // sabah: 'kuzeyTamam' ile (yoksa finalden 26 sn sonra) pembe-altın gün doğumu
 let sb=0;if(DN7.tamT!==null)sb=smooth(clamp((now-DN7.tamT)/7,0,1));if(DN7.finT!==null)sb=Math.max(sb,smooth(clamp((now-DN7.finT-26)/10,0,1)));
 DN7.sabah=sb;
 // yol boyunca kuzey ışıkları güçlenir: konum (0..1) ya da yanan fener oranından büyük olanı
 DN7.guc=Math.max(clamp(P.x/(COLS*T),0,1),DN7.renk);
}
// yerel ışık 0..1: yanan her fenerden saniyede 420 birim yayılan, 900 birimde duran yumuşak dalga (sütun başına karede bir kez)
const DN7_ISIK_C=new Float32Array(1024),DN7_ISIK_T=new Float64Array(1024).fill(-1);
function dn7Isik(x){
 const c=Math.max(0,Math.min(1023,Math.floor(x/T)));if(DN7_ISIK_T[c]===now)return DN7_ISIK_C[c];DN7_ISIK_T[c]=now;
 let a=DN7.renk*.25;const xx=c*T+T/2;
 for(let i=0;i<DN7.lit.length;i++){const L=DN7.lit[i],age=now-L.t;if(age<0)continue;const reach=Math.min(age*420,900),v=clamp((reach-Math.abs(xx-L.x))/300,0,1);if(v>a)a=v;}
 if(DN7.fin>a)a=DN7.fin;return DN7_ISIK_C[c]=a;
}

// ════════ Önbellek sprite'ları ════════
function dn7FxArt(){
 const F=DN7.fx;if(F.hazir)return F;
 // kar tanesi: yumuşak beyaz disk (çekirdek parlak, kenar yumuşak); final için kuzey ışığı renginde sürümleri
 const tane=col=>{const cv=dn7Cv(32,32),c=cv.getContext('2d'),gr=c.createRadialGradient(16,16,0,16,16,16),r=dn7Rgb(col);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.28,'rgba('+r+',.9)');gr.addColorStop(.6,'rgba('+r+',.28)');gr.addColorStop(1,'rgba('+r+',0)');c.fillStyle=gr;c.fillRect(0,0,32,32);return cv;};
 F.tane=tane('#eef3ff');F.taneR=DN7_AUR.map(col=>tane(dn7Mix(col,'#ffffff',.25)));
 // en öndeki bulanık iri taneler (bokeh): gölge bulanıklığı yalnız burada, bir kez
 F.bokeh=['#f4f7ff','#e6e0ff'].map(col=>{const cv=dn7Cv(96,96),c=cv.getContext('2d');c.shadowColor=col;c.shadowBlur=14;c.shadowOffsetX=300;c.fillStyle=col;c.globalAlpha=.75;
  c.beginPath();c.arc(48-300,48,26,0,6.283);c.fill();c.globalAlpha=1;c.shadowBlur=0;c.shadowOffsetX=0;c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=2;c.beginPath();c.arc(48,48,27,0,6.283);c.stroke();return cv;});
 // ayak izleri: [feza, yavru (pati), geyik (toynak), top (yuvarlanan kar topunun izi), kızak, kayma çizgisi]
 const izCv=(w,h,fn)=>{const cv=dn7Cv(w,h),c=cv.getContext('2d');fn(c);return cv;};
 const cukur=(c,x,y,rx,ry)=>{c.fillStyle='rgba(84,96,178,.55)';c.beginPath();c.ellipse(x,y,rx,ry,0,0,6.283);c.fill();c.fillStyle='rgba(120,134,214,.5)';c.beginPath();c.ellipse(x,y+ry*.25,rx*.8,ry*.6,0,0,6.283);c.fill();
  c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=1.2;c.beginPath();c.ellipse(x,y+.5,rx+.5,ry+.6,0,.15,2.99);c.stroke();};
 F.iz={feza:izCv(28,12,c=>cukur(c,14,6,8,3.4)),
  inis:izCv(40,14,c=>{cukur(c,12,7,8,3.6);cukur(c,28,7,8,3.6);}),
  yavru:izCv(20,10,c=>{for(const [x,y] of [[6,5],[10,3.6],[14,5],[10,6.6]])cukur(c,x,y,2.2,1.4);}),
  geyik:izCv(24,10,c=>{cukur(c,8,5,3.2,2.2);cukur(c,15,5,3.2,2.2);}),
  top:izCv(48,14,c=>{c.fillStyle='rgba(90,104,186,.42)';c.beginPath();c.ellipse(24,7,23,4.6,0,0,6.283);c.fill();c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=1.4;c.beginPath();c.moveTo(2,9.5);c.quadraticCurveTo(24,13,46,9.5);c.stroke();}),
  kizak:izCv(48,10,c=>{c.strokeStyle='rgba(84,96,178,.6)';c.lineWidth=2;c.beginPath();c.moveTo(0,3);c.lineTo(48,3);c.moveTo(0,7);c.lineTo(48,7);c.stroke();}),
  kay:izCv(48,6,c=>{const gr=c.createLinearGradient(0,0,48,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,.65)');gr.addColorStop(1,'rgba(255,255,255,0)');c.strokeStyle=gr;c.lineWidth=1.4;c.beginPath();c.moveTo(0,2);c.lineTo(48,3);c.moveTo(4,4.5);c.lineTo(44,4);c.stroke();})};
 // nefes buharı / baca dumanı / kar tozu: yumuşak düz profilli bulutçuk
 const puf=(col,a)=>{const cv=dn7Cv(64,64),c=cv.getContext('2d'),gr=c.createRadialGradient(32,32,0,32,32,32),r=dn7Rgb(col);gr.addColorStop(0,'rgba('+r+','+a+')');gr.addColorStop(.5,'rgba('+r+','+(a*.5)+')');gr.addColorStop(1,'rgba('+r+',0)');c.fillStyle=gr;c.fillRect(0,0,64,64);return cv;};
 F.buhar=puf('#f4f8ff',.75);F.duman=puf('#c8c6ea',.6);F.dumanS=puf('#ffd6c8',.6);
 // parıltı: dört köşeli küçük yıldız (kar kristali ışıltısı)
 F.parilti=(()=>{const cv=dn7Cv(32,32),c=cv.getContext('2d');let gr=c.createRadialGradient(16,16,0,16,16,9);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(220,235,255,0)');c.fillStyle=gr;c.fillRect(0,0,32,32);
  c.fillStyle='rgba(255,255,255,.95)';c.beginPath();c.moveTo(16,0);c.quadraticCurveTo(17,15,32,16);c.quadraticCurveTo(17,17,16,32);c.quadraticCurveTo(15,17,0,16);c.quadraticCurveTo(15,15,16,0);c.fill();return cv;})();
 // kar katmanı bandı (zemin yüzeyinin altında beyazdan maviye)
 F.bant=(()=>{const cv=dn7Cv(8,120),c=cv.getContext('2d'),gr=c.createLinearGradient(0,0,0,120);gr.addColorStop(0,'rgba(196,208,250,.9)');gr.addColorStop(.25,'rgba(150,164,232,.6)');gr.addColorStop(.6,'rgba(120,132,214,.3)');gr.addColorStop(1,'rgba(100,110,200,0)');c.fillStyle=gr;c.fillRect(0,0,8,120);return cv;})();
 // pus: alttan yukarı sönen sis bandı (dağ ve orman katmanları arasında)
 F.pus=['#6d6fb8','#8a86c8','#f0b8c8'].map(col=>{const cv=dn7Cv(8,128),c=cv.getContext('2d'),gr=c.createLinearGradient(0,0,0,128),r=dn7Rgb(col);gr.addColorStop(0,'rgba('+r+',0)');gr.addColorStop(.55,'rgba('+r+',.55)');gr.addColorStop(1,'rgba('+r+',.85)');c.fillStyle=gr;c.fillRect(0,0,8,128);return cv;});
 // ay: hâle + disk + yumuşak lekeler
 F.ay=(()=>{const cv=dn7Cv(192,192),c=cv.getContext('2d');let gr=c.createRadialGradient(96,96,10,96,96,96);gr.addColorStop(0,'rgba(236,240,255,.5)');gr.addColorStop(.3,'rgba(200,210,255,.16)');gr.addColorStop(1,'rgba(200,210,255,0)');c.fillStyle=gr;c.fillRect(0,0,192,192);
  gr=c.createRadialGradient(90,90,2,96,96,22);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,'#e4e8fa');c.fillStyle=gr;c.beginPath();c.arc(96,96,22,0,6.283);c.fill();
  c.fillStyle='rgba(170,178,220,.35)';for(const [x,y,r] of [[88,90,5],[103,99,4],[95,106,3],[104,86,2.5]]){c.beginPath();c.arc(x,y,r,0,6.283);c.fill();}return cv;})();
 // kuzey ışığı sütunu (renk başına + sönük gri-mavi): aşağıdan yukarı yeşil → turkuaz → pembe/mor, alt kenar parlak ve yumuşak,
 // yanları yumuşak sönümlü. Komşu dilimler üst üste biner (×3) → sürekli, keskin kenarsız kurdele.
 const sutun=(alt,ust,orta)=>{const cv=dn7Cv(48,160),c=cv.getContext('2d'),A=dn7Rgb(alt),U=dn7Rgb(ust),O=dn7Rgb(orta);
  let gr=c.createLinearGradient(0,0,0,160);gr.addColorStop(0,'rgba('+U+',0)');gr.addColorStop(.3,'rgba('+U+',.4)');gr.addColorStop(.55,'rgba('+O+',.55)');
  gr.addColorStop(.8,'rgba('+A+',.95)');gr.addColorStop(.87,'rgba('+A+',1)');gr.addColorStop(.93,'rgba('+A+',.45)');gr.addColorStop(1,'rgba('+A+',0)');c.fillStyle=gr;c.fillRect(0,0,48,160);
  c.globalCompositeOperation='destination-in';gr=c.createLinearGradient(0,0,48,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.28,'rgba(0,0,0,.45)');gr.addColorStop(.5,'rgba(0,0,0,1)');gr.addColorStop(.72,'rgba(0,0,0,.45)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(0,0,48,160);return cv;};
 // yanan perdeler doygun: fener renkleri pastel (toplamalı karışımda lilaya/beyaza kaçar) → rengi griden uzaklaştır; alt kenar parlak
 // yeşile, üst pembe-mora çekilir (gerçek kuzey ışığı), fenerin kendi rengi ortada kalır
 const doy=(h,k)=>{const a=hex(h),m=(a[0]+a[1]+a[2])/3;return '#'+a.map(v=>Math.round(clamp(m+(v-m)*k,0,255)).toString(16).padStart(2,'0')).join('');};
 F.perde=DN7_AUR.map((col,ci)=>sutun(doy(dn7Mix(col,'#2cff7a',.62),1.8),doy(DN7_AUR_UST[ci],1.9),doy(dn7Mix(col,'#c070ff',.2),1.7)));
 F.perdeSonuk=sutun('#8ea4cc','#8a86c0','#8a9cc8');F.perdeP=sutun('#ff5cc0','#9a6cff','#ff86d6');
 // buz kristali kümesi (karın içinden çıkan, ışık gelince içten parlayan): 3 çeşit
 F.kristal=[0,1,2].map(v=>{const cv=dn7Cv(64,72),c=cv.getContext('2d'),R=rng(71+v*13);c.translate(32,70);
  const n=3+v;for(let k=0;k<n;k++){const an=(k-(n-1)/2)*.32+(R()-.5)*.15,L=22+R()*30,w=4+R()*3;c.save();c.rotate(an);
   const gr=c.createLinearGradient(-w,0,w,0);gr.addColorStop(0,'rgba(200,226,255,.95)');gr.addColorStop(.5,'rgba(236,246,255,.95)');gr.addColorStop(1,'rgba(150,170,236,.95)');c.fillStyle=gr;
   c.beginPath();c.moveTo(-w,0);c.lineTo(-w,-L);c.lineTo(0,-L-w*1.6);c.lineTo(w,-L);c.lineTo(w,0);c.closePath();c.fill();c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=.8;c.beginPath();c.moveTo(-w*.4,-2);c.lineTo(-w*.4,-L);c.stroke();c.restore();}
  c.fillStyle='#eef3ff';c.beginPath();c.ellipse(0,-1,18,5,0,0,6.283);c.fill();return cv;});
 // kulübe (uzak orman katmanında): kütük duvar, kalın karlı çatı, baca, iki sıcak pencere, kapı feneri, çit
 F.kulube=(()=>{const cv=dn7Cv(240,190),c=cv.getContext('2d');c.translate(120,180);
  c.fillStyle='#e8eeff';c.beginPath();c.ellipse(0,0,118,12,0,0,6.283);c.fill();
  c.fillStyle='#4a3a5e';c.fillRect(-62,-70,124,70);c.strokeStyle='rgba(30,20,50,.45)';c.lineWidth=1.5;for(let y=-64;y<0;y+=9){c.beginPath();c.moveTo(-62,y);c.lineTo(62,y);c.stroke();}
  c.fillStyle='#5c4a70';for(let y=-66;y<0;y+=9){c.beginPath();c.arc(-62,y+4,4.4,0,6.283);c.arc(62,y+4,4.4,0,6.283);c.fill();}
  c.fillStyle='#3a2c4c';c.fillRect(30,-128,16,40);c.fillStyle='#f2f6ff';c.beginPath();c.ellipse(38,-129,11,5,0,0,6.283);c.fill();
  c.fillStyle='#3e3054';c.beginPath();c.moveTo(-82,-66);c.lineTo(0,-118);c.lineTo(82,-66);c.closePath();c.fill();
  c.fillStyle='#f4f7ff';c.beginPath();c.moveTo(-90,-62);c.quadraticCurveTo(-60,-84,0,-126);c.quadraticCurveTo(60,-84,90,-62);c.quadraticCurveTo(88,-54,76,-58);c.quadraticCurveTo(60,-54,46,-60);c.quadraticCurveTo(20,-55,0,-60);c.quadraticCurveTo(-24,-54,-46,-60);c.quadraticCurveTo(-66,-53,-90,-62);c.fill();
  c.fillStyle='rgba(150,166,230,.55)';c.beginPath();c.moveTo(-80,-60);c.quadraticCurveTo(0,-52,80,-60);c.quadraticCurveTo(0,-56,-80,-60);c.fill();
  for(let k=0;k<9;k++){const x=-74+k*18,L=5+(k*7%5)*2;c.fillStyle='rgba(220,236,255,.85)';c.beginPath();c.moveTo(x-2,-59);c.lineTo(x,-59+L);c.lineTo(x+2,-59);c.fill();}
  for(const wx of [-34,30]){c.fillStyle='#ffcf7a';c.fillRect(wx-11,-50,22,20);c.fillStyle='#ffe6a8';c.fillRect(wx-9,-48,8,8);c.strokeStyle='#3a2c4c';c.lineWidth=2.4;c.strokeRect(wx-11,-50,22,20);c.beginPath();c.moveTo(wx,-50);c.lineTo(wx,-30);c.moveTo(wx-11,-40);c.lineTo(wx+11,-40);c.stroke();c.fillStyle='#f4f7ff';c.fillRect(wx-13,-31,26,4);}
  c.fillStyle='#2e2240';c.fillRect(-8,-36,16,36);c.fillStyle='#ffd27a';c.beginPath();c.arc(14,-30,3,0,6.283);c.fill();
  c.strokeStyle='#4a3a5e';c.lineWidth=2.4;for(let x=-112;x<=-74;x+=12){c.beginPath();c.moveTo(x,0);c.lineTo(x,-20);c.stroke();}for(let x=76;x<=112;x+=12){c.beginPath();c.moveTo(x,0);c.lineTo(x,-20);c.stroke();}
  c.beginPath();c.moveTo(-114,-13);c.lineTo(-72,-13);c.moveTo(74,-13);c.lineTo(114,-13);c.stroke();c.fillStyle='#f4f7ff';for(let x=-112;x<=112;x+=12)if(Math.abs(x)>70){c.beginPath();c.ellipse(x,-21,3.4,2,0,0,6.283);c.fill();}
  return cv;})();
 // vinyet: soğuk mavi-mor köşeler
 F.vig=(()=>{const cv=dn7Cv(200,160),v=cv.getContext('2d'),vg=v.createRadialGradient(100,74,48,100,74,126);vg.addColorStop(0,'rgba(14,16,52,0)');vg.addColorStop(.45,'rgba(14,16,52,0)');vg.addColorStop(.6,'rgba(14,16,52,.03)');vg.addColorStop(1,'rgba(14,16,52,.36)');v.fillStyle=vg;v.fillRect(0,0,200,160);return cv;})();
 // sabah: pembe-altın parıltı (aynı yıldız, sıcak renk)
 F.pariltiA=(()=>{const cv=dn7Cv(32,32),c=cv.getContext('2d');c.drawImage(F.parilti,0,0);c.globalCompositeOperation='source-atop';c.fillStyle='rgba(255,214,170,.7)';c.fillRect(0,0,32,32);return cv;})();
 // kuzey ışığı renk kayması: yatayda döngüsel pembe → yeşil → turkuaz → mor şerit (perdelerin üstüne 'source-atop' ile, yavaş kayar)
 F.aurTint=(()=>{const cv=dn7Cv(512,4),c=cv.getContext('2d'),gr=c.createLinearGradient(0,0,512,0);
  ['#ff9fd8','#7dffc4','#8fd8ff','#c39bff','#ff9fd8'].forEach((col,k)=>gr.addColorStop(k/4,col));c.fillStyle=gr;c.fillRect(0,0,512,4);return cv;})();
 DN7.aurBuf=dn7Cv(384,240);DN7.aurC=DN7.aurBuf.getContext('2d');
 F.hazir=true;return F;
}

// ════════ Gök: gece (mavi-mor, yıldızlar, samanyolu) ve sabah (pembe-altın) ════════
function dn7Sky(){
 if(DN7.sky)return;const R=rng(7071);
 let cv=DN7.sky=dn7Cv(768,600),c=cv.getContext('2d'),gr=c.createLinearGradient(0,0,0,600);
 gr.addColorStop(0,'#0a0f30');gr.addColorStop(.25,'#141d54');gr.addColorStop(.5,'#262c72');gr.addColorStop(.7,'#433f8c');gr.addColorStop(.86,'#6a5ea8');gr.addColorStop(1,'#8e80c0');c.fillStyle=gr;c.fillRect(0,0,768,600);
 // samanyolu: çapraz soluk bant, içinde yoğun minik yıldızlar
 c.save();c.translate(384,170);c.rotate(-.32);
 for(let j=0;j<40;j++){const x=(R()-.5)*900,y=(R()-.5)*60,r=40+R()*80,h=c.createRadialGradient(x,y,1,x,y,r);h.addColorStop(0,'rgba(190,180,255,.07)');h.addColorStop(1,'rgba(190,180,255,0)');c.fillStyle=h;c.fillRect(x-r,y-r,r*2,r*2);}
 for(let j=0;j<900;j++){const x=(R()-.5)*900,y=(R()+R()+R()-1.5)*50;c.fillStyle='rgba(235,236,255,'+(.15+R()*.4)+')';c.fillRect(x,y,.8+R()*.6,.8+R()*.6);}
 c.restore();
 for(let j=0;j<7000;j++){c.fillStyle=j%2?'rgba(230,236,255,.018)':'rgba(10,12,40,.02)';c.fillRect(R()*768,R()*600,.8+R(),.6+R());}
 for(let j=0;j<240;j++){const x=R()*768,y=R()*R()*420,s=.3+R()*.8;c.fillStyle='rgba(240,244,255,'+(.2+R()*.55)+')';c.beginPath();c.arc(x,y,s,0,6.283);c.fill();}
 // sabah: lavanta tepe, pembe orta, altın ufuk
 cv=DN7.dawn=dn7Cv(768,600);c=cv.getContext('2d');gr=c.createLinearGradient(0,0,0,600);
 gr.addColorStop(0,'#5d6dc4');gr.addColorStop(.32,'#a796d8');gr.addColorStop(.58,'#f2aac6');gr.addColorStop(.8,'#ffcfa6');gr.addColorStop(1,'#fff0cf');c.fillStyle=gr;c.fillRect(0,0,768,600);
 const s=c.createRadialGradient(470,540,10,470,540,400);s.addColorStop(0,'rgba(255,246,214,.8)');s.addColorStop(.3,'rgba(255,214,170,.32)');s.addColorStop(1,'rgba(255,214,170,0)');c.fillStyle=s;c.fillRect(0,0,768,600);
 for(let j=0;j<20;j++){const y=150+R()*300,x=R()*768,w=90+R()*220,hh=4+R()*9;c.fillStyle=j%2?'rgba(255,255,255,.15)':'rgba(255,210,230,.14)';c.beginPath();c.ellipse(x,y,w,hh,-.02,0,6.283);c.fill();}
}
const dn7SR=rng(7717),DN7_STARS=Array.from({length:46},()=>({x:dn7SR(),y:dn7SR()*dn7SR()*.55,r:.5+dn7SR()*1.2,ph:dn7SR()*6.283,sp:.5+dn7SR()*1.6}));

// ════════ Uzak karlı dağlar (3 katman × gece/sabah), yan yana döşenebilir şeritler ════════
// ── Büyük şeritlerin karo karo kırpılması: her 256 px'lik dilimin üstündeki tamamen saydam kısım hiç çizilmez (boşa boyama yok) ──
const DN7_EXT=24,DN7_KW=256;
function dn7Kirp(cv){
 const w=cv.width,h=cv.height,n=Math.ceil(w/DN7_KW),ust=new Int16Array(n).fill(h);
 try{const d=cv.getContext('2d').getImageData(0,0,w,h).data;
  for(let k=0;k<n;k++){const xa=k*DN7_KW,xb=Math.min(w,xa+DN7_KW);let y=0;
   satir:for(;y<h;y++){const o=y*w*4;for(let x=xa;x<xb;x+=2)if(d[o+x*4+3]>2)break satir;}
   ust[k]=Math.max(0,y-2);}}catch(e){ust.fill(0);}
 cv.ust=ust;return cv;
}
// şeridi (x, y) köşesine, ekranda yAlt'a kadar karo karo çiz; karo sınırları cihaz pikseline oturur (dikiş çizgisi yok)
function dn7Serit(img,x,y,vw,yAlt){
 const ust=img.ust,n=ust.length,h=img.height;let k0=Math.max(0,Math.floor(-x/DN7_KW)),k1=Math.min(n-1,Math.floor((vw-x)/DN7_KW));
 const alt=Math.min(h,yAlt-y);if(alt<=0)return;
 for(let k=k0;k<=k1;k++){const u=ust[k];if(u>=alt)continue;const sx=k*DN7_KW,sw=Math.min(DN7_KW,img.width-sx),
  dx0=Math.round((x+sx)*S)/S,dx1=Math.round((x+sx+sw)*S)/S;g.drawImage(img,sx,u,sw,alt-u,dx0,y+u,dx1-dx0,alt-u);}
}
const DN7_MW=2048,DN7_MH=380,DN7_MF=[.03,.06,.1],DN7_MY=[.03,.05,.08],DN7_MB=[452,488,520];
function dn7Dag(layer,sabah){
 const key=layer*2+(sabah?1:0);if(DN7.mtn[key])return DN7.mtn[key];
 const cv=dn7Cv(DN7_MW,DN7_MH+DN7_EXT),c=cv.getContext('2d'),R=rng(5101+layer*37),base=DN7_MH;
 // tepeler: periyodik (kenarlar birleşir); uzak katman yüksek ve sivri, yakın katman alçak ve yuvarlak
 const n=[9,12,15][layer],peaks=[];for(let i=0;i<n;i++)peaks.push({x:(i+.2+R()*.6)*DN7_MW/n,h:[250,190,130][layer]*(.55+R()*.45),w:[170,150,140][layer]*(.8+R()*.5)});
 const yAt=x=>{let y=base-8;for(const p of peaks)for(const o of [-DN7_MW,0,DN7_MW]){const d=Math.abs(x-p.x-o)/p.w;if(d<1.6){const k=layer===2?Math.cos(Math.min(1,d/1.6)*1.5708):Math.max(0,1-d/1.6);const yy=base-8-p.h*Math.pow(k,layer===2?1.4:1.15);if(yy<y)y=yy;}}return y;};
 const pts=[];for(let x=0;x<=DN7_MW;x+=4)pts.push(yAt(x));
 const kol=sabah?[['#8e7ab8','#b796c8'],['#7a6aa8','#a688be'],['#6a5c98','#9078b0']][layer]:[['#3d4386','#4c5094'],['#33387a','#40437f'],['#2a2e6a','#363970']][layer];
 const gr=c.createLinearGradient(0,40,0,base);gr.addColorStop(0,kol[0]);gr.addColorStop(1,kol[1]);c.fillStyle=gr;
 c.beginPath();c.moveTo(0,base);for(let i=0;i<pts.length;i++)c.lineTo(i*4,pts[i]);c.lineTo(DN7_MW,base);c.closePath();c.fill();
 // karlı yüzler: ay sağdan vurur → her tepenin sağ yamacı açık; zirveden aşağı kar dilleri
 c.save();c.clip();
 const kar=sabah?['#ffd6e0','#ffc6c0','#f8b8c8'][layer]:['#6a74b8','#5c66a8','#505a9a'][layer],karG=sabah?'rgba(160,110,170,.35)':'rgba(30,32,90,.3)';
 for(const p of peaks){for(const o of [-DN7_MW,0,DN7_MW]){const px=p.x+o;if(px<-p.w*2||px>DN7_MW+p.w*2)continue;const ty=yAt(px);
  c.fillStyle=kar;c.beginPath();c.moveTo(px,ty-2);for(let k=0;k<=10;k++){const x=px+k*p.w*.16;c.lineTo(x,yAt(x)-1);}
  for(let k=10;k>=0;k--){const x=px+k*p.w*.12,y=yAt(px+k*p.w*.16)+p.h*(.18+.5*(k/10))+Math.sin(k*2.3+p.x)*8;c.lineTo(x,y);}c.closePath();c.fill();
  // kar dilleri (yarıklar)
  c.strokeStyle=karG;c.lineWidth=2;for(let k=0;k<4;k++){const x=px-p.w*.1+k*p.w*.12;c.beginPath();c.moveTo(x,yAt(x)+6);c.quadraticCurveTo(x+6,yAt(x)+p.h*.25,x+2,yAt(x)+p.h*(.3+R()*.3));c.stroke();}
  c.fillStyle=sabah?'rgba(255,240,236,.45)':'rgba(170,184,240,.25)';c.beginPath();c.moveTo(px,ty);c.lineTo(px+p.w*.5,yAt(px+p.w*.5));c.lineTo(px+p.w*.2,yAt(px+p.w*.2)+10);c.closePath();c.fill();}}
 c.restore();
 // sırt çizgisinde ince ay ışığı
 c.strokeStyle=sabah?'rgba(255,236,220,.55)':'rgba(190,200,255,.4)';c.lineWidth=1.2;c.beginPath();for(let i=0;i<pts.length;i++){i?c.lineTo(i*4,pts[i]+.6):c.moveTo(0,pts[0]+.6);}c.stroke();
 // performans: katmanın altındaki düz dolgu (ilk DN7_EXT satırı) ve katmanlar arası pus şeride bir kez basılır (karede ayrı tam
 // genişlik pus çizimi yok; source-over birleşimli olduğu için sonuç aynı)
 const F=dn7FxArt();c.fillStyle=sabah?'#c39ac0':['#4c5094','#40437f','#363970'][layer];c.fillRect(0,base-1,DN7_MW,DN7_EXT+1);
 c.globalAlpha=sabah?.3:.8;c.drawImage(F.pus[sabah?2:layer===0?0:1],0,base-110,DN7_MW,130);c.globalAlpha=1;
 dn7Kirp(cv);DN7.mtn[key]=cv;return cv;
}

// ════════ Çam: katlı, dallarında kalın kar, altında mavi gölge (önbellek tuvallerine çizilir) ════════
function dn7Cam(c,x,base,h,K,R,detay){
 // form: geniş / ince-uzun / eğik / genç fidan (aynı tohumla hep aynı)
 const fr=R(),wf=fr<.25?.62:fr<.5?1.22:.85+R()*.25,egik=R()<.2?(R()-.5)*.16:0,n=(detay?6:4)+(R()<.5?1:0),gov=h*.06;
 c.save();if(egik){c.translate(x,base);c.transform(1,0,egik,1,0,0);c.translate(-x,-base);}
 c.fillStyle=K.koyu;c.fillRect(x-gov*.5,base-h*.3,gov,h*.32);c.fillStyle=K.gov||K.koyu;c.fillRect(x-gov*.5+gov*.55,base-h*.3,gov*.3,h*.32);
 for(let k=0;k<n;k++){const u=k/n,ty=base-h*.2-u*h*.74,tw=h*.32*wf*(1-u*.8)*(.9+R()*.2),th=h*.74/n*1.75,tipY=ty-th;
  // iğne yapraklı katman: sarkık, dişli alt kenar
  const m=8,P2=new Path2D();P2.moveTo(x,tipY);P2.quadraticCurveTo(x-tw*.28,ty-th*.52,x-tw*1.04,ty+th*.06);
  for(let j=1;j<m;j++){const xx=x-tw+j*tw*2/m;P2.lineTo(xx,ty+(j%2?-th*.1:th*.04)+R()*th*.05);}
  P2.lineTo(x+tw*1.04,ty+th*.06);P2.quadraticCurveTo(x+tw*.28,ty-th*.52,x,tipY);P2.closePath();
  c.fillStyle=K.orta;c.fill(P2);c.save();c.clip(P2);
  c.fillStyle=K.acik;c.beginPath();c.moveTo(x+tw*.04,tipY);c.lineTo(x+tw*1.1,ty+th*.1);c.lineTo(x+tw*.12,ty+th*.1);c.closePath();c.fill();
  // kar örtüsü: katmanın üst kısmı, alt kenarı fiyonk gibi dalgalı (yuvarlak sarkmalar); altında mavi gölge
  const sy=ty-th*(.36+R()*.1),sc=7,sw=tw*2.2/sc;
  for(const [col,dy] of [[K.karG,th*.09],[K.kar,0]]){c.fillStyle=col;c.beginPath();c.moveTo(x-tw*1.2,tipY-4);c.lineTo(x+tw*1.2,tipY-4);c.lineTo(x+tw*1.2,sy+dy);
   for(let j=sc;j>0;j--){const x1=x-tw*1.1+(j-1)*sw,xm=x1+sw*.5,d=th*(.08+R()*.1)*(1-Math.abs(j-sc/2-.5)/sc*.6);c.quadraticCurveTo(xm,sy+dy+d*2,x1,sy+dy+(R()-.5)*th*.04);}
   c.lineTo(x-tw*1.2,tipY-4);c.closePath();c.fill();}
  if(detay){c.fillStyle=K.parla;c.beginPath();c.moveTo(x+1,tipY+2);c.quadraticCurveTo(x+tw*.3,ty-th*.6,x+tw*.6,sy+th*.02);c.lineTo(x+tw*.48,sy+th*.04);c.quadraticCurveTo(x+tw*.22,ty-th*.6,x+1,tipY+6);c.fill();}
  c.restore();
 }
 c.fillStyle=K.kar;c.beginPath();c.ellipse(x,base-h*.93,h*.022+1.5,h*.028+1.5,0,0,6.283);c.fill();c.restore();
}
const DN7_CAMK=[
 {koyu:'#6a70ac',orta:'#7880bc',acik:'#848cc6',karG:'#9aa2d4',kar:'#b4bce6',parla:'#c8cff0'},    // uzak: soluk mavi-lila, puslu
 {koyu:'#22305e',orta:'#2a4a78',acik:'#335684',karG:'#5a76b0',kar:'#9cb4e4',parla:'#bcd0f4'},    // orta: doygun mavi-teal
 {koyu:'#141c3c',orta:'#17304c',acik:'#1e3c5a',karG:'#4e66a4',kar:'#b8c8f0',parla:'#e0e8ff'},    // yakın: koyu lacivert-yeşil
 {koyu:'#2a1e36',gov:'#4a3650',orta:'#142c40',acik:'#1c3a52',karG:'#6074b6',kar:'#dce6ff',parla:'#f4f8ff'}];  // dünya derinliği: keskin silüet
// Orman şeritleri: 3 derinlik; altta karlı tepecikler. Yan yana döşenebilir (kenarı kesen ağaç tekrar karşı uçta çizilir).
const DN7_OW=1536,DN7_OH=520,DN7_OF=[.22,.36,.54],DN7_OY=[.12,.2,.3],DN7_OB=[560,620,690];
function dn7Orman(layer){
 if(DN7.orman[layer])return DN7.orman[layer];
 const cv=dn7Cv(DN7_OW,DN7_OH+DN7_EXT),c=cv.getContext('2d'),R=rng(6601+layer*91),base=DN7_OH-34,K=DN7_CAMK[layer],sc=[.55,.75,1][layer];
 const tepe=x=>base-Math.sin(x/DN7_OW*6.2832*2+layer)*14*sc-Math.sin(x/DN7_OW*6.2832*5+layer*2)*6*sc;
 const agaclar=[];let x=R()*30;while(x<DN7_OW){agaclar.push({x,h:(110+R()*170)*sc*(R()<.15?1.35:1),s:R()*1e5|0});x+=(26+R()*44)*sc*(layer===0?.7:1);}
 for(const A of agaclar)for(const o of [0,-DN7_OW,DN7_OW]){const ax=A.x+o;if(ax<-200||ax>DN7_OW+200)continue;dn7Cam(c,ax,tepe(A.x)+6,A.h,K,rng(A.s),layer===2);}
 // karlı tepecikler (ağaçların dibi) ve parıltı noktaları
 const kar=['#7c84bc','#5c74aa','#4a5c96'][layer],karU=['#9aa2d0','#88a0d4','#9aaee0'][layer];
 c.fillStyle=kar;c.beginPath();c.moveTo(0,DN7_OH);for(let x=0;x<=DN7_OW;x+=8)c.lineTo(x,tepe(x)+4);c.lineTo(DN7_OW,DN7_OH);c.closePath();c.fill();
 c.fillStyle=karU;for(let x=0;x<=DN7_OW;x+=10){c.beginPath();c.ellipse(x,tepe(x)+5,9,4,0,0,6.283);c.fill();}
 for(let j=0;j<120;j++){c.fillStyle='rgba(255,255,255,'+(.2+R()*.4)+')';c.fillRect(R()*DN7_OW,tepe(R()*DN7_OW)+8+R()*30,1,1);}
 // alt dolgu + gece pusu şeride basılı (dn7Dag ile aynı yöntem)
 const F=dn7FxArt();c.fillStyle=kar;c.fillRect(0,DN7_OH-1,DN7_OW,DN7_EXT+1);
 c.globalAlpha=[.42,.3,.16][layer];c.drawImage(F.pus[1],0,DN7_OH-150,DN7_OW,170);c.globalAlpha=1;
 dn7Kirp(cv);DN7.orman[layer]=cv;return cv;
}

// ════════ Zemin parçaları (dünya koordinatı, 768 genişlik): çamlar, kar gövdesi, yumuşak kar dudağı, buz, platformlar ════════
const DN7_CW=768,DN7_CACHE=12;
function dn7Yapilar(){
 if(DN7.camlar)return;DN7.camlar=[];DN7.plat=[];DN7.kris=[];
 const D7=typeof DEKOR7!=='undefined'?DEKOR7:{cam:[],cancik:[]};
 for(const [col,s] of D7.cam||[])DN7.camlar.push({x:nx(col)+(dn7Hash(col)-.5)*16,s,seed:col*17+3});
 // kızak tepelerinde ek çamlar (yamaçta, kızağın arkasında)
 for(let col=342;col<468;col+=4+((dn7Hash(col)*5)|0))DN7.camlar.push({x:nx(col),s:.8+dn7Hash(col*3)*.5,seed:col*17+5,yamac:true});
 DN7.camlar.sort((a,b)=>a.x-b.x);
 // tek yönlü platformlar (kar saçaklı kütükler)
 for(let r=0;r<ROWS;r++){let c=0;while(c<COLS){if(grid[r][c]!==2){c++;continue;}let e=c;while(e+1<COLS&&grid[r][e+1]===2)e++;DN7.plat.push({x0:c*T,x1:(e+1)*T,y:r*T,seed:c*31+r*7});c=e+1;}}
 for(const col of D7.cancik||[])DN7.kris.push({x:nx(col)+14,y:topOf(col)*T,v:col%3,ph:dn7Hash(col)*6.283,ci:col%10});
 // kar parıltıları: her sütunda birkaç sabit nokta (yüzeyde), karede yalnız ışıldayanlar çizilir
 DN7.dokulme=[];
}
function dn7Kutuk(c,p){
 // kar saçaklı kütük: ahşap gövde, halkalı uçlar, üstte kabarık kar, altta buz sarkıtları
 const R=rng(p.seed),x0=p.x0+2,x1=p.x1-2,y=p.y,w=x1-x0;
 c.fillStyle='#4a3a62';c.beginPath();c.moveTo(x0+8,y+4);c.lineTo(x1-8,y+4);c.quadraticCurveTo(x1,y+4,x1,y+14);c.quadraticCurveTo(x1,y+24,x1-8,y+24);c.lineTo(x0+8,y+24);c.quadraticCurveTo(x0,y+24,x0,y+14);c.quadraticCurveTo(x0,y+4,x0+8,y+4);c.fill();
 c.strokeStyle='rgba(30,20,48,.5)';c.lineWidth=1.2;for(let k=0;k<w/22;k++){const xx=x0+10+k*22+R()*8;c.beginPath();c.moveTo(xx,y+9);c.quadraticCurveTo(xx+6,y+15,xx+2,y+21);c.stroke();}
 for(const ex of [x0+4,x1-4]){c.fillStyle='#8a7090';c.beginPath();c.ellipse(ex,y+14,5,9.5,0,0,6.283);c.fill();c.strokeStyle='#6a5478';c.lineWidth=1;c.beginPath();c.ellipse(ex,y+14,2.6,5,0,0,6.283);c.stroke();}
 c.fillStyle='rgba(110,126,214,.5)';for(let xx=x0;xx<=x1;xx+=11){c.beginPath();c.ellipse(xx,y+7,9,5,0,0,6.283);c.fill();}
 c.fillStyle='#eef3ff';for(let xx=x0-2;xx<=x1+2;xx+=10){c.beginPath();c.ellipse(xx,y+1+R()*2,9+R()*3,6+R()*2,0,0,6.283);c.fill();}
 c.fillStyle='rgba(255,255,255,.95)';for(let xx=x0+4;xx<=x1-4;xx+=14){c.beginPath();c.ellipse(xx,y-1,5,2,0,0,6.283);c.fill();}
 for(let k=0;k<w/16;k++){const xx=x0+6+k*16+R()*6,L=6+R()*12;c.fillStyle='rgba(214,232,255,.85)';c.beginPath();c.moveTo(xx-2.4,y+22);c.lineTo(xx,y+22+L);c.lineTo(xx+2.4,y+22);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.8)';c.fillRect(xx-.8,y+23,1,L*.5);}
}
function dn7Chunk(i){
 if(DN7.chunks.has(i)){const a=DN7.chunks.get(i);DN7.chunks.delete(i);DN7.chunks.set(i,a);return a;}
 dn7Yapilar();const F=dn7FxArt();
 const cv=dn7Cv(DN7_CW+4,1200),c=cv.getContext('2d'),x0=i*DN7_CW,L=x0-2,Rr=x0+DN7_CW+2;c.translate(2-x0,0);
 const B=dn7Buz();
 // 1) dünya derinliğindeki büyük karlı çamlar (zeminin arkasında; kökleri kar dudağının altında kalır)
 let ust=1200;   // parçadaki en üst boyalı y (çizerken saydam üst kısım atlanır)
 for(const A of DN7.camlar){const h=250*A.s;if(A.x+h*.4<L||A.x-h*.4>Rr)continue;const yb=dn7Surface(A.x)+10;ust=Math.min(ust,yb-h*1.08-6);dn7Cam(c,A.x,yb,h,DN7_CAMK[3],rng(A.seed),true);}
 for(let x=Math.floor(L);x<=Rr;x+=8)ust=Math.min(ust,dn7Surface(x)-34);
 for(const pl of DN7.plat)if(pl.x1>L-20&&pl.x0<Rr+20)ust=Math.min(ust,pl.y-16);
 for(const k of DN7.kris)if(k.x>L-40&&k.x<Rr+40)ust=Math.min(ust,k.y-72);
 // 2) zemin gövdesi: koyu lavanta-mavi kar; derinde mor
 const p=new Path2D();let open=false,prev=1200;
 for(let x=Math.floor(L);x<=Rr;x+=2){const y=dn7Surface(x);if(y>=1200){if(open){p.lineTo(x,prev);p.lineTo(x,1200);p.closePath();open=false;}prev=1200;continue;}
  if(!open){p.moveTo(x,1200);p.lineTo(x,y);open=true;prev=y;}else if(y!==prev){p.lineTo(x,prev);p.lineTo(x,y);prev=y;}}
 if(open){p.lineTo(Rr,prev);p.lineTo(Rr,1200);p.closePath();}
 let gr=c.createLinearGradient(0,420,0,1200);gr.addColorStop(0,'#5e68ac');gr.addColorStop(.3,'#3e4688');gr.addColorStop(.7,'#262c66');gr.addColorStop(1,'#161a48');c.fillStyle=gr;c.fill(p);
 c.save();c.clip(p);
 // yüzeyin altında beyazdan maviye kar katmanı; derinde yumuşak katman çizgileri ve gömülü taşlar
 for(let x=Math.floor(L/8)*8;x<Rr;x+=8){const y=dn7Surface(x+4);if(y<1200)c.drawImage(F.bant,x,y-2,8,130);}
 const Q=rng(i*733+61);
 c.strokeStyle='rgba(200,214,255,.12)';c.lineWidth=2.5;for(let k=0;k<40;k++){const yy=Q()*160+40,xx=L+Q()*DN7_CW,ww=60+Q()*160;c.beginPath();c.moveTo(xx,dn7Surface(xx)+yy);c.quadraticCurveTo(xx+ww*.5,dn7Surface(xx)+yy+6,xx+ww,dn7Surface(xx)+yy);c.stroke();}
 for(let k=0;k<5;k++){const xx=L+Q()*DN7_CW,yy=dn7Surface(xx)+50+Q()*200,r=8+Q()*16;if(xx>B.x0&&xx<B.x1)continue;
  // karın içine gömülü taş: gövdeden yalnız biraz koyu, yumuşak; delik gibi görünmesin
  c.fillStyle='rgba(44,48,112,.28)';c.beginPath();c.ellipse(xx,yy,r*1.3,r,0,0,6.283);c.fill();c.fillStyle='rgba(190,200,245,.16)';c.beginPath();c.ellipse(xx-r*.2,yy-r*.6,r*.95,r*.38,0,0,6.283);c.fill();}
 for(let k=0;k<160;k++){const xx=L+Q()*DN7_CW,yy=dn7Surface(xx)+6+Q()*90;c.fillStyle='rgba(255,255,255,'+(.15+Q()*.35)+')';c.fillRect(xx,yy,1,1);}
 // basamak yüzleri: yüksek basamağın kenarında yumuşak gölge (basamak düz bir duvar gibi değil, yuvarlak kar kütlesi gibi okunur)
 for(let q=Math.floor(L/T)-1;q<=Math.ceil(Rr/T);q++){if(q<0||q>=COLS)continue;const t1=topOf(q);if(t1>=ROWS)continue;
  for(const s of [-1,1]){const n2=q+s;if(n2<0||n2>=COLS||n2*T>=DN7_GAP0&&n2*T<DN7_GAP1)continue;const t2=topOf(n2);if(t2<=t1||t2>=ROWS)continue;
   const ex=s>0?(q+1)*T:q*T,y0=t1*T+6,y1=t2*T+30,gw=s*22,eg=c.createLinearGradient(ex,0,ex-gw,0);
   eg.addColorStop(0,'rgba(28,32,92,.42)');eg.addColorStop(.45,'rgba(28,32,92,.15)');eg.addColorStop(1,'rgba(28,32,92,0)');c.fillStyle=eg;c.fillRect(Math.min(ex,ex-gw),y0,Math.abs(gw),y1-y0);
   // alçak basamağın gövdesine düşen yumuşak gölge (yüksek basamağın dibinde)
   const ag=c.createLinearGradient(ex,0,ex+s*46,0);ag.addColorStop(0,'rgba(28,32,92,.28)');ag.addColorStop(1,'rgba(28,32,92,0)');c.fillStyle=ag;c.fillRect(Math.min(ex,ex+s*46),t2*T+8,46,60);}}
 c.restore();
 // 3) buzlu göl: yarı saydam mavi buz bloğu, içinde çatlaklar, donmuş kabarcıklar, derin mor
 if(Rr>B.x0&&L<B.x1){const a=Math.max(L,B.x0),b=Math.min(Rr,B.x1);
  gr=c.createLinearGradient(0,B.y,0,1200);gr.addColorStop(0,'#8fb6ea');gr.addColorStop(.06,'#5e86cc');gr.addColorStop(.3,'#34478e');gr.addColorStop(1,'#141a4c');c.fillStyle=gr;c.fillRect(a,B.y,b-a,1200-B.y);
  const QB=rng(i*97+5);
  c.fillStyle='rgba(255,255,255,.06)';for(let k=0;k<6;k++){const xx=a+QB()*(b-a);c.beginPath();c.moveTo(xx,B.y);c.lineTo(xx+40,B.y);c.lineTo(xx-60,B.y+300);c.lineTo(xx-100,B.y+300);c.closePath();c.fill();}
  c.strokeStyle='rgba(236,246,255,.5)';c.lineWidth=1.2;
  for(let k=0;k<7;k++){let xx=a+QB()*(b-a),yy=B.y+6+QB()*30;c.beginPath();c.moveTo(xx,yy);for(let s=0;s<6;s++){xx+=(QB()-.5)*50;yy+=8+QB()*22;c.lineTo(xx,yy);if(QB()<.4){c.moveTo(xx,yy);c.lineTo(xx+(QB()-.5)*40,yy+QB()*20);c.moveTo(xx,yy);}}c.stroke();}
  c.strokeStyle='rgba(236,246,255,.35)';c.lineWidth=1;for(let k=0;k<26;k++){const xx=a+QB()*(b-a),yy=B.y+20+QB()*220,r=1.5+QB()*3.5;c.beginPath();c.arc(xx,yy,r,0,6.283);c.stroke();}
  c.fillStyle='rgba(240,248,255,.9)';c.fillRect(a,B.y,b-a,2);c.fillStyle='rgba(200,224,255,.5)';c.fillRect(a,B.y+2,b-a,3);}
 // 4) yumuşak kar dudağı: mavi gölge, kabarık beyaz, en üstte ışık (her yüzeyde; basamak kenarında kendiliğinden saçak)
 const buzda=x=>x>B.x0+30&&x<B.x1-30;
 for(const [col,dy,rx,ry,al] of [['rgba(100,116,210,.5)',10,13,8,1],['#e9efff',3,12,7.5,1],['rgba(255,255,255,.92)',0,7,2.6,1]]){c.fillStyle=col;
  for(let x=Math.floor(L/12)*12-12;x<Rr+12;x+=12){const xx=x+6,y=dn7Surface(xx);if(y>=1200||buzda(xx))continue;const w=dn7Hash(xx*.37);c.beginPath();c.ellipse(xx,y+dy-1+w*2,rx+w*3,ry+w*1.5,0,0,6.283);c.fill();}}
 // göl kıyısında buzun üstüne kayan kar yığıntıları
 if(Rr>B.x0-40&&L<B.x1+40)for(const [ex,yon] of [[B.x0,1],[B.x1,-1]]){c.fillStyle='#e9efff';for(let k=0;k<4;k++){c.beginPath();c.ellipse(ex+yon*(8+k*12),B.y+1,14-k*2.5,6-k,0,0,6.283);c.fill();}}
 // basamak yüzlerinde buz sarkıtları
 for(let q=Math.floor(L/T);q<=Math.ceil(Rr/T);q++){if(q<1||q>=COLS-1)continue;const QQ=rng(q*57+3);
  for(const s of [-1,1]){const n2=q+s;if(n2<0||n2>=COLS)continue;const t1=topOf(q),t2=topOf(n2);if(t1>=ROWS||t2<=t1)continue;if(n2*T>=DN7_GAP0&&n2*T<DN7_GAP1)continue;
   const ex=s>0?(q+1)*T:q*T,sy=t1*T;for(let k=0;k<3;k++){const xx=ex+s*(1+k*3)-s*2,L2=8+QQ()*16;c.fillStyle='rgba(214,232,255,.8)';c.beginPath();c.moveTo(xx-2.6,sy+8);c.lineTo(xx+s*1.5,sy+8+L2);c.lineTo(xx+2.6,sy+8);c.closePath();c.fill();}}}
 // 5) kar kaplı süsler: küçük kar yığınları, kütük, taş; nesne sütunlarından kaçar
 const dolu=q=>NESNELER.some(o=>(Math.abs(o.x-nx(q))<1.8*T&&o.tip!=='tohum'&&o.tip!=='konusma'&&o.tip!=='buzGol')||(o.tip==='kardanMini'&&nx(q)>(o.x0||o.x-700)-T&&nx(q)<(o.x1||o.x+700)+T));   // kardan adam alanı boş kalır
 // 4b) yakın plan kar ayrıntıları (yalnız çizim): donmuş su birikintisi, yumuşak kar tümseği, kızak izleri, minik buz kristalleri
 for(let q=Math.floor(L/T)-2;q<=Math.ceil(Rr/T)+1;q++){if(q<2||q>=COLS-3)continue;const sy=topOf(q)*T;
  if(sy>=1200||topOf(q-1)!==topOf(q)||topOf(q+1)!==topOf(q)||buzda(nx(q))||(q*T>=DN7_GAP0-T&&q*T<DN7_GAP1))continue;const h=dn7Hash(q*1.618+3.3),x=q*T+20;
  if(h<.1){c.fillStyle='rgba(112,160,232,.6)';c.beginPath();c.ellipse(x,sy+6,27,4.6,0,0,6.283);c.fill();c.fillStyle='rgba(206,232,255,.95)';c.beginPath();c.ellipse(x-3,sy+5.2,19,2.6,0,0,6.283);c.fill();
   c.fillStyle='#ffffff';c.fillRect(x-14,sy+4,9,1);c.fillRect(x+3,sy+6,5,1);}
  else if(h<.2){if(dolu(q))continue;c.fillStyle='rgba(100,116,210,.4)';c.beginPath();c.ellipse(x+3,sy+3,46,7,0,0,6.283);c.fill();c.fillStyle='#e9efff';c.beginPath();c.ellipse(x,sy+2,40,15,0,Math.PI,0);c.fill();
   c.fillStyle='rgba(150,166,232,.45)';c.beginPath();c.ellipse(x+14,sy+2,22,9,0,Math.PI,0);c.fill();c.fillStyle='#ffffff';c.beginPath();c.ellipse(x-9,sy-9,15,2.6,-.12,0,6.283);c.fill();}
  else if(h<.3&&topOf(q+2)===topOf(q)&&topOf(q+3)===topOf(q)){for(const dy of [11,18]){c.strokeStyle='rgba(96,112,200,.5)';c.lineWidth=2;c.beginPath();c.moveTo(x-30,sy+dy);c.quadraticCurveTo(x+30,sy+dy+1.5,x+110,sy+dy);c.stroke();
    c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1;c.beginPath();c.moveTo(x-30,sy+dy+1.8);c.quadraticCurveTo(x+30,sy+dy+3.3,x+110,sy+dy+1.8);c.stroke();}}
  else if(h<.37&&!dolu(q)){for(const [dx,hh,w] of [[-7,13,4],[0,20,5],[8,11,4]]){c.fillStyle='#d6eeff';c.beginPath();c.moveTo(x+dx-w,sy+2);c.lineTo(x+dx+1,sy-hh);c.lineTo(x+dx+w,sy+2);c.closePath();c.fill();
    c.fillStyle='rgba(120,156,236,.55)';c.beginPath();c.moveTo(x+dx+1,sy-hh);c.lineTo(x+dx+w,sy+2);c.lineTo(x+dx+1,sy+2);c.closePath();c.fill();}c.fillStyle='#eef3ff';c.beginPath();c.ellipse(x,sy+2,14,3.4,0,0,6.283);c.fill();}}
 for(let q=Math.floor(L/T);q<=Math.ceil(Rr/T);q++){if(q<1||q>=COLS-1)continue;const QQ=rng(q*977+5);if(QQ()>.3)continue;const sy=topOf(q)*T;
  if(sy>=1200||topOf(q-1)!==topOf(q)||topOf(q+1)!==topOf(q)||dolu(q)||buzda(nx(q)))continue;const x=q*T+20,k=QQ();
  if(k<.45){c.fillStyle='rgba(100,116,210,.45)';c.beginPath();c.ellipse(x,sy+2,22,7,0,0,6.283);c.fill();c.fillStyle='#eef3ff';c.beginPath();c.ellipse(x-6,sy-4,14,9,0,0,6.283);c.ellipse(x+8,sy-2,12,7,0,0,6.283);c.fill();c.fillStyle='#ffffff';c.beginPath();c.ellipse(x-8,sy-9,6,2.4,0,0,6.283);c.fill();}
  else if(k<.7){
   // kar şapkalı kütük: yuvarlak gövde, gölgeli yan, kabuk çizgileri, kabarık kar ve dibinde kar yığıntısı
   c.fillStyle='rgba(100,116,210,.4)';c.beginPath();c.ellipse(x+2,sy+1,16,5,0,0,6.283);c.fill();
   c.fillStyle='#5a4672';c.beginPath();c.moveTo(x-9,sy);c.lineTo(x-8,sy-17);c.lineTo(x+8,sy-17);c.lineTo(x+9,sy);c.closePath();c.fill();
   c.fillStyle='#3e2f52';c.beginPath();c.moveTo(x+3,sy);c.lineTo(x+3.5,sy-17);c.lineTo(x+8,sy-17);c.lineTo(x+9,sy);c.closePath();c.fill();
   c.strokeStyle='rgba(40,28,60,.45)';c.lineWidth=1;c.beginPath();c.moveTo(x-4,sy-3);c.lineTo(x-4.5,sy-13);c.moveTo(x+1,sy-2);c.lineTo(x+.5,sy-10);c.stroke();
   c.fillStyle='#8a7090';c.beginPath();c.ellipse(x,sy-17,8.5,3.2,0,0,6.283);c.fill();
   c.fillStyle='#eef3ff';c.beginPath();c.ellipse(x,sy-20,10.5,5,0,0,6.283);c.ellipse(x+3,sy-23,6,4,0,0,6.283);c.fill();c.fillStyle='#ffffff';c.beginPath();c.ellipse(x-2,sy-23,4,1.6,0,0,6.283);c.fill();
   c.fillStyle='#eef3ff';c.beginPath();c.ellipse(x-9,sy-1,7,4,0,0,6.283);c.ellipse(x+10,sy-1,6,3.5,0,0,6.283);c.fill();}
  else{
   // karla örtülü taş: açık lavanta gövde, altı gölgeli; üstünün yarısı kalın kar
   c.fillStyle='rgba(100,116,210,.45)';c.beginPath();c.ellipse(x,sy+1,19,5,0,0,6.283);c.fill();
   c.fillStyle='#6c6cb0';c.beginPath();c.ellipse(x,sy-6,16,10,0,0,6.283);c.fill();c.fillStyle='#55559a';c.beginPath();c.ellipse(x+4,sy-3,12,6,0,0,6.283);c.fill();
   c.fillStyle='#eef3ff';c.beginPath();c.ellipse(x-1,sy-12,15,6.5,0,0,6.283);c.fill();c.fillStyle='#ffffff';c.beginPath();c.ellipse(x-4,sy-15,7,2.2,0,0,6.283);c.fill();}}
 // 6) kar saçaklı kütük platformlar
 for(const pl of DN7.plat)if(pl.x1>L-20&&pl.x0<Rr+20)dn7Kutuk(c,pl);
 // 7) buz kristali kümeleri (karede içten parlar)
 for(const k of DN7.kris)if(k.x>L-40&&k.x<Rr+40)c.drawImage(F.kristal[k.v],k.x-32,k.y-68,64,72);
 cv.ust=Math.max(0,Math.floor(ust));DN7.chunks.set(i,cv);while(DN7.chunks.size>DN7_CACHE)DN7.chunks.delete(DN7.chunks.keys().next().value);return cv;
}
function dn7Terrain(){
 g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);const a=Math.max(0,Math.floor(cam.x/DN7_CW)),b=Math.min(Math.ceil(COLS*T/DN7_CW),Math.floor((cam.x+VW)/DN7_CW));
 const ya=cam.y-2,yb=cam.y+H/S+2;DN7.zeminKare=DN7.kare;
 for(let i=a;i<=b;i++){const cv=dn7Chunk(i),y0=Math.max(cv.ust,Math.floor(ya)),y1=Math.min(1200,Math.ceil(yb));if(y1>y0)g.drawImage(cv,0,y0,cv.width,y1-y0,i*DN7_CW-2,y0,cv.width,y1-y0);}const next=b+1;if(next*DN7_CW<COLS*T&&!DN7.chunks.has(next))dn7Chunk(next);
}

// ════════ Kuzey ışıkları: küçük ara tuvalde dilim dilim dalgalanan perdeler ════════
const DN7_AW=384,DN7_AH=240;
// sönük taban perdeleri (her zaman, çok soluk) + final için üç dev perde
const DN7_TABAN=[{ci:0,x0:-.05,x1:.7,y:.5,hg:.4,amp:.12,k1:3.2,k2:8,sp:.14,ph:.4,a:.36,par:.5,n:40},
 {ci:4,x0:.3,x1:1.08,y:.42,hg:.34,amp:.1,k1:3.8,k2:7,sp:.11,ph:2.1,a:.3,par:.8,n:40},
 {ci:3,x0:.08,x1:.88,y:.32,hg:.3,amp:.09,k1:2.8,k2:6.5,sp:.09,ph:4.2,a:.26,par:.3,n:36}];
const DN7_DEV=[{ci:0,x0:-.1,x1:1.1,y:.66,hg:.62,amp:.13,k1:3.6,k2:9,sp:.22,ph:1,a:.6,par:.6,n:48},
 {ci:1,x0:-.05,x1:.72,y:.46,hg:.46,amp:.11,k1:3,k2:8,sp:.18,ph:3,a:.5,par:.4,n:40},
 {ci:3,x0:.32,x1:1.1,y:.56,hg:.52,amp:.12,k1:4,k2:7,sp:.2,ph:5,a:.52,par:.8,n:40}];
// yol boyunca hep yanan geniş perdeler: yukarıda pembe, ortada yeşil, yanda turkuaz (ilerledikçe güçlenir)
const DN7_YOL=[{ci:1,pm:1,x0:.05,x1:1.1,y:.3,hg:.36,amp:.08,k1:3.4,k2:7.5,sp:.12,ph:2.2,a:.8,par:.5,n:30},
 {ci:1,pm:1,x0:-.1,x1:.55,y:.5,hg:.3,amp:.07,k1:4.2,k2:6,sp:.1,ph:5.1,a:.5,par:.3,n:22},
 {ci:8,x0:-.1,x1:.75,y:.62,hg:.5,amp:.11,k1:2.9,k2:8.5,sp:.16,ph:.7,a:.58,par:.7,n:30},
 {ci:6,x0:.4,x1:1.12,y:.74,hg:.44,amp:.1,k1:3.8,k2:6.5,sp:.14,ph:4.4,a:.5,par:.9,n:28}];
function dn7PerdeCiz(c,P0,tm,a,ox,hiz,spr){
 // perde: n dilim; her dilim yumuşak bir ışık sütunu (×3 genişlik, komşularıyla karışır). Alt kenar iki dalganın toplamıyla
 // S biçiminde kıvrılır; kıvrımın döndüğü yerde (eğim) ışık katlanır ve parlar; ince ışınlar yükseklik/alfa titreşimiyle.
 const tex=spr||DN7.fx.perde[P0.ci],n=P0.n,x0=P0.x0*DN7_AW+ox*P0.par,x1=P0.x1*DN7_AW+ox*P0.par,dw=(x1-x0)/n,tt=tm*P0.sp*hiz;
 let yPrev=0;a*=.42;
 for(let i=0;i<=n;i++){const u=i/n,ta=Math.pow(Math.sin(u*Math.PI),.9);if(ta<.02)continue;
  const x=x0+dw*i,yb=(P0.y+P0.amp*(Math.sin(u*P0.k1+tt+P0.ph)*.7+Math.sin(u*P0.k2-tt*1.6+P0.ph*2)*.3))*DN7_AH;
  const ray=.85+.15*Math.sin(i*2.7+tm*2.3*hiz+P0.ph)*Math.sin(i*1.3-tm*1.1),hh=P0.hg*DN7_AH*(.8+.2*Math.sin(u*4+tm*.35+P0.ph))*ray;
  const sl=i?Math.abs(yb-yPrev)/dw:0;yPrev=yb;
  const aa=a*ta*(.6+.55*Math.min(1,sl*1.4))*(.9+.1*ray);if(aa<.006)continue;
  c.globalAlpha=aa>1?1:aa;c.drawImage(tex,x-dw*1.6,yb-hh*.87,dw*3.2,hh);}
}
function dn7Aurora(tm,vw,vh,yAlt){
 const F=dn7FxArt(),c=DN7.aurC,gece=1-DN7.sabah*.92;if(gece<.02)return;
 // perdeler yavaş dalgalanır: ara tuval iki karede bir yenilenir (JS yarıya iner, göz farkı görmez); yeni fener süpürmesinde her kare
 const yeni=DN7.perde.length&&now-DN7.perde[DN7.perde.length-1].t0<5;
 if(DN7.kare-DN7.aurKare>=4||yeni||DN7.aurKare>DN7.kare){DN7.aurKare=DN7.kare;dn7AurBuf(tm,F,c);}
 dn7AurCiz(vw,vh,yAlt,gece,tm);
}
function dn7AurBuf(tm,F,c){
 const fin=DN7.fin,R7=DN7.renk,dor=DN7.dorukT===null?0:Math.max(0,1-(now-DN7.dorukT)/3),hiz=1+fin*.8;
 c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';c.globalAlpha=1;c.clearRect(0,0,DN7_AW,DN7_AH);c.globalCompositeOperation='lighter';
 const ox=-((cam.x*.008)%DN7_AW);
 // gök ışıması: perde renklerinde geniş yumuşak lekeler (büyütülünce göğü renklendirir)
 const gl=(col,x,y,r,a)=>{if(a<=.003)return;c.globalAlpha=a>1?1:a;c.drawImage(glow(col),x-r,y-r*.6,r*2,r*1.2);};
 const gc=DN7.guc;gl(DN7_AUR[0],DN7_AW*.35,DN7_AH*.6,DN7_AW*.5,.07+gc*.08+fin*.06);gl(DN7_AUR[1],DN7_AW*.74,DN7_AH*.42,DN7_AW*.42,.04+gc*.06);gl(DN7_AUR[2],DN7_AW*.12,DN7_AH*.3,DN7_AW*.36,.03+gc*.05);
 for(let k=0;k<DN7.perde.length;k++){const P0=DN7.perde[k],on=smooth(clamp((now-P0.t0)/3,0,1));gl(DN7_AUR[P0.ci],(P0.x0+P0.x1)*.5*DN7_AW,P0.y*DN7_AH,(P0.x1-P0.x0)*DN7_AW*.45,on*.035);}
 // sönük taban perdeleri: fenerler yandıkça güçlenir
 const pk=1/(1+DN7.perde.length*.1),ta=(1.5+gc*1.1+fin*.15)*(1+dor*.3)*pk,rk=clamp(.88+gc+fin,0,1);for(const P0 of DN7_TABAN){if(rk<.99)dn7PerdeCiz(c,P0,tm,ta*P0.a*(1-rk)*1.5,ox,hiz,F.perdeSonuk);if(rk>.01)dn7PerdeCiz(c,P0,tm,ta*P0.a*rk,ox,hiz);}
 // her yanan fenerin perdesi: belirirken bir ışık süpürmesi. Toplam parlaklık sınırlı (perde sayısı arttıkça her biri biraz söner;
 // gök asla beyazlaşmaz, koyu lacivert-mor kalır)
 // yandıkça gök belirgin canlanır: perde başı parlaklık fener oranıyla artar (10/10'da ~2,4 kat), sayıyla bölünür → asla beyazlamaz
 const fo=clamp(DN7.perde.length/10,0,1),kSay=(1+fo*1.5*(1-fin*.45))/Math.sqrt(1+DN7.perde.length*.3);
 for(let k=0;k<DN7.perde.length;k++){const P0=DN7.perde[k],age=now-P0.t0,on=smooth(clamp(age/3,0,1)),sup=age<5?Math.sin(clamp(age/5,0,1)*Math.PI)*.5:0;
  dn7PerdeCiz(c,P0,tm,(P0.a*on+sup)*(.62+fin*.25+dor*.3)*kSay,ox,hiz);}
 // final: gökyüzünü kaplayan üç dev perde
 const devK=typeof karFinalAn==='function'?.55:.85;   // kar.js finalde kendi perdelerini önde çizer: arka perdeler ölçülü
 {const dv=fin*devK*.8+(1-fin)*(.4+gc*.9)*.8*pk;for(const P0 of DN7_DEV)dn7PerdeCiz(c,P0,tm,P0.a*dv*(1+dor*.3),ox,hiz);
  const yl=(.7+gc*1.1)*(1-fin*.25)*(pk+(1-pk)*fin*.5);for(const P0 of DN7_YOL)dn7PerdeCiz(c,P0,tm,P0.a*yl,ox,hiz,P0.pm?F.perdeP:undefined);}
 // yavaş renk kayması: yanan perdeler zamanla pembe-yeşil-turkuaz-mor arasında hafifçe döner (sönük perdeler gri kalır)
 const ka=.16*clamp(.5+gc+fin,0,1);if(ka>.01){c.globalCompositeOperation='source-atop';c.globalAlpha=ka;const o=(tm*7)%512;
  c.drawImage(F.aurTint,-o,0,512,DN7_AH);c.drawImage(F.aurTint,512-o,0,512,DN7_AH);}
 c.globalAlpha=1;c.globalCompositeOperation='source-over';
}
function dn7AurCiz(vw,vh,yAlt,gece,tm){
 const y0=-vh*.04-cam.y*.02+Math.sin(tm*.11)*vh*.012,hh=vh*.78*(1+.035*Math.sin(tm*.083+1)),alt=Math.min(hh,(yAlt===undefined?vh:yAlt)-y0);if(alt<=0)return;
 g.setTransform(S,0,0,S,0,0);g.globalCompositeOperation='lighter';g.globalAlpha=gece;
 g.drawImage(DN7.aurBuf,0,0,DN7_AW,DN7_AH*alt/hh,0,y0,vw,alt);g.globalAlpha=1;g.globalCompositeOperation='source-over';
}

// ════════ Arka plan ════════
// Boyama tasarrufu: her katmanın alt dolgusu opaktır; bir katmanın sonrakilerin (ya da zeminin) kesin örttüğü alt kısmı hiç çizilmez.
// Gök, kuzey ışığı ve şeritler yalnız görünebilecekleri yüksekliğe kadar boyanır (iPad'de tam ekran boyama sayısı ~8,6 → ~4).
function dn7ZeminAlt(vh){
 // zemin parçalarının kesin örttüğü en üst ekran y'si (son karede zemin çizildiyse): görünen sütunların en alçak yüzeyinin altı
 if(DN7.zeminKare!==DN7.kare-1)return vh;
 const yb=1200-cam.y;if(yb<vh)return vh;let m=-1e9;
 for(let x=cam.x-8;x<=cam.x+VW+8;x+=16){const y=dn7Surface(x);if(y>=1200)return vh;if(y>m)m=y;}
 return Math.min(vh,m-cam.y+4);
}
function dn7Backdrop(tm){
 const vw=W/S,vh=H/S,F=dn7FxArt(),sb=DN7.sabah,gece=1-sb;
 g.setTransform(S,0,0,S,0,0);
 // katman tabanları (ekran y'si) ve her katmanın altını örten ilk opak çizgi
 const tab=[],yZ=dn7ZeminAlt(vh);
 for(let l=0;l<3;l++)tab.push(DN7_MB[l]-cam.y*DN7_MY[l]);
 for(let l=0;l<3;l++)tab.push(DN7_OB[l]-cam.y*DN7_OY[l]);
 const ort=[];for(let l=0;l<6;l++){let m=yZ;for(let j=l+1;j<6;j++)if(tab[j]<m)m=tab[j];ort.push(m);}
 let gokAlt=yZ;for(let j=0;j<6;j++)if(tab[j]<gokAlt)gokAlt=tab[j];
 DN7.gokAlt=gokAlt;
 // gök (yalnız görünen üst kısım)
 g.setTransform(1,0,0,1,0,0);const gu=clamp(gokAlt/vh,0,1);
 if(gu>0){const hh=Math.ceil(H*gu)+2;g.drawImage(DN7.sky,0,0,768,Math.min(600,600*hh/H),0,0,W,Math.min(H,hh));
  if(sb>.004){g.globalAlpha=sb;g.drawImage(DN7.dawn,0,0,768,Math.min(600,600*hh/H),0,0,W,Math.min(H,hh));g.globalAlpha=1;}}
 g.setTransform(S,0,0,S,0,0);
 // ışıldayan yıldızlar (sabahla söner) ve ay
 g.globalCompositeOperation='lighter';
 for(let i=0;i<DN7_STARS.length;i++){const s=DN7_STARS[i],y=s.y*vh;if(y>gokAlt)continue;const a=gece*(.3+.4*Math.sin(tm*s.sp+s.ph))*(1+DN7.fin*.3);dn7Glow('#eef2ff',s.x*vw,y,s.r*5,s.r*5,a*.5);}
 g.globalCompositeOperation='source-over';
 if(gece>.02){g.globalAlpha=gece;g.drawImage(F.ay,vw*.8-cam.x*.002-96*.75,vh*.13-72,144,144);g.globalAlpha=1;}
 // kuzey ışıkları (dağların arkasında)
 dn7Aurora(tm,vw,vh,gokAlt);
 // kayan yıldız (ara sıra)
 dn7KayanYildiz(tm,vw,vh);
 // uzak dağlar (dolgu ve pus şeride basılı)
 for(let layer=0;layer<3;layer++){
  const f=DN7_MF[layer],base=tab[layer],alt=ort[layer],off=((cam.x*f)%DN7_MW+DN7_MW)%DN7_MW,y0=base-DN7_MH;
  for(let x=-off;x<vw;x+=DN7_MW){if(sb<.99)dn7Serit(dn7Dag(layer,false),x,y0,vw,alt);if(sb>.01){g.globalAlpha=sb;dn7Serit(dn7Dag(layer,true),x,y0,vw,alt);g.globalAlpha=1;}}
  const yd=base+DN7_EXT-1;if(alt>yd){g.fillStyle=['#4c5094','#40437f','#363970'][layer];if(sb<.99)g.fillRect(0,yd,vw,alt-yd);if(sb>.01){g.globalAlpha=sb;g.fillStyle='#c39ac0';g.fillRect(0,yd,vw,alt-yd);g.globalAlpha=1;}}
  // dağların tepesine kuzey ışığının renk yansıması
  if(layer===0&&DN7.renk>.02){g.globalCompositeOperation='lighter';dn7Glow(DN7_AUR[DN7.kayCi],vw*.4,base-DN7_MH*.35,vw*.6,DN7_MH*.4,(.04+DN7.renk*.08+DN7.fin*.08)*gece);g.globalCompositeOperation='source-over';}
 }
 dn7Zirveler(vw,tab[2]+DN7_EXT,ort[2],gece);
 // sabah güneşi: ufukta altın ışık
 if(sb>.01){g.globalCompositeOperation='lighter';dn7Glow('#ffd8a8',vw*.6,tab[1]-40,vw*.6,vh*.3,sb*.5);dn7Glow('#fff4d8',vw*.6,tab[1]-30,70,50,sb*.8);g.globalCompositeOperation='source-over';}
 // çam ormanı katmanları; orta katmanda uzak kulübe(ler)
 for(let layer=0;layer<3;layer++){
  const f=DN7_OF[layer],base=tab[3+layer],alt=ort[3+layer],off=((cam.x*f)%DN7_OW+DN7_OW)%DN7_OW;
  for(let x=-off;x<vw;x+=DN7_OW)dn7Serit(dn7Orman(layer),x,base-DN7_OH,vw,alt);
  const yd=base+DN7_EXT-1;if(alt>yd){g.fillStyle=['#7c84bc','#5c74aa','#4a5c96'][layer];g.fillRect(0,yd,vw,alt-yd);}
  if(layer===1)dn7Kulube(tm,vw,vh,f,base);
  // sabahta pus pembeleşir ve hafif açılır
  if(sb>.01){g.globalAlpha=[.42,.3,.16][layer]*.6*sb;g.drawImage(F.pus[2],0,base-150,vw,Math.min(170,alt-base+150));
   const ya=base-DN7_OH*.6;if(alt>ya){g.globalAlpha=sb*.22;g.fillStyle='#ffb8b0';g.fillRect(0,ya,vw,alt-ya);}g.globalAlpha=1;}
 }
}
function dn7KayanYildiz(tm,vw,vh){
 const gece=1-DN7.sabah;if(gece<.3)return;const P9=9,k=Math.floor(tm/P9),u=(tm-k*P9)/1.2;if(u>1)return;
 const h1=dn7Hash(k*1.3),h2=dn7Hash(k*2.7+5),sol=h1<.5,x0=vw*(.15+h1*.7),y0=vh*(.03+h2*.15),ang=sol?Math.PI-.4:.4,L=vw*.22;
 const x=x0+Math.cos(ang)*L*u,y=y0+Math.sin(ang)*L*u,a=Math.sin(u*Math.PI)*gece*.8;
 g.globalCompositeOperation='lighter';for(let j=0;j<6;j++){const b=j/6;dn7Glow('#eef2ff',x-Math.cos(ang)*b*60,y-Math.sin(ang)*b*60,4-b*3,4-b*3,a*(1-b)*.8);}
 dn7Glow('#ffffff',x,y,9,9,a);g.globalCompositeOperation='source-over';
}
// ════════ Farklı biçimli büyük dağlar: sivri zirve, ikiz tepe, geniş buzullu dağ (yol boyunca sırayla, dağlarla orman arasında) ════════
const DN7_ZIRVE_YER=[[70,0],[185,1],[300,2],[410,0],[525,1]];
const DN7_ZIRVE_P=[[0,340,150,150,205,44,236,8,262,62,300,120,480,340],[0,340,110,124,150,72,190,134,236,160,292,52,330,26,382,140,480,340],[0,340,90,150,140,92,200,70,300,64,352,96,402,172,480,340]];
function dn7ZirveArt(){
 if(DN7.zirve)return DN7.zirve;const Z=DN7.zirve=[];
 for(let v=0;v<3;v++){const cv=dn7Cv(480,340),c=cv.getContext('2d'),P0=DN7_ZIRVE_P[v];let ty=340,tx=0;for(let i=0;i<P0.length;i+=2)if(P0[i+1]<ty){ty=P0[i+1];tx=P0[i];}
  const gr=c.createLinearGradient(0,ty,0,340);gr.addColorStop(0,'#5a60ac');gr.addColorStop(1,'#4a4f96');c.fillStyle=gr;c.beginPath();c.moveTo(P0[0],P0[1]);for(let i=2;i<P0.length;i+=2)c.lineTo(P0[i],P0[i+1]);c.closePath();c.fill();
  c.save();c.clip();
  // ayın vurduğu sağ yamaç
  c.fillStyle='rgba(150,164,232,.3)';c.beginPath();c.moveTo(tx,ty);c.lineTo(tx+250,340);c.lineTo(tx+40,340);c.lineTo(tx+14,ty+120);c.closePath();c.fill();
  // kar başlığı: alt kenarı dişli
  const cy=ty+[78,74,30][v];for(const [col,dy] of [['#8e9ade',10],['#dfe5ff',0]]){c.fillStyle=col;c.beginPath();c.moveTo(0,0);c.lineTo(480,0);c.lineTo(480,cy+dy);for(let x=480,k=0;x>=0;x-=24,k++)c.lineTo(x,cy+dy+(k%2?20:-8));c.closePath();c.fill();}
  c.strokeStyle='rgba(40,44,110,.3)';c.lineWidth=2;for(let k=0;k<6;k++){const x=tx-70+k*30;c.beginPath();c.moveTo(x,cy+20);c.quadraticCurveTo(x+8,cy+80,x-4+k*3,cy+150);c.stroke();}
  c.restore();Z.push(cv);}
 return Z;
}
function dn7Zirveler(vw,yb,alt,gece){
 const Z=dn7ZirveArt();
 for(let i=0;i<DN7_ZIRVE_YER.length;i++){const A=DN7_ZIRVE_YER[i],sx=vw*.5+(A[0]*T-(cam.x+VW*.5))*.11;if(sx<-240||sx>vw+240)continue;
  const hh=Math.min(320,alt-(yb-320));if(hh<=0)continue;g.globalAlpha=.55+gece*.45;g.drawImage(Z[A[1]],0,0,480,340*hh/320,sx-225,yb-320,450,hh);g.globalAlpha=1;}
}
// ════════ Yol boyunca değişen manzara: kar köyü, iglolar, donmuş şelale, buz kemeri, ren geyiği sürüsü, fenerli çam ════════
// Her biri bir kez ekran dışı tuvale boyanır (2× çözünürlük; köken: alt orta = tepeciğin üstü); karede yalnız resim + birkaç ışık.
const DN7_MANZ_YER=[[60,'iglo'],[95,'fcam'],[128,'koy'],[165,'geyik'],[200,'kemer'],[262,'selale'],[295,'iglo'],[320,'koy'],
 [360,'selale'],[395,'geyik'],[430,'kemer'],[455,'fcam'],[485,'koy'],[515,'kemer'],[545,'geyik']];
function dn7ManzArt(){
 // resimler ekrandaki boyutunda (cihaz pikseli 1:1) boyanır: karede küçültme yok (ucuz ve net); ekran ölçeği değişirse yenilenir
 const kk=Math.round(clamp(S*.9,.5,2.4)*20)/20;if(DN7.manz&&DN7.manzK===kk)return DN7.manz;DN7.manzK=kk;const M=DN7.manz={},R=rng(4242);
 const yeni=()=>{const cv=dn7Cv(Math.ceil(300*kk),Math.ceil(200*kk)),c=cv.getContext('2d');c.scale(kk,kk);c.translate(150,192);cv.isik=[];return [cv,c];};
 const el=(c,col,x,y,rx,ry)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,6.283);c.fill();};
 // kar köyü: dört küçük ev (karlı çatı, ışıklı pencere, baca), aralarında çamlar
 {const [cv,c]=yeni();dn7Cam(c,-70,2,50,DN7_CAMK[2],rng(11),false);dn7Cam(c,58,2,58,DN7_CAMK[2],rng(12),false);dn7Cam(c,128,2,42,DN7_CAMK[2],rng(13),false);
  const ev=(x,w,h,rh,col)=>{c.fillStyle=col;c.fillRect(x-w/2,-h,w,h+2);c.fillStyle='rgba(20,18,60,.28)';c.fillRect(x+w*.22,-h,w*.28,h+2);
   c.fillStyle='#3a2f5c';c.fillRect(x+w*.2,-h-rh*.95,6,rh*.7);el(c,'#eef3ff',x+w*.2+3,-h-rh*.95,5,2.5);
   c.fillStyle=col;c.beginPath();c.moveTo(x-w/2,-h+1);c.lineTo(x,-h-rh+4);c.lineTo(x+w/2,-h+1);c.closePath();c.fill();
   c.fillStyle='#b9c6f2';c.beginPath();c.moveTo(x-w/2-6,-h+4);c.lineTo(x,-h-rh+2);c.lineTo(x+w/2+6,-h+4);c.quadraticCurveTo(x,-h-rh*.5,x-w/2-6,-h+4);c.fill();
   c.fillStyle='#eef3ff';c.beginPath();c.moveTo(x-w/2-7,-h+1);c.lineTo(x,-h-rh-2);c.lineTo(x+w/2+7,-h+1);c.quadraticCurveTo(x,-h-rh*.62,x-w/2-7,-h+1);c.fill();
   const wy=-h*.52;for(const wx of w>50?[-w*.26,w*.06]:[-w*.14]){c.fillStyle='#ffd27a';c.fillRect(x+wx-4,wy-5,8,9);c.fillStyle='#fff0c0';c.fillRect(x+wx-4,wy-5,8,3);
    c.strokeStyle='#3a2f5c';c.lineWidth=1;c.strokeRect(x+wx-4,wy-5,8,9);cv.isik.push([x+wx,wy,'#ffc070',15]);}
   c.fillStyle='#2e2550';c.fillRect(x+w*.24,-13,7,14);el(c,'#e6edff',x,2,w*.72,4);};
  ev(-100,40,26,20,'#5a4a86');ev(-40,56,38,28,'#4d3f78');ev(26,44,30,22,'#5e4c8c');ev(90,52,34,26,'#4a3c74');M.koy=cv;}
 // iglolar: kar bloklarından kubbe, içi sıcak ışıklı giriş
 {const [cv,c]=yeni();
  const ig=(x,r)=>{const gr=c.createLinearGradient(x-r,0,x+r,0);gr.addColorStop(0,'#f6f9ff');gr.addColorStop(.6,'#cfdcfa');gr.addColorStop(1,'#93a6de');c.fillStyle=gr;c.beginPath();c.ellipse(x,2,r,r*.82,0,Math.PI,0);c.fill();
   c.save();c.beginPath();c.ellipse(x,2,r,r*.82,0,Math.PI,0);c.clip();c.strokeStyle='rgba(110,130,205,.5)';c.lineWidth=1;const bh=r*.82/5;
   for(let j=0;j<5;j++){const y=2-bh*j;c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.stroke();for(let q=-r+(j%2?r*.15:0);q<r;q+=r*.3){c.beginPath();c.moveTo(x+q,y);c.lineTo(x+q,y-bh);c.stroke();}}
   c.restore();const ex=x-r*.5,er=r*.38;
   c.fillStyle='#e4ecff';c.beginPath();c.ellipse(ex,2,er,er*1.08,0,Math.PI,0);c.fill();c.fillStyle='#ffb85c';c.beginPath();c.ellipse(ex,2,er*.64,er*.78,0,Math.PI,0);c.fill();
   c.fillStyle='#ffe6a8';c.beginPath();c.ellipse(ex,2,er*.36,er*.46,0,Math.PI,0);c.fill();cv.isik.push([ex,-er*.3,'#ffb060',r*.55]);
   el(c,'#ffffff',x+r*.1,2-r*.8,r*.4,2.2);el(c,'#e6edff',x,3,r*1.15,3.5);};
  dn7Cam(c,118,2,60,DN7_CAMK[2],rng(14),false);ig(56,34);ig(-46,50);M.iglo=cv;}
 // donmuş şelale: koyu kaya yamacı, ortasında buz sütunları, dibinde donmuş gölcük
 {const [cv,c]=yeni();
  c.fillStyle='#434a8e';c.beginPath();c.moveTo(-132,3);c.lineTo(-118,-70);c.lineTo(-92,-112);c.lineTo(-60,-126);c.lineTo(-34,-152);c.lineTo(34,-154);c.lineTo(62,-130);c.lineTo(96,-118);c.lineTo(120,-66);c.lineTo(134,3);c.closePath();c.fill();
  c.fillStyle='#333a7a';c.beginPath();c.moveTo(34,-154);c.lineTo(62,-130);c.lineTo(96,-118);c.lineTo(120,-66);c.lineTo(134,3);c.lineTo(60,3);c.lineTo(46,-80);c.closePath();c.fill();
  c.strokeStyle='#c4d0f6';c.lineWidth=5;c.lineJoin='round';c.lineCap='round';c.beginPath();c.moveTo(-121,-58);c.lineTo(-92,-112);c.lineTo(-60,-126);c.lineTo(-34,-152);c.lineTo(34,-154);c.lineTo(62,-130);c.lineTo(96,-118);c.lineTo(122,-56);c.stroke();
  const gr=c.createLinearGradient(0,-156,0,0);gr.addColorStop(0,'#f8fcff');gr.addColorStop(.5,'#c4e6fc');gr.addColorStop(1,'#8fc2f2');c.fillStyle=gr;
  c.beginPath();c.moveTo(-36,-156);c.lineTo(36,-156);c.quadraticCurveTo(40,-70,52,2);c.lineTo(-52,2);c.quadraticCurveTo(-40,-70,-36,-156);c.fill();
  c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1.6;for(let j=0;j<9;j++){const x=-30+j*7.5+R()*3;c.beginPath();c.moveTo(x,-152);c.lineTo(x*1.3,-8-R()*30);c.stroke();}
  c.strokeStyle='rgba(90,140,220,.45)';c.lineWidth=1.2;for(let j=0;j<7;j++){const x=-26+j*8.5;c.beginPath();c.moveTo(x,-140+R()*30);c.lineTo(x*1.3,-30-R()*20);c.stroke();}
  el(c,'#f6faff',0,-156,44,7);el(c,'#a9d4f7',0,3,80,6.5);el(c,'#eaf6ff',-12,1.5,40,2.2);cv.isik.push([0,-90,'#9fd0ff',36]);M.selale=cv;}
 // buz kemeri: yarı saydam mavi kemer, dibinde buz kristalleri
 {const [cv,c]=yeni();const gr=c.createLinearGradient(-80,-130,80,0);gr.addColorStop(0,'#eefbff');gr.addColorStop(.5,'#a6dcf8');gr.addColorStop(1,'#6f9be6');c.fillStyle=gr;
  c.beginPath();c.moveTo(-94,3);c.quadraticCurveTo(-86,-152,6,-140);c.quadraticCurveTo(98,-128,92,3);c.lineTo(58,3);c.quadraticCurveTo(62,-96,4,-102);c.quadraticCurveTo(-52,-106,-58,3);c.closePath();c.fill();
  c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=2.2;c.beginPath();c.moveTo(-86,-20);c.quadraticCurveTo(-78,-138,4,-132);c.stroke();
  c.strokeStyle='rgba(70,110,210,.4)';c.lineWidth=1.2;c.beginPath();c.moveTo(-74,-62);c.lineTo(-54,-44);c.moveTo(30,-130);c.lineTo(38,-99);c.moveTo(88,-50);c.lineTo(62,-42);c.moveTo(-30,-134);c.lineTo(-24,-104);c.stroke();
  const kr=(x,h,w,e)=>{c.fillStyle='#dcf2ff';c.beginPath();c.moveTo(x-w,3);c.lineTo(x+e,-h);c.lineTo(x+w,3);c.closePath();c.fill();c.fillStyle='rgba(110,150,230,.5)';c.beginPath();c.moveTo(x+e,-h);c.lineTo(x+w,3);c.lineTo(x+e*.5,3);c.closePath();c.fill();};
  kr(-120,46,10,-4);kr(-106,28,8,3);kr(114,54,11,5);kr(130,30,8,-2);kr(-8,24,7,0);kr(8,15,5,2);
  el(c,'#f6faff',4,-140,26,4);cv.isik.push([0,-122,'#cfeeff',46],[114,-50,'#cfeeff',20],[-120,-42,'#cfeeff',18]);M.kemer=cv;}
 // ren geyiği sürüsü: tepenin üstünde sakin duran koyu mavi siluetler (biri yavru)
 {const [cv,c]=yeni();
  const ren=(x,s,yon)=>{c.save();c.translate(x,2);c.scale(s*yon,s);c.fillStyle='#252d6a';
   c.beginPath();c.ellipse(0,-24,19,9.5,0,0,6.283);c.fill();for(const lx of [-14,-9,9,14])c.fillRect(lx-1.6,-20,3.2,20);
   c.beginPath();c.moveTo(11,-30);c.lineTo(20,-45);c.lineTo(27,-42);c.lineTo(19,-21);c.closePath();c.fill();
   c.beginPath();c.ellipse(25,-45,7.5,4.6,.25,0,6.283);c.fill();c.beginPath();c.ellipse(-19,-27,3,2.2,0,0,6.283);c.fill();
   c.strokeStyle='#252d6a';c.lineWidth=1.8;c.lineCap='round';c.beginPath();
   c.moveTo(22,-48);c.quadraticCurveTo(16,-60,22,-70);c.moveTo(18,-58);c.lineTo(11,-64);c.moveTo(19,-64);c.lineTo(14,-72);
   c.moveTo(25,-49);c.quadraticCurveTo(31,-60,27,-71);c.moveTo(29,-60);c.lineTo(35,-66);c.stroke();
   c.fillStyle='rgba(175,195,255,.55)';c.beginPath();c.ellipse(-2,-32,14,2,0,0,6.283);c.fill();c.restore();};
  ren(-104,.8,1);ren(-54,1,1);ren(-10,.55,1);ren(42,1.05,-1);ren(100,.85,1);M.geyik=cv;}
 // fenerli çam: büyük karlı çam, dallarında renk renk küçük fenerler, tepesinde yıldız
 {const [cv,c]=yeni();dn7Cam(c,-84,2,70,DN7_CAMK[2],rng(21),false);dn7Cam(c,88,2,84,DN7_CAMK[2],rng(22),false);dn7Cam(c,0,2,176,DN7_CAMK[3],rng(27),true);
  const rk=['#ffd27a','#ff9fc8','#8fe8ff','#b8ff9e'];
  for(let j=0;j<13;j++){const u=j/12,y=-26-u*126,hw=(1-u*.82)*40,x=(j%2?1:-1)*hw*(.3+R()*.55);
   el(c,rk[j%4],x,y,3.6,4.4);el(c,'#ffffff',x-.9,y-1.3,1.2,1.5);if(j%2===0)cv.isik.push([x,y,rk[j%4],13]);}
  el(c,'#fff2b0',0,-168,4.5,4.5);cv.isik.push([0,-168,'#fff2b0',20]);M.fcam=cv;}
 // ışık hâleleri resme bir kez basılır (karede yalnız iki göz kırpan ışık çizilir); buz, kuzey ışığının yeşil-pembe rengini alır
 for(const k in M){const cv=M[k],c=cv.getContext('2d');
  if(k==='selale'||k==='kemer'){c.globalCompositeOperation='source-atop';for(const [x,y,r,col] of [[-30,-80,110,'125,255,196'],[40,-40,90,'255,143,208']]){const gr=c.createRadialGradient(x,y,2,x,y,r);gr.addColorStop(0,'rgba('+col+',.3)');gr.addColorStop(1,'rgba('+col+',0)');c.fillStyle=gr;c.fillRect(x-r,y-r,r*2,r*2);}}
  c.globalCompositeOperation='lighter';
  for(const I of cv.isik){const r=I[3],col=dn7Rgb(I[2]),gr=c.createRadialGradient(I[0],I[1],0,I[0],I[1],r);gr.addColorStop(0,'rgba('+col+',.5)');gr.addColorStop(.4,'rgba('+col+',.2)');gr.addColorStop(1,'rgba('+col+',0)');c.fillStyle=gr;c.fillRect(I[0]-r,I[1]-r,r*2,r*2);}
  c.globalCompositeOperation='source-over';}
 return M;
}
function dn7ManzCiz(M,tm,bx,by){
 const cv=dn7ManzArt()[M.t],gc=1-DN7.sabah;
 g.fillStyle='#a8bce6';g.beginPath();g.ellipse(bx,by+5,150,14,0,0,6.283);g.fill();
 g.drawImage(cv,bx-135,by-167,270,180);
 const L=cv.isik,n=L.length;if(gc<.03||!n)return;g.globalCompositeOperation='lighter';
 for(let q=0;q<2;q++){const u=tm*.6+q*.5,I=L[(Math.floor(u)*3+q+(M.x|0))%n];dn7Glow(I[2],bx+I[0]*.9,by+6+I[1]*.9,I[3]*1.2,I[3]*1.2,.6*Math.sin((u-Math.floor(u))*Math.PI)*gc);}
 g.globalCompositeOperation='source-over';
}
// uzak kulübe: orta orman katmanında, belirli dünya noktalarına (DEKOR7.kulube) eşlenir; pencereler titrer, bacadan duman
function dn7Kulube(tm,vw,vh,f,base){
 const F=DN7.fx,D7=typeof DEKOR7!=='undefined'?DEKOR7:null,ax=D7&&D7.kulube?D7.kulube.x:236*T;
 if(!DN7.manzL){DN7.manzL=[{x:ax,t:null},{x:25*T,t:null}];for(const [q,t] of DN7_MANZ_YER)DN7.manzL.push({x:q*T,t});}
 for(const M of DN7.manzL){const A=M.x,sx=vw*.5+(A-(cam.x+VW*.5))*f;if(sx<-160||sx>vw+160)continue;
  const k=.6,bx=sx,by=base-185;g.fillStyle='#88a0d4';g.beginPath();g.ellipse(bx,by+95,190,100,0,Math.PI,0);g.fill();g.fillStyle='#5c74aa';g.fillRect(bx-190,by+94,380,120);g.fillStyle='#a8bce6';g.beginPath();g.ellipse(bx,by+2,95,12,0,0,6.283);g.fill();
  if(M.t){dn7ManzCiz(M,tm,bx,by);g.globalAlpha=.3;g.drawImage(F.pus[1],bx-176,base-150,352,170);g.globalAlpha=1;continue;}
  g.drawImage(F.kulube,bx-120*k,by-180*k,240*k,190*k);
  g.globalCompositeOperation='lighter';
  for(const wx of [-34,30]){const fl=.85+.15*Math.sin(tm*5+wx)*Math.sin(tm*7.7+wx*.3);dn7Glow('#ffc070',bx+wx*k,by-50*k,30*k,24*k,.85*fl);}
  dn7Glow('#ffb060',bx,by-30*k,170*k,80*k,.28);
dn7Glow('#ff9fb0',bx,by+6,150*k,26*k,.22);dn7Glow('#ffd27a',bx+14*k,by-30*k,8,8,.6);g.globalCompositeOperation='source-over';
  // pencerelerden ve kapıdan karın üstüne düşen sıcak ışık havuzları (beyaz karda toplamalı ışık görünmez → normal karışımla
  // turuncu-altın renk verilir; gece, sabahla söner)
  {const gc=1-DN7.sabah;if(gc>.02){for(const wx of [-34,30]){const fl=.9+.1*Math.sin(tm*4.3+wx);dn7Glow('#ffa860',bx+wx*k*1.2,by+8,40*k,7,.5*fl*gc);dn7Glow('#ffd08a',bx+wx*k*1.1,by+7,16*k,3.5,.45*fl*gc);}
   dn7Glow('#ffb468',bx+2,by+6,22*k,4.5,.4*gc);}}
  // baca dumanı: büyüdükçe söner, rüzgârla sağa
  const cx=bx+38*k,cy=by-132*k,rz=dn7RuzgarHiz(tm);
  for(let j=0;j<5;j++){const u=(tm*.07+j/5)%1,px=cx+u*(20+rz*3)+Math.sin(u*6+j)*3,py=cy-u*70,r=(4+u*16),al=Math.sin(u*Math.PI)*.35*(1-DN7.sabah*.5);
   g.globalAlpha=al;g.drawImage(DN7.sabah>.5?F.dumanS:F.duman,px-r,py-r,r*2,r*2);}
  // orman pusu kulübenin tepeciğinin üstünde de (şeride basılı pus onun arkasında kaldı); pus yatayda düz olduğundan aynı sonuç
  g.globalAlpha=.3;g.drawImage(F.pus[1],bx-176,base-150,352,170);
  g.globalAlpha=1;}
}
function dn7Background(tm){
 if(!dn7Ready())return;dn7Sky();dn7FxArt();dn7Durum();DN7.kare++;
 g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
 dn7Backdrop(tm);
}

// ════════ Dünya: zemin parçaları + buz yansıması + parıltılar + ayak izleri + dallardan kar dökülmesi ════════
function dn7Gol(tm){
 const B=dn7Buz();if(cam.x+VW<B.x0||cam.x>B.x1)return;
 const vw=W/S,vh=H/S,ly=B.y-cam.y,lx0=B.x0-cam.x,lw=B.x1-B.x0,gece=1-DN7.sabah*.9;
 g.setTransform(S,0,0,S,0,0);g.save();g.beginPath();g.rect(lx0,ly+2,lw,Math.min(320,vh-ly+10));g.clip();
 // karşı kıyının çam ormanı ve gökyüzü / kuzey ışığının ters yansıması (buzda soluk)
 {const f=DN7_OF[2],base=DN7_OB[2]-cam.y*DN7_OY[2],off=((cam.x*f)%DN7_OW+DN7_OW)%DN7_OW;g.save();g.translate(0,ly);g.scale(1,-.55);g.globalAlpha=.22;
  for(let x=-off;x<vw;x+=DN7_OW)g.drawImage(dn7Orman(2),x,-DN7_OH+(base-ly)*0,DN7_OW,DN7_OH);g.restore();g.globalAlpha=1;}
 g.globalCompositeOperation='lighter';
 if(DN7.aurBuf&&gece>.02){g.save();g.translate(0,ly);g.scale(1,-.42);g.globalAlpha=.42*gece;g.drawImage(DN7.aurBuf,0,0,DN7_AW,DN7_AH,0,-vh*.78,vw,vh*.78);g.restore();}
 // ay ve fenerlerin uzun yansımaları
 dn7Glow('#dfe6ff',vw*.8,ly+30,24,70,.16*gece);
 for(const Lt of DN7.lit){if(Lt.x<B.x0-200||Lt.x>B.x1+200)continue;const on=smooth(clamp((now-Lt.t)/1.5,0,1));dn7Glow(DN7_AUR[Lt.ci],Lt.x-cam.x,ly+40,22,90,on*.3);}
 // yavaş kayan parlak buz süpürmeleri
 for(let j=0;j<3;j++){const u=((tm*.03+j/3)%1),x=lx0+u*lw;dn7Glow('#ffffff',x,ly+6,110,5,.18*Math.sin(u*Math.PI));dn7Glow('#cfe4ff',x+30,ly+60,70,26,.06*Math.sin(u*Math.PI));}
 g.restore();g.globalCompositeOperation='source-over';g.globalAlpha=1;
}
function dn7Parilti(tm){
 // yüzeydeki kar kristalleri: sütun başına 3 sabit nokta; yalnız ışıldayanı çizilir. Işığa (fener, kuzey ışığı) yakın daha çok.
 const F=DN7.fx,L=Math.floor(cam.x/T)-1,Rr=Math.ceil((cam.x+VW)/T)+1,sb=DN7.sabah,genel=.35+DN7.renk*.4+DN7.fin*.3+sb*.55,spr=sb>.35?F.pariltiA:F.parilti;
 g.globalCompositeOperation='lighter';
 // ay ışığında karın yüzeyinde ince, yavaş göz kırpan pırıltılar (sütun başına 2 sabit nokta; sabahta altın)
 const ince=sb>.35?F.pariltiA:F.parilti;
 for(let q=L;q<=Rr;q++)for(let k=0;k<2;k++){const h=dn7Hash(q*5.31+k*7.7+.5),x=q*T+h*T,y=dn7Surface(x)+2+dn7Hash(q*2.9+k)*16;if(y>=1200)continue;
  const v=(.5+.5*Math.sin(tm*(.35+h*.5)+h*50))*(.5+sb*.5);if(v<.25)continue;const s2=1.4+v*1.4;g.globalAlpha=v*.7;g.drawImage(ince,x-s2,y-s2,s2*2,s2*2);}
 for(let q=L;q<=Rr;q++){const isik=dn7Isik(q*T)*.8+genel;for(let k=0;k<3;k++){const h=dn7Hash(q*3.17+k*11.3),x=q*T+h*T,y=dn7Surface(x)+(dn7Hash(q*7.1+k)*7)-1;if(y>=1200)continue;
  const sp=.6+h*1.4,ph=h*40,v=Math.pow(Math.max(0,Math.sin(tm*sp+ph)),14)*isik;if(v<.04)continue;const s=3+5*v;
  g.globalAlpha=v>1?1:v;g.drawImage(spr,x-s,y-s,s*2,s*2);
  if(DN7.renk>.1&&sb<.5){const col=DN7_AUR[(((q+k)%10)+10)%10];dn7Glow(col,x,y,s*2.2,s*2.2,v*.25*DN7.renk);}}}
 // platform karında da birkaç ışıltı
 for(const p of DN7.plat){if(p.x1<cam.x||p.x0>cam.x+VW)continue;for(let x=p.x0+10;x<p.x1;x+=26){const h=dn7Hash(x*.13+p.y),v=Math.pow(Math.max(0,Math.sin(tm*(.7+h)+h*30)),14)*genel;if(v<.05)continue;const s=3+4*v;g.globalAlpha=v>1?1:v;g.drawImage(F.parilti,x-s,p.y-s,s*2,s*2);}}
 g.globalAlpha=1;g.globalCompositeOperation='source-over';
}
function dn7Kristaller(tm){
 // buz kristali kümeleri: ışık gelince içten kendi renginde parlar, yavaş nabız
 g.globalCompositeOperation='lighter';
 for(const k of DN7.kris){if(k.x<cam.x-80||k.x>cam.x+VW+80)continue;const on=clamp(dn7Isik(k.x)*1.3,0,1),nb=.7+.3*Math.sin(tm*1.4+k.ph),col=DN7_AUR[k.ci];
  dn7Glow('#dff0ff',k.x,k.y-26,26,30,.12+.06*nb);dn7Glow(col,k.x,k.y-28,40,44,on*.45*nb);dn7Glow('#ffffff',k.x,k.y-34,10,14,on*.5*nb);}
 g.globalCompositeOperation='source-over';
}
// ── Ayak izleri: sabit havuz; izler yağan karla yavaşça dolar (soluklaşır, daralır) ──
const DN7_IZ_N=110,DN7_IZ=Array.from({length:DN7_IZ_N},()=>({x:0,y:0,t:-1e9,tip:'feza',yon:1,omur:30}));let dn7IzI=0;
const DN7_IZ_OMUR={feza:34,inis:34,yavru:26,geyik:30,kardan:36,top:40,kardanKay:30,kizak:30,kay:18};
function dn7Iz(x,y,tip,yon){
 if(!Number.isFinite(x)||!Number.isFinite(y))return;tip=tip||'feza';
 const B=dn7Buz();if(x>B.x0+20&&x<B.x1-20&&tip!=='kay'&&tip!=='kizak'&&tip!=='kardanKay')tip='kay';   // buzda iz değil, ince kayma çizgisi
 // yalnız karlı yüzeyde (yüzeyin hemen üstünde) iz bırak; havadaki çağrıları yüzeye oturt
 const sy=dn7Surface(x);let yy=y;if(Math.abs(y-sy)<14)yy=sy;else{const r=Math.floor((y+2)/T);if(!(cell(Math.floor(x/T),r)===2&&Math.abs(y-r*T)<10))return;yy=r*T;}
 const Z=DN7_IZ[dn7IzI];dn7IzI=(dn7IzI+1)%DN7_IZ_N;Z.x=x;Z.y=yy;Z.t=now;Z.tip=tip;Z.yon=yon||(typeof P!=='undefined'&&P.f)||1;Z.omur=DN7_IZ_OMUR[tip]||30;
}
function dn7Izler(){
 const F=DN7.fx,L=cam.x-60,Rr=cam.x+VW+60;if(!F.iz.kardan){F.iz.kardan=F.iz.inis;F.iz.kardanKay=F.iz.top;}
 for(let i=0;i<DN7_IZ_N;i++){const Z=DN7_IZ[i],age=now-Z.t;if(age<0||age>Z.omur||Z.x<L||Z.x>Rr)continue;
  const u=age/Z.omur,a=(1-u)*(1-u)*(Math.min(1,age*8)),spr=F.iz[Z.tip]||F.iz.feza,w=spr.width*.5,h=spr.height*.5*(1-u*.5);
  g.globalAlpha=a*.9;g.drawImage(spr,Z.x-w*.5,Z.y-h*.5+1,w,h);}
 g.globalAlpha=1;
}
// ── Dallardan kar dökülmesi: ara sıra görünen bir çamın dalından toz kar akar (sabit havuz) ──
const DN7_DOK_N=90,DN7_DOK=Array.from({length:DN7_DOK_N},()=>({x:0,y:0,vx:0,vy:0,t:-9,o:1,r:1}));let dn7DokI=0;
const DN7_PUF_N=6,DN7_PUF=Array.from({length:DN7_PUF_N},()=>({x:0,y:0,t:-9,s:1,r:20}));let dn7PufI=0;
function dn7Dokulme(tm,dt){
 const F=DN7.fx;
 if(now>DN7.dokT&&DN7.camlar){const hm=dn7Hamle(tm);DN7.dokT=now+(1.6+Math.random()*2.6)*(1-hm*.55);
  const ad=[];for(const A of DN7.camlar)if(A.x>cam.x+40&&A.x<cam.x+VW-40)ad.push(A);
  if(ad.length){const A=ad[(Math.random()*ad.length)|0],h=250*A.s,k=Math.floor(Math.random()*5),u=k/7,yy=dn7Surface(A.x)+10-h*.13-u*h*.8,tw=h*.34*(1-u*.82),s=Math.random()<.5?-1:1,x=A.x+s*tw*.85;
   const Pf=DN7_PUF[dn7PufI];dn7PufI=(dn7PufI+1)%DN7_PUF_N;Pf.x=x;Pf.y=yy+4;Pf.t=now;Pf.s=s;Pf.r=16+Math.random()*14;
   for(let j=0;j<16;j++){const Pq=DN7_DOK[dn7DokI];dn7DokI=(dn7DokI+1)%DN7_DOK_N;Pq.x=x+(Math.random()-.5)*14;Pq.y=yy+(Math.random()-.5)*6;Pq.vx=s*(8+Math.random()*16);Pq.vy=-10+Math.random()*30;Pq.t=now-j*.04;Pq.r=1.4+Math.random()*2.4;Pq.o=1;}}}
 g.globalCompositeOperation='source-over';const rzH=dn7RuzgarHiz(tm)*.7;
 // pudra bulutu: dökülen karın ardında açılıp rüzgârla sürüklenen, yavaşça sönen ince toz perdesi
 for(let i=0;i<DN7_PUF_N;i++){const Pf=DN7_PUF[i],age=now-Pf.t;if(age<0||age>3.4)continue;const u=age/3.4,r=Pf.r*(1+u*1.8);
  g.globalAlpha=Math.sin(Math.min(1,u*2.2)*Math.PI*.5)*(1-u)*.34;g.drawImage(F.buhar,Pf.x+Pf.s*(10+u*22)+rzH*age-r,Pf.y+u*46-r*.7,r*2,r*1.4);}
 for(let i=0;i<DN7_DOK_N;i++){const Pq=DN7_DOK[i],age=now-Pq.t;if(age<0||age>2.6)continue;
  const x=Pq.x+Pq.vx*age+Math.sin(age*3+i)*4+rzH*age*.6,y=Pq.y+Pq.vy*age+90*age*age,a=Math.min(1,age*6)*(1-age/2.6);if(dn7Surface(x)<y)continue;
  g.globalAlpha=a*.9;g.drawImage(F.tane,x-Pq.r*2,y-Pq.r*2,Pq.r*4,Pq.r*4);if(age<.5){g.globalAlpha=a*.25*(1-age*2);g.drawImage(F.buhar,x-14,y-10,28,20);}}
 g.globalAlpha=1;
}
function dn7World(tm){
 if(!dn7Ready())return;dn7Yapilar();dn7Terrain();
 dn7Gol(tm);
 g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);
 dn7Izler();dn7Kristaller(tm);dn7Parilti(tm);dn7Dokulme(tm);
 // fener ışık dalgası: yeni yanan fenerden yayılan renkli yumuşak halka ve göğe yükselen ışık sütunu
 g.globalCompositeOperation='lighter';
 // yanan fenerlerin karda kalıcı sıcak (turuncu-pembe) yansıması ve kendi renginde hâlesi
 for(const Lt of DN7.lit){if(Lt.x<cam.x-300||Lt.x>cam.x+VW+300)continue;const on=smooth(clamp((now-Lt.t)/1.5,0,1)),nb=.85+.15*Math.sin(tm*1.7+Lt.x),sy=dn7Surface(Lt.x);
  dn7Glow('#ffb890',Lt.x,sy+2,150,26,on*.3*nb);dn7Glow('#ff9fc0',Lt.x,sy-4,70,14,on*.22*nb);dn7Glow(DN7_AUR[Lt.ci],Lt.x,Lt.y,120,120,on*.12*nb);}
 for(const Lt of DN7.lit){const age=now-Lt.t;if(age<0||age>3.2||Lt.x<cam.x-1000||Lt.x>cam.x+VW+1000)continue;const u=age/3.2,col=DN7_AUR[Lt.ci];
  dn7Glow(col,Lt.x,Lt.y+20,60+u*700,24+u*110,(1-u)*.16);
  const yu=Lt.y-u*u*900;for(let j=0;j<6;j++)dn7Glow(col,Lt.x+Math.sin(age*6+j)*3,yu+j*26,10-j,22,(1-u)*(1-j/6)*.5);}
 // finalde tepeye inen kuzey ışığı parıltısı
 if(DN7.fin>.01&&BOLUM.tepe){const nb=.8+.2*Math.sin(tm*1.5);dn7Glow(DN7_AUR[0],BOLUM.tepe.x,BOLUM.tepe.y-80,420,200,DN7.fin*.12*nb);dn7Glow(DN7_AUR[1],BOLUM.tepe.x+180,BOLUM.tepe.y-120,260,160,DN7.fin*.08*nb);}
 g.globalCompositeOperation='source-over';g.globalAlpha=1;
 dn7KarYansi(tm);
}
// kuzey ışıklarının karın ve buzun üstüne düşen hafif renkli yansıması: yavaşça gezinen dört geniş renk havuzu (normal karışım:
// beyaz karda toplamalı ışık görünmez)
const DN7_YANSI=[0,2,1,3];
function dn7KarYansi(tm){
 const gece=1-DN7.sabah;if(gece<.05)return;const a=(.2+DN7.guc*.2+DN7.fin*.08)*gece;
 for(let j=0;j<4;j++){const x=cam.x+VW*(j+.5)/4+Math.sin(tm*.17+j*2.1)*VW*.12,y=dn7Surface(x);if(y>=1200)continue;
  dn7Glow(DN7_AUR[DN7_YANSI[j]],x,y+9,VW*.2,26,a*(.75+.25*Math.sin(tm*.4+j*1.7)));}
}

// ════════ KAR YAĞIŞI: hiç durmayan, katmanlı (uzak ince, orta, yakın iri, en önde bulanık) — sabit havuz, önbellekli sprite ════════
// z: paralaks/derinlik. z<.75 dünyanın arkasında (Motes 1), z≥.75 her şeyin önünde (Motes 2); z≥1.35 bulanık iri taneler.
const dn7KR=rng(9191),DN7_KAR=[];
for(let i=0;i<300;i++){const kat=i<165?0:i<230?1:i<292?2:3,z=kat===0?.14+dn7KR()*.34:kat===1?.5+dn7KR()*.24:kat===2?.78+dn7KR()*.5:1.4+dn7KR()*.5;
 DN7_KAR.push({x:dn7KR(),y:dn7KR(),z,kat,r:kat===0?.55+dn7KR()*.6:kat===1?1+dn7KR()*.9:kat===2?1.7+dn7KR()*1.6:9+dn7KR()*9,
  sp:(12+30*Math.min(z,1.3))*(.75+dn7KR()*.5),amp:4+dn7KR()*12*(kat+1)*.6,fr:.4+dn7KR()*.9,ph:dn7KR()*6.283,ci:i%10,h:dn7KR(),dn:dn7KR()*6.283,yo:(i*.6180339)%1});}
function dn7IsikTopla(vw,vh){
 // kar tanelerini parlatan ışıklar (ekran koordinatı): Pırıl, yanan fenerler, finalde tepe
 const L=DN7.isiklar;let n=0;const ek=(x,y,r,col,a)=>{if(x<-r||x>vw+r||y<-r||y>vh+r)return;let q=L[n];if(!q)q=L[n]={x:0,y:0,r:0,col:'',a:0};q.x=x;q.y=y;q.r=r;q.col=col;q.a=a;n++;};
 if(typeof D!=='undefined'&&Number.isFinite(D.x))ek(D.x-cam.x,D.y-cam.y,150,'#e8d0ff',.9);
 for(let i=DN7.lit.length-1;i>=0&&n<7;i--){const Lt=DN7.lit[i];ek(Lt.x-cam.x,Lt.y-cam.y,170,DN7_AUR[Lt.ci],smooth(clamp((now-Lt.t)/1.2,0,1)));}
 if(DN7.fin>.01&&BOLUM.tepe)ek(BOLUM.tepe.x-cam.x,BOLUM.tepe.y-120-cam.y,420,DN7_AUR[0],DN7.fin*.6);
 DN7.nIsik=n;
}
function dn7Motes(tm,zMin,zMax){
 if(!dn7Ready())return;const F=dn7FxArt(),vw=W/S,vh=H/S,W2=vw+80,H2=vh+80,rz=dn7Ruzgar(tm),rzH=dn7RuzgarHiz(tm),fin=DN7.fin,R7=DN7.renk,yog=Math.min(1.1,dn7Yogun(tm)+fin*.3);
 if(zMin===0)dn7IsikTopla(vw,vh);
 const px=(Number.isFinite(P.rx)?P.rx:P.x)-cam.x,py=(Number.isFinite(P.ry)?P.ry:P.y)-cam.y-40,nI=DN7.nIsik,IL=DN7.isiklar;
 g.setTransform(S,0,0,S,0,0);g.globalCompositeOperation='source-over';
 const sabah=DN7.sabah;
 for(let i=0;i<DN7_KAR.length;i++){const p=DN7_KAR[i];if(p.z<zMin||p.z>=zMax)continue;
  const sal=Math.sin(tm*p.fr+p.ph)*p.amp,x=((p.x*W2*7+rz*(.35+p.z*.9)+sal-cam.x*p.z)%W2+W2)%W2-40,y=((p.y*H2*5+tm*p.sp-cam.y*p.z)%H2+H2)%H2-40;
  let a=p.kat===0?.42+.25*p.z:p.kat===1?.7:p.kat===2?.9:.3,r=p.r;
  const yk=(yog-p.yo)*12;if(yk<=0)continue;if(yk<1)a*=yk;
  if(p.kat===3){const dx=(x-px)/90,dy=(y-py)/110,d=dx*dx+dy*dy;if(d<1)a*=.15+.85*d;
   if(p.yo>.62)continue;   // en önde yalnız birkaç bulanık iri tane
   g.globalAlpha=a*(1-sabah*.3)*(.8+.2*Math.sin(tm*.7+p.ph));g.drawImage(F.bokeh[i&1],x-r*1.8,y-r*1.8,r*3.6,r*3.6);continue;}
  // ışığa yakın taneler parlar (uzak katman hariç)
  let b=0,bc='';if(p.kat>0)for(let j=0;j<nI;j++){const q=IL[j],dx=x-q.x,dy=y-q.y,d2=dx*dx+dy*dy,rr=q.r*q.r;if(d2<rr){const v=(1-d2/rr)*q.a;if(v>b){b=v;bc=q.col;}}}
  // finalde (ve biraz da kuzey ışıkları yandıkça) taneler ışık renklerini yansıtır
  const renkli=p.h<fin*.9+R7*.12;
  g.globalAlpha=Math.min(1,a+b*.4);
  const s=r*(2.2+b*.6);g.drawImage(renkli?F.taneR[p.ci]:F.tane,x-s,y-s,s*2,s*2);
  if(b>.08){g.globalCompositeOperation='lighter';dn7Glow(bc,x,y,r*6,r*6,b*.5);g.globalCompositeOperation='source-over';}
  else if(p.kat===2&&renkli&&fin>.2){g.globalCompositeOperation='lighter';dn7Glow(DN7_AUR[p.ci],x,y,r*5,r*5,.25*fin);g.globalCompositeOperation='source-over';}
 }
 g.globalAlpha=1;
}
// ── Nefes buharı: Feza ve Pırıl ara sıra küçük beyaz buhar bırakır (sabit havuz). Diğerleri dn7Nefes(x,y,yon,s) çağırabilir. ──
const DN7_NF_N=24,DN7_NF=Array.from({length:DN7_NF_N},()=>({x:0,y:0,yon:1,s:1,t:-9}));let dn7NfI=0;
function dn7Nefes(x,y,yon,s){if(!Number.isFinite(x)||!Number.isFinite(y))return;const N=DN7_NF[dn7NfI];dn7NfI=(dn7NfI+1)%DN7_NF_N;N.x=x;N.y=y;N.yon=yon||1;N.s=s||1;N.t=now;}
function dn7NefesCiz(tm){
 const F=DN7.fx;
 if(DURUM==='oyun'&&!P.fade){
  if(now>DN7.nefesT){DN7.nefesT=now+2.4+Math.random()*1.4;if(!P.ucus||P.ucus)dn7Nefes(P.x+(P.f||1)*13,P.y-64,P.f||1,1);}
  if(now>DN7.pirNefesT&&typeof D!=='undefined'&&Number.isFinite(D.x)){DN7.pirNefesT=now+3+Math.random()*2;dn7Nefes(D.x+(D.f||1)*24,D.y-2,D.f||1,.8);}}
 for(let i=0;i<DN7_NF_N;i++){const N=DN7_NF[i],age=now-N.t;if(age<0||age>1.6)continue;const u=age/1.6;
  for(let j=0;j<3;j++){const v=clamp(u*1.2-j*.12,0,1);if(v<=0)continue;const r=(4+v*14)*N.s,x=N.x+N.yon*(4+v*22+j*5)*N.s+dn7RuzgarHiz(tm)*v*.6,y=N.y-v*10*N.s-j*2;
   g.globalAlpha=Math.sin(v*Math.PI)*.38*(1-j*.25);g.drawImage(F.buhar,x-r,y-r,r*2,r*2);}}
 g.globalAlpha=1;
}
function dn7Petals(tm){
 if(!dn7Ready())return;dn7FxArt();g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);g.globalCompositeOperation='source-over';
 dn7NefesCiz(tm);
 // finalde tepeye yağan renkli ışık pulları
 if(DN7.fin>.01&&BOLUM.tepe){g.globalCompositeOperation='lighter';const ax=BOLUM.tepe.x,ay=BOLUM.tepe.y;
  for(let j=0;j<26;j++){const u=(tm*.07+j*.0385)%1,x=ax+Math.sin(j*2.3)*VW*.5+Math.sin(tm*.6+j)*30,y=ay-560+u*600;dn7Glow(DN7_AUR[j%10],x,y,9,9,DN7.fin*Math.sin(u*Math.PI)*.4);}
  g.globalCompositeOperation='source-over';}
 g.globalAlpha=1;
}
// ════════ Ön plan: alt köşelerde karlı çalılar / çam uçları (paralaks 1,1), üstte arada sarkan karlı dal ════════
const DN7_ONK={koyu:'#0c1030',orta:'#0f1a36',acik:'#152442',karG:'#3a4a86',kar:'#8c9cd4',parla:'#b0bce8'};
function dn7OnCalı(c,R,w,h){
 // ön plan: yumuşak kar tümseği ve içinden çıkan koyu çam uçları (yakın, silüet; karı ay ışığında soğuk mavi)
 for(let j=0;j<4;j++){const x=w*(.16+j*.22)+R()*20;dn7Cam(c,x,h*1.02,h*(.5+R()*.45),DN7_ONK,R,false);}
 const gr=c.createLinearGradient(0,h*.55,0,h);gr.addColorStop(0,'#8c9cd4');gr.addColorStop(.4,'#4c5c9c');gr.addColorStop(1,'#1c2454');c.fillStyle=gr;
 c.beginPath();c.moveTo(0,h);c.bezierCurveTo(w*.05,h*.78,w*.25,h*.62,w*.45,h*.66);c.bezierCurveTo(w*.62,h*.7,w*.78,h*.6,w*.92,h*.74);c.quadraticCurveTo(w*.98,h*.86,w,h);c.closePath();c.fill();
 c.strokeStyle='rgba(220,230,255,.55)';c.lineWidth=1.6;c.beginPath();c.moveTo(w*.04,h*.82);c.bezierCurveTo(w*.2,h*.65,w*.32,h*.63,w*.45,h*.665);c.bezierCurveTo(w*.6,h*.7,w*.76,h*.61,w*.9,h*.735);c.stroke();
}
function dn7Foreground(tm){
 if(!dn7Ready())return;const F=dn7FxArt(),vw=W/S,vh=H/S;
 if(!F.on){F.on=[0,1].map(v=>{const cv=dn7Cv(560,300),c=cv.getContext('2d');c.scale(2,2);dn7OnCalı(c,rng(811+v*31),280,150);return cv;});
  F.dal=(()=>{const cv=dn7Cv(460,190),c=cv.getContext('2d'),R=rng(4747);
   // yukarıdan sarkan karlı çam dalı: koyu dal, iğne demetleri, üstte kalın kar
   const yol=u=>[10+u*430,18+u*u*70];c.strokeStyle='#141838';c.lineWidth=7;c.lineCap='round';c.beginPath();for(let u=0;u<=1;u+=.05){const [x,y]=yol(u);u?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
   for(let k=0;k<26;k++){const u=k/25,[x,y]=yol(u),L=26+R()*22-u*8;c.strokeStyle=k%2?'#1a1f4c':'#20265a';c.lineWidth=2.2;
    for(let j=-3;j<=3;j++){const an=1.57+j*.22+(R()-.5)*.1;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(an)*L*.5+6,y+Math.sin(an)*L*.5,x+Math.cos(an)*L+4,y+Math.sin(an)*L);c.stroke();}}
   for(let k=0;k<22;k++){const u=(k+.5)/22,[x,y]=yol(u);c.fillStyle='rgba(90,104,190,.7)';c.beginPath();c.ellipse(x,y+3,14+R()*6,5,.12+u*.3,0,6.283);c.fill();c.fillStyle='#dfe6ff';c.beginPath();c.ellipse(x,y-2,13+R()*6,5.5+R()*2,.12+u*.3,0,6.283);c.fill();}
   for(let k=0;k<8;k++){const [x,y]=yol(.1+k*.11);c.fillStyle='rgba(214,232,255,.8)';c.beginPath();c.moveTo(x-2,y+20);c.lineTo(x,y+34+R()*14);c.lineTo(x+2,y+20);c.fill();}
   return cv;})();
  F.govde=(()=>{const cv=dn7Cv(360,720),c=cv.getContext('2d');dn7Cam(c,180,730,720,DN7_ONK,rng(919),true);return cv;})();}
 // kızak yolculuğunda ön plan dalı/çalıları çizilmez (hızlı kayışta göz yormasın, kızağın önünü kapatmasın)
 // (kızak başlarken/biterken ani yok olma değil: ~0,4 sn'de yumuşakça söner / belirir)
 const kzA=typeof KIZAK!=='undefined'&&KIZAK&&typeof KIZAK.aktif==='function'&&KIZAK.aktif();
 DN7.onA=DN7.onA===undefined?(kzA?0:1):DN7.onA+((kzA?0:1)-DN7.onA)*.08;if(Math.abs((kzA?0:1)-DN7.onA)<.01)DN7.onA=kzA?0:1;
 const kz7=DN7.onA<.01,onA=DN7.onA;
 // üstte arada sarkan karlı çam dalı (paralaks 1,15). Her dal kendi yerine bağlı (sallanma evresi sabit, kayarken sıçramaz);
 // dikeyde de kamerayla yumuşakça kayar: Feza aşağı inince dal yukarı çekilip çıkar, yükseğe çıkınca biraz (en çok 34) iner.
 if(!kz7){const fb=1.15,span=1700,j0=Math.floor((cam.x*fb-span*.62-40)/span),j1=Math.ceil((cam.x*fb+vw+470)/span);g.setTransform(S,0,0,S,0,0);
  for(let j=j0;j<=j1;j++){const xf=j*span+span*.62,x=xf-cam.x*fb;if(x<-470||x>vw+20)continue;const wx=xf/fb;
   let zy=0;for(let d=-200;d<=200;d+=100){const sz=dn7Surface(wx+d);if(sz<1200&&sz>zy)zy=sz;}
   const dy=zy?clamp((zy-cam.y-vh*.87)*1.15,-230,34):0,sw=Math.sin(tm*.5+j)*.015;if(dy<-215)continue;
   g.save();g.translate(x-40,-26+dy);g.rotate(sw);g.globalAlpha=.95*onA;g.drawImage(F.dal,0,0,460,190);g.restore();}
  g.globalAlpha=1;}
 // alt: yakın karlı çalılar, Feza'nın üstüne gelince saydamlaşır
 const fb=1.1,left=cam.x*fb-160,right=cam.x*fb+vw+160,px=(Number.isFinite(P.rx)?P.rx:P.x);g.setTransform(S,0,0,S,-cam.x*S*fb,0);
 // Çalılar dünyaya bağlı: tabanı, durduğu yerin zemininin ~135 birim altında (zeminin önünde) ve x'te de y'de de dünyadan biraz
 // hızlı kayar (paralaks 1,1). Feza yükseğe çıkınca zeminle birlikte yumuşakça aşağı kayıp çıkar, inince geri gelir; ekranın altına
 // yapışık değil, ani belirme/kaybolma yok. Feza yaklaştıkça yumuşakça (eşiksiz) biraz saydamlaşır.
 const yRef=vh*.85,fyb=1.1;
 if(!kz7)for(let q=Math.floor(left/640);q<=Math.ceil(right/640);q++){const R=rng(q*71+883),x=q*640+R()*180,wx=x/fb;if(wx>DN7_GAP0-100&&wx<DN7_GAP1+100)continue;const k=.55+R()*.25;
  let zy=0;for(let d=-80;d<=80;d+=40){const s=dn7Surface(wx+d);if(s<1200&&s>zy)zy=s;}if(!zy)continue;   // sabit: çevresindeki en alçak zemin
  const sy=Math.max(vh+6,yRef+(zy+118-cam.y-yRef)*fyb),hh=150*k*1.6;   // taban ekranın altından yukarı çıkmaz (sürekli, sıçramasız)if(sy-hh>vh+4)continue;
  const ya=smooth(clamp((Math.abs(wx-px)-90)/200,0,1));
  g.save();g.translate(x,sy);g.rotate(Math.sin(tm*.35+q)*.015);g.globalAlpha=(.5+.42*ya)*onA;g.drawImage(F.on[Math.abs(q)%2],-140*k*1.6,-hh,280*k*1.6,hh);
  g.restore();}
 g.globalAlpha=1;
 // ekran geneli: kuzey ışığının karın üstüne düşen renkli parıltısı ve sabah ışığı
 g.setTransform(S,0,0,S,0,0);g.globalCompositeOperation='lighter';
 const R7=DN7.renk,gece=1-DN7.sabah;if(R7>.02)dn7Glow(DN7_AUR[0],vw*.45,vh*.15,vw*.8,vh*.5,(.03+R7*.04+DN7.fin*.06)*gece);
 if(DN7.fin>.01)dn7Glow(DN7_AUR[1],vw*.75,vh*.1,vw*.5,vh*.4,DN7.fin*.05*gece);
 // fenerler yandıkça kuzey ışığı karın üstüne de düşer: zemin bandında yumuşak yeşil-turkuaz ve pembe yansıma (tek resim, ucuz)
 if(R7>.02){dn7Glow(DN7_AUR[0],vw*.35,vh*.86,vw*.75,vh*.3,R7*.15*gece);dn7Glow(DN7_AUR[5],vw*.8,vh*.9,vw*.5,vh*.24,R7*.09*gece);}
 if(DN7.sabah>.01)dn7Glow('#ffc8a0',vw*.6,vh*.8,vw*.9,vh*.6,DN7.sabah*.22);
 g.globalCompositeOperation='source-over';
 // sabah: önbellekteki soğuk lavanta kar da gün doğumunu alsın — alt yarıya yukarıdan sönen ılık şeftali-pembe örtü
 if(DN7.sabah>.01){if(!F.sabahOrt){const cv=dn7Cv(8,128),c=cv.getContext('2d'),gr=c.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(255,200,190,0)');gr.addColorStop(.45,'rgba(255,196,180,.55)');gr.addColorStop(1,'rgba(255,214,176,.9)');c.fillStyle=gr;c.fillRect(0,0,8,128);F.sabahOrt=cv;}
  g.globalAlpha=DN7.sabah*.36;g.drawImage(F.sabahOrt,0,vh*.42,vw,vh*.58+2);g.globalAlpha=1;}
}
// vinyet: ortası tamamen saydam (yarıçap ~83/126 içinde alfa 0) → yalnız dört kenar parçası çizilir (ekranın ~%58'i)
const DN7_VIG=[[0,0,200,16],[0,132,200,28],[0,16,42,116],[158,16,42,116]];
function dn7Vignette(){if(!dn7Ready())return;const F=dn7FxArt(),kx=W/200,ky=H/160;g.setTransform(1,0,0,1,0,0);g.globalAlpha=1-DN7.sabah*.6;
 for(const [x,y,w,h] of DN7_VIG){const dx=Math.round(x*kx),dy=Math.round(y*ky);g.drawImage(F.vig,x,y,w,h,dx,dy,Math.round((x+w)*kx)-dx,Math.round((y+h)*ky)-dy);}g.globalAlpha=1;}

// ════════ Isıtma: önbellekleri kareye yayarak hazırla (uyku girişi / karanlık altında) ════════
function dn7Isit(){
 if(!dn7Ready())return false;const p=DN7.prep;
 if(p===0){dn7Sky();DN7.prep++;return false;}
 if(p===1){dn7FxArt();dn7Yapilar();DN7.prep++;return false;}
 if(p<8){dn7Dag((p-2)>>1,(p-2)&1);DN7.prep++;return false;}
 if(p<11){dn7Orman(p-8);DN7.prep++;return false;}
 if(p<15){dn7Chunk(p-11);DN7.prep++;return false;}
 if(p<15+DN7_AUR.length){glow(DN7_AUR[p-15]);DN7.prep++;return false;}
 for(const c of ['#eef2ff','#e8d0ff','#ffffff','#dfe6ff','#cfe4ff','#dff0ff','#ffc070','#ffb060','#ffd27a','#ffd8a8','#fff4d8','#ffc8a0','#ffa860','#ffd08a','#ffb468'])glow(c);
 DN7.warm=true;return true;
}
