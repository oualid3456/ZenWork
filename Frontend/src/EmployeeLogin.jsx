function EmployeeLogin() {
  return (
    <div>
      <h2>Connexion Employé</h2>
      <form>
        <label>Email<input type="email" /></label>
        <br />
        <label>Mot de passe<input type="password" /></label>
        <br />
        <button>Se connecter</button>
      </form>
    </div>
  );
}

export default EmployeeLogin;