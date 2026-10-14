// Main application entry point
import { AuthManager } from './auth.js';
import { WeatherManager } from './weather.js';
import { ChartsManager } from './charts.js';
import { FavoritesManager } from './favorites.js';
import { TravelPlansManager } from './travel-plans.js';
import { Utils } from './utils.js';

class App {
    constructor() {
        this.authManager = new AuthManager();
        this.weatherManager = new WeatherManager();
        this.chartsManager = new ChartsManager();
        this.favoritesManager = new FavoritesManager();
        this.travelPlansManager = new TravelPlansManager();
        this.utils = new Utils();
        
        this.init();
    }

    async init() {
        // Initialize all managers
        await this.authManager.init();
        this.weatherManager.init();
        this.chartsManager.init();
        this.favoritesManager.init();
        this.travelPlansManager.init();
        
        // Setup global event listeners
        this.setupEventListeners();
        
        // Check for initial location in URL params or localStorage
        this.checkInitialState();
        
        // Hide loading overlay after init
        setTimeout(() => {
            this.utils.hideLoading();
        }, 500);
    }

    setupEventListeners() {
        // Navigation toggle
        const navToggle = document.getElementById('navToggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                const navMenu = document.getElementById('navMenu');
                const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
                navToggle.setAttribute('aria-expanded', !isExpanded);
                navMenu.classList.toggle('active');
            });
        }

        // Close nav menu on link click
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                const navMenu = document.getElementById('navMenu');
                if (navMenu) navMenu.classList.remove('active');
            });
        });

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.utils.closeAllModals();
            }
            if (e.target.classList.contains('modal-close')) {
                this.utils.closeAllModals();
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.utils.closeAllModals();
            }
        });

        // Theme toggle (if implemented)
        // Handle geolocation
        if ('geolocation' in navigator) {
            const geoBtn = document.getElementById('useLocationBtn');
            if (geoBtn) {
                geoBtn.addEventListener('click', () => this.useCurrentLocation());
            }
        }
    }

    async checkInitialState() {
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const location = urlParams.get('location');
        if (location) {
            await this.weatherManager.searchAndDisplay(location);
            return;
        }

        // Check localStorage for last searched location
        const lastLocation = localStorage.getItem('lastSearchedLocation');
        if (lastLocation && window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            await this.weatherManager.searchAndDisplay(lastLocation);
        }
    }

    async useCurrentLocation() {
        try {
            this.utils.showLoading();
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                });
            });

            const { latitude, longitude } = position.coords;
            const locationQuery = `${latitude},${longitude}`;
            await this.weatherManager.searchAndDisplay(locationQuery);
            this.utils.showToast('Location detected successfully!', 'success');
        } catch (error) {
            console.error('Geolocation error:', error);
            let message = 'Failed to get your location';
            if (error.code === 1) {
                message = 'Location access denied. Please enable location permissions.';
            } else if (error.code === 2) {
                message = 'Location unavailable';
            }
            this.utils.showToast(message, 'error');
        } finally {
            this.utils.hideLoading();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});