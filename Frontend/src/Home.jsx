import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

function Home() {
  const [user, setUser] = useState(null);
  const [prenom, setPrenom] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      setUser(user);
      setPrenom(user.user_metadata?.prenom);
    }
    fetchUser();
  }, [navigate]);
  if (!user) {
    return <p>Loading</p>;
  }
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