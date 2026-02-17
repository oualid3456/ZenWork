import { useState } from "react";
import EmployeeLogin from "./EmployeeLogin";
import RhLogin from "./RhLogin";
import './login.css';

function App() {
  const [space, setSpace] = useState("employee");
  return (
    // on a besoin de container ici car, on a pas de body
    <div className="container">
      <div className="left">
        <img src="public/login_pic.png" alt="login pic" />
      </div>
      <div className="right">
        <h1>ZenWork</h1>
        <button onClick={() => setSpace("employee")}>
          Employé
        </button>
        <button onClick={() => setSpace("rh")}>
          RH
        </button>
        {space === "employee" && <EmployeeLogin />}
        {space === "rh" && <RhLogin />}
      </div>
    </div>
  );
}

export default App;