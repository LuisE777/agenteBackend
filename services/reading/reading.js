const fs = require('fs').promises;
const path = require('path');

/**
 * Lee todo el contenido de los archivos de una carpeta
 * @param {string} folderName - Nombre de la carpeta a leer
 * @returns {Promise<Object>} Objeto con el contenido de todos los archivos
 */
async function readAllFilesFromFolder(folderName) {
    try {
        const folderPath = path.join(__dirname,'..', '..', 'docs', 'topics', folderName);
        
        // Verificar si la carpeta existe
        await fs.access(folderPath);
        
        // Leer todos los archivos de la carpeta
        const files = await fs.readdir(folderPath);
        
        // Filtrar solo archivos .txt (opcional, ajusta según necesites)
        const txtFiles = files.filter(file => file.endsWith('.txt'));
        
        const fileContents = {};
        
        // Leer el contenido de cada archivo
        for (const file of txtFiles) {
            const filePath = path.join(folderPath, file);
            const content = await fs.readFile(filePath, 'utf8');
            fileContents[file] = content;
        }
        
        return fileContents;
        
    } catch (error) {
        throw new Error(`Error al leer la carpeta '${folderName}': ${error.message}`);
    }
}

/**
 * Lee el contenido de un número específico de archivos aleatorios de una carpeta
 * @param {string} folderName - Nombre de la carpeta a leer
 * @param {number} numberOfFiles - Número de archivos aleatorios a leer
 * @returns {Promise<Object>} Objeto con el contenido de los archivos seleccionados
 */
async function readRandomFilesFromFolder(folderName, numberOfFiles) {
    try {
        const folderPath = path.join(__dirname,'..', '..', 'docs', 'topics', 'agencia');
        console.log(__dirname)
        // Verificar si la carpeta existe
        await fs.access(folderPath);
        
        // Leer todos los archivos de la carpeta
        const files = await fs.readdir(folderPath);
        
        // Filtrar solo archivos .txt (opcional, ajusta según necesites)
        const txtFiles = files.filter(file => file.endsWith('.txt'));
        
        if (txtFiles.length === 0) {
            throw new Error(`No se encontraron archivos .txt en la carpeta '${folderName}'`);
        }
        
        if (numberOfFiles > txtFiles.length) {
            throw new Error(`Se solicitan ${numberOfFiles} archivos, pero solo hay ${txtFiles.length} disponibles`);
        }
        
        // Seleccionar archivos aleatorios
        const shuffled = [...txtFiles].sort(() => 0.5 - Math.random());
        const selectedFiles = shuffled.slice(0, numberOfFiles);
        
        const fileContents = {};
        
        // Leer el contenido de cada archivo seleccionado
        for (const file of selectedFiles) {
            const filePath = path.join(folderPath, file);
            const content = await fs.readFile(filePath, 'utf8');
            fileContents[file] = content;
        }
        
        return fileContents;
        
    } catch (error) {
        throw new Error(`Error al leer archivos aleatorios de la carpeta '${folderName}': ${error.message}`);
    }
}


// Exportar las funciones
module.exports = {
    readAllFilesFromFolder,
    readRandomFilesFromFolder
};