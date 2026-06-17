import logging
import re
from io import BytesIO

logger = logging.getLogger(__name__)

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


PAGE_WIDTH = 595
PAGE_HEIGHT = 842
MARGIN_LEFT = 48
MARGIN_RIGHT = 48
MARGIN_TOP = 56
MARGIN_BOTTOM = 52
CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT


def _safe_text(value) -> str:
    text = str(value or '').strip()
    if not text:
        return ''

    replacements = {
        '→': ' to ',
        '—': '-',
        '–': '-',
        '•': '-',
        '"': '"',
        '"': '"',
        ''': "'",
        ''': "'",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    return text.encode('latin-1', 'replace').decode('latin-1')


def _pdf_escape(text: str) -> str:
    return (
        _safe_text(text)
        .replace('\\', '\\\\')
        .replace('(', '\\(')
        .replace(')', '\\)')
    )


def _wrap_text(text: str, max_chars: int = 88) -> list[str]:
    text = _safe_text(text)
    if not text:
        return []

    lines = []
    for paragraph in text.split('\n'):
        paragraph = paragraph.strip()
        if not paragraph:
            lines.append('')
            continue

        words = paragraph.split(' ')
        current = ''
        for word in words:
            candidate = f'{current} {word}'.strip()
            if len(candidate) <= max_chars:
                current = candidate
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)

    return lines or ['']


