# -*- coding: utf-8 -*-
from gen_common import *
import os

OUT = "/home/claude/idari-belge-sablonlari/belgeler"
os.makedirs(OUT, exist_ok=True)

EXTRA_STYLE = """<style>
  .doc-title{ text-align:center; font-size:15pt; color:var(--navy); margin: 4px 0 16px; letter-spacing:.5px; }
  .para{ font-size:10.6pt; line-height:1.6; text-align:justify; margin: 6px 0 10px; text-indent: 1.25cm; }
  .section{ margin-top: 18px; }
  .section-heading{ font-weight:bold; font-size:11pt; color:var(--navy); margin: 0 0 4px; font-family: Arial, sans-serif; }
  .section-note{ font-size:9.3pt; color:#666; font-family:Arial,sans-serif; margin: -2px 0 8px; font-style:italic; }
  .choice-row{ display:flex; gap: 26px; margin: 4px 0 4px 1.25cm; font-family: Arial, sans-serif; font-size:10.3pt; flex-wrap:wrap; }
  .choice-row label{ display:flex; align-items:center; gap:6px; cursor:pointer; white-space:nowrap; flex:0 0 auto; }
  .choice-row input{ width:15px; height:15px; accent-color: var(--navy); }
  hr.section-rule{ border:none; border-top:1px solid #e2e2e2; margin: 14px 0 0; }
  .closing-line{ text-indent: 1.25cm; }
  .sig-block{ margin-top: 26px; }
  .sig-block .row{ display:flex; align-items:baseline; gap:10px; margin: 10px 0; font-size:10.6pt; }
  .sig-block .row .lbl{ font-weight:bold; flex:0 0 auto; }
  .sig-block .row input[type=text]{ flex:1 1 auto; border:none; border-bottom:1px dotted #888; font-family:inherit; font-size:inherit; outline:none; padding:2px; }
  .sig-block .row .imza-line{ flex:1 1 auto; border-bottom:1px dotted #888; height:1.3em; }
  .sig-block .row input[type=date]{ border:none; font-family:inherit; font-size:inherit; }
</style>
"""

title = '    <h1 class="doc-title">VELİ MUVAFAKATNAMESİ</h1>'

ident_table = '''    <table class="meta">
      <tr><td class="label" style="width:32%">Öğrencinin Adı Soyadı</td><td><input type="text" placeholder="Adı Soyadı"></td></tr>
      <tr><td class="label">Sınıfı / Numarası</td><td style="white-space:nowrap;">
        <input type="text" placeholder="Sınıfı" style="width:48%; display:inline-block;">
        <span style="display:inline-block;width:8px;"></span>
        <input type="text" placeholder="Numarası" style="width:38%; display:inline-block;">
      </td></tr>
      <tr><td class="label">Veli Telefonu</td><td><input type="tel" placeholder="0532 - 123 45 67"></td></tr>
    </table>'''


def section(heading, paragraph, choice_name, choices, note=None):
    note_html = f'      <div class="section-note">{note}</div>\n' if note else ""
    choice_html_rows = "\n".join(
        f'        <label><input type="radio" name="{choice_name}" value="{val}"> {lbl}</label>'
        for val, lbl in choices
    )
    return f'''    <div class="section">
      <div class="section-heading">{heading}</div>
{note_html}      <div class="para">{paragraph}</div>
      <div class="choice-row">
{choice_html_rows}
      </div>
    </div>
    <hr class="section-rule">'''


sections = []

sections.append(section(
    "Gezi ve Okul Dışı Etkinlik İzni",
    "Okul tarafından düzenlenen kısa mesafeli ve merkez ilçe sınırları içerisinde gerçekleştirilen geziler, "
    "müze ziyaretleri, kültürel ve sportif etkinlikler ile okul dışı eğitim faaliyetlerine öğrencimin katılmasına "
    "ilişkin tarafıma gerekli bilgilendirme yapılmıştır. Bu tür etkinlikler öğrencilerin güvenliği gözetilerek "
    "planlanmakta olup, etkinlik süresince öğretmenler ve okul yönetimi tarafından gözetim sağlanmaktadır.",
    "izin_gezi", [("evet", "İzin veriyorum"), ("hayir", "İzin vermiyorum")]
))

