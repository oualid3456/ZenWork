import EmployeeDiscussion from "./EmployeeDiscussion";
import { isAdminLike, normalizeRole } from "./forumUtils";

export default function Secured_Space({ role, user }) {
  const normalizedRole = normalizeRole(role);

  if (!normalizedRole) {
    return <p>Chargement...</p>;
  }

  return (
    <div>
      <div className="video-body" style={{ marginBottom: 20 }}>
        <h3>Espace sécurisé</h3>

        {normalizedRole === "employee" && (
          <p>Discussion privée avec le RH ou la direction.</p>
        )}

        {normalizedRole === "rh" && (
          <p>Espace RH : échanges sensibles avec les employés.</p>
        )}

        {normalizedRole === "direction" && (
          <p>Interface direction : échanges restreints.</p>
        )}
      </div>

      {isAdminLike(normalizedRole) || normalizedRole === "employee" ? (
        <EmployeeDiscussion mode="secure" user={user} role={normalizedRole} />
      ) : (
        <p>Vous n’avez pas accès à cet espace.</p>
      )}
    </div>
  );
}