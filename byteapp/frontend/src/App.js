import React from "react";
import "./App.css";

function App() {
  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="logo">Neon Mind</h1>
        <ul className="nav-links">
          <li>Home</li>
          <li>Features</li>
          <li>About</li>
          <li>Contact</li>
        </ul>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <h2>Welcome to <span className="highlight">Neon Mind</span></h2>
        <p>
          Boost your productivity, track your learning, and keep your mind
          glowing. ✨
        </p>
        <button className="cta">Get Started</button>
      </header>

      {/* Features */}
      <section className="features">
        <div className="feature-card">
          <h3>⚡ Smart Learning</h3>
          <p>Organize your notes and goals in one place.</p>
        </div>
        <div className="feature-card">
          <h3>🎯 Focus Mode</h3>
          <p>Stay distraction-free with custom timers.</p>
        </div>
        <div className="feature-card">
          <h3>📊 Progress Tracker</h3>
          <p>Track your growth with clean analytics.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Neon Mind | All rights reserved</p>
      </footer>
    </div>
  );
}

export default App;
