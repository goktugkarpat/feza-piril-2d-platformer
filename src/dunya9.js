/* dunya9.js — Pırıl'ın Ejderha Vadisi'nin dünyası (Bölüm 9). Yemyeşil, büyülü bir vadi ve sıcak bir gün: girişte sabahın tatlı
   ışığı, şelale ormanında serin yeşim-turkuaz, uçan adacıklarda şeftali-pembe gök, yolculukta gün batımı ve bulut denizi, dağın
   tepesindeki yuvada mor-altın alacakaranlık ve yıldızlar. Uzakta yumuşacık dağlar, en yüksek dağın tepesinde sönük Ejderha
   Kalbi'nin soluk ışığı; gökte ağır ağır kanat çırpan, tombul, sevimli yetişkin ejderhalar; göğün ortasında süzülen uçan adacıklar.
   Yakında dev çiçekli ağaçlar (taç yaprakları süzülür), kıvrık eğrelti otları, yosunlu yuvarlak kayalar, yaprak döşeli ejderha
   yuvaları, çok katmanlı şelaleler (su perdesi, köpük, ışıltılı su tozu), taş basamaklı dere, altından kökler ve minik şelaleler
   sarkan uçan adacıklar, Büyükanne'nin fenerli, kristalli, battaniyeli dağ yuvası. Havada ışık tozu (BÖCEK YOK).
   Pul çiçekleri açıldıkça ve yavrular çıktıkça (dn9IsikOrani) vadi solgunluktan sıyrılır, renklenir ve ısınır.
   Mimari dunya8.js ile aynı: büyük resimler yalnız önbellek tuvallerinde bir kez boyanır (gök, dağ, tepe şeritleri, zemin parçaları,
   sprite'lar); karede yeni gradyan/filtre/gölge yok; parçacık havuzları sabit. Zemin parçalarının rengi yerin gün saatine göre
   (konuma bağlı) bir kez boyanır; uzak şeritlerin gündüz ve akşam iki boyası vardır, kamera ilerledikçe biri ötekine geçer.
   oyun.js kancaları (omDr 'dn9' öneki): dn9Background dn9Motes dn9World dn9Petals dn9Foreground dn9Vignette, ısıtma dn9Isit.
   Diğer modüllere: dn9IsikOrani() 0..1, dn9Isik(x) yerel ışık 0..1, dn9IsikEkle(x, y, renk, uzaklik) ışık dalgası,
   dn9Iz(x, y, tip) çimende ışık tozu / çiçek izi, dn9Surface(x) zemin, dn9Gunes() güneşin dünya konumu {x, y, r},
   dn9Gun() günün evresi 0..4 (0 sabah, 1 şelale serinliği, 2 şeftali-pembe, 3 gün batımı, 4 alacakaranlık). */
'use strict';
const DN9={gok:[],serit:{},serFx:{},chunks:new Map(),prep:0,fx:{},renk:0,fin:0,finT:null,dorukT:null,tamT:null,lit:[],kare:0,zeminKare:-9,
 yap:null,gun:0,gunHazir:false,pulSay:0,yavruSay:0,gunes:{x:0,y:0,r:60,sx:0,sy:0,sr:60},tab:null,ort:null,gokAlt:0,yk:0,izX:undefined,izDis:0,
 siluetS:0,onBos:null,dag:[],durumT:null,adim:0};
const dn9Hash=v=>{const s=Math.sin(v*127.1+311.7)*43758.5453;return s-Math.floor(s);};   // sabit sözde rastgele (0..1)
// palet (sözleşme): zümrüt-yeşim yeşilleri, Pırıl leylağı, fıstık yeşili, şeftali, gül, gök turkuazı, altın; kalp: lila-altın-nane
const DN9_ZUMRUT='#3fbf8a',DN9_YESIM='#6fd8a8',DN9_KOYU='#2e8f6f',DN9_LILA='#b89cff',DN9_LILA2='#d9c8ff',DN9_FISTIK='#c8f08a',
 DN9_SEFTALI='#ffc29a',DN9_GUL='#ff9fc0',DN9_TURKUAZ='#7fe0f0',DN9_ALTIN='#ffd27a';
const DN9_KALP=['#c8a8ff','#ffd27a','#9ff0c8'];   // Ejderha Kalbi ışıması (gökkuşağı değil)
const DN9_TOZ=['#ffe8a8','#d9c8ff','#b8ffd8','#ffd0e0','#fff4d0','#c8f08a','#ffc29a','#bfefff'];   // ışık tozu renkleri
const DN9_CICEK=['#ff9fc0','#ffd27a','#b89cff','#ffffff','#ffc29a','#9fd8ff','#ffb0d8','#fff0a0'];   // çayır çiçekleri
const DN9_GAP0=605*T,DN9_GAP1=761*T;   // Büyükanne yolculuğu boşluğu (zemin yok; aşağıda bulut denizi)
const dn9Cv=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c;};
const dn9Mix=(a,b,t)=>{const A=hex(a),B=hex(b);return '#'+[0,1,2].map(i=>Math.round(lerp(A[i],B[i],t<0?0:t>1?1:t)).toString(16).padStart(2,'0')).join('');};
const dn9Rgb=h=>{const a=hex(h);return a[0]+','+a[1]+','+a[2];};
function dn9Ready(){return W>0&&H>0&&S>0&&typeof cam!=='undefined'&&Number.isFinite(cam.x)&&Number.isFinite(cam.y);}
function dn9Glow(col,x,y,rx,ry,a){if(a<=.003)return;g.globalAlpha=a>1?1:a;g.drawImage(glow(col),x-rx,y-ry,rx*2,ry*2);g.globalAlpha=1;}
const dn9V9=()=>typeof V9!=='undefined'&&V9?V9:null;
// zemin yüzeyi (dünya y'si); yolculuk boşluğunda zemin yok (ROWS*T)
function dn9Surface(x){if(x>=DN9_GAP0&&x<DN9_GAP1)return ROWS*T;const c=Math.max(0,Math.min(COLS-1,Math.floor(x/T)));return topOf(c)*T;}
// bölge adı (BOLUM.bolgeler): giris cayir meyve selale kanat adalar kolye yolculuk yuva
function dn9Bolge(x){const B=typeof BOLUM!=='undefined'&&BOLUM.bolgeler;if(B){for(let i=0;i<B.length;i++)if(x>=B[i].x0&&x<B[i].x1)return B[i].ad;if(B.length&&x>=B[B.length-1].x1)return B[B.length-1].ad;}return 'giris';}   // dünyanın sağ ucundan ötesi yuva sayılır (gece yuvasında sabah dalları çıkmasın)
const dn9Yk=(c,x,y,w,h,r)=>{c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);};

// ════════ Günün saati: konuma bağlı (0 sabah → 1 şelale serinliği → 2 şeftali-pembe → 3 gün batımı → 4 alacakaranlık) ════════
const DN9_GUNX=[[0,0],[190*T,.18],[236*T,.5],[262*T,1],[372*T,1],[404*T,1.35],[440*T,1.92],[520*T,2.1],[560*T,2.3],[602*T,2.6],[640*T,2.8],
 [690*T,3],[735*T,3.3],[768*T,3.75],[800*T,4]];
function dn9GunX(x){
 const L=DN9_GUNX;if(x<=L[0][0])return L[0][1];
 for(let i=1;i<L.length;i++)if(x<L[i][0]){const a=L[i-1],b=L[i];return lerp(a[1],b[1],smooth((x-a[0])/(b[0]-a[0])));}
 return L[L.length-1][1];
}
// akşam ağırlığı (uzak şeritlerin akşam boyası ve zeminin mor-altın tonu)
const dn9AksamK=gun=>smooth(clamp((gun-2.2)/1.6,0,1));
// konuma göre renk tonu (zemin parçaları ve yakın dekor bir kez bu tonla boyanır): şelalede serin turkuaz, adalarda şeftali,
// akşamda mor-altın
function dn9Ton(col,x){
 const gun=dn9GunX(x),tk=clamp(1-Math.abs(gun-1)*1.1,0,1),sk=clamp(1-Math.abs(gun-2)*1.2,0,1),ak=dn9AksamK(gun);
 let c=col;if(tk>0)c=dn9Mix(c,'#4ec8c0',tk*.14);if(sk>0)c=dn9Mix(c,'#ffb4a0',sk*.1);
 if(ak>0){c=dn9Mix(c,'#4a3478',ak*.4);c=dn9Mix(c,'#ffb070',ak*.06);}
 return c;
}
function dn9Gun(){return DN9.gun;}

// ════════ Işık durumu: açılan pul çiçekleri + çıkan yavrular → yerel ılık ışık dalgası + genel renklenme; final → hepsi ════════
function dn9IsikEkle(x,y,col,uzak){
 if(!Number.isFinite(x))return;if(DN9.lit.length>=40)DN9.lit.shift();
 DN9.lit.push({x,y:Number.isFinite(y)?y:dn9Surface(x)-40,t:now,col:col||DN9_ALTIN,r:uzak||1000});
}
function dn9OlayX(e){const o=e&&e.o;return o&&Number.isFinite(o.x)?o.x:e&&Number.isFinite(e.x)?e.x:(typeof P!=='undefined'?P.x:0);}
function dn9OlayY(e){const o=e&&e.o;return o&&Number.isFinite(o.y)?o.y-40:e&&Number.isFinite(e.y)?e.y-40:NaN;}
OLAY.on('pulCicek',e=>{DN9.pulSay++;dn9IsikEkle(dn9OlayX(e),dn9OlayY(e),DN9_KALP[DN9.pulSay%3],1000);});
OLAY.on('yavruCikti',e=>{DN9.yavruSay++;dn9IsikEkle(dn9OlayX(e),dn9OlayY(e),'#ffd8a0',800);});
for(const ad of ['meyveBitti','kanatBitti','kolyeBitti'])OLAY.on(ad,e=>{dn9IsikEkle(dn9OlayX(e&&(e.o||Number.isFinite(e.x))?e:null),NaN,'#ffe0a0',1300);});
OLAY.on('ejderFinal',()=>{if(DN9.finT===null)DN9.finT=now;});
OLAY.on('ejderDoruk',()=>{DN9.dorukT=now;});
OLAY.on('ejderTamam',()=>{if(DN9.tamT===null)DN9.tamT=now;});
function dn9Durum(){
 // 60 Hz görünümünü koruyan zaman temelli geçiş: yüksek tazelemede gök/ışık iki kat hızlanmaz.
 const adim=DN9.durumT===null?0:clamp((now-DN9.durumT)*60,0,15);DN9.durumT=now;DN9.adim=adim;
 const v=dn9V9(),pt=v&&v.pulTop?v.pulTop:10,yt=v&&v.yavruTop?v.yavruTop:6;
 const pu=v?Math.max(v.pul||0,0):0,ya=v?Math.max(v.yavru||0,0):0;
 // olay kaçtıysa (test ya da kayıttan devam): açılmış çiçekleri ışık kaynağına ekle
 if(v&&pu>DN9.pulSay){let n=0;for(const o of NESNELER)if(o.tip==='pulCicek'&&(o.acik||o.done||o.acildi)&&!DN9.lit.some(L=>Math.abs(L.x-o.x)<5)){dn9IsikEkle(o.x,o.y-40,DN9_KALP[n%3]);n++;}DN9.pulSay=pu;}
 if(v&&ya>DN9.yavruSay)DN9.yavruSay=ya;
 if(v&&v.final&&DN9.finT===null)DN9.finT=now;
 DN9.fin=DN9.finT===null?0:smooth(clamp((now-DN9.finT)/4,0,1));
 const f=clamp(pu/pt,0,1)*.5+clamp(ya/yt,0,1)*.5;
 // mini oyunlar ve yolculuk da vadiyi biraz daha aydınlatır
 const ek=v?((v.meyve?1:0)+(v.kanat?1:0)+(v.kolye?1:0)+(v.binis?1:0))*.025:0;
 const hedef=Math.max(Math.min(1,f*.9+ek),DN9.fin);DN9.renk+=(hedef-DN9.renk)*(1-Math.pow(.97,adim));if(adim>0&&Math.abs(hedef-DN9.renk)<.002)DN9.renk=hedef;
 // günün saati: kameranın ortası (yumuşatılmış: ışınlanmada gök sıçramaz)
 const BI=dn9Binis();let hg=dn9GunX(cam.x+VW*.5);if(BI)hg=lerp(2.3,3.7,BI.u);
 if(!DN9.gunHazir){DN9.gun=hg;DN9.gunHazir=true;}else DN9.gun+=(hg-DN9.gun)*(1-Math.pow(.96,adim));
 // yükseklik: yolculukta ve dağın tepesinde uzak dünya aşağıda kalır, bulut denizi görünür
 const cx=cam.x+VW*.5,yk=BI?1:smooth(clamp((cx-(DN9_GAP0-500))/900,0,1));DN9.yk+=(yk-DN9.yk)*(1-Math.pow(.95,adim));if(adim>0&&Math.abs(DN9.yk-yk)<.002)DN9.yk=yk;
}
// Büyükanne yolculuğu (buyukanne.js BINIS9): etkinse {u: ilerleme 0..1, gb: gün batımı / siluet anı 0..1}
const DN9_BI={u:0,gb:0};
function dn9Binis(){if(typeof BINIS9==='undefined'||!BINIS9||typeof BINIS9.aktif!=='function')return null;let ak=false;try{ak=!!BINIS9.aktif();}catch(e){ak=false;}if(!ak)return null;
 try{DN9_BI.u=clamp(+BINIS9.ilerleme()||0,0,1);}catch(e){DN9_BI.u=0;}try{DN9_BI.gb=typeof BINIS9.gunbatimi==='function'?clamp(+BINIS9.gunbatimi()||0,0,1):0;}catch(e){DN9_BI.gb=0;}return DN9_BI;}
// genel ışık oranı (yumuşatılmış; herkes kullanabilir)
function dn9IsikOrani(){return clamp(DN9.renk,0,1);}
// yerel ışık 0..1: açılan her çiçekten saniyede 420 birim yayılan, ~1000 birimde duran yumuşak dalga (sütun başına karede bir kez)
const DN9_ISIK_C=new Float32Array(1024),DN9_ISIK_T=new Float64Array(1024).fill(-1);
function dn9Isik(x){
 const c=Math.max(0,Math.min(1023,Math.floor(x/T)));if(DN9_ISIK_T[c]===now)return DN9_ISIK_C[c];DN9_ISIK_T[c]=now;
 let a=DN9.renk*.35;const xx=c*T+T/2;
 for(let i=0;i<DN9.lit.length;i++){const L=DN9.lit[i],age=now-L.t;if(age<0)continue;const reach=Math.min(age*420,L.r),v=clamp((reach-Math.abs(xx-L.x))/320,0,1);if(v>a)a=v;}
 if(DN9.fin>a)a=DN9.fin;return DN9_ISIK_C[c]=a;
}
// final nabzı (yuva.js ejderFinalNabiz, 0..1)
function dn9Nabiz(){if(DN9.finT===null||typeof ejderFinalNabiz!=='function')return 0;try{const v=+ejderFinalNabiz();return v>0?Math.min(1,v):0;}catch(e){return 0;}}

