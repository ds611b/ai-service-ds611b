// models/index.js
import Roles from './Roles.js';
import Usuarios from './Usuarios.js';
import PerfilUsuario from './PerfilUsuario.js';
import Instituciones from './Instituciones.js';
import ProyectosInstitucion from './ProyectosInstitucion.js';
import AplicacionesEstudiantes from './AplicacionesEstudiantes.js';
import Habilidades from './Habilidades.js';
import UsuariosHabilidades from './UsuariosHabilidades.js';
import ProyectosInstitucionesHabilidades from './ProyectosInstitucionesHabilidades.js';
import Carreras from './Carreras.js'; 
import Escuelas from './Escuelas.js';
import CoordinadoresCarrera from './CoordinadoresCarrera.js';
import BitacoraProyectoBitacoraItems from './BitacoraProyectoBitacoraItems.js'; 
import ContactoEmergencia from './ContactoEmergencia.js';
import ActividadesProyecto from './ActividadesProyecto.js';
import BitacoraProyecto from './BitacoraProyecto.js';
import BitacoraPerfilUsuario from './BitacoraPerfilUsuario.js';
import BitacoraItems from './BitacoraItems.js';
import EncargadoInstitucion from './EncargadoInstitucion.js'; 
import ChatbotConversation from './ChatbotConversation.js';
import ConversationSession from './ConversationSession.js';
import Conversation from './Conversation.js';


// Definir relaciones

// Roles y Usuarios (1:N)
Roles.hasMany(Usuarios, { foreignKey: 'rol_id', onDelete: 'RESTRICT' });
Usuarios.belongsTo(Roles, { foreignKey: 'rol_id', onDelete: 'RESTRICT' });

// Usuarios y PerfilUsuario (1:1)
Usuarios.hasOne(PerfilUsuario, { foreignKey: 'usuario_id', as: 'perfil' , onDelete: 'CASCADE' });
PerfilUsuario.belongsTo(Usuarios, { foreignKey: 'usuario_id', as:  'usuario', onDelete: 'CASCADE' });


// Instituciones y ProyectosInstitucion (1:N)
Instituciones.hasMany(ProyectosInstitucion, { foreignKey: 'institucion_id', onDelete: 'CASCADE' });
ProyectosInstitucion.belongsTo(Instituciones, { foreignKey: 'institucion_id', as: 'institucion', onDelete: 'CASCADE' });

// AplicacionesEstudiantes con Usuarios y ProyectosInstitucion (N:M indirecto)
AplicacionesEstudiantes.belongsTo(Usuarios, { foreignKey: 'estudiante_id', as: 'estudiante', onDelete: 'CASCADE' });
AplicacionesEstudiantes.belongsTo(ProyectosInstitucion, { foreignKey: 'proyecto_id', as: 'proyecto', onDelete: 'CASCADE' });
Usuarios.hasMany(AplicacionesEstudiantes, { foreignKey: 'estudiante_id', as: 'aplicacionesEstudiantes', onDelete: 'CASCADE' });
ProyectosInstitucion.hasMany(AplicacionesEstudiantes, { foreignKey: 'proyecto_id', as: 'aplicacionEstudiante' ,  onDelete: 'CASCADE' });

// Usuarios y Habilidades (N:M)
Usuarios.belongsToMany(Habilidades, { through: UsuariosHabilidades, foreignKey: 'usuario_id', onDelete: 'CASCADE' });
Habilidades.belongsToMany(Usuarios, { through: UsuariosHabilidades, foreignKey: 'habilidad_id', onDelete: 'CASCADE' });

// ProyectosInstitucion y Habilidades (N:M)
ProyectosInstitucion.belongsToMany(Habilidades, { through: ProyectosInstitucionesHabilidades, foreignKey: 'proyecto_id', onDelete: 'CASCADE' });
Habilidades.belongsToMany(ProyectosInstitucion, { through: ProyectosInstitucionesHabilidades, foreignKey: 'habilidad_id', onDelete: 'CASCADE' });
ProyectosInstitucionesHabilidades.belongsTo(ProyectosInstitucion, { foreignKey: 'proyecto_id', as: 'proyecto' });
ProyectosInstitucionesHabilidades.belongsTo(Habilidades, { foreignKey: 'habilidad_id', as: 'habilidades', onDelete: 'CASCADE' });

