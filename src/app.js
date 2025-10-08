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
    const text = document.querySelector('#fragmentText').value.trim();
    if (!text) return alert('Please enter some text!');
    await createUserFragment(user, text);
    await loadFragments(user, fragmentsDiv);
    document.querySelector('#fragmentText').value = '';
  };
}

// Helper: load user fragments
async function loadFragments(user, container) {
  container.innerHTML = '';
  const data = await getUserFragments(user);
  if (!data?.fragments?.length) {
    container.innerHTML = '<p>No fragments found.</p>';
    return;
  }

  for (const frag of data.fragments) {
    const div = document.createElement('div');
    div.className = 'fragment-card';

    // Format to 12-hour time with AM/PM (no seconds)
    const created = new Date(frag.created).toLocaleString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    div.innerHTML = `
      <p><strong>ID:</strong> ${frag.id}</p>
      <p><strong>Type:</strong> ${frag.type}</p>
      <p><strong>Size:</strong> ${frag.size} bytes</p>
      <p><strong>Created:</strong> ${created}</p>
    `;
    container.appendChild(div);
  }
}

addEventListener('DOMContentLoaded', init);
