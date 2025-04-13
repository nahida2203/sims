import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import {
    saveUserData,
    loadAllUsers,
    checkUserData,
    readConfiguration,
    saveBanData,
    loadBanList,
} from '../function/function.js';
import { checkCooldown, setCooldown } from '../function/cooldown.js';
import Redis from 'ioredis';
const redis = new Redis();
const _path = process.cwd().replace(/\\/g, "/");
const PLUGIN_PATH = path.join(process.cwd(), 'plugins', 'sims-plugin');
const FIRE_DATA_PATH = path.join(PLUGIN_PATH, 'data', 'firefighter');
if (!fs.existsSync(FIRE_DATA_PATH)) {
    fs.mkdirSync(FIRE_DATA_PATH, { recursive: true });
}

export class 消防员模拟 extends plugin {
    constructor() {
        super({
            name: '消防员模拟',
            dsc: '模拟消防员系统',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#加入消防队$', fnc: 'joinFireDepartment' },
                { reg: '^#消防员信息$', fnc: 'showFirefighterInfo' },
                { reg: '^#消防队信息$', fnc: 'showFireDepartmentInfo' },
                { reg: '^#消防演习$', fnc: 'firefightingDrill' },
                { reg: '^#灭火行动$', fnc: 'firefightingMission' },
                { reg: '^#火灾控制 (.+)$', fnc: 'fireControl' },
                { reg: '^#学习消防技能 (.+)$', fnc: 'learnFirefightingSkill' },
                { reg: '^#购买消防装备 (.+)$', fnc: 'buyFirefightingEquipment' },
                { reg: '^#消防站升级$', fnc: 'upgradeFireStation' },
                { reg: '^#申请消防职称晋升$', fnc: 'applyForPromotion' },
                { reg: '^#消防救援 (.+)$', fnc: 'rescueOperation' },
                { reg: '^#消防帮助$', fnc: 'firefighterHelp' }
            ],
        });
        this.fireData = this.loadFireData();
    }

    // 加载所有消防相关数据
    loadFireData() {
        let fireData = {
            fireTypes: {},
            equipment: {},
            skills: {},
            ranks: {},
            rescueTypes: {}
        };

        try {
            const fireTypesPath = path.join(FIRE_DATA_PATH, 'fireTypes.json');
            if (fs.existsSync(fireTypesPath)) {
                fireData.fireTypes = JSON.parse(fs.readFileSync(fireTypesPath, 'utf8'));
            } else {
                // 如果文件不存在，创建默认数据
                this.initializeFireTypes(fireData);
                fs.writeFileSync(fireTypesPath, JSON.stringify(fireData.fireTypes, null, 2));
            }
            const equipmentPath = path.join(FIRE_DATA_PATH, 'equipment.json');
            if (fs.existsSync(equipmentPath)) {
                fireData.equipment = JSON.parse(fs.readFileSync(equipmentPath, 'utf8'));
            } else {
                this.initializeEquipment(fireData);
                fs.writeFileSync(equipmentPath, JSON.stringify(fireData.equipment, null, 2));
            }

            const skillsPath = path.join(FIRE_DATA_PATH, 'skills.json');
            if (fs.existsSync(skillsPath)) {
                fireData.skills = JSON.parse(fs.readFileSync(skillsPath, 'utf8'));
            } else {
                this.initializeSkills(fireData);
                fs.writeFileSync(skillsPath, JSON.stringify(fireData.skills, null, 2));
            }

            // 加载消防职称数据
            const ranksPath = path.join(FIRE_DATA_PATH, 'ranks.json');
            if (fs.existsSync(ranksPath)) {
                fireData.ranks = JSON.parse(fs.readFileSync(ranksPath, 'utf8'));
            } else {
                this.initializeRanks(fireData);
                fs.writeFileSync(ranksPath, JSON.stringify(fireData.ranks, null, 2));
            }

            const rescueTypesPath = path.join(FIRE_DATA_PATH, 'rescueTypes.json');
            if (fs.existsSync(rescueTypesPath)) {
                fireData.rescueTypes = JSON.parse(fs.readFileSync(rescueTypesPath, 'utf8'));
            } else {
                // 如果文件不存在，创建默认数据
                this.initializeRescueTypes(fireData);
                fs.writeFileSync(rescueTypesPath, JSON.stringify(fireData.rescueTypes, null, 2));
            }
        } catch (error) {
            console.error("加载消防数据时出错:", error);
        }

        return fireData;
    }

    initializeFireTypes(fireData) {
        fireData.fireTypes = {
            "普通火灾": {
                "id": "fire_normal",
                "name": "普通火灾",
                "description": "一般的建筑或物品起火，难度较低",
                "difficulty": 1,
                "danger": 1,
                "waterRequired": 500,
                "timeLimit": 300, // 秒
                "xpReward": 50,
                "moneyReward": 100,
                "equipment": ["基础消防服", "消防水带", "防毒面具"],
                "skills": ["基础灭火", "火灾侦察"],
                "minRank": "消防员",
                "casualties": {
                    min: 0,
                    max: 2
                },
                "possibleCauses": ["电器短路", "明火引燃", "烟头", "厨房油锅"]
            },
            "工厂火灾": {
                "id": "fire_factory",
                "name": "工厂火灾",
                "description": "工厂起火，可能有化学物质，难度中等",
                "difficulty": 3,
                "danger": 4,
                "waterRequired": 1500,
                "timeLimit": 600, // 秒
                "xpReward": 150,
                "moneyReward": 300,
                "equipment": ["防化服", "空气呼吸器", "热成像仪", "消防水炮"],
                "skills": ["化学火灾扑救", "火场搜救", "高温环境适应"],
                "minRank": "消防班长",
                "casualties": {
                    min: 1,
                    max: 8
                },
                "possibleCauses": ["化学品泄漏", "机械摩擦", "电气故障", "易燃品储存不当"]
            },
            "高层建筑火灾": {
                "id": "fire_highrise",
                "name": "高层建筑火灾",
                "description": "高层建筑起火，疏散困难，环境复杂",
                "difficulty": 4,
                "danger": 4,
                "waterRequired": 2000,
                "timeLimit": 900, // 秒
                "xpReward": 200,
                "moneyReward": 400,
                "equipment": ["高层灭火装备", "登高器械", "便携式水泵", "消防绳索"],
                "skills": ["高空救援", "垂直疏散", "楼层火灾扑救"],
                "minRank": "消防班长",
                "casualties": {
                    min: 2,
                    max: 15
                },
                "possibleCauses": ["电气线路老化", "易燃装修材料", "明火引燃", "纵火"]
            },
            "森林火灾": {
                "id": "fire_forest",
                "name": "森林火灾",
                "description": "森林地区大面积起火，影响范围广，扑救难度大",
                "difficulty": 5,
                "danger": 5,
                "waterRequired": 5000,
                "timeLimit": 1800, // 秒
                "xpReward": 300,
                "moneyReward": 600,
                "equipment": ["森林消防装备", "风力灭火机", "大型水炮", "森林消防车"],
                "skills": ["野外生存", "自然环境火灾扑救", "火场指挥"],
                "minRank": "消防队长",
                "casualties": {
                    min: 0,
                    max: 5
                },
                "possibleCauses": ["雷击", "烧荒失火", "野炊", "香烟烟头"]
            },
            "危险品仓库火灾": {
                "id": "fire_hazardous",
                "name": "危险品仓库火灾",
                "description": "存放危险化学品仓库起火，爆炸风险高，极度危险",
                "difficulty": 5,
                "danger": 5,
                "waterRequired": 3000,
                "timeLimit": 1200, // 秒
                "xpReward": 350,
                "moneyReward": 700,
                "equipment": ["全套防化服", "高级空气呼吸器", "化学泡沫灭火器", "防爆仪器"],
                "skills": ["危险品处理", "化学火灾扑救", "指挥协调", "火场侦察"],
                "minRank": "消防队长",
                "casualties": {
                    min: 2,
                    max: 20
                },
                "possibleCauses": ["化学反应", "存储不当", "温度过高", "易燃品混放"]
            }
        };
    }

    // 初始化消防装备数据
    initializeEquipment(fireData) {
        fireData.equipment = {
            "基础消防服": {
                "id": "basic_suit",
                "name": "基础消防服",
                "description": "基础防护装备，可以抵抗一般热度和短时间明火",
                "price": 500,
                "protection": 20,
                "durability": 100,
                "mobility": 80,
                "rank": "消防员",
                "attributes": {
                    "fireResistance": 20,
                    "heatInsulation": 30,
                    "comfortLevel": 60
                }
            },
            "防毒面具": {
                "id": "gas_mask",
                "name": "防毒面具",
                "description": "过滤有毒气体，保障呼吸安全的装备",
                "price": 300,
                "protection": 15,
                "durability": 80,
                "mobility": 90,
                "rank": "消防员",
                "attributes": {
                    "toxinFiltering": 70,
                    "visionRange": 60,
                    "breathingComfort": 50
                }
            },
            "消防水带": {
                "id": "fire_hose",
                "name": "消防水带",
                "description": "输送灭火用水的关键装备",
                "price": 200,
                "waterFlow": 50,
                "durability": 120,
                "length": 30, // 米
                "rank": "消防员",
                "attributes": {
                    "pressureResistance": 80,
                    "flexibility": 60,
                    "weightRating": 40
                }
            },
            "空气呼吸器": {
                "id": "breathing_apparatus",
                "name": "空气呼吸器",
                "description": "在烟雾环境中提供清洁空气的设备",
                "price": 800,
                "protection": 40,
                "durability": 90,
                "airSupply": 30, // 分钟
                "rank": "消防班长",
                "attributes": {
                    "airQuality": 95,
                    "weight": 15, // kg
                    "comfortLevel": 70
                }
            },
            "热成像仪": {
                "id": "thermal_imager",
                "name": "热成像仪",
                "description": "在烟雾中识别热源，帮助搜救和火点定位",
                "price": 1200,
                "detectionRange": 50, // 米
                "batteryLife": 120, // 分钟
                "accuracy": 90,
                "rank": "消防班长",
                "attributes": {
                    "imageQuality": 85,
                    "responseTime": 0.5, // 秒
                    "weight": 1.5 // kg
                }
            },
            "消防水炮": {
                "id": "water_cannon",
                "name": "消防水炮",
                "description": "大流量灭火设备，适合大规模火灾",
                "price": 2000,
                "waterFlow": 200, // L/min
                "range": 70, // 米
                "durability": 150,
                "rank": "消防队长",
                "attributes": {
                    "pressureControl": 85,
                    "splashRadius": 15, // 米
                    "setupTime": 60 // 秒
                }
            },
            "高级防化服": {
                "id": "hazmat_suit",
                "name": "高级防化服",
                "description": "抵抗化学物质和高温的特种装备",
                "price": 3000,
                "protection": 80,
                "durability": 100,
                "mobility": 50,
                "rank": "消防队长",
                "attributes": {
                    "chemicalResistance": 90,
                    "heatInsulation": 85,
                    "wearTime": 15 // 分钟
                }
            },
            "消防无人机": {
                "id": "fire_drone",
                "name": "消防无人机",
                "description": "用于侦察和监测火场的高科技设备",
                "price": 5000,
                "flightTime": 30, // 分钟
                "range": 2000, // 米
                "sensors": ["热成像", "高清摄像", "气体检测"],
                "rank": "消防指挥员",
                "attributes": {
                    "transmissionQuality": 90,
                    "windResistance": 70,
                    "autonomyLevel": 60
                }
            }
        };
    }

    // 初始化消防技能数据
    initializeSkills(fireData) {
        fireData.skills = {
            "基础灭火": {
                "id": "basic_firefighting",
                "name": "基础灭火",
                "description": "掌握基本的灭火技巧和方法",
                "learnCost": 100,
                "timeToLearn": 1, // 天
                "effectivenessBuff": 10,
                "rank": "消防员",
                "prerequisites": []
            },
            "火灾侦察": {
                "id": "fire_reconnaissance",
                "name": "火灾侦察",
                "description": "评估火场情况和结构安全的能力",
                "learnCost": 150,
                "timeToLearn": 2,
                "safetyBuff": 15,
                "rank": "消防员",
                "prerequisites": ["基础灭火"]
            },
            "火场搜救": {
                "id": "search_and_rescue",
                "name": "火场搜救",
                "description": "在火场中有效搜寻和救助受困人员的技能",
                "learnCost": 300,
                "timeToLearn": 3,
                "rescueEfficiencyBuff": 20,
                "survivorSaveBuff": 25,
                "rank": "消防班长",
                "prerequisites": ["火灾侦察"]
            },
            "高温环境适应": {
                "id": "heat_adaptation",
                "name": "高温环境适应",
                "description": "提高在高温环境中工作的能力和耐受力",
                "learnCost": 400,
                "timeToLearn": 5,
                "heatResistanceBuff": 30,
                "staminaInHeatBuff": 25,
                "rank": "消防班长",
                "prerequisites": ["基础灭火"]
            },
            "化学火灾扑救": {
                "id": "chemical_firefighting",
                "name": "化学火灾扑救",
                "description": "应对化学物质引起的特殊火灾的专业技能",
                "learnCost": 500,
                "timeToLearn": 7,
                "chemicalFireEfficiencyBuff": 35,
                "toxinResistanceBuff": 20,
                "rank": "消防队长",
                "prerequisites": ["基础灭火", "火灾侦察"]
            },
            "高空救援": {
                "id": "high_altitude_rescue",
                "name": "高空救援",
                "description": "在高层建筑和高空环境进行救援的技能",
                "learnCost": 600,
                "timeToLearn": 10,
                "heightFearReduction": 40,
                "ropeTechniquesBuff": 30,
                "verticalMovementSpeed": 25,
                "rank": "消防队长",
                "prerequisites": ["火场搜救"]
            },
            "指挥协调": {
                "id": "command_coordination",
                "name": "指挥协调",
                "description": "在火场指挥和协调多个救援小组的能力",
                "learnCost": 800,
                "timeToLearn": 14,
                "teamEfficiencyBuff": 25,
                "communicationBuff": 30,
                "decisionSpeedBuff": 20,
                "rank": "消防指挥员",
                "prerequisites": ["火灾侦察", "火场搜救"]
            },
            "大型设备操作": {
                "id": "heavy_equipment_operation",
                "name": "大型设备操作",
                "description": "操作大型消防设备和车辆的专业技能",
                "learnCost": 700,
                "timeToLearn": 12,
                "equipmentEfficiencyBuff": 25,
                "mechanicalKnowledgeBuff": 30,
                "rank": "消防队长",
                "prerequisites": ["基础灭火"]
            }
        };
    }

    // 初始化消防职称数据
    initializeRanks(fireData) {
        fireData.ranks = {
            "实习消防员": {
                "id": "trainee",
                "name": "实习消防员",
                "description": "刚加入消防队，学习基础消防知识和技能",
                "salary": 200,
                "authority": 10,
                "requirements": {
                    "missions": 0,
                    "training": 0,
                    "skills": []
                },
                "benefits": {
                    "equipmentDiscount": 0,
                    "trainingDiscount": 0
                }
            },
            "消防员": {
                "id": "firefighter",
                "name": "消防员",
                "description": "完成基础训练，能够参与一般灭火任务",
                "salary": 500,
                "authority": 20,
                "requirements": {
                    "missions": 5,
                    "training": 3,
                    "skills": ["基础灭火"]
                },
                "benefits": {
                    "equipmentDiscount": 5,
                    "trainingDiscount": 5
                }
            },
            "消防班长": {
                "id": "fire_sergeant",
                "name": "消防班长",
                "description": "有经验的消防员，能够带领小组进行灭火和救援",
                "salary": 1000,
                "authority": 40,
                "requirements": {
                    "missions": 20,
                    "training": 10,
                    "skills": ["基础灭火", "火灾侦察", "火场搜救"]
                },
                "benefits": {
                    "equipmentDiscount": 10,
                    "trainingDiscount": 10
                }
            },
            "消防队长": {
                "id": "fire_captain",
                "name": "消防队长",
                "description": "消防站的领导者，负责指挥和协调所有灭火救援工作",
                "salary": 2000,
                "authority": 60,
                "requirements": {
                    "missions": 50,
                    "training": 25,
                    "skills": ["火场搜救", "化学火灾扑救", "指挥协调"]
                },
                "benefits": {
                    "equipmentDiscount": 20,
                    "trainingDiscount": 20
                }
            },
            "消防指挥员": {
                "id": "fire_commander",
                "name": "消防指挥员",
                "description": "高级职称，负责大规模灾害的统筹和指挥",
                "salary": 3500,
                "authority": 80,
                "requirements": {
                    "missions": 100,
                    "training": 50,
                    "skills": ["指挥协调", "高空救援", "大型设备操作"]
                },
                "benefits": {
                    "equipmentDiscount": 30,
                    "trainingDiscount": 30
                }
            }
        };
    }

    // 初始化救援类型数据
    initializeRescueTypes(fireData) {
        fireData.rescueTypes = {
            "被困人员救援": {
                "id": "trapped_rescue",
                "name": "被困人员救援",
                "description": "搜救被火灾或其他灾害困住的人员",
                "difficulty": 3,
                "danger": 4,
                "timeLimit": 300, // 秒
                "xpReward": 100,
                "moneyReward": 200,
                "equipment": ["防毒面具", "空气呼吸器", "热成像仪"],
                "skills": ["火场搜救", "高温环境适应"],
                "minRank": "消防员",
                "successRate": {
                    "baseRate": 70,
                    "skillBonus": 15,
                    "equipmentBonus": 10
                }
            },
            "电梯故障救援": {
                "id": "elevator_rescue",
                "name": "电梯故障救援",
                "description": "营救被困在故障电梯中的人员",
                "difficulty": 2,
                "danger": 2,
                "timeLimit": 180, // 秒
                "xpReward": 60,
                "moneyReward": 120,
                "equipment": ["基础消防服", "消防水带"],
                "skills": ["火灾侦察"],
                "minRank": "消防员",
                "successRate": {
                    "baseRate": 85,
                    "skillBonus": 10,
                    "equipmentBonus": 5
                }
            },
            "交通事故救援": {
                "id": "traffic_accident_rescue",
                "name": "交通事故救援",
                "description": "解救交通事故中被困的受害者",
                "difficulty": 3,
                "danger": 3,
                "timeLimit": 240, // 秒
                "xpReward": 80,
                "moneyReward": 150,
                "equipment": ["基础消防服", "消防水带", "大型设备"],
                "skills": ["火场搜救", "指挥协调"],
                "minRank": "消防班长",
                "successRate": {
                    "baseRate": 75,
                    "skillBonus": 15,
                    "equipmentBonus": 10
                }
            },
            "地震救援": {
                "id": "earthquake_rescue",
                "name": "地震救援",
                "description": "在地震后废墟中搜救幸存者",
                "difficulty": 5,
                "danger": 5,
                "timeLimit": 600, // 秒
                "xpReward": 200,
                "moneyReward": 400,
                "equipment": ["基础消防服", "消防无人机", "热成像仪", "大型设备"],
                "skills": ["火场搜救", "高空救援", "指挥协调"],
                "minRank": "消防队长",
                "successRate": {
                    "baseRate": 60,
                    "skillBonus": 20,
                    "equipmentBonus": 15
                }
            },
            "水域救援": {
                "id": "water_rescue",
                "name": "水域救援",
                "description": "救援溺水人员或水中被困者",
                "difficulty": 4,
                "danger": 4,
                "timeLimit": 180, // 秒
                "xpReward": 120,
                "moneyReward": 250,
                "equipment": ["基础消防服", "特种救生衣", "救生绳"],
                "skills": ["水域救援", "指挥协调"],
                "minRank": "消防班长",
                "successRate": {
                    "baseRate": 65,
                    "skillBonus": 20,
                    "equipmentBonus": 15
                }
            }
        };
    }

   
    async joinFireDepartment(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'firefighter', 'join');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData) {
            e.reply("你还没有开始模拟人生！请先使用 #开始模拟人生 指令。");
            return;
        }

        // 检查用户是否已经是消防员
        if (userData.firefighter) {
            e.reply("你已经是消防队的一员了！");
            return;
        }

        if (userData.stamina < 60) {
            e.reply("你的体力不足，无法加入消防队！消防工作需要良好的体力支持。");
            return;
        }

        if (userData.life < 70) {
            e.reply("你的生命值太低，无法加入消防队！请先恢复健康。");
            return;
        }

        // 初始化用户的消防员数据
        userData.firefighter = {
            isFirefighter: true,
            rank: "实习消防员",
            joinDate: new Date().toISOString(),
            experience: 0,
            missions: {
                completed: 0,
                failed: 0,
                casualties: 0,
                rescued: 0
            },
            training: {
                completed: 0,
                hours: 0
            },
            skills: [],
            equipment: ["基础消防服"],
            station: {
                name: "新手消防站",
                level: 1,
                staff: 5,
                vehicles: ["基础消防车"],
                equipment: ["基础消防服", "消防水带", "防毒面具"],
                upgradeProgress: 0
            },
            rewards: {
                medals: 0,
                commendations: 0
            }
        };

        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'firefighter', 'join');

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        image(e, 'firefighter_join', {
            cssFile,
            userName: userData.name,
            userRank: userData.firefighter.rank,
            joinDate: new Date(userData.firefighter.joinDate).toLocaleString(),
            stationName: userData.firefighter.station.name,
            stationLevel: userData.firefighter.station.level
        });

        setTimeout(() => {
            e.reply([
                "🔥 恭喜你成功加入消防队！现在你是一名实习消防员。\n\n",
                "📝 新手攻略：\n",
                "1. 进行消防演习来提升你的经验和技能\n",
                "2. 参与灭火行动执行真实任务\n",
                "3. 学习消防技能提高你的专业能力\n",
                "4. 购买更好的消防装备保障安全\n",
                "5. 完成救援任务获得额外奖励\n",
                "6. 提升你的消防站等级解锁更多功能\n\n",
                "使用 #消防帮助 查看更多指令和攻略！"
            ].join(''));
        }, 1500);
    }

    async showFirefighterInfo(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'firefighter', 'info');
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

        if (!userData.firefighter || !userData.firefighter.isFirefighter) {
            e.reply("你还不是消防队的一员！请先使用 #加入消防队 指令。");
            return;
        }

        await this.renderFirefighterInfo(e, userData);

        setCooldown(e.user_id, 'firefighter', 'info');
    }

    async renderFirefighterInfo(e, userData) {
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        
        // 计算服务时间
        const joinDate = new Date(userData.firefighter.joinDate);
        const currentDate = new Date();
        const serviceTime = Math.floor((currentDate - joinDate) / (1000 * 60 * 60 * 24)); // 天数
        
        // 获取职称信息
        const rankInfo = this.fireData.ranks[userData.firefighter.rank] || {
            id: "unknown",
            name: userData.firefighter.rank,
            salary: 0,
            authority: 0
        };
        
        // 准备装备列表
        const equipmentList = userData.firefighter.equipment.join(", ");
        
        // 准备技能列表
        const skillsList = userData.firefighter.skills.length > 0 ? userData.firefighter.skills.join(", ") : "暂无";
        
        // 计算成功率
        const successRate = (userData.firefighter.missions.completed / 
            (userData.firefighter.missions.completed + userData.firefighter.missions.failed || 1) * 100).toFixed(1);
        
        image(e, 'firefighter_info', {
            cssFile,
            userName: userData.name,
            userRank: userData.firefighter.rank,
            rankSalary: rankInfo.salary,
            rankAuthority: rankInfo.authority,
            joinDate: joinDate.toLocaleDateString(),
            serviceTime: serviceTime,
            experience: userData.firefighter.experience,
            missionsCompleted: userData.firefighter.missions.completed,
            missionsFailed: userData.firefighter.missions.failed,
            casualtiesCount: userData.firefighter.missions.casualties,
            rescuedCount: userData.firefighter.missions.rescued,
            trainingCompleted: userData.firefighter.training.completed,
            trainingHours: userData.firefighter.training.hours,
            equipmentList: equipmentList,
            skillsList: skillsList,
            medals: userData.firefighter.rewards.medals,
            commendations: userData.firefighter.rewards.commendations,
            stationName: userData.firefighter.station.name,
            stationLevel: userData.firefighter.station.level,
            successRate: successRate
        });
    }

    async showFireDepartmentInfo(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'firefighter', 'station');
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

        if (!userData.firefighter || !userData.firefighter.isFirefighter) {
            e.reply("你还不是消防队的一员！请先使用 #加入消防队 指令。");
            return;
        }

        await this.renderFireDepartmentInfo(e, userData);
        setCooldown(e.user_id, 'firefighter', 'station');
    }

    async renderFireDepartmentInfo(e, userData) {
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        const equipmentList = userData.firefighter.station.equipment.join(", ");
        const vehiclesList = userData.firefighter.station.vehicles.join(", ");
        const upgradePercentage = (userData.firefighter.station.upgradeProgress / 100 * 100).toFixed(1);
        const stationLevel = userData.firefighter.station.level;
        const maxStaff = 5 + (stationLevel - 1) * 3;
        const maxVehicles = 1 + (stationLevel - 1);
        const responseTime = Math.max(5 - (stationLevel - 1) * 0.5, 1).toFixed(1); // 响应时间，随等级提高而减少
        image(e, 'fire_department_info', {
            cssFile,
            stationName: userData.firefighter.station.name,
            stationLevel: stationLevel,
            staff: userData.firefighter.station.staff,
            maxStaff: maxStaff,
            vehicles: userData.firefighter.station.vehicles.length,
            maxVehicles: maxVehicles,
            equipmentList: equipmentList,
            vehiclesList: vehiclesList,
            upgradeProgress: upgradePercentage,
            responseTime: responseTime,
            userName: userData.name,
            userRank: userData.firefighter.rank
        });
    }

    async firefightingDrill(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'firefighter', 'drill');
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

        
        if (!userData.firefighter || !userData.firefighter.isFirefighter) {
            e.reply("你还不是消防队的一员！请先使用 #加入消防队 指令。");
            return;
        }

       
        if (userData.stamina < 30) {
            e.reply("你的体力不足，无法进行消防演习！请先休息恢复体力。");
            return;
        }

        
        const drillTypes = ["灭火基础训练", "紧急疏散演练", "搜救技术培训", "呼吸器使用训练", "高空救援演练"];
        const selectedDrill = drillTypes[Math.floor(Math.random() * drillTypes.length)];

      
        const baseSuccessRate = 70; // 基础成功率
        let successRateBuff = 0;

       
        if (userData.firefighter.rank === "消防员") successRateBuff += 5;
        if (userData.firefighter.rank === "消防班长") successRateBuff += 10;
        if (userData.firefighter.rank === "消防队长") successRateBuff += 15;
        if (userData.firefighter.rank === "消防指挥员") successRateBuff += 20;

        // 装备增益
        if (userData.firefighter.equipment.includes("基础消防服")) successRateBuff += 5;
        if (userData.firefighter.equipment.includes("防毒面具")) successRateBuff += 5;
        if (userData.firefighter.equipment.includes("消防水带")) successRateBuff += 3;

        // 技能增益
        if (userData.firefighter.skills.includes("基础灭火")) successRateBuff += 8;
        if (userData.firefighter.skills.includes("火灾侦察")) successRateBuff += 10;

        // 计算最终成功率并确定结果
        const finalSuccessRate = Math.min(baseSuccessRate + successRateBuff, 95); // 最高95%成功率
        const isSuccess = Math.random() * 100 < finalSuccessRate;

        // 更新用户数据
        userData.stamina -= 30; // 消耗体力
        userData.firefighter.training.completed += 1;
        userData.firefighter.training.hours += 2;

        if (isSuccess) {
            // 演习成功
            const expGain = 20 + Math.floor(Math.random() * 10);
            userData.firefighter.experience += expGain;
            
            if (!userData.firefighter.skills.includes("基础灭火") && Math.random() < 0.3) {
                userData.firefighter.skills.push("基础灭火");
                e.reply(`恭喜！你在演习中掌握了【基础灭火】技能！`);
            }
            let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
            image(e, 'firefighter_drill_success', {
                cssFile,
                userName: userData.name,
                drillType: selectedDrill,
                expGained: expGain,
                staminaLost: 30,
                successRate: finalSuccessRate.toFixed(1),
                rank: userData.firefighter.rank,
                trainingCompleted: userData.firefighter.training.completed
            });

            setTimeout(() => {
                e.reply([
                    `🔥 消防演习成功完成！\n`,
                    `📝 演习攻略：\n`,
                    `1. 定期参加演习可以增加经验值\n`,
                    `2. 体力值不足会影响演习效果\n`,
                    `3. 装备和技能可以提高演习成功率\n`,
                    `4. 累计足够的演习次数可以申请晋升职称\n`,
                    `5. 不同类型的演习有助于掌握不同技能`
                ].join(''));
            }, 1500);
        } else {
            // 演习失败
            const expGain = 5 + Math.floor(Math.random() * 5);
            userData.firefighter.experience += expGain;
            
            userData.life -= Math.floor(Math.random() * 5) + 1;
            
            let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
            image(e, 'firefighter_drill_failed', {
                cssFile,
                userName: userData.name,
                drillType: selectedDrill,
                expGained: expGain,
                staminaLost: 30,
                healthLost: userData.life,
                successRate: finalSuccessRate.toFixed(1),
                rank: userData.firefighter.rank
            });
            
            setTimeout(() => {
                e.reply([
                    `🔥 消防演习未能成功完成，但你从中学到了一些经验。\n`,
                    `📝 失败攻略：\n`,
                    `1. 购买更好的装备可以提高成功率\n`,
                    `2. 学习相关技能对特定演习很有帮助\n`,
                    `3. 保持良好的体力和健康状态\n`,
                    `4. 多次尝试同一类型的演习可以提高熟练度\n`,
                    `5. 先从基础演习开始，再挑战更难的项目`
                ].join(''));
            }, 1500);
        }
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        
        setCooldown(e.user_id, 'firefighter', 'drill');
    }

    async firefightingMission(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'firefighter', 'mission');
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

        // 检查用户是否是消防员
        if (!userData.firefighter || !userData.firefighter.isFirefighter) {
            e.reply("你还不是消防队的一员！请先使用 #加入消防队 指令。");
            return;
        }

        // 检查体力值
        if (userData.stamina < 50) {
            e.reply("你的体力不足，无法执行灭火任务！灭火行动需要大量体力，请先休息恢复。");
            return;
        }

        // 检查生命值
        if (userData.life < 60) {
            e.reply("你的健康状况不佳，无法执行灭火任务！请先恢复健康。");
            return;
        }

        const userRank = userData.firefighter.rank;
        const availableFireTypes = Object.values(this.fireData.fireTypes).filter(
            fire => this.canTakeFireMission(userRank, fire.minRank)
        );

        if (availableFireTypes.length === 0) {
            e.reply("当前没有适合你职称等级的火灾任务。请先提升你的职称或等待新任务。");
            return;
        }

        const selectedFire = availableFireTypes[Math.floor(Math.random() * availableFireTypes.length)];
    
        const locations = ["居民区", "商业街", "工业园区", "学校", "医院", "商场", "办公楼", "农田", "森林公园", "加油站"];
        const fireLocation = locations[Math.floor(Math.random() * locations.length)];
        
        userData.firefighter.currentMission = {
            fireId: selectedFire.id,
            fireName: selectedFire.name,
            fireLocation: fireLocation,
            difficulty: selectedFire.difficulty,
            danger: selectedFire.danger,
            timeStarted: Date.now(),
            timeLimit: selectedFire.timeLimit, // 秒
            casualties: Math.floor(Math.random() * (selectedFire.casualties.max - selectedFire.casualties.min + 1)) + selectedFire.casualties.min,
            status: "进行中"
        };

       
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);

        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        image(e, 'firefighting_mission', {
            cssFile,
            userName: userData.name,
            userRank: userData.firefighter.rank,
            fireName: selectedFire.name,
            fireLocation: fireLocation,
            difficulty: selectedFire.difficulty,
            danger: selectedFire.danger,
            casualties: userData.firefighter.currentMission.casualties,
            timeLimit: selectedFire.timeLimit,
            requiredEquipment: selectedFire.equipment.join(", "),
            recommendedSkills: selectedFire.skills.join(", ")
        });

        setTimeout(() => {
            e.reply([
                `🔥 紧急火灾警报！${fireLocation}发生${selectedFire.name}！\n`,
                `🚒 你已接到灭火任务，请迅速做出应对。\n\n`,
                `📝 灭火攻略：\n`,
                `1. 使用【#火灾控制 方案名】来选择你的灭火方案\n`,
                `2. 可选方案有：直接灭火、疏散人员、控制火势、救援伤员、请求支援\n`,
                `3. 不同火灾类型应选择不同方案\n`,
                `4. 你的装备和技能会影响成功率\n`,
                `5. 时间限制内未完成任务将视为失败\n\n`,
                `⏱️ 你有${Math.floor(selectedFire.timeLimit/60)}分钟时间来控制火势！`
            ].join(''));
        }, 1500);

        
        setCooldown(e.user_id, 'firefighter', 'mission');
    }

    canTakeFireMission(userRank, requiredRank) {
        const ranks = ["实习消防员", "消防员", "消防班长", "消防队长", "消防指挥员"];
        const userRankIndex = ranks.indexOf(userRank);
        const requiredRankIndex = ranks.indexOf(requiredRank);
        
        return userRankIndex >= requiredRankIndex;
    }

    async fireControl(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'firefighter', 'control');
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

        // 检查用户是否是消防员
        if (!userData.firefighter || !userData.firefighter.isFirefighter) {
            e.reply("你还不是消防队的一员！请先使用 #加入消防队 指令。");
            return;
        }

        // 检查是否有进行中的火灾任务
        if (!userData.firefighter.currentMission || userData.firefighter.currentMission.status !== "进行中") {
            e.reply("你当前没有进行中的灭火任务！请先使用 #灭火行动 接受任务。");
            return;
        }

        // 获取控制方案
        const controlMethod = e.msg.replace('#火灾控制 ', '').trim();
        const validMethods = ["直接灭火", "疏散人员", "控制火势", "救援伤员", "请求支援"];
        
        if (!validMethods.includes(controlMethod)) {
            e.reply(`无效的灭火方案！请选择：${validMethods.join("、")}`);
            return;
        }

        // 获取当前任务信息
        const mission = userData.firefighter.currentMission;
        const fireType = this.fireData.fireTypes[mission.fireName];
        
        // 检查任务是否超时
        const currentTime = Date.now();
        const missionTimeElapsed = (currentTime - mission.timeStarted) / 1000; // 秒
        
        if (missionTimeElapsed > fireType.timeLimit) {
            userData.firefighter.currentMission.status = "失败";
            userData.firefighter.missions.failed += 1;
            userData.life -= 10; // 失败损失生命值
            userData.stamina -= 50; // 消耗体力
            
           
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            
            e.reply("任务已超时！火势已经失控，灭火行动失败。你的队伍被迫撤退。\n生命值 -10，体力 -50");
            return;
        }

        // 计算行动的成功率
        let baseSuccessRate = 60; // 基础成功率
        let successRateBuff = 0;
        
        switch(controlMethod) {
            case "直接灭火":
                if (mission.fireName === "普通火灾") successRateBuff += 20;
                if (mission.fireName === "危险品仓库火灾") successRateBuff -= 30;
                break;
            case "疏散人员":
                if (mission.fireName === "高层建筑火灾") successRateBuff += 25;
                if (mission.casualties > 5) successRateBuff += 15;
                break;
            case "控制火势":
                if (mission.fireName === "森林火灾") successRateBuff += 20;
                if (mission.fireName === "工厂火灾") successRateBuff += 15;
                break;
            case "救援伤员":
                if (mission.casualties > 0) successRateBuff += mission.casualties * 5;
                break;
            case "请求支援":
                successRateBuff += 10; // 通用加成
                break;
        }
        
        // 装备加成
        for (const requiredEquipment of fireType.equipment) {
            if (userData.firefighter.equipment.includes(requiredEquipment)) {
                successRateBuff += 5;
            } else {
                successRateBuff -= 10; // 缺少必要装备会影响成功率
            }
        }
        for (const recommendedSkill of fireType.skills) {
            if (userData.firefighter.skills.includes(recommendedSkill)) {
                successRateBuff += 10;
            }
        }
        
        // 职称加成
        if (userData.firefighter.rank === "消防员") successRateBuff += 5;
        if (userData.firefighter.rank === "消防班长") successRateBuff += 10;
        if (userData.firefighter.rank === "消防队长") successRateBuff += 15;
        if (userData.firefighter.rank === "消防指挥员") successRateBuff += 20;
        
        // 计算最终成功率并确定结果
        const finalSuccessRate = Math.max(10, Math.min(baseSuccessRate + successRateBuff, 95)); // 保证至少10%，最高95%
        const isSuccess = Math.random() * 100 < finalSuccessRate;
        
        // 更新用户数据
        userData.stamina -= 50; 
        
        if (isSuccess) {
            switch(controlMethod) {
                case "直接灭火":
                    // 完全灭火，任务完成
                    userData.firefighter.currentMission.status = "成功";
                    userData.firefighter.missions.completed += 1;
                    userData.firefighter.experience += fireType.xpReward;
                    userData.money += fireType.moneyReward;
                    
                    // 有可能受伤
                    if (Math.random() < 0.3) {
                        const injury = Math.floor(Math.random() * 10) + 5;
                        userData.life -= injury;
                        e.reply(`你在直接灭火过程中受了轻伤，生命值 -${injury}`);
                    }
                    let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
                    image(e, 'firefighting_success', {
                        cssFile,
                        userName: userData.name,
                        userRank: userData.firefighter.rank,
                        fireName: mission.fireName,
                        fireLocation: mission.fireLocation,
                        method: controlMethod,
                        expGained: fireType.xpReward,
                        moneyGained: fireType.moneyReward,
                        successRate: finalSuccessRate.toFixed(1),
                        casualties: mission.casualties,
                        rescued: mission.casualties // 所有人都救出
                    });
                    
                    setTimeout(() => {
                        e.reply([
                            `🔥 灭火行动成功！火势已被完全控制！\n`,
                            `📊 任务总结：\n`,
                            `- 成功救出所有被困人员 (${mission.casualties}人)\n`,
                            `- 获得经验：${fireType.xpReward}\n`,
                            `- 获得奖金：${fireType.moneyReward}元\n\n`,
                            `📝 消防英雄攻略：\n`,
                            `1. 不同火灾类型适合不同的控制方法\n`,
                            `2. 装备齐全可以大幅提高成功率\n`,
                            `3. 学习专业技能对应对特定火灾至关重要\n`,
                            `4. 累计成功任务可以申请晋升\n`,
                            `5. 注意休息恢复体力，保持良好状态`
                        ].join(''));
                    }, 1500);
                    break;
                    
                case "疏散人员":
                    if (mission.casualties > 0) {
                        const savedPeople = Math.ceil(mission.casualties * 0.8); // 保存80%的人
                        userData.firefighter.missions.rescued += savedPeople;
                        userData.firefighter.currentMission.casualties -= savedPeople;
                        
                        e.reply([
                            `成功疏散了${savedPeople}名被困人员！\n`,
                            `但火势仍未控制，请继续采取行动！\n`,
                            `剩余被困人数：${userData.firefighter.currentMission.casualties}`
                        ].join(''));
                    } else {
                        e.reply("现场无被困人员需要疏散，请采取其他灭火措施！");
                    }
                    break;
                    
                case "控制火势":
                    userData.firefighter.currentMission.controlledFire = true;
                    e.reply([
                        `成功控制了火势蔓延！\n`,
                        `后续灭火行动的成功率将提高25%！\n`,
                        `请继续采取行动完全扑灭火灾。`
                    ].join(''));
                    break;
                    
                case "救援伤员":
                    if (mission.casualties > 0) {
                        const savedPeople = mission.casualties;
                        userData.firefighter.missions.rescued += savedPeople;
                        userData.firefighter.currentMission.casualties = 0;
                        
                        // 获得额外奖励
                        const bonusXp = savedPeople * 10;
                        const bonusMoney = savedPeople * 20;
                        userData.firefighter.experience += bonusXp;
                        userData.money += bonusMoney;
                        
                        e.reply([
                            `英勇救援！成功救出了所有${savedPeople}名被困人员！\n`,
                            `获得额外经验：${bonusXp}\n`,
                            `获得额外奖金：${bonusMoney}元\n`,
                            `但火势仍未控制，请继续采取行动！`
                        ].join(''));
                    } else {
                        e.reply("现场无被困人员需要救援，请采取其他灭火措施！");
                    }
                    break;
                    
                case "请求支援":
                    userData.firefighter.currentMission.supportArrived = true;
                    e.reply([
                        `支援已到达现场！\n`,
                        `后续所有行动的成功率将提高40%！\n`,
                        `请继续采取行动完全扑灭火灾。`
                    ].join(''));
                    break;
            }
            
            if (controlMethod === "直接灭火" || 
                (userData.firefighter.currentMission.casualties === 0 && 
                (userData.firefighter.currentMission.controlledFire || userData.firefighter.currentMission.supportArrived))) {
                // 任务全部完成
                userData.firefighter.currentMission.status = "成功";
                userData.firefighter.missions.completed += 1;
                
                // 如果前面步骤没有加经验和金钱，这里补上
                if (controlMethod !== "直接灭火") {
                    userData.firefighter.experience += fireType.xpReward;
                    userData.money += fireType.moneyReward;
                    
                    e.reply([
                        `🎉 灭火行动圆满成功！\n`,
                        `火势已被控制，所有人员已安全疏散！\n`,
                        `获得经验：${fireType.xpReward}\n`,
                        `获得奖金：${fireType.moneyReward}元`
                    ].join(''));
                }
            }
        } else {
            // 行动失败
            userData.life -= Math.floor(Math.random() * 15) + 5; // 失败受伤更严重
            
            // 检查是否严重失败（生命值过低或者特别低的成功率）
            if (userData.life < 30 || finalSuccessRate < 20) {
                // 严重失败，任务终止
                userData.firefighter.currentMission.status = "失败";
                userData.firefighter.missions.failed += 1;
                
                // 增加伤亡数
                const additionalCasualties = Math.floor(Math.random() * 3) + 1;
                userData.firefighter.missions.casualties += additionalCasualties;
                
                let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
                image(e, 'firefighting_failed', {
                    cssFile,
                    userName: userData.name,
                    userRank: userData.firefighter.rank,
                    fireName: mission.fireName,
                    fireLocation: mission.fireLocation,
                    method: controlMethod,
                    healthLost: userData.life,
                    staminaLost: 50,
                    successRate: finalSuccessRate.toFixed(1),
                    casualties: mission.casualties + additionalCasualties,
                    additionalCasualties: additionalCasualties
                });
                
                setTimeout(() => {
                    e.reply([
                        `❌ 灭火行动失败！情况恶化，你们被迫撤退！\n`,
                        `📊 任务总结：\n`,
                        `- 伤亡增加：${additionalCasualties}人\n`,
                        `- 你受伤严重，生命值显著下降\n`,
                        `- 体力消耗：50\n\n`,
                        `📝 失败教训：\n`,
                        `1. 准备更好的装备再尝试此类火灾\n`,
                        `2. 学习相关技能提高专业能力\n`,
                        `3. 选择与火灾类型匹配的灭火方法\n`,
                        `4. 一定要保持充足的体力和生命值\n`,
                        `5. 请求支援可以大幅提高成功率`
                    ].join(''));
                }, 1500);
            } else {
                e.reply([
                    `控制失败！${controlMethod}未能有效执行。\n`,
                    `你受了轻伤，生命值减少。\n`,
                    `请尝试其他方法或重新执行此操作。`
                ].join(''));
            }
        }
        
       
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        
        
        setCooldown(e.user_id, 'firefighter', 'control');
    }

    async learnFirefightingSkill(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'firefighter', 'learn');
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

        if (!userData.firefighter || !userData.firefighter.isFirefighter) {
            e.reply("你还不是消防队的一员！请先使用 #加入消防队 指令。");
            return;
        }

        const skillName = e.msg.replace('#学习消防技能 ', '').trim();
        
        if (!this.fireData.skills[skillName]) {
            const availableSkills = Object.keys(this.fireData.skills).join('、');
            e.reply(`未找到该技能！可学习的技能有：${availableSkills}`);
            return;
        }
        
        const skill = this.fireData.skills[skillName];
        
        if (userData.firefighter.skills.includes(skillName)) {
            e.reply(`你已经掌握了【${skillName}】技能！`);
            return;
        }
        
        if (!this.canLearnSkill(userData.firefighter.rank, skill.rank)) {
            e.reply(`你的职称不足，无法学习【${skillName}】技能！需要${skill.rank}或以上职称。`);
            return;
        }
        for (const prerequisite of skill.prerequisites) {
            if (!userData.firefighter.skills.includes(prerequisite)) {
                e.reply(`学习【${skillName}】需要先掌握【${prerequisite}】技能！`);
                return;
            }
        }
        
        if (userData.money < skill.learnCost) {
            e.reply(`你的金钱不足，无法学习【${skillName}】技能！需要${skill.learnCost}元。`);
            return;
        }
        userData.money -= skill.learnCost;
        userData.firefighter.skills.push(skillName);
        userData.firefighter.experience += 30;
        
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        image(e, 'learn_firefighting_skill', {
            cssFile,
            userName: userData.name,
            userRank: userData.firefighter.rank,
            skillName: skillName,
            skillDesc: skill.description,
            costPaid: skill.learnCost,
            expGained: 30,
            buffDescription: this.getSkillBuffDescription(skill)
        });
        
        setTimeout(() => {
            e.reply([
                `🎓 恭喜！你成功学习了【${skillName}】技能！\n\n`,
                `📝 技能攻略：\n`,
                `1. ${skillName}适合应对${this.getSkillApplications(skillName)}\n`,
                `2. 该技能提供的增益：${this.getSkillBuffDescription(skill)}\n`,
                `3. 技能搭配推荐：${this.getSkillCombinations(skillName)}\n`,
                `4. 掌握更多技能可以提高任务成功率\n`,
                `5. 不同职称可以学习的技能范围不同`
            ].join(''));
        }, 1500);
        
        
        setCooldown(e.user_id, 'firefighter', 'learn');
    }
    
    canLearnSkill(userRank, requiredRank) {
        const ranks = ["实习消防员", "消防员", "消防班长", "消防队长", "消防指挥员"];
        const userRankIndex = ranks.indexOf(userRank);
        const requiredRankIndex = ranks.indexOf(requiredRank);
        
        return userRankIndex >= requiredRankIndex;
    }
    
    getSkillBuffDescription(skill) {
        const buffs = [];
        
        if (skill.effectivenessBuff) buffs.push(`灭火效率+${skill.effectivenessBuff}%`);
        if (skill.safetyBuff) buffs.push(`安全性+${skill.safetyBuff}%`);
        if (skill.rescueEfficiencyBuff) buffs.push(`救援效率+${skill.rescueEfficiencyBuff}%`);
        if (skill.survivorSaveBuff) buffs.push(`幸存者救出率+${skill.survivorSaveBuff}%`);
        if (skill.heatResistanceBuff) buffs.push(`耐热性+${skill.heatResistanceBuff}%`);
        if (skill.staminaInHeatBuff) buffs.push(`高温体力消耗-${skill.staminaInHeatBuff}%`);
        if (skill.chemicalFireEfficiencyBuff) buffs.push(`化学火灾处理+${skill.chemicalFireEfficiencyBuff}%`);
        if (skill.toxinResistanceBuff) buffs.push(`毒素抵抗+${skill.toxinResistanceBuff}%`);
        if (skill.heightFearReduction) buffs.push(`高空恐惧-${skill.heightFearReduction}%`);
        if (skill.ropeTechniquesBuff) buffs.push(`绳索技术+${skill.ropeTechniquesBuff}%`);
        if (skill.verticalMovementSpeed) buffs.push(`垂直移动速度+${skill.verticalMovementSpeed}%`);
        if (skill.teamEfficiencyBuff) buffs.push(`团队效率+${skill.teamEfficiencyBuff}%`);
        if (skill.communicationBuff) buffs.push(`沟通协调+${skill.communicationBuff}%`);
        if (skill.decisionSpeedBuff) buffs.push(`决策速度+${skill.decisionSpeedBuff}%`);
        if (skill.equipmentEfficiencyBuff) buffs.push(`设备效率+${skill.equipmentEfficiencyBuff}%`);
        if (skill.mechanicalKnowledgeBuff) buffs.push(`机械知识+${skill.mechanicalKnowledgeBuff}%`);
        
        return buffs.join('，');
    }
    
    getSkillApplications(skillName) {
        const applications = {
            "基础灭火": "小型火灾和一般灭火任务",
            "火灾侦察": "复杂建筑和未知火源情况",
            "火场搜救": "有人员被困的灾害现场",
            "高温环境适应": "工厂火灾和高温环境",
            "化学火灾扑救": "危险品仓库和化学物质泄漏",
            "高空救援": "高层建筑火灾和高空救援",
            "指挥协调": "大型灾害和多部门协作",
            "大型设备操作": "需要使用专业设备的场景"
        };
        
        return applications[skillName] || "各类消防任务";
    }
    getSkillCombinations(skillName) {
        const combinations = {
            "基础灭火": "火灾侦察、高温环境适应",
            "火灾侦察": "基础灭火、火场搜救",
            "火场搜救": "高温环境适应、高空救援",
            "高温环境适应": "化学火灾扑救、基础灭火",
            "化学火灾扑救": "指挥协调、火灾侦察",
            "高空救援": "火场搜救、大型设备操作",
            "指挥协调": "大型设备操作、化学火灾扑救",
            "大型设备操作": "高空救援、指挥协调"
        };
        
        return combinations[skillName] || "所有基础技能";
    }


    async buyFirefightingEquipment(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'firefighter', 'buy');
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

        if (!userData.firefighter || !userData.firefighter.isFirefighter) {
            e.reply("你还不是消防队的一员！请先使用 #加入消防队 指令。");
            return;
        }

        // 获取装备名称
        const equipmentName = e.msg.replace('#购买消防装备 ', '').trim();
        
        // 检查装备是否存在
        if (!this.fireData.equipment[equipmentName]) {
            const availableEquipment = Object.keys(this.fireData.equipment).join('、');
            e.reply(`未找到该装备！可购买的装备有：${availableEquipment}`);
            return;
        }
        
        const equipment = this.fireData.equipment[equipmentName];
        
        // 检查用户是否已经拥有该装备
        if (userData.firefighter.equipment.includes(equipmentName)) {
            e.reply(`你已经拥有【${equipmentName}】装备！`);
            return;
        }
        
        // 检查用户职称是否符合要求
        if (!this.canUseEquipment(userData.firefighter.rank, equipment.rank)) {
            e.reply(`你的职称不足，无法使用【${equipmentName}】装备！需要${equipment.rank}或以上职称。`);
            return;
        }
        
        // 计算折扣
        const rankInfo = this.fireData.ranks[userData.firefighter.rank];
        const discount = rankInfo ? rankInfo.benefits.equipmentDiscount : 0;
        const discountedPrice = Math.floor(equipment.price * (1 - discount / 100));
        
        // 检查金钱是否足够
        if (userData.money < discountedPrice) {
            e.reply(`你的金钱不足，无法购买【${equipmentName}】装备！需要${discountedPrice}元（已享受${discount}%职称折扣）。`);
            return;
        }
        
        // 扣除金钱并获得装备
        userData.money -= discountedPrice;
        userData.firefighter.equipment.push(equipmentName);
        
       
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        image(e, 'buy_firefighting_equipment', {
            cssFile,
            userName: userData.name,
            userRank: userData.firefighter.rank,
            equipmentName: equipmentName,
            equipmentDesc: equipment.description,
            originalPrice: equipment.price,
            discountRate: discount,
            finalPrice: discountedPrice,
            equipmentAttributes: this.getEquipmentAttributesDescription(equipment)
        });
        setTimeout(() => {
            e.reply([
                `🛒 恭喜！你成功购买了【${equipmentName}】装备！\n\n`,
                `📝 装备攻略：\n`,
                `1. ${equipmentName}适合应对${this.getEquipmentApplications(equipmentName)}\n`,
                `2. 该装备提供的属性：${this.getEquipmentAttributesDescription(equipment)}\n`,
                `3. 装备搭配推荐：${this.getEquipmentCombinations(equipmentName)}\n`,
                `4. 高级装备可以显著提高任务成功率\n`,
                `5. 不同职称购买装备有不同折扣优惠`
            ].join(''));
        }, 1500);
        
        
        setCooldown(e.user_id, 'firefighter', 'buy');
    }
    
   
    canUseEquipment(userRank, requiredRank) {
        const ranks = ["实习消防员", "消防员", "消防班长", "消防队长", "消防指挥员"];
        const userRankIndex = ranks.indexOf(userRank);
        const requiredRankIndex = ranks.indexOf(requiredRank);
        
        return userRankIndex >= requiredRankIndex;
    }
    
    // 获取装备属性描述
    getEquipmentAttributesDescription(equipment) {
        const attributes = [];
        
        if (equipment.protection) attributes.push(`防护力+${equipment.protection}`);
        if (equipment.durability) attributes.push(`耐久度+${equipment.durability}`);
        if (equipment.mobility) attributes.push(`机动性+${equipment.mobility}`);
        if (equipment.waterFlow) attributes.push(`水流量+${equipment.waterFlow}L/min`);
        if (equipment.length) attributes.push(`长度${equipment.length}米`);
        if (equipment.airSupply) attributes.push(`供气${equipment.airSupply}分钟`);
        if (equipment.detectionRange) attributes.push(`探测范围${equipment.detectionRange}米`);
        if (equipment.batteryLife) attributes.push(`电池续航${equipment.batteryLife}分钟`);
        if (equipment.accuracy) attributes.push(`精度+${equipment.accuracy}%`);
        if (equipment.range) attributes.push(`射程${equipment.range}米`);
        if (equipment.flightTime) attributes.push(`飞行时间${equipment.flightTime}分钟`);
        
        if (equipment.attributes) {
            for (const [key, value] of Object.entries(equipment.attributes)) {
                let attributeName = "";
                switch (key) {
                    case "fireResistance": attributeName = "耐火性"; break;
                    case "heatInsulation": attributeName = "隔热性"; break;
                    case "comfortLevel": attributeName = "舒适度"; break;
                    case "toxinFiltering": attributeName = "毒素过滤"; break;
                    case "visionRange": attributeName = "视野范围"; break;
                    case "breathingComfort": attributeName = "呼吸舒适度"; break;
                    case "pressureResistance": attributeName = "耐压性"; break;
                    case "flexibility": attributeName = "灵活性"; break;
                    case "weightRating": attributeName = "重量等级"; break;
                    case "airQuality": attributeName = "空气质量"; break;
                    case "weight": attributeName = "重量"; break;
                    case "imageQuality": attributeName = "图像质量"; break;
                    case "responseTime": attributeName = "响应时间"; break;
                    case "pressureControl": attributeName = "压力控制"; break;
                    case "splashRadius": attributeName = "喷洒半径"; break;
                    case "setupTime": attributeName = "安装时间"; break;
                    case "chemicalResistance": attributeName = "化学抵抗"; break;
                    case "wearTime": attributeName = "穿戴时间"; break;
                    case "transmissionQuality": attributeName = "传输质量"; break;
                    case "windResistance": attributeName = "抗风性"; break;
                    case "autonomyLevel": attributeName = "自主性"; break;
                    default: attributeName = key;
                }
                
                if (key === "weight" || key === "wearTime" || key === "setupTime" || key === "responseTime") {
                    attributes.push(`${attributeName}${value}${key === "weight" ? "kg" : (key === "responseTime" ? "秒" : "分钟")}`);
                } else {
                    attributes.push(`${attributeName}+${value}`);
                }
            }
        }
        
        return attributes.join('，');
    }
    getEquipmentApplications(equipmentName) {
        const applications = {
            "基础消防服": "一般火灾和日常训练",
            "防毒面具": "有毒气体环境和化学火灾",
            "消防水带": "各类灭火任务",
            "空气呼吸器": "浓烟环境和密闭空间救援",
            "热成像仪": "搜救被困人员和定位火源",
            "消防水炮": "大型火灾和范围灭火",
            "高级防化服": "危险化学品泄漏和特种火灾",
            "消防无人机": "侦察和监测大范围火场"
        };
        
        return applications[equipmentName] || "各类消防任务";
    }
    
    getEquipmentCombinations(equipmentName) {
        const combinations = {
            "基础消防服": "防毒面具、消防水带",
            "防毒面具": "基础消防服、空气呼吸器",
            "消防水带": "基础消防服、消防水炮",
            "空气呼吸器": "高级防化服、热成像仪",
            "热成像仪": "空气呼吸器、消防无人机",
            "消防水炮": "消防水带、基础消防服",
            "高级防化服": "空气呼吸器、热成像仪",
            "消防无人机": "热成像仪、高级防化服"
        };
        
        return combinations[equipmentName] || "基础消防装备";
    }
    
    async upgradeFireStation(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'firefighter', 'upgrade');
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

        // 检查用户是否是消防员
        if (!userData.firefighter || !userData.firefighter.isFirefighter) {
            e.reply("你还不是消防队的一员！请先使用 #加入消防队 指令。");
            return;
        }
        
        // 检查用户职称是否足够
        if (userData.firefighter.rank === "实习消防员" || userData.firefighter.rank === "消防员") {
            e.reply("你的职称不足，无法升级消防站！需要消防班长或以上职称。");
            return;
        }
        
        // 检查消防站等级上限
        const maxLevel = 5;
        if (userData.firefighter.station.level >= maxLevel) {
            e.reply(`消防站已达到最高等级(${maxLevel})，无法继续升级！`);
            return;
        }
        
        // 计算升级所需资源
        const currentLevel = userData.firefighter.station.level;
        const upgradeCost = 1000 * Math.pow(2, currentLevel - 1);
        const requiredMissions = 10 * currentLevel;
        const requiredTraining = 5 * currentLevel;
        
        // 检查升级条件
        if (userData.money < upgradeCost) {
            e.reply(`消防站升级资金不足！需要${upgradeCost}元，你当前拥有${userData.money}元。`);
            return;
        }
        
        if (userData.firefighter.missions.completed < requiredMissions) {
            e.reply(`消防站升级需要完成更多任务！需要完成${requiredMissions}次任务，你当前完成了${userData.firefighter.missions.completed}次。`);
            return;
        }
        
        if (userData.firefighter.training.completed < requiredTraining) {
            e.reply(`消防站升级需要更多训练经验！需要完成${requiredTraining}次训练，你当前完成了${userData.firefighter.training.completed}次。`);
            return;
        }
        userData.money -= upgradeCost;
        userData.firefighter.station.level += 1;
        userData.firefighter.station.upgradeProgress = 0;
        this.updateFireStationAfterUpgrade(userData);
        
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        image(e, 'fire_station_upgrade', {
            cssFile,
            userName: userData.name,
            userRank: userData.firefighter.rank,
            stationName: userData.firefighter.station.name,
            newLevel: userData.firefighter.station.level,
            upgradeCost: upgradeCost,
            newStaff: userData.firefighter.station.staff,
            newVehicles: userData.firefighter.station.vehicles.join(", "),
            newEquipment: userData.firefighter.station.equipment.join(", ")
        });
        
        // 发送升级成功提示和攻略
        setTimeout(() => {
            e.reply([
                `🏢 恭喜！你的消防站已升级到${userData.firefighter.station.level}级！\n\n`,
                `📝 消防站升级攻略：\n`,
                `1. 消防站升级可增加人员容量和装备种类\n`,
                `2. 提高等级可解锁更多高级消防车\n`,
                `3. 响应时间随等级提升而缩短\n`,
                `4. 高等级消防站可以应对更复杂的火灾\n`,
                `5. 定期执行任务和训练来积累升级资源\n\n`,
                `下一级消防站升级需要：\n- ${this.getNextUpgradeRequirements(userData.firefighter.station.level)}`
            ].join(''));
        }, 1500);
        
        
        setCooldown(e.user_id, 'firefighter', 'upgrade');
    }
    updateFireStationAfterUpgrade(userData) {
        const level = userData.firefighter.station.level;
        userData.firefighter.station.staff = 5 + (level - 1) * 3;
        
        // 增加消防车种类
        const newVehicles = ["基础消防车"];
        if (level >= 2) newVehicles.push("云梯消防车");
        if (level >= 3) newVehicles.push("水罐消防车");
        if (level >= 4) newVehicles.push("泡沫消防车");
        if (level >= 5) newVehicles.push("抢险救援车");
        userData.firefighter.station.vehicles = newVehicles;
        
        // 增加可用装备
        const newEquipment = ["基础消防服", "消防水带", "防毒面具"];
        if (level >= 2) newEquipment.push("空气呼吸器");
        if (level >= 3) newEquipment.push("热成像仪");
        if (level >= 4) newEquipment.push("消防水炮");
        if (level >= 5) newEquipment.push("高级防化服", "消防无人机");
        userData.firefighter.station.equipment = newEquipment;
        
        const stationNames = [
            "新手消防站",
            "标准消防站",
            "进阶消防站",
            "高级消防站",
            "精英消防总站"
        ];
        userData.firefighter.station.name = stationNames[level - 1] || "顶级消防总站";
    }
    
    // 获取下一级升级需求
    getNextUpgradeRequirements(currentLevel) {
        if (currentLevel >= 5) return "已达到最高等级";
        
        const nextLevel = currentLevel + 1;
        const upgradeCost = 1000 * Math.pow(2, currentLevel);
        const requiredMissions = 10 * nextLevel;
        const requiredTraining = 5 * nextLevel;
        
        return `资金${upgradeCost}元，完成${requiredMissions}次任务，${requiredTraining}次训练`;
    }

    async applyForPromotion(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'firefighter', 'promotion');
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

        if (!userData.firefighter || !userData.firefighter.isFirefighter) {
            e.reply("你还不是消防队的一员！请先使用 #加入消防队 指令。");
            return;
        }
        
        const currentRank = userData.firefighter.rank;
        const nextRank = this.getNextRank(currentRank);
        if (!nextRank) {
            e.reply("你已经达到最高职称(消防指挥员)，无法继续晋升！");
            return;
        }
        const requirements = this.fireData.ranks[nextRank].requirements;
        const meetsMissionRequirement = userData.firefighter.missions.completed >= requirements.missions;
        const meetsTrainingRequirement = userData.firefighter.training.completed >= requirements.training;
        const meetsSkillRequirement = requirements.skills.every(skill => userData.firefighter.skills.includes(skill));
        let progressMsg = [
            `【职称晋升申请：${currentRank} → ${nextRank}】\n`,
            `任务要求：${userData.firefighter.missions.completed}/${requirements.missions}次 (${meetsMissionRequirement ? "已达成" : "未达成"})\n`,
            `训练要求：${userData.firefighter.training.completed}/${requirements.training}次 (${meetsTrainingRequirement ? "已达成" : "未达成"})\n`,
            `技能要求：需掌握 ${requirements.skills.join("、")}\n`
        ];
        if (requirements.skills.length > 0) {
            const missingSkills = requirements.skills.filter(skill => !userData.firefighter.skills.includes(skill));
            if (missingSkills.length > 0) {
                progressMsg.push(`缺少技能：${missingSkills.join("、")}\n`);
            } else {
                progressMsg.push(`技能要求：已达成\n`);
            }
        }
        
        // 判断是否满足所有条件
        if (meetsMissionRequirement && meetsTrainingRequirement && meetsSkillRequirement) {
            userData.firefighter.rank = nextRank;
            const promotionBonus = this.fireData.ranks[nextRank].salary;
            userData.money += promotionBonus;
            
            // 增加成就奖励
            userData.firefighter.rewards.commendations += 1;
            
            await redis.set(`user:${userId}`, JSON.stringify(userData));
            await saveUserData(userId, userData);
            
            let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
            image(e, 'firefighter_promotion', {
                cssFile,
                userName: userData.name,
                oldRank: currentRank,
                newRank: nextRank,
                bonus: promotionBonus,
                authority: this.fireData.ranks[nextRank].authority,
                equipmentDiscount: this.fireData.ranks[nextRank].benefits.equipmentDiscount,
                trainingDiscount: this.fireData.ranks[nextRank].benefits.trainingDiscount
            });
            
            setTimeout(() => {
                e.reply([
                    `🎖️ 恭喜！你已成功晋升为${nextRank}！\n\n`,
                    `📝 职称晋升攻略：\n`,
                    `1. 晋升后的权限增加，可指挥更多队员\n`,
                    `2. 获得装备购买折扣：${this.fireData.ranks[nextRank].benefits.equipmentDiscount}%\n`,
                    `3. 获得训练费用折扣：${this.fireData.ranks[nextRank].benefits.trainingDiscount}%\n`,
                    `4. 晋升奖金：${promotionBonus}元\n`,
                    `5. 可以学习更高级的技能和使用更高级的装备\n`,
                    `6. 继续积累经验可申请下一级职称晋升`
                ].join(''));
            }, 1500);
        } else {
            e.reply(progressMsg.join('') + "\n晋升条件未满足，请继续努力！");
        }
        
        
        setCooldown(e.user_id, 'firefighter', 'promotion');
    }
    
    getNextRank(currentRank) {
        const rankProgression = {
            "实习消防员": "消防员",
            "消防员": "消防班长",
            "消防班长": "消防队长",
            "消防队长": "消防指挥员",
            "消防指挥员": null
        };
        
        return rankProgression[currentRank];
    }
    
    async rescueOperation(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'firefighter', 'rescue');
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

        if (!userData.firefighter || !userData.firefighter.isFirefighter) {
            e.reply("你还不是消防队的一员！请先使用 #加入消防队 指令。");
            return;
        }
        
        if (userData.stamina < 40) {
            e.reply("你的体力不足，无法执行救援任务！请先休息恢复体力。");
            return;
        }
        
        // 检查是否有进行中的火灾任务
        if (userData.firefighter.currentMission && userData.firefighter.currentMission.status === "进行中") {
            e.reply("你有一个正在进行的灭火任务！请先完成当前任务。");
            return;
        }
        
        // 获取救援类型
        const rescueType = e.msg.replace('#消防救援 ', '').trim();
        
        // 检查救援类型是否存在
        if (!this.fireData.rescueTypes[rescueType]) {
            const availableRescueTypes = Object.keys(this.fireData.rescueTypes).join('、');
            e.reply(`未找到该救援类型！可执行的救援类型有：${availableRescueTypes}`);
            return;
        }
        
        const rescue = this.fireData.rescueTypes[rescueType];
        
        // 检查用户职称是否符合要求
        if (!this.canTakeRescueMission(userData.firefighter.rank, rescue.minRank)) {
            e.reply(`你的职称不足，无法执行【${rescueType}】救援任务！需要${rescue.minRank}或以上职称。`);
            return;
        }
        
        // 计算救援成功率
        let baseSuccessRate = rescue.successRate.baseRate;
        let successRateBuff = 0;
        
        // 装备加成
        for (const requiredEquipment of rescue.equipment) {
            if (userData.firefighter.equipment.includes(requiredEquipment)) {
                successRateBuff += rescue.successRate.equipmentBonus;
            }
        }
        
        // 技能加成
        for (const recommendedSkill of rescue.skills) {
            if (userData.firefighter.skills.includes(recommendedSkill)) {
                successRateBuff += rescue.successRate.skillBonus;
            }
        }
        
        // 职称加成
        if (userData.firefighter.rank === "消防班长") successRateBuff += 5;
        if (userData.firefighter.rank === "消防队长") successRateBuff += 10;
        if (userData.firefighter.rank === "消防指挥员") successRateBuff += 15;
        
        // 计算最终成功率并确定结果
        const finalSuccessRate = Math.max(10, Math.min(baseSuccessRate + successRateBuff, 95)); // 保证至少10%，最高95%
        const isSuccess = Math.random() * 100 < finalSuccessRate;
        
        // 随机生成救援地点
        const locations = ["居民小区", "学校", "医院", "商场", "工厂", "办公楼", "公园", "地铁站", "桥梁", "隧道"];
        const rescueLocation = locations[Math.floor(Math.random() * locations.length)];
        const victimsCount = Math.floor(Math.random() * 5) + 1;
        userData.stamina -= 40; // 消耗体力
        
        if (isSuccess) {
            userData.firefighter.missions.rescued += victimsCount;
            userData.firefighter.experience += rescue.xpReward;
            userData.money += rescue.moneyReward;
            
            if (Math.random() < 0.1) {
                userData.firefighter.rewards.medals += 1;
                e.reply("🎖️ 因为你的出色表现，你获得了一枚救援勋章！");
            }
            
            let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
            image(e, 'rescue_success', {
                cssFile,
                userName: userData.name,
                userRank: userData.firefighter.rank,
                rescueType: rescueType,
                rescueLocation: rescueLocation,
                difficulty: rescue.difficulty,
                danger: rescue.danger,
                victimsCount: victimsCount,
                expGained: rescue.xpReward,
                moneyGained: rescue.moneyReward,
                successRate: finalSuccessRate.toFixed(1)
            });
            
            setTimeout(() => {
                e.reply([
                    `🚑 救援行动成功！成功救出${victimsCount}名被困人员！\n\n`,
                    `📝 救援攻略：\n`,
                    `1. ${rescueType}适合使用${rescue.equipment.slice(0, 2).join("、")}等装备\n`,
                    `2. 掌握${rescue.skills.join("、")}技能可以提高成功率\n`,
                    `3. 不同类型的救援任务难度和危险性不同\n`,
                    `4. 救援任务比灭火任务更注重精准性和专业技能\n`,
                    `5. 累积救援人数可以提高晋升几率和获得特殊奖励`
                ].join(''));
            }, 1500);
        } else {
          
            userData.life -= Math.floor(Math.random() * 10) + 5; // 受伤
          
            let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
            image(e, 'rescue_failed', {
                cssFile,
                userName: userData.name,
                userRank: userData.firefighter.rank,
                rescueType: rescueType,
                rescueLocation: rescueLocation,
                difficulty: rescue.difficulty,
                danger: rescue.danger,
                victimsCount: victimsCount,
                healthLost: userData.life,
                staminaLost: 40,
                successRate: finalSuccessRate.toFixed(1)
            });
            
            setTimeout(() => {
                e.reply([
                    `❌ 救援行动失败！情况恶化，你们被迫撤退！\n\n`,
                    `📝 失败教训：\n`,
                    `1. 准备更专业的救援装备再尝试\n`,
                    `2. 学习相关救援技能提高专业能力\n`,
                    `3. 提高体力和生命值再执行高难度救援\n`,
                    `4. 考虑寻求支援或选择难度较低的救援类型\n`,
                    `5. 不同救援类型需要不同应对策略`
                ].join(''));
            }, 1500);
        }
        
       
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'firefighter', 'rescue');
    }
    
    canTakeRescueMission(userRank, requiredRank) {
        const ranks = ["实习消防员", "消防员", "消防班长", "消防队长", "消防指挥员"];
        const userRankIndex = ranks.indexOf(userRank);
        const requiredRankIndex = ranks.indexOf(requiredRank);
        
        return userRankIndex >= requiredRankIndex;
    }
    
    async firefighterHelp(e) {
        
        const remainingTime = checkCooldown(e.user_id, 'firefighter', 'help');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        this.generateFirefighterGuide();
        
        let cssFile = `${_path}/plugins/sims-plugin/resources/HTML/`;
        image(e, 'firefighter_help', {
            cssFile
        });
        
        setTimeout(() => {
            e.reply([
                `🔥【模拟消防员系统】指令列表：\n\n`,
                `#加入消防队 - 成为一名消防员\n`,
                `#消防员信息 - 查看个人消防员信息\n`,
                `#消防队信息 - 查看消防站信息\n`,
                `#消防演习 - 进行消防训练提升技能\n`,
                `#灭火行动 - 接受随机灭火任务\n`,
                `#火灾控制 [方案] - 选择灭火方案\n`,
                `可选方案: 直接灭火、疏散人员、控制火势、救援伤员、请求支援\n\n`,
                `#学习消防技能 [技能名] - 学习特定消防技能\n`,
                `#购买消防装备 [装备名] - 购买消防装备\n`,
                `#消防站升级 - 提升消防站等级\n`,
                `#申请职称晋升 - 提升消防职称\n`,
                `#消防救援 [救援类型] - 执行特定救援任务\n\n`,
                `📝 完整攻略已生成，请查看插件目录下的【消防员模拟攻略.md】`
            ].join(''));
        }, 1500);
        
        
        setCooldown(e.user_id, 'firefighter', 'help');
    }
    
    generateFirefighterGuide() {
        const guidePath = path.join(PLUGIN_PATH, '消防员模拟攻略.md');
        
        const guideContent = [
            `# 模拟消防员系统攻略\n\n`,
            `## 基础指令\n\n`,
            `- **#加入消防队** - 成为一名消防员，开始消防员生涯\n`,
            `- **#消防员信息** - 查看个人消防员信息，包括职称、经验、任务完成情况等\n`,
            `- **#消防队信息** - 查看消防站信息，包括等级、人员、装备等\n`,
            `- **#消防帮助** - 查看所有可用指令和基本攻略\n\n`,
            
            `## 训练与任务\n\n`,
            `- **#消防演习** - 进行消防训练，提升经验和技能\n`,
            `- **#灭火行动** - 接受随机灭火任务\n`,
            `- **#火灾控制 [方案]** - 选择灭火方案，可选方案包括：\n`,
            `  - 直接灭火：适合小型普通火灾\n`,
            `  - 疏散人员：适合人员密集场所火灾\n`,
            `  - 控制火势：适合大型或蔓延火灾\n`,
            `  - 救援伤员：当有被困人员时优先选择\n`,
            `  - 请求支援：面对高难度火灾时的明智选择\n`,
            `- **#消防救援 [救援类型]** - 执行特定救援任务，如被困人员救援、电梯故障救援等\n\n`,
            
            `## 技能与装备\n\n`,
            `- **#学习消防技能 [技能名]** - 学习特定消防技能\n`,
            `- **#购买消防装备 [装备名]** - 购买消防装备\n\n`,
            
            `### 技能列表\n\n`,
            Object.entries(this.fireData.skills).map(([name, skill]) => 
                `- **${name}**：${skill.description} (职称要求：${skill.rank}，消耗：${skill.learnCost}元)\n`
            ).join(''),
            
            `\n### 装备列表\n\n`,
            Object.entries(this.fireData.equipment).map(([name, equipment]) => 
                `- **${name}**：${equipment.description} (职称要求：${equipment.rank}，价格：${equipment.price}元)\n`
            ).join(''),
            
            `\n## 职称与升级\n\n`,
            `- **#消防站升级** - 提升消防站等级，解锁更多功能和装备\n`,
            `- **#申请职称晋升** - 提升消防职称，获得更高权限和工资\n\n`,
            
            `### 职称等级\n\n`,
            Object.entries(this.fireData.ranks).map(([name, rank]) => 
                `- **${name}**：${rank.description}\n  要求：完成${rank.requirements.missions}次任务，${rank.requirements.training}次训练，掌握技能${rank.requirements.skills.join('、')}\n  福利：装备折扣${rank.benefits.equipmentDiscount}%，训练折扣${rank.benefits.trainingDiscount}%，基础工资${rank.salary}元\n`
            ).join(''),
            
            `\n## 火灾类型\n\n`,
            Object.entries(this.fireData.fireTypes).map(([name, fire]) => 
                `- **${name}**：${fire.description}\n  难度：${fire.difficulty}/5，危险：${fire.danger}/5\n  推荐装备：${fire.equipment.join('、')}\n  推荐技能：${fire.skills.join('、')}\n  最低职称：${fire.minRank}\n`
            ).join(''),
            
            `\n## 救援类型\n\n`,
            Object.entries(this.fireData.rescueTypes).map(([name, rescue]) => 
                `- **${name}**：${rescue.description}\n  难度：${rescue.difficulty}/5，危险：${rescue.danger}/5\n  推荐装备：${rescue.equipment.join('、')}\n  推荐技能：${rescue.skills.join('、')}\n  最低职称：${rescue.minRank}\n`
            ).join(''),
            
            `\n## 技巧\n\n`,
            `1. **初期发展**：\n`,
            `   - 多参加消防演习积累经验和技能\n`,
            `   - 先学习基础灭火和火灾侦察技能\n`,
            `   - 优先购买基础消防服和防毒面具\n\n`,
            
            `2. **任务选择**：\n`,
            `   - 根据自身职称和装备选择合适难度的任务\n`,
            `   - 确保体力和生命值充足再执行任务\n`,
            `   - 不同火灾类型选择不同的灭火方案\n\n`,
            
            `3. **装备搭配**：\n`,
            `   - 普通火灾：基础消防服 + 消防水带\n`,
            `   - 化学火灾：高级防化服 + 空气呼吸器\n`,
            `   - 高层火灾：基础消防服 + 登高器械\n`,
            `   - 搜救任务：热成像仪 + 空气呼吸器\n\n`,
            
            `4. **职称晋升**：\n`,
            `   - 每个职称都有不同的任务、训练和技能要求\n`,
            `   - 高职称可以解锁更多高级装备和技能\n`,
            `   - 晋升后工资和权限会提高\n\n`,
            
            `5. **消防站升级**：\n`,
            `   - 升级消防站可以增加人员容量和可用车辆\n`,
            `   - 高等级消防站可以配备更多高级装备\n`,
            `   - 响应时间会随着等级提升而减少\n\n`,
            
            `6. **经验积累**：\n`,
            `   - 成功的任务和救援会带来经验和金钱奖励\n`,
            `   - 救援被困人员可以获得额外奖励\n`,
            `   - 出色表现有机会获得勋章和嘉奖\n\n`,
            
            `祝你的消防员生涯充满荣耀与成就！\n`
        ];
        
        fs.writeFileSync(guidePath, guideContent.join(''));
    }
    
    // 封禁方法
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