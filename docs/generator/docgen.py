"""Shared layout toolkit for the UNZA CICT system documents (ReportLab platypus)."""
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak, KeepTogether, CondPageBreak, NextPageTemplate,
                                Flowable)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon
from xml.sax.saxutils import escape

FONT_DIR = r"C:\Windows\Fonts"
pdfmetrics.registerFont(TTFont("Body", FONT_DIR + r"\segoeui.ttf"))
pdfmetrics.registerFont(TTFont("Body-Bold", FONT_DIR + r"\segoeuib.ttf"))
pdfmetrics.registerFont(TTFont("Body-Italic", FONT_DIR + r"\segoeuii.ttf"))
pdfmetrics.registerFont(TTFont("Body-Semi", FONT_DIR + r"\seguisb.ttf"))
pdfmetrics.registerFont(TTFont("Body-Light", FONT_DIR + r"\segoeuisl.ttf"))
pdfmetrics.registerFont(TTFont("Mono", FONT_DIR + r"\consola.ttf"))
pdfmetrics.registerFont(TTFont("Mono-Bold", FONT_DIR + r"\consolab.ttf"))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic",
                              boldItalic="Body-Bold")
pdfmetrics.registerFontFamily("Mono", normal="Mono", bold="Mono-Bold", italic="Mono", boldItalic="Mono-Bold")

# Official UNZA colours (crest RGB sheet); tints and shades are mixed only from these.
UNZA_GREEN = colors.HexColor("#01862B")
UNZA_LIGHT_GREEN = colors.HexColor("#93B800")
UNZA_ORANGE = colors.HexColor("#F3950C")
UNZA_BROWN = colors.HexColor("#EF942E")
UNZA_RED = colors.HexColor("#D4000D")
UNZA_BLACK = colors.HexColor("#050000")

GREEN = UNZA_GREEN
GREEN_DARK = colors.HexColor("#02531B")      # green 62% + black
GREEN_TINT = colors.HexColor("#EBF5ED")      # green 8% on white
GOLD = UNZA_ORANGE
GOLD_TINT = colors.HexColor("#FEF4E7")       # orange 9% on white
INK = UNZA_BLACK
MUTED = colors.HexColor("#5E5B5B")           # black 62% on white
RULE = colors.HexColor("#D9E9DD")            # green 14% on white
ZEBRA = colors.HexColor("#F5FAF6")
BLUE_TINT = colors.HexColor("#F4F8E5")       # light green 10% on white
BLUE = UNZA_LIGHT_GREEN
RED_TINT = colors.HexColor("#FBE6E7")        # red 10% on white
RED = UNZA_RED

PAGE_W, PAGE_H = A4
MARGIN_X = 20 * mm
CONTENT_W = PAGE_W - 2 * MARGIN_X

S = {}
S["body"] = ParagraphStyle("body", fontName="Body", fontSize=10, leading=14.5, textColor=INK,
                           spaceAfter=6)
S["lead"] = ParagraphStyle("lead", parent=S["body"], fontSize=11, leading=16, textColor=MUTED,
                           spaceAfter=10)
S["small"] = ParagraphStyle("small", parent=S["body"], fontSize=8.5, leading=11.5, textColor=MUTED)
S["h1"] = ParagraphStyle("h1", fontName="Body-Bold", fontSize=20, leading=25, textColor=GREEN_DARK,
                         spaceBefore=0, spaceAfter=10)
S["h2"] = ParagraphStyle("h2", fontName="Body-Bold", fontSize=13.5, leading=18, textColor=GREEN,
                         spaceBefore=14, spaceAfter=5)
S["h3"] = ParagraphStyle("h3", fontName="Body-Semi", fontSize=11, leading=15, textColor=INK,
                         spaceBefore=10, spaceAfter=3)
S["bullet"] = ParagraphStyle("bullet", parent=S["body"], leftIndent=14, bulletIndent=3,
                             spaceAfter=3)
