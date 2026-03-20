import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUserRole } from "./forumService";
import EmployeeDiscussion from "./EmployeeDiscussion";
import Secured_Space from "./Secured_Space";
import ForumSidebar from "./ForumSidebar";
import PrivateMessages from "./PrivateMessages";
import { normalizeRole } from "./forumUtils";
import "./forum.css";

export default function ForumHome({ user }) {
  const [tab, setTab] = useState("feed");
  const [role, setRole] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;

    async function fetchRole() {
      try {
        const currentRole = await fetchCurrentUserRole(user.id);
        setRole(currentRole);
      } catch (error) {
        console.error("Erreur récupération rôle :", error.message);
        setRole(null);
      }
    }

    fetchRole();
  }, [user?.id]);

  function openMessagesWith(member) {
    setSelectedContact(member);
    setTab("messages");
  }

  return (
    <div className="forum-page">
      <div className="forum-header">
        <h2>Forum</h2>
        <button onClick={() => navigate(`/home/${user.id}`)}>
          Retour à l’accueil
        </button>
      </div>

      <div className="forum-layout">
        <ForumSidebar user={user} onOpenMessages={openMessagesWith} />

        <main className="forum-main">
          <div className="forum-tabs">
            <button
              className={tab === "feed" ? "active-tab" : ""}
              onClick={() => setTab("feed")}
            >
              Fil d’actualité
            </button>

            <button
              className={tab === "employees" ? "active-tab" : ""}
              onClick={() => setTab("employees")}
            >
              Discussion entre employés
            </button>

            <button
              className={tab === "secure" ? "active-tab" : ""}
              onClick={() => setTab("secure")}
            >
              Espace sécurisé
            </button>

            <button
              className={tab === "messages" ? "active-tab" : ""}
              onClick={() => setTab("messages")}
            >
              Messagerie privée
            </button>
          </div>

          {tab === "feed" && (
            <EmployeeDiscussion mode="feed" user={user} role={role} />
          )}

          {tab === "employees" && (
            <EmployeeDiscussion mode="employees" user={user} role={role} />
          )}

          {tab === "secure" && (
            <Secured_Space role={role} user={user} />
          )}

          {tab === "messages" && (
            <PrivateMessages
              user={user}
              preselectedUser={selectedContact}
            />
          )}
        </main>
      </div>
    </div>
  );
}