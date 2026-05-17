#!/usr/bin/env python3
"""
Vegl.ia — Apresentacao Comercial Premium
PDF gerado via reportlab canvas direto (sem Platypus)
"""

import os
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
OUTPUT = "/Users/rodolfonascimento/Documents/Claude/Projects/Vacivita - MarketPlace/veglia-platform/assets/apresentacao_veglia.pdf"

# A4 landscape
W = 841.89
H = 595.28

# Paleta
DEEP_NAVY   = '#0B2545'
TWILIGHT    = '#1A3A5C'
MINT        = '#5DD3A8'
CHAMPAGNE   = '#C9A96E'
WARM_WHITE  = '#FBF8F1'
CREAM       = '#F4EDE0'
RED_ALERT   = '#E05252'
DARK_BG     = '#060F1A'
CARD_DARK   = '#162d4d'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def hex_to_rgb(hex_color):
    h = hex_color.lstrip('#')
    return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))


def set_fill(c, hex_color, alpha=1.0):
    r, g, b = hex_to_rgb(hex_color)
    c.setFillColorRGB(r, g, b, alpha)


def set_stroke(c, hex_color, alpha=1.0):
    r, g, b = hex_to_rgb(hex_color)
    c.setStrokeColorRGB(r, g, b, alpha)


def draw_rect(c, x, y, w, h, fill_hex, stroke_hex=None, stroke_width=0, fill_alpha=1.0):
    set_fill(c, fill_hex, fill_alpha)
    if stroke_hex:
        set_stroke(c, stroke_hex)
        c.setLineWidth(stroke_width)
    c.rect(x, y, w, h, fill=1, stroke=1 if stroke_hex else 0)


def draw_text(c, text, x, y, font, size, color_hex, align='left', alpha=1.0):
    set_fill(c, color_hex, alpha)
    c.setFont(font, size)
    if align == 'center':
        c.drawCentredString(x, y, text)
    elif align == 'right':
        c.drawRightString(x, y, text)
    else:
        c.drawString(x, y, text)


def draw_left_border_card(c, x, y, w, h, bg_hex, border_hex, border_width=4):
    draw_rect(c, x, y, w, h, bg_hex)
    set_fill(c, border_hex)
    c.rect(x, y, border_width, h, fill=1, stroke=0)


def wrap_text_lines(text, max_chars):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        if len(current) + len(word) + 1 <= max_chars:
            current = current + " " + word if current else word
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_footer(c, W, H, page_num, extra_text=None):
    draw_rect(c, 0, 0, W, 30, DEEP_NAVY)
    set_stroke(c, MINT, 0.3)
    c.setLineWidth(0.5)
    c.line(40, 30, W - 40, 30)
    footer_label = extra_text if extra_text else 'Vegl.ia  ·  Powered by Vacivitta  ·  vegl.ia  ·  contato@vegl.ia  ·  Confidencial'
    draw_text(c, footer_label, 40, 10, 'Helvetica', 7, WARM_WHITE)
    draw_text(c, str(page_num), W - 40, 10, 'Courier', 7, MINT, align='right')


# ---------------------------------------------------------------------------
# PAGINA 1 — CAPA
# ---------------------------------------------------------------------------

