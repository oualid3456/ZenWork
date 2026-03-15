import React, { useState } from 'react';
import './Ressources.css';

const Ressources = () => {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
            <img src="/zenwork-dessin.png" alt="Logo" className="sidebar-logo-img" />
            <span className="sidebar-logo-text">ZenWork</span>
        </div>
        <nav className="menu">
          <div className="menu-item">
            <img src="/tableau-de-bord.png" alt="Home" className="sidebar-icon-img" />
            <span className="label">Dashboard</span>
          </div>
          <div className="menu-item active">
            <img src="/ressource.png" alt="Ressources" className="sidebar-icon-img" />
            <span className="label">Ressources</span>
          </div>
          <div className="menu-item">
            <img src="/bot.png" alt="Psychobot" className="sidebar-icon-img" />
            <span className="label">Psychobot</span>
          </div>
          <div className="menu-item">
            <img src="/parametre.png" alt="Paramètres" className="sidebar-icon-img" />
            <span className="label">Paramètres</span>
          </div>
        </nav>
      </aside>
      <main className="main-content">
        {/* je vais le remplir */}
      </main>
    </div>
  );
};
export default Ressources;