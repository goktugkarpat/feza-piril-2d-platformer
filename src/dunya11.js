/* dunya11.js — Ay Işığı Şatosu'nun dünyası (Bölüm 11; HARITA). Mor-lacivert, yıldızlı bir Cadılar Bayramı gecesi: bulutların ardına
   saklanmış uykulu kocaman inci Ay (finalde bulutlar dağılır, Ay gülümseyerek tam çıkar), katman katman uzak tepeler (tepede eğri büğrü
   SEVİMLİ pastel şato; yuvarlak pencereler, kıvrık külahlar), sisli pastel bahçe ve şatoya çıkan yokuş (yarasa/kalp/ay biçimli budanmış
   çalılar, lolipop ağaçlar, ay ışığı lambaları; ÇİÇEK YOK), şatonun taş kanadı ve kuleleri, ayna salonu, asma köprü ve altında yumuşak sis
   yastıkları, pastel kristalli mağara, yıldızlı org salonu, kadife perdeli galeri (gülen aile portreleri), Nine'nin mutfağı, balkon,
   pelerin uçuşunun gece manzarası (aşağıda şatonun ışıklı çatıları), kule terası ve kubbeli balo salonu. Havada ışık tozu (BÖCEK YOK).
   Işık: aynalar döndükçe (dn11IsikOrani) dünya gri-mor soluk hâlden gümüş-mavi + altın renge döner: yerel "soluk örtü" ışığın ulaştığı
   yerde kalkar, pencereler sıra sıra yanar, ay ışığı topları (alev değil) parlar. Finalden sonra pembe-altın sabah.
   Mimari dunya8.js ile aynı: büyük resimler yalnız önbellek tuvallerinde bir kez boyanır (gök, ay, tepe şeritleri, zemin parçaları,
   sprite'lar); karede yeni gradyan/filtre/gölge yok; parçacık havuzları sabit; zemin parçaları LRU (8).
   oyun.js kancaları (omDr 'dn11'): dn11Background dn11Motes dn11World dn11Petals dn11Foreground dn11Vignette, ısıtma dn11Isit.
   Diğer modüllere: dn11IsikOrani() 0..1, dn11Isik(x) yerel ışık 0..1, dn11IsikEkle(x, y, renk, menzil), dn11Iz(x, y, tip) sis halkası,
   dn11Surface(x) zemin, dn11Ay() ayın dünya konumu {x, y, r, acik}, dn11Tavan(x) oda/mağara tavanı (yoksa NaN). Aynalar ve satoParca
   AYNA'nındır (ayna11.js): onların yerinde dekor boş bırakılır. */
'use strict';
const DN11={sky:null,dawn:null,ay:null,yuz:null,yuzM:null,serit:[],serFx:[],chunks:new Map(),prep:0,fx:{},renk:0,sabah:0,fin:0,
 finT:null,dorukT:null,tamT:null,lit:[],kare:0,yap:null,ay11:{x:0,y:0,r:80,w:0,sx:0,sy:0,sr:80,ac:0},durumT:null,zeminKare:-9,
 yk:0,ykKare:-1,tab:null,ort:null,aynaSay:0,izDis:0,izX:undefined,onBos:null,onNes:null,pat:{},ayAniS:0};
const dn11Hash=v=>{const s=Math.sin(v*127.1+311.7)*43758.5453;return s-Math.floor(s);};   // sabit sözde rastgele (0..1)
const DN11_GAP0=609*T,DN11_GAP1=765*T,DN11_UST=-300,DN11_CW=768,DN11_CACHE=8;
// palet (sözleşme): gece mor-lacivert, ay gümüşü, inci ay, çilek, altın şamdan ışığı, pastel pembe, lila, az nane
const DN11_TOZ=['#cfe6ff','#eaf4ff','#d9c8ff','#c39bff','#ffe7a8','#ffb3d1','#a9c8ff','#9ff0d0'];
const DN11_KRIS=[['#c39bff','#e6d8ff','#7a5ac8'],['#9ff0d0','#e0fff4','#4aa890'],['#ffb3d1','#ffe4f0','#c8648e']];
const DN11_TAS={ana:'#8e84bc',ac:'#b4aadf',koyu:'#635a9a',derz:'#554c8a'};          // pastel ay taşı (şato)
const DN11_YAP={ana:'#3e6476',ac:'#5f8e98',koyu:'#2a4560',on:'#7ab0b0'};            // budanmış çalı (ay ışığında deniz yeşili)
const DN11_CATI=['#5a3f96','#6a4aa8','#4b3a8c','#7a4f9e'];
const dn11Cv=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c;};
const dn11Mix=(a,b,t)=>{const A=hex(a),B=hex(b);return '#'+[0,1,2].map(i=>Math.round(lerp(A[i],B[i],clamp(t,0,1))).toString(16).padStart(2,'0')).join('');};
const dn11Rgb=h=>{const a=hex(h);return a[0]+','+a[1]+','+a[2];};
function dn11Ready(){return W>0&&H>0&&S>0&&typeof cam!=='undefined'&&Number.isFinite(cam.x)&&Number.isFinite(cam.y);}
function dn11Glow(col,x,y,rx,ry,a){if(a<=.003)return;g.globalAlpha=a>1?1:a;g.drawImage(glow(col),x-rx,y-ry,rx*2,ry*2);g.globalAlpha=1;}
const dn11V=()=>typeof V11!=='undefined'&&V11?V11:null;
const DN11_YUZ=Float32Array.from({length:COLS},(_,i)=>topOf(i)*T);   // harita sabit: zemin yüzeyi sütun başına bir kez
function dn11Surface(x){if(x>=DN11_GAP0&&x<DN11_GAP1)return ROWS*T;return DN11_YUZ[clamp(Math.floor(x/T),0,COLS-1)];}
function dn11Bolge(x){const B=typeof BOLUM!=='undefined'&&BOLUM.bolgeler;if(B)for(let i=0;i<B.length;i++)if(x>=B[i].x0&&x<B[i].x1)return B[i].ad;return 'giris';}
function dn11Oda(x){return typeof bl11Oda==='function'?bl11Oda(x/T):null;}
function dn11Tavan(x){if(typeof BL11_TAV==='undefined')return NaN;const c=Math.floor(x/T);return c>=0&&c<COLS?BL11_TAV[c]:NaN;}
function dn11Yk(c,x,y,w,h,r){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);}
function dn11Yildiz5(c,x,y,r,ri){c.beginPath();for(let m=0;m<5;m++){const a=-1.571+m*1.2566;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.lineTo(x+Math.cos(a+.628)*ri,y+Math.sin(a+.628)*ri);}c.closePath();}
function dn11Hilal(c,x,y,r,yon){c.beginPath();c.arc(x,y,r,-Math.PI/2,Math.PI/2,yon<0);c.arc(x+r*.42*(yon<0?-1:1),y,r*.86,Math.PI/2,-Math.PI/2,yon>=0);c.closePath();}

// ════════ Işık durumu: aynalar / şato parçaları → yerel gümüş-altın ışık dalgası + genel renklenme; final → hepsi; tamam → sabah ════════
function dn11IsikEkle(x,y,col,uzak){
 if(!Number.isFinite(x))return;if(DN11.lit.length>=48)DN11.lit.shift();
 DN11.lit.push({x,y:Number.isFinite(y)?y:dn11Surface(x)-60,t:now,col:col||'#cfe6ff',r:uzak||1100});
}
function dn11OlayX(e){const o=e&&e.o;return e&&Number.isFinite(e.x)?e.x:o&&Number.isFinite(o.x)?o.x:(typeof P!=='undefined'?P.x:0);}
function dn11OlayY(e){const o=e&&e.o;return e&&Number.isFinite(e.y)?e.y:o&&Number.isFinite(o.y)?o.y:NaN;}
OLAY.on('aynaDondu',e=>{dn11IsikEkle(dn11OlayX(e),dn11OlayY(e)-150,'#cfe6ff',950);DN11.aynaSay++;});
OLAY.on('satoCanlan',e=>dn11IsikEkle(dn11OlayX(e),dn11OlayY(e)-40,'#ffe7a8',1250));
for(const ad of ['salonBitti','orgBitti','pastaBitti'])OLAY.on(ad,()=>dn11IsikEkle(typeof P!=='undefined'?P.x:0,NaN,'#ffd27a',1600));
OLAY.on('baloFinal',()=>{if(DN11.finT===null)DN11.finT=now;});
OLAY.on('baloDoruk',()=>{DN11.dorukT=now;});
OLAY.on('baloTamam',()=>{if(DN11.tamT===null)DN11.tamT=now;});
OLAY.on('inis',e=>{if(e&&Number.isFinite(e.x)&&Number.isFinite(e.y)&&(e.siddet||0)>.35)dn11Iz(e.x,e.y,'inis');});
function dn11Hedef(){
 const v=dn11V();if(!v)return 0;if(v.final)return 1;
 const a=Math.max(v.ayna||0,DN11.aynaSay)/Math.max(1,v.aynaTop||12),m=(v.salon?1:0)+(v.org?1:0)+(v.pasta?1:0);
 return clamp(.75*smooth(clamp(a,0,1))+.06*m+(v.ucus?.07:0),0,1);
}
function dn11Durum(){
 // süreye bağlı sönüm: 60/120 Hz aynı ışık geçişi; yinelenen zaman damgasında hareket yok
 const adim=DN11.durumT===null?0:clamp((now-DN11.durumT)*60,0,15);DN11.durumT=now;
 const v=dn11V();
 // ayna olayı kaçtıysa (test ya da kayıttan devam): dönmüş aynaları ışık kaynağına ekle
 if(v&&(v.ayna||0)>DN11.aynaSay){for(const o of NESNELER)if(o.tip==='ayAyna'&&o.donmus&&!DN11.lit.some(L=>Math.abs(L.x-o.x)<5))dn11IsikEkle(o.x,o.y-150,'#cfe6ff',950);DN11.aynaSay=v.ayna;}
 if(v&&v.final&&DN11.finT===null)DN11.finT=now;
 DN11.fin=DN11.finT===null?0:smooth(clamp((now-DN11.finT)/5,0,1));
 const hedef=Math.max(dn11Hedef(),DN11.fin);DN11.renk+=(hedef-DN11.renk)*(1-Math.pow(.975,adim));if(adim>0&&Math.abs(hedef-DN11.renk)<.002)DN11.renk=hedef;
 // sabah: doruktan sonra gün ağarır, 'baloTamam' ile tamamlanır (pembe-altın)
 let sb=0;if(DN11.tamT!==null)sb=smooth(clamp((now-DN11.tamT)/3,0,1));if(DN11.finT!==null)sb=Math.max(sb,smooth(clamp((now-DN11.finT-31)/5,0,1)));
 DN11.sabah=sb;
}
function dn11IsikOrani(){return clamp(DN11.renk,0,1);}
// yerel ışık 0..1: her ışık olayından saniyede 450 birim yayılan, menzilde duran yumuşak dalga (sütun başına karede bir kez)
const DN11_ISIK_C=new Float32Array(1024),DN11_ISIK_T=new Float64Array(1024).fill(-1);
function dn11Isik(x){
 const c=clamp(Math.floor(x/T),0,1023);if(DN11_ISIK_T[c]===now)return DN11_ISIK_C[c];DN11_ISIK_T[c]=now;
 let a=DN11.renk*.3;const xx=c*T+T/2;
 for(let i=0;i<DN11.lit.length;i++){const L=DN11.lit[i],age=now-L.t;if(age<0)continue;const reach=Math.min(age*450,L.r),v=clamp((reach-Math.abs(xx-L.x))/340,0,1);if(v>a)a=v;}
 if(DN11.fin>a)a=DN11.fin;return DN11_ISIK_C[c]=a;
}

