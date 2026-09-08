// =======================================================
// İdari Belge Şablonları — ortak davranışlar
// =======================================================

/* ---------- Kalıcı alanlar (okul adı, müdür adı, müdür unvanı) ----------
   Bu değerler localStorage'da tutulur; sayfa içinde aynı anahtara sahip
   TÜM elemanlar (düzenlenebilir ya da salt-okunur) birbirine senkron kalır,
   ve tüm sayfalar arasında hatırlanır.
   HTML: <div data-persist="okulAdi" contenteditable="true">...</div>
         <span data-persist="okulAdi"></span>  (salt-okunur yansıma)
*/
const PERSIST_CONFIG = {
  okulAdi:    { storageKey: "idariBelge_okulAdi",    default: "KUMKALE ORTAOKULU MÜDÜRLÜĞÜ" },
  muduAdi:    { storageKey: "idariBelge_muduAdi",    default: "" },
  muduUnvani: { storageKey: "idariBelge_muduUnvani", default: "Okul Müdürü" }
};

function setPersistValue(key, value, skipEl) {
  const cfg = PERSIST_CONFIG[key];
  if (!cfg) return;
  localStorage.setItem(cfg.storageKey, value);
  document.querySelectorAll(`[data-persist="${key}"]`).forEach((el) => {
    if (el === skipEl) return; // kullanıcının o an yazdığı alanı yeniden yazma (imleç sıçramasın)
    if (el.textContent !== value) el.textContent = value;
  });
}

function initPersistentFields() {
  Object.keys(PERSIST_CONFIG).forEach((key) => {
    const cfg = PERSIST_CONFIG[key];
    const stored = localStorage.getItem(cfg.storageKey);
    const initial = stored !== null ? stored : cfg.default;
    document.querySelectorAll(`[data-persist="${key}"]`).forEach((el) => {
      el.textContent = initial;
    });
    document.querySelectorAll(`[data-persist="${key}"][contenteditable="true"]`).forEach((el) => {
      el.addEventListener("input", () => {
        // Yazarken .trim() UYGULANMAZ: aksi hâlde araya boşluk eklenince imleç oynar.
        setPersistValue(key, el.textContent, el);
      });
      el.addEventListener("blur", () => {
        const trimmed = el.textContent.trim();
        if (!trimmed) {
          el.textContent = cfg.default;
          setPersistValue(key, cfg.default);
        } else if (trimmed !== el.textContent) {
          el.textContent = trimmed;
          setPersistValue(key, trimmed);
        }
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); el.blur(); }
      });
    });
  });
}

function resetPersistentFields() {
  Object.keys(PERSIST_CONFIG).forEach((key) => setPersistValue(key, PERSIST_CONFIG[key].default));
}

/* ---------- Textarea'ları otomatik büyüt ---------- */
function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = (el.scrollHeight + 2) + "px";
}
function initAutoGrow() {
  document.querySelectorAll("textarea").forEach((ta) => {
    autoGrow(ta);
    ta.addEventListener("input", () => autoGrow(ta));
    ta.addEventListener("paste", () => setTimeout(() => autoGrow(ta), 0));
  });
  window.addEventListener("beforeprint", () => {
    document.querySelectorAll("textarea").forEach(autoGrow);
  });
}

/* ---------- Zümre Toplantı Onay Sayfası (yalnızca .gundem-list içeren
   belgede, yani Zümre Toplantı Tutanağı'nda otomatik devreye girer) ----------
   Yazdırmadan/PDF'ten hemen önce sayfanın en başına; başlık, zümre bilgi
   tablosu, seçilen gündem maddelerinin SADECE başlıkları (görüşme/karar yok)
   ve ortalanmış müdür onay/imza alanından oluşan tek sayfalık bir "ön onay"
   sayfası eklenir; ardından kesin bir sayfa sonu ile asıl tutanak başlar.
   Yazdırma bitince ekran görünümünü bozmasın diye kaldırılır. */
