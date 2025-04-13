import { segment } from 'icqq';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import {
    saveUserData,
    loadAllUsers,
    checkUserData,
} from '../function/function.js';
import { checkCooldown, setCooldown } from '../function/cooldown.js';
import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';

const _path = process.cwd().replace(/\\/g, "/");
const redis = new Redis();

// 警察职业等级配置
const POLICE_RANKS = {
    "实习警员": { salary: 3000, requiredExp: 0 },
    "初级警员": { salary: 5000, requiredExp: 1000 },
    "中级警员": { salary: 8000, requiredExp: 3000 },
    "高级警员": { salary: 12000, requiredExp: 6000 },
    "警长": { salary: 15000, requiredExp: 10000 },
    "警督": { salary: 20000, requiredExp: 15000 },
    "总警监": { salary: 30000, requiredExp: 25000 }
};

// 读取警察系统配置文件
const loadPoliceConfig = () => {
    const casesConfig = JSON.parse(fs.readFileSync(`${_path}/plugins/sims-plugin/data/police/cases.json`, 'utf8'));
    const equipmentConfig = JSON.parse(fs.readFileSync(`${_path}/plugins/sims-plugin/data/police/equipment.json`, 'utf8'));
    const careerConfig = JSON.parse(fs.readFileSync(`${_path}/plugins/sims-plugin/data/police/career.json`, 'utf8'));
    return { casesConfig, equipmentConfig, careerConfig };
};

