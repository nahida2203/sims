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
                { reg: '^#房产市场.*$', fnc: 'showRealEstateMarket' },
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
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
        }
        
        const typeFilter = e.msg.replace('#房产市场', '').trim();
        
        // 读取房产市场数据
        const marketData = await this.loadRealEstateMarket();
        
        // 如果有筛选条件，进行筛选
        let filteredProperties = marketData.properties;
        let filterMessage = '';
        
        const propertyTypes = ['公寓', '别墅', '商铺', '写字楼', '住宅'];
        const locations = ['市中心', '郊区', '商业区', '住宅区', '学区'];
        
        if (typeFilter && (propertyTypes.includes(typeFilter) || locations.includes(typeFilter))) {
            if (propertyTypes.includes(typeFilter)) {
                filteredProperties = marketData.properties.filter(p => p.type === typeFilter);
                filterMessage = `已为您筛选${typeFilter}类型的房产`;
            } else if (locations.includes(typeFilter)) {
                filteredProperties = marketData.properties.filter(p => p.location === typeFilter);
                filterMessage = `已为您筛选${typeFilter}区域的房产`;
            }
        }
        
        // 按价格从低到高排序
        filteredProperties.sort((a, b) => a.price - b.price);
        
        // 市场分析数据
        const marketAnalysis = {
            totalProperties: marketData.properties.length,
            averagePrice: Math.floor(marketData.properties.reduce((sum, p) => sum + p.price, 0) / marketData.properties.length),
            priceRange: {
                min: Math.min(...marketData.properties.map(p => p.price)),
                max: Math.max(...marketData.properties.map(p => p.price))
            },
            typeDistribution: propertyTypes.map(type => {
                return {
                    type,
                    count: marketData.properties.filter(p => p.type === type).length
                };
            }),
            locationDistribution: locations.map(location => {
                return {
                    location,
                    count: marketData.properties.filter(p => p.location === location).length,
                    avgPrice: Math.floor(
                        marketData.properties
                            .filter(p => p.location === location)
                            .reduce((sum, p) => sum + p.price, 0) / 
                            (marketData.properties.filter(p => p.location === location).length || 1)
                    )
                };
            })
        };
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        await image(e, 'real_estate_market', {
            cssFile,
            marketData,
            properties: filteredProperties,
            hasProperties: filteredProperties && filteredProperties.length > 0,
            userMoney: userData.money,
            marketAnalysis,
            filterMessage
        });
        
        setCooldown(e.user_id, 'real_estate', 'market');
        
        if (filterMessage) {
            e.reply(filterMessage);
        } else {
            const locationRecommendation = marketAnalysis.locationDistribution
                .sort((a, b) => a.avgPrice - b.avgPrice)[0];
            
            e.reply(`【房产市场信息】
当前市场共有${marketAnalysis.totalProperties}处房产
平均价格: ${marketAnalysis.averagePrice}元
价格区间: ${marketAnalysis.priceRange.min}-${marketAnalysis.priceRange.max}元

【市场分析】
1. ${locationRecommendation.location}区域均价最低，约${locationRecommendation.avgPrice}元，性价比较高
2. 市场热门房产类型: ${marketAnalysis.typeDistribution.sort((a, b) => b.count - a.count)[0].type}
3. 您当前资金: ${userData.money}元

【使用提示】
- 输入 #房产市场+类型 可筛选特定类型(如:#房产市场公寓)
- 输入 #房产市场+区域 可筛选特定区域(如:#房产市场市中心)
- 使用 #购买房产+ID 购买您心仪的房产`);
        }
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
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
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
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
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
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
        }

        // 对房产进行排序和分析
        userData.properties.sort((a, b) => {
            // 优先按照是否出租排序
            if (a.isRented !== b.isRented) {
                return a.isRented ? -1 : 1;
            }
            // 然后按照价值排序
            return b.price - a.price;
        });
        
        // 计算房产统计信息
        const stats = {
            totalProperties: userData.properties.length,
            totalValue: userData.properties.reduce((sum, p) => sum + p.price, 0),
            totalRented: userData.properties.filter(p => p.isRented).length,
            totalRentIncome: userData.properties.filter(p => p.isRented)
                .reduce((sum, p) => sum + (p.rentPrice || 0), 0),
            averageCondition: Math.floor(
                userData.properties.reduce((sum, p) => sum + p.condition, 0) / userData.properties.length
            ),
            bestProperty: userData.properties.reduce((best, p) => 
                p.price > (best ? best.price : 0) ? p : best, null),
            worstCondition: userData.properties.reduce((worst, p) => 
                p.condition < (worst ? worst.condition : 101) ? p : worst, null)
        };
        
        // 添加房产功能和特性信息
        userData.properties.forEach(property => {
            if (!property.features) {
                property.features = [];
            }
            
            // 生成收益预测
            property.incomeProjection = this.calculateIncomeProjection(property);
            
            // 生成维护建议
            property.maintenanceAdvice = this.generateMaintenanceAdvice(property);
        });
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        await image(e, 'property_info', {
            cssFile,
            properties: userData.properties,
            stats
        });
        setCooldown(e.user_id, 'real_estate', 'info');
        
        // 生成房产投资分析
        const recommendedAction = this.analyzePortfolio(userData.properties);
        
        e.reply(`【房产资产概况】
您共拥有${stats.totalProperties}处房产，总价值${stats.totalValue}元
已出租: ${stats.totalRented}处，每小时租金收入: ${stats.totalRentIncome}元
平均房产状况: ${stats.averageCondition}%

【最有价值房产】
${stats.bestProperty.name} (价值${stats.bestProperty.price}元)

【投资建议】
${recommendedAction}

【使用提示】
- 输入 #出售房产+ID 可出售房产
- 输入 #装修房产+ID+等级 可提升房产价值
- 输入 #出租房产+ID+租金 可出租获得收益`);
    }

    calculateIncomeProjection(property) {
        // 计算预期月收入
        if (property.isRented) {
            return property.rentPrice * 24 * 30; // 月租金收入
        }
        
        // 计算潜在租金收入
        const baseRent = property.price * 0.008; // 基础月租金约为房价的0.8%
        const renovationBonus = property.renovationLevel * 0.2;
        const conditionBonus = (property.condition / 100) * 0.1;
        return Math.floor(baseRent * (1 + renovationBonus + conditionBonus));
    }
    
    generateMaintenanceAdvice(property) {
        if (property.condition < 50) {
            return "紧急：房产状况不佳，需要立即维护";
        } else if (property.condition < 70) {
            return "注意：房产需要维护，建议尽快装修";
        } else if (property.condition < 90) {
            return "提醒：房产状况良好，定期检查维护";
        } else {
            return "优秀：房产状况极佳，继续保持";
        }
    }
    
    analyzePortfolio(properties) {
        if (properties.length <= 1) {
            return "建议继续购入不同类型房产，分散投资风险";
        }
        
        // 计算各类型房产数量
        const typeCount = {};
        properties.forEach(p => {
            typeCount[p.type] = (typeCount[p.type] || 0) + 1;
        });
        
        // 计算各区域房产数量
        const locationCount = {};
        properties.forEach(p => {
            locationCount[p.location] = (locationCount[p.location] || 0) + 1;
        });
        
        // 检查是否有装修等级较低的房产
        const lowRenovation = properties.some(p => p.renovationLevel < 2);
        
        // 检查是否有未出租的房产
        const unrented = properties.some(p => !p.isRented);
        
        // 生成建议
        let advice = [];
        
        // 检查房产类型分布
        const types = Object.keys(typeCount);
        if (types.length < 3 && properties.length >= 3) {
            advice.push("建议购买多种类型房产分散风险");
        }
        
        // 检查区域分布
        const locations = Object.keys(locationCount);
        if (locations.length < 3 && properties.length >= 3) {
            advice.push("建议在不同区域购买房产，降低市场风险");
        }
        
        // 建议装修
        if (lowRenovation) {
            advice.push("部分房产装修等级较低，升级装修可提高收益");
        }
        
        // 建议出租
        if (unrented) {
            advice.push("有未出租房产，建议出租以获取持续收益");
        }
        
        if (advice.length === 0) {
            advice.push("您的房产组合已经非常均衡，继续保持良好的维护和管理");
        }
        
        return advice.join("；");
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
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
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
        
        // 数据不一致检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            const result = await this.handleDataInconsistency(userId, userData, redisUserData, e);
            if (!result.shouldContinue) {
                return;
            }
            // 使用处理后的数据
            userData = result.userData;
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
        
        // 生成当前市场趋势
        const marketTrend = Math.random();
        let trendFactor = 0;
        
        if (marketTrend < 0.2) {
            // 市场低迷 (20%概率)
            trendFactor = -0.08;
        } else if (marketTrend < 0.7) {
            // 市场平稳 (50%概率)
            trendFactor = 0;
        } else if (marketTrend < 0.95) {
            // 市场繁荣 (25%概率)
            trendFactor = 0.08;
        } else {
            // 市场火爆 (5%概率)
            trendFactor = 0.15;
        }
        
        // 各类型房产的特殊调整因子
        const typeFactors = {
            '公寓': Math.random() * 0.06 - 0.03,  // -3% ~ +3%
            '别墅': Math.random() * 0.08 - 0.04,  // -4% ~ +4%
            '商铺': Math.random() * 0.10 - 0.05,  // -5% ~ +5%
            '写字楼': Math.random() * 0.09 - 0.045, // -4.5% ~ +4.5%
            '住宅': Math.random() * 0.07 - 0.035  // -3.5% ~ +3.5%
        };
        
        // 各区域的特殊调整因子
        const locationFactors = {
            '市中心': Math.random() * 0.08 - 0.02,  // -2% ~ +6%
            '商业区': Math.random() * 0.07 - 0.025, // -2.5% ~ +4.5%
            '学区': Math.random() * 0.06 - 0.02,   // -2% ~ +4%
            '住宅区': Math.random() * 0.05 - 0.025, // -2.5% ~ +2.5%
            '郊区': Math.random() * 0.04 - 0.03    // -3% ~ +1%
        };
        
        // 更新房产价格
        marketData.properties.forEach(property => {
            // 基础趋势变化
            let priceChange = trendFactor;
            
            // 添加类型和区域特殊因子
            priceChange += typeFactors[property.type] || 0;
            priceChange += locationFactors[property.location] || 0;
            
            // 随机波动 (-2% ~ +2%)
            priceChange += (Math.random() * 0.04 - 0.02);
            
            // 更新价格
            property.price = Math.floor(property.price * (1 + priceChange));
            
            // 确保价格不会太低
            property.price = Math.max(property.price, 10000);
        });

        // 添加新房产
        const newPropertyChance = Math.random();
        if (newPropertyChance < 0.5) { // 50% 的概率添加新房产
            const newPropertyCount = Math.floor(Math.random() * 3) + 1; // 添加1-3个新房产
            for (let i = 0; i < newPropertyCount; i++) {
                const newProperty = this.generateNewProperty();
                marketData.properties.push(newProperty);
            }
        }

        // 移除部分房产
        if (marketData.properties.length > 30) {
            const removeCount = Math.floor(Math.random() * 3) + 1; // 随机移除1-3个房产
            for (let i = 0; i < removeCount; i++) {
                const index = Math.floor(Math.random() * marketData.properties.length);
                marketData.properties.splice(index, 1);
            }
        }

        // 保存市场数据
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
        
        // 扩展房产名称
        const locationAdjectives = {
            '市中心': ['繁华', '中央', '核心', '高端', '豪华'],
            '郊区': ['宁静', '远景', '自然', '清新', '田园'],
            '商业区': ['商贸', '商务', '经济', '贸易', '金融'],
            '住宅区': ['温馨', '舒适', '宜居', '家庭', '生活'],
            '学区': ['学府', '书香', '教育', '人文', '知识']
        };
        
        const typeAdjectives = {
            '公寓': ['现代', '精致', '简约', '便捷', '时尚'],
            '别墅': ['豪华', '尊贵', '奢华', '高雅', '幽静'],
            '商铺': ['繁忙', '旺铺', '黄金', '旗舰', '热门'],
            '写字楼': ['办公', '企业', '高效', '商务', '专业'],
            '住宅': ['家园', '温馨', '舒适', '理想', '幸福']
        };
        
        const locationAdj = locationAdjectives[location][Math.floor(Math.random() * locationAdjectives[location].length)];
        const typeAdj = typeAdjectives[type][Math.floor(Math.random() * typeAdjectives[type].length)];
        const nameFormat = Math.floor(Math.random() * 3);
        
        let propertyName;
        if (nameFormat === 0) {
            propertyName = `${locationAdj}${location}${type}`;
        } else if (nameFormat === 1) {
            propertyName = `${location}${typeAdj}${type}`;
        } else {
            propertyName = `${locationAdj}${typeAdj}${type}`;
        }
        
        // 根据位置和类型生成基础价格
        let basePrice = 100000;
        switch(location) {
            case '市中心': basePrice *= 2.2; break;
            case '商业区': basePrice *= 1.7; break;
            case '学区': basePrice *= 1.5; break;
            case '住宅区': basePrice *= 1.3; break;
            case '郊区': basePrice *= 0.8; break;
        }
        
        switch(type) {
            case '别墅': basePrice *= 2.5; break;
            case '商铺': basePrice *= 2.0; break;
            case '写字楼': basePrice *= 1.8; break;
            case '公寓': basePrice *= 1.3; break;
            case '住宅': basePrice *= 1.0; break;
        }
        
        // 根据面积调整价格
        let size = Math.floor(50 + Math.random() * 200); // 50-250平米
        const sizeAdjustment = size / 100; // 面积越大，单价稍微降低
        
        // 随机生成房产特性
        const features = [];
        const possibleFeatures = [
            '靠近地铁', '临近公园', '河景房', '临街', '南北通透',
            '步行街', '商圈中心', '学校附近', '医院附近', '安静社区',
            '精装修', '拎包入住', '新小区', '成熟社区', '低密度',
            '高楼层', '电梯房', '花园洋房', '复式结构', '地暖'
        ];
        
        // 随机选择2-4个特性
        const featureCount = 2 + Math.floor(Math.random() * 3);
        const shuffledFeatures = [...possibleFeatures].sort(() => 0.5 - Math.random());
        for (let i = 0; i < featureCount; i++) {
            features.push(shuffledFeatures[i]);
        }
        
        // 房产特性给价格带来的额外调整
        let featureBonus = 1.0;
        features.forEach(feature => {
            if (['靠近地铁', '临近公园', '河景房', '南北通透', '商圈中心'].includes(feature)) {
                featureBonus += 0.05; // 每个优质特性增加5%价格
            }
        });
        
        // 最终价格计算
        const finalPrice = Math.floor(basePrice * sizeAdjustment * featureBonus * (0.85 + Math.random() * 0.3));

        return {
            id: Math.random().toString(36).substr(2, 9),
            name: propertyName,
            location,
            type,
            price: finalPrice,
            size,
            condition: 100,
            renovationLevel: 0,
            features
        };
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