function readMetaTableForCover(table) {
  if (!table) return [];
  return Array.from(table.querySelectorAll(":scope > tbody > tr, :scope > tr")).map((tr) => {
    const labelTd = tr.querySelector("td.label");
    const valueTd = tr.querySelectorAll("td")[1];
    const label = labelTd ? labelTd.textContent.trim() : "";
    let value = "";
    if (valueTd) {
      const inputs = valueTd.querySelectorAll("input, select, textarea");
      if (inputs.length) {
        value = Array.from(inputs).map((el) => {
          if (el.type === "date") {
            if (!el.value) return "";
            const [y, m, d] = el.value.split("-");
            return `${d}.${m}.${y}`;
          }
          return el.value || "";
        }).filter(Boolean).join("   ");
      } else {
        value = valueTd.textContent.trim();
      }
    }
    return { label, value };
  }).filter((row) => row.label);
}
function buildZumreOnayCover() {
  const gundemList = document.querySelector(".gundem-list");
  if (!gundemList) return null; // bu belge Zümre Toplantı Tutanağı değil

  const cover = document.createElement("div");
  cover.className = "zumre-onay-cover";

  const titleEl = document.querySelector(".doc-title, h1");
  const h1 = document.createElement("h1");
  h1.className = "doc-title";
  h1.textContent = titleEl ? titleEl.textContent.trim() : "ZÜMRE TOPLANTI TUTANAĞI";
  cover.appendChild(h1);

  const coverSub = document.createElement("div");
  coverSub.className = "zumre-onay-sub";
  coverSub.textContent = "Toplantı Onay Sayfası";
  cover.appendChild(coverSub);

  const metaTable = document.querySelector(".page > table.meta");
  const rows = readMetaTableForCover(metaTable);
  if (rows.length) {
    const table = document.createElement("table");
    table.className = "meta";
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="label" style="width:32%">${r.label}</td><td>${r.value}</td>`;
      table.appendChild(tr);
    });
    cover.appendChild(table);
  }

  const gHeading = document.createElement("div");
  gHeading.className = "section-title";
  gHeading.textContent = "Gündem Maddeleri";
  cover.appendChild(gHeading);

  const gList = document.createElement("div");
  gList.className = "zumre-onay-gundem";
  const items = Array.from(document.querySelectorAll(".gundem-item"));
  let n = 0;
  items.forEach((item) => {
    const t = item.querySelector(".gundem-title");
    const title = t ? t.value.trim() : "";
    if (!title) return;
    n++;
    const row = document.createElement("div");
    row.className = "zumre-onay-gundem-row";
    row.textContent = `${n}. ${title}`;
    gList.appendChild(row);
  });
  if (!n) {
    const row = document.createElement("div");
    row.className = "zumre-onay-gundem-row";
    row.style.fontStyle = "italic";
    row.style.color = "#999";
    row.textContent = "(Gündem maddesi girilmemiş)";
    gList.appendChild(row);
  }
  cover.appendChild(gList);

  // Ortalanmış müdür onay/imza alanı
  const sigWrap = document.querySelector(".sig-wrap");
  const sigRows = sigWrap ? readMetaTableForCover(sigWrap.querySelector("table.meta")) : [];
  const onayTarihi = (sigRows.find((r) => /tarih/i.test(r.label)) || {}).value || "";
  const okulMuduru = (sigRows.find((r) => /müdür/i.test(r.label)) || {}).value || "";

  const sig = document.createElement("div");
  sig.className = "zumre-onay-signature";
  sig.innerHTML = `
    <div class="zumre-onay-imza-box"></div>
    <div class="zumre-onay-name">${okulMuduru || "&nbsp;"}</div>
    <div class="zumre-onay-label">Okul Müdürü${onayTarihi ? " &middot; " + onayTarihi : ""}</div>
  `;
  cover.appendChild(sig);

  return cover;
}
function withZumreCover(fn) {
  const cover = buildZumreOnayCover();
  const pageEl = document.querySelector(".page");
  if (cover && pageEl) pageEl.insertBefore(cover, pageEl.firstChild);
  fn();
  if (cover) {
    const cleanup = () => { cover.remove(); window.removeEventListener("afterprint", cleanup); };
    window.addEventListener("afterprint", cleanup);
    setTimeout(cleanup, 4000); // afterprint tetiklenmezse yine de temizle
  }
}

/* ---------- Yazdır / PDF Al ---------- */
function printForm() {
  if (typeof applyFieldFormatting === "function") applyFieldFormatting();
  document.querySelectorAll("textarea").forEach(autoGrow);
  requestAnimationFrame(() => {
    document.querySelectorAll("textarea").forEach(autoGrow);
    requestAnimationFrame(() => {
      document.querySelectorAll("textarea").forEach(autoGrow);
      withZumreCover(() => {
        setTimeout(() => window.print(), 50);
      });
    });
  });
}

/* ---------- Word'e Kopyala (panoya HTML + düz metin yazar) ----------
   Sayfanın doldurulmuş hâlini, form alanlarının GÜNCEL değerleriyle statik
   metne çevirip panoya kopyalar. Word'ün kendi "HTML'den yapıştır" motoru
   (bir web sayfasından tablo kopyalayıp Word'e yapıştırmakla aynı mekanizma)
   bunu gerçek Word tablosu/paragrafına dönüştürür. Ek kütüphane gerekmez,
   tarayıcının Clipboard API'si kullanılır; hiçbir veri sunucuya gitmez.

   Not: Site bir iframe içine gömülü açıldığında modern Clipboard API bazı
   tarayıcılarda izin vermeyebilir (iframe'in allow="clipboard-write" ile
   izin devretmesi gerekir). Bu durumda eski/legacy execCommand("copy")
   yöntemine otomatik geçilir; o da başarısız olursa kullanıcıya siteyi tam
   sayfada açması önerilir.
*/
function formatFieldForCopy(el) {
  if (el.tagName === "SELECT") {
    return el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : "";
  }
  if (el.type === "checkbox" || el.type === "radio") {
    return el.checked ? "☒" : "☐";
  }
  if (el.type === "date") {
    if (!el.value) return "";
    const [y, m, d] = el.value.split("-");
    return `${d}.${m}.${y}`;
  }
  return el.value || "";
}
function legacyCopyHTML(htmlString) {
  const container = document.createElement("div");
  // Ekranda konumlandırıp opacity:0 ile gizliyoruz (aşırı negatif offset yerine)
  // — bazı tarayıcılar ekran dışına çok uzak taşınan içeriği tam olarak
  // düzenlemeyip (layout) tablo gibi karmaşık yapıları kopyalarken eksik/kesik
  // bırakabiliyor.
  container.style.position = "absolute";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "900px";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-1";
  container.setAttribute("contenteditable", "true");
  container.innerHTML = htmlString;
  document.body.appendChild(container);
  // Tarayıcının içeriği tam olarak düzenlemesi (layout/reflow) için zorla
  // okuma yapıyoruz, sonra seçiyoruz.
  void container.offsetHeight;

  const range = document.createRange();
  range.selectNodeContents(container);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (e) {
    ok = false;
  }
  selection.removeAllRanges();
  document.body.removeChild(container);
  return ok;
}
async function copyForWord() {
  const btn = document.getElementById("copyWordBtn");
  const pageEl = document.querySelector(".page");
  if (!pageEl) return;

  if (typeof applyFieldFormatting === "function") applyFieldFormatting();

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Hazırlanıyor…";

  const clone = pageEl.cloneNode(true);

  clone.querySelectorAll([
    ".dyn-remove", ".p-remove", ".ek-remove", ".ekler-add",
    ".paragraph-list-add", ".note-close", ".dizi-remove", ".dizi-add-row",
    ".gundem-add", ".gundem-remove", ".uye-add", ".uye-remove",
    ".gundem-suggest-dropdown", ".school-hint",
  ].join(",")).forEach((el) => el.remove());

  // Form alanlarının canlı değerlerini klondaki karşılığıyla eşleştirip
  // düz metne çeviriyoruz (cloneNode form alanlarının GÜNCEL .value'sunu
  // değil, ilk HTML özniteliğini kopyalar).
  const liveFields = pageEl.querySelectorAll("input, textarea, select");
  const cloneFields = clone.querySelectorAll("input, textarea, select");
  liveFields.forEach((liveEl, i) => {
    const cloneEl = cloneFields[i];
    if (!cloneEl) return;
    const span = document.createElement("span");
    span.textContent = formatFieldForCopy(liveEl);
    cloneEl.replaceWith(span);
  });

  clone.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));

  // Tablo/etiket hücrelerine temel görsel biçim ekle (Word dış CSS'imizi
  // göremez, sadece satır-içi style'ı okur).
  clone.querySelectorAll("table").forEach((t) => { t.style.borderCollapse = "collapse"; t.style.width = "100%"; });
  clone.querySelectorAll("td, th").forEach((c) => {
    c.style.border = "1px solid #999";
    c.style.padding = "4px 8px";
  });
  clone.querySelectorAll("td.label, th").forEach((c) => {
    c.style.fontWeight = "bold";
    c.style.background = "#f0f0f0";
  });

  const htmlString = `<div>${clone.innerHTML}</div>`;
  const plainString = clone.innerText || clone.textContent || "";
  let success = false;

  // 1) Önce modern Clipboard API'yi dene
  if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([htmlString], { type: "text/html" }),
          "text/plain": new Blob([plainString], { type: "text/plain" }),
        }),
      ]);
      success = true;
    } catch (err) {
      console.warn("Clipboard API başarısız, eski yönteme geçiliyor:", err);
    }
  }

  // 2) Başarısızsa eski (execCommand) yöntemi dene — iframe içinde bazen
  //    bu, izin kısıtlamalarından etkilenmeyebilir.
  if (!success) {
    success = legacyCopyHTML(htmlString);
  }

  if (success) {
    btn.textContent = "✅ Kopyalandı!";
    setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 2200);
  } else {
    alert(
      "Kopyalama şu an çalışmadı. Bu sayfa bir web sitesine gömülü (iframe) açıldığında bazı tarayıcılar panoya erişimi kısıtlayabilir.\n\n" +
      "Öneri: Sayfayı 'Tam sayfada açmak için tıklayın' bağlantısından doğrudan açıp tekrar deneyin, ya da 'Yazdır / PDF Al' / 'PDF İndir' seçeneklerini kullanın."
    );
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

/* ---------- Kapatılabilir bilgi kutuları ---------- */
function initNoteBoxes() {
  document.querySelectorAll(".note-box").forEach((box) => {
    if (box.querySelector(".note-close")) return;
    const btn = document.createElement("button");
    btn.className = "note-close";
    btn.type = "button";
    btn.innerHTML = "&times;";
    btn.setAttribute("aria-label", "Bu bilgi kutusunu kapat");
    btn.addEventListener("click", () => {
      box.style.maxHeight = box.scrollHeight + "px";
      requestAnimationFrame(() => {
        box.style.transition = "max-height .25s ease, opacity .25s ease, margin .25s ease, padding .25s ease";
        box.style.maxHeight = "0px";
        box.style.opacity = "0";
        box.style.marginTop = "0";
        box.style.marginBottom = "0";
        box.style.paddingTop = "0";
        box.style.paddingBottom = "0";
        box.style.overflow = "hidden";
      });
      setTimeout(() => box.remove(), 260);
    });
    box.appendChild(btn);
  });
}

/* ---------- Dinamik maddelenmiş liste (dyn-list) ---------- */
function makeDynRow(placeholder) {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <span class="dyn-num"></span>
    <textarea rows="1" placeholder="${placeholder || ""}"></textarea>
    <button type="button" class="dyn-remove">&times;</button>`;
  return row;
}
function renumberDynList(list) {
  let n = 1;
  list.querySelectorAll(".dyn-row").forEach((row) => {
    const ta = row.querySelector("textarea");
    const num = row.querySelector(".dyn-num");
    const removeBtn = row.querySelector(".dyn-remove");
    const hasText = ta.value.trim().length > 0;
    if (hasText) { num.textContent = n + "."; num.classList.add("show"); n++; }
    else { num.textContent = ""; num.classList.remove("show"); }
    removeBtn.classList.toggle("show", list.querySelectorAll(".dyn-row").length > 1);
  });
}
function bindDynRow(list, row) {
  const ta = row.querySelector("textarea");
  const removeBtn = row.querySelector(".dyn-remove");
  ta.addEventListener("input", () => {
    autoGrow(ta);
    const rows = Array.from(list.querySelectorAll(".dyn-row"));
    const isLast = rows[rows.length - 1] === row;
    if (isLast && ta.value.trim().length > 0) {
      const newRow = makeDynRow(list.dataset.placeholder || "");
      list.appendChild(newRow);
      bindDynRow(list, newRow);
    }
    renumberDynList(list);
  });
  removeBtn.addEventListener("click", () => {
    if (list.querySelectorAll(".dyn-row").length <= 1) { ta.value = ""; autoGrow(ta); renumberDynList(list); return; }
    row.remove();
    renumberDynList(list);
  });
}
function initDynLists() {
  document.querySelectorAll(".dyn-list").forEach((list) => {
    if (list.querySelector(".dyn-row")) list.querySelectorAll(".dyn-row").forEach((row) => bindDynRow(list, row));
    else { const row = makeDynRow(list.dataset.placeholder || ""); list.appendChild(row); bindDynRow(list, row); }
    renumberDynList(list);
  });
}

/* ---------- Mirror sistemi (aynı sayfa içinde canlı yansıma) ---------- */
function formatMirrorValue(sourceEl) {
  if (sourceEl.tagName === "INPUT" && sourceEl.type === "date") {
    if (!sourceEl.value) return "";
    const [y, m, d] = sourceEl.value.split("-");
    return `${d}.${m}.${y}`;
  }
  if (sourceEl.matches("[contenteditable]")) return sourceEl.textContent.trim();
  return sourceEl.value !== undefined ? sourceEl.value : sourceEl.textContent;
}
function updateMirror(key) {
  const sources = document.querySelectorAll(`[data-mirror="${key}"]`);
  let val = "";
  sources.forEach((s) => { const v = formatMirrorValue(s); if (v) val = v; });
  document.querySelectorAll(`[data-mirror-target="${key}"]`).forEach((t) => {
    if (val) { t.textContent = val; t.classList.remove("empty"); }
    else { t.textContent = "……………"; t.classList.add("empty"); }
  });
}
function initMirrors() {
  const keys = new Set();
  document.querySelectorAll("[data-mirror]").forEach((el) => keys.add(el.dataset.mirror));
  keys.forEach((key) => {
    document.querySelectorAll(`[data-mirror="${key}"]`).forEach((el) => {
      el.addEventListener("input", () => updateMirror(key));
      el.addEventListener("change", () => updateMirror(key));
    });
    updateMirror(key);
  });
  return keys;
}

/* ---------- Paragraf listesi (numarasız, manuel ekle/sil) ---------- */
function makeParagraphRow() {
  const row = document.createElement("div");
  row.className = "p-row";
  row.innerHTML = `<textarea rows="2" placeholder="Paragraf yazınız..." autocomplete="off"></textarea><button type="button" class="p-remove">&times;</button>`;
  bindParagraphRow(row);
  return row;
}
function bindParagraphRow(row) {
  const ta = row.querySelector("textarea");
  ta.addEventListener("input", () => autoGrow(ta));
  autoGrow(ta);
  row.querySelector(".p-remove").addEventListener("click", () => {
    const list = row.parentElement;
    if (list.querySelectorAll(".p-row").length <= 1) { ta.value = ""; autoGrow(ta); return; }
    row.remove();
  });
}
function initParagraphLists() {
  document.querySelectorAll(".paragraph-list").forEach((list) => {
    const existing = list.querySelectorAll(".p-row");
    if (existing.length) existing.forEach(bindParagraphRow);
    else list.appendChild(makeParagraphRow());
  });
  document.querySelectorAll(".paragraph-list-add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const list = document.getElementById(btn.dataset.target);
      if (!list) return;
      const row = makeParagraphRow();
      list.appendChild(row);
      row.querySelector("textarea").focus();
    });
  });
}
function resetParagraphList(list) {
  list.innerHTML = "";
  list.appendChild(makeParagraphRow());
}

