// src/app.js
import { signIn, getUser } from './auth.js';
import { getUserFragments, createUserFragment } from './api.js';

async function init() {
  const loginBtn = document.querySelector('#login');
  const userSection = document.querySelector('#user');
  const welcome = document.querySelector('#welcome');
  const createBtn = document.querySelector('#createBtn');
  const fragmentsDiv = document.querySelector('#fragments');

  // Login button handler
  loginBtn.onclick = () => signIn();

  // Check if user is logged in
  const user = await getUser();
  if (!user) return;

  // Hide login, show user section
  loginBtn.hidden = true;
  userSection.hidden = false;

  // Greet user
  welcome.textContent = `Hello ${user.username || user.email}!`;

  // Load existing fragments
  await loadFragments(user, fragmentsDiv);

  // Handle creating new fragments
  createBtn.onclick = async () => {
    const textInput = document.querySelector('#fragmentText').value.trim();
    const type = document.querySelector('#fragmentType').value;

    if (!textInput) return alert('Please enter some text!');

    let bodyToSend = textInput;

    
    if (type === 'application/json') {
      try {
        const parsed = JSON.parse(textInput);
        bodyToSend = JSON.stringify(parsed, null, 2);
      } catch (err) {
        return alert('Invalid JSON format! Please enter valid JSON.');
      }
    }

    await createUserFragment(user, bodyToSend, type);
    await loadFragments(user, fragmentsDiv);
    document.querySelector('#fragmentText').value = '';
  };
}

// Helper: load user fragments
async function loadFragments(user, container) {
  container.innerHTML = '';
  const data = await getUserFragments(user);

  // The API returns data in different structures. We need to find the array of fragments.
  // It could be in data.fragments, or it could be the data object itself.
  const fragments = data.fragments || data;

  // Ensure we have an array to work with.
  if (!Array.isArray(fragments) || fragments.length === 0) {
    container.innerHTML = '<p>No fragments found.</p>';
    return;
  }

  // Create cards for each fragment
  for (const item of fragments) {
    // The actual fragment data might be nested in a `fragment` property, or it might be the item itself.
    // This check handles all known inconsistencies.
    const fragment = item.fragment || item;

    const div = document.createElement('div');
    div.className = 'fragment-card';

    const created = new Date(fragment.created).toLocaleString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    div.innerHTML = `
      <p><strong>ID:</strong> ${fragment.id}</p>
      <p><strong>Type:</strong> ${fragment.type}</p>
      <p><strong>Size:</strong> ${fragment.size} bytes</p>
      <p><strong>Created:</strong> ${created}</p>
    `;

    container.appendChild(div);
  }
}

addEventListener('DOMContentLoaded', init);
