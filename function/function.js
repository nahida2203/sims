import fs from 'fs'; import path from 'path'; import Yaml from 'yaml'; import Redis from 'ioredis';

const redis = new Redis();
export const PLUGIN_PATH = path.join(path.resolve(), 'plugins', 'sims-plugin');
export const CHEF_DATA_FOLDER = './plugins/sims-plugin/data/chefData/'
const BAN_LIST_FILE_PATH = path.join(PLUGIN_PATH, 'data', 'ban_list.json');
export const CHEF_COOP_PATH = './plugins/sims-plugin/data/chef_coop.json'
export const CHEF_CONTEST_PATH = './plugins/sims-plugin/data/chef_contest.json'
export const CHEF_MARKET_PATH = './plugins/sims-plugin/data/chef_market.json'
// 存储反作弊系统状态的Redis键
const ANTI_CHEAT_STATUS_KEY = 'sims:anti_cheat_status';

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

// 检查反作弊系统是否启用
export async function isAntiCheatEnabled() {
    const status = await redis.get(ANTI_CHEAT_STATUS_KEY);
    return status === 'enabled';
}

export async function saveBanData(banData) {
    // 检查反作弊系统是否启用
    const antiCheatEnabled = await isAntiCheatEnabled();
    if (!antiCheatEnabled) {
        logger.info(`[反作弊系统] 反作弊系统已关闭，不保存封禁数据 userId: ${banData.userId}`);
        return false;
    }
    
    const banList = await loadBanList();
    banList[banData.userId] = banData.banUntil; 
    await saveBanList(banList); 
    await redis.set(`ban:${banData.userId}`, banData.banUntil);
    return true;
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
export function getUserDataPath(userId) {
    return `${CHEF_DATA_FOLDER}${userId}.json`
}

export function getChefData(userId) {
    const userDataPath = getUserDataPath(userId)
    if (!fs.existsSync(userDataPath)) {
        return null
    }
    return JSON.parse(fs.readFileSync(userDataPath, 'utf8'))
}

export function saveChefData(userId, userData) {
    const userDataPath = getUserDataPath(userId)
    fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2))
}

// 背包操作函数
export function addIngredientToBackpack(userData, ingredientId, ingredientName, amount) {
    // 查找背包中是否已有该食材
    const existingIndex = userData.backpack.findIndex(item => 
        item.type === "ingredient" && item.id === ingredientId)
    
    if (existingIndex !== -1) {
        // 如果已有该食材，增加数量
        userData.backpack[existingIndex].amount += amount
    } else {
        // 如果没有该食材，添加新条目
        userData.backpack.push({
            type: "ingredient",
            id: ingredientId,
            name: ingredientName,
            amount: amount
        })
    }
    return userData
}

export function getIngredientFromBackpack(userData, ingredientName) {
    const ingredient = userData.backpack.find(item => 
        item.type === "ingredient" && item.name === ingredientName)
    return ingredient ? ingredient.amount : 0
}

export function useIngredientsFromBackpack(userData, ingredients) {
    for (let ingredient of ingredients) {
        const userAmount = getIngredientFromBackpack(userData, ingredient.name)
        if (userAmount < ingredient.amount) {
            return { success: false, message: `没有足够的${ingredient.name}` }
        }
    }
    
    // 使用食材
    for (let ingredient of ingredients) {
        const index = userData.backpack.findIndex(item => 
            item.type === "ingredient" && item.name === ingredient.name)
        if (index !== -1) {
            userData.backpack[index].amount -= ingredient.amount
            // 如果数量为0，从背包中移除
            if (userData.backpack[index].amount <= 0) {
                userData.backpack.splice(index, 1)
            }
        }
    }
    return { success: true, message: "成功使用食材" }
}

export function addDishToBackpack(userData, dish) {
    userData.backpack.push({
        type: "dish",
        id: dish.id,
        recipeId: dish.recipeId,
        name: dish.name,
        quality: dish.quality,
        madeTime: dish.madeTime,
        nutrition: dish.nutrition,
        basePrice: dish.basePrice
    })
    return userData
}

// 厨具相关函数
export function addKitchenwareToBackpack(userData, kitchenware) {
    userData.backpack.push({
        type: "kitchenware",
        id: kitchenware.id,
        name: kitchenware.name,
        category: kitchenware.category,
        effects: kitchenware.effects,
        description: kitchenware.description,
        acquired_at: new Date().toLocaleString('zh-CN', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})
    })
    return userData
}

export function getKitchenwareFromBackpack(userData) {
    return userData.backpack.filter(item => item.type === "kitchenware")
}

