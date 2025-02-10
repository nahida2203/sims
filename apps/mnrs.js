import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import {
    saveUserData,
    loadAllUsers,
    generateWeapons,
    checkUserData,
    readConfiguration,
    saveBanData,
    loadBanList,
} from '../function/function.js';
import Redis from 'ioredis';
const _path = process.cwd().replace(/\\/g, "/");
const redis = new Redis();

export class UserStart extends plugin {
    constructor() {
        super({
            name: 'UserStart',
            dsc: '游戏开始',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#开始模拟人生$', fnc: 'Create_player' },
                { reg: '^#设置性别.*$', fnc: 'Set_sex' },
                { reg: '^#改名.*$', fnc: 'Change_player_name' },
                { reg: '^#模拟人生签到$', fnc: 'daily_gift' },
                { reg: '^#模拟人生信息$', fnc: 'Show_status' },
            ],
        });
        this.task = {
            cron: '0 * * * *',
            name: 'Task',
            fnc: () => this.updatePlayerData(),
        };
    }

    async Create_player(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (userData) {
            e.reply("你已经开始过模拟人生了！");
            return;
        }

        // 初始化玩家信息
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456689涩批地球';
        let conversionCode = '';
        for (let i = 0; i < 7; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            const randomChar = characters.charAt(randomIndex);
            conversionCode += randomChar;
        }

        const userDataToSave = {
            name: `玩家${conversionCode}`,
            money: 1000,
            happiness: 100,
            life: 100,
            hunger: 100,
            thirst: 100,
            charm: 50,
            mood: 100,
            signature: "我是一名玩家",
            gender: "未知",
            disease: null,
            diseaseSymptoms: null,
            diseaseType: null,
            isContagious: false,
            deathRate: 0,
            job: null,
            events: [],
            level: 1,
            stamina: 100,
            partner: null,
            relationshipStatus: "单身",
            time: 0,
            weather: "晴天",
            temperature: 25,
            backpack: [],
            backpackCapacity: 100,
            location: "家",
            familyHappiness: 100,
            partnerAffection: 0,
            overdueTasks: 0,
            status: "健康",
            npcEncountered: [],
            dailySignIn: false,
            achievements: [],
            storeName: null,
            storeItems: [],
            lastSignInDate: null,
            points: 0,
            team: null,
            recipes: [],
            diseases: [],
            cardDraws: 0,
            creditPoints: 100,
            bank: {
                balance: 0,
                savingsLimit: 10000,
                deposits: [],
            },
            netbar: null, 
            property: null, 
            library: null, 
            artGallery: null, 
            scienceMuseum: null, 
            museum: null, 
        };

        await saveUserData(userId, userDataToSave);
        await redis.set(`user:${userId}`, JSON.stringify(userDataToSave));
        e.reply("欢迎来到模拟人生！数据已初始化。");
    }

    async Change_player_name(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId , e);
            return;
        }

        const newName = e.msg.replace('#改名', '').trim();
        if (newName.length > 12) {
            e.reply("新名字的字符长度不得超过12个字符。");
        } else {
            const allUsers = await loadAllUsers();
            const nameExists = Object.values(allUsers).some(user => user.name === newName);
            if (nameExists) {
                e.reply("该名字已被其他玩家使用，请选择其他名字。");
            } else {
                userData.name = newName;
                await redis.set(`user:${userId}`, JSON.stringify(userData));
                await saveUserData(userId, userData);
                e.reply(`你的名字已更改为: ${newName}`);
            }
        }
    }

    async Set_sex(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }

        const gender = e.msg.replace('#设置性别', '').trim();
        if (gender === "男" || gender === "女") {
            userData.gender = gender;
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            e.reply(`你的性别已设置为: ${gender}`);
        } else {
            e.reply("性别只能是 男 或 女。");
        }
    }

    async daily_gift(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }

        const today = new Date().toISOString().split("T")[0];
        if (userData.lastSignInDate === today) {
            e.reply("你今天已经签到过了！");
        } else {
            userData.lastSignInDate = today;
            userData.money += 100;
            userData.dailySignIn = true;
            await redis.set(`user:${userId}`, JSON.stringify(userData));
    
            await saveUserData(userId, userData);
            e.reply("签到成功！你获得了100元奖励。");
        }
    }

    async Show_status(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId,e);
            return;
        }
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`
        let un = userData.name
        let um = userData.money
        let uh = userData.happiness
        let ul = userData.life
        let uhg = userData.hunger
        let ut = userData.thirst
        let uc = userData.charm
        let umd = userData.mood
        let ug = userData.gender
        let ud = userData.disease || "无"
        let uj = userData.job || "无"
        let ulv = userData.level
        let ust = userData.stamina
        let up = userData.partnerAffection
        let urs = userData.relationshipStatus
        let ubl = userData.backpack.length
        let ublc = userData.backpackCapacity
        let ufh = userData.familyHappiness
        let uot = userData.overdueTasks
        let uw = userData.weather
        let utt = userData.temperature
        image(e, 'Show_status', { 
            cssFile,
            um,
            uh,
            ul,
            un,
            ut,
            uhg,
            uc,
            umd,
            ug,
            ud,
            uj,
            ulv,
            ust,
            up,
            urs,
            ubl,
            ublc,
            ufh,
            uot,
            uw,
            utt
         })
      /*
        e.reply(`姓名: ${userData.name}\n
            金钱: ${userData.money}
            \n幸福度: ${userData.happiness}
            \n生命值: ${userData.life}
            \n饱食度: ${userData.hunger}
            \n口渴度: ${userData.thirst}
            \n魅力值: ${userData.charm}\n
            心情: ${userData.mood}
            \n职业: ${userData.job || "无"}\n
            状态: ${userData.status}
            \n等级: ${userData.level}
            \n体力: ${userData.stamina}
            \n恋爱状态: ${userData.relationshipStatus}
            \n疾病: ${userData.disease || "无"}
            \n背包容量: ${userData.backpack.length}/${userData.backpackCapacity}\n
            家庭幸福度: ${userData.familyHappiness}
            \n恋爱对象好感度: ${userData.partnerAffection}
            \n当前天气: ${userData.weather}
            \n当前温度: ${userData.temperature}°C
            \n超时任务数量: ${userData.overdueTasks}`);*/
    }

    async updatePlayerData() {
        const allUsers = await loadAllUsers();
        const weatherOptions = ["晴天", "阴天", "小雨", "大雨", "暴风雨"];
        const config = await readConfiguration();
        for (const userId in allUsers) {
            const userData = allUsers[userId];
            const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
            const banUntil = await redis.get(`ban:${userId}`);
            if (banUntil && Date.now() < parseInt(banUntil)) continue;
            if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
                await this.banPlayer(userId, e);
                console.log(`数据不一致，用户 ${userId} 的账号已被封禁。`);
                continue;
            }
            if (userData.passwordData) {
                userData.passwordData.attempts = 0; // 每小时尝试次数归零
                userData.passwordData.progress = 0; // 每小时进度归零
            }
            userData.time += 1;
            userData.weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
            userData.temperature = Math.floor(Math.random() * (35 - 15 + 1)) + 15;
            userData.status = Math.random() > 0.9 ? "生病" : "健康";

            if (userData.property && userData.property.cleanliness > 0) {
                userData.property.cleanliness -= 1; // 每次更新清洁度下降
            }

            // 检测房子是否需要维修
            if (userData.property && Math.random() < 0.1) { // 10% 的几率损坏
                userData.property.isDamaged = true;
            }

            // 检查基础设施模拟是否启用
            if (config.infrastructure_simulation.enabled) {
                if (userData.location === "家") {
                    userData.waterBill = (userData.temperature * config.infrastructure_simulation.water_rate_per_degree).toFixed(2);
                    userData.electricityBill = (userData.temperature * config.infrastructure_simulation.electricity_rate_per_degree).toFixed(2);
                    userData.gasBill = (userData.temperature * config.infrastructure_simulation.gas_rate_per_degree).toFixed(2);
                }
            }

            // 更新咖啡厅数据
            if (userData.coffeeShop) {
                userData.coffeeShop.violations += Math.random() > 0.8 ? 1 : 0; // 20% 的几率违反规则
                userData.coffeeShop.cleanliness -= Math.random() > 0.5 ? 1 : 0; // 50% 的几率清洁度下降
                userData.coffeeShop.customers += Math.random() > 0.5 ? 5 : -2; // 50% 的几率顾客数量变化
                userData.coffeeShop.income += Math.random() > 0.5 ? 50 : -30; // 50% 的几率收入变化
                userData.coffeeShop.expenses += Math.random() > 0.5 ? 20 : -10; // 50% 的几率支出变化

                if (userData.coffeeShop.cleanliness < 0) {
                    userData.coffeeShop.cleanliness = 0;
                }

                // 增加额外的逻辑来处理折扣和维护
                if (userData.coffeeShop.discount > 0) {
                    userData.coffeeShop.customers += Math.floor(Math.random() * 20); // 折扣吸引更多顾客
                }

                if (userData.coffeeShop.maintenance > 0) {
                    userData.coffeeShop.violations = Math.max(0, userData.coffeeShop.violations - 1); // 维护减少违规次数
                }

                // 增加额外的逻辑来处理不同的员工
                if (userData.coffeeShop.staff.waiter) {
                    userData.coffeeShop.customers += Math.floor(Math.random() * 2); // 服务员增加顾客
                }

                if (userData.coffeeShop.staff.bartender) {
                    userData.coffeeShop.income += Math.floor(Math.random() * 10); // 调酒师增加收入
                }

                if (userData.coffeeShop.staff.chef) {
                    userData.coffeeShop.cleanliness += Math.floor(Math.random() * 5); // 厨师增加清洁度
                }

                if (userData.coffeeShop.staff.singer) {
                    userData.coffeeShop.reputation += Math.floor(Math.random() * 10); // 歌手增加人气
                }

                if (userData.coffeeShop.staff.dancer) {
                    userData.coffeeShop.reputation += Math.floor(Math.random() * 5); // 舞蹈家增加人气
                }
            }

            // 更新KTV数据
            if (userData.KTV) {
                userData.KTV.cleanliness -= 1; // 清洁度下降
                userData.KTV.cleanliness = Math.max(userData.KTV.cleanliness, 0);

                // 违规次数增加
                if (Math.random() > 0.8) {
                    userData.KTV.violations += 1;
                }

                // 计算维护和折扣的收益
                if (userData.KTV.maintenance > 0) {
                    userData.KTV.violations = Math.max(0, userData.KTV.violations - 1); // 维护减少违规次数
                }
                if (userData.KTV.discount > 0) {
                    userData.KTV.reputation += 5;
                }

                // 收入和支出的变化
                userData.KTV.income += Math.random() > 0.5 ? 50 : -30;
                userData.KTV.expenses += Math.random() > 0.5 ? 20 : -10;

                // 确保收入和支出不会小于0
                userData.KTV.income = Math.max(userData.KTV.income, 0);
                userData.KTV.expenses = Math.max(userData.KTV.expenses, 0);

                // 声誉的随机变化
                userData.KTV.reputation += Math.random() > 0.5 ? 5 : -5;
                userData.KTV.reputation = Math.max(userData.KTV.reputation, 0);

                // 处理不同员工的效果
                if (userData.KTV.staff.waiter) {
                    userData.KTV.expenses += 5; // 服务员增加支出
                    userData.KTV.reputation += 3; // 服务员提升声誉
                }

                if (userData.KTV.staff.DJ) {
                    userData.KTV.income += 10; // DJ增加收入
                    userData.KTV.expenses += 7; // DJ增加支出
                }

                if (userData.KTV.staff.bartender) {
                    userData.KTV.expenses += 5; // 调酒师增加支出
                    userData.KTV.reputation += 4; // 调酒师提升声誉
                }

                if (userData.KTV.staff.chef) {
                    userData.KTV.expenses += 8; // 厨师增加支出
                    userData.KTV.reputation += 5; // 厨师提升声誉
                }

                if (userData.KTV.staff.singer) {
                    userData.KTV.income += 15; // 歌手增加收入
                    userData.KTV.expenses += 6; // 歌手增加支出
                }

                if (userData.KTV.staff.dancer) {
                    userData.KTV.income += 10; // 舞蹈家增加收入
                    userData.KTV.expenses += 6; // 舞蹈家增加支出
                }
            }
            if (userData.gym.discount > 0) {
                userData.gym.members += Math.floor(Math.random() * 10); // 折扣吸引更多会员
            }

            // 维护减少违规次数
            if (userData.gym.maintenance > 0) {
                userData.gym.violations = Math.max(0, userData.gym.violations - 1);
            }

            // 增加额外的逻辑来处理不同的员工
            for (const coachType in userData.gym.staff) {
                const coach = userData.gym.staff[coachType];
                if (Math.random() > 0.8) {
                    coach.satisfaction -= 10; // 20% 的几率满意度下降
                } else {
                    coach.satisfaction += 5; // 80% 的几率满意度上升
                }

                if (Math.random() > 0.5) {
                    coach.workingHours += 1; // 50% 的几率增加工作时间
                } else {
                    coach.restingHours += 1; // 50% 的几率增加休息时间
                }

                // 每小时工作时间增加教练的表现
                coach.performance += coach.workingHours;

                // 确保满意度不超过100且不小于0
                if (coach.satisfaction > 100) {
                    coach.satisfaction = 100;
                } else if (coach.satisfaction < 0) {
                    coach.satisfaction = 0;
                }

                // 调整教练的相关数据
                userData.gym.staff[coachType] = coach;
            }

            // 更新健身房的状态
            if (userData.gym.isDamaged) {
                userData.gym.cleanliness -= Math.floor(Math.random() * 20); // 损坏状态下清洁度下降更快
            }

            // 保持清洁度在0到100之间
            if (userData.gym.cleanliness < 0) {
                userData.gym.cleanliness = 0;
            } else if (userData.gym.cleanliness > 100) {
                userData.gym.cleanliness = 100;
            }
            if (userData.clothingStore) {
                userData.clothingStore.customers = userData.clothingStore.discount > 0 ? userData.clothingStore.customers + Math.floor(Math.random() * 10) : userData.clothingStore.customers + Math.floor(Math.random() * 5) - Math.floor(Math.random() * 5);
                userData.clothingStore.customers = Math.max(userData.clothingStore.customers, 0); // 确保顾客数量不会小于0
    
                userData.clothingStore.income += userData.clothingStore.discount > 0 ? Math.floor(Math.random() * 100) : Math.floor(Math.random() * 50) - Math.floor(Math.random() * 30);
                userData.clothingStore.expenses += Math.floor(Math.random() * 50) - Math.floor(Math.random() * 20);
                userData.clothingStore.income = Math.max(userData.clothingStore.income, 0); // 确保收入不会小于0
                userData.clothingStore.expenses = Math.max(userData.clothingStore.expenses, 0); // 确保支出不会小于0
    
                userData.clothingStore.reputation += userData.clothingStore.discount > 0 ? 5 : Math.random() > 0.5 ? 5 : -5;
                userData.clothingStore.reputation = Math.max(userData.clothingStore.reputation, 0); // 确保声誉不超过0
    
                userData.clothingStore.cleanliness -= Math.random() > 0.5 ? 1 : 0; // 50% 的几率清洁度下降
                userData.clothingStore.cleanliness = Math.max(userData.clothingStore.cleanliness, 0); // 确保清洁度不超过0
    
                if (userData.clothingStore.isDamaged) {
                    userData.clothingStore.cleanliness -= Math.floor(Math.random() * 20); // 损坏状态下清洁度下降更快
                }
    
                // 处理员工的相关数据
                for (const staffType in userData.clothingStore.employees) {
                    const staff = userData.clothingStore.employees[staffType];
                    if (Math.random() > 0.8) {
                        staff.satisfaction -= 10; // 20% 的几率满意度下降
                    } else {
                        staff.satisfaction += 5; // 80% 的几率满意度上升
                    }
    
                    staff.workingHours += Math.random() > 0.5 ? 1 : 0; // 50% 的几率增加工作时间
                    staff.restingHours += Math.random() > 0.5 ? 1 : 0; // 50% 的几率增加休息时间
    
                    // 确保满意度不超过100且不小于0
                    if (staff.satisfaction > 100) {
                        staff.satisfaction = 100;
                    } else if (staff.satisfaction < 0) {
                        staff.satisfaction = 0;
                    }
    
                    userData.clothingStore.employees[staffType] = staff;
                }
    
                // 处理违规次数
                userData.clothingStore.violations += Math.random() > 0.8 ? 1 : 0;
    
                // 处理损坏状态
                if (Math.random() < 0.1) { // 10% 的几率损坏
                    userData.clothingStore.isDamaged = true;
                }
    
                // 处理信用积分
                userData.clothingStore.creditPoints += userData.clothingStore.discount > 0 ? 5 : Math.random() > 0.5 ? 5 : -5;
                userData.clothingStore.creditPoints = Math.max(userData.clothingStore.creditPoints, 0); // 确保信用积分不超过0
            }
            // 更新 Redis 存储的用户数据
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            // 更新本地文件存储的用户数据
            await saveUserData(userId, userData);
        }
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
generateWeapons();
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
