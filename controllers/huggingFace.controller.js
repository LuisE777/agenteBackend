require('dotenv').config();
const HUGGING_FACE = process.env.HUGGING_FACE;
const API_URL = 'https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct';
const axios = require('axios');



const evaluation = async (req, res) => {
    try {
        const prompt = 'que es una sociedad anonima';
        const response = await axios.post(API_URL,
            { inputs: prompt },
            { headers: { Authorization: `Bearer ${HUGGING_FACE}`, 'Content-Type': 'application/json' } }
        );
        res.json({ message: response.data, error: false });
    } catch (e) {
        console.log(e)
        res.json({ detail: e, error: true });
    }
}

module.exports = { evaluation };