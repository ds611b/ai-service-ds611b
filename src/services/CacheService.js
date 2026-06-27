/**
 * CacheService — Caché en memoria con TTL (Time To Live) por clave.
 *
 * Por qué en memoria y no Redis u otro servicio externo:
 * Para el volumen actual es suficiente y no agrega dependencias.
 * Si en el futuro se necesita escalar a múltiples instancias del servidor,
 * se puede reemplazar esta implementación por Redis sin cambiar el código
 * que consume el caché (misma interfaz: get/set/delete).
 *
 * Seguridad en concurrencia:
 * Node.js es single-threaded, por lo que operaciones sobre el Map no
 * generan condiciones de carrera. Múltiples usuarios simultáneos son
 * seguros porque cada request se maneja en el mismo hilo de evento.
 *
 * Uso típico:
 *   import { cache, TTL } from './CacheService.js';
 *   const data = cache.get('mi_clave') ?? await fetchData();
 *   cache.set('mi_clave', data, TTL.SYSTEM_CONTEXT);
 */

class CacheService {
    constructor() {
        // Map<string, { value: any, expiresAt: number }>
        // Clave → valor + timestamp de expiración
        this.store = new Map();

        // Limpia entradas expiradas cada 5 minutos para liberar memoria.
        // unref() evita que el interval mantenga vivo el proceso de Node
        // si no hay más trabajo pendiente (útil en tests y en shutdown limpio).
        const timer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
        timer.unref();
    }

    /**
     * Guarda un valor en el caché con un tiempo de vida en milisegundos.
     *
     * @param {string} key - Clave única de la entrada
     * @param {*} value - Valor a cachear (cualquier tipo serializable)
     * @param {number} ttlMs - Tiempo de vida en milisegundos
     */
    set(key, value, ttlMs) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlMs
        });
    }

    /**
     * Recupera un valor del caché.
     * Si la entrada expiró, la elimina y retorna null.
     *
     * @param {string} key - Clave a buscar
     * @returns {*|null} - El valor cacheado, o null si no existe o expiró
     */
    get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            // Expiró: eliminamos la entrada y avisamos que no hay caché válido
            this.store.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Elimina una entrada del caché manualmente.
     * Útil para invalidar el caché de un usuario cuando sus datos cambian.
     *
     * @param {string} key - Clave a eliminar
     */
    delete(key) {
        this.store.delete(key);
    }

    /**
     * Recorre todas las entradas y elimina las que ya expiraron.
     * Se ejecuta automáticamente cada 5 minutos para liberar memoria.
     */
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
            }
        }
    }
}

/**
 * Instancia única del caché compartida por toda la aplicación (singleton).
 * Al ser un módulo ES, Node.js garantiza que solo se instancia una vez,
 * sin importar cuántas veces se importe en distintos archivos.
 */
export const cache = new CacheService();

/**
 * Tiempos de vida predefinidos para cada tipo de dato.
 * Se definen aquí para que sean fáciles de ajustar en un solo lugar.
 *
 * - SYSTEM_CONTEXT: proyectos, instituciones y carreras cambian raramente.
 *   10 minutos es seguro y reduce significativamente las queries a BD.
 *
 * - STUDENT_CONTEXT: habilidades y proyectos del estudiante cambian poco
 *   durante una sesión activa. 5 minutos balancea frescura vs. rendimiento.
 */
export const TTL = {
    SYSTEM_CONTEXT: 10 * 60 * 1000,                    // 10 minutos
    STUDENT_CONTEXT: 5 * 60 * 1000,                    //  5 minutos
    RECOMENDACION: 24 * 60 * 60 * 1000,                // 24 horas — resultado completo por usuario
    RECOMENDACION_HISTORIAL: 7 * 24 * 60 * 60 * 1000, //  7 días  — IDs ya recomendados (evita repetición)
};

// TODO (pendiente a futuro): RECOMENDACION y RECOMENDACION_HISTORIAL son datos
// con valor semántico (no solo rendimiento). Al vivir en memoria se pierden al
// reiniciar y no se comparten entre instancias, por lo que la anti-repetición
// puede fallar (proyectos repetidos). Migrar a persistencia (MySQL o Redis)
// cuando se escale a multi-instancia. Los caches *_CONTEXT sí pueden quedar en
// memoria: son solo rendimiento y un cache miss se recupera de la BD.
