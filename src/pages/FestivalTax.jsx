import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, MenuItem, 
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, CircularProgress,
  TablePagination, IconButton, Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { getSpreadsheetData, appendSpreadsheetRow, updateSpreadsheetRow, deleteSpreadsheetRow } from '../services/googleSheetsService';

const FestivalTax = () => {
  const [taxes, setTaxes] = useState([]);
  const [membersList, setMembersList] = useState([]); // Added to hold members
  const [festivalsList, setFestivalsList] = useState([]); // Added to hold festival names
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [festivalFilter, setFestivalFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [memberFilter, setMemberFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({
    id: '', festivalName: '', year: new Date().getFullYear().toString(),
    memberId: '', memberName: '', amount: 500, status: 'Paid', date: new Date().toISOString().split('T')[0]
  });

  // Dynamic Years Setup
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from(new Array(100), (val, index) => currentYear - 20 + index); // E.g., 2023 - 2028

  useEffect(() => {
    fetchTaxes();
    fetchMembersList();
    fetchFestivalsList();
  }, []);
  
  const fetchFestivalsList = async () => {
     try {
        const data = await getSpreadsheetData('Festivals!A2:A');
        if (data) {
           const festivals = data.map(row => row[0]).filter(Boolean); // Extract column A and remove empty ones
           setFestivalsList(festivals);
        }
     } catch (error) {
        console.error("Failed to load festivals list", error);
     }
  };
  
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

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const data = await getSpreadsheetData('Festival_Tax!A2:H');
      if (data) {
        const formattedData = data.map((row, index) => ({
          sheetIndex: index + 2, // 1-based index including header
          id: row[0] || '',
          festivalName: row[1] || '',
          year: row[2] || '',
          memberId: row[3] || '',
          memberName: row[4] || '',
          amount: Number(row[5]) || 0,
          status: row[6] || 'Pending',
          date: row[7] || '',
        }));
        setTaxes(formattedData);
      } else {
        setTaxes([]);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load festival taxes');
      setLoading(false);
    }
  };

  const handleOpenModal = (tax = null, index = null) => {
    if (tax) {
       setFormData(tax);
       setIsEdit(true);
       setEditIndex(index);
    } else {
       setFormData({
         id: `TAX${String(taxes.length + 1).padStart(3, '0')}`,
         festivalName: '', year: new Date().getFullYear().toString(),
         memberId: '', memberName: '', amount: 500, status: 'Paid', date: new Date().toISOString().split('T')[0]
       });
       setIsEdit(false);
       setEditIndex(null);
    }
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      const rowData = [
        formData.id, formData.festivalName, formData.year, 
        formData.memberId, formData.memberName, formData.amount, 
        formData.status, formData.status === 'Paid' ? formData.date : ''
      ];

      if (isEdit) {
        await updateSpreadsheetRow(`Festival_Tax!A${formData.sheetIndex}:H${formData.sheetIndex}`, rowData);
        toast.success("Tax record updated");
      } else {
        await appendSpreadsheetRow('Festival_Tax!A:H', rowData);
        toast.success("Tax record added");
      }
      setOpenModal(false);
      fetchTaxes(); // refresh
    } catch (error) {
       toast.error(isEdit ? "Error updating record" : "Error adding record");
    }
  };

  const handleDelete = async (taxToDelete) => {
      if (window.confirm("Delete this record?")) {
         try {
            await deleteSpreadsheetRow('Festival_Tax', taxToDelete.sheetIndex);
            toast.success("Record deleted");
            fetchTaxes(); // refresh
         } catch (error) {
            toast.error("Error deleting record");
         }
      }
  };

  // Filter Logic
  const filteredTaxes = taxes.filter(tax => {
    const matchMember = tax.memberName.toLowerCase().includes(memberFilter.toLowerCase()) || 
                        tax.memberId.toLowerCase().includes(memberFilter.toLowerCase());
    const matchFestival = festivalFilter === 'All' || tax.festivalName === festivalFilter;
    const matchYear = yearFilter === 'All' || tax.year === yearFilter;
    return matchMember && matchFestival && matchYear;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Festival Tax</Typography>
        <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Add Festival Tax
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
          <TextField select label="Festival" value={festivalFilter} onChange={(e) => setFestivalFilter(e.target.value)} size="small" sx={{ minWidth: 150 }}>
            <MenuItem value="All">All Festivals</MenuItem>
            {festivalsList.map(f => (
               <MenuItem key={f} value={f}>{f}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} size="small" sx={{ minWidth: 100 }}>
            <MenuItem value="All">All Years</MenuItem>
            {yearsList.map(y => (
              <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
            ))}
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
                  <TableCell><b>Tax ID</b></TableCell>
                  <TableCell><b>Festival</b></TableCell>
                  <TableCell><b>Member</b></TableCell>
                  <TableCell><b>Amount</b></TableCell>
                  <TableCell><b>Status</b></TableCell>
                  <TableCell><b>Date</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTaxes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.festivalName} {row.year}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{row.memberName}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.memberId}</Typography>
                    </TableCell>
                    <TableCell>₹ {row.amount}</TableCell>
                    <TableCell>
                      <Chip label={row.status} color={row.status === 'Paid' ? 'success' : 'warning'} size="small" />
                    </TableCell>
                    <TableCell>{row.date || '-'}</TableCell>
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
                {filteredTaxes.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={7} align="center">No records found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredTaxes.length}
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
        <DialogTitle>{isEdit ? 'Edit Festival Tax' : 'Add Festival Tax'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
               <TextField label="Festival Name" value={formData.festivalName} onChange={e => setFormData({...formData, festivalName: e.target.value})} fullWidth size="small" />
               <TextField select label="Year" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} fullWidth size="small">
                 {yearsList.map(y => (
                    <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
                 ))}
              </TextField>
            </Box>
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
          <Button onClick={handleSave} variant="contained" color="secondary">{isEdit ? 'Update' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FestivalTax;
