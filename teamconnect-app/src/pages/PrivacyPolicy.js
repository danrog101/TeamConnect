import React from 'react';

function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <h1 style={{ color: '#1a73e8' }}>Politika Privatnosti</h1>
      <p style={{ color: '#888', fontStyle: 'italic' }}>Datum: 5. ožujka 2026.</p>

      <h2>1. Uvod</h2>
      <p>TeamConnects je web aplikacija koja spaja sportaše i rekreativne igrače prema lokaciji i sportu. Ova politika objašnjava kako prikupljamo i koristimo vaše podatke u skladu s GDPR-om.</p>

      <h2>2. Koje podatke prikupljamo</h2>
      <ul>
        <li>Ime i prezime</li>
        <li>E-mail adresa</li>
        <li>Lozinka (enkriptirana)</li>
        <li>Lokacija (grad, kvart)</li>
        <li>Odabrani sport</li>
      </ul>

      <h2>3. Zašto prikupljamo podatke</h2>
      <ul>
        <li>Kreiranje korisničkog računa</li>
        <li>Pronalazak timova i suigrača u blizini</li>
        <li>Odgovaranje na upite putem kontakt forme</li>
      </ul>

      <h2>4. Koliko dugo čuvamo podatke</h2>
      <ul>
        <li>Korisnički račun: dok god je aktivan + 30 dana</li>
        <li>Kontakt poruke: 12 mjeseci</li>
      </ul>

      <h2>5. Vaša prava (GDPR)</h2>
      <ul>
        <li>Pravo na pristup vašim podacima</li>
        <li>Pravo na ispravak netočnih podataka</li>
        <li>Pravo na brisanje računa i podataka</li>
        <li>Pravo na prigovor obradi podataka</li>
      </ul>

      <h2>6. Kontakt</h2>
      <p>Za sva pitanja: <a href="mailto:dana.rogulj01@gmail.com">dana.rogulj01@gmail.com</a></p>
      <p>Pritužbe možete podnijeti <a href="https://azop.hr" target="_blank" rel="noreferrer">AZOP-u (azop.hr)</a>.</p>

      <hr />
      <p style={{ color: '#999', fontSize: '14px' }}>© 2026 TeamConnects. Sva prava pridržana.</p>
    </div>
  );
}

export default PrivacyPolicy;