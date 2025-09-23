// Define a reusable veriables contants for uploads

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB limit

// DOM References 

const userNameEl = document.getElementById('user_name');
const logoutBtn = document.getElementById('logout-btn');

const loginSection = document.getElementById('login-section');
const signupSection = document.getElementById('signup-section');
const storageSection = document.getElementById('storage-section');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

const loginMsg = document.getElementById('login-message');
const signupMsg = document.getElementById('signup-message');
const storageMsg = document.getElementById('storage-message');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const fileListEl = document.getElementById('file-list');
const dropZone = document.getElementById('file-drop-area');


const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');

// View Logic 
// A slightly overthought way to toggle views
function switchView(viewId) {
    const views = {
        'login-section': loginSection,
        'signup-section': signupSection,
        'storage-section': storageSection
    };

   
    for (let key in views) {
        views[key].style.display = 'none';
    }

    if (views[viewId]) {
        views[viewId].style.display = 'block';
    } else {
        console.warn('Unknown view requested:', viewId);
        loginSection.style.display = 'block';
    }
}

//  Auth Logic
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    loginMsg.textContent = 'Logging in... please wait.';

    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.error || 'Invalid credentials');
        }

        // Save tokens
        localStorage.setItem('sessionToken', result.session.access_token || '');
        localStorage.setItem('userEmail', result.session.user?.email || '');

        loginForm.reset();
        loginMsg.textContent = 'Login successful 🎉';
        checkAuthState();

    } catch (err) {
        console.error('Login error:', err);
        loginMsg.textContent = err.message;
    }
}

function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    signupMsg.textContent = 'Creating account...';

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || 'Signup failed');
        signupForm.reset();
        signupMsg.textContent = 'Signup successful. Please log in.';
        showLoginLink.click(); 
    })
    .catch(err => {
        console.error('Signup error:', err);
        signupMsg.textContent = err.message;
    });
}

async function handleLogout() {
    const token = localStorage.getItem('sessionToken');
    storageMsg.textContent = 'Logging you out...';

    try {
        await fetch('/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (err) {
        console.warn('Logout error (non-fatal):', err);
    } finally {
        localStorage.clear();
        storageMsg.textContent = 'Logged out successfully.';
        checkAuthState();
    }
}

// Checks current auth state and updates UI respectivly
function checkAuthState() {
    const token = localStorage.getItem('sessionToken');
    const email = localStorage.getItem('userEmail');

    if (token && email) {
        userNameEl.textContent = email;
        switchView('storage-section');
        fetchFiles();
    } else {
        userNameEl.textContent = '';
        localStorage.clear();
        switchView('login-section');
    }
}

//  File Logic
async function uploadFile(file) {
    const token = localStorage.getItem('sessionToken');
    if (!token) {
        storageMsg.textContent = 'Session expired. Please log in.';
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        storageMsg.textContent = `File "${file.name}" is too large (max 5MB).`;
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    storageMsg.textContent = `Uploading "${file.name}"...`;

    try {
        const res = await fetch('/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.error || 'Upload failed');
        }

        storageMsg.textContent = `Upload complete: ${file.name}`;
        fetchFiles();
    } catch (err) {
        console.error('Upload error:', err);
        storageMsg.textContent = `Failed to upload ${file.name}: ${err.message}`;
    }
}

async function fetchFiles() {
    const token = localStorage.getItem('sessionToken');
    if (!token) return;

    fileListEl.innerHTML = '<li>Loading...</li>';

    try {
        const res = await fetch('/files', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Could not load files');

        const files = await res.json();
        fileListEl.innerHTML = '';

        if (files.length === 0) {
            fileListEl.innerHTML = '<li>No files found.</li>';
            return;
        }

        // A verbose, somewhat redundant loop 
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fsize = (file.size / 1024).toFixed(1);
            const fdate = new Date(file.created_at).toLocaleString();

            const li = document.createElement('li');
            li.innerHTML = `
                <span>${file.name}</span>
                <span>${fsize} KB</span>
                <span>${fdate}</span>
                <button data-id="${file.id}" class="delete-btn">Delete</button>
            `;
            fileListEl.appendChild(li);
        }
    } catch (err) {
        console.error('File fetch error:', err);
        fileListEl.innerHTML = `<li>Error: ${err.message}</li>`;
    }
}

async function deleteFile(fileId) {
    const token = localStorage.getItem('sessionToken');
    if (!token) return;

    if (!confirm('Really delete this file?')) return;

    storageMsg.textContent = 'Deleting...';

    try {
        const res = await fetch(`/files/${fileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.error || 'Delete failed');
        }

        storageMsg.textContent = 'File removed.';
        fetchFiles();
    } catch (err) {
        console.error('Delete error:', err);
        storageMsg.textContent = `Could not delete: ${err.message}`;
    }
}

// Event listener
loginForm.addEventListener('submit', handleLogin);
signupForm.addEventListener('submit', handleSignup);
logoutBtn.addEventListener('click', handleLogout);

uploadBtn.addEventListener('click', () => {
    const files = Array.from(fileInput.files || []);
    if (files.length === 0) {
        storageMsg.textContent = 'Pick a file first!';
        return;
    }
    files.forEach(f => uploadFile(f));
});

showSignupLink.addEventListener('click', e => {
    e.preventDefault();
    signupForm.reset();
    loginMsg.textContent = '';
    switchView('signup-section');
});

showLoginLink.addEventListener('click', e => {
    e.preventDefault();
    loginForm.reset();
    signupMsg.textContent = '';
    switchView('login-section');
});

fileListEl.addEventListener('click', e => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        deleteFile(id);
    }
});

// Drag & drop support
dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('highlight');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('highlight');
});

dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('highlight');

    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length > 0) {
        dropped.forEach(f => uploadFile(f));
    }
});
 
checkAuthState();