def page_capa(c):
    draw_rect(c, 0, 0, W, H, DEEP_NAVY)

    # Badge canto superior direito
    bx = W - 220
    by = H - 50
    draw_left_border_card(c, bx, by, 180, 28, TWILIGHT, MINT, 3)
    draw_text(c, 'CONFIDENCIAL · Apresentacao comercial restrita', bx + 12, by + 9, 'Courier', 7.5, WARM_WHITE)

    # Logo: "Vegl" branco + ".ia" mint
    # Calculamos a largura para centralizar o conjunto
    c.setFont('Helvetica-Bold', 64)
    vegl_w = c.stringWidth('Vegl', 'Helvetica-Bold', 64)
    ia_w   = c.stringWidth('.ia',  'Helvetica-Bold', 64)
    total_w = vegl_w + ia_w
    logo_x = (W - total_w) / 2
    logo_y = 360

    draw_text(c, 'Vegl', logo_x, logo_y, 'Helvetica-Bold', 64, WARM_WHITE)
    draw_text(c, '.ia',  logo_x + vegl_w, logo_y, 'Helvetica-Bold', 64, MINT)

    # Linha Mint abaixo do logo
    line_y = logo_y - 16
    set_stroke(c, MINT)
    c.setLineWidth(1)
    c.line(W/2 - 60, line_y, W/2 + 60, line_y)

    # Headline
    headline = "A lei mudou. Sua empresa esta pronta para provar que cuida?"
    draw_text(c, headline, W/2, 280, 'Helvetica-Bold', 20, WARM_WHITE, align='center')

    # Subtitulo
    draw_text(c, 'COMPLIANCE PREVENTIVO CORPORATIVO  ·  LEI 15.377/2026', W/2, 252, 'Helvetica', 11, MINT, align='center')

    # Tagline
    draw_text(c, 'Quem vela, cuida.', W/2, 218, 'Helvetica-Oblique', 16, CHAMPAGNE, align='center')

    # Footer especial
    draw_footer(c, W, H, 1, 'Powered by Vacivitta · 10 anos de operacao real em saude corporativa  ·  vegl.ia  ·  Confidencial')


# ---------------------------------------------------------------------------
# PAGINA 2 — O PROBLEMA
# ---------------------------------------------------------------------------

def page_problema(c):
    draw_rect(c, 0, 0, W, H, TWILIGHT)

    draw_text(c, '01 · O PROBLEMA', 50, H - 58, 'Courier', 9, CHAMPAGNE)
    headline = "O RH zela. Mas a lei agora exige que a empresa prove."
    draw_text(c, headline, 50, H - 90, 'Helvetica-Bold', 24, WARM_WHITE)

    cards = [
        (350, MINT,      'Autuacoes chegam silenciosamente',
         'Fiscais do MTE e eSocial identificam gaps sem aviso. A multa ja existe quando voce descobre.'),
        (265, CHAMPAGNE, 'Absenteismo por doencas preveniveis',
         'Doencas imunopreveniveis custam em media 4,2 dias/ano por colaborador. Dado mensuravel e evitavel.'),
        (178, RED_ALERT, 'Passivo trabalhista por omissao',
         'Omissao documentada em saude preventiva vira acao trabalhista. Sem registro, sem defesa.'),
    ]

    card_w = W - 100
    for cy, border_col, title, body in cards:
        draw_left_border_card(c, 50, cy, card_w, 68, CARD_DARK, border_col, 4)
        draw_text(c, title, 70, cy + 44, 'Helvetica-Bold', 11, WARM_WHITE)
        lines = wrap_text_lines(body, 115)
        for i, line in enumerate(lines[:2]):
            draw_text(c, line, 70, cy + 28 - i * 14, 'Helvetica', 9, WARM_WHITE, alpha=0.72)

    draw_footer(c, W, H, 2)


# ---------------------------------------------------------------------------
# PAGINA 3 — A LEI 15.377/2026
# ---------------------------------------------------------------------------

