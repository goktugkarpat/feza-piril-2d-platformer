/* dunya13.js — Ayın Esinti Bahçesi: yaşayan gök ormanı.
   Bütün resimler yerel Canvas2D fırçalarıdır: ay, bulut, ağaç, kök, yosun ve yıldız suyu.
   Hiçbir dış resim yüklenmez. Dört paralaks katmanı; gerçek ayak yüzeyi y=720.
   Sabit atlaslar, sabit zerre havuzları, kare başına en çok bir hazırlama işi. */
'use strict';
const DN13={art:Object.create(null),queue:[],queued:Object.create(null),stamp:null,prep:0,ready:false,last:null,t:0,zone:0,fin:0,dawn:false,walkX:null,foot:0,wave:0,
 steps:Array.from({length:16},()=>({x:0,y:720,t:-999})),waves:Array.from({length:8},()=>({x:0,y:720,t:-999})),buildStats:{n:0,total:0,max:0,last:0,key:''}};
const DN13_MOON_ALPHA=[.64,.53,.26,.06,.2,.65,.15],DN13_MOON_SCALE=[.78,.78,.72,.62,.72,.98,.72];
const DN13_TAU=Math.PI*2,DN13_FLOOR=720,DN13_EDGES=[3600,6800,11400,15600,18800,25200];
const DN13_SKY=[
 ['#0a1a4a','#1f4f8f','#3f86bd'],['#0b1f52','#27609a','#5fb0b8'],['#1f1a55','#5a4a9a','#c58fc0'],
 ['#082c3a','#1b6b68','#6fc29a'],['#1a1552','#4a3f9c','#b06fc4'],['#1c1a5e','#56509f','#f0a5b8'],['#23175e','#6a4aa6','#f3b58f']
];
const DN13_TPAL=[
 ['#081d2b','#173b49','#3b6673','#092b39','#1e545d','#41918c','#79b1a0'],
 ['#111c34','#313d63','#6c6f9a','#182c49','#394c74','#777bb1','#aaa5cb'],
 ['#081f2a','#1e424b','#4c7a76','#0b3039','#285e63','#599689','#98bca6']
];
const dn13Hash=n=>{const q=Math.sin(n*127.1+311.7)*43758.5453;return q-Math.floor(q);};
const dn13Mod=(a,n)=>((a%n)+n)%n;
const dn13Clamp=(v,a,b)=>v<a?a:v>b?b:v;
const dn13Ease=u=>{u=dn13Clamp(u,0,1);return u*u*(3-2*u);};
function dn13Cv(w,h){const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);return c;}
function dn13Ready(){return typeof BOLUM_NO!=='undefined'&&BOLUM_NO===13&&W>0&&H>0&&S>0&&typeof cam!=='undefined'&&Number.isFinite(cam.x)&&Number.isFinite(cam.y);}
function dn13Mix(a,b,u){let h='#';for(let j=1;j<7;j+=2){const x=parseInt(a.slice(j,j+2),16),y=parseInt(b.slice(j,j+2),16);h+=Math.round(x+(y-x)*u).toString(16).padStart(2,'0');}return h;}
function dn13Rgba(h,a){return 'rgba('+parseInt(h.slice(1,3),16)+','+parseInt(h.slice(3,5),16)+','+parseInt(h.slice(5,7),16)+','+a+')';}
function dn13El(c,x,y,rx,ry,col,ang){c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),ang||0,0,DN13_TAU);c.fill();}
function dn13Bloom(c,col,x,y,rx,ry,a){c.save();c.translate(x,y);c.scale(rx,ry);const q=c.createRadialGradient(0,0,0,0,0,1);q.addColorStop(0,dn13Rgba(col,a));q.addColorStop(.35,dn13Rgba(col,a*.4));q.addColorStop(1,dn13Rgba(col,0));c.fillStyle=q;c.fillRect(-1,-1,2,2);c.restore();}
// Resampling a baked gradient once removes the browser's tiny ordered colour dither.
function dn13SmoothArt(im){const small=dn13Cv(Math.max(1,im.width>>1),Math.max(1,im.height>>1)),sc=small.getContext('2d'),c=im.getContext('2d');sc.drawImage(im,0,0,small.width,small.height);c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='copy';c.drawImage(small,0,0,im.width,im.height);c.globalCompositeOperation='source-over';return im;}
function dn13Phase(x){for(let j=0;j<6;j++){if(x<DN13_EDGES[j]-360)return j;if(x<DN13_EDGES[j]+360)return j+dn13Ease((x-DN13_EDGES[j]+360)/720);}return 6;}
function dn13Zone(x){for(let j=0;j<6;j++)if(x<DN13_EDGES[j])return j;return 6;}
function dn13Queue(key){if(DN13.art[key]||DN13.queued[key])return;DN13.queued[key]=true;DN13.queue.push(key);}
function dn13Want(key){if(DN13.art[key])return DN13.art[key];dn13Queue(key);return null;}
function dn13BuildOne(stamp){if(!Number.isFinite(stamp))stamp=typeof now==='number'?now:0;if(DN13.stamp===stamp||!DN13.queue.length)return false;DN13.stamp=stamp;
 const key=DN13.queue.shift(),start=performance.now();let im=null;
 if(key.startsWith('join'))im=dn13JoinArt(+key.slice(4));else if(key.startsWith('abut'))im=dn13AbutmentArt(+key.slice(4));else if(key.startsWith('light'))im=dn13LightArt(+key.slice(5));else if(key.startsWith('sky'))im=dn13SkyArt(+key.slice(3));else if(key.startsWith('cloud'))im=dn13CloudArt(+key.slice(5));else if(key.startsWith('tree'))im=dn13TreeArt(+key.slice(4));else if(key.startsWith('bough'))im=dn13BoughArt(+key.slice(5));else if(key==='bower')im=dn13BowerArt();else if(key==='willow')im=dn13WillowArt();else if(key==='pond')im=dn13PondArt();else if(key.startsWith('floor'))im=dn13FloorArt(+key.slice(5));else if(key.startsWith('island'))im=dn13IslandArt(+key.slice(6));else if(key.startsWith('fern'))im=dn13FernArt(+key.slice(4));else if(key.startsWith('sprout'))im=dn13SproutArt(+key.slice(6));else if(key==='moon')im=dn13MoonArt();else if(key==='aurora')im=dn13AuroraArt();else if(key==='fall')im=dn13FallArt();else if(key==='fx')im=dn13FxArt();
 if(im&&key.startsWith('light'))dn13SmoothArt(im);if(key==='fx'&&im)for(const name of ['teal','violet','warm','shaft','vig'])dn13SmoothArt(im[name]);if(im)DN13.art[key]=im;const ms=performance.now()-start,st=DN13.buildStats;st.n++;st.total+=ms;st.max=Math.max(st.max,ms);st.last=ms;st.key=key;return true;}
function dn13Clock(tm){const real=Number.isFinite(tm)?tm:0,dt=DN13.last===null?0:dn13Clamp(real-DN13.last,0,.1);DN13.last=real;if(typeof DURUM==='undefined'||DURUM==='oyun'||DURUM==='final')DN13.t+=dt;
 DN13.zone=dn13Phase(P.x);DN13.fin+=((DN13.dawn?1:0)-DN13.fin)*(1-Math.exp(-dt*.5));
 if(P.ground&&Math.abs(P.vx||0)>25&&(DN13.walkX===null||Math.abs(P.x-DN13.walkX)>34)){const p=DN13.steps[DN13.foot];p.x=P.x;p.y=P.y;p.t=DN13.t;DN13.walkX=P.x;DN13.foot=(DN13.foot+1)%16;}}

// Soft watercolor night. The seven atlases share the same stars, never jump at region seams.
function dn13LightArt(v){
 const im=dn13Cv(512,640),c=im.getContext('2d'),col=['#46bfff','#bf7eef','#ffaf9e','#72e8c7'][v];
 dn13Bloom(c,col,256,307,250,306,.34);dn13Bloom(c,col,256,291,152,202,.51);dn13Bloom(c,dn13Mix(col,'#efffeb',.53),255,282,58,90,.57);dn13Bloom(c,'#e3fff1',254,276,17,25,.73);
 return im;
}
function dn13SkyArt(v){const im=dn13Cv(800,600),c=im.getContext('2d'),pal=DN13_SKY[v],R=rng(130103),q=c.createLinearGradient(0,0,0,600);q.addColorStop(0,pal[0]);q.addColorStop(.46,pal[1]);q.addColorStop(.8,pal[2]);q.addColorStop(.93,dn13Mix(pal[1],'#0e2c38',.8));q.addColorStop(1,'#0e2c38');c.fillStyle=q;c.fillRect(0,0,800,600);
 for(let j=0;j<24;j++){const x=R()*900-50,y=R()*600,r=85+R()*200;dn13Bloom(c,j%4?pal[2]:v===4?'#9369b9':'#647bab',x,y,r,r*(.26+R()*.5),.025+R()*.045);}
 dn13Bloom(c,v===3?'#6ab8a1':v===4?'#a18bc5':'#89bdd4',570,255,390,320,.11);
 const tmp=dn13Cv(400,300);tmp.getContext('2d').drawImage(im,0,0,400,300);c.clearRect(0,0,800,600);c.drawImage(tmp,0,0,800,600);
 for(let j=0;j<145;j++){const x=R()*800,y=R()*R()*420,r=.25+R()*.65;dn13El(c,x,y,r,r,dn13Rgba('#d5e7e9',.17+R()*.4));}return im;}