// ════════ Önbellek sprite'ları ════════
function dn11FxArt(){
 const F=DN11.fx;if(F.hazir)return F;
 const yildiz=col=>{const cv=dn11Cv(32,32),c=cv.getContext('2d');const gr=c.createRadialGradient(16,16,0,16,16,9);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba('+dn11Rgb(col)+',0)');c.fillStyle=gr;c.fillRect(0,0,32,32);
  c.fillStyle='rgba(255,255,255,.95)';c.beginPath();c.moveTo(16,0);c.quadraticCurveTo(17,15,32,16);c.quadraticCurveTo(17,17,16,32);c.quadraticCurveTo(15,17,0,16);c.quadraticCurveTo(15,15,16,0);c.fill();
  c.globalCompositeOperation='source-atop';c.fillStyle='rgba('+dn11Rgb(col)+',.45)';c.fillRect(0,0,32,32);return cv;};
 F.parilti=yildiz('#eaf4ff');F.pariltiA=yildiz('#ffe0a0');F.pariltiP=yildiz('#ffc0dc');F.pariltiL=yildiz('#d9c8ff');
 const bant=(col,a)=>{const cv=dn11Cv(8,128),c=cv.getContext('2d'),gr=c.createLinearGradient(0,0,0,128),r=dn11Rgb(col);gr.addColorStop(0,'rgba('+r+',0)');gr.addColorStop(.55,'rgba('+r+','+(a*.6)+')');gr.addColorStop(1,'rgba('+r+','+a+')');c.fillStyle=gr;c.fillRect(0,0,8,128);return cv;};
 F.pus=[bant('#8a78c8',.8),bant('#b48ad0',.75),bant('#a9b8f0',.7)];
 const puf=(col,a)=>{const cv=dn11Cv(64,64),c=cv.getContext('2d'),gr=c.createRadialGradient(32,32,0,32,32,32),r=dn11Rgb(col);gr.addColorStop(0,'rgba('+r+','+a+')');gr.addColorStop(.5,'rgba('+r+','+(a*.5)+')');gr.addColorStop(1,'rgba('+r+',0)');c.fillStyle=gr;c.fillRect(0,0,64,64);return cv;};
 F.sis=puf('#b49ae6',.7);F.sisP=puf('#f0a8d8',.6);F.sisG=puf('#b8d0ff',.6);
 // gök bulutçukları: yumuşak lavanta, üst kenarı ay gümüşüyle aydınlık, altı düz
 const bulutYap=(w,h,sd,ust,alt,n)=>{const cv=dn11Cv(w,h),c=cv.getContext('2d'),R=rng(sd);
  for(let k=0;k<n;k++){const x=w*.12+R()*w*.76,y=h*.62+R()*h*.12-Math.sin((x-w*.12)/(w*.76)*Math.PI)*h*.26,r=h*(.2+R()*.22),gr=c.createRadialGradient(x,y-r*.35,2,x,y,r);
   gr.addColorStop(0,'rgba('+ust+',.62)');gr.addColorStop(.6,'rgba('+alt+',.34)');gr.addColorStop(1,'rgba('+alt+',0)');c.fillStyle=gr;c.beginPath();c.arc(x,y,r,0,6.283);c.fill();}
  c.globalCompositeOperation='destination-out';const gr=c.createLinearGradient(0,h*.72,0,h);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');c.fillStyle=gr;c.fillRect(0,h*.72,w,h*.28);return cv;};
 F.bulut=[0,1,2].map(v=>bulutYap(320,110,401+v*17,'226,226,252','150,138,210',9));
 // ayı örten bulut kümeleri (yoğun, alt kenarları gümüş astarlı)
 F.ayBulut=[0,1,2].map(v=>{const cv=bulutYap(520,220,733+v*29,'206,206,240','104,92,170',16),c=cv.getContext('2d'),R=rng(91+v);
  c.globalCompositeOperation='source-atop';for(let k=0;k<7;k++){const x=40+R()*440,y=40+R()*90;c.fillStyle='rgba(234,244,255,.16)';c.beginPath();c.ellipse(x,y,50+R()*50,10+R()*8,0,0,6.283);c.fill();}return cv;});
 // sis halkası (dn11Iz): yassı parlak halka
 F.iz=(()=>{const cv=dn11Cv(96,32),c=cv.getContext('2d');c.strokeStyle='rgba(234,244,255,.85)';c.lineWidth=2.4;c.beginPath();c.ellipse(48,16,44,13,0,0,6.283);c.stroke();
  c.strokeStyle='rgba(195,155,255,.35)';c.lineWidth=6;c.beginPath();c.ellipse(48,16,40,11,0,0,6.283);c.stroke();return cv;})();
 // yanan pencere camı (yuvarlak / kemer): altın, ortası açık
 F.cam={};for(const st of ['kemer','yuvarlak']){const cv=dn11Cv(64,80),c=cv.getContext('2d'),w=64,h=st==='yuvarlak'?64:80,x=32,y=h/2;
  const gr=c.createRadialGradient(x-6,y+4,2,x,y,h*.62);gr.addColorStop(0,'#fff4c8');gr.addColorStop(.45,'#ffd27a');gr.addColorStop(1,'#e89a5a');c.fillStyle=gr;c.beginPath();
  if(st==='yuvarlak')c.ellipse(x,y,w/2,h/2,0,0,6.283);else{c.moveTo(0,h);c.lineTo(0,w/2);c.arc(x,w/2,w/2,Math.PI,0);c.lineTo(w,h);c.closePath();}c.fill();
  c.strokeStyle='rgba(150,90,70,.55)';c.lineWidth=4;c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.moveTo(0,st==='yuvarlak'?y:h*.58);c.lineTo(w,st==='yuvarlak'?y:h*.58);c.stroke();cv.h2=h;F.cam[st]=cv;}
 // ay ışığı huzmesi (pencereden yere süzülen gümüş ışık): üstte parlak, aşağıda sönen yamuk
 F.isin=(()=>{const cv=dn11Cv(64,256),c=cv.getContext('2d'),gr=c.createLinearGradient(0,0,0,256);gr.addColorStop(0,'rgba(207,230,255,.55)');gr.addColorStop(.6,'rgba(169,200,255,.18)');gr.addColorStop(1,'rgba(169,200,255,0)');
  c.fillStyle=gr;c.beginPath();c.moveTo(20,0);c.lineTo(44,0);c.lineTo(64,256);c.lineTo(0,256);c.closePath();c.fill();return cv;})();
 // süs ipi bayrakçıkları: yarasa (lila top), yıldız, çilek, hilal — pastel
 F.bayrak={};
 for(const tur of ['yarasa','yildiz','cilek']){F.bayrak[tur]=[0,1,2,3].map(k=>{const cv=dn11Cv(40,44),c=cv.getContext('2d');c.translate(20,4);
  const col=['#c39bff','#ffb3d1','#a9c8ff','#9ff0d0'][k];c.fillStyle=dn11Mix(col,'#2a2158',.25);c.beginPath();c.moveTo(-14,0);c.lineTo(14,0);c.lineTo(14,20);c.quadraticCurveTo(0,38,-14,20);c.closePath();c.fill();
  c.fillStyle='rgba(255,255,255,.22)';c.fillRect(-14,0,28,3);c.translate(0,15);
  if(tur==='yarasa'){c.fillStyle='#7a5ab0';c.beginPath();c.moveTo(-12,-2);c.quadraticCurveTo(-8,-8,-4,-2);c.quadraticCurveTo(0,-5,4,-2);c.quadraticCurveTo(8,-8,12,-2);c.quadraticCurveTo(8,4,0,4);c.quadraticCurveTo(-8,4,-12,-2);c.fill();c.beginPath();c.arc(0,0,4.6,0,6.283);c.fill();
   c.fillStyle='#fff';c.beginPath();c.arc(-1.7,-.6,1.4,0,6.283);c.arc(1.7,-.6,1.4,0,6.283);c.fill();c.fillStyle='#ff9ac0';c.beginPath();c.arc(-3,1.4,1,0,6.283);c.arc(3,1.4,1,0,6.283);c.fill();}
  else if(tur==='yildiz'){c.fillStyle=k%2?'#ffe7a8':'#eaf4ff';dn11Yildiz5(c,0,0,7,3);c.fill();}
  else{c.fillStyle='#ff4f7a';c.beginPath();c.moveTo(0,6);c.quadraticCurveTo(-7,1,-5,-4);c.quadraticCurveTo(0,-7,5,-4);c.quadraticCurveTo(7,1,0,6);c.fill();c.fillStyle='#5aa86a';c.beginPath();c.ellipse(-2,-5,3,1.4,-.4,0,6.283);c.ellipse(2,-5,3,1.4,.4,0,6.283);c.fill();c.fillStyle='#ffe7a8';for(const [a,b] of [[-2,-1],[2,0],[0,2]])c.fillRect(a,b,1,1);}
  return cv;});}
 // yıldız ışık topu (ay ışığı "alevi" — alev değil): beyaz çekirdek, gümüş hâle
 F.top=(()=>{const cv=dn11Cv(32,32),c=cv.getContext('2d'),gr=c.createRadialGradient(13,13,1,16,16,15);gr.addColorStop(0,'#ffffff');gr.addColorStop(.4,'#eaf4ff');gr.addColorStop(.75,'rgba(169,200,255,.75)');gr.addColorStop(1,'rgba(169,200,255,0)');c.fillStyle=gr;c.fillRect(0,0,32,32);return cv;})();
 // vinyet: mor köşeler (yalnız kenar parçaları çizilir)
 F.vig=(()=>{const cv=dn11Cv(200,160),v=cv.getContext('2d'),vg=v.createRadialGradient(100,74,48,100,74,126);vg.addColorStop(0,'rgba(18,12,46,0)');vg.addColorStop(.45,'rgba(18,12,46,0)');vg.addColorStop(.6,'rgba(18,12,46,.04)');vg.addColorStop(1,'rgba(18,12,46,.42)');v.fillStyle=vg;v.fillRect(0,0,200,160);return cv;})();
 F.sabahOrtu=(()=>{const cv=dn11Cv(8,128),c=cv.getContext('2d'),gr=c.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(255,214,190,0)');gr.addColorStop(.4,'rgba(255,200,186,.7)');gr.addColorStop(1,'rgba(250,186,190,.9)');c.fillStyle=gr;c.fillRect(0,0,8,128);return cv;})();
 F.hazir=true;return F;
}
// desen karoları (zemin parçalarında createPattern ile; dünya koordinatına hizalı, dikişsiz)
function dn11Karo(ad){
 const P=DN11.pat;if(P[ad])return P[ad];let cv;
 if(ad==='tas'||ad==='tasK'){   // şato taşı: yuvarlak köşeli bloklar (tasK: temel, daha koyu)
  const K=ad==='tas'?DN11_TAS:{ana:'#5e5490',ac:'#7a70ac',koyu:'#463e78',derz:'#3a3268'};cv=dn11Cv(160,80);const c=cv.getContext('2d'),R=rng(ad==='tas'?71:73);
  c.fillStyle=K.derz;c.fillRect(0,0,160,80);
  for(let r=0;r<4;r++)for(let k=-1;k<5;k++){const x=k*40+(r%2?20:0)+1.5,y=r*20+1.5;c.fillStyle=dn11Mix(K.ana,R()<.5?K.ac:K.koyu,.1+R()*.25);dn11Yk(c,x,y,37,17,6);c.fill();
   c.fillStyle='rgba(255,250,255,.13)';dn11Yk(c,x+3,y+2,30,3,2);c.fill();c.fillStyle='rgba(30,20,60,.12)';dn11Yk(c,x+3,y+13,30,3,2);c.fill();}
 } else if(ad==='kaya'){   // mağara kayası: yuvarlak yumrular
  cv=dn11Cv(160,160);const c=cv.getContext('2d'),R=rng(77);c.fillStyle='#3a2e62';c.fillRect(0,0,160,160);
  for(let k=0;k<26;k++){const x=R()*160,y=R()*160,r=10+R()*26;for(const [dx,dy] of [[0,0],[160,0],[-160,0],[0,160],[0,-160]]){c.fillStyle=k%3?'#43366e':'#4d3f7c';c.beginPath();c.ellipse(x+dx,y+dy,r*1.2,r,0,0,6.283);c.fill();c.fillStyle='rgba(200,180,255,.07)';c.beginPath();c.ellipse(x+dx-r*.2,y+dy-r*.35,r*.7,r*.35,0,0,6.283);c.fill();}}
 } else if(ad==='salon'){   // lila duvar kâğıdı: gümüş hilaller ve noktalar, ince baklava çizgileri
  cv=dn11Cv(64,64);const c=cv.getContext('2d');c.fillStyle='#6e62a8';c.fillRect(0,0,64,64);
  c.strokeStyle='rgba(217,200,255,.16)';c.lineWidth=1.2;c.beginPath();c.moveTo(0,32);c.lineTo(32,0);c.lineTo(64,32);c.lineTo(32,64);c.closePath();c.stroke();
  c.fillStyle='rgba(234,244,255,.34)';dn11Hilal(c,30,32,7,1);c.fill();c.fillStyle='rgba(255,231,168,.3)';for(const [x,y] of [[0,0],[64,0],[0,64],[64,64]]){c.beginPath();c.arc(x,y,2.4,0,6.283);c.fill();}
 } else if(ad==='org'){   // gece mavisi, altın yıldızlar (yıldızlı tavan)
  cv=dn11Cv(96,96);const c=cv.getContext('2d'),R=rng(91);c.fillStyle='#3a3070';c.fillRect(0,0,96,96);
  for(let k=0;k<5;k++){c.fillStyle=k%2?'rgba(255,210,122,.5)':'rgba(234,244,255,.35)';dn11Yildiz5(c,10+R()*76,10+R()*76,2.5+R()*3,1.2+R());c.fill();}
  for(let k=0;k<14;k++){c.fillStyle='rgba(234,244,255,.25)';c.fillRect(R()*96,R()*96,1.2,1.2);}
 } else if(ad==='galeri'){   // kadife erik: dikey çizgiler, aralarda minik kalp ve yarasa
  cv=dn11Cv(48,96);const c=cv.getContext('2d');c.fillStyle='#6a3a72';c.fillRect(0,0,48,96);c.fillStyle='#74427e';c.fillRect(0,0,24,96);
  c.fillStyle='rgba(255,179,209,.22)';c.beginPath();c.moveTo(12,30);c.bezierCurveTo(4,24,6,16,12,20);c.bezierCurveTo(18,16,20,24,12,30);c.fill();
  c.fillStyle='rgba(217,200,255,.2)';c.beginPath();c.arc(36,74,3.4,0,6.283);c.fill();c.beginPath();c.moveTo(29,73);c.quadraticCurveTo(32,68,34,73);c.moveTo(43,73);c.quadraticCurveTo(40,68,38,73);c.fill();
  c.fillStyle='rgba(255,231,168,.18)';c.fillRect(23.5,0,1,96);
 } else if(ad==='mutfak'){   // pastel karo, beyaz derz
  cv=dn11Cv(36,36);const c=cv.getContext('2d');c.fillStyle='#e8c8dc';c.fillRect(0,0,36,36);c.fillStyle='#d8a8c8';dn11Yk(c,1.5,1.5,33,33,6);c.fill();c.fillStyle='rgba(255,255,255,.2)';dn11Yk(c,5,4,16,4,2);c.fill();c.fillStyle='rgba(255,79,122,.18)';c.beginPath();c.arc(18,20,3,0,6.283);c.fill();
 } else if(ad==='balo'){   // balo salonu mermeri (sütun arası alçak duvar)
  cv=dn11Cv(80,80);const c=cv.getContext('2d'),R=rng(97);c.fillStyle='#b8b0e0';c.fillRect(0,0,80,80);c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=1;
  for(let k=0;k<5;k++){c.beginPath();let x=R()*80,y=0;c.moveTo(x,y);while(y<80){x+=(R()-.5)*14;y+=8+R()*8;c.lineTo(x,y);}c.stroke();}
 }
 P[ad]=cv;return cv;
}

// ════════ Gök: gece (mor-lacivert, yıldızlar, gümüş-mavi ay ışıması) ve sabah (pembe-altın) ════════
function dn11Sky(){
 if(DN11.sky)return;const R=rng(1111);
 let cv=DN11.sky=dn11Cv(768,600),c=cv.getContext('2d'),gr=c.createLinearGradient(0,0,0,600);
 gr.addColorStop(0,'#0c0b34');gr.addColorStop(.24,'#15195a');gr.addColorStop(.48,'#22267c');gr.addColorStop(.7,'#3a359e');gr.addColorStop(.86,'#5a48b8');gr.addColorStop(1,'#8e6ad0');c.fillStyle=gr;c.fillRect(0,0,768,600);
 // ay tarafında gümüş-mavi ışıma, ufukta pembe-lila
 let h=c.createRadialGradient(600,110,10,600,110,420);h.addColorStop(0,'rgba(169,200,255,.2)');h.addColorStop(.5,'rgba(140,150,230,.08)');h.addColorStop(1,'rgba(140,150,230,0)');c.fillStyle=h;c.fillRect(0,0,768,600);
 h=c.createRadialGradient(330,660,20,330,660,430);h.addColorStop(0,'rgba(255,170,210,.2)');h.addColorStop(.5,'rgba(195,155,255,.1)');h.addColorStop(1,'rgba(195,155,255,0)');c.fillStyle=h;c.fillRect(0,0,768,600);
 for(let j=0;j<24;j++){const x=R()*768,y=60+R()*360,r=50+R()*110;h=c.createRadialGradient(x,y,1,x,y,r);const col=j%3===0?'120,100,200':j%3===1?'80,70,170':'150,110,200';h.addColorStop(0,'rgba('+col+','+(.05+R()*.05)+')');h.addColorStop(1,'rgba('+col+',0)');c.fillStyle=h;c.fillRect(x-r,y-r,r*2,r*2);}
 // suluboya fırça izleri ve kâğıt dokusu
 for(let j=0;j<22;j++){const y=120+R()*320,x=R()*768,w=80+R()*220,hh=3+R()*8;c.fillStyle=j%3?'rgba(220,210,255,.04)':'rgba(30,20,80,.08)';c.beginPath();c.ellipse(x,y,w,hh,-.02,0,6.283);c.fill();}
 for(let j=0;j<7000;j++){c.fillStyle=j%2?'rgba(236,236,255,.018)':'rgba(12,8,40,.02)';c.fillRect(R()*768,R()*600,.8+R(),.6+R());}
 // sabit yıldızlar: çok sayıda minik (üstte yoğun), birkaç iri renkli
 {c.save();c.translate(384,170);c.rotate(-.32);for(let j=0;j<60;j++){const x=(R()-.5)*900,y=(R()-.5)*70,r=30+R()*60,q=c.createRadialGradient(x,y,1,x,y,r);q.addColorStop(0,j%2?'rgba(190,170,255,.07)':'rgba(150,190,255,.07)');q.addColorStop(1,'rgba(170,180,255,0)');c.fillStyle=q;c.fillRect(x-r,y-r,r*2,r*2);}
  for(let j=0;j<260;j++){const x=(R()-.5)*900,y=(R()-.5)*(R()*110);c.fillStyle='rgba(244,246,255,'+(.25+R()*.5)+')';c.beginPath();c.arc(x,y,.3+R()*.6,0,6.283);c.fill();}c.restore();}
 for(let j=0;j<520;j++){const x=R()*768,y=R()*R()*500,s=.35+R()*.85;c.fillStyle='rgba(244,247,255,'+(.3+R()*.6)+')';c.beginPath();c.arc(x,y,s,0,6.283);c.fill();}
 for(let j=0;j<44;j++){const x=R()*768,y=R()*380,s=1.1+R()*1.1,col=['255,231,168','220,238,255','226,210,255'][j%3];let q=c.createRadialGradient(x,y,0,x,y,s*5);q.addColorStop(0,'rgba('+col+',.4)');q.addColorStop(1,'rgba('+col+',0)');c.fillStyle=q;c.fillRect(x-s*5,y-s*5,s*10,s*10);
  c.fillStyle='rgba('+col+',.95)';c.beginPath();c.arc(x,y,s,0,6.283);c.fill();if(j%3===0){c.strokeStyle='rgba('+col+',.7)';c.lineWidth=.7;c.beginPath();c.moveTo(x-s*4.5,y);c.lineTo(x+s*4.5,y);c.moveTo(x,y-s*4.5);c.lineTo(x,y+s*4.5);c.stroke();}}
 // sabah: lavanta tepe, pembe orta, altın ufuk
 cv=DN11.dawn=dn11Cv(768,600);c=cv.getContext('2d');gr=c.createLinearGradient(0,0,0,600);
 gr.addColorStop(0,'#6a70c8');gr.addColorStop(.3,'#a896dc');gr.addColorStop(.56,'#f2a8c8');gr.addColorStop(.8,'#ffcaa8');gr.addColorStop(1,'#fff0c8');c.fillStyle=gr;c.fillRect(0,0,768,600);
 h=c.createRadialGradient(480,560,10,480,560,420);h.addColorStop(0,'rgba(255,246,214,.85)');h.addColorStop(.3,'rgba(255,214,170,.32)');h.addColorStop(1,'rgba(255,214,170,0)');c.fillStyle=h;c.fillRect(0,0,768,600);
 for(let j=0;j<20;j++){const y=140+R()*300,x=R()*768,w=90+R()*220,hh=4+R()*9;c.fillStyle=j%2?'rgba(255,255,255,.16)':'rgba(255,210,230,.15)';c.beginPath();c.ellipse(x,y,w,hh,-.02,0,6.283);c.fill();}
}
const dn11SR=rng(1717),DN11_STARS=Array.from({length:46},(_,i)=>({x:dn11SR(),y:dn11SR()*dn11SR()*.62,r:.5+dn11SR()*1.3,ph:dn11SR()*6.283,sp:.5+dn11SR()*1.6,col:['#eaf4ff','#ffe7a8','#d9c8ff','#cfe6ff'][i%4],yil:i%5===0}));

// ════════ Ay: kocaman inci ay — disk + iki yüz (uykulu / gülen) ayrı tuvallerde; bulutlar önünden dağılır ════════
const DN11_AYR=256;
function dn11AyArt(){
 if(DN11.ay)return;const n=DN11_AYR*2+32,R=DN11_AYR,Q=rng(1313);
 {const cv=DN11.ay=dn11Cv(n,n),c=cv.getContext('2d'),m=n/2;
  let gr=c.createRadialGradient(m-R*.35,m-R*.4,R*.05,m,m,R);gr.addColorStop(0,'#fffdf2');gr.addColorStop(.5,'#fff4d6');gr.addColorStop(.88,'#f4e2c0');gr.addColorStop(1,'#e2d0c8');
  c.fillStyle=gr;c.beginPath();c.arc(m,m,R,0,6.283);c.fill();
  c.save();c.beginPath();c.arc(m,m,R,0,6.283);c.clip();
  for(const [x,y,r] of [[-.45,-.48,.19],[.36,-.56,.13],[.56,.12,.16],[-.62,.28,.12],[.1,.7,.1],[-.2,-.8,.08],[.7,-.3,.07]]){c.fillStyle='rgba(200,180,210,.16)';c.beginPath();c.ellipse(m+x*R,m+y*R,r*R,r*R*.85,0,0,6.283);c.fill();c.fillStyle='rgba(255,252,240,.35)';c.beginPath();c.ellipse(m+x*R-r*R*.2,m+y*R-r*R*.25,r*R*.6,r*R*.35,0,0,6.283);c.fill();}
  for(let j=0;j<500;j++){c.fillStyle=j%2?'rgba(255,255,250,.06)':'rgba(190,170,200,.05)';c.beginPath();c.arc(m+(Q()-.5)*2*R,m+(Q()-.5)*2*R,1+Q()*3,0,6.283);c.fill();}
  gr=c.createRadialGradient(m-R*.25,m-R*.3,R*.7,m-R*.1,m-R*.12,R*1.25);gr.addColorStop(0,'rgba(169,180,255,0)');gr.addColorStop(1,'rgba(160,160,240,.32)');c.fillStyle=gr;c.fillRect(0,0,n,n);
  c.restore();c.strokeStyle='rgba(255,255,250,.6)';c.lineWidth=5;c.beginPath();c.arc(m,m,R-4,Math.PI*.95,Math.PI*1.65);c.stroke();
  c.strokeStyle='rgba(255,250,228,.95)';c.lineWidth=4;c.beginPath();c.arc(m,m,R-2,0,6.283);c.stroke();}
 // yüzler: tuvalin (fw×fh) kökü (fw/2, kok) ay merkezine oturur. Uykulu: aşağı kavisli kapalı gözler + minik gülümseme;
 // gülen: mutlu ^ ^ gözler, pembe yanaklar, açık gülümseme. İri koyu göz YOK (yarısı bulutluyken ürkütücü okunmasın).
 const yuz=mutlu=>{const fw=Math.ceil(R*1.5),fh=Math.ceil(R*.72),cv=dn11Cv(fw,fh),c=cv.getContext('2d'),m=fw/2,o=R*.3;cv.kok=o;
  const ey=o-R*.12,ex=R*.3,my=o+R*.1;let gr;
  for(const s of [-1,1]){gr=c.createRadialGradient(m+s*R*.48,my,2,m+s*R*.48,my,R*.2);gr.addColorStop(0,'rgba(255,140,170,'+(mutlu?.55:.35)+')');gr.addColorStop(1,'rgba(255,140,170,0)');c.fillStyle=gr;c.beginPath();c.ellipse(m+s*R*.48,my,R*.21,R*.15,0,0,6.283);c.fill();}
  c.lineCap='round';c.strokeStyle='#7a5a8a';c.lineWidth=R*.04;
  for(const s of [-1,1]){const x=m+s*ex;c.beginPath();if(mutlu)c.arc(x,ey+R*.05,R*.09,Math.PI*1.12,Math.PI*1.88);else c.arc(x,ey-R*.04,R*.09,Math.PI*.15,Math.PI*.85);c.stroke();}
  if(mutlu){c.fillStyle='#9a4a6a';c.beginPath();c.moveTo(m-R*.17,my);c.quadraticCurveTo(m,my+R*.25,m+R*.17,my);c.quadraticCurveTo(m,my+R*.07,m-R*.17,my);c.fill();c.fillStyle='#ff9ab8';c.beginPath();c.ellipse(m+R*.01,my+R*.12,R*.07,R*.04,0,0,6.283);c.fill();}
  else{c.lineWidth=R*.03;c.beginPath();c.arc(m,my-R*.06,R*.08,Math.PI*.2,Math.PI*.8);c.stroke();}
  return cv;};
 DN11.yuz=yuz(false);DN11.yuzM=yuz(true);
}

// ════════ Ortak ressamlar (önbellek tuvallerinde bir kez) ════════
// eğri kule külahı: tabanı (x, y) genişliği w, yüksekliği h; ucu hafif kıvrık, ucunda yuvarlak top / hilal; çizgili
function dn11Kulah(c,x,y,w,h,col,R,uc,duz){
 const bk0=(R()-.5)*.5,bk=duz?0:bk0,ux=x+w*bk*.6,uy=y-h;
 c.fillStyle=col;c.beginPath();c.moveTo(x-w/2-8,y+4);c.quadraticCurveTo(x-w*.42,y-h*.35,x-w*.1+bk*w*.2,y-h*.72);c.quadraticCurveTo(ux-w*.04,uy+h*.08,ux,uy);
 c.quadraticCurveTo(ux+w*.06,uy+h*.1,x+w*.12+bk*w*.2,y-h*.7);c.quadraticCurveTo(x+w*.42,y-h*.35,x+w/2+8,y+4);c.quadraticCurveTo(x,y+12,x-w/2-8,y+4);c.fill();
 c.save();c.clip();c.strokeStyle=dn11Mix(col,'#ffb3d1',.3);c.globalAlpha=.35;c.lineWidth=w*.07;for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(x+k*w*.22,y+8);c.quadraticCurveTo(x+k*w*.12,y-h*.5,ux,uy);c.stroke();}c.globalAlpha=1;
 c.fillStyle='rgba(234,244,255,.16)';c.beginPath();c.moveTo(x-w/2-8,y+4);c.quadraticCurveTo(x-w*.42,y-h*.35,x-w*.1,y-h*.72);c.lineTo(x-w*.18,y+4);c.fill();c.restore();
 c.fillStyle=dn11Mix(col,'#140a30',.35);c.beginPath();c.ellipse(x,y+4,w/2+9,7,0,0,Math.PI);c.fill();
 if(uc==='hilal'){c.fillStyle='#ffe7a8';dn11Hilal(c,ux+2,uy-12,9,1);c.fill();}
 else if(uc!=='yok'){c.fillStyle='#ffe7a8';c.beginPath();c.arc(ux,uy-4,5,0,6.283);c.fill();}
 return {x:ux,y:uy};
}
// yuvarlak mazgallar (burç): x0..x1 boyunca, üst y; yumuşak, sivri değil
function dn11Mazgal(c,x0,x1,y,col,ac){
 c.fillStyle=col;c.fillRect(x0,y,x1-x0,14);const n=Math.max(1,Math.round((x1-x0)/34)),w=(x1-x0)/n;
 for(let k=0;k<n;k++){const xx=x0+k*w+w*.14,ww=w*.72;c.fillStyle=col;dn11Yk(c,xx,y-20,ww,26,[10,10,0,0]);c.fill();c.fillStyle=ac;dn11Yk(c,xx+3,y-18,ww*.4,5,3);c.fill();}
}
// dış pencere (yuvarlak / kemer): krem çerçeve, koyu cam (karede yanar) → Y.pen
function dn11Pencere(c,x,y,w,h,st,Y,R){
 const yol=(ww,hh)=>{c.beginPath();if(st==='yuvarlak')c.ellipse(x,y,ww/2,hh/2,0,0,6.283);else{c.moveTo(x-ww/2,y+hh/2);c.lineTo(x-ww/2,y-hh/2+ww/2);c.arc(x,y-hh/2+ww/2,ww/2,Math.PI,0);c.lineTo(x+ww/2,y+hh/2);c.closePath();}};
 c.fillStyle='#e8dcf4';yol(w+8,h+8);c.fill();c.fillStyle='#3a3060';yol(w,h);c.fill();c.fillStyle='rgba(169,200,255,.14)';c.fillRect(x-w/2,y-h/2,w*.4,h*.5);
 c.strokeStyle='#e8dcf4';c.lineWidth=2.4;c.beginPath();c.moveTo(x,y-h/2);c.lineTo(x,y+h/2);c.moveTo(x-w/2,st==='yuvarlak'?y:y+h*.08);c.lineTo(x+w/2,st==='yuvarlak'?y:y+h*.08);c.stroke();
 if(st!=='yuvarlak'){c.fillStyle='#8a7ab8';c.fillRect(x-w/2-6,y+h/2+2,w+12,6);}
 if(Y)Y.pen.push({x,y,w,h,st,th:R(),ph:R()*6.283});
}
// budanmış çalı (saksıda): 'top' yuvarlak, 'kalp', 'ay' hilal, 'yarasa' (tombul gövde + yuvarlak kanatlar + kulak) — yaprak dokulu
function dn11CaliYol(b,s){
 const p=new Path2D();
 if(b==='kalp'){p.moveTo(0,-8*s);p.bezierCurveTo(-8*s,-34*s,-46*s,-30*s,-40*s,-2*s);p.bezierCurveTo(-34*s,22*s,-6*s,30*s,0,44*s);p.bezierCurveTo(6*s,30*s,34*s,22*s,40*s,-2*s);p.bezierCurveTo(46*s,-30*s,8*s,-34*s,0,-8*s);p.closePath();}
 else if(b==='ay'){p.arc(0,8*s,34*s,-Math.PI*.62,Math.PI*.62,true);p.bezierCurveTo(-6*s,34*s,-22*s,14*s,-18*s,-6*s);p.bezierCurveTo(-14*s,-22*s,4*s,-26*s,10*s,-21*s);p.closePath();}
 else if(b==='yarasa'){p.arc(0,8*s,20*s,0,6.283);p.moveTo(-14*s,0);p.quadraticCurveTo(-30*s,-26*s,-58*s,-10*s);p.quadraticCurveTo(-50*s,4*s,-56*s,18*s);p.quadraticCurveTo(-40*s,10*s,-36*s,24*s);p.quadraticCurveTo(-24*s,14*s,-14*s,20*s);p.closePath();
  p.moveTo(14*s,0);p.quadraticCurveTo(30*s,-26*s,58*s,-10*s);p.quadraticCurveTo(50*s,4*s,56*s,18*s);p.quadraticCurveTo(40*s,10*s,36*s,24*s);p.quadraticCurveTo(24*s,14*s,14*s,20*s);p.closePath();
  p.moveTo(-14*s,-6*s);p.quadraticCurveTo(-14*s,-24*s,-6*s,-14*s);p.lineTo(-10*s,-4*s);p.closePath();p.moveTo(14*s,-6*s);p.quadraticCurveTo(14*s,-24*s,6*s,-14*s);p.lineTo(10*s,-4*s);p.closePath();}
 else p.arc(0,6*s,32*s,0,6.283);
 return p;
}
function dn11Yaprak(c,yol,bx,by,w,h,R,K){
 c.save();c.clip(yol);c.fillStyle=K.ana;c.fillRect(bx-w,by-h,w*2,h*2);
 for(let k=0;k<w*h/90;k++){const x=bx+(R()-.5)*w*2,y=by+(R()-.5)*h*2,r=4+R()*5;c.fillStyle=y<by-h*.2&&x<bx?K.ac:R()<.5?K.koyu:dn11Mix(K.ana,K.ac,.4);c.beginPath();c.arc(x,y,r,0,6.283);c.fill();}
 c.fillStyle='rgba(234,244,255,.13)';c.beginPath();c.ellipse(bx-w*.3,by-h*.45,w*.5,h*.3,-.3,0,6.283);c.fill();
 c.fillStyle='rgba(20,16,50,.22)';c.beginPath();c.ellipse(bx+w*.25,by+h*.5,w*.7,h*.35,0,0,6.283);c.fill();c.restore();
}
function dn11Cali(c,x,base,s,b,R){
 // saksı (pastel pembe taş), kısa gövde, biçimli çalı
 c.fillStyle='rgba(18,12,46,.35)';c.beginPath();c.ellipse(x,base,30*s,6*s,0,0,6.283);c.fill();
 c.fillStyle='#b88aac';c.beginPath();c.moveTo(x-20*s,base-30*s);c.lineTo(x+20*s,base-30*s);c.lineTo(x+15*s,base);c.lineTo(x-15*s,base);c.closePath();c.fill();
 c.fillStyle='#d4a8c4';dn11Yk(c,x-23*s,base-36*s,46*s,9*s,4*s);c.fill();c.fillStyle='rgba(60,30,70,.25)';c.fillRect(x+4*s,base-27*s,9*s,25*s);
 c.fillStyle='#5a4a5a';c.fillRect(x-3*s,base-62*s,6*s,28*s);
 const cy=base-(b==='yarasa'?92:b==='kalp'?100:96)*s,yol=dn11CaliYol(b,s);c.save();c.translate(x,cy);
 dn11Yaprak(c,yol,0,0,62*s,50*s,R,DN11_YAP);
 if(b==='yarasa'){c.fillStyle='rgba(234,244,255,.55)';c.beginPath();c.arc(-7*s,6*s,3*s,0,6.283);c.arc(7*s,6*s,3*s,0,6.283);c.fill();}
 c.restore();
}
// lolipop ağaç: ince gövde + üst üste 2-3 budanmış top (ay ışığında mavi-mor yapraklar)
const DN11_AGK=[{ana:'#3e6476',ac:'#5f8e98',koyu:'#2a4560'},{ana:'#4a4e8a',ac:'#6c72b0',koyu:'#33346a'},{ana:'#5a4682',ac:'#7c66a8',koyu:'#3e2e62'}];
function dn11Agac(c,x,base,s,ci,R){
 const K=DN11_AGK[ci%3],h=230*s;c.fillStyle='rgba(18,12,46,.35)';c.beginPath();c.ellipse(x,base,40*s,8*s,0,0,6.283);c.fill();
 c.strokeStyle='#4a3a5a';c.lineWidth=9*s;c.lineCap='round';c.beginPath();c.moveTo(x,base);c.quadraticCurveTo(x+8*s,base-h*.5,x,base-h*.86);c.stroke();
 c.strokeStyle='rgba(200,180,230,.25)';c.lineWidth=3*s;c.beginPath();c.moveTo(x-2*s,base-4);c.quadraticCurveTo(x+5*s,base-h*.5,x-2*s,base-h*.8);c.stroke();
 const toplar=[[0,-h*.42,42*s],[0,-h*.86,56*s]];if(R()<.6)toplar.splice(1,0,[0,-h*.64,30*s]);
 for(const [dx,dy,r] of toplar){const p=new Path2D();p.arc(0,0,r,0,6.283);c.save();c.translate(x+dx,base+dy);dn11Yaprak(c,p,0,0,r,r,R,K);c.restore();}
}
// bahçe lambası: kıvrık demir direk (pastel), yuvarlak cam fener, içinde ay ışığı topu → Y.orb
function dn11Lamba(c,x,base,s,Y){
 const h=150*s;c.strokeStyle='#4e4672';c.lineWidth=6*s;c.lineCap='round';c.beginPath();c.moveTo(x,base);c.lineTo(x,base-h);c.stroke();
 c.fillStyle='#4e4672';dn11Yk(c,x-10*s,base-14*s,20*s,14*s,4);c.fill();
 c.lineWidth=2.4*s;c.beginPath();for(const sg of [-1,1]){c.moveTo(x,base-h*.7);c.quadraticCurveTo(x+sg*16*s,base-h*.74,x+sg*12*s,base-h*.62);}c.stroke();
 const ly=base-h-16*s;c.fillStyle='#4e4672';c.beginPath();c.moveTo(x-13*s,ly-14*s);c.quadraticCurveTo(x,ly-30*s,x+13*s,ly-14*s);c.fill();c.beginPath();c.arc(x,ly-30*s,3*s,0,6.283);c.fill();
 c.fillStyle='rgba(60,52,110,.85)';c.beginPath();c.arc(x,ly,13*s,0,6.283);c.fill();c.strokeStyle='#6a6098';c.lineWidth=2*s;c.stroke();
 c.fillStyle='rgba(207,230,255,.45)';c.beginPath();c.arc(x,ly,5*s,0,6.283);c.fill();
 if(Y)Y.orb.push({x,y:ly,r:13*s,ph:dn11Hash(x)*6.283});
}
// kristal kümesi: yuvarlak uçlu pastel taşlar (sivri değil), parlak kenar → Y.kris
function dn11Kristal(c,x,base,s,ci,R,Y,ters){
 const K=DN11_KRIS[ci%3],n=3+Math.floor(R()*3),yon=ters?-1:1;
 for(let k=0;k<n;k++){const a=(k-(n-1)/2)*.32+(R()-.5)*.2,h=(34+R()*46)*s*(k===Math.floor(n/2)?1.3:1),w=(10+R()*7)*s,bx=x+(k-(n-1)/2)*12*s;
  c.save();c.translate(bx,base);c.rotate(a*yon);c.scale(1,yon);
  c.fillStyle=dn11Mix(K[0],'#2a2158',.25);c.beginPath();c.moveTo(-w,2);c.lineTo(-w,-h+w*.9);c.quadraticCurveTo(-w*.6,-h-w*.2,0,-h-w*.35);c.quadraticCurveTo(w*.6,-h-w*.2,w,-h+w*.9);c.lineTo(w,2);c.closePath();c.fill();
  c.fillStyle=K[0];c.beginPath();c.moveTo(-w*.1,2);c.lineTo(-w*.1,-h-w*.3);c.quadraticCurveTo(w*.6,-h-w*.2,w,-h+w*.9);c.lineTo(w,2);c.closePath();c.fill();
  c.fillStyle=K[1];c.globalAlpha=.7;c.beginPath();c.moveTo(-w*.7,-6);c.lineTo(-w*.7,-h+w);c.quadraticCurveTo(-w*.5,-h,-w*.25,-h);c.lineTo(-w*.35,-6);c.closePath();c.fill();c.globalAlpha=1;
  c.restore();}
 c.fillStyle=dn11Mix(K[2],'#1a1440',.5);c.beginPath();c.ellipse(x,base+2,(n*7+10)*s,6*s,0,0,6.283);c.fill();
 if(Y)Y.kris.push({x,y:base-30*s*yon,r:50*s,col:K[0],ph:R()*6.283});
}
// tavandan sarkan kristal salkımı: kaya yumrusu + 2-3 ince, yuvarlak uçlu pastel taş → Y.kris
function dn11Sarkit(c,x,y,s,ci,R,Y){
 const K=DN11_KRIS[ci%3],n=2+Math.floor(R()*2);
 for(let k=0;k<n;k++){const bx=x+(k-(n-1)/2)*14*s,L=(30+R()*36)*s*(k===1?1.3:1),w=(6+R()*3)*s,a=(k-(n-1)/2)*.12;
  c.save();c.translate(bx,y);c.rotate(a);
  c.fillStyle=dn11Mix(K[0],'#2a2158',.3);c.beginPath();c.moveTo(-w,-4);c.lineTo(-w,L-w*1.4);c.quadraticCurveTo(-w*.4,L+w*.2,0,L+w*.4);c.quadraticCurveTo(w*.4,L+w*.2,w,L-w*1.4);c.lineTo(w,-4);c.closePath();c.fill();
  c.fillStyle=K[0];c.beginPath();c.moveTo(0,-4);c.lineTo(0,L+w*.3);c.quadraticCurveTo(w*.4,L+w*.2,w,L-w*1.4);c.lineTo(w,-4);c.closePath();c.fill();
  c.fillStyle=K[1];c.globalAlpha=.75;dn11Yk(c,-w*.65,2,w*.4,L-w*2,w*.2);c.fill();c.globalAlpha=1;c.restore();}
 c.fillStyle='#3a2e66';c.beginPath();c.ellipse(x,y-2,(n*8+8)*s,9*s,0,0,6.283);c.fill();
 if(Y)Y.kris.push({x,y:y+30*s,r:40*s,col:K[0],ph:R()*6.283});
}
// duvar şamdanı: altın kol + üç ay ışığı topu (alev değil) → Y.orb
function dn11Samdan(c,x,y,s,Y){
 c.strokeStyle='#d8b060';c.lineWidth=3*s;c.lineCap='round';c.fillStyle='#d8b060';
 dn11Yk(c,x-6*s,y-4*s,12*s,22*s,4*s);c.fill();
 c.beginPath();c.moveTo(x,y+8*s);c.quadraticCurveTo(x-24*s,y+10*s,x-24*s,y-6*s);c.moveTo(x,y+8*s);c.quadraticCurveTo(x+24*s,y+10*s,x+24*s,y-6*s);c.moveTo(x,y);c.lineTo(x,y-14*s);c.stroke();
 for(const [dx,dy] of [[-24,-6],[24,-6],[0,-14]]){c.fillStyle='#e8c878';dn11Yk(c,x+dx*s-5*s,y+dy*s-3*s,10*s,5*s,2);c.fill();c.fillStyle='rgba(234,244,255,.4)';c.beginPath();c.arc(x+dx*s,y+dy*s-9*s,5*s,0,6.283);c.fill();
  if(Y)Y.orb.push({x:x+dx*s,y:y+dy*s-9*s,r:9*s,ph:dn11Hash(x+dx)*6.283,ic:1});}
}
// avize: zincir, altın halka, kollar, ay ışığı topları, yuvarlak kristal damlalar → Y.orb + Y.avize
function dn11Avize(c,x,y0,y,s,Y){
 c.strokeStyle='#c8a060';c.lineWidth=2.4;c.beginPath();c.moveTo(x,y0);c.lineTo(x,y-30*s);c.stroke();
 for(let yy=y0+8;yy<y-30*s;yy+=12){c.strokeStyle='#d8b878';c.lineWidth=1.6;c.beginPath();c.ellipse(x,yy,2.4,4.6,0,0,6.283);c.stroke();}
 c.fillStyle='#d8b060';c.beginPath();c.ellipse(x,y,70*s,14*s,0,0,6.283);c.fill();c.fillStyle='#f0d898';c.beginPath();c.ellipse(x,y-3*s,64*s,9*s,0,0,6.283);c.fill();
 c.fillStyle='#d8b060';c.beginPath();c.moveTo(x-20*s,y);c.quadraticCurveTo(x,y-40*s,x+20*s,y);c.fill();c.beginPath();c.arc(x,y+18*s,8*s,0,6.283);c.fill();
 for(let k=0;k<7;k++){const u=(k+.5)/7,dx=(u-.5)*130*s,dy=-Math.sin(u*Math.PI)*6*s;c.fillStyle='#e8c878';dn11Yk(c,x+dx-4*s,y+dy-14*s,8*s,12*s,2);c.fill();
  c.fillStyle='rgba(234,244,255,.5)';c.beginPath();c.arc(x+dx,y+dy-20*s,5*s,0,6.283);c.fill();if(Y)Y.orb.push({x:x+dx,y:y+dy-20*s,r:9*s,ph:k*.9+x*.01,ic:1});
  c.fillStyle='rgba(217,200,255,.75)';c.beginPath();c.arc(x+dx,y+dy+12*s,3.2*s,0,6.283);c.fill();c.strokeStyle='rgba(216,176,96,.8)';c.lineWidth=1;c.beginPath();c.moveTo(x+dx,y+dy+3*s);c.lineTo(x+dx,y+dy+9*s);c.stroke();}
 if(Y)Y.avize.push({x,y,r:90*s});
}
// gülen aile portresi: altın oval çerçeve, içinde aile üyesi (vampirCiz; yoksa sade yüz)
function dn11Portre(c,x,y,w,h,kim,R){
 c.fillStyle='#b88a40';c.beginPath();c.ellipse(x,y,w/2+12,h/2+12,0,0,6.283);c.fill();c.fillStyle='#e8c070';c.beginPath();c.ellipse(x,y,w/2+8,h/2+8,0,0,6.283);c.fill();
 c.strokeStyle='#b88a40';c.lineWidth=2;for(let k=0;k<16;k++){const a=k/16*6.283;c.beginPath();c.arc(x+Math.cos(a)*(w/2+10),y+Math.sin(a)*(h/2+10),2.4,0,6.283);c.stroke();}
 c.save();c.beginPath();c.ellipse(x,y,w/2,h/2,0,0,6.283);c.clip();
 const fon=c.createLinearGradient(0,y-h/2,0,y+h/2);fon.addColorStop(0,'#4a5aa0');fon.addColorStop(1,'#2a2a6a');c.fillStyle=fon;c.fillRect(x-w/2,y-h/2,w,h);
 c.fillStyle='rgba(255,244,214,.5)';c.beginPath();c.arc(x+w*.26,y-h*.28,w*.1,0,6.283);c.fill();
 let ok=false;if(typeof vampirCiz==='function'){try{const vs=kim==='dede'?1.3:kim==='nine'?1.35:1.7;vampirCiz(c,kim,x,y+h*(kim==='kiz'?.95:.8),vs,0,{yon:1,poz:'dur',mutlu:1});ok=true;}catch(e){ok=false;}}
 if(!ok){c.fillStyle='#3a2c74';c.beginPath();c.ellipse(x,y+h*.42,w*.42,h*.3,0,0,6.283);c.fill();c.fillStyle='#ffe0d6';c.beginPath();c.arc(x,y,w*.24,0,6.283);c.fill();
  c.fillStyle=kim==='dede'?'#c9d2e8':'#3a2c74';c.beginPath();c.arc(x,y-w*.08,w*.25,Math.PI,0);c.fill();c.fillStyle='#ff9ab0';c.beginPath();c.arc(x-w*.12,y+w*.06,w*.05,0,6.283);c.arc(x+w*.12,y+w*.06,w*.05,0,6.283);c.fill();
  c.strokeStyle='#4a2a4a';c.lineWidth=2;c.beginPath();c.arc(x-w*.08,y-w*.02,w*.04,Math.PI*1.1,Math.PI*1.9);c.moveTo(x+w*.12,y-w*.02);c.arc(x+w*.08,y-w*.02,w*.04,Math.PI*1.1,Math.PI*1.9);c.moveTo(x-w*.07,y+w*.1);c.quadraticCurveTo(x,y+w*.16,x+w*.07,y+w*.1);c.stroke();}
 c.restore();
 c.fillStyle='rgba(255,255,255,.12)';c.beginPath();c.ellipse(x-w*.2,y-h*.25,w*.12,h*.2,-.4,0,6.283);c.fill();
}
// kadife perde (çift kanat, bağlı, üstte saçaklı korniş): x merkez, y0 korniş, y1 alt, w toplam genişlik
function dn11Perde(c,x,y0,y1,w,col){
 const koyu=dn11Mix(col,'#1a0a28',.4),ac=dn11Mix(col,'#ffd0e4',.25);
 for(const s of [-1,1]){const xo=x+s*w/2,xi=x+s*w*.12;c.fillStyle=col;c.beginPath();c.moveTo(xo,y0);c.lineTo(xi,y0);c.quadraticCurveTo(x+s*w*.3,y0+(y1-y0)*.5,xo-s*w*.06,y0+(y1-y0)*.62);c.quadraticCurveTo(xo-s*w*.1,y0+(y1-y0)*.8,xo+s*6,y1);c.lineTo(xo+s*14,y1);c.closePath();c.fill();
  c.strokeStyle=koyu;c.lineWidth=2.4;for(let k=1;k<4;k++){const u=k/4;c.beginPath();c.moveTo(lerp(xo,xi,u),y0);c.quadraticCurveTo(lerp(xo,x+s*w*.3,u),y0+(y1-y0)*.45,xo-s*w*.04*(1-u),y0+(y1-y0)*.62);c.stroke();}
  c.strokeStyle=ac;c.globalAlpha=.4;c.lineWidth=2;c.beginPath();c.moveTo(lerp(xo,xi,.15),y0);c.quadraticCurveTo(lerp(xo,x+s*w*.3,.15),y0+(y1-y0)*.45,xo,y0+(y1-y0)*.6);c.stroke();c.globalAlpha=1;
  c.fillStyle='#e8c070';dn11Yk(c,xo-s*w*.1-8,y0+(y1-y0)*.6-5,16,10,4);c.fill();}
 c.fillStyle=koyu;dn11Yk(c,x-w/2-12,y0-10,w+24,14,6);c.fill();c.fillStyle='#e8c070';c.fillRect(x-w/2-12,y0-12,w+24,4);
 c.fillStyle=col;for(let k=0;k<7;k++){const u=(k+.5)/7;c.beginPath();c.arc(x-w/2+u*w,y0+2,w/14,0,Math.PI);c.fill();}
}
// mutfak rafı: tahta raf + kavanozlar (çilek reçeli, şeker, yıldız bisküvi)
function dn11Raf(c,x,y,w,R){
 c.fillStyle='#7a5a7a';dn11Yk(c,x-w/2,y,w,10,4);c.fill();c.fillStyle='#9a7a9a';c.fillRect(x-w/2+3,y+1,w-6,3);
 for(const s of [-1,1]){c.fillStyle='#6a4a6a';c.beginPath();c.moveTo(x+s*w*.38,y+10);c.lineTo(x+s*w*.38,y+24);c.lineTo(x+s*w*.38-s*14,y+10);c.fill();}
 let xx=x-w/2+12;while(xx<x+w/2-12){const tip=R(),jw=14+R()*10,jh=20+R()*16;
  if(tip<.45){c.fillStyle='rgba(234,244,255,.35)';dn11Yk(c,xx-jw/2,y-jh,jw,jh,5);c.fill();c.fillStyle='#ff4f7a';dn11Yk(c,xx-jw/2+2,y-jh*.7,jw-4,jh*.7-2,4);c.fill();c.fillStyle='#ffb3d1';c.fillRect(xx-jw/2-1,y-jh-4,jw+2,6);c.fillStyle='rgba(255,255,255,.5)';c.fillRect(xx-jw/2+3,y-jh+3,2,jh-8);}
  else if(tip<.75){c.fillStyle='rgba(234,244,255,.35)';dn11Yk(c,xx-jw/2,y-jh,jw,jh,5);c.fill();c.fillStyle='#ffe7a8';for(let k=0;k<4;k++){dn11Yildiz5(c,xx-jw/4+(k%2)*jw/2.5,y-5-k*4,3.4,1.6);c.fill();}c.fillStyle='#c39bff';c.fillRect(xx-jw/2-1,y-jh-4,jw+2,6);}
  else{c.fillStyle='#c8a0cc';c.beginPath();c.ellipse(xx,y-jh*.4,jw*.55,jh*.42,0,0,6.283);c.fill();c.fillStyle='#9ff0d0';c.fillRect(xx-2,y-jh*.85,4,6);}
  xx+=jw+6+R()*6;}
}
// asılı bakır tencere / kepçe (ocak yok; ateş yok)
function dn11Tencere(c,x,y,s,R){
 c.strokeStyle='#5a4a6a';c.lineWidth=1.6;c.beginPath();c.moveTo(x,y-40*s);c.lineTo(x,y-14*s);c.stroke();
 if(R()<.5){c.fillStyle='#d88a6a';c.beginPath();c.ellipse(x,y,18*s,14*s,0,0,Math.PI);c.fill();c.fillRect(x-18*s,y-6*s,36*s,6*s);c.fillStyle='#f0b090';c.fillRect(x-18*s,y-8*s,36*s,3*s);c.strokeStyle='#d88a6a';c.lineWidth=3*s;c.beginPath();c.arc(x,y-14*s,6*s,Math.PI,0);c.stroke();}
 else{c.fillStyle='#c8a0cc';c.beginPath();c.arc(x,y+6*s,9*s,0,6.283);c.fill();c.fillRect(x-1.6*s,y-14*s,3.2*s,16*s);}
}

// ════════ Uzak katmanlar: paralaks şeritleri (yan yana döşenir) ════════
// 0: puslu uzak dağlar + minik uzak şatolar · 1: yuvarlak tepeler, lolipop ağaçlar, minik kuleli evler · 2: budanmış çit sırası, kıvrık
// demir çit, lamba noktaları · 3: yakın koyu çalılar (kalp/yarasa/ay biçimli) · 4: uçuşta aşağıdaki şatonun ışıklı çatıları ve kuleleri
const DN11_EXT=24,DN11_KW=256;
function dn11Kirp(cv){
 const w=cv.width,h=cv.height,n=Math.ceil(w/DN11_KW),ust=new Int16Array(n).fill(h);
 try{const d=cv.getContext('2d').getImageData(0,0,w,h).data;
  for(let k=0;k<n;k++){const xa=k*DN11_KW,xb=Math.min(w,xa+DN11_KW);let y=0;
   satir:for(;y<h;y++){const o=y*w*4;for(let x=xa;x<xb;x+=2)if(d[o+x*4+3]>2)break satir;}
   ust[k]=Math.max(0,y-2);}}catch(e){ust.fill(0);}
 cv.ust=ust;return cv;
}
function dn11SeritCiz(img,x,y,vw,yAlt){
 const ust=img.ust,n=ust.length,h=img.height;let k0=Math.max(0,Math.floor(-x/DN11_KW)),k1=Math.min(n-1,Math.floor((vw-x)/DN11_KW));
 const alt=Math.min(h,yAlt-y);if(alt<=0)return;
 for(let k=k0;k<=k1;k++){const u=ust[k];if(u>=alt)continue;const sx=k*DN11_KW,sw=Math.min(DN11_KW,img.width-sx),
  dx0=Math.round((x+sx)*S)/S,dx1=Math.round((x+sx+sw)*S)/S;g.drawImage(img,sx,u,sw,alt-u,dx0,y+u,dx1-dx0,alt-u);}
}
const DN11_SW=[2048,2048,1536,1536,2048],DN11_SH=[380,360,400,280,440],DN11_SF=[.03,.08,.18,.42,.26],DN11_SYF=[.03,.07,.15,.3,.2],DN11_SB=[468,512,560,628,610];
const DN11_SDOLGU=['#3c3c96','#2e2d80','#232068','#19144a','#2a2670'];
// minik uzak kule (şerit ve uzak şato için): gövde, külah, yuvarlak pencere → pencere kaydı
function dn11MiniKule(c,x,base,w,h,K,pen,R){
 const eg=(R()-.5)*.12;c.save();c.translate(x,base);c.transform(1,0,eg,1,0,0);
 c.fillStyle=K.duvar;dn11Yk(c,-w/2,-h,w,h+4,[w*.2,w*.2,0,0]);c.fill();c.fillStyle='rgba(20,14,50,.25)';c.fillRect(w*.12,-h,w*.38,h+4);
 const cati=K.cati;c.fillStyle=cati;c.beginPath();c.moveTo(-w/2-w*.18,-h+3);c.quadraticCurveTo(-w*.2,-h-h*.3,(R()-.5)*w*.4,-h-w*1.4);c.quadraticCurveTo(w*.2,-h-h*.3,w/2+w*.18,-h+3);c.closePath();c.fill();
 const nr=Math.max(1,Math.floor(h/(w*.9)));for(let r=0;r<nr;r++){if(R()<.3)continue;const wy=-h+(r+.5)*h/nr;c.fillStyle=K.pen;c.beginPath();c.arc(0,wy,w*.14,0,6.283);c.fill();if(pen)pen.push({x:x+eg*wy,y:base+wy,r:w*.2,ph:R()*6.283,th:R()});}
 c.restore();
}
const DN11_SK=[{duvar:'#5e58a0',cati:'#4a3e88',pen:'#9a8ac0'},{duvar:'#5a4e94',cati:'#3e3076',pen:'#b8a0b8'},{duvar:'#463c80',cati:'#30266a',pen:'#d0b090'},{duvar:'#2e2660',cati:'#221a4c',pen:'#e0c080'},{duvar:'#4a4088',cati:'#5a3f96',pen:'#f0c070'}];
// renk (#rrggbb) + saydamlık → rgba metni (yalnız önbellek çizerken)
function dn11Sef(h,a){return 'rgba('+parseInt(h.slice(1,3),16)+','+parseInt(h.slice(3,5),16)+','+parseInt(h.slice(5,7),16)+','+a+')';}
// tepelerin çukurunda gümüş göl (ay ışığı yansıması, pırıltılar) ve kıyısında altın pencereli minik kasaba evleri (şeride bir kez)
function dn11Gol(c,Wd,yAt,R,per,s){
 let n=0;for(let x=20;x<Wd-20;x+=20){if(!(yAt(x)>=yAt(x-20)&&yAt(x)>yAt(x+20)))continue;n++;const ry=15*s,gy=yAt(x)+ry+2,rx=(120+R()*60)*s,gol=n%2===1;
  per(x,xx=>{
   if(gol){let q=c.createLinearGradient(0,gy-ry,0,gy+ry);q.addColorStop(0,'#8fa8ee');q.addColorStop(.5,'#6f86da');q.addColorStop(1,'#4a58b4');c.fillStyle=q;c.beginPath();c.ellipse(xx,gy,rx,ry,0,0,6.283);c.fill();
    c.strokeStyle='rgba(234,244,255,.55)';c.lineWidth=1.2;c.beginPath();c.ellipse(xx,gy,rx,ry,0,Math.PI,6.283);c.stroke();
    c.fillStyle='rgba(255,246,214,.8)';for(let k=0;k<5;k++){const w=(26-k*4)*s;dn11Yk(c,xx+rx*.2-w/2+(k%2?3:-3),gy-ry*.55+k*ry*.26,w,1.8*s,1);c.fill();}
    c.fillStyle='rgba(234,244,255,.6)';for(let k=0;k<9;k++){const a=(k*2.4)%6.283,d=.3+((k*37)%10)/14;c.fillRect(xx+Math.cos(a)*rx*.8*d,gy+Math.sin(a)*ry*.7*d,5*s,1.2);}}
   for(let k=0;k<(gol?7:9);k++){const hx=xx+(gol?(k<4?-1:1)*(rx+8+(k%4)*13*s):(k-4)*21*s)+((k*37)%9),hy=yAt(hx)+(gol?10:14)*s+((k*53)%9),w=(7+(k*29)%7)*s,h=(6+(k*17)%11)*s;
    let q=c.createRadialGradient(hx,hy-h*.5,1,hx,hy-h*.5,w*2.2);q.addColorStop(0,'rgba(255,214,130,.26)');q.addColorStop(1,'rgba(255,214,130,0)');c.fillStyle=q;c.fillRect(hx-w*2.2,hy-h*.5-w*2.2,w*4.4,w*4.4);
    c.fillStyle=k%2?'#4a4296':'#56489e';c.fillRect(hx-w/2,hy-h,w,h);c.fillStyle=k%3?'#7a5ab8':'#b06a9c';c.beginPath();c.moveTo(hx-w*.7,hy-h);c.quadraticCurveTo(hx,hy-h-w*1.1,hx+w*.7,hy-h);c.closePath();c.fill();
    c.fillStyle='#ffe09a';c.fillRect(hx-w*.2,hy-h*.72,w*.4,h*.42);}
  });}
}
function dn11Serit(l){
 if(DN11.serit[l])return DN11.serit[l];
 const Wd=DN11_SW[l],Hd=DN11_SH[l],cv=dn11Cv(Wd,Hd+DN11_EXT),c=cv.getContext('2d'),R=rng(1801+l*97),base=Hd;
 const fx={pen:[],orb:[]};DN11.serFx[l]=fx;
 const k1=[2,3,3,4,3][l],k2=[5,7,6,9,8][l],A1=[120,70,30,24,40][l],A2=[40,26,14,12,20][l],ph1=R()*6.28,ph2=R()*6.28,ofs=[60,40,26,10,170][l];
 const yAt=x=>base-ofs-A1*(.5+.5*Math.sin(x/Wd*6.2832*k1+ph1))-A2*(.5+.5*Math.sin(x/Wd*6.2832*k2+ph2));
 const dolgu=DN11_SDOLGU[l],ust=dn11Mix(dolgu,'#a9b8f0',[.26,.18,.12,.06,.14][l]);
 const tepe=()=>{const gr=c.createLinearGradient(0,base-ofs-A1-A2,0,base);gr.addColorStop(0,ust);gr.addColorStop(.6,dolgu);gr.addColorStop(1,dolgu);c.fillStyle=gr;
  c.beginPath();c.moveTo(0,Hd+DN11_EXT);for(let x=0;x<=Wd;x+=6)c.lineTo(x,yAt(x));c.lineTo(Wd,Hd+DN11_EXT);c.closePath();c.fill();
  c.strokeStyle=dn11Mix(ust,'#eaf4ff',.35);c.globalAlpha=.5;c.lineWidth=1.4;c.beginPath();for(let x=0;x<=Wd;x+=6)x?c.lineTo(x,yAt(x)+.8):c.moveTo(0,yAt(0)+.8);c.stroke();c.globalAlpha=1;};
 const per=(x,fn)=>{for(const o of [0,-Wd,Wd]){const xx=x+o;if(xx>-260&&xx<Wd+260)fn(xx,o===0);}};
 const K=DN11_SK[l];
 if(l===0){
  tepe();
  dn11Gol(c,Wd,yAt,R,per,1);
  // uzak minik şatolar (tepelerin üstünde, 3 adet) ve tek tük kule
  for(let k=0;k<3;k++){const sx=(k+.3+R()*.4)*Wd/3,sd=k*31+7;per(sx,(xx,ana)=>{const Q=rng(sd),b=yAt(xx)+6;for(let j=0;j<4;j++){const w=10+Q()*8,h=26+Q()*40;dn11MiniKule(c,xx+(j-1.5)*14,b,w,h,K,ana?fx.pen:null,Q);}});}
 } else if(l===1){
  tepe();dn11Gol(c,Wd,yAt,rng(2931),per,1.25);let x=R()*40;
  while(x<Wd){const tip=R(),s=x;
   if(tip<.4){const n=1+Math.floor(R()*3),sd=(x*13|0)+5;per(s,(xx,ana)=>{const Q=rng(sd);for(let j=0;j<n;j++){const w=14+Q()*10,h=30+Q()*44;dn11MiniKule(c,xx+j*w*1.1,yAt(xx+j*w)+4,w,h,K,ana?fx.pen:null,Q);}});x+=n*22+20+R()*40;}
   else{const h=40+R()*50,col=R()<.5?'#3e5a7a':'#4a4682',sd=(x*7|0)+3;per(s,xx=>{const Q=rng(sd),y=yAt(xx)+3;c.strokeStyle=dn11Mix(dolgu,'#1a1030',.3);c.lineWidth=3;c.beginPath();c.moveTo(xx,y);c.lineTo(xx,y-h);c.stroke();
     c.fillStyle=dn11Mix(col,dolgu,.45);c.beginPath();c.arc(xx,y-h,h*.32,0,6.283);c.fill();if(Q()<.6){c.beginPath();c.arc(xx,y-h*.55,h*.22,0,6.283);c.fill();}c.fillStyle=dn11Mix(dn11Mix(col,'#ffffff',.18),dolgu,.4);c.beginPath();c.arc(xx-h*.1,y-h-h*.1,h*.14,0,6.283);c.fill();});x+=h*.6+R()*30;}}
 } else if(l===2){
  tepe();
  // budanmış çit sırası (yuvarlak tepeli), kıvrık demir çit, lolipop ağaçlar, lambalar
  let x=0;while(x<Wd){const w=60+R()*80,h=30+R()*24,s=x;per(s,xx=>{const y=yAt(xx+w/2)+6;c.fillStyle=dn11Mix('#2e4a5e',dolgu,.4);dn11Yk(c,xx,y-h,w,h+8,[h*.5,h*.5,0,0]);c.fill();c.fillStyle=dn11Mix('#4e7a86',dolgu,.5);dn11Yk(c,xx+6,y-h+3,w*.5,6,3);c.fill();});x+=w+(R()<.3?40+R()*60:4);}
  for(let k=0;k<11;k++){const tx=R()*Wd,h=70+R()*60,col=['#3e6476','#4a4e8a','#5a4682'][k%3];per(tx,xx=>{const y=yAt(xx)+4;c.strokeStyle='#241c48';c.lineWidth=4;c.beginPath();c.moveTo(xx,y);c.lineTo(xx,y-h);c.stroke();
   c.fillStyle=dn11Mix(col,dolgu,.35);c.beginPath();c.arc(xx,y-h,h*.3,0,6.283);c.fill();c.beginPath();c.arc(xx,y-h*.5,h*.2,0,6.283);c.fill();c.fillStyle=dn11Mix(dn11Mix(col,'#ffffff',.2),dolgu,.3);c.beginPath();c.arc(xx-h*.08,y-h-h*.1,h*.12,0,6.283);c.fill();});}
  for(let k=0;k<9;k++){const lx=R()*Wd;per(lx,(xx,ana)=>{const y=yAt(xx)+4;c.strokeStyle='#221a46';c.lineWidth=2.4;c.beginPath();c.moveTo(xx,y);c.lineTo(xx,y-58);c.stroke();c.fillStyle='#3a3270';c.beginPath();c.arc(xx,y-64,6,0,6.283);c.fill();if(ana)fx.orb.push({x:xx,y:y-64,r:6,ph:R()*6.283});});}
  c.strokeStyle=dn11Mix(dolgu,'#8a80c0',.25);c.lineWidth=1.6;for(let x=0;x<Wd;x+=14){const y=yAt(x)+10;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-18);c.arc(x,y-21,3,Math.PI/2,Math.PI*2.4);c.stroke();}
 } else if(l===4){
  // uçuş manzarası: aşağıda şatonun ışıklı çatıları ve kuleleri (iki sıra), aralarında bulut tülleri
  tepe();
  for(const [sc,dy,sd,K] of [[.55,-40,31,DN11_SK[1]],[.8,4,37,DN11_SK[2]]]){let x=R()*30;const Q=rng(sd);
   while(x<Wd){const w=(26+Q()*30)*sc,h=(50+Q()*90)*sc,s0=x;per(s0,(xx,ana)=>{const Q2=rng((s0*7|0)+sd);dn11MiniKule(c,xx,yAt(xx)+dy,w,h,K,ana?fx.pen:null,Q2);});
    x+=w+(16+Q()*50)*sc;}
   c.fillStyle='rgba(120,110,190,.16)';c.fillRect(0,base-ofs-60+dy,Wd,200);}
  for(let k=0;k<26;k++){const x=R()*Wd,y=base-160+R()*120,w=80+R()*140;per(x,xx=>{c.fillStyle='rgba(190,180,240,.14)';c.beginPath();c.ellipse(xx,y,w,10+R()*8,0,0,6.283);c.fill();});}
 } else {
  // yakın çalılar: koyu yumuşak çalılık, kalp/yarasa/ay biçimli budanmış çalı siluetleri
  c.fillStyle=dolgu;c.beginPath();c.moveTo(0,Hd+DN11_EXT);for(let x=0;x<=Wd;x+=6)c.lineTo(x,yAt(x));c.lineTo(Wd,Hd+DN11_EXT);c.closePath();c.fill();
  let x=0;while(x<Wd){const r=16+R()*26,s=x;per(s,xx=>{c.fillStyle=dn11Mix(dolgu,'#2e3a6a',.5);c.beginPath();c.arc(xx,yAt(xx)+r*.4,r,Math.PI,0);c.fill();c.fillStyle=dolgu;c.beginPath();c.arc(xx+r*.2,yAt(xx)+r*.55,r*.85,Math.PI,0);c.fill();});x+=r*1.2;}
  for(let k=0;k<10;k++){const sx=R()*Wd,b=['kalp','yarasa','ay','top'][k%4],s=.55+R()*.3;per(sx,xx=>{c.save();c.translate(xx,yAt(xx)-36*s);c.fillStyle=dn11Mix(dolgu,'#3a4a7a',.35);c.fill(dn11CaliYol(b,s));c.restore();
   c.fillStyle=dn11Mix(dolgu,'#3a4a7a',.35);c.fillRect(xx-2,yAt(xx)-10,4,14);});}
 }
 const F=dn11FxArt();c.fillStyle=dolgu;c.fillRect(0,base-1,Wd,DN11_EXT+1);
 c.globalAlpha=[.42,.32,.24,.14,.36][l];c.drawImage(F.pus[l===4?2:l<2?1:0],0,base-[150,130,110,80,200][l],Wd,[170,150,130,100,220][l]);c.globalAlpha=1;
 dn11Kirp(cv);DN11.serit[l]=cv;return cv;
}
// ── Uzaktaki Ay Işığı Şatosu: tepede eğri büğrü sevimli kuleler, kıvrık külahlar, yuvarlak pencereler, flamalar ──
function dn11SatoArt(){
 const F=dn11FxArt();if(F.sato)return F.sato;
 const cv=dn11Cv(560,640),c=cv.getContext('2d'),R=rng(2626);c.translate(280,620);const pen=[];
 let gr=c.createLinearGradient(0,-170,0,0);gr.addColorStop(0,'#5a4c98');gr.addColorStop(1,'#3e3478');c.fillStyle=gr;
 c.beginPath();c.moveTo(-280,0);c.bezierCurveTo(-200,-130,-90,-165,0,-166);c.bezierCurveTo(90,-165,200,-130,280,0);c.closePath();c.fill();
 c.strokeStyle='rgba(207,230,255,.3)';c.lineWidth=1.5;c.beginPath();c.moveTo(-220,-70);c.bezierCurveTo(-150,-140,-60,-164,0,-165);c.stroke();
 // kıvrık patika (yokuş) + minik lambalar
 c.strokeStyle='rgba(255,231,168,.22)';c.lineWidth=5;c.beginPath();c.moveTo(-60,0);c.bezierCurveTo(-30,-50,40,-80,8,-160);c.stroke();
 for(const [x,y] of [[-40,-24],[0,-62],[22,-104],[12,-140]])pen.push({x,y,lamba:true});
 const tas='#8a80b8',tasK='#6a62a0',cati=DN11_CATI;
 // ana gövde (geniş, yuvarlak köşeli) ve önünde kemerli kapı
 c.fillStyle=tas;dn11Yk(c,-110,-300,220,140,16);c.fill();c.fillStyle='rgba(20,14,50,.22)';c.fillRect(30,-300,80,140);
 dn11Mazgal(c,-112,112,-300,tas,'rgba(234,244,255,.25)');
 c.fillStyle='#2e2656';c.beginPath();c.moveTo(-22,-160);c.lineTo(-22,-198);c.arc(0,-198,22,Math.PI,0);c.lineTo(22,-160);c.fill();pen.push({x:0,y:-186,kapi:true});
 for(const [x,y] of [[-70,-240],[-30,-250],[30,-250],[70,-240],[-70,-196],[70,-196]]){c.fillStyle='#2e2656';c.beginPath();c.arc(x,y,9,0,6.283);c.fill();pen.push({x,y});}
 // kuleler: [x, genişlik, tepe y, külah yüksekliği, renk, eğim]
 const kul=[[-150,58,-360,120,0,-.06],[-84,48,-420,110,1,.04],[0,74,-470,160,2,-.03],[82,52,-400,120,3,.07],[146,60,-340,100,0,-.05]];
 for(const [x,w,ty,ch,ci,eg] of kul){c.save();c.translate(x,-160);c.transform(1,0,eg,1,0,0);
  c.fillStyle=tas;dn11Yk(c,-w/2,ty+160,w,-ty-160+6,[w*.25,w*.25,0,0]);c.fill();c.fillStyle='rgba(20,14,50,.22)';c.fillRect(w*.1,ty+160,w*.4,-ty-154);
  c.fillStyle=tasK;dn11Yk(c,-w/2-6,ty+160-4,w+12,12,6);c.fill();
  const u=dn11Kulah(c,0,ty+156,w,ch,cati[ci],R,ci===2?'hilal':'top');
  for(let k=0;k<3;k++){const wy=ty+160+28+k*44;if(wy>-30)break;c.fillStyle='#2e2656';c.beginPath();c.arc(0,wy,w*.15,0,6.283);c.fill();pen.push({x:x+eg*wy,y:wy-160});}
  // flama
  if(ci%2===0){c.strokeStyle='#4e4672';c.lineWidth=2;c.beginPath();c.moveTo(u.x,u.y-8);c.lineTo(u.x,u.y-34);c.stroke();c.fillStyle='#ff7a9a';c.beginPath();c.moveTo(u.x,u.y-34);c.quadraticCurveTo(u.x+14,u.y-34,u.x+24,u.y-28);c.quadraticCurveTo(u.x+12,u.y-26,u.x,u.y-22);c.fill();}
  c.restore();}
 // ön duvar (sur) ve küçük yuvarlak mazgallar
 c.fillStyle=tasK;dn11Yk(c,-200,-200,400,46,10);c.fill();dn11Mazgal(c,-200,200,-200,tasK,'rgba(234,244,255,.18)');
 F.sato=cv;F.satoPen=pen;return cv;
}

// ════════ Dünya yerleşimi: büyük dekor, odalar, küçük süsler, ışık kayıtları (tohumlu; aynı yer hep aynı) ════════
function dn11Dolu(q){   // nesne sütunu ya da mini oyun alanı: önüne küçük süs konmaz
 for(const o of NESNELER){if(o.tip==='konusma')continue;const x=nx(q);
  if(Math.abs(o.x-x)<2.4*T&&o.y>dn11Surface(x)-260)return true;if(Number.isFinite(o.x0)&&Number.isFinite(o.x1)&&x>o.x0-T&&x<o.x1+T)return true;}
 return false;
}
function dn11Yapilar(){
 if(DN11.yap)return DN11.yap;
 const Y=DN11.yap={buyuk:[],kucuk:[],plat:[],oda:[],pen:[],orb:[],kris:[],avize:[],isin:[],vitray:[],ip:[]};
 const D11=typeof DEKOR11!=='undefined'?DEKOR11:{};const sy=c=>DN11_YUZ[clamp(c,0,COLS-1)];
 // dış mimari (zeminin arkasında): bahçe çiti, şato kanadı, kuleler, köprü başı kulesi, uçurum kayası, balkon kulesi, kule terası
 Y.buyuk.push({tip:'cit',x0:0,x1:126*T,y0:sy(60)-200,acik:[33*T,47*T],z:0});
 // taş kanat iki parça ve alçak: pencereli bölüm (pencere canlanmasının arkası) + alçak sur duvarı → üstünde gök ve uzak şato görünür
 Y.buyuk.push({tip:'kanat',x0:116*T,x1:130*T,yUst:400,y0:350,z:1,alcak:true});
 Y.buyuk.push({tip:'kanat',x0:130*T,x1:154*T,yUst:250,y0:200,z:1});
 Y.buyuk.push({tip:'kanat',x0:154*T,x1:211*T,yUst:350,y0:300,z:1,alcak:true});
 Y.buyuk.push({tip:'kule',x:124*T+20,w:140,ust:40,cati:200,x0:124*T-100,x1:124*T+140,y0:-220,z:2,ci:3});
 Y.buyuk.push({tip:'kule',x:nx(176),w:150,ust:112,cati:0,x0:nx(176)-110,x1:nx(176)+110,y0:60,z:2,bos:[0,140]});
 // ön kule: külahın ucu düz ve süssüz (AYNA 'kule' parçası yıldızını DEKOR11.kuleTepe'ye koyar: ucu y = −30−6−250 = −286)
 Y.buyuk.push({tip:'kule',x:nx(206),w:170,ust:-30,cati:250,x0:nx(206)-120,x1:nx(206)+120,y0:-320,z:2,bos:[0,130],ci:2,uc:'yok',duz:true});
 Y.buyuk.push({tip:'kule',x:255*T+70,w:150,ust:-60,cati:230,x0:255*T-40,x1:255*T+170,y0:-330,z:2,ci:1});
 Y.buyuk.push({tip:'kayalik',x0:302*T,x1:321*T+10,y0:-300,z:2});
 Y.buyuk.push({tip:'kule',x:599*T+60,w:120,ust:-20,cati:210,x0:599*T-20,x1:599*T+150,y0:-260,z:2,ci:3});
 Y.buyuk.push({tip:'kule',x:765*T+60,w:130,ust:-150,cati:220,x0:765*T-20,x1:765*T+150,y0:-400,z:2,ci:0});
 for(const [col,s,ci] of D11.agac||[])Y.buyuk.push({tip:'agac',x:nx(col)+(dn11Hash(col)-.5)*14,y:sy(col)+4,s,ci,x0:nx(col)-70*s,x1:nx(col)+70*s,y0:sy(col)-300*s,z:3,seed:col*17});
 for(const [col,s,b] of D11.cali||[])Y.buyuk.push({tip:'cali',x:nx(col),y:sy(col)+3,s,b,x0:nx(col)-70*s,x1:nx(col)+70*s,y0:sy(col)-160*s,z:4,seed:col*7});
 for(const [col] of D11.fener||[])Y.buyuk.push({tip:'lamba',x:nx(col),y:sy(col)+2,x0:nx(col)-30,x1:nx(col)+30,y0:sy(col)-190,z:4});
 for(const [col,s,ci] of D11.kristal||[])Y.buyuk.push({tip:'kristal',x:nx(col),y:sy(col)+4,s,ci,x0:nx(col)-60*s,x1:nx(col)+60*s,y0:sy(col)-130*s,z:5,seed:col*5});
 Y.buyuk.sort((a,b)=>a.z-b.z);
 // odaların öğeleri (oda boyanırken kendi aralığında çizilir)
 const odaEkle=(tip,col,o)=>Y.oda.push(Object.assign({tip,x:nx(col)},o));
 for(const [col,kim] of D11.portre||[])odaEkle('portre',col,{y:250,w:84,h:104,kim,r:70});
 for(const [col,oda] of D11.pencere||[])odaEkle('pencere',col,{oda,r:oda==='galeri'?110:oda==='org'?80:60});
 for(const [col] of D11.samdan||[])odaEkle('samdan',col,{r:40});
 for(const [col] of D11.avize||[])odaEkle('avize',col,{r:110});
 Y.oda.sort((a,b)=>a.x-b.x);
 // tek yönlü platformlar
 for(let r=0;r<ROWS;r++){let c=0;while(c<COLS){if(grid[r][c]!==2){c++;continue;}let e=c;while(e+1<COLS&&grid[r][e+1]===2)e++;
  const x0=c*T,x1=(e+1)*T,b=dn11Bolge((x0+x1)/2),tab=Math.max(sy(c),sy(e));Y.plat.push({x0,x1,y:r*T,tab,tur:b==='kopru'?'kopru':b==='magara'?'kristal':b==='galeri'?'pervaz':'cit',seed:c*31+r*7});c=e+1;}}
 // küçük süsler: bölgeye göre sütun sütun (tohumlu); nesne sütunlarından ve mini oyun alanlarından kaçar
 for(let q=1;q<COLS-1;q++){const x=nx(q);if(x>=DN11_GAP0-T&&x<DN11_GAP1+T)continue;const t=topOf(q);if(t>=ROWS)continue;const y=t*T,Q=rng(q*977+5),b=dn11Bolge(x);
  if(topOf(q-1)!==t||topOf(q+1)!==t)continue;const dolu=dn11Dolu(q),k=Q();
  const ek=(tip,o)=>Y.kucuk.push(Object.assign({tip,x:x+(Q()-.5)*18,y},o));
  if(b==='giris'||b==='bahce'){if(k<.3)ek('ot',{});else if(!dolu&&k<.4)ek('topcuk',{s:.6+Q()*.5});else if(!dolu&&k<.44)ek('kabak',{s:.5+Q()*.3});else if(k<.56)ek('tas',{});}
  else if(b==='kopru'){if(k<.3)ek('ot',{});else if(!dolu&&k<.4)ek('topcuk',{s:.5+Q()*.4});}
  else if(b==='magara'){if(!dolu&&k<.22)ek('kristalcik',{s:.35+Q()*.3,ci:Math.floor(Q()*3)});else if(k<.42)ek('cakil',{});}
  else if(b==='mutfak'){if(!dolu&&k<.1)ek('sepet',{});}
  else if(b==='balkon'||(b==='balo'&&Math.abs(q-826)>14)){if(!dolu&&k<.05)ek('saksi',{});}
 }
 // süs ipleri (karede salınır)
 for(const [a,dya,b2,dyb,sag,n,tur] of D11.ip||[])Y.ip.push({x0:nx(a),y0:sy(a)+dya,x1:nx(b2),y1:sy(b2)+dyb,sag,n,tur,ph:a*.37});
 return Y;
}

// ── Zemin parçası: 768 genişlik, yalnız boyalı yükseklik kadar ──
function dn11Chunk(i){
 if(DN11.chunks.has(i)){const a=DN11.chunks.get(i);DN11.chunks.delete(i);DN11.chunks.set(i,a);return a;}
 const Y=dn11Yapilar(),x0=i*DN11_CW,L=x0-2,Rr=x0+DN11_CW+2;
 let ust=1200;for(let x=Math.floor(L);x<=Rr;x+=8){const s=dn11Surface(x);if(s<1200)ust=Math.min(ust,s-80);if(Number.isFinite(dn11Tavan(x)))ust=DN11_UST;}
 for(const b of Y.buyuk)if(b.x1>L&&b.x0<Rr)ust=Math.min(ust,b.y0);
 for(const p of Y.plat)if(p.x1>L-20&&p.x0<Rr+20)ust=Math.min(ust,p.y-90);
 ust=Math.max(DN11_UST,Math.floor(ust));
 const cv=dn11Cv(DN11_CW+4,1200-ust),c=cv.getContext('2d');c.translate(2-x0,-ust);cv.ust=ust;
 let yeni=false;const kayit=o=>{if(o.kayitli)return null;o.kayitli=true;yeni=true;return Y;};
 // 1) dış büyük dekor (sırayla z)
 for(const b of Y.buyuk)if(b.x1>L&&b.x0<Rr&&b.z<3)dn11BuyukCiz(c,b,kayit(b));
 // 2) odalar (arka duvar, tavan, pencere boşlukları, oda süsleri)
 if(typeof BL11_ODA!=='undefined')for(const o of BL11_ODA){const a=o.a*T,b=(o.b+1)*T;if(b>L&&a<Rr)dn11OdaCiz(c,o,Math.max(L,a),Math.min(Rr,b),Y,kayit);}
 for(const x of DN11_KEMER)if(x>L-120&&x<Rr+120)dn11Sove(c,x);
 for(const b of Y.buyuk)if(b.x1>L&&b.x0<Rr&&b.z>=3)dn11BuyukCiz(c,b,kayit(b));
 // 3) zemin gövdesi: bahçede erik toprak, şatoda taş temel, mağarada kaya
 const p=new Path2D();let open=false,prev=1200;
 for(let x=Math.floor(L);x<=Rr;x+=2){const y=dn11Surface(x);if(y>=1200){if(open){p.lineTo(x,prev);p.lineTo(x,1200);p.closePath();open=false;}prev=1200;continue;}
  if(!open){p.moveTo(x,1200);p.lineTo(x,y);open=true;prev=y;}else if(y!==prev){p.lineTo(x,prev);p.lineTo(x,y);prev=y;}}
 if(open){p.lineTo(Rr,prev);p.lineTo(Rr,1200);p.closePath();}
 let gr=c.createLinearGradient(0,480,0,1200);gr.addColorStop(0,'#3e3068');gr.addColorStop(.3,'#2c2252');gr.addColorStop(.7,'#1e1840');gr.addColorStop(1,'#120e2c');c.fillStyle=gr;c.fill(p);
 c.save();c.clip(p);const Q=rng(i*733+61);
 // bölge şeritleri: taş temel (şato), kaya (mağara), toprak (bahçe)
 const seg=(a,b,fn)=>{const xa=Math.max(L,a),xb=Math.min(Rr,b);if(xb>xa)fn(xa,xb);};
 const tasD=c.createPattern(dn11Karo('tasK'),'repeat'),kaya=c.createPattern(dn11Karo('kaya'),'repeat');
 for(const [a,b] of [[211*T,255*T],[421*T,DN11_GAP0],[DN11_GAP1,COLS*T]])seg(a,b,(xa,xb)=>{c.fillStyle=tasD;c.fillRect(xa,300,xb-xa,900);const gt=c.createLinearGradient(0,470,0,760);gt.addColorStop(0,'rgba(14,8,36,.45)');gt.addColorStop(1,'rgba(14,8,36,.9)');c.fillStyle=gt;c.fillRect(xa,300,xb-xa,900);});
 seg(321*T,421*T,(xa,xb)=>{c.fillStyle=kaya;c.fillRect(xa,300,xb-xa,900);});
 // yüzeyin hemen altında ay ışığı alan yumuşak lila bant; toprak katmanları, yuvarlak taşlar, ışıl ışıl kırıntılar
 for(const [dy,lw,a] of [[16,34,.13],[44,40,.07]]){c.strokeStyle='rgba(150,130,220,'+a+')';c.lineWidth=lw;c.lineJoin='round';c.beginPath();let on=false;
  for(let x=Math.floor(L)-20;x<=Rr+20;x+=10){const y=dn11Surface(x);if(y>=1200){on=false;continue;}on?c.lineTo(x,y+dy):c.moveTo(x,y+dy);on=true;}c.stroke();}
 for(let k=0;k<26;k++){const xx=L+Q()*DN11_CW,yy=dn11Surface(xx)+40+Q()*200,ww=50+Q()*140;if(yy>1190)continue;c.strokeStyle='rgba(160,140,220,.1)';c.lineWidth=2.5;c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx+ww*.5,yy+6,xx+ww,yy);c.stroke();}
 for(let k=0;k<12;k++){const xx=L+Q()*DN11_CW,yy=dn11Surface(xx)+50+Q()*300,r=6+Q()*14;if(yy>1190)continue;c.fillStyle=k%4?'#3a2e60':'#463a70';c.beginPath();c.ellipse(xx,yy,r*1.3,r,0,0,6.283);c.fill();c.fillStyle='rgba(190,170,240,.28)';c.beginPath();c.ellipse(xx-r*.2,yy-r*.5,r*.8,r*.3,0,0,6.283);c.fill();}
 for(let k=0;k<110;k++){const xx=L+Q()*DN11_CW,yy=dn11Surface(xx)+8+Q()*120;c.fillStyle='rgba(234,240,255,'+(.08+Q()*.18)+')';c.fillRect(xx,yy,1.2,1.2);}
 c.restore();
 // 3b) uçurum ağızları (balkonun ucu, terasın başı) ve sis çanağının yumuşak yastıkları
 dn11Kenarlar(c,L,Rr);
 // 4) yüzey dudağı: çimen (bahçe), taş döşeme / karo / parke (odalar), kaya (mağara)
 dn11Dudak(c,L,Rr);
 // 5) küçük süsler ve 6) tek yönlü platformlar
 for(const s of Y.kucuk)if(s.x>L-80&&s.x<Rr+80)dn11KucukCiz(c,s,kayit(s));
 for(const pl of Y.plat)if(pl.x1>L-20&&pl.x0<Rr+20)dn11PlatCiz(c,pl,kayit(pl));
 // 7) pişmiş ışık-gölge (yalnız var olan piksellere, source-atop): zemine değen duvar/çalı/ağaç diplerinde temas gölgesi (AO),
 //    üst kısımlarda soğuk ay ışığı, yüzey kenarında ince gümüş ay çizgisi (rim)
 c.save();c.globalCompositeOperation='source-atop';
 {const gt=c.createLinearGradient(0,ust,0,ust+520);gt.addColorStop(0,'rgba(200,214,255,.16)');gt.addColorStop(1,'rgba(200,214,255,0)');c.fillStyle=gt;c.fillRect(L,ust,Rr-L,520);}
 let sy0=-1,gA=null;
 for(let x=Math.floor(L);x<=Rr;x+=8){const y=dn11Surface(x);if(y>=1200)continue;if(y!==sy0){sy0=y;gA=c.createLinearGradient(0,y-140,0,y+2);gA.addColorStop(0,'rgba(14,8,40,0)');gA.addColorStop(.65,'rgba(14,8,40,.18)');gA.addColorStop(1,'rgba(14,8,40,.42)');}
  c.fillStyle=gA;c.fillRect(x,y-140,8,140);}
 c.restore();
 c.save();c.strokeStyle='rgba(214,230,255,.22)';c.lineWidth=2;c.beginPath();{let on=false;for(let x=Math.floor(L);x<=Rr;x+=4){const y=dn11Surface(x);if(y>=1200||dn11Oda(x)){on=false;continue;}on?c.lineTo(x,y+1):c.moveTo(x,y+1);on=true;}}c.stroke();c.restore();
 if(yeni)dn11KayitSirala();
 DN11.chunks.set(i,cv);while(DN11.chunks.size>DN11_CACHE)DN11.chunks.delete(DN11.chunks.keys().next().value);return cv;
}
function dn11KayitSirala(){const Y=DN11.yap;for(const k of ['pen','orb','kris','avize','isin','vitray'])Y[k].sort((a,b)=>a.x-b.x);}

