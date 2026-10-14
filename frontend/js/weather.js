// Weather manager
import { Utils } from './utils.js';
import { FavoritesManager } from './favorites.js';

export class WeatherManager {
    constructor() {
        this.utils = new Utils();
        this.favoritesManager = new FavoritesManager();
        this.currentWeather = null;
        this.currentUnit = 'celsius';
        this.comparisonLocations = [];
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Hero search form
        const heroSearchForm = document.getElementById('heroSearchForm');
        if (heroSearchForm) {
            heroSearchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        // Dashboard search form
        const dashboardSearchForm = document.getElementById('dashboardSearchForm');
        if (dashboardSearchForm) {
            dashboardSearchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        // Search inputs with suggestions
        const heroSearchInput = document.getElementById('heroSearchInput');
        const dashboardSearchInput = document.getElementById('dashboardSearchInput');
        
        if (heroSearchInput) {
            heroSearchInput.addEventListener('input', this.utils.debounce((e) => this.searchLocations(e.target.value, 'searchSuggestions'), 300));
        }
        if (dashboardSearchInput) {
            dashboardSearchInput.addEventListener('input', this.utils.debounce((e) => this.searchLocations(e.target.value, 'dashboardSearchSuggestions'), 300));
        }

        // Unit toggle
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleUnitToggle(e));
        });

        // Add to favorites
        const addToFavoritesBtn = document.getElementById('addToFavoritesBtn');
        if (addToFavoritesBtn) {
            addToFavoritesBtn.addEventListener('click', () => this.addToFavorites());
        }

        // Toggle hourly
        const toggleHourlyBtn = document.getElementById('toggleHourly');
        if (toggleHourlyBtn) {
            toggleHourlyBtn.addEventListener('click', () => this.toggleHourly());
        }

