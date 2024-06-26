import express from 'express'
import { pool } from './db.js'
import { PORT } from './config.js'
import multer from 'multer';
import { bucket } from './firebaseConfig.js'; // Asegúrate de importar bucket desde donde lo hayas definido

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // por ejemplo, limitamos el tamaño del archivo a 5MB
  },
});

const app = express()

app.use(express.json());

// Nuevo endpoint para cargar imágenes
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  const fileName = `${Date.now()}-${req.file.originalname}`;
  const fileUpload = bucket.file(fileName);

  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  blobStream.on('error', (error) => {
    console.log(error);
    res.status(500).send({ message: "Error al subir el archivo", error: error.message });
  });

  blobStream.on('finish', () => {
    // El archivo se ha subido exitosamente
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
    res.status(200).send({ url: publicUrl });
  });

  blobStream.end(req.file.buffer);
});

app.get('/Productos', async (req, res) => {
  const [rows] = await pool.query(`Select P.CodigoProducto, P.Nombre, CONCAT(CAST((P.CodigoProducto) AS CHAR),' ',P.Nombre) as NombreBusqueda, P.IVA, P.CantidadxBulto, P.Existencia, IFNULL(P.Existencia02,0) as Existencia02, IFNULL(P.Existencia03,0) as Existencia03, (IFNULL(P.Existencia02,0) + IFNULL(P.Existencia03,0)) as ExistenciaVenta , (case when P.PedidoVenta is null then 0 else P.PedidoVenta end) as PedidoVenta, IFNULL((SELECT PP.PrecioMoneda FROM ProductosPrecios PP WHERE PP.CodigoProducto=P.CodigoProducto AND PP.Tarifa='A'),0) as PrecioMoneda, IFNULL((SELECT PP.PrecioMoneda FROM ProductosPrecios PP WHERE PP.CodigoProducto=P.CodigoProducto AND PP.Tarifa='B'),0) as PrecioMonedaB, P.CodigoGrupo, P.Marca from Productos P where Visible=1 Order by P.CodigoGrupo, P.Marca, P.Nombre`)
  res.json(rows)
})

//Productos iltrados por FechSync
app.get('/Productos/:FechaSync', async (req, res) => {
  const fechaSync = req.params.FechaSync;
  const query = `Select P.CodigoProducto, P.Nombre, CONCAT(CAST((P.CodigoProducto) AS CHAR),' ',P.Nombre) as NombreBusqueda, P.IVA, P.CantidadxBulto, P.Existencia, IFNULL(P.Existencia02,0) as Existencia02, IFNULL(P.Existencia03,0) as Existencia03, (IFNULL(P.Existencia02,0) + IFNULL(P.Existencia03,0)) as ExistenciaVenta , (case when P.PedidoVenta is null then 0 else P.PedidoVenta end) as PedidoVenta, IFNULL((SELECT PP.PrecioMoneda FROM ProductosPrecios PP WHERE PP.CodigoProducto=P.CodigoProducto AND PP.Tarifa='A'),0) as PrecioMoneda, IFNULL((SELECT PP.PrecioMoneda FROM ProductosPrecios PP WHERE PP.CodigoProducto=P.CodigoProducto AND PP.Tarifa='B'),0) as PrecioMonedaB, P.CodigoGrupo, P.Marca from Productos P where Visible=1 and FechaSync >= ? Order by P.CodigoGrupo, P.Marca, P.Nombre`;
  
  
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
  const [rows] = await pool.query(`SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, IFNULL(SaldoMonedaTotal,0) AS SaldoMonedaTotal, IFNULL((case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end),0) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer FROM Clientes WHERE Estatus<>'S' Order by SaldoMonedaTotal desc`)
  res.json(rows)
})

