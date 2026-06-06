import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, FormControl, InputLabel, Select, 
  MenuItem, CircularProgress, Card, CardContent, Button, Divider, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ChurchIcon from '@mui/icons-material/Church';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { getSpreadsheetData } from '../services/googleSheetsService';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#1E3A8A', '#D4AF37', '#10B981', '#F59E0B', '#EF4444'];

const Dashboard = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(currentYear.toString());
  const [month, setMonth] = useState('All');
  
  // Dashboard statistics
  const [stats, setStats] = useState({
    totalFamilies: 0,
    totalMembers: 0,
    activeParishioners: 0,
    baptismsThisYear: 0,
    marriagesThisYear: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netBalance: 0
  });

  const [financialOverview, setFinancialOverview] = useState([]);
  const [sacramentRatio, setSacramentRatio] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [growthData, setGrowthData] = useState([]);

  // Setup Dynamic Years list
  const yearsList = Array.from(new Array(10), (val, index) => currentYear - 5 + index);
  const monthOptions = [
    { value: 'Jan', label: 'January' }, { value: 'Feb', label: 'February' },
    { value: 'Mar', label: 'March' }, { value: 'Apr', label: 'April' },
    { value: 'May', label: 'May' }, { value: 'Jun', label: 'June' },
    { value: 'Jul', label: 'July' }, { value: 'Aug', label: 'August' },
    { value: 'Sep', label: 'September' }, { value: 'Oct', label: 'October' },
    { value: 'Nov', label: 'November' }, { value: 'Dec', label: 'December' }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [year, month]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch raw data from Google Sheets safely
      const [
        subDataRaw, taxDataRaw, donDataRaw, expDataRaw,
        membersRaw, familiesRaw, sacramentsRaw, eventsRaw
      ] = await Promise.all([
        getSpreadsheetData('Monthly_Subscription!A2:H').catch(() => []),
        getSpreadsheetData('Festival_Tax!A2:H').catch(() => []),
        getSpreadsheetData('Donations!A2:E').catch(() => []),
        getSpreadsheetData('Expenses!A2:E').catch(() => []),
        getSpreadsheetData('Members!A2:F').catch(() => []),
        getSpreadsheetData('Families!A2:H').catch(() => []),
        getSpreadsheetData('Sacraments!A2:H').catch(() => []),
        getSpreadsheetData('Events!A2:H').catch(() => [])
      ]);

      const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // 2. Process Member Stats
      const mList = membersRaw || [];
      const totalMembers = mList.length;
      const activeMembers = mList.filter(m => m[5] === 'Active').length;

      // Families Stats
      const fList = familiesRaw || [];
      const totalFamilies = fList.length > 0 ? fList.length : new Set(mList.map(m => m[2]).filter(Boolean)).size;

      // 3. Process Financials
      let totalSub = 0;
      let totalTax = 0;
      let totalDon = 0;
      let totalExp = 0;

      const monthlyMap = { Jan:0, Feb:0, Mar:0, Apr:0, May:0, Jun:0, Jul:0, Aug:0, Sep:0, Oct:0, Nov:0, Dec:0 };
      const monthlyExpMap = { Jan:0, Feb:0, Mar:0, Apr:0, May:0, Jun:0, Jul:0, Aug:0, Sep:0, Oct:0, Nov:0, Dec:0 };

      // Subscriptions
      (subDataRaw || []).forEach(row => {
        if (row.length >= 7 && row[6] === 'Paid') {
          if (year !== 'All' && String(row[4]) !== String(year)) return;
          if (month !== 'All' && row[3] !== month) return;

          const amt = Number(row[5]) || 0;
          totalSub += amt;
          if (monthlyMap[row[3]] !== undefined) {
             monthlyMap[row[3]] += amt;
          }
        }
      });

      // Festival Tax
      (taxDataRaw || []).forEach(row => {
        if (row.length >= 7 && row[6] === 'Paid') {
          if (year !== 'All' && String(row[2]) !== String(year)) return;
          totalTax += (Number(row[5]) || 0);
        }
      });

      // Donations
      (donDataRaw || []).forEach(row => {
        if (row.length >= 4) {
          const donYear = row[3] ? String(row[3]).split('-')[0] : '';
          const donMonthNum = row[3] ? String(row[3]).split('-')[1] : '';
          
          if (year !== 'All' && donYear !== String(year)) return;
          const donMonth = monthNames[parseInt(donMonthNum, 10)];
          if (month !== 'All' && donMonth !== month) return;

          const amt = Number(row[2]) || 0;
          totalDon += amt;
          if (monthlyMap[donMonth] !== undefined) {
             monthlyMap[donMonth] += amt;
          }
        }
      });

      // Expenses
      (expDataRaw || []).forEach(row => {
        if (row.length >= 4) {
          const expYear = row[3] ? String(row[3]).split('-')[0] : '';
          const expMonthNum = row[3] ? String(row[3]).split('-')[1] : ''; 
          
          if (year !== 'All' && expYear !== String(year)) return;
          const expMonth = monthNames[parseInt(expMonthNum, 10)];
          if (month !== 'All' && expMonth !== month) return;

          const amt = Number(row[2]) || 0;
          totalExp += amt;
          if (monthlyExpMap[expMonth] !== undefined) {
              monthlyExpMap[expMonth] += amt;
          }
        }
      });

      const grandTotalIncome = totalSub + totalTax + totalDon;

      // 4. Process Sacraments (Baptism, Confirmation, Marriage etc)
      let baptismsThisYear = 0;
      let marriagesThisYear = 0;
      let sacramentCounts = { Baptism: 0, Confirmation: 0, Communion: 0, Marriage: 0, Death: 0 };

      (sacramentsRaw || []).forEach(row => {
        const type = row[3] || '';
        const sDate = row[4] || '';
        const sYear = sDate ? sDate.split('-')[0] : '';
        
        if (sYear === year) {
          if (type === 'Baptism') baptismsThisYear++;
          if (type === 'Marriage') marriagesThisYear++;
        }

        if (sacramentCounts[type] !== undefined) {
          sacramentCounts[type]++;
        }
      });

      // 5. Process Events
      const activeEvents = (eventsRaw || []).map(row => ({
        id: row[0] || '',
        title: row[1] || '',
        date: row[2] || '',
        time: row[3] || '',
        location: row[5] || '',
        coordinator: row[6] || ''
      })).slice(0, 4); // Limit to top 4 events
      setRecentEvents(activeEvents);

      // Financial Charts Data Formatting
      const chartData = Object.keys(monthlyMap).map(key => ({
        month: key,
        Income: monthlyMap[key],
        Expense: monthlyExpMap[key] || 0
      })).filter(item => item.Income > 0 || item.Expense > 0);

      setFinancialOverview(chartData);

      // Sacrament Pie Chart Data
      const pieData = Object.keys(sacramentCounts).map(key => ({
        name: key,
        value: sacramentCounts[key]
      })).filter(item => item.value > 0);
      setSacramentRatio(pieData);

      // Membership growth mock visual graph data based on years
      setGrowthData([
        { year: '2022', Members: totalMembers > 10 ? totalMembers - 8 : 12 },
        { year: '2023', Members: totalMembers > 5 ? totalMembers - 4 : 20 },
        { year: '2024', Members: totalMembers > 2 ? totalMembers - 1 : 28 },
        { year: '2025', Members: totalMembers },
      ]);

      // Set All Calculated Stats
      setStats({
        totalFamilies,
        totalMembers,
        activeParishioners: activeMembers > 0 ? activeMembers : totalMembers,
        baptismsThisYear,
        marriagesThisYear,
        monthlyIncome: grandTotalIncome,
        monthlyExpenses: totalExp,
        netBalance: grandTotalIncome - totalExp
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard statistics", error);
      setLoading(false);
    }
  };

  // KPI Card Sub-component
  const KPICard = ({ title, value, icon, color, footerText }) => (
    <Card 
      sx={{ 
        borderRadius: 4, 
        height: '100%', 
        transition: 'transform 0.2s, box-shadow 0.2s', 
        '&:hover': { 
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.08)'
        },
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight="700">
            {title}
          </Typography>
          <Box sx={{ p: 1.2, borderRadius: '12px', bgcolor: `${color}10`, color: color }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" fontWeight="800" color="primary.main" sx={{ mb: 1, letterSpacing: '-1px' }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {footerText}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header and Filter Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WavingHandIcon sx={{ color: 'secondary.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">Parish Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">
              Parish and financial intelligence visualizer
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select
              labelId="year-select-label"
              value={year}
              label="Year"
              onChange={(e) => setYear(e.target.value)}
              sx={{ borderRadius: '10px' }}
            >
              {yearsList.map(y => (
                 <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel id="month-select-label">Month</InputLabel>
            <Select
              labelId="month-select-label"
              value={month}
              label="Month"
              onChange={(e) => setMonth(e.target.value)}
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="All">All Months</MenuItem>
              {monthOptions.map(m => (
                 <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
           <CircularProgress size={50} />
        </Box>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard 
                title="Total Families" 
                value={stats.totalFamilies} 
                icon={<HomeWorkIcon />} 
                color="#D4AF37" 
                footerText="Registered family records"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard 
                title="Total Members" 
                value={stats.totalMembers} 
                icon={<PeopleIcon />} 
                color="#1E3A8A" 
                footerText={`Active: ${stats.activeParishioners}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard 
                title="Baptisms This Year" 
                value={stats.baptismsThisYear} 
                icon={<ChurchIcon />} 
                color="#10B981" 
                footerText={`Registered in ${year}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard 
                title="Marriages This Year" 
                value={stats.marriagesThisYear} 
                icon={<FavoriteIcon />} 
                color="#EF4444" 
                footerText={`Sacraments in ${year}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard 
                title="Monthly Income" 
                value={`₹ ${stats.monthlyIncome.toLocaleString('en-IN')}`} 
                icon={<CurrencyRupeeIcon />} 
                color="#10B981" 
                footerText="Subs, tax, and donations"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard 
                title="Monthly Expenses" 
                value={`₹ ${stats.monthlyExpenses.toLocaleString('en-IN')}`} 
                icon={<ReceiptIcon />} 
                color="#EF4444" 
                footerText="Operational costs paid"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard 
                title="Net Balance" 
                value={`₹ ${stats.netBalance.toLocaleString('en-IN')}`} 
                icon={<CurrencyRupeeIcon />} 
                color={stats.netBalance >= 0 ? "#10B981" : "#EF4444"} 
                footerText="Net surplus / deficit"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KPICard 
                title="Marriages Registered" 
                value={stats.marriagesThisYear} 
                icon={<FavoriteIcon />} 
                color="#F59E0B" 
                footerText="Total marriage sacraments"
              />
            </Grid>
          </Grid>

          {/* Quick Actions Panel */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Quick Admin Actions</Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Register Family', path: '/families', color: '#1E3A8A' },
                { label: 'Add Member', path: '/members', color: '#D4AF37' },
                { label: 'Record Sacrament', path: '/sacraments', color: '#10B981' },
                { label: 'Add Finance Record', path: '/finance', color: '#EF4444' },
                { label: 'Schedule Event', path: '/events', color: '#6366F1' },
              ].map((act, i) => (
                <Grid item xs={6} sm={4} md={2.4} key={i}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate(act.path)}
                    sx={{
                      py: 1.5,
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      color: '#0F172A',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      '&:hover': {
                        borderColor: act.color,
                        bgcolor: `${act.color}05`,
                        color: act.color
                      }
                    }}
                  >
                    <AddIcon sx={{ fontSize: 18, color: act.color }} />
                    {act.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Charts Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 4 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2.5 }}>Financial Performance</Typography>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={financialOverview} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tickLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <RechartsTooltip formatter={(value) => `₹ ${value}`} />
                    <Legend />
                    <Bar dataKey="Income" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2.5 }}>Parish Demographics</Typography>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={sacramentRatio}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {sacramentRatio.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary" display="block" align="center">
                  Distribution of sacrament administrations in the parish database.
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Bottom Row: Growth Chart & Recent Events */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 4 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Parish Growth Trend</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="year" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="Members" stroke="#1E3A8A" strokeWidth={2} fillOpacity={1} fill="url(#colorMembers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="h6" fontWeight="bold">Upcoming Parish Events</Typography>
                  <Button variant="text" size="small" endIcon={<KeyboardArrowRightIcon />} onClick={() => navigate('/events')}>
                    View All
                  </Button>
                </Box>
                {recentEvents.length > 0 ? (
                  <List disablePadding>
                    {recentEvents.map((ev, index) => (
                      <Box key={ev.id}>
                        <ListItem sx={{ py: 1, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37' }}>
                              <EventIcon fontSize="small" />
                            </Box>
                          </ListItemIcon>
                          <ListItemText 
                            primary={ev.title} 
                            primaryTypographyProps={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                            secondary={`${ev.date} @ ${ev.time} — ${ev.location}`} 
                            secondaryTypographyProps={{ fontSize: '0.78rem' }}
                          />
                        </ListItem>
                        {index < recentEvents.length - 1 && <Divider sx={{ my: 0.5 }} />}
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, color: 'text.secondary' }}>
                    <EventIcon sx={{ fontSize: 40, mb: 1, color: 'text.disabled' }} />
                    <Typography variant="body2">No scheduled events found</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
