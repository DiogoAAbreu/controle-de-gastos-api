const pool = require("../data/conection")
const jws = require('jsonwebtoken');
const jwsSecret = process.env.SENHA_JWT

const autenticacaoUsuario = async (req, res, next) => {
    const { authorization } = req.headers
    if (!authorization) {
        return res.status(401).json({ mensagem: 'Para acessar este recurso um token de autenticação válido deve ser enviado.' })
    }
    const token = authorization.replace('Bearer', '').trim()
    try {
        const { id } = jws.verify(token, jwsSecret)
        const usuario = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id])
        if (usuario.rowCount === 0) {
            return res.status(401).json({ mensagem: 'Usuário não encontrado.' })
        }
        req.usuario = usuario.rows[0]
        next()
    } catch (error) {
        return res.status(500).json({ mensagem: 'Para acessar este recurso um token de autenticação válido deve ser enviado.' });
    }
}

module.exports = autenticacaoUsuario;