// These large, translucent lights are rasterized once without Canvas gradient dithering.
// Only pixel writes occur at warmup; the frame loop still draws bounded cached sprites.
function dn13MoonArt(){
 const size=160,im=dn13Cv(size,size),c=im.getContext('2d'),data=c.createImageData(size,size),d=data.data,mares=[[167,168,16,12,.07],[203,192,22,27,.075],[222,225,17,12,.055],[182,239,18,12,.065],[230,170,12,16,.05],[153,211,10,13,.05]];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const xx=(x+.5)*400/size,yy=(y+.5)*400/size,r=Math.sqrt((xx-200)*(xx-200)+(yy-200)*(yy-200)),r2=Math.sqrt((xx-196)*(xx-196)+(yy-193)*(yy-193)),u=r/197,v=r2/148;
  const a1=u>=1?0:(u<.35?1-u/.35*.6:(1-u)/.65*.4)*.34,a2=v>=1?0:(v<.35?1-v/.35*.6:(1-v)/.65*.4)*.21;
  let aa=a1,rr=120*a1,gg=208*a1,bb=236*a1;rr=242*a2+rr*(1-a2);gg=229*a2+gg*(1-a2);bb=200*a2+bb*(1-a2);aa=a2+aa*(1-a2);
  if(r<97){
   const q=Math.sqrt((xx-171)*(xx-171)+(yy-166)*(yy-166))/100;let cr,cg,cb,ca,t;
   if(q<.54){t=q/.54;cr=255+(216-255)*t;cg=243+(239-243)*t;cb=213+(229-213)*t;ca=1;}
   else if(q<.84){t=(q-.54)/.30;cr=216+(149-216)*t;cg=239+(210-239)*t;cb=229+(218-229)*t;ca=1-.14*t;}
   else {t=dn13Clamp((q-.84)/.16,0,1);cr=149+(130-149)*t;cg=210+(200-210)*t;cb=218+(220-218)*t;ca=.86*(1-t);}
   ca*=dn13Clamp((97-r)/2,0,1);let shade=0;
   for(const m of mares){const dx=(xx-m[0])/m[2],dy=(yy-m[1])/m[3],s=Math.max(0,1-dx*dx-dy*dy);shade+=s*s*m[4];}
   cr*=1-shade;cg*=1-shade*.72;cb*=1-shade*.46;
   rr=cr*ca+rr*(1-ca);gg=cg*ca+gg*(1-ca);bb=cb*ca+bb*(1-ca);aa=ca+aa*(1-ca);
  }
  const o=(y*size+x)*4;if(aa>.0001){d[o]=rr/aa;d[o+1]=gg/aa;d[o+2]=bb/aa;d[o+3]=Math.round(aa*255);}
 }
 c.putImageData(data,0,0);return im;
}
// A united cloud silhouette with broad light and internal billows, not a row of shiny balls.
function dn13CloudArt(v){
 const im=dn13Cv(1024,512),c=im.getContext('2d'),R=rng(13300+v*47),pal=[['#a2c8df','#507d9f','#1b4168'],['#c6d9eb','#7ea3c1','#3b628d'],['#edf6f0','#8caac4','#294b70'],['#bce8d7','#6eaba8','#285c70'],['#eddbf3','#9a80b7','#3d365d']][v];
 const base=[[120,315,125,64],[245,280,165,95],[385,218,165,125],[520,200,180,142],[670,248,180,111],[820,295,150,83],[910,330,90,52],[720,340,200,64],[480,348,235,74],[270,347,180,66]],lobes=[],mass=new Path2D();
 // The whole cloud is painted once. Overlapping billows share one volume rather than flat disks.
 for(let j=0;j<base.length;j++){const b=base[j],x=b[0]+(R()-.5)*28,y=b[1]+Math.sin(j+v)*10,w=b[2]*(.91+R()*.17),h=b[3]*(.91+R()*.17);mass.moveTo(x+w,y);mass.ellipse(x,y,w,h,(R()-.5)*.1,0,DN13_TAU);lobes.push([x,y,w,h]);}
 dn13Bloom(c,pal[0],512,262,470,210,.035);
 const gr=c.createLinearGradient(0,75,0,435);gr.addColorStop(0,pal[0]);gr.addColorStop(.49,pal[1]);gr.addColorStop(1,pal[2]);c.fillStyle=gr;c.fill(mass);c.save();c.clip(mass);
 lobes.sort((a,b)=>a[1]-b[1]);
 for(const p of lobes){
  dn13Bloom(c,pal[2],p[0]-p[2]*.16,p[1]+p[3]*.40,p[2]*.80,p[3]*.32,.72);
  dn13Bloom(c,pal[0],p[0]+p[2]*.18,p[1]-p[3]*.56,p[2]*.64,p[3]*.42,.68);
  const crease=new Path2D();crease.moveTo(p[0]-p[2]*.74,p[1]+p[3]*.13);crease.bezierCurveTo(p[0]-p[2]*.31,p[1]+p[3]*.73,p[0]+p[2]*.40,p[1]+p[3]*.70,p[0]+p[2]*.81,p[1]+p[3]*.10);
  const shade=c.createLinearGradient(p[0]-p[2],0,p[0]+p[2],0);shade.addColorStop(0,dn13Rgba(pal[2],0));shade.addColorStop(.48,dn13Rgba(pal[2],.065));shade.addColorStop(1,dn13Rgba(pal[2],0));c.strokeStyle=shade;
  for(let j=0;j<6;j++){c.lineWidth=p[3]*(.04+j*.035);c.stroke(crease);}
 }

 dn13Bloom(c,dn13Mix(pal[0],'#fff3df',.2),566,155,260,114,.28);dn13Bloom(c,pal[2],360,398,360,94,.28);
 for(let j=0;j<42;j++){const x=R()*1024,y=184+R()*180,w=20+R()*65,q=c.createLinearGradient(x,0,x+w,0);q.addColorStop(0,dn13Rgba(pal[0],0));q.addColorStop(.48,dn13Rgba(pal[0],.025+R()*.04));q.addColorStop(1,dn13Rgba(pal[0],0));c.strokeStyle=q;c.lineWidth=2+R()*6;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+w*.46,y-5-R()*5,x+w,y-2);c.stroke();}
 c.restore();c.globalCompositeOperation='destination-in';
 const vertical=c.createLinearGradient(0,0,0,512);vertical.addColorStop(0,'rgba(0,0,0,0)');vertical.addColorStop(.10,'#000');vertical.addColorStop(.78,'#000');vertical.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=vertical;c.fillRect(0,0,1024,512);
 const horizontal=c.createLinearGradient(0,0,1024,0);horizontal.addColorStop(0,'rgba(0,0,0,0)');horizontal.addColorStop(.055,'#000');horizontal.addColorStop(.945,'#000');horizontal.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=horizontal;c.fillRect(0,0,1024,512);c.globalCompositeOperation='source-over';return dn13SmoothArt(im);
}
function dn13Point(p,t){const a=1-t;return [a*a*a*p[0]+3*a*a*t*p[2]+3*a*t*t*p[4]+t*t*t*p[6],a*a*a*p[1]+3*a*a*t*p[3]+3*a*t*t*p[5]+t*t*t*p[7]];}
function dn13Limb(c,p,w0,w1,col,hi){const L=[],R=[];for(let j=0;j<=16;j++){const t=j/16,a=dn13Point(p,Math.max(0,t-.01)),b=dn13Point(p,Math.min(1,t+.01)),q=dn13Point(p,t),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,w=(w0+(w1-w0)*Math.pow(t,.8))*.5;L.push([q[0]-dy/len*w,q[1]+dx/len*w]);R.push([q[0]+dy/len*w,q[1]-dx/len*w]);}
 c.beginPath();c.moveTo(L[0][0],L[0][1]);for(let j=1;j<L.length;j++)c.lineTo(L[j][0],L[j][1]);for(let j=R.length-1;j>=0;j--)c.lineTo(R[j][0],R[j][1]);c.closePath();const q=c.createLinearGradient(p[0]-w0,0,p[0]+w0,0);q.addColorStop(0,col);q.addColorStop(.6,hi);q.addColorStop(1,col);c.fillStyle=q;c.fill();
 c.strokeStyle=dn13Rgba(hi,.65);c.lineWidth=Math.max(.65,w0*.025);c.beginPath();c.moveTo(p[0]-w0*.13,p[1]);c.bezierCurveTo(p[2]-w0*.1,p[3],p[4],p[5],p[6],p[7]);c.stroke();}
// The folded light side and hairline vein are baked into the existing plant atlases.
// Unequal shoulders make the leaves read as living foliage rather than flat stamps.
function dn13Leaf(c,x,y,len,w,a,col){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=col;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-w*.94,-len*.39,w*.11,-len);c.quadraticCurveTo(w*1.08,-len*.55,0,0);c.fill();
 if(len>11){c.globalAlpha*=.22;c.fillStyle='#c5dbc0';c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(w*.22,-len*.4,w*.11,-len);c.quadraticCurveTo(w*1.08,-len*.55,0,0);c.fill();c.globalAlpha/= .22;c.strokeStyle='rgba(9,39,45,.32)';c.lineWidth=.55;c.beginPath();c.moveTo(0,-.8);c.quadraticCurveTo(w*.12,-len*.45,w*.11,-len*.91);c.stroke();}c.restore();}
