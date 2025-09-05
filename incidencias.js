const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar token JWT
 */
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token inválido.' });
  }
};

/**
 * Middleware para verificar permisos de admin
 */
const verifyAdmin = (req, res, next) => {
  if (!req.user.permisos?.acceso_completo && !req.user.permisos?.puede_registrar_usuarios) {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
};

/**
 * @swagger
 * /api/incidencias:
 *   get:
 *     summary: Obtener todas las incidencias con paginación
 *     description: Retorna una lista paginada de todas las incidencias
 *     tags: [Incidencias]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Número de registros por página
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *           enum: [social, seguridad, ambiental, salud, otros]
 *         description: Filtrar por categoría
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, publicada, rechazada]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de incidencias obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       categoria:
 *                         type: string
 *                       descripcion:
 *                         type: string
 *                       ciudad_id:
 *                         type: integer
 *                       ciudad_nombre:
 *                         type: string
 *                       usuario_id:
 *                         type: integer
 *                       fecha_creacion:
 *                         type: string
 *                         format: date-time
 *                       estado:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */
// GET /incidencias - Obtener todas las incidencias con paginación
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const { categoria, estado } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    if (categoria) {
      whereConditions.push(`categoria = $${paramCounter}`);
      queryParams.push(categoria);
      paramCounter++;
    }

    if (estado) {
      whereConditions.push(`estado = $${paramCounter}`);
      queryParams.push(estado);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const totalQuery = `SELECT COUNT(*) as total FROM incidencias ${whereClause}`;
    const totalResult = await pool.query(totalQuery, queryParams);
    const total = parseInt(totalResult.rows[0].total);

    const mainQuery = `
      SELECT
        i.*,
        COALESCE(m.nombre, 'Sin ciudad') as ciudad_nombre
      FROM incidencias i
      LEFT JOIN municipios m ON i.ciudad_id = m.id
      ${whereClause}
      ORDER BY i.fecha_creacion DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(mainQuery, queryParams);

    res.status(200).json({
      success: true,
      data: result.rows,
      total: total,
      page: page,
      limit: limit
    });

  } catch (err) {
    console.error('Error al obtener incidencias:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la lista de incidencias'
    });
  }
});

/**
 * @swagger
 * /api/incidencias:
 *   post:
 *     summary: Crear una nueva incidencia
 *     description: Registra una nueva incidencia en el sistema (cualquiera puede crear, inicia en estado pendiente)
 *     tags: [Incidencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - categoria
 *               - descripcion
 *             properties:
 *               titulo:
 *                 type: string
 *                 maxLength: 255
 *               categoria:
 *                 type: string
 *                 enum: [social, seguridad, ambiental, salud, otros]
 *               descripcion:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 600
 *               ciudad_id:
 *                 type: integer
 *                 description: ID de la ciudad (referencia a municipios)
 *           example:
 *             titulo: "Problema de iluminación en parque"
 *             categoria: "seguridad"
 *             descripcion: "En el parque central hay falta de iluminación nocturna lo que genera inseguridad..."
 *             ciudad_id: 1
 *     responses:
 *       201:
 *         description: Incidencia creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 incidencia:
 *                   type: object
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Token requerido
 *       500:
 *         description: Error interno del servidor
 */
// POST /incidencias - Crear nueva incidencia (cualquiera con token)
router.post('/', verifyToken, async (req, res) => {
  const { titulo, categoria, descripcion, ciudad_id } = req.body;

  // Validaciones básicas
  if (!titulo || titulo.length > 255) {
    return res.status(400).json({ error: 'Título requerido y máximo 255 caracteres' });
  }
  if (!['social', 'seguridad', 'ambiental', 'salud', 'otros'].includes(categoria)) {
    return res.status(400).json({ error: 'Categoría inválida' });
  }
  if (!descripcion || descripcion.length < 10 || descripcion.length > 600) {
    return res.status(400).json({ error: 'Descripción requerida entre 10 y 600 caracteres' });
  }
  if (ciudad_id && (!Number.isInteger(ciudad_id) || ciudad_id <= 0)) {
    return res.status(400).json({ error: 'ID de ciudad debe ser un número entero positivo' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO incidencias (titulo, categoria, descripcion, ciudad_id, usuario_id, estado)
      VALUES ($1, $2, $3, $4, $5, 'pendiente')
      RETURNING *
    `, [titulo, categoria, descripcion, ciudad_id, req.user.id]);

    // Obtener la incidencia creada con el nombre de la ciudad
    if (result.rows.length > 0) {
      const incidenciaResult = await pool.query(`
        SELECT
          i.*,
          COALESCE(m.nombre, 'Sin ciudad') as ciudad_nombre
        FROM incidencias i
        LEFT JOIN municipios m ON i.ciudad_id = m.id
        WHERE i.id = $1
      `, [result.rows[0].id]);

      result.rows[0] = incidenciaResult.rows[0];
    }

    res.status(201).json({
      message: 'Incidencia creada exitosamente',
      incidencia: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la incidencia' });
  }
});