/* ---------- Ekler listesi (Ek-1, Ek-2..., çerçevesiz, başlangıçta boş) ---------- */
function renumberEkList(list) {
  list.querySelectorAll(".ek-row").forEach((row, i) => {
    row.querySelector(".ek-no").textContent = `Ek-${i + 1})`;
  });
  const block = list.closest("[data-ekler-block]");
  if (block) block.classList.toggle("ekler-empty", list.querySelectorAll(".ek-row").length === 0);
}
function makeEkRow(list) {
  const row = document.createElement("div");
  row.className = "ek-row";
  row.innerHTML = `<span class="ek-no"></span><input type="text" placeholder="ek adı" autocomplete="off"><button type="button" class="ek-remove">&times;</button>`;
  row.querySelector(".ek-remove").addEventListener("click", () => {
    row.remove();
    renumberEkList(list);
  });
  return row;
}
function initEkLists() {
  document.querySelectorAll(".ekler-add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const list = document.getElementById(btn.dataset.target);
      if (!list) return;
      const row = makeEkRow(list);
      list.appendChild(row);
      renumberEkList(list);
      row.querySelector("input").focus();
    });
  });
  document.querySelectorAll(".ek-list").forEach((list) => {
    list.querySelectorAll(".ek-row").forEach((row) => {
      row.querySelector(".ek-remove").addEventListener("click", () => { row.remove(); renumberEkList(list); });
    });
    renumberEkList(list);
  });
}
function resetEkList(list) {
  list.innerHTML = "";
  renumberEkList(list);
}

