# İdari Belgeler Uygulama Kiti

Sürekli kullanılan resmî yazışma ve dilekçe şablonlarının, tarayıcıda doldurulup
doğrudan A4 PDF olarak kaydedilebilen statik web sürümü.

## Yapı

```
index.html                          → Ana sayfa: 4 belgeye kart erişimi
belgeler/teblig-tebellug.html       → Tebliğ – Tebellüğ Belgesi (2 nüsha)
belgeler/ayakta-tedavi-beyan.html   → Ayakta Tedavi Beyan Belgesi (2 nüsha)
belgeler/personel-dilekce.html      → Personel Dilekçe Şablonu
belgeler/diploma-kayit-ornegi.html  → Diploma Kayıt Örneği Dilekçesi
belgeler/ogrenci-servisi-kvkk-onay.html → Öğrenci Servisi KVKK Açık Rıza Onayı
assets/style.css                    → Ortak stil (kumkale-yaptirim-kiti projesiyle aynı temel)
assets/app.js                       → Ortak davranışlar + bu projeye özgü mekanizmalar
netlify.toml                        → Netlify yayın ayarları
```

## Bu projeye özgü mekanizmalar (app.js)

- **Kalıcı alanlar** (`data-persist="okulAdi|muduAdi|muduUnvani"`): localStorage'da
  saklanır, aynı anahtara sahip tüm elemanlar (düzenlenebilir + salt-okunur) senkron kalır.
- **Mirror sistemi** (`data-mirror="key"` → `data-mirror-target="key"`): sayfa içi canlı
  yansıma; 2 nüshalı belgelerde üst nüshaya girilen veri alt nüshaya otomatik yansır.
  Tarih alanları `gg.aa.yyyy` biçiminde yansır.
- **Paragraf listesi** (`.paragraph-list`): numarasız, manuel ekle/sil butonlu serbest
  metin blokları.
- **Ekler listesi** (`.ek-list`): "Ek-1)", "Ek-2)"... otomatik numaralanan, çerçevesiz,
  başlangıçta boş liste; boşsa yazdırmada başlık gizlenir.
- **Satır içi genişleyen alan** (`.inline-fit`): sabit genişliği olmayan, içeriğe göre
  büyüyen contenteditable span (paragraf akışı içinde doğal görünüm için).
- **Yıl kutusu çifti** (`[data-year-pair]` içindeki `.year-first` / `.year-second`):
  ilk kutuya 4 haneli yıl girilince ikinci kutu otomatik +1 ile dolar.
- **Formu Temizle**: bu projede okul adı + müdür adı + müdür unvanını da varsayılana
  döndürür (kumkale-yaptirim-kiti'nden farklı davranış, bilinçli tercih).

## Yayın

Repo Netlify'a bağlandığında `netlify.toml` ile otomatik yayınlanır; build adımı yoktur.
