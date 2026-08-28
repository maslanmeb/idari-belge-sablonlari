# -*- coding: utf-8 -*-
from gen_common import *
import os

OUT = "/home/claude/idari-belge-sablonlari/belgeler"
os.makedirs(OUT, exist_ok=True)

EXTRA_STYLE = """<style>
  .sig-block{ text-align:right; margin-top:24px; }
  .sig-block .sig-date{ display:inline-block; min-width:110px; text-align:center; }
  .sig-block .sig-line{ display:block; width:220px; margin-left:auto; border-bottom:1px solid #333; margin-top:24px; margin-bottom:4px; height:1px; }
  .sig-block .sig-name{ text-align:right; font-weight:bold; font-size:10pt; min-height:1.3em; }
  .sig-block .imza-lbl{ text-align:right; font-size:9pt; color:#666; font-family:Arial,sans-serif; }
  .bottom-cols{ display:flex; gap: 24px; margin-top: 22px; }
  .bottom-cols .half-width{ width:50%; }
  .contact-table td.label{ width:34%; }
  .template-para{ font-size:11pt; line-height:1.9; text-indent:1.25cm; text-align:justify; margin: 18px 0; }
</style>
"""

school_line = ('    <div class="school-line" data-persist="okulAdi" contenteditable="true" '
               'spellcheck="false" style="margin-bottom:4px;"></div>\n'
               '    <div class="school-hint">↑ Farklı okul için bu satırı tıklayıp değiştirebilirsiniz</div>\n'
               '    <div class="school-sub">Müdürlüğüne</div>')

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

signature = '''    <div class="sig-block">
      <input type="date" class="print-borderless sig-date">
      <span class="sig-line"></span>
      <div class="sig-name inline-fit" contenteditable="true" data-placeholder="Ad SOYAD"></div>
      <div class="imza-lbl">İmza</div>
    </div>'''

ekler = '''    <div class="ekler-block" data-ekler-block>
      <div class="ekler-title">Ekler</div>
      <div class="ek-list" id="ekList1"></div>
      <button type="button" class="ekler-add" data-target="ekList1">+ Ek ekle</button>
    </div>'''

contact = '''    <table class="meta contact-table">
      <tr><td class="label">TC Kimlik No</td><td><input type="text" inputmode="numeric" maxlength="11"></td></tr>
      <tr><td class="label">Telefon No</td><td><input type="text" placeholder="05xx xxx xx xx"></td></tr>
      <tr><td class="label">Adres</td><td><textarea rows="2" placeholder="Adres..."></textarea></td></tr>
    </table>'''

bottom = f'''    <div class="bottom-cols">
      <div class="half-width">
{ekler}
      </div>
      <div class="half-width">
{contact}
      </div>
    </div>'''

body = "\n".join([school_line, template, closing, signature, bottom])

html = page("Diploma Kayıt Örneği Dilekçesi", body, extra_style=EXTRA_STYLE)
with open(os.path.join(OUT, "diploma-kayit-ornegi.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("wrote diploma-kayit-ornegi.html")