/**
 * @swagger
 * /api/incidencias/{id}:
 *   get:
 *     summary: Obtener una incidencia por ID
 *     description: Retorna la información completa de una incidencia específica
 *     tags: [Incidencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incidencia
 *     responses:
 *       200:
 *         description: Incidencia obtenida exitosamente
 *       404:
 *         description: Incidencia no encontrada
 *       500:
 *         description: Error interno del servidor
 */
// GET /incidencias/:id - Obtener incidencia por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        i.*,
        COALESCE(m.nombre, 'Sin ciudad') as ciudad_nombre
      FROM incidencias i
      LEFT JOIN municipios m ON i.ciudad_id = m.id
      WHERE i.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incidencia no encontrada' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la incidencia' });
  }
});

/**
 * @swagger
 * /api/incidencias/{id}:
 *   put:
 *     summary: Actualizar una incidencia
 *     description: Modifica los datos de una incidencia existente (Requiere permisos de administrador para cambiar estado)
 *     tags: [Incidencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incidencia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 maxLength: 255
 *               categoria:
 *                 type: string
 *                 enum: [social, seguridad, ambiental, salud, otros]
 *               descripcion:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 600
 *               ciudad_id:
 *                 type: integer
 *                 description: ID de la ciudad (referencia a municipios)
 *               estado:
 *                 type: string
 *                 enum: [pendiente, publicada, rechazada]
 *     responses:
 *       200:
 *         description: Incidencia actualizada exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Permisos insuficientes para cambiar estado
 *       404:
 *         description: Incidencia no encontrada
 *       500:
 *         description: Error interno del servidor
 */