def page_lei(c):
    draw_rect(c, 0, 0, W, H, CREAM)

    draw_text(c, '02 · A LEI 15.377/2026', 50, H - 58, 'Courier', 9, CHAMPAGNE)
    draw_text(c, 'O que a legislacao exige da sua empresa agora.', 50, H - 88, 'Helvetica-Bold', 20, DEEP_NAVY)
    draw_text(c, 'Vigencia imediata. Fiscalizacao pelo MTE e eSocial. Sem periodo de adaptacao.', 50, H - 110, 'Helvetica', 10, DEEP_NAVY, alpha=0.65)

    # Box Deep Navy
    box_x, box_y, box_w, box_h = 50, 230, W - 100, 155
    draw_rect(c, box_x, box_y, box_w, box_h, DEEP_NAVY)
    draw_text(c, 'Art. 169-A da CLT — 4 Obrigacoes Simultaneas', box_x + 20, box_y + box_h - 25, 'Courier', 10, CHAMPAGNE)

    bullets = [
        'Comunicar campanhas de vacinacao ao quadro de colaboradores',
        'Orientar sobre a prevencao de canceres femininos e masculinos',
        'Garantir ausencia remunerada para vacinacao e exames preventivos',
        'Documentar e arquivar registros para auditoria MTE e eSocial',
    ]
    for i, b in enumerate(bullets):
        by = box_y + box_h - 55 - i * 26
        draw_text(c, '▸', box_x + 20, by, 'Helvetica-Bold', 11, MINT)
        draw_text(c, b, box_x + 38, by, 'Helvetica', 9, WARM_WHITE)

    # 3 colunas
    cols = [
        (W * 0.18, 'Politica',    'escrita'),
        (W * 0.50, 'Treinamento', 'concluido'),
        (W * 0.82, 'Relatorio',   'para auditoria'),
    ]
    for cx, num_text, label in cols:
        draw_text(c, num_text, cx, 185, 'Helvetica-Bold', 15, MINT, align='center')
        draw_text(c, label,    cx, 168, 'Helvetica', 9,  DEEP_NAVY, align='center', alpha=0.6)
        set_stroke(c, MINT, 0.4)
        c.setLineWidth(0.5)
        c.line(cx - 55, 196, cx + 55, 196)

    # Alerta rodape
    alert_y = 44
    draw_rect(c, 50, alert_y, W - 100, 38, RED_ALERT, fill_alpha=0.08)
    set_stroke(c, RED_ALERT)
    c.setLineWidth(1)
    c.rect(50, alert_y, W - 100, 38, fill=0, stroke=1)
    draw_text(c,
        'Intencao nao e prova. Documentacao e. O passivo se acumula a cada mes sem conformidade.',
        W / 2, alert_y + 13, 'Helvetica-Bold', 9, RED_ALERT, align='center')

    draw_footer(c, W, H, 3)


# ---------------------------------------------------------------------------
# PAGINA 4 — COMO O VEGL.IA RESOLVE
# ---------------------------------------------------------------------------

def page_solucao(c):
    draw_rect(c, 0, 0, W, H, DEEP_NAVY)

    draw_text(c, '03 · A SOLUCAO', 50, H - 58, 'Courier', 9, MINT)
    draw_text(c, 'Vegl.ia transforma obrigacao legal em', 50, H - 90, 'Helvetica-Bold', 22, WARM_WHITE)
    draw_text(c, 'infraestrutura operacional de prevencao continua.', 50, H - 116, 'Helvetica-Bold', 22, MINT)

    card_w = (W - 120) / 2
    card_h = 112

    grid = [
        (50,              300, '01', 'Trilhas de Compliance Auditavel',
         'Treinamentos por lei, por cargo e perfil — certificado SHA-256 valido para eSocial e MTE.'),
        (W / 2 + 10,      300, '02', 'Dashboard de Adequacao',
         'O RH exporta relatorio para o juridico com um clique. Prova de conformidade sob demanda.'),
        (50,              165, '03', 'Vacinacao In-Company via Vacivitta',
         'Agendamento de campanha corporativa direto pela plataforma. Operacao real embarcada.'),
        (W / 2 + 10,      165, '04', 'Conteudo Validado Medicamente',
         'Cada modulo chancelado pela Dra. Amanda Conde Perez Fernandes, diretora medica Vacivitta.'),
    ]

    for cx, cy, num, title, body in grid:
        draw_rect(c, cx, cy, card_w, card_h, TWILIGHT, MINT, 0.5, fill_alpha=1.0)
        set_stroke(c, MINT, 0.3)
        c.setLineWidth(0.5)
        c.rect(cx, cy, card_w, card_h, fill=0, stroke=1)

        # numero fantasma
        draw_text(c, num, cx + card_w - 42, cy + card_h - 22, 'Courier', 20, MINT, alpha=0.25)
        draw_text(c, title, cx + 16, cy + card_h - 28, 'Helvetica-Bold', 11, MINT)
        lines = wrap_text_lines(body, 70)
        for i, line in enumerate(lines[:3]):
            draw_text(c, line, cx + 16, cy + card_h - 50 - i * 14, 'Helvetica', 9, WARM_WHITE, alpha=0.8)

    draw_footer(c, W, H, 4)


