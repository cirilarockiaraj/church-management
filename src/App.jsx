import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Subscription from './pages/Subscription';
import FestivalTax from './pages/FestivalTax';
import Donations from './pages/Donations';
import Expenses from './pages/Expenses';
import Loans from './pages/Loans';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5', // Modern Indigo
    },
    secondary: {
      main: '#0d9488', // Vibrant Teal
    },
    background: {
      default: '#f8fafc', // Clean light gray-blue background
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          padding: '8px 16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(241, 245, 249, 0.8)',
        },
      },
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/members" element={<Members />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/festival-tax" element={<FestivalTax />} />
                <Route path="/donations" element={<Donations />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/loans" element={<Loans />} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