// ════════ Dış büyük dekor ressamları ════════
function dn11BuyukCiz(c,b,Y){
 const R=rng(b.seed||((b.x0|0)*3+7));
 switch(b.tip){
  case 'cit':dn11CitCiz(c,b,R,Y);break;
  case 'kanat':dn11KanatCiz(c,b,R,Y);break;
  case 'kule':dn11KuleCiz(c,b,R,Y);break;
  case 'kayalik':dn11KayalikCiz(c,b,R,Y);break;
  case 'agac':dn11Agac(c,b.x,b.y,b.s,b.ci,R);break;
  case 'cali':dn11Cali(c,b.x,b.y,b.s,b.b,R);break;
  case 'lamba':dn11Lamba(c,b.x,b.y,1,Y);break;
  case 'kristal':dn11Kristal(c,b.x,b.y,b.s,b.ci,R,Y);break;
 }
}
// bahçenin arkasında budanmış uzun çit (yuvarlak dilimli tepe) — kapı aralığında (AYNA'nın kemeri) açık, uçları yuvarlak taş direkli
function dn11CitCiz(c,b,R,Y){
 const h=150,parca=[[b.x0,b.acik[0]],[b.acik[1],b.x1]];
 for(const [a,e] of parca){c.save();const p=new Path2D();p.moveTo(a,1200);
  for(let x=a;x<=e;x+=8){const y=dn11Surface(x)-h+Math.sin(x*.045)*6;p.lineTo(x,y);}p.lineTo(e,1200);p.closePath();
  dn11Yaprak(c,p,(a+e)/2,800,(e-a)/2+20,420,R,{ana:'#2f4c62',ac:'#47707e',koyu:'#22384e'});
  c.restore();
  // yuvarlak dilimli tepe
  c.fillStyle='#355468';for(let x=a+20;x<e-10;x+=44){const y=dn11Surface(x)-h+Math.sin(x*.045)*6;c.beginPath();c.arc(x,y+6,22,Math.PI,0);c.fill();c.fillStyle='rgba(122,176,176,.22)';c.beginPath();c.arc(x-6,y-4,10,0,6.283);c.fill();c.fillStyle='#355468';}
  // taş direkler (uçlarda, her 30 sütunda bir), üstünde yuvarlak top
  for(const x of [a+18,e-18]){if(x<b.x0+30)continue;const y=dn11Surface(x);c.fillStyle=DN11_TAS.ana;dn11Yk(c,x-18,y-h-30,36,h+34,6);c.fill();c.fillStyle=DN11_TAS.ac;c.fillRect(x-14,y-h-26,8,h+20);
   c.fillStyle=DN11_TAS.koyu;dn11Yk(c,x-22,y-h-36,44,12,5);c.fill();c.fillStyle=DN11_TAS.ac;c.beginPath();c.arc(x,y-h-48,13,0,6.283);c.fill();}
 }
}
// şatonun bahçeye bakan taş kanadı: yokuş boyunca yükselen duvar, yuvarlak mazgallar, yuvarlak pencereler, sarmaşık
function dn11KanatCiz(c,b,R,Y){
 const x0=b.x0,x1=b.x1,yu=b.yUst,pat=c.createPattern(dn11Karo('tas'),'repeat');
 c.fillStyle=pat;c.fillRect(x0,yu,x1-x0,1200-yu);
 const gr=c.createLinearGradient(0,yu,0,640);gr.addColorStop(0,'rgba(20,14,50,.18)');gr.addColorStop(.6,'rgba(90,80,150,.1)');gr.addColorStop(1,'rgba(190,170,240,.32)');c.fillStyle=gr;c.fillRect(x0,yu,x1-x0,1200-yu);
 // korniş bandı (orta yükseklik) ve alt kemerli nişler (içlerinde budanmış top çalılar)
 c.fillStyle=DN11_TAS.ac;c.fillRect(x0,yu+150,x1-x0,10);c.fillStyle='rgba(20,14,50,.3)';c.fillRect(x0,yu+160,x1-x0,5);
 for(let x=x0+240;x<x1-100;x+=320){const yz=dn11Surface(x);if(Math.abs(x-nx(140))<260)continue;c.fillStyle='rgba(30,22,70,.55)';c.beginPath();c.moveTo(x-46,yz);c.lineTo(x-46,yz-110);c.arc(x,yz-110,46,Math.PI,0);c.lineTo(x+46,yz);c.closePath();c.fill();
  c.strokeStyle=DN11_TAS.ac;c.lineWidth=5;c.beginPath();c.moveTo(x-50,yz);c.lineTo(x-50,yz-110);c.arc(x,yz-110,50,Math.PI,0);c.lineTo(x+50,yz);c.stroke();}
 // destek ayakları (payandalar) ve yuvarlak pencereler (pencere parçasının yeri boş: x 5620±240)
 for(let x=x0+160;x<x1-60;x+=320){c.fillStyle=DN11_TAS.koyu;dn11Yk(c,x-16,yu+30,32,1200,8);c.fill();c.fillStyle='rgba(234,244,255,.12)';c.fillRect(x-14,yu+30,6,900);}
 for(let x=x0+320;x<x1-80;x+=320){if(Math.abs(x-nx(140))<300)continue;for(const yy of [yu+90,yu+210]){if(yy>dn11Surface(x)-120)continue;dn11Pencere(c,x,yy,40,yy===yu+90?40:56,yy===yu+90?'yuvarlak':'kemer',Y,R);}}
 // yarı geride dursun: gece mavisi tül (parçaya bir kez boyanır) — tuğla deseni bastırılır, öndeki çalılar ve Feza öne çıkar
 c.fillStyle=b.alcak?'rgba(40,30,92,.26)':'rgba(40,30,92,.34)';c.fillRect(x0,yu,x1-x0,1200-yu);
 dn11Mazgal(c,x0,x1,yu,DN11_TAS.ana,'rgba(234,244,255,.3)');
 c.fillStyle='rgba(20,14,50,.25)';c.fillRect(x0,yu+14,x1-x0,6);
 // sarmaşık perdeleri (yuvarlak yapraklar)
 for(let k=0;k<6;k++){const x=x0+200+R()*(x1-x0-400),y=yu+10,len=120+R()*160;if(Math.abs(x-nx(140))<260)continue;
  c.strokeStyle='#2e5060';c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+20,y+len*.3,x-20,y+len*.7,x+6,y+len);c.stroke();
  for(let j=0;j<12;j++){const u=j/12,lx=x+Math.sin(u*5)*12,ly=y+u*len;c.fillStyle=j%2?'#3e6476':'#4e7a86';c.beginPath();c.ellipse(lx+(j%2?7:-7),ly,7,4,j%2?.5:-.5,0,6.283);c.fill();}}
 // pencereli bölümün iki ucunda asılı lila sancak (altın hilal + yıldız işlemeli)
 if(!b.alcak)for(const bx of [x0+90,x1-90]){const by=yu+24,bh=170,bw=46;c.fillStyle='#6a4aa8';c.beginPath();c.moveTo(bx-bw/2,by);c.lineTo(bx+bw/2,by);c.lineTo(bx+bw/2,by+bh);c.lineTo(bx,by+bh-22);c.lineTo(bx-bw/2,by+bh);c.closePath();c.fill();
  c.fillStyle='#8a66c8';c.fillRect(bx-bw/2,by,8,bh-8);c.fillStyle='rgba(20,14,50,.25)';c.fillRect(bx+bw/2-7,by,7,bh-4);
  c.strokeStyle='#e8b958';c.lineWidth=2;c.beginPath();c.moveTo(bx-bw/2+5,by+bh-10);c.lineTo(bx,by+bh-30);c.lineTo(bx+bw/2-5,by+bh-10);c.stroke();
  c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(bx-bw/2-8,by);c.lineTo(bx+bw/2+8,by);c.stroke();c.fillStyle='#e8b958';for(const sx of [-1,1]){c.beginPath();c.arc(bx+sx*(bw/2+10),by,5,0,6.283);c.fill();}
  c.fillStyle='#ffe7a8';dn11Hilal(c,bx-2,by+62,14,1);c.fill();dn11Yildiz5(c,bx+1,by+112,9,4);c.fill();c.lineCap='butt';}
 // alçak sur: tepesinde ay ışığı topu taşıyan küçük taş direkler ve aralarında yıldız süs ipi
 if(b.alcak){for(let x=x0+120;x<x1-40;x+=360){const y=yu-30;c.fillStyle=DN11_TAS.ana;dn11Yk(c,x-14,y-26,28,40,6);c.fill();c.fillStyle=DN11_TAS.ac;c.beginPath();c.arc(x,y-34,11,0,6.283);c.fill();if(Y)Y.orb.push({x,y:y-34,r:11,ph:dn11Hash(x)*6.283});}}
}
// yuvarlak kule: gövde (sol aydınlık, sağ gölge), taş deseni, pencereler, burç ya da kıvrık külah
function dn11KuleCiz(c,b,R,Y){
 const x=b.x,w=b.w,ust=b.ust,alt=1200,pat=c.createPattern(dn11Karo('tas'),'repeat');
 c.fillStyle=pat;dn11Yk(c,x-w/2,ust,w,alt-ust,[w*.18,w*.18,0,0]);c.fill();
 c.fillStyle='rgba(234,244,255,.14)';c.fillRect(x-w/2+4,ust+10,w*.18,alt-ust);c.fillStyle='rgba(20,14,50,.3)';c.fillRect(x+w*.12,ust+10,w*.38,alt-ust);
 const yuz=Math.min(dn11Surface(x-w/2),dn11Surface(x+w/2),dn11Surface(x));
 // pencereler (parça boşluğu b.bos: [üst, alt] dünya y aralığı)
 for(let yy=ust+80;yy<yuz-110;yy+=120){if(b.bos&&yy+40>b.bos[0]&&yy-40<b.bos[1])continue;dn11Pencere(c,x,yy,w*.26,w*.34,R()<.5?'yuvarlak':'kemer',Y,R);}
 c.fillStyle=DN11_TAS.koyu;dn11Yk(c,x-w/2-10,ust-6,w+20,16,7);c.fill();
 if(b.cati>0)dn11Kulah(c,x,ust-6,w+16,b.cati,DN11_CATI[(b.ci||0)%4],R,b.uc||(b.ci===2?'hilal':'top'),!!b.duz);
 else dn11Mazgal(c,x-w/2-10,x+w/2+10,ust-6,DN11_TAS.ana,'rgba(234,244,255,.3)');
}
// köprünün sağ başında yuvarlak kaya yamacı (mağaranın dışı): yumuşak kaya yumruları, tepede çimen, pastel kristal uçları
function dn11KayalikCiz(c,b,R,Y){
 const x0=b.x0,x1=b.x1,pat=c.createPattern(dn11Karo('kaya'),'repeat');
 const p=new Path2D();p.moveTo(x0+120,1200);p.bezierCurveTo(x0+60,500,x0+140,60,x0+360,-40);p.bezierCurveTo(x0+520,-120,x1-120,-200,x1+20,-260);p.lineTo(x1+20,1200);p.closePath();
 c.fillStyle=pat;c.fill(p);c.save();c.clip(p);
 for(let k=0;k<14;k++){const x=x0+150+R()*(x1-x0),y=-100+R()*700,r=40+R()*70;c.fillStyle='rgba(120,100,200,.12)';c.beginPath();c.ellipse(x,y,r*1.2,r,0,0,6.283);c.fill();}
 c.fillStyle='rgba(20,14,50,.3)';c.fillRect(x0,0,x1-x0+40,1200);c.restore();
 c.strokeStyle='#3e6476';c.lineWidth=14;c.lineCap='round';c.beginPath();c.moveTo(x0+150,300);c.bezierCurveTo(x0+150,140,x0+200,40,x0+360,-34);c.bezierCurveTo(x0+520,-112,x1-120,-192,x1+20,-252);c.stroke();
 c.strokeStyle='#5f8e98';c.lineWidth=4;c.stroke();
 for(let k=0;k<4;k++){const x=x0+260+k*120,y=200+R()*240;dn11Kristal(c,x,y,.45,k%3,R,Y);}
}
// mağara ağzı, uçurum kenarları, sis çanağı yastıkları (zemin gövdesinin önünde)
function dn11Kenarlar(c,L,Rr){
 // balkonun ucu ve terasın başı: zeminin dik kesik kenarı yuvarlak konsollarla yumuşar
 for(const [x,yon] of [[DN11_GAP0,1],[DN11_GAP1,-1]]){if(x<L-200||x>Rr+200)continue;const y=dn11Surface(x-yon*10);
  c.fillStyle='rgba(14,8,36,.35)';c.fillRect(Math.min(x,x-yon*24),y,24,900);
  for(let k=0;k<6;k++){const yy=y+28+k*46;c.fillStyle=DN11_TAS.koyu;dn11Yk(c,x-(yon>0?22:-4)-9,yy,26,30,[yon>0?4:12,yon>0?12:4,yon>0?4:12,yon>0?12:4]);c.fill();c.fillStyle='rgba(234,244,255,.15)';c.fillRect(x-(yon>0?20:-6)-9,yy+3,20,3);}
  c.fillStyle=DN11_TAS.ana;dn11Yk(c,x-yon*20-22,y-4,44,20,8);c.fill();}
 // sis çanağı: köprünün altında yumuşak lila-pembe yastıklar
 const a=267*T,b=303*T;if(b>L&&a<Rr){const Q=rng(4242);for(let k=0;k<28;k++){const x=a+Q()*(b-a),y=dn11Surface(x)+4,r=34+Q()*40,col=k%3===0?'#c8a8e8':k%3===1?'#e8b8e0':'#b8c0f0';
  c.fillStyle=dn11Mix(col,'#2a2158',.25);c.beginPath();c.ellipse(x,y,r*1.3,r*.7,0,Math.PI,0);c.fill();c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.ellipse(x-r*.3,y-r*.42,r*.5,r*.18,0,0,6.283);c.fill();}}
}

