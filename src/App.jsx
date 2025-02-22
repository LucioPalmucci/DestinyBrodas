import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ClanLista from './Components/ClanLista/ClanLista';
import MemberDetail from './Components/MemberPage/MemberDetail';

function App() {
    return (
        <Router basename='/DestinyBrodas'>
            <Routes>
                <Route path="/" element={<ClanLista/>} />
                <Route path="/member/:membershipType/:membershipId" element={<MemberDetail/>} />
            </Routes>
        </Router>
    );
}

export default App;