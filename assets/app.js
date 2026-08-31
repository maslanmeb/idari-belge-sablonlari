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
  document.querySelectorAll("textarea").forEach(autoGrow);
  requestAnimationFrame(() => {
    document.querySelectorAll("textarea").forEach(autoGrow);
    setTimeout(() => window.print(), 30);
  });
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
  initMirrors();
  initParagraphLists();
  initEkLists();
  initYearAutoIncrement();
  initClosingLines();
});
