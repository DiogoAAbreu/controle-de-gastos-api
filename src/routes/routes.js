const express = require('express');
const router = express.Router();

const { cadastrarUsuario, loginUsuario, detalhesUsuario, atualizarUsuario } = require('../controllers/users/usuario');
const { cadastrarTransacao, deletarTransacao, atualizaTransacao, listarTransacoes, listarTransacaoPorId, mostrarExtrato } = require('../controllers/transaction/transacoes')
const autenticacaoUsuario = require('../middlewares/autentication');
const { listarCategorias } = require('../controllers/categories/categorias');

router.post('/usuario', cadastrarUsuario);
router.post('/login', loginUsuario);

router.use(autenticacaoUsuario);
router.get('/usuario', detalhesUsuario);
router.get('/categoria', listarCategorias);
router.get('/transacao', listarTransacoes);
router.get('/transacao/extrato', mostrarExtrato);
router.get('/transacao/:id', listarTransacaoPorId);
router.put('/usuario', atualizarUsuario);
router.put('/transacao/:id', atualizaTransacao);
router.post('/transacao', cadastrarTransacao);
router.delete('/transacao/:id', deletarTransacao);



module.exports = router;