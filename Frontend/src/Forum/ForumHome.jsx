import { useState } from "react";
import EmployeeDiscussion from "./EmployeeDiscussion";
import Secured_Space from "./Secured_Space";
import "./forum.css";

export default function ForumHome({ userRole }) {
  const [tab, setTab] = useState("feed");

  return (
    <div className="forum-container">
      <div className="forum-header">
        <button
          className={tab === "feed" ? "active" : ""}
          onClick={() => setTab("feed")}
        >
          Fil d’actualité
        </button>

        <button
          className={tab === "employees" ? "active" : ""}
          onClick={() => setTab("employees")}
        >
          Discussion entre employés
        </button>

        <button
          className={tab === "secure" ? "active" : ""}
          onClick={() => setTab("secure")}
        >
          Espace sécurisé
        </button>
      </div>

      {tab === "feed" && <EmployeeDiscussion mode="public" />}
      {tab === "employees" && <EmployeeDiscussion mode="private" />}
      {tab === "secure" && <SecureSpace role={userRole} />}
    </div>
  );
}