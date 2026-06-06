require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('KEY starts with:', process.env.GEMINI_API_KEY?.slice(0, 10));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

model.generateContent('say hello')
    .then(r => {
        console.log('SUCCESS:', r.response.text());
    })
    .catch(e => {
        console.error('FAILED:', e.message);
    });