class _PDFPageBuilder:
    """Builds formatted PDF page content streams without external libraries."""

    def __init__(self):
        self.pages: list[list[str]] = [[]]
        self.page_number = 1
        self.y = PAGE_HEIGHT - MARGIN_TOP

    def _cmds(self) -> list[str]:
        return self.pages[-1]

    def _new_page(self):
        self.pages.append([])
        self.page_number += 1
        self.y = PAGE_HEIGHT - MARGIN_TOP
        self._draw_page_footer()

    def _ensure_space(self, height: float):
        if self.y - height < MARGIN_BOTTOM + 24:
            self._new_page()

    def _draw_page_footer(self):
        footer_y = 28
        self._cmds().append('0.75 0.75 0.75 RG 0.5 w')
        self._cmds().append(
            f'{MARGIN_LEFT} {footer_y + 12} m {PAGE_WIDTH - MARGIN_RIGHT} {footer_y + 12} l S'
        )
        self._text(
            PAGE_WIDTH / 2 - 40,
            footer_y,
            f'Page {self.page_number}',
            font='F1',
            size=9,
            color=(0.45, 0.45, 0.45),
        )

    def _text(self, x, y, text, font='F1', size=11, color=(0.1, 0.1, 0.1)):
        r, g, b = color
        self._cmds().append(f'{r} {g} {b} rg')
        escaped = _pdf_escape(text) or ' '
        self._cmds().append(f'BT /{font} {size} Tf {x} {y} Td ({escaped}) Tj ET')

    def _filled_rect(self, x, y, width, height, color):
        r, g, b = color
        self._cmds().append(f'{r} {g} {b} rg')
        self._cmds().append(f'{x} {y} {width} {height} re f')

    def _line(self, x1, y1, x2, y2, color=(0.82, 0.82, 0.82)):
        r, g, b = color
        self._cmds().append(f'{r} {g} {b} RG 0.8 w')
        self._cmds().append(f'{x1} {y1} m {x2} {y2} l S')

    def draw_header(self, report_data: dict):
        period = _safe_text(report_data.get('period', 'report')).title()
        header_height = 72
        self._filled_rect(0, PAGE_HEIGHT - header_height, PAGE_WIDTH, header_height, (0.12, 0.47, 0.84))
        self._text(MARGIN_LEFT, PAGE_HEIGHT - 34, 'Call Analysis Report', font='F2', size=20, color=(1, 1, 1))
        self._text(
            MARGIN_LEFT,
            PAGE_HEIGHT - 54,
            f"#{report_data.get('id', 'N/A')}  |  {period}  |  "
            f"{report_data.get('date_from', '')} to {report_data.get('date_to', '')}",
            font='F1',
            size=10,
            color=(0.92, 0.95, 1),
        )
        self.y = PAGE_HEIGHT - header_height - 24
        self._draw_page_footer()

    def draw_meta_card(self, rows: list[tuple[str, str]]):
        card_height = 16 + len(rows) * 18 + 12
        self._ensure_space(card_height)

        top = self.y
        self._filled_rect(MARGIN_LEFT, top - card_height, CONTENT_WIDTH, card_height, (0.96, 0.97, 0.99))
        self._line(MARGIN_LEFT, top - card_height, MARGIN_LEFT + CONTENT_WIDTH, top - card_height)
        self._line(MARGIN_LEFT, top, MARGIN_LEFT + CONTENT_WIDTH, top)
        self._line(MARGIN_LEFT, top, MARGIN_LEFT, top - card_height)
        self._line(MARGIN_LEFT + CONTENT_WIDTH, top, MARGIN_LEFT + CONTENT_WIDTH, top - card_height)

        row_y = top - 20
        for label, value in rows:
            self._text(MARGIN_LEFT + 12, row_y, f'{label}:', font='F2', size=10, color=(0.35, 0.35, 0.35))
            self._text(MARGIN_LEFT + 130, row_y, value, font='F1', size=10)
            row_y -= 18

        self.y = top - card_height - 22

    def draw_section(self, title: str, body: str | None):
        self._ensure_space(48)
        self.y -= 6
        section_top = self.y

        self._filled_rect(MARGIN_LEFT, section_top - 22, CONTENT_WIDTH, 22, (0.93, 0.95, 0.98))
        self._text(MARGIN_LEFT + 10, section_top - 16, title, font='F2', size=12, color=(0.15, 0.35, 0.62))
        self.y = section_top - 30

        lines = _wrap_text(body) if body else ['N/A']
        for line in lines:
            self._ensure_space(16)
            if line:
                self._text(MARGIN_LEFT + 8, self.y, line, font='F1', size=10.5)
            self.y -= 14

        self.y -= 8
        self._line(MARGIN_LEFT, self.y, MARGIN_LEFT + CONTENT_WIDTH, self.y)
        self.y -= 14

    def draw_table(self, title: str, headers: list[str], rows: list[list[str]], col_widths: list[int]):
        if not rows:
            return

        row_height = 18
        table_height = 28 + row_height * (len(rows) + 1) + 10
        self._ensure_space(table_height)

        self._text(MARGIN_LEFT, self.y, title, font='F2', size=12, color=(0.15, 0.35, 0.62))
        self.y -= 22

        table_top = self.y
        x_positions = [MARGIN_LEFT]
        for width in col_widths[:-1]:
            x_positions.append(x_positions[-1] + width)

        def draw_row(cells, y_pos, header=False):
            if header:
                self._filled_rect(
                    MARGIN_LEFT,
                    y_pos - row_height,
                    CONTENT_WIDTH,
                    row_height,
                    (0.88, 0.93, 0.98) if 'Sentiment' in title else (0.98, 0.9, 0.9),
                )
            for idx, cell in enumerate(cells):
                font = 'F2' if header else 'F1'
                size = 10 if header else 9.5
                self._text(x_positions[idx] + 6, y_pos - 13, cell, font=font, size=size)
            self._line(MARGIN_LEFT, y_pos - row_height, MARGIN_LEFT + CONTENT_WIDTH, y_pos - row_height)

        draw_row(headers, table_top, header=True)
        current_y = table_top - row_height
        for row in rows:
            draw_row(row, current_y, header=False)
            current_y -= row_height

        self._line(MARGIN_LEFT, table_top, MARGIN_LEFT, current_y)
        self._line(MARGIN_LEFT + CONTENT_WIDTH, table_top, MARGIN_LEFT + CONTENT_WIDTH, current_y)
        for x_pos in x_positions[1:]:
            self._line(x_pos, table_top, x_pos, current_y)

        self.y = current_y - 18

    def render(self) -> list[str]:
        if not self._cmds():
            self._draw_page_footer()
        return ['\n'.join(page_cmds) for page_cmds in self.pages if page_cmds]


