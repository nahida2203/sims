import { segment } from 'icqq'
import plugin from '../../../lib/plugins/plugin.js'
import { checkUserData, saveUserData } from '../function/function.js'
import { checkCooldown, setCooldown } from '../function/cooldown.js'
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import fs from 'fs'
import path from 'path'

const _path = process.cwd().replace(/\\/g, "/")
const RECIPES_PATH = './plugins/sims-plugin/data/recipes.json'
const INGREDIENTS_PATH = './plugins/sims-plugin/data/ingredients.json'
const CHEF_DATA_PATH = './plugins/sims-plugin/data/chefData.json'
if (!fs.existsSync(CHEF_DATA_PATH)) {
    fs.writeFileSync(CHEF_DATA_PATH, '{}')
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

        const chefData = JSON.parse(fs.readFileSync(CHEF_DATA_PATH))
        
        if (chefData[userId]) {
            e.reply("你已经是一名厨师了！")
            return
        }

        // 初始化厨师数据
        chefData[userId] = {
            level: 1,
            exp: 0,
            recipes: ["soup_01"], // 初始解锁食谱
            ingredients: {},
            successDishes: 0,
            totalDishes: 0,
            reputation: 50
        }

        fs.writeFileSync(CHEF_DATA_PATH, JSON.stringify(chefData))
        
        e.reply("恭喜你成为一名厨师！现在可以开始你的烹饪之旅了。")
        this.showNewbieGuide(e)
    }

    async showRecipes(e) {
        const userId = e.user_id
        const chefData = JSON.parse(fs.readFileSync(CHEF_DATA_PATH))
        
        if (!chefData[userId]) {
            e.reply("你还不是厨师！发送 #成为厨师 开始你的烹饪之旅！")
            return
        }

        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        
        await image(e, 'recipes', { 
            cssFile, 
            recipes: recipes.recipes,
            unlockedRecipes: chefData[userId].recipes,
            chefLevel: chefData[userId].level
        })
    }

    async buyIngredients(e) {
        const userId = e.user_id
        const match = e.msg.match(/^#购买食材\s*(\w+)\s*(\d+)$/)
        
        if (!match) {
            e.reply("格式错误！正确格式：#购买食材 食材ID 数量")
            return
        }

        const [_, ingredientId, amount] = match
        const ingredients = JSON.parse(fs.readFileSync(INGREDIENTS_PATH))
        const ingredient = ingredients.ingredients.find(i => i.id === ingredientId)
        
        if (!ingredient) {
            e.reply("未找到该食材！")
            return
        }

        const chefData = JSON.parse(fs.readFileSync(CHEF_DATA_PATH))
        if (!chefData[userId]) {
            e.reply("你还不是厨师！")
            return
        }

        const userData = await checkUserData(userId)
        const totalCost = ingredient.price * parseInt(amount)

        if (userData.money < totalCost) {
            e.reply(`购买失败！需要${totalCost}金币，余额不足。`)
            return
        }

        if (!chefData[userId].ingredients[ingredientId]) {
            chefData[userId].ingredients[ingredientId] = 0
        }
        chefData[userId].ingredients[ingredientId] += parseInt(amount)

        // 扣除金币
        userData.money -= totalCost
        await saveUserData(userId, userData)
        fs.writeFileSync(CHEF_DATA_PATH, JSON.stringify(chefData))

        e.reply(`购买成功！\n${ingredient.name} x${amount}\n共花费${totalCost}金币`)
    }

    async cookDish(e) {
        const userId = e.user_id
        const match = e.msg.match(/^#制作料理\s*(\w+)$/)
        
        if (!match) {
            e.reply("格式错误！正确格式：#制作料理 食谱ID")
            return
        }

        const recipeId = match[1]
        const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH))
        const recipe = recipes.recipes.find(r => r.id === recipeId)
        
        if (!recipe) {
            e.reply("未找到该食谱！")
            return
        }

        const chefData = JSON.parse(fs.readFileSync(CHEF_DATA_PATH))
        if (!chefData[userId]) {
            e.reply("你还不是厨师！")
            return
        }

        if (!chefData[userId].recipes.includes(recipeId)) {
            e.reply("你还没有解锁这个食谱！")
            return
        }

        const remainingTime = checkCooldown(userId, 'chef', 'cook')
        if (remainingTime > 0) {
            e.reply(`厨具还在清洗中，请等待${remainingTime}秒后再制作～`)
            return
        }

        for (let ingredient of recipe.ingredients) {
            const userAmount = chefData[userId].ingredients[ingredient.id] || 0
            if (userAmount < ingredient.amount) {
                e.reply(`食材不足！缺少${ingredient.name} x${ingredient.amount - userAmount}`)
                return
            }
        }

        for (let ingredient of recipe.ingredients) {
            chefData[userId].ingredients[ingredient.id] -= ingredient.amount
        }

        // 计算成功率
        const baseSuccess = recipe.successRate
        const levelBonus = chefData[userId].level * 2
        const finalSuccess = Math.min(95, baseSuccess + levelBonus)
        const isSuccess = Math.random() * 100 <= finalSuccess

        // 更新数据
        chefData[userId].totalDishes++
        if (isSuccess) {
            chefData[userId].successDishes++
            chefData[userId].exp += recipe.exp
            chefData[userId].reputation += 1

            // 检查升级
            if (chefData[userId].exp >= chefData[userId].level * 100) {
                chefData[userId].level += 1
                chefData[userId].exp = 0
                e.reply(`恭喜！你的厨师等级提升到${chefData[userId].level}级！`)
            }

            const userData = await checkUserData(userId)
            userData.money += recipe.basePrice * (1 + chefData[userId].reputation / 100)
            await saveUserData(userId, userData)
        }

        fs.writeFileSync(CHEF_DATA_PATH, JSON.stringify(chefData))
        setCooldown(userId, 'chef', 'cook')

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'cooking_result', { 
            cssFile, 
            recipe,
            isSuccess,
            chefData: chefData[userId]
        })
    }

    async showKitchen(e) {
        const userId = e.user_id
        const chefData = JSON.parse(fs.readFileSync(CHEF_DATA_PATH))
        
        if (!chefData[userId]) {
            e.reply("你还不是厨师！发送 #成为厨师 开始你的烹饪之旅！")
            return
        }

        const ingredients = JSON.parse(fs.readFileSync(INGREDIENTS_PATH))
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        
        await image(e, 'kitchen', { 
            cssFile, 
            chef: chefData[userId],
            ingredients: ingredients.ingredients
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

        const chefData = JSON.parse(fs.readFileSync(CHEF_DATA_PATH))
        if (!chefData[userId]) {
            e.reply("你还不是厨师！")
            return
        }

        if (chefData[userId].recipes.includes(recipeId)) {
            e.reply("你已经会这个食谱了！")
            return
        }

        if (chefData[userId].level < recipe.unlockLevel) {
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
        chefData[userId].recipes.push(recipeId)
        
        await saveUserData(userId, userData)
        fs.writeFileSync(CHEF_DATA_PATH, JSON.stringify(chefData))

        e.reply(`恭喜学会了新食谱：${recipe.name}！\n可以使用 #制作料理 ${recipeId} 来尝试制作。`)
    }

    async showChefLevel(e) {
        const userId = e.user_id
        const chefData = JSON.parse(fs.readFileSync(CHEF_DATA_PATH))
        
        if (!chefData[userId]) {
            e.reply("你还不是厨师！发送 #成为厨师 开始你的烹饪之旅！")
            return
        }

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'chef_level', { 
            cssFile, 
            chef: chefData[userId]
        })
    }

    async showNewbieGuide(e) {
        const guide = `# 厨师新手指南

1. 基础操作
   - 使用 #查看食谱 了解可用食谱
   - 使用 #购买食材 补充原料
   - 使用 #制作料理 开始烹饪

2. 升级技巧
   - 多尝试制作不同料理
   - 成功制作可获得经验
   - 提升等级解锁新食谱

3. 注意事项
   - 确保食材充足
   - 关注成功率
   - 合理使用金币

发送 #厨师攻略 查看完整攻略`

        e.reply(guide)
    }

    async showGuide(e) {
        const guide = fs.readFileSync('./plugins/sims-plugin/模拟人生攻略.md', 'utf8')
        e.reply(guide)
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
