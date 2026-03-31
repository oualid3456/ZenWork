import React, { useState } from 'react';
import './Ressources.css';
import RessourceDetail from './RessourceDetail.jsx'; // C'EST CETTE LIGNE QUI MANQUAIT !

const Ressources = () => {
  const [filter, setFilter] = useState('Tous');
  const [selectedRessource, setSelectedRessource] = useState(null); // Gère quelle vidéo est ouverte

  // LA BASE DE DONNÉES
  const ressourcesData = [
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
    },
    { 
      id: 3, 
      title: "Méditation express pour se recentrer", 
      type: "video", 
      category: "Méditation", 
      duration: "5 min", 
      author: "Delphine Morin", 
      color: "#FFA043",
      image: "https://img.youtube.com/vi/tWcu6AlDu6I/hqdefault.jpg",
      embedUrl: "https://www.youtube.com/embed/tWcu6AlDu6I"
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
      contenuText: "La concentration est comme un muscle, elle s'entraîne.\n\nAu bureau, les distractions sont nombreuses (notifications, bruits, collègues). Pour retrouver le focus, essayez la méthode Pomodoro : 25 minutes de travail intense, 5 minutes de pause.\n\nÉloignez votre téléphone et buvez de l'eau régulièrement. Pensez également à aérer votre espace de travail."
    },
  ];

  const categories = ['Tous', 'Méditation', 'Sport', 'Mental', 'Sommeil'];

  const filteredRessources = filter === 'Tous' 
    ? ressourcesData 
    : ressourcesData.filter(r => r.category === filter);

  // SI UNE RESSOURCE EST SÉLECTIONNÉE -> ON AFFICHE LE LECTEUR
  if (selectedRessource) {
    return (
      <RessourceDetail 
        ressource={selectedRessource} 
        onBack={() => setSelectedRessource(null)} // La fonction pour revenir en arrière
      />
    );
  }

  // SINON -> ON AFFICHE LA GRILLE
  return (
    <div className="ressources-internal-container">
      
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

      <div className="resources-grid-section">
        <h2 className="section-title">Recommandé pour vous</h2>
        <div className="video-grid">
          
          {filteredRessources.map(ressource => (
            <div key={ressource.id} className="video-card">
              
              <div 
                className="video-thumb" 
                style={{ 
                  background: `url(${ressource.image}) center/cover`,
                  backgroundColor: ressource.color 
                }}
              >
                <div className="play-overlay">
                  {ressource.type === 'video' && "▶"}
                  {ressource.type === 'article' && "📖"}
                </div>
              </div>
              
              <div className="video-body">
                <span className="cat-label">
                  {ressource.category} • {ressource.type === 'video' ? 'Vidéo' : 'Texte'}
                </span>
                
                <h3>{ressource.title}</h3>
                
                <p>
                  {ressource.type === 'video' ? 'Par ' : 'Source : '} 
                  {ressource.author} • {ressource.duration}
                </p>
                
                <button 
                  className="start-btn" 
                  onClick={() => setSelectedRessource(ressource)} // Change l'état ici !
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