import React, { useState } from "react";
import { registerUser } from "./api";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await registerUser(email, password);

    if (data.message) {
      setMessage("✅ " + data.message);
      setEmail("");
      setPassword("");
    } else {
      setMessage("❌ " + (data.error || "Registration failed."));
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Register</h2>
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
          Register
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Register;
