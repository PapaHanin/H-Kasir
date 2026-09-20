import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Automatically register service worker for PWA offline capabilities
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Kasir-Q: Konten baru tersedia, memuat pembaruan di latar belakang...');
  },
  onOfflineReady() {
    console.log('Kasir-Q: Aplikasi siap bekerja penuh dalam mode offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
