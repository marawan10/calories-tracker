# كُل بحساب (Eat with Calculation)

A modern, full-stack nutrition tracking web application with advanced health calculations, comprehensive meal tracking, and beautiful data visualizations. Built with scientific accuracy and professional-grade user experience.

## ✨ Key Features

### 🔐 **Authentication & Security**
- Secure JWT-based authentication with automatic token management
- Enhanced error handling with graceful session recovery
- Global API error interceptors for robust security
- Protected routes with automatic logout on token expiration

### 🧮 **Health Calculations**
- **BMI Calculator**: WHO standard Body Mass Index with color-coded categories
- **BMR Calculator**: Mifflin-St Jeor equation for accurate Basal Metabolic Rate
- **TDEE Calculator**: Total Daily Energy Expenditure based on activity levels
- **Weight Loss Analysis**: Scientific 7700 calories = 1kg formula with weekly/monthly projections

### 🍎 **Food & Meal Management**
- Comprehensive food database with nutritional information per 100g
- Smart meal logging with automatic nutrition calculations
- Import/Export functionality for data backup and migration
- Advanced search and categorization system

### 📊 **Advanced Dashboard**
- **Three-line weekly chart**: Actual intake vs Goals vs Recommended (TDEE)
- Real-time progress tracking with color-coded indicators
- **Weight loss insights**: Weekly deficit analysis and expected weight changes
- Interactive donut charts for macro distribution
- Responsive progress bars with gradient animations

### 📱 **User Experience**
- **Fully responsive design** optimized for all devices
- **Arabic language support** with proper RTL layout
- **Modern UI/UX** with Tailwind CSS and Framer Motion animations
- **Input validation** with realistic constraints (age: 10-120, height: 100-250cm, weight: 30-300kg)
- **Professional error handling** with user-friendly feedback

### 📈 **Profile & Goal Management**
- **Personalized daily goals** for calories, protein, carbs, and fat
- **Smart recommendations** based on BMR/TDEE calculations
- **Profile synchronization** across all components
- **Data consistency** with automatic form updates

## 🛠️ Tech Stack

### Frontend
- **React.js 18** with Vite for fast development
- **Tailwind CSS** with custom gradients and animations
- **Chart.js** with react-chartjs-2 for data visualizations
- **Axios** with global interceptors for API calls
- **React Router DOM** for navigation
- **React Hook Form** for form management
- **React Hot Toast** for notifications
- **Framer Motion** for smooth animations
- **Lucide React** for modern icons

### Backend
- **Node.js** with Express framework
- **MongoDB Atlas** with Mongoose ODM
- **JWT** authentication with bcryptjs
- **Express-validator** for input validation
- **CORS** enabled for cross-origin requests

### Database Models
1. **User Model**: Profile data, daily goals, BMR calculations, preferences
2. **Food Model**: Nutritional data per 100g, categories, public/private foods
3. **Meal Model**: Daily meal logging with automatic nutrition calculations

### API Endpoints
- `/api/auth/*` - Authentication (login, register, verify)
- `/api/foods/*` - Food CRUD operations
- `/api/meals/*` - Meal logging and tracking
- `/api/users/*` - Profile and preferences management
- `/api/admin/*` - Admin operations

### Deployment Options
- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Render, Railway, Heroku, or any Node.js hosting
- **Database**: MongoDB Atlas (free tier recommended)

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB Atlas** account (free)

### 1️⃣ Clone the Repository
```bash
git clone <your-repo-url>
cd calories-calculator
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in backend directory:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secure_jwt_secret_key_here
PORT=5000
NODE_ENV=development
```

Start the backend server:
```bash
npm start
```
✅ Backend running on `http://localhost:5000`

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file in frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the development server:
```bash
npm run dev
```
✅ Frontend running on `http://localhost:3000`

### 4️⃣ Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 🌐 Production Deployment

### 1️⃣ MongoDB Atlas Setup
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (M0 Sandbox - Free)
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
5. Get your connection string

### 2️⃣ Backend Deployment (Render)
1. Push your code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repository
4. Configure build settings:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
5. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string (use a password generator)
   - `NODE_ENV`: `production`
   - `PORT`: `5000`

### 3️⃣ Frontend Deployment (Vercel)
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory: `cd frontend`
3. Update `.env` with your production backend URL
4. Deploy: `vercel --prod`
5. Set environment variable in Vercel dashboard:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api`

## 📁 Project Structure

```
calories-calculator/
├── 📁 backend/
│   ├── 📁 models/          # MongoDB schemas (User, Food, Meal)
│   ├── 📁 routes/          # API endpoints
│   ├── 📁 middleware/      # Authentication & validation
│   ├── 📁 config/          # Database configuration
│   └── 📄 server.js        # Express server setup
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/  # Reusable UI components
│   │   │   ├── 📁 ui/      # Basic UI elements
│   │   │   ├── 📁 charts/  # Chart components
│   │   │   └── 📁 layout/  # Layout components
│   │   ├── 📁 pages/       # Main application pages
│   │   │   ├── 📄 Dashboard.jsx    # Main dashboard
│   │   │   ├── 📄 Profile.jsx      # User profile & goals
│   │   │   ├── 📄 BMI.jsx          # BMI calculator
│   │   │   ├── 📄 Foods.jsx        # Food management
│   │   │   ├── 📄 Meals.jsx        # Meal logging
│   │   │   └── 📄 Reports.jsx      # Analytics & reports
│   │   ├── 📁 context/     # React context (Auth)
│   │   ├── 📁 lib/         # API utilities
│   │   ├── 📁 utils/       # Helper functions
│   │   └── 📄 App.jsx      # Main app component
│   ├── 📁 public/          # Static assets
│   └── 📄 package.json     # Dependencies
├── 📄 README.md            # This file
└── 📄 render.yaml          # Deployment configuration
```

## 🧮 Scientific Formulas Used

### BMI (Body Mass Index)
```
BMI = weight(kg) / height(m)²
```

### BMR (Basal Metabolic Rate) - Mifflin-St Jeor Equation
```
Male:   BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
Female: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
```

### TDEE (Total Daily Energy Expenditure)
```
TDEE = BMR × Activity Factor
- Sedentary: 1.2
- Light: 1.375
- Moderate: 1.55
- Active: 1.725
- Very Active: 1.9
```

### Weight Loss Calculation
```
7700 calories = 1kg body weight
Weekly Deficit = (TDEE - Goal) × 7 days
Expected Weight Loss = Weekly Deficit ÷ 7700
```

## 🎯 Quality Assurance

### ✅ Production Ready Features
- **Calculation Accuracy**: All formulas scientifically verified
- **Error Handling**: Comprehensive error recovery and user feedback
- **Input Validation**: Realistic constraints and data validation
- **Security**: JWT authentication with automatic token management
- **Performance**: Optimized React components with proper memoization
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: Proper ARIA labels and keyboard navigation

### 🧪 Testing Recommendations
- Unit tests for calculation functions
- Integration tests for API endpoints
- E2E tests for user workflows
- Cross-browser compatibility testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- **Mifflin-St Jeor Equation** for accurate BMR calculations
- **WHO BMI Standards** for health categorization
- **Scientific research** on calorie-to-weight conversion (7700 cal = 1kg)
- **React.js community** for excellent development tools
- **Tailwind CSS** for beautiful, responsive design
