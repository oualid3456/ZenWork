
export default function Secured_Space({ role }) {
  return (
    <div className="post-box">
      <h3>Espace sécurisé</h3>

      {role === "employee" && <p>💬 Discussion privée avec le RH ou la Direction.</p>}
      {role === "rh" && <p>📁 Espace RH : messages des employés.</p>}
      {role === "direction" && <p>📂 Interface Direction.</p>}
    </div>
  );
}