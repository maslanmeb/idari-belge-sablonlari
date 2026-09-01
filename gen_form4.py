# -*- coding: utf-8 -*-
from gen_common import *
import os

OUT = "/home/claude/idari-belge-sablonlari/belgeler"
os.makedirs(OUT, exist_ok=True)

EXTRA_STYLE = """<style>
  .sig-wrap{ width:50%; margin-left:50%; margin-top:22px; box-sizing:border-box; padding-left:10px; }
  .sig-table{ width:80%; margin:0 auto; border-collapse:collapse; }
  .sig-table td{ text-align:center; border:1px solid #ccc; padding:7px 8px; font-size:10pt; }
  .sig-table .sig-name{ font-weight:bold; min-height:1.3em; }
  .sig-table .imza-lbl{ font-size:9pt; color:#666; font-family:Arial,sans-serif; }
  .sig-table input[type=date]{ text-align:center; border:none; width:100%; font-family:inherit; font-size:inherit; }
  @media print{ .sig-table td{ border:none !important; } }
  .bottom-cols{ margin-top: 22px; }
  .half-width{ width:50%; }
  .contact-table{ margin-top:16px; }
  .contact-table td.label{ width:34%; }
  .template-para{ font-size:11pt; line-height:1.9; text-indent:1.25cm; text-align:justify; margin: 18px 0; }
</style>
"""

school_line = ('    <div class="school-line" contenteditable="true" '
               'spellcheck="false" style="margin-bottom:4px;">KUMKALE ORTAOKULU MÜDÜRLÜĞÜNE</div>\n'
               '    <div class="school-hint">↑ Farklı okul için bu satırı tıklayıp değiştirebilirsiniz</div>')

template = f'''    <div class="template-para">
      <span class="inline-fit" contenteditable="true" data-placeholder="mezun olunan okul adı"></span>
      Okulundan
      <span data-year-pair style="display:inline-block;">
        <input type="text" class="year-box year-first" maxlength="4" inputmode="numeric" placeholder="20__"> /
        <input type="text" class="year-box year-second" maxlength="4" inputmode="numeric" placeholder="20__">
      </span>
      Eğitim Öğretim yılında
      <span class="inline-fit" contenteditable="true" data-placeholder="__."></span> sınıfı bitirerek mezun oldum.
      Diplomamı kaybettiğimden dolayı, diploma kayıt örneğimin çıkarılarak tarafıma verilmesi hususunda;
    </div>'''

closing = '    <div class="closing-line" contenteditable="true">Gereğini arz ederim.</div>'

signature = '''    <div class="sig-wrap">
      <table class="sig-table">
        <tr><td><input type="date"></td></tr>
        <tr><td class="sig-name inline-fit" contenteditable="true" data-placeholder="Ad SOYAD"></td></tr>
        <tr><td class="imza-lbl">İmza</td></tr>
      </table>
    </div>'''

ekler = '''    <div class="ekler-block" data-ekler-block>
      <div class="ekler-title">Ekler</div>
      <div class="ek-list" id="ekList1"></div>
      <button type="button" class="ekler-add" data-target="ekList1">+ Ek ekle</button>
    </div>'''

contact = '''    <table class="meta contact-table">
      <tr><td class="label">TC Kimlik No</td><td><input type="text" inputmode="numeric" maxlength="11" placeholder="TC Kimlik No"></td></tr>
      <tr><td class="label">Telefon No</td><td><input type="text" placeholder="05xx xxx xx xx"></td></tr>
      <tr><td class="label">Adres</td><td><textarea rows="2" placeholder="Adres..."></textarea></td></tr>
    </table>'''

bottom = f'''    <div class="bottom-cols half-width">
{ekler}
{contact}
    </div>'''

body = "\n".join([school_line, template, closing, signature, bottom])

html = page("Diploma Kayıt Örneği Dilekçesi", body, extra_style=EXTRA_STYLE)
with open(os.path.join(OUT, "diploma-kayit-ornegi.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("wrote diploma-kayit-ornegi.html")
