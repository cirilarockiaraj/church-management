import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, MenuItem, 
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, CircularProgress,
  TablePagination, Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import IconButton from '@mui/material/IconButton';
import { getSpreadsheetData, appendSpreadsheetRow, updateSpreadsheetRow, deleteSpreadsheetRow } from '../services/googleSheetsService';

const Subscription = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [membersList, setMembersList] = useState([]); // Added to hold members
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [memberFilter, setMemberFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({
    id: '', memberId: '', memberName: '', month: '', year: new Date().getFullYear().toString(), 
    amount: 100, status: 'Paid', date: new Date().toISOString().split('T')[0]
  });

  // Dynamic Years Setup
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from(new Array(100), (val, index) => currentYear - 20 + index); // E.g., 2023 - 2028

  useEffect(() => {
    fetchSubscriptions();
    fetchMembersList();
  }, []);
  
  const fetchMembersList = async () => {
     try {
        const data = await getSpreadsheetData('Members!A2:C');
        if (data) {
           const members = data.map(row => ({
              id: row[0] || '',
              name: row[1] || '',
              label: `${row[1]} (${row[0]})` // Used for Autocomplete
           }));
           setMembersList(members);
        }
     } catch (error) {
        console.error("Failed to load members list for autocomplete", error);
     }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await getSpreadsheetData('Monthly_Subscription!A2:H');
      if (data) {
        const formattedData = data.map((row, index) => ({
          sheetIndex: index + 2, // 1-based index including header
          id: row[0] || '',
          memberId: row[1] || '',
          memberName: row[2] || '',
          month: row[3] || '',
          year: row[4] || '',
          amount: Number(row[5]) || 0,
          status: row[6] || 'Pending',
          date: row[7] || '',
        }));
        setSubscriptions(formattedData);
      } else {
        setSubscriptions([]);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load subscriptions');
      setLoading(false);
    }
  };

  const handleOpenModal = (sub = null, index = null) => {
    if (sub) {
       setFormData(sub);
       setIsEdit(true);
       setEditIndex(index);
    } else {
       setFormData({
         id: `PAY${String(subscriptions.length + 1).padStart(3, '0')}`,
         memberId: '', memberName: '', month: '', year: new Date().getFullYear().toString(), 
         amount: 100, status: 'Paid', date: new Date().toISOString().split('T')[0]
       });
       setIsEdit(false);
       setEditIndex(null);
    }
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      const rowData = [
        formData.id, formData.memberId, formData.memberName, 
        formData.month, formData.year, formData.amount, 
        formData.status, formData.status === 'Paid' ? formData.date : ''
      ];
      
      if (isEdit) {
         await updateSpreadsheetRow(`Monthly_Subscription!A${formData.sheetIndex}:H${formData.sheetIndex}`, rowData);
         toast.success("Payment record updated successfully");
      } else {
         await appendSpreadsheetRow('Monthly_Subscription!A:H', rowData);
         toast.success("Payment recorded successfully");
      }
      
      setOpenModal(false);
      fetchSubscriptions(); // refresh
    } catch (error) {
       toast.error(isEdit ? "Error updating payment" : "Error recording payment");
    }
  };

  const handleDelete = async (subToDelete) => {
      if (window.confirm("Delete this subscription record?")) {
         try {
            await deleteSpreadsheetRow('Monthly_Subscription', subToDelete.sheetIndex);
            toast.success("Record deleted");
            fetchSubscriptions(); // refresh
         } catch (error) {
            toast.error("Error deleting record");
         }
      }
  };

  // Filter Logic
  const filteredSubs = subscriptions.filter(sub => {
    const matchMember = sub.memberName.toLowerCase().includes(memberFilter.toLowerCase()) || 
                        sub.memberId.toLowerCase().includes(memberFilter.toLowerCase());
    const matchMonth = monthFilter === 'All' || sub.month === monthFilter;
    const matchYear = yearFilter === 'All' || sub.year === yearFilter;
    const matchStatus = statusFilter === 'All' || sub.status === statusFilter;
    return matchMember && matchMonth && matchYear && matchStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Monthly Subscriptions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Record Payment
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField 
            label="Search Member" 
            variant="outlined" 
            size="small"
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <TextField select label="Month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} size="small" sx={{ minWidth: 120 }}>
            <MenuItem value="All">All Months</MenuItem>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} size="small" sx={{ minWidth: 100 }}>
            <MenuItem value="All">All Years</MenuItem>
            {yearsList.map(y => (
              <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="small" sx={{ minWidth: 120 }}>
            <MenuItem value="All">All Status</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell><b>Pay ID</b></TableCell>
                  <TableCell><b>Member</b></TableCell>
                  <TableCell><b>Period</b></TableCell>
                  <TableCell><b>Amount</b></TableCell>
                  <TableCell><b>Date</b></TableCell>
                  <TableCell><b>Status</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{row.memberName}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.memberId}</Typography>
                    </TableCell>
                    <TableCell>{row.month} {row.year}</TableCell>
                    <TableCell>₹ {row.amount}</TableCell>
                    <TableCell>{row.date || '-'}</TableCell>
                    <TableCell>
                      <Chip label={row.status} color={row.status === 'Paid' ? 'success' : 'warning'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpenModal(row, index)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(row)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSubs.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={7} align="center">No payment records found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredSubs.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>
      )}

      {/* Modal for Record Payment */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Monthly Payment' : 'Record Monthly Payment'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
               <Autocomplete
                 options={membersList}
                 getOptionLabel={(option) => option.label || option.name || formData.memberName}
                 isOptionEqualToValue={(option, value) => option.id === value.id}
                 value={membersList.find(m => m.id === formData.memberId) || { name: formData.memberName, id: formData.memberId }}
                 onChange={(event, newValue) => {
                    if (newValue) {
                       setFormData({ ...formData, memberName: newValue.name, memberId: newValue.id });
                    } else {
                       setFormData({ ...formData, memberName: '', memberId: '' });
                    }
                 }}
                 renderInput={(params) => <TextField {...params} label="Member Name" size="small" />}
                 sx={{ flexGrow: 1 }}
               />
               <TextField 
                 label="Member ID" 
                 value={formData.memberId} 
                 onChange={e => setFormData({...formData, memberId: e.target.value})} 
                 size="small"
                 sx={{ width: '150px' }}
               />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField select label="Month" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} fullWidth size="small">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </TextField>
              <TextField select label="Year" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} fullWidth size="small">
                 {yearsList.map(y => (
                    <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
                 ))}
              </TextField>
            </Box>
            <TextField label="Amount (₹)" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} fullWidth size="small" />
            <TextField select label="Payment Status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} fullWidth size="small">
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </TextField>
            {formData.status === 'Paid' && (
              <TextField label="Payment Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">{isEdit ? 'Update Payment' : 'Save Payment'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Subscription;
