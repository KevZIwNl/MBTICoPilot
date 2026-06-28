
// 通用函数：保存测评结果
// supabase.js
// 注意：这个文件依赖 window.supabase 已存在，所以必须放在 index.html 中 Supabase 初始化之后

// 保存测评结果到 Supabase
// supabase.js - 修改后的 saveAssessmentToCloud

async function saveAssessmentToCloud(mbtiType, scores, maxPossible, isPrecise = true) {
    if (!window.supabase) {
        throw new Error('Supabase 未初始化');
    }
    
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) throw new Error('请先登录');
    
    // ===== 第一步：确保 users 表中有该用户的记录 =====
    // 尝试查询用户是否存在
    const { data: existingUser, error: queryError } = await window.supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
    
    // 如果用户不存在，则插入一条新记录（只填充必要的字段）
    if (!existingUser) {
        console.log('用户档案不存在，正在创建...');
        const placeholderEmail = user.email || `${user.id}@temp.user`;
        const { error: insertUserError } = await window.supabase
            .from('users')
            .insert({
                id: user.id,               // 与 auth.users 的 ID 一致
                email: placeholderEmail,  // 匿名用户可能没有 email
                nickname: null,             // 稍后可由用户设置
                mbti_type: null,
                eight_dim_scores: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        if (insertUserError) {
            console.error('创建用户记录失败:', insertUserError);
            throw new Error('无法创建用户档案，请重试');
        }
        console.log('✅ 用户档案已创建:', user.id);
    } else {
        console.log('✅ 用户档案已存在:', user.id);
    }
    
    // ===== 第二步：保存测评结果到 assessments 表 =====
    const { error: assessError } = await window.supabase
        .from('assessments')
        .insert({
            user_id: user.id,
            mbti_type: mbtiType,
            eight_dim_scores: scores,
            max_possible_scores: maxPossible,
            is_precise: isPrecise
        });
    if (assessError) throw assessError;
    
    // ===== 第三步：更新 users 表中的最新信息 =====
    const { error: userError } = await window.supabase
        .from('users')
        .update({
            mbti_type: mbtiType,
            eight_dim_scores: scores,
            updated_at: new Date().toISOString()
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