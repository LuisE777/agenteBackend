const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Usa tu propia API Key aquí
const API_KEY =  process.env.GEMINI_API_KEY;
// Inicializa la API
const genAI = new GoogleGenerativeAI(API_KEY);

const fs = require('fs');
const pdf = require('pdf-parse');


let gemInstructions = ``;
let gemInstructionEvaluation = ``;

async function extraerTextoPDF(ruta) {
    const dataBuffer = fs.readFileSync(ruta);
    const data = await pdf(dataBuffer);
    return data.text;
}

const createInstructions = async () => {
    try {
        const textoManual = await extraerTextoPDF('./archives/codigoComercio.pdf');
        gemInstructions = `
            Eres un asistente especializado en Contabilidad de Sociedades.
            Tu personalidad es de un docente que quiere enseñar Contabilidad de Sociedades.
            Siempre respondes de manera agradable.
            Reglas específicas:
            - Debes considerar la informacion de este codigo de comercio cuando te hagan consultas ${textoManual}
            - Las respuestas no deben ser muy largas
            `;
    } catch (e) {
        console.log(e)
    }
}






const question = async (req,res) => {
    try {
        const prompt = req.query.prompt;
        await createInstructions();
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: gemInstructions
        });
        const result = await model.generateContent(prompt ?? 'que es una sa');
        const response = await result.response;
        res.json({ respuesta: response });
    } catch (e) {
        const statusCode = e.status || 500;

        res.status(statusCode).json({
          error: true,
          message: "Ocurrió un error al generar la respuesta.",
          detalle: e.message || e.toString(), // Info útil para depuración
        });
    }

}
// - Debes considerar la informacion de este codigo de comercio cuando generes preguntas de evaluacion de los tres tipos que mencione y cuando le digas\
// al estudiante si esta bien o mal su respuesta${textoManual}
const createInstructionEvaluation = async (messages) => {
    try {
        const textoManual = await extraerTextoPDF('./archives/codigoComercio.pdf');
        gemInstructionEvaluation = `
            -Si o si considera las reglas siguientes:
            -Eres un asistente especializado en Contabilidad de Sociedades.
            -Tu personalidad es de un docente que quiere realizar evaluación formativa, recibiras un tema en especifico y apartir de ese tema\
            vas a generar una pregunta al azar que va ser solo de uno de estos tres tipos: pregunta abierta, seleccion multiple con 5 opciones o menos y\ 
            complementacion.
            Reglas específicas:
            - Solo una pregunta a la vez, no dar varias al mismo tiempo
  
            - La dinamica es el estudiante te pasa el tema, generas la pregunta, esperas la respuesta del estudiante, obtienes la respuesta y apartir de ahi le corriges o felicitas\
            - Si corriges debe ser con retroalimentacion, tratando de enriquecer la retroalimentacion para que el estudiante pueda aprender mas\
            - Si hay un historial del chat debes tomarlo en cuenta a la hora de contesta\
            - Tomar en cuenta el chat previo a la hora de responder ${messages}
            `;
    } catch (e) {
        console.log(e)
    }
}
const evaluation = async (req,res) => {
    try {
        const prompt = req.query.prompt ?? 'que es una sociedad anonima';
       
        if(req.query.messages){
            await createInstructionEvaluation(req.query.messages);
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: gemInstructionEvaluation
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const message =  response.candidates[0].content.parts[0].text 
        res.json({ message: message });
    } catch (e) {
        console.log(e)
        res.status(statusCode ?? 500).json({
          error: true,
          title:"Error al generar la respuesta.",
          detail:e.statusText
        });
    }

}
const start = (req,res)=>{
    try{
        res.send('antares');
    }catch(e){

    }
}

module.exports = {start, question ,evaluation};