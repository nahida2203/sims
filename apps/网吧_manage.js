
import { segment } from 'icqq';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from '../../../lib/puppeteer/puppeteer.js';
import fs from 'fs';
import {
    saveUserData,
    loadAllUsers,
    checkUserData,
} from '../function/function.js';
import { checkCooldown, setCooldown } from '../function/cooldown.js';
import Redis from 'ioredis';
const redis = new Redis();
export class NetbarManage extends plugin {
    constructor() {
        super({
            name: '模拟人生-网吧管理',
            dsc: '网吧高级管理功能',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#网吧升级$',
                    fnc: 'upgradeNetbar'
                },
                {
                    reg: '^#设施(添加|升级|维护).*$',
                    fnc: 'manageFacilities'
                },
                {
                    reg: '^#员工培训.*$',
                    fnc: 'trainEmployee'
                },
                {
                    reg: '^#举办活动.*$',
                    fnc: 'organizeEvent'
                },
                {
                    reg: '^#调整环境.*$',
                    fnc: 'adjustEnvironment'
                }
            ]
        });
    }

    async upgradeNetbar(e) {
        try {
            const remainingTime = checkCooldown(e.user_id, 'netbar', 'upgrade');
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

            // 计算升级费用和要求
            const currentLevel = userData.netbar.level;
            const upgradeCost = Math.pow(currentLevel, 2) * 50000;
            const requiredReputation = currentLevel * 20;
            const requiredExperience = Math.pow(currentLevel, 2) * 1000;

            // 检查升级条件
            if (userData.money < upgradeCost) {
                e.reply(`升级到${currentLevel + 1}级需要${upgradeCost}元，你的资金不足！`);
                return;
            }

            if (userData.netbar.reputation < requiredReputation) {
                e.reply(`升级需要${requiredReputation}点声望，当前声望不足！`);
                return;
            }

            if (userData.netbar.experience < requiredExperience) {
                e.reply(`升级需要${requiredExperience}点经验，当前经验不足！`);
                return;
            }

            // 执行升级
            userData.money -= upgradeCost;
            userData.netbar.level += 1;
            userData.netbar.experience -= requiredExperience;
            userData.netbar.reputation += 10;

            // 解锁新设施（根据等级）
            if (currentLevel + 1 === 2) {
                userData.netbar.facilities.snackBar = true;
            } else if (currentLevel + 1 === 3) {
                userData.netbar.facilities.restArea = true;
            } else if (currentLevel + 1 === 4) {
                userData.netbar.facilities.gamingArea = true;
            }
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            setCooldown(e.user_id, 'netbar', 'upgrade');
            let data = {
                tplFile: './plugins/sims-plugin/resources/HTML/netbar_panel.html',
                name: userData.netbar.name,
                level: userData.netbar.level,
                reputation: userData.netbar.reputation,
                dailyIncome: userData.netbar.dailyIncome,
                memberCount: Object.values(userData.netbar.members).reduce((sum, count) => sum + count, 0),
                currentCustomers: userData.netbar.statistics.currentCustomers,
                rating: userData.netbar.statistics.average_rating.toFixed(1),
                computers: {
                    basic: userData.netbar.computers.basic,
                    standard: userData.netbar.computers.standard,
                    premium: userData.netbar.computers.premium,
                    basicUsage: Math.round(userData.netbar.statistics.basicUsage * 100),
                    standardUsage: Math.round(userData.netbar.statistics.standardUsage * 100),
                    premiumUsage: Math.round(userData.netbar.statistics.premiumUsage * 100)
                },
                maintenance: userData.netbar.maintenance.status,
                staff: userData.netbar.staff.map(emp => ({
                    name: emp.name || `员工${emp.id}`,
                    position: emp.position,
                    satisfaction: emp.satisfaction
                })),
                cleanliness: userData.netbar.cleanliness,
                environment: userData.netbar.environment.rating,
                memberSatisfaction: userData.netbar.statistics.memberSatisfaction,
                serviceQuality: userData.netbar.statistics.serviceQuality
            };

            let img = await puppeteer.screenshot('netbar', {
                ...data,
                saveId: e.user_id
            });

            e.reply([
                `🎉 网吧成功升级到${userData.netbar.level}级！\n`,
                `💰 升级费用：${upgradeCost}元\n`,
                `📈 新增容量：${(userData.netbar.level) * 10}台电脑\n`,
                `🎁 解锁新设施：${
                    currentLevel + 1 === 2 ? "小吃吧" :
                    currentLevel + 1 === 3 ? "休息区" :
                    currentLevel + 1 === 4 ? "游戏专区" :
                    "无"
                }\n\n`,
                "💡 升级提示：\n",
                "1. 新增设施需要额外管理\n",
                "2. 考虑扩充员工配置\n",
                "3. 及时更新设备配置\n",
                "4. 注意维护成本增加\n",
                img
            ]);
        } catch (error) {
            console.error(`网吧升级出错：${error}`);
            e.reply("网吧升级时发生错误，请联系管理员！");
        }
    }

    async manageFacilities(e) {
        try {
            const remainingTime = checkCooldown(e.user_id, 'netbar', 'facility');
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
            const command = e.msg.match(/^#设施(添加|升级|维护)(.*)/);
            if (!command || !command[2]) {
                e.reply([
                    "格式错误！可用命令：\n",
                    "1. #设施添加 [设施名称]\n",
                    "2. #设施升级 [设施名称]\n",
                    "3. #设施维护 [设施名称]\n\n",
                    "可用设施：\n",
                    "- 空调系统 (10000元)\n",
                    "- 网络设备 (15000元)\n",
                    "- 安保系统 (12000元)\n",
                    "- 小吃吧 (20000元，需要2级)\n",
                    "- 休息区 (25000元，需要3级)\n",
                    "- 游戏专区 (30000元，需要4级)"
                ].join(''));
                return;
            }

            const [action, facility] = [command[1], command[2].trim()];
            const facilityData = {
                '空调系统': { cost: 10000, level: 1, key: 'airConditioner' },
                '网络设备': { cost: 15000, level: 1, key: 'wifi' },
                '安保系统': { cost: 12000, level: 1, key: 'securitySystem' },
                '小吃吧': { cost: 20000, level: 2, key: 'snackBar' },
                '休息区': { cost: 25000, level: 3, key: 'restArea' },
                '游戏专区': { cost: 30000, level: 4, key: 'gamingArea' }
            };

            if (!facilityData[facility]) {
                e.reply("无效的设施名称！");
                return;
            }

            switch (action) {
                case '添加':
                    // 检查等级要求
                    if (userData.netbar.level < facilityData[facility].level) {
                        e.reply(`添加${facility}需要网吧等级达到${facilityData[facility].level}级！`);
                        return;
                    }

                    // 检查是否已有该设施
                    if (userData.netbar.facilities[facilityData[facility].key]) {
                        e.reply(`已经拥有${facility}了！`);
                        return;
                    }

                    // 检查资金
                    if (userData.money < facilityData[facility].cost) {
                        e.reply(`添加${facility}需要${facilityData[facility].cost}元，资金不足！`);
                        return;
                    }

                    // 添加设施
                    userData.money -= facilityData[facility].cost;
                    userData.netbar.facilities[facilityData[facility].key] = true;
                    userData.netbar.reputation += 10;
                    break;

                case '升级':
                    // 检查是否有该设施
                    if (!userData.netbar.facilities[facilityData[facility].key]) {
                        e.reply(`你还没有${facility}！`);
                        return;
                    }

                    const upgradeCost = Math.floor(facilityData[facility].cost * 0.5);
                    if (userData.money < upgradeCost) {
                        e.reply(`升级${facility}需要${upgradeCost}元，资金不足！`);
                        return;
                    }

                    // 升级设施
                    userData.money -= upgradeCost;
                    userData.netbar.reputation += 5;
                    break;

                case '维护':
                    // 检查是否有该设施
                    if (!userData.netbar.facilities[facilityData[facility].key]) {
                        e.reply(`你还没有${facility}！`);
                        return;
                    }

                    const maintenanceCost = Math.floor(facilityData[facility].cost * 0.1);
                    if (userData.money < maintenanceCost) {
                        e.reply(`维护${facility}需要${maintenanceCost}元，资金不足！`);
                        return;
                    }

                    // 维护设施
                    userData.money -= maintenanceCost;
                    userData.netbar.maintenance.status = Math.min(100, userData.netbar.maintenance.status + 20);
                    break;
            }
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            setCooldown(e.user_id, 'netbar', 'facility');

            e.reply([
                `✅ ${action}${facility}成功！\n`,
                action === '添加' ? `💰 花费：${facilityData[facility].cost}元\n` :
                action === '升级' ? `💰 花费：${Math.floor(facilityData[facility].cost * 0.5)}元\n` :
                `💰 花费：${Math.floor(facilityData[facility].cost * 0.1)}元\n`,
                action === '添加' ? `📈 声望提升：+10\n` :
                action === '升级' ? `📈 声望提升：+5\n` :
                `🔧 维护度提升：+20%\n`,
                "\n💡 设施管理提示：\n",
                "1. 定期维护设施保持最佳状态\n",
                "2. 根据需求升级重要设施\n",
                "3. 合理安排设施布局\n",
                "4. 注意设施使用效率"
            ].join(''));
        } catch (error) {
            console.error(`设施管理出错：${error}`);
            e.reply("设施管理时发生错误，请联系管理员！");
        }
    }
    async trainEmployee(e) {
        try {
            const remainingTime = checkCooldown(e.user_id, 'netbar', 'train');
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
            const params = e.msg.replace('#员工培训', '').trim().split(' ');
            if (params.length !== 2) {
                e.reply([
                    "格式错误！正确格式：#员工培训 [员工ID] [培训类型]\n",
                    "培训类型：\n",
                    "1. 基础服务 - 2000元\n",
                    "2. 技术培训 - 3000元\n",
                    "3. 管理技能 - 5000元\n",
                    "4. 专业认证 - 8000元"
                ].join(''));
                return;
            }

            const [employeeId, trainingType] = params;
            const trainingData = {
                '基础服务': { cost: 2000, skillIncrease: 2, satisfactionIncrease: 10 },
                '技术培训': { cost: 3000, skillIncrease: 3, satisfactionIncrease: 15 },
                '管理技能': { cost: 5000, skillIncrease: 5, satisfactionIncrease: 20 },
                '专业认证': { cost: 8000, skillIncrease: 8, satisfactionIncrease: 25 }
            };

            // 检查培训类型
            if (!trainingData[trainingType]) {
                e.reply("无效的培训类型！");
                return;
            }

            // 查找员工
            const employeeIndex = userData.netbar.staff.findIndex(emp => emp.id === employeeId);
            if (employeeIndex === -1) {
                e.reply([
                    "未找到该员工！当前员工列表：\n",
                    ...userData.netbar.staff.map((emp, index) => 
                        `${index + 1}. ${emp.position} (ID: ${emp.id})\n`
                    ),
                    "\n使用 #员工培训 [员工ID] [培训类型] 来培训员工"
                ].join(''));
                return;
            }

            // 检查资金
            if (userData.money < trainingData[trainingType].cost) {
                e.reply(`培训费用${trainingData[trainingType].cost}元，资金不足！`);
                return;
            }

            // 执行培训
            userData.money -= trainingData[trainingType].cost;
            userData.netbar.staff[employeeIndex].skill = Math.min(100, 
                userData.netbar.staff[employeeIndex].skill + trainingData[trainingType].skillIncrease
            );
            userData.netbar.staff[employeeIndex].satisfaction = Math.min(100,
                userData.netbar.staff[employeeIndex].satisfaction + trainingData[trainingType].satisfactionIncrease
            );
            userData.netbar.staff[employeeIndex].experience += 100;
            // 更新网吧属性
            userData.netbar.serviceQuality = Math.min(100,
                userData.netbar.serviceQuality + Math.floor(trainingData[trainingType].skillIncrease / 2)
            );
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);

            setCooldown(e.user_id, 'netbar', 'train');

            e.reply([
                `✅ 员工培训完成！\n`,
                `�‍💼 员工：${userData.netbar.staff[employeeIndex].position}\n`,
                `💰 培训费用：${trainingData[trainingType].cost}元\n`,
                `📈 技能提升：+${trainingData[trainingType].skillIncrease}\n`,
                `� 满意度提升：+${trainingData[trainingType].satisfactionIncrease}\n`,
                `⭐ 经验获得：+100\n\n`,
                "💡 培训效果：\n",
                `- 当前技能等级：${userData.netbar.staff[employeeIndex].skill}\n`,
                `- 当前满意度：${userData.netbar.staff[employeeIndex].satisfaction}\n`,
                `- 服务质量提升：+${Math.floor(trainingData[trainingType].skillIncrease / 2)}\n\n`,
                "💡 管理提示：\n",
                "1. 定期培训保持竞争力\n",
                "2. 关注员工成长需求\n",
                "3. 平衡培训投入收益\n",
                "4. 建立长期培训计划"
            ].join(''));
        } catch (error) {
            console.error(`员工培训出错：${error}`);
            e.reply("员工培训时发生错误，请联系管理员！");
        }
    }
    async organizeEvent(e) {
        try {
            const remainingTime = checkCooldown(e.user_id, 'netbar', 'event');
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

            const eventType = e.msg.replace('#举办活动', '').trim();
            const eventData = {
                '电竞比赛': {
                    cost: 10000,
                    reputationGain: 20,
                    experienceGain: 500,
                    memberIncrease: 10,
                    requirements: {
                        level: 2,
                        computers: 20
                    }
                },
                '优惠促销': {
                    cost: 5000,
                    reputationGain: 10,
                    experienceGain: 300,
                    memberIncrease: 15,
                    requirements: {
                        level: 1,
                        computers: 10
                    }
                },
                '会员派对': {
                    cost: 8000,
                    reputationGain: 15,
                    experienceGain: 400,
                    memberIncrease: 8,
                    requirements: {
                        level: 3,
                        computers: 30
                    }
                },
                '游戏发布会': {
                    cost: 15000,
                    reputationGain: 25,
                    experienceGain: 600,
                    memberIncrease: 12,
                    requirements: {
                        level: 4,
                        computers: 40
                    }
                }
            };

            if (!eventData[eventType]) {
                e.reply([
                    "无效的活动类型！可选活动：\n",
                    "1. 电竞比赛 - 10000元（需要2级网吧，20台电脑）\n",
                    "2. 优惠促销 - 5000元（需要1级网吧，10台电脑）\n",
                    "3. 会员派对 - 8000元（需要3级网吧，30台电脑）\n",
                    "4. 游戏发布会 - 15000元（需要4级网吧，40台电脑）\n\n",
                    "使用 #举办活动 [活动类型] 来举办活动"
                ].join(''));
                return;
            }

            // 检查要求
            if (userData.netbar.level < eventData[eventType].requirements.level) {
                e.reply(`举办${eventType}需要${eventData[eventType].requirements.level}级网吧！`);
                return;
            }

            const totalComputers = 
                userData.netbar.computers.basic +
                userData.netbar.computers.standard +
                userData.netbar.computers.premium;

            if (totalComputers < eventData[eventType].requirements.computers) {
                e.reply(`举办${eventType}需要至少${eventData[eventType].requirements.computers}台电脑！`);
                return;
            }

            // 检查资金
            if (userData.money < eventData[eventType].cost) {
                e.reply(`举办${eventType}需要${eventData[eventType].cost}元，资金不足！`);
                return;
            }

            // 举办活动
            userData.money -= eventData[eventType].cost;
            userData.netbar.reputation += eventData[eventType].reputationGain;
            userData.netbar.experience += eventData[eventType].experienceGain;

            // 增加会员
            const memberTypes = ['normal', 'silver', 'gold', 'diamond'];
            const distribution = [0.4, 0.3, 0.2, 0.1]; // 不同等级会员的分布比例
            const totalNewMembers = eventData[eventType].memberIncrease;

            memberTypes.forEach((type, index) => {
                const increase = Math.floor(totalNewMembers * distribution[index]);
                userData.netbar.members[type] += increase;
            });

            // 记录活动
            if (!userData.netbar.eventHistory) {
                userData.netbar.eventHistory = [];
            }
            userData.netbar.eventHistory.push({
                type: eventType,
                date: new Date().toISOString(),
                cost: eventData[eventType].cost,
                results: {
                    reputationGain: eventData[eventType].reputationGain,
                    experienceGain: eventData[eventType].experienceGain,
                    memberIncrease: eventData[eventType].memberIncrease
                }
            });
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            setCooldown(e.user_id, 'netbar', 'event');

            e.reply([
                `🎉 成功举办${eventType}！\n`,
                `💰 活动费用：${eventData[eventType].cost}元\n`,
                `📈 获得声望：+${eventData[eventType].reputationGain}\n`,
                `⭐ 获得经验：+${eventData[eventType].experienceGain}\n`,
                `👥 新增会员：+${eventData[eventType].memberIncrease}\n\n`,
                "💡 活动效果：\n",
                `- 普通会员：+${Math.floor(totalNewMembers * 0.4)}\n`,
                `- 白银会员：+${Math.floor(totalNewMembers * 0.3)}\n`,
                `- 黄金会员：+${Math.floor(totalNewMembers * 0.2)}\n`,
                `- 钻石会员：+${Math.floor(totalNewMembers * 0.1)}\n\n`,
                "💡 活动提示：\n",
                "1. 定期举办活动保持人气\n",
                "2. 针对不同会员群体\n",
                "3. 注意活动投入产出比\n",
                "4. 做好活动后续维护"
            ].join(''));
        } catch (error) {
            console.error(`举办活动出错：${error}`);
            e.reply("举办活动时发生错误，请联系管理员！");
        }
    }

    async adjustEnvironment(e) {
        try {
            const remainingTime = checkCooldown(e.user_id, 'netbar', 'environment');
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
            const params = e.msg.replace('#调整环境', '').trim().split(' ');
            if (params.length !== 2) {
                e.reply([
                    "格式错误！正确格式：#调整环境 [环境项目] [目标值]\n",
                    "可调整项目：\n",
                    "1. 温度 (18-28℃)\n",
                    "2. 亮度 (60-100)\n",
                    "3. 噪音 (30-70)\n",
                    "4. 通风 (70-100)\n\n",
                    "例如：#调整环境 温度 24"
                ].join(''));
                return;
            }

            const [item, value] = params;
            const targetValue = parseInt(value);

            if (isNaN(targetValue)) {
                e.reply("目标值必须是数字！");
                return;
            }

            // 定义项目的范围和成本
            const adjustmentData = {
                '温度': {
                    min: 18,
                    max: 28,
                    cost: 100,
                    key: 'temperature'
                },
                '亮度': {
                    min: 60,
                    max: 100,
                    cost: 80,
                    key: 'lighting'
                },
                '噪音': {
                    min: 30,
                    max: 70,
                    cost: 120,
                    key: 'noise'
                },
                '通风': {
                    min: 70,
                    max: 100,
                    cost: 150,
                    key: 'airQuality'
                }
            };

            // 检查项目
            if (!adjustmentData[item]) {
                e.reply("无效的环境项目！");
                return;
            }

            // 检查目标值范围
            if (targetValue < adjustmentData[item].min || targetValue > adjustmentData[item].max) {
                e.reply(`${item}的有效范围是${adjustmentData[item].min}-${adjustmentData[item].max}！`);
                return;
            }

            // 计算成本
            const currentValue = userData.netbar.environment[adjustmentData[item].key];
            const adjustmentCost = Math.abs(targetValue - currentValue) * adjustmentData[item].cost;

            // 检查资金
            if (userData.money < adjustmentCost) {
                e.reply(`调整${item}需要${adjustmentCost}元，资金不足！`);
                return;
            }

            // 执行调整
            userData.money -= adjustmentCost;
            userData.netbar.environment[adjustmentData[item].key] = targetValue;

            // 计算环境评分
            const weights = {
                temperature: 0.3,
                lighting: 0.2,
                noise: 0.2,
                airQuality: 0.3
            };

            userData.netbar.environment.rating = Math.floor(
                (userData.netbar.environment.temperature * weights.temperature +
                userData.netbar.environment.lighting * weights.lighting +
                (100 - userData.netbar.environment.noise) * weights.noise +
                userData.netbar.environment.airQuality * weights.airQuality)
            );

            // 更新网吧属性
            userData.netbar.reputation = Math.min(100,
                userData.netbar.reputation + Math.floor((userData.netbar.environment.rating - 80) / 10)
            );
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            setCooldown(e.user_id, 'netbar', 'environment');
            e.reply([
                `✅ 环境调整完成！\n`,
                `🔧 调整项目：${item}\n`,
                `📊 目标值：${targetValue}\n`,
                `💰 调整费用：${adjustmentCost}元\n\n`,
                "💡 当前环境状态：\n",
                `- 温度：${userData.netbar.environment.temperature}℃\n`,
                `- 亮度：${userData.netbar.environment.lighting}\n`,
                `- 噪音：${userData.netbar.environment.noise}\n`,
                `- 空气质量：${userData.netbar.environment.airQuality}\n`,
                `- 环境评分：${userData.netbar.environment.rating}\n\n`,
                "💡 环境管理提示：\n",
                "1. 保持适宜的温度范围\n",
                "2. 注意照明亮度调节\n",
                "3. 控制环境噪音水平\n",
                "4. 确保良好的通风条件"
            ].join(''));
        } catch (error) {
            console.error(`调整环境出错：${error}`);
            e.reply("调整环境时发生错误，请联系管理员！");
        }
    }
}