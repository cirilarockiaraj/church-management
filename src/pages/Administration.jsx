import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, MenuItem, 
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Chip, CircularProgress, Grid, Divider 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyIcon from '@mui/icons-material/Key';
import toast from 'react-hot-toast';
import { getSpreadsheetData, appendSpreadsheetRow, updateSpreadsheetRow, deleteSpreadsheetRow } from '../services/googleSheetsService';

const Administration = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '', password: '', role: 'Editor', status: 'Active'
  });
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getSpreadsheetData('Credentials!A2:D');
      if (data) {
        const formattedData = data.map((row, index) => {
          // Decode password safely using atob for display/edit
          let decodedPassword = '';
          try {
            decodedPassword = row[1] ? atob(row[1]) : '';
          } catch (e) {
            decodedPassword = row[1] || ''; // Fallback if not base64 encoded
          }

          return {
            sheetIndex: index + 2,
            username: row[0] || '',
            password: decodedPassword,
            role: row[2] || 'Editor',
            status: row[3] || 'Inactive'
          };
        });
        setUsers(formattedData);
      } else {
        setUsers([]);
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load credentials registry');
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setFormData(user);
      setIsEdit(true);
    } else {
      setFormData({
        username: '', password: '', role: 'Editor', status: 'Active'
      });
      setIsEdit(false);
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleSave = async () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error("Username and Password are required");
      return;
    }
    setLoading(true);
    try {
      // Base64 encode the password before saving to match authService decryption (atob)
      const encodedPassword = btoa(formData.password);
      const rowData = [
        formData.username,
        encodedPassword,
        formData.role,
        formData.status
      ];

      if (isEdit) {
        await updateSpreadsheetRow(`Credentials!A${formData.sheetIndex}:D${formData.sheetIndex}`, rowData);
        toast.success("User credentials updated");
      } else {
        // Double check username uniqueness
        const exists = users.some(u => u.username.toLowerCase() === formData.username.toLowerCase());
        if (exists) {
          toast.error("Username already exists");
          setLoading(false);
          return;
        }
        await appendSpreadsheetRow('Credentials!A:D', rowData);
        toast.success("User created successfully");
      }
      handleCloseModal();
      await fetchUsers();
    } catch (error) {
      toast.error("Error saving credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (users.length <= 1) {
      toast.error("Cannot delete the only remaining admin account!");
      return;
    }
    if (window.confirm(`Delete user: ${user.username}?`)) {
      setLoading(true);
      try {
        await deleteSpreadsheetRow('Credentials', user.sheetIndex);
        toast.success("User credentials deleted");
        await fetchUsers();
      } catch (error) {
        toast.error("Error deleting user");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SettingsIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">Settings & Administration</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage system settings, roles, access permissions, and sync health
            </Typography>
          </Box>
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />} 
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: '10px' }}
        >
          Create New User
        </Button>
      </Box>

      {/* Main Settings Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <KeyIcon color="primary" /> User Access Credentials
            </Typography>

            {loading && users.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
              <TableContainer sx={{ border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Role Privilege</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.username} hover>
                        <TableCell sx={{ fontWeight: 'bold' }}>{u.username}</TableCell>
                        <TableCell>
                          <Chip 
                            label={u.role} 
                            size="small" 
                            color={u.role === 'Admin' ? 'secondary' : 'default'} 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={u.status} 
                            size="small" 
                            color={u.status === 'Active' ? 'success' : 'default'} 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton color="primary" onClick={() => handleOpenModal(u)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleDelete(u)} size="small" disabled={users.length <= 1}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>System Environment</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The system operates completely serverless. It communicates directly with Google Sheets APIs to load and store data.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Database Engine</Typography>
                <Typography variant="body2" fontWeight="bold">Google Sheets V4 API</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Active Directory Authorization</Typography>
                <Typography variant="body2" fontWeight="bold">Google Identity Services (GIS)</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Encryption Standard</Typography>
                <Typography variant="body2" fontWeight="bold">Base64 Credentials Encoding</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal Dialog */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="xs" fullWidth>
        <DialogTitle>{isEdit ? 'Edit User Credentials' : 'Create Access Profile'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField 
              label="Username" 
              required 
              disabled={isEdit} 
              value={formData.username} 
              onChange={e => setFormData({...formData, username: e.target.value})} 
              fullWidth 
              size="small" 
            />
            <TextField 
              label="Password" 
              required 
              type="text" // Shown as plain text for admins convenience, or password type
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              fullWidth 
              size="small" 
            />
            <TextField 
              select 
              label="Access Privilege Role" 
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value})} 
              fullWidth 
              size="small"
            >
              <MenuItem value="Admin">Admin (Full access)</MenuItem>
              <MenuItem value="Editor">Editor (Write access)</MenuItem>
              <MenuItem value="Viewer">Viewer (Read only)</MenuItem>
            </TextField>
            <TextField 
              select 
              label="Status" 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value})} 
              fullWidth 
              size="small"
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Administration;
