import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, MenuItem, 
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, CircularProgress,
  TablePagination, Autocomplete, Tabs, Tab, Grid, Card, CardContent, Checkbox, FormControlLabel,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import toast from 'react-hot-toast';
import IconButton from '@mui/material/IconButton';
import { 
  getSpreadsheetData, 
  appendSpreadsheetRow, 
  updateSpreadsheetRow, 
  deleteSpreadsheetRow,
  ensureSheetExists
} from '../services/googleSheetsService';

const Loans = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loans, setLoans] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [loanSearch, setLoanSearch] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('All');
  const [loanYearFilter, setLoanYearFilter] = useState('All');
  const [repaymentSearch, setRepaymentSearch] = useState('');

  // Pagination
  const [loansPage, setLoansPage] = useState(0);
  const [loansRowsPerPage, setLoansRowsPerPage] = useState(10);
  const [repayPage, setRepayPage] = useState(0);
  const [repayRowsPerPage, setRepayRowsPerPage] = useState(10);

  // Loan Dialog State
  const [openLoanModal, setOpenLoanModal] = useState(false);
  const [isLoanEdit, setIsLoanEdit] = useState(false);
  const [loanFormData, setLoanFormData] = useState({
    id: '', takerName: '', memberId: '', principal: 10000, 
    interestRate: 10, tenure: 12, startYear: new Date().getFullYear().toString(),
    startMonth: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][new Date().getMonth()],
    notes: ''
  });

  // Repayment Dialog State
  const [openRepayModal, setOpenRepayModal] = useState(false);
  const [isRepayEdit, setIsRepayEdit] = useState(false);
  const [repayFormData, setRepayFormData] = useState({
    id: '', loanId: '', takerName: '', repaymentDate: new Date().toISOString().split('T')[0],
    amountPaid: 0, paymentType: 'Full', status: 'Success', notes: '', isFullRepayment: true
  });

  // Dynamic Years Setup
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from(new Array(30), (val, index) => currentYear - 10 + index);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    initializeAndFetchData();
  }, []);

  const initializeAndFetchData = async () => {
    setLoading(true);
    try {
      // 1. Ensure sheets exist automatically
      await ensureSheetExists('Loans', [
        'Loan ID', 'Taker Name', 'Member ID', 'Principal Amount', 
        'Interest Rate (%)', 'Tenure (Months)', 'Start Year', 'Start Month', 'Date Added', 'Notes'
      ]);
      await ensureSheetExists('Loan_Repayments', [
        'Repayment ID', 'Loan ID', 'Taker Name', 'Repayment Date', 
        'Amount Paid', 'Payment Type', 'Status', 'Notes'
      ]);

      // 2. Fetch data
      await Promise.all([
        fetchLoansAndRepayments(),
        fetchMembersList()
      ]);
    } catch (error) {
      toast.error('Failed to initialize sheets or load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembersList = async () => {
    try {
      const data = await getSpreadsheetData('Members!A2:C');
      if (data) {
        const members = data.map(row => ({
          id: row[0] || '',
          name: row[1] || '',
          label: `${row[1]} (${row[0]})`
        }));
        setMembersList(members);
      }
    } catch (error) {
      console.error("Failed to load members list", error);
    }
  };

  const fetchLoansAndRepayments = async () => {
    try {
      const [loansRaw, repaymentsRaw] = await Promise.all([
        getSpreadsheetData('Loans!A2:J'),
        getSpreadsheetData('Loan_Repayments!A2:H')
      ]);

      // Format Repayments first (so we can associate with loans)
      let formattedRepayments = [];
      if (repaymentsRaw) {
        formattedRepayments = repaymentsRaw.map((row, index) => ({
          sheetIndex: index + 2,
          id: row[0] || '',
          loanId: row[1] || '',
          takerName: row[2] || '',
          repaymentDate: row[3] || '',
          amountPaid: Number(row[4]) || 0,
          paymentType: row[5] || 'Full',
          status: row[6] || 'Success',
          notes: row[7] || '',
        }));
      }
      setRepayments(formattedRepayments);

      // Format Loans
      if (loansRaw) {
        const formattedLoans = loansRaw.map((row, index) => {
          const id = row[0] || '';
          const takerName = row[1] || '';
          const memberId = row[2] || '';
          const principal = Number(row[3]) || 0;
          const interestRate = Number(row[4]) || 0;
          const tenure = Number(row[5]) || 0;
          const startYear = row[6] || '';
          const startMonth = row[7] || '';
          const dateAdded = row[8] || '';
          const notes = row[9] || '';

          // Interest amount calculation (monthly rate): I = P * (R / 100) * T
          const interestAmount = Number(((principal * interestRate * tenure) / 100).toFixed(2));
          const totalRepayable = principal + interestAmount;

          // Compute repayments for this loan
          const totalRepaid = formattedRepayments
            .filter(r => r.loanId === id && r.status === 'Success')
            .reduce((sum, r) => sum + r.amountPaid, 0);

          const outstanding = Math.max(0, Number((totalRepayable - totalRepaid).toFixed(2)));
          const status = outstanding <= 0.05 ? 'Fully Repaid' : 'Active';

          return {
            sheetIndex: index + 2,
            id,
            takerName,
            memberId,
            principal,
            interestRate,
            tenure,
            startYear,
            startMonth,
            dateAdded,
            notes,
            interestAmount,
            totalRepayable,
            totalRepaid,
            outstanding,
            status
          };
        });
        setLoans(formattedLoans);
      } else {
        setLoans([]);
      }
    } catch (error) {
      toast.error('Failed to load records from sheets');
      console.error(error);
    }
  };

  // Tabs Handler
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open Dialog for Loans
  const handleOpenLoanModal = (loan = null) => {
    if (loan) {
      setLoanFormData({
        ...loan,
        principal: Number(loan.principal),
        interestRate: Number(loan.interestRate),
        tenure: Number(loan.tenure)
      });
      setIsLoanEdit(true);
    } else {
      setLoanFormData({
        id: `LN${String(loans.length + 1).padStart(3, '0')}`,
        takerName: '',
        memberId: '',
        principal: 10000,
        interestRate: 10,
        tenure: 12,
        startYear: new Date().getFullYear().toString(),
        startMonth: months[new Date().getMonth()],
        notes: ''
      });
      setIsLoanEdit(false);
    }
    setOpenLoanModal(true);
  };

  // Save Loan
  const handleSaveLoan = async () => {
    if (!loanFormData.takerName.trim()) {
      toast.error("Please enter a taker name");
      return;
    }
    setLoading(true);
    try {
      const rowData = [
        loanFormData.id,
        loanFormData.takerName,
        loanFormData.memberId || '',
        loanFormData.principal,
        loanFormData.interestRate,
        loanFormData.tenure,
        loanFormData.startYear,
        loanFormData.startMonth,
        new Date().toISOString().split('T')[0],
        loanFormData.notes || ''
      ];

      if (isLoanEdit) {
        await updateSpreadsheetRow(`Loans!A${loanFormData.sheetIndex}:J${loanFormData.sheetIndex}`, rowData);
        toast.success("Loan record updated");
      } else {
        await appendSpreadsheetRow('Loans!A:J', rowData);
        toast.success("Loan recorded successfully");
      }
      setOpenLoanModal(false);
      await fetchLoansAndRepayments();
    } catch (error) {
      toast.error("Error saving loan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete Loan
  const handleDeleteLoan = async (loan) => {
    if (window.confirm(`Are you sure you want to delete Loan ${loan.id} for ${loan.takerName}?`)) {
      setLoading(true);
      try {
        await deleteSpreadsheetRow('Loans', loan.sheetIndex);
        toast.success("Loan record deleted");
        await fetchLoansAndRepayments();
      } catch (error) {
        toast.error("Error deleting loan");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Open Dialog for Repayments
  const handleOpenRepayModal = (repay = null) => {
    if (repay) {
      setRepayFormData({
        ...repay,
        isFullRepayment: repay.paymentType === 'Full'
      });
      setIsRepayEdit(true);
    } else {
      // Find the first active loan to pre-populate if available
      const activeLoans = loans.filter(l => l.status === 'Active');
      const defaultLoan = activeLoans.length > 0 ? activeLoans[0] : (loans.length > 0 ? loans[0] : null);
      
      setRepayFormData({
        id: `RP${String(repayments.length + 1).padStart(3, '0')}`,
        loanId: defaultLoan ? defaultLoan.id : '',
        takerName: defaultLoan ? defaultLoan.takerName : '',
        repaymentDate: new Date().toISOString().split('T')[0],
        amountPaid: defaultLoan ? defaultLoan.outstanding : 0,
        paymentType: 'Full',
        status: 'Success',
        notes: '',
        isFullRepayment: true
      });
      setIsRepayEdit(false);
    }
    setOpenRepayModal(true);
  };

  // When selected loan changes, update taker name and default amount
  const handleLoanSelectionChange = (loanId) => {
    const selectedLoan = loans.find(l => l.id === loanId);
    if (selectedLoan) {
      setRepayFormData(prev => ({
        ...prev,
        loanId: selectedLoan.id,
        takerName: selectedLoan.takerName,
        amountPaid: prev.isFullRepayment ? selectedLoan.outstanding : prev.amountPaid
      }));
    }
  };

  // Toggle full repayment checkbox
  const handleFullRepaymentToggle = (checked) => {
    const selectedLoan = loans.find(l => l.id === repayFormData.loanId);
    setRepayFormData(prev => ({
      ...prev,
      isFullRepayment: checked,
      paymentType: checked ? 'Full' : 'Partial',
      amountPaid: checked && selectedLoan ? selectedLoan.outstanding : prev.amountPaid
    }));
  };

  // Save Repayment
  const handleSaveRepayment = async () => {
    if (!repayFormData.loanId) {
      toast.error("Please select a loan");
      return;
    }
    if (repayFormData.amountPaid <= 0) {
      toast.error("Repayment amount must be greater than 0");
      return;
    }
    setLoading(true);
    try {
      const rowData = [
        repayFormData.id,
        repayFormData.loanId,
        repayFormData.takerName,
        repayFormData.repaymentDate,
        repayFormData.amountPaid,
        repayFormData.isFullRepayment ? 'Full' : 'Partial',
        repayFormData.status,
        repayFormData.notes || ''
      ];

      if (isRepayEdit) {
        await updateSpreadsheetRow(`Loan_Repayments!A${repayFormData.sheetIndex}:H${repayFormData.sheetIndex}`, rowData);
        toast.success("Repayment record updated");
      } else {
        await appendSpreadsheetRow('Loan_Repayments!A:H', rowData);
        toast.success("Repayment recorded successfully");
      }
      setOpenRepayModal(false);
      await fetchLoansAndRepayments();
    } catch (error) {
      toast.error("Error saving repayment");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete Repayment
  const handleDeleteRepayment = async (repay) => {
    if (window.confirm(`Delete repayment record ${repay.id}?`)) {
      setLoading(true);
      try {
        await deleteSpreadsheetRow('Loan_Repayments', repay.sheetIndex);
        toast.success("Repayment deleted");
        await fetchLoansAndRepayments();
      } catch (error) {
        toast.error("Error deleting repayment");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  // KPI Calculations
  const totalPrincipal = loans.reduce((sum, l) => sum + l.principal, 0);
  const totalExpected = loans.reduce((sum, l) => sum + l.totalRepayable, 0);
  const totalRepaid = repayments.filter(r => r.status === 'Success').reduce((sum, r) => sum + r.amountPaid, 0);
  const totalOutstanding = Math.max(0, totalExpected - totalRepaid);

  // Filters logic
  const filteredLoans = loans.filter(l => {
    const matchSearch = l.takerName.toLowerCase().includes(loanSearch.toLowerCase()) || 
                        l.id.toLowerCase().includes(loanSearch.toLowerCase());
    const matchStatus = loanStatusFilter === 'All' || l.status === loanStatusFilter;
    const matchYear = loanYearFilter === 'All' || l.startYear === loanYearFilter;
    return matchSearch && matchStatus && matchYear;
  });

  const filteredRepayments = repayments.filter(r => {
    return r.takerName.toLowerCase().includes(repaymentSearch.toLowerCase()) ||
           r.loanId.toLowerCase().includes(repaymentSearch.toLowerCase()) ||
           r.id.toLowerCase().includes(repaymentSearch.toLowerCase());
  });

  return (
    <Box sx={{ width: '100%' }}>
      {/* Title & Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary">Loans & Repayments</Typography>
          <Typography variant="body2" color="text.secondary">Disburse loans and track repayments directly with Google Sheets</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<AddIcon />} 
            onClick={() => handleOpenRepayModal()}
            disabled={loans.length === 0}
          >
            Record Repayment
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />} 
            onClick={() => handleOpenLoanModal()}
          >
            Add New Loan
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(79, 70, 229, 0.02) 100%)', 
            borderLeft: '5px solid #4f46e5' 
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2" fontWeight="bold">Total Disbursed</Typography>
                <AccountBalanceWalletIcon color="primary" />
              </Box>
              <Typography variant="h4" fontWeight="bold">₹ {totalPrincipal.toLocaleString('en-IN')}</Typography>
              <Typography variant="caption" color="text.secondary">Principal amount of all loans</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, rgba(13, 148, 136, 0.02) 100%)', 
            borderLeft: '5px solid #0d9488' 
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2" fontWeight="bold">Expected Return</Typography>
                <TrendingUpIcon sx={{ color: '#0d9488' }} />
              </Box>
              <Typography variant="h4" fontWeight="bold">₹ {totalExpected.toLocaleString('en-IN')}</Typography>
              <Typography variant="caption" color="text.secondary">Includes calculated interest</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(46, 125, 50, 0.02) 100%)', 
            borderLeft: '5px solid #2e7d32' 
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2" fontWeight="bold">Total Repaid</Typography>
                <CheckCircleIcon sx={{ color: '#2e7d32' }} />
              </Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#2e7d32' }}>₹ {totalRepaid.toLocaleString('en-IN')}</Typography>
              <Typography variant="caption" color="text.secondary">Success repayment logs</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, rgba(211, 47, 47, 0.02) 100%)', 
            borderLeft: '5px solid #d32f2f' 
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography color="text.secondary" variant="subtitle2" fontWeight="bold">Net Outstanding</Typography>
                <ReceiptIcon sx={{ color: '#d32f2f' }} />
              </Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#d32f2f' }}>₹ {totalOutstanding.toLocaleString('en-IN')}</Typography>
              <Typography variant="caption" color="text.secondary">Awaiting repayment</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
          <Tab label="Loans Registry" id="loans-tab-0" />
          <Tab label={`Repayments (${repayments.length})`} id="loans-tab-1" />
        </Tabs>
      </Box>

      {loading && loans.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* TAB 0: Loans Tab */}
          {tabValue === 0 && (
            <Box>
              {/* Filters Panel */}
              <Paper sx={{ mb: 3, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Search Loans"
                      placeholder="Search Taker Name or Loan ID..."
                      size="small"
                      value={loanSearch}
                      onChange={(e) => setLoanSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon size="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Status"
                      size="small"
                      value={loanStatusFilter}
                      onChange={(e) => setLoanStatusFilter(e.target.value)}
                    >
                      <MenuItem value="All">All Statuses</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Fully Repaid">Fully Repaid</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      label="Start Year"
                      size="small"
                      value={loanYearFilter}
                      onChange={(e) => setLoanYearFilter(e.target.value)}
                    >
                      <MenuItem value="All">All Years</MenuItem>
                      {yearsList.map(y => (
                        <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>

              {/* Table */}
              <Paper>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell><b>Loan ID</b></TableCell>
                        <TableCell><b>Taker Info</b></TableCell>
                        <TableCell align="right"><b>Principal</b></TableCell>
                        <TableCell align="right"><b>Rate (%)</b></TableCell>
                        <TableCell align="right"><b>Tenure</b></TableCell>
                        <TableCell align="right"><b>Total Repayable</b></TableCell>
                        <TableCell align="right"><b>Total Repaid</b></TableCell>
                        <TableCell align="right"><b>Outstanding</b></TableCell>
                        <TableCell align="center"><b>Status</b></TableCell>
                        <TableCell align="right"><b>Actions</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredLoans.slice(loansPage * loansRowsPerPage, loansPage * loansRowsPerPage + loansRowsPerPage).map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">{row.takerName}</Typography>
                            {row.memberId && (
                              <Typography variant="caption" color="text.secondary">Member ID: {row.memberId}</Typography>
                            )}
                            <Typography variant="caption" display="block" color="text.secondary">Start: {row.startMonth} {row.startYear}</Typography>
                          </TableCell>
                          <TableCell align="right">₹ {row.principal.toLocaleString('en-IN')}</TableCell>
                          <TableCell align="right">{row.interestRate}%</TableCell>
                          <TableCell align="right">{row.tenure} months</TableCell>
                          <TableCell align="right">₹ {row.totalRepayable.toLocaleString('en-IN')}</TableCell>
                          <TableCell align="right" sx={{ color: 'success.main' }}>₹ {row.totalRepaid.toLocaleString('en-IN')}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: row.outstanding > 0 ? 'error.main' : 'text.primary' }}>
                            ₹ {row.outstanding.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={row.status} 
                              color={row.status === 'Fully Repaid' ? 'success' : 'warning'} 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton color="primary" onClick={() => handleOpenLoanModal(row)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleDeleteLoan(row)} size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredLoans.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                            No loans found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredLoans.length}
                  page={loansPage}
                  onPageChange={(e, newPage) => setLoansPage(newPage)}
                  rowsPerPage={loansRowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setLoansRowsPerPage(parseInt(e.target.value, 10));
                    setLoansPage(0);
                  }}
                />
              </Paper>
            </Box>
          )}

          {/* TAB 1: Repayments Tab */}
          {tabValue === 1 && (
            <Box>
              {/* Filters Panel */}
              <Paper sx={{ mb: 3, p: 2 }}>
                <TextField
                  fullWidth
                  label="Search Repayments"
                  placeholder="Search Repayment ID, Loan ID, or Taker Name..."
                  size="small"
                  value={repaymentSearch}
                  onChange={(e) => setRepaymentSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon size="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Paper>

              {/* Table */}
              <Paper>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell><b>Repayment ID</b></TableCell>
                        <TableCell><b>Loan ID</b></TableCell>
                        <TableCell><b>Taker Name</b></TableCell>
                        <TableCell><b>Repayment Date</b></TableCell>
                        <TableCell align="right"><b>Amount Paid</b></TableCell>
                        <TableCell align="center"><b>Payment Type</b></TableCell>
                        <TableCell align="center"><b>Status</b></TableCell>
                        <TableCell><b>Notes</b></TableCell>
                        <TableCell align="right"><b>Actions</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRepayments.slice(repayPage * repayRowsPerPage, repayPage * repayRowsPerPage + repayRowsPerPage).map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>{row.loanId}</TableCell>
                          <TableCell><b>{row.takerName}</b></TableCell>
                          <TableCell>{row.repaymentDate}</TableCell>
                          <TableCell align="right">₹ {row.amountPaid.toLocaleString('en-IN')}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={row.paymentType} 
                              color={row.paymentType === 'Full' ? 'info' : 'secondary'} 
                              size="small" 
                              variant="outlined" 
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={row.status} 
                              color={row.status === 'Success' ? 'success' : 'warning'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.notes || '-'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton color="primary" onClick={() => handleOpenRepayModal(row)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton color="error" onClick={() => handleDeleteRepayment(row)} size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredRepayments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                            No repayment logs found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredRepayments.length}
                  page={repayPage}
                  onPageChange={(e, newPage) => setRepayPage(newPage)}
                  rowsPerPage={repayRowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRepayRowsPerPage(parseInt(e.target.value, 10));
                    setRepayPage(0);
                  }}
                />
              </Paper>
            </Box>
          )}
        </>
      )}

      {/* Dialog for Add/Edit Loan */}
      <Dialog open={openLoanModal} onClose={() => setOpenLoanModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isLoanEdit ? 'Edit Loan Record' : 'Record New Loan Disbursement'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {/* Taker Name & Member Autocomplete */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Autocomplete
                options={membersList}
                getOptionLabel={(option) => option.label || option.name || loanFormData.takerName}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={membersList.find(m => m.id === loanFormData.memberId) || { name: loanFormData.takerName, id: loanFormData.memberId }}
                onChange={(event, newValue) => {
                  if (newValue) {
                    setLoanFormData(prev => ({ ...prev, takerName: newValue.name, memberId: newValue.id }));
                  } else {
                    setLoanFormData(prev => ({ ...prev, takerName: '', memberId: '' }));
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Link Member (Optional)" size="small" />}
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
              <TextField
                label="Taker Name"
                required
                value={loanFormData.takerName}
                onChange={e => setLoanFormData(prev => ({ ...prev, takerName: e.target.value }))}
                size="small"
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Principal Amount (₹)"
                type="number"
                required
                value={loanFormData.principal}
                onChange={e => setLoanFormData(prev => ({ ...prev, principal: Number(e.target.value) }))}
                fullWidth
                size="small"
              />
              <TextField
                label="Interest Rate (% per month)"
                type="number"
                required
                value={loanFormData.interestRate}
                onChange={e => setLoanFormData(prev => ({ ...prev, interestRate: Number(e.target.value) }))}
                fullWidth
                size="small"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Tenure (Months)"
                type="number"
                required
                value={loanFormData.tenure}
                onChange={e => setLoanFormData(prev => ({ ...prev, tenure: Number(e.target.value) }))}
                fullWidth
                size="small"
              />
              <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                <TextField
                  select
                  label="Start Month"
                  value={loanFormData.startMonth}
                  onChange={e => setLoanFormData(prev => ({ ...prev, startMonth: e.target.value }))}
                  fullWidth
                  size="small"
                >
                  {months.map(m => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Start Year"
                  value={loanFormData.startYear}
                  onChange={e => setLoanFormData(prev => ({ ...prev, startYear: e.target.value }))}
                  fullWidth
                  size="small"
                >
                  {yearsList.map(y => (
                    <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            {/* Live calculation summary */}
            <Paper sx={{ p: 2, bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Live Calculations</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Interest Earned:</Typography>
                </Grid>
                <Grid item xs={6} align="right">
                  <Typography variant="body2" fontWeight="bold">
                    ₹ {((loanFormData.principal * loanFormData.interestRate * loanFormData.tenure) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Repayable:</Typography>
                </Grid>
                <Grid item xs={6} align="right">
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    ₹ {(loanFormData.principal + ((loanFormData.principal * loanFormData.interestRate * loanFormData.tenure) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <TextField
              label="Notes"
              value={loanFormData.notes || ''}
              onChange={e => setLoanFormData(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoanModal(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveLoan} variant="contained" color="primary">
            {isLoanEdit ? 'Update Loan' : 'Save Loan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Record Repayment */}
      <Dialog open={openRepayModal} onClose={() => setOpenRepayModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isRepayEdit ? 'Edit Repayment Record' : 'Record Loan Repayment'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {/* Select Loan */}
            <TextField
              select
              label="Select Active Loan"
              required
              disabled={isRepayEdit}
              value={repayFormData.loanId}
              onChange={(e) => handleLoanSelectionChange(e.target.value)}
              fullWidth
              size="small"
            >
              {loans.map(l => (
                <MenuItem key={l.id} value={l.id}>
                  {l.takerName} ({l.id}) — Outstanding: ₹{l.outstanding.toLocaleString('en-IN')} {l.status === 'Fully Repaid' ? '(Paid)' : ''}
                </MenuItem>
              ))}
              {loans.length === 0 && (
                <MenuItem value="" disabled>No loans registered</MenuItem>
              )}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Repayment Date"
                type="date"
                required
                value={repayFormData.repaymentDate}
                onChange={e => setRepayFormData(prev => ({ ...prev, repaymentDate: e.target.value }))}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                label="Status"
                value={repayFormData.status}
                onChange={e => setRepayFormData(prev => ({ ...prev, status: e.target.value }))}
                fullWidth
                size="small"
              >
                <MenuItem value="Success">Success</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={repayFormData.isFullRepayment} 
                    onChange={e => handleFullRepaymentToggle(e.target.checked)} 
                    color="primary"
                  />
                }
                label="Repayment Success / Full Repayment (Clears outstanding balance)"
              />
              
              <TextField
                label={repayFormData.isFullRepayment ? "Payment Amount (₹) - Locked to Outstanding" : "Payment Amount (₹) - Partial Payment"}
                type="number"
                required
                disabled={repayFormData.isFullRepayment}
                value={repayFormData.amountPaid}
                onChange={e => setRepayFormData(prev => ({ ...prev, amountPaid: Number(e.target.value) }))}
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label="Notes"
              placeholder="e.g. Paid in cash, bank reference ID, receipt details..."
              value={repayFormData.notes || ''}
              onChange={e => setRepayFormData(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRepayModal(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveRepayment} variant="contained" color="primary">
            {isRepayEdit ? 'Update Repayment' : 'Save Repayment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Loans;
