require('dotenv').config();
const axios = require('axios');
const NOVITA_KEY = process.env.NOVITA_KEY;
const MODEL_ID = "meta-llama/llama-3.1-8b-instruct";
const API_URL = 'https://api.novita.ai/v3/openai/chat/completions';

async function question(prompt) {
    console.time('Respuesta IA');
    const res = await axios.post(API_URL, {
      model: MODEL_ID,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: { Authorization: `Bearer ${NOVITA_KEY}` }
    });
    console.timeEnd('Respuesta IA'); // Finaliza cronómetro y muestra duración
    console.log(res.data.choices[0].message.content);
  }
 // question("¿QUE ES UNA SOCIEDAD ANONIMA?");
  
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
            'Authorization': `Bearer ${NOVITA_API_KEY}`,
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

  module.exports = {evaluation};