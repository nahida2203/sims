import { segment } from 'icqq'
import plugin from '../../../lib/plugins/plugin.js'
import { checkUserData, saveUserData } from '../function/function.js'
import { 
     getChefData,
     saveChefData,
     CHEF_DATA_FOLDER,
     addIngredientToBackpack,
     useIngredientsFromBackpack,
     addDishToBackpack,
     addKitchenwareToBackpack,
     getKitchenwareFromBackpack,
     calculateKitchenwareBonus,
     getCoopData,
     saveCoopData,
     getContestData,
     saveContestData,
     getMarketData,
     saveMarketData,
     createTeam,
     getUserTeam,
     createContest,
     submitContestDish,
     finishContest,
     CHEF_COOP_PATH,
     CHEF_CONTEST_PATH,
     CHEF_MARKET_PATH,
     createMarketListing,
     buyMarketIngredient,
     createCoopDish,
     contributeToCoopDish,
     completeCoopDish,
     getIngredientFromBackpack } from '../function/function.js'
import { checkCooldown, setCooldown } from '../function/cooldown.js'
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import fs from 'fs'
import path from 'path'

const _path = process.cwd().replace(/\\/g, "/")
const RECIPES_PATH = './plugins/sims-plugin/data/recipes.json'
const INGREDIENTS_PATH = './plugins/sims-plugin/data/ingredients.json'
const KITCHENWARE_PATH = './plugins/sims-plugin/data/kitchenware.json'
if (!fs.existsSync(CHEF_DATA_FOLDER)) {
    fs.mkdirSync(CHEF_DATA_FOLDER, { recursive: true })
}
if (!fs.existsSync(CHEF_COOP_PATH)) {
    fs.writeFileSync(CHEF_COOP_PATH, JSON.stringify({
        teams: [],
        coop_dishes: []
    }, null, 2))
}

if (!fs.existsSync(CHEF_CONTEST_PATH)) {
    fs.writeFileSync(CHEF_CONTEST_PATH, JSON.stringify({
        active_contests: [],
        history: [],
        rankings: []
    }, null, 2))
}

