import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchCurrentUserRole,
  fetchOpenForumReports,
  reviewForumReport,
} from "./forumService";
import EmployeeDiscussion from "./EmployeeDiscussion";
import Secured_Space from "./Secured_Space";
import PrivateMessages from "./PrivateMessages";
import { canModerateForum, formatDate } from "./forumUtils";

function ModerationPanel({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadReports() {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await fetchOpenForumReports();
      setReports(data);
    } catch (error) {
      console.error("Erreur chargement signalements :", error.message);
      setErrorMessage("Impossible de charger les signalements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleReview(reportId) {
    try {
      await reviewForumReport({
        reportId,
        reviewedBy: user.id,
        status: "reviewed",
      });
      loadReports();
    } catch (error) {
      console.error("Erreur traitement signalement :", error.message);
      setErrorMessage("Impossible de mettre à jour le signalement.");
    }
  }

  return (
    <div className="forum-moderation-panel">
      <div className="forum-moderation-card">
        <h3 style={{ marginTop: 0 }}>Modération du forum</h3>
        <p style={{ marginBottom: 0, color: "#718096" }}>
          Traite ici les signalements ouverts du forum.
        </p>
      </div>

      {errorMessage && (
        <div className="forum-moderation-card">
          <p style={{ color: "#E53E3E", margin: 0 }}>{errorMessage}</p>
        </div>
      )}

      {loading ? (
        <div className="forum-moderation-card">
          <p style={{ margin: 0 }}>Chargement...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="forum-moderation-card">
          <p style={{ margin: 0 }}>Aucun signalement ouvert.</p>
        </div>
      ) : (
        reports.map((report) => (
          <div key={report.id} className="forum-moderation-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <div>
                <strong style={{ display: "block", marginBottom: 6 }}>
                  {report.target_type === "post" ? "Post" : "Commentaire"} #{report.target_id}
                </strong>
                <p style={{ margin: "0 0 6px 0", color: "#1A202C" }}>
                  Motif : {report.reason}
                </p>
                {report.details ? (
                  <p style={{ margin: "0 0 6px 0", color: "#718096" }}>
                    Détail : {report.details}
                  </p>
                ) : null}
                <small style={{ color: "#A0AEC0" }}>
                  Signalé le {formatDate(report.created_at)}
                </small>
              </div>

              <button
                type="button"
                className="start-btn forum-admin-btn"
                onClick={() => handleReview(report.id)}
              >
                Marquer traité
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function ForumHome({ user, embedded = false }) {
  const [tab, setTab] = useState("feed");
  const [role, setRole] = useState(null);
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

  return (
    <div className="forum-page">
      {!embedded && (
        <div className="video-card">
          <div className="video-body">
            <h3>Forum interne</h3>
            <p>Publications, échanges et messagerie interne.</p>
          </div>
          <button
            type="button"
            className="start-btn"
            style={{ width: "auto", padding: "10px 16px" }}
            onClick={() => navigate(`/home/${user.id}`)}
          >
            Retour à l’accueil
          </button>
        </div>
      )}

      <div className="forum-tabs">
        <button
          type="button"
          className={`forum-tab-btn ${tab === "feed" ? "active" : ""}`}
          onClick={() => setTab("feed")}
        >
          Fil d’actualité
        </button>

        <button
          type="button"
          className={`forum-tab-btn ${tab === "employees" ? "active" : ""}`}
          onClick={() => setTab("employees")}
        >
          Discussion employés
        </button>

        <button
          type="button"
          className={`forum-tab-btn ${tab === "secure" ? "active" : ""}`}
          onClick={() => setTab("secure")}
        >
          Espace sécurisé
        </button>

        <button
          type="button"
          className={`forum-tab-btn ${tab === "messages" ? "active" : ""}`}
          onClick={() => setTab("messages")}
        >
          Messagerie privée
        </button>

        {canModerateForum(role) && (
          <button
            type="button"
            className={`forum-tab-btn ${tab === "moderation" ? "active" : ""}`}
            onClick={() => setTab("moderation")}
          >
            Modération
          </button>
        )}
      </div>

      {tab === "feed" && <EmployeeDiscussion mode="feed" user={user} role={role} />}
      {tab === "employees" && (
        <EmployeeDiscussion mode="employees" user={user} role={role} />
      )}
      {tab === "secure" && <Secured_Space role={role} user={user} />}
      {tab === "messages" && <PrivateMessages user={user} />}
      {tab === "moderation" && canModerateForum(role) && <ModerationPanel user={user} />}
    </div>
  );
}