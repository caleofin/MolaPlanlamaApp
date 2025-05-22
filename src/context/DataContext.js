import React, { createContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [personeller, setPersoneller] = useState([]);
  const [vardiyalar, setVardiyalar] = useState([]);
  const [molaPlanlar, setMolaPlanlar] = useState([]);
  const [loading, setLoading] = useState(true);

  // Uygulama başlangıcında verileri yükle
  useEffect(() => {
    const veriyiYukle = () => {
      try {
        const personelVerisi = localStorage.getItem('personeller');
        const vardiyaVerisi = localStorage.getItem('vardiyalar');
        const molaPlanVerisi = localStorage.getItem('molaPlanlar');
        
        if (personelVerisi) setPersoneller(JSON.parse(personelVerisi));
        if (vardiyaVerisi) setVardiyalar(JSON.parse(vardiyaVerisi));
        if (molaPlanVerisi) setMolaPlanlar(JSON.parse(molaPlanVerisi));
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    veriyiYukle();
  }, []);

  // Veri değiştiğinde bilgileri kaydet
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('personeller', JSON.stringify(personeller));
      localStorage.setItem('vardiyalar', JSON.stringify(vardiyalar));
      localStorage.setItem('molaPlanlar', JSON.stringify(molaPlanlar));
    }
  }, [personeller, vardiyalar, molaPlanlar, loading]);

  // Personel İşlemleri
  const personelEkle = (yeniPersonel) => {
    const personel = { id: uuidv4(), ...yeniPersonel };
    setPersoneller([...personeller, personel]);
    return personel;
  };

  const personelGuncelle = (id, guncelBilgiler) => {
    setPersoneller(personeller.map(p => p.id === id ? { ...p, ...guncelBilgiler } : p));
  };

  const personelSil = (id) => {
    setPersoneller(personeller.filter(p => p.id !== id));
  };

  // Vardiya İşlemleri
  const vardiyaEkle = (yeniVardiya) => {
    const vardiya = { id: uuidv4(), ...yeniVardiya };
    setVardiyalar([...vardiyalar, vardiya]);
    return vardiya;
  };

  const vardiyaGuncelle = (id, guncelBilgiler) => {
    setVardiyalar(vardiyalar.map(v => v.id === id ? { ...v, ...guncelBilgiler } : v));
  };

  const vardiyaSil = (id) => {
    setVardiyalar(vardiyalar.filter(v => v.id !== id));
  };

  // Mola Plan İşlemleri
  const molaPlanEkle = (yeniPlan) => {
    const plan = {
      id: uuidv4(),
      ...yeniPlan,
      olusturulmaTarihi: new Date().toISOString()
    };
    setMolaPlanlar([...molaPlanlar, plan]);
    return plan;
  };

  const molaPlanGuncelle = (id, guncelBilgiler) => {
    setMolaPlanlar(molaPlanlar.map(mp => mp.id === id ? { ...mp, ...guncelBilgiler } : mp));
  };

  const molaPlanSil = (id) => {
    setMolaPlanlar(molaPlanlar.filter(mp => mp.id !== id));
  };

  const haftalikPlanKaydet = (plan) => {
    const mevcutPlanlar = localStorage.getItem('haftalikPlanlar');
    let planlar = mevcutPlanlar ? JSON.parse(mevcutPlanlar) : [];
    
    // Eğer aynı personel ve hafta için plan varsa güncelle, yoksa ekle
    const planIndex = planlar.findIndex(p => 
      p.personelId === plan.personelId && 
      p.haftaBaslangic === plan.haftaBaslangic
    );
    
    if (planIndex !== -1) {
      planlar[planIndex] = plan;
    } else {
      planlar.push(plan);
    }
    
    localStorage.setItem('haftalikPlanlar', JSON.stringify(planlar));
    return plan;
  };

  // Dosya indirme fonksiyonları (Electron olmadan)
  const excelIndir = (data, dosyaAdi) => {
    // Web tarayıcısında dosya indirme işlemi
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dosyaAdi;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const pdfIndir = (data, dosyaAdi) => {
    // Web tarayıcısında PDF indirme işlemi
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dosyaAdi;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DataContext.Provider value={{
      personeller,
      vardiyalar,
      molaPlanlar,
      loading,
      personelEkle,
      personelGuncelle,
      personelSil,
      vardiyaEkle,
      vardiyaGuncelle,
      vardiyaSil,
      molaPlanEkle,
      molaPlanGuncelle,
      molaPlanSil,
      excelIndir,
      pdfIndir
    }}>
      {children}
    </DataContext.Provider>
  );
};