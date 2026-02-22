import Register from "./register.jsx";
import Login from "./login.jsx";
import DemandeChangement from "./DemandeChangement.jsx";

function Apptest() {
  return (
    <div>
      <h1>Test Supabase</h1>
      <Register />
      <hr />
      <Login />
      <hr />
      <DemandeChangement />
    </div>
  );
}

export default Apptest;