function dn13Crown(c,x,y,w,h,pal,seed){
 const R=rng(seed),sil=new Path2D(),shadow=new Path2D(),mid=new Path2D(),lit=new Path2D();
 // An asymmetric leafy envelope follows a bending branch, rather than a circular blob.
 for(let j=0;j<18;j++){const a=j*DN13_TAU/18,r=.73+R()*.33,xx=x+Math.cos(a)*w*.51*r,yy=y+Math.sin(a)*h*.48*r+Math.cos(a)*h*.11;if(j===0)sil.moveTo(xx,yy);else sil.lineTo(xx,yy);}sil.closePath();
 const gr=c.createLinearGradient(x-w*.2,y-h*.5,x+w*.4,y+h*.5);gr.addColorStop(0,pal[4]);gr.addColorStop(.6,pal[3]);gr.addColorStop(1,'#092a37');c.fillStyle=gr;c.fill(sil);
 // Branch shadows join the canopy to its trunk. They remain inside the leafy mass.
 c.save();c.clip(sil);c.lineCap='round';for(let j=0;j<5;j++){const xx=x+(j-2)*w*.17,yy=y-h*(.02+dn13Hash(seed+j)*.21);c.strokeStyle=dn13Rgba(pal[0],.44);c.lineWidth=2.4+(4-j)*.3;c.beginPath();c.moveTo(x-w*.2,y+h*.28);c.bezierCurveTo(x-w*.08,y+h*.02,xx-w*.08,yy+h*.07,xx+w*.12,yy-h*.05);c.stroke();c.strokeStyle=dn13Rgba(pal[6],.15);c.lineWidth=.6;c.stroke();}c.restore();
 for(let j=0;j<350;j++){const a=R()*DN13_TAU,d=Math.sqrt(R()),xx=x+Math.cos(a)*d*w*.53,yy=y+Math.sin(a)*d*h*.47+Math.cos(a)*h*.11,l=7+R()*13,wi=2.7+R()*3.2,an=(R()-.5)*1.4+Math.cos(a)*.5;
  const ca=Math.cos(an),sa=Math.sin(an),path=j%7===0?lit:j%3===0?mid:shadow;path.moveTo(xx,yy);path.quadraticCurveTo(xx+ca*l*.45+sa*wi,yy+sa*l*.45-ca*wi,xx+ca*l,yy+sa*l);path.quadraticCurveTo(xx+ca*l*.45-sa*wi,yy+sa*l*.45+ca*wi,xx,yy);
 }
 c.fillStyle=pal[3];c.fill(shadow);c.fillStyle=pal[4];c.fill(mid);c.globalAlpha=.56;c.fillStyle=pal[5];c.fill(lit);c.globalAlpha=1;
 dn13Bloom(c,pal[5],x+w*.21,y-h*.12,w*.4,h*.5,.07);
}
function dn13TreeArt(v){
 if(v===3)return dn13WindTreeArt();
 const im=dn13Cv(660,840),c=im.getContext('2d'),R=rng(13610+v*79),pal=DN13_TPAL[v];
 const it={x:330,base:825,top:45,w:v===2?40:34,roots:true,br:7,brMin:235,brMax:645,brLen:v===2?1:1.12,flat:false,moss:14,vines:true,vineMax:725,fungi:3,fMin:350,fMax:675,seed:13610+v*79,gc:v===1?'#be91d0':'#79c9ba'};
 if(typeof dnGnarl==='function'&&typeof dnPaintTrees==='function'){
  it.geo=dnGnarl(it);const body=c.createLinearGradient(280,0,380,0);body.addColorStop(0,'#0a2330');body.addColorStop(.4,pal[0]);body.addColorStop(.75,pal[1]);body.addColorStop(1,'#0b2533');
  dnPaintTrees(c,[it],-300,950,{body,rim:dn13Rgba(pal[5],.26),rdx:1.7,rdy:-.4,bark:dn13Rgba(pal[2],.2),barkW:1.2,mossCol:pal[4],mossW:1.1,glow:it.gc,ga:.65,gs:.65,fungus:dn13Rgba(it.gc,.76)});
  const mask=new Path2D();for(const p of it.geo.parts)mask.addPath(p);c.save();c.clip(mask);
  for(let j=0;j<220;j++){const x=260+R()*145,y=R()*840;dn13El(c,x,y,2+R()*7,3+R()*13,j%3?'rgba(5,20,31,.08)':'rgba(114,161,134,.09)',(R()-.5)*.4);}
  for(let j=0;j<10;j++){const x=309+R()*35,y=160+R()*560;c.strokeStyle='rgba(6,24,32,.4)';c.lineWidth=.9;c.beginPath();c.ellipse(x,y,5+R()*7,13+R()*11,-.1,.1,5.5);c.stroke();}
  c.restore();dn13Bark(c,it,13631+v*71);
 }else dn13Limb(c,[330,825,285,575,375,230,330,-40],76,8,pal[0],pal[1]);
 const crowns=v===1?[[160,102,260,120],[396,27,325,150],[532,232,205,98],[137,335,204,80]]:[[126,102,255,102],[345,32,320,132],[524,198,222,95],[142,389,227,82],[515,425,197,80]];
 for(let j=0;j<crowns.length;j++){const a=crowns[j];dn13Crown(c,a[0],a[1]+78,a[2],a[3],pal,13700+v*37+j);}
 return im;
}
// One wind-grown tree replaces a regular grove trunk. Its whole silhouette remains inside the old bounds.
function dn13WindTreeArt(){
 const im=dn13Cv(660,840),c=im.getContext('2d'),pal=DN13_TPAL[2],main=[330,825,206,594,437,341,336,103],R=rng(16043);
 dn13Limb(c,main,78,8,'#092733','#28534e');c.save();c.globalCompositeOperation='source-atop';
 for(let j=0;j<10;j++){
  const path=new Path2D(),off=-.75+j*.16;
  for(let k=0;k<=28;k++){const t=k/28,p=dn13Point(main,t),a=dn13Point(main,Math.max(0,t-.005)),b=dn13Point(main,Math.min(1,t+.005)),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,w=(78+(8-78)*Math.pow(t,.8))*.5,xx=p[0]-dy/len*(off*w+Math.sin(t*17+j)*1.1),yy=p[1]+dx/len*off*w;if(k===0)path.moveTo(xx,yy);else path.lineTo(xx,yy);}
  c.strokeStyle=j%3?'rgba(3,20,29,.35)':'rgba(131,183,161,.19)';c.lineWidth=j%3?1.6:.8;c.stroke(path);
 }
 c.restore();
 dn13Limb(c,[315,744,234,803,157,807,89,828],28,2,'#0c2933','#31584e');dn13Limb(c,[338,767,392,807,487,809,553,832],29,2,'#0c2933','#31584e');
 const branches=[[[292,583,214,557,174,465,83,466],34],[[327,470,410,435,411,329,578,313],30],[[351,305,291,275,269,218,139,192],22],[[347,222,410,166,434,151,496,89],16],[[334,119,302,86,310,63,287,39],10]];
 for(const a of branches)dn13Limb(c,a[0],a[1],1,'#0a2934','#315a51');
 dn13Limb(c,[214,532,202,505,226,479,211,453],11,1,'#0c2b35','#345e52');dn13Limb(c,[430,369,459,363,469,326,508,309],9,1,'#0c2b35','#345e52');
 const crowns=[[140,439,230,118],[505,289,245,138],[174,173,235,117],[466,91,210,122],[292,65,200,120]];
 for(let j=0;j<crowns.length;j++){const a=crowns[j];dn13Crown(c,a[0],a[1],a[2],a[3],pal,16081+j*23);}
 for(let j=0;j<8;j++){
  const x=120+R()*420,y=170+R()*230,len=45+R()*142,off=(R()-.5)*35;c.strokeStyle='#315a50';c.lineWidth=1+R()*.7;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+off,y+len*.3,x-off*.4,y+len*.7,x+off*.3,y+len);c.stroke();
  for(let k=1;k<5;k++)dn13Leaf(c,x+Math.sin(k)*off*.2,y+len*k/5,9+R()*5,3,k%2?.7:-.8,'#4d7d65');
  if(j%3===0){dn13Bloom(c,'#98d4b7',x+off*.3,y+len,17,23,.26);dn13El(c,x+off*.3,y+len,1.8,3,'#cbecd2');}
 }
 for(let j=0;j<3;j++){const p=dn13Point(main,.21+j*.19),x=p[0]+(j%2?15:-15),y=p[1];dn13Bloom(c,j%2?'#b7a3d5':'#9dddc5',x,y,33,25,.25);c.fillStyle=j%2?'#a2a5cd':'#8dbdb2';c.beginPath();c.moveTo(x-9,y);c.bezierCurveTo(x-11,y-11,x+11,y-12,x+15,y);c.quadraticCurveTo(x+3,y+3,x-9,y);c.fill();c.strokeStyle='rgba(220,246,218,.65)';c.lineWidth=.7;c.beginPath();c.moveTo(x-7,y);c.quadraticCurveTo(x+2,y+3,x+13,y);c.stroke();}
 return im;
}
function dn13BoughArt(v){
 const im=dn13Cv(1120,860),c=im.getContext('2d'),R=rng(14630+v*41),items=[];
 for(let j=0;j<4;j++){const it={x:30+j*350+(R()-.5)*80,base:850,top:-70-R()*100,w:11+R()*14,roots:true,br:4,brMin:80,brMax:440,brLen:1.6,moss:8,vines:true,vineMax:690,fungi:0,seed:14630+j*71+v*41};items.push(it);}
 if(typeof dnPaintTrees==='function'){const gr=c.createLinearGradient(0,0,0,860);gr.addColorStop(0,v?'#101b32':'#061c29');gr.addColorStop(.55,v?'#1e2c4c':'#0f303d');gr.addColorStop(1,v?'#304564':'#1c4d55');dnPaintTrees(c,items,-300,1400,{body:gr,rim:v?'rgba(153,154,202,.16)':'rgba(109,199,192,.17)',rdx:1.1,rdy:0,bark:'rgba(107,171,168,.1)',barkW:1,mossCol:v?'#344864':'#225963',mossW:1,glow:v?'#a08dcc':'#6bc5ba',ga:.25,gs:.5,fungus:'#76b7af'});}
 c.globalCompositeOperation='destination-in';const q=c.createLinearGradient(0,0,0,860);q.addColorStop(0,'#000');q.addColorStop(.78,'#000');q.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=q;c.fillRect(0,0,1120,860);return im;
}
function dn13WildTrunk(c,it,col,glowc){
 if(typeof dnPaintTrees!=='function')return;const gr=c.createLinearGradient(it.x-it.w,0,it.x+it.w,0);gr.addColorStop(0,'#051723');gr.addColorStop(.7,col);gr.addColorStop(1,'#0a2330');it.gc=glowc;
 dnPaintTrees(c,[it],-500,1500,{body:gr,rim:dn13Rgba(glowc,.3),rdx:1.5,rdy:-.3,bark:dn13Rgba(glowc,.11),barkW:1.2,mossCol:'#2b5f5a',mossW:1.2,glow:glowc,ga:.65,gs:.65,fungus:dn13Rgba(glowc,.78)});dn13Bark(c,it,it.seed+113);
}
function dn13BowerArt(){
 const im=dn13Cv(1120,810),c=im.getContext('2d'),pal=DN13_TPAL[0],R=rng(15101);
 const a={x:190,base:800,top:-75,w:43,roots:true,br:7,brMin:40,brMax:520,brLen:1.8,moss:19,vines:true,vineMax:630,fungi:3,fMin:310,fMax:700,seed:15101};
 const b={x:1080,base:800,top:-90,w:37,roots:true,br:6,brMin:20,brMax:510,brLen:1.7,moss:17,vines:true,vineMax:590,fungi:2,fMin:330,fMax:620,seed:15139};
 dn13WildTrunk(c,a,'#14353d','#71bac0');dn13WildTrunk(c,b,'#11313d','#72b9b5');
 dn13Limb(c,[190,335,270,146,465,152,760,103],56,4,'#081f2c','#224b4b');dn13Limb(c,[1080,291,940,158,837,210,640,158],40,3,'#091f2c','#214c4b');
 dn13Crown(c,408,134,460,106,pal,15171);dn13Crown(c,912,92,430,143,pal,15192);
 c.lineCap='round';for(let j=0;j<16;j++){const x=220+R()*690,y=130+R()*85,len=45+R()*152,off=(R()-.5)*25;c.strokeStyle='#123d41';c.lineWidth=1.6;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+off,y+len*.32,x-off,y+len*.66,x+off*.3,y+len);c.stroke();for(let k=1;k<6;k++)dn13Leaf(c,x+off*Math.sin(k),y+len*k/6,9,3,k%2?.65:-.7,'#23594f');if(j%3===0){dn13Bloom(c,'#7ad1c7',x+off*.3,y+len,20,24,.22);dn13El(c,x+off*.3,y+len,2.1,3.1,'#bcebd7');}}
 // A small luminous hollow belongs inside the ancient trunk, not on a sign or ornament.
 if(a.geo){const mask=new Path2D();for(const q of a.geo.parts)mask.addPath(q);c.save();c.clip(mask);dn13El(c,190,624,23,42,'#031620',-.12);dn13Bloom(c,'#60cfd1',190,636,24,37,.43);dn13El(c,191,650,10,4,'#74c2ad');c.restore();}
 return im;
}
function dn13WillowArt(){
 const im=dn13Cv(880,930),c=im.getContext('2d'),R=rng(15231),pal=DN13_TPAL[2],it={x:650,base:920,top:-45,w:43,roots:true,br:8,brMin:45,brMax:450,brLen:1.9,flat:true,moss:21,vines:true,vineMax:820,fungi:2,fMin:460,fMax:790,seed:15231};dn13WildTrunk(c,it,'#123a43','#7ac9b8');
 dn13Limb(c,[650,355,530,161,333,180,113,259],49,2,'#092b37','#245454');
 dn13Crown(c,416,146,660,154,pal,15271);dn13Crown(c,212,252,342,102,pal,15272);dn13Crown(c,713,96,275,147,pal,15273);
 for(let j=0;j<25;j++){const x=136+R()*610,y=159+Math.sin(x*.008)*51+R()*35,len=140+R()*350,off=(R()-.5)*73;c.strokeStyle=j%3?'#1f5051':'#3a7167';c.lineWidth=1+R()*1.2;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+off,y+len*.3,x-off*.6,y+len*.7,x+off*.4,y+len);c.stroke();for(let k=1;k<8;k++){const u=k/8,xx=x+Math.sin(u*Math.PI*2)*off*.35;dn13Leaf(c,xx,y+len*u,10+R()*6,3.5,k%2?.8:-.6,j%4?'#275c54':'#568e79');}if(j%4===0){dn13Bloom(c,j%8?'#8ccfbe':'#b2a1db',x+off*.4,y+len,18,22,.3);dn13El(c,x+off*.4,y+len,2.1,3.3,'#d0ebd2');}}
 return im;
}
function dn13PondArt(){
 const im=dn13Cv(900,650),c=im.getContext('2d'),R=rng(15301),pal=DN13_TPAL[0],p=new Path2D();p.moveTo(75,350);p.bezierCurveTo(187,289,333,320,466,298);p.bezierCurveTo(630,282,754,311,832,353);p.bezierCurveTo(815,402,755,418,705,414);p.bezierCurveTo(657,410,639,468,592,478);p.bezierCurveTo(559,489,542,458,505,481);p.bezierCurveTo(475,511,449,537,416,532);p.bezierCurveTo(363,526,347,481,302,472);p.bezierCurveTo(253,475,212,427,162,419);p.quadraticCurveTo(110,412,75,350);p.closePath();const gr=c.createLinearGradient(0,310,0,650);gr.addColorStop(0,'#2c5556');gr.addColorStop(.45,'#183d49');gr.addColorStop(1,'#0b263d');c.fillStyle=gr;c.fill(p);c.save();c.clip(p);for(let j=0;j<7;j++){const x=146+R()*603,y=376+R()*103,w=24+R()*52,h=19+R()*26,rock=new Path2D();rock.moveTo(x-w,y);rock.lineTo(x-w*.1,y-h);rock.lineTo(x+w,y-h*.35);rock.lineTo(x+w*.5,y+h);rock.lineTo(x-w*.7,y+h*.6);rock.closePath();const q=c.createLinearGradient(x-w,y-h,x+w,y+h);q.addColorStop(0,'rgba(8,29,40,.18)');q.addColorStop(1,'rgba(100,161,145,.13)');c.fillStyle=q;c.fill(rock);}
 dn13Limb(c,[155,345,209,399,165,447,339,499],16,1,'#15383e','#3c6553');dn13Limb(c,[789,350,694,397,743,451,575,512],18,1,'#14353d','#3e6554');dn13Limb(c,[496,356,427,404,555,480,453,583],10,1,'#14373e','#3e6654');dn13Limb(c,[219,418,246,436,259,479,307,491],4,.7,'#14383c','#3d6654');dn13Limb(c,[703,431,668,452,681,476,636,497],5,.7,'#14383c','#3b6252');c.restore();
 dn13WildTrunk(c,{x:151,base:351,top:45,w:17,roots:true,br:5,brMin:105,brMax:240,brLen:1.2,moss:9,vines:true,vineMax:285,fungi:2,fMin:155,fMax:294,seed:15373},'#123841','#82c7bb');
 dn13WildTrunk(c,{x:792,base:354,top:55,w:16,roots:true,br:4,brMin:110,brMax:215,brLen:1.25,moss:9,vines:true,vineMax:278,fungi:1,fMin:180,fMax:280,seed:15419},'#123841','#82c7bb');
 dn13Crown(c,171,90,270,104,pal,15401);dn13Crown(c,770,100,245,91,pal,15402);
 const pool=new Path2D();pool.moveTo(244,335);pool.bezierCurveTo(301,304,411,307,490,306);pool.bezierCurveTo(603,304,693,313,727,336);pool.bezierCurveTo(671,368,589,369,494,365);pool.bezierCurveTo(395,375,284,359,244,335);pool.closePath();dn13Bloom(c,'#61c8cc',486,332,283,84,.22);const water=c.createLinearGradient(0,305,0,372);water.addColorStop(0,'#439eae');water.addColorStop(.58,'#205d7e');water.addColorStop(1,'#163b56');c.fillStyle=water;c.fill(pool);c.strokeStyle='#315a4b';c.lineWidth=8;c.stroke(pool);for(let k=0;k<42;k++){const a=k*DN13_TAU/42,xx=486+Math.cos(a)*(231+Math.sin(k*2.1)*7),yy=335+Math.sin(a)*(28+Math.cos(k*1.7)*4);dn13El(c,xx,yy,4+R()*5,2+R()*2,k%4?'#477661':'#639578');}c.save();c.clip(pool);c.strokeStyle='rgba(162,224,222,.44)';c.lineWidth=1.3;for(let j=0;j<17;j++){const x=260+R()*450,y=310+R()*56;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+15,y-2,x+25+R()*38,y);c.stroke();}c.globalCompositeOperation='lighter';dn13Bloom(c,'#7fe0dc',504,330,170,33,.36);dn13Bloom(c,'#e3fff1',535,327,46,17,.48);c.restore();
 for(let j=0;j<8;j++){const x=220+j*76+(R()-.5)*35,y=340+Math.sin(j*.7)*17,len=27+R()*48;c.strokeStyle='#356c63';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-7,y-len*.6,x+4,y-len);c.stroke();dn13Leaf(c,x,y-12,17,5,-.7,'#427d69');dn13Bloom(c,j%3?'#7de2d1':'#c38cdf',x+4,y-len,14,19,.3);dn13El(c,x+4,y-len,3.1,5.2,j%3?'#b5e2c6':'#c4a3da');}
 for(let j=0;j<7;j++){const x=255+j*67,y=375+(j%3)*10,len=46+R()*77;c.strokeStyle='#295e57';c.lineWidth=1.4;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+21,y+len*.25,x-18,y+len*.7,x+5,y+len);c.stroke();for(let k=1;k<5;k++)dn13Leaf(c,x+Math.sin(k)*7,y+len*k/5,10,3,k%2?.7:-.8,'#427e68');if(j%2){dn13Bloom(c,'#83e1d0',x+5,y+len,16,20,.39);dn13El(c,x+5,y+len,2.2,3.3,'#d2f4d7');}}
 return im;
}
function dn13FernArt(v){const im=dn13Cv(300,270),c=im.getContext('2d'),R=rng(13700+v*71),cols=v===1?['#283c5c','#485b83','#778da5']:['#164551','#2b766f','#66aa92'];c.lineCap='round';
 for(let j=0;j<9;j++){const angle=(j-4)*.23,len=110+R()*120,ex=150+Math.sin(angle)*len,ey=266-Math.cos(angle)*len;c.strokeStyle=cols[1];c.lineWidth=1.9;c.beginPath();c.moveTo(150,268);c.quadraticCurveTo(150+Math.sin(angle)*len*.28,ey+len*.25,ex,ey);c.stroke();
  for(let k=1;k<10;k++){const u=k/10,x=150+(ex-150)*u*u,y=268+(ey-268)*u,w=27*Math.sin(u*Math.PI)*(1-j%3*.1);for(let sd=-1;sd<=1;sd+=2)dn13Leaf(c,x,y,w+6,5+R()*3,angle+sd*(.85+u*.4),cols[k%3]);}}
 return im;}
