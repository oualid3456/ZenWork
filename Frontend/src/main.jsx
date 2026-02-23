import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Questionnaire from "./Questionnaire.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Questionnaire />
  </StrictMode>,
);