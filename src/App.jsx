import CityCanvas from './components/CityCanvas.jsx';
import './index.css';

export default function App() {
  return (
    <div style={{ background: '#1a1a2e', minHeight: '100vh', overflow: 'auto' }}>
      <CityCanvas />
    </div>
  );
}