function dn13SproutArt(v){const im=dn13Cv(240,200),c=im.getContext('2d'),R=rng(13811+v),col=v?'#9b9bc5':'#78c3bf';c.lineCap='round';
 for(let j=0;j<7;j++){const x=36+j*27,y=198,h=38+R()*95;c.strokeStyle=v?'#67799c':'#477d85';c.lineWidth=2.5;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-7,y-h*.4,x+5,y-h);c.stroke();
  if(j%2){dn13Bloom(c,col,x+5,y-h,46,36,.34);const q=c.createLinearGradient(0,y-h-14,0,y-h+5);q.addColorStop(0,dn13Mix(col,'#f4ffed',.76));q.addColorStop(1,col);c.fillStyle=q;c.beginPath();c.moveTo(x-15,y-h+1);c.bezierCurveTo(x-16,y-h-19,x+22,y-h-26,x+25,y-h+1);c.quadraticCurveTo(x+5,y-h+7,x-15,y-h+1);c.fill();
   // The little cap has a shaded underside, fine gills and a reflected dew edge.
   c.fillStyle=v?'#667b9c':'#397876';c.beginPath();c.moveTo(x-14,y-h+1);c.quadraticCurveTo(x+5,y-h+10,x+24,y-h+1);c.quadraticCurveTo(x+5,y-h+3,x-14,y-h+1);c.fill();c.strokeStyle='rgba(207,235,216,.31)';c.lineWidth=.45;for(let k=0;k<5;k++){c.beginPath();c.moveTo(x+5,y-h+6);c.lineTo(x-10+k*7,y-h+2);c.stroke();}c.strokeStyle='rgba(224,255,240,.78)';c.lineWidth=.7;c.beginPath();c.moveTo(x-11,y-h+1);c.quadraticCurveTo(x+5,y-h+6,x+21,y-h+1);c.stroke();dn13El(c,x+9,y-h-10,1.5,.8,'rgba(247,255,232,.62)',-.3);}
  else {for(let k=0;k<4;k++)dn13Leaf(c,x+3,y-h*.3-k*9,14+k*2,5,(k%2?1:-1)*.8,v?'#7688a4':'#4d9e94');dn13Bloom(c,col,x+5,y-h,25,29,.26);dn13El(c,x+5,y-h,3,5,dn13Mix(col,'#f1ffeb',.69));}
 }
 // Low blue-violet wood-bells have folded petals, not a halo or an interactive marker.
 for(let j=0;j<3;j++){const x=51+j*62,y=194,h=27+R()*23,side=j%2?1:-1;c.strokeStyle=v?'#59677f':'#416d67';c.lineWidth=1.2;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+side*3,y-h*.5,x+side*13,y-h-5,x+side*18,y-h+1);c.stroke();dn13Leaf(c,x,y-5,22,6,-side*.5,v?'#63718b':'#497f70');const xx=x+side*18,yy=y-h+1;c.fillStyle=v?'#a9a1c8':'#8b91ba';c.beginPath();c.moveTo(xx-3,yy-2);c.bezierCurveTo(xx-8,yy,xx-10,yy+8,xx-9,yy+12);c.quadraticCurveTo(xx-4,yy+9,xx,yy+13);c.quadraticCurveTo(xx+4,yy+9,xx+8,yy+12);c.bezierCurveTo(xx+8,yy+5,xx+5,yy-1,xx+2,yy-2);c.closePath();c.fill();c.strokeStyle='rgba(219,219,227,.45)';c.lineWidth=.8;c.beginPath();c.moveTo(xx-1,yy);c.quadraticCurveTo(xx-3,yy+7,xx,yy+11);c.stroke();dn13El(c,xx,yy+11,1.5,.8,'#b5bda3');}
 return im;}

