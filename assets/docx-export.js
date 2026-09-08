/* =========================================================================
   docx-export.js — Genel amaçlı "doldurulmuş HTML formu -> gerçek .docx"
   dönüştürücü. Tüm belge şablonlarında ORTAK olarak kullanılır; yeni bir
   belge eklendiğinde de otomatik çalışır (bilinen bileşen sınıflarını
   tanır: table.meta, .para, .section-title, .paragraph-list, .ek-list,
   .dyn-list, .gundem-list, .uye-table, .dizi-table, .nusha, .choice-row,
   .note-box, vb.)

   Kullanım: sayfada docx (UMD) yüklü olmalı, sonra:
     await downloadWord();
   ========================================================================= */

(function () {
  const NAVY = "1F3864";
  const LABEL_BG = "EEF2F8";
  const HEAD_BG = "1F3864";
  const LINE = "BFBFBF";
  const MUTED = "777777";
  const MARGIN = 1000; // twips
  const PAGE_W = 11906; // A4
  const USABLE_W = PAGE_W - MARGIN * 2;

  // Bu sınıflara sahip elemanlar ve altındaki her şey dönüştürmeye hiç dahil edilmez.
  const SKIP_SELECTOR = [
    ".toolbar", ".school-hint", ".section-sub", ".section-note",
    ".dyn-remove", ".p-remove", ".ek-remove", ".ekler-add", ".paragraph-list-add",
    ".note-close", ".dizi-remove", ".dizi-add-row", ".gundem-add", ".gundem-remove",
    ".uye-add", ".uye-remove", ".gundem-suggest-dropdown", ".dyn-num", ".nusha-divider",
    "hr.section-rule",
  ].join(",");

  function isSkippable(el) {
    return el.matches && el.matches(SKIP_SELECTOR);
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    const [y, m, d] = parts;
    return `${d}.${m}.${y}`;
  }

  // Bir elemanın "canlı" görünür metnini döndürür: input/textarea/select ise
  // .value'sunu (biçimlendirilmiş), contenteditable/düz metin ise textContent'i.
  function liveText(el) {
    const tag = el.tagName;
    if (tag === "SELECT") {
      return el.options[el.selectedIndex] ? el.options[el.selectedIndex].text.trim() : "";
    }
    if (tag === "INPUT") {
      if (el.type === "checkbox" || el.type === "radio") return el.checked ? "☒" : "☐";
      if (el.type === "date") return fmtDate(el.value);
      return (el.value || "").trim();
    }
    if (tag === "TEXTAREA") {
      return (el.value || "").trim();
    }
    return (el.textContent || "").trim();
  }

  // Bir konteynerin (ör. bir .para div'i) içindeki tüm form alanlarını ve
  // contenteditable alanlarını canlı değerleriyle birleştirip TEK bir metin
  // olarak döndürür (cümle-içi inline-fit alanları dahil doğal akışta).
  function collectText(container) {
    const clone = container.cloneNode(true);
    clone.querySelectorAll(SKIP_SELECTOR).forEach((el) => el.remove());
    // ÖNEMLİ: hem orijinal hem klon alan listelerini SABİT (statik) diziler
    // olarak BİR KEZ alıyoruz. Klon DOM'unu elemanları teker teker
    // değiştirerek dolaşırsak, her adımda yeniden sorgulama yapmak kalan
    // eleman sayısını değiştirip indeks kaymasına (ve yanlış eşleşmeye)
    // yol açar — özellikle aynı hücrede birden fazla alan olduğunda.
    const origFields = container.querySelectorAll("input, textarea, select");
    const cloneFields = Array.prototype.slice.call(clone.querySelectorAll("input, textarea, select"));
    cloneFields.forEach((el, idx) => {
      const original = origFields[idx];
      const span = clone.ownerDocument.createTextNode((original ? liveText(original) : "") + " ");
      el.replaceWith(span);
    });
    return (clone.textContent || "").replace(/\s+/g, " ").trim();
  }

  function cellBorder() {
    return {
      top: { style: "single", size: 4, color: LINE },
      bottom: { style: "single", size: 4, color: LINE },
      left: { style: "single", size: 4, color: LINE },
      right: { style: "single", size: 4, color: LINE },
    };
  }
  function noBorderSet() {
    const nb = { style: "none", size: 0, color: "FFFFFF" };
    return { top: nb, bottom: nb, left: nb, right: nb };
  }

  function DX(pct) {
    return Math.round(USABLE_W * pct);
  }

  function run(text, opts) {
    return new docx.TextRun(Object.assign({ text: text || "" }, opts || {}));
  }
  function para(children, opts) {
    return new docx.Paragraph(Object.assign({ children: Array.isArray(children) ? children : [children] }, opts || {}));
  }
  function headingPara(text) {
    return para([run(text, { bold: true, size: 24, color: NAVY })], {
      spacing: { before: 300, after: 120 },
      border: { bottom: { style: "single", size: 6, color: LINE, space: 4 } },
    });
  }
  function titlePara(text) {
    return para([run(text, { bold: true, size: 30, color: NAVY })], {
      alignment: docx.AlignmentType.CENTER,
      spacing: { after: 260 },
    });
  }

  function labelCell(text, w) {
    return new docx.TableCell({
      width: { size: w, type: docx.WidthType.DXA },
      shading: { type: docx.ShadingType.CLEAR, fill: LABEL_BG },
      verticalAlign: docx.VerticalAlign.CENTER,
      borders: cellBorder(),
      margins: { top: 70, bottom: 70, left: 100, right: 100 },
      children: [para([run(text, { bold: true, size: 20 })])],
    });
  }
  function valueCell(w, text) {
    return new docx.TableCell({
      width: { size: w, type: docx.WidthType.DXA },
      verticalAlign: docx.VerticalAlign.CENTER,
      borders: cellBorder(),
      margins: { top: 70, bottom: 70, left: 100, right: 100 },
      children: [para([run(text || "", { size: 20 })])],
    });
  }
  function headCell(text, w) {
    return new docx.TableCell({
      width: { size: w, type: docx.WidthType.DXA },
      shading: { type: docx.ShadingType.CLEAR, fill: HEAD_BG },
      verticalAlign: docx.VerticalAlign.CENTER,
      borders: cellBorder(),
      margins: { top: 70, bottom: 70, left: 100, right: 100 },
      children: [para([run(text, { bold: true, color: "FFFFFF", size: 18 })])],
    });
  }
  function blankCell(w) {
    return new docx.TableCell({
      width: { size: w, type: docx.WidthType.DXA },
      borders: noBorderSet(),
      children: [para([])],
    });
  }

  // ---- table.meta / .ident-table / .contact-table / sig-wrap tabloları: label|değer ----
  // Satırda tek hücre varsa (subhead_row gibi tam genişlik ayraç satırı) alt
  // başlık olarak, birden fazla etiket/değer ÇİFTİ varsa (field_row gibi aynı
  // satırda 2+ alan) hepsi ayrı ayrı işlenir.
  function subheadCell(text) {
    return new docx.TableCell({
      width: { size: USABLE_W, type: docx.WidthType.DXA },
      columnSpan: 2,
      borders: noBorderSet(),
      margins: { top: 90, bottom: 30, left: 40, right: 40 },
      children: [para([run(text, { bold: true, size: 18, color: "444444" })])],
    });
  }
  function convertMetaTable(table) {
    const rows = Array.from(table.querySelectorAll(":scope > tbody > tr, :scope > tr"));
    const trs = [];
    rows.forEach((tr) => {
      const tds = Array.from(tr.querySelectorAll(":scope > td, :scope > th"));
      if (!tds.length) return;
      if (tds.length === 1) {
        const text = collectText(tds[0]);
        if (text) trs.push(new docx.TableRow({ children: [subheadCell(text)] }));
        return;
      }
      // Bir satırda 1 veya daha fazla (etiket, değer) çifti olabilir.
      const pairCount = Math.floor(tds.length / 2) || 1;
      const pairW = Math.floor(USABLE_W / pairCount);
      const cells = [];
      for (let p = 0; p < pairCount; p++) {
        const labelTd = tds[p * 2];
        const valueTd = tds[p * 2 + 1] || tds[p * 2];
        const lw = Math.round(pairW * 0.34);
        const vw = pairW - lw;
        cells.push(labelCell(collectText(labelTd), lw));
        cells.push(valueCell(vw, valueTd ? collectText(valueTd) : ""));
      }
      trs.push(new docx.TableRow({ children: cells }));
    });
    if (!trs.length) return null;
    return new docx.Table({ width: { size: USABLE_W, type: docx.WidthType.DXA }, rows: trs });
  }

  // ---- table.imza / .imza.compact: yan yana imza blokları (ad+unvan+etiket) ----
  function convertImzaTable(table) {
    const cells = Array.from(table.querySelectorAll("tr > td"));
    if (!cells.length) return null;
    const w = Math.floor(USABLE_W / cells.length);
    const widths = new Array(cells.length).fill(w);
    widths[cells.length - 1] = USABLE_W - w * (cells.length - 1);
    const tcells = cells.map((td, i) => {
      const labelEl = td.querySelector(".imza-label, .imza-lbl");
      const lineEls = Array.from(td.querySelectorAll(".field-line, .mirror-span"));
      const lines = lineEls.map((el) => liveText(el) || collectText(el)).filter(Boolean);
      const paras = [para([run("")], { spacing: { after: 260 } })]; // fiziksel imza için boşluk
      if (!lines.length) {
        const fallback = collectText(td);
        if (fallback) lines.push(fallback);
      }
      lines.forEach((t) => paras.push(para([run(t, { size: 19 })], { alignment: docx.AlignmentType.CENTER })));
      if (labelEl) {
        paras.push(para([run(collectText(labelEl), { bold: true, size: 17 })], {
          alignment: docx.AlignmentType.CENTER,
          spacing: { before: 60 },
          border: { top: { style: "single", size: 4, color: LINE, space: 3 } },
        }));
      }
      return new docx.TableCell({ width: { size: widths[i], type: docx.WidthType.DXA }, borders: noBorderSet(), children: paras });
    });
    return new docx.Table({ width: { size: USABLE_W, type: docx.WidthType.DXA }, columnWidths: widths, rows: [new docx.TableRow({ children: tcells })] });
  }

  // ---- sig-wrap içindeki meta tablosu: sayfanın sağ yarısında görünmesi için
  // solda boş bir "spacer" hücreli 3 sütunlu tabloya çevrilir ----
  function convertSigWrap(wrap) {
    const table = wrap.querySelector("table.meta");
    if (!table) return null;
    const rows = Array.from(table.querySelectorAll("tr"));
    const spacerW = DX(0.5);
    const labelW = DX(0.24);
    const valW = USABLE_W - spacerW - labelW;
    const trs = rows.map((tr) => {
      const labelTd = tr.querySelector("td.label");
      const valueTd = tr.querySelectorAll("td")[1];
      const labelText = labelTd ? collectText(labelTd) : "";
      const valueText = valueTd ? collectText(valueTd) : "";
      return new docx.TableRow({ children: [blankCell(spacerW), labelCell(labelText, labelW), valueCell(valW, valueText)] });
    });
    return new docx.Table({ width: { size: USABLE_W, type: docx.WidthType.DXA }, columnWidths: [spacerW, labelW, valW], rows: trs });
  }

  // ---- Genel çok sütunlu tablo (uye-table, dizi-table, member table, vb.) ----
  function convertGenericTable(table) {
    const theadRow = table.querySelector("thead tr");
    const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
    const footRows = Array.from(table.querySelectorAll("tfoot tr"));
    if (!theadRow && !bodyRows.length) return null;

    const headTds = theadRow ? Array.from(theadRow.querySelectorAll("th, td")) : [];
    const colCount = headTds.length || (bodyRows[0] ? bodyRows[0].querySelectorAll("td").length : 0);
    if (!colCount) return null;
    const colW = Math.floor(USABLE_W / colCount);
    const colWidths = new Array(colCount).fill(colW);
    colWidths[colCount - 1] = USABLE_W - colW * (colCount - 1);

    const trs = [];
    if (headTds.length) {
      trs.push(new docx.TableRow({
        children: headTds.map((td, i) => headCell(collectText(td) || " ", colWidths[i])),
      }));
    }
    bodyRows.forEach((tr) => {
      const tds = Array.from(tr.querySelectorAll("td"));
      trs.push(new docx.TableRow({
        children: tds.map((td, i) => valueCell(colWidths[i] || colW, collectText(td))),
      }));
    });
    footRows.forEach((tr) => {
      const tds = Array.from(tr.querySelectorAll("td"));
      trs.push(new docx.TableRow({
        children: tds.map((td, i) => {
          const w = colWidths[i] || colW;
          const text = collectText(td);
          return new docx.TableCell({
            width: { size: w, type: docx.WidthType.DXA },
            shading: { type: docx.ShadingType.CLEAR, fill: LABEL_BG },
            borders: cellBorder(),
            margins: { top: 70, bottom: 70, left: 100, right: 100 },
            children: [para([run(text, { bold: true, size: 19 })])],
          });
        }),
      }));
    });
    return new docx.Table({ width: { size: USABLE_W, type: docx.WidthType.DXA }, columnWidths: colWidths, rows: trs });
  }

  // ---- Dinamik listeler: .dyn-list / .paragraph-list (numaralı metin satırları) ----
  function convertNumberedList(list, rowSelector) {
    const rows = Array.from(list.querySelectorAll(rowSelector));
    if (!rows.length) return [para([run("—", { italics: true, color: "999999", size: 19 })])];
    return rows.map((row, i) => {
      const text = collectText(row);
      return para([run(`${i + 1}. `, { bold: true, color: NAVY, size: 20 }), run(text, { size: 20 })], {
        spacing: { after: 120 },
      });
    });
  }

  // ---- .ek-list: satırdaki .ek-no zaten "Ek-N)" metnini içeriyor, tekrar eklemeye gerek yok ----
  function convertEkList(list) {
    const rows = Array.from(list.querySelectorAll(".ek-row, li"));
    const out = [];
    rows.forEach((row) => {
      const text = collectText(row);
      if (text) out.push(para([run(text, { size: 20 })], { spacing: { after: 60 } }));
    });
    return out;
  }

  // ---- .gundem-list: başlık + karar ----
  function convertGundemList(list) {
    const items = Array.from(list.querySelectorAll(".gundem-item"));
    if (!items.length) return [para([run("(Gündem maddesi girilmemiş)", { italics: true, color: "999999", size: 19 })])];
    const out = [];
    items.forEach((item, i) => {
      const titleEl = item.querySelector(".gundem-title");
      const kararEl = item.querySelector(".gundem-karar");
      const title = titleEl ? liveText(titleEl) : "";
      const karar = kararEl ? liveText(kararEl) : "";
      out.push(para([run(`${i + 1}.  `, { bold: true, color: NAVY, size: 21 }), run(title || "(başlıksız)", { bold: true, underline: {}, size: 21 })], { spacing: { before: 160, after: 40 } }));
      out.push(para([run(karar || "—", { size: 20 })], { spacing: { after: 160 } }));
    });
    return out;
  }

  // ---- .choice-row / .check-row / .radio-row: seçenekleri ☒/☐ ile tek satırda ----
  function convertChoiceRow(row) {
    const labels = Array.from(row.querySelectorAll("label"));
    const runs = [];
    labels.forEach((lbl, i) => {
      const input = lbl.querySelector("input");
      const mark = input ? liveText(input) : "☐";
      const text = lbl.textContent.replace(/\s+/g, " ").trim();
      if (i > 0) runs.push(run("      "));
      runs.push(run(`${mark} ${text}`, { size: 20 }));
    });
    return para(runs, { spacing: { after: 120 } });
  }

  // Bir konteynerin içindeki <li>/<br> öğelerini satır sonu olarak koruyarak
  // metne çevirir (collectText tüm metni tek satıra sıkıştırdığı için liste
  // yapıları okunaksız birleşmesin diye).
  function collectTextWithBreaks(container) {
    const clone = container.cloneNode(true);
    clone.querySelectorAll(SKIP_SELECTOR).forEach((el) => el.remove());
    const origFields = container.querySelectorAll("input, textarea, select");
    const cloneFields = Array.prototype.slice.call(clone.querySelectorAll("input, textarea, select"));
    cloneFields.forEach((el, idx) => {
      const original = origFields[idx];
      el.replaceWith(clone.ownerDocument.createTextNode((original ? liveText(original) : "") + " "));
    });
    clone.querySelectorAll("li, br, p, div").forEach((el) => {
      el.appendChild(clone.ownerDocument.createTextNode("\n"));
    });
    return (clone.textContent || "")
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  // ---- .note-box: bilgi kutusu (kenarlıklı, girintili paragraf/liste) ----
  function convertNoteBox(box) {
    const titleEl = box.querySelector(".note-title");
    const textEl = box.querySelector(".note-text");
    const out = [];
    if (titleEl) out.push(para([run(titleEl.textContent.trim(), { bold: true, color: NAVY, size: 19 })], { spacing: { after: 40 } }));
    if (textEl) {
      const lines = collectTextWithBreaks(textEl);
      lines.forEach((line, i) => {
        out.push(para([run(line, { size: 18, color: "444444" })], {
          spacing: { after: i === lines.length - 1 ? 160 : 40 },
          border: { left: { style: "single", size: 12, color: "D6B656", space: 8 } },
          indent: { left: 120 },
        }));
      });
    }
    return out;
  }

  // ---- Ana yürüteç: bir üst-seviye elemanı docx bloklarına çevirir ----
  function convertElement(el) {
    if (isSkippable(el)) return [];
    const cls = el.classList;

    if (el.tagName === "TABLE") {
      if (cls.contains("imza")) {
        const t = convertImzaTable(el);
        return t ? [t] : [];
      }
      if (cls.contains("meta") || cls.contains("ident-table") || cls.contains("contact-table") || cls.contains("ident-compact")) {
        const t = convertMetaTable(el);
        return t ? [t] : [];
      }
      const t = convertGenericTable(el);
      return t ? [t] : [];
    }
    if (cls.contains("sig-wrap") || cls.contains("contact-block")) {
      const t = convertSigWrap(el) || convertMetaTable(el.querySelector("table"));
      const heading = el.querySelector(".sig-heading");
      const out = [];
      if (heading) out.push(para([run(heading.textContent.trim(), { bold: true, size: 19 })], { spacing: { before: 200, after: 60 } }));
      if (t) out.push(t);
      return out;
    }
    if (cls.contains("nusha")) {
      // Çoklu nüsha belgelerinde sadece İLK nüshayı (dolu/asıl) al, mirror
      // kopyaları (aynı verinin tekrarı) Word çıktısına dahil etme.
      if (el.dataset.__nushaSkip) return [];
      const siblingNushas = Array.from(el.parentElement.querySelectorAll(".nusha"));
      if (siblingNushas[0] !== el) return [];
      const out = [];
      Array.from(el.children).forEach((child) => { out.push(...convertElement(child)); });
      return out;
    }
    if (cls.contains("gundem-list")) return convertGundemList(el);
    if (cls.contains("uye-table") || cls.contains("dizi-table")) {
      const t = convertGenericTable(el);
      return t ? [t] : [];
    }
    if (cls.contains("paragraph-list")) return convertNumberedList(el, ".p-row");
    if (cls.contains("dyn-list")) return convertNumberedList(el, ".dyn-row");
    if (cls.contains("ek-list")) return convertEkList(el);
    if (cls.contains("choice-row") || cls.contains("check-row") || cls.contains("radio-row") || cls.contains("check-group")) {
      return [convertChoiceRow(el)];
    }
    if (cls.contains("note-box")) return convertNoteBox(el);
    if (cls.contains("doc-title") || el.tagName === "H1") return [titlePara(collectText(el))];
    if (cls.contains("doc-subtitle") || cls.contains("school-sub") || cls.contains("dayanak")) {
      return [para([run(collectText(el), { italics: true, size: 19, color: MUTED })], { alignment: docx.AlignmentType.CENTER, spacing: { after: 120 } })];
    }
    if (cls.contains("ek-tag")) {
      return [para([run(collectText(el), { bold: true, size: 18, color: NAVY })], { alignment: docx.AlignmentType.CENTER })];
    }
    if (cls.contains("school-line")) {
      const text = liveText(el) || collectText(el);
      return [para([run(text, { bold: true, size: 24 })], { alignment: docx.AlignmentType.CENTER, spacing: { after: 120 }, border: { bottom: { style: "single", size: 6, color: "000000", space: 4 } } })];
    }
    if (cls.contains("section-title") || cls.contains("section-heading") || /^H[2-4]$/.test(el.tagName)) {
      const text = collectText(el);
      return text ? [headingPara(text)] : [];
    }
    if (cls.contains("para") || cls.contains("template-para") || cls.contains("compact-para") || cls.contains("closing-line")) {
      const text = collectText(el);
      return text ? [para([run(text, { size: 20 })], { alignment: docx.AlignmentType.JUSTIFIED, spacing: { after: 160 }, indent: { firstLine: cls.contains("lead-in") ? 0 : 400 } })] : [];
    }
    if (cls.contains("section")) {
      const out = [];
      Array.from(el.children).forEach((child) => { out.push(...convertElement(child)); });
      return out;
    }
    if (el.tagName === "P" || el.tagName === "DIV") {
      // Bilinen bir sınıfı olmayan ama alt elemanları olan konteyner ise
      // içine inip her çocuğu ayrı ayrı dönüştür.
      if (el.children.length > 0) {
        const out = [];
        Array.from(el.children).forEach((child) => { out.push(...convertElement(child)); });
        return out;
      }
      const text = collectText(el);
      return text ? [para([run(text, { size: 20 })], { spacing: { after: 120 } })] : [];
    }
    return [];
  }

  window.downloadWord = async function downloadWord() {
    const btn = document.getElementById("wordDownloadBtn");
    const pageEl = document.querySelector(".page");
    if (!pageEl) return;
    if (typeof window.applyFieldFormatting === "function") window.applyFieldFormatting();

    const originalText = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Hazırlanıyor…"; }

    try {
      const footEl = pageEl.querySelector(".foot");
      const footText = footEl ? collectText(footEl) : "";

      const children = [];
      Array.from(pageEl.children).forEach((child) => {
        if (child === footEl) return;
        if (child.classList && child.classList.contains("btns")) return;
        children.push(...convertElement(child));
      });

      const footer = new docx.Footer({
        children: [
          new docx.Paragraph({
            border: { top: { style: "single", size: 4, color: LINE, space: 4 } },
            tabStops: [{ type: "right", position: USABLE_W }],
            children: [run(footText, { size: 16, color: "999999" })],
          }),
        ],
      });

      const doc = new docx.Document({
        sections: [
          {
            properties: { page: { margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
            footers: { default: footer },
            children,
          },
        ],
      });

      const blob = await docx.Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanTitle = document.title.replace(/[\\/:*?"<>|]/g, "").trim() || "belge";
      a.download = cleanTitle + ".docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (btn) { btn.textContent = "✅ İndirildi!"; setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 2200); }
    } catch (err) {
      console.error(err);
      alert("Word belgesi oluşturulurken bir sorun oluştu: " + err.message);
      if (btn) { btn.disabled = false; btn.textContent = originalText; }
    }
  };
})();
