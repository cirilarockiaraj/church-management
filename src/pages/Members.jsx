import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, TextField, 
  MenuItem, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, Chip, CircularProgress 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getSpreadsheetData, appendSpreadsheetRow, updateSpreadsheetRow, deleteSpreadsheetRow } from '../services/googleSheetsService';
import toast from 'react-hot-toast';

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
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getSpreadsheetData('Members!A2:F');
      if (data) {
        const formattedData = data.map((row, index) => ({
          sheetIndex: index + 2, // to track row number for updates (Header is row 1)
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

  const handleOpenModal = (member = null, index = null) => {
    if (member) {
      setFormData(member);
      setIsEdit(true);
      setEditIndex(index);
    } else {
      setFormData({ 
        id: `MEM${String(members.length + 1).padStart(3, '0')}`, 
        name: '', familyName: '', phone: '', address: '', status: 'Active' 
      });
      setIsEdit(false);
      setEditIndex(null);
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData({ id: '', name: '', familyName: '', phone: '', address: '', status: 'Active' });
  };

  const handleSave = async () => {
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
      fetchMembers(); // refresh
    } catch (error) {
      toast.error(isEdit ? "Error updating member" : "Error saving member");
    }
  };

  const handleDelete = async (memberToDelete) => {
    if(window.confirm('Are you sure you want to delete this member?')) {
        try {
           await deleteSpreadsheetRow('Members', memberToDelete.sheetIndex);
           toast.success("Member record deleted");
           fetchMembers(); // refresh
        } catch (error) {
           toast.error("Error deleting member");
        }
    }
  };

  // Filtering
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Church Members</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Add Member
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField 
            label="Search by Name or ID" 
            variant="outlined" 
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            select
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="All">All Statuses</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
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
                  <TableCell><b>ID</b></TableCell>
                  <TableCell><b>Name</b></TableCell>
                  <TableCell><b>Family Name</b></TableCell>
                  <TableCell><b>Phone</b></TableCell>
                  <TableCell><b>Status</b></TableCell>
                  <TableCell align="right"><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.familyName}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell>
                      <Chip label={row.status} color={row.status === 'Active' ? 'success' : 'default'} size="small" />
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
        <DialogTitle>{isEdit ? 'Edit Member' : 'Add New Member'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Member ID" value={formData.id} disabled fullWidth size="small" />
            <TextField label="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} fullWidth size="small" />
            <TextField label="Family Name" value={formData.familyName} onChange={e => setFormData({...formData, familyName: e.target.value})} fullWidth size="small" />
            <TextField label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} fullWidth size="small" />
            <TextField label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} fullWidth size="small" multiline rows={2} />
            <TextField select label="Status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} fullWidth size="small">
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Members;
