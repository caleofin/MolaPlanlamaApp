import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonelYonetimi from './pages/PersonelYonetimi';
import VardiyaPlanlama from './pages/VardiyaPlanlama';
import MolaPlanlama from './pages/MolaPlanlama';
import Ayarlar from './pages/Ayarlar';
import { DataProvider } from './context/DataContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // localStorage'dan verilerin düzgün yüklenmesi için
  useEffect(() => {
    // Uygulama ilk açıldığında veritabanı kontrolü
    const checkAndRepairDatabase = () => {
      // localStorage'daki verileri kontrol et
      const keysToCheck = ['personeller', 'vardiyalar', 'personelVardiyalari', 'molaPlanlar'];
      
      keysToCheck.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          // Veri yoksa veya bozuksa, boş bir array oluştur
          if (!data) {
            localStorage.setItem(key, JSON.stringify([]));
          } else {
            // Veriyi parse et, eğer hata varsa düzelt
            try {
              JSON.parse(data);
            } catch (e) {
              console.error(`${key} verisinde hata var, sıfırlanıyor.`, e);
              localStorage.setItem(key, JSON.stringify([]));
            }
          }
        } catch (error) {
          console.error(`${key} verisi kontrol edilirken hata oluştu:`, error);
        }
      });
    };
    
    checkAndRepairDatabase();
  }, []);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const menuItems = [
    { text: 'Personel Yönetimi', icon: <PeopleIcon />, path: '/' },
    { text: 'Vardiya Planlama', icon: <CalendarMonthIcon />, path: '/vardiya-planlama' },
    { text: 'Mola Planlama', icon: <ScheduleIcon />, path: '/mola-planlama' },
    { text: 'Ayarlar', icon: <SettingsIcon />, path: '/ayarlar' },
  ];

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
      <List>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} to={item.path}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DataProvider>
        <Router>
          <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
              <Toolbar>
                <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  sx={{ mr: 2 }}
                  onClick={toggleDrawer(true)}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  Mola Planlama Uygulaması
                </Typography>
              </Toolbar>
            </AppBar>
            <Drawer
              anchor="left"
              open={drawerOpen}
              onClose={toggleDrawer(false)}
            >
              {drawer}
            </Drawer>
            <Box className="container">
              <Routes>
                <Route path="/" element={<PersonelYonetimi />} />
                <Route path="/vardiya-planlama" element={<VardiyaPlanlama />} />
                <Route path="/mola-planlama" element={<MolaPlanlama />} />
                <Route path="/ayarlar" element={<Ayarlar />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;