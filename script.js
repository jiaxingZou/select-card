// 初始化Boss选择列表
function initBossSelects() {
    // 第一个Boss只能从 FIRST_BOSS_LIST 中选择
    const boss1Select = document.getElementById('boss1');
    FIRST_BOSS_LIST.forEach(boss => {
        const option = document.createElement('option');
        option.value = boss;
        option.textContent = boss;
        boss1Select.appendChild(option);
    });
    
    // 第二、三个Boss从 SECOND_BOSS_LIST 中选择
    const boss2Select = document.getElementById('boss2');
    const boss3Select = document.getElementById('boss3');
    SECOND_BOSS_LIST.forEach(boss => {
        // 第二个Boss
        const option2 = document.createElement('option');
        option2.value = boss;
        option2.textContent = boss;
        boss2Select.appendChild(option2);
        
        // 第三个Boss
        const option3 = document.createElement('option');
        option3.value = boss;
        option3.textContent = boss;
        boss3Select.appendChild(option3);
    });
    
}

// AI算卦算法 - 基于时间、Boss等因素的综合分析
function calculateFortune(startTime, endTime, bosses) {
    // 计算战斗时长（秒）
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const duration = (end - start) / 1000; // 秒
    
    // 1. 基于时间的因素
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    
    // 2. 基于Boss名称的哈希值
    const bossHash = bosses.reduce((hash, boss, index) => {
        let bossValue = 0;
        for (let i = 0; i < boss.length; i++) {
            bossValue += boss.charCodeAt(i) * (i + 1);
        }
        return hash + bossValue * (index + 1) * 17;
    }, 0);
    
    // 3. 基于战斗时长的因素
    const durationFactor = Math.sin(duration / 60) * 0.3; // 周期性影响
    
    // 4. 基于当前时间的随机因子
    const timeSeed = (hour * 3600 + minute * 60 + second + dayOfYear * 86400) % 1000;
    
    // 5. 综合计算每张牌的概率
    const baseProb = 20; // 基础概率20%
    const probabilities = [];
    
    for (let card = 1; card <= 5; card++) {
        // 每个位置的基础偏移
        const positionFactor = Math.sin(card * Math.PI / 3) * 0.1;
        
        // Boss因素：每个Boss对不同位置的影响不同
        const bossFactor = bosses.reduce((sum, boss, bossIndex) => {
            const bossCharSum = boss.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
            return sum + Math.sin((bossCharSum + card + bossIndex) * Math.PI / 7) * 0.08;
        }, 0);
        
        // 时间因素
        const timeFactor = Math.sin((hour * 60 + minute + card * 7) * Math.PI / 180) * 0.12;
        
        // 时长因素
        const durationMod = Math.sin((duration + card * 10) * Math.PI / 120) * 0.1;
        
        // 综合计算概率（确保在合理范围内）
        let prob = baseProb + positionFactor * 15 + bossFactor * 20 + timeFactor * 15 + durationMod * 10;
        
        // 添加一些随机性但基于确定性的种子
        const seed = (bossHash + card * 37 + timeSeed + dayOfYear) % 100;
        prob += (seed - 50) * 0.15;
        
        // 确保概率在10%-35%之间
        prob = Math.max(10, Math.min(35, prob));
        
        probabilities.push({
            card: card,
            probability: prob
        });
    }
    
    // 归一化概率（使总和接近100%但保持相对比例）
    const total = probabilities.reduce((sum, p) => sum + p.probability, 0);
    probabilities.forEach(p => {
        p.probability = (p.probability / total) * 100;
    });
    
    // 找到概率最高的牌
    const recommended = probabilities.reduce((max, p) => 
        p.probability > max.probability ? p : max
    );
    
    // 生成算卦依据文本
    const reasoning = generateReasoning(startTime, endTime, duration, bosses, recommended, probabilities);
    
    return {
        recommendedCard: recommended.card,
        recommendedProbability: recommended.probability,
        allProbabilities: probabilities,
        reasoning: reasoning
    };
}