// UsuariosHabilidades y Habilidades (N:M)
UsuariosHabilidades.belongsTo(Usuarios, {  foreignKey: 'usuario_id',  as: 'usuario'});
UsuariosHabilidades.belongsTo(Habilidades, {  foreignKey: 'habilidad_id',  as: 'habilidad',  onDelete: 'CASCADE'});
Habilidades.hasMany(UsuariosHabilidades, {  foreignKey: 'habilidad_id',  as: 'habilidadesUsuarios',  onDelete: 'CASCADE'});


// CoordinadoresCarrera y Carreras (1:N)
CoordinadoresCarrera.belongsTo(Carreras, {  foreignKey: 'id_carrera',  onDelete: 'CASCADE'});


// Carreras y Escuelas (N:1)
Carreras.belongsTo(Escuelas, {  foreignKey: 'id_escuela', as: 'escuela',  onDelete: 'CASCADE'});


// Escuelas y Carreras (1:N)
PerfilUsuario.belongsTo(Carreras, {  foreignKey: 'id_carrera',  as: 'carrera',  onDelete: 'SET NULL'});
Carreras.hasMany(PerfilUsuario, {  foreignKey: 'id_carrera',  as: 'perfiles'});


// ContactoEmergencia y PerfilUsuario (1:N)
ContactoEmergencia.belongsTo(PerfilUsuario, {  foreignKey: 'id_perfil_usuario',  onDelete: 'CASCADE'});


// ActividadesProyecto y ProyectosInstitucion (N:1)
ActividadesProyecto.belongsTo(ProyectosInstitucion, {  foreignKey: 'id_proyecto',  onDelete: 'CASCADE'});


// BitacoraProyecto y ProyectosInstitucion (N:1)
BitacoraProyecto.belongsTo(ProyectosInstitucion, {  foreignKey: 'id_proyecto',  onDelete: 'CASCADE'});

// BitacoraProyecto y ActividadesProyecto (N:1)
BitacoraPerfilUsuario.belongsTo(BitacoraProyecto, {  foreignKey: 'id_bitacora',  onDelete: 'CASCADE'});
BitacoraPerfilUsuario.belongsTo(PerfilUsuario, {  foreignKey: 'id_perfil_usuario',  onDelete: 'CASCADE'});

// BitacoraItems y BitacoraProyecto (N:1)
BitacoraProyectoBitacoraItems.belongsTo(BitacoraProyecto, {  foreignKey: 'id_bitacora',  onDelete: 'CASCADE'});
BitacoraProyectoBitacoraItems.belongsTo(BitacoraItems, { foreignKey: 'id_bitacora_item',  onDelete: 'CASCADE'});


ConversationSession.hasMany(Conversation, {  foreignKey: 'conversationId',  sourceKey: 'conversationId',  as: 'conversations'});
Conversation.belongsTo(ConversationSession, {  foreignKey: 'conversationId',  targetKey: 'conversationId',  as: 'session'});



// Exportar todos los modelos
export {
  Roles,
  Usuarios,
  PerfilUsuario,
  Instituciones,
  ProyectosInstitucion,
  AplicacionesEstudiantes,
  Habilidades,
  UsuariosHabilidades,
  ProyectosInstitucionesHabilidades,
  Carreras,
  Escuelas,
  CoordinadoresCarrera,
  BitacoraProyectoBitacoraItems,
  ContactoEmergencia,
  ActividadesProyecto,
  BitacoraProyecto,
  BitacoraPerfilUsuario,
  BitacoraItems,
  EncargadoInstitucion,
  ChatbotConversation,
  ConversationSession,
  Conversation
};