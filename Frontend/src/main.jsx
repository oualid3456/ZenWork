import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Login from "./Login.jsx";
import Questionnaire from "./Questionnaire.jsx";
import StartQuestionnaire from "./StartQuestionnaire.jsx";
import Register from "./Register.jsx";
import Home from "./Home.jsx";
import Error from "./Error.jsx";
import SecurisedRoute from "./SecurisedRoute.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home/:id" element={<SecurisedRoute><Home /></SecurisedRoute>} />
        <Route path="/start_questionnaire/:id" element={<SecurisedRoute><StartQuestionnaire /></SecurisedRoute>} />
        <Route path="/questionnaire/:userId/:questionnaireId" element={<SecurisedRoute><Questionnaire /></SecurisedRoute>} />
        <Route path="*" element={<Error />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);