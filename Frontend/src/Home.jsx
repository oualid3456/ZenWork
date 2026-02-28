import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

function Home({ user }) {
  const navigate = useNavigate();
  const prenom = user.user_metadata?.prenom;
  return (
    <div>
      <h1>Hi {prenom} ! 👋</h1>
      <button onClick={() => navigate(`/questionnaire/${user.id}`)}>
        Questionnaire
      </button>
      <br />
      <button onClick={async () => {
        await supabase.auth.signOut();
        navigate("/");
      }}>
        Deconnexion
      </button>
    </div>
  );
}

export default Home;