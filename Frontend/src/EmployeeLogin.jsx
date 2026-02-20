import { useState } from "react";

function EmployeeLogin({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const fetchLogin = (event) => {
    event.preventDefault();
    console.log("CLICK OK");

    fetch('http://127.0.0.1:8000/login/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username, password, role: 'employee'})
    })
      .then(resultat => resultat.json())
      .then(data => {
        if (data.success) {
          alert('Connexion réussie');
          if (onSuccess) onSuccess();
        } else {
          alert('Erreur : Identifiants incorrects');
        }
      })
      .catch(e => console.error('Erreur réseau :', e));
  };

  return (
    <form onSubmit={fetchLogin}>
      <label>Email</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <label>Mot de passe</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit">Se connecter</button>
    </form>
  );
}

export default EmployeeLogin;