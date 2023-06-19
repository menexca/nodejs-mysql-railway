import express from 'express'
import { pool } from './db.js'
import { PORT } from './config.js'

const app = express()

app.use(express.json());


app.get('/Productos', async (req, res) => {
  const [rows] = await pool.query(`Select P.CodigoProducto, P.Nombre, P.IVA, P.CantidadxBulto, P.Existencia, P.PedidoVenta, PP.PrecioMoneda from Productos P left join ProductosPrecios PP on P.CodigoProducto=PP.CodigoProducto where Existencia>0 and Visible=1 Order by Nombre`)
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


app.post('/PedidosRenglones', async (req, res) => {
  try {
    const pedidoRenglon = req.body; // Obtén los datos del pedido enviados en la solicitud POST

    const insertQueryRenglones = `INSERT INTO PedidosRenglones (Numero, Almacen, CodigoProducto, Descripcion, UnidadMedida, iva, PorcentajeIva, Bultos, Cantidad, Despacho, Precio, Descuento, TotalRenglon, Estatus, ItemPedido, EstatusDol, DespachoDol, Cambio, Moneda, CantidadxBulto, Tarifa, Precio2, TotalRenglon2) SELECT CONCAT('AS-', CAST((SELECT Numero FROM Contadores WHERE Documento = 'Pedido') AS CHAR)), LEFT(?,2), CodigoProducto, Nombre, UnidadMedida, IVA, case when IVA='A' then 16 else 0 end, 1, ?, 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 'PE', ?, 'PE', 0, (select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1), 'BsS', 1, LEFT(?,1), ?, ? FROM Productos WHERE CodigoProducto=?`;
    const valuesRenglones = [pedidoRenglon.almacen, pedidoRenglon.cantidad, pedidoRenglon.precioMoneda, pedidoRenglon.totalRenglon, pedidoRenglon.indice, pedidoRenglon.tarifa, pedidoRenglon.precioMoneda, pedidoRenglon.totalRenglon, pedidoRenglon.codigoProducto];
    await pool.query(insertQueryRenglones, valuesRenglones);

    
    // Envía una respuesta indicando que el pedido se ha creado correctamente
    res.status(200).json({ message: 'PedidoRenglon creado exitosamente' });
  } catch (error) {
    // Si ocurre un error durante el proceso de creación del pedido, envía una respuesta de error
    console.error('Error al crear el pedidoRenglon:', error);
    res.status(500).json({ error: 'Error al crear el pedido' });
  }
});

app.post('/Pedidos', async (req, res) => {
  try {
    const pedido = req.body; // Obtén los datos del pedido enviados en la solicitud POST
   
    // Realiza la lógica necesaria para insertar el nuevo pedido en la base de datos utilizando los datos proporcionados en 'pedido'
    const insertQuery = `INSERT INTO Pedidos (Numero, FechaEmision, FechaEntrega, CodigoCliente, TotalBruto, Descuento, Impuesto, Cargo, TotalPedido, PorcentajeDescuento, Vendedor, Comentarios, Tarifa, Almacen, Peso, Estatus, Usuario, Cambio, Moneda, TotalBruto2, Descuento2, Impuesto2, Cargo2, TotalPedido2, Idmoneda) SELECT CONCAT('AS-', CAST((SELECT Numero FROM Contadores WHERE Documento = 'Pedido') AS CHAR)), NOW(), NOW(), ?, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, ?, CONCAT('Enviado desde la APP: ', ?), 'A', '02', 0, 'PE', 'APP', (select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1), 'BsS', ?, 0, ?, 0, ?, 2`;
    const values = [pedido.codigoCliente, pedido.totalNeto, pedido.totalImpuesto, pedido.totalPedido, pedido.vendedor, pedido.comentario, pedido.totalNeto, pedido.totalImpuesto, pedido.totalPedido];
    await pool.query(insertQuery, values);
    
    // Envía una respuesta indicando que el pedido se ha creado correctamente
    res.status(200).json({ message: 'Pedido creado exitosamente' });
  } catch (error) {
    // Si ocurre un error durante el proceso de creación del pedido, envía una respuesta de error
    console.error('Error al crear el pedido:', error);
    res.status(500).json({ error: 'Error al crear el pedido' });
  }
});

app.get('/ContadorPedido', async (req, res) => {
  const [rows] = await pool.query(`UPDATE Contadores SET Numero=Numero+1 WHERE Documento = 'Pedido'`)
  res.json(rows)
})



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