// ════════ Odalar: arka duvar, pencere boşlukları (gökyüzü görünür), tavan, lambri, sütunlar, süsler ════════
function dn11OdaCiz(c,o,xa,xb,Y,kayit){
 const R=rng(o.a*13+(xa|0)),ad=o.ad,yF=DN11_YUZ[o.a],yC=o.ad==='magara'?NaN:o.tavan;
 c.save();c.beginPath();c.rect(xa,DN11_UST,xb-xa,1200-DN11_UST);c.clip();
 if(ad==='magara'){dn11MagaraCiz(c,o,xa,xb,Y);c.restore();return;}
 if(ad==='balo'){dn11BaloCiz(c,o,xa,xb,Y,kayit);c.restore();return;}
 // üst yapı: tavanın üstünde taş kütle ve çatı kenarı (dikey ekranda kamera yükselirse görünür)
 c.fillStyle=c.createPattern(dn11Karo('tas'),'repeat');c.fillRect(xa,DN11_UST+40,xb-xa,yC-DN11_UST);
 c.fillStyle='rgba(20,14,50,.25)';c.fillRect(xa,DN11_UST+40,xb-xa,yC-DN11_UST);
 dn11Mazgal(c,o.a*T,(o.b+1)*T,DN11_UST+60,DN11_TAS.ana,'rgba(234,244,255,.28)');
 {const tc={salon:'#4a3e86',org:'#2a2260',galeri:'#4a2450',mutfak:'#7a4a72'}[ad],y0=yC-170;c.fillStyle=tc;c.fillRect(xa,y0,xb-xa,172);
  // tonoz: sığ kemer sırası (alt kenarı yuvarlak), kemer araları koyu, kemer uçlarında altın düğme
  for(let x=Math.floor(xa/160)*160;x<xb+160;x+=160){c.fillStyle=dn11Mix(tc,'#ffffff',.08);c.beginPath();c.moveTo(x,yC);c.quadraticCurveTo(x+80,yC-130,x+160,yC);c.lineTo(x+160,y0);c.lineTo(x,y0);c.closePath();c.fill();
   c.strokeStyle=dn11Mix(tc,'#d9c8ff',.35);c.lineWidth=5;c.beginPath();c.moveTo(x,yC);c.quadraticCurveTo(x+80,yC-130,x+160,yC);c.stroke();c.fillStyle='#e8c070';c.beginPath();c.arc(x,yC-4,6,0,6.283);c.fill();
   if(ad==='org'||ad==='salon'){c.fillStyle='rgba(255,231,168,.5)';dn11Yildiz5(c,x+80,yC-110,5,2.2);c.fill();}}
  c.fillStyle='rgba(16,10,40,.4)';c.fillRect(xa,y0,xb-xa,8);}
 // duvar kâğıdı
 c.fillStyle=c.createPattern(dn11Karo(ad),'repeat');c.fillRect(xa,yC,xb-xa,yF-yC+10);
 // tavana yakın gölge, alta doğru hafif koyulaşma (bir kez, parçada)
 let gr=c.createLinearGradient(0,yC,0,yC+160);gr.addColorStop(0,'rgba(16,10,40,.45)');gr.addColorStop(1,'rgba(16,10,40,0)');c.fillStyle=gr;c.fillRect(xa,yC,xb-xa,160);
 gr=c.createLinearGradient(0,yF-260,0,yF);gr.addColorStop(0,'rgba(16,10,40,0)');gr.addColorStop(1,'rgba(16,10,40,.28)');c.fillStyle=gr;c.fillRect(xa,yF-260,xb-xa,260);
 // org salonu: büyük yuvarlak vitray (renkli cam; karede ışıldar), yıldızlı kemer
 if(ad==='org'){const vx=nx(442),vy=60,vr=82;if(vx+vr>xa&&vx-vr<xb){dn11Vitray(c,vx,vy,vr);if(kayit(o))Y.vitray.push({x:vx,y:vy,r:vr});}}
 // pencereler, portreler, şamdanlar, avizeler (bu odaya düşenler)
 for(const it of Y.oda){if(it.x<o.a*T||it.x>(o.b+1)*T)continue;if(it.tip==='pencere'&&it.oda!==ad)continue;if(it.x+it.r*2<xa||it.x-it.r*2>xb)continue;dn11OdaOge(c,it,o,yC,yF,R,kayit(it));}
 // sütunlar (pilastr): oda başı ve sonu + aralarda (ayna ve parça yerleri boş)
 const bos=ad==='galeri'?[[494,514],[530,548],[484,488],[520,524]]:ad==='org'?[[432,452]]:ad==='salon'?[[215,250]]:[[555,594]];
 for(let col=o.a;col<=o.b+1;col+=1){const kenar=col===o.a||col===o.b+1;if(!kenar&&(col-o.a)%8!==0)continue;if(!kenar&&bos.some(([a,b])=>col>=a&&col<=b))continue;
  const x=col===o.b+1?col*T-14:col===o.a?col*T+14:col*T;if(x<xa-40||x>xb+40)continue;dn11Pilastr(c,x,yC,yF,kenar?34:24,ad);}
 // korniş (tavan pervazı) ve lambri (alt panel)
 c.fillStyle=ad==='mutfak'?'#e8d8ee':'#d9c8ff';c.fillRect(xa,yC,xb-xa,12);c.fillStyle='rgba(16,10,40,.3)';c.fillRect(xa,yC+12,xb-xa,4);
 for(let x=Math.floor(xa/40)*40;x<xb;x+=40){c.fillStyle=ad==='mutfak'?'#d8c0e0':'#b8a8e8';c.beginPath();c.arc(x+20,yC+14,8,0,Math.PI);c.fill();}
 const lh=ad==='mutfak'?90:118,lc={salon:'#4e4488',org:'#2a2258',galeri:'#4a2852',mutfak:'#9a6a9a'}[ad];
 c.fillStyle=lc;c.fillRect(xa,yF-lh,xb-xa,lh+10);c.fillStyle='rgba(234,244,255,.18)';c.fillRect(xa,yF-lh,xb-xa,4);c.fillStyle=ad==='mutfak'?'#e8d8ee':'#d9c8ff';c.fillRect(xa,yF-lh-8,xb-xa,8);
 for(let x=Math.floor(xa/120)*120;x<xb;x+=120){c.strokeStyle='rgba(234,244,255,.18)';c.lineWidth=2;dn11Yk(c,x+14,yF-lh+18,92,lh-36,10);c.stroke();c.fillStyle='rgba(16,10,40,.15)';dn11Yk(c,x+18,yF-lh+22,84,lh-44,8);c.fill();}
 // mutfak: raflar, asılı tencereler, çilek sepeti
 if(ad==='mutfak'){for(const [col,yy,w] of [[557,230,150],[584,220,170],[566,150,100]]){const x=nx(col);if(x+w>xa&&x-w<xb)dn11Raf(c,x,yy,w,rng(col));}
  for(const col of [593,595,597]){const x=nx(col)-20;if(x>xa-40&&x<xb+40)dn11Tencere(c,x,yC+90+(col%2)*16,1,rng(col));}}
 c.restore();
}
// dış ↔ iç geçişte kalın taş söve: dikiş yerini örter (taş sütun, başlık, kaide, tepede hilal), mağara ağzında kaya
function dn11Sove(c,x){
 const yF=Math.min(dn11Surface(x-30),dn11Surface(x+30)),w=60;
 if(x===321*T){c.fillStyle='#4a3c7c';c.beginPath();c.moveTo(x-50,yF+10);c.bezierCurveTo(x-80,300,x-20,0,x-60,DN11_UST);c.lineTo(x+70,DN11_UST);c.bezierCurveTo(x+40,100,x+70,320,x+40,yF+10);c.closePath();c.fill();
  c.fillStyle='rgba(190,170,240,.16)';c.beginPath();c.moveTo(x-40,yF);c.bezierCurveTo(x-64,300,x-8,0,x-44,DN11_UST);c.lineTo(x-30,DN11_UST);c.bezierCurveTo(x+4,0,x-50,300,x-28,yF);c.closePath();c.fill();
  c.strokeStyle='#3e6476';c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(x-56,-200);c.quadraticCurveTo(x-30,-60,x-50,40);c.stroke();return;}
 const pat=c.createPattern(dn11Karo('tas'),'repeat');c.fillStyle=pat;c.fillRect(x-w/2,DN11_UST,w,yF-DN11_UST+4);
 c.fillStyle='rgba(234,244,255,.16)';c.fillRect(x-w/2+4,DN11_UST,9,yF-DN11_UST);c.fillStyle='rgba(20,14,50,.32)';c.fillRect(x+w*.15,DN11_UST,w*.35,yF-DN11_UST);
 c.fillStyle=DN11_TAS.ac;dn11Yk(c,x-w/2-10,yF-30,w+20,30,6);c.fill();for(const yy of [yF-260,-40]){dn11Yk(c,x-w/2-10,yy,w+20,20,6);c.fill();}
 c.fillStyle='#ffe7a8';dn11Hilal(c,x,yF-300,11,1);c.fill();
}
function dn11Pilastr(c,x,yC,yF,w,ad){
 const col=ad==='org'?'#5a4e98':ad==='galeri'?'#8a5a92':ad==='mutfak'?'#e0c8e4':'#9a8ed0',ac=dn11Mix(col,'#ffffff',.25),ko=dn11Mix(col,'#140a30',.35);
 c.fillStyle=col;c.fillRect(x-w/2,yC+10,w,yF-yC);c.fillStyle=ac;c.fillRect(x-w/2+3,yC+10,w*.22,yF-yC);c.fillStyle=ko;c.fillRect(x+w*.22,yC+10,w*.28,yF-yC);
 c.fillStyle=ac;dn11Yk(c,x-w/2-6,yC+12,w+12,16,6);c.fill();c.fillStyle=col;c.beginPath();c.arc(x-w/2-2,yC+30,7,0,6.283);c.arc(x+w/2+2,yC+30,7,0,6.283);c.fill();
 c.fillStyle=ac;dn11Yk(c,x-w/2-6,yF-24,w+12,24,4);c.fill();
}
function dn11Vitray(c,x,y,r){
 c.fillStyle='#d9c8ff';c.beginPath();c.arc(x,y,r+12,0,6.283);c.fill();c.fillStyle='#2a2158';c.beginPath();c.arc(x,y,r,0,6.283);c.fill();
 const renk=['#c39bff','#a9c8ff','#ffb3d1','#9ff0d0','#ffe7a8','#ff7a9a'];
 for(let k=0;k<12;k++){const a0=k/12*6.283,a1=(k+1)/12*6.283;c.fillStyle=dn11Mix(renk[k%6],'#2a2158',.3);c.beginPath();c.moveTo(x+Math.cos(a0)*r*.42,y+Math.sin(a0)*r*.42);c.arc(x,y,r*.95,a0+.03,a1-.03);c.arc(x,y,r*.46,a1-.05,a0+.05,true);c.closePath();c.fill();}
 c.fillStyle='#ffe7a8';c.beginPath();c.arc(x,y,r*.38,0,6.283);c.fill();c.fillStyle='#fff4d6';dn11Hilal(c,x-4,y,r*.24,1);c.fill();
 c.strokeStyle='#d9c8ff';c.lineWidth=3;for(let k=0;k<12;k++){const a=k/12*6.283;c.beginPath();c.moveTo(x+Math.cos(a)*r*.4,y+Math.sin(a)*r*.4);c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.stroke();}
}
// oda öğesi: perdeli pencere (boşluk: gök görünür), portre, şamdan, avize
function dn11OdaOge(c,it,o,yC,yF,R,Y){
 const x=it.x;
 if(it.tip==='pencere'){
  const ad=it.oda,yuv=ad==='salon'||ad==='mutfak',w=yuv?70:ad==='org'?80:110,y0=yuv?yC+70:yC+60,h=yuv?70:ad==='org'?300:280;
  const yol=()=>{c.beginPath();if(yuv)c.ellipse(x,y0+h/2,w/2,h/2,0,0,6.283);else{c.moveTo(x-w/2,y0+h);c.lineTo(x-w/2,y0+w/2);c.arc(x,y0+w/2,w/2,Math.PI,0);c.lineTo(x+w/2,y0+h);c.closePath();}};
  c.fillStyle='#d9c8ff';c.save();c.translate(x,y0+h/2);c.scale((w+20)/w,(h+20)/h);c.translate(-x,-(y0+h/2));yol();c.fill();c.restore();
  c.globalCompositeOperation='destination-out';yol();c.fill();c.globalCompositeOperation='source-over';
  c.fillStyle='rgba(169,200,255,.1)';yol();c.fill();
  c.strokeStyle='#d9c8ff';c.lineWidth=3;c.beginPath();c.moveTo(x,y0);c.lineTo(x,y0+h);for(let k=1;k<(yuv?2:4);k++){const yy=y0+(yuv?h/2:w*.5+k*(h-w*.5)/4);c.moveTo(x-w/2,yy);c.lineTo(x+w/2,yy);}c.stroke();
  c.fillStyle='#b8a8e8';dn11Yk(c,x-w/2-10,y0+h,w+20,10,4);c.fill();
  if(ad==='galeri'||ad==='org')dn11Perde(c,x,y0-18,y0+h+10,w+90,ad==='galeri'?'#a8406e':'#5a3a9a');
  if(ad==='mutfak'){c.fillStyle='#ffb3d1';for(const s of [-1,1]){c.beginPath();c.moveTo(x+s*w*.55,y0-6);c.lineTo(x+s*w*.05,y0-6);c.quadraticCurveTo(x+s*w*.3,y0+h*.4,x+s*w*.55,y0+h*.5);c.closePath();c.fill();}
   c.fillStyle='rgba(255,255,255,.4)';for(let k=0;k<6;k++)c.fillRect(x-w*.55+k*w*.2,y0-6,w*.1,6);}
  if(Y)Y.isin.push({x,y:y0+h*.5,w:w,yF,ad});
 } else if(it.tip==='portre'){dn11Portre(c,x,it.y,it.w,it.h,it.kim,R);}
 else if(it.tip==='samdan'){dn11Samdan(c,x,yF-250,1,Y);}
 else if(it.tip==='avize'){dn11Avize(c,x,yC+10,yC+140,1,Y);}
}
// mağara: koyu lila kaya arka duvarı, pastel kristal damarları, yuvarlak kaya tavan ve sarkan kristaller (BL11_TAV)
function dn11MagaraCiz(c,o,xa,xb,Y){
 c.fillStyle=c.createPattern(dn11Karo('kaya'),'repeat');c.fillRect(xa,DN11_UST,xb-xa,1500);
 const Q=rng(o.a*7+(xa|0));
 for(let k=0;k<10;k++){const x=xa+Q()*(xb-xa),y=200+Q()*320,r=30+Q()*60;c.fillStyle='rgba(16,10,40,.22)';c.beginPath();c.ellipse(x,y,r*1.4,r,0,0,6.283);c.fill();}
 // arkada yuvarlak kaya sütunları (derinlik) ve aralarında daha koyu oyuklar
 for(let x=Math.floor(xa/260)*260+60;x<xb+120;x+=260){const w=70+dn11Hash(x)*50;c.fillStyle='rgba(20,14,48,.35)';c.beginPath();c.moveTo(x-w*.6,700);c.bezierCurveTo(x-w*.4,400,x-w*.7,200,x-w*.5,0);c.lineTo(x+w*.5,0);c.bezierCurveTo(x+w*.7,200,x+w*.4,400,x+w*.6,700);c.closePath();c.fill();
  c.fillStyle='rgba(190,170,240,.06)';c.beginPath();c.ellipse(x-w*.25,300,w*.15,180,0,0,6.283);c.fill();}
 {const gm=c.createLinearGradient(0,150,0,420);gm.addColorStop(0,'rgba(12,8,32,.45)');gm.addColorStop(1,'rgba(12,8,32,0)');c.fillStyle=gm;c.fillRect(xa,150,xb-xa,270);}
 // derinlik: arkada daha koyu oyuklar ve ışıklı kristal damarları
 for(let k=0;k<6;k++){const x=xa+Q()*(xb-xa),y=260+Q()*200;c.strokeStyle=DN11_KRIS[k%3][0];c.globalAlpha=.25;c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+30,y-20,x+60,y+10);c.stroke();c.globalAlpha=1;}
 // derinlik: renkli ışık lekeleri, arka kaya rafında parlayan kristaller, duvarda sevimli yarasa kabartmaları (parçaya bir kez)
 for(let x=Math.floor(xa/300)*300-300;x<xb+300;x+=300){const cx=x+dn11Hash(x*1.3)*120,fy=dn11Surface(cx);if(fy>=1200)continue;const K=DN11_KRIS[Math.floor(dn11Hash(x*.7)*3)],cy=fy-150-dn11Hash(x*2.9)*90,r=210,q=c.createRadialGradient(cx,cy,10,cx,cy,r);
  q.addColorStop(0,dn11Sef(K[0],.26));q.addColorStop(.5,dn11Sef(K[0],.1));q.addColorStop(1,dn11Sef(K[0],0));c.fillStyle=q;c.fillRect(cx-r,cy-r,r*2,r*2);}
 for(let x=Math.floor(xa/190)*190-190;x<xb+190;x+=190){const cx=x+40+dn11Hash(x*3.1)*90,fy=dn11Surface(cx);if(fy>=1200)continue;const s=.6+dn11Hash(x*1.9)*.35,by=fy-30-dn11Hash(x*5.3)*26,ci=Math.floor(dn11Hash(x*.37)*3),K=DN11_KRIS[ci];
  c.fillStyle='#40347a';c.beginPath();c.ellipse(cx,by+26,74*s,34,0,Math.PI,0);c.lineTo(cx+74*s,fy+10);c.lineTo(cx-74*s,fy+10);c.closePath();c.fill();
  c.fillStyle='rgba(190,170,240,.16)';c.beginPath();c.ellipse(cx-10*s,by,48*s,6,0,0,6.283);c.fill();
  const q=c.createRadialGradient(cx,by-30*s,4,cx,by-30*s,90*s);q.addColorStop(0,dn11Sef(K[1],.34));q.addColorStop(1,dn11Sef(K[0],0));c.fillStyle=q;c.fillRect(cx-90*s,by-120*s,180*s,180*s);
  dn11Kristal(c,cx,by+4,s,ci,rng((x|0)+77),cx>=xa&&cx<xb?Y:null);}
 for(let x=Math.floor(xa/340)*340-340;x<xb+340;x+=340){const cx=x+170+dn11Hash(x*2.3)*80,fy=dn11Surface(cx),tv=dn11Tavan(cx);if(fy>=1200||!Number.isFinite(tv))continue;const cy=Math.max(tv+150,fy-205-dn11Hash(x*4.7)*30);if(cy>fy-150||dn11Dolu(cx/T))continue;
  const s=1.1+dn11Hash(x*.9)*.4;c.save();c.translate(cx,cy);c.scale(s,s);
  c.fillStyle='rgba(190,170,240,.1)';c.beginPath();c.ellipse(0,2,56,32,0,0,6.283);c.fill();
  c.fillStyle='#7a62c0';for(const sg of [-1,1]){c.beginPath();c.moveTo(sg*8,-4);c.quadraticCurveTo(sg*26,-26,sg*46,-10);c.quadraticCurveTo(sg*40,-2,sg*42,8);c.quadraticCurveTo(sg*34,2,sg*29,10);c.quadraticCurveTo(sg*22,3,sg*16,10);c.quadraticCurveTo(sg*12,6,sg*8,8);c.closePath();c.fill();}
  c.fillStyle='#a88ae6';c.beginPath();c.arc(0,2,15,0,6.283);c.fill();for(const sg of [-1,1]){c.beginPath();c.moveTo(sg*4,-10);c.quadraticCurveTo(sg*9,-25,sg*14,-8);c.closePath();c.fill();}
  c.fillStyle='#c9b4f6';c.beginPath();c.ellipse(0,7,9,7,0,0,6.283);c.fill();
  c.fillStyle='#fff';for(const sg of [-1,1]){c.beginPath();c.arc(sg*6,-1,4.2,0,6.283);c.fill();}c.fillStyle='#3a2a6a';for(const sg of [-1,1]){c.beginPath();c.arc(sg*6,0,2.4,0,6.283);c.fill();}c.fillStyle='#fff';for(const sg of [-1,1]){c.beginPath();c.arc(sg*6-1,-1.2,1,0,6.283);c.fill();}
  c.fillStyle='rgba(255,150,190,.6)';for(const sg of [-1,1]){c.beginPath();c.ellipse(sg*11,5,3,2,0,0,6.283);c.fill();}
  c.strokeStyle='#3a2a6a';c.lineWidth=1.4;c.lineCap='round';c.beginPath();c.arc(0,5,4,Math.PI*.15,Math.PI*.85);c.stroke();c.restore();}
 // tavan kütlesi: tavan çizgisinin üstü daha koyu kaya, alt kenar yuvarlak yumrular, sarkan yuvarlak uçlu kristaller
 const tp=new Path2D();tp.moveTo(xa-40,DN11_UST);for(let x=Math.floor(xa/20)*20-20;x<=xb+40;x+=20){const tv=dn11Tavan(x);tp.lineTo(x,(Number.isFinite(tv)?tv:-100)+Math.sin(x*.07)*8);}tp.lineTo(xb+40,DN11_UST);tp.closePath();
 c.fillStyle='#2a2050';c.fill(tp);
 // tavan kütlesinde gizli kristal oyukları (geod) ve yıldız gibi minik parıltılar: boş karanlık kalmasın (statik, parçaya bir kez)
 {const G=rng((xa|0)*3+11);
  for(let x=Math.floor(xa/110)*110+30;x<xb+40;x+=110){const tv=dn11Tavan(x);if(!Number.isFinite(tv))continue;const top=DN11_UST+60,bot=tv-50;if(bot<top+20)continue;
   const gx=x+(dn11Hash(x)-.5)*50,gy=bot-dn11Hash(x*1.7)*Math.min(130,bot-top),K=DN11_KRIS[Math.floor(dn11Hash(x*2.3)*3)],s=.55+dn11Hash(x*4.1)*.55;
   c.fillStyle='#1e1640';c.beginPath();c.ellipse(gx,gy,26*s,18*s,0,0,6.283);c.fill();
   c.fillStyle='rgba(190,170,240,.18)';c.beginPath();c.ellipse(gx,gy+14*s,24*s,5*s,0,0,6.283);c.fill();
   for(let j=-1;j<=1;j++){c.fillStyle=j?K[0]:K[1];c.beginPath();c.moveTo(gx+j*10*s-5*s,gy+12*s);c.lineTo(gx+j*10*s-4*s,gy-(j?8:14)*s);c.quadraticCurveTo(gx+j*10*s,gy-(j?13:19)*s,gx+j*10*s+4*s,gy-(j?8:14)*s);c.lineTo(gx+j*10*s+5*s,gy+12*s);c.closePath();c.fill();}
   c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.arc(gx-2*s,gy-8*s,1.8,0,6.283);c.fill();}
  for(let k=0,n=Math.ceil((xb-xa)/40);k<n;k++){const x=xa+G()*(xb-xa),tv=dn11Tavan(x);if(!Number.isFinite(tv))continue;const y=tv-40-G()*Math.min(320,Math.max(0,tv-DN11_UST-40));
   c.fillStyle=DN11_TOZ[k%8];c.globalAlpha=.25+G()*.4;c.beginPath();c.arc(x,y,1+G()*1.6,0,6.283);c.fill();}
  c.globalAlpha=1;}
 for(let x=Math.floor(xa/36)*36;x<xb+36;x+=36){const tv=dn11Tavan(x);if(!Number.isFinite(tv))continue;const r=18+dn11Hash(x)*14;c.fillStyle='#342a5e';c.beginPath();c.arc(x,tv+Math.sin(x*.07)*8,r,0,Math.PI);c.fill();c.fillStyle='rgba(190,170,240,.12)';c.beginPath();c.ellipse(x-r*.2,tv+r*.5,r*.5,r*.18,0,0,6.283);c.fill();}
 for(let x=Math.floor(xa/90)*90+40;x<xb;x+=90){const tv=dn11Tavan(x);if(!Number.isFinite(tv))continue;if(Math.abs(x-nx(388))<120||Math.abs(x-nx(350))<50||Math.abs(x-nx(384))<50)continue;
  dn11Sarkit(c,x,tv+6,.8+dn11Hash(x*3)*.5,Math.floor(dn11Hash(x)*3),rng(x|0),Y);}
 // asılı ay ışığı fenerleri: ince zincir, altın başlık, içinde ışık topu (alev değil)
 for(let x=Math.floor(xa/230)*230-230;x<xb+230;x+=230){const cx=x+115+dn11Hash(x*6.1)*50,tv=dn11Tavan(cx),fy=dn11Surface(cx);if(!Number.isFinite(tv)||fy>=1200||dn11Dolu(cx/T))continue;
  const L=70+dn11Hash(x*2.1)*60,ly=tv+L;if(ly>fy-190)continue;const altin=dn11Hash(x*8.3)<.6,col=altin?'255,226,150':'200,226,255';
  c.strokeStyle='#8a7ab8';c.lineWidth=1.6;c.setLineDash([3,3]);c.beginPath();c.moveTo(cx,tv);c.lineTo(cx,ly-16);c.stroke();c.setLineDash([]);
  const q=c.createRadialGradient(cx,ly,3,cx,ly,58);q.addColorStop(0,'rgba('+col+',.5)');q.addColorStop(.4,'rgba('+col+',.16)');q.addColorStop(1,'rgba('+col+',0)');c.fillStyle=q;c.fillRect(cx-58,ly-58,116,116);
  c.fillStyle='#d8b060';c.beginPath();c.moveTo(cx-11,ly-12);c.quadraticCurveTo(cx,ly-24,cx+11,ly-12);c.closePath();c.fill();c.beginPath();c.arc(cx,ly-20,2.6,0,6.283);c.fill();dn11Yk(c,cx-8,ly+11,16,4,2);c.fill();
  c.fillStyle='rgba(90,78,150,.7)';c.beginPath();c.arc(cx,ly,12,0,6.283);c.fill();c.strokeStyle='#d8b060';c.lineWidth=1.6;c.stroke();
  c.fillStyle='rgba('+col+',.95)';c.beginPath();c.arc(cx,ly,6.5,0,6.283);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(cx-2,ly-2,2.4,0,6.283);c.fill();
  if(Y&&cx>=xa&&cx<xb)Y.orb.push({x:cx,y:ly,r:12,ph:dn11Hash(cx)*6.283,ic:1});}
 // ağız ve çıkış: kenarlarda daha açık kaya kemeri
 for(const [ex,yon] of [[o.a*T,1],[(o.b+1)*T,-1]]){if(ex<xa-160||ex>xb+160)continue;c.fillStyle='#4a3c7c';c.beginPath();c.moveTo(ex,1200);c.lineTo(ex,DN11_UST);c.lineTo(ex+yon*90,DN11_UST);c.bezierCurveTo(ex+yon*60,200,ex+yon*110,400,ex+yon*50,1200);c.closePath();c.fill();
  c.fillStyle='rgba(190,170,240,.14)';c.beginPath();c.moveTo(ex+yon*10,DN11_UST);c.bezierCurveTo(ex+yon*30,200,ex+yon*60,420,ex+yon*20,1200);c.lineTo(ex+yon*8,1200);c.closePath();c.fill();}
}
// balo salonu: açık kemerler (gökyüzü görünür), uzun sütunlar, cam kubbe kaburgaları, sütun arası korkuluk; kule terasından girilir
function dn11BaloCiz(c,o,xa,xb,Y,kayit){
 const yF=DN11_YUZ[o.a+2],a=o.a*T,b=(o.b+1)*T,ys=60,ra=200;
 // kubbe kaburgaları (ince altın çizgiler; camlar saydam) ve kubbe tepesi bandı
 const kx=(a+b)/2,kr=(b-a)*.62;c.strokeStyle='rgba(232,192,112,.55)';c.lineWidth=5;
 for(let k=0;k<=12;k++){const u=k/12;c.beginPath();c.moveTo(lerp(a-40,b+40,u),ys-ra);c.quadraticCurveTo(lerp(a-40,b+40,u)*.6+kx*.4,DN11_UST-200,kx,DN11_UST-260);c.stroke();}
 c.strokeStyle='rgba(234,244,255,.18)';c.lineWidth=2;for(let k=1;k<4;k++){c.beginPath();c.ellipse(kx,ys-ra+30,kr*(1-k*.18),(ys-ra-DN11_UST+60)*(1-k*.22),0,Math.PI,0);c.stroke();}
 // alçak mermer duvar (korkuluk altı) ve korkuluk
 c.fillStyle=c.createPattern(dn11Karo('balo'),'repeat');c.fillRect(xa,yF-70,xb-xa,80);c.fillStyle='rgba(16,10,40,.2)';c.fillRect(xa,yF-70,xb-xa,80);
 c.fillStyle='#e8e0f8';c.fillRect(xa,yF-110,xb-xa,12);for(let x=Math.floor(xa/22)*22;x<xb;x+=22){c.fillStyle='#d0c8ec';c.beginPath();c.moveTo(x+5,yF-98);c.quadraticCurveTo(x-2,yF-84,x+6,yF-72);c.lineTo(x+16,yF-72);c.quadraticCurveTo(x+24,yF-84,x+17,yF-98);c.closePath();c.fill();}
 // sütunlar ve kemerler: ortada (808..844) büyük açıklık — balo ayı (balo11, o.x, zeminin 430 üstü) kocaman yuvarlak ay penceresinden görünür
 const SUT=[786,797,808,844,855,866,877].map(q=>q*T+20),cx=nx(826),ayY=yF-430;
 for(let i=0;i<SUT.length;i++){const x=SUT[i],buyuk=i===2||i===3;if(x<xa-760||x>xb+760)continue;const w=buyuk?60:44;
  c.fillStyle='#c8bfe8';dn11Yk(c,x-w/2,ys,w,yF-ys,4);c.fill();c.fillStyle='rgba(255,255,255,.3)';c.fillRect(x-w/2+5,ys,8,yF-ys);c.fillStyle='rgba(40,30,90,.25)';c.fillRect(x+w*.18,ys,w*.27,yF-ys);
  c.strokeStyle='rgba(140,120,200,.4)';c.lineWidth=2;for(const dx of [-8,0,8]){c.beginPath();c.moveTo(x+dx,ys+30);c.lineTo(x+dx,yF-30);c.stroke();}
  c.fillStyle='#e8e0f8';dn11Yk(c,x-w/2-10,ys-14,w+20,22,6);c.fill();c.fillStyle='#e8c070';c.beginPath();c.arc(x-w/2+2,ys-2,8,0,6.283);c.arc(x+w/2-2,ys-2,8,0,6.283);c.fill();
  c.fillStyle='#e8e0f8';dn11Yk(c,x-w/2-8,yF-26,w+16,26,4);c.fill();
  const xn=SUT[i+1];if(xn&&i!==2&&xn>x+60){c.strokeStyle='#e8e0f8';c.lineWidth=18;c.beginPath();c.ellipse((x+xn)/2,ys-10,(xn-x)/2,ra*.8,0,Math.PI,0);c.stroke();c.strokeStyle='#e8c070';c.lineWidth=3;c.stroke();
   c.fillStyle='#ffe7a8';dn11Yildiz5(c,(x+xn)/2,ys-10,8,3.5);c.fill();}}
 // büyük orta kemer + yuvarlak ay penceresi çerçevesi (camsız halka, kenarında yıldızlar; Ay içinden görünür)
 if(cx+800>xa&&cx-800<xb){const x0=SUT[2],x1=SUT[3];c.strokeStyle='#e8e0f8';c.lineWidth=24;c.beginPath();c.ellipse(cx,ys-10,(x1-x0)/2,330,0,Math.PI,0);c.stroke();c.strokeStyle='#e8c070';c.lineWidth=4;c.stroke();
  const rr=146;c.strokeStyle='rgba(232,224,248,.9)';c.lineWidth=9;c.beginPath();c.arc(cx,ayY,rr,0,6.283);c.stroke();c.strokeStyle='#e8c070';c.lineWidth=2.4;c.beginPath();c.arc(cx,ayY,rr+7,0,6.283);c.stroke();
  for(let k=0;k<16;k++){const a2=k/16*6.283;c.fillStyle=k%2?'#ffe7a8':'#eaf4ff';dn11Yildiz5(c,cx+Math.cos(a2)*rr,ayY+Math.sin(a2)*rr,k%2?6:4,k%2?2.6:1.8);c.fill();}
  c.fillStyle='#ffe7a8';dn11Hilal(c,cx,ys-10-330,16,1);c.fill();}
 // avizeler
 for(const it of Y.oda)if(it.tip==='avize'&&it.x>a&&it.x<b&&it.x+150>xa&&it.x-150<xb)dn11Avize(c,it.x,ys-170,ys+70,1.2,kayit(it));
 // terasın taş korkuluğu (765..784) dışarıda; burada salonun girişinde yuvarlak kemerli kapı süsü
}

