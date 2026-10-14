// Favorites manager
import { Utils } from './utils.js';

export class FavoritesManager {
    constructor() {
        this.utils = new Utils();
    }

    init() {
        // Only initialize if on relevant pages
        if (document.querySelector('.favorites-list') || document.querySelector('.quick-weather-grid')) {
            this.loadFavorites();
        }
    }

    async loadFavorites() {
        if (!this.utils.isAuthenticated()) return;
        
        try {
            // Load favorites with weather for dashboard
            const response = await this.utils.apiRequest('/favorites/with-weather');
            if (response.success) {
                this.displayFavorites(response.data);
                this.displayQuickWeather(response.data);
                this.updateFavoritesCount(response.data.length);
            }
        } catch (error) {
            console.error('Load favorites error:', error);
        }
    }

    displayFavorites(favorites) {
        const favoritesList = document.getElementById('favoritesList');
        if (!favoritesList) return;
        
        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p class="text-muted" style="padding: 1rem; text-align: center;">No favorites yet</p>';
            return;
        }
        
        favoritesList.innerHTML = '';
        favorites.forEach(fav => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.innerHTML = `
                <div class="favorite-name">${this.utils.escapeHtml(fav.location_name)}</div>
                <div class="favorite-country">${this.utils.escapeHtml(fav.country)}</div>
            `;
            
            item.addEventListener('click', () => {
                // Search for this location
                const location = `${fav.location_name},${fav.country}`;
                window.location.href = `index.html?location=${encodeURIComponent(location)}`;
            });
            
            favoritesList.appendChild(item);
        });
    }

    displayQuickWeather(favorites) {
        const quickWeatherGrid = document.getElementById('quickWeatherGrid');
        if (!quickWeatherGrid) return;
        
        if (favorites.length === 0) {
            quickWeatherGrid.innerHTML = '<p class="text-muted" style="padding: 1rem; text-align: center;">No favorites to show weather for</p>';
            return;
        }
        
        quickWeatherGrid.innerHTML = '';
        favorites.slice(0, 6).forEach(fav => {
            const item = document.createElement('div');
            item.className = 'quick-weather-item';
            if (fav.weather) {
                item.innerHTML = `
                    <div class="quick-weather-location">
                        <div class="quick-weather-loc-name">${this.utils.escapeHtml(fav.location_name)}</div>
                        <div class="quick-weather-loc-country">${this.utils.escapeHtml(fav.country)}</div>
                    </div>
                    <div class="quick-weather-info">
                        <div class="quick-weather-temp">${this.utils.formatTemp(fav.weather.current.temperature, 'celsius')}</div>
                        <div class="quick-weather-cond">${fav.weather.current.condition.text}</div>
                    </div>
                `;
            } else {
                item.innerHTML = `
                    <div class="quick-weather-location">
                        <div class="quick-weather-loc-name">${this.utils.escapeHtml(fav.location_name)}</div>
                        <div class="quick-weather-loc-country">${this.utils.escapeHtml(fav.country)}</div>
                    </div>
                    <div class="quick-weather-info">
                        <div class="quick-weather-cond">N/A</div>
                    </div>
                `;
            }
            
            item.addEventListener('click', () => {
                const location = `${fav.location_name},${fav.country}`;
                window.location.href = `index.html?location=${encodeURIComponent(location)}`;
            });
            
            quickWeatherGrid.appendChild(item);
        });
    }

    updateFavoritesCount(count) {
        const favoritesCount = document.getElementById('favoritesCount');
        if (favoritesCount) {
            favoritesCount.textContent = count;
        }
    }

    async addFavorite(favoriteData) {
        try {
            const response = await this.utils.apiRequest('/favorites', {
                method: 'POST',
                body: JSON.stringify(favoriteData),
            });
            if (response.success) {
                this.loadFavorites();
                return response.data;
            }
        } catch (error) {
            throw error;
        }
    }

    async removeFavorite(favoriteId) {
        try {
            const response = await this.utils.apiRequest(`/favorites/${favoriteId}`, {
                method: 'DELETE',
            });
            if (response.status === 204 || response.success) {
                this.loadFavorites();
                return true;
            }
        } catch (error) {
            throw error;
        }
    }
}