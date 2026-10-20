# Diet Diary

Una webapp locale per gestire il tuo diario dietetico. Permette di aggiungere alimenti, modificarli e creare una giornata tipo per tracciare macronutrienti e calorie.

## Requisiti

- Node.js (per il frontend)
- Python 3 (per il backend)

## Come Avviare l'Applicazione

Apri due finestre del terminale per avviare sia il backend che il frontend.

### 1. Avviare il Backend (FastAPI)

Nel primo terminale, spostati nella cartella `backend` ed esegui:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```
(Il database verrà automaticamente creato in `database.txt` nella cartella principale quando aggiungerai il primo alimento).

### 2. Avviare il Frontend (React Vite)

Nel secondo terminale, spostati nella cartella `frontend` ed esegui:

```bash
cd frontend
npm run dev
```

Apri il browser all'indirizzo mostrato nel terminale (solitamente `http://localhost:5173`) per usare l'applicazione!