if (!fs.existsSync(CHEF_MARKET_PATH)) {
    fs.writeFileSync(CHEF_MARKET_PATH, JSON.stringify({
        listings: [],
        transactions: []
    }, null, 2))
}
export class ChefSystem extends plugin {
    constructor() {
        super({
            name: '厨师模拟',
            dsc: '模拟厨师系统',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#成为厨师$',
                    fnc: 'becomeChef'
                },
                {
                    reg: '^#查看食谱$',
                    fnc: 'showRecipes'
                },
                {
                    reg: '^#购买食材.*$',
                    fnc: 'buyIngredients'
                },
                {
                    reg: '^#制作料理.*$',
                    fnc: 'cookDish'
                },
                {
                    reg: '^#我的厨房$',
                    fnc: 'showKitchen'
                },
                {
                    reg: '^#学习食谱.*$',
                    fnc: 'learnRecipe'
                },
                {
                    reg: '^#厨师等级$',
                    fnc: 'showChefLevel'
                },
                {
                    reg: '^#厨师攻略$',
                    fnc: 'showGuide'
                },
                {
                    reg: '^#出售料理.*$',
                    fnc: 'sellDish'
                },
                {
                    reg: '^#食用料理.*$',
                    fnc: 'eatDish'
                },
                {
                    reg: '^#查看全部食材$',
                    fnc: 'showAllIngredients'
                },
                {
                    reg: '^#查看厨具商店$',
                    fnc: 'showKitchenwareShop'
                },
                {
                    reg: '^#购买厨具.*$',
                    fnc: 'buyKitchenware'
                },
                {
                    reg: '^#我的厨具$',
                    fnc: 'showMyKitchenware'
                },
                {
                    reg: '^#创建厨师团队.*$',
                    fnc: 'createChefTeam'
                },
                {
                    reg: '^#邀请加入团队.*$',
                    fnc: 'inviteToTeam'
                },
                {
                    reg: '^#加入厨师团队.*$',
                    fnc: 'joinTeam'
                },
                {
                    reg: '^#退出厨师团队$',
                    fnc: 'leaveTeam'
                },
                {
                    reg: '^#我的厨师团队$',
                    fnc: 'showMyTeam'
                },
                {
                    reg: '^#厨师团队排名$',
                    fnc: 'showTeamRankings'
                },
                {
                    reg: '^#发起厨艺比赛.*$',
                    fnc: 'createCookingContest'
                },
                {
                    reg: '^#查看活跃比赛$',
                    fnc: 'showActiveContests'
                },
                {
                    reg: '^#查看比赛详情.*$',
                    fnc: 'showContestDetails'
                },
                {
                    reg: '^#参加厨艺比赛.*$',
                    fnc: 'joinContest'
                },
                {
                    reg: '^#提交比赛作品.*$',
                    fnc: 'submitToContest'
                },
                {
                    reg: '^#结束厨艺比赛.*$',
                    fnc: 'endContest'
                },
                {
                    reg: '^#厨艺比赛排名$',
                    fnc: 'showContestRankings'
                },
                {
                    reg: '^#上架食材.*$',
                    fnc: 'sellIngredient'
                },
                {
                    reg: '^#下架食材.*$',
                    fnc: 'cancelListing'
                },
                {
                    reg: '^#食材市场$',
                    fnc: 'showIngredientMarket'
                },
                {
                    reg: '^#购买市场食材.*$',
                    fnc: 'buyMarketItem'
                },
                {
                    reg: '^#我的市场挂单$',
                    fnc: 'showMyListings'
                },
                {
                    reg: '^#发起合作料理.*$',
                    fnc: 'startCoopCooking'
                },
                {
                    reg: '^#参与合作料理.*$',
                    fnc: 'joinCoopCooking'
                },
                {
                    reg: '^#贡献食材.*$',
                    fnc: 'contributeIngredients'
                },
                {
                    reg: '^#完成合作料理.*$',
                    fnc: 'finishCoopCooking'
                },
                {
                    reg: '^#查看合作料理.*$',
                    fnc: 'showCoopCooking'
                },
                {
                    reg: '^#我的合作料理$',
                    fnc: 'showMyCoopCooking'
                }
            ]
        })
    }

    async becomeChef(e) {
        const userId = e.user_id
        const userData = await checkUserData(userId)
        
        if (!userData) {
            e.reply("请先创建模拟人生角色！")
            return
        }

        const chefData = getChefData(userId)
        
        if (chefData) {
            e.reply("你已经是一名厨师了！")
            return
        }

        // 初始化厨师数据
        const newChefData = {
            level: 1,
            exp: 0,
            recipes: ["soup_01"], // 初始解锁食谱
            successDishes: 0,
            totalDishes: 0,
            reputation: 50
        }

        saveChefData(userId, newChefData)
        
        e.reply("恭喜你成为一名厨师！现在可以开始你的烹饪之旅了。")
        this.showNewbieGuide(e)
    }

    async showRecipes(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！发送 #成为厨师 开始你的烹饪之旅！")
            return
        }

        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        
        await image(e, 'recipes', { 
            cssFile, 
            recipes: recipes.recipes,
            unlockedRecipes: chefData.recipes,
            chefLevel: chefData.level
        })
    }

    async buyIngredients(e) {
        const userId = e.user_id
        const match = e.msg.match(/^#购买食材\s+(.+?)(?:\s+(\d+))?$/)
        
        if (!match) {
            e.reply("格式错误！正确格式：#购买食材 食材名称/ID [数量]")
            return
        }

        const nameOrId = match[1].trim()
        const amount = match[2] ? parseInt(match[2]) : 1  // 如果没有指定数量，默认为1

        // 读取食材数据
        const ingredients = JSON.parse(fs.readFileSync(INGREDIENTS_PATH)).ingredients
        
        // 先尝试按ID查找
        let ingredient = ingredients.find(i => i.id === nameOrId)
        
        // 如果没找到，再按名称查找
        if (!ingredient) {
            ingredient = ingredients.find(i => i.name === nameOrId)
        }
        
        if (!ingredient) {
            e.reply(`未找到名为"${nameOrId}"的食材！请使用 #查看全部食材 查看可用食材。`)
            return
        }

        const chefData = getChefData(userId)
        if (!chefData) {
            e.reply("你还不是厨师！")
            return
        }

        const userData = await checkUserData(userId)
        const totalCost = ingredient.price * amount

        if (userData.money < totalCost) {
            e.reply(`购买失败！需要${totalCost}金币，余额不足。`)
            return
        }

        // 检查背包容量
        if (userData.backpack.length >= userData.backpackCapacity) {
            e.reply("你的背包已满，无法购买更多物品")
            return
        }
        addIngredientToBackpack(userData, ingredient.id, ingredient.name, amount)
        userData.money -= totalCost
        await saveUserData(userId, userData)
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        saveChefData(userId, chefData)

        e.reply(`购买成功！\n${ingredient.name} x${amount}\n共花费${totalCost}金币`)
    }

    async cookDish(e) {
        const userId = e.user_id
        const match = e.msg.match(/^#制作料理\s+(.+)$/)
        
        if (!match) {
            e.reply("格式错误！正确格式：#制作料理 食谱名称/ID")
            return
        }

        const nameOrId = match[1].trim()
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        
        // 先尝试按ID查找
        let recipe = recipes.recipes.find(r => r.id === nameOrId)
        
        // 如果没找到，再按名称查找
        if (!recipe) {
            recipe = recipes.recipes.find(r => r.name === nameOrId)
        }
        
        if (!recipe) {
            e.reply(`未找到名为"${nameOrId}"的食谱！请使用 #查看食谱 查看可用食谱。`)
            return
        }

        const chefData = getChefData(userId)
        if (!chefData) {
            e.reply("你还不是厨师！")
            return
        }

        if (!chefData.recipes.includes(recipe.id)) {
            e.reply("你还没有解锁这个食谱！")
            return
        }

        const remainingTime = checkCooldown(userId, 'chef', 'cook')
        if (remainingTime > 0) {
            e.reply(`厨具还在清洗中，请等待${remainingTime}秒后再制作～`)
            return
        }

        const userData = await checkUserData(userId)

        // 检查是否有足够的食材
        if (!useIngredientsFromBackpack(userData, recipe.ingredients)) {
            e.reply(`食材不足！请检查你的背包中是否有足够的食材。`)
            return
        }

        // 计算厨具带来的加成效果
        const kitchenwareBonus = calculateKitchenwareBonus(userData, recipe)

        // 计算成功率，加上厨具带来的加成
        const baseSuccess = recipe.successRate
        const levelBonus = chefData.level * 2
        const finalSuccess = Math.min(95, baseSuccess + levelBonus + kitchenwareBonus.successRate)
        const isSuccess = Math.random() * 100 <= finalSuccess

        // 更新数据
        chefData.totalDishes++
        if (isSuccess) {
            chefData.successDishes++
            chefData.exp += recipe.exp
            chefData.reputation += 1

            // 检查升级
            if (chefData.exp >= chefData.level * 100) {
                chefData.level += 1
                chefData.exp = 0
                e.reply(`恭喜！你的厨师等级提升到${chefData.level}级！`)
            }

            // 保存制作好的料理到玩家背包，料理品质会受到厨具加成
            const newDish = {
                id: `${recipe.id}_${Date.now()}`,
                recipeId: recipe.id,
                name: recipe.name,
                quality: Math.floor(Math.random() * 20) + chefData.level * 3 + kitchenwareBonus.qualityBonus,
                madeTime: Date.now(),
                nutrition: recipe.nutrition || {
                    hunger: Math.floor(recipe.difficulty * 5 + Math.random() * 10),
                    mood: Math.floor(recipe.difficulty * 3 + Math.random() * 8),
                    energy: Math.floor(recipe.difficulty * 4 + Math.random() * 9)
                },
                basePrice: recipe.basePrice
            }
            
            addDishToBackpack(userData, newDish)
            userData.money += recipe.basePrice * (1 + chefData.reputation / 100)
        }

        saveChefData(userId, chefData)
        await saveUserData(userId, userData)
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        // 冷却时间会减少，受厨具影响
        let cooldownTime = 30 - kitchenwareBonus.timeReduction
        cooldownTime = Math.max(10, cooldownTime) // 最少10秒冷却时间
        setCooldown(userId, 'chef', 'cook', cooldownTime)

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'cooking_result', { 
            cssFile, 
            recipe,
            isSuccess,
            chefData: chefData,
            kitchenwareBonus
        })
    }

    async showKitchen(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！发送 #成为厨师 开始你的烹饪之旅！")
            return
        }

        const ingredients = JSON.parse(fs.readFileSync(INGREDIENTS_PATH))
        const userData = await checkUserData(userId)
        
        // 从背包中获取食材信息
        const userIngredients = {}
        userData.backpack.forEach(item => {
            if (item.type === "ingredient") {
                userIngredients[item.id] = item.amount
            }
        })
        
        // 获取用户拥有的厨具信息
        const userKitchenware = getKitchenwareFromBackpack(userData)
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        
        await image(e, 'kitchen', { 
            cssFile, 
            chef: chefData,
            ingredients: ingredients.ingredients,
            userIngredients: userIngredients,
            userKitchenware: userKitchenware
        })
    }

    async learnRecipe(e) {
        const userId = e.user_id
        const match = e.msg.match(/^#学习食谱\s*(\w+)$/)
        
        if (!match) {
            e.reply("格式错误！正确格式：#学习食谱 食谱ID")
            return
        }

        const recipeId = match[1]
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        const recipe = recipes.recipes.find(r => r.id === recipeId)
        
        if (!recipe) {
            e.reply("未找到该食谱！")
            return
        }

        const chefData = getChefData(userId)
        if (!chefData) {
            e.reply("你还不是厨师！")
            return
        }

        if (chefData.recipes.includes(recipeId)) {
            e.reply("你已经会这个食谱了！")
            return
        }

        if (chefData.level < recipe.unlockLevel) {
            e.reply(`需要达到${recipe.unlockLevel}级才能学习这个食谱！`)
            return
        }

        const userData = await checkUserData(userId)
        const learnCost = recipe.difficulty * 100

        if (userData.money < learnCost) {
            e.reply(`学习该食谱需要${learnCost}金币，余额不足！`)
            return
        }

        // 扣除金币并学习食谱
        userData.money -= learnCost
        chefData.recipes.push(recipeId)
        
        await saveUserData(userId, userData)
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        saveChefData(userId, chefData)

        e.reply(`恭喜学会了新食谱：${recipe.name}！\n可以使用 #制作料理 ${recipeId} 来尝试制作。`)
    }

    async showChefLevel(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！发送 #成为厨师 开始你的烹饪之旅！")
            return
        }

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'chef_level', { 
            cssFile, 
            chef: chefData
        })
    }

    async showNewbieGuide(e) {
        const guide = `# 厨师新手指南

1. 基础操作
   - 使用 #查看食谱 了解可用食谱
   - 使用 #购买食材 补充原料
   - 使用 #制作料理 开始烹饪
   - 使用 #查看厨具商店 购买厨具提高成功率

2. 升级技巧
   - 多尝试制作不同料理
   - 成功制作可获得经验
   - 提升等级解锁新食谱
   - 购买更好的厨具提高料理品质

3. 注意事项
   - 确保食材充足
   - 关注成功率
   - 合理使用金币
   - 选择合适的厨具

发送 #厨师攻略 查看完整攻略`

        e.reply(guide)
    }

    async showGuide(e) {
        const guide = fs.readFileSync('./plugins/sims-plugin/模拟人生攻略.md', 'utf8')
        e.reply(guide)
    }

    async sellDish(e) {
        const userId = e.user_id
        const match = e.msg.match(/^#出售料理\s+(.+?)(?:\s+(\d+))?$/)
        
        if (!match) {
            e.reply("格式错误！正确格式：#出售料理 料理名称/ID [数量]")
            return
        }

        const nameOrId = match[1].trim()
        const count = match[2] ? parseInt(match[2]) : 1  // 如果没有指定数量，默认为1
        
        if (count <= 0) {
            e.reply("出售数量必须大于0！")
            return
        }

        const chefData = getChefData(userId)
        if (!chefData) {
            e.reply("你还不是厨师！")
            return
        }

        const userData = await checkUserData(userId)
        const matchingDishes = userData.backpack.filter(item => 
            item.type === "dish" && (item.id === nameOrId || item.name === nameOrId))
        
        if (matchingDishes.length === 0) {
            e.reply(`未找到名为"${nameOrId}"的料理！`)
            return
        }
        
        if (matchingDishes.length < count) {
            e.reply(`背包中只有${matchingDishes.length}个"${matchingDishes[0].name}"，不足${count}个！`)
            return
        }
        
        // 按照品质从低到高排序，优先出售品质低的
        matchingDishes.sort((a, b) => a.quality - b.quality)
        
        // 取出要卖出的数量
        const dishesToSell = matchingDishes.slice(0, count)
        
        let totalPrice = 0
        let totalExp = 0
        
        // 计算总价格并从背包中移除
        for (const dish of dishesToSell) {
            // 计算出售价格，考虑品质和厨师声望
            const basePrice = dish.basePrice
            const qualityBonus = dish.quality / 10
            const reputationBonus = chefData.reputation / 100
            const finalPrice = Math.floor(basePrice * (1 + qualityBonus) * (1 + reputationBonus))
            
            totalPrice += finalPrice
            totalExp += Math.floor(finalPrice / 20)
            
            // 从背包中移除料理
            const dishIndex = userData.backpack.findIndex(item => item.id === dish.id)
            if (dishIndex !== -1) {
                userData.backpack.splice(dishIndex, 1)
            }
        }
        
        // 增加金币
        userData.money += totalPrice
        await saveUserData(userId, userData)
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        // 增加厨师经验
        chefData.exp += totalExp
        
        // 检查升级
        let levelUpMessage = ""
        let oldLevel = chefData.level
        while (chefData.exp >= chefData.level * 100) {
            chefData.level += 1
            chefData.exp -= (chefData.level - 1) * 100
        }
        
        if (chefData.level > oldLevel) {
            levelUpMessage = `\n恭喜！你的厨师等级提升到${chefData.level}级！`
        }
        
        saveChefData(userId, chefData)

        if (count === 1) {
            const dish = dishesToSell[0]
            let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
            await image(e, 'sell_dish', { 
                cssFile, 
                dish,
                price: totalPrice,
                chef: chefData
            })
        } else {
            e.reply(`成功出售${count}个${dishesToSell[0].name}！\n获得金币：${totalPrice}\n获得经验：${totalExp}${levelUpMessage}`)
        }
    }

    async eatDish(e) {
        const userId = e.user_id
        const match = e.msg.match(/^#食用料理\s+(.+?)(?:\s+(\d+))?$/)
        
        if (!match) {
            e.reply("格式错误！正确格式：#食用料理 料理名称/ID [数量]")
            return
        }

        const nameOrId = match[1].trim()
        const count = match[2] ? parseInt(match[2]) : 1  // 如果没有指定数量，默认为1
        
        if (count <= 0) {
            e.reply("食用数量必须大于0！")
            return
        }

        const userData = await checkUserData(userId)
        
        if (!userData) {
            e.reply("你还没有模拟人生角色！")
            return
        }

        // 从背包中查找料理
        const matchingDishes = userData.backpack.filter(item => 
            item.type === "dish" && (item.id === nameOrId || item.name === nameOrId))
        
        if (matchingDishes.length === 0) {
            e.reply(`未找到名为"${nameOrId}"的料理！`)
            return
        }
        
        if (matchingDishes.length < count) {
            e.reply(`背包中只有${matchingDishes.length}个"${matchingDishes[0].name}"，不足${count}个！`)
            return
        }
        
        // 保存原始值用于显示变化
        const oldValues = {
            hunger: userData.hunger || 0,
            mood: userData.mood || 0,
            energy: userData.energy || 0
        }
        
        // 按照品质从高到低排序，优先食用品质高的
        matchingDishes.sort((a, b) => b.quality - a.quality)
        
        // 取出要食用的数量
        const dishesToEat = matchingDishes.slice(0, count)
        
        let totalNutrition = {
            hunger: 0,
            mood: 0,
            energy: 0
        }
        
        // 计算总营养价值并从背包中移除
        for (const dish of dishesToEat) {
            totalNutrition.hunger += dish.nutrition.hunger || 0
            totalNutrition.mood += dish.nutrition.mood || 0
            totalNutrition.energy += dish.nutrition.energy || 0
            
            // 额外效果基于料理品质
            if (dish.quality > 80) {
                // 高品质料理有特殊效果
                userData.luck = Math.min(100, (userData.luck || 0) + 2)  // 降低单个料理的幸运加成
            }
            
            // 从背包中移除料理
            const dishIndex = userData.backpack.findIndex(item => item.id === dish.id)
            if (dishIndex !== -1) {
                userData.backpack.splice(dishIndex, 1)
            }
        }
        
        // 更新玩家属性，考虑上限
        userData.hunger = Math.min(100, (userData.hunger || 0) + totalNutrition.hunger)
        userData.mood = Math.min(100, (userData.mood || 0) + totalNutrition.mood)
        userData.energy = Math.min(100, (userData.energy || 0) + totalNutrition.energy)

        await saveUserData(userId, userData)
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        if (count === 1) {
            const dish = dishesToEat[0]
            let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
            await image(e, 'eat_dish', { 
                cssFile, 
                dish,
                oldValues,
                newValues: {
                    hunger: userData.hunger,
                    mood: userData.mood,
                    energy: userData.energy
                },
                character: userData
            })
        } else {
            const dish = dishesToEat[0] // 只展示第一个料理的名称
            e.reply(`成功食用${count}个${dish.name}！\n
饱食度: ${oldValues.hunger} → ${userData.hunger} (+${totalNutrition.hunger})
心情: ${oldValues.mood} → ${userData.mood} (+${totalNutrition.mood})
体力: ${oldValues.energy} → ${userData.energy} (+${totalNutrition.energy})`)
        }
    }

    async showAllIngredients(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！发送 #成为厨师 开始你的烹饪之旅！")
            return
        }

        const ingredients = JSON.parse(fs.readFileSync(INGREDIENTS_PATH))
        const userData = await checkUserData(userId)

        // 从背包中获取食材信息
        const userIngredients = {}
        userData.backpack.forEach(item => {
            if (item.type === "ingredient") {
                userIngredients[item.id] = item.amount
            }
        })

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'all_ingredients', { 
            cssFile, 
            ingredients: ingredients.ingredients,
            userIngredients: userIngredients,
            money: userData.money
        })
    }
    
    async showKitchenwareShop(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！发送 #成为厨师 开始你的烹饪之旅！")
            return
        }

        const kitchenware = JSON.parse(fs.readFileSync(KITCHENWARE_PATH))
        const userData = await checkUserData(userId)
        
        // 获取玩家已有的厨具ID列表
        const ownedKitchenwareIds = userData.backpack
            .filter(item => item.type === "kitchenware")
            .map(item => item.id)
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'kitchenware_shop', { 
            cssFile, 
            kitchenware: kitchenware.kitchenware,
            categories: kitchenware.categories,
            chefLevel: chefData.level,
            money: userData.money,
            ownedKitchenwareIds
        })
    }
    
    async buyKitchenware(e) {
        const userId = e.user_id
        const match = e.msg.match(/^#购买厨具\s+(.+)$/)
        
        if (!match) {
            e.reply("格式错误！正确格式：#购买厨具 厨具名称/ID")
            return
        }

        const nameOrId = match[1].trim()
        const kitchenwareData = JSON.parse(fs.readFileSync(KITCHENWARE_PATH))
        
        // 先尝试按ID查找
        let kitchenware = kitchenwareData.kitchenware.find(k => k.id === nameOrId)
        
        // 如果没找到，再按名称查找
        if (!kitchenware) {
            kitchenware = kitchenwareData.kitchenware.find(k => k.name === nameOrId)
        }
        
        if (!kitchenware) {
            e.reply(`未找到名为"${nameOrId}"的厨具！请使用 #查看厨具商店 查看可用厨具。`)
            return
        }

        const chefData = getChefData(userId)
        if (!chefData) {
            e.reply("你还不是厨师！")
            return
        }

        const userData = await checkUserData(userId)
        
        // 检查等级要求
        if (chefData.level < kitchenware.unlockLevel) {
            e.reply(`购买失败！需要达到厨师等级${kitchenware.unlockLevel}才能购买该厨具。`)
            return
        }
        
        // 检查金币是否足够
        if (userData.money < kitchenware.price) {
            e.reply(`购买失败！需要${kitchenware.price}金币，余额不足。`)
            return
        }
        
        // 检查是否已拥有同ID厨具
        const hasKitchenware = userData.backpack.some(item => 
            item.type === "kitchenware" && item.id === kitchenware.id)
        
        if (hasKitchenware) {
            e.reply(`你已经拥有【${kitchenware.name}】了！`)
            return
        }
        
        // 检查背包容量
        if (userData.backpack.length >= userData.backpackCapacity) {
            e.reply("你的背包已满，无法购买更多物品")
            return
        }
        
        // 添加厨具到背包
        addKitchenwareToBackpack(userData, kitchenware)
        
        // 扣除金币
        userData.money -= kitchenware.price
        await saveUserData(userId, userData)
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        e.reply(`购买成功！你获得了【${kitchenware.name}】\n${kitchenware.description}\n共花费${kitchenware.price}金币。`)
    }
    
    async showMyKitchenware(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！发送 #成为厨师 开始你的烹饪之旅！")
            return
        }

        const userData = await checkUserData(userId)
        const userKitchenware = getKitchenwareFromBackpack(userData)
        
        if (userKitchenware.length === 0) {
            e.reply("你还没有购买任何厨具！发送 #查看厨具商店 购买厨具提高烹饪成功率。")
            return
        }
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'my_kitchenware', { 
            cssFile, 
            kitchenware: userKitchenware,
            chef: chefData
        })
    }

    // 多人联机功能 - 厨师团队相关方法
    async createChefTeam(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 检查冷却时间
        const remainingTime = checkCooldown(userId, 'chef', 'team')
        if (remainingTime > 0) {
            e.reply(`操作太快了，请等待${remainingTime}秒后再试`)
            return
        }
        
        // 解析团队名称
        const match = e.msg.match(/^#创建厨师团队\s+(.+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#创建厨师团队 [团队名称]")
            return
        }
        
        const teamName = match[1].trim()
        
        if (teamName.length < 2 || teamName.length > 10) {
            e.reply("团队名称长度需在2-10个字符之间")
            return
        }
        
        // 检查用户是否已在团队中
        const existingTeam = getUserTeam(userId)
        if (existingTeam) {
            e.reply(`你已经在团队"${existingTeam.name}"中，无法创建新团队`)
            return
        }
        
        // 检查用户金币是否足够（创建团队需要花费）
        const userData = await checkUserData(userId)
        const createCost = 500
        
        if (userData.money < createCost) {
            e.reply(`创建厨师团队需要${createCost}金币，你的余额不足`)
            return
        }
        
        // 扣除金币
        userData.money -= createCost
        await saveUserData(userId, userData)
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        // 创建团队
        const result = createTeam(teamName, userId)
        
        if (!result.success) {
            e.reply(result.message)
            // 退还金币
            userData.money += createCost
            await saveUserData(userId, userData)
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            return
        }
        
       
        setCooldown(userId, 'chef', 'team', 60)
        
        e.reply([
            segment.at(userId),
            `\n恭喜你成功创建厨师团队"${teamName}"！\n`,
            `成为团队厨师长可以提升你的声望！\n`,
            `使用 #邀请加入团队 @某人 邀请其他厨师加入你的团队。\n`,
            `团队成员可以一起参与合作料理，分享食材，联合参加厨艺比赛！`
        ])
    }
    
    async inviteToTeam(e) {
        const userId = e.user_id
        
        // 检查at的用户
        if (!e.at) {
            e.reply("请@你想邀请的用户")
            return
        }
        
        const targetId = e.at
        
        // 检查用户是否是厨师
        const chefData = getChefData(userId)
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 检查目标用户是否是厨师
        const targetChefData = getChefData(targetId)
        if (!targetChefData) {
            e.reply("对方还不是厨师，无法邀请加入团队")
            return
        }
        
        // 检查用户是否有团队
        const userTeam = getUserTeam(userId)
        if (!userTeam) {
            e.reply("你还没有创建或加入厨师团队")
            return
        }
        
        // 检查用户是否是团队创建者
        if (userTeam.creator !== userId) {
            e.reply("只有团队厨师长才能邀请新成员")
            return
        }
        
        // 检查目标用户是否已在团队中
        if (userTeam.members.includes(targetId)) {
            e.reply("对方已经是团队成员了")
            return
        }
        
        // 检查团队人数上限（设定为5人）
        if (userTeam.members.length >= 5) {
            e.reply("团队人数已达上限(5人)，无法邀请更多成员")
            return
        }
        
        // 检查目标用户是否在其他团队
        const targetTeam = getUserTeam(targetId)
        if (targetTeam) {
            e.reply(`对方已经在团队"${targetTeam.name}"中，请先让对方退出当前团队`)
            return
        }
        
        e.reply([
            segment.at(targetId),
            `\n${e.sender.card || e.sender.nickname}邀请你加入厨师团队"${userTeam.name}"！\n`,
            `使用 #加入厨师团队 ${userTeam.id} 接受邀请。\n`,
            `团队成员可以一起合作料理，分享食材，联合参加厨艺比赛！`
        ])
    }
    
    async joinTeam(e) {
        const userId = e.user_id
        
        // 解析团队ID
        const match = e.msg.match(/^#加入厨师团队\s+(.+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#加入厨师团队 [团队ID]")
            return
        }
        
        const teamId = match[1].trim()
        
        // 检查用户是否是厨师
        const chefData = getChefData(userId)
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 检查用户是否已在团队中
        const existingTeam = getUserTeam(userId)
        if (existingTeam) {
            e.reply(`你已经在团队"${existingTeam.name}"中，请先退出当前团队`)
            return
        }
        
        // 获取所有团队数据
        const coopData = getCoopData()
        const team = coopData.teams.find(t => t.id === teamId)
        
        if (!team) {
            e.reply("未找到该团队，请检查团队ID是否正确")
            return
        }
        
        // 检查团队人数上限
        if (team.members.length >= 5) {
            e.reply(`团队"${team.name}"已达到人数上限(5人)，无法加入`)
            return
        }
        
        // 加入团队
        team.members.push(userId)
        saveCoopData(coopData)
        
        e.reply([
            segment.at(userId),
            `\n成功加入厨师团队"${team.name}"！\n`,
            `现在你可以与团队成员一起参与各种烹饪活动。\n`,
            `使用 #我的厨师团队 查看团队信息。`
        ])
        
        // 通知团队创建者
        e.reply([
            segment.at(team.creator),
            `\n有新成员加入你的团队！${e.sender.card || e.sender.nickname}已加入"${team.name}"`
        ])
    }
    
    async leaveTeam(e) {
        const userId = e.user_id
        
        // 检查用户是否是厨师
        const chefData = getChefData(userId)
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 检查用户是否在团队中
        const userTeam = getUserTeam(userId)
        if (!userTeam) {
            e.reply("你不在任何厨师团队中")
            return
        }
        
        // 检查是否是创建者
        if (userTeam.creator === userId) {
            e.reply("作为团队厨师长，你不能直接退出团队。如果要解散团队，请先将所有成员移除。")
            return
        }
        
        // 获取所有团队数据
        const coopData = getCoopData()
        const teamIndex = coopData.teams.findIndex(t => t.id === userTeam.id)
        
        if (teamIndex === -1) {
            e.reply("团队数据异常，请联系管理员")
            return
        }
        
        // 将用户从团队中移除
        const memberIndex = coopData.teams[teamIndex].members.indexOf(userId)
        coopData.teams[teamIndex].members.splice(memberIndex, 1)
        saveCoopData(coopData)
        
        e.reply(`你已成功退出厨师团队"${userTeam.name}"`)
        
        // 通知团队创建者
        e.reply([
            segment.at(userTeam.creator),
            `\n有成员退出你的团队！${e.sender.card || e.sender.nickname}已退出"${userTeam.name}"`
        ])
    }
    
    async showMyTeam(e) {
        const userId = e.user_id
        
        // 检查用户是否是厨师
        const chefData = getChefData(userId)
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 检查用户是否在团队中
        const userTeam = getUserTeam(userId)
        if (!userTeam) {
            e.reply("你不在任何厨师团队中，使用 #创建厨师团队 [名称] 创建一个团队，或使用 #加入厨师团队 [团队ID] 加入现有团队。")
            return
        }
        
        // 获取团队成员信息
        const memberInfo = []
        let totalReputation = 0
        
        for (const memberId of userTeam.members) {
            const isLeader = memberId === userTeam.creator
            const memberChef = getChefData(memberId)
            const memberName = memberId === userId ? "你" : `[QQ:${memberId}]`
            
            if (memberChef) {
                memberInfo.push({
                    name: memberName,
                    level: memberChef.level,
                    reputation: memberChef.reputation,
                    icon: isLeader ? "👑" : "👨‍🍳"
                })
                totalReputation += memberChef.reputation
            } else {
                memberInfo.push({
                    name: memberName,
                    level: "?",
                    reputation: 0,
                    icon: isLeader ? "👑" : "👨‍🍳"
                })
            }
        }
        
        // 团队等级和经验
        const nextLevelExp = userTeam.level * 500
        const expPercentage = Math.min(Math.floor((userTeam.exp / nextLevelExp) * 100), 100)
        
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/`
        await image(e, 'chef_team', { 
            cssFile, 
            team: userTeam,
            memberInfo: memberInfo,
            totalReputation: totalReputation,
            nextLevelExp: nextLevelExp,
            expPercentage: expPercentage
        })
    }
    
    async showTeamRankings(e) {
        // 获取所有团队数据
        const coopData = getCoopData()
        
        if (!coopData.teams || coopData.teams.length === 0) {
            e.reply("目前还没有任何厨师团队")
            return
        }
        
        const userId = e.user_id
        const userTeam = getUserTeam(userId)
        
        // 计算团队总声望以排名
        const teamsWithScore = coopData.teams.map(team => {
            let totalReputation = 0
            let totalLevel = 0
            
            team.members.forEach(memberId => {
                const memberChef = getChefData(memberId)
                if (memberChef) {
                    totalReputation += memberChef.reputation
                    totalLevel += memberChef.level
                }
            })
            
            return {
                id: team.id,
                name: team.name,
                memberCount: team.members.length,
                level: team.level,
                reputation: totalReputation,
                avgLevel: Math.round(totalLevel / team.members.length * 10) / 10,
                isUserTeam: userTeam && team.id === userTeam.id
            }
        })
        
        // 按声望排序
        teamsWithScore.sort((a, b) => b.reputation - a.reputation)
        
        // 生成排行榜信息
        const rankings = teamsWithScore.slice(0, 10).map((team, index) => {
            return `${index + 1}. ${team.name} - 声望:${team.reputation} - Lv.${team.level} - 成员:${team.memberCount}`
        })
        
        e.reply([
            `===== 厨师团队排行榜 =====\n`,
            `${rankings.join('\n')}\n`,
            `\n创建或加入团队，与志同道合的厨师一起提升团队声望！`
        ])
    }

    // 多人联机功能 - 厨艺比赛相关方法
    async createCookingContest(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 检查冷却时间
        const remainingTime = checkCooldown(userId, 'chef', 'contest')
        if (remainingTime > 0) {
            e.reply(`操作太快了，请等待${remainingTime}秒后再试`)
            return
        }
        
        // 解析比赛信息
        const match = e.msg.match(/^#发起厨艺比赛\s+(.+?)\s+(.+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#发起厨艺比赛 [比赛名称] [食谱名称]")
            return
        }
        
        const contestName = match[1].trim()
        const recipeName = match[2].trim()
        
        if (contestName.length < 2 || contestName.length > 15) {
            e.reply("比赛名称长度需在2-15个字符之间")
            return
        }
        
        // 查找食谱
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        let recipe = recipes.recipes.find(r => r.name === recipeName)
        
        if (!recipe) {
            e.reply(`未找到名为"${recipeName}"的食谱，请使用正确的食谱名称`)
            return
        }
        
        // 检查用户是否掌握此食谱
        if (!chefData.recipes.includes(recipe.id)) {
            e.reply(`你还没有掌握"${recipeName}"食谱，无法举办此食谱的比赛`)
            return
        }
        
        // 检查用户等级（要求至少3级才能举办比赛）
        if (chefData.level < 3) {
            e.reply("举办厨艺比赛需要厨师等级达到3级以上")
            return
        }
        
        // 检查金币是否足够
        const contestCost = 300
        const userData = await checkUserData(userId)
        
        if (userData.money < contestCost) {
            e.reply(`举办厨艺比赛需要${contestCost}金币，你的余额不足`)
            return
        }
        
        // 扣除金币
        userData.money -= contestCost
        await saveUserData(userId, userData)
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        // 创建比赛
        const description = `由${e.sender.card || e.sender.nickname}举办的"${recipeName}"厨艺比赛，欢迎厨师们参加！`
        const deadline = Date.now() + 24 * 60 * 60 * 1000 // 24小时后截止
        
        const contest = createContest(contestName, description, recipe.id, userId, deadline)
        
       
        setCooldown(userId, 'chef', 'contest', 3600) // 1小时冷却
        
        // 格式化截止时间
        const deadlineDate = new Date(deadline)
        const deadlineStr = `${deadlineDate.getMonth() + 1}月${deadlineDate.getDate()}日 ${deadlineDate.getHours()}:${String(deadlineDate.getMinutes()).padStart(2, '0')}`
        
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/`
        await image(e, 'create_contest', { 
            cssFile, 
            contest: contest,
            recipe: recipe,
            deadlineStr: deadlineStr,
            creatorName: e.sender.card || e.sender.nickname
        })
        
        // 通知群内其他成员
        setTimeout(() => {
            e.reply([
                `@全体成员 新的厨艺比赛开始啦！\n`,
                `${e.sender.card || e.sender.nickname}举办了"${contestName}"比赛\n`,
                `比赛食谱：${recipeName}\n`,
                `使用 #参加厨艺比赛 ${contest.id} 参加比赛！\n`,
                `奖励：经验值加成、声望提升、金币奖励！`
            ])
        }, 1000)
    }
    
    async showActiveContests(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 获取所有活跃比赛
        const contestData = getContestData()
        
        if (contestData.active_contests.length === 0) {
            e.reply("目前没有正在进行的厨艺比赛。你可以使用 #发起厨艺比赛 [名称] [食谱] 来创建一个新比赛！")
            return
        }
        
        // 加载食谱数据
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        
        // 格式化比赛信息
        const contests = contestData.active_contests.map(contest => {
            const recipe = recipes.recipes.find(r => r.id === contest.recipe_id)
            const recipeName = recipe ? recipe.name : "未知食谱"
            
            const now = new Date()
            const remainingHours = Math.max(0, Math.floor((contest.deadline - Date.now()) / (1000 * 60 * 60)))
            const remainingMinutes = Math.max(0, Math.floor((contest.deadline - Date.now()) / (1000 * 60)) % 60)
            
            const isParticipant = contest.participants.some(p => p.user_id === userId)
            const participantCount = contest.participants.length
            
            return {
                id: contest.id,
                name: contest.name,
                recipeName: recipeName,
                participantCount: participantCount,
                remainingTime: `${remainingHours}小时${remainingMinutes}分钟`,
                isParticipant: isParticipant
            }
        })
        
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/`
        await image(e, 'active_contests', { 
            cssFile, 
            contests: contests
        })
    }
    
    async showContestDetails(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 解析比赛ID
        const match = e.msg.match(/^#查看比赛详情\s+(.+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#查看比赛详情 [比赛ID]")
            return
        }
        
        const contestId = match[1].trim()
        
        // 获取比赛数据
        const contestData = getContestData()
        
        // 先在活跃比赛中查找
        let contest = contestData.active_contests.find(c => c.id === contestId)
        let isActive = true
        
        // 如果活跃比赛中没有找到，则在历史比赛中查找
        if (!contest) {
            contest = contestData.history.find(c => c.id === contestId)
            isActive = false
        }
        
        if (!contest) {
            e.reply("未找到该比赛，请检查比赛ID是否正确")
            return
        }
        
        // 加载食谱数据
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        const recipe = recipes.recipes.find(r => r.id === contest.recipe_id)
        const recipeName = recipe ? recipe.name : "未知食谱"
        
        // 格式化时间
        const createDate = new Date(contest.created_at)
        const deadlineDate = new Date(contest.deadline)
        
        const createTime = `${createDate.getMonth() + 1}月${createDate.getDate()}日 ${createDate.getHours()}:${String(createDate.getMinutes()).padStart(2, '0')}`
        let deadlineTime = ""
        let remainingTime = ""
        let endTime = ""
        
        if (isActive) {
            const remainingHours = Math.max(0, Math.floor((contest.deadline - Date.now()) / (1000 * 60 * 60)))
            const remainingMinutes = Math.max(0, Math.floor((contest.deadline - Date.now()) / (1000 * 60)) % 60)
            deadlineTime = `${deadlineDate.getMonth() + 1}月${deadlineDate.getDate()}日 ${deadlineDate.getHours()}:${String(deadlineDate.getMinutes()).padStart(2, '0')}`
            remainingTime = `${remainingHours}小时${remainingMinutes}分钟`
        } else {
            endTime = `${deadlineDate.getMonth() + 1}月${deadlineDate.getDate()}日 ${deadlineDate.getHours()}:${String(deadlineDate.getMinutes()).padStart(2, '0')}`
        }
        
        // 获取自己的参与状态
        const userParticipant = contest.participants.find(p => p.user_id === userId)
        let userStatus = "not-joined"
        let userStatusText = "未参与"
        let userQuality = null
        
        if (userParticipant) {
            if (userParticipant.dish_id) {
                userStatus = "submitted"
                userStatusText = "已提交作品"
                userQuality = userParticipant.quality
            } else {
                userStatus = "joined"
                userStatusText = "已参与但未提交作品"
            }
        }
        
        // 获取获胜者信息
        let winners = ""
        if (!isActive && contest.winners && contest.winners.length > 0) {
            winners = contest.winners.map(w => `[QQ:${w}]`).join('、')
        }
        
        // 格式化参与者列表
        const participantsList = []
        if (contest.participants.length > 0) {
            // 按照品质排序
            const sortedParticipants = [...contest.participants].sort((a, b) => b.quality - a.quality)
            
            participantsList.push(...sortedParticipants.map((p, index) => {
                const rankEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`
                const isWinner = !isActive && contest.winners && contest.winners.includes(p.user_id)
                
                return {
                    rank: rankEmoji,
                    name: `[QQ:${p.user_id}]`,
                    quality: p.quality || "未提交",
                    isWinner: isWinner
                }
            }))
        }
        
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/`
        await image(e, 'contest_detail', { 
            cssFile, 
            contest: {
                ...contest,
                status: isActive ? 'active' : 'ended'
            },
            recipeName: recipeName,
            creatorName: `[QQ:${contest.creator_id}]`,
            createTime: createTime,
            deadlineTime: deadlineTime,
            remainingTime: remainingTime,
            endTime: endTime,
            userStatus: userStatus,
            userStatusText: userStatusText,
            userQuality: userQuality,
            winners: winners,
            participantsList: participantsList,
            participantsCount: contest.participants.length
        })
    }
    
    async joinContest(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 解析比赛ID
        const match = e.msg.match(/^#参加厨艺比赛\s+(.+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#参加厨艺比赛 [比赛ID]")
            return
        }
        
        const contestId = match[1].trim()
        
        // 获取比赛数据
        const contestData = getContestData()
        const contestIndex = contestData.active_contests.findIndex(c => c.id === contestId)
        
        if (contestIndex === -1) {
            e.reply("未找到该比赛，请检查比赛ID是否正确")
            return
        }
        
        const contest = contestData.active_contests[contestIndex]
        
        // 检查比赛是否已经截止
        if (contest.deadline < Date.now()) {
            e.reply("该比赛已经截止，无法加入")
            return
        }
        
        // 检查用户是否已经参与
        if (contest.participants.some(p => p.user_id === userId)) {
            e.reply("你已经参加了这个比赛！请使用 #提交比赛作品 命令提交你的参赛作品。")
            return
        }
        
        // 加载食谱数据
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        const recipe = recipes.recipes.find(r => r.id === contest.recipe_id)
        
        if (!recipe) {
            e.reply("比赛数据异常，无法找到对应食谱")
            return
        }
        
        // 检查用户是否掌握该食谱
        if (!chefData.recipes.includes(recipe.id)) {
            e.reply(`你还没有掌握"${recipe.name}"食谱，无法参加此比赛。请先学习该食谱。`)
            return
        }
        
        // 添加用户到参与者列表
        contest.participants.push({
            user_id: userId,
            submit_time: null,
            dish_id: null,
            quality: null
        })
        
        saveContestData(contestData)
        
        // 计算剩余时间
        const remainingHours = Math.floor((contest.deadline - Date.now()) / (1000 * 60 * 60))
        const remainingMinutes = Math.floor(((contest.deadline - Date.now()) / (1000 * 60)) % 60)
        
        e.reply([
            segment.at(userId),
            `\n成功加入厨艺比赛"${contest.name}"！\n`,
            `比赛食谱：${recipe.name}\n`,
            `剩余时间：${remainingHours}小时${remainingMinutes}分钟\n`,
            `\n接下来你需要：\n`,
            `1. 使用 #制作料理 ${recipe.name} 制作参赛作品\n`,
            `2. 制作完成后，使用 #提交比赛作品 ${contestId} [料理ID] 提交你的作品\n`,
            `\n祝你好运！`
        ])
    }
    
    async submitToContest(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        
        const match = e.msg.match(/^#提交比赛作品\s+(.+?)\s+(.+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#提交比赛作品 [比赛ID] [料理ID]")
            return
        }
        
        const contestId = match[1].trim()
        const dishId = match[2].trim()
        
        // 获取比赛数据
        const contestData = getContestData()
        const contestIndex = contestData.active_contests.findIndex(c => c.id === contestId)
        
        if (contestIndex === -1) {
            e.reply("未找到该比赛，请检查比赛ID是否正确")
            return
        }
        
        const contest = contestData.active_contests[contestIndex]
        
        // 检查比赛是否已经截止
        if (contest.deadline < Date.now()) {
            // 自动结束比赛
            finishContest(contestId)
            e.reply("该比赛已经截止，无法提交作品")
            return
        }
        
        // 检查用户是否参与了比赛
        const participantIndex = contest.participants.findIndex(p => p.user_id === userId)
        if (participantIndex === -1) {
            e.reply("你还没有参加这个比赛！请先使用 #参加厨艺比赛 命令加入比赛。")
            return
        }
        
        // 查找用户背包中的料理
        const userData = await checkUserData(userId)
        const dish = userData.backpack.find(item => 
            item.type === "dish" && item.id === dishId
        )
        
        if (!dish) {
            e.reply(`在你的背包中找不到ID为"${dishId}"的料理，请确认料理ID是否正确`)
            return
        }
        
        // 检查料理是否符合比赛要求
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        const contestRecipe = recipes.recipes.find(r => r.id === contest.recipe_id)
        
        if (dish.recipeId !== contest.recipe_id) {
            e.reply(`该料理不符合比赛要求！比赛要求制作"${contestRecipe.name}"，而你提交的是"${dish.name}"`)
            return
        }
        
        // 提交作品
        const result = submitContestDish(contestId, userId, dishId, dish.quality)
        
        if (!result.success) {
            e.reply(result.message)
            return
        }
        
        // 从背包中移除料理
        const dishIndex = userData.backpack.findIndex(item => item.id === dishId)
        userData.backpack.splice(dishIndex, 1)
        await saveUserData(userId, userData)
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        e.reply([
            segment.at(userId),
            `\n成功提交比赛作品！\n`,
            `料理：${dish.name}\n`,
            `品质：${dish.quality}\n`,
            `\n你可以使用 #查看比赛详情 ${contestId} 查看当前排名情况`
        ])
        
        // 通知比赛创建者
        if (userId !== contest.creator_id) {
            e.reply([
                segment.at(contest.creator_id),
                `\n有新的比赛作品提交！\n`,
                `比赛："${contest.name}"\n`,
                `参赛者：${e.sender.card || e.sender.nickname}\n`,
                `料理品质：${dish.quality}`
            ])
        }
    }
    
    async endContest(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 解析比赛ID
        const match = e.msg.match(/^#结束厨艺比赛\s+(.+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#结束厨艺比赛 [比赛ID]")
            return
        }
        
        const contestId = match[1].trim()
        
        // 获取比赛数据
        const contestData = getContestData()
        const contestIndex = contestData.active_contests.findIndex(c => c.id === contestId)
        
        if (contestIndex === -1) {
            e.reply("未找到该比赛，请检查比赛ID是否正确")
            return
        }
        
        const contest = contestData.active_contests[contestIndex]
        
        // 检查用户是否是比赛创建者
        if (contest.creator_id !== userId) {
            e.reply("只有比赛创建者才能手动结束比赛")
            return
        }
        
        // 比赛必须有参与者才能结束
        if (contest.participants.length === 0) {
            e.reply("比赛还没有参与者，无法结束")
            return
        }
        
        // 比赛必须至少有一名参与者提交了作品才能结束
        const hasSubmissions = contest.participants.some(p => p.dish_id !== null)
        if (!hasSubmissions) {
            e.reply("还没有参与者提交作品，无法结束比赛")
            return
        }
        
        // 结束比赛
        const result = finishContest(contestId)
        
        if (!result.success) {
            e.reply("结束比赛失败：" + (result.message || "未知错误"))
            return
        }
        
        // 加载食谱数据
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        const recipe = recipes.recipes.find(r => r.id === contest.recipe_id)
        const recipeName = recipe ? recipe.name : "未知食谱"
        
        // 按照品质排序参与者
        const sortedParticipants = [...contest.participants]
            .filter(p => p.quality !== null)
            .sort((a, b) => b.quality - a.quality)
        
        // 获取前三名
        const topThree = sortedParticipants.slice(0, Math.min(3, sortedParticipants.length))
        
        // 发放奖励
        for (let i = 0; i < topThree.length; i++) {
            const participantId = topThree[i].user_id
            const userData = await checkUserData(participantId)
            const participantChef = getChefData(participantId)
            
            if (userData && participantChef) {
                // 根据名次发放不同奖励
                let expReward, moneyReward, reputationReward
                
                switch (i) {
                    case 0: // 第一名
                        expReward = 50
                        moneyReward = 300
                        reputationReward = 10
                        break
                    case 1: // 第二名
                        expReward = 30
                        moneyReward = 200
                        reputationReward = 6
                        break
                    case 2: // 第三名
                        expReward = 20
                        moneyReward = 100
                        reputationReward = 3
                        break
                }
                
                // 增加经验和声望
                participantChef.exp += expReward
                participantChef.reputation += reputationReward
                
                // 检查升级
                if (participantChef.exp >= participantChef.level * 100) {
                    participantChef.level += 1
                    participantChef.exp = 0
                }
                
                userData.money += moneyReward
                saveChefData(participantId, participantChef)
                await saveUserData(participantId, userData)
                await redis.set(`user:${participantId}`, JSON.stringify(userData));
                // 通知获奖者
                if (participantId !== userId) {
                    e.reply([
                        segment.at(participantId),
                        `\n恭喜你在厨艺比赛"${contest.name}"中获得第${i + 1}名！\n`,
                        `奖励：\n`,
                        `- 经验值：+${expReward}\n`,
                        `- 金币：+${moneyReward}\n`,
                        `- 声望：+${reputationReward}`
                    ])
                }
            }
        }
        const winnersText = topThree.map((p, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"
            return `${medal} 第${i + 1}名：[QQ:${p.user_id}] - 品质：${p.quality}`
        }).join('\n')
        
        e.reply([
            `厨艺比赛"${contest.name}"已结束！\n`,
            `比赛食谱：${recipeName}\n`,
            `参与人数：${contest.participants.length}\n`,
            `\n获奖名单：\n${winnersText}\n`,
            `\n感谢各位厨师的参与！获奖者已获得相应奖励。`
        ])
    }

    async showContestRankings(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 获取比赛数据
        const contestData = getContestData()
        
        if (!contestData.rankings || contestData.rankings.length === 0) {
            e.reply("暂无比赛排名数据！参加并获胜厨艺比赛来获得排名。")
            return
        }
        
        // 按照得分和胜场排序
        const sortedRankings = [...contestData.rankings]
            .sort((a, b) => {
                if (b.wins !== a.wins) return b.wins - a.wins
                return b.points - a.points
            })
        
        // 生成排名数据
        const rankings = sortedRankings.slice(0, 10).map((r, index) => {
            return {
                rank: index + 1,
                name: `[QQ:${r.user_id}]`,
                wins: r.wins,
                points: r.points,
                contests: r.contests_joined,
                isUser: r.user_id === userId
            }
        })
        
        // 查找用户排名
        const userRanking = contestData.rankings.find(r => r.user_id === userId)
        let userRank = null
        
        if (userRanking) {
            userRank = contestData.rankings.filter(r => 
                r.wins > userRanking.wins || 
                (r.wins === userRanking.wins && r.points > userRanking.points)
            ).length + 1
        }
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/`
        await image(e, 'contest_rankings', { 
            cssFile, 
            rankings: rankings,
            userRank: userRank > 10 ? userRank : null,
            userRanking: userRanking ? {
                wins: userRanking.wins,
                points: userRanking.points,
                contests: userRanking.contests_joined
            } : null
        })
    }

    async sellIngredient(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        
        const match = e.msg.match(/^#上架食材\s+(.+?)\s+(\d+)\s+(\d+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#上架食材 [食材名称] [数量] [单价]")
            return
        }
        
        const ingredientName = match[1].trim()
        const quantity = parseInt(match[2])
        const pricePerUnit = parseInt(match[3])
        
        if (quantity <= 0) {
            e.reply("上架数量必须大于0！")
            return
        }
        
        if (pricePerUnit <= 0) {
            e.reply("单价必须大于0！")
            return
        }
        
        
        const userData = await checkUserData(userId)
        
        // 检查用户背包中是否有足够的该食材
        const userIngredient = userData.backpack.find(item => 
            item.type === "ingredient" && item.name === ingredientName)
        
        if (!userIngredient || userIngredient.amount < quantity) {
            e.reply(`你的背包中没有足够的${ingredientName}！`)
            return
        }
        
        // 从背包中移除食材
        const useResult = useIngredientsFromBackpack(userData, [
            { name: ingredientName, amount: quantity }
        ])
        
        if (!useResult.success) {
            e.reply(`上架失败：${useResult.message}`)
            return
        }
        
        // 创建市场挂单
        const listing = createMarketListing(
            userId, 
            userIngredient.id, 
            ingredientName, 
            quantity, 
            pricePerUnit
        )
        await saveUserData(userId, userData)
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        e.reply([
            segment.at(userId),
            `\n成功上架食材！\n`,
            `食材：${ingredientName}\n`,
            `数量：${quantity}\n`,
            `单价：${pricePerUnit}金币\n`,
            `总价值：${quantity * pricePerUnit}金币\n`,
            `挂单ID：${listing.id}\n`,
            `\n使用 #我的市场挂单 查看你的所有挂单。`
        ])
    }
    
    async showMyListings(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 获取市场数据
        const marketData = getMarketData()
        
        // 过滤用户的活跃挂单
        const userListings = marketData.listings.filter(l => l.seller_id === userId && l.status === "active")
        
        if (userListings.length === 0) {
            e.reply("你目前没有任何活跃的市场挂单。使用 #上架食材 命令出售你的食材。")
            return
        }
        
        // 计算一些统计数据
        let totalQuantity = 0
        let totalValue = 0
        
        userListings.forEach(listing => {
            totalQuantity += listing.quantity
            totalValue += listing.quantity * listing.price_per_unit
        })
        
        const formattedListings = userListings.map(listing => ({
            id: listing.id,
            ingredient_name: listing.ingredient_name,
            quantity: listing.quantity,
            price_per_unit: listing.price_per_unit,
            total_price: listing.quantity * listing.price_per_unit,
            created_at: new Date(listing.created_at).toLocaleString()
        }))
        let cssFile = `${_path}/plugins/sims-plugin/resources/`
        await image(e, 'my_listings', { 
            cssFile, 
            listings: formattedListings,
            totalQuantity: totalQuantity,
            totalValue: totalValue
        })
    }
    
    async startCoopCooking(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        const match = e.msg.match(/^#发起合作料理\s+(.+?)(?:\s+(.+))?$/)
        if (!match) {
            e.reply("格式错误！正确格式：#发起合作料理 [食谱名称] [@参与者1 @参与者2 ...]")
            return
        }
        
        const recipeName = match[1].trim()
        
        const remainingTime = checkCooldown(userId, 'chef', 'coop')
        if (remainingTime > 0) {
            e.reply(`操作太快了，请等待${remainingTime}秒后再试`)
            return
        }
        
        // 查找食谱
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        let recipe = recipes.recipes.find(r => r.name === recipeName)
        
        // 如果没找到，再按ID查找
        if (!recipe) {
            recipe = recipes.recipes.find(r => r.id === recipeName)
        }
        
        if (!recipe) {
            e.reply(`未找到名为"${recipeName}"的食谱，请使用正确的食谱名称或ID`)
            return
        }
        
        // 检查用户是否掌握此食谱
        if (!chefData.recipes.includes(recipe.id)) {
            e.reply(`你还没有掌握"${recipe.name}"食谱，无法发起合作料理`)
            return
        }
        
        // 解析@
        const participants = []
        if (e.message) {
            for (const msg of e.message) {
                if (msg.type === 'at') {
                    participants.push(msg.qq)
                }
            }
        }
        
        // 检查参与者人数
        if (participants.length === 0) {
            e.reply("请至少@一位参与合作料理的厨师")
            return
        }
        
        if (participants.length > 3) {
            e.reply("合作料理最多支持4人（你和3位参与者）")
            return
        }
        
        // 检查参与者是否都是厨师
        for (const participantId of participants) {
            const participantChef = getChefData(participantId)
            if (!participantChef) {
                e.reply(`[QQ:${participantId}]还不是厨师，无法参与合作料理`)
                return
            }
        }
        
        // 创建合作料理
        const coopDish = createCoopDish(userId, recipe.id, recipe.name, participants)
        
       
        setCooldown(userId, 'chef', 'coop', 300) // 5分钟冷却
        
        e.reply([
            segment.at(userId),
            `\n成功发起合作料理！\n`,
            `食谱：${recipe.name}\n`,
            `发起者：${e.sender.card || e.sender.nickname}\n`,
            `参与者：${participants.map(id => `[QQ:${id}]`).join('、')}\n`,
            `合作料理ID：${coopDish.id}\n`,
            `\n参与者可使用 #参与合作料理 ${coopDish.id} 加入此合作料理`
        ])
        
        // 通知被邀请者
        for (const participantId of participants) {
            e.reply([
                segment.at(participantId),
                `\n你被邀请参与合作料理！\n`,
                `食谱：${recipe.name}\n`,
                `发起者：${e.sender.card || e.sender.nickname}\n`,
                `合作料理ID：${coopDish.id}\n`,
                `\n使用 #参与合作料理 ${coopDish.id} 加入此合作料理`
            ])
        }
    }
    
    async joinCoopCooking(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        const match = e.msg.match(/^#参与合作料理\s+(.+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#参与合作料理 [合作料理ID]")
            return
        }
        
        const coopDishId = match[1].trim()
        
        // 获取合作料理数据
        const coopData = getCoopData()
        const coopDishIndex = coopData.coop_dishes.findIndex(d => d.id === coopDishId)
        
        if (coopDishIndex === -1) {
            e.reply("未找到该合作料理，请检查ID是否正确")
            return
        }
        
        const coopDish = coopData.coop_dishes[coopDishIndex]
        
        // 检查合作料理状态
        if (coopDish.status !== "preparing") {
            e.reply(`该合作料理已${coopDish.status === "completed" ? "完成" : "进行中"}，无法加入`)
            return
        }
        
        // 检查用户是否已是参与者
        const participant = coopDish.participants.find(p => p.user_id === userId)
        if (participant && participant.status === "joined") {
            e.reply("你已经加入了该合作料理")
            return
        }
        
        // 检查用户是否被邀请
        if (!participant) {
            const initiatorId = coopDish.initiator_id
            if (userId !== initiatorId) {
                e.reply("你没有被邀请参与该合作料理")
                return
            }
        }
        
        // 加入合作料理
        if (participant) {
            participant.status = "joined"
        } else {
            coopDish.participants.push({
                user_id: userId,
                status: "joined",
                contributed: false
            })
        }
        
        saveCoopData(coopData)
        
        e.reply([
            segment.at(userId),
            `\n成功加入合作料理！\n`,
            `食谱：${coopDish.recipe_name}\n`,
            `发起者：[QQ:${coopDish.initiator_id}]\n`,
            `\n现在可以使用 #贡献食材 ${coopDishId} [食材名称/ID] [数量] 贡献食材`
        ])
        
        // 通知
        if (userId !== coopDish.initiator_id) {
            e.reply([
                segment.at(coopDish.initiator_id),
                `\n${e.sender.card || e.sender.nickname}已加入你发起的合作料理！\n`,
                `合作料理ID：${coopDishId}`
            ])
        }
    }
    
    async contributeIngredients(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        
        const match = e.msg.match(/^#贡献食材\s+(.+?)\s+(.+?)(?:\s+(\d+))?$/)
        if (!match) {
            e.reply("格式错误！正确格式：#贡献食材 [合作料理ID] [食材名称/ID] [数量]")
            return
        }
        
        const coopDishId = match[1].trim()
        const ingredientNameOrId = match[2].trim()
        const amount = match[3] ? parseInt(match[3]) : 1 // 默认贡献1个
        
        if (amount <= 0) {
            e.reply("贡献数量必须大于0！")
            return
        }
        
        // 获取合作料理数据
        const coopData = getCoopData()
        const coopDishIndex = coopData.coop_dishes.findIndex(d => d.id === coopDishId)
        
        if (coopDishIndex === -1) {
            e.reply("未找到该合作料理，请检查ID是否正确")
            return
        }
        
        const coopDish = coopData.coop_dishes[coopDishIndex]
        
        // 检查合作料理状态
        if (coopDish.status !== "preparing") {
            e.reply(`该合作料理已${coopDish.status === "completed" ? "完成" : "进行中"}，无法贡献食材`)
            return
        }
        
        // 检查用户是否是参与者
        const participantIndex = coopDish.participants.findIndex(p => p.user_id === userId && p.status === "joined")
        if (participantIndex === -1) {
            e.reply("你不是该合作料理的参与者，请先使用 #参与合作料理 命令加入")
            return
        }
        const userData = await checkUserData(userId)
        
        // 查找用户背包中的食材
        const userIngredient = userData.backpack.find(item => 
            item.type === "ingredient" && (item.id === ingredientNameOrId || item.name === ingredientNameOrId))
        
        if (!userIngredient) {
            e.reply(`你的背包中没有${ingredientNameOrId}食材！`)
            return
        }
        
        if (userIngredient.amount < amount) {
            e.reply(`你只有${userIngredient.amount}个${userIngredient.name}，不足${amount}个！`)
            return
        }
        
        // 获取食谱信息
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        const recipe = recipes.recipes.find(r => r.id === coopDish.recipe_id)
        
        if (!recipe) {
            e.reply("食谱数据异常，无法贡献食材")
            return
        }
        
        // 检查该食材是否是食谱所需
        const isRequired = recipe.ingredients.some(ing => ing.id === userIngredient.id)
        const qualityBonus = isRequired ? 5 : 2 // 如果是所需食材，品质加成更多
        
        // 准备贡献的食材
        const contributedIngredients = [{
            id: userIngredient.id,
            name: userIngredient.name,
            amount: amount,
            quality: userIngredient.quality || 1
        }]
        
        // 从背包中扣除食材
        userIngredient.amount -= amount
        if (userIngredient.amount <= 0) {
            const index = userData.backpack.findIndex(item => item.id === userIngredient.id)
            userData.backpack.splice(index, 1)
        }
        
        // 贡献食材
        const result = contributeToCoopDish(coopDishId, userId, contributedIngredients)
        
        if (!result.success) {
            e.reply(`贡献失败：${result.message}`)
            // 返还食材到背包
            addIngredientToBackpack(userData, userIngredient.id, userIngredient.name, amount)
            await saveUserData(userId, userData)
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            return
        }
        await saveUserData(userId, userData)
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        // 更新合作料理状态
        const updatedCoopData = getCoopData()
        const updatedCoopDish = updatedCoopData.coop_dishes.find(d => d.id === coopDishId)
        
        e.reply([
            segment.at(userId),
            `\n成功贡献食材！\n`,
            `食材：${userIngredient.name} x${amount}\n`,
            `品质加成：+${qualityBonus * amount}\n`,
            `合作料理当前品质加成：${updatedCoopDish.quality_bonus}\n`,
            `${isRequired ? "👍 这是食谱所需的食材！" : "👌 虽然不是食谱所需，但也有助于提升品质呢"}\n`,
            updatedCoopDish.status === "ready" ? "\n所有参与者都已贡献食材！现在可以使用 #完成合作料理 命令完成制作。" : ""
        ])
        
        // 如果所有人都贡献了食材，通知发起者
        if (updatedCoopDish.status === "ready" && userId !== updatedCoopDish.initiator_id) {
            e.reply([
                segment.at(updatedCoopDish.initiator_id),
                `\n合作料理"${updatedCoopDish.recipe_name}"的所有参与者都已贡献食材！\n`,
                `现在可以使用 #完成合作料理 ${coopDishId} 命令完成制作。`
            ])
        }
    }
    
    async finishCoopCooking(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        const match = e.msg.match(/^#完成合作料理\s+(.+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#完成合作料理 [合作料理ID]")
            return
        }
        
        const coopDishId = match[1].trim()
        
        // 获取合作料理数据
        const coopData = getCoopData()
        const coopDishIndex = coopData.coop_dishes.findIndex(d => d.id === coopDishId)
        
        if (coopDishIndex === -1) {
            e.reply("未找到该合作料理，请检查ID是否正确")
            return
        }
        
        const coopDish = coopData.coop_dishes[coopDishIndex]
        
        // 检查是否是发起者
        if (coopDish.initiator_id !== userId) {
            e.reply("只有合作料理的发起者才能完成合作料理")
            return
        }
        
        // 检查合作料理状态
        if (coopDish.status === "completed") {
            e.reply("该合作料理已经完成")
            return
        }
        
        // 检查是否所有参与者都已贡献食材
        const allContributed = coopDish.participants
            .filter(p => p.status === "joined")
            .every(p => p.contributed)
        
        if (!allContributed && coopDish.status !== "ready") {
            e.reply("还有参与者未贡献食材，无法完成合作料理")
            return
        }
        const userData = await checkUserData(userId)
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        const recipe = recipes.recipes.find(r => r.id === coopDish.recipe_id)
        
        if (!recipe) {
            e.reply("食谱数据异常，无法完成合作料理")
            return
        }
        
        // 计算成功率和品质
        const participantCount = coopDish.participants.filter(p => p.status === "joined" && p.contributed).length
        const baseSuccessRate = 70 + (participantCount * 5) + (coopDish.quality_bonus / 2)
        const successRate = Math.min(baseSuccessRate, 100)
        
        // 随机决定是否成功
        const isSuccess = Math.random() * 100 < successRate
        
        if (!isSuccess) {
            // 更新合作料理状态
            coopDish.status = "failed"
            coopDish.completed_at = Date.now()
            saveCoopData(coopData)
            
            e.reply([
                segment.at(userId),
                `\n合作料理失败！\n`,
                `食谱：${coopDish.recipe_name}\n`,
                `成功率：${successRate.toFixed(1)}%\n`,
                `参与人数：${participantCount}\n`,
                `\n非常遗憾，下次再接再厉！`
            ])
            return
        }
        
        // 计算料理品质
        const baseQuality = 50 + (coopDish.quality_bonus) + (participantCount * 5)
        const quality = Math.min(baseQuality, 100)
        
        // 创建料理结果
        const dishId = `dish_${Date.now()}`
        const resultDish = {
            id: dishId,
            recipeId: recipe.id,
            name: recipe.name,
            quality: quality,
            madeTime: Date.now(),
            nutrition: recipe.nutrition,
            basePrice: recipe.basePrice * 1.5, // 合作料理价值更高
            coop: true,
            participants: coopDish.participants.filter(p => p.contributed).map(p => p.user_id)
        }
        
        // 添加料理到发起者背包
        addDishToBackpack(userData, resultDish)
        
        // 完成合作料理
        completeCoopDish(coopDishId, resultDish)
        
        // 增加参与者的经验和声望
        for (const participant of coopDish.participants.filter(p => p.contributed)) {
            const participantId = participant.user_id
            const participantChef = getChefData(participantId)
            
            if (participantChef) {
                const expGain = 20 + Math.floor(quality / 5)
                const reputationGain = Math.floor(quality / 20)
                
                participantChef.exp += expGain
                participantChef.reputation += reputationGain
                
                // 检查升级
                if (participantChef.exp >= participantChef.level * 100) {
                    participantChef.level += 1
                    participantChef.exp = 0
                }
                
                saveChefData(participantId, participantChef)
                
                // 如果不是发起者，通知参与者
                if (participantId !== userId) {
                    e.reply([
                        segment.at(participantId),
                        `\n合作料理成功完成！\n`,
                        `食谱：${coopDish.recipe_name}\n`,
                        `品质：${quality}\n`,
                        `获得经验：${expGain}\n`,
                        `获得声望：${reputationGain}`
                    ])
                }
            }
        }
        await saveUserData(userId, userData)
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        e.reply([
            segment.at(userId),
            `\n合作料理成功完成！\n`,
            `食谱：${coopDish.recipe_name}\n`,
            `品质：${quality}\n`,
            `参与人数：${participantCount}\n`,
            `\n料理已添加到你的背包，所有参与者都获得了经验和声望奖励！`
        ])
    }
    
    async showCoopCooking(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        
        const match = e.msg.match(/^#查看合作料理\s+(.+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#查看合作料理 [合作料理ID]")
            return
        }
        
        const coopDishId = match[1].trim()
        
        // 获取合作料理数据
        const coopData = getCoopData()
        const coopDish = coopData.coop_dishes.find(d => d.id === coopDishId)
        
        if (!coopDish) {
            e.reply("未找到该合作料理，请检查ID是否正确")
            return
        }
        
        // 检查用户是否参与
        const isParticipant = coopDish.participants.some(p => p.user_id === userId)
        if (!isParticipant && coopDish.initiator_id !== userId) {
            e.reply("你不是该合作料理的参与者，无法查看详情")
            return
        }
        
        // 获取食谱信息
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        const recipe = recipes.recipes.find(r => r.id === coopDish.recipe_id)
        
        if (!recipe) {
            e.reply("食谱数据异常")
            return
        }
        
        // 格式化状态
        let statusText = ""
        switch (coopDish.status) {
            case "preparing":
                statusText = "准备中"
                break
            case "ready":
                statusText = "已就绪，等待完成"
                break
            case "completed":
                statusText = "已完成"
                break
            case "failed":
                statusText = "制作失败"
                break
            default:
                statusText = coopDish.status
        }
        
        // 判断用户的状态和贡献情况
        const userParticipant = coopDish.participants.find(p => p.user_id === userId)
        const isInitiator = coopDish.initiator_id === userId
        let userStatus = "not-joined"
        let userContributed = false
        
        if (userParticipant) {
            userStatus = "joined"
            userContributed = userParticipant.contributed
        }
        
        // 格式化参与者信息
        const participantsList = coopDish.participants.map(p => {
            let statusText = ""
            let statusClass = ""
            
            if (p.status === "joined") {
                if (p.contributed) {
                    statusText = "已贡献食材"
                    statusClass = "contributed"
                } else {
                    statusText = "未贡献食材"
                    statusClass = "joined"
                }
            } else {
                statusText = "未加入"
                statusClass = "pending"
            }
            
            return {
                name: `[QQ:${p.user_id}]`,
                isInitiator: p.user_id === coopDish.initiator_id,
                statusText: statusText,
                statusClass: statusClass
            }
        })
        
        // 处理已贡献的食材
        const ingredients = coopDish.ingredients_contributed.map(ing => {
            return {
                contributor_id: ing.contributor_id,
                contributor_name: `[QQ:${ing.contributor_id}]`,
                ingredient_name: ing.ingredient_name,
                quality_bonus: ing.quality_bonus || 1
            }
        })
        
        // 品质计算
        const maxQuality = 100
        const qualityPercentage = Math.min(coopDish.quality_bonus / maxQuality * 100, 100)
        
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/`
        await image(e, 'coop_cooking', { 
            cssFile, 
            coopDish: coopDish,
            recipe: recipe,
            recipeName: recipe.name,
            statusText: statusText,
            initiatorName: `[QQ:${coopDish.initiator_id}]`,
            participantsList: participantsList,
            ingredients: ingredients,
            userStatus: userStatus,
            userContributed: userContributed,
            isInitiator: isInitiator,
            maxQuality: maxQuality,
            qualityPercentage: qualityPercentage
        })
    }
    
    async showMyCoopCooking(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 获取合作料理数据
        const coopData = getCoopData()
        
        // 查找用户参与的合作料理
        const userCoopDishes = coopData.coop_dishes.filter(dish => 
            dish.initiator_id === userId || 
            dish.participants.some(p => p.user_id === userId)
        )
        
        if (userCoopDishes.length === 0) {
            e.reply("你目前没有参与任何合作料理。使用 #发起合作料理 命令开始一个新的合作料理。")
            return
        }
        
        // 按状态和时间排序
        userCoopDishes.sort((a, b) => {
            // 首先按状态排序：准备中 > 已就绪 > 已完成/失败
            const statusOrder = { "preparing": 0, "ready": 1, "completed": 2, "failed": 3 }
            const statusDiff = statusOrder[a.status] - statusOrder[b.status]
            if (statusDiff !== 0) return statusDiff
            
            // 然后按创建时间排序，新的在前
            return b.created_at - a.created_at
        })
        
        // 分类合作料理
        const activeCoopDishes = userCoopDishes.filter(d => d.status === "preparing" || d.status === "ready")
        const completedCoopDishes = userCoopDishes.filter(d => d.status === "completed" || d.status === "failed")
            .slice(0, 3) // 只显示最近3个完成的
        
        // 为活跃的合作料理增加额外信息
        const processedActiveCoopDishes = activeCoopDishes.map(dish => {
            // 状态文本
            let statusText = dish.status === "preparing" ? "准备中" : "已就绪"
            
            // 创建时间
            const createDate = new Date(dish.created_at)
            const createTime = `${createDate.getMonth() + 1}月${createDate.getDate()}日`
            
            // 计算已贡献食材的参与者数量
            const contributedCount = dish.participants.filter(p => p.status === "joined" && p.contributed).length
            
            // 品质百分比
            const qualityPercentage = Math.min(dish.quality_bonus / 100 * 100, 100)
            
            // 用户操作提示
            let userAction = ""
            const isInitiator = dish.initiator_id === userId
            const userParticipant = dish.participants.find(p => p.user_id === userId)
            
            if (userParticipant && !userParticipant.contributed) {
                userAction = "使用 #贡献食材 来贡献你的食材"
            } else if (dish.status === "ready" && isInitiator) {
                userAction = "使用 #完成合作料理 来完成制作"
            }
            
            return {
                ...dish,
                statusText: statusText,
                createTime: createTime,
                contributedCount: contributedCount,
                qualityPercentage: qualityPercentage,
                userAction: userAction,
                initiatorName: `[QQ:${dish.initiator_id}]`
            }
        })
        
        // 为已完成的合作料理增加额外信息
        const processedCompletedCoopDishes = completedCoopDishes.map(dish => {
            const createDate = new Date(dish.created_at)
            const createTime = `${createDate.getMonth() + 1}月${createDate.getDate()}日`
            
            return {
                ...dish,
                createTime: createTime
            }
        })
        
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/`
        await image(e, 'my_coop_cooking', { 
            cssFile, 
            activeCoopDishes: processedActiveCoopDishes,
            completedCoopDishes: processedCompletedCoopDishes,
            userId: userId
        })
    }

    async showIngredientMarket(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        // 获取市场数据
        const marketData = getMarketData()
        
        // 过滤活跃挂单
        const activeListings = marketData.listings.filter(l => l.status === "active")
        
        if (activeListings.length === 0) {
            e.reply("市场上暂时没有任何食材挂单。使用 #上架食材 命令出售你的食材。")
            return
        }
        
        // 处理挂单数据
        const listings = activeListings.map(listing => {
            // 获取卖家名称
            let sellerName = `QQ:${listing.seller_id}`
            
            // 计算总价
            const totalPrice = listing.quantity * listing.price_per_unit
            
            return {
                id: listing.id,
                ingredient_name: listing.ingredient_name,
                seller_id: listing.seller_id,
                seller_name: sellerName,
                quantity: listing.quantity,
                price_per_unit: listing.price_per_unit,
                total_price: totalPrice
            }
        })
        let cssFile = `${_path}/plugins/sims-plugin/resources/`
        await image(e, 'ingredient_market', { 
            cssFile, 
            listings: listings
        })
    }

    async buyMarketItem(e) {
        const userId = e.user_id
        const chefData = getChefData(userId)
        
        if (!chefData) {
            e.reply("你还不是厨师！请先使用 #成为厨师 开始厨师职业。")
            return
        }
        
        
        const match = e.msg.match(/^#购买市场食材\s+(.+?)(?:\s+(\d+))?$/)
        if (!match) {
            e.reply("格式错误！正确格式：#购买市场食材 [挂单ID] [数量]")
            return
        }
        
        const listingId = match[1].trim()
        
        // 获取市场数据
        const marketData = getMarketData()
        const listing = marketData.listings.find(l => l.id === listingId && l.status === "active")
        
        if (!listing) {
            e.reply("未找到该挂单，请检查ID是否正确")
            return
        }
        
        // 检查是否是自己的挂单
        if (listing.seller_id === userId) {
            e.reply("不能购买自己的挂单！如需取回，请使用 #下架食材 命令。")
            return
        }
        
        // 确定购买数量
        const quantity = match[2] ? parseInt(match[2]) : listing.quantity // 如果未指定，则购买全部
        
        if (quantity <= 0) {
            e.reply("购买数量必须大于0！")
            return
        }
        
        if (quantity > listing.quantity) {
            e.reply(`该挂单只有${listing.quantity}个${listing.ingredient_name}，不足${quantity}个！`)
            return
        }
        
        // 计算总价
        const totalPrice = quantity * listing.price_per_unit
        
        // 获取买家数据
        const buyerData = await checkUserData(userId)
        
        // 检查金币是否足够
        if (buyerData.money < totalPrice) {
            e.reply(`购买失败！需要${totalPrice}金币，余额不足。`)
            return
        }
        
        // 获取卖家数据
        const sellerData = await checkUserData(listing.seller_id)
        
        // 执行购买操作
        const result = buyMarketIngredient(listingId, userId, quantity)
        
        if (!result.success) {
            e.reply(`购买失败：${result.message}`)
            return
        }
        
        // 添加食材到买家背包
        addIngredientToBackpack(buyerData, listing.ingredient_id, listing.ingredient_name, quantity)
        
        // 扣除买家金币
        buyerData.money -= totalPrice
        
        // 增加卖家金币
        sellerData.money += totalPrice
        await saveUserData(userId, buyerData)
        await saveUserData(listing.seller_id, sellerData)
        await redis.set(`user:${userId}`, JSON.stringify(buyerData));
        await redis.set(`user:${listing.seller_id}`, JSON.stringify(sellerData));
        e.reply([
            segment.at(userId),
            `\n成功购买食材！\n`,
            `食材：${listing.ingredient_name}\n`,
            `数量：${quantity}\n`,
            `总价：${totalPrice}金币\n`,
            `\n这些食材已添加到你的背包中。`
        ])
        
        // 这里通知卖家
        e.reply([
            segment.at(listing.seller_id),
            `\n你的食材挂单已售出！\n`,
            `食材：${listing.ingredient_name}\n`,
            `数量：${quantity}/${listing.quantity}\n`,
            `获得金币：${totalPrice}`
        ])
    }
}

async function image(e, file, obj) {
    let data = {
        quality: 100,
        tplFile: `./plugins/sims-plugin/resources/HTML/${file}.html`,
        ...obj,
    }
    let img = await puppeteer.screenshot('sims-plugin', {
        ...data,
    })
    e.reply([img])
}
