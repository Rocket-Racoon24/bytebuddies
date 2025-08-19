import React, { useState } from "react";
import { loginUser } from "./api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await loginUser(email, password);

    if (data.redirect) {
      // ✅ Redirect user to roadmap page
      window.location.href = data.redirect;
    } else {
      setError(data.error || "Login failed. Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: "block", margin: "10px 0", padding: "10px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: "block", margin: "10px 0", padding: "10px" }}
        />
        <button type="submit" style={{ padding: "10px 20px" }}>
          Login
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Login;
