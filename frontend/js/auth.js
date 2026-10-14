// Authentication manager
import { Utils } from './utils.js';

export class AuthManager {
    constructor() {
        this.utils = new Utils();
        this.currentUser = this.utils.getCurrentUser();
    }

    async init() {
        // Update UI based on auth state
        this.updateNavUI();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAuthTab(e));
        });

        // Switch tab links
        document.querySelectorAll('.switch-tab').forEach(link => {
            link.addEventListener('click', (e) => {
                const target = e.target.dataset.tab;
                this.switchAuthTabTo(target);
            });
        });

        // Sign in button in nav
        document.addEventListener('click', (e) => {
            if (e.target.id === 'signInBtn' || e.target.closest('#signInBtn')) {
                this.utils.openModal('authModal');
            }
            if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
                this.handleLogout();
            }
        });

        // Password strength checker
        const registerPassword = document.getElementById('registerPassword');
        if (registerPassword) {
            registerPassword.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
        }
    }

    switchAuthTab(e) {
        const tab = e.target;
        const target = tab.dataset.tab;
        this.switchAuthTabTo(target);
    }

    switchAuthTabTo(target) {
        // Update tabs
        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === target);
            t.setAttribute('aria-selected', t.dataset.tab === target);
        });

        // Update forms
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const modalTitle = document.getElementById('authModalTitle');
        
        if (target === 'login') {
            loginForm.removeAttribute('hidden');
            registerForm.setAttribute('hidden', true);
            if (modalTitle) modalTitle.textContent = 'Sign In';
        } else {
            loginForm.setAttribute('hidden', true);
            registerForm.removeAttribute('hidden');
            if (modalTitle) modalTitle.textContent = 'Sign Up';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await this.utils.apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (response.success) {
                this.currentUser = response.data.user;
                this.utils.setCurrentUser(this.currentUser);
                this.utils.closeModal('authModal');
                this.updateNavUI();
                this.utils.showToast('Login successful!', 'success');
                form.reset();
                
                // Redirect to dashboard if on auth page or reload
                if (window.location.pathname.includes('login') || window.location.pathname.includes('register')) {
                    window.location.href = 'dashboard.html';
                } else {
                    // Reload to update UI
                    window.location.reload();
                }
            }
        } catch (error) {
            this.utils.showToast(error.message || 'Login failed', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validate passwords match
        if (data.password !== data.confirmPassword) {
            this.utils.showToast('Passwords do not match', 'error');
            return;
        }

        try {
            const response = await this.utils.apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (response.success) {
                this.currentUser = response.data.user;
                this.utils.setCurrentUser(this.currentUser);
                this.utils.closeModal('authModal');
                this.updateNavUI();
                this.utils.showToast('Registration successful! Welcome!', 'success');
                form.reset();
                window.location.reload();
            }
        } catch (error) {
            this.utils.showToast(error.message || 'Registration failed', 'error');
        }
    }

    async handleLogout() {
        try {
            await this.utils.apiRequest('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.currentUser = null;
            this.utils.setCurrentUser(null);
            this.updateNavUI();
            this.utils.showToast('Logged out successfully', 'success');
            
            // Redirect to home if on protected page
            if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('travel-plans')) {
                window.location.href = 'index.html';
            } else {
                window.location.reload();
            }
        }
    }

    updateNavUI() {
        const navActions = document.getElementById('navActions');
        if (!navActions) return;

        if (this.currentUser) {
            navActions.innerHTML = `
                <span class="nav-user">Hi, ${this.utils.escapeHtml(this.currentUser.name)}</span>
                <a href="dashboard.html" class="btn btn-outline btn-sm">Dashboard</a>
                <button class="btn btn-secondary btn-sm" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            `;
        } else {
            navActions.innerHTML = `
                <button class="btn btn-outline btn-sm" id="signInBtn">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
            `;
        }
    }

    checkPasswordStrength(password) {
        const strengthIndicator = document.querySelector('.password-strength');
        if (!strengthIndicator) return;

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#059669'];

        if (password.length === 0) {
            strengthIndicator.textContent = '';
        } else {
            strengthIndicator.textContent = levels[strength] || 'Weak';
            strengthIndicator.style.color = colors[strength] || '#ef4444';
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}