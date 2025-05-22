import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { 
  Box, Typography, Button, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, Chip,
  FormControl, InputLabel, Select, MenuItem, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tabs, Tab, Checkbox, FormControlLabel, Stack,
  FormGroup, Alert, Badge, Tooltip, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import WorkIcon from '@mui/icons-material/Work';
import { format, parse, addDays, startOfWeek, getDay } from 'date-fns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import trLocale from 'date-fns/locale/tr';
import { v4 as uuidv4 } from 'uuid';

const VardiyaPlanlama = () => {
  // Context'ten veri ve fonksiyonları al
  const { personeller } = useContext(DataContext);
  
  // State tanımlamaları
  const [vardiyalar, setVardiyalar] = useState([]);
  const [personelVardiyalari, setPersonelVardiyalari] = useState([]);
  const [vardiyaDialogOpen, setVardiyaDialogOpen] = useState(false);
  const [personelVardiyaDialogOpen, setPersonelVardiyaDialogOpen] = useState(false);
  const [selectedVardiya, setSelectedVardiya] = useState(null);
  const [selectedPersonelVardiya, setSelectedPersonelVardiya] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Vardiya formu state'i
  const [vardiyaForm, setVardiyaForm] = useState({
    ad: '',
    baslangicSaati: '09:00',
    bitisSaati: '18:00',
    gunler: [],
    molaSayisi: 3
  });
  
  // Personel vardiya atama formu
  const [personelVardiyaForm, setPersonelVardiyaForm] = useState({
    personelId: '',
    haftalikPlan: [
      { gun: 1, vardiyaId: '', izinTuru: '' }, // Pazartesi
      { gun: 2, vardiyaId: '', izinTuru: '' }, // Salı
      { gun: 3, vardiyaId: '', izinTuru: '' }, // Çarşamba
      { gun: 4, vardiyaId: '', izinTuru: '' }, // Perşembe
      { gun: 5, vardiyaId: '', izinTuru: '' }, // Cuma
      { gun: 6, vardiyaId: '', izinTuru: '' }, // Cumartesi
      { gun: 0, vardiyaId: '', izinTuru: '' }  // Pazar
    ]
  });
  
  // Haftanın günleri
  const haftaGunleri = [
    { id: 1, ad: 'Pazartesi' },
    { id: 2, ad: 'Salı' },
    { id: 3, ad: 'Çarşamba' },
    { id: 4, ad: 'Perşembe' },
    { id: 5, ad: 'Cuma' },
    { id: 6, ad: 'Cumartesi' },
    { id: 0, ad: 'Pazar' }
  ];
  
  // İzin türleri
  const izinTurleri = [
    { id: 'haftalik', ad: 'Haftalık İzin', color: 'primary' },
    { id: 'ucretli', ad: 'Ücretli İzin', color: 'secondary' },
    { id: 'ucretsiz', ad: 'Ücretsiz İzin', color: 'error' },
    { id: 'rapor', ad: 'Raporlu', color: 'warning' }
  ];
  
  // LocalStorage'dan veri yükleme
  useEffect(() => {
    const veriyiYukle = () => {
      try {
        const lokalVardiyalar = localStorage.getItem('vardiyalar');
        if (lokalVardiyalar) {
          setVardiyalar(JSON.parse(lokalVardiyalar));
        }
        
        const lokalPersonelVardiyalari = localStorage.getItem('personelVardiyalari');
        if (lokalPersonelVardiyalari) {
          setPersonelVardiyalari(JSON.parse(lokalPersonelVardiyalari));
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    veriyiYukle();
  }, []);
  
  // Verileri LocalStorage'a kaydetme (ayrı useEffect'ler ile)
  useEffect(() => {
    if (!loading && vardiyalar.length > 0) {
      try {
        localStorage.setItem('vardiyalar', JSON.stringify(vardiyalar));
      } catch (error) {
        console.error('Vardiyaları kaydetme hatası:', error);
      }
    }
  }, [vardiyalar, loading]);
  
  useEffect(() => {
    if (!loading && personelVardiyalari.length > 0) {
      try {
        localStorage.setItem('personelVardiyalari', JSON.stringify(personelVardiyalari));
      } catch (error) {
        console.error('Personel vardiyalarını kaydetme hatası:', error);
      }
    }
  }, [personelVardiyalari, loading]);
  
  // Form değişiklik handler'ları
  const handleVardiyaChange = (e) => {
    const { name, value } = e.target;
    setVardiyaForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleGunlerChange = (event) => {
    setVardiyaForm(prev => ({
      ...prev,
      gunler: event.target.value
    }));
  };
  
  // Personel vardiya form güncellemeleri
  const handlePersonelChange = (event) => {
    const personelId = event.target.value;
    
    // Eğer zaten bu personel için atama varsa, onu yükle
    const mevcutAtama = personelVardiyalari.find(pv => pv.personelId === personelId);
    
    if (mevcutAtama) {
      setPersonelVardiyaForm({
        personelId,
        haftalikPlan: [...mevcutAtama.haftalikPlan]
      });
    } else {
      // Yeni boş plan oluştur
      setPersonelVardiyaForm({
        personelId,
        haftalikPlan: [
          { gun: 1, vardiyaId: '', izinTuru: '' },
          { gun: 2, vardiyaId: '', izinTuru: '' },
          { gun: 3, vardiyaId: '', izinTuru: '' },
          { gun: 4, vardiyaId: '', izinTuru: '' },
          { gun: 5, vardiyaId: '', izinTuru: '' },
          { gun: 6, vardiyaId: '', izinTuru: '' },
          { gun: 0, vardiyaId: '', izinTuru: '' }
        ]
      });
    }
  };
  
  // Belirli bir gün için vardiya veya izin değişikliği
  const handleGunPlanChange = (gunIndex, field, value) => {
    const yeniHaftalikPlan = [...personelVardiyaForm.haftalikPlan];
    
    if (field === 'vardiyaId') {
      // Vardiya seçildiğinde izin türünü temizle
      yeniHaftalikPlan[gunIndex] = {
        ...yeniHaftalikPlan[gunIndex],
        vardiyaId: value,
        izinTuru: ''
      };
    } else if (field === 'izinTuru') {
      // İzin seçildiğinde vardiya ID'yi temizle
      yeniHaftalikPlan[gunIndex] = {
        ...yeniHaftalikPlan[gunIndex],
        vardiyaId: '',
        izinTuru: value
      };
    }
    
    setPersonelVardiyaForm({
      ...personelVardiyaForm,
      haftalikPlan: yeniHaftalikPlan
    });
  };
  
  // Dialog açma/kapama handler'ları
  const handleVardiyaDialogOpen = (vardiya = null) => {
    if (vardiya) {
      setSelectedVardiya(vardiya);
      setVardiyaForm({
        ad: vardiya.ad,
        baslangicSaati: vardiya.baslangicSaati,
        bitisSaati: vardiya.bitisSaati,
        gunler: vardiya.gunler,
        molaSayisi: vardiya.molaSayisi || 3
      });
    } else {
      setSelectedVardiya(null);
      setVardiyaForm({
        ad: '',
        baslangicSaati: '09:00',
        bitisSaati: '18:00',
        gunler: [],
        molaSayisi: 3
      });
    }
    setVardiyaDialogOpen(true);
  };
  
  const handlePersonelVardiyaDialogOpen = (personelId = null) => {
    if (personelId) {
      // Mevcut personel planını yükle
      const mevcutAtama = personelVardiyalari.find(pv => pv.personelId === personelId);
      
      if (mevcutAtama) {
        setPersonelVardiyaForm({
          personelId,
          haftalikPlan: [...mevcutAtama.haftalikPlan]
        });
      } else {
        // Yeni boş plan oluştur
        setPersonelVardiyaForm({
          personelId,
          haftalikPlan: [
            { gun: 1, vardiyaId: '', izinTuru: '' },
            { gun: 2, vardiyaId: '', izinTuru: '' },
            { gun: 3, vardiyaId: '', izinTuru: '' },
            { gun: 4, vardiyaId: '', izinTuru: '' },
            { gun: 5, vardiyaId: '', izinTuru: '' },
            { gun: 6, vardiyaId: '', izinTuru: '' },
            { gun: 0, vardiyaId: '', izinTuru: '' }
          ]
        });
      }
    } else {
      // Boş form göster
      setPersonelVardiyaForm({
        personelId: '',
        haftalikPlan: [
          { gun: 1, vardiyaId: '', izinTuru: '' },
          { gun: 2, vardiyaId: '', izinTuru: '' },
          { gun: 3, vardiyaId: '', izinTuru: '' },
          { gun: 4, vardiyaId: '', izinTuru: '' },
          { gun: 5, vardiyaId: '', izinTuru: '' },
          { gun: 6, vardiyaId: '', izinTuru: '' },
          { gun: 0, vardiyaId: '', izinTuru: '' }
        ]
      });
    }
    
    setPersonelVardiyaDialogOpen(true);
  };
  
  // Veri kaydetme handler'ları
  const handleVardiyaKaydet = () => {
    if (!vardiyaForm.ad) {
      alert('Lütfen vardiya adı giriniz.');
      return;
    }
    
    if (vardiyaForm.gunler.length === 0) {
      alert('Lütfen en az bir çalışma günü seçin.');
      return;
    }
    
    if (selectedVardiya) {
      // Mevcut vardiyayı güncelle
      const guncelVardiyalar = vardiyalar.map(v => 
        v.id === selectedVardiya.id ? {...vardiyaForm, id: selectedVardiya.id} : v
      );
      setVardiyalar(guncelVardiyalar);
    } else {
      // Yeni vardiya ekle
      const yeniVardiya = {
        ...vardiyaForm,
        id: uuidv4()
      };
      setVardiyalar([...vardiyalar, yeniVardiya]);
    }
    
    setVardiyaDialogOpen(false);
  };
  
  const handlePersonelVardiyaKaydet = () => {
    if (!personelVardiyaForm.personelId) {
      alert('Lütfen personel seçiniz.');
      return;
    }
    
    // Personelin haftalık çalışma planını kontrol et (en az 1 vardiya veya izin olmalı)
    const vardiyaGunleri = personelVardiyaForm.haftalikPlan.filter(
      gun => gun.vardiyaId || gun.izinTuru
    );
    
    if (vardiyaGunleri.length === 0) {
      alert('Lütfen en az bir gün için vardiya veya izin seçiniz.');
      return;
    }
    
    // Mevcut atamayı bul
    const mevcutAramaIndex = personelVardiyalari.findIndex(
      pv => pv.personelId === personelVardiyaForm.personelId
    );
    
    if (mevcutAramaIndex !== -1) {
      // Mevcut atamayı güncelle
      const guncelAtamalar = [...personelVardiyalari];
      guncelAtamalar[mevcutAramaIndex] = {
        ...personelVardiyaForm,
        id: guncelAtamalar[mevcutAramaIndex].id
      };
      setPersonelVardiyalari(guncelAtamalar);
    } else {
      // Yeni atama ekle
      const yeniAtama = {
        ...personelVardiyaForm,
        id: uuidv4()
      };
      setPersonelVardiyalari([...personelVardiyalari, yeniAtama]);
    }
    
    setPersonelVardiyaDialogOpen(false);
  };
  
  // Silme handler'ları
  const handleVardiyaSil = (vardiyaId) => {
    if (window.confirm('Bu vardiyayı silmek istediğinizden emin misiniz?')) {
      setVardiyalar(vardiyalar.filter(v => v.id !== vardiyaId));
      
      // Ayrıca bu vardiyayla ilgili tüm atamaları güncelle
      const guncelAtamalar = personelVardiyalari.map(pv => {
        const guncelHaftalikPlan = pv.haftalikPlan.map(gun => {
          if (gun.vardiyaId === vardiyaId) {
            return { ...gun, vardiyaId: '' };
          }
          return gun;
        });
        
        return { ...pv, haftalikPlan: guncelHaftalikPlan };
      });
      
      setPersonelVardiyalari(guncelAtamalar);
    }
  };
  
  const handlePersonelVardiyaSil = (personelId) => {
    if (window.confirm('Bu personelin tüm vardiya planlarını silmek istediğinizden emin misiniz?')) {
      setPersonelVardiyalari(personelVardiyalari.filter(pv => pv.personelId !== personelId));
    }
  };
  
  // Tab değiştirme
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Haftanın başlangıç günü
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  
  // Personel bilgilerini getiren yardımcı fonksiyon
  const getPersonelBilgisi = (personelId) => {
    const personel = personeller.find(p => p.id === personelId);
    return personel ? `${personel.ad} ${personel.soyad}` : 'Bilinmeyen Personel';
  };
  
  // Vardiya bilgilerini getiren yardımcı fonksiyon
  const getVardiyaBilgisi = (vardiyaId) => {
    const vardiya = vardiyalar.find(v => v.id === vardiyaId);
    return vardiya ? `${vardiya.ad} (${vardiya.baslangicSaati} - ${vardiya.bitisSaati})` : '';
  };
  
  // İzin bilgilerini getiren yardımcı fonksiyon
  const getIzinBilgisi = (izinTuru) => {
    const izin = izinTurleri.find(i => i.id === izinTuru);
    return izin ? izin.ad : '';
  };
  
  // İzin rengini getiren yardımcı fonksiyon
  const getIzinRengi = (izinTuru) => {
    const izin = izinTurleri.find(i => i.id === izinTuru);
    return izin ? izin.color : 'default';
  };
  
  // Günün tarihi
  const getGunTarihi = (gunIndex) => {
    return format(addDays(weekStart, gunIndex), 'dd.MM.yyyy');
  };
  
  // Personellerin vardiya atamalarını kontrol et
  const personellerinVardiyaDurumu = personeller.map(personel => {
    const atama = personelVardiyalari.find(pv => pv.personelId === personel.id);
    return {
      ...personel,
      atamasi: atama ? true : false
    };
  });
  
  // Belirli bir gün için çalışma durumunu getir
  const getGunDurumu = (personelId, gunId) => {
    const personelAtama = personelVardiyalari.find(pv => pv.personelId === personelId);
    
    if (!personelAtama) return null;
    
    const gunDurumu = personelAtama.haftalikPlan.find(gun => gun.gun === gunId);
    
    if (!gunDurumu) return null;
    
    if (gunDurumu.vardiyaId) {
      return { tip: 'vardiya', deger: gunDurumu.vardiyaId };
    } else if (gunDurumu.izinTuru) {
      return { tip: 'izin', deger: gunDurumu.izinTuru };
    }
    
    return null;
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Vardiya Planlama</Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleVardiyaDialogOpen()}
            sx={{ mr: 1 }}
          >
            Vardiya Ekle
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<EventAvailableIcon />}
            onClick={() => handlePersonelVardiyaDialogOpen()}
            disabled={vardiyalar.length === 0 || personeller.length === 0}
          >
            Personel Vardiya Ata
          </Button>
        </Box>
      </Paper>

      {/* Tablar */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Vardiyalar" />
          <Tab label="Personel Vardiya Atamaları" />
          <Tab label="Haftalık Plan" />
        </Tabs>
      </Box>

      {/* Vardiyalar Tabı */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vardiya Adı</TableCell>
                <TableCell>Çalışma Saatleri</TableCell>
                <TableCell>Günler</TableCell>
                <TableCell>Mola Sayısı</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vardiyalar.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Henüz vardiya eklenmemiş.
                  </TableCell>
                </TableRow>
              ) : (
                vardiyalar.map((vardiya) => (
                  <TableRow key={vardiya.id}>
                    <TableCell>{vardiya.ad}</TableCell>
                    <TableCell>{`${vardiya.baslangicSaati} - ${vardiya.bitisSaati}`}</TableCell>
                    <TableCell>
                      {vardiya.gunler.map(gunId => (
                        <Chip 
                          key={gunId} 
                          label={haftaGunleri.find(g => g.id === gunId)?.ad} 
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>{vardiya.molaSayisi || 3}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleVardiyaDialogOpen(vardiya)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleVardiyaSil(vardiya.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Personel Vardiya Atamaları Tabı */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Personel</TableCell>
                <TableCell>Departman</TableCell>
                <TableCell>Vardiya Planı</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {personeller.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Henüz personel eklenmemiş.
                  </TableCell>
                </TableRow>
              ) : personellerinVardiyaDurumu.filter(p => p.atamasi).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Henüz personel-vardiya ataması yapılmamış.
                  </TableCell>
                </TableRow>
              ) : (
                personellerinVardiyaDurumu
                  .filter(p => p.atamasi)
                  .map((personel) => {
                    const personelAtama = personelVardiyalari.find(
                      pv => pv.personelId === personel.id
                    );
                    
                    return (
                      <TableRow key={personel.id}>
                        <TableCell>{`${personel.ad} ${personel.soyad}`}</TableCell>
                        <TableCell>{personel.departman}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {haftaGunleri.map((gun) => {
                              const gunDurumu = personelAtama?.haftalikPlan.find(
                                g => g.gun === gun.id
                              );
                              
                              if (!gunDurumu || (!gunDurumu.vardiyaId && !gunDurumu.izinTuru)) {
                                return null;
                              }
                              
                              if (gunDurumu.vardiyaId) {
                                const vardiya = vardiyalar.find(v => v.id === gunDurumu.vardiyaId);
                                if (!vardiya) return null;
                                
                                return (
                                  <Tooltip 
                                    key={`vardiya-${gun.id}`} 
                                    title={`${gun.ad}: ${vardiya.ad} (${vardiya.baslangicSaati}-${vardiya.bitisSaati})`}
                                  >
                                    <Chip 
                                      label={`${gun.ad.substring(0, 3)}: ${vardiya.ad}`}
                                      size="small" 
                                      color="primary"
                                      variant="outlined"
                                    />
                                  </Tooltip>
                                );
                              } else if (gunDurumu.izinTuru) {
                                const izin = izinTurleri.find(i => i.id === gunDurumu.izinTuru);
                                if (!izin) return null;
                                
                                return (
                                  <Tooltip 
                                    key={`izin-${gun.id}`} 
                                    title={`${gun.ad}: ${izin.ad}`}
                                  >
                                    <Chip 
                                      label={`${gun.ad.substring(0, 3)}: ${izin.ad}`}
                                      size="small" 
                                      color={izin.color}
                                    />
                                  </Tooltip>
                                );
                              }
                              
                              return null;
                            })}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => handlePersonelVardiyaDialogOpen(personel.id)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handlePersonelVardiyaSil(personel.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
          
          {/* Henüz atama yapılmamış personellerin listesi */}
          {personellerinVardiyaDurumu.filter(p => !p.atamasi).length > 0 && (
            <Box sx={{ mt: 4, p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Vardiya Ataması Olmayan Personeller
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {personellerinVardiyaDurumu
                  .filter(p => !p.atamasi)
                  .map((personel) => (
                    <Chip 
                      key={personel.id}
                      label={`${personel.ad} ${personel.soyad} (${personel.departman})`}
                      onClick={() => handlePersonelVardiyaDialogOpen(personel.id)}
                      color="warning"
                      icon={<WorkIcon />}
                    />
                  ))
                }
              </Box>
            </Box>
          )}
        </TableContainer>
      )}

      {/* Haftalık Plan Tabı */}
      {tabValue === 2 && (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
              <DatePicker
                label="Hafta Seçin"
                value={currentWeek}
                onChange={(newValue) => setCurrentWeek(newValue || new Date())}
                renderInput={(params) => <TextField {...params} sx={{ width: 200 }} />}
              />
            </LocalizationProvider>
            <Typography sx={{ ml: 2 }}>
              {format(weekStart, "dd MMMM", { locale: trLocale })} - {format(addDays(weekStart, 6), "dd MMMM yyyy", { locale: trLocale })}
            </Typography>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Personel</TableCell>
                  {/* Pazartesi'den Pazar'a sıralı olarak göster */}
                  {[...Array(7)].map((_, i) => (
                    <TableCell key={i} align="center">
                      {haftaGunleri[i].ad}<br/>
                      {format(addDays(weekStart, i), 'dd.MM')}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {personeller.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Henüz personel eklenmemiş.
                    </TableCell>
                  </TableRow>
                ) : (
                  personeller.map((personel) => {
                    // Bu personelin vardiya atama bilgisi
                    const personelAtama = personelVardiyalari.find(pv => pv.personelId === personel.id);
                    
                    return (
                      <TableRow key={personel.id}>
                        <TableCell sx={{ 
                          bgcolor: personelAtama ? '#f5f5f5' : '#fff4e5',
                          fontWeight: personelAtama ? 'normal' : 'bold'
                        }}>
                          {`${personel.ad} ${personel.soyad}`}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {personel.departman}
                          </Typography>
                        </TableCell>
                        
                        {/* Her gün için vardiya veya izin durumu */}
                        {[...Array(7)].map((_, i) => {
                          const gunId = (i + 1) % 7; // 1 (Pazartesi) - 0 (Pazar)
                          const gunDurumu = personelAtama?.haftalikPlan.find(g => g.gun === gunId);
                          
                          return (
                            <TableCell key={i} align="center" sx={{ minWidth: 140 }}>
                              {!personelAtama ? (
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="warning"
                                  onClick={() => handlePersonelVardiyaDialogOpen(personel.id)}
                                >
                                  Atama Yap
                                </Button>
                              ) : gunDurumu?.vardiyaId ? (
                                <Tooltip title={`Düzenlemek için tıklayın`}>
                                  <Chip
                                    label={getVardiyaBilgisi(gunDurumu.vardiyaId).split(' ')[0]}
                                    color="primary"
                                    onClick={() => handlePersonelVardiyaDialogOpen(personel.id)}
                                    sx={{ width: '100%' }}
                                  />
                                </Tooltip>
                              ) : gunDurumu?.izinTuru ? (
                                <Tooltip title={`${getIzinBilgisi(gunDurumu.izinTuru)}`}>
                                  <Chip 
                                    label={getIzinBilgisi(gunDurumu.izinTuru)}
                                    color={getIzinRengi(gunDurumu.izinTuru)}
                                    onClick={() => handlePersonelVardiyaDialogOpen(personel.id)}
                                    sx={{ width: '100%' }}
                                  />
                                </Tooltip>
                              ) : (
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color="primary"
                                  onClick={() => handlePersonelVardiyaDialogOpen(personel.id)}
                                >
                                  Atama Yap
                                </Button>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Vardiya Ekleme/Düzenleme Dialog */}
      <Dialog open={vardiyaDialogOpen} onClose={() => setVardiyaDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedVardiya ? 'Vardiya Düzenle' : 'Vardiya Ekle'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="ad"
                label="Vardiya Adı"
                fullWidth
                value={vardiyaForm.ad}
                onChange={handleVardiyaChange}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                name="baslangicSaati"
                label="Başlangıç Saati"
                type="time"
                fullWidth
                value={vardiyaForm.baslangicSaati}
                onChange={handleVardiyaChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                name="bitisSaati"
                label="Bitiş Saati"
                type="time"
                fullWidth
                value={vardiyaForm.bitisSaati}
                onChange={handleVardiyaChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Çalışma Günleri</InputLabel>
                <Select
                  multiple
                  name="gunler"
                  value={vardiyaForm.gunler}
                  label="Çalışma Günleri"
                  onChange={handleGunlerChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((gunId) => (
                        <Chip 
                          key={gunId} 
                          label={haftaGunleri.find(g => g.id === gunId)?.ad} 
                          size="small" 
                        />
                      ))}
                    </Box>
                  )}
                >
                  {haftaGunleri.map((gun) => (
                    <MenuItem key={gun.id} value={gun.id}>
                      {gun.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="molaSayisi"
                label="Mola Sayısı"
                type="number"
                fullWidth
                value={vardiyaForm.molaSayisi}
                onChange={handleVardiyaChange}
                InputProps={{ inputProps: { min: 1, max: 5 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVardiyaDialogOpen(false)}>İptal</Button>
          <Button onClick={handleVardiyaKaydet} variant="contained" color="primary">
            {selectedVardiya ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Personel Vardiya Atama Dialog */}
      <Dialog open={personelVardiyaDialogOpen} onClose={() => setPersonelVardiyaDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Personel Haftalık Çalışma Planı</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Personel</InputLabel>
                <Select
                  name="personelId"
                  value={personelVardiyaForm.personelId}
                  label="Personel"
                  onChange={handlePersonelChange}
                >
                  {personeller.map((personel) => (
                    <MenuItem key={personel.id} value={personel.id}>
                      {`${personel.ad} ${personel.soyad} (${personel.departman})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Her gün için vardiya ve izin seçimi */}
            {personelVardiyaForm.personelId && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Haftalık Çalışma Planı
                </Typography>
                
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1, 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2 
                }}>
                  {haftaGunleri.map((gun, index) => (
                    <Grid container key={gun.id} spacing={2} alignItems="center">
                      <Grid item xs={12} md={2}>
                        <Typography variant="subtitle2">
                          {gun.ad}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={5}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Vardiya</InputLabel>
                          <Select
                            value={personelVardiyaForm.haftalikPlan[index].vardiyaId}
                            label="Vardiya"
                            onChange={(e) => handleGunPlanChange(index, 'vardiyaId', e.target.value)}
                            disabled={!!personelVardiyaForm.haftalikPlan[index].izinTuru}
                          >
                            <MenuItem value="">
                              <em>Seçiniz</em>
                            </MenuItem>
                            {vardiyalar
                              .filter(v => v.gunler.includes(gun.id))
                              .map((vardiya) => (
                                <MenuItem key={vardiya.id} value={vardiya.id}>
                                  {vardiya.ad} ({vardiya.baslangicSaati} - {vardiya.bitisSaati})
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} md={5}>
                        <FormControl fullWidth size="small">
                          <InputLabel>İzin Durumu</InputLabel>
                          <Select
                            value={personelVardiyaForm.haftalikPlan[index].izinTuru}
                            label="İzin Durumu"
                            onChange={(e) => handleGunPlanChange(index, 'izinTuru', e.target.value)}
                            disabled={!!personelVardiyaForm.haftalikPlan[index].vardiyaId}
                          >
                            <MenuItem value="">
                              <em>Seçiniz</em>
                            </MenuItem>
                            {izinTurleri.map((izin) => (
                              <MenuItem key={izin.id} value={izin.id}>
                                {izin.ad}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPersonelVardiyaDialogOpen(false)}>İptal</Button>
          <Button 
            onClick={handlePersonelVardiyaKaydet} 
            variant="contained" 
            color="primary"
            disabled={!personelVardiyaForm.personelId}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VardiyaPlanlama;