# ---------------------------------------------------------------------------
# PAGINA 5 — AS TRILHAS
# ---------------------------------------------------------------------------

def page_trilhas(c):
    draw_rect(c, 0, 0, W, H, CREAM)

    draw_text(c, '04 · AS TRILHAS', 50, H - 58, 'Courier', 9, CHAMPAGNE)
    draw_text(c, 'Conteudo estruturado para cada obrigacao legal.', 50, H - 88, 'Helvetica-Bold', 22, DEEP_NAVY)
    draw_text(c, 'Percurso Colaborador CLT + Percurso Gestor de RH — para cada trilha', 50, H - 112, 'Helvetica', 10, DEEP_NAVY, alpha=0.6)

    # Tabela
    col_x   = [50, 340, 620]
    col_w   = [285, 275, 175]
    headers = ['TRILHA', 'PERCURSO', 'OBRIGACAO LEGAL']
    row_h   = 32
    table_top = H - 140

    # Header
    draw_rect(c, 50, table_top, W - 100, row_h, DEEP_NAVY)
    for i, hdr in enumerate(headers):
        draw_text(c, hdr, col_x[i] + 10, table_top + 11, 'Courier', 9, WARM_WHITE)

    rows = [
        ('Lei 15.377 · M1: Compliance Legal',        'Colaborador + RH', 'Art. 169-A CLT'),
        ('Lei 15.377 · M2: Vacinacao Adulta',         'Colaborador + RH', 'Art. 169-A, I'),
        ('Lei 15.377 · M3: Prevencao de Canceres',    'Colaborador + RH', 'Art. 169-A, II'),
        ('Lei 15.377 · M4: Saude Mental e Burnout',   'Colaborador + RH', 'Art. 169-A + NR-1'),
        ('NR-1 · M1: Riscos Psicossociais',           'Colaborador + RH', 'NR-1 rev. 2024'),
        ('NR-1 · M2: PGR/GRO na Pratica',            'Colaborador + RH', 'NR-1 + eSocial'),
    ]

    alt_colors = ['#F4EDE0', '#EDE8DC']
    for ri, row in enumerate(rows):
        ry = table_top - (ri + 1) * row_h
        draw_rect(c, 50, ry, W - 100, row_h, alt_colors[ri % 2])
        # separador vertical leve
        for ci in range(1, 3):
            set_stroke(c, DEEP_NAVY, 0.15)
            c.setLineWidth(0.5)
            c.line(col_x[ci], ry, col_x[ci], ry + row_h)
        for ci, cell in enumerate(row):
            draw_text(c, cell, col_x[ci] + 10, ry + 11, 'Helvetica', 9, DEEP_NAVY)

    # Badge
    badge_y = 78
    draw_left_border_card(c, 50, badge_y, W - 100, 30, TWILIGHT, MINT, 3)
    draw_text(c,
        'Certificado digital SHA-256  ·  Valido para auditoria MTE e eSocial  ·  Gerado automaticamente ao concluir a trilha',
        W / 2, badge_y + 10, 'Courier', 9, MINT, align='center')

    draw_footer(c, W, H, 5)


# ---------------------------------------------------------------------------
# PAGINA 6 — CORPO TECNICO
# ---------------------------------------------------------------------------

