// netlify/functions/deepseek.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
    // 只允许 POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    const { systemPrompt, messages } = JSON.parse(event.body);
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
        return { statusCode: 500, body: 'Missing API key' };
    }
    
    // 构建消息数组
    const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
    ];
    
    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: apiMessages,
                temperature: 0.7,
                max_tokens: 800
            })
        });
        
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || '抱歉，我没有理解。';
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};