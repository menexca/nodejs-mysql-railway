import express from 'express'
import cors from 'cors'; // Importa el middleware cors
import { pool } from './db.js'
import { PORT } from './config.js'


const app = express()

// Habilita CORS para todos los orígenes
app.use(cors());

app.use(express.json());


app.get('/Productos', async (req, res) => {
  const [rows] = await pool.query(`
    Select 
      P.CodigoProducto, 
      P.Nombre, 
      CONCAT(CAST((P.CodigoProducto) AS CHAR),' ',P.Nombre) as NombreBusqueda, 
      P.IVA, 
      P.CantidadxBulto, 
      P.Existencia, 
      IFNULL(P.Existencia02,0) as Existencia02, 
      IFNULL(P.Existencia03,0) as Existencia03, 
      (IFNULL(P.Existencia02,0) + IFNULL(P.Existencia03,0)) as ExistenciaVenta , 
      (case when P.PedidoVenta is null then 0 else P.PedidoVenta end) as PedidoVenta, 
      IFNULL((SELECT PP.PrecioMoneda FROM ProductosPrecios PP WHERE PP.CodigoProducto=P.CodigoProducto AND PP.Tarifa='A'),0) as PrecioMoneda, 
      IFNULL((SELECT PP.PrecioMoneda FROM ProductosPrecios PP WHERE PP.CodigoProducto=P.CodigoProducto AND PP.Tarifa='B'),0) as PrecioMonedaB, 
      IFNULL((SELECT PP.PrecioMoneda FROM ProductosPrecios PP WHERE PP.CodigoProducto=P.CodigoProducto AND PP.Tarifa='C'),0) as PrecioMonedaC, 
      P.CodigoGrupo, 
      P.Marca, 
      P.FechaSync, 
      IFNULL(P.Profundidad,0) as Capacidad, 
      IFNULL(P.Alto,0) as GradosAlcohol, 
      IFNULL(PC.Nombre,'') as TipoAlcohol, 
      TieneImagen*1 as TieneImagen 
    from Productos P 
    LEFT JOIN ProductosColores PC ON P.CodigoColor=PC.codigo 
    where Visible=1 
    Order by P.CodigoGrupo, P.Marca, P.Nombre
  `)
  res.json(rows)
})

