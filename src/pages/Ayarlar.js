import React, { useState, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { Box, Typography, Paper, Button, Grid, Alert, Snackbar } from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import GetAppIcon from '@mui/icons-material/GetApp';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

const Ayarlar = () => {
  const { personeller, vardiyalar, molaPlanlar } = useContext(DataContext);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  
  const veriyiYedekle = async () => {
    try {
      const yedekVerisi = JSON.stringify({
        personeller,
        vardiyalar,
        molaPlanlar,
        tarih: new Date().toISOString()
      });
      
      const options = {
        defaultPath: `MolaPlanlama_Yedek_${new Date().toISOString().slice(0, 10)}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }],
        data: yedekVerisi
      };
      
      const result = await window.electronAPI.dosyaKaydet(options);
      
      if (result.success) {
        setBackupSuccess(true);
      } else if (!result.canceled) {
        alert('Yedekleme sırasında bir hata oluştu!');
      }
    } catch (error) {
      console.error('Yedekleme hatası:', error);
      alert('Yedekleme işlemi sırasında bir hata oluştu!');
    }
  };
  
  const verileriGeriYukle = () => {
    alert('Bu özellik henüz geliştirme aşamasındadır.');
  };
  
  const verileriSifirla = () => {
    if (window.confirm('Tüm verileri sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      localStorage.removeItem('personeller');
      localStorage.removeItem('vardiyalar');
      localStorage.removeItem('molaPlanlar');
      window.location.reload();
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Ayarlar</Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Paper 
              sx={{ 
                p: 3, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
              elevation={2}
            >
              <BackupIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Veri Yedekleme</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Tüm personel, vardiya ve mola planlarınızı yedekleyin
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={veriyiYedekle}
                startIcon={<BackupIcon />}
              >
                Verileri Yedekle
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper 
              sx={{ 
                p: 3, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
              elevation={2}
            >
              <GetAppIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Veri Geri Yükleme</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Daha önce yedeklediğiniz verileri geri yükleyin
              </Typography>
              <Button 
                variant="contained" 
                color="info"
                onClick={verileriGeriYukle}
                startIcon={<GetAppIcon />}
              >
                Verileri Geri Yükle
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper 
              sx={{ 
                p: 3, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center' 
              }}
              elevation={2}
            >
              <DeleteForeverIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Verileri Sıfırla</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Tüm verilerinizi sıfırlayın (bu işlem geri alınamaz)
              </Typography>
              <Button 
                variant="contained" 
                color="error"
                onClick={verileriSifirla}
                startIcon={<DeleteForeverIcon />}
              >
                Verileri Sıfırla
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Hakkında</Typography>
        <Typography variant="body1" paragraph>
          Mola Planlama Uygulaması v1.0 Made by Caleofin 
        </Typography>
        <Typography variant="body2">
          Bu uygulama personel mola planlamasını kolaylaştırmak için tasarlanmıştır.
          Personel ekleyebilir, vardiyalar oluşturabilir ve mola planları hazırlayabilirsiniz.
        </Typography>
      </Paper>
      
      <Snackbar 
        open={backupSuccess} 
        autoHideDuration={6000} 
        onClose={() => setBackupSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setBackupSuccess(false)} severity="success">
          Veriler başarıyla yedeklendi!
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={restoreSuccess} 
        autoHideDuration={6000} 
        onClose={() => setRestoreSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setRestoreSuccess(false)} severity="success">
          Veriler başarıyla geri yüklendi!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Ayarlar;