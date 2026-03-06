import React from 'react';

function Footer() {
  return (
    <footer style={{
      backgroundColor: '#1a1a2e',
      color: '#aaa',
      textAlign: 'center',
      padding: '20px',
      marginTop: 'auto',
      fontSize: '14px'
    }}>
      <p>
        © 2026 TeamConnect. Sva prava pridržana. &nbsp;|&nbsp;
        <a href="/privacy-policy" style={{ color: '#1a73e8', textDecoration: 'none' }}>Privatnost</a>
        &nbsp;|&nbsp;
        <a href="/terms" style={{ color: '#1a73e8', textDecoration: 'none' }}>Uvjeti korištenja</a>
      </p>
    </footer>
  );
}

export default Footer;