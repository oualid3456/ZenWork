import React from "react";

function Login() {
  return (
    <div>
      <h1>ZenWork</h1>
      <form>
        <label>
          Adresse Email
          <input type="email" placeholder="Entrez votre email" />
        </label>
        <br />
        <label>
          Mot de passe
          <input type="password" placeholder="Entrez votre mot de passe" />
        </label>
        <br />
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}

export default Login;
