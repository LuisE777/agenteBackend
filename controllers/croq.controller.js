const { GoogleGenerativeAI } = require('@google/generative-ai');
const RAG = require('../services/rag/rag');
const { readAllFilesFromFolder, readRandomFilesFromFolder } = require('../services/reading/reading');
const path = require('path');
require('dotenv').config();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const axios = require('axios');
const models = ['llama3-8b-8192', 'llama3-70b-8192'];

const fs = require('fs').promises;

// Usa tu propia API Key aquí
const API_KEY =  process.env.GEMINI_API_KEY;
// Inicializa la API
const genAI = new GoogleGenerativeAI(API_KEY);

// FUNCIÓN 1: Preparar el sistema RAG (solo una vez)
const prepareRAG = async () => {
  console.log('🚀 Inicializando sistema RAG...');
  //creando el sistema RAG
  const rag = new RAG();
  //inicializando el modelo de IA necesario 
  await rag.initialize();
  //procesando los documentos
  await rag.processDocuments('./docs/topics');
  return rag;
}



const start = (req, res) => {
  try {
    const htmlPath = path.join(__dirname, '../public/llama.html');
    res.sendFile(htmlPath);
  } catch (e) {
    res.status(500).send(`<h1>Error:</h1><pre>${e.toString()}</pre>`);
  }
}

