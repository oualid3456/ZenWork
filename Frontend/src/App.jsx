import { useState } from "react";
import EmployeeLogin from "./EmployeeLogin";
import RhLogin from "./RhLogin";
import './login.css';

function App() {
  const [space, setSpace] = useState("employee");
  return (
    <div className="container">
    {/* on a besoin de container ici car, on a pas de body */}
      <div className="left">
        <img src="public/login_pic.png" alt="login pic" />
      </div>
      <div className="right">
        <div>
          {/* logo tout pixelise a change */}
          <img src="public/zenwork_logo.png" alt="zenwork logo" />
        </div>
        <div className="choice">
          {/* expression ternaire pour mettre l'un a in et l'autre a out pour */}
          {/* que dans le css on puisse souligner l'un en bleu et l'autre en gris */}
          <button className={space === "employee" ? "in" : "out"} onClick={() => setSpace("employee")}>
            Employé  
          </button>
          <button className={space === "rh" ? "in" : "out"} onClick={() => setSpace("rh")}>
            RH  
          </button>
        </div>
        {space === "employee" && <EmployeeLogin />}
        {space === "rh" && <RhLogin />}
      </div>
    </div>
  );
}

export default App;