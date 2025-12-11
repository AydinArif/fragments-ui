
import { signIn, getUser } from './auth.js';
import { getUserFragments, createUserFragment, updateUserFragment, deleteUserFragment, getFragmentWithConversion } from './api.js';

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
    const type = document.querySelector('#fragmentType').value;
    const isImage = type.startsWith('image/');

    let data;
    if (isImage) {
      const fileInput = document.querySelector('#fragmentFile');
      const file = fileInput.files[0];
      if (!file) return alert('Please select an image file!');

      // Read file as ArrayBuffer
      data = await file.arrayBuffer();
    } else {
      const text = document.querySelector('#fragmentText').value.trim();
      if (!text) return alert('Please enter some text!');
      data = text;
    }

    console.log('Creating fragment:', { type, isImage });
    const result = await createUserFragment(user, data, type);
    console.log('Create result:', result);

    if (result && result.status === 'ok') {
      alert('Fragment created successfully!');
      await loadFragments(user, fragmentsDiv);
      document.querySelector('#fragmentText').value = '';
      document.querySelector('#fragmentFile').value = '';
    } else {
      alert('Failed to create fragment. Check console for details.');
    }
  };

  // Toggle between text and file input based on type
  const fragmentType = document.querySelector('#fragmentType');
  const fragmentText = document.querySelector('#fragmentText');
  const fragmentFile = document.querySelector('#fragmentFile');

  fragmentType.onchange = () => {
    const isImage = fragmentType.value.startsWith('image/');
    if (isImage) {
      fragmentText.style.display = 'none';
      fragmentFile.style.display = 'block';
    } else {
      fragmentText.style.display = 'block';
      fragmentFile.style.display = 'none';
    }
  };
}

// Helper function to show modal with dropdown or textarea
function showModal(title, options, mode = 'dropdown') {
  return new Promise((resolve) => {
    const modal = document.querySelector('#conversionModal');
    const modalTitle = document.querySelector('#modalTitle');
    const formatSelect = document.querySelector('#formatSelect');
    const textInput = document.querySelector('#textInput');
    const confirmBtn = document.querySelector('#modalConfirm');
    const cancelBtn = document.querySelector('#modalCancel');

    // Set title
    modalTitle.textContent = title;

    if (mode === 'dropdown') {
      // Show dropdown, hide textarea
      formatSelect.style.display = 'block';
      textInput.style.display = 'none';

      // Populate dropdown
      formatSelect.innerHTML = '';
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt.toUpperCase();
        formatSelect.appendChild(option);
      });
    } else {
      // Show textarea, hide dropdown
      formatSelect.style.display = 'none';
      textInput.style.display = 'block';
      textInput.value = options || ''; // options is the initial text value
    }

    // Show modal
    modal.style.display = 'block';

    // Handle confirm
    const handleConfirm = () => {
      const selected = mode === 'dropdown' ? formatSelect.value : textInput.value;
      cleanup();
      resolve(selected);
    };

    // Handle cancel
    const handleCancel = () => {
      cleanup();
      resolve(null);
    };

    // Cleanup function
    const cleanup = () => {
      modal.style.display = 'none';
      textInput.value = '';
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
  });
}

// Helper: load user fragments
async function loadFragments(user, container) {
  console.log('Loading fragments...');
  container.innerHTML = '<p>Loading...</p>';

  const data = await getUserFragments(user);
  console.log('Fragments data received:', data);

  container.innerHTML = '';

  if (!data) {
    container.innerHTML = '<p style="color: red;">Error loading fragments. Check console.</p>';
    return;
  }

  if (!data.fragments || data.fragments.length === 0) {
    container.innerHTML = '<p>No fragments found.</p>';
    return;
  }

  console.log(`Displaying ${data.fragments.length} fragments`);

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
      <div style="margin-top: 0.5rem;">
        <button class="update-btn" data-id="${frag.id}" data-type="${frag.type}">Update</button>
        <button class="delete-btn" data-id="${frag.id}" style="background-color: #dc3545;">Delete</button>
        <button class="convert-btn" data-id="${frag.id}" data-type="${frag.type}" style="background-color: #28a745;">Convert</button>
      </div>
    `;


    // Add delete handler
    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.onclick = async () => {
      if (!confirm(`Are you sure you want to delete fragment ${frag.id}?`)) return;

      console.log('Deleting fragment:', frag.id);
      const result = await deleteUserFragment(user, frag.id);

      if (result && result.status === 'ok') {
        alert('Fragment deleted successfully!');
        await loadFragments(user, container);
      } else {
        alert('Failed to delete fragment. Check console for details.');
      }
    };

    // Add update handler
    const updateBtn = div.querySelector('.update-btn');
    updateBtn.onclick = async () => {
      const isImage = frag.type.startsWith('image/');
      let newData;

      if (isImage) {
        // For images, prompt for file upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          newData = await file.arrayBuffer();
          console.log('Updating fragment:', frag.id);
          const result = await updateUserFragment(user, frag.id, newData, frag.type);

          if (result && result.status === 'ok') {
            alert('Fragment updated successfully!');
            await loadFragments(user, container);
          } else {
            alert('Failed to update fragment. Check console for details.');
          }
        };
        input.click();
      } else {
        // For text, use modal with textarea
        const newContent = await showModal('Enter new content for this fragment:', '', 'textarea');
        if (!newContent) return;

        console.log('Updating fragment:', frag.id);
        const result = await updateUserFragment(user, frag.id, newContent, frag.type);

        if (result && result.status === 'ok') {
          alert('Fragment updated successfully!');
          await loadFragments(user, container);
        } else {
          alert('Failed to update fragment. Check console for details.');
        }
      }
    };

    // Add convert handler
    const convertBtn = div.querySelector('.convert-btn');
    convertBtn.onclick = async () => {
      // Define available conversions for each type
      const conversionMap = {
        'text/plain': ['txt'],
        'text/markdown': ['md', 'html', 'txt'],
        'text/html': ['html', 'txt'],
        'text/csv': ['csv', 'txt', 'json'],
        'application/json': ['json', 'yaml', 'yml', 'txt'],
        'application/yaml': ['yaml', 'yml', 'txt'],
        'image/png': ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'],
        'image/jpeg': ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'],
        'image/webp': ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'],
        'image/avif': ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'],
        'image/gif': ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'],
      };

      const availableFormats = conversionMap[frag.type] || [];

      if (availableFormats.length === 0) {
        alert('No conversions available for this fragment type.');
        return;
      }

      // Show modal with dropdown
      const format = await showModal('Convert to which format?', availableFormats);

      if (!format) return;

      // Get the converted fragment
      console.log('Converting fragment:', frag.id, 'to', format);
      const result = await getFragmentWithConversion(user, frag.id, format.toLowerCase());

      if (!result) {
        alert('Failed to convert fragment. Check console for details.');
        return;
      }

      // Display the converted content
      if (result.isImage) {
        // For images, show in a new window/tab
        const blob = result.data;
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        // For text, show in alert or console
        alert(`Converted content (${format}):\n\n${result.data.substring(0, 500)}${result.data.length > 500 ? '...' : ''}`);
        console.log('Full converted content:', result.data);
      }
    };


    container.appendChild(div);
  }
}

init();