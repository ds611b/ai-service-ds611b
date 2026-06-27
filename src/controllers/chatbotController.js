import { json } from "sequelize";
import {
  ConversationSession,
  Conversation,
  Usuarios,
  PerfilUsuario,
  Carreras,
  Escuelas,
  AplicacionesEstudiantes,
  ProyectosInstitucion,
  Instituciones,
  Habilidades,
  UsuariosHabilidades,
} from "../models/index.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/config.js";
import { cache, TTL } from "../services/CacheService.js";

/**
 * Instrucción de sistema del chatbot.
 * Este texto define el comportamiento, tono y reglas del asistente.
 * Se incluye en cada prompt que se envía a la IA para que siempre
 * recuerde cómo debe comportarse, sin importar qué pregunta el usuario.
 */
const SYSTEM_CONTEXT = `
    ## INSTRUCCIONES ##
    - Eres un tutor educativo amable y profesional.
    - tu nombre es  "Chatbot Tutor".
    - Responde en español, con claridad y precisión.
    - Considera el historial de la conversación para mantener coherencia.
    - Utiliza un tono amigable y accesible, evitando tecnicismos innecesarios.
    - que sean respuestas breves y concisas, evitando respuestas largas.
    - Si el estudiante pregunta sobre su perfil, proporciona información relevante.
    - Si el estudiante pregunta sobre su carrera, proporciona información relevante.
    - Si el estudiante pregunta sobre su escuela, proporciona información relevante.
    - Si el estudiante pregunta sobre sus proyectos, proporciona información relevante.
    - Si el estudiante pregunta sobre sus habilidades, proporciona información relevante.
    - Si el estudiante pregunta sobre sus aplicaciones, proporciona información relevante.
    - Si el estudiante pregunta algo fuera de contexto, sugiere volver al tema principal.
    `;

/**
 * Configuración e inicialización del cliente de Google Generative AI (Gemini).
 * Se instancia una sola vez al cargar el módulo para reutilizar la conexión
 * en todas las llamadas al chatbot.
 */
const genAI = new GoogleGenerativeAI(config.google.ai.apiKey);

/**
 * Instancia del modelo de IA con su configuración específica.
 * Esta instancia se reutiliza en cada mensaje para no re-crear la conexión.
 */
const aiModel = genAI.getGenerativeModel({
  // gemini-2.5-flash: disponible en API v1 estable, 1,500 req/día en free tier.
  model: "gemini-2.5-flash",

  // Filtros de seguridad para entorno educativo:
  // BLOCK_ONLY_HIGH = bloquea solo si la probabilidad de daño es muy alta
  // BLOCK_LOW_AND_ABOVE = más estricto, apropiado para contenido de odio
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_ONLY_HIGH",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_LOW_AND_ABOVE",
    },
  ],

  // Parámetros que controlan cómo genera el texto la IA
  generationConfig: {
    maxOutputTokens: 1500, // Suficiente para respuestas concisas del asistente
    temperature: 0.6, // Balance entre naturalidad y precisión para un asistente formal
  },

  // Instrucción de sistema: identidad base y normas universales que aplican a todos los roles.
  // Es lo primero que Gemini lee en cada llamada. Debe ser breve y neutral;
  // las instrucciones específicas por rol se inyectan en el prompt a través de getRoleContext().
  systemInstruction: {
    parts: [
      {
        text: `Eres el **Asesor Virtual** de **SSE Manager Pro**, la plataforma oficial de gestión del Servicio Social Estudiantil de ITCA-FEPADE.

Normas universales — aplican sin excepción en toda conversación:
- Responde siempre en **español formal y profesional**.
- Usa únicamente la información del usuario y del sistema que se te proporciona; nunca inventes datos ni funcionalidades.
- Si no tienes certeza sobre algo, indícalo con honestidad y sugiere contactar al soporte.
- No repitas saludos ni te presentes de nuevo si ya lo hiciste en el historial de la conversación.
- Sé conciso: párrafos breves, **negritas** para términos clave, viñetas para listas.
- Adapta tu tono y el alcance de tus respuestas según el rol del usuario indicado en el prompt.`,
      },
    ],
  },
});

