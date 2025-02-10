import fs from 'fs'; import path from 'path'; import Yaml from 'yaml'; import Redis from 'ioredis';

const redis = new Redis();
export const PLUGIN_PATH = path.join(path.resolve(), 'plugins', 'sims-plugin');
const WEAPON_STORE_FILE_PATH = path.join(PLUGIN_PATH,'data', 'weapon_store.json');
const TEMP_STORE_FILE_PATH = path.join(PLUGIN_PATH, 'temp_store.json');
const ACHIEVEMENTS_FILE_PATH = path.join(PLUGIN_PATH, 'achievements.json');
const DISEASES_FILE_PATH = path.join(PLUGIN_PATH, 'diseases.json');
const NEWS_FILE_PATH = path.join(PLUGIN_PATH, 'news.json');
const WEATHER_FILE_PATH = path.join(PLUGIN_PATH, 'weather.json');
const BLACKLIST_FILE_PATH = path.join(PLUGIN_PATH, 'heiming.json');
const BAN_LIST_FILE_PATH = path.join(PLUGIN_PATH, 'data', 'ban_list.json');
const FILE_PATH = {
    config: path.join(PLUGIN_PATH, 'config','config.yaml'),
    player: path.join(PLUGIN_PATH, 'data','game')
};
if (!fs.existsSync(FILE_PATH.player)) {
    fs.mkdirSync(FILE_PATH.player, { recursive: true });
}
/** 读取玩家数据 */
export async function saveUserData(userId, userData) {
    const userFilePath = path.join(FILE_PATH['player'], `${userId}.json`);
    fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 4));
}
//**检查用户数据是否存在 */
export async function checkUserData(userId) {
    const userFilePath = path.join(FILE_PATH['player'], `${userId}.json`);
    if (!fs.existsSync(userFilePath)) {
        return false; // 返回 false 表示用户数据不存在
    }
    return JSON.parse(fs.readFileSync(userFilePath, 'utf8')); // 返回用户数据
}
//** 随机生成武器*/
export function generateWeapons() {
    const weaponTypes = ["近程", "中程", "远程", "无人", "投掷", "复古"];
    const weaponQualities = ["白色", "蓝色", "紫色", "金色", "幻彩"];
    const weapons = [];

    for (let i = 0; i < 25; i++) {
        const weapon = {
            id: i + 1,
            name: `武器${i + 1}`,
            type: weaponTypes[Math.floor(Math.random() * weaponTypes.length)],
            attributes: {
                lifeBonus: Math.floor(Math.random() * 50), // 生命值加成
                hitRate: Math.random(), // 命中率
                penetration: Math.floor(Math.random() * 20), // 穿透力
                attack: Math.floor(Math.random() * 30) + 10, // 攻击力
                critRate: Math.random(), // 暴击率
                explosionDamage: Math.floor(Math.random() * 100) // 爆伤
            },
            price: Math.floor(Math.random() * (60000 - 50 + 1)) + 50, // 随机售价
            description: `这是一把${weaponTypes[Math.floor(Math.random() * weaponTypes.length)]}武器，适合各种战斗场合。`,
            power: Math.floor(Math.random() * 100), // 武器威力
            acquisitionMethod: "通过商店购买或任务获得", // 获取方式
            level: 1, // 初始等级
            quality: weaponQualities[Math.floor(Math.random() * weaponQualities.length)] // 随机品质
        };

        // 根据品质调整属性和价格
        switch (weapon.quality) {
            case "白色":
                weapon.price = Math.floor(Math.random() * (1000 - 50 + 1)) + 50;
                break;
            case "蓝色":
                weapon.price = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
                break;
            case "紫色":
                weapon.price = Math.floor(Math.random() * (60000 - 1000 + 1)) + 1000;
                break;
            case "金色":
                weapon.price = Math.floor(Math.random() * (60000 - 1000 + 1)) + 1000;
                break;
            case "幻彩":
                weapon.price = "需抽卡获取"; // 幻彩武器特殊处理
                break;
        }

        weapons.push(weapon);
    }

    // 将武器写入文件
    fs.writeFileSync(WEAPON_STORE_FILE_PATH, JSON.stringify(weapons, null, 2));
}
/** 读取群列表 */
export function getGroupList() {
    return fs.readdirSync(FILE_PATH['player'])
}
//**加载所有玩家数据 */
export async function loadAllUsers() {
    const files = fs.readdirSync(FILE_PATH['player']);
    const allUsers = {};
    for (const file of files) {
        const userId = path.basename(file, '.json');
        const userData = JSON.parse(fs.readFileSync(path.join(FILE_PATH['player'], file), 'utf8'));
        allUsers[userId] = userData;
    }
    return allUsers;
}