def page_corpo_tecnico(c):
    draw_rect(c, 0, 0, W, H, DEEP_NAVY)

    draw_text(c, '05 · AUTORIDADE MEDICA', 50, H - 58, 'Courier', 9, CHAMPAGNE)
    headline = "Conteudo sem autoria medica nao e compliance. E risco."
    draw_text(c, headline, 50, H - 88, 'Helvetica-Bold', 21, WARM_WHITE)

    # Divisao
    mid = W / 2 - 10

    # Coluna esquerda
    draw_text(c, 'Dra. Amanda Conde Perez Fernandes', 50, H - 135, 'Helvetica-Bold', 13, MINT)
    draw_text(c, 'Pediatra  ·  Neonatologista  ·  Nutrologa  ·  Membro SBIm', 50, H - 153, 'Helvetica', 10, CHAMPAGNE)

    bio_lines = [
        'Diretora medica da Vacivitta, com mais de 12 anos de experiencia',
        'clinica em saude preventiva e imunizacao adulta e infantil.',
        'Formacao em grandes centros medicos do Brasil e reconhecimento',
        'nacional em imunizacao corporativa e saude ocupacional.',
    ]
    for i, line in enumerate(bio_lines):
        draw_text(c, line, 50, H - 178 - i * 14, 'Helvetica', 9, WARM_WHITE, alpha=0.8)

    credentials = [
        'Membro titulada da Sociedade Brasileira de Imunizacoes (SBIm)',
        'Especialista em Medicina do Trabalho aplicada a saude preventiva',
        'Autora dos modulos educacionais Vegl.ia (todos os 6 modulos)',
        'Responsavel tecnica pelo programa In-Company Vacivitta',
    ]
    for i, cred in enumerate(credentials):
        cy = H - 248 - i * 20
        draw_text(c, '▸', 50, cy, 'Helvetica-Bold', 10, MINT)
        draw_text(c, cred, 68, cy, 'Helvetica', 9, WARM_WHITE, alpha=0.85)

    # Coluna direita
    card_x = mid + 20
    card_w = W - mid - 70
    card_y = H - 440
    card_h = 300

    draw_rect(c, card_x, card_y, card_w, card_h, TWILIGHT, CHAMPAGNE, 2)

    # Avatar circular "AC"
    avatar_cx = card_x + card_w / 2
    avatar_cy = card_y + card_h - 50
    set_fill(c, MINT, 0.18)
    c.circle(avatar_cx, avatar_cy, 30, fill=1, stroke=0)
    set_stroke(c, MINT, 0.6)
    c.setLineWidth(1.5)
    c.circle(avatar_cx, avatar_cy, 30, fill=0, stroke=1)
    draw_text(c, 'AC', avatar_cx, avatar_cy - 6, 'Helvetica-Bold', 14, MINT, align='center')

    draw_text(c, 'Dra. Amanda Conde', avatar_cx, card_y + card_h - 95, 'Helvetica-Bold', 10, WARM_WHITE, align='center')
    draw_text(c, 'Diretora Medica Vacivitta', avatar_cx, card_y + card_h - 110, 'Helvetica', 8, CHAMPAGNE, align='center')

    # Linha separadora
    set_stroke(c, CHAMPAGNE, 0.3)
    c.setLineWidth(0.5)
    c.line(card_x + 20, card_y + card_h - 125, card_x + card_w - 20, card_y + card_h - 125)

    quote_lines = [
        '"O protocolo Vegl.ia foi desenhado para que cada',
        'colaborador entenda o porque da prevencao, nao apenas',
        'cumpra um checklist. Educacao real gera adesao real.',
        'Isso e o que diferencia compliance verdadeiro de papelada."',
    ]
    for i, ql in enumerate(quote_lines):
        draw_text(c, ql, avatar_cx, card_y + card_h - 155 - i * 16, 'Helvetica-Oblique', 9, WARM_WHITE, align='center', alpha=0.8)

    draw_footer(c, W, H, 6)


# ---------------------------------------------------------------------------
# PAGINA 7 — VACIVITTA
# ---------------------------------------------------------------------------

