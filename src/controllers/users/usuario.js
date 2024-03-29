const bcrypt = require('bcrypt');
const jws = require('jsonwebtoken');
const jwsSecret = process.env.SENHA_JWT;
const {
    verificarUsuarioPorEmail,
    USUARIO_OBRIGATORIO,
    USUARIO_EXISTENTE,
    USUARIO_NAO_ENCONTRADO,
    USUARIO_INVALIDO,
    ERRO_INTERNO
} = require('../../utils/localizaUsuario')
const { poolQuery } = require('../../utils/verificaTransacao')

const cadastrarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body

    try {
        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: USUARIO_OBRIGATORIO })
        }
        const usuarioExistente = await verificarUsuarioPorEmail(email);
        if (usuarioExistente) {
            return res.status(400).json({ mensagem: USUARIO_EXISTENTE })
        }
    } catch (error) {
        return res.status(500).json({ mensagem: ERRO_INTERNO });
    }

    try {
        const senhaCriptografada = await bcrypt.hash(senha, 10)
        const novoUsuario = await poolQuery('INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email', [nome, email, senhaCriptografada])
        return res.status(201).json(novoUsuario.rows[0]);
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        return res.status(500).json({ mensagem: ERRO_INTERNO });
    }
}

const loginUsuario = async (req, res) => {
    const { email, senha } = req.body
    try {
        if (!email || !senha) {
            return res.status(400).json({ mensagem: USUARIO_OBRIGATORIO })
        }
        const usuario = await verificarUsuarioPorEmail(email);
        if (!usuario) {
            return res.status(400).json({ mensagem: USUARIO_INVALIDO })
        }
        const senhaValida = await bcrypt.compare(senha, usuario.senha)
        if (!senhaValida) {
            return res.status(400).json({ mensagem: USUARIO_INVALIDO })
        }
        const token = jws.sign({ id: usuario.id }, jwsSecret, { expiresIn: '1h' })
        const { senha: senhaUsuario, ...dadosUsuario } = usuario
        return res.status(200).json({ usuario: dadosUsuario, token })
    } catch (error) {
        return res.status(500).json({ mensagem: ERRO_INTERNO });
    }
}

const detalhesUsuario = async (req, res) => {
    const { id } = req.usuario
    try {
        const usuario = await poolQuery('SELECT * FROM usuarios WHERE id = $1', [id])
        if (usuario.rowCount === 0) {
            return res.status(404).json({ mensagem: USUARIO_NAO_ENCONTRADO })
        }
        const { senha: senhaUsuario, ...dadosUsuario } = usuario.rows[0]
        return res.status(200).json(dadosUsuario)
    } catch (error) {
        return res.status(500).json({ mensagem: ERRO_INTERNO });
    }
}

const atualizarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body;
    const { id } = req.usuario
    try {
        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: USUARIO_OBRIGATORIO })
        }
        const usuarioExistente = await verificarUsuarioPorEmail(email);
        if (usuarioExistente && usuarioExistente.id !== id) {
            return res.status(400).json({ mensagem: USUARIO_EXISTENTE })
        }
        const novaSenha = await bcrypt.hash(senha, 10)
        const query = 'UPDATE usuarios SET nome = $1, email = $2, senha = $3 where id = $4'
        const values = [nome, email, novaSenha, id]
        const usuarioAtualizado = poolQuery(query, values);
        return res.status(201).json()
    } catch (error) {
        return res.status(500).json({ mensagem: ERRO_INTERNO });
    }
}

module.exports = {
    cadastrarUsuario,
    loginUsuario,
    detalhesUsuario,
    atualizarUsuario
}