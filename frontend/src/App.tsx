import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import KPIManagement from './pages/KPIManagement';
import ConnectProcess from './pages/ConnectProcess';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="kpis" element={<KPIManagement />} />
          <Route path="connect" element={<ConnectProcess />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
