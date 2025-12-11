// src/api.js
const apiUrl = 'http://fragments-lb-559072708.us-east-1.elb.amazonaws.com';

// Get all user fragments
export async function getUserFragments(user) {
  try {
    console.log('Fetching fragments from:', `${apiUrl}/v1/fragments?expand=1`);
    const res = await fetch(`${apiUrl}/v1/fragments?expand=1`, {
      headers: user.authorizationHeaders(),
    });
    console.log('GET fragments response status:', res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('GET fragments failed:', res.status, errorText);
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('GET fragments data:', data);
    return data;
  } catch (err) {
    console.error('Error getting user fragments:', err);
    return null;
  }
}

// Create a new fragment
export async function createUserFragment(user, data, type = 'text/plain') {
  try {
    // Determine if data is binary (ArrayBuffer) or text
    const isBinary = data instanceof ArrayBuffer;
    const bodyData = isBinary ? data : data;
    const bodyLength = isBinary ? data.byteLength : data.length;

    console.log('Creating fragment:', { url: `${apiUrl}/v1/fragments`, type, bodyLength, isBinary });
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: 'POST',
      headers: user.authorizationHeaders(type),
      body: bodyData,
    });
    console.log('POST fragment response status:', res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('POST fragment failed:', res.status, errorText);
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const responseData = await res.json();
    console.log('POST fragment response:', responseData);
    return responseData;
  } catch (err) {
    console.error('Error creating fragment:', err);
    return null;
  }
}

// Update an existing fragment
export async function updateUserFragment(user, id, data, type) {
  try {
    // Determine if data is binary (ArrayBuffer) or text
    const isBinary = data instanceof ArrayBuffer;
    const bodyData = isBinary ? data : data;
    const bodyLength = isBinary ? data.byteLength : data.length;

    console.log('Updating fragment:', { url: `${apiUrl}/v1/fragments/${id}`, type, bodyLength, isBinary });
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: 'PUT',
      headers: user.authorizationHeaders(type),
      body: bodyData,
    });
    console.log('PUT fragment response status:', res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('PUT fragment failed:', res.status, errorText);
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const responseData = await res.json();
    console.log('PUT fragment response:', responseData);
    return responseData;
  } catch (err) {
    console.error('Error updating fragment:', err);
    return null;
  }
}

// Delete a fragment
export async function deleteUserFragment(user, id) {
  try {
    console.log('Deleting fragment:', { url: `${apiUrl}/v1/fragments/${id}` });
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: 'DELETE',
      headers: user.authorizationHeaders(),
    });
    console.log('DELETE fragment response status:', res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('DELETE fragment failed:', res.status, errorText);
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const responseData = await res.json();
    console.log('DELETE fragment response:', responseData);
    return responseData;
  } catch (err) {
    console.error('Error deleting fragment:', err);
    return null;
  }
}

// Get a fragment with optional conversion
export async function getFragmentWithConversion(user, id, extension = null) {
  try {
    const url = extension
      ? `${apiUrl}/v1/fragments/${id}.${extension}`
      : `${apiUrl}/v1/fragments/${id}`;

    console.log('Getting fragment with conversion:', { url, extension });
    const res = await fetch(url, {
      headers: user.authorizationHeaders(),
    });

    console.log('GET fragment response status:', res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('GET fragment failed:', res.status, errorText);
      throw new Error(`${res.status} ${res.statusText}`);
    }

    // Return both the data and content-type
    const contentType = res.headers.get('content-type');
    const isImage = contentType && contentType.startsWith('image/');

    if (isImage) {
      const blob = await res.blob();
      return { data: blob, contentType, isImage: true };
    } else {
      const text = await res.text();
      return { data: text, contentType, isImage: false };
    }
  } catch (err) {
    console.error('Error getting fragment:', err);
    return null;
  }
}