S["num"] = ParagraphStyle("num", parent=S["body"], leftIndent=18, bulletIndent=2, spaceAfter=4)
S["code"] = ParagraphStyle("code", fontName="Mono", fontSize=8.6, leading=11.6, textColor=INK)
S["cell"] = ParagraphStyle("cell", fontName="Body", fontSize=8.8, leading=12, textColor=INK)
S["cellb"] = ParagraphStyle("cellb", parent=S["cell"], fontName="Body-Semi")
S["cellh"] = ParagraphStyle("cellh", parent=S["cell"], fontName="Body-Bold", textColor=colors.white)
S["callout"] = ParagraphStyle("callout", parent=S["body"], fontSize=9.5, leading=13.5, spaceAfter=0)
S["toc1"] = ParagraphStyle("toc1", fontName="Body-Semi", fontSize=10.5, leading=15, leftIndent=0,
                           spaceBefore=5, textColor=INK)
S["toc2"] = ParagraphStyle("toc2", fontName="Body", fontSize=9.5, leading=13, leftIndent=16,
                           textColor=MUTED)


def md(text, code_size=8.8):
    """Light inline markup: `code`, **bold**, *italic*. Everything else is escaped."""
    import re
    text = escape(text)
    codes = []

    def stash(m):
        codes.append(m.group(1))
        return f"\x00{len(codes) - 1}\x00"

    text = re.sub(r"`([^`]+)`", stash, text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<![*\w])\*([^*\s][^*]*)\*(?!\w)", r"<i>\1</i>", text)
    return re.sub(r"\x00(\d+)\x00",
                  lambda m: f'<font face="Mono" size="{code_size}" color="#073D27">{codes[int(m.group(1))]}</font>', text)


