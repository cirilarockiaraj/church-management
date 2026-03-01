# Church Management Application

A modern, serverless web application designed to help churches manage their members, subscriptions, festival taxes, donations, and expenses efficiently. Built with React, Material-UI (MUI), and powered entirely by Google Sheets as the database backend.

## Features

- **Dashboard Analytics**: Visual representation of monthly income vs expenses, categorized pie charts, and summary cards.
- **Member Management**: Track member details, contact information, and IDs.
- **Financial Tracking**:
  - **Monthly Subscriptions**: Record and manage regular monthly payments.
  - **Festival Tax**: Track annual or special event payments.
  - **Donations**: Log free-will offerings and donations with notes.
  - **Expenses**: Record church expenses and automatically calculate Net Balance.
- **Serverless Backend**: Uses Google Sheets API for all data storage, meaning no separate database server to maintain.
- **Authentication**: Secure Google OAuth integration to ensure only authorized users can access or modify the church's data.
- **Responsive Design**: Built with Material-UI to ensure the application works seamlessly on desktop and mobile devices.

## Technology Stack

- **Frontend**: React.js (Vite)
- **UI Framework**: Material-UI (MUI)
- **Routing**: React Router
- **Data Visualization**: Recharts
- **Database**: Google Sheets API (via `gapi-script`)
- **Authentication**: Google Identity Services (OAuth 2.0)
- **Alerts**: React Hot Toast

## Prerequisites

Before you begin, ensure you have met the following requirements:
- You have installed [Node.js](https://nodejs.org/en/) and npm.
- You have a Google Cloud Console account with the Google Sheets API enabled.
- You have obtained a Google Client ID and API Key.

## Running Locally

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Church-management-app
   ```

2. **Install remaining dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (or update the secrets directly in `googleSheetsService.js` if that's your preferred approach) with your Google Cloud credentials.
   
4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to `http://localhost:5173` in your browser.

## Deployment

The application is configured to be easily deployable to static hosting services like GitHub Pages, Vercel, or Netlify since it has no proprietary backend.

If deploying to GitHub Pages, you can use the built-in deploy script if configured in `package.json`:
```bash
npm run build
npm run deploy
```

## License

This project is licensed under the MIT License.
