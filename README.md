# Mola Planlama Uygulaması

Mola Planlama Uygulaması, personellerin mola sürelerinin düzenli şekilde planlanmasına yardımcı olmak için geliştirilmiştir. Uygulama hem masaüstü (Electron) hem de web (React) platformlarında çalışacak şekilde yapılandırılmıştır.


## Kurulum
Projeyi çalıştırmak için aşağıdaki adımları takip edin:


### 1. Projeyi klonlayın
git clone https://github.com/caleofin/MolaPlanlamaApp

### 2. Proje dizinine girin
cd mola-planlama

### 3. Bağımlılıkları yükleyin
`npm install`

Not: npm install komutu çalıştırılmadan uygulama başlatılamaz.



💻 Electron (Masaüstü) Sürümü
Uygulama ilk olarak Electron tabanlı masaüstü uygulaması olarak planlanmıştır. Ancak şu anda bazı kütüphane uyuşmazlıkları nedeniyle Electron sürümü çalışmamaktadır.

Electron sürümünü başlatmak için (şu an çalışmayabilir):

`npm run start`


🌐 React (Web) Sürümü
React tabanlı web uygulamasını başlatmak için aşağıdaki komutu kullanabilirsiniz:

`npm run react-start`
Bu komut ile uygulamayı varsayılan tarayıcınızda görüntüleyebilirsiniz.


🛠️ Kullanılan Teknolojiler
Electron – Masaüstü uygulama geliştirme

React – Kullanıcı arayüzü oluşturma

Node.js – Sunucu tarafı çalıştırma ortamı


⚠️ Bilgilendirme
Şu anda Electron tabanlı sürümde bazı kütüphane uyumsuzlukları bulunmaktadır. Bu nedenle yalnızca React web sürümü stabil olarak çalışmaktadır. Electron sürümüyle ilgili düzeltmeler ilerleyen güncellemelerde yapılacaktır.