sections.append(section(
    "Öğle Arasında Okuldan Dışarı Çıkma",
    "Öğrencimin öğle arası süresince okul yönetiminin belirlediği kurallar çerçevesinde okul kampüsünden "
    "çıkabileceği konusunda bilgilendirildim. Bu süre boyunca öğrencinin sorumluluğunun velisi olarak tarafıma "
    "ait olduğunu biliyorum ve okul yönetimi tarafından gerekli uyarı ve yönlendirmelerin yapılacağını kabul "
    "ediyorum.",
    "izin_ogle", [("evet", "İzin veriyorum"), ("hayir", "İzin vermiyorum")],
    note=("NOT: İkamet adresi Kumkale olan öğrenciler her gün çıkabilir, diğer köylerden gelen taşıma yoluyla "
          "eğitime erişim sağlayan öğrenciler ise haftada 1 gün; 5. Sınıflar Salı, 6. Sınıflar Çarşamba, "
          "7. Sınıflar Perşembe, 8. Sınıflar Cuma günü çıkabilir.")
))

sections.append(section(
    "Acil Durum Sağlık Müdahalesi ve İlk Yardım",
    "Öğrencimin okulda bulunduğu süre içerisinde ortaya çıkabilecek acil sağlık durumlarında nöbetçi öğretmen "
    "veya yetkili personel tarafından ilk yardım uygulanabileceği; gerektiğinde öğrencinin sağlık kuruluşuna "
    "yönlendirilebileceği konusunda bilgi edindim. Velilere ulaşılamadığı durumlarda hayati risk oluşturan acil "
    "müdahalelerin yapılabileceğini ve öğrencimin sağlık bilgileri, alerji durumu veya özel gereksinimleri "
    "hakkında doğru bilgileri okula iletme sorumluluğunun tarafıma ait olduğunu kabul ediyorum.",
    "izin_saglik", [("evet", "Bilgi edindim")]
))

sections.append(section(
    "Etkinliklerde Fotoğraf / Video Çekimi ve Yayınlanması",
    "Okul tarafından düzenlenen sosyal, kültürel, sportif ve akademik etkinliklerde öğrencimin fotoğraf ve/veya "
    "videolarının çekilebileceği; bu görüntülerin okulun web sayfası, sosyal medya hesapları veya tanıtım "
    "materyallerinde yayımlanabileceği konusunda bilgilendirildim. Yapılacak paylaşımların öğrencilerin "
    "güvenliği ve mahremiyeti gözetilerek gerçekleştirileceğini biliyorum.",
    "izin_foto", [("evet", "İzin veriyorum"), ("hayir", "İzin vermiyorum")]
))

sections.append(section(
    "Kermes, Hayır Yemeği ve Benzeri Etkinliklerde Yiyecek Tüketimi",
    "Okulda düzenlenen kermes, hayır yemeği ve benzeri etkinliklerde bağış veya ev yapımı niteliğinde hazırlanmış "
    "yiyecek ve içeceklerin dağıtılabileceği; öğrencimin bu tür yiyecekleri tüketebileceği konusunda "
    "bilgilendirildim. Öğrencimin alerji, hassasiyet veya sağlık sorunlarına ilişkin bilgileri okula zamanında "
    "bildirmekle yükümlü olduğumu kabul ediyorum.",
    "izin_kermes", [("evet", "İzin veriyorum"), ("hayir", "İzin vermiyorum")]
))

sections.append(section(
    "Ödül, Yarışma ve Dış Kuruluşlarla Etkileşim",
    "Öğrencimin okul tarafından uygun görülen akademik, sportif, kültürel yarışmalar, projeler ve etkinliklere "
    "katılabileceği; bu etkinlikler kapsamında öğrencinin bilgileri, çalışmaları veya başarılarının ilgili kurum "
    "ve kuruluşlarla paylaşılabileceği konusunda bilgilendirildim. Bu etkinliklerin öğrencinin gelişimine katkı "
    "sağlamak amacıyla ve gerekli güvenlik kontrolleri yapılarak yürütüldüğünü biliyorum.",
    "izin_odul", [("evet", "İzin veriyorum"), ("hayir", "İzin vermiyorum")]
))

closing = ('    <div class="closing-line" contenteditable="true">Yukarıda belirtilen tüm maddeleri okuduğumu, '
           'anladığımı ve gerektiğinde yazılı beyan ile değiştirebileceğimi kabul ederim.</div>')

signature = '''    <div class="sig-block">
      <div class="row"><span class="lbl">Tarih:</span> <input type="date"></div>
      <div class="row"><span class="lbl">Veli Adı Soyadı:</span> <input type="text" placeholder="Adı Soyadı"></div>
      <div class="row"><span class="lbl">İmza:</span> <span class="imza-line"></span></div>
    </div>'''

body = "\n".join([title, ident_table] + sections + [closing, signature])

html = page("Veli Muvafakatnamesi", body, extra_style=EXTRA_STYLE)
with open(os.path.join(OUT, "veli-muvafakatnamesi.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("wrote veli-muvafakatnamesi.html")
