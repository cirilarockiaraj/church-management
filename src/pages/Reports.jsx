import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, CircularProgress, Grid, Card, CardContent, Divider 
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PrintIcon from '@mui/icons-material/Print';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { getSpreadsheetData } from '../services/googleSheetsService';

const COLORS = ['#1E3A8A', '#D4AF37', '#10B981', '#F59E0B', '#EF4444'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [financeSummary, setFinanceSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    subscriptions: 0,
    donations: 0,
    taxes: 0,
    netBalance: 0
  });

  const [categoryData, setCategoryData] = useState([]);
  const [cashFlowTrend, setCashFlowTrend] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [subDataRaw, taxDataRaw, donDataRaw, expDataRaw] = await Promise.all([
        getSpreadsheetData('Monthly_Subscription!A2:H').catch(() => []),
        getSpreadsheetData('Festival_Tax!A2:H').catch(() => []),
        getSpreadsheetData('Donations!A2:E').catch(() => []),
        getSpreadsheetData('Expenses!A2:E').catch(() => [])
      ]);

      let totalSub = 0;
      let totalTax = 0;
      let totalDon = 0;
      let totalExp = 0;

      const monthlyMap = { Jan:0, Feb:0, Mar:0, Apr:0, May:0, Jun:0, Jul:0, Aug:0, Sep:0, Oct:0, Nov:0, Dec:0 };
      const monthlyExpMap = { Jan:0, Feb:0, Mar:0, Apr:0, May:0, Jun:0, Jul:0, Aug:0, Sep:0, Oct:0, Nov:0, Dec:0 };
      const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // Subscriptions
      (subDataRaw || []).forEach(row => {
        if (row.length >= 7 && row[6] === 'Paid') {
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
          totalTax += (Number(row[5]) || 0);
        }
      });

      // Donations
      (donDataRaw || []).forEach(row => {
        if (row.length >= 4) {
          const donMonthNum = row[3] ? String(row[3]).split('-')[1] : '';
          const donMonth = monthNames[parseInt(donMonthNum, 10)];
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
          const expMonthNum = row[3] ? String(row[3]).split('-')[1] : ''; 
          const expMonth = monthNames[parseInt(expMonthNum, 10)];
          const amt = Number(row[2]) || 0;
          totalExp += amt;
          if (monthlyExpMap[expMonth] !== undefined) {
              monthlyExpMap[expMonth] += amt;
          }
        }
      });

      const grandTotalIncome = totalSub + totalTax + totalDon;

      setFinanceSummary({
        totalIncome: grandTotalIncome,
        totalExpenses: totalExp,
        subscriptions: totalSub,
        donations: totalDon,
        taxes: totalTax,
        netBalance: grandTotalIncome - totalExp
      });

      // Pie chart categorizing revenue
      setCategoryData([
        { name: 'Subscriptions', value: totalSub },
        { name: 'Festival Tax', value: totalTax },
        { name: 'Donations', value: totalDon }
      ].filter(e => e.value > 0));

      // Trend data mapping
      const trend = Object.keys(monthlyMap).map(key => ({
        month: key,
        Inflow: monthlyMap[key],
        Outflow: monthlyExpMap[key] || 0
      })).filter(t => t.Inflow > 0 || t.Outflow > 0);

      setCashFlowTrend(trend);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ '@media print': { p: 4, bgcolor: '#ffffff', '& button': { display: 'none' } } }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssessmentIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">Reports & Financial Analytics</Typography>
            <Typography variant="body2" color="text.secondary">
              Parish balance sheet metrics and income statements
            </Typography>
          </Box>
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<PrintIcon />} 
          onClick={handlePrint}
          sx={{ borderRadius: '10px' }}
        >
          Print Report
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* Totals */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ borderLeft: '5px solid #10B981', borderRadius: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="700" gutterBottom>
                    Total General Inflow
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="#10B981" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon /> ₹ {financeSummary.totalIncome.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Combined collections registry</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ borderLeft: '5px solid #EF4444', borderRadius: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="700" gutterBottom>
                    Total General Outflow
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="#EF4444" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingDownIcon /> ₹ {financeSummary.totalExpenses.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Church operational expenditures</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ borderLeft: `5px solid ${financeSummary.netBalance >= 0 ? '#10B981' : '#EF4444'}`, borderRadius: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="700" gutterBottom>
                    Net Parish Surplus
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color={financeSummary.netBalance >= 0 ? 'success.main' : 'error.main'} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CurrencyRupeeIcon /> ₹ {financeSummary.netBalance.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Remaining net bank balances</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Graphical Reports */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 4 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Monthly Cash Flow Trends (Inflows vs Outflows)</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cashFlowTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => `₹ ${value}`} />
                    <Legend />
                    <Line type="monotone" dataKey="Inflow" stroke="#10B981" strokeWidth={3} dot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Outflow" stroke="#EF4444" strokeWidth={3} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>Inflow Breakdown</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `₹ ${value}`} />
                  </PieChart>
                </ResponsiveContainer>
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {categoryData.map((c, i) => (
                    <Box key={c.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                        <Typography variant="body2" color="text.secondary">{c.name}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold">₹ {c.value.toLocaleString('en-IN')}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Budget pacing overview */}
          <Paper sx={{ p: 4, borderRadius: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Statement of Cash Flow (Summary)</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This audit report is dynamically compiled from google sheets entries.
            </Typography>
            
            <Grid container spacing={2}>
              {[
                { label: 'Subscriptions Collections', val: financeSummary.subscriptions, color: 'text.primary' },
                { label: 'Donations Inflow', val: financeSummary.donations, color: 'text.primary' },
                { label: 'Festival Tax General Collections', val: financeSummary.taxes, color: 'text.primary' },
                { label: 'Total Inflow Revenue', val: financeSummary.totalIncome, color: '#10B981', bold: true },
                { label: 'Total Operating Expenses', val: -financeSummary.totalExpenses, color: '#EF4444', bold: true },
                { label: 'Net Operations Surplus', val: financeSummary.netBalance, color: 'primary.main', bold: true },
              ].map((row, i) => (
                <React.Fragment key={i}>
                  <Grid item xs={8} sx={{ py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="body2" fontWeight={row.bold ? 'bold' : 'normal'} color={row.bold ? 'text.primary' : 'text.secondary'}>
                      {row.label}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} align="right" sx={{ py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: row.bold ? row.color : 'text.primary' }}>
                      ₹ {row.val.toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Reports;
