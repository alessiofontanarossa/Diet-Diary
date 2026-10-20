import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database as DbIcon, Search, Trash2, RefreshCcw } from 'lucide-react';

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function computeSearchScore(query, name) {
  const q = query.toLowerCase();
  const n = name.toLowerCase();
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;
  return 3 + levenshtein(q, n);
}

export default function Database() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/foods');
      setFoods(res.data);
    } catch (err) {
      console.error("Error fetching foods:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const filteredFoods = search.trim() === '' 
    ? foods 
    : [...foods].sort((a, b) => {
        const distA = computeSearchScore(search, a.name);
        const distB = computeSearchScore(search, b.name);
        return distA - distB;
      });

  const handleDelete = async (foodName) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'alimento: ${foodName}?`)) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/foods/${foodName}`);
      setFoods(foods.filter(f => f.name !== foodName));
    } catch (err) {
      console.error("Error deleting food:", err);
      alert("Errore durante l'eliminazione.");
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Caricamento database in corso...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DbIcon size={24} color="var(--primary)" />
          <h2 style={{ margin: 0 }}>Database Alimenti</h2>
        </div>
        <button className="btn" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={fetchFoods} title="Aggiorna">
          <RefreshCcw size={18} /> Aggiorna
        </button>
      </div>

      <div className="form-group">
        <div style={{ position: 'relative' }}>
          <input
            className="input"
            type="text"
            placeholder="Cerca per nome alimento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={18} style={{ position: 'absolute', right: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
        </div>
      </div>
      
      {foods.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Il database è vuoto. Aggiungi il tuo primo alimento!</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="db-table">
            <thead>
              <tr>
                <th>Nome Alimento</th>
                <th>Calorie</th>
                <th>Carbo</th>
                <th>Proteine</th>
                <th>Grassi</th>
                <th>Fibre</th>
                <th>Sale</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredFoods.map((food, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{food.name}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{food.calories} kcal</td>
                  <td>{food.carbs} g</td>
                  <td>{food.proteins} g</td>
                  <td>{food.fats} g</td>
                  <td>{food.fiber} g</td>
                  <td>{food.salt} g</td>
                  <td>
                    <button 
                      onClick={() => handleDelete(food.name)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-error)', cursor: 'pointer', padding: '0.25rem' }}
                      title="Elimina"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
