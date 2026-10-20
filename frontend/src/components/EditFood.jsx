import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';

export default function EditFood() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/foods/search?q=${query}`);
        setResults(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (food) => {
    setSelectedFood({ ...food, originalName: food.name });
    setQuery('');
    setResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://127.0.0.1:8000/foods/${selectedFood.originalName}`, {
        name: selectedFood.name,
        carbs: parseFloat(selectedFood.carbs),
        fats: parseFloat(selectedFood.fats),
        proteins: parseFloat(selectedFood.proteins),
        salt: parseFloat(selectedFood.salt) || 0,
        fiber: parseFloat(selectedFood.fiber) || 0
      });
      setStatus({ type: 'success', msg: 'Alimento modificato con successo!' });
      setTimeout(() => { setStatus(null); setSelectedFood(null); }, 2000);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Errore durante la modifica' });
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Modifica Alimento</h2>
      
      {!selectedFood ? (
        <>
          <div className="form-group" style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Cerca alimento da modificare..." 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
            />
            <Search size={18} style={{ position: 'absolute', right: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
          </div>
          {results.length > 0 && (
            <div className="search-results">
              {results.map((food, idx) => (
                <div key={idx} className="search-item" onClick={() => handleSelect(food)}>
                  <span>{food.name}</span>
                  <span className="macros-pill">{food.calories} kcal / 100g</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button 
            type="button" 
            className="btn" 
            style={{ marginBottom: '1.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }} 
            onClick={() => setSelectedFood(null)}
          >
            Annulla e cerca un altro alimento
          </button>
          
          {status && (
            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', background: status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: status.type === 'success' ? 'var(--accent-success)' : 'var(--accent-error)' }}>
              {status.msg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome dell'alimento</label>
              <input type="text" className="input" required value={selectedFood.name} onChange={e => setSelectedFood({...selectedFood, name: e.target.value})} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Carboidrati (g)</label>
                <input type="number" step="any" min="0" className="input" required value={selectedFood.carbs} onChange={e => setSelectedFood({...selectedFood, carbs: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Grassi (g)</label>
                <input type="number" step="any" min="0" className="input" required value={selectedFood.fats} onChange={e => setSelectedFood({...selectedFood, fats: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Proteine (g)</label>
                <input type="number" step="any" min="0" className="input" required value={selectedFood.proteins} onChange={e => setSelectedFood({...selectedFood, proteins: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Sale (g)</label>
                <input type="number" step="any" min="0" className="input" value={selectedFood.salt} onChange={e => setSelectedFood({...selectedFood, salt: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Fibre (g)</label>
                <input type="number" step="any" min="0" className="input" value={selectedFood.fiber} onChange={e => setSelectedFood({...selectedFood, fiber: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Aggiorna Alimento</button>
          </form>
        </>
      )}
    </div>
  );
}
