const {
    ERRO_CATEGORIA,
    ERRO_SERVIDOR,
    ERRO_TRANSACAO_NAO_ENCONTRADA,
    ERRO_OPERACAO_NAO_AUTORIZADA,
    ERRO_NENHUMA_TRANSACAO_CADASTRADA,
    validarCampos,
    poolQuery } = require("../../utils/verificaTransacao");

const cadastrarTransacao = async (req, res) => {
    const { descricao, valor, categoria_id, tipo } = req.body;
    const { id } = req.usuario;
    const data = new Date();

    try {
        if (valor <= 0) {
            return res.status(400).json({ mensagem: "O campo valor deve ser maior que zero." });
        }

        await validarCampos(req, res);

        const categoriExiste = await poolQuery('SELECT descricao FROM CATEGORIAS WHERE id = $1', [categoria_id]);
        if (!categoriExiste || categoriExiste.rowCount < 1) {
            return res.status(400).json({ mensagem: ERRO_CATEGORIA });
        }

        const insertQuery = 'INSERT INTO transacoes (usuario_id, descricao, valor, data_transacao, categoria_id, tipo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const insertValues = [id, descricao, valor, data, categoria_id, tipo];
        const insertResult = await poolQuery(insertQuery, insertValues);
        if (insertResult && insertResult.rows.length > 0) {
            return res.status(201).json(insertResult.rows[0]);
        } else {
            throw new Error(ERRO_SERVIDOR);
        }
    } catch (error) {
        if (!res.headersSent) {
            return res.status(500).json({ mensagem: ERRO_SERVIDOR });
        }
    }
};

const listarTransacoes = async (req, res) => {
    try {
        const { id } = req.usuario;
        const { filtro } = req.query;

        let transacoes;
        if (filtro && filtro.length > 0) {
            const filtroQuery = filtro.map((f) => `LOWER(categorias.descricao) LIKE LOWER('%${f}%')`).join(' OR ');
            transacoes = await poolQuery(
                `SELECT transacoes.id, transacoes.tipo, transacoes.descricao, transacoes.valor, transacoes.data_transacao, transacoes.usuario_id, categorias.id AS categoria_id, categorias.descricao AS categoria_nome 
                FROM transacoes 
                INNER JOIN categorias ON transacoes.categoria_id = categorias.id 
                WHERE transacoes.usuario_id = $1 AND (${filtroQuery})`, [id]);
        } else {
            transacoes = await poolQuery(
                `SELECT transacoes.id, transacoes.tipo, transacoes.descricao, transacoes.valor, transacoes.data_transacao, transacoes.usuario_id, categorias.id AS categoria_id, categorias.descricao AS categoria_nome 
                FROM transacoes 
                INNER JOIN categorias ON transacoes.categoria_id = categorias.id 
                WHERE transacoes.usuario_id = $1`, [id]);
        }

        if (!transacoes) {
            return res.status(500).json({ mensagem: ERRO_SERVIDOR });
        }

        return res.status(200).json(transacoes.rows);
    } catch (error) {
        return res.status(500).json({ mensagem: ERRO_SERVIDOR });
    }
};

const listarTransacaoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: idUsuario } = req.usuario;

        const transacao = await poolQuery('SELECT * FROM transacoes WHERE id = $1 AND usuario_id = $2', [id, idUsuario]);
        if (!transacao) {
            return res.status(500).json({ mensagem: ERRO_SERVIDOR });
        }
        if (transacao.rowCount === 0) {
            return res.status(404).json({ mensagem: ERRO_TRANSACAO_NAO_ENCONTRADA });
        }

        return res.status(200).json(transacao.rows[0]);
    } catch (error) {
        return res.status(500).json({ mensagem: ERRO_SERVIDOR });
    }
};

const atualizaTransacao = async (req, res) => {
    try {
        const { id } = req.params;
        const { descricao, valor, data, categoria_id, tipo } = req.body;
        const { usuario } = req;
        if (valor <= 0) {
            return res.status(400).json({ mensagem: "O campo valor deve ser maior que zero." });
        }

        await validarCampos(req, res);

        const transacao = await poolQuery('select usuario_id from transacoes where id = $1', [id]);
        if (!transacao) {
            return res.status(500).json({ mensagem: ERRO_SERVIDOR });
        }
        if (transacao.rowCount < 1) {
            return res.status(400).json({ mensagem: ERRO_TRANSACAO_NAO_ENCONTRADA });
        }
        if (transacao.rows[0].usuario_id !== usuario.id) {
            return res.status(401).json({ mensagem: ERRO_OPERACAO_NAO_AUTORIZADA });
        }

        const categoriExiste = await poolQuery('SELECT descricao FROM CATEGORIAS WHERE id = $1', [categoria_id]);
        if (!categoriExiste || categoriExiste.rowCount < 1) {
            return res.status(400).json({ mensagem: ERRO_CATEGORIA });
        }

        const query = 'UPDATE transacoes SET descricao = $1, valor = $2, data_transacao = $3, categoria_id = $4, tipo = $5 WHERE id = $6 RETURNING *';
        const values = [descricao, valor, data, categoria_id, tipo, id];

        const update = await poolQuery(query, values);
        if (!update) {
            return res.status(500).json({ mensagem: ERRO_SERVIDOR });
        }

        const resposta = update.rows[0];
        resposta.categoria_nome = categoriExiste.rows[0].descricao;

        return res.status(200).json(resposta);
    } catch (error) {
        console.log(error);
        if (!res.headersSent) {
            return res.status(500).json({ mensagem: ERRO_SERVIDOR });
        }
    }
};

const deletarTransacao = async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario } = req;

        const transacao = await poolQuery('select usuario_id from transacoes where id = $1', [id]);
        if (!transacao || transacao.rowCount < 1) {
            return res.status(400).json({ mensagem: ERRO_TRANSACAO_NAO_ENCONTRADA });
        }
        if (transacao.rows[0].usuario_id !== usuario.id) {
            return res.status(401).json({ mensagem: ERRO_OPERACAO_NAO_AUTORIZADA });
        }

        const deletar = await poolQuery('delete from transacoes where id = $1', [id]);
        if (!deletar) {
            return res.status(500).json({ mensagem: ERRO_SERVIDOR });
        }

        return res.status(204).json();

    } catch (error) {
        console.log(error);
        return res.status(500).json({ mensagem: ERRO_SERVIDOR });
    }
};

const mostrarExtrato = async (req, res) => {
    try {
        const { id } = req.usuario;

        const entrada = await poolQuery("select sum(valor) from transacoes where tipo = 'entrada' and usuario_id = $1", [id]);
        const saida = await poolQuery("select sum(valor) from transacoes where tipo = 'saida' and usuario_id = $1", [id]);
        if (!entrada || !saida) {
            return res.status(500).json({ mensagem: ERRO_SERVIDOR });
        }
        if (!entrada.rows[0].sum && !saida.rows[0].sum) {
            return res.status(404).json({ mensagem: ERRO_NENHUMA_TRANSACAO_CADASTRADA });
        }

        const resposta = {
            entrada: entrada.rows[0].sum,
            saida: saida.rows[0].sum
        };
        return res.status(200).json(resposta);

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ mensagem: ERRO_SERVIDOR });
    }
};

module.exports = {
    listarTransacoes,
    listarTransacaoPorId,
    cadastrarTransacao,
    deletarTransacao,
    atualizaTransacao,
    mostrarExtrato
};