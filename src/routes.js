import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import CreateGame from './components/CreateGame';
import ConnectGame from './components/ConnectGame';
import Game from './components/Game';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/connect" element={<ConnectGame />} />
        <Route path="/game/:code" element={<Game />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
