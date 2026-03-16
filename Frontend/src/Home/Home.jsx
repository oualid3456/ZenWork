import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Loading from "../Loading/Loading.jsx";

function Home({ user }) {
  const navigate = useNavigate();
  const [latestQuestionnaireId, setLatestQuestionnaireId] = useState(null);
  const [role, setRole] = useState(null);
  const prenom = user?.user_metadata?.prenom || "Utilisateur";

  useEffect(() => {
    async function fetchRole() {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setRole(data.role);
      }
    }

    fetchRole();
  }, [user.id]);

  useEffect(() => {
    if (role !== "rh") {
      async function fetchLatestQuestionnaireId() {
        const { data, error } = await supabase
          .from("questionnaire")
          .select("id")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error(
            "Echec dans la récupération du questionnaire :",
            error.message
          );
        } else {
          setLatestQuestionnaireId(data?.id ?? null);
        }
      }

      fetchLatestQuestionnaireId();
    }
  }, [role]);

  if (!role) {
    return <Loading />;
  }

  return (
    <div>
      <h1>Hi {prenom} ! 👋</h1>

      {role === "rh" && (
        <button onClick={() => navigate(`/start_questionnaire/${user.id}`)}>
          Lancer un questionnaire
        </button>
      )}

      {role !== "rh" && latestQuestionnaireId && (
        <button
          onClick={() =>
            navigate(`/questionnaire/${user.id}/${latestQuestionnaireId}`)
          }
        >
          Questionnaire
        </button>
      )}

      {role !== "rh" && !latestQuestionnaireId && <Loading />}

      <br />
      <br />

      <button onClick={() => navigate(`/forum/${user.id}`)}>
        Accéder au forum
      </button>

      <br />
      <br />

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          navigate("/");
        }}
      >
        Déconnexion
      </button>
    </div>
  );
}

export default Home;