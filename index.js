const express = require('express');
const mysql = require('mysql2/promise');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const app = express();
app.disable("x-powered-by");

app.use(express.json());
const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'crudapi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Configuração do Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de CRUD de usuários',
      version: '1.0.0',
      description: 'API para criar, ler, atualizar e deletar usuários'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local'
      }
    ]
  },
  apis: ['index.js']
};

const swaggerSpec = swaggerJSDoc(options);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retorna todos os usuários
 *     responses:
 *       '200':
 *         description: OK
 *   post:
 *     summary: Cria um novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               NOME:
 *                 type: string
 *                 description: Nome do usuário
 *               IDADE:
 *                 type: integer
 *                 description: Idade do usuário
 *             example:
 *               NOME: João da Silva
 *               IDADE: 30
 *     responses:
 *       '200':
 *         description: OK
 *
 * /users/{id}:
 *   put:
 *     summary: Atualiza um usuário existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           description: ID do usuário a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               NOME:
 *                 type: string
 *                 description: Novo nome do usuário
 *               IDADE:
 *                 type: integer
 *                 description: Nova idade do usuário
 *             example:
 *               NOME: José da Silva
 *               IDADE: 35
 *     responses:
 *       '204':
 *         description: No Content
 *   delete:
 *     summary: Deleta um usuário existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           description: ID do usuário a ser deletado
 *     responses:
 *       '204':
 *         description: No Content
 */

//exemplo: /users?nome=João 

app.get('/users', async (req, res) => {
  try {
    const { nome } = req.query;
    let query = 'SELECT * FROM usuario';
    let params = [];
    
    if (nome) {
      query += ' WHERE NOME LIKE ?';
      params.push(`%${nome}%`);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao recuperar usuários:", error);
    res.status(500).send("Erro ao recuperar usuários");
  }
});

app.post('/users', async (req, res) => {
  try {
    const { NOME, IDADE } = req.body;
    const [result] = await pool.query('INSERT INTO usuario (NOME, IDADE) VALUES (?, ?)', [NOME, IDADE]);
    res.json({ id: result.insertId, NOME:NOME, IDADE:IDADE});
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).send("Erro ao criar usuário");
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const { NOME, IDADE } = req.body;
    const { id } = req.params;
    await pool.query('UPDATE usuario SET NOME = ?, IDADE = ? WHERE id = ?', [NOME, IDADE, id]);
    res.status(200).json({ id: id, NOME: NOME, IDADE: IDADE });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).send("Erro ao atualizar usuário");
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM usuario WHERE id = ?', [id]);
    res.status(200).json({ id: Number(id) });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).send("Erro ao deletar usuário");
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM usuario WHERE id = ?', [id]);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).send("Erro ao buscar usuário");
  }
});





const server = app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});

// Mantém o servidor rodando mesmo se ocorrer um erro
process.on('uncaughtException', (err) => {
  console.error('Erro não tratado:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Rejeição não tratada:', err);
});
