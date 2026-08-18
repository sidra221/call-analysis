#!/usr/bin/env python3
"""Generate Figure (1-4): three-tier system architecture diagram (SVG + PNG)."""

from pathlib import Path

import cairo
import gi

gi.require_version("Pango", "1.0")
gi.require_version("PangoCairo", "1.0")
from gi.repository import Pango, PangoCairo

W, H = 1080.0, 1188.0
OUT_DIR = Path(__file__).resolve().parent

NAVY = (0.102, 0.212, 0.365)
NAVY_FILL = (0.910, 0.933, 0.961)
BLUE = (0.169, 0.424, 0.690)
BLUE_FILL = (0.890, 0.945, 0.992)
GREEN = (0.145, 0.416, 0.310)
GREEN_FILL = (0.890, 0.953, 0.910)
SLATE = (0.290, 0.365, 0.451)
SLATE_FILL = (0.941, 0.945, 0.953)
SLATE2 = (0.239, 0.310, 0.380)
SLATE2_FILL = (0.925, 0.933, 0.941)
AMBER = (0.573, 0.396, 0.090)
AMBER_FILL = (1.000, 0.973, 0.910)
ORANGE = (0.753, 0.337, 0.129)
ORANGE_FILL = (1.000, 0.945, 0.894)

INK = (0.145, 0.173, 0.224)
MUTED = (0.392, 0.455, 0.545)
LINE = (0.259, 0.322, 0.412)
PAPER = (1.0, 1.0, 1.0)
RULE = (0.820, 0.843, 0.863)

FONT = "Liberation Sans"
FONT_AR = "Noto Naskh Arabic"


def set_color(ctx, rgb, a=1.0):
    ctx.set_source_rgba(rgb[0], rgb[1], rgb[2], a)


def rounded_rect(ctx, x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -0.5 * 3.14159, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, 0.5 * 3.14159)
    ctx.arc(x + r, y + h - r, r, 0.5 * 3.14159, 3.14159)
    ctx.arc(x + r, y + r, r, 3.14159, 1.5 * 3.14159)
    ctx.close_path()


def text_size(ctx, text, size, weight="normal", font=FONT):
    layout = PangoCairo.create_layout(ctx)
    layout.set_font_description(Pango.FontDescription(f"{font} {weight} {size}"))
    layout.set_text(text, -1)
    _, logical = layout.get_pixel_extents()
    return logical.width, logical.height, layout


def draw_text(ctx, text, x, y, size, rgb=INK, weight="normal", align="left", font=FONT):
    tw, th, layout = text_size(ctx, text, size, weight, font)
    if align == "center":
        x -= tw / 2
    elif align == "right":
        x -= tw
    set_color(ctx, rgb)
    ctx.move_to(x, y)
    PangoCairo.show_layout(ctx, layout)
    return tw, th


def draw_band(ctx, x, y, w, h, fill, accent, ar_label, en_label):
    set_color(ctx, fill)
    rounded_rect(ctx, x, y, w, h, 14)
    ctx.fill()
    set_color(ctx, accent, 0.20)
    ctx.rectangle(x, y + 12, 6, h - 24)
    ctx.fill()

    ctx.save()
    ctx.translate(x + 26, y + h / 2)
    ctx.rotate(-1.57079632679)
    draw_text(ctx, ar_label, 0, -15, 12.5, accent, "bold", "center", FONT_AR)
    draw_text(ctx, en_label, 0, 6, 10, MUTED, "normal", "center")
    ctx.restore()


def draw_component(ctx, x, y, w, h, header, fill, title, subtitle):
    header_h = 40

    set_color(ctx, (0, 0, 0), 0.055)
    rounded_rect(ctx, x + 1.4, y + 2.2, w, h, 11)
    ctx.fill()

    set_color(ctx, fill)
    rounded_rect(ctx, x, y, w, h, 11)
    ctx.fill()

    ctx.save()
    rounded_rect(ctx, x, y, w, h, 11)
    ctx.clip()
    set_color(ctx, header)
    ctx.rectangle(x, y, w, header_h)
    ctx.fill()
    ctx.restore()

    set_color(ctx, header, 0.90)
    rounded_rect(ctx, x, y, w, h, 11)
    ctx.set_line_width(1.35)
    ctx.stroke()

    draw_text(ctx, title, x + w / 2, y + 11, 14.2, (1, 1, 1), "bold", "center")
    draw_text(ctx, subtitle, x + w / 2, y + header_h + 12, 12, header, "normal", "center")
    return x, y, w, h


def arrow_head(ctx, x, y, dx, dy, color, size=9):
    length = (dx * dx + dy * dy) ** 0.5 or 1
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    set_color(ctx, color)
    ctx.new_path()
    ctx.move_to(x, y)
    ctx.line_to(x - ux * size + px * size * 0.55, y - uy * size + py * size * 0.55)
    ctx.line_to(x - ux * size - px * size * 0.55, y - uy * size - py * size * 0.55)
    ctx.close_path()
    ctx.fill()


