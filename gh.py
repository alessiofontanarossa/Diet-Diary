"""
Script per aggiornare automaticamente la repo GitHub.
Rigenera il PDF delle giornate tipo prima di committare e pushare.
"""

import subprocess
import sys
import os
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

def run(cmd, **kwargs):
    """Esegue un comando e ne verifica il successo."""
    result = subprocess.run(cmd, cwd=ROOT_DIR, **kwargs)
    if result.returncode != 0:
        print(f"❌ Errore nel comando: {' '.join(cmd)}")
        sys.exit(1)
    return result

# 1. Rigenera il PDF delle giornate tipo
print("📄 Generazione PDF giornate tipo...")
run([
    sys.executable,
    os.path.join(ROOT_DIR, "genera_pdf.py")
])

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
