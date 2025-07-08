import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import prompts from 'prompts'; // <-- Añadir prompts

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    // Solicitar nombre del proyecto con prompts
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Nombre del nuevo proyecto:',
      validate: value => value.trim() === '' ? 'El nombre no puede estar vacío' : true
    });

    const projectName = response.projectName;

    // Rutas
    const templateDir = path.resolve(__dirname, '..'); // Raíz del proyecto base
    const newDir = path.join(templateDir, '..', projectName);

    // Copiar archivos excluyendo carpetas innecesarias
    await fs.copy(templateDir, newDir, {
      filter: (src) => {
        const excluded = ['node_modules', '.git'].some(item => src.includes(item));
        return !excluded;
      }
    });

    // Actualizar package.json
    const packagePath = path.join(newDir, 'package.json');
    const packageJson = await fs.readJson(packagePath);
    packageJson.name = projectName.toLowerCase().replace(/\s+/g, '-'); // Formatear nombre
    await fs.writeJson(packagePath, packageJson, { spaces: 2 });

    // Instalar dependencias
    console.log('Instalando dependencias...');
    execSync('npm install', { cwd: newDir, stdio: 'inherit' });

    console.log(`✅ Proyecto creado en: ${newDir}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();