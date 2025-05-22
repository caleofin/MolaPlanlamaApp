import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { 
  Box, Typography, Button, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, Chip,
  FormControl, InputLabel, Select, MenuItem, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tabs, Tab, Alert, Divider, FormControlLabel,
  Switch, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse, addMinutes, isWithinInterval, subDays, addDays, isSameDay } from 'date-fns';
import trLocale from 'date-fns/locale/tr';
import { v4 as uuidv4 } from 'uuid';

const MolaPlanlama = () => {
  // Context'ten veri al
  const { personeller } = useContext(DataContext);
  
  // State tanımlamaları
  const [vardiyalar, setVardiyalar] = useState([]);
  const [personelVardiyalari, setPersonelVardiyalari] = useState([]);
  const [molaPlanlar, setMolaPlanlar] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVardiya, setSelectedVardiya] = useState('');
  const [tumVardiyalariGoster, setTumVardiyalariGoster] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [molaDialogOpen, setMolaDialogOpen] = useState(false);
  const [currentMola, setCurrentMola] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // LocalStorage'dan veri yükleme
  useEffect(() => {
    const veriyiYukle = async () => {
      try {
        const lokalVardiyalar = localStorage.getItem('vardiyalar');
        if (lokalVardiyalar) {
          setVardiyalar(JSON.parse(lokalVardiyalar));
        }
        
        const lokalPersonelVardiyalari = localStorage.getItem('personelVardiyalari');
        if (lokalPersonelVardiyalari) {
          setPersonelVardiyalari(JSON.parse(lokalPersonelVardiyalari));
        }
        
        const lokalMolaPlanlar = localStorage.getItem('molaPlanlar');
        if (lokalMolaPlanlar) {
          setMolaPlanlar(JSON.parse(lokalMolaPlanlar));
        }
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    veriyiYukle();
  }, []);
  
  // Verileri LocalStorage'a kaydet
  useEffect(() => {
    if (!loading && molaPlanlar.length > 0) {
      try {
        localStorage.setItem('molaPlanlar', JSON.stringify(molaPlanlar));
      } catch (error) {
        console.error('Mola planlarını kaydetme hatası:', error);
      }
    }
  }, [molaPlanlar, loading]);
  
  // Seçili gün/vardiya için mola planını yükle veya oluştur
  useEffect(() => {
    if (!selectedVardiya || loading) return;
    
    const tarihStr = format(currentDate, 'yyyy-MM-dd');
    const gunId = currentDate.getDay(); // 0: Pazar, 1: Pazartesi, ...
    
    // Bu tarih ve vardiya için mevcut mola planı
    const mevcutPlan = molaPlanlar.find(plan => 
      plan.tarih === tarihStr && plan.vardiyaId === selectedVardiya
    );
    
    if (mevcutPlan) {
      // Mevcut planı kullan
    } else {
      // Yeni mola planı oluştur
      const vardiya = vardiyalar.find(v => v.id === selectedVardiya);
      if (vardiya) {
        // Otomatik mola planı oluştur
        const otomatikMolalar = otomatikMolaPlanOlustur(vardiya, gunId);
        
        if (otomatikMolalar.length > 0) {
          // Yeni planı kaydet
          const yeniPlan = {
            id: uuidv4(),
            tarih: tarihStr,
            vardiyaId: selectedVardiya,
            molalar: otomatikMolalar,
            olusturulmaTarihi: new Date().toISOString()
          };
          
          setMolaPlanlar(prev => [...prev, yeniPlan]);
        }
      }
    }
  }, [selectedVardiya, currentDate, loading]);
  
  // Otomatik mola planı oluştur
  const otomatikMolaPlanOlustur = (vardiya, gunId) => {
    if (!vardiya) return [];
    
    // Vardiyada çalışan personelleri bul
    const vardiyaPersonelleri = personeller.filter(p => 
      personelVardiyalari.some(pv => {
        const gunDurumu = pv.haftalikPlan.find(g => g.gun === gunId);
        return pv.personelId === p.id && gunDurumu && gunDurumu.vardiyaId === vardiya.id;
      })
    );
    
    if (vardiyaPersonelleri.length === 0) return [];
    
    // Vardiya başlangıç ve bitiş saatleri
    const baslangicSaat = parseInt(vardiya.baslangicSaati.split(':')[0]);
    const baslangicDakika = parseInt(vardiya.baslangicSaati.split(':')[1]);
    const bitisSaat = parseInt(vardiya.bitisSaati.split(':')[0]);
    const bitisDakika = parseInt(vardiya.bitisSaati.split(':')[1]);
    
    // Vardiya süresi (dakika)
    const vardiyaSuresiDakika = 
      (bitisSaat * 60 + bitisDakika) - (baslangicSaat * 60 + baslangicDakika);
    
    // Mola sayısı
    const molaSayisi = vardiya.molaSayisi || 3;
    
    // Departmanları grupla
    const departmanlar = [...new Set(vardiyaPersonelleri.map(p => p.departman))];
    const departmanPersonelleri = {};
    departmanlar.forEach(dept => {
      departmanPersonelleri[dept] = vardiyaPersonelleri.filter(p => p.departman === dept);
    });
    
    // Mola zamanları ve süreleri
    const molalar = [];
    let molaOffset = 0;
    
    // Her departmana farklı gruplar halinde mola planla
    departmanlar.forEach((departman, deptIndex) => {
      const personeller = departmanPersonelleri[departman];
      
      // Her personel için mola planla
      personeller.forEach((personel, persIndex) => {
        // Mola 1 (Sabah molası - 30 dakika)
        const mola1Baslangic = baslangicSaat * 60 + baslangicDakika + Math.floor(vardiyaSuresiDakika * 0.25);
        const mola1BaslangicSaat = Math.floor((mola1Baslangic + molaOffset) / 60);
        const mola1BaslangicDakika = (mola1Baslangic + molaOffset) % 60;
        const mola1BitisSaat = Math.floor((mola1Baslangic + molaOffset + 30) / 60);
        const mola1BitisDakika = (mola1Baslangic + molaOffset + 30) % 60;
        
        molalar.push({
          id: uuidv4(),
          personelId: personel.id,
          molaNo: 1,
          baslangicSaati: `${mola1BaslangicSaat.toString().padStart(2, '0')}:${mola1BaslangicDakika.toString().padStart(2, '0')}`,
          bitisSaati: `${mola1BitisSaat.toString().padStart(2, '0')}:${mola1BitisDakika.toString().padStart(2, '0')}`,
          departman: personel.departman,
          sure: 30
        });
        
        // Mola 2 (Öğle molası - 45 dakika)
        const mola2Baslangic = baslangicSaat * 60 + baslangicDakika + Math.floor(vardiyaSuresiDakika * 0.5);
        const mola2BaslangicSaat = Math.floor((mola2Baslangic + molaOffset) / 60);
        const mola2BaslangicDakika = (mola2Baslangic + molaOffset) % 60;
        const mola2BitisSaat = Math.floor((mola2Baslangic + molaOffset + 45) / 60);
        const mola2BitisDakika = (mola2Baslangic + molaOffset + 45) % 60;
        
        molalar.push({
          id: uuidv4(),
          personelId: personel.id,
          molaNo: 2,
          baslangicSaati: `${mola2BaslangicSaat.toString().padStart(2, '0')}:${mola2BaslangicDakika.toString().padStart(2, '0')}`,
          bitisSaati: `${mola2BitisSaat.toString().padStart(2, '0')}:${mola2BitisDakika.toString().padStart(2, '0')}`,
          departman: personel.departman,
          sure: 45
        });
        
        // Mola 3 (Akşam molası - 30 dakika)
        const mola3Baslangic = baslangicSaat * 60 + baslangicDakika + Math.floor(vardiyaSuresiDakika * 0.75);
        const mola3BaslangicSaat = Math.floor((mola3Baslangic + molaOffset) / 60);
        const mola3BaslangicDakika = (mola3Baslangic + molaOffset) % 60;
        const mola3BitisSaat = Math.floor((mola3Baslangic + molaOffset + 30) / 60);
        const mola3BitisDakika = (mola3Baslangic + molaOffset + 30) % 60;
        
        molalar.push({
          id: uuidv4(),
          personelId: personel.id,
          molaNo: 3,
          baslangicSaati: `${mola3BaslangicSaat.toString().padStart(2, '0')}:${mola3BaslangicDakika.toString().padStart(2, '0')}`,
          bitisSaati: `${mola3BitisSaat.toString().padStart(2, '0')}:${mola3BitisDakika.toString().padStart(2, '0')}`,
          departman: personel.departman,
          sure: 30
        });
        
        // Her personel için offset değerini artır (personeller arası 20 dakika)
        molaOffset += 20;
      });
      
      // Her departman grubu arasında biraz daha fazla boşluk bırak
      molaOffset += 10;
    });
    
    return molalar;
  };
  
  // Mola planını kaydet
  const handleMolaPlanKaydet = () => {
    if (!selectedVardiya) {
      alert('Lütfen önce bir vardiya seçin.');
      return;
    }
    
    const tarihStr = format(currentDate, 'yyyy-MM-dd');
    
    // Bu tarih ve vardiya için mevcut mola planı
    const mevcutPlanIndex = molaPlanlar.findIndex(plan => 
      plan.tarih === tarihStr && plan.vardiyaId === selectedVardiya
    );
    
    if (mevcutPlanIndex !== -1) {
      // Mevcut planı güncelle
      const guncelPlanlar = [...molaPlanlar];
      guncelPlanlar[mevcutPlanIndex] = {
        ...guncelPlanlar[mevcutPlanIndex],
        molalar: getGunlukMolalar(),
        sonGuncellemeTarihi: new Date().toISOString()
      };
      setMolaPlanlar(guncelPlanlar);
    } else {
      // Yeni plan oluştur
      const yeniPlan = {
        id: uuidv4(),
        tarih: tarihStr,
        vardiyaId: selectedVardiya,
        molalar: getGunlukMolalar(),
        olusturulmaTarihi: new Date().toISOString()
      };
      setMolaPlanlar([...molaPlanlar, yeniPlan]);
    }
    
    alert('Mola planı kaydedildi!');
  };
  
  // Seçili tarih ve vardiya için mola planını al
  const getGunlukMolalar = () => {
    const tarihStr = format(currentDate, 'yyyy-MM-dd');
    const mevcutPlan = molaPlanlar.find(plan => 
      plan.tarih === tarihStr && plan.vardiyaId === selectedVardiya
    );
    
    return mevcutPlan ? mevcutPlan.molalar : [];
  };
  
  // Seçili tarih için tüm vardiyaların mola planlarını birleştirip al
  const getTumVardiyaMolalari = () => {
    const tarihStr = format(currentDate, 'yyyy-MM-dd');
    let tumMolalar = [];
    
    // Bu tarih için tüm vardiyaların planlarını bul
    const gunlukPlanlar = molaPlanlar.filter(plan => plan.tarih === tarihStr);
    
    // Tüm molaları birleştir
    gunlukPlanlar.forEach(plan => {
      tumMolalar = [...tumMolalar, ...plan.molalar];
    });
    
    return tumMolalar;
  };
  
  // Tab değiştirme
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Mola dialog
  const handleMolaDialogOpen = (mola = null) => {
    if (mola) {
      setCurrentMola(mola);
    } else {
      setCurrentMola({
        id: uuidv4(),
        personelId: '',
        molaNo: 1,
        baslangicSaati: '10:00',
        bitisSaati: '10:30',
        departman: '',
        sure: 30
      });
    }
    setMolaDialogOpen(true);
  };
  
  // Mola kaydet
  const handleMolaKaydet = () => {
    if (!currentMola.personelId) {
      alert('Lütfen bir personel seçin.');
      return;
    }
    
    const tarihStr = format(currentDate, 'yyyy-MM-dd');
    const personel = personeller.find(p => p.id === currentMola.personelId);
    
    // Personelin departmanını ekle
    const yeniMola = {
      ...currentMola,
      departman: personel ? personel.departman : ''
    };
    
    // Başlangıç ve süre değişmişse bitiş saatini hesapla
    if (yeniMola.baslangicSaati && yeniMola.sure) {
      const baslangic = parse(yeniMola.baslangicSaati, 'HH:mm', new Date());
      const bitis = addMinutes(baslangic, yeniMola.sure);
      yeniMola.bitisSaati = format(bitis, 'HH:mm');
    }
    
    // Mola planını bul veya oluştur
    const planIndex = molaPlanlar.findIndex(plan => 
      plan.tarih === tarihStr && plan.vardiyaId === selectedVardiya
    );
    
    if (planIndex === -1) {
      // Henüz plan yok, yeni oluştur
      const yeniPlan = {
        id: uuidv4(),
        tarih: tarihStr,
        vardiyaId: selectedVardiya,
        molalar: [yeniMola],
        olusturulmaTarihi: new Date().toISOString()
      };
      setMolaPlanlar([...molaPlanlar, yeniPlan]);
    } else {
      // Mevcut planı güncelle
      const guncelPlanlar = [...molaPlanlar];
      let mevcutMolalar = [...guncelPlanlar[planIndex].molalar];
      
      const molaIndex = mevcutMolalar.findIndex(m => m.id === yeniMola.id);
      if (molaIndex !== -1) {
        // Mevcut molayı güncelle
        mevcutMolalar[molaIndex] = yeniMola;
      } else {
        // Yeni mola ekle
        mevcutMolalar.push(yeniMola);
      }
      
      guncelPlanlar[planIndex] = {
        ...guncelPlanlar[planIndex],
        molalar: mevcutMolalar,
        sonGuncellemeTarihi: new Date().toISOString()
      };
      
      setMolaPlanlar(guncelPlanlar);
    }
    
    setMolaDialogOpen(false);
  };
  
  // Mola sil
  const handleMolaSil = (molaId) => {
    if (!window.confirm('Bu molayı silmek istediğinizden emin misiniz?')) return;
    
    const tarihStr = format(currentDate, 'yyyy-MM-dd');
    const guncelPlanlar = [...molaPlanlar];
    
    // Tüm planları kontrol et
    for (let i = 0; i < guncelPlanlar.length; i++) {
      if (guncelPlanlar[i].tarih === tarihStr) {
        const yeniMolalar = guncelPlanlar[i].molalar.filter(m => m.id !== molaId);
        
        if (yeniMolalar.length !== guncelPlanlar[i].molalar.length) {
          guncelPlanlar[i] = {
            ...guncelPlanlar[i],
            molalar: yeniMolalar,
            sonGuncellemeTarihi: new Date().toISOString()
          };
          
          setMolaPlanlar(guncelPlanlar);
          return;
        }
      }
    }
  };
  
  // Excel indirme
  const handleExcelIndir = () => {
    const molalar = tumVardiyalariGoster ? getTumVardiyaMolalari() : getGunlukMolalar();
    
    if (molalar.length === 0) {
      alert('İndirilecek mola planı bulunamadı!');
      return;
    }
    
    // CSV oluştur
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Başlık satırı
    csvContent += "Personel,Departman,1. Mola,2. Mola,3. Mola\r\n";
    
    // Personel bazlı grupla
    const personelGruplu = {};
    molalar.forEach(mola => {
      if (!personelGruplu[mola.personelId]) {
        personelGruplu[mola.personelId] = {
          personel: personeller.find(p => p.id === mola.personelId),
          molalar: []
        };
      }
      personelGruplu[mola.personelId].molalar.push(mola);
    });
    
    // Her personel için bir satır oluştur
    Object.values(personelGruplu).forEach(data => {
      const personel = data.personel;
      if (!personel) return;
      
      const mola1 = data.molalar.find(m => m.molaNo === 1);
      const mola2 = data.molalar.find(m => m.molaNo === 2);
      const mola3 = data.molalar.find(m => m.molaNo === 3);
      
      const row = [
        `${personel.ad} ${personel.soyad}`,
        personel.departman,
        mola1 ? `${mola1.baslangicSaati}-${mola1.bitisSaati}` : "",
        mola2 ? `${mola2.baslangicSaati}-${mola2.bitisSaati}` : "",
        mola3 ? `${mola3.baslangicSaati}-${mola3.bitisSaati}` : ""
      ];
      
      csvContent += row.join(",") + "\r\n";
    });
    
    // CSV'yi indir
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Mola_Plani_${format(currentDate, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // PDF indirme (yazdırma arayüzü olarak)
  const handlePdfIndir = () => {
    const molalar = tumVardiyalariGoster ? getTumVardiyaMolalari() : getGunlukMolalar();
    
    if (molalar.length === 0) {
      alert('İndirilecek mola planı bulunamadı!');
      return;
    }
    
    // Seçili vardiya bilgisi
    const secilenVardiya = vardiyalar.find(v => v.id === selectedVardiya);
    const tarihFormat = format(currentDate, 'dd.MM.yyyy');
    
    // Personelleri departmanlara göre grupla
    const departmanlar = [...new Set(molalar.map(m => m.departman))].sort();
    
    // Yazdırma penceresi aç
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Mola Planı - ${tarihFormat}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { font-size: 18px; }
            h2 { font-size: 16px; margin: 20px 0 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .dept-satis { background-color: #e3f2fd; }
            .dept-kasa { background-color: #f1f8e9; }
            .dept-depo { background-color: #fff3e0; }
            .dept-yonetim { background-color: #e8eaf6; }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              table { page-break-inside: avoid; }
              .pagebreak { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <h1>Mola Planı - ${tarihFormat}</h1>
          ${!tumVardiyalariGoster && secilenVardiya ? 
            `<h2>Vardiya: ${secilenVardiya.ad} (${secilenVardiya.baslangicSaati} - ${secilenVardiya.bitisSaati})</h2>` : 
            '<h2>Tüm Vardiyalar</h2>'
          }
          
          <table>
            <thead>
              <tr>
                <th>Personel</th>
                <th>Departman</th>
                <th>1. Mola</th>
                <th>2. Mola</th>
                <th>3. Mola</th>
              </tr>
            </thead>
            <tbody>
    `);
    
    // Departman bazlı sırala
    departmanlar.forEach(departman => {
      // Departmandaki personelleri bul
      const departmanPersonelleri = personeller.filter(p => p.departman === departman);
      
      // Departman adını yaz
      printWindow.document.write(`
        <tr>
          <td colspan="5" style="background-color: #f5f5f5; font-weight: bold;">
            ${departman} Departmanı
          </td>
        </tr>
      `);
      
      // Her personel için molaları listele
      departmanPersonelleri.forEach(personel => {
        // Bu personelin molaları
        const personelMolalari = molalar.filter(m => m.personelId === personel.id);
        
        if (personelMolalari.length === 0) return;
        
        const mola1 = personelMolalari.find(m => m.molaNo === 1);
        const mola2 = personelMolalari.find(m => m.molaNo === 2);
        const mola3 = personelMolalari.find(m => m.molaNo === 3);
        
        const departmanClass = departman.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        printWindow.document.write(`
          <tr class="dept-${departmanClass}">
            <td>${personel.ad} ${personel.soyad}</td>
            <td>${personel.departman}</td>
            <td>${mola1 ? `${mola1.baslangicSaati}-${mola1.bitisSaati}` : ""}</td>
            <td>${mola2 ? `${mola2.baslangicSaati}-${mola2.bitisSaati}` : ""}</td>
            <td>${mola3 ? `${mola3.baslangicSaati}-${mola3.bitisSaati}` : ""}</td>
          </tr>
        `);
      });
    });
    
    printWindow.document.write(`
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 500);
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  // Vardiya değiştirme
  const handleVardiyaChange = (event) => {
    setSelectedVardiya(event.target.value);
  };
  
  // Tüm vardiyaları göster/gizle
  const handleTumVardiyalarGosterChange = (event) => {
    setTumVardiyalariGoster(event.target.checked);
  };
  
  // Seçili gün için uygun vardiyaları filtrele
  const gunVardiyalari = vardiyalar.filter(vardiya => 
    vardiya.gunler.includes(currentDate.getDay())
  );
  
  // Seçili vardiya
  const secilenVardiya = vardiyalar.find(v => v.id === selectedVardiya);
  
  // Görüntülenecek molalar
  const gosterilecekMolalar = tumVardiyalariGoster ? getTumVardiyaMolalari() : getGunlukMolalar();
  
  // Mola planı olan personeller
  const molasiOlanPersoneller = gosterilecekMolalar.length > 0 ? 
    [...new Set(gosterilecekMolalar.map(m => m.personelId))]
      .map(pId => personeller.find(p => p.id === pId))
      .filter(p => p !== undefined) :
    [];
  
  // Departmanlara göre gruplandırılmış personeller
  const departmanlar = [...new Set(molasiOlanPersoneller.map(p => p.departman))].sort();
  
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Mola Planlama</Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
              <DatePicker
                label="Tarih"
                value={currentDate}
                onChange={(newValue) => setCurrentDate(newValue || new Date())}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Vardiya</InputLabel>
              <Select
                value={selectedVardiya}
                label="Vardiya"
                onChange={handleVardiyaChange}
                disabled={gunVardiyalari.length === 0}
              >
                {gunVardiyalari.length === 0 ? (
                  <MenuItem value="" disabled>
                    Seçili gün için vardiya bulunamadı
                  </MenuItem>
                ) : (
                  gunVardiyalari.map((vardiya) => (
                    <MenuItem key={vardiya.id} value={vardiya.id}>
                      {vardiya.ad} ({vardiya.baslangicSaati} - {vardiya.bitisSaati})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={tumVardiyalariGoster}
                  onChange={handleTumVardiyalarGosterChange}
                  color="primary"
                />
              }
              label="Tüm vardiyalar"
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />}
                onClick={handleMolaPlanKaydet}
                disabled={!selectedVardiya}
                sx={{ mr: 1 }}
              >
                Kaydet
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  const menu = document.createElement('div');
                  menu.style.position = 'absolute';
                  menu.style.backgroundColor = 'white';
                  menu.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
                  menu.style.zIndex = '1000';
                  menu.style.borderRadius = '4px';
                  menu.style.padding = '8px 0';
                  
                  const excelBtn = document.createElement('button');
                  excelBtn.textContent = 'Excel';
                  excelBtn.style.display = 'block';
                  excelBtn.style.width = '100%';
                  excelBtn.style.border = 'none';
                  excelBtn.style.backgroundColor = 'transparent';
                  excelBtn.style.padding = '8px 16px';
                  excelBtn.style.textAlign = 'left';
                  excelBtn.style.cursor = 'pointer';
                  excelBtn.onclick = () => {
                    document.body.removeChild(menu);
                    handleExcelIndir();
                  };
                  
                  const pdfBtn = document.createElement('button');
                  pdfBtn.textContent = 'PDF';
                  pdfBtn.style.display = 'block';
                  pdfBtn.style.width = '100%';
                  pdfBtn.style.border = 'none';
                  pdfBtn.style.backgroundColor = 'transparent';
                  pdfBtn.style.padding = '8px 16px';
                  pdfBtn.style.textAlign = 'left';
                  pdfBtn.style.cursor = 'pointer';
                  pdfBtn.onclick = () => {
                    document.body.removeChild(menu);
                    handlePdfIndir();
                  };
                  
                  menu.appendChild(excelBtn);
                  menu.appendChild(pdfBtn);
                  
                  document.body.appendChild(menu);
                  
                  const rect = event.currentTarget.getBoundingClientRect();
                  menu.style.top = `${rect.bottom}px`;
                  menu.style.left = `${rect.left}px`;
                  
                  const closeOnClickOutside = (e) => {
                    if (!menu.contains(e.target) && e.target !== event.currentTarget) {
                      document.body.removeChild(menu);
                      document.removeEventListener('click', closeOnClickOutside);
                    }
                  };
                  
                  setTimeout(() => {
                    document.addEventListener('click', closeOnClickOutside);
                  }, 0);
                }}
                disabled={gosterilecekMolalar.length === 0}
                sx={{ mr: 1 }}
              >
                İndir
              </Button>
              
              <IconButton 
                color="primary" 
                onClick={handlePdfIndir}
                disabled={gosterilecekMolalar.length === 0}
              >
                <PrintIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Liste Görünümü" />
          <Tab label="Takvim Görünümü" />
        </Tabs>
      </Box>
      
      {tabValue === 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Mola Planı - Liste Görünümü
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => handleMolaDialogOpen()}
              disabled={!selectedVardiya}
            >
              Mola Ekle
            </Button>
          </Box>
          
          {!selectedVardiya && !tumVardiyalariGoster ? (
            <Alert severity="info">Lütfen bir vardiya seçin veya "Tüm vardiyalar" seçeneğini etkinleştirin.</Alert>
          ) : gosterilecekMolalar.length === 0 ? (
            <Alert severity="warning">Görüntülenecek mola planı bulunamadı.</Alert>
          ) : (
            <Box sx={{ mb: 4 }}>
              {tumVardiyalariGoster ? (
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  {format(currentDate, 'dd MMMM yyyy', { locale: trLocale })} Tarihli Tüm Vardiyalar
                </Typography>
              ) : secilenVardiya ? (
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Vardiya: {secilenVardiya.ad} ({secilenVardiya.baslangicSaati} - {secilenVardiya.bitisSaati})
                </Typography>
              ) : null}
              
              {/* Departman bazlı gruplama */}
              {departmanlar.map(departman => {
                // Bu departmandaki personeller
                const departmanPersonelleri = molasiOlanPersoneller.filter(p => p.departman === departman);
                
                if (departmanPersonelleri.length === 0) return null;
                
                // Departman arka plan rengi
                const departmanBgColor = {
                  'Satış': '#e3f2fd',
                  'Kasa': '#f1f8e9',
                  'Depo': '#fff3e0',
                  'Yönetim': '#e8eaf6'
                }[departman] || '#f5f5f5';
                
                return (
                  <Box key={departman} sx={{ mb: 4 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        p: 1, 
                        bgcolor: departmanBgColor, 
                        borderRadius: 1,
                        fontWeight: 'bold',
                        mb: 1
                      }}
                    >
                      {departman} Departmanı
                    </Typography>
                    
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Personel</TableCell>
                            <TableCell>1. Mola</TableCell>
                            <TableCell>2. Mola</TableCell>
                            <TableCell>3. Mola</TableCell>
                            <TableCell align="right">İşlemler</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {departmanPersonelleri.map(personel => {
                            // Bu personelin molaları
                            const personelMolalari = gosterilecekMolalar.filter(m => m.personelId === personel.id);
                            
                            // Mola numaralarına göre molalar
                            const mola1 = personelMolalari.find(m => m.molaNo === 1);
                            const mola2 = personelMolalari.find(m => m.molaNo === 2);
                            const mola3 = personelMolalari.find(m => m.molaNo === 3);
                            
                            return (
                              <TableRow key={personel.id} sx={{ backgroundColor: departmanBgColor + '80' }}>
                                <TableCell>{`${personel.ad} ${personel.soyad}`}</TableCell>
                                <TableCell>
                                  {mola1 ? 
                                    `${mola1.baslangicSaati}-${mola1.bitisSaati}` : 
                                    <IconButton size="small" onClick={() => handleMolaDialogOpen({
                                      id: uuidv4(),
                                      personelId: personel.id,
                                      molaNo: 1,
                                      baslangicSaati: '10:00',
                                      bitisSaati: '10:30',
                                      departman: personel.departman,
                                      sure: 30
                                    })}>
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  }
                                </TableCell>
                                <TableCell>
                                  {mola2 ? 
                                    `${mola2.baslangicSaati}-${mola2.bitisSaati}` : 
                                    <IconButton size="small" onClick={() => handleMolaDialogOpen({
                                      id: uuidv4(),
                                      personelId: personel.id,
                                      molaNo: 2,
                                      baslangicSaati: '14:00',
                                      bitisSaati: '14:45',
                                      departman: personel.departman,
                                      sure: 45
                                    })}>
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  }
                                </TableCell>
                                <TableCell>
                                  {mola3 ? 
                                    `${mola3.baslangicSaati}-${mola3.bitisSaati}` : 
                                    <IconButton size="small" onClick={() => handleMolaDialogOpen({
                                      id: uuidv4(),
                                      personelId: personel.id,
                                      molaNo: 3,
                                      baslangicSaati: '17:00',
                                      bitisSaati: '17:30',
                                      departman: personel.departman,
                                      sure: 30
                                    })}>
                                      <AddIcon fontSize="small" />
                                    </IconButton>
                                  }
                                </TableCell>
                                <TableCell align="right">
                                  {personelMolalari.map(mola => (
                                    <React.Fragment key={mola.id}>
                                      <IconButton size="small" onClick={() => handleMolaDialogOpen(mola)}>
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton size="small" onClick={() => handleMolaSil(mola.id)}>
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </React.Fragment>
                                  ))}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>
      )}
      
      {tabValue === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Mola Planı - Takvim Görünümü
          </Typography>
          
          {!selectedVardiya && !tumVardiyalariGoster ? (
            <Alert severity="info">Lütfen bir vardiya seçin veya "Tüm vardiyalar" seçeneğini etkinleştirin.</Alert>
          ) : gosterilecekMolalar.length === 0 ? (
            <Alert severity="warning">Görüntülenecek mola planı bulunamadı.</Alert>
          ) : (
            <TakvimGorunumu 
              molalar={gosterilecekMolalar} 
              personeller={molasiOlanPersoneller}
            />
          )}
        </Paper>
      )}

      {/* Mola Ekleme/Düzenleme Dialog */}
      <Dialog open={molaDialogOpen} onClose={() => setMolaDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{currentMola && currentMola.id ? 'Mola Düzenle' : 'Yeni Mola Ekle'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Personel</InputLabel>
                <Select
                  value={currentMola?.personelId || ''}
                  label="Personel"
                  onChange={(e) => setCurrentMola({
                    ...currentMola,
                    personelId: e.target.value,
                    departman: personeller.find(p => p.id === e.target.value)?.departman || ''
                  })}
                  disabled={!!currentMola?.id}
                >
                  {personeller.map((personel) => (
                    <MenuItem key={personel.id} value={personel.id}>
                      {`${personel.ad} ${personel.soyad} (${personel.departman})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Mola No</InputLabel>
                <Select
                  value={currentMola?.molaNo || 1}
                  label="Mola No"
                  onChange={(e) => setCurrentMola({...currentMola, molaNo: e.target.value})}
                >
                  <MenuItem value={1}>1. Mola</MenuItem>
                  <MenuItem value={2}>2. Mola</MenuItem>
                  <MenuItem value={3}>3. Mola</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                label="Başlangıç Saati"
                type="time"
                fullWidth
                value={currentMola?.baslangicSaati || '10:00'}
                onChange={(e) => {
                  const baslangicSaati = e.target.value;
                  const sure = currentMola?.sure || 30;
                  
                  // Bitiş saatini hesapla
                  const baslangic = parse(baslangicSaati, 'HH:mm', new Date());
                  const bitis = addMinutes(baslangic, sure);
                  const bitisSaati = format(bitis, 'HH:mm');
                  
                  setCurrentMola({...currentMola, baslangicSaati, bitisSaati});
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                label="Süre (dk)"
                type="number"
                fullWidth
                value={currentMola?.sure || 30}
                onChange={(e) => {
                  const sure = parseInt(e.target.value);
                  
                  // Bitiş saatini hesapla
                  const baslangic = parse(currentMola?.baslangicSaati || '10:00', 'HH:mm', new Date());
                  const bitis = addMinutes(baslangic, sure);
                  const bitisSaati = format(bitis, 'HH:mm');
                  
                  setCurrentMola({...currentMola, sure, bitisSaati});
                }}
                InputProps={{ inputProps: { min: 5, max: 120 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMolaDialogOpen(false)}>İptal</Button>
          <Button onClick={handleMolaKaydet} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Takvim Görünümü Bileşeni
const TakvimGorunumu = ({ molalar, personeller }) => {
  // Tüm mola başlangıç ve bitiş saatlerinden saat aralığını bul
  const saatAraliklari = [];
  let enErkenSaat = 24;
  let enGecSaat = 0;
  
  molalar.forEach(mola => {
    const baslangicSaat = parseInt(mola.baslangicSaati.split(':')[0]);
    const bitisSaat = parseInt(mola.bitisSaati.split(':')[0]);
    
    enErkenSaat = Math.min(enErkenSaat, baslangicSaat);
    enGecSaat = Math.max(enGecSaat, bitisSaat);
  });
  
  // Saat çizelgesini oluştur (en erken saatten en geç saate kadar)
  for (let i = enErkenSaat; i <= enGecSaat; i++) {
    saatAraliklari.push(i);
  }
  
  // Departman bazlı renklendirme
  const departmanRenkleri = {
    'Satış': { bg: '#e3f2fd', border: '#2196f3' },
    'Kasa': { bg: '#f1f8e9', border: '#4caf50' },
    'Depo': { bg: '#fff3e0', border: '#ff9800' },
    'Yönetim': { bg: '#e8eaf6', border: '#3f51b5' }
  };
  
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 150 }}>Personel</TableCell>
            {saatAraliklari.map(saat => (
              <TableCell key={saat} align="center" sx={{ minWidth: 100 }}>
                {`${saat}:00`}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Departman bazlı gruplama */}
          {[...new Set(personeller.map(p => p.departman))].sort().map(departman => {
            // Bu departmandaki personeller
            const departmanPersonelleri = personeller.filter(p => p.departman === departman);
            
            if (departmanPersonelleri.length === 0) return null;
            
            // Departman başlığı
            return (
              <React.Fragment key={departman}>
                <TableRow>
                  <TableCell 
                    colSpan={saatAraliklari.length + 1} 
                    sx={{ 
                      bgcolor: departmanRenkleri[departman]?.bg || '#f5f5f5',
                      fontWeight: 'bold'
                    }}
                  >
                    {departman} Departmanı
                  </TableCell>
                </TableRow>
                
                {/* Departmandaki her personel için bir satır */}
                {departmanPersonelleri.map(personel => {
                  // Bu personelin molaları
                  const personelMolalari = molalar.filter(m => m.personelId === personel.id);
                  
                  return (
                    <TableRow key={personel.id}>
                      <TableCell sx={{ 
                        backgroundColor: departmanRenkleri[departman]?.bg + '80' || '#f5f5f5'
                      }}>
                        {`${personel.ad} ${personel.soyad}`}
                      </TableCell>
                      
                      {/* Her saat için bir hücre */}
                      {saatAraliklari.map(saat => {
                        // Bu saat aralığına denk gelen molalar
                        const saatMolalari = personelMolalari.filter(mola => {
                          const molaBaslangicSaat = parseInt(mola.baslangicSaati.split(':')[0]);
                          const molaBitisSaat = parseInt(mola.bitisSaati.split(':')[0]);
                          
                          return (
                            (molaBaslangicSaat === saat) || // Mola bu saatte başlıyor
                            (molaBitisSaat === saat && parseInt(mola.bitisSaati.split(':')[1]) > 0) || // Mola bu saatte bitiyor (xx:00 hariç)
                            (molaBaslangicSaat < saat && molaBitisSaat > saat) // Mola bu saati kapsıyor
                          );
                        });
                        
                        return (
                          <TableCell key={saat} align="center" sx={{ position: 'relative', height: 60 }}>
                            {saatMolalari.map((mola, index) => {
                              // Mola rengi
                              const molaRenk = {
                                1: { bg: '#bbdefb', border: '#2196f3' }, // 1. Mola
                                2: { bg: '#c8e6c9', border: '#4caf50' }, // 2. Mola
                                3: { bg: '#ffccbc', border: '#ff5722' }  // 3. Mola
                              }[mola.molaNo] || { bg: '#e0e0e0', border: '#9e9e9e' };
                              
                              // Mola zamanı
                              const molaZaman = `${mola.baslangicSaati}-${mola.bitisSaati}`;
                              
                              return (
                                <Tooltip key={mola.id} title={`${mola.molaNo}. Mola: ${molaZaman}`}>
                                  <Box sx={{
                                    position: 'absolute',
                                    top: `${5 + (index * 25)}px`,
                                    left: '5px',
                                    right: '5px',
                                    padding: '4px 8px',
                                    backgroundColor: molaRenk.bg,
                                    border: `1px solid ${molaRenk.border}`,
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {`${mola.molaNo}. Mola`}
                                  </Box>
                                </Tooltip>
                              );
                            })}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};

export default MolaPlanlama;