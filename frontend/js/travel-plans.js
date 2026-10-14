// Travel plans manager
import { Utils } from './utils.js';

export class TravelPlansManager {
    constructor() {
        this.utils = new Utils();
        this.currentPlanId = null;
        this.currentFilter = 'all';
    }

    init() {
        // Only init on travel plans page
        if (window.location.pathname.includes('travel-plans')) {
            this.setupEventListeners();
            this.loadTravelPlans();
            this.setupDateConstraints();
        }
    }

    setupEventListeners() {
        // New plan button
        const newPlanBtn = document.getElementById('newPlanBtn');
        if (newPlanBtn) {
            newPlanBtn.addEventListener('click', () => this.openPlanModal());
        }

        // Create first plan button
        const createFirstPlanBtn = document.getElementById('createFirstPlanBtn');
        if (createFirstPlanBtn) {
            createFirstPlanBtn.addEventListener('click', () => this.openPlanModal());
        }

        // Plan form
        const planForm = document.getElementById('planForm');
        if (planForm) {
            planForm.addEventListener('submit', (e) => this.handlePlanSubmit(e));
        }

        // Cancel plan
        const cancelPlan = document.getElementById('cancelPlan');
        if (cancelPlan) {
            cancelPlan.addEventListener('click', () => this.utils.closeModal('planModal'));
        }

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleFilter(e));
        });

        // Delete modal
        const cancelDelete = document.getElementById('cancelDelete');
        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => this.utils.closeModal('deleteModal'));
        }
        const confirmDelete = document.getElementById('confirmDelete');
        if (confirmDelete) {
            confirmDelete.addEventListener('click', () => this.confirmDelete());
        }

        // Destination search in plan form
        const planDestination = document.getElementById('planDestination');
        if (planDestination) {
            planDestination.addEventListener('input', this.utils.debounce((e) => 
                this.searchLocationsForPlan(e.target.value), 300));
        }

        // Date change for forecast preview
        const startDate = document.getElementById('planStartDate');
        const endDate = document.getElementById('planEndDate');
        if (startDate) {
            startDate.addEventListener('change', () => this.updateForecastPreview());
        }
        if (endDate) {
            endDate.addEventListener('change', () => this.updateForecastPreview());
        }
    }

    setupDateConstraints() {
        const today = new Date();
        const todayStr = this.utils.formatDateInput(today);
        const startDate = document.getElementById('planStartDate');
        const endDate = document.getElementById('planEndDate');
        
        if (startDate) {
            startDate.min = todayStr;
        }
        if (endDate) {
            endDate.min = todayStr;
        }
        
        if (startDate && endDate) {
            startDate.addEventListener('change', () => {
                endDate.min = startDate.value;
                if (endDate.value < startDate.value) {
                    endDate.value = '';
                }
            });
        }
    }

    openPlanModal(plan = null) {
        const modalTitle = document.getElementById('planModalTitle');
        const planId = document.getElementById('planId');
        const planDestination = document.getElementById('planDestination');
        const planCountry = document.getElementById('planCountry');
        const planStartDate = document.getElementById('planStartDate');
        const planEndDate = document.getElementById('planEndDate');
        const planNotes = document.getElementById('planNotes');
        const submitBtn = document.getElementById('submitPlan');
        
        if (plan) {
            // Edit mode
            this.currentPlanId = plan.id;
            modalTitle.textContent = 'Edit Travel Plan';
            planId.value = plan.id;
            planDestination.value = plan.destination;
            planCountry.value = plan.destination_country || '';
            planStartDate.value = plan.start_date;
            planEndDate.value = plan.end_date;
            planNotes.value = plan.notes || '';
            submitBtn.querySelector('.btn-text').textContent = 'Update Plan';
        } else {
            // Create mode
            this.currentPlanId = null;
            modalTitle.textContent = 'Create Travel Plan';
            planId.value = '';
            planDestination.value = '';
            planCountry.value = '';
            planStartDate.value = '';
            planEndDate.value = '';
            planNotes.value = '';
            submitBtn.querySelector('.btn-text').textContent = 'Create Plan';
        }
        
        this.utils.openModal('planModal');
        this.updateForecastPreview();
    }

    async handlePlanSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Remove empty fields
        Object.keys(data).forEach(key => {
            if (data[key] === '') {
                delete data[key];
            }
        });
        
        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            
            let response;
            if (this.currentPlanId) {
                response = await this.utils.apiRequest(`/travel-plans/${this.currentPlanId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            } else {
                response = await this.utils.apiRequest('/travel-plans', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            }
            
            if (response.success) {
                this.utils.closeModal('planModal');
                this.utils.showToast(this.currentPlanId ? 'Plan updated!' : 'Plan created!', 'success');
                this.loadTravelPlans();
            }
        } catch (error) {
            this.utils.showToast(error.message || 'Failed to save plan', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
            }
        }
    }

    async loadTravelPlans() {
        if (!this.utils.isAuthenticated()) {
            this.utils.showToast('Please sign in to view travel plans', 'info');
            this.utils.openModal('authModal');
            return;
        }
        
        try {
            const statusParam = this.currentFilter !== 'all' ? `&status=${this.currentFilter}` : '';
            const response = await this.utils.apiRequest(`/travel-plans?page=1&limit=20${statusParam}`);
            
            if (response.success) {
                this.displayTravelPlans(response.data);
                
                const emptyState = document.getElementById('plansEmptyState');
                if (emptyState) {
                    if (response.data.length === 0) {
                        emptyState.removeAttribute('hidden');
                    } else {
                        emptyState.setAttribute('hidden', true);
                    }
                }
            }
        } catch (error) {
            this.utils.showToast(error.message, 'error');
        }
    }

    displayTravelPlans(plans) {
        const plansGrid = document.getElementById('plansGrid');
        if (!plansGrid) return;
        
        plansGrid.innerHTML = '';
        
        plans.forEach(plan => {
            const isUpcoming = new Date(plan.end_date) >= new Date();
            const startDate = this.utils.formatShortDate(plan.start_date);
            const endDate = this.utils.formatShortDate(plan.end_date);
            
            const card = document.createElement('div');
            card.className = `travel-plan-card ${isUpcoming ? 'upcoming' : 'past'}`;
            card.innerHTML = `
                <div class="travel-plan-header">
                    <div>
                        <div class="travel-plan-dest">${this.utils.escapeHtml(plan.destination)}</div>
                        <div class="travel-plan-country">${this.utils.escapeHtml(plan.destination_country || '')}</div>
                    </div>
                    <div class="travel-plan-actions">
                        <button class="btn btn-outline btn-sm edit-plan" data-plan='${JSON.stringify(plan)}'>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-plan" data-id="${plan.id}" data-name="${plan.destination}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="travel-plan-status ${isUpcoming ? 'upcoming' : 'past'}">
                    ${isUpcoming ? 'Upcoming' : 'Past'}
                </div>
                
                <div class="travel-plan-dates">
                    <i class="fas fa-calendar"></i> ${startDate} - ${endDate}
                </div>
                
                ${plan.notes ? `
                    <div class="travel-plan-notes">
                        ${this.utils.escapeHtml(plan.notes)}
                    </div>
                ` : ''}
            `;
            
            plansGrid.appendChild(card);
        });
        
        // Add event listeners
        document.querySelectorAll('.edit-plan').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const plan = JSON.parse(e.target.closest('.edit-plan').dataset.plan);
                this.openPlanModal(plan);
            });
        });
        
        document.querySelectorAll('.delete-plan').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.delete-plan').dataset.id;
                const name = e.target.closest('.delete-plan').dataset.name;
                this.openDeleteModal(id, name);
            });
        });
    }

    handleFilter(e) {
        const tab = e.target;
        this.currentFilter = tab.dataset.filter;
        
        document.querySelectorAll('.filter-tab').forEach(t => {
            t.classList.toggle('active', t === tab);
            t.setAttribute('aria-selected', t === tab);
        });
        
        this.loadTravelPlans();
    }

    openDeleteModal(id, name) {
        this.currentPlanId = id;
        const deletePlanName = document.getElementById('deletePlanName');
        if (deletePlanName) {
            deletePlanName.textContent = name;
        }
        this.utils.openModal('deleteModal');
    }

    async confirmDelete() {
        try {
            const response = await this.utils.apiRequest(`/travel-plans/${this.currentPlanId}`, {
                method: 'DELETE',
            });
            
            if (response.status === 204 || response.success) {
                this.utils.closeModal('deleteModal');
                this.utils.showToast('Plan deleted', 'success');
                this.loadTravelPlans();
            }
        } catch (error) {
            this.utils.showToast(error.message || 'Failed to delete plan', 'error');
        }
    }

    async searchLocationsForPlan(query) {
        const element = document.getElementById('planDestinationSuggestions');
        if (!element) return;
        
        if (query.length < 2) {
            element.setAttribute('hidden', true);
            element.innerHTML = '';
            return;
        }
        
        try {
            const response = await this.utils.apiRequest(`/weather/search?query=${encodeURIComponent(query)}`);
            if (response.success) {
                element.innerHTML = '';
                response.data.forEach(loc => {
                    const item = document.createElement('div');
                    item.className = 'search-suggestion-item';
                    item.textContent = `${loc.name}, ${loc.country}`;
                    item.addEventListener('click', () => {
                        document.getElementById('planDestination').value = loc.name;
                        document.getElementById('planCountry').value = loc.country;
                        element.setAttribute('hidden', true);
                        element.innerHTML = '';
                        this.updateForecastPreview();
                    });
                    element.appendChild(item);
                });
                element.removeAttribute('hidden');
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    updateForecastPreview() {
        const startDate = document.getElementById('planStartDate').value;
        const endDate = document.getElementById('planEndDate').value;
        const destination = document.getElementById('planDestination').value;
        const preview = document.getElementById('forecastPreview');
        const content = document.getElementById('forecastPreviewContent');
        
        if (!preview || !content) return;
        
        if (!startDate || !endDate || !destination) {
            preview.setAttribute('hidden', true);
            return;
        }
        
        // Show preview with message
        preview.removeAttribute('hidden');
        content.innerHTML = `
            <p class="text-muted">Forecast for ${destination} during ${this.utils.formatShortDate(startDate)} - ${this.utils.formatShortDate(endDate)} will be shown after saving.</p>
        `;
    }
}