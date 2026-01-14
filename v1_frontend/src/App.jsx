import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Host from './pages/Host';
import Controller from './pages/Controller';
import Join from './pages/Join';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host" element={<Host />} />
          <Route path="/join" element={<Join />} />
          <Route path="/controller/:roomCode" element={<Controller />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>🎮 WeleeConsole</h1>
        <p className="tagline">Your phone is the controller, your screen is the game</p>
      </header>
      
      <div className="home-options">
        <Link to="/host" className="btn btn-primary btn-large">
          🖥️ Host Game
          <span className="btn-subtitle">Start on TV/Desktop</span>
        </Link>
        
        <Link to="/join" className="btn btn-secondary btn-large">
          📱 Join Game
          <span className="btn-subtitle">Connect with phone</span>
        </Link>
      </div>

      <footer className="home-footer">
        <p>No app installation required • Works in any browser</p>
      </footer>
    </div>
  );
}

export default App;