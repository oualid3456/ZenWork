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
        <header className="floating-topbar">
            <div className="topbar-left">
              <div className="welcome-text">
                <span className="user-greeting">Bonjour, Utilisateur ! 👋</span>
                <span className="company-name">RH Bien-être IA</span>
              </div>
            </div>
            <div className="topbar-center">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input type="text" placeholder="Rechercher une ressource..." />
              </div>
            </div>
            <div className="topbar-right">
              <img src="/notification.png" alt="Notification" className="sidebar-icon-img" />
              <div className="user-avatar"></div>
            </div>
          </header>
      </main>
    </div>
  );
};
export default Ressources;