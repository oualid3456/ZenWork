import React, { useState, useEffect, cloneElement } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Profile from "../Profile/Profile.jsx";
import EmployeesList from "../Employees/EmployeesList.jsx";
import RhSecuredRoute from "../RhSecuredRoute.jsx";
import Loading from "../Loading/Loading.jsx";
import "./Layout.css";

const TAB_DASHBOARD = "dashboard";
const TAB_RESSOURCE = "ressource";
const TAB_EMPLOYEES = "employees";
const TAB_PARAMETRES = "parametres";
const TAB_FORUM = "forum";

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
    navigate(`/profile/${user.id}`);
  };

  const fullName =
    profile?.prenom || profile?.nom
      ? [profile?.prenom, profile?.nom].filter(Boolean).join(" ")
      : "Utilisateur";

  return (
    <div className="profile-popup-overlay" onClick={onClose}>
      <div className="profile-popup" onClick={(e) => e.stopPropagation()}>
        <div className="profile-popup-header">
          <strong>{fullName}</strong>
          <p>{user?.email ?? ""}</p>
          {profile?.role && <span className="profile-role">{profile.role}</span>}
        </div>

        <div className="profile-popup-actions">
          <button onClick={handleSettings}>Paramètres</button>
          <button onClick={handleLogout}>Déconnexion</button>
        </div>
      </div>
    </div>
  );
}

function DashboardHomeContent({ profile }) {
  const greetingName =
    profile?.prenom || profile?.nom || "Utilisateur";

  return (
    <section className="dashboard-main-card">
      <h2>Bonjour, {greetingName} ! 👋</h2>
      <p>Bienvenue sur votre espace ZenWork.</p>

      <div className="dashboard-info-grid">
        <div className="dashboard-info-card">
          <h3>RH</h3>
          <p>Accédez aux outils de gestion et au suivi des collaborateurs.</p>
        </div>

        <div className="dashboard-info-card">
          <h3>Bien-être</h3>
          <p>Consultez les espaces d’échange et les ressources internes.</p>
        </div>

        <div className="dashboard-info-card">
          <h3>IA</h3>
          <p>Retrouvez les fonctionnalités intelligentes de la plateforme.</p>
        </div>
      </div>
    </section>
  );
}

function RessourceContent() {
  return (
    <section className="dashboard-main-card">
      <h2>Ressources</h2>
      <p>Consultez les ressources internes mises à disposition.</p>
    </section>
  );
}

export default function DashboardLayout({ user, children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(TAB_DASHBOARD);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    if (pathname.includes("/employees")) setTab(TAB_EMPLOYEES);
    else if (pathname.includes("/profile")) setTab(TAB_PARAMETRES);
    else if (pathname.includes("/forum")) setTab(TAB_FORUM);
    else if (pathname.includes("/ressource")) setTab(TAB_RESSOURCE);
    else if (pathname.includes("/dashboard")) setTab(TAB_DASHBOARD);
    else setTab(TAB_DASHBOARD);
  }, [pathname]);

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

  const greetingName =
    profile?.prenom || profile?.nom || "Utilisateur";

  const isRH = String(profile?.role || "").toLowerCase() === "rh";

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo" onClick={() => navigate(`/dashboard`)}>
          <strong>Logo ZenWork</strong>
        </div>

        <nav className="dashboard-nav">
          <NavLink
            to="/dashboard"
            className={tab === TAB_DASHBOARD ? "active" : ""}
            onClick={() => setTab(TAB_DASHBOARD)}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/ressource"
            className={tab === TAB_RESSOURCE ? "active" : ""}
            onClick={() => setTab(TAB_RESSOURCE)}
          >
            Ressources
          </NavLink>

          <NavLink
            to={`/forum/${user.id}`}
            className={tab === TAB_FORUM ? "active" : ""}
            onClick={() => setTab(TAB_FORUM)}
          >
            Forum
          </NavLink>

          {isRH && (
            <NavLink
              to="/employees"
              className={tab === TAB_EMPLOYEES ? "active" : ""}
              onClick={() => setTab(TAB_EMPLOYEES)}
            >
              Employés
            </NavLink>
          )}

          <NavLink
            to={`/profile/${user.id}`}
            className={tab === TAB_PARAMETRES ? "active" : ""}
            onClick={() => setTab(TAB_PARAMETRES)}
          >
            Paramètres
          </NavLink>
        </nav>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <div>
            <h1>Bonjour, {greetingName} ! 👋</h1>
            <p>
              {profile?.role ? profile.role : "Utilisateur"} · Plateforme ZenWork
            </p>
          </div>

          <div className="dashboard-topbar-actions">
            <button type="button" aria-label="Recherche">
              🔍
            </button>
            <button type="button" aria-label="Notifications">
              Notification
            </button>
            <button
              type="button"
              aria-label="Profil"
              onClick={() => setPopupOpen(true)}
            >
              Profil
            </button>
          </div>
        </header>

        <main className="dashboard-main">
          {tab === TAB_DASHBOARD && <DashboardHomeContent profile={profile} />}

          {tab === TAB_RESSOURCE && <RessourceContent />}

          {tab === TAB_FORUM &&
            (children ? cloneElement(children, { user, embedded: true }) : null)}

          {tab === TAB_EMPLOYEES &&
            isRH &&
            (children ? (
              <RhSecuredRoute>
                {cloneElement(children, { user, embedded: true })}
              </RhSecuredRoute>
            ) : (
              <RhSecuredRoute>
                <EmployeesList user={user} embedded />
              </RhSecuredRoute>
            ))}

          {tab === TAB_PARAMETRES &&
            (children ? (
              cloneElement(children, { user, embedded: true })
            ) : (
              <Profile user={user} embedded />
            ))}
        </main>
      </div>

      {popupOpen && (
        <ProfilePopup
          user={user}
          profile={profile}
          onClose={() => setPopupOpen(false)}
          onOpenSettings={() => {
            setTab(TAB_PARAMETRES);
          }}
        />
      )}
    </div>
  );
}