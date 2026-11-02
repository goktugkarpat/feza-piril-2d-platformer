/* ses.js – seslendirme (anlatıcı + Pırıl) ve altyazı. Cümleler aşağıdaki SESLER bloğunda (geçerli JSON);
   değişince `python gen_voice.py` → sesler.js (window.VOICE_MP3 / VOICE_DUR). Anahtar öneki: a_ anlatıcı, p_ Pırıl.
   Sözleşme: src/SPEC.md › "Voice line keys".
   SES.soyle(anahtar, {oncelik}) → sıraya koyar (cümleler asla üst üste binmez), altyazıyı gösterir
   (ARAYUZ.altyazi(metin, saniye, kim)) ve OLAY 'konusma' {anahtar, kim:'a'|'p', sure} yayar (yalnız gerçekten çalınca).
   Takma adlar: 'p_aferin' → p_aferin1..9 (son çalınanlar tekrarlanmaz) · 'p_yardim' → p_yardim1 / p_yardim2 sırayla.
   İkinci göl: p_karanlik / p_nilufer ikinci gölcük için istenince (tetikleyicinin konusu ya da ops.yer 'gol2', yoksa
   Feza BOLUM.gollar[1]'in yakınında) p_karanlik2 / p_nilufer2 çalınır; geçerlilik/ömür kuralları asıl anahtarınkiyle aynı.
   Ses AU'nun WebAudio bağlamından çalar (müzik konuşma boyunca kısılır); sesler.js yüklü değilse ya da ?sessiz
   ise yalnız altyazı + olay (kayıt süresiyle) çalışır.
   Bölüm 2/3 tetikleyicileri öneksiz olur ('y_gol' → p_y_gol, 'b_zip' → p_b_zip); Bölüm 3'te a_finalN / a_y_finalN → a_b_finalN.
   Uzun sessizlikte (≥50 sn) Pırıl ara sıra küçük dostça bir söz söyler (p_dost*; oturumda en çok 3). Ayrıntı: src/BOLUM3.md › SES notları.
   Bölüm 8 komşuları (şeker sokağı, Cadı Nine) kendi önekleriyle konuşur (kd_ kabak dede · in_ iskelet nine · ck_ cadı kız · kk_ kara kedi ·
   ht_ hayalet teyze · k2_ kabak ikizler · cn_ Cadı Nine · kb_ canlanan yüz kabağı; gen_voice.py STYLE her birine ayrı, doğal bir ton verir); OLAY 'konusma' kim:'k'.
   Bölüm 9 (Ejderha Vadisi) Pırıl'ın ailesi de öyle: bn_ Büyükanne Ejderha · ea_ annesi · eb_ babası · fs_ minik kuzeni Fıstık (kim:'k').
   SES.sus() → susar, sırayı boşaltır. SES.konusuyor() · SES.sure(anahtar) · SES.kayit (deneme günlüğü) · SES.sira().

   Sıra kuralları (Feza okuyamaz: ses tek talimat kanalı; ama BAYAT talimat kafa karıştırır):
   · Her cümlenin bir ömrü ve bir GEÇERLİLİK koşulu var; çalma anında koşul tutmuyorsa cümle atılır
     (göl aydınlandıysa "burası karanlık" söylenmez, Feza 8+ kare ilerlediyse "zıpla" söylenmez...).
   · Konuşma tetikleyicisinden gelen cümle o nesneyi taşır (s.o): Feza o.gec'i geçtiyse ya da o.konu uyandı/açıldı/aydınlandıysa
     sıradan atılır. Tekrarlanan anahtarlar (iki göl: p_karanlik, p_nilufer {yer: grup}; iki uyuyan Pofuduk: p_uyuyor) tetikleyici
     başına bir kez söylenir, aynı anahtar en az 20 sn arayla (seyrek).
   · Aynı konudaki yeni cümle eskisini siler (Büyük Pofuduk aşamaları: yalnız sonuncusu).
   · Oyun cümleleri arasında nefes payı 2,5–4 sn (uzun cümleden sonra daha uzun); olay tepkileri 1 sn sonra ve
     öne geçer; acil cümleler (kurtarma, yardım, "üstüne zıpla", "ağaca dokun") 0,35 sn sonra, gerekirse çalan
     cümleyi yumuşakça keserek (kesilen talimat hâlâ geçerliyse bir kez yeniden sıraya girer).
   · Övgü: olaydan sonra 1,5 sn içinde ses boşalırsa söylenir, yoksa atılır; en az 12 sn arayla, çeşitli.
   · DURUM 'oyun' değilse ya da ağaç yandıysa oyun cümlesi başlamaz (çalan da kesilir; "ağaca dokun" bitebilir). */