def draw_arrow(ctx, x1, y1, x2, y2, color=LINE, dashed=False, width=2.0):
    dx, dy = x2 - x1, y2 - y1
    length = (dx * dx + dy * dy) ** 0.5 or 1
    ux, uy = dx / length, dy / length
    x2s, y2s = x2 - ux * 10, y2 - uy * 10
    set_color(ctx, color)
    ctx.set_line_width(width)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_dash([7, 5] if dashed else [])
    ctx.move_to(x1, y1)
    ctx.line_to(x2s, y2s)
    ctx.stroke()
    ctx.set_dash([])
    arrow_head(ctx, x2, y2, dx, dy, color, 10)


def label_box(ctx, text, x, y, fill=PAPER, ink=INK, size=10.5):
    tw, th, layout = text_size(ctx, text, size, "normal")
    pad_x, pad_y = 8, 3
    bx, by = x - tw / 2 - pad_x, y - th / 2 - pad_y
    bw, bh = tw + 2 * pad_x, th + 2 * pad_y
    set_color(ctx, fill)
    rounded_rect(ctx, bx, by, bw, bh, 4)
    ctx.fill()
    set_color(ctx, RULE)
    rounded_rect(ctx, bx, by, bw, bh, 4)
    ctx.set_line_width(0.8)
    ctx.stroke()
    set_color(ctx, ink)
    ctx.move_to(bx + pad_x, by + pad_y)
    PangoCairo.show_layout(ctx, layout)


def card(ctx, x, y, w, h):
    set_color(ctx, PAPER)
    rounded_rect(ctx, x, y, w, h, 10)
    ctx.fill()
    set_color(ctx, RULE)
    rounded_rect(ctx, x, y, w, h, 10)
    ctx.set_line_width(1)
    ctx.stroke()


