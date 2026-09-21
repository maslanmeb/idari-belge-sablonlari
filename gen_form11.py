# -*- coding: utf-8 -*-
from gen_common import *
import os

OUT = "/home/claude/idari-belge-sablonlari/belgeler"
os.makedirs(OUT, exist_ok=True)

EXTRA_STYLE = """<style>
  .kurum-head{ text-align:center; font-size:10.5pt; font-weight:bold; line-height:1.35; margin-bottom:10px; outline:none; }
  .kurum-head[contenteditable]:hover{ background: var(--accent-bg); border-radius:4px; }
  .doc-title{ text-align:center; font-size:14pt; color:var(--navy); margin: 0 0 14px; }
  .section-title{ font-weight:bold; font-size:11pt; color:var(--navy); margin: 12px 0 5px; font-family: Arial, sans-serif; }
  .section-sub{ font-size:9.5px; color:#777; font-family:Arial,sans-serif; margin: 0 0 6px; font-style:italic; }
  .closing-line{ font-size:10pt; line-height:1.6; text-align:justify; margin: 12px 0 4px; }
  table.imza{ margin-top:20px; }
  table.imza .imza-label{ margin-bottom:4px; }
  table.imza input{ width:90%; text-align:center; border:none; border-bottom:1px solid #999; background:transparent; font-family:inherit; font-size:9.5pt; margin-bottom:6px; padding:2px; }
  table.imza .imza-box{ height:40px; }
</style>
"""

kurum_head = ('    <div class="kurum-head" contenteditable="true" spellcheck="false">'
              'T.C.<br>ÇANAKKALE VALİLİĞİ<br>KUMKALE ORTAOKULU MÜDÜRLÜĞÜ</div>')

title = '    <h1 class="doc-title">VELİ GÖRÜŞME TUTANAĞI</h1>'

ust_bilgi = '''    <table class="meta">
      <tr><td class="label" style="width:28%">Tarih / Saat</td><td style="white-space:nowrap;">
        <input type="date" style="width:45%; display:inline-block;">
        <span style="display:inline-block;width:8px;"></span>
        <input type="time" style="width:30%; display:inline-block;">
      </td></tr>
      <tr><td class="label">Görüşme Yeri</td><td><input type="text" value="Kumkale Ortaokulu"></td></tr>
    </table>'''

ogrenci = '''    <div class="section-title">Öğrencinin</div>
    <table class="meta">
      <tr><td class="label" style="width:28%">Adı Soyadı</td><td><input type="text" placeholder="Adı Soyadı"></td></tr>
      <tr><td class="label">Sınıfı / Şubesi</td><td><input type="text" placeholder="ör. 6/A" style="width:40%; display:inline-block;"></td></tr>
      <tr><td class="label">Okul Numarası</td><td><input type="text" placeholder="Okul numarası" style="width:40%; display:inline-block;"></td></tr>
    </table>'''

veli = '''    <div class="section-title">Görüşme Yapılan Velinin</div>
    <table class="meta">
      <tr><td class="label" style="width:28%">Adı Soyadı</td><td><input type="text" placeholder="Adı Soyadı"></td></tr>
      <tr><td class="label">Yakınlık Derecesi</td><td><input type="text" placeholder="ör. Anne / Baba / Vasi" style="width:50%; display:inline-block;"></td></tr>
      <tr><td class="label">İletişim Numarası</td><td><input type="tel" placeholder="0532 - 123 45 67" style="width:50%; display:inline-block;"></td></tr>
    </table>'''

tespit = '''    <div class="section-title">Görüşme Konusu ve Yapılan Tespitler</div>
    <div class="section-sub">Öğrenciyle ilgili tespit edilen durumu, hangi mevzuata/kurala aykırılık oluşturduğunu buraya yazınız. İhtiyaç kadar paragraf ekleyip çıkarabilirsiniz.</div>
    <div class="paragraph-list" id="pList1">
      <div class="p-row"><textarea rows="3" placeholder="Tespit edilen durumu yazınız..."></textarea><button type="button" class="p-remove">&times;</button></div>
    </div>
    <button type="button" class="paragraph-list-add" data-target="pList1">+ Paragraf ekle</button>'''

karar = '''    <div class="section-title">Görüşme İçeriği ve Alınan Kararlar</div>
    <div class="section-sub">Veliyle yapılan görüşmede aktarılan bilgileri, uyarıları ve velinin beyan/taahhütlerini buraya yazınız.</div>
    <div class="paragraph-list" id="pList2">
      <div class="p-row"><textarea rows="3" placeholder="Görüşmede aktarılanları ve alınan kararları yazınız..."></textarea><button type="button" class="p-remove">&times;</button></div>
    </div>
    <button type="button" class="paragraph-list-add" data-target="pList2">+ Paragraf ekle</button>'''

closing = ('    <div class="closing-line" contenteditable="true">İşbu tutanak, durumun tespiti ve velinin '
           'bilgilendirildiğine dair resmî kayıt oluşturulması amacıyla okul idaresi ve veli tarafından '
           'birlikte imza altına alınmıştır.</div>')

signature = '''    <table class="imza">
      <tr>
        <td>
          <div class="imza-label">Veli</div>
          <input type="text" placeholder="Adı Soyadı">
          <div class="imza-box"></div>
        </td>
        <td>
          <div class="imza-label">Sınıf Rehber Öğretmeni</div>
          <input type="text" placeholder="Adı Soyadı">
          <div class="imza-box"></div>
        </td>
        <td>
          <div class="imza-label">Okul Müdürü</div>
          <input type="text" placeholder="Adı Soyadı">
          <div class="imza-box"></div>
        </td>
      </tr>
    </table>'''

body = "\n".join([kurum_head, title, ust_bilgi, ogrenci, veli, tespit, karar, closing, signature])

html = page("Veli Görüşme Tutanağı", body, extra_style=EXTRA_STYLE)
with open(os.path.join(OUT, "veli-gorusme-tutanagi.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("wrote veli-gorusme-tutanagi.html")
