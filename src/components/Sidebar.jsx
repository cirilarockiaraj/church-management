import React from 'react';
import { 
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Toolbar, Box, Divider, Typography, Avatar 
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ChurchIcon from '@mui/icons-material/Church';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EventIcon from '@mui/icons-material/Event';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Members', icon: <PeopleIcon />, path: '/members' },
  { text: 'Families', icon: <HomeWorkIcon />, path: '/families' },
  { text: 'Sacraments', icon: <ChurchIcon />, path: '/sacraments' },
  { text: 'Finance Management', icon: <AccountBalanceWalletIcon />, path: '/finance' },
  { text: 'Events Calendar', icon: <EventIcon />, path: '/events' },
  { text: 'Reports & Analytics', icon: <AssessmentIcon />, path: '/reports' },
  { text: 'Administration', icon: <SettingsIcon />, path: '/admin' },
];

const Sidebar = ({ mobileOpen, handleDrawerToggle, window }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    if (mobileOpen) {
      handleDrawerToggle();
    }
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#FFFFFF' }}>
      {/* Sidebar Header - Parish Branding */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, border: '2px solid #D4AF37' }}>
          <ChurchIcon sx={{ color: '#D4AF37' }} />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" color="primary.main" sx={{ lineHeight: 1.2 }}>
            St. Mary's Cathedral
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Diocese Administration
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ opacity: 0.6 }} />

      {/* Menu Navigation */}
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <ListItem disablePadding key={item.text} sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleNavigation(item.path)}
                selected={isSelected}
                sx={{
                  borderRadius: '10px',
                  py: 1.2,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(30, 58, 138, 0.08)', // Soft Royal Blue
                    borderLeft: '4px solid #D4AF37', // Gold highlight
                    '& .MuiListItemIcon-root': {
                       color: 'primary.main',
                    },
                    '& .MuiListItemText-primary': {
                      fontWeight: 700,
                      color: 'primary.main',
                    }
                  },
                  '&:hover': {
                    bgcolor: 'rgba(30, 58, 138, 0.03)',
                    borderRadius: '10px',
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: isSelected ? 'primary.main' : 'text.secondary',
                  transition: 'color 0.2s'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontSize: '0.92rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer Branding */}
      <Box sx={{ p: 2, textAlign: 'center', mt: 'auto' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          ChurchOS v2.0
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.65rem' }} color="text.disabled">
          Licensed to Archdiocese
        </Typography>
      </Box>
    </Box>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      <Drawer
        container={container}
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e2e8f0' },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
