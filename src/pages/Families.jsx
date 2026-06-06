import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, TextField, 
  MenuItem, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, Chip, CircularProgress, Grid, InputAdornment, Card, CardContent, Autocomplete
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import PersonIcon from '@mui/icons-material/Person';
import toast from 'react-hot-toast';
import { 
  getSpreadsheetData, 
  appendSpreadsheetRow, 
  updateSpreadsheetRow, 
  deleteSpreadsheetRow,
  ensureSheetExists
} from '../services/googleSheetsService';

const Families = () => {
  const [families, setFamilies] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({ 
    id: '', familyName: '', headOfFamily: '', headOfFamilyId: '', 
    address: '', phone: '', membersCount: 1, status: 'Active', notes: '' 
  });
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    initializeAndFetchData();
  }, []);

  const initializeAndFetchData = async () => {
    setLoading(true);
    try {
      // 1. Ensure sheet exists
      await ensureSheetExists('Families', [
        'Family ID', 'Family Name', 'Head of Family', 'Head of Family ID', 
        'Address', 'Phone', 'Members Count', 'Status', 'Notes'
      ]);
      
      // 2. Fetch data
      await Promise.all([
        fetchFamilies(),
        fetchMembersList()
      ]);
    } catch (error) {
      toast.error('Failed to load families or members registry');
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
      console.error(error);
    }
  };

  const fetchFamilies = async () => {
    try {
      const data = await getSpreadsheetData('Families!A2:I');
      if (data) {
        const formattedData = data.map((row, index) => ({
          sheetIndex: index + 2,
          id: row[0] || '',
          familyName: row[1] || '',
          headOfFamily: row[2] || '',
          headOfFamilyId: row[3] || '',
          address: row[4] || '',
          phone: row[5] || '',
          membersCount: Number(row[6]) || 1,
          status: row[7] || 'Active',
          notes: row[8] || '',
        }));
        setFamilies(formattedData);
      } else {
        setFamilies([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenModal = (family = null) => {
    if (family) {
      setFormData({
        ...family,
        membersCount: Number(family.membersCount)
      });
      setIsEdit(true);
    } else {
      setFormData({ 
        id: `FAM${String(families.length + 1).padStart(3, '0')}`, 
        familyName: '', 
        headOfFamily: '', 
        headOfFamilyId: '', 
        address: '', 
        phone: '', 
        membersCount: 1, 
        status: 'Active', 
        notes: '' 
      });
      setIsEdit(false);
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleSave = async () => {
    if (!formData.familyName.trim()) {
      toast.error("Family Name is required");
      return;
    }
    setLoading(true);
    try {
      const rowData = [
        formData.id,
        formData.familyName,
        formData.headOfFamily,
        formData.headOfFamilyId,
        formData.address,
        formData.phone,
        formData.membersCount,
        formData.status,
        formData.notes || ''
      ];

      if (isEdit) {
        await updateSpreadsheetRow(`Families!A${formData.sheetIndex}:I${formData.sheetIndex}`, rowData);
        toast.success("Family updated successfully");
      } else {
        await appendSpreadsheetRow('Families!A:I', rowData);
        toast.success("Family registered successfully");
      }
      handleCloseModal();
      await fetchFamilies();
    } catch (error) {
      toast.error("Error saving family record");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (family) => {
    if (window.confirm(`Delete family registry for ${family.familyName}?`)) {
      setLoading(true);
      try {
        await deleteSpreadsheetRow('Families', family.sheetIndex);
        toast.success("Family record deleted");
        await fetchFamilies();
      } catch (error) {
        toast.error("Error deleting family");
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter
  const filteredFamilies = families.filter(f => {
    const matchesSearch = f.familyName.toLowerCase().includes(search.toLowerCase()) || 
                          f.headOfFamily.toLowerCase().includes(search.toLowerCase()) ||
                          f.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Family Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Group parishioners into households and link heads of families
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />} 
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: '10px' }}
        >
          Register Family
        </Button>
      </Box>

      {/* Filter / Search */}
      <Paper sx={{ mb: 4, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField 
              fullWidth
              label="Search by Family Name, ID, or Head of House" 
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Moved">Moved / Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {loading && families.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* Card list of families */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {filteredFamilies.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((family) => (
              <Grid item xs={12} sm={6} md={4} key={family.id}>
                <Card sx={{ 
                  borderRadius: 4, 
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(30, 58, 138, 0.08)', color: 'primary.main' }}>
                          <HomeWorkIcon />
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                            {family.familyName} Family
                          </Typography>
                          <Typography variant="caption" color="text.secondary">ID: {family.id}</Typography>
                        </Box>
                      </Box>
                      <Chip label={family.status} color={family.status === 'Active' ? 'success' : 'default'} size="small" />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <PersonIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2">
                          Head: <b>{family.headOfFamily || 'Not set'}</b>
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        Address: {family.address || '-'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Members Count: <b>{family.membersCount}</b>
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: '1px solid #f1f5f9', pt: 2 }}>
                      <IconButton color="primary" onClick={() => handleOpenModal(family)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(family)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {filteredFamilies.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  No families registered. Click "Register Family" to add households.
                </Paper>
              </Grid>
            )}
          </Grid>

          <TablePagination
            component="div"
            count={filteredFamilies.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </>
      )}

      {/* Modal Dialog */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Family Details' : 'Register New Family'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="Family ID" value={formData.id} disabled fullWidth size="small" />
            <TextField label="Family Unit Name" required value={formData.familyName} onChange={e => setFormData({...formData, familyName: e.target.value})} placeholder="e.g. Johnson, Davis" fullWidth size="small" />
            
            {/* Link Head of Family */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Autocomplete
                options={membersList}
                getOptionLabel={(option) => option.label || option.name || formData.headOfFamily}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={membersList.find(m => m.id === formData.headOfFamilyId) || { name: formData.headOfFamily, id: formData.headOfFamilyId }}
                onChange={(event, newValue) => {
                  if (newValue) {
                    setFormData(prev => ({ ...prev, headOfFamily: newValue.name, headOfFamilyId: newValue.id }));
                  } else {
                    setFormData(prev => ({ ...prev, headOfFamily: '', headOfFamilyId: '' }));
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Select Head of Household" size="small" />}
                sx={{ flexGrow: 1 }}
              />
              <TextField 
                label="Members Count" 
                type="number" 
                value={formData.membersCount} 
                onChange={e => setFormData({...formData, membersCount: Number(e.target.value)})}
                size="small"
                sx={{ width: 120 }}
              />
            </Box>

            <TextField label="Phone Contact" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} fullWidth size="small" />
            <TextField label="Home Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} fullWidth size="small" multiline rows={2} />
            <TextField select label="Status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} fullWidth size="small">
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Moved">Moved / Inactive</MenuItem>
            </TextField>
            <TextField label="Notes" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} fullWidth size="small" multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {isEdit ? 'Save Changes' : 'Register House'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Families;
