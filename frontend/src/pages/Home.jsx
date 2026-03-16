import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1>SD HOLLOW BLOCKS</h1>
      <p>Select how you want to login:</p>
      <div style={{ marginTop: 20, display: 'flex', gap: 16, justifyContent: 'center' }}>
        <Link to="/login/customer">
          <button>Customer Login</button>
        </Link>
        <Link to="/login/owner">
          <button>Owner Login</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;

