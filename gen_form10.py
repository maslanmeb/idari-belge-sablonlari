# -*- coding: utf-8 -*-
from gen_common import *
import os

OUT = "/home/claude/idari-belge-sablonlari/belgeler"
os.makedirs(OUT, exist_ok=True)

EXTRA_STYLE = """<style>
  .doc-title{ text-align:center; font-size:13pt; color:var(--navy); margin: 2px 0 4px; }
  .doc-subtitle{ text-align:center; font-size:9.5pt; color:#777; font-family:Arial,sans-serif; margin: 0 0 14px; }
  .section-title{ font-weight:bold; font-size:11.5pt; color:var(--navy); margin: 14px 0 6px; font-family: Arial, sans-serif; }
  .closing-line{ margin: 10px 0 18px; }
  .sig-wrap{ width:50%; margin-left:50%; margin-top:16px; box-sizing:border-box; }
  .sig-wrap table.meta td{ padding:3px 6px; font-size:9.8pt; }
  .sig-wrap table.meta td.label{ font-size:9.2pt; width:42%; }
  .bottom-cols{ margin-top: 18px; display:flex; gap:24px; align-items:flex-start; }
  .half-width{ width:50%; flex:0 0 50%; }
  .contact-table{ margin-top:0; }
  .contact-table td.label{ width:34%; }
</style>
"""

school_line = ('    <div class="school-line" contenteditable="true" '
               'spellcheck="false" style="margin-bottom:4px;">KUMKALE ORTAOKULU MÜDÜRLÜĞÜNE</div>\n'
               '    <div class="school-hint">↑ Farklı okul için bu satırı tıklayıp değiştirebilirsiniz</div>')

title = '    <h1 class="doc-title">VELİ TALEP DİLEKÇESİ</h1>\n    <div class="doc-subtitle">(Öğrenci Hakkında)</div>'

ident_table = '''    <div class="section-title">Öğrencinin</div>
    <table class="meta">
      <tr><td class="label" style="width:32%">TC Kimlik No</td><td><input type="text" inputmode="numeric" class="tc-field" placeholder="TC Kimlik No"></td></tr>
      <tr><td class="label">Adı Soyadı</td><td><input type="text" placeholder="Adı Soyadı"></td></tr>
      <tr><td class="label">Sınıf / Şube</td><td><input type="text" placeholder="ör. 6/A"></td></tr>
      <tr><td class="label">Baba Adı</td><td><input type="text" placeholder="Baba adı"></td></tr>
      <tr><td class="label">Ana Adı</td><td><input type="text" placeholder="Ana adı"></td></tr>
      <tr><td class="label">Doğum Yeri</td><td><input type="text" placeholder="Doğum yeri"></td></tr>
      <tr><td class="label">Doğum Tarihi</td><td><input type="date"></td></tr>
    </table>'''

paragraphs = '''    <div class="section-title">Talebim</div>
    <div class="paragraph-list" id="pList1">
      <div class="p-row"><textarea rows="3" placeholder="Talebinizi buraya yazınız..."></textarea><button type="button" class="p-remove">&times;</button></div>
    </div>
    <button type="button" class="paragraph-list-add" data-target="pList1">+ Paragraf ekle</button>'''

closing = '    <div class="closing-line" contenteditable="true">Gereğini arz ederim.</div>'

signature = '''    <div class="sig-wrap">
      <table class="meta">
        <tr><td class="label">Tarih</td><td><input type="date"></td></tr>
        <tr><td class="label">Veli Ad Soyad</td><td><input type="text" placeholder="Adı Soyadı"></td></tr>
      </table>
    </div>'''

ekler = '''    <div class="ekler-block" data-ekler-block>
      <div class="ekler-title">Ekler</div>
      <div class="ek-list" id="ekList1"></div>
      <button type="button" class="ekler-add" data-target="ekList1">+ Ek ekle</button>
    </div>'''

contact = '''    <table class="meta contact-table">
      <tr><td class="label">Adres</td><td><textarea rows="2" placeholder="Adres..."></textarea></td></tr>
      <tr><td class="label">Telefon</td><td><input type="tel" placeholder="0532 - 123 45 67"></td></tr>
    </table>'''

bottom = f'''    <div class="bottom-cols">
      <div class="half-width">
{ekler}
      </div>
      <div class="half-width">
{contact}
      </div>
    </div>'''

body = "\n".join([school_line, title, ident_table, paragraphs, closing, signature, bottom])

html = page("Veli Talep Dilekçesi (Öğrenci Hakkında)", body, extra_style=EXTRA_STYLE)
with open(os.path.join(OUT, "veli-talep-dilekcesi.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("wrote veli-talep-dilekcesi.html")
