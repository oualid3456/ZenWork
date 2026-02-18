function RhLogin() {
  return (
    <div>
      <form>
        <label>Email
          <br />
          <input type="email" />
        </label>
        <br />
        <label>Mot de passe
          <br />
          <input type="password" />
        </label>
        <br />
        <button>Se connecter</button>
      </form>
    </div>
  );
}

export default RhLogin;