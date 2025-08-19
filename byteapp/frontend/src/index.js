import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import HomePage from "./HomePage";   // Default homepage
import Login from "./Login";
import Register from "./Register";
import App from "./App";             // Neon Mind landing

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      {/* Default homepage */}
      <Route path="/" element={<HomePage />} />

      {/* Auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Old App.js design still available at /landing */}
      <Route path="/landing" element={<App />} />
    </Routes>
  </BrowserRouter>
);
