import { segment } from 'icqq';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import {
    saveUserData,
    loadAllUsers,
    checkUserData,
    saveBanData,
} from '../function/function.js';
import Redis from 'ioredis';
const redis = new Redis();
export class UserStart extends plugin {
    constructor() {
        super({
            name: 'UserStart',
            dsc: '游戏开始',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#成为机械师$', fnc: 'Become_mechanic' },
                { reg: '^#修理设备$', fnc: 'Repair_device' },
                { reg: '^#升级技能(?:\s+(.+))?$', fnc: 'Upgrade_skill' },
                { reg: '^#查看机械师状态$', fnc: 'Show_mechanic_status' },
                { reg: '^#参与机械比赛$', fnc: 'Participate_competition' },
                { reg: '^#购买机械工具(?:\s+(.+))?$', fnc: 'Buy_tools' },
                { reg: '^^#出售机械工具(?:\s+(.+))?$', fnc: 'Sell_tools' },
                { reg: '^#机械师任务$', fnc: 'Mechanic_task' },
                { reg: '^#机械师成就$', fnc: 'Mechanic_achievement' },
                { reg: '^#学习新技能(?:\s+(.+))?$', fnc: 'Learn_new_skill' },
                { reg: '^#查看工具列表$', fnc: 'Show_tool_list' },
                { reg: '^#查看技能列表$', fnc: 'Show_skill_list' },
                { reg: '^#提升机械师等级$', fnc: 'Upgrade_mechanic_level' },
                { reg: '^#进行机械研究$', fnc: 'Conduct_mechanical_research' },
                { reg: '^#查看研究结果$', fnc: 'Show_research_results' },
                { reg: '^#接受神秘任务$', fnc: 'Accept_mysterious_task' },
                { reg: '^#完成神秘任务$', fnc: 'Complete_mysterious_task' },
                { reg: '^#查看封禁状态$', fnc: 'Check_ban_status' },
                { reg: '^#查看用户排行$', fnc: 'Show_user_ranking' },
                { reg: '^#修理机器人(?:\s+(.+))?$', fnc: 'Repair_robot' },
                { reg: '^#参加机械论坛$', fnc: 'Attend_mechanical_forum' },
                { reg: '^#查看论坛记录$', fnc: 'Show_forum_records' },
            ],
        });
    }
    async Become_mechanic(e) {
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
    
        if (userData.job === "机械师") {
            e.reply([
                "✨ 亲爱的,你已经是一名可爱的机械师啦~",
                "要继续加油维修各种精密仪器哦!"
            ].join("\n"));
            return;
        }
    
        // 初始化机械师数据
        userData.job = "机械师";
        userData.mechanic = {
            // 基础属性
            level: 1,                    // 等级
            experience: 0,               // 经验值
            stamina: 100,                 // 体力值
            mood: 100,                  // 心情值
            charm: 10,                  // 魅力值
            
            // 装扮系统
            outfit: {
                uniform: "初始机械师制服",  // 制服
                accessories: ["可爱发卡", "基础护目镜", "小巧工具包"],  // 配饰
                color: "淡粉色",           // 主题色
                style: "清新可爱风"         // 风格
            },
    
            // 性格特征
            personality: {
                type: "活泼开朗",          // 性格类型
                specialty: "基础维修",      // 专长
                hobby: ["收集工具", "研究机械", "制作小饰品"],  // 兴趣爱好
                dream: "成为优秀的机械师"    // 梦想
            },
    
            // 工作室信息
            workshop: {
                name: "温馨小屋",          // 工作室名称
                level: 1,                 // 工作室等级
                decoration: ["小花盆", "玩偶", "工具架"],  // 装饰品
                cleanliness: 100,         // 整洁度
                popularity: 0,            // 人气值
                atmosphere: "温馨"         // 氛围
            },
    
            // 技能系统
            skills: {
                basic: {                  // 基础技能
                    repair: 1,            // 维修技能
                    research: 1,          // 研究技能
                    craft: 1              // 制作技能
                },
                special: [],              // 特殊技能
                buffs: []                 // 技能加成
            },
    
            // 工具系统
            tools: {
                basic: ["基础扳手", "小螺丝刀", "简易万用表"],  // 基础工具
                special: [],              // 特殊工具
                collection: []            // 收藏工具
            },
    
            // 任务系统
            tasks: {
                daily: {                  // 每日任务
                    completed: 0,
                    total: 0
                },
                weekly: {                 // 每周任务
                    completed: 0,
                    total: 0
                },
                achievement: {            // 成就任务
                    completed: [],
                    inProgress: []
                }
            },
            achievements: {
                tasksCompleted: 0,
                competitionsWon: 0,
                magicRepairs: 0,
               
            },
            // 社交系统
            social: {
                friends: [],              // 好友列表
                reputation: 0,            // 声望值
                guildStatus: "未加入",     // 公会状态
                contributions: 0          // 贡献度
            },
    
            // 商店系统
            shop: {
                points: 0,               // 商店点数
                vipLevel: 0,             // 会员等级
                discount: 0,             // 折扣率
                purchaseHistory: []       // 购买记录
            },
    
            // 收藏系统
            collection: {
                tools: [],               // 工具收藏
                badges: [],              // 徽章收藏
                outfits: [],             // 服装收藏
                rare: []                 // 稀有收藏
            },
    
            // 成长系统
            growth: {
                totalRepairs: 0,         // 总维修次数
                successRate: 0,          // 成功率
                specialAchievements: [], // 特殊成就
                skillPoints: 0           // 技能点
            },
    
            // 状态系统
            status: {
                title: "见习机械师",       // 当前称号
                buffs: [],               // 增益效果
                debuffs: [],             // 减益效果
                condition: "正常"         // 状态情况
            }
        };
    
        // 发送欢迎信息
        const welcomeMsg = [
            "✨ 欢迎成为机械师! ✨",
            "",
            "🎀 初始装备:",
            "- 清新机械师制服",
            "- 可爱发卡",
            "- 基础护目镜",
            "- 小巧工具包",
            "",
            "🛠️ 初始工具:",
            "- 基础扳手",
            "- 小螺丝刀",
            "- 简易万用表",
            "",
            "📝 新手指引:",
            "1. 先熟悉基础维修技能",
            "2. 尝试完成每日任务",
            "3. 结识其他机械师",
            "",
            "💡 小贴士:",
            "- 保持心情愉悦有助于提高维修成功率",
            "- 记得及时补充体力值",
            "- 打扮好你的工作室吧",
            "",
            "祝你在机械师的道路上玩得开心哦~ 💝"
        ].join("\n");
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        e.reply(welcomeMsg);
    
        // 延迟发送新手礼包信息
        setTimeout(() => {
            const giftMsg = [
                "🎁 新手礼包已送达:",
                "- 体力药水 x2",
                "- 心情糖果 x2",
                "- 工具券 x1",
                "- 新手指南 x1",
                "",
                "请查看背包领取哦~"
            ].join("\n");
            e.reply(giftMsg);
        }, 1500);
    }

    async Repair_device(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        // 基础检查
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作哦~");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (userData.job !== "机械师") {
            e.reply([
                "💭 啊啦，你还不是机械师呢~",
                "要先使用 #成为机械师 加入我们哦！",
                "期待与你一起修理可爱的小物件呢 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
        // 维修设备列表
        const deviceTypes = {
            可爱系: [
                {
                    name: "梦幻音乐盒",
                    difficulty: "简单",
                    exp: 15,
                    reward: 100,
                    materials: ["彩色齿轮", "水晶发条"],
                    description: "能播放治愈音乐的精致音乐盒"
                },
                {
                    name: "星星小夜灯",
                    difficulty: "简单",
                    exp: 12,
                    reward: 80,
                    materials: ["星光灯泡", "彩虹电池"],
                    description: "会投射星空的温馨小夜灯"
                }
            ],
            生活系: [
                {
                    name: "甜心烤箱",
                    difficulty: "中等",
                    exp: 20,
                    reward: 150,
                    materials: ["温控芯片", "加热丝"],
                    description: "少女心满满的粉色烤箱"
                },
                {
                    name: "萌宠投食器",
                    difficulty: "简单",
                    exp: 15,
                    reward: 90,
                    materials: ["定时器", "食物盒"],
                    description: "可爱的自动宠物喂食器"
                }
            ],
            创意系: [
                {
                    name: "彩虹投影仪",
                    difficulty: "困难",
                    exp: 25,
                    reward: 200,
                    materials: ["七彩晶片", "魔法镜头"],
                    description: "能投射梦幻彩虹的神奇装置"
                },
                {
                    name: "心愿留声机",
                    difficulty: "中等",
                    exp: 18,
                    reward: 120,
                    materials: ["黄金唱针", "水晶唱片"],
                    description: "播放美妙音乐的复古留声机"
                }
            ]
        };
        // 随机选择设备类型和具体设备
        const deviceCategories = Object.keys(deviceTypes);
        const randomCategory = deviceCategories[Math.floor(Math.random() * deviceCategories.length)];
        const deviceList = deviceTypes[randomCategory];
        const device = deviceList[Math.floor(Math.random() * deviceList.length)];
        // 检查体力值
        if (userData.stamina < 15) {
            e.reply([
                "⚠️ 哎呀，你看起来很累的样子呢~",
                "要先去休息一下吧！",
                "",
                "当前状态:",
                `体力值: ${userData.stamina}/100 💗`,
                `心情值: ${userData.mood}/100 💭`,
                "",
                "Tips: 可以使用体力药水恢复体力哦~"
            ].join("\n"));
            return;
        }
        // 开始维修流程
        e.reply([
            `🔧 发现一个待修理的${device.name}！`,
            "",
            "『设备信息』",
            `描述: ${device.description}`,
            `难度: ${device.difficulty}`,
            `所需材料: ${device.materials.join("、")}`,
            "",
            "开始修理了哦~ 请稍等..."
        ].join("\n"));
        // 模拟维修过程
        await new Promise(resolve => setTimeout(resolve, 15000));
        // 计算成功率
        const baseRate = {
            "简单": 0.8,
            "中等": 0.6,
            "困难": 0.4
        }[device.difficulty];
        const skillBonus = userData.mechanic.skills.basic.repair * 0.05;
        const moodBonus = (userData.mood / 100) * 0.1;
        const toolBonus = this.calculateToolBonus(userData);
        let successRate = baseRate + skillBonus + moodBonus + toolBonus;
        successRate = Math.min(successRate, 0.95);
        // 维修结果
        const isSuccess = Math.random() < successRate;
        // 更新用户数据
        userData.stamina -= 15;
        if (isSuccess) {
            // 维修成功奖励
            userData.mechanic.experience += device.exp;
            userData.mechanic.growth.totalRepairs += 1;
            userData.mood = Math.min(100, userData.mood + 5);
            userData.money += device.reward;
            // 随机特殊奖励
            const specialRewards = this.generateSpecialRewards(device);
            // 成功提示
            e.reply([
                "✨ 修理成功啦！真是太棒了！",
                "",
                "『获得奖励』",
                `经验值 +${device.exp}`,
                `金币 +${device.reward}`,
                `心情值 +5`,
                "",
                specialRewards.length ? "『特殊奖励』\n" + specialRewards.join("\n") : "",
                "",
                "『当前状态』",
                `体力值: ${userData.stamina}/100`,
                `心情值: ${userData.mood}/100`,
                "",
                "继续加油哦！(◕‿◕✿)"
            ].join("\n"));
            // 检查成就
            this.checkAchievements(userData, device);
        } else {
            // 维修失败
            userData.mood = Math.max(0, userData.mood - 5);
            e.reply([
                "呜呜...修理失败了...",
                "但是不要灰心，失败也是一种经验呢！",
                "",
                "『状态变化』",
                "体力值 -15",
                "心情值 -5",
                "",
                "要再试一次吗？加油哦！୧(๑•̀⌄•́๑)૭"
            ].join("\n"));
        }
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    // 计算工具加成
    calculateToolBonus(userData) {
        let bonus = 0;
        // 基础工具加成
        if (userData.mechanic.tools.basic.length >= 3) {
            bonus += 0.05;
        }
        // 特殊工具加成
        if (userData.mechanic.tools.special.length > 0) {
            bonus += 0.08;
        }
        // 稀有工具加成
        if (userData.mechanic.collection.rare.length > 0) {
            bonus += 0.12;
        }
        return bonus;
    }
    
    // 生成特殊奖励
    generateSpecialRewards(device) {
        const rewards = [];
        
        // 随机特殊奖励
        if (Math.random() < 0.1) {
            rewards.push("🌟 获得稀有材料：闪耀齿轮");
        }
        if (Math.random() < 0.05) {
            rewards.push("🎀 获得限定工具：梦幻扳手");
        }
        if (Math.random() < 0.03) {
            rewards.push("💝 获得神秘礼盒");
        }
        if (Math.random() < 0.01) {
            rewards.push("🎊 获得稀有称号：维修达人");
        }
    
        return rewards;
    }
    
    // 检查成就
    async checkAchievements(userData, device) {
        const achievements = [];
        
        // 检查各种成就条件
        if (userData.mechanic.growth.totalRepairs >= 10) {
            achievements.push("🏆 解锁成就：维修新手");
        }
        if (userData.mechanic.growth.totalRepairs >= 50) {
            achievements.push("🏆 解锁成就：维修达人");
        }
        if (userData.mechanic.growth.totalRepairs >= 100) {
            achievements.push("🏆 解锁成就：维修大师");
        }
    
        // 如果获得新成就，发送提示
        if (achievements.length > 0) {
            setTimeout(() => {
                e.reply([
                    "🎉 恭喜获得新成就！",
                    "",
                    ...achievements,
                    "",
                    "真是太厉害了呢！继续加油哦~"
                ].join("\n"));
            }, 1500);
        }
    }

    async Upgrade_skill(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作哦~");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (userData.job !== "机械师") {
            e.reply([
                "💭 还不是机械师呢~",
                "要先使用 #成为机械师 加入我们哦！",
                "一起来学习各种有趣的技能吧 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
        // 定义技能系统
        const skillSystem = {
            基础技能: {
                精密维修: {
                    level: 1,
                    maxLevel: 10,
                    cost: 50,
                    description: "提高维修成功率",
                    effect: "维修成功率 +3%",
                    requirements: []
                },
                工具精通: {
                    level: 1,
                    maxLevel: 8,
                    cost: 60,
                    description: "提高工具使用效率",
                    effect: "工具效果 +5%",
                    requirements: ["精密维修:3"]
                },
                材料节省: {
                    level: 1,
                    maxLevel: 5,
                    cost: 80,
                    description: "减少材料消耗",
                    effect: "材料消耗 -10%",
                    requirements: ["工具精通:2"]
                }
            },
            进阶技能: {
                创新改装: {
                    level: 1,
                    maxLevel: 6,
                    cost: 100,
                    description: "解锁设备改装功能",
                    effect: "可以改装设备外观",
                    requirements: ["精密维修:5"]
                },
                效率优化: {
                    level: 1,
                    maxLevel: 7,
                    cost: 90,
                    description: "缩短维修时间",
                    effect: "维修时间 -15%",
                    requirements: ["工具精通:4"]
                }
            },
            特殊技能: {
                魔法改造: {
                    level: 1,
                    maxLevel: 3,
                    cost: 200,
                    description: "为设备注入魔法效果",
                    effect: "解锁魔法特效",
                    requirements: ["创新改装:3", "效率优化:3"]
                }
            }
        };
        // 获取技能名称
        const skillName = e.msg.replace('#升级技能', '').trim();
        if (!skillName) {
            // 显示技能列表
            const skillList = this.generateSkillList(skillSystem, userData);
            e.reply(skillList);
            return;
        }
        // 查找技能
        const skill = this.findSkill(skillSystem, skillName);
        if (!skill) {
            e.reply([
                "呜...没有找到这个技能呢",
                "可以使用 #升级技能 查看所有可用技能哦~"
            ].join("\n"));
            return;
        }
        // 检查前置条件（调用新函数，传入 skillSystem 作为第三个参数）
        if (!this.checkSkillUpgradeRequirements(userData, skill, skillSystem)) {
            e.reply([
                "还不能学习这个技能哦~",
                "",
                "需要先满足以下条件:",
                ...skill.requirements.map(req => `- ${req}`),
                "",
                "继续努力吧！"
            ].join("\n"));
            return;
        }
        // 检查等级上限
        if (skill.level >= skill.maxLevel) {
            e.reply([
                "这个技能已经达到最高等级啦！",
                "真是太厉害了呢 (●'◡'●)"
            ].join("\n"));
            return;
        }
        // 检查经验值
        if (userData.mechanic.experience < skill.cost) {
            e.reply([
                "经验值不够呢...",
                `需要 ${skill.cost} 点经验值`,
                `当前经验值: ${userData.mechanic.experience}`,
                "",
                "继续加油积累经验吧！"
            ].join("\n"));
            return;
        }
        // 升级技能
        userData.mechanic.experience -= skill.cost;
        skill.level += 1;
        // 特殊效果
        const specialEffects = this.calculateSpecialEffects(skill);
        // 发送升级提示
        e.reply([
            `✨ ${skillName} 升级成功！`,
            "",
            "『技能信息』",
            `当前等级: ${skill.level}/${skill.maxLevel}`,
            `效果: ${skill.effect}`,
            "",
            specialEffects.length ? "『特殊效果』\n" + specialEffects.join("\n") : "",
            "",
            "继续努力提升其他技能吧~"
        ].join("\n"));
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    // 生成技能列表
    generateSkillList(skillSystem, userData) {
        const list = ["『可学习的技能』"];
        
        for (const [category, skills] of Object.entries(skillSystem)) {
            list.push(`\n${category}:`);
            for (const [name, data] of Object.entries(skills)) {
                const available = this.checkSkillRequirements(userData, data);
                list.push(
                    `${available ? "☆" : "★"} ${name}`,
                    `  等级: ${data.level}/${data.maxLevel}`,
                    `  描述: ${data.description}`,
                    `  消耗: ${data.cost}经验值`
                );
            }
        }
        
        list.push("\n使用 #升级技能 技能名 来升级指定技能~");
        return list.join("\n");
    }
    
    // 查找技能
    findSkill(skillSystem, name) {
        for (const category of Object.values(skillSystem)) {
            if (category[name]) return category[name];
        }
        return null;
    }
    
    // 检查技能前置条件
    checkSkillRequirements(userData, skill) {
        if (!skill.requirements.length) return true;
        
        return skill.requirements.every(req => {
            const [skillName, level] = req.split(":");
            const requiredSkill = this.findSkill(skillSystem, skillName);
            return requiredSkill && requiredSkill.level >= parseInt(level);
        });
    }
    
    // 计算特殊效果
    calculateSpecialEffects(skill) {
        const effects = [];
        
        if (skill.level === skill.maxLevel) {
            effects.push("🌟 达到最高等级！");
            effects.push("获得称号：技能大师");
        }
        
        if (skill.level % 3 === 0) {
            effects.push("✨ 解锁新的技能组合效果");
        }
        
        return effects;
    }

    async Show_mechanic_status(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作哦~");
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💭 你还不是机械师呢~",
                "要先使用 #成为机械师 加入我们哦！",
                "期待你的加入哦 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 生成状态报告
       // 在 Show_mechanic_status 函数中，确保 economy 属性被初始化
const statusReport = [
    "『机械师个人档案』",
    `昵称: ${userData.name || "可爱的机械师"}`,
    `等级: ${userData.mechanic.level}`,
    "",
    "『基础属性』",
    `✨ 经验值: ${userData.mechanic.experience}`,
    `💗 体力值: ${userData.mechanic.stamina}/100`,
    `💭 心情值: ${userData.mechanic.mood}/100`,
    `💝 魅力值: ${userData.mechanic.charm}`,
    "",
    "『个人信息』",
    `🎀 称号: ${userData.mechanic.status.title}`,
    `👗 当前装扮: ${userData.mechanic.outfit.uniform}`,
    `🎨 个性色彩: ${userData.mechanic.outfit.color}`,
    "",
    "『技能熟练度』",
    `🔧 维修技能: ${this.getSkillLevel(userData.mechanic.skills.basic.repair)}`,
    `🛠️ 制作技能: ${this.getSkillLevel(userData.mechanic.skills.basic.craft)}`,
    `📚 研究技能: ${this.getSkillLevel(userData.mechanic.skills.basic.research)}`,
    "",
    "『工作室信息』",
    `🏠 工作室: ${userData.mechanic.workshop.name}`,
    `⭐ 人气值: ${userData.mechanic.workshop.popularity}`,
    `✨ 整洁度: ${userData.mechanic.workshop.cleanliness}%`,
    "",
    "『成就统计』",
    `📝 完成任务: ${userData.mechanic.achievements.tasksCompleted}次`,
    `🏆 获得成就: ${this.countAchievements(userData)}个`,
    `🎖️ 比赛获胜: ${userData.mechanic.achievements.competitionsWon}次`,
    "",
    "『社交关系』",
    `👥 好友数量: ${userData.mechanic.social.friends.length}`,
    `💫 声望值: ${userData.mechanic.social.reputation}`,
    `🌟 公会等级: ${this.getGuildLevel(userData)}`,
    "",
    "『经济状况』",
    `💰 当前金币: ${userData.money}`,
    `💎 累计收入: ${(userData.mechanic.economy && userData.mechanic.economy.income) || 0}`, // 确保 income 已初始化
    `🎁 商店积分: ${userData.mechanic.shop.points}`,
    "",
    "『个性标签』",
    this.getPersonalityTags(userData),
    "",
    "『最近活动』",
    ...this.getRecentActivities(userData)
].join("\n");
    
        e.reply(statusReport);
    }
    
    // 获取技能等级描述
    getSkillLevel(level) {
        const levels = [
            "新手",
            "学徒",
            "熟练",
            "专家",
            "大师"
        ];
        return levels[Math.min(Math.floor(level/2), levels.length - 1)];
    }
    
    // 统计成就数量（增加判空处理）
countAchievements(user) {
    const achievements = (user.mechanic && user.mechanic.achievements) || {};
    return Object.values(achievements).filter(achievement => achievement.unlocked).length;
}
    
    // 获取公会等级描述
    getGuildLevel(userData) {
        if (!userData.mechanic.social.guildStatus) return "未加入";
        const level = userData.mechanic.social.contributions / 1000;
        const levels = [
            "见习成员",
            "正式成员",
            "精英成员",
            "核心成员",
            "荣誉成员"
        ];
        return levels[Math.min(Math.floor(level), levels.length - 1)];
    }
    
    // 获取个性标签
    getPersonalityTags(userData) {
        const tags = [];
        const personality = userData.mechanic.personality;
    
        // 根据各种数据生成个性标签
        if (userData.mechanic.achievements.tasksCompleted > 100) {
            tags.push("勤奋认真");
        }
        if (userData.mechanic.mood > 80) {
            tags.push("开朗活泼");
        }
        if (userData.mechanic.skills.basic.repair > 5) {
            tags.push("维修达人");
        }
        if (userData.mechanic.workshop.popularity > 1000) {
            tags.push("人气王");
        }
        if (userData.mechanic.social.friends.length > 20) {
            tags.push("社交达人");
        }
    
        return tags.length ? tags.join(" | ") : "暂无标签";
    }
    
    // 获取最近活动记录
    getRecentActivities(userData) {
        const activities = userData.mechanic.recentActivities || [];
        if (activities.length === 0) return ["暂无活动记录"];
    
        return activities
            .slice(-3)
            .map(activity => `• ${activity.time}: ${activity.description}`);
    }

    async Participate_competition(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法参加比赛哦~");
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💭 还不是机械师呢~",
                "要先使用 #成为机械师 加入我们才能参加比赛哦！",
                "期待你的参与呢 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 检查参赛条件
        if (userData.mechanic.stamina < 30) {
            e.reply([
                "哎呀，体力不够呢...",
                "比赛需要30点体力哦！",
                `当前体力：${userData.stamina}/100`,
                "",
                "先去休息一下吧~"
            ].join("\n"));
            return;
        }
    
        // 比赛类型
        const competitions = {
            新手赛: {
                name: "新手友谊赛",
                level: 1,
                difficulty: "简单",
                reward: {
                    exp: 50,
                    money: 200,
                    points: 10
                },
                requirements: {
                    level: 1,
                    tools: ["基础工具组"]
                }
            },
            进阶赛: {
                name: "进阶技能赛",
                level: 3,
                difficulty: "中等",
                reward: {
                    exp: 100,
                    money: 500,
                    points: 20
                },
                requirements: {
                    level: 3,
                    tools: ["进阶工具组"]
                }
            },
            专家赛: {
                name: "专家挑战赛",
                level: 5,
                difficulty: "困难",
                reward: {
                    exp: 200,
                    money: 1000,
                    points: 40
                },
                requirements: {
                    level: 5,
                    tools: ["专业工具组"]
                }
            },
            大师赛: {
                name: "机械大师赛",
                level: 8,
                difficulty: "极难",
                reward: {
                    exp: 500,
                    money: 2000,
                    points: 100
                },
                requirements: {
                    level: 8,
                    tools: ["大师工具组"]
                }
            }
        };
    
        // 选择合适的比赛类型
        const availableCompetitions = this.getAvailableCompetitions(userData, competitions);
        
        if (availableCompetitions.length === 0) {
            e.reply([
                "当前没有适合你参加的比赛呢~",
                "继续提升等级和收集工具吧！",
                "",
                "💡 小贴士：",
                "- 收集更多工具可以参加更高级的比赛",
                "- 提升等级可以解锁新的比赛类型"
            ].join("\n"));
            return;
        }
    
        // 随机选择一个可参加的比赛
        const competition = availableCompetitions[Math.floor(Math.random() * availableCompetitions.length)];
    
        // 开始比赛
        e.reply([
            `🎊 欢迎参加 ${competition.name}！`,
            "",
            "『比赛信息』",
            `难度：${competition.difficulty}`,
            `奖励经验：${competition.reward.exp}`,
            `奖励金币：${competition.reward.money}`,
            `奖励积分：${competition.reward.points}`,
            "",
            "比赛即将开始，请做好准备~"
        ].join("\n"));
    
        // 模拟比赛过程
        await this.simulateCompetition(e, userData, competition);
    }
    
    getAvailableCompetitions(userData, competitions) {
        return Object.values(competitions).filter(comp => {
            const tools = Array.isArray(userData.mechanic.tools) ? userData.mechanic.tools : [];
            return userData.mechanic.level >= comp.requirements.level &&
                   comp.requirements.tools.every(tool => tools.some(t => t.name === tool));
        });
    }
    
    // 模拟比赛过程
    async simulateCompetition(e, userData, competition) {
        // 比赛阶段
        const stages = [
            {
                name: "理论考核",
                weight: 0.3,
                delay: 2000
            },
            {
                name: "实践操作",
                weight: 0.4,
                delay: 3000
            },
            {
                name: "创新设计",
                weight: 0.3,
                delay: 2500
            }
        ];
    
        let totalScore = 0;
        let stageResults = [];
    
        // 处理每个阶段
        for (const stage of stages) {
            await new Promise(resolve => setTimeout(resolve, stage.delay));
    
            const baseScore = Math.random() * 100;
            const skillBonus = this.calculateSkillBonus(userData, stage.name);
            const toolBonus = this.calculateToolBonus(userData, stage.name);
            const moodBonus = (userData.mechanic.mood / 100) * 10;
    
            const stageScore = Math.min(100, baseScore + skillBonus + toolBonus + moodBonus);
            const weightedScore = stageScore * stage.weight;
            totalScore += weightedScore;
    
            stageResults.push({
                name: stage.name,
                score: stageScore.toFixed(1)
            });
    
            // 发送阶段结果
            e.reply([
                `『${stage.name}』`,
                `得分：${stageScore.toFixed(1)}`,
                this.getScoreComment(stageScore),
                "",
                "继续加油哦~"
            ].join("\n"));
        }
    
        // 处理最终结果
        this.handleCompetitionResult(e, userData, competition, totalScore, stageResults);
    }
    
    // 计算技能加成
    calculateSkillBonus(userData, stageName) {
        let bonus = 0;
        const skills = userData.mechanic.skills.basic;
    
        switch(stageName) {
            case "理论考核":
                bonus = skills.research * 2;
                break;
            case "实践操作":
                bonus = skills.repair * 3;
                break;
            case "创新设计":
                bonus = skills.craft * 2.5;
                break;
        }
    
        return bonus;
    }
    
    // 获取分数评价
    getScoreComment(score) {
        if (score >= 90) return "✨ 太棒了！完美发挥！";
        if (score >= 80) return "🌟 表现得很好呢！";
        if (score >= 70) return "💫 还不错哦，继续加油！";
        if (score >= 60) return "💪 及格啦，要继续努力！";
        return "🎯 没关系，下次一定会更好的！";
    }
    
    // 处理比赛结果
    async handleCompetitionResult(e, userData, competition, totalScore, stageResults) {
        const isWin = totalScore >= 80;
        userData.mechanic.stamina -= 30;
    
        if (isWin) {
            // 胜利奖励
            userData.mechanic.experience += competition.reward.exp;
            userData.money += competition.reward.money;
            userData.mechanic.shop.points += competition.reward.points;
            userData.mechanic.achievements.competitionsWon += 1;
            userData.mechanic.mood = Math.min(100, userData.mechanic.mood + 10);
    
            // 生成随机特殊奖励
            const specialRewards = this.generateSpecialRewards(competition);
    
            e.reply([
                "🎊 比赛结束！",
                "",
                "『总成绩』",
                `最终得分：${totalScore.toFixed(1)}`,
                "",
                "『阶段得分』",
                ...stageResults.map(stage => 
                    `${stage.name}：${stage.score}分`
                ),
                "",
                "『获得奖励』",
                `经验值 +${competition.reward.exp}`,
                `金币 +${competition.reward.money}`,
                `商店积分 +${competition.reward.points}`,
                `心情值 +10`,
                "",
                specialRewards.length ? 
                    "『特殊奖励』\n" + specialRewards.join("\n") : "",
                "",
                "恭喜你取得了优秀的成绩！继续加油哦~ (◕‿◕✿)"
            ].join("\n"));
        } else {
            userData.mechanic.mood = Math.max(0, userData.mechanic.mood - 5);
    
            e.reply([
                "比赛结束啦~",
                "",
                "『总成绩』",
                `最终得分：${totalScore.toFixed(1)}`,
                "",
                "『阶段得分』",
                ...stageResults.map(stage => 
                    `${stage.name}：${stage.score}分`
                ),
                "",
                "没关系，失败是成功的妈妈！",
                "继续加油，下次一定会更好的！୧(๑•̀⌄•́๑)૭"
            ].join("\n"));
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    // 生成特殊奖励
    generateSpecialRewards(competition) {
        const rewards = [];
        
        if (Math.random() < 0.1) {
            rewards.push("🎀 获得限定徽章：比赛达人");
        }
        if (Math.random() < 0.05) {
            rewards.push("🌟 获得稀有工具：彩虹扳手");
        }
        if (Math.random() < 0.01) {
            rewards.push("💝 解锁特殊称号：机械天才");
        }
    
        return rewards;
    }

    async Buy_tools(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("呜...你现在处于小黑屋中,暂时不能购物哦~");
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💝 温馨提示:",
                "亲爱的,你还不是机械师呢~",
                "先使用 #成为机械师 加入我们的大家庭吧!",
                "这里有超多可爱的工具等着你哦 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 萌萌哒的工具商店
        const cuteToolShop = {
            "新手の小铺": {
                "粉红小扳手": {
                    price: 100,
                    description: "闪闪发光的粉色扳手,手感超级棒！",
                    effect: "维修成功率+3%,好感度+1",
                    durability: 50,
                    level: 1,
                    category: "可爱系"
                },
                "星星螺丝刀": {
                    price: 120,
                    description: "装饰着小星星的螺丝刀,超可爱！",
                    effect: "精确度+2%,心情值+2",
                    durability: 60,
                    level: 1,
                    category: "梦幻系"
                }
            },
            "少女の工坊": {
                "蝴蝶结工具包": {
                    price: 300,
                    description: "系着蝴蝶结的粉色工具包,容量很大哦",
                    effect: "工具耐久+15%,魅力值+3",
                    durability: 80,
                    level: 3,
                    category: "甜美系"
                },
                "彩虹万用表": {
                    price: 350,
                    description: "七彩斑斓的电子万用表,测量超准确",
                    effect: "检测效率+12%,技能经验+5%",
                    durability: 100,
                    level: 3,
                    category: "科技系"
                }
            },
            "魔法の专卖": {
                "魔法工具箱": {
                    price: 800,
                    description: "洒满星光的魔法工具箱,充满神秘力量",
                    effect: "全属性+5%,随机触发魔法效果",
                    durability: 150,
                    level: 5,
                    category: "魔法系"
                },
                "独角兽维修台": {
                    price: 1000,
                    description: "独角兽造型的梦幻维修台,超稀有！",
                    effect: "维修品质+20%,声望+10",
                    durability: 200,
                    level: 5,
                    category: "限定系"
                }
            }
        };
    
        const toolName = e.msg.replace('#购买机械工具', '').trim();
    
        // 显示可爱商店
        if (!toolName) {
            const shopDisplay = this.generateCuteShopDisplay(cuteToolShop, userData);
            e.reply(shopDisplay);
            return;
        }
    
        // 查找心仪的工具
        const tool = this.findCuteTool(cuteToolShop, toolName);
        
        if (!tool) {
            e.reply([
                "呜呜...找不到这个工具呢",
                "要不要看看其他可爱的工具呀？",
                "使用 #购买机械工具 可以查看全部商品哦~",
                "٩(◕‿◕｡)۶"
            ].join("\n"));
            return;
        }
    
        // 检查等级要求
        if (userData.mechanic.level < tool.level) {
            e.reply([
                "哎呀,等级还不够呢...",
                `这个工具需要${tool.level}级才能购买哦`,
                `你现在是${userData.mechanic.level}级`,
                "",
                "继续加油升级吧！",
                "相信很快就能买到心仪的工具了呢 ⭐"
            ].join("\n"));
            return;
        }
    
        // 检查钱钱
        if (userData.money < tool.price) {
            e.reply([
                "咦...钱钱不够了呢",
                `这个可爱的工具需要${tool.price}金币`,
                `你现在有${userData.money}金币`,
                "",
                "去做点任务赚钱吧~",
                "记得攒钱买自己喜欢的工具哦 (｡♥‿♥｡)"
            ].join("\n"));
            return;
        }
    
        // 购买成功
        userData.money -= tool.price;
        
        // 添加工具到背包
        const newTool = {
            id: Date.now(),
            name: toolName,
            durability: tool.durability,
            maxDurability: tool.durability,
            effect: tool.effect,
            category: tool.category,
            purchaseDate: new Date().toLocaleString(),
            level: 1,
            experience: 0,
            favorability: 0
        };
        
        userData.mechanic.tools.push(newTool);
    
        // 获得商店积分
        const points = Math.floor(tool.price / 10);
        userData.mechanic.shop.points += points;
    
        // 检查是否触发特殊效果
        const specialEffects = this.checkToolSpecialEffects(tool, userData);
    
        // 发送可爱的购买提示
        e.reply([
            "🌟 购买成功啦！",
            "",
            `『${toolName}』加入了你的工具家族！`,
            "",
            "『工具信息』",
            `✨ 描述：${tool.description}`,
            `🎀 效果：${tool.effect}`,
            `💝 耐久度：${tool.durability}`,
            `🌈 类别：${tool.category}`,
            "",
            "『消费详情』",
            `💰 花费：${tool.price}金币`,
            `🎁 获得积分：${points}点`,
            "",
            specialEffects.length ? 
                "『特殊奖励』\n" + specialEffects.join("\n") : "",
            "",
            "要好好爱护新工具哦~",
            "记得常常保养它们呢 (◕‿◕✿)"
        ].join("\n"));
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    // 生成可爱商店展示
    generateCuteShopDisplay(shop, userData) {
        const display = ["『✨ 机械少女の梦幻工具店 ✨』"];
        
        for (const [category, tools] of Object.entries(shop)) {
            display.push(`\n🎀 ${category}:`);
            for (const [name, data] of Object.entries(tools)) {
                const canBuy = userData.mechanic.level >= data.level;
                display.push(
                    `${canBuy ? "💝" : "💭"} ${name}`,
                    `   价格: ${data.price}金币`,
                    `   简介: ${data.description}`,
                    `   效果: ${data.effect}`,
                    `   等级: ${data.level}级`,
                    `   分类: ${data.category}`
                );
            }
        }
        
        display.push(
            "\n『个人信息』",
            `💰 当前金币: ${userData.money}`,
            `🎁 商店积分: ${userData.mechanic.shop.points}`,
            `💫 会员等级: ${this.getVipLevel(userData)}`,
            "",
            "输入 #购买机械工具 工具名称 购买心仪的工具吧~",
            "今天也要元气满满哦 (◕‿◕✿)"
        );
        
        return display.join("\n");
    }

    async Sell_tools(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("呜...你现在处于小黑屋中,暂时不能出售物品哦~");
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💝 温馨提示:",
                "亲爱的,你还不是机械师呢~",
                "先使用 #成为机械师 加入我们吧!",
                "成为机械师后就能交易工具啦 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        const toolName = e.msg.replace('#出售机械工具', '').trim();
    
        // 显示背包
        if (!toolName) {
            const bagDisplay = this.generateCuteBagDisplay(userData);
            e.reply(bagDisplay);
            return;
        }
    
        // 查找要出售的工具
        const toolIndex = userData.mechanic.tools.findIndex(t => t.name === toolName);
        
        if (toolIndex === -1) {
            e.reply([
                "呜呜...找不到这个工具呢",
                "要不要先检查一下背包?",
                "使用 #出售机械工具 可以查看你的工具哦~",
                "(｡•́︿•̀｡)"
            ].join("\n"));
            return;
        }
    
        const tool = userData.mechanic.tools[toolIndex];
    
        // 计算出售价格
        const basePrice = this.calculateSellPrice(tool);
        const bonusPrice = this.calculateBonusPrice(tool, userData);
        const finalPrice = basePrice + bonusPrice;
    
        // 确认出售提示
        e.reply([
            `『确认出售 ${tool.name}』`,
            "",
            "『工具信息』",
            `✨ 等级: ${tool.level}`,
            `💝 好感度: ${tool.favorability}`,
            `🔧 耐久度: ${tool.durability}/${tool.maxDurability}`,
            "",
            "『出售价格』",
            `💰 基础价格: ${basePrice}金币`,
            `✨ 额外加成: ${bonusPrice}金币`,
            `💫 最终价格: ${finalPrice}金币`,
            "",
            "确认出售请在30秒内回复：确认",
            "取消出售请在30秒内回复：取消",
            "",
            "出售后无法恢复哦~"
        ].join("\n"));
    
        // 等待用户确认
        const confirmRes = await this.waitConfirm(e);
        if (!confirmRes) return;
    
        if (confirmRes === "确认") {
            // 执行出售
            userData.mechanic.tools.splice(toolIndex, 1);
            userData.money += finalPrice;
            
            // 计算获得的商店积分
            const points = Math.floor(finalPrice / 20);
            userData.mechanic.shop.points += points;
    
            // 检查特殊奖励
            const specialRewards = this.checkSellRewards(tool, userData);
    
            e.reply([
                "✨ 出售成功！",
                "",
                "『交易详情』",
                `💰 获得金币: ${finalPrice}`,
                `🎁 获得积分: ${points}`,
                "",
                specialRewards.length ? 
                    "『特殊奖励』\n" + specialRewards.join("\n") : "",
                "",
                "期待你购买新的可爱工具哦~ (◕‿◕✿)"
            ].join("\n"));
    
        } else {
            e.reply([
                "已取消出售啦~",
                "记得好好珍惜每一个工具哦 💝"
            ].join("\n"));
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    // 生成可爱背包展示
    generateCuteBagDisplay(userData) {
        const display = ["『✨ 机械少女の梦幻工具包 ✨』"];
        
        if (userData.mechanic.tools.length === 0) {
            display.push(
                "\n背包里还没有工具呢...",
                "去商店挑选一些可爱的工具吧！"
            );
            return display.join("\n");
        }
    
        // 按类别分类显示
        const toolsByCategory = {};
        userData.mechanic.tools.forEach(tool => {
            if (!toolsByCategory[tool.category]) {
                toolsByCategory[tool.category] = [];
            }
            toolsByCategory[tool.category].push(tool);
        });
    
        for (const [category, tools] of Object.entries(toolsByCategory)) {
            display.push(`\n🎀 ${category}:`);
            tools.forEach(tool => {
                display.push(
                    `💝 ${tool.name}`,
                    `   等级: ${tool.level}`,
                    `   好感度: ${tool.favorability}`,
                    `   耐久度: ${tool.durability}/${tool.maxDurability}`,
                    `   效果: ${tool.effect}`
                );
            });
        }
    
        display.push(
            "\n『背包信息』",
            `🎒 已使用空间: ${userData.mechanic.tools.length}`,
            `✨ 最大容量: ${this.getMaxBagSpace(userData)}`,
            "",
            "输入 #出售机械工具 工具名称 来出售工具哦~"
        );
    
        return display.join("\n");
    }
    
    // 计算基础出售价格
    calculateSellPrice(tool) {
        let price = 0;
        // 基础价格计算
        price += tool.level * 50;
        price += (tool.durability / tool.maxDurability) * 100;
        price += tool.favorability * 10;
        return Math.floor(price);
    }
    
    // 计算额外加成
    calculateBonusPrice(tool, userData) {
        let bonus = 0;
        // VIP加成
        if (userData.mechanic.shop.vipLevel > 0) {
            bonus += tool.level * 10;
        }
        // 好感度加成
        if (tool.favorability > 50) {
            bonus += 100;
        }
        // 稀有度加成
        if (tool.category === "限定系" || tool.category === "魔法系") {
            bonus += 200;
        }
        return Math.floor(bonus);
    }
    
    // 检查出售特殊奖励
    checkSellRewards(tool, userData) {
        const rewards = [];
        
        // 高级工具奖励
        if (tool.level >= 5) {
            rewards.push("🌟 获得称号：工具鉴赏家");
        }
        
        // 限定工具奖励
        if (tool.category === "限定系") {
            rewards.push("💫 获得特殊徽章：限定收藏家");
        }
        
        // 好感度奖励
        if (tool.favorability >= 100) {
            rewards.push("💝 获得称号：工具之友");
        }
    
        return rewards;
    }
    
    // 等待用户确认
    async waitConfirm(e) {
        let confirmed = false;
        try {
            const reply = await e.waitMessage(30000); // 等待30秒回复
            if (reply.msg === "确认" || reply.msg === "取消") {
                confirmed = reply.msg;
            }
        } catch (err) {
            e.reply("出售已超时取消啦~");
        }
        return confirmed;
    }
    
    // 获取背包最大容量
    getMaxBagSpace(userData) {
        return 10 + Math.floor(userData.mechanic.level / 2);
    }

    async Mechanic_task(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("呜...你现在在小黑屋里,暂时不能接任务哦~");
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💝 温馨提示:",
                "亲爱的,你还不是机械师呢~",
                "先使用 #成为机械师 加入我们吧!",
                "这里有超多有趣的任务等着你哦 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 任务系统
        const taskSystem = {
            日常任务: {
                "可爱音乐盒修理": {
                    type: "维修",
                    difficulty: "简单",
                    time: 10,
                    reward: {
                        exp: 20,
                        money: 100,
                        points: 5
                    },
                    description: "修理一个精致的音乐盒,让它重新播放甜美的音乐~"
                },
                "小熊玩偶医生": {
                    type: "维修",
                    difficulty: "简单",
                    time: 15,
                    reward: {
                        exp: 25,
                        money: 120,
                        points: 6
                    },
                    description: "为破损的玩具熊进行修补,让它重获新生！"
                }
            },
            进阶任务: {
                "梦幻投影仪维护": {
                    type: "维护",
                    difficulty: "中等",
                    time: 20,
                    reward: {
                        exp: 40,
                        money: 200,
                        points: 10
                    },
                    description: "调试星空投影仪,让它投射出更美丽的星空~"
                },
                "彩虹喷泉修复": {
                    type: "修复",
                    difficulty: "中等",
                    time: 25,
                    reward: {
                        exp: 45,
                        money: 220,
                        points: 11
                    },
                    description: "修复七彩喷泉,让它重新绽放绚丽的色彩！"
                }
            },
            特殊任务: {
                "魔法八音盒": {
                    type: "特殊",
                    difficulty: "困难",
                    time: 30,
                    reward: {
                        exp: 80,
                        money: 400,
                        points: 20,
                        special: "魔法碎片"
                    },
                    description: "修复一个具有魔法力量的八音盒,它可能会带来惊喜~"
                }
            }
        };
    
        // 检查当前任务状态
        if (userData.mechanic.currentTask) {
            const taskStatus = this.checkTaskStatus(userData.mechanic.currentTask);
            e.reply(taskStatus);
            return;
        }
    
        // 显示可接任务列表
        const taskList = this.generateTaskList(taskSystem, userData);
        e.reply(taskList);
    
        // 等待用户选择任务
        const selectResult = await this.waitTaskSelect(e, taskSystem);
        if (!selectResult) return;
    
        // 开始任务
        const task = this.findTask(taskSystem, selectResult);
        if (!task) {
            e.reply("找不到这个任务呢,要不要试试其他任务?");
            return;
        }
    
        // 检查接任务条件
        if (!this.checkTaskRequirements(task, userData)) {
            e.reply([
                "暂时还不能接这个任务哦~",
                "需要先提升等级或者收集更多工具呢",
                "继续加油吧! ⭐"
            ].join("\n"));
            return;
        }
    
        // 开始执行任务
        userData.mechanic.currentTask = {
            name: selectResult,
            startTime: Date.now(),
            type: task.type,
            difficulty: task.difficulty,
            reward: task.reward,
            progress: 0
        };
    
        e.reply([
            "✨ 接受任务成功!",
            "",
            "『任务信息』",
            `任务名称: ${selectResult}`,
            `任务类型: ${task.type}`,
            `难度等级: ${task.difficulty}`,
            `预计用时: ${task.time}分钟`,
            "",
            "『任务描述』",
            task.description,
            "",
            "『预期奖励』",
            `经验值: ${task.reward.exp}`,
            `金币: ${task.reward.money}`,
            `积分: ${task.reward.points}`,
            task.reward.special ? `特殊奖励: ${task.reward.special}` : "",
            "",
            "加油完成任务吧! (◕‿◕✿)"
        ].join("\n"));
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    // 生成任务列表
    generateTaskList(taskSystem, userData) {
        const list = ["『✨ 机械少女の任务板 ✨』"];
        
        for (const [category, tasks] of Object.entries(taskSystem)) {
            list.push(`\n🎀 ${category}:`);
            for (const [name, data] of Object.entries(tasks)) {
                const available = this.checkTaskRequirements(data, userData);
                list.push(
                    `${available ? "💝" : "💭"} ${name}`,
                    `   类型: ${data.type}`,
                    `   难度: ${data.difficulty}`,
                    `   用时: ${data.time}分钟`,
                    `   描述: ${data.description}`
                );
            }
        }
        
        list.push(
            "\n『任务说明』",
            "1. 每次只能进行一个任务",
            "2. 任务完成后可获得奖励",
            "3. 高难度任务有特殊奖励",
            "",
            "输入任务名称来接受任务吧~"
        );
        
        return list.join("\n");
    }
    
    // 等待任务选择
    async waitTaskSelect(e, taskSystem) {
        try {
            const reply = await e.waitMessage(30000); // 等待30秒回复
            if (this.findTask(taskSystem, reply.msg)) {
                return reply.msg;
            }
            e.reply("没有找到这个任务呢,要不要看看其他任务?");
        } catch (err) {
            e.reply("任务选择已超时,可以重新查看任务列表哦~");
        }
        return null;
    }
    
    // 查找任务
    findTask(taskSystem, name) {
        for (const category of Object.values(taskSystem)) {
            if (category[name]) return category[name];
        }
        return null;
    }
    
    // 检查任务状态
    checkTaskStatus(currentTask) {
        const elapsedTime = (Date.now() - currentTask.startTime) / 1000 / 60; // 转换为分钟
        const progress = Math.min(100, Math.floor((elapsedTime / currentTask.time) * 100));
        
        return [
            "『当前任务进度』",
            `任务名称: ${currentTask.name}`,
            `任务类型: ${currentTask.type}`,
            `难度等级: ${currentTask.difficulty}`,
            `完成进度: ${progress}%`,
            "",
            progress >= 100 ? 
                "任务已完成,快去领取奖励吧!" :
                `还需要继续努力哦~ 剩余${Math.ceil(currentTask.time - elapsedTime)}分钟`
        ].join("\n");
    }
    
    // 检查任务要求
    checkTaskRequirements(task, userData) {
        // 根据任务难度检查等级要求
        const levelRequirements = {
            "简单": 1,
            "中等": 3,
            "困难": 5
        };
        
        return userData.mechanic.level >= levelRequirements[task.difficulty];
    }

    async Mechanic_achievement(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("呜...你现在在小黑屋里,暂时不能查看成就哦~");
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💝 温馨提示:",
                "亲爱的,你还不是机械师呢~",
                "先使用 #成为机械师 加入我们吧!",
                "这里有好多有趣的成就等着你解锁呢 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 成就系统
        const achievementSystem = {
            "新手成就": {
                "初出茅庐": {
                    description: "完成第一次维修",
                    reward: {
                        exp: 50,
                        title: "见习机械师"
                    },
                    condition: user => user.mechanic.achievements.tasksCompleted >= 1
                },
                "工具收藏家": {
                    description: "收集5种不同的工具",
                    reward: {
                        exp: 100,
                        title: "小小收藏家"
                    },
                    condition: user => Array.isArray(user.mechanic.tools) && new Set(user.mechanic.tools.map(t => t.name)).size >= 5
                }
            },
            "进阶成就": {
                "维修达人": {
                    description: "维修成功率达到80%",
                    reward: {
                        exp: 200,
                        title: "维修专家"
                    },
                    condition: user => user.mechanic.growth.successRate >= 0.8
                },
                "受欢迎的机械师": {
                    description: "工作室人气值达到1000",
                    reward: {
                        exp: 300,
                        title: "人气机械师"
                    },
                    condition: user => user.mechanic.workshop.popularity >= 1000
                }
            },
            "特殊成就": {
                "魔法机械师": {
                    description: "完成10次魔法道具维修",
                    reward: {
                        exp: 500,
                        title: "魔法机械师",
                        special: "魔法工具箱"
                    },
                    condition: user => user.mechanic.achievements.magicRepairs >= 10
                },
                "梦想成真": {
                    description: "工作室等级达到最高级",
                    reward: {
                        exp: 1000,
                        title: "梦想机械师",
                        special: "梦幻工作台"
                    },
                    condition: user => user.mechanic.workshop.level >= 10
                }
            }
        };
    
        // 检查并更新成就
        const achievementStatus = this.checkAchievements(userData, achievementSystem);
    
        // 生成成就报告
        const achievementReport = [
            "『✨ 机械少女の成就册 ✨』",
            "",
            "『已获得的成就』"
        ];
    
        let hasUnlockedNew = false;
    
        for (const [category, achievements] of Object.entries(achievementSystem)) {
            achievementReport.push(`\n🎀 ${category}:`);
            
            for (const [name, data] of Object.entries(achievements)) {
                const status = achievementStatus[name];
                const isNew = status.justUnlocked;
                
                if (status.unlocked) {
                    hasUnlockedNew = hasUnlockedNew || isNew;
                    achievementReport.push(
                        `${isNew ? "💫" : "💝"} ${name}`,
                        `   描述: ${data.description}`,
                        `   奖励: ${this.formatReward(data.reward)}`,
                        isNew ? "   ✨ 新解锁! ✨" : ""
                    );
                } else {
                    achievementReport.push(
                        `💭 ${name} (未解锁)`,
                        `   描述: ${data.description}`,
                        `   进度: ${this.calculateProgress(userData, data)}%`
                    );
                }
            }
        }
    
        // 添加统计信息
        achievementReport.push(
            "\n『成就统计』",
            `总成就数: ${Object.keys(achievementStatus).length}`,
            `已解锁: ${Object.values(achievementStatus).filter(s => s.unlocked).length}`,
            `完成度: ${this.calculateTotalProgress(achievementStatus)}%`,
            "",
            hasUnlockedNew ? "🎉 恭喜解锁新成就! 记得领取奖励哦~" : "继续加油解锁更多成就吧! ⭐"
        );
    
        e.reply(achievementReport.join("\n"));
    
        // 如果有新解锁的成就,保存更新
        if (hasUnlockedNew) {
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
        }
    }
    
    // 检查成就完成状态
    checkAchievements(userData, achievementSystem) {
        // 若 achievements 尚未初始化，则赋予一个空对象
        if (!userData.mechanic.achievements) {
            userData.mechanic.achievements = {};
        }
        const status = {};
        for (const [category, achievements] of Object.entries(achievementSystem)) {
            for (const [name, data] of Object.entries(achievements)) {
                const wasUnlocked = userData.mechanic.achievements[name]?.unlocked || false;
                const isUnlocked = typeof data.condition === 'function' && data.condition(userData);
                status[name] = {
                    unlocked: isUnlocked,
                    justUnlocked: isUnlocked && !wasUnlocked
                };
                if (status[name].justUnlocked) {
                    // 更新用户数据
                    userData.mechanic.achievements[name] = {
                        unlocked: true,
                        unlockTime: Date.now()
                    };
                    // 发放奖励
                    this.grantAchievementReward(userData, data.reward);
                }
            }
        }
        return status;
    }
    
    // 计算成就进度
    calculateProgress(userData, achievement) {
        // 根据不同成就类型计算进度
        const progress = achievement.condition(userData);
        return Math.min(100, Math.floor(progress * 100));
    }
    
    // 计算总进度
    calculateTotalProgress(achievementStatus) {
        const total = Object.keys(achievementStatus).length;
        const completed = Object.values(achievementStatus)
            .filter(s => s.unlocked).length;
        return Math.floor((completed / total) * 100);
    }
    
    // 格式化奖励显示
    formatReward(reward) {
        const rewards = [];
        if (reward.exp) rewards.push(`经验+${reward.exp}`);
        if (reward.title) rewards.push(`称号「${reward.title}」`);
        if (reward.special) rewards.push(`特殊奖励「${reward.special}」`);
        return rewards.join(", ");
    }
    
    // 发放成就奖励
    grantAchievementReward(userData, reward) {
        if (reward.exp) {
            userData.mechanic.experience += reward.exp;
        }
        if (reward.title) {
            userData.mechanic.titles = userData.mechanic.titles || [];
            userData.mechanic.titles.push(reward.title);
        }
        if (reward.special) {
            userData.mechanic.specialItems = userData.mechanic.specialItems || [];
            userData.mechanic.specialItems.push(reward.special);
        }
    }

    async  Learn_new_skill(e) {
        try {
          // 获取用户 ID 与消息
          const userId = e.user_id;
          
          // 从数据库和 Redis 获取用户数据
          const userData = await checkUserData(userId);
          const redisDataStr = await redis.get(`user:${userId}`);
          let redisUserData;
          try {
            redisUserData = JSON.parse(redisDataStr);
          } catch (err) {
            // 如果 Redis 数据解析异常，视为数据异常，执行封禁处理
            await this.banPlayer(userId, e);
            return;
          }
          
          // 检查是否处于封禁期
          const banUntil = await redis.get(`ban:${userId}`);
          if (banUntil && Date.now() < parseInt(banUntil, 10)) {
            e.reply("呜...你现在在小黑屋里不能学习新技能呢~");
            return;
          }
          
          // 比较数据库数据与 Redis 数据是否一致，如不一致则封禁用户
          if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
          }
          
          // 检查是否为机械师
          if (userData.job !== "机械师") {
            e.reply([
              "💝 甜心提醒:",
              "你还不是机械师哦~",
              "先用 #成为机械师 加入我们的温馨小家庭吧!",
              "这里有好多可爱的技能等着你来学习呢 (◕‿◕✿)"
            ].join("\n"));
            return;
          }
          
          // 初始化机械师数据（如果尚未初始化）
          if (!userData.mechanic) {
            userData.mechanic = {
              experience: 0,
              skills: {}
            };
          }
          
          // 定义萌萌哒技能系统
          const cuteSkillSystem = {
            "新手小课堂": {
              "温柔维修术": {
                description: "用爱心修理每一个物品~",
                maxLevel: 5,
                baseCost: 100,
                requirements: {
                  level: 1,
                  tools: ["可爱工具套装"]
                },
                effects: level => ({
                  "维修成功率": 5 * level,
                  "好感度提升": 2 * level
                })
              },
              "轻松维修法": {
                description: "让维修变得轻松愉快~",
                maxLevel: 5,
                baseCost: 120,
                requirements: {
                  level: 2,
                  tools: ["基础工具组"]
                },
                effects: level => ({
                  "维修时间减少": 10 * level,
                  "体力消耗减少": 5 * level
                })
              }
            },
            "进阶小课程": {
              "梦幻改装术": {
                description: "为物品添加梦幻般的效果✨",
                maxLevel: 3,
                baseCost: 300,
                requirements: {
                  level: 5,
                  skills: ["温柔维修术:3"]
                },
                effects: level => ({
                  "特殊效果几率": 20 * level,
                  "额外奖励": 20 * level
                })
              },
              "甜心节能术": {
                description: "让维修更加节省体力呢~",
                maxLevel: 4,
                baseCost: 250,
                requirements: {
                  level: 4,
                  skills: ["轻松维修法:2"]
                },
                effects: level => ({
                  "体力节省": 15 * level,
                  "工作效率": 8 * level
                })
              }
            },
            "魔法小教室": {
              "魔法改造术": {
                description: "用魔法的力量改造物品~",
                maxLevel: 2,
                baseCost: 500,
                requirements: {
                  level: 8,
                  skills: ["梦幻改装术:2"],
                  special: "魔法水晶"
                },
                effects: level => ({
                  "魔法效果": 30 * level,
                  "特殊能力": "解锁魔法改造"
                })
              }
            }
          };
          
          // 从消息中提取技能名称（去掉命令前缀）
          const skillName = e.msg.replace('#学习新技能', '').trim();
          
          // 如果未指定技能名称，则显示全部技能列表
          if (!skillName) {
            const skillList = this.generateCuteSkillList(cuteSkillSystem, userData);
            e.reply(skillList);
            return;
          }
          
          // 查找用户想要学习的技能
          const skill = this.findCuteSkill(cuteSkillSystem, skillName);
          if (!skill) {
            e.reply([
              "呜呜...找不到这个技能呢",
              "要不要看看其他可爱的技能呀?",
              "输入 #学习新技能 就能看到全部技能表哦~ (◕ᴗ◕✿)"
            ].join("\n"));
            return;
          }
          
          // 检查技能学习的前置条件
          const checkResult = this.checkSkillLearningRequirements(skill, userData);
          if (!checkResult.canLearn) {
            e.reply([
              "还不能学习这个技能哦~",
              "",
              "『未达成的小目标』",
              ...checkResult.reasons.map(reason => `🌟 ${reason}`),
              "",
              "继续加油吧,相信很快就能学会了呢! ⭐"
            ].join("\n"));
            return;
          }
          
          // 获取当前技能等级（若尚未学习则默认为 0）并检查是否已达最高等级
          const currentLevel = (userData.mechanic.skills[skillName] && userData.mechanic.skills[skillName].level) || 0;
          if (currentLevel >= skill.maxLevel) {
            e.reply([
              "哇!这个技能已经学到最高等级啦!",
              "真是太厉害了呢 (◕‿◕✿)",
              "要不要试试学习其他可爱的技能呀~"
            ].join("\n"));
            return;
          }
          
          // 计算升级所需消耗的经验值
          const cost = Math.floor(skill.baseCost * (1 + currentLevel * 0.5));
          if (userData.mechanic.experience < cost) {
            e.reply([
              "呜...经验值不够呢",
              `需要 ${cost} 点经验值`,
              `当前经验值: ${userData.mechanic.experience}`,
              "",
              "继续加油做任务积累经验吧!",
              "相信很快就能学会新技能了呢 ⭐"
            ].join("\n"));
            return;
          }
          
          // 扣除经验并更新技能等级与学习时间
          userData.mechanic.experience -= cost;
          if (!userData.mechanic.skills[skillName]) {
            userData.mechanic.skills[skillName] = { level: 0, learnTime: null };
          }
          userData.mechanic.skills[skillName].level += 1;
          userData.mechanic.skills[skillName].learnTime = Date.now();
          
          // 计算技能效果和特殊奖励
          const effects = skill.effects(userData.mechanic.skills[skillName].level);
          const specialEffects = this.calculateSpecialEffects(skill, userData);
          
          // 发送学习成功提示
          e.reply([
            "✨ 叮咚!新技能学习成功啦! ✨",
            "",
            "『技能信息』",
            `🎀 技能名称: ${skillName}`,
            `💝 当前等级: ${userData.mechanic.skills[skillName].level}/${skill.maxLevel}`,
            `💫 消耗经验: ${cost}`,
            "",
            "『技能效果』",
            ...Object.entries(effects).map(([key, value]) => `🌟 ${key}: +${value}`),
            "",
            specialEffects.length ? "『特殊奖励』\n" + specialEffects.map(effect => `🎁 ${effect}`).join("\n") : "",
            "",
            "记得多多练习新学会的技能哦~",
            "期待你的成长呢! (◕‿◕✿)"
          ].join("\n"));
          
          // 更新 Redis 缓存及持久化保存用户数据
          await redis.set(`user:${userId}`, JSON.stringify(userData));
          await saveUserData(userId, userData);
          
        } catch (error) {
          console.error("学习技能时发生错误:", error);
          e.reply("学习技能时发生错误，请稍后重试。");
        }
      }

      async Show_tool_list(e) {
        // 基础检查
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 封禁检查
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你现在处于小黑屋中,暂时无法查看工具哦~");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        // 职业检查
        if (userData.job !== "机械师") {
            e.reply([
                "💝 温馨提示:",
                "你还不是机械师哦~",
                "快用 #成为机械师 加入我们吧!",
                "这里有好多可爱的工具等着你呢 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 确保工具数组存在
        if (!Array.isArray(userData.mechanic.tools)) {
            userData.mechanic.tools = [];
        }
    
        // 生成工具展示信息
        const display = [
            "『✨ 机械少女の工具仓库 ✨』",
            "",
            "『仓库状态』",
            `🎒 背包容量: ${userData.mechanic.tools.length}/${this.getMaxBagSpace(userData)}`,
            `💰 工具总价值: ${this.calculateToolsValue(userData.mechanic.tools)}金币`,
            `🔧 工具总数: ${userData.mechanic.tools.length}个`,
            ""
        ];
    
        // 按类别整理工具
        const toolsByCategory = {
            "日常工具": [],
            "特殊工具": [],
            "限定工具": [],
            "魔法工具": []
        };
    
        // 分类整理工具
        userData.mechanic.tools.forEach(tool => {
            if (tool && tool.category) {
                const category = toolsByCategory[tool.category] || toolsByCategory["日常工具"];
                category.push(tool);
            }
        });
    
        // 展示各类工具
        for (const [category, tools] of Object.entries(toolsByCategory)) {
            if (tools.length > 0) {
                display.push(`『${category}』`);
                tools.forEach(tool => {
                    display.push(
                        `${this.getToolIcon(tool)} ${tool.name}`,
                        `  ├ 等级: ${tool.level || 1}`,
                        `  ├ 耐久度: ${tool.durability || 0}/${tool.maxDurability || 100}`,
                        `  ├ 品质: ${this.getToolQuality(tool)}`,
                        tool.effect ? `  ├ 效果: ${tool.effect}` : "",
                        tool.specialEffect ? `  └ 特殊效果: ${tool.specialEffect}` : "  └─────",
                        ""
                    );
                });
            }
        }
    
        // 添加维护提醒
        const needRepair = userData.mechanic.tools.filter(t => 
            t && t.durability < t.maxDurability * 0.3
        );
        if (needRepair.length > 0) {
            display.push(
                "『维护提醒』",
                ...needRepair.map(tool => 
                    `💡 ${tool.name} 需要保养了哦~ (耐久度: ${tool.durability}/${tool.maxDurability})`
                ),
                ""
            );
        }
    
        // 添加功能提示
        display.push(
            "『相关功能』",
            "🛠️ #购买机械工具 - 购买新工具",
            "🔧 #修理设备 - 使用工具维修",
            "💝 #出售机械工具 - 出售工具",
            "✨ #工具保养 - 保养工具",
            "",
            "记得爱护你的小工具们哦~ (◕‿◕✿)"
        );
    
        e.reply(display.join("\n"));
    }
    getToolIcon(tool) {
        const icons = {
            "日常工具": "🔧",
            "特殊工具": "✨",
            "限定工具": "💫",
            "魔法工具": "🌟"
        };
        return icons[tool.category] || "🔨";
    }
    
   // 计算工具品质
getToolQuality(tool) {
    const durabilityRate = tool.durability / tool.maxDurability;
    if (durabilityRate > 0.8) return "完美 ✨";
    if (durabilityRate > 0.6) return "良好 💫";
    if (durabilityRate > 0.4) return "普通 💭";
    if (durabilityRate > 0.2) return "受损 💢";
    return "破损 ⚠️";
}
    
    // 计算工具总价值
calculateToolsValue(tools) {
    if (!Array.isArray(tools)) return 0;
    return tools.reduce((total, tool) => {
        if (!tool) return total;
        let value = tool.baseValue || 100;
        // 计算品质加成
        value *= (tool.durability / tool.maxDurability);
        // 计算等级加成
        value *= (1 + (tool.level - 1) * 0.2);
        // 稀有度加成
        if (tool.rarity === "稀有") value *= 2;
        if (tool.rarity === "限定") value *= 3;
        if (tool.rarity === "魔法") value *= 5;
        return total + Math.floor(value);
    }, 0);
}
    
    // 获取背包最大容量
    getMaxBagSpace(userData) {
        return 10 + Math.floor(userData.mechanic.level / 2);
    }
    
    // 获取工具搭配建议
    getToolCombinationTips(userData) {
        const tips = [];
        const tools = userData.mechanic.tools;
    
        // 基础工具组合检查
        if (!tools.some(t => t.category === "日常")) {
            tips.push("建议购买一些日常工具,会让维修更轻松哦~");
        }
    
        // 特殊工具组合检查
        if (userData.mechanic.level >= 5 && !tools.some(t => t.category === "特殊")) {
            tips.push("已经可以使用特殊工具啦,去商店看看吧~");
        }
    
        // 稀有工具提醒
        if (userData.mechanic.level >= 10 && !tools.some(t => t.category === "魔法")) {
            tips.push("等级够高啦,可以尝试获得魔法工具呢!");
        }
    
        return tips;
    }

    async Show_skill_list(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("呜呜~你现在在小黑屋里不能查看技能呢,等待解除后再来吧~");
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💝 贴心提示:",
                "亲爱的还不是机械师哦~",
                "快用 #成为机械师 加入我们吧!",
                "这里有超多有趣的技能等着你来学习呢 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 萌萌哒技能系统
        const cuteSkillSystem = {
            "初级可爱技能": {
                icon: "🌸",
                skills: [
                    {
                        name: "温柔维修",
                        level: userData.mechanic.skills.basicRepair || 0,
                        maxLevel: 5,
                        description: "用爱心修理每一个物品",
                        effect: level => `维修成功率+${level * 5}%`
                    },
                    {
                        name: "轻松保养",
                        level: userData.mechanic.skills.easyMaintain || 0,
                        maxLevel: 5,
                        description: "让保养变得轻松愉快",
                        effect: level => `保养效率+${level * 8}%`
                    }
                ]
            },
            "进阶甜心技能": {
                icon: "🎀",
                skills: [
                    {
                        name: "梦幻改装",
                        level: userData.mechanic.skills.dreamRemodel || 0,
                        maxLevel: 3,
                        description: "为物品添加梦幻效果",
                        effect: level => `特效触发率+${level * 10}%`
                    },
                    {
                        name: "节能维护",
                        level: userData.mechanic.skills.staminaSave || 0,
                        maxLevel: 4,
                        description: "降低体力消耗哦",
                        effect: level => `体力消耗-${level * 15}%`
                    }
                ]
            },
            "魔法闪耀技能": {
                icon: "✨",
                skills: [
                    {
                        name: "魔法改造",
                        level: userData.mechanic.skills.magicReform || 0,
                        maxLevel: 2,
                        description: "注入神秘的魔法力量",
                        effect: level => `魔法效果+${level * 25}%`
                    }
                ]
            }
        };
    
        // 生成技能展示列表
        const skillDisplay = [
            "『✨ 机械少女の技能手册 ✨』",
            "",
            "『个人状态』",
            `💖 当前等级: ${userData.mechanic.level}`,
            `💫 技能点数: ${this.getSkillPoints(userData)}`,
            `🌟 已学技能: ${this.getLearnedSkillCount(userData)}个`,
            ""
        ];
    
        // 展示各类技能
        for (const [category, data] of Object.entries(cuteSkillSystem)) {
            skillDisplay.push(`${data.icon} ${category}:`);
            data.skills.forEach(skill => {
                const isMax = skill.level >= skill.maxLevel;
                skillDisplay.push(
                    `${this.getSkillStateIcon(skill)} ${skill.name}`,
                    `   等级: ${skill.level}/${skill.maxLevel}`,
                    `   描述: ${skill.description}`,
                    `   效果: ${skill.effect(skill.level)}`,
                    isMax ? "   💝 已达到最高等级啦~" : "",
                    ""
                );
            });
        }
    
        // 添加技能组合提示
        const combos = this.getSkillCombos(userData);
        if (combos.length > 0) {
            skillDisplay.push(
                "『技能组合』",
                ...combos.map(combo => `💫 ${combo}`),
                ""
            );
        }
    
        // 添加技能推荐
        const recommendations = this.getSkillRecommendations(userData);
        if (recommendations.length > 0) {
            skillDisplay.push(
                "『贴心建议』",
                ...recommendations.map(tip => `💭 ${tip}`),
                ""
            );
        }
    
        // 添加使用指南
        skillDisplay.push(
            "『温馨提示』",
            "🎀 想学习新技能? 使用 #学习新技能",
            "💝 想升级技能? 使用 #升级技能",
            "✨ 想重置技能? 使用 #重置技能",
            "",
            "要努力提升技能等级哦~ (◕‿◕✿)"
        );
    
        e.reply(skillDisplay.join("\n"));
    }
    
    // 获取技能状态图标
    getSkillStateIcon(skill) {
        if (skill.level >= skill.maxLevel) return "💝"; // 满级
        if (skill.level > skill.maxLevel * 0.7) return "💗"; // 熟练
        if (skill.level > skill.maxLevel * 0.3) return "💓"; // 进阶
        if (skill.level > 0) return "💕"; // 初学
        return "💭"; // 未学习
    }
    
    // 计算可用技能点
    getSkillPoints(userData) {
        const totalPoints = Math.floor(userData.mechanic.level * 1.5);
        const usedPoints = Object.values(userData.mechanic.skills)
            .reduce((sum, level) => sum + level, 0);
        return totalPoints - usedPoints;
    }
    
    // 获取已学技能数量
    getLearnedSkillCount(userData) {
        return Object.values(userData.mechanic.skills)
            .filter(level => level > 0).length;
    }
    
    // 获取技能组合效果
    getSkillCombos(userData) {
        const combos = [];
        const skills = userData.mechanic.skills;
    
        // 检查各种技能组合
        if (skills.basicRepair >= 3 && skills.easyMaintain >= 2) {
            combos.push("基础精通: 维修效率提升20%");
        }
        if (skills.dreamRemodel >= 2 && skills.magicReform >= 1) {
            combos.push("魔法改装: 解锁特殊改装效果");
        }
        if (skills.staminaSave >= 3 && skills.basicRepair >= 4) {
            combos.push("完美工匠: 工具耐久消耗降低30%");
        }
    
        return combos;
    }
    
    // 获取技能推荐
    getSkillRecommendations(userData) {
        const tips = [];
        const skills = userData.mechanic.skills;
    
        // 基于当前等级和技能情况给出建议
        if (!skills.basicRepair) {
            tips.push("建议先学习温柔维修哦,这是最基础的技能呢~");
        }
        if (userData.mechanic.level >= 5 && !skills.dreamRemodel) {
            tips.push("已经可以学习梦幻改装啦,试试看吧!");
        }
        if (skills.basicRepair >= 3 && !skills.easyMaintain) {
            tips.push("可以学习轻松保养来配合温柔维修呢~");
        }
    
        return tips;
    }

    async Upgrade_mechanic_level(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("呜呜~你现在在小黑屋里不能升级呢,等待解除后再来吧~");
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💝 贴心提示:",
                "亲爱的还不是机械师哦~",
                "快用 #成为机械师 加入我们吧!",
                "这里有超多可爱的等级奖励等着你呢 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 等级系统
        const levelSystem = {
            maxLevel: 50,
            expNeeded: level => level * 1000 + Math.pow(level, 2) * 100,
            rewards: {
                // 普通等级奖励
                normal: level => ({
                    skillPoints: 1,
                    money: level * 200,
                    bagSpace: Math.floor(level / 5)
                }),
                // 特殊等级奖励
                special: {
                    5: {
                        title: "见习机械师",
                        tool: "粉色工具套装",
                        effect: "维修效率+10%"
                    },
                    10: {
                        title: "初级机械师",
                        tool: "彩虹工具箱",
                        effect: "工具耐久+20%"
                    },
                    20: {
                        title: "高级机械师",
                        tool: "魔法工具组",
                        effect: "特效触发+15%"
                    }
                }
            }
        };
    
        const currentLevel = userData.mechanic.level;
        const currentExp = userData.mechanic.experience;
    
        // 检查是否达到最高等级
        if (currentLevel >= levelSystem.maxLevel) {
            e.reply([
                "✨ 哇哦!你已经是最厉害的机械师啦!",
                "真是太棒了呢~ (◕‿◕✿)",
                "",
                "『当前状态』",
                `💝 等级: ${currentLevel}(最高级)`,
                `💫 称号: ${this.getHighestTitle(userData)}`,
                `🌟 总经验: ${currentExp}`
            ].join("\n"));
            return;
        }
    
        // 计算升级所需经验
        const expNeeded = levelSystem.expNeeded(currentLevel);
        
        if (currentExp < expNeeded) {
            e.reply([
                "还差一点点经验就能升级啦~",
                "",
                "『升级信息』",
                `💫 当前等级: ${currentLevel}`,
                `💝 当前经验: ${currentExp}`,
                `✨ 升级还需: ${expNeeded - currentExp}经验`,
                "",
                "继续加油做任务积累经验吧! (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 升级处理
        userData.mechanic.level += 1;
        userData.mechanic.experience -= expNeeded;
    
        // 获取升级奖励
        const normalRewards = levelSystem.rewards.normal(userData.mechanic.level);
        const specialRewards = levelSystem.rewards.special[userData.mechanic.level];
    
        // 应用奖励
        userData.mechanic.skillPoints = (userData.mechanic.skillPoints || 0) + normalRewards.skillPoints;
        userData.money += normalRewards.money;
        userData.mechanic.bagSpace = (userData.mechanic.bagSpace || 10) + normalRewards.bagSpace;
    
        // 生成升级提示
        const levelUpMsg = [
            "✨ 叮咚!等级提升啦! ✨",
            "",
            "『等级信息』",
            `🌟 等级: ${currentLevel} → ${userData.mechanic.level}`,
            `💝 经验: ${userData.mechanic.experience}/${levelSystem.expNeeded(userData.mechanic.level)}`,
            "",
            "『获得奖励』",
            `💫 技能点: +${normalRewards.skillPoints}`,
            `💰 金币: +${normalRewards.money}`,
            `🎒 背包扩展: +${normalRewards.bagSpace}格`
        ];
    
        // 添加特殊奖励信息
        if (specialRewards) {
            levelUpMsg.push(
                "",
                "『特殊奖励』",
                `🎀 称号: ${specialRewards.title}`,
                `🛠️ 工具: ${specialRewards.tool}`,
                `✨ 特效: ${specialRewards.effect}`
            );
    
            // 添加特殊奖励到用户数据
            userData.mechanic.titles = userData.mechanic.titles || [];
            userData.mechanic.titles.push(specialRewards.title);
            userData.mechanic.tools.push({
                name: specialRewards.tool,
                effect: specialRewards.effect,
                durability: 100,
                maxDurability: 100,
                level: 1
            });
        }
    
        // 添加成长提示
        levelUpMsg.push(
            "",
            "『成长提示』",
            ...this.getLevelUpTips(userData.mechanic.level)
        );
    
        e.reply(levelUpMsg.join("\n"));
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    // 获取最高称号
    getHighestTitle(userData) {
        if (!userData.mechanic.titles || userData.mechanic.titles.length === 0) {
            return "新手机械师";
        }
        return userData.mechanic.titles[userData.mechanic.titles.length - 1];
    }
    
    // 获取升级提示
    getLevelUpTips(level) {
        const tips = [];
        
        if (level === 5) {
            tips.push(
                "💝 解锁进阶维修功能",
                "💫 可以接取更多任务啦"
            );
        }
        if (level === 10) {
            tips.push(
                "✨ 解锁特殊改装功能",
                "🌟 可以使用稀有工具啦"
            );
        }
        if (level === 20) {
            tips.push(
                "🎀 解锁魔法改造功能",
                "💫 工作室可以升级啦"
            );
        }
    
        return tips;
    }

    async Conduct_mechanical_research(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("呜呜~你现在在小黑屋里不能进行研究呢,等待解除后再来吧~");
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💝 贴心提示:",
                "亲爱的还不是机械师哦~",
                "快用 #成为机械师 加入我们吧!",
                "这里有超多有趣的研究项目等着你呢 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 研究系统
        const researchSystem = {
            "基础研究": {
                "可爱工具改良": {
                    description: "研究如何让工具更可爱",
                    duration: 30, // 分钟
                    cost: {
                        stamina: 20,
                        materials: ["基础零件", "粉色涂料"]
                    },
                    rewards: {
                        exp: 100,
                        blueprint: "粉色工具设计图",
                        effect: "工具可爱度+10%"
                    }
                },
                "节能维修法": {
                    description: "研究更省力的维修方式",
                    duration: 45,
                    cost: {
                        stamina: 30,
                        materials: ["能量晶石", "导能材料"]
                    },
                    rewards: {
                        exp: 150,
                        blueprint: "节能维修手册",
                        effect: "体力消耗-15%"
                    }
                }
            },
            "进阶研究": {
                "梦幻改装术": {
                    description: "研究如何赋予物品梦幻效果",
                    duration: 60,
                    cost: {
                        stamina: 50,
                        materials: ["魔法碎片", "彩虹宝石"]
                    },
                    rewards: {
                        exp: 300,
                        blueprint: "梦幻改装秘籍",
                        effect: "特效触发+20%"
                    }
                }
            },
            "特殊研究": {
                "魔法工具开发": {
                    description: "开发具有魔法效果的工具",
                    duration: 120,
                    cost: {
                        stamina: 100,
                        materials: ["魔法核心", "星光精华"]
                    },
                    rewards: {
                        exp: 500,
                        blueprint: "魔法工具图纸",
                        effect: "解锁魔法工具制作"
                    }
                }
            }
        };
    
        // 检查当前研究状态
        if (userData.mechanic.currentResearch) {
            const researchStatus = this.checkResearchStatus(userData.mechanic.currentResearch);
            e.reply(researchStatus);
            return;
        }
    
        // 显示可研究项目
        const researchList = this.generateResearchList(researchSystem, userData);
        e.reply(researchList);
    
        // 等待用户选择研究项目
        const selectResult = await this.waitResearchSelect(e, researchSystem);
        if (!selectResult) return;
    
        // 开始研究
        const research = this.findResearch(researchSystem, selectResult);
        if (!research) {
            e.reply("找不到这个研究项目呢,要不要看看其他项目?");
            return;
        }
    
        // 检查研究条件
        if (!this.checkResearchRequirements(research, userData)) {
            e.reply([
                "暂时还不能开始这个研究哦~",
                "需要先准备好材料和充足的体力呢",
                "继续努力收集材料吧! ⭐"
            ].join("\n"));
            return;
        }
    
        // 开始研究项目
        userData.mechanic.currentResearch = {
            name: selectResult,
            startTime: Date.now(),
            duration: research.duration,
            rewards: research.rewards
        };
    
        // 扣除材料和体力
        userData.mechanic.stamina -= research.cost.stamina;
        research.cost.materials.forEach(material => {
            const index = userData.mechanic.materials.indexOf(material);
            if (index > -1) {
                userData.mechanic.materials.splice(index, 1);
            }
        });
    
        e.reply([
            "✨ 开始研究啦!",
            "",
            "『研究项目』",
            `项目名称: ${selectResult}`,
            `预计用时: ${research.duration}分钟`,
            "",
            "『消耗材料』",
            ...research.cost.materials.map(m => `🎀 ${m}`),
            `💫 体力: ${research.cost.stamina}`,
            "",
            "『预期收获』",
            `经验: ${research.rewards.exp}`,
            `图纸: ${research.rewards.blueprint}`,
            `效果: ${research.rewards.effect}`,
            "",
            "要耐心等待研究完成哦~ (◕‿◕✿)"
        ].join("\n"));
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Show_research_results(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply([
                "哎呀~你现在还在小黑屋里呢",
                "暂时不能查看研究笔记哦",
                "等待解除后再来看看吧~"
            ].join("\n"));
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💝 甜心提示:",
                "你还不是机械师哦~",
                "先使用 #成为机械师 加入我们的大家庭吧!",
                "这里有好多有趣的研究等着你来探索呢 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 研究笔记本系统
        const researchNotes = {
            "小可爱的日常研究": {
                icon: "🌸",
                type: "日常",
                notes: []
            },
            "闪亮亮的进阶研究": {
                icon: "✨",
                type: "进阶",
                notes: []
            },
            "梦幻般的特殊研究": {
                icon: "💫",
                type: "特殊",
                notes: []
            }
        };
    
        // 整理研究笔记
        userData.mechanic.researchResults.forEach(result => {
            for (const category of Object.values(researchNotes)) {
                if (result.type === category.type) {
                    category.notes.push(result);
                }
            }
        });
    
        // 生成研究报告
        const report = [
            "『✨ 机械少女の研究笔记本 ✨』",
            "",
            "『个人研究档案』",
            `💝 研究次数: ${userData.mechanic.researchResults.length}次`,
            `🎀 研究等级: ${this.getResearchRank(userData)}`,
            `💫 成功率: ${this.getSuccessRate(userData)}%`,
            `🌟 研究积分: ${userData.mechanic.researchPoints || 0}`,
            ""
        ];
    
        // 展示正在进行的研究
        if (userData.mechanic.currentResearch) {
            const current = userData.mechanic.currentResearch;
            report.push(
                "『当前研究进度』",
                `🔬 项目名称: ${current.name}`,
                `📝 研究进度: ${this.getResearchProgress(current)}%`,
                `⏰ 预计剩余: ${this.getRemainTime(current)}`,
                `💕 预期成果: ${current.expectedResult}`,
                ""
            );
        }
    
        // 展示各类研究成果
        for (const [categoryName, category] of Object.entries(researchNotes)) {
            if (category.notes.length > 0) {
                report.push(`${category.icon} ${categoryName}:`);
                category.notes.forEach(note => {
                    report.push(
                        `${this.getQualityEmoji(note.quality)} ${note.name}`,
                        `   完成时间: ${this.formatTime(note.completeTime)}`,
                        `   研究成果: ${note.description}`,
                        `   实用价值: ${this.getStars(note.value)}`,
                        note.specialEffect ? `   特殊效果: ${note.specialEffect}` : "",
                        ""
                    );
                });
            }
        }
    
        // 展示研究成就
        const achievements = this.getResearchAchievements(userData);
        if (achievements.length > 0) {
            report.push(
                "『研究成就』",
                ...achievements.map(a => `🏆 ${a.name}: ${a.description}`),
                ""
            );
        }
    
        // 添加温馨提示
        report.push(
            "『温馨小贴士』",
            "🎀 记得每天都要进行研究哦~",
            "💝 研究成功可以获得特殊奖励呢",
            "✨ 高品质研究可以获得额外积分",
            "💫 收集稀有材料可以进行特殊研究",
            "",
            "加油!期待你的新发现哦~ (◕‿◕✿)"
        );
    
        e.reply(report.join("\n"));
    }
    
    // 获取研究等级称号
    getResearchRank(userData) {
        const count = userData.mechanic.researchResults.length;
        const ranks = [
            {count: 50, title: "研究大师"},
            {count: 30, title: "高级研究员"},
            {count: 15, title: "研究专家"},
            {count: 5, title: "见习研究员"},
            {count: 0, title: "研究新手"}
        ];
        
        return ranks.find(r => count >= r.count)?.title || "研究新手";
    }
    
    // 获取品质对应表情
    getQualityEmoji(quality) {
        const emojis = [
            {min: 95, emoji: "💝"},  // 完美
            {min: 80, emoji: "💖"},  // 优秀
            {min: 60, emoji: "💗"},  // 良好
            {min: 0, emoji: "💓"}    // 普通
        ];
        
        return emojis.find(e => quality >= e.min)?.emoji || "💓";
    }
    
    // 格式化时间
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes()}`;
    }
    
    // 获取星级显示
    getStars(value) {
        return "⭐".repeat(Math.min(5, Math.floor(value / 20))) || "未评定";
    }

    async Accept_mysterious_task(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply([
                "呜呜~你现在还在小黑屋里呢",
                "暂时不能接受神秘任务哦",
                "等待解除后再来探索吧~"
            ].join("\n"));
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💝 温馨提示:",
                "你还不是机械师哦~",
                "先使用 #成为机械师 加入我们吧!",
                "这里有好多神秘有趣的任务等着你呢 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 神秘任务系统
        const mysteriousSystem = {
            "日常神秘": {
                "魔法音乐盒修复": {
                    difficulty: "简单",
                    time: 30,
                    description: "修复一个会播放神秘音乐的音乐盒",
                    requirements: {
                        level: 3,
                        tools: ["基础工具组"],
                        materials: ["魔法碎片"]
                    },
                    rewards: {
                        exp: 100,
                        money: 300,
                        items: ["神秘音乐碎片"]
                    }
                },
                "彩虹喷泉维护": {
                    difficulty: "中等",
                    time: 45,
                    description: "维护一个能喷出彩虹的魔法喷泉",
                    requirements: {
                        level: 5,
                        tools: ["进阶工具组"],
                        materials: ["彩虹水晶"]
                    },
                    rewards: {
                        exp: 200,
                        money: 500,
                        items: ["彩虹精华"]
                    }
                }
            },
            "特殊神秘": {
                "星光望远镜修理": {
                    difficulty: "困难",
                    time: 60,
                    description: "修理一个能看到星星精灵的望远镜",
                    requirements: {
                        level: 8,
                        tools: ["魔法工具组"],
                        materials: ["星光结晶"]
                    },
                    rewards: {
                        exp: 400,
                        money: 1000,
                        items: ["星光精灵的祝福"]
                    }
                }
            }
        };
    
        // 检查当前任务状态
        if (userData.mechanic.currentMysteriousTask) {
            const taskStatus = this.checkMysteriousTaskStatus(userData.mechanic.currentMysteriousTask);
            e.reply(taskStatus);
            return;
        }
    
        // 生成可接任务列表
        const taskList = [
            "『✨ 今日神秘任务 ✨』",
            "",
            "『可接任务列表』"
        ];
    
        // 随机选择三个可接的任务
        const availableTasks = this.getAvailableMysteriousTasks(mysteriousSystem, userData);
        const selectedTasks = this.randomSelectTasks(availableTasks, 3);
    
        selectedTasks.forEach((task, index) => {
            taskList.push(
                `${index + 1}. ${task.name}`,
                `   💫 难度: ${task.difficulty}`,
                `   ⏰ 时间: ${task.time}分钟`,
                `   📝 描述: ${task.description}`,
                `   🎁 奖励: ${this.formatRewards(task.rewards)}`,
                ""
            );
        });
    
        taskList.push(
            "『接受方式』",
            "输入任务编号(1-3)接受对应任务",
            "",
            "『温馨提示』",
            "🎀 神秘任务每天都会更新哦",
            "💝 完成任务可获得特殊奖励",
            "✨ 高难度任务有额外惊喜"
        );
    
        e.reply(taskList.join("\n"));
    
        // 等待用户选择任务
        const choice = await this.waitTaskChoice(e);
        if (!choice || choice < 1 || choice > selectedTasks.length) {
            e.reply("呜呜~没有选择任务呢,下次再来试试吧~");
            return;
        }
    
        const selectedTask = selectedTasks[choice - 1];
    
        // 检查接受条件
        const checkResult = this.checkTaskRequirements(selectedTask, userData);
        if (!checkResult.canAccept) {
            e.reply([
                "还不能接受这个任务哦~",
                "",
                "『未满足条件』",
                ...checkResult.reasons.map(reason => `💭 ${reason}`),
                "",
                "继续努力提升自己吧! ⭐"
            ].join("\n"));
            return;
        }
    
        // 接受任务
        userData.mechanic.currentMysteriousTask = {
            name: selectedTask.name,
            startTime: Date.now(),
            duration: selectedTask.time * 60 * 1000,
            rewards: selectedTask.rewards,
            difficulty: selectedTask.difficulty
        };
    
        e.reply([
            "✨ 接受神秘任务成功! ✨",
            "",
            "『任务信息』",
            `🎀 任务名称: ${selectedTask.name}`,
            `💫 任务难度: ${selectedTask.difficulty}`,
            `⏰ 任务时间: ${selectedTask.time}分钟`,
            "",
            "『任务目标』",
            selectedTask.description,
            "",
            "『预期奖励』",
            this.formatRewards(selectedTask.rewards),
            "",
            "加油完成任务吧~ (◕‿◕✿)"
        ].join("\n"));
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Complete_mysterious_task(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply([
                "呜呜~你现在还在小黑屋里呢",
                "暂时不能完成神秘任务哦",
                "等待解除后再来吧~ (。・﹏・。)"
            ].join("\n"));
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💝 贴心提示:",
                "亲爱的还不是机械师哦~",
                "先使用 #成为机械师 加入我们吧!",
                "然后再来完成神秘任务呢 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 检查是否有进行中的神秘任务
        if (!userData.mechanic.currentMysteriousTask) {
            e.reply([
                "诶?你还没有接受神秘任务呢~",
                "使用 #接受神秘任务 来接取一个吧!",
                "期待你的冒险哦 ✨"
            ].join("\n"));
            return;
        }
    
        const task = userData.mechanic.currentMysteriousTask;
        const currentTime = Date.now();
        const startTime = task.startTime;
        const duration = task.duration;
    
        // 检查任务是否已完成时间
        if (currentTime - startTime < duration) {
            const remainingTime = Math.ceil((duration - (currentTime - startTime)) / 1000 / 60);
            e.reply([
                "任务还在进行中呢~",
                "",
                "『当前进度』",
                `🎀 任务名称: ${task.name}`,
                `⏰ 剩余时间: ${remainingTime}分钟`,
                `💫 任务难度: ${task.difficulty}`,
                "",
                "要耐心等待哦~ (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 计算任务完成质量
        const quality = this.calculateTaskQuality(userData, task);
        const rewards = this.calculateRewards(task, quality);
        const specialRewards = this.getSpecialRewards(task, quality);
    
        // 清除当前任务
        userData.mechanic.currentMysteriousTask = null;
    
        // 更新用户数据
        userData.mechanic.experience += rewards.exp;
        userData.money += rewards.money;
        userData.mechanic.mysteriousTasksCompleted = 
            (userData.mechanic.mysteriousTasksCompleted || 0) + 1;
    
        // 添加物品奖励
        rewards.items.forEach(item => {
            userData.mechanic.items = userData.mechanic.items || [];
            userData.mechanic.items.push(item);
        });
    
        // 发送完成提示
        const completionMsg = [
            "✨ 神秘任务完成啦! ✨",
            "",
            "『任务评价』",
            `🌟 完成质量: ${this.getQualityText(quality)}`,
            `💫 任务表现: ${this.getPerformanceText(quality)}`,
            "",
            "『获得奖励』",
            `💝 经验值: +${rewards.exp}`,
            `💰 金币: +${rewards.money}`,
            rewards.items.map(item => `🎁 获得: ${item}`).join("\n"),
            "",
            specialRewards.length ? [
                "『特殊奖励』",
                ...specialRewards.map(reward => `✨ ${reward}`)
            ].join("\n") : "",
            "",
            "『成长记录』",
            `已完成神秘任务: ${userData.mechanic.mysteriousTasksCompleted}个`,
            this.getAchievementProgress(userData),
            "",
            "继续加油哦~ (◕‿◕✿)"
        ].join("\n");
    
        e.reply(completionMsg);
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    // 计算任务完成质量
    calculateTaskQuality(userData, task) {
        let baseQuality = 0.7; // 基础完成度
    
        // 等级加成
        baseQuality += Math.min(0.1, userData.mechanic.level * 0.01);
    
        // 技能加成
        if (userData.mechanic.skills.mysteriousCraft) {
            baseQuality += userData.mechanic.skills.mysteriousCraft * 0.05;
        }
    
        // 工具加成
        const hasRequiredTools = this.checkRequiredTools(userData, task);
        if (hasRequiredTools) {
            baseQuality += 0.1;
        }
    
        // 随机波动
        baseQuality += (Math.random() * 0.1) - 0.05;
    
        return Math.min(1, Math.max(0, baseQuality));
    }
    
    // 获取质量评价文本
    getQualityText(quality) {
        if (quality >= 0.9) return "完美✨";
        if (quality >= 0.8) return "优秀💫";
        if (quality >= 0.7) return "良好💝";
        if (quality >= 0.6) return "一般💭";
        return "基础🎀";
    }
    
    // 获取表现评价文本
    getPerformanceText(quality) {
        if (quality >= 0.9) return "太棒啦!你是最棒的机械师!";
        if (quality >= 0.8) return "表现得非常出色呢!";
        if (quality >= 0.7) return "完成得很好哦~";
        if (quality >= 0.6) return "还不错,继续加油!";
        return "已经很努力啦,下次会更好的~";
    }
    
    // 获取成就进度
    getAchievementProgress(userData) {
        const completed = userData.mechanic.mysteriousTasksCompleted;
        const nextAchievement = this.getNextAchievement(completed);
        
        if (nextAchievement) {
            return `距离下个成就还需完成${nextAchievement.required - completed}个任务`;
        }
        return "已获得所有成就啦!";
    }

    async Check_ban_status(e) {
        const userId = e.user_id;
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply(`你已被封禁，封禁到${new Date(parseInt(banUntil)).toLocaleString()}。`);
        } else {
            e.reply("你当前没有被封禁。");
        }
    }

    async Show_user_ranking(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("呜呜~你现在在小黑屋里不能查看排行榜呢~");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        // 获取所有机械师数据
        const allUsers = await loadAllUsers() || {}; // 确保 allUsers 是一个对象
        const mechanicUsers = Object.values(allUsers).filter(user =>
            user.job === "机械师" &&
            user.mechanic && user.mechanic.achievements
        );
        // 排行榜系统
        const rankingSystem = {
            "等级排行": {
                icon: "✨",
                sort: (a, b) => b.mechanic.level - a.mechanic.level,
                format: user => ({
                    value: user.mechanic.level,
                    extra: `经验: ${user.mechanic.experience}`
                })
            },
            "成就排行": {
                icon: "🎀",
                sort: (a, b) => this.countAchievements(b) - this.countAchievements(a),
                format: user => ({
                    value: this.countAchievements(user),
                    extra: `完成度: ${this.getAchievementRate(user)}%`
                })
            },
            "技能排行": {
                icon: "💫",
                sort: (a, b) => this.getTotalSkillLevel(b) - this.getTotalSkillLevel(a),
                format: user => ({
                    value: this.getTotalSkillLevel(user),
                    extra: `最高技能: ${this.getHighestSkill(user)}`
                })
            },
            "人气排行": {
                icon: "💝",
                sort: (a, b) => b.mechanic.workshop.popularity - a.mechanic.workshop.popularity,
                format: user => ({
                    value: user.mechanic.workshop.popularity,
                    extra: `工作室: ${user.mechanic.workshop.name}`
                })
            }
        };
        // 生成排行榜显示
        const rankingDisplay = ["『✨ 机械少女の闪耀排行榜 ✨』", ""];
        // 显示用户自己的排名
        const userRanks = {};
        for (const [category, data] of Object.entries(rankingSystem)) {
            const sortedUsers = [...mechanicUsers].sort(data.sort);
            const userRank = sortedUsers.findIndex(u => u.user_id === userId) + 1;
            userRanks[category] = userRank;
        }
        rankingDisplay.push(
            "『我的排名』",
            ...Object.entries(userRanks).map(([category, rank]) => 
                `${rankingSystem[category].icon} ${category}: 第${rank}名`
            ),
            ""
        );
        // 显示各类排行榜
        for (const [category, data] of Object.entries(rankingSystem)) {
            const sortedUsers = [...mechanicUsers].sort(data.sort).slice(0, 5);
            rankingDisplay.push(
                `『${data.icon} ${category}』`
            );
            sortedUsers.forEach((user, index) => {
                const formatted = data.format(user);
                rankingDisplay.push(
                    `${this.getRankIcon(index + 1)} 第${index + 1}名: ${user.nickname || '机械师'}`,
                    `   ${formatted.value} | ${formatted.extra}`
                );
            });
            rankingDisplay.push("");
        }
        // 添加鼓励信息
        rankingDisplay.push(
            "『小贴士』",
            "💝 要继续加油提升等级哦~",
            "🎀 完成更多成就获得奖励~",
            "✨ 提升技能让自己变得更强~",
            "💫 装扮工作室吸引更多顾客~",
            "",
            "期待你登上排行榜顶端呢! (◕‿◕✿)"
        );
        e.reply(rankingDisplay.join("\n"));
    }
    
    // 获取排名图标
    getRankIcon(rank) {
        const icons = {
            1: "👑",
            2: "🥈",
            3: "🥉",
            4: "✨",
            5: "💫"
        };
        return icons[rank] || "🎀";
    }

    
    // 计算成就完成率
    getAchievementRate(user) {
        const achievements = (user.mechanic && user.mechanic.achievements) || {};
    const total = Object.keys(achievements).length;
    if (total === 0) return 0;
    const completed = this.countAchievements(user);
    return Math.floor((completed / total) * 100);
    }
    
    // 计算总技能等级
    getTotalSkillLevel(user) {
        return Object.values(user.mechanic.skills)
            .reduce((sum, skill) => sum + skill.level, 0);
    }
    
    // 获取最高等级技能
    getHighestSkill(user) {
        const skills = Object.entries(user.mechanic.skills);
        if (skills.length === 0) return "无";
        
        const highestSkill = skills.reduce((highest, current) => 
            current[1].level > highest[1].level ? current : highest
        );
        
        return `${highestSkill[0]} Lv.${highestSkill[1].level}`;
    }
    async Repair_robot(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        // 基础检查
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply([
                "🎀 小提示:",
                "哎呀~你现在在小黑屋里呢",
                "暂时不能修理机器人小可爱们",
                "等待解除后再来找我们玩吧~ (。·︿·。)"
            ].join("\n"));
            return;
        }
    
        // 机器人种类
        const robotTypes = {
            "生活小帮手": {
                "清洁小精灵": {
                    level: 1,
                    description: "擅长打扫的小可爱",
                    personality: "认真负责",
                    materials: ["基础零件", "清洁模块"],
                    difficulty: "简单",
                    rewards: {
                        exp: 100,
                        money: 150,
                        friendship: 10
                    }
                },
                "烹饪小助手": {
                    level: 2,
                    description: "会做美食的小甜心",
                    personality: "温柔体贴",
                    materials: ["厨艺模块", "能源核心"],
                    difficulty: "普通",
                    rewards: {
                        exp: 150,
                        money: 200,
                        friendship: 15
                    }
                }
            },
            "娱乐小伙伴": {
                "音乐小天使": {
                    level: 3,
                    description: "能歌善舞的小歌手",
                    personality: "活泼开朗",
                    materials: ["音乐芯片", "舞蹈模块"],
                    difficulty: "中等",
                    rewards: {
                        exp: 200,
                        money: 300,
                        friendship: 20
                    }
                },
                "游戏小精灵": {
                    level: 4,
                    description: "擅长玩游戏的开心果",
                    personality: "俏皮可爱",
                    materials: ["游戏模块", "互动芯片"],
                    difficulty: "较难",
                    rewards: {
                        exp: 250,
                        money: 400,
                        friendship: 25
                    }
                }
            },
            "特殊小天才": {
                "治愈小天使": {
                    level: 5,
                    description: "会治愈心灵的暖心宝贝",
                    personality: "温暖治愈",
                    materials: ["治愈水晶", "魔法核心"],
                    difficulty: "困难",
                    rewards: {
                        exp: 500,
                        money: 800,
                        friendship: 50,
                        special: "治愈光芒"
                    }
                }
            }
        };
    
        // 检查维修状态
        if (userData.mechanic.currentRepair) {
            const status = this.checkRepairStatus(userData);
            e.reply(status);
            return;
        }
    
        // 显示机器人列表
        const robotList = [
            "『✨ 机器人维修小屋 ✨』",
            "",
            "『维修师状态』",
            `💝 等级: ${userData.mechanic.level}`,
            `💫 体力: ${userData.mechanic.stamina}/100`,
            `🌟 维修经验: ${userData.mechanic.repairExp || 0}`,
            `💖 机器人好感度: ${userData.mechanic.robotFriendship || 0}`,
            "",
            "『可修理的机器人』"
        ];
    
        // 展示机器人信息
        for (const [category, robots] of Object.entries(robotTypes)) {
            robotList.push(`\n🎀 ${category}:`);
            for (const [name, data] of Object.entries(robots)) {
                const canRepair = userData.mechanic.level >= data.level;
                const statusIcon = canRepair ? "💖" : "💭";
                
                robotList.push(
                    `${statusIcon} ${name}`,
                    `   性格: ${data.personality}`,
                    `   描述: ${data.description}`,
                    `   难度: ${data.difficulty}`,
                    `   需求等级: ${data.level}`,
                    `   所需材料: ${data.materials.join("、")}`,
                    `   奖励经验: ${data.rewards.exp}`,
                    data.rewards.special ? `   特殊奖励: ${data.rewards.special}` : "",
                    ""
                );
            }
        }
    
        // 添加互动提示
        robotList.push(
            "『互动指南』",
            "🎀 输入机器人名称开始修理",
            "💝 修理时可以和机器人聊天",
            "✨ 提高好感度解锁特殊剧情",
            "💫 累计维修次数获得成就",
            "",
            "来选择一个想要修理的小可爱吧~ (◕‿◕✿)"
        );
    
        e.reply(robotList.join("\n"));
    
        // 等待用户选择
        const robotChoice = await this.waitRobotChoice(e);
        if (!robotChoice) return;
    
        // 开始修理流程
        await this.startRepairProcess(e, userData, robotChoice, robotTypes);
    }
    
    // 等待用户选择
   // 等待用户选择机器人（等待30秒回复）
async waitRobotChoice(e) {
    try {
      const reply = await e.waitMessage(30000); // 等待30秒（30000毫秒）
      if (!reply) return null;
      return reply.msg.trim();
    } catch (err) {
      e.reply("等待超时了呢,可以重新选择哦~");
      return null;
    }
  }
    
    // 开始修理流程
    async startRepairProcess(e, userData, robotName, robotTypes) {
        // 增加 userId 定义，解决未定义问题
        const userId = e.user_id;
    
        // 查找选择的机器人
        let selectedRobot = null;
        let robotCategory = "";
        for (const [category, robots] of Object.entries(robotTypes)) {
            if (robots[robotName]) {
                selectedRobot = robots[robotName];
                robotCategory = category;
                break;
            }
        }
        if (!selectedRobot) {
            e.reply("找不到这个机器人呢,要不要看看其他的小可爱?");
            return;
        }
        // 检查等级要求
        if (userData.mechanic.level < selectedRobot.level) {
            e.reply([
                "哎呀~等级还不够呢",
                `需要达到 ${selectedRobot.level} 级才能修理这个小可爱`,
                "继续努力升级吧! ⭐"
            ].join("\n"));
            return;
        }
        // 检查所需材料是否齐全
        const hasMaterials = this.checkRepairMaterials(userData, selectedRobot.materials);
        if (!hasMaterials) {
            e.reply([
                "材料不足呢...",
                "需要以下材料:",
                ...selectedRobot.materials.map(m => `💭 ${m}`),
                "",
                "去收集一下材料吧~"
            ].join("\n"));
            return;
        }
        // 开始修理流程，记录当前修理状态
        userData.mechanic.currentRepair = {
            robotName: robotName,
            category: robotCategory,
            startTime: Date.now(),
            materials: selectedRobot.materials,
            rewards: selectedRobot.rewards
        };
        e.reply([
            `✨ 开始修理 ${robotName} ✨`,
            "",
            "『修理信息』",
            `机器人: ${robotName}`,
            `类型: ${robotCategory}`,
            `性格: ${selectedRobot.personality}`,
            "",
            "『温馨提示』",
            "修理过程中可以和机器人互动哦",
            "增加好感度会获得特殊奖励呢",
            "",
            "让我们开始吧~ (◕‿◕✿)"
        ].join("\n"));
        // 保存更新后的用户数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Attend_mechanical_forum(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply([
                "💝 小贴士:",
                "哎呀~你现在还在小黑屋里呢",
                "暂时不能参加论坛活动哦",
                "等待解除后再来玩吧~(。・ω・。)"
            ].join("\n"));
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💝 温馨提示:",
                "还不是机械师哦~",
                "先用 #成为机械师 加入我们吧!",
                "论坛里有好多可爱的小伙伴等着你呢 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 甜心论坛活动系统
        const cuteForumSystem = {
            "每日小课堂": {
                "维修心得交流会": {
                    type: "交流",
                    time: 30,
                    stamina: 10,
                    rewards: {
                        exp: 100,
                        points: 50,
                        items: ["可爱贴纸", "心形便签"]
                    },
                    topics: [
                        "今天修好了什么呢?",
                        "最喜欢的工具是什么?",
                        "遇到过什么有趣的事情?"
                    ]
                },
                "小可爱装扮展": {
                    type: "展示",
                    time: 20,
                    stamina: 8,
                    rewards: {
                        exp: 80,
                        points: 40,
                        items: ["蝴蝶结发饰", "粉色工具包"]
                    },
                    topics: [
                        "今日穿搭分享",
                        "工具装饰技巧",
                        "工作室布置秘诀"
                    ]
                }
            },
            "特别活动": {
                "机械师下午茶": {
                    type: "社交",
                    time: 45,
                    stamina: 15,
                    rewards: {
                        exp: 150,
                        points: 100,
                        items: ["精美茶具", "甜心点心"]
                    },
                    features: [
                        "分享趣味故事",
                        "品尝美味点心",
                        "交换维修心得"
                    ]
                },
                "魔法工具研讨会": {
                    type: "学习",
                    time: 60,
                    stamina: 20,
                    rewards: {
                        exp: 200,
                        points: 150,
                        items: ["魔法笔记本", "星光工具"]
                    },
                    topics: [
                        "魔法工具使用技巧",
                        "特殊效果研究",
                        "新型材料应用"
                    ]
                }
            }
        };
    
        // 检查体力值
        if (userData.mechanic.stamina < 10) {
            e.reply([
                "呜呜~体力不够啦",
                "先去休息一下吧",
                `当前体力: ${userData.mechanic.stamina}/100`,
                "",
                "喝杯奶茶补充能量吧! ⭐"
            ].join("\n"));
            return;
        }
    
        // 生成可爱的论坛界面
        const forumDisplay = [
            "『✨ 机械少女の温馨论坛 ✨』",
            "",
            "『个人信息』",
            `🎀 论坛等级: ${this.getForumLevel(userData)}`,
            `💝 活跃度: ${this.getActivityPoints(userData)}`,
            `💫 好感度: ${this.getFriendshipPoints(userData)}`,
            `🌟 成长值: ${this.getGrowthPoints(userData)}`,
            ""
        ];
    
        // 展示活动列表
        for (const [category, activities] of Object.entries(cuteForumSystem)) {
            forumDisplay.push(`💖 ${category}:`);
            for (const [name, data] of Object.entries(activities)) {
                forumDisplay.push(
                    `   ${this.getActivityIcon(data.type)} ${name}`,
                    `      时长: ${data.time}分钟`,
                    `      体力: ${data.stamina}`,
                    `      奖励:`,
                    `         经验 +${data.rewards.exp}`,
                    `         积分 +${data.rewards.points}`,
                    `         礼物: ${data.rewards.items.join("、")}`,
                    "",
                    `      今日话题:`,
                    ...data.topics?.map(t => `         ✨ ${t}`) || 
                    data.features?.map(f => `         🌟 ${f}`),
                    ""
                );
            }
        }
    
        // 添加温馨提示
        forumDisplay.push(
            "『参与指南』",
            "🎀 输入活动名称即可参加",
            "💝 活动中可以和小伙伴互动",
            "✨ 记得签到获取奖励哦",
            "💫 累积活跃度解锁更多惊喜",
            "",
            "来选择一个想参加的活动吧~ (◕‿◕✿)"
        );
    
        e.reply(forumDisplay.join("\n"));
    
        // 等待用户选择活动
        const selectResult = await this.waitForumSelect(e, cuteForumSystem);
        if (!selectResult) return;
    
        // 开始参与活动
        await this.startForumActivity(e, userData, selectResult, cuteForumSystem);
    }
    
    async Show_forum_records(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
    
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("呜呜~你现在在小黑屋里不能查看记录呢,等待解除后再来吧~");
            return;
        }
    
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
    
        if (userData.job !== "机械师") {
            e.reply([
                "💝 贴心提示:",
                "亲爱的还不是机械师哦~",
                "快用 #成为机械师 加入我们吧!",
                "这里记录着每个机械师的成长历程呢 (◕‿◕✿)"
            ].join("\n"));
            return;
        }
    
        // 初始化论坛记录
        userData.mechanic.forum = userData.mechanic.forum || {
            activityRecords: [],
            achievementRecords: [],
            friendshipRecords: [],
            contributionRecords: []
        };
    
        // 生成记录展示
        const recordDisplay = [
            "『✨ 机械少女の论坛记录册 ✨』",
            "",
            "『个人信息』",
            `🎀 论坛等级: ${this.getForumLevel(userData)}`,
            `💫 活跃天数: ${this.getActiveDays(userData)}天`,
            `💝 好感度: ${this.getFriendshipPoints(userData)}`,
            `🌟 成长值: ${this.getGrowthPoints(userData)}`,
            ""
        ];
    
        // 展示活动记录
        const activityRecords = this.formatActivityRecords(userData);
        if (activityRecords.length > 0) {
            recordDisplay.push(
                "『近期活动记录』",
                ...activityRecords,
                ""
            );
        }
    
        // 展示成就记录
        const achievementRecords = this.formatAchievementRecords(userData);
        if (achievementRecords.length > 0) {
            recordDisplay.push(
                "『论坛成就记录』",
                ...achievementRecords,
                ""
            );
        }
    
        // 展示好友互动记录
        const friendshipRecords = this.formatFriendshipRecords(userData);
        if (friendshipRecords.length > 0) {
            recordDisplay.push(
                "『好友互动记录』",
                ...friendshipRecords,
                ""
            );
        }
    
        // 展示贡献记录
        const contributionRecords = this.formatContributionRecords(userData);
        if (contributionRecords.length > 0) {
            recordDisplay.push(
                "『论坛贡献记录』",
                ...contributionRecords,
                ""
            );
        }
    
        // 添加统计信息
        recordDisplay.push(
            "『活动统计』",
            `总参与活动: ${this.getTotalActivities(userData)}次`,
            `获得成就: ${this.getTotalAchievements(userData)}个`,
            `互动次数: ${this.getTotalInteractions(userData)}次`,
            `贡献积分: ${this.getTotalContributions(userData)}分`,
            ""
        );
    
        // 添加温馨提示
        recordDisplay.push(
            "『温馨提示』",
            "🎀 每天参与活动可以获得额外奖励",
            "💝 与好友互动可以提升好感度",
            "✨ 论坛贡献可以解锁特殊道具",
            "💫 记得常来看看论坛动态哦~",
            "",
            "今天也要开开心心地玩耍呢 (◕‿◕✿)"
        );
    
        e.reply(recordDisplay.join("\n"));
    }
    
    // 获取活跃天数
    getActiveDays(userData) {
        const firstActivity = userData.mechanic.forum.activityRecords[0];
        if (!firstActivity) return 0;
        
        const daysPassed = Math.floor(
            (Date.now() - new Date(firstActivity.time).getTime()) / 
            (24 * 60 * 60 * 1000)
        );
        return daysPassed + 1;
    }
    
    // 格式化活动记录
    formatActivityRecords(userData) {
        return userData.mechanic.forum.activityRecords
            .slice(-5) // 最近5条记录
            .map(record => {
                const date = new Date(record.time);
                return `${this.getActivityIcon(record.type)} ${record.name} ` +
                       `[${date.getMonth()+1}月${date.getDate()}日]`;
            });
    }
    
    // 格式化成就记录
    formatAchievementRecords(userData) {
        return userData.mechanic.forum.achievementRecords
            .slice(-5)
            .map(record => 
                `🏆 ${record.name} - ${record.description}`
            );
    }
    
    // 格式化好友互动记录
    formatFriendshipRecords(userData) {
        return userData.mechanic.forum.friendshipRecords
            .slice(-5)
            .map(record => {
                const date = new Date(record.time);
                return `💕 与 ${record.friendName} ${record.action} ` +
                       `[${date.getMonth()+1}月${date.getDate()}日]`;
            });
    }
    
    // 格式化贡献记录
    formatContributionRecords(userData) {
        return userData.mechanic.forum.contributionRecords
            .slice(-5)
            .map(record => 
                `📝 ${record.action} +${record.points}分`
            );
    }
    
    // 获取总活动次数
    getTotalActivities(userData) {
        return userData.mechanic.forum.activityRecords.length;
    }
    
    // 获取总成就数
    getTotalAchievements(userData) {
        return userData.mechanic.forum.achievementRecords.length;
    }
    
    // 获取总互动次数
    getTotalInteractions(userData) {
        return userData.mechanic.forum.friendshipRecords.length;
    }
    
    // 获取总贡献分
    getTotalContributions(userData) {
        return userData.mechanic.forum.contributionRecords
            .reduce((sum, record) => sum + record.points, 0);
    }

    async banPlayer(userId, e) {
        const userData = await checkUserData(userId);
        if (!userData) return false;
        const banDays = Math.floor(Math.random() * (180 - 7 + 1)) + 7;
        const banUntil = Date.now() + banDays * 24 * 60 * 60 * 1000;
        const banData = { userId, banUntil };
        try {
            await saveBanData(banData);
            e.reply(`用户${userId}因为游戏作弊已被封禁${banDays}天，封禁到${new Date(banUntil).toLocaleString()}，如属误封请联系机器人管理员或者等待自动解除。`);
        } catch (error) {
            console.error("保存封禁信息时出错:", error);
            e.reply("封禁用户时发生错误，请管理员手动封禁该用户。");
        }
    }
    getForumLevel(userData) {
        const activityPoints = this.getActivityPoints(userData);
        const levels = [
            {points: 0, name: "论坛新手"},
            {points: 100, name: "活跃萌新"},
            {points: 500, name: "甜心达人"},
            {points: 1000, name: "论坛红人"},
            {points: 2000, name: "魅力之星"}
        ];
        
        for (let i = levels.length - 1; i >= 0; i--) {
            if (activityPoints >= levels[i].points) {
                return levels[i].name;
            }
        }
        return "论坛新手";
    }
    
    // 获取活跃度
    getActivityPoints(userData) {
        return userData.mechanic.forum?.activityPoints || 0;
    }
    
    // 获取好感度
    getFriendshipPoints(userData) {
        return userData.mechanic.forum?.friendshipPoints || 0;
    }
    
    // 获取成长值
    getGrowthPoints(userData) {
        return userData.mechanic.forum?.growthPoints || 0;
    }
    
    // 获取活动图标
    getActivityIcon(type) {
        const icons = {
            "交流": "💭",
            "展示": "🎀",
            "社交": "💝",
            "学习": "📚"
        };
        return icons[type] || "✨";
    }
    
    // 等待用户选择活动
    async waitForumSelect(e, forumSystem) {
        try {
            const reply = await e.waitMessage(30000); // 等待30秒
            const activity = this.findActivity(forumSystem, reply.msg);
            if (activity) {
                return reply.msg;
            }
            e.reply([
                "呜呜~没有找到这个活动呢",
                "要不要看看其他有趣的活动呀?",
                "(。・ω・。)"
            ].join("\n"));
        } catch (err) {
            e.reply("等待超时了呢,可以重新选择活动哦~");
        }
        return null;
    }
    
    // 查找活动
    findActivity(forumSystem, name) {
        for (const category of Object.values(forumSystem)) {
            if (category[name]) return category[name];
        }
        return null;
    }
    
    // 开始论坛活动
    async startForumActivity(e, userData, activityName, forumSystem) {
        const activity = this.findActivity(forumSystem, activityName);
        if (!activity) return;
    
        // 扣除体力
        userData.mechanic.stamina -= activity.stamina;
    
        // 记录活动开始
        userData.mechanic.forum = userData.mechanic.forum || {};
        userData.mechanic.forum.currentActivity = {
            name: activityName,
            startTime: Date.now(),
            duration: activity.time
        };
    
        // 发送活动开始提示
        e.reply([
            `✨ 开始参加 ${activityName} 啦!`,
            "",
            "『活动信息』",
            `时长: ${activity.time}分钟`,
            `消耗体力: ${activity.stamina}`,
            "",
            "『活动内容』",
            ...this.generateActivityContent(activity),
            "",
            "记得积极参与互动哦~ (◕‿◕✿)"
        ].join("\n"));
    
        // 设置活动结束定时器
        setTimeout(() => {
            this.completeForumActivity(e, userData, activity);
        }, activity.time * 60 * 1000);
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    // 生成活动内容
    generateActivityContent(activity) {
        const content = [];
        if (activity.topics) {
            content.push("今日话题:");
            content.push(...activity.topics.map(t => `🌟 ${t}`));
        }
        if (activity.features) {
            content.push("活动特色:");
            content.push(...activity.features.map(f => `💫 ${f}`));
        }
        return content;
    }
    
    // 完成论坛活动
    async completeForumActivity(e, userData, activity) {
        // 计算奖励
        const rewards = this.calculateForumRewards(activity, userData);
        
        // 发放奖励
        userData.mechanic.experience += rewards.exp;
        userData.mechanic.forum.activityPoints += rewards.points;
        userData.mechanic.forum.growthPoints += rewards.growth;
        
        // 添加物品奖励
        userData.mechanic.items = userData.mechanic.items || [];
        userData.mechanic.items.push(...activity.rewards.items);
    
        // 清除当前活动
        delete userData.mechanic.forum.currentActivity;
    
        // 发送完成提示
        e.reply([
            "✨ 活动完成啦!",
            "",
            "『获得奖励』",
            `经验值: +${rewards.exp}`,
            `活跃度: +${rewards.points}`,
            `成长值: +${rewards.growth}`,
            "",
            "『获得物品』",
            ...activity.rewards.items.map(item => `🎁 ${item}`),
            "",
            this.generateForumCompletionMessage(userData),
            "",
            "要继续参加其他活动吗? (◕‿◕✿)"
        ].join("\n"));
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    // 计算论坛奖励
    calculateForumRewards(activity, userData) {
        let expBonus = 1;
        let pointsBonus = 1;
    
        // 计算各种加成
        if (userData.mechanic.forum.activityPoints > 1000) {
            expBonus += 0.2;
            pointsBonus += 0.2;
        }
        if (userData.mechanic.level >= 10) {
            expBonus += 0.1;
            pointsBonus += 0.1;
        }
    
        return {
            exp: Math.floor(activity.rewards.exp * expBonus),
            points: Math.floor(activity.rewards.points * pointsBonus),
            growth: Math.floor(activity.rewards.points / 2)
        };
    }
    
    // 生成完成消息
    generateForumCompletionMessage(userData) {
        const messages = [
            "真是太棒了!",
            "今天也是充实的一天呢~",
            "和大家一起交流真开心!",
            "收获满满呢!",
            "下次再来玩哦~"
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }
// 生成可爱的技能列表
generateCuteSkillList(skillSystem, userData) {
    const list = ["『✨ 可学习的技能列表 ✨』", ""];
    for (const [category, skills] of Object.entries(skillSystem)) {
        list.push(`🎀 ${category}:`);
        for (const [name, data] of Object.entries(skills)) {
            // 调用 checkSkillLearningRequirements 判断是否满足前置条件
            const available = this.checkSkillLearningRequirements(data, userData).canLearn;
            list.push(
                `${available ? "💝" : "💭"} ${name}`,
                `   描述: ${data.description}`,
                `   等级: ${data.maxLevel} 级`,
                `   消耗: ${data.baseCost} 经验值`,
                ""
            );
        }
    }
    list.push("\n输入 #学习新技能 技能名 来学习指定技能哦~");
    return list.join("\n");
}
  
  // 查找可爱技能
  findCuteSkill(skillSystem, name) {
    for (const category of Object.values(skillSystem)) {
      if (category[name]) return category[name];
    }
    return null;
  }
  
  // 计算技能消耗
  calculateSkillCost(skill, currentLevel) {
    return Math.floor(skill.baseCost * (1 + currentLevel * 0.5));
  }
  
  // 计算特殊效果
  calculateSpecialEffects(skill, userData) {
    const effects = [];
    if (userData.mechanic.level >= 10) {
      effects.push("技能熟练度提升");
    }
    if (skill.maxLevel > 3) {
      effects.push("解锁特殊组合效果");
    }
    return effects;
  }
  
  // 查找可爱工具
  findCuteTool(shop, name) {
    for (const category of Object.values(shop)) {
      if (category[name]) return category[name];
    }
    return null;
  }
  
  // 检查工具特殊效果
  checkToolSpecialEffects(tool, userData) {
    const effects = [];
    if (tool.category === "魔法系") {
      effects.push("解锁魔法改装能力");
    }
    if (tool.category === "限定系") {
      effects.push("获得稀有收藏家称号");
    }
    return effects;
  }
  
  // 检查修理材料
  checkRepairMaterials(userData, materials) {
    return materials.every(material => 
      userData.mechanic.materials?.includes(material)
    );
  }
  
  // 检查修理状态
  checkRepairStatus(userData) {
    if (!userData.mechanic.currentRepair) return null;
    
    const repair = userData.mechanic.currentRepair;
    const progress = Math.min(100, Math.floor(
      (Date.now() - repair.startTime) / (30 * 60 * 1000) * 100
    ));
    
    return [
      "『当前修理进度』",
      `🎀 修理对象: ${repair.robotName}`,
      `💫 修理进度: ${progress}%`,
      `✨ 预计奖励: ${repair.rewards.exp}经验`,
      "",
      "要继续加油哦~"
    ].join("\n");
  }
  
  // 获取VIP等级
  getVipLevel(userData) {
    const points = userData.mechanic.shop.points;
    if (points >= 10000) return "钻石VIP";
    if (points >= 5000) return "黄金VIP";
    if (points >= 2000) return "白银VIP";
    if (points >= 500) return "青铜VIP";
    return "普通会员";
  }
  
  // 获取下一个成就
  getNextAchievement(completed) {
    const achievements = [
      {required: 10, name: "修理新手"},
      {required: 50, name: "修理达人"},
      {required: 100, name: "修理专家"},
      {required: 500, name: "修理大师"}
    ];
    
    return achievements.find(a => completed < a.required);
  }
  
 // 检查研究要求（若 research 对象包含 level 属性则进行等级检查）
checkResearchRequirements(research, userData) {
    if (research.level && userData.mechanic.level < research.level) {
      return false;
    }
    if (!research.cost.materials.every(material => 
        userData.mechanic.materials && userData.mechanic.materials.includes(material)
    )) {
      return false;
    }
    if (userData.mechanic.stamina < research.cost.stamina) return false;
    return true;
  }
  
  // 生成研究列表
  generateResearchList(researchSystem, userData) {
    const list = ["『✨ 可研究项目列表 ✨』", ""];
    
    for (const [category, researches] of Object.entries(researchSystem)) {
      list.push(`🎀 ${category}:`);
      for (const [name, data] of Object.entries(researches)) {
        const available = this.checkResearchRequirements(data, userData);
        list.push(
          `${available ? "💝" : "💭"} ${name}`,
          `   描述: ${data.description}`,
          `   用时: ${data.duration}分钟`,
          `   消耗: ${data.cost.stamina}体力`,
          ""
        );
      }
    }
    
    return list.join("\n");
  }
  // 检查研究状态
checkResearchStatus(currentResearch) {
    if (!currentResearch) return null;
    const elapsedTime = (Date.now() - currentResearch.startTime) / (60 * 1000);
    const progress = Math.min(100, Math.floor((elapsedTime / currentResearch.duration) * 100));
    return [
      "『当前研究进度』",
      `🎀 研究项目: ${currentResearch.name}`,
      `💫 研究进度: ${progress}%`,
      `⏰ 剩余时间: ${Math.max(0, Math.ceil(currentResearch.duration - elapsedTime))}分钟`,
      "",
      "要耐心等待研究结果哦~"
    ].join("\n");
  }
  
  // 获取研究进度
  getResearchProgress(research) {
    const elapsedTime = (Date.now() - research.startTime) / (60 * 1000);
    return Math.min(100, Math.floor((elapsedTime / research.duration) * 100));
  }
  
  // 获取剩余时间
  getRemainTime(research) {
    const elapsedTime = (Date.now() - research.startTime) / (60 * 1000);
    const remainMinutes = Math.max(0, Math.ceil(research.duration - elapsedTime));
    return `${remainMinutes}分钟`;
  }
  
  // 获取成功率
  getSuccessRate(userData) {
    const total = userData.mechanic.researchResults?.length || 0;
    const success = userData.mechanic.researchResults?.filter(r => r.success)?.length || 0;
    return total ? Math.floor((success / total) * 100) : 0;
  }
  
  // 格式化奖励
  formatRewards(rewards) {
    const rewardList = [];
    if (rewards.exp) rewardList.push(`经验+${rewards.exp}`);
    if (rewards.money) rewardList.push(`金币+${rewards.money}`);
    if (rewards.points) rewardList.push(`积分+${rewards.points}`);
    if (rewards.items?.length) rewardList.push(`物品: ${rewards.items.join('、')}`);
    return rewardList.join(', ');
  }
  
  // 获取随机任务
  randomSelectTasks(tasks, count) {
    const shuffled = [...tasks].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  // 等待任务选择
  async waitTaskChoice(e) {
    try {
      const reply = await e.waitMessage(30000);
      const choice = parseInt(reply.msg);
      if (isNaN(choice) || choice < 1 || choice > 3) {
        e.reply("请选择正确的任务编号(1-3)哦~");
        return null;
      }
      return choice;
    } catch (err) {
      e.reply("等待超时了呢,可以重新选择任务哦~");
      return null;
    }
  }
  
  // 获取可用任务列表
  getAvailableMysteriousTasks(taskSystem, userData) {
    const available = [];
    for (const category of Object.values(taskSystem)) {
      for (const [name, task] of Object.entries(category)) {
        if (this.checkTaskRequirements(task, userData).canAccept) {
          available.push({ name, ...task });
        }
      }
    }
    return available;
  }
  
  // 检查任务要求
  checkTaskRequirements(task, userData) {
    const result = {
      canAccept: true,
      reasons: []
    };
  
    if (userData.mechanic.level < task.level) {
      result.canAccept = false;
      result.reasons.push(`需要等级${task.level}`);
    }
  
    if (task.requirements?.tools) {
      const hasTool = task.requirements.tools.every(tool => 
        userData.mechanic.tools.some(t => t.name === tool)
      );
      if (!hasTool) {
        result.canAccept = false;
        result.reasons.push(`需要工具: ${task.requirements.tools.join('、')}`);
      }
    }
  
    return result;
  }
  
  // 获取任务质量评价
  getQualityText(quality) {
    if (quality >= 0.9) return "完美";
    if (quality >= 0.8) return "优秀";
    if (quality >= 0.7) return "良好";
    if (quality >= 0.6) return "一般";
    return "基础";
  }
  
  // 获取任务表现评价
  getPerformanceText(quality) {
    if (quality >= 0.9) return "表现非常出色!";
    if (quality >= 0.8) return "做得很好呢!";
    if (quality >= 0.7) return "还不错哦~";
    if (quality >= 0.6) return "继续加油!";
    return "要更加努力哦~";
  }
  // 检查工具组合加成
checkToolCombinationBonus(tools) {
    let bonus = 0;
    // 基础工具组
    if (tools.filter(t => t.category === "日常").length >= 3) {
      bonus += 0.05;
    }
    // 特殊工具组
    if (tools.filter(t => t.category === "特殊").length >= 2) {
      bonus += 0.08;
    }
    // 魔法工具组
    if (tools.filter(t => t.category === "魔法").length >= 1) {
      bonus += 0.12;
    }
    return bonus;
  }
  
  // 计算技能组合效果
  calculateSkillComboEffect(skills) {
    let effect = 0;
    // 基础技能组合
    if (skills.basicRepair >= 3 && skills.easyMaintain >= 2) {
      effect += 0.1;
    }
    // 进阶技能组合
    if (skills.dreamRemodel >= 2 && skills.magicReform >= 1) {
      effect += 0.15;
    }
    return effect;
  }
  checkRequiredTools(userData, task) {
    return task.requirements.tools.every(tool => 
        userData.mechanic.tools.some(t => t.name === tool)
    );
}
calculateRewards(task, quality) {
    const baseExp = task.rewards.exp;
    const baseMoney = task.rewards.money;
    const exp = Math.floor(baseExp * quality);
    const money = Math.floor(baseMoney * quality);
    return { exp, money, items: task.rewards.items || [] };
}
getSpecialRewards(task, quality) {
    const specialRewards = [];
    if (quality >= 0.9) {
        specialRewards.push("获得稀有道具");
    }
    if (task.difficulty === "困难" && quality >= 0.8) {
        specialRewards.push("获得额外金币奖励");
    }
    return specialRewards;
}
// 检查技能升级前置条件（需要传入当前技能系统）
checkSkillUpgradeRequirements(userData, skill, skillSystem) {
    // 如果没有前置要求则直接返回 true
    if (!skill.requirements || skill.requirements.length === 0) return true;
    // 检查每个前置要求是否满足
    return skill.requirements.every(req => {
      const [reqSkillName, reqLevel] = req.split(":");
      let requiredSkill = null;
      // 在所有类别中查找对应的技能
      for (const category of Object.values(skillSystem)) {
        if (category[reqSkillName]) {
          requiredSkill = category[reqSkillName];
          break;
        }
      }
      return requiredSkill && requiredSkill.level >= parseInt(reqLevel, 10);
    });
  }
  /**
 * 检查学习新技能的前置条件
 * @param {Object} skill 技能对象（例如：{ description, maxLevel, baseCost, requirements, effects }）
 * @param {Object} userData 用户数据对象
 * @return {Object} { canLearn: boolean, reasons: string[] }
 */
checkSkillLearningRequirements(skill, userData) {
    let canLearn = true;
    let reasons = [];
    const req = skill.requirements;
    if (req) {
        // 检查等级要求
        if (req.level && userData.mechanic.level < req.level) {
            canLearn = false;
            reasons.push(`需要达到 ${req.level} 级`);
        }
        // 检查所需工具，要求用户工具背包中存在指定名称的工具
        if (req.tools && Array.isArray(req.tools)) {
            for (const tool of req.tools) {
                if (!userData.mechanic.tools.some(t => t.name === tool)) {
                    canLearn = false;
                    reasons.push(`需要工具：${tool}`);
                }
            }
        }
        // 检查其他技能要求（格式："技能名:等级"）
        if (req.skills && Array.isArray(req.skills)) {
            for (const s of req.skills) {
                const [skillName, requiredLevelStr] = s.split(":");
                const requiredLevel = parseInt(requiredLevelStr, 10);
                if (!(userData.mechanic.skills &&
                      userData.mechanic.skills[skillName] &&
                      userData.mechanic.skills[skillName].level >= requiredLevel)) {
                    canLearn = false;
                    reasons.push(`需要 ${skillName} 达到 ${requiredLevel} 级`);
                }
            }
        }
        // 检查特殊物品要求
        if (req.special) {
            if (!(userData.mechanic.specialItems && userData.mechanic.specialItems.includes(req.special))) {
                canLearn = false;
                reasons.push(`需要特殊物品：${req.special}`);
            }
        }
    }
    return { canLearn, reasons };
}
getToolAchievements(userData) {
    const achievements = [];
    const tools = userData.mechanic.tools;

    if (tools.length >= 10) {
        achievements.push("初级收藏家: 收集10个工具");
    }
    if (tools.filter(t => t.rarity === "稀有").length >= 5) {
        achievements.push("稀有收藏家: 收集5个稀有工具");
    }
    if (this.hasToolSet(tools, ["魔法扳手", "星光螺丝刀", "彩虹万用表"])) {
        achievements.push("魔法师的宝藏: 集齐魔法工具组");
    }

    return achievements;
}
hasToolSet(tools, required) {
    return required.every(name => 
        tools.some(t => t.name === name)
    );
}
getActiveToolCombos(userData) {
    const combos = [];
    const tools = userData.mechanic.tools;

    // 检查基础维修套装
    if (this.hasToolSet(tools, ["基础扳手", "小螺丝刀", "万用表"])) {
        combos.push("维修套装: 维修成功率+10%");
    }

    // 检查魔法工具组
    if (this.hasToolSet(tools, ["魔法扳手", "星光螺丝刀", "彩虹万用表"])) {
        combos.push("魔法套装: 特殊效果触发率+15%");
    }

    // 检查限定套装
    if (this.hasToolSet(tools, ["独角兽扳手", "蝴蝶结工具包", "梦幻万用表"])) {
        combos.push("限定套装: 获得经验值+20%");
    }

    return combos;
}
getToolSuggestions(userData) {
    const suggestions = [];
    
    // 检查耐久度低的工具
    const lowDurability = userData.mechanic.tools.filter(t => 
        t.durability < t.maxDurability * 0.3);
    if (lowDurability.length > 0) {
        suggestions.push(`${lowDurability.length}个工具需要保养了哦`);
    }

    // 检查是否需要升级
    const needUpgrade = userData.mechanic.tools.filter(t => 
        t.mastery >= 100 && t.level < 5);
    if (needUpgrade.length > 0) {
        suggestions.push(`${needUpgrade.length}个工具可以升级啦`);
    }

    // 检查套装搭配
    const missingTools = this.checkMissingTools(userData);
    if (missingTools.length > 0) {
        suggestions.push(`还差${missingTools.join("、")}就能组成完整套装了呢`);
    }

    return suggestions;
}
getToolCombo(tool, userData) {
    const toolSets = {
        "维修套装": ["基础扳手", "小螺丝刀", "万用表"],
        "魔法工具组": ["魔法扳手", "星光螺丝刀", "彩虹万用表"],
        "限定套装": ["独角兽扳手", "蝴蝶结工具包", "梦幻万用表"]
    };

    for (const [setName, tools] of Object.entries(toolSets)) {
        if (tools.includes(tool.name) && 
            tools.every(t => userData.mechanic.tools.some(ut => ut.name === t))) {
            return `${setName}成员 (套装效果已激活)`;
        }
    }
    return null;
}
calculateToolMastery(userData) {
    if (!userData.mechanic.tools.length) return 0;
    const totalMastery = userData.mechanic.tools.reduce((sum, tool) => 
        sum + (tool.mastery || 0), 0);
    return Math.floor(totalMastery / userData.mechanic.tools.length);
}
}