class Doc:
    """Collects flowables; auto-numbers headings; feeds the table of contents."""

    def __init__(self, path, title, subtitle, doc_type, version, date, audience, logo):
        self.path, self.title, self.subtitle = path, title, subtitle
        self.doc_type, self.version, self.date, self.audience, self.logo = doc_type, version, date, audience, logo
        self.story = []
        self.h1n = 0
        self.h2n = 0
        self.h3n = 0

    # ---- text -------------------------------------------------------------
    def p(self, text, style="body"):
        self.story.append(Paragraph(md(text), S[style]))

    def lead(self, text):
        self.p(text, "lead")

    def bullets(self, items):
        for it in items:
            self.story.append(Paragraph(md(it), S["bullet"], bulletText="•"))
        self.story.append(Spacer(1, 3))

    def steps(self, items):
        for n, it in enumerate(items, 1):
            self.story.append(Paragraph(md(it), S["num"], bulletText=f"{n}."))
        self.story.append(Spacer(1, 3))

    def defs(self, pairs, key_w=0.3):
        """Two-column definition list without a header row."""
        self.table(None, pairs, [key_w, 1 - key_w], first_col_bold=True)

    def code(self, text):
        lines = [escape(l).replace(" ", "&nbsp;") or "&nbsp;" for l in text.strip("\n").split("\n")]
        para = Paragraph("<br/>".join(lines), S["code"])
        t = Table([[para]], colWidths=[CONTENT_W])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F3F5F4")),
            ("BOX", (0, 0), (-1, -1), 0.6, RULE),
            ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        self.story.append(t)
        self.story.append(Spacer(1, 8))

    def callout(self, kind, text):
        palette = {"note": (BLUE_TINT, BLUE, GREEN_DARK, "Note"), "tip": (GREEN_TINT, GREEN, GREEN, "Tip"),
                   "warning": (RED_TINT, RED, RED, "Important"), "info": (GOLD_TINT, GOLD, colors.HexColor("#9A5A00"), "Good to know")}
        bg, edge, label_color, label = palette[kind]
        para = Paragraph(f'<font face="Body-Bold" color="{label_color.hexval().replace("0x", "#")}">{label}.</font> '
                         + md(text), S["callout"])
        t = Table([[para]], colWidths=[CONTENT_W])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg),
            ("LINEBEFORE", (0, 0), (0, -1), 3, edge),
            ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]))
        self.story.append(KeepTogether([t, Spacer(1, 9)]))

    def space(self, h=6):
        self.story.append(Spacer(1, h))

    def page_break(self):
        self.story.append(PageBreak())

    def keep(self, h=120):
        self.story.append(CondPageBreak(h))

    # ---- headings ---------------------------------------------------------
    def h1(self, text, numbered=True):
        self.story.append(PageBreak())
        if numbered:
            self.h1n += 1
            self.h2n = 0
            label = f"{self.h1n}. {text}"
        else:
            label = text
        para = Paragraph(md(label), S["h1"])
        para._toc = (0, label)
        self.story.append(para)
        self.story.append(Rule(CONTENT_W, GOLD, 2, 48))
        self.story.append(Spacer(1, 10))

    def h2(self, text):
        self.h2n += 1
        self.h3n = 0
        label = f"{self.h1n}.{self.h2n} {text}" if self.h1n else text
        para = Paragraph(md(label), S["h2"])
        para._toc = (1, label)
        self.story.append(CondPageBreak(70))
        self.story.append(para)

    def h3(self, text):
        self.story.append(CondPageBreak(50))
        self.story.append(Paragraph(md(text), S["h3"]))

    # ---- tables -----------------------------------------------------------
    def table(self, header, rows, widths, first_col_bold=False, mono_cols=(), font_size=None,
              repeat=1):
        widths = [w * CONTENT_W for w in widths]
        cell = S["cell"] if font_size is None else ParagraphStyle("c", parent=S["cell"], fontSize=font_size,
                                                                  leading=font_size + 3.2)
        data = []
        if header:
            data.append([Paragraph(md(h), S["cellh"]) for h in header])
        for r in rows:
            out = []
            for ci, v in enumerate(r):
                if isinstance(v, Flowable):
                    out.append(v)
                    continue
                txt = md(str(v), code_size=round(cell.fontSize - 0.5, 1))
                if ci in mono_cols:
                    txt = f'<font face="Mono" size="{round(cell.fontSize - 0.5, 1)}">{escape(str(v))}</font>'
                style = S["cellb"] if (first_col_bold and ci == 0) else cell
                out.append(Paragraph(txt, style))
            data.append(out)
        t = Table(data, colWidths=widths, repeatRows=repeat if header else 0)
        ts = [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
            ("BOX", (0, 0), (-1, -1), 0.6, RULE),
        ]
        start = 0
        if header:
            ts += [("BACKGROUND", (0, 0), (-1, 0), GREEN), ("LINEBELOW", (0, 0), (-1, 0), 0, GREEN)]
            start = 1
        for i in range(start, len(data)):
            if (i - start) % 2 == 1:
                ts.append(("BACKGROUND", (0, i), (-1, i), ZEBRA))
        t.setStyle(TableStyle(ts))
        self.story.append(t)
        self.story.append(Spacer(1, 10))

    def add(self, flowable):
        self.story.append(flowable)

    # ---- build ------------------------------------------------------------
    def toc_page(self):
        self.story.append(Paragraph("Contents", S["h1"]))
        self.story.append(Rule(CONTENT_W, GOLD, 2, 48))
        self.story.append(Spacer(1, 12))
        toc = TableOfContents()
        toc.levelStyles = [S["toc1"], S["toc2"]]
        toc.dotsMinLevel = 0
        self.story.append(toc)

    def build(self):
        doc = _Template(self.path, self, pagesize=A4, leftMargin=MARGIN_X, rightMargin=MARGIN_X,
                        topMargin=24 * mm, bottomMargin=20 * mm, title=self.title.replace("\n", " "),
                        author="CICT, University of Zambia", subject=self.subtitle)
        story = [NextPageTemplate("body"), PageBreak()] + self.story
        doc.multiBuild(story)


class Rule(Flowable):
    def __init__(self, width, color, thickness, length=None):
        super().__init__()
        self.width, self.color, self.thickness, self.length = width, color, thickness, length

    def wrap(self, aw, ah):
        return self.width, self.thickness + 1

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0, self.length or self.width, 0)


