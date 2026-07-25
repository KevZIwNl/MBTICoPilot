// 改为纯 JavaScript，移除 TypeScript 类型声明
export default async (request, context) => {
  // 1. 定义要拦截的恶意特征
  const bannedBotsRegex = /Bytespider|Scrapy|python-requests|axios\//i;
  const userAgent = request.headers.get("user-agent") || "";
  const url = new URL(request.url);
  const pathname = url.pathname?.toLowerCase() || "";

  // 2. 检查是否是恶意请求
  const isBadBot = bannedBotsRegex.test(userAgent);
  const isScanner = [".env", ".git", "/wp-admin", "/admin"].some((p) => pathname.includes(p));

  // 3. 如果匹配，直接拦截并返回 403
  if (isBadBot || isScanner) {
    console.log(`🚫 已拦截可疑请求: ${request.url} (User-Agent: ${userAgent})`);
    return new Response("Forbidden", { status: 403 });
  }

  // 4. 放行正常请求
  return;
};

// 配置 Edge Function 的触发路径（使用注释形式，Netlify 也支持）
export const config = {
  path: "/.netlify/functions/deepseek",
};