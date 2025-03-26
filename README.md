# ShowingAgent Pro

A web application that connects real estate agents with available showing agents from their office or brokerage.

## Features

- Create showing requests with property details, date/time, and buyer information
- Select multiple showing agents from a dropdown
- Real-time updates using Firebase
- Form validation and error handling
- Modern UI with Tailwind CSS

## Setup Instructions

### Prerequisites

1. Install Node.js (v16 or higher)
2. Install Git
3. Have a Firebase account

### First-Time Setup

1. Clone the repository:
   ```bash
   git clone [YOUR_GITHUB_REPO_URL]
   cd showing-agent-pro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Create a web app in your Firebase project
   - Copy the Firebase configuration
   - Replace the placeholder values in `src/firebase.ts` with your configuration

4. Start the development server:
   ```bash
   npm start
   ```

### Development

- The app will run on `http://localhost:3000`
- Changes will automatically reload in the browser
- Form submissions are stored in Firestore

## Project Structure

- `/src/components/` - React components
- `/src/services/` - Firebase/Firestore services
- `/src/firebase.ts` - Firebase configuration

## Available Scripts

- `npm start` - Runs the development server
- `npm test` - Runs tests
- `npm run build` - Builds for production

## Technologies Used

- React
- TypeScript
- Firebase/Firestore
- Tailwind CSS
- Create React App
