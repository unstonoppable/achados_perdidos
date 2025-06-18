// Salve este arquivo como gerar-hash.js
const bcrypt = require('bcrypt');

// Troque 'minhaSenha' pela senha que você deseja hashear
const senha = 'ifcroot2025@';

bcrypt.hash(senha, 10, function(err, hash) {
  if (err) {
    console.error('Erro ao gerar hash:', err);
  } else {
    console.log('Hash gerado:', hash);
  }
});