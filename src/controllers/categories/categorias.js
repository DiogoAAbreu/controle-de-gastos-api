const pool = require('../../data/conection')

const listarCategorias = async (req, res) => {
    try {
        const categorias = await pool.query('SELECT * FROM categorias')
        return res.status(200).json(categorias.rows)
    } catch (error) {
        console.error('Erro ao listar categorias:', error);
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
}

module.exports = {
    listarCategorias
}