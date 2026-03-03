import Register from "./register.jsx";
import Login from "./login.jsx";
import Alert from "./alerte.jsx"

function Apptest() {
  return (
    <div>
      <h1>Test Supabase</h1>
      <Register />
      <hr />
      <Login />
      <hr/>
      <Alert />
    </div>
  );
}

export default Apptest;