//Productos iltrados por FechSync
app.get('/Productos/:FechaSync', async (req, res) => {
  const fechaSync = req.params.FechaSync;
  const query = `Select P.CodigoProducto, P.Nombre, CONCAT(CAST((P.CodigoProducto) AS CHAR),' ',P.Nombre) as NombreBusqueda, P.IVA, P.CantidadxBulto, P.Existencia, IFNULL(P.Existencia02,0) as Existencia02, IFNULL(P.Existencia03,0) as Existencia03, (IFNULL(P.Existencia02,0) + IFNULL(P.Existencia03,0)) as ExistenciaVenta , (case when P.PedidoVenta is null then 0 else P.PedidoVenta end) as PedidoVenta, IFNULL((SELECT PP.PrecioMoneda FROM ProductosPrecios PP WHERE PP.CodigoProducto=P.CodigoProducto AND PP.Tarifa='A'),0) as PrecioMoneda, IFNULL((SELECT PP.PrecioMoneda FROM ProductosPrecios PP WHERE PP.CodigoProducto=P.CodigoProducto AND PP.Tarifa='B'),0) as PrecioMonedaB, IFNULL((SELECT PP.PrecioMoneda FROM ProductosPrecios PP WHERE PP.CodigoProducto=P.CodigoProducto AND PP.Tarifa='C'),0) as PrecioMonedaC, P.CodigoGrupo, P.Marca, P.FechaSync, IFNULL(P.Profundidad,0) as Capacidad, IFNULL(P.Alto,0) as GradosAlcohol, IFNULL(PC.Nombre,'') as TipoAlcohol, TieneImagen*1 as TieneImagen from Productos P LEFT JOIN ProductosColores PC ON P.CodigoColor=PC.codigo where Visible=1 and FechaSync >= ? Order by P.CodigoGrupo, P.Marca, P.Nombre`;
   
  try {
    const [rows] = await pool.query(query, [fechaSync]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})


app.get('/ProductosUnificados', async (req, res) => {
  const [rows] = await pool.query(`Select CodigoProducto, Nombre, NombreBusqueda, IVA, CantidadxBulto, Existencia, Existencia02, Existencia03, ExistenciaVenta , PedidoVenta, PrecioMoneda, PrecioMonedaB, CodigoGrupo, Marca, FechaSync, Capacidad, GradosAlcohol, TipoAlcohol, TieneImagen*1 as TieneImagen, ProveedorNombre from ViewProductosUnificados P Order by P.CodigoGrupo, P.Marca, P.Nombre`)
  res.json(rows)
})

//Productos iltrados por FechSync
app.get('/ProductosUnificados/:FechaSync', async (req, res) => {
  const fechaSync = req.params.FechaSync;
  const query = `Select CodigoProducto, Nombre, NombreBusqueda, IVA, CantidadxBulto, Existencia, Existencia02, Existencia03, ExistenciaVenta , PedidoVenta, PrecioMoneda, PrecioMonedaB, CodigoGrupo, Marca, FechaSync, Capacidad, GradosAlcohol, TipoAlcohol, TieneImagen*1 as TieneImagen, ProveedorNombre from ViewProductosUnificados P where FechaSync >= ? Order by P.CodigoGrupo, P.Marca, P.Nombre`;
   
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
  const [rows] = await pool.query(`SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' or Telefonos is null then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, IFNULL(SaldoMonedaTotal,0) AS SaldoMonedaTotal, IFNULL((case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end),0) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer, 

  IFNULL(C.PromedioDiasPago,0) AS PromedioDiasPago,

  Estatus, Tarifa,

  IFNULL((select FechaEmision from Pedidos Ped where Ped.CodigoCliente=C.CodigoCliente order by Ped.FechaEmision desc LIMIT 1),'2000-01-01 00:00:00') as UltimoPedido,
  '2000-01-01 00:00:00' as UltimaCompra,
  IFNULL((select P2.Fecha from Planificaciones P2 inner join PlanificacionesRenglones PR2 on PR2.Numero=P2.Numero where PR2.CodigoCliente=C.CodigoCliente Order by P2.Fecha desc LIMIT 1),'2000-01-01') as UltimaVisita,
	C.FechaSync
  
  FROM Clientes C WHERE Estatus<>'S' Order by SaldoMonedaTotal desc`)
  res.json(rows)
})

// Filtrar clientes por vendedor
app.get('/Clientes/:Vendedor', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const query = `SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' or Telefonos is null then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, IFNULL(SaldoMonedaTotal,0) AS SaldoMonedaTotal, IFNULL((case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end),0) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer, 

  IFNULL(C.PromedioDiasPago,0) AS PromedioDiasPago,

  Estatus, Tarifa,

  IFNULL((select FechaEmision from Pedidos Ped where Ped.CodigoCliente=C.CodigoCliente order by Ped.FechaEmision desc LIMIT 1),'2000-01-01 00:00:00') as UltimoPedido,
  '2000-01-01 00:00:00' as UltimaCompra,
  IFNULL((select P2.Fecha from Planificaciones P2 inner join PlanificacionesRenglones PR2 on PR2.Numero=P2.Numero where PR2.CodigoCliente=C.CodigoCliente Order by P2.Fecha desc LIMIT 1),'2000-01-01') as UltimaVisita,
	C.FechaSync
  
  FROM Clientes C WHERE Estatus<>'S' and Vendedor = ? Order by SaldoMonedaTotal desc`;
  
  try {
    const [rows] = await pool.query(query, [vendedor]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar clientes por SUPERVISOR  
app.get('/ClientesSupervisor/:Vendedor', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const query = `SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' or Telefonos is null then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, IFNULL(SaldoMonedaTotal,0) AS SaldoMonedaTotal, IFNULL((case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end),0) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer, 

  IFNULL(C.PromedioDiasPago,0) AS PromedioDiasPago,

  Estatus, Tarifa,

  IFNULL((select FechaEmision from Pedidos Ped where Ped.CodigoCliente=C.CodigoCliente order by Ped.FechaEmision desc LIMIT 1),'2000-01-01 00:00:00') as UltimoPedido,
  '2000-01-01 00:00:00' as UltimaCompra,
  IFNULL((select P2.Fecha from Planificaciones P2 inner join PlanificacionesRenglones PR2 on PR2.Numero=P2.Numero where PR2.CodigoCliente=C.CodigoCliente Order by P2.Fecha desc LIMIT 1),'2000-01-01') as UltimaVisita,
	C.FechaSync
  
  FROM Clientes C WHERE Estatus<>'S' AND (EXISTS (SELECT * FROM Vendedores V WHERE V.Codigo=C.Vendedor AND V.SupervisadoPor = ? ) or C.Vendedor = ?) Order by SaldoMonedaTotal desc`;
  
  try {
    const [rows] = await pool.query(query, [vendedor,vendedor]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar clientes por vendedor y FechaSync
app.get('/ClientesFechaSync/:Vendedor/:FechaSync', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const fechaSync = req.params.FechaSync;
  const query = `SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' or Telefonos is null then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, IFNULL(SaldoMonedaTotal,0) AS SaldoMonedaTotal, IFNULL((case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end),0) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer, 

  IFNULL(C.PromedioDiasPago,0) AS PromedioDiasPago,

  Estatus, Tarifa,

  IFNULL((select FechaEmision from Pedidos Ped where Ped.CodigoCliente=C.CodigoCliente order by Ped.FechaEmision desc LIMIT 1),'2000-01-01 00:00:00') as UltimoPedido,
  '2000-01-01 00:00:00' as UltimaCompra,
  IFNULL((select P2.Fecha from Planificaciones P2 inner join PlanificacionesRenglones PR2 on PR2.Numero=P2.Numero where PR2.CodigoCliente=C.CodigoCliente Order by P2.Fecha desc LIMIT 1),'2000-01-01') as UltimaVisita,
	C.FechaSync
  
  FROM Clientes C WHERE Estatus<>'S' and Vendedor = ? and FechaSync >= ? Order by SaldoMonedaTotal desc`;
  
  try {
    const [rows] = await pool.query(query, [vendedor, fechaSync]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar clientes por SUPERVISOR y FechaSync
app.get('/ClientesSupervisorFechaSync/:Vendedor/:FechaSync', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const fechaSync = req.params.FechaSync;
  const query = `SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' or Telefonos is null then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, IFNULL(SaldoMonedaTotal,0) AS SaldoMonedaTotal, IFNULL((case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end),0) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer, 

  IFNULL(C.PromedioDiasPago,0) AS PromedioDiasPago,

  Estatus, Tarifa,

  IFNULL((select FechaEmision from Pedidos Ped where Ped.CodigoCliente=C.CodigoCliente order by Ped.FechaEmision desc LIMIT 1),'2000-01-01 00:00:00') as UltimoPedido,
  '2000-01-01 00:00:00' as UltimaCompra,
  IFNULL((select P2.Fecha from Planificaciones P2 inner join PlanificacionesRenglones PR2 on PR2.Numero=P2.Numero where PR2.CodigoCliente=C.CodigoCliente Order by P2.Fecha desc LIMIT 1),'2000-01-01') as UltimaVisita,
	C.FechaSync
  
  FROM Clientes C WHERE Estatus<>'S' and (EXISTS (SELECT * FROM Vendedores V WHERE V.Codigo=C.Vendedor AND V.SupervisadoPor = ? ) or C.Vendedor = ? ) and FechaSync >= ? Order by SaldoMonedaTotal desc`;
  
  try {
    const [rows] = await pool.query(query, [vendedor, vendedor, fechaSync]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar clientes por FechaSync
app.get('/ClientesFechaSync/:FechaSync', async (req, res) => {
  const fechaSync = req.params.FechaSync;
  const query = `SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' or Telefonos is null then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, IFNULL(SaldoMonedaTotal,0) AS SaldoMonedaTotal, IFNULL((case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end),0) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer, 

  IFNULL(C.PromedioDiasPago,0) AS PromedioDiasPago,

  Estatus, Tarifa,

  IFNULL((select FechaEmision from Pedidos Ped where Ped.CodigoCliente=C.CodigoCliente order by Ped.FechaEmision desc LIMIT 1),'2000-01-01 00:00:00') as UltimoPedido,
  '2000-01-01 00:00:00' as UltimaCompra,
  IFNULL((select P2.Fecha from Planificaciones P2 inner join PlanificacionesRenglones PR2 on PR2.Numero=P2.Numero where PR2.CodigoCliente=C.CodigoCliente Order by P2.Fecha desc LIMIT 1),'2000-01-01') as UltimaVisita,
	C.FechaSync
  
  FROM Clientes C WHERE Estatus<>'S' and FechaSync >= ? Order by SaldoMonedaTotal desc`;
  
  try {
    const [rows] = await pool.query(query, [fechaSync]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar clientes por vendedor
app.get('/ClientesEspecifico/:CodigoCliente', async (req, res) => {
  const codigoCliente = req.params.CodigoCliente;
  const query = `SELECT CodigoCliente, Nombre, CONCAT(CAST((CodigoCliente) AS CHAR),' ',Nombre) as NombreBusqueda, (case when RazonSocial is null or RazonSocial='null' then '' else RazonSocial end) as RazonSocial, Direccion, (case when DiasVisita not in (1,2,3,4,5,6,7) then 8 else DiasVisita end) as DiasVisita, (case when Telefonos='null' or Telefonos is null then '' else Telefonos end) as Telefonos, IFNULL(LimiteCredito,0) as LimiteCredito, IFNULL(SaldoMonedaTotal,0) AS SaldoMonedaTotal, IFNULL((case when SaldoMonedaVencido>SaldoMonedaTotal then SaldoMonedaTotal else SaldoMonedaVencido end),0) as SaldoMonedaVencido, date(ultimopago) as ultimopago, ProximoVencer, 

  IFNULL(C.PromedioDiasPago,0) AS PromedioDiasPago,

  Estatus, Tarifa,

  IFNULL((select FechaEmision from Pedidos Ped where Ped.CodigoCliente=C.CodigoCliente order by Ped.FechaEmision desc LIMIT 1),'2000-01-01 00:00:00') as UltimoPedido,
  '2000-01-01 00:00:00' as UltimaCompra,
  IFNULL((select P2.Fecha from Planificaciones P2 inner join PlanificacionesRenglones PR2 on PR2.Numero=P2.Numero where PR2.CodigoCliente=C.CodigoCliente Order by P2.Fecha desc LIMIT 1),'2000-01-01') as UltimaVisita,
	C.FechaSync
  
  FROM Clientes C WHERE CodigoCliente = ?`;
  
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
  const [rows] = await pool.query(`SELECT P.Numero, P.FechaEmision, C.Nombre, CONCAT(CAST((P.Numero) AS CHAR),' ',C.Nombre) as NombreBusqueda, P.Vendedor, V.nombre as NombreVendedor, P.TotalBruto2, P.Impuesto2, P.TotalPedido2, P.Estatus, (SELECT count(CodigoProducto) FROM PedidosRenglones PR WHERE PR.Numero=P.Numero) AS Items, (SELECT SUM(ROUND(PR.Cantidad/P.CantidadxBulto,2)) FROM PedidosRenglones PR LEFT JOIN Productos P ON P.CodigoProducto=PR.CodigoProducto WHERE PR.Numero=P.Numero) as Bultos, P.CodigoCliente, P.Comentarios, IFNULL((select 100*SUM(ifnull(Despacho,0))/SUM(Cantidad) from PedidosRenglones PR where PR.Numero=P.Numero),0) as PorcentajeFacturado, C.CodigoCliente as RIF FROM Pedidos P LEFT JOIN Clientes C ON P.CodigoCliente=C.CodigoCliente LEFT JOIN Vendedores V ON P.Vendedor=V.codigo WHERE TotalPedido>0 ORDER BY FechaEmision DESC limit 300`)
  res.json(rows)
})

// Filtrar pedidos por vendedor
app.get('/Pedidos/:Vendedor', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const query = `SELECT P.Numero, P.FechaEmision, C.Nombre, CONCAT(CAST((P.Numero) AS CHAR),' ',C.Nombre) as NombreBusqueda, P.Vendedor, V.nombre as NombreVendedor, P.TotalBruto2, P.Impuesto2, P.TotalPedido2, P.Estatus, (SELECT count(CodigoProducto) FROM PedidosRenglones PR WHERE PR.Numero=P.Numero) AS Items, (SELECT SUM(ROUND(PR.Cantidad/P.CantidadxBulto,2)) FROM PedidosRenglones PR LEFT JOIN Productos P ON P.CodigoProducto=PR.CodigoProducto WHERE PR.Numero=P.Numero) as Bultos, P.CodigoCliente, P.Comentarios, IFNULL((select 100*SUM(ifnull(Despacho,0))/SUM(Cantidad) from PedidosRenglones PR where PR.Numero=P.Numero),0) as PorcentajeFacturado, C.CodigoCliente as RIF FROM Pedidos P LEFT JOIN Clientes C ON P.CodigoCliente=C.CodigoCliente LEFT JOIN Vendedores V ON P.Vendedor=V.codigo WHERE TotalPedido>0 and P.Vendedor = ? ORDER BY FechaEmision DESC`;
  
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
  const query = `SELECT P.Numero, P.FechaEmision, C.Nombre, CONCAT(CAST((P.Numero) AS CHAR),' ',C.Nombre) as NombreBusqueda, P.Vendedor, V.nombre as NombreVendedor, P.TotalBruto2, P.Impuesto2, P.TotalPedido2, P.Estatus, (SELECT count(CodigoProducto) FROM PedidosRenglones PR WHERE PR.Numero=P.Numero) AS Items, (SELECT SUM(ROUND(PR.Cantidad/P.CantidadxBulto,2)) FROM PedidosRenglones PR LEFT JOIN Productos P ON P.CodigoProducto=PR.CodigoProducto WHERE PR.Numero=P.Numero) as Bultos, P.CodigoCliente, P.Comentarios, IFNULL((select 100*SUM(ifnull(Despacho,0))/SUM(Cantidad) from PedidosRenglones PR where PR.Numero=P.Numero),0) as PorcentajeFacturado, C.CodigoCliente as RIF FROM Pedidos P LEFT JOIN Clientes C ON P.CodigoCliente=C.CodigoCliente LEFT JOIN Vendedores V ON P.Vendedor=V.codigo WHERE TotalPedido>0 and FechaEmision >= ? ORDER BY FechaEmision DESC`;
  
  try {
    const [rows] = await pool.query(query, [fecha]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar pedidos por vendedor
app.get('/pedidos/PedidosVendedorFecha/:Vendedor/:Fecha', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const fecha = req.params.Fecha;
  const query = `SELECT P.Numero, P.FechaEmision, C.Nombre, CONCAT(CAST((P.Numero) AS CHAR),' ',C.Nombre) as NombreBusqueda, P.Vendedor, V.nombre as NombreVendedor, P.TotalBruto2, P.Impuesto2, P.TotalPedido2, P.Estatus, (SELECT count(CodigoProducto) FROM PedidosRenglones PR WHERE PR.Numero=P.Numero) AS Items, (SELECT SUM(ROUND(PR.Cantidad/P.CantidadxBulto,2)) FROM PedidosRenglones PR LEFT JOIN Productos P ON P.CodigoProducto=PR.CodigoProducto WHERE PR.Numero=P.Numero) as Bultos, P.CodigoCliente, P.Comentarios, IFNULL((select 100*SUM(ifnull(Despacho,0))/SUM(Cantidad) from PedidosRenglones PR where PR.Numero=P.Numero),0) as PorcentajeFacturado, C.CodigoCliente as RIF FROM Pedidos P LEFT JOIN Clientes C ON P.CodigoCliente=C.CodigoCliente LEFT JOIN Vendedores V ON P.Vendedor=V.codigo WHERE TotalPedido>0 and P.Vendedor = ? and FechaEmision >= ? ORDER BY FechaEmision DESC`;
  
  try {
    const [rows] = await pool.query(query, [vendedor, fecha]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar pedidos por vendedor
app.get('/PedidosSupervisorFecha/:Supervisor/:Fecha', async (req, res) => {
  const supervisor = req.params.Supervisor;
  const fecha = req.params.Fecha;
  const query = `SELECT P.Numero, P.FechaEmision, C.Nombre, CONCAT(CAST((P.Numero) AS CHAR),' ',C.Nombre) as NombreBusqueda, P.Vendedor, V.nombre as NombreVendedor, P.TotalBruto2, P.Impuesto2, P.TotalPedido2, P.Estatus, (SELECT count(CodigoProducto) FROM PedidosRenglones PR WHERE PR.Numero=P.Numero) AS Items, (SELECT SUM(ROUND(PR.Cantidad/P.CantidadxBulto,2)) FROM PedidosRenglones PR LEFT JOIN Productos P ON P.CodigoProducto=PR.CodigoProducto WHERE PR.Numero=P.Numero) as Bultos, P.CodigoCliente, P.Comentarios, IFNULL((select 100*SUM(ifnull(Despacho,0))/SUM(Cantidad) from PedidosRenglones PR where PR.Numero=P.Numero),0) as PorcentajeFacturado, C.CodigoCliente as RIF FROM Pedidos P LEFT JOIN Clientes C ON P.CodigoCliente=C.CodigoCliente LEFT JOIN Vendedores V ON P.Vendedor=V.codigo WHERE TotalPedido>0 and (V.SupervisadoPor = ? OR V.codigo = ?) and FechaEmision >= ? ORDER BY FechaEmision DESC`;
  
  try {
    const [rows] = await pool.query(query, [supervisor, supervisor, fecha]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar pedidos por vendedor
app.get('/PedidosSupervisor/:Vendedor', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const query = `SELECT P.Numero, P.FechaEmision, C.Nombre, CONCAT(CAST((P.Numero) AS CHAR),' ',C.Nombre) as NombreBusqueda, P.Vendedor, V.nombre as NombreVendedor, P.TotalBruto2, P.Impuesto2, P.TotalPedido2, P.Estatus, (SELECT count(CodigoProducto) FROM PedidosRenglones PR WHERE PR.Numero=P.Numero) AS Items, (SELECT SUM(ROUND(PR.Cantidad/P.CantidadxBulto,2)) FROM PedidosRenglones PR LEFT JOIN Productos P ON P.CodigoProducto=PR.CodigoProducto WHERE PR.Numero=P.Numero) as Bultos, Comentarios, C.RIF FROM Pedidos P LEFT JOIN Clientes C ON P.CodigoCliente=C.CodigoCliente LEFT JOIN Vendedores V ON P.Vendedor=V.codigo WHERE TotalPedido>0 and V.SupervisadoPor = ? ORDER BY FechaEmision DESC`;
  
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

app.post('/CrearPedido2', async (req, res) => {
  try {
    const pedidoCompleto = req.body; // Obtén los datos completos del pedido enviados en la solicitud POSTaa

    const selectContadorQuery = `
      SELECT CONCAT('AS-', LPAD(RIGHT(LEFT(Numero,8),5)+1, 5, '0')) as Contador
      FROM Pedidos
      ORDER BY Numero DESC
      LIMIT 1
    `;
    const [contadorResult] = await pool.query(selectContadorQuery);
    const nuevoContador = contadorResult[0].Contador;


    // Lógica para insertar el pedido en Pedidos
    const insertQueryPedido = `INSERT INTO Pedidos (Numero, FechaEmision, FechaEntrega, CodigoCliente, TotalBruto, Descuento, Impuesto, Cargo, TotalPedido, PorcentajeDescuento, Vendedor, Comentarios, Tarifa, Almacen, Peso, Estatus, Usuario, Cambio, Moneda, TotalBruto2, Descuento2, Impuesto2, Cargo2, TotalPedido2, Idmoneda, ubicacion, EsEspera) VALUES (?, DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 4 HOUR), ?, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2)+round(?*(select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1),2), 0, ?, CONCAT('APP: ', ?), 'A', '02', 0, 'PE', 'APP', (select cambio from MonedasCambio where idmoneda=2 order by fecha desc LIMIT 1), 'BsS', ?, 0, ?, 0, ?, 2, POINT(?, ?), ?)`;
    const valuesPedido = [nuevoContador, pedidoCompleto.codigoCliente, pedidoCompleto.totalNeto, pedidoCompleto.totalImpuesto, pedidoCompleto.totalNeto, pedidoCompleto.totalImpuesto, pedidoCompleto.vendedor, pedidoCompleto.comentario, pedidoCompleto.totalNeto, pedidoCompleto.totalImpuesto, pedidoCompleto.totalPedido, pedidoCompleto.latitud, pedidoCompleto.longitud, pedidoCompleto.esEspera];
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
  const [rows] = await pool.query(`SELECT codigo, nombre, Zona, Almacen, RTRIM(rif) as rif, RTRIM(nit) as nit, CAST(CantidadClientes AS SIGNED) AS CantidadClientes, CAST(CantidadClientesNuevosMes AS SIGNED) AS CantidadClientesNuevosMes, CAST(CantidadPedidosHoy AS SIGNED) AS CantidadPedidosHoy, CAST(CantidadPedidosMes AS SIGNED) AS CantidadPedidosMes, CAST(CantidadClientesAtendidosHoy AS SIGNED) AS CantidadClientesAtendidosHoy, CAST(CantidadClientesAtendidosMes AS SIGNED) AS CantidadClientesAtendidosMes, meta, PorcentajeEfectividad, TotalVentaBruta2, TotalDevolucionBruta2, TotalFacturacionBruta2, PorcentajeAlcanzadoMeta, DiasHabilesMes, DiasHabilesTranscurridos, DiasHabilesRestantes, PromedioVentaDiaria, DiferenciaMeta, IFNULL(ObjetivoDiario,0) AS ObjetivoDiario, Saldo, Vencido, PorcentajeSaldoVencido, PorcentajeVentaVencido, IFNULL(SupervisadoPor,'') as SupervisadoPor FROM ViewVendedoresIndicadores v WHERE meta>0 and nombre is not null ORDER BY nombre`)
  res.status(200).json(rows)
})

//Vendedores filtrados por FechSync
app.get('/Vendedores/:FechaSync', async (req, res) => {
  const fechaSync = req.params.FechaSync;
  console.log('FechaSync:', fechaSync);  // Agrega esta línea para depuración
  const query = `SELECT codigo, nombre, Zona, Almacen, RTRIM(rif) as rif, RTRIM(nit) as nit, CAST(CantidadClientes AS SIGNED) AS CantidadClientes, CAST(CantidadClientesNuevosMes AS SIGNED) AS CantidadClientesNuevosMes, CAST(CantidadPedidosHoy AS SIGNED) AS CantidadPedidosHoy, CAST(CantidadPedidosMes AS SIGNED) AS CantidadPedidosMes, CAST(CantidadClientesAtendidosHoy AS SIGNED) AS CantidadClientesAtendidosHoy, CAST(CantidadClientesAtendidosMes AS SIGNED) AS CantidadClientesAtendidosMes, meta, PorcentajeEfectividad, TotalVentaBruta2, TotalDevolucionBruta2, TotalFacturacionBruta2, PorcentajeAlcanzadoMeta, DiasHabilesMes, DiasHabilesTranscurridos, DiasHabilesRestantes, PromedioVentaDiaria, DiferenciaMeta, IFNULL(ObjetivoDiario,0) AS ObjetivoDiario, Saldo, Vencido, PorcentajeSaldoVencido, PorcentajeVentaVencido, IFNULL(SupervisadoPor,'') as SupervisadoPor FROM ViewVendedoresIndicadores v WHERE meta>0 and FechaSync >= ? ORDER BY nombre`;
  
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

//Vendedores filtrados por codigo
app.get('/VendedoresEspecifico/:Codigo', async (req, res) => {
  const codigo = req.params.Codigo;
  console.log('Codigo:', codigo);  // Agrega esta línea para depuración
  const query = `SELECT codigo, nombre, Zona, Almacen, RTRIM(rif) as rif, RTRIM(nit) as nit, SupervisadoPor FROM Vendedores v WHERE Codigo = ? ORDER BY nombre`;
  
  try {
    console.log('Query:', query);  // Agrega esta línea para depuración
    const [rows] = await pool.query(query, [codigo]);
    console.log('Rows:', rows);  // Agrega esta línea para depuración
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

app.get('/VendedoresDisponibles', async (req, res) => { 
  const [rows] = await pool.query(`SELECT codigo, nombre, Zona, IFNULL(Almacen,'') AS Almacen, RTRIM(rif) as rif, RTRIM(nit) as nit, SupervisadoPor FROM Vendedores V WHERE NOT EXISTS (SELECT * FROM Usuarios U WHERE U.CodigoVendedor=V.codigo) ORDER BY nombre`)
  res.status(200).json(rows)
})

app.get('/SupervisoresDisponibles', async (req, res) => { 
  const [rows] = await pool.query(`SELECT codigo, nombre, Zona, Almacen, RTRIM(rif) as rif, RTRIM(nit) as nit, SupervisadoPor FROM Vendedores V WHERE EXISTS (SELECT * FROM Vendedores v2 WHERE v2.SupervisadoPor=V.codigo) union SELECT ' ' as codigo, ' ' as nombre, ' ' as Zona, ' ' as Almacen, ' ' as rif, ' ' as nit, ' ' as SupervisadoPor ORDER BY nombre`)
  res.status(200).json(rows)
})

app.get('/Usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT Usuario, Contrasena, NombreCompleto, CorreoElectronico, FechaRegistro, IFNULL(UltimoInicioSesion,'2000-01-01 00:00:00') as UltimoInicioSesion, Rol, Estatus, CodigoVendedor, IFNULL(FechaNacimiento,'2000-01-01 00:00:00') as FechaNacimiento, Direccion, NumeroTelefono, Cedula, IFNULL(Almacen,'') AS Almacen, SupervisadoPor, VersionInstalada, UsaPrecioC FROM Usuarios ORDER BY NombreCompleto`);

    // Envía una respuesta indicando que la consulta se ha realizado correctamente
    res.status(200).json(rows);
    //sdsd
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
    INSERT INTO Usuarios (Usuario, Contrasena, NombreCompleto, CorreoElectronico, FechaRegistro, Rol, Estatus, CodigoVendedor, Direccion, NumeroTelefono, Cedula, Almacen, SupervisadoPor, UsaPrecioC) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 4 HOUR), ?, 1, ?, ?, ?, ?, ?, ?, ?)`;

  const insertValues = [
    newUserData.usuario, newUserData.contrasena, newUserData.nombreCompleto, newUserData.correoElectronico, newUserData.rol, newUserData.codigoVendedor, newUserData.direccion, newUserData.numeroTelefono, newUserData.cedula, newUserData.almacen, newUserData.supervisadoPor, newUserData.usaPrecioC
  ];

  const updateQueryVendedor = `UPDATE Vendedores SET SupervisadoPor = ? WHERE codigo = ?`;
  
  const updateValuesVendedor = [newUserData.supervisadoPor, newUserData.codigoVendedor];

  try {
    await pool.query(insertQuery, insertValues);
    await pool.query(updateQueryVendedor, updateValuesVendedor);
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
    const query = `SELECT Usuario, Contrasena, NombreCompleto, CorreoElectronico, FechaRegistro, IFNULL(UltimoInicioSesion,'2000-01-01 00:00:00') as UltimoInicioSesion, Rol, Estatus, CodigoVendedor, IFNULL(FechaNacimiento,'2000-01-01 00:00:00') as FechaNacimiento, Direccion, NumeroTelefono, Cedula, IFNULL(Almacen,'') AS Almacen, SupervisadoPor, VersionInstalada, UsaPrecioC FROM Usuarios where Usuario = ?`;
  
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
    UPDATE Usuarios SET Contrasena = ?, NombreCompleto = ?, CorreoElectronico = ?, Rol = ?, Estatus = ?, CodigoVendedor = ?, FechaNacimiento = ?, Direccion = ?, NumeroTelefono = ?, Cedula = ?, Almacen = ?, SupervisadoPor = ? WHERE Usuario = ?`;
  
  const updateValues = [
    updatedUserData.contrasena, updatedUserData.nombreCompleto, updatedUserData.correoElectronico, updatedUserData.rol, updatedUserData.estatus, updatedUserData.codigoVendedor, updatedUserData.fechaNacimiento, updatedUserData.direccion, updatedUserData.numeroTelefono, updatedUserData.cedula, updatedUserData.almacen, updatedUserData.supervisadoPor, usuario
  ];

  const updateQueryVendedor = `UPDATE Vendedores SET SupervisadoPor = ? WHERE codigo = ?`;
  
  const updateValuesVendedor = [updatedUserData.supervisadoPor, updatedUserData.codigoVendedor];
 
  try {
    const [result] = await pool.query(updateQuery, updateValues);
    const [result2] = await pool.query(updateQueryVendedor, updateValuesVendedor);

    if (updatedUserData.rol == 'Gerente' && result.affectedRows > 0) {
      res.status(200).json({ message: 'Registro actualizado correctamente' });
    } else {
      if (result.affectedRows > 0 && result2.affectedRows > 0) {
        res.status(200).json({ message: 'Registro actualizado correctamente' });
      } else {
        res.status(404).json({ error: 'Registro no Actualizado' });
      }
    }

    } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la actualización' });
  }
});

// Verificacion de usuario -- LogIn
app.get('/UsuariosVerificacion/:User/:Pass', async (req, res) => {
  try { 
    const usuario = req.params.User;
    const contrasena = req.params.Pass;
    const query = `SELECT Usuario, Contrasena, NombreCompleto, CorreoElectronico, FechaRegistro, IFNULL(UltimoInicioSesion,'2000-01-01 00:00:00') as UltimoInicioSesion, Rol, Estatus, CodigoVendedor, IFNULL(FechaNacimiento,'2000-01-01 00:00:00') as FechaNacimiento, Direccion, NumeroTelefono, Cedula, IFNULL(Almacen,'') AS Almacen, SupervisadoPor, VersionInstalada, UsaPrecioC FROM Usuarios where TRIM(LOWER(Usuario)) = ? and Contrasena = ?`;

    const query2 = `SELECT Usuario, Contrasena, NombreCompleto, CorreoElectronico, FechaRegistro, IFNULL(UltimoInicioSesion,'2000-01-01 00:00:00') as UltimoInicioSesion, Rol, Estatus, CodigoVendedor, IFNULL(FechaNacimiento,'2000-01-01 00:00:00') as FechaNacimiento, Direccion, NumeroTelefono, Cedula, IFNULL(Almacen,'') AS Almacen, SupervisadoPor, VersionInstalada, UsaPrecioC FROM Usuarios where TRIM(LOWER(Usuario)) = ?`;
  
    const [rows] = await pool.query(query, [usuario,contrasena]);
    const [rows2] = await pool.query(query2, [usuario]);

    if (rows2.length === 0) {
      // Si no se encontraron registros, devuelve un mensaje de error
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (rows.length === 0) {
      // Si no se verifico la contraseña, devuelve un mensaje de error 401
      return res.status(401).json({ error: 'Contraseña Invalida' });
    }
    
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})


app.get('/ping', async (req, res) => {
  const [result] = await pool.query(`SELECT "hello world" as RESULT`);
  res.json(result[0])
})

// Actualizar Inicio de sesion y version de aplicacion
app.put('/actualizarInfoUsuario/:Usuario', async (req, res) => {
  const usuario = req.params.Usuario;
  const updatedUserData = req.body; // Datos actualizados del usuario en el cuerpo de la solicitud

  const updateQuery = `
    UPDATE Usuarios SET UltimoInicioSesion = DATE_SUB(NOW(), INTERVAL 4 HOUR), VersionInstalada = ?  WHERE Usuario = ?`;
  
  const updateValues = [
    updatedUserData.versionInstalada, usuario
  ];

  const selectQuery = `
    SELECT Numero 
    FROM Contadores 
    WHERE Documento = 'Version'`;
 
  try {
    const [result] = await pool.query(updateQuery, updateValues);
    const [result2] = await pool.query(selectQuery);

    if (result.affectedRows > 0) {
  //      res.status(200).json({ message: 'Registro actualizado correctamente' });
      res.status(200).json(result2);
    } else {
      res.status(404).json({ error: 'Registro no Actualizado' });
    }

    } catch (error) {
    console.error(error);
    res.status(500).json(result2);
  }
});

app.get('/VersionDisponible', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT Numero FROM Contadores WHERE Documento = 'Version'`);

    // Envía una respuesta indicando que la consulta se ha realizado correctamente
    res.status(200).json(rows);
    //sdsd
  } catch (error) {
    // Si ocurre un error durante la consulta, envía una respuesta de error
    console.error('Error al obtener la version disponible', error);
    res.status(500).json({ error: 'Error al obtener la version disponible' });
  }
});

app.post('/CrearPlanificacion', async (req, res) => {
  try {
    const planificacion = req.body; // Obtén los datos completos del pedido enviados en la solicitud POST

    const query = `SELECT Numero FROM Planificaciones where Numero = ?`;
    const [rows] = await pool.query(query, [planificacion.numero]);

    if (rows.length > 0) {
      // Si no se verifico la contraseña, devuelve un mensaje de error 401
      return res.status(409).json({ message: 'La planificacion ya existe' });
    }

    console.log(planificacion.numero, planificacion.fecha, planificacion.vendedor, planificacion.comentario, planificacion.usuario);

    // Lógica para insertar el pedido en Pedidos
    const insertQueryPlanificacion = `INSERT INTO Planificaciones (Numero, Fecha, Vendedor, Comentario, Estado, FechaCreacion, Usuario) VALUES (?, ?, ?, ?, (case when date(DATE_SUB(NOW(), INTERVAL 4 HOUR))=? then 'En Proceso' else 'Pendiente' end), DATE_SUB(NOW(), INTERVAL 4 HOUR), ?)`;
    const valuesPlanificacion = [planificacion.numero, planificacion.fecha, planificacion.vendedor, planificacion.comentario, planificacion.fecha, planificacion.usuario];
    const [planificacionResult] = await pool.query(insertQueryPlanificacion, valuesPlanificacion);

    // const pedidoId = pedidoResult.insertId; // Obtén el ID del pedido recién insertado

    // Lógica para insertar los renglones del pedido en PedidosRenglones
    const renglones = planificacion.renglones;
    const insertQueryRenglones = `INSERT INTO PlanificacionesRenglones (Numero, CodigoCliente, Indice, Comentario) VALUES (?, ?, ?, '');`;
    
    for (const renglon of renglones) {
      const valuesRenglones = [renglon.numero, renglon.codigoCliente, renglon.indice, renglon.comentario];
      await pool.query(insertQueryRenglones, valuesRenglones);
    }

    // Envía una respuesta indicando que el pedido y los renglones se han creado correctamente
    res.status(200).json({ message: 'Planificacion creada exitosamente', numero: planificacion.numero });
  } catch (error) {
    // Si ocurre un error durante el proceso de creación, envía una respuesta de error
    console.error('Error al crear la planificacion y los renglones:', error);
    res.status(500).json({ error: 'Error al crear la planificacion' });
  }
});

app.get('/PlanificacionesFecha/:Fecha', async (req, res) => {
  const fecha = req.params.Fecha;
  const query = `
    select
      Numero,
      Fecha,
      Vendedor,
      NombreVendedor,
      Comentario,
      Estado,
      CantidadClientes,
      Ventas,
      Cobranzas,
      Atendidos,
      Totales,
      ifnull(round((Totales*100/CantidadClientes),0),0) as Porc,

      ROUND(ifnull((
      select (Totales*100/CantidadClientes) 
      from ViewPlanificaciones P2 
      where P2.Vendedor=P.Vendedor 
      and P2.Fecha<P.Fecha
      order by P2.Fecha DESC
      LIMIT 1 
      ),0),0) as PorcAnt,

      ifnull(
        round((Totales*100/CantidadClientes),0)-
        ROUND(ifnull((
        select (Totales*100/CantidadClientes) 
        from ViewPlanificaciones P2 
        where P2.Vendedor=P.Vendedor 
        and P2.Fecha<P.Fecha
        order by P2.Fecha DESC
        LIMIT 1 
        ),0),0)
      ,0) as DiffPorc

    from ViewPlanificaciones P
    Where P.Fecha >= date(?)
    order by P.Fecha desc, P.Vendedor asc`;
  
  try {
    const [rows] = await pool.query(query, [fecha]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar planificaciones por vendedor
app.get('/PlanificacionesVendedorFecha/:Vendedor/:Fecha', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const fecha = req.params.Fecha;
  const query = `
    select
      Numero,
      Fecha,
      Vendedor,
      NombreVendedor,
      Comentario,
      Estado,
      CantidadClientes,
      Ventas,
      Cobranzas,
      Atendidos,
      Totales,
      ifnull(round((Totales*100/CantidadClientes),0),0) as Porc,

      ROUND(ifnull((
      select (Totales*100/CantidadClientes) 
      from ViewPlanificaciones P2 
      where P2.Vendedor=P.Vendedor 
      and P2.Fecha<P.Fecha
      order by P2.Fecha DESC
      LIMIT 1 
      ),0),0) as PorcAnt,

      ifnull(
        round((Totales*100/CantidadClientes),0)-
        ROUND(ifnull((
        select (Totales*100/CantidadClientes) 
        from ViewPlanificaciones P2 
        where P2.Vendedor=P.Vendedor 
        and P2.Fecha<P.Fecha
        order by P2.Fecha DESC
        LIMIT 1 
        ),0),0)
      ,0) as DiffPorc

    from ViewPlanificaciones P
    Where P.Vendedor = ? and P.Fecha >= date(?)
    order by P.Fecha desc, P.Vendedor asc`;
  
  try {
    const [rows] = await pool.query(query, [vendedor, fecha]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar planificaciones por supervisor
app.get('/PlanificacionesSupervisorFecha/:Supervisor/:Fecha', async (req, res) => {
  const supervisor = req.params.Supervisor;
  const fecha = req.params.Fecha;
  const query = `
    select
      Numero,
      Fecha,
      Vendedor,
      NombreVendedor,
      Comentario,
      Estado,
      CantidadClientes,
      Ventas,
      Cobranzas,
      Atendidos,
      Totales,
      ifnull(round((Totales*100/CantidadClientes),0),0) as Porc,

      ROUND(ifnull((
      select (Totales*100/CantidadClientes) 
      from ViewPlanificaciones P2 
      where P2.Vendedor=P.Vendedor 
      and P2.Fecha<P.Fecha
      order by P2.Fecha DESC
      LIMIT 1 
      ),0),0) as PorcAnt,

      ifnull(
        round((Totales*100/CantidadClientes),0)-
        ROUND(ifnull((
        select (Totales*100/CantidadClientes) 
        from ViewPlanificaciones P2 
        where P2.Vendedor=P.Vendedor 
        and P2.Fecha<P.Fecha
        order by P2.Fecha DESC
        LIMIT 1 
        ),0),0)
      ,0) as DiffPorc

    from ViewPlanificaciones P
    left join Vendedores V on P.Vendedor=V.codigo
    Where (V.SupervisadoPor = ? OR V.codigo = ?) and P.Fecha >= date(?)
    order by P.Fecha desc, P.Vendedor asc`;
  
  try {
    const [rows] = await pool.query(query, [supervisor, supervisor, fecha]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Filtrar planificacionesrenglon por numero
app.get('/PlanificacionesRenglones/:Numero', async (req, res) => {
  const numero = req.params.Numero;
  const query = `SELECT 
    PR.Numero,
    PR.CodigoCliente,
    C.Nombre as NombreCliente,
    C.Direccion,
    (case when C.Telefonos='null' or C.Telefonos is null then '' else C.Telefonos end) as Telefonos,
    C.SaldoMonedaTotal,
    C.SaldoMonedaVencido,
    C.ProximoVencer,
    
    IFNULL(C.PromedioDiasPago,0) AS PromedioDiasPago,

    C.Estatus,
    

    IFNULL(C.UltimoPago,'2000-01-01 00:00:00') as UltimoPago,
    IFNULL((select FechaEmision from Pedidos Ped where Ped.CodigoCliente=PR.CodigoCliente order by Ped.FechaEmision desc LIMIT 1),'2000-01-01 00:00:00') as UltimoPedido,
    '2000-01-01 00:00:00' as UltimaCompra,
    IFNULL((select P2.Fecha from Planificaciones P2 inner join PlanificacionesRenglones PR2 on PR2.Numero=P2.Numero where PR2.CodigoCliente=PR.CodigoCliente and P2.Fecha<P.Fecha Order by P2.Fecha desc LIMIT 1),'2000-01-01') as UltimaVisita,
    PR.Comentario,
    PR.Indice,
    (select count(distinct Ped.CodigoCliente) from Pedidos Ped where Ped.CodigoCliente=PR.CodigoCliente and Date(Ped.FechaEmision)=P.Fecha) as Venta,

    PR.Cobranza,
    (case when PR.FechaUbicacion is null then 'NO' else 'SI' end) as TieneUbicacion
    
    FROM PlanificacionesRenglones PR
    Inner join Planificaciones P on PR.Numero=P.Numero
    Left join Clientes C on PR.CodigoCliente=C.CodigoCliente

    where PR.Numero = ?

    order by Indice ASC`;
  
  try {
    const [rows] = await pool.query(query, [numero]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Endpoint para actualizar varios registros de planificaciones renglones
app.put('/PlanificacionesRenglones/:Numero', async (req, res) => {
  try {
    const numero = req.params.Numero;
    const planificacion = req.body; 

    // Lógica para insertar los renglones del pedido en PedidosRenglones
    const renglones = planificacion.renglones;
    const updateQueryRenglones = `UPDATE PlanificacionesRenglones SET Comentario = ? WHERE Numero = ? AND CodigoCliente = ?`;
       
    for (const renglon of renglones) {
      const valuesRenglones = [renglon.comentario, numero, renglon.codigoCliente];
      await pool.query(updateQueryRenglones, valuesRenglones);
    }

    // Envía una respuesta indicando que el pedido y los renglones se han creado correctamente
    res.status(200).json({ message: 'Planificacion creada exitosamente', numero: planificacion.numero });
  } catch (error) {
    // Si ocurre un error durante el proceso de creación, envía una respuesta de error
    console.error('Error al crear la planificacion y los renglones:', error);
    res.status(500).json({ error: 'Error al crear la planificacion' });
  }
});

app.put('/PlanificacionesRenglonesUbicacion/:Numero', async (req, res) => {
  try {
    const numero = req.params.Numero;
    const planificacion = req.body; 

    // Lógica para insertar los renglones del pedido en PedidosRenglones
    
    const updateQueryRenglones = `UPDATE PlanificacionesRenglones SET ubicacion=POINT(?, ?), FechaUbicacion=DATE_SUB(NOW(), INTERVAL 4 HOUR) WHERE Numero = ? AND CodigoCliente = ?`;
    const valuesRenglones = [planificacion.latitud, planificacion.longitud, numero, planificacion.codigoCliente];

    await pool.query(updateQueryRenglones, valuesRenglones);
  

    // Envía una respuesta indicando que el pedido y los renglones se han creado correctamente
    res.status(200).json({ message: 'Ubicacion de Planificacion renglones capturada exitosamente', numero: planificacion.numero });
  } catch (error) {
    // Si ocurre un error durante el proceso de creación, envía una respuesta de error
    console.error('Error al crear la ubicacion de la planificacion renglones:', error);
    res.status(500).json({ error: 'Error al crear la ubicacion' });
  }
});

app.post('/AgregarPlanificacionRenglon', async (req, res) => {
  try {
    const planificacionRenglon = req.body; // Obtén los datos completos del pedido enviados en la solicitud POST

    // Lógica para insertar los renglones del pedido en PedidosRenglones
    const insertQueryRenglones = `INSERT INTO PlanificacionesRenglones (Numero, CodigoCliente, Indice, Comentario) VALUES (?, ?, ?, '');`;
    const valuesRenglones = [planificacionRenglon.numero, planificacionRenglon.codigoCliente, planificacionRenglon.indice];
    await pool.query(insertQueryRenglones, valuesRenglones);
    

    // Envía una respuesta indicando que el pedido y los renglones se han creado correctamente
    res.status(200).json({ message: 'Planificacion renglon agregado exitosamente', numero: planificacionRenglon.numero });
  } catch (error) {
    // Si ocurre un error durante el proceso de creación, envía una respuesta de error
    console.error('Error al AgregarPlanificacionRenglon:', error);
    res.status(500).json({ error: 'Error al AgregarPlanificacionRenglon' });
  }
});

app.get('/Sugerido/:CodigoCliente/:Fecha', async (req, res) => {
  const codigoCliente = req.params.CodigoCliente;
  const fecha = req.params.Fecha;
  const query = `
  select
    pr.CodigoProducto,
    sum(pr.Despacho)/max(prod.CantidadxBulto) as Cantidad,
    max(p.FechaEmision) as UltimaVenta
  from Pedidos p
  inner join PedidosRenglones pr on pr.Numero=p.Numero
  inner join Productos prod on prod.CodigoProducto=pr.CodigoProducto
  inner join Clientes c on c.CodigoCliente=p.CodigoCliente

  where DATE(p.FechaEmision) >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) and p.CodigoCliente = ?
  group by pr.CodigoProducto
  having sum(pr.Despacho)<>0
  order by pr.CodigoProducto`;
  
  try {
    // const [rows] = await pool.query(query, [codigoCliente, fecha]);
    const [rows] = await pool.query(query, [codigoCliente]);
    //res.json(rows);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

//agregar usuario nuevo
app.post('/SolicitudImagen', async (req, res) => {
  const newUserData = req.body; // Datos del nuevo usuario en el cuerpo de la solicitud

  const insertQuery = `
    INSERT INTO SolicitudesImagenes (CodigoProducto, Opcion, Descripcion, FechaHora) VALUES (?, ?, ?, DATE_SUB(NOW(), INTERVAL 4 HOUR))`;

  const insertValues = [
    newUserData.codigoProducto, newUserData.opcion, newUserData.descripcion
  ];

  try {
    await pool.query(insertQuery, insertValues);
    res.status(200).json({ message: 'Solicitud de imagen agregada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar la solicitud' });
  }
});

// Obtener todas las cxc
app.get('/CuentasPorCobrar', async (req, res) => {
  const [rows] = await pool.query(
    `select 
      cxc.CodigoCliente, 
      c.Nombre as NombreCliente, 
      (case when Tipo='FC' and SaldoPendiente<0 then 'AA' else Tipo end) as Tipo,
      Numero, 
      Emision, 
      Vencimiento, 
      FechaDespacho, 
      EstatusGuia, 
      MontoFactura, 
      MontoNotasCredito, 
      (case 
        when Tipo IN ('AA','NC') AND SaldoPendiente<>0
          then (select sum(MontoFactura) 
                from CuentasPorCobrar cxc2 
                where cxc2.Numero=cxc.Numero
                and cxc2.CodigoCliente=cxc.CodigoCliente)
        else SaldoPendiente 
      end) as SaldoPendiente,
      ifnull(cxc.Vendedor,'') as Vendedor, 
      ifnull(v.Nombre,'') as NombreVendedor, 
      Cambio, 
      ifnull(PlanTrabajo,0) as PlanTrabajo,
      ifnull(c.PorcentajeIVA,0) as PorcentajeRetencion,
      RetencionAplicada,
      ifnull(cxc.Tarifa,'A') as Tarifa
    from CuentasPorCobrar cxc 
    left join Clientes c on c.CodigoCliente=cxc.CodigoCliente 
    left join Vendedores v on v.codigo=cxc.vendedor 
    where (case 
            when Tipo IN ('AA','NC') AND SaldoPendiente<>0
              then (select sum(MontoFactura) 
                    from CuentasPorCobrar cxc2 
                    where cxc2.Numero=cxc.Numero
                    and cxc2.CodigoCliente=cxc.CodigoCliente)
            else SaldoPendiente 
          end)<>0`
  )
  res.json(rows)
})


// obtener las cxc de un vendedor
app.get('/CuentasPorCobrar/:Vendedor', async (req, res) => {
  const vendedor = req.params.Vendedor;
  const query = `select 
    cxc.CodigoCliente, 
    c.Nombre as NombreCliente, 
    (case when Tipo='FC' and SaldoPendiente<0 then 'AA' else Tipo end) as Tipo,
    Numero, 
    Emision, 
    Vencimiento, 
    FechaDespacho, 
    EstatusGuia, 
    MontoFactura, 
    MontoNotasCredito, 
    (case 
      when Tipo IN ('AA','NC') AND SaldoPendiente<>0
        then (select sum(MontoFactura) 
              from CuentasPorCobrar cxc2 
              where cxc2.Numero=cxc.Numero
              and cxc2.CodigoCliente=cxc.CodigoCliente)
      else SaldoPendiente 
    end) as SaldoPendiente,
    ifnull(cxc.Vendedor,'') as Vendedor, 
    ifnull(v.Nombre,'') as NombreVendedor, 
    Cambio, 
    ifnull(PlanTrabajo,0) as PlanTrabajo,
    ifnull(c.PorcentajeIVA,0) as PorcentajeRetencion,
    RetencionAplicada,
    ifnull(cxc.Tarifa,'A') as Tarifa
  from CuentasPorCobrar cxc 
  left join Clientes c on c.CodigoCliente=cxc.CodigoCliente 
  left join Vendedores v on v.codigo=cxc.vendedor
  WHERE cxc.Vendedor = ? 
  and (case 
        when Tipo IN ('AA','NC') AND SaldoPendiente<>0
          then (select sum(MontoFactura) 
                from CuentasPorCobrar cxc2 
                where cxc2.Numero=cxc.Numero
                and cxc2.CodigoCliente=cxc.CodigoCliente)
        else SaldoPendiente 
      end)<>0`;
  
  try {
    const [rows] = await pool.query(query, [vendedor]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})

// Obtener las cxc de un cliente
app.get('/CuentasPorCobrar/Cliente/:CodigoCliente', async (req, res) => {
  const codigoCliente = req.params.CodigoCliente;
  const query = `select 
      cxc.CodigoCliente, 
      c.Nombre as NombreCliente, 
      (case when Tipo='FC' and SaldoPendiente<0 then 'AA' else Tipo end) as Tipo, 
      Numero, 
      Emision, 
      Vencimiento, 
      FechaDespacho, 
      EstatusGuia, 
      MontoFactura, 
      MontoNotasCredito, 
      (case 
        when Tipo IN ('AA','NC') AND SaldoPendiente<>0
          then (select sum(MontoFactura) 
                from CuentasPorCobrar cxc2 
                where cxc2.Numero=cxc.Numero
                and cxc2.CodigoCliente=cxc.CodigoCliente)
        else SaldoPendiente 
      end) as SaldoPendiente,
      ifnull(cxc.Vendedor,'') as Vendedor, 
      ifnull(v.Nombre,'') as NombreVendedor, 
      Cambio, 
      ifnull(PlanTrabajo,0) as PlanTrabajo,
      ifnull(c.PorcentajeIVA,0) as PorcentajeRetencion,
      RetencionAplicada,
      ifnull(cxc.Tarifa,'A') as Tarifa
    from CuentasPorCobrar cxc 
    left join Clientes c on c.CodigoCliente=cxc.CodigoCliente 
    left join Vendedores v on v.codigo=cxc.vendedor

    where cxc.CodigoCliente = ? 
    and (case 
      when Tipo IN ('AA','NC') AND SaldoPendiente<>0
        then (select sum(MontoFactura) 
              from CuentasPorCobrar cxc2 
              where cxc2.Numero=cxc.Numero
              and cxc2.CodigoCliente=cxc.CodigoCliente)
      else SaldoPendiente 
    end)<>0

    order by Emision ASC`;
  
  try {
    const [rows] = await pool.query(query, [codigoCliente]);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})


// Filtrar tasa de cambio segun fecha por supervisor
app.get('/GetCambio/:Fecha', async (req, res) => {
  const fecha = req.params.Fecha;
  const query = `
    SELECT 
      CAMBIO
    FROM MonedasCambio 
    WHERE DATE(Fecha)<=DATE(?)
    ORDER BY fecha DESC
    LIMIT 1`;
  
  try {
    const [rows] = await pool.query(query, [fecha]);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la consulta' });
  }
})


app.get('/Bancos', async (req, res) => {
  const [rows] = await pool.query(`
    select 
      CodigoBanco, Nombre, Cuenta, IdMoneda
    from Bancos
    where Fax=1
  `)
  res.json(rows)
})

app.get('/EntidadesBancarias', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT CodigoBanco, Nombre
    FROM EntidadesBancarias
  `)
  res.json(rows)
})



//Crear Cobros
app.post('/RegistrarCobros', async (req, res) => {
  try {
    // Obtener los datos de cobro(s) del body
    const cobros = req.body;


    const selectContadorQuery = `
      SELECT 
        IFNULL(
            (SELECT CONCAT('CV', LPAD(RIGHT(LEFT(Comprobante, 8), 6) + 1, 6, '0')) as Contador
            FROM ClientesMovimientos
            WHERE RIGHT(LEFT(Comprobante, 8), 6) REGEXP '^[0-9]{6}$'
            ORDER BY Comprobante DESC
            LIMIT 1),
            'CV000001'
        ) as Contador
    `;
    const [contadorResult] = await pool.query(selectContadorQuery);
    const nuevoContador = contadorResult[0].Contador;

    const selectContadorAAQuery = `
      SELECT 
        IFNULL(
            (SELECT CONCAT('AV', LPAD(RIGHT(LEFT(Numero, 8), 6) + 1, 6, '0')) as Contador
            FROM ClientesMovimientos
            WHERE RIGHT(LEFT(Comprobante, 8), 6) REGEXP '^[0-9]{6}$'
            and Tipo='AA'
            ORDER BY Numero DESC
            LIMIT 1),
            'AV000001'
        ) as Contador;
    `;
    const [contadorAAResult] = await pool.query(selectContadorAAQuery);
    const nuevoContadorAA = contadorAAResult[0].Contador;


    
    // Si es un solo cobro (objeto), lo convertimos a array para manejar uniformemente
    const cobrosArray = Array.isArray(cobros) ? cobros : [cobros];

    // Consulta SQL para insertar los cobros
    const insertQuery = `
      INSERT INTO ClientesMovimientos (
        CodigoCliente, Tipo, Numero, Emision, 
        Vencimiento, FechaDocumento, Comprobante, Importe, 
        TipoDocCancela, Vendedor, Importe2, Cambio, Moneda, 
        IdMoneda, CodigoBanco, NumeroReferencia, CodigoBancoOrigen, CodigoCaja,
        TotalCobro, TotalCobro2, FormaPago, 
        Comentarios
      ) 
      VALUES (
        ?, ?, ?, DATE_SUB(NOW(), INTERVAL 4 HOUR), 
        ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, '00001',
        ?, ?, ?,
        ?
      )`;

    // Procesar cada cobro
    for (const cobro of cobrosArray) {
      const insertValues = [
        cobro.CodigoCliente,
        cobro.Tipo,
        //cobro.Numero,
        cobro.Tipo === 'AA' ? nuevoContadorAA : cobro.Numero, // Condición para el número
        cobro.Vencimiento,
        cobro.FechaDocumento,
        nuevoContador,
        cobro.Importe,
        cobro.TipoDocCancela,
        cobro.Vendedor,
        cobro.Importe2,
        cobro.Cambio,
        cobro.Moneda,
        cobro.IdMoneda,
        cobro.CodigoBanco,
        cobro.NumeroReferencia,
        cobro.CodigoBancoOrigen,
        cobro.TotalCobro,
        cobro.TotalCobro2,
        cobro.FormaPago,
        cobro.Comentarios
      ];

      // Ejecutar la inserción
      await pool.query(insertQuery, insertValues);
    }

    // Respuesta exitosa
    res.status(200).json({ 
      message: 'Cobro(s) registrado(s) exitosamente',
      totalRegistros: cobrosArray.length 
    });

  } catch (error) {
    console.error('Error al registrar cobro(s):', error);
    res.status(500).json({ 
      error: 'Error al registrar cobro(s)',
      detalles: error.message 
    });
  }
});


// Endpoint para obtener historial de cobranza
app.get('/HistorialCobranzas', async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: 'El parámetro "fecha" es requerido en formato YYYY-MM-DD.' });
    }

    const queryPrincipal = `
      SELECT
        cm.CodigoCliente,
        MAX(c.Nombre) AS NombreCliente,
        cm.Comprobante,
        MAX(cm.Emision) AS Emision,
        MAX(cm.FechaDocumento) AS FechaTransferencia,
        MAX(cm.Cambio) AS Cambio,
        MAX(cm.Moneda) AS Moneda,
        ifnull(MAX(eb.Nombre),'') AS NombreBancoOrigen,
        ifnull(
          MAX(b.Nombre),
          (case 
            when MAX(cm.FormaPago)='EFE' AND MAX(cm.Moneda)='BsS'
              then 'EFECTIVO - BOLIVARES'
            when MAX(cm.FormaPago)='EFE' AND MAX(cm.Moneda)='$'
              then 'EFECTIVO - DOLARES'
            ELSE '' 
          end)
        ) AS NombreBanco,
        MAX(cm.NumeroReferencia) AS NumeroReferencia,
        MAX(cm.TotalCobro) AS TotalCobro,
        MAX(cm.TotalCobro2) AS TotalCobro2,
        MAX(cm.FormaPago) AS FormaPago,
        max(v.nombre) as NombreVendedor,
        ifnull(max(Comentarios),'') as Comentarios
      FROM ClientesMovimientos cm
      LEFT JOIN Clientes c ON c.CodigoCliente = cm.CodigoCliente
      LEFT JOIN Bancos b ON b.CodigoBanco = cm.CodigoBanco
      LEFT JOIN EntidadesBancarias eb ON eb.CodigoBanco = cm.CodigoBancoOrigen
      LEFT JOIN Vendedores v on v.codigo=cm.Vendedor
      WHERE DATE(cm.Emision) = ?
      GROUP BY cm.CodigoCliente, cm.Comprobante
      ORDER BY Emision ASC
    `;

    const [rows] = await pool.query(queryPrincipal, [fecha]);

    // Para cada resultado, obtener las facturas relacionadas
    const resultadosConFacturas = await Promise.all(rows.map(async (row) => {
      const queryFacturas = `
        SELECT Tipo, Numero, Importe, Cambio, Importe2
        FROM ClientesMovimientos
        WHERE Comprobante = ?
      `;

      const [facturas] = await pool.query(queryFacturas, [row.Comprobante]);

      return {
        ...row,
        Facturas: facturas
      };
    }));

    res.status(200).json(resultadosConFacturas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener la información', details: error.message });
  }
});

// Endpoint para obtener historial de cobranza por Vendedor
app.get('/HistorialCobranzasVendedor', async (req, res) => {
  try {
    const { fecha, vendedor } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: 'El parámetro "fecha" es requerido en formato YYYY-MM-DD.' });
    }

    const queryPrincipal = `
      SELECT
        cm.CodigoCliente,
        MAX(c.Nombre) AS NombreCliente,
        cm.Comprobante,
        MAX(cm.Emision) AS Emision,
        MAX(cm.FechaDocumento) AS FechaTransferencia,
        MAX(cm.Cambio) AS Cambio,
        MAX(cm.Moneda) AS Moneda,
        ifnull(MAX(eb.Nombre),'') AS NombreBancoOrigen,
        ifnull(
          MAX(b.Nombre),
          (case 
            when MAX(cm.FormaPago)='EFE' AND MAX(cm.Moneda)='BsS'
              then 'EFECTIVO - BOLIVARES'
            when MAX(cm.FormaPago)='EFE' AND MAX(cm.Moneda)='$'
              then 'EFECTIVO - DOLARES'
            ELSE '' 
          end)
        ) AS NombreBanco,
        MAX(cm.NumeroReferencia) AS NumeroReferencia,
        MAX(cm.TotalCobro) AS TotalCobro,
        MAX(cm.TotalCobro2) AS TotalCobro2,
        MAX(cm.FormaPago) AS FormaPago,
        max(v.nombre) as NombreVendedor,
        ifnull(max(Comentarios),'') as Comentarios
      FROM ClientesMovimientos cm
      LEFT JOIN Clientes c ON c.CodigoCliente = cm.CodigoCliente
      LEFT JOIN Bancos b ON b.CodigoBanco = cm.CodigoBanco
      LEFT JOIN EntidadesBancarias eb ON eb.CodigoBanco = cm.CodigoBancoOrigen
      LEFT JOIN Vendedores v on v.codigo=cm.Vendedor
      WHERE DATE(cm.Emision) = ?
      AND cm.Vendedor = ?
      GROUP BY cm.CodigoCliente, cm.Comprobante
      ORDER BY Emision ASC
    `;

    const [rows] = await pool.query(queryPrincipal, [fecha, vendedor]);

    // Para cada resultado, obtener las facturas relacionadas
    const resultadosConFacturas = await Promise.all(rows.map(async (row) => {
      const queryFacturas = `
        SELECT Tipo, Numero, Importe, Cambio, Importe2
        FROM ClientesMovimientos
        WHERE Comprobante = ?
      `;

      const [facturas] = await pool.query(queryFacturas, [row.Comprobante]);

      return {
        ...row,
        Facturas: facturas
      };
    }));

    res.status(200).json(resultadosConFacturas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener la información', details: error.message });
  }
});

// Endpoint para obtener historial de cobranza por Supervisor
app.get('/HistorialCobranzasSupervisor', async (req, res) => {
  try {
    const { fecha, vendedor } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: 'El parámetro "fecha" es requerido en formato YYYY-MM-DD.' });
    }

    const queryPrincipal = `
      SELECT
        cm.CodigoCliente,
        MAX(c.Nombre) AS NombreCliente,
        cm.Comprobante,
        MAX(cm.Emision) AS Emision,
        MAX(cm.FechaDocumento) AS FechaTransferencia,
        MAX(cm.Cambio) AS Cambio,
        MAX(cm.Moneda) AS Moneda,
        ifnull(MAX(eb.Nombre),'') AS NombreBancoOrigen,
        ifnull(
          MAX(b.Nombre),
          (case 
            when MAX(cm.FormaPago)='EFE' AND MAX(cm.Moneda)='BsS'
              then 'EFECTIVO - BOLIVARES'
            when MAX(cm.FormaPago)='EFE' AND MAX(cm.Moneda)='$'
              then 'EFECTIVO - DOLARES'
            ELSE '' 
          end)
        ) AS NombreBanco,
        MAX(cm.NumeroReferencia) AS NumeroReferencia,
        MAX(cm.TotalCobro) AS TotalCobro,
        MAX(cm.TotalCobro2) AS TotalCobro2,
        MAX(cm.FormaPago) AS FormaPago,
        max(v.nombre) as NombreVendedor,
        ifnull(max(Comentarios),'') as Comentarios
      FROM ClientesMovimientos cm
      LEFT JOIN Clientes c ON c.CodigoCliente = cm.CodigoCliente
      LEFT JOIN Bancos b ON b.CodigoBanco = cm.CodigoBanco
      LEFT JOIN EntidadesBancarias eb ON eb.CodigoBanco = cm.CodigoBancoOrigen
      LEFT JOIN Vendedores v on v.codigo=cm.Vendedor
      WHERE DATE(cm.Emision) = ?
      AND v.SupervisadoPor = ?
      GROUP BY cm.CodigoCliente, cm.Comprobante
      ORDER BY Emision ASC
    `;

    const [rows] = await pool.query(queryPrincipal, [fecha, vendedor]);

    // Para cada resultado, obtener las facturas relacionadas
    const resultadosConFacturas = await Promise.all(rows.map(async (row) => {
      const queryFacturas = `
        SELECT Tipo, Numero, Importe, Cambio, Importe2
        FROM ClientesMovimientos
        WHERE Comprobante = ?
      `;

      const [facturas] = await pool.query(queryFacturas, [row.Comprobante]);

      return {
        ...row,
        Facturas: facturas
      };
    }));

    res.status(200).json(resultadosConFacturas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener la información', details: error.message });
  }
});



app.get('/create', async (req, res) => {
  const result = await pool.query('INSERT INTO Pedidos VALUES ("PE000002", "2023-03-26 14:35:41", "2023-03-26 14:35:41", "V-26036875", 250.00, 0.00, 40.00, 0.00, 290.00, 0.00, "001", "BLA BLA BLA", "A", "01", NULL, "PE", "LUIS", 25.00, "$", 10.00, 0.00, 1.60, 0.00, 11.60, 2, NULL)')
  res.json(result)
})

app.listen(PORT)
console.log('Server on port', PORT)