export class PoliceSystem extends plugin {
    constructor() {
        super({
            name: 'PoliceSystem',
            dsc: '模拟人生警察系统',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#加入警察$', fnc: 'joinPolice' },
                { reg: '^#警察信息$', fnc: 'showPoliceInfo' },
                { reg: '^#警察装备商店$', fnc: 'showPoliceEquipment' },
                { reg: '^#购买警察装备.*$', fnc: 'buyPoliceEquipment' },
                { reg: '^#巡逻$', fnc: 'startPatrol' },
                { reg: '^#接取案件$', fnc: 'acceptCase' },
                { reg: '^#处理案件$', fnc: 'handleCase' },
                { reg: '^#警察升职考核$', fnc: 'promotionExam' },
                { reg: '^#警察攻略$', fnc: 'showPoliceGuide' },
                { reg: '^#维护装备.*$', fnc: 'maintainEquipment' },
                { reg: '^#警员培训.*$', fnc: 'policeTrain' },
                { reg: '^#组建特别行动组$', fnc: 'createSpecialTaskForce' },
                { reg: '^#特别行动$', fnc: 'specialOperation' },
                { reg: '^#警察排行榜$', fnc: 'showPoliceRanking' }
            ]
        });
        this.task = {
            cron: '0 * * * *',
            name: 'UpdatePoliceData',
            fnc: () => this.updatePoliceData()
        };
        
    }

   
    async joinPolice(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'join');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData) {
            e.reply("请先使用 #开始模拟人生 注册成为玩家！");
            return;
        }

        if (userData.job === "警察") {
            e.reply("你已经是一名光荣的警察了！");
            return;
        }

        // 初始化警察数据
        userData.job = "警察";
        userData.policeData = {
            rank: "实习警员",
            exp: 0,
            salary: POLICE_RANKS["实习警员"].salary,
            equipment: [],
            solvedCases: 0,
            patrolHours: 0,
            reputation: 50,
            skills: {
                investigation: 1,
                combat: 1,
                leadership: 1,
                communication: 1
            }
        };

        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'police', 'join');

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        let data = {
            name: userData.name,
            rank: userData.policeData.rank,
            salary: userData.policeData.salary
        };

        await this.renderPoliceImage(e, 'police_join', data);
    }

    async showPoliceInfo(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'info');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || userData.job !== "警察") {
            e.reply("你还不是警察！请先使用 #加入警察 成为一名光荣的警察。");
            return;
        }

        setCooldown(e.user_id, 'police', 'info');
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        let data = {
            name: userData.name,
            rank: userData.policeData.rank,
            exp: userData.policeData.exp,
            salary: userData.policeData.salary,
            equipment: userData.policeData.equipment,
            solvedCases: userData.policeData.solvedCases,
            patrolHours: userData.policeData.patrolHours,
            reputation: userData.policeData.reputation,
            skills: userData.policeData.skills
        };

        await this.renderPoliceImage(e, 'police_info', data);
    }
    async renderPoliceImage(e, template, data) {
        let renderData = {
            quality: 100,
            tplFile: `./plugins/sims-plugin/resources/HTML/${template}.html`,
            ...data
        };

        let img = await puppeteer.screenshot('sims-plugin', renderData);
        e.reply(img);
    }

    async updatePoliceData() {
        const allUsers = await loadAllUsers();
        for (const userId in allUsers) {
            const userData = allUsers[userId];
            if (userData.job === "警察") {
                // 随机生成案件
                if (Math.random() < 0.3) { // 30%概率生成新案件
                    if (!userData.policeData.pendingCases) {
                        userData.policeData.pendingCases = [];
                    }
                    userData.policeData.pendingCases.push(this.generateCase());
                }

                // 更新装备耐久度
                if (userData.policeData.equipment) {
                    userData.policeData.equipment.forEach(item => {
                        if (item.durability) {
                            item.durability = Math.max(0, item.durability - Math.random() * 5);
                        }
                    });
                }

                await saveUserData(userId, userData);
                await redis.set(`user:${userId}`, JSON.stringify(userData));
            }
        }
    }

    async showPoliceEquipment(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'shop');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || userData.job !== "警察") {
            e.reply("你还不是警察！请先使用 #加入警察 成为一名光荣的警察。");
            return;
        }

        // 读取装备配置
        let equipmentConfig;
        try {
            const configPath = `${_path}/plugins/sims-plugin/data/police/equipment.json`;
            const fileContent = fs.readFileSync(configPath, 'utf8');
            equipmentConfig = JSON.parse(fileContent);
        } catch (error) {
            console.error("Error loading equipment config:", error);
            e.reply("装备商店数据加载失败，请稍后再试。");
            return;
        }

        // 转换装备数据格式
        const weapons = Object.entries(equipmentConfig.weapons).map(([name, data]) => ({
            name,
            ...data,
            stats: Object.entries(data.stats).map(([name, value]) => ({ name, value })),
            maintenance: {
                ...data.maintenance,
                intervalDays: Math.floor(data.maintenance.interval / 24)
            }
        }));

        const armor = Object.entries(equipmentConfig.armor).map(([name, data]) => ({
            name,
            ...data,
            stats: Object.entries(data.stats).map(([name, value]) => ({ name, value })),
            maintenance: {
                ...data.maintenance,
                intervalDays: Math.floor(data.maintenance.interval / 24)
            }
        }));

        const tools = Object.entries(equipmentConfig.tools).map(([name, data]) => ({
            name,
            ...data,
            stats: Object.entries(data.stats).map(([name, value]) => ({ name, value })),
            maintenance: {
                ...data.maintenance,
                intervalDays: Math.floor(data.maintenance.interval / 24)
            }
        }));

        const special = Object.entries(equipmentConfig.special).map(([name, data]) => ({
            name,
            ...data,
            stats: Object.entries(data.stats).map(([name, value]) => ({ name, value })),
            maintenance: {
                ...data.maintenance,
                intervalDays: Math.floor(data.maintenance.interval / 24)
            }
        }));

        let data = {
            name: userData.name,
            rank: userData.policeData.rank,
            money: userData.money,
            currentEquipment: userData.policeData.equipment || [],
            weapons,
            armor,
            tools,
            special
        };

        await this.renderPoliceImage(e, 'police_shop', data);
        setCooldown(e.user_id, 'police', 'shop');
    }

    async buyPoliceEquipment(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'buy');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || userData.job !== "警察") {
            e.reply("你还不是警察！请先使用 #加入警察 成为一名光荣的警察。");
            return;
        }

        const equipmentName = e.msg.replace('#购买警察装备', '').trim();
        const { equipmentConfig } = loadPoliceConfig();
        
        let equipment = null;
        let category = '';
        for (const cat of ['weapons', 'armor', 'tools', 'special']) {
            if (equipmentConfig[cat][equipmentName]) {
                equipment = equipmentConfig[cat][equipmentName];
                category = cat;
                break;
            }
        }

        if (!equipment) {
            e.reply("未找到该装备，请检查装备名称是否正确。");
            return;
        }

        // 检查等级要求
        if (equipment.requirements) {
            const rankLevel = POLICE_RANKS[userData.policeData.rank].level;
            if (rankLevel < equipment.requirements.level) {
                e.reply(`你的警衔等级不足，需要达到${equipment.requirements.rank}才能购买该装备。`);
                return;
            }
        }

        // 检查金钱是否足够
        const price = equipment.price;
        if (userData.money < price) {
            e.reply(`你的金钱不足，该装备需要${price}元。`);
            return;
        }

        // 检查是否已拥有该装备
        if (userData.policeData.equipment.some(item => item.name === equipmentName)) {
            e.reply("你已经拥有该装备了。");
            return;
        }

        // 购买装备
        userData.money -= price;
        userData.policeData.equipment.push({
            name: equipmentName,
            type: category,
            durability: equipment.durability || 100,
            stats: equipment.stats || {}
        });

        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'police', 'buy');
        let data = {
            name: userData.name,
            equipment: equipmentName,
            price: price,
            money: userData.money
        };

        await this.renderPoliceImage(e, 'police_buy', data);
    }

    async startPatrol(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'patrol');
        if (remainingTime > 0) {
            e.reply(`你还需要休息${remainingTime}秒才能继续巡逻～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || userData.job !== "警察") {
            e.reply("你还不是警察！请先使用 #加入警察 成为一名光荣的警察。");
            return;
        }

        // 检查体力
        if (!userData.policeData.stamina) {
            userData.policeData.stamina = 100;
        }
        if (userData.policeData.stamina < 20) {
            e.reply("你太疲惫了，需要休息一下才能继续巡逻。");
            return;
        }

        const events = [
            { type: "normal", desc: "平静的巡逻", exp: 10, money: 100 },
            { type: "minor", desc: "处理小偷小摸", exp: 20, money: 200 },
            { type: "dispute", desc: "调解纠纷", exp: 30, money: 300 },
            { type: "emergency", desc: "紧急救助", exp: 40, money: 400 },
            { type: "crime", desc: "抓获罪犯", exp: 50, money: 500 }
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        const equipmentBonus = userData.policeData.equipment.reduce((bonus, item) => {
            if (item.stats && item.stats.patrolBonus) {
                return bonus + item.stats.patrolBonus;
            }
            return bonus;
        }, 0);

        // 计算奖励
        const expGain = Math.floor(event.exp * (1 + equipmentBonus/100));
        const moneyGain = Math.floor(event.money * (1 + equipmentBonus/100));
        
        // 更新数据
        userData.policeData.exp += expGain;
        userData.money += moneyGain;
        userData.policeData.patrolHours += 1;
        userData.policeData.stamina -= 20;
        userData.policeData.reputation += Math.floor(Math.random() * 3);

        // 随机提升技能
        const skills = ['investigation', 'combat', 'leadership', 'communication'];
        const randomSkill = skills[Math.floor(Math.random() * skills.length)];
        if (Math.random() < 0.3) { // 30%概率提升技能
            userData.policeData.skills[randomSkill] = Math.min(
                10,
                userData.policeData.skills[randomSkill] + 1
            );
        }

        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'police', 'patrol');
        const ranks = Object.keys(POLICE_RANKS);
        let data = {
            name: userData.name,
            rank: userData.policeData.rank,
            area: "市中心", // 添加巡逻区域
            description: event.desc,
            rewards: {
                exp: expGain,
                money: moneyGain,
                reputation: Math.floor(Math.random() * 3)
            },
            stats: {
                totalExp: userData.policeData.exp,
                balance: userData.money,
                reputation: userData.policeData.reputation,
                totalPatrols: userData.policeData.patrolHours,
                expPercentage: Math.min(100, (userData.policeData.exp / POLICE_RANKS[userData.policeData.rank].requiredExp) * 100),
                nextRank: ranks[ranks.indexOf(userData.policeData.rank) + 1] || "已达到最高级",
                expToNextRank: POLICE_RANKS[ranks[ranks.indexOf(userData.policeData.rank) + 1]]?.requiredExp - userData.policeData.exp || 0
            },
            time: new Date().toLocaleString('zh-CN'),
            duration: 30
        };

        await this.renderPoliceImage(e, 'police_patrol', data);
    }

    calculateEquipmentBonus(equipment) {
        if (!equipment || !Array.isArray(equipment)) {
            return 0;
        }

        let totalBonus = 0;
        for (const item of equipment) {
            if (item.stats && item.stats.successRate) {
                totalBonus += item.stats.successRate;
            }
        }
        return totalBonus;
    }

    async handleCase(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'case');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || userData.job !== "警察") {
            e.reply("你还不是警察！请先使用 #加入警察 成为一名光荣的警察。");
            return;
        }

        // 检查是否有待处理案件
        if (!userData.policeData.currentCase) {
            e.reply("你当前没有待处理的案件，请先使用 #接取案件 获取新案件。");
            return;
        }

        const currentCase = userData.policeData.currentCase;
        const { casesConfig } = loadPoliceConfig();
        const caseConfig = casesConfig.caseTypes[currentCase.type];
        
        if (!caseConfig) {
            e.reply("案件配置错误，请联系管理员。");
            return;
        }

        // 计算成功率
        const baseSuccessRate = caseConfig.difficulties[currentCase.difficulty].successRate;
        const rankBonus = POLICE_RANKS[userData.policeData.rank].bonus || 0;
        const equipmentBonus = this.calculateEquipmentBonus(userData.policeData.equipment);
        const successRate = Math.min(100, baseSuccessRate + rankBonus + equipmentBonus);

        // 随机决定是否成功
        const success = Math.random() * 100 <= successRate;

        // 计算奖励
        const baseExp = caseConfig.baseExp;
        const baseMoney = caseConfig.baseReward;
        const baseReputation = caseConfig.reputation;

        // 根据难度调整奖励
        const difficultyMultiplier = {
            "简单": 1,
            "普通": 1.5,
            "困难": 2,
            "专家": 3
        }[currentCase.difficulty] || 1;

        const expGain = Math.floor(baseExp * difficultyMultiplier);
        const moneyGain = Math.floor(baseMoney * difficultyMultiplier);
        const reputationGain = Math.floor(baseReputation * difficultyMultiplier);

        // 更新用户数据
        if (success) {
            userData.policeData.solvedCases++;
            userData.policeData.reputation += reputationGain;
            userData.exp += expGain;
            userData.money += moneyGain;
        }

        // 清除当前案件
        userData.policeData.currentCase = null;
        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        let data = {
            name: userData.name,
            caseInfo: currentCase,
            success,
            expGain,
            moneyGain,
            reputation: reputationGain,
            solvedCases: userData.policeData.solvedCases
        };

        await this.renderPoliceImage(e, 'police_case_result', data);
        setCooldown(e.user_id, 'police', 'case');
    }

    async promotionExam(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'exam');
        if (remainingTime > 0) {
            e.reply(`考核中心现在很忙，请${remainingTime}秒后再来～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || userData.job !== "警察") {
            e.reply("你还不是警察！请先使用 #加入警察 成为一名光荣的警察。");
            return;
        }

        const { careerConfig } = loadPoliceConfig();
        const currentRank = userData.policeData.rank;
        let nextRank = "";

        // 确定下一个职级
        const ranks = Object.keys(POLICE_RANKS);
        const currentRankIndex = ranks.indexOf(currentRank);
        if (currentRankIndex >= ranks.length - 1) {
            e.reply("你已经达到了最高警衔，继续努力维护社会治安吧！");
            return;
        }
        nextRank = ranks[currentRankIndex + 1];

        // 检查是否满足考核条件
        const examKey = `${nextRank}考核`;
        const examConfig = careerConfig.promotionExams[examKey];
        if (!examConfig) {
            e.reply(`未找到${nextRank}的升职考核配置。`);
            return;
        }

        // 检查经验值要求
        if (userData.policeData.exp < examConfig.requirements.minExp) {
            e.reply(`你的经验值不足，需要至少${examConfig.requirements.minExp}点经验才能参加${nextRank}考核。`);
            return;
        }

        // 检查已破案件数量
        if (userData.policeData.solvedCases < examConfig.requirements.minSolvedCases) {
            e.reply(`你破获的案件数量不足，需要至少破获${examConfig.requirements.minSolvedCases}起案件才能参加${nextRank}考核。`);
            return;
        }

        // 进行考核
        const theoryScore = Math.floor(Math.random() * 30) + 70; // 70-100分
        const physicalScore = Math.floor(Math.random() * 30) + 70;
        const practicalScore = Math.floor(Math.random() * 30) + 70;

        // 考核加成
        const theoryBonus = userData.policeData.skills.investigation * 2;
        const physicalBonus = userData.policeData.skills.combat * 2;
        const practicalBonus = (userData.policeData.skills.communication + userData.policeData.skills.leadership) * 1.5;

        const finalTheoryScore = Math.min(100, theoryScore + theoryBonus);
        const finalPhysicalScore = Math.min(100, physicalScore + physicalBonus);
        const finalPracticalScore = Math.min(100, practicalScore + practicalBonus);

        const totalScore = (finalTheoryScore + finalPhysicalScore + finalPracticalScore) / 3;
        const passScore = 75; // 平均75分通过

        if (totalScore >= passScore) {
            // 升职成功
            userData.policeData.rank = nextRank;
            userData.policeData.salary = POLICE_RANKS[nextRank].salary;
            
            // 升职奖励
            const bonusExp = 500;
            const bonusMoney = 5000;
            userData.policeData.exp += bonusExp;
            userData.money += bonusMoney;

            await saveUserData(userId, userData);
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            
            let data = {
                name: userData.name,
                oldRank: currentRank,
                newRank: nextRank,
                theoryScore: finalTheoryScore.toFixed(1),
                physicalScore: finalPhysicalScore.toFixed(1),
                practicalScore: finalPracticalScore.toFixed(1),
                totalScore: totalScore.toFixed(1),
                bonusExp: bonusExp,
                bonusMoney: bonusMoney,
                success: true
            };

            await this.renderPoliceImage(e, 'police_promotion', data);
        } else {
            let data = {
                name: userData.name,
                currentRank: currentRank,
                targetRank: nextRank,
                theoryScore: finalTheoryScore.toFixed(1),
                physicalScore: finalPhysicalScore.toFixed(1),
                practicalScore: finalPracticalScore.toFixed(1),
                totalScore: totalScore.toFixed(1),
                passScore: passScore,
                success: false
            };

            await this.renderPoliceImage(e, 'police_promotion', data);
        }

        setCooldown(e.user_id, 'police', 'exam');
    }

    async maintainEquipment(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'maintain');
        if (remainingTime > 0) {
            e.reply(`维修部门正忙，请${remainingTime}秒后再来～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || userData.job !== "警察") {
            e.reply("你还不是警察！请先使用 #加入警察 成为一名光荣的警察。");
            return;
        }

        const equipmentName = e.msg.replace('#维护装备', '').trim();
        if (!equipmentName) {
            e.reply("请指定要维护的装备名称，例如：#维护装备 警用手枪");
            return;
        }

        const userEquipment = userData.policeData.equipment.find(item => item.name === equipmentName);
        if (!userEquipment) {
            e.reply(`你没有名为 ${equipmentName} 的装备。`);
            return;
        }

        // 获取装备配置信息
        const { equipmentConfig } = loadPoliceConfig();
        let equipmentData = null;
        let category = '';

        for (const cat of ['weapons', 'armor', 'tools', 'special']) {
            if (equipmentConfig[cat][equipmentName]) {
                equipmentData = equipmentConfig[cat][equipmentName];
                category = cat;
                break;
            }
        }

        if (!equipmentData || !equipmentData.maintenance) {
            e.reply("无法获取该装备的维护信息。");
            return;
        }

        // 计算维护费用（根据损耗）
        const durabilityLoss = 100 - userEquipment.durability;
        const baseCost = equipmentData.maintenance.cost;
        const maintenanceCost = Math.ceil(baseCost * (durabilityLoss / 100 + 0.5));

        // 检查金钱是否足够
        if (userData.money < maintenanceCost) {
            e.reply(`你的金钱不足，维护${equipmentName}需要${maintenanceCost}元。`);
            return;
        }

        // 执行维护
        userData.money -= maintenanceCost;
        userEquipment.durability = 100; // 恢复耐久度

        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'police', 'maintain');

        let data = {
            name: userData.name,
            equipment: equipmentName,
            cost: maintenanceCost,
            durabilityBefore: 100 - durabilityLoss,
            durabilityAfter: 100,
            money: userData.money
        };

        await this.renderPoliceImage(e, 'police_maintenance', data);
    }

    async policeTrain(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'train');
        if (remainingTime > 0) {
            e.reply(`训练中心现在人满为患，请${remainingTime}秒后再来～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || userData.job !== "警察") {
            e.reply("你还不是警察！请先使用 #加入警察 成为一名光荣的警察。");
            return;
        }

        // 获取培训类型
        const trainType = e.msg.replace('#警员培训', '').trim();
        const validTrainTypes = ['调查', '战斗', '领导', '沟通'];
        const skillMapping = {
            '调查': 'investigation',
            '战斗': 'combat',
            '领导': 'leadership',
            '沟通': 'communication'
        };

        if (!trainType || !validTrainTypes.includes(trainType)) {
            e.reply(`请指定有效的培训类型：${validTrainTypes.join('、')}。例如：#警员培训 调查`);
            return;
        }

        // 检查体力
        if (!userData.policeData.stamina) {
            userData.policeData.stamina = 100;
        }
        if (userData.policeData.stamina < 30) {
            e.reply("你太疲惫了，需要休息一下才能进行培训。");
            return;
        }

        // 训练费用和效果
        const trainCost = 1000;
        if (userData.money < trainCost) {
            e.reply(`你的金钱不足，参加${trainType}培训需要${trainCost}元。`);
            return;
        }

        // 获取当前技能等级
        const skillKey = skillMapping[trainType];
        const currentLevel = userData.policeData.skills[skillKey];
        
        // 检查是否已达到最高等级
        if (currentLevel >= 10) {
            e.reply(`你的${trainType}能力已经达到最高等级10级，无需继续培训。`);
            return;
        }

        const successRate = 80 - (currentLevel * 5);
        const isSuccess = Math.random() * 100 < successRate;

        // 扣除费用和体力
        userData.money -= trainCost;
        userData.policeData.stamina -= 30;

        if (isSuccess) {
            // 提升技能等级
            userData.policeData.skills[skillKey] += 1;
            const expGain = 100;
            userData.policeData.exp += expGain;

            await saveUserData(userId, userData);
            await redis.set(`user:${userId}`, JSON.stringify(userData));

            let data = {
                name: userData.name,
                trainType: trainType,
                oldLevel: currentLevel,
                newLevel: currentLevel + 1,
                expGain: expGain,
                cost: trainCost,
                stamina: userData.policeData.stamina,
                success: true
            };

            await this.renderPoliceImage(e, 'police_training', data);
        } else {
            const expGain = 30; // 失败也有少量经验
            userData.policeData.exp += expGain;

            await saveUserData(userId, userData);
            await redis.set(`user:${userId}`, JSON.stringify(userData));

            let data = {
                name: userData.name,
                trainType: trainType,
                level: currentLevel,
                expGain: expGain,
                cost: trainCost,
                stamina: userData.policeData.stamina,
                success: false
            };

            await this.renderPoliceImage(e, 'police_training', data);
        }

        setCooldown(e.user_id, 'police', 'train');
    }

    async createSpecialTaskForce(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'taskforce');
        if (remainingTime > 0) {
            e.reply(`指挥中心正在处理其他行动申请，请${remainingTime}秒后再来～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || userData.job !== "警察") {
            e.reply("你还不是警察！请先使用 #加入警察 成为一名光荣的警察。");
            return;
        }

        // 检查警衔是否足够（至少需要中级警员）
        const requiredRankLevel = 3; // 中级警员
        const currentRankLevel = POLICE_RANKS[userData.policeData.rank].level;
        if (currentRankLevel < requiredRankLevel) {
            e.reply("你的警衔不足，需要达到中级警员或以上才能组建特别行动小组。");
            return;
        }

        // 检查领导技能
        if (userData.policeData.skills.leadership < 3) {
            e.reply("你的领导能力不足，需要达到3级或以上才能组建特别行动小组。");
            return;
        }

        // 检查是否已有特别行动小组
        if (userData.policeData.taskForce) {
            e.reply("你已经有一个特别行动小组了，可以使用 #特别行动 进行任务。");
            return;
        }

        // 创建费用
        const createCost = 10000;
        if (userData.money < createCost) {
            e.reply(`你的资金不足，组建特别行动小组需要${createCost}元。`);
            return;
        }
        // 创建特别行动小组
        userData.money -= createCost;
        // 根据领导技能决定可以招募的成员数量
        const memberCount = Math.min(5, 2 + Math.floor(userData.policeData.skills.leadership / 2));
        // 生成随机成员
        const memberTypes = ["突击手", "狙击手", "侦察兵", "战术支援", "医疗兵"];
        const members = [];
        
        for (let i = 0; i < memberCount; i++) {
            const memberType = memberTypes[Math.floor(Math.random() * memberTypes.length)];
            const skillLevel = Math.floor(Math.random() * 3) + 3; // 3-5级技能
            
            members.push({
                id: `TF-${Date.now() % 10000}-${i}`,
                type: memberType,
                skill: skillLevel,
                health: 100,
                morale: 100
            });
        }
        
        userData.policeData.taskForce = {
            name: `${userData.name}特别行动组`,
            members: members,
            successfulOperations: 0,
            reputation: 50
        };

        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'police', 'taskforce');
        let data = {
            name: userData.name,
            taskForceName: userData.policeData.taskForce.name,
            members: userData.policeData.taskForce.members,
            cost: createCost,
            leadershipLevel: userData.policeData.skills.leadership
        };

        await this.renderPoliceImage(e, 'police_taskforce', data);
    }

    async specialOperation(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'operation');
        if (remainingTime > 0) {
            e.reply(`特别行动组正在休整，请${remainingTime}秒后再来～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || userData.job !== "警察") {
            e.reply("你还不是警察！请先使用 #加入警察 成为一名光荣的警察。");
            return;
        }

        // 检查是否有特别行动小组
        if (!userData.policeData.taskForce) {
            e.reply("你还没有特别行动小组，请先使用 #组建特别行动组 创建一个。");
            return;
        }

        // 检查装备
        let hasWeapon = false;
        let hasArmor = false;
        
        for (const item of userData.policeData.equipment) {
            if (item.type === "武器") hasWeapon = true;
            if (item.type === "防具") hasArmor = true;
        }
        
        if (!hasWeapon || !hasArmor) {
            e.reply("执行特别行动需要至少一件武器和一件防具，请先前往装备商店购买。");
            return;
        }

        const operations = [
            { name: "围捕通缉犯", difficulty: 3, reward: 5000, exp: 300 },
            { name: "缉毒行动", difficulty: 4, reward: 8000, exp: 400 },
            { name: "解救人质", difficulty: 5, reward: 10000, exp: 500 },
            { name: "保护重要人物", difficulty: 3, reward: 6000, exp: 350 },
            { name: "打击非法集会", difficulty: 2, reward: 4000, exp: 250 }
        ];
        
        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        // 计算成功率
        let successRate = 50;
        // 领导力加成
        successRate += userData.policeData.skills.leadership * 5;
        // 战斗力加成
        successRate += userData.policeData.skills.combat * 3;
        // 小组成员技能加成
        const averageMemberSkill = userData.policeData.taskForce.members.reduce((sum, member) => sum + member.skill, 0) / 
                                  userData.policeData.taskForce.members.length;
        successRate += averageMemberSkill * 5;
        // 小组士气加成
        const averageMorale = userData.policeData.taskForce.members.reduce((sum, member) => sum + member.morale, 0) / 
                             userData.policeData.taskForce.members.length;
        successRate += (averageMorale - 50) / 10;
        // 难度调整
        successRate -= operation.difficulty * 10;
        
        // 确保成功率在有效范围内
        successRate = Math.min(95, Math.max(5, successRate));
        
        // 判定是否成功
        const isSuccess = Math.random() * 100 < successRate;
        
        if (isSuccess) {
            const expGain = operation.exp;
            const rewardGain = operation.reward;
            
            userData.policeData.exp += expGain;
            userData.money += rewardGain;
            userData.policeData.taskForce.successfulOperations += 1;
            userData.policeData.taskForce.reputation += 5;
            
            // 随机提升一项技能
            const skills = ['investigation', 'combat', 'leadership', 'communication'];
            const randomSkill = skills[Math.floor(Math.random() * skills.length)];
            if (userData.policeData.skills[randomSkill] < 10) {
                userData.policeData.skills[randomSkill] += 1;
            }
            
            // 更新小组成员状态
            userData.policeData.taskForce.members.forEach(member => {
                // 可能受伤但士气提升
                member.health = Math.max(70, member.health - Math.floor(Math.random() * 30));
                member.morale = Math.min(100, member.morale + Math.floor(Math.random() * 10));
            });
            
        } else {
            // 行动失败
            const expGain = Math.floor(operation.exp * 0.3); // 失败只有30%经验
            
            userData.policeData.exp += expGain;
            userData.policeData.taskForce.reputation -= 3;
            
            // 更新小组成员状态 ，行动失败会受伤并降低士气
            userData.policeData.taskForce.members.forEach(member => {
                member.health = Math.max(50, member.health - Math.floor(Math.random() * 50));
                member.morale = Math.max(30, member.morale - Math.floor(Math.random() * 20));
            });
        }
        
        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'police', 'operation', 3600); // 特别行动1小时冷却
       
        let data = {
            name: userData.name,
            taskForceName: userData.policeData.taskForce.name,
            operation: operation.name,
            difficulty: operation.difficulty,
            successRate: successRate.toFixed(1),
            success: isSuccess,
            expGain: isSuccess ? operation.exp : expGain,
            rewardGain: isSuccess ? operation.reward : 0,
            members: userData.policeData.taskForce.members,
            reputation: userData.policeData.taskForce.reputation,
            successfulOperations: userData.policeData.taskForce.successfulOperations
        };
        
        await this.renderPoliceImage(e, 'police_operation', data);
    }

    async showPoliceRanking(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'ranking');
        if (remainingTime > 0) {
            e.reply(`数据处理中，请${remainingTime}秒后再查询～`);
            return;
        }
        const allUsers = await loadAllUsers();
        
        // 筛选出警察职业玩家
        const policeUsers = [];
        for (const userId in allUsers) {
            const userData = allUsers[userId];
            if (userData.job === "警察") {
                policeUsers.push({
                    id: userId,
                    name: userData.name,
                    rank: userData.policeData.rank,
                    exp: userData.policeData.exp,
                    solvedCases: userData.policeData.solvedCases || 0,
                    patrolHours: userData.policeData.patrolHours || 0,
                    reputation: userData.policeData.reputation || 0
                });
            }
        }
        
        // 如果没有警察玩家
        if (policeUsers.length === 0) {
            e.reply("目前还没有玩家加入警察职业，无排行榜。");
            return;
        }
        
        // 按经验值排序
        policeUsers.sort((a, b) => b.exp - a.exp);
        const expRanking = policeUsers.slice(0, 10); // 取前10
        
        // 按破案数排序
        const caseRanking = [...policeUsers].sort((a, b) => b.solvedCases - a.solvedCases).slice(0, 10);
        
        // 按声望排序
        const reputationRanking = [...policeUsers].sort((a, b) => b.reputation - a.reputation).slice(0, 10);
        
        // 检查当前用户排名
        const userRanking = {
            exp: policeUsers.findIndex(user => user.id === e.user_id) + 1,
            case: [...policeUsers].sort((a, b) => b.solvedCases - a.solvedCases).findIndex(user => user.id === e.user_id) + 1,
            reputation: [...policeUsers].sort((a, b) => b.reputation - a.reputation).findIndex(user => user.id === e.user_id) + 1
        };
        
        // 生成排行榜数据
        let data = {
            expRanking: expRanking,
            caseRanking: caseRanking,
            reputationRanking: reputationRanking,
            totalPolice: policeUsers.length,
            userRanking: userRanking
        };
        
        await this.renderPoliceImage(e, 'police_ranking', data);
        setCooldown(e.user_id, 'police', 'ranking');
    }

    async showPoliceGuide(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);

        // 生成攻略数据
        let data = {
            name: userData ? userData.name : "新玩家",
            isPolice: userData && userData.job === "警察",
            commands: [
                { command: "#加入警察", description: "加入警察职业，开始你的执法生涯" },
                { command: "#警察信息", description: "查看你的警察档案信息" },
                { command: "#警察装备商店", description: "浏览可购买的警察装备" },
                { command: "#购买警察装备 [装备名]", description: "购买指定的警察装备" },
                { command: "#维护装备 [装备名]", description: "维护指定装备，恢复耐久度" },
                { command: "#巡逻", description: "进行日常巡逻，获取经验和收入" },
                { command: "#处理案件", description: "处理待办案件，提升声望" },
                { command: "#警员培训 [技能]", description: "培训特定技能，可选：调查、战斗、领导、沟通" },
                { command: "#警察升职考核", description: "参加升职考核，提升警衔" },
                { command: "#组建特别行动组", description: "组建特别行动小组（需中级警员及以上）" },
                { command: "#特别行动", description: "执行特别行动任务" },
                { command: "#警察排行榜", description: "查看警察职业玩家排行榜" }
            ],
            tips: [
                "定期巡逻和处理案件可以获得稳定的经验和收入",
                "升级技能可以提高相关行动的成功率",
                "装备耐久度降低会影响性能，记得定期维护",
                "升职考核需要满足经验和破案数量要求",
                "特别行动小组可以执行高难度高回报的任务",
                "警衔越高，月薪和可用装备也越多"
            ]
        };

        await this.renderPoliceImage(e, 'police_guide', data);
        
        const guideContent = `# 模拟人生警察系统攻略

## 基础指令
- **#加入警察** - 加入警察职业，开始你的执法生涯
- **#警察信息** - 查看你的警察档案信息
- **#警察装备商店** - 浏览可购买的警察装备
- **#购买警察装备 [装备名]** - 购买指定的警察装备
- **#维护装备 [装备名]** - 维护指定装备，恢复耐久度
- **#巡逻** - 进行日常巡逻，获取经验和收入
- **#处理案件** - 处理待办案件，提升声望
- **#警员培训 [技能]** - 培训特定技能，可选：调查、战斗、领导、沟通
- **#警察升职考核** - 参加升职考核，提升警衔
- **#组建特别行动组** - 组建特别行动小组（需中级警员及以上）
- **#特别行动** - 执行特别行动任务
- **#警察排行榜** - 查看警察职业玩家排行榜

## 警衔等级
1. 实习警员 - 初始等级，月薪3000元
2. 初级警员 - 需要1000经验值，月薪5000元
3. 中级警员 - 需要3000经验值，月薪8000元
4. 高级警员 - 需要6000经验值，月薪12000元
5. 警长 - 需要10000经验值，月薪15000元
6. 警督 - 需要15000经验值，月薪20000元
7. 总警监 - 需要25000经验值，月薪30000元

## 核心技能
- **调查能力** - 提高破案成功率和证据收集质量
- **战斗能力** - 提高处理暴力事件的能力
- **领导能力** - 提高团队协作效率
- **沟通能力** - 提高与群众沟通和信息获取能力

## 游戏玩法提示
- 定期巡逻和处理案件可以获得稳定的经验和收入
- 升级技能可以提高相关行动的成功率
- 装备耐久度降低会影响性能，记得定期维护
- 升职考核需要满足经验和破案数量要求
- 特别行动小组可以执行高难度高回报的任务
- 警衔越高，月薪和可用装备也越多

## 装备分类
1. **武器类** - 用于提高战斗和执法能力
2. **防具类** - 提供防护，降低受伤风险
3. **工具类** - 辅助执法和调查工作
4. **特殊类** - 高级装备，具有特殊功能

## 案件处理
案件类型多样，包括盗窃、抢劫、交通事故等。不同案件需要不同的技能组合，成功处理案件可以获得经验、金钱和声望提升。

## 特别行动小组
中级警员及以上可以组建特别行动小组，执行高难度高回报的特殊任务。小组成员有不同专长，需要合理配置和提升士气以提高任务成功率。

## 升职晋级
满足经验和破案数量要求后，可以参加升职考核。考核内容包括理论测试、体能测试和实战演练。通过考核可以晋升下一级警衔，获得更高薪资和福利。
`;

        const guidePath = path.join(process.cwd(), 'plugins/sims-plugin/doc/模拟警察攻略.md');
        fs.writeFileSync(guidePath, guideContent, 'utf8');
    }

   
    generateCase() {
        const { casesConfig } = loadPoliceConfig();
        const caseTypes = Object.keys(casesConfig.caseTypes);
        const difficulties = ["简单", "普通", "困难", "极难"];
        const locations = Object.keys(casesConfig.locations);

        const selectedType = caseTypes[Math.floor(Math.random() * caseTypes.length)];
        const selectedDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        const selectedLocation = locations[Math.floor(Math.random() * locations.length)];

        const caseTypeConfig = casesConfig.caseTypes[selectedType];
        const locationConfig = casesConfig.locations[selectedLocation];
        const difficultyConfig = caseTypeConfig.difficulties[selectedDifficulty];

        // 计算基础奖励和经验，并应用难度和地点修正
        const baseReward = caseTypeConfig.baseReward;
        const baseExp = caseTypeConfig.baseExp;
        
        const reward = Math.floor(baseReward * difficultyConfig.rewardMultiplier * (locationConfig.difficultyModifier || 1));
        const exp = Math.floor(baseExp * difficultyConfig.expMultiplier * (locationConfig.difficultyModifier || 1));

        return {
            id: Date.now(),
            type: selectedType,
            difficulty: selectedDifficulty,
            location: selectedLocation,
            reward: reward,
            exp: exp,
            timeLimit: Math.floor(Math.random() * 48) + 24, // 24-72小时
            description: caseTypeConfig.description
        };
    }

    async acceptCase(e) {
        const remainingTime = checkCooldown(e.user_id, 'police', 'accept');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || userData.job !== "警察") {
            e.reply("你还不是警察！请先使用 #加入警察 成为一名光荣的警察。");
            return;
        }

        // 检查是否已有待处理案件
        if (userData.policeData.currentCase) {
            e.reply("你当前还有未处理的案件，请先处理完当前案件。");
            return;
        }
        // 生成新案件
        const newCase = this.generateCase();
        const rankLevel = POLICE_RANKS[userData.policeData.rank].level;
        const caseDifficultyLevel = {
            "简单": 1,
            "普通": 2,
            "困难": 3,
            "专家": 4
        }[newCase.difficulty] || 1;

        if (rankLevel < caseDifficultyLevel) {
            e.reply(`你的警衔等级不足，无法接取${newCase.difficulty}难度的案件。`);
            return;
        }

        // 分配案件给用户
        userData.policeData.currentCase = newCase;
        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'police', 'accept');
        let data = {
            name: userData.name,
            caseInfo: newCase,
            rank: userData.policeData.rank,
            time: new Date().toLocaleString('zh-CN')
        };

        await this.renderPoliceImage(e, 'police_case_accept', data);
    }
}