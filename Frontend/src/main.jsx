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
import DashboardLayout from "./Layout/DashboardLayout.jsx";
import EmployeesList from "./Employees/EmployeesList.jsx";
import Profile from "./Profile/Profile.jsx";
import Ressources from "./Espace Ressource/Ressources.jsx";
import PsychoBot from "./Psychobot/Psychobot.jsx";



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
              <DashboardLayout>
                <StartQuestionnaire />
              </DashboardLayout>
            </SecurisedRoute>
          }
        />

        <Route
          path="/questionnaire/:userId/:questionnaireId"
          element={
            <SecurisedRoute>
              <DashboardLayout>
                <Questionnaire />
              </DashboardLayout>
            </SecurisedRoute>
          }
        />
        <Route path="/dashboard/:id" element={<SecurisedRoute><DashboardLayout /></SecurisedRoute>} />
        <Route path="/ressource/:id" element={<SecurisedRoute><DashboardLayout><Ressources /></DashboardLayout></SecurisedRoute>} />
        <Route path="/employees/:id" element={<SecurisedRoute><DashboardLayout><EmployeesList /></DashboardLayout></SecurisedRoute>} />
        <Route path="/profile/:id" element={<SecurisedRoute><DashboardLayout><Profile /></DashboardLayout></SecurisedRoute>} />

        <Route
          path="/forum/:userId"
          element={
            <SecurisedRoute>
              <DashboardLayout>
                <ForumHome />
              </DashboardLayout>
            </SecurisedRoute>
          }
        />
        <Route path="/ForumHome/:id" element={<ForumHome />} />
        <Route path="/psychobot/:id" element={<SecurisedRoute><PsychoBot /></SecurisedRoute>} />
        <Route path="*" element={<Error />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>
);
