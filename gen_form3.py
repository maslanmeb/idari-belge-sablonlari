# -*- coding: utf-8 -*-
from gen_common import *
import os

OUT = "/home/claude/idari-belge-sablonlari/belgeler"
os.makedirs(OUT, exist_ok=True)

EXTRA_STYLE = """<style>
  .ident-table td.label{ width:32%; }
  .sig-wrap{ width:50%; margin-left:50%; margin-top:22px; box-sizing:border-box; padding-left:10px; }
  .sig-table{ width:80%; margin:0 auto; border-collapse:collapse; }
  .sig-table td{ text-align:center; border:1px solid #ccc; padding:7px 8px; font-size:10pt; }
  .sig-table .sig-name{ font-weight:bold; }
  .sig-table input[type=date]{ text-align:center; border:none; width:100%; font-family:inherit; font-size:inherit; }
  @media print{ .sig-table td{ border:none !important; } }
  .bottom-cols{ margin-top: 18px; }
  .half-width{ width:50%; }
  .contact-table{ margin-top:16px; }
  .contact-table td.label{ width:34%; }
</style>
"""

# ---------------- Identity table ----------------
ident_rows = [
    field_row_single("ADI &ndash; SOYADI", input_field("p_ad", extra_attrs='placeholder="Adı Soyadı"')),
    field_row_single("BABA ADI", input_field("p_baba", extra_attrs='placeholder="Baba adı"')),
    "      <tr><td class=\"label\">DOĞUM YERİ VE TARİHİ</td><td style=\"white-space:nowrap;\">"
        + input_field("p_dogumyeri", extra_attrs='placeholder="Doğum yeri" style="width:58%; display:inline-block;"')
        + '<span style="display:inline-block;width:10px;"></span>'
        + '<input type="date" style="width:38%; display:inline-block;">' + "</td></tr>",
    field_row_single("GÖREVİ", input_field("p_gorev", extra_attrs='placeholder="Görevi"')),
    field_row_single("ÜNVANI", input_field("p_unvan", extra_attrs='placeholder="Unvanı"')),
    '      <tr><td class="label">GÖREV YERİ</td><td><input type="text" value="Kumkale Ortaokulu"></td></tr>',
    field_row_single("MEMURİYETE BAŞLAMA TARİHİ", '<input type="date">'),
    field_row_single("TC KİMLİK NO", input_field("p_tc", "tc", extra_attrs='placeholder="TC Kimlik No"')),
    field_row_single("DİLEKÇE KONUSU", input_field("p_konu", extra_attrs='placeholder="Dilekçe konusu"')),
]
ident_table = '    <table class="meta ident-table">\n' + "\n".join(ident_rows) + "\n    </table>"

school_line = ('    <div class="school-line" contenteditable="true" '
               'spellcheck="false" style="margin:16px 0 4px;">KUMKALE ORTAOKULU MÜDÜRLÜĞÜNE</div>\n'
               '    <div class="school-hint">↑ Farklı okul için bu satırı tıklayıp değiştirebilirsiniz</div>')

paragraphs = '''    <div class="paragraph-list" id="pList1">
      <div class="p-row"><textarea rows="3" placeholder="Paragraf yazınız..."></textarea><button type="button" class="p-remove">&times;</button></div>
    </div>
    <button type="button" class="paragraph-list-add" data-target="pList1">+ Paragraf ekle</button>'''

closing = '    <div class="closing-line" contenteditable="true">Gereğinin yapılmasını arz ederim.</div>'

signature = f'''    <div class="sig-wrap">
      <table class="sig-table">
        <tr><td><input type="date"></td></tr>
        <tr><td class="sig-name">{mirror_field("p_ad")}</td></tr>
        <tr><td>{mirror_field("p_unvan")}</td></tr>
      </table>
    </div>'''

ekler = '''    <div class="ekler-block" data-ekler-block>
      <div class="ekler-title">Ekler</div>
      <div class="ek-list" id="ekList1"></div>
      <button type="button" class="ekler-add" data-target="ekList1">+ Ek ekle</button>
    </div>'''

contact = '''    <table class="meta contact-table">
      <tr><td class="label">Telefon</td><td><input type="tel" placeholder="0532 - 123 45 67"></td></tr>
      <tr><td class="label">Adres</td><td><textarea rows="2" placeholder="Adres..."></textarea></td></tr>
      <tr><td class="label">E-posta</td><td><input type="email" placeholder="ornek@meb.gov.tr"></td></tr>
    </table>'''

bottom = f'''    <div class="bottom-cols half-width">
{ekler}
{contact}
    </div>'''

body = "\n".join([ident_table, school_line, paragraphs, closing, signature, bottom])

html = page("Personel Dilekçe Şablonu", body, extra_style=EXTRA_STYLE)
with open(os.path.join(OUT, "personel-dilekce.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("wrote personel-dilekce.html")
