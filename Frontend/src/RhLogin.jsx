import { useState } from "react";
import { supabase } from "./supabaseClient";

function RhLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
      e.preventDefault();
  
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
  
      if (error) {
        setMessage(error.message);
        // message pour l'utilisateur (pour le moment pas opti
        // car ne distingue pas s'il s'agit de l'utilisateur
        // qui s'est trompé ou si l'erreur viens de la base)
        setErrorMessage("Identifiant ou mot de passe incorrect");
        return;
      }
  
      setMessage("Connexion réussie !");
      console.log("User connecté :", data.user);
    };

  return (
    <div>
      <form onSubmit={handleLogin}>
        <label>Email
          <br />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <br />
        <label>Mot de passe
          <br />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <br />
        <button>Se connecter</button>
      </form>
      {errorMessage  && <p>{errorMessage }</p>}
    </div>
  );
}

export default RhLogin;