/* ---------- Gündem listesi (başlık + karar metni, ekle/sil, otomatik numaralı) ----------
   HTML: <div class="gundem-list" id="gundemList"></div>
         <button type="button" class="gundem-add" data-target="gundemList">+ Gündem Maddesi Ekle</button>
*/

// MEB Eğitim Kurulları ve Zümreleri Yönergesi Md.12/8 — eğitim kurumu sınıf/alan
// zümreleri gündem maddelerinin tamamı (27 bent) + "Diğer". "recommended:true"
// olanlar en sık kullanılanlardır; öneri kutusunda "(önerilir)" etiketiyle
// gösterilir ama seçildiğinde belgeye sadece temiz başlık yazılır.
const GUNDEM_ONERILERI = [
  { text: "Bir önceki toplantıda alınan kararların değerlendirilmesi", recommended: true },
  { text: "Planlamaların ilgili mevzuata ve öğretim programına uygun yapılması", recommended: false },
  { text: "Yıllık plan ve ders planlarının hazırlanması (konu/kazanım ağırlıkları)", recommended: true },
  { text: "Ders işleniş yöntem/tekniklerinin ve okul temelli faaliyetlerin planlanması", recommended: false },
  { text: "Bireyselleştirilmiş Eğitim Programları (BEP) ve farklılaştırılmış uygulamaların görüşülmesi", recommended: true },
  { text: "Zümre içi ders ziyareti yapılması ve geri dönütlerin değerlendirilmesi", recommended: false },
  { text: "Alanla ilgili akademik ve teknolojik gelişmelerin takip edilmesi", recommended: false },
  { text: "Öğrencilerde girişimcilik, araştırma-geliştirme-tasarım becerilerinin geliştirilmesi", recommended: false },
  { text: "Ders araç-gereç ve eğitim materyali ihtiyaçlarının belirlenmesi", recommended: true },
  { text: "Gezi, gözlem ve okul dışı öğrenme ortamlarının planlanması", recommended: true },
  { text: "Sınav sonuçlarının analizi ve eylem planlarının hazırlanması", recommended: true },
  { text: "Ortak sınav soru/cevap anahtarı, dereceli puanlama anahtarı ve beceri sınavlarının planlanması", recommended: true },
  { text: "Ulusal/uluslararası sınav ve yarışma sonuçlarının değerlendirilmesi", recommended: false },
  { text: "Uygulamalı derslerde (görsel sanatlar, müzik, beden eğitimi vb.) değerlendirme ölçütlerinin belirlenmesi", recommended: false },
  { text: "Proje ve performans çalışmalarının belirlenmesi ve değerlendirme ölçeklerinin hazırlanması", recommended: true },
  { text: "İş sağlığı ve güvenliği tedbirlerinin değerlendirilmesi", recommended: true },
  { text: "İlçe geneli ortak yazılı sınavların değerlendirme işlemlerinin yapılması", recommended: false },
  { text: "Merkezi mazeret sınavlarının uygulanması", recommended: false },
  { text: "Okul geneli mazeret sınavı soru ve cevap anahtarının hazırlanması", recommended: false },
  { text: "Öğrencilerin üst düzey düşünme ve sosyal-duygusal becerilerinin geliştirilmesi", recommended: false },
  { text: "Millî, manevi ve ahlaki değerlerin örtük öğrenme yoluyla işlenmesi", recommended: false },
  { text: "Önleme, müdahale ve yönlendirme komisyonu çalışmalarının planlanması", recommended: false },
  { text: "Disiplinler arası yaklaşımla ortak çalışmaların planlanması", recommended: false },
  { text: "Çoklu okuryazarlık ve öğrencinin bütüncül gelişimine yönelik çalışmalar", recommended: false },
  { text: "Sosyal sorumluluk programı kapsamında ders bazlı faaliyetlerin planlanması", recommended: false },
  { text: "Faaliyetler için araç-gereç ve mali kaynak ihtiyacının belirlenmesi", recommended: false },
  { text: "Okul öncesi/ilkokulda öğrenci gelişim takibinin planlanması (gözlem formları, oyun temelli değerlendirme)", recommended: false },
  { text: "Diğer", recommended: false },
];