export function getBestKitchenware(userData, category) {
    const kitchenwareItems = getKitchenwareFromBackpack(userData)
    let bestItem = null
    
    // 按类别筛选厨具
    const categoryItems = kitchenwareItems.filter(item => item.category === category)
    
    // 按成功率加成排序，找到最好的一个
    if (categoryItems.length > 0) {
        categoryItems.sort((a, b) => b.effects.successRate - a.effects.successRate)
        bestItem = categoryItems[0]
    }
    
    return bestItem
}

// 计算厨具带来的总加成效果
export function calculateKitchenwareBonus(userData, recipe) {
    let bonusEffects = {
        successRate: 0,
        timeReduction: 0,
        qualityBonus: 0
    }
    
    // 获取各类厨具
    const categories = ["刀具", "锅具", "烘焙工具", "小工具"]
    
    for (const category of categories) {
        const bestKitchenware = getBestKitchenware(userData, category)
        if (bestKitchenware) {
            bonusEffects.successRate += bestKitchenware.effects.successRate || 0
            bonusEffects.timeReduction += bestKitchenware.effects.timeReduction || 0
            bonusEffects.qualityBonus += bestKitchenware.effects.qualityBonus || 0
            
            // 特殊厨具对特定料理的加成
            if (recipe.category === "蒸菜" && bestKitchenware.effects.steamBonus) {
                bonusEffects.successRate += bestKitchenware.effects.steamBonus
                bonusEffects.qualityBonus += Math.floor(bestKitchenware.effects.steamBonus / 2)
            }
            
            if (recipe.category === "甜点" && category === "烘焙工具" && bestKitchenware.effects.bakeBonus) {
                bonusEffects.successRate += bestKitchenware.effects.bakeBonus
                bonusEffects.qualityBonus += Math.floor(bestKitchenware.effects.bakeBonus / 2)
            }
        }
    }
    
    return bonusEffects
}

// 多人联机相关辅助函数
export function getCoopData() {
    if (!fs.existsSync(CHEF_COOP_PATH)) {
        return { teams: [], coop_dishes: [] }
    }
    return JSON.parse(fs.readFileSync(CHEF_COOP_PATH, 'utf8'))
}

export function saveCoopData(data) {
    fs.writeFileSync(CHEF_COOP_PATH, JSON.stringify(data, null, 2))
}

export function getContestData() {
    if (!fs.existsSync(CHEF_CONTEST_PATH)) {
        return { active_contests: [], history: [], rankings: [] }
    }
    return JSON.parse(fs.readFileSync(CHEF_CONTEST_PATH, 'utf8'))
}

export function saveContestData(data) {
    fs.writeFileSync(CHEF_CONTEST_PATH, JSON.stringify(data, null, 2))
}

export function getMarketData() {
    if (!fs.existsSync(CHEF_MARKET_PATH)) {
        return { listings: [], transactions: [] }
    }
    return JSON.parse(fs.readFileSync(CHEF_MARKET_PATH, 'utf8'))
}

export function saveMarketData(data) {
    fs.writeFileSync(CHEF_MARKET_PATH, JSON.stringify(data, null, 2))
}

// 创建一个厨师团队
export function createTeam(teamName, creatorId, members = []) {
    const coopData = getCoopData()
    
    // 检查团队名称是否已存在
    if (coopData.teams.some(team => team.name === teamName)) {
        return { success: false, message: "团队名称已存在" }
    }
    
    // 创建新团队
    const newTeam = {
        id: `team_${Date.now()}`,
        name: teamName,
        creator: creatorId,
        members: [creatorId, ...members],
        created_at: Date.now(),
        dishes: [],
        reputation: 0,
        level: 1,
        exp: 0
    }
    
    coopData.teams.push(newTeam)
    saveCoopData(coopData)
    
    return { success: true, team: newTeam }
}

// 获取用户所在的团队
export function getUserTeam(userId) {
    const coopData = getCoopData()
    return coopData.teams.find(team => team.members.includes(userId))
}

// 创建一个料理比赛
export function createContest(name, description, recipeId, creatorId, deadline) {
    const contestData = getContestData()
    
    const contest = {
        id: `contest_${Date.now()}`,
        name,
        description,
        recipe_id: recipeId,
        creator_id: creatorId,
        created_at: Date.now(),
        deadline: deadline || (Date.now() + 24 * 60 * 60 * 1000), // 默认24小时后截止
        participants: [],
        status: "active",
        winners: []
    }
    
    contestData.active_contests.push(contest)
    saveContestData(contestData)
    
    return contest
}

