import React, { useState, useEffect, cloneElement } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Profile from "../Profile/Profile.jsx";
import EmployeesList from "../Employees/EmployeesList.jsx";
import RhSecuredRoute from "../RhSecuredRoute.jsx";
import Loading from "../Loading/Loading.jsx";
import ForumHome from "../Forum/ForumHome.jsx"; 
import DashboardOverview from "../Dashboard/DashboardOverview.jsx";
import "./Layout.css";
import PsychoBot from "../Psychobot/Psychobot.jsx";

const TAB_PSYCHOBOT = "psychobot";
const TAB_DASHBOARD = "dashboard";
const TAB_RESSOURCE = "ressource";
const TAB_EMPLOYEES = "employees";
const TAB_PARAMETRES = "parametres";
const TAB_FORUM = "forum";

function PopupProfil({ user, profile, onFermer, onOuvrirParametres }) {
  const navigate = useNavigate();

  const deconnecter = async () => {
    await supabase.auth.signOut();
    onFermer();
    navigate("/");
  };

  const ouvrirParametres = () => {
    onFermer();
    onOuvrirParametres();
    navigate(`/profile/${user.id}`);
  };

  return (
    <div className="profile-popup-overlay" onClick={onFermer}>
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
          <button
            type="button"
            className="profile-popup-btn"
            onClick={ouvrirParametres}
          >
            <img src="/parametre.png" alt="" className="profile-popup-btn-icon" />
            Paramètres
          </button>
          <button
            type="button"
            className="profile-popup-btn profile-popup-btn-logout"
            onClick={deconnecter}
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}

function formaterDateNotification(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function PopupNotifications({ user, onFermer }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError(null);
      if (!user?.id) {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, title, body, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (cancelled) return;
      if (error) {
        setFetchError(error.message);
        setItems([]);
      } else {
        setItems(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="notification-popup-overlay" onClick={onFermer}>
      <div
        className="notification-popup"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Notifications"
      >
        <div className="notification-popup-header">
          <h2 className="notification-popup-title">Notifications</h2>
          <button
            type="button"
            className="notification-popup-close"
            onClick={onFermer}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div className="notification-popup-body">
          {loading && (
            <p className="notification-popup-status">Chargement…</p>
          )}
          {!loading && fetchError && (
            <p className="notification-popup-status notification-popup-error">
              {fetchError}
            </p>
          )}
          {!loading && !fetchError && items?.length === 0 && (
            <p className="notification-popup-status">Aucune notification.</p>
          )}
          {!loading && !fetchError && items && items.length > 0 && (
            <ul className="notification-list">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`notification-item${n.is_read ? "" : " notification-item-unread"}`}
                >
                  <div className="notification-item-top">
                    <span className="notification-type">{n.type}</span>
                    <span className="notification-date">
                      {formaterDateNotification(n.created_at)}
                    </span>
                  </div>
                  {n.title && (
                    <div className="notification-title">{n.title}</div>
                  )}
                  {n.body && (
                    <div className="notification-body">{n.body}</div>
                  )}
                  <div className="notification-seen">
                    {n.is_read ? "Lu" : "Non lu"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DispositionTableauDeBord({ user, children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(TAB_DASHBOARD); 
  const [popupOpen, setPopupOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

  const greetingName = profile?.prenom || profile?.nom || "Utilisateur";
  const isRH = profile?.role === "RH";
  
  const avatarInitials =
    [profile?.prenom?.[0], profile?.nom?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

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
            className={`menu-item ${tab === TAB_DASHBOARD ? "active" : ""}`}
            onClick={() => {
              setTab(TAB_DASHBOARD);
              navigate("/dashboard");
            }}
          >
            <img src="/tableau-de-bord.png" alt="Dashboard" className="sidebar-icon-img" />
            <span className="label">Dashboard</span>
          </button>

          <button
            type="button"
            className={`menu-item ${tab === TAB_FORUM ? "active" : ""}`}
            onClick={() => {
              setTab(TAB_FORUM);
              navigate(`/forum/${user.id}`);
            }}
          >
            <img src="/tableau-de-bord.png" alt="Forum" className="sidebar-icon-img" />
            <span className="label">Forum</span>
          </button>

          <button
            type="button"
            className={`menu-item ${tab === TAB_RESSOURCE ? "active" : ""}`}
            onClick={() => {
              setTab(TAB_RESSOURCE);
              navigate("/ressource");
            }}
          >
            <img src="/ressource.png" alt="Ressources" className="sidebar-icon-img" />
            <span className="label">Ressources</span>
          </button>

          {isRH && (
            <button
              type="button"
              className={`menu-item ${tab === TAB_EMPLOYEES ? "active" : ""}`}
              onClick={() => {
                setTab(TAB_EMPLOYEES);
                navigate("/employees");
              }}
            >
              <img src="/parametre.png" alt="Employés" className="sidebar-icon-img" />
              <span className="label">Employés</span>
            </button>
          )}
          <button
            type="button"
            className={`menu-item ${tab === TAB_PSYCHOBOT ? "active" : ""}`}
            onClick={() => setTab(TAB_PSYCHOBOT)}
          >
            <img src="/bot.png" alt="Psychobot" className="sidebar-icon-img" />
            <span className="label">Psychobot</span>
          </button>

          <button
            type="button"
            className={`menu-item ${tab === TAB_PARAMETRES ? "active" : ""}`}
            onClick={() => {
              setTab(TAB_PARAMETRES);
              navigate(`/profile/${user.id}`);
            }}
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
            <button
              type="button"
              className="notification-icon-btn"
              onClick={() => {
                setPopupOpen(false);
                setNotificationsOpen(true);
              }}
              aria-label="Ouvrir les notifications"
            >
              <img
                src="/notification.png"
                alt=""
                className="sidebar-icon-img"
              />
            </button>
            <button
              type="button"
              className="user-avatar-btn"
              onClick={() => {
                setNotificationsOpen(false);
                setPopupOpen(true);
              }}
              aria-label="Profil"
            >
              <div className="user-avatar">{avatarInitials}</div>
            </button>
          </div>
        </header>

        <div className="ressources-content">
          
          {tab === TAB_DASHBOARD && <DashboardOverview user={user} profile={profile} />}

          {tab === TAB_RESSOURCE && (children ? children : <div className="ressources-placeholder" />)}

          {tab === TAB_EMPLOYEES && isRH && (
            children ? (
              <RhSecuredRoute user={user}>
                {cloneElement(children, { user, embedded: true })}
              </RhSecuredRoute>
            ) : (
              <RhSecuredRoute user={user}>
                <EmployeesList user={user} embedded />
              </RhSecuredRoute>
            )
          )}

          {tab === TAB_PARAMETRES && (
            children ? (
              cloneElement(children, { user, embedded: true })
            ) : (
              <Profile user={user} embedded />
            )
          )}

          {tab === TAB_FORUM && (
            children ? (
              cloneElement(children, { user, embedded: true })
            ) : (
              <ForumHome user={user} embedded />
            )
          )}
          {tab === TAB_PSYCHOBOT && <PsychoBot />}
        </div>
      </main>

      {popupOpen && (
        <PopupProfil
          user={user}
          profile={profile}
          onFermer={() => setPopupOpen(false)}
          onOuvrirParametres={() => {
            setTab(TAB_PARAMETRES);
            navigate(`/profile/${user.id}`);
          }}
        />
      )}

      {notificationsOpen && (
        <PopupNotifications
          user={user}
          onFermer={() => setNotificationsOpen(false)}
        />
      )}
    </div>
  );
}