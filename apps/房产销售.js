import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import {
    saveUserData,
    loadAllUsers,
    generateWeapons,
    checkUserData,
    readConfiguration,
} from '../function/function.js';

// 玩家数据文件路径
const PLUGIN_PATH = path.join(path.resolve(), 'plugins', 'sims-plugin');
const PROPERTY_STORE_FILE_PATH = path.join(PLUGIN_PATH, 'data', 'property_store.json');

export class UserStart extends plugin {
    constructor() {
        super({
            name: 'UserStart',
            dsc: '游戏开始',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#看房$',
                    fnc: 'ViewProperties',
                },
                {
                    reg: '^#买房 (.*) (一次性|分期)$',
                    fnc: 'BuyHouse',
                },
                {
                    reg: '^#卖房$',
                    fnc: 'SellHouse',
                },
                {
                    reg: '^#出租房屋$',
                    fnc: 'RentHouse',
                },
                {
                    reg: '^#设置租金 (\\d+)$',
                    fnc: 'SetRent',
                },
                {
                    reg: '^#维护房屋$',
                    fnc: 'MaintainHouse',
                },
                {
                    reg: '^#装修房屋 (\\d+)$',
                    fnc: 'RenovateHouse',
                },
                {
                    reg: '^#随机租客事件$',
                    fnc: 'DynamicTenantEvent',
                },
                {
                    reg: '^#智能AI助手$',
                    fnc: 'SmartAIAdvisor',
                },
                {
                    reg: '^#资产评估$',
                    fnc: 'AssetAssessment',
                },
                {
                    reg: '^#融资建议$',
                    fnc: 'FinancingAdvice',
                },
                {
                    reg: '^#房产投资挑战$',
                    fnc: 'InvestmentChallenge',
                },
                {
                    reg: '^#物业设定$',
                    fnc: 'PropertySettings',
                },
                {
                    reg: '^#资产收益目标 (\\d+)$',
                    fnc: 'SetRevenueGoal',
                },
                {
                    reg: '^#出租合同$',
                    fnc: 'RentalContract',
                },
                {
                    reg: '^#租客节日活动$',
                    fnc: 'TenantFestivalEvent',
                },
                {
                    reg: '^#租客评价$',
                    fnc: 'TenantFeedback',
                }
            ],
        });

        this.task = {
            cron: '*/10 * * * *', // 每10分钟执行一次
            name: 'DynamicMarket',
            fnc: () => this.updateMarketPrices(),
        };
    }

    async ViewProperties(e) {
        const properties = JSON.parse(fs.readFileSync(PROPERTY_STORE_FILE_PATH));
        const propertyList = properties.map(p => 
            `名称: ${p.name}, 类型: ${p.type}, 价格: ${p.price}, 面积: ${p.size}, 描述: ${p.description}`
        ).join("\n");
        e.reply(`可看房源:\n${propertyList}`);
    }

    async BuyHouse(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const [propertyName, paymentMethod] = e.msg.replace('#买房 ', '').trim().split(' ');

        const properties = JSON.parse(fs.readFileSync(PROPERTY_STORE_FILE_PATH));
        const property = properties.find(p => p.name === propertyName);

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        if (!property) {
            e.reply("找不到该房源，请检查房源名称。");
            return;
        }

        if (paymentMethod === "一次性") {
            if (user.money < property.price) {
                e.reply(`购买该房产需要${property.price}元，你的钱不足！`);
                return;
            }
            user.money -= property.price; // 扣除房屋全款
            user.property = property; // 记录玩家所购房产
            await saveUserData(userId, user);
            e.reply(`成功以一次性付款购买房产: ${property.name}`);
        } else if (paymentMethod === "分期") {
            const downPayment = property.price * 0.3; // 假设首付30%
            if (user.money < downPayment) {
                e.reply(`分期付款的首付为${downPayment}元，你的钱不足！`);
                return;
            }
            user.money -= downPayment; // 扣除首付
            user.property = { ...property, isFinanced: true }; // 记录购房融资信息
            user.property.remainingDebt = property.price - downPayment; // 剩余债务
            user.property.monthlyPayment = user.property.remainingDebt / 12; // 12个月分期
            await saveUserData(userId, user);
            e.reply(`成功通过分期付款方式购买房产: ${property.name}，剩余债务为${user.property.remainingDebt}元，月供为${user.property.monthlyPayment}元。`);
        } else {
            e.reply("请选择有效的付款方式：一次性或分期。");
        }
    }

    async SellHouse(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        if (!user.property) {
            e.reply("你没有房产可以出售！");
            return;
        }

        user.money += user.property.price; // 回收房产价值
        const soldProperty = user.property.name;
        user.property = null; // 清除房产记录
        await saveUserData(userId, user);
        e.reply(`成功出售房产: ${soldProperty}，并获得${user.property.price}元。`);
    }

    async RentHouse(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        if (!user.property) {
            e.reply("你没有房产可以出租！");
            return;
        }

        const rentPrice = user.property.price * 0.1; // 租金设定为房产价格的10%
        e.reply(`房产: ${user.property.name} 已成功出租，租金为${rentPrice}元。`);
        user.money += rentPrice; // 租金收入
        await saveUserData(userId, user);
    }

    async SetRent(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const rentPrice = parseInt(e.msg.match(/#设置租金 (\d+)/)[1]);

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        if (!user.property) {
            e.reply("你没有房产可以设置租金！");
            return;
        }
        
        user.property.rentPrice = rentPrice;
        e.reply(`房产: ${user.property.name} 的租金已设置为${rentPrice}元。`);
        await saveUserData(userId, user);
    }

    async MaintainHouse(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        if (!user.property) {
            e.reply("你没有房产需要维护！");
            return;
        }

        const maintenanceCost = 200; // 假设维修费用为200元
        if (user.money < maintenanceCost) {
            e.reply("你的钱不足，无法进行房产维护！");
            return;
        }

        user.money -= maintenanceCost; // 扣除维护费用
        e.reply(`房产: ${user.property.name} 已成功维护，费用为${maintenanceCost}元。`);
        await saveUserData(userId, user);
    }

    async RenovateHouse(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const renovationCost = parseInt(e.msg.match(/#装修房屋 (\d+)/)[1]);

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        if (!user.property) {
            e.reply("你没有房产可以装修！");
            return;
        }
        if (user.money < renovationCost) {
            e.reply(`装修费用为${renovationCost}元，你的钱不足！`);
            return;
        }

        user.money -= renovationCost; // 扣除装修费用
        user.property.price += renovationCost * 0.5; // 装修提升房产价值
        e.reply(`房产: ${user.property.name} 已成功装修，费用为${renovationCost}元，房产价值提升！`);
        await saveUserData(userId, user);
    }

    async DynamicTenantEvent(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        if (!user.property) {
            e.reply("你没有房产可以出租！");
            return;
        }

        const events = [
            "租客投诉，要求降低租金。",
            "租客续租，愿意继续租住。",
            "租客提前解除租约，需寻找新租客。",
            "租客推迟付款，再给他们两天时限。",
            "租客反馈，要求改善物业设施。"
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        e.reply(`发生的事件: ${event}`);
        // 动态租客事件的互动逻辑
        if (event === "租客投诉，要求降低租金。") {
            user.property.rentPrice = user.property.rentPrice * 0.9;
            e.reply(`由于投诉，房产: ${user.property.name} 的租金已降低至${user.property.rentPrice}元。`);
        } else if (event === "租客续租，愿意继续租住。") {
            e.reply(`租客选择续租，非常感谢！`);
        } else if (event === "租客提前解除租约，需寻找新租客。") {
            e.reply(`租客解除租约，你需要尽快找到新的租客。`);
        } else if (event === "租客推迟付款，再给他们两天时限。") {
            e.reply(`租客推迟付款，给他们两天的宽限期。`);
        } else if (event === "租客反馈，要求改善物业设施。") {
            e.reply(`租客希望物业提供更好的设施，考虑进行整改。`);
            // 这里可以引入维护费用或改善设施选项
        }
    }

    async SmartAIAdvisor(e) {
        e.reply("欢迎来到智能AI助手！\n我可以为你提供帮助：\n1. 输入 #资产评估 进行资产评估。\n2. 输入 #房产投资建议 获取投资建议。\n3. 输入 #融资建议 获取融资选项。");
    }

    async AssetAssessment(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        
        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }

        if (!user.property) {
            e.reply("你没有房产进行评估！");
            return;
        }

        e.reply(`资产评估报告:\n房产名称: ${user.property.name}\n当前价值: ${user.property.price}元\n租金: ${user.property.rentPrice}元`);
    }

    async FinancingAdvice(e) {
        e.reply("融资建议:\n1. 考虑银行贷款，利率较低。\n2. 寻找投资者，分担压力。\n3. 可通过信用卡进行灵活融资。");
    }

    async InvestmentChallenge(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        
        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }

        if (user.property && user.property.isFinanced) {
            e.reply("挑战目标是：确保在12个月内偿还贷款。加油哦！");
        } else {
            e.reply("挑战目标是：达成一定的租金收入，例如：每月租金收入达到500元。");
        }
    }

    async updateMarketPrices() {
        const properties = JSON.parse(fs.readFileSync(PROPERTY_STORE_FILE_PATH));
        for (const property of properties) {
            const priceChange = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5000); // 随机增减5000元
            property.price += priceChange;

            // 确保价格不小于0
            if (property.price < 0) {
                property.price = 0;
            }
        }
        fs.writeFileSync(PROPERTY_STORE_FILE_PATH, JSON.stringify(properties, null, 2));
    }

    async update() {
        const allUsers = await loadAllUsers();
        for (const userId in allUsers) {
            const user = allUsers[userId];
            // 更新每个用户的分期房屋状态，假设每个月进行一次还款
            if (user.property && user.property.isFinanced) {
                user.property.remainingDebt -= user.property.monthlyPayment;
                if (user.property.remainingDebt <= 0) {
                    user.property.isFinanced = false; // 清空债务标记
                    user.property.remainingDebt = 0; // 确保没有负债
                    e.reply(`你已完成房产 ${user.property.name} 的所有款项，感谢您的合作！`);
                }
            }
            await saveUserData(userId, user);
        }
    }
}

generateWeapons();