def draw(ctx):
    set_color(ctx, PAPER)
    ctx.rectangle(0, 0, W, H)
    ctx.fill()

    set_color(ctx, (0.965, 0.973, 0.980))
    rounded_rect(ctx, 18, 14, W - 36, H - 28, 16)
    ctx.fill()
    set_color(ctx, RULE)
    rounded_rect(ctx, 18, 14, W - 36, H - 28, 16)
    ctx.set_line_width(1.1)
    ctx.stroke()

    draw_text(
        ctx,
        "الشكل (1-4): البنية المعمارية العامة للنظام ثلاثي الطبقات",
        W / 2,
        28,
        20,
        NAVY,
        "bold",
        "center",
        FONT_AR,
    )
    draw_text(
        ctx,
        "Figure (1-4): Overall three-tier system architecture",
        W / 2,
        60,
        12.5,
        MUTED,
        "normal",
        "center",
    )

    band_x, band_w = 36, W - 72
    draw_band(ctx, band_x, 92, band_w, 262, (0.941, 0.953, 0.969), NAVY, "طبقة العرض", "Presentation")
    draw_band(ctx, band_x, 366, band_w, 162, (0.933, 0.965, 0.941), GREEN, "طبقة التطبيق", "Application")
    draw_band(
        ctx,
        band_x,
        540,
        band_w,
        528,
        (0.957, 0.957, 0.961),
        SLATE,
        "طبقة البيانات والمعالجة",
        "Data & Processing",
    )

    # Grouping around Celery → AI (the only path to the AI service)
    set_color(ctx, ORANGE_FILL, 0.50)
    rounded_rect(ctx, 696, 718, 320, 238, 12)
    ctx.fill()
    set_color(ctx, ORANGE, 0.38)
    rounded_rect(ctx, 696, 718, 320, 238, 12)
    ctx.set_dash([4, 3])
    ctx.set_line_width(1.15)
    ctx.stroke()
    ctx.set_dash([])
    draw_text(
        ctx,
        "External AI service · not in the Django process",
        856,
        726,
        9.5,
        ORANGE,
        "normal",
        "center",
    )

    users = draw_component(
        ctx, 330, 112, 420, 78, NAVY, NAVY_FILL,
        "Users",
        "Manager / QA Team",
    )
    frontend = draw_component(
        ctx, 270, 248, 540, 86, BLUE, BLUE_FILL,
        "Frontend — React SPA",
        "Dashboard  ·  Calls  ·  Follow-ups  ·  Reports  ·  Users",
    )
    backend = draw_component(
        ctx, 80, 386, 920, 92, GREEN, GREEN_FILL,
        "Backend — Django REST / Daphne (ASGI)",
        "accounts  ·  calls  ·  dashboard  ·  reports  ·  logs",
    )
    pg = draw_component(
        ctx, 80, 592, 288, 86, SLATE, SLATE_FILL,
        "PostgreSQL Database",
        "Persistent relational store",
    )
    redis = draw_component(
        ctx, 396, 592, 288, 86, SLATE2, SLATE2_FILL,
        "Redis — Broker / Cache",
        "Task broker  ·  result backend",
    )
    celery = draw_component(
        ctx, 712, 592, 288, 86, AMBER, AMBER_FILL,
        "Celery Worker + Beat",
        "Async tasks  ·  scheduled jobs",
    )
    ai = draw_component(
        ctx, 712, 848, 288, 96, ORANGE, ORANGE_FILL,
        "AI Service — FastAPI",
        "ASR  ·  NLP  ·  LLM",
    )

    def top_c(box):
        x, y, w, _h = box
        return x + w / 2, y

    def bot_c(box):
        x, y, w, h = box
        return x + w / 2, y + h

    def bot_at(box, t):
        x, y, w, h = box
        return x + w * t, y + h

    x1, y1 = bot_c(users)
    x2, y2 = top_c(frontend)
    draw_arrow(ctx, x1, y1, x2, y2, NAVY)
    label_box(ctx, "User interaction", 730, (y1 + y2) / 2, ink=NAVY)

    x1, y1 = bot_c(frontend)
    x2, y2 = top_c(backend)
    draw_arrow(ctx, x1, y1, x2, y2, BLUE)
    label_box(ctx, "HTTP / WebSocket", 730, (y1 + y2) / 2, ink=BLUE)

    for t, box, col in zip((0.18, 0.50, 0.82), (pg, redis, celery), (SLATE, SLATE2, AMBER)):
        x1, y1 = bot_at(backend, t)
        x2, y2 = top_c(box)
        draw_arrow(ctx, x1, y1 + 1, x2, y2, col)

    # Single dotted arrow: Celery → AI (no Backend → AI path)
    x1, y1 = bot_c(celery)
    x2, y2 = top_c(ai)
    draw_arrow(ctx, x1, y1, x2, y2, ORANGE, dashed=True, width=2.3)
    label_box(
        ctx,
        "HTTP (from Celery task only)",
        856,
        (y1 + y2) / 2,
        fill=(1.0, 0.98, 0.96),
        ink=ORANGE,
        size=10.5,
    )

    # Notes occupy the empty area under PostgreSQL / Redis
    card(ctx, 80, 718, 604, 108)
    draw_text(ctx, "قيود الاتصال", 96, 730, 13, INK, "bold", "left", FONT_AR)
    draw_text(
        ctx,
        "لا يوجد أي سهم مباشر بين صندوق Backend وصندوق AI Service.",
        96,
        756,
        12,
        MUTED,
        "normal",
        "left",
        FONT_AR,
    )
    draw_text(
        ctx,
        "الاتصال الوحيد يمر عبر Celery بسهم واحد منقط: استدعاء HTTP",
        96,
        778,
        12,
        MUTED,
        "normal",
        "left",
        FONT_AR,
    )
    draw_text(
        ctx,
        "من داخل مهمة Celery، وليس من عملية Django مباشرة.",
        96,
        800,
        12,
        MUTED,
        "normal",
        "left",
        FONT_AR,
    )

    card(ctx, 80, 842, 604, 102)
    draw_text(ctx, "مفتاح الرموز", 96, 854, 13, INK, "bold", "left", FONT_AR)

    set_color(ctx, LINE)
    ctx.set_line_width(2)
    ctx.set_dash([])
    ctx.move_to(100, 900)
    ctx.line_to(162, 900)
    ctx.stroke()
    arrow_head(ctx, 162, 900, 1, 0, LINE, 8)
    draw_text(ctx, "Direct connection  (Users / HTTP / WebSocket / data stores)", 176, 888, 11, MUTED)

    set_color(ctx, ORANGE)
    ctx.set_line_width(2.2)
    ctx.set_dash([6, 4])
    ctx.move_to(100, 926)
    ctx.line_to(162, 926)
    ctx.stroke()
    ctx.set_dash([])
    arrow_head(ctx, 162, 926, 1, 0, ORANGE, 8)
    draw_text(ctx, "Celery → AI Service  (single HTTP call from a Celery task)", 176, 914, 11, ORANGE)

    draw_text(
        ctx,
        "Presentation  →  Application  →  Data & asynchronous processing",
        W / 2,
        1088,
        11.5,
        MUTED,
        "normal",
        "center",
    )
    draw_text(
        ctx,
        "The AI service is reached by one HTTP call issued inside a Celery task — never by Django directly.",
        W / 2,
        1110,
        11,
        MUTED,
        "normal",
        "center",
    )


def main():
    png_path = OUT_DIR / "figure-1-4-system-architecture.png"
    svg_path = OUT_DIR / "figure-1-4-system-architecture.svg"

    scale = 2.5
    img = cairo.ImageSurface(cairo.FORMAT_ARGB32, int(W * scale), int(H * scale))
    ctx = cairo.Context(img)
    ctx.scale(scale, scale)
    draw(ctx)
    img.write_to_png(str(png_path))

    svg = cairo.SVGSurface(str(svg_path), W, H)
    ctx = cairo.Context(svg)
    draw(ctx)
    svg.finish()

    print(f"Wrote {png_path}")
    print(f"Wrote {svg_path}")


if __name__ == "__main__":
    main()