// 生成算卦依据说明
function generateReasoning(startTime, endTime, duration, bosses, recommended, probabilities) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hour = start.getHours();
    const minute = start.getMinutes();
    
    let reasoning = '';
    
    // 时间分析
    if (hour >= 6 && hour < 12) {
        reasoning += `🌅 早晨时分（${hour}:${minute.toString().padStart(2, '0')}），阳气初升，`;
    } else if (hour >= 12 && hour < 18) {
        reasoning += `☀️ 正午时分（${hour}:${minute.toString().padStart(2, '0')}），阳气最盛，`;
    } else if (hour >= 18 && hour < 24) {
        reasoning += `🌆 傍晚时分（${hour}:${minute.toString().padStart(2, '0')}），阴阳交替，`;
    } else {
        reasoning += `🌙 深夜时分（${hour}:${minute.toString().padStart(2, '0')}），阴气正浓，`;
    }
    
    // 时长分析
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    if (duration < 180) {
        reasoning += `战斗迅速（${minutes}分${seconds}秒），`;
    } else if (duration < 600) {
        reasoning += `战斗适中（${minutes}分${seconds}秒），`;
    } else {
        reasoning += `战斗持久（${minutes}分${seconds}秒），`;
    }
    
    // Boss分析
    reasoning += `已击败${bosses.join('、')}。`;
    
    // 位置分析
    const cardNames = ['一', '二', '三', '四', '五'];
    reasoning += `根据玄学算法分析，第${cardNames[recommended.card - 1]}张牌（位置${recommended.card}）的出货概率最高（${recommended.probability.toFixed(1)}%）。`;
    
    // 其他位置提示
    const sorted = [...probabilities].sort((a, b) => b.probability - a.probability);
    const second = sorted[1];
    if (second && second.probability > 20) {
        reasoning += `次选为第${cardNames[second.card - 1]}张牌（${second.probability.toFixed(1)}%）。`;
    }
    
    reasoning += ' 建议优先选择推荐位置，玄学改命，信则有！';
    
    return reasoning;
}


// 重置表单
function resetForm() {
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    document.getElementById('boss1').value = '';
    document.getElementById('boss2').value = '';
    document.getElementById('boss3').value = '';
    document.getElementById('resultSection').classList.add('hidden');
}

// AI预测功能 - 使用豆包API或增强算法
// 获取API Key: https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey??apikey=%7B%7D
// 需要同时提供API Key在控制台的"在线推理"页面创建接入点获取）
async function aiPredict(startTime, endTime, bosses, apiKey) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = (end - start) / 1000; // 秒
    
    // 格式化时间显示（小时:分钟）
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    
    // 构建自然对话风格的提示词（使用用户提供的话术模板）
    const prompt = `豆包，我现在在玩剑网3的试炼之地周常模式，我已经把那些boss打掉了，现在要翻牌子，有五张牌，从左到右分别是12345五张牌，然后如果抽到好的牌会有那个就是能用的装备。然后让你帮我想一下，我现在该翻哪张牌？我${startHour}:${startMinute.toString().padStart(2, '0')}开始打的第一个boss是${bosses[0]}，第二个boss是${bosses[1]}，第三个boss是${bosses[2]}，${endHour}:${endMinute.toString().padStart(2, '0')}打完的。帮我选一张。`;

    try {
        // 如果有API Key，尝试使用豆包API
        // 获取API Key: https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey??apikey=%7B%7D
        if (apiKey && apiKey.trim()) {
            try {
                // 使用Bearer token认证方式: Authorization: Bearer <你的API_Key>
                const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "doubao-seed-1.8",
                        messages: [
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.7,
                        max_completion_tokens: 1000
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        const aiText = data.choices[0].message.content;
                        // 标记使用了豆包API，并保存原始内容
                        return parseAIResponse(aiText, startTime, endTime, duration, bosses, true, aiText);
                    } else {
                        console.error('豆包API返回数据格式异常:', data);
                        throw new Error('API返回数据格式不正确');
                    }
                } else {
                    const errorData = await response.text();
                    console.error('豆包API调用失败，状态码:', response.status, '错误信息:', errorData);
                    // 尝试解析错误信息
                    let errorMsg = `API调用失败 (状态码: ${response.status})`;
                    try {
                        const errorJson = JSON.parse(errorData);
                        if (errorJson.message || errorJson.error) {
                            errorMsg += ': ' + (errorJson.message || errorJson.error);
                        }
                    } catch (e) {
                        errorMsg += ': ' + errorData.substring(0, 100);
                    }
                    throw new Error(errorMsg);
                }
            } catch (apiError) {
                console.error('API调用异常:', apiError);
                // 将错误信息传递给用户
                throw apiError;
            }
        }
        
        // 如果没有提供API Key，使用增强算法
        console.log('未提供API Key，使用增强算法');
        
    } catch (error) {
        console.error('AI预测错误:', error);
    }
    
    // 回退到增强的AI算法（基于机器学习的思路）
    const result = enhancedAIPredict(startTime, endTime, duration, bosses);
    result.isDoubao = false;
    result.doubaoOriginal = '';
    return result;
}

