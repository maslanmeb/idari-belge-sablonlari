# -*- coding: utf-8 -*-
from gen_common import *
import os

OUT = "/home/claude/idari-belge-sablonlari/belgeler"
os.makedirs(OUT, exist_ok=True)

EXTRA_STYLE = """<style>
  /* Bu belge iki nüshayı tek A4 sayfaya sığdırmak için sıkıştırılmış ölçüler kullanır */
  .page{ padding: 8mm 14mm 6mm; }
  h1.doc-title{ text-align:center; font-size:13pt; margin:4px 0 6px; color:var(--navy); }
  .nusha-label{ margin-bottom: 4px; padding: 2px 8px; font-size:8.8pt; }
  table.meta.compact{ margin-bottom: 6px; }
  table.meta.compact td{ padding:2px 6px; font-size:9.3pt; }
  table.meta.compact td.label{ font-size:8.6pt; }
  table.meta.compact input{ font-size:9.3pt; padding:1px; }
  table.meta.compact td .mirror-span{ font-size:9.3pt; padding:1px; min-height:auto; display:inline; }
  table.meta.compact textarea{ font-size:9.3pt; padding:2px; width:100%; border:none; resize:none; overflow:hidden !important; font-family:inherit; min-height:1.3em; }
  .compact-para{ font-size:9.3pt; line-height:1.45; text-align:justify; margin:6px 0; font-family:Arial,sans-serif; color:#222; }
  table.imza.compact{ margin-top:6px; margin-bottom:0; }
  table.imza.compact .field-line{ font-size:8.5pt; padding:1px; min-height:1.1em; }
  table.imza.compact .field-line .mirror-span{ font-size:8.5pt; display:inline; min-height:auto; padding:0; }
  table.imza.compact .imza-label{ font-size:7.6pt; }
  .field-line{ display:block; text-align:center; border-bottom:1px dotted #888; padding:2px; min-height:1.2em; }
  .field-line.bold{ font-weight:bold; border-bottom:none; }
  .nusha-divider{ margin: 8px 0 0; }
  .school-line{ padding: 1px 4px 3px !important; }
  @media print{ .page{ padding: 6mm 12mm 13mm; } }
</style>
"""

def ozu_field(editable):
    if editable:
        return '<textarea data-mirror="t_ozu" rows="1" placeholder="Belgenin konusu..."></textarea>'
    return mirror_field("t_ozu")


def teblig_table(editable):
    F = input_field if editable else mirror_field
    ph = {
        "t_ad": "Adı Soyadı", "t_gorev": "Görevi", "t_gorevyeri": "Görev yeri",
        "t_tc": "TC Kimlik No", "t_sayi": "ör. 2026/45", "t_yer": "ör. Müdür Odası",
    }
    def E(key, kind="text"):
        attrs = f'placeholder="{ph.get(key, "")}"'
        return input_field(key, kind, attrs) if editable else mirror_field(key)
    rows = [
        subhead_row("Tebellüğ Edenin"),
        field_row([("Adı Soyadı", E("t_ad")), ("Görevi", E("t_gorev"))]),
        field_row([("Görev Yeri", E("t_gorevyeri")), ("TC Kimlik No", E("t_tc", "tc"))]),
        subhead_row("Belgenin"),
        field_row_single("Özü", ozu_field(editable), colspan=3),
        field_row([("Tarihi", E("t_belgetarih", "date")), ("Sayısı", E("t_sayi"))]),
        subhead_row("Tebliğin"),
        field_row_single("Edildiği Yer", E("t_yer")),
        field_row([("Tarihi", E("t_tarih", "date")), ("Saati", E("t_saat", "time"))]),
    ]
    return '    <table class="meta compact">\n' + "\n".join(rows) + "\n    </table>"


def teblig_paragraph():
    return f'''    <div class="compact-para">
      Yukarıda adı soyadı, görevi ve görev yeri yazılı bulunan kişiye; {mirror_field("t_belgetarih")} tarihli,
      {mirror_field("t_sayi")} sayılı ve &ldquo;{mirror_field("t_ozu")}&rdquo; konulu belge,
      {mirror_field("t_tarih")} günü, saat {mirror_field("t_saat")}&rsquo;da tebliğ edilmiştir.
    </div>'''


def teblig_signatures(editable):
    if editable:
        left_name = '<div class="field-line persist-field" data-persist="muduAdi" contenteditable="true" data-placeholder="Adı SOYADI"></div>'
        left_title = '<div class="field-line bold persist-field" data-persist="muduUnvani" contenteditable="true"></div>'
    else:
        left_name = '<div class="field-line" data-persist="muduAdi"></div>'
        left_title = '<div class="field-line bold" data-persist="muduUnvani"></div>'
    right_name = f'<div class="field-line">{mirror_field("t_ad")}</div>'
    right_title = f'<div class="field-line bold">{mirror_field("t_gorev")}</div>'
    return f'''    <table class="imza compact">
      <tr>
{signature_cell("TEBLİĞ EDEN", left_name, left_title)}
{signature_cell("TEBELLÜĞ EDEN", right_name, right_title)}
      </tr>
    </table>'''


def nusha_block(no_label, editable):
    school = ('<div class="school-line" data-persist="okulAdi" contenteditable="true" spellcheck="false" style="font-size:11.5pt; margin-bottom:2px;"></div>'
              if editable else
              '<div class="school-line" data-persist="okulAdi" style="font-size:11.5pt; margin-bottom:2px; border-bottom:1px solid #000; text-align:center; font-weight:bold; text-transform:uppercase; padding-bottom:4px;"></div>')
    return f'''    <div class="nusha">
      <span class="nusha-label">{no_label}</span>
      {school}
      <h1 class="doc-title">TEBLİĞ &ndash; TEBELLÜĞ BELGESİ</h1>
{teblig_table(editable)}
{teblig_paragraph()}
{teblig_signatures(editable)}
    </div>'''


body = nusha_block("1. NÜSHA — Kurumda Kalacak", True) + \
    '\n    <hr class="nusha-divider">\n    <div class="nusha-second-gap"></div>\n' + \
    nusha_block("2. NÜSHA — Tebellüğ Edende Kalacak", False)

html = page("Tebliğ – Tebellüğ Belgesi", body, extra_style=EXTRA_STYLE)
with open(os.path.join(OUT, "teblig-tebellug.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("wrote teblig-tebellug.html")