class _Template(BaseDocTemplate):
    def __init__(self, filename, meta, **kw):
        super().__init__(filename, **kw)
        self.meta = meta
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="f",
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([
            PageTemplate(id="cover", frames=[frame], onPage=self._cover),
            PageTemplate(id="body", frames=[frame], onPage=self._chrome),
        ])

    def afterFlowable(self, flowable):
        toc = getattr(flowable, "_toc", None)
        if toc:
            level, text = toc
            key = f"h{level}-{self.seq.nextf('toc')}"
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, level=level, closed=level > 0)
            # Footers number pages from the first page after the cover, so the contents must too.
            self.notify("TOCEntry", (level, text, self.page - 1, key))

    def _chrome(self, canv, doc):
        m = self.meta
        canv.saveState()
        canv.setFillColor(GREEN)
        canv.rect(0, PAGE_H - 9 * mm, PAGE_W, 9 * mm, stroke=0, fill=1)
        canv.setFillColor(colors.white)
        canv.setFont("Body-Semi", 8.5)
        canv.drawString(MARGIN_X, PAGE_H - 6 * mm, "University of Zambia · CICT")
        canv.setFont("Body", 8.5)
        canv.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 6 * mm, m.title.replace("\n", " "))
        canv.setStrokeColor(RULE)
        canv.setLineWidth(0.5)
        canv.line(MARGIN_X, 13 * mm, PAGE_W - MARGIN_X, 13 * mm)
        canv.setFillColor(MUTED)
        canv.setFont("Body", 8)
        canv.drawString(MARGIN_X, 9 * mm, f"{m.doc_type} · Version {m.version} · {m.date}")
        canv.drawRightString(PAGE_W - MARGIN_X, 9 * mm, f"Page {doc.page - 1}")
        canv.restoreState()

    def _cover(self, canv, doc):
        m = self.meta
        canv.saveState()
        canv.setFillColor(GREEN_DARK)
        canv.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
        canv.setFillColor(GREEN)
        canv.rect(0, 0, PAGE_W, PAGE_H * 0.42, stroke=0, fill=1)
        canv.setFillColor(GOLD)
        canv.rect(0, PAGE_H * 0.42, PAGE_W, 3, stroke=0, fill=1)
        # logo on a white disc
        cx, cy = MARGIN_X + 18 * mm, PAGE_H - 45 * mm
        canv.setFillColor(colors.white)
        canv.circle(cx, cy, 17 * mm, stroke=0, fill=1)
        try:
            canv.drawImage(m.logo, cx - 13 * mm, cy - 13 * mm, 26 * mm, 26 * mm, mask="auto",
                           preserveAspectRatio=True)
        except Exception:
            pass
        canv.setFillColor(colors.white)
        canv.setFont("Body-Semi", 12)
        canv.drawString(cx + 23 * mm, cy + 3 * mm, "University of Zambia")
        canv.setFont("Body", 10)
        canv.setFillColor(colors.HexColor("#D6EBDC"))
        canv.drawString(cx + 23 * mm, cy - 3 * mm, "Centre for Information and Communications Technology")
        # titles
        canv.setFillColor(GOLD)
        canv.setFont("Body-Bold", 11)
        canv.drawString(MARGIN_X, PAGE_H * 0.64, m.doc_type.upper())
        canv.setFillColor(colors.white)
        canv.setFont("Body-Bold", 30)
        y = PAGE_H * 0.64 - 15 * mm
        for line in m.title.split("\n"):
            canv.drawString(MARGIN_X, y, line)
            y -= 12 * mm
        canv.setFont("Body-Light", 14)
        canv.setFillColor(colors.HexColor("#DCEBE2"))
        canv.drawString(MARGIN_X, y + 2 * mm, m.subtitle)
        # details block
        canv.setFillColor(colors.white)
        rows = [("Version", m.version), ("Date", m.date), ("Prepared for", m.audience),
                ("Owner", "CICT, University of Zambia")]
        y = PAGE_H * 0.42 - 22 * mm
        for k, v in rows:
            canv.setFont("Body-Semi", 9.5)
            canv.setFillColor(colors.HexColor("#D6EBDC"))
            canv.drawString(MARGIN_X, y, k.upper())
            canv.setFont("Body", 11)
            canv.setFillColor(colors.white)
            canv.drawString(MARGIN_X + 38 * mm, y, v)
            y -= 9 * mm
        canv.setFont("Body", 8.5)
        canv.setFillColor(colors.HexColor("#D6EBDC"))
        canv.drawString(MARGIN_X, 14 * mm, "UNZA CICT Equipment Specification & Request Management System")
        canv.restoreState()


