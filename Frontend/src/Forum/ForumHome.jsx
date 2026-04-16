import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchCurrentUserRole,
  fetchOpenForumReports,
  reviewForumReport,
} from "./forumService";
import EmployeeDiscussion from "./EmployeeDiscussion";
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
      await loadReports();
    } catch (error) {
      console.error("Erreur traitement signalement :", error.message);
      setErrorMessage("Impossible de mettre à jour le signalement.");
    }
  }

  return (
    <div className="forum-moderation-panel">
      <div className="forum-moderation-card">
        <h4 style={{ marginTop: 0, marginBottom: 8 }}>Modération du forum</h4>
        <p style={{ marginTop: 0, marginBottom: 14 }}>
          Traite ici les signalements ouverts du forum.
        </p>

        {errorMessage && (
          <p style={{ color: "#E53E3E", margin: "0 0 12px 0" }}>
            {errorMessage}
          </p>
        )}

        {loading ? (
          <p style={{ margin: 0 }}>Chargement...</p>
        ) : reports.length === 0 ? (
          <p style={{ margin: 0 }}>Aucun signalement ouvert.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reports.map((report) => (
              <div key={report.id} className="forum-moderation-card">
                <p style={{ margin: "0 0 6px 0", fontWeight: 700 }}>
                  {report.target_type === "post" ? "Post" : "Commentaire"} #
                  {report.target_id}
                </p>

                <p style={{ margin: "0 0 6px 0" }}>
                  <strong>Motif :</strong> {report.reason}
                </p>

                {report.details ? (
                  <p style={{ margin: "0 0 6px 0" }}>
                    <strong>Détail :</strong> {report.details}
                  </p>
                ) : null}

                <p style={{ margin: "0 0 10px 0", color: "#718096" }}>
                  Signalé le {formatDate(report.created_at)}
                </p>

                <button
                  type="button"
                  className="forum-tool-btn"
                  onClick={() => handleReview(report.id)}
                >
                  Marquer traité
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
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
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Forum interne</h3>
          <p style={{ marginTop: 0, marginBottom: 14 }}>
            Publications, échanges et messagerie interne.
          </p>

          <button
            type="button"
            className="forum-tool-btn"
            onClick={() => navigate("/dashboard")}
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

      {tab === "feed" && (
        <EmployeeDiscussion mode="feed" user={user} role={role} />
      )}

      {tab === "messages" && <PrivateMessages user={user} />}

      {tab === "moderation" && canModerateForum(role) && (
        <ModerationPanel user={user} />
      )}
    </div>
  );
}