/**
 * Retorna el texto de instrucción del sistema según el rol del usuario.
 * Este texto es la "personalidad" que tendrá la IA con cada tipo de usuario:
 * qué puede responder, cómo debe hablar, qué información es relevante para él.
 *
 * Se usa como CAPA 1 en buildPrompt — es lo primero que lee la IA antes del contexto y el mensaje.
 *
 * @param {number} rolId - ID del rol del usuario (viene de Usuarios.rol_id)
 * @returns {string} - Instrucciones del sistema para ese rol
 */
function getRoleContext(rolId) {
  switch (rolId) {
    case 1: // Estudiante ITCA-FEPADE
      return `## ROL ACTIVO: ESTUDIANTE

Estás atendiendo a un **Estudiante** de ITCA-FEPADE. Tu función es guiarle para que use SSE Manager Pro de forma efectiva.

## REGLAS DE COMPORTAMIENTO (prioridad alta)

- Responde únicamente sobre funciones disponibles para el rol Estudiante; si pregunta sobre algo de otro rol, indícale que no tiene acceso a esa función.
- Usa los datos personales del estudiante que se te proporcionan más abajo (nombre, carrera, escuela, habilidades, proyectos) para personalizar tus respuestas. Por ejemplo: si pregunta por sus proyectos, menciona los suyos por nombre.
- Cuando expliques cómo realizar una acción, indica siempre el nombre de la sección y la ruta a la que debe dirigirse.
- Si el estudiante reporta un problema técnico (datos no guardados, error en pantalla), indícale que verifique la información ingresada, recargue la página, y si persiste, contacte al soporte.
- No inventes funcionalidades, rutas ni datos. Si no tienes la información para responder con certeza, dilo con honestidad.
- Sé amable, claro y conciso.

## SECCIONES DEL SISTEMA Y CÓMO USARLAS

### Panel Principal — /dashboard
Pantalla de inicio. Muestra resumen del perfil, estadísticas de proyectos aplicados y horas completadas.
Acceso rápido a: perfil, proyectos actuales, explorar ofertas y solicitudes.

### Crear / Editar Perfil — /crear-perfil
Asistente de 4 pasos obligatorios:
1. Datos personales (nombres, apellidos, dirección, teléfono, fecha de nacimiento, género, carnet, carrera, año académico).
2. Contacto de emergencia (nombre, teléfono, dirección).
3. Selección de habilidades — **mínimo 5 requeridas**.
4. Confirmación y guardado.

### Mi Perfil — /perfil
Muestra los datos completos del estudiante: nombre, correo, carnet, dirección, teléfono, carrera, escuela, año académico y habilidades. Desde aquí puede ir a editar habilidades.

### Editar Habilidades — /editar-habilidades
Permite seleccionar y actualizar las habilidades registradas. Requisito: mantener al menos 5 habilidades activas.

### Buscar Proyectos — /buscar-proyectos
Catálogo de todos los proyectos disponibles y aprobados. Desde aquí el estudiante puede:
- Ver el detalle de un proyecto.
- Aplicar a un proyecto.
- Consultar el estado de aplicaciones anteriores (Pendiente / Aprobado / Rechazado).

### Mis Proyectos — /mis-proyectos
Lista de proyectos en los que el estudiante participa o ha aplicado. Muestra el estado (En proceso / Completado) y el avance de horas.

### Detalle y Registro de Horas — /mis-proyectos/:id
Vista de un proyecto específico. Desde aquí puede:
- Registrar horas de servicio (fecha, descripción de actividad, cantidad de horas).
- Editar o eliminar registros propios.
- Ver el estado de aprobación de cada registro y el motivo de rechazo si fue rechazado.
- Generar e imprimir el reporte oficial de actividades en PDF.

### Solicitud SSE — /solicitud-sse o /formulario-sse
Formulario para proponer un nuevo proyecto de servicio social. Requiere: institución, habilidades requeridas, días laborales, horario, fechas de inicio y fin, y aceptación de términos.

## FLUJO TÍPICO (para orientar al estudiante paso a paso)

1. Ir a **/crear-perfil** y completar los 4 pasos.
2. Ir a **/buscar-proyectos**, explorar y aplicar a un proyecto.
3. Revisar el estado de la solicitud en **/mis-proyectos**.
4. Una vez asignado, registrar horas semanalmente en **/mis-proyectos/:id**.
5. Al finalizar, generar el reporte PDF desde la misma vista de detalle.
`;

    case 2: // Coordinador ITCA-FEPADE
      // TODO: pega aquí el contexto para el rol Coordinador
      return ``;

    case 3: // Coordinador Escuela ITCA-FEPADE
      // TODO: pega aquí el contexto para el rol Coordinador Escuela
      return ``;

    case 4: // Institución (organismo privado o público)
      // TODO: pega aquí el contexto para el rol Institución
      return ``;

    default:
      // Fallback genérico si el rolId no coincide con ninguno esperado
      return `Eres un asistente virtual de la ITCA FEPADE. Responde en español con claridad.`;
  }
}

