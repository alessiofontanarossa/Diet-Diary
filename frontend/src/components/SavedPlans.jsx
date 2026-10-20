import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarCheck, Trash2, Copy, Edit2, RefreshCcw, Download } from 'lucide-react';

export default function SavedPlans({ onEditPlan }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/plans');
      setPlans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = async (planName) => {
    if (!window.confirm(`Sei sicuro di eliminare la giornata "${planName}"?`)) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/plans/${planName}`);
      setPlans(plans.filter(p => p.name !== planName));
    } catch (err) {
      console.error(err);
      alert('Errore eliminazione');
    }
  };

  const handleDuplicate = async (plan) => {
    const newName = window.prompt('Inserisci il nuovo nome per la giornata tipo:', plan.name + ' (Copia)');
    if (!newName || newName === plan.name) return;
    try {
      await axios.post('http://127.0.0.1:8000/plans', { name: newName, items: plan.items });
      fetchPlans();
    } catch (err) {
      console.error(err);
      alert('Errore: nome già esistente o impossibile duplicare.');
    }
  };

  const handleExport = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/plans/export');
      alert(`Esportato con successo in: ${res.data.path}`);
    } catch (err) {
      console.error(err);
      alert('Errore esportazione');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Caricamento...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarCheck size={24} color="var(--primary)" />
          <h2 style={{ margin: 0 }}>Giornate Tipo Salvate</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={fetchPlans} title="Aggiorna">
            <RefreshCcw size={18} />
          </button>
          <button className="btn" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={handleExport} title="Esporta in file">
            <Download size={18} /> Esporta
          </button>
        </div>
      </div>

      {plans.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Nessuna giornata tipo salvata.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {plans.map((plan, idx) => {
            let tKcal = 0, tC = 0, tP = 0, tF = 0;
            plan.items.forEach(item => {
              const factor = item.weight / 100;
              tKcal += item.food.calories * factor;
              tC += item.food.carbs * factor;
              tP += item.food.proteins * factor;
              tF += item.food.fats * factor;
            });

            return (
              <div key={idx} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{plan.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>{Math.round(tKcal)} kcal</strong> | C: {tC.toFixed(1)}g | P: {tP.toFixed(1)}g | G: {tF.toFixed(1)}g
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {plan.items.map(i => `${i.food.name} (${i.weight}g)`).join(', ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => handleDuplicate(plan)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-warning)', cursor: 'pointer', padding: '0.25rem' }} title="Duplica">
                    <Copy size={20} />
                  </button>
                  <button type="button" onClick={() => onEditPlan(plan)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.25rem' }} title="Modifica">
                    <Edit2 size={20} />
                  </button>
                  <button type="button" onClick={() => handleDelete(plan.name)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-error)', cursor: 'pointer', padding: '0.25rem' }} title="Elimina">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
