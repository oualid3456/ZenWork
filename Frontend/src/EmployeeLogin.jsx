import { useState } from "react";

function EmployeeLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const fetchLogin = (event) => {
    event.preventDefault();
    fetch('http://127.0.0.1:8000/login/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username, password, role: 'employee'})
    })
    .then(resultat => resultat.json())
    .then(data => {
      if (data.success) {
        alert('Connexion réussie');
      } else {
        alert('Erreur : Identifiants incorrects');
      }
    })
    .catch(e => console.error('Erreur réseau :', e));
  };

  return (
    <div>
      <form onSubmit={fetchLogin}>
        <label>Email
          <br />
          <input type="email" value={username} onChange={e => setUsername(e.target.value)} required />
        </label>
        <br />
        <label>Mot de passe
          <br />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <br />
        <button type="submit" >Se connecter</button>
      </form>
    </div>
  );
}

export default EmployeeLogin;