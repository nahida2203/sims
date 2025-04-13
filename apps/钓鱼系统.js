import { segment } from 'icqq'
import plugin from '../../../lib/plugins/plugin.js'
import { checkUserData, saveUserData } from '../function/function.js'
import { checkCooldown, setCooldown } from '../function/cooldown.js'
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import fs from 'fs'
import path from 'path'

const _path = process.cwd().replace(/\\/g, "/")
const FISH_PATH = './plugins/sims-plugin/data/fish.json'
const EQUIPMENT_PATH = './plugins/sims-plugin/data/fishing_equipment.json'
const FISHING_DATA_DIR = './plugins/sims-plugin/data/fish_data'
const RANKING_PATH = './plugins/sims-plugin/data/fishing_ranking.json'

if (!fs.existsSync(FISHING_DATA_DIR)) {
    fs.mkdirSync(FISHING_DATA_DIR, { recursive: true })
}

if (!fs.existsSync(RANKING_PATH)) {
    fs.writeFileSync(RANKING_PATH, '{}')
}

export class FishingSystem extends plugin {
    constructor() {
        super({
            name: '钓鱼系统',
            dsc: '模拟人生钓鱼系统',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#开始钓鱼$',
                    fnc: 'startFishing'
                },
                {
                    reg: '^#收杆$',
                    fnc: 'pullRod'
                },
                {
                    reg: '^#升级鱼竿$',
                    fnc: 'upgradeRod'
                },
                {
                    reg: '^#升级鱼饵$',
                    fnc: 'upgradeBait'
                },
                {
                    reg: '^#查看鱼篓$',
                    fnc: 'checkBasket'
                },
                {
                    reg: '^#出售鱼获$',
                    fnc: 'sellFish'
                },
                {
                    reg: '^#钓鱼排行$',
                    fnc: 'showRanking'
                },
                {
                    reg: '^#钓鱼商店$',
                    fnc: 'showShop'
                },
                {
                    reg: '^#购买装备.*$',
                    fnc: 'buyEquipment'
                },
                {
                    reg: '^#钓鱼攻略$',
                    fnc: 'showGuide'
                }
            ]
        })
        this.verifyDataFiles()
        this.task = {
            cron: '0 */5 * * * *', // 每5分钟更新一次
            name: 'updateFishBasket',
            fnc: () => this.updateFishBasket()
        }
    }

    async initFishingData(userId) {
        const userDataPath = path.join(FISHING_DATA_DIR, `${userId}.json`)
        let fishingData = null

        try {
            if (fs.existsSync(userDataPath)) {
                fishingData = JSON.parse(fs.readFileSync(userDataPath))
            }
        } catch (e) {
            fishingData = null
        }

        if (!fishingData) {
            fishingData = {
                rod: "rod_01",
                bait: "bait_01",
                basket: "basket_01",
                fishing_status: "idle",
                start_time: 0,
                fish_basket: [],
                total_catch: 0,
                total_weight: 0,
                exp: 0,
                level: 1
            }
            fs.writeFileSync(userDataPath, JSON.stringify(fishingData, null, 2))
        }

        return fishingData
    }

    async saveFishingData(userId, data) {
        const userDataPath = path.join(FISHING_DATA_DIR, `${userId}.json`)
        fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2))
    }

    verifyDataFiles() {
        const files = [RANKING_PATH, EQUIPMENT_PATH, FISH_PATH]
        files.forEach(path => {
            try {
                JSON.parse(fs.readFileSync(path))
            } catch (e) {
                fs.writeFileSync(path, '{}')
            }
        })
    }

    async startFishing(e) {
        const userId = e.user_id.toString() 
        const userData = await checkUserData(userId)
        if (!userData) {
            e.reply("请先创建模拟人生角色！")
            return
        }

        const fishingData = await this.initFishingData(userId)
        
        if (fishingData.fishing_status !== "idle") {
            e.reply("你已经在钓鱼了！")
            return
        }

        const remainingTime = checkCooldown(userId, 'fishing', 'start')
        if (remainingTime > 0) {
            e.reply(`钓鱼太频繁啦，请等待${remainingTime}秒后再试～`)
            return
        }

        // 检查鱼篓是否已满
        const equipment = JSON.parse(fs.readFileSync(EQUIPMENT_PATH))
        const basket = equipment.baskets.find(b => b.id === fishingData.basket)
        if (fishingData.fish_basket.length >= basket.capacity) {
            e.reply("鱼篓已经满了，请先出售鱼获！")
            return
        }

        // 开始钓鱼
        fishingData.fishing_status = "waiting"
        fishingData.start_time = Date.now()
        await this.saveFishingData(userId, fishingData)
        
        setCooldown(userId, 'fishing', 'start')
        const waitTime = Math.floor(Math.random() * 30) + 30 // 30-60秒
        setTimeout(async () => {
            const currentData = await this.initFishingData(userId)
            if (currentData.fishing_status === "waiting") {
                currentData.fishing_status = "ready"
                await this.saveFishingData(userId, currentData)
                e.reply("鱼儿上钩了！快发送 #收杆 ！")
            }
        }, waitTime * 1000)

        e.reply("你开始钓鱼了，耐心等待鱼儿上钩...")
    }

    async pullRod(e) {
        const userId = e.user_id.toString() 
        const fishingData = await this.initFishingData(userId)
        
        if (!fishingData) {
            e.reply("你还没有开始钓鱼！")
            return
        }

        if (fishingData.fishing_status !== "ready") {
            e.reply("现在不是收杆的好时机！")
            return
        }

        // 计算成功率
        const equipment = JSON.parse(fs.readFileSync(EQUIPMENT_PATH))
        const rod = equipment.rods.find(r => r.id === fishingData.rod)
        const bait = equipment.baits.find(b => b.id === fishingData.bait)
        const successRate = (rod.success_rate + bait.attract_rate) / 2

        const isSuccess = Math.random() * 100 <= successRate

        if (isSuccess) {
            // 随机获得鱼
            const fishData = JSON.parse(fs.readFileSync(FISH_PATH))
            const possibleFish = fishData.fishes.filter(f => f.difficulty <= fishingData.level)
            const fish = possibleFish[Math.floor(Math.random() * possibleFish.length)]
            
            // 计算重量
            const weight = fish.weight.min + Math.random() * (fish.weight.max - fish.weight.min)
            
            // 添加到鱼篓
            fishingData.fish_basket.push({
                id: fish.id,
                weight: weight.toFixed(2),
                catchTime: Date.now()
            })

            // 更新统计
            fishingData.total_catch += 1
            fishingData.total_weight += parseFloat(weight)
            fishingData.exp += fish.exp

            // 检查升级
            if (fishingData.exp >= fishingData.level * 100) {
                fishingData.level += 1
                fishingData.exp = 0
                e.reply(`恭喜！你的钓鱼等级提升到${fishingData.level}级！`)
            }

            // 更新排行榜
            const rankingData = JSON.parse(fs.readFileSync(RANKING_PATH))
            if (!rankingData[userId]) {
                rankingData[userId] = {
                    total_catch: 0,
                    total_weight: 0,
                    best_catch: null
                }
            }
            rankingData[userId].total_catch += 1
            rankingData[userId].total_weight += parseFloat(weight)
            if (!rankingData[userId].best_catch || weight > rankingData[userId].best_catch.weight) {
                rankingData[userId].best_catch = {
                    fish_id: fish.id,
                    weight: parseFloat(weight)
                }
            }
            fs.writeFileSync(RANKING_PATH, JSON.stringify(rankingData))

            let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
            await image(e, 'fishing_success', { 
                cssFile, 
                fish,
                weight: weight.toFixed(2)
            })
        } else {
            e.reply("可惜，鱼儿跑掉了...")
        }

        // 重置状态
        fishingData.fishing_status = "idle"
        fishingData.start_time = 0
        await this.saveFishingData(userId, fishingData)
    }

    async upgradeRod(e) {
        const userId = e.user_id
        const fishingData = await this.initFishingData(userId)
        const equipment = JSON.parse(fs.readFileSync(EQUIPMENT_PATH))
        
        const currentRod = equipment.rods.find(r => r.id === fishingData.rod)
        if (!currentRod.upgrade_cost) {
            e.reply("当前鱼竿已经是最高级了！")
            return
        }

        const userData = await checkUserData(userId)
        if (userData.money < currentRod.upgrade_cost) {
            e.reply(`升级费用不足！需要${currentRod.upgrade_cost}金币。`)
            return
        }

        const nextRod = equipment.rods.find(r => r.level === currentRod.level + 1)
        fishingData.rod = nextRod.id
        userData.money -= currentRod.upgrade_cost

        await saveUserData(userId, userData)
        await this.saveFishingData(userId, fishingData)

        e.reply(`成功升级到${nextRod.name}！\n成功率提升到${nextRod.success_rate}%`)
    }

    async upgradeBait(e) {
        const userId = e.user_id
        const fishingData = await this.initFishingData(userId)
        const equipment = JSON.parse(fs.readFileSync(EQUIPMENT_PATH))
        
        const currentBait = equipment.baits.find(b => b.id === fishingData.bait)
        if (!currentBait.upgrade_cost) {
            e.reply("当前鱼饵已经是最高级了！")
            return
        }

        const userData = await checkUserData(userId)
        if (userData.money < currentBait.upgrade_cost) {
            e.reply(`升级费用不足！需要${currentBait.upgrade_cost}金币。`)
            return
        }

        const nextBait = equipment.baits.find(b => b.level === currentBait.level + 1)
        fishingData.bait = nextBait.id
        userData.money -= currentBait.upgrade_cost

        await saveUserData(userId, userData)
        await this.saveFishingData(userId, fishingData)

        e.reply(`成功升级到${nextBait.name}！\n吸引率提升到${nextBait.attract_rate}%`)
    }

    async checkBasket(e) {
        const userId = e.user_id
        const fishingData = await this.initFishingData(userId)
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'fish_basket', { 
            cssFile, 
            basket: fishingData.fish_basket,
            fishData: JSON.parse(fs.readFileSync(FISH_PATH)),
            equipment: JSON.parse(fs.readFileSync(EQUIPMENT_PATH))
        })
    }

    async sellFish(e) {
        const userId = e.user_id
        const fishingData = await this.initFishingData(userId)
        
        if (fishingData.fish_basket.length === 0) {
            e.reply("鱼篓是空的！")
            return
        }

        const fishData = JSON.parse(fs.readFileSync(FISH_PATH))
        let totalPrice = 0
        let spoiledFish = 0

        // 计算每条鱼的价值
        for (let fish of fishingData.fish_basket) {
            const fishInfo = fishData.fishes.find(f => f.id === fish.id)
            const freshness = (Date.now() - fish.catchTime) / 1000 // 计算新鲜度（秒）
            
            if (freshness > fishInfo.freshness) {
                spoiledFish++
                continue
            }

            const freshnessMultiplier = Math.max(0.5, 1 - freshness / fishInfo.freshness)
            const price = fishInfo.basePrice * parseFloat(fish.weight) * freshnessMultiplier
            totalPrice += Math.floor(price)
        }

        // 更新数据
        const userData = await checkUserData(userId)
        userData.money += totalPrice
        fishingData.fish_basket = [] // 清空鱼篓

        await saveUserData(userId, userData)
        await this.saveFishingData(userId, fishingData)

        if (spoiledFish > 0) {
            e.reply(`出售完成！\n获得${totalPrice}金币\n有${spoiledFish}条鱼因为不新鲜被丢弃了。`)
        } else {
            e.reply(`出售完成！\n获得${totalPrice}金币`)
        }
    }

    async showRanking(e) {
        const rankingData = JSON.parse(fs.readFileSync(RANKING_PATH))
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'fishing_ranking', { 
            cssFile, 
            ranking: rankingData,
            fishData: JSON.parse(fs.readFileSync(FISH_PATH))
        })
    }

    async showShop(e) {
        const equipment = JSON.parse(fs.readFileSync(EQUIPMENT_PATH))
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'fishing_shop', { 
            cssFile, 
            equipment
        })
    }

    async buyEquipment(e) {
        const userId = e.user_id
        const match = e.msg.match(/^#购买装备\s*(\w+)$/)
        
        if (!match) {
            e.reply("格式错误！正确格式：#购买装备 装备ID")
            return
        }

        const equipmentId = match[1]
        const equipment = JSON.parse(fs.readFileSync(EQUIPMENT_PATH))
        let item = null

        // 查找装备
        for (let category of ['rods', 'baits', 'baskets']) {
            const found = equipment[category].find(i => i.id === equipmentId)
            if (found) {
                item = found
                break
            }
        }

        if (!item) {
            e.reply("未找到该装备！")
            return
        }

        const userData = await checkUserData(userId)
        if (userData.money < item.price) {
            e.reply(`金币不足！需要${item.price}金币。`)
            return
        }

        // 购买装备
        const fishingData = await this.initFishingData(userId)
        if (equipmentId.startsWith('rod_')) {
            fishingData.rod = equipmentId
        } else if (equipmentId.startsWith('bait_')) {
            fishingData.bait = equipmentId
        } else if (equipmentId.startsWith('basket_')) {
            fishingData.basket = equipmentId
        }

        userData.money -= item.price
        await saveUserData(userId, userData)
        await this.saveFishingData(userId, fishingData)

        e.reply(`成功购买${item.name}！`)
    }

    async updateFishBasket() {
        const files = fs.readdirSync(FISHING_DATA_DIR)
        const fishData = JSON.parse(fs.readFileSync(FISH_PATH))

        for (const file of files) {
            if (file.endsWith('.json')) {
                const userId = file.replace('.json', '')
                const fishingData = await this.initFishingData(userId)
                
                fishingData.fish_basket = fishingData.fish_basket.filter(fish => {
                    const fishInfo = fishData.fishes.find(f => f.id === fish.id)
                    return (Date.now() - fish.catchTime) / 1000 <= fishInfo.freshness
                })

                await this.saveFishingData(userId, fishingData)
            }
        }
    }

    async showNewbieGuide(e) {
        const guide = `# 钓鱼系统新手指南

1. 基础操作
   - 使用 #开始钓鱼 开始钓鱼
   - 等待鱼儿上钩
   - 看到提示后使用 #收杆

2. 装备提升
   - 升级鱼竿提高成功率
   - 升级鱼饵增加上钩率
   - 购买更大的鱼篓

3. 注意事项
   - 及时出售鱼获
   - 注意鱼的新鲜度
   - 合理规划钓鱼时间

发送 #钓鱼攻略 查看完整攻略`

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