// Filtrar clientes por vendedor
app.get('/Clientes/:Vendedor', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const query = `SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, IFNULL(SaldoMonedaTotal,0) AS SaldoMonedaTotal, IFNULL((case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end),0) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer FROM Clientes WHERE Estatus<>'S' and Vendedor = ? Order by SaldoMonedaTotal desc`;
  
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

// Filtrar clientes por FechaSync
app.get('/Clientes/:FechaSync', async (req, res) => {
  const fechaSync = req.params.FechaSync;
  const query = `SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, SaldoMonedaTotal, (case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer FROM Clientes WHERE Estatus<>'S' and FechaSync >= ? Order by SaldoMonedaTotal desc`;
  
  try {
    const [rows] = await pool.query(query, [vendedor, fechaSync]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar clientes especifico
app.get('/ClientesEspecifico/:CodigoCliente', async (req, res) => {
  const codigoCliente = req.params.CodigoCliente;
  const query = `SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, SaldoMonedaTotal, (case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer, Estatus FROM Clientes WHERE CodigoCliente = ?`;
  
  try {
    const [rows] = await pool.query(query, [codigoCliente]);
    res.status(200).json(rows);
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
  const [rows] = await pool.query(`SELECT P.Numero, P.FechaEmision, C.Nombre, CONCAT(CAST((P.Numero) AS CHAR),' ',C.Nombre) as NombreBusqueda, P.Vendedor, V.nombre as NombreVendedor, P.TotalBruto2, P.Impuesto2, P.TotalPedido2, P.Estatus, 0 AS Items, 0 as Bultos, P.CodigoCliente FROM Pedidos P LEFT JOIN Clientes C ON P.CodigoCliente=C.CodigoCliente LEFT JOIN Vendedores V ON P.Vendedor=V.codigo WHERE TotalPedido>0 ORDER BY FechaEmision DESC limit 300`)
  res.json(rows)
})

// Filtrar pedidos por vendedor
app.get('/Pedidos/:Vendedor', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const query = `SELECT P.Numero, P.FechaEmision, C.Nombre, CONCAT(CAST((P.Numero) AS CHAR),' ',C.Nombre) as NombreBusqueda, P.Vendedor, V.nombre as NombreVendedor, P.TotalBruto2, P.Impuesto2, P.TotalPedido2, P.Estatus, (SELECT count(CodigoProducto) FROM PedidosRenglones PR WHERE PR.Numero=P.Numero) AS Items, (SELECT SUM(ROUND(PR.Cantidad/P.CantidadxBulto,2)) FROM PedidosRenglones PR LEFT JOIN Productos P ON P.CodigoProducto=PR.CodigoProducto WHERE PR.Numero=P.Numero) as Bultos, P.CodigoCliente FROM Pedidos P LEFT JOIN Clientes C ON P.CodigoCliente=C.CodigoCliente LEFT JOIN Vendedores V ON P.Vendedor=V.codigo WHERE TotalPedido>0 and P.Vendedor = ? ORDER BY FechaEmision DESC`;
  
  try {
    const [rows] = await pool.query(query, [vendedor]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

app.get('/PedidosFecha/:Fecha', async (req, res) => {
  const fecha = req.params.Fecha;
  const query = `SELECT P.Numero, P.FechaEmision, C.Nombre, CONCAT(CAST((P.Numero) AS CHAR),' ',C.Nombre) as NombreBusqueda, P.Vendedor, V.nombre as NombreVendedor, P.TotalBruto2, P.Impuesto2, P.TotalPedido2, P.Estatus, (SELECT count(CodigoProducto) FROM PedidosRenglones PR WHERE PR.Numero=P.Numero) AS Items, (SELECT SUM(ROUND(PR.Cantidad/P.CantidadxBulto,2)) FROM PedidosRenglones PR LEFT JOIN Productos P ON P.CodigoProducto=PR.CodigoProducto WHERE PR.Numero=P.Numero) as Bultos, P.CodigoCliente FROM Pedidos P LEFT JOIN Clientes C ON P.CodigoCliente=C.CodigoCliente LEFT JOIN Vendedores V ON P.Vendedor=V.codigo WHERE TotalPedido>0 and FechaEmision >= ? ORDER BY FechaEmision DESC`;
  
  try {
    const [rows] = await pool.query(query, [fecha]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar pedidos por vendedor
app.get('/PedidosVendedorFecha/:Vendedor/:Fecha', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const fecha = req.params.Fecha;
  const query = `SELECT P.Numero, P.FechaEmision, C.Nombre, CONCAT(CAST((P.Numero) AS CHAR),' ',C.Nombre) as NombreBusqueda, P.Vendedor, V.nombre as NombreVendedor, P.TotalBruto2, P.Impuesto2, P.TotalPedido2, P.Estatus, (SELECT count(CodigoProducto) FROM PedidosRenglones PR WHERE PR.Numero=P.Numero) AS Items, (SELECT SUM(ROUND(PR.Cantidad/P.CantidadxBulto,2)) FROM PedidosRenglones PR LEFT JOIN Productos P ON P.CodigoProducto=PR.CodigoProducto WHERE PR.Numero=P.Numero) as Bultos, P.CodigoCliente FROM Pedidos P LEFT JOIN Clientes C ON P.CodigoCliente=C.CodigoCliente LEFT JOIN Vendedores V ON P.Vendedor=V.codigo WHERE TotalPedido>0 and P.Vendedor = ? and FechaEmision >= ? ORDER BY FechaEmision DESC`;
  
  try {
    const [rows] = await pool.query(query, [vendedor, fecha]);
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

app.post('/CrearPedido', async (req, res) => {
  try {
    const pedidoCompleto = req.body; // Obtén los datos completos del pedido enviados en la solicitud POST

    const selectContadorQuery = `
      SELECT CONCAT('AS-', LPAD(RIGHT(LEFT(Numero,8),5)+1, 5, '0')) as Contador
      FROM Pedidos
      ORDER BY Numero DESC
      LIMIT 1
    `;
    const [contadorResult] = await pool.query(selectContadorQuery);
    const nuevoContador = contadorResult[0].Contador;


    // Lógica para insertar el pedido en Pedidos
    const insertQueryPedido = `INSERT INTO Pedidos (Numero, FechaEmision, FechaEntrega, CodigoCliente, TotalBruto, Descuento, Impuesto, Cargo, TotalPedido, PorcentajeDescuento, Vendedor, Comentarios, Tarifa, Almacen, Peso, Estatus, Usuario, Cambio, Moneda, TotalBruto2, Descuento2, Impuesto2, Cargo2, TotalPedido2, Idmoneda) VALUES (?, DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 4 HOUR), ?, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2)+round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, ?, CONCAT('APP: ', ?), 'A', '02', 0, 'PE', 'APP', (select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1), 'BsS', ?, 0, ?, 0, ?, 2)`;
    const valuesPedido = [nuevoContador, pedidoCompleto.codigoCliente, pedidoCompleto.totalNeto, pedidoCompleto.totalImpuesto, pedidoCompleto.totalNeto, pedidoCompleto.totalImpuesto, pedidoCompleto.vendedor, pedidoCompleto.comentario, pedidoCompleto.totalNeto, pedidoCompleto.totalImpuesto, pedidoCompleto.totalPedido];
    const [pedidoResult] = await pool.query(insertQueryPedido, valuesPedido);

    // const pedidoId = pedidoResult.insertId; // Obtén el ID del pedido recién insertado

    // Lógica para insertar los renglones del pedido en PedidosRenglones
    const renglones = pedidoCompleto.renglones;
    const insertQueryRenglones = `INSERT INTO PedidosRenglones (Numero, Almacen, CodigoProducto, Descripcion, UnidadMedida, iva, PorcentajeIva, Bultos, Cantidad, Despacho, Precio, Descuento, TotalRenglon, Estatus, ItemPedido, EstatusDol, DespachoDol, Cambio, Moneda, CantidadxBulto, Tarifa, Precio2, TotalRenglon2) SELECT ?, LEFT(?,2), CodigoProducto, Nombre, UnidadMedida, IVA, case when IVA='A' then 16 else 0 end, 1, ?, 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), ?, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 'PE', ?, 'PE', 0, (select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1), 'BsS', 1, LEFT(?,1), ?, ? FROM Productos WHERE CodigoProducto=?`;
    
    for (const renglon of renglones) {
      const valuesRenglones = [nuevoContador, renglon.almacen, renglon.cantidad, renglon.precioMoneda, renglon.descuento, renglon.totalRenglon, renglon.indice, renglon.tarifa, renglon.precioMoneda, renglon.totalRenglon, renglon.codigoProducto];
      await pool.query(insertQueryRenglones, valuesRenglones);
    }

    // Envía una respuesta indicando que el pedido y los renglones se han creado correctamente
    res.status(200).json({ message: 'Pedido Completo creado exitosamente', nuevoContador: nuevoContador });
  } catch (error) {
    // Si ocurre un error durante el proceso de creación, envía una respuesta de error
    console.error('Error al crear el pedido y los renglones:', error);
    res.status(500).json({ error: 'Error al crear el pedido Completo' });
  }
});

/*
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
*/
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

app.get('/Online', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT cambio FROM MonedasCambio WHERE idmoneda=2 ORDER BY fecha desc LIMIT 1`)

    res.status(200).json({ error: 'Servidor en linea' });
  } catch (error) {
    // Si ocurre un error durante el proceso de creación del pedido, envía una respuesta de error
    res.status(500).json({ error: 'Servidor fuera de linea' });
  }
})

app.get('/Vendedores', async (req, res) => {
  const [rows] = await pool.query(`SELECT codigo, nombre, Zona, Almacen, RTRIM(rif) as rif, RTRIM(nit) as nit, CAST(CantidadClientes AS SIGNED) AS CantidadClientes, CAST(CantidadClientesNuevosMes AS SIGNED) AS CantidadClientesNuevosMes, CAST(CantidadPedidosHoy AS SIGNED) AS CantidadPedidosHoy, CAST(CantidadPedidosMes AS SIGNED) AS CantidadPedidosMes, CAST(CantidadClientesAtendidosHoy AS SIGNED) AS CantidadClientesAtendidosHoy, CAST(CantidadClientesAtendidosMes AS SIGNED) AS CantidadClientesAtendidosMes, meta, PorcentajeEfectividad, TotalVentaBruta2, TotalDevolucionBruta2, TotalFacturacionBruta2, PorcentajeAlcanzadoMeta, DiasHabilesMes, DiasHabilesTranscurridos, DiasHabilesRestantes, PromedioVentaDiaria, DiferenciaMeta, ObjetivoDiario, Saldo, Vencido, PorcentajeSaldoVencido, PorcentajeVentaVencido FROM ViewVendedoresIndicadores v WHERE meta>0 ORDER BY nombre`)
  res.status(200).json(rows)
})


//Vendedores filtrados por FechSync
app.get('/Vendedores/:FechaSync', async (req, res) => {
  const fechaSync = req.params.FechaSync;
  console.log('FechaSync:', fechaSync);  // Agrega esta línea para depuración
  const query = `SELECT codigo, nombre, Zona, Almacen, RTRIM(rif) as rif, RTRIM(nit) as nit, CAST(CantidadClientes AS SIGNED) AS CantidadClientes, CAST(CantidadClientesNuevosMes AS SIGNED) AS CantidadClientesNuevosMes, CAST(CantidadPedidosHoy AS SIGNED) AS CantidadPedidosHoy, CAST(CantidadPedidosMes AS SIGNED) AS CantidadPedidosMes, CAST(CantidadClientesAtendidosHoy AS SIGNED) AS CantidadClientesAtendidosHoy, CAST(CantidadClientesAtendidosMes AS SIGNED) AS CantidadClientesAtendidosMes, meta, PorcentajeEfectividad, TotalVentaBruta2, TotalDevolucionBruta2, TotalFacturacionBruta2, PorcentajeAlcanzadoMeta, DiasHabilesMes, DiasHabilesTranscurridos, DiasHabilesRestantes, PromedioVentaDiaria, DiferenciaMeta, ObjetivoDiario, Saldo, Vencido, PorcentajeSaldoVencido, PorcentajeVentaVencido FROM ViewVendedoresIndicadores v WHERE meta>0 and FechaSync >= ? ORDER BY nombre`;
  
  try {
    console.log('Query:', query);  // Agrega esta línea para depuración
    const [rows] = await pool.query(query, [fechaSync]);
    console.log('Rows:', rows);  // Agrega esta línea para depuración
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

app.get('/VendedoresDisponibles', async (req, res) => {
  const [rows] = await pool.query(`SELECT codigo, nombre, Zona, IFNULL(Almacen,'') AS Almacen, RTRIM(rif) as rif, RTRIM(nit) as nit FROM Vendedores V WHERE NOT EXISTS (SELECT * FROM Usuarios U WHERE U.CodigoVendedor=V.codigo) ORDER BY nombre`)
  res.status(200).json(rows)
})

app.get('/Usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT Usuario, Contrasena, NombreCompleto, CorreoElectronico, FechaRegistro, IFNULL(UltimoInicioSesion,'2000-01-01 00:00:00') as UltimoInicioSesion, Rol, Estatus, CodigoVendedor, IFNULL(FechaNacimiento,'2000-01-01 00:00:00') as FechaNacimiento, Direccion, NumeroTelefono, Cedula, IFNULL(Almacen,'') AS Almacen FROM Usuarios`);

    // Envía una respuesta indicando que la consulta se ha realizado correctamente
    res.status(200).json(rows);
  } catch (error) {
    // Si ocurre un error durante la consulta, envía una respuesta de error
    console.error('Error al obtener los usuarios', error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

//agregar usuario nuevo
app.post('/Usuarios', async (req, res) => {
  const newUserData = req.body; // Datos del nuevo usuario en el cuerpo de la solicitud

  const insertQuery = `
    INSERT INTO Usuarios (Usuario, Contrasena, NombreCompleto, CorreoElectronico, FechaRegistro, Rol, Estatus, CodigoVendedor, Direccion, NumeroTelefono, Cedula, Almacen) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 4 HOUR), ?, 1, ?, ?, ?, ?, ?)`;

  const insertValues = [
    newUserData.usuario, newUserData.contrasena, newUserData.nombreCompleto, newUserData.correoElectronico, newUserData.rol, newUserData.codigoVendedor, newUserData.direccion, newUserData.numeroTelefono, newUserData.cedula, newUserData.almacen
  ];

  try {
    await pool.query(insertQuery, insertValues);
    res.status(200).json({ message: 'Usuario agregado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar el usuario' });
  }
});


// Filtrar usuarios por usuario
app.get('/Usuarios/:Usuario', async (req, res) => {
  try {
    const usuario = req.params.Usuario;
    const query = `SELECT Usuario, Contrasena, NombreCompleto, CorreoElectronico, FechaRegistro, IFNULL(UltimoInicioSesion,'2000-01-01 00:00:00') as UltimoInicioSesion, Rol, Estatus, CodigoVendedor, IFNULL(FechaNacimiento,'2000-01-01 00:00:00') as FechaNacimiento, Direccion, NumeroTelefono, Cedula, IFNULL(Almacen,'') AS Almacen FROM Usuarios where Usuario = ?`;
  
    const [rows] = await pool.query(query, [usuario]);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Actualizar usuario por usuario OOO
app.put('/Usuarios/:Usuario', async (req, res) => {
  const usuario = req.params.Usuario;
  const updatedUserData = req.body; // Datos actualizados del usuario en el cuerpo de la solicitud

  const updateQuery = `
    UPDATE Usuarios SET Contrasena = ?, NombreCompleto = ?, CorreoElectronico = ?, Rol = ?, Estatus = ?, CodigoVendedor = ?, FechaNacimiento = ?, Direccion = ?, NumeroTelefono = ?, Cedula = ?, Almacen = ? WHERE Usuario = ?`;
  
  const updateValues = [
    updatedUserData.contrasena, updatedUserData.nombreCompleto, updatedUserData.correoElectronico, updatedUserData.rol, updatedUserData.estatus, updatedUserData.codigoVendedor, updatedUserData.fechaNacimiento, updatedUserData.direccion, updatedUserData.numeroTelefono, updatedUserData.cedula, updatedUserData.almacen, usuario
  ];
 
  try {
    const [result] = await pool.query(updateQuery, updateValues);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Registro actualizado correctamente' });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la actualización' });
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
