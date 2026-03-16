import EmployeeDiscussion from "./EmployeeDiscussion";

export default function Secured_Space({ role, user }) {
  if (!role) return <p>Chargement...</p>;

  return (
    <div className="post-box">
      <h3>Espace sécurisé</h3>

      {role === "employee" && (
        <>
          <p>💬 Discussion privée avec le RH ou la direction.</p>
          <EmployeeDiscussion mode="secure_employee" user={user} />
        </>
      )}

      {role === "rh" && (
        <>
          <p>📁 Espace RH : messages des employés.</p>
          <EmployeeDiscussion mode="secure_rh" user={user} />
        </>
      )}

      {role === "direction" && (
        <>
          <p>📂 Interface direction.</p>
          <EmployeeDiscussion mode="secure_direction" user={user} />
        </>
      )}
    </div>
  );
}