// Organic terrain retains the exact contact line, while roots and clouds sculpt the visible underside.
function dn13Stone(c,x,y,w,h,seed){
 const R=rng(seed),p=new Path2D(),pts=[];for(let j=0;j<9;j++){const a=j*DN13_TAU/9,r=.82+R()*.18;pts.push([x+Math.cos(a)*w*r,y+Math.sin(a)*h*r]);}p.moveTo((pts[8][0]+pts[0][0])*.5,(pts[8][1]+pts[0][1])*.5);for(let j=0;j<9;j++){const a=pts[j],b=pts[(j+1)%9];p.quadraticCurveTo(a[0],a[1],(a[0]+b[0])*.5,(a[1]+b[1])*.5);}p.closePath();
 const q=c.createLinearGradient(x-w,y-h,x+w,y+h);q.addColorStop(0,'#465e63');q.addColorStop(.42,'#2b4b54');q.addColorStop(1,'#152d3d');c.fillStyle=q;c.fill(p);c.save();c.clip(p);c.strokeStyle='rgba(128,157,151,.16)';c.lineWidth=1;c.beginPath();c.moveTo(x-w,y-h*.2);c.lineTo(x-w*.2,y-h*.45);c.lineTo(x+w*.5,y-h*.2);c.stroke();c.strokeStyle='rgba(5,22,35,.25)';c.beginPath();c.moveTo(x+w*.15,y-h*.8);c.lineTo(x-w*.05,y);c.lineTo(x+w*.12,y+h*.5);c.stroke();c.restore();
}
function dn13FloorArt(v){
 if(v===7){const im=dn13Cv(768,72),c=im.getContext('2d');c.strokeStyle='#315c50';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(-4,31.5);c.bezierCurveTo(240,31.5,520,31.5,772,31.5);c.stroke();c.strokeStyle='rgba(132,175,143,.35)';c.lineWidth=.7;c.stroke();return im;}
 const w=768,kind=v===4?0:v===5?2:v===6?1:v===8||v===9?3:v,h=kind===3?220:470,im=dn13Cv(w,h),c=im.getContext('2d'),R=rng(13910+v*83),top=28;
 const bottom=x=>top+159+Math.sin(x*Math.PI/w)*(Math.sin(x*DN13_TAU/w*2.4+v)*39+Math.sin(x*DN13_TAU/w*4.1+v*.7)*18);
 if(kind===3){
  const bark=new Path2D();
  for(let band=0;band<3;band++){
   const upper=[],lower=[];for(let x=-12;x<=w+12;x+=5){const env=Math.sin(Math.PI*dn13Clamp(x/w,0,1)),cy=top+12+band*9+env*(Math.sin(x*.011+band*2.1+v*.71)*(7+band*4)+Math.sin(x*.031+v)*2),r=9-band+env*(Math.sin(x*.064+band)*1.6+Math.sin(x*.113+band)*.65);upper.push([x,cy-r]);lower.push([x,cy+r]);}
   const q=new Path2D();q.moveTo(upper[0][0],upper[0][1]);for(let j=1;j<upper.length;j++)q.lineTo(upper[j][0],upper[j][1]);for(let j=lower.length-1;j>=0;j--)q.lineTo(lower[j][0],lower[j][1]);q.closePath();bark.addPath(q);const gr=c.createLinearGradient(0,top+5,0,top+51);gr.addColorStop(0,'#325a4d');gr.addColorStop(.4,band===1?'#294e45':'#20443e');gr.addColorStop(.7,'#12323a');gr.addColorStop(1,'#26483f');c.fillStyle=gr;c.fill(q);
  }
  c.save();c.clip(bark);for(let j=0;j<155;j++){const x=R()*w,y=top+4+R()*49;dn13El(c,x,y,1.2+R()*7,.5+R()*1.7,j%4?'rgba(3,19,29,.22)':'rgba(152,180,134,.14)',-.25+R()*.5);}
  for(let j=0;j<11;j++){const x=27+R()*714,y=top+11+R()*24;c.strokeStyle='rgba(3,20,30,.6)';c.lineWidth=.7+R()*.8;c.beginPath();c.moveTo(x-22,y+2);c.bezierCurveTo(x-8,y-7,x+11,y+8,x+31,y-2);c.stroke();}
  for(let j=0;j<3;j++){const x=80+R()*610,y=top+17+R()*13,rx=7+R()*8,ry=3+R()*4;dn13El(c,x,y,rx+2,ry+2,'#24483e',-.18);c.strokeStyle='rgba(126,167,131,.29)';c.lineWidth=.7;c.beginPath();c.ellipse(x,y,rx,ry,-.18,3.3,6);c.stroke();dn13El(c,x+1,y,rx*.42,ry*.45,'rgba(3,20,29,.48)',-.18);}
  for(let j=0;j<9;j++)dn13El(c,30+R()*710,top+7+R()*24,7+R()*13,1+R()*2,'rgba(100,151,111,.14)',-.16);c.restore();
  c.strokeStyle='#315a49';c.lineWidth=7;c.beginPath();c.moveTo(-4,top+4);c.bezierCurveTo(170,top+4,580,top+4,w+4,top+4);c.stroke();
  for(let j=0;j<4+v%3;j++){const x=36+R()*690,y=top+35+R()*10,sd=j%2?1:-1,len=19+R()*78;dn13Limb(c,[x,y,x+sd*35,y+len*.1,x-sd*14,y+len*.7,x+sd*18,y+len],8,1,'#17383a','#365b4c');for(let k=0;k<3;k++)dn13Leaf(c,x+sd*8,y+len*.4+k*8,9,2.4,sd*.7,'#356c56');}
 }else {
  const bank=new Path2D();bank.moveTo(0,top);bank.lineTo(w,top);for(let x=w;x>=0;x-=8)bank.lineTo(x,bottom(x));bank.closePath();
  const q=c.createLinearGradient(0,top,0,top+260);q.addColorStop(0,kind===1?'#8097b2':kind===2?'#365660':'#2d5a53');q.addColorStop(.24,kind===1?'#58758f':'#203f46');q.addColorStop(1,'#081a2b');c.fillStyle=q;c.fill(bank);c.save();c.clip(bank);
  if(kind===1){
   // Pressed cloud turf: softly shaded little billows live below the exact walking plane.
   for(let j=0;j<27;j++){const x=66+R()*(w-132),y=top+19+R()*103,r=17+R()*28,gr=c.createRadialGradient(x+r*.17,y-r*.35,2,x,y,r);gr.addColorStop(0,'rgba(196,216,217,.32)');gr.addColorStop(.58,'rgba(142,173,193,.09)');gr.addColorStop(1,'rgba(76,112,149,0)');c.fillStyle=gr;c.beginPath();c.ellipse(x,y,r,r*.7,0,0,DN13_TAU);c.fill();}
  }else {
   // Embedded stones and old diagonal roots break both scale and direction.
   for(let j=0;j<9;j++){const x=76+R()*(w-152),y=top+27+R()*104;dn13Stone(c,x,y,19+R()*41,13+R()*24,14400+v*37+j);}
   for(let j=0;j<7;j++){const x=111+j*84+(R()-.5)*26,sd=j%2?1:-1,len=88+R()*145,ey=top+len;dn13Limb(c,[x,top+10,x+sd*(35+R()*30),top+51,x-sd*(16+R()*27),ey-44,x+sd*(30+R()*31),ey],17+R()*14,2,'#122f37','#3b5f54');
    if(j%2===0)dn13Limb(c,[x+sd*13,top+58,x-sd*25,top+81,x-sd*45,top+122,x-sd*49,top+145],8,1,'#17373d','#3e6156');
   }
   for(let j=0;j<220;j++){const x=R()*w,y=top+5+R()*155,r=2+R()*8;dn13El(c,x,y,r,r*.47,j%3?'rgba(7,24,32,.08)':'rgba(91,135,106,.08)',R()*.6);}
  }
  c.restore();
  if(kind!==1)for(let j=0;j<5;j++){const x=62+j*151+(R()-.5)*43,y=bottom(x)-7,sd=j%2?1:-1,len=48+R()*110;dn13Limb(c,[x,y,x+sd*25,y+len*.1,x-sd*33,y+len*.7,x+sd*8,y+len],7+R()*4,1,'#16373c','#33554c');if(j%2)dn13Limb(c,[x,y+len*.25,x-sd*22,y+len*.38,x-sd*27,y+len*.52,x-sd*39,y+len*.68],4,1,'#15343c','#2c5049');}
 }
 // Moss consists of broken shadows, soft green hummocks and sparse dew, with no neon seam.
 for(let x=-10;x<w+20;){const r=5+R()*8,y=top+3+R()*4;dn13El(c,x,y,r+4,4+R()*3,kind===1?'#8ea7b8':'#285e4e');dn13El(c,x+1,y-1,r,2.8+R(),kind===1?'#a9c0c8':kind===2?'#437969':'#3d7860');if(R()<.28)dn13El(c,x+3,y-2,r*.45,.9,kind===1?'#d0ded7':'#76a68a');x+=5+R()*11;}
 c.lineWidth=1.05;c.lineCap='round';for(let x=0;x<w;x+=5+R()*7){const k=R(),hh=2+R()*8;if(k<.25)continue;c.strokeStyle=k>.87?'#84b193':kind===1?'#b5cdd0':'#4b876a';c.beginPath();c.moveTo(x,top+3);c.quadraticCurveTo(x+2,top-hh*.5,x+3,top-hh);c.stroke();}
 c.globalCompositeOperation='destination-in';const fade=c.createLinearGradient(0,0,0,h);fade.addColorStop(0,'#000');fade.addColorStop(.62,'#000');fade.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=fade;c.fillRect(0,0,w,h);return im;
}
// Fine bark follows the same gnarled centre-line as the source tree; it is baked once.
function dn13Bark(c,it,seed){
 if(!it.geo)return;const R=rng(seed),S=rng(it.seed),ph=S()*6.28,ph2=S()*6.28,amp=(.25+S()*.5)*it.w,lean=(S()-.5)*it.w*1.4;
 const cx=t=>it.x+(Math.sin(t*2.4+ph)-Math.sin(ph))*amp+lean*t+Math.sin(t*8+ph2)*it.w*.07,mask=new Path2D();
 for(const p of it.geo.parts)mask.addPath(p);c.save();c.clip(mask);c.lineCap='round';
 for(let j=0;j<15;j++){
  const off=-.88+j*.124,pts=[],start=.025+R()*.08,end=.86+R()*.13;
  for(let k=0;k<=17;k++){const t=start+(end-start)*k/17,w=it.w*(1-.3*t),x=cx(t)+off*w+Math.sin(t*19+j*.8)*it.w*.045,y=it.base+(it.top-it.base)*t;pts.push([x,y]);}
  c.strokeStyle=j%3?'rgba(1,12,23,.22)':'rgba(119,179,167,.15)';c.lineWidth=j%3?1.15+R()*1.25:.65+R()*.55;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
  for(let k=1;k<pts.length;k++){const p=pts[k-1],q=pts[k];c.quadraticCurveTo(p[0],p[1],(p[0]+q[0])*.5,(p[1]+q[1])*.5);}c.stroke();
 }
 for(let j=0;j<4;j++){
  const t=.12+R()*.73,x=cx(t)+(R()-.5)*it.w*.7,y=it.base+(it.top-it.base)*t,w=it.w*(.10+R()*.09),h=w*(1.8+R());
  dn13El(c,x,y,w,h,'rgba(2,16,26,.17)',-.14);c.strokeStyle='rgba(143,185,163,.12)';c.lineWidth=.7;c.beginPath();c.ellipse(x+1,y-1,w*.76,h*.83,-.14,3.2,6.1);c.stroke();
 }
 c.restore();
}
function dn13FloorVariant(region,j){return region===2||region===5?(j%2?1:6):region===4||region===6?(j%2?2:5):(j%2?0:4);}
const DN13_JOIN_EDGES=[2,3,4,5];
function dn13JoinArt(n){
 const edgeIndex=DN13_JOIN_EDGES[n],edge=DN13_EDGES[edgeIndex],left=edge-96,im=dn13Cv(192,470),c=im.getContext('2d');
 for(let side=0;side<2;side++){
  const layer=dn13Cv(192,470),x=layer.getContext('2d'),region=edgeIndex+side;
  for(let j=Math.floor(left/768);j<=Math.floor((left+192)/768);j++){const src=DN13.art['floor'+dn13FloorVariant(region,j)];if(src)x.drawImage(src,j*768-left,0);}
  x.globalCompositeOperation='destination-in';const m=x.createLinearGradient(0,0,192,0);m.addColorStop(0,side?'rgba(0,0,0,0)':'#000');m.addColorStop(1,side?'#000':'rgba(0,0,0,0)');x.fillStyle=m;x.fillRect(0,0,192,470);
  c.globalCompositeOperation=side?'lighter':'copy';c.drawImage(layer,0,0);
 }
 c.globalCompositeOperation='source-over';return im;
}
function dn13AbutmentArt(v){
 const im=dn13Cv(520,360),c=im.getContext('2d'),R=rng(15910+v*97),p=new Path2D();
 p.moveTo(-15,28);p.lineTo(260,28);p.bezierCurveTo(309,43,278,83,272,111);p.bezierCurveTo(284,151,239,139,245,179);p.bezierCurveTo(241,213,198,220,174,248);p.bezierCurveTo(134,289,86,253,-15,265);p.closePath();
 const gr=c.createLinearGradient(0,28,0,280);gr.addColorStop(0,v?'#7498aa':'#2d5a53');gr.addColorStop(.32,v?'#375f76':'#203f46');gr.addColorStop(1,'#0a2336');c.fillStyle=gr;c.fill(p);c.save();c.clip(p);
 for(let j=0;j<11;j++)dn13Stone(c,35+R()*220,55+R()*162,14+R()*27,12+R()*25,15940+j+v*79);
 dn13Limb(c,[175,30,310,85,222,154,175,267],24,2,'#15383e','#456956');dn13Limb(c,[240,34,291,100,202,142,210,221],15,1,'#14343c','#3c6253');dn13Limb(c,[112,31,259,111,216,198,131,278],19,1,'#14363d','#416755');
 for(let j=0;j<80;j++){const x=R()*290,y=28+R()*235;dn13El(c,x,y,1+R()*5,1+R()*4,j%4?'rgba(4,25,32,.12)':'rgba(129,169,132,.1)');}c.restore();
 dn13Limb(c,[259,66,291,90,335,73,377,53],10,1,'#183a3f','#426951');dn13Limb(c,[244,138,272,187,338,175,355,145],7,1,'#15383e','#3c6552');dn13Leaf(c,347,157,19,5,.8,'#527d60');
 for(let x=-8;x<270;x+=5+R()*10){const r=4+R()*10;dn13El(c,x,31+R()*4,r,3+R()*3,v?'#9db6bc':'#467e62');c.strokeStyle=v?'#c3d6ce':'#719b77';c.lineWidth=.8;c.beginPath();c.moveTo(x,30);c.quadraticCurveTo(x+1,24-R()*4,x+4,22-R()*6);c.stroke();}
 c.globalCompositeOperation='destination-in';const f=c.createLinearGradient(0,0,90,0);f.addColorStop(0,'rgba(0,0,0,0)');f.addColorStop(1,'#000');c.fillStyle=f;c.fillRect(0,0,520,360);return im;
}
function dn13DrawGround(){
 const vw=W/S,left=cam.x-35,right=cam.x+vw+35,start=Math.floor(left/768),end=Math.ceil(right/768);
 for(let region=0;region<7;region++){
  if(region===1)continue;const x0=region?DN13_EDGES[region-1]:0,x1=region<6?DN13_EDGES[region]:28800,lo=Math.max(left,x0),hi=Math.min(right,x1);if(hi<=lo)continue;
  g.save();g.beginPath();g.rect(lo,675,hi-lo,650);g.clip();
  for(let j=start;j<=end;j++){const x=j*768;if(x+769<lo||x>hi)continue;const im=DN13.art['floor'+dn13FloorVariant(region,j)]||DN13.art.floor0;if(im)g.drawImage(im,x,692,768.5,470);else {g.fillStyle='#31574e';g.fillRect(x,720,769,100);}}
  g.restore();
 }
 for(let n=0;n<DN13_JOIN_EDGES.length;n++){const edge=DN13_EDGES[DN13_JOIN_EDGES[n]],im=DN13.art['join'+n];if(im&&edge+96>left&&edge-96<right)g.drawImage(im,edge-96,692);}
 if(right>3600&&left<6800){
  g.save();g.beginPath();g.rect(3600,680,3200,420);g.clip();
  for(let j=start;j<=end;j++){const x=j*768,im=DN13.art['floor'+(j%3===0?3:j%3===1?8:9)]||DN13.art.floor3;if(im)g.drawImage(im,x,692,768.5,im.height);else {g.fillStyle='#31584b';g.fillRect(x,720,769,28);g.fillStyle='#7ba98a';g.fillRect(x,720,769,2);}}
  g.restore();
 }
 for(let side=0;side<2;side++){const edge=side?6800:3600,im=DN13.art['abut'+side];if(!im||edge+300<left||edge-300>right)continue;g.save();g.translate(edge+(side?260:-260),692);if(side)g.scale(-1,1);g.drawImage(im,0,0);g.restore();}
}
function dn13IslandArt(v){
 const im=dn13Cv(620,780),c=im.getContext('2d'),R=rng(14020+v*17),ground=422,p=new Path2D();
 const top=[[40,429],[92,417],[151,423],[209,409],[272,416],[337,407],[401,418],[474,414],[535,423],[579,431]];
 p.moveTo(top[0][0],top[0][1]);for(let j=1;j<top.length;j++){const a=top[j-1],b=top[j];p.quadraticCurveTo(a[0],a[1],(a[0]+b[0])*.5,(a[1]+b[1])*.5);}p.lineTo(579,431);
 if(v===1){p.bezierCurveTo(571,478,542,510,507,496);p.bezierCurveTo(476,490,454,547,416,531);p.lineTo(381,558);p.lineTo(349,533);p.bezierCurveTo(310,553,286,594,244,574);p.lineTo(211,535);p.bezierCurveTo(154,552,125,493,83,494);p.quadraticCurveTo(41,483,40,429);}
 else if(v===2){p.bezierCurveTo(548,459,529,489,486,479);p.bezierCurveTo(450,490,470,550,431,567);p.bezierCurveTo(416,587,383,584,374,614);p.bezierCurveTo(343,650,312,597,290,599);p.bezierCurveTo(265,594,246,537,217,533);p.bezierCurveTo(174,551,158,509,133,500);p.bezierCurveTo(84,500,51,470,40,429);}
 else {p.bezierCurveTo(562,475,521,481,509,522);p.bezierCurveTo(498,558,452,545,432,590);p.bezierCurveTo(399,647,367,659,344,689);p.bezierCurveTo(305,719,280,652,251,649);p.bezierCurveTo(202,642,203,586,162,563);p.bezierCurveTo(131,537,92,542,83,500);p.quadraticCurveTo(48,486,40,429);}p.closePath();
 const q=c.createLinearGradient(120,425,400,720);q.addColorStop(0,'#33505b');q.addColorStop(.36,'#243f4d');q.addColorStop(1,'#102d43');c.fillStyle=q;c.fill(p);c.save();c.clip(p);
 // Broken rock planes and branching roots differ with each island silhouette.
 for(let j=0;j<8;j++){
  const x=91+R()*425,y=448+R()*(v===1?100:169),ww=27+R()*58,hh=18+R()*35,face=new Path2D();face.moveTo(x-ww*.8,y-hh*.2);face.lineTo(x+ww*.25,y-hh);face.lineTo(x+ww,y-hh*.12);face.lineTo(x+ww*.42,y+hh*.7);face.lineTo(x-ww*.65,y+hh*.55);face.closePath();const q=c.createLinearGradient(x-ww,y-hh,x+ww,y+hh);q.addColorStop(0,'rgba(6,25,40,.18)');q.addColorStop(1,'rgba(124,154,158,.14)');c.fillStyle=q;c.fill(face);c.strokeStyle='rgba(145,172,164,.08)';c.lineWidth=.8;c.beginPath();c.moveTo(x-ww*.8,y-hh*.2);c.lineTo(x+ww*.25,y-hh);c.lineTo(x+ww,y-hh*.12);c.stroke();
 }
 const roots=v===0?[[[140,425,225,473,152,578,281,650],18],[[390,421,281,478,421,541,361,672],20],[[510,424,489,478,399,487,445,557],11]]:v===1?[[[181,420,242,459,174,493,289,559],14],[[442,421,390,460,491,480,384,534],17],[[332,416,349,447,310,472,337,511],8]]:[[[229,422,283,475,215,528,342,599],16],[[487,424,425,458,485,517,386,584],12],[[115,427,146,466,192,471,216,511],8]];
 for(const a of roots){dn13Limb(c,a[0],a[1],1,'#14353b','#3e5e50');const p=dn13Point(a[0],.43),sd=R()<.5?-1:1;dn13Limb(c,[p[0],p[1],p[0]+sd*23,p[1]+9,p[0]+sd*38,p[1]+31,p[0]+sd*26,p[1]+57],4.3,.6,'#15383d','#3b5e50');}

 c.restore();
 // Irregular moss follows the rock rim; no plate, bowl or ornamental oval pedestal.
 c.lineCap='round';c.strokeStyle='#315f4e';c.lineWidth=12;c.beginPath();c.moveTo(40,429);for(let j=1;j<top.length;j++){const a=top[j-1],b=top[j];c.quadraticCurveTo(a[0],a[1],(a[0]+b[0])*.5,(a[1]+b[1])*.5);}c.lineTo(579,431);c.stroke();
 for(let j=0;j<90;j++){const x=48+R()*524,y=419+Math.sin(x*.04)*3,r=2+R()*7;dn13El(c,x,y,r,r*.4,j%4?'#447759':'#6d9472');}
 const tree=DN13.art['tree'+v];if(tree)c.drawImage(tree,153,ground-397,314,400);
 const sprout=DN13.art['sprout'+(v===1?1:0)];if(sprout){c.drawImage(sprout,74,ground-89,108,90);c.drawImage(sprout,444,ground-70,84,70);}
 for(let j=0;j<16;j++){const x=62+R()*485,y=418+R()*8;dn13Leaf(c,x,y,7+R()*13,2.6,(R()-.5)*1.6,'#629982');}
 for(let j=0;j<3;j++){const x=160+j*139,y=545+j%2*75,sd=j%2?1:-1;dn13Limb(c,[x,y,x+sd*37,y+48,x-sd*29,y+76,x+sd*11,y+127],5,1,'#1a3c42','#3f5e54');}
 return im;
}
function dn13AuroraArt(){
 const w=240,h=120,im=dn13Cv(w,h),c=im.getContext('2d'),data=c.createImageData(w,h),d=data.data,gauss=new Float32Array(501),vertical=new Float32Array(h),ys=new Float32Array(h);
 for(let j=0;j<gauss.length;j++)gauss[j]=Math.exp(-j*j/1250)*.22;for(let y=0;y<h;y++){const yy=(y+.5)/h*500;ys[y]=yy;vertical[y]=dn13Ease(yy/75)*dn13Ease((500-yy)/95);}
 for(let x=0;x<w;x++){
  const u=(x+.5)/w,a=1-u,side=dn13Ease(u/.14)*dn13Ease((1-u)/.14),centres=[];
  for(let band=0;band<3;band++)centres.push((110+band*77)*a*a*a+3*(23+band*70)*a*a*u+3*(344-band*11)*a*u*u+(71+band*74)*u*u*u);
  const blend=u<.57?dn13Clamp((u-.23)/.34,0,1):dn13Clamp((u-.57)/.25,0,1);
  let er,eg,eb,orr,og,ob;if(u<.57){er=104+60*blend;eg=224-75*blend;eb=196+36*blend;orr=171-7*blend;og=138+11*blend;ob=228+4*blend;}else{er=orr=164-56*blend;eg=og=149+70*blend;eb=ob=232-26*blend;}
  for(let y=0;y<h;y++){
   const yy=ys[y],mask=side*vertical[y];let aa=0,rr=0,gg=0,bb=0;
   for(let band=0;band<3;band++){
    const dy=Math.min(500,Math.round(Math.abs(yy-centres[band]))),al=gauss[dy]*mask*(1-aa);if(al<.00001)continue;
    rr+=(band===1?orr:er)*al;gg+=(band===1?og:eg)*al;bb+=(band===1?ob:eb)*al;aa+=al;
   }
   const o=(y*w+x)*4;if(aa>.0001){d[o]=rr/aa;d[o+1]=gg/aa;d[o+2]=bb/aa;d[o+3]=Math.round(aa*255);}
  }
 }
 c.putImageData(data,0,0);return im;
}
function dn13FallArt(){
 const im=dn13Cv(160,640),c=im.getContext('2d'),R=rng(14101);c.lineCap='round';
 for(let j=0;j<12;j++){
  const x=24+R()*110,y=12+R()*136,end=454+R()*178,bend=(R()-.5)*53,q=c.createLinearGradient(0,y,0,end);
  q.addColorStop(0,'rgba(171,242,242,0)');q.addColorStop(.16,'rgba(155,235,240,.22)');q.addColorStop(.65,'rgba(169,214,247,.14)');q.addColorStop(1,'rgba(150,211,244,0)');
  c.strokeStyle=q;c.lineWidth=j%3?.55+R()*1.1:4+R()*8;c.globalAlpha=j%3?1:.22;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+bend,y+130,x-bend*.7,end-150,x+bend*.4,end);c.stroke();
 }
 c.globalAlpha=1;for(let j=0;j<4;j++)dn13Bloom(c,j%2?'#79cfe8':'#a7b4f0',64+R()*37,180+R()*260,15+R()*17,90+R()*110,.035);
 c.globalCompositeOperation='destination-in';const m=c.createLinearGradient(0,0,0,640);m.addColorStop(0,'rgba(0,0,0,0)');m.addColorStop(.08,'#000');m.addColorStop(.82,'#000');m.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=m;c.fillRect(0,0,160,640);c.globalCompositeOperation='source-over';return dn13SmoothArt(im);
}
function dn13FxArt(){const F={};F.teal=dn13Cv(128,128);dn13Bloom(F.teal.getContext('2d'),'#59d2e6',64,64,63,63,.8);F.violet=dn13Cv(128,128);dn13Bloom(F.violet.getContext('2d'),'#c08bd9',64,64,63,63,.8);F.warm=dn13Cv(128,128);dn13Bloom(F.warm.getContext('2d'),'#e7ddae',64,64,63,63,.8);
 F.shaft=dn13Cv(128,600);{const sc=F.shaft.getContext('2d'),q=sc.createLinearGradient(0,0,128,0);q.addColorStop(0,'rgba(76,185,231,0)');q.addColorStop(.5,'rgba(76,185,231,.72)');q.addColorStop(1,'rgba(76,185,231,0)');sc.fillStyle=q;sc.fillRect(0,0,128,600);sc.globalCompositeOperation='destination-in';const m=sc.createLinearGradient(0,0,0,600);m.addColorStop(0,'rgba(0,0,0,0)');m.addColorStop(.2,'#000');m.addColorStop(.56,'rgba(0,0,0,.5)');m.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=m;sc.fillRect(0,0,128,600);}
 F.fly=[];for(let k=0;k<3;k++){const im=dn13Cv(64,64),c=im.getContext('2d'),col=['#74dcfa','#ff9ed2','#ffd277'][k];dn13Bloom(c,col,32,32,31,31,.7);dn13Bloom(c,col,32,32,10,10,.96);dn13El(c,32,32,1.55,1.55,'#eaffea');F.fly.push(im);}
 F.star=dn13Cv(44,44);const c=F.star.getContext('2d');dn13Bloom(c,'#c9eee1',22,22,21,21,.35);c.fillStyle='#e6f5da';c.beginPath();c.moveTo(22,11);c.quadraticCurveTo(23,21,33,22);c.quadraticCurveTo(23,23,22,33);c.quadraticCurveTo(21,23,11,22);c.quadraticCurveTo(21,21,22,11);c.fill();
 F.vig=dn13Cv(320,220);const h=F.vig.getContext('2d'),q=h.createRadialGradient(160,95,40,160,110,200);q.addColorStop(0,'rgba(2,8,23,0)');q.addColorStop(.6,'rgba(2,8,23,0)');q.addColorStop(1,'rgba(2,8,23,.78)');h.fillStyle=q;h.fillRect(0,0,320,220);dn13WarmArt(F);return F;}
