// src/api.js
const apiUrl = 'http://fragments-lb-559072708.us-east-1.elb.amazonaws.com';

// Get all user fragments
export async function getUserFragments(user, expand = 1) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments?expand=${expand}`, {
      method: 'GET',
      // Use the same helper that creates the proper authorization headers
      headers: user.authorizationHeaders(),
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

// Get metadata for a single fragment
export async function getFragment(user, id) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: 'GET',
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('Error getting fragment metadata:', err);
  }
}

// Get the raw data for a fragment (returns { data, contentType })
export async function getFragmentData(user, id) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}/data`, {
      method: 'GET',
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const contentType = res.headers.get('Content-Type') || 'application/octet-stream';

    // For textual types, return text; otherwise return a blob
    if (/^text\/|json|application\/json|javascript/.test(contentType)) {
      const text = await res.text();
      return { data: text, contentType };
    }

    const blob = await res.blob();
    return { data: blob, contentType };
  } catch (err) {
    console.error('Error getting fragment data:', err);
  }
}

// Update an existing fragment
export async function updateUserFragment(user, id, data, type = 'text/plain') {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: 'PUT',
      headers: user.authorizationHeaders(type),
      body: data,
    });

    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    return await res.json();
  } catch (err) {
    console.error('Error updating fragment:', err);
  }
}

// Delete a fragment
export async function deleteUserFragment(user, id) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: 'DELETE',
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return true;
  } catch (err) {
    console.error('Error deleting fragment:', err);
    return false;
  }
}
