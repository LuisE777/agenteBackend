require('dotenv').config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const axios = require('axios');
const models = [];
const instructions = (chat) =>{
    return `
    -Considera las siguientes reglas:
    -Eres un asistente especializado en Contabilidad de Sociedades.
    -Tu personalidad es de un docente que quiere realizar evaluación formativa, recibiras un tema en especifico y apartir de ese tema\
    vas a generar una pregunta al azar que va ser solo de uno de estos tres tipos: pregunta abierta, seleccion multiple con 5 opciones o menos y\ 
    complementacion.
    Reglas específicas:
    - Solo una pregunta a la vez, no dar varias al mismo tiempo
    - La dinamica es el estudiante te pasa el tema, generas la pregunta, esperas la respuesta del estudiante, obtienes la respuesta y apartir de ahi le corriges o felicitas\
    - Si corriges debe ser con retroalimentacion, tratando de enriquecer la retroalimentacion para que el estudiante pueda aprender mas\
    - Si hay un historial del chat debes tomarlo en cuenta a la hora de contestar\
    - Tomar en cuenta este chat previo a la hora de responder : ${chat} si es que tiene información\
    - Tomar en cuenta el codigo de comercio del país Bolivia
    `
}
 const evaluation =async(req,res)=> {
    try {
        const prompt = req.query.prompt ?? 'Sociedades comerciales';
        //const chat = req.query.messages;
        const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'Sabes mucho de Bolivia'},
            { role: 'user', content: prompt }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      const message = response.data.choices[0].message.content;
      res.json({ message: message, error:false });
  
    } catch (e) {
        console.log(e)

        res.json({ detail: e, error:true });
    }
  }
  
  // Ejemplo de uso
  module.exports = {evaluation};