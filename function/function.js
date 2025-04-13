import fs from 'fs'; import path from 'path'; import Yaml from 'yaml'; import Redis from 'ioredis';

const redis = new Redis();
export const PLUGIN_PATH = path.join(path.resolve(), 'plugins', 'sims-plugin');
const BAN_LIST_FILE_PATH = path.join(PLUGIN_PATH, 'data', 'ban_list.json');
const FILE_PATH = {
    config: path.join(PLUGIN_PATH, 'config','config.yaml'),
    player: path.join(PLUGIN_PATH, 'data','game'),
    story: path.join(PLUGIN_PATH, 'resources','stories')
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

// 检查存档
export async function checkSaveFile(userId) {
    const allUsers = await loadAllUsers();
    return allUsers[userId] ? true : false;
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
    //剧情读取
export async function loadStoryData(storyId) {
    const storyPath = path.join(FILE_PATH['story'], `${storyId}.json`);
    if (fs.existsSync(storyPath)) {
        const storyData = JSON.parse(fs.readFileSync(storyPath, 'utf-8'));
        return storyData;
    } else {
        throw new Error(`剧情文件 ${storyId}.json 不存在`);
    }
}
export async function saveAchievement(userId, achievement) {
    const key = `achievements:${userId}`;
    let achievements = JSON.parse(await redis.get(key)) || [];
    
    if (!achievements.some(a => a.id === achievement.id)) {
        achievements.push({
            ...achievement,
            timestamp: Date.now()
        });
        await redis.set(key, JSON.stringify(achievements));
    }
}