// 增强的AI预测算法（模拟AI的思考过程）
function enhancedAIPredict(startTime, endTime, duration, bosses) {
    const start = new Date(startTime);
    const hour = start.getHours();
    const minute = start.getMinutes();
    
    // 更复杂的分析算法
    const probabilities = [];
    const analysis = [];
    
    for (let card = 1; card <= 5; card++) {
        let prob = 15; // 基础概率
        let factors = [];
        
        // Boss组合分析
        const bossPattern = analyzeBossPattern(bosses, card);
        prob += bossPattern.score;
        factors.push(bossPattern.reason);
        
        // 时间周期分析
        const timePattern = analyzeTimePattern(hour, minute, card);
        prob += timePattern.score;
        factors.push(timePattern.reason);
        
        // 时长分析
        const durationPattern = analyzeDurationPattern(duration, card);
        prob += durationPattern.score;
        factors.push(durationPattern.reason);
        
        // 位置偏好分析
        const positionPattern = analyzePositionPattern(card);
        prob += positionPattern.score;
        factors.push(positionPattern.reason);
        
        // 确保概率在合理范围
        prob = Math.max(8, Math.min(40, prob));
        
        probabilities.push({
            card: card,
            probability: prob,
            factors: factors
        });
    }
    
    // 归一化
    const total = probabilities.reduce((sum, p) => sum + p.probability, 0);
    probabilities.forEach(p => {
        p.probability = (p.probability / total) * 100;
    });
    
    // 找到推荐位置
    const recommended = probabilities.reduce((max, p) => 
        p.probability > max.probability ? p : max
    );
    
    // 生成AI分析文本
    const reasoning = generateAIAnalysis(startTime, endTime, duration, bosses, recommended, probabilities);
    
    return {
        recommendedCard: recommended.card,
        recommendedProbability: recommended.probability,
        allProbabilities: probabilities,
        reasoning: reasoning,
        isDoubao: false,
        doubaoOriginal: ''
    };
}

// 分析Boss模式
function analyzeBossPattern(bosses, card) {
    const bossChars = bosses.join('');
    const charSum = bossChars.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const pattern = (charSum + card * 23) % 7;
    const score = Math.sin(pattern * Math.PI / 3.5) * 8;
    return {
        score: score,
        reason: `Boss组合"${bosses.join('+')}"对位置${card}的契合度${score > 0 ? '较高' : '较低'}`
    };
}

// 分析时间模式
function analyzeTimePattern(hour, minute, card) {
    const timeValue = (hour * 60 + minute + card * 11) % 1440;
    const score = Math.sin(timeValue * Math.PI / 360) * 6;
    return {
        score: score,
        reason: `当前时间${hour}:${minute.toString().padStart(2, '0')}对位置${card}的影响${score > 0 ? '积极' : '消极'}`
    };
}

// 分析时长模式
function analyzeDurationPattern(duration, card) {
    const minutes = duration / 60;
    const score = Math.sin((minutes + card * 5) * Math.PI / 15) * 5;
    return {
        score: score,
        reason: `战斗时长${Math.floor(minutes)}分钟对位置${card}的倾向性${score > 0 ? '有利' : '不利'}`
    };
}

// 分析位置模式
function analyzePositionPattern(card) {
    // 中间位置通常更稳定
    const score = card === 3 ? 3 : (card === 2 || card === 4 ? 1 : -1);
    return {
        score: score,
        reason: `位置${card}的历史表现${score > 0 ? '较好' : '一般'}`
    };
}