export async function handleJobTasks(user) {
    if (user.tasks.length > 0) {
        const task = user.tasks[0];
        task.timeRemaining -= 1; // 每次调用减少任务剩余时间

        if (task.timeRemaining <= 0) {
            user.tasks.shift(); // 移除已完成的任务
            user.events.push(`任务"${task.name}"已完成，获得奖励！`);
            const salary = Math.floor(Math.random() * (110000 - 800 + 1)) + 800; // 随机工资
            user.money += salary;
            user.events.push(`你完成了任务，获得了${salary}元工资！`);
        }
    }

    // 检查超时任务
    if (user.overdueTasks > 0) {
        const penalty = Math.floor(Math.random() * (user.money * 0.5)); // 随机扣工资
        user.money -= penalty;
        user.events.push(`你有超时任务，扣除工资${penalty}元。`);
        user.overdueTasks += 1; // 超时任务数量增加
    }
}
/**
 处理温度影响
 */
export async function applyTemperatureEffects(user) {
    const tempEffect = Math.floor(Math.random() * 10) - 5; // 温度波动范围
    user.temperature += tempEffect;

    if (user.temperature < 15) {
        user.happiness -= 10; // 温度过低影响幸福度
        user.events.push("温度过低，幸福度减少了10！");
        if (Math.random() < 0.2) { // 20% 概率感染疾病
            user.disease = "感冒";
            user.diseaseSymptoms = "咳嗽、流鼻涕";
            user.events.push("你感染了感冒，症状为: " + user.diseaseSymptoms);
        }
    } else if (user.temperature > 30) {
        user.happiness -= 5; // 温度过高影响幸福度
        user.events.push("温度过高，幸福度减少了5！");
    }
}
/**随机生成服饰属性 */
export function generateClothingAttributes() {
    const mainAttribute = {
        life: Math.floor(Math.random() * 100) + 50, // 生命值
        lifePercentage: Math.random(), // 生命值百分比
        attack: Math.floor(Math.random() * 20) + 5, // 攻击力
        critRate: Math.random() // 暴击率
    };

    const subAttribute = {
        life: Math.floor(Math.random() * 100) + 50,
        lifePercentage: Math.random(),
        attack: Math.floor(Math.random() * 20) + 5,
        critRate: Math.random()
    };

    return { mainAttribute, subAttribute };
}
// NPC 互动
export async function npcInteraction(user) {
    const npcEvents = [
        "你遇到了一个 NPC，他给了你一个任务。",
        "你遇到了一个 NPC，他邀请你一起逛街。",
        "你遇到了一个 NPC，他告诉你最近的天气。",
        "你遇到了一个 NPC，他询问你的工作情况。"
    ];

    if (Math.random() < 0.5) { // 50% 概率遇到 NPC
        const npcEvent = npcEvents[Math.floor(Math.random() * npcEvents.length)];
        user.events.push(npcEvent);
    }
}

// 逛街系统
export async function shopping(user) {
    const shoppingAreas = ["汽车4S店", "面包店", "医院", "武器商店", "美食店", "警察局", "公司", "学校"];
    const area = shoppingAreas[Math.floor(Math.random() * shoppingAreas.length)];
    user.events.push(`你在${area}逛街，发现了一些有趣的东西。`);
}
// 加载成就数据
export async function loadAchievements() {
    if (!fs.existsSync(ACHIEVEMENTS_FILE_PATH)) {
        return {};
    }
    const data = fs.readFileSync(ACHIEVEMENTS_FILE_PATH);
    return JSON.parse(data);
}
// 检查成就
export async function checkAchievements(user, taskName) {
    const achievements = await loadAchievements();
    if (achievements[taskName]) {
        user.achievements.push(taskName);
        user.events.push(`你达成了成就: ${taskName}，获得奖励！`);
        user.money += achievements[taskName].reward; // 获得奖励
        await saveUserData(userId, user);
    }
}
// 处理补偿
export async function compensateUser(userId, itemName, amount) {
    const allUsers = await loadAllUsers();
    if (QQ_NUMBER === userId) { // 仅允许机器人主人补偿
        const user = allUsers[userId];
        user.money += amount;
        user.events.push(`你获得了补偿${amount}元。`);
        await saveUserData(userId, user);
    }
}

