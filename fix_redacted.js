const fs = require('fs');
const f = 'd:/TeamConnect/teamconnect-app/src/i18n/translations.js';
let c = fs.readFileSync(f, 'utf8');

const pairs = [
  ['[REDACTED:password] lozinku', 'Potvrdi lozinku'],
  ['[REDACTED:password] lozinka?', 'Zaboravljena lozinka?'],
  ['[REDACTED:password] se ne podudaraju!', 'Lozinke se ne podudaraju!'],
  ['[REDACTED:password] mora imati minimalno 6 znakova!', 'Lozinka mora imati minimalno 6 znakova!'],
  ['[REDACTED:password] upiši lozinku', 'Ponovo upiši lozinku'],
  ['[REDACTED:password] novu lozinku za vaš račun.', 'Unesite novu lozinku za vaš račun.'],
  ['[REDACTED:password] je uspješno promijenjena!', 'Lozinka je uspješno promijenjena!'],
  ['[REDACTED:password] novu lozinku', 'Spremi novu lozinku'],
  ["'[REDACTED:password]'", "'Lozinka'"],
];

for (const [from, to] of pairs) {
  while (c.includes(from)) {
    c = c.replace(from, to);
  }
}

fs.writeFileSync(f, c, 'utf8');
const remaining = (c.match(/REDACTED/g) || []).length;
console.log('Done. Remaining REDACTED occurrences:', remaining);
