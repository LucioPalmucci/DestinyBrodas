import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ClanLista from './Components/ClanLista';

function App() {
    return (
        <Router basename="/DestinyBrodas">
            <Routes>
                <Route path="/" element={<ClanLista />} />
            </Routes>
        </Router>
    );
}

export default App;