// 锁定背包物品
export async function lockItem(user, itemName) {
    if (!user.lockedItems.includes(itemName)) {
        user.lockedItems.push(itemName);
        await saveUserData(userId, user);
    }
}

// 解锁背包物品
export async function unlockItem(user, itemName) {
    user.lockedItems = user.lockedItems.filter(item => item !== itemName);
    await saveUserData(userId, user);
}

// 一键出售背包物品
 export async function sellBackpackItems(user) {
    const sellableItems = user.backpack.filter(item => !user.lockedItems.includes(item));
    const totalSaleValue = sellableItems.length * 50; // 假设每个物品出售50元
    user.money += totalSaleValue;
    user.backpack = user.backpack.filter(item => user.lockedItems.includes(item)); // 只保留锁定的物品
    user.events.push(`你出售了背包中的物品，获得了${totalSaleValue}元。`);
    await saveUserData(userId, user);
}

// 检查存档
export async function checkSaveFile(userId) {
    const allUsers = await loadAllUsers();
    return allUsers[userId] ? true : false;
}

// 秘境副本
export async function enterSecretRealm(user) {
    // 副本逻辑
    user.events.push("你进入了秘境副本，准备冒险！");
    await saveUserData(userId, user);
}

// 材料合成
export async function combineMaterials(user, materials) {
    // 合成逻辑
    user.events.push(`你合成了材料: ${materials.join(", ")}！`);
    await saveUserData(userId, user);
}

// 搜索世界材料
 export async function searchMaterials(user) {
    // 搜索逻辑
    user.events.push("你在世界中搜索到了材料！");
    await saveUserData(userId, user);
}

// 银行存款功能
export async function bankDeposit(user, amount) {
    if (user.bank.balance + amount <= user.bank.savingsLimit) {
        user.bank.balance += amount;
        user.events.push(`你存入了${amount}元到银行。`);
        await saveUserData(userId, user);
    } else {
        user.events.push("存款超过银行存储上限！");
    }
}

// 银行取款功能
export async function bankWithdraw(user, amount) {
    if (user.bank.balance >= amount) {
        user.bank.balance -= amount;
        user.events.push(`你从银行取出了${amount}元。`);
        await saveUserData(userId, user);
    } else {
        user.events.push("银行余额不足，无法取款！");
    }
}

// 模拟炒股系统
export async function simulateStockMarket(user) {
    // 股票市场逻辑
    user.events.push("股票市场发生了变化！");
    await saveUserData(userId, user);
}

// 低保系统
export async function checkBasicLivingAllowance(user) {
    if (user.money < 300 && !user.job) {
        user.money += 150; // 低保金额
        user.events.push("你领取了低保150元。");
        await saveUserData(userId, user);
    }
}
/** 读取配置 */
export async function readConfiguration() {
    const DATA = Yaml.parse(fs.readFileSync(FILE_PATH['config'], 'utf-8'))
    return DATA
}
/** 存储配置数据 */
export function storageConfigrData(DATA) {
    fs.writeFileSync(FILE_PATH['config'], Yaml.stringify(DATA), 'utf8')
}

export async function saveBanData(banData) {
        const banList = await loadBanList();
        banList[banData.userId] = banData.banUntil; 
        await saveBanList(banList); 
        await redis.set(`ban:${banData.userId}`, banData.banUntil); 
    }
    export async function loadBanList() {
        if (fs.existsSync(BAN_LIST_FILE_PATH)) {
            const data = fs.readFileSync(BAN_LIST_FILE_PATH, 'utf-8');
            return JSON.parse(data); // 解析为对象
        }
        return {}; // 如果文件不存在，返回空对象
    }
    export async function saveBanList(banList) {
        fs.writeFileSync(BAN_LIST_FILE_PATH, JSON.stringify(banList)); // 写入文件
    }

    export  function scheduleUnban(userId, banUntil) {
        const timeout = banUntil - Date.now();
        setTimeout(() => {
            UnbanUser(userId); 
        }, timeout);
    }