// ════════ Önbellek sprite'ları ════════
function dn9FxArt(){
 const F=DN9.fx;if(F.hazir)return F;
 // parıltı: dört köşeli küçük yıldız (ışık tozu, su ışıltısı, yıldız); renkli sürümler
 const yildiz=col=>{const cv=dn9Cv(32,32),c=cv.getContext('2d');const gr=c.createRadialGradient(16,16,0,16,16,9);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba('+dn9Rgb(col)+',0)');c.fillStyle=gr;c.fillRect(0,0,32,32);
  c.fillStyle='rgba(255,255,255,.95)';c.beginPath();c.moveTo(16,0);c.quadraticCurveTo(17,15,32,16);c.quadraticCurveTo(17,17,16,32);c.quadraticCurveTo(15,17,0,16);c.quadraticCurveTo(15,15,16,0);c.fill();
  c.globalCompositeOperation='source-atop';c.fillStyle='rgba('+dn9Rgb(col)+',.45)';c.fillRect(0,0,32,32);return cv;};
 F.parilti=yildiz('#f4f0ff');F.pariltiA=yildiz('#ffe0a0');F.pariltiL=yildiz('#d0b8ff');F.pariltiN=yildiz('#b0ffe0');
 // su perdesi dokusu: dikey akan çizgiler (dikişsiz tekrar), kenarlara doğru söner; ince akıntı (aşağı doğru söner)
 F.su=(()=>{const w=64,h=256,cv=dn9Cv(w,h),c=cv.getContext('2d'),R=rng(9191);
  for(let k=0;k<46;k++){const x=4+R()*(w-8),y=R()*h,L=30+R()*90,lw=1+R()*2.6,a=.16+R()*.34;c.strokeStyle='rgba(255,255,255,'+a+')';c.lineWidth=lw;c.lineCap='round';
   for(const o of [0,-h,h]){c.beginPath();c.moveTo(x,y+o);c.quadraticCurveTo(x+(R()-.5)*3,y+o+L*.5,x+(R()-.5)*2,y+o+L);c.stroke();}}
  for(let k=0;k<14;k++){const x=6+R()*(w-12),y=R()*h,r=2+R()*4;for(const o of [0,-h,h]){c.fillStyle='rgba(230,255,255,.35)';c.beginPath();c.ellipse(x,y+o,r*.6,r*1.8,0,0,6.283);c.fill();}}
  c.globalCompositeOperation='destination-in';const gr=c.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.18,'rgba(0,0,0,1)');gr.addColorStop(.82,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(0,0,w,h);return cv;})();
 F.suInce=(()=>{const cv=dn9Cv(16,128),c=cv.getContext('2d');let gr=c.createLinearGradient(0,0,16,0);gr.addColorStop(0,'rgba(200,250,255,0)');gr.addColorStop(.5,'rgba(235,255,255,.9)');gr.addColorStop(1,'rgba(200,250,255,0)');c.fillStyle=gr;c.fillRect(0,0,16,128);
  c.globalCompositeOperation='destination-in';gr=c.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.6,'rgba(0,0,0,.7)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(0,0,16,128);return cv;})();
 // köpük ve su tozu bulutçuğu, yumuşak sis
 const puf=(col,a)=>{const cv=dn9Cv(64,64),c=cv.getContext('2d'),gr=c.createRadialGradient(32,32,0,32,32,32),r=dn9Rgb(col);gr.addColorStop(0,'rgba('+r+','+a+')');gr.addColorStop(.5,'rgba('+r+','+(a*.5)+')');gr.addColorStop(1,'rgba('+r+',0)');c.fillStyle=gr;c.fillRect(0,0,64,64);return cv;};
 F.kopuk=puf('#ffffff',.9);F.sis=puf('#e8fff8',.7);F.sisP=puf('#ffe0ec',.6);F.sisL=puf('#d8c8ff',.6);
 // pus bandı: alttan yukarı sönen (katman eteği); gündüz nane-beyaz, akşam lila-pembe
 const bant=(col,a)=>{const cv=dn9Cv(8,128),c=cv.getContext('2d'),gr=c.createLinearGradient(0,0,0,128),r=dn9Rgb(col);gr.addColorStop(0,'rgba('+r+',0)');gr.addColorStop(.55,'rgba('+r+','+(a*.6)+')');gr.addColorStop(1,'rgba('+r+','+a+')');c.fillStyle=gr;c.fillRect(0,0,8,128);return cv;};
 F.pus=[bant('#e8fff4',.85),bant('#d8f4ff',.8),bant('#c8a8e8',.8),bant('#ffc8c0',.8)];
 // solgunluk örtüsü: Kalp sönükken vadinin alt kısmını hafif gri-lila soluklaştırır (ışık geldikçe açılır)
 F.solgun=bant('#b8b8cc',.9);
 F.sicak=bant('#ffd8a8',.9);
 // taç yaprakları (süzülen): yuvarlak uçlu, ortası açık; 6 renk
 F.yaprak=['#ffb0cc','#ffd6e4','#ffffff','#e0ccff','#ffc8a8','#ffe8a0'].map(col=>{const cv=dn9Cv(20,14),c=cv.getContext('2d');c.translate(10,7);
  c.fillStyle=col;c.beginPath();c.moveTo(-8,0);c.bezierCurveTo(-6,-7,5,-7,8,-1);c.quadraticCurveTo(6,1,8,2);c.bezierCurveTo(4,7,-6,6,-8,0);c.fill();
  c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(-2,-1.5,4,1.6,-.2,0,6.283);c.fill();c.strokeStyle=dn9Mix(col,'#c06090',.3);c.globalAlpha=.4;c.lineWidth=.8;c.beginPath();c.moveTo(-7,0);c.lineTo(5,0);c.stroke();return cv;});
 // ışık tozu izi: çimende yumuşak parlayan minik iz
 F.iz=(()=>{const cv=dn9Cv(28,12),c=cv.getContext('2d'),gr=c.createRadialGradient(14,6,0,14,6,12);gr.addColorStop(0,'rgba(255,240,190,.9)');gr.addColorStop(.5,'rgba(200,255,220,.4)');gr.addColorStop(1,'rgba(200,255,220,0)');c.fillStyle=gr;c.beginPath();c.ellipse(14,6,13,5.5,0,0,6.283);c.fill();return cv;})();
 // minik çiçek (iz çiçeği; adım atılan yerde açılıp söner)
 F.minikCicek=DN9_CICEK.slice(0,6).map(col=>{const cv=dn9Cv(24,24),c=cv.getContext('2d');c.translate(12,12);c.fillStyle=col;for(let k=0;k<5;k++){const a=k*1.2566;c.beginPath();c.ellipse(Math.cos(a)*5,Math.sin(a)*5,4.2,3,a,0,6.283);c.fill();}
  c.fillStyle='#ffe27a';c.beginPath();c.arc(0,0,2.8,0,6.283);c.fill();c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.arc(-.8,-.8,1,0,6.283);c.fill();return cv;});
 // kâğıt fener (yuva dağı ipleri): yuvarlak, çizgili; 4 renk (lila, altın, nane, gül)
 F.fener=['#c8a8ff','#ffc870','#9ff0c8','#ffa8c8'].map(col=>{const cv=dn9Cv(40,56),c=cv.getContext('2d');c.translate(20,30);
  c.fillStyle='#6a4a5a';c.fillRect(-5,-24,10,4);c.fillRect(-5,18,10,4);
  const gr=c.createRadialGradient(-3,-4,2,0,0,17);gr.addColorStop(0,dn9Mix(col,'#ffffff',.6));gr.addColorStop(.6,col);gr.addColorStop(1,dn9Mix(col,'#8a4a6a',.35));c.fillStyle=gr;c.beginPath();c.ellipse(0,0,15,19,0,0,6.283);c.fill();
  c.strokeStyle=dn9Mix(col,'#7a3a5a',.35);c.lineWidth=1.1;for(const k of [-8,0,8]){c.beginPath();c.ellipse(0,0,Math.abs(k)*1.4+1,19,0,0,6.283);c.stroke();}
  c.fillStyle='#ffd27a';c.beginPath();c.arc(0,24,2.2,0,6.283);c.fill();return cv;});
 // vinyet: yumuşak yeşil-mor köşeler (yalnız kenar parçaları çizilir)
 F.vig=(()=>{const cv=dn9Cv(200,160),v=cv.getContext('2d'),vg=v.createRadialGradient(100,74,48,100,74,126);vg.addColorStop(0,'rgba(20,40,48,0)');vg.addColorStop(.45,'rgba(20,40,48,0)');vg.addColorStop(.6,'rgba(20,40,48,.03)');vg.addColorStop(1,'rgba(30,30,60,.34)');v.fillStyle=vg;v.fillRect(0,0,200,160);return cv;})();
 // güneş: yumuşak kenarlı disk (renk karede ışımayla verilir) ve hilal ay (alacakaranlık)
 F.gunes=(()=>{const cv=dn9Cv(128,128),c=cv.getContext('2d'),gr=c.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,240,1)');gr.addColorStop(.72,'rgba(255,250,224,1)');gr.addColorStop(.86,'rgba(255,240,200,.6)');gr.addColorStop(1,'rgba(255,230,190,0)');c.fillStyle=gr;c.fillRect(0,0,128,128);return cv;})();
 F.ay=(()=>{const cv=dn9Cv(96,96),c=cv.getContext('2d');c.fillStyle='#fff2d0';c.beginPath();c.arc(48,48,30,0,6.283);c.fill();c.globalCompositeOperation='destination-out';c.beginPath();c.arc(60,40,27,0,6.283);c.fill();
  c.globalCompositeOperation='source-over';c.fillStyle='rgba(255,200,170,.55)';c.beginPath();c.arc(30,58,3.6,0,6.283);c.fill();   // yanak
  c.strokeStyle='#c89870';c.lineWidth=1.6;c.lineCap='round';c.beginPath();c.arc(27,46,3,3.5,5.9);c.stroke();return cv;})();   // uykulu kapalı göz
 F.hazir=true;return F;
}

// ════════ Gök: beş saat (sabah, serin turkuaz, şeftali-pembe, gün batımı, mor-altın alacakaranlık); komşu ikisi karışır ════════
const DN9_GOKR=[
 [[0,'#86c8ee'],[.34,'#a6daf2'],[.6,'#cbeef2'],[.8,'#f2f4dc'],[1,'#ffe6c6']],
 [[0,'#58b6d2'],[.38,'#84d4dc'],[.66,'#b8eee2'],[.86,'#dcfaee'],[1,'#effff4']],
 [[0,'#8cb0e0'],[.3,'#c6b8e0'],[.54,'#f6c6c6'],[.78,'#ffd29e'],[1,'#ffe6a6']],
 [[0,'#6258b0'],[.26,'#a674c2'],[.5,'#f088b2'],[.7,'#ff9c84'],[.88,'#ffb66e'],[1,'#ffd890']],
 [[0,'#1c1a4a'],[.28,'#36296c'],[.52,'#633c8a'],[.74,'#a65c98'],[.9,'#e08a80'],[1,'#f4bc80']]];
function dn9GokArt(i){
 if(DN9.gok[i])return DN9.gok[i];
 const R=rng(9001+i*31),cv=dn9Cv(768,600),c=cv.getContext('2d');let gr=c.createLinearGradient(0,0,0,600);
 for(const [u,col] of DN9_GOKR[i])gr.addColorStop(u,col);c.fillStyle=gr;c.fillRect(0,0,768,600);
 // güneş tarafında sıcak ışık, ufukta pus
 const gx=[200,260,420,500,520][i],gy=[120,90,190,420,560][i],gc=['255,250,226','236,255,246','255,228,176','255,200,140','255,170,120'][i];
 let h=c.createRadialGradient(gx,gy,10,gx,gy,[420,380,460,520,480][i]);h.addColorStop(0,'rgba('+gc+','+[.55,.45,.62,.66,.45][i]+')');h.addColorStop(.4,'rgba('+gc+',.16)');h.addColorStop(1,'rgba('+gc+',0)');c.fillStyle=h;c.fillRect(0,0,768,600);
 // yumuşak renk lekeleri (suluboya)
 for(let j=0;j<22;j++){const x=R()*768,y=40+R()*380,r=60+R()*120;h=c.createRadialGradient(x,y,1,x,y,r);
  const col=[['255,255,255','200,236,255','255,236,220'],['220,255,250','170,240,230','255,255,255'],['255,214,230','214,200,255','255,236,214'],['255,170,190','200,150,230','255,200,150'],['120,80,170','200,110,170','90,70,160']][i][j%3];
  h.addColorStop(0,'rgba('+col+','+(.06+R()*.07)+')');h.addColorStop(1,'rgba('+col+',0)');c.fillStyle=h;c.fillRect(x-r,y-r,r*2,r*2);}
 // ince yatay bulut fırçaları
 for(let j=0;j<18;j++){const y=60+R()*340,x=R()*768,w=90+R()*220,hh=3+R()*7;c.fillStyle=i>=3?(j%2?'rgba(255,190,200,.12)':'rgba(255,220,170,.1)'):(j%2?'rgba(255,255,255,.18)':'rgba(255,240,236,.12)');c.beginPath();c.ellipse(x,y,w,hh,-.02,0,6.283);c.fill();}
 // şelale ormanının serinliğinde ağaçların arasından süzülen yumuşak ışık huzmeleri
 if(i===1)for(let j=0;j<5;j++){const x=80+j*150+R()*60;c.fillStyle='rgba(255,255,240,.05)';c.beginPath();c.moveTo(x,0);c.lineTo(x+60,0);c.lineTo(x+220,600);c.lineTo(x+120,600);c.closePath();c.fill();}
 // kâğıt dokusu
 for(let j=0;j<5000;j++){c.fillStyle=j%2?'rgba(255,255,255,.02)':'rgba(40,40,80,.018)';c.fillRect(R()*768,R()*600,.8+R(),.6+R());}
 // alacakaranlık: sabit yıldızlar (üstte yoğun)
 if(i===4){for(let j=0;j<240;j++){const x=R()*768,y=R()*R()*380,s=.3+R()*.7;c.fillStyle='rgba(255,246,230,'+(.2+R()*.5)+')';c.beginPath();c.arc(x,y,s,0,6.283);c.fill();}
  for(let j=0;j<18;j++){const x=R()*768,y=R()*300,s=1+R()*.8;c.fillStyle=['rgba(255,226,170,.75)','rgba(220,200,255,.75)','rgba(190,255,230,.7)'][j%3];c.beginPath();c.arc(x,y,s,0,6.283);c.fill();}}
 if(i===3)for(let j=0;j<40;j++){const x=R()*768,y=R()*R()*160,s=.3+R()*.5;c.fillStyle='rgba(255,246,236,'+(.1+R()*.25)+')';c.beginPath();c.arc(x,y,s,0,6.283);c.fill();}
 DN9.gok[i]=cv;return cv;
}
const dn9SR=rng(9717),DN9_STARS=Array.from({length:46},(_,i)=>({x:dn9SR(),y:dn9SR()*dn9SR()*.55,r:.5+dn9SR()*1.3,ph:dn9SR()*6.283,sp:.5+dn9SR()*1.6,col:['#fff4e0','#ffe2b0','#e8d8ff','#c8ffe8'][i%4],yil:i%5===0,esik:dn9SR()}));
// bulutçuklar: tombul, altı düz yumuşak bulutlar; gündüz beyaz-şeftali, akşam pembe-altın (iki boya)
function dn9BulutArt(p){
 const F=DN9.fx;if(!F.bulut)F.bulut=[];if(F.bulut[p])return F.bulut[p];
 F.bulut[p]=[0,1,2].map(v=>{const cv=dn9Cv(320,120),c=cv.getContext('2d'),R=rng(401+v*17);
  const ust=p?'255,214,200':'255,255,255',orta=p?'250,170,190':'236,246,255',alt=p?'190,130,190':'214,226,246';
  for(let k=0;k<11;k++){const x=40+R()*240,y=70+R()*16-Math.sin((x-40)/240*Math.PI)*30,r=20+R()*28,gr=c.createRadialGradient(x-r*.2,y-r*.35,2,x,y,r);
   gr.addColorStop(0,'rgba('+ust+',.95)');gr.addColorStop(.6,'rgba('+orta+',.8)');gr.addColorStop(1,'rgba('+alt+',0)');c.fillStyle=gr;c.beginPath();c.arc(x,y,r,0,6.283);c.fill();}
  if(p){c.globalCompositeOperation='source-atop';const gr=c.createLinearGradient(0,20,0,100);gr.addColorStop(0,'rgba(255,230,160,.5)');gr.addColorStop(.5,'rgba(255,230,160,0)');c.fillStyle=gr;c.fillRect(0,0,320,120);c.globalCompositeOperation='source-over';}
  c.globalCompositeOperation='destination-out';const gr=c.createLinearGradient(0,84,0,120);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');c.fillStyle=gr;c.fillRect(0,84,320,36);return cv;});
 return F.bulut[p];
}

// ════════ Uzaktaki Ejderha Dağı: yumuşak, yuvarlak, taraça taraça yeşil bir dağ; tepesinde taş beşikte sönük Ejderha Kalbi ════════
const DN9_DAGW=1000,DN9_DAGH=760;
function dn9DagArt(p){
 if(DN9.dag[p])return DN9.dag[p];
 const cv=dn9Cv(DN9_DAGW,DN9_DAGH),c=cv.getContext('2d'),R=rng(7733),w=DN9_DAGW,h=DN9_DAGH,cx=w/2;
 const tr=col=>p?dn9Mix(dn9Mix(col,'#5a3c8c',.5),'#ff9a8a',.08):dn9Mix(col,'#a8c8e8',.46);
 // dağ gövdesi: geniş etek, yuvarlak omuzlar, tepede yassı beşik
 const yol=()=>{c.beginPath();c.moveTo(0,h);c.bezierCurveTo(w*.12,h*.84,w*.2,h*.62,w*.3,h*.5);c.bezierCurveTo(w*.36,h*.4,w*.38,h*.24,w*.44,h*.16);
  c.quadraticCurveTo(w*.47,h*.12,cx-38,h*.13);c.lineTo(cx+38,h*.13);c.quadraticCurveTo(w*.53,h*.12,w*.56,h*.16);
  c.bezierCurveTo(w*.62,h*.25,w*.64,h*.42,w*.71,h*.52);c.bezierCurveTo(w*.8,h*.64,w*.88,h*.84,w,h);c.closePath();};
 let gr=c.createLinearGradient(0,h*.1,0,h);gr.addColorStop(0,tr('#8ad0a8'));gr.addColorStop(.45,tr('#5aae86'));gr.addColorStop(1,tr('#3e8a6e'));c.fillStyle=gr;yol();c.fill();
 c.save();yol();c.clip();
 // güneş tarafı (sol) açık, öbür yan gölgeli
 gr=c.createLinearGradient(w*.3,0,w*.75,0);gr.addColorStop(0,p?'rgba(255,190,160,.18)':'rgba(255,255,230,.22)');gr.addColorStop(.5,'rgba(255,255,255,0)');gr.addColorStop(1,p?'rgba(40,20,80,.25)':'rgba(30,70,90,.18)');c.fillStyle=gr;c.fillRect(0,0,w,h);
 // taraçalar: yumuşak yatay kıvrımlar ve üstlerinde yuvarlak ağaç tepecikleri
 for(let k=0;k<9;k++){const y=h*(.24+k*.085),sp=.5+k*.06;c.strokeStyle=tr(k%2?'#a8e0b8':'#9ad8b0');c.globalAlpha=.55;c.lineWidth=3;c.beginPath();
  for(let x=cx-w*sp*.5;x<=cx+w*sp*.5;x+=12){const yy=y+Math.sin(x*.013+k)*6;x===cx-w*sp*.5?c.moveTo(x,yy):c.lineTo(x,yy);}c.stroke();c.globalAlpha=1;
  for(let j=0;j<10+k*3;j++){const x=cx+(R()-.5)*w*sp,yy=y+Math.sin(x*.013+k)*6-2,r=5+R()*7;c.fillStyle=tr(['#4e9a72','#5aa67c','#e8a8c8','#6ab088'][j%4]);c.beginPath();c.arc(x,yy,r,Math.PI,0);c.fill();
   c.fillStyle=tr(j%4===2?'#ffd0e0':'#8ad0a0');c.beginPath();c.arc(x-r*.3,yy-r*.4,r*.4,0,6.283);c.fill();}}
 // ince şelale iplikleri (omuzlardan)
 for(const [x0,y0,L] of [[.37,.3,.22],[.62,.36,.2],[.46,.5,.18],[.3,.55,.16],[.68,.6,.14]]){const x=w*x0,y=h*y0,ll=h*L;gr=c.createLinearGradient(0,y,0,y+ll);gr.addColorStop(0,'rgba(240,255,255,.75)');gr.addColorStop(1,'rgba(240,255,255,0)');c.fillStyle=gr;c.fillRect(x-2.5,y,5,ll);
  c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(x,y+ll*.9,12,4,0,0,6.283);c.fill();}
 // küçük ejderha yuvaları (dağın yamaçlarında yaprak çanaklar; içlerinde sıcak minik ışık karede)
 const yv=[];for(const [x0,y0] of [[.4,.36],[.58,.3],[.52,.46],[.35,.48],[.64,.52],[.45,.62],[.57,.68]]){const x=w*x0,y=h*y0;c.fillStyle=tr('#9a7050');c.beginPath();c.ellipse(x,y,11,5,0,0,Math.PI);c.fill();c.fillStyle=tr('#c89868');c.beginPath();c.ellipse(x,y,11,3,0,0,6.283);c.fill();yv.push({x,y:y-2});}
 // pus: etek nane-beyaz sise gömülür
 gr=c.createLinearGradient(0,h*.6,0,h);gr.addColorStop(0,p?'rgba(200,150,210,0)':'rgba(230,250,250,0)');gr.addColorStop(1,p?'rgba(210,150,200,.75)':'rgba(230,250,250,.8)');c.fillStyle=gr;c.fillRect(0,h*.6,w,h*.4);
 c.restore();
 // tepe: yuvarlak taşlardan beşik ve içinde soluk Ejderha Kalbi kristali (ışığı karede)
 const ty=h*.13;
 for(let k=-3;k<=3;k++){c.fillStyle=tr(k%2?'#a8a0c0':'#b8b0d0');c.beginPath();c.ellipse(cx+k*12,ty+2+Math.abs(k)*1.5,9,7,0,0,6.283);c.fill();}
 c.fillStyle=tr('#c8b8f0');c.beginPath();c.moveTo(cx,ty-34);c.lineTo(cx+11,ty-10);c.lineTo(cx,ty+2);c.lineTo(cx-11,ty-10);c.closePath();c.fill();
 c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.moveTo(cx,ty-34);c.lineTo(cx-4,ty-10);c.lineTo(cx-11,ty-10);c.closePath();c.fill();
 cv.kalp={x:cx,y:ty-14};cv.yuva=yv;
 // üst kenarda ışık çizgisi
 c.strokeStyle=p?'rgba(255,200,170,.5)':'rgba(255,255,240,.5)';c.lineWidth=2;yol();c.stroke();
 DN9.dag[p]=cv;return cv;
}

// ════════ Gökte süzülen sevimli yetişkin ejderhalar: tombul gövde, yuvarlak boynuzlar, yumuşak kanatlar (gövde + kanat ayrı) ════════
function dn9EjderArt(p){
 const F=DN9.fx;if(!F.ejder)F.ejder=[];if(F.ejder[p])return F.ejder[p];
 const ana=p?'#7a5a9e':'#9aa6dc',acik=p?'#c890b8':'#c8d0f4',koyu=p?'#5a4280':'#7a86c0',kenar=p?'#ffc0a0':'#f0f4ff';
 // gövde (sağa bakar; taban noktası gövdenin ortası = (80, 50))
 const gv=dn9Cv(170,100),c=gv.getContext('2d');c.translate(80,50);c.lineJoin='round';c.lineCap='round';
 c.fillStyle=ana;c.beginPath();c.moveTo(-30,4);c.bezierCurveTo(-52,8,-66,2,-76,-8);c.quadraticCurveTo(-70,4,-56,12);c.bezierCurveTo(-46,16,-34,16,-24,12);c.fill();   // kuyruk
 c.beginPath();c.ellipse(-78,-9,6,4,-.6,0,6.283);c.fill();                                                                     // kuyruk ucu (yuvarlak)
 c.beginPath();c.ellipse(0,4,36,22,0,0,6.283);c.fill();                                                                         // tombul gövde
 c.fillStyle=acik;c.beginPath();c.ellipse(4,12,26,12,0,0,6.283);c.fill();                                                       // karın
 c.strokeStyle=ana;c.lineWidth=1.4;for(const k of [-10,0,10]){c.beginPath();c.moveTo(4+k,2);c.quadraticCurveTo(6+k,12,4+k,22);c.stroke();}
 c.fillStyle=ana;c.beginPath();c.moveTo(22,-6);c.quadraticCurveTo(30,-16,40,-20);c.lineTo(46,-8);c.quadraticCurveTo(36,0,28,6);c.fill();   // boyun
 c.beginPath();c.ellipse(48,-20,15,13,0,0,6.283);c.fill();                                                                       // baş
 c.beginPath();c.ellipse(60,-15,9,7,.2,0,6.283);c.fill();                                                                        // burun
 c.fillStyle=koyu;c.beginPath();c.arc(40,-33,4,0,6.283);c.arc(49,-35,4,0,6.283);c.fill();                                        // yuvarlak boynuzlar
 c.fillStyle=acik;c.beginPath();c.ellipse(36,-24,6,3,-.8,0,6.283);c.fill();                                                      // yüzgeç kulak
 c.fillStyle='#ffffff';c.beginPath();c.arc(52,-22,3.4,0,6.283);c.fill();c.fillStyle=p?'#3a2850':'#3a4070';c.beginPath();c.arc(53,-22,2.2,0,6.283);c.fill();   // göz
 c.fillStyle='rgba(255,160,190,.6)';c.beginPath();c.ellipse(56,-14,3.6,2.2,0,0,6.283);c.fill();                                  // yanak
 c.fillStyle=koyu;c.beginPath();c.ellipse(-14,24,7,4,.3,0,6.283);c.ellipse(16,24,7,4,-.2,0,6.283);c.fill();                      // toplu ayaklar
 for(let k=0;k<4;k++){c.beginPath();c.arc(-18+k*12,-17+Math.abs(k-1.5)*2,4,Math.PI,0);c.fill();}                                 // sırt ibiği (yuvarlak)
 c.strokeStyle=kenar;c.globalAlpha=.55;c.lineWidth=1.6;c.beginPath();c.ellipse(0,4,36,22,0,3.6,5.6);c.stroke();c.beginPath();c.ellipse(48,-20,15,13,0,3.4,5.4);c.stroke();c.globalAlpha=1;
 // kanat: kökü (20, 74), yukarı açılır; yuvarlak tarak kenarlı yumuşak kanat
 const kn=dn9Cv(120,80),k=kn.getContext('2d');k.translate(20,74);
 k.fillStyle=ana;k.beginPath();k.moveTo(0,0);k.bezierCurveTo(-6,-30,10,-62,40,-70);k.bezierCurveTo(70,-74,92,-58,98,-40);
 for(let j=0;j<4;j++){const x0=98-j*24,x1=74-j*24;k.quadraticCurveTo((x0+x1)/2,-30+j*6,x1,-36+j*8);}k.quadraticCurveTo(10,-6,0,0);k.fill();
 k.strokeStyle=acik;k.lineWidth=1.6;k.globalAlpha=.6;for(let j=0;j<4;j++){k.beginPath();k.moveTo(4,-6);k.quadraticCurveTo(30,-50+j*6,92-j*24,-40+j*8);k.stroke();}k.globalAlpha=1;
 k.strokeStyle=kenar;k.globalAlpha=.5;k.lineWidth=1.4;k.beginPath();k.moveTo(2,-8);k.bezierCurveTo(-4,-30,10,-62,40,-70);k.bezierCurveTo(70,-74,92,-58,98,-40);k.stroke();k.globalAlpha=1;
 const kk=dn9Cv(120,80),q=kk.getContext('2d');q.drawImage(kn,0,0);q.globalCompositeOperation='source-atop';q.fillStyle=p?'rgba(40,20,70,.35)':'rgba(60,70,130,.3)';q.fillRect(0,0,120,80);   // arka kanat (koyu)
 F.ejder[p]={gv,kn,kk};return F.ejder[p];
}
// gökte süzülenler: [x evresi, y (gök oranı), ölçek, hız, evre, yön, yavru (arkasından minik biri)]
const DN9_EJ=[[.1,.16,.85,7,0,1,1],[.55,.1,.58,5,2.1,1,0],[.8,.26,.5,6,4.2,-1,0],[.35,.3,.42,4,1.3,-1,1],[.93,.19,1.12,8,3.3,-1,0],[.47,.4,.3,3,5.1,1,0]];
function dn9EjderCiz(x,y,s,yon,kanat,p,a){
 const E=dn9EjderArt(p);g.globalAlpha=a;g.save();g.translate(x,y);g.scale(s*yon,s);
 const ky=Math.max(-.7,Math.min(1,kanat));   // kanat açısı: 1 yukarı, -0.7 aşağı
 g.save();g.translate(2,-10);g.scale(-.82,ky*.82);g.drawImage(E.kk,-20,-74,120,80);g.restore();
 g.drawImage(E.gv,-80,-50);
 g.save();g.translate(-6,-6);g.scale(-.9,ky*.88);g.drawImage(E.kn,-20,-74,120,80);g.restore();
 g.restore();g.globalAlpha=1;
}
function dn9Ejderler(tm,vw,vh,gokAlt,ak){
 const span=vw+500;
 for(let i=0;i<DN9_EJ.length;i++){const [u,yf,s0,sp,ph,yon,yv]=DN9_EJ[i];
  const x=((u*span+tm*sp*yon-cam.x*.02)%span+span)%span-250,y=yf*vh+Math.sin(tm*.35+ph)*10-cam.y*.01+DN9.yk*vh*.08;if(y>gokAlt+20)continue;
  // süzülme ve ara sıra ağır, yumuşak kanat çırpışı
  const cyc=(tm*.12+ph*.3)%1,kn=cyc<.4?.5+.5*Math.cos(cyc/.4*Math.PI*8):.72+.08*Math.sin(tm*1.3+ph);
  const a=(.55+ak*.25)*(i<2?1:.8),s=s0*(.85+DN9.yk*.25);
  for(let pp=0;pp<2;pp++){const w=pp?ak:1-ak;if(w<.02)continue;dn9EjderCiz(x,y,s,yon,kn*1.7-.7,pp,a*w);
   if(yv)dn9EjderCiz(x-yon*120*s,y+16*s+Math.sin(tm*.9+ph)*5,s*.45,yon,Math.sin(tm*4+ph)*.85,pp,a*w*.95);}}
}

// ════════ Gökte süzülen uzak uçan adacıklar (üç çeşit, iki boya): yeşil tepeli, kökleri ve minik şelalesi sarkan kaya adaları ════════
function dn9AdaArt(v,p){
 const F=DN9.fx;if(!F.ada)F.ada=[[],[]];if(F.ada[p][v])return F.ada[p][v];
 const W0=[260,200,300][v],H0=[230,190,260][v],cv=dn9Cv(W0,H0),c=cv.getContext('2d'),R=rng(611+v*41),cx=W0/2,ty=H0*.3;
 const tr=col=>p?dn9Mix(dn9Mix(col,'#6a4a98',.42),'#ffa890',.1):dn9Mix(col,'#c0dcf0',.38);
 const rw=W0*.42;
 // kaya alt koni: katman katman, yuvarlak
 c.fillStyle=tr('#8a80a8');c.beginPath();c.moveTo(cx-rw,ty);c.bezierCurveTo(cx-rw*.9,ty+H0*.28,cx-rw*.3,ty+H0*.5,cx,ty+H0*.58);c.bezierCurveTo(cx+rw*.3,ty+H0*.5,cx+rw*.9,ty+H0*.28,cx+rw,ty);c.closePath();c.fill();
 c.fillStyle=tr('#a49ac0');c.beginPath();c.moveTo(cx-rw,ty);c.bezierCurveTo(cx-rw*.8,ty+H0*.16,cx-rw*.2,ty+H0*.24,cx+rw*.2,ty+H0*.2);c.quadraticCurveTo(cx+rw*.7,ty+H0*.14,cx+rw,ty);c.closePath();c.fill();
 c.strokeStyle=tr('#6a6088');c.lineWidth=2;for(let k=0;k<3;k++){c.beginPath();c.moveTo(cx-rw*(.8-k*.2),ty+H0*(.12+k*.1));c.quadraticCurveTo(cx,ty+H0*(.2+k*.1),cx+rw*(.8-k*.2),ty+H0*(.1+k*.1));c.stroke();}
 // sarkan kökler
 c.strokeStyle=tr('#7a6050');c.lineCap='round';for(let k=0;k<6;k++){const x=cx+(R()-.5)*rw*1.2,y=ty+H0*.2+R()*H0*.2,L=20+R()*40;c.lineWidth=1.5+R();c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+6,y+L*.4,x-6,y+L*.7,x+(R()-.5)*8,y+L);c.stroke();}
 // minik şelale (bir kenardan)
 const sx=cx+rw*(v===1?-.75:.7);let gr=c.createLinearGradient(0,ty,0,H0);gr.addColorStop(0,'rgba(240,255,255,.85)');gr.addColorStop(1,'rgba(240,255,255,0)');c.fillStyle=gr;c.fillRect(sx-3,ty-2,6,H0-ty);
 // çimenli tepe
 c.fillStyle=tr('#5aae7a');c.beginPath();c.ellipse(cx,ty,rw+4,14,0,0,6.283);c.fill();
 c.fillStyle=tr('#7ac890');c.beginPath();c.ellipse(cx,ty-4,rw,10,0,Math.PI,0);c.fill();
 // üstünde dev çiçekli ağaç ya da çalılar, minik yuva
 if(v!==1){const tx=cx+(v?rw*.25:-rw*.2),th=H0*.24;c.strokeStyle=tr('#8a6048');c.lineWidth=5;c.beginPath();c.moveTo(tx,ty-4);c.quadraticCurveTo(tx-6,ty-th*.5,tx+4,ty-th);c.stroke();
  for(let k=0;k<9;k++){const a=R()*6.283,r=R()*th*.5,x=tx+4+Math.cos(a)*r*1.3,y=ty-th-th*.2+Math.sin(a)*r*.7,rr=th*.22+R()*th*.15;c.fillStyle=tr(['#ffb0cc','#ffd0e0','#f090b8'][k%3]);c.beginPath();c.arc(x,y,rr,0,6.283);c.fill();}}
 for(let k=0;k<5;k++){const x=cx+(R()-.5)*rw*1.6;c.fillStyle=tr(k%2?'#4e9a6e':'#68b480');c.beginPath();c.arc(x,ty-3,6+R()*6,Math.PI,0);c.fill();}
 c.fillStyle=tr('#b08058');c.beginPath();c.ellipse(cx+rw*.55*(v===1?1:-1),ty-3,10,4.5,0,0,Math.PI);c.fill();   // minik yuva
 if(p){c.strokeStyle='rgba(255,210,150,.6)';c.lineWidth=2;c.beginPath();c.ellipse(cx,ty-4,rw,10,0,Math.PI*1.05,Math.PI*1.7);c.stroke();}
 cv.su={x:sx,y:H0*.7};F.ada[p][v]=cv;return cv;
}
// [x evresi, y gök oranı, ölçek, paralaks, evre, çeşit]
const DN9_ADAL=[[.08,.34,.5,.05,0,0],[.36,.22,.34,.035,1.7,1],[.62,.4,.62,.07,3.1,2],[.86,.28,.4,.045,4.4,0],[.22,.48,.72,.09,2.4,1],[.74,.18,.28,.03,5.2,2]];
function dn9AdaAgirlik(cx){return .28+.72*smooth(clamp((cx-380*T)/(70*T),0,1))*(1-.5*smooth(clamp((cx-770*T)/(40*T),0,1)));}
function dn9Adalar(tm,vw,vh,gokAlt,ak,sira){
 const cx=cam.x+VW*.5,wa=dn9AdaAgirlik(cx);if(wa<.02)return;
 for(let i=0;i<DN9_ADAL.length;i++){const [u,yf,s0,f,ph,v]=DN9_ADAL[i];if((i<3)!==(sira===0))continue;
  const s=s0*(1+DN9.yk*.15),span=vw+400,x=((u*span*2-cam.x*f+tm*1.5)%span+span)%span-200,y=yf*vh+Math.sin(tm*.4+ph)*8-cam.y*f*.5+DN9.yk*vh*.12;
  const im=dn9AdaArt(v,0);if(y-im.height*s*.3>gokAlt)continue;
  for(let pp=0;pp<2;pp++){const w=pp?ak:1-ak;if(w<.02)continue;const A=dn9AdaArt(v,pp);g.globalAlpha=wa*w*(.75+.25*(i%2));g.drawImage(A,x-A.width*s/2,y-A.height*s*.3,A.width*s,A.height*s);}
  g.globalAlpha=1;}
}

// ════════ Vadinin simgeleri (uzak ve orta derinlikte, dünyaya bağlı): ejderha kuleleri, uyuyan ejderha biçimli yosunlu kaya, kayaya
//          oyulmuş yuvarlak kapılı ejderha evi, pul taşlı kemer köprü, dev çiçekler, kristal gölet, fener dizisi. Bir kez boyanır. ════════
const DN9_SMW=[150,360,260,380,220,300,320],DN9_SMH=[340,200,240,170,280,130,150];
function dn9SimgeArt(v,p,uz){
 const F=DN9.fx;if(!F.simge)F.simge={};const ad=v+'_'+p+'_'+uz;if(F.simge[ad])return F.simge[ad];
 const W0=DN9_SMW[v],H0=DN9_SMH[v],cv=dn9Cv(W0,H0),c=cv.getContext('2d'),R=rng(4410+v*53),isik=[];
 const tr=col=>p?dn9Mix(dn9Mix(col,'#5a3c8c',uz?.5:.34),'#ff9a80',uz?.12:.09):dn9Mix(col,'#c4e2f2',uz?.46:.16);
 const tas=tr('#b4a8cc'),tasA=tr('#d0c6e2'),tasK=tr('#8f84ae'),cim=tr('#62ae84'),cimA=tr('#86c8a0'),odun=tr('#8a6048'),isikR=tr('#ffe6a4');
 c.lineJoin='round';c.lineCap='round';
 const el=(x,y,rx,ry,col,rot)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,6.283);c.fill();};
 const pul=(x0,y0,w,h,r,col,a)=>{c.strokeStyle=col;c.lineWidth=1.6;c.globalAlpha=a;let j=0;for(let y=y0;y<y0+h;y+=r*.95,j++)for(let x=x0+(j%2?r:0);x<x0+w+r;x+=r*2){c.beginPath();c.arc(x,y,r,.1,3.04);c.stroke();}c.globalAlpha=1;};
 const tepe=(x,rx)=>{el(x,H0-4,rx,15,cim);c.fillStyle=cimA;c.beginPath();c.ellipse(x,H0-8,rx*.9,9,0,Math.PI,0);c.fill();};
 const pencere=(x,y,r)=>{el(x,y,r+3,r+3,tasK);el(x,y,r,r,isikR);c.strokeStyle=tasK;c.lineWidth=2;c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.moveTo(x,y-r);c.lineTo(x,y+r);c.stroke();isik.push({x:x,y:y,r:r*2.4,c:0});};
 const fener=(x,y,r,col)=>{c.strokeStyle=odun;c.lineWidth=1.4;c.beginPath();c.moveTo(x,y-r-5);c.lineTo(x,y-r);c.stroke();el(x,y,r*.8,r,tr(col));el(x-r*.2,y-r*.3,r*.3,r*.4,'rgba(255,255,255,.6)');el(x,y-r,r*.5,r*.25,odun);isik.push({x:x,y:y,r:r*2.6,c:0});};
 if(v===0){   // ejderha kulesi: pul kiremitli kubbe, yuvarlak pencereler, tepesinde iki yuvarlak boynuz ve flama
  el(75,340,75,56,DN9_SDOLGU[1][p]);   // kendi tepeciği (yeşil tepelerle aynı renk: onlara karışır)
  c.fillStyle=tas;c.beginPath();c.moveTo(42,292);c.lineTo(50,116);c.quadraticCurveTo(75,104,100,116);c.lineTo(108,292);c.closePath();c.fill();
  c.save();c.clip();c.fillStyle=tasA;c.fillRect(42,100,22,200);pul(40,124,70,170,11,tasK,.4);c.restore();
  c.fillStyle=tasA;dn9Yk(c,38,110,74,12,6);c.fill();
  c.fillStyle=tr('#ec8fb2');c.beginPath();c.moveTo(36,114);c.quadraticCurveTo(46,54,75,26);c.quadraticCurveTo(104,54,114,114);c.closePath();c.fill();
  c.save();c.clip();pul(34,40,82,74,9,tr('#ffc6da'),.75);c.restore();
  el(64,28,5,9,tr('#ffd27a'),-.4);el(86,28,5,9,tr('#ffd27a'),.4);
  c.strokeStyle=odun;c.lineWidth=2;c.beginPath();c.moveTo(75,26);c.lineTo(75,4);c.stroke();c.fillStyle=tr('#b89cff');c.beginPath();c.moveTo(75,4);c.quadraticCurveTo(90,6,98,12);c.quadraticCurveTo(88,14,75,16);c.fill();
  pencere(75,152,11);pencere(75,208,9);
  c.fillStyle=odun;c.beginPath();c.arc(75,290,15,Math.PI,0);c.lineTo(90,292);c.lineTo(60,292);c.fill();
 }else if(v===1){   // uyuyan ejderha biçimli yosunlu kaya (taştan; gözü kapalı, gülümser)
  tepe(180,170);
  el(46,172,36,20,tasK,-.3);el(28,160,14,10,tas,-.6);                 // kıvrık kuyruk
  el(150,140,112,60,tas);                                            // gövde
  c.save();c.beginPath();c.ellipse(150,140,112,60,0,0,6.283);c.clip();el(120,104,90,34,tasA);pul(40,112,220,90,13,tasK,.42);c.restore();
  for(let k=0;k<6;k++){const x=74+k*30,d=(x-150)/112,y=140-60*Math.sqrt(1-d*d)+3;c.fillStyle=k%2?cim:cimA;c.beginPath();c.arc(x,y,12,Math.PI,0);c.fill();}   // yosunlu sırt ibiği
  el(282,150,62,46,tas);el(324,164,30,22,tas);el(268,128,40,20,tasA,-.2);
  el(262,109,8,10,tasA,-.35);el(287,105,8,10,tasA,.1);el(240,126,14,7,cimA,-.7);          // yuvarlak boynuzlar, yosunlu kulak
  c.strokeStyle=tr('#6a6088');c.lineWidth=3.4;c.beginPath();c.arc(296,144,10,.2,2.94);c.stroke();   // kapalı, mutlu göz
  c.beginPath();c.arc(322,172,14,.5,2.2);c.lineWidth=2.6;c.stroke();                               // gülümseme
  el(338,158,2.6,2.6,tr('#6a6088'));el(310,166,9,5.5,'rgba(255,150,180,.5)');
  for(let k=0;k<7;k++){const x=70+R()*180,y=96+R()*22;el(x,y,2.6,2.6,tr(DN9_CICEK[k%8]));}
 }else if(v===2){   // kayaya oyulmuş ejderha evi: yuvarlak kapı ve pencereler, pul kiremitli çatı, iki boynuz
  el(98,58,10,20,tr('#ffd27a'),-.45);el(162,58,10,20,tr('#ffd27a'),.45);
  c.fillStyle=tas;c.beginPath();c.ellipse(130,150,108,92,0,0,6.283);c.fill();
  c.save();c.clip();el(96,110,70,50,tasA);
  c.fillStyle=tr('#ec8fb2');c.fillRect(0,40,260,76);pul(14,58,236,58,12,tr('#ffc6da'),.8);
  c.fillStyle=tr('#ec8fb2');for(let x=30;x<240;x+=24){c.beginPath();c.arc(x,114,12,0,Math.PI);c.fill();}
  pul(20,150,220,90,14,tasK,.3);c.restore();
  tepe(130,124);
  el(130,192,36,36,tr('#ffe6b0'));el(130,192,31,31,odun);el(130,192,24,24,tr('#a87858'));c.strokeStyle=odun;c.lineWidth=2;c.beginPath();c.moveTo(130,168);c.lineTo(130,216);c.stroke();el(144,194,3.4,3.4,tr('#ffd27a'));
  pencere(66,160,15);pencere(194,160,15);pencere(130,134,9);
  fener(84,204,7,'#ffd27a');
 }else if(v===3){   // pul taşlı kemer köprü, altında ışıltılı dere, korkuluğunda fenerler
  tepe(40,44);tepe(340,44);el(190,164,118,7,tr('#8fe4ee'));el(170,163,60,3,'rgba(255,255,255,.55)');
  c.fillStyle=tas;c.beginPath();c.moveTo(8,150);c.quadraticCurveTo(190,38,372,150);c.lineTo(372,170);c.lineTo(318,170);c.quadraticCurveTo(190,74,62,170);c.lineTo(8,170);c.closePath();c.fill();
  c.save();c.clip();pul(0,50,380,120,12,tasK,.42);c.restore();
  c.strokeStyle=tasA;c.lineWidth=7;c.beginPath();c.moveTo(12,146);c.quadraticCurveTo(190,34,368,146);c.stroke();
  for(let k=0;k<=6;k++){const t=k/6,x=12+356*t,y=146-224*t*(1-t);c.fillStyle=tasA;dn9Yk(c,x-4,y-22,8,22,4);c.fill();el(x,y-24,6,6,k%3===0?tr('#ffd27a'):tasA);if(k%2===1)fener(x,y-36,6,['#ffd27a','#ff9fc0','#b89cff'][(k>>1)%3]);}
  c.strokeStyle=tasA;c.lineWidth=3;c.beginPath();c.moveTo(12,128);c.quadraticCurveTo(190,16,368,128);c.stroke();
 }else if(v===4){   // dev çiçekler
  tepe(110,96);
  const sap=(x0,x1,y1)=>{c.strokeStyle=tr('#4e9a6e');c.lineWidth=7;c.beginPath();c.moveTo(x0,272);c.quadraticCurveTo(x0+(x1-x0)*.2,(272+y1)/2,x1,y1);c.stroke();el((x0+x1)/2-14,(272+y1)/2+20,20,8,cimA,-.5);el((x0+x1)/2+16,(272+y1)/2+44,20,8,cim,.5);};
  sap(64,50,120);sap(118,112,64);sap(160,176,138);
  for(let k=0;k<8;k++){const a=k/8*6.283;el(112+Math.cos(a)*26,64+Math.sin(a)*26,17,17,tr(k%2?'#ff9fc0':'#ffc0d6'));}el(112,64,16,16,tr('#ffd27a'));el(107,59,6,5,'rgba(255,255,255,.5)');
  for(let k=0;k<6;k++){const a=k/6*6.283+.4;el(50+Math.cos(a)*19,120+Math.sin(a)*19,13,13,tr(k%2?'#b89cff':'#d9c8ff'));}el(50,120,11,11,tr('#fff0a0'));
  c.fillStyle=tr('#ffc29a');c.beginPath();c.moveTo(152,140);c.quadraticCurveTo(150,104,164,100);c.quadraticCurveTo(170,112,176,100);c.quadraticCurveTo(182,112,190,100);c.quadraticCurveTo(204,106,200,140);c.quadraticCurveTo(176,162,152,140);c.fill();
  el(166,128,8,12,'rgba(255,255,255,.35)');
 }else if(v===5){   // kristal gölet
  tepe(150,140);el(150,102,112,22,tr('#5cc8d8'));el(150,100,104,18,tr('#8fe4ee'));el(120,96,50,5,'rgba(255,255,255,.5)');el(186,106,30,3,'rgba(255,255,255,.4)');
  const kr=(x,y,w,h,ci)=>{const col=tr(DN9_KALP[ci%3]);c.fillStyle=col;c.beginPath();c.moveTo(x-w,y);c.lineTo(x-w*.8,y-h*.7);c.quadraticCurveTo(x,y-h*1.08,x+w*.8,y-h*.7);c.lineTo(x+w,y);c.closePath();c.fill();
   c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.moveTo(x-w*.7,y);c.lineTo(x-w*.6,y-h*.66);c.quadraticCurveTo(x-w*.2,y-h*.95,x,y-h*.9);c.lineTo(x-w*.1,y);c.closePath();c.fill();isik.push({x:x,y:y-h*.6,r:h*.9,c:1+ci%3});};
  kr(44,104,13,62,0);kr(68,112,10,38,1);kr(252,102,14,72,2);kr(228,112,10,42,0);kr(150,86,9,34,1);kr(24,112,8,26,2);
  for(let k=0;k<6;k++)el(70+R()*160,94+R()*14,1.6,1.6,'rgba(255,255,255,.9)');
 }else{   // iki direk arasına asılı fener dizisi
  tepe(36,34);tepe(284,34);
  c.strokeStyle=odun;c.lineWidth=7;c.beginPath();c.moveTo(36,140);c.lineTo(36,34);c.moveTo(284,140);c.lineTo(284,34);c.stroke();
  c.lineWidth=4;c.beginPath();c.arc(44,30,8,Math.PI,.6);c.stroke();c.beginPath();c.arc(276,30,8,2.54,0);c.stroke();
  c.lineWidth=1.8;c.beginPath();c.moveTo(36,36);c.quadraticCurveTo(160,112,284,36);c.stroke();
  for(let k=1;k<=7;k++){const t=k/8,x=36+248*t,y=36+152*t*(1-t);fener(x,y+15,9,['#ffd27a','#ff9fc0','#b89cff','#9ff0c8'][k%4]);}
 }
 cv.isik=isik;F.simge[ad]=cv;return cv;
}
// [sütun, çeşit, uzak mı, ölçek, y kayması, yön]
const DN9_SIMGE=[[376,0,1,.5,0,1],[392,2,0,.8,0,1],[420,4,0,.78,6,1],[436,0,1,.72,-8,1],[447,1,0,.82,4,1],[474,3,0,.8,-4,1],[498,0,1,.56,4,1],
 [502,5,0,.8,10,1],[528,2,0,.68,-6,-1],[553,6,0,.8,2,1],[566,0,1,.8,-12,1],[578,1,0,.7,6,-1],[603,4,0,.7,4,-1],[628,0,1,.6,0,1]];
const DN9_SIMGER=['#ffd8a0','#c8a8ff','#ffd27a','#9ff0c8'];
function dn9Simgeler(tm,vw,uz,base,alt,ak){
 const cx=cam.x+VW*.5,f=uz?.1:.28,L=DN9_SIMGE,on=.16+DN9.renk*.3+ak*.3+DN9.fin*.2;
 for(let i=0;i<L.length;i++){const e=L[i];if(e[2]!==uz)continue;
  const v=e[1],s=e[3],w=DN9_SMW[v]*s,h=DN9_SMH[v]*s,x=vw*.5+(e[0]*T-cx)*f,y=base+e[4]-h;
  if(x+w/2<0||x-w/2>vw||y>=alt)continue;
  let im=null;
  for(let pp=0;pp<2;pp++){const ww=pp?ak:1-ak;if(ww<.02)continue;im=dn9SimgeArt(v,pp,uz);g.globalAlpha=pp&&ww<.99?ww:1;
   if(e[5]<0){g.save();g.translate(x,y);g.scale(-1,1);g.drawImage(im,-w/2,0,w,h);g.restore();}else g.drawImage(im,x-w/2,y,w,h);}
  g.globalAlpha=1;
  if(im&&im.isik.length){g.globalCompositeOperation='lighter';const I=im.isik;
   for(let j=0;j<I.length;j++){const q=I[j],qx=x+(q.x-DN9_SMW[v]/2)*s*e[5],qy=y+q.y*s;if(qy>alt)continue;dn9Glow(DN9_SIMGER[q.c],qx,qy,q.r*s,q.r*s,on*(.8+.2*Math.sin(tm*1.3+q.x*.3+i)));}
   g.globalCompositeOperation='source-over';}}
}

// ════════ Uzak şeritler: 0 uzak dağ sırası, 1 yeşil tepeler, 2 çiçekli ağaç sırası, 3 yakın çalılar, 4 bulut denizi (yükseklerde),
//          5 şelale ormanının uzak kayalıkları ve şelaleleri (yalnız orada). Her şeridin gündüz (p 0) ve akşam (p 1) boyası var. ════════
const DN9_EXT=24,DN9_KW=256;
function dn9Kirp(cv){
 const w=cv.width,h=cv.height,n=Math.ceil(w/DN9_KW),ust=new Int16Array(n).fill(h);
 try{const d=cv.getContext('2d').getImageData(0,0,w,h).data;
  for(let k=0;k<n;k++){const xa=k*DN9_KW,xb=Math.min(w,xa+DN9_KW);let y=0;
   satir:for(;y<h;y++){const o=y*w*4;for(let x=xa;x<xb;x+=2)if(d[o+x*4+3]>2)break satir;}
   ust[k]=Math.max(0,y-2);}}catch(e){ust.fill(0);}
 cv.ust=ust;return cv;
}
// şeridi (x, y) köşesine, ekranda yAlt'a kadar karo karo çiz (saydam üst kısım atlanır; karo sınırları cihaz pikseline oturur)
function dn9SeritCiz(img,x,y,vw,yAlt){
 const ust=img.ust,n=ust.length,h=img.height;let k0=Math.max(0,Math.floor(-x/DN9_KW)),k1=Math.min(n-1,Math.floor((vw-x)/DN9_KW));
 const alt=Math.min(h,yAlt-y);if(alt<=0)return;
 for(let k=k0;k<=k1;k++){const u=ust[k];if(u>=alt)continue;const sx=k*DN9_KW,sw=Math.min(DN9_KW,img.width-sx),
  dx0=Math.round((x+sx)*S)/S,dx1=Math.round((x+sx+sw)*S)/S;g.drawImage(img,sx,u,sw,alt-u,dx0,y+u,dx1-dx0,alt-u);}
}
const DN9_SW=[2048,2048,1536,1536,2048,2048],DN9_SH=[380,360,420,300,560,520],DN9_SF=[.03,.08,.18,.38,.22,.13],DN9_SYF=[.04,.08,.16,.3,.2,.12],DN9_SB=[470,515,560,625,830,575];
const DN9_SDOLGU=[['#a6c6e0','#8a72b4'],['#86c8a6','#70609e'],['#62ae84','#5a4a88'],['#468e68','#3e3272'],['#dcdaf0','#a880b8'],['#7ab4a4','#7ab4a4']];
// katmanın renk dönüşümü: gündüz göğün mavisine (uzaklık pusu), akşam mor-pembeye karışır
const DN9_HK=[[.5,.62],[.34,.5],[.2,.42],[.08,.34],[0,0],[.28,.3]];
function dn9Tr(l,p){const k=DN9_HK[l][p];return p?col=>dn9Mix(dn9Mix(col,'#5a3c8c',k),'#ff9a80',.07):col=>dn9Mix(col,'#c4e2f2',k);}
// uzak çiçekli ağaç (şerit için sade): eğri gövde + yuvarlak çiçek bulutları
function dn9AgacUzak(c,x,base,h,R,tr,ti){
 const K=DN9_TAC[ti%DN9_TAC.length],eg=(R()-.5)*h*.12;
 c.strokeStyle=tr('#8a6a58');c.lineCap='round';c.lineWidth=Math.max(2,h*.06);c.beginPath();c.moveTo(x,base);c.quadraticCurveTo(x-eg,base-h*.4,x+eg*.6,base-h*.62);c.stroke();
 const tx=x+eg*.6,ty=base-h*.72,r=h*.36;
 for(let k=0;k<10;k++){const a=R()*6.283,d=R()*r*.7,px=tx+Math.cos(a)*d*1.3,py=ty+Math.sin(a)*d*.6,rr=r*(.34+R()*.2);c.fillStyle=tr(K[1]);c.beginPath();c.arc(px,py+rr*.15,rr,0,6.283);c.fill();}
 for(let k=0;k<7;k++){const a=R()*6.283,d=R()*r*.6,px=tx+Math.cos(a)*d*1.2,py=ty-r*.12+Math.sin(a)*d*.5,rr=r*(.24+R()*.16);c.fillStyle=tr(K[0]);c.beginPath();c.arc(px,py,rr,0,6.283);c.fill();}
 for(let k=0;k<5;k++){const px=tx+(R()-.5)*r*1.2,py=ty-r*.3+(R()-.5)*r*.5;c.fillStyle=tr(K[2]);c.beginPath();c.arc(px,py,r*(.1+R()*.08),0,6.283);c.fill();}
}
// yuvarlak yeşil ağaç (şerit için)
function dn9TopAgac(c,x,base,r,tr,col,acik){
 c.fillStyle=tr('#7a5a48');c.fillRect(x-r*.1,base-r*.9,r*.2,r*.9);
 c.fillStyle=tr(col);c.beginPath();c.arc(x,base-r*1.3,r,0,6.283);c.fill();c.beginPath();c.arc(x-r*.6,base-r*.95,r*.62,0,6.283);c.arc(x+r*.6,base-r,r*.6,0,6.283);c.fill();
 c.fillStyle=tr(acik);c.beginPath();c.arc(x-r*.3,base-r*1.6,r*.42,0,6.283);c.fill();
}
function dn9Serit(l,p){
 const ad=l+'_'+p;if(DN9.serit[ad])return DN9.serit[ad];
 if(l===5&&p===1)return dn9Serit(5,0);
 const Wd=DN9_SW[l],Hd=DN9_SH[l],cv=dn9Cv(Wd,Hd+DN9_EXT),c=cv.getContext('2d'),R=rng(5801+l*97),base=Hd,tr=dn9Tr(l,p);
 const fx={su:[],yuva:[],cicek:[]};if(!p)DN9.serFx[l]=fx;
 const k1=[2,3,3,4,3,2][l],k2=[5,7,6,9,7,5][l],A1=[90,60,30,22,30,60][l],A2=[34,22,14,10,16,20][l],ph1=R()*6.28,ph2=R()*6.28,ofs=[70,40,40,10,330,260][l];
 // tepe çizgisi (dikişsiz tekrar): uzak dağlarda birkaç yuvarlak doruk
 const dorum=l===0?Array.from({length:7},(_,i)=>({x:(i+.3+R()*.4)*Wd/7,w:200+R()*170,h:70+R()*100})):[];
 const yAt=x=>{let y=base-ofs-A1*(.5+.5*Math.sin(x/Wd*6.2832*k1+ph1))-A2*(.5+.5*Math.sin(x/Wd*6.2832*k2+ph2));
  for(const d of dorum){let dx=x-d.x;dx-=Math.round(dx/Wd)*Wd;const u=Math.min(1,Math.abs(dx)/d.w),q=.5+.5*Math.cos(u*Math.PI);y-=d.h*q*q*(3-2*q);}return y;};
 const dolgu=DN9_SDOLGU[l][p],ust=tr(l===0?'#dceef6':l===1?'#b8e8c4':l===2?'#8ed4a4':'#6ab88a');
 const tepe=(yf,col1,col2)=>{const gr=c.createLinearGradient(0,base-ofs-A1-A2-130,0,base);gr.addColorStop(0,col1);gr.addColorStop(.7,col2);gr.addColorStop(1,col2);c.fillStyle=gr;
  c.beginPath();c.moveTo(0,Hd+DN9_EXT);for(let x=0;x<=Wd;x+=6)c.lineTo(x,yf(x));c.lineTo(Wd,Hd+DN9_EXT);c.closePath();c.fill();
  c.strokeStyle=p?'rgba(255,200,170,.5)':'rgba(255,255,240,.55)';c.lineWidth=1.6;c.beginPath();for(let x=0;x<=Wd;x+=6)x?c.lineTo(x,yf(x)+.8):c.moveTo(0,yf(0)+.8);c.stroke();};
 const per=(x,fn)=>{for(const o of [0,-Wd,Wd]){const xx=x+o;if(xx>-260&&xx<Wd+260)fn(xx,o===0);}};   // kenarı kesen şey öbür uçta da çizilir
 if(l===0){
  tepe(yAt,ust,dolgu);
  // doruklarda yumuşak ışık yüzü ve gölge yüzü, yamaçlarda ince şelale iplikleri, eteklerde ağaç noktaları
  c.save();c.beginPath();c.moveTo(0,Hd+DN9_EXT);for(let x=0;x<=Wd;x+=6)c.lineTo(x,yAt(x));c.lineTo(Wd,Hd+DN9_EXT);c.closePath();c.clip();
  for(const d of dorum)per(d.x,xx=>{const ty=yAt(xx);let gr=c.createRadialGradient(xx-d.w*.3,ty+d.h*.3,4,xx-d.w*.3,ty+d.h*.3,d.w*.75);gr.addColorStop(0,p?'rgba(255,200,180,.24)':'rgba(255,255,255,.3)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(xx-d.w*1.1,ty-10,d.w*1.6,d.h*1.6);
   gr=c.createRadialGradient(xx+d.w*.4,ty+d.h*.45,4,xx+d.w*.4,ty+d.h*.45,d.w*.65);gr.addColorStop(0,p?'rgba(40,20,80,.15)':'rgba(70,100,150,.12)');gr.addColorStop(1,'rgba(70,100,150,0)');c.fillStyle=gr;c.fillRect(xx-d.w*.3,ty-10,d.w*1.4,d.h*1.6);
  });
  c.restore();
  for(let k=0;k<5;k++){const x=R()*Wd,y0=yAt(x)+20+R()*20,L=40+R()*60;per(x,xx=>{const gr=c.createLinearGradient(0,y0,0,y0+L);gr.addColorStop(0,p?'rgba(255,230,230,.4)':'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(xx-1.2,y0,2.4,L);});}
  for(let k=0;k<120;k++){const x=R()*Wd,y=yAt(x)+40+R()*(base-yAt(x)-40);if(y>base)continue;const r=3+R()*3;per(x,xx=>{c.fillStyle=tr(k%5===0?'#e0a8c8':'#6aa088');c.beginPath();c.arc(xx,y,r,Math.PI,0);c.fill();});}
 } else if(l===1){
  tepe(yAt,ust,dolgu);
  // ikinci, alçak tepe dalgası (derinlik)
  const y2=x=>yAt(x)+26+Math.sin(x/Wd*6.2832*5+1)*10;c.fillStyle=dn9Mix(dolgu,tr('#5a9a78'),.25);c.beginPath();c.moveTo(0,Hd+DN9_EXT);for(let x=0;x<=Wd;x+=6)c.lineTo(x,y2(x));c.lineTo(Wd,Hd+DN9_EXT);c.closePath();c.fill();
  let x=R()*40;
  while(x<Wd){const t=R(),s=x;
   if(t<.45){const r=10+R()*12,col=['#4e9a72','#5aa67c','#62a070'][Math.floor(R()*3)];per(s,xx=>dn9TopAgac(c,xx,yAt(xx)+6,r,tr,col,'#8ad0a0'));x+=r*1.6+R()*20;}
   else if(t<.7){const h=50+R()*40,ti=Math.floor(R()*4),sd=(x*7|0)+l*31;per(s,xx=>dn9AgacUzak(c,xx,yAt(xx)+5,h,rng(sd),tr,ti));x+=h*.6+R()*30;}
   else if(t<.8){per(s,xx=>{const y=yAt(xx)+2;c.fillStyle=tr('#a07a58');c.beginPath();c.ellipse(xx,y,12,5,0,0,Math.PI);c.fill();c.fillStyle=tr('#c8a070');c.beginPath();c.ellipse(xx,y,12,3,0,0,6.283);c.fill();});fx.yuva.push({x:s,y:yAt(s)-1});x+=50+R()*40;}
   else{const w=60+R()*80;for(let q=0;q<10;q++){const px=s+R()*w,dy=4+R()*14,r=1.6+R()*1.4;per(px,xx=>{c.fillStyle=tr(DN9_CICEK[q%8]);c.beginPath();c.arc(xx,y2(xx)+dy,r,0,6.283);c.fill();});}x+=w;}}
 } else if(l===2){
  tepe(yAt,ust,dolgu);
  let x=R()*20;while(x<Wd){const h=120+R()*120,sd=(x*7|0)+977,s=x,t=R();
   if(t<.62)per(s,xx=>dn9AgacUzak(c,xx,yAt(xx)+8,h,rng(sd),tr,Math.floor(dn9Hash(sd)*4)));
   else per(s,xx=>dn9TopAgac(c,xx,yAt(xx)+8,h*.2,tr,['#3e8a62','#4a966c'][sd%2],'#78c090'));
   x+=h*(.34+R()*.2);}
  // ağaçların dibinde çiçekli çayır şeridi
  const y3=x=>yAt(x)+14+Math.sin(x*.05)*3;c.fillStyle=dolgu;c.beginPath();c.moveTo(0,Hd+DN9_EXT);for(let xx=0;xx<=Wd;xx+=8)c.lineTo(xx,y3(xx));c.lineTo(Wd,Hd+DN9_EXT);c.fill();
  for(let k=0;k<160;k++){const px=R()*Wd,py=y3(px)+6+R()*30,r=1.8+R()*1.6;per(px,xx=>{c.fillStyle=tr(DN9_CICEK[k%8]);c.beginPath();c.arc(xx,py,r,0,6.283);c.fill();});}
 } else if(l===3){
  // yakın çalılar: yuvarlak tombul çalılar, eğrelti yaprakları, çiçek kümeleri
  c.fillStyle=dolgu;c.beginPath();c.moveTo(0,Hd+DN9_EXT);for(let x=0;x<=Wd;x+=6)c.lineTo(x,yAt(x));c.lineTo(Wd,Hd+DN9_EXT);c.closePath();c.fill();
  let x=0;while(x<Wd){const r=16+R()*26,s=x;per(s,xx=>{c.fillStyle=tr('#3a7e5c');c.beginPath();c.arc(xx,yAt(xx)+r*.4,r,Math.PI,0);c.fill();c.fillStyle=dolgu;c.beginPath();c.arc(xx+r*.2,yAt(xx)+r*.55,r*.85,Math.PI,0);c.fill();
   c.fillStyle=tr('#5aa67c');c.beginPath();c.arc(xx-r*.35,yAt(xx)-r*.25,r*.3,0,6.283);c.fill();});x+=r*1.2;}
  for(let k=0;k<24;k++){const lx=R()*Wd,s=.7+R()*.7;per(lx,xx=>{const y=yAt(xx)+4;c.strokeStyle=tr('#2e7050');c.lineWidth=2.2;c.lineCap='round';c.beginPath();c.moveTo(xx,y);c.bezierCurveTo(xx-4*s,y-20*s,xx+8*s,y-34*s,xx+18*s,y-30*s);c.stroke();
   for(let j=1;j<8;j++){const u=j/8,px=xx+u*14*s,py=y-u*30*s;c.fillStyle=tr('#3a8058');c.beginPath();c.ellipse(px-3*s,py-2*s,5*s*(1-u*.5),2*s,-.8,0,6.283);c.ellipse(px+3*s,py+1*s,5*s*(1-u*.5),2*s,.6,0,6.283);c.fill();}});}
  for(let k=0;k<40;k++){const px=R()*Wd,col=DN9_CICEK[k%8],dy=6+R()*10;per(px,xx=>{const y=yAt(xx)+dy;for(let j=0;j<3;j++){c.fillStyle=tr(col);c.beginPath();c.arc(xx+j*5-5,y-Math.abs(j-1)*3,2.4,0,6.283);c.fill();}});}
 } else if(l===4){
  // bulut denizi: kat kat tombul bulut tepeleri; üstleri güneşle altın-pembe parlar, altı yumuşak lila-şeftali
  const top=p?['#ffd8b0','#ffc4a8','#ffb4b0','#f8a8c0','#f0a0c0','#e898c4','#dc90c4']:['#ffffff','#fff6ee','#fff0f0','#f8ecf6','#f4e8f8','#eee6f8','#e8e2f6'],alt=p?['#e8a0b8','#dc98bc','#d094bc','#c890c0','#bc8cc0','#b088bc','#a880b8']:['#f8ecf4','#f0e6f4','#ece2f4','#e8e0f4','#e2ddf2','#dedbf0','#dcdaf0'];
  c.fillStyle=dolgu;c.beginPath();c.moveTo(0,Hd+DN9_EXT);for(let x=0;x<=Wd;x+=6)c.lineTo(x,yAt(x)+30);c.lineTo(Wd,Hd+DN9_EXT);c.closePath();c.fill();
  for(let row=0;row<7;row++){let x=R()*60;while(x<Wd){const r=34+R()*40+row*4,s=x,yy=yAt(s)+row*46+20;per(s,xx=>{const gr=c.createRadialGradient(xx-r*.25,yy-r*.45,2,xx,yy,r);gr.addColorStop(0,top[row]);gr.addColorStop(.55,dn9Mix(top[row],alt[row],.4));gr.addColorStop(1,alt[row]);c.fillStyle=gr;c.beginPath();c.arc(xx,yy,r,Math.PI*.9,Math.PI*2.1);c.lineTo(xx+r,yy+r);c.lineTo(xx-r,yy+r);c.closePath();c.fill();});x+=r*1.15;}}
  c.fillStyle=alt[6];c.fillRect(0,base-30,Wd,DN9_EXT+30);
 } else {
  // şelale ormanının uzak kayalıkları: yosunlu yuvarlak kaya duvarları, tepelerinde ağaçlar, yüzlerinde perde perde şelaleler
  const kaya=x=>yAt(x)-40*(.5+.5*Math.sin(x/Wd*6.2832*9+2));
  const gr=c.createLinearGradient(0,base-ofs-A1-A2-60,0,base);gr.addColorStop(0,tr('#8ab8b0'));gr.addColorStop(.6,tr('#6a9e98'));gr.addColorStop(1,dolgu);c.fillStyle=gr;
  c.beginPath();c.moveTo(0,Hd+DN9_EXT);for(let x=0;x<=Wd;x+=6)c.lineTo(x,kaya(x));c.lineTo(Wd,Hd+DN9_EXT);c.closePath();c.fill();
  // kaya katmanları ve yosun saçakları
  for(let k=0;k<60;k++){const x=R()*Wd,y=kaya(x)+20+R()*200,w=30+R()*70;per(x,xx=>{c.strokeStyle=tr('#5a8a88');c.globalAlpha=.5;c.lineWidth=2;c.beginPath();c.moveTo(xx-w/2,y);c.quadraticCurveTo(xx,y+6,xx+w/2,y);c.stroke();c.globalAlpha=1;});}
  for(let x=0;x<Wd;x+=10){const y=kaya(x);c.fillStyle=tr(dn9Hash(x)>.5?'#5aae80':'#68b88a');c.beginPath();c.ellipse(x,y+4,9,7+dn9Hash(x*3)*8,0,0,6.283);c.fill();}
  let x=R()*30;while(x<Wd){const r=12+R()*16,s=x,col=['#3e8a62','#4a966c','#56a074'][Math.floor(R()*3)];per(s,xx=>dn9TopAgac(c,xx,kaya(xx)+4,r,tr,col,'#8ad0a0'));x+=r*2+R()*30;}
  for(let k=0;k<7;k++){const sx=(k+.2+R()*.6)*Wd/7,w=14+R()*26,y0=kaya(sx)+6,y1=base-20;per(sx,xx=>{const g2=c.createLinearGradient(0,y0,0,y1);g2.addColorStop(0,'rgba(240,255,255,.92)');g2.addColorStop(.7,'rgba(220,250,250,.7)');g2.addColorStop(1,'rgba(220,250,250,.15)');c.fillStyle=g2;
    c.beginPath();c.moveTo(xx-w/2,y0);c.lineTo(xx+w/2,y0);c.quadraticCurveTo(xx+w/2+4,(y0+y1)/2,xx+w/2+8,y1);c.lineTo(xx-w/2-8,y1);c.quadraticCurveTo(xx-w/2-4,(y0+y1)/2,xx-w/2,y0);c.fill();
    c.fillStyle='rgba(255,255,255,.5)';for(let j=0;j<5;j++){c.beginPath();c.ellipse(xx+(j-2)*w*.3,y1-4,w*.4,8,0,0,6.283);c.fill();}});
   fx.su.push({x:sx,y:y0,L:y1-y0,w:w+6});}
 }
 // alt dolgu + katman pusu şeride basılı (karede ayrı tam genişlik pus çizimi yok)
 const F=dn9FxArt();c.fillStyle=dolgu;c.fillRect(0,base-1,Wd,DN9_EXT+1);
 if(l!==4){c.globalAlpha=[.7,.5,.36,.2,0,.6][l];c.drawImage(F.pus[p?2:(l===5?1:0)],0,base-[150,130,110,80,0,200][l],Wd,[170,150,130,100,0,220][l]);c.globalAlpha=1;}
 dn9Kirp(cv);DN9.serit[ad]=cv;return cv;
}

// ════════ Yakın dünya ressamları (zemin parçalarına bir kez boyanır; renkler yerin gün saatine göre dn9Ton ile) ════════
// taç renkleri: [ana, gölge, ışık, çiçek] — 0 pembe, 1 beyaz-gül, 2 leylak, 3 şeftali
const DN9_TAC=[['#f4a0c0','#d87aa4','#ffd0e0','#ffffff'],['#ffe0ea','#f0b4c8','#ffffff','#ff9ec0'],['#c8a8f0','#9c82d6','#e8dcff','#fff0ff'],['#ffc4a4','#ee9c86','#ffe4d0','#ffffff']];
// dev çiçekli ağaç: kalın kıvrık gövde, kök kıvrımları, iki-üç dal, kat kat çiçek bulutu taç, dökülen yapraklar; leylakta salkımlar
function dn9Agac(c,x,base,h,R,ti,yuva,Y){
 const K=DN9_TAC[ti%4].map(col=>dn9Ton(col,x)),gv=dn9Ton('#9a6a50',x),gvA=dn9Ton('#c08a66',x),gvK=dn9Ton('#6e4838',x),yes=dn9Ton('#5aa676',x),yesA=dn9Ton('#7cc48c',x);
 const eg=(R()-.5)*.3,bk=(R()-.5)*.4,tw=h*.075;
 const gx=u=>x+Math.sin(u*2.6)*bk*h*.12+u*u*eg*h*.3,gy=u=>base-u*h*.6;
 // kökler
 c.fillStyle=gv;for(const s of [-1,1]){c.beginPath();c.moveTo(x+s*tw*.4,base-tw*1.6);c.quadraticCurveTo(x+s*tw*1.2,base-tw*.3,x+s*tw*2.6,base+4);c.lineTo(x+s*tw*.6,base+4);c.closePath();c.fill();}
 // gövde (kalınlığı yukarı doğru incelir)
 c.beginPath();for(let k=0;k<=12;k++){const u=k/12,w=tw*(1-u*.5);k?c.lineTo(gx(u)-w,gy(u)):c.moveTo(gx(u)-w,gy(u));}for(let k=12;k>=0;k--){const u=k/12,w=tw*(1-u*.5);c.lineTo(gx(u)+w,gy(u));}c.closePath();c.fill();
 c.fillStyle=gvA;c.beginPath();for(let k=0;k<=12;k++){const u=k/12,w=tw*(1-u*.5);k?c.lineTo(gx(u)-w*.75,gy(u)):c.moveTo(gx(u)-w*.75,gy(u));}for(let k=12;k>=0;k--){const u=k/12,w=tw*(1-u*.5);c.lineTo(gx(u)-w*.2,gy(u));}c.closePath();c.fill();
 c.strokeStyle=gvK;c.lineWidth=1.6;c.globalAlpha=.5;for(let k=0;k<5;k++){const u=.1+k*.17;c.beginPath();c.moveTo(gx(u)+tw*.2,gy(u));c.quadraticCurveTo(gx(u+.04)+tw*.5,gy(u+.04),gx(u+.08)+tw*.1,gy(u+.08));c.stroke();}c.globalAlpha=1;
 // dallar ve taç kümeleri
 const tx=gx(1),ty=gy(1),kume=[[tx,ty-h*.18,h*.3]];
 c.strokeStyle=gv;c.lineCap='round';
 for(const s of [-1,1]){const bx=tx+s*h*(.22+R()*.08),by=ty-h*(.06+R()*.08);c.lineWidth=tw*.8;c.beginPath();c.moveTo(gx(.82),gy(.82));c.quadraticCurveTo(tx+s*h*.08,ty,bx,by);c.stroke();kume.push([bx,by-h*.06,h*(.2+R()*.06)]);}
 if(R()<.6){const s=R()<.5?-1:1,bx=tx+s*h*.1,by=ty-h*.3;c.lineWidth=tw*.55;c.beginPath();c.moveTo(tx,ty);c.quadraticCurveTo(tx+s*h*.02,ty-h*.16,bx,by);c.stroke();kume.push([bx,by-h*.04,h*.18]);}
 // yeşil yapraklar (taçın altında, gölgede)
 for(const [kx,ky,r] of kume)for(let k=0;k<5;k++){const a=R()*6.283,d=R()*r*.6;c.fillStyle=k%2?yes:yesA;c.beginPath();c.arc(kx+Math.cos(a)*d*1.3,ky+r*.35+Math.sin(a)*d*.4,r*(.26+R()*.12),0,6.283);c.fill();}
 // çiçek bulutları: gölge, ana, ışık katmanları
 for(const [kx,ky,r] of kume){
  for(let k=0;k<9;k++){const a=R()*6.283,d=R()*r*.7;c.fillStyle=K[1];c.beginPath();c.arc(kx+Math.cos(a)*d*1.3+r*.08,ky+Math.sin(a)*d*.6+r*.18,r*(.34+R()*.18),0,6.283);c.fill();}
  for(let k=0;k<9;k++){const a=R()*6.283,d=R()*r*.6;c.fillStyle=K[0];c.beginPath();c.arc(kx+Math.cos(a)*d*1.25,ky+Math.sin(a)*d*.55,r*(.3+R()*.16),0,6.283);c.fill();}
  for(let k=0;k<6;k++){const a=-1.6+(R()-.5)*2.2,d=r*(.3+R()*.4);c.fillStyle=K[2];c.beginPath();c.arc(kx+Math.cos(a)*d*1.1-r*.12,ky+Math.sin(a)*d*.55-r*.06,r*(.16+R()*.12),0,6.283);c.fill();}
  // tek tek çiçekler (beş yapraklı minik)
  for(let k=0;k<26;k++){const a=R()*6.283,d=Math.sqrt(R())*r*.95,px=kx+Math.cos(a)*d*1.3,py=ky+Math.sin(a)*d*.62,s=1.6+R()*1.8;c.fillStyle=k%3?K[3]:K[2];
   for(let j=0;j<5;j++){const b=j*1.2566+k;c.beginPath();c.arc(px+Math.cos(b)*s,py+Math.sin(b)*s,s*.8,0,6.283);c.fill();}c.fillStyle='#ffe27a';c.beginPath();c.arc(px,py,s*.5,0,6.283);c.fill();}
  if(Y)Y.yaprak.push({x:kx,y:ky,w:r*1.3,ci:ti});
 }
 // leylakta sarkan çiçek salkımları
 if(ti===2)for(let k=0;k<9;k++){const [kx,ky,r]=kume[k%kume.length],px=kx+(R()-.5)*r*2.2,py=ky+r*.3,L=r*(.4+R()*.5);for(let j=0;j<7;j++){const u=j/7;c.fillStyle=j%2?K[0]:K[2];c.beginPath();c.ellipse(px+Math.sin(u*3)*2,py+u*L,(1-u*.6)*r*.09,r*.07,0,0,6.283);c.fill();}}
 // dökülmüş taç yaprakları ve dipte yosun
 for(let k=0;k<22;k++){const px=x+(R()-.5)*h*.9,py=base+1+R()*5;c.fillStyle=k%2?K[0]:K[2];c.beginPath();c.ellipse(px,py,3+R()*2,1.5,R()*3,0,6.283);c.fill();}
 c.fillStyle=dn9Ton('#5aa870',x);c.beginPath();c.ellipse(x-tw*.8,base-2,tw*.9,5,0,0,6.283);c.fill();
 // dalda yaprak döşeli ejderha yuvası
 if(yuva){const [bx,by]=kume[1];dn9Yuva(c,bx-6,by+h*.08,.7,R,x);}
}
// yosunlu yuvarlak kaya: lila-gri taş, yumuşak ışık, tepesinde tombul yosun ve minik çiçekler
function dn9Kaya(c,x,y,s,R){
 const w=56*s,h=40*s,tas=dn9Ton('#a4a2bc',x),tasK=dn9Ton('#7c7a98',x),tasA=dn9Ton('#c8c6dc',x),yos=dn9Ton('#5ab07a',x),yosA=dn9Ton('#86d090',x);
 c.fillStyle=tasK;c.beginPath();c.ellipse(x,y-h*.42,w*.52,h*.58,0,0,6.283);c.fill();
 c.fillStyle=tas;c.beginPath();c.ellipse(x-w*.06,y-h*.5,w*.46,h*.5,0,0,6.283);c.fill();
 c.fillStyle=tasA;c.beginPath();c.ellipse(x-w*.2,y-h*.7,w*.2,h*.16,-.4,0,6.283);c.fill();
 c.fillStyle=yos;c.beginPath();c.moveTo(x-w*.46,y-h*.62);for(let k=0;k<=8;k++){const u=k/8,px=x-w*.46+u*w*.86,py=y-h*.82-Math.sin(u*Math.PI)*h*.22;c.quadraticCurveTo(px-w*.05,py-h*.14,px,py);}c.quadraticCurveTo(x+w*.2,y-h*.6,x-w*.46,y-h*.62);c.fill();
 c.fillStyle=yosA;for(let k=0;k<5;k++){c.beginPath();c.arc(x-w*.3+k*w*.15,y-h*.92-Math.sin(k/4*Math.PI)*h*.18,w*.06,0,6.283);c.fill();}
 for(let k=0;k<3;k++){const px=x-w*.25+R()*w*.5,py=y-h*.95-R()*h*.12;c.fillStyle=DN9_CICEK[Math.floor(R()*8)];c.beginPath();c.arc(px,py,2.2*s,0,6.283);c.fill();}
 // yosun saçakları
 c.strokeStyle=yos;c.lineWidth=2;c.lineCap='round';for(let k=0;k<4;k++){const px=x-w*.35+R()*w*.6;c.beginPath();c.moveTo(px,y-h*.66);c.quadraticCurveTo(px+2,y-h*.5,px-1,y-h*(.36+R()*.15));c.stroke();}
}
// ejderha yuvası (dekor): örülmüş dallardan dev kuş yuvası gibi yumuşak çanak, yaprak döşeli, içinde taç yaprakları ve battaniye ucu
function dn9Yuva(c,x,y,s,R,tx){
 const ton=col=>dn9Ton(col,tx===undefined?x:tx),w=58*s,h=24*s;
 c.fillStyle=ton('#8a5e40');c.beginPath();c.ellipse(x,y-h*.4,w,h*.7,0,0,Math.PI);c.fill();
 c.fillStyle=ton('#6a4a36');c.beginPath();c.ellipse(x,y-h*.4,w*.86,h*.36,0,0,6.283);c.fill();
 // içi: yumuşak yaprak döşeği, örgü battaniye ucu ve taç yaprakları
 c.fillStyle=ton('#8ad09a');c.beginPath();c.ellipse(x,y-h*.46,w*.78,h*.26,0,0,6.283);c.fill();
 c.fillStyle=ton(['#c8a8f0','#ffc29a','#9fe0c8'][Math.floor(R()*3)]);c.beginPath();c.ellipse(x+w*.25,y-h*.5,w*.36,h*.2,.1,0,6.283);c.fill();
 c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=1.2;for(let k=0;k<3;k++){c.beginPath();c.moveTo(x+w*(.02+k*.12),y-h*.62);c.lineTo(x+w*(.06+k*.12),y-h*.38);c.stroke();}
 for(let k=0;k<6;k++){c.fillStyle=ton(['#ffb0cc','#ffffff','#e0ccff'][k%3]);c.beginPath();c.ellipse(x+(R()-.5)*w*1.2,y-h*.48+(R()-.5)*h*.2,3*s+1,1.6*s+.6,R()*3,0,6.283);c.fill();}
 // örgü dalları (kenar)
 c.strokeStyle=ton('#b08058');c.lineWidth=2.4*s+.6;c.lineCap='round';
 for(let k=0;k<9;k++){const a0=.1+k*.33,a1=a0+.7;c.beginPath();c.ellipse(x,y-h*.3,w*(.92+R()*.1),h*(.55+R()*.15),0,a0,a1);c.stroke();}
 c.strokeStyle=ton('#d0a070');c.lineWidth=1.6*s+.4;for(let k=0;k<6;k++){const a0=.3+k*.42;c.beginPath();c.ellipse(x,y-h*.34,w*.95,h*.5,0,a0,a0+.5);c.stroke();}
 // kenardan sarkan yapraklar
 for(let k=0;k<7;k++){const a=Math.PI+.2+k*.4,px=x+Math.cos(a)*w*.95,py=y-h*.42+Math.sin(a)*h*.3;c.fillStyle=ton(k%2?'#5aa676':'#7cc48c');c.beginPath();c.ellipse(px,py,7*s+1,3.4*s+.5,a+1.2,0,6.283);c.fill();}
}
// kıvrık eğrelti otu: yay gibi kavisli yapraklar, ucunda salyangoz kıvrımı (yon ±1)
function dn9Egrelti(c,x,y,s,R,yon){
 const a=dn9Ton('#3e9a68',x),b=dn9Ton('#62b880',x),d=dn9Ton('#2e7a54',x);c.lineCap='round';
 const n=4+Math.floor(R()*3);
 for(let k=0;k<n;k++){const an=-1.57+(k/(n-1)-.5)*1.9*yon+(R()-.5)*.2,L=(34+R()*26)*s,ex=x+Math.cos(an)*L,ey=y+Math.sin(an)*L*1.05,cx2=x+Math.cos(an-.5*yon)*L*.6,cy2=y+Math.sin(an-.5*yon)*L*.75;
  c.strokeStyle=k%2?a:d;c.lineWidth=1.8*s+.4;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(cx2,cy2,ex,ey);c.stroke();
  for(let j=1;j<9;j++){const u=j/9,px=(1-u)*(1-u)*x+2*u*(1-u)*cx2+u*u*ex,py=(1-u)*(1-u)*y+2*u*(1-u)*cy2+u*u*ey,l=(1-u*.7)*8*s;c.fillStyle=j%2?b:a;
   c.beginPath();c.ellipse(px-3*s,py+1,l,2.2*s,an+.9,0,6.283);c.ellipse(px+3*s,py+1,l,2.2*s,an-.9,0,6.283);c.fill();}
  if(k===Math.floor(n/2)){c.strokeStyle=b;c.lineWidth=1.8*s;c.beginPath();for(let j=0;j<=14;j++){const t=j/14*5.5,r=6*s*(1-j/16);c.lineTo(ex+Math.cos(t)*r*yon,ey-4*s+Math.sin(t)*r);}c.stroke();}}
}
// çiçek demeti: ince saplar, beş yapraklı çiçekler (biri pul gibi yanardöner: ışık gelince karede parlar)
function dn9Demet(c,x,y,s,R,Y){
 const n=3+Math.floor(R()*3),sap=dn9Ton('#4aa070',x);c.lineCap='round';
 for(let k=0;k<n;k++){const px=x+(k-(n-1)/2)*7*s+(R()-.5)*4,py=y-(14+R()*16)*s,col=dn9Ton(DN9_CICEK[Math.floor(R()*8)],x),r=(3.2+R()*1.6)*s;
  c.strokeStyle=sap;c.lineWidth=1.4*s;c.beginPath();c.moveTo(x+(k-(n-1)/2)*2,y);c.quadraticCurveTo(px+2,(y+py)/2,px,py);c.stroke();
  c.fillStyle=sap;c.beginPath();c.ellipse(px+3*s,(y+py)/2+3,4*s,1.6*s,.6,0,6.283);c.fill();
  c.fillStyle=col;for(let j=0;j<5;j++){const b=j*1.2566+k;c.beginPath();c.ellipse(px+Math.cos(b)*r*.9,py+Math.sin(b)*r*.9,r*.75,r*.5,b,0,6.283);c.fill();}
  c.fillStyle='#ffe27a';c.beginPath();c.arc(px,py,r*.42,0,6.283);c.fill();
  if(Y&&k===0&&R()<.5)Y.cicek.push({x:px,y:py,r:r*3,col:DN9_KALP[Math.floor(R()*3)],ph:R()*6.283});}
}
// minik sevimli mantar
function dn9Mantar(c,x,y,s,col){
 c.fillStyle='#f4ecdc';c.beginPath();c.moveTo(x-4*s,y);c.quadraticCurveTo(x-5*s,y-8*s,x-3*s,y-12*s);c.lineTo(x+3*s,y-12*s);c.quadraticCurveTo(x+5*s,y-8*s,x+4*s,y);c.closePath();c.fill();
 c.fillStyle=col;c.beginPath();c.ellipse(x,y-12*s,10*s,7*s,0,Math.PI,0);c.quadraticCurveTo(x,y-9*s,x-10*s,y-12*s);c.fill();
 c.fillStyle='rgba(255,255,255,.85)';for(const [a,b,r] of [[-4,-15,2],[3,-16,1.6],[6,-13,1.2]]){c.beginPath();c.arc(x+a*s,y+b*s,r*s,0,6.283);c.fill();}
}
// kocaman yaprak platformu (çayır/giriş): üst kenar = platform; sapı zemine iner
function dn9YaprakPlat(c,p,R){
 const cx=(p.x0+p.x1)/2,w=p.x1-p.x0,y=p.y,ya=dn9Ton('#4aae74',cx),yA=dn9Ton('#7ccc8c',cx),yK=dn9Ton('#2e8a5a',cx);
 c.strokeStyle=yK;c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(cx+w*.1,p.tab+4);c.bezierCurveTo(cx+w*.35,p.tab-(p.tab-y)*.4,cx-w*.2,y+30,cx,y+8);c.stroke();
 c.fillStyle=yK;c.beginPath();c.ellipse(cx,y+8,w*.62,13,0,0,6.283);c.fill();
 c.fillStyle=ya;c.beginPath();c.moveTo(p.x0-w*.14,y+4);c.bezierCurveTo(p.x0,y-8,p.x1,y-8,p.x1+w*.18,y-2);c.bezierCurveTo(p.x1,y+16,p.x0,y+18,p.x0-w*.14,y+4);c.fill();
 c.strokeStyle=yA;c.lineWidth=1.6;c.beginPath();c.moveTo(p.x0-w*.1,y+4);c.quadraticCurveTo(cx,y-1,p.x1+w*.14,y-1);c.stroke();
 for(let k=1;k<6;k++){const px=p.x0+k*w/6;c.beginPath();c.moveTo(px,y+1);c.lineTo(px+8,y-5);c.moveTo(px,y+1);c.lineTo(px+6,y+9);c.stroke();}
 c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(cx-w*.2,y-3,w*.2,2.4,0,0,6.283);c.fill();
 // üstünde bir iki çiy tanesi (karede parlar)
 c.fillStyle='rgba(230,255,255,.85)';c.beginPath();c.arc(cx+w*.25,y-4,2.4,0,6.283);c.fill();
}
// dev çiçek tablası (çayırda): yassı açık çiçek, ortası altın, sapı kalın
function dn9CicekPlat(c,p,R){
 const cx=(p.x0+p.x1)/2,w=p.x1-p.x0,y=p.y,sap=dn9Ton('#4aa070',cx);
 c.strokeStyle=sap;c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(cx-6,p.tab+4);c.quadraticCurveTo(cx+14,(p.tab+y)/2,cx,y+12);c.stroke();
 c.fillStyle=sap;c.beginPath();c.ellipse(cx+18,(p.tab+y)/2+8,18,7,.5,0,6.283);c.fill();
 const pa=dn9Ton('#ff9fc0',cx),pb=dn9Ton('#ffd0e0',cx);
 for(let k=0;k<10;k++){const a=Math.PI+k/9*Math.PI;c.fillStyle=k%2?pa:pb;c.beginPath();c.ellipse(cx+Math.cos(a)*w*.42,y+8+Math.sin(a)*8,w*.2,10,a,0,6.283);c.fill();}
 c.fillStyle=pa;c.beginPath();c.ellipse(cx,y+8,w*.6,9,0,0,6.283);c.fill();
 c.fillStyle=dn9Ton('#ffd27a',cx);c.beginPath();c.ellipse(cx,y+3,w*.3,6,0,0,6.283);c.fill();
 c.fillStyle='rgba(255,250,200,.7)';for(let k=0;k<10;k++){c.beginPath();c.arc(cx+(R()-.5)*w*.5,y+2+(R()-.5)*4,1.4,0,6.283);c.fill();}
}
// yosunlu taş çıkıntı (şelale ormanı): taş sütunun üstünde yassı taş
function dn9TasPlat(c,p,R){
 const cx=(p.x0+p.x1)/2,w=p.x1-p.x0,y=p.y,tas=dn9Ton('#8a9aa8',cx),tasK=dn9Ton('#62707e',cx),tasA=dn9Ton('#b4c4cc',cx),yos=dn9Ton('#4aa878',cx);
 c.fillStyle=tasK;c.beginPath();c.moveTo(cx-w*.26,p.tab+4);c.quadraticCurveTo(cx-w*.34,(p.tab+y)/2,cx-w*.3,y+14);c.lineTo(cx+w*.3,y+14);c.quadraticCurveTo(cx+w*.36,(p.tab+y)/2,cx+w*.26,p.tab+4);c.closePath();c.fill();
 c.fillStyle=tas;for(let k=0;k<3;k++){c.beginPath();c.ellipse(cx-w*.08+k*w*.1,y+30+k*((p.tab-y-30)/3),w*.2,10,0,0,6.283);c.fill();}
 dn9Yk(c,p.x0-6,y,w+12,18,9);c.fillStyle=tas;c.fill();
 c.fillStyle=tasA;c.fillRect(p.x0+2,y+2,w-4,3);
 c.fillStyle=yos;c.beginPath();c.moveTo(p.x0-6,y+4);for(let k=0;k<=8;k++){const px=p.x0-6+k*(w+12)/8;c.quadraticCurveTo(px-4,y-6,px,y+1);}c.lineTo(p.x1+6,y+6);c.closePath();c.fill();
 c.strokeStyle=yos;c.lineWidth=2;c.lineCap='round';for(let k=0;k<5;k++){const px=p.x0+R()*w;c.beginPath();c.moveTo(px,y+12);c.quadraticCurveTo(px+3,y+22,px,y+28+R()*14);c.stroke();}
}
// uçan adacık platformu: çimenli üst (platform), yuvarlak kaya alt, sarkan kökler ve yosun; bir kenarından minik şelale (karede)
function dn9AdaPlat(c,p,R,Y){
 const cx=(p.x0+p.x1)/2,w=p.x1-p.x0,y=p.y,der=clamp((p.tab-y)*.5,46,96),tas=dn9Ton('#9a94b4',cx),tasK=dn9Ton('#736c92',cx),tasA=dn9Ton('#c0bcd6',cx);
 c.fillStyle=tasK;c.beginPath();c.moveTo(p.x0-10,y+6);c.bezierCurveTo(p.x0,y+der*.7,cx-w*.2,y+der,cx+w*.05,y+der+6);c.bezierCurveTo(cx+w*.3,y+der*.9,p.x1+4,y+der*.5,p.x1+10,y+6);c.closePath();c.fill();
 c.fillStyle=tas;c.beginPath();c.moveTo(p.x0-10,y+6);c.bezierCurveTo(p.x0,y+der*.5,cx-w*.1,y+der*.7,cx+w*.05,y+der*.66);c.bezierCurveTo(cx+w*.25,y+der*.5,p.x1,y+der*.3,p.x1+10,y+6);c.closePath();c.fill();
 c.strokeStyle=tasA;c.lineWidth=2;c.globalAlpha=.6;for(let k=0;k<3;k++){c.beginPath();c.moveTo(p.x0+w*(.05+k*.08),y+14+k*12);c.quadraticCurveTo(cx,y+20+k*14,p.x1-w*(.05+k*.1),y+12+k*12);c.stroke();}c.globalAlpha=1;
 // minik kristal parçaları (kayada)
 for(let k=0;k<2;k++){const kx=cx+(R()-.5)*w*.6,ky=y+der*.45+R()*10,col=DN9_KALP[Math.floor(R()*3)];c.fillStyle=col;c.beginPath();c.moveTo(kx,ky-8);c.lineTo(kx+4,ky);c.lineTo(kx,ky+4);c.lineTo(kx-4,ky);c.closePath();c.fill();if(Y)Y.cicek.push({x:kx,y:ky,r:14,col,ph:R()*6.283});}
 // sarkan kökler ve yosun saçakları
 c.lineCap='round';for(let k=0;k<7;k++){const px=p.x0+R()*w,py=y+der*(.3+R()*.4),L=18+R()*38;c.strokeStyle=k%2?dn9Ton('#8a6650',cx):dn9Ton('#4aa070',cx);c.lineWidth=k%2?2.2:1.8;c.beginPath();c.moveTo(px,py);c.bezierCurveTo(px+5,py+L*.4,px-5,py+L*.7,px+(R()-.5)*6,py+L);c.stroke();
  if(k%2===0){c.fillStyle=dn9Ton('#62b880',cx);c.beginPath();c.ellipse(px+(R()-.5)*4,py+L,3,2,0,0,6.283);c.fill();}}
 // çimenli üst: tombul yosun ve çimen, minik çiçekler
 c.fillStyle=dn9Ton('#3e9a68',cx);c.beginPath();c.ellipse(cx,y+7,w*.5+12,10,0,0,6.283);c.fill();
 c.fillStyle=dn9Ton('#5ab87c',cx);c.beginPath();c.ellipse(cx,y+3,w*.5+8,7,0,0,6.283);c.fill();
 for(let x=p.x0-6;x<p.x1+6;x+=6){const hh=4+dn9Hash(x)*6;c.strokeStyle=dn9Ton(dn9Hash(x*2)>.6?'#9ae0a0':'#62c080',cx);c.lineWidth=1.8;c.beginPath();c.moveTo(x,y+3);c.quadraticCurveTo(x+1,y-hh*.6,x+2,y-hh);c.stroke();}
 for(let k=0;k<4;k++){const px=p.x0+R()*w;c.fillStyle=DN9_CICEK[Math.floor(R()*8)];for(let j=0;j<5;j++){const b=j*1.2566;c.beginPath();c.arc(px+Math.cos(b)*2.4,y-2+Math.sin(b)*2.4,1.9,0,6.283);c.fill();}c.fillStyle='#ffe27a';c.beginPath();c.arc(px,y-2,1.3,0,6.283);c.fill();}
 if(Y){const sol=dn9Hash(p.x0)<.5,sx=sol?p.x0+6:p.x1-6;Y.adaSu.push({x:sx,y:y+12,L:Math.min(p.tab-y-14,90+dn9Hash(p.x1)*60),ph:dn9Hash(p.x0*3)*6.283});
  Y.adaYuz.push({x0:p.x0,x1:p.x1,y,der,ph:dn9Hash(p.x0*7)*6.283});}
}
// şelale kayalığı: zeminin arkasında yuvarlak yosunlu kaya duvarı, tepesinden kat kat inen su perdesi; havuz ve köpük karede canlanır
function dn9SelaleCiz(c,b,R,Y){
 const x=b.x,y=b.y,h=b.h,w=b.w,kw=w+280,ust=y-h,tas=dn9Ton('#8cb8a4',x),tasK=dn9Ton('#5c887a',x),tasA=dn9Ton('#b0dac4',x),yos=dn9Ton('#44a874',x),yosA=dn9Ton('#76c890',x);
 // kaya duvarı (yuvarlak bloklar)
 c.fillStyle=tasK;c.beginPath();c.moveTo(x-kw/2,y+10);c.bezierCurveTo(x-kw*.52,ust+h*.3,x-kw*.36,ust,x-w*.4,ust-6);c.lineTo(x+w*.4,ust-6);c.bezierCurveTo(x+kw*.36,ust,x+kw*.52,ust+h*.3,x+kw/2,y+10);c.closePath();c.fill();
 for(let k=0;k<16;k++){const s=R()<.5?-1:1,bx=x+s*(w*.5+R()*kw*.35),by=ust+30+R()*(h-30),r=24+R()*40;c.fillStyle=k%3?tas:tasA;c.beginPath();c.ellipse(bx,by,r,r*.8,0,0,6.283);c.fill();
  c.fillStyle='rgba(255,255,255,.14)';c.beginPath();c.ellipse(bx-r*.25,by-r*.35,r*.45,r*.22,-.3,0,6.283);c.fill();
  if(k%2===0){c.fillStyle=k%4?yos:yosA;c.beginPath();c.ellipse(bx,by-r*.62,r*.8,r*.26,0,Math.PI,0);c.fill();if(R()<.6){c.fillStyle=dn9Ton(DN9_CICEK[k%8],x);c.beginPath();c.arc(bx+(R()-.5)*r,by-r*.7,3,0,6.283);c.fill();}}}
 // yosun örtüsü ve sarkan yosun saçakları, eğreltiler
 c.fillStyle=yos;c.beginPath();c.moveTo(x-kw*.4,ust+20);for(let k=0;k<=12;k++){const u=k/12,px=x-kw*.4+u*kw*.8,py=ust-4+Math.sin(u*9)*6;c.quadraticCurveTo(px-10,py-10,px,py);}c.lineTo(x+kw*.4,ust+30);c.quadraticCurveTo(x,ust+40,x-kw*.4,ust+20);c.fill();
 c.fillStyle=yosA;for(let k=0;k<10;k++){c.beginPath();c.arc(x-kw*.36+k*kw*.08,ust-6+Math.sin(k*1.7)*4,8+R()*5,0,6.283);c.fill();}
 c.strokeStyle=yos;c.lineWidth=2.2;c.lineCap='round';for(let k=0;k<18;k++){const px=x+(R()<.5?-1:1)*(w*.5+R()*kw*.3),py=ust+10+R()*h*.5,L=20+R()*50;c.beginPath();c.moveTo(px,py);c.quadraticCurveTo(px+3,py+L*.5,px-2,py+L);c.stroke();}
 for(let k=0;k<4;k++)dn9Egrelti(c,x+(k<2?-1:1)*(w*.6+R()*60),ust+4,.8+R()*.4,R,k<2?-1:1);
 // tepedeki ağaç tepecikleri
 for(let k=0;k<3;k++){const px=x+(k-1)*kw*.3+(R()-.5)*30;dn9TopAgac(c,px,ust+2,22+R()*14,col=>dn9Ton(col,x),['#3e9a6a','#4aa676','#58b080'][k],'#8ad8a0');}
 // su perdesi: kat kat (ortada çıkıntı)
 const kat=b.n||2,sy=[ust];for(let k=1;k<kat;k++)sy.push(ust+h*k/kat);sy.push(y+6);
 for(let k=0;k<kat;k++){const y0=sy[k],y1=sy[k+1],ww=w*(1-k*.08);
  const gr=c.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,dn9Ton('#e8fcff',x));gr.addColorStop(.25,dn9Ton('#aee8f0',x));gr.addColorStop(1,dn9Ton('#7ed4e4',x));c.fillStyle=gr;
  c.beginPath();c.moveTo(x-ww/2,y0);c.quadraticCurveTo(x-ww/2-6,y0+8,x-ww/2-4,y0+22);c.lineTo(x-ww/2-10,y1);c.lineTo(x+ww/2+10,y1);c.lineTo(x+ww/2+4,y0+22);c.quadraticCurveTo(x+ww/2+6,y0+8,x+ww/2,y0);c.closePath();c.fill();
  c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=2;for(let j=0;j<7;j++){const px=x-ww/2+ww*(j+.5)/7;c.beginPath();c.moveTo(px,y0+4);c.lineTo(px+(R()-.5)*4,y1-4);c.stroke();}
  c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.ellipse(x,y0+2,ww*.52,5,0,0,6.283);c.fill();
  if(k<kat-1){c.fillStyle=tasA;dn9Yk(c,x-ww/2-24,y1-6,ww+48,16,8);c.fill();c.fillStyle=yos;c.fillRect(x-ww/2-20,y1-8,ww+40,4);}
  if(Y)Y.su.push({x,y0:y0+4,y1,w:ww,k,ph:R()*6.283});}
 if(Y)Y.kopuk.push({x,y:y+4,w:w*1.3,ph:R()*6.283});
 for(const yy of sy.slice(1,-1))if(Y)Y.kopuk.push({x,y:yy,w:w*.9,ph:R()*6.283,kucuk:1});
}
// kalkış kayalığı / dağın yamacı: zemin bitince aşağı inen yuvarlak kaya yüzü (yon +1 sağa bakan kenar)
function dn9Ucurum(c,b,R){
 const x=b.x,y=b.y,s=b.yon,tas=dn9Ton('#9a92b0',x),tasK=dn9Ton('#6e6890',x),yos=dn9Ton('#4aa878',x);
 c.fillStyle=tasK;c.beginPath();c.moveTo(x-s*60,y);c.quadraticCurveTo(x+s*24,y+20,x+s*10,y+120);c.quadraticCurveTo(x-s*10,y+260,x+s*18,y+420);c.lineTo(x-s*20,1200);c.lineTo(x-s*300,1200);c.quadraticCurveTo(x-s*250,y+190,x-s*130,y+14);c.closePath();c.fill();   // iç kenar: toprağa yumuşak kavisle karışır (düz dikey kesik yok)
 for(let k=0;k<12;k++){const by=y+30+k*70+R()*30,bx=x-s*(20+R()*90),r=22+R()*30;c.fillStyle=k%2?tas:dn9Mix(tas,tasK,.4);c.beginPath();c.ellipse(bx,by,r,r*.7,0,0,6.283);c.fill();}
 c.strokeStyle=yos;c.lineWidth=2.4;c.lineCap='round';for(let k=0;k<10;k++){const px=x-s*(R()*70),py=y+6+R()*20,L=30+R()*90;c.beginPath();c.moveTo(px,py);c.bezierCurveTo(px+s*8,py+L*.4,px-s*4,py+L*.7,px+s*6,py+L);c.stroke();
  c.fillStyle=dn9Ton(DN9_CICEK[k%8],x);c.beginPath();c.arc(px+s*6,py+L,2.6,0,6.283);c.fill();}
 c.fillStyle=yos;c.beginPath();c.ellipse(x-s*20,y+4,60,12,0,0,6.283);c.fill();
 // üstte zeminin çimeni kesintisiz sürer (kaya önde çizildiği için çimen dudağını burada yeniden kur), kenarda kıvrılıp biter
 const ev=s<0,CZ=ev?['#4a7a62','#6aac7e','#9ad09a']:['#2e7a52','#46a46c','#7ccc8a'],DY=[9,3,-1],RX=[13,12,8],RY=[8,7.5,3];
 for(let j=0;j<3;j++){c.fillStyle=dn9Ton(CZ[j],x);for(let k=0;k<=18;k++){const px=x-s*(140-k*8.4),w=dn9Hash(px*.37),u=k/18;c.beginPath();c.ellipse(px,y+DY[j]-1+w*2+u*u*6,(RX[j]+w*3)*(1-u*.35),RY[j]+w*1.5,0,0,6.283);c.fill();}}
 for(let k=0;k<6;k++){const px=x-s*(20+R()*110);c.fillStyle=dn9Ton(DN9_CICEK[(k*3)%8],x);c.beginPath();c.arc(px,y-3-R()*4,2.4,0,6.283);c.fill();}
}

// ════════ Büyükanne'nin dağ yuvası: kaya ev (yuvarlak kapı, sıcak pencereler), Kalbi çerçeveleyen taş kemer, battaniyeler,
//          örgü sepeti, minderler, kocaman uyku yuvası, kristal kümeleri, fener direkleri ════════
// kaya ev: yuvarlak tombul kaya, bal rengi yuvarlak kapı, iki yuvarlak sıcak pencere (ışığı karede), çiçek saksıları, tepesinde yosun
function dn9KayaEv(c,b,R,Y){
 const x=b.x,y=b.y,w=300,h=250,tas=dn9Ton('#a898b8',x),tasK=dn9Ton('#7a6a92',x),tasA=dn9Ton('#cabce0',x);
 c.fillStyle=tasK;c.beginPath();c.moveTo(x-w/2,y+6);c.bezierCurveTo(x-w*.56,y-h*.7,x-w*.3,y-h*1.04,x,y-h);c.bezierCurveTo(x+w*.34,y-h*1.02,x+w*.58,y-h*.66,x+w/2,y+6);c.closePath();c.fill();
 c.fillStyle=tas;c.beginPath();c.moveTo(x-w*.46,y+6);c.bezierCurveTo(x-w*.5,y-h*.66,x-w*.28,y-h*.94,x-w*.02,y-h*.92);c.bezierCurveTo(x+w*.24,y-h*.9,x+w*.44,y-h*.6,x+w*.4,y+6);c.closePath();c.fill();
 for(let k=0;k<9;k++){const bx=x+(R()-.5)*w*.8,by=y-R()*h*.8,r=14+R()*20;c.fillStyle=k%2?tasA:dn9Mix(tas,tasK,.3);c.globalAlpha=.6;c.beginPath();c.ellipse(bx,by,r,r*.7,0,0,6.283);c.fill();c.globalAlpha=1;}
 // yosun ve çiçek örtüsü (tepede)
 c.fillStyle=dn9Ton('#5aae7a',x);c.beginPath();c.ellipse(x,y-h*.94,w*.34,22,0,Math.PI,0);c.fill();
 for(let k=0;k<9;k++){c.fillStyle=dn9Ton(k%2?'#7ccc8c':'#4aa070',x);c.beginPath();c.arc(x-w*.3+k*w*.075,y-h*.95-Math.sin(k/8*Math.PI)*16,9,0,6.283);c.fill();}
 for(let k=0;k<8;k++){c.fillStyle=dn9Ton(DN9_CICEK[k%8],x);c.beginPath();c.arc(x-w*.26+R()*w*.52,y-h*.98-R()*16,3,0,6.283);c.fill();}
 // yuvarlak kapı
 const kx=x-w*.08,kw=78,kh=108;c.fillStyle=dn9Ton('#6a4a3a',x);c.beginPath();c.moveTo(kx-kw/2-8,y+2);c.lineTo(kx-kw/2-8,y-kh+kw/2);c.arc(kx,y-kh+kw/2,kw/2+8,Math.PI,0);c.lineTo(kx+kw/2+8,y+2);c.closePath();c.fill();
 c.fillStyle=dn9Ton('#e0a058',x);c.beginPath();c.moveTo(kx-kw/2,y+2);c.lineTo(kx-kw/2,y-kh+kw/2);c.arc(kx,y-kh+kw/2,kw/2,Math.PI,0);c.lineTo(kx+kw/2,y+2);c.closePath();c.fill();
 c.strokeStyle=dn9Ton('#b87840',x);c.lineWidth=3;for(const dx of [-20,0,20]){c.beginPath();c.moveTo(kx+dx,y);c.lineTo(kx+dx,y-kh+kw/2-Math.sqrt(Math.max(0,kw*kw/4-dx*dx))+4);c.stroke();}
 c.fillStyle=dn9Ton('#ffd27a',x);c.beginPath();c.arc(kx+22,y-kh*.45,5,0,6.283);c.fill();
 c.fillStyle=dn9Ton('#ffe8b0',x);c.beginPath();c.arc(kx,y-kh+kw/2-6,12,0,6.283);c.fill();   // kapı penceresi
 if(Y)Y.pen.push({x:kx,y:y-kh+kw/2-6,r:12,ph:R()*6.283});
 // pencereler ve saksılar
 for(const [px,py,r] of [[x+w*.24,y-h*.5,24],[x-w*.32,y-h*.58,18]]){c.fillStyle=dn9Ton('#6a4a3a',x);c.beginPath();c.arc(px,py,r+6,0,6.283);c.fill();
  c.fillStyle=dn9Ton('#ffd890',x);c.beginPath();c.arc(px,py,r,0,6.283);c.fill();c.strokeStyle=dn9Ton('#a06a40',x);c.lineWidth=3;c.beginPath();c.moveTo(px-r,py);c.lineTo(px+r,py);c.moveTo(px,py-r);c.lineTo(px,py+r);c.stroke();
  c.fillStyle=dn9Ton('#c87850',x);dn9Yk(c,px-r-4,py+r+4,r*2+8,12,4);c.fill();
  for(let k=0;k<5;k++){c.fillStyle=dn9Ton(['#ff9fc0','#ffd27a','#b89cff','#ffffff','#ff9fc0'][k],x);c.beginPath();c.arc(px-r+4+k*(r*2-8)/4,py+r,4.4,0,6.283);c.fill();}
  if(Y)Y.pen.push({x:px,y:py,r,ph:R()*6.283});}
 // kapı önünde paspas ve basamak taşı
 c.fillStyle=dn9Ton('#c890b8',x);dn9Yk(c,kx-44,y-4,88,8,4);c.fill();c.fillStyle='rgba(255,255,255,.4)';for(let k=0;k<5;k++)c.fillRect(kx-38+k*18,y-3,8,4);
}
// taş kemer: Ejderha Kalbi'ni arkadan çerçeveler (içi boş; yumuşak altın-lila ışığı karede)
function dn9Kemer(c,b,R,Y){
 const x=b.x,y=b.y,w=330,h=440,tas=dn9Ton('#c2a8c8',x),tasK=dn9Ton('#8a7098',x),tasA=dn9Ton('#e4d2ec',x),yos=dn9Ton('#5aae7a',x),yosA=dn9Ton('#86d090',x);
 const cy=y-h+w/2,R1=w/2,R2=w/2-46;
 // sütunlar: üst üste yuvarlatılmış taş bloklar (hafif sağa sola kayık)
 for(const s of [-1,1])for(let k=0;k<6;k++){const bx=x+s*(R1-23)+(dn9Hash(k*3.1+s)-.5)*6,by=y-k*(y-cy)/6,bw=50-k*1.2,bh=(y-cy)/6-3;
  c.fillStyle=tasK;dn9Yk(c,bx-bw/2+2,by-bh+2,bw,bh,10);c.fill();c.fillStyle=k%2?tas:dn9Mix(tas,tasA,.25);dn9Yk(c,bx-bw/2,by-bh,bw,bh-2,10);c.fill();
  c.fillStyle='rgba(255,255,255,.28)';dn9Yk(c,bx-bw/2+6,by-bh+4,bw*.5,4,2);c.fill();}
 // yay: kama biçimli taşlar
 const n=11;for(let k=0;k<n;k++){const a0=Math.PI+k/n*Math.PI+.012,a1=Math.PI+(k+1)/n*Math.PI-.012;
  c.fillStyle=tasK;c.beginPath();c.arc(x+2,cy+3,R1,a0,a1);c.arc(x+2,cy+3,R2,a1,a0,true);c.closePath();c.fill();
  c.fillStyle=k%2?tas:dn9Mix(tas,tasA,.3);c.beginPath();c.arc(x,cy,R1,a0,a1);c.arc(x,cy,R2,a1,a0,true);c.closePath();c.fill();
  c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=3;c.beginPath();c.arc(x,cy,R1-5,a0+.03,a1-.03);c.stroke();}
 // kilit taşı (kalp biçimli değil; yuvarlak, üstünde kristaller)
 c.fillStyle=tasA;dn9Yk(c,x-26,cy-R1-10,52,58,16);c.fill();c.fillStyle=tas;dn9Yk(c,x-20,cy-R1-4,40,44,12);c.fill();
 // yosun örtüsü, çiçekli sarmaşık saçakları
 c.fillStyle=yos;for(let k=0;k<14;k++){const a=Math.PI*1.04+k/13*Math.PI*.92;c.beginPath();c.ellipse(x+Math.cos(a)*(R1-4),cy+Math.sin(a)*(R1-4)-4,13,8,a+1.57,0,6.283);c.fill();}
 c.fillStyle=yosA;for(let k=0;k<9;k++){const a=Math.PI*1.12+k/8*Math.PI*.76;c.beginPath();c.arc(x+Math.cos(a)*(R1+2),cy+Math.sin(a)*(R1+2)-6,6,0,6.283);c.fill();}
 c.strokeStyle=yos;c.lineWidth=2.4;c.lineCap='round';for(let k=0;k<13;k++){const a=Math.PI+(k+.5)/13*Math.PI,bx=x+Math.cos(a)*(R2+6),by=cy+Math.sin(a)*(R2+6),L=18+R()*50;c.beginPath();c.moveTo(bx,by);c.quadraticCurveTo(bx+4,by+L*.5,bx-2,by+L);c.stroke();
  for(let j=1;j<4;j++){c.fillStyle=j%2?yos:yosA;c.beginPath();c.ellipse(bx+1+(j%2?3:-3),by+L*j/4,4,2.2,j%2?.6:-.6,0,6.283);c.fill();}
  c.fillStyle=dn9Ton(DN9_CICEK[k%8],x);c.beginPath();c.arc(bx-2,by+L,3.6,0,6.283);c.fill();}
 for(const s of [-1,1])for(let k=0;k<4;k++){const bx=x+s*(R1+4),by=y-30-k*60;c.fillStyle=k%2?yos:yosA;c.beginPath();c.ellipse(bx,by,10,16,0,0,6.283);c.fill();c.fillStyle=dn9Ton(DN9_CICEK[(k+3)%8],x);c.beginPath();c.arc(bx+s*4,by-6,3.4,0,6.283);c.fill();}
 // kemerin tepesinde küçük kristaller
 for(const [dx,s,ci] of [[-30,.7,0],[0,1,2],[30,.7,1]])dn9Kristal(c,x+dx,cy-R1-8,s,ci,Y,R);
 if(Y)Y.kemer={x,y:y-200,w,h};
}
// kristal kümesi: yuvarlak tabanlı yumuşak kristaller (ışıması karede)
function dn9Kristal(c,x,y,s,ci,Y,R){
 const ana=DN9_KALP[ci],acik=dn9Mix(ana,'#ffffff',.55),koyu=dn9Mix(ana,'#5a3c8c',.35);
 c.fillStyle=dn9Ton('#8a7a9a',x);c.beginPath();c.ellipse(x,y,22*s,7*s,0,0,6.283);c.fill();
 for(const [dx,hh,ww,a] of [[-12,26,8,-.35],[12,22,7,.32],[0,40,10,0],[-5,18,6,-.1],[7,16,6,.15]]){c.save();c.translate(x+dx*s,y);c.rotate(a);
  c.fillStyle=koyu;c.beginPath();c.moveTo(-ww*s,0);c.lineTo(-ww*s,-hh*s*.7);c.lineTo(0,-hh*s);c.lineTo(ww*s,-hh*s*.7);c.lineTo(ww*s,0);c.closePath();c.fill();
  c.fillStyle=ana;c.beginPath();c.moveTo(-ww*s*.2,0);c.lineTo(-ww*s*.2,-hh*s*.75);c.lineTo(0,-hh*s);c.lineTo(ww*s,-hh*s*.7);c.lineTo(ww*s,0);c.closePath();c.fill();
  c.fillStyle=acik;c.globalAlpha=.8;c.beginPath();c.moveTo(-ww*s*.7,-hh*s*.2);c.lineTo(-ww*s*.7,-hh*s*.65);c.lineTo(-ww*s*.3,-hh*s*.8);c.lineTo(-ww*s*.3,-hh*s*.25);c.closePath();c.fill();c.globalAlpha=1;c.restore();}
 if(Y)Y.kristal.push({x,y:y-20*s,r:44*s,col:ana,ph:(R?R():.5)*6.283});
}
// örgü battaniye (kaya üstüne serili): çizgili, kalpli, püsküllü
function dn9Battaniye(c,x,y,s,R,ci){
 const renk=[['#c8a8f0','#ffffff','#ffc29a'],['#ffc29a','#fff0e0','#ff9fc0'],['#9fe0c8','#ffffff','#b89cff']][ci%3].map(q=>dn9Ton(q,x));
 dn9Kaya(c,x,y,s*1.2,R);
 const w=64*s,top=y-46*s;c.fillStyle=renk[0];c.beginPath();c.moveTo(x-w*.6,top+6*s);c.quadraticCurveTo(x,top-10*s,x+w*.55,top+4*s);c.lineTo(x+w*.62,top+38*s);c.quadraticCurveTo(x+w*.1,top+46*s,x-w*.66,top+36*s);c.closePath();c.fill();
 c.strokeStyle=renk[1];c.lineWidth=3*s;for(let k=0;k<3;k++){c.beginPath();c.moveTo(x-w*.62,top+(14+k*9)*s);c.quadraticCurveTo(x,top+(2+k*10)*s,x+w*.58,top+(12+k*9)*s);c.stroke();}
 c.fillStyle=renk[2];for(let k=0;k<3;k++){const hx=x-w*.3+k*w*.3,hy=top+18*s;c.beginPath();c.arc(hx-2.4*s,hy,2.8*s,0,6.283);c.arc(hx+2.4*s,hy,2.8*s,0,6.283);c.fill();c.beginPath();c.moveTo(hx-5*s,hy+1);c.lineTo(hx,hy+6*s);c.lineTo(hx+5*s,hy+1);c.fill();}
 c.strokeStyle=renk[0];c.lineWidth=2*s;for(let k=0;k<9;k++){const px=x-w*.64+k*w*.16,py=top+37*s+Math.sin(k)*2;c.beginPath();c.moveTo(px,py);c.lineTo(px,py+6*s);c.stroke();}
}
// örgü sepeti: yumak yumak yün, iki yuvarlak uçlu şiş
function dn9Sepet(c,x,y,R){
 const s=1;c.fillStyle=dn9Ton('#b88050',x);c.beginPath();c.moveTo(x-30,y-34);c.lineTo(x+30,y-34);c.lineTo(x+24,y);c.lineTo(x-24,y);c.closePath();c.fill();
 c.strokeStyle=dn9Ton('#8a5a36',x);c.lineWidth=2;for(let k=0;k<4;k++){c.beginPath();c.moveTo(x-28+k,y-26+k*7);c.lineTo(x+28-k,y-26+k*7);c.stroke();}
 for(const [dx,dy,r,col] of [[-14,-38,13,'#ff9fc0'],[10,-40,14,'#b89cff'],[-1,-50,11,'#9fe0c8'],[18,-30,9,'#ffd27a']]){c.fillStyle=dn9Ton(col,x);c.beginPath();c.arc(x+dx,y+dy,r,0,6.283);c.fill();
  c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=1.4;for(let k=0;k<3;k++){c.beginPath();c.arc(x+dx,y+dy,r*(.4+k*.2),-.8+k,1+k);c.stroke();}}
 c.strokeStyle=dn9Ton('#e8c890',x);c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(x-6,y-44);c.lineTo(x+22,y-74);c.moveTo(x+2,y-42);c.lineTo(x+34,y-66);c.stroke();
 c.fillStyle=dn9Ton('#ff9fc0',x);c.beginPath();c.arc(x+22,y-74,4,0,6.283);c.arc(x+34,y-66,4,0,6.283);c.fill();
 c.strokeStyle=dn9Ton('#ff9fc0',x);c.lineWidth=1.6;c.beginPath();c.moveTo(x-14,y-26);c.bezierCurveTo(x-40,y-10,x-50,y,x-66,y-2);c.stroke();   // yerde uzanan yün ipi
}
// minder (yuvarlak, düğmeli)
function dn9Minder(c,x,y,s,col){
 c.fillStyle=dn9Mix(col,'#5a3c6a',.25);c.beginPath();c.ellipse(x,y-9*s,30*s,12*s,0,0,6.283);c.fill();
 c.fillStyle=col;c.beginPath();c.ellipse(x,y-13*s,28*s,11*s,0,0,6.283);c.fill();
 c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.ellipse(x-8*s,y-17*s,10*s,3*s,0,0,6.283);c.fill();
 c.fillStyle=dn9Mix(col,'#ffffff',.5);c.beginPath();c.arc(x,y-13*s,2.6*s,0,6.283);c.fill();
}
// Büyükanne'nin kocaman uyku yuvası: örülmüş dev çanak, kat kat yorgan, yastıklar
function dn9BuyukYuva(c,x,y,R){
 dn9Yuva(c,x,y,2.6,R);
 const w=58*2.6;c.fillStyle=dn9Ton('#c8a8f0',x);c.beginPath();c.moveTo(x-w*.7,y-36);c.quadraticCurveTo(x-w*.2,y-66,x+w*.5,y-52);c.quadraticCurveTo(x+w*.7,y-40,x+w*.6,y-30);c.quadraticCurveTo(x,y-22,x-w*.7,y-36);c.fill();
 // yama yorgan desenleri
 for(let k=0;k<6;k++){const px=x-w*.5+k*w*.2,py=y-44+Math.sin(k*1.3)*4;c.fillStyle=dn9Ton(['#ffc29a','#9fe0c8','#ff9fc0','#ffd27a','#d9c8ff','#c8f08a'][k],x);dn9Yk(c,px-12,py-8,24,16,4);c.fill();
  c.strokeStyle='rgba(255,255,255,.6)';c.setLineDash([3,3]);c.lineWidth=1.2;dn9Yk(c,px-10,py-6,20,12,3);c.stroke();c.setLineDash([]);}
 dn9Minder(c,x-w*.45,y-48,1.1,dn9Ton('#ffd0e0',x));dn9Minder(c,x-w*.2,y-54,.9,dn9Ton('#fff0c8',x));
}
// fener direği (ince tahta direk, tepesinde kıvrık kanca)
function dn9Direk(c,x,y,h){
 c.fillStyle=dn9Ton('#8a6048',x);c.fillRect(x-3.5,y-h,7,h+4);c.fillStyle=dn9Ton('#b08060',x);c.fillRect(x-3.5,y-h,2.5,h+4);
 c.strokeStyle=dn9Ton('#8a6048',x);c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(x,y-h);c.quadraticCurveTo(x+10,y-h-16,x+18,y-h-4);c.stroke();
 c.fillStyle=dn9Ton('#5aae7a',x);c.beginPath();c.ellipse(x,y,12,5,0,0,6.283);c.fill();
}

// ════════ Yerleşim: DEKOR9 + bölge kurallarıyla büyük/küçük dekor listesi (bir kez) ════════
const DN9_CW=768,DN9_CACHE=12;
// zemin gövdesi paletleri (üstten alta): çayır toprağı, şelale ormanının yosunlu taşı, yuva dağının lila taşı
const DN9_ZT=['#6e6e48','#5c5240','#463e36','#302c2e'],DN9_ZS=['#6e8a84','#54706e','#3e5658','#2c3e44'],DN9_ZD=['#7a6a92','#5c4e78','#433a60','#2c2646'],DN9_ZDUR=[0,.22,.6,1];
const dn9ZeminTas=x=>smooth(clamp((x-(241*T-90))/180,0,1))*(1-smooth(clamp((x-(381*T-90))/180,0,1)));
const dn9ZeminDag=x=>smooth(clamp((x-(761*T-90))/180,0,1));
function dn9Dolu(q){   // nesne sütunu ya da mini oyun alanı: önüne küçük süs konmaz
 const x=nx(q);
 for(const o of NESNELER){if(o.tip==='konusma')continue;
  if(Math.abs(o.x-x)<2.2*T)return true;if(Number.isFinite(o.x0)&&Number.isFinite(o.x1)&&x>o.x0-T&&x<o.x1+T)return true;}
 if(typeof BOLUM!=='undefined'&&BOLUM.yuva&&Math.abs(x-BOLUM.yuva.x)<200)return true;
 return false;
}
function dn9Yapilar(){
 if(DN9.yap)return DN9.yap;
 const Y=DN9.yap={buyuk:[],kucuk:[],plat:[],cicek:[],pen:[],kristal:[],su:[],kopuk:[],adaSu:[],adaYuz:[],dere:[],yaprak:[],ip:[],fener:[],kemer:null};
 const D9=typeof DEKOR9!=='undefined'?DEKOR9:{};
 const sy=c=>topOf(c)*T;
 // şelaleler (en arkada), dev ağaçlar, kayalar, yuvalar
 for(const [col,h,w,n] of D9.selale||[]){const x=nx(col),y=sy(col);Y.buyuk.push({tip:'selale',x,y,h,w,n,z:-2,x0:x-w/2-160,x1:x+w/2+160,y0:y-h-80,seed:col*13});}
 for(const [col,s,ti,yv] of D9.agac||[]){const x=nx(col)+(dn9Hash(col)-.5)*14,h=420*s;Y.buyuk.push({tip:'agac',x,y:sy(col)+6,h,ti,yv:!!yv,z:-1,seed:col*17+3,x0:x-h*.62,x1:x+h*.62,y0:sy(col)-h*.98});}
 for(const [col,s] of D9.kaya||[]){const x=nx(col)+(dn9Hash(col*3)-.5)*16;Y.buyuk.push({tip:'kaya',x,y:sy(col)+8,s,z:1,seed:col*7,x0:x-40*s,x1:x+40*s,y0:sy(col)-56*s});}
 for(const [col,s,tur] of D9.yuva||[]){const x=nx(col);Y.buyuk.push({tip:'yuva',x,y:sy(col)+6,s,tur,z:2,seed:col*11,x0:x-80*s,x1:x+80*s,y0:sy(col)-110*s});}
 // dere (taş basamaklı)
 for(const [a,b] of D9.dere||[])Y.dere.push({x0:a*T,x1:(b+1)*T,y:sy(a)});
 // kalkış kayalığı ve dağın yamacı
 Y.buyuk.push({tip:'ucurum',x:DN9_GAP0,y:sy(604),yon:1,z:3,x0:DN9_GAP0-220,x1:DN9_GAP0+80,y0:sy(604)-40,seed:604});
 Y.buyuk.push({tip:'ucurum',x:DN9_GAP1,y:sy(761),yon:-1,z:3,x0:DN9_GAP1-80,x1:DN9_GAP1+220,y0:sy(761)-40,seed:761});
 // Büyükanne'nin dağ yuvası
 const yx=typeof BOLUM!=='undefined'&&BOLUM.yuva?BOLUM.yuva.x:nx(812),yy=sy(812);
 Y.buyuk.push({tip:'kemer',x:yx,y:yy+6,z:-1,seed:812,x0:yx-210,x1:yx+210,y0:yy-530});
 Y.buyuk.push({tip:'kayaEv',x:nx(792),y:sy(792)+4,z:-1,seed:792,x0:nx(792)-170,x1:nx(792)+170,y0:sy(792)-280});
 Y.buyuk.push({tip:'battaniye',x:nx(776),y:sy(776)+6,s:1.1,ci:0,z:1,seed:776,x0:nx(776)-60,x1:nx(776)+60,y0:sy(776)-90});
 Y.buyuk.push({tip:'battaniye',x:nx(819),y:sy(819)+6,s:.9,ci:1,z:1,seed:819,x0:nx(819)-60,x1:nx(819)+60,y0:sy(819)-90});
 Y.buyuk.push({tip:'buyukYuva',x:nx(831),y:sy(831)+8,z:0,seed:831,x0:nx(831)-170,x1:nx(831)+170,y0:sy(831)-120});
 Y.buyuk.push({tip:'sepet',x:nx(824),y:sy(824)+4,z:2,seed:824,x0:nx(824)-70,x1:nx(824)+40,y0:sy(824)-90});
 Y.buyuk.push({tip:'minder',x:nx(785),y:sy(785)+4,z:2,seed:785,x0:nx(785)-40,x1:nx(785)+40,y0:sy(785)-40});
 for(const [col,s,ci] of D9.kristal||[]){const x=nx(col);Y.buyuk.push({tip:'kristal',x,y:sy(col)+6,s,ci,z:1,seed:col*5,x0:x-30*s,x1:x+30*s,y0:sy(col)-50*s});}
 // fener direkleri ve aralarındaki fener ipleri
 const F9=D9.fener||[];
 for(let i=0;i<F9.length;i++){const [col,dy]=F9[i],x=nx(col),y=sy(col);Y.buyuk.push({tip:'direk',x,y:y+2,h:-dy,z:0,seed:col,x0:x-20,x1:x+30,y0:y+dy-30});Y.fener.push({x:x+18,y:y+dy-4});}
 for(let i=0;i+1<Y.fener.length;i++){const A=Y.fener[i],B=Y.fener[i+1];Y.ip.push({x0:A.x,y0:A.y,x1:B.x-18,y1:B.y,sag:30+Math.abs(B.x-A.x)*.08,n:Math.max(3,Math.round((B.x-A.x)/70)),ph:i*1.7});}
 // tek yönlü platformlar: adalar bölgesinde uçan adacık, şelalede taş çıkıntı, çayırda yaprak / çiçek tablası
 for(let r=0;r<ROWS;r++){let c=0;while(c<COLS){if(grid[r][c]!==2){c++;continue;}let e=c;while(e+1<COLS&&grid[r][e+1]===2)e++;
  const x0=c*T,x1=(e+1)*T,b=dn9Bolge((x0+x1)/2),tab=Math.max(sy(c),sy(e));
  Y.plat.push({x0,x1,y:r*T,tab,tur:b==='adalar'?'ada':b==='selale'?'tas':(c===164?'cicek':'yaprak'),seed:c*31+r*7});c=e+1;}}
 // küçük süsler: bölgeye göre sütun sütun (tohumlu); nesne sütunlarından ve mini oyun alanlarından kaçar
 for(let q=1;q<COLS-1;q++){const x=nx(q);if(x>=DN9_GAP0-T&&x<DN9_GAP1+T)continue;const t=topOf(q);if(t>=ROWS)continue;const y=t*T,Q=rng(q*977+5),b=dn9Bolge(x);
  if(topOf(q-1)!==t||topOf(q+1)!==t)continue;if(Y.dere.some(d=>x>d.x0-T&&x<d.x1+T))continue;const dolu=dn9Dolu(q),k=Q();
  const ek=(tip,o)=>Y.kucuk.push(Object.assign({tip,x:x+(Q()-.5)*20,y,seed:q*13},o));
  if(b==='giris'||b==='cayir'){if(!dolu&&k<.2)ek('demet',{s:.8+Q()*.5});else if(!dolu&&k<.3)ek('egrelti',{s:.7+Q()*.5,yon:Q()<.5?-1:1});else if(!dolu&&k<.36)ek('mantar',{s:.7+Q()*.5,col:DN9_CICEK[Math.floor(Q()*8)],n:1+Math.floor(Q()*3)});else if(k<.6)ek('ot',{});else if(k<.68)ek('papatya',{n:3+Math.floor(Q()*4)});}
  else if(b==='selale'){if(!dolu&&k<.24)ek('egrelti',{s:.9+Q()*.6,yon:Q()<.5?-1:1});else if(!dolu&&k<.32)ek('mantar',{s:.7+Q()*.5,col:Q()<.5?'#ff9fc0':'#b89cff',n:1+Math.floor(Q()*3)});else if(k<.42)ek('cakil',{n:2+Math.floor(Q()*3)});else if(!dolu&&k<.5)ek('demet',{s:.7+Q()*.4});else if(k<.64)ek('ot',{});}
  else if(b==='meyve'||b==='kanat'||b==='kolye'){if(k<.24)ek('ot',{});else if(k<.34)ek('papatya',{n:2+Math.floor(Q()*3)});else if(!dolu&&k<.4)ek('demet',{s:.7+Q()*.3});}
  else if(b==='adalar'){if(!dolu&&k<.16)ek('mantar',{s:.8+Q()*.6,col:DN9_CICEK[Math.floor(Q()*8)],n:1+Math.floor(Q()*3)});else if(!dolu&&k<.3)ek('demet',{s:.8+Q()*.4});else if(k<.5)ek('ot',{});else if(!dolu&&k<.58)ek('egrelti',{s:.7+Q()*.4,yon:Q()<.5?-1:1});else if(k<.68)ek('papatya',{n:3+Math.floor(Q()*3)});}
  else if(b==='yuva'){if(k<.2)ek('ot',{});else if(k<.32)ek('papatya',{n:2+Math.floor(Q()*3)});else if(!dolu&&k<.38)ek('cakil',{n:2+Math.floor(Q()*2)});}
 }
 Y.buyuk.sort((a,b)=>(a.z||0)-(b.z||0));
 return Y;
}
function dn9KayitSirala(){const Y=DN9.yap;for(const k of ['cicek','pen','kristal','adaSu','yaprak'])Y[k].sort((a,b)=>a.x-b.x);Y.su.sort((a,b)=>a.x-b.x);}
// büyük dekor ressamı
function dn9BuyukCiz(c,b,Y){
 const R=rng(b.seed||((b.x|0)*3+7));
 switch(b.tip){
  case 'selale':dn9SelaleCiz(c,b,R,Y);break;
  case 'agac':dn9Agac(c,b.x,b.y,b.h,R,b.ti,b.yv,Y);break;
  case 'kaya':dn9Kaya(c,b.x,b.y,b.s,R);break;
  case 'yuva':if(b.tur==='kaya'){dn9Kaya(c,b.x,b.y,b.s*1.3,R);dn9Yuva(c,b.x,b.y-46*b.s,b.s*.8,R);}else dn9Yuva(c,b.x,b.y,b.s,R);break;
  case 'ucurum':dn9Ucurum(c,b,R);break;
  case 'kemer':dn9Kemer(c,b,R,Y);break;
  case 'kayaEv':dn9KayaEv(c,b,R,Y);break;
  case 'battaniye':dn9Battaniye(c,b.x,b.y,b.s,R,b.ci);break;
  case 'buyukYuva':dn9BuyukYuva(c,b.x,b.y,R);break;
  case 'sepet':dn9Sepet(c,b.x,b.y,R);break;
  case 'minder':dn9Minder(c,b.x-18,b.y,1,dn9Ton('#9fe0c8',b.x));dn9Minder(c,b.x+20,b.y,.9,dn9Ton('#ffc29a',b.x));break;
  case 'kristal':dn9Kristal(c,b.x,b.y,b.s,b.ci,Y,R);break;
  case 'direk':dn9Direk(c,b.x,b.y,b.h);break;
 }
}
// küçük süs ressamı
function dn9KucukCiz(c,s,Y){
 const R=rng(s.seed||((s.x|0)+1));
 switch(s.tip){
  case 'demet':dn9Demet(c,s.x,s.y+2,s.s,R,Y);break;
  case 'egrelti':dn9Egrelti(c,s.x,s.y+3,s.s,R,s.yon);break;
  case 'mantar':for(let k=0;k<s.n;k++)dn9Mantar(c,s.x+k*11-(s.n-1)*5.5,s.y+3,s.s*(1-k*.18),dn9Ton(s.col,s.x));break;
  case 'ot':{c.lineCap='round';for(let k=0;k<7;k++){const px=s.x+(k-3)*3.5,hh=10+R()*14,an=(k-3)*.12;c.strokeStyle=dn9Ton(k%2?'#4aa870':'#78c888',s.x);c.lineWidth=2;c.beginPath();c.moveTo(px,s.y+3);c.quadraticCurveTo(px+an*8,s.y-hh*.6,px+an*16,s.y-hh);c.stroke();}break;}
  case 'papatya':for(let k=0;k<s.n;k++){const px=s.x+(R()-.5)*34,py=s.y-2-R()*6,r=2.6+R()*1.2;c.strokeStyle=dn9Ton('#4aa070',s.x);c.lineWidth=1.2;c.beginPath();c.moveTo(px,s.y+3);c.lineTo(px,py);c.stroke();
   c.fillStyle=dn9Ton(k%3?'#ffffff':'#ffd0e0',s.x);for(let j=0;j<6;j++){const b=j*1.047;c.beginPath();c.ellipse(px+Math.cos(b)*r,py+Math.sin(b)*r,r*.8,r*.4,b,0,6.283);c.fill();}c.fillStyle='#ffd24a';c.beginPath();c.arc(px,py,r*.5,0,6.283);c.fill();}break;
  case 'cakil':for(let k=0;k<s.n;k++){const px=s.x+(R()-.5)*30,r=4+R()*5;c.fillStyle=dn9Ton(k%2?'#a8aec0':'#8a92a8',s.x);c.beginPath();c.ellipse(px,s.y+2,r,r*.6,0,0,6.283);c.fill();c.fillStyle='rgba(255,255,255,.3)';c.beginPath();c.ellipse(px-r*.3,s.y,r*.4,r*.2,0,0,6.283);c.fill();}break;
 }
}
// tek yönlü platform ressamı
function dn9PlatCiz(c,p,Y){
 const R=rng(p.seed);
 if(p.tur==='ada')dn9AdaPlat(c,p,R,Y);else if(p.tur==='tas')dn9TasPlat(c,p,R);else if(p.tur==='cicek')dn9CicekPlat(c,p,R);else dn9YaprakPlat(c,p,R);
}

// ── Zemin parçası: 768 genişlik, yalnız boyalı yükseklik kadar (üst saydam kısım için bellek ayrılmaz) ──
function dn9Chunk(i){
 if(DN9.chunks.has(i)){const a=DN9.chunks.get(i);DN9.chunks.delete(i);DN9.chunks.set(i,a);return a;}
 const Y=dn9Yapilar(),x0=i*DN9_CW,L=x0-2,Rr=x0+DN9_CW+2,xm=x0+DN9_CW/2;
 let ust=1200;for(let x=Math.floor(L);x<=Rr;x+=8){const s=dn9Surface(x);if(s<1200)ust=Math.min(ust,s-60);}
 for(const b of Y.buyuk)if(b.x1>L&&b.x0<Rr)ust=Math.min(ust,b.y0);
 for(const p of Y.plat)if(p.x1>L-20&&p.x0<Rr+20)ust=Math.min(ust,p.y-60);
 ust=Math.max(0,Math.floor(ust));
 const cv=dn9Cv(DN9_CW+4,Math.max(1,1200-ust)),c=cv.getContext('2d');c.translate(2-x0,-ust);cv.ust=ust;
 let yeni=false;const kayit=o=>{if(o.kayitli)return null;o.kayitli=true;yeni=true;return Y;};
 // 1) büyük dekor (zeminin arkasında): sırayla (z)
 for(const b of Y.buyuk)if(b.x1>L&&b.x0<Rr&&(b.z||0)<1)dn9BuyukCiz(c,b,kayit(b));
 // 2) zemin gövdesi: bölgeye göre toprak (çayır), yosunlu taş (şelale), lila dağ taşı (yuva)
 const p=new Path2D();let open=false,prev=1200;
 for(let x=Math.floor(L);x<=Rr;x+=2){const y=dn9Surface(x);if(y>=1200){if(open){p.lineTo(x,prev);p.lineTo(x,1200);p.closePath();open=false;}prev=1200;continue;}
  if(!open){p.moveTo(x,1200);p.lineTo(x,y);open=true;prev=y;}else if(y!==prev){p.lineTo(x,prev);p.lineTo(x,y);prev=y;}}
 if(open){p.lineTo(Rr,prev);p.lineTo(Rr,1200);p.closePath();}
 const bl=dn9Bolge(xm),tasli=bl==='selale',dag=bl==='yuva';
 const GZ=dag?['#7a6a92','#5c4e78','#433a60','#2c2646']:tasli?['#6e8a84','#54706e','#3e5658','#2c3e44']:['#6e6e48','#5c5240','#463e36','#302c2e'];
 // toprak boyası ince dikey şeritlerle: bölge (toprak → yosunlu taş → dağ taşı) ve günün saati sütun sütun yumuşakça geçer
 // (parça başına tek renk iki parçanın sınırında keskin dikiş bırakıyordu; yalnız parça kurulurken bir kez çizilir)
 c.save();c.clip(p);
 for(let x=Math.floor(L/12)*12;x<Rr;x+=12){const xx=x+6,ws=dn9ZeminTas(xx),wd=dn9ZeminDag(xx),gr=c.createLinearGradient(0,620,0,1200);
  for(let k=0;k<4;k++)gr.addColorStop(DN9_ZDUR[k],dn9Ton(dn9Mix(dn9Mix(DN9_ZT[k],DN9_ZS[k],ws),DN9_ZD[k],wd),xx));
  c.fillStyle=gr;c.fillRect(x,ust,12.6,1200-ust);}
 const Q=rng(i*733+61);
 // toprak katman çizgileri, yuvarlak taşlar, kökler, ışıl ışıl pul kırıntıları (ejderha pulu gibi minik parıltılar)
 c.strokeStyle=dag?'rgba(220,200,240,.12)':'rgba(220,240,200,.1)';c.lineWidth=2.5;for(let k=0;k<30;k++){const xx=L+Q()*DN9_CW,yy=dn9Surface(xx)+40+Q()*220,ww=50+Q()*140;if(yy>1190)continue;c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx+ww*.5,yy+6,xx+ww,yy);c.stroke();}
 for(let k=0;k<5;k++){const xx=L+Q()*DN9_CW,yy=dn9Surface(xx)+110+Q()*300,r=40+Q()*70;if(yy>1250)continue;c.fillStyle=k%3?'rgba(20,24,20,.07)':'rgba(220,230,200,.04)';c.beginPath();c.ellipse(xx,yy,r*1.6,r*.7,0,0,6.283);c.fill();}
 for(let k=0;k<9;k++){const xx=L+Q()*DN9_CW,yy=dn9Surface(xx)+40+Q()*320,r=4+Q()*9;if(yy>1190)continue;c.fillStyle=dn9Ton(tasli?(k%3?'#6a8484':'#7a9696'):dag?(k%3?'#8a7aa0':'#9a8ab0'):(k%3?'#7a7068':'#8a8078'),xm);c.beginPath();c.ellipse(xx,yy,r*1.3,r,0,0,6.283);c.fill();
  c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.ellipse(xx-r*.2,yy-r*.5,r*.8,r*.3,0,0,6.283);c.fill();}
 for(let k=0;k<12;k++){const xx=L+Q()*DN9_CW,yy=dn9Surface(xx)+30+Q()*260;if(yy>1190)continue;const col=DN9_KALP[k%3];c.fillStyle=dn9Mix(col,GZ[1],.35);c.beginPath();c.moveTo(xx,yy-5);c.lineTo(xx+3,yy);c.lineTo(xx,yy+5);c.lineTo(xx-3,yy);c.closePath();c.fill();}
 if(!tasli&&!dag){c.strokeStyle='rgba(120,90,60,.5)';c.lineWidth=2;c.lineCap='round';for(let k=0;k<10;k++){const xx=L+Q()*DN9_CW,yy=dn9Surface(xx)+14;if(yy>1190)continue;c.beginPath();c.moveTo(xx,yy);c.bezierCurveTo(xx+6,yy+14,xx-8,yy+24,xx+3,yy+34+Q()*20);c.stroke();}}
 // yosun çanağı (adalar arası): yumuşak, tombul yosun yastıkları
 if(bl==='adalar')for(let k=0;k<26;k++){const xx=L+Q()*DN9_CW;if(xx<453*T||xx>503*T)continue;const yy=dn9Surface(xx)+14+Q()*40,r=18+Q()*22;
  // tombul yastık: altında yumuşak gölge, gövde, üstünde ışıklı tepe ve minik yosun benekleri (düz yapıştırma leke gibi durmasın)
  c.fillStyle=dn9Ton('#2f6e50',xx);c.globalAlpha=.55;c.beginPath();c.ellipse(xx+2,yy+r*.28,r*1.45,r*.72,0,0,6.283);c.fill();c.globalAlpha=1;
  c.fillStyle=dn9Ton(k%2?'#5aae7a':'#4a9c6c',xx);c.beginPath();c.ellipse(xx,yy,r*1.4,r*.8,0,0,6.283);c.fill();
  c.fillStyle=dn9Ton(k%2?'#86cc98':'#74bc8a',xx);c.globalAlpha=.8;c.beginPath();c.ellipse(xx-r*.25,yy-r*.32,r*.85,r*.3,0,0,6.283);c.fill();
  c.fillStyle='#d8f8d0';c.globalAlpha=.35;for(let j=0;j<3;j++){c.beginPath();c.arc(xx+(Q()-.5)*r*1.8,yy+(Q()-.6)*r*.6,1.6+Q()*1.6,0,6.283);c.fill();}c.globalAlpha=1;}
 for(let x=Math.floor(L/16)*16;x<Rr;x+=16){const y=dn9Surface(x);if(y>=1200)continue;c.fillStyle=dag?'rgba(60,50,80,.25)':'rgba(40,70,40,.28)';c.beginPath();c.ellipse(x+8,y+14,14,12,0,0,6.283);c.fill();}
 for(let k=0;k<110;k++){const xx=L+Q()*DN9_CW,yy=dn9Surface(xx)+8+Q()*120;c.fillStyle='rgba(255,250,230,'+(.06+Q()*.16)+')';c.fillRect(xx,yy,1.2,1.2);}
 c.restore();
 // 3) dere: taş basamaklar arasında turkuaz su (dalgacıkları karede)
 for(const d of Y.dere)if(d.x1>L&&d.x0<Rr)dn9DereCiz(c,d,Q);
 // 4) yüzey dudağı: çimen, çiçekler; şelale ormanında yosunlu taş basamak kenarları; yuvada kısa dağ çimeni
 dn9Dudak(c,L,Rr);
 // 5) önde duran büyük dekor (kayalar, yuvalar, battaniyeler, kristaller) ve küçük süsler
 for(const b of Y.buyuk)if(b.x1>L&&b.x0<Rr&&(b.z||0)>=1)dn9BuyukCiz(c,b,kayit(b));
 for(const s of Y.kucuk)if(s.x>L-80&&s.x<Rr+80)dn9KucukCiz(c,s,kayit(s));
 // 6) tek yönlü platformlar
 for(const pl of Y.plat)if(pl.x1>L-60&&pl.x0<Rr+60)dn9PlatCiz(c,pl,kayit(pl));
 if(yeni)dn9KayitSirala();
 DN9.chunks.set(i,cv);while(DN9.chunks.size>DN9_CACHE)DN9.chunks.delete(DN9.chunks.keys().next().value);return cv;
}
// taş basamaklı dere: yüzeyin hemen altında turkuaz su bandı, üstünde yuvarlak yassı basamak taşları (yürünen yüzey taşların üstü)
function dn9DereCiz(c,d,Q){
 const y=d.y,su=dn9Ton('#6ad4dc',d.x0),suK=dn9Ton('#3ea8b8',d.x0);
 let gr=c.createLinearGradient(0,y,0,y+70);gr.addColorStop(0,su);gr.addColorStop(1,suK);c.fillStyle=gr;c.fillRect(d.x0-6,y+5,d.x1-d.x0+12,64);
 c.fillStyle='rgba(255,255,255,.5)';c.fillRect(d.x0-6,y+5,d.x1-d.x0+12,2.5);
 for(let k=0;k<14;k++){const xx=d.x0+Q()*(d.x1-d.x0),yy=y+16+Q()*44;c.fillStyle=dn9Ton(k%2?'#8a9aa8':'#6a8a96',d.x0);c.beginPath();c.ellipse(xx,yy,8+Q()*10,4+Q()*4,0,0,6.283);c.fill();}   // dipte çakıllar
 const n=Math.round((d.x1-d.x0)/46);
 for(let k=0;k<n;k++){const cx=d.x0+(k+.5)*(d.x1-d.x0)/n+(Q()-.5)*6,w=36+Q()*6;
  c.fillStyle=dn9Ton('#5e7280',cx);c.beginPath();c.ellipse(cx,y+10,w/2+2,12,0,0,6.283);c.fill();
  c.fillStyle=dn9Ton('#94a6b4',cx);c.beginPath();c.ellipse(cx,y+4,w/2,9,0,0,6.283);c.fill();
  c.fillStyle=dn9Ton('#b8c8d2',cx);c.beginPath();c.ellipse(cx-4,y+1,w*.3,4,0,0,6.283);c.fill();
  c.fillStyle=dn9Ton('#5ab07a',cx);c.beginPath();c.ellipse(cx+w*.2,y+1,w*.18,3.4,0,0,6.283);c.fill();}
 d.n=n;
}
// yüzey dudağı: çimen (zümrüt-yeşim), basamak kenarında saçak; şelalede kenarlar yosunlu taş blok
function dn9Dudak(c,L,Rr){
 const Y=DN9.yap,dere=x=>Y.dere.some(d=>x>=d.x0-4&&x<d.x1+4);
 const tonC=new Map(),ton=(col,x)=>{const k=col+(x>>7);let v=tonC.get(k);if(v===undefined){v=dn9Ton(col,x);tonC.set(k,v);}return v;};
 // şelale ormanının basamak yüzleri: kat kat yosunlu taş bloklar
 for(let x=Math.floor(L/T)*T;x<Rr;x+=T){const c0=Math.floor(x/T),a=topOf(c0),b=topOf(c0+1);if(a===b||a>=ROWS||b>=ROWS)continue;const bl=dn9Bolge(x+T);if(bl!=='selale'&&bl!=='yuva')continue;
  const ya=Math.min(a,b)*T,yb=Math.max(a,b)*T,ex=(c0+1)*T,s=b<a?1:-1;
  for(let y=ya;y<yb;y+=20){c.fillStyle=ton(bl==='yuva'?'#a898bc':'#8aa0a8',ex);dn9Yk(c,ex-(s>0?26:4),y+1,30,19,7);c.fill();c.fillStyle='rgba(255,255,255,.2)';c.fillRect(ex-(s>0?22:0),y+3,22,3);}
  c.fillStyle=ton('#4aa878',ex);c.beginPath();c.ellipse(ex,ya+2,24,6,0,0,6.283);c.fill();}
 // çimen: koyu gölge, ana renk, ışıklı üst
 for(const [col,dy,rx,ry] of [['#2e7a52',9,13,8],['#46a46c',3,12,7.5],['#7ccc8a',-1,8,3]]){
  for(let x=Math.floor(L/12)*12-12;x<Rr+12;x+=12){const xx=x+6,y=dn9Surface(xx);if(y>=1200||dere(xx))continue;const w=dn9Hash(xx*.37),bl=dn9Bolge(xx);
   c.fillStyle=ton(bl==='selale'?(col==='#7ccc8a'?'#6cc08e':col==='#46a46c'?'#3e9a70':'#2a6e54'):bl==='yuva'?(col==='#7ccc8a'?'#9ad09a':col==='#46a46c'?'#6aac7e':'#4a7a62'):col,xx);
   c.beginPath();c.ellipse(xx,y+dy-1+w*2,rx+w*3,ry+w*1.5,0,0,6.283);c.fill();}}
 // çimen telleri (kıvrık uçlu), ara sıra fıstık yeşili uç
 c.lineCap='round';
 for(let x=Math.floor(L/6)*6;x<Rr;x+=6){const y=dn9Surface(x);if(y>=1200||dere(x))continue;const h=dn9Hash(x*1.3);if(h<.3)continue;const bl=dn9Bolge(x),hh=(bl==='yuva'?4:6)+h*(bl==='yuva'?6:11),an=(dn9Hash(x*2.1)-.5)*.6;
  c.strokeStyle=ton(h>.86?'#c8f08a':h>.6?'#6cc084':'#3e9a64',x);c.lineWidth=2;c.beginPath();c.moveTo(x,y+2);c.quadraticCurveTo(x+an*6,y-hh*.6,x+an*10,y-hh);c.stroke();}
 // çimende minik çiçekler (beş yapraklı) ve yonca
 for(let x=Math.floor(L/17)*17;x<Rr;x+=17){const y=dn9Surface(x);if(y>=1200||dere(x))continue;const h=dn9Hash(x*.91);if(h<.55)continue;const bl=dn9Bolge(x);if(bl==='selale'&&h<.8)continue;
  const col=ton(DN9_CICEK[Math.floor(dn9Hash(x*3.7)*8)],x),px=x+dn9Hash(x*5)*8,py=y-3-dn9Hash(x*7)*5,r=2+h*1.2;
  c.fillStyle=col;for(let j=0;j<5;j++){const b=j*1.2566+h*3;c.beginPath();c.arc(px+Math.cos(b)*r,py+Math.sin(b)*r,r*.75,0,6.283);c.fill();}c.fillStyle='#ffe27a';c.beginPath();c.arc(px,py,r*.5,0,6.283);c.fill();}
}

function dn9Terrain(){
 g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);const a=Math.max(0,Math.floor(cam.x/DN9_CW)),b=Math.min(Math.ceil(COLS*T/DN9_CW),Math.floor((cam.x+VW)/DN9_CW));
 const ya=cam.y-2,yb=cam.y+H/S+2;DN9.zeminKare=DN9.kare;
 for(let i=a;i<=b;i++){const cv=dn9Chunk(i),o=cv.ust,y0=Math.max(o,Math.floor(ya)),y1=Math.min(1200,Math.ceil(yb));if(y1>y0)g.drawImage(cv,0,y0-o,cv.width,y1-y0,i*DN9_CW-2,y0,cv.width,y1-y0);}
 // bir sonraki parça (yürüme yönünde) önceden boyanır: karede en çok bir tane
 const yon=(typeof P!=='undefined'&&P.vx<-20)?-1:1,next=yon>0?b+1:a-1;if(next>=0&&next*DN9_CW<COLS*T&&!DN9.chunks.has(next))dn9Yukle(dn9Chunk(next));   // minicik çizim: boyama + GPU yüklemesi de şimdiden
}
// zemin parçalarının kesin örttüğü en üst ekran y'si (son karede zemin çizildiyse)
function dn9ZeminAlt(vh){
 if(DN9.zeminKare!==DN9.kare-1)return vh;
 const yb=1200-cam.y;if(yb<vh)return vh;let m=-1e9;
 for(let x=cam.x-8;x<=cam.x+VW+8;x+=16){const y=dn9Surface(x);if(y>=1200)return vh;if(y>m)m=y;}
 return Math.min(vh,m-cam.y+4);
}
function dn9Bas(L,x){let a=0,b=L.length;while(a<b){const m=(a+b)>>1;if(L[m].x<x)a=m+1;else b=m;}return a;}

// ════════ Güneş: sabah yüksekte, gün ilerledikçe alçalır, büyür, altın-turuncuya döner; yolculukta kocaman, binicilerin ardında ════════
const DN9_GSX=[.24,.3,.56,.62,.66],DN9_GSY=[.12,.1,.2,.46,.66],DN9_GSR=[24,22,30,50,58];
const DN9_GHALE=['#fff2c0','#e8fff0','#ffd8c4','#ff9a74','#ff8a70'],DN9_GCEK=['#fffbe8','#f4fff8','#fff0dc','#ffd49a','#ffb27e'];
const DN9_GUNESX=nx(688);   // yolculukta güneşin bağlı olduğu dünya x'i (paralaks .1)
function dn9Ara(L,gun){const i=Math.max(0,Math.min(3,Math.floor(gun))),f=clamp(gun-i,0,1);return lerp(L[i],L[i+1],smooth(f));}
function dn9AraR(L,gun){const i=Math.max(0,Math.min(3,Math.floor(gun))),f=clamp(gun-i,0,1);return dn9Mix(L[i],L[i+1],smooth(f));}
function dn9GunesHesap(tm,vw,vh){
 const gun=DN9.gun,cx=cam.x+VW*.5,w=smooth(clamp((cx-(DN9_GAP0-300))/900,0,1))*(1-smooth(clamp((cx-(DN9_GAP1-500))/700,0,1)));
 const A=DN9.gunes,nxs=vw*dn9Ara(DN9_GSX,gun)-cam.x*.0008%30,nys=vh*dn9Ara(DN9_GSY,gun)-cam.y*.01,nr=dn9Ara(DN9_GSR,gun);
 const pxs=vw*.5+(DN9_GUNESX-cx)*.1,pys=vh*.42,pr=Math.min(vh*.16,96);
 A.w=w;A.sx=lerp(nxs,pxs,w);A.sy=lerp(nys,pys,w)+Math.sin(tm*.25)*2;A.sr=lerp(nr,pr,w);
 // yolculuk güneşin konumunu verirse (siluet anı: güneş binicilerin tam arkasında) onunla yumuşakça birleş
 if(typeof BUYUKANNE9!=='undefined'&&BUYUKANNE9&&typeof BUYUKANNE9.gunes==='function'){let G=null;try{G=BUYUKANNE9.gunes();}catch(e){G=null;}
  if(G&&Number.isFinite(G.x)&&Number.isFinite(G.y)&&Number.isFinite(G.r)){const a=clamp(Number.isFinite(G.a)?G.a:1,0,1);A.sx=lerp(A.sx,G.x-cam.x,a);A.sy=lerp(A.sy,G.y-cam.y,a);A.sr=lerp(A.sr,G.r,a);A.w=Math.max(A.w,a);}}
 A.sol=0;if(typeof BINIS9!=='undefined'&&BINIS9&&typeof BINIS9.gunes==='function'){let G=null;try{G=BINIS9.gunes();}catch(e){G=null;}if(G&&Number.isFinite(G.a))A.sol=clamp(G.a,0,1);}
 A.x=cam.x+A.sx;A.y=cam.y+A.sy;A.r=A.sr;return A;
}
// güneşin o karedeki dünya konumu ve yarıçapı (buyukanne.js siluet anı için)
function dn9Gunes(){const A=DN9.gunes;return {x:A.x,y:A.y,r:A.r};}
function dn9GunesCiz(tm,A,gokAlt){
 const F=DN9.fx,gun=DN9.gun,ak=dn9AksamK(gun),r=A.sr,x=A.sx,y=A.sy,hal=dn9AraR(DN9_GHALE,gun),cek=dn9AraR(DN9_GCEK,gun),bat=clamp((gun-3.5)/.5,0,1)*(1-A.w);
 if(!F.gunesT){const cv=dn9Cv(128,128),c=cv.getContext('2d'),gr=c.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,244,214,1)');gr.addColorStop(.6,'rgba(255,214,150,1)');gr.addColorStop(.8,'rgba(255,180,130,.75)');gr.addColorStop(1,'rgba(255,160,120,0)');c.fillStyle=gr;c.fillRect(0,0,128,128);F.gunesT=cv;}
 const so=1-(A.sol||0);if(so<.01)return;g.globalCompositeOperation='lighter';
 dn9Glow(hal,x,y,r*7,r*6,(.2+A.w*.12)*(1-bat*.5)*so);dn9Glow(cek,x,y,r*3,r*3,.35*(1-bat*.6)*so);
 g.globalCompositeOperation='source-over';
 if(y-r<gokAlt&&bat<.98){const k=(1-bat)*so;g.globalAlpha=(1-ak)*k;g.drawImage(F.gunes,x-r*1.2,y-r*1.2,r*2.4,r*2.4);g.globalAlpha=ak*k;g.drawImage(F.gunesT,x-r*1.2,y-r*1.2,r*2.4,r*2.4);g.globalAlpha=1;}
 // gün batımında güneşin önünden geçen ince bulut çizgileri
 if(ak>.2){g.globalAlpha=ak*.5;g.fillStyle='#ff9ab0';for(let k=0;k<3;k++){const yy=y-r*.3+k*r*.38,ww=r*(2.4-k*.4);dn9Yk(g,x-ww/2+Math.sin(tm*.1+k)*8,yy,ww,r*.1,r*.05);g.fill();}g.globalAlpha=1;}
}

// ════════ Arka plan ════════
const DN9_SIRA=[0,1,5,2,3],DN9_SIRAY=[0,1,5,4,2,3];
const DN9_BULUTL=[[.05,.12,300,5,0],[.42,.2,240,3.5,1],[.7,.08,340,4.5,2],[.88,.26,220,6,1],[.25,.32,280,3,0]];
function dn9SelaleAgirlik(cx){return smooth(clamp((cx-232*T)/(22*T),0,1))*(1-smooth(clamp((cx-376*T)/(24*T),0,1)));}
function dn9Backdrop(tm){
 const vw=W/S,vh=H/S,F=dn9FxArt(),gun=DN9.gun,ak=dn9AksamK(gun),yk=DN9.yk,cx=cam.x+VW*.5,ws=dn9SelaleAgirlik(cx);
 const A=dn9GunesHesap(tm,vw,vh);
 // siluet anı (buyukanne.js BUYUKANNE9.siluetAni 0..1): uzak katmanlar biraz alçalır, binicilerin ardında temiz gök ve güneş kalır
 let sa=DN9.yk>.5&&dn9Binis()?DN9_BI.gb:0;if(typeof BUYUKANNE9!=='undefined'&&BUYUKANNE9&&typeof BUYUKANNE9.siluetAni==='function'){try{sa=clamp(+BUYUKANNE9.siluetAni()||0,0,1);}catch(e){sa=0;}}
 DN9.siluetS+=(sa-DN9.siluetS)*(1-Math.pow(.94,DN9.adim));if(DN9.adim>0&&Math.abs(DN9.siluetS-sa)<.002)DN9.siluetS=sa;const aa=smooth(DN9.siluetS)*vh*.12;
 const tab=DN9.tab||(DN9.tab=[0,0,0,0,0,0]),yZ=dn9ZeminAlt(vh),sira=yk>.005?DN9_SIRAY:DN9_SIRA;
 for(let l=0;l<6;l++)tab[l]=DN9_SB[l]-cam.y*DN9_SYF[l]+yk*[40,160,720,920,0,640][l]+(l===4?(1-yk)*640-yk*30:aa);
 const ort=DN9.ort||(DN9.ort=[0,0,0,0,0,0]),gorunur=l=>l!==5||ws>.01;
 for(let i=0;i<sira.length;i++){let m=yZ;for(let j=i+1;j<sira.length;j++){const q=sira[j];if(q===5&&ws<.99)continue;if(tab[q]<m)m=tab[q];}ort[sira[i]]=m;}
 let gokAlt=yZ;for(let i=0;i<sira.length;i++){const q=sira[i];if(q===5&&ws<.99)continue;if(tab[q]<gokAlt)gokAlt=tab[q];}DN9.gokAlt=gokAlt;
 // gök (yalnız görünen üst kısım): komşu iki saat karışır
 g.setTransform(1,0,0,1,0,0);const gu=clamp(gokAlt/vh,0,1);
 if(gu>0){const hh=Math.ceil(H*gu)+2,sh=Math.min(600,600*hh/H),i0=Math.max(0,Math.min(4,Math.floor(gun))),i1=Math.min(4,i0+1),f=smooth(clamp(gun-i0,0,1));
  g.drawImage(dn9GokArt(i0),0,0,768,sh,0,0,W,Math.min(H,hh));if(f>.004&&i1!==i0){g.globalAlpha=f;g.drawImage(dn9GokArt(i1),0,0,768,sh,0,0,W,Math.min(H,hh));g.globalAlpha=1;}}
 g.setTransform(S,0,0,S,0,0);
 // yıldızlar (alacakaranlıkta; finalde çoğalır ve parlar)
 const gece=clamp((gun-3.1)/.9,0,1),fin=DN9.fin;
 if(gece>.01){g.globalCompositeOperation='lighter';
  for(let i=0;i<DN9_STARS.length;i++){const s=DN9_STARS[i],y=s.y*vh;if(y>gokAlt)continue;if(s.esik>gece*.7+fin*.3)continue;const a=gece*(.35+.4*Math.sin(tm*s.sp+s.ph))*(1+fin*.5),x=s.x*vw;
   dn9Glow(s.col,x,y,s.r*5,s.r*5,a*.5);if(s.yil&&a>.4){const r=s.r*4.5*(a+.3);g.globalAlpha=Math.min(1,a*.8);g.drawImage(F.parilti,x-r,y-r,r*2,r*2);g.globalAlpha=1;}}
  g.globalCompositeOperation='source-over';
  // uykulu hilal ay
  const ma=gece*(1-A.w*.6);if(ma>.02){const mx=vw*.84-cam.x*.001%20,my=vh*.15;g.globalCompositeOperation='lighter';dn9Glow('#ffe8c0',mx,my,90,90,.14*ma);g.globalCompositeOperation='source-over';g.globalAlpha=ma;g.drawImage(F.ay,mx-36,my-36,72,72);g.globalAlpha=1;}}
 dn9GunesCiz(tm,A,gokAlt);
 // uzak bulutçuklar (yavaş, paralakslı)
 const BU=[dn9BulutArt(0),dn9BulutArt(1)];
 for(let j=0;j<DN9_BULUTL.length;j++){const [u,yf,bw,sp,v]=DN9_BULUTL[j],span=vw+bw*2,x=((u*span-tm*sp-cam.x*(.015+j*.006))%span+span)%span-bw,y=yf*vh-cam.y*.015+yk*vh*.1;
  if(y>gokAlt)continue;const a=[.8,.7,.75,.6,.55][j];
  if(ak<.99){g.globalAlpha=a*(1-ak);g.drawImage(BU[0][v],x,y,bw,bw*.375);}if(ak>.01){g.globalAlpha=a*ak;g.drawImage(BU[1][v],x,y,bw,bw*.375);}}
 g.globalAlpha=1;
 dn9Adalar(tm,vw,vh,gokAlt,ak,0);
 dn9Ejderler(tm,vw,vh,gokAlt,ak);
 // katmanlar (dolgu ve pus şeride basılı) + karede şelale parıltıları; uzak dağın ardından Ejderha Dağı, yeşil tepelerin ardından yakın adacıklar
 for(let i=0;i<sira.length;i++){const l=sira[i];if(!gorunur(l))continue;
  const f=DN9_SF[l],base=tab[l],alt=ort[l],y0=base-DN9_SH[l],wl=l===5?ws:l===4?smooth(clamp(yk*1.5,0,1)):1;
  if(y0>=alt||wl<.01)continue;
  for(let pp=0;pp<2;pp++){const w=l===5?(pp?0:1):pp?ak:1-ak;if(w<.01)continue;const img=dn9Serit(l,pp),Wd=img.width,off=((cam.x*f)%Wd+Wd)%Wd;
   g.globalAlpha=wl*(pp&&w<.99?w:(!pp&&ak>.01&&l!==5?1:w));for(let x=-off;x<vw;x+=Wd)dn9SeritCiz(img,x,y0,vw,alt);g.globalAlpha=1;}
  const yd=base+DN9_EXT-1;if(alt>yd){g.globalAlpha=wl;g.fillStyle=l===5?DN9_SDOLGU[5][0]:dn9Mix(DN9_SDOLGU[l][0],DN9_SDOLGU[l][1],ak);g.fillRect(0,yd,vw,alt-yd);g.globalAlpha=1;}
  dn9SeritFx(tm,l,((cam.x*f)%DN9_SW[l]+DN9_SW[l])%DN9_SW[l],y0,alt,wl);
  if(l===0){dn9DagCiz(tm,vw,vh,tab[1]+30,alt,ak);dn9Simgeler(tm,vw,1,tab[1]-30,alt,ak);}
  if(l===1)dn9Adalar(tm,vw,vh,gokAlt+200,ak,1);
  if(l===2)dn9Simgeler(tm,vw,0,tab[2]-38,ort[2],ak);
 }
 // ufukta günün ışıması: sabah altın, şelalede nane, adalarda şeftali, gün batımında turuncu-pembe; ışık arttıkça ısınır
 g.globalCompositeOperation='lighter';
 const R9=DN9.renk,hc=dn9AraR(['#fff0c0','#c8fff0','#ffd0c0','#ff9a70','#ff8aa0'],gun);
 dn9Glow(hc,A.sx,tab[1]-40,vw*.7,120,.1+R9*.08+ak*.08);{const sk=clamp(1-Math.abs(gun-2.2)*1.1,0,1);if(sk>.02)dn9Glow('#ffc86a',A.sx,A.sy+vh*.12,vw*.75,vh*.5,sk*.16);}dn9Glow('#ffd8a0',vw*.5,tab[2]-30,vw*.8,90,(.03+R9*.06+fin*.08));
 g.globalCompositeOperation='source-over';
 // solgunluk: Kalp sönükken uzak vadi biraz griye çalar (ışık geldikçe açılır)
 const sg=(1-R9)*.2*(1-fin);if(sg>.004){g.globalAlpha=sg;g.drawImage(F.solgun,0,0,8,128,0,Math.min(gokAlt,vh)-vh*.3,vw,vh*.3+Math.max(0,yZ-gokAlt)+2);g.globalAlpha=1;}
}
// şerit ışıltıları: uzak şelalelerin akışı (doku kayar), yuvaların sıcak minik ışığı
function dn9SeritFx(tm,l,off,y0,alt,wl){
 const fx=DN9.serFx[l];if(!fx)return;const vw=W/S,Wd=DN9_SW[l],F=DN9.fx;
 if(fx.su.length&&(l===5||l===0)){g.globalCompositeOperation='lighter';
  for(let x0=-off;x0<vw;x0+=Wd)for(const s of fx.su){const x=x0+s.x;if(x<-40||x>vw+40)continue;const ya=y0+s.y,yb=Math.min(alt,ya+s.L);if(yb<=ya)continue;
   g.globalAlpha=(l===5?.32:.2)*wl;dn9SuSerit(F.su,x,ya,yb,s.w*(l===5?1.1:2.2),tm*(l===5?60:30)+s.x);g.globalAlpha=1;
   if(l===5){const yy=Math.min(yb,ya+s.L)-6;for(let j=0;j<3;j++){const u=(tm*.3+j/3+s.x*.01)%1;dn9Glow('#e8ffff',x+(j-1)*s.w*.4,yy-u*30,s.w*.5+u*14,8+u*10,(1-u)*.25*wl);}}}
  g.globalCompositeOperation='source-over';}
 if(fx.yuva.length){g.globalCompositeOperation='lighter';const on=.15+DN9.renk*.45+DN9.fin*.4;
  for(let x0=-off;x0<vw;x0+=Wd)for(const p of fx.yuva){const x=x0+p.x,y=y0+p.y;if(x<-20||x>vw+20||y>alt)continue;dn9Glow('#ffd8a0',x,y,10,6,on*(.8+.2*Math.sin(tm*1.4+p.x))*wl);}
  g.globalCompositeOperation='source-over';}
}
// dikey akan su dokusu (y0..y1 arası; aşağı kayar)
function dn9SuSerit(img,x,y0,y1,w,off){
 const th=img.height;let y=y0-th+((off%th)+th)%th;
 while(y<y1){const a=Math.max(y,y0),b=Math.min(y+th,y1);if(b>a)g.drawImage(img,0,a-y,img.width,b-a,x-w/2,a,w,b-a);y+=th;}
}
// uzaktaki Ejderha Dağı ve tepesindeki sönük Kalp: yolculukta yaklaştıkça büyür, yuvaya varınca (artık oradayız) söner
function dn9DagCiz(tm,vw,vh,base,alt,ak){
 const cx=cam.x+VW*.5,XD=typeof BOLUM!=='undefined'&&BOLUM.yuva?BOLUM.yuva.x:nx(812);
 const wD=1-smooth(clamp((cx-726*T)/(34*T),0,1));if(wD<.01)return;
 const yak=clamp(cx/(740*T),0,1),k=lerp(.3,.92,yak*yak*yak),im0=dn9DagArt(0),w=im0.width*k,h=im0.height*k,sx=vw*.5+(XD-cx)*.014,top=base-h;
 if(sx+w/2<0||sx-w/2>vw||top>=alt)return;
 const kes=Math.min(im0.height,(alt-top)/k);
 for(let pp=0;pp<2;pp++){const ww=pp?ak:1-ak;if(ww<.01)continue;const im=dn9DagArt(pp);g.globalAlpha=wD*ww;g.drawImage(im,0,0,im.width,kes,sx-w/2,top,w,kes*k);}
 g.globalAlpha=1;
 // Kalp: soluk lila-altın-nane ışıma (ışık oranıyla güçlenir, finalde parlar); yamaçtaki yuvaların minik sıcak ışıkları
 const K=im0.kalp,kx=sx+(K.x-DN9_DAGW/2)*k,ky=top+K.y*k,on=.22+DN9.renk*.4+DN9.fin*.5,nb=.85+.15*Math.sin(tm*1.2);
 g.globalCompositeOperation='lighter';
 dn9Glow(DN9_KALP[0],kx,ky,90*k+30,80*k+26,on*.35*nb*wD);dn9Glow(DN9_KALP[1],kx,ky-6*k,40*k+14,46*k+16,on*.4*nb*wD);dn9Glow(DN9_KALP[2],kx+8*k,ky+6*k,30*k+10,26*k+10,on*.25*nb*wD);
 const r=(10+6*Math.sin(tm*1.7))*(k+.3);g.globalAlpha=Math.min(1,on*.9*wD);g.drawImage(DN9.fx.parilti,kx-r,ky-r,r*2,r*2);g.globalAlpha=1;
 for(const y of im0.yuva){const x=sx+(y.x-DN9_DAGW/2)*k,yy=top+y.y*k;if(yy>alt)continue;dn9Glow('#ffd8a0',x,yy,10*k+3,6*k+2,(.1+DN9.renk*.4)*wD);}
 g.globalCompositeOperation='source-over';
}
function dn9Background(tm){
 if(!dn9Ready())return;dn9FxArt();dn9Durum();DN9.kare++;
 g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
 dn9Backdrop(tm);
}

// ════════ Dünya: zemin parçaları + şelalelerin akışı, adacık şelaleleri, dere, çiçek ve kristal ışıltıları, fenerler, taç yaprakları ════════
function dn9Selaleler(tm){
 const Y=DN9.yap,F=DN9.fx,L0=cam.x-300,R0=cam.x+VW+300;
 for(const s of Y.su){if(s.x<L0||s.x>R0)continue;
  g.globalCompositeOperation='lighter';
  g.globalAlpha=.42;dn9SuSerit(F.su,s.x,s.y0,s.y1,s.w*.9,tm*230+s.ph*60);
  g.globalAlpha=.28;dn9SuSerit(F.su,s.x+s.w*.12,s.y0,s.y1,s.w*.7,tm*330+s.ph*90+128);
  g.globalAlpha=1;
  // perdenin üst kenarında kıvrılan ışık
  dn9Glow('#f0ffff',s.x,s.y0+2,s.w*.6,8,.35+.1*Math.sin(tm*2+s.ph));
  g.globalCompositeOperation='source-over';}
 // köpük ve su tozu: tabanda kabaran yumuşak köpük, yükselen ışıltılı sis, parıltılar
 for(const k of Y.kopuk){if(k.x<L0||k.x>R0)continue;const n=k.kucuk?4:7,w=k.w;
  for(let j=0;j<n;j++){const u=j/(n-1)-.5,r=w*(k.kucuk?.16:.2)*(1+.22*Math.sin(tm*3.1+j*1.7+k.ph)),px=k.x+u*w*.9+Math.sin(tm*1.3+j)*4,py=k.y-r*.3+Math.sin(tm*2.3+j*2)*3;
   g.globalAlpha=k.kucuk?.55:.7;g.drawImage(F.kopuk,px-r,py-r*.7,r*2,r*1.4);}
  g.globalAlpha=1;g.globalCompositeOperation='lighter';
  if(!k.kucuk)for(let j=0;j<6;j++){const u=(tm*.22+j/6+k.ph)%1,px=k.x+(dn9Hash(j*3.1+k.x)-.5)*w*1.4+u*20,py=k.y-10-u*150,r=30+u*60;g.globalAlpha=(1-u)*u*1.1*.5;g.drawImage(F.sis,px-r,py-r*.6,r*2,r*1.2);}
  g.globalAlpha=1;
  for(let j=0;j<8;j++){const u=(tm*.5+j/8+k.ph*.3)%1,px=k.x+(dn9Hash(j*7.7+k.x)-.5)*w*1.3,py=k.y-6-u*(k.kucuk?40:110),a=Math.sin(u*Math.PI)*.8,r=3+dn9Hash(j*1.3)*4;
   g.globalAlpha=a;g.drawImage(j%3?F.parilti:F.pariltiN,px-r,py-r,r*2,r*2);}
  g.globalAlpha=1;g.globalCompositeOperation='source-over';}
}
function dn9AdaSulari(tm){
 const Y=DN9.yap,F=DN9.fx,L0=cam.x-60,R0=cam.x+VW+60;
 g.globalCompositeOperation='lighter';
 for(const s of Y.adaSu){if(s.x<L0||s.x>R0)continue;g.globalAlpha=.75;g.drawImage(F.suInce,s.x-5,s.y,10,s.L);
  g.globalAlpha=.4;dn9SuSerit(F.su,s.x,s.y,s.y+s.L*.8,9,tm*180+s.ph*40);g.globalAlpha=1;
  for(let j=0;j<4;j++){const u=(tm*.9+j/4+s.ph)%1,py=s.y+u*s.L*1.1,a=(1-u)*.8;dn9Glow('#e8ffff',s.x+Math.sin(j*2+tm)*2,py,4,5,a*.6);}
  const r=6+2*Math.sin(tm*2+s.ph);g.globalAlpha=.5;g.drawImage(F.parilti,s.x-r,s.y+s.L*.85-r,r*2,r*2);g.globalAlpha=1;}
 // adacıkların altında yumuşak yosun ışığı (yükseklik korkutmasın: alt yumuşak, ılık)
 for(const a of Y.adaYuz){if(a.x1<L0||a.x0>R0)continue;dn9Glow('#c8ffd8',(a.x0+a.x1)/2,a.y+a.der*.6,(a.x1-a.x0)*.5,a.der*.5,.06+.03*Math.sin(tm*1.2+a.ph));}
 g.globalCompositeOperation='source-over';
}
function dn9Dereler(tm){
 const Y=DN9.yap,F=DN9.fx;
 for(const d of Y.dere){if(d.x1<cam.x-60||d.x0>cam.x+VW+60)continue;g.globalCompositeOperation='lighter';
  // akıntı çizgileri (sağa akar) ve parıltılar
  g.fillStyle='rgba(255,255,255,.5)';for(let j=0;j<12;j++){const u=(tm*.12+j/12)%1,x=d.x0+u*(d.x1-d.x0),y=d.y+12+(j%4)*9,w=14+dn9Hash(j)*16;g.globalAlpha=Math.sin(u*Math.PI)*.45;g.fillRect(x,y,w,1.6);}
  for(let j=0;j<6;j++){const u=(tm*.37+j/6)%1,x=d.x0+dn9Hash(j*4.4)*(d.x1-d.x0),y=d.y+10+dn9Hash(j*2.2)*30,r=3+dn9Hash(j)*3;g.globalAlpha=Math.sin(u*Math.PI)*.8;g.drawImage(F.parilti,x-r,y-r,r*2,r*2);}
  g.globalAlpha=1;g.globalCompositeOperation='source-over';}
}
// ışıltılar: pul gibi yanardöner çiçekler, kaya evin pencereleri, kristaller, kemerin içi
function dn9Isiltilar(tm){
 const Y=DN9.yap,F=DN9.fx,L0=cam.x-120,R0=cam.x+VW+120,nb=dn9Nabiz(),R9=DN9.renk;
 g.globalCompositeOperation='lighter';
 for(let i=dn9Bas(Y.cicek,L0);i<Y.cicek.length;i++){const p=Y.cicek[i];if(p.x>R0)break;const on=dn9Isik(p.x),a=(.05+on*.42)*(.75+.25*Math.sin(tm*1.6+p.ph));dn9Glow(p.col,p.x,p.y,p.r,p.r,a);if(on>.3&&((tm*.5+p.ph)%3)<.5){const r=p.r*.4;g.globalAlpha=a;g.drawImage(F.parilti,p.x-r,p.y-r,r*2,r*2);g.globalAlpha=1;}}
 for(let i=dn9Bas(Y.pen,L0);i<Y.pen.length;i++){const p=Y.pen[i];if(p.x>R0)break;const fl=.9+.1*Math.sin(tm*2.1+p.ph),a=(.4+R9*.25+DN9.fin*.2+nb*.15)*fl;dn9Glow('#ffc870',p.x,p.y,p.r*2.6,p.r*2.4,a*.55);dn9Glow('#fff0c0',p.x,p.y,p.r*.9,p.r*.9,a*.6);}
 for(let i=dn9Bas(Y.kristal,L0);i<Y.kristal.length;i++){const p=Y.kristal[i];if(p.x>R0)break;const on=Math.max(dn9Isik(p.x),.35),a=(.12+on*.36+nb*.25)*(.8+.2*Math.sin(tm*1.3+p.ph));dn9Glow(p.col,p.x,p.y,p.r,p.r*1.1,a);dn9Glow('#ffffff',p.x,p.y-p.r*.15,p.r*.22,p.r*.3,a*.6);}
 const K=Y.kemer;if(K&&K.x>L0-200&&K.x<R0+200){const a=.14+R9*.18+DN9.fin*.4+nb*.2;dn9Glow(DN9_KALP[1],K.x,K.y-20,K.w*.46,K.h*.5,a*.5);dn9Glow(DN9_KALP[0],K.x,K.y-120,K.w*.6,K.h*.42,a*.35);}
 g.globalCompositeOperation='source-over';
}
// fener ipleri (yuva dağı): ip eğrisi + salınan kâğıt fenerler, ılık ışık (finalde nabızla atar)
function dn9Fenerler(tm){
 const Y=DN9.yap,F=DN9.fx,L0=cam.x-80,R0=cam.x+VW+80,nb=dn9Nabiz(),R9=DN9.renk;
 for(const ip of Y.ip){if(ip.x1<L0||ip.x0>R0)continue;const mx=(ip.x0+ip.x1)/2,my=(ip.y0+ip.y1)/2+ip.sag*2*(1+.04*Math.sin(tm*.9+ip.ph));
  g.strokeStyle='rgba(90,60,70,.8)';g.lineWidth=1.4;g.beginPath();g.moveTo(ip.x0,ip.y0);g.quadraticCurveTo(mx,my,ip.x1,ip.y1);g.stroke();
  for(let k=1;k<ip.n;k++){const u=k/ip.n,a=(1-u)*(1-u),b2=2*u*(1-u),d=u*u,x=a*ip.x0+b2*mx+d*ip.x1,y=a*ip.y0+b2*my+d*ip.y1;if(x<L0||x>R0)continue;
   const sw=Math.sin(tm*1.2+k+ip.ph)*.1,ci=(k+(ip.ph*3|0))%4;g.save();g.translate(x,y);g.rotate(sw);g.drawImage(F.fener[ci],-12,-2,24,34);g.restore();
   g.globalCompositeOperation='lighter';dn9Glow(['#c8a8ff','#ffc870','#9ff0c8','#ffa8c8'][ci],x,y+16,30,30,.22+R9*.2+nb*.25);dn9Glow('#fff2d0',x,y+16,6,8,.4+nb*.3);g.globalCompositeOperation='source-over';}}
}
// süzülen taç yaprakları: her dev ağacın tacından yere (rüzgârla hafif sağa), görünür ağaçlarda
function dn9Yapraklar(tm){
 const Y=DN9.yap,F=DN9.fx,L0=cam.x-300,R0=cam.x+VW+300;
 for(let i=dn9Bas(Y.yaprak,L0);i<Y.yaprak.length;i++){const e=Y.yaprak[i];if(e.x>R0)break;if(e.gy===undefined)e.gy=dn9Surface(e.x)+4;const dus=Math.max(80,e.gy-e.y);
  for(let j=0;j<6;j++){const h=dn9Hash(j*5.3+e.x),u=(tm*(.06+h*.04)+j/6+h)%1,x=e.x+(h-.5)*e.w*1.6+u*70+Math.sin(tm*1.1+j*2+h*6)*16,y=e.y+u*dus;
   const a=Math.min(1,u*6)*Math.min(1,(1-u)*4)*.9,fl=Math.cos(tm*(1.6+h)+j),im=F.yaprak[(e.ci*2+j)%6],w=14*(.6+h*.5);
   g.globalAlpha=a;g.drawImage(im,x-w/2*Math.abs(fl),y-w*.35,w*Math.max(.15,Math.abs(fl)),w*.7);}}
 g.globalAlpha=1;
}
// ── Işık tozu / çiçek izi: Feza'nın adımlarında çimende minik çiçek açar, yumuşak ışık ve tozlar yükselir (sabit havuz) ──
const DN9_IZ_N=40,DN9_IZ=Array.from({length:DN9_IZ_N},()=>({x:0,y:0,t:-1e9,tip:'feza',ci:0}));let dn9IzI=0;
function dn9Iz(x,y,tip){DN9.izDis=now;dn9IzEkle(x,y,tip);}   // dışarıdan (feza.js / yavru.js) çağrılınca kendi adım izim susar
function dn9IzEkle(x,y,tip){
 if(!Number.isFinite(x)||!Number.isFinite(y))return;const Z=DN9_IZ[dn9IzI];dn9IzI=(dn9IzI+1)%DN9_IZ_N;Z.x=x;Z.y=y;Z.t=now;Z.tip=tip||'feza';Z.ci=(dn9IzI*7)%6;
}
function dn9Izler(tm){
 const F=DN9.fx,L0=cam.x-60,R0=cam.x+VW+60;
 for(let i=0;i<DN9_IZ_N;i++){const Z=DN9_IZ[i],age=now-Z.t,omur=Z.tip==='inis'?3:2.6;if(age<0||age>omur||Z.x<L0||Z.x>R0)continue;const u=age/omur;
  // minik çiçek: açılır (0,25 sn), durur, solarak küçülür
  const ac=smooth(clamp(age/.25,0,1)),s=(Z.tip==='inis'?18:13)*ac*(1-smooth(clamp((u-.6)/.4,0,1))*.6),a=1-smooth(clamp((u-.55)/.45,0,1));
  if(s>.5&&Z.tip!=='yavru'){g.globalAlpha=a;g.drawImage(F.minikCicek[Z.ci],Z.x-s/2+((i%3)-1)*6,Z.y-s*.8,s,s);g.globalAlpha=1;}
  g.globalCompositeOperation='lighter';g.globalAlpha=(1-u)*(1-u)*.5;const w=Z.tip==='inis'?36:22;g.drawImage(F.iz,Z.x-w/2,Z.y-w*.2,w,w*.42);
  if(age<1.2){for(let j=0;j<(Z.tip==='inis'?6:3);j++){const h=dn9Hash(i*7.3+j*3.1),v=age/1.2,px=Z.x+(h-.5)*26+Math.sin(age*3+j)*4,py=Z.y-4-v*(22+h*26),col=DN9_TOZ[(i+j)%8];dn9Glow(col,px,py,5,5,(1-v)*.7);}}
  g.globalAlpha=1;g.globalCompositeOperation='source-over';}
}
// Feza yerde yürürken kendiliğinden iz bırak (feza.js dn9Iz çağırmasa da)
function dn9KendiIz(){
 if(typeof P==='undefined'||P.ucus||!P.ground||DURUM!=='oyun')return;if(Math.abs(P.vx||0)<40){DN9.izX=undefined;return;}
 if(DN9.izX===undefined||Math.abs(P.x-DN9.izX)>38){DN9.izX=P.x;if(!DN9.izDis||now-DN9.izDis>.6)dn9IzEkle(P.x,P.y,'feza');}
}
function dn9World(tm){
 if(!dn9Ready())return;dn9Yapilar();dn9Terrain();
 const F=DN9.fx;g.setTransform(1,0,0,1,0,0);
 // solgunluk örtüsü: Kalp sönükken vadinin alt kısmı hafif soluk (pul çiçekleri ve yavrularla açılır); akşamda sıcak altın
 const sg=.17*(1-DN9.renk)*(1-DN9.fin);if(sg>.004){g.globalAlpha=sg;g.drawImage(F.solgun,0,0,8,128,0,H*.3,W,H*.7+1);}
 // ışık geldikçe (çiçekler + yavrular) vadinin altı ılık altınla parlar: Feza ışığı geri getirdiğini görür
 const isk=DN9.renk*.08*(1-DN9.fin*.5);if(isk>.004){g.globalCompositeOperation='lighter';g.globalAlpha=isk;g.drawImage(F.sicak,0,0,8,128,0,H*.35,W,H*.65+1);g.globalCompositeOperation='source-over';}
 const ak=dn9AksamK(DN9.gun);if(ak>.01){g.globalAlpha=ak*.12;g.drawImage(F.sicak,0,0,8,128,0,H*.25,W,H*.75+1);}g.globalAlpha=1;
 g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);
 dn9Selaleler(tm);dn9AdaSulari(tm);dn9Dereler(tm);dn9Isiltilar(tm);dn9Fenerler(tm);dn9Yapraklar(tm);dn9KendiIz();dn9Izler(tm);
 // açılan çiçeğin / çıkan yavrunun yerde ılık ışık havuzu, yayılan renk halkası ve göğe yükselen ışık
 g.globalCompositeOperation='lighter';
 for(const Lt of DN9.lit){if(Lt.x<cam.x-400||Lt.x>cam.x+VW+400)continue;const on=smooth(clamp((now-Lt.t)/1.5,0,1)),nb=.85+.15*Math.sin(tm*1.7+Lt.x),sy=dn9Surface(Lt.x);if(sy>=1200)continue;
  dn9Glow(Lt.col,Lt.x,sy+2,150,26,on*.22*nb);dn9Glow('#fff0c0',Lt.x,sy-30,90,70,on*.08*nb);}
 for(const Lt of DN9.lit){const age=now-Lt.t;if(age<0||age>3.2||Lt.x<cam.x-1100||Lt.x>cam.x+VW+1100)continue;const u=age/3.2,col=Lt.col||DN9_ALTIN,sy=dn9Surface(Lt.x);
  if(sy<1200)dn9Glow(col,Lt.x,sy-4,60+u*800,18+u*40,(1-u)*.22);
  const yu=Lt.y-u*u*700;for(let j=0;j<6;j++)dn9Glow(DN9_TOZ[j],Lt.x+Math.sin(age*6+j)*8,yu+j*22,10-j,18,(1-u)*(1-j/6)*.45);}
 // final: yuvaya ılık ışık
 if(DN9.fin>.01&&typeof BOLUM!=='undefined'&&BOLUM.yuva){const nb=.8+.2*Math.sin(tm*1.5)+dn9Nabiz()*.3;dn9Glow('#ffd27a',BOLUM.yuva.x,BOLUM.yuva.y-140,560,280,DN9.fin*.12*nb);dn9Glow('#c8a8ff',BOLUM.yuva.x-240,BOLUM.yuva.y-240,320,220,DN9.fin*.08*nb);dn9Glow('#9ff0c8',BOLUM.yuva.x+260,BOLUM.yuva.y-220,300,200,DN9.fin*.06*nb);}
 g.globalCompositeOperation='source-over';g.globalAlpha=1;
}

// ════════ Işık tozu (havada süzülen; BÖCEK DEĞİL): arkada ve önde; çiçekler açıldıkça çoğalır ve parlar ════════
const dn9R=rng(5959),DN9_TOZL=Array.from({length:64},(_,i)=>({x:dn9R()*6000,y:dn9R()*1300,z:.25+dn9R()*1.15,ph:dn9R()*6.283,r:.7+dn9R()*1.6,col:DN9_TOZ[i%8],sp:.4+dn9R()*.9,esik:dn9R()}));
function dn9Motes(tm,zMin,zMax){
 if(!dn9Ready())return;const vw=W/S,vh=H/S,px=(Number.isFinite(P.rx)?P.rx:P.x)-cam.x,py=(Number.isFinite(P.ry)?P.ry:P.y)-cam.y-34,br=.5+DN9.renk*.5,F=dn9FxArt(),yog=.45+DN9.renk*.55;
 g.setTransform(S,0,0,S,0,0);g.globalCompositeOperation='lighter';
 for(let i=0;i<DN9_TOZL.length;i++){const p=DN9_TOZL[i];if(p.z<zMin||p.z>=zMax||p.esik>yog)continue;
  const x=((p.x-cam.x*p.z+Math.sin(tm*.23+p.ph)*26)%(vw+100)+vw+100)%(vw+100)-50,y=((p.y-cam.y*p.z-tm*p.sp*9+Math.sin(tm*.19+p.ph)*14)%(vh+100)+vh+100)%(vh+100)-50;
  let a=(.26+.2*Math.sin(tm*1.3+p.ph))*(p.z>.8?.9:.6)*br;
  if(p.z>=.75){const dx=(x-px)/60,dy=(y-py)/80,d=dx*dx+dy*dy;if(d<1)a*=.15+.85*smooth(d);}
  dn9Glow(p.col,x,y,p.r*5,p.r*5,a*.6);if(i%5===0){const r=p.r*3.4;g.globalAlpha=a*.7;g.drawImage(F.parilti,x-r,y-r,r*2,r*2);g.globalAlpha=1;}
  else{g.fillStyle=p.col;g.globalAlpha=a;g.fillRect(x-p.r*.5,y-p.r*.5,p.r,p.r);g.globalAlpha=1;}}
 g.globalAlpha=1;g.globalCompositeOperation='source-over';
}
// önde süzülen taç yaprakları (yakın, iri; ağaçlı yerlerde) ve şelale yakınında önden geçen ince su tozu
const DN9_ONY=Array.from({length:12},(_,i)=>({u:dn9Hash(i*3.7),v:dn9Hash(i*9.1),sp:.035+dn9Hash(i*1.9)*.03,ph:dn9Hash(i*5.5)*6.283,s:.9+dn9Hash(i*2.3)*.9,ci:i%6}));
function dn9Petals(tm){
 if(!dn9Ready())return;const F=dn9FxArt(),vw=W/S,vh=H/S,cx=cam.x+VW*.5,b=dn9Bolge(cx);
 const ucus=typeof P!=='undefined'&&!!P.ucus&&P.ucus.tip==='buyukanneBinis';
 let wy=b==='giris'||b==='cayir'||b==='adalar'||b==='kolye'?1:b==='selale'||b==='kanat'||b==='meyve'?.55:ucus?.35:.4;
 g.setTransform(S,0,0,S,0,0);
 for(let i=0;i<DN9_ONY.length;i++){const p=DN9_ONY[i];if(i/DN9_ONY.length>wy)continue;
  const span=vw+160,x=((p.u*span+tm*28*p.s-cam.x*1.15)%span+span)%span-80+Math.sin(tm*.9+p.ph)*24,y=((p.v*(vh+120)+tm*p.sp*900)%(vh+120))-60;
  const fl=Math.cos(tm*1.7*p.s+p.ph),w=22*p.s;g.globalAlpha=.85;g.drawImage(F.yaprak[p.ci],x-w/2*Math.abs(fl),y-w*.35,w*Math.max(.15,Math.abs(fl)),w*.7);}
 g.globalAlpha=1;
 // şelale yakınında önden geçen su tozu
 const ws=dn9SelaleAgirlik(cx);if(ws>.02&&!ucus){g.globalCompositeOperation='lighter';
  for(let j=0;j<6;j++){const u=(tm*.05+j/6)%1,x=((j*.17+u*.4)%1)*vw,y=vh*(.85-u*.5),r=90+j*14;g.globalAlpha=ws*Math.sin(u*Math.PI)*.1;g.drawImage(F.sis,x-r,y-r*.5,r*2,r);}
  g.globalAlpha=1;g.globalCompositeOperation='source-over';}
}
// ════════ Ön plan: alt köşelerde yakın iri yapraklar ve eğreltiler, üstte sarkan çiçekli dallar, gün saatine göre ışık ════════
function dn9OnArt(){
 const F=dn9FxArt();if(F.on)return F.on;
 F.on=[0,1].map(v=>{const cv=dn9Cv(560,300),c=cv.getContext('2d'),R=rng(911+v*31);c.scale(2,2);const w=280,h=150;
  c.fillStyle='#1e4a3a';c.beginPath();c.moveTo(0,h);c.bezierCurveTo(w*.05,h*.7,w*.25,h*.55,w*.45,h*.62);c.bezierCurveTo(w*.62,h*.68,w*.8,h*.56,w*.94,h*.72);c.quadraticCurveTo(w,h*.86,w,h);c.closePath();c.fill();
  for(let k=0;k<5;k++){const x=w*(.1+k*.2)+R()*14,y=h*.66,s=.9+R()*.6;c.fillStyle=k%2?'#24563e':'#2a6046';c.beginPath();c.moveTo(x,y+10);c.bezierCurveTo(x-30*s,y-4*s,x-40*s,y-42*s,x-6*s,y-50*s);c.bezierCurveTo(x+16*s,y-56*s,x+36*s,y-22*s,x,y+10);c.fill();
   c.strokeStyle='#3a7254';c.lineWidth=1.6;c.beginPath();c.moveTo(x,y+6);c.quadraticCurveTo(x-10*s,y-22*s,x-6*s,y-44*s);c.stroke();}
  for(let k=0;k<3;k++)dn9OnEgrelti(c,w*(.15+k*.33),h*.7,1.1+R()*.4,R,k%2?1:-1);
  // birkaç çiçek (yakın, koyu ama renkli)
  for(let k=0;k<4;k++){const x=w*(.12+k*.24)+R()*20,y=h*(.5+R()*.12);c.strokeStyle='#2a5a40';c.lineWidth=1.6;c.beginPath();c.moveTo(x,h*.8);c.quadraticCurveTo(x+4,(y+h*.8)/2,x,y);c.stroke();
   c.fillStyle=['#c86a90','#c8a050','#8a70c0','#d08a70'][k];for(let j=0;j<5;j++){const b=j*1.2566;c.beginPath();c.ellipse(x+Math.cos(b)*5,y+Math.sin(b)*5,4.4,3,b,0,6.283);c.fill();}c.fillStyle='#e0c060';c.beginPath();c.arc(x,y,2.4,0,6.283);c.fill();}
  return cv;});
 return F.on;
}
function dn9OnEgrelti(c,x,y,s,R,yon){
 c.lineCap='round';for(let k=0;k<4;k++){const an=-1.57+(k/3-.5)*1.6*yon,L=(46+R()*20)*s,ex=x+Math.cos(an)*L,ey=y+Math.sin(an)*L,cx2=x+Math.cos(an-.5*yon)*L*.6,cy2=y+Math.sin(an-.5*yon)*L*.75;
  c.strokeStyle='#1e5038';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(cx2,cy2,ex,ey);c.stroke();
  for(let j=1;j<9;j++){const u=j/9,px=(1-u)*(1-u)*x+2*u*(1-u)*cx2+u*u*ex,py=(1-u)*(1-u)*y+2*u*(1-u)*cy2+u*u*ey,l=(1-u*.7)*9*s;c.fillStyle=j%2?'#2e6a4a':'#285e42';c.beginPath();c.ellipse(px-3,py,l,2.6*s,an+.9,0,6.283);c.ellipse(px+3,py,l,2.6*s,an-.9,0,6.283);c.fill();}}
}
// üstte sarkan çiçekli dal (yakın, paralaks 1,15)
function dn9DalArt(){
 const F=dn9FxArt();if(F.dal)return F.dal;const cv=dn9Cv(900,260),c=cv.getContext('2d'),R=rng(4242);
 c.strokeStyle='#5a3a34';c.lineCap='round';c.lineWidth=14;c.beginPath();c.moveTo(-20,10);c.bezierCurveTo(200,40,420,30,640,70);c.stroke();
 c.lineWidth=6;for(const [x0,y0,x1,y1] of [[200,36,280,120],[420,34,470,140],[560,58,660,150],[320,36,330,90]]){c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo((x0+x1)/2+20,(y0+y1)/2,x1,y1);c.stroke();}
 for(let k=0;k<70;k++){const u=R(),x=u*700+R()*40,y=20+u*50+R()*110,r=10+R()*16;c.fillStyle=['#e88aac','#f4b0c8','#d86a98','#ffd0e0'][k%4];c.beginPath();c.arc(x,y,r,0,6.283);c.fill();}
 for(let k=0;k<60;k++){const x=R()*700,y=20+R()*150,s=2+R()*2;c.fillStyle=k%2?'#ffffff':'#ffe0ec';for(let j=0;j<5;j++){const b=j*1.2566;c.beginPath();c.arc(x+Math.cos(b)*s,y+Math.sin(b)*s,s*.8,0,6.283);c.fill();}}
 for(let k=0;k<12;k++){const x=R()*700,y=60+R()*120;c.fillStyle=k%2?'#3e8a5a':'#5aa676';c.beginPath();c.ellipse(x,y,12,5,R()*3,0,6.283);c.fill();}
 c.globalCompositeOperation='source-atop';c.fillStyle='rgba(60,20,60,.22)';c.fillRect(0,0,900,260);
 F.dal=cv;return cv;
}
// ön plan yapraklarının konmadığı aralıklar: mini oyun alanları ve yuva (sahneyi örtmesin) — bir kez hesaplanır
function dn9OnBos(){
 if(DN9.onBos)return DN9.onBos;const L=[];
 for(const o of NESNELER){if(!/Mini$/.test(o.tip)&&o.tip!=='ejderYuva'&&o.tip!=='buyukanneBinis')continue;const a=Number.isFinite(o.x0)?o.x0:o.x-700,b=Number.isFinite(o.x1)?o.x1:o.x+700;L.push(Math.min(a,o.x-380)-220,Math.max(b,o.x+360)+220);}
 return DN9.onBos=L;
}
// Yaprak paralaksla kayar: uzaklık ekran üzerinde ölçülür. Çiçek ve yumurtalar da açıkta kalır.
function dn9OnSaydamlik(sx,yar,px){
 const L=DN9.onNes||(DN9.onNes=NESNELER.filter(o=>(o.tip==='pulCicek'||o.tip==='ejderYumurta')&&Number.isFinite(o.x)));
 let d=Math.abs(sx-px)-yar;
 for(const o of L){const e=Math.abs(sx-(o.x-cam.x))-yar;if(e<d)d=e;}
 return .2+.68*smooth(clamp((d+20)/110,0,1));
}
function dn9Foreground(tm){
 if(!dn9Ready())return;const F=dn9FxArt(),vw=W/S,vh=H/S;dn9OnArt();
 const ucus=typeof P!=='undefined'&&!!P.ucus&&P.ucus.tip==='buyukanneBinis',gun=DN9.gun,ak=dn9AksamK(gun);
 if(!ucus){
  const bos=dn9OnBos(),kacik=wx=>{for(let i=0;i<bos.length;i+=2)if(wx>bos[i]&&wx<bos[i+1])return true;return false;};
  // üstte sarkan çiçekli dallar (girişte, çayırda, adalarda)
  {const f=1.15,span=1900,left=cam.x*f-900,right=cam.x*f+vw;g.setTransform(S,0,0,S,-cam.x*S*f,0);const dal=dn9DalArt();
   for(let q=Math.floor(left/span);q<=Math.ceil(right/span);q++){const x=q*span+dn9Hash(q*3)*400,wx=x/f+vw*.4,b=dn9Bolge(wx);if(!(b==='giris'||b==='cayir'||b==='adalar'))continue;if(kacik(wx))continue;
    const sol=dn9Hash(q*7)<.5,k=.55+dn9Hash(q)*.2;g.save();g.translate(x,-30);g.rotate(Math.sin(tm*.4+q)*.012);g.scale(sol?k:-k,k);g.globalAlpha=.95;g.drawImage(dal,sol?-40:-700,-10,900,260);g.restore();}
   g.globalAlpha=1;}
  // alt: yakın iri yapraklar; Feza'nın üstüne gelince saydamlaşır. Dünyaya bağlı (zeminin hemen önünde, x ve y'de hafif paralaks):
  // Feza yükseğe çıkınca kamerayla birlikte yumuşakça aşağı kayıp ekrandan çıkar, inince yine yumuşakça girer (ekrana yapışıp havada kalmaz)
  const fb=1.1,left=cam.x*fb-160,right=cam.x*fb+vw+160,px=(Number.isFinite(P.rx)?P.rx:P.x);g.setTransform(S,0,0,S,-cam.x*S*fb,0);
  for(let q=Math.floor(left/680);q<=Math.ceil(right/680);q++){const R=rng(q*71+883),x=q*680+R()*200,wx=x/fb;if(wx>DN9_GAP0-200&&wx<DN9_GAP1+100)continue;
   if(kacik(wx))continue;const k=.5+R()*.25,hk=150*k*1.35,al=dn9OnSaydamlik(x-cam.x*fb,140*k*1.35,px-cam.x);
   const yb=Math.min(dn9Surface(wx-120),dn9Surface(wx),dn9Surface(wx+120))+95,sy=Math.max(vh+30,vh*.85+((yb-cam.y)-vh*.85)*fb);if(sy-hk>vh+4)continue;   // en yukarı eski yerine (vh+30) çıkar: alt kenarı hiç görünmez
   g.save();g.translate(x,sy);g.rotate(Math.sin(tm*.35+q)*.015);g.globalAlpha=al;g.drawImage(F.on[Math.abs(q)%2],-140*k*1.35,-hk,280*k*1.35,hk);g.restore();}
  g.globalAlpha=1;
 }
 // ekran geneli: günün ışığı (sabah altın, şelalede nane serinliği, adalarda şeftali, gün batımında turuncu, alacakaranlıkta mor) ve ışık arttıkça sıcaklık
 g.setTransform(S,0,0,S,0,0);g.globalCompositeOperation='lighter';
 const R9=DN9.renk,A=DN9.gunes,ic=dn9AraR(['#ffe8b0','#a8ffe8','#ffc8b0','#ff9a68','#c890ff'],gun);
 dn9Glow(ic,A.sx,A.sy,vw*.75,vh*.7,.06+R9*.04);
 if(R9>.02)dn9Glow('#ffd8a0',vw*.5,vh*.95,vw*.8,vh*.35,(.02+R9*.05+DN9.fin*.05));
 if(DN9.fin>.01)dn9Glow('#c8a8ff',vw*.75,vh*.1,vw*.5,vh*.4,DN9.fin*.06);
 g.globalCompositeOperation='source-over';
}
// vinyet: ortası saydam → yalnız dört kenar parçası
const DN9_VIG=[[0,0,200,16],[0,132,200,28],[0,16,42,116],[158,16,42,116]];
function dn9Vignette(){if(!dn9Ready())return;const F=dn9FxArt(),kx=W/200,ky=H/160;g.setTransform(1,0,0,1,0,0);g.globalAlpha=.85+dn9AksamK(DN9.gun)*.15;
 for(const [x,y,w,h] of DN9_VIG){const dx=Math.round(x*kx),dy=Math.round(y*ky);g.drawImage(F.vig,x,y,w,h,dx,dy,Math.round((x+w)*kx)-dx,Math.round((y+h)*ky)-dy);}g.globalAlpha=1;}

// ════════ Isıtma: önbellekleri kareye yayarak hazırla (uyku girişi / karanlık altında) ════════
// hazırlanan önbellek tuvalini ana tuvale neredeyse görünmez minicik bir kez çiz: GPU doku yüklemesi oyunun ortasında (ilk göründüğü
// karede ~40 ms sıçrama) değil, açılış karartmasının altında olur (arayuz.js uiIsit gibi)
function dn9Yukle(v){if(!v)return v;if(v.getContext||v instanceof HTMLImageElement){g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=.004;g.drawImage(v,0,0,2,2);g.restore();}
 else if(Array.isArray(v))for(const a of v)dn9Yukle(a);else if(typeof v==='object')for(const k in v)if(v[k]&&v[k].getContext)dn9Yukle(v[k]);return v;}
function dn9Isit(){
 if(!dn9Ready())return false;const p=DN9.prep;
 if(p<5){dn9Yukle(dn9GokArt(p));DN9.prep++;return false;}
 if(p===5){dn9Yukle(dn9FxArt());dn9Yukle(dn9BulutArt(0));dn9Yukle(dn9BulutArt(1));DN9.prep++;return false;}
 if(p<12){dn9Yukle(dn9Serit(p-6,0));DN9.prep++;return false;}
 if(p<17){dn9Yukle(dn9Serit(p-12,1));DN9.prep++;return false;}
 if(p===17){dn9Yukle(dn9DagArt(0));dn9Yukle(dn9DagArt(1));DN9.prep++;return false;}
 if(p===18){dn9Yukle(dn9EjderArt(0));dn9Yukle(dn9EjderArt(1));for(let v=0;v<3;v++){dn9Yukle(dn9AdaArt(v,0));dn9Yukle(dn9AdaArt(v,1));}for(let v=0;v<7;v++)dn9Yukle(dn9SimgeArt(v,0,v?0:1));DN9.prep++;return false;}
 if(p===19){dn9Yukle(dn9OnArt());dn9Yukle(dn9DalArt());dn9Yapilar();DN9.prep++;return false;}
 if(p<23){const i=Math.max(0,Math.floor(((typeof cam!=='undefined'?cam.x:0))/DN9_CW))+(p-20);dn9Yukle(dn9Chunk(i));DN9.prep++;return false;}
 for(const c of ['#fff2c0','#e8fff0','#ffd8c4','#ff9a74','#ff8a70','#fffbe8','#f4fff8','#fff0dc','#ffd49a','#ffb27e','#c8a8ff','#ffd27a','#9ff0c8','#ffd8a0','#fff0c0',
  '#e8ffff','#f0ffff','#c8ffd8','#ffc870','#ffa8c8','#fff2d0','#ffffff','#ffe8c0','#fff4e0','#ffe2b0','#e8d8ff','#c8ffe8','#ffe8a8','#d9c8ff','#b8ffd8','#ffd0e0','#fff4d0','#c8f08a','#ffc29a','#bfefff'])glow(c);
 DN9.warm=true;return true;
}