// 向料理比赛提交作品
export function submitContestDish(contestId, userId, dishId, dishQuality) {
    const contestData = getContestData()
    const contestIndex = contestData.active_contests.findIndex(c => c.id === contestId)
    
    if (contestIndex === -1) {
        return { success: false, message: "比赛不存在" }
    }
    
    const contest = contestData.active_contests[contestIndex]
    
    if (contest.status !== "active") {
        return { success: false, message: "比赛已结束" }
    }
    
    if (contest.deadline < Date.now()) {
        // 更新比赛状态为已结束
        contest.status = "ended"
        // 确定获胜者
        if (contest.participants.length > 0) {
            contest.participants.sort((a, b) => b.quality - a.quality)
            contest.winners = contest.participants.slice(0, 3).map(p => p.user_id)
        }
        
        return { success: false, message: "比赛已截止" }
    }
    
    // 检查用户是否已提交
    const existingEntry = contest.participants.findIndex(p => p.user_id === userId)
    if (existingEntry !== -1) {
        // 更新已有参赛作品
        contest.participants[existingEntry] = {
            user_id: userId,
            dish_id: dishId,
            quality: dishQuality,
            submit_time: Date.now()
        }
    } else {
        // 添加新参赛作品
        contest.participants.push({
            user_id: userId,
            dish_id: dishId,
            quality: dishQuality,
            submit_time: Date.now()
        })
    }
    
    saveContestData(contestData)
    
    return { success: true, message: "提交成功" }
}

// 完成比赛并确定获胜者
export function finishContest(contestId) {
    const contestData = getContestData()
    const contestIndex = contestData.active_contests.findIndex(c => c.id === contestId)
    
    if (contestIndex === -1) {
        return { success: false, message: "比赛不存在" }
    }
    
    const contest = contestData.active_contests[contestIndex]
    
    // 更新比赛状态为已结束
    contest.status = "ended"
    
    // 确定获胜者
    if (contest.participants.length > 0) {
        contest.participants.sort((a, b) => b.quality - a.quality)
        contest.winners = contest.participants.slice(0, Math.min(3, contest.participants.length)).map(p => p.user_id)
    }
    
    // 移到历史记录
    contestData.history.push(contest)
    contestData.active_contests.splice(contestIndex, 1)
    
    // 更新排行榜
    updateContestRankings(contestData, contest)
    
    saveContestData(contestData)
    
    return { success: true, contest }
}

// 更新比赛排行榜
export function updateContestRankings(contestData, contest) {
    contest.participants.forEach((participant, index) => {
        // 计算得分
        let points = 0
        if (index === 0) points = 5 // 第一名
        else if (index === 1) points = 3 // 第二名
        else if (index === 2) points = 2 // 第三名
        else points = 1 // 参与奖
        
        // 更新用户在排行榜中的记录
        const userRanking = contestData.rankings.find(r => r.user_id === participant.user_id)
        if (userRanking) {
            userRanking.points += points
            userRanking.contests_joined += 1
            if (index < 3) userRanking.wins += 1
        } else {
            contestData.rankings.push({
                user_id: participant.user_id,
                points: points,
                contests_joined: 1,
                wins: index < 3 ? 1 : 0
            })
        }
    })
    
    // 重新排序排行榜
    contestData.rankings.sort((a, b) => b.points - a.points)
}

// 创建食材市场挂单
export function createMarketListing(sellerId, ingredientId, ingredientName, quantity, pricePerUnit) {
    const marketData = getMarketData()
    
    const listing = {
        id: `listing_${Date.now()}`,
        seller_id: sellerId,
        ingredient_id: ingredientId,
        ingredient_name: ingredientName,
        quantity: quantity,
        price_per_unit: pricePerUnit,
        created_at: Date.now(),
        status: "active"
    }
    
    marketData.listings.push(listing)
    saveMarketData(marketData)
    
    return listing
}

