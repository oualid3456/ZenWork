import EmployeeDiscussion from "./EmployeeDiscussion";
import { isAdminLike, normalizeRole } from "./forumUtils";

export default function Secured_Space({ role, user }) {
  const normalizedRole = normalizeRole(role);

  if (!normalizedRole) {
    return <p>Chargement...</p>;
  }

  return (
    <section className="forum-card">
      <h4>Espace sécurisé</h4>

      {normalizedRole === "employee" && (
        <p>💬 Discussion privée avec le RH ou la direction.</p>
      )}

      {normalizedRole === "rh" && (
        <p>📁 Espace RH : messages et échanges sensibles avec les employés.</p>
      )}

      {normalizedRole === "direction" && (
        <p>📂 Interface direction : supervision et échanges restreints.</p>
      )}

      {isAdminLike(normalizedRole) || normalizedRole === "employee" ? (
        <EmployeeDiscussion mode="secure" user={user} role={normalizedRole} />
      ) : (
        <p>Vous n’avez pas accès à cet espace.</p>
      )}
    </section>
  );
}