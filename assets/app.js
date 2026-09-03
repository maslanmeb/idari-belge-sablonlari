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
  });
  window.addEventListener("beforeprint", () => {
    document.querySelectorAll("textarea").forEach(autoGrow);
  });
}

/* ---------- Yazdır / PDF Al ---------- */
function printForm() {
  if (typeof applyFieldFormatting === "function") applyFieldFormatting();
  document.querySelectorAll("textarea").forEach(autoGrow);
  requestAnimationFrame(() => {
    document.querySelectorAll("textarea").forEach(autoGrow);
    setTimeout(() => window.print(), 30);
  });
}

/* ---------- PDF İndir (tarayıcı bağımsız, doğrudan indirme) ----------
   window.print()'e değil html2canvas + jsPDF'e dayanır: sayfa bir görüntüye
   dönüştürülüp A4 ölçülerinde bir PDF'e gömülür ve doğrudan indirilir.
   Bu sayede kenar boşluğu/hizalama hangi tarayıcı/cihazda açılırsa açılsın
   birebir aynı kalır. Bedeli: PDF içindeki metin artık seçilebilir/aranabilir
   değildir (görüntü olarak gömülüdür). Tüm işlem tarayıcıda yapılır, hiçbir
   veri sunucuya gönderilmez.
*/
async function downloadPDF() {
  const btn = document.getElementById("pdfDownloadBtn");
  const pageEl = document.querySelector(".page");
  if (!pageEl || !window.html2canvas || typeof window.jspdf === "undefined") {
    alert("PDF indirme kütüphaneleri yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin, ya da 'Yazdır / PDF Al' seçeneğini kullanın.");
    return;
  }

  if (typeof applyFieldFormatting === "function") applyFieldFormatting();
  document.querySelectorAll("textarea").forEach(autoGrow);

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Hazırlanıyor…";

  // Ekran-only etkileşim öğelerini (ekle/sil butonları, ipuçları) geçici gizle
  const hideSelector = [
    ".dyn-remove", ".p-remove", ".ek-remove", ".ekler-add",
    ".paragraph-list-add", ".note-close", ".dizi-remove", ".dizi-add-row",
    ".school-hint",
  ].join(",");
  const hidden = [];
  pageEl.querySelectorAll(hideSelector).forEach((el) => {
    hidden.push([el, el.style.display]);
    el.style.display = "none";
  });
  const prevShadow = pageEl.style.boxShadow;
  pageEl.style.boxShadow = "none";

  // Alt bilgi (okul adı / kit adı) ayrı yakalanır; ana içerikten geçici
  // gizlenir ki her sayfaya biz kendimiz, sayfanın en altına sabit şekilde
  // ekleyelim (yazdırmadaki position:fixed davranışını taklit eder).
  const footEl = pageEl.querySelector(".foot");
  const footPrevDisplay = footEl ? footEl.style.display : null;

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    let footCanvas = null;
    if (footEl) {
      footCanvas = await window.html2canvas(footEl, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      footEl.style.display = "none";
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }

    const canvas = await window.html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    if (footEl) footEl.style.display = footPrevDisplay;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    // Her sayfada (kaç sayfa olursa olsun) sabit kenar boşluğu bırakılır.
    // Görüntü gerçek dilimlere bölünür, her dilim kendi sayfasına aynı
    // boşlukla yerleştirilir — böylece sayfa geçişlerinde de üst/alt boşluk
    // her zaman korunur (yazdırma ile tutarlı görünüm).
    const marginMm = 12;
    const pageWidthMm = 210;
    const pageHeightMmFull = 297;
    const drawWidthMm = pageWidthMm - marginMm * 2;
    const drawHeightMm = pageHeightMmFull - marginMm * 2;

    let pxPerMm = canvas.width / drawWidthMm;
    const totalHeightMm = canvas.height / pxPerMm;

    // Tek sayfadan az bir miktar (%5'e kadar) taşıyorsa, gereksiz bir "2.
    // sayfa" açmak yerine görüntüyü hafifçe küçültüp tek sayfaya sığdır.
    if (totalHeightMm > drawHeightMm && totalHeightMm <= drawHeightMm * 1.05) {
      pxPerMm = canvas.height / drawHeightMm;
    }

    // Alt bilginin mm cinsinden boyutu (varsa) — her sayfada aynı yerde durur.
    let footWidthMm = 0, footHeightMm = 0, footData = null;
    if (footCanvas) {
      footWidthMm = drawWidthMm;
      footHeightMm = (footCanvas.height * footWidthMm) / footCanvas.width;
      footData = footCanvas.toDataURL("image/jpeg", 0.95);
    }

    const sliceHeightPx = Math.floor(drawHeightMm * pxPerMm);
    const totalSlices = Math.max(1, Math.ceil(canvas.height / sliceHeightPx));

    for (let i = 0; i < totalSlices; i++) {
      const sy = i * sliceHeightPx;
      const sh = Math.min(sliceHeightPx, canvas.height - sy);
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sh;
      const ctx = sliceCanvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);
      const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95);
      const sliceWidthMm = canvas.width / pxPerMm;
      const sliceHeightMmVal = sh / pxPerMm;
      const xOffset = marginMm + (drawWidthMm - sliceWidthMm) / 2;
      if (i > 0) pdf.addPage();
      pdf.addImage(sliceData, "JPEG", xOffset, marginMm, sliceWidthMm, sliceHeightMmVal);
      if (footData) {
        const footY = pageHeightMmFull - marginMm - footHeightMm;
        pdf.addImage(footData, "JPEG", marginMm, footY, footWidthMm, footHeightMm);
      }
    }

    const cleanTitle = document.title.replace(/[\\/:*?"<>|]/g, "").trim() || "belge";
    pdf.save(cleanTitle + ".pdf");
  } catch (err) {
    console.error(err);
    alert("PDF oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin ya da 'Yazdır / PDF Al' seçeneğini kullanın.");
  } finally {
    if (footEl) footEl.style.display = footPrevDisplay;
    hidden.forEach(([el, disp]) => { el.style.display = disp; });
    pageEl.style.boxShadow = prevShadow;
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
  row.innerHTML = `<textarea rows="2" placeholder="Paragraf yazınız..."></textarea><button type="button" class="p-remove">&times;</button>`;
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
  row.innerHTML = `<span class="ek-no"></span><input type="text" placeholder="ek adı"><button type="button" class="ek-remove">&times;</button>`;
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

/* ---------- Başlat ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initPersistentFields();
  initAutoGrow();
  initNoteBoxes();
  initDynLists();
  initFieldFormatting();
  initMirrors();
  initParagraphLists();
  initEkLists();
  initYearAutoIncrement();
  initClosingLines();
});
