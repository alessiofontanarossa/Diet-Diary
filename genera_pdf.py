"""
Genera un PDF compatto delle giornate tipo leggendo da giornate_tipo.txt.
Layout: piu' giornate affiancate in orizzontale, solo alimento + peso,
con totale macro in fondo a ciascuna.
"""

import json
import os
from fpdf import FPDF

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(ROOT_DIR, "giornate_tipo.txt")
OUTPUT_FILE = os.path.join(ROOT_DIR, "giornate_tipo.pdf")

# Font di sistema macOS con supporto Unicode
SYSTEM_FONT = "/System/Library/Fonts/SFNS.ttf"
SYSTEM_FONT_FALLBACK = "/Library/Fonts/Arial Unicode.ttf"

# Layout
COLS_PER_ROW = 3         # Numero di giornate affiancate
COL_GAP = 4              # Spazio tra colonne (mm)
ROW_H = 4.2              # Altezza riga (mm)
FONT_SIZE = 6            # Dimensione font righe
FONT_SIZE_TITLE = 7.5    # Dimensione font titolo giornata
FONT_SIZE_HEADER = 6     # Dimensione font header tabella
FONT_SIZE_TOTAL = 6      # Dimensione font riga totale


def get_unicode_font_path():
    for path in [SYSTEM_FONT, SYSTEM_FONT_FALLBACK]:
        if os.path.exists(path):
            return path
    return None