def page_vacivitta(c):
    draw_rect(c, 0, 0, W, H, TWILIGHT)

    draw_text(c, '06 · VACIVITTA INTEGRADO', 50, H - 58, 'Courier', 9, MINT)
    draw_text(c, 'Operacao vacinal real embarcada na plataforma.', 50, H - 88, 'Helvetica-Bold', 22, WARM_WHITE)
    draw_text(c, 'Nenhum concorrente tem isso. Nao e integracao. E a propria Vacivitta dentro do Vegl.ia.', 50, H - 112, 'Helvetica', 10, WARM_WHITE, alpha=0.65)

    # 3 colunas
    col_defs = [
        (50,           '01', 'Agendamento na plataforma',
         'O RH agenda a campanha diretamente pelo painel Vegl.ia. Seleciona datas, turnos e localizacao.'),
        (W / 3 + 17,   '02', 'Operacao real Vacivitta',
         'Equipe vai ate a empresa com imunobiologicos e cold chain controlada. Logistica completa inclusa.'),
        (2 * W / 3 - 17,'03', 'Registro automatico',
         'Vacinacao registrada no dashboard em tempo real. Evidencia auditavel automatica no eSocial.'),
    ]

    col_w = W / 3 - 30
    for cx, num, title, body in col_defs:
        draw_text(c, num, cx + col_w / 2, H - 165, 'Courier', 28, MINT, align='center', alpha=0.2)
        draw_text(c, title, cx + col_w / 2, H - 200, 'Helvetica-Bold', 11, MINT, align='center')
        lines = wrap_text_lines(body, 40)
        for i, line in enumerate(lines[:4]):
            draw_text(c, line, cx + col_w / 2, H - 222 - i * 15, 'Helvetica', 9, WARM_WHITE, align='center', alpha=0.8)

    # Pull quote
    pq_y = 110
    set_stroke(c, MINT)
    c.setLineWidth(1)
    c.line(60, pq_y + 40, W - 60, pq_y + 40)
    c.line(60, pq_y,      W - 60, pq_y)
    draw_text(c,
        '"Nenhuma plataforma de compliance trabalhista do Brasil tem operacao vacinal propria embarcada."',
        W / 2, pq_y + 14, 'Helvetica-Oblique', 10, WARM_WHITE, align='center', alpha=0.9)

    # Badge rodape
    draw_text(c, 'Powered by Vacivitta  ·  Saude Integrada  ·  vacivitta.com.br', W / 2, 70, 'Courier', 8, CHAMPAGNE, align='center')

    draw_footer(c, W, H, 7)


# ---------------------------------------------------------------------------
# PAGINA 8 — POR QUE PARCERIA
# ---------------------------------------------------------------------------

def page_parceria(c):
    draw_rect(c, 0, 0, W, H, CREAM)

    draw_text(c, '07 · POR QUE PARCERIA', 50, H - 58, 'Courier', 9, CHAMPAGNE)
    draw_text(c, 'Para carriers e operadoras de beneficios:', 50, H - 88, 'Helvetica-Bold', 22, DEEP_NAVY)
    draw_text(c, 'uma categoria nova, retencao real e margem sobre base fidelizada.', 50, H - 112, 'Helvetica', 13, DEEP_NAVY, alpha=0.7)

    card_data = [
        ('01', MINT,      'Demanda imediata',
         'Lei em vigor. Seu cliente ja tem a obrigacao, ainda nao tem solucao. A janela esta aberta agora.'),
        ('02', CHAMPAGNE, 'Retencao via compliance',
         'Historico auditavel nao se transfere. Cliente que gera evidencia aqui nao troca operadora.'),
        ('03', MINT,      'Margem nova em base instalada',
         'Revenue share sobre base fidelizada. Sem custo de aquisicao de produto. Zero capex inicial.'),
        ('04', CHAMPAGNE, 'Categoria nova no portfolio',
         'Compliance Preventivo e percebido pelo board e pelo juridico — nao pelo beneficios.'),
        ('05', MINT,      'Operacao real como argumento',
         'Vacinacao in-company gera NPS, foto e evidencia auditavel. Concorrente nao tem.'),
    ]

    card_h = 55
    start_y = 415

    for i, (num, border_col, title, body) in enumerate(card_data):
        cy = start_y - i * (card_h + 8)
        draw_left_border_card(c, 50, cy, W - 100, card_h, '#EDE8DC', border_col, 4)
        draw_text(c, num, 58, cy + card_h - 20, 'Courier', 18, border_col, alpha=0.35)
        draw_text(c, title, 95, cy + card_h - 20, 'Helvetica-Bold', 11, DEEP_NAVY)
        lines = wrap_text_lines(body, 108)
        for j, line in enumerate(lines[:2]):
            draw_text(c, line, 95, cy + card_h - 37 - j * 13, 'Helvetica', 9, DEEP_NAVY, alpha=0.65)

    draw_footer(c, W, H, 8)


# ---------------------------------------------------------------------------
# PAGINA 9 — MODELO COMERCIAL
# ---------------------------------------------------------------------------

