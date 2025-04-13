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
} from '../function/function.js';
import { checkCooldown, setCooldown } from '../function/cooldown.js';
import Redis from 'ioredis';

const _path = process.cwd().replace(/\\/g, "/");
const redis = new Redis();
const cooldownConfig = yaml.parse(fs.readFileSync(path.join(process.cwd(), 'plugins/sims-plugin/config/cooldown.yaml'), 'utf8'));
const TAVERN_DATA_DIR = path.join(_path, 'plugins/sims-plugin/data/tavern');
const TAVERN_MARKET_FILE = path.join(TAVERN_DATA_DIR, 'tavern_market.json');
const TAVERN_DRINKS_FILE = path.join(TAVERN_DATA_DIR, 'tavern_drinks.json');
const TAVERN_EVENTS_FILE = path.join(TAVERN_DATA_DIR, 'tavern_events.json');
if (!fs.existsSync(TAVERN_DATA_DIR)) {
    fs.mkdirSync(TAVERN_DATA_DIR, { recursive: true });
}

export class TavernSystem extends plugin {
    constructor() {
        super({
            name: 'TavernSystem',
            dsc: '酒馆经营系统',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#酒馆系统$', fnc: 'showTavernInfo' },
                { reg: '^#创建酒馆.*$', fnc: 'createTavern' },
                { reg: '^#酒馆信息$', fnc: 'showTavernDetails' },
                { reg: '^#酒馆菜单$', fnc: 'showTavernMenu' },
                { reg: '^#酒馆市场$', fnc: 'showTavernMarket' },
                { reg: '^#购买酒馆物资.*$', fnc: 'buyTavernSupplies' },
                { reg: '^#添加饮品.*$', fnc: 'addTavernDrink' },
                { reg: '^#移除饮品.*$', fnc: 'removeTavernDrink' },
                { reg: '^#营业酒馆$', fnc: 'openTavern' },
                { reg: '^#升级酒馆$', fnc: 'upgradeTavern' },
                { reg: '^#酒馆员工$', fnc: 'manageTavernStaff' },
                { reg: '^#雇佣员工.*$', fnc: 'hireStaff' },
                { reg: '^#解雇员工.*$', fnc: 'fireStaff' },
                { reg: '^#酒馆排行$', fnc: 'showTavernRanking' },
                { reg: '^#参观酒馆.*$', fnc: 'visitTavern' },
            ],
        });
        this.task = {
            cron: '0 * * * *',
            name: 'TavernUpdate',
            fnc: () => this.updateTavernMarket(),
        };
    }

   
    async showTavernInfo(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'info');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_system', {
            cssFile,
            commands: [
                { name: "#创建酒馆+名称", desc: "创建自己的酒馆" },
                { name: "#酒馆信息", desc: "查看自己的酒馆详情" },
                { name: "#酒馆菜单", desc: "查看酒馆提供的饮品" },
                { name: "#酒馆市场", desc: "查看可购买的酒馆物资" },
                { name: "#购买酒馆物资+ID", desc: "购买指定的酒馆物资" },
                { name: "#添加饮品+名称+价格+描述", desc: "将饮品添加到酒馆菜单" },
                { name: "#移除饮品+名称", desc: "从菜单中移除饮品" },
                { name: "#营业酒馆", desc: "经营酒馆赚取收益" },
                { name: "#升级酒馆", desc: "提升酒馆等级" },
                { name: "#酒馆员工", desc: "管理酒馆员工" },
                { name: "#雇佣员工+类型", desc: "雇佣新员工" },
                { name: "#解雇员工+ID", desc: "解雇现有员工" },
                { name: "#酒馆排行", desc: "查看酒馆排行榜" },
                { name: "#参观酒馆+玩家ID", desc: "参观其他玩家的酒馆" }
            ]
        });

      
        setCooldown(e.user_id, 'tavern', 'info');
        e.reply(`【酒馆系统攻略】
1. 系统概述：
   - 创建专属酒馆，经营特色饮品
   - 升级酒馆提升容量和吸引力
   - 雇佣员工提高运营效率
   - 定期营业获取收益
2. 新手入门：
   - 先用"#创建酒馆+名称"创建自己的酒馆
   - 在市场购买基础物资
   - 添加几款特色饮品到菜单
   - 每天使用"#营业酒馆"指令获取收益
3. 进阶玩法：
   - 根据市场需求调整饮品种类和价格
   - 关注特殊活动增加酒馆声望
   - 雇佣合适员工提升效率
   - 定期升级扩大酒馆规模`);
    }

    async createTavern(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'create');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 检查用户是否已有酒馆
        if (userData.tavern) {
            e.reply("你已经拥有一家酒馆了！");
            return;
        }

        // 检查用户资金是否足够
        const initialCost = 5000;
        if (userData.money < initialCost) {
            e.reply(`创建酒馆需要${initialCost}元资金，你的资金不足！`);
            return;
        }

        // 获取酒馆名称
        const tavernName = e.msg.replace('#创建酒馆', '').trim();
        if (!tavernName) {
            e.reply("请提供酒馆名称！格式：#创建酒馆 [名称]");
            return;
        }

        // 创建酒馆数据
        userData.money -= initialCost;
        userData.tavern = {
            name: tavernName,
            level: 1,
            popularity: 10,
            capacity: 20,
            cleanliness: 100,
            atmosphere: 50,
            drinks: [],
            supplies: {
                beer: 20,
                wine: 10,
                spirits: 5,
                food: 15,
                decorations: 5
            },
            staff: [],
            dailyIncome: 0,
            totalIncome: 0,
            lastOperated: null,
            createdAt: new Date().toISOString(),
            reputation: 3,
            customerSatisfaction: 80,
            specialEvents: []
        };

        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        setCooldown(e.user_id, 'tavern', 'create');

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_created', {
            cssFile,
            tavern: userData.tavern,
            cost: initialCost
        });

        e.reply(`【新手酒馆攻略】
1. 恭喜你成为酒馆老板！接下来：
   - 使用"#酒馆市场"查看并购买物资
   - 使用"#添加饮品"添加特色饮品到菜单
   - 使用"#营业酒馆"开始赚钱
2. 经营技巧：
   - 保持足够的物资库存
   - 定期清洁以维持良好环境
   - 根据客户喜好调整饮品种类
   - 雇佣员工提高运营效率
3. 酒馆升级：
   - 提升酒馆等级可增加容量
   - 装饰提升氛围，吸引更多顾客
   - 名气提升可提高饮品定价`);
    }
    async showTavernDetails(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'details');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 检查用户是否有酒馆
        if (!userData.tavern) {
            e.reply("你还没有酒馆！使用 #创建酒馆 [名称] 来创建一家。");
            return;
        }

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_details', {
            cssFile,
            tavern: userData.tavern,
            user: {
                name: userData.name,
                money: userData.money,
                gender: userData.gender
            }
        });

        setCooldown(e.user_id, 'tavern', 'details');

        e.reply(`【酒馆详情攻略】
1. 关键指标解析：
   - 人气：影响每日顾客数量
   - 容量：决定最大接待能力
   - 清洁度：影响顾客满意度
   - 氛围：影响顾客消费意愿
   - 声誉：影响饮品定价能力
2. 提升建议：
   - 低人气：添加特色饮品，提升装饰
   - 低清洁度：增加清洁次数
   - 低氛围：购买装饰物品
   - 低声誉：提高饮品质量，举办活动
3. 经营周期：
   - 定期检查物资库存
   - 根据客户反馈调整菜单
   - 保持酒馆环境舒适`);
    }

    async showTavernMenu(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'menu');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 检查用户是否有酒馆
        if (!userData.tavern) {
            e.reply("你还没有酒馆！使用 #创建酒馆 [名称] 来创建一家。");
            return;
        }

        // 菜单是否为空
        if (!userData.tavern.drinks || userData.tavern.drinks.length === 0) {
            e.reply("你的酒馆菜单还是空的！使用 #添加饮品 [名称] [价格] [描述] 来添加饮品。");
            return;
        }

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_menu', {
            cssFile,
            tavern: userData.tavern,
            tavernName: userData.tavern.name
        });
        setCooldown(e.user_id, 'tavern', 'menu');

        e.reply(`【酒馆菜单攻略】
1. 菜单设计技巧：
   - 提供多种类型饮品以满足不同需求
   - 设置合理价格，考虑成本和顾客接受度
   - 添加特色饮品提高酒馆辨识度
2. 饮品类别建议：
   - 基础啤酒：价格亲民，吸引普通顾客
   - 精酿啤酒：中等价格，提供特色口味
   - 葡萄酒：中高价格，适合追求品质顾客
   - 烈酒：高价格，提高单次消费金额
   - 特调鸡尾酒：高价格，提升酒馆特色
3. 菜单优化：
   - 定期调整菜单以适应市场需求
   - 移除销量低的饮品
   - 根据季节添加应景饮品`);
    }

    async showTavernMarket(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'market');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 检查用户是否有酒馆
        if (!userData.tavern) {
            e.reply("你还没有酒馆！使用 #创建酒馆 [名称] 来创建一家。");
            return;
        }

        // 获取市场数据
        const marketData = await this.loadTavernMarket();
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_market', {
            cssFile,
            market: marketData,
            userMoney: userData.money
        });

        setCooldown(e.user_id, 'tavern', 'market');

        e.reply(`【酒馆市场攻略】
1. 物资购买指南：
   - 啤酒：基础饮品，需求量大
   - 葡萄酒：中高端饮品，利润较高
   - 烈酒：高端饮品，消耗慢利润高
   - 食材：提供小吃增加顾客停留时间
   - 装饰：提升酒馆氛围和吸引力
2. 进货策略：
   - 关注市场价格波动，低价时多囤货
   - 根据酒馆规模合理控制库存
   - 优先保证热销饮品的原料充足
3. 特殊物资：
   - 限时供应的稀有物资可大幅提升酒馆特色
   - 季节性物资可用于制作应景饮品
   - 高级装饰可显著提升酒馆氛围`);
    }

    async buyTavernSupplies(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'buy');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 检查用户是否有酒馆
        if (!userData.tavern) {
            e.reply("你还没有酒馆！使用 #创建酒馆 [名称] 来创建一家。");
            return;
        }

        const cmdParams = e.msg.replace('#购买酒馆物资', '').trim().split(' ');
        if (cmdParams.length < 1) {
            e.reply("请指定要购买的物资ID！格式：#购买酒馆物资 [物资ID] [数量(可选)]");
            return;
        }

        const supplyId = cmdParams[0];
        const quantity = cmdParams.length > 1 ? parseInt(cmdParams[1]) : 1;

        if (isNaN(quantity) || quantity <= 0) {
            e.reply("购买数量必须为正整数！");
            return;
        }

        const marketData = await this.loadTavernMarket();
        const supply = marketData.supplies.find(s => s.id === supplyId);

        if (!supply) {
            e.reply("未找到该物资，请检查ID是否正确！");
            return;
        }

        if (supply.stock < quantity) {
            e.reply(`市场库存不足！当前仅有${supply.stock}份该物资。`);
            return;
        }

        // 计算总价
        const totalPrice = supply.price * quantity;
        if (userData.money < totalPrice) {
            e.reply(`你的资金不足！购买${quantity}份${supply.name}需要${totalPrice}元。`);
            return;
        }

        // 更新用户数据
        userData.money -= totalPrice;
        
        // 更新酒馆物资库存
        if (!userData.tavern.supplies[supply.type]) {
            userData.tavern.supplies[supply.type] = 0;
        }
        userData.tavern.supplies[supply.type] += quantity;

        // 更新市场数据
        supply.stock -= quantity;
        await this.saveTavernMarket(marketData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        setCooldown(e.user_id, 'tavern', 'buy');

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_purchase', {
            cssFile,
            supply,
            quantity,
            totalPrice,
            tavern: userData.tavern
        });

        e.reply(`【物资购买攻略】
1. 物资用途：
   - ${supply.name}(${supply.type}类)：${supply.desc}
   - 不同类型物资影响酒馆不同方面
2. 购买建议：
   - 关注价格波动，低价时多囤货
   - 保持适量库存，避免物资不足
   - 特殊物资出现时优先考虑购买
3. 库存管理：
   - 定期检查物资消耗情况
   - 根据顾客需求调整采购计划
   - 合理分配资金，均衡发展酒馆`);
    }

    async addTavernDrink(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'addDrink');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 检查用户是否有酒馆
        if (!userData.tavern) {
            e.reply("你还没有酒馆！使用 #创建酒馆 [名称] 来创建一家。");
            return;
        }
        const cmdParams = e.msg.replace('#添加饮品', '').trim().split(/\s+/);
        if (cmdParams.length < 4) {
            e.reply("参数不足！格式：#添加饮品 [名称] [价格] [原料类型(beer/wine/spirits)] [描述]");
            return;
        }

        const drinkName = cmdParams[0];
        const drinkPrice = parseInt(cmdParams[1]);
        const ingredientType = cmdParams[2].toLowerCase();
        const drinkDesc = cmdParams.slice(3).join(' ');

        if (isNaN(drinkPrice) || drinkPrice <= 0) {
            e.reply("价格必须为正整数！");
            return;
        }

        const validTypes = ['beer', 'wine', 'spirits'];
        if (!validTypes.includes(ingredientType)) {
            e.reply(`无效的原料类型！可用类型: ${validTypes.join(', ')}`);
            return;
        }

        if (!userData.tavern.supplies[ingredientType] || userData.tavern.supplies[ingredientType] < 1) {
            e.reply(`你的酒馆缺少${ingredientType}类原料，请先购买物资！`);
            return;
        }

        if (!userData.tavern.drinks) {
            userData.tavern.drinks = [];
        }
        
        if (userData.tavern.drinks.some(drink => drink.name === drinkName)) {
            e.reply("菜单中已有同名饮品！请使用其他名称。");
            return;
        }

        const maxDrinks = 10 + (userData.tavern.level - 1) * 2; // 基础10种，每升一级+2
        if (userData.tavern.drinks.length >= maxDrinks) {
            e.reply(`菜单已满！当前等级最多提供${maxDrinks}种饮品。升级酒馆可增加菜单容量。`);
            return;
        }

        const newDrink = {
            id: `custom_${Date.now().toString(36)}`,
            name: drinkName,
            price: drinkPrice,
            basePrice: drinkPrice,
            ingredientType: ingredientType,
            description: drinkDesc,
            popularity: 5, // 初始中等人气
            sales: 0,
            createdAt: new Date().toISOString()
        };

        // 添加到菜单
        userData.tavern.drinks.push(newDrink);

        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        setCooldown(e.user_id, 'tavern', 'addDrink');

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_add_drink', {
            cssFile,
            drink: newDrink,
            tavernName: userData.tavern.name
        });

        e.reply(`【饮品添加攻略】
1. 饮品设计技巧：
   - 饮品名称要有特色，易于记忆
   - 价格要考虑成本和顾客接受度
   - 描述要生动，突出特色和卖点
2. 不同饮品类型特点：
   - 啤酒类：价格亲民，销量大，利润小
   - 葡萄酒类：中档价格，适合搭配食物
   - 烈酒类：高价，消耗慢，利润高
3. 菜单管理：
   - 定期关注各饮品销量和顾客反馈
   - 移除销量低的饮品，增加新品种
   - 根据酒馆客户群体调整饮品组合`);
    }

    async removeTavernDrink(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'removeDrink');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 检查用户是否有酒馆
        if (!userData.tavern) {
            e.reply("你还没有酒馆！使用 #创建酒馆 [名称] 来创建一家。");
            return;
        }

        // 检查酒馆是否有饮品
        if (!userData.tavern.drinks || userData.tavern.drinks.length === 0) {
            e.reply("你的酒馆菜单是空的，没有饮品可以移除！");
            return;
        }

        // 解析命令参数
        const drinkName = e.msg.replace('#移除饮品', '').trim();
        if (!drinkName) {
            e.reply("请指定要移除的饮品名称！格式：#移除饮品 [名称]");
            return;
        }

        // 查找饮品
        const drinkIndex = userData.tavern.drinks.findIndex(drink => drink.name === drinkName);
        if (drinkIndex === -1) {
            e.reply(`未找到名为"${drinkName}"的饮品！请检查拼写或使用#酒馆菜单查看现有饮品。`);
            return;
        }

        // 保存要移除的饮品信息用于显示
        const removedDrink = userData.tavern.drinks[drinkIndex];

        // 移除饮品
        userData.tavern.drinks.splice(drinkIndex, 1);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        // 设置冷却
        setCooldown(e.user_id, 'tavern', 'removeDrink');
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_remove_drink', {
            cssFile,
            drink: removedDrink,
            tavernName: userData.tavern.name,
            remainingDrinks: userData.tavern.drinks.length
        });

        e.reply(`【饮品移除攻略】
1. 移除时机：
   - 销量长期不佳的饮品应及时移除
   - 季节性饮品结束时应更换
   - 随着酒馆调整风格可更新菜单
2. 菜单优化：
   - 保持菜单精简，避免选择困难
   - 确保各类饮品都有覆盖
   - 突出特色和高利润饮品
3. 替换建议：
   - 移除后可添加新饮品填补空缺
   - 根据顾客反馈调整新饮品类型
   - 考虑提供限时特饮增加新鲜感`);
    }

    async openTavern(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'operate');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 检查用户是否有酒馆
        if (!userData.tavern) {
            e.reply("你还没有酒馆！使用 #创建酒馆 [名称] 来创建一家。");
            return;
        }

        // 检查酒馆是否有饮品
        if (!userData.tavern.drinks || userData.tavern.drinks.length === 0) {
            e.reply("你的酒馆菜单是空的！使用 #添加饮品 命令添加至少一种饮品才能营业。");
            return;
        }

        // 检查物资是否充足
        let insufficientSupplies = [];
        const requiredSupplies = ['beer', 'wine', 'spirits'];
        
        for (const type of requiredSupplies) {
            if (!userData.tavern.supplies[type] || userData.tavern.supplies[type] < 2) {
                insufficientSupplies.push(type);
            }
        }
        
        if (insufficientSupplies.length > 0) {
            e.reply(`酒馆缺少必要的物资：${insufficientSupplies.join(', ')}，请前往酒馆市场购买！`);
            return;
        }

        // 检查上次营业时间，限制一天只能营业一次
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastOperatedDate = userData.tavern.lastOperated ? new Date(userData.tavern.lastOperated).toISOString().split('T')[0] : null;
        
        if (lastOperatedDate === today) {
            e.reply("今天已经营业过了，请明天再来！");
            return;
        }

        // 计算客流量
        const baseCustomers = Math.floor(userData.tavern.popularity * (0.9 + Math.random() * 0.2));
        // 受容量限制
        const maxCustomers = userData.tavern.capacity;
        const customers = Math.min(baseCustomers, maxCustomers);
        
        // 计算每位顾客的平均消费
        const avgConsumption = this.calculateAverageConsumption(userData.tavern);
        
        // 计算总收入
        let income = Math.floor(customers * avgConsumption);
        
        // 计算员工工资
        const staffSalary = this.calculateStaffSalary(userData.tavern.staff);
        
        // 最终利润
        const profit = income - staffSalary;

        // 处理可能发生的随机事件
        const event = await this.getRandomTavernEvent();
        const eventResult = await this.processTavernEvent(userData.tavern, event);
        
        // 统计每种饮品的销售情况
        const drinkSales = this.calculateDrinkSales(userData.tavern.drinks, customers);
        
        // 消耗物资
        this.consumeSupplies(userData.tavern.supplies, drinkSales);
        
        // 更新酒馆数据
        userData.tavern.lastOperated = now.toISOString();
        userData.tavern.dailyIncome = profit;
        userData.tavern.totalIncome += profit;
        
        // 更新饮品销量数据
        this.updateDrinkPopularity(userData.tavern.drinks, drinkSales);
        
        // 更新酒馆清洁度和声誉
        userData.tavern.cleanliness = Math.max(0, userData.tavern.cleanliness - 15);
        
        // 清洁度低会影响声誉
        if (userData.tavern.cleanliness < 30) {
            userData.tavern.reputation = Math.max(1, userData.tavern.reputation - 1);
        }
        
        // 添加事件影响
        if (eventResult) {
            userData.tavern.reputation += (eventResult.reputation || 0);
            income += (eventResult.income || 0);
            userData.tavern.customerSatisfaction += (eventResult.customerSatisfaction || 0);
            
            // 确保数值在合理范围内
            userData.tavern.reputation = Math.max(1, Math.min(10, userData.tavern.reputation));
            userData.tavern.customerSatisfaction = Math.max(0, Math.min(100, userData.tavern.customerSatisfaction));
        }
        
        userData.money += profit;
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        
        setCooldown(e.user_id, 'tavern', 'operate');
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_operation', {
            cssFile,
            tavern: userData.tavern,
            operationResult: {
                customers,
                avgConsumption,
                income,
                staffSalary,
                profit,
                drinkSales,
                event: eventResult ? event : null,
                eventResult
            }
        });
        
        e.reply(`【酒馆经营攻略】
1. 营业数据分析：
   - 客流量${customers}人（最大容量${maxCustomers}人）
   - 人均消费${avgConsumption.toFixed(2)}元
   - 总收入${income}元，员工支出${staffSalary}元
   - 净利润${profit}元
2. 提升建议：
   - ${customers >= maxCustomers * 0.9 ? '客流量接近上限，考虑升级酒馆扩大容量' : '提高人气可增加客流量'}
   - ${userData.tavern.cleanliness < 50 ? '清洁度较低，需及时清理环境' : '保持良好的清洁度可提高顾客满意度'}
   - ${userData.tavern.reputation < 5 ? '提高酒馆声誉可增加客单价' : '声誉良好，可适当提高饮品价格'}
3. 物资管理：
   - 定期检查物资库存，确保不会中断营业
   - 关注畅销饮品对应原料的消耗速度
   - 物资价格波动时及时调整采购策略`);
    }

    calculateAverageConsumption(tavern) {
        let baseConsumption = 30;
        baseConsumption += (tavern.level - 1) * 5;
        baseConsumption *= (0.8 + tavern.reputation * 0.04);
        baseConsumption *= (0.8 + tavern.atmosphere / 250);
        baseConsumption *= (0.8 + tavern.cleanliness / 500);
        baseConsumption *= (0.9 + Math.random() * 0.2);
        return baseConsumption;
    }
    calculateStaffSalary(staff) {
        if (!staff || staff.length === 0) return 0;
        
        return staff.reduce((total, employee) => total + employee.salary, 0);
    }

   
    calculateDrinkSales(drinks, customers) {
        const sales = {};
        const totalPopularity = drinks.reduce((sum, drink) => sum + drink.popularity, 0);
        drinks.forEach(drink => {
            const drinkCustomers = Math.floor(customers * (drink.popularity / totalPopularity));
            const purchaseRate = 0.7 + Math.random() * 0.3;
            const quantity = Math.floor(drinkCustomers * purchaseRate);
            
            sales[drink.id] = {
                name: drink.name,
                quantity,
                revenue: quantity * drink.price,
                ingredientType: drink.ingredientType
            };
        });
        
        return sales;
    }

    consumeSupplies(supplies, drinkSales) {
        const consumption = {
            beer: 0,
            wine: 0,
            spirits: 0
        };
        
        Object.values(drinkSales).forEach(sale => {
            consumption[sale.ingredientType] += Math.ceil(sale.quantity / 10);
        });
        
        for (const [type, amount] of Object.entries(consumption)) {
            supplies[type] = Math.max(0, supplies[type] - amount);
        }
    }

    // 辅助函数：更新饮品人气
    updateDrinkPopularity(drinks, drinkSales) {
        drinks.forEach(drink => {
            const sale = drinkSales[drink.id];
            if (sale) {
                drink.sales = (drink.sales || 0) + sale.quantity;
                const popularityChange = sale.quantity > 10 ? 0.5 : (sale.quantity > 5 ? 0.2 : -0.1);
                drink.popularity = Math.max(1, Math.min(10, drink.popularity + popularityChange));
            } else {
                drink.popularity = Math.max(1, drink.popularity - 0.3);
            }
        });
    }

    async getRandomTavernEvent() {
        const eventsData = await this.loadTavernEvents();
        const events = eventsData.events;
        
        // 根据概率筛选可能发生的事件
        const possibleEvents = events.filter(() => Math.random() < 0.3); // 30%概率触发事件
        
        if (possibleEvents.length === 0) return null;
        
        // 随机选择一个事件
        return possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
    }

    async processTavernEvent(tavern, event) {
        if (!event) return null;
        
        // 应用事件的基础影响
        const result = {
            eventId: event.id,
            eventName: event.name,
            description: event.description,
            income: 0,
            reputation: 0,
            customerSatisfaction: 0
        };
        
        // 随机选择一个选项作为玩家的反应
        const choice = event.choices[Math.floor(Math.random() * event.choices.length)];
        result.choice = choice.text;
        
        // 应用选择的结果
        if (choice.outcome.money) result.income += choice.outcome.money;
        if (choice.outcome.reputation) result.reputation += choice.outcome.reputation;
        if (choice.outcome.customerSatisfaction) result.customerSatisfaction += choice.outcome.customerSatisfaction;
        
        return result;
    }

    async upgradeTavern(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'upgrade');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 检查用户是否有酒馆
        if (!userData.tavern) {
            e.reply("你还没有酒馆！使用 #创建酒馆 [名称] 来创建一家。");
            return;
        }

        // 计算升级费用
        const currentLevel = userData.tavern.level;
        const maxLevel = 10;
        
        // 检查是否已达到最高等级
        if (currentLevel >= maxLevel) {
            e.reply(`你的酒馆已经达到最高等级(${maxLevel})了！`);
            return;
        }
        
        // 计算升级费用：基础5000，每级递增
        const upgradeCost = 5000 * Math.pow(2, currentLevel - 1);
        
        // 检查资金是否足够
        if (userData.money < upgradeCost) {
            e.reply(`升级酒馆到${currentLevel + 1}级需要${upgradeCost}元，你的资金不足！`);
            return;
        }

        // 获取升级前的数据用于比较
        const prevCapacity = userData.tavern.capacity;
        
        // 更新用户数据
        userData.money -= upgradeCost;
        userData.tavern.level += 1;
        
        // 提升酒馆各项属性
        userData.tavern.capacity += 10; // 每升一级增加10容量
        userData.tavern.atmosphere += 5; // 每升一级提升5点氛围
        userData.tavern.reputation = Math.min(10, userData.tavern.reputation + 1); // 升级提升声誉，最高10点
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'tavern', 'upgrade');
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_upgrade', {
            cssFile,
            tavern: userData.tavern,
            upgradeCost,
            prevLevel: currentLevel,
            prevCapacity,
            capacityIncrease: userData.tavern.capacity - prevCapacity
        });

        e.reply(`【酒馆升级攻略】
1. 升级收益：
   - 容量增加：从${prevCapacity}人提升到${userData.tavern.capacity}人
   - 酒馆氛围提升5点
   - 酒馆声誉提升1点
   - 菜单容量增加2个位置
2. 升级建议：
   - 酒馆客流量接近容量上限时优先考虑升级
   - 资金充足时尽早升级以提高收益空间
   - 升级同时注意补充物资和更新菜单
3. 等级规划：
   - 1-3级：专注增加基础饮品和积累资金
   - 4-6级：提高饮品多样性，开始雇佣员工
   - 7-10级：打造高端酒馆，提供特色体验`);
    }

    async manageTavernStaff(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'staffView');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 检查用户是否有酒馆
        if (!userData.tavern) {
            e.reply("你还没有酒馆！使用 #创建酒馆 [名称] 来创建一家。");
            return;
        }

        // 确保员工数组存在
        if (!userData.tavern.staff) {
            userData.tavern.staff = [];
        }

        // 获取可雇佣的员工列表
        const availableStaff = this.getAvailableStaffTypes();

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_staff', {
            cssFile,
            tavern: userData.tavern,
            currentStaff: userData.tavern.staff,
            availableStaff,
            userMoney: userData.money
        });

        setCooldown(e.user_id, 'tavern', 'staffView');
        e.reply(`【员工管理攻略】
1. 员工类型与作用：
   - 酒保：提高饮品制作效率，降低原料消耗
   - 服务员：提高顾客满意度和消费意愿
   - 清洁工：维持酒馆清洁度，减缓环境恶化
   - 保安：减少不良事件发生，提高顾客安全感
   - 驻唱歌手：大幅提升酒馆氛围和吸引力
2. 雇佣策略：
   - 低级酒馆优先雇佣酒保和服务员
   - 中级酒馆需要清洁工维持环境
   - 高级酒馆添加特色员工提升体验
3. 薪资管理：
   - 员工工资会从每日营业收入中扣除
   - 合理控制员工数量避免支出过高
   - 选择性价比高的员工类型优先雇佣`);
    }

    async hireStaff(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'staffHire');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 检查用户是否有酒馆
        if (!userData.tavern) {
            e.reply("你还没有酒馆！使用 #创建酒馆 [名称] 来创建一家。");
            return;
        }

        // 确保员工数组存在
        if (!userData.tavern.staff) {
            userData.tavern.staff = [];
        }

        // 获取员工类型
        const staffType = e.msg.replace('#雇佣员工', '').trim().toLowerCase();
        if (!staffType) {
            e.reply("请指定要雇佣的员工类型！格式：#雇佣员工 [类型]");
            return;
        }

        // 获取可雇佣的员工列表
        const availableStaff = this.getAvailableStaffTypes();
        const staffInfo = availableStaff.find(s => s.type.toLowerCase() === staffType);

        if (!staffInfo) {
            e.reply(`未找到员工类型: ${staffType}！可用类型: ${availableStaff.map(s => s.type).join(', ')}`);
            return;
        }

        // 检查酒馆等级要求
        if (userData.tavern.level < staffInfo.levelRequirement) {
            e.reply(`雇佣${staffInfo.name}需要酒馆等级达到${staffInfo.levelRequirement}级！当前等级: ${userData.tavern.level}级`);
            return;
        }

        // 检查是否已有相同类型的员工
        const existingStaff = userData.tavern.staff.find(s => s.type === staffInfo.type);
        if (existingStaff) {
            e.reply(`你已经雇佣了${staffInfo.name}(${existingStaff.name})！同类型员工只能雇佣一名。`);
            return;
        }

        // 检查员工数量限制
        const maxStaff = Math.min(5, userData.tavern.level); // 最多5名员工，且不超过酒馆等级
        if (userData.tavern.staff.length >= maxStaff) {
            e.reply(`酒馆员工已达上限(${maxStaff}名)！升级酒馆可增加员工上限。`);
            return;
        }

        // 检查资金是否足够
        const hireCost = staffInfo.salary * 5; // 雇佣费用为5天工资
        if (userData.money < hireCost) {
            e.reply(`雇佣${staffInfo.name}需要${hireCost}元(包含5天工资)，你的资金不足！`);
            return;
        }

        const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗'];
        const names = ['明', '芳', '军', '华', '超', '燕', '娜', '强', '玲', '杰', '丽', '涛', '静', '磊', '敏', '刚', '霞', '浩', '颖', '鹏'];
        const randomName = `${surnames[Math.floor(Math.random() * surnames.length)]}${names[Math.floor(Math.random() * names.length)]}`;
        const newStaff = {
            id: `staff_${Date.now().toString(36)}`,
            name: randomName,
            type: staffInfo.type,
            salary: staffInfo.salary,
            skills: [...staffInfo.skills],
            hiredAt: new Date().toISOString(),
            level: 1,
            experience: 0
        };

        userData.money -= hireCost;
        userData.tavern.staff.push(newStaff);

        // 应用员工技能加成
        this.applyStaffBonuses(userData.tavern);

        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'tavern', 'staffHire');
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_hire_staff', {
            cssFile,
            tavern: userData.tavern,
            newStaff,
            hireCost
        });

        e.reply(`【雇佣员工攻略】
1. ${staffInfo.name}的作用：
   ${staffInfo.description}
2. 相关技能：
   ${staffInfo.skills.map(skill => `- ${skill.name}: ${skill.description}`).join('\n   ')}
3. 管理建议：
   - 员工每天工作会增加经验，经验满后可升级
   - 升级后技能效果提升，但薪资也会增加
   - 合理安排员工数量，控制人力成本`);
    }

    async fireStaff(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'staffFire');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 检查用户是否有酒馆
        if (!userData.tavern) {
            e.reply("你还没有酒馆！使用 #创建酒馆 [名称] 来创建一家。");
            return;
        }

        // 确保员工数组存在
        if (!userData.tavern.staff) {
            userData.tavern.staff = [];
        }

        if (userData.tavern.staff.length === 0) {
            e.reply("你的酒馆还没有雇佣任何员工！");
            return;
        }

        // 获取员工ID
        const staffId = e.msg.replace('#解雇员工', '').trim();
        if (!staffId) {
            e.reply("请指定要解雇的员工ID！格式：#解雇员工 [ID]。可通过 #酒馆员工 查看员工ID。");
            return;
        }

        // 查找员工
        const staffIndex = userData.tavern.staff.findIndex(s => s.id === staffId);
        if (staffIndex === -1) {
            e.reply(`未找到ID为${staffId}的员工！请使用 #酒馆员工 查看正确的员工ID。`);
            return;
        }

        // 保存要解雇的员工信息用于显示
        const firedStaff = userData.tavern.staff[staffIndex];

        // 解雇员工
        userData.tavern.staff.splice(staffIndex, 1);

        // 重新应用员工技能加成
        this.applyStaffBonuses(userData.tavern);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        setCooldown(e.user_id, 'tavern', 'staffFire');

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_fire_staff', {
            cssFile,
            tavern: userData.tavern,
            firedStaff
        });
        e.reply(`【解雇员工攻略】
1. 解雇影响：
   - 失去${firedStaff.name}的技能加成
   - 节省每日${firedStaff.salary}元工资开支
   - 可雇佣新员工填补空缺
2. 合理调整：
   - 定期评估员工绩效和薪资性价比
   - 根据酒馆经营重点调整员工配置
   - 高级酒馆应保持完整的员工团队
3. 后续建议：
   - 考虑雇佣其他类型员工补充技能
   - 优先雇佣适合当前经营阶段的员工
   - 控制人力成本与收益平衡`);
    }

    getAvailableStaffTypes() {
        return [
            {
                type: "bartender",
                name: "酒保",
                salary: 100,
                levelRequirement: 1,
                description: "专业调酒师，提高饮品制作效率，降低原料消耗",
                skills: [
                    { name: "调酒技巧", description: "制作饮品时减少10%原料消耗" },
                    { name: "花式调酒", description: "提高饮品价值5%" }
                ]
            },
            {
                type: "waiter",
                name: "服务员",
                salary: 80,
                levelRequirement: 1,
                description: "热情的服务员，提高顾客满意度和消费意愿",
                skills: [
                    { name: "优质服务", description: "提高顾客满意度5%" },
                    { name: "推销技巧", description: "增加顾客平均消费3%" }
                ]
            },
            {
                type: "cleaner",
                name: "清洁工",
                salary: 60,
                levelRequirement: 2,
                description: "勤劳的清洁工，维持酒馆清洁度，减缓环境恶化",
                skills: [
                    { name: "环境维护", description: "每天减少清洁度下降50%" },
                    { name: "整理摆放", description: "提高酒馆氛围2点" }
                ]
            },
            {
                type: "security",
                name: "保安",
                salary: 120,
                levelRequirement: 3,
                description: "魁梧的保安，减少不良事件发生，提高顾客安全感",
                skills: [
                    { name: "安全管理", description: "降低不良事件发生概率30%" },
                    { name: "秩序维护", description: "减少事件负面影响20%" }
                ]
            },
            {
                type: "musician",
                name: "驻唱歌手",
                salary: 200,
                levelRequirement: 4,
                description: "有才华的驻唱歌手，大幅提升酒馆氛围和吸引力",
                skills: [
                    { name: "音乐表演", description: "提高酒馆氛围10点" },
                    { name: "顾客互动", description: "提高顾客满意度10%" }
                ]
            }
        ];
    }

    applyStaffBonuses(tavern) {
        tavern.staffBonuses = {
            supplySaving: 0, // 原料节省比例
            drinkValueBonus: 0, // 饮品价值提升
            customerSatisfactionBonus: 0, // 顾客满意度提升
            averageConsumptionBonus: 0, // 平均消费提升
            cleanlinessDecayReduction: 0, // 清洁度下降减缓
            atmosphereBonus: 0, // 氛围提升
            badEventReduction: 0, // 不良事件降低
            eventNegativeEffectReduction: 0 // 负面事件影响降低
        };

        // 没有员工就返回
        if (!tavern.staff || tavern.staff.length === 0) {
            return;
        }

        // 计算各项加成
        tavern.staff.forEach(staff => {
            const level = staff.level || 1;
            const levelMultiplier = 1 + (level - 1) * 0.2; // 每级提升20%效果

            switch (staff.type) {
                case "bartender":
                    tavern.staffBonuses.supplySaving += 0.1 * levelMultiplier;
                    tavern.staffBonuses.drinkValueBonus += 0.05 * levelMultiplier;
                    break;
                case "waiter":
                    tavern.staffBonuses.customerSatisfactionBonus += 0.05 * levelMultiplier;
                    tavern.staffBonuses.averageConsumptionBonus += 0.03 * levelMultiplier;
                    break;
                case "cleaner":
                    tavern.staffBonuses.cleanlinessDecayReduction += 0.5 * levelMultiplier;
                    tavern.staffBonuses.atmosphereBonus += 2 * levelMultiplier;
                    break;
                case "security":
                    tavern.staffBonuses.badEventReduction += 0.3 * levelMultiplier;
                    tavern.staffBonuses.eventNegativeEffectReduction += 0.2 * levelMultiplier;
                    break;
                case "musician":
                    tavern.staffBonuses.atmosphereBonus += 10 * levelMultiplier;
                    tavern.staffBonuses.customerSatisfactionBonus += 0.1 * levelMultiplier;
                    break;
            }
        });

        tavern.staffBonuses.supplySaving = Math.min(tavern.staffBonuses.supplySaving, 0.5);
        tavern.staffBonuses.drinkValueBonus = Math.min(tavern.staffBonuses.drinkValueBonus, 0.3);
        tavern.staffBonuses.customerSatisfactionBonus = Math.min(tavern.staffBonuses.customerSatisfactionBonus, 0.5);
        tavern.staffBonuses.averageConsumptionBonus = Math.min(tavern.staffBonuses.averageConsumptionBonus, 0.3);
        tavern.staffBonuses.cleanlinessDecayReduction = Math.min(tavern.staffBonuses.cleanlinessDecayReduction, 0.9);
        tavern.staffBonuses.badEventReduction = Math.min(tavern.staffBonuses.badEventReduction, 0.7);
        tavern.staffBonuses.eventNegativeEffectReduction = Math.min(tavern.staffBonuses.eventNegativeEffectReduction, 0.5);
    }

    async updateTavernMarket() {
        try {
            let marketData = this.loadTavernMarket();
            if (!marketData) {
                marketData = this.generateInitialMarket();
            } else {
                // 更新市场物资价格
                marketData.supplies = marketData.supplies.map(supply => {
                    // 随机波动价格 ±15%
                    const priceChange = 0.85 + Math.random() * 0.3;
                    supply.price = Math.floor(supply.basePrice * priceChange);
                    // 随机更新库存
                    supply.stock = Math.floor(50 + Math.random() * 100);
                    return supply;
                });

                // 有小概率添加特殊物资
                if (Math.random() < 0.2) {
                    const specialSupply = this.generateSpecialSupply();
                    // 检查是否已经存在该特殊物资
                    const existingIndex = marketData.supplies.findIndex(s => s.id === specialSupply.id);
                    if (existingIndex !== -1) {
                        marketData.supplies[existingIndex] = specialSupply;
                    } else {
                        marketData.supplies.push(specialSupply);
                    }
                }
            }
            this.saveTavernMarket(marketData);
        } catch (error) {
            console.error("更新酒馆市场时出错:", error);
        }
    }

    async loadTavernMarket() {
        try {
            if (fs.existsSync(TAVERN_MARKET_FILE)) {
                return JSON.parse(fs.readFileSync(TAVERN_MARKET_FILE, 'utf8'));
            }
            // 如果文件不存在，创建初始市场数据
            const initialMarket = this.generateInitialMarket();
            this.saveTavernMarket(initialMarket);
            return initialMarket;
        } catch (error) {
            console.error("加载酒馆市场数据失败:", error);
            return this.generateInitialMarket();
        }
    }

    // 保存酒馆市场数据
    async saveTavernMarket(data) {
        fs.writeFileSync(TAVERN_MARKET_FILE, JSON.stringify(data, null, 2));
    }

    // 生成初始市场数据
    generateInitialMarket() {
        return {
            lastUpdated: new Date().toISOString(),
            supplies: [
                { id: "beer_1", name: "普通啤酒", basePrice: 50, price: 50, stock: 100, type: "beer", desc: "最常见的啤酒，适合日常供应" },
                { id: "beer_2", name: "精酿啤酒", basePrice: 120, price: 120, stock: 80, type: "beer", desc: "口感独特的精酿啤酒，深受年轻人喜爱" },
                { id: "wine_1", name: "红葡萄酒", basePrice: 200, price: 200, stock: 60, type: "wine", desc: "经典红葡萄酒，适合配餐饮用" },
                { id: "wine_2", name: "白葡萄酒", basePrice: 180, price: 180, stock: 65, type: "wine", desc: "清爽的白葡萄酒，适合夏季饮用" },
                { id: "spirit_1", name: "威士忌", basePrice: 300, price: 300, stock: 40, type: "spirits", desc: "经典烈酒，适合品鉴" },
                { id: "spirit_2", name: "伏特加", basePrice: 250, price: 250, stock: 50, type: "spirits", desc: "纯净的烈酒，可调制多种鸡尾酒" },
                { id: "food_1", name: "小吃拼盘", basePrice: 80, price: 80, stock: 90, type: "food", desc: "多种小吃组合，适合配酒" },
                { id: "food_2", name: "坚果零食", basePrice: 60, price: 60, stock: 100, type: "food", desc: "各类坚果混合，是酒馆必备零食" },
                { id: "deco_1", name: "墙面装饰", basePrice: 500, price: 500, stock: 30, type: "decorations", desc: "提升酒馆氛围的墙面装饰" },
                { id: "deco_2", name: "桌椅套装", basePrice: 1200, price: 1200, stock: 20, type: "decorations", desc: "舒适的桌椅套装，提升顾客满意度" }
            ]
        };
    }

    // 生成特殊物资
    generateSpecialSupply() {
        const specialSupplies = [
            { id: "special_1", name: "古老威士忌", basePrice: 1500, price: 1500, stock: 10, type: "spirits", desc: "陈年珍藏威士忌，极大提升酒馆声誉" },
            { id: "special_2", name: "异域香料", basePrice: 800, price: 800, stock: 15, type: "ingredients", desc: "来自远方的稀有香料，可制作特色饮品" },
            { id: "special_3", name: "观赏酒杯套装", basePrice: 2000, price: 2000, stock: 5, type: "decorations", desc: "精美的水晶酒杯，成为酒馆亮点" },
            { id: "special_4", name: "顶级音乐盒", basePrice: 2500, price: 2500, stock: 3, type: "decorations", desc: "高品质音乐盒，极大提升酒馆氛围" },
            { id: "special_5", name: "传统酿酒设备", basePrice: 5000, price: 5000, stock: 2, type: "equipment", desc: "现场酿酒设备，可吸引特殊顾客" }
        ];
        return specialSupplies[Math.floor(Math.random() * specialSupplies.length)];
    }

    // 加载酒馆饮品数据库
    async loadTavernDrinks() {
        try {
            if (fs.existsSync(TAVERN_DRINKS_FILE)) {
                return JSON.parse(fs.readFileSync(TAVERN_DRINKS_FILE, 'utf8'));
            }
            // 如果文件不存在，创建初始饮品数据
            const initialDrinks = this.generateInitialDrinks();
            fs.writeFileSync(TAVERN_DRINKS_FILE, JSON.stringify(initialDrinks, null, 2));
            return initialDrinks;
        } catch (error) {
            console.error("加载酒馆饮品数据失败:", error);
            return this.generateInitialDrinks();
        }
    }

    generateInitialDrinks() {
        return {
            lastUpdated: new Date().toISOString(),
            drinks: [
                { id: "drink_1", name: "经典拉格啤酒", basePrice: 20, ingredients: ["beer_1"], popularity: 8, desc: "清爽的拉格啤酒，酒馆必备" },
                { id: "drink_2", name: "黑啤", basePrice: 25, ingredients: ["beer_1"], popularity: 7, desc: "浓郁的黑啤，有烘烤麦芽的香气" },
                { id: "drink_3", name: "水果酒", basePrice: 30, ingredients: ["wine_1"], popularity: 8, desc: "加入水果的甜酒，女性顾客喜爱" },
                { id: "drink_4", name: "干红葡萄酒", basePrice: 40, ingredients: ["wine_1"], popularity: 7, desc: "口感醇厚的干红葡萄酒" },
                { id: "drink_5", name: "清爽白葡萄酒", basePrice: 38, ingredients: ["wine_2"], popularity: 6, desc: "清爽怡人的白葡萄酒" },
                { id: "drink_6", name: "威士忌酸", basePrice: 45, ingredients: ["spirit_1"], popularity: 7, desc: "经典鸡尾酒，口感平衡" },
                { id: "drink_7", name: "血腥玛丽", basePrice: 40, ingredients: ["spirit_2"], popularity: 8, desc: "辛辣刺激的伏特加鸡尾酒" },
                { id: "drink_8", name: "莫吉托", basePrice: 35, ingredients: ["spirit_2"], popularity: 9, desc: "清新薄荷风味的鸡尾酒" },
                { id: "drink_9", name: "爱尔兰咖啡", basePrice: 30, ingredients: ["spirit_1"], popularity: 7, desc: "加入威士忌的热咖啡，温暖人心" }
            ]
        };
    }

    async loadTavernEvents() {
        try {
            if (fs.existsSync(TAVERN_EVENTS_FILE)) {
                return JSON.parse(fs.readFileSync(TAVERN_EVENTS_FILE, 'utf8'));
            }
            // 如果文件不存在，创建初始事件数据
            const initialEvents = this.generateInitialEvents();
            fs.writeFileSync(TAVERN_EVENTS_FILE, JSON.stringify(initialEvents, null, 2));
            return initialEvents;
        } catch (error) {
            console.error("加载酒馆事件数据失败:", error);
            return this.generateInitialEvents();
        }
    }

    generateInitialEvents() {
        return {
            lastUpdated: new Date().toISOString(),
            events: [
                {
                    id: "event_1",
                    name: "醉汉闹事",
                    description: "一位醉酒的顾客在酒馆里大声喧哗，打扰了其他客人",
                    probability: 0.15,
                    impact: {
                        reputation: -5,
                        customerSatisfaction: -10
                    },
                    choices: [
                        {
                            text: "礼貌请他离开",
                            outcome: {
                                reputation: -2,
                                customerSatisfaction: +5
                            }
                        },
                        {
                            text: "强制驱逐",
                            outcome: {
                                reputation: -10,
                                customerSatisfaction: +15
                            }
                        },
                        {
                            text: "提供免费咖啡并安抚",
                            outcome: {
                                money: -50,
                                reputation: +5,
                                customerSatisfaction: +10
                            }
                        }
                    ]
                },
                {
                    id: "event_2",
                    name: "名人光临",
                    description: "一位本地名人造访了你的酒馆，引起了顾客的注意",
                    probability: 0.1,
                    impact: {
                        reputation: +10,
                        customerSatisfaction: +5
                    },
                    choices: [
                        {
                            text: "提供VIP服务",
                            outcome: {
                                money: -100,
                                reputation: +15,
                                customerSatisfaction: +5
                            }
                        },
                        {
                            text: "请他品尝特色饮品",
                            outcome: {
                                money: -50,
                                reputation: +10,
                                customerSatisfaction: +5
                            }
                        },
                        {
                            text: "普通接待",
                            outcome: {
                                reputation: +5
                            }
                        }
                    ]
                },
                {
                    id: "event_3",
                    name: "酒水供应短缺",
                    description: "你的一款热门饮品原料不足，很多顾客点不到想要的饮品",
                    probability: 0.2,
                    impact: {
                        customerSatisfaction: -15
                    },
                    choices: [
                        {
                            text: "高价紧急采购",
                            outcome: {
                                money: -300,
                                customerSatisfaction: +10
                            }
                        },
                        {
                            text: "推荐其他替代饮品",
                            outcome: {
                                customerSatisfaction: -5
                            }
                        },
                        {
                            text: "诚实解释并提供折扣",
                            outcome: {
                                money: -200,
                                reputation: +5,
                                customerSatisfaction: 0
                            }
                        }
                    ]
                }
            ]
        };
    }

    async banPlayer(userId, e) {
        const banTime = 24 * 60 * 60 * 1000; // 24小时
        const banUntil = Date.now() + banTime;
        await redis.set(`ban:${userId}`, banUntil);
        
        const banData = {
            userId,
            banUntil
        };
        await saveBanData(banData);
        
        e.reply("检测到数据异常，你已被暂时封禁。");
    }

    async showTavernRanking(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'ranking');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        // 获取所有玩家数据
        const allUsers = await loadAllUsers();
        
        // 筛选拥有酒馆的玩家
        const tavernOwners = Object.entries(allUsers)
            .filter(([, user]) => user.tavern)
            .map(([id, user]) => ({
                userId: id,
                playerName: user.name,
                tavernName: user.tavern.name,
                level: user.tavern.level,
                popularity: user.tavern.popularity,
                reputation: user.tavern.reputation,
                totalIncome: user.tavern.totalIncome || 0,
                drinkCount: user.tavern.drinks ? user.tavern.drinks.length : 0,
                staffCount: user.tavern.staff ? user.tavern.staff.length : 0
            }));
        
        if (tavernOwners.length === 0) {
            e.reply("目前还没有玩家拥有酒馆！");
            return;
        }
        
        // 按不同指标排序
        const rankingByLevel = [...tavernOwners].sort((a, b) => b.level - a.level);
        const rankingByPopularity = [...tavernOwners].sort((a, b) => b.popularity - a.popularity);
        const rankingByIncome = [...tavernOwners].sort((a, b) => b.totalIncome - a.totalIncome);
        
        // 获取玩家自己酒馆的排名
        let userRankings = null;
        if (userData.tavern) {
            userRankings = {
                byLevel: rankingByLevel.findIndex(t => t.userId === userId) + 1,
                byPopularity: rankingByPopularity.findIndex(t => t.userId === userId) + 1,
                byIncome: rankingByIncome.findIndex(t => t.userId === userId) + 1
            };
        }
        
        // 只取前10名显示
        const top10ByLevel = rankingByLevel.slice(0, 10);
        const top10ByPopularity = rankingByPopularity.slice(0, 10);
        const top10ByIncome = rankingByIncome.slice(0, 10);
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_ranking', {
            cssFile,
            rankings: {
                byLevel: top10ByLevel,
                byPopularity: top10ByPopularity,
                byIncome: top10ByIncome
            },
            userRankings,
            totalTaverns: tavernOwners.length
        });
        
        setCooldown(e.user_id, 'tavern', 'ranking');
        
        e.reply(`【酒馆排行攻略】
1. 排行榜分类：
   - 等级排行：反映酒馆规模和发展阶段
   - 人气排行：反映顾客喜爱程度和客流量
   - 收入排行：反映经营效益和累计盈利
2. 提升排名策略：
   - 等级排名：积极升级酒馆
   - 人气排名：提供特色饮品，保持良好环境
   - 收入排名：高效经营，控制成本
3. 参观技巧：
   - 使用"#参观酒馆+玩家ID"参观其他酒馆
   - 学习高排名酒馆的经营模式
   - 关注特色饮品和员工配置`);
    }
    async visitTavern(e) {
        const remainingTime = checkCooldown(e.user_id, 'tavern', 'visit');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }

        const targetUserId = e.msg.replace('#参观酒馆', '').trim();
        if (!targetUserId) {
            e.reply("请指定要参观的玩家ID！格式：#参观酒馆 [玩家ID]。可通过 #酒馆排行 查看玩家ID。");
            return;
        }
        
        // 不能参观自己的酒馆
        if (targetUserId === userId) {
            e.reply("不能参观自己的酒馆，请使用 #酒馆信息 查看自己的酒馆。");
            return;
        }
        
        // 检查目标玩家是否存在
        const targetUserData = await checkUserData(targetUserId);
        if (!targetUserData) {
            e.reply("未找到该玩家！请检查ID是否正确。");
            return;
        }
        
        // 检查目标玩家是否有酒馆
        if (!targetUserData.tavern) {
            e.reply(`玩家 ${targetUserData.name} 还没有创建酒馆！`);
            return;
        }
        
        // 参观酒馆会小幅提升目标酒馆人气
        targetUserData.tavern.popularity = Math.min(100, targetUserData.tavern.popularity + 1);
        await saveUserData(targetUserId, targetUserData);
        await redis.set(`user:${targetUserId}`, JSON.stringify(targetUserData));
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await this.image(e, 'tavern_visit', {
            cssFile,
            targetUser: {
                id: targetUserId,
                name: targetUserData.name
            },
            tavern: targetUserData.tavern,
            visitor: {
                id: userId,
                name: userData.name
            }
        });
        setCooldown(e.user_id, 'tavern', 'visit');
        e.reply(`【酒馆参观攻略】
1. 学习要点：
   - 分析该酒馆的规模、菜单和员工配置
   - 观察特色饮品的种类和定价策略
   - 了解酒馆装修和氛围营造方式
2. 经营借鉴：
   - 成功酒馆通常有合理的资源分配
   - 特色鲜明的菜单更容易吸引顾客
   - 员工配置要根据酒馆定位调整
3. 互动效果：
   - 你的参观为对方酒馆增加了1点人气
   - 多参观可以学习不同经营风格
   - 交流经验有助于共同提高`);
    }
}
//。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。stop 。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。。
async function image(e, file, obj) {
    let data = {
        ...obj,
        saveId: e.user_id
    };

    let img = await puppeteer.screenshot(file, {
        ...data
    });

    e.reply(img);
} 