def _assemble_pdf(page_streams: list[str]) -> bytes:
    regular_font_id = 3 + len(page_streams) * 2
    bold_font_id = regular_font_id + 1

    objects: list[str | bytes] = [
        '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj',
    ]

    page_obj_ids = []
    content_obj_ids = []
    obj_id = 3

    for _ in page_streams:
        page_obj_ids.append(obj_id)
        content_obj_ids.append(obj_id + 1)
        obj_id += 2

    kids = ' '.join(f'{pid} 0 R' for pid in page_obj_ids)
    objects.append(f'2 0 obj<< /Type /Pages /Kids [{kids}] /Count {len(page_streams)} >>endobj')

    for index, stream in enumerate(page_streams):
        page_id = page_obj_ids[index]
        content_id = content_obj_ids[index]
        stream_bytes = stream.encode('latin-1', 'replace')
        objects.append(
            f'{page_id} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] '
            f'/Resources << /Font << /F1 {regular_font_id} 0 R /F2 {bold_font_id} 0 R >> >> '
            f'/Contents {content_id} 0 R >>endobj'
        )
        objects.append(
            f'{content_id} 0 obj<< /Length {len(stream_bytes)} >>stream\n'.encode('latin-1')
            + stream_bytes
            + b'\nendstream\nendobj'
        )

    objects.append(f'{regular_font_id} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj')
    objects.append(f'{bold_font_id} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>endobj')

    pdf = b'%PDF-1.4\n'
    offsets = [0]

    for obj in objects:
        offsets.append(len(pdf))
        if isinstance(obj, bytes):
            pdf += obj
        else:
            pdf += obj.encode('latin-1')
        pdf += b'\n'

    xref_pos = len(pdf)
    total_objects = len(objects) + 1
    pdf += f'xref\n0 {total_objects}\n'.encode('latin-1')
    pdf += b'0000000000 65535 f \n'
    for offset in offsets[1:]:
        pdf += f'{offset:010d} 00000 n \n'.encode('latin-1')

    pdf += (
        f'trailer<< /Size {total_objects} /Root 1 0 R >>\n'
        f'startxref\n{xref_pos}\n%%EOF'
    ).encode('latin-1')
    return pdf


def _generate_with_stdlib(report_data: dict) -> bytes:
    builder = _PDFPageBuilder()
    builder.draw_header(report_data)

    meta_rows = [
        ('Status', _safe_text(report_data.get('status', 'N/A')).title()),
        ('Created By', _safe_text(report_data.get('created_by_username', 'N/A'))),
        ('Generated At', str(report_data.get('created_at', 'N/A'))[:10]),
    ]
    if report_data.get('reviewed_by_username'):
        meta_rows.append(
            ('Reviewed By', f"{report_data.get('reviewed_by_username')} ({str(report_data.get('reviewed_at', ''))[:10]})")
        )
    builder.draw_meta_card(meta_rows)

    if (report_data.get('manager_notes') or '').strip():
        builder.draw_section('Manager Notes', report_data.get('manager_notes'))

    builder.draw_section('Summary (Issues and Solutions)', report_data.get('summary'))
    builder.draw_section('Positives', report_data.get('positives'))
    builder.draw_section('Recommendations', report_data.get('recommendations'))

    sentiment_stats = report_data.get('sentiment_stats') or {}
    if sentiment_stats:
        sentiment_rows = [
            [_safe_text(label).title(), str(count)]
            for label, count in sentiment_stats.items()
        ]
        builder.draw_table(
            'Sentiment Statistics',
            ['Sentiment', 'Count'],
            sentiment_rows,
            [int(CONTENT_WIDTH * 0.65), int(CONTENT_WIDTH * 0.35)],
        )

    top_issues = report_data.get('top_issues') or []
    if top_issues:
        issue_rows = []
        for index, item in enumerate(top_issues, start=1):
            issue_rows.append([
                str(index),
                _safe_text(item.get('issue') or item.get('main_issue') or 'Unknown'),
                str(item.get('count', 0)),
            ])
        builder.draw_table(
            'Top Issues',
            ['#', 'Issue', 'Count'],
            issue_rows,
            [int(CONTENT_WIDTH * 0.08), int(CONTENT_WIDTH * 0.72), int(CONTENT_WIDTH * 0.20)],
        )
    else:
        builder.draw_section('Top Issues', 'No issues data available.')

    page_streams = builder.render()
    pdf_bytes = _assemble_pdf(page_streams)

    if not pdf_bytes.startswith(b'%PDF'):
        raise ValueError('Generated file is not a valid PDF')

    return pdf_bytes


