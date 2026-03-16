import React from 'react';
import axios from 'axios';

function Dashboard({ token, role, onLogout }) {
  const callRoleApi = async () => {
    const path =
      role === 'admin'
        ? '/admin/data'
        : role === 'customer'
        ? '/customer/data'
        : '/owner/data';

    try {
      const response = await axios.get(`http://localhost:4000${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(response.data.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Error calling API');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <p>Logged in as: {role}</p>
      <button onClick={callRoleApi}>Call {role} API</button>
      <button onClick={onLogout} style={{ marginLeft: 10 }}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;


