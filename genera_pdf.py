"""
Genera un PDF ben formattato delle giornate tipo leggendo da giornate_tipo.txt.
Ogni giornata tipo è presentata come una tabella con alimenti, pesi e macro,
con una riga di totali in fondo. Le giornate sono raggruppate per persona.
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


def get_unicode_font_path():
    """Trova un font TTF con supporto Unicode disponibile sul sistema."""
    for path in [SYSTEM_FONT, SYSTEM_FONT_FALLBACK]:
        if os.path.exists(path):
            return path
    return None


class DietPDF(FPDF):
    def __init__(self, font_path=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._use_unicode = False
        if font_path and os.path.exists(font_path):
            self.add_font("CustomFont", "", font_path)
            self.add_font("CustomFont", "B", font_path)
            self.add_font("CustomFont", "I", font_path)
            self._use_unicode = True

    def _font(self, style=""):
        return "CustomFont" if self._use_unicode else "Helvetica"

    def header(self):
        self.set_font(self._font("B"), "B", 14)
        self.set_text_color(40, 40, 40)
        self.cell(0, 8, "Diet Diary - Giornate Tipo", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 200, 200)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font(self._font("I"), "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Pagina {self.page_no()}/{{nb}}", align="C")


def load_plans(filepath):
    """Legge il file giornate_tipo.txt e restituisce la lista dei piani."""
    plans = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                plans.append(json.loads(line))
    return plans


def compute_macros(item):
    """Calcola i macro effettivi per un alimento dato il peso."""
    food = item["food"]
    w = item["weight"] / 100.0
    return {
        "carbs": food["carbs"] * w,
        "fats": food["fats"] * w,
        "proteins": food["proteins"] * w,
        "calories": food["calories"] * w,
    }


def estimate_table_height(plan, row_h=6):
    """Stima l'altezza totale di una tabella (titolo + header + righe + totale + margini)."""
    n_items = len(plan["items"])
    title_h = 10
    header_h = row_h
    rows_h = n_items * row_h
    totals_h = row_h
    spacing = 8
    return title_h + header_h + rows_h + totals_h + spacing


