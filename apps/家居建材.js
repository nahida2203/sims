import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import {
    saveUserData,
    loadAllUsers,
    saveBanData,
    checkUserData,
} from '../function/function.js';

const PLUGIN_PATH = path.join(path.resolve(), 'plugins', 'sims-plugin');
const SALES_RECORDS_FILE_PATH = path.join(PLUGIN_PATH, 'sales_records.json');
const BLUEPRINTS_FILE_PATH = path.join(PLUGIN_PATH, 'blueprints.json');
export class UserStart extends plugin {
    constructor() {
        super({
            name: 'UserStart',
            dsc: '游戏开始',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#应聘家具店店员$',
                    fnc: 'Apply_furniture_clerk',
                },
                {
                    reg: '^#升级为家具店店主$',
                    fnc: 'Apply_furniture_owner',
                },
                {
                    reg: '^#出售家具.*$',
                    fnc: 'Sell_furniture',
                },
                {
                    reg: '^#家具进货$',
                    fnc: 'Restock_furniture',
                },
                {
                    reg: '^#查看家具库存$',
                    fnc: 'View_inventory',
                },
                {
                    reg: '^#家具销售榜$',
                    fnc: 'Sales_rankings',
                },
                {
                    reg: '^#查看销售记录$',
                    fnc: 'View_sales_records',
                },
                {
                    reg: '^#家具店改名.*$',
                    fnc: 'Rename_store',
                },
                {
                    reg: '^#升级店铺$',
                    fnc: 'Upgrade_store',
                },{
                    reg: '^#制作家具.*$',
                    fnc: 'Craft_furniture',
                },
                {
                    reg: '^#查看家具蓝图$',
                    fnc: 'View_blueprints',
                },
                {
                    reg: '^#发工资$',
                    fnc: 'Pay_salary',
                }
            ],
        });
        this.task = {
			cron: '0 0 * * *',
			name: 'Task',
			fnc: () => this.scheduleAutoSalaryPayment(),
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
    async Apply_furniture_clerk(e) {
        // 基础检查部分保持不变
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
    
        // 封禁检查
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
    
        // 工作状态检查
        if (user.job === "家具店店员" || user.job === "家具店店主") {
            e.reply("亲爱的，你已经在家具店工作啦~要继续加油哦！");
            return;
        }
    
        // 基本条件检查
        if (!user) {
            e.reply("请先开始模拟人生哦~");
            return;
        }
    
        if (user.level < 15) {
            e.reply("等级需要达到15级才能应聘家具店店员呢~继续加油！");
            return;
        }
    
        // 整合所有店铺相关信息
        user.店铺信息 = {
            基础信息: {
                店铺名称: "梦幻家具屋",
                店铺等级: 1,
                店铺类型: "精品家具店",
                开业时间: new Date().toLocaleDateString(),
                营业状态: "营业中",
                店铺评级: "C",
                信誉度: 60,
                人气值: 0
            },
            
            环境信息: {
                店铺装修度: 60,
                店铺清洁度: 100,
                店铺舒适度: 70,
                采光评级: "良好",
                空间布局: "标准",
                装饰风格: "简约现代",
                环境氛围: "温馨"
            },
    
            经营数据: {
                营业额: 0,
                日均流水: 0,
                顾客总数: 0,
                会员数量: 0,
                好评率: 100,
                差评率: 0,
                投诉次数: 0
            },
    
            员工信息: {
                工号: `${Math.floor(Math.random() * 10000)}号`,
                职位: "实习店员",
                入职时间: new Date().toLocaleDateString(),
                工作状态: "实习期",
                考核评级: "待评定",
                业绩指标: 0,
                服务评分: 80
            },
    
            技能体系: {
                基础技能: {
                    销售技巧: 1,
                    沟通能力: 1,
                    商品知识: 1,
                    顾客服务: 1,
                    展示布置: 1
                },
                进阶技能: {
                    设计搭配: 0,
                    空间规划: 0,
                    风格鉴赏: 0,
                    材质判断: 0,
                    家具保养: 0
                },
                特殊技能: {
                    谈判能力: 0,
                    危机处理: 0,
                    团队协作: 0,
                    创新思维: 0
                }
            },
    
            成长系统: {
                经验值: 0,
                技能点: 0,
                成长阶段: "新手期",
                解锁成就: [],
                获得徽章: ["新人徽章"],
                专属天赋: [],
                培训记录: []
            },
    
            社交关系: {
                同事关系: {},
                顾客好感: 0,
                人脉网络: [],
                社交评价: "友好",
                互动记录: []
            },
    
            着装系统: {
                当前制服: {
                    名称: "甜美淑女制服",
                    样式: "浅蓝色连衣裙",
                    舒适度: 90,
                    魅力加成: 5,
                    清洁度: 100,
                    耐久度: 100,
                    搭配评分: 85,
                    特殊效果: "提升顾客好感度"
                },
                制服收藏: [],
                饰品搭配: [],
                妆容搭配: "清新淡妆"
            },
    
            福利待遇: {
                基础工资: 2000,
                提成比例: 0.05,
                社会保险: "已缴纳",
                带薪假期: 5,
                节日福利: true,
                培训机会: true,
                晋升通道: "已开启"
            },
    
            每日任务: {
                当前任务: [],
                完成数量: 0,
                任务积分: 0,
                连续完成: 0,
                特殊奖励: []
            },
    
            商品管理: {
                库存容量: 50,
                当前库存: [],
                热销商品: [],
                滞销商品: [],
                商品分类: []
            }
        };
    
        // 生成可爱的入职通知
        const welcomeMsg = [
            "🌸～欢迎加入梦幻家具屋大家庭～🌸",
            "══════════════",
            "✨ 入职基本信息",
            `🎀 职位：${user.店铺信息.员工信息.职位}`,
            `🏪 店铺：${user.店铺信息.基础信息.店铺名称}`,
            `📝 工号：${user.店铺信息.员工信息.工号}`,
            "══════════════",
            "🎊 新人福利礼包",
            "• 获得专属甜美淑女制服",
            "• 解锁新手技能培训课程",
            "• 获得入职纪念徽章",
            "• 享受节日特别福利",
            "══════════════",
            "💝 温馨提示",
            "• 每天记得打卡签到哦",
            "• 保持甜美的微笑服务",
            "• 制服要保持整洁呢",
            "• 和同事友好相处啦",
            "══════════════",
            "🌟 成长攻略",
            "• 完成每日任务获得奖励",
            "• 参与培训提升技能等级",
            "• 收集徽章解锁特殊权限",
            "• 提升好感度获得推荐机会",
            "══════════════",
            "💌 店长寄语",
            "愿你在这里找到属于自己的精彩人生~",
            "让我们一起打造温馨的购物天地吧！"
        ].join("\n");
    
        // 更新玩家状态
        user.mood += 15;
        user.happiness += 10;
        user.charm += 5;
        user.job = "家具店店员";
    
        e.reply(welcomeMsg);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(user));
        await saveUserData(userId, user);
    }

    async Apply_furniture_owner(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        
        // 基础检查
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
    
        // 职业条件检查
        if (!user || user.job !== "家具店店员") {
            e.reply("只有家具店店员可以申请成为店主哦~先去当店员积累经验吧！");
            return;
        }
    
        // 升职条件检查
        if (user.level < 30) {
            e.reply("等级需要达到30级才能成为店主呢~继续加油！");
            return;
        }
    
        // 检查工作经验
        if (user.店铺信息.员工信息.工作时长 < 168) { // 至少工作7天
            e.reply("需要至少工作7天才能申请成为店主哦~继续积累经验吧！");
            return;
        }
    
        // 检查业绩表现
        if (user.店铺信息.经营数据.好评率 < 85) {
            e.reply("需要保持85%以上的好评率才能申请店主哦~继续提升服务质量吧！");
            return;
        }
    
        // 升职考核
        const examScore = await this.conductOwnershipExam(user);
        if (examScore < 80) {
            e.reply("店主考核未通过,继续努力哦~");
            return;
        }
    
        // 更新店主信息
        user.job = "家具店店主";
        user.店铺信息.店主信息 = {
            就任时间: new Date().toLocaleDateString(),
            管理等级: 1,
            威望值: 0,
            决策力: 60,
            领导力: 50,
            商业眼光: 40,
            管理技能: {
                人事管理: 1,
                财务管理: 1,
                运营管理: 1,
                市场营销: 1,
                危机处理: 1
            },
            特权: {
                招聘权限: true,
                定价权限: true,
                装修权限: true,
                采购权限: true
            },
            成就: [],
            贡献: 0
        };
    
        // 更新店铺信息
        user.店铺信息.基础信息.经营权限 = "已获得";
        user.店铺信息.基础信息.店主签名 = "新任店主";
        user.店铺信息.经营数据.开始经营时间 = new Date().toLocaleDateString();
    
        // 解锁新系统
        user.店铺信息.经营系统 = {
            日常经营: {
                营业额目标: 10000,
                客流量目标: 50,
                好评目标: 90,
                成本控制: 0.7
            },
            员工管理: {
                最大员工数: 5,
                当前员工: [],
                培训计划: [],
                绩效考核: []
            },
            财务管理: {
                营业收入: 0,
                营业支出: 0,
                利润率: 0,
                资金流动: "稳定"
            },
            市场营销: {
                推广方案: [],
                活动策划: [],
                会员体系: {
                    总会员数: 0,
                    会员等级: ["普通", "白银", "黄金", "钻石"],
                    会员权益: {}
                }
            },
            店铺升级: {
                当前等级: 1,
                升级条件: {
                    所需资金: 50000,
                    所需声望: 1000,
                    所需好评: 95
                },
                升级奖励: {
                    库存上限: "+20",
                    新增功能: "VIP室",
                    特殊权限: "跨店联营"
                }
            }
        };
    
        // 生成就任通知
        const promotionMsg = [
            "🌟～恭喜成为梦幻家具屋的新店主～🌟",
            "══════════════",
            "✨ 店主基本信息",
            `🎀 身份：${user.job}`,
            `🏪 店铺：${user.店铺信息.基础信息.店铺名称}`,
            `📝 就任时间：${user.店铺信息.店主信息.就任时间}`,
            "══════════════",
            "🎊 店主特权",
            "• 获得店铺完整经营权",
            "• 解锁高级管理功能",
            "• 开启员工招聘权限",
            "• 获得店铺装修权限",
            "══════════════",
            "💝 经营提示",
            "• 合理规划店铺发展",
            "• 注意员工培养哦",
            "• 记得制定营销方案",
            "• 保持良好的口碑",
            "══════════════",
            "🌟 发展规划",
            "• 制定合理的经营目标",
            "• 培养优秀的员工团队",
            "• 打造特色经营项目",
            "• 扩大店铺影响力",
            "══════════════",
            "💌 温馨提示",
            "作为店主要以身作则哦~",
            "让我们一起把店铺经营得更好吧！"
        ].join("\n");
    
        e.reply(promotionMsg);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(user));
        await saveUserData(userId, user);
    }
    
    // 店主考核系统
    async conductOwnershipExam(user) {
        let score = 0;
        
        // 基础分值(根据基础数据计算)
        score += Math.min(user.店铺信息.技能体系.基础技能.销售技巧 * 10, 20);
        score += Math.min(user.店铺信息.技能体系.基础技能.沟通能力 * 10, 20);
        score += Math.min(user.店铺信息.经营数据.好评率 * 0.3, 30);
        
        // 加分项
        if (user.店铺信息.成长系统.获得徽章.length >= 5) score += 10;
        if (user.店铺信息.经营数据.会员数量 >= 10) score += 10;
        if (user.店铺信息.技能体系.特殊技能.团队协作 >= 3) score += 10;
        
        return score;
    }

    async Sell_furniture(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
    
        // 基础检查
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
    
        // 职业检查
        if (!user || (user.job !== "家具店店员" && user.job !== "家具店店主")) {
            e.reply("只有家具店的员工才能销售家具哦~");
            return;
        }
    
        // 获取要销售的家具名称
        const furnitureName = e.msg.replace('#出售家具', '').trim();
        
        // 检查库存
        const itemIndex = user.店铺信息.商品管理.当前库存.findIndex(item => item.名称 === furnitureName);
        if (itemIndex === -1) {
            e.reply("抱歉呢,库存中没有这件家具~");
            return;
        }
    
        // 获取家具信息
        const item = user.店铺信息.商品管理.当前库存[itemIndex];
    
        // 销售流程模拟
        const saleResult = await this.processSale(user, item);
        if (!saleResult.success) {
            e.reply(saleResult.message);
            return;
        }
    
        // 更新库存
        user.店铺信息.商品管理.当前库存.splice(itemIndex, 1);
    
        // 更新销售数据
        user.店铺信息.经营数据.营业额 += saleResult.finalPrice;
        user.店铺信息.经营数据.日均流水 = (user.店铺信息.经营数据.日均流水 * 29 + saleResult.finalPrice) / 30;
        user.店铺信息.经营数据.顾客总数 += 1;
    
        // 更新员工数据
        if (user.job === "家具店店员") {
            user.店铺信息.员工信息.业绩指标 += saleResult.finalPrice;
            user.店铺信息.技能体系.基础技能.销售技巧 += 0.1;
            user.店铺信息.成长系统.经验值 += Math.floor(saleResult.finalPrice / 100);
        }
    
        // 生成销售记录
        const saleRecord = {
            商品名称: item.名称,
            成交价格: saleResult.finalPrice,
            原始价格: item.价格,
            销售时间: new Date().toLocaleString(),
            销售员: user.店铺信息.员工信息.工号,
            顾客评价: saleResult.customerFeedback,
            服务评分: saleResult.serviceScore,
            促销优惠: saleResult.discount,
            支付方式: saleResult.paymentMethod,
            是否会员: saleResult.isMember
        };
    
        // 记录销售历史
        if (!user.店铺信息.销售记录) {
            user.店铺信息.销售记录 = [];
        }
        user.店铺信息.销售记录.push(saleRecord);
    
        // 更新热销商品榜单
        this.updateHotSalesList(user, item);
    
        // 生成可爱的销售成功提示
        const saleMsg = [
            "🌟～完成一笔温馨的家具交易～🌟",
            "══════════════",
            "✨ 销售详情",
            `🛋️ 商品：${item.名称}`,
            `💰 成交价：${saleResult.finalPrice}元`,
            `💝 优惠：${saleResult.discount}`,
            `💕 顾客评价：${saleResult.customerFeedback}`,
            "══════════════",
            "🎊 获得奖励",
            `• 经验值 +${Math.floor(saleResult.finalPrice / 100)}`,
            `• 销售技巧 +0.1`,
            `• 服务评分 +${saleResult.serviceScore}`,
            "══════════════",
            "💌 温馨提示",
            "• 记得售后回访哦",
            "• 保持热情服务呢",
            "• 顾客的笑容就是最好的奖励~"
        ].join("\n");
    
        e.reply(saleMsg);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(user));
        await saveUserData(userId, user);
    }
    
    // 销售流程处理
    async processSale(user, item) {
        // 模拟销售流程
        const result = {
            success: true,
            finalPrice: item.价格,
            discount: "无",
            customerFeedback: "非常满意",
            serviceScore: 5,
            paymentMethod: "现金",
            isMember: false
        };
    
        // 随机生成顾客属性
        const customer = {
            预算: item.价格 * (0.8 + Math.random() * 0.4),
            议价能力: Math.random() * 100,
            心情: Math.random() * 100,
            对品质要求: Math.random() * 100
        };
    
        // 价格协商
        if (customer.预算 < item.价格 * 0.9) {
            return {
                success: false,
                message: "抱歉呢,顾客觉得价格有点高哦~"
            };
        }
    
        // 随机生成会员状态
        if (Math.random() > 0.7) {
            result.isMember = true;
            result.discount = "会员95折";
            result.finalPrice *= 0.95;
        }
    
        // 服务评分计算
        result.serviceScore = Math.min(
            5,
            3 + 
            user.店铺信息.技能体系.基础技能.销售技巧 * 0.3 +
            user.店铺信息.技能体系.基础技能.沟通能力 * 0.3 +
            Math.random() * 0.4
        );
    
        // 顾客反馈生成
        const feedbacks = [
            "非常满意,店员服务太贴心了~",
            "很开心的购物体验！",
            "家具品质不错,价格合理~",
            "店员很专业,讲解很详细呢",
            "整体还不错,期待下次光临~"
        ];
        result.customerFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
    
        // 支付方式随机
        const payments = ["现金", "微信", "支付宝", "银行卡"];
        result.paymentMethod = payments[Math.floor(Math.random() * payments.length)];
    
        return result;
    }
    
    // 更新热销商品榜单
    async updateHotSalesList(user, item) {
        if (!user.店铺信息.商品管理.热销商品) {
            user.店铺信息.商品管理.热销商品 = [];
        }
    
        const hotSaleItem = user.店铺信息.商品管理.热销商品.find(x => x.名称 === item.名称);
        if (hotSaleItem) {
            hotSaleItem.销量 += 1;
            hotSaleItem.最近销售 = new Date().toLocaleString();
        } else {
            user.店铺信息.商品管理.热销商品.push({
                名称: item.名称,
                销量: 1,
                最近销售: new Date().toLocaleString()
            });
        }
    
        // 按销量排序
        user.店铺信息.商品管理.热销商品.sort((a, b) => b.销量 - a.销量);
    
        // 只保留前10名
        if (user.店铺信息.商品管理.热销商品.length > 10) {
            user.店铺信息.商品管理.热销商品 = user.店铺信息.商品管理.热销商品.slice(0, 10);
        }
    }

    async Restock_furniture(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
    
        // 基础检查
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
    
        // 权限检查
        if (!user || user.job !== "家具店店主") {
            e.reply("只有店主才能进行进货呢~");
            return;
        }
    
        // 检查库存容量
        if (user.店铺信息.商品管理.当前库存.length >= user.店铺信息.商品管理.库存容量) {
            e.reply("仓库已经放不下啦~需要先清理一下库存呢~");
            return;
        }
    
        // 进货系统
        const restockResult = await this.processRestock(user);
        if (!restockResult.success) {
            e.reply(restockResult.message);
            return;
        }
    
        // 更新库存
        user.店铺信息.商品管理.当前库存.push(...restockResult.newItems);
    
        // 更新财务数据
        user.店铺信息.经营系统.财务管理.营业支出 += restockResult.totalCost;
        user.money -= restockResult.totalCost;
    
        // 生成进货清单
        const restockMsg = [
            "🌸～完成一次温馨的进货～🌸",
            "══════════════",
            "✨ 进货详情",
            ...restockResult.newItems.map(item => 
                `🛋️ ${item.名称} - ${item.价格}元\n` +
                `   ${item.稀有度} | ${item.限定等级}\n` +
                `   萌属性: ${item.萌属性.join(", ")}`
            ),
            "══════════════",
            "💰 费用统计",
            `• 总花费：${restockResult.totalCost}元`,
            `• 预期利润：${restockResult.expectedProfit}元`,
            "══════════════",
            "📊 库存状态",
            `• 当前库存：${user.店铺信息.商品管理.当前库存.length}`,
            `• 剩余空间：${user.店铺信息.商品管理.库存容量 - user.店铺信息.商品管理.当前库存.length}`,
            "══════════════",
            "💝 进货建议",
            ...restockResult.suggestions,
            "══════════════",
            "🌟 小贴士",
            "• 稀有家具更受欢迎哦~",
            "• 注意搭配萌属性呢~",
            "• 记得关注限定款哦~"
        ].join("\n");
    
        e.reply(restockMsg);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(user));
        await saveUserData(userId, user);
    }

    async View_inventory(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
    
        // 基础检查
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
    
        // 权限检查
        if (!user || (user.job !== "家具店店员" && user.job !== "家具店店主")) {
            e.reply("只有家具店的店员和店主才能查看库存哦~");
            return;
        }
    
        // 生成库存报告
        const inventoryReport = await this.generateInventoryReport(user);
        
        // 生成展示消息
        const inventoryMsg = [
            "🌸～库存小精灵向你报告～🌸",
            "══════════════",
            "✨ 库存概况",
            `📦 当前库存：${user.店铺信息.商品管理.当前库存.length}/${user.店铺信息.商品管理.库存容量}`,
            `💰 库存总值：${inventoryReport.总价值}元`,
            `🌟 平均品质：${inventoryReport.平均品质}`,
            "══════════════",
            "🎀 稀有度分布",
            ...inventoryReport.稀有度统计.map(item => 
                `• ${item.等级}：${item.数量}件`
            ),
            "══════════════",
            "💝 商品列表",
            ...user.店铺信息.商品管理.当前库存.map(item => 
                `🛋️ ${item.名称}\n` +
                `   ${item.稀有度} | ${item.限定等级}\n` +
                `   价格：${item.价格}元\n` +
                `   萌属性：${item.萌属性.join(", ")}\n` +
                `   特色：${item.特色.join(", ")}`
            ),
            "══════════════",
            "🌟 库存分析",
            ...inventoryReport.库存建议,
            "══════════════",
            "💫 小贴士",
            "• 稀有商品要精心保管哦~",
            "• 定期整理更新库存呢~",
            "• 关注商品保质期啦~"
        ].join("\n");
    
        e.reply(inventoryMsg);
    
        // 更新库存检查时间
        user.店铺信息.商品管理.上次检查时间 = new Date().toLocaleString();
        
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(user));
        await saveUserData(userId, user);
    }
    
    // 生成库存报告
    async generateInventoryReport(user) {
        const inventory = user.店铺信息.商品管理.当前库存;
        
        // 初始化报告
        const report = {
            总价值: 0,
            平均品质: 0,
            稀有度统计: [],
            库存建议: []
        };
    
        // 计算基础数据
        report.总价值 = inventory.reduce((sum, item) => sum + item.价格, 0);
        report.平均品质 = Math.floor(
            inventory.reduce((sum, item) => sum + item.品质, 0) / 
            (inventory.length || 1)
        );
    
        // 统计稀有度
        const rarityCount = {
            "传说": 0,
            "史诗": 0,
            "稀有": 0,
            "精良": 0,
            "普通": 0
        };
        
        inventory.forEach(item => {
            rarityCount[item.限定等级]++;
        });
    
        report.稀有度统计 = Object.entries(rarityCount)
            .map(([等级, 数量]) => ({等级, 数量}));
    
        // 生成库存建议
        report.库存建议 = await this.generateInventorySuggestions(user);
    
        return report;
    }
    
    // 生成库存建议
    async generateInventorySuggestions(user) {
        const suggestions = [];
        const inventory = user.店铺信息.商品管理.当前库存;
    
        // 容量建议
        const capacityUsage = (inventory.length / user.店铺信息.商品管理.库存容量) * 100;
        if (capacityUsage > 90) {
            suggestions.push("• 库存快满啦,要及时清理呢~");
        } else if (capacityUsage < 30) {
            suggestions.push("• 库存有点少,可以考虑进货啦~");
        }
    
        // 品质建议
        const lowQualityItems = inventory.filter(item => item.品质 < 70);
        if (lowQualityItems.length > 0) {
            suggestions.push("• 有些商品品质不太好,要注意保养哦~");
        }
    
        // 价格带建议
        const priceAnalysis = this.analyzePriceDistribution(inventory);
        if (priceAnalysis.needsAdjustment) {
            suggestions.push("• 商品价格结构可以更均衡一些~");
        }
    
        // 商品类型建议
        const typeAnalysis = this.analyzeTypeDistribution(inventory);
        if (typeAnalysis.needsDiversification) {
            suggestions.push("• 可以增加一些其他类型的商品呢~");
        }
    
        // 季节性建议
        const seasonalSuggestion = this.getSeasonalInventorySuggestion();
        suggestions.push(seasonalSuggestion);
    
        return suggestions;
    }
    
    // 分析价格分布
    analyzePriceDistribution(inventory) {
        const priceRanges = {
            low: 0,
            medium: 0,
            high: 0
        };
    
        inventory.forEach(item => {
            if (item.价格 < 1000) priceRanges.low++;
            else if (item.价格 < 5000) priceRanges.medium++;
            else priceRanges.high++;
        });
    
        const total = inventory.length;
        const needsAdjustment = 
            Math.abs(priceRanges.low/total - 0.3) > 0.1 ||
            Math.abs(priceRanges.medium/total - 0.4) > 0.1 ||
            Math.abs(priceRanges.high/total - 0.3) > 0.1;
    
        return {
            distribution: priceRanges,
            needsAdjustment
        };
    }
    
    // 分析商品类型分布
    analyzeTypeDistribution(inventory) {
        const typeCount = {};
        inventory.forEach(item => {
            typeCount[item.类型] = (typeCount[item.类型] || 0) + 1;
        });
    
        const typeVariance = Object.values(typeCount).reduce((sum, count) => 
            sum + Math.pow(count - (inventory.length / Object.keys(typeCount).length), 2), 0);
    
        return {
            distribution: typeCount,
            needsDiversification: typeVariance > inventory.length / 3
        };
    }
    
    // 获取季节性库存建议
    getSeasonalInventorySuggestion() {
        const month = new Date().getMonth();
        const suggestions = {
            春季: "• 春天来啦,可以准备一些樱花系列的商品呢~",
            夏季: "• 炎炎夏日,清凉系列最受欢迎啦~",
            秋季: "• 秋高气爽,学院风家具正当时哦~",
            冬季: "• 寒冷冬天,温暖系列一定很畅销呢~"
        };
    
        if (month >= 2 && month <= 4) return suggestions.春季;
        if (month >= 5 && month <= 7) return suggestions.夏季;
        if (month >= 8 && month <= 10) return suggestions.秋季;
        return suggestions.冬季;
    }
    async Sales_rankings(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
    
        // 基础检查
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
    
        // 权限检查
        if (!userData || (userData.job !== "家具店店员" && userData.job !== "家具店店主")) {
            e.reply("只有家具店的店员和店主才能查看销售榜哦~");
            return;
        }
    
        // 检查销售记录文件
        if (!fs.existsSync(SALES_RECORDS_FILE_PATH)) {
            e.reply("还没有任何销售记录呢,继续加油哦~");
            return;
        }
    
        // 读取销售记录
        const salesRecords = JSON.parse(fs.readFileSync(SALES_RECORDS_FILE_PATH));
    
        // 统计基础数据
        const totalSales = salesRecords.reduce((sum, record) => sum + record.价格, 0);
        const totalCount = salesRecords.length;
        const averageRating = Math.floor(
            salesRecords.reduce((sum, record) => sum + (record.评分 || 5), 0) / totalCount
        );
    
        // 处理热销商品榜单
        const salesByItem = {};
        salesRecords.forEach(record => {
            if (!salesByItem[record.名称]) {
                salesByItem[record.名称] = {
                    名称: record.名称,
                    销量: 0,
                    销售额: 0,
                    好评数: 0,
                    总评分: 0,
                    稀有度: record.稀有度,
                    萌属性: record.萌属性 || [],
                    特色: record.特色 || []
                };
            }
            salesByItem[record.名称].销量++;
            salesByItem[record.名称].销售额 += record.价格;
            salesByItem[record.名称].总评分 += (record.评分 || 5);
            if (record.评分 >= 4) salesByItem[record.名称].好评数++;
        });
    
        // 计算好评率并排序
        const topSellingItems = Object.values(salesByItem)
            .map(item => ({
                ...item,
                好评率: Math.floor((item.好评数 / item.销量) * 100)
            }))
            .sort((a, b) => b.销量 - a.销量)
            .slice(0, 5);
    
        // 处理稀有商品榜单
        const rareItemSales = salesRecords
            .filter(record => record.限定等级 === "史诗" || record.限定等级 === "传说")
            .sort((a, b) => b.价格 - a.价格)
            .slice(0, 5);
    
        // 处理萌系商品榜单
        const moeItemSales = salesRecords
            .filter(record => record.萌属性 && record.萌属性.length > 0)
            .sort((a, b) => b.价格 - a.价格)
            .slice(0, 3);
    
        // 处理治愈系商品榜单
        const healingItemSales = salesRecords
            .filter(record => 
                record.特色 && 
                record.特色.some(feature => 
                    feature.includes("治愈") || 
                    feature.includes("温暖") || 
                    feature.includes("舒适")
                )
            )
            .sort((a, b) => b.价格 - a.价格)
            .slice(0, 3);
    
        // 分析销售趋势
        const sortedRecords = [...salesRecords].sort((a, b) => 
            new Date(b.销售时间) - new Date(a.销售时间)
        );
        const recentSales = sortedRecords.slice(0, 7);
        const recentAverage = Math.floor(
            recentSales.reduce((sum, record) => sum + record.价格, 0) / 
            recentSales.length
        );
        const historicalAverage = Math.floor(
            sortedRecords.reduce((sum, record) => sum + record.价格, 0) / 
            sortedRecords.length
        );
    
        // 分析热门类型和属性
        const typeCount = {};
        const attrCount = {};
        recentSales.forEach(record => {
            typeCount[record.类型] = (typeCount[record.类型] || 0) + 1;
            if (record.萌属性) {
                record.萌属性.forEach(attr => {
                    attrCount[attr] = (attrCount[attr] || 0) + 1;
                });
            }
        });
    
        const popularTypes = Object.entries(typeCount)
            .sort((a, b) => b[1] - a[1])
            .map(([type]) => type);
    
        const popularAttributes = Object.entries(attrCount)
            .sort((a, b) => b[1] - a[1])
            .map(([attr]) => attr);
    
        // 生成销售趋势分析
        const trends = [
            recentAverage > historicalAverage 
                ? "• 最近成交价格呈上升趋势呢~" 
                : "• 最近价格比较平稳哦~",
            `• ${popularTypes[0] || "多种"}类商品最近很受欢迎呢~`,
            popularAttributes[0] 
                ? `• 带有${popularAttributes[0]}属性的商品很畅销哦~`
                : "• 各种属性的商品都很受欢迎呢~"
        ];
    
        // 生成展示消息
        const rankingMsg = [
            "🌟～欢迎查看梦幻家具销售榜～🌟",
            "══════════════",
            "✨ 销售总览",
            `📊 总销售额：${totalSales}元`,
            `🛍️ 总成交量：${totalCount}件`,
            `💖 平均好评：${averageRating}分`,
            "══════════════",
            "🎀 热销商品TOP5",
            ...topSellingItems.map((item, index) => {
                const emoji = ["👑", "🥈", "🥉", "✨", "💫"][index] || "🌟";
                return `${emoji} ${item.名称}\n` +
                       `   销量：${item.销量}件 | 总额：${item.销售额}元\n` +
                       `   好评率：${item.好评率}% | ${item.稀有度}`;
            }),
            "══════════════",
            "💝 稀有商品销售榜",
            ...rareItemSales.map((item, index) => {
                const emoji = ["👑", "🥈", "🥉", "✨", "💫"][index] || "🌟";
                return `${emoji} ${item.名称}\n` +
                       `   ${item.限定等级} | ${item.稀有度}\n` +
                       `   成交价：${item.价格}元`;
            }),
            "══════════════",
            "🌈 特色分类榜单",
            "【萌系列榜】",
            ...moeItemSales.map((item, index) => {
                const emoji = ["👑", "🥈", "🥉"][index] || "🌟";
                return `${emoji} ${item.名称} (${item.萌属性.join(", ")})`;
            }),
            "【治愈系榜】",
            ...healingItemSales.map((item, index) => {
                const emoji = ["👑", "🥈", "🥉"][index] || "🌟";
                return `${emoji} ${item.名称} (${item.特色.join(", ")})`;
            }),
            "══════════════",
            "💫 销售趋势",
            ...trends,
            "══════════════",
            "🎊 小贴士",
            "• 热销商品要及时补货哦~",
            "• 稀有商品很受欢迎呢~",
            "• 关注销售趋势很重要~"
        ].join("\n");
    
        e.reply(rankingMsg);
    }
    async View_sales_records(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
    
        // 基础检查
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
    
        // 权限检查
        if (!userData || (userData.job !== "家具店店员" && userData.job !== "家具店店主")) {
            e.reply("只有家具店的店员和店主才能查看销售记录哦~");
            return;
        }
    
        // 检查销售记录文件
        if (!fs.existsSync(SALES_RECORDS_FILE_PATH)) {
            e.reply("还没有任何销售记录呢,继续加油哦~");
            return;
        }
    
        // 读取销售记录
        const salesRecords = JSON.parse(fs.readFileSync(SALES_RECORDS_FILE_PATH));
    
        // 处理销售数据
        const today = new Date();
        const todayStr = today.toLocaleDateString();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();
    
        // 统计各项数据
        const stats = {
            今日销售: {
                总额: 0,
                数量: 0,
                商品列表: []
            },
            本月销售: {
                总额: 0,
                数量: 0,
                热销商品: new Map()
            },
            累计销售: {
                总额: 0,
                数量: 0,
                平均价格: 0,
                最高价格: 0,
                最畅销: null
            },
            顾客分析: {
                总人数: new Set(),
                回头客: new Map(),
                最大消费: {
                    顾客: null,
                    金额: 0
                }
            },
            商品分析: {
                类型分布: new Map(),
                价格区间: {
                    低价: 0,  // <1000
                    中价: 0,  // 1000-5000
                    高价: 0   // >5000
                }
            }
        };
    
        // 处理每条销售记录
        salesRecords.forEach(record => {
            const saleDate = new Date(record.销售时间);
            const price = record.价格;
    
            // 更新累计数据
            stats.累计销售.总额 += price;
            stats.累计销售.数量++;
            if (price > stats.累计销售.最高价格) {
                stats.累计销售.最高价格 = price;
            }
    
            // 今日销售统计
            if (saleDate.toLocaleDateString() === todayStr) {
                stats.今日销售.总额 += price;
                stats.今日销售.数量++;
                stats.今日销售.商品列表.push(record);
            }
    
            // 本月销售统计
            if (saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear) {
                stats.本月销售.总额 += price;
                stats.本月销售.数量++;
                const count = stats.本月销售.热销商品.get(record.名称) || 0;
                stats.本月销售.热销商品.set(record.名称, count + 1);
            }
    
            // 顾客分析
            stats.顾客分析.总人数.add(record.购买者);
            const customerPurchases = stats.顾客分析.回头客.get(record.购买者) || 0;
            stats.顾客分析.回头客.set(record.购买者, customerPurchases + 1);
    
            if (!stats.顾客分析.最大消费.顾客 || price > stats.顾客分析.最大消费.金额) {
                stats.顾客分析.最大消费 = {
                    顾客: record.购买者,
                    金额: price
                };
            }
    
            // 商品分析
            const typeCount = stats.商品分析.类型分布.get(record.类型) || 0;
            stats.商品分析.类型分布.set(record.类型, typeCount + 1);
    
            if (price < 1000) stats.商品分析.价格区间.低价++;
            else if (price <= 5000) stats.商品分析.价格区间.中价++;
            else stats.商品分析.价格区间.高价++;
        });
    
        // 计算平均价格
        stats.累计销售.平均价格 = Math.floor(stats.累计销售.总额 / stats.累计销售.数量);
    
        // 找出最畅销商品
        let maxSales = 0;
        stats.本月销售.热销商品.forEach((count, name) => {
            if (count > maxSales) {
                maxSales = count;
                stats.累计销售.最畅销 = name;
            }
        });
    
        // 生成分析报告
        const analysisMsg = [
            "🌸～销售小精灵为你汇报～🌸",
            "══════════════",
            "✨ 今日战绩",
            `💖 成交金额：${stats.今日销售.总额}元`,
            `🎀 成交数量：${stats.今日销售.数量}件`,
            stats.今日销售.商品列表.length > 0 ? [
                "📝 今日订单：",
                ...stats.今日销售.商品列表.map(item =>
                    `• ${item.名称} | ${item.价格}元 | ${new Date(item.销售时间).toLocaleTimeString()}`
                )
            ].join("\n") : "还没有今日订单呢~",
            "══════════════",
            "🌟 本月成绩",
            `💰 总销售额：${stats.本月销售.总额}元`,
            `📦 销售数量：${stats.本月销售.数量}件`,
            `🏆 当月爆款：${stats.累计销售.最畅销 || "暂无"}`,
            "══════════════",
            "💝 顾客分析",
            `👥 总顾客数：${stats.顾客分析.总人数.size}人`,
            `🔄 回头客数：${[...stats.顾客分析.回头客.values()].filter(v => v > 1).length}人`,
            `👑 最大消费：${stats.顾客分析.最大消费.金额}元`,
            "══════════════",
            "📊 商品分析",
            "【价格分布】",
            `• 亲民价格：${stats.商品分析.价格区间.低价}件`,
            `• 中端价格：${stats.商品分析.价格区间.中价}件`,
            `• 高端价格：${stats.商品分析.价格区间.高价}件`,
            "【类型分布】",
            ...[...stats.商品分析.类型分布.entries()].map(([type, count]) =>
                `• ${type}：${count}件`
            ),
            "══════════════",
            "💫 累计数据",
            `📈 总销售额：${stats.累计销售.总额}元`,
            `📊 总成交量：${stats.累计销售.数量}件`,
            `💎 最高成交：${stats.累计销售.最高价格}元`,
            `💫 平均价格：${stats.累计销售.平均价格}元`,
            "══════════════",
            "🎀 小贴士",
            "• 持续记录每一笔温暖的交易~",
            "• 用心服务每一位亲爱的顾客~",
            "• 让每件家具都找到温馨的归宿~"
        ].join("\n");
    
        e.reply(analysisMsg);
    }

    async Rename_store(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
    
        // 基础检查
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
    
        // 权限检查
        if (!user || user.job !== "家具店店主") {
            e.reply("只有店主才能给店铺改名呢~");
            return;
        }
    
        // 获取新店名
        const newName = e.msg.replace('#家具店改名', '').trim();
    
        // 店名检查
        if (!newName) {
            e.reply("要输入新的店名哦~");
            return;
        }
    
        // 店名长度检查
        if (newName.length > 12) {
            e.reply("店名不能超过12个字符呢~");
            return;
        }
    
        // 店名合规性检查
        if (this.containsSensitiveWords(newName)) {
            e.reply("店名包含不适合的内容哦~换一个吧~");
            return;
        }
    
        // 计算改名花费
        const renameCost = this.calculateRenameCost(user);
        if (user.money < renameCost) {
            e.reply(`改名需要${renameCost}元呢,资金还不够哦~`);
            return;
        }
    
        // 记录旧店名
        const oldName = user.店铺信息.基础信息.店铺名称;
    
        // 更新店铺信息
        user.money -= renameCost;
        user.店铺信息.基础信息.店铺名称 = newName;
        user.店铺信息.基础信息.改名记录 = user.店铺信息.基础信息.改名记录 || [];
        user.店铺信息.基础信息.改名记录.push({
            旧店名: oldName,
            新店名: newName,
            改名时间: new Date().toLocaleString(),
            花费: renameCost
        });
    
        // 更新店铺形象
        const storeImage = this.generateStoreImage(newName);
        user.店铺信息.基础信息.店铺形象 = storeImage;
    
        // 生成改名通知
        const renameMsg = [
            "🌟～店铺改名成功啦～🌟",
            "══════════════",
            "✨ 改名详情",
            `🏪 原店名：${oldName}`,
            `🎀 新店名：${newName}`,
            `💰 花费：${renameCost}元`,
            "══════════════",
            "🎊 店铺印象",
            ...storeImage.特色标签,
            "══════════════",
            "💝 新店寄语",
            storeImage.寄语,
            "══════════════",
            "🌈 店铺祝福",
            "• 愿新店名带来好运~",
            "• 期待更多顾客光临~",
            "• 生意蒸蒸日上哦~"
        ].join("\n");
    
        e.reply(renameMsg);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(user));
        await saveUserData(userId, user);
    }

    async Upgrade_store(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
    
        // 基础检查
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
    
        // 权限检查
        if (!user || user.job !== "家具店店主") {
            e.reply("只有店主才能升级店铺呢~");
            return;
        }
    
        // 获取当前店铺等级
        const currentLevel = user.店铺信息.基础信息.店铺等级 || 1;
        
        // 升级条件检查
        const upgradeRequirements = {
            等级要求: {
                2: { 店主等级: 20, 声望: 1000, 资金: 10000 },
                3: { 店主等级: 40, 声望: 3000, 资金: 30000 },
                4: { 店主等级: 60, 声望: 6000, 资金: 60000 },
                5: { 店主等级: 80, 声望: 10000, 资金: 100000 },
                6: { 店主等级: 100, 声望: 15000, 资金: 150000 }
            },
            升级奖励: {
                2: {
                    库存容量: 20,
                    新增功能: ["VIP会员系统", "店铺装修"],
                    特殊权限: ["促销活动", "会员折扣"]
                },
                3: {
                    库存容量: 30,
                    新增功能: ["员工培训系统", "商品展示厅"],
                    特殊权限: ["限定商品", "特惠活动"]
                },
                4: {
                    库存容量: 40,
                    新增功能: ["高级定制系统", "品牌合作"],
                    特殊权限: ["品牌代理", "跨店联营"]
                },
                5: {
                    库存容量: 50,
                    新增功能: ["设计师工作室", "艺术展厅"],
                    特殊权限: ["独家定制", "限量发售"]
                },
                6: {
                    库存容量: 60,
                    新增功能: ["国际贸易", "连锁经营"],
                    特殊权限: ["全球采购", "品牌授权"]
                }
            }
        };
    
        // 检查是否达到最高等级
        if (currentLevel >= 6) {
            e.reply("店铺已经达到最高等级啦~继续保持哦~");
            return;
        }
    
        // 获取下一级要求
        const nextLevel = currentLevel + 1;
        const requirements = upgradeRequirements.等级要求[nextLevel];
        const rewards = upgradeRequirements.升级奖励[nextLevel];
    
        // 检查升级条件
        if (user.level < requirements.店主等级) {
            e.reply(`店主等级需要达到${requirements.店主等级}级才能升级呢~继续加油！`);
            return;
        }
    
        if (user.店铺信息.基础信息.声望 < requirements.声望) {
            e.reply(`店铺声望需要达到${requirements.声望}才能升级哦~努力提升吧！`);
            return;
        }
    
        if (user.money < requirements.资金) {
            e.reply(`升级需要${requirements.资金}元呢~继续赚钱吧！`);
            return;
        }
    
        // 执行升级
        user.money -= requirements.资金;
        user.店铺信息.基础信息.店铺等级 = nextLevel;
        user.店铺信息.商品管理.库存容量 += rewards.库存容量;
    
        // 更新店铺信息
        if (!user.店铺信息.升级记录) {
            user.店铺信息.升级记录 = [];
        }
    
        // 记录升级信息
        user.店铺信息.升级记录.push({
            升级时间: new Date().toLocaleString(),
            升级前等级: currentLevel,
            升级后等级: nextLevel,
            花费资金: requirements.资金,
            获得奖励: {
                增加库存: rewards.库存容量,
                新增功能: rewards.新增功能,
                特殊权限: rewards.特殊权限
            }
        });
    
        // 更新店铺属性
        const newStoreAttributes = this.calculateNewStoreAttributes(user, nextLevel);
        Object.assign(user.店铺信息.基础信息, newStoreAttributes);
    
        // 生成升级通知
        const upgradeMsg = [
            "🌟～店铺升级成功啦～🌟",
            "══════════════",
            "✨ 升级详情",
            `🏪 当前等级：${nextLevel}级`,
            `💰 升级花费：${requirements.资金}元`,
            "══════════════",
            "🎊 获得奖励",
            `• 库存容量 +${rewards.库存容量}`,
            "【新增功能】",
            ...rewards.新增功能.map(feature => `• ${feature}`),
            "【特殊权限】",
            ...rewards.特殊权限.map(right => `• ${right}`),
            "══════════════",
            "💝 店铺属性提升",
            `• 店铺声望 +${newStoreAttributes.声望提升}`,
            `• 顾客好感度 +${newStoreAttributes.好感度提升}`,
            `• 店铺魅力 +${newStoreAttributes.魅力提升}`,
            "══════════════",
            "🌈 温馨提示",
            "• 新功能要好好利用哦~",
            "• 特殊权限要合理使用呢~",
            "• 继续努力提升店铺吧~"
        ].join("\n");
    
        e.reply(upgradeMsg);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(user));
        await saveUserData(userId, user);
    
        // 内部方法：计算新的店铺属性
        function calculateNewStoreAttributes(user, level) {
            const baseIncrease = Math.pow(level, 1.5);
            return {
                声望提升: Math.floor(baseIncrease * 100),
                好感度提升: Math.floor(baseIncrease * 50),
                魅力提升: Math.floor(baseIncrease * 30),
                店铺评级: this.calculateNewStoreRating(level),
                特殊效果: this.generateSpecialEffects(level)
            };
        }
    
        // 内部方法：计算新的店铺评级
        function calculateNewStoreRating(level) {
            const ratings = ["D", "C", "B", "A", "S", "SS"];
            return ratings[Math.min(level - 1, ratings.length - 1)];
        }
    
        // 内部方法：生成特殊效果
        function generateSpecialEffects(level) {
            const effects = [
                "顾客流量提升",
                "商品品质提升",
                "员工效率提升",
                "营业额加成",
                "好评率提升"
            ];
            return effects.slice(0, level);
        }
    }
    async Craft_furniture(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
    
        // 基础检查
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
    
        // 权限检查
        if (!user || (user.job !== "家具店店员" && user.job !== "家具店店主")) {
            e.reply("只有家具店的员工才能制作家具呢~");
            return;
        }
    
        // 获取制作的家具名称
        const furnitureName = e.msg.replace('#制作家具', '').trim();
        if (!furnitureName) {
            e.reply("要输入想要制作的家具名称哦~");
            return;
        }
    
        // 检查制作技能等级
        const craftLevel = user.店铺信息.员工信息.技能等级?.制作技能 || 1;
        
        // 家具制作配方系统
        const furnitureRecipes = {
            "梦幻星光床": {
                等级要求: 1,
                材料: [
                    { 名称: "星光木板", 数量: 4 },
                    { 名称: "梦幻布料", 数量: 2 },
                    { 名称: "闪耀珠", 数量: 1 }
                ],
                基础属性: {
                    品质: 80,
                    舒适度: 85,
                    美观度: 90,
                    耐久度: 100
                },
                制作难度: "简单",
                制作时间: 30,
                成功率: 90
            },
            "魔法少女沙发": {
                等级要求: 2,
                材料: [
                    { 名称: "魔法绒布", 数量: 3 },
                    { 名称: "彩虹棉", 数量: 2 },
                    { 名称: "魔法水晶", 数量: 1 }
                ],
                基础属性: {
                    品质: 85,
                    舒适度: 90,
                    美观度: 95,
                    耐久度: 95
                },
                制作难度: "普通",
                制作时间: 45,
                成功率: 85
            },
            "童话书桌": {
                等级要求: 3,
                材料: [
                    { 名称: "童话木材", 数量: 5 },
                    { 名称: "彩绘颜料", 数量: 2 },
                    { 名称: "故事精灵", 数量: 1 }
                ],
                基础属性: {
                    品质: 90,
                    舒适度: 85,
                    美观度: 100,
                    耐久度: 90
                },
                制作难度: "中等",
                制作时间: 60,
                成功率: 80
            }
            // ... 可以继续添加更多家具配方
        };
    
        // 检查是否有此家具的制作配方
        if (!furnitureRecipes[furnitureName]) {
            e.reply("还没有这个家具的制作配方呢~");
            return;
        }
    
        const recipe = furnitureRecipes[furnitureName];
    
        // 检查制作等级要求
        if (craftLevel < recipe.等级要求) {
            e.reply(`制作${furnitureName}需要${recipe.等级要求}级制作技能呢~继续提升吧！`);
            return;
        }
    
        // 检查材料是否充足
        const materials = user.店铺信息.材料仓库 || [];
        for (const required of recipe.材料) {
            const material = materials.find(m => m.名称 === required.名称);
            if (!material || material.数量 < required.数量) {
                e.reply(`缺少材料：${required.名称} x ${required.数量}个呢~`);
                return;
            }
        }
    
        // 开始制作过程
        const craftingResult = this.processCrafting(user, recipe);
        if (!craftingResult.success) {
            e.reply(craftingResult.message);
            return;
        }
    
        // 扣除材料
        recipe.材料.forEach(required => {
            const materialIndex = materials.findIndex(m => m.名称 === required.名称);
            materials[materialIndex].数量 -= required.数量;
        });
    
        // 生成制作的家具
        const newFurniture = {
            名称: furnitureName,
            品质: craftingResult.品质,
            制作者: user.店铺信息.员工信息.工号,
            制作时间: new Date().toLocaleString(),
            基础属性: {
                ...recipe.基础属性,
                品质: craftingResult.品质,
                耐久度: recipe.基础属性.耐久度
            },
            特殊效果: craftingResult.特殊效果,
            萌属性: craftingResult.萌属性,
            价格: this.calculatePrice(craftingResult)
        };
    
        // 添加到库存
        user.店铺信息.商品管理.当前库存.push(newFurniture);
    
        // 更新制作经验
        user.店铺信息.员工信息.技能等级.制作技能 += 0.1;
        user.店铺信息.员工信息.制作经验 = (user.店铺信息.员工信息.制作经验 || 0) + craftingResult.获得经验;
    
        // 生成制作结果通知
        const craftMsg = [
            "🌟～家具制作完成啦～🌟",
            "══════════════",
            "✨ 制作详情",
            `🛋️ 家具名称：${furnitureName}`,
            `💝 制作品质：${craftingResult.品质}`,
            `💰 预估价格：${newFurniture.价格}元`,
            "══════════════",
            "🎀 家具属性",
            `• 品质：${newFurniture.基础属性.品质}`,
            `• 舒适度：${newFurniture.基础属性.舒适度}`,
            `• 美观度：${newFurniture.基础属性.美观度}`,
            `• 耐久度：${newFurniture.基础属性.耐久度}`,
            "══════════════",
            "✨ 特殊效果",
            ...craftingResult.特殊效果.map(effect => `• ${effect}`),
            "══════════════",
            "🌈 萌属性",
            ...craftingResult.萌属性.map(attr => `• ${attr}`),
            "══════════════",
            "💫 制作收获",
            `• 制作经验 +${craftingResult.获得经验}`,
            `• 制作技能 +0.1`,
            "══════════════",
            "💝 小贴士",
            "• 继续提升制作技能哦~",
            "• 高品质的家具更受欢迎呢~",
            "• 收集稀有材料可以制作特殊家具哦~"
        ].join("\n");
    
        e.reply(craftMsg);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(user));
        await saveUserData(userId, user);
    
        // 内部方法：处理制作过程
        function processCrafting(user, recipe) {
            const result = {
                success: true,
                品质: 0,
                特殊效果: [],
                萌属性: [],
                获得经验: 0,
                message: ""
            };
    
            // 计算制作成功率
            const baseSuccess = recipe.成功率;
            const skillBonus = (user.店铺信息.员工信息.技能等级?.制作技能 || 1) * 5;
            const finalSuccess = Math.min(baseSuccess + skillBonus, 100);
    
            // 判断是否制作成功
            if (Math.random() * 100 > finalSuccess) {
                result.success = false;
                result.message = "制作失败了呢~不要灰心,继续努力！";
                return result;
            }
    
            // 计算品质
            const baseQuality = recipe.基础属性.品质;
            const skillQuality = (user.店铺信息.员工信息.技能等级?.制作技能 || 1) * 2;
            const luckBonus = Math.random() * 10;
            result.品质 = Math.min(Math.floor(baseQuality + skillQuality + luckBonus), 100);
    
            // 生成特殊效果
            result.特殊效果 = generateSpecialEffects(result.品质);
    
            // 生成萌属性
            result.萌属性 = generateMoeAttributes(result.品质);
    
            // 计算获得经验
            result.获得经验 = calculateExperience(recipe.制作难度, result.品质);
    
            return result;
        }
    
        // 内部方法：生成特殊效果
        function generateSpecialEffects(quality) {
            const effects = [
                "治愈光环",
                "幸福加持",
                "梦幻闪耀",
                "温暖祝福",
                "心情提升",
                "元气充能",
                "美梦祝福",
                "星光点缀"
            ];
    
            const effectCount = Math.floor(quality / 25) + 1;
            return effects
                .sort(() => Math.random() - 0.5)
                .slice(0, effectCount);
        }
    
        // 内部方法：生成萌属性
        function generateMoeAttributes(quality) {
            const attributes = [
                "可爱加成",
                "少女心满满",
                "温馨治愈",
                "梦幻华丽",
                "甜美清新",
                "浪漫唯美",
                "童话风格",
                "元气满满"
            ];
    
            const attrCount = Math.floor(quality / 30) + 1;
            return attributes
                .sort(() => Math.random() - 0.5)
                .slice(0, attrCount);
        }
    
        // 内部方法：计算经验值
        function calculateExperience(difficulty, quality) {
            const difficultyBonus = {
                "简单": 1,
                "普通": 1.5,
                "中等": 2,
                "困难": 3,
                "极难": 4
            };
    
            return Math.floor(100 * (difficultyBonus[difficulty] || 1) * (quality / 100));
        }
    
        // 内部方法：计算价格
        function calculatePrice(result) {
            const basePrice = 1000;
            const qualityMultiplier = result.品质 / 50;
            const effectBonus = result.特殊效果.length * 200;
            const attrBonus = result.萌属性.length * 150;
    
            return Math.floor(basePrice * qualityMultiplier + effectBonus + attrBonus);
        }
    }

    async View_blueprints(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
    
        // 基础检查
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
    
        // 权限检查
        if (!userData || (userData.job !== "家具店店员" && userData.job !== "家具店店主")) {
            e.reply("只有家具店的员工才能查看蓝图哦~");
            return;
        }
    
        // 读取蓝图数据
        const blueprints = {
            "梦幻系列": [
                {
                    名称: "星光梦境床",
                    类型: "床品",
                    风格: "梦幻",
                    稀有度: "SSR",
                    制作难度: "困难",
                    所需材料: [
                        { 名称: "星光原木", 数量: 5, 稀有度: "稀有" },
                        { 名称: "梦境丝绸", 数量: 3, 稀有度: "史诗" },
                        { 名称: "月光宝石", 数量: 2, 稀有度: "传说" }
                    ],
                    特殊效果: ["安眠祝福", "梦境守护", "星光闪耀"],
                    解锁条件: "制作等级达到8级"
                },
                {
                    名称: "彩虹糖果柜",
                    类型: "收纳",
                    风格: "梦幻",
                    稀有度: "SR",
                    制作难度: "中等",
                    所需材料: [
                        { 名称: "糖果木材", 数量: 4, 稀有度: "稀有" },
                        { 名称: "彩虹漆", 数量: 2, 稀有度: "稀有" },
                        { 名称: "魔法粉末", 数量: 1, 稀有度: "史诗" }
                    ],
                    特殊效果: ["物品保护", "空间扩展", "甜蜜祝福"],
                    解锁条件: "制作等级达到5级"
                }
            ],
            "少女系列": [
                {
                    名称: "樱花飘雪妆台",
                    类型: "梳妆台",
                    风格: "少女",
                    稀有度: "SSR",
                    制作难度: "困难",
                    所需材料: [
                        { 名称: "樱花木", 数量: 4, 稀有度: "稀有" },
                        { 名称: "魔法镜", 数量: 1, 稀有度: "传说" },
                        { 名称: "花瓣精华", 数量: 3, 稀有度: "史诗" }
                    ],
                    特殊效果: ["美丽加持", "樱花祝福", "心愿成真"],
                    解锁条件: "制作等级达到7级"
                }
            ],
            "治愈系列": [
                {
                    名称: "暖阳懒人沙发",
                    类型: "沙发",
                    风格: "治愈",
                    稀有度: "SR",
                    制作难度: "中等",
                    所需材料: [
                        { 名称: "治愈棉花", 数量: 5, 稀有度: "稀有" },
                        { 名称: "暖阳布料", 数量: 3, 稀有度: "稀有" },
                        { 名称: "舒适精华", 数量: 1, 稀有度: "史诗" }
                    ],
                    特殊效果: ["疲劳恢复", "心情治愈", "温暖拥抱"],
                    解锁条件: "制作等级达到4级"
                }
            ]
        };
    
        // 计算玩家可制作的蓝图
        const craftLevel = userData.店铺信息.员工信息.技能等级?.制作技能 || 1;
        const availableBlueprints = {};
        const lockedBlueprints = {};
    
        // 分类处理蓝图
        Object.entries(blueprints).forEach(([series, items]) => {
            availableBlueprints[series] = [];
            lockedBlueprints[series] = [];
    
            items.forEach(blueprint => {
                const requiredLevel = parseInt(blueprint.解锁条件.match(/\d+/)[0]);
                if (craftLevel >= requiredLevel) {
                    availableBlueprints[series].push(blueprint);
                } else {
                    lockedBlueprints[series].push(blueprint);
                }
            });
        });
    
        // 生成蓝图展示消息
        const blueprintMsg = [
            "🌟～梦幻家具蓝图图鉴～🌟",
            "══════════════",
            "✨ 已解锁蓝图",
            ...Object.entries(availableBlueprints).map(([series, items]) => [
                `【${series}】`,
                ...items.map(bp => [
                    `🛋️ ${bp.名称}`,
                    `   ${bp.稀有度} | ${bp.制作难度}`,
                    `   材料需求：`,
                    ...bp.所需材料.map(m => `   • ${m.名称} x${m.数量} (${m.稀有度})`),
                    `   特殊效果：${bp.特殊效果.join(", ")}`
                ].join("\n"))
            ].join("\n")),
            "══════════════",
            "💫 未解锁蓝图",
            ...Object.entries(lockedBlueprints).map(([series, items]) => [
                `【${series}】`,
                ...items.map(bp => [
                    `🔒 ${bp.名称}`,
                    `   解锁条件：${bp.解锁条件}`
                ].join("\n"))
            ].join("\n")),
            "══════════════",
            "💝 小贴士",
            "• 提升制作等级可以解锁更多蓝图哦~",
            "• 稀有材料可以在特殊商店购买呢~",
            "• 高稀有度的家具更受欢迎哦~",
            "• 收集所有蓝图可以获得成就呢~"
        ].join("\n");
    
        e.reply(blueprintMsg);
    
        // 检查成就
        const totalBlueprints = Object.values(blueprints)
            .reduce((sum, items) => sum + items.length, 0);
        const unlockedBlueprints = Object.values(availableBlueprints)
            .reduce((sum, items) => sum + items.length, 0);
    
        // 更新蓝图收集进度
        userData.店铺信息.蓝图收集 = {
            总数: totalBlueprints,
            已解锁: unlockedBlueprints,
            收集率: Math.floor((unlockedBlueprints / totalBlueprints) * 100)
        };
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Pay_salary(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
    
        // 基础检查
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
    
        // 数据一致性检查
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
    
        // 权限检查
        if (!userData || userData.job !== "家具店店主") {
            e.reply("只有店主才能发放工资哦~");
            return;
        }
    
        // 获取所有员工数据
        const allUsers = await loadAllUsers();
        const employees = Object.values(allUsers).filter(user => 
            user.job === "家具店店员" && 
            user.店铺信息.基础信息.店铺名称 === userData.店铺信息.基础信息.店铺名称
        );
    
        if (employees.length === 0) {
            e.reply("当前还没有员工呢~快去招募可爱的店员吧~");
            return;
        }
    
        // 检查发薪时间
        const now = new Date();
        const lastPayTime = userData.店铺信息.工资记录?.上次发放时间 || 0;
        const timeGap = now - new Date(lastPayTime);
        if (timeGap < 24 * 60 * 60 * 1000) { // 24小时内只能发一次
            const nextPayTime = new Date(lastPayTime + 24 * 60 * 60 * 1000);
            e.reply(`距离下次发工资还要等到${nextPayTime.toLocaleString()}呢~`);
            return;
        }
    
        // 计算工资总额
        let totalSalary = 0;
        const salaryDetails = [];
    
        for (const employee of employees) {
            // 基础工资计算
            const baseSalary = this.calculateBaseSalary(employee);
            
            // 业绩奖金计算
            const performanceBonus = this.calculatePerformanceBonus(employee);
            
            // 全勤奖励计算
            const attendanceBonus = this.calculateAttendanceBonus(employee);
            
            // 技能补贴计算
            const skillBonus = this.calculateSkillBonus(employee);
    
            // 计算总工资
            const totalAmount = baseSalary + performanceBonus + attendanceBonus + skillBonus;
            totalSalary += totalAmount;
    
            salaryDetails.push({
                员工ID: employee.id,
                工号: employee.店铺信息.员工信息.工号,
                基础工资: baseSalary,
                业绩奖金: performanceBonus,
                全勤奖励: attendanceBonus,
                技能补贴: skillBonus,
                总额: totalAmount
            });
        }
    
        // 检查店主资金是否充足
        if (userData.money < totalSalary) {
            e.reply(`店铺资金不足呢~需要${totalSalary}元才能发放工资哦~`);
            return;
        }
    
        // 发放工资
        userData.money -= totalSalary;
        for (const detail of salaryDetails) {
            const employee = allUsers[detail.员工ID];
            employee.money += detail.总额;
    
            // 更新员工数据
            await redis.set(`user:${detail.员工ID}`, JSON.stringify(employee));
            await saveUserData(detail.员工ID, employee);
        }
    
        // 更新工资记录
        userData.店铺信息.工资记录 = {
            上次发放时间: now.toISOString(),
            发放记录: [
                ...(userData.店铺信息.工资记录?.发放记录 || []),
                {
                    时间: now.toISOString(),
                    总金额: totalSalary,
                    员工数: employees.length,
                    详细记录: salaryDetails
                }
            ]
        };
    
        // 生成工资发放通知
        const salaryMsg = [
            "🌟～工资发放完成啦～🌟",
            "══════════════",
            "✨ 发放概况",
            `💰 总支出：${totalSalary}元`,
            `👥 发放人数：${employees.length}人`,
            "══════════════",
            "🎀 详细记录",
            ...salaryDetails.map(detail => [
                `🌸 工号：${detail.工号}`,
                `   基础工资：${detail.基础工资}元`,
                `   业绩奖金：${detail.业绩奖金}元`,
                `   全勤奖励：${detail.全勤奖励}元`,
                `   技能补贴：${detail.技能补贴}元`,
                `   总计：${detail.总额}元`
            ].join("\n")),
            "══════════════",
            "💝 温馨提示",
            "• 记得每天按时发工资哦~",
            "• 奖金会提高员工积极性呢~",
            "• 员工的成长需要鼓励~"
        ].join("\n");
    
        e.reply(salaryMsg);
    
        // 保存店主数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    
        // 内部方法：计算基础工资
        function calculateBaseSalary(employee) {
            const baseSalary = 2000; // 基础工资
            const levelBonus = employee.level * 100; // 等级加成
            const experienceBonus = Math.floor(employee.店铺信息.员工信息.工作时长 / 30) * 200; // 工作经验加成
            return baseSalary + levelBonus + experienceBonus;
        }
    
        // 内部方法：计算业绩奖金
        function calculatePerformanceBonus(employee) {
            const sales = employee.店铺信息.员工信息.本月销售额 || 0;
            const customerService = employee.店铺信息.员工信息.顾客好评率 || 0;
            
            const salesBonus = sales * 0.05; // 销售提成
            const serviceBonus = customerService * 10; // 服务质量奖励
            
            return Math.floor(salesBonus + serviceBonus);
        }
    
        // 内部方法：计算全勤奖励
        function calculateAttendanceBonus(employee) {
            const attendance = employee.店铺信息.员工信息.本月出勤天数 || 0;
            const maxDays = 30;
            
            if (attendance >= maxDays) {
                return 500; // 全勤奖励
            } else if (attendance >= maxDays * 0.9) {
                return 300; // 准全勤奖励
            }
            return 0;
        }
    
        // 内部方法：计算技能补贴
        function calculateSkillBonus(employee) {
            const skills = employee.店铺信息.员工信息.技能等级 || {};
            let totalBonus = 0;
            
            // 各项技能补贴
            if (skills.销售技能) totalBonus += skills.销售技能 * 100;
            if (skills.制作技能) totalBonus += skills.制作技能 * 150;
            if (skills.服务技能) totalBonus += skills.服务技能 * 100;
            if (skills.管理技能) totalBonus += skills.管理技能 * 200;
            
            return Math.floor(totalBonus);
        }
    }

    async scheduleAutoSalaryPayment() {
        // 获取所有用户数据
        const allUsers = await loadAllUsers();
        
        // 获取所有店主
        const storeOwners = Object.values(allUsers).filter(user => 
            user.job === "家具店店主"
        );
    
        // 如果没有店主，系统代发工资
        if (storeOwners.length === 0) {
            // 处理所有员工的工资
            for (const user of Object.values(allUsers)) {
                if (user.job === "家具店店员") {
                    await this.processAutoSalary(user);
                }
            }
        }
    
        // 内部方法：处理自动发工资
        async function processAutoSalary(employee) {
            // 生成工资报告
            const salaryReport = {
                基础工资: calculateBaseSalary(employee),
                业绩奖金: calculatePerformanceBonus(employee),
                全勤奖励: calculateAttendanceBonus(employee),
                技能补贴: calculateSkillBonus(employee),
                特殊奖励: calculateSpecialBonus(employee),
                发放时间: new Date().toLocaleString()
            };
    
            // 计算总工资
            const totalSalary = Object.values(salaryReport)
                .filter(value => typeof value === 'number')
                .reduce((sum, value) => sum + value, 0);
    
            // 更新员工数据
            employee.money += totalSalary;
            employee.店铺信息.工资记录 = employee.店铺信息.工资记录 || [];
            employee.店铺信息.工资记录.push({
                ...salaryReport,
                总额: totalSalary
            });
    
            // 生成工资通知
            const salaryMsg = [
                "🌟～每日工资已自动发放～🌟",
                "══════════════",
                "✨ 工资明细",
                `💰 基础工资：${salaryReport.基础工资}元`,
                `🎖️ 业绩奖金：${salaryReport.业绩奖金}元`,
                `🌟 全勤奖励：${salaryReport.全勤奖励}元`,
                `📚 技能补贴：${salaryReport.技能补贴}元`,
                `🎀 特殊奖励：${salaryReport.特殊奖励}元`,
                "══════════════",
                `💝 总计：${totalSalary}元`,
                "══════════════",
                "🎊 小贴士",
                "• 努力工作会有更多奖励哦~",
                "• 记得提升技能等级呢~",
                "• 保持良好的出勤记录吧~"
            ].join("\n");
    
            // 发送通知
            await sendMessage(employee.id, salaryMsg);
    
            // 保存数据
            await redis.set(`user:${employee.id}`, JSON.stringify(employee));
            await saveUserData(employee.id, employee);
        }
    
        // 内部方法：计算基础工资
        function calculateBaseSalary(employee) {
            const baseSalary = 2000;
            const levelBonus = employee.level * 100;
            const experienceBonus = Math.floor(employee.店铺信息.员工信息.工作时长 / 30) * 200;
            return baseSalary + levelBonus + experienceBonus;
        }
    
        // 内部方法：计算业绩奖金
        function calculatePerformanceBonus(employee) {
            const sales = employee.店铺信息.员工信息.本月销售额 || 0;
            const customerService = employee.店铺信息.员工信息.顾客好评率 || 0;
            
            const salesBonus = sales * 0.05;
            const serviceBonus = customerService * 10;
            
            return Math.floor(salesBonus + serviceBonus);
        }
    
        // 内部方法：计算全勤奖励
        function calculateAttendanceBonus(employee) {
            const attendance = employee.店铺信息.员工信息.本月出勤天数 || 0;
            const maxDays = 30;
            
            if (attendance >= maxDays) {
                return 500;
            } else if (attendance >= maxDays * 0.9) {
                return 300;
            }
            return 0;
        }
    
        // 内部方法：计算技能补贴
        function calculateSkillBonus(employee) {
            const skills = employee.店铺信息.员工信息.技能等级 || {};
            let totalBonus = 0;
            
            if (skills.销售技能) totalBonus += skills.销售技能 * 100;
            if (skills.制作技能) totalBonus += skills.制作技能 * 150;
            if (skills.服务技能) totalBonus += skills.服务技能 * 100;
            if (skills.管理技能) totalBonus += skills.管理技能 * 200;
            
            return Math.floor(totalBonus);
        }
    
        // 内部方法：计算特殊奖励
        function calculateSpecialBonus(employee) {
            let specialBonus = 0;
            
            // 检查成就完成情况
            if (employee.店铺信息.成就系统?.本月完成数 > 0) {
                specialBonus += employee.店铺信息.成就系统.本月完成数 * 100;
            }
    
            // 检查特殊贡献
            if (employee.店铺信息.员工信息.特殊贡献) {
                specialBonus += 300;
            }
    
            // 检查连续工作奖励
            const consecutiveWorkDays = employee.店铺信息.员工信息.连续工作天数 || 0;
            if (consecutiveWorkDays >= 7) {
                specialBonus += Math.floor(consecutiveWorkDays / 7) * 200;
            }
    
            // 检查顾客好评
            const positiveReviews = employee.店铺信息.员工信息.本月好评数 || 0;
            specialBonus += positiveReviews * 50;
    
            return Math.floor(specialBonus);
        }
    
        // 内部方法：发送消息
        async function sendMessage(userId, message) {
           this.e.reply(`向用户${userId}发送消息：${message}`);
            console.log(`向用户${userId}发送消息：${message}`);
        }
    }
    // 内部方法：敏感词检查
    containsSensitiveWords(name) {
        const sensitiveWords = [
            "管理员", "系统", "官方", "客服",
            "违规", "封禁", "黄色", "暴力"
        ];
        return sensitiveWords.some(word => name.includes(word));
    }

    // 内部方法：计算改名费用
     calculateRenameCost(user) {
        const basePrice = 1000;
        const changeCount = user.店铺信息.基础信息.改名记录?.length || 0;
        return basePrice * Math.pow(1.5, changeCount);
    }

// 进货流程处理
async processRestock(user) {
    const result = {
        success: true,
        newItems: [],
        totalCost: 0,
        expectedProfit: 0,
        suggestions: []
    };

    // 检查资金
    const availableFunds = user.money;
    if (availableFunds < 5000) {
        return {
            success: false,
            message: "资金不足呢,需要至少5000元进行进货哦~"
        };
    }

    // 生成商品池
    const furniturePool = await this.generateFurniturePool(user);

    // 智能选品
    const selectedItems = this.selectOptimalItems(furniturePool, user);

    // 计算成本和预期利润
    result.newItems = selectedItems;
    result.totalCost = selectedItems.reduce((sum, item) => sum + item.进货价, 0);
    result.expectedProfit = selectedItems.reduce((sum, item) => sum + (item.价格 - item.进货价), 0);

    // 生成进货建议
    result.suggestions = this.generateRestockSuggestions(user, selectedItems);

    return result;
}
// 内部方法：生成店铺形象
generateStoreImage(name) {
    // 风格关键词识别
    const styleKeywords = {
        温馨: ["温馨", "家", "爱"],
        可爱: ["萌", "甜", "喵"],
        优雅: ["雅", "轩", "庭"],
        奢华: ["御", "金", "皇"],
        文艺: ["风", "阁", "斋"],
        现代: ["时代", "未来", "新"]
    };

    // 识别店名风格
    let mainStyle = "温馨"; // 默认风格
    for (const [style, keywords] of Object.entries(styleKeywords)) {
        if (keywords.some(keyword => name.includes(keyword))) {
            mainStyle = style;
            break;
        }
    }

    // 生成店铺特色
    const storeStyles = {
        温馨: {
            特色标签: [
                "• 满满的温暖气息~",
                "• 像家一样舒适~",
                "• 治愈系的布置风格~"
            ],
            寄语: "愿这里成为每个人的温暖港湾~"
        },
        可爱: {
            特色标签: [
                "• 充满少女心的装饰~",
                "• 萌系元素点缀~",
                "• 甜甜的购物体验~"
            ],
            寄语: "让每一位顾客都感受到可爱的魔力~"
        },
        优雅: {
            特色标签: [
                "• 典雅的陈设布置~",
                "• 优雅的服务态度~",
                "• 高品质的购物体验~"
            ],
            寄语: "带给顾客优雅与品质的完美结合~"
        },
        奢华: {
            特色标签: [
                "• 金碧辉煌的装潢~",
                "• 尊贵的VIP服务~",
                "• 奢华的购物享受~"
            ],
            寄语: "为尊贵的顾客提供极致体验~"
        },
        文艺: {
            特色标签: [
                "• 文艺清新的氛围~",
                "• 独特的艺术格调~",
                "• 充满人文气息~"
            ],
            寄语: "让艺术与生活完美融合~"
        },
        现代: {
            特色标签: [
                "• 时尚前卫的设计~",
                "• 现代化的服务理念~",
                "• 科技感的购物体验~"
            ],
            寄语: "引领家具潮流新风尚~"
        }
    };

    return {
        主题风格: mainStyle,
        特色标签: storeStyles[mainStyle].特色标签,
        寄语: storeStyles[mainStyle].寄语
    };
}
// 生成商品池
async generateFurniturePool(user) {
    const baseItems = [
        {
            类型: "沙发", 
            风格系列: [
                {名称: "星光璀璨", 特点: "星空主题", 属性: "治愈系"},
                {名称: "樱花纷飞", 特点: "浪漫樱花", 属性: "少女系"},
                {名称: "梦幻蝶翼", 特点: "蝴蝶装饰", 属性: "梦幻系"},
                {名称: "魔法使", 特点: "魔法元素", 属性: "魔法系"},
                {名称: "甜心公主", 特点: "皇冠装饰", 属性: "公主系"},
                {名称: "森林精灵", 特点: "自然元素", 属性: "自然系"}
            ],
            价格区间: [1000, 10000]
        },
        {
            类型: "床品", 
            风格系列: [
                {名称: "云朵漫步", 特点: "棉花糖风", 属性: "轻柔系"},
                {名称: "月光宝盒", 特点: "月亮装饰", 属性: "神秘系"},
                {名称: "彩虹糖果", 特点: "缤纷色彩", 属性: "活力系"},
                {名称: "童话城堡", 特点: "城堡造型", 属性: "童话系"},
                {名称: "猫咪乐园", 特点: "猫耳设计", 属性: "萌宠系"},
                {名称: "星之守护", 特点: "星星点缀", 属性: "守护系"}
            ],
            价格区间: [2000, 15000]
        },
        {
            类型: "书桌", 
            风格系列: [
                {名称: "知识魔典", 特点: "魔法书造型", 属性: "学院系"},
                {名称: "时光记事", 特点: "复古怀旧", 属性: "时光系"},
                {名称: "未来科技", 特点: "科技感", 属性: "科技系"},
                {名称: "花之物语", 特点: "花卉装饰", 属性: "花园系"},
                {名称: "音符飞扬", 特点: "音乐元素", 属性: "音乐系"},
                {名称: "海洋之心", 特点: "水波纹理", 属性: "海洋系"}
            ],
            价格区间: [800, 8000]
        },
        {
            类型: "衣柜", 
            风格系列: [
                {名称: "次元之门", 特点: "空间魔法", 属性: "次元系"},
                {名称: "水晶之恋", 特点: "水晶装饰", 属性: "华丽系"},
                {名称: "翅膀守护", 特点: "天使翅膀", 属性: "天使系"},
                {名称: "甜甜圈", 特点: "甜点造型", 属性: "甜心系"},
                {名称: "童话书", 特点: "故事插画", 属性: "绘本系"},
                {名称: "魔法衣橱", 特点: "变身道具", 属性: "变身系"}
            ],
            价格区间: [1500, 12000]
        }
    ];

    const pool = [];
    for (const base of baseItems) {
        for (const style of base.风格系列) {
            const price = Math.floor(
                base.价格区间[0] + 
                Math.random() * (base.价格区间[1] - base.价格区间[0])
            );
            
            pool.push({
                名称: `${style.名称}${base.类型}`,
                类型: base.类型,
                风格: style.名称,
                特点: style.特点,
                属性: style.属性,
                价格: price,
                进货价: Math.floor(price * 0.6),
                品质: Math.floor(Math.random() * 40) + 60,
                特色: this.generateFurnitureFeatures(),
                萌属性: this.generateMoeAttributes(),
                限定等级: this.generateLimitedRank(),
                稀有度: this.generateRarity(),
                附魔效果: this.generateEnchantments(),
                隐藏特性: this.generateHiddenTraits(),
                适用空间: this.generateApplicableSpaces(),
                材质: this.generateMaterials(base.类型),
                上架时间: new Date().toLocaleString()
            });
        }
    }
    return pool;
}

// 生成萌属性
generateMoeAttributes() {
    const moeTraits = [
        "软萌可爱",
        "清新治愈",
        "元气满满",
        "梦幻华丽",
        "甜美温馨",
        "童话风格",
        "少女心满满",
        "闪耀星光",
        "温暖治愈",
        "活力四射",
        "优雅高贵",
        "神秘魔法",
        "可爱娇俏",
        "浪漫梦幻"
    ];
    return moeTraits.filter(() => Math.random() > 0.7);
}

// 生成限定等级
generateLimitedRank() {
    const ranks = [
        {级别: "普通", 概率: 0.4},
        {级别: "精良", 概率: 0.3},
        {级别: "稀有", 概率: 0.15},
        {级别: "史诗", 概率: 0.1},
        {级别: "传说", 概率: 0.05}
    ];
    
    const roll = Math.random();
    let cumulative = 0;
    for (const rank of ranks) {
        cumulative += rank.概率;
        if (roll <= cumulative) {
            return rank.级别;
        }
    }
    return "普通";
}

// 生成稀有度
generateRarity() {
    const stars = Math.floor(Math.random() * 5) + 1;
    return "⭐".repeat(stars);
}

// 生成附魔效果
generateEnchantments() {
    const enchantments = [
        "幸福光环",
        "治愈之力",
        "梦想祝福",
        "星光加持",
        "元气充能",
        "心情提升",
        "灵感激发",
        "守护之心"
    ];
    return enchantments.filter(() => Math.random() > 0.8);
}

// 生成隐藏特性
generateHiddenTraits() {
    const traits = [
        "月光祝福",
        "梦想成真",
        "幸运之星",
        "心愿之力",
        "友情羁绊",
        "奇迹之光"
    ];
    return traits.filter(() => Math.random() > 0.9);
}

// 生成家具特色
generateFurnitureFeatures() {
    const features = [
        "变身功能",
        "治愈光环",
        "梦幻变形",
        "星光闪耀",
        "元气充能",
        "幸运加持",
        "心情提升",
        "空间扩展",
        "记忆存储",
        "音乐共鸣",
        "季节感应",
        "环保净化"
    ];
    return features.filter(() => Math.random() > 0.7);
}

// 生成适用空间
generateApplicableSpaces() {
    const spaces = [
        "梦幻闺房",
        "治愈书房",
        "魔法客厅",
        "星光餐厅",
        "童话儿童房",
        "精灵花园",
        "音乐工作室",
        "cosplay房间"
    ];
    return spaces.filter(() => Math.random() > 0.6);
}

// 生成材质信息
generateMaterials(type) {
    const materials = {
        沙发: ["魔法绒布", "星光皮革", "梦幻丝绸", "治愈棉麻"],
        床品: ["云朵棉", "星辰绸缎", "治愈纤维", "梦幻蕾丝"],
        书桌: ["魔法原木", "星光玻璃", "梦幻金属", "童话彩绘"],
        衣柜: ["次元板材", "星光镜面", "魔法水晶", "童话木材"]
    };
    return materials[type].filter(() => Math.random() > 0.5);
}

// 智能选品算法
selectOptimalItems(pool, user) {
    const selected = [];
    const currentTrends = this.analyzeTrends(user);
    const customerPreferences = this.analyzeCustomerPreferences(user);

    // 根据销售数据和顾客偏好进行智能选品
    pool.sort((a, b) => {
        let scoreA = this.calculateItemScore(a, currentTrends, customerPreferences);
        let scoreB = this.calculateItemScore(b, currentTrends, customerPreferences);
        return scoreB - scoreA;
    });

    // 选择最优的商品
    for (let item of pool) {
        if (selected.length >= 5) break;
        if (this.isItemSuitable(item, user)) {
            selected.push(item);
        }
    }

    return selected;
}

// 分析市场趋势
analyzeTrends(user) {
    const trends = {
        热门风格: [],
        热销价位: [],
        受欢迎材质: [],
        季节性需求: [],
        流行萌属性: [],
        稀有度偏好: [],
        热门附魔: []
    };

    // 分析历史销售数据
    if (user.店铺信息.销售记录) {
        const recentSales = user.店铺信息.销售记录.slice(-30); // 分析最近30条销售记录
        
        // 统计热门风格
        const styleCount = {};
        const moeCount = {};
        const enchantCount = {};
        const rarityCount = {};

        recentSales.forEach(sale => {
            // 风格统计
            if (sale.商品风格) {
                styleCount[sale.商品风格] = (styleCount[sale.商品风格] || 0) + 1;
            }
            // 萌属性统计
            if (sale.萌属性) {
                sale.萌属性.forEach(attr => {
                    moeCount[attr] = (moeCount[attr] || 0) + 1;
                });
            }
            // 附魔效果统计
            if (sale.附魔效果) {
                sale.附魔效果.forEach(enchant => {
                    enchantCount[enchant] = (enchantCount[enchant] || 0) + 1;
                });
            }
            // 稀有度统计
            if (sale.稀有度) {
                rarityCount[sale.稀有度] = (rarityCount[sale.稀有度] || 0) + 1;
            }
        });

        // 处理统计结果
        trends.热门风格 = Object.entries(styleCount)
            .sort((a, b) => b[1] - a[1])
            .map(([style]) => style);

        trends.流行萌属性 = Object.entries(moeCount)
            .sort((a, b) => b[1] - a[1])
            .map(([attr]) => attr);

        trends.热门附魔 = Object.entries(enchantCount)
            .sort((a, b) => b[1] - a[1])
            .map(([enchant]) => enchant);

        trends.稀有度偏好 = Object.entries(rarityCount)
            .sort((a, b) => b[1] - a[1])
            .map(([rarity]) => rarity);

        // 分析价位区间
        const prices = recentSales.map(sale => sale.成交价格);
        trends.热销价位 = [
            Math.min(...prices),
            Math.max(...prices)
        ];

        // 季节性分析
        const currentMonth = new Date().getMonth();
        trends.季节性需求 = this.getSeasonalDemand(currentMonth);
    }

    return trends;
}

// 获取季节性需求
getSeasonalDemand(month) {
    const seasonalItems = {
        春季: ["樱花系列", "春日野餐", "清新自然"],
        夏季: ["海洋主题", "清凉冰系", "夏日祭典"],
        秋季: ["枫叶物语", "学院风格", "温暖治愈"],
        冬季: ["雪花系列", "圣诞主题", "温暖小屋"]
    };

    if (month >= 2 && month <= 4) return seasonalItems.春季;
    if (month >= 5 && month <= 7) return seasonalItems.夏季;
    if (month >= 8 && month <= 10) return seasonalItems.秋季;
    return seasonalItems.冬季;
}

// 分析顾客偏好
analyzeCustomerPreferences(user) {
    const preferences = {
        风格偏好: new Set(),
        价格敏感度: 0,
        品质要求: 0,
        萌属性倾向: new Set(),
        稀有度追求: 0,
        附魔效果偏好: new Set(),
        功能需求: new Set()
    };

    // 分析顾客反馈
    if (user.店铺信息.销售记录) {
        user.店铺信息.销售记录.forEach(record => {
            if (record.顾客评价 && record.顾客反馈) {
                // 分析评价内容
                if (record.顾客评价.includes("价格")) preferences.价格敏感度++;
                if (record.顾客评价.includes("品质")) preferences.品质要求++;
                if (record.顾客评价.includes("可爱")) preferences.萌属性倾向.add("可爱系");
                if (record.顾客评价.includes("稀有")) preferences.稀有度追求++;
                
                // 记录风格偏好
                if (record.商品风格) {
                    preferences.风格偏好.add(record.商品风格);
                }

                // 记录附魔效果偏好
                if (record.附魔效果) {
                    record.附魔效果.forEach(effect => {
                        preferences.附魔效果偏好.add(effect);
                    });
                }

                // 功能需求分析
                if (record.顾客评价.includes("收纳")) preferences.功能需求.add("收纳功能");
                if (record.顾客评价.includes("变形")) preferences.功能需求.add("变形功能");
                if (record.顾客评价.includes("治愈")) preferences.功能需求.add("治愈功能");
            }
        });
    }

    return preferences;
}

// 计算商品得分
calculateItemScore(item, trends, preferences) {
    let score = 0;
    
    // 基础分
    score += item.品质;
    
    // 稀有度加分
    score += item.稀有度.length * 10;
    
    // 限定等级加分
    const rankScores = {
        "普通": 0,
        "精良": 10,
        "稀有": 20,
        "史诗": 35,
        "传说": 50
    };
    score += rankScores[item.限定等级] || 0;
    
    // 萌属性加分
    item.萌属性.forEach(attr => {
        if (preferences.萌属性倾向.has(attr)) score += 15;
    });
    
    // 附魔效果加分
    item.附魔效果.forEach(enchant => {
        if (preferences.附魔效果偏好.has(enchant)) score += 12;
    });
    
    // 季节性加分
    if (trends.季节性需求.includes(item.风格)) score += 25;
    
    // 价格区间加分
    if (item.价格 >= trends.热销价位[0] && item.价格 <= trends.热销价位[1]) {
        score += 20;
    }
    
    // 特色功能加分
    item.特色.forEach(feature => {
        if (preferences.功能需求.has(feature)) score += 10;
    });

    return score;
}

// 判断商品是否适合当前店铺
isItemSuitable(item, user) {
    // 检查价格是否在店铺定位范围内
    const averagePrice = user.店铺信息.商品管理.当前库存.reduce((sum, item) => sum + item.价格, 0) / 
                        (user.店铺信息.商品管理.当前库存.length || 1);
    
    if (Math.abs(item.价格 - averagePrice) > averagePrice * 0.5) return false;
    
    // 检查是否与现有库存重复
    if (user.店铺信息.商品管理.当前库存.some(existing => existing.名称 === item.名称)) return false;
    
    // 检查是否符合店铺风格
    if (user.店铺信息.基础信息.店铺特色 && 
        !item.风格.includes(user.店铺信息.基础信息.店铺特色)) {
        return false;
    }
    
    // 检查商品等级是否符合店铺等级
    const storeLevel = user.店铺信息.基础信息.店铺等级;
    const itemRankLevel = {
        "普通": 1,
        "精良": 2,
        "稀有": 3,
        "史诗": 4,
        "传说": 5
    };
    
    if (itemRankLevel[item.限定等级] > storeLevel + 2) return false;
    
    return true;
}

// 生成进货建议
generateRestockSuggestions(user, selectedItems) {
    const suggestions = [];
    
    // 分析库存结构
    const inventoryAnalysis = this.analyzeInventory(user.店铺信息.商品管理.当前库存);
    
    // 根据分析生成建议
    if (inventoryAnalysis.价格带分布.低端 > 50) {
        suggestions.push("• 建议增加一些高级限定款呢~");
    }
    if (inventoryAnalysis.品类分布.不均衡) {
        suggestions.push("• 可以考虑引入新的萌系列哦~");
    }
    if (inventoryAnalysis.库存周转率.低) {
        suggestions.push("• 要注意关注商品受欢迎程度呢~");
    }
    
    // 季节性建议
    const currentMonth = new Date().getMonth();
    const seasonalSuggestion = this.getSeasonalSuggestion(currentMonth);
    suggestions.push(`• ${seasonalSuggestion}`);
    
    // 新品建议
    if (selectedItems.length > 0) {
        const specialItem = selectedItems.find(item => item.限定等级 === "传说" || item.限定等级 === "史诗");
        if (specialItem) {
            suggestions.push(`• 这次进的${specialItem.名称}很适合作为店铺主打呢~`);
        }
    }
    
    return suggestions;
}

// 获取季节建议
getSeasonalSuggestion(month) {
    const suggestions = {
        春季: "春天来啦,樱花系列会很受欢迎哦~",
        夏季: "天气变热了,清凉系列最适合不过啦~",
        秋季: "秋高气爽,学院风格很应景呢~",
        冬季: "冬天到了,温暖系列一定很受欢迎~"
    };

    if (month >= 2 && month <= 4) return suggestions.春季;
    if (month >= 5 && month <= 7) return suggestions.夏季;
    if (month >= 8 && month <= 10) return suggestions.秋季;
    return suggestions.冬季;
}

// 分析库存结构
analyzeInventory(inventory) {
    const analysis = {
        价格带分布: {
            低端: 0,
            中端: 0,
            高端: 0
        },
        品类分布: {
            不均衡: false
        },
        库存周转率: {
            低: false
        },
        稀有度分布: {
            普通: 0,
            精良: 0,
            稀有: 0,
            史诗: 0,
            传说: 0
        }
    };

    // 计算各项分布
    inventory.forEach(item => {
        // 价格带分析
        if (item.价格 < 1000) analysis.价格带分布.低端++;
        else if (item.价格 < 5000) analysis.价格带分布.中端++;
        else analysis.价格带分布.高端++;

        // 稀有度分析
        analysis.稀有度分布[item.限定等级]++;
    });

    // 计算分布比例
    const total = inventory.length;
    analysis.价格带分布.低端= (analysis.价格带分布.低端/ total) * 100;
    analysis.价格带分布.中端= (analysis.价格带分布.中端/ total) * 100;
    analysis.价格带分布.高端= (analysis.价格带分布.高端/ total) * 100;

    // 判断品类是否均衡
    const typeCount = {};
    inventory.forEach(item => {
        typeCount[item.类型] = (typeCount[item.类型] || 0) + 1;
    });
    const typeVariance = Object.values(typeCount).reduce((sum, count) => 
        sum + Math.pow(count - (total / Object.keys(typeCount).length), 2), 0);
    analysis.品类分布.不均衡 = typeVariance > total / 2;

    return analysis;
}
    recordSale(buyerId, item) {
        const salesRecords = fs.existsSync(SALES_RECORDS_FILE_PATH) ? JSON.parse(fs.readFileSync(SALES_RECORDS_FILE_PATH)) : [];
        salesRecords.push({ name: item.name, price: item.price, buyer: buyerId });
        fs.writeFileSync(SALES_RECORDS_FILE_PATH, JSON.stringify(salesRecords, null, 2));
    }
}