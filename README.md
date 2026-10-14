# Weather Travel Planner

A comprehensive full-stack web application for real-time weather-based travel planning. Built with HTML, CSS, JavaScript, Node.js, Express.js, MySQL, and WeatherAPI.com.

## 🌟 Features

### Core Features
- **Destination Search** - Search cities worldwide with autocomplete suggestions
- **Real-Time Weather** - Current weather with temperature, humidity, wind, pressure, UV index
- **Weather Forecast** - 3-day forecast with hourly breakdowns
- **Weather Visualization** - Interactive charts using Chart.js
- **Weather-Based Suggestions** - Rule-based activity recommendations
- **Destination Comparison** - Compare up to 5 destinations side-by-side
- **User Authentication** - Secure JWT-based auth with bcrypt
- **Favorites** - Save and manage favorite destinations
- **Travel Plans** - Create, edit, delete travel plans with date validation
- **Personal Dashboard** - Overview of favorites, trips, and weather

### Advanced Features
- **Geolocation** - Use current location
- **Responsive Design** - Works on mobile, tablet, desktop
- **Dark/Light Themes** - CSS variables for theming
- **Rate Limiting** - API protection
- **Caching** - Weather response caching
- **Accessibility** - ARIA labels, keyboard navigation
- **Loading States** - Spinners and skeletons

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid/Flexbox, animations
- **Vanilla JavaScript** - ES6+ modules
- **Fetch API** - Async/Await for API calls
- **Chart.js** - Data visualization
- **Font Awesome** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Axios** - HTTP client for weather API
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Joi** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting
- **cookie-parser** - Cookie handling

### Database
- **MySQL 8.0+** - Relational database
- **mysql2/promise** - MySQL connector
- **Parameterised queries** - SQL injection prevention

### External API
- **[WeatherAPI.com](https://www.weatherapi.com/)** - Real-time weather data

## 📁 Project Structure

```
weather-travel-planner/
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── travel-plans.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── utils.js
│       ├── auth.js
│       ├── weather.js
│       ├── charts.js
│       ├── favorites.js
│       ├── travel-plans.js
│       └── dashboard.js
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── index.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   └── utils/
│   ├── package.json
│   └── .env.example
├── database/
│   ├── schema.sql
│   └── seed.sql
├── tests/
│   └── backend.test.js
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MySQL** (v8.0 or higher)
- **WeatherAPI.com account** (free tier available)

### Installation

1. **Clone/Download the project**
```bash
cd E:\weather-travel-planner
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Set up MySQL Database**
- Open MySQL command line or MySQL Workbench
- Create the database and tables:
```bash
cd database
mysql -u root -p < schema.sql
```

- (Optional) Seed with sample data:
```bash
mysql -u root -p < seed.sql
```

4. **Configure Environment Variables**
```bash
cd backend
cp .env.example .env
```

Edit `.env` file with your values:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=weather_travel_planner
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
WEATHER_API_KEY=your_weatherapi_com_key
FRONTEND_URL=http://localhost:5500
```

5. **Get Weather API Key**
- Go to [WeatherAPI.com](https://www.weatherapi.com/)
- Sign up for a free account
- Get your API key from the dashboard
- Add it to `.env`

6. **Start the Backend Server**
```bash
cd backend
npm run dev
```

Server will run at `http://localhost:3000`

7. **Start the Frontend**
- Or use npm from the `frontend` directory:
```bash
cd frontend
npm install
npm start
```

Use `npm run dev` instead of `npm start` during development to restart the server when files change. The frontend will be available at `http://localhost:5500`. You can also use Live Server in VS Code.

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Manual Testing Checklist
- [ ] User registration/login/logout
- [ ] Search for weather data
- [ ] View forecast and charts
- [ ] Add/remove favorites
- [ ] Create/edit/delete travel plans
- [ ] Dashboard functionality
- [ ] Destination comparison
- [ ] Responsive design
- [ ] Authentication protection

## 📊 API Documentation

### Authentication Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Weather Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/weather/current` | Get current weather | Optional |
| GET | `/api/weather/forecast` | Get weather forecast | Optional |
| GET | `/api/weather/search` | Search locations | Optional |
| GET | `/api/weather/compare` | Compare locations | Optional |
| GET | `/api/weather/alerts` | Get weather alerts | Optional |

### Favorites Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/favorites` | Get user favorites | Yes |
| GET | `/api/favorites/with-weather` | Get favorites with weather | Yes |
| POST | `/api/favorites` | Add favorite | Yes |
| DELETE | `/api/favorites/:id` | Remove favorite | Yes |

### Travel Plans Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/travel-plans` | Get user travel plans | Yes |
| GET | `/api/travel-plans/:id` | Get single travel plan | Yes |
| GET | `/api/travel-plans/:id/forecast` | Get plan with forecast | Yes |
| POST | `/api/travel-plans` | Create travel plan | Yes |
| PUT | `/api/travel-plans/:id` | Update travel plan | Yes |
| DELETE | `/api/travel-plans/:id` | Delete travel plan | Yes |

### Dashboard Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/dashboard` | Get dashboard data | Yes |

## 🔒 Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **HTTP-Only Cookies** - XSS protection
- **CORS Configuration** - Controlled cross-origin access
- **Rate Limiting** - Prevent brute force attacks
- **Input Validation** - Joi schemas for all inputs
- **SQL Injection Prevention** - Parameterised queries
- **Helmet.js** - Security headers
- **Environment Variables** - Sensitive data protection

## 🐛 Known Limitations

- WeatherAPI free tier has 3-day forecast limit
- Caching is in-memory (not persistent)
- Some weather features require paid API plans
- Geolocation requires user permission

## 🚀 Future Enhancements

- **Real-time updates** - WebSocket integration
- **Push notifications** - Weather alerts
- **Map integration** - OpenStreetMap/Google Maps
- **Multi-language support** - i18n
- **Offline functionality** - Service Worker
- **Advanced recommendations** - ML-based suggestions
- **Social sharing** - Share trip plans

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 👥 Contact

For questions or feedback, please contact the development team.

---

**Built for B.Tech Information Technology Final Year Project & Placement Interviews**