# -*- coding: utf-8 -*-

PAGE_TMPL = """<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title_tag}</title>
<link rel="stylesheet" href="../assets/style.css">
{extra_style}</head>
<body>

  <div class="toolbar">
    <a class="back" href="../index.html">&larr; Ana Sayfa</a>
    <span class="hint">Alanları doldurun, ardından &quot;Yazdır / PDF Al&quot; ile A4 boyutunda PDF olarak kaydedin.</span>
    <div class="btns">
      <button class="secondary" type="button" onclick="clearForm()">Formu Temizle</button>
      <button type="button" onclick="printForm()">🖨️ Yazdır / PDF Al</button>
    </div>
  </div>

  <div class="page">
{body}
    <div class="foot">
      <span data-persist="okulAdi">…</span>
      <span>İdari Belgeler Uygulama Kiti</span>
    </div>
  </div>

<script src="../assets/app.js"></script>
</body>
</html>
"""

def page(title_tag, body, extra_style=""):
    return PAGE_TMPL.format(title_tag=title_tag, body=body, extra_style=extra_style)


def field_row(cells, widths=None):
    """cells: list of (label, html) pairs -> one <tr> with label/value/label/value..."""
    n = len(cells)
    if widths is None:
        label_w = 15
        value_w = (100 - label_w * n) / n
        widths = [(label_w, value_w) for _ in range(n)]
    tds = []
    for (label, html), (lw, vw) in zip(cells, widths):
        tds.append(f'<td class="label" style="width:{lw}%">{label}</td><td style="width:{vw}%">{html}</td>')
    return "      <tr>" + "".join(tds) + "</tr>"


def subhead_row(text, colspan=4):
    return (f'      <tr><td colspan="{colspan}" style="border:none; background:transparent; '
            f'font-family:Arial,sans-serif; font-weight:bold; font-size:9.5pt; color:#333; '
            f'padding:8px 2px 2px;">{text}</td></tr>')


def mirror_field(key, kind="text"):
    return f'<span class="mirror-span" data-mirror-target="{key}">……………</span>'


def input_field(key, kind="text", extra_attrs=""):
    if kind == "date":
        return f'<input type="date" data-mirror="{key}" {extra_attrs}>'
    if kind == "time":
        return f'<input type="time" data-mirror="{key}" {extra_attrs}>'
    if kind == "tc":
        return f'<input type="text" inputmode="numeric" maxlength="11" data-mirror="{key}" {extra_attrs}>'
    return f'<input type="text" data-mirror="{key}" {extra_attrs}>'


def field_row_single(label, html, label_w=20, colspan=1):
    cs = f' colspan="{colspan}"' if colspan > 1 else ""
    return f'      <tr><td class="label" style="width:{label_w}%">{label}</td><td{cs}>{html}</td></tr>'


def signature_cell(label, name_html, title_html=None, box_height=36):
    title_part = f'\n          {title_html}' if title_html else ""
    return f'''        <td>
          <div class="imza-box" style="height:{box_height}px;"></div>
          {name_html}{title_part}
          <div class="imza-label">{label}</div>
        </td>'''