// ════════ Yüzey dudağı (bölgeye göre) ════════
function dn11Dudak(c,L,Rr){
 const zon=x=>{const b=dn11Bolge(x);return b==='giris'||b==='bahce'?0:b==='magara'?2:b==='kopru'?(x>=267*T&&x<303*T?3:0):1;};
 // çimen (bahçe): koyu gölge, ana renk, ay ışığında gümüş-yeşil üst
 for(const [col,dy,rx,ry] of [['rgba(20,14,50,.55)',9,13,8],['#2e5468',3,12,7.5],['#4e8090',-1,8,3]]){c.fillStyle=col;
  for(let x=Math.floor(L/12)*12-12;x<Rr+12;x+=12){const xx=x+6,y=dn11Surface(xx);if(y>=1200||zon(xx)!==0&&zon(xx)!==3)continue;const w=dn11Hash(xx*.37);c.beginPath();c.ellipse(xx,y+dy-1+w*2,rx+w*3,ry+w*1.5,0,0,6.283);c.fill();}}
 c.lineCap='round';
 for(let x=Math.floor(L/7)*7;x<Rr;x+=7){const y=dn11Surface(x);if(y>=1200||(zon(x)!==0&&zon(x)!==3))continue;const h=dn11Hash(x*1.3);if(h<.35)continue;const hh=5+h*9,an=(dn11Hash(x*2.1)-.5)*.6;
  c.strokeStyle=h>.8?'#7ab0b0':'#3e6a7a';c.lineWidth=2;c.beginPath();c.moveTo(x,y+2);c.quadraticCurveTo(x+an*6,y-hh*.6,x+an*10,y-hh);c.stroke();}
 // oda zeminleri: bölgeye göre döşeme
 for(let x=Math.floor(L/40)*40-40;x<Rr+40;x+=40){const xx=x+20,y=dn11Surface(xx);if(y>=1200||zon(xx)!==1)continue;const b=dn11Bolge(xx),h=dn11Hash(xx*.71),k=(xx/40|0)%2;
  if(b==='salon'||b==='balo'){c.fillStyle=k?'#b8acdf':'#8a7cc0';if(b==='balo')c.fillStyle=k?'#e0d8f4':'#b4aadc';c.fillRect(x,y,40,16);c.fillStyle=k?'#8a7cc0':'#b8acdf';if(b==='balo')c.fillStyle=k?'#b4aadc':'#e0d8f4';c.fillRect(x,y+16,40,14);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(x+2,y+1,36,2);}
  else if(b==='org'||b==='galeri'){c.fillStyle=h<.5?'#6a4a6a':'#5e4060';c.fillRect(x,y,40,30);c.strokeStyle='rgba(20,10,30,.4)';c.lineWidth=1;c.beginPath();c.moveTo(x,y+15);c.lineTo(x+40,y+15);c.moveTo(x+(h*30|0),y);c.lineTo(x+(h*30|0),y+15);c.moveTo(x+((h*53|0)%40),y+15);c.lineTo(x+((h*53|0)%40),y+30);c.stroke();c.fillStyle='rgba(255,230,240,.18)';c.fillRect(x,y,40,2);}
  else if(b==='mutfak'){for(let j=0;j<2;j++){c.fillStyle=(k+j)%2?'#f0d8e6':'#d8a8c4';c.fillRect(x+j*20,y,20,14);c.fillStyle=(k+j)%2?'#d8a8c4':'#f0d8e6';c.fillRect(x+j*20,y+14,20,14);}c.fillStyle='rgba(255,255,255,.25)';c.fillRect(x,y,40,2);}
  else{c.fillStyle=h<.5?'#8e84bc':'#857bb4';dn11Yk(c,x+1,y-1,38,14,5);c.fill();c.fillStyle='rgba(234,244,255,.3)';c.fillRect(x+4,y,30,2);c.fillStyle=h>.5?'#6a60a0':'#635a9a';dn11Yk(c,x-19+(h>.3?20:0),y+13,38,13,5);c.fill();}
 }
 // halı yolları: org ve galeride uzun gece mavisi / çilek halı, altın kenar
 for(const [a,b,col] of [[425*T,462*T,'#4a3a9a'],[468*T,549*T,'#a8406e'],[214*T,251*T,'#5a4aa0'],[788*T,876*T,'#7a5ab0']]){const xa=Math.max(L,a),xb=Math.min(Rr,b);if(xb<=xa)continue;const y=dn11Surface((xa+xb)/2);
  c.fillStyle=col;c.fillRect(xa,y-3,xb-xa,12);c.fillStyle='#e8c070';c.fillRect(xa,y-3,xb-xa,2);c.fillRect(xa,y+7,xb-xa,2);c.fillStyle='rgba(255,231,168,.35)';for(let x=Math.ceil(xa/30)*30;x<xb;x+=30){c.beginPath();c.arc(x,y+3,2,0,6.283);c.fill();}}
 // mağara: yuvarlak kaya dudağı, minik ışıltılı çakıllar
 for(let x=Math.floor(L/16)*16-16;x<Rr+16;x+=16){const xx=x+8,y=dn11Surface(xx);if(y>=1200||zon(xx)!==2)continue;const h=dn11Hash(xx*.53);c.fillStyle=h<.5?'#4a3c7c':'#544686';c.beginPath();c.ellipse(xx,y+4,11+h*4,7,0,0,6.283);c.fill();c.fillStyle='rgba(200,180,255,.2)';c.beginPath();c.ellipse(xx-2,y+1,6,2,0,0,6.283);c.fill();}
 // balkon ve teras: korkuluk (taş babalar)
 for(const [a,b] of [[599*T,DN11_GAP0],[DN11_GAP1,785*T]]){const xa=Math.max(L,a),xb=Math.min(Rr,b);if(xb<=xa)continue;const y=dn11Surface((a+b)/2);
  c.fillStyle='#b4aadf';c.fillRect(xa,y-96,xb-xa,12);c.fillStyle='rgba(255,255,255,.3)';c.fillRect(xa,y-96,xb-xa,3);
  for(let x=Math.ceil(xa/24)*24;x<xb;x+=24){c.fillStyle='#9a90c8';c.beginPath();c.moveTo(x-6,y-84);c.quadraticCurveTo(x-13,y-60,x-6,y-40);c.quadraticCurveTo(x-12,y-18,x-7,y);c.lineTo(x+7,y);c.quadraticCurveTo(x+12,y-18,x+6,y-40);c.quadraticCurveTo(x+13,y-60,x+6,y-84);c.closePath();c.fill();}
  c.fillStyle='#8e84bc';c.fillRect(xa,y-6,xb-xa,8);}
 // basamak kenarları (bahçe yokuşu): taş merdiven yüzü
 for(let q=Math.max(1,Math.floor(L/T));q<=Math.min(COLS-1,Math.ceil(Rr/T));q++){const a=DN11_YUZ[q-1],b=DN11_YUZ[q];if(a===b||a>=1200||b>=1200)continue;const x=q*T,up=Math.min(a,b),dn=Math.max(a,b),z=zon(x-1);if(z!==0)continue;
  c.fillStyle=DN11_TAS.ana;dn11Yk(c,x-14,up-2,28,dn-up+6,6);c.fill();c.fillStyle='rgba(234,244,255,.3)';c.fillRect(x-12,up,24,3);}
}
// küçük süsler
function dn11KucukCiz(c,s,Y){
 const R=rng((s.x*7|0)+3);
 switch(s.tip){
  case 'ot':{const x=s.x,y=s.y+2;c.strokeStyle='#3e6a7a';c.lineWidth=2.2;c.lineCap='round';for(let k=0;k<5;k++){const a=-1.57+(k-2)*.32+(R()-.5)*.2,L=10+R()*14;c.beginPath();c.moveTo(x+(k-2)*3,y);c.quadraticCurveTo(x+(k-2)*3+Math.cos(a)*L*.4,y+Math.sin(a)*L*.6,x+(k-2)*3+Math.cos(a)*L,y+Math.sin(a)*L);c.stroke();}break;}
  case 'topcuk':{const p=new Path2D(),r=22*s.s;p.arc(0,0,r,0,6.283);c.save();c.translate(s.x,s.y-r*.8);dn11Yaprak(c,p,0,0,r,r,R,DN11_YAP);c.restore();break;}
  case 'kabak':{const x=s.x,y=s.y+3,w=20*s.s,h=15*s.s;c.fillStyle='#8a4a5a';c.beginPath();c.ellipse(x,y-h,w,h,0,0,6.283);c.fill();c.fillStyle='#c0704a';for(const k of [-.45,0,.45]){c.beginPath();c.ellipse(x+k*w,y-h,w*.45,h*.95,0,0,6.283);c.fill();}c.fillStyle='#4a7a5a';c.fillRect(x-1.5,y-h*2.2,3,h*.5);break;}
  case 'tas':{c.fillStyle='#6a62a0';c.beginPath();c.ellipse(s.x,s.y+3,14,5,0,0,6.283);c.fill();c.fillStyle='rgba(234,244,255,.25)';c.beginPath();c.ellipse(s.x-3,s.y+1,7,2,0,0,6.283);c.fill();break;}
  case 'kristalcik':dn11Kristal(c,s.x,s.y+4,s.s,s.ci,R,Y);break;
  case 'cakil':for(let k=0;k<3;k++){c.fillStyle=k%2?'#5a4c8c':'#4a3e7c';c.beginPath();c.ellipse(s.x+(k-1)*9,s.y+1,5,3.4,0,0,6.283);c.fill();}break;
  case 'sepet':{const x=s.x,y=s.y;c.fillStyle='#b88a6a';dn11Yk(c,x-16,y-18,32,18,6);c.fill();c.strokeStyle='#8a6a4a';c.lineWidth=1.2;for(let k=-12;k<14;k+=6){c.beginPath();c.moveTo(x+k,y-18);c.lineTo(x+k,y);c.stroke();}
   for(let k=0;k<5;k++){c.fillStyle='#ff4f7a';c.beginPath();c.arc(x-10+k*5,y-20-(k%2)*4,4.4,0,6.283);c.fill();}c.strokeStyle='#8a6a4a';c.lineWidth=2;c.beginPath();c.arc(x,y-18,14,Math.PI,0);c.stroke();break;}
  case 'saksi':{const x=s.x,y=s.y;c.fillStyle='#b88aac';c.beginPath();c.moveTo(x-12,y-22);c.lineTo(x+12,y-22);c.lineTo(x+9,y);c.lineTo(x-9,y);c.fill();const p=new Path2D();p.arc(0,0,16,0,6.283);c.save();c.translate(x,y-34);dn11Yaprak(c,p,0,0,16,16,R,DN11_YAP);c.restore();break;}
 }
}
// tek yönlü platformlar: köprü kalasları, budanmış çit kütlesi, kristal çıkıntı, pencere pervazı
function dn11PlatCiz(c,p,Y){
 const R=rng(p.seed),w=p.x1-p.x0,cx=(p.x0+p.x1)/2;
 if(p.tur==='kopru'){
  // direkler, korkuluk halatları (sarkan), kalaslar
  const pa=p.x0-12,pb=p.x1+12,y=p.y;
  for(const x of [pa,pb]){c.fillStyle='#6a4a6a';dn11Yk(c,x-9,y-110,18,130,6);c.fill();c.fillStyle='#8a6a8a';c.fillRect(x-6,y-106,5,120);c.fillStyle='#e8c070';c.beginPath();c.arc(x,y-116,8,0,6.283);c.fill();}
  if(!DN11.kopru)DN11.kopru={pa,pb,x0:p.x0,x1:p.x1,y,k:0,v:0};   // kalaslar ve halatlar karede (dn11Kopru): Feza basınca yaylanır
 } else if(p.tur==='kristal'){
  // kristal çıkıntı: yamuk kaya tabla, altında kristaller, üstü düz
  c.fillStyle='#4a3c7c';c.beginPath();c.moveTo(p.x0-8,p.y);c.lineTo(p.x1+8,p.y);c.quadraticCurveTo(p.x1,p.y+40,cx+10,p.tab+4);c.lineTo(cx-10,p.tab+4);c.quadraticCurveTo(p.x0,p.y+40,p.x0-8,p.y);c.fill();
  c.fillStyle='#5e4e94';dn11Yk(c,p.x0-8,p.y-2,w+16,12,6);c.fill();c.fillStyle='rgba(234,244,255,.3)';c.fillRect(p.x0,p.y-1,w,2);
  dn11Kristal(c,p.x0+8,p.y+10,.35,R()*3|0,R,null,true);dn11Kristal(c,p.x1-8,p.y+8,.3,R()*3|0,R,null,true);
  dn11Kristal(c,cx,p.y-6,.4,R()*3|0,R,Y);
 } else if(p.tur==='pervaz'){
  // pencere pervazı: krem taş raf, altında kıvrık konsollar, üstünde minik saksı
  c.fillStyle='#d9c8ff';dn11Yk(c,p.x0-10,p.y,w+20,14,5);c.fill();c.fillStyle='rgba(255,255,255,.35)';c.fillRect(p.x0-6,p.y+1,w+12,3);
  for(const x of [p.x0+12,p.x1-12]){c.fillStyle='#b8a8e8';c.beginPath();c.moveTo(x-8,p.y+14);c.quadraticCurveTo(x+10,p.y+20,x,p.y+44);c.quadraticCurveTo(x-6,p.y+30,x-8,p.y+14);c.fill();}
 } else {
  // budanmış çit kütlesi: zemine kadar yeşil blok, üstü düz, köşeleri yuvarlak
  const p2=new Path2D();if(p2.roundRect)p2.roundRect(p.x0-6,p.y-4,w+12,p.tab-p.y+8,[14,14,4,4]);else p2.rect(p.x0-6,p.y-4,w+12,p.tab-p.y+8);
  c.save();dn11Yaprak(c,p2,cx,(p.y+p.tab)/2,w/2+10,(p.tab-p.y)/2+8,R,DN11_YAP);c.restore();
  c.fillStyle='rgba(122,176,176,.4)';dn11Yk(c,p.x0,p.y-3,w,4,2);c.fill();
 }
}