def page_modelo(c):
    draw_rect(c, 0, 0, W, H, DEEP_NAVY)

    draw_text(c, '08 · MODELO COMERCIAL', 50, H - 58, 'Courier', 9, MINT)
    draw_text(c, 'Planos e estrutura de parceria white label.', 50, H - 88, 'Helvetica-Bold', 22, WARM_WHITE)

    # Tabela de planos
    tcols_x = [50, 340, 630]
    tcols_w = [285, 285, 160]
    t_headers = ['PLANO', 'PERFIL', 'PRECO / MES']
    row_h = 36
    table_top = H - 140

    # Header Mint
    draw_rect(c, 50, table_top, W - 100, row_h, MINT)
    for i, hdr in enumerate(t_headers):
        draw_text(c, hdr, tcols_x[i] + 12, table_top + 13, 'Courier', 9, DEEP_NAVY)

    plans = [
        ('Starter',         'Ate 50 colaboradores',         'R$ 299 / mes',    False),
        ('Compliance',      '51 a 250 colaboradores',       'R$ 799 / mes',    False),
        ('Professional',    '251 a 1.000 colaboradores',    'R$ 1.800 / mes',  True),
        ('Enterprise',      '1.000+ / White Label',         'R$ 5.000 a 20.000 / mes', False),
    ]

    for ri, (name, profile, price, highlight) in enumerate(plans):
        ry = table_top - (ri + 1) * row_h
        if highlight:
            draw_rect(c, 50, ry, W - 100, row_h, TWILIGHT, MINT, 1.5)
        else:
            draw_rect(c, 50, ry, W - 100, row_h, DEEP_NAVY, WARM_WHITE, 0.5, fill_alpha=1.0)
            set_stroke(c, WARM_WHITE, 0.12)
            c.setLineWidth(0.5)
            c.rect(50, ry, W - 100, row_h, fill=0, stroke=1)

        label = ('* ' + name) if highlight else name
        draw_text(c, label, tcols_x[0] + 12, ry + 13, 'Helvetica-Bold' if highlight else 'Helvetica', 10, MINT if highlight else WARM_WHITE)
        draw_text(c, profile, tcols_x[1] + 12, ry + 13, 'Helvetica', 10, WARM_WHITE)
        draw_text(c, price,   tcols_x[2] + 12, ry + 13, 'Helvetica-Bold' if highlight else 'Helvetica', 10, MINT if highlight else WARM_WHITE)

    # 3 boxes abaixo
    box3_y   = 140
    box3_h   = 68
    box3_w   = (W - 120) / 3
    boxes = [
        (50,                     MINT,      'White Label',
         'Marca propria do carrier. Interface customizada com cores, logo e dominio da operadora.'),
        (50 + box3_w + 10,       CHAMPAGNE, 'Revenue Share',
         'Modelo de parceria por base ativa. Proposta customizada por volume de colaboradores.'),
        (50 + 2 * (box3_w + 10), '#C9DCE8', 'Setup em 15 dias',
         'Onboarding completo, carga de base e treinamento da equipe RH em 15 dias uteis.'),
    ]

    for bx, border_col, title, body in boxes:
        draw_left_border_card(c, bx, box3_y, box3_w, box3_h, TWILIGHT, border_col, 3)
        draw_text(c, title, bx + 14, box3_y + box3_h - 20, 'Helvetica-Bold', 10, WARM_WHITE)
        lines = wrap_text_lines(body, 50)
        for i, line in enumerate(lines[:2]):
            draw_text(c, line, bx + 14, box3_y + box3_h - 38 - i * 14, 'Helvetica', 8, WARM_WHITE, alpha=0.75)

    draw_text(c, '* Valores sao ponto de partida. Proposta customizada por volume de base do carrier.',
              W / 2, 110, 'Helvetica-Oblique', 8, WARM_WHITE, align='center', alpha=0.55)

    draw_footer(c, W, H, 9)


# ---------------------------------------------------------------------------
# PAGINA 10 — PROXIMOS PASSOS
# ---------------------------------------------------------------------------

