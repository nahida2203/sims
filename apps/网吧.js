import { segment } from 'icqq';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from '../../../lib/puppeteer/puppeteer.js';
import path from 'path';
import {
    saveUserData,
    loadAllUsers,
    checkUserData,
} from '../function/function.js';
import { checkCooldown, setCooldown } from '../function/cooldown.js';
import Redis from 'ioredis';
import fs from 'fs';
const _path = process.cwd();
const redis = new Redis();
const netbarData = JSON.parse(fs.readFileSync('plugins/sims-plugin/data/netbar_data.json', 'utf8'));
export class Netbar extends plugin {
    constructor() {
        super({
            name: '模拟人生-网吧',
            dsc: '模拟经营网吧',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#创建网吧$',
                    fnc: 'createNetbar'
                },
                {
                    reg: '^#网吧信息$',
                    fnc: 'showNetbarInfo'
                },
                {
                    reg: '^#雇佣员工.*$',
                    fnc: 'hireEmployee'
                },
                {
                    reg: '^#解雇员工.*$',
                    fnc: 'fireEmployee'
                },
                {
                    reg: '^#购买设备.*$',
                    fnc: 'buyEquipment'
                },
                {
                    reg: '^#维护设备.*$',
                    fnc: 'maintainEquipment'
                }
            ]
        });

        this.task = {
            cron: '0 * * * *',
            name: 'hourlyUpdate',
            fnc: () => this.hourlyUpdate()
        };
    }
    async createNetbar(e) {
        try {
            const remainingTime = checkCooldown(e.user_id, 'netbar', 'create');
            if (remainingTime > 0) {
                e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
                return;
            }

            
            const userId = e.user_id;
            const userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));

            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                e.reply("数据异常，请联系管理员！");
                return;
            }
            if (userData.netbar) {
                e.reply("你已经拥有一家网吧了！");
                return;
            }
            if (userData.money < 50000) {
                e.reply("创建网吧需要50000元启动资金！");
                return;
            }
            userData.netbar = {
                name: `${userData.name}的网吧`,
                level: 1,
                experience: 0,
                computers: {
                    basic: 5,
                    standard: 0,
                    premium: 0
                },
                staff: [],
                cleanliness: 100,
                reputation: 50,
                members: {
                    normal: 0,
                    silver: 0,
                    gold: 0,
                    diamond: 0
                },
                income: 0,
                expenses: 0,
                dailyIncome: 0,
                dailyExpenses: 0,
                lastUpdate: new Date().toISOString(),
                facilities: {
                    airConditioner: true,
                    wifi: true,
                    securitySystem: true,
                    snackBar: false,
                    restArea: false,
                    gamingArea: false
                },
                environment: {
                    temperature: 25,
                    noise: 50,
                    lighting: 80,
                    airQuality: 90,
                    rating: 85
                },
                maintenance: {
                    status: 100,
                    lastMaintenance: new Date().toISOString(),
                    totalCost: 0
                },
                statistics: {
                    totalCustomers: 0,
                    currentCustomers: 0,
                    peakHours: [],
                    popularGames: {},
                    customerFeedback: [],
                    dailyStats: [],
                    average_rating: 4.5,
                    memberSatisfaction: 85,
                    serviceQuality: 80,
                    basicUsage: 0.6,
                    standardUsage: 0,
                    premiumUsage: 0
                },
                creditPoints: 100
            };

            // 扣除启动资金
            userData.money -= 50000;
            userData.happiness += 10;
            userData.mood += 5; // 保存数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            setCooldown(e.user_id, 'netbar', 'create');
            let data = {
                tplFile: './plugins/sims-plugin/resources/HTML/netbar_panel.html',
                name: userData.netbar.name,
                level: userData.netbar.level,
                reputation: userData.netbar.reputation,
                dailyIncome: userData.netbar.dailyIncome,
                memberCount: 0,
                currentCustomers: 0,
                rating: 4.5,
                computers: {
                    basic: 5,
                    standard: 0,
                    premium: 0,
                    basicUsage: 60,
                    standardUsage: 0,
                    premiumUsage: 0
                },
                maintenance: 100,
                staff: [],
                cleanliness: 100,
                environment: 85,
                memberSatisfaction: 85,
                serviceQuality: 80
            };

            let img = await puppeteer.screenshot('netbar', {
                ...data,
            });
            e.reply([
                segment.at(e.user_id),
                img
            ]);
        } catch (error) {
            console.error('[网吧插件] 创建失败:', error);
        e.reply("创建网吧时发生错误，请检查模板文件或稍后再试~");
        }
    }

    async showNetbarInfo(e) {
        try {
            const remainingTime = checkCooldown(e.user_id, 'netbar', 'info');
            if (remainingTime > 0) {
                e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
                return;
            }
    
            const userId = e.user_id;
            const userData = await checkUserData(userId);
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                e.reply("数据异常，请联系管理员！");
                return;
            }
    
            if (!userData.netbar) {
                e.reply("你还没有网吧！请使用 #创建网吧 指令来创建一家网吧。");
                return;
            }
            this.updateNetbarStatus(userData.netbar);
            setCooldown(e.user_id, 'netbar', 'info');
            let data = {
                tplFile: './plugins/sims-plugin/resources/HTML/netbar_panel.html',
                name: userData.netbar.name,
                level: userData.netbar.level,
                reputation: userData.netbar.reputation,
                dailyIncome: userData.netbar.dailyIncome,
                memberCount: userData.netbar.members ? Object.values(userData.netbar.members).reduce((sum, count) => sum + count, 0) : 0,
                currentCustomers: userData.netbar.statistics.currentCustomers || 0,
                rating: userData.netbar.statistics.average_rating.toFixed(1),
                computers: {
                    basic: userData.netbar.computers.basic,
                    standard: userData.netbar.computers.standard,
                    premium: userData.netbar.computers.premium,
                    basicUsage: Math.round((userData.netbar.statistics.basicUsage || 0) * 100),
                    standardUsage: Math.round((userData.netbar.statistics.standardUsage || 0) * 100),
                    premiumUsage: Math.round((userData.netbar.statistics.premiumUsage || 0) * 100)
                },
                maintenance: userData.netbar.maintenance.status,
                staff: userData.netbar.staff.map(emp => ({
                    name: emp.name || `员工${emp.id}`,
                    position: emp.position,
                    satisfaction: emp.satisfaction
                })),
                cleanliness: userData.netbar.cleanliness,
                environment: userData.netbar.environment.rating,
                memberSatisfaction: userData.netbar.statistics.memberSatisfaction || 80,
                serviceQuality: userData.netbar.statistics.serviceQuality || 75
            };
    
            let img = await puppeteer.screenshot('netbar', data);
            e.reply(img);
        } catch (error) {
            console.error('[网吧插件] 渲染信息失败:', error);
            e.reply("网吧信息生成失败，请检查模板或稍后再试~"+ error);
            
        }
    }
    

    async hireEmployee(e) {
        try {
            
            const remainingTime = checkCooldown(e.user_id, 'netbar', 'hire');
            if (remainingTime > 0) {
                e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
                return;
            }

            
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

            const position = e.msg.replace('#雇佣员工', '').trim();
            const staffTypes = {
                '收银员': { 
                    salary: 3000,
                    skill: 5,
                    description: "负责收银和客户接待",
                    requirements: "基础服务技能",
                    benefits: ["五险一金", "带薪休假"]
                },
                '网管': { 
                    salary: 4000,
                    skill: 7,
                    description: "负责设备维护和技术支持",
                    requirements: "计算机维护经验",
                    benefits: ["五险一金", "带薪休假", "技术补贴"]
                },
                '保洁': { 
                    salary: 2500,
                    skill: 3,
                    description: "负责环境卫生维护",
                    requirements: "认真负责",
                    benefits: ["五险一金", "带薪休假"]
                },
                '经理': {
                    salary: 6000,
                    skill: 10,
                    description: "负责网吧整体运营",
                    requirements: "3年以上管理经验",
                    benefits: ["五险一金", "带薪休假", "年终奖金", "管理津贴"]
                }
            };

            if (!staffTypes[position]) {
                e.reply([
                    "无效的职位！可选职位：\n",
                    "1. 收银员 - 3000元/月\n",
                    "2. 网管 - 4000元/月\n",
                    "3. 保洁 - 2500元/月\n",
                    "4. 经理 - 6000元/月\n\n",
                    "使用 #雇佣员工 [职位] 来招募员工"
                ].join(''));
                return;
            }

            const staffLimit = userData.netbar.level * 3;
            if (userData.netbar.staff.length >= staffLimit) {
                e.reply(`当前网吧等级最多雇佣${staffLimit}名员工！请先升级网吧。`);
                return;
            }

            if (userData.money < staffTypes[position].salary) {
                e.reply(`雇佣${position}需要${staffTypes[position].salary}元，你的资金不足！`);
                return;
            }

            const employeeId = `EMP${Date.now().toString(36).toUpperCase()}`;

            // 添加员工
            userData.netbar.staff.push({
                id: employeeId,
                position: position,
                salary: staffTypes[position].salary,
                skill: staffTypes[position].skill,
                satisfaction: 100,
                experience: 0,
                workHours: 0,
                performance: 100,
                hireDate: new Date().toISOString(),
                benefits: staffTypes[position].benefits,
                status: "在岗"
            });

            // 扣除资金
            userData.money -= staffTypes[position].salary;
            userData.netbar.expenses += staffTypes[position].salary;

            // 更新网吧属性
            userData.netbar.reputation += 5;
            if (position === '保洁') userData.netbar.cleanliness += 20;
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            setCooldown(e.user_id, 'netbar', 'hire');
            let data = {
                tplFile: './plugins/sims-plugin/resources/HTML/netbar_panel.html',
                name: userData.netbar.name,
                level: userData.netbar.level,
                reputation: userData.netbar.reputation,
                dailyIncome: userData.netbar.dailyIncome,
                memberCount: userData.netbar.members ? Object.values(userData.netbar.members).reduce((sum, count) => sum + count, 0) : 0,
                currentCustomers: userData.netbar.statistics.currentCustomers || 0,
                rating: userData.netbar.statistics.average_rating.toFixed(1),
                computers: {
                    basic: userData.netbar.computers.basic,
                    standard: userData.netbar.computers.standard,
                    premium: userData.netbar.computers.premium,
                    basicUsage: Math.round((userData.netbar.statistics.basicUsage || 0) * 100),
                    standardUsage: Math.round((userData.netbar.statistics.standardUsage || 0) * 100),
                    premiumUsage: Math.round((userData.netbar.statistics.premiumUsage || 0) * 100)
                },
                maintenance: userData.netbar.maintenance.status,
                staff: userData.netbar.staff.map(emp => ({
                    name: emp.name || `员工${emp.id}`,
                    position: emp.position,
                    satisfaction: emp.satisfaction
                })),
                cleanliness: userData.netbar.cleanliness,
                environment: userData.netbar.environment.rating,
                memberSatisfaction: userData.netbar.statistics.memberSatisfaction || 80,
                serviceQuality: userData.netbar.statistics.serviceQuality || 75
            };

            let img = await puppeteer.screenshot('netbar', {
                ...data,
                saveId: e.user_id
            });

            e.reply([
                `🎉 成功雇佣了一名${position}！\n`,
                `员工ID：${employeeId}\n`,
                `月薪：${staffTypes[position].salary}元\n`,
                `技能等级：${staffTypes[position].skill}\n`,
                `工作内容：${staffTypes[position].description}\n\n`,
                "💡 员工管理小贴士：\n",
                "1. 定期关注员工满意度\n",
                "2. 合理安排工作时间\n",
                "3. 注意员工技能提升\n",
                "4. 及时发放工资和福利\n\n",
                "使用 #网吧信息 查看最新的员工状态！\n",
                img
            ]);
        } catch (error) {
            console.error(`雇佣员工出错：${error}`);
            e.reply("雇佣员工时发生错误，请联系管理员！");
        }
    }

    async fireEmployee(e) {
        try {
            const remainingTime = checkCooldown(e.user_id, 'netbar', 'fire');
            if (remainingTime > 0) {
                e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
                return;
            }
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

            // 解析员工编号
            const employeeId = e.msg.replace('#解雇员工', '').trim();
            const employeeIndex = userData.netbar.staff.findIndex(emp => emp.id === employeeId);

            if (employeeIndex === -1) {
                e.reply([
                    "未找到该员工！当前员工列表：\n",
                    ...userData.netbar.staff.map((emp, index) => 
                        `${index + 1}. ${emp.position} (ID: ${emp.id})\n`
                    ),
                    "\n使用 #解雇员工 [员工ID] 来解雇员工"
                ].join(''));
                return;
            }

            // 获取要解雇的员工信息
            const employee = userData.netbar.staff[employeeIndex];
            const workDays = Math.ceil((new Date() - new Date(employee.hireDate)) / (1000 * 60 * 60 * 24));
            const severancePay = Math.ceil(employee.salary * (workDays / 30) * 0.5); // 遣散费为工作时长的半个月工资

    
            if (userData.money < severancePay) {
                e.reply(`解雇员工需要支付${severancePay}元遣散费，你的资金不足！`);
                return;
            }

            // 更新数据
            userData.money -= severancePay;
            userData.netbar.staff.splice(employeeIndex, 1);
            userData.netbar.expenses += severancePay;
            userData.netbar.reputation = Math.max(0, userData.netbar.reputation - 5); // 解雇员工会略微影响声誉

            // 特殊职位的影响
            if (employee.position === '保洁') {
                userData.netbar.cleanliness = Math.max(0, userData.netbar.cleanliness - 20);
            }
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            setCooldown(e.user_id, 'netbar', 'fire');
            let data = {
                tplFile: './plugins/sims-plugin/resources/HTML/netbar_panel.html',
                name: userData.netbar.name,
                level: userData.netbar.level,
                reputation: userData.netbar.reputation,
                dailyIncome: userData.netbar.dailyIncome,
                memberCount: userData.netbar.members ? Object.values(userData.netbar.members).reduce((sum, count) => sum + count, 0) : 0,
                currentCustomers: userData.netbar.statistics.currentCustomers || 0,
                rating: userData.netbar.statistics.average_rating.toFixed(1),
                computers: {
                    basic: userData.netbar.computers.basic,
                    standard: userData.netbar.computers.standard,
                    premium: userData.netbar.computers.premium,
                    basicUsage: Math.round((userData.netbar.statistics.basicUsage || 0) * 100),
                    standardUsage: Math.round((userData.netbar.statistics.standardUsage || 0) * 100),
                    premiumUsage: Math.round((userData.netbar.statistics.premiumUsage || 0) * 100)
                },
                maintenance: userData.netbar.maintenance.status,
                staff: userData.netbar.staff.map(emp => ({
                    name: emp.name || `员工${emp.id}`,
                    position: emp.position,
                    satisfaction: emp.satisfaction
                })),
                cleanliness: userData.netbar.cleanliness,
                environment: userData.netbar.environment.rating,
                memberSatisfaction: userData.netbar.statistics.memberSatisfaction || 80,
                serviceQuality: userData.netbar.statistics.serviceQuality || 75
            };

            let img = await puppeteer.screenshot('netbar', {
                ...data,
                saveId: e.user_id
            });

            e.reply([
                `已解雇${employee.position}！\n`,
                `工作时长：${workDays}天\n`,
                `💰 支付遣散费：${severancePay}元\n`,
                "⚠️ 影响：\n",
                "- 声望略有下降\n",
                employee.position === '保洁' ? "- 清洁度显著下降\n" : "",
                "\n💡 人事变动提示：\n",
                "1. 及时补充人手保证服务质量\n",
                "2. 合理安排现有员工工作\n",
                "3. 注意维护团队稳定性\n",
                "4. 保持良好的工作环境\n",
                img
            ]);
        } catch (error) {
            console.error(`解雇员工出错：${error}`);
            e.reply("解雇员工时发生错误，请联系管理员！");
        }
    }

    async buyEquipment(e) {
        try {
            const remainingTime = checkCooldown(e.user_id, 'netbar', 'buy');
            if (remainingTime > 0) {
                e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
                return;
            }
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
            const params = e.msg.replace('#购买设备', '').trim().split(' ');
            if (params.length !== 2) {
                e.reply([
                    "格式错误！正确格式：#购买设备 [类型] [数量]\n",
                    "可选类型：\n",
                    "1. 基础 - 3000元/台\n",
                    "2. 标准 - 5000元/台\n",
                    "3. 高端 - 8000元/台\n\n",
                    "💡 设备说明：\n",
                    "基础配置：适合网页浏览和办公\n",
                    "标准配置：满足主流游戏需求\n",
                    "高端配置：支持高端游戏和专业应用"
                ].join(''));
                return;
            }

            const [type, count] = params;
            const typeMap = {
                '基础': 'basic',
                '标准': 'standard',
                '高端': 'premium'
            };
            const priceMap = {
                'basic': 3000,
                'standard': 5000,
                'premium': 8000
            };
            const performanceMap = {
                'basic': 5,
                'standard': 8,
                'premium': 12
            };

            if (!typeMap[type]) {
                e.reply("无效的设备类型！可选类型：基础、标准、高端");
                return;
            }

            const num = parseInt(count);
            if (isNaN(num) || num <= 0) {
                e.reply("购买数量必须是大于0的数字！");
                return;
            }

            // 检查空间限制
            const currentTotal = 
                userData.netbar.computers.basic +
                userData.netbar.computers.standard +
                userData.netbar.computers.premium;
            const spaceLimit = userData.netbar.level * 10;
            
            if (currentTotal + num > spaceLimit) {
                e.reply(`当前网吧等级最多容纳${spaceLimit}台电脑！请先升级网吧。`);
                return;
            }

            const totalCost = priceMap[typeMap[type]] * num;
            if (userData.money < totalCost) {
                e.reply(`购买${num}台${type}配置电脑需要${totalCost}元，你的资金不足！`);
                return;
            }
            userData.money -= totalCost;
            userData.netbar.computers[typeMap[type]] += num;
            userData.netbar.expenses += totalCost;
            userData.netbar.reputation += Math.floor(num * performanceMap[typeMap[type]] / 10);
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            setCooldown(e.user_id, 'netbar', 'buy');
            let data = {
                tplFile: './plugins/sims-plugin/resources/HTML/netbar_panel.html',
                name: userData.netbar.name,
                level: userData.netbar.level,
                reputation: userData.netbar.reputation,
                dailyIncome: userData.netbar.dailyIncome,
                memberCount: userData.netbar.members ? Object.values(userData.netbar.members).reduce((sum, count) => sum + count, 0) : 0,
                currentCustomers: userData.netbar.statistics.currentCustomers || 0,
                rating: userData.netbar.statistics.average_rating.toFixed(1),
                computers: {
                    basic: userData.netbar.computers.basic,
                    standard: userData.netbar.computers.standard,
                    premium: userData.netbar.computers.premium,
                    basicUsage: Math.round((userData.netbar.statistics.basicUsage || 0) * 100),
                    standardUsage: Math.round((userData.netbar.statistics.standardUsage || 0) * 100),
                    premiumUsage: Math.round((userData.netbar.statistics.premiumUsage || 0) * 100)
                },
                maintenance: userData.netbar.maintenance.status,
                staff: userData.netbar.staff.map(emp => ({
                    name: emp.name || `员工${emp.id}`,
                    position: emp.position,
                    satisfaction: emp.satisfaction
                })),
                cleanliness: userData.netbar.cleanliness,
                environment: userData.netbar.environment.rating,
                memberSatisfaction: userData.netbar.statistics.memberSatisfaction || 80,
                serviceQuality: userData.netbar.statistics.serviceQuality || 75
            };

            let img = await puppeteer.screenshot('netbar', {
                ...data,
                saveId: e.user_id
            });

            e.reply([
                `🎉 成功购买了${num}台${type}配置电脑！\n`,
                `💰 总花费：${totalCost}元\n`,
                `📈 声誉提升：+${Math.floor(num * performanceMap[typeMap[type]] / 10)}\n\n`,
                "💡 设备管理小贴士：\n",
                "1. 定期使用 #维护设备 保养电脑\n",
                "2. 保持环境整洁延长设备寿命\n",
                "3. 根据客流量调整设备配置\n",
                "4. 及时处理设备故障\n",
                "5. 注意设备使用时间\n\n",
                "使用 #网吧信息 查看最新的设备状态！\n",
                img
            ]);
        } catch (error) {
            console.error(`购买设备出错：${error}`);
            e.reply("购买设备时发生错误，请联系管理员！");
        }
    }

    async maintainEquipment(e) {
        try {
            
            const remainingTime = checkCooldown(e.user_id, 'netbar', 'maintain');
            if (remainingTime > 0) {
                e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
                return;
            }

            
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

            // 计算维护费用
            const maintenanceCosts = {
                basic: userData.netbar.computers.basic * 80,
                standard: userData.netbar.computers.standard * 120,
                premium: userData.netbar.computers.premium * 200
            };
            
            const totalCost = maintenanceCosts.basic + maintenanceCosts.standard + maintenanceCosts.premium;

            if (userData.money < totalCost) {
                e.reply([
                    `维护所有设备需要${totalCost}元：\n`,
                    `- 基础配置：${maintenanceCosts.basic}元\n`,
                    `- 标准配置：${maintenanceCosts.standard}元\n`,
                    `- 高端配置：${maintenanceCosts.premium}元\n\n`,
                    "你的资金不足！"
                ].join(''));
                return;
            }

            // 检查是否有网管
            const hasTechnician = userData.netbar.staff.some(emp => emp.position === '网管');
            const maintenanceBonus = hasTechnician ? 20 : 0; // 有网管维护效果提升20%

            userData.money -= totalCost;
            userData.netbar.maintenance.status = 100 + maintenanceBonus;
            userData.netbar.maintenance.lastMaintenance = new Date().toISOString();
            userData.netbar.maintenance.totalCost += totalCost;
            userData.netbar.expenses += totalCost;
            userData.netbar.reputation = Math.min(100, userData.netbar.reputation + 5);

            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);

            setCooldown(e.user_id, 'netbar', 'maintain');

            let data = {
                tplFile: './plugins/sims-plugin/resources/HTML/netbar_panel.html',
                name: userData.netbar.name,
                level: userData.netbar.level,
                reputation: userData.netbar.reputation,
                dailyIncome: userData.netbar.dailyIncome,
                memberCount: userData.netbar.members ? Object.values(userData.netbar.members).reduce((sum, count) => sum + count, 0) : 0,
                currentCustomers: userData.netbar.statistics.currentCustomers || 0,
                rating: userData.netbar.statistics.average_rating.toFixed(1),
                computers: {
                    basic: userData.netbar.computers.basic,
                    standard: userData.netbar.computers.standard,
                    premium: userData.netbar.computers.premium,
                    basicUsage: Math.round((userData.netbar.statistics.basicUsage || 0) * 100),
                    standardUsage: Math.round((userData.netbar.statistics.standardUsage || 0) * 100),
                    premiumUsage: Math.round((userData.netbar.statistics.premiumUsage || 0) * 100)
                },
                maintenance: userData.netbar.maintenance.status,
                staff: userData.netbar.staff.map(emp => ({
                    name: emp.name || `员工${emp.id}`,
                    position: emp.position,
                    satisfaction: emp.satisfaction
                })),
                cleanliness: userData.netbar.cleanliness,
                environment: userData.netbar.environment.rating,
                memberSatisfaction: userData.netbar.statistics.memberSatisfaction || 80,
                serviceQuality: userData.netbar.statistics.serviceQuality || 75
            };

            let img = await puppeteer.screenshot('netbar', {
                ...data,
                saveId: e.user_id
            });

            e.reply([
                `🔧 设备维护完成！\n`,
                `维护费用：${totalCost}元\n`,
                `维护状态：${userData.netbar.maintenance.status}%\n`,
                hasTechnician ? "💡 网管提供了20%的维护效果加成！\n" : "",
                "\n💡 维护提示：\n",
                "1. 保持设备定期维护\n",
                "2. 注意设备使用状态\n",
                "3. 及时处理故障隐患\n",
                "4. 雇佣网管提升维护效果\n",
                img
            ]);
        } catch (error) {
            console.error(`维护设备出错：${error}`);
            e.reply("维护设备时发生错误，请联系管理员！");
        }
    }

    async hourlyUpdate() {
        try {
            const allUsers = await loadAllUsers();
            for (const userId in allUsers) {
                const userData = allUsers[userId];
                if (!userData.netbar) continue;
                const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
                if (!redisUserData || !redisUserData.netbar) continue;
                this.updateNetbarStatus(userData.netbar);
                await redis.set(`user:${userId}`, JSON.stringify(userData));
                await saveUserData(userId, userData);
            }
        } catch (error) {
            console.error(`每小时更新出错：${error}`);
        }
    }
    updateNetbarStatus(netbar) {
        try {
            // 计算当前时间段的客流量
            const hour = new Date().getHours();
            let customerMultiplier = 1;
            
            // 根据时间段调整客流量
            if (hour >= 9 && hour <= 11) customerMultiplier = 0.8;  // 上午
            else if (hour >= 12 && hour <= 14) customerMultiplier = 1.2; // 午餐时间
            else if (hour >= 15 && hour <= 17) customerMultiplier = 0.7; // 下午
            else if (hour >= 18 && hour <= 22) customerMultiplier = 1.5; // 晚高峰
            else if (hour >= 23 || hour <= 4) customerMultiplier = 1.3;  // 夜间
            else customerMultiplier = 0.5; // 其他时间

            // 根据环境因素调整客流量
            customerMultiplier *= (netbar.cleanliness / 100);
            customerMultiplier *= (netbar.reputation / 100);
            
            // 更新收入
            const baseIncome = (
                netbar.computers.basic * 5 +
                netbar.computers.standard * 8 +
                netbar.computers.premium * 12
            ) * customerMultiplier;

            netbar.dailyIncome = Math.floor(baseIncome);

            // 更新支出
            const baseExpenses = (
                netbar.computers.basic * 1 +
                netbar.computers.standard * 2 +
                netbar.computers.premium * 3 +
                netbar.staff.length * 10
            );

            netbar.dailyExpenses = Math.floor(baseExpenses);

            // 更新环境数据
            netbar.environment.temperature = Math.max(20, Math.min(30, netbar.environment.temperature + (Math.random() * 2 - 1)));
            netbar.environment.noise = Math.max(30, Math.min(80, netbar.environment.noise + (Math.random() * 5 - 2.5)));
            netbar.environment.airQuality = Math.max(60, Math.min(100, netbar.environment.airQuality - (Math.random() * 2)));

            // 更新设备状态
            netbar.maintenance.status = Math.max(0, netbar.maintenance.status - 0.5);

            // 更新清洁度
            netbar.cleanliness = Math.max(0, netbar.cleanliness - 1);

            // 更新使用率
            netbar.statistics.basicUsage = Math.min(1, Math.max(0, netbar.statistics.basicUsage + (Math.random() * 0.2 - 0.1)));
            netbar.statistics.standardUsage = Math.min(1, Math.max(0, netbar.statistics.standardUsage + (Math.random() * 0.2 - 0.1)));
            netbar.statistics.premiumUsage = Math.min(1, Math.max(0, netbar.statistics.premiumUsage + (Math.random() * 0.2 - 0.1)));

            // 更新当前客户数
            netbar.statistics.currentCustomers = Math.floor(
                (netbar.computers.basic * netbar.statistics.basicUsage +
                netbar.computers.standard * netbar.statistics.standardUsage +
                netbar.computers.premium * netbar.statistics.premiumUsage) * customerMultiplier
            );

            // 记录统计数据
            netbar.statistics.dailyStats.push({
                date: new Date().toISOString(),
                income: netbar.dailyIncome,
                expenses: netbar.dailyExpenses,
                customers: netbar.statistics.currentCustomers,
                hourlyCustomers: {
                    [hour]: netbar.statistics.currentCustomers
                }
            });

            // 只保留最近30天的数据
            if (netbar.statistics.dailyStats.length > 30) {
                netbar.statistics.dailyStats.shift();
            }

            // 更新总收入和支出
            netbar.income += netbar.dailyIncome;
            netbar.expenses += netbar.dailyExpenses;
        } catch (error) {
            console.error(`更新网吧状态出错：${error}`);
        }
    }
}