// ════════ Karede çizim: zemin parçaları ════════
function dn11Terrain(){
 g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);const a=Math.max(0,Math.floor(cam.x/DN11_CW)),b=Math.min(Math.ceil(COLS*T/DN11_CW),Math.floor((cam.x+VW)/DN11_CW));
 const ya=cam.y-2,yb=cam.y+H/S+2;DN11.zeminKare=DN11.kare;
 for(let i=a;i<=b;i++){const cv=dn11Chunk(i),o=cv.ust,y0=Math.max(o,Math.floor(ya)),y1=Math.min(1200,Math.ceil(yb));if(y1>y0)g.drawImage(cv,0,y0-o,cv.width,y1-y0,i*DN11_CW-2,y0,cv.width,y1-y0);}
 const yon=(typeof P!=='undefined'&&P.vx<-20)?-1:1,next=yon>0?b+1:a-1;if(next>=0&&next*DN11_CW<COLS*T&&!DN11.chunks.has(next))dn11Chunk(next);
}
// zemin parçalarının kesin örttüğü en üst ekran y'si (son karede zemin çizildiyse); odalarda duvar ekranı tümüyle örter (pencereler hariç)
function dn11ZeminAlt(vh){
 if(DN11.zeminKare!==DN11.kare-1)return vh;
 const yb=1200-cam.y;if(yb<vh)return vh;let m=-1e9;
 for(let x=cam.x-8;x<=cam.x+VW+8;x+=16){const y=dn11Surface(x);if(y>=1200)return vh;if(y>m)m=y;}
 return Math.min(vh,m-cam.y+4);
}
function dn11Bas(L,x){let a=0,b=L.length;while(a<b){const m=(a+b)>>1;if(L[m].x<x)a=m+1;else b=m;}return a;}

