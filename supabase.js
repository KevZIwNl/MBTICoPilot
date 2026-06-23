// 从 Supabase Dashboard → Settings → API 获取以下两个值
const SUPABASE_URL = 'https://ylfirbefrapogvbrupfb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZmlyYmVmcmFwb2d2YnJ1cGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTk2NzAsImV4cCI6MjA5NzU5NTY3MH0.QHD6YxuB7Z3pN5x8j3e3uUmjh6BOsVZORA4sKkmMrKY';

// 创建 Supabase 客户端实例
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 现在可以使用 supabase 对象进行数据库操作