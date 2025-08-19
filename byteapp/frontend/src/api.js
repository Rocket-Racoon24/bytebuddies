// frontend/src/api.js
// Centralized API helper for StudyApp frontend <-> Flask backend

// Base URL setup:
// - When running locally (npm start) → use http://localhost:5000
// - When deployed to Render as a single service (Flask serves React build) → just use relative "/api"
// - If you deploy backend separately on Render → replace BACKEND_URL with your backend service URL

const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? "" // production: relative to same domain
    : "http://localhost:5000"; // local dev

// ---------------- AUTH ----------------

/**
 * Register a new user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} API response
 */
export async function registerUser(email, password) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  } catch (err) {
    return { error: "Failed to connect to server." };
  }
}

/**
 * Login an existing user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} API response
 */
export async function loginUser(email, password) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  } catch (err) {
    return { error: "Failed to connect to server." };
  }
}

// ---------------- ROADMAP GENERATOR ----------------

/**
 * Generate a roadmap from syllabus text or file
 * @param {FormData} formData
 * @returns {Promise<object>} API response
 */
export async function generateRoadmap(formData) {
  try {
    const res = await fetch(`${BACKEND_URL}/generate-roadmap`, {
      method: "POST",
      body: formData, // formData may contain "file" or "content"
    });
    return await res.json();
  } catch (err) {
    return { error: "Failed to connect to server." };
  }
}
