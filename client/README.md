# Admin Portal - React Frontend

Modern React-based admin portal with Material-UI components, built with Vite.

## Features

- **Authentication**: Login and registration with JWT
- **User Management**: View, edit, and manage users (Admin only)
- **Role Management**: Create and manage roles with granular permissions (Admin only)
- **Audit Logs**: Track all system activities (Admin only)
- **Responsive Design**: Works on desktop and mobile devices
- **Protected Routes**: Role-based access control

## Tech Stack

- React 18
- React Router v6
- Material-UI (MUI)
- Axios for API calls
- Vite for fast development

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Backend server running on port 5000

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will run on `http://localhost:3000` and proxy API requests to `http://localhost:5000`.

### Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the client directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## Project Structure

```
client/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable components
│   │   ├── Layout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── context/     # React Context providers
│   │   └── AuthContext.jsx
│   ├── pages/       # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── UserManagement.jsx
│   │   ├── RoleManagement.jsx
│   │   └── AuditLogs.jsx
│   ├── services/    # API service layer
│   │   └── api.js
│   ├── App.jsx      # Main app component
│   ├── main.jsx     # Entry point
│   └── index.css    # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## Features by Role

### All Users
- Login/Register
- View Dashboard
- Update profile

### Admin Users
- All user features
- Manage users (view, edit, delete, assign roles)
- Manage roles (create, edit, delete, set permissions)
- View audit logs
- Access system statistics

## API Integration

The app communicates with the backend via REST API:

- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create role (Admin)
- `PUT /api/roles/:id` - Update role (Admin)
- `DELETE /api/roles/:id` - Delete role (Admin)
- `GET /api/audit` - Get audit logs (Admin)

## Authentication

The app uses JWT tokens stored in localStorage. Tokens are automatically included in API requests via Axios interceptors. On 401 responses, the user is redirected to the login page.

## Development Notes

- The app uses React Router for client-side routing
- Material-UI provides consistent theming and components
- Axios interceptors handle authentication and error responses
- Context API manages global auth state
- Protected routes restrict access based on user role
