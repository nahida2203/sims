import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import {
    saveUserData,
    loadAllUsers,
    checkUserData,
    readConfiguration,
    saveBanData,
    loadBanList,
} from '../function/function.js';
import { checkCooldown, setCooldown } from '../function/cooldown.js';
import Redis from 'ioredis';
const _path = process.cwd().replace(/\\/g, "/");
const redis = new Redis();
const cooldownConfig = yaml.parse(fs.readFileSync(path.join(process.cwd(), 'plugins/sims-plugin/config/cooldown.yaml'), 'utf8'));
const sensitiveWords = [
 "裸露", "fuck", "傻逼", "操你",  "人机",
  "cnm", "草泥马", "nmsl", "你妈", "尼玛", "nmb"
];
const staminaPotions = [
  { id: "2001", name: "小型体力药水", price: 350, recovery: 10 },
  { id: "2002", name: "中型体力药水", price: 700, recovery: 25 },
  { id: "2003", name: "大型体力药水", price: 1050, recovery: 40 },
  { id: "2004", name: "超级体力药水", price: 1400, recovery: 60 }
];

export class UserStart extends plugin {
    constructor() {
        super({
            name: 'UserStart',
            dsc: '游戏开始',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#开始模拟人生$', fnc: 'Create_player' },
                { reg: '^#设置性别.*$', fnc: 'Set_sex' },
                { reg: '^#模拟人生改名.*$', fnc: 'Change_player_name' },
                { reg: '^#模拟人生签到$', fnc: 'daily_gift' },
                { reg: '^#模拟人生信息$', fnc: 'Show_status' },
                { reg: '^#模拟人生查看头像馆$', fnc: 'View_avatars' },
                { reg: '^#设置模拟人生头像.*$', fnc: 'Set_avatar' },
                { reg: '^#模拟人生修改签名.*$', fnc: 'Change_signature' },
                { reg: '^#购买体力药水.*$', fnc: 'Buy_stamina_potion' },
                { reg: '^#食用体力药水.*$', fnc: 'Use_stamina_potion' },
                { reg: '^#查看体力药水$', fnc: 'View_stamina_potions' },
            ],
        });
        this.task = {
            cron: '0 * * * *',
            name: 'Task',
            fnc: () => this.updatePlayerData(),
        };
    }

    async Create_player(e) {
        // 检查冷却
        const remainingTime = checkCooldown(e.user_id, 'mnrs', 'create');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (userData) {
            e.reply("你已经开始过模拟人生了！");
            return;
        }

        // 初始化玩家信息
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456689涩批地球';
        let conversionCode = '';
        for (let i = 0; i < 7; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            const randomChar = characters.charAt(randomIndex);
            conversionCode += randomChar;
        }

        const userDataToSave = {
            name: `玩家${conversionCode}`,
            money: 1000,
            happiness: 100,
            life: 100,
            hunger: 100,
            thirst: 100,
            charm: 50,
            mood: 100,
            signature: "我是一名玩家",
            gender: "未知",
            disease: null,
            status: "健康",
            job: null,
            level: 1,
            stamina: 100,
            partnerAffection: 0,
            relationshipStatus: "单身",
            time: 0,
            weather: "晴天",
            temperature: 25,
            backpack: [],
            backpackCapacity: 100,
            location: "家",
            familyHappiness: 100,
            overdueTasks: 0,
            avatar: "default.jpg",
            lastSignInDate: null,
            dailySignIn: false,
            consecutiveSignIn: 0,
            bank: {
                balance: 0,
                savingsLimit: 10000,
                deposits: [],
            }
        };

        await saveUserData(userId, userDataToSave);
        await redis.set(`user:${userId}`, JSON.stringify(userDataToSave));
        setCooldown(e.user_id, 'mnrs', 'create');

        e.reply("欢迎来到模拟人生！数据已初始化。");
    }

    async Change_player_name(e) {
        const remainingTime = checkCooldown(e.user_id, 'mnrs', 'set');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        // 检查是否被封禁
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
        }

        const newName = e.msg.replace('#模拟人生改名', '').trim();
        if (newName.length > 12) {
            e.reply("新名字的字符长度不得超过12个字符。");
        } else {
            const allUsers = await loadAllUsers();
            const nameExists = Object.values(allUsers).some(user => user.name === newName);
            if (nameExists) {
                e.reply("该名字已被其他玩家使用，请选择其他名字。");
            } else {
                userData.name = newName;
                await redis.set(`user:${userId}`, JSON.stringify(userData));
                await saveUserData(userId, userData);

                // 设置冷却
                setCooldown(e.user_id, 'mnrs', 'set');

                e.reply(`你的名字已更改为: ${newName}`);
            }
        }
    }

    async Set_sex(e) {
        const remainingTime = checkCooldown(e.user_id, 'mnrs', 'set');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        // 检查是否被封禁
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
        }

        const gender = e.msg.replace('#设置性别', '').trim();
        if (gender === "男" || gender === "女") {
            userData.gender = gender;
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);

            // 设置冷却
            setCooldown(e.user_id, 'mnrs', 'set');

            e.reply(`你的性别已设置为: ${gender}`);
        } else {
            e.reply("性别只能是 男 或 女。");
        }
    }

    async daily_gift(e) {
        // 检查冷却
        const remainingTime = checkCooldown(e.user_id, 'mnrs', 'daily');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        // 检查是否被封禁
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        
        // 检查反作弊系统是否启用
        const isAntiCheatEnabled = await redis.get('sims:anti_cheat_status') === 'enabled';
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            // 仅在反作弊系统启用时进行封禁
            if (isAntiCheatEnabled) {
                await this.banPlayer(userId, e);
                return;
            } else {
                // 反作弊系统关闭时，使用本地数据继续执行功能
                logger.info(`[反作弊系统] 反作弊系统已关闭，检测到数据不一致但继续执行功能 userId: ${userId}`);
                // 如果本地数据不存在，使用Redis数据
                if (!userData && redisUserData) {
                    userData = redisUserData;
                    // 同步数据到本地
                    await saveUserData(userId, userData);
                } 
                // 如果Redis数据不存在，使用本地数据
                else if (userData && !redisUserData) {
                    await redis.set(`user:${userId}`, JSON.stringify(userData));
                }
                // 如果两者都存在但不一致，优先使用本地数据
                else if (userData && redisUserData) {
                    await redis.set(`user:${userId}`, JSON.stringify(userData));
                }
                // 如果两者都不存在，无法继续
                else {
                    e.reply("未找到您的游戏数据，请使用 #开始模拟人生 创建角色");
                    return;
                }
            }
        }

        const today = new Date().toISOString().split("T")[0];
        if (userData.lastSignInDate === today) {
            e.reply("你今天已经签到过了！");
        } else {
            // 计算连续签到天数
            let consecutiveDays = 1;
            if (userData.lastSignInDate) {
                const lastDate = new Date(userData.lastSignInDate);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastDate.toISOString().split("T")[0] === yesterday.toISOString().split("T")[0]) {
                    consecutiveDays = (userData.consecutiveSignIn || 0) + 1;
                } else {
                    consecutiveDays = 1; // 重置连续签到
                }
            }
            userData.consecutiveSignIn = consecutiveDays;
            const baseReward = 100;
            const continuousBonus = Math.min(50 * consecutiveDays, 500); // 最多额外500元
            const randomBonus = Math.floor(Math.random() * 101) + 50;
            const totalMoneyReward = baseReward + continuousBonus + randomBonus;
            userData.money += totalMoneyReward;
            const staminaBonus = Math.floor(Math.random() * 21) + 10;
            userData.stamina = Math.min(100, userData.stamina + staminaBonus);
            const happinessBonus = Math.floor(Math.random() * 11) + 5;
            userData.happiness = Math.min(100, userData.happiness + happinessBonus);
            const hungerBonus = 10;
            const thirstBonus = 15;
            userData.hunger = Math.min(100, userData.hunger + hungerBonus);
            userData.thirst = Math.min(100, userData.thirst + thirstBonus);
            userData.lastSignInDate = today;
            userData.dailySignIn = true;
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            setCooldown(e.user_id, 'mnrs', 'daily');

            let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
            let un = userData.name;
            let cd = consecutiveDays;
            let tmr = totalMoneyReward;
            let br = baseReward;
            let cb = continuousBonus;
            let rb = randomBonus;
            let sb = staminaBonus;
            let hb = happinessBonus;
            let hgb = hungerBonus;
            let tb = thirstBonus;
            
            image(e, 'daily_gift', { 
                cssFile,
                un,
                cd,
                tmr,
                br,
                cb,
                rb,
                sb,
                hb,
                hgb,
                tb
            });
        }
    }

    async Show_status(e) {
        const remainingTime = checkCooldown(e.user_id, 'mnrs', 'status');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        // 检查是否被封禁
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        
        // 检查反作弊系统是否启用
        const isAntiCheatEnabled = await redis.get('sims:anti_cheat_status') === 'enabled';
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            // 仅在反作弊系统启用时进行封禁
            if (isAntiCheatEnabled) {
                await this.banPlayer(userId, e);
                return;
            } else {
                // 反作弊系统关闭时，使用本地数据继续执行功能
                logger.info(`[反作弊系统] 反作弊系统已关闭，检测到数据不一致但继续执行功能 userId: ${userId}`);
                // 如果本地数据不存在，使用Redis数据
                if (!userData && redisUserData) {
                    userData = redisUserData;
                    // 同步数据到本地
                    await saveUserData(userId, userData);
                } 
                // 如果Redis数据不存在，使用本地数据
                else if (userData && !redisUserData) {
                    await redis.set(`user:${userId}`, JSON.stringify(userData));
                }
                // 如果两者都存在但不一致，优先使用本地数据
                else if (userData && redisUserData) {
                    await redis.set(`user:${userId}`, JSON.stringify(userData));
                }
                // 如果两者都不存在，无法继续
                else {
                    e.reply("未找到您的游戏数据，请使用 #开始模拟人生 创建角色");
                    return;
                }
            }
        }
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        let un = userData.name
        let um = userData.money
        let uh = userData.happiness
        let ul = userData.life
        let uhg = userData.hunger
        let ut = userData.thirst
        let uc = userData.charm
        let umd = userData.mood
        let ug = userData.gender
        let ud = userData.disease || "无"
        let uj = userData.job || "无"
        let ulv = userData.level
        let ust = userData.stamina
        let up = userData.partnerAffection
        let urs = userData.relationshipStatus
        let ubl = userData.backpack.length
        let ublc = userData.backpackCapacity
        let ufh = userData.familyHappiness
        let uot = userData.overdueTasks
        let uw = userData.weather
        let utt = userData.temperature
        let ua = userData.avatar || "default.jpg"

        // 设置冷却
        setCooldown(e.user_id, 'mnrs', 'status');

        image(e, 'Show_status', { 
            cssFile,
            um,
            uh,
            ul,
            un,
            ut,
            uhg,
            uc,
            umd,
            ug,
            ud,
            uj,
            ulv,
            ust,
            up,
            urs,
            ubl,
            ublc,
            ufh,
            uot,
            uw,
            utt,
            ua
         })
      /*
        e.reply(`姓名: ${userData.name}\n
            金钱: ${userData.money}
            \n幸福度: ${userData.happiness}
            \n生命值: ${userData.life}
            \n饱食度: ${userData.hunger}
            \n口渴度: ${userData.thirst}
            \n魅力值: ${userData.charm}\n
            心情: ${userData.mood}
            \n职业: ${userData.job || "无"}\n
            状态: ${userData.status}
            \n等级: ${userData.level}
            \n体力: ${userData.stamina}
            \n恋爱状态: ${userData.relationshipStatus}
            \n疾病: ${userData.disease || "无"}
            \n背包容量: ${userData.backpack.length}/${userData.backpackCapacity}\n
            家庭幸福度: ${userData.familyHappiness}
            \n恋爱对象好感度: ${userData.partnerAffection}
            \n当前天气: ${userData.weather}
            \n当前温度: ${userData.temperature}°C
            \n超时任务数量: ${userData.overdueTasks}`);*/
    }

    async updatePlayerData() {
        const allUsers = await loadAllUsers();
        const weatherOptions = ["晴天", "阴天", "小雨", "大雨", "暴风雨"];
        const config = await readConfiguration();
        
        // 检查反作弊系统是否启用
        const isAntiCheatEnabled = await redis.get('sims:anti_cheat_status') === 'enabled';
        
        for (const userId in allUsers) {
            const userData = allUsers[userId];
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            
            // 如果用户被封禁，跳过更新
            if (banUntil && Date.now() < parseInt(banUntil)) continue;
            
            // 数据不一致检查
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                // 仅在反作弊系统启用时进行封禁
                if (isAntiCheatEnabled) {
                    await this.banPlayer(userId);
                    console.log(`数据不一致，用户 ${userId} 的账号已被封禁。`);
                    continue;
                } else {
                    // 反作弊系统关闭时，使用本地数据继续执行功能
                    logger.info(`[反作弊系统] 反作弊系统已关闭，检测到数据不一致但继续更新数据 userId: ${userId}`);
                    // 如果Redis数据不存在，使用本地数据
                    if (!redisUserData) {
                        await redis.set(`user:${userId}`, JSON.stringify(userData));
                    } 
                    // 如果两者都存在但不一致，优先使用本地数据
                    else {
                        await redis.set(`user:${userId}`, JSON.stringify(userData));
                    }
                }
                await this.banPlayer(userId);
                console.log(`数据不一致，用户 ${userId} 的账号已被封禁。`);
                continue;
            }
            
            if (userData.passwordData) {
                userData.passwordData.attempts = 0; // 每小时尝试次数归零
                userData.passwordData.progress = 0; // 每小时进度归零
            }
            userData.time = (userData.time + 1) % 24;
            userData.weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
            userData.temperature = Math.floor(Math.random() * (35 - 15 + 1)) + 15;
            userData.status = Math.random() > 0.9 ? "生病" : "健康";

            if (userData.property && userData.property.cleanliness > 0) {
                userData.property.cleanliness -= 1; // 每次更新清洁度下降
            }

            // 检测房子是否需要维修
            if (userData.property && Math.random() < 0.1) { // 10% 的几率损坏
                userData.property.isDamaged = true;
            }
            
            // 更新 Redis 存储的用户数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            // 更新本地文件存储的用户数据
            await saveUserData(userId, userData);
        }
    }

    async banPlayer(userId, e) {
        const userData = await checkUserData(userId);
        if (!userData) {return false;}

        // 检查反作弊系统是否启用
        const isAntiCheatEnabled = await redis.get('sims:anti_cheat_status') === 'enabled';
        if (!isAntiCheatEnabled) {
            logger.info(`[反作弊系统] 反作弊系统已关闭，不进行封禁 userId: ${userId}`);
            return false;
        }

        const banDays = Math.floor(Math.random() * (180 - 7 + 1)) + 7;
        const banUntil = Date.now() + banDays * 24 * 60 * 60 * 1000;
        const banData = { userId, banUntil };
        try {
            await saveBanData(banData);
            if (e) {
                e.reply(`用户${userId}因为游戏作弊已被封禁${banDays}天，封禁到${new Date(banUntil).toLocaleString()}，如属误封请联系机器人管理员或者等待自动解除。`);
            }
        } catch (error) {
            console.error("保存封禁信息时出错:", error);
            if (e) {
                e.reply("封禁用户时发生错误，请管理员手动封禁该用户。");
            }
        }
    }

    async View_avatars(e) {
        // 检查冷却
        const remainingTime = checkCooldown(e.user_id, 'mnrs', 'avatar');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        // 检查是否被封禁
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        
        // 检查反作弊系统是否启用
        const isAntiCheatEnabled = await redis.get('sims:anti_cheat_status') === 'enabled';
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            // 仅在反作弊系统启用时进行封禁
            if (isAntiCheatEnabled) {
                await this.banPlayer(userId, e);
                return;
            } else {
                // 反作弊系统关闭时，使用本地数据继续执行功能
                logger.info(`[反作弊系统] 反作弊系统已关闭，检测到数据不一致但继续执行功能 userId: ${userId}`);
                // 如果本地数据不存在，使用Redis数据
                if (!userData && redisUserData) {
                    userData = redisUserData;
                    // 同步数据到本地
                    await saveUserData(userId, userData);
                } 
                // 如果Redis数据不存在，使用本地数据
                else if (userData && !redisUserData) {
                    await redis.set(`user:${userId}`, JSON.stringify(userData));
                }
                // 如果两者都存在但不一致，优先使用本地数据
                else if (userData && redisUserData) {
                    await redis.set(`user:${userId}`, JSON.stringify(userData));
                }
                // 如果两者都不存在，无法继续
                else {
                    e.reply("未找到您的游戏数据，请使用 #开始模拟人生 创建角色");
                    return;
                }
            }
        }

        // 读取头像文件夹
        const avatarDir = `${_path}/plugins/sims-plugin/resources/HTML/tx`;
        let avatars = [];
        try {
            avatars = fs.readdirSync(avatarDir)
                .filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg') || file.endsWith('.gif'))
                .map(file => file);
        } catch (error) {
            console.error("读取头像文件夹出错:", error);
            e.reply("读取头像文件夹出错，请联系管理员检查路径。");
            return;
        }

        // 如果没有找到头像文件
        if (avatars.length === 0) {
            e.reply("未找到任何头像文件，请联系管理员添加头像。");
            return;
        }

        // 设置冷却
        setCooldown(e.user_id, 'mnrs', 'avatar');

        // 渲染头像馆图片
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        let currentAvatar = userData.avatar || "default.jpg";
        
        image(e, 'View_avatars', { 
            cssFile,
            avatars,
            currentAvatar
        });
    }

    // 添加辅助函数处理数据不一致
    async handleDataInconsistency(userId, userData, redisUserData, e) {
        // 检查反作弊系统是否启用
        const isAntiCheatEnabled = await redis.get('sims:anti_cheat_status') === 'enabled';
        
        // 仅在反作弊系统启用时进行封禁
        if (isAntiCheatEnabled) {
            await this.banPlayer(userId, e);
            return { shouldContinue: false, userData: null };
        } else {
            // 反作弊系统关闭时，使用本地数据继续执行功能
            logger.info(`[反作弊系统] 反作弊系统已关闭，检测到数据不一致但继续执行功能 userId: ${userId}`);
            
            let finalUserData = null;
            
            // 如果本地数据不存在，使用Redis数据
            if (!userData && redisUserData) {
                finalUserData = redisUserData;
                // 同步数据到本地
                await saveUserData(userId, finalUserData);
            } 
            // 如果Redis数据不存在，使用本地数据
            else if (userData && !redisUserData) {
                finalUserData = userData;
                await redis.set(`user:${userId}`, JSON.stringify(finalUserData));
            }
            // 如果两者都存在但不一致，优先使用本地数据
            else if (userData && redisUserData) {
                finalUserData = userData;
                await redis.set(`user:${userId}`, JSON.stringify(finalUserData));
            }
            // 如果两者都不存在，无法继续
            else {
                if (e) {
                    e.reply("未找到您的游戏数据，请使用 #开始模拟人生 创建角色");
                }
                return { shouldContinue: false, userData: null };
            }
            
            return { shouldContinue: true, userData: finalUserData };
        }
    }

    async Set_avatar(e) {
        // 检查冷却
        const remainingTime = checkCooldown(e.user_id, 'mnrs', 'avatar');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        // 检查是否被封禁
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
        }

        // 获取用户选择的头像
                const input = e.msg.replace(/^#设置模拟人生头像\s*/, '').trim();
                if (!input) {
                    e.reply("请指定头像编号或名称，例如：#设置模拟人生头像 1 或 #设置模拟人生头像 default");
                    return;
                }
        
                // 允许输入纯数字编号、default 或完整文件名，如果未带扩展名默认按jpg
                let avatarFile = input;
                if (/^\d+$/.test(input)) {
                    avatarFile = `${input}.jpg`;
                } else if (/^[A-Za-z]+$/.test(input) && input.toLowerCase() === 'default') {
                    avatarFile = 'default.jpg';
                } else if (!/\.(jpg|jpeg|png|webp)$/i.test(input)) {
                    avatarFile = `${input}.jpg`;
                }
        
                // 检查头像文件是否存在
                const avatarPath = `${_path}/plugins/sims-plugin/resources/HTML/tx/${avatarFile}`;
                if (!fs.existsSync(avatarPath)) {
                    e.reply(`头像 ${input} 不存在，请使用 #模拟人生查看头像馆 查看可用的头像。`);
                    return;
                }
        
                // 更新用户头像
                userData.avatar = avatarFile;
         await redis.set(`user:${userId}`, JSON.stringify(userData));
         await saveUserData(userId, userData);

         // 设置冷却
         setCooldown(e.user_id, 'mnrs', 'avatar');


        e.reply(`你的头像已更新为：${avatarFile}`);
     }

    async Change_signature(e) {
        // 检查冷却
        const remainingTime = checkCooldown(e.user_id, 'mnrs', 'set');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        // 检查是否被封禁
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
        }

        const newSignature = e.msg.replace('#模拟人生修改签名', '').trim();
        if (!newSignature) {
            e.reply("请输入要设置的签名，例如：#模拟人生修改签名 我是一名快乐的玩家");
            return;
        }

        if (newSignature.length > 30) {
            e.reply("签名长度不能超过30个字符");
            return;
        }

        // 检查敏感词
        const containsSensitiveWord = sensitiveWords.some(word => newSignature.includes(word));
        if (containsSensitiveWord) {
            e.reply("签名包含敏感词，请修改后重试");
            return;
        }

        // 检查是否是首次修改签名
        const isFirstChange = userData.signature === "我是一名玩家";
        if (!isFirstChange && userData.money < 300) {
            e.reply("你的金钱不足，修改签名需要300元");
            return;
        }

        // 扣除金钱（非首次修改）
        if (!isFirstChange) {
            userData.money -= 300;
        }

        // 更新签名
        userData.signature = newSignature;
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        // 设置冷却
        setCooldown(e.user_id, 'mnrs', 'set');

        if (isFirstChange) {
            e.reply(`你的签名已更新为：${newSignature}`);
        } else {
            e.reply(`你的签名已更新为：${newSignature}，扣除300元`);
        }
    }

    async View_stamina_potions(e) {
        // 检查冷却
        const remainingTime = checkCooldown(e.user_id, 'mnrs', 'view');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        // 检查是否被封禁
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
        }

        // 设置冷却
        setCooldown(e.user_id, 'mnrs', 'view');

        let message = "【体力药水商店】\n";
        message += "------------------------\n";
        
        staminaPotions.forEach(potion => {
            message += `${potion.name}：${potion.price}元，恢复${potion.recovery}点体力\n`;
        });
        
        message += "------------------------\n";
        message += "使用指令：#购买体力药水 [药水名称]\n";
        message += "例如：#购买体力药水 小型体力药水";
        
        e.reply(message);
    }

    async Buy_stamina_potion(e) {
        // 检查冷却
        const remainingTime = checkCooldown(e.user_id, 'mnrs', 'buy');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        // 检查是否被封禁
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
        }

        const potionName = e.msg.replace('#购买体力药水', '').trim();
        
        if (!potionName) {
            e.reply("请指定要购买的体力药水名称，例如：#购买体力药水 小型体力药水");
            return;
        }
        const potion = staminaPotions.find(p => p.name === potionName);
        if (!potion) {
            e.reply("未找到该药水，请使用#查看体力药水命令查看可用的药水列表");
            return;
        }
        if (userData.money < potion.price) {
            e.reply(`你的金钱不足，购买${potion.name}需要${potion.price}元`);
            return;
        }
        if (userData.backpack.length >= userData.backpackCapacity) {
            e.reply("你的背包已满，无法购买更多物品");
            return;
        }
        userData.money -= potion.price;
        userData.backpack.push({
            type: "stamina_potion",
            id: potion.id,
            name: potion.name,
            recovery: potion.recovery
        });
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'mnrs', 'buy');

        e.reply(`你成功购买了${potion.name}，花费${potion.price}元。剩余金钱：${userData.money}元`);
    }

    async Use_stamina_potion(e) {
        const remainingTime = checkCooldown(e.user_id, 'mnrs', 'use');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        // 检查是否被封禁
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
        }

        const potionName = e.msg.replace('#食用体力药水', '').trim();
        
        if (!potionName) {
            e.reply("请指定要使用的体力药水名称，例如：#食用体力药水 小型体力药水");
            return;
        }

        // 检查背包中是否有该药水
        const potionIndex = userData.backpack.findIndex(item => 
            item.type === "stamina_potion" && item.name === potionName);

        if (potionIndex === -1) {
            e.reply(`你的背包中没有${potionName}`);
            return;
        }

        const potion = userData.backpack[potionIndex];
        const oldStamina = userData.stamina;
        userData.stamina = Math.min(100, userData.stamina + potion.recovery);
        const actualRecovery = userData.stamina - oldStamina;
        userData.backpack.splice(potionIndex, 1);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'mnrs', 'use');

        e.reply(`你使用了${potion.name}，恢复了${actualRecovery}点体力。当前体力：${userData.stamina}/100`);
    }
}

async function image(e, flie, obj) {
    let data = {
      quality: 100,
      tplFile: `./plugins/sims-plugin/resources/HTML/${flie}.html`,
      ...obj,
    }
    let img = await puppeteer.screenshot('sims-plugin', {
      ...data,
    })
   
    e.reply([img])
  }