function renumberGundemList(list) {
  list.querySelectorAll(".gundem-item").forEach((item, i) => {
    item.querySelector(".gundem-num").textContent = (i + 1) + ".";
  });
}
function bindGundemSuggest(input) {
  if (input.dataset.suggestBound) return;
  input.dataset.suggestBound = "1";
  const wrap = input.parentElement;
  wrap.style.position = "relative";
  const dropdown = document.createElement("div");
  dropdown.className = "gundem-suggest-dropdown";
  wrap.appendChild(dropdown);

  function renderList() {
    const f = input.value.toLocaleLowerCase("tr");
    const matches = GUNDEM_ONERILERI.filter((o) => o.text.toLocaleLowerCase("tr").includes(f));
    if (!matches.length) { dropdown.style.display = "none"; return; }
    dropdown.innerHTML = matches
      .map((o) => `<div class="suggest-item" data-value="${o.text.replace(/"/g, "&quot;")}">${o.text}${o.recommended ? ' <span class="suggest-tag">(önerilir)</span>' : ""}</div>`)
      .join("");
    dropdown.style.display = "block";
  }
  input.addEventListener("focus", renderList);
  input.addEventListener("input", () => { autoGrow(input); renderList(); });
  autoGrow(input);
  input.addEventListener("blur", () => setTimeout(() => { dropdown.style.display = "none"; }, 150));
  dropdown.addEventListener("mousedown", (e) => {
    const item = e.target.closest(".suggest-item");
    if (!item) return;
    input.value = item.dataset.value;
    autoGrow(input);
    dropdown.style.display = "none";
    input.focus();
  });
}
function bindGundemItem(item) {
  const ozet = item.querySelector(".gundem-ozet");
  const karar = item.querySelector(".gundem-karar");
  [ozet, karar].forEach((ta) => {
    // 'input' anlık yazarken, 'paste' büyük metin yapıştırıldığında (bazı
    // tarayıcılarda input olayı yapıştırmadan hemen sonra tam boyu
    // yansıtmayabiliyor, bu yüzden paste'te bir sonraki tick'te tekrar ölçüyoruz)
    ta.addEventListener("input", () => autoGrow(ta));
    ta.addEventListener("paste", () => setTimeout(() => autoGrow(ta), 0));
    autoGrow(ta);
  });
  bindGundemSuggest(item.querySelector(".gundem-title"));
  item.querySelector(".gundem-remove").addEventListener("click", () => {
    const list = item.closest(".gundem-list");
    if (list.querySelectorAll(".gundem-item").length <= 1) {
      const titleEl = item.querySelector(".gundem-title");
      titleEl.value = "";
      autoGrow(titleEl);
      ozet.value = "";
      autoGrow(ozet);
      karar.value = "";
      autoGrow(karar);
      return;
    }
    item.remove();
    renumberGundemList(list);
  });
}
function makeGundemItem() {
  const item = document.createElement("div");
  item.className = "gundem-item";
  item.innerHTML = `
    <div class="gundem-item-head">
      <span class="gundem-num"></span>
      <textarea rows="1" class="gundem-title" placeholder="Gündem maddesi başlığı" autocomplete="off"></textarea>
      <button type="button" class="gundem-remove">&times;</button>
    </div>
    <div class="gundem-sub-label">Görüşme Özeti</div>
    <textarea rows="2" class="gundem-ozet" placeholder="Görüşme özeti..." autocomplete="off"></textarea>
    <div class="gundem-sub-label">KARAR:</div>
    <textarea rows="2" class="gundem-karar" placeholder="Alınan karar..." autocomplete="off"></textarea>`;
  bindGundemItem(item);
  return item;
}
function initGundemLists() {
  document.querySelectorAll(".gundem-list").forEach((list) => {
    const existing = list.querySelectorAll(".gundem-item");
    if (existing.length) existing.forEach(bindGundemItem);
    else list.appendChild(makeGundemItem());
    renumberGundemList(list);
  });
  document.querySelectorAll(".gundem-add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const list = document.getElementById(btn.dataset.target);
      if (!list) return;
      const item = makeGundemItem();
      list.appendChild(item);
      renumberGundemList(list);
      item.querySelector(".gundem-title").focus();
    });
  });
}
function resetGundemList(list) {
  list.innerHTML = "";
  list.appendChild(makeGundemItem());
  renumberGundemList(list);
}

