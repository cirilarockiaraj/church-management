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

const Donations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [donorFilter, setDonorFilter] = useState('');
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
    id: '', donorName: '', amount: 100, date: new Date().toISOString().split('T')[0], notes: ''
  });

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const data = await getSpreadsheetData('Donations!A2:E');
      if (data) {
        const formattedData = data.map((row, index) => ({
          sheetIndex: index + 2, // 1-based index including header
          id: row[0] || '',
          donorName: row[1] || '',
          amount: Number(row[2]) || 0,
          date: row[3] || '',
          notes: row[4] || '',
        }));
        setDonations(formattedData);
      } else {
        setDonations([]);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load donations');
      setLoading(false);
    }
  };

  const handleOpenModal = (donation = null, index = null) => {
    if (donation) {
       setFormData(donation);
       setIsEdit(true);
       setEditIndex(index);
    } else {
       setFormData({
         id: `DON${String(donations.length + 1).padStart(3, '0')}`,
         donorName: '', amount: 100, date: new Date().toISOString().split('T')[0], notes: ''
       });
       setIsEdit(false);
       setEditIndex(null);
    }
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      const rowData = [
        formData.id, formData.donorName, formData.amount, 
        formData.date, formData.notes
      ];

      if (isEdit) {
        await updateSpreadsheetRow(`Donations!A${formData.sheetIndex}:E${formData.sheetIndex}`, rowData);
        toast.success("Donation record updated");
      } else {
        await appendSpreadsheetRow('Donations!A:E', rowData);
        toast.success("Donation record added");
      }
      setOpenModal(false);
      fetchDonations(); // refresh
    } catch (error) {
       toast.error(isEdit ? "Error updating record" : "Error adding record");
    }
  };

  const handleDelete = async (donToDelete) => {
      if (window.confirm("Delete this donation record?")) {
         try {
            await deleteSpreadsheetRow('Donations', donToDelete.sheetIndex);
            toast.success("Record deleted");
            fetchDonations(); // refresh
         } catch (error) {
            toast.error("Error deleting record");
         }
      }
  };

  // Filter Logic
  const filteredDonations = donations.filter(don => {
    const matchDonor = don.donorName.toLowerCase().includes(donorFilter.toLowerCase());
    const matchDate = dateFilter === '' || don.date === dateFilter;
    const matchYear = yearFilter === 'All' || don.date.startsWith(yearFilter);
    return matchDonor && matchDate && matchYear;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Donations</Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Add Donation
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField 
            label="Search Donor Name" 
            variant="outlined" 
            size="small"
            value={donorFilter}
            onChange={(e) => setDonorFilter(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <TextField select label="Filter by Year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} size="small" sx={{ minWidth: 120 }}>
            <MenuItem value="All">All Years</MenuItem>
            <MenuItem value="2023">2023</MenuItem>
            <MenuItem value="2024">2024</MenuItem>
            <MenuItem value="2025">2025</MenuItem>
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
                  <TableCell><b>Donation ID</b></TableCell>
                  <TableCell><b>Donor Name</b></TableCell>
                  <TableCell><b>Amount</b></TableCell>
                  <TableCell><b>Date</b></TableCell>
                  <TableCell><b>Notes</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDonations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.donorName}</TableCell>
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
                {filteredDonations.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={6} align="center">No donations found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredDonations.length}
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

      {/* Modal for Add/Edit Donation */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Donation' : 'Add New Donation'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Donor Name" value={formData.donorName} onChange={e => setFormData({...formData, donorName: e.target.value})} fullWidth size="small" />
            <Box sx={{ display: 'flex', gap: 2 }}>
               <TextField label="Amount (₹)" type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} fullWidth size="small" />
               <TextField label="Donation Date" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField label="Notes / Purpose" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} fullWidth size="small" multiline rows={3} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="success">{isEdit ? 'Update' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Donations;
