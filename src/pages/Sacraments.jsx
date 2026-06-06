import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, TextField, 
  MenuItem, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, Chip, CircularProgress, Grid, InputAdornment, Tabs, Tab, Autocomplete
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HeartBrokenIcon from '@mui/icons-material/HeartBroken';
import toast from 'react-hot-toast';
import { 
  getSpreadsheetData, 
  appendSpreadsheetRow, 
  updateSpreadsheetRow, 
  deleteSpreadsheetRow,
  ensureSheetExists
} from '../services/googleSheetsService';

const Sacraments = () => {
  const [sacraments, setSacraments] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs State (0: Baptism, 1: First Communion, 2: Confirmation, 3: Marriage, 4: Death)
  const [tabValue, setTabValue] = useState(0);
  
  // Filtering & Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    id: '', memberId: '', memberName: '', sacramentType: 'Baptism',
    dateAdministered: new Date().toISOString().split('T')[0],
    celebrantPriest: '', sponsors: '', notes: ''
  });
  const [isEdit, setIsEdit] = useState(false);

  const sacramentTypes = ['Baptism', 'First Communion', 'Confirmation', 'Marriage', 'Death'];

  useEffect(() => {
    initializeAndFetchData();
  }, []);

  const initializeAndFetchData = async () => {
    setLoading(true);
    try {
      await ensureSheetExists('Sacraments', [
        'Record ID', 'Member ID', 'Member Name', 'Sacrament Type', 
        'Date Administered', 'Celebrant Priest', 'Sponsors / Witnesses', 'Notes'
      ]);
      await Promise.all([
        fetchSacraments(),
        fetchMembersList()
      ]);
    } catch (error) {
      toast.error('Failed to load sacrament records');
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

  const fetchSacraments = async () => {
    try {
      const data = await getSpreadsheetData('Sacraments!A2:H');
      if (data) {
        const formattedData = data.map((row, index) => ({
          sheetIndex: index + 2,
          id: row[0] || '',
          memberId: row[1] || '',
          memberName: row[2] || '',
          sacramentType: row[3] || 'Baptism',
          dateAdministered: row[4] || '',
          celebrantPriest: row[5] || '',
          sponsors: row[6] || '',
          notes: row[7] || '',
        }));
        setSacraments(formattedData);
      } else {
        setSacraments([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleOpenModal = (sacrament = null) => {
    if (sacrament) {
      setFormData(sacrament);
      setIsEdit(true);
    } else {
      setFormData({
        id: `SAC${String(sacraments.length + 1).padStart(3, '0')}`,
        memberId: '',
        memberName: '',
        sacramentType: sacramentTypes[tabValue],
        dateAdministered: new Date().toISOString().split('T')[0],
        celebrantPriest: '',
        sponsors: '',
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
    if (!formData.memberName.trim()) {
      toast.error("Parishioner name is required");
      return;
    }
    setLoading(true);
    try {
      const rowData = [
        formData.id,
        formData.memberId,
        formData.memberName,
        formData.sacramentType,
        formData.dateAdministered,
        formData.celebrantPriest,
        formData.sponsors,
        formData.notes || ''
      ];

      if (isEdit) {
        await updateSpreadsheetRow(`Sacraments!A${formData.sheetIndex}:H${formData.sheetIndex}`, rowData);
        toast.success("Sacrament record updated");
      } else {
        await appendSpreadsheetRow('Sacraments!A:H', rowData);
        toast.success("Sacrament recorded successfully");
      }
      handleCloseModal();
      await fetchSacraments();
    } catch (error) {
      toast.error("Error saving sacrament details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sac) => {
    if (window.confirm(`Delete sacrament record ${sac.id} for ${sac.memberName}?`)) {
      setLoading(true);
      try {
        await deleteSpreadsheetRow('Sacraments', sac.sheetIndex);
        toast.success("Record deleted");
        await fetchSacraments();
      } catch (error) {
        toast.error("Error deleting record");
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter based on tab and search query
  const currentSacramentType = sacramentTypes[tabValue];
  const filteredSacraments = sacraments.filter(s => {
    const matchesTab = s.sacramentType === currentSacramentType;
    const matchesSearch = s.memberName.toLowerCase().includes(search.toLowerCase()) ||
                          s.memberId.toLowerCase().includes(search.toLowerCase()) ||
                          s.celebrantPriest.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getTabIcon = (type) => {
    switch (type) {
      case 'Baptism': return <WaterDropIcon fontSize="small" />;
      case 'First Communion': return <CardMembershipIcon fontSize="small" />;
      case 'Confirmation': return <WorkspacePremiumIcon fontSize="small" />;
      case 'Marriage': return <FavoriteIcon fontSize="small" />;
      case 'Death': return <HeartBrokenIcon fontSize="small" />;
      default: return null;
    }
  };

  const getThemeColor = (type) => {
    switch (type) {
      case 'Baptism': return '#0EA5E9';
      case 'First Communion': return '#D4AF37';
      case 'Confirmation': return '#10B981';
      case 'Marriage': return '#EF4444';
      case 'Death': return '#64748B';
      default: return '#1E3A8A';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Sacrament Records</Typography>
          <Typography variant="body2" color="text.secondary">
            Log and search holy sacraments administered to parishioners
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />} 
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: '10px' }}
        >
          Record Sacrament
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} textColor="primary" indicatorColor="primary" variant="scrollable" scrollButtons="auto">
          {sacramentTypes.map((type, i) => (
            <Tab key={type} label={type} icon={getTabIcon(type)} iconPosition="start" id={`sac-tab-${i}`} />
          ))}
        </Tabs>
      </Box>

      {/* Filter / Search Bar */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField 
          fullWidth
          label={`Search ${currentSacramentType} Records`}
          placeholder="Search member name, ID, celebrant priest..."
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
      </Paper>

      {loading && sacraments.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
      ) : (
        <Paper>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Record ID</TableCell>
                  <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Parishioner Info</TableCell>
                  <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Date Administered</TableCell>
                  <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Celebrant Priest</TableCell>
                  <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Sponsors / Witnesses</TableCell>
                  <TableCell sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Notes</TableCell>
                  <TableCell align="right" sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSacraments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{row.memberName}</Typography>
                      {row.memberId && (
                        <Typography variant="caption" color="text.secondary">ID: {row.memberId}</Typography>
                      )}
                    </TableCell>
                    <TableCell>{row.dateAdministered}</TableCell>
                    <TableCell>{row.celebrantPriest || '-'}</TableCell>
                    <TableCell>{row.sponsors || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.notes || '-'}
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
                {filteredSacraments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      No {currentSacramentType} records registered.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredSacraments.length}
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

      {/* Modal Dialog */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Sacrament Record' : 'Record Holy Sacrament'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            
            {/* Sacrament Type Selector (Only on New) */}
            <TextField 
              select 
              label="Sacrament Type" 
              value={formData.sacramentType}
              onChange={e => setFormData({...formData, sacramentType: e.target.value})}
              fullWidth 
              size="small"
              disabled={isEdit}
            >
              {sacramentTypes.map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>

            <TextField label="Record ID" value={formData.id} disabled fullWidth size="small" />
            
            {/* Member Autocomplete */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Autocomplete
                options={membersList}
                getOptionLabel={(option) => option.label || option.name || formData.memberName}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={membersList.find(m => m.id === formData.memberId) || { name: formData.memberName, id: formData.memberId }}
                onChange={(event, newValue) => {
                  if (newValue) {
                    setFormData(prev => ({ ...prev, memberName: newValue.name, memberId: newValue.id }));
                  } else {
                    setFormData(prev => ({ ...prev, memberName: '', memberId: '' }));
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Link Member Registry" size="small" />}
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
              <TextField 
                label="Full Name" 
                required 
                value={formData.memberName} 
                onChange={e => setFormData({...formData, memberName: e.target.value})}
                size="small"
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                label="Date Administered" 
                type="date" 
                required 
                value={formData.dateAdministered} 
                onChange={e => setFormData({...formData, dateAdministered: e.target.value})} 
                fullWidth 
                size="small" 
                InputLabelProps={{ shrink: true }}
              />
              <TextField 
                label="Celebrant Priest" 
                required 
                value={formData.celebrantPriest} 
                onChange={e => setFormData({...formData, celebrantPriest: e.target.value})} 
                fullWidth 
                size="small" 
              />
            </Box>

            <TextField 
              label="Sponsors / Witnesses" 
              value={formData.sponsors} 
              onChange={e => setFormData({...formData, sponsors: e.target.value})} 
              placeholder="e.g. Godparents names, witnesses names..."
              fullWidth 
              size="small" 
            />
            
            <TextField 
              label="Notes" 
              value={formData.notes || ''} 
              onChange={e => setFormData({...formData, notes: e.target.value})} 
              fullWidth 
              size="small" 
              multiline 
              rows={2} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {isEdit ? 'Save Changes' : 'Record Sacrament'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sacraments;
