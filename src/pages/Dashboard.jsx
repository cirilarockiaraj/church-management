import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getSpreadsheetData } from '../services/googleSheetsService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const currentYear = new Date().getFullYear();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(currentYear.toString());
  const [month, setMonth] = useState('All');
  // Dynamic Years Setup
  const yearsList = Array.from(new Array(100), (val, index) => currentYear - 20 + index); // E.g., 2023 - 2028
  const monthOptions = [
    { value: 'Jan', label: 'January' }, { value: 'Feb', label: 'February' },
    { value: 'Mar', label: 'March' }, { value: 'Apr', label: 'April' },
    { value: 'May', label: 'May' }, { value: 'Jun', label: 'June' },
    { value: 'Jul', label: 'July' }, { value: 'Aug', label: 'August' },
    { value: 'Sep', label: 'September' }, { value: 'Oct', label: 'October' },
    { value: 'Nov', label: 'November' }, { value: 'Dec', label: 'December' }
  ];
  const [totals, setTotals] = useState({
    subscriptions: 0,
    festivalTax: 0,
    donations: 0,
    totalIncome: 0,
    expenses: 0,
    netBalance: 0
  });

  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [year, month]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const subDataRaw = await getSpreadsheetData('Monthly_Subscription!A2:H') || [];
      const taxDataRaw = await getSpreadsheetData('Festival_Tax!A2:H') || [];
      const donDataRaw = await getSpreadsheetData('Donations!A2:E') || [];
      const expDataRaw = await getSpreadsheetData('Expenses!A2:E') || [];
      
      let totalSub = 0;
      let totalTax = 0;
      let totalDon = 0;
      let totalExp = 0;

      // Group subs by month for the chart
      const monthlyMap = { Jan:0, Feb:0, Mar:0, Apr:0, May:0, Jun:0, Jul:0, Aug:0, Sep:0, Oct:0, Nov:0, Dec:0 };
      const monthlyExpMap = { Jan:0, Feb:0, Mar:0, Apr:0, May:0, Jun:0, Jul:0, Aug:0, Sep:0, Oct:0, Nov:0, Dec:0 };

      // Process Subscriptions (Amount is index 5, Month is index 3, Year is index 4, Status is index 6)
      subDataRaw.forEach(row => {
          if (row.length >= 7 && row[6] === 'Paid') {
            // Apply Year filter
            if (year !== 'All' && String(row[4]) !== String(year)) return;
            // Apply Month filter
            if (month !== 'All' && row[3] !== month) return;

            const amt = Number(row[5]) || 0;
            totalSub += amt;
            if (monthlyMap[row[3]] !== undefined) {
               monthlyMap[row[3]] += amt;
            }
          }
      });

      // Process Festival Tax (Amount is index 5, Year is index 2, Status is index 6)
      taxDataRaw.forEach(row => {
          if (row.length >= 7 && row[6] === 'Paid') {
             if (year !== 'All' && String(row[2]) !== String(year)) return;
             // Festival tax doesn't have a month column out of the box, we just add it to the total
             totalTax += (Number(row[5]) || 0);
          }
      });

      // Process Donations (Amount is index 2, Date is index 3)
      donDataRaw.forEach(row => {
          if (row.length >= 4) {
             const donYear = row[3] ? String(row[3]).split('-')[0] : '';
             const donMonthNum = row[3] ? String(row[3]).split('-')[1] : ''; // 01, 02 etc
             
             if (year !== 'All' && donYear !== String(year)) return;
             
             // Simple mapping 01 -> Jan
             const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
             const donMonth = monthNames[parseInt(donMonthNum, 10)];

             if (month !== 'All' && donMonth !== month) return;

             totalDon += (Number(row[2]) || 0);
          }
      });

      // Process Expenses (Amount is index 2, Date is index 3)
      expDataRaw.forEach(row => {
          if (row.length >= 4) {
             const expYear = row[3] ? String(row[3]).split('-')[0] : '';
             const expMonthNum = row[3] ? String(row[3]).split('-')[1] : ''; 
             
             if (year !== 'All' && expYear !== String(year)) return;
             
             const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
             const expMonth = monthNames[parseInt(expMonthNum, 10)];

             if (month !== 'All' && expMonth !== month) return;

             const amt = Number(row[2]) || 0;
             totalExp += amt;
             if (monthlyExpMap[expMonth] !== undefined) {
                 monthlyExpMap[expMonth] += amt;
             }
          }
      });

      // Update State
      const grandTotalIncome = totalSub + totalTax + totalDon;
      setTotals({
        subscriptions: totalSub,
        festivalTax: totalTax,
        donations: totalDon,
        totalIncome: grandTotalIncome,
        expenses: totalExp,
        netBalance: grandTotalIncome - totalExp
      });

      // Format for Bar Chart
      const chartData = Object.keys(monthlyMap).map(key => ({
         name: key,
         Income: monthlyMap[key]
      })).filter(item => item.Income > 0); // Hide empty months

      setMonthlyData(chartData);

      // Format for Pie Chart
      setCategoryData([
        { name: 'Subscriptions', value: totalSub },
        { name: 'Festival Tax', value: totalTax },
        { name: 'Donations', value: totalDon },
        { name: 'Expenses', value: totalExp }
      ].filter(item => item.value > 0)); // Hide empty categories

      setLoading(false);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
      setLoading(false);
    }
  };

  const SummaryCard = ({ title, amount, color }) => (
    <Paper elevation={2} sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140, borderTop: `4px solid ${color}` }}>
      <Typography component="h2" variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography component="p" variant="h4" sx={{ fontWeight: 'bold', mt: 'auto' }}>
        ₹ {amount.toLocaleString()}
      </Typography>
    </Paper>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select
              labelId="year-select-label"
              value={year}
              label="Year"
              onChange={(e) => setYear(e.target.value)}
            >
              {yearsList.map(y => (
                 <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="month-select-label">Month</InputLabel>
            <Select
              labelId="month-select-label"
              value={month}
              label="Month"
              onChange={(e) => setMonth(e.target.value)}
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
           <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard title="Monthly Subscriptions" amount={totals.subscriptions} color="#1976d2" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard title="Festival Tax" amount={totals.festivalTax} color="#9c27b0" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard title="Donations" amount={totals.donations} color="#ed6c02" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard title="Total Income" amount={totals.totalIncome} color="#2e7d32" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard title="Total Expenses" amount={totals.expenses} color="#d32f2f" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <SummaryCard title="Net Balance" amount={totals.netBalance} color={totals.netBalance >= 0 ? "#009688" : "#f44336"} />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Bar Chart for Monthly Income */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper elevation={2} sx={{ p: 3, m: 0 }}>
                <Typography variant="h6" gutterBottom>Monthly Income</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => `₹ ${value}`} />
                    <Legend />
                    <Bar dataKey="Income" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Pie Chart for Category Distribution */}
            <Grid size={{ xs: 12, md: 4 }}>
               <Paper elevation={2} sx={{ p: 3, m: 0 }}>
                <Typography variant="h6" align="center" gutterBottom>Income Distribution</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `₹ ${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