// Warm accents: rose/gold light, a bright path edge, giant light mushrooms and glowing flowers (baked once).
function dn13WarmArt(F){
 const cols=['#ff8fc0','#ffc766','#6fe3d8','#b79bff'];
 F.rose=dn13Cv(128,128);dn13Bloom(F.rose.getContext('2d'),'#ff8fc0',64,64,63,63,.8);
 F.gold=dn13Cv(128,128);dn13Bloom(F.gold.getContext('2d'),'#ffcf7a',64,64,63,63,.8);
 F.rim=dn13Cv(8,48);{const c=F.rim.getContext('2d'),q=c.createLinearGradient(0,0,0,48);q.addColorStop(0,'rgba(190,255,232,0)');q.addColorStop(.42,'rgba(190,255,232,.5)');q.addColorStop(.5,'rgba(235,255,244,.95)');q.addColorStop(.62,'rgba(150,235,215,.35)');q.addColorStop(1,'rgba(150,235,215,0)');c.fillStyle=q;c.fillRect(0,0,8,48);}
 F.shroom=[];F.flower=[];
 for(let k=0;k<4;k++){const col=cols[k],im=dn13Cv(280,340),c=im.getContext('2d'),R=rng(13900+k);
  dn13Bloom(c,col,140,120,138,118,.38);
  const q=c.createLinearGradient(100,0,180,0);q.addColorStop(0,dn13Mix(col,'#20385a',.55));q.addColorStop(.5,dn13Mix(col,'#f6fff0',.6));q.addColorStop(1,dn13Mix(col,'#20385a',.6));c.fillStyle=q;
  c.beginPath();c.moveTo(118,340);c.bezierCurveTo(128,260,122,190,130,128);c.lineTo(152,128);c.bezierCurveTo(160,190,154,260,166,340);c.closePath();c.fill();
  const p=c.createLinearGradient(0,30,0,140);p.addColorStop(0,dn13Mix(col,'#ffffff',.42));p.addColorStop(.45,col);p.addColorStop(1,dn13Mix(col,'#2a2f6a',.5));c.fillStyle=p;
  c.beginPath();c.moveTo(22,134);c.bezierCurveTo(24,56,90,26,140,26);c.bezierCurveTo(190,26,256,56,258,134);c.quadraticCurveTo(140,156,22,134);c.fill();
  // Glowing gill underside, soft light spots and a light pool on the stem.
  c.fillStyle=dn13Mix(col,'#fffdf0',.62);c.beginPath();c.moveTo(22,134);c.quadraticCurveTo(140,164,258,134);c.quadraticCurveTo(140,140,22,134);c.fill();
  c.strokeStyle=dn13Rgba(dn13Mix(col,'#2a2f6a',.3),.55);c.lineWidth=1;for(let j=0;j<17;j++){const x=36+j*13;c.beginPath();c.moveTo(x,137+Math.sin(j/16*Math.PI)*4);c.lineTo(140+(x-140)*.82,144+Math.sin(j/16*Math.PI)*7);c.stroke();}
  for(let j=0;j<7;j++){const x=62+R()*156,y=56+R()*52,r=8+R()*10;dn13Bloom(c,'#fffbe8',x,y,r*1.5,r*1.1,.75);}
  dn13Bloom(c,'#ffffff',96,64,56,30,.3);dn13Bloom(c,dn13Mix(col,'#ffffff',.5),141,176,44,50,.5);
  c.globalCompositeOperation='destination-out';{const m=c.createLinearGradient(0,270,0,340);m.addColorStop(0,'rgba(0,0,0,0)');m.addColorStop(1,'rgba(0,0,0,.55)');c.fillStyle=m;c.fillRect(0,270,280,70);}c.globalCompositeOperation='source-over';
  {const sm=dn13Cv(280,340);sm.getContext('2d').drawImage(im,0,0);c.globalCompositeOperation='destination-over';c.drawImage(sm,196,222,84,102);c.drawImage(sm,8,250,62,76);c.globalCompositeOperation='source-over';}
  F.shroom.push(im);
  const fm=dn13Cv(96,150),f=fm.getContext('2d');dn13Bloom(f,col,48,44,46,43,.5);
  f.strokeStyle='#4f9a8c';f.lineWidth=2.4;f.lineCap='round';f.beginPath();f.moveTo(48,150);f.quadraticCurveTo(40,100,48,52);f.stroke();
  dn13Leaf(f,46,118,24,7,-.9,'#4d9e94');dn13Leaf(f,47,100,22,6,.9,'#4d9e94');
  for(let j=0;j<5;j++){const a=j*DN13_TAU/5-Math.PI/2;dn13El(f,48+Math.cos(a)*13,44+Math.sin(a)*13,12,7.5,dn13Mix(col,'#ffffff',.35),a);}
  dn13El(f,48,44,6,6,'#fffbe0');F.flower.push(fm);}
}
function dn13Glow(im,x,y,rx,ry,a){if(!im||a<=.003)return;g.globalAlpha=a;g.drawImage(im,x-rx,y-ry,rx*2,ry*2);g.globalAlpha=1;}

