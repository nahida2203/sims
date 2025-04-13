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

export class RealEstateSystem extends plugin {
    constructor() {
        super({
            name: 'RealEstateSystem',
            dsc: '房产销售系统',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#房产市场$', fnc: 'showRealEstateMarket' },
                { reg: '^#购买房产.*$', fnc: 'buyProperty' },
                { reg: '^#出售房产.*$', fnc: 'sellProperty' },
                { reg: '^#房产信息$', fnc: 'showPropertyInfo' },
                { reg: '^#装修房产.*$', fnc: 'renovateProperty' },
                { reg: '^#出租房产.*$', fnc: 'rentProperty' },
            ],
        });
        this.task = {
            cron: '0 * * * *',
            name: 'RealEstateUpdate',
            fnc: () => this.updateRealEstateMarket(),
        };
    }

    async showRealEstateMarket(e) {
        const remainingTime = checkCooldown(e.user_id, 'real_estate', 'market');
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

        // 读取房产市场数据
        const marketData = await this.loadRealEstateMarket();
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'real_estate_market', {
            cssFile,
            marketData,
            userMoney: userData.money
        });
        setCooldown(e.user_id, 'real_estate', 'market');
        e.reply(`【房产市场攻略】
1. 房产市场每小时更新一次，价格会随市场波动
2. 不同区域的房产有不同的升值空间和租金收益
3. 购买房产前请仔细考虑：
   - 房产位置和升值潜力
   - 装修和维护成本
   - 租金收益预期
4. 建议：
   - 新手建议先购买小户型房产
   - 关注市场趋势，选择合适时机买卖
   - 合理规划装修，提升房产价值
   - 注意维护房产状态，避免贬值`);
    }

    async buyProperty(e) {
        const remainingTime = checkCooldown(e.user_id, 'real_estate', 'buy');
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

        const propertyId = e.msg.replace('#购买房产', '').trim();
        const marketData = await this.loadRealEstateMarket();
        const property = marketData.properties.find(p => p.id === propertyId);

        if (!property) {
            e.reply("未找到该房产信息！");
            return;
        }

        if (userData.money < property.price) {
            e.reply("你的资金不足以购买该房产！");
            return;
        }

        // 更新用户数据
        userData.money -= property.price;
        if (!userData.properties) userData.properties = [];
        userData.properties.push({
            ...property,
            purchaseDate: new Date().toISOString(),
            condition: 100,
            renovationLevel: 0,
            isRented: false,
            tenant: null
        });
        marketData.properties = marketData.properties.filter(p => p.id !== propertyId);
        await this.saveRealEstateMarket(marketData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'real_estate', 'buy');

        e.reply(`恭喜你成功购买了${property.name}！
【购买房产攻略】
1. 购买前检查：
   - 确认房产位置和价格
   - 检查自己的资金是否充足
   - 考虑房产的升值空间
2. 购买后建议：
   - 及时进行装修提升价值
   - 考虑出租获取收益
   - 定期维护保持房产状态
3. 注意事项：
   - 房产价格会随市场波动
   - 不同区域升值空间不同
   - 装修和维护需要额外投入`);
    }

    async sellProperty(e) {
        const remainingTime = checkCooldown(e.user_id, 'real_estate', 'sell');
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

        const propertyId = e.msg.replace('#出售房产', '').trim();
        if (!userData.properties || !userData.properties.length) {
            e.reply("你还没有任何房产！");
            return;
        }

        const propertyIndex = userData.properties.findIndex(p => p.id === propertyId);
        if (propertyIndex === -1) {
            e.reply("未找到该房产信息！");
            return;
        }

        const property = userData.properties[propertyIndex];
        if (property.isRented) {
            e.reply("该房产正在出租中，无法出售！");
            return;
        }

        // 计算出售价格
        const marketData = await this.loadRealEstateMarket();
        const basePrice = property.price;
        const renovationBonus = property.renovationLevel * 10000;
        const conditionBonus = (property.condition / 100) * basePrice * 0.2;
        const sellPrice = Math.floor(basePrice + renovationBonus + conditionBonus);

        // 更新用户数据
        userData.money += sellPrice;
        userData.properties.splice(propertyIndex, 1);

        // 更新市场数据
        marketData.properties.push({
            ...property,
            price: Math.floor(basePrice * (1 + Math.random() * 0.1)) // 随机调整价格
        });
        await this.saveRealEstateMarket(marketData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'real_estate', 'sell');

        e.reply(`恭喜你成功出售了${property.name}！
获得资金：${sellPrice}元

【出售房产攻略】
1. 出售时机选择：
   - 关注市场行情
   - 选择升值空间大的时机
   - 考虑装修和维护状态
2. 价格影响因素：
   - 房产基础价格
   - 装修等级加成
   - 维护状态加成
3. 注意事项：
   - 出租中的房产无法出售
   - 出售前确保房产状态良好
   - 合理评估升值空间`);
    }

    async showPropertyInfo(e) {
        const remainingTime = checkCooldown(e.user_id, 'real_estate', 'info');
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

        if (!userData.properties || !userData.properties.length) {
            e.reply("你还没有任何房产！");
            return;
        }
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'property_info', {
            cssFile,
            properties: userData.properties
        });
        setCooldown(e.user_id, 'real_estate', 'info');
        e.reply(`【房产信息查看攻略】
1. 信息查看要点：
   - 房产位置和类型
   - 当前状态和条件
   - 装修等级
   - 租金收益
2. 管理建议：
   - 定期检查房产状态
   - 及时进行维护
   - 合理规划装修
3. 注意事项：
   - 关注房产贬值情况
   - 注意租客反馈
   - 合理设置租金`);
    }

    async renovateProperty(e) {
        const remainingTime = checkCooldown(e.user_id, 'real_estate', 'renovate');
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

        const [propertyId, level] = e.msg.replace('#装修房产', '').trim().split(' ');
        if (!userData.properties || !userData.properties.length) {
            e.reply("你还没有任何房产！");
            return;
        }

        const property = userData.properties.find(p => p.id === propertyId);
        if (!property) {
            e.reply("未找到该房产信息！");
            return;
        }

        const renovationCosts = {
            1: 50000,
            2: 100000,
            3: 200000,
            4: 400000,
            5: 800000
        };

        const targetLevel = parseInt(level);
        if (isNaN(targetLevel) || targetLevel < 1 || targetLevel > 5) {
            e.reply("装修等级必须在1-5之间！");
            return;
        }

        if (property.renovationLevel >= targetLevel) {
            e.reply("该房产已达到或超过目标装修等级！");
            return;
        }

        const totalCost = renovationCosts[targetLevel];
        if (userData.money < totalCost) {
            e.reply("你的资金不足以进行装修！");
            return;
        }

        // 更新用户数据
        userData.money -= totalCost;
        property.renovationLevel = targetLevel;
        property.condition = 100; // 装修后恢复状态
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'real_estate', 'renovate');

        e.reply(`恭喜你成功将${property.name}装修到${targetLevel}级！
花费：${totalCost}元

【房产装修攻略】
1. 装修等级说明：
   - 1级：基础装修
   - 2级：舒适装修
   - 3级：豪华装修
   - 4级：顶级装修
   - 5级：至尊装修
2. 装修建议：
   - 根据房产位置选择合适等级
   - 考虑投资回报比
   - 注意装修成本
3. 注意事项：
   - 装修后房产状态会恢复
   - 装修等级影响租金和售价
   - 合理规划装修预算`);
    }

    async rentProperty(e) {
        const remainingTime = checkCooldown(e.user_id, 'real_estate', 'rent');
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

        const [propertyId, rentPrice] = e.msg.replace('#出租房产', '').trim().split(' ');
        if (!userData.properties || !userData.properties.length) {
            e.reply("你还没有任何房产！");
            return;
        }

        const property = userData.properties.find(p => p.id === propertyId);
        if (!property) {
            e.reply("未找到该房产信息！");
            return;
        }

        if (property.isRented) {
            e.reply("该房产已经在出租中！");
            return;
        }

        const price = parseInt(rentPrice);
        if (isNaN(price) || price <= 0) {
            e.reply("请输入有效的租金金额！");
            return;
        }

        // 计算基础租金（考虑位置、装修等级和状态）
        const baseRent = property.price * 0.01;
        const renovationBonus = property.renovationLevel * 0.2;
        const conditionBonus = (property.condition / 100) * 0.1;
        const maxRent = Math.floor(baseRent * (1 + renovationBonus + conditionBonus));

        if (price > maxRent) {
            e.reply(`租金过高！最高可设置租金为${maxRent}元`);
            return;
        }

        // 更新房产状态
        property.isRented = true;
        property.rentPrice = price;
        property.tenant = {
            id: Math.random().toString(36).substr(2, 9),
            name: `租客${Math.floor(Math.random() * 1000)}`,
            satisfaction: 100,
            rentStartDate: new Date().toISOString()
        };
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'real_estate', 'rent');

        e.reply(`恭喜你成功将${property.name}出租！
租金：${price}元/小时
租客：${property.tenant.name}

【房产出租攻略】
1. 租金设置建议：
   - 考虑房产位置和装修
   - 参考市场行情
   - 注意租客满意度
2. 出租管理：
   - 定期检查租客满意度
   - 及时处理租客反馈
   - 注意房产维护
3. 注意事项：
   - 出租中的房产无法出售
   - 租金过高可能影响租客满意度
   - 定期检查房产状态`);
    }

    async updateRealEstateMarket() {
        const marketData = await this.loadRealEstateMarket();
        
        // 更新房产价格
        marketData.properties.forEach(property => {
            const priceChange = (Math.random() - 0.5) * 0.1; // -5% 到 +5% 的价格变化
            property.price = Math.floor(property.price * (1 + priceChange));
        });

        // 添加新房产
        if (Math.random() < 0.3) { // 30% 的概率添加新房产
            const newProperty = this.generateNewProperty();
            marketData.properties.push(newProperty);
        }

        // 移除部分房产
        if (marketData.properties.length > 50) {
            const removeCount = Math.floor(Math.random() * 3); // 随机移除0-2个房产
            for (let i = 0; i < removeCount; i++) {
                const index = Math.floor(Math.random() * marketData.properties.length);
                marketData.properties.splice(index, 1);
            }
        }

        await this.saveRealEstateMarket(marketData);
    }

    async loadRealEstateMarket() {
        try {
            const data = fs.readFileSync(path.join(_path, 'plugins/sims-plugin/data/real_estate_market.json'), 'utf8');
            return JSON.parse(data);
        } catch (error) {
            const initialData = {
                properties: this.generateInitialProperties()
            };
            await this.saveRealEstateMarket(initialData);
            return initialData;
        }
    }

    async saveRealEstateMarket(data) {
        const filePath = path.join(_path, 'plugins/sims-plugin/data/real_estate_market.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    generateInitialProperties() {
        const properties = [];
        const locations = ['市中心', '郊区', '商业区', '住宅区', '学区'];
        const types = ['公寓', '别墅', '商铺', '写字楼', '住宅'];
        
        for (let i = 0; i < 20; i++) {
            properties.push(this.generateNewProperty());
        }
        
        return properties;
    }

    generateNewProperty() {
        const locations = ['市中心', '郊区', '商业区', '住宅区', '学区'];
        const types = ['公寓', '别墅', '商铺', '写字楼', '住宅'];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // 根据位置和类型生成基础价格
        let basePrice = 100000;
        switch(location) {
            case '市中心': basePrice *= 2; break;
            case '商业区': basePrice *= 1.5; break;
            case '学区': basePrice *= 1.3; break;
            case '住宅区': basePrice *= 1.2; break;
        }
        
        switch(type) {
            case '别墅': basePrice *= 2; break;
            case '商铺': basePrice *= 1.8; break;
            case '写字楼': basePrice *= 1.5; break;
            case '公寓': basePrice *= 1.2; break;
        }

        return {
            id: Math.random().toString(36).substr(2, 9),
            name: `${location}${type}`,
            location,
            type,
            price: Math.floor(basePrice * (0.8 + Math.random() * 0.4)), // 基础价格的80%-120%
            size: Math.floor(50 + Math.random() * 150), // 50-200平米
            condition: 100,
            renovationLevel: 0
        };
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