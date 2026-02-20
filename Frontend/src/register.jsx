import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./login.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPLOYE");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      role: role,
    });

    if (profileError) {
      setMessage(profileError.message);
      return;
    }

    setMessage("Compte créé avec succès !");
  };

  return (
    <div>
      <h2>Inscription</h2>

      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          required
          onChange={(e) => setPassword(e.target.value)}
        />

        <select onChange={(e) => setRole(e.target.value)}>
          <option value="EMPLOYE">Employé</option>
          <option value="RH">RH</option>
        </select>

        <button type="submit">Créer le compte</button>
      </form>

      <p>{message}</p>
    </div>
  );
}
