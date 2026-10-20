import subprocess
import os
import sys
import time

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, 'backend')
    frontend_dir = os.path.join(root_dir, 'frontend')

    print("🚀 Avvio del backend (FastAPI)...")
    # Usa /bin/bash per permettere l'utilizzo di 'source'
    backend_cmd = "source venv/bin/activate && uvicorn main:app --reload --port 8000"
    
    backend_process = subprocess.Popen(
        backend_cmd,
        cwd=backend_dir,
        shell=True,
        executable='/bin/bash'
    )

    print("🚀 Avvio del frontend (Vite/React)...")
    frontend_cmd = "npm run dev"
    
    frontend_process = subprocess.Popen(
        frontend_cmd,
        cwd=frontend_dir,
        shell=True
    )

    try:
        print("\n=======================================================")
        print("✅ Diet Diary è in fase di avvio!")
        print("🌐 Frontend: http://localhost:5173")
        print("⚙️  Backend:  http://localhost:8000")
        print("Premi [Ctrl+C] qui nel terminale per spegnere tutto.")
        print("=======================================================\n")
        
        # Mantiene in vita lo script principale per poter catturare il Ctrl+C
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Ricevuto segnale di spegnimento. Arresto dei server in corso...")
        
        # Terminiamo i processi
        backend_process.terminate()
        frontend_process.terminate()
        
        # Attendiamo la chiusura
        backend_process.wait()
        frontend_process.wait()
        
        print("✅ Arresto completato. Arrivederci!")
        sys.exit(0)

if __name__ == "__main__":
    main()
