import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Loading from "../Loading/Loading.jsx";
import styles from "./dashboardOverview.module.css";

function formatDate(dateValue) {
  if (!dateValue) return "-";
  try {
    return new Date(dateValue).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateValue;
  }
}

function buildDaySeries(items, days = 7) {
  const now = new Date();
  const buckets = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.push({
      key,
      label: d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3),
      value: 0,
    });
  }

  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
  (items || []).forEach((item) => {
    const key = String(item.created_at || "").slice(0, 10);
    if (byKey[key]) byKey[key].value += 1;
  });

  return buckets;
}

function buildRiskBands(sessionRows) {
  const bands = { faible: 0, moyen: 0, eleve: 0 };
  (sessionRows || []).forEach((row) => {
    const score = row.score_risque;
    if (!Number.isFinite(score)) return;
    if (score <= 3) bands.faible += 1;
    else if (score <= 6) bands.moyen += 1;
    else bands.eleve += 1;
  });
  return bands;
}

function StatCard({ label, value, hint }) {
  return (
    <article className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      <span className={styles.statHint}>{hint}</span>
    </article>
  );
}

function BarsChart({ title, series, emptyLabel }) {
  const max = Math.max(1, ...series.map((item) => item.value));

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>{title}</h2>
      {series.every((item) => item.value === 0) ? (
        <p className={styles.empty}>{emptyLabel}</p>
      ) : (
        <div className={styles.barsWrap}>
          {series.map((item) => (
            <div key={item.key || item.label} className={styles.barItem}>
              <span className={styles.barValue}>{item.value}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ height: `${(item.value / max) * 100}%` }}
                />
              </div>
              <span className={styles.barLabel}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RingChart({ title, value, subtitle }) {
  const normalized = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>{title}</h2>
      <div className={styles.ringWrap}>
        <div
          className={styles.ring}
          style={{
            background: `conic-gradient(#6C5DD3 ${normalized}%, #E2E8F0 ${normalized}% 100%)`,
          }}
        >
          <div className={styles.ringInner}>{Math.round(normalized)}%</div>
        </div>
        <p className={styles.ringSubtitle}>{subtitle}</p>
      </div>
    </section>
  );
}

export default function DashboardOverview({ user, profile }) {
  const navigate = useNavigate();
  const role = profile?.role || "EMPLOYE";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    employeesCount: 0,
    activeQuestionnaires: 0,
    responseCount: 0,
    openAlerts: 0,
    pendingRequests: 0,
    averageRisk: "-",
    latestScore: "-",
    completionRate: 0,
  });

  const [activeQuestionnaireId, setActiveQuestionnaireId] = useState(null);
  const [trendSeries, setTrendSeries] = useState([]);
  const [riskBands, setRiskBands] = useState({ faible: 0, moyen: 0, eleve: 0 });
  const [requestBreakdown, setRequestBreakdown] = useState([]);
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    async function fetchDashboard() {
      setLoading(true);
      setError("");

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      try {
        if (role === "RH") {
          const [
            employeesRes,
            activeQuestionnairesRes,
            allResponsesRes,
            weeklyResponsesRes,
            alertsRes,
            sessionsRes,
            demandesRes,
          ] = await Promise.all([
            supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "EMPLOYE"),
            supabase.from("questionnaire").select("id", { count: "exact", head: true }).eq("active", true),
            supabase.from("reponse_questionnaire").select("id", { count: "exact", head: true }),
            supabase
              .from("reponse_questionnaire")
              .select("id, created_at")
              .gte("created_at", sevenDaysAgo.toISOString()),
            supabase
              .from("alerte_burnout")
              .select("id, utilisateur_id, niveau_urgence, statut, created_at")
              .order("created_at", { ascending: false })
              .limit(8),
            supabase.from("session_ia").select("id, score_risque, created_at"),
            supabase.from("demande_changement").select("id, statut"),
          ]);

          if (
            employeesRes.error ||
            activeQuestionnairesRes.error ||
            allResponsesRes.error ||
            weeklyResponsesRes.error ||
            alertsRes.error ||
            sessionsRes.error ||
            demandesRes.error
          ) {
            throw new Error("Certaines donnees du dashboard RH sont indisponibles.");
          }

          const employeesCount = employeesRes.count || 0;
          const responseCount = allResponsesRes.count || 0;
          const activeQuestionnaires = activeQuestionnairesRes.count || 0;

          const alerts = alertsRes.data || [];
          const openAlerts = alerts.filter((item) => item.statut !== "TRAITE").length;

          const demandes = demandesRes.data || [];
          const pendingRequests = demandes.filter((item) => item.statut === "EN_ATTENTE").length;

          const sessions = sessionsRes.data || [];
          const scores = sessions
            .map((item) => item.score_risque)
            .filter((score) => Number.isFinite(score));
          const averageRisk = scores.length
            ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
            : "-";

          const urgency1 = alerts.filter((item) => item.niveau_urgence === 1).length;
          const urgency2 = alerts.filter((item) => item.niveau_urgence === 2).length;
          const urgency3 = alerts.filter((item) => item.niveau_urgence === 3).length;

          const completionRate = employeesCount > 0
            ? Math.min(100, (weeklyResponsesRes.data?.length || 0) / employeesCount * 100)
            : 0;

          const userIds = [...new Set(alerts.map((item) => item.utilisateur_id).filter(Boolean))];
          let employeesById = {};
          if (userIds.length) {
            const { data: employeeRows } = await supabase
              .from("profiles")
              .select("id, nom, prenom")
              .in("id", userIds);
            employeesById = Object.fromEntries(
              (employeeRows || []).map((row) => [row.id, [row.prenom, row.nom].filter(Boolean).join(" ") || "Employe"])
            );
          }

          setStats({
            employeesCount,
            activeQuestionnaires,
            responseCount,
            openAlerts,
            pendingRequests,
            averageRisk,
            latestScore: "-",
            completionRate,
          });

          setTrendSeries(buildDaySeries(weeklyResponsesRes.data || []));
          setRiskBands(buildRiskBands(sessions));
          setRequestBreakdown([
            { key: "low", label: "Urgence 1", value: urgency1 },
            { key: "med", label: "Urgence 2", value: urgency2 },
            { key: "high", label: "Urgence 3", value: urgency3 },
          ]);

          setFeed(
            alerts.map((item) => ({
              id: `a-${item.id}`,
              title: employeesById[item.utilisateur_id] || "Employe",
              subtitle: `Alerte niveau ${item.niveau_urgence} - ${item.statut}`,
              date: item.created_at,
            }))
          );
        } else {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
          thirtyDaysAgo.setHours(0, 0, 0, 0);

          const [
            activeQuestionnairesRes,
            responsesRes,
            weeklyResponsesRes,
            activityResponsesRes,
            alertsRes,
            sessionsRes,
            activitySessionsRes,
            demandesRes,
          ] = await Promise.all([
            supabase
              .from("questionnaire")
              .select("id")
              .eq("active", true)
              .order("created_at", { ascending: false })
              .limit(1),
            supabase
              .from("reponse_questionnaire")
              .select("id, questionnaire_id, created_at", { count: "exact" })
              .eq("utilisateur_id", user.id)
              .order("created_at", { ascending: false })
              .limit(8),
            supabase
              .from("reponse_questionnaire")
              .select("id, created_at")
              .eq("utilisateur_id", user.id)
              .gte("created_at", sevenDaysAgo.toISOString()),
            supabase
              .from("reponse_questionnaire")
              .select("created_at")
              .eq("utilisateur_id", user.id)
              .gte("created_at", thirtyDaysAgo.toISOString()),
            supabase
              .from("alerte_burnout")
              .select("id, statut", { count: "exact" })
              .eq("utilisateur_id", user.id)
              .neq("statut", "TRAITE"),
            supabase
              .from("session_ia")
              .select("id, score_risque, created_at")
              .eq("utilisateur_id", user.id)
              .order("created_at", { ascending: false }),
            supabase
              .from("session_ia")
              .select("created_at")
              .eq("utilisateur_id", user.id)
              .gte("created_at", thirtyDaysAgo.toISOString()),
            supabase
              .from("demande_changement")
              .select("id, statut")
              .eq("utilisateur_id", user.id),
          ]);

          if (
            activeQuestionnairesRes.error ||
            responsesRes.error ||
            weeklyResponsesRes.error ||
            activityResponsesRes.error ||
            alertsRes.error ||
            sessionsRes.error ||
            activitySessionsRes.error ||
            demandesRes.error
          ) {
            throw new Error("Certaines donnees du dashboard employe sont indisponibles.");
          }

          const sessions = sessionsRes.data || [];
          const latestScoreRaw = sessions.find((row) => Number.isFinite(row.score_risque))?.score_risque;
          const scores = sessions
            .map((item) => item.score_risque)
            .filter((score) => Number.isFinite(score));
          const averageRisk = scores.length
            ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
            : "-";

          const demandes = demandesRes.data || [];
          const pending = demandes.filter((item) => item.statut === "EN_ATTENTE").length;
          const accepted = demandes.filter((item) => item.statut === "ACCEPTEE").length;
          const refused = demandes.filter((item) => item.statut === "REFUSEE").length;

          const activeQuestionnaireIdFound = activeQuestionnairesRes.data?.[0]?.id || null;
          const activeDays = new Set(
            [...(activityResponsesRes.data || []), ...(activitySessionsRes.data || [])]
              .map((row) => String(row.created_at || "").slice(0, 10))
              .filter(Boolean)
          );
          const completionRate = Math.min(100, (activeDays.size / 30) * 100);

          setActiveQuestionnaireId(activeQuestionnaireIdFound);
          setStats({
            employeesCount: 0,
            activeQuestionnaires: activeQuestionnaireIdFound ? 1 : 0,
            responseCount: responsesRes.count || 0,
            openAlerts: alertsRes.count || 0,
            pendingRequests: pending,
            averageRisk,
            latestScore: latestScoreRaw != null ? `${latestScoreRaw}/10` : "-",
            completionRate,
          });

          setTrendSeries(buildDaySeries(weeklyResponsesRes.data || []));
          setRiskBands(buildRiskBands(sessions));
          setRequestBreakdown([
            { key: "p", label: "En attente", value: pending },
            { key: "a", label: "Acceptees", value: accepted },
            { key: "r", label: "Refusees", value: refused },
          ]);

          const responseEvents = (responsesRes.data || []).map((item) => ({
            id: `r-${item.id}`,
            title: "Questionnaire complete",
            subtitle: `Questionnaire #${item.questionnaire_id}`,
            date: item.created_at,
          }));

          const sessionEvents = sessions.slice(0, 6).map((item) => ({
            id: `s-${item.id}`,
            title: "Session IA",
            subtitle: item.score_risque != null ? `Score risque: ${item.score_risque}/10` : "Session enregistree",
            date: item.created_at,
          }));

          setFeed(
            [...responseEvents, ...sessionEvents]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 8)
          );
        }
      } catch (err) {
        setError(err.message || "Erreur lors du chargement du dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [role, user?.id]);

  const riskTotal = useMemo(
    () => riskBands.faible + riskBands.moyen + riskBands.eleve,
    [riskBands]
  );

  if (loading) return <Loading />;

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard {role === "RH" ? "RH" : "Employe"}</h1>
          <p className={styles.subtitle}>Vue operationnelle en temps reel de la plateforme bien-etre.</p>
        </div>
        <div className={styles.headerActions}>
          {role === "RH" ? (
            <>
              <button type="button" className={styles.primaryBtn} onClick={() => navigate("/employees")}>Voir les employes</button>
              <button type="button" className={styles.secondaryBtn} onClick={() => navigate(`/profile/${user.id}`)}>Parametres</button>
            </>
          ) : (
            <>
              {activeQuestionnaireId ? (
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => navigate(`/questionnaire/${user.id}/${activeQuestionnaireId}`)}
                >
                  Repondre au questionnaire
                </button>
              ) : (
                <button type="button" className={styles.secondaryBtn} disabled>Aucun questionnaire actif</button>
              )}
              <button type="button" className={styles.secondaryBtn} onClick={() => navigate(`/profile/${user.id}`)}>Mon profil</button>
            </>
          )}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.statsGrid}>
        {role === "RH" ? (
          <>
            <StatCard label="Employes actifs" value={stats.employeesCount} hint="Comptes employes" />
            <StatCard label="Questionnaires actifs" value={stats.activeQuestionnaires} hint="Campagnes en cours" />
            <StatCard label="Reponses totales" value={stats.responseCount} hint="Depuis le debut" />
            <StatCard label="Alertes ouvertes" value={stats.openAlerts} hint="Nouveau + en cours" />
            <StatCard label="Demandes en attente" value={stats.pendingRequests} hint="A traiter" />
            <StatCard label="Risque moyen IA" value={stats.averageRisk} hint="Moyenne globale" />
          </>
        ) : (
          <>
            <StatCard label="Questionnaires completes" value={stats.responseCount} hint="Historique personnel" />
            <StatCard label="Questionnaire actif" value={stats.activeQuestionnaires} hint="0 ou 1 en cours" />
            <StatCard label="Alertes ouvertes" value={stats.openAlerts} hint="Suivi RH en cours" />
            <StatCard label="Demandes en attente" value={stats.pendingRequests} hint="Conge, horaire, echange" />
            <StatCard label="Dernier score IA" value={stats.latestScore} hint="Votre derniere session" />
            <StatCard label="Moyenne score IA" value={stats.averageRisk} hint="Vos sessions" />
          </>
        )}
      </div>

      <div className={styles.twoCols}>
        <BarsChart
          title={role === "RH" ? "Reponses sur 7 jours" : "Mes reponses sur 7 jours"}
          series={trendSeries}
          emptyLabel="Pas de reponse sur les 7 derniers jours."
        />

        <RingChart
          title={role === "RH" ? "Taux de participation hebdo" : "Progression personnelle"}
          value={stats.completionRate}
          subtitle={
            role === "RH"
              ? "Ratio reponses / nombre d'employes"
              : "Jours actifs sur les 30 derniers jours"
          }
        />
      </div>

      <div className={styles.twoCols}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{role === "RH" ? "Repartition des niveaux de risque" : "Mes niveaux de risque"}</h2>
          {riskTotal === 0 ? (
            <p className={styles.empty}>Aucune session IA avec score pour le moment.</p>
          ) : (
            <ul className={styles.legendList}>
              <li className={styles.legendItem}><span className={`${styles.dot} ${styles.dotLow}`} />Faible: {riskBands.faible}</li>
              <li className={styles.legendItem}><span className={`${styles.dot} ${styles.dotMid}`} />Moyen: {riskBands.moyen}</li>
              <li className={styles.legendItem}><span className={`${styles.dot} ${styles.dotHigh}`} />Eleve: {riskBands.eleve}</li>
            </ul>
          )}
        </section>

        <BarsChart
          title={role === "RH" ? "Alertes par urgence" : "Mes demandes RH"}
          series={requestBreakdown}
          emptyLabel={role === "RH" ? "Aucune alerte recensee." : "Aucune demande enregistree."}
        />
      </div>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Activite recente</h2>
        {feed.length === 0 ? (
          <p className={styles.empty}>Aucune activite a afficher pour le moment.</p>
        ) : (
          <ul className={styles.feedList}>
            {feed.slice(0, 6).map((item) => (
              <li key={item.id} className={styles.feedItem}>
                <div>
                  <p className={styles.feedTitle}>{item.title}</p>
                  <p className={styles.feedSubtitle}>{item.subtitle}</p>
                </div>
                <span className={styles.feedDate}>{formatDate(item.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
