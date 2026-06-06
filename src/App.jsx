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
import Families from './pages/Families';
import Sacraments from './pages/Sacraments';
import Finance from './pages/Finance';
import Events from './pages/Events';
import Reports from './pages/Reports';
import Administration from './pages/Administration';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1E3A8A', // Deep Royal Blue
    },
    secondary: {
      main: '#D4AF37', // Gold
    },
    background: {
      default: '#FAFAFA', // Soft White
      paper: '#FFFFFF',   // Pure White
    },
    success: {
      main: '#10B981', // Emerald Green
    },
    warning: {
      main: '#F59E0B', // Amber
    },
    error: {
      main: '#EF4444', // Soft Red
    }
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 700 },
    h2: { fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 700 },
    h3: { fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 700 },
    h4: { 
      fontFamily: '"Playfair Display", "Georgia", serif', 
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: { fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 600 },
    h6: { fontFamily: '"Playfair Display", "Georgia", serif', fontWeight: 600 },
    button: {
      fontWeight: 600,
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '10px 20px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 30px 0 rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
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
                <Route path="/families" element={<Families />} />
                <Route path="/sacraments" element={<Sacraments />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/events" element={<Events />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/admin" element={<Administration />} />
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