def _generate_with_reportlab(report_data: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        title=f"Report #{report_data.get('id')}",
    )

    styles = getSampleStyleSheet()
    custom = {
        'ReportTitle': ParagraphStyle(
            name='ReportTitle',
            parent=styles['Title'],
            fontSize=22,
            textColor=colors.HexColor('#1565c0'),
            spaceAfter=6,
        ),
        'ReportSubtitle': ParagraphStyle(
            name='ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#546e7a'),
            spaceAfter=14,
        ),
        'SectionHeader': ParagraphStyle(
            name='SectionHeader',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#1565c0'),
            spaceBefore=8,
            spaceAfter=6,
        ),
        'Body': ParagraphStyle(
            name='Body',
            parent=styles['BodyText'],
            fontSize=10,
            leading=14,
            spaceAfter=8,
        ),
        'MetaLabel': ParagraphStyle(
            name='MetaLabel',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#546e7a'),
        ),
    }
    for name, style in custom.items():
        if name not in styles.byName:
            styles.add(style)

    def section(story, title, body):
        story.append(Paragraph(f'<b>{_pdf_escape(title)}</b>', styles['SectionHeader']))
        content = _safe_text(body)
        if not content:
            story.append(Paragraph('N/A', styles['Body']))
        else:
            for paragraph in content.split('\n'):
                cleaned = _pdf_escape(paragraph)
                if cleaned:
                    story.append(Paragraph(cleaned, styles['Body']))
        story.append(Spacer(1, 0.12 * inch))

    story = []
    period = _pdf_escape(report_data.get('period', 'report')).title()
    story.append(Paragraph('Call Analysis Report', styles['ReportTitle']))
    story.append(Paragraph(
        f"Report #{report_data.get('id')} &nbsp;|&nbsp; {period} &nbsp;|&nbsp; "
        f"{report_data.get('date_from', '')} to {report_data.get('date_to', '')}",
        styles['ReportSubtitle'],
    ))

    meta_table = Table([
        ['Status', _pdf_escape(report_data.get('status', 'N/A')).title()],
        ['Created By', _pdf_escape(report_data.get('created_by_username', 'N/A'))],
        ['Generated At', str(report_data.get('created_at', 'N/A'))[:10]],
    ], colWidths=[1.4 * inch, 4.8 * inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#eceff1')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#546e7a')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cfd8dc')),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#eceff1')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.2 * inch))

    if (report_data.get('manager_notes') or '').strip():
        section(story, 'Manager Notes', report_data.get('manager_notes'))

    section(story, 'Summary (Issues and Solutions)', report_data.get('summary'))
    section(story, 'Positives', report_data.get('positives'))
    section(story, 'Recommendations', report_data.get('recommendations'))

    sentiment_stats = report_data.get('sentiment_stats') or {}
    if sentiment_stats:
        story.append(Paragraph('<b>Sentiment Statistics</b>', styles['SectionHeader']))
        sentiment_rows = [['Sentiment', 'Count']]
        for label, count in sentiment_stats.items():
            sentiment_rows.append([_pdf_escape(label).title(), str(count)])
        sentiment_table = Table(sentiment_rows, colWidths=[3.2 * inch, 1.2 * inch])
        sentiment_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e3f2fd')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#b0bec5')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fafafa')]),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(sentiment_table)
        story.append(Spacer(1, 0.18 * inch))

    top_issues = report_data.get('top_issues') or []
    story.append(Paragraph('<b>Top Issues</b>', styles['SectionHeader']))
    if top_issues:
        issue_rows = [['#', 'Issue', 'Count']]
        for index, item in enumerate(top_issues, start=1):
            issue_rows.append([
                str(index),
                _pdf_escape(item.get('issue') or item.get('main_issue') or 'Unknown'),
                str(item.get('count', 0)),
            ])
        issue_table = Table(issue_rows, colWidths=[0.45 * inch, 4.0 * inch, 0.75 * inch])
        issue_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ffebee')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#b0bec5')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fafafa')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(issue_table)
    else:
        story.append(Paragraph('No issues data available.', styles['Body']))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_report_pdf(report_data: dict) -> bytes:
    if REPORTLAB_AVAILABLE:
        try:
            pdf_bytes = _generate_with_reportlab(report_data)
        except Exception:
            logger.exception('[REPORT PDF] reportlab failed, using stdlib fallback')
            pdf_bytes = _generate_with_stdlib(report_data)
    else:
        pdf_bytes = _generate_with_stdlib(report_data)

    if not pdf_bytes.startswith(b'%PDF'):
        raise ValueError('Generated file is not a valid PDF')

    return pdf_bytes
