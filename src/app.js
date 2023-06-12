import express from 'express'
import { pool } from './db.js'
import { PORT } from './config.js'

const app = express()

app.use(express.json());


app.get('/Productos', async (req, res) => {
  const [rows] = await pool.query(`Select P.CodigoProducto, P.Nombre, (case when P.IVA='A' then round(PP.PrecioMoneda*1.16,2) else PP.PrecioMoneda end) as PrecioMoneda, P.existencia from Productos P left join ProductosPrecios PP on P.CodigoProducto=PP.CodigoProducto where Existencia>0 Order by Nombre`)
  res.json(rows)
})

app.get('/Clientes', async (req, res) => {
  const [rows] = await pool.query('SELECT CodigoCliente, Nombre, SaldoMonedaTotal, (case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end) as SaldoMonedaVencido, date(ultimopago) as ultimopago FROM Clientes Order by SaldoMonedaTotal desc')
  res.json(rows)
})

app.get('/Facturas', async (req, res) => {
  const [rows] = await pool.query('SELECT CodigoCliente, Numero, date(FechaEmision) as FechaEmision, TotalFactura2, Vendedor FROM Facturas WHERE TotalFactura>0 ORDER BY FechaEmision DESC')
  res.json(rows)
})

app.get('/Pedidos', async (req, res) => {
  const [rows] = await pool.query('SELECT CodigoCliente, Numero, date(FechaEmision) as FechaEmision, TotalPedido2, Vendedor FROM Pedidos WHERE TotalPedido>0 ORDER BY FechaEmision DESC')
  res.json(rows)
})


app.post('/Pedidos', async (req, res) => {
  try {
    const pedido = req.body; // Obtén los datos del pedido enviados en la solicitud POST
    
    // Realiza la lógica necesaria para insertar el nuevo pedido en la base de datos utilizando los datos proporcionados en 'pedido'
    const insertQuery = `INSERT INTO Pedidos (Numero, FechaEmision, FechaEntrega, CodigoCliente, TotalBruto, Descuento, Impuesto, Cargo, TotalPedido, PorcentajeDescuento, Vendedor, Comentarios, Tarifa, Almacen, Peso, Estatus, Usuario, Cambio, Moneda, TotalBruto2, Descuento2, Impuesto2, Cargo2, TotalPedido2, Idmoneda) SELECT ?, ?, ?, ?, round(pp.PrecioMoneda*27.02,2)*?, 0, (round(pp.PrecioMoneda*27.02,2)*?)*0.16, 0, (round(pp.PrecioMoneda*27.02,2)*?)*1.16, 0, '012', 'Enviado desde la APP', 'A', '02', round(p.Peso*?,2), 'PE', 'APP', 27.02, 'BsS', pp.PrecioMoneda*?, 0, pp.PrecioMoneda*?*0.16, 0, pp.PrecioMoneda*?*1.16, 2 FROM Productos p left join ProductosPrecios pp on p.CodigoProducto=pp.CodigoProducto where p.CodigoProducto='ZAT01000' and pp.Tarifa='A'`;
    const values = [pedido.Numero, pedido.FechaEmision, pedido.FechaEmision, pedido.CodigoCliente, pedido.Cantidad];
    await pool.query(insertQuery, values);
    
    // Envía una respuesta indicando que el pedido se ha creado correctamente
    res.status(200).json({ message: 'Pedido creado exitosamente' });
  } catch (error) {
    // Si ocurre un error durante el proceso de creación del pedido, envía una respuesta de error
    console.error('Error al crear el pedido:', error);
    res.status(500).json({ error: 'Error al crear el pedido' });
  }
});


app.get('/ping', async (req, res) => {
  const [result] = await pool.query(`SELECT "hello world" as RESULT`);
  res.json(result[0])
})

app.get('/create', async (req, res) => {
  const result = await pool.query('INSERT INTO Pedidos VALUES ("PE000002", "2023-03-26 14:35:41", "2023-03-26 14:35:41", "V-26036875", 250.00, 0.00, 40.00, 0.00, 290.00, 0.00, "001", "BLA BLA BLA", "A", "01", NULL, "PE", "LUIS", 25.00, "$", 10.00, 0.00, 1.60, 0.00, 11.60, 2, NULL)')
  res.json(result)
})

app.listen(PORT)
console.log('Server on port', PORT)