/* ---------- Katılımcı/üye tablosu (Ad Soyad + Katıldı mı + İmza, ekle/sil) ----------
   HTML: <table class="uye-table"><tbody id="uyeBody"></tbody></table>
         <button type="button" class="uye-add" data-target="uyeBody">+ Üye Ekle</button>
*/
function renumberUyeTable(tbody) {
  tbody.querySelectorAll(".uye-row").forEach((row, i) => {
    row.querySelector(".uye-num").textContent = i + 1;
    row.querySelector(".uye-remove").classList.toggle("show", tbody.querySelectorAll(".uye-row").length > 1);
  });
}
function bindUyeRow(row) {
  row.querySelector(".uye-remove").addEventListener("click", () => {
    const tbody = row.closest("tbody");
    if (tbody.querySelectorAll(".uye-row").length <= 1) {
      row.querySelectorAll("input").forEach((i) => (i.value = ""));
      return;
    }
    row.remove();
    renumberUyeTable(tbody);
  });
}
function makeUyeRow() {
  const row = document.createElement("tr");
  row.className = "uye-row";
  row.innerHTML = `
    <td class="uye-num"></td>
    <td><input type="text" placeholder="Adı Soyadı" autocomplete="off"></td>
    <td><input type="text" placeholder="Unvanı" autocomplete="off"></td>
    <td class="uye-imza"></td>
    <td><button type="button" class="uye-remove">&times;</button></td>`;
  bindUyeRow(row);
  return row;
}
function initUyeTables() {
  document.querySelectorAll(".uye-table tbody").forEach((tbody) => {
    tbody.querySelectorAll(".uye-row").forEach(bindUyeRow);
    renumberUyeTable(tbody);
  });
  document.querySelectorAll(".uye-add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tbody = document.getElementById(btn.dataset.target);
      if (!tbody) return;
      const row = makeUyeRow();
      tbody.appendChild(row);
      renumberUyeTable(tbody);
      row.querySelector("input").focus();
    });
  });
}
function resetUyeTable(tbody) {
  tbody.innerHTML = "";
  tbody.appendChild(makeUyeRow());
  renumberUyeTable(tbody);
}

