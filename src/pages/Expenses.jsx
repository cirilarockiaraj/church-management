import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, MenuItem, 
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  TablePagination, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { getSpreadsheetData, appendSpreadsheetRow, updateSpreadsheetRow, deleteSpreadsheetRow } from '../services/googleSheetsService';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [detailFilter, setDetailFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({
    id: '', expenseDetail: '', amount: 100, date: new Date().toISOString().split('T')[0], notes: ''
  });

  // Dynamic Years Setup
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from(new Array(100), (val, index) => currentYear - 20 + index); // E.g., 2023 - 2028  

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await getSpreadsheetData('Expenses!A2:E');
      if (data) {
        const formattedData = data.map((row, index) => ({
          sheetIndex: index + 2, // 1-based index including header
          id: row[0] || '',
          expenseDetail: row[1] || '',
          amount: Number(row[2]) || 0,
          date: row[3] || '',
          notes: row[4] || '',
        }));
        setExpenses(formattedData);
      } else {
        setExpenses([]);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load expenses');
      setLoading(false);
    }
  };

  const handleOpenModal = (expense = null, index = null) => {
    if (expense) {
       setFormData(expense);
       setIsEdit(true);
       setEditIndex(index);
    } else {
       setFormData({
         id: `EXP${String(expenses.length + 1).padStart(3, '0')}`,
         expenseDetail: '', amount: 100, date: new Date().toISOString().split('T')[0], notes: ''
       });
       setIsEdit(false);
       setEditIndex(null);
    }
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      const rowData = [
        formData.id, formData.expenseDetail, formData.amount, 
        formData.date, formData.notes
      ];

      if (isEdit) {
        await updateSpreadsheetRow(`Expenses!A${formData.sheetIndex}:E${formData.sheetIndex}`, rowData);
        toast.success("Expense record updated");
      } else {
        await appendSpreadsheetRow('Expenses!A:E', rowData);
        toast.success("Expense record added");
      }
      setOpenModal(false);
      fetchExpenses(); // refresh
    } catch (error) {
       toast.error(isEdit ? "Error updating record" : "Error adding record");
    }
  };

  const handleDelete = async (expToDelete) => {
      if (window.confirm("Delete this expense record?")) {
         try {
            await deleteSpreadsheetRow('Expenses', expToDelete.sheetIndex);
            toast.success("Record deleted");
            fetchExpenses(); // refresh
         } catch (error) {
            toast.error("Error deleting record");
         }
      }
  };

  // Filter Logic
  const filteredExpenses = expenses.filter(exp => {
    const matchDetail = exp.expenseDetail.toLowerCase().includes(detailFilter.toLowerCase());
    const matchDate = dateFilter === '' || exp.date === dateFilter;
    const matchYear = yearFilter === 'All' || exp.date.startsWith(yearFilter);
    return matchDetail && matchDate && matchYear;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Expenses</Typography>
        <Button variant="contained" color="error" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Add Expense
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField 
            label="Search Expense Detail" 
            variant="outlined" 
            size="small"
            value={detailFilter}
            onChange={(e) => setDetailFilter(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <TextField select label="Filter by Year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} size="small" sx={{ minWidth: 120 }}>
            <MenuItem value="All">All Years</MenuItem>
            {yearsList.map(y => (
              <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
            ))}
          </TextField>
          <TextField 
             label="Exact Date" 
             type="date" 
             value={dateFilter} 
             onChange={(e) => setDateFilter(e.target.value)} 
             size="small" 
             InputLabelProps={{ shrink: true }}
             sx={{ minWidth: 150 }}
          />
          {dateFilter && (
             <Button variant="text" size="small" onClick={() => setDateFilter('')}>Clear Date</Button>
          )}
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
                  <TableCell><b>ID</b></TableCell>
                  <TableCell><b>Expense Detail</b></TableCell>
                  <TableCell><b>Amount</b></TableCell>
                  <TableCell><b>Date</b></TableCell>
                  <TableCell><b>Notes</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.expenseDetail}</TableCell>
                    <TableCell>₹ {row.amount}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.notes || '-'}</TableCell>
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
                {filteredExpenses.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={6} align="center">No expenses found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredExpenses.length}
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

      {/* Modal for Add/Edit Expense */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Expense Detail" value={formData.expenseDetail} onChange={e => setFormData({...formData, expenseDetail: e.target.value})} fullWidth size="small" />
            <Box sx={{ display: 'flex', gap: 2 }}>
               <TextField label="Amount (₹)" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} fullWidth size="small" />
               <TextField label="Expense Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField label="Notes / Description" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} fullWidth size="small" multiline rows={3} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="error">{isEdit ? 'Update' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Expenses;
