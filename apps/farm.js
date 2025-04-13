import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import {
    saveUserData,
    loadAllUsers,
    checkUserData,
    readConfiguration
} from '../function/function.js';
import { checkCooldown, setCooldown } from '../function/cooldown.js';
import Redis from 'ioredis';
const _path = process.cwd().replace(/\\/g, "/");
const redis = new Redis();
const farmDataPath = path.join(process.cwd(), 'plugins/sims-plugin/data/farm');
if (!fs.existsSync(farmDataPath)) {
    fs.mkdirSync(farmDataPath, { recursive: true });
}
const FARM_DATA_PATH = path.join(farmDataPath, 'farm_data.json');
const SEEDS_DATA_PATH = path.join(farmDataPath, 'seeds.json');
const TOOLS_DATA_PATH = path.join(farmDataPath, 'tools.json');
const LAND_UPGRADES_PATH = path.join(farmDataPath, 'land_upgrades.json');
const EVENTS_DATA_PATH = path.join(farmDataPath, 'events.json');
const SEASONS_DATA_PATH = path.join(farmDataPath, 'seasons.json');
if (!fs.existsSync(FARM_DATA_PATH)) {
    fs.writeFileSync(FARM_DATA_PATH, JSON.stringify({}, null, 2));
}
function loadFarmData() {
    if (!fs.existsSync(FARM_DATA_PATH)) {
        return {};
    }
    return JSON.parse(fs.readFileSync(FARM_DATA_PATH, 'utf8'));
}


function saveFarmData(data) {
    fs.writeFileSync(FARM_DATA_PATH, JSON.stringify(data, null, 2));
}

// 读取种子数据
function loadSeedsData() {
    if (!fs.existsSync(SEEDS_DATA_PATH)) {
        return { seeds: [] };
    }
    return JSON.parse(fs.readFileSync(SEEDS_DATA_PATH, 'utf8'));
}

// 读取工具数据
function loadToolsData() {
    if (!fs.existsSync(TOOLS_DATA_PATH)) {
        return { tools: [] };
    }
    return JSON.parse(fs.readFileSync(TOOLS_DATA_PATH, 'utf8'));
}

// 读取土地升级数据
function loadLandUpgrades() {
    if (!fs.existsSync(LAND_UPGRADES_PATH)) {
        return { landUpgrades: [] };
    }
    return JSON.parse(fs.readFileSync(LAND_UPGRADES_PATH, 'utf8'));
}

// 读取事件数据
function loadEventsData() {
    if (!fs.existsSync(EVENTS_DATA_PATH)) {
        return { events: [] };
    }
    return JSON.parse(fs.readFileSync(EVENTS_DATA_PATH, 'utf8'));
}

// 读取季节数据
function loadSeasonsData() {
    if (!fs.existsSync(SEASONS_DATA_PATH)) {
        return { seasons: [] };
    }
    return JSON.parse(fs.readFileSync(SEASONS_DATA_PATH, 'utf8'));
}

// 获取当前季节
function getCurrentSeason() {
    const now = new Date();
    const month = now.getMonth() + 1; // 月份从0开始，需要+1
    const seasons = loadSeasonsData().seasons;
    
    for (const season of seasons) {
        if (season.months.includes(month)) {
            return season;
        }
    }
    
    // 默认春季
    return seasons.find(s => s.name === "春季") || seasons[0];
}

