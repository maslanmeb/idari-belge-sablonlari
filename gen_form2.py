# -*- coding: utf-8 -*-
from gen_common import *
import os

OUT = "/home/claude/idari-belge-sablonlari/belgeler"
os.makedirs(OUT, exist_ok=True)

EXTRA_STYLE = """<style>
  .page{ padding: 8mm 14mm 6mm; }
  h1.doc-title{ text-align:center; font-size:12.5pt; margin:2px 0 2px; color:var(--navy); }
  .doc-subtitle{ text-align:center; font-size:9.5pt; color:#555; font-family:Arial,sans-serif; margin-bottom:8px; }
  .nusha-label{ margin-bottom: 4px; padding: 2px 8px; font-size:8.8pt; }
  table.meta.compact{ margin-bottom: 6px; }
  table.meta.compact td{ padding:2px 6px; font-size:9.3pt; }
  table.meta.compact td.label{ font-size:8.6pt; }
  table.meta.compact input, table.meta.compact select{ font-size:9.3pt; padding:1px; }
  table.meta.compact td .mirror-span{ font-size:9.3pt; padding:1px; min-height:auto; display:inline; }
  .compact-para{ font-size:9.3pt; line-height:1.45; text-align:justify; margin:8px 0; font-family:Arial,sans-serif; color:#222; }
  .beyan-tarih{ font-family:inherit; }
  table.imza.compact{ margin-top:6px; margin-bottom:0; }
  table.imza.compact .field-line{ font-size:8.5pt; padding:1px; min-height:1.1em; }
  table.imza.compact .imza-label{ font-size:7.6pt; }
  .field-line{ display:block; text-align:center; border-bottom:1px dotted #888; padding:2px; min-height:1.2em; }
  .field-line.bold{ font-weight:bold; border-bottom:none; }
  .nusha-divider{ margin: 8px 0; }
  .barcode-box{ min-height:54px; font-size:8.3pt; }
  .two-col{ width:100%; border-collapse:collapse; margin-top:6px; }
  .two-col td{ vertical-align:top; width:50%; padding:0 6px; }
  .two-col td:first-child{ padding-left:0; }
  .two-col td:last-child{ padding-right:0; }
  @media print{ .page{ padding: 6mm 12mm 5mm; } }
</style>
"""

YAKINLIK_OPTIONS = ["", "Kendisi", "Eşi", "Çocuğu", "Annesi", "Babası", "Diğer"]

def yakinlik_select(editable):
    if not editable:
        return mirror_field("a_yakinlik")
    opts = "".join(f'<option>{o}</option>' if o else '<option value="">Seçiniz...</option>' for o in YAKINLIK_OPTIONS)
    return f'<select data-mirror="a_yakinlik">{opts}</select>'


def beyan_table(editable):
    ph = {"a_ad": "Adı Soyadı", "a_tc": "TC Kimlik No", "a_kurulus": "Sağlık kuruluşu adı"}
    def E(key, kind="text"):
        attrs = f'placeholder="{ph.get(key, "")}"'
        return input_field(key, kind, attrs) if editable else mirror_field(key)
    rows = [
        subhead_row("Hastanın"),
        field_row_single("Adı Soyadı", E("a_ad")),
        field_row_single("Aile Fertlerinin Yakınlığı", yakinlik_select(editable)),
        field_row_single("TC Kimlik No", E("a_tc", "tc")),
        field_row_single("Tedavi Olduğu Sağlık Kuruluşunun Adı", E("a_kurulus")),
        field_row_single("Sağlık Kurumuna Başvuru Tarihi", E("a_basvuru", "date")),
        field_row_single("Ayakta Yapılan Tedavinin Bitiş Tarihi", E("a_bitis", "date")),
    ]
    return '    <table class="meta compact">\n' + "\n".join(rows) + "\n    </table>"


def beyan_paragraph(editable):
    tarih = (f'<input type="date" class="date-inline" data-mirror="a_beyantarih" style="width:120px;">'
             if editable else mirror_field("a_beyantarih"))
    return f'''    <div class="compact-para">
      Yukarıda belirtmiş olduğum sağlık kuruluşunda ayakta tedavi yapıldığını beyan ederim. {tarih}
    </div>'''


def beyan_bottom(editable):
    if editable:
        bad = ('<div class="field-line">'
               + input_field("a_bAd", extra_attrs='placeholder="Adı SOYADI" style="border:none;width:100%;text-align:center;"')
               + '</div>')
        bunvan = ('<div class="field-line bold">'
                  + input_field("a_bUnvan", extra_attrs='placeholder="Unvanı" style="border:none;width:100%;text-align:center;font-weight:bold;"')
                  + '</div>')
    else:
        bad = f'<div class="field-line">{mirror_field("a_bAd")}</div>'
        bunvan = f'<div class="field-line bold">{mirror_field("a_bUnvan")}</div>'
    return f'''    <table class="two-col">
      <tr>
        <td>
          <div style="font-size:8.3pt; font-family:Arial,sans-serif; color:#555; text-align:center; margin-bottom:4px;">(Sağlık kuruluşundan alınan barkodu bu alana yapıştırınız)</div>
          <div class="barcode-box">Barkod</div>
        </td>
        <td>
          {bad}
          {bunvan}
          <div class="field-line" style="border-bottom:none; margin-top:8px;">İmza: ......................................</div>
        </td>
      </tr>
    </table>'''


def nusha_block(no_label, editable):
    return f'''    <div class="nusha">
      <span class="nusha-label">{no_label}</span>
      <h1 class="doc-title">MİLLÎ EĞİTİM BAKANLIĞI PERSONELİ</h1>
      <div class="doc-subtitle">Ayakta Tedavi Beyan Belgesi</div>
{beyan_table(editable)}
{beyan_paragraph(editable)}
{beyan_bottom(editable)}
    </div>'''


body = nusha_block("1. NÜSHA", True) + \
    '\n    <hr class="nusha-divider">\n' + \
    nusha_block("2. NÜSHA", False)

html = page("Ayakta Tedavi Beyan Belgesi", body, extra_style=EXTRA_STYLE)
with open(os.path.join(OUT, "ayakta-tedavi-beyan.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("wrote ayakta-tedavi-beyan.html")
