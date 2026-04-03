import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Ressources.css';
import RessourceDetail from './RessourceDetail.jsx';

const initialData = [
  { 
    id: 1, 
    title: "Cohérence Cardiaque (Anti-Stress)", 
    type: "video", 
    category: "Sommeil", 
    duration: "5 min", 
    author: "Denis Fortier", 
    color: "#00C38E",
    image: "https://img.youtube.com/vi/cHuUs483S4Q/hqdefault.jpg",
    embedUrl: "https://www.youtube.com/embed/cHuUs483S4Q"
  },
  { 
    id: 2, 
    title: "Trop de pensées ? L'histoire de la cascade", 
    type: "video", 
    category: "Mental", 
    duration: "3 min", 
    author: "Petit BamBou", 
    color: "#6C5DD3",
    image: "https://img.youtube.com/vi/9E0peXFUC60/hqdefault.jpg",
    embedUrl: "https://www.youtube.com/embed/9E0peXFUC60"
  }
];

// Les catégories de base
const initialCategories = ['Tous', 'Méditation', 'Sport', 'Mental', 'Sommeil'];

export default function Ressources() {
  const [ressources, setRessources] = useState(initialData);
  // NOUVEAU : On transforme les catégories en variable d'état pour pouvoir en ajouter !
  const [categories, setCategories] = useState(initialCategories);
  
  const [filter, setFilter] = useState('Tous');
  const [selectedRessource, setSelectedRessource] = useState(null);
  
  const [isRH, setIsRH] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', type: 'video', category: '', author: '', duration: '', image: '', embedUrl: '', contenuText: '', color: '#6C5DD3'
  });

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data?.role === 'RH') {
          setIsRH(true);
        }
      }
    };
    checkRole();
  }, []);

  const filteredRessources = filter === 'Tous' 
    ? ressources 
    : ressources.filter(r => r.category === filter);

  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette ressource ?")) {
      setRessources(ressources.filter(r => r.id !== id));
    }
  };

  const openModalForAdd = () => {
    setEditingId(null);
    setFormData({ title: '', type: 'video', category: '', author: '', duration: '', image: '', embedUrl: '', contenuText: '', color: '#6C5DD3' });
    setShowModal(true);
  };

  const openModalForEdit = (ressource) => {
    setEditingId(ressource.id);
    setFormData(ressource);
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    // NOUVEAU : On vérifie si la catégorie tapée est nouvelle. Si oui, on l'ajoute aux filtres !
    const newCategory = formData.category.trim();
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }

    if (editingId) {
      setRessources(ressources.map(r => r.id === editingId ? { ...formData, category: newCategory, id: editingId } : r));
    } else {
      setRessources([...ressources, { ...formData, category: newCategory, id: Date.now() }]);
    }
    setShowModal(false);
  };

  if (selectedRessource) {
    return <RessourceDetail ressource={selectedRessource} onBack={() => setSelectedRessource(null)} />;
  }

  return (
    <div className="ressources-internal-container">
      
      <div className="ressources-header-flex">
        <div className="filter-container">
          {/* Les puces de filtre se mettent à jour automatiquement si on crée une nouvelle catégorie */}
          {categories.map(cat => (
            <button 
              key={cat}
              className={`filter-chip ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {isRH && (
          <button className="add-ressource-btn" onClick={openModalForAdd}>
            + Ajouter une ressource
          </button>
        )}
      </div>

      <div className="resources-grid-section">
        <h2 className="section-title">Recommandé pour vous</h2>
        <div className="video-grid">
          
          {filteredRessources.map(ressource => (
            <div key={ressource.id} className="video-card">
              <div className="video-thumb" style={{ background: `url(${ressource.image}) center/cover`, backgroundColor: ressource.color }}>
                <div className="play-overlay">
                  {ressource.type === 'video' ? "▶" : "📖"}
                </div>
              </div>
              
              <div className="video-body">
                <span className="cat-label">{ressource.category} • {ressource.type === 'video' ? 'Vidéo' : 'Texte'}</span>
                <h3>{ressource.title}</h3>
                <p>{ressource.type === 'video' ? 'Par ' : 'Source : '} {ressource.author} • {ressource.duration}</p>
                
                <button className="start-btn" onClick={() => setSelectedRessource(ressource)}>
                  {ressource.type === 'video' ? 'Démarrer' : 'Lire'}
                </button>

                {isRH && (
                  <div className="rh-actions">
                    <button className="rh-edit-btn" onClick={() => openModalForEdit(ressource)}>Modifier</button>
                    <button className="rh-delete-btn" onClick={() => handleDelete(ressource.id)}>Supprimer</button>
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingId ? "Modifier la ressource" : "Ajouter une ressource"}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Titre</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="video">Vidéo</option>
                    <option value="article">Article</option>
                  </select>
                </div>
                
                {/* L'ASTUCE EST ICI : Le Datalist */}
                <div className="form-group">
                  <label>Catégorie</label>
                  <input 
                    type="text" 
                    list="category-options"
                    placeholder="Choisir ou taper une nouvelle"
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    required 
                  />
                  <datalist id="category-options">
                    {categories.filter(c => c !== 'Tous').map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Auteur / Source</label>
                  <input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Durée (ex: 5 min)</label>
                  <input type="text" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} required />
                </div>
              </div>

              <div className="form-group">
                <label>URL de l'image (Miniature)</label>
                <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} required />
              </div>

              {formData.type === 'video' ? (
                <div className="form-group">
                  <label>URL Embed YouTube</label>
                  <input type="url" placeholder="https://www.youtube.com/embed/..." value={formData.embedUrl} onChange={e => setFormData({...formData, embedUrl: e.target.value})} required />
                </div>
              ) : (
                <div className="form-group">
                  <label>Contenu du texte</label>
                  <textarea rows="4" value={formData.contenuText} onChange={e => setFormData({...formData, contenuText: e.target.value})} required />
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="save-btn">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}