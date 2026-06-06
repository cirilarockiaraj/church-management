import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import Donations from './Donations';
import Expenses from './Expenses';
import Subscription from './Subscription';
import FestivalTax from './FestivalTax';
import Loans from './Loans';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const Finance = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      {/* Finance Module Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Finance Management</Typography>
        <Typography variant="body2" color="text.secondary">
          Track subscriptions, taxes, donations, expenses, and loans in one unified console
        </Typography>
      </Box>

      {/* Finance Tab Controls */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          textColor="primary" 
          indicatorColor="primary" 
          variant="scrollable" 
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 700,
              fontSize: '0.88rem',
              textTransform: 'none',
              minHeight: 48,
            }
          }}
        >
          <Tab label="Donations" icon={<VolunteerActivismIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Expenses" icon={<ReceiptIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Subscriptions" icon={<CurrencyRupeeIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Festival Tax" icon={<CelebrationIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Loans & Repayments" icon={<AccountBalanceWalletIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Dynamic Tab Mounts */}
      <Box sx={{ mt: 1 }}>
        {tabValue === 0 && <Donations />}
        {tabValue === 1 && <Expenses />}
        {tabValue === 2 && <Subscription />}
        {tabValue === 3 && <FestivalTax />}
        {tabValue === 4 && <Loans />}
      </Box>
    </Box>
  );
};

export default Finance;