# ---- diagrams ------------------------------------------------------------
def _arrow(d, x1, y1, x2, y2, color=MUTED, width=1.1):
    import math
    d.add(Line(x1, y1, x2, y2, strokeColor=color, strokeWidth=width))
    ang = math.atan2(y2 - y1, x2 - x1)
    L, W = 6, 3
    bx, by = x2 - L * math.cos(ang), y2 - L * math.sin(ang)
    px, py = -math.sin(ang) * W, math.cos(ang) * W
    d.add(Polygon([x2, y2, bx + px, by + py, bx - px, by - py], fillColor=color, strokeColor=color,
                  strokeWidth=0.5))


def box(d, x, y, w, h, title, sub=None, fill=GREEN_TINT, edge=GREEN, title_color=GREEN_DARK, size=8.6):
    d.add(Rect(x, y, w, h, rx=5, ry=5, fillColor=fill, strokeColor=edge, strokeWidth=0.9))
    lines = title.split("\n")
    sub_lines = sub.split("\n") if sub else []
    total = len(lines) * (size + 2) + len(sub_lines) * (size)
    ty = y + h / 2 + total / 2 - size
    for ln in lines:
        d.add(String(x + w / 2, ty, ln, fontName="Body-Bold", fontSize=size, fillColor=title_color,
                     textAnchor="middle"))
        ty -= size + 2
    for ln in sub_lines:
        d.add(String(x + w / 2, ty, ln, fontName="Body", fontSize=size - 1.4, fillColor=MUTED,
                     textAnchor="middle"))
        ty -= size


def pipeline(stages, height=62, caption=None, colors_=None):
    """Left-to-right chain of boxes; wraps onto two rows if needed. stages: [(title, sub)]."""
    per_row = min(len(stages), 5)
    rows = [stages[i:i + per_row] for i in range(0, len(stages), per_row)]
    gap = 14
    bw = (CONTENT_W - gap * (per_row - 1)) / per_row
    bh = height - 14
    total_h = len(rows) * (bh + 26) + 4
    d = Drawing(CONTENT_W, total_h)
    idx = 0
    for r, row in enumerate(rows):
        y = total_h - (r + 1) * (bh + 26) + 18
        for c, (t, s) in enumerate(row):
            x = c * (bw + gap)
            fill, edge = (colors_[idx] if colors_ else (GREEN_TINT, GREEN))
            box(d, x, y, bw, bh, t, s, fill=fill, edge=edge)
            if c < len(row) - 1:
                _arrow(d, x + bw + 1, y + bh / 2, x + bw + gap - 1, y + bh / 2)
            idx += 1
        if r < len(rows) - 1:
            # elbow from end of row to start of next row
            lx = (len(row) - 1) * (bw + gap) + bw / 2
            ny = y - 26 + bh
            d.add(Line(lx, y, lx, y - 10, strokeColor=MUTED, strokeWidth=1.1))
            d.add(Line(lx, y - 10, bw / 2, y - 10, strokeColor=MUTED, strokeWidth=1.1))
            _arrow(d, bw / 2, y - 10, bw / 2, ny + 1)
    return d


def figure(doc, drawing, caption):
    items = [drawing, Spacer(1, 4), Paragraph(md(caption), ParagraphStyle(
        "cap", parent=S["small"], alignment=TA_CENTER))]
    doc.add(KeepTogether(items + [Spacer(1, 10)]))


arrow = _arrow