def draw_plan_table(pdf, plan):
    """Disegna la tabella per una singola giornata tipo."""
    row_h = 6

    # Stima altezza necessaria e verifica se serve un page break
    needed = estimate_table_height(plan, row_h)
    available = pdf.h - pdf.get_y() - pdf.b_margin - 15
    if needed > available:
        pdf.add_page()

    # Titolo della giornata
    pdf.set_font(pdf._font("B"), "B", 11)
    pdf.set_text_color(30, 100, 180)
    pdf.cell(0, 8, plan["name"], new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)

    # Larghezze colonne
    page_w = pdf.w - pdf.l_margin - pdf.r_margin
    col_w = {
        "name": page_w * 0.40,
        "weight": page_w * 0.10,
        "carbs": page_w * 0.12,
        "fats": page_w * 0.12,
        "prot": page_w * 0.12,
        "kcal": page_w * 0.14,
    }

    # Header tabella
    pdf.set_font(pdf._font("B"), "B", 8)
    pdf.set_fill_color(45, 65, 95)
    pdf.set_text_color(255, 255, 255)
    headers = [
        ("Alimento", col_w["name"]),
        ("Peso (g)", col_w["weight"]),
        ("Carb (g)", col_w["carbs"]),
        ("Grassi (g)", col_w["fats"]),
        ("Prot (g)", col_w["prot"]),
        ("Kcal", col_w["kcal"]),
    ]
    for label, w in headers:
        pdf.cell(w, row_h, label, border=1, fill=True, align="C")
    pdf.ln()

    # Righe alimenti
    pdf.set_font(pdf._font(), "", 7.5)
    pdf.set_text_color(40, 40, 40)
    tot_carbs = tot_fats = tot_prot = tot_kcal = 0

    for i, item in enumerate(plan["items"]):
        macros = compute_macros(item)
        tot_carbs += macros["carbs"]
        tot_fats += macros["fats"]
        tot_prot += macros["proteins"]
        tot_kcal += macros["calories"]

        # Alternanza colori righe
        if i % 2 == 0:
            pdf.set_fill_color(245, 248, 252)
        else:
            pdf.set_fill_color(255, 255, 255)

        name = item["food"]["name"]
        # Tronca il nome se troppo lungo
        if pdf.get_string_width(name) > col_w["name"] - 2:
            while pdf.get_string_width(name + "...") > col_w["name"] - 2 and len(name) > 0:
                name = name[:-1]
            name += "..."

        pdf.cell(col_w["name"], row_h, f" {name}", border=1, fill=True, align="L")
        pdf.cell(col_w["weight"], row_h, f"{item['weight']:.0f}", border=1, fill=True, align="C")
        pdf.cell(col_w["carbs"], row_h, f"{macros['carbs']:.1f}", border=1, fill=True, align="C")
        pdf.cell(col_w["fats"], row_h, f"{macros['fats']:.1f}", border=1, fill=True, align="C")
        pdf.cell(col_w["prot"], row_h, f"{macros['proteins']:.1f}", border=1, fill=True, align="C")
        pdf.cell(col_w["kcal"], row_h, f"{macros['calories']:.0f}", border=1, fill=True, align="C")
        pdf.ln()

    # Riga totali
    pdf.set_font(pdf._font("B"), "B", 8)
    pdf.set_fill_color(230, 240, 255)
    pdf.set_text_color(30, 60, 120)
    pdf.cell(col_w["name"], row_h, " TOTALE", border=1, fill=True, align="L")
    pdf.cell(col_w["weight"], row_h, "", border=1, fill=True, align="C")
    pdf.cell(col_w["carbs"], row_h, f"{tot_carbs:.1f}", border=1, fill=True, align="C")
    pdf.cell(col_w["fats"], row_h, f"{tot_fats:.1f}", border=1, fill=True, align="C")
    pdf.cell(col_w["prot"], row_h, f"{tot_prot:.1f}", border=1, fill=True, align="C")
    pdf.cell(col_w["kcal"], row_h, f"{tot_kcal:.0f}", border=1, fill=True, align="C")
    pdf.ln(8)


def generate_pdf():
    """Genera il PDF completo delle giornate tipo."""
    if not os.path.exists(INPUT_FILE):
        print(f"File non trovato: {INPUT_FILE}")
        return

    plans = load_plans(INPUT_FILE)
    if not plans:
        print("Nessuna giornata tipo trovata.")
        return

    font_path = get_unicode_font_path()
    pdf = DietPDF(font_path=font_path, orientation="P", unit="mm", format="A4")
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Raggruppa per persona (parte dopo il trattino nel nome)
    groups = {}
    for plan in plans:
        name = plan["name"]
        # Estrai il nome della persona dalla parte finale (es. "A1-Alessio" -> "Alessio")
        parts = name.rsplit("-", 1)
        person = parts[-1] if len(parts) > 1 else "Altro"
        if person not in groups:
            groups[person] = []
        groups[person].append(plan)

    first_group = True
    for person, person_plans in groups.items():
        # Separatore tra persone (nuova pagina)
        if not first_group:
            pdf.add_page()
        first_group = False

        pdf.set_font(pdf._font("B"), "B", 13)
        pdf.set_text_color(30, 100, 180)
        pdf.cell(0, 10, f">> {person}", new_x="LMARGIN", new_y="NEXT")
        pdf.set_draw_color(30, 100, 180)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + 50, pdf.get_y())
        pdf.ln(4)

        for plan in person_plans:
            draw_plan_table(pdf, plan)

    pdf.output(OUTPUT_FILE)
    print(f"PDF generato: {OUTPUT_FILE}")


if __name__ == "__main__":
    generate_pdf()
