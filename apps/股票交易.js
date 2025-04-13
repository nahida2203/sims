import { segment } from 'icqq'
import plugin from '../../../lib/plugins/plugin.js'
import { checkUserData, saveUserData } from '../function/function.js'
import { checkCooldown, setCooldown } from '../function/cooldown.js'
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import fs from 'fs'
import path from 'path'
import Redis from 'ioredis'

const redis = new Redis()
const _path = process.cwd().replace(/\\/g, "/")
const STOCK_DATA_PATH = './plugins/sims-plugin/data/stockMarket.json'
const initStockData = {
    stocks: [
        { id: "AAPL", name: "苹果科技", price: 150, volatility: 0.05 },
        { id: "GOOG", name: "谷歌科技", price: 2800, volatility: 0.04 },
        { id: "TSLA", name: "特斯拉", price: 900, volatility: 0.08 },
        { id: "BABA", name: "阿里巴巴", price: 120, volatility: 0.06 },
        { id: "TENC", name: "腾讯控股", price: 400, volatility: 0.05 }
    ],
    lastUpdate: Date.now()
}
if (!fs.existsSync(STOCK_DATA_PATH)) {
    fs.writeFileSync(STOCK_DATA_PATH, JSON.stringify(initStockData))
}

export class StockMarket extends plugin {
    constructor() {
        super({
            name: '模拟炒股',
            dsc: '模拟炒股系统',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#股市$',
                    fnc: 'showStockMarket'
                },
                {
                    reg: '^#买入股票.*$',
                    fnc: 'buyStock'
                },
                {
                    reg: '^#卖出股票.*$',
                    fnc: 'sellStock'
                },
                {
                    reg: '^#我的股票$',
                    fnc: 'showMyStocks'
                },
                {
                    reg: '^#股票攻略$',
                    fnc: 'showGuide'
                }
            ]
        })
        this.task = {
            cron: '*/5 * * * *', // 每5分钟更新一次
            name: 'updateStockPrices',
            fnc: () => this.updateStockPrices()
        }
    }

    async showStockMarket(e) {
        const remainingTime = checkCooldown(e.user_id, 'stock', 'view')
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`)
            return
        }

        const stockData = JSON.parse(fs.readFileSync(STOCK_DATA_PATH))
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        let stocks = stockData.stocks
        
        setCooldown(e.user_id, 'stock', 'view')
        
        await image(e, 'stock_market', { cssFile, stocks })
    }

    async buyStock(e) {
        const remainingTime = checkCooldown(e.user_id, 'stock', 'trade')
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`)
            return
        }

        const userId = e.user_id
        const userData = await checkUserData(userId)
        if (!userData) {
            e.reply("请先创建模拟人生角色！")
            return
        }

        const match = e.msg.match(/^#买入股票\s*(\w+)\s*(\d+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#买入股票 股票代码 数量")
            return
        }

        const [_, stockId, amount] = match
        const stockData = JSON.parse(fs.readFileSync(STOCK_DATA_PATH))
        const stock = stockData.stocks.find(s => s.id === stockId)
        
        if (!stock) {
            e.reply("未找到该股票！")
            return
        }

        const totalCost = stock.price * parseInt(amount)
        if (userData.money < totalCost) {
            e.reply("余额不足！")
            return
        }

        // 初始化用户的股票数据
        if (!userData.stocks) {
            userData.stocks = []
        }

        // 更新用户数据
        userData.money -= totalCost
        const existingStock = userData.stocks.find(s => s.id === stockId)
        if (existingStock) {
            existingStock.amount += parseInt(amount)
        } else {
            userData.stocks.push({
                id: stockId,
                name: stock.name,
                amount: parseInt(amount),
                buyPrice: stock.price
            })
        }

        await redis.set(`user:${userId}`, JSON.stringify(userData))
        await saveUserData(userId, userData)
        setCooldown(e.user_id, 'stock', 'trade')
        e.reply(`成功买入${stock.name} ${amount}股，共花费${totalCost}元！`)
        this.showTradeGuide(e)
    }

    async sellStock(e) {
        const remainingTime = checkCooldown(e.user_id, 'stock', 'trade')
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`)
            return
        }

        const userId = e.user_id
        const userData = await checkUserData(userId)
        if (!userData || !userData.stocks) {
            e.reply("你没有任何股票！")
            return
        }

        const match = e.msg.match(/^#卖出股票\s*(\w+)\s*(\d+)$/)
        if (!match) {
            e.reply("格式错误！正确格式：#卖出股票 股票代码 数量")
            return
        }

        const [_, stockId, amount] = match
        const stockData = JSON.parse(fs.readFileSync(STOCK_DATA_PATH))
        const stock = stockData.stocks.find(s => s.id === stockId)
        
        if (!stock) {
            e.reply("未找到该股票！")
            return
        }

        const userStock = userData.stocks.find(s => s.id === stockId)
        if (!userStock || userStock.amount < parseInt(amount)) {
            e.reply("你没有足够的股票！")
            return
        }

        const totalEarning = stock.price * parseInt(amount)
        const profit = totalEarning - (userStock.buyPrice * parseInt(amount))

        // 更新用户数据
        userData.money += totalEarning
        userStock.amount -= parseInt(amount)
        if (userStock.amount === 0) {
            userData.stocks = userData.stocks.filter(s => s.id !== stockId)
        }

        await redis.set(`user:${userId}`, JSON.stringify(userData))
        await saveUserData(userId, userData)
        
        setCooldown(e.user_id, 'stock', 'trade')
        
        e.reply(`成功卖出${stock.name} ${amount}股，获得${totalEarning}元！\n盈亏：${profit > 0 ? '+' : ''}${profit}元`)

        this.showTradeGuide(e)
    }

    async showMyStocks(e) {
        const remainingTime = checkCooldown(e.user_id, 'stock', 'view')
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`)
            return
        }

        const userId = e.user_id
        const userData = await checkUserData(userId)
        if (!userData || !userData.stocks || userData.stocks.length === 0) {
            e.reply("你还没有购买任何股票！")
            return
        }

        const stockData = JSON.parse(fs.readFileSync(STOCK_DATA_PATH))
        const userStocks = userData.stocks.map(userStock => {
            const currentStock = stockData.stocks.find(s => s.id === userStock.id)
            const currentValue = currentStock.price * userStock.amount
            const profit = currentValue - (userStock.buyPrice * userStock.amount)
            return {
                ...userStock,
                currentPrice: currentStock.price,
                currentValue,
                profit
            }
        })

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        
        setCooldown(e.user_id, 'stock', 'view')
        
        await image(e, 'my_stocks', { cssFile, userStocks })
    }

    async updateStockPrices() {
        const stockData = JSON.parse(fs.readFileSync(STOCK_DATA_PATH))
        
        stockData.stocks = stockData.stocks.map(stock => {
            const change = (Math.random() - 0.5) * 2 * stock.volatility
            const newPrice = Math.max(1, stock.price * (1 + change))
            return {
                ...stock,
                price: parseFloat(newPrice.toFixed(2))
            }
        })

        stockData.lastUpdate = Date.now()
        fs.writeFileSync(STOCK_DATA_PATH, JSON.stringify(stockData))
    }

    async showGuide(e) {
        const guide = `# 模拟炒股攻略

## 基本操作
1. 查看股市：发送 #股市
2. 买入股票：发送 #买入股票 股票代码 数量
3. 卖出股票：发送 #卖出股票 股票代码 数量
4. 查看持仓：发送 #我的股票

## 投资技巧
1. 分散投资：不要把所有资金都投入一只股票
2. 观察走势：股票价格每5分钟更新一次
3. 合理止盈止损：设定好自己的盈亏目标
4. 关注股票波动性：不同股票的波动率不同

## 股票列表
- AAPL：苹果科技
- GOOG：谷歌科技
- TSLA：特斯拉
- BABA：阿里巴巴
- TENC：腾讯控股

## 注意事项
1. 股市有风险，投资需谨慎
2. 合理控制投资规模
3. 不要追涨杀跌
4. 保持良好的心态`

        e.reply(guide)
    }

    async showTradeGuide(e) {
        const guide = `# 交易操作提示

1. 可以使用 #我的股票 查看当前持仓
2. 使用 #股市 查看最新行情
3. 合理设置止盈止损点
4. 建议分批建仓和清仓
5. 注意观察市场走势`

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