/* ---------- Yıl kutuları: ilk kutu doldurulunca ikinci otomatik +1 ---------- */
function initYearAutoIncrement() {
  document.querySelectorAll("[data-year-pair]").forEach((pairEl) => {
    const first = pairEl.querySelector(".year-first");
    const second = pairEl.querySelector(".year-second");
    if (!first || !second) return;
    second.dataset.autoset = second.dataset.autoset || "1";
    first.addEventListener("input", () => {
      first.value = first.value.replace(/\D/g, "").slice(0, 4);
      if (first.value.length === 4 && second.dataset.autoset === "1") {
        second.value = String(parseInt(first.value, 10) + 1);
      }
    });
    second.addEventListener("input", () => {
      second.value = second.value.replace(/\D/g, "").slice(0, 4);
      second.dataset.autoset = "0";
    });
  });
}
function resetYearPairs() {
  document.querySelectorAll("[data-year-pair]").forEach((pairEl) => {
    const second = pairEl.querySelector(".year-second");
    if (second) second.dataset.autoset = "1";
  });
}

/* ---------- Kapanış cümlesi (varsayılana dönebilir, düzenlenebilir) ---------- */
function initClosingLines() {
  document.querySelectorAll(".closing-line").forEach((el) => {
    if (!el.dataset.default) el.dataset.default = el.textContent.trim();
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });
  });
}
function resetClosingLines() {
  document.querySelectorAll(".closing-line").forEach((el) => {
    el.textContent = el.dataset.default || el.textContent;
  });
}

