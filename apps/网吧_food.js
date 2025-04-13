import plugin from '../../../lib/plugins/plugin.js';
import { segment } from 'icqq';
import fs from 'fs';
import {
    saveUserData,
    checkUserData,
} from '../function/function.js';
import { checkCooldown, setCooldown } from '../function/cooldown.js';
import Redis from 'ioredis';

const redis = new Redis();
const netbarShop = JSON.parse(fs.readFileSync('plugins/sims-plugin/data/netbar_shop.json', 'utf8'));

export class NetbarFood extends plugin {
    constructor() {
        super({
            name: '模拟人生-网吧餐饮',
            dsc: '网吧食品饮料服务',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#进货.*$',
                    fnc: 'purchaseGoods'
                },
                {
                    reg: '^#库存查询$',
                    fnc: 'checkInventory'
                },
                {
                    reg: '^#点餐.*$',
                    fnc: 'orderFood'
                },
                {
                    reg: '^#餐饮菜单$',
                    fnc: 'showMenu'
                },
                {
                    reg: '^#设置价格.*$',
                    fnc: 'setPrice'
                },
                {
                    reg: '^#餐饮统计$',
                    fnc: 'foodStats'
                }
            ]
        });
    }

    async purchaseGoods(e) {
        const remainingTime = checkCooldown(e.user_id, 'netbar', 'purchase');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        // 获取用户数据
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));

        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            e.reply("数据异常，请联系管理员！");
            return;
        }

        // 检查是否有网吧
        if (!userData.netbar) {
            e.reply("你还没有网吧！请先创建一家网吧。");
            return;
        }
        const params = e.msg.replace('#进货', '').trim().split(' ');
        if (params.length !== 2) {
            e.reply([
                "格式错误！正确格式：#进货 [商品名] [数量]\n",
                "\n可进货商品：\n",
                "饮料类：\n",
                "1. 可乐 (24瓶/箱，24元)\n",
                "2. 雪碧 (24瓶/箱，24元)\n",
                "3. 矿泉水 (24瓶/箱，12元)\n",
                "4. 咖啡粉 (50杯份，100元)\n",
                "5. 奶茶粉 (50杯份，75元)\n",
                "6. 茶包 (100包，100元)\n",
                "\n零食类：\n",
                "1. 薯片 (30包，60元)\n",
                "2. 面包 (20个，30元)\n",
                "3. 饼干 (40包，40元)\n",
                "\n主食类：\n",
                "1. 泡面 (30桶，90元)\n",
                "2. 盒饭 (20份，160元)\n",
                "3. 三明治 (15个，60元)"
            ].join(''));
            return;
        }

        const [itemName, quantity] = params;
        const quantityNum = parseInt(quantity);

        if (isNaN(quantityNum) || quantityNum <= 0) {
            e.reply("进货数量必须是大于0的数字！");
            return;
        }

        let item;
        for (const category in netbarShop.consumables) {
            const items = netbarShop.consumables[category];
            if (typeof items === 'object') {
                for (const subcategory in items) {
                    if (items[subcategory].name === itemName) {
                        item = items[subcategory];
                        break;
                    }
                }
            }
        }

        if (!item) {
            e.reply("未找到该商品！");
            return;
        }

        // 计算进货成本
        const totalCost = item.cost * item.stock_unit * quantityNum;

        // 检查资金
        if (userData.money < totalCost) {
            e.reply(`资金不足！进货${quantityNum}${item.name}需要${totalCost}元。`);
            return;
        }

        // 初始化库存数据
        if (!userData.netbar.inventory) {
            userData.netbar.inventory = {};
        }

        // 更新库存
        if (!userData.netbar.inventory[itemName]) {
            userData.netbar.inventory[itemName] = {
                quantity: 0,
                price: item.price,
                cost: item.cost,
                sales: 0,
                revenue: 0
            };
        }
        userData.netbar.inventory[itemName].quantity += item.stock_unit * quantityNum;

        // 更新资金
        userData.money -= totalCost;
        userData.netbar.expenses += totalCost;
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'netbar', 'purchase');
        e.reply([
            `📦 进货成功！\n`,
            `商品：${item.name}\n`,
            `数量：${item.stock_unit * quantityNum}个\n`,
            `成本：${totalCost}元\n`,
            `当前库存：${userData.netbar.inventory[itemName].quantity}个\n`,
            `建议售价：${item.price}元\n`,
            "\n💡 库存管理提示：\n",
            "1. 注意保质期管理\n",
            "2. 及时补充热销商品\n",
            "3. 控制库存积压\n",
            "4. 合理定价获取利润"
        ].join(''));
    }

    async checkInventory(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'netbar', 'inventory');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        // 获取用户数据
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));

        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            e.reply("数据异常，请联系管理员！");
            return;
        }

        // 检查是否有网吧
        if (!userData.netbar) {
            e.reply("你还没有网吧！请先创建一家网吧。");
            return;
        }

        // 检查是否有库存数据
        if (!userData.netbar.inventory || Object.keys(userData.netbar.inventory).length === 0) {
            e.reply("当前没有任何库存！请使用 #进货 命令购入商品。");
            return;
        }

        setCooldown(e.user_id, 'netbar', 'inventory');

        // 发送库存信息
        e.reply([
            "📊 当前库存状况\n",
            "\n饮料类：",
            ...Object.entries(userData.netbar.inventory)
                .filter(([name]) => ['可乐', '雪碧', '矿泉水', '咖啡', '奶茶', '茶'].includes(name))
                .map(([name, data]) => 
                    `\n${name}：${data.quantity}个 | 售价：${data.price}元 | 销量：${data.sales}个`
                ),
            "\n\n零食类：",
            ...Object.entries(userData.netbar.inventory)
                .filter(([name]) => ['薯片', '面包', '饼干'].includes(name))
                .map(([name, data]) => 
                    `\n${name}：${data.quantity}个 | 售价：${data.price}元 | 销量：${data.sales}个`
                ),
            "\n\n主食类：",
            ...Object.entries(userData.netbar.inventory)
                .filter(([name]) => ['泡面', '盒饭', '三明治'].includes(name))
                .map(([name, data]) => 
                    `\n${name}：${data.quantity}个 | 售价：${data.price}元 | 销量：${data.sales}个`
                ),
            "\n\n💡 库存提示：",
            "\n1. 库存量低于20%建议及时补货",
            "\n2. 关注销量调整进货策略",
            "\n3. 注意高销量商品的库存"
        ].join(''));
    }

    async orderFood(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'netbar', 'order');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        // 获取用户数据
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));

        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            e.reply("数据异常，请联系管理员！");
            return;
        }

        // 检查是否有网吧
        if (!userData.netbar) {
            e.reply("你还没有网吧！请先创建一家网吧。");
            return;
        }

        const params = e.msg.replace('#点餐', '').trim().split(' ');
        if (params.length !== 3) {
            e.reply([
                "格式错误！正确格式：#点餐 [座位号/包间ID] [商品名] [数量]\n",
                "\n使用 #餐饮菜单 查看可点商品"
            ].join(''));
            return;
        }

        const [location, itemName, quantity] = params;
        const quantityNum = parseInt(quantity);

        if (isNaN(quantityNum) || quantityNum <= 0) {
            e.reply("点餐数量必须是大于0的数字！");
            return;
        }

        // 检查库存
        if (!userData.netbar.inventory || !userData.netbar.inventory[itemName]) {
            e.reply("该商品暂无库存！");
            return;
        }

        const inventory = userData.netbar.inventory[itemName];
        if (inventory.quantity < quantityNum) {
            e.reply(`库存不足！当前${itemName}仅剩${inventory.quantity}个。`);
            return;
        }

        // 计算总价
        const totalPrice = inventory.price * quantityNum;

        // 更新数据
        inventory.quantity -= quantityNum;
        inventory.sales += quantityNum;
        inventory.revenue += totalPrice;
        userData.netbar.income += totalPrice;

        // 记录订单
        if (!userData.netbar.orders) {
            userData.netbar.orders = [];
        }
        userData.netbar.orders.push({
            id: `ORDER${Date.now().toString(36).toUpperCase()}`,
            location: location,
            item: itemName,
            quantity: quantityNum,
            price: totalPrice,
            time: new Date().toISOString()
        });
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'netbar', 'order');
        e.reply([
            `🍽️ 点餐成功！\n`,
            `位置：${location}\n`,
            `商品：${itemName}\n`,
            `数量：${quantityNum}个\n`,
            `总价：${totalPrice}元\n`,
            `剩余库存：${inventory.quantity}个\n`,
            "\n💡 服务提示：\n",
            "1. 请保持环境整洁\n",
            "2. 使用完及时收拾\n",
            "3. 如需加单请重新点餐\n",
            "4. 祝您用餐愉快"
        ].join(''));
    }

    async showMenu(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'netbar', 'menu');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        // 获取用户数据
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));

        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            e.reply("数据异常，请联系管理员！");
            return;
        }

        // 检查是否有网吧
        if (!userData.netbar) {
            e.reply("你还没有网吧！请先创建一家网吧。");
            return;
        }

        setCooldown(e.user_id, 'netbar', 'menu');

        // 获取库存信息
        const inventory = userData.netbar.inventory || {};
        e.reply([
            "🍽️ 网吧餐饮菜单\n",
            "\n🥤 饮料：",
            ...Object.entries(inventory)
                .filter(([name]) => ['可乐', '雪碧', '矿泉水', '咖啡', '奶茶', '茶'].includes(name))
                .map(([name, data]) => 
                    `\n${name}：${data.price}元${data.quantity > 0 ? '' : ' (已售罄)'}`
                ),
            "\n\n🍪 零食：",
            ...Object.entries(inventory)
                .filter(([name]) => ['薯片', '面包', '饼干'].includes(name))
                .map(([name, data]) => 
                    `\n${name}：${data.price}元${data.quantity > 0 ? '' : ' (已售罄)'}`
                ),
            "\n\n🍜 主食：",
            ...Object.entries(inventory)
                .filter(([name]) => ['泡面', '盒饭', '三明治'].includes(name))
                .map(([name, data]) => 
                    `\n${name}：${data.price}元${data.quantity > 0 ? '' : ' (已售罄)'}`
                ),
            "\n\n💡 点餐说明：",
            "\n1. 使用 #点餐 [座位号/包间ID] [商品名] [数量] 进行点餐",
            "\n2. VIP包间可享受送餐服务",
            "\n3. 部分商品需要等待时间",
            "\n4. 请保持环境整洁"
        ].join(''));
    }

    async setPrice(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'netbar', 'price');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        // 获取用户数据
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            e.reply("数据异常，请联系管理员！");
            return;
        }
        if (!userData.netbar) {
            e.reply("你还没有网吧！请先创建一家网吧。");
            return;
        }
        const params = e.msg.replace('#设置价格', '').trim().split(' ');
        if (params.length !== 2) {
            e.reply([
                "格式错误！正确格式：#设置价格 [商品名] [新价格]\n",
                "\n当前价格：",
                ...Object.entries(userData.netbar.inventory || {})
                    .map(([name, data]) => `\n${name}：${data.price}元`)
            ].join(''));
            return;
        }

        const [itemName, newPrice] = params;
        const priceNum = parseFloat(newPrice);

        if (isNaN(priceNum) || priceNum <= 0) {
            e.reply("价格必须是大于0的数字！");
            return;
        }
        if (!userData.netbar.inventory || !userData.netbar.inventory[itemName]) {
            e.reply("未找到该商品！");
            return;
        }

        // 更新价格
        const oldPrice = userData.netbar.inventory[itemName].price;
        userData.netbar.inventory[itemName].price = priceNum;
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'netbar', 'price');
        e.reply([
            `💰 商品价格已更新！\n`,
            `商品：${itemName}\n`,
            `原价：${oldPrice}元\n`,
            `新价：${priceNum}元\n`,
            `成本：${userData.netbar.inventory[itemName].cost}元\n`,
            `利润率：${((priceNum - userData.netbar.inventory[itemName].cost) / userData.netbar.inventory[itemName].cost * 100).toFixed(1)}%\n`,
            "\n💡 定价建议：\n",
            "1. 保持合理利润空间\n",
            "2. 关注竞争对手价格\n",
            "3. 考虑客户接受度\n",
            "4. 适时调整促销策略"
        ].join(''));
    }

    async foodStats(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'netbar', 'food_stats');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        // 获取用户数据
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            e.reply("数据异常，请联系管理员！");
            return;
        }

        // 检查是否有网吧
        if (!userData.netbar) {
            e.reply("你还没有网吧！请先创建一家网吧。");
            return;
        }

        // 计算统计数据
        const inventory = userData.netbar.inventory || {};
        const orders = userData.netbar.orders || [];

        let totalRevenue = 0;
        let totalCost = 0;
        let totalSales = 0;
        let bestSeller = { name: "无", sales: 0 };
        let mostRevenue = { name: "无", revenue: 0 };

        for (const [name, data] of Object.entries(inventory)) {
            totalRevenue += data.revenue || 0;
            totalCost += data.cost * data.sales || 0;
            totalSales += data.sales || 0;

            if (data.sales > (bestSeller.sales || 0)) {
                bestSeller = { name, sales: data.sales };
            }
            if (data.revenue > (mostRevenue.revenue || 0)) {
                mostRevenue = { name, revenue: data.revenue };
            }
        }

        // 计算今日订单
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(order => 
            order.time.startsWith(today)
        );
        setCooldown(e.user_id, 'netbar', 'food_stats');
        e.reply([
            "📊 餐饮经营统计\n",
            "\n💰 收益统计：",
            `\n总收入：${totalRevenue}元`,
            `\n总成本：${totalCost}元`,
            `\n净利润：${totalRevenue - totalCost}元`,
            `\n利润率：${((totalRevenue - totalCost) / totalCost * 100).toFixed(1)}%`,
            "\n\n📈 销售统计：",
            `\n总销量：${totalSales}个`,
            `\n今日订单：${todayOrders.length}单`,
            `\n销量冠军：${bestSeller.name} (${bestSeller.sales}个)`,
            `\n收入冠军：${mostRevenue.name} (${mostRevenue.revenue}元)`,
            "\n\n🔍 库存状况：",
            ...Object.entries(inventory)
                .filter(([, data]) => data.quantity < 10)
                .map(([name, data]) => `\n${name}库存不足：${data.quantity}个`),
            "\n\n💡 经营建议：",
            "\n1. 关注高销量商品库存",
            "\n2. 及时调整商品价格",
            "\n3. 注意控制成本支出",
            "\n4. 保持商品新鲜度"
        ].join(''));
    }
}