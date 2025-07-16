//import { pipeline } from '@xenova/transformers';
const fs = require('fs').promises;
const path = require('path');

class RAG {

    constructor() {
        // Aquí guardamos el modelo que convierte texto a números
        this.embedder = null;
        // Aquí guardamos todos nuestros documentos con sus "números"
        this.documentos = [];
        //archivo para guardar los embeddings
        this.rutaCache = path.resolve(__dirname, 'cache_embeddings.json');
    }


    // FUNCIÓN 1: Preparar el modelo que convierte texto a números
    async initialize() {
        console.log('🤖 Cargando modelo de IA...');
        // Este modelo convierte cualquier texto en una lista de números
        // Los textos similares tendrán números similares
        const { pipeline } = await import('@xenova/transformers');
        this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✅ Modelo listo');
    }

    // FUNCIÓN 2: Convertir texto a números (embedding)
    async textoANumeros(texto) {
        // Le pasamos el texto al modelo y nos devuelve números
        const resultado = await this.embedder(texto, { 
            pooling: 'mean',  // Promedio de todos los números
            normalize: true   // Normalizar para comparar mejor
        });
        
        // Convertir a array normal de JavaScript
        return Array.from(resultado.data);
    }

    // FUNCIÓN 3: Leer todos los archivos .txt de tu carpeta
    async cargarDocumentos(rutaCarpeta) {
        console.log('📁 Leyendo archivos...');
        
        const documentos = [];
        
        // Función para leer carpetas recursivamente
        const leerCarpeta = async (carpeta) => {
            const archivos = await fs.readdir(carpeta);
            
            for (const archivo of archivos) {
                const rutaCompleta = path.join(carpeta, archivo);
                const info = await fs.stat(rutaCompleta);
                
                if (info.isDirectory()) {
                    // Si es carpeta, entrar recursivamente
                    await leerCarpeta(rutaCompleta);
                } else if (archivo.endsWith('.txt')) {
                    // Si es archivo .txt, leerlo
                    const contenido = await fs.readFile(rutaCompleta, 'utf-8');
                    
                    documentos.push({
                        archivo: archivo,
                        contenido: contenido,
                        ruta: rutaCompleta
                    });
                }
            }
        };

        await leerCarpeta(rutaCarpeta);
        console.log(`📄 Encontrados ${documentos.length} documentos`);
        return documentos;
    }

    // FUNCIÓN 4: Procesar todos los documentos (convertirlos a númerpppppppppppos)
    async processDocuments(rutaCarpeta) {
        console.log('⚙️ Procesando documentos...');
        // Intentar cargar embeddings desde disco primero
        await this.cargarEmbeddings();
        if (this.documentos.length > 0) {
            console.log('🛑 Usando embeddings cargados, no es necesario reprocesar');
            return;
          }
        // Leer todos los archivos
        const documentos = await this.cargarDocumentos(rutaCarpeta);
        
        // Para cada documento, convertir su contenido a números
        for (let i = 0; i < documentos.length; i++) {
            const doc = documentos[i];
            
            console.log(`📊 Procesando ${i + 1}/${documentos.length}: ${doc.archivo}`);
            
            // Convertir el contenido del documento a números
            const numeros = await this.textoANumeros(doc.contenido);
            
            // Guardar el documento con sus números
            this.documentos.push({
                archivo: doc.archivo,
                contenido: doc.contenido,
                numeros: numeros,
                ruta: doc.ruta
            });
        }
        
        await this.guardarEmbeddings(this.documentos);

        console.log('✅ Todos los documentos procesados y guardados');
    }

    // FUNCIÓN 5: Buscar documentos similares a una pregunta
    async buscarSimilares(pregunta, cantidad = 3) {
        console.log('🔍 Buscando documentos relevantes...');
        
        // Convertir la pregunta a números
        const numerosPregunta = await this.textoANumeros(pregunta);
        
        // Calcular qué tan similar es la pregunta con cada documento
        const similitudes = [];
        
        for (const doc of this.documentos) {
            // Calcular similitud entre la pregunta y el documento
            const similitud = this.calcularSimilitud(numerosPregunta, doc.numeros);
            
            similitudes.push({
                documento: doc,
                similitud: similitud
            });
        }
        
        // Ordenar por similitud (más similares primero)
        similitudes.sort((a, b) => b.similitud - a.similitud);
        
        // Devolver solo los más similares
        return similitudes.slice(0, cantidad);
    }

    // FUNCIÓN 6: Calcular qué tan similares son dos listas de números
    calcularSimilitud(numeros1, numeros2) {
        // Esto se llama "similitud coseno"
        // Básicamente: si los números son parecidos, son similares
        
        let puntoProducto = 0;
        let norma1 = 0;
        let norma2 = 0;
        
        for (let i = 0; i < numeros1.length; i++) {
            puntoProducto += numeros1[i] * numeros2[i];
            norma1 += numeros1[i] * numeros1[i];
            norma2 += numeros2[i] * numeros2[i];
        }
        
        return puntoProducto / (Math.sqrt(norma1) * Math.sqrt(norma2));
    }

    // FUNCIÓN 7: Obtener contexto para enviar a Llama
    async getContext(pregunta) {
        // Buscar los 5 documentos más similares
        const similares = await this.buscarSimilares(pregunta, 10);
        // Juntar el contenido de los documentos similares
        const contexto = similares
            .map(item => `=== ${item.documento.archivo} ===\n${item.documento.contenido}`)
            .join('\n\n');
        
        // Información sobre qué archivos se usaron
        const fuentes = similares.map(item => ({
            archivo: item.documento.archivo,
            similitud: (item.similitud * 100).toFixed(1) + '%'
        }));
        
        return {
            context: contexto,
            source: fuentes
        };
    }
    //FUNCION 8 Guardar ebedding
      // Guardar documentos procesados con embeddings en disco
  async guardarEmbeddings(documentos) {
    try {
      await fs.writeFile(this.rutaCache, JSON.stringify(documentos, null, 2), 'utf-8');
      console.log('✅ Embeddings guardados en disco');
    } catch (error) {
      console.error('❌ Error guardando embeddings:', error);
    }
  }
  //FUNCION 8 cargar embeddings si existen , cargar documentos 
    async cargarEmbeddings() {
        try {
          const data = await fs.readFile(this.rutaCache, 'utf-8');
          this.documentos = JSON.parse(data);
          console.log(`✅ Cargados ${this.documentos.length} documentos con embeddings desde disco`);
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log('⚠️ No existe cache de embeddings, se generarán nuevos');
          } else {
            console.error('❌ Error cargando embeddings:', error);
          }
        }
      }
    

}

module.exports = RAG;