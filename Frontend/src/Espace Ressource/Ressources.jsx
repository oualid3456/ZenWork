import React, { useState } from 'react';
import './Ressources.css';

const Ressources = () => {
  const [filter, setFilter] = useState('Tous');

  // 1. LA BASE DE DONNÉES "SANTÉ MENTALE AU TRAVAIL" (Vraies données)
  const ressourcesData = [
    { 
      id: 1, 
      title: "Cohérence Cardiaque (Anti-Stress)", 
      type: "video", 
      category: "Sommeil", // Aide à calmer l'anxiété et favoriser le repos
      duration: "5 min", 
      author: "Dr. David O'Hare", 
      color: "#00C38E",
      image: "https://img.youtube.com/vi/bM3mWlq4mPU/maxresdefault.jpg",
      lien: "https://www.youtube.com/watch?v=bM3mWlq4mPU" 
    },
    { 
      id: 2, 
      title: "Trop de pensées ? L'histoire de la cascade", 
      type: "video", 
      category: "Mental", 
      duration: "3 min", 
      author: "Petit BamBou", 
      color: "#6C5DD3",
      image: "https://img.youtube.com/vi/9E0peXFUC60/maxresdefault.jpg",
      lien: "https://www.youtube.com/watch?v=9E0peXFUC60"
    },
    { 
      id: 3, 
      title: "Méditation express pour se recentrer", 
      type: "video", 
      category: "Méditation", 
      duration: "5 min", 
      author: "Cédric Michel", 
      color: "#FFA043",
      image: "https://img.youtube.com/vi/tWcu6AlDu6I/maxresdefault.jpg",
      lien: "https://www.youtube.com/watch?v=tWcu6AlDu6I"
    },
    { 
      id: 4, 
      title: "7 astuces pour retrouver sa concentration", 
      type: "article", 
      category: "Mental", 
      duration: "4 min de lecture", 
      author: "Welcome To The Jungle", 
      color: "#6C5DD3",
      image: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&auto=format&fit=crop",
      lien: "https://www.welcometothejungle.com/fr/articles/comment-rester-concentre-au-travail"
    },
  ];

  const categories = ['Tous', 'Méditation', 'Sport', 'Mental', 'Sommeil'];

  const filteredRessources = filter === 'Tous' 
    ? ressourcesData 
    : ressourcesData.filter(r => r.category === filter);

  // Fonction pour ouvrir la ressource quand on clique sur le bouton
  const handleOpenRessource = (lien) => {
    window.open(lien, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="ressources-internal-container">
      
      {/* 1. LA BARRE DE FILTRES */}
      <div className="filter-container">
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

      {/* 2. LA GRILLE DE RESSOURCES */}
      <div className="resources-grid-section">
        <h2 className="section-title">Recommandé pour vous</h2>
        <div className="video-grid">
          
          {filteredRessources.map(ressource => (
            <div key={ressource.id} className="video-card">
              
              {/* LA COUVERTURE AVEC L'ICÔNE ADAPTÉE */}
              <div 
                className="video-thumb" 
                style={{ 
                  background: `url(${ressource.image}) center/cover`,
                  backgroundColor: ressource.color // Couleur de secours au cas où
                }}
              >
                <div className="play-overlay">
                  {ressource.type === 'video' && "▶"}
                  {ressource.type === 'document' && "📄"}
                  {ressource.type === 'article' && "📖"}
                </div>
              </div>
              
              {/* LE CORPS DE LA CARTE */}
              <div className="video-body">
                <span className="cat-label">
                  {ressource.category} • {ressource.type === 'video' ? 'Vidéo' : 'Texte'}
                </span>
                
                <h3>{ressource.title}</h3>
                
                <p>
                  {ressource.type === 'video' ? 'Par ' : 'Source : '} 
                  {ressource.author} • {ressource.duration}
                </p>
                
                {/* LE BOUTON CLICABLE */}
                <button 
                  className="start-btn" 
                  onClick={() => handleOpenRessource(ressource.lien)}
                >
                  {ressource.type === 'video' ? 'Démarrer' : 'Lire'}
                </button>
                
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default Ressources;