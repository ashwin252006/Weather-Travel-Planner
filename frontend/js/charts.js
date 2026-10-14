// Charts manager
import { Utils } from './utils.js';

export class ChartsManager {
    constructor() {
        this.utils = new Utils();
        this.weatherChart = null;
        this.comparisonChart = null;
        this.currentChartType = 'temperature';
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Chart tabs
        document.querySelectorAll('.chart-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleChartTab(e));
        });
    }

    handleChartTab(e) {
        const tab = e.target;
        const chartType = tab.dataset.chart;
        this.currentChartType = chartType;
        
        document.querySelectorAll('.chart-tab').forEach(t => {
            t.classList.toggle('active', t === tab);
            t.setAttribute('aria-selected', t === tab);
        });
        
        // Re-render with current data
        const weatherSection = document.getElementById('weatherSection');
        if (weatherSection && !weatherSection.hasAttribute('hidden')) {
            // We need the current forecast data - get from WeatherManager
            // But for simplicity, we'll rely on the main app to re-call
        }
    }

    renderWeatherCharts(forecastData) {
        const ctx = document.getElementById('weatherChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.weatherChart) {
            this.weatherChart.destroy();
        }
        
        const labels = forecastData.forecast.map(day => {
            const date = new Date(day.date);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        });
        
        let data = [];
        let label = '';
        let borderColor = '#2563eb';
        let backgroundColor = 'rgba(37, 99, 235, 0.1)';
        
        if (this.currentChartType === 'temperature') {
            data = forecastData.forecast.map(day => day.day.avgTemp);
            label = 'Average Temperature (°C)';
            borderColor = '#ef4444';
            backgroundColor = 'rgba(239, 68, 68, 0.1)';
        } else if (this.currentChartType === 'humidity') {
            data = forecastData.forecast.map(day => day.day.avgHumidity);
            label = 'Average Humidity (%)';
            borderColor = '#06b6d4';
            backgroundColor = 'rgba(6, 182, 212, 0.1)';
        } else if (this.currentChartType === 'precipitation') {
            data = forecastData.forecast.map(day => day.day.dailyChanceOfRain);
            label = 'Chance of Rain (%)';
            borderColor = '#3b82f6';
            backgroundColor = 'rgba(59, 130, 246, 0.1)';
        }
        
        this.weatherChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label,
                    data,
                    borderColor,
                    backgroundColor,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: borderColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#1e293b',
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary') || '#ffffff',
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#1e293b',
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#475569',
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#e2e8f0',
                        borderWidth: 1,
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#475569',
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#e2e8f0',
                        }
                    },
                    y: {
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#475569',
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#e2e8f0',
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false,
                }
            }
        });
    }

    renderComparisonChart(comparisonLocations) {
        const ctx = document.getElementById('comparisonChart');
        if (!ctx) return;
        
        if (this.comparisonChart) {
            this.comparisonChart.destroy();
        }
        
        const labels = ['Temperature (°C)', 'Humidity (%)', 'Wind (km/h)'];
        const colors = ['#ef4444', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];
        
        const datasets = comparisonLocations.map((loc, index) => ({
            label: loc.location.name,
            data: [
                loc.current.temperature,
                loc.current.humidity,
                loc.current.wind.speed,
            ],
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '40',
            tension: 0.4,
            fill: false,
            pointBackgroundColor: colors[index % colors.length],
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
        }));
        
        this.comparisonChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels,
                datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#1e293b',
                        }
                    },
                    tooltip: {
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary') || '#ffffff',
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#1e293b',
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#475569',
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#e2e8f0',
                        borderWidth: 1,
                    }
                },
                scales: {
                    r: {
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#475569',
                            backdropColor: 'transparent',
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#e2e8f0',
                        },
                        pointLabels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#1e293b',
                        }
                    }
                }
            }
        });
    }
}