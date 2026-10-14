// Dashboard manager
import { Utils } from './utils.js';

export class DashboardManager {
    constructor() {
        this.utils = new Utils();
    }

    init() {
        if (window.location.pathname.includes('dashboard')) {
            this.setupEventListeners();
            this.loadDashboard();
        }
    }

    setupEventListeners() {
        // Dashboard search
        const dashboardSearchForm = document.getElementById('dashboardSearchForm');
        if (dashboardSearchForm) {
            dashboardSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('dashboardSearchInput');
                if (input.value.trim()) {
                    window.location.href = `index.html?location=${encodeURIComponent(input.value.trim())}`;
                }
            });
        }
    }

    async loadDashboard() {
        if (!this.utils.isAuthenticated()) {
            this.utils.showToast('Please sign in to view dashboard', 'info');
            this.utils.openModal('authModal');
            return;
        }
        
        try {
            const response = await this.utils.apiRequest('/dashboard');
            if (response.success) {
                this.updateUserInfo(response.data.user);
                this.updateStats(response.data.stats);
                this.displayUpcomingPlans(response.data.travelPlans.upcoming);
                this.displayPastPlans(response.data.travelPlans.past);
                // Favorites and recent searches are loaded by their respective managers
            }
        } catch (error) {
            this.utils.showToast(error.message, 'error');
        }
    }

    updateUserInfo(user) {
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = user.name;
        }
    }

    updateStats(stats) {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid) return;
        
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-heart"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.favorites_count}</div>
                    <div class="stat-label">Favorites</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon success">
                    <i class="fas fa-plane-departure"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.upcoming_plans_count}</div>
                    <div class="stat-label">Upcoming Trips</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon warning">
                    <i class="fas fa-plane-arrival"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.past_plans_count}</div>
                    <div class="stat-label">Past Trips</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon info">
                    <i class="fas fa-search"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${stats.searches_count}</div>
                    <div class="stat-label">Searches</div>
                </div>
            </div>
        `;
    }

    displayUpcomingPlans(plans) {
        const upcomingPlans = document.getElementById('upcomingPlans');
        if (!upcomingPlans) return;
        
        if (plans.length === 0) {
            upcomingPlans.innerHTML = '<p class="text-muted">No upcoming trips</p>';
            return;
        }
        
        upcomingPlans.innerHTML = '';
        plans.forEach(plan => {
            const startDate = this.utils.formatShortDate(plan.start_date);
            const endDate = this.utils.formatShortDate(plan.end_date);
            
            const item = document.createElement('div');
            item.className = 'plan-item';
            item.innerHTML = `
                <div class="plan-destination">${this.utils.escapeHtml(plan.destination)}</div>
                <div class="plan-dates">${startDate} - ${endDate}</div>
                ${plan.notes ? `<div class="plan-notes">${this.utils.escapeHtml(plan.notes)}</div>` : ''}
            `;
            upcomingPlans.appendChild(item);
        });
    }

    displayPastPlans(plans) {
        const pastPlans = document.getElementById('pastPlans');
        if (!pastPlans) return;
        
        if (plans.length === 0) {
            pastPlans.innerHTML = '<p class="text-muted">No past trips</p>';
            return;
        }
        
        pastPlans.innerHTML = '';
        plans.forEach(plan => {
            const startDate = this.utils.formatShortDate(plan.start_date);
            const endDate = this.utils.formatShortDate(plan.end_date);
            
            const item = document.createElement('div');
            item.className = 'plan-item';
            item.innerHTML = `
                <div class="plan-destination">${this.utils.escapeHtml(plan.destination)}</div>
                <div class="plan-dates">${startDate} - ${endDate}</div>
                ${plan.notes ? `<div class="plan-notes">${this.utils.escapeHtml(plan.notes)}</div>` : ''}
            `;
            pastPlans.appendChild(item);
        });
    }
}