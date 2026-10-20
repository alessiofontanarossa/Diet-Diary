"""
Script per aggiornare automaticamente la repo GitHub.
Rigenera il PDF delle giornate tipo prima di committare e pushare.

Uso: python gh.py  (da qualsiasi Python, non serve attivare il venv)
"""

import subprocess
import sys
import os
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
VENV_PYTHON = os.path.join(ROOT_DIR, "backend", "venv", "bin", "python")


def run(cmd, **kwargs):
    """Esegue un comando e ne verifica il successo."""
    result = subprocess.run(cmd, cwd=ROOT_DIR, **kwargs)
    if result.returncode != 0:
        print(f"❌ Errore nel comando: {' '.join(cmd)}")
        sys.exit(1)
    return result


# Determina quale Python usare per genera_pdf.py
# Usa il venv se esiste, altrimenti il Python corrente
python_exe = VENV_PYTHON if os.path.exists(VENV_PYTHON) else sys.executable

# 1. Rigenera il PDF delle giornate tipo
print("📄 Generazione PDF giornate tipo...")
run([python_exe, os.path.join(ROOT_DIR, "genera_pdf.py")])

# 2. Git add, commit, push
print("\n📦 Aggiornamento repository GitHub...")
run(["git", "add", "."])

# Verifica se ci sono modifiche da committare
status = subprocess.run(
    ["git", "diff", "--cached", "--quiet"],
    cwd=ROOT_DIR
)
if status.returncode == 0:
    print("ℹ️  Nessuna modifica da committare.")
else:
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    run(["git", "commit", "-m", f"Update {date_str}"])
    run(["git", "push"])
    print(f"\n✅ Update completato: {date_str}")
