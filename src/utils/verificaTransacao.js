const pool = require('../data/conection')

const ERRO_SERVIDOR = 'Erro interno do servidor.';
const ERRO_CATEGORIA = 'Informe a categoria corretamente.';
const ERRO_TRANSACAO_NAO_ENCONTRADA = 'Transação não encontrada.';
const ERRO_OPERACAO_NAO_AUTORIZADA = 'Operação não autorizada.';
const ERRO_NENHUMA_TRANSACAO_CADASTRADA = 'Você não tem nenhuma transação cadastrada.';

const validarCampos = async (req, res) => {
    try {
        const { descricao, valor, categoria_id, tipo } = req.body;
        if (!descricao || !valor || !categoria_id || !tipo) {
            return res.status(400).json({ mensagem: "Necessario preencher todos os campos." });
        }
        if (tipo !== "entrada" && tipo !== "saida") {
            return res.status(400).json({ mensagem: "O campo tipo deve receber 'entrada' ou 'saida'." });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
};

const poolQuery = async (query, values) => {
    try {
        const result = await pool.query(query, values);
        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
};

module.exports = {
    ERRO_SERVIDOR,
    ERRO_CATEGORIA,
    ERRO_TRANSACAO_NAO_ENCONTRADA,
    ERRO_OPERACAO_NAO_AUTORIZADA,
    ERRO_NENHUMA_TRANSACAO_CADASTRADA,
    validarCampos,
    poolQuery
}