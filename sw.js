// İnternetsiz çalışma: ilk açılıştan sonra oyun (kod, gömülü sesler, simgeler) cihazda saklanır.
// Dosya eklenirse SRC listesine ekle; önemli değişiklikte CACHE sürümünü artır.
const CACHE = 'feza-piril-2d-platformer-v169';
const SRC = ['ortak', 'kapi', 'bolum', 'dunya', 'feza', 'piril', 'pofuduk', 'sahne', 'arayuz', 'sarki', 'bolum2', 'dunya2', 'yildiz', 'takim', 'dunya3', 'bulut', 'kuzu', 'sekil', 'ucus', 'bolum3', 'bolum4', 'dunya4', 'deniz', 'inci', 'bolum5', 'anka', 'dunya5', 'volkan', 'atesoyun', 'kristal', 'lavsal', 'bolum6', 'dunya6', 'midilli', 'senlik', 'halka', 'bolum7', 'dunya7', 'geyik', 'kar', 'kardan', 'kizak', 'bolum8', 'dunya8', 'kostum', 'kabak', 'seker', 'kabakyuz', 'iskelet', 'kazan', 'supurge', 'muzik', 'ses', 'oyun', 'bolum9', 'dunya9', 'yavru', 'meyve', 'kanat', 'kolye', 'buyukanne', 'yuva', 'sahne11', 'bolum11', 'dunya11', 'vampir11', 'ayna11', 'pelerin11', 'aynasalon11', 'org11', 'pasta11', 'ucus11', 'balo11', 'sahne12', 'bolum12', 'dunya12', 'anne12', 'etkinlik12', 'final12', 'muzik12'];
SRC.push('zemin12', 'canli12', 'fezapoz12', 'yolculuk12', 'golet12', 'botanik12', 'bina12');
SRC.push('gokbahce13', 'sahne13', 'bolum13', 'dunya13', 'fezapoz13', 'anne13', 'ipek13', 'muzik13', 'ses13');
SRC.push('zengin13','sahne14','bolum14','cosmos14','dunya14','aile14','ogret14','uzay14','muzik14','ses14');
// Uzay manzaraları yerel Canvas atlaslarıyla çizilir; kullanılmayan fotoğrafları indirme.
// Bölüm 12 kampüs bina katmanları (göğü saydam; dunya12.js). Yüklenmezse o binanın yerinde ağaçlar/tepeler görünür.
const KAMPUS_ART = ['lojman', 'orta-cim-v2', 'fens', 'universite-merkezi', 'fass-cim-v1', 'bilgi-merkezi', 'kule-cevre', 'golet'].map(n => './assets/kampus/' + n + '-katman.png');
const CORE = ['./', './index.html', './sesler.js', './sesler12.js', './sesler13.js', './sesler14.js', './manifest.webmanifest', ...SRC.map(n => './src/' + n + '.js')];
const ICONS = ['./icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];   // eksik simge kurulumu durdurmasın
const FRESH = /(\/|index\.html)$/;   // sayfa önce ağ, diğer dosyalar önce önbellek
// Yeni oyun önbelleği eski HTTP/CDN dosyalarıyla dolmasın. Çalışırken
// ignoreSearch ile aynı dosyayı buluruz; her sürüm ağdan kendi kodunu alır.
const kurulumIstegi = u => { const url = new URL(u, self.location.href); url.searchParams.set('surum', CACHE); return new Request(url.href, { cache: 'reload' }); };

self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  await c.addAll(CORE.map(kurulumIstegi));
  await Promise.all(KAMPUS_ART.map(async u => { try { await c.add(kurulumIstegi(u)); } catch (err) {} }));
  for (const u of ICONS) { try { await c.add(kurulumIstegi(u)); } catch (err) {} }
  self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  // Aynı sitedeki (goktugkarpat.github.io) diğer oyunların önbelleklerine dokunma: yalnız bu oyunun öneki silinir.
  for (const k of await caches.keys()) if ((k.startsWith('feza-piril-v') || k.startsWith('feza-piril-ruya-') || k.startsWith('feza-piril-2d-platformer-') || k.startsWith('feza-isik-ormani-')) && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const fresh = req.mode === 'navigate' || FRESH.test(url.pathname);
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    // İlk kurulum ve sonraki sayfa yenilemesi aynı kayıt anahtarını kullanır.
    // Böylece çevrimdışı açılış daha eski, sürümlü HTML kaydını seçmez.
    const key = fresh ? kurulumIstegi('./index.html') : req;
    if (fresh) {
      try {
        const r = await fetch(req, { cache: 'no-cache' });
        if (r.ok) { await c.put(key, r.clone()); return r; }
        // Sunucu geçici hata döndürdüğünde de kayıtlı oyun açılabilsin.
        return (await c.match(key, { ignoreSearch: true })) || r;
      }
      catch (err) { return (await c.match(key, { ignoreSearch: true })) || (await c.match('./index.html')) || Response.error(); }
    }
    const hit = await c.match(req, { ignoreSearch: true }); if (hit) return hit;
    const r = await fetch(req); if (r.ok) await c.put(req, r.clone()); return r;
  })());
});