export class FarmSystem extends plugin {
    constructor() {
        super({
            name: 'FarmSystem',
            dsc: '模拟人生农场系统',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#创建农场$', fnc: 'createFarm' },
                { reg: '^#我的农场$', fnc: 'viewFarm' },
                { reg: '^#购买农田$', fnc: 'buyLand' },
                { reg: '^#升级农田$', fnc: 'upgradeLand' },
                { reg: '^#农场商店$', fnc: 'viewShop' },
                { reg: '^#购买种子.*$', fnc: 'buySeeds' },
                { reg: '^#购买农具.*$', fnc: 'buyTools' },
                { reg: '^#种植.*$', fnc: 'plantSeeds' },
                { reg: '^#浇水.*$', fnc: 'waterCrops' },
                { reg: '^#施肥.*$', fnc: 'fertilizeCrops' },
                { reg: '^#收获.*$', fnc: 'harvestCrops' },
                { reg: '^#农场日志$', fnc: 'viewFarmLog' },
                { reg: '^#农场攻略$', fnc: 'showGuide' },
                { reg: '^#农场季节$', fnc: 'checkSeason' }
            ],
        });
        this.task = {
            cron: '0 * * * *',
            name: 'FarmTask',
            fnc: () => this.updateFarms(),
        };
    }

    async createFarm(e) {
        const remainingTime = checkCooldown(e.user_id, 'farm', 'create');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = await redis.get(`user:${userId}`);
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !redisUserData) {
            e.reply("你还没有创建模拟人生角色，请先使用 #开始模拟人生 创建角色！");
            return;
        }
        const farmData = loadFarmData();
        if (farmData[userId]) {
            e.reply("你已经拥有一个农场了！使用 #我的农场 查看。");
            return;
        }
        const parsedUserData = JSON.parse(redisUserData);
        if (parsedUserData.money < 500) {
            e.reply("创建农场需要500金币，你的金币不足！");
            return;
        }

        parsedUserData.money -= 500;
        await redis.set(`user:${userId}`, JSON.stringify(parsedUserData));
        await saveUserData(userId, parsedUserData);

        // 创建农场数据
        const landUpgrades = loadLandUpgrades().landUpgrades;
        const initialLand = landUpgrades.find(l => l.level === 1) || {
            level: 1,
            name: "初级农田",
            size: 4,
            waterRetention: 1,
            fertilityBonus: 1
        };

        farmData[userId] = {
            name: `${parsedUserData.name}的农场`,
            level: 1,
            experience: 0,
            createdAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            land: {
                level: initialLand.level,
                name: initialLand.name,
                size: initialLand.size,
                plots: Array(initialLand.size).fill().map(() => ({
                    crop: null,
                    plantedAt: null,
                    water: 0,
                    fertility: 0,
                    health: 100,
                    growthStage: 0,
                    harvestReady: false
                })),
                waterRetention: initialLand.waterRetention,
                fertilityBonus: initialLand.fertilityBonus
            },
            inventory: {
                seeds: [],
                crops: [],
                tools: [
                    { id: 1, name: "基础锄头", durability: 50, efficiency: 1 },
                    { id: 4, name: "小水壶", durability: 40, efficiency: 1 }
                ]
            },
            statistics: {
                totalHarvested: 0,
                totalIncome: 0,
                plantsGrown: 0,
                timeSpent: 0
            },
            log: [
                {
                    date: new Date().toISOString(),
                    action: "创建",
                    description: `${parsedUserData.name}创建了农场`
                }
            ],
            activeEvents: []
        };

        saveFarmData(farmData);
        setCooldown(e.user_id, 'farm', 'create');
        this.generateGuideFile();

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        let farmName = farmData[userId].name;
        let userName = parsedUserData.name;
        let plots = farmData[userId].land.size;
        let currentSeason = getCurrentSeason();
        
        image(e, 'farm_created', { 
            cssFile,
            farmName,
            userName,
            plots,
            currentSeason
        });
    }

    async viewFarm(e) {
        const remainingTime = checkCooldown(e.user_id, 'farm', 'view');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }
        const userId = e.user_id;
        const farmData = loadFarmData();
        
        
        if (!farmData[userId]) {
            e.reply("你还没有农场！使用 #创建农场 来创建一个。");
            return;
        }
        setCooldown(e.user_id, 'farm', 'view');

        const farm = farmData[userId];
        const currentSeason = getCurrentSeason();
        
        // 计算经验等级
        const level = farm.level;
        const nextLevelExp = level * 100;
        const currentExp = farm.experience;
        
        // 计算作物状态
        const plots = farm.land.plots;
        const plotsData = [];
        
        for (let i = 0; i < plots.length; i++) {
            const plot = plots[i];
            if (plot.crop) {
                // 加载种子数据以获取详细信息
                const seedsData = loadSeedsData().seeds;
                const cropInfo = seedsData.find(seed => seed.name === plot.crop);
                
                // 计算生长进度
                const plantedDate = new Date(plot.plantedAt);
                const now = new Date();
                const daysPassed = Math.floor((now - plantedDate) / (1000 * 60 * 60 * 24));
                const growthDays = cropInfo ? cropInfo.growthDays : 5;
                const growthPercentage = Math.min(100, Math.floor((daysPassed / growthDays) * 100));
                
                plotsData.push({
                    index: i + 1,
                    crop: plot.crop,
                    water: plot.water,
                    fertility: plot.fertility,
                    health: plot.health,
                    growthStage: plot.growthStage,
                    growthPercentage: growthPercentage,
                    harvestReady: plot.harvestReady,
                    icon: cropInfo ? cropInfo.icon : "default_crop.png"
                });
            } else {
                plotsData.push({
                    index: i + 1,
                    crop: null,
                    water: 0,
                    fertility: 0,
                    health: 0,
                    growthStage: 0,
                    growthPercentage: 0,
                    harvestReady: false,
                    icon: "empty_plot.png",
                    isEmpty: true
                });
            }
        }
        
        // 统计库存
        const seedsCount = farm.inventory.seeds.reduce((total, seed) => total + seed.count, 0);
        const cropsCount = farm.inventory.crops.reduce((total, crop) => total + crop.count, 0);
        const toolsCount = farm.inventory.tools.length;
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        
        image(e, 'farm_view', { 
            cssFile,
            farm,
            currentSeason,
            level,
            nextLevelExp,
            currentExp,
            plotsData,
            seedsCount,
            cropsCount,
            toolsCount
        });
    }
    
    async buyLand(e) {
        const remainingTime = checkCooldown(e.user_id, 'farm', 'buy');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = await redis.get(`user:${userId}`);
        const farmData = loadFarmData();
        if (!farmData[userId]) {
            e.reply("你还没有农场！使用 #创建农场 来创建一个。");
            return;
        }
        const parsedUserData = JSON.parse(redisUserData);
        const landUpgrades = loadLandUpgrades().landUpgrades;
        const currentLandLevel = farmData[userId].land.level;
        
        if (currentLandLevel >= landUpgrades.length) {
            e.reply("你的农田已经是最高等级了！");
            return;
        }
        const nextLand = landUpgrades.find(l => l.level === currentLandLevel + 1);
        if (parsedUserData.money < nextLand.price) {
            e.reply(`升级农田需要${nextLand.price}金币，你的金币不足！`);
            return;
        }
        
        // 扣除金币
        parsedUserData.money -= nextLand.price;
        await redis.set(`user:${userId}`, JSON.stringify(parsedUserData));
        await saveUserData(userId, parsedUserData);
        
        // 更新农场数据
        const currentPlots = farmData[userId].land.plots;
        const newPlotCount = nextLand.size - currentPlots.length;
        
        // 添加新的地块
        for (let i = 0; i < newPlotCount; i++) {
            currentPlots.push({
                crop: null,
                plantedAt: null,
                water: 0,
                fertility: 0,
                health: 100,
                growthStage: 0,
                harvestReady: false
            });
        }
        
        // 更新农田信息
        farmData[userId].land.level = nextLand.level;
        farmData[userId].land.name = nextLand.name;
        farmData[userId].land.size = nextLand.size;
        farmData[userId].land.waterRetention = nextLand.waterRetention;
        farmData[userId].land.fertilityBonus = nextLand.fertilityBonus;
        
        // 添加日志
        farmData[userId].log.push({
            date: new Date().toISOString(),
            action: "升级农田",
            description: `农田升级到${nextLand.name}`
        });
        saveFarmData(farmData);
        setCooldown(e.user_id, 'farm', 'buy');
        e.reply(`恭喜你成功购买了更大的农田！农田已升级为 ${nextLand.name}，现在共有 ${nextLand.size} 块地块。\n\n【农场攻略】\n升级农田可以获得更多地块和更好的土壤效果。更高级的土地有更好的保水性和肥力，让你的作物生长更快、产量更高。下一步可以使用 #农场商店 购买种子和工具。`);
    }
    
    async updateFarms() {
        const farmData = loadFarmData();
        const currentSeason = getCurrentSeason();
        
        for (const userId in farmData) {
            const farm = farmData[userId];
            const now = new Date();
            farm.lastUpdate = now.toISOString();
            
            // 更新每块地的作物状态
            for (let i = 0; i < farm.land.plots.length; i++) {
                const plot = farm.land.plots[i];
                
                // 如果有作物，就更新状态
                if (plot.crop) {
                    // 加载种子数据以获取详细信息
                    const seedsData = loadSeedsData().seeds;
                    const cropInfo = seedsData.find(seed => seed.name === plot.crop);
                    
                    if (cropInfo) {
                        // 检查是否适合当前季节
                        const isRightSeason = cropInfo.season.includes(currentSeason.name);
                        const seasonalFactor = isRightSeason ? 1.2 : 0.8;
                        
                        // 水分流失
                        plot.water = Math.max(0, plot.water - (5 / farm.land.waterRetention));
                        
                        // 肥力流失
                        plot.fertility = Math.max(0, plot.fertility - (2 / farm.land.fertilityBonus));
                        
                        // 计算生长进度
                        const plantedDate = new Date(plot.plantedAt);
                        const daysPassed = Math.floor((now - plantedDate) / (1000 * 60 * 60 * 24));
                        
                        // 计算健康度变化（受水分和肥力影响）
                        const waterEffect = plot.water >= 50 ? 1 : plot.water / 50;
                        const fertilityEffect = plot.fertility >= 30 ? 1 : plot.fertility / 30;
                        const healthChange = (waterEffect * fertilityEffect * seasonalFactor * 2) - 1;
                        
                        plot.health = Math.max(0, Math.min(100, plot.health + healthChange));
                        
                        // 更新生长阶段
                        const growthDays = cropInfo.growthDays;
                        if (daysPassed >= growthDays && plot.health > 30) {
                            plot.harvestReady = true;
                            plot.growthStage = 3; // 成熟阶段
                        } else if (daysPassed >= growthDays * 0.7) {
                            plot.growthStage = 2; // 开花/结果阶段
                        } else if (daysPassed >= growthDays * 0.3) {
                            plot.growthStage = 1; // 生长阶段
                        }
                        
                        // 如果健康度太低，作物可能会死亡
                        if (plot.health <= 10) {
                            // 10% 几率作物死亡
                            if (Math.random() < 0.1) {
                                farm.log.push({
                                    date: now.toISOString(),
                                    action: "作物死亡",
                                    description: `第${i+1}号地块的${plot.crop}因缺乏照顾而死亡`
                                });
                                
                                plot.crop = null;
                                plot.plantedAt = null;
                                plot.water = 0;
                                plot.fertility = 0;
                                plot.health = 100;
                                plot.growthStage = 0;
                                plot.harvestReady = false;
                            }
                        }
                    }
                }
            }
            
            // 随机事件发生
            this.triggerRandomEvent(farm);
            
            // 更新已有的事件
            if (farm.activeEvents && farm.activeEvents.length > 0) {
                const updatedEvents = [];
                
                for (const event of farm.activeEvents) {
                    event.duration--;
                    
                    // 如果事件还未结束，保留它
                    if (event.duration > 0) {
                        updatedEvents.push(event);
                    } else {
                        // 添加事件结束的日志
                        farm.log.push({
                            date: now.toISOString(),
                            action: "事件结束",
                            description: `${event.name}的影响已结束`
                        });
                    }
                }
                
                farm.activeEvents = updatedEvents;
            }
        }
        saveFarmData(farmData);
    }
    triggerRandomEvent(farm) {
        const eventsData = loadEventsData().events;
        
        // 随机决定是否触发事件（20%概率）
        if (Math.random() < 0.2) {
            // 选择一个随机事件，根据概率权重
            const totalWeight = eventsData.reduce((sum, event) => sum + event.probability, 0);
            let randomWeight = Math.random() * totalWeight;
            
            let selectedEvent = null;
            for (const event of eventsData) {
                randomWeight -= event.probability;
                if (randomWeight <= 0) {
                    selectedEvent = event;
                    break;
                }
            }
            
            if (selectedEvent) {
                // 检查事件是否已经激活
                const isAlreadyActive = farm.activeEvents.some(e => e.id === selectedEvent.id);
                
                if (!isAlreadyActive) {
                    // 添加事件到活跃事件列表
                    farm.activeEvents.push({
                        id: selectedEvent.id,
                        name: selectedEvent.name,
                        type: selectedEvent.type,
                        effect: selectedEvent.effect,
                        description: selectedEvent.description,
                        duration: selectedEvent.duration,
                        remedy: selectedEvent.remedy
                    });
                    
                    // 添加事件日志
                    farm.log.push({
                        date: new Date().toISOString(),
                        action: "事件发生",
                        description: selectedEvent.description
                    });
                    
                    // 应用事件效果到农场
                    this.applyEventEffects(farm, selectedEvent);
                }
            }
        }
    }
    
    // 应用事件效果
    applyEventEffects(farm, event) {
        // 根据事件类型应用不同效果
        switch (event.type) {
            case "weather":
                // 应用到所有地块
                for (const plot of farm.land.plots) {
                    if (plot.crop) {
                        if (event.effect.water) {
                            plot.water = Math.max(0, Math.min(100, plot.water + event.effect.water));
                        }
                        if (event.effect.growth) {
                            // 模拟生长天数变化
                            const plantedDate = new Date(plot.plantedAt);
                            if (event.effect.growth > 0) {
                                // 加速生长，提前种植日期
                                plantedDate.setDate(plantedDate.getDate() - event.effect.growth);
                            } else {
                                // 减慢生长，推迟种植日期
                                plantedDate.setDate(plantedDate.getDate() - event.effect.growth);
                            }
                            plot.plantedAt = plantedDate.toISOString();
                        }
                    }
                }
                break;
                
            case "pest":
            case "disaster":
                // 应用到所有地块
                for (const plot of farm.land.plots) {
                    if (plot.crop) {
                        if (event.effect.health) {
                            plot.health = Math.max(0, Math.min(100, plot.health + event.effect.health));
                        }
                        if (event.effect.yield) {
                            // 记录产量变化，收获时应用
                            plot.yieldModifier = (plot.yieldModifier || 0) + event.effect.yield;
                        }
                    }
                }
                break;
                
            case "soil":
                // 应用到所有地块
                for (const plot of farm.land.plots) {
                    if (event.effect.fertility) {
                        plot.fertility = Math.max(0, Math.min(100, plot.fertility + event.effect.fertility));
                    }
                }
                break;
                
            case "blessing":
                // 特殊奖励效果
                if (event.effect.experience) {
                    farm.experience += event.effect.experience;
                    
                    // 检查是否升级
                    const nextLevelExp = farm.level * 100;
                    if (farm.experience >= nextLevelExp) {
                        farm.level += 1;
                        farm.experience -= nextLevelExp;
                        
                        // 添加升级日志
                        farm.log.push({
                            date: new Date().toISOString(),
                            action: "农场升级",
                            description: `农场等级提升到${farm.level}`
                        });
                    }
                }
                
                if (event.effect.quality) {
                    // 记录品质变化，收获时应用
                    farm.qualityModifier = (farm.qualityModifier || 0) + event.effect.quality;
                }
                break;
        }
    }
    
    generateGuideFile() {
        const guidePath = path.join(process.cwd(), 'plugins/sims-plugin/doc/模拟人生种菜攻略.md');
        
        // 如果文件已存在，不重新创建
        if (fs.existsSync(guidePath)) {
            return;
        }
        
        const guideContent = `# 模拟人生种菜系统攻略

## 基础指南

### 创建农场
使用命令 \`#创建农场\` 开始你的农场之旅。创建农场需要花费500金币，你将获得一块初级农田开始种植。

### 农场管理
- \`#我的农场\`: 查看你的农场状态、土地情况和作物生长情况
- \`#购买农田\`: 扩大你的农场规模
- \`#升级农田\`: 提升农田等级，获得更好的种植效果
- \`#农场日志\`: 查看你农场的活动记录
- \`#农场季节\`: 查看当前季节和季节对作物的影响

## 种植指南

### 购买种子和工具
- \`#农场商店\`: 查看可购买的种子和农具
- \`#购买种子 [种子名称] [数量]\`: 购买指定种子
- \`#购买农具 [农具名称]\`: 购买农场工具

### 作物种植与管理
- \`#种植 [种子名称] [地块编号]\`: 在指定地块种植作物
- \`#浇水 [地块编号]\`: 给指定地块的作物浇水
- \`#施肥 [地块编号]\`: 给指定地块的作物施肥
- \`#收获 [地块编号]\`: 收获成熟的作物

## 高级技巧

### 季节性种植
不同的作物适合在不同的季节种植。在适合的季节种植作物可以获得生长速度和产量加成。

- **春季**: 适合种植草莓、白菜、胡萝卜等
- **夏季**: 适合种植番茄、茄子、黄瓜、青椒等
- **秋季**: 适合种植土豆、南瓜、白菜等
- **冬季**: 大多数作物生长缓慢，但可以准备土地

### 工具选择
不同的工具有不同的效率和耐久度：
- 锄头用于耕地
- 水壶用于浇水
- 镰刀用于收获
- 肥料用于提高土地肥力

高级工具可以提高效率，减少体力消耗。

### 事件应对
农场会遇到各种随机事件，如暴雨、干旱、虫灾等。应对策略：
- 暴雨后不需要浇水
- 干旱时需要增加浇水频率
- 虫灾时使用害虫喷雾器
- 土壤贫瘠时增加施肥

## 经营技巧
- 平衡种植不同生长周期的作物，确保持续收入
- 优先购买适合当季的种子
- 升级工具可以提高生产效率
- 定期查看农场，避免作物因缺水或缺肥而死亡
- 收获的作物可以卖出获得金币，也可以保留用于其他用途

祝你的农场丰收！
`;
        
        fs.writeFileSync(guidePath, guideContent);
    }
    async showGuide(e) {
        e.reply("农场系统攻略已生成，请查看插件目录下的「模拟人生种菜攻略.md」文件获取详细指南。\n\n基本命令：\n#创建农场 - 开始你的农场之旅\n#我的农场 - 查看农场状态\n#农场商店 - 购买种子和工具\n#种植 [种子名称] [地块编号] - 种植作物\n#浇水 [地块编号] - 给作物浇水\n#收获 [地块编号] - 收获作物");
    }
    
    // 检查当前季节
    async checkSeason(e) {
        const currentSeason = getCurrentSeason();
        const seasons = loadSeasonsData().seasons;
        
        // 获取下一个季节
        const currentIndex = seasons.findIndex(s => s.id === currentSeason.id);
        const nextSeasonIndex = (currentIndex + 1) % seasons.length;
        const nextSeason = seasons[nextSeasonIndex];
        
        e.reply(`当前季节：${currentSeason.name}\n\n${currentSeason.description}\n\n季节效果：\n- 生长速度：${currentSeason.effects.growth}倍\n- 水分消耗：${currentSeason.effects.water}倍\n- 温度：${currentSeason.effects.temperature}\n\n${currentSeason.special}\n\n下一个季节将是：${nextSeason.name}`);
    }
    async viewFarmLog(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'farm', 'log');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const farmData = loadFarmData();
        
        
        if (!farmData[userId]) {
            e.reply("你还没有农场！使用 #创建农场 来创建一个。");
            return;
        }

        
        setCooldown(e.user_id, 'farm', 'log');

        const farm = farmData[userId];
        
        // 获取并格式化日志数据
        const logs = farm.log.map(log => {
            // 格式化日期
            const logDate = new Date(log.date);
            const formattedDate = `${logDate.getFullYear()}-${(logDate.getMonth() + 1).toString().padStart(2, '0')}-${logDate.getDate().toString().padStart(2, '0')} ${logDate.getHours().toString().padStart(2, '0')}:${logDate.getMinutes().toString().padStart(2, '0')}`;
            
            // 确定动作类别（用于CSS样式）
            let actionClass = 'default';
            const action = log.action.toLowerCase();
            
            if (action.includes('创建')) {
                actionClass = 'create';
            } else if (action.includes('种植')) {
                actionClass = 'plant';
            } else if (action.includes('浇水')) {
                actionClass = 'water';
            } else if (action.includes('施肥')) {
                actionClass = 'fertilize';
            } else if (action.includes('收获')) {
                actionClass = 'harvest';
            } else if (action.includes('升级')) {
                actionClass = 'upgrade';
            } else if (action.includes('事件')) {
                actionClass = 'event';
            } else {
                actionClass = 'default';
            }
            
            return {
                date: formattedDate,
                action: log.action,
                description: log.description,
                actionClass: actionClass
            };
        });
        
        // 按日期倒序排列（最新的在前面噢）
        logs.reverse();
        
        // 只显示最近20条记录
        const recentLogs = logs.slice(0, 20);
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        
        image(e, 'farm_log', { 
            cssFile,
            farmName: farm.name,
            logs: recentLogs
        });
    }

    async harvestCrops(e) {
        const remainingTime = checkCooldown(e.user_id, 'farm', 'harvest');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }
        const userId = e.user_id;
        const farmData = loadFarmData();
        if (!farmData[userId]) {
            e.reply("你还没有农场！使用 #创建农场 来创建一个。");
            return;
        }
        
        const plotIndex = parseInt(e.msg.replace(/^#收获\s*/, '').trim()) - 1;
        const farm = farmData[userId];
        
        
        if (isNaN(plotIndex) || plotIndex < 0 || plotIndex >= farm.land.plots.length) {
            e.reply(`无效的地块编号，请使用 #收获 [1-${farm.land.plots.length}] 来收获对应地块的作物。`);
            return;
        }
        
        const plot = farm.land.plots[plotIndex];
        
        // 检查是否有作物可收获
        if (!plot.crop) {
            e.reply(`第${plotIndex + 1}号地块没有种植作物！`);
            return;
        }
        
        // 检查作物是否成熟
        if (!plot.harvestReady) {
            e.reply(`第${plotIndex + 1}号地块的${plot.crop}还没有成熟，请耐心等待。`);
            return;
        }
        
        // 检查是否有镰刀工具
        const hasScythe = farm.inventory.tools.some(tool => tool.name.includes("镰刀") && tool.durability > 0);
        if (!hasScythe) {
            e.reply("你没有可用的镰刀工具！请先从农场商店购买。");
            return;
        }
        
        // 获取镰刀工具并减少耐久度
        const scythe = farm.inventory.tools.find(tool => tool.name.includes("镰刀") && tool.durability > 0);
        scythe.durability -= 1;
        
        // 加载种子数据以获取详细信息
        const seedsData = loadSeedsData().seeds;
        const cropInfo = seedsData.find(seed => seed.name === plot.crop);
        
        // 计算收获数量（受健康度和品质修改器影响）
        const healthFactor = plot.health / 100;
        const qualityModifier = farm.qualityModifier || 0;
        const yieldModifier = plot.yieldModifier || 0;
        
        let harvestAmount = Math.floor((cropInfo.yield * healthFactor) * (1 + (qualityModifier + yieldModifier) / 100));
        harvestAmount = Math.max(1, harvestAmount); // 至少收获1个
        
        // 更新库存
        const existingCrop = farm.inventory.crops.find(crop => crop.name === plot.crop);
        if (existingCrop) {
            existingCrop.count += harvestAmount;
        } else {
            farm.inventory.crops.push({
                name: plot.crop,
                count: harvestAmount,
                price: cropInfo.sellPrice,
                quality: Math.floor(plot.health / 20) + 1 // 1-5级品质
            });
        }
        
        // 更新统计信息
        farm.statistics.totalHarvested += harvestAmount;
        farm.statistics.plantsGrown += 1;
        farm.experience += 10; // 收获作物增加经验
        
        // 检查是否升级
        const nextLevelExp = farm.level * 100;
        if (farm.experience >= nextLevelExp) {
            farm.level += 1;
            farm.experience -= nextLevelExp;
            
            // 添加升级日志
            farm.log.push({
                date: new Date().toISOString(),
                action: "农场升级",
                description: `农场等级提升到${farm.level}`
            });
        }
        
        // 添加日志
        farm.log.push({
            date: new Date().toISOString(),
            action: "收获",
            description: `收获了第${plotIndex + 1}号地块的${plot.crop} x${harvestAmount}`
        });
        
        // 重置地块
        plot.crop = null;
        plot.plantedAt = null;
        plot.water = 0;
        plot.fertility = 0;
        plot.health = 100;
        plot.growthStage = 0;
        plot.harvestReady = false;
        plot.yieldModifier = 0;
        saveFarmData(farmData);
        
        
        setCooldown(e.user_id, 'farm', 'harvest');
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        
        image(e, 'harvest_crop', { 
            cssFile,
            farmName: farm.name,
            cropName: cropInfo.name,
            harvestAmount: harvestAmount,
            quality: Math.floor(plot.health / 20) + 1,
            plotIndex: plotIndex + 1,
            exp: 10,
            toolDurability: scythe.durability
        });
    }

    async fertilizeCrops(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'farm', 'fertilize');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }
        const userId = e.user_id;
        const farmData = loadFarmData();
        if (!farmData[userId]) {
            e.reply("你还没有农场！使用 #创建农场 来创建一个。");
            return;
        }
        const plotIndex = parseInt(e.msg.replace(/^#施肥\s*/, '').trim()) - 1;
        const farm = farmData[userId];
        if (isNaN(plotIndex) || plotIndex < 0 || plotIndex >= farm.land.plots.length) {
            e.reply(`无效的地块编号，请使用 #施肥 [1-${farm.land.plots.length}] 来给对应地块施肥。`);
            return;
        }
        const plot = farm.land.plots[plotIndex];
        if (!plot.crop) {
            e.reply(`第${plotIndex + 1}号地块没有种植作物！`);
            return;
        }
        
        // 检查是否已达到最大肥力
        if (plot.fertility >= 100) {
            e.reply(`第${plotIndex + 1}号地块已经很肥沃了，不需要继续施肥。`);
            return;
        }
        
        // 检查是否有肥料工具
        const hasFertilizer = farm.inventory.tools.some(tool => tool.name.includes("肥料") && tool.durability > 0);
        if (!hasFertilizer) {
            e.reply("你没有可用的肥料！请先从农场商店购买。");
            return;
        }
        
        // 获取肥料工具并减少耐久度
        const fertilizer = farm.inventory.tools.find(tool => tool.name.includes("肥料") && tool.durability > 0);
        fertilizer.durability -= 1;
        
        // 增加肥力
        const fertilizerEfficiency = fertilizer.efficiency || 1;
        const fertilityIncrease = 20 * fertilizerEfficiency; // 基础增加20点，乘以效率系数
        const oldFertility = plot.fertility;
        plot.fertility = Math.min(100, plot.fertility + fertilityIncrease);
        
        // 如果肥力过高，健康度有微小影响
        if (plot.fertility > 80 && Math.random() < 0.2) {
            plot.health = Math.max(50, plot.health - 5);
        }
        
        // 添加日志
        farm.log.push({
            date: new Date().toISOString(),
            action: "施肥",
            description: `对第${plotIndex + 1}号地块施肥，肥力从${Math.round(oldFertility)}%提升到${Math.round(plot.fertility)}%`
        });
        farm.experience += 3;
        saveFarmData(farmData);
        setCooldown(e.user_id, 'farm', 'fertilize');
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        image(e, 'fertilize_crop', { 
            cssFile,
            farmName: farm.name,
            cropName: plot.crop,
            plotIndex: plotIndex + 1,
            oldFertility: Math.round(oldFertility),
            newFertility: Math.round(plot.fertility),
            toolName: fertilizer.name,
            toolDurability: fertilizer.durability
        });
    }

    async waterCrops(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'farm', 'water');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }
        const userId = e.user_id;
        const farmData = loadFarmData();
        if (!farmData[userId]) {
            e.reply("你还没有农场！使用 #创建农场 来创建一个。");
            return;
        }
        const plotIndex = parseInt(e.msg.replace(/^#浇水\s*/, '').trim()) - 1;
        const farm = farmData[userId];
        if (isNaN(plotIndex) || plotIndex < 0 || plotIndex >= farm.land.plots.length) {
            e.reply(`无效的地块编号，请使用 #浇水 [1-${farm.land.plots.length}] 来给对应地块浇水。`);
            return;
        }
        const plot = farm.land.plots[plotIndex];
        
        // 检查是否有作物
        if (!plot.crop) {
            e.reply(`第${plotIndex + 1}号地块没有种植作物！`);
            return;
        }
        
        // 检查是否已达到最大水分
        if (plot.water >= 100) {
            e.reply(`第${plotIndex + 1}号地块已经很湿润了，不需要继续浇水。`);
            return;
        }
        
        // 检查是否有水壶工具
        const hasWateringCan = farm.inventory.tools.some(tool => tool.name.includes("水壶") && tool.durability > 0);
        if (!hasWateringCan) {
            e.reply("你没有可用的水壶！请先从农场商店购买。");
            return;
        }
        
        // 获取水壶工具并减少耐久度
        const wateringCan = farm.inventory.tools.find(tool => tool.name.includes("水壶") && tool.durability > 0);
        wateringCan.durability -= 1;
        
        // 增加水分
        const wateringEfficiency = wateringCan.efficiency || 1;
        const waterIncrease = 25 * wateringEfficiency; // 基础增加25点，乘以效率系数
        const oldWater = plot.water;
        plot.water = Math.min(100, plot.water + waterIncrease);
        
        // 如果水分过高，健康度有微小影响
        if (plot.water > 90 && Math.random() < 0.2) {
            plot.health = Math.max(60, plot.health - 3);
        }
        
        // 添加日志
        farm.log.push({
            date: new Date().toISOString(),
            action: "浇水",
            description: `对第${plotIndex + 1}号地块浇水，水分从${Math.round(oldWater)}%提升到${Math.round(plot.water)}%`
        });
        farm.experience += 2;
        saveFarmData(farmData);
        setCooldown(e.user_id, 'farm', 'water');
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        image(e, 'water_crop', { 
            cssFile,
            farmName: farm.name,
            cropName: plot.crop,
            plotIndex: plotIndex + 1,
            oldWater: Math.round(oldWater),
            newWater: Math.round(plot.water),
            toolName: wateringCan.name,
            toolDurability: wateringCan.durability
        });
    }
    async plantSeeds(e) {
        const remainingTime = checkCooldown(e.user_id, 'farm', 'plant');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }
        const userId = e.user_id;
        const farmData = loadFarmData();
        if (!farmData[userId]) {
            e.reply("你还没有农场！使用 #创建农场 来创建一个。");
            return;
        }
        const farm = farmData[userId];
        const cmdParts = e.msg.replace(/^#种植\s*/, '').trim().split(/\s+/);
        if (cmdParts.length < 2) {
            e.reply("命令格式错误，正确格式：#种植 [种子名称] [地块编号]");
            return;
        }
        const seedName = cmdParts[0];
        const plotIndex = parseInt(cmdParts[1]) - 1;
        if (isNaN(plotIndex) || plotIndex < 0 || plotIndex >= farm.land.plots.length) {
            e.reply(`无效的地块编号，请使用 1-${farm.land.plots.length} 的数字。`);
            return;
        }
        const plot = farm.land.plots[plotIndex];
        if (plot.crop) {
            e.reply(`第${plotIndex + 1}号地块已经种植了${plot.crop}，请先收获或等待作物死亡。`);
            return;
        }
        
        // 检查是否有种子
        const seedInInventory = farm.inventory.seeds.find(seed => seed.name === seedName && seed.count > 0);
        if (!seedInInventory) {
            e.reply(`你没有${seedName}种子，请先从农场商店购买。`);
            return;
        }
        
        // 检查是否有锄头工具
        const hasHoe = farm.inventory.tools.some(tool => tool.name.includes("锄头") && tool.durability > 0);
        if (!hasHoe) {
            e.reply("你没有可用的锄头工具！请先从农场商店购买。");
            return;
        }
        
        // 获取锄头工具并减少耐久度
        const hoe = farm.inventory.tools.find(tool => tool.name.includes("锄头") && tool.durability > 0);
        hoe.durability -= 1;
        
        // 获取种子信息
        const seedsData = loadSeedsData().seeds;
        const seedInfo = seedsData.find(seed => seed.name === seedName);
        
        if (!seedInfo) {
            e.reply(`未找到${seedName}的信息，可能是数据错误。`);
            return;
        }
        
        // 检查季节是否适合种植
        const currentSeason = getCurrentSeason();
        const isRightSeason = seedInfo.season.includes(currentSeason.name);
        
        // 减少库存中的种子数量
        seedInInventory.count -= 1;
        if (seedInInventory.count <= 0) {
            farm.inventory.seeds = farm.inventory.seeds.filter(seed => seed.name !== seedName);
        }
        
        // 设置种植信息
        plot.crop = seedName;
        plot.plantedAt = new Date().toISOString();
        plot.water = 50; // 初始水分
        plot.fertility = 40; // 初始肥力
        plot.health = 100; // 初始健康度
        plot.growthStage = 0; // 初始生长阶段
        plot.harvestReady = false;
        
        // 添加日志
        const seasonalNote = isRightSeason ? 
            "（当前是适合种植的季节）" : 
            "（注意：当前不是适合种植的季节，生长可能较慢）";
        
        farm.log.push({
            date: new Date().toISOString(),
            action: "种植",
            description: `在第${plotIndex + 1}号地块种植了${seedName} ${seasonalNote}`
        });
        farm.experience += 5;
        saveFarmData(farmData);
        setCooldown(e.user_id, 'farm', 'plant');
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        image(e, 'plant_seed', { 
            cssFile,
            farmName: farm.name,
            seedName: seedName,
            plotIndex: plotIndex + 1,
            growthDays: seedInfo.growthDays,
            isRightSeason: isRightSeason,
            currentSeason: currentSeason.name,
            toolName: hoe.name,
            toolDurability: hoe.durability,
            seedIcon: seedInfo.icon || "default_seed.png"
        });
    }

    async buyTools(e) {
        const remainingTime = checkCooldown(e.user_id, 'farm', 'buy');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = await redis.get(`user:${userId}`);
        const farmData = loadFarmData();
        if (!farmData[userId]) {
            e.reply("你还没有农场！使用 #创建农场 来创建一个。");
            return;
        }
        const toolName = e.msg.replace(/^#购买农具\s*/, '').trim();
        if (!toolName) {
            e.reply("请指定要购买的农具名称，例如：#购买农具 高级锄头");
            return;
        }
        
        // 获取工具数据
        const toolsData = loadToolsData().tools;
        const toolInfo = toolsData.find(tool => tool.name === toolName);
        
        if (!toolInfo) {
            e.reply(`农场商店中没有出售"${toolName}"，请使用 #农场商店 查看可用工具。`);
            return;
        }
        
        // 获取用户信息
        const parsedUserData = JSON.parse(redisUserData);
        
        // 检查金钱是否足够
        if (parsedUserData.money < toolInfo.price) {
            e.reply(`购买${toolName}需要${toolInfo.price}金币，你的金币不足！`);
            return;
        }
        
        // 扣除金币
        parsedUserData.money -= toolInfo.price;
        await redis.set(`user:${userId}`, JSON.stringify(parsedUserData));
        await saveUserData(userId, parsedUserData);
        
        // 添加工具到库存
        const farm = farmData[userId];
        
        // 检查是否已有同类型工具，如果有则替换
        const sameTypeTools = farm.inventory.tools.filter(tool => {
            const toolCategory = tool.name.split(" ")[1] || ""; // 提取类别
            const newToolCategory = toolInfo.name.split(" ")[1] || "";
            return toolCategory === newToolCategory;
        });
        
        if (sameTypeTools.length > 0) {
            // 如果已有同类型工具，保留最好的一个
            farm.inventory.tools = farm.inventory.tools.filter(tool => {
                const toolCategory = tool.name.split(" ")[1] || "";
                const newToolCategory = toolInfo.name.split(" ")[1] || "";
                return toolCategory !== newToolCategory;
            });
        }
        
        // 添加新工具
        farm.inventory.tools.push({
            id: toolInfo.id,
            name: toolInfo.name,
            durability: toolInfo.durability,
            efficiency: toolInfo.efficiency
        });
        
        // 添加日志
        farm.log.push({
            date: new Date().toISOString(),
            action: "购买工具",
            description: `购买了${toolInfo.name}，花费${toolInfo.price}金币`
        });
        saveFarmData(farmData);
        setCooldown(e.user_id, 'farm', 'buy');
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        
        image(e, 'buy_tool', { 
            cssFile,
            farmName: farm.name,
            toolName: toolInfo.name,
            toolPrice: toolInfo.price,
            toolDurability: toolInfo.durability,
            toolEfficiency: toolInfo.efficiency,
            toolDescription: toolInfo.description || `这是一个${toolInfo.name}工具`,
            userMoney: parsedUserData.money,
            toolIcon: toolInfo.icon || "default_tool.png"
        });
    }

    async buySeeds(e) {
        const remainingTime = checkCooldown(e.user_id, 'farm', 'buy');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = await redis.get(`user:${userId}`);
        const farmData = loadFarmData();
        if (!farmData[userId]) {
            e.reply("你还没有农场！使用 #创建农场 来创建一个。");
            return;
        }
        const cmdParts = e.msg.replace(/^#购买种子\s*/, '').trim().split(/\s+/);
        if (cmdParts.length < 1) {
            e.reply("命令格式错误，正确格式：#购买种子 [种子名称] [数量(可选)]");
            return;
        }
        const seedName = cmdParts[0];
        const quantity = cmdParts.length > 1 ? parseInt(cmdParts[1]) : 1;
        if (isNaN(quantity) || quantity <= 0) {
            e.reply("购买数量必须是正整数。");
            return;
        }
        
        // 获取种子数据
        const seedsData = loadSeedsData().seeds;
        const seedInfo = seedsData.find(seed => seed.name === seedName);
        if (!seedInfo) {
            e.reply(`农场商店中没有出售"${seedName}"种子，请使用 #农场商店 查看可用种子。`);
            return;
        }
        // 获取用户信息
        const parsedUserData = JSON.parse(redisUserData);
        // 计算总价格
        const totalPrice = seedInfo.price * quantity;
        // 检查金钱是否足够
        if (parsedUserData.money < totalPrice) {
            e.reply(`购买${quantity}个${seedName}种子需要${totalPrice}金币，你的金币不足！`);
            return;
        }
        parsedUserData.money -= totalPrice;
        await redis.set(`user:${userId}`, JSON.stringify(parsedUserData));
        await saveUserData(userId, parsedUserData);
        const farm = farmData[userId];
        const existingSeed = farm.inventory.seeds.find(seed => seed.name === seedName);
        if (existingSeed) {
            existingSeed.count += quantity;
        } else {
            farm.inventory.seeds.push({
                name: seedName,
                count: quantity,
                price: seedInfo.price,
                season: seedInfo.season
            });
        }
        
        farm.log.push({
            date: new Date().toISOString(),
            action: "购买种子",
            description: `购买了${quantity}个${seedName}种子，花费${totalPrice}金币`
        });
        saveFarmData(farmData);
        setCooldown(e.user_id, 'farm', 'buy');
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        
        image(e, 'buy_seed', { 
            cssFile,
            farmName: farm.name,
            seedName: seedInfo.name,
            seedQuantity: quantity,
            seedPrice: seedInfo.price,
            totalPrice: totalPrice,
            userMoney: parsedUserData.money,
            seedSeason: seedInfo.season.join(", "),
            seedGrowthDays: seedInfo.growthDays,
            seedIcon: seedInfo.icon || "default_seed.png",
            currentSeason: getCurrentSeason().name
        });
    }

    async viewShop(e) {
        const remainingTime = checkCooldown(e.user_id, 'farm', 'shop');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = await redis.get(`user:${userId}`);
        const farmData = loadFarmData();
        if (!farmData[userId]) {
            e.reply("你还没有农场！使用 #创建农场 来创建一个。");
            return;
        }
        const parsedUserData = JSON.parse(redisUserData);
        const seedsData = loadSeedsData().seeds;
        const toolsData = loadToolsData().tools;
        const currentSeason = getCurrentSeason();
        // 筛选当季和全季节种子
        const seasonalSeeds = seedsData.filter(seed => 
            seed.season.includes(currentSeason.name) || seed.season.includes("全年")
        );
        // 其他非当季种子
        const otherSeeds = seedsData.filter(seed => 
            !seed.season.includes(currentSeason.name) && !seed.season.includes("全年")
        );
        setCooldown(e.user_id, 'farm', 'shop');
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        image(e, 'farm_shop', { 
            cssFile,
            farmName: farmData[userId].name,
            userName: parsedUserData.name,
            userMoney: parsedUserData.money,
            seasonalSeeds: seasonalSeeds,
            otherSeeds: otherSeeds,
            tools: toolsData,
            currentSeason: currentSeason.name
        });
    }

    async upgradeLand(e) {
        const remainingTime = checkCooldown(e.user_id, 'farm', 'upgrade');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = await redis.get(`user:${userId}`);
        const farmData = loadFarmData();
        if (!farmData[userId]) {
            e.reply("你还没有农场！使用 #创建农场 来创建一个。");
            return;
        }
        const parsedUserData = JSON.parse(redisUserData);
        const landUpgrades = loadLandUpgrades().landUpgrades;
        const currentLandLevel = farmData[userId].land.level;
        
        // 检查是否已达到最高等级
        if (currentLandLevel >= landUpgrades.length) {
            e.reply("你的农田已经是最高等级了！");
            return;
        }
        
        // 获取下一级土地信息
        const nextLand = landUpgrades.find(l => l.level === currentLandLevel + 1);
        if (parsedUserData.money < nextLand.price) {
            e.reply(`升级农田需要${nextLand.price}金币，你的金币不足！`);
            return;
        }
        if (farmData[userId].level < nextLand.requiredLevel) {
            e.reply(`升级到${nextLand.name}需要农场等级达到${nextLand.requiredLevel}级，你的农场等级不足！`);
            return;
        }
        parsedUserData.money -= nextLand.price;
        await redis.set(`user:${userId}`, JSON.stringify(parsedUserData));
        await saveUserData(userId, parsedUserData);
        // 更新数据
        const farm = farmData[userId];
        const currentPlots = farm.land.plots;
        const newPlotCount = nextLand.size - currentPlots.length;
        
        for (let i = 0; i < newPlotCount; i++) {
            currentPlots.push({
                crop: null,
                plantedAt: null,
                water: 0,
                fertility: 0,
                health: 100,
                growthStage: 0,
                harvestReady: false
            });
        }
        
        farmData[userId].land.level = nextLand.level;
        farmData[userId].land.name = nextLand.name;
        farmData[userId].land.size = nextLand.size;
        farmData[userId].land.waterRetention = nextLand.waterRetention;
        farmData[userId].land.fertilityBonus = nextLand.fertilityBonus;
        
        farmData[userId].log.push({
            date: new Date().toISOString(),
            action: "升级农田",
            description: `农田升级到${nextLand.name}`
        });
        saveFarmData(farmData);
        setCooldown(e.user_id, 'farm', 'upgrade');
        e.reply(`恭喜你成功购买了更大的农田！农田已升级为 ${nextLand.name}，现在共有 ${nextLand.size} 块地块。\n\n【农场攻略】\n升级农田可以获得更多地块和更好的土壤效果。更高级的土地有更好的保水性和肥力，让你的作物生长更快、产量更高。下一步可以使用 #农场商店 购买种子和工具。`);
    }
}

async function image(e, file, obj) {
    let data = {
      quality: 100,
      tplFile: `./plugins/sims-plugin/resources/HTML/${file}.html`,
      ...obj,
    }
    let img = await puppeteer.screenshot('sims-plugin', {
      ...data,
    })
   
    e.reply([img])
} 