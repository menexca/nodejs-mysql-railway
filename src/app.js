import express from 'express'
import { pool } from './db.js'
import { PORT } from './config.js'

const app = express()

app.use(express.json());


app.get('/Productos', async (req, res) => {
  const [rows] = await pool.query(`Select P.CodigoProducto, P.Nombre, CONCAT(CAST((P.CodigoProducto) AS CHAR),' ',P.Nombre) as NombreBusqueda, P.IVA, P.CantidadxBulto, P.Existencia, IFNULL(P.Existencia02,0) as Existencia02, IFNULL(P.Existencia03,0) as Existencia03, (IFNULL(P.Existencia02,0) + IFNULL(P.Existencia03,0)) as ExistenciaVenta , (case when P.PedidoVenta is null then 0 else P.PedidoVenta end) as PedidoVenta, (case when PP.PrecioMoneda is null then 0 else PP.PrecioMoneda end) as PrecioMoneda, P.CodigoGrupo, P.Marca from Productos P left join ProductosPrecios PP on P.CodigoProducto=PP.CodigoProducto where Visible=1 Order by P.CodigoGrupo, P.Marca, P.Nombre`)
  res.json(rows)
})

//Productos iltrados por FechSync
app.get('/Productos/:FechaSync', async (req, res) => {
  const fechaSync = req.params.FechaSync;
  const query = `Select P.CodigoProducto, P.Nombre, CONCAT(CAST((P.CodigoProducto) AS CHAR),' ',P.Nombre) as NombreBusqueda, P.IVA, P.CantidadxBulto, P.Existencia, IFNULL(P.Existencia02,0) as Existencia02, IFNULL(P.Existencia03,0) as Existencia03, (IFNULL(P.Existencia02,0) + IFNULL(P.Existencia03,0)) as ExistenciaVenta , (case when P.PedidoVenta is null then 0 else P.PedidoVenta end) as PedidoVenta, (case when PP.PrecioMoneda is null then 0 else PP.PrecioMoneda end) as PrecioMoneda, P.CodigoGrupo, P.Marca from Productos P left join ProductosPrecios PP on P.CodigoProducto=PP.CodigoProducto where Visible=1 and FechaSync >= ? Order by P.CodigoGrupo, P.Marca, P.Nombre`;
  
  try {
    const [rows] = await pool.query(query, [fechaSync]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Obtener todos los clientes
app.get('/Clientes', async (req, res) => {
  const [rows] = await pool.query(`SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, SaldoMonedaTotal, (case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer FROM Clientes WHERE Estatus<>'S' Order by SaldoMonedaTotal desc`)
  res.json(rows)
})

// Filtrar clientes por vendedor
app.get('/Clientes/:Vendedor', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const query = `SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, SaldoMonedaTotal, (case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer FROM Clientes WHERE Estatus<>'S' and Vendedor = ? Order by SaldoMonedaTotal desc`;
  
  try {
    const [rows] = await pool.query(query, [vendedor]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar clientes por vendedor y FechaSync
app.get('/Clientes/:Vendedor/:FechaSync', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const fechaSync = req.params.FechaSync;
  const query = `SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, SaldoMonedaTotal, (case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer FROM Clientes WHERE Estatus<>'S' and Vendedor = ? and FechaSync >= ? Order by SaldoMonedaTotal desc`;
  
  try {
    const [rows] = await pool.query(query, [vendedor, fechaSync]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

app.get('/Facturas', async (req, res) => {
  const [rows] = await pool.query('SELECT CodigoCliente, Numero, date(FechaEmision) as FechaEmision, TotalFactura2, Vendedor FROM Facturas WHERE TotalFactura>0 ORDER BY FechaEmision DESC')
  res.json(rows)
})

app.get('/Pedidos', async (req, res) => {
  const [rows] = await pool.query(`SELECT P.Numero, P.FechaEmision, C.Nombre, CONCAT(CAST((P.Numero) AS CHAR),' ',C.Nombre) as NombreBusqueda, P.Vendedor, V.nombre as NombreVendedor, P.TotalBruto2, P.Impuesto2, P.TotalPedido2, P.Estatus, (SELECT count(CodigoProducto) FROM PedidosRenglones PR WHERE PR.Numero=P.Numero) AS Items, (SELECT SUM(ROUND(PR.Cantidad/P.CantidadxBulto,2)) FROM PedidosRenglones PR LEFT JOIN Productos P ON P.CodigoProducto=PR.CodigoProducto WHERE PR.Numero=P.Numero) as Bultos FROM Pedidos P LEFT JOIN Clientes C ON P.CodigoCliente=C.CodigoCliente LEFT JOIN Vendedores V ON P.Vendedor=V.codigo WHERE TotalPedido>0 ORDER BY FechaEmision DESC`)
  res.json(rows)
})

// Filtrar pedidos por vendedor
app.get('/Pedidos/:Vendedor', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const query = `SELECT P.Numero, P.FechaEmision, C.Nombre, CONCAT(CAST((P.Numero) AS CHAR),' ',C.Nombre) as NombreBusqueda, P.Vendedor, V.nombre as NombreVendedor, P.TotalBruto2, P.Impuesto2, P.TotalPedido2, P.Estatus, (SELECT count(CodigoProducto) FROM PedidosRenglones PR WHERE PR.Numero=P.Numero) AS Items, (SELECT SUM(ROUND(PR.Cantidad/P.CantidadxBulto,2)) FROM PedidosRenglones PR LEFT JOIN Productos P ON P.CodigoProducto=PR.CodigoProducto WHERE PR.Numero=P.Numero) as Bultos FROM Pedidos P LEFT JOIN Clientes C ON P.CodigoCliente=C.CodigoCliente LEFT JOIN Vendedores V ON P.Vendedor=V.codigo WHERE TotalPedido>0 and P.Vendedor = ? ORDER BY FechaEmision DESC`;
  
  try {
    const [rows] = await pool.query(query, [vendedor]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar pedidosrenglon por numeropedido
app.get('/PedidosRenglones/:Numero', async (req, res) => {
  const numero = req.params.Numero;
  const query = `SELECT Numero, Almacen, CodigoProducto, Descripcion, iva, PorcentajeIva, Cantidad, Despacho, Precio2, TotalRenglon2 FROM PedidosRenglones where Numero = ? ORDER BY ItemPedido DESC`;
  
  try {
    const [rows] = await pool.query(query, [numero]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})


app.post('/PedidosRenglones', async (req, res) => {
  try {
    const pedidoRenglon = req.body; // Obtén los datos del pedido enviados en la solicitud POST

    const insertQueryRenglones = `INSERT INTO PedidosRenglones (Numero, Almacen, CodigoProducto, Descripcion, UnidadMedida, iva, PorcentajeIva, Bultos, Cantidad, Despacho, Precio, Descuento, TotalRenglon, Estatus, ItemPedido, EstatusDol, DespachoDol, Cambio, Moneda, CantidadxBulto, Tarifa, Precio2, TotalRenglon2) SELECT ?, LEFT(?,2), CodigoProducto, Nombre, UnidadMedida, IVA, case when IVA='A' then 16 else 0 end, 1, ?, 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 'PE', ?, 'PE', 0, (select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1), 'BsS', 1, LEFT(?,1), ?, ? FROM Productos WHERE CodigoProducto=?`;
    const valuesRenglones = [pedidoRenglon.numero, pedidoRenglon.almacen, pedidoRenglon.cantidad, pedidoRenglon.precioMoneda, pedidoRenglon.totalRenglon, pedidoRenglon.indice, pedidoRenglon.tarifa, pedidoRenglon.precioMoneda, pedidoRenglon.totalRenglon, pedidoRenglon.codigoProducto];
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
    const insertQuery = `INSERT INTO Pedidos (Numero, FechaEmision, FechaEntrega, CodigoCliente, TotalBruto, Descuento, Impuesto, Cargo, TotalPedido, PorcentajeDescuento, Vendedor, Comentarios, Tarifa, Almacen, Peso, Estatus, Usuario, Cambio, Moneda, TotalBruto2, Descuento2, Impuesto2, Cargo2, TotalPedido2, Idmoneda) SELECT ?, DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 4 HOUR), ?, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2)+round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, ?, CONCAT('Enviado desde la APP: ', ?), 'A', '02', 0, 'PE', 'APP', (select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1), 'BsS', ?, 0, ?, 0, ?, 2`;
    const values = [pedido.numero, pedido.codigoCliente, pedido.totalNeto, pedido.totalImpuesto, pedido.totalNeto, pedido.totalImpuesto, pedido.vendedor, pedido.comentario, pedido.totalNeto, pedido.totalImpuesto, pedido.totalPedido];
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
  const [rows] = await pool.query(`UPDATE Contadores SET Numero=LPAD(Numero + 1, 5, '0') WHERE Documento = 'Pedido'`)
  res.json(rows)
})

app.get('/ContadorPedidoVer', async (req, res) => {
  const [rows] = await pool.query(`SELECT LPAD(Numero, 5, '0') as Numero FROM Contadores WHERE Documento = 'Pedido'`)
  res.json(rows)
})

app.get('/TasaCambio', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT cambio FROM MonedasCambio WHERE idmoneda=2 ORDER BY fecha desc LIMIT 1`)
    res.json(rows)

  } catch (error) {
    // Si ocurre un error durante el proceso de creación del pedido, envía una respuesta de error
    console.error('Error al capturar la Tasa de Cambio', error);
    res.status(500).json({ error: 'Error al capturar la Tasa de Cambio' });
  }
})

app.get('/Vendedores', async (req, res) => {
  const [rows] = await pool.query(`SELECT codigo, nombre, Zona, Almacen, RTRIM(rif) as rif, RTRIM(nit) as nit FROM Vendedores WHERE nit<>'' ORDER BY nombre`)
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