def page_proximos(c):
    draw_rect(c, 0, 0, W, H, DARK_BG)

    draw_text(c, '09 · PROXIMOS PASSOS', W / 2, H - 58, 'Courier', 9, MINT, align='center')
    draw_text(c, 'Da conversa ao contrato:', W / 2, H - 90, 'Helvetica-Bold', 18, WARM_WHITE, align='center')
    draw_text(c, 'tres passos para comecar em 15 dias.', W / 2, H - 112, 'Helvetica-Bold', 18, WARM_WHITE, align='center')

    # 3 steps com linha conectora
    step_y   = 330
    step_xs  = [W * 0.2, W * 0.5, W * 0.8]
    radius   = 18

    # Linha conectora
    set_stroke(c, MINT, 0.45)
    c.setLineWidth(1.5)
    c.line(step_xs[0], step_y, step_xs[2], step_y)

    steps = [
        ('1', 'Demo 30 min',        'Produto funcionando, nao mockup.',    'Agenda flexivel para sua equipe.'),
        ('2', 'Proposta white label','Customizada com projecao de receita', 'sobre sua base de clientes.'),
        ('3', 'Piloto 90 dias',     '5 empresas, relatorio de adesao',     'e NPS ao final do piloto.'),
    ]

    for sx, (num, title, line1, line2) in zip(step_xs, steps):
        set_fill(c, MINT)
        c.circle(sx, step_y, radius, fill=1, stroke=0)
        draw_text(c, num, sx, step_y - 6, 'Helvetica-Bold', 14, DEEP_NAVY, align='center')
        draw_text(c, title, sx, step_y - 42, 'Helvetica-Bold', 11, WARM_WHITE, align='center')
        draw_text(c, line1, sx, step_y - 58, 'Helvetica', 9, WARM_WHITE, align='center', alpha=0.65)
        draw_text(c, line2, sx, step_y - 72, 'Helvetica', 9, WARM_WHITE, align='center', alpha=0.65)

    # CTA box
    cta_w = 300
    cta_h = 46
    cta_x = (W - cta_w) / 2
    cta_y = 155
    draw_rect(c, cta_x, cta_y, cta_w, cta_h, MINT)
    draw_text(c, 'Agendar demo: contato@vegl.ia', W / 2, cta_y + 16, 'Helvetica-Bold', 13, DEEP_NAVY, align='center')

    # Frase final
    draw_text(c, 'Vegl.ia. Quem vela, cuida.', W / 2, 108, 'Helvetica-Oblique', 20, CHAMPAGNE, align='center')

    draw_footer(c, W, H, 10)


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def build():
    c = canvas.Canvas(OUTPUT, pagesize=(W, H))
    c.setTitle('Vegl.ia — Apresentacao Comercial')
    c.setAuthor('Vegl.ia / Vacivitta')
    c.setSubject('Compliance Preventivo Corporativo · Lei 15.377/2026')

    pages = [
        ('Capa',            page_capa),
        ('O Problema',      page_problema),
        ('A Lei',           page_lei),
        ('A Solucao',       page_solucao),
        ('As Trilhas',      page_trilhas),
        ('Corpo Tecnico',   page_corpo_tecnico),
        ('Vacivitta',       page_vacivitta),
        ('Parceria',        page_parceria),
        ('Modelo Comercial',page_modelo),
        ('Proximos Passos', page_proximos),
    ]

    for name, fn in pages:
        try:
            fn(c)
            c.showPage()
            print(f'  [OK] {name}')
        except Exception as e:
            print(f'  [ERRO] {name}: {e}')
            import traceback
            traceback.print_exc()
            # pagina de fallback para nao pular
            draw_rect(c, 0, 0, W, H, DEEP_NAVY)
            draw_text(c, f'[{name} — erro de renderizacao]', W/2, H/2, 'Helvetica', 12, RED_ALERT, align='center')
            c.showPage()

    c.save()
    size = os.path.getsize(OUTPUT)
    print(f'\nPDF salvo: {OUTPUT}')
    print(f'Tamanho: {size:,} bytes ({size/1024:.1f} KB)')


if __name__ == '__main__':
    build()