// PUT /incidencias/:id - Actualizar incidencia
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { titulo, categoria, descripcion, ciudad_id, estado } = req.body;

  // Validaciones
  if (titulo && titulo.length > 255) {
    return res.status(400).json({ error: 'Título máximo 255 caracteres' });
  }
  if (categoria && !['social', 'seguridad', 'ambiental', 'salud', 'otros'].includes(categoria)) {
    return res.status(400).json({ error: 'Categoría inválida' });
  }
  if (descripcion && (descripcion.length < 10 || descripcion.length > 600)) {
    return res.status(400).json({ error: 'Descripción entre 10 y 600 caracteres' });
  }
  if (ciudad_id && (!Number.isInteger(ciudad_id) || ciudad_id <= 0)) {
    return res.status(400).json({ error: 'ID de ciudad debe ser un número entero positivo' });
  }
  if (estado && !['pendiente', 'publicada', 'rechazada'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  // Si se intenta cambiar el estado, verificar permisos de admin
  if (estado) {
    if (!req.user.permisos?.acceso_completo && !req.user.permisos?.puede_registrar_usuarios) {
      return res.status(403).json({ error: 'Solo administradores pueden cambiar el estado de las incidencias' });
    }
  }

  try {
    const result = await pool.query(`
      UPDATE incidencias
      SET titulo = COALESCE($1, titulo),
          categoria = COALESCE($2, categoria),
          descripcion = COALESCE($3, descripcion),
          ciudad_id = COALESCE($4, ciudad_id),
          estado = COALESCE($5, estado)
      WHERE id = $6
      RETURNING *
    `, [titulo, categoria, descripcion, ciudad_id, estado, id]);

    // Obtener la incidencia actualizada con el nombre de la ciudad
    if (result.rows.length > 0) {
      const incidenciaResult = await pool.query(`
        SELECT
          i.*,
          COALESCE(m.nombre, 'Sin ciudad') as ciudad_nombre
        FROM incidencias i
        LEFT JOIN municipios m ON i.ciudad_id = m.id
        WHERE i.id = $1
      `, [id]);

      result.rows[0] = incidenciaResult.rows[0];
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incidencia no encontrada' });
    }

    res.json({
      message: 'Incidencia actualizada exitosamente',
      incidencia: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la incidencia' });
  }
});

/**
 * @swagger
 * /api/incidencias/{id}/aprobar:
 *   put:
 *     summary: Aprobar una incidencia
 *     description: Cambia el estado de una incidencia a 'publicada' (Requiere permisos de administrador)
 *     tags: [Incidencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incidencia
 *     responses:
 *       200:
 *         description: Incidencia aprobada exitosamente
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Incidencia no encontrada
 *       500:
 *         description: Error interno del servidor
 */
// PUT /incidencias/:id/aprobar - Aprobar incidencia (solo admins)
router.put('/:id/aprobar', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      UPDATE incidencias
      SET estado = 'publicada'
      WHERE id = $1
      RETURNING *
    `, [id]);

    // Obtener la incidencia actualizada con el nombre de la ciudad
    if (result.rows.length > 0) {
      const incidenciaResult = await pool.query(`
        SELECT
          i.*,
          COALESCE(m.nombre, 'Sin ciudad') as ciudad_nombre
        FROM incidencias i
        LEFT JOIN municipios m ON i.ciudad_id = m.id
        WHERE i.id = $1
      `, [id]);

      result.rows[0] = incidenciaResult.rows[0];
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incidencia no encontrada' });
    }

    res.json({
      message: 'Incidencia aprobada exitosamente',
      incidencia: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al aprobar la incidencia' });
  }
});

/**
 * @swagger
 * /api/incidencias/{id}:
 *   delete:
 *     summary: Eliminar una incidencia
 *     description: Elimina una incidencia del sistema (Requiere permisos de administrador)
 *     tags: [Incidencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incidencia
 *     responses:
 *       200:
 *         description: Incidencia eliminada exitosamente
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Incidencia no encontrada
 *       500:
 *         description: Error interno del servidor
 */
// DELETE /incidencias/:id - Eliminar incidencia
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM incidencias WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incidencia no encontrada' });
    }

    res.json({ message: 'Incidencia eliminada exitosamente' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la incidencia' });
  }
});

/**
 * @swagger
 * /api/incidencias/ciudad/{id}:
 *   get:
 *     summary: Obtener incidencias por ciudad
 *     description: Retorna todas las incidencias de una ciudad específica con paginación
 *     tags: [Incidencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la ciudad/municipio
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Número de registros por página
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *           enum: [social, seguridad, ambiental, salud, otros]
 *         description: Filtrar por categoría
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, publicada, rechazada]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de incidencias de la ciudad obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       titulo:
 *                         type: string
 *                       categoria:
 *                         type: string
 *                       descripcion:
 *                         type: string
 *                       ciudad_id:
 *                         type: integer
 *                       ciudad_nombre:
 *                         type: string
 *                       usuario_id:
 *                         type: integer
 *                       fecha_creacion:
 *                         type: string
 *                         format: date-time
 *                       estado:
 *                         type: string
 *                 ciudad:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       404:
 *         description: Ciudad no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       500:
 *         description: Error interno del servidor
 */
// GET /incidencias/ciudad/:id - Obtener incidencias por ciudad
router.get('/ciudad/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const { categoria, estado } = req.query;

    // Validar que el ID sea un número entero válido
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID de ciudad debe ser un número entero positivo'
      });
    }

    // Verificar que la ciudad existe
    const ciudadResult = await pool.query('SELECT id, nombre FROM municipios WHERE id = $1', [id]);
    if (ciudadResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ciudad no encontrada'
      });
    }

    const ciudad = ciudadResult.rows[0];

    // Construir condiciones WHERE
    let whereConditions = ['ciudad_id = $1'];
    let queryParams = [id];
    let paramCounter = 2;

    if (categoria) {
      whereConditions.push(`categoria = $${paramCounter}`);
      queryParams.push(categoria);
      paramCounter++;
    }

    if (estado) {
      whereConditions.push(`estado = $${paramCounter}`);
      queryParams.push(estado);
      paramCounter++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Contar total de incidencias para la ciudad
    const totalQuery = `SELECT COUNT(*) as total FROM incidencias ${whereClause}`;
    const totalResult = await pool.query(totalQuery, queryParams);
    const total = parseInt(totalResult.rows[0].total);

    // Obtener incidencias paginadas
    const mainQuery = `
      SELECT
        i.*,
        COALESCE(m.nombre, 'Sin ciudad') as ciudad_nombre
      FROM incidencias i
      LEFT JOIN municipios m ON i.ciudad_id = m.id
      ${whereClause}
      ORDER BY i.fecha_creacion DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(mainQuery, queryParams);

    res.status(200).json({
      success: true,
      data: result.rows,
      ciudad: ciudad,
      total: total,
      page: page,
      limit: limit
    });

  } catch (err) {
    console.error('Error al obtener incidencias por ciudad:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las incidencias de la ciudad'
    });
  }
});

/**
 * @swagger
 * /api/incidencias/ciudades:
 *   get:
 *     summary: Obtener lista de ciudades disponibles
 *     description: Retorna la lista de municipios/ciudades disponibles para seleccionar en incidencias
 *     tags: [Incidencias]
 *     responses:
 *       200:
 *         description: Lista de ciudades obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *       500:
 *         description: Error interno del servidor
 */
// GET /incidencias/ciudades - Obtener ciudades disponibles
router.get('/ciudades', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM municipios ORDER BY nombre');

    res.json(result.rows);

  } catch (err) {
    console.error('Error al obtener ciudades:', err);
    res.status(500).json({ error: 'Error al obtener la lista de ciudades' });
  }
});

module.exports = router;
