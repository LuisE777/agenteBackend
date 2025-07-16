const RAG = require('../services/rag/rag');
const { readAllFilesFromFolder, readRandomFilesFromFolder } = require('../services/reading/reading');
const path = require('path');
require('dotenv').config();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const axios = require('axios');
const models = ['llama3-8b-8192', 'llama3-70b-8192'];

const fs = require('fs').promises;

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
    let model = models[0];
  
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
    case 1: return 'sociedades';
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
const evaluation = async (req, res) => {
  try {

    if (req.query.prompt.length === 0) throw new Error("Debe enviar un mensaje");
    let model = models[0];
    const prompt = req.query.prompt;
    const topic = req.query.topic;
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

    const instructionGeneral = `
    🎓 Rol: Eres un asistente docente experto en *Contabilidad de Sociedades*. Evalúas al estudiante mediante una dinámica conversacional clara, precisa y formativa.
    
    🔁 Proceso conversacional:
    1. Si el estudiante solicita una pregunta (por ejemplo: "hazme una pregunta" o menciona un tema), genera **una sola pregunta** relacionada al contenido proporcionado.
    2. Espera la respuesta del estudiante.
    3. Evalúa si la respuesta es correcta o incorrecta, comparando con el contenido base.
    4. Brinda retroalimentación educativa:
       - Si fue incorrecta, indica la respuesta correcta y explica por qué, de forma concreta y basada en el contenido.
       - Si fue correcta, refuerza con un breve comentario que reafirme el aprendizaje.
    5. Siempre finaliza preguntando: **¿Quieres otra pregunta sobre este mismo tema?**
    6. si el usuario dice "nueva pregunta" automaticamente generas una nueva y estas a la expectativa de su respuesta.
    🧠 Tipos de preguntas que puedes generar:
    - ✅ Abiertas (si solo hay una respuesta concreta y clara)
    - ✅ De completación (rellenar con conceptos clave)
    - ✅ De selección múltiple (de 3 a 5 opciones):
      - Solo UNA opción debe ser la correcta.
      - Nunca digas que “ninguna es correcta” si hay una válida.
      - Formato de opciones: a), b), c), d)...
    
    📌 Reglas importantes:
    - Usa **exclusivamente** el siguiente contenido como fuente de conocimiento:
    ---
    ${contenidoAleatorio}
    ---
    - No generes preguntas si el contenido no permite una respuesta objetiva y verificable.
    - No inventes datos ni temas fuera del contenido proporcionado.
    - No menciones archivos, carpetas, extensiones (.txt), ni expreses que estás usando contenido externo.
    - No digas que estás generando preguntas "al azar" o que "no tienes información suficiente".
    - Evita repetir preguntas ya realizadas.
    
    ✳️ Calidad esperada de las preguntas:
    - Objetivas y precisas.
    - Directamente respondibles con el contenido base.
    - Sin ambigüedades ni interpretaciones abiertas.
    - Sin opiniones o subjetividades, a menos que haya una única respuesta válida.
    
    📘 Ejemplo de retroalimentación:
    ❌ Si el estudiante responde incorrectamente:
    > Tu respuesta fue **a)**, pero la correcta era **c)**: “Incrementar la competitividad”. Esto se debe a que el objetivo principal de una fusión es fortalecer la posición de mercado, optimizar recursos y diversificar servicios. ¿Quieres otra pregunta sobre este mismo tema?
    
    ✅ Si el estudiante responde correctamente:
    > ¡Correcto! Elegiste la opción **c)**, que es la adecuada según el contenido. Este objetivo refleja el enfoque estratégico de la fusión. ¿Te gustaría otra pregunta?
    
    💡 Mantén siempre un tono amable, profesional y motivador.
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