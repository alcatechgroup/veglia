"""
Gerador de Term Sheet · Vegl.ia
Para envio ao Fábio (sócio operacional) conduzir tema com Thiago (Vacivitta).
RRevela © 2026
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Frame, PageTemplate, BaseDocTemplate, NextPageTemplate, KeepTogether
)
from reportlab.platypus.flowables import HRFlowable
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ============ COLORS ============
TWILIGHT_BLUE = colors.HexColor("#1A3A5C")
DEEP_NAVY = colors.HexColor("#0B2545")
MINT_VACIVITTA = colors.HexColor("#5DD3A8")
MINT_DEEP = colors.HexColor("#2DA67D")
CHAMPAGNE = colors.HexColor("#C9A96E")
CHAMPAGNE_LIGHT = colors.HexColor("#E5D5A8")
CREAM = colors.HexColor("#F4EDE0")
CREAM_DIM = colors.HexColor("#E8DFCC")
LINE = colors.HexColor("#D0D8E0")
TEXT_DARK = colors.HexColor("#0B2545")
TEXT_MID = colors.HexColor("#4B5A82")
WHITE = colors.HexColor("#FFFFFF")
BLACK = colors.HexColor("#000000")

# ============ DOC SETUP ============
output_path = "Veglia_TermSheet.pdf"

def header_footer(canvas_obj, doc):
    """Header e footer aplicados em cada página."""
    canvas_obj.saveState()
    width, height = A4

    # ====== HEADER ======
    if doc.page > 1:
        # Logo simples no canto superior esquerdo
        canvas_obj.setFillColor(TWILIGHT_BLUE)
        canvas_obj.setFont("Helvetica-Bold", 13)
        canvas_obj.drawString(2*cm, height - 1.2*cm, "Vegl")
        text_w = canvas_obj.stringWidth("Vegl", "Helvetica-Bold", 13)
        # ponto champagne
        canvas_obj.setFillColor(CHAMPAGNE)
        canvas_obj.circle(2*cm + text_w + 2, height - 1.2*cm + 4, 2, fill=1, stroke=0)
        # ia em mint
        canvas_obj.setFillColor(MINT_DEEP)
        canvas_obj.drawString(2*cm + text_w + 7, height - 1.2*cm, "ia")

        # Título Term Sheet à direita
        canvas_obj.setFont("Helvetica", 9)
        canvas_obj.setFillColor(TEXT_MID)
        canvas_obj.drawRightString(width - 2*cm, height - 1.2*cm, "TERM SHEET · CONFIDENCIAL")

        # Linha horizontal sutil
        canvas_obj.setStrokeColor(LINE)
        canvas_obj.setLineWidth(0.5)
        canvas_obj.line(2*cm, height - 1.5*cm, width - 2*cm, height - 1.5*cm)

    # ====== FOOTER ======
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(TEXT_MID)

    if doc.page > 1:
        canvas_obj.drawString(2*cm, 1*cm, "RRevela © 2026 · Documento interno para discussão de sócios")
        canvas_obj.drawRightString(width - 2*cm, 1*cm, f"página {doc.page}")
        # Mint detail
        canvas_obj.setFillColor(MINT_DEEP)
        canvas_obj.circle(width/2, 1*cm + 3, 1.5, fill=1, stroke=0)

    canvas_obj.restoreState()


def draw_cover_page(canvas_obj, doc):
    """Capa especial."""
    canvas_obj.saveState()
    width, height = A4

    # Background full deep navy
    canvas_obj.setFillColor(DEEP_NAVY)
    canvas_obj.rect(0, 0, width, height, fill=1, stroke=0)

    # Glow champagne radial (simulado com círculos com transparência)
    from reportlab.lib.colors import Color
    glow1 = Color(0.79, 0.66, 0.43, alpha=0.12)
    canvas_obj.setFillColor(glow1)
    canvas_obj.circle(width*0.85, height*0.8, 8*cm, fill=1, stroke=0)
    glow2 = Color(0.36, 0.83, 0.66, alpha=0.08)
    canvas_obj.setFillColor(glow2)
    canvas_obj.circle(width*0.15, height*0.25, 6*cm, fill=1, stroke=0)

    # Top marker
    canvas_obj.setFillColor(CHAMPAGNE)
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.drawString(2*cm, height - 2*cm, "TERM SHEET · 2026")

    # Linha lateral champagne
    canvas_obj.setStrokeColor(CHAMPAGNE)
    canvas_obj.setLineWidth(1)
    canvas_obj.line(2*cm, height - 2.2*cm, 2*cm + 4*cm, height - 2.2*cm)

    # Logo gigante centralizado
    logo_y = height/2 + 3*cm
    canvas_obj.setFillColor(WHITE)
    canvas_obj.setFont("Helvetica-Bold", 80)
    logo_text_w = canvas_obj.stringWidth("Vegl", "Helvetica-Bold", 80)
    total_w = logo_text_w + 22 + canvas_obj.stringWidth("ia", "Helvetica-Bold", 80)
    start_x = (width - total_w) / 2

    canvas_obj.drawString(start_x, logo_y, "Vegl")
    # Ponto dourado grande
    canvas_obj.setFillColor(CHAMPAGNE)
    canvas_obj.circle(start_x + logo_text_w + 11, logo_y + 12, 7, fill=1, stroke=0)
    # ia em mint
    canvas_obj.setFillColor(MINT_VACIVITTA)
    canvas_obj.drawString(start_x + logo_text_w + 22, logo_y, "ia")

    # ® subscript
    canvas_obj.setFont("Helvetica", 14)
    canvas_obj.drawString(start_x + total_w + 4, logo_y + 50, "®")

    # Tagline
    canvas_obj.setFillColor(CHAMPAGNE_LIGHT)
    canvas_obj.setFont("Helvetica-Oblique", 14)
    canvas_obj.drawCentredString(width/2, logo_y - 1*cm, "Quem vela cuida.")

    # Título principal
    canvas_obj.setFillColor(WHITE)
    canvas_obj.setFont("Helvetica-Bold", 32)
    canvas_obj.drawCentredString(width/2, logo_y - 4*cm, "TERM SHEET")
    canvas_obj.setFont("Helvetica", 14)
    canvas_obj.setFillColor(CHAMPAGNE_LIGHT)
    canvas_obj.drawCentredString(width/2, logo_y - 4.7*cm, "Constituição da Sociedade")

    # Linha separadora
    canvas_obj.setStrokeColor(CHAMPAGNE)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(width/2 - 4*cm, logo_y - 5.5*cm, width/2 + 4*cm, logo_y - 5.5*cm)

    # Razão social
    canvas_obj.setFillColor(WHITE)
    canvas_obj.setFont("Helvetica", 11)
    canvas_obj.drawCentredString(width/2, logo_y - 6.3*cm, "Saúde Preventiva Corporativa Brasil S.A.")
    canvas_obj.setFillColor(CHAMPAGNE_LIGHT)
    canvas_obj.drawCentredString(width/2, logo_y - 6.9*cm, "(razão social provisória)")

    # Footer da capa
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.setFillColor(MINT_VACIVITTA)
    canvas_obj.drawString(2*cm, 3*cm, "PARTE DO ECOSSISTEMA VACIVITTA")

    canvas_obj.setFont("Helvetica", 9)
    canvas_obj.setFillColor(WHITE)
    canvas_obj.drawString(2*cm, 2.4*cm, "Documento confidencial para discussão entre sócios:")
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.drawString(2*cm, 1.95*cm, "Rodolfo Nascimento  ·  Fábio  ·  Thiago")

    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(CHAMPAGNE_LIGHT)
    canvas_obj.drawRightString(width - 2*cm, 1.95*cm, "Versão 1.0 · Maio · 2026")

    # Linha bottom
    canvas_obj.setStrokeColor(CHAMPAGNE)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(2*cm, 1.5*cm, width - 2*cm, 1.5*cm)

    canvas_obj.restoreState()


# ============ STYLES ============
styles = getSampleStyleSheet()

style_h1 = ParagraphStyle(
    name="H1Vegl",
    fontName="Helvetica-Bold",
    fontSize=24,
    textColor=TWILIGHT_BLUE,
    leading=28,
    spaceBefore=8,
    spaceAfter=14,
    alignment=TA_LEFT,
)

style_h2 = ParagraphStyle(
    name="H2Vegl",
    fontName="Helvetica-Bold",
    fontSize=14,
    textColor=TWILIGHT_BLUE,
    leading=18,
    spaceBefore=18,
    spaceAfter=10,
    alignment=TA_LEFT,
)

style_eyebrow = ParagraphStyle(
    name="Eyebrow",
    fontName="Helvetica-Bold",
    fontSize=8,
    textColor=MINT_DEEP,
    leading=10,
    spaceBefore=0,
    spaceAfter=4,
    alignment=TA_LEFT,
)

style_body = ParagraphStyle(
    name="Body",
    fontName="Helvetica",
    fontSize=10,
    textColor=TEXT_DARK,
    leading=15,
    spaceBefore=2,
    spaceAfter=8,
    alignment=TA_JUSTIFY,
)

style_quote = ParagraphStyle(
    name="Quote",
    fontName="Helvetica-Oblique",
    fontSize=11,
    textColor=TWILIGHT_BLUE,
    leading=16,
    spaceBefore=10,
    spaceAfter=14,
    leftIndent=14,
    borderColor=MINT_VACIVITTA,
    borderWidth=0,
    borderPadding=8,
    alignment=TA_LEFT,
)

style_small = ParagraphStyle(
    name="Small",
    fontName="Helvetica",
    fontSize=8,
    textColor=TEXT_MID,
    leading=11,
    alignment=TA_LEFT,
)

style_clause_num = ParagraphStyle(
    name="ClauseNum",
    fontName="Helvetica-Bold",
    fontSize=10,
    textColor=MINT_DEEP,
    leading=14,
    spaceBefore=10,
    spaceAfter=2,
    alignment=TA_LEFT,
)

# ============ BUILD CONTENT ============
doc = BaseDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=2*cm,
    rightMargin=2*cm,
    topMargin=2.2*cm,
    bottomMargin=2*cm,
    title="Vegl.ia · Term Sheet",
    author="RRevela",
)

# Page templates
cover_frame = Frame(0, 0, A4[0], A4[1], leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="cover")
content_frame = Frame(2*cm, 2*cm, A4[0]-4*cm, A4[1]-4.5*cm, id="content")

doc.addPageTemplates([
    PageTemplate(id="Cover", frames=[cover_frame], onPage=draw_cover_page),
    PageTemplate(id="Content", frames=[content_frame], onPage=header_footer),
])

# ============ FLOWABLES ============
story = []

# COVER (página 1) - vazia, conteúdo desenhado em onPage
story.append(Spacer(1, 1))
story.append(NextPageTemplate("Content"))
story.append(PageBreak())

# ============ PÁGINA 2 — SUMÁRIO EXECUTIVO ============
story.append(Paragraph("SUMÁRIO EXECUTIVO", style_eyebrow))
story.append(Paragraph("Constituição da Vegl.ia", style_h1))

story.append(Paragraph(
    "Este documento estabelece os termos e condições preliminares para a constituição de uma sociedade entre <b>Rodolfo Nascimento</b>, "
    "<b>Fábio</b> (CEO do Grupo Top Formaturas) e <b>Thiago</b> (sócio da Vacivitta) com o objetivo de operar a "
    "<b>Vegl.ia</b> — primeira plataforma de Compliance Preventivo Corporativo do Brasil, ancorada na Lei 15.377/2026 e parte do "
    "ecossistema Vacivitta.",
    style_body
))

story.append(Spacer(1, 0.4*cm))

story.append(Paragraph("OBJETO DA SOCIEDADE", style_h2))
story.append(Paragraph(
    "Constituição de S.A. (sociedade anônima de capital fechado) cujo objeto social é o desenvolvimento, operação e "
    "comercialização de plataforma digital de compliance preventivo corporativo, com foco em saúde do trabalhador, "
    "treinamentos auditáveis, integração com operações de imunização in-company e expansão para outras verticais "
    "de saúde corporativa (saúde mental, ergonomia, longevidade, telemedicina).",
    style_body
))

story.append(Paragraph("RAZÃO SOCIAL E MARCA", style_h2))

table_data = [
    ["Razão social provisória:", "Saúde Preventiva Corporativa Brasil S.A."],
    ["Marca operacional:", "Vegl.ia (lê-se véglia)"],
    ["Etimologia:", "Italiano antigo · vigília, ato de velar"],
    ["Tagline institucional:", "O guardião da saúde dos seus funcionários"],
    ["Tagline curta:", "Quem vela cuida."],
]

t = Table(table_data, colWidths=[5.5*cm, 11*cm])
t.setStyle(TableStyle([
    ("FONT", (0,0), (0,-1), "Helvetica-Bold", 9),
    ("FONT", (1,0), (1,-1), "Helvetica", 9),
    ("TEXTCOLOR", (0,0), (0,-1), MINT_DEEP),
    ("TEXTCOLOR", (1,0), (1,-1), TEXT_DARK),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [WHITE, CREAM]),
    ("LINEBELOW", (0,0), (-1,-1), 0.3, LINE),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
]))
story.append(t)

story.append(PageBreak())

# ============ PÁGINA 3 — CAP TABLE ============
story.append(Paragraph("ESTRUTURA SOCIETÁRIA", style_eyebrow))
story.append(Paragraph("Cap Table e Aportes", style_h1))

story.append(Paragraph("DIVISÃO DE COTAS", style_h2))
story.append(Paragraph(
    "A sociedade será constituída com cotas iguais entre os três sócios fundadores, refletindo equilíbrio "
    "estratégico entre canal, operação e tecnologia.",
    style_body
))

cap_data = [
    ["Sócio", "Cota", "Cargo formal", "Capital social"],
    ["Rodolfo Nascimento", "33,33%", "CEO + CTO interino", "R$ 10.000,00"],
    ["Fábio", "33,33%", "CCO + Chairman", "R$ 10.000,00"],
    ["Thiago", "33,33%", "CMO + Chief Content Officer", "R$ 10.000,00"],
]

t2 = Table(cap_data, colWidths=[4.5*cm, 2*cm, 5*cm, 5*cm])
t2.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), TWILIGHT_BLUE),
    ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("FONT", (0,0), (-1,0), "Helvetica-Bold", 9),
    ("ALIGN", (0,0), (-1,0), "LEFT"),
    ("FONT", (0,1), (-1,-1), "Helvetica", 9),
    ("TEXTCOLOR", (0,1), (-1,-1), TEXT_DARK),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [CREAM, WHITE]),
    ("LINEBELOW", (0,0), (-1,-1), 0.3, LINE),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 10),
    ("RIGHTPADDING", (0,0), (-1,-1), 10),
    ("TOPPADDING", (0,0), (-1,-1), 10),
    ("BOTTOMPADDING", (0,0), (-1,-1), 10),
]))
story.append(t2)

story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("CAPITAL SOCIAL INICIAL", style_h2))
story.append(Paragraph(
    "<b>R$ 30.000,00</b> (trinta mil reais), integralizados em iguais R$ 10.000,00 por cada sócio, "
    "no ato da constituição formal da sociedade. <b>Equilíbrio total de aporte financeiro entre os três sócios.</b>",
    style_body
))

story.append(Paragraph("DEDICAÇÃO OPERACIONAL", style_h2))
story.append(Paragraph(
    "Cada sócio se compromete com dedicação operacional ativa em sua área de responsabilidade — sem aportes diferenciados de "
    "sweat equity. O regime de equilíbrio reforça que cada um dos três aportes exatamente o que lhe cabe segundo as funções "
    "definidas no item de <b>Funções Operacionais</b>: tecnologia (Rodolfo), relacionamento comercial e governança (Fábio), "
    "conteúdo médico e autoridade científica (Thiago). Nenhum sócio é maior que o outro.",
    style_body
))

story.append(PageBreak())

# ============ PÁGINA 4 — VESTING E GOVERNANÇA ============
story.append(Paragraph("PROTEÇÃO MÚTUA", style_eyebrow))
story.append(Paragraph("Vesting e Governança", style_h1))

story.append(Paragraph("VESTING DAS COTAS", style_h2))
story.append(Paragraph(
    "Para proteger a sociedade contra saída precoce de sócios, todas as cotas estarão sujeitas a regime de vesting:",
    style_body
))

vesting_data = [
    ["Cliff de 1 ano", "Saída antes do primeiro aniversário = perda total da equity"],
    ["Vesting linear · 4 anos", "Aquisição mensal proporcional após o cliff"],
    ["Saída entre 1-4 anos", "Mantém percentual proporcional ao tempo de dedicação"],
    ["Aceleração total", "Em caso de exit (M&A, IPO) ou em caso de morte/invalidez"],
]

t4 = Table(vesting_data, colWidths=[5*cm, 11.5*cm])
t4.setStyle(TableStyle([
    ("FONT", (0,0), (0,-1), "Helvetica-Bold", 9),
    ("FONT", (1,0), (-1,-1), "Helvetica", 9),
    ("TEXTCOLOR", (0,0), (0,-1), MINT_DEEP),
    ("TEXTCOLOR", (1,0), (-1,-1), TEXT_DARK),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [WHITE, CREAM]),
    ("LINEBELOW", (0,0), (-1,-1), 0.3, LINE),
    ("LEFTPADDING", (0,0), (-1,-1), 10),
    ("RIGHTPADDING", (0,0), (-1,-1), 10),
    ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
]))
story.append(t4)

story.append(Paragraph("GOVERNANÇA E DECISÕES", style_h2))
story.append(Paragraph(
    "A sociedade adota governança ágil baseada em conselho mensal e regime de quóruns claros para evitar deadlock.",
    style_body
))

gov_data = [
    ["Conselho mensal", "Reunião fixa, último sábado de cada mês, com pauta estruturada"],
    ["Decisões ordinárias", "Maioria simples · 2 votos de 3 (orçamento até R$ 50k, contratações, parcerias)"],
    ["Decisões estratégicas", "Unanimidade · 3 de 3 (captação, fusão, mudança de tese, contratos > R$ 200k, exit)"],
    ["Tie-breaker", "Em ordinárias com 1 abstenção: voto qualitativo do CEO prevalece, com registro em ata"],
]

t5 = Table(gov_data, colWidths=[5*cm, 11.5*cm])
t5.setStyle(TableStyle([
    ("FONT", (0,0), (0,-1), "Helvetica-Bold", 9),
    ("FONT", (1,0), (-1,-1), "Helvetica", 9),
    ("TEXTCOLOR", (0,0), (0,-1), MINT_DEEP),
    ("TEXTCOLOR", (1,0), (-1,-1), TEXT_DARK),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [WHITE, CREAM]),
    ("LINEBELOW", (0,0), (-1,-1), 0.3, LINE),
    ("LEFTPADDING", (0,0), (-1,-1), 10),
    ("RIGHTPADDING", (0,0), (-1,-1), 10),
    ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
]))
story.append(t5)

story.append(PageBreak())

# ============ PÁGINA 5 — CLÁUSULAS-CHAVE ============
story.append(Paragraph("PROTEÇÕES E COMPROMISSOS", style_eyebrow))
story.append(Paragraph("Cláusulas-chave", style_h1))

clauses = [
    ("01 · EXCLUSIVIDADE VACIVITTA",
     "A Vacivitta é fornecedora exclusiva de campanhas in-company de imunização da Vegl.ia "
     "enquanto for competitiva em preço, qualidade e cobertura. Os critérios de competitividade "
     "estão definidos em anexo e revisados anualmente."),

    ("02 · NÃO-CONCORRÊNCIA",
     "Cada sócio se compromete a, durante a vigência da sociedade e por 3 anos após eventual saída, "
     "não atuar — direta ou indiretamente — em produto similar de compliance preventivo corporativo / "
     "EdTech de saúde / soluções B2B vacinais no território brasileiro."),

    ("03 · PROPRIEDADE INTELECTUAL",
     "Todo conteúdo, código, base de dados e marca produzidos no contexto da Vegl.ia são de propriedade "
     "exclusiva da sociedade. Cada sócio licencia para a empresa o que aporta operacionalmente, mantendo "
     "propriedade individual sobre IP pré-existente declarado em anexo."),

    ("04 · DIREITO DE PREFERÊNCIA",
     "Em caso de proposta externa de aquisição de cotas, os outros sócios têm 60 dias para cobrir a "
     "oferta nas mesmas condições, mantendo a sociedade fechada entre os fundadores."),

    ("05 · TAG-ALONG / DRAG-ALONG",
     "Em caso de transferência de 50% ou mais da empresa, ativam-se simultaneamente os direitos de "
     "tag-along (sócios minoritários podem ser arrastados na venda) e drag-along (sócios remanescentes "
     "podem exigir venda nas mesmas condições). Protege todos os lados em cenário de exit."),

    ("06 · SAÍDA POR DESEMPENHO",
     "Sócio que não cumprir as funções operacionais definidas em anexo pode ser removido por voto dos "
     "outros dois, com diluição proporcional ao tempo de dedicação efetiva. Cláusula evita 'sócio "
     "fantasma' e protege quem está executando."),

    ("07 · RECEITAS ADJACENTES E NOVAS LINHAS",
     "Toda receita adjacente ao negócio principal — incluindo, mas não limitada a, comercialização "
     "de vacinas, campanhas in-company executadas via parceria com a Vacivitta, novos produtos de "
     "saúde corporativa, lead-gen para terceiros, certificações pagas, white-label para carriers e "
     "outras linhas que vierem a surgir — será integralmente computada como receita da sociedade "
     "Vegl.ia e tratada como linha extra do resultado consolidado. A distribuição de qualquer receita "
     "adjacente segue as regras gerais de governança e a proporcionalidade das cotas. Nenhuma receita "
     "que tenha origem no contexto operacional ou comercial da Vegl.ia poderá ser desviada para "
     "estruturas paralelas dos sócios sem aprovação unânime do conselho."),
]

for title, body in clauses:
    story.append(Paragraph(title, style_clause_num))
    story.append(Paragraph(body, style_body))

story.append(PageBreak())

# ============ PÁGINA 6 — FUNÇÕES OPERACIONAIS ============
story.append(Paragraph("RESPONSABILIDADES", style_eyebrow))
story.append(Paragraph("Funções Operacionais", style_h1))

story.append(Paragraph(
    "Cada sócio assume responsabilidade clara sobre uma área operacional. As funções abaixo são "
    "compromissos formais e servem como base para a cláusula de saída por desempenho.",
    style_body
))

# Rodolfo
story.append(Paragraph("RODOLFO NASCIMENTO · CEO + CTO INTERINO", style_h2))
story.append(Paragraph(
    "<b>Tempo dedicado:</b> 40 horas/semana iniciais.<br/>"
    "<b>Responsabilidades:</b> Estratégia geral, produto digital, arquitetura tecnológica, "
    "GTM digital e captação de carriers (VR, Alelo, Ticket, etc.), gestão diária da operação, "
    "responsável pelo cumprimento das metas trimestrais junto ao conselho.",
    style_body
))

# Fábio
story.append(Paragraph("FÁBIO · CCO + CHAIRMAN", style_h2))
story.append(Paragraph(
    "<b>Tempo dedicado:</b> 20 horas/semana iniciais.<br/>"
    "<b>Responsabilidades:</b> Comercial sênior, parcerias estratégicas, governança institucional, "
    "ativação do canal Top Formaturas como vetor de aquisição, condução de assembleias e "
    "relação com investidores futuros.",
    style_body
))

# Thiago
story.append(Paragraph("THIAGO · CMO + CHIEF CONTENT OFFICER", style_h2))
story.append(Paragraph(
    "<b>Tempo dedicado:</b> 15 horas/semana iniciais.<br/>"
    "<b>Responsabilidades:</b> Conteúdo médico das trilhas, autoridade científica via Vacivitta e "
    "Dra. Amanda, integração operacional para execução de campanhas in-company, validação técnica "
    "regulatória e sanitária dos materiais.",
    style_body
))

story.append(PageBreak())

# ============ PÁGINA 7 — DISTRIBUIÇÃO + PRÓXIMOS PASSOS ============
story.append(Paragraph("RESULTADOS E CRONOGRAMA", style_eyebrow))
story.append(Paragraph("Distribuição de Lucros e Próximos Passos", style_h1))

story.append(Paragraph("DISTRIBUIÇÃO DE RESULTADOS", style_h2))
story.append(Paragraph(
    "Nos primeiros <b>18 meses</b> de operação, 100% do resultado líquido será reinvestido na sociedade "
    "para acelerar produto, GTM e captação de clientes. Após esse período, dividendos serão distribuídos "
    "proporcionalmente às cotas, mediante deliberação do conselho com maioria simples (2 de 3).",
    style_body
))

story.append(Paragraph("CRONOGRAMA DE FORMALIZAÇÃO", style_h2))

cronograma = [
    ["Etapa", "Prazo", "Responsável"],
    ["Discussão e aprovação do term sheet", "14 dias", "Os 3 sócios"],
    ["Assinatura do term sheet", "Dia 15", "Os 3 sócios"],
    ["Constituição formal da S.A.", "Até dia 60", "Conduzido por advogado societário"],
    ["Contrato social definitivo", "Até dia 60", "Conduzido por advogado societário"],
    ["Anexos (PI, exclusividade, funções)", "Até dia 90", "Os 3 sócios"],
    ["MVP da plataforma · Fase 1", "Até dia 90", "Rodolfo (CTO interino)"],
]

t6 = Table(cronograma, colWidths=[8*cm, 3*cm, 5.5*cm])
t6.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), TWILIGHT_BLUE),
    ("TEXTCOLOR", (0,0), (-1,0), WHITE),
    ("FONT", (0,0), (-1,0), "Helvetica-Bold", 9),
    ("FONT", (0,1), (-1,-1), "Helvetica", 9),
    ("TEXTCOLOR", (0,1), (-1,-1), TEXT_DARK),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [CREAM, WHITE]),
    ("LINEBELOW", (0,0), (-1,-1), 0.3, LINE),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 10),
    ("RIGHTPADDING", (0,0), (-1,-1), 10),
    ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
]))
story.append(t6)

story.append(Paragraph("NATUREZA DESTE DOCUMENTO", style_h2))
story.append(Paragraph(
    "Este Term Sheet tem caráter <b>preliminar e não vinculante</b>, à exceção das cláusulas de "
    "confidencialidade e não-concorrência. Constitui base para negociação do contrato social e acordo "
    "de sócios definitivos, que serão elaborados por advogado societário designado em comum acordo "
    "pelos três sócios.",
    style_body
))

story.append(PageBreak())

# ============ PÁGINA 8 — ASSINATURAS ============
story.append(Paragraph("ASSINATURAS", style_eyebrow))
story.append(Paragraph("Aceite Mútuo dos Termos", style_h1))

story.append(Paragraph(
    "Pelo presente, os abaixo assinados manifestam concordância com os termos preliminares acima e "
    "comprometem-se a prosseguir com a constituição formal da sociedade Vegl.ia conforme cronograma "
    "estabelecido no item anterior.",
    style_body
))

story.append(Spacer(1, 1.2*cm))

# Linhas de assinatura
def assinatura_block(nome, papel):
    return [
        Paragraph(f"<b>{nome}</b>", ParagraphStyle("nome", fontName="Helvetica-Bold", fontSize=11, textColor=TWILIGHT_BLUE, alignment=TA_CENTER, spaceBefore=6, spaceAfter=2)),
        Paragraph(papel, ParagraphStyle("papel", fontName="Helvetica", fontSize=8, textColor=MINT_DEEP, alignment=TA_CENTER, spaceBefore=0, spaceAfter=0)),
    ]

# tabela com 3 colunas para assinatura
assin_data = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
]
t7 = Table(assin_data, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
t7.setStyle(TableStyle([
    ("LINEABOVE", (0,2), (-1,2), 0.5, TWILIGHT_BLUE),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 0),
    ("BOTTOMPADDING", (0,0), (-1,-1), 0),
    ("LEFTPADDING", (0,0), (-1,-1), 0),
    ("RIGHTPADDING", (0,0), (-1,-1), 0),
    ("MINROWHEIGHT", (0,0), (-1,1), 1.8*cm),
]))
story.append(t7)

# nomes embaixo das linhas
nomes_data = [
    [
        Paragraph("<b>Rodolfo Nascimento</b><br/><font color='#2DA67D' size='8'>CEO + CTO interino</font>", ParagraphStyle("c", fontName="Helvetica", fontSize=10, textColor=TWILIGHT_BLUE, alignment=TA_CENTER, leading=13)),
        Paragraph("<b>Fábio</b><br/><font color='#2DA67D' size='8'>CCO + Chairman</font>", ParagraphStyle("c", fontName="Helvetica", fontSize=10, textColor=TWILIGHT_BLUE, alignment=TA_CENTER, leading=13)),
        Paragraph("<b>Thiago</b><br/><font color='#2DA67D' size='8'>CMO + Chief Content</font>", ParagraphStyle("c", fontName="Helvetica", fontSize=10, textColor=TWILIGHT_BLUE, alignment=TA_CENTER, leading=13)),
    ]
]
t8 = Table(nomes_data, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
t8.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("TOPPADDING", (0,0), (-1,-1), 6),
]))
story.append(t8)

story.append(Spacer(1, 1.5*cm))

# Local e data
story.append(Paragraph(
    "São Paulo, ____ de ____________________ de 2026.",
    ParagraphStyle("local", fontName="Helvetica", fontSize=10, textColor=TEXT_DARK, alignment=TA_CENTER, spaceBefore=20, spaceAfter=10)
))

story.append(Spacer(1, 1.5*cm))

# Bloco de testemunhas
story.append(HRFlowable(width="50%", thickness=0.5, color=LINE, hAlign=TA_CENTER))
story.append(Paragraph("TESTEMUNHAS (opcional para term sheet preliminar)", ParagraphStyle("witness", fontName="Helvetica-Bold", fontSize=8, textColor=MINT_DEEP, alignment=TA_CENTER, spaceBefore=20, spaceAfter=14, letterSpacing=2)))

testemunhas_data = [
    ["", ""],
    ["", ""],
    ["", ""],
]
t9 = Table(testemunhas_data, colWidths=[7*cm, 7*cm])
t9.setStyle(TableStyle([
    ("LINEABOVE", (0,2), (-1,2), 0.4, LINE),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("MINROWHEIGHT", (0,0), (-1,1), 1.4*cm),
]))
story.append(t9)

# campos para preencher
fields_data = [
    [Paragraph("Nome: __________________________<br/>RG: ____________________________<br/>CPF: ____________________________", ParagraphStyle("f", fontName="Helvetica", fontSize=9, textColor=TEXT_MID, alignment=TA_CENTER, leading=14, spaceBefore=8)),
     Paragraph("Nome: __________________________<br/>RG: ____________________________<br/>CPF: ____________________________", ParagraphStyle("f", fontName="Helvetica", fontSize=9, textColor=TEXT_MID, alignment=TA_CENTER, leading=14, spaceBefore=8))]
]
t10 = Table(fields_data, colWidths=[7*cm, 7*cm])
story.append(t10)

# ============ BUILD ============
doc.build(story)
print(f"OK · PDF gerado: {output_path}")

import os
size_kb = os.path.getsize(output_path) / 1024
print(f"Tamanho: {size_kb:.0f} KB")
