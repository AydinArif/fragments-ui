// src/api.js
const apiUrl = process.env.API_URL || 'http://localhost:8080';

// Get all user fragments
export async function getUserFragments(user) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments?expand=1`, {
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('Error getting user fragments:', err);
  }
}

// Create a new fragment
export async function createUserFragment(user, text) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments?expand=1`, {
      method: 'POST',
      headers: user.authorizationHeaders('text/plain'),
      body: text,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('Error creating fragment:', err);
  }
}
