// src/api.js
const apiUrl = process.env.API_URL;

// Get all user fragments
export async function getUserFragments(user) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: 'GET',
      headers: {
        Authorization: user.authorizationHeaders()['Authorization'],
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('Error getting user fragments:', err);
  }
}

// Create a new fragment
export async function createUserFragment(user, data, type = 'text/plain') {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: 'POST',
      headers: user.authorizationHeaders(type),
      body: data,
    });

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    // Return JSON response
    return await res.json();
  } catch (err) {
    console.error('Error creating fragment:', err);
  }
}
