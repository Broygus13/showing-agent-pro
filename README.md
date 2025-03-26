# ShowingAgent Pro

A React application for managing property showing requests between real estate agents and showing agents.

## Features

- User Authentication (Email/Password and Google Sign-in)
- Role-based Access Control (Agents and Showing Agents)
- Real-time Updates using Firebase
- Search and Filter Functionality
- Notification System
- Responsive Design with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Firebase account
- Google Cloud account

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd showing-agent-pro
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

4. Firebase Setup:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication with Email/Password and Google sign-in methods
   - Add authorized domains (localhost, localhost:3000, localhost:3001, localhost:3002)

5. Google Cloud Setup:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Set up OAuth consent screen:
     - Choose "External" user type
     - Add required scopes (email, profile)
     - Add test users (your email)
   - Link the project with Firebase

6. Start the development server:
```bash
npm start
```

The application will be available at http://localhost:3000 (or another port if 3000 is in use).

## Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── SignIn.tsx
│   │   ├── SignUp.tsx
│   │   └── ProtectedRoute.tsx
│   ├── Dashboard/
│   │   ├── AgentDashboard.tsx
│   │   └── ShowingAgentDashboard.tsx
│   ├── Navigation/
│   │   └── Header.tsx
│   ├── Notifications/
│   │   └── NotificationSystem.tsx
│   └── ShowingRequestForm.tsx
├── contexts/
│   └── AuthContext.tsx
├── services/
│   └── authService.ts
├── firebase.ts
└── App.tsx
```

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App

## Troubleshooting

If you encounter the Tailwind CSS error:
```bash
npm uninstall tailwindcss postcss autoprefixer
npm install -D tailwindcss@3.3.0 postcss@8.4.31 autoprefixer@10.4.14
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
