import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { initGoogleSheetsAPI, signInToGoogle, checkIsSignedIn } from '../services/googleSheetsService';

const Login = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [googleInitError, setGoogleInitError] = React.useState(null);
  const [isGoogleReady, setIsGoogleReady] = React.useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Initialize Google API client when login page loads
    const initGapi = async () => {
      try {
        await initGoogleSheetsAPI();
        setIsGoogleReady(true);
      } catch (error) {
        console.error("Google API init failed", error);
        setGoogleInitError("Failed to initialize Google Services. Check API keys.");
      }
    };
    initGapi();
  }, []);

  const handleGoogleSignInIfNeeded = async () => {
      if(!checkIsSignedIn()) {
          try {
             await signInToGoogle();
             return true;
          } catch (e) {
             console.error("User did not grant Google auth", e);
             return false;
          }
      }
      return true;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f0f2f5',
        backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
        p: 2
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        {!isGoogleReady && !googleInitError && (
            <Typography align="center" color="white" sx={{mb: 2}}>Initializing secure connection...</Typography>
        )}
        {googleInitError && (
           <Typography align="center" color="error" sx={{bgcolor: 'white', p: 2, borderRadius: 1, mb: 2}}>{googleInitError}</Typography>
        )}
        
        {/* Pass the Google Auth handler as a prop to only trigger on sign in attempt */}
        <LoginForm onGoogleSignIn={isGoogleReady ? handleGoogleSignInIfNeeded : null} />
      </Box>
    </Box>
  );
};

export default Login;
