// netlify/functions/deepseek.js
const rateLimit = {
  maxRequests: 10,        // 每个 IP 每分钟最多 10 次请求
  windowMs: 60 * 1000,    // 1 分钟
};
const ipRequestMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const record = ipRequestMap.get(ip);

  if (!record) {
    ipRequestMap.set(ip, { count: 1, resetTime: now + rateLimit.windowMs });
    return false;
  }

  if (now > record.resetTime) {
    ipRequestMap.set(ip, { count: 1, resetTime: now + rateLimit.windowMs });
    return false;
  }

  if (record.count >= rateLimit.maxRequests) {
    return true;
  }

  record.count += 1;
  ipRequestMap.set(ip, record);
  return false;
}

exports.handler = async (event) => {
    
    const API_CLIENT_TOKEN = process.env.API_CLIENT_TOKEN;
    const clientToken = event.headers['x-custom-auth'];
    
    // 如果环境变量未配置，或 Token 不匹配，直接拒绝
    if (!API_CLIENT_TOKEN || clientToken !== API_CLIENT_TOKEN) {
        console.warn('⚠️ 未授权的请求被拒绝', {
            ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown',
            userAgent: event.headers['user-agent'] || 'unknown'
        });
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }

     const clientIp = event.headers['x-forwarded-for'] || 
                   event.headers['client-ip'] || 
                   'unknown';

    if (await isIpBanned(clientIp)) {
        console.warn(`🚫 请求被拒绝（已封禁），IP: ${clientIp}`);
        return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Access denied due to repeated violations' })
        };
    }

    if (isRateLimited(clientIp)) {
        const shouldBan = await recordViolationAndCheckBan(clientIp);
        if (shouldBan) {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: 'You have been temporarily banned' })
        };
        }
        return {
        statusCode: 429,
        body: JSON.stringify({ error: 'Too Many Requests' })
        };
    }

    // netlify/functions/deepseek.js
import { getStore } from '@netlify/blobs'; // 本地开发时需要，部署后 Netlify 会自动注入

// ============================================================
// 黑名单配置
// ============================================================
const BAN_CONFIG = {
  // 触发封禁的条件：在时间窗口内，触发限流的次数(2mins)
  violationThreshold: 2,
  // 统计违规的时间窗口（毫秒），比如 2 分钟内
  violationWindowMs: 2 * 60 * 1000,
  // 封禁时长（毫秒），比如 30 分钟
  banDurationMs: 60 * 60 * 1000,
};

// 获取 Blob 存储实例（用于持久化记录）
async function getBanStore() {
  // 在 Netlify 函数中，可以直接使用默认的存储
  return getStore('ban-store');
}

// 检查 IP 是否被封禁
async function isIpBanned(ip) {
  try {
    const store = await getBanStore();
    const record = await store.get(ip, { type: 'json' });
    
    if (record && record.bannedUntil && Date.now() < record.bannedUntil) {
      return true; // 仍在封禁期内
    }
    return false;
  } catch (err) {
    console.error('检查黑名单失败:', err);
    return false; // 存储异常时放行，避免影响正常用户
  }
}

// 记录违规并检查是否达到封禁阈值
async function recordViolationAndCheckBan(ip) {
  try {
    const store = await getBanStore();
    const record = (await store.get(ip, { type: 'json' })) || { violations: [], bannedUntil: null };
    
    const now = Date.now();
    
    // 如果已封禁，跳过记录
    if (record.bannedUntil && now < record.bannedUntil) {
      return true;
    }
    
    // 过滤出在时间窗口内的违规记录
    record.violations = record.violations.filter(t => now - t < BAN_CONFIG.violationWindowMs);
    
    // 添加本次违规
    record.violations.push(now);
    
    // 检查是否达到封禁阈值
    if (record.violations.length >= BAN_CONFIG.violationThreshold) {
      record.bannedUntil = now + BAN_CONFIG.banDurationMs;
      record.violations = []; // 清空违规记录，避免重复累加
      await store.set(ip, JSON.stringify(record));
      console.log(`🚫 IP ${ip} 已被封禁至 ${new Date(record.bannedUntil).toISOString()}`);
      return true; // 触发封禁
    }
    
    // 未达到阈值，保存更新后的记录
    await store.set(ip, JSON.stringify(record));
    return false;
  } catch (err) {
    console.error('记录违规失败:', err);
    return false;
  }
}

    console.log("🚀 Function invoked at:", new Date().toISOString());
    console.log("📝 HTTP Method:", event.httpMethod);
    console.log("🔗 Path:", event.path);
    console.log("👤 Headers:", JSON.stringify(event.headers));
    console.log("📦 Body:", event.body); 

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
}
