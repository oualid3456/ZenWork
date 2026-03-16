import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import EmployeeDiscussion from "./EmployeeDiscussion";
import Secured_Space from "./Secured_Space";
import "./forum.css";

export default function ForumHome({ user }) {
  const [tab, setTab] = useState("feed");
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchRole() {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setRole(data.role);
      } else {
        console.error("Erreur récupération rôle :", error?.message);
      }
    }

    fetchRole();
  }, [user.id]);

  return (
    <div className="forum-container">
      <div className="forum-header">
        <h1>Forum</h1>
        <button onClick={() => navigate(`/home/${user.id}`)}>
          Retour à l’accueil
        </button>
      </div>

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
      </div>

      <div className="forum-content">
        {tab === "feed" && <EmployeeDiscussion mode="feed" user={user} />}
        {tab === "employees" && (
          <EmployeeDiscussion mode="employees" user={user} />
        )}
        {tab === "secure" && <Secured_Space role={role} user={user} />}
      </div>
    </div>
  );
}