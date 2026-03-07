import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient.js";
import Login from "./Login.jsx";
import styles from "./register.module.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPLOYE");
  const [message, setMessage] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();
  if (showLogin) {
    navigate("/");
  }

  const handleRegister = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nom, prenom },
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data?.user?.id) {
      setMessage("Impossible de recuperer l'utilisateur apres l'inscription.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      role,
      nom,
      prenom,
    });

    if (profileError) {
      setMessage(profileError.message);
      return;
    }

    setMessage("Compte crée avec succes !");
  };

  return (
    <div className={styles.container}>
      <div className={styles.create}>
        <h2 className={styles.h2} >Inscription</h2>
        <form className={styles.form} onSubmit={handleRegister}>
          <input className={styles.input}
            type="email"
            placeholder="Email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <input className={styles.input}
            type="password"
            placeholder="Mot de passe"
            required
            pattern="(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])(?=.*[0-9]).{10,}"
            onChange={(e) => setPassword(e.target.value)}
          />

          <input className={styles.input}
            type="text"
            placeholder="Nom"
            required
            onChange={(e) => setNom(e.target.value)}
          />

          <input className={styles.input}
            type="text"
            placeholder="Prénom"
            required
            onChange={(e) => setPrenom(e.target.value)}
          />

          <select className={styles.select} onChange={(e) => setRole(e.target.value)}>
            <option className={styles.option} value="EMPLOYE">Employé</option>
            <option className={styles.option} value="RH">RH</option>
          </select>

          <button className={styles.button} type="submit">Créer le compte</button>
        </form>
        <p className={styles.login} onClick={() => navigate("/login")}>
          Retourner a l'espace de connexion
        </p>
        <p className={styles.p}>{message}</p>
      </div>
    </div>
  );
}

export default Register;
