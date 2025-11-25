import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore.ts';
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Animals from './pages/Animals.tsx';
import NotFound from './pages/NotFound.tsx';

// 개발 환경에서만 window에 등록 (디버깅용)
if (import.meta.env.DEV) {
  (window as any).useAuthStore = useAuthStore;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/animals" element={<Animals />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;