import React, { useEffect, useState, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./Dashboard.css";

function ProfilePopup({ user, profile, onClose }) {
  const navigate = useNavigate();
  const popupRef = useRef(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    navigate("/");
  };

  const handleSettings = () => {
    onClose();
    navigate("/dashboard/profile");
  };

  return (
    <div className="profile-popup-overlay" onClick={onClose}>
      <div
        ref={popupRef}
        className="profile-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-popup-header">
          <div className="profile-popup-avatar"></div>
          <div className="profile-popup-info">
            <span className="profile-popup-name">
              {profile?.prenom || profile?.nom
                ? [profile.prenom, profile.nom].filter(Boolean).join(" ")
                : "Utilisateur"}
            </span>
            <span className="profile-popup-email">{user?.email ?? ""}</span>
            {profile?.role && (
              <span className="profile-popup-role">{profile.role}</span>
            )}
          </div>
        </div>
        <div className="profile-popup-actions">
          <button type="button" className="profile-popup-btn" onClick={handleSettings}>
            <img src="/parametre.png" alt="" className="profile-popup-btn-icon" />
            Paramètres
          </button>
          <button type="button" className="profile-popup-btn profile-popup-btn-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ user }) {
  const [profile, setProfile] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nom, prenom, role")
        .eq("id", user.id)
        .single();
      setProfile(data || null);
    })();
  }, [user?.id]);

  const greetingName = profile?.prenom || profile?.nom || "Utilisateur";

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/zenwork-dessin.png" alt="Logo" className="sidebar-logo-img" />
          <span className="sidebar-logo-text">ZenWork</span>
        </div>
        <nav className="menu">
          <NavLink to="/dashboard/ressource" className={({ isActive }) => "menu-item" + (isActive ? " active" : "")} end>
            <img src="/tableau-de-bord.png" alt="Dashboard" className="sidebar-icon-img" />
            <span className="label">Dashboard</span>
          </NavLink>
          <NavLink to="/dashboard/ressource" className={({ isActive }) => "menu-item" + (isActive ? " active" : "")}>
            <img src="/ressource.png" alt="Ressources" className="sidebar-icon-img" />
            <span className="label">Ressources</span>
          </NavLink>
          {profile?.role === "RH" && (
            <NavLink to="/dashboard/employees" className={({ isActive }) => "menu-item" + (isActive ? " active" : "")}>
              <img src="/parametre.png" alt="Employés" className="sidebar-icon-img" />
              <span className="label">Employés</span>
            </NavLink>
          )}
          <NavLink to="/dashboard/ressource" className="menu-item">
            <img src="/bot.png" alt="Psychobot" className="sidebar-icon-img" />
            <span className="label">Psychobot</span>
          </NavLink>
          <NavLink to="/dashboard/profile" className={({ isActive }) => "menu-item" + (isActive ? " active" : "")}>
            <img src="/parametre.png" alt="Paramètres" className="sidebar-icon-img" />
            <span className="label">Paramètres</span>
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <header className="floating-topbar">
          <div className="topbar-left">
            <div className="welcome-text">
              <span className="user-greeting">Bonjour, {greetingName} ! 👋</span>
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
            <button
              type="button"
              className="user-avatar-btn"
              onClick={() => setPopupOpen(true)}
              aria-label="Profil"
            >
              <div className="user-avatar"></div>
            </button>
          </div>
        </header>
        <div className="dashboard-outlet">
          <Outlet context={{ user, profile }} />
        </div>
      </main>
      {popupOpen && (
        <ProfilePopup
          user={user}
          profile={profile}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </div>
  );
}
