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
    // 更新时间：结束时间为当前时间，开始时间为30分钟前
    const now = new Date();
    const nowStr = formatLocalDateTime(now);
    document.getElementById('endTime').value = nowStr;
    
    const startTime = new Date(now.getTime() - 30 * 60 * 1000);
    const startStr = formatLocalDateTime(startTime);
    document.getElementById('startTime').value = startStr;
    
    // 清空Boss选择
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
                // 使用新的 /api/v3/responses 接口格式
                // 参考: https://ark.cn-beijing.volces.com/api/v3/responses
                // 注意: model 字段可以使用模型名称（如 "doubao-seed-1.8"）或接入点ID（如 "ep-20251231152211-nmpkk"）
                // 接入点ID需要在火山引擎控制台的"在线推理"页面创建接入点后获取
                const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/responses', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "ep-20251231152211-nmpkk", // 可以替换为你的接入点ID，格式: "ep-xxxxxxxxx"
                        input: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "input_text",
                                        text: prompt
                                    }
                                ]
                            }
                        ]
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    let aiText = '';
                    let reasoningText = '';
                    let originalResponse = '';
                    
                    // 处理新的JSON格式：output数组格式
                    if (data.output && Array.isArray(data.output)) {
                        // 遍历output数组，查找message类型的内容
                        for (const item of data.output) {
                            if (item.type === 'message' && item.content && Array.isArray(item.content)) {
                                // 提取message中的文本内容
                                for (const contentItem of item.content) {
                                    if (contentItem.type === 'output_text' && contentItem.text) {
                                        aiText = contentItem.text;
                                        originalResponse = contentItem.text;
                                    }
                                }
                            } else if (item.type === 'reasoning' && item.summary && Array.isArray(item.summary)) {
                                // 提取推理过程
                                for (const summaryItem of item.summary) {
                                    if (summaryItem.type === 'summary_text' && summaryItem.text) {
                                        reasoningText = summaryItem.text;
                                    }
                                }
                            }
                        }
                        
                        // 如果找到了内容，记录日志
                        if (aiText) {
                            console.log('成功提取AI回复:', aiText.substring(0, 100) + '...');
                        }
                        if (reasoningText) {
                            console.log('成功提取推理过程:', reasoningText.substring(0, 100) + '...');
                        }
                    }
                    
                    // 如果没有找到新格式，尝试旧格式
                    if (!aiText) {
                        if (data.output && data.output.choices && data.output.choices[0] && data.output.choices[0].message) {
                            // 新格式: output.choices[0].message.content
                            aiText = data.output.choices[0].message.content || '';
                        } else if (data.choices && data.choices[0] && data.choices[0].message) {
                            // 旧格式: choices[0].message.content
                            aiText = data.choices[0].message.content || '';
                        } else if (data.output && data.output.text) {
                            // 直接文本格式: output.text
                            aiText = data.output.text || '';
                        } else if (data.text) {
                            // 直接文本格式: text
                            aiText = data.text || '';
                        } else if (data.output && data.output.choices && data.output.choices[0] && data.output.choices[0].content) {
                            // 另一种格式: output.choices[0].content
                            aiText = data.output.choices[0].content || '';
                        }
                        originalResponse = aiText;
                    }
                    
                    if (aiText) {
                        // 标记使用了豆包API，并保存原始内容和推理过程
                        return parseAIResponse(aiText, startTime, endTime, duration, bosses, true, originalResponse, reasoningText);
                    } else {
                        console.error('豆包API返回数据格式异常:', data);
                        throw new Error('API返回数据格式不正确，无法解析响应内容');
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
function parseAIResponse(aiText, startTime, endTime, duration, bosses, isDoubao = false, originalText = '', reasoningText = '') {
    // 尝试从AI回复中提取推荐位置和概率
    // 支持多种格式：5号牌子、第5张牌、位置5、推荐5等
    let recommendedCard = 3; // 默认
    
    // 更全面的正则表达式匹配
    const cardPatterns = [
        /(\d)号牌子/,
        /第(\d)张牌/,
        /位置[：:]\s*(\d)/,
        /推荐[：:]\s*第?(\d)/,
        /选择[：:]\s*第?(\d)/,
        /选(\d)号/,
        /(\d)号牌/
    ];
    
    for (const pattern of cardPatterns) {
        const match = aiText.match(pattern);
        if (match) {
            const cardNum = parseInt(match[1]);
            if (cardNum >= 1 && cardNum <= 5) {
                recommendedCard = cardNum;
                break;
            }
        }
    }
    
    // 使用AI回复作为分析，但概率用增强算法计算
    const result = enhancedAIPredict(startTime, endTime, duration, bosses);
    
    if (isDoubao && originalText) {
        // 使用豆包API时，保存原始内容和推理过程
        let reasoning = `🤖 豆包AI分析：\n\n${aiText}\n\n`;
        
        // 如果有推理过程，添加到分析中
        if (reasoningText) {
            reasoning += `\n💭 AI推理过程：\n${reasoningText}\n\n`;
        }
        
        reasoning += `基于豆包AI的推理，结合算法分析，推荐位置${recommendedCard}。`;
        
        result.reasoning = reasoning;
        result.isDoubao = true;
        result.doubaoOriginal = originalText;
        result.doubaoReasoning = reasoningText; // 保存推理过程
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
function displayResult(result, showProbability = true) {
    const resultSection = document.getElementById('resultSection');
    resultSection.classList.remove('hidden');
    
    // 更新标题
    const resultTitle = document.getElementById('resultTitle');
    const reasoningTitle = document.getElementById('reasoningTitle');
    const probabilitySection = document.getElementById('probabilitySection');
    const cardsDisplay = document.getElementById('cardsDisplay');
    
    // 根据是否有API key决定显示内容
    if (result.isDoubao) {
        // 使用豆包API，隐藏概率
        resultTitle.textContent = '✨ 豆包AI预测结果';
        reasoningTitle.textContent = '🧠 豆包AI分析';
        probabilitySection.classList.add('hidden');
        cardsDisplay.classList.add('hidden');
    } else {
        // 使用增强算法，显示概率
        resultTitle.textContent = '✨ 预测结果';
        reasoningTitle.textContent = '📊 分析依据';
        probabilitySection.classList.remove('hidden');
        cardsDisplay.classList.remove('hidden');
        
        // 显示概率
        document.getElementById('probability').textContent = result.recommendedProbability.toFixed(1);
        
        // 显示各位置概率
        result.allProbabilities.forEach((prob) => {
            const cardItem = document.getElementById(`card${prob.card}`);
            const probElement = document.getElementById(`prob${prob.card}`);
            
            probElement.textContent = `${prob.probability.toFixed(1)}%`;
            
            cardItem.classList.remove('recommended');
            if (prob.card === result.recommendedCard) {
                cardItem.classList.add('recommended');
            }
        });
    }
    
    // 显示推荐牌号和分析
    document.getElementById('recommendedCard').textContent = result.recommendedCard;
    document.getElementById('reasoningText').innerHTML = result.reasoning.replace(/\n/g, '<br>');
    
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 将Date对象格式化为本地时区的datetime-local格式 (YYYY-MM-DDTHH:mm)
function formatLocalDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 事件监听
document.addEventListener('DOMContentLoaded', function() {
    // 初始化Boss选择列表
    initBossSelects();
    
    // 设置默认时间（当前时间，使用本地时区）
    const now = new Date();
    const nowStr = formatLocalDateTime(now);
    document.getElementById('endTime').value = nowStr;
    
    // 设置默认开始时间（30分钟前，使用本地时区）
    const startTime = new Date(now.getTime() - 30 * 60 * 1000);
    const startStr = formatLocalDateTime(startTime);
    document.getElementById('startTime').value = startStr;
    
    // 预测按钮点击事件（统一处理）
    document.getElementById('predictBtn').addEventListener('click', async function() {
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
        
        const bosses = [boss1, boss2, boss3];
        const btn = this;
        const originalText = btn.textContent;
        
        // 如果有API Key，使用豆包API
        if (apiKey && apiKey.trim()) {
            btn.textContent = '🤖 AI分析中...';
            btn.disabled = true;
            
            try {
                const result = await aiPredict(startTime, endTime, bosses, apiKey);
                displayResult(result);
            } catch (error) {
                // 显示详细错误信息
                const errorMsg = error.message || '未知错误';
                console.error('AI预测错误详情:', error);
                alert('AI预测失败：' + errorMsg + '\n\n将使用增强算法作为备选方案。\n\n提示：请检查API Key是否正确，或查看浏览器控制台获取详细错误信息。');
                // 即使出错也显示增强算法的结果
                const start = new Date(startTime);
                const end = new Date(endTime);
                const duration = (end - start) / 1000;
                const result = enhancedAIPredict(startTime, endTime, duration, bosses);
                result.isDoubao = false;
                result.doubaoOriginal = '';
                displayResult(result);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        } else {
            // 没有API Key，使用增强算法
            btn.textContent = '🔮 计算中...';
            btn.disabled = true;
            
            try {
                const start = new Date(startTime);
                const end = new Date(endTime);
                const duration = (end - start) / 1000;
                const result = enhancedAIPredict(startTime, endTime, duration, bosses);
                result.isDoubao = false;
                result.doubaoOriginal = '';
                displayResult(result);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
    });
    
    // 重置按钮点击事件
    document.getElementById('resetBtn').addEventListener('click', resetForm);
});

