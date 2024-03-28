const pool = require('../data/conection')

const USUARIO_OBRIGATORIO = 'O usuário, senha e email são obrigatórios.';
const USUARIO_EXISTENTE = 'Já existe usuário cadastrado com o e-mail informado.';
const USUARIO_NAO_ENCONTRADO = 'Usuário não encontrado.';
const USUARIO_INVALIDO = 'Usuário e/ou senha inválido(s).';
const ERRO_INTERNO = 'Erro interno do servidor.';

const verificarUsuarioPorEmail = async (email) => {
    const verificaUsuario = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return verificaUsuario.rows[0];
}


module.exports = {
    verificarUsuarioPorEmail,
    USUARIO_OBRIGATORIO,
    USUARIO_EXISTENTE,
    USUARIO_NAO_ENCONTRADO,
    USUARIO_INVALIDO,
    ERRO_INTERNO
}


