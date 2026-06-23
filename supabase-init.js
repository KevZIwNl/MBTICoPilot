// supabase-init.js
const SUPABASE_URL = 'https://ylfirbefrapogvbrupfb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZmlyYmVmcmFwb2d2YnJ1cGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTk2NzAsImV4cCI6MjA5NzU5NTY3MH0.QHD6YxuB7Z3pN5x8j3e3uUmjh6BOsVZORA4sKkmMrKY';

// 如果 CDN 已加载，则创建客户端
if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase 已初始化 (from supabase-init.js)');
} else {
    console.error('❌ Supabase CDN 未加载，请检查网络');
}

(async function autoLogin() {
    try {
        // 检查是否已有登录会话
        const { data: { user } } = await window.supabase.auth.getUser();
        if (user) {
            console.log('✅ 用户已登录:', user.email || user.id);
            return;
        }

        // 如果没有登录，执行匿名登录
        const { data, error } = await window.supabase.auth.signInAnonymously();
        if (error) {
            console.error('❌ 匿名登录失败:', error);
            return;
        }
        console.log('✅ 匿名登录成功，用户 ID:', data.user.id);
    } catch (err) {
        console.error('❌ 登录过程异常:', err);
    }
})();