// 生成AI分析文本
function generateAIAnalysis(startTime, endTime, duration, bosses, recommended, probabilities) {
    const start = new Date(startTime);
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    
    let analysis = `🤖 AI综合分析报告：\n\n`;
    analysis += `📊 战斗信息：\n`;
    analysis += `• Boss序列：${bosses.join(' → ')}\n`;
    analysis += `• 战斗时间：${start.toLocaleString('zh-CN')}\n`;
    analysis += `• 战斗时长：${minutes}分${seconds}秒\n\n`;
    
    analysis += `🎯 预测结果：\n`;
    analysis += `• 推荐位置：第${recommended.card}张牌（概率${recommended.probability.toFixed(1)}%）\n\n`;
    
    analysis += `📈 各位置概率分析：\n`;
    probabilities.sort((a, b) => b.probability - a.probability);
    probabilities.forEach((p, index) => {
        analysis += `${index + 1}. 位置${p.card}: ${p.probability.toFixed(1)}%\n`;
    });
    
    analysis += `\n💡 AI推理：基于Boss组合特征、时间周期、战斗时长等多维度因素，位置${recommended.card}的综合评分最高，建议优先选择。`;
    
    return analysis;
}

// 解析AI API响应（如果使用了API）
function parseAIResponse(aiText, startTime, endTime, duration, bosses, isDoubao = false, originalText = '') {
    // 尝试从AI回复中提取推荐位置和概率
    // 如果没有找到，使用增强算法
    const cardMatch = aiText.match(/位置[：:]\s*(\d)|推荐[：:]\s*第?(\d)|选择[：:]\s*第?(\d)|第?(\d)张牌/);
    let recommendedCard = 3; // 默认
    
    if (cardMatch) {
        recommendedCard = parseInt(cardMatch[1] || cardMatch[2] || cardMatch[3] || cardMatch[4]) || 3;
        recommendedCard = Math.max(1, Math.min(5, recommendedCard));
    }
    
    // 使用AI回复作为分析，但概率用增强算法计算
    const result = enhancedAIPredict(startTime, endTime, duration, bosses);
    
    if (isDoubao && originalText) {
        // 使用豆包API时，保存原始内容
        result.reasoning = `🤖 豆包AI分析：\n\n${aiText}\n\n基于豆包AI的推理，结合算法分析，推荐位置${recommendedCard}。`;
        result.isDoubao = true;
        result.doubaoOriginal = originalText;
    } else {
        result.reasoning = `🤖 AI分析：\n\n${aiText}\n\n基于AI的推理，结合算法分析，推荐位置${recommendedCard}。`;
        result.isDoubao = false;
    }
    
    result.recommendedCard = recommendedCard;
    
    // 调整概率显示
    const cardProb = result.allProbabilities.find(p => p.card === recommendedCard);
    if (cardProb) {
        result.recommendedProbability = cardProb.probability;
    }
    
    return result;
}