const DN13_BOWERS=[12,330];
const DN13_TREES=[[0,.91,0],[44,.73,0],[84,.82,2],[174,.72,1],[217,.65,1],[281,.78,0],[292,.7,0],[317,.7,2],[345,.82,0],[372,.73,2],[392,.85,2],[421,.8,3],[467,.74,0],[644,.72,0],[714,.9,1]];
const DN13_FERNS=[[2,.75,0],[28,.64,0],[62,.62,1],[83,.7,0],[178,.66,1],[200,.55,1],[246,.62,0],[279,.6,1],[291,.8,0],[316,.7,0],[344,.72,0],[369,.73,0],[389,.8,0],[398,.73,1],[420,.64,0],[446,.68,1],[467,.76,0],[641,.66,0],[655,.55,1],[674,.52,0],[707,.67,0],[719,.8,1]];
const DN13_ISLANDS=[[32,200,.52,0],[76,280,.42,2],[119,100,.54,1],[161,255,.42,0],[208,150,.48,1],[257,270,.45,1],[307,200,.48,0],[364,135,.52,2],[410,220,.44,2],[459,140,.51,0],[509,105,.58,1],[544,270,.52,0],[581,140,.6,2],[620,245,.52,1],[658,175,.49,0],[713,255,.5,1]];
const DN13_FALLS=[[61,185,480,40,.4],[123,110,560,48,.45],[237,190,470,34,.44],[337,180,510,41,.4],[443,135,530,34,.46],[522,140,600,46,.42],[576,185,490,32,.44],[668,195,480,36,.4]];
const DN13_LIGHTS=[[18,586,190,180,2],[54,578,210,170,1],[187,568,230,180,1],[255,580,230,180,2],[304,522,250,230,0],[355,536,220,230,1],[432,494,260,260,1],[646,582,180,170,0],[680,553,220,230,2]];
const DN13_STARS=Array.from({length:46},(_,j)=>({glow:j<18,ci:j%3,u:dn13Hash(j*7.3),v:dn13Hash(j*17.7),p:dn13Hash(j*9.1)*6.28,r:.6+dn13Hash(j*2.7)*1.1,z:j%5===0?1.1:.22+dn13Hash(j)*.47}));
const DN13_WARM=['sky0','fx','floor0','floor3','light0','light2','moon','cloud0','tree0','cloud1','bower','bough0','fern0','tree1','cloud2','sky1','floor1','sprout0','island0','sky2','light1','tree2','fern1','floor2','floor4','floor5','floor6','floor8','floor9','abut0','abut1','join0','join1','join2','join3','aurora','bough1','willow','tree3','pond','fall','cloud3','cloud4','sky3','light3','sprout1','island1','sky4','island2','sky5','sky6'];
function dn13Prefetch(){const z=Math.floor(DN13.zone);dn13Queue('sky'+z);if(z<6)dn13Queue('sky'+(z+1));for(const key of DN13_WARM)dn13Queue(key);}

function dn13Blend7(values,z){const a=Math.floor(z),u=z-a;return values[a]+(values[Math.min(6,a+1)]-values[a])*u;}
const DN13_SHAFT_ALPHA=[.2,0,.2,.27,.2,0,.2],DN13_BOUGH_A=[.36,0,0,.62,0,0,.36],DN13_BOUGH_B=[0,0,.36,0,.62,0,0],DN13_AURORA_ALPHA=[0,.45,.35,.25,.9,.6,.7],DN13_LAMP_TYPE=[0,0,1,3,1,0,2];
function dn13Background(tm){
 if(!dn13Ready())return;dn13Clock(tm);dn13Prefetch();dn13BuildOne(tm);
 const t=DN13.t,vw=W/S,vh=H/S,z=DN13.zone,zi=Math.floor(z),u=z-zi,F=DN13.art.fx;
 g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle='#0a213d';g.fillRect(0,0,W,H);
 const sky=DN13.art['sky'+zi]||DN13.art.sky0;if(sky)g.drawImage(sky,0,0,W,H);
 const sk2=DN13.art['sky'+Math.min(6,zi+1)];if(sk2&&u>.002){g.globalAlpha=u;g.drawImage(sk2,0,0,W,H);g.globalAlpha=1;}
 g.setTransform(S,0,0,S,0,0);
 const moon=DN13.art.moon,mx=vw*.73-Math.sin(cam.x*.00007)*vw*.065,my=vh*.24-(cam.y-305)*.045,mw=Math.min(vw*.49,vh*.61)*dn13Blend7(DN13_MOON_SCALE,z),moona=dn13Blend7(DN13_MOON_ALPHA,z);
 if(moon){g.globalAlpha=moona;g.drawImage(moon,mx-mw*.5,my-mw*.5,mw,mw);g.globalAlpha=1;}
 // Each biome keeps the same anchored layout while its neighbour crossfades in.
 // The wrapping period is exactly the repeat stride, so drifting banks cannot jump.
 for(let q=0;q<2;q++){
  const region=Math.min(6,zi+q),weight=q?u:1-u;if(weight<.002)continue;
  const ocean=region===2||region===5;
  for(let layer=0;layer<(ocean?3:1);layer++){
   const f=layer===0?.055:layer===1?.14:.28,base=vh*(layer===0?.44:layer===1?.78:1.06)-(cam.y-305)*f*.7,ww=layer===0?680:layer===1?520:620,hh=ww*.45,stride=ww*1.65,off=-dn13Mod(cam.x*f+t*(1.5+layer*1.5)+layer*313,stride),cv=DN13.art['cloud'+(region===2?4:region===3?3:layer)];
   if(!cv)continue;g.globalAlpha=weight*(ocean?(layer===0?.25:layer===1?.35:.51):region===1?.25:.2);
   const dw=ocean?ww:ww*.72,dh=ocean?hh:hh*.66,yy=ocean?base-hh*.4:base+vh*.28;
   for(let x=off-stride;x<vw+80;x+=stride)g.drawImage(cv,x,yy,dw,dh);
  }
 }
 g.globalAlpha=1;
 if(F&&F.shaft){
  const amount=dn13Blend7(DN13_SHAFT_ALPHA,z),step=880,off=-dn13Mod(cam.x*.43,step);
  for(let j=-1;j<=Math.ceil((vw+180-off)/step);j++){
   const x=off+j*step+230;if(x< -180||x>vw+180)continue;
   for(let q=0;q<2;q++){const region=Math.min(6,zi+q),weight=q?u:1-u;if(weight<.002||!DN13_SHAFT_ALPHA[region])continue;const lamp=DN13.art['light'+DN13_LAMP_TYPE[region]];if(lamp){g.globalCompositeOperation='lighter';dn13Glow(lamp,x+25,vh*.39,168,240,(region===0?.86:region===3?.75:.69)*weight);}}
   g.globalCompositeOperation='source-over';if(amount>.002){g.save();g.translate(x,-vh*.3);g.rotate(-.1+Math.sin(t*.11+j)*.018);g.globalAlpha=amount;g.drawImage(F.shaft,-95,0,190,vh*1.65);g.restore();}
  }
  g.globalAlpha=1;
 }
 for(let v=0;v<2;v++){
  const cv=DN13.art['bough'+v],alpha=dn13Blend7(v?DN13_BOUGH_B:DN13_BOUGH_A,z);if(!cv||alpha<.002)continue;
  const ww=1120,start=-dn13Mod(cam.x*.55,ww);g.globalAlpha=alpha;
  for(let x=start-ww;x<vw;x+=ww)g.drawImage(cv,x,680-(305+(cam.y-305)*.55)-860,1120,860);
 }
 g.globalAlpha=1;
 // Anchored light pockets and landmarks use their real screen bounds, independent of the player's biome.
 for(let q=0;q<2;q++){
  const lamp=DN13.art['light'+(q?1:2)],x=q?(216*40-cam.x)*.6:(32*40-cam.x)*.43,rx=q?230:150;
  if(lamp&&x+rx> -20&&x-rx<vw+20){g.globalCompositeOperation='lighter';dn13Glow(lamp,x,vh*.63,rx,q?235:175,q?.52:.43);g.globalCompositeOperation='source-over';}
 }
 const depth=.36;g.setTransform(S,0,0,S,-cam.x*depth*S,-(305+(cam.y-305)*depth)*S);
 for(const a of DN13_ISLANDS){
  const x=a[0]*40*depth,k=a[2],im=DN13.art['island'+a[3]],screenX=x-cam.x*depth;
  if(!im||screenX+310*k< -24||screenX-310*k>vw+24)continue;
  const ownRegion=dn13Zone(a[0]*40);g.globalAlpha=ownRegion===1||ownRegion===5?.7:.42;
  g.drawImage(im,x-310*k,a[1]+140+Math.sin(t*.3+a[0])*3,620*k,780*k);
 }
 g.globalAlpha=1;g.setTransform(S,0,0,S,0,0);
 if(F&&F.shroom){const dp=.7,st=470,by=745-(305+(cam.y-305)*dp);g.globalAlpha=1;for(let j=Math.max(0,Math.floor(cam.x*dp/st)-1);j<=Math.ceil((cam.x*dp+vw)/st)+1;j++){const wx=j*st/dp;if(wx>3300&&wx<7100)continue;const x=j*st+dn13Hash(j*5.3+2)*210-cam.x*dp,k=.42+dn13Hash(j*3.1)*.42;if(x+150*k< -10||x-150*k>vw+10)continue;const ci=dn13Hash(j*9.7)<.2+.65*wx/28800?(j&1):2+(j&1);g.drawImage(F.shroom[ci],x-140*k,by-340*k+Math.sin(t*.5+j)*2,280*k,340*k);}g.globalAlpha=1;}
 const pond=DN13.art.pond,px=(338*40-cam.x)*.65,pk=.69,py=10-(cam.y-305)*.2;
 if(pond&&px+450*pk> -24&&px-450*pk<vw+24){
  g.globalAlpha=.72;g.drawImage(pond,px-450*pk,py,900*pk,650*pk);g.globalAlpha=1;
  if(F)for(let j=0;j<5;j++){const x=px+(j-2)*31,y=py+331*pk+Math.sin(t*.45+j)*1.5;dn13Glow(F.teal,x,y,12,2.2,.16+.07*Math.sin(t*.8+j));}
 }
 const crown=DN13.art.island1,cx=(216*40-cam.x)*.6,ck=.58,cy=-50-(cam.y-305)*.16;
 if(crown&&cx+310*ck> -24&&cx-310*ck<vw+24){g.globalAlpha=.8;g.drawImage(crown,cx-310*ck,cy,620*ck,780*ck);g.globalAlpha=1;}
 const aur=DN13.art.aurora,aa=Math.max(dn13Blend7(DN13_AURORA_ALPHA,z),DN13.fin*.4);
 if(aur&&aa>.002){for(let j=0;j<12;j++){const sw=aur.width/12,w=vw*1.28/12,x=-vw*.12+j*w,y=-vh*.03+Math.sin(t*.25+j*.18)*7;g.globalAlpha=aa;g.drawImage(aur,j*sw,0,sw+1,aur.height,x,y,w+1,vh*.74);}g.globalAlpha=1;}
 if(F){dn13Glow(F.teal,vw*.52,vh*.82,vw*.75,vh*.18,.065);if(F.rose){const wa=z/6;g.globalCompositeOperation='lighter';dn13Glow(F.rose,vw*.24,vh*.74,vw*.62,vh*.42,.04+.1*wa);dn13Glow(F.gold,vw*.8,vh*.7,vw*.55,vh*.4,.03+.1*wa);g.globalCompositeOperation='source-over';}if(DN13.fin>.01)dn13Glow(F.warm,vw*.58,vh*.38,vw*.75,vh*.8,DN13.fin*.18);}
 g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
}