/* ---------- Alan biçimlendirme: TC Kimlik No / Telefon / E-posta ----------
   Kullanıcı nasıl yazarsa yazsın, alandan çıkınca (blur) ve yazdırmadan hemen
   önce standart biçime dönüştürülür. Mirror ile bağlıysa hedef de güncellenir.
*/
function onlyDigits(s, maxLen) {
  return s.replace(/\D/g, "").slice(0, maxLen);
}
function formatTCDisplay(raw) {
  const d = onlyDigits(raw, 11);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 8), d.slice(8, 11)].filter((p) => p.length).join(" ");
}
function formatPhoneDisplay(raw) {
  let d = onlyDigits(raw, 11);
  if (d && d.charAt(0) !== "0") d = ("0" + d).slice(0, 11); // 0 ile başlamıyorsa otomatik eklenir
  let out = d.slice(0, 4);
  if (d.length > 4) out += " - " + d.slice(4, 7);
  if (d.length > 7) out += " " + d.slice(7, 9);
  if (d.length > 9) out += " " + d.slice(9, 11);
  return out;
}
function getFieldText(el) {
  return el.matches("[contenteditable]") ? el.textContent : el.value;
}
function setFieldText(el, val) {
  if (el.matches("[contenteditable]")) el.textContent = val;
  else el.value = val;
}
function applyFieldFormatting() {
  document.querySelectorAll(".tc-field").forEach((el) => {
    setFieldText(el, formatTCDisplay(getFieldText(el)));
    if (el.dataset.mirror && typeof updateMirror === "function") updateMirror(el.dataset.mirror);
  });
  document.querySelectorAll('input[type="tel"]').forEach((el) => {
    el.value = formatPhoneDisplay(el.value);
    if (el.dataset.mirror && typeof updateMirror === "function") updateMirror(el.dataset.mirror);
  });
  document.querySelectorAll('input[type="email"]').forEach((el) => {
    el.value = el.value.toLowerCase();
    if (el.dataset.mirror && typeof updateMirror === "function") updateMirror(el.dataset.mirror);
  });
}
function initFieldFormatting() {
  // Yazarken: sadece rakamları sınırlar (11 hane), boşluklu biçim alandan çıkınca uygulanır.
  document.querySelectorAll('.tc-field, input[type="tel"]').forEach((el) => {
    const isCE = el.matches("[contenteditable]");
    el.addEventListener("input", () => {
      const capped = onlyDigits(getFieldText(el), 11);
      if (getFieldText(el) !== capped) {
        setFieldText(el, capped);
        if (isCE) { // imleci sona al (contenteditable'da textContent değişince imleç başa sıçrar)
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(el);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    });
    el.addEventListener("blur", () => {
      setFieldText(el, el.classList.contains("tc-field") ? formatTCDisplay(getFieldText(el)) : formatPhoneDisplay(getFieldText(el)));
      if (el.dataset.mirror && typeof updateMirror === "function") updateMirror(el.dataset.mirror);
    });
  });
  document.querySelectorAll('input[type="email"]').forEach((el) => {
    el.addEventListener("blur", () => {
      el.value = el.value.toLowerCase();
      if (el.dataset.mirror && typeof updateMirror === "function") updateMirror(el.dataset.mirror);
    });
  });
}

/* ---------- Formu temizle ---------- */
function clearForm() {
  if (!confirm("Bu formdaki tüm bilgiler silinecek (okul adı ve müdür bilgileri dahil). Emin misiniz?")) return;

  document.querySelectorAll("input").forEach((el) => {
    if (el.type === "checkbox" || el.type === "radio") el.checked = false;
    else el.value = "";
  });
  document.querySelectorAll("select").forEach((el) => (el.selectedIndex = 0));

  document.querySelectorAll(".dyn-list").forEach((list) => {
    list.innerHTML = "";
    const row = makeDynRow(list.dataset.placeholder || "");
    list.appendChild(row);
    bindDynRow(list, row);
  });

  document.querySelectorAll(".paragraph-list").forEach(resetParagraphList);
  document.querySelectorAll(".ek-list").forEach(resetEkList);
  document.querySelectorAll(".gundem-list").forEach(resetGundemList);
  document.querySelectorAll(".uye-table tbody").forEach(resetUyeTable);
  resetYearPairs();
  resetClosingLines();

  document.querySelectorAll(".inline-fit").forEach((el) => (el.textContent = ""));

  document.querySelectorAll("textarea:not(.dyn-list textarea):not(.paragraph-list textarea)").forEach((el) => {
    el.value = "";
    autoGrow(el);
  });

  resetPersistentFields();

  const keys = new Set();
  document.querySelectorAll("[data-mirror]").forEach((el) => keys.add(el.dataset.mirror));
  keys.forEach(updateMirror);
}

/* ---------- Gizlilik: paylaşılan bilgisayarlarda tarayıcı otomatik-doldurma
   önerilerinin önceki kullanıcının verilerini göstermesini engelle ---------- */
function disableAutofill() {
  document.querySelectorAll("input, textarea, select").forEach((el) => {
    if (!el.hasAttribute("autocomplete")) el.setAttribute("autocomplete", "off");
  });
}

/* ---------- Başlat ---------- */
document.addEventListener("DOMContentLoaded", () => {
  disableAutofill();
  initPersistentFields();
  initAutoGrow();
  initNoteBoxes();
  initDynLists();
  initFieldFormatting();
  initMirrors();
  initParagraphLists();
  initEkLists();
  initGundemLists();
  initUyeTables();
  initYearAutoIncrement();
  initClosingLines();
});