/**
 * Genera un ID único para identificar cada sesión de conversación.
 * Formato: "conv_<timestamp>_<cadena aleatoria>"
 * Ejemplo: "conv_1716900000000_a3f9xk2"
 * La combinación de timestamp + aleatorio garantiza que no haya duplicados.
 *
 * @returns {string} - ID único de conversación
 */
function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crea un objeto de respuesta de error con estructura estandarizada.
 * En desarrollo incluye detalles técnicos del error para facilitar el debug.
 * En producción esos detalles se omiten por seguridad.
 *
 * @param {string} message - Mensaje legible del error
 * @param {string} code - Código del error (ej: 'USER_NOT_FOUND')
 * @param {Error|null} error - Objeto de error de JavaScript (opcional)
 * @returns {Object} - { success: false, error: { code, message, details?, stack? } }
 */
function createErrorResponse(message, code, error = null) {
  return {
    success: false,
    error: {
      code,
      message,
      details: config.env === "development" ? error?.message : undefined,
      stack: config.env === "development" ? error?.stack : undefined,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS DEL CHATBOT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inicia una nueva sesión de conversación con el chatbot.
 * Crea una ConversationSession en BD y envía el mensaje de bienvenida.
 *
 * Flujo:
 * 1. Valida que el usuarioId exista en el cuerpo de la petición
 * 2. Verifica que el usuario exista en la BD
 * 3. Genera un conversationId único
 * 4. Crea la sesión (ConversationSession) en BD
 * 5. Guarda el mensaje de bienvenida como primer Conversation
 * 6. Retorna el conversationId y el mensaje de bienvenida al cliente
 *
 * El cliente debe guardar el conversationId para usarlo en llamadas posteriores.
 *
 * @route POST /api/chatbot/start
 */
export async function startConversation(request, reply) {
  const { usuarioId } = request.body;

  if (!usuarioId) {
    return reply
      .status(400)
      .send(
        createErrorResponse(
          "El ID de usuario es obligatorio",
          "MISSING_USER_ID",
        ),
      );
  }

  try {
    // Verifica que el usuario existe en la BD antes de crear la sesión
    const usuario = await Usuarios.findByPk(usuarioId, {
      attributes: ["id", "primer_nombre", "primer_apellido"],
    });

    if (!usuario) {
      return reply
        .status(404)
        .send(createErrorResponse("Usuario no encontrado", "USER_NOT_FOUND"));
    }

    const conversationId = generateConversationId();
    const welcomeMessage =
      "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?";

    // Crea la sesión que contendrá todos los mensajes de esta conversación
    await ConversationSession.create({
      conversationId,
      usuarioId,
      startTime: new Date(),
    });

    // Registra el mensaje de bienvenida como el primer mensaje de la sesión
    await Conversation.create({
      conversationId,
      userMessage: "INICIO_DE_CONVERSACION", // Marcador especial (no es un mensaje real del usuario)
      botResponse: welcomeMessage,
      timestamp: new Date(),
    });

    reply.status(201).send({
      success: true,
      conversationId,
      welcomeMessage,
      usuario: {
        id: usuario.id,
        nombre: `${usuario.primer_nombre} ${usuario.primer_apellido}`,
      },
    });
  } catch (error) {
    request.log.error(error);
    reply
      .status(500)
      .send(
        createErrorResponse(
          "Error al iniciar la conversación",
          "START_CONVERSATION_ERROR",
          error,
        ),
      );
  }
}

/**
 * Procesa un mensaje del usuario y genera una respuesta con IA.
 * Este es el endpoint principal del chatbot — aquí ocurre la llamada a Gemini.
 *
 * Flujo completo:
 * 1. Valida los campos obligatorios (message, conversationId, usuarioId)
 * 2. Verifica que el usuario sea dueño de esa conversación (seguridad)
 * 3. Recopila el contexto personal del estudiante (carrera, habilidades, proyectos)
 * 4. Recopila el contexto del sistema (todos los proyectos e instituciones disponibles)
 * 5. Recupera el historial de la conversación (últimos 10 mensajes)
 * 6. Construye el prompt completo combinando todo lo anterior
 * 7. Envía el prompt a Gemini y espera la respuesta
 * 8. Guarda el par mensaje-respuesta en la BD
 * 9. Retorna la respuesta al cliente
 *
 * @route POST /api/chatbot/message
 */
export async function sendMessage(request, reply) {
  const { message, conversationId, usuarioId } = request.body;

  // Validaciones de campos obligatorios
  if (!conversationId) {
    return reply
      .status(400)
      .send(
        createErrorResponse(
          "El ID de la conversación es obligatorio",
          "MISSING_CONVERSATION_ID",
        ),
      );
  }

  if (!message?.trim()) {
    return reply
      .status(400)
      .send(
        createErrorResponse("El mensaje no puede estar vacío", "EMPTY_MESSAGE"),
      );
  }

  if (!usuarioId) {
    return reply
      .status(400)
      .send(
        createErrorResponse(
          "El ID de usuario es obligatorio",
          "MISSING_USER_ID",
        ),
      );
  }

  try {
    // Control de acceso: verifica que el usuarioId sea el dueño de esa sesión
    const sesion = await ConversationSession.findOne({
      where: { conversationId, usuarioId },
    });

    if (!sesion) {
      return reply
        .status(403)
        .send(
          createErrorResponse(
            "No tienes permiso para acceder a esta conversación",
            "UNAUTHORIZED_CONVERSATION_ACCESS",
          ),
        );
    }

    const usuario = await Usuarios.findByPk(usuarioId);
    if (!usuario) {
      return reply
        .status(404)
        .send(createErrorResponse("Usuario no encontrado", "USER_NOT_FOUND"));
    }

    // ── CONSTRUCCIÓN DEL CONTEXTO PARA LA IA ──────────────────────────────

    // Instrucciones del sistema según el rol del usuario (personalidad y reglas de la IA)
    const roleContext = getRoleContext(usuario.rol_id);

    // Contexto del estudiante: datos personales, carrera, habilidades y proyectos inscritos
    const studentContext = await getStudentContext(usuarioId);

    // Historial: últimos 5 mensajes (reducido de 10 para optimizar tokens enviados a Gemini)
    const historial = await getConversationMessages(conversationId, 5);

    // sistemaContext (proyectos e instituciones) solo se inyecta en el primer mensaje.
    // La lista no cambia durante la sesión, así que no tiene sentido repetirla en cada turno.
    const isFirstMessage = historial.length === 0;
    const sistemaContext = isFirstMessage ? await getSystemContext() : null;

    // ── LLAMADA A LA IA ───────────────────────────────────────────────────

    // Construye el prompt final combinando: reglas del rol + contexto + historial + mensaje nuevo
    const fullPrompt = buildPrompt(
      message,
      studentContext,
      historial,
      sistemaContext,
      roleContext,
    );

    // Envía el prompt a Gemini y espera la respuesta generada
    const result = await aiModel.generateContent(fullPrompt);
    const response = await result.response;
    const botResponse = response.text(); // Extrae el texto de la respuesta

    // ── PERSISTENCIA ──────────────────────────────────────────────────────

    // Guarda el mensaje del usuario y la respuesta del bot en la BD (memoria del chat)
    const nuevoMensaje = await Conversation.create({
      conversationId,
      userMessage: message,
      botResponse,
      timestamp: new Date(),
    });

    reply.status(201).send({
      success: true,
      message: nuevoMensaje,
      context: {
        contextBotInicial: SYSTEM_CONTEXT,
        habilidades: studentContext.habilidades,
        escuela: studentContext.escuela,
        carrera: studentContext.carrera,
      },
    });
  } catch (error) {
    request.log.error(error);
    reply
      .status(500)
      .send(
        createErrorResponse(
          "Error al procesar el mensaje",
          "MESSAGE_PROCESSING_ERROR",
          error,
        ),
      );
  }
}

/**
 * Retorna el historial completo de mensajes de una conversación.
 * Se usa para restaurar el chat en el cliente cuando el usuario regresa.
 *
 * @route GET /api/chatbot/history/:conversationId
 */
export async function getConversationHistory(request, reply) {
  const { conversationId } = request.params;
  const { usuarioId } = request.query;

  if (!conversationId) {
    return reply
      .status(400)
      .send(
        createErrorResponse(
          "El ID de la conversación es obligatorio",
          "MISSING_CONVERSATION_ID",
        ),
      );
  }

  try {
    // Verifica que la sesión exista antes de retornar el historial
    const sesion = await ConversationSession.findOne({
      where: { conversationId },
    });

    console.log("Sesión encontrada:", JSON.stringify(sesion, null, 2));

    if (!sesion) {
      return reply
        .status(403)
        .send(
          createErrorResponse(
            "No tienes permiso para acceder a esta conversación",
            "UNAUTHORIZED_CONVERSATION_ACCESS",
          ),
        );
    }

    // Recupera todos los mensajes ordenados cronológicamente (más antiguo primero)
    const historial = await Conversation.findAll({
      where: { conversationId },
      order: [["timestamp", "ASC"]],
      attributes: ["id", "userMessage", "botResponse", "timestamp"],
    });

    console.log(
      "Historial de conversación:",
      JSON.stringify(historial, null, 2),
    );

    reply.send({
      success: true,
      conversationId,
      conversations: historial,
      startTime: sesion.startTime,
    });
  } catch (error) {
    request.log.error(error);
    reply
      .status(500)
      .send(
        createErrorResponse(
          "Error al obtener el historial de conversación",
          "GET_CONVERSATION_HISTORY_ERROR",
          error,
        ),
      );
  }
}

/**
 * Elimina una conversación completa: sus mensajes (Conversation) y su sesión (ConversationSession).
 * Solo el dueño de la conversación puede eliminarla.
 * Usa una transacción para garantizar que ambas eliminaciones ocurran o ninguna.
 *
 * @route DELETE /api/chatbot/conversations/:conversationId
 */
export async function deleteConversation(request, reply) {
  const { conversationId } = request.params;
  const { usuarioId } = request.body;

  if (!conversationId) {
    return reply
      .status(400)
      .send(
        createErrorResponse(
          "El ID de la conversación es obligatorio",
          "MISSING_CONVERSATION_ID",
        ),
      );
  }

  try {
    // Verifica que el usuarioId sea el dueño de la conversación antes de eliminar
    const sesion = await ConversationSession.findOne({
      where: { conversationId, usuarioId },
    });

    if (!sesion) {
      return reply
        .status(403)
        .send(
          createErrorResponse(
            "No tienes permiso para eliminar esta conversación",
            "UNAUTHORIZED_CONVERSATION_DELETION",
          ),
        );
    }

    // Transacción: si falla cualquier operación, se revierte todo (rollback automático)
    // Se usa la instancia de Sequelize asociada al modelo (Conversation.sequelize),
    // mismo patrón que el resto del proyecto, para no depender de un import suelto.
    await Conversation.sequelize.transaction(async (t) => {
      // Elimina todos los mensajes de la conversación primero
      await Conversation.destroy({
        where: { conversationId },
        transaction: t,
      });

      // Luego elimina la sesión contenedora
      await ConversationSession.destroy({
        where: { conversationId },
        transaction: t,
      });
    });

    reply.status(204).send(); // 204 = éxito sin contenido que retornar
  } catch (error) {
    request.log.error(error);
    reply
      .status(500)
      .send(
        createErrorResponse(
          "Error al eliminar la conversación",
          "CONVERSATION_DELETION_ERROR",
          error,
        ),
      );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES (usadas internamente, no son endpoints)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene el contexto general del sistema para enriquecer el prompt de la IA.
 * Incluye todos los proyectos disponibles, instituciones y carreras registradas.
 * Esto permite que el chatbot responda preguntas sobre opciones disponibles
 * aunque el estudiante no esté inscrito en ellas.
 *
 * Este contexto es compartido por todos los usuarios: una sola entrada en caché
 * sirve para todas las conversaciones simultáneas, evitando queries repetidas a la BD.
 *
 * @returns {Promise<Object>} - { proyectos, instituciones, carreras }
 */
async function getSystemContext() {
  // Revisa el caché antes de ir a la BD.
  // Si 50 usuarios envían un mensaje al mismo tiempo, solo el primero consulta la BD;
  // los 49 restantes obtienen el resultado del caché de forma instantánea.
  const cached = cache.get("system:context");
  if (cached) return cached;

  // Todos los proyectos de servicio social disponibles en la plataforma
  const proyectos = await ProyectosInstitucion.findAll({
    include: [
      {
        model: Instituciones,
        as: "institucion",
        attributes: ["id", "nombre"],
      },
    ],
  });

  // Todas las instituciones registradas
  const instituciones = await Instituciones.findAll({
    attributes: ["id", "nombre"],
  });

  // Todas las carreras con su escuela (para que la IA pueda responder sobre la oferta académica)
  const carreras = await Carreras.findAll({
    include: [
      {
        model: Escuelas,
        as: "escuela",
        attributes: ["id", "nombre"],
      },
    ],
    attributes: ["id", "nombre"],
  });

  // Formatea los datos en un objeto simple y lo guarda en caché
  const context = {
    proyectos: proyectos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
    })),
    instituciones: instituciones.map((i) => ({
      id: i.id,
      nombre: i.nombre,
    })),
    carreras: carreras.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      escuela: c.escuela ? c.escuela.nombre : "No especificada",
    })),
  };

  cache.set("system:context", context, TTL.SYSTEM_CONTEXT);
  return context;
}

