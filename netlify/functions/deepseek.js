// netlify/functions/deepseek.js
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: 'Invalid JSON' };
    }

    const { systemPrompt, messages } = body;
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
        console.error("Missing API key");
        return { statusCode: 500, body: 'Missing API key' };
    }

    const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...(messages || [])
    ];

    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-v4-flash',
                messages: apiMessages,
                temperature: 0.7,
                max_tokens: 800
            })
        });

        const data = await response.json();
        console.log("DeepSeek API response status:", response.status);
        console.log("DeepSeek API response data:", JSON.stringify(data));

        if (!response.ok) {
            console.error("API error:", data);
            return {
                statusCode: 200, // 前端期望 200，但返回错误信息
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reply: `API 错误: ${data.error?.message || '未知错误'}` })
            };
        }

        const reply = data.choices?.[0]?.message?.content;
        if (!reply) {
            console.error("Unexpected API response format:", data);
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reply: '抱歉，我暂时无法回答。' })
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply })
        };
    } catch (error) {
        console.error("Fetch error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
