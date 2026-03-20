import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUserRole } from "./forumService";
import EmployeeDiscussion from "./EmployeeDiscussion";
import Secured_Space from "./Secured_Space";
import PrivateMessages from "./PrivateMessages";

export default function ForumHome({ user, embedded = false }) {
  const [tab, setTab] = useState("feed");
  const [role, setRole] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;

    async function loadRole() {
      try {
        const currentRole = await fetchCurrentUserRole(user.id);
        setRole(currentRole);
      } catch (error) {
        console.error("Erreur récupération rôle :", error.message);
        setRole(null);
      }
    }

    loadRole();
  }, [user?.id]);

  function openMessagesWith(member) {
    setSelectedContact(member);
    setTab("messages");
  }

  return (
    <div>
      {!embedded && (
        <header className="floating-topbar">
          <div className="topbar-left">
            <div className="welcome-text">
              <span className="user-greeting">Forum interne</span>
              <span className="company-name">
                Publications, échanges et messagerie
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className="start-btn"
              onClick={() => navigate(`/home/${user.id}`)}
              style={{ width: "auto", padding: "10px 16px" }}
            >
              Retour à l’accueil
            </button>
          </div>
        </header>
      )}

      <div className="filter-container">
        <button
          type="button"
          className={`filter-chip ${tab === "feed" ? "active" : ""}`}
          onClick={() => setTab("feed")}
        >
          Fil d’actualité
        </button>

        <button
          type="button"
          className={`filter-chip ${tab === "employees" ? "active" : ""}`}
          onClick={() => setTab("employees")}
        >
          Discussion employés
        </button>

        <button
          type="button"
          className={`filter-chip ${tab === "secure" ? "active" : ""}`}
          onClick={() => setTab("secure")}
        >
          Espace sécurisé
        </button>

        <button
          type="button"
          className={`filter-chip ${tab === "messages" ? "active" : ""}`}
          onClick={() => setTab("messages")}
        >
          Messagerie privée
        </button>
      </div>

      <div className="video-grid" style={{ gridTemplateColumns: "1fr" }}>
        <div className="video-card">
          {tab === "feed" && (
            <EmployeeDiscussion mode="feed" user={user} role={role} />
          )}

          {tab === "employees" && (
            <EmployeeDiscussion mode="employees" user={user} role={role} />
          )}

          {tab === "secure" && (
            <Secured_Space
              role={role}
              user={user}
              onOpenMessages={openMessagesWith}
            />
          )}

          {tab === "messages" && (
            <PrivateMessages
              user={user}
              preselectedUser={selectedContact}
            />
          )}
        </div>
      </div>
    </div>
  );
}