/**
 * Obtiene el contexto personal del estudiante para personalizar la respuesta de la IA.
 * Hace una consulta con JOINs para traer en una sola llamada a la BD:
 * nombre, carrera, escuela, habilidades y proyectos en los que participa.
 *
 * Este contexto es clave para que la IA pueda dar respuestas como:
 * "Veo que estás en la carrera de Ingeniería y tienes habilidades en..."
 *
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Object|null>} - Datos del estudiante formateados, o null si no existe
 */
async function getStudentContext(usuarioId) {
  // Caché por usuario: cada estudiante tiene su propia clave.
  // Usuarios distintos nunca comparten ni sobreescriben el contexto del otro.
  const cacheKey = `student:${usuarioId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    console.log("Obteniendo contexto del estudiante con ID:", usuarioId);

    // Consulta al usuario con todas sus relaciones relevantes para la IA
    const estudiante = await Usuarios.findByPk(usuarioId, {
      include: [
        // Habilidades registradas del estudiante (relación N:M)
        {
          model: Habilidades,
          as: "Habilidades",
          through: {
            model: UsuariosHabilidades,
            as: "usuariosHabilidades",
          },
        },
        // Perfil con carrera y escuela anidadas (relación 1:1 → N:1 → N:1)
        {
          model: PerfilUsuario,
          as: "perfil",
          include: [
            {
              model: Carreras,
              as: "carrera",
              include: [
                {
                  model: Escuelas,
                  as: "escuela",
                },
              ],
            },
          ],
        },
        // Proyectos a los que aplicó el estudiante con estado de cada aplicación
        {
          model: AplicacionesEstudiantes,
          as: "aplicacionesEstudiantes",
          include: [
            {
              model: ProyectosInstitucion,
              as: "proyecto",
              include: [
                {
                  model: Instituciones,
                  as: "institucion",
                },
              ],
            },
          ],
        },
      ],
    });

    if (!estudiante) {
      console.log("Usuario no encontrado");
      return null;
    }
    // Extrae y simplifica los datos en un objeto plano listo para usar en el prompt
    const perfil = estudiante.perfil;
    const aplicaciones = estudiante.aplicacionesEstudiantes;
    const context = {
      contextBotInicial: SYSTEM_CONTEXT,
      nombre: `${estudiante.primer_nombre} ${estudiante.primer_apellido}`,
      carrera: perfil?.carrera?.nombre || "No especificada",
      escuela: perfil?.carrera?.escuela?.nombre || "No especificada",
      añoAcademico: perfil?.año_academico || "No especificado",
      habilidades: estudiante.Habilidades.map((h) => h.descripcion),
      proyectos: aplicaciones.map((app) => ({
        nombre: app.proyecto.nombre,
        institucion: app.proyecto.institucion.nombre,
        estado: app.estado, // 'Pendiente', 'Aprobado' o 'Rechazado'
      })),
    };

    cache.set(cacheKey, context, TTL.STUDENT_CONTEXT);
    return context;
  } catch (error) {
    console.error("Error al obtener contexto:", error);
    return null;
  }
}

/**
 * Recupera los últimos N mensajes de una conversación para usar como historial en el prompt.
 * Se ordenan de más reciente a más antiguo (DESC) y se limita a 10 para no sobrecargar el prompt.
 * En buildPrompt se invierten para mostrarlos en orden cronológico a la IA.
 *
 * @param {string} conversationId - ID de la conversación
 * @param {number} limit - Cantidad máxima de mensajes a recuperar (por defecto 10)
 * @returns {Promise<Array>} - Lista de mensajes recientes
 */
async function getConversationMessages(conversationId, limit = 10) {
  return Conversation.findAll({
    where: { conversationId },
    order: [["timestamp", "DESC"]], // Más recientes primero, para que el LIMIT traiga los últimos
    limit,
    attributes: ["userMessage", "botResponse", "timestamp"],
  });
}

/**
 * Construye el prompt completo que se envía al modelo de IA (Gemini).
 * El prompt es texto estructurado que combina 4 capas de información:
 *
 * 1. Instrucciones del sistema: quién es el bot, cómo debe comportarse, qué formato usar
 * 2. Contexto del sistema: proyectos e instituciones disponibles en la plataforma
 * 3. Contexto del estudiante: datos personales, carrera, habilidades, proyectos inscritos
 * 4. Historial: mensajes anteriores para que la IA mantenga coherencia en la conversación
 * 5. Mensaje nuevo: la pregunta actual del usuario
 *
 * Este enfoque de "prompt engineering" es lo que hace que la IA responda de forma
 * personalizada y contextualizada en lugar de dar respuestas genéricas.
 *
 * @param {string} message - Mensaje actual del usuario
 * @param {Object} context - Contexto personal del estudiante (de getStudentContext)
 * @param {Array} history - Historial de mensajes (de getConversationMessages)
 * @param {Object} sistemaContext - Contexto general del sistema (de getSystemContext)
 * @returns {string} - El prompt final listo para enviar a la IA
 */
function buildPrompt(message, context, history, sistemaContext, roleContext) {
  // ── CAPA 1: Instrucciones del sistema según el rol del usuario ─────────
  // roleContext viene de getRoleContext(usuario.rol_id) — cada rol tiene su propia personalidad
  let prompt = roleContext;

  // ── CAPA 2 y 3: Contexto del sistema + contexto personal del estudiante ─
  if (context) {
    // En el primer mensaje se incluye la lista de proyectos e instituciones de la plataforma.
    // En mensajes siguientes ya la IA los conoce, no hace falta repetirlos.
    if (sistemaContext) {
      prompt += `\n\nContexto de la plataforma:
    - Proyectos disponibles: ${sistemaContext.proyectos.map((p) => p.nombre).join(", ") || "No especificados"}
    - Instituciones participantes: ${sistemaContext.instituciones.map((i) => i.nombre).join(", ") || "No especificadas"}`;
    }

    prompt += `\n\nInformación del usuario:
    - Nombre: ${context.nombre}
    - Carrera: ${context.carrera}
    - Escuela: ${context.escuela}
    - Habilidades: ${context.habilidades.join(", ") || "No especificadas"}
    - Proyectos inscritos: ${context.proyectos.length > 0 ? context.proyectos.map((p) => `${p.nombre} (${p.institucion})`).join(", ") : "No especificados"}
    - Año académico: ${context.añoAcademico || "No especificado"}`;

    // Detalla el estado de cada proyecto en el que el estudiante participa
    if (context.proyectos.length > 0) {
      prompt += `\n\nProyectos en los que participa:`;
      context.proyectos.forEach((proyecto) => {
        prompt += `\n- ${proyecto.nombre} (${proyecto.institucion}): ${proyecto.estado}`;
      });
    }
  }

  // ── CAPA 4: Historial de conversación ─────────────────────────────────
  // Permite que la IA recuerde lo que se habló antes y no repita información
  if (history && history.length > 0) {
    prompt += `\n\nHistorial de la conversación:`;
    history.reverse().forEach((msg) => {
      // Se invierte para orden cronológico (más antiguo primero)
      prompt += `\nUsuario: ${msg.userMessage}`;
      prompt += `\nAsistente: ${msg.botResponse}`;
    });
  }

  // ── CAPA 5: Mensaje actual del usuario ────────────────────────────────
  prompt += `\n\nNuevo mensaje del usuario: ${message}`;
  prompt += `\nRespuesta del asistente:`; // Le indica a la IA que debe empezar a responder aquí

  return prompt;
}
