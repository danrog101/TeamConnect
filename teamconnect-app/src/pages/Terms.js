import React from 'react';

function Terms() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <h1 style={{ color: '#1a73e8' }}>Uvjeti Korištenja</h1>
      <p style={{ color: '#888', fontStyle: 'italic' }}>Datum: 5. ožujka 2026.</p>

      <h2>1. Prihvaćanje uvjeta</h2>
      <p>Korištenjem aplikacije TeamConnects prihvaćate ove Uvjete korištenja.</p>

      <h2>2. Opis usluge</h2>
      <p>TeamConnects omogućuje registraciju, pretraživanje sportskih timova prema sportu i lokaciji te pridruživanje timovima.</p>

      <h2>3. Korisnički račun</h2>
      <ul>
        <li>Morate imati najmanje 16 godina</li>
        <li>Odgovorni ste za čuvanje lozinke</li>
        <li>Zabranjeno je kreiranje lažnih profila</li>
        <li>Jedan korisnik — jedan račun</li>
      </ul>

      <h2>4. Pravila ponašanja</h2>
      <p>Zabranjeno je:</p>
      <ul>
        <li>Postavljanje uvredljivog ili nezakonitog sadržaja</li>
        <li>Uznemiravanje drugih korisnika</li>
        <li>Korištenje aplikacije u komercijalne svrhe bez odobrenja</li>
        <li>Hakiranje ili ometanje rada aplikacije</li>
      </ul>

      <h2>5. Intelektualno vlasništvo</h2>
      <p>Sav sadržaj TeamConnectsa (dizajn, kod, logotip) vlasništvo je TeamConnects-a i zaštićen autorskim pravom.</p>

      <h2>6. Ograničenje odgovornosti</h2>
      <p>TeamConnects ne jamči neprekidan rad aplikacije niti točnost informacija koje objavljuju korisnici.</p>

      <h2>7. Primjenjivo pravo</h2>
      <p>Primjenjuje se zakonodavstvo Republike Hrvatske. Nadležan sud: Split.</p>

      <h2>8. Kontakt</h2>
      <p>Za pitanja: <a href="mailto:dana.rogulj01@gmail.com">dana.rogulj01@gmail.com</a></p>

      <hr />
      <p style={{ color: '#999', fontSize: '14px' }}>© 2026 TeamConnects. Sva prava pridržana.</p>
    </div>
  );
}

export default Terms;