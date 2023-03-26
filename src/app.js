import express from 'express'
import { pool } from './db.js'
import { PORT } from './config.js'

const app = express()

app.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM Pedidos')
  res.json(rows)
})

app.get('/ping', async (req, res) => {
  const [result] = await pool.query(`SELECT "hello world" as RESULT`);
  res.json(result[0])
})

app.get('/create', async (req, res) => {
  const result = await pool.query('INSERT INTO Pedidos VALUES ("PE000002", "2023-03-26 14:35:41", "2023-03-26 14:35:41", "V-26036875", 250.00, 0.00, 40.00, 0.00, 290.00, 0.00, "001", "BLA BLA BLA", "A", "01", NULL, "PE", "LUIS", 25.00, "$", 10.00, 0.00, 1.60, 0.00, 11.60, 2, 1)')
  res.json(result)
})

app.listen(PORT)
console.log('Server on port', PORT)
