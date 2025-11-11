// API Base URL
const API_URL = 'http://localhost:5000/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const dashboard = document.getElementById('dashboard');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');

// Toggle between login and register forms
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Show message function
function showMessage(elementId, message, type) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

// Register User
document.getElementById('register').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('registerMessage', 'Registration successful! Please login.', 'success');
            setTimeout(() => {
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            }, 2000);
        } else {
            showMessage('registerMessage', data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('registerMessage', 'Error connecting to server', 'error');
    }
});

// Login User
document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Save token to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            
            showMessage('loginMessage', 'Login successful!', 'success');
            
            setTimeout(() => {
                showDashboard(data);
            }, 1000);
        } else {
            showMessage('loginMessage', data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('loginMessage', 'Error connecting to server', 'error');
    }
});

// Show Dashboard
async function showDashboard(userData) {
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    dashboard.classList.remove('hidden');

    // Display user info
    document.getElementById('userName').textContent = userData.username;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('userRole').textContent = userData.role;

    // Load all users if admin
    if (userData.role === 'admin') {
        await loadAllUsers();
    } else {
        document.getElementById('usersListContainer').classList.add('hidden');
    }
}

// Load all users (admin only)
async function loadAllUsers() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const users = await response.json();

        if (response.ok) {
            const usersList = document.getElementById('usersList');
            usersList.innerHTML = users.map(user => `
                <div class="user-item">
                    <strong>${user.username}</strong> - ${user.email} 
                    <span style="float: right; color: #667eea;">${user.role}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dashboard.classList.add('hidden');
    loginForm.classList.remove('hidden');
    
    // Clear form fields
    document.getElementById('login').reset();
});

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        showDashboard(JSON.parse(user));
    }
});
