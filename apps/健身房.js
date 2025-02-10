import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import {
    saveUserData,
    loadAllUsers,
    generateWeapons,
    checkUserData,
    readConfiguration,
    saveBanData,
    loadBanList,
} from '../function/function.js';
import Redis from 'ioredis';
const _path = process.cwd().replace(/\\/g, "/");
const redis = new Redis();
const PLUGIN_PATH = path.join(process.cwd(), 'plugins', 'sims-plugin');
const WEAPON_STORE_FILE_PATH = path.join(PLUGIN_PATH, 'weapon_store.json');

export class UserStart extends plugin {
    constructor() {
        super({
            name: 'UserStart',
            dsc: '游戏开始',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#开设健身房$', fnc: 'Set_up_Gym' },
                { reg: '^#健身房信息$', fnc: 'Show_gym_status' },
                { reg: '^#聘请教练.*$', fnc: 'Hire_coach' },
                { reg: '^#解雇教练.*$', fnc: 'Fire_coach' },
                { reg: '^#购买器材$', fnc: 'Buy_equipment' },
                { reg: '^#维护健身房$', fnc: 'Maintain_gym' },
                { reg: '^#健身房打折.*$', fnc: 'Discount_gym' },
                { reg: '^#提升健身房人气$', fnc: 'Boost_reputation' },
                { reg: '^#清洁健身房$', fnc: 'Clean_gym' },
                { reg: '^#健身房财务状况$', fnc: 'Show_gym_financial_status' },
                { reg: '^#健身房会员数量$', fnc: 'Show_gym_members' },
                { reg: '^#健身房收入$', fnc: 'Show_gym_income' },
                { reg: '^#健身房支出$', fnc: 'Show_gym_expenses' },
                { reg: '^#健身房违规次数$', fnc: 'Show_gym_violations' },
                { reg: '^#健身房器材列表$', fnc: 'Show_gym_equipment' },
                { reg: '^#健身房活动策划$', fnc: 'Plan_event' },
                { reg: '^#健身房活动开始$', fnc: 'Start_event' },
                { reg: '^#健身房活动取消$', fnc: 'Cancel_event' },
                { reg: '^#教练满意度$', fnc: 'Show_coach_satisfaction' },
                { reg: '^#教练工资$', fnc: 'Show_coach_salary' },
                { reg: '^#教练工作时间$', fnc: 'Show_coach_working_hours' },
                { reg: '^#教练休息时间$', fnc: 'Show_coach_resting_hours' },
                { reg: '^#教练绩效$', fnc: 'Show_coach_performance' },
                { reg: '^#健身房会员管理$', fnc: 'Manage_members' },
                { reg: '^#健身房广告宣传$', fnc: 'Advertise_gym' },
            ],
        });
    }
    async Set_up_Gym(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        if (userData.gym) {
            e.reply("你已经开设过健身房了！");
            return;
        }

        const gymThemes = [
            {
                name: "粉色公主风",
                description: "充满少女心的梦幻空间",
                bonus: { reputation: 5, comfort: 10 }
            },
            {
                name: "清新森系风",
                description: "让人感觉置身自然的健康空间",
                bonus: { airQuality: 10, comfort: 8 }
            },
            {
                name: "温暖北欧风",
                description: "简约而不简单的时尚空间",
                bonus: { reputation: 8, comfort: 7 }
            },
            {
                name: "活力运动风",
                description: "充满激情的专业运动空间",
                bonus: { efficiency: 10, energy: 8 }
            }
        ];
    
        // 随机选择一个主题
        const selectedTheme = gymThemes[Math.floor(Math.random() * gymThemes.length)];
    
        // 扩展健身房初始数据
        const gymData = {
            // 原有属性
            cleanliness: 100,
            isDamaged: false,
            reputation: 50 + selectedTheme.bonus.reputation,
            violations: 0,
            maintenance: 0,
            discount: 0,
            income: 0,
            expenses: 0,
            staff: {},
            events: [],
            members: [],
            equipment: [],
    
            // 新增属性
            theme: selectedTheme.name,
            themeBonus: selectedTheme.bonus,
            comfort: 100 + selectedTheme.bonus.comfort,
            atmosphere: 80,
            
            // 环境设施
            environment: {
                temperature: 26,
                humidity: 45,
                lighting: 90,
                music: {
                    volume: 60,
                    playlist: ["轻快节奏", "舒缓音乐", "激情动感"],
                    currentTrack: "轻快节奏"
                },
                airQuality: 95 + (selectedTheme.bonus.airQuality || 0)
            },
    
            // 休息区配置
            restArea: {
                sofas: {
                    count: 5,
                    comfort: 100,
                    condition: 100
                },
                waterDispenser: {
                    count: 3,
                    waterLevel: 100,
                    cupCount: 200
                },
                magazines: [
                    "健康生活月刊",
                    "瑜伽时尚",
                    "美体塑形指南",
                    "营养健康"
                ],
                plants: [
                    "绿萝",
                    "富贵竹",
                    "散尾葵",
                    "发财树"
                ]
            },
    
            // 会员服务
            memberServices: {
                lockers: {
                    total: 50,
                    available: 50,
                    condition: 100
                },
                showers: {
                    total: 8,
                    available: 8,
                    condition: 100
                },
                towels: {
                    clean: 100,
                    used: 0,
                    total: 100
                }
            },
    
            // 运营数据
            operations: {
                peakHours: [],
                dailyVisitors: 0,
                memberFeedback: [],
                staffSchedule: {},
                maintenanceLog: [],
                cleaningSchedule: {
                    lastCleaned: Date.now(),
                    nextCleaning: Date.now() + 24 * 60 * 60 * 1000
                }
            }
        };
    
        userData.gym = gymData;
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    
        e.reply(`🎀 哇！恭喜你开设了一家超级可爱的健身房！
    
    💖 主题：${selectedTheme.name}
    ${selectedTheme.description}
    
    🏠 初始设施：
        🌟 整体环境：100分（超赞！）
        🌸 装修风格：${selectedTheme.name}
        🍃 空气质量：${gymData.environment.airQuality}%
        💡 照明情况：${gymData.environment.lighting}%
        
    🛋️ 休息区配置：
        ✨ 舒适沙发：${gymData.restArea.sofas.count}张
        💧 饮水机：${gymData.restArea.waterDispenser.count}台
        📚 杂志：${gymData.restArea.magazines.length}本
        🌿 绿植：${gymData.restArea.plants.length}盆
    
    👜 贴心服务：
        🔑 储物柜：${gymData.memberServices.lockers.total}个
        🚿 淋浴间：${gymData.memberServices.showers.total}间
        🧺 干净毛巾：${gymData.memberServices.towels.clean}条
    
    💝 小贴士：
        1. 记得保持环境整洁哦~
        2. 多关心会员的需求呢
        3. 适时举办有趣的活动
        4. 保持设备的维护保养
    
    祝你的健身房越来越好，成为最受欢迎的健康小天地！
    (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧`);
    }

    async Show_gym_status(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }
       // 获取当前时间和日期信息
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // 判断是否是营业高峰期
    const isPeakHour = (hour >= 18 && hour <= 21) || (hour >= 9 && hour <= 11);
    const isWeekend = day === 0 || day === 6;
    
    // 计算实时人流量
    const baseFlow = Math.floor(Math.random() * 20) + 10;
    const timeMultiplier = isPeakHour ? 2 : 1;
    const dayMultiplier = isWeekend ? 1.5 : 1;
    const currentFlow = Math.floor(baseFlow * timeMultiplier * dayMultiplier);
    
    // 计算各项实时指标
    const equipmentUsage = isPeakHour ? 
        Math.min(95, userData.gym.equipment.length * 5) : 
        Math.min(70, userData.gym.equipment.length * 3);
        
    // 计算环境舒适度
    const comfortLevel = Math.floor(
        (userData.gym.cleanliness + 
        userData.gym.environment.airQuality + 
        userData.gym.environment.lighting) / 3
    );

    // 生成可爱的状态提示语
    const statusEmojis = {
        excellent: "✨ 超级棒呢！",
        good: "💖 状态不错哦",
        normal: "💫 还可以继续加油",
        needImprovement: "🌸 需要一点关注呢"
    };

    // 生成贴心小建议
    const getTips = () => {
        let tips = [];
        if (userData.gym.cleanliness < 70) {
            tips.push("小可爱，是不是该打扫一下健身房啦？");
        }
        if (userData.gym.reputation < 60) {
            tips.push("要不要举办一些有趣的活动，提升一下人气呢？");
        }
        if (equipmentUsage > 90) {
            tips.push("器材都被抢着用呢，考虑再添置一些吗？");
        }
        if (comfortLevel < 75) {
            tips.push("环境可以再温馨一点点哦～");
        }
        return tips.join("\n    ");
    };

    e.reply(`🎀 亲爱的健身房主，这是你的健身房实时状况报告 🎀

💝 基础信息
    🏠 主题风格：${userData.gym.theme}
    🌟 开业天数：${Math.floor((Date.now() - userData.gym.operations.startTime) / (24 * 60 * 60 * 1000))}天
    
✨ 环境状况
    🧹 清洁指数：${userData.gym.cleanliness}/100
    ${userData.gym.cleanliness >= 80 ? statusEmojis.excellent : statusEmojis.needImprovement}
    
    🏗️ 设施状况：${userData.gym.isDamaged ? '需要维修' : '完好如初'}
    ${userData.gym.isDamaged ? statusEmojis.needImprovement : statusEmojis.excellent}
    
    ⭐ 人气指数：${userData.gym.reputation}/100
    ${userData.gym.reputation >= 70 ? statusEmojis.excellent : statusEmojis.normal}

🌸 实时环境
    🌡️ 室温：${userData.gym.environment.temperature}℃
    💧 湿度：${userData.gym.environment.humidity}%
    💨 空气：${userData.gym.environment.airQuality}/100
    🎵 音乐：${userData.gym.environment.music.currentTrack}
    
👥 当前状况
    ${isPeakHour ? '🌟 现在是运动高峰期呢！' : '☀️ 现在是运动舒适期~'}
    🏃‍♀️ 正在运动：${currentFlow}人
    💪 器材使用率：${equipmentUsage}%
    
💝 会员体验
    🌈 环境舒适度：${comfortLevel}/100
    ${comfortLevel >= 80 ? '会员们都说环境超棒的！' : '还可以再提升一下哦～'}
    
💰 经营数据
    💎 今日收入：${userData.gym.income}元
    📊 支出费用：${userData.gym.expenses}元
    🎁 当前折扣：${userData.gym.discount}%
    
💕 贴心小建议：
    ${getTips() || '太棒啦！继续保持哦！'}

🎀 今日小提示：
    ${[
        "记得多和会员们互动哦，让他们感受到温暖～",
        "保持微笑服务，你的笑容最迷人啦！",
        "累了的话也要记得休息，健康最重要呢～",
        "适时调整音乐节奏，让运动更有趣～"
    ][Math.floor(Math.random() * 4)]}

加油哦！你是最棒的健身房主！(◍•ᴗ•◍)❤`);
    }

    async Hire_coach(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const coachProfiles = {
            "aerobics": {
                title: "活力有氧教练",
                specialties: ["尊巴舞", "韵律操", "踏板操"],
                personality: "充满活力",
                style: "热情开朗",
                bonus: { energy: 10, atmosphere: 8 }
            },
            "yoga": {
                title: "瑜伽导师",
                specialties: ["哈他瑜伽", "流瑜伽", "冥想"],
                personality: "温柔平和",
                style: "细心耐心",
                bonus: { comfort: 10, atmosphere: 7 }
            },
            "weightlifting": {
                title: "力量训练教练",
                specialties: ["器械训练", "体态调整", "增肌塑形"],
                personality: "专业严谨",
                style: "认真负责",
                bonus: { efficiency: 10, safety: 8 }
            },
            "cardio": {
                title: "有氧运动教练",
                specialties: ["跑步指导", "单车训练", "椭圆机训练"],
                personality: "积极阳光",
                style: "活力四射",
                bonus: { energy: 8, efficiency: 7 }
            },
            "personal": {
                title: "私人定制教练",
                specialties: ["一对一训练", "体态评估", "营养指导"],
                personality: "贴心周到",
                style: "专业细致",
                bonus: { satisfaction: 10, reputation: 8 }
            }
        };
    
        const coachType = e.msg.replace('#聘请教练', '').trim();
        const coachOptions = Object.keys(coachProfiles);
        
        if (!coachOptions.includes(coachType)) {
            e.reply(`🎀 亲爱的健身房主~
    
    我们目前提供以下类型的优秀教练供您选择：
    
    💖 有氧操教练 (aerobics)
        擅长：尊巴舞、韵律操、踏板操
        特点：活力满满，让会员跳出好身材
    
    🧘‍♀️ 瑜伽教练 (yoga)
        擅长：哈他瑜伽、流瑜伽、冥想
        特点：气质优雅，带领会员找到内心平静
    
    💪 力量教练 (weightlifting)
        擅长：器械训练、体态调整、增肌塑形
        特点：专业严谨，确保会员安全有效训练
    
    🏃‍♀️ 有氧运动教练 (cardio)
        擅长：跑步指导、单车训练、椭圆机训练
        特点：充满活力，让会员享受运动乐趣
    
    👩‍🏫 私人教练 (personal)
        擅长：一对一训练、体态评估、营养指导
        特点：贴心周到，为会员定制专属计划
    
    请输入对应的英文名称来聘请想要的教练哦~`);
            return;
        }
    
        // 生成教练随机属性
        const generateCoachStats = (type) => {
            const profile = coachProfiles[type];
            return {
                name: `${profile.title}`,
                satisfaction: 100,
                salary: 500,
                workingHours: 0,
                restingHours: 0,
                performance: 0,
                // 新增属性
                specialties: profile.specialties,
                personality: profile.personality,
                style: profile.style,
                energy: 100,
                mood: 100,
                popularity: 50,
                studentCount: 0,
                classRating: 5.0,
                bonus: profile.bonus,
                schedule: {
                    morning: [],
                    afternoon: [],
                    evening: []
                },
                achievements: [],
                feedback: []
            };
        };
    
        userData.gym.staff[coachType] = generateCoachStats(coachType);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    
        const coach = userData.gym.staff[coachType];
    
        e.reply(`🎀 欢迎新成员加入！
    
    💝 你聘请的${coach.name}已经到岗啦！
    
    ✨ 教练信息
        👤 职位：${coach.name}
        💪 专长：${coach.specialties.join("、")}
        🌟 性格：${coach.personality}
        💖 教学风格：${coach.style}
        
    📝 工作安排
        💰 基础工资：${coach.salary}元/月
        ⭐ 满意度：${coach.satisfaction}
        🎯 当前业绩：${coach.performance}
    
    💕 温馨提示：
        1. 记得和新教练好好相处哦~
        2. 合理安排工作时间很重要呢
        3. 多给一些鼓励会让教练更有干劲呢
        4. 可以让教练多参与健身房活动哦
    
    期待看到${coach.name}在这里绽放光彩！
    (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧`);
    }

    async Fire_coach(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const coachType = e.msg.replace('#解雇教练', '').trim();
        if (!userData.gym.staff[coachType]) {
            e.reply(`💝 亲爱的，你还没有聘请${coachType}教练呢~`);
            return;
        }
    
        const coach = userData.gym.staff[coachType];
        
        // 计算离职补偿
        const workDays = Math.floor(coach.workingHours / 8);
        const compensation = Math.floor(coach.salary * (workDays / 30));
        
        // 检查是否有足够的钱支付补偿金
        if (userData.money < compensation) {
            e.reply(`💔 抱歉哦，解雇教练需要支付离职补偿金 ${compensation} 元呢，
    当前余额不足，要不要再考虑一下呢？
    
    💝 小建议：
        1. 可以先和教练沟通一下呢
        2. 也许通过调整工作安排能改善问题哦
        3. 给教练一些成长的机会可能会更好呢`);
            return;
        }
    
        // 计算对健身房的影响
        const impact = {
            reputation: Math.floor(coach.popularity * 0.1),
            memberMood: Math.floor(coach.studentCount * 0.5),
            atmosphere: Math.floor(coach.satisfaction * 0.1)
        };
    
        // 准备告别信息
        const farewell = [
            "祝你在未来的道路上一切顺利～",
            "感谢你为健身房付出的一切！",
            "希望有机会还能再次合作呢～",
            "永远记得你在这里的美好时光！"
        ][Math.floor(Math.random() * 4)];
    
        // 更新健身房数据
        userData.gym.reputation = Math.max(0, userData.gym.reputation - impact.reputation);
        userData.money -= compensation;
        delete userData.gym.staff[coachType];
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    
        e.reply(`🎀 教练离职通知
    
    💝 ${coach.name}已经办理完离职手续啦～
    
    📊 离职结算：
        💰 补偿金：${compensation}元
        👥 带教学员：${coach.studentCount}人
        ⭐ 课程评分：${coach.classRating}分
        🌟 人气指数：${coach.popularity}
    
    💭 影响预估：
        📊 健身房声誉：-${impact.reputation}点
        💗 会员情绪：-${impact.memberMood}点
        🌈 整体氛围：-${impact.atmosphere}点
    
    💌 离别赠言：
        ${farewell}
    
    💕 温馨提示：
        1. 记得及时安排其他教练接手课程哦
        2. 可以给会员一些补偿来维持好感度呢
        3. 有空多举办一些活动提升氛围吧
        4. 留意一下其他教练的心情变化哦
    
    要继续加油经营健身房哦！(◍•ᴗ•◍)✧*。`);
    }

    async Buy_equipment(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const equipmentCatalog = {
            "跑步机": {
                price: 5000,
                type: "有氧器械",
                space: 2,
                maintenance: 200,
                durability: 100,
                features: ["智能显示屏", "心率监测", "坡度调节"],
                benefits: ["燃脂", "心肺功能", "腿部训练"]
            },
            "椭圆机": {
                price: 4500,
                type: "有氧器械",
                space: 2,
                maintenance: 150,
                durability: 100,
                features: ["阻力调节", "静音系统", "运动数据记录"],
                benefits: ["全身运动", "关节保护", "平衡训练"]
            },
            "瑜伽垫": {
                price: 200,
                type: "瑜伽用品",
                space: 0.5,
                maintenance: 20,
                durability: 100,
                features: ["防滑设计", "环保材质", "便携收纳"],
                benefits: ["舒适体验", "保护关节", "防滑防伤"]
            },
            "哑铃组": {
                price: 2000,
                type: "力量器械",
                space: 1,
                maintenance: 50,
                durability: 100,
                features: ["多重量选择", "防滑握把", "耐用材质"],
                benefits: ["力量训练", "肌肉塑形", "灵活使用"]
            }
        };
    
        const equipment = e.msg.replace('#购买器材', '').trim();
        
        if (!equipment) {
            e.reply(`🎀 亲爱的健身房主~
    
    💝 这是我们的器材清单，都是精心挑选的呢！
    
    🏃‍♀️ 有氧器械：
        ✨ 跑步机 (5000元)
            - 智能显示屏，心率监测
            - 适合：跑步、走路、减脂
        
        🌟 椭圆机 (4500元)
            - 静音设计，全身运动
            - 适合：有氧训练、关节保护
    
    🧘‍♀️ 瑜伽用品：
        💖 瑜伽垫 (200元)
            - 环保材质，防滑设计
            - 适合：瑜伽、拉伸、冥想
    
    💪 力量器械：
        ⭐ 哑铃组 (2000元)
            - 多重量可选，防滑握把
            - 适合：力量训练、肌肉塑形
    
    请输入想购买的器材名称哦~`);
            return;
        }
    
        if (!equipmentCatalog[equipment]) {
            e.reply(`💝 亲爱的，目前没有这种器材呢~
    要不要看看其他可爱的器材？`);
            return;
        }
    
        const item = equipmentCatalog[equipment];
        
        // 检查资金
        if (userData.money < item.price) {
            e.reply(`💔 哎呀，购买${equipment}需要${item.price}元呢，
    当前余额似乎不够呢...
    
    💕 小建议：
        1. 可以先攒一攒钱哦
        2. 看看有没有其他实惠的器材
        3. 也许可以考虑分期付款呢`);
            return;
        }
    
        // 添加设备并更新数据
        userData.gym.equipment.push({
            name: equipment,
            type: item.type,
            condition: 100,
            purchaseDate: Date.now(),
            maintenanceHistory: [],
            usageCount: 0,
            lastMaintenance: Date.now(),
            features: item.features,
            popularity: 0
        });
    
        userData.money -= item.price;
        userData.gym.expenses += item.price;
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    
        e.reply(`🎀 新器材到货啦！
    
    💝 恭喜购入：${equipment}
    
    ✨ 器材信息：
        💰 价格：${item.price}元
        🏷️ 类型：${item.type}
        🛠️ 耐久度：${item.durability}
        
    🌟 特色功能：
        ${item.features.map(f => '    💫 ' + f).join('\n')}
        
    💪 训练效果：
        ${item.benefits.map(b => '    ✨ ' + b).join('\n')}
        
    💕 保养小贴士：
        1. 每周记得擦拭清洁哦
        2. 定期检查是否需要维护呢
        3. 教会会员正确使用方法很重要哦
        4. 保持器材区域整洁会更好呢
    
    期待新器材能让会员们训练得更开心！
    (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧`);
    }

    async Maintain_gym(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const maintenanceTypes = {
            "基础维护": {
                cost: 100,
                duration: 2,
                effect: {
                    maintenance: 10,
                    cleanliness: 5,
                    reputation: 2
                },
                tasks: [
                    "检查所有器材状态",
                    "基础清洁和消毒",
                    "调整器材位置",
                    "补充清洁用品"
                ]
            },
            "深度保养": {
                cost: 300,
                duration: 4,
                effect: {
                    maintenance: 25,
                    cleanliness: 15,
                    reputation: 5
                },
                tasks: [
                    "器材全面检修",
                    "深度清洁消毒",
                    "更换损耗配件",
                    "环境全面整理"
                ]
            },
            "专业维护": {
                cost: 500,
                duration: 6,
                effect: {
                    maintenance: 40,
                    cleanliness: 25,
                    reputation: 10
                },
                tasks: [
                    "专业团队检修",
                    "更换优质配件",
                    "系统性能优化",
                    "环境全面升级"
                ]
            }
        };
    
        // 随机选择一个维护类型
        const maintenanceType = Object.keys(maintenanceTypes)[Math.floor(Math.random() * 3)];
        const maintenance = maintenanceTypes[maintenanceType];
    
        if (userData.money < maintenance.cost) {
            e.reply(`💔 亲爱的，${maintenanceType}需要${maintenance.cost}元呢，
    当前余额似乎不够呢...
    
    💝 小建议：
        1. 可以先做一些基础维护呢
        2. 攒够钱再做深度保养也可以哦
        3. 保持日常清洁很重要呢`);
            return;
        }
    
        // 计算维护效果
        const effectiveRate = Math.random() * 0.2 + 0.9; // 0.9-1.1的随机效果
        const actualEffect = {
            maintenance: Math.floor(maintenance.effect.maintenance * effectiveRate),
            cleanliness: Math.floor(maintenance.effect.cleanliness * effectiveRate),
            reputation: Math.floor(maintenance.effect.reputation * effectiveRate)
        };
    
        // 更新健身房数据
        userData.gym.maintenance += actualEffect.maintenance;
        userData.gym.cleanliness = Math.min(100, userData.gym.cleanliness + actualEffect.cleanliness);
        userData.gym.reputation += actualEffect.reputation;
        userData.money -= maintenance.cost;
        userData.gym.expenses += maintenance.cost;
    
        // 记录维护历史
        userData.gym.operations.maintenanceLog.push({
            type: maintenanceType,
            date: Date.now(),
            cost: maintenance.cost,
            effect: actualEffect
        });
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    
        e.reply(`🎀 健身房维护完成啦！
    
    💝 本次进行了${maintenanceType}
    
    ✨ 维护项目：
    ${maintenance.tasks.map(task => `    💫 ${task}`).join('\n')}
    
    📊 维护效果：
        🛠️ 设施维护度：+${actualEffect.maintenance}
        🧹 清洁度：+${actualEffect.cleanliness}
        ⭐ 声誉：+${actualEffect.reputation}
    
    💰 维护费用：${maintenance.cost}元
    ⏰ 耗时：${maintenance.duration}小时
    
    💕 贴心提示：
        1. 定期维护可以延长器材寿命哦
        2. 保持环境整洁会让会员更开心呢
        3. 合理的维护计划可以省下不少钱呢
        4. 记得关注器材的使用情况哦
    
    继续保持下去，健身房会越来越棒的！
    (◍•ᴗ•◍)✧*。`);
    }

    async Discount_gym(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const discountPlans = {
            "新手体验": {
                cost: 100,
                duration: 7,
                discount: 20,
                benefits: {
                    newMembers: 5,
                    reputation: 8
                },
                features: [
                    "首次体验课免费",
                    "新手指导课优惠",
                    "健身计划定制"
                ]
            },
            "季节特惠": {
                cost: 200,
                duration: 15,
                discount: 15,
                benefits: {
                    newMembers: 8,
                    reputation: 12
                },
                features: [
                    "季节限定课程优惠",
                    "特色课程体验券",
                    "运动装备折扣"
                ]
            },
            "会员回馈": {
                cost: 300,
                duration: 30,
                discount: 25,
                benefits: {
                    newMembers: 12,
                    reputation: 15
                },
                features: [
                    "老会员专属优惠",
                    "带新会员奖励",
                    "生日特别礼遇"
                ]
            }
        };
    
        // 随机选择一个优惠方案
        const planType = Object.keys(discountPlans)[Math.floor(Math.random() * 3)];
        const plan = discountPlans[planType];
    
        if (userData.money < plan.cost) {
            e.reply(`💔 亲爱的，推出${planType}活动需要${plan.cost}元呢，
    当前余额不够呢...
    
    💝 小建议：
        1. 可以先准备一些小规模的优惠呢
        2. 或者等攒够资金再举办也可以哦
        3. 也可以考虑其他推广方式呢`);
            return;
        }
    
        // 计算优惠效果
        const effectiveRate = Math.random() * 0.2 + 0.9; // 0.9-1.1的随机效果
        const actualBenefits = {
            newMembers: Math.floor(plan.benefits.newMembers * effectiveRate),
            reputation: Math.floor(plan.benefits.reputation * effectiveRate)
        };
    
        // 更新健身房数据
        userData.gym.discount = plan.discount;
        userData.gym.reputation += actualBenefits.reputation;
        userData.money -= plan.cost;
        userData.gym.expenses += plan.cost;
    
        // 记录活动信息
        userData.gym.operations.promotions = userData.gym.operations.promotions || [];
        userData.gym.operations.promotions.push({
            type: planType,
            startDate: Date.now(),
            endDate: Date.now() + plan.duration * 24 * 60 * 60 * 1000,
            cost: plan.cost,
            effects: actualBenefits
        });
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    
        e.reply(`🎀 优惠活动开始啦！
    
    💝 活动主题：${planType}
    
    ✨ 活动详情：
        🎁 优惠力度：${plan.discount}%
        ⏰ 活动时长：${plan.duration}天
        
    🌟 特色权益：
    ${plan.features.map(feature => `    💫 ${feature}`).join('\n')}
    
    📊 预期收益：
        👥 新会员：预计+${actualBenefits.newMembers}人
        ⭐ 口碑：提升${actualBenefits.reputation}点
        
    💰 活动投入：${plan.cost}元
    
    💕 温馨提示：
        1. 记得在社交媒体宣传一下哦
        2. 可以让教练们多介绍给学员呢
        3. 准备一些小礼品会更有吸引力哦
        4. 收集会员反馈很重要呢
    
    祝活动圆满成功！会员们一定会喜欢的！
    (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧`);
    }

    async Boost_reputation(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const promotionEvents = {
            "欢乐健身派对": {
                cost: 200,
                duration: 4,
                effect: {
                    reputation: 15,
                    members: 5,
                    atmosphere: 10
                },
                activities: [
                    "团体健身操",
                    "趣味运动会",
                    "健康小食分享"
                ],
                theme: "活力四射的派对氛围"
            },
            "健康生活讲座": {
                cost: 250,
                duration: 3,
                effect: {
                    reputation: 20,
                    members: 8,
                    knowledge: 15
                },
                activities: [
                    "营养师讲座",
                    "运动科普",
                    "健康生活分享会"
                ],
                theme: "专业知识交流分享"
            },
            "粉红瑜伽日": {
                cost: 300,
                duration: 5,
                effect: {
                    reputation: 25,
                    members: 10,
                    satisfaction: 20
                },
                activities: [
                    "瑜伽体验课",
                    "冥想放松",
                    "下午茶交流"
                ],
                theme: "轻松愉快的女生专属活动"
            }
        };
    
        // 随机选择一个活动
        const eventType = Object.keys(promotionEvents)[Math.floor(Math.random() * 3)];
        const event = promotionEvents[eventType];
    
        if (userData.money < event.cost) {
            e.reply(`💔 亲爱的，举办${eventType}需要${event.cost}元呢，
    当前余额似乎不够呢...
    
    💝 小建议：
        1. 可以先举办一些小型活动呢
        2. 或者和其他健身房合作分担成本
        3. 也可以考虑赞助商支持哦`);
            return;
        }
    
        // 计算活动效果
        const timeBonus = new Date().getHours() >= 18 ? 1.2 : 1.0; // 晚上效果更好
        const weatherBonus = Math.random() * 0.3 + 0.9; // 天气影响
        const actualEffect = {
            reputation: Math.floor(event.effect.reputation * timeBonus * weatherBonus),
            members: Math.floor(event.effect.members * timeBonus * weatherBonus),
            atmosphere: Math.floor((event.effect.atmosphere || 0) * timeBonus * weatherBonus)
        };
    
        // 更新健身房数据
        userData.gym.reputation += actualEffect.reputation;
        userData.money -= event.cost;
        userData.gym.expenses += event.cost;
    
        // 记录活动效果
        userData.gym.operations.events = userData.gym.operations.events || [];
        userData.gym.operations.events.push({
            name: eventType,
            date: Date.now(),
            cost: event.cost,
            effect: actualEffect
        });
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    
        e.reply(`🎀 活动策划完成啦！
    
    💝 活动主题：${eventType}
        ${event.theme}
    
    ✨ 活动安排：
    ${event.activities.map(activity => `    🌟 ${activity}`).join('\n')}
    
    📊 活动成效：
        ⭐ 声誉提升：${actualEffect.reputation}点
        👥 新增会员：${actualEffect.members}人
        🌈 氛围提升：${actualEffect.atmosphere}点
    
    ⏰ 活动时长：${event.duration}小时
    💰 投入费用：${event.cost}元
    
    💕 贴心提示：
        1. 记得提前准备场地布置哦
        2. 可以准备一些小礼品呢
        3. 多拍些照片宣传会很棒哦
        4. 收集参与者的反馈很重要呢
    
    期待这次活动能让大家玩得开心！
    (◍•ᴗ•◍)✧*。`);
    }

    async Clean_gym(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const cleaningPlans = {
            "日常清洁": {
                cost: 50,
                duration: 2,
                effect: {
                    cleanliness: 20,
                    atmosphere: 10,
                    satisfaction: 5
                },
                tasks: [
                    "地面除尘拖洗",
                    "器材表面擦拭",
                    "更换垃圾袋",
                    "补充清洁用品"
                ],
                bonus: "空气清新剂喷洒"
            },
            "深度保洁": {
                cost: 150,
                duration: 4,
                effect: {
                    cleanliness: 40,
                    atmosphere: 20,
                    satisfaction: 15
                },
                tasks: [
                    "地毯深度清洗",
                    "器材全面消毒",
                    "玻璃镜面擦拭",
                    "休息区整理"
                ],
                bonus: "香薰精油散播"
            },
            "全面清洁": {
                cost: 300,
                duration: 6,
                effect: {
                    cleanliness: 100,
                    atmosphere: 30,
                    satisfaction: 25
                },
                tasks: [
                    "所有区域消毒",
                    "器材深度保养",
                    "环境全面除菌",
                    "设施彻底清洁"
                ],
                bonus: "专业空气净化"
            }
        };
    
        // 根据当前清洁度选择合适的清洁计划
        let selectedPlan;
        if (userData.gym.cleanliness < 30) {
            selectedPlan = cleaningPlans["全面清洁"];
        } else if (userData.gym.cleanliness < 60) {
            selectedPlan = cleaningPlans["深度保洁"];
        } else {
            selectedPlan = cleaningPlans["日常清洁"];
        }
    
        if (userData.money < selectedPlan.cost) {
            e.reply(`💔 亲爱的，进行${selectedPlan.name}需要${selectedPlan.cost}元呢，
    当前余额不够呢...
    
    💝 小建议：
        1. 可以先做简单的清洁维护呢
        2. 注意保持日常整理很重要哦
        3. 让会员也养成整理的好习惯呢`);
            return;
        }
    
        // 计算清洁效果
        const timeBonus = new Date().getHours() < 9 ? 1.2 : 1.0; // 早上清洁效果更好
        const actualEffect = {
            cleanliness: Math.floor(selectedPlan.effect.cleanliness * timeBonus),
            atmosphere: Math.floor(selectedPlan.effect.atmosphere * timeBonus),
            satisfaction: Math.floor(selectedPlan.effect.satisfaction * timeBonus)
        };
    
        // 更新健身房数据
        userData.gym.cleanliness = Math.min(100, actualEffect.cleanliness);
        userData.gym.atmosphere = Math.min(100, (userData.gym.atmosphere || 0) + actualEffect.atmosphere);
        userData.money -= selectedPlan.cost;
        userData.gym.expenses += selectedPlan.cost;
    
        // 记录清洁历史
        userData.gym.operations.cleaningHistory = userData.gym.operations.cleaningHistory || [];
        userData.gym.operations.cleaningHistory.push({
            type: selectedPlan.name,
            date: Date.now(),
            effect: actualEffect
        });
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    
        e.reply(`🎀 清洁完成啦！健身房焕然一新呢～
    
    💝 本次进行：${selectedPlan.name}
    
    ✨ 清洁项目：
    ${selectedPlan.tasks.map(task => `    🧹 ${task}`).join('\n')}
    
    🌟 特别加赠：
        ✨ ${selectedPlan.bonus}
    
    📊 清洁效果：
        ✨ 清洁度提升至：${userData.gym.cleanliness}%
        🌈 环境提升：+${actualEffect.atmosphere}
        💖 会员满意度：+${actualEffect.satisfaction}
    
    ⏰ 清洁用时：${selectedPlan.duration}小时
    💰 清洁费用：${selectedPlan.cost}元
    
    💕 温馨提示：
        1. 保持日常整理很重要哦
        2. 可以放些香薰让环境更舒适呢
        3. 及时补充清洁用品很贴心呢
        4. 记得定期进行深度清洁哦
    
    干净整洁的环境会让大家心情更好呢！
    (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧`);
    }

    async Show_gym_financial_status(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const financialStats = {
            // 收入分类统计
            income: {
                membershipFees: userData.gym.income * 0.6,
                personalTraining: userData.gym.income * 0.25,
                groupClasses: userData.gym.income * 0.1,
                other: userData.gym.income * 0.05
            },
            // 支出分类统计
            expenses: {
                staffSalary: userData.gym.expenses * 0.4,
                maintenance: userData.gym.expenses * 0.2,
                utilities: userData.gym.expenses * 0.15,
                marketing: userData.gym.expenses * 0.15,
                other: userData.gym.expenses * 0.1
            }
        };
    
        // 计算财务健康指标
        const financialHealth = {
            profitMargin: ((userData.gym.income - userData.gym.expenses) / userData.gym.income * 100) || 0,
            operatingCost: userData.gym.expenses / 30, // 日均运营成本
            averageIncome: userData.gym.income / 30, // 日均收入
            breakEvenDays: Math.ceil(userData.gym.expenses / (userData.gym.income / 30)) // 收支平衡天数
        };
    
        // 生成财务建议
        const getFinancialAdvice = () => {
            let advice = [];
            if (financialHealth.profitMargin < 20) {
                advice.push("可以考虑推出一些特色课程增加收入呢～");
            }
            if (financialStats.expenses.maintenance > userData.gym.income * 0.3) {
                advice.push("维护成本有点高，要注意日常保养哦～");
            }
            if (financialStats.income.personalTraining < userData.gym.income * 0.2) {
                advice.push("私教课程可以多宣传一下呢～");
            }
            return advice;
        };
    
        e.reply(`🎀 健身房财务报告
    
    💖 总体概况
        💰 总收入：${userData.gym.income}元
        💸 总支出：${userData.gym.expenses}元
        💝 净收益：${userData.gym.income - userData.gym.expenses}元
    
    ✨ 收入构成
        🌟 会员费：${Math.floor(financialStats.income.membershipFees)}元
        👩‍🏫 私教课程：${Math.floor(financialStats.income.personalTraining)}元
        👥 团体课程：${Math.floor(financialStats.income.groupClasses)}元
        🎁 其他收入：${Math.floor(financialStats.income.other)}元
    
    💫 支出明细
        👨‍👩‍👧‍👦 员工薪资：${Math.floor(financialStats.expenses.staffSalary)}元
        🛠️ 设备维护：${Math.floor(financialStats.expenses.maintenance)}元
        💡 水电费用：${Math.floor(financialStats.expenses.utilities)}元
        📢 营销推广：${Math.floor(financialStats.expenses.marketing)}元
        🎈 其他支出：${Math.floor(financialStats.expenses.other)}元
    
    📊 财务指标
        💮 利润率：${financialHealth.profitMargin.toFixed(2)}%
        💰 日均收入：${Math.floor(financialHealth.averageIncome)}元
        💸 日均支出：${Math.floor(financialHealth.operatingCost)}元
        ⏰ 收支平衡：预计${financialHealth.breakEvenDays}天
    
    💕 贴心建议：
    ${getFinancialAdvice().map(advice => `    🌸 ${advice}`).join('\n')}
    
    💝 小贴士：
        1. 定期关注收支情况很重要哦
        2. 合理控制支出能提高收益呢
        3. 可以多开展一些增收活动～
        4. 保持良好的服务才能留住会员哦
    
    继续加油，相信会越来越好的！
    (◍•ᴗ•◍)✧*。`);
    }

    async Show_gym_members(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const memberStats = {
            total: userData.gym.members.length,
            categories: {
                regular: 0,    // 普通会员
                premium: 0,    // 高级会员
                vip: 0,        // VIP会员
                trial: 0       // 体验会员
            },
            attendance: {
                active: 0,     // 活跃会员
                normal: 0,     // 普通活跃
                inactive: 0    // 不活跃
            },
            preferences: {
                yoga: 0,
                fitness: 0,
                cardio: 0,
                swimming: 0
            }
        };
    
        // 分析会员数据
        userData.gym.members.forEach(member => {
            // 统计会员类型
            memberStats.categories[member.type || 'regular']++;
            
            // 统计活跃度
            if (member.lastVisit && Date.now() - member.lastVisit < 7 * 24 * 60 * 60 * 1000) {
                memberStats.attendance.active++;
            } else if (member.lastVisit && Date.now() - member.lastVisit < 30 * 24 * 60 * 60 * 1000) {
                memberStats.attendance.normal++;
            } else {
                memberStats.attendance.inactive++;
            }
    
            // 统计偏好
            if (member.preferences) {
                member.preferences.forEach(pref => {
                    memberStats.preferences[pref]++;
                });
            }
        });
    
        // 计算会员增长率
        const growthRate = ((userData.gym.members.length - userData.gym.lastMonthMembers) / 
                            (userData.gym.lastMonthMembers || 1) * 100).toFixed(2);
    
        // 生成会员关怀建议
        const getMemberCareAdvice = () => {
            let advice = [];
            if (memberStats.attendance.inactive > memberStats.total * 0.3) {
                advice.push("有些会员好久没来啦，要不要发个关心短信～");
            }
            if (memberStats.categories.trial > 0) {
                advice.push("记得关注体验会员的反馈哦，争取转化为正式会员呢～");
            }
            if (memberStats.attendance.active < memberStats.total * 0.5) {
                advice.push("可以举办些有趣的活动，提高会员活跃度呢～");
            }
            return advice;
        };
    
        e.reply(`🎀 健身房会员报告
    
    💝 会员总览
        👥 总会员数：${memberStats.total}人
        📈 环比增长：${growthRate}%
        
    ✨ 会员构成
        💫 普通会员：${memberStats.categories.regular}人
        🌟 高级会员：${memberStats.categories.premium}人
        💎 VIP会员：${memberStats.categories.vip}人
        🎁 体验会员：${memberStats.categories.trial}人
    
    💕 活跃情况
        🏃‍♀️ 活跃会员：${memberStats.attendance.active}人
        🚶‍♀️ 普通活跃：${memberStats.attendance.normal}人
        🛋️ 最近未见：${memberStats.attendance.inactive}人
    
    🌈 运动偏好
        🧘‍♀️ 喜爱瑜伽：${memberStats.preferences.yoga}人
        💪 健身塑形：${memberStats.preferences.fitness}人
        🏃‍♂️ 有氧运动：${memberStats.preferences.cardio}人
        🏊‍♀️ 游泳爱好：${memberStats.preferences.swimming}人
    
    💖 贴心建议：
    ${getMemberCareAdvice().map(advice => `    🌸 ${advice}`).join('\n')}
    
    💝 温馨提示：
        1. 定期跟进会员的训练情况哦
        2. 可以为会员定制专属计划呢
        3. 节日记得送上祝福很暖心呢
        4. 收集会员意见能更好改进呢
    
    用心经营，让每位会员都感受到温暖！
    (◍•ᴗ•◍)✧*。`);
    }

    async Show_gym_income(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const incomeAnalysis = {
            // 按类型统计收入
            byType: {
                membership: {
                    amount: userData.gym.income * 0.5,
                    details: {
                        regular: userData.gym.income * 0.3,
                        premium: userData.gym.income * 0.15,
                        vip: userData.gym.income * 0.05
                    }
                },
                courses: {
                    amount: userData.gym.income * 0.3,
                    details: {
                        personal: userData.gym.income * 0.15,
                        group: userData.gym.income * 0.1,
                        special: userData.gym.income * 0.05
                    }
                },
                additional: {
                    amount: userData.gym.income * 0.2,
                    details: {
                        drinks: userData.gym.income * 0.05,
                        equipment: userData.gym.income * 0.1,
                        other: userData.gym.income * 0.05
                    }
                }
            },
            
            // 按时段统计
            byPeriod: {
                morning: userData.gym.income * 0.3,
                afternoon: userData.gym.income * 0.2,
                evening: userData.gym.income * 0.5
            }
        };
    
        // 计算收入趋势
        const trend = {
            daily: userData.gym.income / 30,
            weekly: userData.gym.income / 4,
            monthly: userData.gym.income
        };
    
        // 生成收入提升建议
        const getIncomeAdvice = () => {
            let advice = [];
            if (incomeAnalysis.byType.courses.amount < userData.gym.income * 0.25) {
                advice.push("可以多开展一些特色课程呢～");
            }
            if (incomeAnalysis.byPeriod.afternoon < userData.gym.income * 0.25) {
                advice.push("下午时段可以推出些优惠活动哦～");
            }
            if (incomeAnalysis.byType.additional.amount < userData.gym.income * 0.15) {
                advice.push("可以适当增加一些周边产品呢～");
            }
            return advice;
        };
    
        e.reply(`🎀 健身房收入报告
    
    💖 总体收入
        💰 总收入：${userData.gym.income}元
        📈 日均收入：${Math.floor(trend.daily)}元
        🌟 周均收入：${Math.floor(trend.weekly)}元
    
    ✨ 收入构成
        💝 会员费收入：${Math.floor(incomeAnalysis.byType.membership.amount)}元
            👤 普通会员：${Math.floor(incomeAnalysis.byType.membership.details.regular)}元
            ⭐ 高级会员：${Math.floor(incomeAnalysis.byType.membership.details.premium)}元
            💎 VIP会员：${Math.floor(incomeAnalysis.byType.membership.details.vip)}元
    
        🎯 课程收入：${Math.floor(incomeAnalysis.byType.courses.amount)}元
            👩‍🏫 私教课程：${Math.floor(incomeAnalysis.byType.courses.details.personal)}元
            👥 团体课程：${Math.floor(incomeAnalysis.byType.courses.details.group)}元
            🌟 特色课程：${Math.floor(incomeAnalysis.byType.courses.details.special)}元
    
        🎁 其他收入：${Math.floor(incomeAnalysis.byType.additional.amount)}元
            🥤 饮品售卖：${Math.floor(incomeAnalysis.byType.additional.details.drinks)}元
            🏋️ 器材租赁：${Math.floor(incomeAnalysis.byType.additional.details.equipment)}元
            💫 其他项目：${Math.floor(incomeAnalysis.byType.additional.details.other)}元
    
    🌈 时段分布
        🌅 早间收入：${Math.floor(incomeAnalysis.byPeriod.morning)}元
        ☀️ 午间收入：${Math.floor(incomeAnalysis.byPeriod.afternoon)}元
        🌙 晚间收入：${Math.floor(incomeAnalysis.byPeriod.evening)}元
    
    💕 提升建议：
    ${getIncomeAdvice().map(advice => `    🌸 ${advice}`).join('\n')}
    
    💝 温馨提示：
        1. 定期分析收入构成很重要哦
        2. 关注会员续费情况要及时呢
        3. 可以适当推出新的收入项目～
        4. 节假日可以推出特别活动呢
    
    继续加油，让收入蒸蒸日上！
    (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧`);
    }

    async Show_gym_expenses(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const expensesAnalysis = {
            // 固定支出
            fixed: {
                rent: userData.gym.expenses * 0.3,
                utilities: {
                    electricity: userData.gym.expenses * 0.08,
                    water: userData.gym.expenses * 0.05,
                    gas: userData.gym.expenses * 0.02,
                    internet: userData.gym.expenses * 0.01
                },
                insurance: userData.gym.expenses * 0.05
            },
            
            // 运营支出
            operational: {
                salary: userData.gym.expenses * 0.25,
                maintenance: userData.gym.expenses * 0.1,
                cleaning: userData.gym.expenses * 0.05,
                marketing: userData.gym.expenses * 0.05
            },
    
            // 其他支出
            other: {
                supplies: userData.gym.expenses * 0.02,
                repairs: userData.gym.expenses * 0.01,
                misc: userData.gym.expenses * 0.01
            }
        };
    
        // 计算支出趋势
        const trend = {
            daily: userData.gym.expenses / 30,
            weekly: userData.gym.expenses / 4,
            monthly: userData.gym.expenses
        };
    
        // 生成支出优化建议
        const getExpenseAdvice = () => {
            let advice = [];
            if (expensesAnalysis.fixed.utilities.electricity > userData.gym.expenses * 0.1) {
                advice.push("可以考虑使用节能设备，减少电费支出呢～");
            }
            if (expensesAnalysis.operational.maintenance > userData.gym.expenses * 0.15) {
                advice.push("设备维护费用有点高，要注意日常保养哦～");
            }
            if (expensesAnalysis.operational.marketing < userData.gym.expenses * 0.03) {
                advice.push("适当增加一些推广投入，可以带来更多会员呢～");
            }
            return advice;
        };
    
        e.reply(`🎀 健身房支出报告
    
    💖 总体支出
        💸 总支出：${userData.gym.expenses}元
        📊 日均支出：${Math.floor(trend.daily)}元
        📈 周均支出：${Math.floor(trend.weekly)}元
    
    ✨ 固定支出
        🏠 场地租金：${Math.floor(expensesAnalysis.fixed.rent)}元
        
        💡 水电物业：
            ⚡ 电费：${Math.floor(expensesAnalysis.fixed.utilities.electricity)}元
            💧 水费：${Math.floor(expensesAnalysis.fixed.utilities.water)}元
            🔥 燃气：${Math.floor(expensesAnalysis.fixed.utilities.gas)}元
            🌐 网络：${Math.floor(expensesAnalysis.fixed.utilities.internet)}元
        
        📋 保险费用：${Math.floor(expensesAnalysis.fixed.insurance)}元
    
    🌟 运营支出
        👥 人员工资：${Math.floor(expensesAnalysis.operational.salary)}元
        🛠️ 设备维护：${Math.floor(expensesAnalysis.operational.maintenance)}元
        🧹 清洁费用：${Math.floor(expensesAnalysis.operational.cleaning)}元
        📢 市场推广：${Math.floor(expensesAnalysis.operational.marketing)}元
    
    💫 其他支出
        🎁 日常用品：${Math.floor(expensesAnalysis.other.supplies)}元
        🔧 设备维修：${Math.floor(expensesAnalysis.other.repairs)}元
        🎈 其他杂项：${Math.floor(expensesAnalysis.other.misc)}元
    
    💕 优化建议：
    ${getExpenseAdvice().map(advice => `    🌸 ${advice}`).join('\n')}
    
    💝 温馨提示：
        1. 定期检查各项支出很重要哦
        2. 合理控制成本能提高收益呢
        3. 可以寻找更优惠的供应商～
        4. 节约开支但不要影响服务质量哦
    
    合理管理支出，让经营更轻松！
    (◍•ᴗ•◍)✧*。`);
    }

    async Show_gym_violations(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const violationAnalysis = {
            // 按类型统计
            byType: {
                safety: {
                    count: 0,
                    details: []
                },
                service: {
                    count: 0,
                    details: []
                },
                hygiene: {
                    count: 0,
                    details: []
                },
                operation: {
                    count: 0,
                    details: []
                }
            },
    
            // 处理状态
            status: {
                resolved: 0,
                processing: 0,
                pending: 0
            },
    
            // 违规等级
            severity: {
                minor: 0,
                moderate: 0,
                serious: 0
            }
        };
    
        // 统计违规记录
        userData.gym.violationRecords?.forEach(record => {
            violationAnalysis.byType[record.type].count++;
            violationAnalysis.byType[record.type].details.push(record);
            violationAnalysis.status[record.status]++;
            violationAnalysis.severity[record.severity]++;
        });
    
        // 生成改进建议
        const getImprovementAdvice = () => {
            let advice = [];
            if (violationAnalysis.byType.safety.count > 0) {
                advice.push("安全问题要最优先处理哦，会员的安全最重要～");
            }
            if (violationAnalysis.byType.hygiene.count > 0) {
                advice.push("要多注意环境卫生呢，保持整洁很重要～");
            }
            if (violationAnalysis.status.pending > 2) {
                advice.push("有些问题还没处理呢，要及时跟进哦～");
            }
            return advice;
        };
    
        e.reply(`🎀 健身房违规情况报告
    
    💖 总体情况
        ⚠️ 总违规次数：${userData.gym.violations}次
        ✨ 已解决数量：${violationAnalysis.status.resolved}次
        💫 处理中数量：${violationAnalysis.status.processing}次
        🌟 待处理数量：${violationAnalysis.status.pending}次
    
    🌸 违规类型分析
        👮‍♀️ 安全问题：${violationAnalysis.byType.safety.count}次
        🎯 服务问题：${violationAnalysis.byType.service.count}次
        🧹 卫生问题：${violationAnalysis.byType.hygiene.count}次
        📋 运营问题：${violationAnalysis.byType.operation.count}次
    
    💝 违规等级分布
        💫 轻微问题：${violationAnalysis.severity.minor}次
        ⭐ 中度问题：${violationAnalysis.severity.moderate}次
        ❗ 严重问题：${violationAnalysis.severity.serious}次
    
    💕 改进建议：
    ${getImprovementAdvice().map(advice => `    🌸 ${advice}`).join('\n')}
    
    💝 温馨提示：
        1. 定期检查各项安全隐患哦
        2. 及时处理会员的投诉呢
        3. 做好日常维护和保养～
        4. 加强员工培训很重要哦
    
    用心经营，让问题越来越少！
    (｡♥‿♥｡)
    `);
    }

    async Show_gym_equipment(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const equipmentAnalysis = {
            // 按类型统计
            byCategory: {
                cardio: {
                    items: [],
                    totalValue: 0,
                    maintenanceCost: 0,
                    usage: 0
                },
                strength: {
                    items: [],
                    totalValue: 0,
                    maintenanceCost: 0,
                    usage: 0
                },
                yoga: {
                    items: [],
                    totalValue: 0,
                    maintenanceCost: 0,
                    usage: 0
                },
                functional: {
                    items: [],
                    totalValue: 0,
                    maintenanceCost: 0,
                    usage: 0
                }
            },
    
            // 器材状态
            condition: {
                excellent: 0,
                good: 0,
                fair: 0,
                needRepair: 0
            },
    
            // 使用情况
            usage: {
                highUsage: 0,
                mediumUsage: 0,
                lowUsage: 0
            }
        };
    
        // 统计器材信息
        userData.gym.equipment.forEach(item => {
            // 分类统计
            equipmentAnalysis.byCategory[item.category].items.push(item);
            equipmentAnalysis.byCategory[item.category].totalValue += item.value;
            equipmentAnalysis.byCategory[item.category].maintenanceCost += item.maintenanceCost;
            equipmentAnalysis.byCategory[item.category].usage += item.usageCount;
    
            // 状态统计
            equipmentAnalysis.condition[item.condition]++;
    
            // 使用率统计
            if (item.usageRate > 70) equipmentAnalysis.usage.highUsage++;
            else if (item.usageRate > 30) equipmentAnalysis.usage.mediumUsage++;
            else equipmentAnalysis.usage.lowUsage++;
        });
    
        // 生成器材建议
        const getEquipmentAdvice = () => {
            let advice = [];
            if (equipmentAnalysis.condition.needRepair > 0) {
                advice.push("有些器材需要维修啦，要及时保养哦～");
            }
            if (equipmentAnalysis.usage.highUsage > userData.gym.equipment.length * 0.3) {
                advice.push("部分器材使用率很高呢，要考虑增添相同类型的器材哦～");
            }
            if (equipmentAnalysis.usage.lowUsage > userData.gym.equipment.length * 0.2) {
                advice.push("有些器材使用率偏低，可以多推广或调整位置呢～");
            }
            return advice;
        };
    
        e.reply(`🎀 健身房器材清单
    
    💖 器材总览
        ✨ 总数量：${userData.gym.equipment.length}件
        💰 总价值：${Object.values(equipmentAnalysis.byCategory).reduce((a, b) => a + b.totalValue, 0)}元
        🛠️ 月度维护费：${Object.values(equipmentAnalysis.byCategory).reduce((a, b) => a + b.maintenanceCost, 0)}元
    
    🌟 分类统计
        🏃‍♀️ 有氧器材：${equipmentAnalysis.byCategory.cardio.items.length}件
            ${equipmentAnalysis.byCategory.cardio.items.map(item => `        💫 ${item.name}`).join('\n')}
        
        💪 力量器材：${equipmentAnalysis.byCategory.strength.items.length}件
            ${equipmentAnalysis.byCategory.strength.items.map(item => `        💫 ${item.name}`).join('\n')}
        
        🧘‍♀️ 瑜伽器材：${equipmentAnalysis.byCategory.yoga.items.length}件
            ${equipmentAnalysis.byCategory.yoga.items.map(item => `        💫 ${item.name}`).join('\n')}
        
        🎯 功能性器材：${equipmentAnalysis.byCategory.functional.items.length}件
            ${equipmentAnalysis.byCategory.functional.items.map(item => `        💫 ${item.name}`).join('\n')}
    
    ✨ 器材状态
        💝 完好状态：${equipmentAnalysis.condition.excellent}件
        💫 良好状态：${equipmentAnalysis.condition.good}件
        🌟 一般状态：${equipmentAnalysis.condition.fair}件
        ⚠️ 需要维修：${equipmentAnalysis.condition.needRepair}件
    
    🌈 使用情况
        ⭐ 高使用率：${equipmentAnalysis.usage.highUsage}件
        💫 中使用率：${equipmentAnalysis.usage.mediumUsage}件
        🌸 低使用率：${equipmentAnalysis.usage.lowUsage}件
    
    💕 器材建议：
    ${getEquipmentAdvice().map(advice => `    🌸 ${advice}`).join('\n')}
    
    💝 温馨提示：
        1. 定期检查器材状态很重要哦
        2. 及时维护可以延长使用寿命呢
        3. 注意观察会员使用反馈～
        4. 合理布局可以提高使用率哦
    
    让我们一起爱护器材，为会员提供更好的训练体验！
    (◕‿◕✿)`);
    }

    async Plan_event(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        if (!event) {
            e.reply("请指定一个活动。");
            return;
        }

        const eventTemplates = {
            "欢乐健身派对": {
                cost: 1000,
                duration: 3,
                capacity: 30,
                requirements: {
                    staff: 3,
                    equipment: ["音响设备", "瑜伽垫", "哑铃组"],
                    space: "大厅"
                },
                benefits: {
                    reputation: 15,
                    income: 2000,
                    newMembers: 5
                },
                activities: [
                    "团体操课程",
                    "健身游戏",
                    "营养讲座",
                    "健康小食品分享"
                ]
            },
            "瑜伽冥想日": {
                cost: 800,
                duration: 4,
                capacity: 20,
                requirements: {
                    staff: 2,
                    equipment: ["瑜伽垫", "精油", "冥想音乐"],
                    space: "瑜伽室"
                },
                benefits: {
                    reputation: 12,
                    income: 1600,
                    newMembers: 3
                },
                activities: [
                    "晨间瑜伽",
                    "冥想课程",
                    "呼吸练习",
                    "茶道体验"
                ]
            },
            "亲子运动会": {
                cost: 1200,
                duration: 5,
                capacity: 25,
                requirements: {
                    staff: 4,
                    equipment: ["趣味器材", "安全垫", "小型器械"],
                    space: "综合区"
                },
                benefits: {
                    reputation: 20,
                    income: 2400,
                    newMembers: 6
                },
                activities: [
                    "亲子互动游戏",
                    "趣味体能课",
                    "健康小讲堂",
                    "亲子瑜伽"
                ]
            }
        };
    
        const event = e.msg.replace('#健身房活动策划', '').trim();
        
        if (!event) {
            e.reply(`🎀 亲爱的健身房主~
    
    💝 这是我们精心准备的活动模板供您参考：
    
    ✨ 欢乐健身派对
        💫 活动时长：3小时
        👥 适合人数：30人
        💰 预计投入：1000元
        🌟 预期收益：2000元
        
    🧘‍♀️ 瑜伽冥想日
        💫 活动时长：4小时
        👥 适合人数：20人
        💰 预计投入：800元
        🌟 预期收益：1600元
        
    👨‍👩‍👧‍👦 亲子运动会
        💫 活动时长：5小时
        👥 适合人数：25人
        💰 预计投入：1200元
        🌟 预期收益：2400元
    
    请输入想要策划的活动名称哦~`);
            return;
        }
    
        if (!eventTemplates[event]) {
            e.reply("💝 亲爱的，目前还没有这个活动模板呢~要不要看看其他有趣的活动？");
            return;
        }
    
        const template = eventTemplates[event];
        
        // 检查资源是否满足要求
        const checkRequirements = () => {
            let missing = [];
            if (Object.keys(userData.gym.staff).length < template.requirements.staff) {
                missing.push("需要更多的工作人员");
            }
            template.requirements.equipment.forEach(eq => {
                if (!userData.gym.equipment.includes(eq)) {
                    missing.push(`缺少${eq}`);
                }
            });
            return missing;
        };
    
        const missingResources = checkRequirements();
        if (missingResources.length > 0) {
            e.reply(`💔 亲爱的，要举办${event}还缺少一些资源呢：
    ${missingResources.map(item => `    ⚠️ ${item}`).join('\n')}
    
    💝 小建议：
        1. 可以先补充所需器材呢
        2. 考虑招募更多工作人员哦
        3. 或者选择其他适合的活动～`);
            return;
        }
    
        // 添加活动计划
        userData.gym.events.push({
            name: event,
            template: template,
            planDate: Date.now(),
            status: "planned"
        });
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    
        e.reply(`🎀 活动策划完成啦！
    
    💝 活动名称：${event}
    
    ✨ 活动详情：
        ⏰ 计划时长：${template.duration}小时
        👥 活动人数：${template.capacity}人
        💰 预计投入：${template.cost}元
        🌟 预期收益：${template.benefits.income}元
    
    🌈 活动安排：
    ${template.activities.map(activity => `    💫 ${activity}`).join('\n')}
    
    💕 温馨提示：
        1. 记得提前准备场地布置哦
        2. 要准备一些小礼品呢
        3. 及时在社群发布活动信息～
        4. 做好应急预案很重要哦
    
    期待活动圆满成功！
    (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧`);
    }

    async Start_event(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const event = e.msg.replace('#健身房活动开始', '').trim();
    
    // 检查活动是否存在
    const plannedEvent = userData.gym.events.find(e => e.name === event);
    if (!plannedEvent) {
        e.reply(`💝 亲爱的，找不到${event}这个活动呢~
要先做好活动策划才能开始哦！`);
        return;
    }

    const template = plannedEvent.template;
    
    // 检查资金
    if (userData.money < template.cost) {
        e.reply(`💔 开展${event}需要${template.cost}元呢，
当前资金不够呢...

💝 小建议：
    1. 可以先积累一些资金呢
    2. 或者考虑其他投入较小的活动
    3. 也可以寻找赞助商合作哦`);
        return;
    }

    // 活动效果计算
    const calculateEventEffect = () => {
        const timeBonus = new Date().getHours() >= 9 && new Date().getHours() <= 20 ? 1.2 : 0.8;
        const weekendBonus = [0, 6].includes(new Date().getDay()) ? 1.3 : 1.0;
        const weatherBonus = Math.random() * 0.4 + 0.8;
        
        return {
            reputation: Math.floor(template.benefits.reputation * timeBonus * weekendBonus * weatherBonus),
            income: Math.floor(template.benefits.income * timeBonus * weekendBonus * weatherBonus),
            newMembers: Math.floor(template.benefits.newMembers * timeBonus * weekendBonus * weatherBonus),
            satisfaction: Math.floor(90 + Math.random() * 10)
        };
    };

    const eventEffect = calculateEventEffect();

    // 更新健身房数据
    userData.gym.reputation += eventEffect.reputation;
    userData.gym.income += eventEffect.income;
    userData.money -= template.cost;
    userData.gym.expenses += template.cost;

    // 记录活动历史
    userData.gym.eventHistory = userData.gym.eventHistory || [];
    userData.gym.eventHistory.push({
        name: event,
        date: Date.now(),
        effect: eventEffect,
        feedback: []
    });

    // 从计划中移除活动
    userData.gym.events = userData.gym.events.filter(e => e.name !== event);

    await redis.set(`user:${userId}`, JSON.stringify(userData));
    await saveUserData(userId, userData);

    e.reply(`🎀 活动开始啦！

💝 活动名称：${event}

✨ 活动安排：
${template.activities.map((activity, index) => `    ${['🌸', '💫', '✨', '💝'][index]} ${activity}`).join('\n')}

📊 活动成效：
    ⭐ 声誉提升：+${eventEffect.reputation}
    💰 活动收入：${eventEffect.income}元
    👥 新增会员：${eventEffect.newMembers}人
    💖 满意度：${eventEffect.satisfaction}%

💕 温馨提示：
    1. 要注意活动现场的安全哦
    2. 记得拍照留念呢～
    3. 及时收集会员反馈很重要
    4. 做好活动总结对下次有帮助呢

祝活动圆满成功！
(๑•̀ㅂ•́)و✧`);

    // 一小时后自动发送活动总结
    setTimeout(async () => {
        const feedback = [
            "气氛很活跃呢！",
            "会员们都玩得很开心～",
            "教练们表现得很专业呢",
            "场地布置很温馨～"
        ];
        
        e.reply(`🎀 ${event}活动总结

💝 活动圆满结束啦！

✨ 精彩回顾：
${feedback.map(f => `    🌟 ${f}`).join('\n')}

💕 会员反馈：
    好评率：${eventEffect.satisfaction}%
    参与人数：${template.capacity}人
    活动氛围：非常热烈

💝 小建议：
    1. 可以建立活动微信群哦
    2. 整理活动照片发朋友圈呢
    3. 记得给参与者发送纪念品～
    4. 下次可以考虑更多互动环节

期待下次活动更精彩！
(◍•ᴗ•◍)❤`);
    }, 3600000);
    }

    async Cancel_event(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const event = e.msg.replace('#健身房活动取消', '').trim();
    
    // 检查活动是否存在
    const plannedEvent = userData.gym.events.find(e => e.name === event);
    if (!plannedEvent) {
        e.reply(`💔 亲爱的，找不到${event}这个活动呢~
可能已经结束或者还没有策划过哦~`);
        return;
    }

    const template = plannedEvent.template;

    // 计算取消损失
    const calculateCancellationLoss = () => {
        const preparationProgress = (Date.now() - plannedEvent.planDate) / (24 * 60 * 60 * 1000);
        const lossFactor = Math.min(preparationProgress * 0.1, 0.5); // 最多损失50%
        
        return {
            cost: Math.floor(template.cost * lossFactor),
            reputation: Math.floor(5 + Math.random() * 5),
            memberMood: Math.floor(3 + Math.random() * 5)
        };
    };

    const loss = calculateCancellationLoss();

    // 更新健身房数据
    userData.money -= loss.cost;
    userData.gym.reputation -= loss.reputation;
    userData.gym.expenses += loss.cost;

    // 记录取消历史
    userData.gym.cancelledEvents = userData.gym.cancelledEvents || [];
    userData.gym.cancelledEvents.push({
        name: event,
        date: Date.now(),
        loss: loss,
        reason: "管理员取消"
    });

    // 从计划中移除活动
    userData.gym.events = userData.gym.events.filter(e => e.name !== event);

    await redis.set(`user:${userId}`, JSON.stringify(userData));
    await saveUserData(userId, userData);

    e.reply(`🎀 活动取消通知

💝 已取消活动：${event}

📊 取消影响：
    💸 损失费用：${loss.cost}元
    ⭐ 声誉影响：-${loss.reputation}
    💗 会员情绪：-${loss.memberMood}

💕 温馨建议：
    1. 及时通知已报名的会员呢
    2. 可以提供一些补偿福利哦
    3. 记得解释取消原因～
    4. 适当安排替代活动会更好呢

🌸 安抚方案：
    ✨ 可以发放道歉优惠券
    💝 准备小礼品表示歉意
    🎁 提供免费体验课程
    💫 下次活动优先报名权

💌 给会员的一封信：
亲爱的会员们：
    非常抱歉需要取消本次${event}活动。
    为表歉意，我们准备了一些补偿方案，
    希望能得到大家的理解。
    期待下次活动与大家相见！

要继续加油哦！下次一定会更好！
(｡•ᴗ•｡)♡`);

    // 稍后自动发送补偿方案
    setTimeout(async () => {
        e.reply(`🎀 活动取消补偿方案

💝 为表歉意，我们准备了以下补偿：

✨ 专属优惠：
    1. 下次活动报名享8折优惠
    2. 赠送3次私教体验课
    3. 延长会员卡有效期7天
    4. 专属运动礼包一份

💕 温馨提示：
    1. 优惠券将在24小时内发放
    2. 礼包可以到前台领取哦
    3. 私教课程请提前预约呢
    4. 有任何问题随时咨询～

感谢大家的理解和支持！
(◍•ᴗ•◍)✧*。`);
    }, 1800000);
    }

    async Show_coach_satisfaction(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const satisfactionAnalysis = {
            // 按类型统计
            byType: {},
            
            // 满意度等级
            levels: {
                excellent: 0, // 90-100
                good: 0,     // 75-89
                normal: 0,   // 60-74
                poor: 0      // <60
            },
    
            // 影响因素分析
            factors: {
                salary: 0,
                workload: 0,
                environment: 0,
                teamwork: 0
            }
        };
    
        // 分析每个教练的满意度
        for (const coachType in userData.gym.staff) {
            const coach = userData.gym.staff[coachType];
            satisfactionAnalysis.byType[coachType] = {
                satisfaction: coach.satisfaction,
                factors: {
                    salary: Math.min(100, coach.salary / 10),
                    workload: Math.max(0, 100 - coach.workingHours / 2),
                    environment: userData.gym.cleanliness,
                    teamwork: 70 + Math.random() * 30
                }
            };
    
            // 统计满意度等级
            if (coach.satisfaction >= 90) satisfactionAnalysis.levels.excellent++;
            else if (coach.satisfaction >= 75) satisfactionAnalysis.levels.good++;
            else if (coach.satisfaction >= 60) satisfactionAnalysis.levels.normal++;
            else satisfactionAnalysis.levels.poor++;
    
            // 累计影响因素
            satisfactionAnalysis.factors.salary += satisfactionAnalysis.byType[coachType].factors.salary;
            satisfactionAnalysis.factors.workload += satisfactionAnalysis.byType[coachType].factors.workload;
            satisfactionAnalysis.factors.environment += satisfactionAnalysis.byType[coachType].factors.environment;
            satisfactionAnalysis.factors.teamwork += satisfactionAnalysis.byType[coachType].factors.teamwork;
        }
    
        // 计算平均影响因素
        const coachCount = Object.keys(userData.gym.staff).length;
        for (let factor in satisfactionAnalysis.factors) {
            satisfactionAnalysis.factors[factor] = Math.floor(satisfactionAnalysis.factors[factor] / coachCount);
        }
    
        // 生成提升建议
        const getImprovementAdvice = () => {
            let advice = [];
            if (satisfactionAnalysis.factors.salary < 70) {
                advice.push("教练们的薪资待遇可以适当提高呢～");
            }
            if (satisfactionAnalysis.factors.workload < 60) {
                advice.push("注意合理安排工作时间，让教练们休息好哦～");
            }
            if (satisfactionAnalysis.factors.environment < 80) {
                advice.push("保持良好的工作环境，让教练们心情愉快呢～");
            }
            if (satisfactionAnalysis.factors.teamwork < 85) {
                advice.push("可以多组织一些团建活动，增进团队感情哦～");
            }
            return advice;
        };
    
        e.reply(`🎀 教练满意度报告
    
    💝 总体情况
        👥 教练总数：${coachCount}人
        💖 平均满意度：${Math.floor(Object.values(satisfactionAnalysis.byType)
            .reduce((sum, coach) => sum + coach.satisfaction, 0) / coachCount)}%
    
    ✨ 满意度分布
        🌟 非常满意：${satisfactionAnalysis.levels.excellent}人
        💫 比较满意：${satisfactionAnalysis.levels.good}人
        ⭐ 一般满意：${satisfactionAnalysis.levels.normal}人
        💭 需要关注：${satisfactionAnalysis.levels.poor}人
    
    🌸 教练详情：
    ${Object.entries(satisfactionAnalysis.byType).map(([type, data]) => `
        💝 ${type}教练
            满意度：${data.satisfaction}%
            薪资满意：${data.factors.salary}%
            工作强度：${data.factors.workload}%
            环境评价：${data.factors.environment}%
            团队协作：${data.factors.teamwork}%`).join('\n')}
    
    📊 影响因素分析
        💰 薪资待遇：${satisfactionAnalysis.factors.salary}%
        ⏰ 工作压力：${satisfactionAnalysis.factors.workload}%
        🏠 工作环境：${satisfactionAnalysis.factors.environment}%
        👥 团队氛围：${satisfactionAnalysis.factors.teamwork}%
    
    💕 提升建议：
    ${getImprovementAdvice().map(advice => `    🌸 ${advice}`).join('\n')}
    
    💝 温馨提示：
        1. 定期和教练们沟通很重要哦
        2. 注意观察教练们的状态呢
        3. 及时处理教练的困难～
        4. 创造温暖的工作氛围呢
    
    关心教练，让我们一起进步！
    (◍•ᴗ•◍)✧*。`);
    }

    async Show_coach_salary(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const salaryAnalysis = {
            // 基本统计
            total: 0,
            average: 0,
            highest: 0,
            lowest: 999999,
            
            // 薪资构成
            composition: {
                baseSalary: {},
                performance: {},
                bonus: {},
                overtime: {}
            },
    
            // 薪资等级
            levels: {
                high: 0,    // >8000
                medium: 0,  // 5000-8000
                low: 0      // <5000
            },
    
            // 历史记录
            history: userData.gym.salaryHistory || []
        };
    
        // 分析每个教练的薪资
        for (const coachType in userData.gym.staff) {
            const coach = userData.gym.staff[coachType];
            
            // 计算各项收入
            const salaryDetail = {
                base: coach.salary,
                performance: Math.floor(coach.performance * 10),
                bonus: Math.floor(coach.satisfaction * 5),
                overtime: Math.floor(coach.workingHours * 20)
            };
    
            const totalSalary = Object.values(salaryDetail).reduce((a, b) => a + b, 0);
            
            // 更新统计数据
            salaryAnalysis.total += totalSalary;
            salaryAnalysis.highest = Math.max(salaryAnalysis.highest, totalSalary);
            salaryAnalysis.lowest = Math.min(salaryAnalysis.lowest, totalSalary);
            
            // 记录薪资构成
            salaryAnalysis.composition.baseSalary[coachType] = salaryDetail.base;
            salaryAnalysis.composition.performance[coachType] = salaryDetail.performance;
            salaryAnalysis.composition.bonus[coachType] = salaryDetail.bonus;
            salaryAnalysis.composition.overtime[coachType] = salaryDetail.overtime;
    
            // 统计薪资等级
            if (totalSalary > 8000) salaryAnalysis.levels.high++;
            else if (totalSalary > 5000) salaryAnalysis.levels.medium++;
            else salaryAnalysis.levels.low++;
        }
    
        salaryAnalysis.average = Math.floor(salaryAnalysis.total / Object.keys(userData.gym.staff).length);
    
        // 生成薪资建议
        const getSalaryAdvice = () => {
            let advice = [];
            if (salaryAnalysis.levels.low > Object.keys(userData.gym.staff).length * 0.3) {
                advice.push("部分教练薪资偏低，可以考虑适当提升呢～");
            }
            if (salaryAnalysis.highest - salaryAnalysis.lowest > 5000) {
                advice.push("教练间薪资差距较大，要注意平衡哦～");
            }
            if (Object.values(salaryAnalysis.composition.performance).some(v => v < 1000)) {
                advice.push("可以设置更多绩效奖励，激励教练们呢～");
            }
            return advice;
        };
    
        e.reply(`🎀 教练薪资报告
    
    💝 总体情况
        💰 薪资总额：${salaryAnalysis.total}元/月
        💫 平均薪资：${salaryAnalysis.average}元/月
        ⭐ 最高薪资：${salaryAnalysis.highest}元/月
        💫 最低薪资：${salaryAnalysis.lowest}元/月
    
    ✨ 薪资分布
        💎 高薪教练：${salaryAnalysis.levels.high}人
        💫 中等薪资：${salaryAnalysis.levels.medium}人
        ⭐ 基础薪资：${salaryAnalysis.levels.low}人
    
    🌸 教练薪资详情：
    ${Object.entries(userData.gym.staff).map(([type, coach]) => `
        💝 ${type}教练
            基本工资：${salaryAnalysis.composition.baseSalary[type]}元
            绩效奖金：${salaryAnalysis.composition.performance[type]}元
            满意度奖：${salaryAnalysis.composition.bonus[type]}元
            加班补贴：${salaryAnalysis.composition.overtime[type]}元
            月总收入：${Object.values(salaryAnalysis.composition).reduce((sum, comp) => sum + (comp[type] || 0), 0)}元`).join('\n')}
    
    💕 薪资建议：
    ${getSalaryAdvice().map(advice => `    🌸 ${advice}`).join('\n')}
    
    💝 温馨提示：
        1. 定期评估薪资水平很重要哦
        2. 合理的奖励制度能提高积极性呢
        3. 及时发放工资是最基本的～
        4. 多听听教练们的心声哦
    
    让我们一起创造更好的工作环境！
    (◕‿◕✿)`);
    }

    async Show_coach_working_hours(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const workingAnalysis = {
            // 总体统计
            total: {
                hours: 0,
                shifts: 0,
                overtime: 0
            },
    
            // 时段分布
            timeSlots: {
                morning: {
                    hours: 0,
                    coaches: [],
                    efficiency: 0
                },
                afternoon: {
                    hours: 0,
                    coaches: [],
                    efficiency: 0
                },
                evening: {
                    hours: 0,
                    coaches: [],
                    efficiency: 0
                }
            },
    
            // 课程统计
            classes: {
                personal: 0,
                group: 0,
                special: 0
            },
    
            // 工作强度
            workload: {
                high: [],    // >8小时/天
                normal: [],  // 5-8小时/天
                low: []      // <5小时/天
            }
        };
    
        // 分析每个教练的工作时间
        for (const coachType in userData.gym.staff) {
            const coach = userData.gym.staff[coachType];
            
            // 计算总工时
            workingAnalysis.total.hours += coach.workingHours;
            workingAnalysis.total.shifts += coach.shifts || 0;
            workingAnalysis.total.overtime += Math.max(0, coach.workingHours - 40);
    
            // 统计时段分布
            if (coach.schedule) {
                coach.schedule.forEach(shift => {
                    const slot = shift.startTime < 12 ? 'morning' : 
                                shift.startTime < 17 ? 'afternoon' : 'evening';
                    workingAnalysis.timeSlots[slot].hours += shift.duration;
                    workingAnalysis.timeSlots[slot].coaches.push(coachType);
                });
            }
    
            // 统计课程数量
            if (coach.classes) {
                workingAnalysis.classes.personal += coach.classes.personal || 0;
                workingAnalysis.classes.group += coach.classes.group || 0;
                workingAnalysis.classes.special += coach.classes.special || 0;
            }
    
            // 计算工作强度
            const dailyHours = coach.workingHours / 30;
            if (dailyHours > 8) workingAnalysis.workload.high.push(coachType);
            else if (dailyHours > 5) workingAnalysis.workload.normal.push(coachType);
            else workingAnalysis.workload.low.push(coachType);
        }
    
        // 生成工作时间建议
        const getWorkingAdvice = () => {
            let advice = [];
            if (workingAnalysis.total.overtime > 20) {
                advice.push("有教练加班时间较多，要注意合理安排休息哦～");
            }
            if (workingAnalysis.timeSlots.evening.hours > workingAnalysis.total.hours * 0.5) {
                advice.push("晚上工作时间较多，建议适当调整排班呢～");
            }
            if (workingAnalysis.workload.high.length > 0) {
                advice.push("部分教练工作强度较大，要关心他们的身体状况哦～");
            }
            return advice;
        };
    
        e.reply(`🎀 教练工作时间报告
    
    💝 总体情况
        ⏰ 总工作时长：${workingAnalysis.total.hours}小时
        📅 总班次：${workingAnalysis.total.shifts}次
        🌟 总加班时长：${workingAnalysis.total.overtime}小时
    
    ✨ 时段分布
        🌅 早班（6:00-12:00）
            时长：${workingAnalysis.timeSlots.morning.hours}小时
            教练：${workingAnalysis.timeSlots.morning.coaches.length}人
            
        ☀️ 午班（12:00-17:00）
            时长：${workingAnalysis.timeSlots.afternoon.hours}小时
            教练：${workingAnalysis.timeSlots.afternoon.coaches.length}人
            
        🌙 晚班（17:00-22:00）
            时长：${workingAnalysis.timeSlots.evening.hours}小时
            教练：${workingAnalysis.timeSlots.evening.coaches.length}人
    
    💫 课程统计
        👤 私教课：${workingAnalysis.classes.personal}节
        👥 团课：${workingAnalysis.classes.group}节
        ✨ 特色课：${workingAnalysis.classes.special}节
    
    🌸 工作强度分布
        💪 高强度：${workingAnalysis.workload.high.length}人
        💫 适中：${workingAnalysis.workload.normal.length}人
        🌟 较轻：${workingAnalysis.workload.low.length}人
    
    💕 排班建议：
    ${getWorkingAdvice().map(advice => `    🌸 ${advice}`).join('\n')}
    
    💝 温馨提示：
        1. 注意合理安排教练休息时间呢
        2. 可以根据会员喜好调整排班哦
        3. 节假日要提前做好人员安排～
        4. 记得关心教练们的身体状况
    
    让我们一起创造快乐的工作环境！
    (◍•ᴗ•◍)✧*。`);
    }

    async Show_coach_resting_hours(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const restingAnalysis = {
            // 总体休息情况
            total: {
                hours: 0,
                regularBreaks: 0,
                vacationDays: 0
            },
    
            // 休息类型统计
            breakTypes: {
                shortBreak: {  // 短休息（<1小时）
                    count: 0,
                    totalHours: 0,
                    coaches: []
                },
                lunchBreak: {  // 午休（1-2小时）
                    count: 0,
                    totalHours: 0,
                    coaches: []
                },
                dayOff: {      // 休息日
                    count: 0,
                    coaches: []
                }
            },
    
            // 休息时间分布
            timeDistribution: {
                morning: 0,    // 上午休息
                afternoon: 0,  // 下午休息
                evening: 0     // 晚上休息
            },
    
            // 休息质量评估
            restQuality: {
                good: [],      // 休息充足
                moderate: [],  // 休息一般
                insufficient: [] // 休息不足
            }
        };
    
        // 分析每个教练的休息情况
        for (const coachType in userData.gym.staff) {
            const coach = userData.gym.staff[coachType];
            
            // 计算总休息时间
            restingAnalysis.total.hours += coach.restingHours;
            restingAnalysis.total.regularBreaks += coach.regularBreaks || 0;
            restingAnalysis.total.vacationDays += coach.vacationDays || 0;
    
            // 统计休息类型
            if (coach.breaks) {
                coach.breaks.forEach(break_ => {
                    if (break_.duration < 1) {
                        restingAnalysis.breakTypes.shortBreak.count++;
                        restingAnalysis.breakTypes.shortBreak.totalHours += break_.duration;
                        restingAnalysis.breakTypes.shortBreak.coaches.push(coachType);
                    } else if (break_.duration <= 2) {
                        restingAnalysis.breakTypes.lunchBreak.count++;
                        restingAnalysis.breakTypes.lunchBreak.totalHours += break_.duration;
                        restingAnalysis.breakTypes.lunchBreak.coaches.push(coachType);
                    }
                });
            }
    
            // 统计休息时间分布
            if (coach.restSchedule) {
                coach.restSchedule.forEach(rest => {
                    const hour = new Date(rest.startTime).getHours();
                    if (hour < 12) restingAnalysis.timeDistribution.morning++;
                    else if (hour < 18) restingAnalysis.timeDistribution.afternoon++;
                    else restingAnalysis.timeDistribution.evening++;
                });
            }
    
            // 评估休息质量
            const weeklyRestHours = coach.restingHours / 4;
            if (weeklyRestHours >= 48) restingAnalysis.restQuality.good.push(coachType);
            else if (weeklyRestHours >= 24) restingAnalysis.restQuality.moderate.push(coachType);
            else restingAnalysis.restQuality.insufficient.push(coachType);
        }
    
        // 生成休息时间建议
        const getRestingAdvice = () => {
            let advice = [];
            if (restingAnalysis.restQuality.insufficient.length > 0) {
                advice.push("有些教练休息时间不太够呢，要多关心他们哦～");
            }
            if (restingAnalysis.breakTypes.lunchBreak.count < userData.gym.staff.length * 5) {
                advice.push("午休时间要保证充足，这样下午才有精力呢～");
            }
            if (restingAnalysis.timeDistribution.evening > restingAnalysis.total.regularBreaks * 0.4) {
                advice.push("晚上的休息时间有点多，建议调整一下作息哦～");
            }
            return advice;
        };
    
        e.reply(`🎀 教练休息时间报告
    
    💝 总体情况
        💤 总休息时长：${restingAnalysis.total.hours}小时
        ☕ 日常休息：${restingAnalysis.total.regularBreaks}次
        🏖️ 假期天数：${restingAnalysis.total.vacationDays}天
    
    ✨ 休息类型统计
        🌸 短暂休息
            次数：${restingAnalysis.breakTypes.shortBreak.count}次
            时长：${restingAnalysis.breakTypes.shortBreak.totalHours}小时
            
        🍱 午休时间
            次数：${restingAnalysis.breakTypes.lunchBreak.count}次
            时长：${restingAnalysis.breakTypes.lunchBreak.totalHours}小时
            
        🌟 休息日安排
            总天数：${restingAnalysis.breakTypes.dayOff.count}天
            平均每人：${(restingAnalysis.breakTypes.dayOff.count / Object.keys(userData.gym.staff).length).toFixed(1)}天
    
    💫 休息时间分布
        🌅 上午休息：${restingAnalysis.timeDistribution.morning}次
        ☀️ 下午休息：${restingAnalysis.timeDistribution.afternoon}次
        🌙 晚上休息：${restingAnalysis.timeDistribution.evening}次
    
    🌈 休息质量评估
        ✨ 休息充足：${restingAnalysis.restQuality.good.length}人
        💫 休息一般：${restingAnalysis.restQuality.moderate.length}人
        ⚠️ 休息不足：${restingAnalysis.restQuality.insufficient.length}人
    
    💕 温馨建议：
    ${getRestingAdvice().map(advice => `    🌸 ${advice}`).join('\n')}
    
    💝 贴心提示：
        1. 要保证教练们的充足休息哦
        2. 可以准备休息室小零食呢
        3. 节假日记得合理安排调休～
        4. 关注教练们的身心健康
    
    让我们一起创造轻松愉快的工作环境！
    (◕‿◕✿)`);
    }

    async Show_coach_performance(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const performanceAnalysis = {
            // 整体表现
            overall: {
                averageScore: 0,
                totalClasses: 0,
                totalStudents: 0,
                satisfaction: 0
            },
    
            // 课程数据
            classStats: {
                completed: 0,
                cancelled: 0,
                attendance: 0,
                retention: 0
            },
    
            // 会员反馈
            feedback: {
                excellent: 0,
                good: 0,
                average: 0,
                needImprovement: 0
            },
    
            // 专业技能评估
            skillRatings: {
                teaching: 0,
                professional: 0,
                communication: 0,
                attitude: 0
            }
        };
    
        // 分析每个教练的表现
        Object.entries(userData.gym.staff).forEach(([type, coach]) => {
            // 计算整体表现
            performanceAnalysis.overall.totalClasses += coach.classCount || 0;
            performanceAnalysis.overall.totalStudents += coach.studentCount || 0;
            performanceAnalysis.overall.satisfaction += coach.satisfaction || 0;
    
            // 统计课程数据
            if (coach.classStats) {
                performanceAnalysis.classStats.completed += coach.classStats.completed || 0;
                performanceAnalysis.classStats.cancelled += coach.classStats.cancelled || 0;
                performanceAnalysis.classStats.attendance += coach.classStats.attendance || 0;
                performanceAnalysis.classStats.retention += coach.classStats.retention || 0;
            }
    
            // 统计会员反馈
            if (coach.feedback) {
                performanceAnalysis.feedback.excellent += coach.feedback.excellent || 0;
                performanceAnalysis.feedback.good += coach.feedback.good || 0;
                performanceAnalysis.feedback.average += coach.feedback.average || 0;
                performanceAnalysis.feedback.needImprovement += coach.feedback.needImprovement || 0;
            }
    
            // 评估专业技能
            if (coach.skillRatings) {
                performanceAnalysis.skillRatings.teaching += coach.skillRatings.teaching || 0;
                performanceAnalysis.skillRatings.professional += coach.skillRatings.professional || 0;
                performanceAnalysis.skillRatings.communication += coach.skillRatings.communication || 0;
                performanceAnalysis.skillRatings.attitude += coach.skillRatings.attitude || 0;
            }
        });
    
        // 计算平均值
        const coachCount = Object.keys(userData.gym.staff).length;
        performanceAnalysis.overall.averageScore = Math.floor(performanceAnalysis.overall.satisfaction / coachCount);
        Object.keys(performanceAnalysis.skillRatings).forEach(skill => {
            performanceAnalysis.skillRatings[skill] = Math.floor(performanceAnalysis.skillRatings[skill] / coachCount);
        });
    
        // 生成表现提升建议
        const getPerformanceAdvice = () => {
            let advice = [];
            if (performanceAnalysis.classStats.cancelled > performanceAnalysis.classStats.completed * 0.1) {
                advice.push("课程取消率有点高呢，要注意课程安排哦～");
            }
            if (performanceAnalysis.feedback.needImprovement > 0) {
                advice.push("有些会员反馈需要改进，可以多和教练沟通呢～");
            }
            if (performanceAnalysis.skillRatings.communication < 80) {
                advice.push("可以多举办一些沟通技巧培训哦～");
            }
            return advice;
        };
    
        e.reply(`🎀 教练绩效报告
    
    💝 整体表现
        ⭐ 平均评分：${performanceAnalysis.overall.averageScore}分
        📚 总课程数：${performanceAnalysis.overall.totalClasses}节
        👥 服务会员：${performanceAnalysis.overall.totalStudents}人
        💖 满意程度：${performanceAnalysis.overall.satisfaction}%
    
    ✨ 课程统计
        🎯 已完成课程：${performanceAnalysis.classStats.completed}节
        ❌ 取消课程：${performanceAnalysis.classStats.cancelled}节
        👤 会员出勤率：${performanceAnalysis.classStats.attendance}%
        💫 会员留存率：${performanceAnalysis.classStats.retention}%
    
    🌟 会员反馈
        💝 非常满意：${performanceAnalysis.feedback.excellent}次
        ✨ 比较满意：${performanceAnalysis.feedback.good}次
        💫 一般满意：${performanceAnalysis.feedback.average}次
        💭 需要改进：${performanceAnalysis.feedback.needImprovement}次
    
    🌈 专业技能评估
        📚 教学能力：${performanceAnalysis.skillRatings.teaching}分
        💪 专业水平：${performanceAnalysis.skillRatings.professional}分
        💭 沟通能力：${performanceAnalysis.skillRatings.communication}分
        💖 服务态度：${performanceAnalysis.skillRatings.attitude}分
    
    💕 提升建议：
    ${getPerformanceAdvice().map(advice => `    🌸 ${advice}`).join('\n')}
    
    💝 贴心提示：
        1. 定期举办教练培训很重要哦
        2. 多鼓励教练互相学习呢
        3. 及时表扬优秀表现～
        4. 耐心帮助需要提升的教练
    
    让我们一起努力，提供更好的服务！
    (｡♥‿♥｡)`);
    }

    async Manage_members(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }

        const membershipTypes = {
            "普通会员": {
                monthlyFee: 200,
                benefits: ["基础器材使用", "更衣室使用", "淋浴设施"],
                discount: 0
            },
            "高级会员": {
                monthlyFee: 400,
                benefits: ["所有器材使用", "免费团课", "营养咨询", "专属储物柜"],
                discount: 10
            },
            "VIP会员": {
                monthlyFee: 800,
                benefits: ["私教课优惠", "24小时进入", "专属休息区", "免费营养餐"],
                discount: 20
            }
        };
    
        const action = e.msg.replace('#健身房会员管理', '').trim().split(' ')[0];
        const memberId = e.msg.replace('#健身房会员管理', '').trim().split(' ')[1];
        const memberType = e.msg.replace('#健身房会员管理', '').trim().split(' ')[2] || "普通会员";
    
        if (!action) {
            e.reply(`🎀 会员管理系统
    
    💝 当前会员情况：
        👥 总会员数：${userData.gym.members.length}人
        💫 普通会员：${userData.gym.members.filter(m => m.type === "普通会员").length}人
        ⭐ 高级会员：${userData.gym.members.filter(m => m.type === "高级会员").length}人
        💎 VIP会员：${userData.gym.members.filter(m => m.type === "VIP会员").length}人
    
    ✨ 会员类型介绍：
    ${Object.entries(membershipTypes).map(([type, info]) => `
        🌟 ${type}
            💰 月费：${info.monthlyFee}元
            🎁 优惠：${info.discount}%
            ✨ 权益：${info.benefits.join('、')}
    `).join('\n')}
    
    💕 管理指令：
        1. 添加会员：#健身房会员管理 add [会员ID] [会员类型]
        2. 移除会员：#健身房会员管理 remove [会员ID]
        3. 升级会员：#健身房会员管理 upgrade [会员ID] [目标类型]
    `);
            return;
        }
    
        switch(action) {
            case 'add':
                // 检查是否已是会员
                if (userData.gym.members.some(m => m.id === memberId)) {
                    e.reply("💔 这位已经是我们的会员啦～");
                    return;
                }
    
                // 添加新会员
                const newMember = {
                    id: memberId,
                    type: memberType,
                    joinDate: Date.now(),
                    points: 0,
                    attendance: [],
                    courses: [],
                    lastVisit: Date.now()
                };
    
                userData.gym.members.push(newMember);
                userData.gym.income += membershipTypes[memberType].monthlyFee;
                userData.gym.reputation += 2;
    
                // 关联教练系统
                if (userData.gym.staff) {
                    Object.values(userData.gym.staff).forEach(coach => {
                        coach.studentCount = (coach.studentCount || 0) + 1;
                    });
                }
    
                e.reply(`🎀 欢迎新会员！
    
    💝 会员信息：
        👤 会员ID：${memberId}
        ✨ 会员类型：${memberType}
        🎁 专属权益：${membershipTypes[memberType].benefits.join('、')}
    
    💕 温馨提示：
        1. 记得安排入门指导课程哦
        2. 可以推荐适合的教练呢
        3. 发放会员手册和用品～
        4. 添加会员微信群很重要呢`);
                break;
    
                case 'remove':
                    const memberToRemove = userData.gym.members.find(m => m.id === memberId);
                    if (!memberToRemove) {
                        e.reply("💔 找不到这位会员呢，请检查ID是否正确～");
                        return;
                    }
                
                    // 计算退费
                    const refund = Math.floor(membershipTypes[memberToRemove.type].monthlyFee * 0.5);
                    userData.money -= refund;
                    userData.gym.expenses += refund;
                    userData.gym.members = userData.gym.members.filter(m => m.id !== memberId);
                
                    // 更新教练数据
                    if (userData.gym.staff) {
                        Object.values(userData.gym.staff).forEach(coach => {
                            if (coach.students?.includes(memberId)) {
                                coach.students = coach.students.filter(id => id !== memberId);
                                coach.studentCount--;
                            }
                        });
                    }
                
                    e.reply(`🎀 会员离馈通知
                
                💝 离馈会员信息：
                    👤 会员ID：${memberId}
                    ✨ 会员类型：${memberToRemove.type}
                    💰 退费金额：${refund}元
                
                💕 温馨提示：
                    1. 记得做好会员回访哦
                    2. 了解离馈原因很重要呢
                    3. 保持联系，期待回归～
                    4. 可以送上一份小礼物呢`);
                    break;
                
                case 'upgrade':
                    const memberToUpgrade = userData.gym.members.find(m => m.id === memberId);
                    if (!memberToUpgrade) {
                        e.reply("💔 找不到这位会员呢，请检查ID是否正确～");
                        return;
                    }
                
                    if (!membershipTypes[memberType]) {
                        e.reply("💔 没有这个会员等级呢，请检查输入～");
                        return;
                    }
                
                    const upgradeFee = membershipTypes[memberType].monthlyFee - 
                                      membershipTypes[memberToUpgrade.type].monthlyFee;
                
                    memberToUpgrade.type = memberType;
                    userData.gym.income += upgradeFee;
                    userData.gym.reputation += 5;
                
                    e.reply(`🎀 会员升级成功！
                
                💝 升级详情：
                    👤 会员ID：${memberId}
                    ✨ 新会员类型：${memberType}
                    💰 升级费用：${upgradeFee}元
                    🎁 新增权益：${membershipTypes[memberType].benefits.join('、')}
                
                💕 温馨提示：
                    1. 记得介绍新的权益哦
                    2. 可以安排专属课程体验
                    3. 更新会员卡等级标识～
                    4. 发放升级礼包很贴心呢`);
                    break;
                
                default:
                    e.reply(`🎀 会员管理指令说明
                
                💝 可用指令：
                    1. 添加会员：add [会员ID] [会员类型]
                    2. 移除会员：remove [会员ID]
                    3. 升级会员：upgrade [会员ID] [目标类型]
                
                ✨ 会员类型：
                    · 普通会员
                    · 高级会员
                    · VIP会员
                
                💕 示例：
                    添加会员：#健身房会员管理 add 12345 高级会员
                    移除会员：#健身房会员管理 remove 12345
                    升级会员：#健身房会员管理 upgrade 12345 VIP会员`);
                }
                
                await redis.set(`user:${userId}`, JSON.stringify(userData));
                await saveUserData(userId, userData);
                }
                
    async Advertise_gym(e) {
                    const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!userData.gym) {
            e.reply("你还没有开设健身房！");
            return;
        }
                
                    const advertisingPlans = {
                        "社交媒体推广": {
                            cost: 300,
                            duration: 7,
                            effect: {
                                reputation: 10,
                                newMembers: 5,
                                exposure: 1000
                            },
                            platforms: ["微信", "抖音", "小红书"]
                        },
                        "社区活动": {
                            cost: 500,
                            duration: 3,
                            effect: {
                                reputation: 15,
                                newMembers: 8,
                                exposure: 800
                            },
                            activities: ["健康讲座", "免费体验课", "fitness party"]
                        },
                        "节日营销": {
                            cost: 800,
                            duration: 5,
                            effect: {
                                reputation: 20,
                                newMembers: 12,
                                exposure: 1500
                            },
                            promotions: ["节日优惠", "礼品赠送", "特别课程"]
                        }
                    };
                
                    // 随机选择一个推广计划
                    const planType = Object.keys(advertisingPlans)[Math.floor(Math.random() * 3)];
                    const plan = advertisingPlans[planType];
                
                    if (userData.money < plan.cost) {
                        e.reply(`💔 亲爱的，${planType}需要${plan.cost}元呢，
                当前余额不够呢...
                
                💝 小建议：
                    1. 可以先进行小规模宣传呢
                    2. 寻找合作伙伴分担成本～
                    3. 善用免费推广渠道哦`);
                        return;
                    }
                
                    // 计算推广效果
                    const timeBonus = new Date().getHours() >= 9 && new Date().getHours() <= 22 ? 1.2 : 0.8;
                    const seasonBonus = [3,4,5,9,10,11].includes(new Date().getMonth()) ? 1.3 : 1.0;
                    
                    const actualEffect = {
                        reputation: Math.floor(plan.effect.reputation * timeBonus * seasonBonus),
                        newMembers: Math.floor(plan.effect.newMembers * timeBonus * seasonBonus),
                        exposure: Math.floor(plan.effect.exposure * timeBonus * seasonBonus)
                    };
                
                    // 更新健身房数据
                    userData.gym.reputation += actualEffect.reputation;
                    userData.money -= plan.cost;
                    userData.gym.expenses += plan.cost;
                
                    // 记录推广历史
                    userData.gym.marketingHistory = userData.gym.marketingHistory || [];
                    userData.gym.marketingHistory.push({
                        type: planType,
                        date: Date.now(),
                        cost: plan.cost,
                        effect: actualEffect
                    });
                
                    await redis.set(`user:${userId}`, JSON.stringify(userData));
                    await saveUserData(userId, userData);
                
                    e.reply(`🎀 推广活动开始啦！
                
                💝 推广计划：${planType}
                
                ✨ 推广详情：
                    ⏰ 持续时间：${plan.duration}天
                    💰 投入费用：${plan.cost}元
                    
                📊 预期效果：
                    ⭐ 声誉提升：+${actualEffect.reputation}
                    👥 潜在新会员：${actualEffect.newMembers}人
                    🌟 曝光量：${actualEffect.exposure}次
                
                ${planType === "社交媒体推广" ? `
                💫 投放平台：
                ${plan.platforms.map(p => `    🌸 ${p}`).join('\n')}` :
                planType === "社区活动" ? `
                💫 活动安排：
                ${plan.activities.map(a => `    🌸 ${a}`).join('\n')}` : `
                💫 节日活动：
                ${plan.promotions.map(p => `    🌸 ${p}`).join('\n')}`}
                
                💕 温馨提示：
                    1. 记得跟进推广效果哦
                    2. 及时回复咨询很重要呢
                    3. 可以让老会员帮忙转发～
                    4. 保存数据做好分析呢
                
                祝推广活动圆满成功！
                (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧`);
                
                    // 活动结束后的效果报告
                    setTimeout(async () => {
                        const results = {
                            newMembers: Math.floor(actualEffect.newMembers * (Math.random() * 0.4 + 0.8)),
                            interactions: Math.floor(actualEffect.exposure * 0.1),
                            inquiries: Math.floor(actualEffect.exposure * 0.05)
                        };
                
                        e.reply(`🎀 推广活动总结报告
                
                💝 活动数据：
                    👥 新增会员：${results.newMembers}人
                    💫 互动量：${results.interactions}次
                    📞 咨询量：${results.inquiries}次
                
                ✨ 效果分析：
                    ${results.newMembers >= actualEffect.newMembers ? 
                      "超出预期，效果非常好呢！" : 
                      "达到预期目标，继续加油哦！"}
                
                💕 后续建议：
                    1. 持续跟进意向会员
                    2. 整理推广素材留存
                    3. 总结成功经验呢
                    4. 可以考虑二次推广哦
                
                继续努力，会越来越好的！
                (◍•ᴗ•◍)✧*。`);
                    }, plan.duration * 24 * 60 * 60 * 1000);
    }

    async banPlayer(userId, e) {
        const banTime = 3600 * 1000; // 封禁时间为1小时
        const banUntil = Date.now() + banTime;
        await redis.set(`ban:${userId}`, banUntil.toString());
        await saveBanData(userId, banUntil);
        e.reply("数据不一致，您的账号已被封禁1小时。");
    }
}