// Pale cloud floors (regions 2 and 5) need less added light than the dark forest floors.
function dn13Soft(){const z=DN13.zone;return 1-.6*Math.max(0,1-Math.abs(z-2),1-Math.abs(z-5));}
function dn13StarlightFalls(t){
 const im=DN13.art.fall,F=DN13.art.fx;if(!im)return;const vw=W/S;
 for(const a of DN13_FALLS){
  const f=a[4],x=(a[0]*40-cam.x)*f,y=a[1]-(cam.y-305)*f*.6,hh=a[2],w=a[3]*1.55;if(x+w*2.6< -20||x-w*2.6>vw+20)continue;
  g.setTransform(S,0,0,S,0,0);if(F){dn13Glow(F.teal,x,y+hh*.48,w*1.4,hh*.5,.08);dn13Glow(F.teal,x,y+hh*.05,w,22,.12);}
  g.globalAlpha=.68+.045*Math.sin(t*.38+a[0]);g.drawImage(im,x-w*.5,y,w,hh);g.globalAlpha=1;
  if(F)for(let j=0;j<6;j++){const u=dn13Mod(t*.085+j/6+a[0]*.037,1),xx=x+Math.sin(u*DN13_TAU+a[0])*(w*.12),yy=y+u*hh,r=2.1+Math.sin(u*Math.PI)*2.2;dn13Glow(F.fly[j%3],xx,yy,r,r*2.6,Math.sin(u*Math.PI)*.36);}
 }
 g.globalAlpha=1;g.globalCompositeOperation='source-over';
}
function dn13World(tm){if(!dn13Ready())return;const t=DN13.t,L=cam.x-450,R=cam.x+W/S+450,F=DN13.art.fx;dn13StarlightFalls(t);g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);g.globalAlpha=1;g.globalCompositeOperation='source-over';
 if(F){for(const a of DN13_LIGHTS){const x=a[0]*40;if(x+a[2]<L||x-a[2]>R)continue;dn13Glow(a[4]===1?F.violet:a[4]===2?F.warm:F.teal,x,a[1],a[2],a[3],.14+.025*Math.sin(t*.55+a[0]));}}
 const bower=DN13.art.bower;if(bower){for(const col of DN13_BOWERS){const x=col*40,k=col===12?1:.94;if(x+560*k<L||x-560*k>R)continue;g.save();g.translate(x,725);g.rotate(Math.sin(t*.19+col)*.002);g.drawImage(bower,-560*k,-810*k,1120*k,810*k);g.restore();}}
 const willow=DN13.art.willow;if(willow){const x=438*40,k=.81;if(x-650*k<R&&x+230*k>L){g.save();g.translate(x,726);g.rotate(Math.sin(t*.26)*.005);g.drawImage(willow,-650*k,-930*k,880*k,930*k);g.restore();}}
 // Real trunks and leaf clusters frame the path. Activity centers remain open.
 for(const a of DN13_TREES){if(bower&&a[0]===0)continue;const x=a[0]*40,k=a[1],im=DN13.art['tree'+a[2]];if(!im||x+350*k<L||x-350*k>R)continue;g.save();g.translate(x,724);g.rotate(Math.sin(t*.28+a[0])*.007);g.drawImage(im,-330*k,-840*k,660*k,840*k);g.restore();
  if(F&&a[2]!==1)for(let j=0;j<3;j++){const xx=x+(j-1)*91*k,yy=724-(390+j%2*100)*k,off=Math.sin(t*.6+a[0]+j)*6;g.strokeStyle='rgba(88,151,133,.5)';g.lineWidth=1;g.beginPath();g.moveTo(xx,yy-26*k);g.quadraticCurveTo(xx+off,yy-13*k,xx+off,yy+9*k);g.stroke();dn13Glow(F.teal,xx+off,yy+12*k,13*k,15*k,.17+.045*Math.sin(t+j));}}
 // Terrain and the entire bridge stay opaque; living offshoots belong to the activity module.
 dn13DrawGround();
 if(F&&F.rim){g.globalCompositeOperation='lighter';g.globalAlpha=.38*dn13Soft();g.drawImage(F.rim,cam.x-4,698,W/S+8,44);g.globalAlpha=1;g.globalCompositeOperation='source-over';}

 for(const a of DN13_FERNS){const x=a[0]*40,k=a[1],im=DN13.art['fern'+a[2]];if(!im||x+170*k<L||x-170*k>R||x>3600&&x<6800)continue;g.save();g.translate(x,727);g.rotate(Math.sin(t*.57+a[0])*.025);g.drawImage(im,-150*k,-270*k,300*k,270*k);g.restore();}
 // Small natural lights live near the grass, never ornamental rosettes or fabric flowers.
 for(let j=Math.floor(L/410);j<=Math.ceil(R/410);j++){const x=j*410+dn13Hash(j*7)*110;if(x<0||x>28800||x>3500&&x<6900)continue;const im=DN13.art['sprout'+(j%3===0?1:0)],k=.42+dn13Hash(j)*.23;if(im){if(F){g.globalCompositeOperation='lighter';dn13Glow(j%3===0?F.violet:F.teal,x,718,48+22*k,16,.49);dn13Glow(j%3===0?F.violet:F.teal,x,686,45,54,.22);g.globalCompositeOperation='source-over';}g.save();g.translate(x,724);g.rotate(Math.sin(t*.55+j)*.02);g.drawImage(im,-120*k,-200*k,240*k,200*k);g.restore();}}
 if(F&&F.flower)for(let j=Math.floor(L/270);j<=Math.ceil(R/270);j++){const x=j*270+dn13Hash(j*11.3)*150+60;if(x<0||x>28800||x>3500&&x<6900)continue;const ci=dn13Hash(j*4.9)<.3+.6*x/28800?(j&1):2+(j&1),k=.36+dn13Hash(j*2.3)*.3;g.save();g.translate(x,724);g.rotate(Math.sin(t*.6+j*1.7)*.035);g.drawImage(F.flower[ci],-48*k,-150*k,96*k,150*k);g.restore();}
 if(F&&F.gold){g.globalCompositeOperation='lighter';const ha=dn13Soft();dn13Glow(F.gold,P.x,P.y-42,110,125,.42*ha);if(typeof ANNE12!=='undefined'&&Number.isFinite(ANNE12.x)&&Number.isFinite(ANNE12.y))dn13Glow(F.gold,ANNE12.x,ANNE12.y-75,125,170,.36*ha);g.globalCompositeOperation='source-over';}
 if(F){for(const p of DN13.steps){const age=t-p.t;if(age<0||age>2||p.x<cam.x-50||p.x>cam.x+W/S+50)continue;dn13Glow(F.teal,p.x,p.y,17+age*13,5+age*2,(1-age/2)*.23);}for(const p of DN13.waves){const age=t-p.t;if(age<0||age>3.7)continue;const r=age*190;if(p.x+r<cam.x||p.x-r>cam.x+W/S)continue;g.globalAlpha=(1-age/3.7)*.18;g.strokeStyle='#a6d5bc';g.lineWidth=1.3;g.beginPath();g.ellipse(p.x,p.y,r,7+r*.05,0,0,DN13_TAU);g.stroke();}}
 g.globalAlpha=1;g.setTransform(1,0,0,1,0,0);}
function dn13Motes(tm,z0,z1){if(!dn13Ready())return;const F=DN13.art.fx;if(!F)return;const t=DN13.t,vw=W/S,vh=H/S;g.setTransform(S,0,0,S,0,0);
 for(const p of DN13_STARS){if(p.z<z0||p.z>=z1)continue;const x=dn13Mod(p.u*(vw+100)-cam.x*p.z*.1+Math.sin(t*.24+p.p)*14,vw+100)-50,y=dn13Mod(p.v*(vh+90)-cam.y*p.z*.08-t*(1.1+p.r),vh+90)-45,dx=x-(P.x-cam.x),dy=y-(P.y-cam.y-35),clear=dx*dx+dy*dy<5500?.16:1,soft=p.glow,r=soft?5+p.r*2:p.r*(p.z>.75?2.1:1.7);g.globalAlpha=(soft?.28+Math.sin(t*.65+p.p)*.13:.17+Math.sin(t*.8+p.p)*.12)*clear;g.globalCompositeOperation=soft?'lighter':'source-over';g.drawImage(soft?F.fly[p.ci]:F.star,x-r,y-r,r*2,r*2);}g.globalAlpha=1;g.globalCompositeOperation='source-over';g.setTransform(1,0,0,1,0,0);}
function dn13Petals(tm){if(!dn13Ready())return;const t=DN13.t,F=DN13.art.fx;if(!F)return;g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);for(let j=Math.floor(cam.x/230);j<=Math.ceil((cam.x+W/S)/230);j++){const x=j*230+Math.sin(t*.3+j)*24,y=550+Math.sin(t*.24+j*2.4)*52;if(Math.abs(P.x-x)<62)continue;const r=2.4+Math.sin(t*.8+j)*1.1;g.globalAlpha=.22;g.drawImage(F.star,x-r,y-r,r*2,r*2);}g.globalAlpha=1;g.setTransform(1,0,0,1,0,0);}
function dn13Foreground(tm){if(!dn13Ready())return;const t=DN13.t,F=DN13.art.fx,vw=W/S,vh=H/S;g.setTransform(S,0,0,S,-cam.x*S,-cam.y*S);
 for(let j=Math.floor((cam.x-100)/620);j<=Math.ceil((cam.x+vw+100)/620);j++){const x=j*620+dn13Hash(j)*140;if(x<0||x>28800||x>3500&&x<6900)continue;const im=DN13.art['fern'+(j%3===0?1:0)];if(!im)continue;const k=.65+dn13Hash(j*3)*.2,dist=Math.min(Math.abs(P.x-x),typeof ANNE12!=='undefined'&&Number.isFinite(ANNE12.x)?Math.abs(ANNE12.x-x):1e9),a=.06+.52*dn13Ease((dist-70)/170);g.save();g.globalAlpha=a;g.translate(x,796);g.rotate(Math.sin(t*.4+j)*.025);g.drawImage(im,-150*k,-270*k,300*k,270*k);g.restore();}
 // Air moves in front of the floating landscape, with clear faces and a breathable central corridor.
 const cv=DN13.art.cloud2;if(cv){g.setTransform(S,0,0,S,0,0);const ww=900,hh=330,off=-dn13Mod(cam.x*.48+t*3,ww*.8);g.globalAlpha=typeof V13!=='undefined'&&V13.yolculukAktif?.25:.09;for(let x=off-ww;x<vw;x+=ww*.8)g.drawImage(cv,x,vh*.93,ww,hh);g.globalAlpha=1;}
 if(F&&DN13.fin>.01){g.setTransform(S,0,0,S,0,0);dn13Glow(F.warm,vw*.53,vh*.44,vw*.7,vh*.75,DN13.fin*.1);}g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;}
function dn13Vignette(){if(!dn13Ready())return;const F=DN13.art.fx;if(!F)return;g.setTransform(1,0,0,1,0,0);g.globalAlpha=.2;g.drawImage(F.vig,0,0,W,H);g.globalAlpha=1;g.globalCompositeOperation='source-over';}
function dn13Isit(){if(typeof BOLUM_NO==='undefined'||BOLUM_NO!==13)return true;const stamp=typeof now==='number'?now:0;dn13Prefetch();dn13BuildOne(stamp);DN13.ready=DN13.queue.length===0;return DN13.ready&&DN13.stamp!==stamp;} // Hand off to the sky-art warmup on the following frame, never beside this frame's last world job.
function dn13Wave(e){const p=DN13.waves[DN13.wave];p.x=e&&Number.isFinite(e.x)?e.x:P.x;p.y=e&&Number.isFinite(e.y)?e.y:720;p.t=DN13.t;DN13.wave=(DN13.wave+1)%8;}
if(typeof OLAY!=='undefined'){OLAY.on('ipekMinder',e=>{if(BOLUM_NO===13)dn13Wave(e);});OLAY.on('ipekKopruTamam',e=>{if(BOLUM_NO===13)dn13Wave(e);});OLAY.on('ipekKelebekTamam',e=>{if(BOLUM_NO===13)dn13Wave(e);});OLAY.on('ipekPerdeTamam',e=>{if(BOLUM_NO===13)dn13Wave(e);});OLAY.on('ipekGokYukseldi',()=>{if(BOLUM_NO===13){DN13.dawn=true;dn13Wave({x:690*40,y:720});}});}
