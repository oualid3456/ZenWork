import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Apptest from "./Apptest.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Apptest />
  </StrictMode>,
);
