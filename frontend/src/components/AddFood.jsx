import React, { useState } from 'react';
import axios from 'axios';

export default function AddFood() {
  const [formData, setFormData] = useState({
    name: '',
    carbs: '',
    fats: '',
    proteins: '',
    salt: 0,
    fiber: 0
  });
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/foods', {
        name: formData.name,
        carbs: parseFloat(formData.carbs),
        fats: parseFloat(formData.fats),
        proteins: parseFloat(formData.proteins),
        salt: parseFloat(formData.salt) || 0,
        fiber: parseFloat(formData.fiber) || 0
      });
      setStatus({ type: 'success', msg: 'Alimento salvato con successo!' });
      setFormData({ name: '', carbs: '', fats: '', proteins: '', salt: 0, fiber: 0 });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Errore! Alimento già presente o dati non validi.' });
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Aggiungi Nuovo Alimento (per 100g)</h2>
      {status && (
        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', background: status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: status.type === 'success' ? 'var(--accent-success)' : 'var(--accent-error)' }}>
          {status.msg}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome dell'alimento</label>
          <input type="text" className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>Carboidrati (g)</label>
            <input type="number" step="any" min="0" className="input" required value={formData.carbs} onChange={e => setFormData({...formData, carbs: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Grassi (g)</label>
            <input type="number" step="any" min="0" className="input" required value={formData.fats} onChange={e => setFormData({...formData, fats: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Proteine (g)</label>
            <input type="number" step="any" min="0" className="input" required value={formData.proteins} onChange={e => setFormData({...formData, proteins: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Sale (g) - Opzionale</label>
            <input type="number" step="any" min="0" className="input" value={formData.salt} onChange={e => setFormData({...formData, salt: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Fibre (g) - Opzionale</label>
            <input type="number" step="any" min="0" className="input" value={formData.fiber} onChange={e => setFormData({...formData, fiber: e.target.value})} />
          </div>
        </div>
        <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Salva Alimento</button>
      </form>
    </div>
  );
}
