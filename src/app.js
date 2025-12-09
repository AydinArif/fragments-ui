// src/app.js
import { signIn, getUser } from './auth.js';
import {
  getUserFragments,
  createUserFragment,
  getFragmentData,
  updateUserFragment,
  deleteUserFragment,
} from './api.js';

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

  if (!data) {
    container.innerHTML = '<p>Unable to load fragments.</p>';
    return;
  }

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
      <div class="fragment-actions">
        <button class="view-btn">View</button>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
      <div class="fragment-content" aria-hidden="true"></div>
      <p class="fragment-status" style="display:none;margin-top:0.5rem;"></p>
    `;

    // Attach handlers
    const viewBtn = div.querySelector('.view-btn');
    const editBtn = div.querySelector('.edit-btn');
    const deleteBtn = div.querySelector('.delete-btn');
    const contentDiv = div.querySelector('.fragment-content');
    const statusP = div.querySelector('.fragment-status');

    viewBtn.onclick = async () => {
      // Toggle: if content is visible, hide it
      if (contentDiv.getAttribute('aria-hidden') === 'false') {
        contentDiv.innerHTML = '';
        contentDiv.setAttribute('aria-hidden', 'true');
        return;
      }

      contentDiv.innerHTML = '<p>Loading...</p>';
      contentDiv.setAttribute('aria-hidden', 'false');
      const result = await getFragmentData(user, fragment.id);
      if (!result) {
        contentDiv.innerHTML = '<p>Unable to load fragment data.</p>';
        return;
      }

      const { data, contentType } = result;
      // Render based on content type
      if (typeof data === 'string') {
        // For JSON, prettify
        if (contentType.includes('json')) {
          const pre = document.createElement('pre');
          try {
            const obj = JSON.parse(data);
            pre.textContent = JSON.stringify(obj, null, 2);
          } catch (_) {
            pre.textContent = data;
          }
          contentDiv.innerHTML = '';
          contentDiv.appendChild(pre);
        } else {
          const pre = document.createElement('pre');
          pre.textContent = data;
          contentDiv.innerHTML = '';
          contentDiv.appendChild(pre);
        }
      } else if (data instanceof Blob) {
        // Binary data: provide a download link or show image if image/*
        if (contentType.startsWith('image/')) {
          const url = URL.createObjectURL(data);
          const img = document.createElement('img');
          img.src = url;
          img.style.maxWidth = '100%';
          contentDiv.innerHTML = '';
          contentDiv.appendChild(img);
        } else {
          const url = URL.createObjectURL(data);
          contentDiv.innerHTML = `<a href="${url}" download="fragment-${fragment.id}">Download fragment</a>`;
        }
      } else {
        contentDiv.innerHTML = '<p>Unsupported data type.</p>';
      }
    };

    editBtn.onclick = async () => {
      // Load current data and replace contentDiv with editor
      contentDiv.setAttribute('aria-hidden', 'false');
      contentDiv.innerHTML = '<p>Loading...</p>';
      const result = await getFragmentData(user, fragment.id);
      if (!result) {
        contentDiv.innerHTML = '<p>Unable to load fragment data for edit.</p>';
        return;
      }

      const { data, contentType } = result;
      if (!(typeof data === 'string')) {
        contentDiv.innerHTML = '<p>Editing of binary fragments is not supported in the UI.</p>';
        return;
      }

      contentDiv.innerHTML = `\n        <div>\n          <label>Type:</label>\n          <select class="edit-type">\n            <option value="text/plain">text/plain</option>\n            <option value="application/json">application/json</option>\n            <option value="text/markdown">text/markdown</option>\n          </select>\n          <textarea class="edit-text" style="width:100%;min-height:120px;margin-top:0.5rem;">${escapeHtml(
            data
          )}</textarea>\n          <div style="margin-top:0.5rem;">\n            <button class="save-edit">Save</button>\n            <button class="cancel-edit">Cancel</button>\n          </div>\n        </div>`;

      // Set current type
      const typeSelect = contentDiv.querySelector('.edit-type');
      typeSelect.value = contentType || fragment.type || 'text/plain';

      const saveBtn = contentDiv.querySelector('.save-edit');
      const cancelBtn = contentDiv.querySelector('.cancel-edit');

      cancelBtn.onclick = () => {
        contentDiv.innerHTML = '';
        contentDiv.setAttribute('aria-hidden', 'true');
      };

      saveBtn.onclick = async () => {
        const newType = typeSelect.value;
        const newText = contentDiv.querySelector('.edit-text').value;

        // If JSON type, validate
        if (newType === 'application/json') {
          try {
            JSON.parse(newText);
          } catch (err) {
            return alert('Invalid JSON. Fix formatting before saving.');
          }
        }

        statusP.style.display = 'block';
        statusP.textContent = 'Saving...';
        const res = await updateUserFragment(user, fragment.id, newText, newType);
        if (!res) {
          statusP.textContent = 'Error saving fragment.';
          return;
        }

        statusP.textContent = 'Saved.';
        await loadFragments(user, container);
      };
    };

    deleteBtn.onclick = async () => {
      if (!confirm('Delete this fragment? This cannot be undone.')) return;
      statusP.style.display = 'block';
      statusP.textContent = 'Deleting...';
      const ok = await deleteUserFragment(user, fragment.id);
      if (!ok) {
        statusP.textContent = 'Error deleting fragment.';
        return;
      }
      statusP.textContent = 'Deleted.';
      await loadFragments(user, container);
    };

    container.appendChild(div);
  }
}

// Helper to escape HTML when injecting into textarea area
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

addEventListener('DOMContentLoaded', init);