'use strict';
const SES = (() => {
  const LINES = /*SESLER*/
{
    "a_giris1": "Bir varmış, bir yokmuş. Feza adında, küçük bir çocuk varmış. Her gece, en sevdiği oyuncağı Pırıl'a sarılıp uyurmuş.",
    "a_giris2": "Pırıl, mor renkli, minicik bir ejderhaymış. Bir gece Feza uykuya dalınca, Pırıl'ın gözleri yavaşça parlamaya başlamış.",
    "a_giris3": "Ve oda, yavaş yavaş, sihirli bir ormana dönüşmüş. Işık Ormanı'na!",
    "p_uyan": "Feza, uyan! Ormanımızın ışığı sönmüş, Pofuduklar da uykuya dalmış! Bize yardım lazım!",
    "p_merhaba": "Hadi, şu parlayan çiçeğe gidelim! Parmağını ekranın o tarafına koy ve tut!",
    "p_zipla": "Zıplamak için, köşedeki yuvarlak düğmeye bas! Hop!",
    "p_cicek_ilk": "Yaşasın, çiçek açtı! Orman biraz aydınlandı. Hadi, öbür çiçekleri de bulalım!",
    "p_uyuyor": "Bak, bir Pofuduk uyuyor! Pofuduklar ışığı karınlarında taşırlar. Işığı sönünce uyuyup kalmışlar. Üstüne zıpla, ışığını uyandır!",
    "p_uyandi": "Çok yaşa, Pofuduk! Işığı geri geldi! Orman da aydınlanıyor. Günaydın!",
    "p_karanlik": "Burası çok karanlık. Bekle, ben ışık üfleyeceğim!",
    "p_nilufer": "Bak, suyun üstünde nilüfer yaprakları çıktı! Zıplaya zıplaya, üstlerinden geç!",
    "p_karanlik2": "Bir gölcük daha! Hadi, ben yine ışık üfleyeyim!",
    "p_nilufer2": "Yine yapraklar çıktı! Hop hop, üstlerinden geç!",
    "p_minder": "Bu Pofuduk yumuşacık bir minder! Üstüne zıpla, seni yukarı fırlatsın!",
    "p_ciftzipla": "Zıpla, havadayken düğmeye bir daha bas! Ben seni yukarı iterim!",
    "p_sakli": "Bak, yukarıda gizli bir yol var! Oradaki parlak tohumları toplayalım mı?",
    "p_tohum": "Gizli bir ışık tohumu buldun! Ne güzel parlıyor!",
    "p_buyuk": "Vay, Büyük Pofuduk! Işık Ağacı'nı o koruyor. Onu uyandırınca ağaç yanacak! Hadi, buradaki üç çiçeğe dokun!",
    "p_buyuk_goz": "Bak bak, bir gözünü açtı! Başka bir çiçek daha bul!",
    "p_buyuk_esne": "Esniyor! Son çiçeğe de dokun, uyansın!",
    "p_buyuk_kalk": "Uyandı! Hadi, üstüne zıpla, seni ağaca fırlatsın!",
    "p_agac": "İşte Işık Ağacı! Hadi Feza, koş, ağaca dokun!",
    "p_sarki1": "Bu Pofuduk çok derin uyuyor. Ona ışık şarkısı söyleyelim!",
    "p_sarki2": "Beni dinle, sonra sen çal.",
    "p_sarki3": "Şarkını duydu! Işığı geri geldi.",
    "p_yol": "Feza, bu tarafa gel! Beni takip et!",
    "p_kurtar": "Tuttum seni! Bir daha deneyelim, sen yaparsın!",
    "p_kurtar1": "Hop, buradayım!",
    "p_kurtar2": "Tuttum seni! Hadi, bir daha!",
    "p_kurtar3": "Sorun yok, ben yanındayım!",
    "p_kurtar4": "Yakaladım! Sen çok cesursun.",
    "p_yardim1": "Gel, sana yardım edeyim!",
    "p_yardim2": "Bekle, seni ben taşıyayım!",
    "p_aferin1": "Aferin sana!",
    "p_aferin2": "Süpersin, Feza!",
    "p_aferin3": "Çok güzel gidiyorsun!",
    "p_aferin4": "Çok şahane!",
    "p_aferin5": "İşte böyle!",
    "p_aferin6": "Sen gerçek bir kahramansın!",
    "p_aferin7": "Harikasın!",
    "p_aferin8": "Yaşasın, başardın!",
    "p_aferin9": "Ne kadar da cesursun!",
    "a_final1": "Feza ile Pırıl, Işık Ağacı'nı yeniden parlatmışlar. Bütün orman ışıl ışıl olmuş, Pofuduklar sevinçle dans etmiş.",
    "a_final2": "Sabah olunca, Feza yatağında gözlerini açmış. Pırıl da ona, tatlı tatlı göz kırpmış.",
    "a_final3": "Ve her gece, yeni bir macera onları bekliyordu...",
    "p_gecis": "Işık Ağacı yandı! Yıldızlar göle düşmüş. Hadi gidelim!",
    "a_y_final1": "Bütün yıldızlar yerine dönmüş. Orman da gökyüzü de ışıl ışıl olmuş, Pofuduklar sevinçle dans etmiş.",
    "a_y_final2": "Feza bütün gece yıldız toplamış. Sabah yatağında uyanmış, Pırıl da ona göz kırpmış.",
    "a_y_final3": "Ve gökyüzündeki yıldızlar, her gece onları bekleyecekmiş...",
    "p_y_giris": "Burası Yıldız Gölü. Sönük yıldızları bulup uyandıralım.",
    "p_y_gol": "Bak, yıldız taşları! Üstlerine bas, yolu açılıyor.",
    "p_y_yildiz": "Yıldız uyanıyor! Bak, göğe çıkıyor.",
    "p_y_yildiz2": "Gökyüzü yıldızla doluyor. Çok güzel!",
    "p_y_pofuduk": "Bu Pofuduklar da uyuyor. Üstlerine zıpla, ışıklarını uyandır!",
    "p_y_hayvan": "Vay, Yıldız Kaplumbağası! Sırtındaki yıldızları yakarsak uyanacak. Hadi, hepsine dokun!",
    "p_y_hayvan_uyan": "Günaydın, Yıldız Kaplumbağası! Hadi, hep birlikte göğe!",
    "p_y_bitti": "Bütün yıldızlar yerinde! Orman da gökyüzü de ışık içinde.",
    "p_secim": "Bu gece nereye gidelim?",
    "p_y_uyku": "Bu gece yıldızlara gidiyoruz!",
    "p_takim1": "Yıldızları birleştirelim!",
    "p_takim2": "Beni izle.",
    "p_takim3": "Çok güzel! Gökyüzüne yeni bir resim çizdin.",
    "p_y_sarki": "Bu Pofuduk yıldız şarkısı istiyor. Beni dinle, sonra sen çal!",
    "p_b_uyku": "Bu gece bulutlara gidiyoruz!",
    "p_b_giris": "Gökkuşağı kaybolmuş! Bulut Kuzucukları renklerini kaybetmiş. Hadi, onları bulalım!",
    "p_b_zip": "Bu bulut zıp zıp! Üstüne zıpla, seni yukarı atsın!",
    "p_b_kuzu": "Bak, bir Bulut Kuzucuğu! Rengi gitmiş, çok üzgün. Hadi, ona sarıl!",
    "p_b_kuzu_ilk": "Yaşasın, rengi geri geldi! Bak, gökyüzünde gökkuşağı görünüyor!",
    "p_b_esinti": "Rüzgâr esiyor! İçine gir, seni yukarı taşısın!",
    "p_b_sekil1": "Bu bulutun içinde biri saklanıyor. Hadi, bulalım!",
    "p_b_sekil2": "Bak bak, bir şey çıkıyor!",
    "p_b_sekil3": "Buldun! Bulut canlandı, bak nasıl seviniyor!",
    "p_b_sekil4": "Bak, bu sensin Feza!",
    "p_b_ucus": "Hadi Feza, bin sırtıma! Uçuyoruz!",
    "p_b_ucus2": "Yaşasın, uçuyoruz! Parlayan ışıltıları topla!",
    "p_b_selam": "Bak Feza! Bulut arkadaşlarımız bize el sallıyor!",
    "p_b_tepe": "İşte Gökkuşağı Tepesi! Kuzucuklar da seninle geldi. Hadi, en tepeye çık!",
    "p_b_bitti": "Gökkuşağı geri geldi! Ne kadar da güzel!",
    "a_is_gel": "Bak, Işıl geldi! Gökkuşağının yunikornu.",
    "a_is_bin": "Işıl'ın sırtına bin! Sıkı tutun, kayıyoruz!",
    "a_is_in": "Işıl'la gökkuşağından kaydık! Ne güzel bir gündü.",
    "a_b_final1": "Yedi Bulut Kuzucuğu gökyüzünde yan yana dizilmiş ve kocaman bir gökkuşağı olmuş. Feza ile Pırıl, gökkuşağından kayarak inmişler.",
    "a_b_final2": "Sabah olunca, Feza yatağında gözlerini açmış. Pencereden bakmış ki, gökyüzünde kocaman bir gökkuşağı! Pırıl da ona göz kırpmış.",
    "a_b_final3": "Ve her gece, yeni bir macera onları bekliyordu...",
    "p_dost1": "Seninle oynamak çok güzel!",
    "p_dost2": "Ben hep yanındayım, Feza.",
    "p_dost3": "Hadi, maceraya devam!",
    "p_dost_orman": "Duydun mu? Orman bize şarkı söylüyor.",
    "p_dost_yildiz": "Yıldızlar bize göz kırpıyor!",
    "p_dost_bulut": "Bulutlar pamuk gibi yumuşacık!",
    "p_i_uyku": "Bu gece İnci Denizi’ne gidiyoruz!",
    "p_i_giris": "Burası İnci Denizi! Minik dostlarımıza yardım edip Büyük İnci’yi uyandıralım.",
    "p_i_yuz": "Parmağını gitmek istediğin yerde tut. Yukarıya da aşağıya da yüzebilirsin! Yuvarlak düğmeyle biraz hızlanırız.",
    "p_i_denizati": "Denizatlarına dokun. Onlarla birlikte mercan bahçelerini ışıklandıralım!",
    "p_i_denizati_ilk": "Bak, ışığı uyandı! Kuyruğuyla bize teşekkür ediyor.",
    "p_i_ahtapot": "Bu sevimli ahtapot kabuklarına dolanmış. Ona yardım edelim!",
    "p_i_ahtapot_yardim": "Kolundaki kabuğu, aynı şekilli kum yuvasına sürükle. Ben yanındayım!",
    "p_i_ahtapot_bitti": "Kolları açıldı! Bak, bize yolu açıyor. Teşekkür ederiz, minik dostum!",
    "p_i_vatoz": "Kurdele Vatoz ile ışıklı kemerlerden geçelim. Parmağını yukarıda ya da aşağıda tutarak onu yönlendirebilirsin!",
    "p_i_vatoz_bitti": "Ne güzel yüzdük! İşte Büyük İnci’nin yuvası.",
    "p_i_inci": "Büyük İnci burada uyuyor. Hadi, yaklaşıp ona dokunalım!",
    "p_i_inci_uyan": "İnci uyanıyor! Bak, kabuğu açılıyor.",
    "p_i_dostlar": "Denizatı dostlarımız da geldi! Birlikte dans edelim.",
    "p_i_deniz_uyandi": "İnci Denizi ışıl ışıl oldu. Ne güzel bir rüya!",
    "p_i_bitti": "İnci uyandı! Bütün deniz ışıl ışıl. Dostlarımız da çok mutlu!",
    "p_dost_deniz": "Denizin içinde seninle yüzmek çok güzel!",
    "a_i_final1": "Feza ile Pırıl, İnci Denizi’nin minik dostlarına yardım etmişler. Büyük İnci uyanınca mercanlar yumuşacık renklerle parlamış.",
    "a_i_final2": "Sabah Feza yatağında gözlerini açmış. Güneş, odasına deniz gibi ışıklar çizmiş. Pırıl da ona tatlı tatlı göz kırpmış.",
    "a_i_final3": "Ve her gece, yeni bir rüya onları bekliyormuş...",
    "p_v_uyku": "Bu gece, Uyuyan Yanardağ'a gidiyoruz!",
    "p_v_giris": "Kor Çiçeği uyumuş, Feza. Işık bahçelerini canlandıralım; dağın sıcacık kalbine gidelim.",
    "p_v_buhar": "Bu yumuşacık buhar bizi yukarı taşıyor! Taşlara zıpla, sıcak rüzgârda süzül!",
    "p_v_mini": "Bak, kocaman bir Anka yumurtası! Parmağınla yumurtayı okşa, onu ısıtalım.",
    "p_v_mini_yardim": "Yumurtayı okşa, içindeki Anka uyansın.",
    "p_v_anka_kanat": "Anka'nın kanadını renklendirelim! Parmağınla parlayan tüylerin üzerinden geç.",
    "p_v_kristal_son": "Merhaba, Anka! Kanatların ışıl ışıl oldu. Hadi, kayığımıza gidelim!",
    "p_v_sal": "Anka da bizimle geliyor! Kayığımıza parmağınla yukarıya, aşağıya yol göster. Işık çiçeklerinin arasından geçelim!",
    "p_v_sal_son": "Anka'yla dağın kalbine geldik! Kor Çiçeği çok yakında.",
    "p_v_kalp": "İşte Kor Çiçeği! Anka da yanımızda. Yaklaşalım, birlikte uyandıralım.",
    "p_v_bahce": "Dokunduğun çiçeklerden sıcak bir ışık yayıldı! Bak, bahçe canlanıyor.",
    "p_dost_volkan": "Bu dağın şarkısı ne kadar güzel! Seninle keşfetmeyi çok seviyorum.",
    "a_v_final1": "Feza ile Pırıl, Anka'yı uyandırmış; lav nehrinde onunla birlikte yol almışlar. Kor Çiçeği açılınca, bütün yanardağ bir ışık bahçesine dönüşmüş.",
    "a_v_final2": "Sabah Feza, sıcacık yatağında gözlerini açmış. Gün ışığı, yorganına altın desenler çizmiş. Pırıl da ona tatlı tatlı göz kırpmış.",
    "a_v_final3": "Ve Anka'nın sıcacık ışığı, Feza'nın rüyalarında hep parlayacakmış.",
    "p_f_uyku": "Bu gece, Şenlik Kalesi'ne gidiyoruz!",
    "p_f_giris": "Kasabanın fenerleri sönmüş, Feza. Hadi, fenerleri yakalım; şenliği birlikte uyandıralım!",
    "p_f_fener": "Fener yandı! Işığı bütün sokağa yayıldı. Öbür fenerlerin de yanından geçelim!",
    "p_f_fener2": "Kasaba ışıl ışıl olmaya başladı! Fenerler ne güzel parlıyor.",
    "p_f_midilli": "Bak, bir midilli uyuyor! Üstüne zıpla, onu uyandıralım.",
    "p_f_midilli_uyan": "Günaydın, midilli! Yelesi ışıl ışıl oldu. Üstüne zıpla, seni yukarı sıçratsın!",
    "p_f_halka_giris": "Işıklı midilliye binelim! Parlayan halkaları görünce ekrana dokun, midilli zıplasın!",
    "p_f_halka": "Çok güzel gidiyoruz! Halkaları toplamaya devam!",
    "p_f_halka_bitti": "Yaşasın, bütün halkaları topladık! Midilli bizi kalenin önüne getirdi.",
    "p_f_kopru": "Bak, kalenin köprüsü indi! Hadi, avluya gidelim. Şenlik bizi bekliyor.",
    "p_f_final": "Şenlik başladı! Bak, bütün dostlarımız da gelmiş!",
    "p_dost_senlik": "Bu kasaba ne kadar tatlı! Seninle şenliğe gitmek çok güzel.",
    "a_f_final1": "Feza ile Pırıl, kasabanın fenerlerini yakmışlar, uyuyan midillileri uyandırmışlar. Kalenin avlusunda, rengârenk bir şenlik başlamış.",
    "a_f_final2": "Sabah Feza, yatağında gözlerini açmış. Güneş, odasına fener gibi altın ışıklar saçmış. Pırıl da ona tatlı tatlı göz kırpmış.",
    "a_f_final3": "Ve rüyalardaki bütün dostlar, Feza'yı her gece sevgiyle bekliyormuş.",
    "p_k_uyku": "Bu gece, karlı ormana, Kuzey Işıkları'na gidiyoruz!",
    "p_k_giris": "Gökyüzündeki kuzey ışıkları sönmüş, Feza. Kar fenerlerini yakalım; ışıkları birlikte geri getirelim!",
    "p_k_fener": "Fener yandı! Bak, gökyüzünde renkli bir ışık belirdi. Öbür fenerlerin de yanından geçelim!",
    "p_k_fener2": "Gökyüzü renklenmeye başladı! Kuzey ışıkları geri geliyor.",
    "p_k_yavru": "Bak, karın içinde minik bir yavru uyuyor! Üstüne zıpla, onu uyandıralım.",
    "p_k_yavru_uyan": "Günaydın, minik yavru! Bak, bizi yukarı sıçrattı!",
    "p_k_geyik": "Merhaba, minik ren geyiği! Boynuzlarındaki kristaller sönmüş. Fenerleri yaktıkça onlar da parlayacak!",
    "p_k_kardan_giris": "Hadi, bir kardan adam yapalım! Parmağınla kar topunu yuvarla, kocaman olsun!",
    "p_k_kardan_top": "Toplar üst üste oldu! Şimdi burnunu, gözlerini ve atkısını takalım. Parçalara dokun!",
    "p_k_kardan_bitti": "Kardan adam canlandı! Bak, bize el sallıyor. O da bizimle geliyor!",
    "p_k_buz": "Göl buz tutmuş! Hadi, kayarak gidelim. Çok eğlenceli!",
    "p_k_kizak_giris": "Ren geyiği kızağımızı çekecek! Ekrana dokun, kızak zıplasın; parlayan taneleri toplayalım!",
    "p_k_kizak": "Çok hızlı gidiyoruz! Taneleri toplamaya devam!",
    "p_k_kizak_bitti": "Ne güzel kaydık! İşte kuzey tepesi. Hadi, tepeye çıkalım!",
    "p_k_final": "Bak, kuzey ışıkları geri geldi! Bütün gökyüzü rengârenk!",
    "p_dost_kar": "Kar taneleri pamuk gibi yumuşacık! Seninle karda yürümek çok güzel.",
    "a_k_final1": "Feza ile Pırıl, kar fenerlerini yakmışlar, uyuyan yavruları uyandırmışlar. Kuzey tepesinde, gökyüzü rengârenk ışıklarla dans etmeye başlamış.",
    "a_k_final2": "Sabah Feza, sıcacık yatağında gözlerini açmış. Pencerenin önüne pamuk gibi kar yağmış. Pırıl da ona tatlı tatlı göz kırpmış.",
    "a_k_final3": "Ve kuzey ışıkları, Feza'nın rüyalarında hep renk renk parlayacakmış.",
    "p_c_uyku": "Bu gece Cadılar Bayramı! Hadi, Balkabağı Gecesi'ne gidiyoruz!",
    "p_c_giris": "Yaşasın, Cadılar Bayramı! Ama bak, köyün kabak fenerleri sönmüş. Hadi Feza, onları birlikte yakalım!",
    "p_c_kostum": "Bak, sihirli kostümler! Hangisini giymek istersin? Birine dokun!",
    "p_c_kostum_cadi": "Vay, minik bir cadı oldun! Yıldızlı şapkan sana çok yakıştı!",
    "p_c_kostum_kabak": "Vay canına, tombul bir balkabağı oldun! Çok tatlısın!",
    "p_c_kostum_iskelet": "Ne sevimli bir iskelet oldun! Kemiklerin ışıl ışıl parlıyor!",
    "p_c_kostum_yarasa": "Minik bir yarasa oldun! Kollarını aç, bak kanatların açılıyor!",
    "p_c_fener": "Fener yandı! Bak, bize gülümsüyor! Öbür kabakların da yanından geçelim.",
    "p_c_fener2": "Köy renklenmeye başladı! Kabak fenerleri ne güzel parlıyor.",
    "p_c_fener_son": "Bütün kabak fenerleri yandı! Köy ışıl ışıl oldu.",
    "p_c_hayalet": "Duydun mu? Biri kıkır kıkır gülüyor! Hadi, saklandığı yere gidelim.",
    "p_c_hayalet_bul": "Buldun onu! Minik bir hayaletçik! Bak, bizimle gelmek istiyor.",
    "p_c_hayalet2": "Bir hayaletçik daha! Saklambaçta çok iyisin!",
    "p_c_hayalet_son": "Bütün hayaletçikleri buldun! Hepsi seninle geliyor.",
    "p_c_kabakyuz_giris": "Bu kocaman kabağın yüzü yok! Hadi ona göz, burun ve ağız seçelim. Beğendiğine dokun!",
    "p_c_kabakyuz_bitti": "Kabağımız canlandı! Bak, kahkahalarla gülüyor!",
    "p_c_iskelet_giris": "İskelet orkestrası! Parlayan iskelete dokun, kaburgalarından müzik çıksın!",
    "p_c_iskelet_bitti": "Ne güzel bir şarkı! Bak, iskeletler kemik dansı yapıyor!",
    "p_c_sokak": "İşte şeker sokağı! Hadi, kapıları çalalım!",
    "p_c_sekermi": "Şeker mi şaka mı!",
    "p_c_sekermi2": "Şeker mi, şaka mı!",
    "p_c_sekermi3": "Hadi: Şeker mi şaka mı!",
    "p_c_kazan_giris": "Cadı Nine iksir yapıyor! Havadaki malzemeleri parmağınla kazana götür.",
    "p_c_kazan_bitti": "Süpürge bizi bekliyor! Hadi, yanına gidelim!",
    "p_c_supurge_giris": "Süpürgeye bin, uçuyoruz! Ekrana dokun, süpürge yükselsin. Parlayan şekerleri toplayalım!",
    "p_c_supurge": "Bak, kocaman ayın önünden uçuyoruz! Ne kadar güzel!",
    "p_c_supurge_bitti": "Ne güzel uçtuk! İşte köy meydanı. Şenlik bizi bekliyor!",
    "p_c_final": "Balkabağı Şenliği başladı! Mutlu Cadılar Bayramı, Feza!",
    "p_dost_cadi": "Cadılar Bayramı'nı seninle kutlamak çok güzel!",
    "a_c_final1": "Feza ile Pırıl, köyün kabak fenerlerini yakmışlar, saklanan hayaletçikleri bulmuşlar. Köy meydanında, ışıl ışıl bir Balkabağı Şenliği başlamış.",
    "a_c_final2": "Sabah Feza, yatağında gözlerini açmış. Komodinin üstünde gülümseyen minicik bir balkabağı ve bir şeker duruyormuş. Pırıl da ona tatlı tatlı göz kırpmış.",
    "a_c_final3": "Ve Balkabağı Gecesi'nin bütün dostları, Feza'yı her gece kahkahalarla bekliyormuş.",
    "p_c_supurge_yardim": "Ben de yardım ederim! Ekrana dokunursan süpürge yükselir.",
    "kd_cadi": "Vay vay! Minik bir cadı gelmiş. Buyur, şekerler senin!",
    "kd_kabak": "Sen de benim gibi balkabağısın! Al bakalım, şekerler senin!",
    "kd_iskelet": "Ne sevimli bir iskelet! Buyur, şekerler senin!",
    "kd_yarasa": "Minik bir yarasa uçup gelmiş! Al bakalım şekerini!",
    "kd_genel": "Ne güzel bir kostüm! Buyur, şekerler senin!",
    "kd_veda": "İyi eğlenceler, küçük dostum!",
    "in_cadi": "Ne tatlı bir cadı olmuşsun! Şaka zamanı, kutuya bak!",
    "in_kabak": "Yuvarlacık bir balkabağı! Şaka zamanı, kutuya bak!",
    "in_iskelet": "Benim gibi bir iskelet! Şaka zamanı, kutuya bak!",
    "in_yarasa": "Ne şirin bir yarasa! Şaka zamanı, kutuya bak!",
    "in_genel": "Ne güzel bir kostüm! Şaka zamanı, kutuya bak!",
    "in_veda": "Güle güle, tatlım!",
    "ck_cadi": "Sen de cadısın! Hadi büyü yapalım, şapkaya bak!",
    "ck_kabak": "Ne güzel bir balkabağı! Şapkama bak, şaka!",
    "ck_iskelet": "Takır takır bir iskelet! Şapkama bak, şaka!",
    "ck_yarasa": "Kanatların çok güzel! Şapkama bak, şaka!",
    "ck_genel": "Ne güzel bir kostüm! Şapkama bak, şaka!",
    "ck_veda": "Yine gel, olur mu?",
    "kk_cadi": "Miyav! Cadılar benim en sevdiğim! Şapkamda şeker var.",
    "kk_kabak": "Miyav! Ne yuvarlak bir balkabağı! Şapkamda şeker var.",
    "kk_iskelet": "Miyav! Parlak bir iskelet! Şapkamda şeker var.",
    "kk_yarasa": "Miyav! Yarasa arkadaşım gelmiş! Şapkamda şeker var.",
    "kk_genel": "Miyav! Ne güzel bir kostüm! Şapkamda şeker var.",
    "kk_veda": "Miyav, güle güle!",
    "ht_cadi": "Kıkır kıkır! Ne şeker bir cadı! Baloncuk şakası!",
    "ht_kabak": "Kıkır kıkır! Minik balkabağım! Baloncuk şakası!",
    "ht_iskelet": "Kıkır kıkır! Ne güzel bir iskelet! Baloncuk şakası!",
    "ht_yarasa": "Kıkır kıkır! Tatlı yarasam! Baloncuk şakası!",
    "ht_genel": "Kıkır kıkır! Ne güzel bir kostüm! Baloncuk şakası!",
    "ht_veda": "Kıkır kıkır, güle güle!",
    "k2_cadi": "Bir cadı! Bir cadı! Konfeti şakası!",
    "k2_kabak": "Bizim gibi bir balkabağı! Konfeti şakası!",
    "k2_iskelet": "Bir iskelet! Ne güzel! Konfeti şakası!",
    "k2_yarasa": "Bir yarasa! Ne güzel! Konfeti şakası!",
    "k2_genel": "Ne güzel bir kostüm! Konfeti şakası!",
    "k2_veda": "Güle güle! Güle güle!",
    "cn_merhaba": "Hoş geldin yavrum! İksirime yardım eder misin?",
    "cn_malzeme": "Mis gibi kokuyor! Bir tane daha at bakalım!",
    "cn_bitti": "Hadi bakalım, iyi uçuşlar!",
    "p_c_kabakyuz_burun": "Şimdi bir burun seçelim!",
    "p_c_kabakyuz_agiz": "Şimdi de kocaman bir ağız!",
    "p_c_kabakyuz_ipucu": "Hangisini beğendin? Bir baloncuğa dokun!",
    "p_c_kabakyuz_yardim": "Ben şunu seçiyorum, bak!",
    "kb_tesekkur": "Ha ha ha! Teşekkür ederim, Feza!",
    "cn_puf": "Puf! Bak bak, süpürgem uyandı!",
    "p_c_iskelet_ipucu": "Bak, ışık kimin üstünde? Ona dokun, kaburgası çalsın!",
    "p_c_iskelet_yardim": "Gel, birlikte çalalım! Ben göstereyim.",
    "p_e_uyku": "Bu gece seni benim evime götüreceğim! Gözlerini kapat, Ejderha Vadisi'ne gidiyoruz!",
    "p_e_giris": "Yaşasın, burası benim evim! Ejderha Vadisi'ne hoş geldin, Feza! Ama bak, çiçekler kapanmış, yumurtalar üşümüş. Hadi, vadiye ışık getirelim!",
    "p_e_pul": "Bak, pul çiçeği açıldı! Tıpkı benim pullarım gibi parlıyor. Öbür çiçeklerin de yanından geçelim!",
    "p_e_pul2": "Vadi renklenmeye başladı! Çiçekler ne güzel parlıyor.",
    "p_e_pul_son": "Bütün pul çiçekleri açıldı! Vadimiz ışıl ışıl oldu.",
    "p_e_yumurta": "Bak, bir ejderha yumurtası! Üşümüş. Hadi, yanına git, ona sarılıp ısıtalım!",
    "p_e_yavru": "Yumurtadan minik bir yavru çıktı! Bak, sana sarılıyor. O da bizimle geliyor!",
    "p_e_yavru2": "Bir yavru daha! Başında yumurta kabuğundan şapkası var, ne tatlı!",
    "p_e_yavru_son": "Bütün yavrular çıktı! Hepsi peşimizden geliyor.",
    "p_e_meyve_giris": "Yavrular acıkmış! Bak, her biri bir meyve düşünüyor. O meyveye dokun, ona uçsun!",
    "p_e_meyve_ipucu": "Yavrunun baloncuğuna bak! Aynı meyveye dokun.",
    "p_e_meyve_yardim": "Gel, birlikte verelim! Ben göstereyim.",
    "p_e_meyve_iki": "Bak, ortadaki yavru bu sefer iki meyve istiyor!",
    "p_e_meyve_bitti": "Karınları doydu! Bak, mutlu mutlu uçuyorlar.",
    "p_e_kanat_giris": "Bu benim minik kuzenim Fıstık! Daha uçamıyor, biraz utanıyor. Ekrana dokun, kanatlarını çırpsın!",
    "p_e_kanat_yardim": "Gel Fıstık, birlikte uçalım!",
    "p_e_kanat_bitti": "Fıstık artık uçabiliyor! Ona sen öğrettin, Feza!",
    "p_e_kolye_giris": "Bu benim Büyükannem! Parlayan pullara dokun, kolyedeki yerine takalım!",
    "p_e_kolye_ipucu": "Pulun biçimine bak! Kolyede aynı yere götür.",
    "p_e_kolye_yardim": "Ben de yardım ederim, bak!",
    "p_e_kolye_bitti": "Büyükannem kayalıkta bizi bekliyor! Hadi, yanına gidelim!",
    "p_e_binis_giris": "Büyükannemin sırtına bin, uçuyoruz! Ekrana dokun, yükselsin. Işık baloncuklarını toplayalım!",
    "p_e_binis": "Bak, gün batıyor! Bulutların üstünden uçuyoruz. Ne kadar güzel!",
    "p_e_binis_yardim": "Ben de yardım ederim! Ekrana dokunursan Büyükannem yükselir.",
    "p_e_binis_bitti": "İşte Büyükannemin yuvası! Ejderha Kalbi orada bizi bekliyor.",
    "p_e_final": "Ejderha Kalbi yeniden parladı! Bütün vadi ışıl ışıl oldu, Feza!",
    "p_dost_ejder": "Evimi sana göstermek çok güzel! Sen benim en iyi arkadaşımsın.",
    "a_e_final1": "Feza ile Pırıl, pul çiçeklerini açmışlar, üşüyen yumurtaları ısıtmışlar. Büyükanne Ejderha'nın yuvasında, Ejderha Kalbi yeniden ışıl ışıl parlamış.",
    "a_e_final2": "Sabah Feza, yatağında gözlerini açmış. Komodinin üstünde parıldayan leylak bir ejderha pulu ve minicik bir yumurta kabuğu duruyormuş. Pırıl da ona tatlı tatlı göz kırpmış.",
    "a_e_final3": "Ve Ejderha Vadisi'nin bütün ejderhaları, Feza'yı her gece sıcacık bir kucakla bekliyormuş.",
    "bn_merhaba": "Hoş geldin, güzel yavrum! Kolyemin pulları çimenlere düşmüş. Bana yardım eder misin?",
    "bn_pul_yuvarlak": "Yuvarlacık pulum geri geldi!",
    "bn_pul_yildiz": "Yıldız pulum! Ne güzel parlıyor.",
    "bn_pul_kalp": "Kalp pulum! İçim ısındı.",
    "bn_pul_damla": "Damla pulum da yerinde!",
    "bn_pul_ay": "Ay pulum! Tıpkı gökyüzündeki gibi.",
    "bn_pul": "Bir pulum daha yerinde!",
    "bn_tesekkur": "Teşekkür ederim, canım Feza! Kolyem yeniden ışıl ışıl oldu.",
    "bn_binis": "Sıkı tutunun, yavrularım! Yavaş yavaş uçacağız.",
    "bn_hediye": "Bu parlak pul senin olsun, Feza. Sen artık bizim ailemizdensin.",
    "ea_merhaba": "Pırıl, yavrum, eve hoş geldin! Feza, sen de hoş geldin, tatlım.",
    "ea_kucak": "Gelin buraya, ikinize de kocaman sarılayım!",
    "eb_merhaba": "Feza, Pırıl'a yardım ettiğin için çok teşekkür ederiz! Kalbimizi sen ısıttın.",
    "eb_dans": "Hadi herkes, şimdi dans zamanı!",
    "fs_merhaba": "Merhaba. Ben Fıstık. Biraz korkuyorum, ama deneyeceğim.",
    "p_e_kanat_ipucu": "Dokun dokun! Fıstık her dokunuşta kanat çırpıyor.",
    "bn_davet": "Hadi bakalım, sırtıma binin. Sizi yuvama götüreyim!",
    "bn_selam": "Bakın, komşularımız bize selam veriyor!",
    "fs_ilk": "Vay! Biraz uçtum!",
    "fs_ucuyorum": "Uçuyorum! Bak Feza, uçuyorum!",
    "fs_tesekkur": "Teşekkür ederim, Feza!",
    "p_s_uyku": "Bu gece, Ay Işığı Şatosu'na gidiyoruz!",
    "p_s_giris": "Bak Feza, tepede kocaman bir şato! Ay bulutların arkasına saklanmış, şatonun bütün ışıkları sönmüş. Hadi, ay ışığını geri getirelim!",
    "p_s_pelerin": "Bak, havada pelerinler süzülüyor! Hangisini istersin? Birine dokun!",
    "p_s_ayna": "Şu kocaman aynaya bak! Ay ışığı ona düşüyor. Dokun, ışığı şatoya göndersin!",
    "p_s_ayna2": "Vay, şatonun yarısı aydınlandı! Pencereler gülümsüyor.",
    "p_s_ayna_son": "Bütün aynalar döndü! Şatonun her yeri ışıl ışıl.",
    "p_s_salon_giris": "Burası aynalı salon! Aynalar buğulanmış. Parmağınla sil, bakalım içlerinden ne çıkacak!",
    "p_s_salon_bitti": "Ne komik yansımalardı! Bütün aynalar parlıyor.",
    "p_s_org_giris": "Kocaman bir org! Parlayan boruya dokun, Vampir Dede dans etsin!",
    "p_s_org_bitti": "Vampir Dede ne güzel dans etti!",
    "p_s_pasta_giris": "Vampir Nine'nin çilekli pastası! Hadi, süsleri pastaya koyalım.",
    "p_s_pasta_bitti": "Pasta ışıl ışıl oldu!",
    "p_s_ucus_giris": "Pelerinini kanat gibi aç, Feza! Hadi, kuleye uçuyoruz!",
    "p_s_ucus": "Bak, Ay'ın önünden geçiyoruz! Yarasa dostlarımız da yanımızda.",
    "p_s_ucus_bitti": "Kuleye vardık! Ay Balosu birazdan başlıyor.",
    "p_s_final": "Bak, bulutlar dağılıyor! Kocaman Ay çıktı! Ay Balosu başladı, hadi dans edelim!",
    "p_dost_sato": "Seninle bu şatoda olmak çok güzel, Feza.",
    "a_s_final1": "Feza ile Pırıl, aynalarla ay ışığını şatoya taşımışlar. Bulutlar dağılmış, kocaman Ay gökyüzüne çıkmış ve Ay Balosu başlamış.",
    "a_s_final2": "Sabah Feza, yatağında gözlerini açmış. Komodinin üstünde minicik, lila bir yarasa peluşu ve kıpkırmızı bir çilek duruyormuş.",
    "a_s_final3": "Ve Ay Işığı Şatosu'ndaki dostları, Feza'yı bir sonraki baloya hep beklemişler.",
    "vk_merhaba": "Merhaba, ben Vela! Ay saklandı, bize yardım eder misin?",
    "p_s_pelerin_mor": "Mor pelerin! Üstünde minicik yıldızlar parlıyor. Sana çok yakıştı!",
    "p_s_pelerin_lacivert": "Gece mavisi pelerin! Tıpkı benimki gibi, ay işlemeli.",
    "p_s_pelerin_kirmizi": "Çilek kırmızısı pelerin! İçi pembe, tokası da kalp şeklinde.",
    "p_s_pelerin_pembe": "Pembe lila pelerin! Gümüş yıldız tozları saçıyor.",
    "p_s_ayna_ilk": "Bak bak! Işık aynadan sekti, şatonun kapısı ışıl ışıl oldu!",
    "p_s_ayna_ipucu": "Parlayan aynaya dokun, Feza! Işık şatoya koşsun.",
    "p_s_ayna_selale": "Vay! Aynalar art arda döndü, ışık şelale gibi aktı!",
    "p_s_ovgu1": "Şato seninle uyanıyor, Feza!",
    "p_s_ovgu2": "Ne güzel parladı!",
    "p_s_ovgu3": "Işık toplamakta çok ustasın!",
    "p_s_yarasa": "Bak, minik lila yarasalar! Baş aşağı uyukluyorlar, ne tatlılar.",
    "p_s_kopru": "Asma köprü! Altında pamuk gibi yumuşacık sis var.",
    "p_s_magara": "Kristal mağaraya geldik! Bak, şirin hayaletler bize el sallıyor.",
    "p_s_galeri": "Şatonun resim galerisi! Portrelerdeki herkes bize gülümsüyor.",
    "p_s_salon_ipucu": "Buğulu aynaya dokun ya da parmağınla sil!",
    "p_s_salon_yardim": "Gel, birlikte silelim! Bak, ben de siliyorum.",
    "p_s_org_yardim": "Parlayan boruya dokun! Hangisi parlıyorsa ona.",
    "p_s_org_birlikte": "Ben de çalıyorum, sen de katıl!",
    "p_s_pasta_ipucu": "Bir süse dokun, pastaya uçsun!",
    "p_s_pasta_cilek": "Şimdi en üste kocaman çileği koy!",
    "p_s_pasta_yardim": "Bak, ben de bir süs koyuyorum! Sen de bir tane seç.",
    "p_s_balkon": "Hadi balkona çıkalım! Oradan kuleye uçacağız.",
    "p_s_ucus_yardim": "Ekrana basılı tut, yükselelim! Bırakınca yavaşça süzülürüz.",
    "p_s_ucus_sato": "Bak, şatonun bütün pencereleri yanıyor!",
    "p_s_balo_ipucu": "Şu büyük ay taşına dokun! Ay'ı birlikte çağıralım.",
    "vk_gorusuruz": "Şatoda görüşürüz! Hadi, peşimden gel!",
    "vk_ayna": "Ben aynada görünmem ki! Bak, sadece tacım görünüyor.",
    "vk_salon": "Bak, şimdi ben de göründüm! Göz kırpıyorum!",
    "vk_org": "Yaşasın! Dedem dans ediyor!",
    "vk_ucus": "Pelerinini aç, benimle uç! Yaşasın, uçuyoruz!",
    "vk_balo": "Ay çıktı! Balo başlıyor!",
    "vk_tesekkur": "Teşekkürler Feza! Bu en güzel Ay Balosu!",
    "vd_merhaba": "Hoş geldin küçük dostum! Orgumu birlikte çalalım mı?",
    "vd_dans": "Ne güzel bir vals!",
    "vd_tesekkur": "Harika çaldın, küçük dostum!",
    "vd_vals": "Haydi, herkes vals yapsın!",
    "vn_pasta": "Hoş geldin tatlım! Pastamı birlikte süsleyelim mi?",
    "vn_kat1": "Ne güzel oldu!",
    "vn_kat2": "Pastam parlıyor! Çok güzel.",
    "vn_tesekkur": "Teşekkürler Feza! Pastam baloya hazır!",
    "vb_merhaba": "Merhaba Feza!",
    "vb_mutlu": "Yaşasın!",
    "vb_balo": "Dans edelim!",
    "p_s_ayna_sapka": "Bak bak, şapkalı ben!",
    "p_s_ayna_kedi": "Dede kedi olmuş! Miyav!",
    "p_s_ayna_pitir": "Pıtır sana göz kırptı!",
    "p_s_ayna_cilek": "Nine'nin topuzu çilek olmuş!",
    "p_s_ayna_ay": "Bak, Ay gülüyor!",
    "p_s_ayna_feza": "Feza, upuzun oldun!",
    "vk_gidik": "Gıdıklandım!",
    "vb_alkis": "Bir daha!",
    "p_q_uyku": "Hadi Feza, uyku vakti. Bu gece rüyada annenle kampüse gidiyoruz!",
    "p_q_giris": "Günaydın Feza! Bak, annenle kampüsteyiz!",
    "p_q_cicek": "Vay! Sen geçince çiçekler açıyor!",
    "p_q_scooter": "Mavi skuterin burada! Ekrana basılı tut, hızlan!",
    "p_q_kopuk": "Sabun köpükleri! Pıt pıt patlıyor.",
    "p_q_selam": "Bak, öğrenciler sana el sallıyor!",
    "p_q_ucurtmaver": "Annen sana uçurtma verdi! Koştukça yükselir.",
    "p_q_ucurtma": "Uçurtmaya dokun, takla atsın!",
    "p_q_takla": "Ne güzel takla attı!",
    "p_q_havuz": "Bak, fıskiyeler dans ediyor! Suya dokun.",
    "p_q_sayfa": "Kitabın sayfaları kuş gibi uçuyor!",
    "p_q_botanik": "Botanik bahçesine geldik! Ne çok çiçek var.",
    "p_q_kaplumbaga": "Bak, kaplumbağalar! Dokun, kafasını çıkarsın.",
    "p_q_gunes": "Kaplumbağalar güneşleniyor! Annen de onlara bakıyor.",
    "p_q_kplkule": "Vay! Kaplumbağa kulesi!",
    "p_q_bisiklet": "Şimdi küçük bisikletine bin! Kaskın da başında.",
    "p_q_ordek": "Ördekler peşimize takıldı, vak vak!",
    "p_q_kayik": "Annenle kayığa binelim! Basılı tut, kürekler hızlansın.",
    "p_q_buyukgolet": "Ne büyük bir gölet! Bak, kuğular yüzüyor.",
    "p_q_golsicak": "Annenle kayıkta olmak ne güzel, değil mi?",
    "p_q_sazan": "Bak, kocaman balıklar! Öpücük veriyorlar.",
    "p_q_gunbatimi": "Bak, güneş batıyor. Gökyüzü pembe oldu!",
    "p_q_cagir": "Annen seni yanına çağırıyor!",
    "p_q_dans": "Müzik başladı, hadi dans edelim!",
    "p_q_yildiz": "Bak, ilk yıldızlar çıktı!",
    "p_q_kedi": "Kedicik mırlıyor!",
    "p_q_kopek": "Köpekçik sana pati verdi!",
    "p_q_aferin2": "Ne güzel yaptın Feza!",
    "p_q_aferin": "Harika gidiyorsun Feza!",
    "a_q_final1": "Feza annesine sımsıkı sarıldı. Birlikte geçirdikleri bu güzel günü hep hatırlayacaktı.",
    "p_q_sabah": "Günaydın Feza! Annenle ne güzel bir gün geçirdik.",
    "a_ip_giris1": "Feza o gece, annesiyle birlikte ay ışığındaki gök bahçelerine gitmiş.",
    "a_ip_giris2": "Pırıl, köklerin arasında ışıl ışıl bir yol bulmuş.",
    "p_ip_giris": "Feza! Şu ışıklı tomurcuğa dokun. Bakalım içinden ne çıkacak!",
    "p_ip_kopru": "Işığı yavaşça çek. Annen de sana yardım ediyor!",
    "p_ip_koprubitti": "Bak, kökler birleşti! Artık birlikte yürüyebiliriz!",
    "p_ip_minder": "Bu bulutlar yumuşacık! Üstlerine zıplayınca ışık tohumları çıkıyor!",
    "p_ip_kelebek": "Parmağınla havaya bir yol çiz. Bak, çizdiğin yerde yapraklar büyüyor!",
    "p_ip_perde": "Şu ışık tülünü okşa. Arkasındaki bahçe uyanacak!",
    "p_ip_binis": "Bu kocaman yaprağa birlikte binin! Parmağınla yol göster, ben önden geliyorum.",
    "p_ip_final": "Şimdi ışıklarımızı birleştirelim. Annenle birlikte gökyüzünü uyandıracaksın!",
    "p_ip_gok": "Bak Feza! Gökyüzü rengârenk bir bahçe oldu!",
    "p_ip_yardim": "İşte burası! Şu parlayan tomurcuğa dokunabilirsin.",
    "a_ip_final1": "Feza ile annesi, o gece gökyüzünü birlikte uyandırmışlar.",
    "a_ip_final2": "Sabah, yastığının yanında ışık saçan küçücük bir filiz varmış.",
    "a_ip_final3": "Ve her gece, yeni bir macera onları bekliyordu...",
    "p_ip_uyku": "Bu gece, annenle yaşayan gök bahçelerine gidiyoruz!",
    "p_uz_uyku": "Bu gece, annenle yıldızların arasına gidiyoruz!",
    "p_uz_giris": "Bak Feza, minicik bir kuyruklu yıldız! Ailesini arıyor. Işık pusulası da sönmüş.",
    "p_uz_amac": "Ay, Mars, Jüpiter ve Uranüs! Her yerde birlikte oynayıp pusulasını parlatacağız.",
    "an_uz_basla": "Elini ver canım. Bu yolculuğa birlikte çıkıyoruz.",
    "p_uz_roket": "Roketimiz hazır! Annenle yan yana oturun. Kasklarımız bizi koruyacak.",
    "p_uz_ucus": "Uzayda süzülüyoruz! Parmağını yukarı aşağı gezdir, roket de seninle süzülsün.",
    "p_uz_ay": "Ay'a geldik! Burada hafifçe zıplayıp yavaşça yere inebilirsin.",
    "p_uz_ay_dunya": "Bak yukarı! Şu mavi beyaz top, bizim Dünya'mız!",
    "p_uz_ay_arac": "Parlayan parçaya dokun. Arabaya takalım!",
    "p_uz_ay_arac_yardim": "Parlayan parçaya dokun. Yerine uçacak.",
    "p_uz_ay_can": "Kraterde uyuyan yıldıza dokun. Birlikte zıplayalım!",
    "p_uz_ay_can_yardim": "Kraterdeki küçük yıldıza dokun.",
    "p_uz_ay_foto": "Parlayan yıldızlara dokun. Annenle fotoğrafınız çıksın!",
    "p_uz_ay_foto_yardim": "Çerçevenin parlayan yıldızına dokun.",
    "p_uz_muhur0": "Pusulanın gümüş ışığı geri geldi! Küçük dostumuzun yolu biraz daha aydınlandı.",
    "p_uz_mars": "Mars'tayız! Kızıl kumları var, ama burası soğuk. Sıcak uzay giysilerimiz bizi koruyor.",
    "p_uz_mars_gunes": "Kızıl tozu parmağınla sil. Çiçeğimiz ışıldasın!",
    "p_uz_mars_gunes_yardim": "Tozlu çiçeğin üstünü parmağınla sil.",
    "p_uz_mars_arac": "Kumdaki parlak taşa dokun. Arabamız onu çıkarsın!",
    "p_uz_mars_arac_yardim": "Kumdan görünen parlak taşa dokun.",
    "p_uz_mars_kum": "Kumdan kaleler yapalım. Parlayan kuma dokun!",
    "p_uz_mars_kum_yardim": "Parlayan kumun üstüne dokun.",
    "p_uz_muhur1": "Kehribar ışık da parladı! Pusula, küçük dostumuza yol gösteriyor.",
    "an_uz_mars": "Biraz kızıl toz uçuşuyor. Merak etme, yanındayım.",
    "p_uz_jupiter": "İşte Jüpiter! Üstünde yürümüyoruz. Güvenli bulut istasyonumuzdan kocaman bulutlarına bakıyoruz.",
    "p_uz_jupiter_serit": "Parlayan buluta dokun. Aynı biçimdeki yuvasına uçsun!",
    "p_uz_jupiter_serit_yardim": "Parlayan buluta dokun. Yuvasına uçsun.",
    "p_uz_jupiter_yelken": "Parlayan yıldıza dokun. Yelkenlimiz oraya uçsun!",
    "p_uz_jupiter_yelken_yardim": "Yelkenlinin önündeki parlayan yıldıza dokun.",
    "p_uz_jupiter_girdap": "Fırtınadaki küçük yıldıza dokun. Onu dışarı çıkaralım!",
    "p_uz_jupiter_girdap_yardim": "Bulutun içinde kalan küçük yıldıza dokun.",
    "p_uz_muhur2": "Mercan rengi ışık geri geldi! Pusulamıza bir sıcak renk daha eklendi.",
    "p_uz_uranus": "Uranüs'e geldik! Burası çok soğuk. Korunaklı buz bahçemizde ışıklarla oynayabiliriz.",
    "p_uz_uranus_isik": "Parlayan yıldıza dokun. Işıklı gök yolunu birlikte çizelim!",
    "p_uz_uranus_isik_yardim": "Sıradaki parlayan yıldıza dokun.",
    "p_uz_uranus_can": "Buz çanlarına dokun. Uyuyan yıldız dostumuzu uyandıralım!",
    "p_uz_uranus_can_yardim": "Parlayan buz çanına dokun.",
    "p_uz_uranus_kay": "Parlayan yıldıza dokun. Küçük dostumuz ailesine doğru kaysın!",
    "p_uz_uranus_kay_yardim": "Buz yolundaki parlayan yıldıza dokun.",
    "p_uz_muhur3": "Buz mavisi ışık da yandı! Pusulada serin bir ışık parlıyor.",
    "p_uz_tamam": "Pusulanın dört rengi de parlıyor! Küçük dostumuzun yolu artık ışıl ışıl.",
    "p_uz_kavusma": "Bak Feza! Küçük kuyruklu yıldız, ailesine kavuştu. Birbirlerine ışıklarıyla sarılıyorlar!",
    "p_uz_donus": "Şimdi Dünya'ya dönüyoruz. Küçük dostumuz, ailesiyle yıldızların arasında kalıyor.",
    "p_uz_donus_dost": "Şimdi Dünya'ya dönüyoruz. Küçük dostumuz da bizimle. Yeni bir rüyada aramaya devam ederiz.",
    "an_uz_final": "Seninle yıldızların arasında gezmek ne güzeldi, Feza.",
    "a_uz_final1": "Feza ve annesi, küçük kuyruklu yıldızı ailesine kavuşturmuş. Sonra roketlerine binip, ışıl ışıl Dünya'larına dönmüşler.",
    "a_uz_final1_dost": "Feza ve annesi, küçük kuyruklu yıldızla uzayı gezmiş. Yeni dostlarını yanlarına alıp, başka bir rüyada yeniden buluşmak üzere Dünya'ya dönmüşler.",
    "a_uz_final2": "Sabah olmuş. Feza sıcacık yatağında gözlerini açmış. Pırıl da hemen yanı başındaymış.",
    "a_uz_final3": "Ve annesiyle çıktığı bu yolculuk, kalbinde küçük bir yıldız gibi parlamış.",
    "p_uz_sabah": "Günaydın Feza! Annenle yıldızlara kadar gittik!",
    "p_q_ekmek": "Kayıkta ekmek sepeti var! Sepete ya da suya dokun, sazanlara küçük parçalar atalım.",
    "p_ip_oyuncak_yuva": "Minik yaprak dostları yuvalarına götür. Yuva sana rengârenk bir yol açsın!",
    "p_ip_oyuncak_yagmur": "Şu yumuşacık bulutu çiçeklerin üstüne götür. Yağmur yağsın, çiçekler açılsın!",
    "p_ip_oyuncak_muzik": "Mantarların şapkalarına dokun. Her biri başka bir sesle şarkına katılsın!",
    "p_ip_oyuncak_top": "Bulut topunu çiçeklerin üstüne doğru it. Top değince çiçekler uyansın!"
}
  /*SESLER-SON*/;

  const sesSaat = () => performance.now() / 1000;
  const ovguMu = k => /^p_aferin/.test(k);
  const SES_SAHNE = {    p_uyan: 1, p_gecis: 1, p_y_giris: 1, p_y_bitti: 1, p_secim: 1, p_y_uyku: 1, p_b_uyku: 1, p_b_giris: 1, p_b_bitti: 1, p_i_uyku: 1, p_i_giris: 1, p_i_yuz: 1, p_i_bitti: 1, p_i_inci_uyan: 1, p_i_dostlar: 1, p_i_deniz_uyandi: 1, p_f_uyku: 1, p_f_giris: 1, p_f_final: 1, p_k_uyku: 1, p_k_giris: 1, p_k_final: 1, p_c_uyku: 1, p_c_giris: 1, p_c_final: 1, p_e_uyku: 1, p_e_giris: 1, p_e_final: 1, p_s_uyku: 1, p_s_giris: 1, p_s_final: 1 };   // sahne cümleleri: öncelik 3, ağaç yandı/oyun bitti diye atılmaz
  const anlatici = k => k.startsWith('a_') || k === 'p_ip_uyku' || k === 'p_ip_giris' || k === 'p_v_uyku' || k === 'p_v_giris' || !!SES_SAHNE[k];
  const ses8Komsu = k => /^(kd|in|ck|kk|ht|k2|cn|kb)_/.test(k);   // Bölüm 8 komşu sesleri (Pırıl değil: onun ağzı oynamaz)
  const ses9Aile = k => /^(bn|ea|eb|fs)_/.test(k);   // Bölüm 9: Pırıl'ın ailesi ve Fıstık (Pırıl değil)
  const ses11Aile = k => /^(vk|vd|vn|vb)_/.test(k);   // Bölüm 11: vampir ailesi (Vela, Dede, Nine, Pıtır; Pırıl değil)
  const sesKim = k => k.startsWith('a_') ? 'a' : ses8Komsu(k) || ses9Aile(k) || ses11Aile(k) || /^an_uz_/.test(k) ? 'k' : 'p';
  // ── cümle bilgisi: oncelik (3 sahne · 2 oyun · 1 yönlendirme · 0 övgü), acil (2 araya girer · 1 olay tepkisi), ömür (sn), konu ──
  const KONU_SIRA = { p_buyuk: 1, p_buyuk_goz: 2, p_buyuk_esne: 3, p_buyuk_kalk: 4, p_agac: 5, p_karanlik: 1, p_nilufer: 2, p_karanlik2: 1, p_nilufer2: 2 };
  const sesTaban = k => (k === 'p_karanlik2' || k === 'p_nilufer2') ? k.slice(0, -1) : k;   // ikinci göl cümlesi → asıl anahtar (kurallar için)
  function sesBilgi(k) {
    k = sesTaban(k);
    if (anlatici(k)) return { oncelik: 3, acil: 0, omur: 1e9, konu: null };
    if (/^(p|an)_uz_/.test(k)) return { oncelik: 2, acil: 1, omur: 18, konu: null };
    if (k === 'p_q_ekmek' || /^p_ip_oyuncak_/.test(k)) return { oncelik: 2, acil: 1, omur: 14, konu: null };
    if (ovguMu(k)) return { oncelik: 0, acil: 0, omur: 1.5, konu: null };
    if (k === 'p_yol') return { oncelik: 1, acil: 0, omur: 3, konu: null };
    if (k === 'p_v_mini_yardim' || k === 'p_v_anka_kanat') return { oncelik: 2, acil: 1, omur: 8, konu: null };
    if (k === 'p_v_kristal_son' || k === 'p_v_sal_son' || k === 'p_v_bahce') return { oncelik: 2, acil: 1, omur: 8, konu: null };
    // Bölüm 6 (Şenlik Kalesi) olay tepkileri ve talimatları
    if (k === 'p_f_halka_giris') return { oncelik: 2, acil: 1, omur: 12, konu: null };
    if (k === 'p_f_midilli') return { oncelik: 2, acil: 1, omur: 10, konu: null };
    if (/^p_f_(fener2?|midilli_uyan|halka|halka_bitti|kopru)$/.test(k)) return { oncelik: 2, acil: 1, omur: 8, konu: null };
    // Bölüm 7 (Kuzey Işıkları) olay tepkileri ve talimatları
    if (k === 'p_k_kizak_giris' || k === 'p_k_kardan_giris' || k === 'p_k_kardan_top') return { oncelik: 2, acil: 1, omur: 12, konu: null };
    if (k === 'p_k_yavru' || k === 'p_k_geyik') return { oncelik: 2, acil: 1, omur: 10, konu: null };
    if (k === 'p_k_yavru_uyan') return { oncelik: 2, acil: 2, omur: 10, konu: null };   // ilk yavru girişteki fener/geyik sözlerinin arasında uyanıyor: sıradaki ilk söz o olsun (geyik tanışması yakınlıktan yeniden gelir)
    if (/^p_k_(fener2?|kardan_bitti|buz|kizak|kizak_bitti)$/.test(k)) return { oncelik: 2, acil: 1, omur: 8, konu: null };
    // Bölüm 8 (Balkabağı Gecesi): kapıdaki komşular ve "Şeker mi şaka mı!" kapı sahnesinin içinde, hemen (kısa ömür: Feza giderse atılır)
    if (/^(kd|in|ck|kk|ht|k2)_veda$/.test(k)) return { oncelik: 1, acil: 0, omur: 4, konu: null };
    if (ses8Komsu(k)) return { oncelik: 2, acil: 2, omur: 8, konu: null };
    if (/^p_c_sekermi\d?$/.test(k)) return { oncelik: 2, acil: 2, omur: 5, konu: null };
    if (k === 'p_c_kostum') return { oncelik: 2, acil: 1, omur: 25, konu: null };   // girişin hemen ardından (1 sn nefes)
    if (/^p_c_(kabakyuz|iskelet|kazan|supurge)_giris$/.test(k)) return { oncelik: 2, acil: 2, omur: 15, konu: null };   // mini oyunun tek talimatı: gerekirse çalanı cümle sonunda keser
    if (k === 'p_c_hayalet' || k === 'p_c_sokak') return { oncelik: 2, acil: 1, omur: 10, konu: null };
    if (k === 'p_c_fener' || k === 'p_c_hayalet_bul' || k === 'p_c_kostum_cadi' || k === 'p_c_kostum_kabak' || k === 'p_c_kostum_iskelet' || k === 'p_c_kostum_yarasa') return { oncelik: 2, acil: 1, omur: 14, konu: null };   // ilk kez öğreten / seven tepkiler: giriş konuşmaları sürerken de beklesin
    if (/^p_c_/.test(k)) return { oncelik: 2, acil: 1, omur: 8, konu: null };
    // Bölüm 9 (Ejderha Vadisi): mini oyunların tek talimatı gerekirse çalanı cümle sonunda keser; Büyükanne'nin pul sözleri anlık (kısa ömür)
    if (/^bn_pul/.test(k)) return { oncelik: 2, acil: 1, omur: 4, konu: null };
    if (k === 'bn_selam' || k === 'fs_ilk') return { oncelik: 2, acil: 1, omur: 5, konu: null };   // uzak ejderhalar geçerken / ilk kanat çırpışı (anlık)
    if (ses9Aile(k)) return { oncelik: 2, acil: 1, omur: 12, konu: null };
    // Bölüm 11 (Ay Işığı Şatosu): Vela'nın ayna şakası anlık; mini oyunların ve uçuşun tek talimatı gerekirse çalanı cümle sonunda keser; pelerin rengi hemen
    if (k === 'vk_gidik' || k === 'vb_alkis') return { oncelik: 1, acil: 0, omur: 2, konu: null };   // dokununca ara sıra kısa tepki: ses boşsa, yoksa atılır
    if (k === 'vk_ayna' || k === 'vk_salon' || k === 'vd_dans' || k === 'vk_org') return { oncelik: 2, acil: 2, omur: 6, konu: null };
    if (/^p_s_ayna_(sapka|kedi|pitir|cilek|ay|feza)$/.test(k)) return { oncelik: 2, acil: 2, omur: 5, konu: null };   // ayna salonundaki komik yansımaya anlık tepki
    if (k === 'vd_merhaba' || k === 'vn_pasta') return { oncelik: 2, acil: 2, omur: 10, konu: null };   // mini oyunu açan karşılama: Pırıl'ın talimatından önce
    if (/^v[kdnb]_(merhaba|gorusuruz)$/.test(k)) return { oncelik: 2, acil: 1, omur: 8, konu: null };
    if (ses11Aile(k)) return { oncelik: 2, acil: 1, omur: 12, konu: null };
    if (/^p_s_(salon|org|pasta|ucus)_giris$/.test(k) || /^p_s_pelerin_/.test(k)) return { oncelik: 2, acil: 2, omur: 15, konu: null };
    if (/^p_s_(.*_ipucu|.*_yardim|org_birlikte|pasta_cilek|ayna_selale|ucus_sato|ucus)$/.test(k)) return { oncelik: 2, acil: 1, omur: 7, konu: null };
    if (/^p_s_ovgu/.test(k)) return { oncelik: 1, acil: 0, omur: 3, konu: null };   // sıcak söz: ses boşsa
    if (/^p_s_/.test(k) && k !== 'p_s_pelerin' && k !== 'p_s_ayna') return { oncelik: 2, acil: 1, omur: 12, konu: null };
    if (/^p_e_(meyve|kanat|kolye|binis)_giris$/.test(k)) return { oncelik: 2, acil: 2, omur: 15, konu: null };
    if (k === 'p_e_yumurta' || k === 'p_e_pul' || k === 'p_e_yavru') return { oncelik: 2, acil: 1, omur: 14, konu: null };   // ilk kez öğreten tepkiler: giriş konuşması sürerken de beklesin
    if (/^p_e_/.test(k)) return { oncelik: 2, acil: 1, omur: 8, konu: null };
    if (/^p_kurtar/.test(k) || /^p_yardim/.test(k)) return { oncelik: 2, acil: 2, omur: 3, konu: 'kurtar' };
    if (k === 'p_buyuk_kalk' || k === 'p_agac') return { oncelik: 2, acil: 2, omur: 12, konu: 'buyuk' };
    if (k === 'p_buyuk_goz' || k === 'p_buyuk_esne') return { oncelik: 2, acil: 1, omur: 8, konu: 'buyuk' };
    if (k === 'p_buyuk') return { oncelik: 2, acil: 0, omur: 20, konu: 'buyuk' };
    if (k === 'p_nilufer') return { oncelik: 2, acil: 1, omur: 12, konu: 'gol' };
    if (k === 'p_karanlik') return { oncelik: 2, acil: 1, omur: 15, konu: 'gol' };
    if (k === 'p_sarki1' || k === 'p_sarki2' || k === 'p_sarki3') return { oncelik: 2, acil: 1, omur: 12, konu: null };   // şarkı etkinliği (sarki.js; oturumda yalnız ilk başlangıçta / ilk başarıda)
    if (k === 'p_takim1' || k === 'p_takim2') return { oncelik: 2, acil: 1, omur: 12, konu: null };
    if (k === 'p_takim3') return { oncelik: 2, acil: 1, omur: 8, konu: null };
    if (k === 'p_y_hayvan_uyan' || k === 'p_y_yildiz') return { oncelik: 2, acil: 1, omur: 8, konu: null };   // Bölüm 2 olay tepkileri
    if (k === 'p_y_yildiz2') return { oncelik: 2, acil: 1, omur: 6, konu: null };
    if (k === 'p_y_sarki') return { oncelik: 2, acil: 1, omur: 12, konu: null };
    if (k === 'p_cicek_ilk' || k === 'p_uyandi' || k === 'p_tohum') return { oncelik: 2, acil: 1, omur: 5, konu: null };
    // Bölüm 3
    if (k === 'p_b_kuzu_ilk') return { oncelik: 2, acil: 1, omur: 6, konu: null };
    if (k === 'p_b_ucus') return { oncelik: 2, acil: 1, omur: 8, konu: null };
    if (k === 'p_b_ucus2') return { oncelik: 2, acil: 0, omur: 8, konu: null };
    if (k === 'p_b_selam') return { oncelik: 2, acil: 1, omur: 5, konu: null };   // uçuşta bulut hayvanları geçerken (anlık: geç kalırsa atılır)
    if (/^p_b_sekil/.test(k)) return { oncelik: 2, acil: 1, omur: k === 'p_b_sekil1' ? 12 : 8, konu: null };
    if (/^p_dost/.test(k)) return { oncelik: 1, acil: 0, omur: 3, konu: null };   // uzun sessizlikte küçük dostça söz
    return { oncelik: 2, acil: 0, omur: 20, konu: null };   // konuşma tetikleyicilerinin talimatları
  }

  // ── oyun durumuna bakan yardımcılar ──
  const gP = () => (typeof P !== 'undefined' ? P : null);
  const gN = () => (typeof NESNELER !== 'undefined' ? NESNELER : []);
  const sesOnb = {};
  function sesTetik(k) {          // bolum.js'teki konuşma tetikleyicisi
    if (!(k in sesOnb)) sesOnb[k] = gN().find(n => n.tip === 'konusma' && n.anahtar === k) || null;
    return sesOnb[k];
  }
  function sesSonraki(k, tip) {   // tetikleyiciden sonraki ilk <tip> nesnesi (cümlenin anlattığı şey)
    const ad = k + '>' + tip;
    if (!(ad in sesOnb)) { const o = sesTetik(k); sesOnb[ad] = o ? gN().filter(n => n.tip === tip && n.x >= o.x - 2).sort((a, b) => a.x - b.x)[0] || null : null; }
    return sesOnb[ad];
  }
  // tetikleyen konuşma nesnesi: oyun.js SES.soyle(anahtar)'ı dokun anında çağırır (o.dokundu artık true) → Feza'ya en yakın dokunulmuş olan
  function sesTetikBul(k) {
    const p = gP(); let best = null, bd = 1e9, yedek = null, yd = 1e9;
    for (const n of gN()) {
      if (n.tip !== 'konusma' || n.anahtar !== k) continue;
      const d = p ? Math.abs(n.x - p.x) : n.x;
      if (n.dokundu) { if (d < bd) { bd = d; best = n; } } else if (d < yd) { yd = d; yedek = n; }
    }
    return best || yedek;
  }
  const sesIleride = (k, kare, s) => { const o = (s && s.o) || sesTetik(k), p = gP(); return !!(o && p && p.x > o.x + kare * T); };
  // cümlenin konusu bitti mi (uyandı / açıldı / göl aydınlandı)? karanlık nokta Pırıl üflerken değil, ışık gölü bulunca "bitmiş" sayılır
  const sesKonuBitti = n => !!(n && (n.tip === 'karanlik' ? sesAydinG[n.grup] : (n.done || n.uyandi || n.lit)));
  function sesGolAraligi(grup) {   // grubun nilüferlerinin x aralığı (yoksa BOLUM.gol)
    const ad = 'gol>' + grup;
    if (!(ad in sesOnb)) {
      let a = 1e9, b = -1e9;
      for (const n of gN()) if (n.tip === 'nilufer' && n.grup === grup) { a = Math.min(a, n.x); b = Math.max(b, n.x); }
      const gl = typeof BOLUM !== 'undefined' && BOLUM.gol;
      sesOnb[ad] = a < b ? { x0: a, x1: b } : (gl ? { x0: gl.x0, x1: gl.x1 } : null);
    }
    return sesOnb[ad];
  }
  const sesBitmis = (k, tip) => { const o = sesSonraki(k, tip); return !!(o && (o.done || o.uyandi || o.lit)); };
  let sesAsama = 0, sesBuyukZip = false, sesBuyukO, sesZipT = -1e9;
  const sesAydinG = {};   // aydınlanan göl grupları
  const sesBuyuk = () => { if (sesBuyukO === undefined) sesBuyukO = gN().find(n => n.tip === 'buyukPofuduk') || null; return sesBuyukO; };
  const sesBuyukAsama = () => { const b = sesBuyuk(); return Math.max(sesAsama, b && b.uyandi ? 3 : 0, (b && b.pf && b.pf.asama) || 0); };
  let sesZipladi = false; OLAY.on('ziplama', () => { sesZipladi = true; });
  const agacYandi = () => (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 2) ? false : !!(typeof TREE !== 'undefined' && TREE && TREE.done);
  const SES_MINI_ALAN = { p_sarki1: 'sk', p_sarki2: 'sk', p_takim1: 'tk', p_takim2: 'tk', p_b_sekil1: 'skl', p_b_sekil2: 'skl' };
  function sesMiniNesne(k) {
    const alan = SES_MINI_ALAN[k];
    const aktif = alan === 'sk' ? (typeof skAktif !== 'undefined' && skAktif) : alan === 'tk' ? (typeof tkAkt !== 'undefined' && tkAkt) : (typeof SKL !== 'undefined' && SKL.akt);
    if (aktif && aktif[alan]) return aktif;
    const p = gP(); let en = null, uzak = Infinity;
    for (const o of gN()) if (o[alan]) { const d = p ? Math.abs(o.x - p.x) : 0; if (d < uzak) { en = o; uzak = d; } }
    return en;
  }
  function sesMiniSuruyor(s) {
    const o = s.mini, k = o && o[SES_MINI_ALAN[s.k]];
    return !!(k && !o.done && !k.bitti && k.durum !== 'bitti');
  }
  // her talimatın "hâlâ yerinde mi?" koşulu (çalma anında bakılır)
  const KOSUL = {
    // B13: sıra beklerken konusu biten ya da geride kalan talimatlar söylenmez.
    p_ip_kopru: s => !!(window.IP13SES && IP13SES.gecerli(s.k, s.o)),
    p_ip_koprubitti: s => !!(window.IP13SES && IP13SES.gecerli(s.k, s.o)),
    p_ip_minder: s => !!(window.IP13SES && IP13SES.gecerli(s.k, s.o)),
    p_ip_kelebek: s => !!(window.IP13SES && IP13SES.gecerli(s.k, s.o)),
    p_ip_perde: s => !!(window.IP13SES && IP13SES.gecerli(s.k, s.o)),
    p_ip_yardim: s => !!(window.IP13SES && IP13SES.gecerli(s.k, s.o)),
    p_ip_binis: s => !!(window.IP13SES && IP13SES.gecerli(s.k, s.o)),
    p_ip_final: s => !!(window.IP13SES && IP13SES.gecerli(s.k, s.o)),
    p_ip_gok: s => !!(window.IP13SES && IP13SES.gecerli(s.k, s.o)),

    p_sarki1: sesMiniSuruyor, p_sarki2: sesMiniSuruyor,
    p_takim1: sesMiniSuruyor, p_takim2: sesMiniSuruyor,
    p_v_mini: () => (typeof V5 === 'undefined' || !V5.mini) && (typeof KR5 === 'undefined' || !KR5.o || !KR5.o.kr5 || /^(wait|arrive|egg)$/.test(KR5.o.kr5.phase)),
    p_v_mini_yardim: () => typeof KR5 !== 'undefined' && !!KR5.aktif && !!KR5.o.kr5 && KR5.o.kr5.phase === 'egg',
    p_v_anka_kanat: () => typeof KR5 !== 'undefined' && !!KR5.aktif && !!KR5.o.kr5 && KR5.o.kr5.phase === 'trace' && KR5.o.kr5.traceN < 5,
    p_v_sal: () => typeof V5 === 'undefined' || !V5.sal,
    p_v_kalp: () => typeof V5 === 'undefined' || !V5.final,
    // Bölüm 6: talimatlar konusu bitince söylenmez
    p_f_midilli: () => !(typeof SAYAC !== 'undefined' && SAYAC.midilli > 0),
    p_f_halka_giris: () => typeof V6 === 'undefined' || !V6.mini,
    p_f_halka: () => typeof V6 === 'undefined' || (!V6.mini && !!(gP() && gP().ucus)),
    p_f_kopru: () => typeof V6 === 'undefined' || !V6.final,
    p_f_fener2: () => typeof V6 === 'undefined' || !V6.final,
    p_dost_senlik: () => sesDostUygun(),
    // Bölüm 7: talimatlar konusu bitince söylenmez
    p_k_yavru: () => !(typeof SAYAC !== 'undefined' && SAYAC.yavru > 0),
    p_k_geyik: () => typeof V7 === 'undefined' || !V7.final,
    p_k_kardan_giris: () => typeof V7 === 'undefined' || !V7.kardan,
    p_k_kardan_top: () => typeof V7 === 'undefined' || !V7.kardan,
    p_k_buz: () => (typeof V7 === 'undefined' || !V7.final) && !(gP() && gP().ucus),
    p_k_kizak_giris: () => typeof V7 === 'undefined' || !V7.kizak,
    p_k_kizak: () => typeof V7 === 'undefined' || (!V7.kizak && !!(gP() && gP().ucus)),
    p_k_kizak_bitti: () => typeof V7 === 'undefined' || !V7.final,
    p_k_fener2: () => typeof V7 === 'undefined' || !V7.final,
    p_dost_kar: () => sesDostUygun(),
    // Bölüm 8: talimatlar konusu bitince söylenmez
    p_c_kostum: () => typeof V8 === 'undefined' || !V8.kostum,
    p_c_hayalet: () => !(typeof SAYAC !== 'undefined' && SAYAC.hayalet > 0),
    p_c_kabakyuz_giris: () => typeof V8 === 'undefined' || !V8.kabakYuz,
    p_c_kabakyuz_burun: () => typeof V8 === 'undefined' || !V8.kabakYuz, p_c_kabakyuz_agiz: () => typeof V8 === 'undefined' || !V8.kabakYuz,
    p_c_kabakyuz_ipucu: () => typeof V8 === 'undefined' || !V8.kabakYuz, p_c_kabakyuz_yardim: () => typeof V8 === 'undefined' || !V8.kabakYuz,
    p_c_iskelet_giris: () => typeof V8 === 'undefined' || !V8.iskelet,
    p_c_iskelet_ipucu: () => typeof V8 === 'undefined' || !V8.iskelet, p_c_iskelet_yardim: () => typeof V8 === 'undefined' || !V8.iskelet,
    p_c_kazan_giris: () => typeof V8 === 'undefined' || !V8.kazan,
    cn_merhaba: () => typeof V8 === 'undefined' || !V8.kazan,
    cn_malzeme: () => typeof V8 === 'undefined' || !V8.kazan,
    p_c_kazan_bitti: () => typeof V8 === 'undefined' || !V8.supurge,
    p_c_sokak: () => { const p = gP(), k = ses8IlkKapi(); return !ses8KapiN && !(p && k && p.x > k.x - 2 * T); },
    p_c_supurge_giris: () => typeof V8 === 'undefined' || !V8.supurge,
    p_c_supurge: () => (typeof V8 === 'undefined' || !V8.supurge) && !!(gP() && gP().ucus),
    p_c_supurge_yardim: () => (typeof V8 === 'undefined' || !V8.supurge) && !!(gP() && gP().ucus),
    p_c_supurge_bitti: () => typeof V8 === 'undefined' || !V8.final,
    p_c_fener2: () => typeof V8 === 'undefined' || !V8.final,
    p_c_fener_son: () => typeof V8 === 'undefined' || !V8.final,
    p_c_hayalet_son: () => typeof V8 === 'undefined' || !V8.final,
    p_dost_cadi: () => sesDostUygun(),
    // Bölüm 9: talimatlar konusu bitince söylenmez
    p_e_yumurta: () => !(typeof SAYAC !== 'undefined' && SAYAC.yavru > 0),
    p_e_meyve_giris: () => !sesV9('meyve'), p_e_meyve_iki: () => !sesV9('meyve'), p_e_meyve_ipucu: () => !sesV9('meyve'), p_e_meyve_yardim: () => !sesV9('meyve'),
    p_e_kanat_giris: () => !sesV9('kanat'), p_e_kanat_ipucu: () => !sesV9('kanat'), p_e_kanat_yardim: () => !sesV9('kanat'), fs_merhaba: () => !sesV9('kanat'), fs_ilk: () => !sesV9('kanat'),
    p_e_kolye_giris: () => !sesV9('kolye'), p_e_kolye_ipucu: () => !sesV9('kolye'), p_e_kolye_yardim: () => !sesV9('kolye'), bn_merhaba: () => !sesV9('kolye'),
    p_e_kolye_bitti: () => !sesV9('binis') && !(gP() && gP().ucus), bn_tesekkur: () => !sesV9('binis'), bn_davet: () => !sesV9('binis') && !(gP() && gP().ucus && gP().ucus.tip === 'buyukanneBinis'),
    p_e_binis_giris: () => !sesV9('binis'), bn_binis: () => !sesV9('binis'),
    p_e_binis: () => !sesV9('binis') && !!(gP() && gP().ucus), bn_selam: () => !sesV9('binis') && !!(gP() && gP().ucus), p_e_binis_yardim: () => !sesV9('binis') && !!(gP() && gP().ucus),
    p_e_binis_bitti: () => !sesV9('final'),
    p_e_pul2: () => !sesV9('final'), p_e_pul_son: () => !sesV9('final'), p_e_yavru_son: () => !sesV9('final'), p_e_yavru2: () => !sesV9('final'),
    p_dost_ejder: () => sesDostUygun(),
    p_dost_sato: () => sesDostUygun(),
    p_yol: () => !(sesB8() && ((typeof SEKER8 !== 'undefined' && SEKER8 && SEKER8.aktif) || (typeof om8MiniAktif === 'function' && om8MiniAktif())))
      && !(sesB9() && typeof om9MiniAktif === 'function' && om9MiniAktif())
      && !(typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 11 && typeof om11MiniAktif === 'function' && om11MiniAktif())
      && !(typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 12 && gP() && gP().ucus),   // etkinlik sırasında yol tarifi yok
    p_i_denizati: () => typeof DNZ === 'undefined' || DNZ.ati.some(o => !o.done),
    p_i_ahtapot: () => typeof DNZ === 'undefined' || !DNZ.oct || !DNZ.oct.done,
    p_i_vatoz: () => typeof DNZ === 'undefined' || !DNZ.ride || (!DNZ.ride.done && DNZ.ride.faz !== 'inis'),
    p_i_inci: () => typeof DNZ === 'undefined' || !DNZ.pearl || (!DNZ.pearl.done && DNZ.pearl.dnz.faz === 'bekle'),
    p_i_ahtapot_yardim: s => typeof DNZ === 'undefined' || !DNZ.oct || !DNZ.oct.done,   // s: sıradaki cümle (s.o = tetikleyen konuşma nesnesi, s.yer = göl grubu vb.)
    p_merhaba: s => !sesBitmis('p_merhaba', 'cicek') && !sesIleride('p_merhaba', 10, s),
    p_zipla: s => !sesZipladi || !sesIleride('p_zipla', 8, s),   // hiç zıplamadıysa talimat geçerli kalır (5 yaşında: öğrenmesi şart)
    p_uyuyor: s => { const o = (s.o && s.o.konu) || sesSonraki('p_uyuyor', 'pofuduk'), p = gP(); return !(o && (o.uyandi || (p && p.x > o.x + 3 * T))); },
    p_karanlik: s => { const o = s.o && s.o.konu; return !(o ? sesAydinG[o.grup] : sesAydinG.gol) && !sesIleride('p_karanlik', 12, s); },   // Pırıl üflerken de söylenebilir; ışık gelince değil
    p_nilufer: s => { const p = gP(), gl = sesGolAraligi(s.yer || 'gol'); return !p || !gl || (p.x > gl.x0 - 16 * T && p.x < gl.x1 + T); },
    p_minder: s => !sesBitmis('p_minder', 'cicek') && !sesIleride('p_minder', 14, s),
    p_ciftzipla: s => !sesBitmis('p_ciftzipla', 'cicek') && !sesIleride('p_ciftzipla', 13, s),
    p_sakli: s => !gN().some(n => n.tip === 'tohum' && n.done) && !sesIleride('p_sakli', 9, s),
    p_y_pofuduk: s => { const o = (s.o && s.o.konu) || sesSonraki('y_pofuduk', 'pofuduk'), p = gP(); return !(o && (o.uyandi || (p && p.x > o.x + 3 * T))); },
    p_y_hayvan: () => { const h = gN().find(n => n.tip === 'yildizHayvan'); return !(h && (h.hazir || h.bitti || h.firlat)); },
    p_buyuk: () => sesBuyukAsama() < 1,
    p_buyuk_goz: () => sesBuyukAsama() < 2,
    p_buyuk_esne: () => sesBuyukAsama() < 3,
    p_buyuk_kalk: () => { const p = gP(), b = sesBuyuk(); return !sesBuyukZip && !(p && b && p.x > b.x + 2 * T && p.y < b.y - 4 * T); },
    p_agac: () => { const p = gP(); return !!(p && p.ground) && sesSaat() - sesZipT > 2; },   // uçarken değil: tepede durup ağaca dokunmadıysa
    // Bölüm 3: talimatlar yeri geçince / konusu bitince söylenmez
    p_b_zip: s => !sesIleride('b_zip', 12, s),
    p_b_esinti: s => !sesIleride('b_esinti', 12, s),
    p_b_kuzu: () => !(typeof SAYAC !== 'undefined' && SAYAC && SAYAC.kuzu > 0) && !sesKuzuN,
    p_b_tepe: () => !sesGokBasladi,
    p_b_ucus: () => !sesUcusBitti,
    p_b_ucus2: () => sesUcusta() && !(sesSonCal.p_b_selam != null && sesSaat() - sesSonCal.p_b_selam < 8),   // selam az önce söylendiyse uçuş cümlesi atlanır
    p_b_selam: () => sesUcusta() && !(sesSonCal.p_b_ucus2 != null && sesSaat() - sesSonCal.p_b_ucus2 < 4),
    p_b_sekil1: s => sesMiniSuruyor(s) && !sesIleride('b_sekil1', 10, s),
    p_b_sekil2: sesMiniSuruyor,
    p_dost1: () => sesDostUygun(), p_dost2: () => sesDostUygun(), p_dost3: () => sesDostUygun(),
    p_dost_orman: () => sesDostUygun(), p_dost_yildiz: () => sesDostUygun(), p_dost_bulut: () => sesDostUygun(),
  };
  // sert: çalan cümle sürebilir mi? · gecerli: sıradaki cümle şimdi başlayabilir mi? ('' = evet, yoksa neden)
  function sesSert(s) {
    if (anlatici(s.k)) return true;
    const d = typeof DURUM !== 'undefined' ? DURUM : 'oyun';
    if (d === 'final' && s.bas && (s.k === 'p_agac' || ovguMu(s.k))) return true;   // ağaçtaki son cümle bitebilir
    if (d !== 'oyun') return false;
    if (agacYandi()) return s.k === 'p_agac' || ovguMu(s.k);
    return true;
  }
  function sesGecerli(s) {
    if (sesSaat() > s.son) return 'süre doldu';
    if (sesEskidi[sesTaban(s.k)]) return 'olay eskitti';
    const durum = typeof DURUM !== 'undefined' ? DURUM : 'oyun';
    if (s.k === 'p_secim' && durum !== 'baslik') return 'seçim bitti';
    if (/^(a_giris\d|p_(?:[ybivfkcesq]|ip|uz)_uyku)$/.test(s.k) && durum !== 'giris') return 'uyku sahnesi bitti';
    if (/^(?:p|an|a)_uz_/.test(s.k) || s.k === 'p_q_ekmek' || /^p_ip_oyuncak_/.test(s.k)) {
      if (!window.SES14 || !SES14.gecerli(s.k, s.o)) return 'yeni rüya konusu bitti';
    }
    if (s.k === 'p_ip_giris' && (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 13) && (!(durum === 'oyun' || durum === 'giris') || (gP() && gP().x > 95 * T))) return 'ipek girişi bitti';
    if (anlatici(s.k)) return '';
    if (!sesSert(s)) return 'oyun bitti';
    if (agacYandi() && !ovguMu(s.k)) return 'ağaç yandı';
    const o = s.o, p = gP();
    if (/^p_q_(cicek|scooter|bisiklet|kopuk|selam|ucurtmaver|ucurtma|takla|havuz|sayfa|ordek|kayik|botanik|kaplumbaga|buyukgolet|golsicak|gunes|kplkule|sazan)$/.test(s.k) && o && (o.done || (o.tk && o.tk.bitti))) return 'etkinlik bitti';   // Bölüm 12: etkinliği bitti/geçildi
    if (o && p && typeof o.gec === 'number' && p.x > o.gec) return 'yeri geçti (gec)';
    if (o && o.konu && sesKonuBitti(o.konu)) return 'konusu bitti';
    const f = KOSUL[sesTaban(s.k)] || (ses8Komsu(s.k) || /^p_c_sekermi/.test(s.k) ? ses8KapiYakin : null);   // komşu sözü: Feza kapıdan uzaklaştıysa atılır
    if (f) { try { if (!f(s)) return 'yeri geçti'; } catch (e) {} }
    return '';
  }

  // ── çözme / çalma ──
  const sesBuf = {}, sesCoz = {};
  let sesSira = [], sesCalan = null, sesKaynak = null, sesBitisZ = null;
  const sesSoylendi = {}, sesSonCal = {}, SES_AYNI_ARA = 20, tekrarli = k => k === 'p_secim' || /^p_c_sekermi/.test(k) || ovguMu(k) || k === 'p_yol' || /^p_kurtar/.test(k) || /^p_yardim/.test(k);
  let sesOyunIlk = false, sesOncedenDene = 0;
  let sesSonBitis = -1e9, sesSonSure = 0, sesSonOvgu = -1e9, sesOvguGecmis = [], sesYardimN = 0;
  const kayit = [];
  const sesNot = (ne, k, neden) => { kayit.push([+sesSaat().toFixed(2), ne, k, neden || '']); if (kayit.length > 400) kayit.shift(); };

  function sesSure(k) {
    const d = window.VOICE_DUR && VOICE_DUR[k];
    return d || Math.max(1.4, LINES[k].length / (k.startsWith('a_') ? 11.5 : 14) + 0.4);   // kayıt yoksa okuma hızına göre tahmin
  }
  function sesBase64(b64) {
    const s = atob(b64), n = s.length, u = new Uint8Array(n);
    for (let i = 0; i < n; i++) u[i] = s.charCodeAt(i);
    return u.buffer;
  }
  function sesCozumle(k) {     // base64 mp3 → AudioBuffer (Safari'nin eski geri-çağrılı biçimiyle de çalışır)
    if (sesBuf[k]) return Promise.resolve(sesBuf[k]);
    if (sesCoz[k]) return sesCoz[k];
    const ac = typeof AU !== 'undefined' && AU.baglam && AU.baglam();
    if (!ac || !window.VOICE_MP3 || !VOICE_MP3[k]) return Promise.resolve(null);
    return sesCoz[k] = new Promise(res => {
      try {
        const p = ac.decodeAudioData(sesBase64(VOICE_MP3[k]), b => { sesBuf[k] = b; res(b); }, () => res(null));
        if (p && p.then) p.then(b => { sesBuf[k] = b; res(b); }, () => res(null));
      } catch (e) { res(null); }
    }).then(b => { if (!b) delete sesCoz[k]; return b; });
  }
  const sesSesli = k => !SESSIZ && !!(window.VOICE_MP3 && VOICE_MP3[k]);
  function sesBeklemeSuresi(s, bekle) {
    const t = sesSaat();
    if (s.sesBekT != null) s.son += Math.max(0, t - s.sesBekT);
    s.sesBekT = bekle ? t : null;
  }
  function sesGeriBeklet(s, neden) {
    if (sesCalan !== s) return;
    sesCalan = null;
    if (!sesGecerli(s)) {
      s.sesBekT = sesSaat(); s.sesDeneT = sesSaat() + (neden === 'çözme' ? .5 : 0);
      sesSira.unshift(s); sesNot('ses bekle', s.k, neden);
    } else sesNot('at', s.k, sesGecerli(s));
  }
  function sesSiraHazirla(s) {
    if (s.cozBek) return;
    s.cozBek = true;
    sesCozumle(s.k).then(buf => {
      s.cozBek = false;
      if (!sesSira.includes(s)) return;   // sahne değişti veya istek iptal edildi
      if (!buf) {
        s.cozHata = (s.cozHata || 0) + 1;
        s.sesDeneT = sesSaat() + Math.min(8, .5 * Math.pow(2, Math.min(4, s.cozHata - 1)));
        sesNot('ses bekle', s.k, 'çözme');
      } else s.sesDeneT = 0;
      sesTik();
    });
  }
  function sesOnceden() {     // cümleleri boşta önceden çöz (ilk konuşmada gecikme olmasın); bu bölümün cümleleri önce
    if (!window.VOICE_MP3) return;
    const bn = typeof BOLUM_NO !== 'undefined' ? BOLUM_NO : 1, harf = { 2: 'y', 3: 'b', 4: 'i', 5: 'v', 6: 'f', 7: 'k', 8: 'c', 9: 'e', 10: 'z', 11: 's', 12:'q', 13:'ip', 14:'uz' }[bn] || '';
    const baska = k => { if (ses8Komsu(k)) return harf === 'c' ? 0 : 1; if (ses9Aile(k)) return harf === 'e' ? 0 : 1; if (ses11Aile(k)) return harf === 's' ? 0 : 1; const m = /^(?:p|a|an)_([ybivfkcesq]|ip|uz)_/.exec(k); return m && m[1] !== harf ? 1 : 0; };
    // Diğer rüyalar sayfa yenilenerek açılır: onların PCM kayıtlarını bu oturumda
    // çözmek gereksiz iş ve bellektir. Beklenmeyen bir söz yine istenince çözülür.
    const ks = Object.keys(LINES).filter(k => VOICE_MP3[k] && !baska(k));
    let i = 0;
    const adim = () => {
      if (i >= ks.length) return;
      const ac = typeof AU !== 'undefined' && AU.baglam && AU.baglam();
      if (document.hidden || !ac || ac.state !== 'running') { setTimeout(adim, 500); return; }
      sesCozumle(ks[i++]).then(() => setTimeout(adim, 90));
    };
    if (typeof AU !== 'undefined' && AU.baglam && AU.baglam()) adim();
    else if (++sesOncedenDene < 40) setTimeout(sesOnceden, 500);   // ses bağlamı henüz yok: sonra yeniden dene
  }
  function sesOvguSec(k) {     // son çalınan üç övgüyü tekrarlama
    if (k !== 'p_aferin' && !sesOvguGecmis.includes(k)) return k;
    const ks = Object.keys(LINES).filter(x => /^p_aferin\d/.test(x) && !sesOvguGecmis.includes(x));
    return ks.length ? ks[Math.floor(Math.random() * ks.length)] : null;
  }
  // sıralama: sahne > acil > öncelik > eskisi
  const sesSirala = (a, b) => (b.oncelik >= 3) - (a.oncelik >= 3) || b.acil - a.acil || b.oncelik - a.oncelik || a.t - b.t;
  // önceki cümle bittikten sonra ne kadar nefes payı
  function sesAra(s) {
    if (sesOyunIlk) return 0.3;   // bölüm başı: ilk cümle uzun nefes payı beklemesin
    if (ses8Komsu(s.k) || /^p_c_sekermi/.test(s.k)) return 0.3;   // kapı sahnesi: "Şeker mi şaka mı!" → komşunun cevabı arka arkaya
    if (s.oncelik >= 3) return 0.25;
    if (s.acil >= 2) return 0.35;
    if (s.oncelik <= 0) return 0.5;
    if (s.acil >= 1 || sesSonOvgu === sesSonBitis) return 1.0;   // kısa övgüden sonra uzun bekleme gerekmez
    return clamp(1.0 + 0.45 * sesSonSure, 2.5, 4.0);
  }
  function sesIkinciGol(o, ops) {   // istek ikinci gölcük için mi?
    const gr = (o && o.konu && o.konu.grup) || (ops && ops.yer != null ? String(ops.yer) : '');
    if (gr) return gr === 'gol2';
    const g2 = typeof BOLUM !== 'undefined' && Array.isArray(BOLUM.gollar) && BOLUM.gollar[1], p = gP();
    return !!(g2 && p && p.x > g2.x0 - 16 * T && p.x < g2.x1 + 2 * T);
  }
  // olay cümlesi → artık eskimiş talimatlar (oturumda bir kez söylenen talimatlar; tekrarlayanlar – p_uyuyor gibi – KOSUL ile denetlenir)
  const SES_ESKITIR = {  p_buyuk_kalk: ['p_buyuk', 'p_buyuk_goz', 'p_buyuk_esne'], p_y_hayvan_uyan: ['p_y_hayvan'], p_y_bitti: ['p_y_hayvan'],
    p_b_kuzu_ilk: ['p_b_kuzu'], p_cicek_ilk: ['p_merhaba'], p_b_bitti: ['p_b_tepe'],
    p_f_midilli_uyan: ['p_f_midilli'], p_f_halka_bitti: ['p_f_halka_giris', 'p_f_halka'], p_f_kopru: ['p_f_halka'], p_f_final: ['p_f_kopru', 'p_f_fener2'],
    p_k_yavru_uyan: ['p_k_yavru'], p_k_kardan_bitti: ['p_k_kardan_giris', 'p_k_kardan_top'], p_k_kizak_bitti: ['p_k_kizak_giris', 'p_k_kizak'], p_k_final: ['p_k_kizak_bitti', 'p_k_fener2', 'p_k_buz'],
    p_c_kostum_cadi: ['p_c_kostum'], p_c_kostum_kabak: ['p_c_kostum'], p_c_kostum_iskelet: ['p_c_kostum'], p_c_kostum_yarasa: ['p_c_kostum'],
    p_c_hayalet_bul: ['p_c_hayalet'], p_c_kabakyuz_bitti: ['p_c_kabakyuz_giris', 'p_c_kabakyuz_burun', 'p_c_kabakyuz_agiz', 'p_c_kabakyuz_ipucu', 'p_c_kabakyuz_yardim'], p_c_iskelet_bitti: ['p_c_iskelet_giris', 'p_c_iskelet_ipucu', 'p_c_iskelet_yardim'],
    p_c_kazan_bitti: ['p_c_kazan_giris', 'cn_merhaba', 'cn_malzeme'], cn_bitti: ['p_c_kazan_giris', 'cn_merhaba', 'cn_malzeme'],
    p_c_supurge_giris: ['p_c_kazan_bitti', 'cn_bitti'], p_c_supurge_bitti: ['p_c_supurge_giris', 'p_c_supurge', 'p_c_supurge_yardim'], p_c_final: ['p_c_supurge_bitti', 'p_c_fener2', 'p_c_fener_son', 'p_c_hayalet_son', 'p_c_hayalet2'],
    p_e_yavru: ['p_e_yumurta'], p_e_meyve_bitti: ['p_e_meyve_giris', 'p_e_meyve_ipucu', 'p_e_meyve_yardim', 'p_e_meyve_iki'],
    p_e_kanat_bitti: ['p_e_kanat_giris', 'p_e_kanat_ipucu', 'p_e_kanat_yardim', 'fs_merhaba', 'fs_ilk'], fs_ucuyorum: ['p_e_kanat_giris', 'p_e_kanat_ipucu', 'p_e_kanat_yardim', 'fs_merhaba', 'fs_ilk'],
    p_e_kolye_bitti: ['p_e_kolye_giris', 'p_e_kolye_ipucu', 'p_e_kolye_yardim', 'bn_merhaba'], bn_tesekkur: ['p_e_kolye_giris', 'p_e_kolye_ipucu', 'p_e_kolye_yardim', 'bn_merhaba'],
    p_e_binis_giris: ['p_e_kolye_bitti', 'bn_tesekkur', 'bn_davet'], p_e_binis_bitti: ['p_e_binis_giris', 'p_e_binis', 'bn_selam', 'p_e_binis_yardim', 'bn_binis'],
    p_e_final: ['p_e_binis_bitti', 'p_e_pul2', 'p_e_pul_son', 'p_e_yavru2', 'p_e_yavru_son'] }, sesEskidi = {};
  // Bölüm 6: bu cümleler tetikleyici nesne başına değil, oyun başına bir kez (harita konuşma nesnesi + olay aynı cümleyi isteyebilir)
  const SES_TEK = { p_f_fener: 1, p_f_fener2: 1, p_f_midilli: 1, p_f_midilli_uyan: 1, p_f_halka_giris: 1, p_f_halka: 1, p_f_halka_bitti: 1, p_f_kopru: 1, p_f_final: 1,
    p_k_fener: 1, p_k_fener2: 1, p_k_yavru: 1, p_k_yavru_uyan: 1, p_k_geyik: 1, p_k_kardan_giris: 1, p_k_kardan_top: 1, p_k_kardan_bitti: 1, p_k_buz: 1, p_k_kizak_giris: 1, p_k_kizak: 1, p_k_kizak_bitti: 1, p_k_final: 1,
    p_c_kostum: 1, p_c_kostum_cadi: 1, p_c_kostum_kabak: 1, p_c_kostum_iskelet: 1, p_c_kostum_yarasa: 1, p_c_fener: 1, p_c_fener2: 1, p_c_fener_son: 1,
    p_c_hayalet: 1, p_c_hayalet_bul: 1, p_c_hayalet2: 1, p_c_hayalet_son: 1, p_c_kabakyuz_giris: 1, p_c_kabakyuz_burun: 1, p_c_kabakyuz_agiz: 1, p_c_kabakyuz_ipucu: 1, p_c_kabakyuz_bitti: 1, kb_tesekkur: 1, p_c_iskelet_giris: 1, p_c_iskelet_ipucu: 1, p_c_iskelet_yardim: 1, p_c_iskelet_bitti: 1, cn_puf: 1,
    p_c_sokak: 1, p_c_kazan_giris: 1, p_c_kazan_bitti: 1, p_c_supurge_giris: 1, p_c_supurge: 1, p_c_supurge_yardim: 1, p_c_supurge_bitti: 1, p_c_final: 1, cn_merhaba: 1, cn_malzeme: 1, cn_bitti: 1,
    p_e_pul: 1, p_e_pul2: 1, p_e_pul_son: 1, p_e_yumurta: 1, p_e_yavru: 1, p_e_yavru2: 1, p_e_yavru_son: 1, p_e_meyve_giris: 1, p_e_meyve_ipucu: 1, p_e_meyve_yardim: 1, p_e_meyve_iki: 1, p_e_meyve_bitti: 1,
    p_e_kanat_giris: 1, p_e_kanat_ipucu: 1, p_e_kanat_yardim: 1, p_e_kanat_bitti: 1, p_e_kolye_giris: 1, p_e_kolye_ipucu: 1, p_e_kolye_yardim: 1, p_e_kolye_bitti: 1,
    p_e_binis_giris: 1, p_e_binis: 1, p_e_binis_yardim: 1, p_e_binis_bitti: 1, p_e_final: 1,
    bn_merhaba: 1, bn_pul_yuvarlak: 1, bn_pul_yildiz: 1, bn_pul_kalp: 1, bn_pul_damla: 1, bn_pul_ay: 1, bn_tesekkur: 1, bn_davet: 1, bn_binis: 1, bn_selam: 1, bn_hediye: 1,
    ea_merhaba: 1, ea_kucak: 1, eb_merhaba: 1, eb_dans: 1, fs_merhaba: 1, fs_ilk: 1, fs_ucuyorum: 1, fs_tesekkur: 1 };
  Object.assign(SES_TEK, { p_ip_giris:1, p_ip_kopru:1, p_ip_koprubitti:1, p_ip_minder:1, p_ip_kelebek:1, p_ip_perde:1, p_ip_binis:1, p_ip_final:1, p_ip_gok:1 });
  for (const k of Object.keys(LINES)) if (/^(?:p|an|a)_uz_/.test(k) || k === 'p_q_ekmek' || /^p_ip_oyuncak_/.test(k)) SES_TEK[k] = 1;
  Object.assign(SES_SAHNE, { p_uz_uyku:1, p_uz_giris:1, p_uz_sabah:1 });
  const SES_KURTAR = ['p_kurtar', 'p_kurtar1', 'p_kurtar2', 'p_kurtar3', 'p_kurtar4'], sesKurtarGec = [];
  const sesB2 = () => typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 2;
  const sesB3 = () => typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 3;
  let sesYildizBekle = false, sesYildizGec = false;
  function soyle(k, ops) {
    if (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 4 && k === 'p_i_ahtapot') {
      setTimeout(() => { if (typeof DNZ !== 'undefined' && DNZ.oct && !DNZ.oct.done && DURUM === 'oyun') soyle('p_i_ahtapot_yardim', { oncelik: 3 }); }, 4500);
    }
    if (/^an_q_/.test(k)) return;   // Bölüm 12: anne konuşmaz (ebeveynin isteği); eski/başka dosyadan gelen anne cümlesi çalınmaz
    if (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 14) {
      if (/^a_(?:(?:y|b|i|v|f|k|c|e|s|q|ip)_)?final1$/.test(k)) k = typeof V14 !== 'undefined' && V14.reunited ? 'a_uz_final1' : 'a_uz_final1_dost';
      else if (/^a_(?:(?:y|b|i|v|f|k|c|e|s|q|ip)_)?final[23]$/.test(k)) k = 'a_uz_final' + k.slice(-1);
      else if (k === 'p_y_uyku') k = 'p_uz_uyku';
      else if (k === 'p_y_giris' || k === 'p_uyan') k = 'p_uz_giris';
      else if (/^p_dost/.test(k) || k === 'p_yol') return;
    }
    if(typeof BOLUM_NO!=='undefined' && BOLUM_NO===12) {
      if (/^a_(y_|b_|i_|v_|f_|k_|c_|e_|s_)?final1$/.test(k)) k='a_q_final1';
      else if (/^a_(y_|b_|i_|v_|f_|k_|c_|e_|s_)?final[23]$/.test(k)) return;
      else if(k==='p_y_uyku') k='p_q_uyku';
      else if(k==='p_y_giris' || k==='p_uyan') k='p_q_giris';
      else if(k==='p_dost_orman') return;
    }
    if (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 13) {
      if (/^a_(?:y_|b_|i_|v_|f_|k_|c_|e_|s_|q_)?final[123]$/.test(k)) k = 'a_ip_final' + k.slice(-1);
      else if (k === 'p_y_uyku') k = 'p_ip_uyku';
      else if (k === 'p_y_giris' || k === 'p_uyan') k = 'p_ip_giris';
      else if (/^p_dost/.test(k)) return;
    }
    const ko = k;   // çağıranın verdiği ad (konuşma tetikleyicisi anahtarı)
    if (/^[ybivfkces]_/.test(k) && LINES['p_' + k]) k = 'p_' + k;                   // Bölüm tetikleyicileri: 'y_gol' → 'p_y_gol', 'v_mini' → 'p_v_mini', 'f_fener' → 'p_f_fener'
    if (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 11) {   // Ay Işığı Şatosu: sahne/CORE ortak adları çağırırsa Bölüm 11 cümlesi
      if (/^a_(y_|b_|i_|v_|f_|k_|c_|e_|z_)?final\d$/.test(k)) k = 'a_s_final' + k.slice(-1);
      else if (k === 'p_y_uyku') k = 'p_s_uyku';
      else if (k === 'p_y_giris' || k === 'p_uyan') k = 'p_s_giris';
      if (ses11Aile(k) && typeof V11 !== 'undefined' && V11 && V11.final && !(ops && ops.oncelik != null)) ops = Object.assign({}, ops, { oncelik: 3 });
    }

    if (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 9) {   // Ejderha Vadisi: sahne/CORE ortak adları çağırırsa Bölüm 9 cümlesi
      if (/^a_(y_|b_|i_|v_|f_|k_|c_)?final\d$/.test(k)) k = 'a_e_final' + k.slice(-1);
      else if (k === 'p_y_uyku') k = 'p_e_uyku';
      else if (k === 'p_y_giris' || k === 'p_uyan') k = 'p_e_giris';
      // yuvadaki şölende ailenin sözleri sahne cümlesi gibi sırada bekler (anlatıcının ardından), atılmaz
      if (ses9Aile(k) && typeof V9 !== 'undefined' && V9 && V9.final && !(ops && ops.oncelik != null)) ops = Object.assign({}, ops, { oncelik: 3 });
    }
    if (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 8) {   // Balkabağı Gecesi: sahne/CORE ortak adları çağırırsa Bölüm 8 cümlesi
      if (/^a_(y_|b_|i_|v_|f_|k_)?final\d$/.test(k)) k = 'a_c_final' + k.slice(-1);
      else if (k === 'p_y_uyku') k = 'p_c_uyku';
      else if (k === 'p_y_giris' || k === 'p_uyan') k = 'p_c_giris';
      else if (k === 'p_c_sekermi') { if (!ses8KapiYeni(ops && ops.o)) return; k = SES8_SEKERMI[ses8SekerN++ % SES8_SEKERMI.length]; }   // kapı başına bir kez; üç çeşit (aynı tören, başka neşe)
    }
    if (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 7) {   // Kuzey Işıkları: sahne/CORE ortak adları çağırırsa Bölüm 7 cümlesi
      if (/^a_(y_|b_|i_|v_|f_)?final\d$/.test(k)) k = 'a_k_final' + k.slice(-1);
      else if (k === 'p_y_uyku') k = 'p_k_uyku';
      else if (k === 'p_y_giris' || k === 'p_uyan') k = 'p_k_giris';
    }
    if (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 6) {   // Şenlik Kalesi: sahne/CORE ortak adları çağırırsa Bölüm 6 cümlesi
      if (/^a_(y_|b_|i_|v_)?final\d$/.test(k)) k = 'a_f_final' + k.slice(-1);
      else if (k === 'p_y_uyku') k = 'p_f_uyku';
      else if (k === 'p_y_giris' || k === 'p_uyan') k = 'p_f_giris';
    }
    if (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 5) {
      if (/^a_(y_|b_|i_)?final\d$/.test(k)) k = 'a_v_final' + k.slice(-1);
      else if (k === 'p_y_uyku') k = 'p_v_uyku';
      else if (k === 'p_y_giris' || k === 'p_uyan') k = 'p_v_giris';
    }
    if (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 4) {
      if (/^a_(y_|b_)?final\d$/.test(k)) k = 'a_i_final' + k.slice(-1);
      else if (k === 'p_y_uyku') k = 'p_i_uyku';
      else if (k === 'p_y_giris' || k === 'p_uyan') k = 'p_i_giris';
      else if (k === 'p_y_bitti') k = 'p_i_bitti';
    }
    if (sesB3()) {   // Bölüm 3: sahne/CORE Bölüm 2 adlarını çağırırsa da Bölüm 3 cümlesi söylenir
      if (/^a_(y_)?final\d$/.test(k) && LINES['a_b_final' + k.slice(-1)]) k = 'a_b_final' + k.slice(-1);
      else if (k === 'p_y_uyku') k = 'p_b_uyku';
      else if (k === 'p_y_giris') k = 'p_b_giris';
      else if (k === 'p_y_bitti') k = 'p_b_bitti';
    }
    if (/^a_final\d$/.test(k) && sesB2() && LINES['a_y_' + k.slice(2)]) k = 'a_y_' + k.slice(2);   // Bölüm 2 final anlatıcısı
    if (k === 'p_sarki1' && sesB2()) k = 'p_y_sarki';                       // Bölüm 2: yıldız şarkısı cümlesi
    if (k === 'p_y_yildiz' && !sesYildizGec && !(typeof SAYAC !== 'undefined' && SAYAC.yildiz > 0)) { sesYildizBekle = true; return; }   // "yıldız uyanıyor": ilk yıldız gerçekten uyanınca (tetikleyici önceden de çağırabilir)
    if (k === 'p_aferin' || ovguMu(k)) k = sesOvguSec(k);
    if (k === 'p_yardim') k = 'p_yardim' + (1 + (sesYardimN++ % 2));
    if (/^p_kurtar\d?$/.test(k)) {   // kurtarma: en az 30 sn arayla, 5 çeşitten son ikisini tekrarlamadan (dağınık oynayan çocukta aynı cümle dönmesin)
      const son = Math.max(...SES_KURTAR.map(x => sesSonCal[x] != null ? sesSonCal[x] : -1e9));
      if (sesSaat() - son < 30) { sesNot('at', k, 'kurtar sık'); return; }
      const ad = SES_KURTAR.filter(x => LINES[x] && !sesKurtarGec.includes(x));
      k = sesKurtarGec.length ? ad[Math.floor(Math.random() * ad.length)] : 'p_kurtar';
      sesKurtarGec.push(k); if (sesKurtarGec.length > 2) sesKurtarGec.shift();
    }
    if (!k || !LINES[k]) return;
    const t = sesSaat(), b = sesBilgi(k);
    let oncelik = b.oncelik, omur = b.omur;
    if (ops && ops.oncelik != null) {
      if (ops.oncelik >= 3) { oncelik = 3; omur = 1e9; }
      else if (ops.oncelik <= 0 && !ovguMu(k)) { oncelik = Math.min(oncelik, 1); omur = Math.min(omur, 3); }
    }
    if (ovguMu(k) && t - sesSonOvgu < 12) { sesNot('at', k, 'övgü sık'); return; }
    const o = (ops && ops.o) || (anlatici(k) || ovguMu(k) ? null : sesTetikBul(ko) || (ko !== k ? sesTetikBul(k) : null));
    if ((k === 'p_karanlik' || k === 'p_nilufer') && sesIkinciGol(o, ops)) k = k + '2';   // ikinci gölcükte yeni cümle
    if ((sesCalan && sesCalan.k === k) || sesSira.some(s => s.k === k)) return;   // aynı cümle zaten sırada
    if (SES_TEK[k] && sesSoylendi[k]) return;
    // talimatlar/tepkiler bir kez — ama tetikleyici nesne başına (iki göl, iki uyuyan Pofuduk), oyun başına değil
    const yer = o ? 'o' + (o.id != null ? o.id : Math.round(o.x)) : (ops && ops.yer != null ? String(ops.yer) : '');
    const tek = yer ? k + '@' + yer : k;
    if (!tekrarli(k)) {
      if (sesSoylendi[tek] || (!yer && sesSoylendi[k])) return;
      if (sesSonCal[k] != null && t - sesSonCal[k] < SES_AYNI_ARA) { sesNot('at', k, 'aynısı az önce'); return; }   // seyrek kalsın
    }
    const s = { k, oncelik, acil: oncelik >= 3 ? 0 : b.acil, konu: b.konu, t, son: t + omur, kez: 0, bas: 0, sure: sesSure(k), o, yer, tek };
    if (SES_MINI_ALAN[k]) s.mini = sesMiniNesne(k);   // başka bir etkinlik eski talimatı yeniden geçerli kılmasın
    // aynı konudaki eski cümleler geçersiz (yalnız en yeni aşama söylenir)
    if (s.konu) {
      const ks = KONU_SIRA[k] || 9;
      sesSira = sesSira.filter(q => { const eski = q.konu === s.konu && (KONU_SIRA[q.k] || 0) <= ks; if (eski) sesNot('at', q.k, 'yenisi geldi: ' + k); return !eski; });
    }
    for (const e of (SES_ESKITIR[k] || [])) sesEskidi[e] = 1;   // bu olay cümlesi gelince eski talimat bir daha söylenmez
    sesSira.push(s);
    sesNot('sira', k);
    sesCozumle(k);
    // acil cümle: çalan oyun cümlesini gerekirse yumuşakça kes
    const c = sesCalan;
    if (c && s.acil >= 2 && c.oncelik < 3 && c.acil < 2) {
      const kalan = Math.max(0, c.sure - sesGecen(c));
      const eskidi = (c.konu && c.konu === s.konu) || !!sesGecerli(Object.assign({}, c, { son: 1e9 }));
      if (kalan > SES_BEKLE && !eskidi && c.oncelik === 2 && c.acil === 0 && !c.kez && !sesKritikMi(c)) {   // kesilecek talimat sonra bir kez daha söylenir
        sesSira.push(Object.assign({}, c, { t, son: t + 12, kez: 1, bas: 0, kesZ: 0 })); sesNot('sira', c.k, 'kesilecek, yeniden');
      }
      sesYumusakKes(eskidi ? 'eskidi: ' + k : 'araya girdi: ' + k, s);
    } else if (c && s.acil >= 1 && c.oncelik < 3 && c.acil < 1) {
      // olay tepkisi (taze haber) geldi: çalan talimat cümle sonunda susar. Konusu bittiyse (ör. "üstüne zıpla" derken Pofuduk uyandı) bir daha
      // söylenmez; bitmediyse ve uzunsa sonra bir kez yeniden sıraya girer.
      const kalan = Math.max(0, c.sure - sesGecen(c)), bitti = !!(c.o && c.o.konu && sesKonuBitti(c.o.konu)) || !!sesGecerli(Object.assign({}, c, { son: 1e9 }));
      if (kalan > SES_BEKLE && !bitti && c.oncelik === 2 && !c.kez && !ovguMu(c.k) && !sesKritikMi(c)) { sesSira.push(Object.assign({}, c, { t, son: t + 12, kez: 1, bas: 0, kesZ: 0 })); sesNot('sira', c.k, 'kesilecek, yeniden'); }
      sesYumusakKes((bitti ? 'eskidi: ' : 'olay: ') + k, s);
    } else if (c && oncelik >= 3 && c.oncelik < 3) sesYumusakKes('sahne', s);   // anlatıcı/sahne cümlesi gelirse oyun cümlesi cümle sonunda susar
    sesTik();
  }
  // Kesme kuralı (QA): hiçbir cümle sözcük ortasında kesilmez. Çalanın ≤3 sn'si kaldıysa biter, yeni cümle sırada bekler (ömrü bekleme kadar uzar:
  // taze haber geç kalmaz). Daha uzunsa çalan cümle bir sonraki CÜMLE SONUNDA (kayıttaki gerçek nefes boşluğu) yumuşakça susar.
  const SES_BEKLE = 3.0, sesSinir = {};
  function sesCumleSinirlari(c) {   // cümle sonları: kayıttaki ≥0,25 sn'lik sessizliklerin ortası (sn, cümle başından)
    const k = c.k; if (sesSinir[k]) return sesSinir[k];
    const buf = sesBuf[k], r = [];
    if (buf) {
      const d = buf.getChannelData(0), sr = buf.sampleRate, w = Math.max(1, Math.round(sr * 0.02)); let pk = 0;
      for (let i = 0; i < d.length; i += 4) { const a = Math.abs(d[i]); if (a > pk) pk = a; }
      const esik = pk * 0.03; let bas = -1;
      for (let i = 0; i + w <= d.length; i += w) {
        let m = 0; for (let q = i; q < i + w; q += 2) { const a = Math.abs(d[q]); if (a > m) m = a; }
        if (m < esik) { if (bas < 0) bas = i; }
        else { if (bas >= 0 && (i - bas) / sr >= 0.25 && bas > sr * 0.3) r.push((bas + i) / 2 / sr); bas = -1; }
      }
    } else {   // kayıt yoksa (sessiz mod): noktalama oranından tahmin
      const L = LINES[k] || '';
      for (let i = 0; i < L.length - 2; i++) if (/[.!?]/.test(L[i]) && L[i + 1] === ' ') r.push((i + 1) / L.length * c.sure + 0.15);
    }
    if (buf) sesSinir[k] = r;   // tahmin önbelleğe alınmaz: kayıt çözülünce gerçeği ölçülür
    return r;
  }
  // Kritik talimatlar (QA turu 2): olay cümlesi gelse de sonuna kadar söylenir, gelen cümle bekler. "Üç çiçeğe dokun" Büyük Pofuduk'un ilk
  // aşamalarında hâlâ geçerli (yalnız uyanınca biter); kontrol öğreten cümleler hâlâ geçerliyse tamamlanır.
  const SES_KRITIK = {
    p_buyuk: () => sesBuyukAsama() < 3 && !sesSirada('p_buyuk_kalk') && !sesSirada('p_agac'),   // Büyük Pofuduk kalktıysa talimat eskidi
    p_merhaba: c => sesHalaGecerli(c), p_zipla: c => sesHalaGecerli(c), p_ciftzipla: c => sesHalaGecerli(c),
    p_minder: c => sesHalaGecerli(c) && !sesBitmis('p_minder', 'pofuduk'),                          // minder Pofuduk'a zıpladıysa bitti
    p_y_hayvan: c => sesHalaGecerli(c) && !sesSirada('p_y_hayvan_uyan') && !sesSirada('p_y_bitti'),  // "hepsine dokun" – kaplumbağa uyandıysa bitti
    p_i_yuz: c => sesHalaGecerli(c), p_i_ahtapot_yardim: c => sesHalaGecerli(c),
    p_takim1: () => true, p_takim2: () => true,
  };
  const sesSirada = k => sesSira.some(q => q.k === k);
  const sesHalaGecerli = c => !sesGecerli(Object.assign({}, c, { son: 1e9 }));
  function sesKritikMi(c) { if (!c || !SES_KRITIK[c.k]) return false; try { return !!SES_KRITIK[c.k](c); } catch (e) { return false; } }
  function sesGecen(c) {
    // Telefon/sekme kesintisinde duvar saati ilerler, duyulan kaydın saati durur.
    if (sesCalan === c && sesKaynak && Number.isFinite(c.sesBas)) return Math.max(0, sesKaynak.ac.currentTime - c.sesBas);
    return c.bas ? Math.max(0, sesSaat() - c.bas) : 0;
  }
  function sesSinirdaKes(c, sinir, neden) {
    if (sesCalan !== c) return;
    const kalan = sinir - sesGecen(c);
    if (document.hidden || (sesKaynak && sesKaynak.ac.state !== 'running') || kalan > 0.015) {
      const bekle = document.hidden || (sesKaynak && sesKaynak.ac.state !== 'running') ? 250 : Math.max(30, Math.min(250, kalan * 1000));
      c.kesZ = setTimeout(() => sesSinirdaKes(c, sinir, neden), bekle);
      return;
    }
    c.kesZ = null;
    sesKes(neden + ' (cümle sonunda)');
  }
  function sesYumusakKes(neden, s, zorla) {
    const c = sesCalan; if (!c) return;
    const t = sesSaat(), kalan = Math.max(0, c.sure - sesGecen(c));
    let ne = kalan;   // yeni cümle en geç ne zaman başlayabilir
    const kritik = !zorla && sesKritikMi(c);
    if (kalan > SES_BEKLE && !kritik) {
      const simdi = sesGecen(c), b = sesCumleSinirlari(c).find(x => x > simdi + 0.05 && x < c.sure - 0.6);
      if (b != null) {
        ne = b - simdi;
        if (!c.kesZ) c.kesZ = setTimeout(() => sesSinirdaKes(c, b, neden), Math.max(0, ne * 1000));
      } else if (zorla) { sesKes(neden); return; }   // oyun bitti ve cümle sonu yok: yumuşakça sus
    }
    if (s) s.son = Math.max(s.son, t + ne + 2.5);
    sesNot('bekle', s ? s.k : '', c.k + ' ' + ne.toFixed(1) + ' sn');
  }
  function sesKes(neden) {
    if (sesCalan) sesNot('kes', sesCalan.k, neden);
    if (sesKaynak) {
      try {
        const now = sesKaynak.ac.currentTime;
        if (sesKaynak.ac.state !== 'running') {
          // Askıdaki saat ilerlemez: geleceğe stop koymak dönüşte eski sözü sızdırır.
          sesKaynak.s.stop(now);
          if (sesKaynak.s.disconnect) sesKaynak.s.disconnect();
          if (sesKaynak.g.disconnect) sesKaynak.g.disconnect();
        } else {
          sesKaynak.g.gain.cancelScheduledValues(now);
          sesKaynak.g.gain.setValueAtTime(Math.max(0.0001, sesKaynak.g.gain.value), now);
          sesKaynak.g.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
          sesKaynak.s.stop(now + 0.05);
        }
      } catch (e) {}
    }
    sesBitti();
  }
  function sesBitti() {
    if (sesBitisZ) { clearTimeout(sesBitisZ); sesBitisZ = null; }
    if (sesCalan) { if (sesCalan.kesZ) clearTimeout(sesCalan.kesZ); sesSonBitis = sesSaat(); if (ovguMu(sesCalan.k)) sesSonOvgu = sesSonBitis; sesSonSure = clamp(sesGecen(sesCalan), 0, sesCalan.sure); }
    sesCalan = null; sesKaynak = null;
    if (typeof AU !== 'undefined' && AU.kis) AU.kis(false);
    sesTik();
  }
  // her 0,1 sn: çalanı denetle; sıradakini, nefes payı dolunca başlat
  function sesTik() {
    const baglam = typeof AU !== 'undefined' && AU.baglam && AU.baglam();
    const hazir = !document.hidden && baglam && baglam.state === 'running';
    // Kilitli ses cümleyi sessizlikte tüketmesin. Yer/konu/sahne koşulları yine denetlenir.
    for (const s of sesSira) if (sesSesli(s.k)) sesBeklemeSuresi(s, !hazir);
    if (document.hidden) return;
    if (sesCalan) { if (!sesSert(sesCalan) && !sesCalan.bitti) { sesCalan.bitti = 1; sesYumusakKes('oyun bitti', null, true); } return; }
    if (!sesSira.length) return;
    sesSira = sesSira.filter(s => { const n = sesGecerli(s); if (n) sesNot('at', s.k, n); return !n; });
    if (!sesSira.length) return;
    sesSira.sort(sesSirala);
    let i = -1;
    for (let j = 0; j < sesSira.length; j++) {
      const aday = sesSira[j];
      if (aday.sesDeneT && sesSaat() < aday.sesDeneT) continue;
      if (sesSesli(aday.k)) {
        if (!baglam) continue;
        if (!sesBuf[aday.k]) { sesSiraHazirla(aday); continue; }
        if (!hazir) continue;
      }
      if (sesSaat() < sesSonBitis + sesAra(aday)) continue;
      i = j; break;
    }
    if (i < 0) return;
    const s = sesSira.splice(i, 1)[0];
    sesBaslat(s);
  }
  function sesBaslat(s) {
    sesCalan = s;
    sesCozumle(s.k).then(buf => {
      if (sesCalan !== s) return;
      if (document.hidden) { sesGeriBeklet(s, 'kilitli'); return; }
      const gecersiz = sesGecerli(s);
      if (gecersiz) { sesNot('at', s.k, gecersiz); sesCalan = null; sesTik(); return; }
      let ac = null;
      if (sesSesli(s.k)) {
        ac = typeof AU !== 'undefined' && AU.baglam && AU.baglam();
        if (!buf || !ac || ac.state !== 'running') { sesGeriBeklet(s, !buf ? 'çözme' : 'kilitli'); return; }
      }
      const sure = buf ? buf.duration : sesSure(s.k);
      const kim = sesKim(s.k);
      let sesSonu = 0;
      if (ac) {
        try {
          const src = ac.createBufferSource(), gg = ac.createGain();
          src.buffer = buf;
          const hedefG = kim === 'a' ? 1.0 : 0.95, tStart = ac.currentTime + 0.12;
          gg.gain.value = 0.0001;
          gg.gain.setValueAtTime(0.0001, tStart);
          gg.gain.exponentialRampToValueAtTime(hedefG, tStart + 0.04);
          src.connect(gg); gg.connect(AU.sesCikis());
          AU.kis(true, kim);
          src.start(tStart);   // müzik önce kısılsın
          s.sesBas = tStart;
          sesKaynak = { s: src, g: gg, ac };
          sesSonu = tStart + sure + .3;
          src.onended = () => { if (sesCalan === s) sesBitti(); };
        } catch (e) { if (typeof AU !== 'undefined' && AU.kis) AU.kis(false); sesGeriBeklet(s, 'başlatma'); return; }
      }
      sesOyunIlk = false;
      s.sure = sure; s.bas = sesSaat() + 0.12;
      sesSoylendi[s.k] = 1; if (s.tek) sesSoylendi[s.tek] = 1; sesSonCal[s.k] = sesSaat();
      if (ovguMu(s.k)) { sesSonOvgu = sesSaat(); sesOvguGecmis.push(s.k); if (sesOvguGecmis.length > 3) sesOvguGecmis.shift(); }
      sesNot('cal', s.k, (s.bas - s.t).toFixed(1) + ' sn bekledi');
      if (typeof ARAYUZ !== 'undefined' && ARAYUZ.altyazi) ARAYUZ.altyazi(LINES[s.k], sure + 0.6, kim);
      OLAY.emit('konusma', { anahtar: s.k, kim, sure });
      // yedek zamanlayıcı (onended gelmezse / sessiz modda)
      const bitis = () => {
        if (sesCalan !== s) return;
        if (ac && (ac.state !== 'running' || ac.currentTime < sesSonu)) { sesBitisZ = setTimeout(bitis, 250); return; }
        sesBitti();
      };
      sesBitisZ = setTimeout(bitis, (sure + (ac ? 0.6 : 0.12)) * 1000);
    });
  }
  setInterval(sesTik, 100);
  // Arka planda zamanlayıcılar tamamen durabilir; bekleme süresini gizlenme
  // anında işaretle ki geri dönülen ilk karede talimat eskimiş sayılmasın.
  document.addEventListener('visibilitychange', sesTik);
  OLAY.on('sesHazir', () => { for (const s of sesSira) s.sesDeneT = 0; sesTik(); });

  // oyun olaylarından durum
  OLAY.on('aydinlat', g => { sesAydinG[g || 'gol'] = true; });
  OLAY.on('buyukAsama', v => { if (v && v.asama) sesAsama = Math.max(sesAsama, v.asama); });
  OLAY.on('uyandi', o => { if (o && o.tip === 'buyukPofuduk') sesAsama = 3; });
  // Büyük Pofuduk Feza'yı tepeye fırlatınca yıldız izi onu çoğu zaman ağaca kendisi götürür: uçarken "ağaca dokun" deme.
  // ~2 sn sonra hâlâ tepede durup ağaca dokunmadıysa söyle.
  OLAY.on('ziplatti', o => {
    if (!(o && o.tip === 'buyukPofuduk' && o.uyandi)) return;
    sesBuyukZip = true; sesZipT = sesSaat();
    setTimeout(() => { const p = gP(); if (!agacYandi() && p && p.ground && (typeof DURUM === 'undefined' || DURUM === 'oyun')) soyle('p_agac'); }, 2200);
  });
  // Bölüm 2 olayları (yildiz.js): ilk yıldız uyanınca / birkaç yıldız yerleşince / hayvan uyanınca / gökyüzü dolunca Pırıl konuşur
  let sesYerlesen = 0;
  OLAY.on('yildiz', o => { if (sesYildizBekle && !(o && (o.hayvan || /hayvan/i.test(o.tip || '')))) { sesYildizBekle = false; sesYildizGec = true; soyle('p_y_yildiz'); } });
  OLAY.on('yildizYerlesti', () => { if (++sesYerlesen === 5) soyle('p_y_yildiz2'); });
  OLAY.on('hayvanHazir', () => soyle('p_y_hayvan_uyan'));
  OLAY.on('hayvanUyandi', () => soyle('p_y_bitti', { oncelik: 3 }));
  // Bölüm 3 olayları (kuzu.js, ucus.js, bulut.js, sekil.js): ilk kuzucuk renklenince / uçuşta / gökkuşağı başlayınca Pırıl konuşur.
  // Övgü ara sıra: ilk kuzucukta değil (onun kendi cümlesi var), sonrakilerde ~üçte bir (ses.js övgü aralığı ayrıca ≥12 sn).
  let sesKuzuN = 0, sesKuzuOvgu = 0, sesGokBasladi = false, sesUcusBitti = false, sesUcusOlay = false;
  const sesUcusta = () => sesUcusOlay || !!(gP() && gP().ucus);
  OLAY.on('kuzu', () => {
    sesKuzuN++;
    if (sesKuzuN === 1) { soyle('p_b_kuzu_ilk'); return; }
    if (sesKuzuN >= 7) return;   // son kuzucukta gökkuşağı/tepe cümleleri gelecek
    const sans = sesKuzuN - sesKuzuOvgu >= 3 ? 0.7 : 0.3;   // uzun süre övgü olmadıysa biraz daha olası
    if (Math.random() < sans) setTimeout(() => { if (!sesCalan && !sesSira.length) { sesKuzuOvgu = sesKuzuN; soyle('p_aferin'); } }, 900);
  });
  OLAY.on('ucusBasla', () => {
    sesUcusOlay = true; soyle('p_b_ucus');
    setTimeout(() => { if (sesUcusta()) soyle('p_b_ucus2'); }, 11000);   // uçuşun ortasında bir sevinç cümlesi
  });
  OLAY.on('ucusBitti', () => { sesUcusOlay = false; sesUcusBitti = true; });
  OLAY.on('isilGel', () => soyle('a_is_gel', { oncelik: 3 }));
  OLAY.on('isilBin', () => soyle('a_is_bin', { oncelik: 3 }));
  OLAY.on('isilInis', () => setTimeout(() => soyle('a_is_in', { oncelik: 3 }), 1200));
  OLAY.on('gokkusagiBasla', () => { sesGokBasladi = true; soyle('p_b_bitti', { oncelik: 3 }); });
  OLAY.on('sekil', e => { if (!(e && e.hayvan === 'feza')) setTimeout(() => soyle('p_b_sekil3'), 1200); });   // Feza şeklinde sekil.js 'p_b_sekil4' der; söylendiyse tekrar edilmez
  // Uzun sessizlikte küçük dostça sözler (en çok 3 kez, en az 90 sn arayla; Feza oynarken, uçuş/sahne dışında, kimse konuşmuyorken)
  OLAY.on('durum', d => { sesOyunIlk = d === 'oyun'; });   // oyuna girilince ilk cümle çalınca (sesBaslat) kapanır
  let sesDostN = 0, sesDostT = -1e9, sesHareketT = sesSaat(), sesOyunT = -1e9;
  OLAY.on('durum', d => { if (d === 'oyun' && sesOyunT < 0) sesOyunT = sesSaat(); });
  function sesDostUygun() {
    const p = gP(), d = typeof DURUM !== 'undefined' ? DURUM : '';
    return d === 'oyun' && !!p && !p.ucus && !(p.kilit > 0) && sesSaat() - sesSonBitis > 40 && sesSaat() - sesHareketT < 4;
  }
  setInterval(() => {
    const p = gP();
    if (p && Math.abs(p.vx || 0) > 40) sesHareketT = sesSaat();
    if (sesDostN >= 3 || sesCalan || sesSira.length || sesOyunT < 0) return;
    const t = sesSaat();
    if (t - sesOyunT < 60 || t - sesDostT < 90 || t - sesSonBitis < 50 || !sesDostUygun()) return;
    const bolum = typeof BOLUM_NO !== 'undefined' ? BOLUM_NO : 1;
    const ozel = bolum === 11 ? 'p_dost_sato' : bolum === 9 ? 'p_dost_ejder' : bolum === 8 ? 'p_dost_cadi' : bolum === 7 ? 'p_dost_kar' : bolum === 6 ? 'p_dost_senlik' : bolum === 5 ? 'p_dost_volkan' : bolum === 4 ? 'p_dost_deniz' : bolum === 3 ? 'p_dost_bulut' : bolum === 2 ? 'p_dost_yildiz' : 'p_dost_orman';
    const aday = [ozel, 'p_dost1', 'p_dost2', 'p_dost3'].filter(k => LINES[k] && !sesSoylendi[k]);
    if (!aday.length) return;
    const k = sesDostN === 0 ? aday[0] : aday[Math.floor(Math.random() * aday.length)];
    sesDostN++; sesDostT = t; soyle(k);
  }, 2000);
  // seçim ekranı (DURUM 'baslik'): "Bu gece nereye gidelim?" ilk açılışta 1 kez; sonra yalnız ~25 sn hiç dokunulmazsa 1 kez daha
  let sesSecimN = 0, sesSecimT = 0;
  OLAY.on('denizati', () => { if (typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 4) soyle('p_i_denizati_ilk', { oncelik: 2 }); });
  // ── Bölüm 6 (Şenlik Kalesi) olayları (senlik.js, midilli.js, halka.js): ilk fener / yarısı, ilk uyuyan midilli görülünce, uyanınca,
  // halka yolculuğu başı / yarısı / sonu, köprü, avlu. Övgü ara sıra (sonraki fener/midillilerde ~üçte bir; övgü aralığı ayrıca ≥12 sn).
  const sesB6 = () => typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 6;
  let sesFenerN = 0, sesMidilliN = 0, sesF6Ovgu = 0;
  const sesF6Ovgu_ = () => { if (++sesF6Ovgu % 3 === 0 || Math.random() < 0.2) setTimeout(() => { if (!sesCalan && !sesSira.length) soyle('p_aferin'); }, 900); };
  OLAY.on('fener', () => {
    if (!sesB6()) return;   // Bölüm 1 finalindeki Pofuduk fenerleri değil
    sesFenerN++;
    const top = (typeof SAYAC !== 'undefined' && SAYAC.fenerTop) || (typeof V6 !== 'undefined' && V6.fenerTop) || 12;
    if (sesFenerN === 1) soyle('p_f_fener');
    else if (sesFenerN === Math.ceil(top / 2)) soyle('p_f_fener2');
    else if (sesFenerN > 2) sesF6Ovgu_();
  });
  OLAY.on('midilliUyandi', () => {
    if (!sesB6()) return;
    if (++sesMidilliN === 1) soyle('p_f_midilli_uyan'); else sesF6Ovgu_();
  });
  OLAY.on('halkaBasla', () => { if (sesB6()) soyle('p_f_halka_giris'); });
  OLAY.on('halka', e => {
    if (!sesB6()) return;
    const n = e && isFinite(e.n) ? e.n : (typeof SAYAC !== 'undefined' ? SAYAC.halka : 0), top = (typeof SAYAC !== 'undefined' && SAYAC.halkaTop) || 8;
    if (n === Math.ceil(top / 2)) soyle('p_f_halka');
  });
  OLAY.on('halkaBitti', () => { if (sesB6()) soyle('p_f_halka_bitti'); });
  OLAY.on('kopruIndi', () => { if (sesB6()) setTimeout(() => soyle('p_f_kopru'), 600); });
  OLAY.on('senlikFinal', () => { if (sesB6()) soyle('p_f_final', { oncelik: 3 }); });
  // İlk uyuyan midilli ekrana girince (harita konuşma nesnesi koymadıysa da) bir kez "üstüne zıpla"
  setInterval(() => {
    if (!sesB6() || sesSoylendi.p_f_midilli || typeof DURUM === 'undefined' || DURUM !== 'oyun') return;
    const p = gP(); if (!p || p.ucus || (typeof SAYAC !== 'undefined' && SAYAC.midilli > 0)) return;
    const m = gN().find(n => n.tip === 'midilli' && !n.uyandi && !n.done && n.x > p.x - 2 * T && n.x - p.x < 7 * T && Math.abs(n.y - p.y) < 5 * T);
    if (m) soyle('p_f_midilli');
  }, 500);
  // ── Bölüm 7 (Kuzey Işıkları) olayları (kar.js, geyik.js, kardan.js, kizak.js, oyun.js 'buzKay'): ilk fener / yarısı, ilk uyuyan yavru
  // görülünce, uyanınca, ren geyiğiyle tanışma, kardan adam başı / toplar tamam / canlandı, buzlu göl, kızak başı / yarısı / sonu, final.
  // Övgü ara sıra (sonraki fener/yavrularda ~üçte bir; övgü aralığı ayrıca ≥12 sn).
  const sesB7 = () => typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 7;
  let sesKarFenerN = 0, sesYavruN = 0;
  OLAY.on('karFener', () => {
    if (!sesB7()) return;
    sesKarFenerN++;
    const top = (typeof SAYAC !== 'undefined' && SAYAC.fenerTop) || (typeof V7 !== 'undefined' && V7.fenerTop) || 10;
    if (sesKarFenerN === 1) soyle('p_k_fener');
    else if (sesKarFenerN === Math.ceil(top / 2)) soyle('p_k_fener2');
    else if (sesKarFenerN > 2) sesF6Ovgu_();
  });
  OLAY.on('yavruUyandi', () => { if (!sesB7()) return; if (++sesYavruN === 1) soyle('p_k_yavru_uyan'); else sesF6Ovgu_(); });
  OLAY.on('geyikTanis', () => { if (sesB7()) soyle('p_k_geyik'); });   // geyik.js yayınlarsa; yoksa aşağıdaki yakınlık denetimi
  OLAY.on('kardanBasla', () => { if (sesB7()) soyle('p_k_kardan_giris'); });
  OLAY.on('kardanTop', e => { if (sesB7() && e && (e.son || e.n >= 3)) soyle('p_k_kardan_top'); });   // üç top üst üste oturunca
  OLAY.on('kardanBitti', () => { if (sesB7()) setTimeout(() => soyle('p_k_kardan_bitti'), 500); });
  OLAY.on('buzKay', () => { if (sesB7()) soyle('p_k_buz'); });
  OLAY.on('kizakBasla', () => { if (sesB7()) soyle('p_k_kizak_giris'); });
  OLAY.on('kizakTane', e => {
    if (!sesB7()) return;
    const n = e && isFinite(e.n) ? e.n : (typeof SAYAC !== 'undefined' ? SAYAC.kizak : 0);
    const top = (e && isFinite(e.top) && e.top) || (typeof SAYAC !== 'undefined' && SAYAC.kizakTop) || 20;
    if (n === Math.ceil(top / 2)) soyle('p_k_kizak');
  });
  OLAY.on('kizakBitti', () => { if (sesB7()) setTimeout(() => soyle('p_k_kizak_bitti'), 600); });
  OLAY.on('kuzeyFinal', () => { if (sesB7()) soyle('p_k_final', { oncelik: 3 }); });
  setInterval(() => {   // ilk uyuyan yavru / ren geyiği ekrana girince (harita konuşma nesnesi koymadıysa da) bir kez
    if (!sesB7() || typeof DURUM === 'undefined' || DURUM !== 'oyun' || (typeof V7 !== 'undefined' && V7.final)) return;
    const p = gP(); if (!p || p.ucus || p.kilit > 0) return;
    if (!sesSoylendi.p_k_geyik) {
      const g = gN().find(n => n.tip === 'geyik' && Math.abs(n.x - p.x) < 5 * T && Math.abs(n.y - p.y) < 5 * T);
      if (g) { soyle('p_k_geyik'); return; }
    }
    if (sesSoylendi.p_k_yavru || (typeof SAYAC !== 'undefined' && SAYAC.yavru > 0)) return;
    const m = gN().find(n => n.tip === 'karYavru' && !n.uyandi && !n.done && n.x > p.x - 2 * T && n.x - p.x < 7 * T && Math.abs(n.y - p.y) < 5 * T);
    if (m) soyle('p_k_yavru');
  }, 500);
  // ── Bölüm 8 (Balkabağı Gecesi) olayları (kostum.js, kabak.js, kabakyuz.js, iskelet.js, seker.js, kazan.js, supurge.js): kostüm seçimi,
  // ilk fener / yarısı / hepsi, ilk saklanan hayaletçik yakındayken ipucu, bulununca, mini oyun başı/sonu, şeker sokağı, her kapıda
  // "Şeker mi şaka mı!" + komşunun kostüm övgüsü ve şeker/şaka sözü, Cadı Nine'nin kazanı, süpürge yolculuğu, meydan şenliği.
  // Övgü ara sıra (sonraki fener/hayaletçiklerde ~üçte bir; övgü aralığı ayrıca ≥12 sn); komşu övgüleri her kapıda (onların sözü).
  const sesB8 = () => typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 8;
  const SES8_SEKERMI = ['p_c_sekermi', 'p_c_sekermi2', 'p_c_sekermi3'];
  const SES8_KOMSU = { kabakDede: 'kd', iskeletNine: 'in', cadiKiz: 'ck', karaKedi: 'kk', hayaletTeyze: 'ht', kabakDede2: 'k2', kabakNine: 'k2', cadiNine: 'cn' };
  let ses8SekerN = 0, ses8KapiN = 0, ses8KabakN = 0, ses8HayaletN = 0, ses8SekerO = null, ses8IlkKapiO, ses8UcusT = 0;
  function ses8IlkKapi() { if (ses8IlkKapiO === undefined) ses8IlkKapiO = gN().filter(n => n.tip === 'sekerKapi').sort((a, b) => a.x - b.x)[0] || null; return ses8IlkKapiO; }
  function ses8KapiYakin(s) { const o = s && s.o, p = gP(); return (typeof DURUM === 'undefined' || DURUM === 'oyun') && !(o && p && isFinite(o.x) && Math.abs(p.x - o.x) > 9 * T); }
  // kostüm talimatı giriş cümlesi başlayınca sıraya girer (onun ardından çalar); giriş cümlesi hiç çalmazsa 9 sn sonra yine söylenir
  OLAY.on('konusma', v => { if (sesB8() && v && v.anahtar === 'p_c_giris') soyle('p_c_kostum'); });
  OLAY.on('bolum8Basla', () => { if (sesB8()) setTimeout(() => soyle('p_c_kostum'), 9000); });
  OLAY.on('kostumSec', e => { if (sesB8() && e && LINES['p_c_kostum_' + e.ad]) setTimeout(() => soyle('p_c_kostum_' + e.ad), 700); });   // "puf" ve dönüşten sonra
  OLAY.on('kabakFener', () => {
    if (!sesB8()) return;
    ses8KabakN++;
    const top = (typeof SAYAC !== 'undefined' && SAYAC.fenerTop) || (typeof V8 !== 'undefined' && V8.fenerTop) || 12;
    if (ses8KabakN === 1) soyle('p_c_fener');
    else if (ses8KabakN === Math.ceil(top / 2)) soyle('p_c_fener2');
    else if (ses8KabakN === top) soyle('p_c_fener_son');
    else if (ses8KabakN > 2) sesF6Ovgu_();
  });
  OLAY.on('hayaletBuldu', () => {
    if (!sesB8()) return;
    ses8HayaletN++;
    const top = (typeof SAYAC !== 'undefined' && SAYAC.hayaletTop) || (typeof V8 !== 'undefined' && V8.hayaletTop) || 5;
    if (ses8HayaletN === 1) setTimeout(() => soyle('p_c_hayalet_bul'), 900);   // "Ce-ee!" kıkırtısından sonra
    else if (ses8HayaletN === top) setTimeout(() => soyle('p_c_hayalet_son'), 900);
    else if (ses8HayaletN === 2) setTimeout(() => soyle('p_c_hayalet2'), 900);
    else sesF6Ovgu_();   // arada ara sıra övgü
  });
  OLAY.on('hayaletKikir', e => {   // saklanan hayaletçik kıkırdadı (kabak.js): ilk kıkırtıda, Feza yakınsa "Duydun mu?"
    const o = e && e.o, p = gP();
    if (sesB8() && o && p && !o.bulundu && Math.abs(o.x - p.x) < 9 * T && !(typeof SAYAC !== 'undefined' && SAYAC.hayalet > 0)) soyle('p_c_hayalet');
  });
  OLAY.on('kabakYuzBasla', () => { if (sesB8()) soyle('p_c_kabakyuz_giris'); });
  OLAY.on('kabakYuzBitti', () => { if (sesB8()) setTimeout(() => soyle('p_c_kabakyuz_bitti'), 500); });
  // kabak yüzü turları (kabakyuz.js): 2. ve 3. turda yön sözü, ~9 sn dokunulmazsa bir kez ipucu, Pırıl seçerken kısa söz (tur başına en çok bir),
  // ara sıra övgü (Feza seçince), canlanmada kabağın kendi teşekkürü
  OLAY.on('kabakYuzTur', e => { if (!sesB8() || !e) return; if (e.n === 2) soyle('p_c_kabakyuz_burun'); else if (e.n === 3) soyle('p_c_kabakyuz_agiz'); });
  OLAY.on('kabakYuzIpucu', () => { if (sesB8()) soyle('p_c_kabakyuz_ipucu'); });
  OLAY.on('kabakYuzYardim', e => { if (sesB8()) soyle('p_c_kabakyuz_yardim', { yer: 'kyY' + (e && e.n) }); });
  OLAY.on('kabakYuzParca', e => { if (sesB8() && e && !e.yardim && e.n === 2 && Math.random() < 0.5) setTimeout(() => { if (!sesCalan && !sesSira.length) soyle('p_aferin'); }, 600); });
  OLAY.on('kabakYuzCanlan', () => { if (sesB8()) setTimeout(() => soyle('kb_tesekkur'), 2200); });
  OLAY.on('iskeletBasla', () => { if (sesB8()) soyle('p_c_iskelet_giris'); });
  OLAY.on('iskeletBitti', () => { if (sesB8()) setTimeout(() => soyle('p_c_iskelet_bitti'), 500); });
  OLAY.on('iskeletIpucu', e => { if (sesB8() && e && e.n === 1) soyle('p_c_iskelet_ipucu'); });   // sırası gelen iskelete ~6 sn dokunulmadı
  OLAY.on('iskeletYardim', e => { if (sesB8() && e && e.n === 1) soyle('p_c_iskelet_yardim'); });   // Pırıl birlikte çalmaya başlıyor
  OLAY.on('iskeletNota', e => { if (sesB8() && e && e.n === 8 && !e.yardim && Math.random() < 0.5) setTimeout(() => { if (!sesCalan && !sesSira.length) soyle('p_aferin'); }, 700); });
  // şeker sokağı: kapı çalınınca Pırıl "Şeker mi şaka mı!" (seker.js 'sekerKapiCal'); komşu görününce kostüm övgüsü + şeker/şaka sözü ('komsuSoz').
  // seker.js çalma olayını yayınlamazsa da tören eksik kalmasın: komsuSoz'den hemen önce söylenir.
  function ses8YakinKapi() { const p = gP(); let en = null, d = 6 * T; if (p) for (const n of gN()) if (n.tip === 'sekerKapi' && Math.abs(n.x - p.x) < d) { d = Math.abs(n.x - p.x); en = n; } return en; }
  function ses8KapiYeni(o) { const k = o && typeof o === 'object' ? o : ses8YakinKapi(); if (k && ses8SekerO === k) return false; ses8SekerO = k; ses8KapiN++; return true; }
  OLAY.on('sekerKapiCal', e => { if (sesB8()) soyle('p_c_sekermi', { o: e && e.o || undefined }); });
  OLAY.on('komsuSoz', e => {
    if (!sesB8() || !e) return;
    const on = SES8_KOMSU[e.kim]; if (!on) return;
    const o = e.o && typeof e.o === 'object' ? e.o : null;
    if (e.an === 'veda') { if (LINES[on + '_veda']) soyle(on + '_veda', { o: o || undefined }); return; }
    if (on !== 'cn' && o && ses8SekerO !== o) soyle('p_c_sekermi', { o });   // tören eksik kalmasın (çalma sözü gelmediyse)
    const kos = e.kostum || (typeof V8 !== 'undefined' && V8.kostum) || 'genel';
    soyle(LINES[on + '_' + kos] ? on + '_' + kos : on + '_genel', { o: o || undefined });
  });
  OLAY.on('kazanBasla', e => { if (!sesB8()) return; const o = e && e.o; soyle('cn_merhaba', { o }); soyle('p_c_kazan_giris'); });
  OLAY.on('kazanMalzeme', e => { if (sesB8() && e && e.n === 2) soyle('cn_malzeme'); });
  OLAY.on('kazanPuf', () => { if (sesB8()) soyle('cn_puf'); });   // iksirden süpürge çıktı
  OLAY.on('kazanBitti', () => { if (!sesB8()) return; soyle('cn_bitti'); setTimeout(() => soyle('p_c_kazan_bitti'), 400); });   // Cadı Nine uğurlar, Pırıl süpürgeye çağırır
  OLAY.on('supurgeBasla', () => {
    if (!sesB8()) return; soyle('p_c_supurge_giris');
    const t0 = ++ses8UcusT; setTimeout(() => { if (t0 === ses8UcusT) soyle('p_c_supurge'); }, 26000);   // yedek: ay anı olayı gelmezse uçuşun ortasında
  });
  OLAY.on('supurgeAy', () => { if (sesB8()) { ses8UcusT++; soyle('p_c_supurge'); } });   // ayın önünden geçiş (supurge.js, ~18. sn)
  OLAY.on('supurgeYardim', () => { if (sesB8()) soyle('p_c_supurge_yardim'); });
  OLAY.on('supurgeBitti', () => { if (!sesB8()) return; ses8UcusT++; setTimeout(() => soyle('p_c_supurge_bitti'), 600); });
  OLAY.on('cadiFinal', () => { if (sesB8()) soyle('p_c_final', { oncelik: 3 }); });
  setInterval(() => {   // ilk saklanan hayaletçik önüne gelince / şeker sokağına girerken (harita konuşma nesnesi koymadıysa da) bir kez
    if (!sesB8() || typeof DURUM === 'undefined' || DURUM !== 'oyun' || (typeof V8 !== 'undefined' && V8.final)) return;
    const p = gP(); if (!p || p.ucus || p.kilit > 0) return;
    if (!sesSoylendi.p_c_sokak && !ses8KapiN) {
      const k = ses8IlkKapi();
      if (k && p.x > k.x - 18 * T && p.x < k.x - 4 * T && (typeof V8 === 'undefined' || V8.iskelet || !TUR.al('iskeletMini'))) { soyle('p_c_sokak'); return; }
    }
    if (sesSoylendi.p_c_hayalet || (typeof SAYAC !== 'undefined' && SAYAC.hayalet > 0) || !(typeof V8 === 'undefined' || V8.kostum || !TUR.al('kostumSec'))) return;
    const m = gN().find(n => n.tip === 'hayaletcik' && !n.bulundu && !n.om8 && !n.done && n.x > p.x - T && n.x - p.x < 7 * T && Math.abs(n.y - p.y) < 6 * T);
    if (m) soyle('p_c_hayalet');
  }, 500);
  // ── Bölüm 9 (Pırıl'ın Ejderha Vadisi) olayları (yavru.js, meyve.js, kanat.js, kolye.js, buyukanne.js, yuva.js): ilk pul çiçeği / yarısı /
  // hepsi, ilk üşümüş yumurta yakındayken, ilk yavru çıkınca, mini oyun başı / ipucu / yardım / sonu (Fıstık ve Büyükanne kendi sesleriyle).
  // Büyükanne'nin sırtında yolculuğun ve yuvadaki şölenin sözlerini (bn_binis, bn_selam, p_e_binis*, p_e_final, ea_/eb_merhaba, bn_hediye)
  // buyukanne.js / yuva.js kendi anlarında söyler; burada yalnız yedekler (tek seferlik cümleler bir kez söylenir, çift çağrı zararsız).
  // Övgü ara sıra (sonraki çiçek/yavrularda ~üçte bir, mini oyunlarda yer yer; övgü aralığı ayrıca ≥12 sn).
  const sesB9 = () => typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 9;
  const sesV9 = ad => typeof V9 !== 'undefined' && !!V9 && !!V9[ad];
  const ses9Ovgu = (sans, ms) => { if (Math.random() < sans) setTimeout(() => { if (!sesCalan && !sesSira.length) soyle('p_aferin'); }, ms || 700); };
  let ses9PulN = 0, ses9YavruN = 0, ses9KolyeN = 0, ses9MeyveYanlis = 0;
  OLAY.on('pulCicek', () => {
    if (!sesB9()) return;
    ses9PulN++;
    const top = (typeof SAYAC !== 'undefined' && SAYAC.pulTop) || (typeof V9 !== 'undefined' && V9.pulTop) || 10;
    if (ses9PulN === 1) soyle('p_e_pul');
    else if (ses9PulN === Math.ceil(top / 2)) soyle('p_e_pul2');
    else if (ses9PulN === top) soyle('p_e_pul_son');
    else if (ses9PulN > 2) sesF6Ovgu_();
  });
  OLAY.on('yavruCikti', () => {
    if (!sesB9()) return;
    ses9YavruN++;
    const top = (typeof SAYAC !== 'undefined' && SAYAC.yavruTop) || (typeof V9 !== 'undefined' && V9.yavruTop) || 6;
    if (ses9YavruN === 1) setTimeout(() => soyle('p_e_yavru'), 900);   // çıkış, esneme ve hapşırıktan sonra
    else if (ses9YavruN === top) setTimeout(() => soyle('p_e_yavru_son'), 900);
    else if (ses9YavruN === 2) setTimeout(() => soyle('p_e_yavru2'), 900);
    else sesF6Ovgu_();
  });
  // mini oyun 1: yavrulara meyve (meyve.js)
  OLAY.on('meyveBasla', () => { if (sesB9()) soyle('p_e_meyve_giris'); });
  OLAY.on('meyveVer', e => {
    if (!sesB9() || !e) return;
    if (e.dogru === false) { if (++ses9MeyveYanlis === 2) soyle('p_e_meyve_ipucu'); return; }   // ikinci yanlışta bir kez (ceza yok, yavru başını çevirir)
    if (!e.yardim) ses9Ovgu(0.3);
  });
  OLAY.on('meyveTur', e => { if (sesB9() && e && e.n === 3) setTimeout(() => soyle('p_e_meyve_iki'), 900); });   // son tur: ortadaki yavru iki meyve ister
  OLAY.on('meyveIpucu', () => { if (sesB9()) soyle('p_e_meyve_ipucu'); });
  OLAY.on('meyveYardim', () => { if (sesB9()) soyle('p_e_meyve_yardim'); });
  OLAY.on('meyveBitti', () => { if (sesB9()) setTimeout(() => soyle('p_e_meyve_bitti'), 500); });
  // mini oyun 2: utangaç Fıstık'ın uçma dersi (kanat.js): Pırıl kuzenini tanıtır, Pırıl gösterince Fıstık utangaç merhaba der
  OLAY.on('kanatBasla', () => { if (sesB9()) soyle('p_e_kanat_giris'); });
  OLAY.on('kanatGoster', () => { if (sesB9()) soyle('fs_merhaba'); });
  OLAY.on('kanatCicek', e => {
    if (!sesB9() || !e) return;
    if (e.n === 1) soyle('fs_ilk');
    else if (e.n === 3 && !e.yardim) ses9Ovgu(0.6);
  });
  OLAY.on('kanatIpucu', () => { if (sesB9()) soyle('p_e_kanat_ipucu'); });
  OLAY.on('kanatYardim', () => { if (sesB9()) soyle('p_e_kanat_yardim'); });
  OLAY.on('kanatSuzul', () => { if (sesB9()) soyle('fs_ucuyorum'); });
  OLAY.on('kanatBurun', () => { if (sesB9()) soyle('fs_tesekkur'); });
  OLAY.on('kanatBitti', () => { if (sesB9()) setTimeout(() => soyle('p_e_kanat_bitti'), 400); });
  // mini oyun 3: Büyükanne'nin pul kolyesi (kolye.js): Büyükanne ilk kez görünür ve konuşur; pulların çoğunda kısa bir söz (biçimine göre),
  // birinde ara sıra Pırıl'ın övgüsü; son pulda kolye parlar → teşekkür, kucak → davet, Büyükanne kayalığa konunca Pırıl yol gösterir
  OLAY.on('kolyeBasla', () => { if (!sesB9()) return; ses9KolyeN = 0; soyle('bn_merhaba'); soyle('p_e_kolye_giris'); });
  OLAY.on('kolyePul', e => {
    if (!sesB9()) return;
    const n = e && isFinite(e.n) ? e.n : ++ses9KolyeN, top = (e && isFinite(e.top) && e.top) || 5;
    if (n >= top) return;   // son pulda söz yok: kolye parlar, teşekkür gelecek
    if (n === 3 && !(e && e.yardim) && Math.random() < 0.5) { ses9Ovgu(1, 300); return; }
    const b = e && typeof e.bicim === 'string' ? 'bn_pul_' + e.bicim : '';
    soyle(LINES[b] ? b : 'bn_pul', { yer: 'kp' + n });
  });
  OLAY.on('kolyeIpucu', () => { if (sesB9()) soyle('p_e_kolye_ipucu'); });
  OLAY.on('kolyeYardim', () => { if (sesB9()) soyle('p_e_kolye_yardim'); });
  OLAY.on('kolyeParla', () => { if (sesB9()) soyle('bn_tesekkur'); });
  OLAY.on('kolyeKucak', () => { if (sesB9()) soyle('bn_davet'); });
  OLAY.on('kolyeBitti', () => { if (!sesB9()) return; soyle('bn_tesekkur'); setTimeout(() => soyle('p_e_kolye_bitti'), 400); });
  // Büyükanne'nin sırtında yolculuk (buyukanne.js sözlerini kendisi söyler; bunlar yedek, aynı anda): yardım ve ara sıra övgü burada
  OLAY.on('binisBasla', () => { if (sesB9()) soyle('p_e_binis_giris'); });
  OLAY.on('binisGunbatimi', () => { if (sesB9()) soyle('p_e_binis'); });
  OLAY.on('binisYardim', () => { if (sesB9()) soyle('p_e_binis_yardim'); });
  OLAY.on('binisIsik', e => { if (sesB9() && e && isFinite(e.n) && e.n > 0 && e.n % 6 === 0 && !e.yardim && e.kim !== 'piril') ses9Ovgu(0.4); });
  OLAY.on('binisBitti', () => { if (sesB9()) setTimeout(() => soyle('p_e_binis_bitti'), 600); });
  // final: Ejderha Kalbi Şöleni (yuva.js sözleri kendi anlarında söyler: p_e_final, ea_merhaba, eb_merhaba, bn_hediye; anlatıcı oyun.js'te 6. sn)
  const ses9Final = (k, ops) => { if (sesB9() && typeof DURUM !== 'undefined' && DURUM === 'oyun') soyle(k, ops || { oncelik: 3 }); };
  OLAY.on('ejderAile', () => { ses9Final('ea_merhaba'); ses9Final('eb_merhaba'); });
  OLAY.on('ejderHediye', () => ses9Final('bn_hediye'));
  OLAY.on('ejderKucak', () => ses9Final('ea_kucak'));
  OLAY.on('ejderDans', () => ses9Final('eb_dans'));
  setInterval(() => {   // ilk üşümüş yumurta önüne gelince (harita konuşma nesnesi koymadıysa da) bir kez "sarılıp ısıtalım"
    if (!sesB9() || typeof DURUM === 'undefined' || DURUM !== 'oyun' || sesV9('final')) return;
    const p = gP(); if (!p || p.ucus || p.kilit > 0) return;
    if (sesSoylendi.p_e_yumurta || (typeof SAYAC !== 'undefined' && SAYAC.yavru > 0)) return;
    const m = gN().find(n => n.tip === 'ejderYumurta' && !n.om9 && !n.done && !n.cikti && n.x > p.x - 2 * T && n.x - p.x < 7 * T && Math.abs(n.y - p.y) < 5 * T);
    if (m) soyle('p_e_yumurta');
  }, 500);

  // ── Bölüm 11 (Ay Işığı Şatosu) olayları (ayna11.js, pelerin11.js, aynasalon11.js, org11.js, pasta11.js, ucus11.js, balo11.js, vampir11.js).
  // Pırıl yol gösterir (ilk ayna, takılınca ipucu, bölge girişleri), mini oyunların tek talimatı + ipucu/yardım; vampir ailesi kendi sesiyle
  // (vk_ Vela · vd_ Dede · vn_ Nine · vb_ Pıtır) kendi anında konuşur; finalde aile sözleri Ay Balosu'nun anlarına zamanlanır (sahne cümlesi gibi sırada
  // bekler). Tek seferlik cümleler oyun başına bir kez; övgü ara sıra ve çeşitli (aynalarda ~üçte bir, mini oyunlarda yer yer).
  // Kampüs: kısa, önceden kaydedilmiş yönlendirmeler yalnız ilgili etkinlikte.
  const sesB12=()=>typeof BOLUM_NO!=='undefined' && BOLUM_NO===12;
  // Az ve yerinde: her etkinliğin başında tek cümle, ara sıra ve çeşitli övgü; isteğe bağlı cümleler (kedi, köpek,
  // takla, sayfa, yıldız) yalnız ortalık sessizken ve son cümleden 8 sn sonra. Cümleler olaylara bağlı (BOLUM12.md › Olaylar).
  // ANNE KONUŞMAZ (ebeveynin isteği: Feza kendi annesinin dışında bir anne sesi istemeyebilir). Annenin yaptıklarını Pırıl anlatır
  // ("Annen sana uçurtma verdi!"); an_q_ önekli hiçbir cümle yok, soyle() onları zaten susturur.
  Object.assign(SES_TEK, { p_q_uyku: 1, p_q_giris: 1, p_q_cicek: 1, p_q_scooter: 1, p_q_kopuk: 1, p_q_selam: 1, p_q_ucurtmaver: 1,
    p_q_ucurtma: 1, p_q_takla: 1, p_q_havuz: 1, p_q_sayfa: 1, p_q_bisiklet: 1, p_q_ordek: 1, p_q_kayik: 1,
    p_q_botanik: 1, p_q_kaplumbaga: 1, p_q_gunes: 1, p_q_kplkule: 1, p_q_buyukgolet: 1, p_q_golsicak: 1, p_q_sazan: 1,
    p_q_gunbatimi: 1, p_q_cagir: 1, p_q_dans: 1, p_q_yildiz: 1, p_q_kedi: 1, p_q_kopek: 1, a_q_final1: 1, p_q_sabah: 1 });
  Object.assign(SES_SAHNE, { p_q_uyku: 1, p_q_giris: 1, a_q_final1: 1, p_q_sabah: 1 });
  let ses12SonT = -1e9, ses12OvguT = -1e9, ses12OvguSon = '', ses12Takla = 0;
  OLAY.on('konusma', e => { if (sesB12() && e && e.anahtar) ses12SonT = sesSaat() + (e.sure || 2); });
  const ses12Bos = (sn) => !sesCalan && !sesSira.length && sesSaat() - ses12SonT > (sn || 8);   // ortalık sessiz mi
  const ses12 = (k, ops) => { if (sesB12() && typeof DURUM !== 'undefined' && DURUM === 'oyun') soyle(k, ops); };
  const ses12Istege = (k, ops) => { if (ses12Bos(8)) ses12(k, ops); };
  const ses12Ovgu = sans => {   // övgü: ara sıra (en az 25 sn arayla), Pırıl'dan, aynısı üst üste gelmez
    if (Math.random() > sans || sesSaat() - ses12OvguT < 25) return;
    const ad = ['p_q_aferin', 'p_q_aferin2'].filter(k => k !== ses12OvguSon && !sesSoylendi[k]);
    const k = ad.length ? ad[Math.floor(Math.random() * ad.length)] : 'p_aferin';   // üçü de söylendiyse Pırıl'ın genel övgüleri
    setTimeout(() => { if (ses12Bos(3)) { ses12OvguT = sesSaat(); ses12OvguSon = k; ses12(k, { oncelik: 0 }); } }, 700);
  };
  // sıralı cümleler: biri başlayınca öbürü sıraya girer (uçurtmayı alınca: nasıl oynanır)
  const SES12_ZINCIR = { p_q_ucurtmaver: 'p_q_ucurtma' };
  OLAY.on('konusma', e => { if (sesB12() && e && SES12_ZINCIR[e.anahtar]) soyle(SES12_ZINCIR[e.anahtar], { oncelik: 2 }); });
  OLAY.on('sahneAn', e => { if (sesB12() && e && e.mod === 'final' && e.ad === 'feza_uyandi') soyle('p_q_sabah', { oncelik: 3 }); });
  OLAY.on('k12CicekActi', e => { if (e && e.n >= 2) ses12('p_q_cicek', { o: e.o }); });
  OLAY.on('k12BinisBasla', e => { if (e && e.ad === 'yol2') ses12('p_q_bisiklet', { o: e.o }); else ses12('p_q_scooter', { o: e && e.o }); });
  OLAY.on('k12BinisBitti', e => { if (!e || e.ad !== 'yol2') ses12Ovgu(0.5); });   // yol2'den sonra ördekler ve kayık hemen geliyor: övgü yok
  // scooter yolu uzun (~35 sn): ortalık sessizken yol sürprizlerinden biri ya da ikisi kısaca anılır
  OLAY.on('k12Surpriz', e => {
    if (!e || e.ad !== 'yol1') return;
    if (e.tur === 'kopuk' && !sesSoylendi.p_q_kopuk) ses12Istege('p_q_kopuk');
    else if (e.tur === 'selam' && !sesSoylendi.p_q_selam) ses12Istege('p_q_selam');
  });
  OLAY.on('k12UcurtmaVer', e => ses12('p_q_ucurtmaver', { o: e && e.o }));
  OLAY.on('k12UcurtmaTakla', e => { if (e && e.oto) return; if (++ses12Takla === 2) ses12Istege('p_q_takla', { o: e.o }); else if (ses12Takla > 3) ses12Ovgu(0.2); });
  OLAY.on('k12Fiskiye', e => ses12('p_q_havuz', { o: e && e.o }));
  OLAY.on('k12Sayfa', e => ses12Istege('p_q_sayfa', { o: e && e.o }));
  OLAY.on('k12OrdekKatildi', e => { if (!sesSoylendi.p_q_ordek) ses12('p_q_ordek', { o: e && e.o }); else if (e && e.n === 4) ses12Ovgu(0.5); });
  OLAY.on('k12KayikBasla', e => {
    ses12('p_q_kayik', { o: e && e.o });
    // büyük gölette: ortalık biraz sessizleşince Pırıl kuğuları gösterir, sonra (kayık hâlâ sürüyorsa) sıcak bir söz söyler.
    // Kayık basılı tutunca ~20 sn, bırakınca daha uzun sürer: sabit süre yerine sessizliği bekler.
    const kayikta = () => { const p = gP(); return !!(p && p.ucus && p.ucus.tip === 'k12Kayik'); };
    const t0 = sesSaat();
    const bak = () => {
      if (!sesB12() || !kayikta()) return;
      const g = sesSaat() - t0;
      if (!sesSoylendi.p_q_buyukgolet) { if (g > 7 && ses12Bos(3.5)) ses12('p_q_buyukgolet'); }
      else if (!sesSoylendi.p_q_golsicak) { if (g > 15 && ses12Bos(5)) ses12('p_q_golsicak'); }
      else return;
      setTimeout(bak, 500);
    };
    setTimeout(bak, 7000);
  });
  // botanik bahçesi: girişte bir kez; kaplumbağalar ilk kafasını çıkarınca (ya da dokununca) bir kez, olay gelmezse bahçenin ortasında
  const ses12Kaplumbaga = () => { if (!sesSoylendi.p_q_kaplumbaga) ses12('p_q_kaplumbaga'); };
  // yere bağlı cümleler: Feza o bölgeden çıktıysa (sırada beklerken) söylenmez
  const ses12Yerde = (ad, pay) => () => {
    const p = gP(), b = typeof BOLUM !== 'undefined' && BOLUM && BOLUM.bolgeler ? BOLUM.bolgeler.find(v => v.ad === ad) : null;
    return !p || !b || (p.x >= b.x0 - (pay || 0) * T && p.x < b.x1 + (pay || 0) * T);
  };
  Object.assign(KOSUL, { p_q_botanik: ses12Yerde('botanik'), p_q_kaplumbaga: ses12Yerde('botanik', 6), p_q_gunes: ses12Yerde('botanik', 4), p_q_kplkule: ses12Yerde('botanik', 4),
    p_q_havuz: ses12Yerde('bilgi', 4), p_q_sayfa: ses12Yerde('bilgi', 4), p_q_gunbatimi: ses12Yerde('tepe'), p_q_cicek: ses12Yerde('lojman', 6) });
  OLAY.on('k12KaplumbagaKafa', ses12Kaplumbaga);
  OLAY.on('k12KaplumbagaDokun', ses12Kaplumbaga);
  OLAY.on('k12KaplumbagaBak', ses12Kaplumbaga);
  // anne kaplumbağaları gösterince: Pırıl önce kaplumbağaları tanıtır (daha söylemediyse), söylediyse sessizken güneşlendiklerini anlatır
  OLAY.on('k12AnneGoster', () => { if (!sesSoylendi.p_q_kaplumbaga) ses12Kaplumbaga(); else ses12Istege('p_q_gunes'); });
  OLAY.on('k12KaplumbagaKule', () => ses12Istege('p_q_kplkule'));
  OLAY.on('k12SazanOp', () => { if (!sesSoylendi.p_q_sazan) ses12Istege('p_q_sazan'); });
  OLAY.on('k12KayikBitti', () => { if (!sesSoylendi.p_q_golsicak) ses12Ovgu(0.6); });   // kayıkta iki söz söylendiyse övgü yok (gün batımı geliyor)
  OLAY.on('k12KediSev', () => ses12Istege('p_q_kedi'));
  OLAY.on('k12KopekSev', () => ses12Istege('p_q_kopek'));
  // final: çağrı sahne cümlesi gibi sırada bekler (atılmaz); sarılma sessiz, yalnız müzik (sonra anlatıcı söyler)
  OLAY.on('k12FinalAn', e => {
    const an = e && (e.an || e.ad);
    if (an === 'cagir') ses12('p_q_cagir', { oncelik: 3 });
    else if (an === 'dans') ses12('p_q_dans', { oncelik: 2 });
    else if (an === 'yildiz') ses12Istege('p_q_yildiz');
  });
  setInterval(() => {   // botanik bahçesi (girişte; kaplumbağa yedeği ortasında)
    if (!sesB12() || typeof DURUM === 'undefined' || DURUM !== 'oyun' || typeof BOLUM === 'undefined' || !BOLUM.bolgeler) return;
    const p = gP(), b = BOLUM.bolgeler.find(v => v.ad === 'botanik');
    if (!p || !b || p.ucus || p.x < b.x0 + 2 * T || p.x > b.x1) return;
    if (!sesSoylendi.p_q_botanik) ses12('p_q_botanik');
    else if (!sesSoylendi.p_q_kaplumbaga && p.x > (b.x0 + b.x1) / 2 && ses12Bos(5)) ses12Kaplumbaga();
  }, 1000);
  setInterval(() => {   // gün batımı tepesine varınca bir kez
    if (!sesB12() || sesSoylendi.p_q_gunbatimi || typeof DURUM === 'undefined' || DURUM !== 'oyun' || typeof BOLUM === 'undefined' || !BOLUM.bolgeler) return;
    const p = gP(), b = BOLUM.bolgeler.find(v => v.ad === 'tepe');
    if (p && b && p.x >= b.x0 && !p.ucus && !(typeof V12 !== 'undefined' && V12 && V12.final)) ses12('p_q_gunbatimi');
  }, 1000);
  const sesB11 = () => typeof BOLUM_NO !== 'undefined' && BOLUM_NO === 11;
  const sesV11 = ad => typeof V11 !== 'undefined' && !!V11 && !!V11[ad];
  const ses11Ovgu = (sans, ms) => { if (Math.random() < sans) setTimeout(() => { if (!sesCalan && !sesSira.length) soyle('p_aferin'); }, ms || 700); };
  const ses11Uc = () => { const p = gP(); return !!(p && p.ucus); };
  const ses11Yer = () => { const p = gP(); if (!p || typeof BOLUM === 'undefined' || !BOLUM.bolgeler) return ''; for (const b of BOLUM.bolgeler) if (p.x >= b.x0 && p.x < b.x1) return b.ad; return ''; };
  // mini oyun ipucu: talimat yeni bittiyse çocuğa deneme zamanı tanı – Pırıl ≥3,5 sn sustuktan sonra ve çocuk bu arada hiç ilerlemediyse söyle
  let ses11DokunT = -1e9, ses11DokunN = 0;
  let ses11SalonN = 0, ses11OrgN = 0, ses11PastaN = 0;
  const ses11Ipucu = (k, say, oyun) => {
    const n0 = say(), t0 = sesSaat(); let sus = 0;
    const dene = () => {
      if (!sesB11() || sesV11(oyun) || say() !== n0 || sesSaat() - t0 > 25) return;
      if (sesCalan || sesSira.length) sus = 0; else if ((sus += 0.5) >= 3.5) { soyle(k); return; }
      setTimeout(dene, 500);
    };
    dene();
  };
  let ses11AynaN = 0, ses11AynaZ = [], ses11Bekle = 0, ses11BeklO = null, ses11BaloT = 0;
  Object.assign(SES_TEK, { p_s_pelerin: 1, p_s_pelerin_mor: 1, p_s_pelerin_lacivert: 1, p_s_pelerin_kirmizi: 1, p_s_pelerin_pembe: 1, p_s_ayna: 1, p_s_ayna_ilk: 1,
    p_s_ayna_ipucu: 1, p_s_ayna_selale: 1, p_s_ayna2: 1, p_s_ayna_son: 1, p_s_ovgu1: 1, p_s_ovgu2: 1, p_s_ovgu3: 1, p_s_yarasa: 1, p_s_kopru: 1, p_s_magara: 1, p_s_galeri: 1,
    p_s_salon_giris: 1, p_s_salon_ipucu: 1, p_s_ayna_sapka: 1, p_s_ayna_kedi: 1, p_s_ayna_pitir: 1, p_s_ayna_cilek: 1, p_s_ayna_ay: 1, p_s_ayna_feza: 1, p_s_salon_yardim: 1, p_s_salon_bitti: 1, p_s_org_giris: 1, p_s_org_yardim: 1, p_s_org_birlikte: 1, p_s_org_bitti: 1,
    p_s_pasta_giris: 1, p_s_pasta_ipucu: 1, p_s_pasta_cilek: 1, p_s_pasta_yardim: 1, p_s_pasta_bitti: 1, p_s_balkon: 1, p_s_ucus_giris: 1, p_s_ucus: 1, p_s_ucus_sato: 1,
    p_s_ucus_bitti: 1, p_s_balo_ipucu: 1, p_s_final: 1, vk_merhaba: 1, vk_gorusuruz: 1, vk_ayna: 1, vk_salon: 1, vk_org: 1, vk_ucus: 1, vk_balo: 1, vk_tesekkur: 1,
    vd_merhaba: 1, vd_dans: 1, vd_tesekkur: 1, vd_vals: 1, vn_pasta: 1, vn_kat1: 1, vn_kat2: 1, vn_tesekkur: 1, vb_merhaba: 1, vb_mutlu: 1, vb_balo: 1 });
  Object.assign(KOSUL, {   // talimat konusu bittiyse (oyun bitti, uçuş başladı...) söylenmez
    p_s_pelerin: () => !sesV11('pelerin'),
    p_s_ayna: () => ses11AynaN === 0 && !ses11Uc(), p_s_ayna_ipucu: () => !sesV11('final') && !ses11Uc() && !(typeof om11MiniAktif === 'function' && om11MiniAktif()),
    p_s_ayna2: () => !sesV11('final'), p_s_ayna_son: () => !sesV11('final'), p_s_ayna_ilk: () => !sesV11('final'), p_s_ayna_selale: () => !sesV11('final'),
    p_s_yarasa: () => !sesV11('final') && !ses11Uc(), p_s_kopru: () => !sesV11('final') && !ses11Uc(), p_s_magara: () => !sesV11('final') && !ses11Uc(), p_s_galeri: () => !sesV11('final') && !ses11Uc(),
    vk_merhaba: () => !sesV11('final'), vk_gorusuruz: () => !sesV11('salon'), vb_merhaba: () => !sesV11('final'),
    p_s_salon_giris: () => !sesV11('salon'), p_s_salon_ipucu: () => !sesV11('salon'), p_s_salon_yardim: () => !sesV11('salon'), p_s_ayna_sapka: () => !sesV11('salon'), p_s_ayna_kedi: () => !sesV11('salon'), p_s_ayna_pitir: () => !sesV11('salon'),
    p_s_ayna_cilek: () => !sesV11('salon'), p_s_ayna_ay: () => !sesV11('salon'), p_s_ayna_feza: () => !sesV11('salon'), vk_ayna: () => !sesV11('salon'),
    p_s_org_giris: () => !sesV11('org'), p_s_org_yardim: () => !sesV11('org'), p_s_org_birlikte: () => !sesV11('org'), vd_merhaba: () => !sesV11('org'), vd_dans: () => !sesV11('org'), vk_org: () => !sesV11('org'),
    p_s_pasta_giris: () => !sesV11('pasta'), p_s_pasta_ipucu: () => !sesV11('pasta'), p_s_pasta_cilek: () => !sesV11('pasta'), p_s_pasta_yardim: () => !sesV11('pasta'),
    vn_pasta: () => !sesV11('pasta'), vn_kat1: () => !sesV11('pasta'), vn_kat2: () => !sesV11('pasta'),
    p_s_balkon: () => !sesV11('ucus') && !ses11Uc(), p_s_ucus_giris: () => !sesV11('ucus'), vk_ucus: () => !sesV11('ucus') && ses11Uc(),
    p_s_ucus: () => !sesV11('ucus') && ses11Uc(), p_s_ucus_sato: () => !sesV11('ucus') && ses11Uc(), p_s_ucus_yardim: () => !sesV11('ucus') && ses11Uc(),
    p_s_ucus_bitti: () => !sesV11('final'), p_s_balo_ipucu: () => !sesV11('final') && !ses11Uc(),
  });
  // giriş: pelerin baloncukları belirince (ya da oyun başlayınca 7 sn içinde seçilmediyse) Pırıl gösterir; seçilince rengini sever
  OLAY.on('pelerinGoster', () => { if (sesB11()) setTimeout(() => soyle('p_s_pelerin'), 1500); });
  OLAY.on('durum', d => { if (sesB11() && d === 'oyun') setTimeout(() => { if (!sesV11('pelerin') && typeof DURUM !== 'undefined' && DURUM === 'oyun') soyle('p_s_pelerin'); }, 7000); });
  OLAY.on('bolum11Basla', () => { if (sesB11()) setTimeout(() => { if (!sesV11('pelerin') && typeof DURUM !== 'undefined' && DURUM === 'oyun') soyle('p_s_pelerin'); }, 7000); });
  let ses11Pelerin = false;
  OLAY.on('pelerinSec', e => { if (!sesB11() || ses11Pelerin) return; ses11Pelerin = true; const k = 'p_s_pelerin_' + (e && e.ad); if (LINES[k]) setTimeout(() => soyle(k), 900); });
  // vampir durakları (vampir11.js): Vela bahçe kapısında karşılar ve şatoya süzülür; Pıtır galeride beşiğinde uyanır
  OLAY.on('vampirDurak', e => {
    if (!sesB11() || !e) return;
    if (e.kim === 'kiz' && e.an === 'selam') soyle('vk_merhaba');
    else if (e.kim === 'kiz' && e.an === 'veda') soyle('vk_gorusuruz');
    else if (e.kim === 'bebek' && (e.an === 'uyandi' || e.an === 'selam')) soyle('vb_merhaba');
    else if (e.an === 'dokun' && (e.kim === 'kiz' || e.kim === 'bebek')) {   // Feza Vela'ya / Pıtır'a dokununca: her seferinde değil (≥10 sn arayla, yarı şans, en çok 3 kez)
      const t = sesSaat();
      if (t - ses11DokunT < 10 || ses11DokunN >= 3 || Math.random() < 0.5 || sesCalan || sesSira.length) return;
      ses11DokunT = t; ses11DokunN++; soyle(e.kim === 'kiz' ? 'vk_gidik' : 'vb_alkis');
    }
  });
  // ay ışığı aynaları: ilk dönüş, art arda dönen aynalar (ışık şelalesi), yarısı, hepsi; arada ara sıra övgü ya da sıcak bir söz
  OLAY.on('aynaDondu', () => {
    if (!sesB11()) return;
    ses11AynaN++; ses11Bekle = 0;
    const t = sesSaat(); ses11AynaZ.push(t); ses11AynaZ = ses11AynaZ.filter(z => t - z < 2.5);
    if (ses11AynaZ.length >= 3) { soyle('p_s_ayna_selale'); return; }
    const top = (typeof SAYAC !== 'undefined' && SAYAC.aynaTop) || (typeof V11 !== 'undefined' && V11.aynaTop) || 12;
    if (ses11AynaN === 1) setTimeout(() => soyle('p_s_ayna_ilk'), 1300);   // önce şato kapısı canlansın
    else if (ses11AynaN === Math.ceil(top / 2)) soyle('p_s_ayna2');
    else if (ses11AynaN === top) soyle('p_s_ayna_son');
    else if (ses11AynaN === 4) setTimeout(() => soyle('p_s_ovgu1'), 1000);
    else if (ses11AynaN === 9 && Math.random() < 0.6) setTimeout(() => soyle('p_s_ovgu2'), 1000);
    else if (ses11AynaN > 2) ses11Ovgu(0.2, 900);   // ara sıra (aynaların ~beşte biri): 4. ve 9. aynada zaten sıcak söz var
  });
  // mini oyun 1: ayna salonu (aynasalon11.js) – Vela'nın "aynada görünmem" şakası, sonra silme talimatı
  OLAY.on('salonSaka', () => { if (sesB11()) soyle('vk_ayna'); });
  OLAY.on('salonOyun', () => { if (sesB11()) soyle('p_s_salon_giris'); });
  OLAY.on('salonBasla', () => { if (sesB11()) setTimeout(() => { if (!sesSoylendi.vk_ayna && !sesSira.some(s => s.k === 'vk_ayna')) soyle('p_s_salon_giris'); }, 6000); });   // şaka olayı gelmezse yedek
  OLAY.on('salonIpucu', () => { if (sesB11()) ses11Ipucu('p_s_salon_ipucu', () => ses11SalonN, 'salon'); });
  OLAY.on('salonYardim', () => { if (sesB11()) soyle('p_s_salon_yardim'); });
  const SES11_YANSIMA = { sapkaPiril: 'p_s_ayna_sapka', kediDede: 'p_s_ayna_kedi', pitirKirp: 'p_s_ayna_pitir', cilekNine: 'p_s_ayna_cilek', gulenAy: 'p_s_ayna_ay', uzunFeza: 'p_s_ayna_feza' };
  OLAY.on('salonBul', e => { if (!sesB11() || !e) return; ses11SalonN++; const k = SES11_YANSIMA[e.ad]; if (k) setTimeout(() => soyle(k), 350); else if (e.n === 3 && !e.yardim) ses11Ovgu(0.5, 900); });   // her komik yansımaya kısa bir tepki
  OLAY.on('salonVela', () => { if (sesB11()) soyle('vk_salon'); });
  OLAY.on('salonBitti', () => { if (sesB11()) setTimeout(() => soyle('p_s_salon_bitti'), 500); });
  // mini oyun 2: org konseri (org11.js) – Dede karşılar, Pırıl gösterir; cümle sonu dansında Dede neşelenir
  OLAY.on('orgBasla', () => { if (!sesB11()) return; soyle('vd_merhaba'); soyle('p_s_org_giris'); });
  OLAY.on('orgIpucu', () => { if (sesB11()) ses11Ipucu('p_s_org_yardim', () => ses11OrgN, 'org'); });
  OLAY.on('orgYardim', () => { if (sesB11()) soyle('p_s_org_birlikte'); });
  OLAY.on('orgDans', e => { if (!sesB11() || !e) return; if (e.n === 1) soyle('vd_dans'); else if (e.n === 2) soyle('vk_org'); });
  OLAY.on('orgNota', e => { if (sesB11() && e) ses11OrgN++; if (sesB11() && e && e.n === 8 && !e.yardim) ses11Ovgu(0.4, 2600); });
  OLAY.on('orgBitti', () => { if (!sesB11()) return; soyle('vd_tesekkur'); setTimeout(() => soyle('p_s_org_bitti'), 500); });
  // mini oyun 3: Vampir Nine'nin pastası (pasta11.js)
  OLAY.on('pastaBasla', () => { if (!sesB11()) return; soyle('vn_pasta'); soyle('p_s_pasta_giris'); });
  OLAY.on('pastaSus', e => { if (sesB11() && e) ses11PastaN++; if (sesB11() && e && e.n === 3 && !e.yardim) ses11Ovgu(0.4, 800); });
  OLAY.on('pastaKat', e => { if (!sesB11() || !e) return; if (e.kat === 1) soyle('vn_kat1'); else if (e.kat === 2) soyle('vn_kat2'); });
  OLAY.on('pastaBuyukCilek', () => { if (sesB11()) soyle('p_s_pasta_cilek'); });
  OLAY.on('pastaIpucu', () => { if (sesB11()) ses11Ipucu('p_s_pasta_ipucu', () => ses11PastaN, 'pasta'); });
  OLAY.on('pastaYardim', () => { if (sesB11()) soyle('p_s_pasta_yardim'); });
  OLAY.on('pastaKapak', () => { if (sesB11()) soyle('vn_tesekkur'); });
  OLAY.on('pastaBitti', () => { if (!sesB11()) return; soyle('vn_tesekkur'); soyle('vb_mutlu'); setTimeout(() => { if (!ses11Balkon) soyle('p_s_pasta_bitti'); }, 500); });   // balkon çağrısı sıradaysa Pırıl onu söyler (dört cümle art arda olmasın)
  // pelerinle uçuş (ucus11.js)
  let ses11Balkon = false;
  OLAY.on('pelerinUcusHazir', () => { if (sesB11()) { ses11Balkon = true; setTimeout(() => soyle('p_s_balkon'), 1500); } });
  OLAY.on('pelerinUcusBasla', () => { if (sesB11()) soyle('p_s_ucus_giris'); });
  OLAY.on('pelerinUcusVela', () => { if (sesB11()) soyle('vk_ucus'); });
  OLAY.on('pelerinUcusAy', () => { if (sesB11()) soyle('p_s_ucus'); });
  OLAY.on('pelerinUcusSato', () => { if (sesB11()) soyle('p_s_ucus_sato'); });
  OLAY.on('pelerinUcusYardim', () => { if (sesB11()) soyle('p_s_ucus_yardim'); });
  OLAY.on('pelerinUcusIsik', e => { if (!sesB11() || !e || !(e.n > 0) || e.yardim) return; if (e.n === 10) soyle('p_s_ovgu3'); else if (e.n % 7 === 0) ses11Ovgu(0.4); });
  OLAY.on('pelerinUcusBitti', () => { if (sesB11()) setTimeout(() => soyle('p_s_ucus_bitti'), 400); });
  // final: Ay Balosu (balo11.js anları; anlatıcı oyun.js'te 6. sn) – aile sözleri sahne cümlesi gibi sırada bekler
  const ses11Final = (k, ms) => setTimeout(() => { if (sesB11() && typeof DURUM !== 'undefined' && DURUM === 'oyun') soyle(k, { oncelik: 3 }); }, ms || 0);
  OLAY.on('baloFinal', () => { if (sesB11()) soyle('p_s_final'); });
  OLAY.on('baloAy', () => ses11Final('vk_balo', 1000));
  // Dans uzun bir konuşma zinciri olmasın: Pırıl → Vela → anlatıcı → Dede, sonra müzik nefes alır; doruk (27,7. sn) sözsüz ve temiz
  // duyulur (konuşma müziği kısar), Vela teşekkürünü doruktan sonra, kapanış ölçüsünde eder. (Pıtır'ın vb_balo'su finalde söylenmez.)
  OLAY.on('baloVals', () => ses11Final('vd_vals', 2000));
  OLAY.on('baloDoruk', () => ses11Final('vk_tesekkur', 5200));
  setInterval(() => {   // yakınlık / bölge cümleleri: Vela kapıda karşılar, ilk ayna, takılınca ipucu, köprü, mağara, uyuyan yarasalar, galeri, kule terası
    if (!sesB11() || typeof DURUM === 'undefined' || DURUM !== 'oyun' || sesV11('final')) return;
    const p = gP(); if (!p || p.ucus || p.kilit > 0) return;
    const yer = ses11Yer();
    if (!sesSoylendi.vk_merhaba) { const v = gN().find(n => n.tip === 'vampirDurak' && n.kim === 'kiz'); if (v && Math.abs(v.x - p.x) < 5 * T) { soyle('vk_merhaba'); return; } }
    if (!sesSoylendi.p_s_ayna && ses11AynaN === 0 && sesV11('pelerin')) { const m = gN().find(n => n.tip === 'ayAyna' && !n.donmus && n.x > p.x - 2 * T && n.x - p.x < 7 * T); if (m) soyle('p_s_ayna'); }
    if (yer === 'kopru' && !sesSoylendi.p_s_kopru) soyle('p_s_kopru');
    else if (yer === 'magara' && !sesSoylendi.p_s_magara) soyle('p_s_magara');
    else if (yer === 'galeri' && !sesSoylendi.p_s_galeri) soyle('p_s_galeri');
    if (!sesSoylendi.p_s_yarasa && sesSoylendi.p_s_magara) { const y = gN().find(n => n.tip === 'yarasaDekor' && n.uyku && Math.abs(n.x - p.x) < 4 * T); if (y) soyle('p_s_yarasa'); }
    // bekleyen aynanın yanında oyalanıp ona dokunmazsa (≈8 sn) bir kez ipucu
    let h = null; try { h = typeof AYNA11 !== 'undefined' && AYNA11.hedef ? AYNA11.hedef() : null; } catch (e) {}
    if (h && ses11AynaN > 0 && Math.abs(h.x - p.x) < 4 * T) { if (ses11BeklO !== h) { ses11BeklO = h; ses11Bekle = 0; } if ((ses11Bekle += 0.5) >= 8) soyle('p_s_ayna_ipucu'); } else ses11Bekle = 0;
    // kule terasına indi, ay taşına dokunmadan bekliyor
    if (yer === 'balo' && sesV11('ucus')) { if ((ses11BaloT += 0.5) >= 10) soyle('p_s_balo_ipucu'); } else ses11BaloT = 0;
  }, 500);
  OLAY.on('secim', () => { sesSecimT = sesSaat(); });
  OLAY.on('secimIlgi', () => { sesSecimT = sesSaat(); });   // boş dokunuş: yalnız sayaç sıfırlanır (ses çalmaz)
  const sesSecimBasla = d => {
    if (d !== 'baslik' || sesSecimN) return;
    sesSecimN = 1; sesSecimT = sesSaat();
    setTimeout(() => { if (typeof DURUM !== 'undefined' && DURUM === 'baslik') { soyle('p_secim'); sesSecimT = sesSaat(); } }, 1400);
    const bekle = () => {
      if (typeof DURUM === 'undefined' || DURUM !== 'baslik') return;
      if (sesSaat() - sesSecimT >= 25 && !sesCalan && sesSecimN < 2) { sesSecimN = 2; soyle('p_secim'); return; }
      setTimeout(bekle, 2000);
    };
    setTimeout(bekle, 3000);
  };
  OLAY.on('durum', sesSecimBasla);
  setTimeout(() => sesSecimBasla(typeof DURUM !== 'undefined' ? DURUM : ''), 1500);   // 'durum' olayı kaçmışsa
  let sesHazir = false;
  OLAY.on('durum', d => {
    if (d === 'final' || d === 'son') sesSira = sesSira.filter(s => s.oncelik >= 3);   // oyun bitti: kalan ipuçları gereksiz
    if (!sesHazir && !SESSIZ) { sesHazir = true; setTimeout(sesOnceden, 400); }        // ses bağlamı artık var
    sesTik();
  });
  function sus() {   // sahne atlanınca vb.: susar ve sırayı boşaltır
    sesSira = [];
    if (sesCalan) sesKes('sus');
    else if (typeof AU !== 'undefined' && AU.kis) AU.kis(false);
  }
  return { LINES, soyle, sus, konusuyor: () => !!sesCalan, sure: k => LINES[k] ? sesSure(k) : 0, kayit, sira: () => sesSira.map(s => s.k), _sinir: k => LINES[k] ? sesCumleSinirlari({ k, sure: sesSure(k) }).map(x => +x.toFixed(2)) : null };
})();
