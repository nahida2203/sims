import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import {
    saveUserData,
    loadAllUsers,
    checkUserData,
} from '../function/function.js';
const PLUGIN_PATH = path.join(path.resolve(), 'plugins', 'sims-plugin');
const USER_LEVELS = {
    NORMAL: '普通会员',
    GOLD: '黄金会员',
    DIAMOND: '钻石会员'
};
export class ToyStore extends plugin {
    constructor() {
        super({
            name: 'ToyStore',
            dsc: 'Toy Store Functionality',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#玩具商店$', fnc: 'showToys' },
                { reg: '^#分类玩具 (.+)$', fnc: 'showCategoryToys' },
                { reg: '^#购买玩具 (.+)$', fnc: 'buyToy' },
                { reg: '^#回收玩具 (.+)$', fnc: 'recycleToy' },
                { reg: '^#参与亲子活动$', fnc: 'joinParentChildEvent' },
                { reg: '^#查看会员积分$', fnc: 'checkMembershipPoints' },
                { reg: '^#租赁玩具 (.+)$', fnc: 'rentToy' },
                { reg: '^#应聘店员$', fnc: 'applyForStaff' },
                { reg: '^#发布招募信息 (.+)$', fnc: 'postRecruitmentInfo' },
                { reg: '^#反馈 (.+)$', fnc: 'feedback' },
                { reg: '^#限时折扣 (.+)$', fnc: 'limitedTimeDiscount' },
                { reg: '^#二手市场$', fnc: 'showSecondHandMarket' },
                { reg: '^#积分兑换 (.+)$', fnc: 'exchangePoints' },
                { reg: '^#发起售后 (.+)$', fnc: 'initiateAfterSales' },
                { reg: '^#撤销售后$', fnc: 'withdrawAfterSales' },
                { reg: '^#给好评 (.+)$', fnc: 'givePositiveFeedback' },
                { reg: '^#给差评 (.+)$', fnc: 'giveNegativeFeedback' },
                { reg: '^#升级店铺$', fnc: 'upgradeStore' },
                { reg: '^#查看客户等级$', fnc: 'checkUserLevel' },
                { reg: '^#装修店面$', fnc: 'decorateStore' },
            ],
        });
        this.task = {
            cron: '0 0 * * *', // 每天零点执行一次
            name: 'ToyStorePromotionTask',
            fnc: () => this.updateStore(),
        };
    }

    async showToys(e) {
        try {
            const toys = JSON.parse(fs.readFileSync(path.join(PLUGIN_PATH, 'toystore_inventory.json')));
            const toyList = toys.map(t => `名称: ${t.name}, 类型: ${t.type}, 价格: ${t.price}, 品质: ${t.quality}`).join("\n");
            e.reply(`玩具商店商品:\n${toyList}`);
        } catch (error) {
            e.reply("读取玩具库存失败，请稍后再试。");
            console.error(error);
        }
    }

    async showCategoryToys(e) {
        const category = e.msg.replace('#分类玩具', '').trim();
        try {
            const toys = JSON.parse(fs.readFileSync(path.join(PLUGIN_PATH, 'toystore_inventory.json')));
            const filteredToys = toys.filter(t => t.type === category);
            if (filteredToys.length === 0) {
                e.reply(`没有找到类别为 ${category} 的玩具。`);
                return;
            }
            const toyList = filteredToys.map(t => `名称: ${t.name}, 价格: ${t.price}, 品质: ${t.quality}`).join("\n");
            e.reply(`类别 ${category} 的玩具:\n${toyList}`);
        } catch (error) {
            e.reply("读取玩具库存失败，请稍后再试。");
            console.error(error);
        }
    }

    async buyToy(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const toyName = e.msg.replace('#购买玩具', '').trim();
        try {
            const toys = JSON.parse(fs.readFileSync(path.join(PLUGIN_PATH, 'toystore_inventory.json')));
            const toy = toys.find(t => t.name === toyName);
            if (!user) {
                e.reply("请先开始模拟人生！");
                return;
            }
            if (!toy) {
                e.reply("该玩具不存在，请查看玩具商店中可用的商品。");
                return;
            }
    
            // 更新客户等级
            await this.updateUserLevel(user);
    
            // 根据用户等级应用折扣
            let discount = toy.price; // 默认价格
            if (user.level === USER_LEVELS.DIAMOND) {
                discount = toy.price * 0.6; // 6折优惠
            } else if (user.level === USER_LEVELS.GOLD) {
                discount = toy.price * 0.8; // 8折优惠
            }
    
            if (user.money < discount) {
                e.reply("你的资金不足，无法购买该玩具。");
                return;
            }
    
            user.money -= discount;
            user.backpack.push(toy);
            await saveUserData(userId, user);
            e.reply(`成功购买玩具: ${toy.name}，使用优惠后价格为: ${discount}元。你的客户等级为: ${user.level}`);
        } catch (error) {
            e.reply("购买玩具失败，请稍后再试。");
            console.error(error);
        }
    }

    async recycleToy(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const toyName = e.msg.replace('#回收玩具', '').trim();
        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        const toyIndex = user.backpack.findIndex(t => t.name === toyName);
        if (toyIndex === -1) {
            e.reply("你没有该玩具，无法进行回收。");
            return;
        }
        const toyValue = Math.floor(user.backpack[toyIndex].price * 0.5); // Recycle value is 50%
        user.money += toyValue;
        user.backpack.splice(toyIndex, 1);
        await saveUserData(userId, user);
        e.reply(`成功回收玩具: ${toyName}，获得了${toyValue}元。`);
    }

    async joinParentChildEvent(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        const reward = Math.floor(Math.random() * 100 + 50); // Random reward between 50 and 150
        user.money += reward;
        await saveUserData(userId, user);
        e.reply(`你参加了亲子活动，获得了${reward}元奖励！`);
    }

    async checkMembershipPoints(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        e.reply(`你的会员积分为: ${user.points}`);
    }

    async rentToy(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const toyName = e.msg.replace('#租赁玩具', '').trim();
        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        try {
            const toys = JSON.parse(fs.readFileSync(path.join(PLUGIN_PATH, 'toystore_inventory.json')));
            const toy = toys.find(t => t.name === toyName);
            if (!toy) {
                e.reply("该玩具不存在，无法租赁。");
                return;
            }
            const rentalCost = Math.floor(toy.price * 0.1);
            if (user.money < rentalCost) {
                e.reply("你的资金不足，无法租赁该玩具。");
                return;
            }
            user.money -= rentalCost;
            await saveUserData(userId, user);
            e.reply(`成功租赁玩具: ${toy.name}，租赁费用为${rentalCost}元。`);
        } catch (error) {
            e.reply("租赁玩具失败，请稍后再试。");
            console.error(error);
        }
    }

    async applyForStaff(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        // Assume direct acceptance for the application
        user.isStaff = true;
        await saveUserData(userId, user);
        e.reply("你已成功应聘为玩具店店员！");
    }

    async postRecruitmentInfo(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        if (!user || !user.isManager) {
            e.reply("只有店长可以发布招募信息。");
            return;
        }
        const info = e.msg.replace('#发布招募信息', '').trim();
        console.log(`Recruitment information posted: ${info}`);
        e.reply("招募信息已发布！内容为: " + info);
    }

    async feedback(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        if (user && (user.isStaff || user.isManager)) {
            e.reply("店员和店长无法反馈。");
            return;
        }
        const feedbackMessage = e.msg.replace('#反馈', '').trim();
        console.log(`Customer feedback: ${feedbackMessage}`);
        e.reply("反馈已提交，谢谢你的意见！");
    }

    async limitedTimeDiscount(e) {
        const toyName = e.msg.replace('#限时折扣', '').trim();
        try {
            const toys = JSON.parse(fs.readFileSync(path.join(PLUGIN_PATH, 'toystore_inventory.json')));
            const toy = toys.find(t => t.name === toyName);
            if (toy) {
                toy.price = Math.floor(toy.price * 0.7); // 30% discount
                await saveUserData(e.user_id, toys);
                e.reply(`玩具 ${toy.name} 现在享受限时折扣，现价为 ${toy.price} 元！`);
            } else {
                e.reply("该玩具不存在！");
            }
        } catch (error) {
            e.reply("设置限时折扣失败，请稍后再试。");
            console.error(error);
        }
    }

    async showSecondHandMarket(e) {
        try {
            const secondHandItems = JSON.parse(fs.readFileSync(path.join(PLUGIN_PATH, 'second_hand_market.json')));
            const itemList = secondHandItems.map(item => `名称: ${item.name}, 价格: ${item.price}`).join("\n");
            e.reply(`二手市场商品:\n${itemList}`);
        } catch (error) {
            e.reply("读取二手市场数据失败，请稍后再试。");
            console.error(error);
        }
    }

    async exchangePoints(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const itemName = e.msg.replace('#积分兑换', '').trim();
        const redeemableItems = {
            '玩具小熊': 200,
            '拼图游戏': 150,
        };
        if (redeemableItems[itemName]) {
            if (user.points >= redeemableItems[itemName]) {
                user.points -= redeemableItems[itemName];
                await saveUserData(userId, user);
                e.reply(`成功兑换商品: ${itemName}，剩余积分: ${user.points}`);
            } else {
                e.reply("你的积分不足，无法兑换该商品。");
            }
        } else {
            e.reply("该商品不存在或无法兑换。");
        }
    }

    async updateStore() {
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1; // Get current month
        const seasonalPromotions = {
            12: "圣诞节促销",
            6: "儿童节打折",
        };
        if (seasonalPromotions[month]) {
            const allUsers = await loadAllUsers();
            for (const userId in allUsers) {
                const user = allUsers[userId];
                user.isSeasonalPromotion = true;
                await saveUserData(userId, user);
            }
        }
    }

    async initiateAfterSales(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const toyName = e.msg.replace('#发起售后', '').trim();
        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        const toyIndex = user.backpack.findIndex(t => t.name === toyName);
        if (toyIndex === -1) {
            e.reply("你没有该玩具，无法进行售后。");
            return;
        }
        if (!this.requests) {
            this.requests = {}; 
        }
        if (!this.requests[userId]) {
            this.requests[userId] = [];
        }
        this.requests[userId].push(toyName);
        e.reply(`已发起售后请求，玩具: ${toyName}。请确认退货或换货。`);
    }

    async withdrawAfterSales(e) {
        const userId = e.user_id;
        if (this.requests && this.requests[userId] && this.requests[userId].length > 0) {
            const cancelledRequest = this.requests[userId].pop();
            e.reply(`售后请求已撤销，玩具: ${cancelledRequest}。`);
        } else {
            e.reply("你没有任何待处理的售后请求。");
        }
    }

    async givePositiveFeedback(e) {
        const userId = e.user_id;
        const toyName = e.msg.replace('#给好评', '').trim();
        const user = await checkUserData(userId);
        if (user.backpack.findIndex(t => t.name === toyName) === -1) {
            e.reply("你没有购买该玩具，无法给好评。");
            return;
        }
        e.reply("感谢你对玩具的好评！");
    }

    async giveNegativeFeedback(e) {
        const userId = e.user_id;
        const toyName = e.msg.replace('#给差评', '').trim();
        const user = await checkUserData(userId);
        if (user.backpack.findIndex(t => t.name === toyName) === -1) {
            e.reply("你没有购买该玩具，无法给差评。");
            return;
        }
        e.reply("感谢你的反馈，我们会努力改进！");
    }

    async upgradeStore(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        if (!user || !user.isManager) {
            e.reply("只有店长可以进行店铺升级。");
            return;
        }
        const upgradeCost = 500; // Store upgrade cost
        if (user.money < upgradeCost) {
            e.reply("你的资金不足，无法进行店铺升级。");
            return;
        }
        user.money -= upgradeCost;
        await saveUserData(userId, user);
        e.reply("店铺已成功升级！");
    }

    async checkUserLevel(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }
        await this.updateUserLevel(user); // 确保最新的等级被应用
        e.reply(`你的客户等级为: ${user.level}`);
    }
    async decorateStore(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        if (!user || !user.isManager) {
            e.reply("只有店长可以装修店面。");
            return;
        }
        e.reply("店面已装修！");
    }
    async updateUserLevel(user) {
        if (user.points >= 1000) {
            user.level = USER_LEVELS.DIAMOND;
        } else if (user.points >= 500) {
            user.level = USER_LEVELS.GOLD;
        } else {
            user.level = USER_LEVELS.NORMAL;
        }
        await saveUserData(user.user_id, user); // 保存更新后的用户数据
    }
}
