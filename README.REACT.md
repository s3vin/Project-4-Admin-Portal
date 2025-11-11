# Admin Portal - React Refactored

This project has been refactored to use React for the frontend while maintaining the existing Express backend.

## 🚀 Quick Start

### Development Mode (Recommended for development)

Run frontend and backend separately for hot-reloading:

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start React frontend
npm run client
```

Or use concurrently to run both:

```bash
npm run dev:full
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Mode

Build and run as single application:

```bash
# Install all dependencies
npm install
cd client && npm install && cd ..

# Build React app
npm run client:build

# Start server (serves React build + API)
npm start
```

Server runs on http://localhost:5000

## 🐳 Docker Setup

### Production Build

```bash
docker-compose -f docker-compose.react.yml up --build
```

This builds React app and serves it with Express on port 5000.

### Development with Docker

```bash
docker-compose -f docker-compose.react.yml --profile dev up
```

Runs separate containers:
- MongoDB: port 27017
- Backend: port 5000
- Frontend: port 3000

## 📁 Project Structure

```
Project-4-Admin-Portal/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth context
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── config/                # Backend config
├── controllers/           # API controllers
├── middleware/            # Auth middleware
├── models/                # MongoDB models
├── routes/                # API routes
├── public/                # Built React files (production)
├── index.js               # Express server
├── package.json           # Backend dependencies
├── Dockerfile.react       # Production Dockerfile
└── docker-compose.react.yml
```

## 🎯 Features

### Frontend (React + Material-UI)
- ✅ Modern UI with Material-UI components
- ✅ React Router for navigation
- ✅ Context API for state management
- ✅ Protected routes based on user role
- ✅ Responsive design
- ✅ Login & Registration
- ✅ Dashboard with statistics
- ✅ User Management (Admin)
- ✅ Role Management with permissions (Admin)
- ✅ Audit Logs viewer (Admin)

### Backend (Express + MongoDB)
- ✅ RESTful API
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ MongoDB with Mongoose
- ✅ Audit logging
- ✅ Serves React build in production

## 📋 Available Scripts

### Root Package Scripts

```bash
npm start          # Start production server
npm run dev        # Start backend with nodemon
npm run seed       # Seed database with sample data
npm run client     # Start React dev server
npm run client:build    # Build React for production
npm run client:install  # Install client dependencies
npm run dev:full   # Run backend + frontend concurrently
npm run docker:prod     # Docker production build
npm run docker:dev      # Docker development mode
```

### Client Package Scripts

```bash
cd client
npm run dev       # Start Vite dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

## 🔑 Environment Variables

### Backend (.env in root)

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://admin:adminpassword@localhost:27017/adminPortal?authSource=admin
JWT_SECRET=your-secret-key-here
```

### Frontend (client/.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## 🔐 Default Users

After running `npm run seed`:

**Admin User:**
- Email: admin@example.com
- Password: admin123

**Regular User:**
- Email: user@example.com
- Password: user123

## 🏗️ Architecture

### How it Works

**Development:**
1. Vite dev server (port 3000) serves React app with hot-reload
2. API requests proxy to Express backend (port 5000)
3. MongoDB runs separately or in Docker

**Production:**
1. React app builds to static files in `client/dist`
2. Files copied to `public/` folder
3. Express serves React app and API from single port (5000)
4. All routes except `/api/*` serve React's index.html (SPA routing)

### API Routes

All API endpoints are prefixed with `/api`:

- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/users` (Admin)
- `GET /api/roles` (Admin)
- `POST /api/roles` (Admin)
- `PUT /api/roles/:id` (Admin)
- `DELETE /api/roles/:id` (Admin)
- `GET /api/audit` (Admin)

## 🚢 Deployment

### Option 1: Single Container (Recommended)

```bash
docker build -f Dockerfile.react -t admin-portal .
docker run -p 5000:5000 admin-portal
```

### Option 2: Traditional Hosting

```bash
# Build React app
cd client && npm run build && cd ..

# Copy build to public
cp -r client/dist/* public/

# Start server
npm start
```

## 🔄 Migration from Vanilla JS

The original vanilla JavaScript frontend (`public/app.js`, `public/role-management.js`) has been replaced with React components. The backend API remains unchanged and fully compatible.

**Key Changes:**
1. `/public` now contains React build (previously vanilla HTML/JS)
2. Express serves SPA with wildcard route
3. Client-side routing handled by React Router
4. State management via React Context
5. Material-UI for consistent design

## 📚 Technology Stack

**Frontend:**
- React 18
- React Router v6
- Material-UI (MUI)
- Axios
- Vite

**Backend:**
- Node.js
- Express
- MongoDB + Mongoose
- JWT
- bcrypt

**DevOps:**
- Docker
- Docker Compose

## 🛠️ Troubleshooting

**CORS Issues:** Check that CORS is enabled in `index.js`

**API not found:** Ensure Vite proxy is configured in `client/vite.config.js`

**Build errors:** Clear node_modules and reinstall:
```bash
rm -rf node_modules client/node_modules
npm install && cd client && npm install
```

**Port conflicts:** Change ports in `.env` and `vite.config.js`

## 📄 License

ISC