        // Popular destinations
        document.querySelectorAll('.popular-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const location = e.target.dataset.location;
                if (heroSearchInput) heroSearchInput.value = location;
                this.searchAndDisplay(location);
            });
        });

        // Add comparison
        const addComparisonBtn = document.getElementById('addComparisonBtn');
        if (addComparisonBtn) {
            addComparisonBtn.addEventListener('click', () => {
                this.utils.openModal('comparisonModal');
            });
        }

        // Comparison form
        const comparisonForm = document.getElementById('comparisonForm');
        if (comparisonForm) {
            comparisonForm.addEventListener('submit', (e) => this.handleComparisonAdd(e));
        }

        // Comparison search
        const comparisonSearch = document.getElementById('comparisonSearch');
        if (comparisonSearch) {
            comparisonSearch.addEventListener('input', this.utils.debounce((e) => this.searchLocations(e.target.value, 'comparisonSuggestions'), 300));
        }

        // Cancel comparison
        const cancelComparison = document.getElementById('cancelComparison');
        if (cancelComparison) {
            cancelComparison.addEventListener('click', () => {
                this.utils.closeModal('comparisonModal');
            });
        }
    }

    async handleSearch(e) {
        e.preventDefault();
        const form = e.target;
        const input = form.querySelector('.search-input');
        const query = input.value.trim();
        
        if (!query) {
            this.utils.showToast('Please enter a location', 'warning');
            return;
        }
        
        this.utils.showLoading();
        await this.searchAndDisplay(query);
        this.utils.hideLoading();
        
        // Clear suggestions
        document.querySelectorAll('.search-suggestions').forEach(s => {
            s.setAttribute('hidden', true);
            s.innerHTML = '';
        });
    }

    async searchAndDisplay(location) {
        try {
            const response = await this.utils.apiRequest(`/weather/current?location=${encodeURIComponent(location)}&unit=${this.currentUnit}`);
            
            if (response.success) {
                this.currentWeather = response.data;
                this.displayCurrentWeather(response.data);
                
                // Get forecast
                await this.getAndDisplayForecast(location);
                
                // Show weather section
                const weatherSection = document.getElementById('weatherSection');
                const emptyState = document.getElementById('emptyState');
                if (weatherSection) weatherSection.removeAttribute('hidden');
                if (emptyState) emptyState.setAttribute('hidden', true);
                
                // Save to localStorage
                localStorage.setItem('lastSearchedLocation', location);
            }
        } catch (error) {
            this.utils.showToast(error.message || 'Failed to fetch weather data', 'error');
        }
    }

    async getAndDisplayForecast(location) {
        try {
            const response = await this.utils.apiRequest(`/weather/forecast?location=${encodeURIComponent(location)}&unit=${this.currentUnit}&days=3`);
            
            if (response.success) {
                this.displayForecast(response.data);
                this.displayHourly(response.data);
                this.displaySuggestions(response.data);
                this.chartsManager.renderWeatherCharts(response.data);
            }
        } catch (error) {
            console.error('Forecast error:', error);
        }
    }

    displayCurrentWeather(data) {
        const locationName = document.getElementById('locationName');
        const locationCountry = document.getElementById('locationCountry');
        const temperature = document.getElementById('temperature');
        const conditionText = document.getElementById('conditionText');
        const weatherIcon = document.getElementById('weatherIcon');
        const weatherDetails = document.getElementById('weatherDetails');
        const lastUpdated = document.getElementById('lastUpdated');
        
        if (locationName) locationName.textContent = data.location.name;
        if (locationCountry) locationCountry.textContent = `${data.location.country}, ${data.location.region || ''}`.replace(', ', '');
        if (temperature) temperature.textContent = this.utils.formatTemp(data.current.temperature, this.currentUnit);
        if (conditionText) conditionText.textContent = data.current.condition.text;
        if (weatherIcon) {
            weatherIcon.src = `https:${data.current.condition.icon}`;
            weatherIcon.alt = data.current.condition.text;
        }
        if (lastUpdated) lastUpdated.textContent = this.utils.formatTime(data.current.lastUpdated);
        
        // Weather details
        if (weatherDetails) {
            weatherDetails.innerHTML = `
                <div class="weather-detail-item">
                    <i class="fas fa-temperature-high weather-detail-icon"></i>
                    <div class="weather-detail-content">
                        <div class="weather-detail-label">Feels Like</div>
                        <div class="weather-detail-value">${this.utils.formatTemp(data.current.feelsLike, this.currentUnit)}</div>
                    </div>
                </div>
                <div class="weather-detail-item">
                    <i class="fas fa-water weather-detail-icon"></i>
                    <div class="weather-detail-content">
                        <div class="weather-detail-label">Humidity</div>
                        <div class="weather-detail-value">${data.current.humidity}%</div>
                    </div>
                </div>
                <div class="weather-detail-item">
                    <i class="fas fa-wind weather-detail-icon"></i>
                    <div class="weather-detail-content">
                        <div class="weather-detail-label">Wind</div>
                        <div class="weather-detail-value">${data.current.wind.speed} km/h ${data.current.wind.direction}</div>
                    </div>
                </div>
                <div class="weather-detail-item">
                    <i class="fas fa-compass weather-detail-icon"></i>
                    <div class="weather-detail-content">
                        <div class="weather-detail-label">Pressure</div>
                        <div class="weather-detail-value">${data.current.pressure.mb} mb</div>
                    </div>
                </div>
                <div class="weather-detail-item">
                    <i class="fas fa-eye weather-detail-icon"></i>
                    <div class="weather-detail-content">
                        <div class="weather-detail-label">Visibility</div>
                        <div class="weather-detail-value">${data.current.visibility.km} km</div>
                    </div>
                </div>
                <div class="weather-detail-item">
                    <i class="fas fa-sun weather-detail-icon"></i>
                    <div class="weather-detail-content">
                        <div class="weather-detail-label">UV Index</div>
                        <div class="weather-detail-value">${data.current.uvIndex}</div>
                    </div>
                </div>
            `;
        }
    }

    displayForecast(data) {
        const forecastContainer = document.getElementById('forecastContainer');
        if (!forecastContainer) return;
        
        forecastContainer.innerHTML = '';
        
        data.forecast.forEach(day => {
            const dayName = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' });
            const date = new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
            const card = document.createElement('div');
            card.className = 'forecast-card';
            card.innerHTML = `
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-date">${date}</div>
                <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" class="forecast-icon">
                <div class="forecast-condition">${day.day.condition.text}</div>
                <div class="forecast-temp">
                    <span class="forecast-temp-max">${this.utils.formatTemp(day.day.maxTemp, this.currentUnit)}</span>
                    <span class="forecast-temp-min">${this.utils.formatTemp(day.day.minTemp, this.currentUnit)}</span>
                </div>
                <div class="forecast-rain">Rain: ${day.day.dailyChanceOfRain}%</div>
            `;
            
            forecastContainer.appendChild(card);
        });
    }

    displayHourly(data) {
        const hourlySection = document.querySelector('.hourly-section');
        const hourlyContainer = document.getElementById('hourlyContainer');
        const toggleHourlyBtn = document.getElementById('toggleHourly');
        
        if (!hourlySection || !hourlyContainer) return;
        
        // Get today's hours (next 12 hours)
        const today = data.forecast[0];
        if (!today || !today.hours) return;
        
        hourlyContainer.innerHTML = '';
        
        // Take next 12 hours starting from current hour
        const currentHour = new Date().getHours();
        let hoursToShow = [];
        today.hours.forEach(hour => {
            const hourTime = new Date(hour.time).getHours();
            if (hourTime >= currentHour && hoursToShow.length < 12) {
                hoursToShow.push(hour);
            }
        });
        
        // If not enough hours today, add from tomorrow
        if (hoursToShow.length < 12 && data.forecast[1]) {
            data.forecast[1].hours.forEach(hour => {
                if (hoursToShow.length < 12) {
                    hoursToShow.push(hour);
                }
            });
        }
        
        hoursToShow.forEach(hour => {
            const time = new Date(hour.time).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
            });
            
            const card = document.createElement('div');
            card.className = 'hourly-card';
            card.innerHTML = `
                <div class="hourly-time">${time}</div>
                <img src="https:${hour.condition.icon}" alt="${hour.condition.text}" class="hourly-icon">
                <div class="hourly-temp">${this.utils.formatTemp(hour.temperature, this.currentUnit)}</div>
                <div class="hourly-rain">${hour.chanceOfRain}%</div>
            `;
            
            hourlyContainer.appendChild(card);
        });
        
        hourlySection.removeAttribute('hidden');
    }

    toggleHourly() {
        const hourlyContainer = document.getElementById('hourlyContainer');
        const toggleBtn = document.getElementById('toggleHourly');
        
        if (!hourlyContainer) return;
        
        if (hourlyContainer.style.display === 'none') {
            hourlyContainer.style.display = 'flex';
            toggleBtn.textContent = 'Hide Hours';
        } else {
            hourlyContainer.style.display = 'none';
            toggleBtn.textContent = 'Show Hours';
        }
    }

    displaySuggestions(data) {
        const suggestionsGrid = document.getElementById('suggestionsGrid');
        if (!suggestionsGrid) return;
        
        suggestionsGrid.innerHTML = '';
        
        const current = data.forecast[0].day;
        const temp = current.avgTemp;
        const condition = current.condition.text.toLowerCase();
        const rainChance = current.dailyChanceOfRain;
        const windSpeed = current.maxWind;
        
        const suggestions = this.getTravelSuggestions(temp, condition, rainChance, windSpeed, this.currentUnit);
        
        suggestions.forEach(suggestion => {
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.innerHTML = `
                <div class="suggestion-title">
                    <i class="fas ${suggestion.icon}"></i>
                    ${suggestion.title}
                </div>
                <ul class="suggestion-list">
                    ${suggestion.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `;
            
            suggestionsGrid.appendChild(card);
        });
    }

    getTravelSuggestions(temp, condition, rainChance, windSpeed, unit) {
        const tempC = unit === 'fahrenheit' ? (temp - 32) * 5/9 : temp;
        const suggestions = [];
        
        // Weather-based suggestions
        if (condition.includes('sunny') || condition.includes('clear')) {
            suggestions.push({
                title: 'Perfect for Outdoor Activities',
                icon: 'fa-sun',
                items: [
                    'Go sightseeing and explore landmarks',
                    'Visit parks and gardens',
                    'Plan beach activities or hiking',
                    'Take photographs and enjoy the sunshine'
                ]
            });
        }
        
        if (condition.includes('rain') || rainChance > 50) {
            suggestions.push({
                title: 'Great for Indoor Activities',
                icon: 'fa-umbrella',
                items: [
                    'Visit museums and art galleries',
                    'Explore shopping malls',
                    'Enjoy local cafes and restaurants',
                    'Plan indoor entertainment'
                ]
            });
        }
        
        if (tempC > 30) {
            suggestions.push({
                title: 'Hot Weather Tips',
                icon: 'fa-thermometer-high',
                items: [
                    'Stay hydrated - drink plenty of water',
                    'Visit air-conditioned indoor spaces',
                    'Avoid direct sun during peak hours',
                    'Wear light, breathable clothing'
                ]
            });
        }
        
        if (tempC < 10) {
            suggestions.push({
                title: 'Cold Weather Tips',
                icon: 'fa-thermometer-low',
                items: [
                    'Dress in layers with warm clothing',
                    'Enjoy indoor attractions and cafes',
                    'Plan for shorter outdoor walks',
                    'Keep warm with hot beverages'
                ]
            });
        }
        
        if (windSpeed > 30) {
            suggestions.push({
                title: 'Wind Advisory',
                icon: 'fa-wind',
                items: [
                    'Avoid exposed outdoor activities',
                    'Be cautious with outdoor equipment',
                    'Consider indoor alternatives',
                    'Wear windproof clothing'
                ]
            });
        }
        
        return suggestions.length > 0 ? suggestions : [{
            title: 'General Recommendations',
            icon: 'fa-calendar-check',
            items: [
                'Check local attractions and events',
                'Plan flexible activities',
                'Bring appropriate weather gear'
            ]
        }];
    }

    async addToFavorites() {
        if (!this.utils.isAuthenticated()) {
            this.utils.showToast('Please sign in to save favorites', 'info');
            this.utils.openModal('authModal');
            return;
        }
        
        if (!this.currentWeather) {
            this.utils.showToast('No location selected', 'warning');
            return;
        }
        
        try {
            const data = {
                locationName: this.currentWeather.location.name,
                country: this.currentWeather.location.country,
                region: this.currentWeather.location.region,
            };
            
            const response = await this.utils.apiRequest('/favorites', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            
            if (response.success) {
                this.utils.showToast('Added to favorites!', 'success');
            }
        } catch (error) {
            if (error.message.includes('already')) {
                this.utils.showToast('Already in favorites', 'info');
            } else {
                this.utils.showToast(error.message || 'Failed to add to favorites', 'error');
            }
        }
    }

    async searchLocations(query, suggestionsElementId) {
        const element = document.getElementById(suggestionsElementId);
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
                        // Fill input and search
                        const input = element.parentElement.querySelector('.search-input');
                        if (input) input.value = `${loc.name}, ${loc.country}`;
                        element.setAttribute('hidden', true);
                        element.innerHTML = '';
                        this.searchAndDisplay(`${loc.name}, ${loc.country}`);
                    });
                    element.appendChild(item);
                });
                element.removeAttribute('hidden');
            }
        } catch (error) {
            console.error('Search locations error:', error);
        }
    }

    handleUnitToggle(e) {
        const btn = e.target;
        this.currentUnit = btn.dataset.unit;
        
        document.querySelectorAll('.unit-btn').forEach(b => {
            b.classList.toggle('active', b === btn);
            b.setAttribute('aria-pressed', b === btn);
        });
        
        // Re-render if weather is loaded
        if (this.currentWeather) {
            this.displayCurrentWeather(this.currentWeather);
        }
    }

    async handleComparisonAdd(e) {
        e.preventDefault();
        const searchInput = document.getElementById('comparisonSearch');
        const location = searchInput.value.trim();
        
        if (!location) return;
        
        try {
            const response = await this.utils.apiRequest(`/weather/current?location=${encodeURIComponent(location)}&unit=${this.currentUnit}`);
            if (response.success) {
                this.comparisonLocations.push(response.data);
                this.displayComparison();
                searchInput.value = '';
                document.getElementById('comparisonSuggestions').setAttribute('hidden', true);
                this.utils.closeModal('comparisonModal');
            }
        } catch (error) {
            this.utils.showToast(error.message, 'error');
        }
    }

    displayComparison() {
        const container = document.getElementById('comparisonContainer');
        const chartContainer = document.querySelector('.comparison-chart-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.comparisonLocations.length < 2) {
            if (chartContainer) chartContainer.setAttribute('hidden', true);
            return;
        }
        
        this.comparisonLocations.forEach((loc, index) => {
            const card = document.createElement('div');
            card.className = 'comparison-card removable';
            card.innerHTML = `
                <button class="comparison-remove" data-index="${index}" aria-label="Remove">&times;</button>
                <div class="comparison-location">${loc.location.name}</div>
                <div class="comparison-country">${loc.location.country}</div>
                <div class="comparison-temp">${this.utils.formatTemp(loc.current.temperature, this.currentUnit)}</div>
                <div class="comparison-condition">
                    <img src="https:${loc.current.condition.icon}" class="comparison-icon" alt="${loc.current.condition.text}">
                    ${loc.current.condition.text}
                </div>
                <div class="comparison-details">
                    <div>Humidity: ${loc.current.humidity}%</div>
                    <div>Wind: ${loc.current.wind.speed} km/h</div>
                    <div>Feels: ${this.utils.formatTemp(loc.current.feelsLike, this.currentUnit)}</div>
                </div>
            `;
            container.appendChild(card);
        });
        
        // Add remove listeners
        container.querySelectorAll('.comparison-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.comparisonLocations.splice(index, 1);
                this.displayComparison();
            });
        });
        
        // Render comparison chart
        if (chartContainer) {
            chartContainer.removeAttribute('hidden');
            this.chartsManager.renderComparisonChart(this.comparisonLocations);
        }
    }
}