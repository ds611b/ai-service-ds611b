import { ConfiguracionIA } from '../models/index.js';
import { cache } from './CacheService.js';

/**
 * Lectura de la configuración de IA (chatbot / recomendaciones) para enforcement.
 *
 * - Cacheada 60s: la config cambia poco y así no se consulta la BD en cada request.
 * - Fail-open: si la tabla aún no existe o la BD falla, se asume TODO activo.
 *   Así el servicio sigue funcionando aunque no se haya corrido el script SQL,
 *   y la feature "se activa" sola cuando la tabla esté disponible.
 */

const CACHE_KEY = 'configuracion_ia';
const TTL_MS = 60 * 1000;
const POR_DEFECTO = {
  chatbot_activo: true,
  recomendaciones_activo: true,
  extraccion_habilidades_activo: true
};

async function getConfiguracionIA() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
    const config = await ConfiguracionIA.findByPk(1);
    const valor = config
      ? {
          chatbot_activo: !!config.chatbot_activo,
          recomendaciones_activo: !!config.recomendaciones_activo,
          extraccion_habilidades_activo: !!config.extraccion_habilidades_activo
        }
      : POR_DEFECTO;

    cache.set(CACHE_KEY, valor, TTL_MS);
    return valor;
  } catch (error) {
    // Fail-open: no bloquear la IA por un problema de configuración.
    console.warn('No se pudo leer ConfiguracionIA, se asume todo activo:', error?.message);
    return POR_DEFECTO;
  }
}

export async function isChatbotActivo() {
  return (await getConfiguracionIA()).chatbot_activo;
}

export async function isRecomendacionesActivo() {
  return (await getConfiguracionIA()).recomendaciones_activo;
}

export async function isExtraccionHabilidadesActivo() {
  return (await getConfiguracionIA()).extraccion_habilidades_activo;
}