// 购买市场上的食材
export function buyMarketIngredient(listingId, buyerId, quantity) {
    const marketData = getMarketData()
    const listingIndex = marketData.listings.findIndex(l => l.id === listingId && l.status === "active")
    
    if (listingIndex === -1) {
        return { success: false, message: "挂单不存在或已下架" }
    }
    
    const listing = marketData.listings[listingIndex]
    
    if (listing.seller_id === buyerId) {
        return { success: false, message: "不能购买自己的挂单" }
    }
    
    if (quantity > listing.quantity) {
        return { success: false, message: "购买数量超过可用数量" }
    }
    
    // 计算总价
    const totalPrice = quantity * listing.price_per_unit
    
    // 创建交易记录
    const transaction = {
        id: `transaction_${Date.now()}`,
        listing_id: listingId,
        seller_id: listing.seller_id,
        buyer_id: buyerId,
        ingredient_id: listing.ingredient_id,
        ingredient_name: listing.ingredient_name,
        quantity: quantity,
        price_per_unit: listing.price_per_unit,
        total_price: totalPrice,
        created_at: Date.now()
    }
    
    marketData.transactions.push(transaction)
    
    // 更新挂单数量
    if (quantity === listing.quantity) {
        // 如果全部购买，标记挂单为已完成
        listing.status = "completed"
    } else {
        // 如果部分购买，减少数量
        listing.quantity -= quantity
    }
    
    saveMarketData(marketData)
    
    return { 
        success: true, 
        transaction,
        remaining: listing.quantity,
        status: listing.status
    }
}

// 发起合作料理
export function createCoopDish(initiatorId, recipeId, recipeName, participantIds) {
    const coopData = getCoopData()
    
    const coopDish = {
        id: `coop_${Date.now()}`,
        initiator_id: initiatorId,
        recipe_id: recipeId,
        recipe_name: recipeName,
        participants: [
            {
                user_id: initiatorId,
                status: "joined",
                contributed: false
            },
            ...participantIds.map(id => ({
                user_id: id,
                status: "invited",
                contributed: false
            }))
        ],
        ingredients_contributed: [],
        status: "preparing",
        created_at: Date.now(),
        quality_bonus: 0,
        completed_at: null,
        result_dish: null
    }
    
    coopData.coop_dishes.push(coopDish)
    saveCoopData(coopData)
    
    return coopDish
}

// 向合作料理贡献食材
export function contributeToCoopDish(coopDishId, userId, ingredients) {
    const coopData = getCoopData()
    const coopDishIndex = coopData.coop_dishes.findIndex(d => d.id === coopDishId)
    
    if (coopDishIndex === -1) {
        return { success: false, message: "合作料理不存在" }
    }
    
    const coopDish = coopData.coop_dishes[coopDishIndex]
    
    if (coopDish.status !== "preparing") {
        return { success: false, message: "该合作料理已不在准备阶段" }
    }
    
    // 检查用户是否是参与者
    const participantIndex = coopDish.participants.findIndex(p => p.user_id === userId)
    if (participantIndex === -1) {
        return { success: false, message: "你不是该合作料理的参与者" }
    }
    
    // 更新用户贡献状态
    coopDish.participants[participantIndex].status = "joined"
    coopDish.participants[participantIndex].contributed = true
    
    // 添加食材贡献
    coopDish.ingredients_contributed.push(...ingredients.map(ing => ({
        contributor_id: userId,
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        quality: ing.quality || 1
    })))
    
    // 计算品质加成
    coopDish.quality_bonus += ingredients.length * 2
    
    // 检查是否所有参与者都已贡献
    const allContributed = coopDish.participants
        .filter(p => p.status === "joined")
        .every(p => p.contributed)
    
    if (allContributed) {
        coopDish.status = "ready"
    }
    
    saveCoopData(coopData)
    
    return { 
        success: true, 
        message: "贡献成功", 
        status: coopDish.status, 
        quality_bonus: coopDish.quality_bonus 
    }
}

// 完成合作料理
export function completeCoopDish(coopDishId, resultDish) {
    const coopData = getCoopData()
    const coopDishIndex = coopData.coop_dishes.findIndex(d => d.id === coopDishId)
    
    if (coopDishIndex === -1) {
        return { success: false, message: "合作料理不存在" }
    }
    
    const coopDish = coopData.coop_dishes[coopDishIndex]
    
    if (coopDish.status !== "ready") {
        return { success: false, message: "该合作料理还未准备好" }
    }
    
    // 更新合作料理信息
    coopDish.status = "completed"
    coopDish.completed_at = Date.now()
    coopDish.result_dish = resultDish
    
    saveCoopData(coopData)
    
    return { success: true, coopDish }
}

// 检查用户是否被封禁，同时尊重反作弊系统的开关状态
export async function checkUserBanned(userId) {
    // 检查反作弊系统是否启用
    const antiCheatEnabled = await isAntiCheatEnabled();
    if (!antiCheatEnabled) {
        return false; // 如果反作弊系统关闭，直接返回未封禁
    }
    
    // 检查用户是否被封禁
    const banUntil = await redis.get(`ban:${userId}`);
    if (banUntil && Date.now() < parseInt(banUntil)) {
        return true; // 用户被封禁且封禁时间未到
    }
    
    return false; // 用户未被封禁或封禁已过期
}