class DietPDF(FPDF):
    def __init__(self, font_path=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._use_unicode = False
        if font_path and os.path.exists(font_path):
            self.add_font("CF", "", font_path)
            self.add_font("CF", "B", font_path)
            self.add_font("CF", "I", font_path)
            self._use_unicode = True

    def f(self, style=""):
        return "CF" if self._use_unicode else "Helvetica"

    def header(self):
        self.set_font(self.f("B"), "B", 10)
        self.set_text_color(40, 40, 40)
        self.cell(0, 6, "Diet Diary - Giornate Tipo", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 200, 200)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(3)

    def footer(self):
        self.set_y(-10)
        self.set_font(self.f("I"), "I", 6)
        self.set_text_color(150, 150, 150)
        self.cell(0, 6, f"Pagina {self.page_no()}/{{nb}}", align="C")


def load_plans(filepath):
    plans = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                plans.append(json.loads(line))
    return plans


def compute_totals(items):
    tot_c = tot_g = tot_p = 0
    for item in items:
        food = item["food"]
        w = item["weight"] / 100.0
        tot_c += food["carbs"] * w
        tot_g += food["fats"] * w
        tot_p += food["proteins"] * w
    return tot_c, tot_g, tot_p


def plan_height(plan):
    """Altezza in mm di una giornata tipo nel layout compatto."""
    n = len(plan["items"])
    title_h = ROW_H + 1        # titolo
    header_h = ROW_H            # header tabella
    rows_h = n * ROW_H          # righe alimenti
    total_h = ROW_H + 1         # riga totale
    return title_h + header_h + rows_h + total_h


def draw_plan(pdf, plan, x, y, col_w):
    """Disegna una giornata tipo alla posizione (x, y)."""
    name_w = col_w * 0.75
    weight_w = col_w * 0.25

    cur_y = y

    # Titolo
    pdf.set_xy(x, cur_y)
    pdf.set_font(pdf.f("B"), "B", FONT_SIZE_TITLE)
    pdf.set_text_color(30, 80, 160)
    pdf.cell(col_w, ROW_H, plan["name"], new_x="LEFT", new_y="NEXT")
    cur_y += ROW_H + 0.5

    # Header
    pdf.set_font(pdf.f("B"), "B", FONT_SIZE_HEADER)
    pdf.set_fill_color(45, 65, 95)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(x, cur_y)
    pdf.cell(name_w, ROW_H, " Alimento", border=1, fill=True, align="L")
    pdf.cell(weight_w, ROW_H, "Peso (g)", border=1, fill=True, align="C")
    cur_y += ROW_H

    # Righe
    pdf.set_font(pdf.f(), "", FONT_SIZE)
    pdf.set_text_color(40, 40, 40)

    for i, item in enumerate(plan["items"]):
        if i % 2 == 0:
            pdf.set_fill_color(245, 248, 252)
        else:
            pdf.set_fill_color(255, 255, 255)

        name = item["food"]["name"]
        # Tronca se necessario
        if pdf.get_string_width(name) > name_w - 2:
            while pdf.get_string_width(name + "..") > name_w - 2 and len(name) > 0:
                name = name[:-1]
            name += ".."

        pdf.set_xy(x, cur_y)
        pdf.cell(name_w, ROW_H, f" {name}", border=1, fill=True, align="L")
        pdf.cell(weight_w, ROW_H, f"{item['weight']:.0f}", border=1, fill=True, align="C")
        cur_y += ROW_H

    # Riga totale
    tot_c, tot_g, tot_p = compute_totals(plan["items"])
    pdf.set_font(pdf.f("B"), "B", FONT_SIZE_TOTAL)
    pdf.set_fill_color(230, 240, 255)
    pdf.set_text_color(30, 60, 120)
    pdf.set_xy(x, cur_y)
    total_text = f" {tot_c:.1f}c,  {tot_g:.1f}g,  {tot_p:.1f}p"
    pdf.cell(col_w, ROW_H, total_text, border=1, fill=True, align="L")
    cur_y += ROW_H

    return cur_y


def generate_pdf():
    if not os.path.exists(INPUT_FILE):
        print(f"File non trovato: {INPUT_FILE}")
        return

    plans = load_plans(INPUT_FILE)
    if not plans:
        print("Nessuna giornata tipo trovata.")
        return

    font_path = get_unicode_font_path()
    pdf = DietPDF(font_path=font_path, orientation="L", unit="mm", format="A4")
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=False)
    pdf.add_page()

    # Calcola larghezza colonna
    page_w = pdf.w - pdf.l_margin - pdf.r_margin
    col_w = (page_w - COL_GAP * (COLS_PER_ROW - 1)) / COLS_PER_ROW

    # Raggruppa per persona
    groups = {}
    for plan in plans:
        name = plan["name"]
        parts = name.rsplit("-", 1)
        person = parts[-1] if len(parts) > 1 else "Altro"
        if person not in groups:
            groups[person] = []
        groups[person].append(plan)

    for person_idx, (person, person_plans) in enumerate(groups.items()):
        if person_idx > 0:
            pdf.add_page()

        # Titolo persona
        pdf.set_font(pdf.f("B"), "B", 11)
        pdf.set_text_color(30, 80, 160)
        pdf.cell(0, 7, f">> {person}", new_x="LMARGIN", new_y="NEXT")
        pdf.set_draw_color(30, 80, 160)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + 40, pdf.get_y())
        pdf.ln(3)

        # Disponi le giornate in righe da COLS_PER_ROW
        col_idx = 0
        row_start_y = pdf.get_y()
        row_max_bottom = row_start_y

        for plan in person_plans:
            h = plan_height(plan)
            x = pdf.l_margin + col_idx * (col_w + COL_GAP)

            # Verifica se serve una nuova riga
            if col_idx >= COLS_PER_ROW:
                col_idx = 0
                row_start_y = row_max_bottom + 3
                row_max_bottom = row_start_y
                x = pdf.l_margin

            # Verifica se serve una nuova pagina
            if row_start_y + h > pdf.h - pdf.b_margin - 12:
                pdf.add_page()
                row_start_y = pdf.get_y()
                row_max_bottom = row_start_y
                col_idx = 0
                x = pdf.l_margin

            bottom = draw_plan(pdf, plan, x, row_start_y, col_w)
            row_max_bottom = max(row_max_bottom, bottom)
            col_idx += 1

    pdf.output(OUTPUT_FILE)
    print(f"PDF generato: {OUTPUT_FILE}")


if __name__ == "__main__":
    generate_pdf()
