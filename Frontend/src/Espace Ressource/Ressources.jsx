import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Profile from "../Profile/Profile.jsx";
import EmployeesList from "../Employees/EmployeesList.jsx";
import RhSecuredRoute from "../RhSecuredRoute.jsx";
import Loading from "../Loading/Loading.jsx";
import "./Ressources.css";

const TAB_RESSOURCE = "ressource";
const TAB_EMPLOYEES = "employees";
const TAB_PARAMETRES = "parametres";

function ProfilePopup({ user, profile, onClose, onOpenSettings }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    navigate("/");
  };

  const handleSettings = () => {
    onClose();
    onOpenSettings();
  };

  return (
    <div className="profile-popup-overlay" onClick={onClose}>
      <div className="profile-popup" onClick={(e) => e.stopPropagation()}>
        <div className="profile-popup-header">
          <div className="profile-popup-avatar" />
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

const Ressources = ({ user }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(TAB_RESSOURCE);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nom, prenom, role")
        .eq("id", user.id)
        .single();
      setProfile(data || null);
      setLoading(false);
    })();
  }, [user?.id]);

  const greetingName = profile?.prenom || profile?.nom || "Utilisateur";
  const isRH = profile?.role === "RH";

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/zenwork-dessin.png" alt="Logo" className="sidebar-logo-img" />
          <span className="sidebar-logo-text">ZenWork</span>
        </div>
        <nav className="menu">
          <button
            type="button"
            className={`menu-item ${tab === TAB_RESSOURCE ? "active" : ""}`}
            onClick={() => setTab(TAB_RESSOURCE)}
          >
            <img src="/tableau-de-bord.png" alt="Dashboard" className="sidebar-icon-img" />
            <span className="label">Dashboard</span>
          </button>
          <button
            type="button"
            className={`menu-item ${tab === TAB_RESSOURCE ? "active" : ""}`}
            onClick={() => setTab(TAB_RESSOURCE)}
          >
            <img src="/ressource.png" alt="Ressources" className="sidebar-icon-img" />
            <span className="label">Ressources</span>
          </button>
          {isRH && (
            <button
              type="button"
              className={`menu-item ${tab === TAB_EMPLOYEES ? "active" : ""}`}
              onClick={() => setTab(TAB_EMPLOYEES)}
            >
              <img src="/parametre.png" alt="Employés" className="sidebar-icon-img" />
              <span className="label">Employés</span>
            </button>
          )}
          <button type="button" className="menu-item">
            <img src="/bot.png" alt="Psychobot" className="sidebar-icon-img" />
            <span className="label">Psychobot</span>
          </button>
          <button
            type="button"
            className={`menu-item ${tab === TAB_PARAMETRES ? "active" : ""}`}
            onClick={() => setTab(TAB_PARAMETRES)}
          >
            <img src="/parametre.png" alt="Paramètres" className="sidebar-icon-img" />
            <span className="label">Paramètres</span>
          </button>
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
              <div className="user-avatar" />
            </button>
          </div>
        </header>
        <div className="ressources-content">
          {tab === TAB_RESSOURCE && (
            <div className="ressources-placeholder">
              {/* Contenu Dashboard / Ressources */}
            </div>
          )}
          {tab === TAB_EMPLOYEES && isRH && (
            <RhSecuredRoute user={user}>
              <EmployeesList user={user} embedded />
            </RhSecuredRoute>
          )}
          {tab === TAB_PARAMETRES && <Profile user={user} embedded />}
        </div>
      </main>
      {popupOpen && (
        <ProfilePopup
          user={user}
          profile={profile}
          onClose={() => setPopupOpen(false)}
          onOpenSettings={() => setTab(TAB_PARAMETRES)}
        />
      )}
    </div>
  );
};

export default Ressources;
