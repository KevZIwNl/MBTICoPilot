// 从 Supabase Dashboard → Settings → API 获取以下两个值
const SUPABASE_URL = 'https://ylfirbefrapogvbrupfb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZmlyYmVmcmFwb2d2YnJ1cGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMTk2NzAsImV4cCI6MjA5NzU5NTY3MH0.QHD6YxuB7Z3pN5x8j3e3uUmjh6BOsVZORA4sKkmMrKY';

// 创建 Supabase 客户端实例
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 现在可以使用 supabase 对象进行数据库操作
// supabase.js

// 通用函数：保存测评结果
async function saveAssessment(mbtiType, scores, isPrecise = false) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('请先登录');
    
    const { data, error } = await supabase
        .from('assessments')
        .insert({
            user_id: user.id,
            mbti_type: mbtiType,
            eight_dim_scores: scores,
            is_precise: isPrecise
        });
    if (error) throw error;
    return data;
}

// 通用函数：获取用户最新测评结果
async function getLatestAssessment() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
    if (error) throw error;
    return data?.[0] || null;
}

// supabase.js（追加以下代码）

// 保存测评结果（替代 localStorage.setItem）
// supabase.js

// 保存测评结果（增加 maxPossible 参数）
async function saveAssessmentToCloud(mbtiType, scores, maxPossible, isPrecise = true) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('请先登录');
    
    // 1. 保存测评记录到 assessments 表（包含 max_possible_scores）
    const { error: assessError } = await supabase
        .from('assessments')
        .insert({
            user_id: user.id,
            mbti_type: mbtiType,
            eight_dim_scores: scores,
            max_possible_scores: maxPossible,  // 新增字段
            is_precise: isPrecise
        });
    if (assessError) throw assessError;
    
    // 2. 同时更新 users 表里的最新 mbti_type 和 scores（方便快速读取）
    // 注意：users 表里也可以存 maxPossible，但为了减少冗余，此处只存核心分数
    // 如果未来需要快速读取，也可以加上，但建议以 assessments 表为准
    const { error: userError } = await supabase
        .from('users')
        .update({
            mbti_type: mbtiType,
            eight_dim_scores: scores,
            updated_at: new Date()
        })
        .eq('id', user.id);
    if (userError) throw userError;
    
    console.log('✅ 测评数据（含最大可能分）已同步到 Supabase');
}
    

// 保存用户昵称（替代 localStorage.setItem('userNickname')）
async function saveNicknameToCloud(nickname) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('请先登录');
    
    const { error } = await supabase
        .from('users')
        .update({ nickname: nickname })
        .eq('id', user.id);
    if (error) throw error;
}