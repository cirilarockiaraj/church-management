import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, TextField, 
  MenuItem, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, Chip, CircularProgress, Grid, InputAdornment 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import toast from 'react-hot-toast';
import { getSpreadsheetData, appendSpreadsheetRow, updateSpreadsheetRow, deleteSpreadsheetRow } from '../services/googleSheetsService';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', familyName: '', phone: '', address: '', status: 'Active' });
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getSpreadsheetData('Members!A2:F');
      if (data) {
        const formattedData = data.map((row, index) => ({
          sheetIndex: index + 2, 
          id: row[0] || '',
          name: row[1] || '',
          familyName: row[2] || '',
          phone: row[3] || '',
          address: row[4] || '',
          status: row[5] || 'Inactive',
        }));
        setMembers(formattedData);
      } else {
        setMembers([]);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load members');
      setLoading(false);
    }
  };

  const handleOpenModal = (member = null) => {
    if (member) {
      setFormData(member);
      setIsEdit(true);
    } else {
      setFormData({ 
        id: `MEM${String(members.length + 1).padStart(3, '0')}`, 
        name: '', familyName: '', phone: '', address: '', status: 'Active' 
      });
      setIsEdit(false);
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData({ id: '', name: '', familyName: '', phone: '', address: '', status: 'Active' });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setLoading(true);
    try {
      const rowData = [formData.id, formData.name, formData.familyName, formData.phone, formData.address, formData.status];
      if (isEdit) {
        await updateSpreadsheetRow(`Members!A${formData.sheetIndex}:F${formData.sheetIndex}`, rowData);
        toast.success("Member updated successfully");
      } else {
        await appendSpreadsheetRow('Members!A:F', rowData);
        toast.success("Member added successfully");
      }
      handleCloseModal();
      await fetchMembers();
    } catch (error) {
      toast.error(isEdit ? "Error updating member" : "Error saving member");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memberToDelete) => {
    if(window.confirm(`Are you sure you want to delete member: ${memberToDelete.name}?`)) {
        setLoading(true);
        try {
           await deleteSpreadsheetRow('Members', memberToDelete.sheetIndex);
           toast.success("Member record deleted");
           await fetchMembers();
        } catch (error) {
           toast.error("Error deleting member");
        } finally {
          setLoading(false);
        }
    }
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (members.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ['ID', 'Name', 'Family Name', 'Phone', 'Address', 'Status'];
    const rows = members.map(m => [m.id, m.name, m.familyName, m.phone, m.address, m.status]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `church_members_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Export downloaded");
  };

  // Filtering
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                          m.id.toLowerCase().includes(search.toLowerCase()) ||
                          m.familyName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* Header and Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Parish Members Directory</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage parishioner records, contacts, and membership status
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<FileDownloadIcon />} 
            onClick={handleExportCSV}
            sx={{ borderRadius: '10px' }}
          >
            Export CSV
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />} 
            onClick={() => handleOpenModal()}
            sx={{ borderRadius: '10px' }}
          >
            Add New Member
          </Button>
        </Box>
      </Box>

      {/* Filter / Search Bar */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField 
              fullWidth
              label="Search by Name, Family, or ID" 
              variant="outlined" 
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '10px' }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Filter Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '10px' }
              }}
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {loading && members.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
      ) : (
        <Paper>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Member ID</TableCell>
                  <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Full Name</TableCell>
                  <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Family Unit</TableCell>
                  <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Phone</TableCell>
                  <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Address</TableCell>
                  <TableCell align="center" sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell sx={{ fontWeight: '600' }}>{row.name}</TableCell>
                    <TableCell>{row.familyName || '-'}</TableCell>
                    <TableCell>{row.phone || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.address || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={row.status} 
                        color={row.status === 'Active' ? 'success' : 'default'} 
                        size="small" 
                        variant={row.status === 'Active' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpenModal(row)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(row)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      No members found matching filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredMembers.length}
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

      {/* Modal for Add / Edit */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Member Record' : 'Create Member Profile'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="Member ID" value={formData.id} disabled fullWidth size="small" />
            <TextField label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} fullWidth size="small" required />
            <TextField label="Family Unit Name" value={formData.familyName} onChange={e => setFormData({...formData, familyName: e.target.value})} fullWidth size="small" />
            <TextField label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} fullWidth size="small" />
            <TextField label="Home Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} fullWidth size="small" multiline rows={3} />
            <TextField select label="Status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} fullWidth size="small">
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {isEdit ? 'Save Changes' : 'Create Profile'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Members;
