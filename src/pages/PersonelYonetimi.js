import React, { useState, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { Box, Typography, Button, TextField, Dialog, DialogActions, DialogContent, 
  DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const PersonelYonetimi = () => {
  const { personeller, personelEkle, personelGuncelle, personelSil } = useContext(DataContext);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPersonel, setCurrentPersonel] = useState({
    ad: '',
    soyad: '',
    departman: '',
    pozisyon: ''
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setIsEditing(false);
    setCurrentPersonel({
      ad: '',
      soyad: '',
      departman: '',
      pozisyon: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentPersonel({
      ...currentPersonel,
      [name]: value
    });
  };

  const handleSubmit = () => {
    if (isEditing) {
      personelGuncelle(currentPersonel.id, currentPersonel);
    } else {
      personelEkle(currentPersonel);
    }
    handleClose();
  };

  const handleEdit = (personel) => {
    setCurrentPersonel(personel);
    setIsEditing(true);
    setOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu personeli silmek istediğinizden emin misiniz?')) {
      personelSil(id);
    }
  };

  // Departman seçenekleri
  const departmanlar = ['Satış', 'Kasa', 'Depo', 'Yönetim'];
  
  // Pozisyon seçenekleri (departmana göre)
  const pozisyonlar = {
    'Satış': ['Satış Danışmanı', 'Reyon Görevlisi', 'Müşteri Temsilcisi'],
    'Kasa': ['Kasiyer', 'Kasa Sorumlusu'],
    'Depo': ['Depo Görevlisi', 'Lojistik Sorumlusu', 'Sevkiyat Görevlisi'],
    'Yönetim': ['Mağaza Müdürü', 'Asistan Müdür', 'Takım Lideri']
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Personel Yönetimi</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleClickOpen}
        >
          Personel Ekle
        </Button>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ad</TableCell>
              <TableCell>Soyad</TableCell>
              <TableCell>Departman</TableCell>
              <TableCell>Pozisyon</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {personeller.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Henüz personel eklenmemiş.
                </TableCell>
              </TableRow>
            ) : (
              personeller.map((personel) => (
                <TableRow key={personel.id}>
                  <TableCell>{personel.ad}</TableCell>
                  <TableCell>{personel.soyad}</TableCell>
                  <TableCell>{personel.departman}</TableCell>
                  <TableCell>{personel.pozisyon}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEdit(personel)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(personel.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEditing ? 'Personel Düzenle' : 'Personel Ekle'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="ad"
            label="Ad"
            type="text"
            fullWidth
            value={currentPersonel.ad}
            onChange={handleChange}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="soyad"
            label="Soyad"
            type="text"
            fullWidth
            value={currentPersonel.soyad}
            onChange={handleChange}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Departman</InputLabel>
            <Select
              name="departman"
              value={currentPersonel.departman}
              label="Departman"
              onChange={handleChange}
            >
              {departmanlar.map((dept) => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Pozisyon</InputLabel>
            <Select
              name="pozisyon"
              value={currentPersonel.pozisyon}
              label="Pozisyon"
              onChange={handleChange}
              disabled={!currentPersonel.departman}
            >
              {currentPersonel.departman && pozisyonlar[currentPersonel.departman].map((poz) => (
                <MenuItem key={poz} value={poz}>{poz}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {isEditing ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PersonelYonetimi;