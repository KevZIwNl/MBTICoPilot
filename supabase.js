
// 通用函数：保存测评结果
// supabase.js
// 注意：这个文件依赖 window.supabase 已存在，所以必须放在 index.html 中 Supabase 初始化之后

// 保存测评结果到 Supabase
async function saveAssessmentToCloud(mbtiType, scores, maxPossible, isPrecise = true) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('请先登录');
    
    // 1. 保存到 assessments 表
    const { error: assessError } = await supabase
        .from('assessments')
        .insert({
            user_id: user.id,
            mbti_type: mbtiType,
            eight_dim_scores: scores,
            max_possible_scores: maxPossible,
            is_precise: isPrecise
        });
    if (assessError) throw assessError;
    
    // 2. 更新 users 表
    const { error: userError } = await supabase
        .from('users')
        .update({
            mbti_type: mbtiType,
            eight_dim_scores: scores,
            updated_at: new Date()
        })
        .eq('id', user.id);
    if (userError) throw userError;
    
    console.log('✅ 测评数据已保存到 Supabase');
}

// 保存昵称到 Supabase
async function saveNicknameToCloud(nickname) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('请先登录');
    
    const { error } = await supabase
        .from('users')
        .update({ nickname: nickname })
        .eq('id', user.id);
    if (error) throw error;
}