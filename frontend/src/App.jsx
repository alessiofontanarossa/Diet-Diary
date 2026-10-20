import React, { useState } from 'react';
import { PlusCircle, Edit3, Calendar, Database as DbIcon, CalendarCheck } from 'lucide-react';
import AddFood from './components/AddFood';
import EditFood from './components/EditFood';
import DailyPlan from './components/DailyPlan';
import Database from './components/Database';
import SavedPlans from './components/SavedPlans';

function App() {
  const [activeTab, setActiveTab] = useState('add');
  const [editPlanData, setEditPlanData] = useState(null);

  const handleEditPlan = (plan) => {
    setEditPlanData(plan);
    setActiveTab('daily');
  };

  return (
    <div>
      <h1>Diet Diary</h1>
      
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <PlusCircle size={18} />
          Aggiungi Alimento
        </button>
        <button 
          className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          <Edit3 size={18} />
          Modifica Alimento
        </button>
        <button 
          className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          <Calendar size={18} />
          Aggiungi giornata tipo
        </button>
        <button 
          className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <CalendarCheck size={18} />
          Giornate tipo
        </button>
        <button 
          className={`tab-btn ${activeTab === 'db' ? 'active' : ''}`}
          onClick={() => setActiveTab('db')}
        >
          <DbIcon size={18} />
          Database
        </button>
      </div>

      <div className="card">
        <div style={{ display: activeTab === 'add' ? 'block' : 'none' }}>
          <AddFood />
        </div>
        <div style={{ display: activeTab === 'edit' ? 'block' : 'none' }}>
          <EditFood />
        </div>
        <div style={{ display: activeTab === 'daily' ? 'block' : 'none' }}>
          <DailyPlan editPlanData={editPlanData} clearEditPlan={() => setEditPlanData(null)} />
        </div>
        <div style={{ display: activeTab === 'plans' ? 'block' : 'none' }}>
          <SavedPlans onEditPlan={handleEditPlan} />
        </div>
        <div style={{ display: activeTab === 'db' ? 'block' : 'none' }}>
          <Database />
        </div>
      </div>
    </div>
  );
}

export default App;
