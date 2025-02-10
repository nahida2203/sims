import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import {
    saveUserData,
    checkUserData,
    readConfiguration,
    saveBanData,
    loadBanList,
} from '../function/function.js';
import Redis from 'ioredis';
const redis = new Redis();
const PLUGIN_PATH = path.join(process.cwd(), 'plugins', 'sims-plugin');
const RESEARCH_STORE_FILE_PATH = path.join(PLUGIN_PATH,'data', 'research_store.json');

export class UserStart extends plugin {
    constructor() {
        super({
            name: 'UserStart',
            dsc: '游戏开始',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#开始科研$', fnc: 'Start_research' },
                { reg: '^#科研进度$', fnc: 'Show_research_progress' },
                { reg: '^#科研成就$', fnc: 'Show_research_achievements' },
                { reg: '^#科研资金$', fnc: 'Show_research_funds' },
                { reg: '^#科研商店$', fnc: 'Show_research_store' },
                { reg: '^#购买科研资源.*$', fnc: 'Buy_research_resource' },
                { reg: '^#科研成果展示$', fnc: 'Show_research_results' },
                { reg: '^#科研团队$', fnc: 'Show_research_team' },
                { reg: '^#招募科研人员.*$', fnc: 'Recruit_research_member' },
                { reg: '^#科研人员信息.*$', fnc: 'Show_member_info' },
                { reg: '^#提升科研人员技能.*$', fnc: 'Upgrade_member_skill' },
                { reg: '^#科研人员离职.*$', fnc: 'Fire_member' },
                { reg: '^#购买科研设备.*$', fnc: 'Buy_research_equipment' },
                { reg: '^#提升科研设备等级.*$', fnc: 'Upgrade_research_equipment' },
                { reg: '^#科研设备库存$', fnc: 'Show_research_equipment_inventory' },
                { reg: '^#科研设备维修.*$', fnc: 'Repair_research_equipment' },
                { reg: '^#科研项目申请.*$', fnc: 'Apply_research_project' },
                { reg: '^#科研项目列表$', fnc: 'Show_research_project_list' },
                { reg: '^#科研项目完成.*$', fnc: 'Complete_research_project' },
                { reg: '^#科研论文发表.*$', fnc: 'Publish_research_paper' },
                { reg: '^#科研论文列表$', fnc: 'Show_research_paper_list' },
                { reg: '^#科研专利申请.*$', fnc: 'Apply_research_patent' },
                { reg: '^#科研专利列表$', fnc: 'Show_research_patent_list' },
                { reg: '^#科学研究成果转让.*$', fnc: 'Transfer_research_results' },
            ],
        });
    }
    async Start_research(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
        
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员,您当前处于封禁状态,暂时无法进行操作哦~");
            return;
        }
    
        // 定义研究员形象特征
        const researcherStyles = [
            {
                style: "知性",
                outfit: "白色实验服",
                accessories: ["黑框眼镜", "珍珠耳环"],
                personality: "严谨认真"
            },
            {
                style: "活力",
                outfit: "粉色实验服", 
                accessories: ["发卡", "项链"],
                personality: "开朗热情"
            },
            {
                style: "优雅",
                outfit: "浅蓝实验服",
                accessories: ["发簪", "手链"],
                personality: "温柔细心"
            }
        ];
    
        // 随机选择研究员形象
        const chosenStyle = researcherStyles[Math.floor(Math.random() * researcherStyles.length)];
    
        // 检查是否已初始化
        if (!userData.research) {
            // 初始化基础数据
            userData.research = {
                funds: 1000, // 初始资金
                projects: [],
                papers: [],
                patents: [],
                researchMembers: [],
                researchEquipment: [],
                researchInventory: [],
                researcherStyle: chosenStyle,
                personalStats: {
                    charm: Math.floor(Math.random() * 50) + 50, // 魅力值
                    intelligence: Math.floor(Math.random() * 50) + 50, // 智慧值
                    diligence: Math.floor(Math.random() * 50) + 50, // 勤奋值
                    luck: Math.floor(Math.random() * 50) + 50 // 幸运值
                },
                achievements: [],
                dailyTasks: {
                    lastRefresh: new Date().toISOString(),
                    tasks: []
                },
                relationships: [], // 人际关系网络
                laboratory: {
                    decoration: [], // 实验室装饰
                    comfort: 50, // 舒适度
                    efficiency: 50 // 工作效率
                },
                researcherTitle: "见习研究员", // 初始头衔
                moodStatus: "充满干劲", // 心情状态
                energyLevel: 100, // 精力值
                lastLogin: new Date().toISOString(),
                consecutiveLogins: 1
            };
    
            // 生成每日任务
            const dailyTasks = [
                {
                    id: 1,
                    name: "整理实验数据",
                    reward: 100,
                    completed: false
                },
                {
                    id: 2,
                    name: "清理实验台",
                    reward: 50,
                    completed: false
                },
                {
                    id: 3,
                    name: "校准仪器",
                    reward: 150,
                    completed: false
                }
            ];
            userData.research.dailyTasks.tasks = dailyTasks;
    
            // 初始化实验室装饰
            const initialDecorations = [
                {
                    id: 1,
                    name: "小盆栽",
                    effect: {
                        comfort: 5,
                        efficiency: 2
                    }
                },
                {
                    id: 2,
                    name: "励志海报",
                    effect: {
                        comfort: 2,
                        efficiency: 5
                    }
                }
            ];
            userData.research.laboratory.decoration = initialDecorations;
    
            // 计算实验室初始属性
            userData.research.laboratory.comfort += initialDecorations.reduce((sum, item) => sum + item.effect.comfort, 0);
            userData.research.laboratory.efficiency += initialDecorations.reduce((sum, item) => sum + item.effect.efficiency, 0);
    
            // 保存数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            // 生成欢迎信息
            const welcomeMsg = [
                "亲爱的研究员,欢迎来到科研世界~",
                `您的形象是: ${chosenStyle.style}风格`,
                `身着: ${chosenStyle.outfit}`,
                `装饰: ${chosenStyle.accessories.join("、")}`,
                `性格特征: ${chosenStyle.personality}`,
                "\n初始属性:",
                `魅力: ${userData.research.personalStats.charm}`,
                `智慧: ${userData.research.personalStats.intelligence}`,
                `勤奋: ${userData.research.personalStats.diligence}`,
                `幸运: ${userData.research.personalStats.luck}`,
                "\n实验室状态:",
                `舒适度: ${userData.research.laboratory.comfort}`,
                `工作效率: ${userData.research.laboratory.efficiency}`,
                "\n每日任务已刷新,请查收~",
                `初始资金: ${userData.research.funds}元`
            ].join("\n");
    
            e.reply(welcomeMsg);
    
            // 随机触发特殊事件
            setTimeout(() => {
                const events = [
                    "实验室的花开了,好像预示着什么好事呢~",
                    "窗外飞来一只小鸟,停在了您的实验台上,真是个好兆头!",
                    "今天的阳光特别温暖,照在实验台上格外美丽~"
                ];
                const randomEvent = events[Math.floor(Math.random() * events.length)];
                e.reply(randomEvent);
            }, 3000);
    
        } else {
            // 已初始化用户的登录处理
            const now = new Date();
            const lastLogin = new Date(userData.research.lastLogin);
            
            // 检查是否是新的一天
            if (now.getDate() !== lastLogin.getDate()) {
                // 更新连续登录天数
                if (now - lastLogin < 48 * 60 * 60 * 1000) { // 48小时内
                    userData.research.consecutiveLogins++;
                } else {
                    userData.research.consecutiveLogins = 1;
                }
    
                // 刷新每日任务
                userData.research.dailyTasks.tasks = userData.research.dailyTasks.tasks.map(task => ({
                    ...task,
                    completed: false
                }));
    
                // 根据连续登录天数给予奖励
                const loginReward = userData.research.consecutiveLogins * 100;
                userData.research.funds += loginReward;
    
                // 更新心情和精力
                userData.research.moodStatus = "精神焕发";
                userData.research.energyLevel = 100;
    
                const loginMsg = [
                    `欢迎回来,亲爱的${userData.research.researcherTitle}~`,
                    `这是您连续登录的第${userData.research.consecutiveLogins}天`,
                    `奖励${loginReward}元已发放到您的账户`,
                    `当前资金: ${userData.research.funds}元`,
                    "\n今日状态:",
                    `心情: ${userData.research.moodStatus}`,
                    `精力: ${userData.research.energyLevel}`,
                    "\n新的一天,新的开始,加油哦~"
                ].join("\n");
    
                e.reply(loginMsg);
            } else {
                // 普通登录问候
                const greetings = [
                    "欢迎回来~实验室一切正常!",
                    "您的实验数据都安好,请继续努力~",
                    "今天也要保持干劲哦~"
                ];
                e.reply(greetings[Math.floor(Math.random() * greetings.length)]);
            }
    
            // 更新登录时间
            userData.research.lastLogin = now.toISOString();
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
        }
    
        // 检查实验室状态
        if (userData.research.laboratory.comfort < 30) {
            e.reply("温馨提示:实验室的舒适度有点低,建议添加一些装饰物来提升心情哦~");
        }
        if (userData.research.laboratory.efficiency < 30) {
            e.reply("温馨提示:实验室的工作效率不太理想,要不要调整一下布局呢?");
        }
    
        // 随机触发互动事件
        if (Math.random() < 0.3) { // 30%概率触发
            const interactions = [
                {
                    type: "发现",
                    message: "咦?实验台上好像有前辈留下的研究笔记,要不要看看呢?"
                },
                {
                    type: "灵感",
                    message: "突然想到一个研究思路,要记录下来吗?"
                },
                {
                    type: "邂逅",
                    message: "隔壁实验室的研究员向您投来善意的目光,要去打个招呼吗?"
                }
            ];
            
            const randomInteraction = interactions[Math.floor(Math.random() * interactions.length)];
            e.reply(randomInteraction.message);
        }
    }

    async Show_research_progress(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法查看进度哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("您还没有开始科研之旅呢，请先使用 #开始科研 初始化系统哦~");
            return;
        }
    
        // 计算整体研究进度
        const calculateOverallProgress = () => {
            if (userData.research.projects.length === 0) return 0;
            const totalProgress = userData.research.projects.reduce((sum, project) => sum + project.progress, 0);
            return Math.floor(totalProgress / userData.research.projects.length);
        };
    
        // 计算项目完成时间预估
        const calculateEstimatedCompletion = (project) => {
            const startTime = new Date(project.startTime);
            const elapsedTime = (new Date() - startTime) / 1000; // 转换为秒
            const progressRate = project.progress / elapsedTime;
            const remainingProgress = 100 - project.progress;
            const estimatedRemainingTime = remainingProgress / progressRate;
            
            return Math.ceil(estimatedRemainingTime / 3600); // 转换为小时
        };
    
        // 生成进度报告
        const generateProgressReport = () => {
            const overallProgress = calculateOverallProgress();
            let report = [
                `✨ ${userData.research.researcherTitle}的研究进度报告 ✨\n`,
                `整体完成度: ${overallProgress}%`,
                `当前心情: ${userData.research.moodStatus}`,
                `精力状态: ${userData.research.energyLevel}/100`,
                "\n当前进行中的项目:"
            ];
    
            if (userData.research.projects.length === 0) {
                report.push("暂无进行中的项目~");
            } else {
                userData.research.projects.forEach((project, index) => {
                    const estimatedHours = calculateEstimatedCompletion(project);
                    const progressBar = generateProgressBar(project.progress);
                    report.push(
                        `\n${index + 1}. ${project.name}`,
                        `进度: ${progressBar} ${project.progress}%`,
                        `预计还需: ${estimatedHours}小时`,
                        `投入资金: ${project.requiredFunds}元`
                    );
                });
            }
    
            // 添加成就进度
            report.push(
                "\n🏆 研究成就:",
                `发表论文: ${userData.research.papers.length}篇`,
                `申请专利: ${userData.research.patents.length}项`,
                `获得奖项: ${userData.research.achievements.length}个`
            );
    
            // 添加团队状态
            report.push(
                "\n👥 研究团队状态:",
                `成员数量: ${userData.research.researchMembers.length}人`,
                `设备数量: ${userData.research.researchEquipment.length}台`
            );
    
            return report.join("\n");
        };
    
        // 生成进度条
        const generateProgressBar = (progress) => {
            const barLength = 20;
            const filledLength = Math.floor((progress / 100) * barLength);
            const emptyLength = barLength - filledLength;
            return `[${"■".repeat(filledLength)}${"□".repeat(emptyLength)}]`;
        };
    
        // 检查进度里程碑
        const checkMilestones = () => {
            const overallProgress = calculateOverallProgress();
            const milestones = [
                { progress: 25, message: "项目已完成四分之一，继续加油哦~" },
                { progress: 50, message: "太棒了！已经到达项目的一半了！" },
                { progress: 75, message: "马上就要完成了，冲刺阶段加油！" },
                { progress: 100, message: "恭喜完成项目！你是最棒的！" }
            ];
    
            const achievedMilestones = milestones.filter(m => overallProgress >= m.progress);
            return achievedMilestones.map(m => m.message);
        };
    
        // 生成研究建议
        const generateResearchSuggestions = () => {
            const suggestions = [];
            
            // 基于进度的建议
            if (calculateOverallProgress() < 30) {
                suggestions.push("建议多投入时间在核心实验上~");
            }
    
            // 基于资金的建议
            if (userData.research.funds < 1000) {
                suggestions.push("当前资金较少，建议申请一些研究基金~");
            }
    
            // 基于团队的建议
            if (userData.research.researchMembers.length < 3) {
                suggestions.push("可以考虑扩充研究团队，招募更多优秀的成员哦~");
            }
    
            return suggestions;
        };
    
        // 检查特殊成就
        const checkSpecialAchievements = () => {
            const achievements = [];
            
            // 连续工作成就
            if (userData.research.consecutiveLogins >= 7) {
                achievements.push("🌟 获得"+`勤奋研究员`+"称号");
            }
    
            // 高效率成就
            if (calculateOverallProgress() > 80) {
                achievements.push("🎯 获得"+`高效研究员`+"称号");
            }
    
            return achievements;
        };
    
        // 生成完整报告
        const progressReport = generateProgressReport();
        const milestones = checkMilestones();
        const suggestions = generateResearchSuggestions();
        const specialAchievements = checkSpecialAchievements();
    
        // 整合所有信息
        let finalReport = [
            progressReport,
            "\n📝 研究建议:",
            ...suggestions,
            "\n🎊 达成的里程碑:",
            ...milestones
        ];
    
        if (specialAchievements.length > 0) {
            finalReport.push(
                "\n✨ 特殊成就:",
                ...specialAchievements
            );
        }
        const encouragements = [
            "今天也要继续加油哦~",
            "休息一下喝杯咖啡吧☕",
            "你的努力一定会有回报的！",
            "保持这个热情，继续前进吧！",
            "记得适当休息，劳逸结合才是王道~"
        ];
    
        finalReport.push(
            "\n💝 " + encouragements[Math.floor(Math.random() * encouragements.length)]
        );
    
        e.reply(finalReport.join("\n"));
    
        // 更新用户状态
        userData.research.energyLevel = Math.max(0, userData.research.energyLevel - 5);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Show_research_achievements(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法查看成就哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("您还没有开始科研之旅呢，请先使用 #开始科研 初始化系统~");
            return;
        }
    
        // 成就分类定义
        const achievementCategories = {
            research: {
                name: "研究成就",
                icon: "🔬",
                achievements: [
                    { id: "paper_1", name: "发表首篇论文", condition: user => user.research.papers.length >= 1 },
                    { id: "paper_10", name: "论文小达人", condition: user => user.research.papers.length >= 10 },
                    { id: "paper_50", name: "论文专家", condition: user => user.research.papers.length >= 50 },
                    { id: "patent_1", name: "首个专利", condition: user => user.research.patents.length >= 1 },
                    { id: "patent_10", name: "专利达人", condition: user => user.research.patents.length >= 10 }
                ]
            },
            team: {
                name: "团队成就",
                icon: "👥",
                achievements: [
                    { id: "team_3", name: "小队长", condition: user => user.research.researchMembers.length >= 3 },
                    { id: "team_10", name: "团队领袖", condition: user => user.research.researchMembers.length >= 10 }
                ]
            },
            equipment: {
                name: "设备成就",
                icon: "🔧",
                achievements: [
                    { id: "equip_5", name: "设备收藏家", condition: user => user.research.researchEquipment.length >= 5 },
                    { id: "equip_20", name: "设备大师", condition: user => user.research.researchEquipment.length >= 20 }
                ]
            },
            funds: {
                name: "资金成就",
                icon: "💰",
                achievements: [
                    { id: "funds_10k", name: "小富翁", condition: user => user.research.funds >= 10000 },
                    { id: "funds_100k", name: "科研富豪", condition: user => user.research.funds >= 100000 }
                ]
            }
        };
    
        // 检查并更新成就
        const checkAndUpdateAchievements = () => {
            let newAchievements = [];
            
            for (const category of Object.values(achievementCategories)) {
                for (const achievement of category.achievements) {
                    if (achievement.condition(userData) && 
                        !userData.research.achievements.some(a => a.id === achievement.id)) {
                        
                        const newAchievement = {
                            id: achievement.id,
                            name: achievement.name,
                            category: category.name,
                            obtainDate: new Date().toISOString()
                        };
                        
                        userData.research.achievements.push(newAchievement);
                        newAchievements.push(newAchievement);
                    }
                }
            }
            
            return newAchievements;
        };
    
        // 计算成就完成率
        const calculateAchievementRate = () => {
            let total = 0;
            let completed = 0;
            
            for (const category of Object.values(achievementCategories)) {
                total += category.achievements.length;
                completed += category.achievements.filter(a => 
                    userData.research.achievements.some(ua => ua.id === a.id)
                ).length;
            }
            
            return {
                completed,
                total,
                rate: Math.floor((completed / total) * 100)
            };
        };
    
        // 生成成就展示报告
        const generateAchievementReport = () => {
            const achievementRate = calculateAchievementRate();
            const newAchievements = checkAndUpdateAchievements();
            
            let report = [
                `✨ ${userData.research.researcherTitle}的成就殿堂 ✨\n`,
                `总进度: ${achievementRate.rate}% (${achievementRate.completed}/${achievementRate.total})`
            ];
    
            // 按分类显示成就
            for (const [key, category] of Object.entries(achievementCategories)) {
                const categoryAchievements = userData.research.achievements
                    .filter(a => a.category === category.name);
                
                report.push(
                    `\n${category.icon} ${category.name}`,
                    `完成度: ${categoryAchievements.length}/${category.achievements.length}`
                );
    
                categoryAchievements.forEach(achievement => {
                    const date = new Date(achievement.obtainDate);
                    report.push(`• ${achievement.name} (${date.toLocaleDateString()})`);
                });
            }
    
            // 显示未获得的成就
            report.push("\n📝 待完成的成就:");
            for (const category of Object.values(achievementCategories)) {
                const unachieved = category.achievements.filter(a => 
                    !userData.research.achievements.some(ua => ua.id === a.id)
                );
                unachieved.forEach(a => {
                    report.push(`• ${a.name} (${category.name})`);
                });
            }
    
            // 显示新获得的成就
            if (newAchievements.length > 0) {
                report.push(
                    "\n🎉 恭喜获得新成就！",
                    ...newAchievements.map(a => `• ${a.name}`)
                );
            }
    
            // 添加激励语
            const motivationalMessages = [
                "继续加油，更多成就等着你！",
                "一步一个脚印，成就等着你来解锁~",
                "每个成就都是你努力的见证！",
                "慢慢来，研究之路上我们一起进步~"
            ];
            report.push(
                "\n💝 " + motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
            );
    
            return report.join("\n");
        };
    
        // 生成并发送报告
        const report = generateAchievementReport();
        e.reply(report);
    
        // 检查特殊里程碑
        const achievementRate = calculateAchievementRate();
        if (achievementRate.rate >= 50 && !userData.research.milestones?.achievement50) {
            userData.research.milestones = userData.research.milestones || {};
            userData.research.milestones.achievement50 = true;
            userData.research.funds += 5000;
            e.reply([
                "🎊 解锁特殊里程碑！",
                "完成50%的成就",
                "奖励: 5000研究资金",
                "继续加油，向100%进发！"
            ].join("\n"));
        }
    
        // 更新用户数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Show_research_funds(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法查看资金情况哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("您还没有开始科研之旅呢，请先使用 #开始科研 初始化系统~");
            return;
        }
    
        // 资金统计系统
        const calculateFinancialStats = () => {
            const now = new Date();
            const stats = {
                totalIncome: 0,
                totalExpense: 0,
                dailyIncome: 0,
                dailyExpense: 0,
                weeklyIncome: 0,
                weeklyExpense: 0,
                monthlyIncome: 0,
                monthlyExpense: 0
            };
    
            // 获取财务记录
            const transactions = userData.research.financialRecords || [];
            
            transactions.forEach(record => {
                const recordDate = new Date(record.date);
                const daysDiff = (now - recordDate) / (1000 * 60 * 60 * 24);
    
                if (record.type === 'income') {
                    stats.totalIncome += record.amount;
                    if (daysDiff < 1) stats.dailyIncome += record.amount;
                    if (daysDiff < 7) stats.weeklyIncome += record.amount;
                    if (daysDiff < 30) stats.monthlyIncome += record.amount;
                } else {
                    stats.totalExpense += record.amount;
                    if (daysDiff < 1) stats.dailyExpense += record.amount;
                    if (daysDiff < 7) stats.weeklyExpense += record.amount;
                    if (daysDiff < 30) stats.monthlyExpense += record.amount;
                }
            });
    
            return stats;
        };
    
        // 生成资金预测
        const generateFundsForecast = () => {
            const stats = calculateFinancialStats();
            const dailyAvgIncome = stats.monthlyIncome / 30;
            const dailyAvgExpense = stats.monthlyExpense / 30;
            const forecast = {
                nextWeek: (dailyAvgIncome - dailyAvgExpense) * 7,
                nextMonth: (dailyAvgIncome - dailyAvgExpense) * 30
            };
            return forecast;
        };
    
        // 生成资金使用建议
        const generateFinancialAdvice = (stats) => {
            const advice = [];
            
            // 收支比例建议
            const expenseRatio = stats.monthlyExpense / (stats.monthlyIncome || 1);
            if (expenseRatio > 0.8) {
                advice.push("💡 当前支出占比较高，建议适当控制支出~");
            }
    
            // 储备金建议
            const minReserve = 5000;
            if (userData.research.funds < minReserve) {
                advice.push("💰 建议保持一定的资金储备，以应对突发需求~");
            }
    
            // 投资建议
            if (userData.research.funds > minReserve * 2) {
                advice.push("✨ 当前资金充裕，可以考虑投资新的研究项目~");
            }
    
            return advice;
        };
    
        // 生成资金报告
        const generateFundsReport = () => {
            const stats = calculateFinancialStats();
            const forecast = generateFundsForecast();
            const advice = generateFinancialAdvice(stats);
    
            // 生成收支分析图表
            const generateChart = (income, expense) => {
                const total = Math.max(income, expense);
                const incomeBar = "█".repeat(Math.floor((income / total) * 10));
                const expenseBar = "█".repeat(Math.floor((expense / total) * 10));
                return {
                    income: incomeBar,
                    expense: expenseBar
                };
            };
    
            const monthlyChart = generateChart(stats.monthlyIncome, stats.monthlyExpense);
    
            const report = [
                `✨ ${userData.research.researcherTitle}的资金报告 ✨\n`,
                `当前资金: ${userData.research.funds}元`,
                "\n📊 收支统计:",
                `日收入: ${stats.dailyIncome}元`,
                `日支出: ${stats.dailyExpense}元`,
                `周收入: ${stats.weeklyIncome}元`,
                `周支出: ${stats.weeklyExpense}元`,
                "\n📈 月度分析:",
                `收入 ${monthlyChart.income} ${stats.monthlyIncome}元`,
                `支出 ${monthlyChart.expense} ${stats.monthlyExpense}元`,
                "\n🔮 资金预测:",
                `下周预期: ${forecast.nextWeek > 0 ? '+' : ''}${forecast.nextWeek}元`,
                `下月预期: ${forecast.nextMonth > 0 ? '+' : ''}${forecast.nextMonth}元`,
                "\n💡 财务建议:",
                ...advice
            ];
    
            // 添加资金等级
            const fundLevel = getFundLevel(userData.research.funds);
            report.push(
                "\n💰 资金等级:",
                `${fundLevel.title} (${fundLevel.description})`
            );
    
            return report.join("\n");
        };
    
        // 获取资金等级
        const getFundLevel = (funds) => {
            const levels = [
                { min: 0, title: "实验室新手", description: "刚起步的研究员" },
                { min: 5000, title: "小有积蓄", description: "初具规模" },
                { min: 20000, title: "资金充裕", description: "发展稳健" },
                { min: 50000, title: "科研富豪", description: "资金雄厚" },
                { min: 100000, title: "科研巨擘", description: "顶级实验室" }
            ];
    
            for (let i = levels.length - 1; i >= 0; i--) {
                if (funds >= levels[i].min) return levels[i];
            }
            return levels[0];
        };
    
        // 发送报告
        const report = generateFundsReport();
        e.reply(report);
    
        // 检查并更新成就
        const checkFundsAchievements = () => {
            const fundsAchievements = [
                { amount: 10000, title: "万元户" },
                { amount: 50000, title: "科研新贵" },
                { amount: 100000, title: "科研富豪" }
            ];
    
            for (const achievement of fundsAchievements) {
                if (userData.research.funds >= achievement.amount &&
                    !userData.research.achievements.some(a => a.name === achievement.title)) {
                    userData.research.achievements.push({
                        name: achievement.title,
                        date: new Date().toISOString()
                    });
                    e.reply(`🎉 恭喜获得成就【${achievement.title}】！`);
                }
            }
        };
    
        checkFundsAchievements();
    
        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Show_research_store(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法访问商店哦~");
            return;
        }
    
        // 初始化商店数据
        const initializeStore = () => {
            const baseItems = JSON.parse(fs.readFileSync(RESEARCH_STORE_FILE_PATH));
            const currentTime = new Date();
            
            // 添加限时商品
            const limitedItems = generateLimitedItems(currentTime);
            
            // 添加折扣信息
            const itemsWithDiscount = applyDiscounts(baseItems, userData);
            
            return {
                regular: itemsWithDiscount,
                limited: limitedItems,
                refreshTime: currentTime.toISOString()
            };
        };
    
        // 生成限时商品
        const generateLimitedItems = (currentTime) => {
            const limitedItems = [
                {
                    id: 'limited_1',
                    name: '高级研究资料',
                    type: '限时资源',
                    basePrice: 2000,
                    remainingTime: 3600, // 1小时
                    stock: 5
                },
                {
                    id: 'limited_2',
                    name: '稀有实验器材',
                    type: '限时设备',
                    basePrice: 5000,
                    remainingTime: 7200, // 2小时
                    stock: 3
                }
            ];
    
            // 添加随机属性
            return limitedItems.map(item => ({
                ...item,
                quality: generateItemQuality(),
                bonus: generateItemBonus()
            }));
        };
    
        // 生成商品品质
        const generateItemQuality = () => {
            const qualities = ['普通', '优秀', '精良', '稀有', '传说'];
            const weights = [0.4, 0.3, 0.2, 0.08, 0.02];
            let random = Math.random();
            let sum = 0;
            for (let i = 0; i < weights.length; i++) {
                sum += weights[i];
                if (random <= sum) return qualities[i];
            }
            return qualities[0];
        };
    
        // 生成商品额外属性
        const generateItemBonus = () => {
            const bonuses = [
                { type: '效率提升', value: Math.floor(Math.random() * 20) + 10 },
                { type: '成功率提升', value: Math.floor(Math.random() * 15) + 5 },
                { type: '资金节省', value: Math.floor(Math.random() * 25) + 5 }
            ];
            return bonuses[Math.floor(Math.random() * bonuses.length)];
        };
    
        // 应用折扣
        const applyDiscounts = (items, userData) => {
            const currentHour = new Date().getHours();
            const isHappyHour = currentHour >= 12 && currentHour <= 14;
            
            return items.map(item => {
                let discount = 1;
                let discountReason = [];
    
                // VIP折扣
                if (userData.research.vipLevel) {
                    discount -= userData.research.vipLevel * 0.05;
                    discountReason.push(`VIP${userData.research.vipLevel}折扣`);
                }
    
                // 限时折扣
                if (isHappyHour) {
                    discount -= 0.1;
                    discountReason.push('午市折扣');
                }
    
                // 会员等级折扣
                if (userData.research.memberLevel) {
                    discount -= userData.research.memberLevel * 0.02;
                    discountReason.push(`会员折扣`);
                }
    
                return {
                    ...item,
                    originalPrice: item.price,
                    price: Math.floor(item.price * Math.max(0.5, discount)),
                    discount: Math.floor((1 - discount) * 100),
                    discountReason: discountReason.join('、')
                };
            });
        };
    
        // 生成商店界面
        const generateStoreDisplay = (store) => {
            const report = [
                "🏪 科研商店",
                "\n📌 常规商品:"
            ];
    
            // 分类显示常规商品
            const categories = {};
            store.regular.forEach(item => {
                if (!categories[item.type]) categories[item.type] = [];
                categories[item.type].push(item);
            });
    
            for (const [type, items] of Object.entries(categories)) {
                report.push(`\n${type}:`);
                items.forEach(item => {
                    const discountInfo = item.discount ? `[${item.discount}%折]` : '';
                    const priceInfo = item.discount ? 
                        `${item.originalPrice}元 → ${item.price}元` : 
                        `${item.price}元`;
                    report.push(
                        `ID: ${item.id}`,
                        `名称: ${item.name}`,
                        `价格: ${priceInfo} ${discountInfo}`,
                        item.discountReason ? `优惠: ${item.discountReason}` : '',
                        '---'
                    );
                });
            }
    
            // 显示限时商品
            report.push("\n⏰ 限时特供:");
            store.limited.forEach(item => {
                const remainingTime = Math.floor(item.remainingTime / 60);
                report.push(
                    `ID: ${item.id}`,
                    `名称: ${item.name} [${item.quality}]`,
                    `价格: ${item.basePrice}元`,
                    `库存: ${item.stock}`,
                    `剩余时间: ${remainingTime}分钟`,
                    `特殊属性: ${item.bonus.type} +${item.bonus.value}%`,
                    '---'
                );
            });
    
            // 添加购物提示
            report.push(
                "\n💡 购物提示:",
                "• 使用 #购买科研资源<ID> 购买商品",
                "• 限时商品错过不再有哦~",
                "• 商品价格会随时变动，要把握好时机~"
            );
    
            return report.join("\n");
        };
    
        // 初始化并显示商店
        const store = initializeStore();
        const display = generateStoreDisplay(store);
        e.reply(display);
    
        // 更新用户访问记录
        userData.research.lastStoreVisit = new Date().toISOString();
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Buy_research_resource(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }

        if (!userData.research) {
            await this.Start_research(e);
        }

        const resourceId = parseInt(e.msg.replace('#购买科研资源', '').trim());
        const researchStore = JSON.parse(fs.readFileSync(RESEARCH_STORE_FILE_PATH));
        const resource = researchStore.find(r => r.id === resourceId);
        if (resource) {
            if (userData.research.funds >= resource.price) {
                userData.research.funds -= resource.price;
                userData.research.researchInventory.push(resource);
                await redis.set(`user:${userId}`, JSON.stringify(userData));
                await saveUserData(userId, userData);
                e.reply(`您已成功购买${resource.name}，当前剩余资金: ${userData.research.funds}元`);
            } else {
                e.reply("您的科研资金不足，无法购买该资源。");
            }
        } else {
            e.reply("未找到该科研资源，请检查您的输入。");
        }
    }

    async Buy_research_equipment(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法购买设备哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        const equipmentId = parseInt(e.msg.replace('#购买科研设备', '').trim());
        
        // 设备购买系统
        const equipmentSystem = {
            // 检查实验室空间
            checkLabSpace: (userData) => {
                const maxEquipment = 10 + (userData.research.laboratory?.spaceUpgrade || 0) * 2;
                return userData.research.researchEquipment.length < maxEquipment;
            },
    
            // 计算购买价格
            calculatePrice: (equipment, userData) => {
                let price = equipment.basePrice;
                
                // VIP折扣
                if (userData.research.vipLevel) {
                    price *= (1 - userData.research.vipLevel * 0.05);
                }
    
                // 批量购买折扣
                const sameTypeCount = userData.research.researchEquipment
                    .filter(e => e.type === equipment.type).length;
                if (sameTypeCount >= 3) {
                    price *= 0.9;
                }
    
                // 特殊活动折扣
                if (isSpecialEvent()) {
                    price *= 0.8;
                }
    
                return Math.floor(price);
            },
    
            // 生成设备属性
            generateEquipmentAttributes: () => {
                return {
                    durability: 100,
                    efficiency: Math.floor(Math.random() * 30) + 70,
                    accuracy: Math.floor(Math.random() * 30) + 70,
                    stability: Math.floor(Math.random() * 30) + 70
                };
            },
    
            // 生成设备特殊效果
            generateSpecialEffects: () => {
                const effects = [
                    { name: "研究效率提升", value: Math.floor(Math.random() * 15) + 5 },
                    { name: "成功率提升", value: Math.floor(Math.random() * 10) + 5 },
                    { name: "资源消耗降低", value: Math.floor(Math.random() * 20) + 10 }
                ];
                return effects[Math.floor(Math.random() * effects.length)];
            }
        };
    
        // 检查是否特殊活动期间
        const isSpecialEvent = () => {
            const now = new Date();
            const hour = now.getHours();
            return hour >= 12 && hour <= 14; // 午市特惠
        };
    
        // 获取设备信息
        const researchStore = JSON.parse(fs.readFileSync(RESEARCH_STORE_FILE_PATH));
        const equipment = researchStore.find(r => r.id === equipmentId && r.type === "设备");
    
        if (!equipment) {
            e.reply("没有找到这个设备呢，请检查ID是否正确~");
            return;
        }
    
        // 检查实验室空间
        if (!equipmentSystem.checkLabSpace(userData)) {
            e.reply([
                "实验室空间不足啦！",
                "💡 建议:",
                "1. 升级实验室空间",
                "2. 处理闲置设备",
                "3. 优化设备布局"
            ].join("\n"));
            return;
        }
    
        // 计算实际价格
        const finalPrice = equipmentSystem.calculatePrice(equipment, userData);
    
        // 检查资金
        if (userData.research.funds < finalPrice) {
            e.reply([
                "资金似乎不太够呢...",
                `需要: ${finalPrice}元`,
                `当前资金: ${userData.research.funds}元`,
                "\n💡 小建议:",
                "1. 完成研究任务获取资金",
                "2. 申请研究基金",
                "3. 等待特惠时段购买"
            ].join("\n"));
            return;
        }
    
        // 执行购买
        try {
            // 生成设备实例
            const newEquipment = {
                ...equipment,
                purchaseDate: new Date().toISOString(),
                attributes: equipmentSystem.generateEquipmentAttributes(),
                specialEffect: equipmentSystem.generateSpecialEffects(),
                maintenanceHistory: [],
                usageCount: 0
            };
    
            // 扣除资金
            userData.research.funds -= finalPrice;
            
            // 添加设备
            userData.research.researchEquipment.push(newEquipment);
    
            // 生成购买报告
            const purchaseReport = [
                "🎉 设备购买成功！\n",
                `设备名称: ${equipment.name}`,
                `实付金额: ${finalPrice}元`,
                `剩余资金: ${userData.research.funds}元`,
                "\n📊 设备属性:",
                `耐久度: ${newEquipment.attributes.durability}`,
                `效率: ${newEquipment.attributes.efficiency}`,
                `精确度: ${newEquipment.attributes.accuracy}`,
                `稳定性: ${newEquipment.attributes.stability}`,
                "\n✨ 特殊效果:",
                `${newEquipment.specialEffect.name} +${newEquipment.specialEffect.value}%`,
                "\n💡 使用建议:",
                "• 定期维护以保持最佳状态",
                "• 合理使用避免过度损耗",
                "• 注意与其他设备的协同效应"
            ];
    
            e.reply(purchaseReport.join("\n"));
    
            // 检查成就
            checkEquipmentAchievements(userData);
    
            // 保存数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
        } catch (error) {
            console.error("购买设备出错:", error);
            e.reply("购买过程中遇到了一些小问题，请稍后再试~");
        }
    }
    
   
    async Show_research_results(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法查看研究成果哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("您还没有开始科研之旅呢，请先使用 #开始科研 初始化系统~");
            return;
        }
    
        // 研究成果分析系统
        const analyzeResearchResults = () => {
            const results = {
                papers: userData.research.papers || [],
                patents: userData.research.patents || [],
                projects: userData.research.projects || [],
                innovations: userData.research.innovations || []
            };
    
            // 计算各类成果的影响力
            const calculateImpact = (item) => {
                let impact = item.baseImpact || 1;
                impact *= (item.citations || 1);
                impact *= (item.quality === 'SSR' ? 2 : 
                          item.quality === 'SR' ? 1.5 : 
                          item.quality === 'R' ? 1.2 : 1);
                return Math.floor(impact);
            };
    
            // 统计各类成果
            const stats = {
                totalPapers: results.papers.length,
                totalPatents: results.patents.length,
                totalProjects: results.projects.length,
                totalInnovations: results.innovations.length,
                totalImpact: 0,
                qualityDistribution: {
                    SSR: 0, SR: 0, R: 0, N: 0
                }
            };
    
            // 计算总影响力和质量分布
            [...results.papers, ...results.patents].forEach(item => {
                stats.totalImpact += calculateImpact(item);
                stats.qualityDistribution[item.quality]++;
            });
    
            return { results, stats };
        };
    
        // 生成研究领域分析
        const analyzeResearchFields = () => {
            const fields = {};
            [...userData.research.papers, ...userData.research.patents].forEach(item => {
                if (!fields[item.field]) fields[item.field] = 0;
                fields[item.field]++;
            });
    
            // 排序研究领域
            return Object.entries(fields)
                .sort(([,a], [,b]) => b - a)
                .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
        };
    
        // 生成成果展示报告
        const generateResultsReport = () => {
            const { results, stats } = analyzeResearchResults();
            const fields = analyzeResearchFields();
    
            const report = [
                `✨ ${userData.research.researcherTitle}的研究成果展示 ✨\n`,
                "📊 总体统计:",
                `论文数量: ${stats.totalPapers}`,
                `专利数量: ${stats.totalPatents}`,
                `在研项目: ${stats.totalProjects}`,
                `创新成果: ${stats.totalInnovations}`,
                `总影响力: ${stats.totalImpact}`,
                "\n🎯 成果质量分布:",
                `SSR级: ${stats.qualityDistribution.SSR}`,
                `SR级: ${stats.qualityDistribution.SR}`,
                `R级: ${stats.qualityDistribution.R}`,
                `N级: ${stats.qualityDistribution.N}`
            ];
    
            // 添加研究领域分析
            report.push("\n🔬 研究领域分布:");
            Object.entries(fields).forEach(([field, count]) => {
                report.push(`${field}: ${"■".repeat(Math.min(count, 10))} ${count}项`);
            });
    
            // 展示最新成果
            if (results.papers.length > 0) {
                report.push("\n📝 最新论文:");
                results.papers.slice(-3).forEach(paper => {
                    report.push(
                        `[${paper.quality}] ${paper.name}`,
                        `影响力: ${calculateImpact(paper)}`,
                        `发表时间: ${new Date(paper.date).toLocaleDateString()}`,
                        "---"
                    );
                });
            }
    
            if (results.patents.length > 0) {
                report.push("\n💡 最新专利:");
                results.patents.slice(-3).forEach(patent => {
                    report.push(
                        `[${patent.quality}] ${patent.name}`,
                        `影响力: ${calculateImpact(patent)}`,
                        `申请时间: ${new Date(patent.date).toLocaleDateString()}`,
                        "---"
                    );
                });
            }
    
            // 添加研究建议
            const suggestions = generateResearchSuggestions(stats, fields);
            report.push("\n💭 研究建议:", ...suggestions);
    
            return report.join("\n");
        };
    
        // 生成研究建议
        const generateResearchSuggestions = (stats, fields) => {
            const suggestions = [];
    
            // 基于数量的建议
            if (stats.totalPapers < 5) {
                suggestions.push("• 建议多发表一些论文，提升学术影响力~");
            }
            if (stats.totalPatents < 3) {
                suggestions.push("• 可以尝试将研究转化为专利成果~");
            }
    
            // 基于质量的建议
            if (stats.qualityDistribution.SSR === 0) {
                suggestions.push("• 争取产出SSR级别的高质量成果~");
            }
    
            // 基于领域的建议
            const fieldCount = Object.keys(fields).length;
            if (fieldCount < 3) {
                suggestions.push("• 可以尝试拓展新的研究领域，增加学术广度~");
            }
    
            return suggestions;
        };
    
        // 发送报告
        const report = generateResultsReport();
        e.reply(report);
    
        // 检查并更新成就
        const checkResearchAchievements = () => {
            const { stats } = analyzeResearchResults();
            const achievements = [
                { condition: stats.totalPapers >= 10, name: "多产作者" },
                { condition: stats.totalPatents >= 5, name: "发明家" },
                { condition: stats.totalImpact >= 1000, name: "学术影响力" }
            ];
    
            achievements.forEach(achievement => {
                if (achievement.condition && 
                    !userData.research.achievements.some(a => a.name === achievement.name)) {
                    userData.research.achievements.push({
                        name: achievement.name,
                        date: new Date().toISOString()
                    });
                    e.reply(`🎉 恭喜获得成就【${achievement.name}】！`);
                }
            });
        };
    
        checkResearchAchievements();
    
        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Show_research_team(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法查看团队信息哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("您还没有开始科研之旅呢，请先使用 #开始科研 初始化系统~");
            return;
        }
    
        // 团队分析系统
        const analyzeTeam = () => {
            const team = userData.research.researchMembers || [];
            
            // 计算团队整体属性
            const teamStats = {
                totalMembers: team.length,
                averageSkill: 0,
                totalSalary: 0,
                skillDistribution: {
                    research: 0,
                    innovation: 0,
                    management: 0,
                    communication: 0
                },
                teamMood: calculateTeamMood(),
                teamSynergy: calculateTeamSynergy(team),
                specializations: {}
            };
    
            // 计算技能分布
            team.forEach(member => {
                teamStats.averageSkill += member.skill;
                teamStats.totalSalary += member.salary || 0;
                
                // 统计专业分布
                if (!teamStats.specializations[member.specialization]) {
                    teamStats.specializations[member.specialization] = 0;
                }
                teamStats.specializations[member.specialization]++;
    
                // 统计技能分布
                Object.keys(member.skills).forEach(skill => {
                    teamStats.skillDistribution[skill] += member.skills[skill];
                });
            });
    
            if (team.length > 0) {
                teamStats.averageSkill /= team.length;
            }
    
            return teamStats;
        };
    
        // 计算团队心情
        const calculateTeamMood = () => {
            const team = userData.research.researchMembers || [];
            if (team.length === 0) return 0;
    
            const moodFactors = {
                salary: 0.3,
                workload: 0.2,
                environment: 0.3,
                leadership: 0.2
            };
    
            let totalMood = 0;
            team.forEach(member => {
                const memberMood = 
                    (member.salary / 1000) * moodFactors.salary +
                    (100 - (member.workload || 50)) / 100 * moodFactors.workload +
                    (userData.research.laboratory?.comfort || 50) / 100 * moodFactors.environment +
                    (userData.research.leadership || 50) / 100 * moodFactors.leadership;
                
                totalMood += memberMood;
            });
    
            return Math.floor((totalMood / team.length) * 100);
        };
    
        // 计算团队协同效应
        const calculateTeamSynergy = (team) => {
            if (team.length < 2) return 0;
    
            let synergy = 0;
            for (let i = 0; i < team.length; i++) {
                for (let j = i + 1; j < team.length; j++) {
                    // 检查专业互补性
                    if (team[i].specialization !== team[j].specialization) {
                        synergy += 10;
                    }
                    // 检查技能互补性
                    Object.keys(team[i].skills).forEach(skill => {
                        if (team[i].skills[skill] > team[j].skills[skill]) {
                            synergy += 5;
                        }
                    });
                }
            }
    
            return Math.min(100, Math.floor(synergy / (team.length * (team.length - 1)) * 2));
        };
    
        // 生成团队报告
        const generateTeamReport = () => {
            const teamStats = analyzeTeam();
            const report = [
                `✨ ${userData.research.researcherTitle}的研究团队报告 ✨\n`,
                "📊 团队概况:",
                `团队规模: ${teamStats.totalMembers}人`,
                `平均技能: ${teamStats.averageSkill.toFixed(1)}`,
                `团队心情: ${teamStats.teamMood}%`,
                `团队协同: ${teamStats.teamSynergy}%`,
                `月度支出: ${teamStats.totalSalary}元`
            ];
    
            // 专业分布
            report.push("\n👥 专业分布:");
            Object.entries(teamStats.specializations).forEach(([spec, count]) => {
                report.push(`${spec}: ${"■".repeat(count)} ${count}人`);
            });
    
            // 技能分布
            report.push("\n🎯 团队技能:");
            Object.entries(teamStats.skillDistribution).forEach(([skill, value]) => {
                const average = value / teamStats.totalMembers;
                report.push(`${skill}: ${"★".repeat(Math.floor(average/20))} ${average.toFixed(1)}`);
            });
    
            // 成员详情
            if (userData.research.researchMembers.length > 0) {
                report.push("\n👨‍🔬 核心成员:");
                userData.research.researchMembers.forEach((member, index) => {
                    report.push(
                        `${index + 1}. ${member.name} [${member.specialization}]`,
                        `   技能: ${Object.entries(member.skills).map(([k,v]) => `${k}(${v})`).join(', ')}`,
                        `   心情: ${calculateMemberMood(member)}%`,
                        "---"
                    );
                });
            }
    
            // 团队建议
            const suggestions = generateTeamSuggestions(teamStats);
            report.push("\n💡 团队建议:", ...suggestions);
    
            return report.join("\n");
        };
    
        // 计算个人心情
        const calculateMemberMood = (member) => {
            const baseMood = 50;
            let mood = baseMood;
            
            // 薪资影响
            mood += (member.salary / 1000) * 5;
            // 工作量影响
            mood -= (member.workload || 50) / 10;
            // 环境影响
            mood += (userData.research.laboratory?.comfort || 50) / 10;
            
            return Math.min(100, Math.max(0, Math.floor(mood)));
        };
    
        // 生成团队建议
        const generateTeamSuggestions = (stats) => {
            const suggestions = [];
    
            if (stats.totalMembers < 3) {
                suggestions.push("• 建议扩充团队规模，提升研究效率~");
            }
            if (stats.teamMood < 70) {
                suggestions.push("• 团队心情有待提升，可以考虑改善工作环境或调整薪资~");
            }
            if (stats.teamSynergy < 50) {
                suggestions.push("• 团队协同性不足，建议招募不同专业背景的成员~");
            }
            if (Object.keys(stats.specializations).length < 3) {
                suggestions.push("• 团队专业领域较单一，可以考虑扩展研究方向~");
            }
    
            return suggestions;
        };
    
        // 发送报告
        const report = generateTeamReport();
        e.reply(report);
    
        // 检查并更新成就
        const checkTeamAchievements = () => {
            const teamStats = analyzeTeam();
            const achievements = [
                { condition: teamStats.totalMembers >= 5, name: "团队领袖" },
                { condition: teamStats.teamSynergy >= 80, name: "完美团队" },
                { condition: teamStats.teamMood >= 90, name: "幸福团队" }
            ];
    
            achievements.forEach(achievement => {
                if (achievement.condition && 
                    !userData.research.achievements.some(a => a.name === achievement.name)) {
                    userData.research.achievements.push({
                        name: achievement.name,
                        date: new Date().toISOString()
                    });
                    e.reply(`🎉 恭喜获得成就【${achievement.name}】！`);
                }
            });
        };
    
        checkTeamAchievements();
    
        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Recruit_research_member(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }

        if (!userData.research) {
            await this.Start_research(e);
        }

        const memberName = e.msg.replace('#招募科研人员', '').trim();
        const researchStore = JSON.parse(fs.readFileSync(RESEARCH_STORE_FILE_PATH));
        const member = researchStore.find(r => r.name === memberName && r.type === "人员");
        if (member) {
            if (userData.research.funds >= member.price) {
                userData.research.funds -= member.price;
                userData.research.researchMembers.push({
                    name: member.name,
                    skill: member.skill,
                    position: member.position,
                });
                await redis.set(`user:${userId}`, JSON.stringify(userData));
                await saveUserData(userId, userData);
                e.reply(`您已成功招募${member.name}，当前剩余资金: ${userData.research.funds}元`);
            } else {
                e.reply("您的科研资金不足，无法招募该人员。");
            }
        } else {
            e.reply("未找到该科研人员，请检查您的输入。");
        }
    }

    async Show_member_info(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法查看成员信息哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("您还没有开始科研之旅呢，请先使用 #开始科研 初始化系统~");
            return;
        }
    
        const memberName = e.msg.replace('#科研人员信息', '').trim();
        if (!memberName) {
            e.reply("请输入要查看的成员姓名哦~");
            return;
        }
    
        const member = userData.research.researchMembers.find(m => m.name === memberName);
        if (!member) {
            e.reply("没有找到这位成员呢，请检查名字是否正确~");
            return;
        }
    
        // 生成详细的成员信息报告
        const generateMemberDetailReport = (member) => {
            // 计算综合评分
            const calculateOverallRating = () => {
                const weights = {
                    skill: 0.3,
                    contribution: 0.3,
                    teamwork: 0.2,
                    innovation: 0.2
                };
    
                return Math.floor(
                    member.skill * weights.skill +
                    member.contribution * weights.contribution +
                    member.teamwork * weights.teamwork +
                    member.innovation * weights.innovation
                );
            };
    
            // 计算成长潜力
            const calculatePotential = () => {
                const factors = {
                    learningSpeed: member.learningSpeed || 1,
                    experience: member.experience || 0,
                    motivation: member.motivation || 50
                };
    
                return Math.min(100, Math.floor(
                    (factors.learningSpeed * 30 +
                    Math.min(factors.experience, 1000) / 10 +
                    factors.motivation * 0.4)
                ));
            };
    
            // 生成技能雷达图数据
            const generateSkillRadar = () => {
                const skills = member.skills;
                let radar = "";
                const maxLength = 10;
                Object.entries(skills).forEach(([skill, value]) => {
                    const length = Math.floor((value / 100) * maxLength);
                    radar += `${skill}: ${"■".repeat(length)}${"□".repeat(maxLength - length)} ${value}\n`;
                });
                return radar;
            };
    
            // 计算研究效率
            const calculateResearchEfficiency = () => {
                const baseEfficiency = member.skill;
                const moodFactor = member.mood / 100;
                const equipmentBonus = userData.research.laboratory?.equipmentBonus || 1;
                const environmentFactor = userData.research.laboratory?.comfort / 100 || 1;
    
                return Math.floor(baseEfficiency * moodFactor * equipmentBonus * environmentFactor);
            };
    
            // 生成成就记录
            const generateAchievements = () => {
                return (member.achievements || []).map(achievement => 
                    `• ${achievement.name} (${new Date(achievement.date).toLocaleDateString()})`
                ).join("\n");
            };
    
            // 生成研究历程
            const generateResearchHistory = () => {
                return (member.researchHistory || []).slice(-3).map(history => 
                    `• ${history.project} (${history.contribution}分)`
                ).join("\n");
            };
    
            // 计算专长匹配度
            const calculateSpecializationMatch = () => {
                const currentProjects = userData.research.projects || [];
                let matchScore = 0;
                currentProjects.forEach(project => {
                    if (project.requiredSpecialization === member.specialization) {
                        matchScore += 100;
                    } else if (project.relatedSpecializations?.includes(member.specialization)) {
                        matchScore += 50;
                    }
                });
                return Math.min(100, Math.floor(matchScore / Math.max(currentProjects.length, 1)));
            };
    
            const overallRating = calculateOverallRating();
            const potential = calculatePotential();
            const efficiency = calculateResearchEfficiency();
            const specializationMatch = calculateSpecializationMatch();
    
            return [
                `✨ ${member.name}的详细信息 ✨\n`,
                "👤 基本信息:",
                `职位: ${member.position}`,
                `专业: ${member.specialization}`,
                `入职时间: ${new Date(member.joinDate).toLocaleDateString()}`,
                `当前心情: ${member.mood}%`,
                
                "\n📊 能力评估:",
                `综合评分: ${overallRating}`,
                `成长潜力: ${potential}`,
                `研究效率: ${efficiency}`,
                `专长匹配: ${specializationMatch}%`,
                
                "\n🎯 技能分布:",
                generateSkillRadar(),
                
                "\n🏆 个人成就:",
                generateAchievements() || "暂无成就",
                
                "\n📝 近期研究:",
                generateResearchHistory() || "暂无记录",
                
                "\n💡 能力评价:",
                `优势: ${member.strengths?.join(', ') || '待发现'}`,
                `待提升: ${member.weaknesses?.join(', ') || '待评估'}`,
                
                "\n📈 发展建议:",
                generateDevelopmentSuggestions(member)
            ].join("\n");
        };
    
        // 生成发展建议
        const generateDevelopmentSuggestions = (member) => {
            const suggestions = [];
            
            if (member.skill < 60) {
                suggestions.push("• 建议参加专业培训，提升核心技能");
            }
            if (member.teamwork < 70) {
                suggestions.push("• 可以多参与团队协作项目，提升配合能力");
            }
            if (member.innovation < 50) {
                suggestions.push("• 鼓励尝试新的研究方法，培养创新思维");
            }
            if (member.mood < 70) {
                suggestions.push("• 注意调节工作压力，保持良好心态");
            }
    
            return suggestions.join("\n");
        };
    
        // 发送报告
        const report = generateMemberDetailReport(member);
        e.reply(report);
    
        // 更新查看记录
        member.lastChecked = new Date().toISOString();
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Upgrade_member_skill(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法提升技能哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        const memberName = e.msg.replace('#提升科研人员技能', '').trim();
        const member = userData.research.researchMembers.find(m => m.name === memberName);
    
        if (!member) {
            e.reply("没有找到这位成员呢，请检查名字是否正确~");
            return;
        }
    
        // 技能提升系统
        const skillUpgradeSystem = {
            // 计算提升消耗
            calculateUpgradeCost: (currentSkill) => {
                const baseCost = 500;
                const levelFactor = Math.floor(currentSkill / 10);
                return Math.floor(baseCost * (1 + levelFactor * 0.5));
            },
    
            // 计算提升成功率
            calculateSuccessRate: (member) => {
                const baseRate = 80;
                const fatigueDeduction = (member.fatigue || 0) * 0.5;
                const moodBonus = ((member.mood || 50) - 50) * 0.2;
                return Math.min(95, Math.max(30, baseRate - fatigueDeduction + moodBonus));
            },
    
            // 计算提升幅度
            calculateUpgradeAmount: (successRate) => {
                const baseAmount = 10;
                const bonusAmount = Math.floor((successRate - 50) / 10);
                return Math.max(5, baseAmount + bonusAmount);
            },
    
            // 生成训练反馈
            generateTrainingFeedback: (isSuccess, amount) => {
                const successFeedback = [
                    "训练效果非常好！",
                    "有明显的进步！",
                    "掌握了新的技能要点！",
                    "突破了技能瓶颈！"
                ];
    
                const failureFeedback = [
                    "似乎遇到了一些困难...",
                    "可能需要调整训练方法",
                    "状态不太理想呢",
                    "建议先休息一下"
                ];
    
                return isSuccess ? 
                    `${successFeedback[Math.floor(Math.random() * successFeedback.length)]} 技能提升${amount}点！` :
                    failureFeedback[Math.floor(Math.random() * failureFeedback.length)];
            }
        };
    
        // 执行技能提升
        const upgradeSkill = async () => {
            const cost = skillUpgradeSystem.calculateUpgradeCost(member.skill);
            
            if (userData.research.funds < cost) {
                return {
                    success: false,
                    message: `训练费用不足哦~\n需要: ${cost}元\n当前资金: ${userData.research.funds}元`
                };
            }
    
            const successRate = skillUpgradeSystem.calculateSuccessRate(member);
            const isSuccess = Math.random() * 100 < successRate;
            const upgradeAmount = skillUpgradeSystem.calculateUpgradeAmount(successRate);
    
            if (isSuccess) {
                member.skill += upgradeAmount;
                member.fatigue = (member.fatigue || 0) + 20;
                member.experience = (member.experience || 0) + 10;
            }
    
            userData.research.funds -= cost;
            
            // 更新训练记录
            if (!member.trainingHistory) member.trainingHistory = [];
            member.trainingHistory.push({
                date: new Date().toISOString(),
                cost: cost,
                success: isSuccess,
                amount: isSuccess ? upgradeAmount : 0
            });
    
            // 检查是否触发特殊事件
            const specialEvent = checkSpecialTrainingEvent(member);
    
            return {
                success: true,
                isUpgradeSuccess: isSuccess,
                cost: cost,
                amount: upgradeAmount,
                feedback: skillUpgradeSystem.generateTrainingFeedback(isSuccess, upgradeAmount),
                specialEvent: specialEvent
            };
        };
    
        // 检查特殊训练事件
        const checkSpecialTrainingEvent = (member) => {
            if (Math.random() < 0.1) { // 10%触发概率
                const events = [
                    {
                        type: "inspiration",
                        message: "灵感突现！额外获得5点技能提升！",
                        effect: () => { member.skill += 5; }
                    },
                    {
                        type: "efficiency",
                        message: "训练效率提升！疲劳度减少50%",
                        effect: () => { member.fatigue = Math.floor(member.fatigue * 0.5); }
                    },
                    {
                        type: "breakthrough",
                        message: "突破瓶颈！下次训练成功率提升20%",
                        effect: () => { member.nextTrainingBonus = 20; }
                    }
                ];
    
                const event = events[Math.floor(Math.random() * events.length)];
                event.effect();
                return event.message;
            }
            return null;
        };
    
        // 生成训练报告
        const generateTrainingReport = (result) => {
            const report = [
                "🎯 技能训练报告\n",
                `成员: ${member.name}`,
                `消耗: ${result.cost}元`,
                `当前资金: ${userData.research.funds}元`,
                `\n训练结果: ${result.feedback}`,
                `当前技能: ${member.skill}`,
                `疲劳度: ${member.fatigue}%`,
                `经验值: ${member.experience}`
            ];
    
            if (result.specialEvent) {
                report.push(`\n✨ 特殊事件: ${result.specialEvent}`);
            }
    
            // 添加训练建议
            if (member.fatigue > 80) {
                report.push("\n💡 建议: 成员疲劳度较高，建议适当休息~");
            }
    
            return report.join("\n");
        };
    
        // 执行训练并发送报告
        const result = await upgradeSkill();
        if (!result.success) {
            e.reply(result.message);
            return;
        }
    
        const report = generateTrainingReport(result);
        e.reply(report);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Fire_member(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法执行解雇操作哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        const memberName = e.msg.replace('#科研人员离职', '').trim();
        const memberIndex = userData.research.researchMembers.findIndex(m => m.name === memberName);
    
        if (memberIndex === -1) {
            e.reply("没有找到这位成员呢，请检查名字是否正确~");
            return;
        }
    
        // 离职处理系统
        const resignationSystem = {
            // 计算补偿金
            calculateCompensation: (member) => {
                const baseCompensation = member.salary || 1000;
                const workYears = ((new Date() - new Date(member.joinDate)) / (365 * 24 * 60 * 60 * 1000));
                return Math.floor(baseCompensation * Math.max(1, workYears));
            },
    
            // 计算团队影响
            calculateTeamImpact: (member, team) => {
                let impact = {
                    morale: 0,
                    efficiency: 0,
                    relationships: []
                };
    
                // 计算士气影响
                impact.morale = Math.floor(member.popularity || 50) / 10;
    
                // 计算效率影响
                const skillGap = member.skill / (team.length || 1);
                impact.efficiency = Math.floor(skillGap * 5);
    
                // 计算人际关系影响
                team.forEach(teammate => {
                    if (teammate.name !== member.name) {
                        const relationship = calculateRelationship(member, teammate);
                        if (relationship > 70) {
                            impact.relationships.push(teammate.name);
                        }
                    }
                });
    
                return impact;
            },
    
            // 生成离职文档
            generateResignationDocument: (member) => {
                return {
                    name: member.name,
                    position: member.position,
                    joinDate: member.joinDate,
                    leaveDate: new Date().toISOString(),
                    contributions: member.contributions || [],
                    achievements: member.achievements || []
                };
            },
    
            // 处理工作交接
            handleWorkTransition: (member, team) => {
                const unfinishedProjects = member.currentProjects || [];
                const transitions = [];
    
                unfinishedProjects.forEach(project => {
                    const bestCandidate = findBestReplacement(project, team, member);
                    if (bestCandidate) {
                        transitions.push({
                            project: project.name,
                            from: member.name,
                            to: bestCandidate.name
                        });
                    }
                });
    
                return transitions;
            }
        };
    
        // 计算人际关系
        const calculateRelationship = (member1, member2) => {
            let relationship = 50;
            
            // 共同项目经历
            const commonProjects = (member1.projectHistory || [])
                .filter(p => (member2.projectHistory || []).includes(p));
            relationship += commonProjects.length * 5;
    
            // 专业互补
            if (member1.specialization !== member2.specialization) {
                relationship += 10;
            }
    
            // 共事时间
            const workTimeTogether = Math.min(
                (new Date() - new Date(member1.joinDate)) / (1000 * 60 * 60 * 24),
                (new Date() - new Date(member2.joinDate)) / (1000 * 60 * 60 * 24)
            );
            relationship += Math.floor(workTimeTogether / 30) * 2;
    
            return Math.min(100, relationship);
        };
    
        // 寻找最佳替代者
        const findBestReplacement = (project, team, leavingMember) => {
            return team
                .filter(m => m.name !== leavingMember.name)
                .sort((a, b) => {
                    const scoreA = calculateReplacementScore(a, project);
                    const scoreB = calculateReplacementScore(b, project);
                    return scoreB - scoreA;
                })[0];
        };
    
        // 计算替代分数
        const calculateReplacementScore = (member, project) => {
            let score = 0;
            
            // 专业匹配度
            if (member.specialization === project.requiredSpecialization) {
                score += 50;
            }
    
            // 技能水平
            score += member.skill;
    
            // 工作量评估
            const currentWorkload = (member.currentProjects || []).length;
            score -= currentWorkload * 10;
    
            return score;
        };
    
        // 执行离职流程
        const processFiring = async () => {
            const member = userData.research.researchMembers[memberIndex];
            const compensation = resignationSystem.calculateCompensation(member);
            
            if (userData.research.funds < compensation) {
                return {
                    success: false,
                    message: `补偿金不足！需要${compensation}元，当前资金${userData.research.funds}元`
                };
            }
    
            const teamImpact = resignationSystem.calculateTeamImpact(
                member, 
                userData.research.researchMembers
            );
    
            const resignationDoc = resignationSystem.generateResignationDocument(member);
            const transitions = resignationSystem.handleWorkTransition(
                member,
                userData.research.researchMembers
            );
    
            // 执行离职操作
            userData.research.funds -= compensation;
            userData.research.researchMembers.splice(memberIndex, 1);
    
            // 记录离职历史
            if (!userData.research.memberHistory) {
                userData.research.memberHistory = [];
            }
            userData.research.memberHistory.push({
                ...resignationDoc,
                compensation: compensation
            });
    
            return {
                success: true,
                compensation: compensation,
                teamImpact: teamImpact,
                transitions: transitions
            };
        };
    
        // 生成离职报告
        const generateFiringReport = (result) => {
            const report = [
                "📋 离职处理报告\n",
                `成员: ${memberName}`,
                `补偿金: ${result.compensation}元`,
                `剩余资金: ${userData.research.funds}元`,
                "\n🔄 团队影响:",
                `士气影响: -${result.teamImpact.morale}`,
                `效率影响: -${result.teamImpact.efficiency}%`
            ];
    
            if (result.teamImpact.relationships.length > 0) {
                report.push(
                    "\n⚠️ 关系密切的成员:",
                    ...result.teamImpact.relationships.map(name => `• ${name}`)
                );
            }
    
            if (result.transitions.length > 0) {
                report.push(
                    "\n📝 工作交接安排:",
                    ...result.transitions.map(t => 
                        `• ${t.project}: ${t.from} → ${t.to}`
                    )
                );
            }
    
            report.push(
                "\n💡 建议:",
                "• 及时安抚其他团队成员",
                "• 注意工作交接的顺利进行",
                "• 考虑招募新成员补充团队"
            );
    
            return report.join("\n");
        };
    
        // 执行离职并发送报告
        const result = await processFiring();
        if (!result.success) {
            e.reply(result.message);
            return;
        }
    
        const report = generateFiringReport(result);
        e.reply(report);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Buy_research_resource(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法购买资源哦~");
            return;
        }
    
        // 初始化检查
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        // 解析购买请求
        const resourceId = parseInt(e.msg.replace('#购买科研资源', '').trim());
        if (isNaN(resourceId)) {
            e.reply("请输入正确的资源ID哦~\n例如: #购买科研资源1");
            return;
        }
    
        // 读取商店数据
        const researchStore = JSON.parse(fs.readFileSync(RESEARCH_STORE_FILE_PATH));
        const resource = researchStore.find(r => r.id === resourceId);
    
        if (!resource) {
            e.reply("啊哦~没有找到这个资源呢，请检查ID是否正确~");
            return;
        }
    
        // 检查购买限制
        const checkPurchaseLimit = () => {
            const today = new Date().toISOString().split('T')[0];
            const purchaseHistory = userData.research.purchaseHistory || {};
            const todayPurchases = purchaseHistory[today] || [];
            return todayPurchases.filter(p => p.resourceId === resourceId).length;
        };
    
        // 检查库存容量
        const checkInventoryCapacity = () => {
            const maxCapacity = 100 + (userData.research.laboratory?.storageUpgrades || 0) * 20;
            return userData.research.researchInventory.length < maxCapacity;
        };
    
        // 计算折扣
        const calculateDiscount = () => {
            let discount = 1;
            // VIP折扣
            if (userData.research.vipLevel) {
                discount -= userData.research.vipLevel * 0.05;
            }
            // 批量购买折扣
            if (checkPurchaseLimit() > 5) {
                discount -= 0.1;
            }
            // 特殊活动折扣
            if (isSpecialEvent()) {
                discount -= 0.2;
            }
            return Math.max(0.5, discount); // 最低5折
        };
    
        // 检查是否特殊活动期间
        const isSpecialEvent = () => {
            const now = new Date();
            const hour = now.getHours();
            return hour >= 12 && hour <= 14; // 午市特惠
        };
    
        // 计算实际价格
        const finalPrice = Math.floor(resource.price * calculateDiscount());
    
        // 检查资金
        if (userData.research.funds < finalPrice) {
            const needMore = finalPrice - userData.research.funds;
            e.reply([
                "资金似乎不太够呢...",
                `当前资金: ${userData.research.funds}元`,
                `还需要: ${needMore}元`,
                "\n💡 小贴士:",
                "1. 可以完成每日任务获取资金",
                "2. 发表论文可以获得奖励",
                "3. 申请研究基金也是个好选择哦~"
            ].join("\n"));
            return;
        }
    
        // 检查购买限制
        if (checkPurchaseLimit() >= 10) {
            e.reply("今日购买次数已达上限，明天再来吧~");
            return;
        }
    
        // 检查库存容量
        if (!checkInventoryCapacity()) {
            e.reply([
                "库存空间不足啦！",
                "💡 建议:",
                "1. 升级实验室储物空间",
                "2. 整理现有资源",
                "3. 使用一些资源腾出空间"
            ].join("\n"));
            return;
        }
    
        // 执行购买
        try {
            // 扣除资金
            userData.research.funds -= finalPrice;
    
            // 添加资源到库存
            const purchasedResource = {
                ...resource,
                purchaseDate: new Date().toISOString(),
                quality: generateResourceQuality(),
                durability: 100
            };
            userData.research.researchInventory.push(purchasedResource);
    
            // 记录购买历史
            const today = new Date().toISOString().split('T')[0];
            if (!userData.research.purchaseHistory) {
                userData.research.purchaseHistory = {};
            }
            if (!userData.research.purchaseHistory[today]) {
                userData.research.purchaseHistory[today] = [];
            }
            userData.research.purchaseHistory[today].push({
                resourceId,
                price: finalPrice,
                timestamp: new Date().toISOString()
            });
    
            // 更新成就
            updatePurchaseAchievements(userData);
    
            // 保存数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            // 生成购买报告
            const purchaseReport = [
                "🎉 购买成功！",
                `物品: ${resource.name}`,
                `品质: ${purchasedResource.quality}`,
                `实付: ${finalPrice}元 (${Math.round((1 - calculateDiscount()) * 100)}%折扣)`,
                `剩余资金: ${userData.research.funds}元`,
                "\n💝 购买评价:",
                generatePurchaseComment(purchasedResource.quality)
            ];
    
            // 检查是否触发幸运事件
            if (Math.random() < 0.1) { // 10%概率
                const luckyBonus = Math.floor(finalPrice * 0.2);
                userData.research.funds += luckyBonus;
                purchaseReport.push(
                    "\n✨ 幸运事件!",
                    `意外获得返现${luckyBonus}元！`
                );
                await redis.set(`user:${userId}`, JSON.stringify(userData));
                await saveUserData(userId, userData);
            }
    
            e.reply(purchaseReport.join("\n"));
    
        } catch (error) {
            console.error("购买过程出错:", error);
            e.reply("购买过程中遇到了一些小问题，请稍后再试~");
        }
    };
    async Upgrade_research_equipment(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法升级设备哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        const equipmentName = e.msg.replace('#提升科研设备等级', '').trim();
        const equipment = userData.research.researchEquipment.find(eq => eq.name === equipmentName);
    
        if (!equipment) {
            e.reply("没有找到这个设备呢，请检查名称是否正确~");
            return;
        }
    
        // 设备升级系统
        const upgradeSystem = {
            // 计算升级费用
            calculateUpgradeCost: (equipment) => {
                const basePrice = equipment.basePrice || 1000;
                const levelFactor = Math.pow(1.5, equipment.level || 1);
                return Math.floor(basePrice * levelFactor);
            },
    
            // 计算升级成功率
            calculateSuccessRate: (equipment) => {
                const baseRate = 85;
                const levelPenalty = ((equipment.level || 1) - 1) * 5;
                const durabilityFactor = (100 - equipment.attributes.durability) * 0.2;
                return Math.max(30, baseRate - levelPenalty - durabilityFactor);
            },
    
            // 生成升级效果
            generateUpgradeEffects: (equipment) => {
                const effects = {
                    efficiency: Math.floor(Math.random() * 10) + 5,
                    accuracy: Math.floor(Math.random() * 8) + 3,
                    stability: Math.floor(Math.random() * 6) + 2
                };
    
                // 特殊升级效果
                if (Math.random() < 0.1) { // 10%概率获得特殊效果
                    const specialEffects = [
                        { name: "能源效率", value: Math.floor(Math.random() * 15) + 10 },
                        { name: "实验加速", value: Math.floor(Math.random() * 20) + 15 },
                        { name: "精确控制", value: Math.floor(Math.random() * 25) + 20 }
                    ];
                    effects.special = specialEffects[Math.floor(Math.random() * specialEffects.length)];
                }
    
                return effects;
            },
    
            // 处理升级失败
            handleUpgradeFailure: (equipment) => {
                const damageAmount = Math.floor(Math.random() * 15) + 5;
                equipment.attributes.durability = Math.max(0, 
                    equipment.attributes.durability - damageAmount);
                return damageAmount;
            }
        };
    
        // 执行升级流程
        const performUpgrade = async () => {
            const upgradeCost = upgradeSystem.calculateUpgradeCost(equipment);
            
            if (userData.research.funds < upgradeCost) {
                return {
                    success: false,
                    message: `升级费用不足！需要${upgradeCost}元，当前资金${userData.research.funds}元`
                };
            }
    
            const successRate = upgradeSystem.calculateSuccessRate(equipment);
            const isSuccess = Math.random() * 100 < successRate;
    
            userData.research.funds -= upgradeCost;
    
            if (isSuccess) {
                const upgradeEffects = upgradeSystem.generateUpgradeEffects(equipment);
                
                // 应用升级效果
                equipment.level = (equipment.level || 1) + 1;
                equipment.attributes.efficiency += upgradeEffects.efficiency;
                equipment.attributes.accuracy += upgradeEffects.accuracy;
                equipment.attributes.stability += upgradeEffects.stability;
    
                // 记录升级历史
                if (!equipment.upgradeHistory) equipment.upgradeHistory = [];
                equipment.upgradeHistory.push({
                    date: new Date().toISOString(),
                    effects: upgradeEffects,
                    cost: upgradeCost
                });
    
                return {
                    success: true,
                    isUpgradeSuccess: true,
                    effects: upgradeEffects,
                    cost: upgradeCost
                };
            } else {
                const damageAmount = upgradeSystem.handleUpgradeFailure(equipment);
                return {
                    success: true,
                    isUpgradeSuccess: false,
                    damage: damageAmount,
                    cost: upgradeCost
                };
            }
        };
    
        // 生成升级报告
        const generateUpgradeReport = (result) => {
            if (result.isUpgradeSuccess) {
                const report = [
                    "🎉 设备升级成功！\n",
                    `设备: ${equipment.name}`,
                    `当前等级: ${equipment.level}`,
                    `消耗资金: ${result.cost}元`,
                    `剩余资金: ${userData.research.funds}元`,
                    "\n📈 属性提升:",
                    `效率: +${result.effects.efficiency}`,
                    `精确度: +${result.effects.accuracy}`,
                    `稳定性: +${result.effects.stability}`
                ];
    
                if (result.effects.special) {
                    report.push(
                        "\n✨ 获得特殊效果！",
                        `${result.effects.special.name}: +${result.effects.special.value}%`
                    );
                }
    
                return report.join("\n");
            } else {
                return [
                    "💔 升级失败...\n",
                    `设备: ${equipment.name}`,
                    `消耗资金: ${result.cost}元`,
                    `剩余资金: ${userData.research.funds}元`,
                    `设备受损: -${result.damage}耐久度`,
                    `当前耐久度: ${equipment.attributes.durability}`,
                    "\n💡 建议:",
                    "• 先进行设备维修",
                    "• 等级越高失败率越高",
                    "• 可以考虑使用保护道具"
                ].join("\n");
            }
        };
    
        // 执行升级并发送报告
        const result = await performUpgrade();
        if (!result.success) {
            e.reply(result.message);
            return;
        }
    
        const report = generateUpgradeReport(result);
        e.reply(report);
    
        // 检查成就
        if (equipment.level >= 5) {
            const achievement = {
                id: "equipment_master",
                name: "设备大师",
                date: new Date().toISOString()
            };
            if (!userData.research.achievements.some(a => a.id === achievement.id)) {
                userData.research.achievements.push(achievement);
                e.reply("🎊 解锁成就【设备大师】！");
            }
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Show_research_equipment_inventory(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法查看设备库存哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        // 设备库存管理系统
        const inventorySystem = {
            // 分析设备状态
            analyzeEquipmentStatus: (equipment) => {
                const status = {
                    condition: calculateCondition(equipment),
                    efficiency: calculateEfficiency(equipment),
                    maintenanceNeeded: checkMaintenanceNeeded(equipment),
                    optimalUsage: calculateOptimalUsage(equipment),
                    riskLevel: assessRiskLevel(equipment)
                };
                return status;
            },
    
            // 生成设备评分
            generateEquipmentScore: (equipment) => {
                let score = 0;
                score += equipment.attributes.efficiency * 0.4;
                score += equipment.attributes.accuracy * 0.3;
                score += equipment.attributes.stability * 0.2;
                score += (equipment.attributes.durability / 100) * 10;
                return Math.floor(score);
            },
    
            // 计算设备价值
            calculateEquipmentValue: (equipment) => {
                const baseValue = equipment.basePrice || 1000;
                const levelFactor = Math.pow(1.2, equipment.level || 1);
                const conditionFactor = equipment.attributes.durability / 100;
                return Math.floor(baseValue * levelFactor * conditionFactor);
            },
    
            // 分析设备组合效果
            analyzeEquipmentSynergy: (equipmentList) => {
                const synergies = [];
                for (let i = 0; i < equipmentList.length; i++) {
                    for (let j = i + 1; j < equipmentList.length; j++) {
                        const synergyScore = calculateSynergyScore(
                            equipmentList[i],
                            equipmentList[j]
                        );
                        if (synergyScore > 70) {
                            synergies.push({
                                equipment1: equipmentList[i].name,
                                equipment2: equipmentList[j].name,
                                score: synergyScore
                            });
                        }
                    }
                }
                return synergies;
            }
        };
    
        // 计算设备状态
        const calculateCondition = (equipment) => {
            const durability = equipment.attributes.durability;
            if (durability >= 80) return "优良";
            if (durability >= 60) return "良好";
            if (durability >= 40) return "一般";
            if (durability >= 20) return "较差";
            return "危险";
        };
    
        // 计算设备效率
        const calculateEfficiency = (equipment) => {
            const baseEfficiency = equipment.attributes.efficiency;
            const durabilityFactor = equipment.attributes.durability / 100;
            return Math.floor(baseEfficiency * durabilityFactor);
        };
    
        // 检查是否需要维护
        const checkMaintenanceNeeded = (equipment) => {
            const lastMaintenance = equipment.maintenanceHistory?.[equipment.maintenanceHistory.length - 1]?.date;
            const daysSinceLastMaintenance = lastMaintenance ? 
                (new Date() - new Date(lastMaintenance)) / (1000 * 60 * 60 * 24) : 999;
            return {
                needed: daysSinceLastMaintenance > 7 || equipment.attributes.durability < 60,
                urgent: daysSinceLastMaintenance > 14 || equipment.attributes.durability < 30
            };
        };
    
        // 计算最佳使用方案
        const calculateOptimalUsage = (equipment) => {
            return {
                maxDailyUse: Math.floor(equipment.attributes.durability / 10),
                recommendedProjects: getRecommendedProjects(equipment),
                bestPartners: getBestPartners(equipment, userData.research.researchMembers)
            };
        };
    
        // 评估风险等级
        const assessRiskLevel = (equipment) => {
            let risk = 0;
            if (equipment.attributes.durability < 30) risk += 3;
            if (equipment.attributes.stability < 50) risk += 2;
            if (equipment.usageCount > 100) risk += 1;
            return {
                level: risk >= 5 ? "高" : risk >= 3 ? "中" : "低",
                factors: getRiskFactors(equipment)
            };
        };
    
        // 计算设备协同分数
        const calculateSynergyScore = (eq1, eq2) => {
            let score = 50;
            // 类型互补
            if (eq1.type !== eq2.type) score += 20;
            // 等级接近
            const levelDiff = Math.abs((eq1.level || 1) - (eq2.level || 1));
            score += Math.max(0, 20 - levelDiff * 5);
            // 特殊效果组合
            if (eq1.specialEffect && eq2.specialEffect &&
                eq1.specialEffect.name !== eq2.specialEffect.name) {
                score += 15;
            }
            return score;
        };
    
        // 生成库存报告
        const generateInventoryReport = () => {
            const equipment = userData.research.researchEquipment;
            const synergies = inventorySystem.analyzeEquipmentSynergy(equipment);
    
            const report = [
                `✨ ${userData.research.researcherTitle}的设备库存报告 ✨\n`,
                `设备总数: ${equipment.length}`,
                `库存价值: ${equipment.reduce((sum, eq) => 
                    sum + inventorySystem.calculateEquipmentValue(eq), 0)}元`,
                "\n📊 设备列表:"
            ];
    
            equipment.forEach((eq, index) => {
                const status = inventorySystem.analyzeEquipmentStatus(eq);
                const score = inventorySystem.generateEquipmentScore(eq);
    
                report.push(
                    `\n${index + 1}. ${eq.name} [Lv.${eq.level || 1}]`,
                    `状态: ${status.condition} (${eq.attributes.durability}%)`,
                    `效率: ${status.efficiency}%`,
                    `评分: ${score}`,
                    `风险: ${status.riskLevel.level}`,
                    status.maintenanceNeeded.urgent ? "⚠️ 需要紧急维护！" : 
                    status.maintenanceNeeded.needed ? "💡 建议进行维护" : "",
                    "---"
                );
            });
    
            if (synergies.length > 0) {
                report.push(
                    "\n🔄 推荐设备搭配:",
                    ...synergies.map(s => 
                        `• ${s.equipment1} + ${s.equipment2} (匹配度: ${s.score}%)`
                    )
                );
            }
    
            return report.join("\n");
        };
    
        // 发送报告
        const report = generateInventoryReport();
        e.reply(report);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Repair_research_equipment(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法维修设备哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        const equipmentName = e.msg.replace('#科研设备维修', '').trim();
        const equipment = userData.research.researchEquipment.find(eq => eq.name === equipmentName);
    
        if (!equipment) {
            e.reply("没有找到这个设备呢，请检查名称是否正确~");
            return;
        }
    
        // 维修系统
        const repairSystem = {
            // 计算维修费用
            calculateRepairCost: (equipment) => {
                const baseCost = equipment.basePrice * 0.1;
                const damageFactor = (100 - equipment.attributes.durability) / 100;
                const levelFactor = Math.pow(1.2, equipment.level || 1);
                return Math.floor(baseCost * damageFactor * levelFactor);
            },
    
            // 计算维修成功率
            calculateRepairSuccessRate: (equipment) => {
                const baseRate = 90;
                const durabilityPenalty = (100 - equipment.attributes.durability) * 0.2;
                const levelPenalty = ((equipment.level || 1) - 1) * 5;
                return Math.max(30, baseRate - durabilityPenalty - levelPenalty);
            },
    
            // 生成维修效果
            generateRepairEffects: (equipment) => {
                const effects = {
                    durabilityRestore: Math.floor(Math.random() * 30) + 40,
                    efficiencyBonus: Math.floor(Math.random() * 10),
                    stabilityBonus: Math.floor(Math.random() * 8)
                };
    
                // 特殊维修效果
                if (Math.random() < 0.15) { // 15%概率获得特殊效果
                    const specialEffects = [
                        { name: "性能优化", value: Math.floor(Math.random() * 20) + 10 },
                        { name: "稳定性提升", value: Math.floor(Math.random() * 15) + 5 },
                        { name: "使用寿命延长", value: Math.floor(Math.random() * 25) + 15 }
                    ];
                    effects.special = specialEffects[Math.floor(Math.random() * specialEffects.length)];
                }
    
                return effects;
            },
    
            // 处理维修失败
            handleRepairFailure: (equipment) => {
                const additionalDamage = Math.floor(Math.random() * 10) + 5;
                equipment.attributes.durability = Math.max(0, 
                    equipment.attributes.durability - additionalDamage);
                return additionalDamage;
            }
        };
    
        // 执行维修流程
        const performRepair = async () => {
            const repairCost = repairSystem.calculateRepairCost(equipment);
            
            if (userData.research.funds < repairCost) {
                return {
                    success: false,
                    message: `维修费用不足！需要${repairCost}元，当前资金${userData.research.funds}元`
                };
            }
    
            const successRate = repairSystem.calculateRepairSuccessRate(equipment);
            const isSuccess = Math.random() * 100 < successRate;
    
            userData.research.funds -= repairCost;
    
            if (isSuccess) {
                const repairEffects = repairSystem.generateRepairEffects(equipment);
                
                // 应用维修效果
                equipment.attributes.durability = Math.min(100, 
                    equipment.attributes.durability + repairEffects.durabilityRestore);
                equipment.attributes.efficiency += repairEffects.efficiencyBonus;
                equipment.attributes.stability += repairEffects.stabilityBonus;
    
                // 记录维修历史
                if (!equipment.maintenanceHistory) equipment.maintenanceHistory = [];
                equipment.maintenanceHistory.push({
                    date: new Date().toISOString(),
                    effects: repairEffects,
                    cost: repairCost
                });
    
                return {
                    success: true,
                    isRepairSuccess: true,
                    effects: repairEffects,
                    cost: repairCost
                };
            } else {
                const additionalDamage = repairSystem.handleRepairFailure(equipment);
                return {
                    success: true,
                    isRepairSuccess: false,
                    damage: additionalDamage,
                    cost: repairCost
                };
            }
        };
    
        // 生成维修报告
        const generateRepairReport = (result) => {
            if (result.isRepairSuccess) {
                const report = [
                    "🛠️ 设备维修成功！\n",
                    `设备: ${equipment.name}`,
                    `消耗资金: ${result.cost}元`,
                    `剩余资金: ${userData.research.funds}元`,
                    "\n📈 维修效果:",
                    `耐久度: +${result.effects.durabilityRestore}`,
                    `效率: +${result.effects.efficiencyBonus}`,
                    `稳定性: +${result.effects.stabilityBonus}`,
                    `\n当前耐久度: ${equipment.attributes.durability}%`
                ];
    
                if (result.effects.special) {
                    report.push(
                        "\n✨ 获得特殊效果！",
                        `${result.effects.special.name}: +${result.effects.special.value}%`
                    );
                }
    
                return report.join("\n");
            } else {
                return [
                    "💔 维修失败...\n",
                    `设备: ${equipment.name}`,
                    `消耗资金: ${result.cost}元`,
                    `剩余资金: ${userData.research.funds}元`,
                    `额外损坏: -${result.damage}耐久度`,
                    `当前耐久度: ${equipment.attributes.durability}%`,
                    "\n💡 建议:",
                    "• 考虑更换维修工具",
                    "• 等级越高维修难度越大",
                    "• 可以寻求专业维修服务"
                ].join("\n");
            }
        };
    
        // 执行维修并发送报告
        const result = await performRepair();
        if (!result.success) {
            e.reply(result.message);
            return;
        }
    
        const report = generateRepairReport(result);
        e.reply(report);
    
        // 检查成就
        if (equipment.maintenanceHistory?.length >= 10) {
            const achievement = {
                id: "maintenance_expert",
                name: "维修专家",
                date: new Date().toISOString()
            };
            if (!userData.research.achievements.some(a => a.id === achievement.id)) {
                userData.research.achievements.push(achievement);
                e.reply("🎊 解锁成就【维修专家】！");
            }
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Apply_research_project(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法申请项目哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        const projectName = e.msg.replace('#科研项目申请', '').trim();
    
        // 项目申请系统
        const projectSystem = {
            // 检查申请资格
            checkEligibility: (userData) => {
                const requirements = {
                    minLevel: 3,
                    minFunds: 5000,
                    maxActiveProjects: 3,
                    minTeamMembers: 2
                };
    
                return {
                    eligible: 
                        userData.research.level >= requirements.minLevel &&
                        userData.research.funds >= requirements.minFunds &&
                        userData.research.projects.length < requirements.maxActiveProjects &&
                        userData.research.researchMembers.length >= requirements.minTeamMembers,
                    requirements: requirements
                };
            },
    
            // 生成项目属性
            generateProjectAttributes: () => {
                return {
                    difficulty: Math.floor(Math.random() * 5) + 1,
                    duration: Math.floor(Math.random() * 30) + 30, // 天数
                    requiredSkills: generateRequiredSkills(),
                    potentialRewards: generatePotentialRewards()
                };
            },
    
            // 计算项目成功率
            calculateSuccessRate: (project, userData) => {
                let baseRate = 70;
                // 团队技能匹配度
                const skillMatch = calculateTeamSkillMatch(project, userData.research.researchMembers);
                // 设备支持度
                const equipmentSupport = calculateEquipmentSupport(project, userData.research.researchEquipment);
                // 资金充足度
                const fundingSufficiency = Math.min(100, (userData.research.funds / project.requiredFunds) * 100);
    
                return Math.min(95, baseRate + skillMatch + equipmentSupport + (fundingSufficiency - 100) / 2);
            },
    
            // 分析项目风险
            analyzeProjectRisks: (project, userData) => {
                const risks = [];
                // 技能缺口风险
                const skillGaps = findSkillGaps(project, userData.research.researchMembers);
                if (skillGaps.length > 0) {
                    risks.push({
                        type: "技能缺口",
                        description: `缺少以下技能: ${skillGaps.join(', ')}`,
                        severity: "高"
                    });
                }
    
                // 资金风险
                if (userData.research.funds < project.requiredFunds * 1.2) {
                    risks.push({
                        type: "资金风险",
                        description: "资金储备可能不足以应对意外情况",
                        severity: "中"
                    });
                }
    
                // 设备风险
                const equipmentRisks = analyzeEquipmentRisks(project, userData.research.researchEquipment);
                risks.push(...equipmentRisks);
    
                return risks;
            }
        };
    
        // 生成所需技能
        const generateRequiredSkills = () => {
            const possibleSkills = [
                "数据分析", "实验设计", "仪器操作",
                "理论研究", "文献综述", "项目管理"
            ];
            const skillCount = Math.floor(Math.random() * 3) + 2;
            const skills = {};
            for (let i = 0; i < skillCount; i++) {
                const skill = possibleSkills[Math.floor(Math.random() * possibleSkills.length)];
                skills[skill] = Math.floor(Math.random() * 30) + 50;
            }
            return skills;
        };
    
        // 生成潜在奖励
        const generatePotentialRewards = () => {
            return {
                funds: Math.floor(Math.random() * 10000) + 5000,
                experience: Math.floor(Math.random() * 500) + 200,
                reputation: Math.floor(Math.random() * 100) + 50,
                specialRewards: generateSpecialRewards()
            };
        };
    
        // 生成特殊奖励
        const generateSpecialRewards = () => {
            const specialRewards = [
                { type: "设备升级券", value: "随机设备等级+1" },
                { type: "人才招募券", value: "免费招募一名高级研究员" },
                { type: "资金翻倍券", value: "项目完成奖励翻倍" }
            ];
            return Math.random() < 0.3 ? // 30%概率获得特殊奖励
                specialRewards[Math.floor(Math.random() * specialRewards.length)] : null;
        };
    
        // 执行项目申请
        const applyForProject = async () => {
            const eligibilityCheck = projectSystem.checkEligibility(userData);
            if (!eligibilityCheck.eligible) {
                return {
                    success: false,
                    message: generateEligibilityErrorMessage(eligibilityCheck.requirements, userData)
                };
            }
    
            const project = {
                name: projectName,
                attributes: projectSystem.generateProjectAttributes(),
                startDate: new Date().toISOString(),
                progress: 0,
                status: "进行中"
            };
    
            const successRate = projectSystem.calculateSuccessRate(project, userData);
            const risks = projectSystem.analyzeProjectRisks(project, userData);
    
            userData.research.projects.push(project);
    
            return {
                success: true,
                project: project,
                successRate: successRate,
                risks: risks
            };
        };
    
        // 生成申请报告
        const generateApplicationReport = (result) => {
            const report = [
                "📋 项目申请报告\n",
                `项目名称: ${result.project.name}`,
                `难度等级: ${"★".repeat(result.project.attributes.difficulty)}`,
                `预计周期: ${result.project.attributes.duration}天`,
                "\n🎯 所需技能:",
                ...Object.entries(result.project.attributes.requiredSkills)
                    .map(([skill, level]) => `• ${skill}: ${level}`),
                "\n💰 潜在奖励:",
                `• 资金: ${result.project.attributes.potentialRewards.funds}`,
                `• 经验: ${result.project.attributes.potentialRewards.experience}`,
                `• 声望: ${result.project.attributes.potentialRewards.reputation}`
            ];
    
            if (result.project.attributes.potentialRewards.specialRewards) {
                report.push(
                    `• 特殊奖励: ${result.project.attributes.potentialRewards.specialRewards.type}`
                );
            }
    
            report.push(
                `\n📊 项目评估:`,
                `成功率: ${result.successRate}%`
            );
    
            if (result.risks.length > 0) {
                report.push(
                    "\n⚠️ 风险提示:",
                    ...result.risks.map(risk => 
                        `• [${risk.severity}] ${risk.type}: ${risk.description}`
                    )
                );
            }
    
            return report.join("\n");
        };
    
        // 执行申请并发送报告
        const result = await applyForProject();
        if (!result.success) {
            e.reply(result.message);
            return;
        }
    
        const report = generateApplicationReport(result);
        e.reply(report);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Show_research_project_list(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法查看项目列表哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        // 项目列表管理系统
        const projectListSystem = {
            // 项目分类
            categorizeProjects: (projects) => {
                return {
                    ongoing: projects.filter(p => p.status === "进行中"),
                    completed: projects.filter(p => p.status === "已完成"),
                    failed: projects.filter(p => p.status === "失败"),
                    pending: projects.filter(p => p.status === "待审核")
                };
            },
    
            // 计算项目统计数据
            calculateProjectStats: (projects) => {
                return {
                    totalProjects: projects.length,
                    successRate: calculateSuccessRate(projects),
                    averageCompletion: calculateAverageCompletion(projects),
                    totalInvestment: calculateTotalInvestment(projects),
                    totalReturns: calculateTotalReturns(projects)
                };
            },
    
            // 生成项目时间线
            generateProjectTimeline: (projects) => {
                return projects
                    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                    .map(project => ({
                        name: project.name,
                        date: new Date(project.startDate).toLocaleDateString(),
                        milestone: generateMilestone(project)
                    }));
            },
    
            // 分析研究趋势
            analyzeResearchTrends: (projects) => {
                const trends = {
                    popularFields: analyzePopularFields(projects),
                    successfulApproaches: analyzeSuccessfulApproaches(projects),
                    challengingAreas: analyzeChallengingAreas(projects)
                };
                return trends;
            }
        };
    
        // 计算成功率
        const calculateSuccessRate = (projects) => {
            const completed = projects.filter(p => p.status === "已完成").length;
            return projects.length > 0 ? 
                Math.floor((completed / projects.length) * 100) : 0;
        };
    
        // 计算平均完成度
        const calculateAverageCompletion = (projects) => {
            const ongoingProjects = projects.filter(p => p.status === "进行中");
            if (ongoingProjects.length === 0) return 0;
            const totalProgress = ongoingProjects.reduce((sum, p) => sum + p.progress, 0);
            return Math.floor(totalProgress / ongoingProjects.length);
        };
    
        // 计算总投资
        const calculateTotalInvestment = (projects) => {
            return projects.reduce((sum, p) => sum + (p.investment || 0), 0);
        };
    
        // 计算总回报
        const calculateTotalReturns = (projects) => {
            return projects
                .filter(p => p.status === "已完成")
                .reduce((sum, p) => sum + (p.returns || 0), 0);
        };
    
        // 生成项目里程碑
        const generateMilestone = (project) => {
            const milestones = [
                { progress: 25, description: "初步成果" },
                { progress: 50, description: "重要突破" },
                { progress: 75, description: "关键阶段" },
                { progress: 100, description: "项目完成" }
            ];
    
            return milestones.find(m => project.progress >= m.progress)?.description || "启动阶段";
        };
    
        // 分析热门研究领域
        const analyzePopularFields = (projects) => {
            const fields = {};
            projects.forEach(project => {
                if (!fields[project.field]) fields[project.field] = 0;
                fields[project.field]++;
            });
            return Object.entries(fields)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([field, count]) => ({ field, count }));
        };
    
        // 分析成功方法
        const analyzeSuccessfulApproaches = (projects) => {
            return projects
                .filter(p => p.status === "已完成")
                .map(p => p.approach)
                .reduce((acc, approach) => {
                    if (!acc[approach]) acc[approach] = 0;
                    acc[approach]++;
                    return acc;
                }, {});
        };
    
        // 分析困难领域
        const analyzeChallengingAreas = (projects) => {
            return projects
                .filter(p => p.status === "失败")
                .map(p => ({
                    field: p.field,
                    reason: p.failureReason
                }));
        };
    
        // 生成项目列表报告
        const generateProjectListReport = () => {
            const categorizedProjects = projectListSystem.categorizeProjects(userData.research.projects);
            const stats = projectListSystem.calculateProjectStats(userData.research.projects);
            const timeline = projectListSystem.generateProjectTimeline(userData.research.projects);
            const trends = projectListSystem.analyzeResearchTrends(userData.research.projects);
    
            const report = [
                `✨ ${userData.research.researcherTitle}的项目列表报告 ✨\n`,
                "📊 总体统计:",
                `项目总数: ${stats.totalProjects}`,
                `成功率: ${stats.successRate}%`,
                `平均进度: ${stats.averageCompletion}%`,
                `总投资: ${stats.totalInvestment}元`,
                `总回报: ${stats.totalReturns}元`
            ];
    
            // 进行中的项目
            if (categorizedProjects.ongoing.length > 0) {
                report.push("\n🔄 进行中的项目:");
                categorizedProjects.ongoing.forEach(project => {
                    report.push(
                        `• ${project.name}`,
                        `  进度: ${project.progress}%`,
                        `  里程碑: ${generateMilestone(project)}`,
                        "---"
                    );
                });
            }
    
            // 研究趋势
            if (trends.popularFields.length > 0) {
                report.push("\n📈 研究趋势:");
                trends.popularFields.forEach(field => {
                    report.push(`• ${field.field}: ${field.count}个项目`);
                });
            }
    
            // 项目时间线
            if (timeline.length > 0) {
                report.push("\n📅 近期项目:");
                timeline.slice(0, 5).forEach(event => {
                    report.push(`• ${event.date}: ${event.name} (${event.milestone})`);
                });
            }
    
            return report.join("\n");
        };
    
        // 发送报告
        const report = generateProjectListReport();
        e.reply(report);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Complete_research_project(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法完成项目哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        const projectName = e.msg.replace('#科研项目完成', '').trim();
        const projectIndex = userData.research.projects.findIndex(p => p.name === projectName);
    
        if (projectIndex === -1) {
            e.reply("没有找到这个项目呢，请检查名称是否正确~");
            return;
        }
    
        // 项目完成系统
        const completionSystem = {
            // 验证完成条件
            validateCompletion: (project) => {
                return {
                    timeComplete: checkTimeRequirement(project),
                    progressComplete: project.progress >= 100,
                    resourcesComplete: checkResourceRequirement(project),
                    qualityComplete: checkQualityRequirement(project)
                };
            },
    
            // 计算最终评分
            calculateFinalScore: (project, userData) => {
                let score = 0;
                // 基础分数
                score += project.progress;
                // 时间因素
                score += calculateTimeBonus(project);
                // 质量因素
                score += calculateQualityBonus(project);
                // 创新因素
                score += calculateInnovationBonus(project);
                return Math.min(100, Math.floor(score));
            },
    
            // 生成奖励
            generateRewards: (project, finalScore) => {
                const baseRewards = {
                    funds: project.baseReward * (finalScore / 100),
                    experience: Math.floor(project.baseExperience * (finalScore / 100)),
                    reputation: Math.floor(project.baseReputation * (finalScore / 100))
                };
    
                // 特殊奖励
                if (finalScore >= 90) {
                    baseRewards.bonus = generateExcellentBonus();
                }
    
                return baseRewards;
            },
    
            // 更新团队经验
            updateTeamExperience: (project, userData) => {
                userData.research.researchMembers.forEach(member => {
                    if (project.team.includes(member.name)) {
                        member.experience += Math.floor(project.baseExperience * 0.2);
                        member.projectCount = (member.projectCount || 0) + 1;
                    }
                });
            }
        };
    
        // 检查时间要求
        const checkTimeRequirement = (project) => {
            const elapsed = (new Date() - new Date(project.startDate)) / (1000 * 60 * 60 * 24);
            return elapsed >= project.minDuration;
        };
    
        // 检查资源要求
        const checkResourceRequirement = (project) => {
            return project.requiredResources.every(resource => 
                userData.research.resources[resource.type] >= resource.amount);
        };
    
        // 检查质量要求
        const checkQualityRequirement = (project) => {
            return project.qualityIndicators.every(indicator => 
                project.currentQuality[indicator.type] >= indicator.required);
        };
    
        // 计算时间奖励
        const calculateTimeBonus = (project) => {
            const expectedDuration = project.expectedDuration;
            const actualDuration = (new Date() - new Date(project.startDate)) / (1000 * 60 * 60 * 24);
            return Math.max(0, Math.floor((expectedDuration - actualDuration) / expectedDuration * 10));
        };
    
        // 计算质量奖励
        const calculateQualityBonus = (project) => {
            return Math.floor(Object.values(project.currentQuality)
                .reduce((sum, quality) => sum + quality, 0) / Object.keys(project.currentQuality).length);
        };
    
        // 计算创新奖励
        const calculateInnovationBonus = (project) => {
            return project.innovationPoints || 0;
        };
    
        // 生成优秀奖励
        const generateExcellentBonus = () => {
            const bonuses = [
                { type: "设备升级券", value: 1 },
                { type: "团队经验加倍", duration: "7天" },
                { type: "声望加成", value: "50%" }
            ];
            return bonuses[Math.floor(Math.random() * bonuses.length)];
        };
    
        // 执行项目完成
        const completeProject = async () => {
            const project = userData.research.projects[projectIndex];
            const completionCheck = completionSystem.validateCompletion(project);
    
            if (!Object.values(completionCheck).every(check => check)) {
                return {
                    success: false,
                    message: generateCompletionErrorMessage(completionCheck)
                };
            }
    
            const finalScore = completionSystem.calculateFinalScore(project, userData);
            const rewards = completionSystem.generateRewards(project, finalScore);
    
            // 应用奖励
            userData.research.funds += rewards.funds;
            userData.research.experience += rewards.experience;
            userData.research.reputation += rewards.reputation;
    
            // 更新团队经验
            completionSystem.updateTeamExperience(project, userData);
    
            // 更新项目状态
            project.status = "已完成";
            project.completionDate = new Date().toISOString();
            project.finalScore = finalScore;
            project.rewards = rewards;
    
            return {
                success: true,
                project: project,
                rewards: rewards,
                finalScore: finalScore
            };
        };
    
        // 生成完成报告
        const generateCompletionReport = (result) => {
            const report = [
                "🎉 项目完成报告\n",
                `项目名称: ${result.project.name}`,
                `最终评分: ${result.finalScore}分`,
                "\n🎁 获得奖励:",
                `• 研究资金: ${result.rewards.funds}元`,
                `• 经验值: ${result.rewards.experience}`,
                `• 声望值: ${result.rewards.reputation}`
            ];
    
            if (result.rewards.bonus) {
                report.push(
                    "\n✨ 特殊奖励:",
                    `• ${result.rewards.bonus.type}: ${result.rewards.bonus.value || result.rewards.bonus.duration}`
                );
            }
    
            report.push(
                "\n📈 项目总结:",
                `• 持续时间: ${calculateProjectDuration(result.project)}天`,
                `• 团队贡献: ${calculateTeamContributions(result.project)}`,
                `• 创新突破: ${result.project.innovations || "无"}`
            );
    
            return report.join("\n");
        };
    
        // 执行完成并发送报告
        const result = await completeProject();
        if (!result.success) {
            e.reply(result.message);
            return;
        }
    
        const report = generateCompletionReport(result);
        e.reply(report);
    
        // 检查成就
        checkProjectAchievements(userData, result);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Publish_research_paper(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法发表论文哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        const paperName = e.msg.replace('#科研论文发表', '').trim();
        const paper = userData.research.papers.find(p => p.name === paperName);
    
        // 论文发表系统
        const publicationSystem = {
            // 检查论文质量
            evaluatePaperQuality: (paper) => {
                const criteria = {
                    originality: calculateOriginality(paper),
                    methodology: evaluateMethodology(paper),
                    significance: assessSignificance(paper),
                    presentation: evaluatePresentation(paper)
                };
                
                return {
                    score: calculateOverallScore(criteria),
                    details: criteria
                };
            },
    
            // 选择期刊
            selectJournal: (paper, quality) => {
                const journals = [
                    {
                        tier: "S级",
                        requirements: { minScore: 90, minCitations: 50 },
                        impact: 5.0,
                        reviewTime: 60
                    },
                    {
                        tier: "A级",
                        requirements: { minScore: 80, minCitations: 30 },
                        impact: 3.0,
                        reviewTime: 45
                    },
                    {
                        tier: "B级",
                        requirements: { minScore: 70, minCitations: 15 },
                        impact: 2.0,
                        reviewTime: 30
                    },
                    {
                        tier: "C级",
                        requirements: { minScore: 60, minCitations: 5 },
                        impact: 1.0,
                        reviewTime: 20
                    }
                ];
    
                return journals.find(j => 
                    quality.score >= j.requirements.minScore &&
                    (paper.citations || 0) >= j.requirements.minCitations
                ) || journals[journals.length - 1];
            },
    
            // 模拟审稿过程
            simulateReviewProcess: (paper, journal) => {
                const reviewResults = {
                    accepted: Math.random() * 100 < calculateAcceptanceChance(paper, journal),
                    comments: generateReviewComments(paper),
                    revisionNeeded: Math.random() > 0.3,
                    reviewTime: calculateReviewTime(journal)
                };
                return reviewResults;
            },
    
            // 计算论文影响力
            calculateImpact: (paper, journal) => {
                let impact = journal.impact;
                // 引用加成
                impact += (paper.citations || 0) * 0.1;
                // 创新性加成
                impact += paper.originality * 0.2;
                // 研究深度加成
                impact += paper.depth * 0.15;
                return Math.floor(impact * 10) / 10;
            }
        };
    
        // 生成审稿评语
        const generateReviewComments = (paper) => {
            const positiveComments = [
                "研究方法严谨",
                "论述清晰明确",
                "创新性突出",
                "实验设计合理"
            ];
    
            const negativeComments = [
                "需要补充更多实验数据",
                "文献综述可以更全面",
                "结论需要更强的支持",
                "统计方法有待改进"
            ];
    
            const comments = [];
            // 根据论文质量选择评语
            if (paper.quality > 80) {
                comments.push(...positiveComments.slice(0, 2));
            }
            if (paper.quality < 70) {
                comments.push(...negativeComments.slice(0, 2));
            }
    
            return comments;
        };
    
        // 计算接受概率
        const calculateAcceptanceChance = (paper, journal) => {
            let chance = 50;
            // 质量影响
            chance += (paper.quality - journal.requirements.minScore) * 0.5;
            // 引用影响
            chance += (paper.citations - journal.requirements.minCitations) * 0.3;
            return Math.min(95, Math.max(5, chance));
        };
    
        // 计算审稿时间
        const calculateReviewTime = (journal) => {
            const baseTime = journal.reviewTime;
            const variation = Math.floor(Math.random() * 10) - 5; // ±5天随机变化
            return baseTime + variation;
        };
    
        // 执行论文发表
        const publishPaper = async () => {
            if (!paper) {
                return {
                    success: false,
                    message: "未找到该论文，请检查名称是否正确~"
                };
            }
    
            const quality = publicationSystem.evaluatePaperQuality(paper);
            const journal = publicationSystem.selectJournal(paper, quality);
            const reviewResults = publicationSystem.simulateReviewProcess(paper, journal);
            const impact = publicationSystem.calculateImpact(paper, journal);
    
            if (reviewResults.accepted) {
                // 更新论文状态
                paper.status = "已发表";
                paper.publishDate = new Date().toISOString();
                paper.journal = journal.tier;
                paper.impact = impact;
    
                // 更新研究员属性
                userData.research.reputation += Math.floor(impact * 10);
                userData.research.experience += Math.floor(impact * 20);
    
                return {
                    success: true,
                    paper: paper,
                    journal: journal,
                    reviewResults: reviewResults,
                    impact: impact
                };
            } else {
                return {
                    success: false,
                    message: "论文未通过审核",
                    reviewResults: reviewResults
                };
            }
        };
    
        // 生成发表报告
        const generatePublicationReport = (result) => {
            if (result.success) {
                return [
                    "📝 论文发表成功！\n",
                    `论文标题: ${result.paper.name}`,
                    `发表期刊: ${result.journal.tier}`,
                    `影响因子: ${result.impact}`,
                    "\n📊 审稿评语:",
                    ...result.reviewResults.comments,
                    "\n🎁 获得奖励:",
                    `• 声望值: +${Math.floor(result.impact * 10)}`,
                    `• 经验值: +${Math.floor(result.impact * 20)}`,
                    "\n⏳ 审稿周期:",
                    `${result.reviewResults.reviewTime}天`
                ].join("\n");
            } else {
                return [
                    "❌ 论文发表失败\n",
                    "审稿意见:",
                    ...result.reviewResults.comments,
                    "\n💡 建议:",
                    "• 完善研究内容",
                    "• 补充实验数据",
                    "• 改进写作方式"
                ].join("\n");
            }
        };
    
        // 执行发表并发送报告
        const result = await publishPaper();
        const report = generatePublicationReport(result);
        e.reply(report);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Apply_research_patent(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法申请专利哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        const patentName = e.msg.replace('#科研专利申请', '').trim();
    
        // 专利申请系统
        const patentSystem = {
            // 检查专利创新性
            checkInnovation: (patent, existingPatents) => {
                const innovationScore = {
                    uniqueness: calculateUniqueness(patent, existingPatents),
                    technicalValue: evaluateTechnicalValue(patent),
                    marketPotential: assessMarketPotential(patent),
                    practicalApplicability: evaluatePracticalValue(patent)
                };
                return innovationScore;
            },
    
            // 评估专利价值
            evaluatePatentValue: (patent, innovationScore) => {
                let value = 0;
                value += innovationScore.uniqueness * 30;
                value += innovationScore.technicalValue * 25;
                value += innovationScore.marketPotential * 25;
                value += innovationScore.practicalApplicability * 20;
                return Math.floor(value / 100);
            },
    
            // 计算申请成本
            calculateApplicationCost: (patent) => {
                const baseCost = 5000;
                const complexityFactor = patent.complexity || 1;
                const scopeFactor = calculateScopeFactor(patent);
                return Math.floor(baseCost * complexityFactor * scopeFactor);
            },
    
            // 生成专利保护范围
            generatePatentScope: (patent) => {
                return {
                    core: patent.coreTechnology,
                    extended: generateExtendedScope(patent),
                    applications: generateApplicationScenarios(patent),
                    limitations: generateLimitations(patent)
                };
            }
        };
    
        // 计算独特性
        const calculateUniqueness = (patent, existingPatents) => {
            let uniqueness = 100;
            existingPatents.forEach(existing => {
                const similarity = calculateSimilarity(patent, existing);
                uniqueness = Math.min(uniqueness, 100 - similarity);
            });
            return uniqueness;
        };
    
        // 评估技术价值
        const evaluateTechnicalValue = (patent) => {
            let value = 0;
            // 技术先进性
            value += patent.advancedLevel * 0.4;
            // 解决问题的效果
            value += patent.solutionEffectiveness * 0.3;
            // 技术成熟度
            value += patent.maturityLevel * 0.3;
            return Math.floor(value);
        };
    
        // 评估市场潜力
        const assessMarketPotential = (patent) => {
            let potential = 0;
            // 市场需求
            potential += patent.marketDemand * 0.4;
            // 商业化可行性
            potential += patent.commercializationFeasibility * 0.3;
            // 竞争优势
            potential += patent.competitiveAdvantage * 0.3;
            return Math.floor(potential);
        };
    
        // 执行专利申请
        const applyForPatent = async () => {
            const newPatent = {
                name: patentName,
                applicant: userData.research.researcherTitle,
                applicationDate: new Date().toISOString(),
                status: "审查中",
                type: determinePatentType(),
                inventors: generateInventorsList(),
                technicalField: determineTechnicalField()
            };
    
            // 检查创新性
            const innovationScore = patentSystem.checkInnovation(newPatent, userData.research.patents);
            const patentValue = patentSystem.evaluatePatentValue(newPatent, innovationScore);
            const applicationCost = patentSystem.calculateApplicationCost(newPatent);
    
            if (userData.research.funds < applicationCost) {
                return {
                    success: false,
                    message: `申请费用不足！需要${applicationCost}元，当前资金${userData.research.funds}元`
                };
            }
    
            // 扣除费用
            userData.research.funds -= applicationCost;
    
            // 添加专利详情
            newPatent.innovationScore = innovationScore;
            newPatent.value = patentValue;
            newPatent.scope = patentSystem.generatePatentScope(newPatent);
    
            // 添加到专利列表
            userData.research.patents.push(newPatent);
    
            return {
                success: true,
                patent: newPatent,
                cost: applicationCost
            };
        };
    
        // 生成申请报告
        const generatePatentReport = (result) => {
            if (!result.success) {
                return result.message;
            }
    
            const report = [
                "📜 专利申请报告\n",
                `专利名称: ${result.patent.name}`,
                `申请人: ${result.patent.applicant}`,
                `技术领域: ${result.patent.technicalField}`,
                `申请费用: ${result.cost}元`,
                "\n📊 创新性评分:",
                `独特性: ${result.patent.innovationScore.uniqueness}`,
                `技术价值: ${result.patent.innovationScore.technicalValue}`,
                `市场潜力: ${result.patent.innovationScore.marketPotential}`,
                `实用性: ${result.patent.innovationScore.practicalApplicability}`,
                "\n🔍 保护范围:",
                `核心技术: ${result.patent.scope.core}`,
                `扩展应用: ${result.patent.scope.applications.join(', ')}`,
                "\n⏳ 预计审查周期: 1-3个月"
            ];
    
            return report.join("\n");
        };
    
        // 执行申请并发送报告
        const result = await applyForPatent();
        const report = generatePatentReport(result);
        e.reply(report);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Show_research_paper_list(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法查看论文列表哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        // 论文列表管理系统
        const paperListSystem = {
            // 论文分类
            categorizePapers: (papers) => {
                return {
                    published: papers.filter(p => p.status === "已发表"),
                    inReview: papers.filter(p => p.status === "审稿中"),
                    draft: papers.filter(p => p.status === "草稿"),
                    rejected: papers.filter(p => p.status === "已拒绝")
                };
            },
    
            // 计算论文统计数据
            calculatePaperStats: (papers) => {
                return {
                    totalPapers: papers.length,
                    totalCitations: calculateTotalCitations(papers),
                    averageImpact: calculateAverageImpact(papers),
                    topJournals: findTopJournals(papers),
                    researchTrends: analyzeResearchTrends(papers)
                };
            },
    
            // 生成引用网络
            generateCitationNetwork: (papers) => {
                const network = {
                    nodes: papers.map(p => ({
                        id: p.id,
                        name: p.name,
                        citations: p.citations || 0
                    })),
                    links: []
                };
    
                papers.forEach(paper => {
                    (paper.references || []).forEach(ref => {
                        network.links.push({
                            source: paper.id,
                            target: ref,
                            type: "引用"
                        });
                    });
                });
    
                return network;
            },
    
            // 分析研究主题
            analyzeResearchTopics: (papers) => {
                const topics = {};
                papers.forEach(paper => {
                    (paper.keywords || []).forEach(keyword => {
                        topics[keyword] = (topics[keyword] || 0) + 1;
                    });
                });
                return Object.entries(topics)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5);
            }
        };
    
        // 计算总引用次数
        const calculateTotalCitations = (papers) => {
            return papers.reduce((sum, paper) => sum + (paper.citations || 0), 0);
        };
    
        // 计算平均影响因子
        const calculateAverageImpact = (papers) => {
            const publishedPapers = papers.filter(p => p.status === "已发表");
            if (publishedPapers.length === 0) return 0;
            const totalImpact = publishedPapers.reduce((sum, p) => sum + (p.impact || 0), 0);
            return (totalImpact / publishedPapers.length).toFixed(2);
        };
    
        // 查找高影响力期刊
        const findTopJournals = (papers) => {
            const journals = {};
            papers.forEach(paper => {
                if (paper.journal) {
                    journals[paper.journal] = (journals[paper.journal] || 0) + 1;
                }
            });
            return Object.entries(journals)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3);
        };
    
        // 分析研究趋势
        const analyzeResearchTrends = (papers) => {
            const trends = {};
            papers.forEach(paper => {
                const year = new Date(paper.publishDate || paper.createDate).getFullYear();
                if (!trends[year]) trends[year] = 0;
                trends[year]++;
            });
            return trends;
        };
    
        // 生成论文列表报告
        const generatePaperListReport = () => {
            const categorizedPapers = paperListSystem.categorizePapers(userData.research.papers);
            const stats = paperListSystem.calculatePaperStats(userData.research.papers);
            const citationNetwork = paperListSystem.generateCitationNetwork(userData.research.papers);
            const topics = paperListSystem.analyzeResearchTopics(userData.research.papers);
    
            const report = [
                `✨ ${userData.research.researcherTitle}的论文列表报告 ✨\n`,
                "📊 总体统计:",
                `论文总数: ${stats.totalPapers}篇`,
                `总引用数: ${stats.totalCitations}次`,
                `平均影响因子: ${stats.averageImpact}`,
                "\n📑 论文状态:",
                `已发表: ${categorizedPapers.published.length}篇`,
                `审稿中: ${categorizedPapers.inReview.length}篇`,
                `草稿: ${categorizedPapers.draft.length}篇`
            ];
    
            // 展示已发表论文
            if (categorizedPapers.published.length > 0) {
                report.push("\n📖 已发表论文:");
                categorizedPapers.published.forEach(paper => {
                    report.push(
                        `• ${paper.name}`,
                        `  期刊: ${paper.journal}`,
                        `  影响因子: ${paper.impact}`,
                        `  引用: ${paper.citations || 0}次`,
                        "---"
                    );
                });
            }
    
            // 展示研究主题
            if (topics.length > 0) {
                report.push("\n🔍 研究主题:");
                topics.forEach(([topic, count]) => {
                    report.push(`• ${topic}: ${count}篇`);
                });
            }
    
            // 展示顶级期刊发表情况
            if (stats.topJournals.length > 0) {
                report.push("\n🏆 期刊发表:",
                    ...stats.topJournals.map(([journal, count]) => 
                        `• ${journal}: ${count}篇`
                    )
                );
            }
    
            return report.join("\n");
        };
    
        // 发送报告
        const report = generatePaperListReport();
        e.reply(report);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Transfer_research_results(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 检查封禁状态
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("亲爱的研究员，您当前处于封禁状态，暂时无法转让研究成果哦~");
            return;
        }
    
        if (!userData.research) {
            e.reply("请先使用 #开始科研 初始化您的研究系统~");
            return;
        }
    
        const resultName = e.msg.replace('#科学研究成果转让', '').trim();
    
        // 研究成果转让系统
        const transferSystem = {
            // 评估成果价值
            evaluateResultValue: (result) => {
                return {
                    baseValue: calculateBaseValue(result),
                    marketValue: assessMarketValue(result),
                    potentialValue: calculatePotentialValue(result),
                    totalValue: 0 // 将在后续计算
                };
            },
    
            // 寻找潜在买家
            findPotentialBuyers: (result) => {
                const buyers = generatePotentialBuyers(result);
                return buyers.map(buyer => ({
                    ...buyer,
                    offerPrice: calculateBuyerOffer(buyer, result)
                }));
            },
    
            // 生成转让协议
            generateTransferAgreement: (result, buyer) => {
                return {
                    transferType: determineTransferType(result),
                    paymentTerms: generatePaymentTerms(buyer),
                    restrictions: generateRestrictions(result),
                    duration: calculateTransferDuration(result)
                };
            },
    
            // 计算声望影响
            calculateReputationImpact: (result, transferValue) => {
                return {
                    personal: calculatePersonalReputation(result, transferValue),
                    institutional: calculateInstitutionalReputation(result),
                    field: calculateFieldReputation(result)
                };
            }
        };
    
        // 计算基础价值
        const calculateBaseValue = (result) => {
            let value = 0;
            // 研究投入
            value += result.investment * 1.2;
            // 创新程度
            value += result.innovationLevel * 1000;
            // 完成度
            value += result.completionRate * 500;
            return Math.floor(value);
        };
    
        // 评估市场价值
        const assessMarketValue = (result) => {
            let value = 0;
            // 市场需求
            value += result.marketDemand * 2000;
            // 应用范围
            value += result.applicationScope * 1500;
            // 竞争优势
            value += result.competitiveAdvantage * 1000;
            return Math.floor(value);
        };
    
        // 生成潜在买家
        const generatePotentialBuyers = (result) => {
            const buyerTypes = [
                {
                    type: "企业",
                    interestLevel: Math.random() * 100,
                    negotiationStyle: "积极",
                    budget: Math.floor(Math.random() * 1000000) + 500000
                },
                {
                    type: "研究机构",
                    interestLevel: Math.random() * 100,
                    negotiationStyle: "谨慎",
                    budget: Math.floor(Math.random() * 800000) + 300000
                },
                {
                    type: "政府部门",
                    interestLevel: Math.random() * 100,
                    negotiationStyle: "规范",
                    budget: Math.floor(Math.random() * 1500000) + 1000000
                }
            ];
    
            return buyerTypes.filter(buyer => buyer.interestLevel > 50);
        };
    
        // 执行转让流程
        const transferResult = async () => {
            const result = findResearchResult(resultName, userData);
            if (!result) {
                return {
                    success: false,
                    message: "未找到该研究成果，请检查名称是否正确~"
                };
            }
    
            const value = transferSystem.evaluateResultValue(result);
            const buyers = transferSystem.findPotentialBuyers(result);
            
            if (buyers.length === 0) {
                return {
                    success: false,
                    message: "暂时没有找到合适的买家，建议稍后再试~"
                };
            }
    
            // 选择最佳买家
            const bestBuyer = selectBestBuyer(buyers);
            const agreement = transferSystem.generateTransferAgreement(result, bestBuyer);
            const reputationImpact = transferSystem.calculateReputationImpact(result, bestBuyer.offerPrice);
    
            // 执行转让
            userData.research.funds += bestBuyer.offerPrice;
            userData.research.reputation += reputationImpact.personal;
    
            // 记录转让历史
            if (!userData.research.transferHistory) {
                userData.research.transferHistory = [];
            }
            userData.research.transferHistory.push({
                resultName: result.name,
                buyer: bestBuyer.type,
                price: bestBuyer.offerPrice,
                date: new Date().toISOString(),
                agreement: agreement
            });
    
            return {
                success: true,
                result: result,
                buyer: bestBuyer,
                agreement: agreement,
                reputationImpact: reputationImpact
            };
        };
    
        // 生成转让报告
        const generateTransferReport = (result) => {
            if (!result.success) {
                return result.message;
            }
    
            const report = [
                "🤝 研究成果转让报告\n",
                `成果名称: ${result.result.name}`,
                `买家类型: ${result.buyer.type}`,
                `成交价格: ${result.buyer.offerPrice}元`,
                "\n📋 转让协议:",
                `转让类型: ${result.agreement.transferType}`,
                `支付方式: ${result.agreement.paymentTerms}`,
                `使用限制: ${result.agreement.restrictions}`,
                `协议期限: ${result.agreement.duration}`,
                "\n📊 声望影响:",
                `个人声望: ${result.reputationImpact.personal > 0 ? '+' : ''}${result.reputationImpact.personal}`,
                `机构声望: ${result.reputationImpact.institutional > 0 ? '+' : ''}${result.reputationImpact.institutional}`,
                `领域影响: ${result.reputationImpact.field > 0 ? '+' : ''}${result.reputationImpact.field}`,
                "\n💰 当前资金:",
                `${userData.research.funds}元`
            ];
    
            return report.join("\n");
        };
    
        // 执行转让并发送报告
        const result = await transferResult();
        const report = generateTransferReport(result);
        e.reply(report);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

}
// 生成资源品质
function generateResourceQuality() {
    const random = Math.random();
    if (random < 0.1) return "SSR"; // 10%
    if (random < 0.3) return "SR";  // 20%
    if (random < 0.6) return "R";   // 30%
    return "N";                     // 40%
}

// 生成购买评价
function generatePurchaseComment(quality) {
    const comments = {
        "SSR": [
            "太棒了！这是极品中的极品！",
            "简直是完美的选择！",
            "这个品质真是太惊喜了！"
        ],
        "SR": [
            "很不错的选择哦~",
            "这个品质相当令人满意！",
            "确实是优质资源呢！"
        ],
        "R": [
            "还不错的选择~",
            "性价比很好呢！",
            "这个品质很实用~"
        ],
        "N": [
            "基础但实用的选择~",
            "可以满足日常研究需求~",
            "性价比不错哦~"
        ]
    };
    const qualityComments = comments[quality];
    return qualityComments[Math.floor(Math.random() * qualityComments.length)];
}

// 更新购买相关成就
function updatePurchaseAchievements(userData) {
    const totalPurchases = Object.values(userData.research.purchaseHistory || {})
        .flat()
        .length;

    const achievements = [
        { count: 10, title: "初级采购员" },
        { count: 50, title: "资深采购员" },
        { count: 100, title: "采购专家" },
        { count: 500, title: "采购大师" }
    ];

    for (const achievement of achievements) {
        if (totalPurchases >= achievement.count && 
            !userData.research.achievements.some(a => a.name === achievement.title)) {
            userData.research.achievements.push({
                name: achievement.title,
                date: new Date().toISOString()
            });
        }
    }
}
 // 检查设备相关成就
 function checkEquipmentAchievements(userData) {
    const achievements = [
        { 
            id: "equipment_collector",
            name: "设备收藏家",
            condition: user => user.research.researchEquipment.length >= 5
        },
        {
            id: "high_tech_lab",
            name: "高科技实验室",
            condition: user => user.research.researchEquipment
                .filter(e => e.attributes.efficiency >= 90).length >= 3
        }
    ];

    achievements.forEach(achievement => {
        if (achievement.condition(userData) && 
            !userData.research.achievements.some(a => a.id === achievement.id)) {
            userData.research.achievements.push({
                id: achievement.id,
                name: achievement.name,
                date: new Date().toISOString()
            });
        }
    });
}
// 计算项目持续时间
function calculateProjectDuration(project) {
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.completionDate || new Date());
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  }
  
  // 计算团队贡献
  function calculateTeamContributions(project) {
    let contributions = [];
    (project.team || []).forEach(member => {
      contributions.push(`${member.name}: ${member.contribution}%`);
    });
    return contributions.join(", ") || "暂无团队贡献记录";
  }
  
  // 检查项目相关成就
  function checkProjectAchievements(userData, result) {
    if (result.finalScore >= 90) {
      const achievement = {
        id: "perfect_project",
        name: "完美项目",
        description: "完成一个90分以上的项目"
      };
      if (!userData.research.achievements.some(a => a.id === achievement.id)) {
        userData.research.achievements.push(achievement);
      }
    }
  }
  
  // 计算设备范围因子
  function calculateScopeFactor(patent) {
    let factor = 1;
    if (patent.international) factor *= 1.5;
    if (patent.multipleFields) factor *= 1.2;
    return factor;
  }
  
  // 生成扩展范围
  function generateExtendedScope(patent) {
    return [
      "衍生技术应用",
      "改进方案",
      "组合使用方式"
    ];
  }
  
  // 生成应用场景
  function generateApplicationScenarios(patent) {
    return [
      "工业生产",
      "科研实验",
      "日常应用"
    ];
  }
  
  // 生成限制条件
  function generateLimitations(patent) {
    return [
      "使用环境要求",
      "技术条件限制",
      "应用范围约束"
    ];
  }
  
  // 确定专利类型
  function determinePatentType() {
    const types = ["发明专利", "实用新型", "外观设计"];
    return types[Math.floor(Math.random() * types.length)];
  }
  
  // 生成发明人列表
  function generateInventorsList() {
    return ["主要发明人", "合作发明人"];
  }
  
  // 确定技术领域
  function determineTechnicalField() {
    const fields = ["信息技术", "生物医药", "新材料", "人工智能"];
    return fields[Math.floor(Math.random() * fields.length)];
  }
  
  // 查找研究成果
  function findResearchResult(name, userData) {
    return userData.research.projects.find(p => p.name === name) ||
           userData.research.papers.find(p => p.name === name) ||
           userData.research.patents.find(p => p.name === name);
  }
  
  // 选择最佳买家
  function selectBestBuyer(buyers) {
    return buyers.sort((a, b) => b.offerPrice - a.offerPrice)[0];
  }
  
  // 确定转让类型
  function determineTransferType(result) {
    const types = ["完全转让", "部分转让", "使用许可"];
    return types[Math.floor(Math.random() * types.length)];
  }
  
  // 生成支付条款
  function generatePaymentTerms(buyer) {
    const terms = ["一次性付款", "分期付款", "里程碑付款"];
    return terms[Math.floor(Math.random() * terms.length)];
  }
  
  // 生成使用限制
  function generateRestrictions(result) {
    return "仅限指定用途使用,不得二次转让";
  }
  
  // 计算转让期限
  function calculateTransferDuration(result) {
    return "5年";
  }
  
  // 计算个人声望影响
  function calculatePersonalReputation(result, transferValue) {
    return Math.floor(transferValue / 10000);
  }
  
  // 计算机构声望影响
  function calculateInstitutionalReputation(result) {
    return Math.floor(Math.random() * 50) + 10;
  }
  
  // 计算领域声望影响
  function calculateFieldReputation(result) {
    return Math.floor(Math.random() * 30) + 5;
  }
  // 计算设备相似度
function calculateSimilarity(patentA, patentB) {
    let similarity = 0;
    // 比较核心技术相似度
    if(patentA.coreTechnology === patentB.coreTechnology) {
      similarity += 50;
    }
    // 比较应用场景相似度
    const commonApplications = patentA.applications.filter(app => 
      patentB.applications.includes(app)
    ).length;
    similarity += commonApplications * 10;
    
    return Math.min(100, similarity);
  }
  
  // 评估实用价值
  function evaluatePracticalValue(patent) {
    let value = 0;
    // 实现成本
    value += (100 - (patent.implementationCost || 50)) * 0.4;
    // 使用便利性
    value += (patent.usability || 50) * 0.3;
    // 维护成本
    value += (100 - (patent.maintenanceCost || 50)) * 0.3;
    return Math.floor(value);
  }
  
  // 计算买家出价
  function calculateBuyerOffer(buyer, result) {
    let offer = buyer.budget * (buyer.interestLevel / 100);
    // 根据谈判风格调整
    switch(buyer.negotiationStyle) {
      case "积极":
        offer *= 1.1;
        break;
      case "谨慎":
        offer *= 0.9;
        break;
      case "规范":
        offer *= 1.0;
        break;
    }
    return Math.floor(offer);
  }
  
  // 计算潜在价值
  function calculatePotentialValue(result) {
    let value = 0;
    // 未来市场增长
    value += (result.marketGrowth || 50) * 100;
    // 技术扩展性
    value += (result.expandability || 50) * 80;
    // 衍生价值
    value += (result.derivativeValue || 50) * 60;
    return Math.floor(value);
  }
  
  // 获取推荐项目
  function getRecommendedProjects(equipment) {
    return [
      "基础研究项目",
      "应用研究项目",
      "技术开发项目"
    ].filter(project => 
      project.match(equipment.type)
    );
  }
  
  // 获取最佳搭档
  function getBestPartners(equipment, members) {
    return members
      .filter(member => 
        member.skills[equipment.type] >= 70
      )
      .slice(0, 3)
      .map(member => member.name);
  }
  
  // 获取风险因素
  function getRiskFactors(equipment) {
    const factors = [];
    if(equipment.attributes.durability < 30) {
      factors.push("耐久度过低");
    }
    if(equipment.attributes.stability < 50) {
      factors.push("稳定性不足");
    }
    if(equipment.usageCount > 100) {
      factors.push("使用次数过多");
    }
    return factors;
  }
  
  // 生成资格错误信息
  function generateEligibilityErrorMessage(requirements, userData) {
    const errors = [];
    if(userData.research.level < requirements.minLevel) {
      errors.push(`研究员等级需要达到${requirements.minLevel}级`);
    }
    if(userData.research.funds < requirements.minFunds) {
      errors.push(`需要至少${requirements.minFunds}研究资金`);
    }
    if(userData.research.projects.length >= requirements.maxActiveProjects) {
      errors.push(`同时进行的项目不能超过${requirements.maxActiveProjects}个`);
    }
    if(userData.research.researchMembers.length < requirements.minTeamMembers) {
      errors.push(`需要至少${requirements.minTeamMembers}名团队成员`);
    }
    return errors.join("\n");
  }
  
  // 计算团队技能匹配度
  function calculateTeamSkillMatch(project, members) {
    let match = 0;
    Object.entries(project.requiredSkills).forEach(([skill, level]) => {
      const bestSkill = Math.max(...members.map(m => m.skills[skill] || 0));
      match += Math.min(100, (bestSkill / level) * 100);
    });
    return Math.floor(match / Object.keys(project.requiredSkills).length);
  }
  
  // 计算设备支持度
  function calculateEquipmentSupport(project, equipment) {
    let support = 0;
    project.requiredEquipment.forEach(req => {
      const bestMatch = equipment.find(e => e.type === req.type);
      if(bestMatch) {
        support += Math.min(100, (bestMatch.level / req.level) * 100);
      }
    });
    return Math.floor(support / project.requiredEquipment.length);
  }
  
  // 寻找技能差距
  function findSkillGaps(project, members) {
    return Object.entries(project.requiredSkills)
      .filter(([skill, level]) => 
        Math.max(...members.map(m => m.skills[skill] || 0)) < level
      )
      .map(([skill]) => skill);
  }
  
  // 分析设备风险
  function analyzeEquipmentRisks(project, equipment) {
    const risks = [];
    project.requiredEquipment.forEach(req => {
      const available = equipment.find(e => e.type === req.type);
      if(!available) {
        risks.push({
          type: "设备缺失",
          description: `缺少${req.type}设备`,
          severity: "高"
        });
      } else if(available.level < req.level) {
        risks.push({
          type: "设备等级不足",
          description: `${req.type}设备等级需要提升`,
          severity: "中"
        });
      }
    });
    return risks;
  }