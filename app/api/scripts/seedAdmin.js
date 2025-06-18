import bcrypt from 'bcrypt';
import db from '../../pages/api/config/db.js';

const seedAdmin = async () => {
  console.log('Iniciando o script de semeadura do administrador...');

  const admin_nome = "admin";
  const admin_email = "admin@ifc.edu.br";
  const admin_senha_plana = "ifcroot2025@";
  const admin_tipo_usuario = "admin";
  const admin_matricula = "000000"; // Matrícula padrão para admin

  try {
    // Verificar se o admin já existe
    const { rows } = await db.query("SELECT id FROM usuarios WHERE email = $1", [admin_email]);
    if (rows.length > 0) {
      console.log(`O usuário administrador com o email ${admin_email} já existe.`);
      return;
    }

    // Hash da senha
    const senha_hashed = await bcrypt.hash(admin_senha_plana, 10);

    // Inserir o admin
    const insertQuery = `
      INSERT INTO usuarios (nome, email, senha, tipo_usuario, matricula) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(insertQuery, [admin_nome, admin_email, senha_hashed, admin_tipo_usuario, admin_matricula]);

    console.log(`Usuário administrador '${admin_email}' criado com sucesso!`);

  } catch (error) {
    console.error('Erro ao executar o script de semeadura:', error);
  } finally {
    // Em uma aplicação maior, talvez você queira fechar a conexão do pool aqui,
    // mas como é um script simples, o processo terminará e fechará as conexões.
    console.log('Script de semeadura finalizado.');
  }
};

// Executa o script
seedAdmin(); 