// ════════ Ay konumu: normalde sağ üstte bulutların ardında; uçuşta kocaman; finalde ortada, tam ve gülen ════════
const DN11_AYX=nx(690);
function dn11AyHesap(tm,vw,vh){
 const cx=cam.x+VW*.5,w=smooth(clamp((cx-(DN11_GAP0-700))/1100,0,1))*(1-smooth(clamp((cx-(DN11_GAP1-200))/900,0,1)));
 const nxs=vw*.77,nys=vh*.19-cam.y*.01,nr=Math.min(vh*.13,86);
 const pxs=vw*.5+(DN11_AYX-cx)*.12,pys=vh*.38,pr=Math.min(vh*.32,226);
 const fxs=vw*.56,fys=vh*.2,fr=Math.min(vh*.22,170),f=typeof BALO11!=='undefined'&&BALO11&&BALO11.ay?0:DN11.fin;
 const A=DN11.ay11;A.w=w;A.sx=lerp(lerp(nxs,pxs,w),fxs,f);A.sy=lerp(lerp(nys,pys,w),fys,f)+Math.sin(tm*.3)*2.5;A.sr=lerp(lerp(nr,pr,w),fr,f);
 // uçuş (ucus11.js UCUS11.ay(): {x, y, r, a} dünya) ayın konumunu verirse yumuşakça onunla birleş (siluet anı)
 if(typeof UCUS11!=='undefined'&&UCUS11&&typeof UCUS11.ay==='function'){let U=null;try{U=UCUS11.ay();}catch(e){U=null;}
  if(U&&Number.isFinite(U.x)&&Number.isFinite(U.y)&&Number.isFinite(U.r)){const a=clamp(Number.isFinite(U.a)?U.a:1,0,1);A.sx=lerp(A.sx,U.x-cam.x,a);A.sy=lerp(A.sy,U.y-cam.y,a);A.sr=lerp(A.sr,U.r,a);A.w=Math.max(A.w,a);}}
 // açıklık: bulutlar aynalar döndükçe biraz aralanır; uçuşta çoğu açılır; finalde tamamen dağılır
 A.ac=clamp(.1+DN11.renk*.32+w*.4+f,0,1);
 // başka modül kendi ayını çiziyorsa (uçuşta ay anı: UCUS11.ayA; finalde balo ayı: BALO11.ay.a) gökteki ayımız söner: iki ay olmasın
 let giz=0;if(typeof UCUS11!=='undefined'&&UCUS11&&typeof UCUS11.ayA==='function'){try{giz=clamp(+UCUS11.ayA()||0,0,1);}catch(e){giz=0;}}
 if(typeof BALO11!=='undefined'&&BALO11&&BALO11.ay&&DN11.finT!==null)giz=Math.max(giz,smooth(clamp((now-DN11.finT)/1.5,0,1)),clamp(+BALO11.ay.a||0,0,1));
 A.giz=giz;A.x=cam.x+A.sx;A.y=cam.y+A.sy;A.r=A.sr;return A;
}
function dn11Ay(){const A=DN11.ay11;return {x:A.x,y:A.y,r:A.r,acik:A.ac};}

// ════════ Arka plan ════════
function dn11YerKay(vh){
 if(DN11.ykKare===DN11.kare)return DN11.yk||0;DN11.ykKare=DN11.kare;
 const x=cam.x+(W/S)*.5;let y=dn11Surface(x);if(y>=1200){const a=dn11Surface(x-260),b=dn11Surface(x+260);y=Math.min(a,b);}
 const hedef=y>=1200?0:Math.max(0,y-cam.y-vh*.885),k=Number.isFinite(DN11.yk)?DN11.yk:hedef;
 DN11.yk=Math.abs(hedef-k)<.5?hedef:k+(hedef-k)*.14;return DN11.yk;
}
const DN11_SIRA4=[0,1,2,3],DN11_SIRA5=[0,1,2,4,3];
function dn11Backdrop(tm){
 const vw=W/S,vh=H/S,F=dn11FxArt(),sb=DN11.sabah,gece=1-sb,A=dn11AyHesap(tm,vw,vh),pw=A.w;
 const tab=DN11.tab||(DN11.tab=[0,0,0,0,0]),yZ=dn11ZeminAlt(vh),sira=pw>.005?DN11_SIRA5:DN11_SIRA4;
 let aaH=0;if(typeof UCUS11!=='undefined'&&UCUS11&&typeof UCUS11.ayAni==='function'){try{aaH=clamp(+UCUS11.ayAni()||0,0,1);}catch(e){aaH=0;}}
 DN11.ayAniS+=(aaH-DN11.ayAniS)*.06;if(Math.abs(DN11.ayAniS-aaH)<.002)DN11.ayAniS=aaH;const aa=smooth(DN11.ayAniS)*vh*.14;
 const yk=dn11YerKay(vh)*(1-pw);
 for(let l=0;l<5;l++)tab[l]=DN11_SB[l]-cam.y*DN11_SYF[l]+pw*[70,60,40,20,50][l]+[0,0,pw*110,pw*360,(1-pw)*560][l]+(l===3?0:aa)+yk*[0,0,.45,.7,0][l];
 const ort=DN11.ort||(DN11.ort=[0,0,0,0,0]);for(let i=0;i<sira.length;i++){let m=yZ;for(let j=i+1;j<sira.length;j++)if(tab[sira[j]]<m)m=tab[sira[j]];ort[sira[i]]=m;}
 let gokAlt=yZ;for(let i=0;i<sira.length;i++)if(tab[sira[i]]<gokAlt)gokAlt=tab[sira[i]];
 // gök (yalnız görünen üst kısım)
 g.setTransform(1,0,0,1,0,0);const gu=clamp(gokAlt/vh,0,1);
 if(gu>0){const hh=Math.ceil(H*gu)+2;if(sb<.996)g.drawImage(DN11.sky,0,0,768,Math.min(600,600*hh/H),0,0,W,Math.min(H,hh));
  if(sb>.004){g.globalAlpha=sb;g.drawImage(DN11.dawn,0,0,768,Math.min(600,600*hh/H),0,0,W,Math.min(H,hh));g.globalAlpha=1;}}
 g.setTransform(S,0,0,S,0,0);
 // ışıldayan yıldızlar
 g.globalCompositeOperation='lighter';
 for(let i=0;i<DN11_STARS.length;i++){const s=DN11_STARS[i],y=s.y*vh;if(y>gokAlt)continue;const a=gece*(.35+.4*Math.sin(tm*s.sp+s.ph))*(1+DN11.fin*.3),x=s.x*vw;
  dn11Glow(s.col,x,y,s.r*5,s.r*5,a*.5);if(s.yil&&a>.4){const r=s.r*4.5*(a+.3);g.globalAlpha=a*.8;g.drawImage(F.parilti,x-r,y-r,r*2,r*2);g.globalAlpha=1;}}
 // ay: gümüş hâle (açıklıkla büyür), disk, yüz (uykulu → gülen), önünde aralanan bulut kümeleri
 const gor=gece*(1-A.giz);
 if(gor>.02){const r=A.sr,x=A.sx,y=A.sy+sb*vh*.18,ac=A.ac,gece=gor;
  dn11Glow('#a9c8ff',x,y,r*(3+ac*1.6),r*(3+ac*1.6),(.08+ac*.16+pw*.06)*gece);dn11Glow('#eaf4ff',x,y,r*1.8,r*1.8,(.12+ac*.3)*gece);dn11Glow('#ffd2e8',x,y+r*.4,r*2.6,r*1.6,.05*gece*(1+DN11.fin));
  g.globalCompositeOperation='source-over';
  const k=r/DN11_AYR,n=DN11.ay.width,pa=smooth(clamp((pw-.15)/.7,0,1));g.globalAlpha=gece*(.93+.07*ac);g.drawImage(DN11.ay,x-n/2*k,y-n/2*k,n*k,n*k);
  const Yz=DN11.yuz,Ym=DN11.yuzM,yy=y-(Yz.kok+DN11_AYR*.36*pa)*k,mu=smooth(clamp(DN11.fin*1.4,0,1));
  if(mu<.99){g.globalAlpha=gece*(.9+.1*ac)*(1-mu);g.drawImage(Yz,x-Yz.width/2*k,yy,Yz.width*k,Yz.height*k);}
  if(mu>.01){g.globalAlpha=gece*mu;g.drawImage(Ym,x-Ym.width/2*k,yy,Ym.width*k,Ym.height*k);}
  g.globalAlpha=1;
  // örtü bulutları: açıklık 0'da ayın önünde, arttıkça iki yana kayıp incelir
  const kap=1-ac;if(kap>.01){for(let j=0;j<3;j++){const yon=j===1?1:-1,dx=(j===2?.1:yon*.3)*r+yon*(1-kap)*r*2.4,dy=[.42,.66,.84][j]*r+(1-kap)*r*.4,bw=r*[3.2,2.8,2.4][j],bh=bw*.42;
   g.globalAlpha=kap*[.92,.88,.8][j]*gece;g.drawImage(F.ayBulut[j],x+dx-bw/2+Math.sin(tm*.15+j*2)*r*.06,y+dy-bh*.55,bw,bh);}g.globalAlpha=1;
   g.globalCompositeOperation='lighter';dn11Glow('#cfe6ff',x,y-r*.1,r*1.6,r*.5,kap*.18*gece);}
 }
 g.globalCompositeOperation='source-over';
 // süzülen lavanta bulutçuklar (yavaş, paralakslı; finalde dağılır)
 for(let j=0;j<5;j++){const sp=4+j*2.5,bw=[300,240,360,200,280][j],x=((j*530-tm*sp-cam.x*(.02+j*.01))%(vw+bw*2)+vw+bw*2)%(vw+bw*2)-bw,y=[.08,.22,.31,.14,.4][j]*vh-cam.y*.015+pw*[20,40,60,10,80][j];
  if(y>gokAlt)continue;g.globalAlpha=[.34,.4,.28,.24,.2][j]*(1-sb*.5)*(1-DN11.fin*.6);g.drawImage(F.bulut[j%3],x,y,bw,bw*.34);}
 g.globalAlpha=1;
 dn11KayanYildiz(tm,vw,vh);
 if(typeof baloAyCiz==='function'&&DN11.finT!==null){g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);try{baloAyCiz(g,tm);}catch(e){}g.setTransform(S,0,0,S,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';}
 // uzak katmanlar + karede pencere / lamba ışıltıları; 0'dan sonra uzak şato
 for(let i=0;i<sira.length;i++){const l=sira[i];
  const f=DN11_SF[l],img=dn11Serit(l),Wd=img.width,base=tab[l],alt=ort[l],off=((cam.x*f)%Wd+Wd)%Wd,y0=base-DN11_SH[l];
  if(y0>=alt)continue;
  for(let x=-off;x<vw;x+=Wd)dn11SeritCiz(img,x,y0,vw,alt);
  const yd=base+DN11_EXT-1;if(alt>yd){g.fillStyle=DN11_SDOLGU[l];g.fillRect(0,yd,vw,alt-yd);}
  dn11SeritFx(tm,l,off,y0,alt);
  if(l===0)dn11UzakSato(tm,vw,vh,tab[1],ort[0]);
 }
 // ufukta gümüş-lila ışıma: ışık arttıkça altın-pembe ısınır
 g.globalCompositeOperation='lighter';const R11=DN11.renk;
 dn11Glow('#a9c8ff',vw*.5,tab[1]-30,vw*.75,110,(.05+R11*.06)*gece);dn11Glow('#ffb3d1',vw*.25,tab[0]-40,vw*.4,90,(.02+R11*.07+DN11.fin*.06)*gece);
 if(sb>.01){dn11Glow('#ffd8a8',vw*.6,tab[1]-60,vw*.7,vh*.32,sb*.5);dn11Glow('#fff4d8',vw*.6,tab[1]-40,90,60,sb*.85);}
 g.globalCompositeOperation='source-over';
}
function dn11SeritFx(tm,l,off,y0,alt){
 const fx=DN11.serFx[l];if(!fx)return;const vw=W/S,R11=DN11.renk,gece=1-DN11.sabah*.8,Wd=DN11_SW[l],koy=l===4;g.globalCompositeOperation='lighter';
 for(let x0=-off;x0<vw;x0+=Wd){
  for(const p of fx.pen){const x=x0+p.x,y=y0+p.y;if(x<-20||x>vw+20||y>alt)continue;const on=koy?.5+.5*R11:clamp((R11*1.3-p.th*.6)*2,0,1)*.9+.1,fl=.85+.15*Math.sin(tm*(2+p.th*3)+p.ph);
   dn11Glow(on>.5?'#ffd27a':'#a9c8ff',x,y,p.r*1.8,p.r*1.8,(.1+on*.45)*fl*gece);}
  for(const p of fx.orb){const x=x0+p.x,y=y0+p.y;if(x<-20||x>vw+20||y>alt)continue;dn11Glow('#cfe6ff',x,y,p.r*2.4,p.r*2.4,(.2+R11*.4)*gece*(.85+.15*Math.sin(tm*1.6+p.ph)));}
 }
 g.globalCompositeOperation='source-over';
}
// uzaktaki şato: bahçe boyunca tepede (paralaks .05); pencereler sıra sıra yanar, hilal ucu parlar
function dn11UzakSato(tm,vw,vh,base,alt){
 const img=dn11SatoArt(),F=DN11.fx,f=.05,R11=DN11.renk,gece=1-DN11.sabah*.8,cx=cam.x+VW*.5,A=3000,sx=vw*.5+(A-cx)*f;if(sx<-220||sx>vw+220)return;
 const k=.44,by=base-34;if(by-620*k>alt)return;
 g.drawImage(img,0,0,560,Math.min(640,(alt-(by-620*k))/k),sx-280*k,by-620*k,560*k,Math.min(640*k,alt-(by-620*k)));
 g.globalCompositeOperation='lighter';let n=0;
 for(const p of F.satoPen){const x=sx+p.x*k,y=by+(p.y+620-620)*k;if(y>alt)continue;n++;const th=dn11Hash(n*3.7),on=clamp((R11*1.4-th*.7)*2.2,0,1),fl=.85+.15*Math.sin(tm*2.4+n);
  if(p.lamba)dn11Glow('#cfe6ff',x,y,8,8,(.3+R11*.4)*gece);else dn11Glow(on>.4?'#ffd27a':'#a9c8ff',x,y,p.kapi?20:13,p.kapi?20:13,(.12+on*.55)*fl*gece);}
 dn11Glow('#cfe6ff',sx,by-300*k,160*k,120*k,(.06+R11*.1)*gece);
 g.globalCompositeOperation='source-over';
}
function dn11KayanYildiz(tm,vw,vh){
 const gece=1-DN11.sabah;if(gece<.3)return;const P9=9,k=Math.floor(tm/P9),u=(tm-k*P9)/1.1;if(u>1)return;
 const h1=dn11Hash(k*1.3),h2=dn11Hash(k*2.7+5),sol=h1<.5,x0=vw*(.15+h1*.7),y0=vh*(.03+h2*.15),ang=sol?Math.PI-.42:.42,L=vw*.2;
 const x=x0+Math.cos(ang)*L*u,y=y0+Math.sin(ang)*L*u,a=Math.sin(u*Math.PI)*gece*.8;
 g.globalCompositeOperation='lighter';for(let j=0;j<6;j++){const b=j/6;dn11Glow(j%2?'#d9c8ff':'#eaf4ff',x-Math.cos(ang)*b*60,y-Math.sin(ang)*b*60,4-b*3,4-b*3,a*(1-b)*.8);}
 dn11Glow('#ffffff',x,y,9,9,a);g.globalCompositeOperation='source-over';
}
function dn11Nabiz(){if(DN11.finT===null||typeof baloFinalNabiz!=='function')return 0;try{const v=+baloFinalNabiz();return v>0?Math.min(1,v):0;}catch(e){return 0;}}
function dn11Background(tm){
 if(!dn11Ready())return;dn11Sky();dn11FxArt();dn11AyArt();dn11Durum();DN11.kare++;
 g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
 dn11Backdrop(tm);
 dn11AtmArka(tm);
}

// ════════ Dünya: zemin parçaları + soluk örtü + yerel ışıltılar ════════
// soluk örtü: ışığın ulaşmadığı yerde dünya gri-mor ve soluk; ekran dilim dilim (yerel ışığa göre) — karede yalnız düz dikdörtgenler
const DN11_DILIM=64;let dn11OrtuCv=null,dn11OrtuVeri=null;
function dn11Ortu(){
 const gece=1-DN11.sabah;if(gece<.01)return;
 // dilim alfaları 64×1'lik minik tuvale yazılır, ekrana yumuşatılarak gerilir: dilimler arası basamak görünmez
 if(!dn11OrtuCv){dn11OrtuCv=dn11Cv(DN11_DILIM,1);dn11OrtuVeri=dn11OrtuCv.getContext('2d').createImageData(DN11_DILIM,1);}
 const d=dn11OrtuVeri.data,dw=VW/DN11_DILIM;let top=0;
 for(let i=0;i<DN11_DILIM;i++){const a=.33*(1-dn11Isik(cam.x+(i+.5)*dw))*gece,o=i*4;d[o]=34;d[o+1]=34;d[o+2]=98;d[o+3]=Math.round(a*255);top+=d[o+3];}
 if(top<2)return;dn11OrtuCv.getContext('2d').putImageData(dn11OrtuVeri,0,0);
 g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=true;g.drawImage(dn11OrtuCv,0,0,DN11_DILIM,1,-W/DN11_DILIM*.5,0,W+W/DN11_DILIM,H);
}
function dn11Isiltilar(tm){
 const Y=DN11.yap,F=DN11.fx,L0=cam.x-140,R0=cam.x+VW+140,gece=1-DN11.sabah*.7,nb=dn11Nabiz(),ay=DN11.ay11.ac;
 g.globalCompositeOperation='lighter';
 // pencereden süzülen ay ışığı (ay açıldıkça güçlenir)
 for(let i=dn11Bas(Y.isin,L0-200);i<Y.isin.length;i++){const p=Y.isin[i];if(p.x>R0+200)break;const a=(.14+ay*.32)*gece,h=p.yF-p.y,sk=h*.35;
  g.globalAlpha=a;g.save();g.translate(p.x,p.y);g.transform(1,0,-.35,1,0,0);g.drawImage(F.isin,-p.w*.6,0,p.w*1.2+sk*.2,h);g.restore();g.globalAlpha=1;
  dn11Glow('#a9c8ff',p.x-sk,p.yF-4,p.w*1.1,14,a*.6);}
 // pencereler (şato dışı): yerel ışıkla sıra sıra altın yanar; sönükken soluk gümüş
 for(let i=dn11Bas(Y.pen,L0);i<Y.pen.length;i++){const p=Y.pen[i];if(p.x>R0)break;const L=dn11Isik(p.x),on=clamp((L*1.25-p.th*.3)*1.6,0,1),fl=.9+.1*Math.sin(tm*(2.3+p.th*2)+p.ph),r=Math.max(p.w,p.h);
  if(on>.02){const cs=F.cam[p.st]||F.cam.yuvarlak;g.globalAlpha=Math.min(1,on*fl)*gece;g.drawImage(cs,0,0,64,cs.h2,p.x-p.w/2,p.y-p.h/2,p.w,p.h);g.globalAlpha=1;}
  dn11Glow(on>.3?'#ffc070':'#a9c8ff',p.x,p.y,r*1.3,r*1.2,(.05+on*.42+nb*.1)*fl*gece);}
 // ay ışığı topları (lamba, şamdan, avize): sönükken soluk gümüş, ışıkla parlak gümüş çekirdek + altın hâle
 for(let i=dn11Bas(Y.orb,L0);i<Y.orb.length;i++){const p=Y.orb[i];if(p.x>R0)break;const L=dn11Isik(p.x),tw=.85+.15*Math.sin(tm*1.7+p.ph),r=p.r;
  dn11Glow('#a9c8ff',p.x,p.y,r*3.4,r*3.4,(.08+L*.3+nb*(p.ic?.3:.15))*tw*gece);if(L>.2)dn11Glow('#ffd27a',p.x,p.y,r*4.6,r*4.2,(L-.2)*.22*tw*gece);
  const rr=r*(.7+L*.4);g.globalAlpha=Math.min(1,.25+L*.75)*tw;g.drawImage(F.top,p.x-rr,p.y-rr,rr*2,rr*2);g.globalAlpha=1;}
 // avizelerin geniş ışığı
 for(let i=dn11Bas(Y.avize,L0-200);i<Y.avize.length;i++){const p=Y.avize[i];if(p.x>R0+200)break;const L=dn11Isik(p.x);dn11Glow('#ffe7a8',p.x,p.y,p.r*2.4,p.r*1.6,(.04+L*.16+nb*.22)*gece);}
 // kristaller: kendi renginde yumuşak hâle, ara sıra parıltı
 for(let i=dn11Bas(Y.kris,L0);i<Y.kris.length;i++){const p=Y.kris[i];if(p.x>R0)break;const L=dn11Isik(p.x),tw=.8+.2*Math.sin(tm*1.3+p.ph);dn11Glow(p.col,p.x,p.y,p.r,p.r,(.08+L*.35)*tw*gece);
  if(L>.3&&Math.sin(tm*.9+p.ph*3)>.92){const r=10+L*6;g.globalAlpha=L*.8;g.drawImage(F.parilti,p.x-r,p.y-r-10,r*2,r*2);g.globalAlpha=1;}}
 // vitray: renkli cam ışıldar
 for(const p of Y.vitray){if(p.x<L0-200||p.x>R0+200)continue;const L=dn11Isik(p.x);dn11Glow('#c39bff',p.x,p.y,p.r*1.6,p.r*1.6,(.08+L*.3)*gece);dn11Glow('#ffe7a8',p.x,p.y,p.r*.6,p.r*.6,(.1+L*.4)*gece);}
 g.globalCompositeOperation='source-over';
}
// süs ipleri (bahçede lambadan lambaya, mutfakta çilek, balo salonunda yarasa ve yıldız): ip eğrisi + salınan bayrakçıklar
function dn11Ipler(tm){
 const Y=DN11.yap,F=DN11.fx,L0=cam.x-60,R0=cam.x+VW+60;
 for(const ip of Y.ip){if(ip.x1<L0||ip.x0>R0)continue;const mx=(ip.x0+ip.x1)/2,my=(ip.y0+ip.y1)/2+ip.sag*2*(1+.04*Math.sin(tm*.9+ip.ph));
  g.strokeStyle='rgba(30,20,60,.8)';g.lineWidth=1.4;g.beginPath();g.moveTo(ip.x0,ip.y0);g.quadraticCurveTo(mx,my,ip.x1,ip.y1);g.stroke();
  const sp=F.bayrak[ip.tur]||F.bayrak.yildiz;
  for(let k=1;k<ip.n;k++){const u=k/ip.n,a=(1-u)*(1-u),b2=2*u*(1-u),d=u*u,x=a*ip.x0+b2*mx+d*ip.x1,y=a*ip.y0+b2*my+d*ip.y1;if(x<L0||x>R0)continue;
   const sw=Math.sin(tm*1.8+k*.9+ip.ph)*.14;g.save();g.translate(x,y);g.rotate(sw);g.drawImage(sp[(k+(ip.ph*3|0))%4],-14,-2,28,31);g.restore();}}
}
// asma köprü (karede): kalaslar Feza'nın altında yumuşakça çöker, inişte yaylanır, bütün köprü hafifçe salınır; halatlar onunla iner
const DN11_KS={son:-1};
OLAY.on('inis',e=>{const K=DN11.kopru;if(K&&e&&e.x>K.x0-20&&e.x<K.x1+20&&Math.abs(e.y-K.y)<8)K.v+=Math.min(60,(e.siddet||300)*.06);});
function dn11Kopru(tm){
 const K=DN11.kopru;if(!K||K.pb<cam.x-40||K.pa>cam.x+VW+40)return;
 const dt=DN11_KS.son<0?0:clamp(now-DN11_KS.son,0,.05);DN11_KS.son=now;
 const ust=typeof P!=='undefined'&&P.ground&&!P.ucus&&P.x>K.x0-10&&P.x<K.x1+10&&Math.abs(P.y-K.y)<4,yur=ust&&Math.abs(P.vx||0)>40;
 const hedef=ust?3.5+(yur?1.5*Math.sin(tm*11):0):0;
 if(dt>0){K.v+=((hedef-K.k)*90-K.v*7)*dt;K.k+=K.v*dt;}if(!Number.isFinite(K.k)||!Number.isFinite(K.v)){K.k=0;K.v=0;}
 const fx=ust?P.x:(K.x0+K.x1)/2,L=K.x1-K.x0,y=K.y;
 const off=x=>{const u=(x-K.x0)/L,b=Math.max(0,1-Math.abs(x-fx)/300);return K.k*b*b*(ust?1:4*u*(1-u))+Math.sin(tm*1.3+x*.008)*1.1*4*u*(1-u);};
 // halatlar (iki kat) ve askılar
 const mx=(K.pa+K.pb)/2,mo=off(mx);g.strokeStyle='#b89a8a';g.lineWidth=3;
 for(const dy of [-100,-56]){g.beginPath();g.moveTo(K.pa,y+dy);g.quadraticCurveTo(mx,y+dy+34+mo*2,K.pb,y+dy);g.stroke();}
 g.lineWidth=1.6;g.beginPath();for(let x=K.pa+24;x<K.pb-10;x+=24){const u=(x-K.pa)/(K.pb-K.pa),sag=4*u*(1-u)*(34+mo*2);g.moveTo(x,y-100+sag);g.lineTo(x,y+off(x));}g.stroke();
 // kalaslar
 for(let x=K.x0;x<K.x1;x+=20){if(x<cam.x-30||x>cam.x+VW+30)continue;const o=off(x+10),h=dn11Hash(x);g.fillStyle=h<.5?'#9a7a7a':'#8a6a74';g.fillRect(x+1,y-2+o,18,12);g.fillStyle='rgba(255,230,220,.25)';g.fillRect(x+3,y-1+o,14,2);}
 g.strokeStyle='#6a4a5a';g.lineWidth=2;g.beginPath();g.moveTo(K.x0,y+11);for(let x=K.x0+40;x<=K.x1;x+=40)g.lineTo(x,y+11+off(x));g.stroke();
}
// sis yastığına (köprünün altındaki çanak) düşen Feza yumuşakça geri sıçrar (bolum11 'bl11SisYastik'): pembe-lila sis halkası
OLAY.on('ziplatti',o=>{if(o&&o.tip==='bl11SisYastik'&&typeof P!=='undefined'){dn11Iz(P.x,o.y-10,'inis');if(typeof burst==='function')burst(P.x,o.y-20,12,['#e8b8e0','#c8a8e8','#eaf4ff'],140,.9,8);}});
// yer sisi: yüzeyde yavaşça sürüklenen lila-pembe-gümüş bulutçuklar (bahçe, köprü çanağı, mağara; odalarda çok az)
const DN11_SIS=Array.from({length:24},(_,i)=>({u:dn11Hash(i*3.1),sp:6+dn11Hash(i*7.7)*10,r:110+dn11Hash(i*5.3)*90,ph:dn11Hash(i*9.1)*6.283,p:i%3}));
function dn11Sis(tm,on){
 const F=DN11.fx,span=VW+600,a0=(on?.5:1)*(.12+DN11.renk*.03)*(1-DN11.sabah*.5);
 g.globalCompositeOperation='lighter';
 for(let i=0;i<DN11_SIS.length;i++){const s=DN11_SIS[i];if((i%3===0)!==!!on)continue;
  const gx=cam.x-300+(((s.u*span+tm*s.sp)%span)+span)%span;let y=dn11Surface(gx);if(y>=1200)continue;const b=dn11Bolge(gx),ic=b==='salon'||b==='org'||b==='galeri'||b==='mutfak'||b==='balo';
  y+=on?6:-8;const r=s.r,a=a0*(ic?.3:1)*(.7+.3*Math.sin(tm*.4+s.ph));g.globalAlpha=a;g.drawImage(s.p===0?F.sis:s.p===1?F.sisP:F.sisG,gx-r,y-r*.32,r*2,r*.56);}
 // köprünün altındaki sis çanağı: yumuşak, kabaran pembe-lila bulut
 if(!on){const a=267*T,b=303*T;if(b>cam.x-200&&a<cam.x+VW+200){for(let k=0;k<7;k++){const x=a+(k+.5)/7*(b-a)+Math.sin(tm*.3+k)*20,y=dn11Surface(x)-30+Math.sin(tm*.5+k*1.7)*6;g.globalAlpha=.32*(1-DN11.sabah*.5);g.drawImage(k%2?F.sisP:F.sis,x-130,y-50,260,100);}}}
 g.globalAlpha=1;g.globalCompositeOperation='source-over';
}
// ── Sis halkası izi: Feza'nın adımlarında yer sisinde yumuşak halka ve havalanan ışık tozu (sabit havuz) ──
const DN11_IZ_N=40,DN11_IZ=Array.from({length:DN11_IZ_N},()=>({x:0,y:0,t:-1e9,tip:'feza'}));let dn11IzI=0;
function dn11Iz(x,y,tip){DN11.izDis=now;dn11IzEkle(x,y,tip);}   // dışarıdan çağrılınca kendi adım izim kısa süre susar
function dn11IzEkle(x,y,tip){if(!Number.isFinite(x)||!Number.isFinite(y))return;const Z=DN11_IZ[dn11IzI];dn11IzI=(dn11IzI+1)%DN11_IZ_N;Z.x=x;Z.y=y;Z.t=now;Z.tip=tip||'feza';}
function dn11Izler(){
 const F=DN11.fx,L0=cam.x-80,R0=cam.x+VW+80;g.globalCompositeOperation='lighter';
 for(let i=0;i<DN11_IZ_N;i++){const Z=DN11_IZ[i],age=now-Z.t,omur=Z.tip==='inis'?1.6:1.2;if(age<0||age>omur||Z.x<L0||Z.x>R0)continue;const u=age/omur,w=(Z.tip==='inis'?30:18)+u*(Z.tip==='inis'?90:50);
  g.globalAlpha=(1-u)*(1-u)*.6;g.drawImage(F.iz,Z.x-w,Z.y-w*.33+2,w*2,w*.66);
  if(age<1){for(let j=0;j<(Z.tip==='inis'?5:2);j++){const h=dn11Hash(i*7.3+j*3.1),v=age,px=Z.x+(h-.5)*28+Math.sin(age*3+j)*4,py=Z.y-4-v*(20+h*24);dn11Glow(DN11_TOZ[(i+j)%8],px,py,5,5,(1-v)*.6);}}}
 g.globalAlpha=1;g.globalCompositeOperation='source-over';
}
function dn11KendiIz(){
 if(typeof P==='undefined'||P.ucus||!P.ground||DURUM!=='oyun')return;if(Math.abs(P.vx||0)<40){DN11.izX=undefined;return;}
 if(DN11.izX===undefined||Math.abs(P.x-DN11.izX)>46){DN11.izX=P.x;if(!DN11.izDis||now-DN11.izDis>.6)dn11IzEkle(P.x,P.y,'feza');}
}
function dn11World(tm){
 if(!dn11Ready())return;dn11Yapilar();dn11Terrain();
 dn11Ortu();
 if(DN11.sabah>.004){g.setTransform(1,0,0,1,0,0);g.globalAlpha=DN11.sabah*.3;g.drawImage(DN11.fx.sabahOrtu,0,0,8,128,0,H*.2,W,H*.8+1);g.globalAlpha=1;}
 g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);
 dn11AtmDunya(tm);dn11Sis(tm,false);dn11Isiltilar(tm);dn11Ipler(tm);dn11Kopru(tm);dn11KendiIz();dn11Izler();
 // ışık dalgaları: yeni dönen ayna / canlanan parça → yere yayılan gümüş halka + göğe yükselen ışık tozu; kalıcı yumuşak ışık havuzu
 g.globalCompositeOperation='lighter';const gece=1-DN11.sabah*.7;
 for(const Lt of DN11.lit){if(Lt.x<cam.x-500||Lt.x>cam.x+VW+500)continue;const on=smooth(clamp((now-Lt.t)/1.5,0,1)),nb=.85+.15*Math.sin(tm*1.7+Lt.x),sy=dn11Surface(Lt.x);if(sy>=1200)continue;
  dn11Glow('#a9c8ff',Lt.x,sy+2,190,30,on*.22*nb*gece);dn11Glow('#ffe7a8',Lt.x,Lt.y,120,100,on*.08*nb*gece);}
 for(const Lt of DN11.lit){const age=now-Lt.t;if(age<0||age>3.2||Lt.x<cam.x-1100||Lt.x>cam.x+VW+1100)continue;const u=age/3.2,col=Lt.col||'#cfe6ff';
  dn11Glow(col,Lt.x,Lt.y+20,60+u*800,24+u*120,(1-u)*.16);
  const yu=Lt.y-u*u*700;for(let j=0;j<6;j++)dn11Glow(DN11_TOZ[j],Lt.x+Math.sin(age*6+j)*6,yu+j*24,10-j,20,(1-u)*(1-j/6)*.45);}
 // final: balo salonuna dolan ay ışığı (kubbeden), altın-gümüş
 if(DN11.fin>.01&&BOLUM.balo){const nb=.8+.2*Math.sin(tm*1.5)+dn11Nabiz()*.3,bx=BOLUM.balo.x,by=BOLUM.balo.y;dn11Glow('#cfe6ff',bx,by-300,560,360,DN11.fin*.14*nb);dn11Glow('#ffe7a8',bx,by-80,480,140,DN11.fin*.1*nb);
  g.globalAlpha=DN11.fin*.35;g.save();g.translate(bx,by-700);g.drawImage(DN11.fx.isin,-260,0,520,700);g.restore();g.globalAlpha=1;}
 g.globalCompositeOperation='source-over';g.globalAlpha=1;
}

