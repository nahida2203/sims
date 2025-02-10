import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import {
    saveUserData,
    checkUserData,
    saveBanData,
} from '../function/function.js';
import Redis from 'ioredis';
const redis = new Redis();
const PLUGIN_PATH = path.join(process.cwd(), 'plugins', 'sims-plugin');
export class UserStart extends plugin {
    constructor() {
        super({
            name: 'UserStart',
            dsc: '游戏开始',
            event: 'message',
            priority: 6,
            rule: [
                { reg: '^#太空探索开始$', fnc: 'Start_space_exploration' },
                { reg: '^#建造空间站$', fnc: 'Build_space_station' },
                { reg: '^#升级舱体$', fnc: 'Upgrade_hull' },
                { reg: '^#升级推进器$', fnc: 'Upgrade_propulsion_system' },
                { reg: '^#升级能源系统$', fnc: 'Upgrade_energy_system' },
                { reg: '^#雇佣船员$', fnc: 'Hire_crew_member' },
                { reg: '^#训练船员 (\\d+)$', fnc: 'Train_crew_member' },
                { reg: '^#进行科学研究(.+)$', fnc: 'Conduct_research' },
                { reg: '^#探索未知星球$', fnc: 'Explore_unknown_planet' },
                { reg: '^#建造研究设施$', fnc: 'Build_research_facility' },
                { reg: '^#建造推进设施$', fnc: 'Build_propulsion_facility' },
                { reg: '^#建造能源设施$', fnc: 'Build_energy_facility' },
                { reg: '^#建造船员设施$', fnc: 'Build_crew_facility' },
                { reg: '^#购买科研点(.+)$', fnc: 'Buy_research_points' },
                { reg: '^#购买探索点\\s*(.*)$', fnc: 'Buy_exploration_points' },
                { reg: '^#获取空间站信息$', fnc: 'Show_space_station_info' },
                { reg: '^#获取船员信息$', fnc: 'Show_crew_info' },
                { reg: '^#获取科研进度$', fnc: 'Show_research_progress' },
                { reg: '^#获取探索进度$', fnc: 'Show_exploration_progress' },
                { reg: '^#获取任务列表$', fnc: 'Show_tasks' },
                { reg: '^#完成任务\\s*(.*)$', fnc: 'Complete_task' },
                { reg: '^#太空签到$', fnc: 'Daily_space_gift' },
                { reg: '^#太空商店$', fnc: 'Show_space_store' },
                { reg: '^#购买太空装备\\s*(.*)$', fnc: 'Buy_space_equipment' },
                { reg: '^#维修飞船$', fnc: 'Repair_spaceship' },
                { reg: '^#科研成果转让$', fnc: 'Transfer_research_results' },
                { reg: '^#太空医疗$', fnc: 'Space_medical_treatment' },
                { reg: '^#太空采集$', fnc: 'Space_collection' },
                { reg: '^#太空市场售卖.*$', fnc: 'Sell_space_equipment' },
                { reg: '^#太空天气预报$', fnc: 'Space_weather_forecast' },
                { reg: '^#太空任务申请.*$', fnc: 'Apply_space_task' },
                { reg: '^#太空旅行.$', fnc: 'Space_travel' },
                { reg: '^#太空救援$', fnc: 'Space_rescue' },
                { reg: '^#太空基地升级.$', fnc: 'Upgrade_space_base' },
                { reg: '^#太空基地防御.$', fnc: 'Build_defense_system' },
                { reg: '^#太空基地扩展.$', fnc: 'Expand_space_base' },
            ],
        });
    }
    async banPlayer(userId, e) {
        const userData = await checkUserData(userId);
        if (!userData) {return false;}

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
    async Start_space_exploration(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法开始太空探索呢 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            // 检查操作频率
            const operationKey = `space:operation:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 50; // 5秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply(`慢一点啦！请等待 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)} 秒后再操作哦 (◕‿◕✿)`);
                    return;
                }
            }
            await redis.set(operationKey, Date.now(), 'EX', 300);
            // 异常数据检测
            if (userData && typeof userData !== 'object') {
                logger.error(`用户数据异常: ${userId}`);
                await saveBanData(userId, "数据异常");
                e.reply("检测到数据异常，已暂时限制访问 (｡•́︿•̀｡)");
                return;
            }
    
            if (!userData.spaceData) {
                userData.spaceData = {
                    researchProgress: 0,
                    researchLevel: 1,
                    spaceship: {
                        hullDurability: 100,
                        maxHullDurability: 100,
                        propulsionEfficiency: 50,
                        maxPropulsionEfficiency: 100,
                        energyCapacity: 100,
                        maxEnergyCapacity: 100,
                        crew: [],
                        maxCrew: 5,
                        explorationProgress: 0,
                        explorationLevel: 1,
                        currentPlanet: null,
                        maintenanceHistory: [],
                        lastMaintenance: null,
                        healthStatus: "良好",
                        lastMaintenanceDate: null,
                        spaceDisease: null,
                        spaceDiseaseSymptoms: null,
                        spaceDiseaseType: null,
                        isSpaceContagious: false,
                        spaceDeathRate: 0,
                        // 新增可爱属性
                        name: "星梦号",
                        mood: "开心",
                        decoration: [],
                        color: "粉色",
                        style: "可爱风格",
                        mascot: "小兔子",
                        cleanliness: 100,
                        comfort: 80
                    },
                    spaceStation: {
                        constructionProgress: 0,
                        researchFacility: false,
                        propulsionFacility: false,
                        energyFacility: false,
                        crewFacility: false,
                        currentProjects: [],
                        completedProjects: [],
                        researchInventory: [],
                        researchAchievements: [],
                        researchPoints: 0,
                        explorationPoints: 0,
                        researchUnlockedList: [],
                        explorationUnlockedList: [],
                        lastSpaceOperationDate: null,
                        spacePoints: 0,
                        // 新增可爱属性
                        name: "梦幻空间站",
                        style: "梦幻风格",
                        happiness: 100,
                        atmosphere: "温馨",
                        decorations: [],
                        plants: [],
                        pets: []
                    },
                    spaceEvents: [],
                    spaceAchievements: [],
                    tasks: [],
                    lastSignInDate: null,
                    // 新增个性化属性
                    personalStats: {
                        charm: 50,
                        wisdom: 50,
                        courage: 50,
                        luck: 50,
                        friendship: 0,
                        happiness: 80,
                        energy: 100,
                        creativity: 50
                    },
                    collection: {
                        starDust: 100,
                        spaceCrystals: 10,
                        cosmicFlowers: [],
                        spaceStickers: [],
                        specialItems: []
                    }
                };
    
                // 生成欢迎信息
                let welcomeMessage = [
                    "✨ 欢迎来到梦幻太空冒险~ ✨",
                    "•*¨*•.¸¸✨¸¸.•*¨*•",
                    `🚀 你的专属飞船【${userData.spaceData.spaceship.name}】已准备就绪~`,
                    `🏰 你的梦幻空间站【${userData.spaceData.spaceStation.name}】等待建造~`,
                    "✨ 初始属性：",
                    `   💝 魅力值：${userData.spaceData.personalStats.charm}`,
                    `   💫 智慧值：${userData.spaceData.personalStats.wisdom}`,
                    `   ⭐ 勇气值：${userData.spaceData.personalStats.courage}`,
                    `   🌟 幸运值：${userData.spaceData.personalStats.luck}`,
                    "🎀 新手礼包：",
                    `   💫 星尘 x ${userData.spaceData.collection.starDust}`,
                    `   💎 空间水晶 x ${userData.spaceData.collection.spaceCrystals}`,
                    "•*¨*•.¸¸✨¸¸.•*¨*•",
                    "记得每天签到领取奖励哦~ (◕‿◕✿)"
                ].join('\n');
    
                // 更新 Redis 和本地存储
                await redis.set(`user:${userId}`, JSON.stringify(userData));
                await saveUserData(userId, userData);
    
                e.reply(welcomeMessage);
            } else {
                // 检查数据完整性
                if (!userData.spaceData.spaceship || !userData.spaceData.spaceStation) {
                    logger.error(`用户数据损坏: ${userId}`);
                    await saveBanData(userId, "数据损坏");
                    e.reply("数据出现异常，已暂时限制访问 (｡•́︿•̀｡)");
                    return;
                }
    
                // 如果已经开始过探索，显示当前状态
                let statusMessage = [
                    "🌟 欢迎回来，亲爱的宇航员~",
                    `🚀 ${userData.spaceData.spaceship.name}状态：${userData.spaceData.spaceship.mood}`,
                    `🏰 ${userData.spaceData.spaceStation.name}状态：${userData.spaceData.spaceStation.atmosphere}`,
                    `💝 当前魅力值：${userData.spaceData.personalStats.charm}`,
                    `💫 收集星尘：${userData.spaceData.collection.starDust}`,
                    "继续加油探索浩瀚宇宙吧~ (◕‿◕✿)"
                ].join('\n');
    
                e.reply(statusMessage);
            }
    
        } catch (err) {
            logger.error(`太空探索初始化错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，遇到一些小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Build_space_station(e) {
        const userId = e.user_id;
        // 数据校验
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法建造太空站呢 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            // 检查操作频率
            const operationKey = `space:build:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 10; // 10秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply(`建造需要精心准备呢，请等待 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)} 秒后再操作哦 (◕‿◕✿)`);
                    return;
                }
            }
    
            // 更新操作时间
            await redis.set(operationKey, Date.now(), 'EX', 300);
    
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const spaceData = userData.spaceData;
    
            // 检查数据完整性
            if (!spaceData.spaceStation || typeof spaceData.spaceStation !== 'object') {
                logger.error(`空间站数据异常: ${userId}`);
                await saveBanData(userId, "数据异常");
                e.reply("检测到数据异常，已暂时限制访问 (｡•́︿•̀｡)");
                return;
            }
    
            // 检查科研点
            if (spaceData.researchPoints < 50) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 科研点不足呢~",
                    "🎀 当前科研点: " + spaceData.researchPoints,
                    "✨ 需要科研点: 50",
                    "提示: 可以通过完成任务或购买来获得科研点哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 建造进度计算
            const prevProgress = spaceData.spaceStation.constructionProgress;
            spaceData.researchPoints -= 50;
            spaceData.spaceStation.constructionProgress += 10;
    
            // 随机事件
            const events = [
                "👷 建造过程中发现了一颗美丽的星尘~",
                "🌟 意外获得了一些建筑材料的优惠~",
                "✨ 遇到了热心的星际工程师来帮忙~",
                "🎀 发现了一些可以用来装饰的太空花朵~"
            ];
    
            // 建造奖励
            let rewards = {
                starDust: Math.floor(Math.random() * 20),
                spaceCrystals: Math.floor(Math.random() * 5),
                happiness: Math.floor(Math.random() * 10)
            };
    
            // 更新空间站属性
            if (spaceData.spaceStation.constructionProgress >= 100) {
                spaceData.spaceStation.constructionProgress = 100;
                spaceData.spaceStation.atmosphere = "温馨";
                spaceData.spaceStation.happiness = 100;
                
                // 建造完成奖励
                rewards = {
                    starDust: 100,
                    spaceCrystals: 20,
                    happiness: 30
                };
            }
    
            // 更新收藏品
            spaceData.collection.starDust += rewards.starDust;
            spaceData.collection.spaceCrystals += rewards.spaceCrystals;
            spaceData.personalStats.happiness += rewards.happiness;
    
            // 生成建造报告
            let buildReport = [
                "•*¨*•.¸¸✨¸¸.•*¨*•",
                "🏗️ 空间站建造进度报告",
                `📈 建造进度: ${prevProgress}% → ${spaceData.spaceStation.constructionProgress}%`,
                `💫 消耗科研点: 50`,
                `🎁 获得奖励:`,
                `   ✨ 星尘 x ${rewards.starDust}`,
                `   💎 空间水晶 x ${rewards.spaceCrystals}`,
                `   💝 心情值 +${rewards.happiness}`,
                "🎀 特别事件:",
                `   ${events[Math.floor(Math.random() * events.length)]}`,
                "•*¨*•.¸¸✨¸¸.•*¨*•"
            ];
    
            // 建造完成特别提示
            if (spaceData.spaceStation.constructionProgress >= 100) {
                buildReport.push(
                    "🎉 恭喜！空间站建造完成啦！",
                    "🏰 这里将是你的梦幻太空家园~",
                    "💝 快去装扮你的空间站吧！"
                );
            }
    
            // 更新 Redis 和本地存储
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(buildReport.join('\n'));
    
        } catch (err) {
            logger.error(`空间站建造错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，建造过程中遇到了一些小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Upgrade_hull(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            // 操作冷却检查
            const operationKey = `space:upgrade:hull:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 15; // 15秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply(`舱体升级需要仔细准备呢，请等待 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)} 秒后再操作哦 🎀`);
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
    
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const spaceData = userData.spaceData;
    
            // 数据完整性检查
            if (!spaceData.spaceship || typeof spaceData.spaceship !== 'object') {
                logger.error(`飞船数据异常: ${userId}`);
                await saveBanData(userId, "数据异常");
                e.reply("检测到数据异常，已暂时限制访问 (｡•́︿•̀｡)");
                return;
            }
    
            // 空间站建造检查
            if (spaceData.spaceStation.constructionProgress < 100) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🏗️ 空间站还未建造完成呢~",
                    `📈 当前建造进度: ${spaceData.spaceStation.constructionProgress}%`,
                    "💫 请先完成空间站的建造吧~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 科研点检查
            if (spaceData.researchPoints < 50) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 科研点不足呢~",
                    `🎀 当前科研点: ${spaceData.researchPoints}`,
                    "✨ 需要科研点: 50",
                    "提示: 可以通过完成任务或购买来获得科研点哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 记录升级前数据
            const prevDurability = spaceData.spaceship.hullDurability;
            
            // 扣除科研点
            spaceData.researchPoints -= 50;
            
            // 计算升级效果
            const upgradeAmount = 10 + Math.floor(Math.random() * 5); // 10-14的随机提升
            spaceData.spaceship.hullDurability = Math.min(
                spaceData.spaceship.maxHullDurability,
                spaceData.spaceship.hullDurability + upgradeAmount
            );
    
            // 随机升级事件
            const events = [
                "✨ 发现了一种新的超级材料，升级效果特别好！",
                "🌟 遇到了一位星际工程师，获得了额外的强化！",
                "💫 意外获得了一些稀有的升级材料！",
                "🎀 舱体升级过程特别顺利呢~"
            ];
    
            // 计算额外奖励
            const rewards = {
                starDust: Math.floor(Math.random() * 15),
                happiness: Math.floor(Math.random() * 5),
                durabilityBonus: Math.floor(Math.random() * 3)
            };
    
            // 应用额外奖励
            spaceData.collection.starDust += rewards.starDust;
            spaceData.personalStats.happiness += rewards.happiness;
            spaceData.spaceship.hullDurability = Math.min(
                spaceData.spaceship.maxHullDurability,
                spaceData.spaceship.hullDurability + rewards.durabilityBonus
            );
    
            // 生成升级报告
            let upgradeReport = [
                "•*¨*•.¸¸✨¸¸.•*¨*•",
                "🚀 舱体升级报告",
                `📈 耐久度: ${prevDurability} → ${spaceData.spaceship.maxHullDurability}`,
                `💫 消耗科研点: 50`,
                `🎁 获得奖励:`,
                `   ✨ 星尘 x ${rewards.starDust}`,
                `   💝 心情值 +${rewards.happiness}`,
                `   🛡️ 额外耐久度 +${rewards.durabilityBonus}`,
                "🎀 升级过程中:",
                `   ${events[Math.floor(Math.random() * events.length)]}`,
                "•*¨*•.¸¸✨¸¸.•*¨*•"
            ];
            if (!spaceData.achievements) {
                spaceData.achievements = {};
            }
            if (!spaceData.achievements.unlocked) {
                spaceData.achievements.unlocked = [];
            }
            
            // 特殊成就检查
            if (spaceData.spaceship.hullDurability >= spaceData.spaceship.maxHullDurability) {
                upgradeReport.push(
                    "🎉 恭喜！舱体已达到最大耐久度！",
                    "💝 获得成就【坚不可摧】"
                );
                spaceData.achievements.unlocked.push("坚不可摧");
            }
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(upgradeReport.join('\n'));
    
        } catch (err) {
            logger.error(`舱体升级错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，升级过程中遇到了一些小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Upgrade_propulsion_system(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            // 操作冷却检查
            const operationKey = `space:upgrade:propulsion:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 15; // 15秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "🌟 推进器正在冷却中~",
                        `⏳ 剩余时间: ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让我们稍作休息吧~",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
    
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const spaceData = userData.spaceData;
    
            // 数据完整性检查
            if (!spaceData.spaceship || !spaceData.spaceship.propulsionEfficiency) {
                logger.error(`推进器数据异常: ${userId}`);
                await saveBanData(userId, "数据异常");
                e.reply("检测到数据异常，已暂时限制访问 (｡•́︿•̀｡)");
                return;
            }
    
            // 空间站建造检查
            if (spaceData.spaceStation.constructionProgress < 100) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🏗️ 啊哦，空间站还没建好呢~",
                    `📈 当前建造进度: ${spaceData.spaceStation.constructionProgress}%`,
                    "💫 先把空间站建好吧！",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 科研点检查
            if (spaceData.researchPoints < 50) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 科研点不够啦~",
                    `🎀 当前科研点: ${spaceData.researchPoints}`,
                    "✨ 需要科研点: 50",
                    "💭 要不要去做做任务呢？",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 记录升级前数据
            const prevEfficiency = spaceData.spaceship.propulsionEfficiency;
            
            // 扣除科研点
            spaceData.researchPoints -= 50;
            
            // 计算升级效果
            const baseUpgrade = 10;
            const luckyBonus = Math.floor(Math.random() * 5); // 0-4的随机加成
            const totalUpgrade = baseUpgrade + luckyBonus;
    
            spaceData.spaceship.propulsionEfficiency = Math.min(
                spaceData.spaceship.maxPropulsionEfficiency,
                spaceData.spaceship.propulsionEfficiency + totalUpgrade
            );
    
            // 随机升级事件
            const events = [
                "✨ 哇！发现了一个超棒的推进器零件！",
                "🌟 遇到了可爱的星际机械师，获得特别强化~",
                "💫 推进器升级产生了美丽的极光！",
                "🎀 升级过程特别顺利，效果超出预期！"
            ];
    
            // 计算额外奖励
            const rewards = {
                starDust: Math.floor(Math.random() * 20),
                happiness: Math.floor(Math.random() * 8),
                efficiencyBonus: Math.floor(Math.random() * 3)
            };
    
            // 应用奖励
            spaceData.collection.starDust += rewards.starDust;
            spaceData.personalStats.happiness += rewards.happiness;
            spaceData.spaceship.propulsionEfficiency = Math.min(
                spaceData.spaceship.maxPropulsionEfficiency,
                spaceData.spaceship.propulsionEfficiency + rewards.efficiencyBonus
            );
    
            // 生成升级报告
            let upgradeReport = [
                "•*¨*•.¸¸✨¸¸.•*¨*•",
                "🚀 推进器升级报告",
                `📈 推进效率: ${prevEfficiency}% → ${spaceData.spaceship.propulsionEfficiency}%`,
                `💫 消耗科研点: 50`,
                `🎁 获得奖励:`,
                `   ✨ 星尘 x ${rewards.starDust}`,
                `   💝 心情值 +${rewards.happiness}`,
                `   🚀 额外效率 +${rewards.efficiencyBonus}%`,
                "🎀 升级过程中:",
                `   ${events[Math.floor(Math.random() * events.length)]}`,
                "•*¨*•.¸¸✨¸¸.•*¨*•"
            ];
    
            // 特殊效果检查
            if (spaceData.spaceship.propulsionEfficiency >= spaceData.spaceship.maxPropulsionEfficiency) {
                upgradeReport.push(
                    "🎉 哇！推进器达到最大效率啦！",
                    "💝 获得成就【极速飞行】"
                );
                if (!spaceData.achievements.unlocked.includes("极速飞行")) {
                    spaceData.achievements.unlocked.push("极速飞行");
                }
            }
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(upgradeReport.join('\n'));
    
        } catch (err) {
            logger.error(`推进器升级错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，升级推进器时出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Upgrade_energy_system(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            // 操作冷却检查
            const operationKey = `space:upgrade:energy:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 20; // 20秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "⚡ 能源系统正在充能中~",
                        `⏳ 还需要 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让能源系统休息一下吧~",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
    
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const spaceData = userData.spaceData;
    
            // 数据完整性检查
            if (!spaceData.spaceship || !spaceData.spaceship.energyCapacity) {
                logger.error(`能源系统数据异常: ${userId}`);
                await saveBanData(userId, "数据异常");
                e.reply("检测到数据异常，已暂时限制访问 (｡•́︿•̀｡)");
                return;
            }
    
            // 空间站建造检查
            if (spaceData.spaceStation.constructionProgress < 100) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🏗️ 空间站还在建造中呢~",
                    `📈 当前进度: ${spaceData.spaceStation.constructionProgress}%`,
                    "💫 让我们先完成空间站的建造吧！",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 科研点检查
            if (spaceData.researchPoints < 50) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 科研点不足啦~",
                    `🎀 当前科研点: ${spaceData.researchPoints}`,
                    "✨ 需要科研点: 50",
                    "💭 要去完成一些任务补充科研点吗？",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 记录升级前数据
            const prevEnergy = spaceData.spaceship.energyCapacity;
            
            // 扣除科研点
            spaceData.researchPoints -= 50;
            
            // 计算升级效果
            const baseUpgrade = 10;
            const luckyBonus = Math.floor(Math.random() * 6); // 0-5的随机加成
            const totalUpgrade = baseUpgrade + luckyBonus;
    
            // 应用升级效果
            spaceData.spaceship.energyCapacity = Math.min(
                spaceData.spaceship.maxEnergyCapacity,
                spaceData.spaceship.energyCapacity + totalUpgrade
            );
    
            // 随机升级事件
            const events = [
                "✨ 发现了一颗能量水晶，能源效率大幅提升！",
                "🌟 偶遇星际能源大师，获得特殊改造！",
                "💫 能源系统产生了美丽的彩虹光芒！",
                "🎀 升级过程特别顺利，效果超出预期！",
                "⚡ 意外获得了稀有的能源核心！"
            ];
    
            // 计算额外奖励
            const rewards = {
                starDust: Math.floor(Math.random() * 25),
                happiness: Math.floor(Math.random() * 10),
                energyBonus: Math.floor(Math.random() * 4),
                crystals: Math.floor(Math.random() * 3)
            };
    
            // 应用奖励
            spaceData.collection.starDust += rewards.starDust;
            spaceData.personalStats.happiness += rewards.happiness;
            spaceData.collection.spaceCrystals += rewards.crystals;
            spaceData.spaceship.energyCapacity = Math.min(
                spaceData.spaceship.maxEnergyCapacity,
                spaceData.spaceship.energyCapacity + rewards.energyBonus
            );
    
            // 生成升级报告
            let upgradeReport = [
                "•*¨*•.¸¸⚡¸¸.•*¨*•",
                "🚀 能源系统升级报告",
                `📈 能源容量: ${prevEnergy} → ${spaceData.spaceship.energyCapacity}`,
                `💫 消耗科研点: 50`,
                `🎁 获得奖励:`,
                `   ✨ 星尘 x ${rewards.starDust}`,
                `   💎 空间水晶 x ${rewards.crystals}`,
                `   💝 心情值 +${rewards.happiness}`,
                `   ⚡ 额外能源 +${rewards.energyBonus}`,
                "🎀 升级过程中:",
                `   ${events[Math.floor(Math.random() * events.length)]}`,
                "•*¨*•.¸¸⚡¸¸.•*¨*•"
            ];
    
            // 特殊效果检查
            if (spaceData.spaceship.energyCapacity >= spaceData.spaceship.maxEnergyCapacity) {
                upgradeReport.push(
                    "🎉 哇！能源系统达到最大容量啦！",
                    "💝 获得成就【能源大师】"
                );
                if (!spaceData.achievements.unlocked.includes("能源大师")) {
                    spaceData.achievements.unlocked.push("能源大师");
                    spaceData.collection.starDust += 100; // 成就奖励
                    upgradeReport.push("🌟 获得成就奖励: 星尘 x 100");
                }
            }
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(upgradeReport.join('\n'));
    
        } catch (err) {
            logger.error(`能源系统升级错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，升级能源系统时遇到了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Hire_crew_member(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            // 操作冷却检查
            const operationKey = `space:hire:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 30; // 30秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "🎀 船员招聘中心正在整理简历~",
                        `⏳ 还需要 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让我们耐心等待合适的人选吧！",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
    
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const spaceData = userData.spaceData;
    
            // 数据完整性检查
            if (!spaceData.spaceship || !Array.isArray(spaceData.spaceship.crew)) {
                logger.error(`船员数据异常: ${userId}`);
                await saveBanData(userId, "数据异常");
                e.reply("检测到数据异常，已暂时限制访问 (｡•́︿•̀｡)");
                return;
            }
    
            // 检查船员数量上限
            if (spaceData.spaceship.crew.length >= spaceData.spaceship.maxCrew) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🎀 船员已经满员啦~",
                    `👥 当前船员: ${spaceData.spaceship.crew.length}/${spaceData.spaceship.maxCrew}`,
                    "💭 要不要先扩展一下船舱呢？",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 科研点检查
            if (spaceData.researchPoints < 30) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 科研点不足啦~",
                    `🎀 当前科研点: ${spaceData.researchPoints}`,
                    "✨ 需要科研点: 30",
                    "💭 要攒够招聘费用才行呢~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 扣除科研点
            spaceData.researchPoints -= 30;
    
            // 生成船员名字
            const girlNames = ["亚里莎", "早苗", "美月", "奏", "铃音", "凛", "芙兰", "小夜", "伊莉雅", "琪露诺"];
            const crewName = girlNames[Math.floor(Math.random() * girlNames.length)];
    
            // 生成船员特长
            const specializations = ["研究", "建造", "探索", "医疗", "机械", "园艺", "厨艺", "音乐"];
            const mainSpecial = specializations[Math.floor(Math.random() * specializations.length)];
            const subSpecial = specializations[Math.floor(Math.random() * specializations.length)];
    
            // 生成船员性格
            const personalities = ["活泼", "温柔", "认真", "开朗", "细心", "勇敢", "可爱", "优雅"];
            const personality = personalities[Math.floor(Math.random() * personalities.length)];
    
            // 生成船员喜好
            const hobbies = ["看书", "园艺", "烘焙", "唱歌", "画画", "织毛衣", "观星", "插花"];
            const hobby = hobbies[Math.floor(Math.random() * hobbies.length)];
    
            // 创建新船员
            const newCrewMember = {
                name: crewName,
                specialization: [mainSpecial, subSpecial],
                personality: personality,
                hobby: hobby,
                satisfaction: 70 + Math.floor(Math.random() * 20),
                workingHours: 0,
                restingHours: 0,
                performance: 60 + Math.floor(Math.random() * 20),
                level: 1,
                experience: 0,
                friendship: 0,
                joinDate: new Date().toISOString()
            };
    
            // 添加船员
            spaceData.spaceship.crew.push(newCrewMember);
    
            // 生成招募报告
            let hireReport = [
                "•*¨*•.¸¸👧¸¸.•*¨*•",
                "🎀 新船员加入报告",
                `👧 姓名: ${newCrewMember.name}`,
                `✨ 性格: ${newCrewMember.personality}`,
                `💫 主要特长: ${mainSpecial}`,
                `🌟 次要特长: ${subSpecial}`,
                `🎵 兴趣爱好: ${newCrewMember.hobby}`,
                `💝 满意度: ${newCrewMember.satisfaction}`,
                `📈 工作能力: ${newCrewMember.performance}`,
                "🎁 入职礼物:",
                "   💫 星尘 x 20",
                "   🎀 可爱发饰 x 1",
                "   🌸 太空花束 x 1",
                `💭 ${newCrewMember.name}说: "请多指教，舰长大人～"`,
                "•*¨*•.¸¸👧¸¸.•*¨*•"
            ];
    
            // 特殊事件触发
            if (newCrewMember.satisfaction >= 85) {
                hireReport.push(
                    "🌟 特别事件:",
                    `${newCrewMember.name}特别喜欢这艘船呢！`,
                    "获得额外奖励: 星尘 x 50"
                );
                spaceData.collection.starDust += 50;
            }
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(hireReport.join('\n'));
    
        } catch (err) {
            logger.error(`雇佣船员错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，招募新船员时出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Train_crew_member(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
            // 操作冷却检查
            const operationKey = `space:train:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 25; // 25秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "🎀 训练中心正在准备课程~",
                        `⏳ 还需要 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让我们给船员一点休息时间吧！",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
    
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const spaceData = userData.spaceData;
    
            // 检查船员索引
            const crewIndex = parseInt(e.msg.replace('#训练船员', '').trim());
            if (isNaN(crewIndex) || crewIndex < 0 || crewIndex >= spaceData.spaceship.crew.length) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 找不到这位船员呢~",
                    "🎀 请输入正确的船员编号",
                    `👥 当前船员数量: ${spaceData.spaceship.crew.length}`,
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 科研点检查
            if (spaceData.researchPoints < 20) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 科研点不足啦~",
                    `🎀 当前科研点: ${spaceData.researchPoints}`,
                    "✨ 需要科研点: 20",
                    "💭 要准备足够的训练资源哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 获取船员信息
            const crew = spaceData.spaceship.crew[crewIndex];
            
            // 记录训练前数据
            const prevSatisfaction = crew.satisfaction;
            const prevPerformance = crew.performance;
            const prevLevel = crew.level;
            const prevExperience = crew.experience;
    
            // 扣除科研点
            spaceData.researchPoints -= 20;
    
            // 计算训练效果
            const satisfactionIncrease = 10 + Math.floor(Math.random() * 15);
            const performanceIncrease = 8 + Math.floor(Math.random() * 12);
            const experienceGain = 20 + Math.floor(Math.random() * 30);
    
            // 应用训练效果
            crew.satisfaction = Math.min(100, crew.satisfaction + satisfactionIncrease);
            crew.performance = Math.min(100, crew.performance + performanceIncrease);
            crew.experience += experienceGain;
    
            // 检查是否升级
            const expNeeded = crew.level * 100;
            if (crew.experience >= expNeeded) {
                crew.level += 1;
                crew.experience -= expNeeded;
            }
    
            // 随机训练事件
            const events = [
                "✨ 训练中展现出了惊人的天赋！",
                "🌟 掌握了新的技能呢~",
                "💫 和其他船员配合得很默契！",
                "🎀 训练效果特别好呢！",
                "📚 认真学习的样子超可爱的~"
            ];
    
            // 生成训练报告
            let trainingReport = [
                "•*¨*•.¸¸📚¸¸.•*¨*•",
                `🎀 ${crew.name}的训练报告`,
                "📈 属性变化:",
                `   💝 满意度: ${prevSatisfaction} → ${crew.satisfaction} (+${satisfactionIncrease})`,
                `   ⭐ 表现: ${prevPerformance} → ${crew.performance} (+${performanceIncrease})`,
                `   📚 经验: +${experienceGain}`,
                `   ✨ 等级: ${prevLevel} → ${crew.level}`,
                "🎯 训练评价:",
                `   ${events[Math.floor(Math.random() * events.length)]}`,
                "•*¨*•.¸¸📚¸¸.•*¨*•"
            ];
    
            // 特殊奖励检查
            if (crew.level > prevLevel) {
                const levelUpRewards = {
                    starDust: 50 * crew.level,
                    crystals: 5 * crew.level
                };
                spaceData.collection.starDust += levelUpRewards.starDust;
                spaceData.collection.spaceCrystals += levelUpRewards.crystals;
                
                trainingReport.push(
                    "🎉 等级提升奖励:",
                    `   ✨ 星尘 x ${levelUpRewards.starDust}`,
                    `   💎 空间水晶 x ${levelUpRewards.crystals}`,
                    `💭 ${crew.name}说: "谢谢舰长的指导，我会更加努力的！"`
                );
            }
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(trainingReport.join('\n'));
    
        } catch (err) {
            logger.error(`训练船员错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，训练过程中出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Conduct_research(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
            // 操作冷却检查
            const operationKey = `space:research:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 40; // 40秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "🔬 研究设备正在预热中~",
                        `⏳ 还需要 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让我们整理一下研究笔记吧！",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const spaceData = userData.spaceData;
    
            // 获取研究主题
            const researchTopic = e.msg.replace('#进行科学研究', '').trim();
            if (!researchTopic) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 请指定研究主题哦~",
                    "🎀 例如: #进行科学研究 星辰能源",
                    "✨ 当前热门研究主题:",
                    "   💠 星辰能源",
                    "   💠 空间跃迁",
                    "   💠 生态循环",
                    "   💠 量子通讯",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 计算研究成本
            const baseCost = 50;
            const difficultyMultiplier = 1 + Math.random();
            const researchCost = Math.floor(baseCost * difficultyMultiplier);
    
            // 科研点检查
            if (spaceData.researchPoints < researchCost) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 科研点不足啦~",
                    `🎀 当前科研点: ${spaceData.researchPoints}`,
                    `✨ 需要科研点: ${researchCost}`,
                    "💭 要不要先去收集一些研究资料呢？",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 扣除科研点
            spaceData.researchPoints -= researchCost;
    
            // 计算研究进度
            const baseProgress = researchCost / 20;
            const luckBonus = Math.random() * 10;
            const totalProgress = baseProgress + luckBonus;
    
            // 记录之前的进度
            const prevProgress = spaceData.researchProgress;
            spaceData.researchProgress += totalProgress;
    
            // 研究过程随机事件
            const events = [
                "✨ 实验产生了意想不到的美丽现象！",
                "🌟 发现了新的研究方向！",
                "💫 获得了重要的实验数据！",
                "🎀 研究进展特别顺利呢！",
                "📚 整理出了很有价值的研究笔记~"
            ];
    
            // 计算研究奖励
            const rewards = {
                starDust: Math.floor(Math.random() * 30 + 20),
                crystals: Math.floor(Math.random() * 5 + 3),
                experience: Math.floor(Math.random() * 50 + 30)
            };
    
            // 应用奖励
            spaceData.collection.starDust += rewards.starDust;
            spaceData.collection.spaceCrystals += rewards.crystals;
            spaceData.personalStats.wisdom += 1;
    
            // 生成研究报告
            let researchReport = [
                "•*¨*•.¸¸🔬¸¸.•*¨*•",
                `🎀 ${researchTopic}研究报告`,
                "📈 研究数据:",
                `   💫 进度: ${prevProgress.toFixed(1)}% → ${spaceData.researchProgress.toFixed(1)}%`,
                `   📚 消耗科研点: ${researchCost}`,
                `   🌟 研究效率: ${(totalProgress/researchCost*100).toFixed(1)}%`,
                "🎁 研究成果:",
                `   ✨ 星尘 x ${rewards.starDust}`,
                `   💎 空间水晶 x ${rewards.crystals}`,
                `   📚 研究经验 +${rewards.experience}`,
                "💭 研究过程:",
                `   ${events[Math.floor(Math.random() * events.length)]}`,
                "•*¨*•.¸¸🔬¸¸.•*¨*•"
            ];
    
            // 检查研究突破
            if (spaceData.researchProgress >= 100) {
                spaceData.researchProgress = 0;
                spaceData.researchLevel += 1;
                spaceData.researchUnlockedList.push(researchTopic);
                
                // 突破奖励
                const breakthroughRewards = {
                    starDust: 100 * spaceData.researchLevel,
                    crystals: 10 * spaceData.researchLevel,
                    wisdom: 5
                };
                
                spaceData.collection.starDust += breakthroughRewards.starDust;
                spaceData.collection.spaceCrystals += breakthroughRewards.crystals;
                spaceData.personalStats.wisdom += breakthroughRewards.wisdom;
    
                researchReport.push(
                    "🎉 研究突破！",
                    `   📚 研究等级提升至 ${spaceData.researchLevel}`,
                    "🎁 突破奖励:",
                    `   ✨ 星尘 x ${breakthroughRewards.starDust}`,
                    `   💎 空间水晶 x ${breakthroughRewards.crystals}`,
                    `   💫 智慧值 +${breakthroughRewards.wisdom}`,
                    "💭 新的研究领域已解锁！"
                );
            }
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(researchReport.join('\n'));
    
        } catch (err) {
            logger.error(`科学研究错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，研究过程中出现了一点小意外呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Explore_unknown_planet(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
            // 操作冷却检查
            const operationKey = `space:explore:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 45; // 45秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "🚀 飞船正在航行中~",
                        `⏳ 还需要 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让我们欣赏一下沿途的星空吧！",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const spaceData = userData.spaceData;
    
            // 探索点检查
            if (spaceData.explorationPoints < 20) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 探索点不足啦~",
                    `🎀 当前探索点: ${spaceData.explorationPoints}`,
                    "✨ 需要探索点: 20",
                    "💭 要补充一下能源再出发哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 随机选择星球
            const planets = [
                {name: "粉红棉花糖星", type: "甜点星球", feature: "充满甜蜜的气息"},
                {name: "彩虹水晶星", type: "宝石星球", feature: "闪耀着七彩光芒"},
                {name: "梦幻花园星", type: "生态星球", feature: "遍布奇异花朵"},
                {name: "星光音乐星", type: "艺术星球", feature: "传来悦耳旋律"},
                {name: "蝴蝶精灵星", type: "魔法星球", feature: "栖息着美丽生物"}
            ];
    
            const selectedPlanet = planets[Math.floor(Math.random() * planets.length)];
    
            // 扣除探索点
            spaceData.explorationPoints -= 20;
    
            // 记录探索前进度
            const prevProgress = spaceData.spaceship.explorationProgress;
    
            // 计算探索进度
            const baseProgress = 10;
            const luckBonus = Math.random() * 5;
            const totalProgress = baseProgress + luckBonus;
    
            spaceData.spaceship.explorationProgress += totalProgress;
    
            // 探索发现
            const discoveries = [
                "✨ 发现了一片星光花海！",
                "🌟 遇见了可爱的星际生物！",
                "💫 找到了神秘的空间宝箱！",
                "🎀 采集到了稀有的星球样本！",
                "🌈 观察到了绚丽的天文现象！"
            ];
    
            // 计算探索奖励
            const rewards = {
                starDust: Math.floor(Math.random() * 40 + 30),
                crystals: Math.floor(Math.random() * 6 + 4),
                experience: Math.floor(Math.random() * 60 + 40),
                specialItem: ["星光花", "彩虹水晶", "蝴蝶标本", "音乐盒", "魔法星尘"][Math.floor(Math.random() * 5)]
            };
    
            // 应用奖励
            spaceData.collection.starDust += rewards.starDust;
            spaceData.collection.spaceCrystals += rewards.crystals;
            spaceData.collection.specialItems.push(rewards.specialItem);
    
            // 生成探索报告
            let explorationReport = [
                "•*¨*•.¸¸🚀¸¸.•*¨*•",
                `🎀 ${selectedPlanet.name}探索报告`,
                "📝 星球信息:",
                `   🌟 类型: ${selectedPlanet.type}`,
                `   💫 特征: ${selectedPlanet.feature}`,
                "📈 探索数据:",
                `   🚀 进度: ${prevProgress.toFixed(1)}% → ${spaceData.spaceship.explorationProgress.toFixed(1)}%`,
                `   ⭐ 探索效率: ${(totalProgress/20*100).toFixed(1)}%`,
                "🎁 探索收获:",
                `   ✨ 星尘 x ${rewards.starDust}`,
                `   💎 空间水晶 x ${rewards.crystals}`,
                `   🎀 特殊物品: ${rewards.specialItem}`,
                "💭 探索发现:",
                `   ${discoveries[Math.floor(Math.random() * discoveries.length)]}`,
                "•*¨*•.¸¸🚀¸¸.•*¨*•"
            ];
    
            // 检查探索突破
            if (spaceData.spaceship.explorationProgress >= 100) {
                spaceData.spaceship.explorationProgress = 0;
                spaceData.spaceship.explorationLevel += 1;
                spaceData.spaceship.explorationUnlockedList.push(selectedPlanet.name);
    
                // 突破奖励
                const breakthroughRewards = {
                    starDust: 150 * spaceData.spaceship.explorationLevel,
                    crystals: 15 * spaceData.spaceship.explorationLevel,
                    courage: 5
                };
    
                spaceData.collection.starDust += breakthroughRewards.starDust;
                spaceData.collection.spaceCrystals += breakthroughRewards.crystals;
                spaceData.personalStats.courage += breakthroughRewards.courage;
    
                explorationReport.push(
                    "🎉 探索突破！",
                    `   🚀 探索等级提升至 ${spaceData.spaceship.explorationLevel}`,
                    "🎁 突破奖励:",
                    `   ✨ 星尘 x ${breakthroughRewards.starDust}`,
                    `   💎 空间水晶 x ${breakthroughRewards.crystals}`,
                    `   💫 勇气值 +${breakthroughRewards.courage}`,
                    "💭 新的探索区域已解锁！"
                );
            }
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(explorationReport.join('\n'));
    
        } catch (err) {
            logger.error(`星球探索错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，探索过程中遇到了一些小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Build_research_facility(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
            // 操作冷却检查
            const operationKey = `space:build:research:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 60; // 60秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "🏗️ 建筑工人正在准备材料~",
                        `⏳ 还需要 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让我们先设计一下蓝图吧！",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
    
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const spaceData = userData.spaceData;
    
            // 检查是否已有研究设施
            if (spaceData.spaceStation.researchFacility) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🎀 研究设施已经建好啦~",
                    "💫 要不要去做些研究呢？",
                    "✨ 当前可研究项目:",
                    "   💠 星辰能源",
                    "   💠 空间跃迁",
                    "   💠 生态循环",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 检查太空点数
            if (spaceData.spacePoints < 100) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 太空点数不足呢~",
                    `🎀 当前点数: ${spaceData.spacePoints}`,
                    "✨ 需要点数: 100",
                    "💭 要多完成一些太空任务哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 扣除太空点数
            spaceData.spacePoints -= 100;
    
            // 建造进度计算
            const buildingProgress = Math.floor(Math.random() * 20 + 80); // 80-100的随机进度
    
            // 随机建造事件
            const events = [
                "✨ 发现了更高效的建造方法！",
                "🌟 获得了意外的材料支援！",
                "💫 遇到了热心的星际建筑师！",
                "🎀 建造过程特别顺利呢！",
                "🏗️ 发现了珍贵的建筑材料！"
            ];
    
            // 计算建造奖励
            const rewards = {
                starDust: Math.floor(Math.random() * 50 + 50),
                crystals: Math.floor(Math.random() * 8 + 7),
                researchBonus: Math.floor(Math.random() * 20 + 10)
            };
    
            // 应用奖励和效果
            spaceData.collection.starDust += rewards.starDust;
            spaceData.collection.spaceCrystals += rewards.crystals;
            spaceData.spaceStation.researchFacility = true;
            spaceData.researchPoints += rewards.researchBonus;
    
            // 生成建造报告
            let buildReport = [
                "•*¨*•.¸¸🏗️¸¸.•*¨*•",
                "🎀 研究设施建造报告",
                "📈 建造数据:",
                `   🏗️ 完成度: ${buildingProgress}%`,
                `   💫 消耗点数: 100`,
                "🎁 建造奖励:",
                `   ✨ 星尘 x ${rewards.starDust}`,
                `   💎 空间水晶 x ${rewards.crystals}`,
                `   📚 研究点 +${rewards.researchBonus}`,
                "💭 建造过程:",
                `   ${events[Math.floor(Math.random() * events.length)]}`,
                "•*¨*•.¸¸🏗️¸¸.•*¨*•"
            ];
    
            // 解锁特殊功能
            if (buildingProgress >= 100) {
                const specialFeatures = [
                    "🔬 高级研究实验室",
                    "📚 星际图书馆",
                    "💫 能源研究中心",
                    "🎀 生物研究站"
                ];
                
                buildReport.push(
                    "🎉 完美建造！解锁特殊功能:",
                    ...specialFeatures.map(f => `   ${f}`),
                    "💝 获得成就【科研先锋】"
                );
    
                if (!spaceData.achievements.unlocked.includes("科研先锋")) {
                    spaceData.achievements.unlocked.push("科研先锋");
                }
            }
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(buildReport.join('\n'));
    
        } catch (err) {
            logger.error(`研究设施建造错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，建造过程中出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Build_propulsion_facility(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            // 操作冷却检查
            const operationKey = `space:build:propulsion:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 55; // 55秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "🚀 推进设施正在准备中~",
                        `⏳ 还需要 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让我们先检查一下设计图纸吧！",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const spaceData = userData.spaceData;
    
            // 检查是否已有推进设施
            if (spaceData.spaceStation.propulsionFacility) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🎀 推进设施已经建好啦~",
                    "💫 当前设施状态:",
                    "   🚀 推进效率: 100%",
                    "   ⚡ 能源消耗: 最优",
                    "   ✨ 运行状态: 完美",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 检查太空点数
            if (spaceData.spacePoints < 100) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 太空点数不足呢~",
                    `🎀 当前点数: ${spaceData.spacePoints}`,
                    "✨ 需要点数: 100",
                    "💭 需要更多的太空探索哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 扣除太空点数
            spaceData.spacePoints -= 100;
    
            // 建造进度计算
            const buildingProgress = Math.floor(Math.random() * 20 + 80); // 80-100的随机进度
    
            // 随机建造事件
            const events = [
                "✨ 发现了超级推进材料！",
                "🌟 获得了高效推进技术！",
                "💫 遇到了推进系统专家！",
                "🎀 建造进展特别顺利！",
                "🚀 意外获得推进核心！"
            ];
    
            // 计算建造奖励
            const rewards = {
                starDust: Math.floor(Math.random() * 60 + 40),
                crystals: Math.floor(Math.random() * 10 + 5),
                propulsionBonus: Math.floor(Math.random() * 15 + 10)
            };
    
            // 应用奖励和效果
            spaceData.collection.starDust += rewards.starDust;
            spaceData.collection.spaceCrystals += rewards.crystals;
            spaceData.spaceStation.propulsionFacility = true;
            spaceData.spaceship.propulsionEfficiency += rewards.propulsionBonus;
    
            // 生成建造报告
            let buildReport = [
                "•*¨*•.¸¸🚀¸¸.•*¨*•",
                "🎀 推进设施建造报告",
                "📈 建造数据:",
                `   🏗️ 完成度: ${buildingProgress}%`,
                `   💫 消耗点数: 100`,
                "🎁 建造奖励:",
                `   ✨ 星尘 x ${rewards.starDust}`,
                `   💎 空间水晶 x ${rewards.crystals}`,
                `   🚀 推进效率 +${rewards.propulsionBonus}%`,
                "💭 建造过程:",
                `   ${events[Math.floor(Math.random() * events.length)]}`,
                "•*¨*•.¸¸🚀¸¸.•*¨*•"
            ];
    
            // 解锁特殊功能
            if (buildingProgress >= 100) {
                const specialFeatures = [
                    "🚀 超光速引擎研究",
                    "⚡ 能源优化系统",
                    "💫 空间跃迁装置",
                    "🎀 推进力场发生器"
                ];
                
                buildReport.push(
                    "🎉 完美建造！解锁特殊功能:",
                    ...specialFeatures.map(f => `   ${f}`),
                    "💝 获得成就【推进大师】"
                );
    
                if (!spaceData.achievements.unlocked.includes("推进大师")) {
                    spaceData.achievements.unlocked.push("推进大师");
                    spaceData.collection.starDust += 200;
                    buildReport.push("🌟 成就奖励: 星尘 x 200");
                }
            }
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(buildReport.join('\n'));
    
        } catch (err) {
            logger.error(`推进设施建造错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，建造过程中出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Build_energy_facility(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            // 操作冷却检查
            const operationKey = `space:build:energy:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 50; // 50秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "⚡ 能源核心正在充能中~",
                        `⏳ 还需要 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让我们先调试一下能源回路吧！",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const spaceData = userData.spaceData;
    
            // 检查是否已有能源设施
            if (spaceData.spaceStation.energyFacility) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🎀 能源设施已经建好啦~",
                    "💫 当前设施状态:",
                    "   ⚡ 能源效率: 100%",
                    "   💫 能源储存: 充足",
                    "   ✨ 运行状态: 稳定",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 检查太空点数
            if (spaceData.spacePoints < 100) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 太空点数不足呢~",
                    `🎀 当前点数: ${spaceData.spacePoints}`,
                    "✨ 需要点数: 100",
                    "💭 需要更多的能源积累哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 扣除太空点数
            spaceData.spacePoints -= 100;
    
            // 建造进度计算
            const buildingProgress = Math.floor(Math.random() * 20 + 80); // 80-100的随机进度
    
            // 随机建造事件
            const events = [
                "✨ 发现了高效能源结晶！",
                "🌟 获得了能源转换技术！",
                "💫 遇到了能源系统专家！",
                "🎀 建造效率特别高呢！",
                "⚡ 意外获得能源核心！"
            ];
    
            // 计算建造奖励
            const rewards = {
                starDust: Math.floor(Math.random() * 70 + 30),
                crystals: Math.floor(Math.random() * 12 + 3),
                energyBonus: Math.floor(Math.random() * 25 + 15)
            };
    
            // 应用奖励和效果
            spaceData.collection.starDust += rewards.starDust;
            spaceData.collection.spaceCrystals += rewards.crystals;
            spaceData.spaceStation.energyFacility = true;
            spaceData.spaceship.energyCapacity += rewards.energyBonus;
    
            // 生成建造报告
            let buildReport = [
                "•*¨*•.¸¸⚡¸¸.•*¨*•",
                "🎀 能源设施建造报告",
                "📈 建造数据:",
                `   🏗️ 完成度: ${buildingProgress}%`,
                `   💫 消耗点数: 100`,
                "🎁 建造奖励:",
                `   ✨ 星尘 x ${rewards.starDust}`,
                `   💎 空间水晶 x ${rewards.crystals}`,
                `   ⚡ 能源容量 +${rewards.energyBonus}`,
                "💭 建造过程:",
                `   ${events[Math.floor(Math.random() * events.length)]}`,
                "•*¨*•.¸¸⚡¸¸.•*¨*•"
            ];
    
            // 解锁特殊功能
            if (buildingProgress >= 100) {
                const specialFeatures = [
                    "⚡ 能源转换装置",
                    "💫 能源储存系统",
                    "✨ 能源稳定器",
                    "🎀 能源护盾生成器"
                ];
                
                buildReport.push(
                    "🎉 完美建造！解锁特殊功能:",
                    ...specialFeatures.map(f => `   ${f}`),
                    "💝 获得成就【能源专家】"
                );
    
                if (!spaceData.achievements.unlocked.includes("能源专家")) {
                    spaceData.achievements.unlocked.push("能源专家");
                    spaceData.collection.starDust += 250;
                    buildReport.push("🌟 成就奖励: 星尘 x 250");
                }
            }
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(buildReport.join('\n'));
    
        } catch (err) {
            logger.error(`能源设施建造错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，建造过程中出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Build_crew_facility(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            // 操作冷却检查
            const operationKey = `space:build:crew:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 45; // 45秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "🏠 船员休息室正在布置中~",
                        `⏳ 还需要 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让我们先准备一些可爱的装饰品吧！",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const spaceData = userData.spaceData;
    
            // 检查是否已有船员设施
            if (spaceData.spaceStation.crewFacility) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🎀 船员设施已经建好啦~",
                    "💫 当前设施状态:",
                    "   💝 舒适度: 完美",
                    "   🌟 心情值: 愉悦",
                    "   ✨ 设施等级: 豪华",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 检查太空点数
            if (spaceData.spacePoints < 100) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 太空点数不足呢~",
                    `🎀 当前点数: ${spaceData.spacePoints}`,
                    "✨ 需要点数: 100",
                    "💭 让我们多攒一些点数吧~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 扣除太空点数
            spaceData.spacePoints -= 100;
    
            // 建造进度计算
            const buildingProgress = Math.floor(Math.random() * 20 + 80); // 80-100的随机进度
    
            // 随机建造事件
            const events = [
                "✨ 找到了超舒适的家具！",
                "🌟 获得了特殊的装饰品！",
                "💫 遇到了室内设计大师！",
                "🎀 布置得特别温馨呢！",
                "🏠 发现了稀有的装修材料！"
            ];
    
            // 计算建造奖励
            const rewards = {
                starDust: Math.floor(Math.random() * 80 + 20),
                crystals: Math.floor(Math.random() * 15 + 5),
                comfortBonus: Math.floor(Math.random() * 30 + 20),
                decorations: ["可爱壁纸", "星光吊灯", "梦幻地毯", "温馨盆栽"][Math.floor(Math.random() * 4)]
            };
    
            // 应用奖励和效果
            spaceData.collection.starDust += rewards.starDust;
            spaceData.collection.spaceCrystals += rewards.crystals;
            spaceData.spaceStation.crewFacility = true;
    
            // 提升所有船员满意度
            spaceData.spaceship.crew.forEach(crew => {
                crew.satisfaction = Math.min(100, crew.satisfaction + rewards.comfortBonus);
            });
    
            // 生成建造报告
            let buildReport = [
                "•*¨*•.¸¸🏠¸¸.•*¨*•",
                "🎀 船员设施建造报告",
                "📈 建造数据:",
                `   🏗️ 完成度: ${buildingProgress}%`,
                `   💫 消耗点数: 100`,
                "🎁 建造奖励:",
                `   ✨ 星尘 x ${rewards.starDust}`,
                `   💎 空间水晶 x ${rewards.crystals}`,
                `   💝 船员满意度 +${rewards.comfortBonus}`,
                `   🎀 获得装饰: ${rewards.decorations}`,
                "💭 建造过程:",
                `   ${events[Math.floor(Math.random() * events.length)]}`,
                "•*¨*•.¸¸🏠¸¸.•*¨*•"
            ];
    
            // 解锁特殊功能
            if (buildingProgress >= 100) {
                const specialFeatures = [
                    "🎀 休闲娱乐室",
                    "💫 星光浴室",
                    "✨ 梦幻餐厅",
                    "💝 温馨花园"
                ];
                
                buildReport.push(
                    "🎉 完美建造！解锁特殊功能:",
                    ...specialFeatures.map(f => `   ${f}`),
                    "💝 获得成就【温馨港湾】"
                );
    
                if (!spaceData.achievements.unlocked.includes("温馨港湾")) {
                    spaceData.achievements.unlocked.push("温馨港湾");
                    spaceData.collection.starDust += 300;
                    buildReport.push("🌟 成就奖励: 星尘 x 300");
                }
            }
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(buildReport.join('\n'));
    
        } catch (err) {
            logger.error(`船员设施建造错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，建造过程中出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Buy_research_points(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            // 操作冷却检查
            const operationKey = `space:buy:research:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 30; // 30秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "🎀 科研商店正在补货中~",
                        `⏳ 还需要 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让我们先看看研究计划吧！",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
    
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            // 获取购买数量
            const amount = parseInt(e.msg.replace('#购买科研点', '').trim());
            if (isNaN(amount) || amount <= 0) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 请输入正确的购买数量哦~",
                    "🎀 购买方式: #购买科研点 数量",
                    "💰 科研点单价: 10金币",
                    "✨ 今日特惠: 购买50点以上赠送星尘！",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 计算价格（包含可能的折扣）
            let price = amount * 10;
            let discount = 0;
            let bonusStarDust = 0;
            let bonusCrystals = 0;
    
            // 批量购买优惠
            if (amount >= 100) {
                discount = Math.floor(price * 0.2); // 20%折扣
                bonusStarDust = Math.floor(amount * 0.5);
                bonusCrystals = Math.floor(amount * 0.1);
            } else if (amount >= 50) {
                discount = Math.floor(price * 0.1); // 10%折扣
                bonusStarDust = Math.floor(amount * 0.3);
                bonusCrystals = Math.floor(amount * 0.05);
            }
    
            const finalPrice = price - discount;
    
            // 检查金币是否足够
            if (userData.money < finalPrice) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 金币不足呢~",
                    `🎀 当前金币: ${userData.money}`,
                    `💰 需要金币: ${finalPrice}`,
                    "💭 要先去赚取一些金币吗？",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 扣除金币并添加科研点
            userData.money -= finalPrice;
            userData.spaceData.researchPoints += amount;
    
            // 添加奖励
            if (bonusStarDust > 0) {
                userData.spaceData.collection.starDust += bonusStarDust;
            }
            if (bonusCrystals > 0) {
                userData.spaceData.collection.spaceCrystals += bonusCrystals;
            }
    
            // 生成购买报告
            let purchaseReport = [
                "•*¨*•.¸¸📚¸¸.•*¨*•",
                "🎀 科研点购买报告",
                "📈 交易详情:",
                `   💫 购买数量: ${amount}点`,
                `   💰 原价: ${price}金币`,
                discount > 0 ? `   ✨ 优惠: ${discount}金币` : "",
                `   💝 实付: ${finalPrice}金币`
            ];
    
            // 添加奖励信息
            if (bonusStarDust > 0 || bonusCrystals > 0) {
                purchaseReport.push(
                    "🎁 额外奖励:",
                    bonusStarDust > 0 ? `   ✨ 星尘 x ${bonusStarDust}` : "",
                    bonusCrystals > 0 ? `   💎 空间水晶 x ${bonusCrystals}` : "",
                    "💭 批量购买真划算呢~"
                );
            }
    
            purchaseReport.push("•*¨*•.¸¸📚¸¸.•*¨*•");
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(purchaseReport.join('\n'));
    
        } catch (err) {
            logger.error(`购买科研点错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，购买过程中出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Buy_exploration_points(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            // 操作冷却检查
            const operationKey = `space:buy:exploration:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 30; // 30秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "🚀 探索商店正在整理装备~",
                        `⏳ 还需要 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让我们先规划一下探索路线吧！",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            // 获取购买数量
            const amount = parseInt(e.msg.replace('#购买探索点', '').trim());
            if (isNaN(amount) || amount <= 0) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 请输入正确的购买数量哦~",
                    "🎀 购买方式: #购买探索点 数量",
                    "💰 探索点单价: 10金币",
                    "✨ 限时活动: 购买100点以上获得神秘礼包！",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 计算价格和奖励
            let price = amount * 10;
            let discount = 0;
            let bonusItems = {
                starDust: 0,
                crystals: 0,
                mysteryBox: false,
                explorationMap: false
            };
    
            // 批量购买优惠和奖励
            if (amount >= 200) {
                discount = Math.floor(price * 0.25); // 25%折扣
                bonusItems = {
                    starDust: amount,
                    crystals: Math.floor(amount * 0.2),
                    mysteryBox: true,
                    explorationMap: true
                };
            } else if (amount >= 100) {
                discount = Math.floor(price * 0.15); // 15%折扣
                bonusItems = {
                    starDust: Math.floor(amount * 0.5),
                    crystals: Math.floor(amount * 0.1),
                    mysteryBox: true,
                    explorationMap: false
                };
            } else if (amount >= 50) {
                discount = Math.floor(price * 0.1); // 10%折扣
                bonusItems = {
                    starDust: Math.floor(amount * 0.3),
                    crystals: Math.floor(amount * 0.05),
                    mysteryBox: false,
                    explorationMap: false
                };
            }
    
            const finalPrice = price - discount;
    
            // 检查金币是否足够
            if (userData.money < finalPrice) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 金币不足呢~",
                    `🎀 当前金币: ${userData.money}`,
                    `💰 需要金币: ${finalPrice}`,
                    "💭 要先去赚取一些金币吗？",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 扣除金币并添加探索点
            userData.money -= finalPrice;
            userData.spaceData.explorationPoints += amount;
    
            // 添加奖励物品
            userData.spaceData.collection.starDust += bonusItems.starDust;
            userData.spaceData.collection.spaceCrystals += bonusItems.crystals;
    
            // 处理神秘礼包
            let mysteryRewards = [];
            if (bonusItems.mysteryBox) {
                const possibleRewards = [
                    "🎀 可爱星球指南",
                    "✨ 星际望远镜",
                    "💫 空间压缩器",
                    "🌟 星光罗盘",
                    "🚀 迷你飞船模型"
                ];
                mysteryRewards = possibleRewards
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 2);
                userData.spaceData.collection.specialItems.push(...mysteryRewards);
            }
    
            // 生成购买报告
            let purchaseReport = [
                "•*¨*•.¸¸🚀¸¸.•*¨*•",
                "🎀 探索点购买报告",
                "📈 交易详情:",
                `   💫 购买数量: ${amount}点`,
                `   💰 原价: ${price}金币`,
                discount > 0 ? `   ✨ 优惠: ${discount}金币` : "",
                `   💝 实付: ${finalPrice}金币`,
                "🎁 获得奖励:"
            ];
    
            if (bonusItems.starDust > 0) {
                purchaseReport.push(`   ✨ 星尘 x ${bonusItems.starDust}`);
            }
            if (bonusItems.crystals > 0) {
                purchaseReport.push(`   💎 空间水晶 x ${bonusItems.crystals}`);
            }
            if (mysteryRewards.length > 0) {
                purchaseReport.push("   🎉 神秘礼包内容:");
                mysteryRewards.forEach(reward => {
                    purchaseReport.push(`      ${reward}`);
                });
            }
            if (bonusItems.explorationMap) {
                purchaseReport.push("   🗺️ 获得稀有星图一张");
            }
    
            purchaseReport.push(
                "💭 探索的乐趣无穷呢~",
                "•*¨*•.¸¸🚀¸¸.•*¨*•"
            );
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(purchaseReport.join('\n'));
    
        } catch (err) {
            logger.error(`购买探索点错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，购买过程中出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Show_space_station_info(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            if (!userData.spaceData) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 还没有开始太空探险呢~",
                    "🎀 输入 #太空探索开始 开启旅程吧！",
                    "✨ 美妙的太空之旅等着你哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            const spaceStation = userData.spaceData.spaceStation;
            
            // 计算空间站状态
            const stationStatus = {
                condition: spaceStation.constructionProgress >= 100 ? "完美" : "建造中",
                atmosphere: calculateAtmosphere(spaceStation),
                efficiency: calculateEfficiency(spaceStation),
                happiness: calculateHappiness(spaceStation),
                decoration: calculateDecoration(spaceStation)
            };
    
            // 生成空间站报告
            let stationReport = [
                "•*¨*•.¸¸🏰¸¸.•*¨*•",
                "🎀 梦幻空间站状态报告",
                "📈 基础信息:",
                `   🏗️ 建造进度: ${spaceStation.constructionProgress}%`,
                `   💫 空间站状态: ${stationStatus.condition}`,
                `   🌟 空间氛围: ${stationStatus.atmosphere}`,
                `   ✨ 运行效率: ${stationStatus.efficiency}%`,
                `   💝 幸福指数: ${stationStatus.happiness}%`,
                "🎐 设施状态:",
                `   📚 研究设施: ${spaceStation.researchFacility ? '已建造 ✓' : '未建造 ✗'}`,
                `   🚀 推进设施: ${spaceStation.propulsionFacility ? '已建造 ✓' : '未建造 ✗'}`,
                `   ⚡ 能源设施: ${spaceStation.energyFacility ? '已建造 ✓' : '未建造 ✗'}`,
                `   👥 船员设施: ${spaceStation.crewFacility ? '已建造 ✓' : '未建造 ✗'}`
            ];
    
            // 添加装饰信息
            if (stationStatus.decoration.length > 0) {
                stationReport.push(
                    "🎀 当前装饰:",
                    ...stationStatus.decoration.map(item => `   ${item}`)
                );
            }
    
            // 添加特殊状态
            if (spaceStation.constructionProgress >= 100) {
                const specialFeatures = getSpecialFeatures(spaceStation);
                if (specialFeatures.length > 0) {
                    stationReport.push(
                        "✨ 特殊功能:",
                        ...specialFeatures.map(feature => `   ${feature}`)
                    );
                }
            }
    
            // 添加建议
            const suggestions = generateSuggestions(spaceStation);
            if (suggestions.length > 0) {
                stationReport.push(
                    "💭 温馨提示:",
                    ...suggestions.map(tip => `   ${tip}`)
                );
            }
    
            stationReport.push("•*¨*•.¸¸🏰¸¸.•*¨*•");
    
            e.reply(stationReport.join('\n'));
    
        } catch (err) {
            logger.error(`空间站信息显示错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，查看信息时出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }

    async Show_crew_info(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            if (!userData.spaceData) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 还没有开始太空探险呢~",
                    "🎀 输入 #太空探索开始 开启旅程吧！",
                    "✨ 可爱的船员们等着和你相遇哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            const crew = userData.spaceData.spaceship.crew;
            
            if (crew.length === 0) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🎀 还没有招募船员呢~",
                    "💫 使用 #雇佣船员 来招募可爱的伙伴吧！",
                    "✨ 一起探索浩瀚宇宙吧~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    const maxCrew = userData.spaceData.spaceship.maxCrew
            // 生成船员状态报告
            let crewReport = [
                "•*¨*•.¸¸👧¸¸.•*¨*•",
                "🎀 可爱船员状态报告",
                `📈 当前船员: ${crew.length}/${maxCrew}`,
                "✨ 详细信息:"
            ];
    
            // 为每个船员生成详细信息
            crew.forEach((member, index) => {
                const status = calculateCrewStatus(member);
                const moodIcon = getMoodIcon(member.satisfaction);
                const levelStars = "⭐".repeat(member.level || 1);
    
                crewReport.push(
                    `\n👧 船员${index + 1}: ${member.name}`,
                    `   💫 等级: ${levelStars}`,
                    `   🎀 主要特长: ${member.specialization[0]}`,
                    member.specialization[1] ? `   ✨ 次要特长: ${member.specialization[1]}` : "",
                    `   ${moodIcon} 心情: ${status.mood}`,
                    `   💝 满意度: ${member.satisfaction}%`,
                    `   📈 表现: ${member.performance}%`,
                    `   🌟 心情指数: ${status.performance}`,
                    `   💭 最近心声: ${getRandomThought(member)}`
                );
    
                // 添加特殊成就或徽章
                if (member.achievements && member.achievements.length > 0) {
                    crewReport.push(`   🏆 成就: ${member.achievements.join(', ')}`);
                }
            });
    
            // 添加团队评价
            const teamEvaluation = evaluateTeam(crew);
            crewReport.push(
                "\n✨ 团队评价:",
                `   💫 团队默契度: ${teamEvaluation.harmony}%`,
                `   🎀 整体表现: ${teamEvaluation.performance}`,
                `   💝 团队氛围: ${teamEvaluation.atmosphere}`
            );
    const spaceship = userData.spaceData.spaceship
            // 添加建议
            const suggestions = generateCrewSuggestions(crew,spaceship);
            if (suggestions.length > 0) {
                crewReport.push(
                    "\n💭 温馨建议:",
                    ...suggestions.map(tip => `   ${tip}`)
                );
            }
    
            crewReport.push("•*¨*•.¸¸👧¸¸.•*¨*•");
    
            e.reply(crewReport.join('\n'));
    
        } catch (err) {
            logger.error(`船员信息显示错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，查看船员信息时出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }
    
    async Show_research_progress(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
            if (!userData.spaceData) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 还没有开始太空探险呢~",
                    "🎀 输入 #太空探索开始 开启旅程吧！",
                    "✨ 精彩的科研之旅等着你哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 初始化默认值
            if (!userData.spaceData.spaceship) {
                userData.spaceData.spaceship = {
                    researchLevel: 1,
                    researchProgress: 0,
                    researchUnlockedList: []
                };
            }
    
            if (!userData.spaceData.spaceStation) {
                userData.spaceData.spaceStation = {
                    researchPoints: 0,
                    currentProjects: [],
                    completedProjects: []
                };
            }
    
            const research = userData.spaceData.spaceship;
            const spaceStation = userData.spaceData.spaceStation;
    
            // 计算研究效率加成
            const efficiencyBonus = calculateResearchEfficiency(spaceStation);
    
            // 生成研究进度报告
            let researchReport = [
                "•*¨*•.¸¸📚¸¸.•*¨*•",
                "🎀 梦幻科研进度报告",
                "📈 基础信息:",
                `   💫 研究等级: ${research.researchLevel || 1}`,
                `   📚 当前进度: ${(research.researchProgress || 0).toFixed(1)}%`,
                `   ⚡ 研究效率: ${efficiencyBonus}%`,
                `   💎 科研点数: ${spaceStation.researchPoints || 0}`
            ];
    
            // 显示当前研究项目
            if (spaceStation.currentProjects && spaceStation.currentProjects.length > 0) {
                researchReport.push(
                    "🔬 进行中的研究:",
                    ...spaceStation.currentProjects.map(project => 
                        `   ✨ ${project.name} (${(project.progress || 0).toFixed(1)}%)`
                    )
                );
            }
    
            // 显示已完成的研究
            if (spaceStation.completedProjects && spaceStation.completedProjects.length > 0) {
                researchReport.push(
                    "📖 已完成的研究:",
                    ...spaceStation.completedProjects.map(project => 
                        `   🌟 ${project.name}`
                    )
                );
            }
    
            // 显示解锁的研究成果
            if (research.researchUnlockedList && research.researchUnlockedList.length > 0) {
                researchReport.push(
                    "🎁 研究成果:",
                    ...research.researchUnlockedList.map(achievement => 
                        `   💫 ${achievement}`
                    )
                );
            }
    
            // 显示可研究项目
            const availableProjects = getAvailableProjects(research.researchLevel || 1);
            if (availableProjects.length > 0) {
                researchReport.push(
                    "✨ 可研究项目:",
                    ...availableProjects.map(project => 
                        `   📚 ${project.name} (需求: ${project.requirement})`
                    )
                );
            }
    
            // 研究建议
            const suggestions = generateResearchSuggestions(userData.spaceData);
            if (suggestions.length > 0) {
                researchReport.push(
                    "💭 研究建议:",
                    ...suggestions.map(tip => `   ${tip}`)
                );
            }
    
            researchReport.push("•*¨*•.¸¸📚¸¸.•*¨*•");
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            e.reply(researchReport.join('\n'));
    
        } catch (err) {
            logger.error(`科研进度显示错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，查看进度时出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }
    
    async Show_exploration_progress(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            if (!userData.spaceData) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 还没有开始太空探险呢~",
                    "🎀 输入 #太空探索开始 开启旅程吧！",
                    "✨ 浩瀚宇宙正等着被探索哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            const exploration = userData.spaceData.spaceship;
            const spaceStation = userData.spaceData.spaceStation;
    
            // 计算探索效率加成
            const efficiencyBonus = calculateExplorationEfficiency(spaceStation);
            
            // 获取当前探索状态
            const explorationStatus = getExplorationStatus(exploration);
    
            // 生成探索进度报告
            let explorationReport = [
                "•*¨*•.¸¸🚀¸¸.•*¨*•",
                "🎀 梦幻探索进度报告",
                "📈 基础信息:",
                `   💫 探索等级: ${exploration.explorationLevel}`,
                `   🚀 当前进度: ${exploration.explorationProgress.toFixed(1)}%`,
                `   ⭐ 探索效率: ${efficiencyBonus}%`,
                `   🎯 探索点数: ${spaceStation.explorationPoints}`
            ];
    
            // 显示当前探索状态
            if (exploration.currentPlanet) {
                explorationReport.push(
                    "🌍 当前探索:",
                    `   🎀 所在星球: ${exploration.currentPlanet}`,
                    `   💫 探索状态: ${explorationStatus.status}`,
                    `   ✨ 特殊发现: ${explorationStatus.discovery}`
                );
            }
    
            // 显示已探索星球
            if (exploration.explorationUnlockedList.length > 0) {
                explorationReport.push(
                    "🗺️ 已探索星球:",
                    ...exploration.explorationUnlockedList.map(planet => 
                        `   🌟 ${planet}`
                    )
                );
            }
    
            // 显示可探索星球
            const availablePlanets = getAvailablePlanets(exploration.explorationLevel);
            if (availablePlanets.length > 0) {
                explorationReport.push(
                    "✨ 可探索星球:",
                    ...availablePlanets.map(planet => 
                        `   🎀 ${planet.name} (难度: ${planet.difficulty})`
                    )
                );
            }
    
            // 显示收集物品
            if (userData.spaceData.collection) {
                explorationReport.push(
                    "💝 探索收获:",
                    `   ✨ 星尘: ${userData.spaceData.collection.starDust}`,
                    `   💎 空间水晶: ${userData.spaceData.collection.spaceCrystals}`,
                    "🎁 特殊物品:",
                    ...getSpecialItems(userData.spaceData.collection)
                );
            }
    
            // 探索建议
            const suggestions = generateExplorationSuggestions(userData.spaceData);
            if (suggestions.length > 0) {
                explorationReport.push(
                    "💭 探索建议:",
                    ...suggestions.map(tip => `   ${tip}`)
                );
            }
    
            explorationReport.push("•*¨*•.¸¸🚀¸¸.•*¨*•");
    
            e.reply(explorationReport.join('\n'));
    
        } catch (err) {
            logger.error(`探索进度显示错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，查看进度时出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }
    
    async Show_tasks(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            if (!userData.spaceData) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 还没有开始太空探险呢~",
                    "🎀 输入 #太空探索开始 开启旅程吧！",
                    "✨ 有趣的任务正等着你哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 更新每日任务
            await updateDailyTasks(userData);
    
            // 任务分类和统计
            const taskStats = categorizeAndCountTasks(userData.spaceData.tasks);
    
            // 生成任务报告
            let taskReport = [
                "•*¨*•.¸¸📝¸¸.•*¨*•",
                "🎀 梦幻太空任务面板",
                "📊 任务统计:",
                `   💫 总任务数: ${taskStats.total}`,
                `   ✨ 已完成: ${taskStats.completed}`,
                `   🎯 进行中: ${taskStats.inProgress}`,
                `   ⭐ 完成率: ${((taskStats.completed / taskStats.total) * 100).toFixed(1)}%`
            ];
    
            // 显示每日任务
            if (taskStats.dailyTasks.length > 0) {
                taskReport.push(
                    "🌟 今日任务:",
                    ...taskStats.dailyTasks.map(task => formatTaskInfo(task))
                );
            }
    
            // 显示主线任务
            if (taskStats.mainTasks.length > 0) {
                taskReport.push(
                    "🚀 主线任务:",
                    ...taskStats.mainTasks.map(task => formatTaskInfo(task))
                );
            }
    
            // 显示支线任务
            if (taskStats.sideTasks.length > 0) {
                taskReport.push(
                    "💫 支线任务:",
                    ...taskStats.sideTasks.map(task => formatTaskInfo(task))
                );
            }
    
            // 显示特殊任务
            if (taskStats.specialTasks.length > 0) {
                taskReport.push(
                    "✨ 特殊任务:",
                    ...taskStats.specialTasks.map(task => formatTaskInfo(task))
                );
            }
    
            // 显示任务奖励预览
            taskReport.push(
                "🎁 任务奖励预览:",
                ...getTaskRewardPreview(taskStats)
            );
    
            // 任务提示
            const taskTips = generateTaskTips(userData.spaceData);
            if (taskTips.length > 0) {
                taskReport.push(
                    "💭 任务小贴士:",
                    ...taskTips.map(tip => `   ${tip}`)
                );
            }
    
            taskReport.push("•*¨*•.¸¸📝¸¸.•*¨*•");
    
            e.reply(taskReport.join('\n'));
    
        } catch (err) {
            logger.error(`任务列表显示错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，查看任务时出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }
    
    async Complete_task(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            // 操作冷却检查
            const operationKey = `space:complete:task:${userId}`;
            const lastOperation = await redis.get(operationKey);
            if (lastOperation) {
                const cooldown = 10; // 10秒冷却时间
                const timeDiff = Date.now() - parseInt(lastOperation);
                if (timeDiff < cooldown * 1000) {
                    e.reply([
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                        "🎀 任务奖励正在准备中~",
                        `⏳ 还需要 ${((cooldown * 1000 - timeDiff) / 1000).toFixed(1)}秒`,
                        "💭 让我们稍等一下下吧！",
                        "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                    ].join('\n'));
                    return;
                }
            }
    
            await redis.set(operationKey, Date.now(), 'EX', 300);
    
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            // 获取任务名称
            const taskName = e.msg.replace('#完成任务', '').trim();
            if (!taskName) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 请输入要完成的任务名称哦~",
                    "🎀 例如: #完成任务 星尘收集",
                    "✨ 可以使用 #获取任务列表 查看所有任务~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 查找任务
            const taskIndex = userData.spaceData.tasks.findIndex(t => t.name === taskName);
            if (taskIndex === -1) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 找不到这个任务呢~",
                    "🎀 请检查任务名称是否正确",
                    "✨ 或者使用 #获取任务列表 查看可用任务",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            const task = userData.spaceData.tasks[taskIndex];
    
            // 检查任务是否完成
            if (task.progress < task.target) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "💫 这个任务还没有完成呢~",
                    `🎀 当前进度: ${task.progress}/${task.target}`,
                    "✨ 继续加油完成任务吧！",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 计算奖励
            const baseReward = calculateBaseReward(task);
            const bonusReward = calculateBonusReward(task, userData.spaceData);
            const totalReward = combinedRewards(baseReward, bonusReward);
    
            // 应用奖励
            applyRewards(userData.spaceData, totalReward);
    
            // 任务完成特效
            const completionEffects = generateCompletionEffects(task);
    
            // 更新成就
            updateAchievements(userData.spaceData, task);
    
            // 移除已完成任务
            userData.spaceData.tasks.splice(taskIndex, 1);
    
            // 生成完成报告
            let completionReport = [
                "•*¨*•.¸¸🎉¸¸.•*¨*•",
                "🎀 任务完成报告",
                `💫 任务名称: ${task.name}`,
                "🎁 获得奖励:",
                ...formatRewardList(totalReward),
                "✨ 完成特效:",
                ...completionEffects,
                "•*¨*•.¸¸🎉¸¸.•*¨*•"
            ];
    
            // 检查连续完成奖励
            const streakBonus = checkStreakBonus(userData.spaceData);
            if (streakBonus) {
                completionReport.splice(-1, 0, 
                    "🌟 连续完成奖励:",
                    ...formatRewardList(streakBonus)
                );
                applyRewards(userData.spaceData, streakBonus);
            }
    
            // 更新数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(completionReport.join('\n'));
    
        } catch (err) {
            logger.error(`完成任务错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，完成任务时出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }
    
    async Daily_space_gift(e) {
        const userId = e.user_id;
        try {
            let userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) {
                e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
                return;
            }
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId , e);
                return;
            }
    
            if (!userData.spaceData) {
                await this.Start_space_exploration(e);
                return;
            }
    
            const today = new Date().toISOString().split('T')[0];
            
            // 检查是否已经签到
            if (userData.spaceData.lastSignInDate === today) {
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🎀 今天已经签到过啦~",
                    "💫 明天再来领取礼物吧！",
                    "✨ 记得每天都来签到哦~",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
    
            // 计算连续签到天数
            let streak = 1;
            if (userData.spaceData.signInStreak) {
                const lastDate = new Date(userData.spaceData.lastSignInDate);
                const currentDate = new Date(today);
                const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    streak = userData.spaceData.signInStreak + 1;
                }
            }
            userData.spaceData.signInStreak = streak;
    
            // 计算基础奖励
            const baseRewards = {
                starDust: 50,
                spaceCrystals: 5,
                spacePoints: 50,
                explorationPoints: 20,
                researchPoints: 20
            };
    
            // 计算连续签到奖励
            const streakBonus = calculateStreakBonus(streak);
    
            // 计算特殊日期奖励
            const specialBonus = calculateSpecialDateBonus(today);
    
            // 随机特殊物品
            const specialItem = getRandomSpecialItem();
    
            // 应用所有奖励
            applyDailyRewards(userData.spaceData, baseRewards, streakBonus, specialBonus, specialItem);
    
            // 生成签到报告
            let signInReport = [
                "•*¨*•.¸¸🎁¸¸.•*¨*•",
                "🎀 每日太空礼物",
                `💫 连续签到: ${streak}天`,
                "✨ 基础奖励:",
                ...formatDailyRewards(baseRewards),
                "🌟 连续签到奖励:",
                ...formatDailyRewards(streakBonus)
            ];
    
            // 添加特殊日期奖励
            if (specialBonus) {
                signInReport.push(
                    "🎉 特殊日期奖励:",
                    ...formatDailyRewards(specialBonus)
                );
            }
    
            // 添加特殊物品
            if (specialItem) {
                signInReport.push(
                    "🎁 今日特殊物品:",
                    `   ${specialItem.icon} ${specialItem.name}`
                );
            }
    
            // 添加签到语录
            const dailyQuotes = getDailyQuotes();
            signInReport.push(
                "💭 今日寄语:",
                `   ${dailyQuotes}`,
                "•*¨*•.¸¸🎁¸¸.•*¨*•"
            );
    
            // 更新数据
            userData.spaceData.lastSignInDate = today;
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
    
            e.reply(signInReport.join('\n'));
    
        } catch (err) {
            logger.error(`每日礼物领取错误: ${err}`);
            await saveBanData(userId, "系统错误");
            e.reply("哎呀，领取礼物时出现了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
            return;
        }
    }
    
// 商店系统
async Show_space_store(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }
        const storeCategories = {
            "🎀 梦幻装饰": [
                {id: 1, name: "星光投影灯", price: 100, desc: "能让房间充满梦幻星光~", effect: "提升心情值5%", quality: "可爱"},
                {id: 2, name: "彩虹音乐盒", price: 150, desc: "会播放治愈系音乐哦", effect: "提升满意度8%", quality: "精致"},
                {id: 3, name: "蝴蝶挂饰", price: 80, desc: "闪闪发光的装饰品呢", effect: "提升氛围值3%", quality: "普通"},
                {id: 4, name: "梦幻床品套装", price: 200, desc: "超柔软的床上用品~", effect: "提升休息效果10%", quality: "精致"},
                {id: 5, name: "猫咪抱枕", price: 120, desc: "可爱的治愈系抱枕", effect: "提升心情值6%", quality: "可爱"}
            ],

            "💫 实用道具": [
                {id: 6, name: "能源补充包", price: 200, desc: "闪耀的能源结晶~", effect: "恢复能源50点", quality: "实用"},
                {id: 7, name: "维修箱", price: 180, desc: "粉色的维修工具箱", effect: "修复耐久20点", quality: "实用"},
                {id: 8, name: "治愈系医疗包", price: 250, desc: "可爱的医疗用品", effect: "治愈状态异常", quality: "高级"},
                {id: 9, name: "清洁机器人", price: 300, desc: "会打扫的小可爱", effect: "提升整洁度15%", quality: "高级"},
                {id: 10, name: "智能助手", price: 350, desc: "贴心的电子助理", effect: "提升工作效率10%", quality: "精致"}
            ],

            "✨ 特殊珍品": [
                {id: 11, name: "星光收集瓶", price: 300, desc: "能装下整片星空呢", effect: "提升星尘获取20%", quality: "稀有"},
                {id: 12, name: "彩虹护盾", price: 500, desc: "七彩的防护罩哦", effect: "提供保护效果", quality: "稀有"},
                {id: 13, name: "梦幻翅膀", price: 800, desc: "闪耀的装饰翅膀", effect: "提升移动速度30%", quality: "限定"},
                {id: 14, name: "时空相机", price: 1000, desc: "能拍下美好回忆", effect: "记录特殊事件", quality: "限定"},
                {id: 15, name: "幸运星星", price: 600, desc: "会带来好运的星星", effect: "提升幸运值15%", quality: "稀有"}
            ],

            "🌸 季节限定": [
                {id: 16, name: "樱花发饰", price: 400, desc: "春季限定装饰品", effect: "特殊外观效果", quality: "限定"},
                {id: 17, name: "夏日清凉扇", price: 350, desc: "夏季限定道具", effect: "提供清凉效果", quality: "限定"},
                {id: 18, name: "枫叶收藏册", price: 450, desc: "秋季限定收藏品", effect: "收集秋日回忆", quality: "限定"},
                {id: 19, name: "雪花球", price: 500, desc: "冬季限定装饰", effect: "营造冬日氛围", quality: "限定"},
                {id: 20, name: "节日礼盒", price: 888, desc: "节日特别版礼物", effect: "随机特殊奖励", quality: "限定"}
            ]
        };

        // 生成商店展示信息
        let storeDisplay = [
            "•*¨*•.¸¸🎀¸¸.•*¨*•",
            "✨ 梦幻太空商店 ✨",
            "欢迎光临~这里有许多可爱的商品等着你哦~",
            "今日店员: 小花 (◕‿◕✿)"
        ];

        // 添加每个分类的商品信息
        for (const [category, items] of Object.entries(storeCategories)) {
            storeDisplay.push(`\n${category}:`);
            items.forEach(item => {
                storeDisplay.push(
                    `   ${item.id}. ${item.name}`,
                    `      💰 价格: ${item.price} 金币`,
                    `      💫 说明: ${item.desc}`,
                    `      ✨ 效果: ${item.effect}`,
                    `      🌟 品质: ${item.quality}`,
                    ""
                );
            });
        }

        // 添加购物提示
        storeDisplay.push(
            "💝 购买方式: #购买太空装备 [物品ID]",
            "🎀 今日优惠活动:",
            "   ✧ 单次购买满500金币减免50金币",
            "   ✧ 购买任意3件商品享受85折优惠",
            "   ✧ 限定商品可累计积分哦~",
            "",
            "🌸 温馨提示:",
            "   ✧ 每日商品库存有限,先到先得哦",
            "   ✧ 部分商品购买后有概率获得特殊赠品",
            "   ✧ 累计消费可提升会员等级享受更多优惠",
            "",
            "💫 小花: 欢迎随时来逛逛,我会为你推荐最适合的商品呢~",
            "•*¨*•.¸¸🎀¸¸.•*¨*•"
        );

        e.reply(storeDisplay.join('\n'));

    } catch (err) {
        console.error(err);
        e.reply("哎呀,商店出了一点小问题呢~ 请稍后再来逛逛吧 (｡•́︿•̀｡)");
    }
}

// 购买系统
async Buy_space_equipment(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        const itemId = parseInt(e.msg.replace('#购买太空装备', '').trim());
        if (isNaN(itemId)) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "💫 亲爱的顾客~",
                "🎀 请输入想购买的商品编号哦",
                "✨ 例如: #购买太空装备 1",
                "💝 可以输入 #太空商店 查看全部商品呢",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 获取商品信息
        const item = getItemInfo(itemId);
        if (!item) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "💫 抱歉呢~",
                "🎀 没有找到这个商品编号",
                "✨ 要不要看看其他可爱的商品呢?",
                "💝 小花会为你推荐哦~",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 计算折扣
        const discount = calculateDiscount(userData, item);
        const finalPrice = Math.floor(item.price * discount.rate);

        // 检查余额
        if (userData.money < finalPrice) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "💫 对不起呢~",
                `🎀 当前余额: ${userData.money} 金币`,
                `💰 商品价格: ${finalPrice} 金币`,
                "✨ 要不要先去赚取一些金币呢?",
                "💝 小花会为你留着这件商品的~",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 处理购买
        userData.money -= finalPrice;
        userData.spaceData.dailyPurchases = (userData.spaceData.dailyPurchases || 0) + 1;

        // 添加物品效果
        const effectResult = applyItemEffect(userData.spaceData, item);

        // 检查是否获得赠品
        const gift = checkForGift(item);

        // 生成购买报告
        let purchaseReport = [
            "•*¨*•.¸¸🛍️¸¸.•*¨*•",
            "🎀 购物成功报告 🎀",
            "",
            "💝 商品信息:",
            `   ✧ 名称: ${item.name}`,
            `   ✧ 品质: ${item.quality}`,
            "",
            "💰 交易详情:",
            `   ✧ 原价: ${item.price} 金币`,
            `   ✧ 折扣: ${discount.desc}`,
            `   ✧ 实付: ${finalPrice} 金币`,
            "",
            "✨ 物品效果:",
            `   ✧ ${effectResult.desc}`,
            "",
            "🌟 购物特效:",
            `   ✧ ${getRandomPurchaseEffect()}`
        ];

        // 添加赠品信息
        if (gift) {
            purchaseReport.push(
                "",
                "🎁 意外惊喜:",
                `   ✧ 获得赠品: ${gift.name}`,
                `   ✧ 赠品效果: ${gift.effect}`
            );
        }

        // 添加会员信息
        const memberInfo = updateMembershipInfo(userData);
        if (memberInfo.levelUp) {
            purchaseReport.push(
                "",
                "💫 会员信息:",
                `   ✧ 当前等级: ${memberInfo.level}`,
                `   ✧ 升级奖励: ${memberInfo.reward}`
            );
        }

        purchaseReport.push(
            "",
            "💕 小花: 感谢惠顾,欢迎下次再来哦~",
            "•*¨*•.¸¸🛍️¸¸.•*¨*•"
        );

        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        e.reply(purchaseReport.join('\n'));

    } catch (err) {
        console.error(err);
        e.reply("哎呀,购买过程中出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
    }
}

   // 飞船维修系统
async Repair_spaceship(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        // 检查维修冷却
        const lastRepair = userData.spaceData.spaceship.lastMaintenanceDate;
        if (lastRepair) {
            const cooldown = 3600000; // 1小时冷却
            const timePassed = Date.now() - new Date(lastRepair).getTime();
            if (timePassed < cooldown) {
                const remainingTime = Math.ceil((cooldown - timePassed) / 60000);
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🎀 维修小提示",
                    "💫 维修设备还在冷却中呢~",
                    `✨ 剩余时间: ${remainingTime}分钟`,
                    "💝 让我们先去做点别的吧!",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
        }

        // 获取飞船状态
        const spaceship = userData.spaceData.spaceship;
        const currentDurability = spaceship.hullDurability;
        const maxDurability = spaceship.maxHullDurability;

        // 检查是否需要维修
        if (currentDurability >= maxDurability) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🎀 维修小提示",
                "💫 飞船状态非常完美呢!",
                "✨ 当前耐久度: 100%",
                "💝 不需要维修啦~",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 计算维修费用和效果
        const damagePercent = 1 - (currentDurability / maxDurability);
        const baseRepairCost = 100;
        const repairCost = Math.ceil(baseRepairCost * damagePercent);

        // 检查太空点数
        if (userData.spaceData.spacePoints < repairCost) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🎀 维修小提示",
                `💫 需要 ${repairCost} 太空点数`,
                `✨ 当前点数: ${userData.spaceData.spacePoints}`,
                "💝 先去收集一些太空点数吧~",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 随机维修事件
        const repairEvents = [
            {event: "发现了一些可爱的小零件!", bonus: 5},
            {event: "维修机器人哼着歌帮忙~", bonus: 8},
            {event: "使用了特殊的闪亮修复剂!", bonus: 10},
            {event: "维修过程特别顺利呢!", bonus: 12},
            {event: "获得了维修大师的帮助!", bonus: 15}
        ];
        
        const randomEvent = repairEvents[Math.floor(Math.random() * repairEvents.length)];

        // 计算维修效果
        const baseRepairAmount = Math.ceil(maxDurability * 0.3); // 基础修复30%
        const bonusRepairAmount = Math.ceil(maxDurability * (randomEvent.bonus / 100));
        const totalRepairAmount = Math.min(
            maxDurability - currentDurability,
            baseRepairAmount + bonusRepairAmount
        );

        // 执行维修
        userData.spaceData.spacePoints -= repairCost;
        spaceship.hullDurability += totalRepairAmount;
        spaceship.lastMaintenanceDate = new Date().toISOString();

        // 记录维修历史
        spaceship.maintenanceHistory.push({
            date: new Date().toISOString(),
            type: "常规维修",
            cost: repairCost,
            repairAmount: totalRepairAmount,
            event: randomEvent.event
        });

        // 检查是否获得维修成就
        const achievement = checkRepairAchievement(userData.spaceData);

        // 生成维修报告
        let repairReport = [
            "•*¨*•.¸¸🔧¸¸.•*¨*•",
            "🎀 飞船维修报告 🎀",
            "",
            "💫 维修数据:",
            `   ✧ 原始耐久: ${currentDurability}/${maxDurability}`,
            `   ✧ 修复数值: +${totalRepairAmount}`,
            `   ✧ 当前耐久: ${spaceship.hullDurability}/${maxDurability}`,
            "",
            "💰 维修详情:",
            `   ✧ 消耗点数: ${repairCost}`,
            `   ✧ 剩余点数: ${userData.spaceData.spacePoints}`,
            "",
            "✨ 维修过程:",
            `   ✧ ${randomEvent.event}`,
            `   ✧ 获得额外修复: +${bonusRepairAmount}`,
            "",
            "🌟 维修效果:",
            `   ✧ ${getRepairEffectDescription(totalRepairAmount, maxDurability)}`
        ];

        // 添加成就信息
        if (achievement) {
            repairReport.push(
                "",
                "🏆 维修成就:",
                `   ✧ 解锁成就: ${achievement.name}`,
                `   ✧ 奖励: ${achievement.reward}`
            );
        }

        // 添加维修建议
        const suggestions = generateRepairSuggestions(spaceship);
        if (suggestions.length > 0) {
            repairReport.push(
                "",
                "💝 维修建议:",
                ...suggestions.map(s => `   ✧ ${s}`)
            );
        }

        repairReport.push(
            "",
            "💕 维修完成啦!记得定期检查飞船状态哦~",
            "•*¨*•.¸¸🔧¸¸.•*¨*•"
        );

        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        e.reply(repairReport.join('\n'));

    } catch (err) {
        console.error(err);
        e.reply("哎呀,维修过程中出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
    }
}
    // 太空医疗系统
async Space_medical_treatment(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        // 检查医疗冷却
        const lastTreatment = userData.spaceData.spaceship.lastMedicalDate;
        if (lastTreatment) {
            const cooldown = 1800000; // 30分钟冷却
            const timePassed = Date.now() - new Date(lastTreatment).getTime();
            if (timePassed < cooldown) {
                const remainingTime = Math.ceil((cooldown - timePassed) / 60000);
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🏥 医疗小提示",
                    "💝 医疗设备还在消毒中呢~",
                    `✨ 剩余时间: ${remainingTime}分钟`,
                    "🌸 让我们先去休息一下吧!",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
        }

        const spaceship = userData.spaceData.spaceship;
        
        // 检查健康状态
        if (spaceship.healthStatus === "良好" && !spaceship.spaceDisease) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🏥 健康检查报告",
                "💝 所有船员都很健康呢!",
                "✨ 当前状态: 完美",
                "🌸 继续保持哦~",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 计算治疗费用
        const baseCost = 50;
        let treatmentCost = baseCost;
        if (spaceship.spaceDisease) {
            treatmentCost *= 2;
        }

        // 检查太空点数
        if (userData.spaceData.spacePoints < treatmentCost) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🏥 医疗小提示",
                `💝 需要 ${treatmentCost} 太空点数`,
                `✨ 当前点数: ${userData.spaceData.spacePoints}`,
                "🌸 先去收集一些太空点数吧~",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 随机治疗事件
        const treatmentEvents = [
            {event: "使用了温暖的治愈光束~", bonus: "恢复速度+10%"},
            {event: "喝下了甜甜的草莓药剂!", bonus: "心情值+5"},
            {event: "得到了可爱护士的特别照顾!", bonus: "治愈效果+15%"},
            {event: "使用了最新的彩虹治疗仪~", bonus: "免疫力+8%"},
            {event: "收到了治愈系音乐疗法!", bonus: "压力值-10%"}
        ];

        const randomEvent = treatmentEvents[Math.floor(Math.random() * treatmentEvents.length)];

        // 执行治疗
        userData.spaceData.spacePoints -= treatmentCost;
        spaceship.healthStatus = "良好";
        spaceship.spaceDisease = null;
        spaceship.spaceDiseaseSymptoms = null;
        spaceship.lastMedicalDate = new Date().toISOString();

        // 生成治疗报告
        let treatmentReport = [
            "•*¨*•.¸¸🏥¸¸.•*¨*•",
            "🎀 太空医疗报告 🎀",
            "",
            "💝 治疗过程:",
            `   ✧ ${randomEvent.event}`,
            `   ✧ 特殊效果: ${randomEvent.bonus}`,
            "",
            "✨ 治疗效果:",
            "   ✧ 健康状态: 已恢复良好",
            "   ✧ 异常状态: 已清除",
            "",
            "💰 治疗详情:",
            `   ✧ 消耗点数: ${treatmentCost}`,
            `   ✧ 剩余点数: ${userData.spaceData.spacePoints}`
        ];

        // 随机获得医疗礼包
        const medicalGift = getMedicalGift();
        if (medicalGift) {
            treatmentReport.push(
                "",
                "🎁 医疗礼包:",
                `   ✧ ${medicalGift.name}`,
                `   ✧ 效果: ${medicalGift.effect}`
            );
            applyMedicalGift(userData.spaceData, medicalGift);
        }

        // 健康建议
        const healthTips = generateHealthTips();
        treatmentReport.push(
            "",
            "💌 健康小贴士:",
            ...healthTips.map(tip => `   ✧ ${tip}`)
        );

        treatmentReport.push(
            "",
            "🌸 治疗完成啦!要好好保重身体哦~",
            "•*¨*•.¸¸🏥¸¸.•*¨*•"
        );

        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        e.reply(treatmentReport.join('\n'));

    } catch (err) {
        console.error(err);
        e.reply("哎呀,治疗过程中出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
    }
}
   // 太空采集系统
async Space_collection(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        // 检查采集冷却
        const lastCollection = userData.spaceData.lastCollectionTime;
        if (lastCollection) {
            const cooldown = 900000; // 15分钟冷却
            const timePassed = Date.now() - new Date(lastCollection).getTime();
            if (timePassed < cooldown) {
                const remainingTime = Math.ceil((cooldown - timePassed) / 60000);
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🌸 采集小提示",
                    "💝 采集工具还在充能中~",
                    `✨ 剩余时间: ${remainingTime}分钟`,
                    "🎀 让我们先去整理背包吧!",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
        }

        // 检查是否在可采集星球
        if (!userData.spaceData.spaceship.currentPlanet) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🌸 采集小提示",
                "💝 需要先找到可以采集的星球哦~",
                "✨ 试试探索新的星球吧!",
                "🎀 说不定会有意外发现呢~",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 检查太空点数
        if (userData.spaceData.spacePoints < 20) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🌸 采集小提示",
                "💝 需要20太空点数",
                `✨ 当前点数: ${userData.spaceData.spacePoints}`,
                "🎀 先去收集一些太空点数吧~",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 随机采集事件
        const collectionEvents = [
            {event: "发现了一片星光花海!", bonus: "采集效率+20%"},
            {event: "遇到了可爱的太空生物!", bonus: "额外收获+15%"},
            {event: "找到了稀有的彩虹矿石!", bonus: "稀有度+25%"},
            {event: "偶遇了友好的采集机器人!", bonus: "采集速度+30%"},
            {event: "触发了幸运采集时刻!", bonus: "双倍收获"}
        ];

        const randomEvent = collectionEvents[Math.floor(Math.random() * collectionEvents.length)];

        // 计算采集收获
        const baseCollectionAmount = Math.floor(Math.random() * 30) + 20;
        const bonusAmount = Math.floor(baseCollectionAmount * 0.3);
        const totalAmount = baseCollectionAmount + bonusAmount;

        // 随机采集物品
        const collectedItems = generateCollectedItems(totalAmount);

        // 执行采集
        userData.spaceData.spacePoints -= 20;
        userData.spaceData.lastCollectionTime = new Date().toISOString();
        addCollectedItems(userData.spaceData, collectedItems);

        // 生成采集报告
        let collectionReport = [
            "•*¨*•.¸¸🌸¸¸.•*¨*•",
            "🎀 太空采集报告 🎀",
            "",
            "💝 采集过程:",
            `   ✧ ${randomEvent.event}`,
            `   ✧ 特殊效果: ${randomEvent.bonus}`,
            "",
            "✨ 采集收获:",
            ...formatCollectedItems(collectedItems),
            "",
            "💰 采集详情:",
            `   ✧ 消耗点数: 20`,
            `   ✧ 剩余点数: ${userData.spaceData.spacePoints}`
        ];

        // 检查是否触发特殊发现
        const specialDiscovery = checkSpecialDiscovery();
        if (specialDiscovery) {
            collectionReport.push(
                "",
                "🌟 特殊发现:",
                `   ✧ ${specialDiscovery.name}`,
                `   ✧ ${specialDiscovery.description}`
            );
            applySpecialDiscovery(userData.spaceData, specialDiscovery);
        }

        // 背包提示
        const backpackStatus = checkBackpackStatus(userData.spaceData);
        if (backpackStatus.nearFull) {
            collectionReport.push(
                "",
                "💫 背包提示:",
                `   ✧ 当前容量: ${backpackStatus.current}/${backpackStatus.max}`,
                "   ✧ 记得及时整理背包哦~"
            );
        }

        collectionReport.push(
            "",
            "🎀 采集完成啦!收获满满呢~",
            "•*¨*•.¸¸🌸¸¸.•*¨*•"
        );

        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        e.reply(collectionReport.join('\n'));

    } catch (err) {
        console.error(err);
        e.reply("哎呀,采集过程中出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
    }
}
    // 太空市场售卖系统
async Sell_space_equipment(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        // 检查是否在交易站
        if (!userData.spaceData.isAtTradeStation) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🏪 交易小提示",
                "💝 需要先到达交易站哦~",
                "✨ 可以使用太空旅行功能",
                "🎀 寻找附近的交易站呢",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 获取要售卖的物品ID
        const itemId = parseInt(e.msg.replace('#太空市场售卖', '').trim());
        if (isNaN(itemId)) {
            // 显示背包物品列表
            showInventory(userData.spaceData, e);
            return;
        }

        // 查找物品
        const itemIndex = userData.spaceData.inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🏪 交易小提示",
                "💝 找不到这个物品呢~",
                "✨ 请检查物品编号是否正确",
                "🎀 可以重新查看背包哦",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        const item = userData.spaceData.inventory[itemIndex];

        // 计算售价
        const marketPrice = calculateMarketPrice(item);
        const bonusPrice = calculateBonusPrice(userData.spaceData, item);
        const finalPrice = marketPrice + bonusPrice;

        // 确认售卖
        const confirmMessage = [
            "•*¨*•.¸¸💰¸¸.•*¨*•",
            "🎀 物品售卖确认 🎀",
            "",
            "💝 物品信息:",
            `   ✧ 名称: ${item.name}`,
            `   ✧ 品质: ${item.quality || '普通'}`,
            `   ✧ 稀有度: ${item.rarity || '普通'}`,
            "",
            "💰 价格详情:",
            `   ✧ 基础价格: ${marketPrice}金币`,
            `   ✧ 额外加成: ${bonusPrice}金币`,
            `   ✧ 最终售价: ${finalPrice}金币`,
            "",
            "✨ 确认售卖请发送: #确认售卖",
            "🎀 取消售卖请发送: #取消售卖",
            "•*¨*•.¸¸💰¸¸.•*¨*•"
        ].join('\n');

        // 保存交易信息到临时存储
        userData.spaceData.pendingSale = {
            itemIndex,
            finalPrice,
            timestamp: Date.now()
        };

        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        e.reply(confirmMessage);

    } catch (err) {
        console.error(err);
        e.reply("哎呀,交易过程中出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
    }
}

   // 太空天气预报系统
async Space_weather_forecast(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        // 检查预报冷却
        const lastForecast = userData.spaceData.lastWeatherForecast;
        if (lastForecast) {
            const cooldown = 1800000; // 30分钟冷却
            const timePassed = Date.now() - new Date(lastForecast).getTime();
            if (timePassed < cooldown) {
                const remainingTime = Math.ceil((cooldown - timePassed) / 60000);
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🌈 天气小提示",
                    "💝 气象卫星还在准备中~",
                    `✨ 剩余时间: ${remainingTime}分钟`,
                    "🎀 让我们先做点别的吧!",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
        }

        // 检查太空点数
        if (userData.spaceData.spacePoints < 30) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🌈 天气小提示",
                "💝 需要30太空点数",
                `✨ 当前点数: ${userData.spaceData.spacePoints}`,
                "🎀 先去收集一些太空点数吧~",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 生成天气预报
        const weatherReport = generateWeatherReport();
        const specialEvents = generateSpecialEvents();
        const weatherEffects = calculateWeatherEffects();

        // 扣除点数并更新时间
        userData.spaceData.spacePoints -= 30;
        userData.spaceData.lastWeatherForecast = new Date().toISOString();

        // 应用天气效果
        applyWeatherEffects(userData.spaceData, weatherEffects);

        // 生成预报报告
        let forecastReport = [
            "•*¨*•.¸¸🌈¸¸.•*¨*•",
            "🎀 梦幻太空天气预报 🎀",
            "",
            "💫 近期天气:",
            ...formatWeatherReport(weatherReport),
            "",
            "✨ 特殊现象:",
            ...formatSpecialEvents(specialEvents),
            "",
            "🌟 天气影响:",
            ...formatWeatherEffects(weatherEffects)
        ];

        // 添加天气提醒
        const weatherTips = generateWeatherTips(weatherReport);
        if (weatherTips.length > 0) {
            forecastReport.push(
                "",
                "💝 贴心提醒:",
                ...weatherTips.map(tip => `   ✧ ${tip}`)
            );
        }

        // 添加幸运预言
        const luckyForecast = generateLuckyForecast();
        forecastReport.push(
            "",
            "🎀 今日幸运:",
            `   ✧ ${luckyForecast.message}`,
            `   ✧ 幸运指数: ${luckyForecast.stars}`
        );

        forecastReport.push(
            "",
            "💫 愿你有个美好的太空旅程~",
            "•*¨*•.¸¸🌈¸¸.•*¨*•"
        );

        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        e.reply(forecastReport.join('\n'));

    } catch (err) {
        console.error(err);
        e.reply("哎呀,预报系统出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
    }
}
    // 太空任务申请系统
async Apply_space_task(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        // 获取任务类型
        const taskType = e.msg.replace('#太空任务申请', '').trim();
        if (!taskType) {
            // 显示可用任务列表
            showAvailableTasks(userData.spaceData, e);
            return;
        }

        // 检查任务冷却
        const lastTask = userData.spaceData.lastTaskTime;
        if (lastTask) {
            const cooldown = 1200000; // 20分钟冷却
            const timePassed = Date.now() - new Date(lastTask).getTime();
            if (timePassed < cooldown) {
                const remainingTime = Math.ceil((cooldown - timePassed) / 60000);
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🎀 任务小提示",
                    "💝 任务系统还在准备中~",
                    `✨ 剩余时间: ${remainingTime}分钟`,
                    "🌸 先去休息一下吧!",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
        }

        // 生成任务
        const task = generateTask(taskType, userData.spaceData);
        if (!task) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🎀 任务小提示",
                "💝 没有找到这个类型的任务呢",
                "✨ 可以看看其他类型的任务哦",
                "🌸 输入 #太空任务申请 查看任务列表",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 检查任务数量限制
        if (userData.spaceData.tasks.length >= 5) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🎀 任务小提示",
                "💝 当前任务已经很多啦",
                "✨ 先完成一些任务再来接新的吧",
                "🌸 要劳逸结合哦~",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 添加任务并更新时间
        userData.spaceData.tasks.push(task);
        userData.spaceData.lastTaskTime = new Date().toISOString();

        // 生成任务报告
        let taskReport = [
            "•*¨*•.¸¸📝¸¸.•*¨*•",
            "🎀 太空任务申请成功 🎀",
            "",
            "💝 任务信息:",
            `   ✧ 名称: ${task.name}`,
            `   ✧ 类型: ${task.type}`,
            `   ✧ 难度: ${task.difficulty}`,
            "",
            "✨ 任务描述:",
            `   ✧ ${task.description}`,
            "",
            "🌟 任务目标:",
            `   ✧ ${task.objective}`,
            `   ✧ 进度: 0/${task.target}`,
            "",
            "💫 任务奖励:",
            ...formatTaskRewards(task.rewards)
        ];

        // 添加任务提示
        const taskTips = generateTaskTips(task);
        if (taskTips.length > 0) {
            taskReport.push(
                "",
                "🎀 任务提示:",
                ...taskTips.map(tip => `   ✧ ${tip}`)
            );
        }

        taskReport.push(
            "",
            "💝 祝你任务顺利完成哦~",
            "•*¨*•.¸¸📝¸¸.•*¨*•"
        );

        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        e.reply(taskReport.join('\n'));

    } catch (err) {
        console.error(err);
        e.reply("哎呀,申请任务时出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
    }
}

    // 太空旅行系统
async Space_travel(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        // 检查旅行冷却
        const lastTravel = userData.spaceData.lastTravelTime;
        if (lastTravel) {
            const cooldown = 3600000; // 1小时冷却
            const timePassed = Date.now() - new Date(lastTravel).getTime();
            if (timePassed < cooldown) {
                const remainingTime = Math.ceil((cooldown - timePassed) / 60000);
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🚀 旅行小提示",
                    "💝 飞船还在休整中呢~",
                    `✨ 剩余时间: ${remainingTime}分钟`,
                    "🌸 让我们先准备一下吧!",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
        }

        // 检查能源
        if (userData.spaceData.spaceship.energyCapacity < 50) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🚀 旅行小提示",
                "💝 能源不足呢~",
                "✨ 需要至少50点能源",
                "🌸 先去补充能源吧!",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 获取可用目的地
        const destinations = getAvailableDestinations(userData.spaceData);
        
        // 如果没有指定目的地,显示目的地列表
        if (!e.msg.includes(' ')) {
            showDestinations(destinations, e);
            return;
        }

        // 获取目的地名称
        const destinationName = e.msg.split(' ')[1];
        const destination = destinations.find(d => d.name === destinationName);

        if (!destination) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🚀 旅行小提示",
                "💝 找不到这个目的地呢~",
                "✨ 请检查名称是否正确",
                "🌸 可以重新查看目的地列表哦",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 计算旅行消耗
        const travelCost = calculateTravelCost(userData.spaceData, destination);

        // 检查点数是否足够
        if (userData.spaceData.spacePoints < travelCost.points) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🚀 旅行小提示",
                `💝 需要 ${travelCost.points} 太空点数`,
                `✨ 当前点数: ${userData.spaceData.spacePoints}`,
                "🌸 先去收集一些太空点数吧~",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 开始旅行
        const travelResult = startTravel(userData.spaceData, destination);

        // 生成旅行报告
        let travelReport = [
            "•*¨*•.¸¸🚀¸¸.•*¨*•",
            "🎀 太空旅行报告 🎀",
            "",
            "💫 目的地信息:",
            `   ✧ 名称: ${destination.name}`,
            `   ✧ 类型: ${destination.type}`,
            `   ✧ 距离: ${destination.distance}光年`,
            "",
            "✨ 旅行详情:",
            `   ✧ 消耗能源: ${travelCost.energy}`,
            `   ✧ 消耗点数: ${travelCost.points}`,
            `   ✧ 旅行时间: ${travelCost.time}分钟`,
            "",
            "🌟 旅途发现:",
            ...formatTravelDiscoveries(travelResult.discoveries)
        ];

        // 添加特殊事件
        if (travelResult.events.length > 0) {
            travelReport.push(
                "",
                "💝 特殊事件:",
                ...travelResult.events.map(event => `   ✧ ${event}`)
            );
        }

        // 添加获得的奖励
        if (travelResult.rewards) {
            travelReport.push(
                "",
                "🎁 旅行奖励:",
                ...formatTravelRewards(travelResult.rewards)
            );
        }

        // 添加目的地提示
        const destinationTips = generateDestinationTips(destination);
        if (destinationTips.length > 0) {
            travelReport.push(
                "",
                "💭 目的地提示:",
                ...destinationTips.map(tip => `   ✧ ${tip}`)
            );
        }

        travelReport.push(
            "",
            "🌸 祝你在新的星球玩得开心哦~",
            "•*¨*•.¸¸🚀¸¸.•*¨*•"
        );

        // 更新数据
        userData.spaceData.spacePoints -= travelCost.points;
        userData.spaceData.spaceship.energyCapacity -= travelCost.energy;
        userData.spaceData.spaceship.currentPlanet = destination.name;
        userData.spaceData.lastTravelTime = new Date().toISOString();

        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        e.reply(travelReport.join('\n'));

    } catch (err) {
        console.error(err);
        e.reply("哎呀,旅行过程中出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
    }
}

   // 太空救援系统
async Space_rescue(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        // 检查救援冷却
        const lastRescue = userData.spaceData.lastRescueTime;
        if (lastRescue) {
            const cooldown = 7200000; // 2小时冷却
            const timePassed = Date.now() - new Date(lastRescue).getTime();
            if (timePassed < cooldown) {
                const remainingTime = Math.ceil((cooldown - timePassed) / 60000);
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🚨 救援小提示",
                    "💝 救援设备还在维护中~",
                    `✨ 剩余时间: ${remainingTime}分钟`,
                    "🌸 让我们先准备一下吧!",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
        }

        // 检查太空点数
        if (userData.spaceData.spacePoints < 150) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🚨 救援小提示",
                "💝 需要150太空点数",
                `✨ 当前点数: ${userData.spaceData.spacePoints}`,
                "🌸 先去收集一些太空点数吧~",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 生成救援任务
        const rescueMission = generateRescueMission();
        
        // 显示救援任务信息
        let rescueReport = [
            "•*¨*•.¸¸🚨¸¸.•*¨*•",
            "🎀 紧急救援任务 🎀",
            "",
            "💫 任务信息:",
            `   ✧ 事件: ${rescueMission.event}`,
            `   ✧ 地点: ${rescueMission.location}`,
            `   ✧ 难度: ${rescueMission.difficulty}`,
            "",
            "✨ 救援目标:",
            `   ✧ ${rescueMission.objective}`,
            "",
            "🌟 预期奖励:",
            ...formatRescueRewards(rescueMission.rewards)
        ];

        // 确认是否接受任务
        rescueReport.push(
            "",
            "💝 是否接受救援任务?",
            "   ✧ 发送 #确认救援 接受任务",
            "   ✧ 发送 #取消救援 放弃任务",
            "",
            "🎀 温馨提示:",
            "   ✧ 任务可能有危险",
            "   ✧ 请确保设备状态良好",
            "   ✧ 携带足够的补给品",
            "•*¨*•.¸¸🚨¸¸.•*¨*•"
        );

        // 保存救援任务信息
        userData.spaceData.pendingRescue = rescueMission;
        await redis.set(`user:${userId}`, JSON.stringify(userData));

        e.reply(rescueReport.join('\n'));

    } catch (err) {
        console.error(err);
        e.reply("哎呀,救援系统出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
    }
}

    // 太空基地升级系统
async Upgrade_space_base(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        // 检查升级冷却
        const lastUpgrade = userData.spaceData.lastBaseUpgradeTime;
        if (lastUpgrade) {
            const cooldown = 3600000; // 1小时冷却
            const timePassed = Date.now() - new Date(lastUpgrade).getTime();
            if (timePassed < cooldown) {
                const remainingTime = Math.ceil((cooldown - timePassed) / 60000);
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🏰 升级小提示",
                    "💝 建筑工人正在休息呢~",
                    `✨ 剩余时间: ${remainingTime}分钟`,
                    "🌸 让我们先规划一下吧!",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
        }

        // 显示升级选项
        if (!e.msg.includes(' ')) {
            showUpgradeOptions(userData.spaceData, e);
            return;
        }

        // 获取升级部分
        const upgradePart = e.msg.split(' ')[1];
        const upgradeInfo = getUpgradeInfo(upgradePart, userData.spaceData);

        if (!upgradeInfo) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🏰 升级小提示",
                "💝 找不到这个升级选项呢~",
                "✨ 请检查名称是否正确",
                "🌸 可以重新查看升级列表哦",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 检查升级条件
        if (!checkUpgradeRequirements(userData.spaceData, upgradeInfo)) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🏰 升级小提示",
                "💝 暂时无法进行升级呢~",
                `✨ 需要: ${formatRequirements(upgradeInfo.requirements)}`,
                "🌸 让我们继续努力吧!",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 执行升级
        const upgradeResult = performUpgrade(userData.spaceData, upgradeInfo);

        // 生成升级报告
        let upgradeReport = [
            "•*¨*•.¸¸🏰¸¸.•*¨*•",
            "🎀 太空基地升级报告 🎀",
            "",
            "💫 升级项目:",
            `   ✧ 名称: ${upgradeInfo.name}`,
            `   ✧ 等级: ${upgradeResult.oldLevel} → ${upgradeResult.newLevel}`,
            "",
            "✨ 升级效果:",
            ...formatUpgradeEffects(upgradeResult.effects)
        ];

        // 添加特殊效果
        if (upgradeResult.specialEffects.length > 0) {
            upgradeReport.push(
                "",
                "🌟 特殊效果:",
                ...upgradeResult.specialEffects.map(effect => `   ✧ ${effect}`)
            );
        }

        // 添加解锁内容
        if (upgradeResult.unlocks.length > 0) {
            upgradeReport.push(
                "",
                "🎁 解锁内容:",
                ...upgradeResult.unlocks.map(unlock => `   ✧ ${unlock}`)
            );
        }

        // 消耗资源提示
        upgradeReport.push(
            "",
            "💰 资源消耗:",
            ...formatResourceCost(upgradeInfo.cost)
        );

        // 升级建议
        const upgradeTips = generateUpgradeTips(upgradeInfo);
        if (upgradeTips.length > 0) {
            upgradeReport.push(
                "",
                "💝 升级建议:",
                ...upgradeTips.map(tip => `   ✧ ${tip}`)
            );
        }

        upgradeReport.push(
            "",
            "🌸 基地变得更漂亮了呢~",
            "•*¨*•.¸¸🏰¸¸.•*¨*•"
        );

        // 更新数据
        userData.spaceData.lastBaseUpgradeTime = new Date().toISOString();
        applyUpgradeCost(userData.spaceData, upgradeInfo.cost);
        applyUpgradeEffects(userData.spaceData, upgradeResult);

        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        e.reply(upgradeReport.join('\n'));

    } catch (err) {
        console.error(err);
        e.reply("哎呀,升级过程中出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
    }
}
    // 太空基地防御系统
async Build_defense_system(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        // 检查建造冷却
        const lastDefense = userData.spaceData.lastDefenseTime;
        if (lastDefense) {
            const cooldown = 5400000; // 1.5小时冷却
            const timePassed = Date.now() - new Date(lastDefense).getTime();
            if (timePassed < cooldown) {
                const remainingTime = Math.ceil((cooldown - timePassed) / 60000);
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🛡️ 防御小提示",
                    "💝 防御系统正在维护中~",
                    `✨ 剩余时间: ${remainingTime}分钟`,
                    "🌸 让我们先做点别的吧!",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
        }

        // 显示防御选项
        if (!e.msg.includes(' ')) {
            showDefenseOptions(userData.spaceData, e);
            return;
        }

        // 获取建造类型
        const defenseType = e.msg.split(' ')[1];
        const defenseInfo = getDefenseInfo(defenseType);

        if (!defenseInfo) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🛡️ 防御小提示",
                "💝 找不到这个防御设施呢~",
                "✨ 请检查名称是否正确",
                "🌸 可以重新查看防御列表哦",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 检查建造条件
        if (!checkDefenseRequirements(userData.spaceData, defenseInfo)) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🛡️ 防御小提示",
                "💝 暂时无法建造这个设施呢~",
                `✨ 需要: ${formatRequirements(defenseInfo.requirements)}`,
                "🌸 让我们继续努力吧!",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 执行建造
        const buildResult = buildDefense(userData.spaceData, defenseInfo);

        // 生成建造报告
        let defenseReport = [
            "•*¨*•.¸¸🛡️¸¸.•*¨*•",
            "🎀 防御系统建造报告 🎀",
            "",
            "💫 建造设施:",
            `   ✧ 名称: ${defenseInfo.name}`,
            `   ✧ 类型: ${defenseInfo.type}`,
            `   ✧ 防御力: ${defenseInfo.power}`,
            "",
            "✨ 防御效果:",
            ...formatDefenseEffects(buildResult.effects)
        ];

        // 添加特殊功能
        if (buildResult.specialFeatures.length > 0) {
            defenseReport.push(
                "",
                "🌟 特殊功能:",
                ...buildResult.specialFeatures.map(feature => `   ✧ ${feature}`)
            );
        }

        // 添加增益效果
        if (buildResult.buffs.length > 0) {
            defenseReport.push(
                "",
                "💝 增益效果:",
                ...buildResult.buffs.map(buff => `   ✧ ${buff}`)
            );
        }

        // 消耗资源提示
        defenseReport.push(
            "",
            "💰 资源消耗:",
            ...formatResourceCost(defenseInfo.cost)
        );

        // 防御建议
        const defenseTips = generateDefenseTips(defenseInfo);
        if (defenseTips.length > 0) {
            defenseReport.push(
                "",
                "🎀 防御建议:",
                ...defenseTips.map(tip => `   ✧ ${tip}`)
            );
        }

        defenseReport.push(
            "",
            "🌸 基地的防御变得更强了呢~",
            "•*¨*•.¸¸🛡️¸¸.•*¨*•"
        );

        // 更新数据
        userData.spaceData.lastDefenseTime = new Date().toISOString();
        applyDefenseCost(userData.spaceData, defenseInfo.cost);
        applyDefenseEffects(userData.spaceData, buildResult);

        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        e.reply(defenseReport.join('\n'));

    } catch (err) {
        console.error(err);
        e.reply("哎呀,建造过程中出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
    }
}

   // 太空基地扩展系统
async Expand_space_base(e) {
    const userId = e.user_id;
    try {
        let userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("很抱歉喵~ 您已被封禁，无法进行该操作 (｡•́︿•̀｡)");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        // 检查扩展冷却
        const lastExpand = userData.spaceData.lastExpandTime;
        if (lastExpand) {
            const cooldown = 7200000; // 2小时冷却
            const timePassed = Date.now() - new Date(lastExpand).getTime();
            if (timePassed < cooldown) {
                const remainingTime = Math.ceil((cooldown - timePassed) / 60000);
                e.reply([
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                    "🏗️ 扩展小提示",
                    "💝 建设团队正在休息呢~",
                    `✨ 剩余时间: ${remainingTime}分钟`,
                    "🌸 让我们先做些规划吧!",
                    "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
                ].join('\n'));
                return;
            }
        }

        // 显示扩展选项
        if (!e.msg.includes(' ')) {
            showExpansionOptions(userData.spaceData, e);
            return;
        }

        // 获取扩展区域
        const expansionType = e.msg.split(' ')[1];
        const expansionInfo = getExpansionInfo(expansionType, userData.spaceData);

        if (!expansionInfo) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🏗️ 扩展小提示",
                "💝 找不到这个扩展区域呢~",
                "✨ 请检查名称是否正确",
                "🌸 可以重新查看扩展列表哦",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 检查扩展条件
        if (!checkExpansionRequirements(userData.spaceData, expansionInfo)) {
            e.reply([
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
                "🏗️ 扩展小提示",
                "💝 暂时无法扩展这个区域呢~",
                `✨ 需要: ${formatRequirements(expansionInfo.requirements)}`,
                "🌸 让我们继续努力吧!",
                "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
            ].join('\n'));
            return;
        }

        // 执行扩展
        const expandResult = performExpansion(userData.spaceData, expansionInfo);

        // 生成扩展报告
        let expansionReport = [
            "•*¨*•.¸¸🏗️¸¸.•*¨*•",
            "🎀 太空基地扩展报告 🎀",
            "",
            "💫 扩展区域:",
            `   ✧ 名称: ${expansionInfo.name}`,
            `   ✧ 类型: ${expansionInfo.type}`,
            `   ✧ 规模: ${expandResult.size}`,
            "",
            "✨ 扩展效果:",
            ...formatExpansionEffects(expandResult.effects)
        ];

        // 添加新设施
        if (expandResult.newFacilities.length > 0) {
            expansionReport.push(
                "",
                "🌟 新增设施:",
                ...expandResult.newFacilities.map(facility => `   ✧ ${facility}`)
            );
        }

        // 添加特殊发现
        if (expandResult.discoveries.length > 0) {
            expansionReport.push(
                "",
                "💝 特殊发现:",
                ...expandResult.discoveries.map(discovery => `   ✧ ${discovery}`)
            );
        }

        // 消耗资源提示
        expansionReport.push(
            "",
            "💰 资源消耗:",
            ...formatResourceCost(expansionInfo.cost)
        );

        // 扩展建议
        const expansionTips = generateExpansionTips(expansionInfo);
        if (expansionTips.length > 0) {
            expansionReport.push(
                "",
                "🎀 扩展建议:",
                ...expansionTips.map(tip => `   ✧ ${tip}`)
            );
        }

        // 添加装饰提示
        const decorationTips = generateDecorationTips(expansionInfo);
        if (decorationTips.length > 0) {
            expansionReport.push(
                "",
                "🌸 装饰建议:",
                ...decorationTips.map(tip => `   ✧ ${tip}`)
            );
        }

        expansionReport.push(
            "",
            "💫 基地变得更大更漂亮了呢~",
            "•*¨*•.¸¸🏗️¸¸.•*¨*•"
        );

        // 更新数据
        userData.spaceData.lastExpandTime = new Date().toISOString();
        applyExpansionCost(userData.spaceData, expansionInfo.cost);
        applyExpansionEffects(userData.spaceData, expandResult);

        // 更新数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        e.reply(expansionReport.join('\n'));

    } catch (err) {
        console.error(err);
        e.reply("哎呀,扩展过程中出了一点小问题呢~ 请稍后再试吧 (｡•́︿•̀｡)");
    }
}
}
// 显示防御选项
function showDefenseOptions(spaceData, e) {
    const defenseOptions = [
        {
            name: "彩虹护盾",
            type: "防护",
            power: 100,
            description: "生成漂亮的防护罩",
            effects: ["减少伤害30%", "自动修复"]
        },
        {
            name: "星光炮台",
            type: "攻击",
            power: 80,
            description: "发射闪亮的能量束",
            effects: ["范围攻击", "视觉特效"]
        },
        {
            name: "能量结界",
            type: "屏障",
            power: 120,
            description: "创建梦幻能量场",
            effects: ["全方位防护", "能量回收"]
        }
    ];

    const optionList = [
        "•*¨*•.¸¸🛡️¸¸.•*¨*•",
        "🎀 防御设施列表 🎀",
        "",
        "💫 可建造设施:"
    ];

    defenseOptions.forEach(option => {
        optionList.push(
            `\n✨ ${option.name}:`,
            `   ✧ 类型: ${option.type}`,
            `   ✧ 防御力: ${option.power}`,
            `   ✧ 说明: ${option.description}`,
            `   ✧ 效果: ${option.effects.join(', ')}`
        );
    });

    optionList.push(
        "",
        "🚀 建造指令: #建造防御系统 [设施名称]",
        "💝 今日推荐: 彩虹护盾(建造消耗-20%)",
        "",
        "🌸 温馨提示:",
        "   ✧ 建造会消耗资源",
        "   ✧ 不同设施效果不同",
        "   ✧ 可以组合使用哦~",
        "",
        "✨ 让我们守护好可爱的基地吧!",
        "•*¨*•.¸¸🛡️¸¸.•*¨*•"
    );

    e.reply(optionList.join('\n'));
}
// 显示升级选项
function showUpgradeOptions(spaceData, e) {
    const upgradeOptions = [
        {
            name: "主控室",
            description: "提升基地整体效率",
            currentLevel: spaceData.baseLevel || 1,
            maxLevel: 10,
            effects: ["指挥效率提升", "资源产出增加"]
        },
        {
            name: "能源中心",
            description: "提升能源产出和存储",
            currentLevel: spaceData.energyLevel || 1,
            maxLevel: 8,
            effects: ["能源产出提升", "存储容量增加"]
        },
        {
            name: "研究实验室",
            description: "提升研究效率",
            currentLevel: spaceData.researchLevel || 1,
            maxLevel: 12,
            effects: ["研究速度提升", "解锁新科技"]
        },
        {
            name: "生活区",
            description: "提升居住舒适度",
            currentLevel: spaceData.livingLevel || 1,
            maxLevel: 6,
            effects: ["心情恢复加快", "新装饰解锁"]
        }
    ];

    const optionList = [
        "•*¨*•.¸¸🏰¸¸.•*¨*•",
        "🎀 基地升级选项 🎀",
        "",
        "💫 可升级设施:"
    ];

    upgradeOptions.forEach(option => {
        optionList.push(
            `\n✨ ${option.name}:`,
            `   ✧ 说明: ${option.description}`,
            `   ✧ 当前等级: ${option.currentLevel}/${option.maxLevel}`,
            `   ✧ 升级效果: ${option.effects.join(', ')}`,
            `   ✧ 状态: ${option.currentLevel >= option.maxLevel ? '已满级' : '可升级'}`
        );
    });

    optionList.push(
        "",
        "🚀 升级指令: #太空基地升级 [设施名称]",
        "💝 今日推荐: 生活区(升级消耗-20%)",
        "",
        "🌸 温馨提示:",
        "   ✧ 升级会消耗资源",
        "   ✧ 不同设施效果不同",
        "   ✧ 记得查看解锁内容哦~",
        "",
        "✨ 让我们把基地建设得更好吧!",
        "•*¨*•.¸¸🏰¸¸.•*¨*•"
    );

    e.reply(optionList.join('\n'));
}

// 获取升级信息
function getUpgradeInfo(partName, spaceData) {
    const upgradeConfigs = {
        "主控室": {
            basePoints: 200,
            levelMultiplier: 1.5,
            requirements: {
                baseLevel: 1,
                spacePoints: 200
            }
        },
        "能源中心": {
            basePoints: 150,
            levelMultiplier: 1.3,
            requirements: {
                baseLevel: 2,
                spacePoints: 150
            }
        },
        // 可以添加更多设施配置
    };

    return upgradeConfigs[partName];
}

// 生成升级建议
function generateUpgradeTips(upgradeInfo) {
    const tips = [
        "升级后记得调整设施运行参数哦~",
        "可以搭配其他设施一起使用更好呢~",
        "注意查看新解锁的功能哦!",
        "合理安排升级顺序会更有效率~"
    ];
    return tips;
}

// 格式化资源消耗
function formatResourceCost(cost) {
    return Object.entries(cost).map(([resource, amount]) => {
        const icon = {
            spacePoints: "✨",
            energy: "⚡",
            materials: "📦"
        }[resource];
        return `   ${icon} ${resource}: ${amount}`;
    });
}

// 生成救援任务
function generateRescueMission() {
    const rescueTypes = [
        {
            event: "迷路的太空猫咪",
            location: "星光森林",
            difficulty: "⭐⭐",
            objective: "找到并安全护送可爱的太空猫咪回家",
            type: "escort"
        },
        {
            event: "受困的彩虹飞船",
            location: "梦幻星云",
            difficulty: "⭐⭐⭐",
            objective: "修复飞船并帮助船员脱困",
            type: "repair"
        },
        {
            event: "迷失的星际探险家",
            location: "幻想峡谷",
            difficulty: "⭐⭐⭐⭐",
            objective: "寻找并营救失联的探险家",
            type: "search"
        }
    ];

    const selectedMission = rescueTypes[Math.floor(Math.random() * rescueTypes.length)];
    
    return {
        ...selectedMission,
        rewards: generateRescueRewards(selectedMission),
        requirements: generateMissionRequirements(selectedMission),
        specialEvents: generateSpecialEvents(selectedMission)
    };
}

// 生成救援奖励
function generateRescueRewards(selectedMission) {
    const baseRewards = {
        starDust: 100,
        spaceCrystals: 10,
        reputation: 50
    };

    // 根据难度增加奖励
    const difficultyMultiplier = mission.difficulty.length;
    Object.keys(baseRewards).forEach(key => {
        baseRewards[key] *= difficultyMultiplier;
    });

    // 添加特殊奖励
    if (mission.type === "escort") {
        baseRewards.specialItem = "可爱的太空宠物";
    } else if (mission.type === "repair") {
        baseRewards.specialItem = "高级修理工具";
    } else if (mission.type === "search") {
        baseRewards.specialItem = "探险家的宝藏";
    }

    return baseRewards;
}

// 生成任务要求
function generateMissionRequirements(selectedMission) {
    const requirements = {
        minEnergy: 50,
        minDurability: 70,
        requiredItems: []
    };

    switch (mission.type) {
        case "escort":
            requirements.requiredItems.push("治愈光束", "能量零食");
            break;
        case "repair":
            requirements.requiredItems.push("修理工具箱", "能源补充包");
            break;
        case "search":
            requirements.requiredItems.push("探测器", "急救包");
            break;
    }

    return requirements;
}


// 格式化救援奖励
function formatRescueRewards(rewards) {
    const formattedRewards = [];
    if (rewards.starDust) {
        formattedRewards.push(`   ✨ 星尘: ${rewards.starDust}`);
    }
    if (rewards.spaceCrystals) {
        formattedRewards.push(`   💎 空间水晶: ${rewards.spaceCrystals}`);
    }
    if (rewards.reputation) {
        formattedRewards.push(`   🌟 声望: ${rewards.reputation}`);
    }
    if (rewards.specialItem) {
        formattedRewards.push(`   🎁 特殊奖励: ${rewards.specialItem}`);
    }
    return formattedRewards;
}

// 获取可用目的地
function getAvailableDestinations(spaceData) {
    return [
        {
            name: "梦幻星球",
            type: "休闲星球",
            distance: 1.5,
            description: "充满梦幻色彩的星球,适合放松休息",
            features: ["梦幻花园", "星光湖泊", "彩虹山脉"],
            activities: ["观光", "采集", "休息"]
        },
        {
            name: "彩虹星球",
            type: "娱乐星球",
            distance: 2.3,
            description: "七彩斑斓的欢乐星球",
            features: ["彩虹瀑布", "糖果森林", "音乐喷泉"],
            activities: ["游玩", "采集", "表演"]
        },
        // 可以添加更多目的地
    ];
}

// 显示目的地列表
function showDestinations(destinations, e) {
    const destinationList = [
        "•*¨*•.¸¸🗺️¸¸.•*¨*•",
        "🎀 可选目的地列表 🎀",
        "",
        "💫 当前可前往的星球:"
    ];

    destinations.forEach(dest => {
        destinationList.push(
            `\n✨ ${dest.name}:`,
            `   ✧ 类型: ${dest.type}`,
            `   ✧ 距离: ${dest.distance}光年`,
            `   ✧ 简介: ${dest.description}`,
            `   ✧ 特色: ${dest.features.join(', ')}`,
            `   ✧ 活动: ${dest.activities.join(', ')}`
        );
    });

    destinationList.push(
        "",
        "🚀 开始旅行: #太空旅行 [目的地名称]",
        "💝 今日推荐: 梦幻星球(能源消耗-20%)",
        "",
        "🌸 温馨提示:",
        "   ✧ 旅行前请确保能源充足",
        "   ✧ 不同星球有不同特色哦",
        "   ✧ 记得带上必需品呢~",
        "",
        "✨ 准备好开始美妙的旅程了吗?",
        "•*¨*•.¸¸🗺️¸¸.•*¨*•"
    );

    e.reply(destinationList.join('\n'));
}

// 计算旅行消耗
function calculateTravelCost(spaceData, destination) {
    const baseEnergyCost = Math.ceil(destination.distance * 20);
    const basePointsCost = Math.ceil(destination.distance * 30);
    const baseTime = Math.ceil(destination.distance * 10);

    // 考虑飞船性能加成
    const shipEfficiency = spaceData.spaceship.propulsionEfficiency / 100;
    
    return {
        energy: Math.ceil(baseEnergyCost * (1 - shipEfficiency)),
        points: basePointsCost,
        time: Math.ceil(baseTime * (1 - shipEfficiency))
    };
}

// 开始旅行
function startTravel(spaceData, destination) {
    const discoveries = generateTravelDiscoveries(destination);
    const events = generateTravelEvents(destination);
    const rewards = calculateTravelRewards(destination);

    return { discoveries, events, rewards };
}

// 生成旅行发现
function generateTravelDiscoveries(destination) {
    const baseDiscoveries = [
        "发现了闪耀的星光瀑布!",
        "遇到了可爱的太空生物~",
        "看到了绚丽的星际极光!",
        "找到了神秘的空间裂缝!",
        "观察到稀有的天文现象~"
    ];

    return baseDiscoveries
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1);
}

// 生成旅行事件
function generateTravelEvents(destination) {
    const events = [];
    if (Math.random() < 0.3) {
        events.push(
            "遇到了友好的外星人!",
            "发现了隐藏的宝藏箱~",
            "触发了神秘的空间现象!"
        );
    }
    return events;
}

// 计算旅行奖励
function calculateTravelRewards(destination) {
    return {
        starDust: Math.floor(Math.random() * 50) + 50,
        crystals: Math.floor(Math.random() * 5) + 5,
        experience: Math.floor(Math.random() * 100) + 100
    };
}

// 格式化旅行发现
function formatTravelDiscoveries(discoveries) {
    return discoveries.map(discovery => `   ✧ ${discovery}`);
}

// 格式化旅行奖励
function formatTravelRewards(rewards) {
    return Object.entries(rewards).map(([key, value]) => {
        const icon = {
            starDust: "✨",
            crystals: "💎",
            experience: "📚"
        }[key];
        return `   ${icon} ${key}: ${value}`;
    });
}

// 生成目的地提示
function generateDestinationTips(destination) {
    const tips = [
        `这里的${destination.features[0]}特别美丽呢~`,
        `推荐体验${destination.activities[0]}活动哦!`,
        "记得拍些照片留念呢~",
        "可以收集一些当地特产带回去~"
    ];
    return tips;
}

// 显示可用任务列表
function showAvailableTasks(spaceData, e) {
    const taskTypes = [
        {
            type: "探索任务",
            desc: "探索未知的星球和区域",
            difficulty: "⭐⭐",
            rewards: "星尘、探索点数"
        },
        {
            type: "收集任务",
            desc: "收集特定的太空资源",
            difficulty: "⭐",
            rewards: "材料、金币"
        },
        {
            type: "研究任务",
            desc: "进行科学研究和实验",
            difficulty: "⭐⭐⭐",
            rewards: "研究点数、经验"
        },
        {
            type: "护送任务",
            desc: "护送货物或人员",
            difficulty: "⭐⭐",
            rewards: "金币、声望"
        },
        {
            type: "救援任务",
            desc: "解救遇险的飞船或人员",
            difficulty: "⭐⭐⭐⭐",
            rewards: "特殊道具、声望"
        }
    ];

    const taskList = [
        "•*¨*•.¸¸📋¸¸.•*¨*•",
        "🎀 可接任务列表 🎀",
        "",
        "💝 当前可用任务类型:"
    ];

    taskTypes.forEach(task => {
        taskList.push(
            `\n✨ ${task.type}:`,
            `   ✧ 描述: ${task.desc}`,
            `   ✧ 难度: ${task.difficulty}`,
            `   ✧ 奖励: ${task.rewards}`
        );
    });

    taskList.push(
        "",
        "🌟 申请方式: #太空任务申请 [任务类型]",
        "💫 今日推荐: 探索任务(奖励提升20%)",
        "",
        "🎀 温馨提示:",
        "   ✧ 每次只能进行一个同类型任务",
        "   ✧ 任务难度越高奖励越丰富",
        "   ✧ 记得在能力范围内选择哦~",
        "",
        "💝 期待你的精彩表现!",
        "•*¨*•.¸¸📋¸¸.•*¨*•"
    );

    e.reply(taskList.join('\n'));
}

// 生成任务
function generateTask(type, spaceData) {
    const taskTemplates = {
        "探索任务": [
            {
                name: "神秘星球探索",
                description: "探索一颗未知的星球",
                objective: "完成星球探索",
                target: 1,
                rewards: {
                    starDust: 100,
                    explorationPoints: 50
                }
            },
            // 可以添加更多探索任务模板
        ],
        "收集任务": [
            {
                name: "星光收集",
                description: "收集闪耀的星光碎片",
                objective: "收集星光碎片",
                target: 10,
                rewards: {
                    money: 200,
                    materials: ["星光碎片", "能量结晶"]
                }
            },
            // 可以添加更多收集任务模板
        ],
        // 可以添加更多任务类型
    };

    if (!taskTemplates[type]) return null;

    const template = taskTemplates[type][Math.floor(Math.random() * taskTemplates[type].length)];
    return {
        ...template,
        type: type,
        difficulty: calculateTaskDifficulty(template),
        startTime: new Date().toISOString(),
        status: "进行中"
    };
}

// 计算任务难度
function calculateTaskDifficulty(task) {
    const difficultyFactors = {
        target: task.target,
        rewardValue: Object.values(task.rewards).reduce((sum, reward) => {
            if (typeof reward === 'number') return sum + reward;
            return sum;
        }, 0)
    };

    let difficulty = "⭐";
    if (difficultyFactors.target > 5) difficulty += "⭐";
    if (difficultyFactors.rewardValue > 150) difficulty += "⭐";
    if (task.type === "探索任务") difficulty += "⭐";

    return difficulty;
}

// 格式化任务奖励
function formatTaskRewards(rewards) {
    return Object.entries(rewards).map(([key, value]) => {
        const icon = {
            starDust: "✨",
            explorationPoints: "🚀",
            money: "💰",
            materials: "📦"
        }[key];
        
        if (Array.isArray(value)) {
            return `   ${icon} ${key}: ${value.join(", ")}`;
        }
        return `   ${icon} ${key}: ${value}`;
    });
}

// 生成任务提示
function generateTaskTips(task,spaceData) {
    const tips = [];
    switch(task.type) {
        case "探索任务":
            tips.push("记得带上足够的能源哦~");
            tips.push("可以邀请其他船员一起探索呢!");
            break;
        case "收集任务":
            tips.push("使用特殊道具可以提高收集效率~");
            tips.push("注意收集地点的天气状况哦!");
            break;
        // 可以添加更多任务类型的提示
    }
    return tips;
}

// 生成天气预报
function generateWeatherReport() {
    const weatherTypes = [
        {type: "星光雨", icon: "✨", effect: "采集效率提升"},
        {type: "彩虹雾", icon: "🌈", effect: "心情值提升"},
        {type: "流星雨", icon: "💫", effect: "幸运值提升"},
        {type: "星云飘", icon: "🌸", effect: "能源恢复加快"},
        {type: "极光舞", icon: "🎀", effect: "探索效率提升"}
    ];

    const report = [];
    for (let i = 0; i < 3; i++) {
        const weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        report.push({
            ...weather,
            intensity: ["温和", "适中", "强烈"][Math.floor(Math.random() * 3)],
            duration: Math.floor(Math.random() * 4) + 2 // 2-6小时
        });
    }
    return report;
}


// 计算天气效果
function calculateWeatherEffects() {
    return {
        collection: Math.floor(Math.random() * 30) + 10, // 10-40%
        mood: Math.floor(Math.random() * 20) + 5, // 5-25%
        energy: Math.floor(Math.random() * 25) + 15, // 15-40%
        exploration: Math.floor(Math.random() * 35) + 5 // 5-40%
    };
}

// 格式化天气报告
function formatWeatherReport(report) {
    return report.map(weather => 
        `   ${weather.icon} ${weather.type}`,
        `      ✧ 强度: ${weather.intensity}`,
        `      ✧ 持续: ${weather.duration}小时`,
        `      ✧ 效果: ${weather.effect}`
    );
}

// 格式化特殊事件
function formatSpecialEvents(events) {
    if (events.length === 0) {
        return ["   ✧ 暂无特殊天气现象"];
    }
    return events.map(event => 
        `   ✧ ${event.name}: ${event.effect}`
    );
}

// 格式化天气效果
function formatWeatherEffects(effects) {
    return [
        `   ✧ 采集效率: +${effects.collection}%`,
        `   ✧ 心情提升: +${effects.mood}%`,
        `   ✧ 能源恢复: +${effects.energy}%`,
        `   ✧ 探索效率: +${effects.exploration}%`
    ];
}

// 生成天气提醒
function generateWeatherTips(weatherReport) {
    const tips = [];
    weatherReport.forEach(weather => {
        switch(weather.type) {
            case "星光雨":
                tips.push("记得带上星光收集瓶哦~");
                break;
            case "彩虹雾":
                tips.push("可以去彩虹雾中散步呢~");
                break;
            case "流星雨":
                tips.push("别忘了许愿呢!");
                break;
            case "星云飘":
                tips.push("适合进行能源收集哦~");
                break;
            case "极光舞":
                tips.push("是探索的好时机呢!");
                break;
        }
    });
    return tips;
}

// 生成幸运预言
function generateLuckyForecast() {
    const messages = [
        "今天会遇到可爱的太空生物哦~",
        "有机会获得稀有物品呢!",
        "适合进行探索活动呢~",
        "会有意外的惊喜等着你~",
        "是个放松休息的好日子~"
    ];

    return {
        message: messages[Math.floor(Math.random() * messages.length)],
        stars: "⭐".repeat(Math.floor(Math.random() * 3) + 3) // 3-5颗星
    };
}

// 应用天气效果
function applyWeatherEffects(spaceData, effects) {
    spaceData.collectionEfficiency = (spaceData.collectionEfficiency || 100) + effects.collection;
    spaceData.personalStats.happiness += effects.mood;
    spaceData.energyRecoveryRate = (spaceData.energyRecoveryRate || 100) + effects.energy;
    spaceData.explorationEfficiency = (spaceData.explorationEfficiency || 100) + effects.exploration;
}

// 获取医疗礼包
function getMedicalGift() {
    if (Math.random() < 0.3) {
        const gifts = [
            {
                name: "草莓味营养剂",
                effect: "恢复活力值20点"
            },
            {
                name: "彩虹能量糖",
                effect: "提升心情值15点"
            },
            {
                name: "星光护身符",
                effect: "提供8小时保护效果"
            },
            {
                name: "治愈系音乐盒",
                effect: "减少25%压力值"
            },
            {
                name: "梦幻睡眠喷雾",
                effect: "提升休息效果30%"
            }
        ];
        return gifts[Math.floor(Math.random() * gifts.length)];
    }
    return null;
}
// 显示背包物品列表
function showInventory(spaceData, e) {
    if (!spaceData.inventory || spaceData.inventory.length === 0) {
        e.reply([
            "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈",
            "🎀 背包空空的呢~",
            "💝 快去收集一些物品吧!",
            "✨ 可以通过采集获得哦",
            "🌸 期待你的新发现~",
            "┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈"
        ].join('\n'));
        return;
    }

    const inventoryDisplay = [
        "•*¨*•.¸¸🎒¸¸.•*¨*•",
        "🎀 背包物品列表 🎀",
        ""
    ];

    // 按类别分类显示物品
    const categories = {
        "💫 采集物品": item => item.type === "collection",
        "🌟 装备道具": item => item.type === "equipment",
        "✨ 特殊物品": item => item.type === "special"
    };

    for (const [category, filter] of Object.entries(categories)) {
        const items = spaceData.inventory.filter(filter);
        if (items.length > 0) {
            inventoryDisplay.push(category + ":");
            items.forEach(item => {
                inventoryDisplay.push(
                    `   ${item.id}. ${item.name}`,
                    `      💝 品质: ${item.quality || '普通'}`,
                    `      ✨ 稀有度: ${item.rarity || '普通'}`,
                    `      💰 预估价值: ${calculateMarketPrice(item)}金币`,
                    ""
                );
            });
        }
    }

    inventoryDisplay.push(
        "💫 售卖方式: #太空市场售卖 [物品ID]",
        "🎀 今日市场行情:",
        "   ✧ 装备道具价格上涨15%",
        "   ✧ 特殊物品收购价翻倍",
        "   ✧ 稀有品质额外加成",
        "",
        "✨ 小贴士: 留意市场行情能卖个好价钱哦~",
        "•*¨*•.¸¸🎒¸¸.•*¨*•"
    );

    e.reply(inventoryDisplay.join('\n'));
}

// 计算市场基础价格
function calculateMarketPrice(item) {
    let basePrice = item.value || 10;
    
    // 品质加成
    const qualityBonus = {
        '普通': 1,
        '精良': 1.5,
        '稀有': 2,
        '史诗': 3,
        '传说': 5
    };
    
    // 稀有度加成
    const rarityBonus = {
        'common': 1,
        'rare': 2,
        'epic': 4
    };

    // 计算最终价格
    let finalPrice = basePrice;
    finalPrice *= qualityBonus[item.quality] || 1;
    finalPrice *= rarityBonus[item.rarity] || 1;

    // 市场波动(随机±10%)
    const fluctuation = 0.9 + Math.random() * 0.2;
    finalPrice *= fluctuation;

    return Math.floor(finalPrice);
}

// 计算额外加成
function calculateBonusPrice(spaceData, item) {
    let bonus = 0;

    // 商人等级加成
    const merchantLevel = spaceData.merchantLevel || 1;
    bonus += item.value * (merchantLevel * 0.05);

    // 特殊时段加成
    const hour = new Date().getHours();
    if (hour >= 20 || hour <= 6) { // 夜间加成
        bonus += item.value * 0.2;
    }

    // 节日加成
    if (isSpecialDay()) {
        bonus += item.value * 0.5;
    }

    return Math.floor(bonus);
}

// 检查是否特殊节日
function isSpecialDay() {
    const specialDays = [
        "2024-01-01", // 新年
        "2024-02-14", // 情人节
        "2024-05-01", // 劳动节
        // 可以添加更多特殊日期
    ];
    
    const today = new Date().toISOString().split('T')[0];
    return specialDays.includes(today);
}

// 应用医疗礼包效果
function applyMedicalGift(spaceData, gift) {
    switch (gift.name) {
        case "草莓味营养剂":
            spaceData.personalStats.energy += 20;
            break;
        case "彩虹能量糖":
            spaceData.personalStats.happiness += 15;
            break;
        case "星光护身符":
            spaceData.protectionEndTime = new Date(Date.now() + 8 * 3600000).toISOString();
            break;
        case "治愈系音乐盒":
            spaceData.personalStats.stress = Math.max(0, spaceData.personalStats.stress * 0.75);
            break;
        case "梦幻睡眠喷雾":
            spaceData.restEfficiency = 1.3;
            break;
    }
}

// 生成健康建议
function generateHealthTips() {
    return [
        "记得保持规律的作息时间哦~",
        "多喝水对身体好呢!",
        "适当运动可以提高免疫力~",
        "心情愉快也是健康的一部分呢!",
        "累了的时候要及时休息哦~"
    ];
}

// 获取维修效果描述
function getRepairEffectDescription(repairAmount, maxDurability) {
    const percent = (repairAmount / maxDurability) * 100;
    if (percent >= 50) return "飞船焕然一新,闪闪发亮呢!";
    if (percent >= 30) return "飞船状态明显改善啦~";
    if (percent >= 20) return "修复了主要的损伤呢!";
    if (percent >= 10) return "飞船状态好多了呢~";
    return "修复了一些小问题啦!";
}

// 生成维修建议
function generateRepairSuggestions(spaceship) {
    const suggestions = [];
    const durabilityPercent = (spaceship.hullDurability / spaceship.maxHullDurability) * 100;

    if (durabilityPercent < 30) {
        suggestions.push("建议尽快进行下一次维修哦~");
    }
    if (spaceship.maintenanceHistory.length >= 10) {
        suggestions.push("可以考虑升级飞船部件呢!");
    }
    if (durabilityPercent < 50) {
        suggestions.push("记得携带备用维修工具哦~");
    }
    
    return suggestions;
}

// 检查维修成就
function checkRepairAchievement(spaceData) {
    const repairCount = spaceData.spaceship.maintenanceHistory.length;
    const achievements = {
        10: {
            name: "见习维修师",
            reward: "获得维修工具箱"
        },
        30: {
            name: "熟练维修师",
            reward: "维修效率提升10%"
        },
        50: {
            name: "维修大师",
            reward: "解锁特殊维修功能"
        },
        100: {
            name: "维修传奇",
            reward: "获得限定维修装备"
        }
    };

    return achievements[repairCount];
}

// 生成建议
function generateSuggestions(spaceStation) {
    const suggestions = [];
    if (spaceStation.constructionProgress < 100) {
        suggestions.push("继续建造空间站，让它变得更完善吧~");
    }
    if (!spaceStation.researchFacility) {
        suggestions.push("建造研究设施可以提升科研效率哦~");
    }
    if (!spaceStation.crewFacility) {
        suggestions.push("船员们需要一个温馨的休息场所呢~");
    }
    return suggestions;
}
 // 计算空间站氛围
 function calculateAtmosphere(spaceStation) {
    const atmosphereTypes = [
        "温馨浪漫", "充满活力", "宁静祥和",
        "欢乐热闹", "梦幻优雅", "科技感十足"
    ];
    return atmosphereTypes[Math.floor(Math.random() * atmosphereTypes.length)];
}

// 计算空间站效率
function calculateEfficiency(spaceStation) {
    let efficiency = 60;
    if (spaceStation.researchFacility) efficiency += 10;
    if (spaceStation.propulsionFacility) efficiency += 10;
    if (spaceStation.energyFacility) efficiency += 10;
    if (spaceStation.crewFacility) efficiency += 10;
    return efficiency;
}

// 计算幸福指数
function calculateHappiness(spaceStation) {
    let happiness = 70;
    if (spaceStation.crewFacility) happiness += 15;
    if (spaceStation.constructionProgress >= 100) happiness += 15;
    return Math.min(100, happiness);
}

// 获取装饰列表
function calculateDecoration(spaceStation) {
    const decorations = [];
    if (spaceStation.decorations && spaceStation.decorations.length > 0) {
        return spaceStation.decorations;
    }
    return ["🎀 可爱壁纸", "💫 星光吊灯", "🌟 梦幻地毯", "✨ 温馨盆栽"];
}

// 获取特殊功能
function getSpecialFeatures(spaceStation) {
    const features = [];
    if (spaceStation.constructionProgress >= 100) {
        features.push(
            "🎀 全息投影系统",
            "💫 自动清洁系统",
            "✨ 空气净化装置",
            "🌟 心情调节装置"
        );
    }
    return features;
}
// 计算船员状态
function calculateCrewStatus(member) {
    // 心情状态计算
    let mood;
    if (member.satisfaction >= 90) mood = "心花怒放";
    else if (member.satisfaction >= 70) mood = "开心愉快";
    else if (member.satisfaction >= 50) mood = "状态稳定";
    else if (member.satisfaction >= 30) mood = "有点疲惫";
    else mood = "需要关心";

    // 表现评级
    let performance;
    const performanceScore = member.performance + (member.satisfaction * 0.3);
    if (performanceScore >= 90) performance = "⭐⭐⭐⭐⭐";
    else if (performanceScore >= 70) performance = "⭐⭐⭐⭐";
    else if (performanceScore >= 50) performance = "⭐⭐⭐";
    else if (performanceScore >= 30) performance = "⭐⭐";
    else performance = "⭐";

    return { mood, performance };
}

// 获取心情表情
function getMoodEmoji(satisfaction) {
    if (satisfaction >= 90) return "🥰";
    if (satisfaction >= 70) return "😊";
    if (satisfaction >= 50) return "😌";
    if (satisfaction >= 30) return "😔";
    return "😢";
}

// 分析团队状态
function analyzeTeam(crew) {
    // 计算团队配合度
    const teamwork = ["完美配合", "默契十足", "和谐融洽", "逐渐磨合", "需要培养"][
        Math.floor(Math.random() * 5)
    ];

    // 计算团队氛围
    const atmosphere = ["欢乐活跃", "温馨和睦", "积极向上", "平和安宁", "充满干劲"][
        Math.floor(Math.random() * 5)
    ];

    // 计算整体效率
    const efficiency = Math.min(100, 
        Math.floor(crew.reduce((sum, member) => 
            sum + member.performance + (member.satisfaction * 0.5), 0) / crew.length)
    );

    return { teamwork, atmosphere, efficiency };
}

// 生成建议
function generateCrewSuggestions(crew, spaceship) {
    const suggestions = [];
    
    // 船员数量建议
    if (crew.length < spaceship.maxCrew) {
        suggestions.push(`舰长大人~您还可以招募${spaceship.maxCrew - crew.length}名船员哦~`);
    }

    // 满意度建议
    const lowSatisfactionCrew = crew.filter(m => m.satisfaction < 50);
    if (lowSatisfactionCrew.length > 0) {
        suggestions.push(`${lowSatisfactionCrew.length}名船员需要更多关心呢~`);
    }

    // 升级建议
    const needTraining = crew.filter(m => m.experience >= m.level * 100);
    if (needTraining.length > 0) {
        suggestions.push(`${needTraining.length}名船员可以进行升级训练啦~`);
    }

    return suggestions;
}
 // 计算研究效率
 function calculateResearchEfficiency(spaceStation) {
    let efficiency = 100;
    
    // 设施加成
    if (spaceStation.researchFacility) efficiency += 20;
    if (spaceStation.energyFacility) efficiency += 10;
    
    // 完成度加成
    if (spaceStation.constructionProgress >= 100) efficiency += 15;
    
    return efficiency;
}

// 获取可研究项目
function getAvailableProjects(researchLevel) {
    const projects = [
        { name: "星际通讯技术", requirement: "研究等级 1" },
        { name: "空间跃迁系统", requirement: "研究等级 2" },
        { name: "能源转换装置", requirement: "研究等级 3" },
        { name: "生态循环系统", requirement: "研究等级 4" },
        { name: "星际防护罩", requirement: "研究等级 5" }
    ];
    
    return projects.filter(p => parseInt(p.requirement.split(' ')[2]) <= researchLevel);
}

// 生成研究建议
function generateResearchSuggestions(spaceData) {
    const suggestions = [];
    
    // 设施建议
    if (!spaceData.spaceStation.researchFacility) {
        suggestions.push("建造研究设施可以提升20%研究效率哦~");
    }
    
    // 科研点建议
    if (spaceData.spaceStation.researchPoints < 50) {
        suggestions.push("科研点有点不足呢，要多进行一些研究活动~");
    }
    
    // 等级提升建议
    if (spaceData.spaceship.researchProgress >= 90) {
        suggestions.push("马上就要突破啦，继续加油研究吧！");
    }
    
    return suggestions;
}
 // 计算探索效率
 function calculateExplorationEfficiency(spaceStation) {
    let efficiency = 100;
    
    // 设施加成
    if (spaceStation.propulsionFacility) efficiency += 20;
    if (spaceStation.energyFacility) efficiency += 15;
    
    return efficiency;
}

// 获取探索状态
function getExplorationStatus(exploration) {
    const statuses = [
        { status: "正在探索中", discovery: "发现了闪耀的星光花" },
        { status: "寻找宝藏", discovery: "找到了神秘的空间宝箱" },
        { status: "观察星球", discovery: "记录到奇特的天文现象" },
        { status: "采集样本", discovery: "收集到稀有的星球标本" }
    ];
    
    return statuses[Math.floor(Math.random() * statuses.length)];
}

// 获取可探索星球
function getAvailablePlanets(explorationLevel) {
    return [
        { name: "粉红棉花糖星", difficulty: "★☆☆☆☆" },
        { name: "彩虹水晶星", difficulty: "★★☆☆☆" },
        { name: "梦幻花园星", difficulty: "★★★☆☆" },
        { name: "星光音乐星", difficulty: "★★★★☆" },
        { name: "魔法精灵星", difficulty: "★★★★★" }
    ].filter((_, index) => index < explorationLevel);
}

// 获取特殊物品列表
function getSpecialItems(collection) {
    if (!collection.specialItems || collection.specialItems.length === 0) {
        return ["暂无特殊物品收集~"];
    }
    return collection.specialItems.map(item => `   🎀 ${item}`);
}

// 生成探索建议
function generateExplorationSuggestions(spaceData) {
    const suggestions = [];
    
    if (!spaceData.spaceStation.propulsionFacility) {
        suggestions.push("建造推进设施可以提升探索效率哦~");
    }
    
    if (spaceData.spaceStation.explorationPoints < 20) {
        suggestions.push("探索点数有点不足呢，要补充一下吗？");
    }
    
    if (spaceData.spaceship.explorationProgress >= 90) {
        suggestions.push("马上就要发现新的星球啦，继续加油！");
    }
    
    return suggestions;
}
// 更新每日任务
async function updateDailyTasks(userData) {
    const today = new Date().toISOString().split('T')[0];
    if (userData.spaceData.lastDailyTaskUpdate !== today) {
        // 清除旧的每日任务
        userData.spaceData.tasks = userData.spaceData.tasks.filter(task => task.type !== 'daily');
        
        // 生成新的每日任务
        const dailyTasks = generateDailyTasks();
        userData.spaceData.tasks.push(...dailyTasks);
        userData.spaceData.lastDailyTaskUpdate = today;
    }
}

// 生成每日任务
function generateDailyTasks() {
    const tasks = [
        {
            name: "星尘收集",
            description: "收集100单位星尘",
            type: "daily",
            reward: { starDust: 50, crystals: 5 },
            progress: 0,
            target: 100
        },
        {
            name: "探索之旅",
            description: "完成3次星球探索",
            type: "daily",
            reward: { explorationPoints: 30 },
            progress: 0,
            target: 3
        },
        {
            name: "科研突破",
            description: "进行5次科学研究",
            type: "daily",
            reward: { researchPoints: 25 },
            progress: 0,
            target: 5
        }
    ];
    return tasks;
}

// 格式化任务信息
function formatTaskInfo(task) {
    const progressBar = createProgressBar(task.progress, task.target);
    return `   🎯 ${task.name}: ${progressBar} ${task.progress}/${task.target}\n      💝 奖励: ${formatReward(task.reward)}`;
}

// 创建进度条
function createProgressBar(current, total) {
    const length = 10;
    const progress = Math.floor((current / total) * length);
    return '█'.repeat(progress) + '░'.repeat(length - progress);
}

// 格式化奖励信息
function formatReward(reward) {
    const rewardText = [];
    if (reward.starDust) rewardText.push(`星尘x${reward.starDust}`);
    if (reward.crystals) rewardText.push(`水晶x${reward.crystals}`);
    if (reward.explorationPoints) rewardText.push(`探索点x${reward.explorationPoints}`);
    if (reward.researchPoints) rewardText.push(`科研点x${reward.researchPoints}`);
    return rewardText.join(', ');
}

// 获取任务奖励预览
function getTaskRewardPreview(taskStats) {
    const totalRewards = calculateTotalRewards(taskStats);
    return [
        `   ✨ 星尘: ${totalRewards.starDust}`,
        `   💎 水晶: ${totalRewards.crystals}`,
        `   🚀 探索点: ${totalRewards.explorationPoints}`,
        `   📚 科研点: ${totalRewards.researchPoints}`
    ];
}

 // 计算基础奖励
 function calculateBaseReward(task) {
    return task.reward;
}

// 计算额外奖励
function calculateBonusReward(task, spaceData) {
    const bonus = {
        starDust: 0,
        crystals: 0,
        explorationPoints: 0,
        researchPoints: 0
    };

    // 根据任务难度和完成速度计算额外奖励
    const difficultyBonus = Math.floor(Math.random() * 20 + 10);
    const speedBonus = Math.floor(Math.random() * 15 + 5);

    Object.keys(task.reward).forEach(key => {
        bonus[key] = Math.floor(task.reward[key] * (difficultyBonus + speedBonus) / 100);
    });

    return bonus;
}

// 合并奖励
function combinedRewards(base, bonus) {
    const total = { ...base };
    Object.keys(bonus).forEach(key => {
        if (total[key]) {
            total[key] += bonus[key];
        } else {
            total[key] = bonus[key];
        }
    });
    return total;
}

// 格式化奖励列表
function formatRewardList(rewards) {
    return Object.entries(rewards).map(([key, value]) => {
        const icon = {
            starDust: "✨",
            crystals: "💎",
            explorationPoints: "🚀",
            researchPoints: "📚"
        }[key];
        return `   ${icon} ${key}: ${value}`;
    });
}

// 生成完成特效
function generateCompletionEffects(task) {
    const effects = [
        "✨ 星光闪耀",
        "🌟 任务完成特效",
        "💫 成就达成光环",
        "🎀 可爱泡泡飘散"
    ];
    return effects.map(effect => `   ${effect}`);
}

// 检查连续完成奖励
function checkStreakBonus(spaceData) {
    if (!spaceData.taskStreak) {
        spaceData.taskStreak = 1;
    } else {
        spaceData.taskStreak++;
    }

    if (spaceData.taskStreak % 5 === 0) {
        return {
            starDust: 100 * spaceData.taskStreak,
            crystals: 10 * spaceData.taskStreak
        };
    }
    return null;
}
 // 计算连续签到奖励
 function calculateStreakBonus(streak) {
    const bonus = {
        starDust: Math.floor(streak * 10),
        spaceCrystals: Math.floor(streak / 5),
        spacePoints: Math.floor(streak * 5)
    };

    // 7天额外奖励
    if (streak % 7 === 0) {
        bonus.starDust *= 2;
        bonus.spaceCrystals *= 2;
        bonus.spacePoints *= 2;
    }

    return bonus;
}

// 计算特殊日期奖励
function calculateSpecialDateBonus(date) {
    const specialDates = {
        "2024-01-01": { name: "新年快乐", multiplier: 3 },
        "2024-02-14": { name: "情人节快乐", multiplier: 2 },
        // 可以添加更多特殊日期
    };

    if (specialDates[date]) {
        return {
            starDust: 100 * specialDates[date].multiplier,
            spaceCrystals: 10 * specialDates[date].multiplier,
            spacePoints: 100 * specialDates[date].multiplier
        };
    }
    return null;
}

// 获取随机特殊物品
function getRandomSpecialItem() {
    const specialItems = [
        { name: "星光瓶", icon: "🌟", rarity: "rare" },
        { name: "彩虹糖", icon: "🍬", rarity: "common" },
        { name: "梦幻羽毛", icon: "🪶", rarity: "uncommon" },
        { name: "星际贴纸", icon: "✨", rarity: "common" },
        { name: "魔法水晶", icon: "💎", rarity: "rare" }
    ];

    const random = Math.random();
    let items = specialItems;
    if (random < 0.1) {
        items = specialItems.filter(item => item.rarity === "rare");
    } else if (random < 0.4) {
        items = specialItems.filter(item => item.rarity === "uncommon");
    }

    return items[Math.floor(Math.random() * items.length)];
}

// 格式化每日奖励
function formatDailyRewards(rewards) {
    return Object.entries(rewards).map(([key, value]) => {
        const icon = {
            starDust: "✨",
            spaceCrystals: "💎",
            spacePoints: "🎀",
            explorationPoints: "🚀",
            researchPoints: "📚"
        }[key];
        return `   ${icon} ${key}: ${value}`;
    });
}

// 获取每日寄语
function getDailyQuotes() {
    const quotes = [
        "今天也要开开心心地探索宇宙呢~",
        "太空中的每一颗星星都在等着你去发现哦~",
        "和可爱的船员们一起努力吧！",
        "记得照顾好自己，宇宙需要一个健康的你~",
        "今天也是充满希望的一天呢！"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

// 获取心情图标
function getMoodIcon(satisfaction) {
    if (satisfaction >= 90) return "😊";
    if (satisfaction >= 70) return "😄";
    if (satisfaction >= 50) return "😌";
    return "😔";
}

// 获取随机心声
function getRandomThought(member) {
    const thoughts = [
        "今天也要努力工作呢！",
        "和大家一起探索太空真开心~",
        "希望能发现新的星球！",
        "舰长最棒了！",
        "想吃甜点了呢..."
    ];
    return thoughts[Math.floor(Math.random() * thoughts.length)];
}

// 评估团队状态
function evaluateTeam(crew) {
    const avgSatisfaction = crew.reduce((sum, member) => sum + member.satisfaction, 0) / crew.length;
    const avgPerformance = crew.reduce((sum, member) => sum + member.performance, 0) / crew.length;

    let performance = "优秀";
    if (avgPerformance >= 90) performance = "卓越";
    else if (avgPerformance >= 70) performance = "优秀";
    else if (avgPerformance >= 50) performance = "良好";
    else performance = "需要提升";

    let atmosphere = "温馨和谐";
    if (avgSatisfaction >= 90) atmosphere = "其乐融融";
    else if (avgSatisfaction >= 70) atmosphere = "温馨和谐";
    else if (avgSatisfaction >= 50) atmosphere = "和谐";
    else atmosphere = "需要关注";

    return {
        harmony: Math.floor(avgSatisfaction),
        performance,
        atmosphere
    };
}
// 获取商品信息
function getItemInfo(itemId) {
    const items = {
        1: { name: "星光投影灯", price: 100, effect: "提升心情值5%", quality: "✧₊⁺" },
        2: { name: "梦幻音乐盒", price: 150, effect: "提升满意度8%", quality: "✧₊⁺⁺" },
        // ... 更多商品
    };
    return items[itemId];
}

// 应用物品效果
function applyItemEffect(spaceData, item) {
    switch (item.name) {
        case "星光投影灯":
            spaceData.personalStats.happiness += 5;
            break;
        case "梦幻音乐盒":
            spaceData.spaceship.crew.forEach(crew => {
                crew.satisfaction = Math.min(100, crew.satisfaction + 8);
            });
            break;
        // ... 更多效果
    }
}

// 随机购买特效
function getRandomPurchaseEffect() {
    const effects = [
        "✨ 商品闪耀着梦幻的光芒~",
        "🎀 包装上缠绕着可爱的丝带~",
        "💫 空气中飘散着星光的味道~",
        "🌟 传来了悦耳的购物音效~",
        "💝 收到了店员的赠送小礼物~"
    ];
    return effects[Math.floor(Math.random() * effects.length)];
}
// 生成采集物品
function generateCollectedItems(amount) {
    const items = {
        common: [
            {name: "星光碎片", value: 10},
            {name: "彩虹水晶", value: 15},
            {name: "宇宙尘埃", value: 8},
            {name: "太空花朵", value: 12},
            {name: "能量结晶", value: 20}
        ],
        rare: [
            {name: "梦幻之星", value: 50},
            {name: "星云宝石", value: 45},
            {name: "彩虹矿石", value: 40},
            {name: "星光精华", value: 55},
            {name: "太空蝴蝶", value: 60}
        ],
        epic: [
            {name: "星河之心", value: 100},
            {name: "梦境结晶", value: 120},
            {name: "时空碎片", value: 150},
            {name: "宇宙之花", value: 180},
            {name: "星光宝盒", value: 200}
        ]
    };

    const collected = [];
    let remaining = amount;

    while (remaining > 0) {
        const rarity = Math.random();
        let category;
        if (rarity < 0.7) category = "common";
        else if (rarity < 0.95) category = "rare";
        else category = "epic";

        const item = items[category][Math.floor(Math.random() * items[category].length)];
        const quantity = Math.min(Math.floor(Math.random() * 3) + 1, remaining);
        
        collected.push({
            ...item,
            quantity: quantity,
            rarity: category
        });

        remaining -= quantity;
    }

    return collected;
}

// 格式化采集物品列表
function formatCollectedItems(items) {
    const rarityIcons = {
        common: "✧",
        rare: "✦",
        epic: "✴"
    };

    return items.map(item => 
        `   ${rarityIcons[item.rarity]} ${item.name} x${item.quantity} (价值:${item.value})`
    );
}

// 检查特殊发现
function checkSpecialDiscovery() {
    if (Math.random() < 0.1) {
        const discoveries = [
            {
                name: "星光蝴蝶",
                description: "会发光的美丽蝴蝶,可以提升心情值",
                effect: "happiness"
            },
            {
                name: "彩虹花园",
                description: "一片美丽的太空花园,可以收获特殊种子",
                effect: "collection"
            },
            {
                name: "星云温泉",
                description: "充满治愈能量的温泉,可以恢复疲劳",
                effect: "energy"
            }
        ];
        return discoveries[Math.floor(Math.random() * discoveries.length)];
    }
    return null;
}

// 应用特殊发现效果
function applySpecialDiscovery(spaceData, discovery) {
    switch (discovery.effect) {
        case "happiness":
            spaceData.personalStats.happiness += 20;
            break;
        case "collection":
            spaceData.collection.specialSeeds = (spaceData.collection.specialSeeds || 0) + 1;
            break;
        case "energy":
            spaceData.personalStats.energy = 100;
            break;
    }
}

// 检查背包状态
function checkBackpackStatus(spaceData) {
    const maxCapacity = 100;
    const currentItems = spaceData.inventory ? spaceData.inventory.length : 0;
    return {
        current: currentItems,
        max: maxCapacity,
        nearFull: currentItems > maxCapacity * 0.8
    };
}

// 添加采集物品到背包
function addCollectedItems(spaceData, items) {
    spaceData.inventory = spaceData.inventory || [];
    items.forEach(item => {
        spaceData.inventory.push({
            ...item,
            collectedAt: new Date().toISOString()
        });
    });
}
// 显示扩展选项
function showExpansionOptions(spaceData, e) {
    const expansionOptions = [
        {
            name: "梦幻花园",
            type: "休闲区",
            description: "种植各种太空植物的美丽花园",
            features: ["自动灌溉", "情绪提升", "特殊植物"]
        },
        {
            name: "星光温室",
            type: "种植区",
            description: "培育稀有植物的特殊温室",
            features: ["环境控制", "快速生长", "稀有作物"]
        },
        {
            name: "彩虹广场",
            type: "娱乐区",
            description: "举办活动的多功能广场",
            features: ["灯光秀", "音乐喷泉", "活动场地"]
        }
    ];

    const optionList = [
        "•*¨*•.¸¸🏗️¸¸.•*¨*•",
        "🎀 基地扩展选项 🎀",
        "",
        "💫 可扩展区域:"
    ];

    expansionOptions.forEach(option => {
        optionList.push(
            `\n✨ ${option.name}:`,
            `   ✧ 类型: ${option.type}`,
            `   ✧ 说明: ${option.description}`,
            `   ✧ 特色: ${option.features.join(', ')}`
        );
    });

    optionList.push(
        "",
        "🚀 扩展指令: #太空基地扩展 [区域名称]",
        "💝 今日推荐: 梦幻花园(建设消耗-20%)",
        "",
        "🌸 温馨提示:",
        "   ✧ 扩展会消耗资源",
        "   ✧ 不同区域效果不同",
        "   ✧ 可以添加可爱装饰哦~",
        "",
        "✨ 让我们把基地建设得更美丽吧!",
        "•*¨*•.¸¸🏗️¸¸.•*¨*•"
    );

    e.reply(optionList.join('\n'));
}
// 获取扩展信息
function getExpansionInfo(expansionType, spaceData) {
    const expansionConfigs = {
        "梦幻花园": {
            name: "梦幻花园",
            type: "休闲区",
            requirements: {
                spacePoints: 200,
                level: 2
            },
            cost: {
                starDust: 100,
                crystals: 20
            },
            size: "中型",
            effects: ["心情值+20%", "生产效率+15%"]
        },
        "星光温室": {
            name: "星光温室",
            type: "种植区",
            requirements: {
                spacePoints: 250,
                level: 3
            },
            cost: {
                starDust: 150,
                crystals: 30
            },
            size: "大型",
            effects: ["作物产量+30%", "特殊植物解锁"]
        },
        // 可以添加更多扩展配置
    };
    return expansionConfigs[expansionType];
}

// 检查扩展要求
function checkExpansionRequirements(spaceData, expansionInfo) {
    if (!expansionInfo) return false;
    const requirements = expansionInfo.requirements;
    return (
        spaceData.spacePoints >= requirements.spacePoints &&
        spaceData.baseLevel >= requirements.level
    );
}

// 执行扩展
function performExpansion(spaceData, expansionInfo) {
    return {
        size: expansionInfo.size,
        effects: expansionInfo.effects,
        newFacilities: generateNewFacilities(expansionInfo),
        discoveries: generateExpansionDiscoveries(expansionInfo)
    };
}

// 生成新设施
function generateNewFacilities(expansionInfo) {
    const facilities = {
        "梦幻花园": ["花园喷泉", "休息亭", "观景台"],
        "星光温室": ["自动灌溉系统", "生长加速器", "环境控制器"],
        // 可以添加更多设施
    };
    return facilities[expansionInfo.name] || [];
}

// 生成扩展发现
function generateExpansionDiscoveries(expansionInfo) {
    const discoveries = {
        "梦幻花园": ["发现了稀有花种!", "遇到了可爱的小精灵~"],
        "星光温室": ["发现了神秘植物!", "观察到特殊生长现象!"],
        // 可以添加更多发现
    };
    return discoveries[expansionInfo.name] || [];
}

// 应用扩展消耗
function applyExpansionCost(spaceData, cost) {
    spaceData.collection.starDust -= cost.starDust;
    spaceData.collection.spaceCrystals -= cost.crystals;
}

// 应用扩展效果
function applyExpansionEffects(spaceData, expandResult) {
    expandResult.effects.forEach(effect => {
        if (effect.includes("心情值")) {
            const value = parseInt(effect.match(/\d+/)[0]);
            spaceData.personalStats.happiness += value;
        }
        if (effect.includes("生产效率")) {
            const value = parseInt(effect.match(/\d+/)[0]);
            spaceData.productionEfficiency = (spaceData.productionEfficiency || 100) + value;
        }
        // 可以添加更多效果处理
    });
}

// 生成扩展建议
function generateExpansionTips(expansionInfo) {
    return [
        "记得定期维护新区域哦~",
        "可以添加一些可爱的装饰呢!",
        "注意调整环境参数以获得最佳效果~",
        "多关注新设施的运行状况哦!"
    ];
}

// 生成装饰建议
function generateDecorationTips(expansionInfo) {
    const tips = {
        "梦幻花园": [
            "可以摆放一些发光的花朵~",
            "添加可爱的小动物装饰呢!",
            "星光长椅很适合这里哦~"
        ],
        "星光温室": [
            "彩虹色的培养箱很漂亮呢~",
            "悬挂一些星光藤蔓吧!",
            "放置几个可爱的小花盆~"
        ]
    };
    return tips[expansionInfo.name] || [];
}
function calculateTotalRewards(taskStats) {
    const totalRewards = {
        starDust: 0,
        crystals: 0,
        explorationPoints: 0,
        researchPoints: 0
    };
    
    // 计算日常任务奖励
    taskStats.dailyTasks.forEach(task => {
        if (task.reward) {
            Object.keys(task.reward).forEach(key => {
                totalRewards[key] = (totalRewards[key] || 0) + task.reward[key];
            });
        }
    });
    
    // 计算主线任务奖励
    taskStats.mainTasks.forEach(task => {
        if (task.reward) {
            Object.keys(task.reward).forEach(key => {
                totalRewards[key] = (totalRewards[key] || 0) + task.reward[key];
            });
        }
    });
    
    return totalRewards;
}
function categorizeAndCountTasks(tasks) {
    const stats = {
        total: tasks.length,
        completed: 0,
        inProgress: 0,
        dailyTasks: [],
        mainTasks: [],
        sideTasks: [],
        specialTasks: []
    };
    
    tasks.forEach(task => {
        // 统计完成状态
        if (task.progress >= task.target) {
            stats.completed++;
        } else {
            stats.inProgress++;
        }
        
        // 分类任务
        switch(task.type) {
            case 'daily':
                stats.dailyTasks.push(task);
                break;
            case 'main':
                stats.mainTasks.push(task);
                break;
            case 'side':
                stats.sideTasks.push(task);
                break;
            case 'special':
                stats.specialTasks.push(task);
                break;
        }
    });
    
    return stats;
}
function applyDailyRewards(spaceData, baseRewards, streakBonus, specialBonus, specialItem) {
    // 应用基础奖励
    spaceData.collection.starDust += baseRewards.starDust || 0;
    spaceData.collection.spaceCrystals += baseRewards.spaceCrystals || 0;
    spaceData.spacePoints += baseRewards.spacePoints || 0;
    
    // 应用连续签到奖励
    if (streakBonus) {
        spaceData.collection.starDust += streakBonus.starDust || 0;
        spaceData.collection.spaceCrystals += streakBonus.spaceCrystals || 0;
        spaceData.spacePoints += streakBonus.spacePoints || 0;
    }
    
    // 应用特殊日期奖励
    if (specialBonus) {
        spaceData.collection.starDust += specialBonus.starDust || 0;
        spaceData.collection.spaceCrystals += specialBonus.spaceCrystals || 0;
        spaceData.spacePoints += specialBonus.spacePoints || 0;
    }
    
    // 添加特殊物品
    if (specialItem) {
        spaceData.collection.specialItems = spaceData.collection.specialItems || [];
        spaceData.collection.specialItems.push(specialItem);
    }
}
function checkForGift(item) {
    // 根据物品品质和随机概率决定是否赠送礼物
    const giftChance = {
        '普通': 0.1,
        '精良': 0.2,
        '稀有': 0.3,
        '史诗': 0.4,
        '传说': 0.5
    };
    
    const randomChance = Math.random();
    if (randomChance < (giftChance[item.quality] || 0.1)) {
        const gifts = [
            {name: "可爱星星贴纸", effect: "装饰效果"},
            {name: "迷你彩虹瓶", effect: "心情提升"},
            {name: "星光小饰品", effect: "幸运提升"},
            {name: "梦幻气泡", effect: "美化效果"}
        ];
        return gifts[Math.floor(Math.random() * gifts.length)];
    }
    return null;
}
function calculateDiscount(userData, item) {
    // 计算商品折扣
    let rate = 1.0;
    let desc = "无折扣";

    // 会员等级折扣
    const memberLevel = userData.memberLevel || 0;
    if (memberLevel > 0) {
        rate -= memberLevel * 0.05;
        desc = `会员${memberLevel}级优惠`;
    }

    // 批量购买折扣
    const dailyPurchases = userData.spaceData.dailyPurchases || 0;
    if (dailyPurchases >= 5) {
        rate -= 0.1;
        desc += "、批量购买优惠";
    }

    // 特殊商品折扣
    if (item.isOnSale) {
        rate -= 0.2;
        desc += "、特价商品";
    }

    return {
        rate: Math.max(0.5, rate), // 最低五折
        desc: desc
    };
}
function updateMembershipInfo(userData) {
    const totalSpent = userData.totalSpent || 0;
    const currentLevel = userData.memberLevel || 0;
    const levelThresholds = [1000, 5000, 10000, 50000];
    
    let newLevel = currentLevel;
    let levelUp = false;
    let reward = "";

    // 检查是否升级
    for (let i = currentLevel; i < levelThresholds.length; i++) {
        if (totalSpent >= levelThresholds[i]) {
            newLevel = i + 1;
            levelUp = true;
            reward = `获得${newLevel}级会员礼包`;
        }
    }

    if (levelUp) {
        userData.memberLevel = newLevel;
        // 添加升级奖励
        userData.spaceData.collection.starDust += newLevel * 100;
        userData.spaceData.collection.spaceCrystals += newLevel * 10;
    }

    return {
        level: newLevel,
        levelUp,
        reward
    };
}
function checkDefenseRequirements(userData, defenseInfo) {
    // 检查防御设施建造要求
    const requirements = defenseInfo.requirements;
    
    // 检查等级要求
    if (requirements.level && userData.spaceData.baseLevel < requirements.level) {
        return false;
    }

    // 检查资源要求
    if (requirements.spacePoints && userData.spaceData.spacePoints < requirements.spacePoints) {
        return false;
    }

    // 检查前置设施
    if (requirements.facilities) {
        for (const facility of requirements.facilities) {
            if (!userData.spaceData.spaceStation[facility]) {
                return false;
            }
        }
    }

    return true;
}
function buildDefense(spaceData, defenseInfo) {
    // 建造防御设施
    const result = {
        effects: [],
        specialFeatures: [],
        buffs: []
    };

    // 添加基础效果
    result.effects.push(
        `防御力提升${defenseInfo.power}点`,
        `能量消耗${defenseInfo.energyCost}点/小时`
    );

    // 添加特殊功能
    if (defenseInfo.special) {
        result.specialFeatures.push(
            `解锁${defenseInfo.special.name}`,
            `特殊效果: ${defenseInfo.special.effect}`
        );
    }

    // 添加增益效果
    if (defenseInfo.buffs) {
        result.buffs.push(
            `周围设施效率提升${defenseInfo.buffs.efficiency}%`,
            `防御协同效果+${defenseInfo.buffs.synergy}%`
        );
    }

    return result;
}
function getDefenseInfo(defenseType) {
    // 防御设施信息配置
    const defenseConfigs = {
        "彩虹护盾": {
            name: "彩虹护盾",
            type: "防护",
            power: 100,
            energyCost: 20,
            requirements: {
                level: 2,
                spacePoints: 200,
                facilities: ["energyFacility"]
            },
            special: {
                name: "彩虹反射",
                effect: "反弹30%伤害"
            },
            buffs: {
                efficiency: 15,
                synergy: 20
            }
        },
        "星光炮台": {
            name: "星光炮台",
            type: "攻击",
            power: 80,
            energyCost: 15,
            requirements: {
                level: 3,
                spacePoints: 250,
                facilities: ["propulsionFacility"]
            },
            special: {
                name: "星光打击",
                effect: "范围攻击"
            },
            buffs: {
                efficiency: 10,
                synergy: 15
            }
        }
    };
    return defenseConfigs[defenseType];
}
function generateDefenseTips(defenseInfo) {
    const tips = [];
    switch(defenseInfo.type) {
        case "防护":
            tips.push(
                "建议将护盾设施分散布置~",
                "记得定期检查能源供应哦~",
                "可以搭配其他防御设施使用更好呢!"
            );
            break;
        case "攻击":
            tips.push(
                "注意攻击设施的覆盖范围哦~",
                "建议设置自动预警系统呢~",
                "可以和护盾设施互相配合!"
            );
            break;
        default:
            tips.push(
                "定期维护可以提高设施效率哦~",
                "注意观察设施的运行状态~",
                "合理搭配不同类型的防御设施!"
            );
    }
    return tips;
}
function formatDefenseEffects(effects) {
    return effects.map(effect => `   ✧ ${effect}`);
}
function applyDefenseCost(spaceData, cost) {
    // 扣除建造消耗
    spaceData.spacePoints -= cost.spacePoints || 0;
    spaceData.collection.starDust -= cost.starDust || 0;
    spaceData.collection.spaceCrystals -= cost.crystals || 0;
    spaceData.spaceship.energyCapacity -= cost.energy || 0;
}
function applyDefenseEffects(spaceData, buildResult) {
    // 应用防御设施效果
    spaceData.defenseLevel = (spaceData.defenseLevel || 0) + 1;
    spaceData.defensePower = (spaceData.defensePower || 0) + buildResult.power;
    
    // 应用特殊效果
    if (buildResult.specialFeatures.length > 0) {
        spaceData.specialDefenseFeatures = spaceData.specialDefenseFeatures || [];
        spaceData.specialDefenseFeatures.push(...buildResult.specialFeatures);
    }
    
    // 应用增益效果
    if (buildResult.buffs.length > 0) {
        spaceData.defenseBuffs = spaceData.defenseBuffs || [];
        spaceData.defenseBuffs.push(...buildResult.buffs);
    }
}
function checkUpgradeRequirements(spaceData, upgradeInfo) {
    // 检查升级条件
    if (!upgradeInfo || !upgradeInfo.requirements) return false;
    
    // 检查基地等级
    if (upgradeInfo.requirements.baseLevel > spaceData.baseLevel) {
        return false;
    }
    
    // 检查太空点数
    if (upgradeInfo.requirements.spacePoints > spaceData.spacePoints) {
        return false;
    }
    
    // 检查其他资源
    if (upgradeInfo.requirements.starDust && 
        upgradeInfo.requirements.starDust > spaceData.collection.starDust) {
        return false;
    }
    
    if (upgradeInfo.requirements.crystals && 
        upgradeInfo.requirements.crystals > spaceData.collection.spaceCrystals) {
        return false;
    }
    
    return true;
}
function formatRequirements(requirements) {
    const requirementsList = [];
    
    if (requirements.baseLevel) {
        requirementsList.push(`基地等级 ${requirements.baseLevel}`);
    }
    
    if (requirements.spacePoints) {
        requirementsList.push(`太空点数 ${requirements.spacePoints}`);
    }
    
    if (requirements.starDust) {
        requirementsList.push(`星尘 ${requirements.starDust}`);
    }
    
    if (requirements.crystals) {
        requirementsList.push(`空间水晶 ${requirements.crystals}`);
    }
    
    return requirementsList.join('、');
}
function performUpgrade(spaceData, upgradeInfo) {
    const result = {
        oldLevel: spaceData.baseLevel,
        newLevel: spaceData.baseLevel + 1,
        effects: [],
        specialEffects: [],
        unlocks: []
    };
    
    // 基础升级效果
    result.effects.push(
        `基地容量 +${upgradeInfo.basePoints}`,
        `效率提升 ${upgradeInfo.levelMultiplier * 10}%`
    );
    
    // 特殊效果
    if (result.newLevel % 5 === 0) {
        result.specialEffects.push(
            "解锁特殊装饰",
            "获得升级礼包",
            "额外效率加成"
        );
    }
    
    // 解锁内容
    if (upgradeInfo.unlocks) {
        result.unlocks.push(...upgradeInfo.unlocks);
    }
    
    return result;
}
function formatUpgradeEffects(effects) {
    return effects.map(effect => `   ✧ ${effect}`);
}
function applyUpgradeCost(spaceData, cost) {
    // 扣除升级消耗
    if (cost.spacePoints) {
        spaceData.spacePoints -= cost.spacePoints;
    }
    
    if (cost.starDust) {
        spaceData.collection.starDust -= cost.starDust;
    }
    
    if (cost.crystals) {
        spaceData.collection.spaceCrystals -= cost.crystals;
    }
    
    if (cost.energy) {
        spaceData.spaceship.energyCapacity -= cost.energy;
    }
}
function applyUpgradeEffects(spaceData, upgradeResult) {
    // 提升等级
    spaceData.baseLevel = upgradeResult.newLevel;
    
    // 应用效果
    upgradeResult.effects.forEach(effect => {
        if (effect.includes('容量')) {
            const value = parseInt(effect.match(/\d+/)[0]);
            spaceData.baseCapacity = (spaceData.baseCapacity || 100) + value;
        }
        if (effect.includes('效率')) {
            const value = parseInt(effect.match(/\d+/)[0]);
            spaceData.baseEfficiency = (spaceData.baseEfficiency || 100) + value;
        }
    });
    
    // 应用特殊效果
    if (upgradeResult.specialEffects.length > 0) {
        spaceData.specialEffects = spaceData.specialEffects || [];
        spaceData.specialEffects.push(...upgradeResult.specialEffects);
    }
    
    // 解锁新内容
    if (upgradeResult.unlocks.length > 0) {
        spaceData.unlockedContent = spaceData.unlockedContent || [];
        spaceData.unlockedContent.push(...upgradeResult.unlocks);
    }
}
// 更新成就
function updateAchievements(spaceData, task) {
    // 检查任务相关成就
    const achievements = {
        taskCompletion: {
            name: "任务达人",
            condition: spaceData.completedTasks >= 10,
            reward: "星尘 x 100"
        },
        perfectTask: {
            name: "完美执行",
            condition: task.performance >= 100,
            reward: "空间水晶 x 10"
        }
    };
    
    // 检查并授予成就
    Object.entries(achievements).forEach(([key, achievement]) => {
        if (achievement.condition && !spaceData.achievements.includes(achievement.name)) {
            spaceData.achievements.push(achievement.name);
            // 发放成就奖励
            if (achievement.reward.includes('星尘')) {
                spaceData.collection.starDust += parseInt(achievement.reward.split('x')[1]);
            }
            if (achievement.reward.includes('空间水晶')) {
                spaceData.collection.spaceCrystals += parseInt(achievement.reward.split('x')[1]);
            }
        }
    });
}

// 应用奖励
function applyRewards(spaceData, rewards) {
    // 应用基础奖励
    if (rewards.starDust) {
        spaceData.collection.starDust += rewards.starDust;
    }
    if (rewards.spaceCrystals) {
        spaceData.collection.spaceCrystals += rewards.spaceCrystals;
    }
    if (rewards.explorationPoints) {
        spaceData.explorationPoints += rewards.explorationPoints;
    }
    if (rewards.researchPoints) {
        spaceData.researchPoints += rewards.researchPoints;
    }
    
    // 检查是否有特殊奖励
    if (rewards.specialItem) {
        spaceData.collection.specialItems = spaceData.collection.specialItems || [];
        spaceData.collection.specialItems.push(rewards.specialItem);
    }
    
    // 更新统计数据
    spaceData.totalRewardsReceived = (spaceData.totalRewardsReceived || 0) + 1;
}

// 生成特殊事件
function generateSpecialEvents(mission) {
    const events = [
        {
            trigger: "遇到可爱的太空生物",
            effect: "心情值提升20%",
            reward: "获得特殊道具"
        },
        {
            trigger: "发现隐藏补给箱",
            effect: "恢复能源30%",
            reward: "获得额外材料"
        },
        {
            trigger: "触发幸运时刻",
            effect: "任务难度降低",
            reward: "双倍奖励"
        }
    ];
    
    // 随机选择事件
    return events.sort(() => 0.5 - Math.random()).slice(0, 2);
}