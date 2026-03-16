import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import OwnerPage from './pages/OwnerPage.jsx';
import HenPage from './pages/HenPage.jsx';
import HenManagement from './pages/HenManagement.jsx';
import HollowBlocksPage from './pages/HollowBlocksPage.jsx';
import AmountPage from './pages/AmountPage.jsx';
import OverallProcessPage from './pages/OverallProcessPage.jsx';
import OwnerUsersPage from './pages/OwnerUsersPage.jsx';
import RequestPage from './pages/RequestPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import CartPage from './pages/CartPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import UnifiedMessagesPage from './pages/UnifiedMessagesPage.jsx';
import ContactPage from './pages/ContactPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/owner" element={<OwnerPage />} />
      <Route path="/owner/hen" element={<HenPage />} />
      <Route path="/owner/hen-management" element={<HenManagement />} />
      <Route path="/owner/hollow-blocks" element={<HollowBlocksPage />} />
      <Route path="/owner/amount" element={<AmountPage />} />
      <Route path="/owner/overall-process" element={<OverallProcessPage />} />
      <Route path="/owner/users" element={<OwnerUsersPage />} />
      <Route path="/owner/request" element={<RequestPage />} />
      <Route path="/owner/messages" element={<UnifiedMessagesPage />} />
      <Route path="/user/product" element={<ProductPage />} />
      <Route path="/user/cart" element={<CartPage />} />
      <Route path="/user/history" element={<HistoryPage />} />
      <Route path="/user/messages" element={<UnifiedMessagesPage />} />
      <Route path="/user/contact" element={<ContactPage />} />
    </Routes>
  );
}

export default App;


