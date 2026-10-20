import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, Plus, Trash2, FilePlus, GripVertical } from 'lucide-react';

export default function DailyPlan({ editPlanData, clearEditPlan }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [weight, setWeight] = useState('');
  const [dailyFoods, setDailyFoods] = useState([]);
  const [planName, setPlanName] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);
  const [originalPlanName, setOriginalPlanName] = useState(null);
  const [draggedIdx, setDraggedIdx] = useState(null);

  useEffect(() => {
    if (editPlanData) {
      setDailyFoods(editPlanData.items || []);
      setPlanName(editPlanData.name || '');
      setOriginalPlanName(editPlanData.name || '');
    } else {
      setDailyFoods([]);
      setPlanName('');
      setOriginalPlanName(null);
    }
    setSaveStatus(null);
  }, [editPlanData]);

  const handleNew = () => {
    clearEditPlan();
  };

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
    setSelectedFood(food);
    setQuery('');
    setResults([]);
  };

  const handleAdd = () => {
    if (!selectedFood || !weight || parseFloat(weight) <= 0) return;
    setDailyFoods([...dailyFoods, { food: selectedFood, weight: parseFloat(weight) }]);
    setSelectedFood(null);
    setWeight('');
  };

  const handleRemove = (idx) => {
    const updated = [...dailyFoods];
    updated.splice(idx, 1);
    setDailyFoods(updated);
  };

  const handleWeightChange = (idx, val) => {
    const newWeight = parseFloat(val);
    const updated = [...dailyFoods];
    updated[idx].weight = isNaN(newWeight) ? '' : newWeight;
    setDailyFoods(updated);
  };

  const handleDragStart = (idx) => setDraggedIdx(idx);
  const handleDragEnter = (idx) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const items = [...dailyFoods];
    const draggedItem = items[draggedIdx];
    items.splice(draggedIdx, 1);
    items.splice(idx, 0, draggedItem);
    setDraggedIdx(idx);
    setDailyFoods(items);
  };
  const handleDragEnd = () => setDraggedIdx(null);

  const totals = useMemo(() => {
    let carbs = 0, proteins = 0, fats = 0, salt = 0, fiber = 0, calories = 0;
    dailyFoods.forEach(item => {
      const factor = (item.weight || 0) / 100;
      carbs += item.food.carbs * factor;
      proteins += item.food.proteins * factor;
      fats += item.food.fats * factor;
      salt += item.food.salt * factor;
      fiber += item.food.fiber * factor;
      calories += item.food.calories * factor;
    });
    return { carbs, proteins, fats, salt, fiber, calories };
  }, [dailyFoods]);

  const handleSavePlan = async () => {
    if (!planName.trim() || dailyFoods.length === 0) return;
    const payload = { name: planName, items: dailyFoods };
    try {
      if (originalPlanName) {
        await axios.put(`http://127.0.0.1:8000/plans/${originalPlanName}`, payload);
        setSaveStatus({ type: 'success', msg: 'Giornata aggiornata con successo!' });
        setOriginalPlanName(planName);
      } else {
        await axios.post('http://127.0.0.1:8000/plans', payload);
        setSaveStatus({ type: 'success', msg: 'Giornata salvata con successo!' });
        setOriginalPlanName(planName);
      }
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus({ type: 'error', msg: 'Errore: nome già esistente o problema di rete.' });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>{originalPlanName ? 'Modifica Giornata Tipo' : 'Crea Giornata Tipo'}</h2>
        <button type="button" className="btn" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={handleNew}>
          <FilePlus size={18} /> Nuova
        </button>
      </div>

      <div className="macro-summary">
        <div className="macro-box">
          <div className="label">Calorie Totali</div>
          <div className="value">{Math.round(totals.calories)}</div>
          <div className="label">kcal</div>
        </div>
        <div className="macro-box">
          <div className="label">Carboidrati</div>
          <div className="value">{totals.carbs.toFixed(1)}</div>
          <div className="label">grammi</div>
        </div>
        <div className="macro-box">
          <div className="label">Proteine</div>
          <div className="value">{totals.proteins.toFixed(1)}</div>
          <div className="label">grammi</div>
        </div>
        <div className="macro-box">
          <div className="label">Grassi</div>
          <div className="value">{totals.fats.toFixed(1)}</div>
          <div className="label">grammi</div>
        </div>
      </div>

      <div className="form-group">
        <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
          {!selectedFood ? (
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                className="input"
                type="text"
                placeholder="Cerca alimento da aggiungere..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search size={18} style={{ position: 'absolute', right: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
            </div>
          ) : (
            <>
              <div className="input" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(79, 70, 229, 0.1)', borderColor: 'var(--primary)' }}>
                <span style={{ fontWeight: 500, color: 'var(--primary)' }}>{selectedFood.name}</span>
              </div>
              <input
                className="input"
                type="number"
                placeholder="Grammi"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                style={{ width: '120px' }}
                autoFocus
              />
              <button type="button" className="btn" style={{ flex: 'none', width: 'auto', padding: '0 1rem' }} onClick={handleAdd}>
                <Plus size={20} />
              </button>
              <button 
                type="button"
                className="btn" 
                style={{ flex: 'none', width: 'auto', padding: '0 1rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }} 
                onClick={() => setSelectedFood(null)}
              >
                Annulla
              </button>
            </>
          )}
        </div>
      </div>

      {results.length > 0 && !selectedFood && (
        <div className="search-results">
          {results.map((food, idx) => (
            <div key={idx} className="search-item" onClick={() => handleSelect(food)}>
              <span>{food.name}</span>
              <span className="macros-pill">{food.calories} kcal / 100g</span>
            </div>
          ))}
        </div>
      )}

      {dailyFoods.length > 0 && (
        <div className="food-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Alimenti Consumati</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="input"
                type="text"
                placeholder="Nome giornata..."
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSavePlan();
                  }
                }}
                style={{ width: '200px', padding: '0.5rem' }}
              />
              <button type="button" className="btn" style={{ padding: '0.5rem 1rem' }} onClick={handleSavePlan} disabled={!planName.trim()}>
                Salva
              </button>
            </div>
          </div>

          {saveStatus && (
            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', background: saveStatus.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: saveStatus.type === 'success' ? 'var(--accent-success)' : 'var(--accent-error)', fontSize: '0.9rem' }}>
              {saveStatus.msg}
            </div>
          )}

          <div style={{ background: 'var(--bg-color)', borderRadius: '0.75rem', border: `1px solid var(--border)` }}>
            {dailyFoods.map((item, idx) => (
              <div 
                key={`${item.food.name}-${idx}`} 
                className="food-row"
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                style={{ opacity: draggedIdx === idx ? 0.5 : 1 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button 
                    type="button"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'grab', padding: '0.25rem' }}
                    title="Trascina"
                  >
                    <GripVertical size={16} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleRemove(idx)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-error)', cursor: 'pointer', padding: '0.25rem' }}
                    title="Rimuovi"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div>
                    <div className="food-row-name">{item.food.name}</div>
                    <div className="food-row-details">
                      <input
                        type="number"
                        value={item.weight}
                        onChange={(e) => handleWeightChange(idx, e.target.value)}
                        style={{
                          background: 'transparent', border: 'none', borderBottom: '1px dashed var(--primary)', 
                          color: 'var(--text-muted)', width: '50px', fontSize: 'inherit', 
                          outline: 'none', cursor: 'text'
                        }}
                      /> g
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{Math.round(item.food.calories * (item.weight || 0) / 100)} kcal</div>
                  <div className="food-row-details">
                    C: {(item.food.carbs * (item.weight || 0) / 100).toFixed(1)}g | 
                    P: {(item.food.proteins * (item.weight || 0) / 100).toFixed(1)}g | 
                    G: {(item.food.fats * (item.weight || 0) / 100).toFixed(1)}g
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