// 显示结果（统一使用同一个函数）
function displayResult(result, isAI = false) {
    const resultSection = document.getElementById('resultSection');
    resultSection.classList.remove('hidden');
    
    // 更新标题
    const resultTitle = document.getElementById('resultTitle');
    const reasoningTitle = document.getElementById('reasoningTitle');
    const doubaoOriginalDiv = document.getElementById('doubaoOriginalContent');
    const doubaoContentDiv = document.getElementById('doubaoContent');
    const toggleBtn = document.getElementById('toggleDoubaoContent');
    
    if (isAI) {
        if (result.isDoubao) {
            resultTitle.textContent = '✨ 豆包AI预测结果';
            reasoningTitle.textContent = '🧠 豆包AI分析';
            // 显示豆包原始内容区域
            doubaoOriginalDiv.classList.remove('hidden');
            doubaoContentDiv.textContent = result.doubaoOriginal || '';
            toggleBtn.textContent = '📖 查看豆包原始回复';
            doubaoContentDiv.classList.add('hidden');
        } else {
            resultTitle.textContent = '✨ AI预测结果（增强算法）';
            reasoningTitle.textContent = '🧠 AI分析';
            doubaoOriginalDiv.classList.add('hidden');
        }
    } else {
        resultTitle.textContent = '✨ 算卦算法结果';
        reasoningTitle.textContent = '📊 算卦依据';
        doubaoOriginalDiv.classList.add('hidden');
    }
    
    document.getElementById('recommendedCard').textContent = result.recommendedCard;
    document.getElementById('probability').textContent = result.recommendedProbability.toFixed(1);
    document.getElementById('reasoningText').innerHTML = result.reasoning.replace(/\n/g, '<br>');
    
    result.allProbabilities.forEach((prob) => {
        const cardItem = document.getElementById(`card${prob.card}`);
        const probElement = document.getElementById(`prob${prob.card}`);
        
        probElement.textContent = `${prob.probability.toFixed(1)}%`;
        
        cardItem.classList.remove('recommended');
        if (prob.card === result.recommendedCard) {
            cardItem.classList.add('recommended');
        }
    });
    
    // 切换豆包原始内容的显示
    if (toggleBtn) {
        toggleBtn.onclick = function() {
            if (doubaoContentDiv.classList.contains('hidden')) {
                doubaoContentDiv.classList.remove('hidden');
                toggleBtn.textContent = '📖 隐藏豆包原始回复';
            } else {
                doubaoContentDiv.classList.add('hidden');
                toggleBtn.textContent = '📖 查看豆包原始回复';
            }
        };
    }
    
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 事件监听
document.addEventListener('DOMContentLoaded', function() {
    // 初始化Boss选择列表
    initBossSelects();
    
    // 设置默认时间（当前时间）
    const now = new Date();
    const nowStr = now.toISOString().slice(0, 16);
    document.getElementById('endTime').value = nowStr;
    
    // 设置默认开始时间（30分钟前）
    const startTime = new Date(now.getTime() - 30 * 60 * 1000);
    const startStr = startTime.toISOString().slice(0, 16);
    document.getElementById('startTime').value = startStr;
    
    // 算卦算法按钮点击事件
    document.getElementById('calculateBtn').addEventListener('click', function() {
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const boss1 = document.getElementById('boss1').value;
        const boss2 = document.getElementById('boss2').value;
        const boss3 = document.getElementById('boss3').value;
        
        // 验证输入
        if (!startTime || !endTime || !boss1 || !boss2 || !boss3) {
            alert('请填写完整信息！');
            return;
        }
        
        // 验证时间顺序
        if (new Date(startTime) >= new Date(endTime)) {
            alert('结束时间必须晚于开始时间！');
            return;
        }
        
        // 验证Boss是否重复（第二个和第三个Boss不能重复）
        if (boss2 === boss3) {
            alert('第二个和第三个Boss不能重复！');
            return;
        }
        
        // 执行算卦
        const bosses = [boss1, boss2, boss3];
        const result = calculateFortune(startTime, endTime, bosses);
        displayResult(result, false);
    });
    
    // AI预测按钮点击事件
    document.getElementById('aiCalculateBtn').addEventListener('click', async function() {
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const boss1 = document.getElementById('boss1').value;
        const boss2 = document.getElementById('boss2').value;
        const boss3 = document.getElementById('boss3').value;
        const apiKey = document.getElementById('apiKey').value;
        
        // 验证输入
        if (!startTime || !endTime || !boss1 || !boss2 || !boss3) {
            alert('请填写完整信息！');
            return;
        }
        
        // 验证时间顺序
        if (new Date(startTime) >= new Date(endTime)) {
            alert('结束时间必须晚于开始时间！');
            return;
        }
        
        // 验证Boss是否重复（第二个和第三个Boss不能重复）
        if (boss2 === boss3) {
            alert('第二个和第三个Boss不能重复！');
            return;
        }
        
        // 显示加载状态
        const btn = this;
        const originalText = btn.textContent;
        btn.textContent = '🤖 AI分析中...';
        btn.disabled = true;
        
        try {
            // 执行AI预测
            const bosses = [boss1, boss2, boss3];
            const result = await aiPredict(startTime, endTime, bosses, apiKey);
            displayResult(result, true);
        } catch (error) {
            // 显示详细错误信息
            const errorMsg = error.message || '未知错误';
            console.error('AI预测错误详情:', error);
            alert('AI预测失败：' + errorMsg + '\n\n将使用增强算法作为备选方案。\n\n提示：请检查API Key是否正确，或查看浏览器控制台获取详细错误信息。');
            // 即使出错也显示增强算法的结果
            const bosses = [boss1, boss2, boss3];
            const start = new Date(startTime);
            const end = new Date(endTime);
            const duration = (end - start) / 1000;
            const result = enhancedAIPredict(startTime, endTime, duration, bosses);
            result.isDoubao = false;
            result.doubaoOriginal = '';
            displayResult(result, true);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
    
    // 重置按钮点击事件
    document.getElementById('resetBtn').addEventListener('click', resetForm);
});

