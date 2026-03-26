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
import Questionnaire from "../Questionnaire/Questionnaire.jsx"; 
import NoQuestionnaire from "../Questionnaire/NoQuestionnaire.jsx"; 
import StartQuestionnaire from "../Questionnaire/StartQuestionnaire.jsx"; 

const TAB_PSYCHOBOT = "psychobot";
const TAB_DASHBOARD = "dashboard";
const TAB_RESSOURCE = "ressource";
const TAB_EMPLOYEES = "employees";
const TAB_PARAMETRES = "parametres";
const TAB_FORUM = "forum";
const TAB_QUESTIONNAIRE = "questionnaire";

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
          <button
            type="button"
            className="profile-popup-btn"
            onClick={handleSettings}
          >
            <img src="/parametre.png" alt="" className="profile-popup-btn-icon" />
            Paramètres
          </button>
          <button
            type="button"
            className="profile-popup-btn profile-popup-btn-logout"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ user, children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(TAB_DASHBOARD); 
  const [popupOpen, setPopupOpen] = useState(false);
<<<<<<< HEAD

  useEffect(() => {
    async function fetchActiveQuestionnaire() {
      setLoading(true);
      const { data, error } = await supabase
        .from("questionnaire")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .single();

      if (data) {
        setQuestionnaireId(data.id);
        setTitle(data.titre);
        setDescription(data.description);
      }
      setLoading(false);
    }

    fetchActiveQuestionnaire();
  }, []);
=======
  const [questionnaireId, setQuestionnaireId] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
>>>>>>> c9bf4e8 (modification de layout pour ajouter le questionnaire)

  useEffect(() => {
    if (pathname.includes("/employees")) setTab(TAB_EMPLOYEES);
    else if (pathname.includes("/profile")) setTab(TAB_PARAMETRES);
    else if (pathname.includes("/forum")) setTab(TAB_FORUM);
    else if (pathname.includes("/ressource")) setTab(TAB_RESSOURCE);
    else if (pathname.includes("/dashboard")) setTab(TAB_DASHBOARD);
    else if (pathname.includes("/questionnaire")) setTab(TAB_QUESTIONNAIRE);
    else if (pathname.includes("/start_questionnaire")) setTab(TAB_QUESTIONNAIRE);
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

  useEffect(() => {
    async function fetchLastQuestionnaire() {
      setFetchLoading(true);
      const { data, error } = await supabase
        .from("questionnaire")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error) {
        console.error("Erreur récupération dernier questionnaire :", error.message);
      }
      if (data) {
        setQuestionnaireId(data.id);
      }
      setFetchLoading(false);
    }
    fetchLastQuestionnaire();
  }, []);

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
            className={`menu-item ${tab === TAB_QUESTIONNAIRE ? "active" : ""}`}
            onClick={() => {
              setTab(TAB_QUESTIONNAIRE);

              if (isRH) {
                navigate(`/start_questionnaire/${user.id}`);
              } else {
                navigate(`/questionnaire/${user.id}/${questionnaireId || "none"}`);
              }
            }}
          >
            <img src="/questionnaire.png" alt="Questionnaire" className="sidebar-icon-img" />
            <span className="label">
              {isRH ? "Questionnaire" : "Questionnaire"}
            </span>
          </button>
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
            <img src="/notification.png" alt="Notification" className="sidebar-icon-img" />
            <button
              type="button"
              className="user-avatar-btn"
              onClick={() => setPopupOpen(true)}
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

          {tab === TAB_QUESTIONNAIRE && (
            isRH ? (
              <StartQuestionnaire user={user} />
            ) : (
              <Questionnaire user={user} questionnaireId={questionnaireId} />
            )
          )}
        </div>
      </main>

      {popupOpen && (
        <ProfilePopup
          user={user}
          profile={profile}
          onClose={() => setPopupOpen(false)}
          onOpenSettings={() => {
            setTab(TAB_PARAMETRES);
            navigate(`/profile/${user.id}`);
          }}
        />
      )}
    </div>
  );
}