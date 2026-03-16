import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Login from "./Login/Login.jsx";
import Questionnaire from "./Questionnaire/Questionnaire.jsx";
import StartQuestionnaire from "./Questionnaire/StartQuestionnaire.jsx";
import Register from "./Register/Register.jsx";
import Home from "./Home/Home.jsx";
import Error from "./Error/Error.jsx";
import SecurisedRoute from "./SecurisedRoute.jsx";
import ForumHome from "./Forum/ForumHome.jsx";
import Ressources from "./Espace Ressource/Ressources.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/home/:id"
          element={
            <SecurisedRoute>
              <Home />
            </SecurisedRoute>
          }
        />

        <Route
          path="/start_questionnaire/:id"
          element={
            <SecurisedRoute>
              <StartQuestionnaire />
            </SecurisedRoute>
          }
        />

        <Route
          path="/questionnaire/:userId/:questionnaireId"
          element={
            <SecurisedRoute>
              <Questionnaire />
            </SecurisedRoute>
          }
        />

        <Route
          path="/forum/:userId"
          element={
            <SecurisedRoute>
              <ForumHome />
            </SecurisedRoute>
          }
        />

        <Route path="/ressource" element={<Ressources />} />
        <Route path="*" element={<Error />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
