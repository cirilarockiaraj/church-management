import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, TextField, 
  MenuItem, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, Chip, CircularProgress, Grid, InputAdornment, Card, CardContent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import toast from 'react-hot-toast';
import { 
  getSpreadsheetData, 
  appendSpreadsheetRow, 
  updateSpreadsheetRow, 
  deleteSpreadsheetRow,
  ensureSheetExists
} from '../services/googleSheetsService';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    id: '', title: '', date: new Date().toISOString().split('T')[0],
    time: '09:00', category: 'Holy Mass', location: 'Church Sanctuary',
    coordinator: '', description: ''
  });
  const [isEdit, setIsEdit] = useState(false);

  const categories = ['Holy Mass', 'Feast / Festival', 'Parish Council', 'Community Service', 'Catechism / Youth', 'Choir Practice'];

  useEffect(() => {
    initializeAndFetchData();
  }, []);

  const initializeAndFetchData = async () => {
    setLoading(true);
    try {
      await ensureSheetExists('Events', [
        'Event ID', 'Event Title', 'Date', 'Time', 
        'Category', 'Location', 'Coordinator', 'Description'
      ]);
      await fetchEvents();
    } catch (error) {
      toast.error('Failed to load events data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const data = await getSpreadsheetData('Events!A2:H');
      if (data) {
        const formattedData = data.map((row, index) => ({
          sheetIndex: index + 2,
          id: row[0] || '',
          title: row[1] || '',
          date: row[2] || '',
          time: row[3] || '',
          category: row[4] || 'Holy Mass',
          location: row[5] || '',
          coordinator: row[6] || '',
          description: row[7] || '',
        }));
        // Sort events chronologically (soonest first)
        formattedData.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(formattedData);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setFormData(event);
      setIsEdit(true);
    } else {
      setFormData({
        id: `EVT${String(events.length + 1).padStart(3, '0')}`,
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        category: 'Holy Mass',
        location: 'Church Sanctuary',
        coordinator: '',
        description: ''
      });
      setIsEdit(false);
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Event title is required");
      return;
    }
    setLoading(true);
    try {
      const rowData = [
        formData.id,
        formData.title,
        formData.date,
        formData.time,
        formData.category,
        formData.location,
        formData.coordinator,
        formData.description || ''
      ];

      if (isEdit) {
        await updateSpreadsheetRow(`Events!A${formData.sheetIndex}:H${formData.sheetIndex}`, rowData);
        toast.success("Event updated successfully");
      } else {
        await appendSpreadsheetRow('Events!A:H', rowData);
        toast.success("Event scheduled successfully");
      }
      handleCloseModal();
      await fetchEvents();
    } catch (error) {
      toast.error("Error scheduling event");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (evt) => {
    if (window.confirm(`Cancel event: ${evt.title}?`)) {
      setLoading(true);
      try {
        await deleteSpreadsheetRow('Events', evt.sheetIndex);
        toast.success("Event cancelled and removed");
        await fetchEvents();
      } catch (error) {
        toast.error("Error deleting event");
      } finally {
        setLoading(false);
      }
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Holy Mass': return '#1E3A8A';
      case 'Feast / Festival': return '#D4AF37';
      case 'Parish Council': return '#F59E0B';
      case 'Community Service': return '#10B981';
      case 'Choir Practice': return '#8B5CF6';
      default: return '#64748B';
    }
  };

  // Filter
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                          e.coordinator.toLowerCase().includes(search.toLowerCase()) ||
                          e.location.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Events Calendar & Liturgy Planner</Typography>
          <Typography variant="body2" color="text.secondary">
            Schedule holy masses, feast days, parish meetings, and community activities
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />} 
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: '10px' }}
        >
          Schedule Event
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ mb: 4, p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField 
              fullWidth
              label="Search Events" 
              placeholder="Search title, location, coordinator..."
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
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            >
              <MenuItem value="All">All Categories</MenuItem>
              {categories.map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {loading && events.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {filteredEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((evt) => (
              <Grid item xs={12} sm={6} md={4} key={evt.id}>
                <Card sx={{ 
                  borderRadius: 4, 
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Chip 
                        label={evt.category} 
                        size="small" 
                        sx={{ 
                          bgcolor: `${getCategoryColor(evt.category)}12`, 
                          color: getCategoryColor(evt.category),
                          fontWeight: 'bold'
                        }} 
                      />
                      <Typography variant="caption" color="text.secondary">ID: {evt.id}</Typography>
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, minHeight: 48 }}>
                      {evt.title}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2.5, color: 'text.secondary' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="body2">{evt.date}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="body2">{evt.time}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlaceIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="body2">{evt.location}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="body2">Coordinator: {evt.coordinator || '-'}</Typography>
                      </Box>
                    </Box>

                    {evt.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {evt.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: '1px solid #f1f5f9', pt: 2 }}>
                      <IconButton color="primary" onClick={() => handleOpenModal(evt)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(evt)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {filteredEvents.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  No upcoming events scheduled. Click "Schedule Event" to add liturgical or parish tasks.
                </Paper>
              </Grid>
            )}
          </Grid>

          <TablePagination
            component="div"
            count={filteredEvents.length}
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
        <DialogTitle>{isEdit ? 'Edit Event Details' : 'Schedule Liturgy or Parish Event'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="Event ID" value={formData.id} disabled fullWidth size="small" />
            <TextField label="Event Title / Feast Name" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Easter Sunday Mass, Parish Council Meeting" fullWidth size="small" />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Date" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} fullWidth size="small" InputLabelProps={{ shrink: true }} />
              <TextField label="Time" type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField select label="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} fullWidth size="small">
                {categories.map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
              <TextField label="Location / Venue" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Main Church Hall, Parish office" fullWidth size="small" />
            </Box>

            <TextField label="Event Coordinator" value={formData.coordinator} onChange={e => setFormData({...formData, coordinator: e.target.value})} placeholder="e.g. Rev. Fr. Joseph, Choir Lead Mary" fullWidth size="small" />
            <TextField label="Event Description" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} fullWidth size="small" multiline rows={3} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {isEdit ? 'Save Changes' : 'Schedule Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Events;
