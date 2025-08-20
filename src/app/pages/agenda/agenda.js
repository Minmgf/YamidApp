const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * @swagger
 * /api/agendas:
 *   get:
 *     summary: Obtener todas las agendas mensuales
 *     description: Retorna todas las agendas mensuales existentes
 *     tags: [Agendas]
 *     parameters:
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *         description: Filtrar por año específico
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Filtrar por mes específico (1-12)
 *     responses:
 *       200:
 *         description: Agendas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: integer
 *                 agendas:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Error interno del servidor
 *   post:
 *     summary: Crear una nueva agenda mensual
 *     description: Crea una nueva agenda para un mes y año específico
 *     tags: [Agendas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['titulo', 'mes', 'anio']
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título de la agenda mensual
 *               mes:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 description: Mes de la agenda (1-12)
 *               anio:
 *                 type: integer
 *                 minimum: 2020
 *                 description: Año de la agenda
 *               descripcion:
 *                 type: string
 *                 description: Descripción de la agenda mensual
 *               nota_asesor:
 *                 type: string
 *                 description: Notas del asesor sobre la agenda
 *           example:
 *             titulo: "Agenda Política Septiembre 2025"
 *             mes: 9
 *             anio: 2025
 *             descripcion: "Actividades de fortalecimiento territorial"
 *             nota_asesor: "Enfoque en municipios prioritarios"
 *     responses:
 *       201:
 *         description: Agenda creada exitosamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: Ya existe una agenda con ese título para el mes/año
 *       500:
 *         description: Error interno del servidor
 */
// GET /agendas - Obtener todas las agendas mensuales
router.get('/', async (req, res) => {
  try {
    const { anio, mes } = req.query;
    let query = 'SELECT * FROM agendas';
    const queryParams = [];

    // Agregar filtros si se proporcionan
    if (anio || mes) {
      const conditions = [];
      let paramCounter = 1;

      if (anio) {
        conditions.push(`anio = $${paramCounter}`);
        queryParams.push(parseInt(anio));
        paramCounter++;
      }

      if (mes) {
        conditions.push(`mes = $${paramCounter}`);
        queryParams.push(parseInt(mes));
        paramCounter++;
      }

      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY anio DESC, mes DESC, created_at DESC';

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      total: result.rows.length,
      agendas: result.rows
    });

  } catch (err) {
    console.error('Error al obtener agendas:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /agendas - Crear nueva agenda mensual
router.post('/', async (req, res) => {
  const { titulo, mes, anio, descripcion, nota_asesor } = req.body;

  try {
    // Validaciones
    if (!titulo || !mes || !anio) {
      return res.status(400).json({
        success: false,
        error: 'Los campos titulo, mes y anio son requeridos'
      });
    }

    if (mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        error: 'El mes debe estar entre 1 y 12'
      });
    }

    if (anio < 2020) {
      return res.status(400).json({
        success: false,
        error: 'El año debe ser mayor o igual a 2020'
      });
    }

    // Verificar si ya existe una agenda con el mismo título para ese mes/año
    const existingAgenda = await pool.query(
      'SELECT id FROM agendas WHERE titulo = $1 AND mes = $2 AND anio = $3',
      [titulo, mes, anio]
    );

    if (existingAgenda.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe una agenda con ese título para el mes y año especificado'
      });
    }

    // Crear la agenda
    const agendaResult = await pool.query(`
      INSERT INTO agendas (titulo, mes, anio, descripcion, nota_asesor)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, titulo, mes, anio, descripcion, nota_asesor, created_at, updated_at
    `, [titulo, mes, anio, descripcion || null, nota_asesor || null]);

    const agenda = agendaResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Agenda mensual creada exitosamente',
      agenda: agenda
    });

  } catch (err) {
    console.error('Error al crear agenda:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * @swagger
 * /api/agendas/{agenda_id}:
 *   get:
 *     summary: Obtener una agenda específica
 *     description: Retorna los detalles de una agenda mensual específica
 *     tags: [Agendas]
 *     parameters:
 *       - in: path
 *         name: agenda_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la agenda
 *     responses:
 *       200:
 *         description: Agenda obtenida exitosamente
 *       404:
 *         description: Agenda no encontrada
 *       500:
 *         description: Error interno del servidor
 *   put:
 *     summary: Actualizar una agenda mensual
 *     description: Actualiza los datos de una agenda mensual específica
 *     tags: [Agendas]
 *     parameters:
 *       - in: path
 *         name: agenda_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la agenda a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Título de la agenda mensual
 *               mes:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 description: Mes de la agenda (1-12)
 *               anio:
 *                 type: integer
 *                 minimum: 2020
 *                 description: Año de la agenda
 *               descripcion:
 *                 type: string
 *                 description: Descripción de la agenda mensual
 *               nota_asesor:
 *                 type: string
 *                 description: Notas del asesor sobre la agenda
 *           example:
 *             titulo: "Agenda Actualizada Septiembre 2025"
 *             descripcion: "Nueva descripción de actividades"
 *             nota_asesor: "Notas actualizadas del asesor"
 *     responses:
 *       200:
 *         description: Agenda actualizada exitosamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Agenda no encontrada
 *       409:
 *         description: Conflicto con agenda existente
 *       500:
 *         description: Error interno del servidor
 *   delete:
 *     summary: Eliminar una agenda mensual
 *     description: Elimina una agenda mensual y todos sus eventos asociados
 *     tags: [Agendas]
 *     parameters:
 *       - in: path
 *         name: agenda_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la agenda a eliminar
 *     responses:
 *       200:
 *         description: Agenda eliminada exitosamente
 *       404:
 *         description: Agenda no encontrada
 *       500:
 *         description: Error interno del servidor
 */
// GET /agendas/:agenda_id - Obtener agenda específica
router.get('/:agenda_id', async (req, res) => {
  const { agenda_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM agendas WHERE id = $1',
      [agenda_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agenda no encontrada'
      });
    }

    res.json({
      success: true,
      agenda: result.rows[0]
    });

  } catch (err) {
    console.error('Error al obtener agenda:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /agendas/:agenda_id - Actualizar agenda
router.put('/:agenda_id', async (req, res) => {
  const { agenda_id } = req.params;
  const { titulo, mes, anio, descripcion, nota_asesor } = req.body;

  try {
    // Verificar que la agenda existe
    const agendaCheck = await pool.query(
      'SELECT id FROM agendas WHERE id = $1',
      [agenda_id]
    );

    if (agendaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'La agenda especificada no existe'
      });
    }

    // Validaciones
    if (mes !== undefined && (mes < 1 || mes > 12)) {
      return res.status(400).json({
        success: false,
        error: 'El mes debe estar entre 1 y 12'
      });
    }

    if (anio !== undefined && anio < 2020) {
      return res.status(400).json({
        success: false,
        error: 'El año debe ser mayor o igual a 2020'
      });
    }

    // Construir la consulta de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];
    let paramCounter = 1;

    if (titulo !== undefined) {
      updateFields.push(`titulo = $${paramCounter}`);
      updateValues.push(titulo);
      paramCounter++;
    }

    if (mes !== undefined) {
      updateFields.push(`mes = $${paramCounter}`);
      updateValues.push(mes);
      paramCounter++;
    }

    if (anio !== undefined) {
      updateFields.push(`anio = $${paramCounter}`);
      updateValues.push(anio);
      paramCounter++;
    }

    if (descripcion !== undefined) {
      updateFields.push(`descripcion = $${paramCounter}`);
      updateValues.push(descripcion);
      paramCounter++;
    }

    if (nota_asesor !== undefined) {
      updateFields.push(`nota_asesor = $${paramCounter}`);
      updateValues.push(nota_asesor);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionaron campos para actualizar'
      });
    }

    // Agregar updated_at
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(agenda_id);

    const updateQuery = `
      UPDATE agendas
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING id, titulo, mes, anio, descripcion, nota_asesor, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Agenda actualizada exitosamente',
      agenda: result.rows[0]
    });

  } catch (err) {
    console.error('Error al actualizar agenda:', err);
    if (err.code === '23505') { // Unique constraint violation
      res.status(409).json({
        success: false,
        error: 'Ya existe una agenda con ese título para el mes y año especificado'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
});

// DELETE /agendas/:agenda_id - Eliminar agenda
router.delete('/:agenda_id', async (req, res) => {
  const { agenda_id } = req.params;

  try {
    // Verificar que la agenda existe
    const agendaCheck = await pool.query(
      'SELECT id FROM agendas WHERE id = $1',
      [agenda_id]
    );

    if (agendaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'La agenda especificada no existe'
      });
    }

    // Eliminar todos los eventos asociados primero (CASCADE debería hacerlo automáticamente)
    await pool.query('DELETE FROM eventos WHERE id_agenda = $1', [agenda_id]);

    // Eliminar la agenda
    await pool.query('DELETE FROM agendas WHERE id = $1', [agenda_id]);

    res.json({
      success: true,
      message: 'Agenda mensual y eventos asociados eliminados exitosamente'
    });

  } catch (err) {
    console.error('Error al eliminar agenda:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * @swagger
 * /api/agendas/{agenda_id}/eventos:
 *   get:
 *     summary: Obtener eventos de una agenda mensual
 *     description: Retorna todos los eventos de una agenda mensual específica
 *     tags: [Agendas]
 *     parameters:
 *       - in: path
 *         name: agenda_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la agenda
 *       - in: query
 *         name: municipio_id
 *         schema:
 *           type: integer
 *         description: Filtrar eventos por municipio
 *       - in: query
 *         name: fecha_inicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar eventos desde esta fecha
 *       - in: query
 *         name: fecha_fin
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar eventos hasta esta fecha
 *     responses:
 *       200:
 *         description: Eventos obtenidos exitosamente
 *       404:
 *         description: Agenda no encontrada
 *       500:
 *         description: Error interno del servidor
 *   post:
 *     summary: Agregar evento a una agenda mensual
 *     description: Crea un nuevo evento dentro de una agenda mensual específica
 *     tags: [Agendas]
 *     parameters:
 *       - in: path
 *         name: agenda_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la agenda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['nombre_evento', 'fecha', 'municipio_id']
 *             properties:
 *               nombre_evento:
 *                 type: string
 *                 description: Nombre del evento
 *               fecha:
 *                 type: string
 *                 format: date
 *                 description: Fecha del evento (YYYY-MM-DD)
 *               municipio_id:
 *                 type: integer
 *                 description: ID del municipio donde se realizará
 *               hora:
 *                 type: string
 *                 format: time
 *                 description: Hora del evento (HH:MM)
 *               lugar:
 *                 type: string
 *                 description: Lugar donde se realizará el evento
 *           example:
 *             nombre_evento: "Reunión con líderes comunitarios"
 *             fecha: "2025-09-15"
 *             municipio_id: 1
 *             hora: "14:30"
 *             lugar: "Centro Comunitario Principal"
 *     responses:
 *       201:
 *         description: Evento creado exitosamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Agenda o municipio no encontrado
 *       500:
 *         description: Error interno del servidor
 */
// GET /agendas/:agenda_id/eventos - Obtener eventos de una agenda
router.get('/:agenda_id/eventos', async (req, res) => {
  const { agenda_id } = req.params;
  const { municipio_id, fecha_inicio, fecha_fin } = req.query;

  try {
    // Verificar que la agenda existe y obtener información completa
    const agendaResult = await pool.query(
      'SELECT * FROM agendas WHERE id = $1',
      [agenda_id]
    );

    if (agendaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'La agenda especificada no existe'
      });
    }

    // Construir consulta de eventos con filtros opcionales
    let eventosQuery = `
      SELECT e.*, m.nombre as municipio_nombre
      FROM eventos e
      JOIN municipios m ON e.municipio_id = m.id
      WHERE e.id_agenda = $1
    `;

    const queryParams = [agenda_id];
    let paramCounter = 2;

    // Agregar filtros si se proporcionan
    if (municipio_id) {
      eventosQuery += ` AND e.municipio_id = $${paramCounter}`;
      queryParams.push(municipio_id);
      paramCounter++;
    }

    if (fecha_inicio) {
      eventosQuery += ` AND e.fecha >= $${paramCounter}`;
      queryParams.push(fecha_inicio);
      paramCounter++;
    }

    if (fecha_fin) {
      eventosQuery += ` AND e.fecha <= $${paramCounter}`;
      queryParams.push(fecha_fin);
      paramCounter++;
    }

    eventosQuery += ' ORDER BY e.fecha ASC, e.hora ASC';

    const eventosResult = await pool.query(eventosQuery, queryParams);

    res.json({
      success: true,
      agenda: agendaResult.rows[0],
      total_eventos: eventosResult.rows.length,
      eventos: eventosResult.rows
    });

  } catch (err) {
    console.error('Error al obtener eventos:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /agendas/:agenda_id/eventos - Agregar evento a agenda
router.post('/:agenda_id/eventos', async (req, res) => {
  const { agenda_id } = req.params;
  const { nombre_evento, fecha, municipio_id, hora, lugar } = req.body;

  try {
    // Validaciones
    if (!nombre_evento || !fecha || !municipio_id) {
      return res.status(400).json({
        success: false,
        error: 'Los campos nombre_evento, fecha y municipio_id son requeridos'
      });
    }

    // Verificar que la agenda existe
    const agendaCheck = await pool.query(
      'SELECT id, mes, anio FROM agendas WHERE id = $1',
      [agenda_id]
    );

    if (agendaCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'La agenda especificada no existe'
      });
    }

    // Verificar que el municipio existe
    const municipioCheck = await pool.query(
      'SELECT id, nombre FROM municipios WHERE id = $1',
      [municipio_id]
    );

    if (municipioCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'El municipio especificado no existe'
      });
    }

    // Validar que la fecha del evento esté dentro del mes/año de la agenda
    const fechaEvento = new Date(fecha);
    const agenda = agendaCheck.rows[0];

    if (fechaEvento.getMonth() + 1 !== agenda.mes || fechaEvento.getFullYear() !== agenda.anio) {
      return res.status(400).json({
        success: false,
        error: `El evento debe realizarse en ${agenda.mes}/${agenda.anio} según la agenda`
      });
    }

    // Crear el evento
    const eventoResult = await pool.query(`
      INSERT INTO eventos (id_agenda, nombre_evento, fecha, municipio_id, hora, lugar)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, id_agenda, nombre_evento, fecha, municipio_id, hora, lugar, created_at, updated_at
    `, [agenda_id, nombre_evento, fecha, municipio_id, hora || null, lugar || null]);

    const evento = eventoResult.rows[0];

    // Obtener nombre del municipio para la respuesta
    evento.municipio_nombre = municipioCheck.rows[0].nombre;

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      evento: evento
    });

  } catch (err) {
    console.error('Error al crear evento:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * @swagger
 * /api/agendas/eventos/{evento_id}:
 *   get:
 *     summary: Obtener un evento específico
 *     description: Retorna los detalles de un evento específico
 *     tags: [Agendas]
 *     parameters:
 *       - in: path
 *         name: evento_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del evento
 *     responses:
 *       200:
 *         description: Evento obtenido exitosamente
 *       404:
 *         description: Evento no encontrado
 *       500:
 *         description: Error interno del servidor
 *   put:
 *     summary: Actualizar un evento
 *     description: Actualiza los datos de un evento específico
 *     tags: [Agendas]
 *     parameters:
 *       - in: path
 *         name: evento_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del evento a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_evento:
 *                 type: string
 *                 description: Nombre del evento
 *               fecha:
 *                 type: string
 *                 format: date
 *                 description: Fecha del evento (YYYY-MM-DD)
 *               municipio_id:
 *                 type: integer
 *                 description: ID del municipio donde se realizará
 *               hora:
 *                 type: string
 *                 format: time
 *                 description: Hora del evento (HH:MM)
 *               lugar:
 *                 type: string
 *                 description: Lugar donde se realizará el evento
 *           example:
 *             nombre_evento: "Reunión actualizada"
 *             fecha: "2025-09-20"
 *             municipio_id: 2
 *             hora: "15:00"
 *             lugar: "Nuevo salón de eventos"
 *     responses:
 *       200:
 *         description: Evento actualizado exitosamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Evento no encontrado
 *       500:
 *         description: Error interno del servidor
 *   delete:
 *     summary: Eliminar un evento
 *     description: Elimina un evento específico
 *     tags: [Agendas]
 *     parameters:
 *       - in: path
 *         name: evento_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del evento a eliminar
 *     responses:
 *       200:
 *         description: Evento eliminado exitosamente
 *       404:
 *         description: Evento no encontrado
 *       500:
 *         description: Error interno del servidor
 */
// GET /agendas/eventos/:evento_id - Obtener evento específico
router.get('/eventos/:evento_id', async (req, res) => {
  const { evento_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT e.*, m.nombre as municipio_nombre, a.titulo as agenda_titulo
      FROM eventos e
      JOIN municipios m ON e.municipio_id = m.id
      JOIN agendas a ON e.id_agenda = a.id
      WHERE e.id = $1
    `, [evento_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      evento: result.rows[0]
    });

  } catch (err) {
    console.error('Error al obtener evento:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /agendas/eventos/:evento_id - Actualizar evento
router.put('/eventos/:evento_id', async (req, res) => {
  const { evento_id } = req.params;
  const { nombre_evento, fecha, municipio_id, hora, lugar } = req.body;

  try {
    // Verificar que el evento existe y obtener datos de la agenda
    const eventoCheck = await pool.query(`
      SELECT e.id, a.mes, a.anio
      FROM eventos e
      JOIN agendas a ON e.id_agenda = a.id
      WHERE e.id = $1
    `, [evento_id]);

    if (eventoCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'El evento especificado no existe'
      });
    }

    // Si se proporciona municipio_id, verificar que existe
    if (municipio_id) {
      const municipioCheck = await pool.query(
        'SELECT id FROM municipios WHERE id = $1',
        [municipio_id]
      );

      if (municipioCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'El municipio especificado no existe'
        });
      }
    }

    // Si se proporciona fecha, validar que esté dentro del mes/año de la agenda
    if (fecha) {
      const fechaEvento = new Date(fecha);
      const evento = eventoCheck.rows[0];

      if (fechaEvento.getMonth() + 1 !== evento.mes || fechaEvento.getFullYear() !== evento.anio) {
        return res.status(400).json({
          success: false,
          error: `El evento debe realizarse en ${evento.mes}/${evento.anio} según la agenda`
        });
      }
    }

    // Construir la consulta de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];
    let paramCounter = 1;

    if (nombre_evento !== undefined) {
      updateFields.push(`nombre_evento = $${paramCounter}`);
      updateValues.push(nombre_evento);
      paramCounter++;
    }

    if (fecha !== undefined) {
      updateFields.push(`fecha = $${paramCounter}`);
      updateValues.push(fecha);
      paramCounter++;
    }

    if (municipio_id !== undefined) {
      updateFields.push(`municipio_id = $${paramCounter}`);
      updateValues.push(municipio_id);
      paramCounter++;
    }

    if (hora !== undefined) {
      updateFields.push(`hora = $${paramCounter}`);
      updateValues.push(hora);
      paramCounter++;
    }

    if (lugar !== undefined) {
      updateFields.push(`lugar = $${paramCounter}`);
      updateValues.push(lugar);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionaron campos para actualizar'
      });
    }

    // Agregar updated_at
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(evento_id);

    const updateQuery = `
      UPDATE eventos
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING id, id_agenda, nombre_evento, fecha, municipio_id, hora, lugar, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      evento: result.rows[0]
    });

  } catch (err) {
    console.error('Error al actualizar evento:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /agendas/eventos/:evento_id - Eliminar evento
router.delete('/eventos/:evento_id', async (req, res) => {
  const { evento_id } = req.params;

  try {
    // Verificar que el evento existe
    const eventoCheck = await pool.query(
      'SELECT id FROM eventos WHERE id = $1',
      [evento_id]
    );

    if (eventoCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'El evento especificado no existe'
      });
    }

    // Eliminar el evento
    await pool.query('DELETE FROM eventos WHERE id = $1', [evento_id]);

    res.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });

  } catch (err) {
    console.error('Error al eliminar evento:', err);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/agendas/:id - Obtener agenda específica
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT
                a.id,
                a.titulo,
                a.mes,
                a.anio,
                a.descripcion,
                a.fecha_creacion,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', e.id,
                            'fecha', e.fecha,
                            'municipio_id', e.municipio_id,
                            'municipio_nombre', m.nombre,
                            'descripcion', e.descripcion
                        ) ORDER BY e.fecha
                    ) FILTER (WHERE e.id IS NOT NULL),
                    '[]'::json
                ) as eventos
            FROM agendas a
            LEFT JOIN eventos e ON a.id = e.agenda_id
            LEFT JOIN municipios m ON e.municipio_id = m.id
            WHERE a.id = $1
            GROUP BY a.id, a.titulo, a.mes, a.anio, a.descripcion, a.fecha_creacion
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Agenda no encontrada'
            });
        }

        res.json({
            success: true,
            agenda: result.rows[0]
        });
    } catch (error) {
        console.error('Error al obtener agenda:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// PUT /api/agendas/:id - Actualizar agenda
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, mes, anio, descripcion } = req.body;

        // Verificar que la agenda existe
        const existingAgenda = await pool.query('SELECT * FROM agendas WHERE id = $1', [id]);
        if (existingAgenda.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Agenda no encontrada'
            });
        }

        // Preparar campos a actualizar
        const updates = [];
        const values = [];
        let paramCounter = 1;

        if (titulo !== undefined) {
            updates.push(`titulo = $${paramCounter}`);
            values.push(titulo);
            paramCounter++;
        }

        if (mes !== undefined) {
            if (mes < 1 || mes > 12) {
                return res.status(400).json({
                    success: false,
                    message: 'El mes debe estar entre 1 y 12'
                });
            }
            updates.push(`mes = $${paramCounter}`);
            values.push(mes);
            paramCounter++;
        }

        if (anio !== undefined) {
            if (anio < 2020 || anio > 2050) {
                return res.status(400).json({
                    success: false,
                    message: 'El año debe estar entre 2020 y 2050'
                });
            }
            updates.push(`anio = $${paramCounter}`);
            values.push(anio);
            paramCounter++;
        }

        if (descripcion !== undefined) {
            updates.push(`descripcion = $${paramCounter}`);
            values.push(descripcion);
            paramCounter++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos para actualizar'
            });
        }

        // Verificar que no existe otra agenda con el mismo mes/año
        if (mes !== undefined || anio !== undefined) {
            const newMes = mes !== undefined ? mes : existingAgenda.rows[0].mes;
            const newAnio = anio !== undefined ? anio : existingAgenda.rows[0].anio;

            const duplicateCheck = await pool.query(
                'SELECT id FROM agendas WHERE mes = $1 AND anio = $2 AND id != $3',
                [newMes, newAnio, id]
            );

            if (duplicateCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe otra agenda para ${newMes}/${newAnio}`
                });
            }
        }

        values.push(id);
        const query = `UPDATE agendas SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Agenda actualizada exitosamente',
            agenda: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar agenda:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// DELETE /api/agendas/:id - Eliminar agenda
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la agenda existe
        const existingAgenda = await pool.query('SELECT * FROM agendas WHERE id = $1', [id]);
        if (existingAgenda.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Agenda no encontrada'
            });
        }

        // Eliminar eventos asociados primero
        await pool.query('DELETE FROM eventos WHERE agenda_id = $1', [id]);

        // Eliminar la agenda
        await pool.query('DELETE FROM agendas WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Agenda y sus eventos eliminados exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar agenda:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// ============= ENDPOINTS PARA EVENTOS =============

// POST /api/agendas/:agendaId/eventos - Crear evento en una agenda
router.post('/:agendaId/eventos', async (req, res) => {
    try {
        const { agendaId } = req.params;
        const { fecha, municipio_id, descripcion } = req.body;

        // Validaciones básicas
        if (!fecha || !municipio_id) {
            return res.status(400).json({
                success: false,
                message: 'Los campos fecha y municipio_id son obligatorios'
            });
        }

        // Verificar que la agenda existe
        const agendaQuery = 'SELECT * FROM agendas WHERE id = $1';
        const agendaResult = await pool.query(agendaQuery, [agendaId]);

        if (agendaResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Agenda no encontrada'
            });
        }

        const agenda = agendaResult.rows[0];

        // Verificar que la fecha esté dentro del mes/año de la agenda
        const eventDate = new Date(fecha);
        const eventMonth = eventDate.getMonth() + 1; // getMonth() retorna 0-11
        const eventYear = eventDate.getFullYear();

        if (eventMonth !== agenda.mes || eventYear !== agenda.anio) {
            return res.status(400).json({
                success: false,
                message: `La fecha debe estar dentro del mes ${agenda.mes}/${agenda.anio} de la agenda`
            });
        }

        // Verificar que el municipio existe
        const municipioQuery = 'SELECT id FROM municipios WHERE id = $1';
        const municipioResult = await pool.query(municipioQuery, [municipio_id]);

        if (municipioResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Municipio no encontrado'
            });
        }

        // Verificar que no existe otro evento en la misma fecha y municipio para esta agenda
        const duplicateCheck = await pool.query(
            'SELECT id FROM eventos WHERE agenda_id = $1 AND fecha = $2 AND municipio_id = $3',
            [agendaId, fecha, municipio_id]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un evento en esta fecha y municipio para esta agenda'
            });
        }

        // Crear el evento
        const insertQuery = `
            INSERT INTO eventos (agenda_id, fecha, municipio_id, descripcion)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(insertQuery, [agendaId, fecha, municipio_id, descripcion || null]);

        res.status(201).json({
            success: true,
            message: 'Evento creado exitosamente',
            evento: result.rows[0]
        });
    } catch (error) {
        console.error('Error al crear evento:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /api/agendas/:agendaId/eventos - Obtener eventos de una agenda
router.get('/:agendaId/eventos', async (req, res) => {
    try {
        const { agendaId } = req.params;
        const { municipio_id } = req.query;

        // Verificar que la agenda existe
        const agendaQuery = 'SELECT * FROM agendas WHERE id = $1';
        const agendaResult = await pool.query(agendaQuery, [agendaId]);

        if (agendaResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Agenda no encontrada'
            });
        }

        let query = `
            SELECT
                e.id,
                e.fecha,
                e.municipio_id,
                m.nombre as municipio_nombre,
                e.descripcion,
                e.fecha_creacion
            FROM eventos e
            LEFT JOIN municipios m ON e.municipio_id = m.id
            WHERE e.agenda_id = $1
        `;

        const params = [agendaId];

        if (municipio_id) {
            query += ` AND e.municipio_id = $2`;
            params.push(municipio_id);
        }

        query += ` ORDER BY e.fecha ASC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            total: result.rows.length,
            eventos: result.rows,
            agenda: agendaResult.rows[0]
        });
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// PUT /api/agendas/:agendaId/eventos/:eventoId - Actualizar evento
router.put('/:agendaId/eventos/:eventoId', async (req, res) => {
    try {
        const { agendaId, eventoId } = req.params;
        const { fecha, municipio_id, descripcion } = req.body;

        // Verificar que el evento existe y pertenece a la agenda
        const eventoQuery = 'SELECT * FROM eventos WHERE id = $1 AND agenda_id = $2';
        const eventoResult = await pool.query(eventoQuery, [eventoId, agendaId]);

        if (eventoResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado en esta agenda'
            });
        }

        // Verificar que la agenda existe
        const agendaQuery = 'SELECT * FROM agendas WHERE id = $1';
        const agendaResult = await pool.query(agendaQuery, [agendaId]);
        const agenda = agendaResult.rows[0];

        // Preparar campos a actualizar
        const updates = [];
        const values = [];
        let paramCounter = 1;

        if (fecha !== undefined) {
            // Verificar que la fecha esté dentro del mes/año de la agenda
            const eventDate = new Date(fecha);
            const eventMonth = eventDate.getMonth() + 1;
            const eventYear = eventDate.getFullYear();

            if (eventMonth !== agenda.mes || eventYear !== agenda.anio) {
                return res.status(400).json({
                    success: false,
                    message: `La fecha debe estar dentro del mes ${agenda.mes}/${agenda.anio} de la agenda`
                });
            }

            updates.push(`fecha = $${paramCounter}`);
            values.push(fecha);
            paramCounter++;
        }

        if (municipio_id !== undefined) {
            // Verificar que el municipio existe
            const municipioQuery = 'SELECT id FROM municipios WHERE id = $1';
            const municipioResult = await pool.query(municipioQuery, [municipio_id]);

            if (municipioResult.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Municipio no encontrado'
                });
            }

            updates.push(`municipio_id = $${paramCounter}`);
            values.push(municipio_id);
            paramCounter++;
        }

        if (descripcion !== undefined) {
            updates.push(`descripcion = $${paramCounter}`);
            values.push(descripcion);
            paramCounter++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos para actualizar'
            });
        }

        // Verificar duplicados si se cambió fecha o municipio
        if (fecha !== undefined || municipio_id !== undefined) {
            const newFecha = fecha !== undefined ? fecha : eventoResult.rows[0].fecha;
            const newMunicipio = municipio_id !== undefined ? municipio_id : eventoResult.rows[0].municipio_id;

            const duplicateCheck = await pool.query(
                'SELECT id FROM eventos WHERE agenda_id = $1 AND fecha = $2 AND municipio_id = $3 AND id != $4',
                [agendaId, newFecha, newMunicipio, eventoId]
            );

            if (duplicateCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro evento en esta fecha y municipio para esta agenda'
                });
            }
        }

        values.push(eventoId);
        const query = `UPDATE eventos SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Evento actualizado exitosamente',
            evento: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// DELETE /api/agendas/:agendaId/eventos/:eventoId - Eliminar evento
router.delete('/:agendaId/eventos/:eventoId', async (req, res) => {
    try {
        const { agendaId, eventoId } = req.params;

        // Verificar que el evento existe y pertenece a la agenda
        const eventoQuery = 'SELECT * FROM eventos WHERE id = $1 AND agenda_id = $2';
        const eventoResult = await pool.query(eventoQuery, [eventoId, agendaId]);

        if (eventoResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado en esta agenda'
            });
        }

        // Eliminar el evento
        await pool.query('DELETE FROM eventos WHERE id = $1', [eventoId]);

        res.json({
            success: true,
            message: 'Evento eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar evento:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

module.exports = router;