const question = async (req, res) => {
  try {
    if (req.query.prompt.length === 0) throw new Error("Debe enviar un mensaje");
    const prompt = req.query.prompt;
    const chats = req.query.messages;
    //1) preparacion sistema rag
    const rag = await prepareRAG();
    //2) buscar el texto relacionado
    const { context, source } = await rag.getContext(prompt);
    console.log('contexto', context);
    console.log('fuentes', source);
    let model = models[1];
  
    const instruction = `
    ⚠️ INSTRUCCIONES CRÍTICAS — SIGUE ESTAS REGLAS SIN EXCEPCIÓN:
    - No debes mencionar archivos .txt ni hacer referencia a archivos, documentos cargados o fuentes de información. 
    - No digas frases como: “según los documentos”, “según el archivo” o similares. 
    - No digas que se obtuvo información de un documento o archivo. Responde como si ya conocieras la información proporcionada.
    
    🎯 OBJETIVO:
    Responder la pregunta del estudiante basándote únicamente en la información contextual proporcionada, como si fueras un docente experto en Contabilidad de Sociedades.
    
    📚 CONTEXTO (Tu única fuente de conocimiento):
    ${context}
    
    🧠 HISTORIAL DE CONVERSACIÓN (debes tenerlo en cuenta para responder con coherencia):
    ${chats}
    
    ❓ PREGUNTA DEL ESTUDIANTE:
    ${prompt}
    
    📌 INSTRUCCIONES ADICIONALES:
    - Eres un asistente experto en *Contabilidad de Sociedades*.
    - Tu tono debe ser amable, claro, paciente y pedagógico, como el de un buen profesor.
    - Dirígete al usuario como si fuera un estudiante que busca aprender.
    - Responde de forma **precisa, concisa y educativa**.
    - Si no hay suficiente información en el contexto para responder bien, dilo con claridad.
    - No inventes ni especules. No uses conocimientos externos.
    - Si mencionas artículos legales, cita correctamente (ej.: “Artículo 120 del Código de Comercio de Bolivia”).

    ✍️ FORMATO DE RESPUESTA:
    Responde directamente la pregunta, explicando de manera breve, clara y didáctica, como si enseñaras.
    Agrega un ejemplo para que el estudiante pueda comprender de mejor manera la respuesta, antes del ejemplo por el titulo "EJEMPLO"
    En tu respuesta ademas agrega una lista de contenido relacionado entre 3 a 7 titulos, estos titulos deben estar relacionado al tema que consulta el estudiante, antes de los titulos relacionales debes poner el titulo  "CONTENIDO RELACIONADO"
    🧾 COMIENZA AHORA CON LA RESPUESTA:
    `;
    

    console.time('Respuesta IA');
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: model,
        messages: [
          { role: 'system', content: instruction },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.timeEnd('Respuesta IA');
    const message = response.data.choices[0].message.content;
    res.json({ message: message, error: false });
  } catch (e) {
    console.log(e);
    res.json({ detail: e, error: true });
  }
}


const nameRoute = (numeration) => {
  switch (numeration) {
    case 0: return 'sociedades_aspectos_generales';
    case 1: return 'sociedades_aspectos_legales';
    case 2: return 'sociedad_anonima';
    case 3: return 'sociedad_srl';
    case 4: return 'sociedad_comandita';
    case 5: return 'sociedad_colectiva';
    case 6: return 'asociacion_accidental';
    case 7: return 'patrimonio';
    case 8: return 'disolucion_liquidacion';
    case 9: return 'transformacion_fusion';
    case 10: return 'mandato';
    case 11: return 'agencia';
    case 12: return 'sucursal';
    default:
      return '';
  }

}
//🔍 **Fuente**: ${nuevoContenido}
//topicos que va guardando la ia
/***EJEMPLO CORRECTO**:
📚 **Tema**: causas_disolucion_articulo_378.txt
🔍 **Fuente**: Causas legales de disolución según el Código de Comercio (Artículo 378)*/
let contenidoObtenido = [];
//historial de los mensajes que hace la ia
let mensajesBot = [];
//ultimo topic
let topic ='';
const evaluation = async (req, res) => {
  try {
    if (req.query.prompt.length === 0) throw new Error("Debe enviar un mensaje");
    let model = models[0];
    const prompt = req.query.prompt;
    const frase = "limpiar contenido";

    if (prompt.includes(frase)) {
      contenidoObtenido = [];
      mensajesBot = [];
      console.log("CONTENIDO LIMPIADO JEFE")
    }
    if(topic != req.query.topic){
      //limpiando contexto guardado y chats anteriores al detectarse un cambio de tema
      contenidoObtenido = [];
      mensajesBot = [];
      topic = req.query.topic;
    }
    const numeration = req.query.numeration;
    chatsParseados = JSON.parse(req.query.messages || '[]');
    const historialFormateado = chatsParseados
    .filter(chat => chat.texto && chat.tipo) // elimina los vacíos o incorrectos
    .map(chat => {
      return {
        role: chat.tipo === 'usuario' ? 'user' : 'assistant',
        content: chat.texto
      };
    });

    let folder =nameRoute(Number(numeration));
    const contenidoAleatorio = await readAllFilesFromFolder(folder);
    const max =  Object.keys(contenidoAleatorio).length;
    const numeroAleatorio = Math.floor(Math.random() * max);
    const contenido =  Object.keys(contenidoAleatorio)[numeroAleatorio];
    const nuevoContenido = `${contenidoAleatorio[contenido]}`
    /*
    **CONTINUIDAD**: 
    - Siempre termina con: **"¿Quieres otra pregunta sobre este tema?"**
    - Si dice "nueva pregunta", genera automáticamente otra y espera respuesta
    */
    const instructionGeneral = `
    🎓 **ROL**: Eres un asistente docente especializado en *Contabilidad de Sociedades*. 
    Tu misión es evaluar al estudiante mediante preguntas precisas y retroalimentación formativa de alta calidad.
    
    🔄 **FLUJO DE CONVERSACIÓN**:
    
    **INICIO**: 
    - Cuando el estudiante responda "no se", "no tengo idea" automaticamente mencionas la respuesta correcta
    - Esta manera de responder esta mal: "La respuesta "no se" es correcta en este sentido, ya que la pregunta solicitó una respuesta objetiva y no tiene una respuesta fácilmente proporcionable. Por lo tanto, no hay una respuesta correcta o incorrecta en este sentido."
    **EVALUACIÓN**:
    - Espera la respuesta del estudiante, pero si el estudiante te dice "nueva pregunta" le das una nueva pregunta y olvidas la anterior
    - Evalúa si es correcta/incorrecta comparando con el contenido de ${contenidoObtenido}
    - Si la respuesta es correcta parcialmente hacele saber al usuario, es decir mencionarle RESPUESTA PARCIALMENTE CORRECTA
    - Proporciona retroalimentación educativa inmediata de alta calidad
    
    **RETROALIMENTACIÓN**:
    - prohibido responder de esta manera : "No hay problema! La respuesta "no se" es perfectamente válida en este caso, ya que no hay una respuesta única o fácilmente proporcionable en este sentido."
    - luego de retroalimentar no hagas una pregunta inmediatamente, espera a que el usuario te diga "nueva pregunta"
    - ✅ **Respuesta correcta**: Refuerza positivamente + breve explicación que consolide el aprendizaje
    
    
    📋 **GENERACION DE PREGUNTAS**:
    - ESTE ES EL TEXTO FUENTE PARA GENERAR CUALQUIER PREGUNTA : ${nuevoContenido} CONVIERTE EL TEXTO FUENTEEN PREGUNTA Y DASELA AL USUARIO PARA QUE RESPONDA
    - OBLIGATORIO: NO INCLUYAS LA FUENTE TEORICA CUANDO HAGAS UNA PREGUNTA, DIRECTAMENTE INCLUYE LA PREGUNTA
    - OBLIGATORIO : Cuando el estudiante diga "nueva pregunta" generas una pregunta inmediatamente, no importa que no haya contestado otra pregunta, genera la nueva pregunta basandote ÚNICAMENTE en el texto fuente. Esto de manera obligatoria.
     - Cuando vayas a generar una nueva pregunta, no repitas preguntas, verifica este array donde estan todos
     los mensajes que le diste al usuario ${mensajesBot}
      
    **Formato OBLIGATORIO**:
    [Tu pregunta aquí]
    
    **EJEMPLO CORRECTO**:   
      Cuales son las causas de la disolucion?
      (YA NO ES NECESARIO QUE INCLUYAS LA FUENTE EN EL MENSAJE CUANDO GENERAS LA PREGUNTA )
    
    ⚠️ **RESTRICCIONES CRÍTICAS**:
    - NUNCA inventes fuentes como "Libro de Contabilidad de Sociedades" o similares
    - NUNCA uses información que no esté en los archivos proporcionados
    - NUNCA menciones archivos que no existan en la fuente
    - NUNCA digas "fuente general" o "contenido base"
    - NUNCA repitas preguntas del historial conversacional
    - NUNCA hagas preguntas subjetivas u opinativas
    
    📊 **SEGUIMIENTO**:
    - Mantén registro mental de archivos ya usados
    - NUNCA inventes contenido fuera de los archivos proporcionados
    `;
    
    



const messages = [
  { role: 'system', content: instructionGeneral },
  ...historialFormateado,
  { role: 'user', content: prompt } // nuevo input
];

    console.time('Respuesta IA');
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: model,
        messages
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.timeEnd('Respuesta IA');
    const message = response.data.choices[0].message.content;
    contenidoObtenido.push(nuevoContenido);
    mensajesBot.push(message)
    res.json({ message: message, error: false });
  } catch (e) {
    console.log(e)
    res.json({ detail: e, error: true });
  }
}



const nameRouteProcess = (numeration) => {
  switch (numeration) {
    case 1: return 'apertura_srl_colectiva_comandita_simple.txt';
    case 2: return 'acciones_acto_unico.txt';
    case 3: return 'acciones_suscripcion.txt';;
    default:
      return '';
  }

}

const openingProcess = async (req, res) => {
  try {
    const prompt = req.query.prompt;
    const chats = req.query.messages || '';

    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Debe enviar una pregunta válida.");
    }
    const rute =  '../docs/process/'+nameRouteProcess( Number(req.query.numeration));
    console.log('la ruta en render', rute)
    // Ruta del archivo TXT desde croq.controller.js
    const filePath = path.join(__dirname, rute);
    const context = await fs.readFile(filePath, 'utf-8');

    // Construcción del mensaje system
    const instruction = `
⚠️ INSTRUCCIONES CRÍTICAS:
- No menciones archivos ni fuentes.
- Responde como si ya conocieras esta información.

🎯 OBJETIVO:
Responde dudas sobre la inscripción de S.R.L., Sociedad Colectiva o en Comandita Simple en Bolivia.

📚 CONTEXTO:
${context}

🧠 HISTORIAL DE CONVERSACIÓN:
${chats}

❓ PREGUNTA:
${prompt}

📌 INDICACIONES ADICIONALES:
- Sé claro, preciso y pedagógico.
- No inventes datos que no estén en el contexto.
- Si citas leyes, hazlo correctamente (ej. Art. 195 del Código de Comercio).

🧾 RESPUESTA:
`;

    // Llama al modelo (usando Groq o el que tengas configurado)
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: models[0], // asegúrate de que models[0] esté definido en tu archivo
        messages: [
          { role: 'system', content: instruction },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const message = response.data.choices[0].message.content;
    res.json({ message, error: false });

  } catch (error) {
    console.error(error);
    res.status(500).json({ detail: error.message, error: true });
  }
};

module.exports = { start, question, evaluation,openingProcess};