// ════════ Işık tozu (havada süzülen; BÖCEK DEĞİL): arkada ve önde, ışık arttıkça parlar ════════
const dn11R=rng(5151),DN11_TOZL=Array.from({length:66},(_,i)=>({x:dn11R()*6000,y:dn11R()*1300,z:.25+dn11R()*1.15,ph:dn11R()*6.283,r:.7+dn11R()*1.6,col:DN11_TOZ[i%8],sp:.4+dn11R()*.9}));
function dn11Motes(tm,zMin,zMax){
 if(!dn11Ready())return;const vw=W/S,vh=H/S,px=(Number.isFinite(P.rx)?P.rx:P.x)-cam.x,py=(Number.isFinite(P.ry)?P.ry:P.y)-cam.y-34,br=(.45+DN11.renk*.55)*(1-DN11.sabah*.5),F=dn11FxArt();
 g.setTransform(S,0,0,S,0,0);g.globalCompositeOperation='lighter';
 for(let i=0;i<DN11_TOZL.length;i++){const p=DN11_TOZL[i];if(p.z<zMin||p.z>=zMax)continue;
  const x=((p.x-cam.x*p.z+Math.sin(tm*.23+p.ph)*26)%(vw+100)+vw+100)%(vw+100)-50,y=((p.y-cam.y*p.z-tm*p.sp*9+Math.sin(tm*.19+p.ph)*14)%(vh+100)+vh+100)%(vh+100)-50;
  let a=(.28+.2*Math.sin(tm*1.3+p.ph))*(p.z>.8?.9:.6)*br;
  if(p.z>=.75){const dx=(x-px)/60,dy=(y-py)/80,d=dx*dx+dy*dy;if(d<1)a*=.15+.85*smooth(d);}
  dn11Glow(p.col,x,y,p.r*5,p.r*5,a*.6);if(i%5===0){const r=p.r*3.4;g.globalAlpha=a*.7;g.drawImage(F.parilti,x-r,y-r,r*2,r*2);g.globalAlpha=1;}
  else{g.fillStyle=p.col;g.globalAlpha=a;g.fillRect(x-p.r*.5,y-p.r*.5,p.r,p.r);g.globalAlpha=1;}}
 g.globalAlpha=1;g.globalCompositeOperation='source-over';
}
function dn11Petals(tm){
 if(!dn11Ready())return;dn11FxArt();g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);
 dn11Sis(tm,true);
 // finalde balo salonuna yağan gümüş-altın yıldız pulları (doruktan sonra daha yoğun)
 if(DN11.fin>.01&&BOLUM.balo){g.globalCompositeOperation='lighter';const ax=BOLUM.balo.x,ay=BOLUM.balo.y,dk=DN11.dorukT!==null?smooth(clamp((now-DN11.dorukT)/1.5,0,1)):0,n=24+Math.round(dk*16),F=DN11.fx;
  for(let j=0;j<n;j++){const u=(tm*.075+j*.0357)%1,x=ax+Math.sin(j*2.3)*VW*.5+Math.sin(tm*.6+j)*30,y=ay-620+u*640,a=DN11.fin*Math.sin(u*Math.PI)*(.35+dk*.2);
   dn11Glow(DN11_TOZ[j%8],x,y,9,9,a);if(j%4===0){g.globalAlpha=a;g.drawImage(j%8?F.parilti:F.pariltiA,x-8,y-8,16,16);g.globalAlpha=1;}}
  g.globalCompositeOperation='source-over';}
 g.globalAlpha=1;
}

// ════════ Ön plan: bahçede alt köşelerde koyu çalılar, mağarada kristal siluetleri, oda geçişlerinde kapı kemeri, odalarda üstte kadife saçak ════════
function dn11OnArt(){
 const F=dn11FxArt();if(F.on)return F.on;
 const yap=(sd,kris)=>{const cv=dn11Cv(560,300),c=cv.getContext('2d'),R=rng(sd);c.scale(2,2);const w=280,h=150;
  c.fillStyle=kris?'#140e30':'#101830';c.beginPath();c.moveTo(0,h);c.bezierCurveTo(w*.05,h*.7,w*.25,h*.55,w*.45,h*.62);c.bezierCurveTo(w*.62,h*.68,w*.8,h*.56,w*.94,h*.72);c.quadraticCurveTo(w,h*.86,w,h);c.closePath();c.fill();
  if(kris){for(let k=0;k<5;k++){const x=w*(.1+k*.2)+R()*14,s=.9+R()*.6;c.save();c.translate(x,h*.7);for(let j=0;j<3;j++){c.save();c.rotate((j-1)*.35);c.fillStyle=j===1?'#221a46':'#1a1440';c.beginPath();c.moveTo(-7*s,4);c.lineTo(-7*s,-40*s);c.quadraticCurveTo(0,-52*s,7*s,-40*s);c.lineTo(7*s,4);c.fill();c.restore();}c.restore();}}
  else{for(let k=0;k<4;k++){const x=w*(.12+k*.25)+R()*14,s=.7+R()*.4,b=['top','kalp','yarasa','ay'][k];c.save();c.translate(x,h*.58);c.fillStyle='#16203a';c.fill(dn11CaliYol(b,s));c.restore();}
   for(let k=0;k<5;k++){const x=w*(.1+k*.2),r=18+R()*16;c.fillStyle='#121c34';c.beginPath();c.arc(x,h*.74,r,Math.PI,0);c.fill();}}
  return cv;};
 F.on=[yap(811,false),yap(833,false),yap(851,true)];
 // kadife saçak (odalarda üst kenar): dalgalı perde kenarı + püsküller
 F.sacak=(()=>{const cv=dn11Cv(640,120),c=cv.getContext('2d');c.fillStyle='#5a2450';c.fillRect(0,0,640,40);
  for(let k=0;k<8;k++){const x=k*80;c.fillStyle=k%2?'#6a2a5e':'#5e2654';c.beginPath();c.moveTo(x,30);c.quadraticCurveTo(x+40,96,x+80,30);c.closePath();c.fill();c.strokeStyle='rgba(255,179,209,.25)';c.lineWidth=2;c.beginPath();c.moveTo(x+6,38);c.quadraticCurveTo(x+40,90,x+74,38);c.stroke();
   c.fillStyle='#e8c070';c.beginPath();c.arc(x+80,34,6,0,6.283);c.fill();c.fillRect(x+78,34,4,26);c.beginPath();c.ellipse(x+80,64,6,9,0,0,6.283);c.fill();}
  c.fillStyle='#e8c070';c.fillRect(0,28,640,4);return cv;})();
 return F.on;
}
// ön plan çalılarının konmadığı aralıklar: mini oyun alanları ve uçuş
function dn11OnBos(){
 if(DN11.onBos)return DN11.onBos;const L=[];
 for(const o of NESNELER){if(!/Mini$/.test(o.tip))continue;const a=Number.isFinite(o.x0)?o.x0:o.x-700,b=Number.isFinite(o.x1)?o.x1:o.x+700;L.push(Math.min(a,o.x-380)-220,Math.max(b,o.x+360)+220);}
 return DN11.onBos=L;
}
function dn11OnNes(){if(DN11.onNes)return DN11.onNes;return DN11.onNes=NESNELER.filter(o=>/^(ayAyna|vampirDurak|pelerinSec|hayaletDekor)$/.test(o.tip)&&Number.isFinite(o.x));}
const DN11_KEMER=[211*T,255*T,321*T,421*T,599*T];
function dn11Foreground(tm){
 if(!dn11Ready())return;const F=dn11FxArt(),vw=W/S,vh=H/S;dn11OnArt();
 const ucus=typeof P!=='undefined'&&!!P.ucus&&P.ucus.tip==='pelerinUcus';
 if(!ucus){
  const px=(Number.isFinite(P.rx)?P.rx:P.x),bos=dn11OnBos();
  // alt: yakın koyu çalılar (bahçe/köprü) ve kristal siluetleri (mağara); Feza'nın ya da nesnenin üstüne gelince saydamlaşır
  const fb=1.1,left=cam.x*fb-160,right=cam.x*fb+vw+160;g.setTransform(S,0,0,S,-cam.x*S*fb,0);
  const yk=dn11YerKay(vh);
  if(yk<vh*.4)
  for(let q=Math.floor(left/680);q<=Math.ceil(right/680);q++){const R=rng(q*71+883),x=q*680+R()*200,wx=x/fb,b=dn11Bolge(wx);if(wx>DN11_GAP0-200&&wx<DN11_GAP1+100)continue;
   const kris=b==='magara';if(!kris&&b!=='giris'&&b!=='bahce'&&b!=='kopru')continue;
   let kac=false;for(let i=0;i<bos.length;i+=2)if(wx>bos[i]&&wx<bos[i+1]){kac=true;break;}if(kac)continue;const k=.5+R()*.25;
   const sx=x-cam.x*fb,yar=140*k*1.35;let d=Math.abs(sx-(px-cam.x))-yar;for(const o of dn11OnNes()){const e=Math.abs(sx-(o.x-cam.x))-yar;if(e<d)d=e;}
   const al=.2+.66*clamp((d+20)/110,0,1);
   g.save();g.translate(x,vh+30+yk*1.1);g.rotate(Math.sin(tm*.35+q)*.015);g.globalAlpha=al;g.drawImage(F.on[kris?2:Math.abs(q)%2],-140*k*1.35,-150*k*1.35,280*k*1.35,150*k*1.35);g.restore();}
  g.globalAlpha=1;
  // odalarda üst kenarda kadife saçak (paralaks 1,08): galeri ve org salonu
  const yer=dn11Bolge(cam.x+VW*.5);
  if(yer==='galeri'||yer==='org'){const f=1.08,span=640,off=((cam.x*f)%span+span)%span;g.setTransform(S,0,0,S,0,0);g.globalAlpha=.92;
   for(let q=-1;q<vw/span+1;q++){const x0=q*span-off,wx=cam.x+(x0+span/2)/f;if(dn11Bolge(wx)!==yer)continue;g.drawImage(F.sacak,x0,-14,span,120);}g.globalAlpha=1;}
 }
 // ekran geneli: ışık arttıkça gümüş-altın, finalde pembe-altın, sabahta sıcak
 g.setTransform(S,0,0,S,0,0);g.globalCompositeOperation='lighter';
 const R11=DN11.renk,gece=1-DN11.sabah;if(R11>.02)dn11Glow('#a9c8ff',vw*.5,vh*.95,vw*.8,vh*.35,(.02+R11*.04)*gece);
 {const Lc=dn11Isik(cam.x+VW*.5);if(Lc>.05&&!(typeof P!=='undefined'&&P.ucus)){dn11Glow('#ffc070',vw*.5,vh*.78,vw*.7,vh*.45,Lc*.075*gece);dn11Glow('#ffb3d1',vw*.15,vh*.3,vw*.4,vh*.4,Lc*.025*gece);}}
 if(DN11.fin>.01){dn11Glow('#ffe7a8',vw*.5,vh*.9,vw*.8,vh*.4,DN11.fin*.05*gece);dn11Glow('#ffb3d1',vw*.75,vh*.12,vw*.5,vh*.4,DN11.fin*.04*gece);}
 if(DN11.sabah>.01)dn11Glow('#ffc8a0',vw*.6,vh*.8,vw*.9,vh*.6,DN11.sabah*.22);
 g.globalCompositeOperation='source-over';
}
const DN11_VIG=[[0,0,200,16],[0,132,200,28],[0,16,42,116],[158,16,42,116]];
function dn11Vignette(){if(!dn11Ready())return;const F=dn11FxArt(),kx=W/200,ky=H/160;g.setTransform(1,0,0,1,0,0);g.globalAlpha=1-DN11.sabah*.6;
 for(const [x,y,w,h] of DN11_VIG){const dx=Math.round(x*kx),dy=Math.round(y*ky);g.drawImage(F.vig,x,y,w,h,dx,dy,Math.round((x+w)*kx)-dx,Math.round((y+h)*ky)-dy);}g.globalAlpha=1;}


// ════════ ATMOSFER (derinlik): ay ışığı huzmeleri, yerde ay benekleri, pencere ışık lekesi, uzak soğuk pus, içeride eğik ay ışığı şeritleri ════════
// Hepsi önbellek tuvalleri (gradyan/shadowBlur yalnız pişirilirken; ısıtmada kare başına bir tuval). Karede yalnız drawImage + alfa.
const DN11_ATM={spr:{},sira:['isinA','benek','pencereLeke','pusMavi'],ic:0,icT:-1};
function dn11AtmYap(ad){
 const A=DN11_ATM.spr;if(A[ad])return A[ad];let cv;
 if(ad==='isinA'){   // ay huzmesi: tepede dar, aşağı genişleyip sönen yumuşak koni (yanları yumuşak)
  cv=dn11Cv(128,512);const c=cv.getContext('2d');for(let k=0;k<3;k++){const w0=6+k*10,w1=26+k*20,a=[.42,.2,.1][k];
   const gr=c.createLinearGradient(0,0,0,512);gr.addColorStop(0,'rgba(220,234,255,'+a+')');gr.addColorStop(.45,'rgba(190,212,255,'+(a*.55)+')');gr.addColorStop(1,'rgba(170,190,255,0)');
   c.fillStyle=gr;c.beginPath();c.moveTo(64-w0,0);c.lineTo(64+w0,0);c.lineTo(64+w1,512);c.lineTo(64-w1,512);c.closePath();c.fill();}
 }else if(ad==='benek'){   // yerde ay ışığı benekleri: birkaç yassı yumuşak leke (yaprak arasından süzülmüş gibi)
  cv=dn11Cv(256,64);const c=cv.getContext('2d'),R=rng(4411);
  for(let k=0;k<7;k++){const x=30+R()*196,y=32+(R()-.5)*14,rx=12+R()*26,ry=rx*.28,gr=c.createRadialGradient(x,y,0,x,y,rx);
   gr.addColorStop(0,'rgba(220,236,255,.85)');gr.addColorStop(.5,'rgba(190,214,255,.38)');gr.addColorStop(1,'rgba(170,200,255,0)');c.fillStyle=gr;c.save();c.translate(x,y);c.scale(1,ry/rx);c.translate(-x,-y);c.beginPath();c.arc(x,y,rx,0,6.283);c.fill();c.restore();}
 }else if(ad==='pencereLeke'){   // yere düşen pencere ışığı: eğik dörtgen, ortasında kayıt (haç) gölgesi, kenarları yumuşak
  cv=dn11Cv(192,64);const c=cv.getContext('2d');c.shadowColor='rgba(214,230,255,.9)';c.shadowBlur=10;
  c.fillStyle='rgba(214,230,255,.75)';c.beginPath();c.moveTo(40,10);c.lineTo(150,10);c.lineTo(184,54);c.lineTo(10,54);c.closePath();c.fill();c.shadowBlur=0;
  c.globalCompositeOperation='destination-out';c.fillStyle='rgba(0,0,0,.6)';c.beginPath();c.moveTo(92,10);c.lineTo(100,10);c.lineTo(102,54);c.lineTo(92,54);c.closePath();c.fill();c.fillRect(20,30,160,5);
 }else if(ad==='pusMavi'){   // hava perspektifi: ufukta soğuk mavi pus (uzak katmanları maviye çeker)
  cv=dn11Cv(8,256);const c=cv.getContext('2d'),gr=c.createLinearGradient(0,0,0,256);
  gr.addColorStop(0,'rgba(120,140,220,0)');gr.addColorStop(.55,'rgba(130,155,232,.26)');gr.addColorStop(.85,'rgba(150,170,240,.34)');gr.addColorStop(1,'rgba(140,150,226,.12)');c.fillStyle=gr;c.fillRect(0,0,8,256);

 }
 return A[ad]=cv;
}
function dn11AtmIsit(){for(const ad of DN11_ATM.sira)if(!DN11_ATM.spr[ad]){dn11AtmYap(ad);return false;}return true;}
function dn11AtmHazir(){for(const ad of DN11_ATM.sira)if(!DN11_ATM.spr[ad])return false;return true;}
// ekranın ne kadarı dışarıda (0 içeride .. 1 açık hava); yumuşak geçiş
function dn11AtmDis(){
 if(DN11_ATM.icT===now)return 1-DN11_ATM.ic;DN11_ATM.icT=now;let ic=0;for(let k=0;k<5;k++){const x=cam.x+VW*(.1+k*.2);if(dn11Oda(x)||(x>=321*T&&x<421*T))ic+=.2;}
 DN11_ATM.ic+=(ic-DN11_ATM.ic)*.06;return 1-DN11_ATM.ic;
}
// arka plan üstüne (dünyanın arkası): uzak soğuk pus
function dn11AtmArka(tm){
 if(!dn11AtmHazir())return;const vw=W/S,vh=H/S,dis=dn11AtmDis(),gece=1-DN11.sabah;if(dis<.02)return;
 g.setTransform(S,0,0,S,0,0);g.globalAlpha=dis*gece*(.5-DN11.renk*.2);g.drawImage(DN11_ATM.spr.pusMavi,0,0,8,256,0,vh*.18-cam.y*.02,vw,vh*.9);g.globalAlpha=1;
}
// dünya katmanında (dünya dönüşümü kurulu): yerde ay benekleri, pencere ışık lekeleri; ekran uzayında ay huzmeleri
function dn11AtmDunya(tm){
 if(!dn11AtmHazir())return;const A=DN11_ATM.spr,gece=1-DN11.sabah*.8,dis=dn11AtmDis(),L0=cam.x-200,R0=cam.x+VW+200;
 g.globalCompositeOperation='lighter';
 // yerde ay benekleri (açık havada ve mağarada): ışık geldikçe belirginleşir, hafifçe nefes alır
 const ad=150,k0=Math.floor(L0/ad),k1=Math.ceil(R0/ad);
 for(let k=k0;k<=k1;k++){const h=dn11Hash(k*1.37),x=k*ad+h*90;if(x>=DN11_GAP0-60&&x<DN11_GAP1)continue;if(dn11Oda(x))continue;const y=dn11Surface(x);if(y>=1200)continue;
  const L=dn11Isik(x),a=(.07+L*.3)*(.75+.25*Math.sin(tm*.6+h*9))*gece;if(a<.01)continue;const w=150+h*120;g.globalAlpha=a;g.drawImage(A.benek,x-w/2,y-6,w,w*.22);}
 // odalarda pencereden yere düşen ışık lekesi (pencere kayıtlı huzmesinin ucunda)
 const Y=DN11.yap,ay=DN11.ay11?DN11.ay11.ac:0;
 if(Y&&Y.isin)for(let i=dn11Bas(Y.isin,L0-200);i<Y.isin.length;i++){const p=Y.isin[i];if(p.x>R0+200)break;const hh=p.yF-p.y,sk=hh*.35,L=dn11Isik(p.x),a=(.12+L*.28+ay*.12)*gece;
  const w=p.w*2.6;g.globalAlpha=a;g.drawImage(A.pencereLeke,p.x-sk-w*.55,p.yF-16,w,30);}
 // içeride (odalar, mağara): yukarıdan eğik inen ay ışığı şeritleri; ışık geldikçe güçlenir, yavaş nefes alır
 {const ad2=420,q0=Math.floor(L0/ad2),q1=Math.ceil(R0/ad2);
  for(let q=q0;q<=q1;q++){const h=dn11Hash(q*2.71+5),x=q*ad2+h*200;const oda=dn11Oda(x),mag=x>=321*T&&x<421*T;if(!oda&&!mag)continue;if(oda&&oda.ad==='balo'&&DN11.fin<.01)continue;
   const y=dn11Surface(x);if(y>=1200)continue;const tv=dn11Tavan(x),ust=Number.isFinite(tv)?tv:y-520,Lx=dn11Isik(x),a=(.05+Lx*.2)*(.7+.3*Math.sin(tm*.25+h*7))*gece;if(a<.01)continue;
   const len=y-ust+20,wd=90+h*90;g.save();g.translate(x,ust);g.rotate(.32);g.globalAlpha=a;g.drawImage(A.isinA,-wd/2,0,wd,len*1.06);g.restore();
   g.globalAlpha=a*1.3;g.drawImage(A.benek,x-len*.33-wd*.8,y-8,wd*1.6,wd*.36);}}
 g.globalAlpha=1;
 // ay huzmeleri (god rays): ay yönünden eğik, yavaş salınan geniş ışık şeritleri — açık havada, ay açıldıkça güçlü
 const Ay=DN11.ay11;if(dis>.02&&Ay&&Number.isFinite(Ay.sx)){
  const vw=W/S,vh=H/S,guc=dis*gece*(1-(Ay.giz||0))*(.22+Ay.ac*.5+DN11.renk*.25);
  g.setTransform(S,0,0,S,0,0);
  for(let j=0;j<5;j++){const ph=j*1.7,sw=Math.sin(tm*.13+ph)*.04,ang=.1+j*.17-.3+sw,len=vh*.9,wd=[90,150,70,180,110][j],a=guc*(.55+.45*Math.sin(tm*.21+ph*2))*(j%2?.75:1);if(a<.01)continue;
   g.save();g.translate(Ay.sx+(j-2)*34,Ay.sy+Ay.sr*.3);g.rotate(ang);g.globalAlpha=Math.min(.75,a*.75);g.drawImage(A.isinA,-wd/2,0,wd,len);g.restore();}
  g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);
 }
 g.globalAlpha=1;g.globalCompositeOperation='source-over';
}
// ════════ Isıtma: önbellekleri kareye yayarak hazırla (yüklemede / uyku girişi altında) ════════
function dn11Isit(){
 if(!dn11Ready())return false;const p=DN11.prep;
 if(p===0){dn11Sky();DN11.prep++;return false;}
 if(p===1){dn11FxArt();dn11AyArt();DN11.prep++;return false;}
 if(p<7){dn11Serit(p-2);DN11.prep++;return false;}
 if(p===7){dn11SatoArt();dn11OnArt();for(const k of ['tas','tasK','kaya','salon','org','galeri','mutfak','balo'])dn11Karo(k);DN11.prep++;return false;}
 if(p===8){dn11Yapilar();DN11.prep++;return false;}
 if(p<12){const i=Math.max(0,Math.floor(((typeof cam!=='undefined'?cam.x:0))/DN11_CW))+(p-9);dn11Chunk(i);DN11.prep++;return false;}
 if(!dn11AtmIsit())return false;
 for(const c of ['#a9c8ff','#eaf4ff','#cfe6ff','#ffd2e8','#ffd27a','#ffc070','#ffe7a8','#ffb3d1','#c39bff','#d9c8ff','#9ff0d0','#ffffff','#fff4d8','#ffd8a8','#ffc8a0','#ffe0a0','#f0c070'])glow(c);
 DN11.warm=true;return true;
}
