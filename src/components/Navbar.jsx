import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Box, 
  Avatar, TextField, InputAdornment, Button, Badge, Select, FormControl 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ChurchIcon from '@mui/icons-material/Church';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { signOutFromGoogle } from '../services/googleSheetsService';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [addMenuEl, setAddMenuEl] = useState(null);
  const [selectedParish, setSelectedParish] = useState('St. Antony\'s Church');

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddClick = (event) => {
    setAddMenuEl(event.currentTarget);
  };

  const handleAddClose = () => {
    setAddMenuEl(null);
  };

  const handleQuickAdd = (path) => {
    navigate(path);
    handleAddClose();
  };

  const handleLogout = async () => {
    try {
      await signOutFromGoogle();
    } catch (error) {
       console.error("Google sign out issue", error);
    }
    logout();
    navigate('/login');
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1, 
        bgcolor: '#FFFFFF', 
        color: '#0F172A',
        boxShadow: 'none',
        borderBottom: '1px solid #e2e8f0'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
        
        {/* Left Side: Mobile Menu, Brand, Parish Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleSidebar}
            sx={{ display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Logo Icon and Brand */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, mr: 2 }}>
            <ChurchIcon sx={{ color: 'primary.main', fontSize: 26 }} />
            <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: '-0.5px', color: 'primary.main' }}>
              ParishOS
            </Typography>
          </Box>

          {/* Parish / Church Selector */}
          {user && (
            <FormControl size="small" variant="outlined" sx={{ minWidth: 180, display: { xs: 'none', sm: 'block' } }}>
              <Select
                value={selectedParish}
                onChange={(e) => setSelectedParish(e.target.value)}
                displayEmpty
                inputProps={{ 'aria-label': 'Without label' }}
                sx={{ 
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  bgcolor: '#f8fafc',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                }}
              >
                <MenuItem value="St. Antony's Church">St. Antony's Church</MenuItem>
                <MenuItem value="Sacred Heart Parish">Sacred Heart Parish</MenuItem>
                <MenuItem value="St. Joseph's Mission">St. Joseph's Mission</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Center: Global Search */}
        {user && (
          <Box sx={{ flexGrow: 1, maxWidth: 450, display: { xs: 'none', md: 'block' } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search members, sacraments, finance records..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: '#f8fafc',
                  fontSize: '0.85rem',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#cbd5e1' },
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}

        {/* Right Side: Quick Add, Notifications, Profile */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Quick Action Button (+ Add New) */}
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddIcon />}
              endIcon={<KeyboardArrowDownIcon />}
              onClick={handleAddClick}
              sx={{ 
                display: { xs: 'none', sm: 'flex' },
                borderRadius: '10px', 
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(30, 58, 138, 0.15)'
              }}
            >
              Quick Add
            </Button>
            <Menu
              anchorEl={addMenuEl}
              open={Boolean(addMenuEl)}
              onClose={handleAddClose}
              sx={{ mt: 1 }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={() => handleQuickAdd('/members')}>Add Member</MenuItem>
              <MenuItem onClick={() => handleQuickAdd('/families')}>Register Family</MenuItem>
              <MenuItem onClick={() => handleQuickAdd('/sacraments')}>Record Sacrament</MenuItem>
              <MenuItem onClick={() => handleQuickAdd('/finance')}>Record Payment</MenuItem>
              <MenuItem onClick={() => handleQuickAdd('/events')}>Create Event</MenuItem>
            </Menu>

            {/* Notifications badge */}
            <IconButton sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', p: 1, borderRadius: '10px' }}>
              <Badge color="error" variant="dot">
                <NotificationsIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              </Badge>
            </IconButton>

            {/* Profile Menu Trigger */}
            <Box 
              onClick={handleMenu}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                cursor: 'pointer',
                p: 0.5,
                borderRadius: '12px',
                '&:hover': { bgcolor: '#f8fafc' }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: 'primary.main',
                  border: '1px solid #D4AF37'
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left', mr: 0.5 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.82rem', color: '#0F172A', lineHeight: 1.2 }}>
                  {user.username}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', lineHeight: 1.1 }}>
                  {user.role}
                </Typography>
              </Box>
              <KeyboardArrowDownIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Box>

            {/* Profile Menu dropdown */}
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{ mt: 1 }}
            >
              <MenuItem onClick={() => { handleClose(); navigate('/admin'); }}>Admin Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
