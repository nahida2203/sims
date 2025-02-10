import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from "../../../lib/puppeteer/puppeteer.js"
import {
    saveUserData,
    loadAllUsers,
    checkUserData,
    saveBanData,
} from '../function/function.js';
import Redis from 'ioredis';
const _path = process.cwd().replace(/\\/g, "/");
const redis = new Redis();
export class WorldStart extends plugin {
    constructor() {
        super({
            name: 'WorldStart',
            dsc: '异世界开始',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#开始异世界生活$', fnc: 'initializeWorldData' },
                { reg: '^#查看装备(\\s+\\S+)?', fnc: 'showEquipment' },
                { reg: '^#购买装备(\\s+\\S+)?', fnc: 'buyEquipment' },
                { reg: '^#使用技能(\\s+\\S+)?', fnc: 'useSkill' },
                { reg: '^#变更职业(\\s+\\S+)?', fnc: 'changeJob' },
                { reg: '^#探索世界$', fnc: 'exploreWorld' },
                { reg: '^#参加狩猎$', fnc: 'joinHunt' },
                { reg: '^#收集资源$', fnc: 'collectResources' },
                { reg: '^#升级技能.*$', fnc: 'upgradeSkill' },
                { reg: '^#查看任务$', fnc: 'showTasks' },
                { reg: '^#接取任务.*$', fnc: 'acceptTask' },
                { reg: '^#完成任务.*$', fnc: 'completeTask' },
                { reg: '^#查看好感度$', fnc: 'showAffection' },
                { reg: '^#约会(\\s+\\S+)?', fnc: 'goOnDate' },
                { reg: '^#治疗疾病$', fnc: 'treatDisease' },
                { reg: '^#购买食物(\\s+\\S+)?(\\s+\\S+)?', fnc: 'buyFood' },
                { reg: '^#食用食物(\\s+\\S+)?$', fnc: 'eatFood' },
                { reg: '^#查看属性$', fnc: 'showAttributes' },
                { reg: '^#学习魔法(\\s+\\S+)?', fnc: 'learnMagic' },
                { reg: '^#施展魔法(\\s+\\S+)?', fnc: 'castMagic' },
                { reg: '^#变身魔法少女$', fnc: 'transformToMagicalGirl' },
                { reg: '^#查看魔法装备(\\s+\\S+)?', fnc: 'showMagicEquipment' },
                { reg: '^#使用魔法装备(\\s+\\S+)?', fnc: 'useMagicEquipment' },
                { reg: '^#购买魔法装备(\\s+\\S+)?', fnc: 'buyMagicEquipment' },
                { reg: '^#参加魔法对决$', fnc: 'joinMagicBattle' },
                { reg: '^#采集魔法素材$', fnc: 'collectMagicMaterials' },
                { reg: '^#升级魔法(\\s+\\S+)?', fnc: 'upgradeMagic' },
                { reg: '^#强化魔法少女*$', fnc: 'strengthenMagicalGirl' },
                { reg: '^#治愈同伴(\\s+\\S+)?', fnc: 'healCompanion' },
                { reg: '^#修炼魔法(\\s+\\S+)?(\\s+\\S+)?$', fnc: 'practiceMagic' },
                { reg: '^#参加魔法仪式(\\s+\\S+)?(\\s+\\S+)?', fnc: 'joinMagicRitual' },
                { reg: '^#查看角色信息$', fnc: 'showCharacterInfo' },
                { reg: '^#学习新技能(\\s+\\S+)?', fnc: 'learnNewSkill' },
                { reg: '^#与角色互动(\\s+\\S+)?(\\s+\\S+)?(\\s+\\S+)?', fnc: 'interactWithCharacter' },
                { reg: '^#参加战斗(\\s+\\S+)?(\\s+\\S+)?', fnc: 'joinBattle' },
                { reg: '^#采集素材(\\s+\\S+)?', fnc: 'collectMaterials' },
                { reg: '^#提升属性(\\s+\\S+)?', fnc: 'upgradeAttributes' },
                { reg: '^#使用道具(\\s+\\S+)?', fnc: 'useItem' },
                { reg: '^#访问商店(\\s+\\S+)?(\\s+\\S+)?(\\s+\\S+)?', fnc: 'visitShop' },
                { reg: '^#修复装备(\\s+\\S+)?(\\s+\\S+)?', fnc: 'repairEquipment' },
                { reg: '^#学习新法术*$', fnc: 'learnNewSpell' },
                { reg: '^#使用法术*$', fnc: 'castSpell' },
                { reg: '^#参加宴会$', fnc: 'attendBanquet' },
                { reg: '^#收集回忆$', fnc: 'collectMemories' },
                { reg: '^#提升好感度*$', fnc: 'enhanceAffection' },
                { reg: '^#学习新舞蹈*$', fnc: 'learnNewDance' },
                { reg: '^#表演舞蹈(\\s+\\S+)?(\\s+\\S+)?', fnc: 'performDance' },
                { reg: '^#学习新元素(\\s+\\S+)?', fnc: 'learnNewElement' },
                { reg: '^#元素融合(\\s+\\S+)?', fnc: 'elementFusion' },
                { reg: '^#强化技能(\\s+\\S+)?', fnc: 'strengthenSkill' },
                { reg: '^#强化法术(\\s+\\S+)?', fnc: 'strengthenSpell' },
                { reg: '^#强化法术装备(\\s+\\S+)?', fnc: 'strengthenSpellEquipment' },
                { reg: '^#探索遗迹$', fnc: 'exploreRuins' },
            ],
        });
    }

    async initializeWorldData(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData) {
            e.reply("请先开始模拟人生");
            return;
        }
        // 心愿大陆出生地列表
        const birthplaces = [
            {
                name: "星辰城", 
                description: "繁华的魔法都市,这里有最先进的魔法科技",
                specialEffect: "魔法亲和+10",
                initialStats: { magic: 10, tech: 10 }
            },
            {
                name: "花海镇",
                description: "被无尽花海环绕的温馨小镇,空气中弥漫着花香",
                specialEffect: "治愈能力+10", 
                initialStats: { healing: 10, nature: 10 }
            },
            {
                name: "云顶学院",
                description: "培养魔法少女的顶级学府,这里有最优秀的导师",
                specialEffect: "学习能力+10",
                initialStats: { intelligence: 10, wisdom: 10 }
            },
            {
                name: "梦幻岛",
                description: "漂浮在空中的神秘岛屿,充满了梦幻的气息",
                specialEffect: "梦境亲和+10",
                initialStats: { dream: 10, spirit: 10 }
            },
            {
                name: "水晶谷",
                description: "遍布各色水晶的山谷,蕴含着强大的魔法能量",
                specialEffect: "魔力恢复+10",
                initialStats: { mana: 10, crystal: 10 }
            }
        ];
    
        // 随机选择出生地
        const birthplace = birthplaces[Math.floor(Math.random() * birthplaces.length)];
    
        // 初始化基础属性
        const baseStats = {
            生命值: 100,
            魔力值: 100, 
            体力值: 100,
            魅力值: 50,
            智慧值: 30,
            敏捷值: 25,
            幸运值: 20,
            梦想值: 50
        };
    
        // 初始化技能列表
        const initialSkills = [
            {
                name: "微笑治愈",
                level: 1,
                type: "治愈系",
                power: 5,
                description: "用温暖的笑容治愈他人的伤痛",
                exp: 0,
                nextLevelExp: 100
            },
            {
                name: "星光闪耀",
                level: 1, 
                type: "光系",
                power: 3,
                description: "召唤温暖的星光照亮黑暗",
                exp: 0,
                nextLevelExp: 100
            }
        ];
    
        // 初始化背包物品
        const initialInventory = {
            食物: {
                "魔法饼干": 5,
                "能量果汁": 3,
                "治愈蛋糕": 2
            },
            药水: {
                "初级治愈药水": 3,
                "魔力恢复药水": 3
            },
            材料: [],
            金币: 500,
            水晶: 5
        };
    
        // 初始化收藏品
        const initialCollections = {
            服装: ["普通少女服"],
            饰品: ["幸运星星发卡"],
            家具: ["基础魔法床"],
            宠物: [],
            徽章: ["新手冒险者"]
        };
    
        // 初始化任务日志
        const initialQuests = [
            {
                id: 1,
                name: "初次冒险",
                description: "探索出生地区域",
                status: "进行中",
                rewards: {
                    exp: 50,
                    gold: 100,
                    items: ["初级魔法书"]
                }
            }
        ];
    
        // 创建完整的玩家数据
        const worldData = {
            ...userData,
            世界: "心愿大陆",
            出生地: birthplace.name,
            职业: "异世界冒险者",
            等级: 1,
            经验值: 0,
            升级所需经验: 100,
            魔法亲和: 10,
            友情值: 0,
            梦想能量: 100,
            装备: {
                武器: "基础魔法杖",
                防具: "见习魔女服",
                饰品: "幸运星星发卡"
            },
            技能: initialSkills,
            属性: {
                ...baseStats,
                ...birthplace.initialStats
            },
            背包: initialInventory,
            收藏品: initialCollections,
            任务: initialQuests,
            状态: {
                当前位置: birthplace.name,
                心情: "充满希望",
                增益效果: [],
                减益效果: []
            },
            关系: {
                好友: [],
                导师: [],
                对手: []
            },
            成就: [],
            每日任务: [],
            梦想卡片: [],
            魔法宠物: [],
            家园装饰: {
                家具: [],
                墙纸: "粉色星星壁纸",
                地板: "柔软地毯"
            },
            商店访问次数: 0,
            今日完成任务: 0,
            连续签到: 0,
            上次签到时间: null,
            特殊状态: [],
            称号: ["超级无敌光头强"],
            成长记录: []
        };
    
        // 添加出生地特殊加成
        worldData.属性[birthplace.specialEffect.split("+")[0]] += parseInt(birthplace.specialEffect.split("+")[1]);
    
        // 记录初始化时间
        worldData.创建时间 = new Date().toLocaleString();
        
        // 添加第一条成长记录
        worldData.成长记录.push({
            时间: new Date().toLocaleString(),
            事件: `降临在${birthplace.name}`,
            描述: "开启了新的冒险之旅"
        });
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成欢迎信息
        const welcomeMsg = [
            `✨✨✨ 欢迎来到心愿大陆 ✨✨✨\n`,
            `🌟 你降生在【${birthplace.name}】`,
            `📝 ${birthplace.description}`,
            `🎁 获得出生地特殊加成：${birthplace.specialEffect}\n`,
            `〓 初始属性 〓`,
            `❤️ 生命值：${worldData.属性.生命值}`,
            `✨ 魔力值：${worldData.属性.魔力值}`,
            `⭐ 魔法亲和：${worldData.魔法亲和}\n`,
            `〓 初始装备 〓`,
            `🔮 武器：${worldData.装备.武器}`,
            `👗 防具：${worldData.装备.防具}`,
            `🎀 饰品：${worldData.装备.饰品}\n`,
            `〓 初始技能 〓`,
            ...worldData.技能.map(skill => `✨ ${skill.name}：${skill.description}`),
            `\n〓 异世界新手礼包 〓`,
            `💰 金币：${worldData.背包.金币}`,
            `💎 水晶：${worldData.背包.水晶}`,
            `🍪 魔法饼干：${worldData.背包.食物.魔法饼干}个`,
            `🧪 治愈药水：${worldData.背包.药水.初级治愈药水}瓶\n`,
            `🎯 第一个任务：${worldData.任务[0].name}`,
            `📝 任务描述：${worldData.任务[0].description}\n`,
            `💡 游戏提示：输入 #查看属性 可以查看详细信息`,
            `✨ 愿你在心愿大陆度过愉快的冒险时光 ✨`
        ].join('\n');
    
        e.reply(welcomeMsg);
    }
    async showEquipment(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 获取装备详细信息
        const equipmentDetails = {
            武器: {
                基础魔法杖: {
                    攻击力: 10,
                    魔法加成: 5,
                    品质: "普通",
                    耐久度: 100,
                    特效: "无",
                    描述: "适合初学者使用的魔法杖"
                },
                星光法杖: {
                    攻击力: 20,
                    魔法加成: 15,
                    品质: "精良",
                    耐久度: 150,
                    特效: "星光闪耀",
                    描述: "能引导星光之力的法杖"
                }
                // ... 更多武器
            },
            防具: {
                见习魔女服: {
                    防御力: 10,
                    魔法抗性: 5,
                    品质: "普通",
                    耐久度: 100,
                    特效: "无",
                    描述: "朴素但实用的魔女服装"
                },
                星辰长裙: {
                    防御力: 20,
                    魔法抗性: 15,
                    品质: "精良",
                    耐久度: 150,
                    特效: "星辰护佑",
                    描述: "点缀着星辰的优雅长裙"
                }
                // ... 更多防具
            },
            饰品: {
                幸运星星发卡: {
                    幸运加成: 5,
                    魅力加成: 3,
                    品质: "普通",
                    耐久度: 100,
                    特效: "无",
                    描述: "可爱的星星造型发卡"
                },
                月光石项链: {
                    幸运加成: 10,
                    魅力加成: 8,
                    品质: "精良",
                    耐久度: 150,
                    特效: "月光祝福",
                    描述: "散发柔和月光的神秘项链"
                }
                // ... 更多饰品
            }
        };
    
        // 获取当前装备的详细信息
        const currentWeapon = equipmentDetails.武器[worldData.装备.武器] || null;
        const currentArmor = equipmentDetails.防具[worldData.装备.防具] || null;
        const currentAccessory = equipmentDetails.饰品[worldData.装备.饰品] || null;
    
        // 计算装备总属性
        const totalStats = {
            攻击力: (currentWeapon?.攻击力 || 0),
            防御力: (currentArmor?.防御力 || 0),
            魔法加成: (currentWeapon?.魔法加成 || 0) + (currentAccessory?.魔法加成 || 0),
            魔法抗性: (currentArmor?.魔法抗性 || 0),
            幸运加成: (currentAccessory?.幸运加成 || 0),
            魅力加成: (currentAccessory?.魅力加成 || 0)
        };
    
        // 检查装备特效
        const activeEffects = [];
        if (currentWeapon?.特效 !== "无") activeEffects.push(currentWeapon?.特效);
        if (currentArmor?.特效 !== "无") activeEffects.push(currentArmor?.特效);
        if (currentAccessory?.特效 !== "无") activeEffects.push(currentAccessory?.特效);
    
        // 检查装备耐久度状态
        const getDurabilityStatus = (durability) => {
            if (durability > 80) return "【完好】";
            if (durability > 50) return "【轻微磨损】";
            if (durability > 30) return "【明显受损】";
            if (durability > 10) return "【严重损坏】";
            return "【即将损坏】";
        };
    
        // 生成装备信息展示
        const equipmentMsg = [
            `〓 装备信息一览 〓\n`,
            `🔮 武器：${worldData.装备.武器}`,
            currentWeapon ? [
                `  ├─ 攻击力：${currentWeapon.攻击力}`,
                `  ├─ 魔法加成：${currentWeapon.魔法加成}`,
                `  ├─ 品质：${currentWeapon.品质}`,
                `  ├─ 耐久度：${currentWeapon.耐久度} ${getDurabilityStatus(currentWeapon.耐久度)}`,
                `  ├─ 特效：${currentWeapon.特效}`,
                `  └─ 描述：${currentWeapon.描述}`
            ].join('\n') : "  └─ 未装备武器",
            
            `\n👗 防具：${worldData.装备.防具}`,
            currentArmor ? [
                `  ├─ 防御力：${currentArmor.防御力}`,
                `  ├─ 魔法抗性：${currentArmor.魔法抗性}`,
                `  ├─ 品质：${currentArmor.品质}`,
                `  ├─ 耐久度：${currentArmor.耐久度} ${getDurabilityStatus(currentArmor.耐久度)}`,
                `  ├─ 特效：${currentArmor.特效}`,
                `  └─ 描述：${currentArmor.描述}`
            ].join('\n') : "  └─ 未装备防具",
            
            `\n🎀 饰品：${worldData.装备.饰品}`,
            currentAccessory ? [
                `  ├─ 幸运加成：${currentAccessory.幸运加成}`,
                `  ├─ 魅力加成：${currentAccessory.魅力加成}`,
                `  ├─ 品质：${currentAccessory.品质}`,
                `  ├─ 耐久度：${currentAccessory.耐久度} ${getDurabilityStatus(currentAccessory.耐久度)}`,
                `  ├─ 特效：${currentAccessory.特效}`,
                `  └─ 描述：${currentAccessory.描述}`
            ].join('\n') : "  └─ 未装备饰品",
            
            `\n〓 装备属性总和 〓`,
            `⚔️ 攻击力：${totalStats.攻击力}`,
            `🛡️ 防御力：${totalStats.防御力}`,
            `✨ 魔法加成：${totalStats.魔法加成}`,
            `🌟 魔法抗性：${totalStats.魔法抗性}`,
            `🍀 幸运加成：${totalStats.幸运加成}`,
            `💝 魅力加成：${totalStats.魅力加成}`,
            
            activeEffects.length > 0 ? `\n✨ 激活特效：${activeEffects.join("、")}` : "",
            
            `\n💡 提示：`,
            `  装备耐久度过低时会降低属性效果`,
            `  可以使用修复工具或找铁匠修复装备`
        ].join('\n');
    
        e.reply(equipmentMsg);
    }

    async buyEquipment(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 检查是否在商店位置
        if (worldData.状态.当前位置 !== "魔法商店" && worldData.状态.当前位置 !== "装备店") {
            e.reply("需要先到魔法商店或装备店才能购买装备哦~");
            return;
        }
    
        // 商店装备列表
        const shopEquipment = {
            武器: [
                {
                    id: 1,
                    名称: "星光法杖",
                    类型: "武器",
                    价格: 1000,
                    等级要求: 5,
                    属性: {
                        攻击力: 20,
                        魔法加成: 15
                    },
                    品质: "精良",
                    耐久度: 150,
                    特效: "星光闪耀",
                    描述: "能引导星光之力的法杖"
                },
                {
                    id: 2,
                    名称: "月光魔杖",
                    类型: "武器",
                    价格: 1500,
                    等级要求: 8,
                    属性: {
                        攻击力: 25,
                        魔法加成: 20
                    },
                    品质: "稀有",
                    耐久度: 200,
                    特效: "月光祝福",
                    描述: "蕴含月之力量的魔杖"
                }
            ],
            防具: [
                {
                    id: 3,
                    名称: "星辰长裙",
                    类型: "防具",
                    价格: 800,
                    等级要求: 5,
                    属性: {
                        防御力: 20,
                        魔法抗性: 15
                    },
                    品质: "精良",
                    耐久度: 150,
                    特效: "星辰护佑",
                    描述: "点缀着星辰的优雅长裙"
                },
                {
                    id: 4,
                    名称: "花语纱裙",
                    类型: "防具",
                    价格: 1200,
                    等级要求: 8,
                    属性: {
                        防御力: 25,
                        魔法抗性: 20
                    },
                    品质: "稀有",
                    耐久度: 200,
                    特效: "花之庇护",
                    描述: "由魔法花瓣编织而成的纱裙"
                }
            ],
            饰品: [
                {
                    id: 5,
                    名称: "月光石项链",
                    类型: "饰品",
                    价格: 500,
                    等级要求: 5,
                    属性: {
                        幸运加成: 10,
                        魅力加成: 8
                    },
                    品质: "精良",
                    耐久度: 150,
                    特效: "月光祝福",
                    描述: "散发柔和月光的神秘项链"
                },
                {
                    id: 6,
                    名称: "星星手镯",
                    类型: "饰品",
                    价格: 800,
                    等级要求: 8,
                    属性: {
                        幸运加成: 15,
                        魅力加成: 12
                    },
                    品质: "稀有",
                    耐久度: 200,
                    特效: "星之眷顾",
                    描述: "镶嵌着星星碎片的手镯"
                }
            ]
        };
    
        // 获取购买指令中的装备ID
        const equipmentId = parseInt(e.msg.replace('#购买装备', '').trim());
        
        // 查找要购买的装备
        let targetEquipment = null;
        for (const type in shopEquipment) {
            const found = shopEquipment[type].find(item => item.id === equipmentId);
            if (found) {
                targetEquipment = found;
                break;
            }
        }
    
        if (!targetEquipment) {
            // 如果未指定ID,显示商店列表
            let shopMsg = [
                "✨ 欢迎光临魔法装备店 ✨\n",
                "〓 武器列表 〓"
            ];
            
            shopEquipment.武器.forEach(weapon => {
                shopMsg.push(
                    `${weapon.id}. ${weapon.名称} - ${weapon.价格}金币`,
                    `   品质:${weapon.品质} 等级要求:${weapon.等级要求}`,
                    `   攻击力+${weapon.属性.攻击力} 魔法加成+${weapon.属性.魔法加成}`,
                    `   特效:${weapon.特效}`,
                    `   描述:${weapon.描述}\n`
                );
            });
    
            shopMsg.push("〓 防具列表 〓");
            shopEquipment.防具.forEach(armor => {
                shopMsg.push(
                    `${armor.id}. ${armor.名称} - ${armor.价格}金币`,
                    `   品质:${armor.品质} 等级要求:${armor.等级要求}`,
                    `   防御力+${armor.属性.防御力} 魔法抗性+${armor.属性.魔法抗性}`,
                    `   特效:${armor.特效}`,
                    `   描述:${armor.描述}\n`
                );
            });
    
            shopMsg.push("〓 饰品列表 〓");
            shopEquipment.饰品.forEach(accessory => {
                shopMsg.push(
                    `${accessory.id}. ${accessory.名称} - ${accessory.价格}金币`,
                    `   品质:${accessory.品质} 等级要求:${accessory.等级要求}`,
                    `   幸运+${accessory.属性.幸运加成} 魅力+${accessory.属性.魅力加成}`,
                    `   特效:${accessory.特效}`,
                    `   描述:${accessory.描述}\n`
                );
            });
    
            shopMsg.push(
                "💡 购买提示：",
                "输入 #购买装备+编号 购买对应装备",
                "例如：#购买装备1"
            );
    
            e.reply(shopMsg.join('\n'));
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < targetEquipment.等级要求) {
            e.reply(`你的等级不足,无法装备${targetEquipment.名称},需要等级${targetEquipment.等级要求}级`);
            return;
        }
    
        // 检查金币是否足够
        if (worldData.背包.金币 < targetEquipment.价格) {
            e.reply(`你的金币不足,购买${targetEquipment.名称}需要${targetEquipment.价格}金币`);
            return;
        }
    
        // 扣除金币
        worldData.背包.金币 -= targetEquipment.价格;
    
        // 更新装备
        worldData.装备[targetEquipment.类型] = targetEquipment.名称;
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成购买成功消息
        const successMsg = [
            `🎊 购买成功 🎊`,
            `获得 ${targetEquipment.名称}`,
            `品质: ${targetEquipment.品质}`,
            `特效: ${targetEquipment.特效}`,
            `描述: ${targetEquipment.描述}`,
            `\n💰 剩余金币: ${worldData.背包.金币}`,
            `\n💡 提示: 可以使用 #查看装备 查看当前装备详情`
        ].join('\n');
    
        e.reply(successMsg);
    }

    async useSkill(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 技能冷却检查系统
        const skillCooldowns = await redis.get(`cooldowns:${userId}`);
        const cooldowns = skillCooldowns ? JSON.parse(skillCooldowns) : {};
        const now = Date.now();
    
        // 技能消耗设定
        const skillCosts = {
            "微笑治愈": { 魔力: 20, 体力: 10 },
            "星光闪耀": { 魔力: 30, 体力: 15 },
            "花语治疗": { 魔力: 40, 体力: 20 },
            "月光祝福": { 魔力: 50, 体力: 25 }
        };
    
        // 技能效果设定
        const skillEffects = {
            "微笑治愈": {
                治疗量: 30,
                持续时间: 0,
                冷却时间: 60000, // 1分钟
                经验获得: 10,
                描述: "用温暖的笑容治愈目标"
            },
            "星光闪耀": {
                伤害量: 40,
                持续时间: 0,
                冷却时间: 90000, // 1.5分钟
                经验获得: 15,
                描述: "召唤星光造成伤害"
            },
            "花语治疗": {
                治疗量: 50,
                持续时间: 10000, // 10秒持续治疗
                冷却时间: 120000, // 2分钟
                经验获得: 20,
                描述: "释放治愈之花持续治疗"
            },
            "月光祝福": {
                增益效果: {
                    魔法加成: 20,
                    防御加成: 15
                },
                持续时间: 30000, // 30秒
                冷却时间: 180000, // 3分钟
                经验获得: 25,
                描述: "获得月光的庇护"
            }
        };
    
        // 获取使用的技能名称
        const skillName = e.msg.replace('#使用技能', '').trim();
    
        // 检查技能是否存在
        if (!worldData.技能.find(skill => skill.name === skillName)) {
            let skillListMsg = [
                "〓 当前已掌握的技能 〓\n"
            ];
            worldData.技能.forEach(skill => {
                skillListMsg.push(
                    `${skill.name} - 等级${skill.level}`,
                    `  类型: ${skill.type}`,
                    `  威力: ${skill.power}`,
                    `  描述: ${skill.description}\n`
                );
            });
            skillListMsg.push("请输入正确的技能名称使用技能");
            e.reply(skillListMsg.join('\n'));
            return;
        }
    
        // 检查技能冷却
        if (cooldowns[skillName] && now < cooldowns[skillName]) {
            const remainingTime = Math.ceil((cooldowns[skillName] - now) / 1000);
            e.reply(`技能还在冷却中,剩余${remainingTime}秒`);
            return;
        }
    
        // 检查魔力和体力是否足够
        const cost = skillCosts[skillName];
        if (worldData.属性.魔力值 < cost.魔力 || worldData.属性.体力值 < cost.体力) {
            e.reply(`魔力或体力不足,无法使用${skillName}\n需要:魔力${cost.魔力} 体力${cost.体力}\n当前:魔力${worldData.属性.魔力值} 体力${worldData.属性.体力值}`);
            return;
        }
    
        // 扣除魔力和体力
        worldData.属性.魔力值 -= cost.魔力;
        worldData.属性.体力值 -= cost.体力;
    
        // 获取技能效果
        const effect = skillEffects[skillName];
    
        // 应用技能效果
        let effectMsg = [`✨ 使用技能【${skillName}】`];
        
        if (effect.治疗量) {
            worldData.属性.生命值 = Math.min(100, worldData.属性.生命值 + effect.治疗量);
            effectMsg.push(`🌟 恢复生命值${effect.治疗量}`);
        }
        
        if (effect.伤害量) {
            effectMsg.push(`⚔️ 造成伤害${effect.伤害量}`);
        }
        
        if (effect.增益效果) {
            for (const [buff, value] of Object.entries(effect.增益效果)) {
                effectMsg.push(`💫 获得${buff}+${value}`);
            }
        }
    
        // 添加技能冷却
        cooldowns[skillName] = now + effect.冷却时间;
        await redis.set(`cooldowns:${userId}`, JSON.stringify(cooldowns));
    
        // 获得经验
        worldData.经验值 += effect.经验获得;
    
        // 检查升级
        if (worldData.经验值 >= worldData.升级所需经验) {
            worldData.等级 += 1;
            worldData.经验值 -= worldData.升级所需经验;
            worldData.升级所需经验 = Math.floor(worldData.升级所需经验 * 1.2);
            effectMsg.push(`\n🎉 恭喜升级！当前等级:${worldData.等级}`);
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 添加状态信息
        effectMsg.push(
            `\n〓 当前状态 〓`,
            `❤️ 生命值:${worldData.属性.生命值}`,
            `✨ 魔力值:${worldData.属性.魔力值}`,
            `💪 体力值:${worldData.属性.体力值}`,
            `📈 经验值:${worldData.经验值}/${worldData.升级所需经验}`,
            `\n💡 技能冷却时间:${effect.冷却时间/1000}秒`
        );
    
        e.reply(effectMsg.join('\n'));
    }

    async changeJob(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 职业信息系统
        const jobSystem = {
            "见习魔法少女": {
                需求等级: 1,
                进阶职业: ["光明魔法少女", "暗影魔法少女", "自然魔法少女"],
                基础属性: {
                    攻击力: 10,
                    防御力: 10,
                    魔法力: 15,
                    敏捷度: 10
                },
                特殊技能: ["微笑治愈"],
                描述: "刚觉醒魔法力量的少女"
            },
            "光明魔法少女": {
                需求等级: 10,
                进阶职业: ["圣光巫女", "星辰魔导士"],
                基础属性: {
                    攻击力: 15,
                    防御力: 15,
                    魔法力: 25,
                    敏捷度: 15
                },
                特殊技能: ["圣光祝福", "星光闪耀"],
                职业要求: "见习魔法少女",
                描述: "掌握光明魔法的魔法少女"
            },
            "暗影魔法少女": {
                需求等级: 10,
                进阶职业: ["暗夜女王", "影舞者"],
                基础属性: {
                    攻击力: 20,
                    防御力: 10,
                    魔法力: 25,
                    敏捷度: 20
                },
                特殊技能: ["暗影突袭", "月光魅影"],
                职业要求: "见习魔法少女",
                描述: "操控暗影力量的魔法少女"
            },
            "自然魔法少女": {
                需求等级: 10,
                进阶职业: ["花语仙子", "森林守护者"],
                基础属性: {
                    攻击力: 15,
                    防御力: 20,
                    魔法力: 20,
                    敏捷度: 15
                },
                特殊技能: ["自然之愈", "花语治疗"],
                职业要求: "见习魔法少女",
                描述: "与自然之力共鸣的魔法少女"
            }
        };
    
        const newJob = e.msg.replace('#变更职业', '').trim();
    
        // 如果没有指定职业名称,显示职业列表
        if (!newJob) {
            let jobListMsg = [
                "〓 可选择的职业列表 〓\n"
            ];
            
            for (const [jobName, jobInfo] of Object.entries(jobSystem)) {
                if (!jobInfo.职业要求 || jobInfo.职业要求 === worldData.职业) {
                    jobListMsg.push(
                        `✦ ${jobName}`,
                        `  等级要求: ${jobInfo.需求等级}级`,
                        `  职业特点:`,
                        `    攻击力+${jobInfo.基础属性.攻击力}`,
                        `    防御力+${jobInfo.基础属性.防御力}`,
                        `    魔法力+${jobInfo.基础属性.魔法力}`,
                        `    敏捷度+${jobInfo.基础属性.敏捷度}`,
                        `  特殊技能: ${jobInfo.特殊技能.join(', ')}`,
                        `  描述: ${jobInfo.描述}\n`
                    );
                }
            }
            
            jobListMsg.push(
                "💡 变更职业指令：#变更职业+职业名称",
                "例如：#变更职业光明魔法少女"
            );
            
            e.reply(jobListMsg.join('\n'));
            return;
        }
    
        // 检查职业是否存在
        if (!jobSystem[newJob]) {
            e.reply("该职业不存在,请检查职业名称是否正确。");
            return;
        }
    
        // 检查职业要求
        const jobInfo = jobSystem[newJob];
        if (jobInfo.职业要求 && jobInfo.职业要求 !== worldData.职业) {
            e.reply(`变更为${newJob}需要先成为${jobInfo.职业要求}`);
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < jobInfo.需求等级) {
            e.reply(`等级不足,变更为${newJob}需要达到${jobInfo.需求等级}级`);
            return;
        }
    
        // 保存旧职业数据用于对比
        const oldJob = worldData.职业;
        const oldJobInfo = jobSystem[oldJob];
    
        // 更新职业和属性
        worldData.职业 = newJob;
        
        // 移除旧职业属性加成
        if (oldJobInfo) {
            for (const [stat, value] of Object.entries(oldJobInfo.基础属性)) {
                worldData.属性[stat] -= value;
            }
        }
        
        // 添加新职业属性加成
        for (const [stat, value] of Object.entries(jobInfo.基础属性)) {
            worldData.属性[stat] = (worldData.属性[stat] || 0) + value;
        }
    
        // 学习新职业特殊技能
        jobInfo.特殊技能.forEach(skillName => {
            if (!worldData.技能.find(skill => skill.name === skillName)) {
                worldData.技能.push({
                    name: skillName,
                    level: 1,
                    exp: 0,
                    nextLevelExp: 100
                });
            }
        });
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成变更成功消息
        const successMsg = [
            `🌟 职业变更成功 🌟`,
            `从 ${oldJob} 晋升为 ${newJob}`,
            `\n获得属性加成:`,
            `⚔️ 攻击力+${jobInfo.基础属性.攻击力}`,
            `🛡️ 防御力+${jobInfo.基础属性.防御力}`,
            `✨ 魔法力+${jobInfo.基础属性.魔法力}`,
            `💨 敏捷度+${jobInfo.基础属性.敏捷度}`,
            `\n习得技能:`,
            ...jobInfo.特殊技能.map(skill => `✦ ${skill}`),
            `\n当前属性:`,
            `❤️ 生命值:${worldData.属性.生命值}`,
            `✨ 魔力值:${worldData.属性.魔力值}`,
            `💪 体力值:${worldData.属性.体力值}`,
            `\n💡 可以使用 #查看属性 查看详细信息`
        ].join('\n');
    
        e.reply(successMsg);
    }

    async exploreWorld(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 检查探索体力
        if (worldData.属性.体力值 < 20) {
            e.reply("体力不足,无法继续探索。请休息后再试!");
            return;
        }
    
        // 地图系统
        const worldMap = {
            "星辰城": {
                描述: "繁华的魔法都市",
                探索难度: 1,
                可能遇到的事件: ["购物", "接任务", "遇到友好路人"],
                可获得材料: ["魔法水晶", "星光碎片"],
                特殊地点: ["魔法商店", "铁匠铺", "占卜屋"],
                连接区域: ["花海镇", "水晶谷"]
            },
            "花海镇": {
                描述: "被花海环绕的温馨小镇",
                探索难度: 2,
                可能遇到的事件: ["采集花朵", "帮助村民", "遇到小动物"],
                可获得材料: ["魔法花瓣", "治愈草药"],
                特殊地点: ["花店", "医疗所", "糕点屋"],
                连接区域: ["星辰城", "梦幻森林"]
            },
            "梦幻森林": {
                描述: "充满神秘色彩的魔法森林",
                探索难度: 3,
                可能遇到的事件: ["遇到精灵", "发现宝箱", "遭遇魔物"],
                可获得材料: ["魔法木材", "精灵之尘"],
                特殊地点: ["精灵泉", "古树遗迹", "蘑菇小屋"],
                连接区域: ["花海镇", "月光湖"]
            },
            "月光湖": {
                描述: "被月光祝福的神秘湖泊",
                探索难度: 4,
                可能遇到的事件: ["月光祝福", "钓鱼", "遇到水精灵"],
                可获得材料: ["月光精华", "魔法鱼"],
                特殊地点: ["许愿池", "水晶洞穴", "月亮神殿"],
                连接区域: ["梦幻森林", "星光之巅"]
            },
            "星光之巅": {
                描述: "最接近星空的神圣之地",
                探索难度: 5,
                可能遇到的事件: ["星光洗礼", "遇到天使", "找到稀有宝物"],
                可获得材料: ["星辰碎片", "天使羽毛"],
                特殊地点: ["星空祭坛", "预言之厅", "星辰图书馆"],
                连接区域: ["月光湖"]
            }
        };
    
        // 获取当前位置信息
        const currentLocation = worldData.状态.当前位置;
        const locationInfo = worldMap[currentLocation];
    
        // 随机事件系统
        const generateEvent = () => {
            const eventTypes = {
                普通: {
                    概率: 0.5,
                    事件: locationInfo.可能遇到的事件
                },
                特殊: {
                    概率: 0.3,
                    事件: ["发现隐藏宝箱", "遇到神秘商人", "触发隐藏任务"]
                },
                稀有: {
                    概率: 0.15,
                    事件: ["遇到传说中的生物", "发现远古遗迹", "获得稀有道具"]
                },
                传说: {
                    概率: 0.05,
                    事件: ["女神的祝福", "觉醒新能力", "获得神器碎片"]
                }
            };
    
            const random = Math.random();
            let eventType;
            let accumulatedProb = 0;
    
            for (const [type, info] of Object.entries(eventTypes)) {
                accumulatedProb += info.概率;
                if (random <= accumulatedProb) {
                    eventType = type;
                    break;
                }
            }
    
            const possibleEvents = eventTypes[eventType].事件;
            return {
                类型: eventType,
                内容: possibleEvents[Math.floor(Math.random() * possibleEvents.length)]
            };
        };
    
        // 材料获取系统
        const getMaterials = () => {
            const materials = locationInfo.可获得材料;
            const amount = Math.floor(Math.random() * 3) + 1;
            const material = materials[Math.floor(Math.random() * materials.length)];
            return {
                名称: material,
                数量: amount
            };
        };
    
        // 生成探索结果
        const event = generateEvent();
        const material = getMaterials();
    
        // 计算获得的经验和金币
        const expGained = Math.floor((Math.random() * 20 + 10) * locationInfo.探索难度);
        const goldGained = Math.floor((Math.random() * 30 + 20) * locationInfo.探索难度);
    
        // 更新玩家数据
        worldData.属性.体力值 -= 20;
        worldData.经验值 += expGained;
        worldData.背包.金币 += goldGained;
    
        // 添加获得的材料
        if (!worldData.背包.材料[material.名称]) {
            worldData.背包.材料[material.名称] = 0;
        }
        worldData.背包.材料[material.名称] += material.数量;
    
        // 检查升级
        if (worldData.经验值 >= worldData.升级所需经验) {
            worldData.等级 += 1;
            worldData.经验值 -= worldData.升级所需经验;
            worldData.升级所需经验 = Math.floor(worldData.升级所需经验 * 1.2);
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成探索报告
        const exploreMsg = [
            `〓 探索报告 〓\n`,
            `📍 当前位置：${currentLocation}`,
            `${locationInfo.描述}\n`,
            `✨ 探索过程中...\n`,
            `遭遇【${event.类型}】事件：${event.内容}`,
            `获得材料：${material.名称} x${material.数量}`,
            `获得经验：${expGained}`,
            `获得金币：${goldGained}\n`,
            `〓 当前状态 〓`,
            `❤️ 生命值：${worldData.属性.生命值}`,
            `✨ 魔力值：${worldData.属性.魔力值}`,
            `💪 体力值：${worldData.属性.体力值}`,
            `📈 经验值：${worldData.经验值}/${worldData.升级所需经验}`,
            `💰 金币：${worldData.背包.金币}\n`,
            `💡 可以前往的地区：${locationInfo.连接区域.join('、')}`,
            `💡 当前地区特殊地点：${locationInfo.特殊地点.join('、')}`
        ].join('\n');
    
        e.reply(exploreMsg);
    }

    async joinHunt(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 检查体力和生命值
        if (worldData.属性.体力值 < 30) {
            e.reply("体力不足,无法参加狩猎。请休息后再试!");
            return;
        }
    
        if (worldData.属性.生命值 < 50) {
            e.reply("生命值过低,不建议参加狩猎。请先治疗!");
            return;
        }
    
        // 狩猎地点系统
        const huntingGrounds = {
            "新手训练场": {
                等级要求: 1,
                难度: "简单",
                魔物: [
                    {名称: "史莱姆", 等级: 1, 掉落物: ["史莱姆核心"], 经验值: 20},
                    {名称: "小兔兔", 等级: 2, 掉落物: ["兔毛"], 经验值: 25}
                ]
            },
            "魔法森林": {
                等级要求: 5,
                难度: "普通",
                魔物: [
                    {名称: "花仙子", 等级: 5, 掉落物: ["花仙子之翼"], 经验值: 50},
                    {名称: "木精灵", 等级: 6, 掉落物: ["精灵之尘"], 经验值: 60}
                ]
            },
            "星光峡谷": {
                等级要求: 10,
                难度: "困难",
                魔物: [
                    {名称: "星光兽", 等级: 10, 掉落物: ["星光结晶"], 经验值: 100},
                    {名称: "月影狼", 等级: 12, 掉落物: ["月影之牙"], 经验值: 120}
                ]
            }
        };
    
        // 狩猎装备加成系统
        const calculateEquipmentBonus = () => {
            let bonus = {
                攻击力: 0,
                防御力: 0,
                命中率: 0
            };
    
            if (worldData.装备.武器 === "星光法杖") {
                bonus.攻击力 += 20;
                bonus.命中率 += 0.1;
            }
    
            if (worldData.装备.防具 === "星辰长裙") {
                bonus.防御力 += 15;
            }
    
            return bonus;
        };
    
        // 战斗系统
        const battle = (monster) => {
            const equipBonus = calculateEquipmentBonus();
            const playerAtk = worldData.属性.攻击力 + equipBonus.攻击力;
            const playerDef = worldData.属性.防御力 + equipBonus.防御力;
            const hitRate = 0.7 + equipBonus.命中率;
    
            let battleLog = [];
            let totalDamage = 0;
            let isVictory = false;
    
            // 模拟战斗回合
            for (let round = 1; round <= 5; round++) {
                if (Math.random() < hitRate) {
                    const damage = Math.max(1, playerAtk - monster.等级 * 2);
                    totalDamage += damage;
                    battleLog.push(`回合${round}: 对${monster.名称}造成${damage}点伤害`);
                } else {
                    battleLog.push(`回合${round}: 攻击未命中${monster.名称}`);
                }
    
                // 检查是否击败魔物
                if (totalDamage >= monster.等级 * 50) {
                    isVictory = true;
                    break;
                }
            }
    
            return {
                isVictory,
                battleLog,
                totalDamage
            };
        };
    
        // 根据玩家等级选择合适的狩猎地点
        let availableGrounds = [];
        for (const [name, info] of Object.entries(huntingGrounds)) {
            if (worldData.等级 >= info.等级要求) {
                availableGrounds.push({name, ...info});
            }
        }
    
        if (availableGrounds.length === 0) {
            e.reply("当前等级没有适合的狩猎地点。请先提升等级！");
            return;
        }
    
        // 随机选择一个狩猎地点
        const ground = availableGrounds[Math.floor(Math.random() * availableGrounds.length)];
        
        // 随机选择一个魔物
        const monster = ground.魔物[Math.floor(Math.random() * ground.魔物.length)];
    
        // 进行战斗
        const battleResult = battle(monster);
    
        // 计算奖励
        let rewards = {
            经验值: 0,
            金币: 0,
            掉落物: []
        };
    
        if (battleResult.isVictory) {
            rewards.经验值 = monster.经验值;
            rewards.金币 = Math.floor(monster.等级 * 10 * (1 + Math.random()));
            rewards.掉落物 = monster.掉落物;
    
            // 更新玩家数据
            worldData.经验值 += rewards.经验值;
            worldData.背包.金币 += rewards.金币;
            rewards.掉落物.forEach(item => {
                if (!worldData.背包.材料[item]) {
                    worldData.背包.材料[item] = 0;
                }
                worldData.背包.材料[item]++;
            });
        }
    
        // 消耗体力
        worldData.属性.体力值 -= 30;
    
        // 检查升级
        if (worldData.经验值 >= worldData.升级所需经验) {
            worldData.等级 += 1;
            worldData.经验值 -= worldData.升级所需经验;
            worldData.升级所需经验 = Math.floor(worldData.升级所需经验 * 1.2);
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成战斗报告
        const huntReport = [
            `〓 狩猎报告 〓\n`,
            `📍 狩猎地点：${ground.name}`,
            `🎯 遭遇魔物：${monster.名称} Lv.${monster.等级}\n`,
            `〓 战斗过程 〓`,
            ...battleResult.battleLog,
            `\n〓 战斗结果 〓`,
            battleResult.isVictory ? 
                [
                    `🎉 击败了${monster.名称}！`,
                    `获得经验：${rewards.经验值}`,
                    `获得金币：${rewards.金币}`,
                    `获得物品：${rewards.掉落物.join('、')}`
                ].join('\n') :
                `💔 战斗失败...\n`,
            `\n〓 当前状态 〓`,
            `❤️ 生命值：${worldData.属性.生命值}`,
            `💪 体力值：${worldData.属性.体力值}`,
            `📈 经验值：${worldData.经验值}/${worldData.升级所需经验}`,
            `💰 金币：${worldData.背包.金币}`
        ].join('\n');
    
        e.reply(huntReport);
    }

    async collectResources(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 检查体力
        if (worldData.属性.体力值 < 15) {
            e.reply("体力不足,无法继续收集资源。请休息后再试!");
            return;
        }
    
        // 采集地点系统
        const gatheringSpots = {
            "星辰城": {
                资源: {
                    "魔法水晶": { 概率: 0.4, 数量: [1, 3] },
                    "星光碎片": { 概率: 0.3, 数量: [1, 2] },
                    "魔力粉尘": { 概率: 0.3, 数量: [2, 4] }
                },
                特殊资源: {
                    "星辰精华": { 概率: 0.1, 数量: [1, 1] }
                }
            },
            "花海镇": {
                资源: {
                    "魔法花瓣": { 概率: 0.4, 数量: [2, 4] },
                    "治愈草药": { 概率: 0.3, 数量: [1, 3] },
                    "彩虹花粉": { 概率: 0.3, 数量: [1, 2] }
                },
                特殊资源: {
                    "生命精华": { 概率: 0.1, 数量: [1, 1] }
                }
            },
            "梦幻森林": {
                资源: {
                    "魔法树枝": { 概率: 0.4, 数量: [2, 4] },
                    "精灵之尘": { 概率: 0.3, 数量: [1, 2] },
                    "梦境碎片": { 概率: 0.3, 数量: [1, 3] }
                },
                特殊资源: {
                    "森林精华": { 概率: 0.1, 数量: [1, 1] }
                }
            }
        };
    
        // 采集加成系统
        const calculateGatheringBonus = () => {
            let bonus = {
                采集数量: 0,
                稀有度: 0,
                体力消耗: 0
            };
    
            // 装备加成
            if (worldData.装备.武器 === "采集法杖") {
                bonus.采集数量 += 1;
                bonus.体力消耗 -= 2;
            }
            if (worldData.装备.饰品 === "幸运草环") {
                bonus.稀有度 += 0.05;
            }
    
            // 技能加成
            const gatheringSkill = worldData.技能.find(skill => skill.name === "自然亲和");
            if (gatheringSkill) {
                bonus.采集数量 += Math.floor(gatheringSkill.level / 2);
                bonus.稀有度 += gatheringSkill.level * 0.01;
            }
    
            return bonus;
        };
    
        // 获取当前地点
        const currentLocation = worldData.状态.当前位置;
        if (!gatheringSpots[currentLocation]) {
            e.reply("当前位置无法采集资源。请前往可采集的地点！");
            return;
        }
    
        const spot = gatheringSpots[currentLocation];
        const bonus = calculateGatheringBonus();
    
        // 采集结果
        let collectedItems = [];
        let totalExp = 0;
    
        // 处理普通资源
        for (const [itemName, itemInfo] of Object.entries(spot.资源)) {
            if (Math.random() < itemInfo.概率) {
                const baseAmount = Math.floor(Math.random() * 
                    (itemInfo.数量[1] - itemInfo.数量[0] + 1)) + itemInfo.数量[0];
                const amount = baseAmount + bonus.采集数量;
    
                if (!worldData.背包.材料[itemName]) {
                    worldData.背包.材料[itemName] = 0;
                }
                worldData.背包.材料[itemName] += amount;
    
                collectedItems.push({
                    名称: itemName,
                    数量: amount
                });
    
                totalExp += amount * 10;
            }
        }
    
        // 处理特殊资源
        for (const [itemName, itemInfo] of Object.entries(spot.特殊资源)) {
            if (Math.random() < (itemInfo.概率 + bonus.稀有度)) {
                const amount = itemInfo.数量[0];
    
                if (!worldData.背包.材料[itemName]) {
                    worldData.背包.材料[itemName] = 0;
                }
                worldData.背包.材料[itemName] += amount;
    
                collectedItems.push({
                    名称: itemName,
                    数量: amount
                });
    
                totalExp += amount * 50;
            }
        }
    
        // 更新玩家数据
        worldData.属性.体力值 -= Math.max(5, 15 - bonus.体力消耗);
        worldData.经验值 += totalExp;
    
        // 检查升级
        if (worldData.经验值 >= worldData.升级所需经验) {
            worldData.等级 += 1;
            worldData.经验值 -= worldData.升级所需经验;
            worldData.升级所需经验 = Math.floor(worldData.升级所需经验 * 1.2);
        }
    
        // 随机事件系统
        const randomEvents = [
            { 描述: "发现了隐藏的采集点", 奖励: { 经验值: 50, 金币: 100 } },
            { 描述: "遇到了善良的精灵", 奖励: { 经验值: 30, 材料: "精灵祝福" } },
            { 描述: "触发了幸运采集", 效果: "双倍收获" }
        ];
    
        let eventMsg = "";
        if (Math.random() < 0.2) { // 20%概率触发随机事件
            const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
            eventMsg = `\n✨ 特殊事件: ${event.描述}`;
            
            if (event.奖励) {
                if (event.奖励.经验值) {
                    worldData.经验值 += event.奖励.经验值;
                    eventMsg += `\n获得额外经验: ${event.奖励.经验值}`;
                }
                if (event.奖励.金币) {
                    worldData.背包.金币 += event.奖励.金币;
                    eventMsg += `\n获得金币: ${event.奖励.金币}`;
                }
                if (event.奖励.材料) {
                    if (!worldData.背包.材料[event.奖励.材料]) {
                        worldData.背包.材料[event.奖励.材料] = 0;
                    }
                    worldData.背包.材料[event.奖励.材料]++;
                    eventMsg += `\n获得特殊材料: ${event.奖励.材料}`;
                }
            }
            
            if (event.效果 === "双倍收获") {
                collectedItems.forEach(item => {
                    worldData.背包.材料[item.名称] += item.数量;
                    item.数量 *= 2;
                });
                eventMsg += "\n所有采集物品数量翻倍！";
            }
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成采集报告
        const collectReport = [
            `〓 采集报告 〓\n`,
            `📍 采集地点：${currentLocation}`,
            `\n〓 采集成果 〓`,
            collectedItems.length > 0 ? 
                collectedItems.map(item => `✨ ${item.名称} x${item.数量}`).join('\n') :
                "这次什么都没有采集到...",
            `\n获得经验：${totalExp}`,
            eventMsg,
            `\n〓 当前状态 〓`,
            `💪 体力值：${worldData.属性.体力值}`,
            `📈 经验值：${worldData.经验值}/${worldData.升级所需经验}`,
            `\n💡 提示：采集需要消耗体力，注意及时补充！`
        ].join('\n');
    
        e.reply(collectReport);
    }

    async upgradeSkill(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 技能升级系统
        const skillUpgradeSystem = {
            // 治愈系技能
            "微笑治愈": {
                类型: "治愈",
                基础消耗: {
                    金币: 100,
                    魔法精华: 1
                },
                等级加成: {
                    治疗量: 10,
                    魔力消耗: -2
                },
                解锁技能: {
                    5: "群体治愈",
                    10: "完美治愈"
                }
            },
            // 攻击系技能
            "星光闪耀": {
                类型: "攻击",
                基础消耗: {
                    金币: 150,
                    星光碎片: 2
                },
                等级加成: {
                    伤害量: 15,
                    魔力消耗: -3
                },
                解锁技能: {
                    5: "星光爆发",
                    10: "星光风暴"
                }
            },
            // 辅助系技能
            "自然亲和": {
                类型: "辅助",
                基础消耗: {
                    金币: 120,
                    自然精华: 1
                },
                等级加成: {
                    效果持续: 5,
                    魔力消耗: -2
                },
                解锁技能: {
                    5: "自然祝福",
                    10: "自然之力"
                }
            }
        };
    
        // 获取要升级的技能名称
        const skillName = e.msg.replace('#升级技能', '').trim();
        
        // 检查技能是否存在
        if (!skillName) {
            let skillListMsg = [
                "〓 当前可升级技能列表 〓\n"
            ];
            
            worldData.技能.forEach(skill => {
                const upgradeInfo = skillUpgradeSystem[skill.name];
                if (upgradeInfo) {
                    skillListMsg.push(
                        `✦ ${skill.name} (${upgradeInfo.类型}) - 当前等级:${skill.level}`,
                        `  升级消耗:`,
                        `    金币: ${upgradeInfo.基础消耗.金币 * skill.level}`,
                        Object.entries(upgradeInfo.基础消耗)
                            .filter(([key]) => key !== "金币")
                            .map(([key, value]) => `    ${key}: ${value * skill.level}`)
                            .join('\n'),
                        `  升级获得:`,
                        Object.entries(upgradeInfo.等级加成)
                            .map(([key, value]) => `    ${key}+${value}`)
                            .join('\n'),
                        upgradeInfo.解锁技能[skill.level + 1] ? 
                            `  下一级解锁: ${upgradeInfo.解锁技能[skill.level + 1]}` : 
                            "",
                        ""
                    );
                }
            });
            
            skillListMsg.push(
                "💡 升级技能指令：#升级技能+技能名称",
                "例如：#升级技能微笑治愈"
            );
            
            e.reply(skillListMsg.join('\n'));
            return;
        }
    
        // 查找要升级的技能
        const skill = worldData.技能.find(s => s.name === skillName);
        if (!skill) {
            e.reply("你还没有学会这个技能！");
            return;
        }
    
        const upgradeInfo = skillUpgradeSystem[skillName];
        if (!upgradeInfo) {
            e.reply("该技能暂时无法升级！");
            return;
        }
    
        // 计算升级消耗
        const costs = {};
        for (const [item, amount] of Object.entries(upgradeInfo.基础消耗)) {
            costs[item] = amount * skill.level;
        }
    
        // 检查材料是否足够
        let insufficientItems = [];
        if (worldData.背包.金币 < costs.金币) {
            insufficientItems.push(`金币(差${costs.金币 - worldData.背包.金币})`);
        }
        
        for (const [item, amount] of Object.entries(costs)) {
            if (item === "金币") continue;
            if (!worldData.背包.材料[item] || worldData.背包.材料[item] < amount) {
                const current = worldData.背包.材料[item] || 0;
                insufficientItems.push(`${item}(差${amount - current})`);
            }
        }
    
        if (insufficientItems.length > 0) {
            e.reply(`升级所需材料不足：\n${insufficientItems.join('\n')}`);
            return;
        }
    
        // 扣除材料
        worldData.背包.金币 -= costs.金币;
        for (const [item, amount] of Object.entries(costs)) {
            if (item === "金币") continue;
            worldData.背包.材料[item] -= amount;
        }
    
        // 升级技能
        const oldLevel = skill.level;
        skill.level += 1;
    
        // 获得技能加成
        let upgradeEffects = [];
        for (const [effect, value] of Object.entries(upgradeInfo.等级加成)) {
            upgradeEffects.push(`${effect}+${value}`);
        }
    
        // 检查是否解锁新技能
        let newSkill = null;
        if (upgradeInfo.解锁技能[oldLevel]) {
            newSkill = upgradeInfo.解锁技能[oldLevel];
            worldData.技能.push({
                name: newSkill,
                level: 1,
                type: upgradeInfo.类型,
                exp: 0,
                nextLevelExp: 100
            });
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成升级报告
        const upgradeReport = [
            `〓 技能升级报告 〓\n`,
            `✨ ${skillName} 升级成功！`,
            `当前等级: ${skill.level}`,
            `\n获得加成:`,
            ...upgradeEffects.map(effect => `✦ ${effect}`),
            newSkill ? `\n🎉 解锁新技能: ${newSkill}` : "",
            `\n消耗材料:`,
            `💰 金币: ${costs.金币}`,
            ...Object.entries(costs)
                .filter(([item]) => item !== "金币")
                .map(([item, amount]) => `✨ ${item}: ${amount}`),
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `\n💡 提示: 技能等级越高,效果越好！`
        ].join('\n');
    
        e.reply(upgradeReport);
    }

    async showTasks(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 任务系统
        const taskSystem = {
            日常任务: {
                "收集材料": {
                    类型: "采集",
                    目标: { "魔法水晶": 5 },
                    奖励: {
                        金币: 100,
                        经验值: 50,
                        声望: 10
                    },
                    刷新时间: "每日",
                    难度: "简单"
                },
                "消灭魔物": {
                    类型: "战斗",
                    目标: { "史莱姆": 3 },
                    奖励: {
                        金币: 150,
                        经验值: 80,
                        声望: 15
                    },
                    刷新时间: "每日",
                    难度: "简单"
                }
            },
            主线任务: {
                "魔法觉醒": {
                    类型: "剧情",
                    阶段: ["觉醒仪式", "获得魔法", "掌握技能"],
                    奖励: {
                        金币: 1000,
                        经验值: 500,
                        装备: "见习魔法杖",
                        称号: "魔法觉醒者"
                    },
                    前置条件: "无",
                    难度: "普通"
                }
            },
            支线任务: {
                "寻找遗失的魔法书": {
                    类型: "探索",
                    地点: "魔法图书馆",
                    奖励: {
                        金币: 300,
                        经验值: 200,
                        道具: "神秘魔法书"
                    },
                    时限: "3天",
                    难度: "中等"
                }
            },
            隐藏任务: {
                "月光祭坛的秘密": {
                    类型: "特殊",
                    触发条件: "满月之夜访问月光湖",
                    奖励: {
                        金币: 2000,
                        经验值: 1000,
                        特殊道具: "月光宝石"
                    },
                    难度: "困难"
                }
            }
        };
    
        // 获取玩家当前任务进度
        const taskProgress = worldData.任务进度 || {};
    
        // 生成任务报告
        let taskReport = ["〓 任务面板 〓\n"];
    
        // 日常任务
        taskReport.push("== 日常任务 ==");
        for (const [taskName, taskInfo] of Object.entries(taskSystem.日常任务)) {
            const progress = taskProgress[taskName] || { 完成: false, 进度: {} };
            let progressText = "";
            
            if (taskInfo.目标) {
                for (const [target, required] of Object.entries(taskInfo.目标)) {
                    const current = progress.进度[target] || 0;
                    progressText += `\n  - ${target}: ${current}/${required}`;
                }
            }
    
            taskReport.push(
                `✦ ${taskName} [${progress.完成 ? "已完成" : "进行中"}]`,
                `  难度: ${taskInfo.难度}`,
                `  类型: ${taskInfo.类型}`,
                progressText,
                `  奖励:`,
                `    金币: ${taskInfo.奖励.金币}`,
                `    经验: ${taskInfo.奖励.经验值}`,
                `    声望: ${taskInfo.奖励.声望}`,
                ""
            );
        }
    
        // 主线任务
        taskReport.push("== 主线任务 ==");
        for (const [taskName, taskInfo] of Object.entries(taskSystem.主线任务)) {
            const progress = taskProgress[taskName] || { 当前阶段: 0, 完成: false };
            
            taskReport.push(
                `✦ ${taskName} [${progress.完成 ? "已完成" : "进行中"}]`,
                `  难度: ${taskInfo.难度}`,
                `  类型: ${taskInfo.类型}`,
                `  当前阶段: ${taskInfo.阶段[progress.当前阶段] || "未开始"}`,
                `  奖励:`,
                ...Object.entries(taskInfo.奖励).map(([type, value]) => `    ${type}: ${value}`),
                ""
            );
        }
    
        // 支线任务
        taskReport.push("== 支线任务 ==");
        for (const [taskName, taskInfo] of Object.entries(taskSystem.支线任务)) {
            const progress = taskProgress[taskName] || { 完成: false, 开始时间: null };
            
            let timeLimit = "";
            if (progress.开始时间) {
                const endTime = new Date(progress.开始时间 + parseInt(taskInfo.时限) * 24 * 60 * 60 * 1000);
                timeLimit = `剩余时间: ${Math.ceil((endTime - new Date()) / (24 * 60 * 60 * 1000))}天`;
            }
    
            taskReport.push(
                `✦ ${taskName} [${progress.完成 ? "已完成" : "进行中"}]`,
                `  难度: ${taskInfo.难度}`,
                `  类型: ${taskInfo.类型}`,
                `  地点: ${taskInfo.地点}`,
                timeLimit ? `  ${timeLimit}` : "",
                `  奖励:`,
                ...Object.entries(taskInfo.奖励).map(([type, value]) => `    ${type}: ${value}`),
                ""
            );
        }
    
        // 已发现的隐藏任务
        const discoveredHidden = Object.keys(taskProgress).filter(taskName => 
            taskSystem.隐藏任务[taskName] && taskProgress[taskName].发现);
        
        if (discoveredHidden.length > 0) {
            taskReport.push("== 特殊任务 ==");
            for (const taskName of discoveredHidden) {
                const taskInfo = taskSystem.隐藏任务[taskName];
                const progress = taskProgress[taskName];
                
                taskReport.push(
                    `✦ ${taskName} [${progress.完成 ? "已完成" : "进行中"}]`,
                    `  难度: ${taskInfo.难度}`,
                    `  类型: ${taskInfo.类型}`,
                    `  奖励: (神秘)`,
                    ""
                );
            }
        }
    
        taskReport.push(
            "💡 提示:",
            "1. 日常任务每天刷新",
            "2. 主线任务按顺序完成解锁剧情",
            "3. 支线任务有时间限制",
            "4. 特殊任务需要满足特定条件才能发现"
        );
    
        e.reply(taskReport.join('\n'));
    }

    async acceptTask(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 任务发布系统
        const taskBoard = {
            冒险者协会: {
                "初级任务": {
                    等级要求: 1,
                    声望要求: 0,
                    每日上限: 5,
                    任务池: [
                        {
                            名称: "收集药草",
                            类型: "采集",
                            目标: { "治愈草药": 5 },
                            奖励: {
                                金币: 100,
                                经验值: 50,
                                声望: 10
                            },
                            时限: 3600000, // 1小时
                            难度: "简单"
                        },
                        {
                            名称: "清理史莱姆",
                            类型: "战斗",
                            目标: { "史莱姆": 3 },
                            奖励: {
                                金币: 150,
                                经验值: 80,
                                声望: 15
                            },
                            时限: 7200000, // 2小时
                            难度: "简单"
                        }
                    ]
                },
                "中级任务": {
                    等级要求: 10,
                    声望要求: 100,
                    每日上限: 3,
                    任务池: [
                        {
                            名称: "调查遗迹",
                            类型: "探索",
                            目标: { "遗迹探索进度": 100 },
                            奖励: {
                                金币: 500,
                                经验值: 200,
                                声望: 30,
                                道具: "神秘卷轴"
                            },
                            时限: 14400000, // 4小时
                            难度: "中等"
                        }
                    ]
                }
            },
            魔法师协会: {
                "魔法研究": {
                    等级要求: 5,
                    魔法亲和要求: 20,
                    每日上限: 4,
                    任务池: [
                        {
                            名称: "收集魔法结晶",
                            类型: "采集",
                            目标: { "魔法水晶": 8 },
                            奖励: {
                                金币: 300,
                                经验值: 150,
                                魔法亲和: 5
                            },
                            时限: 10800000, // 3小时
                            难度: "中等"
                        }
                    ]
                }
            }
        };
    
        // 检查任务接取条件
        const checkTaskRequirements = (taskInfo) => {
            if (worldData.等级 < taskInfo.等级要求) {
                return `等级不足,需要达到${taskInfo.等级要求}级`;
            }
            if (taskInfo.声望要求 && worldData.声望 < taskInfo.声望要求) {
                return `声望不足,需要达到${taskInfo.声望要求}点`;
            }
            if (taskInfo.魔法亲和要求 && worldData.魔法亲和 < taskInfo.魔法亲和要求) {
                return `魔法亲和不足,需要达到${taskInfo.魔法亲和要求}点`;
            }
            return null;
        };
    
        // 获取任务名称
        const taskName = e.msg.replace('#接取任务', '').trim();
    
        // 如果没有指定任务名称,显示可接任务列表
        if (!taskName) {
            let availableTasks = ["〓 可接取的任务列表 〓\n"];
            
            for (const [guild, categories] of Object.entries(taskBoard)) {
                availableTasks.push(`== ${guild} ==`);
                
                for (const [category, info] of Object.entries(categories)) {
                    const requirementCheck = checkTaskRequirements(info);
                    
                    if (!requirementCheck) {
                        availableTasks.push(`【${category}】`);
                        info.任务池.forEach(task => {
                            const dailyCount = worldData.每日任务统计?.[task.名称] || 0;
                            availableTasks.push(
                                `✦ ${task.名称}`,
                                `  类型: ${task.类型}`,
                                `  难度: ${task.难度}`,
                                `  时限: ${task.时限/3600000}小时`,
                                `  奖励:`,
                                ...Object.entries(task.奖励).map(([type, value]) => 
                                    `    ${type}: ${value}`),
                                `  剩余次数: ${info.每日上限 - dailyCount}\n`
                            );
                        });
                    } else {
                        availableTasks.push(
                            `【${category}】- 未解锁`,
                            `  需求: ${requirementCheck}\n`
                        );
                    }
                }
            }
            
            availableTasks.push(
                "💡 接取任务指令：#接取任务+任务名称",
                "例如：#接取任务收集药草"
            );
            
            e.reply(availableTasks.join('\n'));
            return;
        }
    
        // 查找指定任务
        let targetTask = null;
        let taskCategory = null;
        let taskGuild = null;
    
        for (const [guild, categories] of Object.entries(taskBoard)) {
            for (const [category, info] of Object.entries(categories)) {
                const task = info.任务池.find(t => t.名称 === taskName);
                if (task) {
                    targetTask = task;
                    taskCategory = info;
                    taskGuild = guild;
                    break;
                }
            }
            if (targetTask) break;
        }
    
        if (!targetTask) {
            e.reply("未找到该任务,请检查任务名称是否正确。");
            return;
        }
    
        // 检查任务接取条件
        const requirementCheck = checkTaskRequirements(taskCategory);
        if (requirementCheck) {
            e.reply(`无法接取该任务: ${requirementCheck}`);
            return;
        }
    
        // 检查每日接取次数
        const dailyCount = worldData.每日任务统计?.[targetTask.名称] || 0;
        if (dailyCount >= taskCategory.每日上限) {
            e.reply(`该任务今日已达接取上限(${taskCategory.每日上限}次)`);
            return;
        }
    
        // 初始化任务进度
        if (!worldData.任务进度) {
            worldData.任务进度 = {};
        }
        if (!worldData.每日任务统计) {
            worldData.每日任务统计 = {};
        }
    
        // 记录任务信息
        worldData.任务进度[targetTask.名称] = {
            开始时间: Date.now(),
            结束时间: Date.now() + targetTask.时限,
            进度: {},
            完成: false
        };
        worldData.每日任务统计[targetTask.名称] = dailyCount + 1;
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成接取任务报告
        const acceptReport = [
            `〓 任务接取成功 〓\n`,
            `✦ ${targetTask.名称}`,
            `委托方: ${taskGuild}`,
            `难度: ${targetTask.难度}`,
            `类型: ${targetTask.类型}`,
            `\n任务目标:`,
            ...Object.entries(targetTask.目标).map(([target, amount]) => 
                `- ${target}: 0/${amount}`),
            `\n预期奖励:`,
            ...Object.entries(targetTask.奖励).map(([type, value]) => 
                `- ${type}: ${value}`),
            `\n时间限制: ${targetTask.时限/3600000}小时`,
            `剩余次数: ${taskCategory.每日上限 - (dailyCount + 1)}`,
            `\n💡 可以使用 #查看任务 查看任务进度`
        ].join('\n');
    
        e.reply(acceptReport);
    }

    async completeTask(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 获取要完成的任务名称
        const taskName = e.msg.replace('#完成任务', '').trim();
    
        if (!worldData.任务进度 || !worldData.任务进度[taskName]) {
            e.reply("你没有接取该任务！");
            return;
        }
    
        const taskProgress = worldData.任务进度[taskName];
    
        // 检查任务是否已完成
        if (taskProgress.完成) {
            e.reply("该任务已经完成过了！");
            return;
        }
    
        // 检查任务是否超时
        if (Date.now() > taskProgress.结束时间) {
            delete worldData.任务进度[taskName];
            await redis.set(`user:${userId}`, JSON.stringify(worldData));
            await saveUserData(userId, worldData);
            e.reply("任务已超时失败！");
            return;
        }
    
        // 任务完成条件检查系统
        const checkTaskCompletion = (taskName, progress) => {
            const taskTypes = {
                "收集药草": () => {
                    return worldData.背包.材料["治愈草药"] >= 5;
                },
                "清理史莱姆": () => {
                    return (progress.进度["史莱姆击杀"] || 0) >= 3;
                },
                "调查遗迹": () => {
                    return (progress.进度["遗迹探索进度"] || 0) >= 100;
                },
                "收集魔法结晶": () => {
                    return worldData.背包.材料["魔法水晶"] >= 8;
                }
            };
    
            return taskTypes[taskName] ? taskTypes[taskName]() : false;
        };
    
        // 检查任务完成条件
        if (!checkTaskCompletion(taskName, taskProgress)) {
            e.reply("任务目标未达成,无法完成任务！");
            return;
        }
    
        // 任务奖励系统
        const taskRewards = {
            "收集药草": {
                金币: 100,
                经验值: 50,
                声望: 10,
                物品: {
                    "初级治疗药水": 1
                }
            },
            "清理史莱姆": {
                金币: 150,
                经验值: 80,
                声望: 15,
                物品: {
                    "史莱姆核心": 1
                }
            },
            "调查遗迹": {
                金币: 500,
                经验值: 200,
                声望: 30,
                物品: {
                    "神秘卷轴": 1,
                    "古代遗物": 1
                }
            },
            "收集魔法结晶": {
                金币: 300,
                经验值: 150,
                魔法亲和: 5,
                物品: {
                    "魔力结晶": 2
                }
            }
        };
    
        const rewards = taskRewards[taskName];
        if (!rewards) {
            e.reply("任务奖励信息异常！");
            return;
        }
    
        // 扣除任务所需物品
        const taskRequirements = {
            "收集药草": {
                "治愈草药": 5
            },
            "收集魔法结晶": {
                "魔法水晶": 8
            }
        };
    
        if (taskRequirements[taskName]) {
            for (const [item, amount] of Object.entries(taskRequirements[taskName])) {
                worldData.背包.材料[item] -= amount;
            }
        }
    
        // 发放奖励
        worldData.背包.金币 += rewards.金币;
        worldData.经验值 += rewards.经验值;
        if (rewards.声望) worldData.声望 = (worldData.声望 || 0) + rewards.声望;
        if (rewards.魔法亲和) worldData.魔法亲和 += rewards.魔法亲和;
    
        // 添加奖励物品
        if (rewards.物品) {
            for (const [item, amount] of Object.entries(rewards.物品)) {
                if (!worldData.背包.材料[item]) {
                    worldData.背包.材料[item] = 0;
                }
                worldData.背包.材料[item] += amount;
            }
        }
    
        // 检查升级
        if (worldData.经验值 >= worldData.升级所需经验) {
            worldData.等级 += 1;
            worldData.经验值 -= worldData.升级所需经验;
            worldData.升级所需经验 = Math.floor(worldData.升级所需经验 * 1.2);
        }
    
        // 更新任务状态
        taskProgress.完成 = true;
        taskProgress.完成时间 = Date.now();
    
        // 随机触发特殊奖励
        let specialReward = null;
        if (Math.random() < 0.1) { // 10%概率触发特殊奖励
            const specialRewards = [
                {
                    type: "称号",
                    name: "勤劳的冒险者",
                    effect: "完成任务经验+10%"
                },
                {
                    type: "技能书",
                    name: "初级任务技巧",
                    effect: "提高任务完成速度"
                },
                {
                    type: "道具",
                    name: "幸运护符",
                    effect: "提高特殊奖励获取概率"
                }
            ];
            specialReward = specialRewards[Math.floor(Math.random() * specialRewards.length)];
            
            // 添加特殊奖励
            if (specialReward.type === "称号") {
                if (!worldData.称号) worldData.称号 = [];
                worldData.称号.push(specialReward.name);
            } else if (specialReward.type === "技能书") {
                if (!worldData.背包.材料[specialReward.name]) {
                    worldData.背包.材料[specialReward.name] = 0;
                }
                worldData.背包.材料[specialReward.name]++;
            } else if (specialReward.type === "道具") {
                if (!worldData.背包.材料[specialReward.name]) {
                    worldData.背包.材料[specialReward.name] = 0;
                }
                worldData.背包.材料[specialReward.name]++;
            }
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成完成报告
        const completionReport = [
            `〓 任务完成报告 〓\n`,
            `✦ ${taskName}`,
            `完成用时: ${Math.floor((Date.now() - taskProgress.开始时间) / 60000)}分钟\n`,
            `获得奖励:`,
            `💰 金币: ${rewards.金币}`,
            `📈 经验值: ${rewards.经验值}`,
            rewards.声望 ? `🌟 声望: ${rewards.声望}` : "",
            rewards.魔法亲和 ? `✨ 魔法亲和: ${rewards.魔法亲和}` : "",
            `\n获得物品:`,
            ...Object.entries(rewards.物品).map(([item, amount]) => 
                `- ${item} x${amount}`),
            specialReward ? [
                `\n🎉 触发特殊奖励!`,
                `获得${specialReward.type}: ${specialReward.name}`,
                `效果: ${specialReward.effect}`
            ].join('\n') : "",
            `\n当前状态:`,
            `👑 等级: ${worldData.等级}`,
            `📊 经验值: ${worldData.经验值}/${worldData.升级所需经验}`,
            `💰 金币: ${worldData.背包.金币}`,
            rewards.声望 ? `🌟 声望: ${worldData.声望}` : "",
            `\n💡 提示: 继续努力完成任务获得更多奖励吧！`
        ].join('\n');
    
        e.reply(completionReport);
    }

    async showAffection(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // NPC好感度系统
        const npcSystem = {
            // 主要NPC
            "星月魔法店主 - 莉莉": {
                身份: "魔法店主",
                性格: "开朗活泼",
                喜好: ["魔法道具", "甜点"],
                特殊奖励: {
                    50: "魔法店特惠",
                    100: "专属魔法配方",
                    200: "店主的信任"
                }
            },
            "花海医师 - 薇薇安": {
                身份: "治愈师",
                性格: "温柔体贴",
                喜好: ["药草", "花束"],
                特殊奖励: {
                    50: "治疗折扣",
                    100: "特制药剂配方",
                    200: "医师的祝福"
                }
            },
            "铁匠铺主 - 凯瑟琳": {
                身份: "铁匠大师",
                性格: "豪爽直率",
                喜好: ["矿石", "武器"],
                特殊奖励: {
                    50: "装备强化折扣",
                    100: "特殊装备图纸",
                    200: "铁匠的信赖"
                }
            },
            
            // 特殊NPC
            "森林守护者 - 艾琳": {
                身份: "精灵族守护者",
                性格: "神秘优雅",
                喜好: ["自然晶石", "精灵物品"],
                特殊奖励: {
                    50: "森林祝福",
                    100: "自然之力",
                    200: "精灵的认可"
                }
            }
        };
    
        // 好感度等级系统
        const affectionLevels = {
            0: { 称号: "陌生人", 颜色: "⚪" },
            20: { 称号: "熟人", 颜色: "🟢" },
            50: { 称号: "朋友", 颜色: "🔵" },
            100: { 称号: "知己", 颜色: "🟣" },
            200: { 称号: "挚友", 颜色: "🟡" }
        };
    
        // 获取好感度等级称号
        const getAffectionTitle = (affection) => {
            let title = { 称号: "陌生人", 颜色: "⚪" };
            for (const [level, info] of Object.entries(affectionLevels)) {
                if (affection >= parseInt(level)) {
                    title = info;
                }
            }
            return title;
        };
    
        // 检查解锁的奖励
        const checkUnlockedRewards = (npc, affection) => {
            const rewards = [];
            for (const [level, reward] of Object.entries(npc.特殊奖励)) {
                if (affection >= parseInt(level)) {
                    rewards.push(`${reward} (${level}好感度)`);
                }
            }
            return rewards;
        };
    
        // 生成好感度报告
        let affectionReport = ["〓 好感度一览 〓\n"];
    
        // 遍历所有NPC
        for (const [npcName, npcInfo] of Object.entries(npcSystem)) {
            const affection = worldData.好感度?.[npcName] || 0;
            const title = getAffectionTitle(affection);
            const unlockedRewards = checkUnlockedRewards(npcInfo, affection);
            const nextReward = Object.entries(npcInfo.特殊奖励)
                .find(([level]) => parseInt(level) > affection);
    
            affectionReport.push(
                `${title.颜色} ${npcName}`,
                `身份: ${npcInfo.身份}`,
                `好感度: ${affection} (${title.称号})`,
                `性格: ${npcInfo.性格}`,
                `喜好: ${npcInfo.喜好.join('、')}`,
                `\n已解锁奖励:`,
                unlockedRewards.length > 0 ? 
                    unlockedRewards.map(reward => `- ${reward}`).join('\n') :
                    "- 暂无",
                nextReward ? 
                    `\n下一个奖励: ${nextReward[1]} (需要${nextReward[0]}好感度)` :
                    "\n已解锁全部奖励！",
                "\n"
            );
        }
    
        // 添加互动提示
        affectionReport.push(
            "💡 提升好感度方式:",
            "1. 赠送喜好物品",
            "2. 完成委托任务",
            "3. 日常互动交谈",
            "4. 参与特殊活动"
        );
    
        e.reply(affectionReport.join('\n'));
    }

    async goOnDate(e) {
        // 基础检查部分
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 约会系统基础设置
        const dateSystem = {
            // 约会地点配置
            locations: {
                "星光咖啡厅": {
                    类型: "休闲",
                    氛围: "温馨浪漫",
                    消费: 100,
                    好感度加成: 1.2,
                    特殊事件概率: 0.3,
                    推荐时段: ["下午", "晚上"],
                    所需道具: ["精致茶具"],
                    解锁条件: {等级: 1}
                },
                "魔法花园": {
                    类型: "户外",
                    氛围: "自然清新",
                    消费: 150,
                    好感度加成: 1.5,
                    特殊事件概率: 0.4,
                    推荐时段: ["上午", "下午"],
                    所需道具: ["魔法花束"],
                    解锁条件: {等级: 5}
                },
                "月光湖畔": {
                    类型: "景点",
                    氛围: "浪漫梦幻",
                    消费: 200,
                    好感度加成: 1.8,
                    特殊事件概率: 0.5,
                    推荐时段: ["傍晚", "晚上"],
                    所需道具: ["星光提灯"],
                    解锁条件: {等级: 10}
                },
                "水晶餐厅": {
                    类型: "高级",
                    氛围: "优雅奢华",
                    消费: 500,
                    好感度加成: 2.0,
                    特殊事件概率: 0.6,
                    推荐时段: ["晚上"],
                    所需道具: ["礼服"],
                    解锁条件: {等级: 20}
                }
            },
    
            // NPC配置
            npcs: {
                "莉莉": {
                    身份: "魔法店主",
                    性格: "开朗活泼",
                    喜好: ["魔法道具", "甜点"],
                    厌恶: ["虫子", "脏东西"],
                    约会特殊对话: [
                        "今天的魔法水晶特别闪耀呢~",
                        "要不要一起研究新的魔法配方？",
                        "你相信魔法的奇迹吗？"
                    ]
                },
                "薇薇安": {
                    身份: "治愈师",
                    性格: "温柔体贴",
                    喜好: ["药草", "花束"],
                    厌恶: ["暴力", "噪音"],
                    约会特殊对话: [
                        "这些花草都有治愈的力量...",
                        "让我为你调配一副特效药吧",
                        "安静的时光最是珍贵"
                    ]
                },
                "艾琳": {
                    身份: "精灵族守护者",
                    性格: "高贵优雅",
                    喜好: ["自然晶石", "精灵物品"],
                    厌恶: ["污染", "破坏"],
                    约会特殊对话: [
                        "森林在向我们诉说故事...",
                        "你能感受到自然的脉动吗？",
                        "这片土地需要我们的守护"
                    ]
                }
            },
    
            // 约会剧情配置
            scenarios: {
                普通剧情: [
                    {
                        描述: "一起品尝美味的甜点",
                        好感度: 10,
                        要求: {金币: 50},
                        额外效果: "心情愉悦"
                    },
                    {
                        描述: "散步闲聊",
                        好感度: 8,
                        要求: {体力: 10},
                        额外效果: "放松身心"
                    }
                ],
                特殊剧情: [
                    {
                        描述: "意外发现稀有魔法材料",
                        好感度: 20,
                        奖励: {"魔法精华": 1},
                        额外效果: "增加魔法亲和"
                    },
                    {
                        描述: "合力解决突发事件",
                        好感度: 25,
                        奖励: {经验值: 100},
                        额外效果: "增加默契度"
                    }
                ],
                浪漫剧情: [
                    {
                        描述: "月下共赏花海",
                        好感度: 30,
                        要求: {时间: "晚上", 道具: "魔法花束"},
                        额外效果: "浪漫氛围提升"
                    },
                    {
                        描述: "观看流星雨",
                        好感度: 35,
                        要求: {时间: "深夜", 道具: "望远镜"},
                        额外效果: "心灵共鸣"
                    }
                ]
            }
        };
    
        // 解析约会指令
        const dateInfo = e.msg.replace('#约会', '').trim().split(' ');
        const targetName = dateInfo[0];
        const location = dateInfo[1];
    
        // 判断是NPC约会还是玩家约会
        if (e.at) {
            // 玩家约会逻辑
            return await handlePlayerDate(e, worldData, dateSystem);
        } else {
            // NPC约会逻辑
            return await handleNPCDate(e, worldData, targetName, location, dateSystem);
        }
    }

    async treatDisease(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 疾病系统
        const diseaseSystem = {
            轻度疾病: {
                "感冒": {
                    症状: ["发烧", "头痛"],
                    治疗方式: ["休息", "服用药物"],
                    所需药物: ["感冒药"],
                    恢复时间: 3600000, // 1小时
                    治疗费用: 100,
                    生命值减少: 10,
                    传染性: false
                },
                "轻微受伤": {
                    症状: ["擦伤", "轻微疼痛"],
                    治疗方式: ["包扎", "涂抹药物"],
                    所需药物: ["治疗药水"],
                    恢复时间: 1800000, // 30分钟
                    治疗费用: 80,
                    生命值减少: 5,
                    传染性: false
                }
            },
            中度疾病: {
                "魔法虚弱": {
                    症状: ["魔力减退", "精神疲惫"],
                    治疗方式: ["魔法治疗", "服用魔药"],
                    所需药物: ["魔力恢复药剂"],
                    恢复时间: 7200000, // 2小时
                    治疗费用: 200,
                    生命值减少: 20,
                    魔力值减少: 30,
                    传染性: false
                },
                "森林热病": {
                    症状: ["高烧", "虚弱"],
                    治疗方式: ["魔法治疗", "特效药"],
                    所需药物: ["森林药剂"],
                    恢复时间: 10800000, // 3小时
                    治疗费用: 300,
                    生命值减少: 25,
                    传染性: true
                }
            },
            重度疾病: {
                "魔法污染": {
                    症状: ["魔力絮乱", "生命力流失"],
                    治疗方式: ["净化仪式", "圣水洗礼"],
                    所需药物: ["净化圣水", "魔力结晶"],
                    恢复时间: 21600000, // 6小时
                    治疗费用: 500,
                    生命值减少: 40,
                    魔力值减少: 50,
                    传染性: true
                },
                "诅咒缠身": {
                    症状: ["生命流失", "不详之兆"],
                    治疗方式: ["驱魔仪式", "净化术"],
                    所需药物: ["祝福宝珠", "圣水"],
                    恢复时间: 43200000, // 12小时
                    治疗费用: 1000,
                    生命值减少: 60,
                    魔力值减少: 70,
                    传染性: false
                }
            }
        };
    
        // 治疗师系统
        const healers = {
            "见习治疗师": {
                等级要求: 1,
                可治疗: ["轻度疾病"],
                治疗折扣: 0,
                治疗加成: 0
            },
            "普通治疗师": {
                等级要求: 10,
                可治疗: ["轻度疾病", "中度疾病"],
                治疗折扣: 0.1,
                治疗加成: 0.1
            },
            "高级治疗师": {
                等级要求: 30,
                可治疗: ["轻度疾病", "中度疾病", "重度疾病"],
                治疗折扣: 0.2,
                治疗加成: 0.2
            },
            "圣光治疗师": {
                等级要求: 50,
                可治疗: ["轻度疾病", "中度疾病", "重度疾病"],
                治疗折扣: 0.3,
                治疗加成: 0.3,
                特殊能力: "净化诅咒"
            }
        };
    
        // 检查玩家当前状态
        if (!worldData.状态.生病) {
            e.reply("你现在很健康,不需要治疗！");
            return;
        }
    
        const currentDisease = worldData.状态.生病;
        let diseaseInfo = null;
    
        // 查找疾病信息
        for (const [severity, diseases] of Object.entries(diseaseSystem)) {
            if (diseases[currentDisease]) {
                diseaseInfo = diseases[currentDisease];
                break;
            }
        }
    
        if (!diseaseInfo) {
            e.reply("无法识别的疾病状态！");
            return;
        }
    
        // 选择合适的治疗师
        let suitableHealer = null;
        for (const [healer, info] of Object.entries(healers)) {
            if (worldData.等级 >= info.等级要求) {
                for (const severity of info.可治疗) {
                    if (diseaseSystem[severity][currentDisease]) {
                        suitableHealer = { name: healer, ...info };
                        break;
                    }
                }
            }
            if (suitableHealer) break;
        }
    
        if (!suitableHealer) {
            e.reply("你的等级不足,无法寻找合适的治疗师！");
            return;
        }
    
        // 计算治疗费用
        const baseCost = diseaseInfo.治疗费用;
        const finalCost = Math.floor(baseCost * (1 - suitableHealer.治疗折扣));
    
        // 检查金币是否足够
        if (worldData.背包.金币 < finalCost) {
            e.reply(`治疗费用不足！需要${finalCost}金币。`);
            return;
        }
    
        // 检查是否有必要的药物
        let missingItems = [];
        for (const item of diseaseInfo.所需药物) {
            if (!worldData.背包.材料[item] || worldData.背包.材料[item] < 1) {
                missingItems.push(item);
            }
        }
    
        if (missingItems.length > 0) {
            e.reply(`缺少治疗所需物品: ${missingItems.join('、')}`);
            return;
        }
    
        // 执行治疗
        worldData.背包.金币 -= finalCost;
        for (const item of diseaseInfo.所需药物) {
            worldData.背包.材料[item]--;
        }
    
        // 计算治疗效果
        const healingEffect = Math.floor(100 * (1 + suitableHealer.治疗加成));
        worldData.属性.生命值 = Math.min(100, worldData.属性.生命值 + healingEffect);
        
        if (diseaseInfo.魔力值减少) {
            worldData.属性.魔力值 = Math.min(100, worldData.属性.魔力值 + healingEffect);
        }
    
        // 清除疾病状态
        worldData.状态.生病 = null;
        worldData.状态.恢复时间 = Date.now() + diseaseInfo.恢复时间;
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成治疗报告
        const treatmentReport = [
            `〓 治疗报告 〓\n`,
            `诊断疾病: ${currentDisease}`,
            `治疗师: ${suitableHealer.name}`,
            `\n治疗过程:`,
            ...diseaseInfo.治疗方式.map(method => `- ${method}`),
            `\n使用物品:`,
            ...diseaseInfo.所需药物.map(item => `- ${item}`),
            `\n治疗效果:`,
            `❤️ 生命值恢复: ${healingEffect}`,
            diseaseInfo.魔力值减少 ? `✨ 魔力值恢复: ${healingEffect}` : "",
            `💰 治疗费用: ${finalCost}金币`,
            `\n当前状态:`,
            `❤️ 生命值: ${worldData.属性.生命值}`,
            `✨ 魔力值: ${worldData.属性.魔力值}`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `\n💡 提示: 完全恢复需要${diseaseInfo.恢复时间/3600000}小时,请注意休息！`
        ].join('\n');
    
        e.reply(treatmentReport);
    }

    async buyFood(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 食物商店系统
        const foodShop = {
            普通食物: {
                "面包": {
                    价格: 10,
                    饱食度: 10,
                    体力恢复: 5,
                    保质期: 172800000, // 48小时
                    描述: "新鲜出炉的面包",
                    特殊效果: null
                },
                "水果": {
                    价格: 15,
                    饱食度: 8,
                    体力恢复: 8,
                    保质期: 86400000, // 24小时
                    描述: "新鲜采摘的水果",
                    特殊效果: "维生素补充"
                }
            },
            魔法食物: {
                "魔力蛋糕": {
                    价格: 50,
                    饱食度: 20,
                    体力恢复: 15,
                    魔力恢复: 20,
                    保质期: 259200000, // 72小时
                    描述: "蕴含魔力的特制蛋糕",
                    特殊效果: "魔力提升"
                },
                "星光布丁": {
                    价格: 80,
                    饱食度: 25,
                    体力恢复: 20,
                    魔力恢复: 30,
                    保质期: 345600000, // 96小时
                    描述: "注入星光能量的布丁",
                    特殊效果: "星光祝福"
                }
            },
            高级食物: {
                "龙之料理": {
                    价格: 200,
                    饱食度: 50,
                    体力恢复: 40,
                    魔力恢复: 50,
                    保质期: 432000000, // 120小时
                    描述: "使用龙之食材制作的料理",
                    特殊效果: "龙之力量"
                },
                "精灵果实": {
                    价格: 150,
                    饱食度: 35,
                    体力恢复: 30,
                    魔力恢复: 40,
                    保质期: 518400000, // 144小时
                    描述: "精灵族珍贵的果实",
                    特殊效果: "自然祝福"
                }
            }
        };
    
        // 商店折扣系统
        const shopDiscounts = {
            "普通会员": {
                等级要求: 1,
                折扣: 0
            },
            "白银会员": {
                等级要求: 10,
                折扣: 0.1
            },
            "黄金会员": {
                等级要求: 30,
                折扣: 0.2
            },
            "钻石会员": {
                等级要求: 50,
                折扣: 0.3
            }
        };
    
        // 获取玩家的会员等级
        let membershipLevel = "普通会员";
        for (const [level, info] of Object.entries(shopDiscounts)) {
            if (worldData.等级 >= info.等级要求) {
                membershipLevel = level;
            }
        }
    
        // 解析购买指令
        const foodInfo = e.msg.replace('#购买食物', '').trim().split(' ');
        const foodName = foodInfo[0];
        const amount = parseInt(foodInfo[1]) || 1;
    
        // 如果没有指定食物名称,显示商店列表
        if (!foodName) {
            let shopList = [
                `〓 魔法食物商店 〓\n`,
                `当前会员等级: ${membershipLevel}`,
                `折扣: ${shopDiscounts[membershipLevel].折扣 * 100}%\n`
            ];
    
            for (const [category, foods] of Object.entries(foodShop)) {
                shopList.push(`== ${category} ==`);
                for (const [name, info] of Object.entries(foods)) {
                    const discountedPrice = Math.floor(info.价格 * (1 - shopDiscounts[membershipLevel].折扣));
                    shopList.push(
                        `🍽️ ${name} - ${discountedPrice}金币`,
                        `  饱食度+${info.饱食度} 体力+${info.体力恢复}`,
                        info.魔力恢复 ? `  魔力恢复+${info.魔力恢复}` : "",
                        `  特殊效果: ${info.特殊效果 || "无"}`,
                        `  保质期: ${info.保质期/3600000}小时`,
                        `  描述: ${info.描述}\n`
                    );
                }
            }
    
            shopList.push(
                "💡 购买方式: #购买食物 食物名称 数量",
                "例如: #购买食物 魔力蛋糕 2"
            );
    
            e.reply(shopList.join('\n'));
            return;
        }
    
        // 查找食物信息
        let foodData = null;
        let category = null;
        for (const [cat, foods] of Object.entries(foodShop)) {
            if (foods[foodName]) {
                foodData = foods[foodName];
                category = cat;
                break;
            }
        }
    
        if (!foodData) {
            e.reply("未找到该食物,请检查名称是否正确！");
            return;
        }
    
        // 计算总价
        const discount = shopDiscounts[membershipLevel].折扣;
        const unitPrice = Math.floor(foodData.价格 * (1 - discount));
        const totalPrice = unitPrice * amount;
    
        // 检查金币是否足够
        if (worldData.背包.金币 < totalPrice) {
            e.reply(`金币不足！需要${totalPrice}金币。`);
            return;
        }
    
        // 检查背包空间
        if (!worldData.背包.食物) {
            worldData.背包.食物 = {};
        }
    
        // 执行购买
        worldData.背包.金币 -= totalPrice;
        
        // 添加食物到背包
        if (!worldData.背包.食物[foodName]) {
            worldData.背包.食物[foodName] = {
                数量: 0,
                过期时间: []
            };
        }
        
        worldData.背包.食物[foodName].数量 += amount;
        for (let i = 0; i < amount; i++) {
            worldData.背包.食物[foodName].过期时间.push(Date.now() + foodData.保质期);
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成购买报告
        const purchaseReport = [
            `〓 购买成功 〓\n`,
            `购买食物: ${foodName} x${amount}`,
            `单价: ${unitPrice}金币`,
            `总价: ${totalPrice}金币`,
            discount > 0 ? `已享受${membershipLevel}折扣: ${discount * 100}%` : "",
            `\n食物信息:`,
            `🍽️ 饱食度: +${foodData.饱食度}`,
            `💪 体力恢复: +${foodData.体力恢复}`,
            foodData.魔力恢复 ? `✨ 魔力恢复: +${foodData.魔力恢复}` : "",
            `⏰ 保质期: ${foodData.保质期/3600000}小时`,
            foodData.特殊效果 ? `🌟 特殊效果: ${foodData.特殊效果}` : "",
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `🎒 当前持有${foodName}: ${worldData.背包.食物[foodName].数量}个`,
            `\n💡 提示: 食物请在保质期内食用,过期食物会自动消失！`
        ].join('\n');
    
        e.reply(purchaseReport);
    }

    async eatFood(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 食用效果系统
        const foodEffects = {
            基础效果: {
                "饱食度": (value) => {
                    const current = worldData.属性.饱食度 || 0;
                    return Math.min(100, current + value);
                },
                "体力": (value) => {
                    const current = worldData.属性.体力值 || 0;
                    return Math.min(100, current + value);
                },
                "魔力": (value) => {
                    const current = worldData.属性.魔力值 || 0;
                    return Math.min(100, current + value);
                }
            },
            特殊效果: {
                "维生素补充": {
                    持续时间: 3600000, // 1小时
                    效果: "体力恢复速度+20%"
                },
                "魔力提升": {
                    持续时间: 1800000, // 30分钟
                    效果: "魔力恢复速度+30%"
                },
                "星光祝福": {
                    持续时间: 7200000, // 2小时
                    效果: "魔法伤害+20%"
                },
                "龙之力量": {
                    持续时间: 3600000, // 1小时
                    效果: "全属性+15%"
                },
                "自然祝福": {
                    持续时间: 5400000, // 1.5小时
                    效果: "生命恢复速度+25%"
                }
            }
        };
    
        // 解析食用指令
        const foodName = e.msg.replace('#食用食物', '').trim();
    
        // 如果没有指定食物名称,显示可食用的食物列表
        if (!foodName) {
            if (!worldData.背包.食物 || Object.keys(worldData.背包.食物).length === 0) {
                e.reply("背包中没有任何食物！");
                return;
            }
    
            let foodList = ["〓 可食用的食物 〓\n"];
            for (const [name, info] of Object.entries(worldData.背包.食物)) {
                if (info.数量 > 0) {
                    // 检查是否有过期食物
                    const now = Date.now();
                    const validFood = info.过期时间.filter(time => time > now);
                    const expiredCount = info.过期时间.length - validFood.length;
    
                    // 更新食物数据
                    if (expiredCount > 0) {
                        info.数量 -= expiredCount;
                        info.过期时间 = validFood;
                    }
    
                    if (info.数量 > 0) {
                        const nearestExpire = Math.min(...validFood);
                        const timeLeft = Math.floor((nearestExpire - now) / 3600000);
    
                        foodList.push(
                            `🍽️ ${name}`,
                            `  数量: ${info.数量}`,
                            `  最近过期: ${timeLeft}小时后\n`
                        );
                    }
                }
            }
    
            foodList.push(
                "💡 使用方法: #食用食物 食物名称",
                "例如: #食用食物 魔力蛋糕"
            );
    
            e.reply(foodList.join('\n'));
            return;
        }
    
        // 检查是否有该食物
        if (!worldData.背包.食物?.[foodName] || worldData.背包.食物[foodName].数量 <= 0) {
            e.reply("你没有这个食物！");
            return;
        }
    
        // 检查食物是否过期
        const now = Date.now();
        const foodInfo = worldData.背包.食物[foodName];
        const validFoodIndex = foodInfo.过期时间.findIndex(time => time > now);
    
        if (validFoodIndex === -1) {
            // 所有食物都过期了
            delete worldData.背包.食物[foodName];
            e.reply("这个食物已经过期了！");
            return;
        }
        const foodShop = {
            普通食物: {
                "面包": {
                    价格: 10,
                    饱食度: 10,
                    体力恢复: 5,
                    保质期: 172800000, // 48小时
                    描述: "新鲜出炉的面包",
                    特殊效果: null
                },
                "水果": {
                    价格: 15,
                    饱食度: 8,
                    体力恢复: 8,
                    保质期: 86400000, // 24小时
                    描述: "新鲜采摘的水果",
                    特殊效果: "维生素补充"
                }
            },
            魔法食物: {
                "魔力蛋糕": {
                    价格: 50,
                    饱食度: 20,
                    体力恢复: 15,
                    魔力恢复: 20,
                    保质期: 259200000, // 72小时
                    描述: "蕴含魔力的特制蛋糕",
                    特殊效果: "魔力提升"
                },
                "星光布丁": {
                    价格: 80,
                    饱食度: 25,
                    体力恢复: 20,
                    魔力恢复: 30,
                    保质期: 345600000, // 96小时
                    描述: "注入星光能量的布丁",
                    特殊效果: "星光祝福"
                }
            },
            高级食物: {
                "龙之料理": {
                    价格: 200,
                    饱食度: 50,
                    体力恢复: 40,
                    魔力恢复: 50,
                    保质期: 432000000, // 120小时
                    描述: "使用龙之食材制作的料理",
                    特殊效果: "龙之力量"
                },
                "精灵果实": {
                    价格: 150,
                    饱食度: 35,
                    体力恢复: 30,
                    魔力恢复: 40,
                    保质期: 518400000, // 144小时
                    描述: "精灵族珍贵的果实",
                    特殊效果: "自然祝福"
                }
            }
        };
    
        // 获取食物属性
        let foodData = null;
        for (const category of Object.values(foodShop)) {
            if (category[foodName]) {
                foodData = category[foodName];
                break;
            }
        }
    
        if (!foodData) {
            e.reply("食物数据异常！");
            return;
        }
    
        // 应用食物效果
        let effectReport = ["〓 食用效果 〓\n"];
    
        // 基础效果
        if (foodData.饱食度) {
            worldData.属性.饱食度 = foodEffects.基础效果.饱食度(foodData.饱食度);
            effectReport.push(`🍽️ 饱食度+${foodData.饱食度}`);
        }
        if (foodData.体力恢复) {
            worldData.属性.体力值 = foodEffects.基础效果.体力(foodData.体力恢复);
            effectReport.push(`💪 体力+${foodData.体力恢复}`);
        }
        if (foodData.魔力恢复) {
            worldData.属性.魔力值 = foodEffects.基础效果.魔力(foodData.魔力恢复);
            effectReport.push(`✨ 魔力+${foodData.魔力恢复}`);
        }
    
        // 特殊效果
        if (foodData.特殊效果) {
            const specialEffect = foodEffects.特殊效果[foodData.特殊效果];
            if (specialEffect) {
                if (!worldData.状态.增益效果) worldData.状态.增益效果 = [];
                
                worldData.状态.增益效果.push({
                    名称: foodData.特殊效果,
                    效果: specialEffect.效果,
                    结束时间: now + specialEffect.持续时间
                });
    
                effectReport.push(
                    `\n🌟 获得特殊效果: ${foodData.特殊效果}`,
                    `  效果: ${specialEffect.效果}`,
                    `  持续时间: ${specialEffect.持续时间/3600000}小时`
                );
            }
        }
    
        // 移除已食用的食物
        foodInfo.数量--;
        foodInfo.过期时间.splice(validFoodIndex, 1);
        if (foodInfo.数量<= 0) {
            delete worldData.背包.食物[foodName];
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成食用报告
        effectReport.push(
            `\n当前状态:`,
            `🍽️ 饱食度: ${worldData.属性.饱食度}/100`,
            `💪 体力值: ${worldData.属性.体力值}/100`,
            `✨ 魔力值: ${worldData.属性.魔力值}/100`,
            foodInfo.数量 > 0 ? `\n剩余${foodName}: ${foodInfo.数量}个` : "",
            `\n💡 提示: 特殊效果可以在状态栏查看剩余时间`
        );
    
        e.reply(effectReport.join('\n'));
    }

    async showAttributes(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 属性系统
        const attributeSystem = {
            基础属性: {
                生命值: {
                    图标: "❤️",
                    描述: "决定你的生存能力",
                    最大值: 100,
                    影响: ["生命恢复速度", "抗伤能力"]
                },
                魔力值: {
                    图标: "✨",
                    描述: "决定你的魔法使用能力",
                    最大值: 100,
                    影响: ["魔力恢复速度", "魔法威力"]
                },
                体力值: {
                    图标: "💪",
                    描述: "决定你的行动能力",
                    最大值: 100,
                    影响: ["行动速度", "物理伤害"]
                },
                饱食度: {
                    图标: "🍖",
                    描述: "影响属性恢复速度",
                    最大值: 100,
                    影响: ["生命恢复", "体力恢复"]
                }
            },
            战斗属性: {
                物理攻击: {
                    图标: "⚔️",
                    描述: "决定物理伤害",
                    基础值: 10,
                    成长值: 2
                },
                魔法攻击: {
                    图标: "🔮",
                    描述: "决定魔法伤害",
                    基础值: 10,
                    成长值: 2
                },
                物理防御: {
                    图标: "🛡️",
                    描述: "减少受到的物理伤害",
                    基础值: 5,
                    成长值: 1
                },
                魔法防御: {
                    图标: "🌟",
                    描述: "减少受到的魔法伤害",
                    基础值: 5,
                    成长值: 1
                }
            },
            特殊属性: {
                幸运值: {
                    图标: "🍀",
                    描述: "影响掉落和暴击",
                    基础值: 5,
                    成长值: 0.5
                },
                魅力值: {
                    图标: "💝",
                    描述: "影响NPC互动",
                    基础值: 10,
                    成长值: 1
                },
                敏捷值: {
                    图标: "💨",
                    描述: "影响移动和闪避",
                    基础值: 10,
                    成长值: 1
                }
            }
        };
    
        // 计算装备加成
        const calculateEquipmentBonus = () => {
            let bonus = {};
            
            // 遍历装备栏
            for (const [slot, item] of Object.entries(worldData.装备)) {
                if (!item) continue;
                
                // 获取装备属性
                const equipment = getEquipmentStats(item);
                if (!equipment) continue;
    
                // 累加属性加成
                for (const [attr, value] of Object.entries(equipment.属性加成)) {
                    bonus[attr] = (bonus[attr] || 0) + value;
                }
            }
            
            return bonus;
        };
    
        // 计算状态效果
        const calculateStatusEffects = () => {
            let effects = {};
            
            if (!worldData.状态.增益效果) return effects;
    
            const now = Date.now();
            // 过滤并计算有效状态效果
            worldData.状态.增益效果 = worldData.状态.增益效果.filter(effect => {
                if (effect.结束时间 > now) {
                    // 添加效果加成
                    for (const [attr, value] of Object.entries(effect.加成 || {})) {
                        effects[attr] = (effects[attr] || 0) + value;
                    }
                    return true;
                }
                return false;
            });
    
            return effects;
        };
    
        // 生成属性报告
        const equipBonus = calculateEquipmentBonus();
        const statusEffects = calculateStatusEffects();
    
        let attributeReport = [
            `〓 ${worldData.名字 || "魔法少女"}的属性面板 〓\n`,
            `🎭 职业: ${worldData.职业}`,
            `📊 等级: ${worldData.等级}`,
            `✨ 经验值: ${worldData.经验值}/${worldData.升级所需经验}\n`
        ];
    
        // 基础属性
        attributeReport.push("== 基础属性 ==");
        for (const [attr, info] of Object.entries(attributeSystem.基础属性)) {
            const current = worldData.属性[attr] || 0;
            const max = info.最大值;
            const percent = Math.floor((current / max) * 100);
            
            attributeReport.push(
                `${info.图标} ${attr}: ${current}/${max} (${percent}%)`,
                `  ${info.描述}`
            );
        }
    
        // 战斗属性
        attributeReport.push("\n== 战斗属性 ==");
        for (const [attr, info] of Object.entries(attributeSystem.战斗属性)) {
            const base = worldData.属性[attr] || info.基础值;
            const bonus = equipBonus[attr] || 0;
            const effect = statusEffects[attr] || 0;
            const total = base + bonus + effect;
    
            attributeReport.push(
                `${info.图标} ${attr}: ${total}`,
                bonus || effect ? `  基础值${base}` : "",
                bonus ? `  装备加成+${bonus}` : "",
                effect ? `  状态加成+${effect}` : "",
                `  ${info.描述}`
            );
        }
    
        // 特殊属性
        attributeReport.push("\n== 特殊属性 ==");
        for (const [attr, info] of Object.entries(attributeSystem.特殊属性)) {
            const base = worldData.属性[attr] || info.基础值;
            const bonus = equipBonus[attr] || 0;
            const effect = statusEffects[attr] || 0;
            const total = base + bonus + effect;
    
            attributeReport.push(
                `${info.图标} ${attr}: ${total}`,
                bonus || effect ? `  基础值${base}` : "",
                bonus ? `  装备加成+${bonus}` : "",
                effect ? `  状态加成+${effect}` : "",
                `  ${info.描述}`
            );
        }
    
        // 当前状态效果
        if (worldData.状态.增益效果?.length > 0) {
            attributeReport.push("\n== 当前状态效果 ==");
            for (const effect of worldData.状态.增益效果) {
                const remainingTime = Math.ceil((effect.结束时间 - Date.now()) / 1000);
                attributeReport.push(
                    `🌟 ${effect.名称}`,
                    `  效果: ${effect.效果}`,
                    `  剩余时间: ${remainingTime}秒`
                );
            }
        }
    
        // 成长信息
        attributeReport.push(
            "\n== 成长信息 ==",
            `📈 当前等级成长加成: ${Math.floor(worldData.等级 * 0.1 * 100)}%`,
            `🎯 下一级成长加成: ${Math.floor((worldData.等级 + 1) * 0.1 * 100)}%`
        );
    
        e.reply(attributeReport.join('\n'));
    }

    async learnMagic(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 魔法学习系统
        const magicSystem = {
            // 基础魔法
            初级魔法: {
                "小火球": {
                    类型: "火系",
                    消耗: { 魔力: 20, 金币: 100 },
                    学习要求: { 等级: 1, 魔法亲和: 0 },
                    效果: "造成火焰伤害",
                    伤害: 30,
                    冷却: 5000, // 5秒
                    描述: "最基础的火系魔法"
                },
                "治愈术": {
                    类型: "光系",
                    消耗: { 魔力: 25, 金币: 150 },
                    学习要求: { 等级: 1, 魔法亲和: 5 },
                    效果: "恢复生命值",
                    恢复: 40,
                    冷却: 8000, // 8秒
                    描述: "基础的治疗魔法"
                }
            },
            // 中级魔法
            中级魔法: {
                "火焰风暴": {
                    类型: "火系",
                    消耗: { 魔力: 40, 金币: 500 },
                    学习要求: { 等级: 10, 魔法亲和: 20 },
                    效果: "范围火焰伤害",
                    伤害: 80,
                    冷却: 15000, // 15秒
                    描述: "召唤火焰风暴攻击范围内的敌人"
                },
                "群体治疗": {
                    类型: "光系",
                    消耗: { 魔力: 50, 金币: 600 },
                    学习要求: { 等级: 10, 魔法亲和: 25 },
                    效果: "范围治疗",
                    恢复: 60,
                    冷却: 20000, // 20秒
                    描述: "治疗范围内的所有友方单位"
                }
            },
            // 高级魔法
            高级魔法: {
                "陨石术": {
                    类型: "火系",
                    消耗: { 魔力: 80, 金币: 2000 },
                    学习要求: { 等级: 30, 魔法亲和: 50 },
                    效果: "召唤陨石打击",
                    伤害: 200,
                    冷却: 60000, // 60秒
                    描述: "召唤巨大陨石造成毁灭性打击"
                },
                "复活术": {
                    类型: "光系",
                    消耗: { 魔力: 100, 金币: 3000 },
                    学习要求: { 等级: 30, 魔法亲和: 60 },
                    效果: "复活倒下的队友",
                    恢复: "满状态",
                    冷却: 300000, // 5分钟
                    描述: "使倒下的队友重新站起来"
                }
            }
        };
    
        // 魔法进阶系统
        const magicAdvancement = {
            "小火球": ["火焰风暴", "陨石术"],
            "治愈术": ["群体治疗", "复活术"]
        };
    
        // 解析学习指令
        const magicName = e.msg.replace('#学习魔法', '').trim();
    
        // 如果没有指定魔法名称,显示可学习魔法列表
        if (!magicName) {
            let magicList = ["〓 魔法学习系统 〓\n"];
            
            for (const [level, magics] of Object.entries(magicSystem)) {
                magicList.push(`== ${level} ==`);
                for (const [name, info] of Object.entries(magics)) {
                    const canLearn = worldData.等级 >= info.学习要求.等级 && 
                                    worldData.魔法亲和 >= info.学习要求.魔法亲和;
                    
                    magicList.push(
                        `${canLearn ? "✨" : "❌"} ${name}`,
                        `  类型: ${info.类型}`,
                        `  效果: ${info.效果}`,
                        info.伤害 ? `  伤害: ${info.伤害}` : "",
                        info.恢复 ? `  恢复: ${info.恢复}` : "",
                        `  魔力消耗: ${info.消耗.魔力}`,
                        `  学习费用: ${info.消耗.金币}金币`,
                        `  要求等级: ${info.学习要求.等级}`,
                        `  要求魔法亲和: ${info.学习要求.魔法亲和}`,
                        `  描述: ${info.描述}\n`
                    );
                }
            }
    
            magicList.push(
                "💡 学习魔法指令: #学习魔法 魔法名称",
                "例如: #学习魔法 小火球"
            );
    
            e.reply(magicList.join('\n'));
            return;
        }
    
        // 查找魔法信息
        let magicInfo = null;
        let magicLevel = null;
        for (const [level, magics] of Object.entries(magicSystem)) {
            if (magics[magicName]) {
                magicInfo = magics[magicName];
                magicLevel = level;
                break;
            }
        }
    
        if (!magicInfo) {
            e.reply("未找到该魔法,请检查名称是否正确！");
            return;
        }
    
        // 检查是否已学习
        if (worldData.魔法?.includes(magicName)) {
            e.reply("你已经学会这个魔法了！");
            return;
        }
    
        // 检查前置魔法
        for (const [basic, advanced] of Object.entries(magicAdvancement)) {
            if (advanced.includes(magicName) && !worldData.魔法?.includes(basic)) {
                e.reply(`需要先学习${basic}才能学习这个魔法！`);
                return;
            }
        }
    
        // 检查等级要求
        if (worldData.等级 < magicInfo.学习要求.等级) {
            e.reply(`等级不足,学习该魔法需要达到${magicInfo.学习要求.等级}级！`);
            return;
        }
    
        // 检查魔法亲和要求
        if (worldData.魔法亲和 < magicInfo.学习要求.魔法亲和) {
            e.reply(`魔法亲和不足,学习该魔法需要${magicInfo.学习要求.魔法亲和}点魔法亲和！`);
            return;
        }
    
        // 检查金币是否足够
        if (worldData.背包.金币 < magicInfo.消耗.金币) {
            e.reply(`金币不足,学习该魔法需要${magicInfo.消耗.金币}金币！`);
            return;
        }
    
        // 扣除金币
        worldData.背包.金币 -= magicInfo.消耗.金币;
    
        // 学习魔法
        if (!worldData.魔法) worldData.魔法 = [];
        worldData.魔法.push(magicName);
    
        // 增加魔法熟练度系统
        if (!worldData.魔法熟练度) worldData.魔法熟练度 = {};
        worldData.魔法熟练度[magicName] = {
            等级: 1,
            经验值: 0,
            升级经验: 100
        };
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成学习报告
        const learnReport = [
            `〓 魔法学习成功 〓\n`,
            `✨ 学会了${magicLevel}: ${magicName}`,
            `\n魔法信息:`,
            `  类型: ${magicInfo.类型}`,
            `  效果: ${magicInfo.效果}`,
            magicInfo.伤害 ? `  基础伤害: ${magicInfo.伤害}` : "",
            magicInfo.恢复 ? `  基础恢复: ${magicInfo.恢复}` : "",
            `  魔力消耗: ${magicInfo.消耗.魔力}`,
            `  冷却时间: ${magicInfo.冷却/1000}秒`,
            `\n消耗:`,
            `💰 金币: ${magicInfo.消耗.金币}`,
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `✨ 已学魔法数: ${worldData.魔法.length}`,
            `\n💡 提示: 使用魔法可以提升熟练度,提高魔法威力`
        ].join('\n');
    
        e.reply(learnReport);
    }

    async castMagic(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 魔法效果系统
        const magicEffects = {
            "火系": {
                伤害加成: 1.2,
                特殊效果: "灼烧",
                克制: "木系",
                被克制: "水系"
            },
            "水系": {
                伤害加成: 1.1,
                特殊效果: "冰冻",
                克制: "火系",
                被克制: "雷系"
            },
            "光系": {
                伤害加成: 1.0,
                特殊效果: "净化",
                克制: "暗系",
                被克制: "暗系"
            }
        };
    
        // 魔法熟练度加成系统
        const proficiencyBonus = {
            1: { 伤害: 1.0, 消耗减免: 0 },
            5: { 伤害: 1.2, 消耗减免: 0.1 },
            10: { 伤害: 1.5, 消耗减免: 0.2 },
            20: { 伤害: 2.0, 消耗减免: 0.3 },
            30: { 伤害: 2.5, 消耗减免: 0.4 }
        };
    
        // 魔法装备加成系统
        const calculateEquipmentBonus = (worldData) => {
            let bonus = {
                伤害加成: 1.0,
                消耗减免: 0,
                冷却减免: 0
            };
    
            if (worldData.装备.武器 === "魔导师法杖") {
                bonus.伤害加成 += 0.3;
                bonus.消耗减免 += 0.2;
            }
            if (worldData.装备.饰品 === "魔力宝石") {
                bonus.冷却减免 += 0.1;
            }
    
            return bonus;
        };
    
        // 解析施法指令
        const castInfo = e.msg.replace('#施展魔法', '').trim().split(' ');
        const magicName = castInfo[0];
        const target = castInfo[1] || "目标"; // 如果没有指定目标,默认为"目标"
    
        // 如果没有指定魔法名称,显示已学魔法列表
        if (!magicName) {
            if (!worldData.魔法 || worldData.魔法.length === 0) {
                e.reply("你还没有学会任何魔法！");
                return;
            }
    
            let magicList = ["〓 已学魔法列表 〓\n"];
            for (const magic of worldData.魔法) {
                const proficiency = worldData.魔法熟练度[magic];
                let magicInfo = null;
                
                // 查找魔法信息
                for (const category of Object.values(magicSystem)) {
                    if (category[magic]) {
                        magicInfo = category[magic];
                        break;
                    }
                }
    
                if (magicInfo) {
                    const cooldown = await redis.get(`cooldown:${userId}:${magic}`);
                    const isReady = !cooldown || Date.now() > parseInt(cooldown);
    
                    magicList.push(
                        `${isReady ? "✨" : "⏳"} ${magic}`,
                        `  类型: ${magicInfo.类型}`,
                        `  效果: ${magicInfo.效果}`,
                        `  熟练度: Lv.${proficiency.等级}`,
                        `  经验值: ${proficiency.经验值}/${proficiency.升级经验}`,
                        isReady ? "" : `  冷却剩余: ${Math.ceil((parseInt(cooldown) - Date.now())/1000)}秒\n`
                    );
                }
            }
    
            magicList.push(
                "\n💡 施法指令: #施展魔法 魔法名称 目标",
                "例如: #施展魔法 小火球 史莱姆"
            );
    
            e.reply(magicList.join('\n'));
            return;
        }
    
        // 检查是否学会该魔法
        if (!worldData.魔法?.includes(magicName)) {
            e.reply("你还没有学会这个魔法！");
            return;
        }
    
        // 获取魔法信息
        let magicInfo = null;
        for (const category of Object.values(magicSystem)) {
            if (category[magicName]) {
                magicInfo = category[magicName];
                break;
            }
        }
    
        if (!magicInfo) {
            e.reply("魔法信息异常！");
            return;
        }
    
        // 检查冷却时间
        const cooldown = await redis.get(`cooldown:${userId}:${magicName}`);
        if (cooldown && Date.now() < parseInt(cooldown)) {
            const remainTime = Math.ceil((parseInt(cooldown) - Date.now())/1000);
            e.reply(`魔法冷却中,还需要${remainTime}秒！`);
            return;
        }
    
        // 检查魔力是否足够
        const equipBonus = calculateEquipmentBonus(worldData);
        const profLevel = worldData.魔法熟练度[magicName].等级;
        const profBonus = proficiencyBonus[Object.keys(proficiencyBonus)
            .filter(level => level <= profLevel)
            .sort((a, b) => b - a)[0]];
        
        const actualCost = Math.floor(magicInfo.消耗.魔力 * 
            (1 - profBonus.消耗减免) * 
            (1 - equipBonus.消耗减免));
    
        if (worldData.属性.魔力值 < actualCost) {
            e.reply(`魔力不足,施展${magicName}需要${actualCost}点魔力！`);
            return;
        }
    
        // 计算魔法效果
        const elementBonus = magicEffects[magicInfo.类型];
        const finalDamage = Math.floor(
            (magicInfo.伤害 || magicInfo.恢复) * 
            elementBonus.伤害加成 * 
            profBonus.伤害 * 
            equipBonus.伤害加成
        );
    
        // 扣除魔力
        worldData.属性.魔力值 -= actualCost;
    
        // 设置冷却时间
        const actualCooldown = Math.floor(magicInfo.冷却 * (1 - equipBonus.冷却减免));
        await redis.set(`cooldown:${userId}:${magicName}`, Date.now() + actualCooldown);
    
        // 增加熟练度
        const expGain = Math.floor(magicInfo.消耗.魔力 / 2);
        worldData.魔法熟练度[magicName].经验值 += expGain;
    
        // 检查熟练度升级
        if (worldData.魔法熟练度[magicName].经验值 >= worldData.魔法熟练度[magicName].升级经验) {
            worldData.魔法熟练度[magicName].等级 += 1;
            worldData.魔法熟练度[magicName].经验值 -= worldData.魔法熟练度[magicName].升级经验;
            worldData.魔法熟练度[magicName].升级经验 = Math.floor(worldData.魔法熟练度[magicName].升级经验 * 1.5);
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成施法报告
        const castReport = [
            `〓 魔法施放报告 〓\n`,
            `✨ 施放魔法: ${magicName}`,
            `📍 目标: ${target}`,
            `\n效果:`,
            magicInfo.伤害 ? `⚔️ 造成伤害: ${finalDamage}` : `❤️ 恢复生命: ${finalDamage}`,
            elementBonus.特殊效果 ? `🌟 追加效果: ${elementBonus.特殊效果}` : "",
            `\n消耗:`,
            `✨ 魔力: ${actualCost}`,
            `⏳ 冷却时间: ${actualCooldown/1000}秒`,
            `\n熟练度提升:`,
            `📈 获得经验: ${expGain}`,
            `当前等级: ${worldData.魔法熟练度[magicName].等级}`,
            `经验值: ${worldData.魔法熟练度[magicName].经验值}/${worldData.魔法熟练度[magicName].升级经验}`,
            `\n当前状态:`,
            `✨ 魔力值: ${worldData.属性.魔力值}`,
            `\n💡 提示: 多使用魔法可以提升熟练度,增加威力！`
        ].join('\n');
    
        e.reply(castReport);
    }
    async transformToMagicalGirl(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 变身系统
        const transformSystem = {
            基础变身: {
                "见习魔法少女": {
                    要求等级: 1,
                    属性加成: {
                        攻击力: 10,
                        防御力: 10,
                        魔力值: 20,
                        敏捷度: 10
                    },
                    特殊能力: ["基础魔法盾"],
                    变身特效: "粉色星光",
                    持续时间: 1800000 // 30分钟
                }
            },
            进阶变身: {
                "星光魔法少女": {
                    要求等级: 10,
                    前置变身: "见习魔法少女",
                    属性加成: {
                        攻击力: 25,
                        防御力: 20,
                        魔力值: 40,
                        敏捷度: 20
                    },
                    特殊能力: ["星光护盾", "星光飞翔"],
                    变身特效: "璀璨星光",
                    持续时间: 3600000 // 1小时
                },
                "月光魔法少女": {
                    要求等级: 10,
                    前置变身: "见习魔法少女",
                    属性加成: {
                        攻击力: 20,
                        防御力: 25,
                        魔力值: 45,
                        敏捷度: 15
                    },
                    特殊能力: ["月光治愈", "月光结界"],
                    变身特效: "柔和月光",
                    持续时间: 3600000 // 1小时
                }
            },
            高级变身: {
                "星月魔法少女": {
                    要求等级: 30,
                    前置变身: ["星光魔法少女", "月光魔法少女"],
                    属性加成: {
                        攻击力: 50,
                        防御力: 45,
                        魔力值: 80,
                        敏捷度: 40
                    },
                    特殊能力: ["星月共鸣", "星月结界", "时空穿梭"],
                    变身特效: "星月交辉",
                    持续时间: 7200000 // 2小时
                }
            }
        };
    
        // 变身装备系统
        const transformEquipment = {
            "见习魔法杖": {
                攻击力: 15,
                魔力加成: 10,
                特效: "魔力凝聚"
            },
            "星光法杖": {
                攻击力: 30,
                魔力加成: 25,
                特效: "星光能量"
            },
            "月光法杖": {
                攻击力: 25,
                魔力加成: 30,
                特效: "月光祝福"
            },
            "星月权杖": {
                攻击力: 50,
                魔力加成: 50,
                特效: "星月之力"
            }
        };
    
        // 变身服装系统
        const transformOutfits = {
            "见习魔女服": {
                防御力: 15,
                魔抗: 10,
                特效: "基础防护"
            },
            "星光长裙": {
                防御力: 30,
                魔抗: 25,
                特效: "星光庇护"
            },
            "月光纱裙": {
                防御力: 25,
                魔抗: 30,
                特效: "月光加护"
            },
            "星月礼裙": {
                防御力: 50,
                魔抗: 50,
                特效: "星月守护"
            }
        };
    
        // 获取变身类型
        const transformType = e.msg.replace('#变身魔法少女', '').trim() || "见习魔法少女";
    
        // 查找变身信息
        let transformInfo = null;
        for (const [category, forms] of Object.entries(transformSystem)) {
            if (forms[transformType]) {
                transformInfo = forms[transformType];
                break;
            }
        }
    
        if (!transformInfo) {
            let transformList = ["〓 可用变身形态 〓\n"];
            for (const [category, forms] of Object.entries(transformSystem)) {
                transformList.push(`== ${category} ==`);
                for (const [form, info] of Object.entries(forms)) {
                    transformList.push(
                        `✨ ${form}`,
                        `  要求等级: ${info.要求等级}`,
                        info.前置变身 ? `  需要先掌握: ${Array.isArray(info.前置变身) ? info.前置变身.join('或') : info.前置变身}` : "",
                        `  特殊能力: ${info.特殊能力.join(', ')}`,
                        `  持续时间: ${info.持续时间/3600000}小时\n`
                    );
                }
            }
            transformList.push(
                "💡 使用方法: #变身魔法少女 变身类型",
                "例如: #变身魔法少女 星光魔法少女"
            );
            e.reply(transformList.join('\n'));
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < transformInfo.要求等级) {
            e.reply(`等级不足,变身${transformType}需要达到${transformInfo.要求等级}级！`);
            return;
        }
    
        // 检查前置变身
        if (transformInfo.前置变身) {
            const required = Array.isArray(transformInfo.前置变身) ? 
                transformInfo.前置变身 : [transformInfo.前置变身];
            
            const mastered = required.some(form => worldData.已掌握变身?.includes(form));
            
            if (!mastered) {
                e.reply(`需要先掌握${required.join('或')}才能使用此变身！`);
                return;
            }
        }
    
        // 检查魔力是否足够
        const transformCost = Math.floor(50 * (transformInfo.要求等级 / 10));
        if (worldData.属性.魔力值 < transformCost) {
            e.reply(`魔力不足,变身需要${transformCost}点魔力！`);
            return;
        }
    
        // 执行变身
        worldData.属性.魔力值 -= transformCost;
        
        // 应用变身效果
        const oldStats = {...worldData.属性};
        for (const [stat, value] of Object.entries(transformInfo.属性加成)) {
            worldData.属性[stat] = (worldData.属性[stat] || 0) + value;
        }
    
        // 记录变身状态
        worldData.当前变身 = {
            形态: transformType,
            开始时间: Date.now(),
            结束时间: Date.now() + transformInfo.持续时间
        };
    
        // 更新已掌握变身列表
        if (!worldData.已掌握变身) worldData.已掌握变身 = [];
        if (!worldData.已掌握变身.includes(transformType)) {
            worldData.已掌握变身.push(transformType);
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成变身报告
        const transformReport = [
            `〓 变身魔法少女 〓\n`,
            `✨ ${transformInfo.变身特效}闪耀！`,
            `变身形态: ${transformType}`,
            `\n获得属性加成:`,
            ...Object.entries(transformInfo.属性加成).map(([stat, value]) => 
                `${stat}: ${oldStats[stat]} → ${worldData.属性[stat]} (+${value})`),
            `\n解锁特殊能力:`,
            ...transformInfo.特殊能力.map(ability => `- ${ability}`),
            `\n当前状态:`,
            `⏳ 持续时间: ${transformInfo.持续时间/3600000}小时`,
            `✨ 剩余魔力: ${worldData.属性.魔力值}`,
            `\n💡 提示: 变身状态下使用魔法威力会得到提升！`
        ].join('\n');
    
        e.reply(transformReport);
    }

    async showMagicEquipment(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 魔法装备系统
        const magicEquipmentSystem = {
            武器: {
                "星光法杖": {
                    类型: "法杖",
                    品质: "稀有",
                    等级要求: 10,
                    基础属性: {
                        魔法攻击: 30,
                        魔力加成: 20
                    },
                    附魔效果: {
                        "星光祝福": "魔法伤害提升15%",
                        "魔力亲和": "魔力消耗减少10%"
                    },
                    耐久度: 100,
                    强化等级: 0,
                    最大强化: 10,
                    描述: "注入星光能量的法杖"
                },
                "月光权杖": {
                    类型: "权杖",
                    品质: "史诗",
                    等级要求: 20,
                    基础属性: {
                        魔法攻击: 45,
                        魔力加成: 35
                    },
                    附魔效果: {
                        "月光加护": "治疗效果提升20%",
                        "魔力涌动": "技能冷却时间减少15%"
                    },
                    耐久度: 120,
                    强化等级: 0,
                    最大强化: 12,
                    描述: "蕴含月之力量的权杖"
                }
            },
            防具: {
                "星辰法袍": {
                    类型: "法袍",
                    品质: "稀有",
                    等级要求: 10,
                    基础属性: {
                        魔法防御: 25,
                        魔力加成: 15
                    },
                    附魔效果: {
                        "星辰护佑": "受到的魔法伤害减少10%",
                        "魔力屏障": "获得一个可抵挡伤害的护盾"
                    },
                    耐久度: 100,
                    强化等级: 0,
                    最大强化: 10,
                    描述: "以星辰能量织就的法袍"
                },
                "月影长袍": {
                    类型: "长袍",
                    品质: "史诗",
                    等级要求: 20,
                    基础属性: {
                        魔法防御: 40,
                        魔力加成: 30
                    },
                    附魔效果: {
                        "月影庇护": "夜间魔法效果提升25%",
                        "魔力结界": "受到攻击时有机率恢复魔力"
                    },
                    耐久度: 120,
                    强化等级: 0,
                    最大强化: 12,
                    描述: "融合月之精华的长袍"
                }
            },
            饰品: {
                "星光项链": {
                    类型: "项链",
                    品质: "稀有",
                    等级要求: 10,
                    基础属性: {
                        魔力加成: 25,
                        魔法暴击: 10
                    },
                    附魔效果: {
                        "星光聚集": "魔力恢复速度提升15%",
                        "魔法共鸣": "魔法暴击伤害提升20%"
                    },
                    耐久度: 100,
                    强化等级: 0,
                    最大强化: 10,
                    描述: "镶嵌星光宝石的项链"
                },
                "月华手镯": {
                    类型: "手镯",
                    品质: "史诗",
                    等级要求: 20,
                    基础属性: {
                        魔力加成: 35,
                        魔法穿透: 15
                    },
                    附魔效果: {
                        "月华凝聚": "技能魔力消耗降低20%",
                        "魔力爆发": "施法速度提升15%"
                    },
                    耐久度: 120,
                    强化等级: 0,
                    最大强化: 12,
                    描述: "注入月华之力的手镯"
                }
            }
        };
    
        // 品质颜色系统
        const qualityColors = {
            "普通": "⚪",
            "精良": "🟢",
            "稀有": "🟦",
            "史诗": "🟪",
            "传说": "🟡"
        };
    
        // 获取装备名称
        const equipName = e.msg.replace('#查看魔法装备', '').trim();
    
        // 如果没有指定装备名称,显示所有装备
        if (!equipName) {
            let equipList = ["〓 魔法装备一览 〓\n"];
            
            for (const [category, items] of Object.entries(magicEquipmentSystem)) {
                equipList.push(`== ${category} ==`);
                for (const [name, info] of Object.entries(items)) {
                    const equipped = worldData.装备[category] === name;
                    equipList.push(
                        `${qualityColors[info.品质]} ${name} ${equipped ? '[已装备]' : ''}`,
                        `  类型: ${info.类型}`,
                        `  等级要求: ${info.等级要求}`,
                        `  基础属性:`,
                        ...Object.entries(info.基础属性).map(([attr, val]) => 
                            `    ${attr}: +${val}`),
                        `  附魔效果:`,
                        ...Object.entries(info.附魔效果).map(([name, effect]) => 
                            `    ${name}: ${effect}`),
                        ""
                    );
                }
            }
    
            equipList.push(
                "💡 查看详细信息: #查看魔法装备 装备名称",
                "例如: #查看魔法装备 星光法杖"
            );
    
            e.reply(equipList.join('\n'));
            return;
        }
    
        // 查找指定装备
        let equipInfo = null;
        let equipCategory = null;
        for (const [category, items] of Object.entries(magicEquipmentSystem)) {
            if (items[equipName]) {
                equipInfo = items[equipName];
                equipCategory = category;
                break;
            }
        }
    
        if (!equipInfo) {
            e.reply("未找到该魔法装备！");
            return;
        }
    
        // 计算强化加成
        const calculateEnhancementBonus = (baseStats, level) => {
            const enhanced = {};
            for (const [stat, value] of Object.entries(baseStats)) {
                enhanced[stat] = Math.floor(value * (1 + level * 0.1));
            }
            return enhanced;
        };
    
        // 生成装备详细信息
        const equipped = worldData.装备[equipCategory] === equipName;
        const enhancedStats = calculateEnhancementBonus(equipInfo.基础属性, equipInfo.强化等级);
    
        const equipDetail = [
            `〓 ${equipName} 详细信息 〓\n`,
            `${qualityColors[equipInfo.品质]} 品质: ${equipInfo.品质}`,
            `📝 类型: ${equipInfo.类型}`,
            `⭐ 等级要求: ${equipInfo.等级要求}`,
            equipped ? "✅ 状态: 已装备" : "❌ 状态: 未装备",
            `\n基础属性:`,
            ...Object.entries(enhancedStats).map(([attr, val]) => 
                `- ${attr}: +${val} ${equipInfo.强化等级 > 0 ? `(+${val - equipInfo.基础属性[attr]})` : ""}`),
            `\n附魔效果:`,
            ...Object.entries(equipInfo.附魔效果).map(([name, effect]) => 
                `- ${name}: ${effect}`),
            `\n🛠️ 强化等级: +${equipInfo.强化等级}`,
            `📊 最大强化: +${equipInfo.最大强化}`,
            `🔧 耐久度: ${equipInfo.耐久度}/100`,
            `\n📖 描述: ${equipInfo.描述}`
        ].join('\n');
    
        e.reply(equipDetail);
    }

    async useMagicEquipment(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 装备使用条件系统
        const equipmentRequirements = {
            基础条件: {
                等级检查: (playerLevel, reqLevel) => {
                    return playerLevel >= reqLevel;
                },
                职业检查: (playerClass, reqClass) => {
                    const classTree = {
                        "魔法少女": ["见习魔法少女", "光明魔法少女", "暗影魔法少女"],
                        "法师": ["见习法师", "元素法师", "召唤师"],
                        "巫师": ["见习巫师", "黑暗巫师", "时空巫师"]
                    };
                    return reqClass.some(cls => 
                        classTree[cls]?.includes(playerClass) || cls === playerClass
                    );
                },
                魔力检查: (playerMana, reqMana) => {
                    return playerMana >= reqMana;
                }
            },
            
            特殊条件: {
                "星光系列": {
                    时间要求: "夜晚",
                    魔力亲和: 20,
                    特殊效果: "夜间魔法增强"
                },
                "月光系列": {
                    月相要求: "满月",
                    魔力亲和: 30,
                    特殊效果: "满月魔法增强"
                },
                "自然系列": {
                    地点要求: ["森林", "花园"],
                    自然亲和: 25,
                    特殊效果: "自然魔法增强"
                }
            }
        };
    
        // 装备效果计算系统
        const calculateEquipmentEffects = (equipment, playerData) => {
            let effects = {
                属性加成: {},
                技能强化: {},
                特殊效果: []
            };
    
            // 基础属性加成
            for (const [attr, value] of Object.entries(equipment.基础属性)) {
                effects.属性加成[attr] = Math.floor(value * (1 + equipment.强化等级 * 0.1));
            }
    
            // 附魔效果
            for (const [effect, value] of Object.entries(equipment.附魔效果)) {
                effects.特殊效果.push({
                    名称: effect,
                    效果: value,
                    持续时间: 3600000 // 1小时
                });
            }
    
            // 套装效果检查
            if (equipment.套装) {
                const equippedSet = new Set(Object.values(playerData.装备));
                const setCount = equipment.套装.部件.filter(item => 
                    equippedSet.has(item)
                ).length;
    
                if (setCount >= 2) {
                    effects.特殊效果.push({
                        名称: `${equipment.套装.名称}(2)`,
                        效果: equipment.套装.效果[2],
                        持续时间: -1 // 永久
                    });
                }
                if (setCount >= 4) {
                    effects.特殊效果.push({
                        名称: `${equipment.套装.名称}(4)`,
                        效果: equipment.套装.效果[4],
                        持续时间: -1
                    });
                }
            }
    
            return effects;
        };
    
        // 获取装备名称
        const equipName = e.msg.replace('#使用魔法装备', '').trim();
    
        if (!equipName) {
            e.reply("请指定要使用的魔法装备名称！");
            return;
        }
    
        // 查找装备信息
        let equipInfo = null;
        let equipCategory = null;
        for (const [category, items] of Object.entries(magicEquipmentSystem)) {
            if (items[equipName]) {
                equipInfo = items[equipName];
                equipCategory = category;
                break;
            }
        }
    
        if (!equipInfo) {
            e.reply("未找到该魔法装备！");
            return;
        }
    
        // 检查装备条件
        // 等级检查
        if (!equipmentRequirements.基础条件.等级检查(worldData.等级, equipInfo.等级要求)) {
            e.reply(`等级不足,需要等级${equipInfo.等级要求}！`);
            return;
        }
    
        // 职业检查
        if (equipInfo.职业要求 && !equipmentRequirements.基础条件.职业检查(worldData.职业, equipInfo.职业要求)) {
            e.reply(`职业不符,需要${equipInfo.职业要求.join('或')}职业！`);
            return;
        }
    
        // 特殊条件检查
        for (const [series, requirements] of Object.entries(equipmentRequirements.特殊条件)) {
            if (equipName.includes(series)) {
                // 时间检查
                if (requirements.时间要求) {
                    const currentHour = new Date().getHours();
                    if (requirements.时间要求 === "夜晚" && (currentHour < 18 || currentHour > 6)) {
                        e.reply("该装备只能在夜晚使用！");
                        return;
                    }
                }
    
                // 地点检查
                if (requirements.地点要求 && !requirements.地点要求.includes(worldData.状态.当前位置)) {
                    e.reply(`该装备需要在${requirements.地点要求.join('或')}使用！`);
                    return;
                }
    
                // 属性检查
                if (requirements.魔力亲和 && worldData.魔力亲和 < requirements.魔力亲和) {
                    e.reply(`魔力亲和不足,需要${requirements.魔力亲和}点！`);
                    return;
                }
            }
        }
    
        // 卸下当前装备
        if (worldData.装备[equipCategory]) {
            const oldEquip = worldData.装备[equipCategory];
            // 移除旧装备效果
            // ... 移除旧装备效果的代码
        }
    
        // 装备新装备
        worldData.装备[equipCategory] = equipName;
    
        // 计算并应用新装备效果
        const effects = calculateEquipmentEffects(equipInfo, worldData);
    
        // 应用属性加成
        for (const [attr, value] of Object.entries(effects.属性加成)) {
            worldData.属性[attr] = (worldData.属性[attr] || 0) + value;
        }
    
        // 应用特殊效果
        if (!worldData.状态.增益效果) worldData.状态.增益效果 = [];
        worldData.状态.增益效果.push(...effects.特殊效果);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成装备报告
        const equipReport = [
            `〓 魔法装备使用报告 〓\n`,
            `成功装备: ${equipName}`,
            `\n获得属性加成:`,
            ...Object.entries(effects.属性加成).map(([attr, val]) => 
                `- ${attr}: +${val}`),
            `\n获得特殊效果:`,
            ...effects.特殊效果.map(effect => 
                `- ${effect.名称}: ${effect.效果}${
                    effect.持续时间 > 0 ? 
                    ` (持续${effect.持续时间/3600000}小时)` : 
                    ' (永久)'
                }`),
            `\n当前装备状态:`,
            ...Object.entries(worldData.装备).map(([slot, item]) => 
                `- ${slot}: ${item || '空'}`),
            `\n💡 提示: 可以使用 #查看魔法装备 查看详细属性`
        ].join('\n');
    
        e.reply(equipReport);
    }

    async buyMagicEquipment(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁，无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData || userData.worldData.class !== "魔法少女") {
            e.reply("请先变身魔法少女！");
            return;
        }

        // 假设魔法装备店的物品列表
        const shopItems = [
            { id: 1, name: "星云魔法杖", type: "weapon", price: 1500, stat: "攻击+15" },
            { id: 2, name: "星辰魔法裙", type: "armor", price: 1200, stat: "防御+12" },
            { id: 3, name: "幻影魔法项链", type: "accessory", price: 700, stat: "幸运+7" }
        ];

        const itemId = parseInt(e.msg.replace('#购买魔法装备', '').trim());
        const item = shopItems.find(i => i.id === itemId);

        if (item && worldData.inventory.gold >= item.price) {
            worldData.inventory.gold -= item.price;
            worldData.equipment[item.type] = item.name;
            await redis.set(`user:${userId}`, JSON.stringify(worldData));
            await saveUserData(userId, worldData);
            e.reply(`你购买了 ${item.name}，花费了 ${item.price} 金币。`);
        } else if (item) {
            e.reply(`你没有足够的金币来购买 ${item.name}。`);
        } else {
            e.reply("无效的商品ID，请重新选择。");
        }
    }

    async joinMagicBattle(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 魔法对决系统
        const magicBattleSystem = {
            // 对决场地
            battlegrounds: {
                "魔法竞技场": {
                    等级要求: 10,
                    入场费: 100,
                    胜利奖励倍率: 1.0,
                    特殊效果: null
                },
                "星光广场": {
                    等级要求: 20,
                    入场费: 200,
                    胜利奖励倍率: 1.5,
                    特殊效果: "星光加持"
                },
                "月光神殿": {
                    等级要求: 30,
                    入场费: 300,
                    胜利奖励倍率: 2.0,
                    特殊效果: "月光祝福"
                }
            },
    
            // 对决模式
            battleModes: {
                "练习赛": {
                    难度: 1,
                    经验倍率: 0.5,
                    失败惩罚: "无"
                },
                "排位赛": {
                    难度: 1.5,
                    经验倍率: 1.0,
                    失败惩罚: "积分减少"
                },
                "天梯赛": {
                    难度: 2.0,
                    经验倍率: 1.5,
                    失败惩罚: "积分大幅减少"
                }
            },
    
            // 魔法技能效果
            magicEffects: {
                "火焰": {
                    基础伤害: 30,
                    附加效果: "灼烧",
                    持续时间: 3
                },
                "冰霜": {
                    基础伤害: 25,
                    附加效果: "减速",
                    持续时间: 2
                },
                "闪电": {
                    基础伤害: 35,
                    附加效果: "麻痹",
                    持续时间: 1
                }
            }
        };
    
        // 解析对决指令
        const battleInfo = e.msg.replace('#参加魔法对决', '').trim().split(' ');
        const battleground = battleInfo[0];
        const mode = battleInfo[1] || "练习赛";
    
        // 如果没有指定场地,显示对决信息
        if (!battleground) {
            let battleGuide = [
                "〓 魔法对决指南 〓\n",
                "可用场地:"
            ];
    
            for (const [name, info] of Object.entries(magicBattleSystem.battlegrounds)) {
                battleGuide.push(
                    `🏟️ ${name}`,
                    `  等级要求: ${info.等级要求}`,
                    `  入场费: ${info.金币}金币`,
                    `  奖励倍率: ${info.胜利奖励倍率}`,
                    info.特殊效果 ? `  特殊效果: ${info.特殊效果}` : "",
                    ""
                );
            }
    
            battleGuide.push(
                "对决模式:",
                ...Object.entries(magicBattleSystem.battleModes).map(([name, info]) => 
                    `- ${name}: 难度x${info.难度} 经验x${info.经验倍率}`
                ),
                "\n💡 使用方法: #参加魔法对决 场地名称 模式",
                "例如: #参加魔法对决 魔法竞技场 练习赛"
            );
    
            e.reply(battleGuide.join('\n'));
            return;
        }
    
        // 检查场地是否存在
        const groundInfo = magicBattleSystem.battlegrounds[battleground];
        if (!groundInfo) {
            e.reply("该对决场地不存在！");
            return;
        }
    
        // 检查模式是否存在
        const modeInfo = magicBattleSystem.battleModes[mode];
        if (!modeInfo) {
            e.reply("该对决模式不存在！");
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < groundInfo.等级要求) {
            e.reply(`等级不足,需要等级${groundInfo.等级要求}！`);
            return;
        }
    
        // 检查入场费
        if (worldData.背包.金币 < groundInfo.入场费) {
            e.reply(`金币不足,需要${groundInfo.入场费}金币！`);
            return;
        }
    
        // 扣除入场费
        worldData.背包.金币 -= groundInfo.入场费;
    
        // 对决逻辑
        const battleResult = await executeMagicBattle(worldData, groundInfo, modeInfo);
    
        // 更新数据
        if (battleResult.胜利) {
            // 计算奖励
            const expGain = Math.floor(100 * modeInfo.经验倍率 * groundInfo.胜利奖励倍率);
            const goldGain = Math.floor(groundInfo.入场费 * 2 * groundInfo.胜利奖励倍率);
            
            worldData.经验值 += expGain;
            worldData.背包.金币 += goldGain;
    
            // 检查升级
            if (worldData.经验值 >= worldData.升级所需经验) {
                worldData.等级 += 1;
                worldData.经验值 -= worldData.升级所需经验;
                worldData.升级所需经验 = Math.floor(worldData.升级所需经验 * 1.2);
            }
        } else {
            // 处理失败惩罚
            if (modeInfo.失败惩罚 === "积分减少") {
                worldData.魔法对决积分 = (worldData.魔法对决积分 || 0) - 10;
            } else if (modeInfo.失败惩罚 === "积分大幅减少") {
                worldData.魔法对决积分 = (worldData.魔法对决积分 || 0) - 20;
            }
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成对决报告
        const battleReport = [
            `〓 魔法对决报告 〓\n`,
            `场地: ${battleground}`,
            `模式: ${mode}`,
            `\n对决过程:`,
            ...battleResult.战斗记录,
            `\n对决结果: ${battleResult.胜利 ? "胜利！" : "失败..."}`,
            battleResult.胜利 ? [
                `\n获得奖励:`,
                `✨ 经验值+${expGain}`,
                `💰 金币+${goldGain}`
            ].join('\n') : "",
            `\n当前状态:`,
            `⭐ 等级: ${worldData.等级}`,
            `📊 经验值: ${worldData.经验值}/${worldData.升级所需经验}`,
            `💰 金币: ${worldData.背包.金币}`,
            `🏆 对决积分: ${worldData.魔法对决积分 || 0}`,
            `\n💡 提示: 多参加对决可以提升魔法熟练度！`
        ].join('\n');
    
        e.reply(battleReport);
    }
    
    async collectMagicMaterials(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 魔法素材采集系统
        const magicMaterialSystem = {
            // 采集地点
            locations: {
                "魔法森林": {
                    等级要求: 1,
                    体力消耗: 10,
                    基础素材: {
                        "魔力草": { 概率: 0.8, 数量: [1, 3] },
                        "魔法树枝": { 概率: 0.6, 数量: [1, 2] }
                    },
                    稀有素材: {
                        "魔力结晶": { 概率: 0.1, 数量: [1, 1] }
                    },
                    特殊效果: null
                },
                "星光湖畔": {
                    等级要求: 10,
                    体力消耗: 15,
                    基础素材: {
                        "星光水晶": { 概率: 0.7, 数量: [1, 2] },
                        "月光草": { 概率: 0.5, 数量: [1, 3] }
                    },
                    稀有素材: {
                        "星辰精华": { 概率: 0.15, 数量: [1, 1] }
                    },
                    特殊效果: "星光祝福"
                },
                "魔法遗迹": {
                    等级要求: 20,
                    体力消耗: 20,
                    基础素材: {
                        "远古符文": { 概率: 0.6, 数量: [1, 2] },
                        "魔法石": { 概率: 0.4, 数量: [1, 2] }
                    },
                    稀有素材: {
                        "遗迹核心": { 概率: 0.2, 数量: [1, 1] }
                    },
                    特殊效果: "远古加持"
                }
            },
    
            // 采集工具
            tools: {
                "初级采集工具": {
                    效率加成: 0.1,
                    稀有度提升: 0,
                    体力消耗减少: 0
                },
                "魔法采集工具": {
                    效率加成: 0.2,
                    稀有度提升: 0.05,
                    体力消耗减少: 2
                },
                "星光采集器": {
                    效率加成: 0.3,
                    稀有度提升: 0.1,
                    体力消耗减少: 5
                }
            },
    
            // 采集技能效果
            skills: {
                "自然亲和": {
                    等级加成: 0.05,
                    稀有度提升: 0.02
                },
                "魔力感知": {
                    等级加成: 0.03,
                    体力消耗减少: 1
                }
            }
        };
    
        // 解析采集指令
        const collectInfo = e.msg.replace('#采集魔法素材', '').trim();
        const location = collectInfo || "魔法森林";
    
        // 检查采集地点是否存在
        const locationInfo = magicMaterialSystem.locations[location];
        if (!locationInfo) {
            let locationGuide = [
                "〓 魔法素材采集指南 〓\n",
                "可采集地点:"
            ];
    
            for (const [name, info] of Object.entries(magicMaterialSystem.locations)) {
                locationGuide.push(
                    `🌟 ${name}`,
                    `  等级要求: ${info.等级要求}`,
                    `  体力消耗: ${info.体力消耗}`,
                    `  可采集素材:`,
                    ...Object.keys(info.基础素材).map(material => `    - ${material}`),
                    ...Object.keys(info.稀有素材).map(material => `    - ${material}(稀有)`),
                    info.特殊效果 ? `  特殊效果: ${info.特殊效果}` : "",
                    ""
                );
            }
    
            locationGuide.push(
                "💡 使用方法: #采集魔法素材 地点名称",
                "例如: #采集魔法素材 魔法森林"
            );
    
            e.reply(locationGuide.join('\n'));
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < locationInfo.等级要求) {
            e.reply(`等级不足,需要等级${locationInfo.等级要求}！`);
            return;
        }
    
        // 检查体力
        const tool = worldData.装备.采集工具 ? magicMaterialSystem.tools[worldData.装备.采集工具] : null;
        const actualStamina = locationInfo.体力消耗 - (tool?.体力消耗减少 || 0);
    
        if (worldData.属性.体力值 < actualStamina) {
            e.reply(`体力不足,需要${actualStamina}点体力！`);
            return;
        }
    
        // 计算采集加成
        const calculateBonus = () => {
            let bonus = {
                效率: 0,
                稀有度: 0,
                体力消耗: 0
            };
    
            // 工具加成
            if (tool) {
                bonus.效率 += tool.效率加成;
                bonus.稀有度 += tool.稀有度提升;
                bonus.体力消耗 += tool.体力消耗减少;
            }
    
            // 技能加成
            for (const [skillName, skillInfo] of Object.entries(magicMaterialSystem.skills)) {
                const skill = worldData.技能.find(s => s.name === skillName);
                if (skill) {
                    bonus.效率 += skillInfo.等级加成 * skill.level;
                    bonus.稀有度 += skillInfo.稀有度提升 * skill.level;
                    if (skillInfo.体力消耗减少) {
                        bonus.体力消耗 += skillInfo.体力消耗减少 * skill.level;
                    }
                }
            }
    
            return bonus;
        };
    
        const bonus = calculateBonus();
    
        // 执行采集
        const collectResult = {
            获得材料: [],
            经验值: 0,
            特殊发现: null
        };
    
        // 采集基础素材
        for (const [material, info] of Object.entries(locationInfo.基础素材)) {
            if (Math.random() < info.概率 * (1 + bonus.效率)) {
                const amount = Math.floor(
                    (info.数量[0] + Math.random() * (info.数量[1] - info.数量[0])) * 
                    (1 + bonus.效率)
                );
                collectResult.获得材料.push({
                    名称: material,
                    数量: amount,
                    类型: "基础"
                });
                collectResult.经验值 += amount * 10;
            }
        }
    
        // 采集稀有素材
        for (const [material, info] of Object.entries(locationInfo.稀有素材)) {
            if (Math.random() < info.概率 * (1 + bonus.稀有度)) {
                const amount = Math.floor(
                    (info.数量[0] + Math.random() * (info.数量[1] - info.数量[0])) * 
                    (1 + bonus.效率)
                );
                collectResult.获得材料.push({
                    名称: material,
                    数量: amount,
                    类型: "稀有"
                });
                collectResult.经验值 += amount * 30;
            }
        }
    
        // 特殊发现
        if (locationInfo.特殊效果 && Math.random() < 0.1) {
            collectResult.特殊发现 = locationInfo.特殊效果;
            collectResult.经验值 += 50;
        }
    
        // 更新玩家数据
        worldData.属性.体力值 -= actualStamina;
        worldData.经验值 += collectResult.经验值;
    
        // 添加材料到背包
        for (const material of collectResult.获得材料) {
            if (!worldData.背包.材料[material.名称]) {
                worldData.背包.材料[material.名称] = 0;
            }
            worldData.背包.材料[material.名称] += material.数量;
        }
    
        // 检查升级
        if (worldData.经验值 >= worldData.升级所需经验) {
            worldData.等级 += 1;
            worldData.经验值 -= worldData.升级所需经验;
            worldData.升级所需经验 = Math.floor(worldData.升级所需经验 * 1.2);
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成采集报告
        const collectReport = [
            `〓 魔法素材采集报告 〓\n`,
            `采集地点: ${location}`,
            tool ? `采集工具: ${worldData.装备.采集工具}` : "",
            `\n获得材料:`,
            ...collectResult.获得材料.map(material => 
                `${material.类型 === "稀有" ? "✨" : "🔮"} ${material.名称} x${material.数量}`
            ),
            collectResult.特殊发现 ? `\n✨ 特殊发现: ${collectResult.特殊发现}` : "",
            `\n采集成果:`,
            `📈 获得经验: ${collectResult.经验值}`,
            `💪 消耗体力: ${actualStamina}`,
            `\n当前状态:`,
            `⭐ 等级: ${worldData.等级}`,
            `📊 经验值: ${worldData.经验值}/${worldData.升级所需经验}`,
            `💪 体力值: ${worldData.属性.体力值}/100`,
            `\n💡 提示: 使用更好的采集工具可以提高采集效率！`
        ].join('\n');
    
        e.reply(collectReport);
    }

    async upgradeMagic(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 魔法升级系统
        const magicUpgradeSystem = {
            // 魔法类型
            types: {
                "光明系": {
                    基础消耗: {
                        魔力结晶: 2,
                        星光精华: 1,
                        金币: 100
                    },
                    等级加成: {
                        魔法伤害: 10,
                        治疗效果: 5
                    }
                },
                "暗影系": {
                    基础消耗: {
                        暗影精华: 2,
                        魔力结晶: 1,
                        金币: 120
                    },
                    等级加成: {
                        魔法伤害: 15,
                        魔法穿透: 3
                    }
                },
                "自然系": {
                    基础消耗: {
                        自然精华: 2,
                        生命精华: 1,
                        金币: 90
                    },
                    等级加成: {
                        魔法恢复: 8,
                        持续时间: 2
                    }
                },
                "元素系": {
                    基础消耗: {
                        元素核心: 2,
                        魔力结晶: 1,
                        金币: 150
                    },
                    等级加成: {
                        魔法伤害: 12,
                        元素亲和: 5
                    }
                }
            },
    
            // 升级特效
            upgradeEffects: {
                普通升级: {
                    特效: "魔法光芒",
                    描述: "散发微弱的魔法光芒"
                },
                完美升级: {
                    特效: "魔法涟漪",
                    描述: "产生魔法能量波动"
                },
                超级升级: {
                    特效: "魔法风暴",
                    描述: "引发小规模魔法风暴"
                }
            },
    
            // 升级成功率
            successRates: {
                1: 1.0,    // 1级必定成功
                5: 0.9,    // 5级90%成功率
                10: 0.8,   // 10级80%成功率
                15: 0.7,   // 15级70%成功率
                20: 0.6    // 20级60%成功率
            }
        };
    
        // 解析升级指令
        const magicInfo = e.msg.replace('#升级魔法', '').trim().split(' ');
        const magicName = magicInfo[0];
    
        // 如果没有指定魔法名称,显示可升级魔法列表
        if (!magicName) {
            let magicList = ["〓 可升级的魔法 〓\n"];
            
            if (!worldData.魔法 || worldData.魔法.length === 0) {
                e.reply("你还没有学会任何魔法！");
                return;
            }
    
            for (const magic of worldData.魔法) {
                const type = magic.type;
                const typeInfo = magicUpgradeSystem.types[type];
                
                if (typeInfo) {
                    magicList.push(
                        `✨ ${magic.name} (${type})`,
                        `  当前等级: ${magic.level}`,
                        `  升级消耗:`,
                        ...Object.entries(typeInfo.基础消耗).map(([item, amount]) => 
                            `    ${item}: ${amount * magic.level}`
                        ),
                        `  升级获得:`,
                        ...Object.entries(typeInfo.等级加成).map(([stat, value]) => 
                            `    ${stat}+${value}`
                        ),
                        `  成功率: ${getSuccessRate(magic.level) * 100}%\n`
                    );
                }
            }
    
            magicList.push(
                "💡 使用方法: #升级魔法 魔法名称",
                "例如: #升级魔法 星光术"
            );
    
            e.reply(magicList.join('\n'));
            return;
        }
    
        // 查找要升级的魔法
        const magic = worldData.魔法.find(m => m.name === magicName);
        if (!magic) {
            e.reply("你还没有学会这个魔法！");
            return;
        }
    
        const typeInfo = magicUpgradeSystem.types[magic.type];
        if (!typeInfo) {
            e.reply("该魔法暂时无法升级！");
            return;
        }
    
        // 计算升级消耗
        const costs = {};
        for (const [item, amount] of Object.entries(typeInfo.基础消耗)) {
            costs[item] = amount * magic.level;
        }
    
        // 检查材料是否足够
        let insufficientItems = [];
        if (worldData.背包.金币 < costs.金币) {
            insufficientItems.push(`金币(差${costs.金币 - worldData.背包.金币})`);
        }
        
        for (const [item, amount] of Object.entries(costs)) {
            if (item === "金币") continue;
            if (!worldData.背包.材料[item] || worldData.背包.材料[item] < amount) {
                const current = worldData.背包.材料[item] || 0;
                insufficientItems.push(`${item}(差${amount - current})`);
            }
        }
    
        if (insufficientItems.length > 0) {
            e.reply(`升级所需材料不足：\n${insufficientItems.join('\n')}`);
            return;
        }
    
        // 获取成功率
        const successRate = getSuccessRate(magic.level);
    
        // 尝试升级
        const isSuccess = Math.random() < successRate;
        
        // 扣除材料
        worldData.背包.金币 -= costs.金币;
        for (const [item, amount] of Object.entries(costs)) {
            if (item === "金币") continue;
            worldData.背包.材料[item] -= amount;
        }
    
        if (!isSuccess) {
            await redis.set(`user:${userId}`, JSON.stringify(worldData));
            await saveUserData(userId, worldData);
            
            e.reply([
                "〓 魔法升级失败 〓\n",
                `魔法: ${magic.name}`,
                `消耗材料已扣除`,
                `\n💡 提示: 可以使用魔法卷轴提高升级成功率`
            ].join('\n'));
            return;
        }
    
        // 升级成功
        const oldLevel = magic.level;
        magic.level += 1;
    
        // 获得属性加成
        let upgradeEffects = [];
        for (const [stat, value] of Object.entries(typeInfo.等级加成)) {
            magic[stat] = (magic[stat] || 0) + value;
            upgradeEffects.push(`${stat}+${value}`);
        }
    
        // 获取升级特效
        let effect;
        if (Math.random() < 0.1) {
            effect = magicUpgradeSystem.upgradeEffects.超级升级;
        } else if (Math.random() < 0.3) {
            effect = magicUpgradeSystem.upgradeEffects.完美升级;
        } else {
            effect = magicUpgradeSystem.upgradeEffects.普通升级;
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成升级报告
        const upgradeReport = [
            `〓 魔法升级成功 〓\n`,
            `✨ ${magic.name} 升级成功！`,
            `当前等级: ${magic.level}`,
            `\n获得加成:`,
            ...upgradeEffects.map(effect => `✦ ${effect}`),
            `\n升级特效:`,
            `🌟 ${effect.特效}`,
            `   ${effect.描述}`,
            `\n消耗材料:`,
            `💰 金币: ${costs.金币}`,
            ...Object.entries(costs)
                .filter(([item]) => item !== "金币")
                .map(([item, amount]) => `✨ ${item}: ${amount}`),
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `\n💡 提示: 魔法等级越高,效果越强！`
        ].join('\n');
    
        e.reply(upgradeReport);
    }
    
    async strengthenMagicalGirl(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        if (worldData.职业 !== "魔法少女") {
            e.reply("只有魔法少女才能进行强化！");
            return;
        }
    
        // 魔法少女强化系统
        const strengthenSystem = {
            // 强化部位
            parts: {
                "魔法核心": {
                    基础消耗: {
                        魔法结晶: 3,
                        星光精华: 2,
                        金币: 200
                    },
                    属性提升: {
                        魔力上限: 20,
                        魔法伤害: 15
                    },
                    特殊效果: ["魔力涌动", "法力亲和"]
                },
                "变身之心": {
                    基础消耗: {
                        心灵结晶: 3,
                        梦境碎片: 2,
                        金币: 180
                    },
                    属性提升: {
                        生命上限: 15,
                        防御力: 10
                    },
                    特殊效果: ["生命律动", "防御强化"]
                },
                "星光羽翼": {
                    基础消耗: {
                        星辰碎片: 3,
                        羽毛精华: 2,
                        金币: 250
                    },
                    属性提升: {
                        移动速度: 20,
                        闪避率: 8
                    },
                    特殊效果: ["飞行能力", "灵巧提升"]
                }
            },
    
            // 强化等级效果
            levelEffects: {
                1: {倍率: 1.0, 特效: "微弱光芒"},
                5: {倍率: 1.2, 特效: "星光闪耀"},
                10: {倍率: 1.5, 特效: "魔力绽放"},
                15: {倍率: 1.8, 特效: "光华四溢"},
                20: {倍率: 2.0, 特效: "神圣光辉"}
            },
    
            // 强化品质
            quality: {
                普通: {
                    概率: 0.6,
                    倍率: 1.0,
                    特效: "普通强化"
                },
                优秀: {
                    概率: 0.3,
                    倍率: 1.3,
                    特效: "优质强化"
                },
                完美: {
                    概率: 0.08,
                    倍率: 1.6,
                    特效: "完美强化"
                },
                传说: {
                    概率: 0.02,
                    倍率: 2.0,
                    特效: "传说强化"
                }
            }
        };
    
        // 解析强化指令
        const partInfo = e.msg.replace('#强化魔法少女', '').trim();
        
        // 如果没有指定部位,显示可强化部位列表
        if (!partInfo) {
            let strengthenGuide = [
                "〓 魔法少女强化系统 〓\n",
                "可强化部位:"
            ];
    
            for (const [part, info] of Object.entries(strengthenSystem.parts)) {
                const currentLevel = worldData.强化等级?.[part] || 0;
                const levelEffect = getLevelEffect(currentLevel);
                
                strengthenGuide.push(
                    `\n✨ ${part}`,
                    `当前等级: ${currentLevel}`,
                    `当前特效: ${levelEffect.特效}`,
                    `\n强化消耗:`,
                    ...Object.entries(info.基础消耗).map(([item, amount]) => 
                        `- ${item}: ${Math.floor(amount * levelEffect.倍率)}`
                    ),
                    `\n属性提升:`,
                    ...Object.entries(info.属性提升).map(([attr, value]) => 
                        `- ${attr}+${Math.floor(value * levelEffect.倍率)}`
                    ),
                    `\n特殊效果:`,
                    ...info.特殊效果.map(effect => `- ${effect}`),
                    ""
                );
            }
    
            strengthenGuide.push(
                "\n💡 使用方法: #强化魔法少女 部位名称",
                "例如: #强化魔法少女 魔法核心"
            );
    
            e.reply(strengthenGuide.join('\n'));
            return;
        }
    
        // 检查部位是否存在
        if (!strengthenSystem.parts[partInfo]) {
            e.reply("无效的强化部位！");
            return;
        }
    
        const partData = strengthenSystem.parts[partInfo];
        const currentLevel = worldData.强化等级?.[partInfo] || 0;
        const levelEffect = getLevelEffect(currentLevel);
    
        // 计算强化消耗
        const costs = {};
        for (const [item, amount] of Object.entries(partData.基础消耗)) {
            costs[item] = Math.floor(amount * levelEffect.倍率);
        }
    
        // 检查材料是否足够
        let insufficientItems = [];
        if (worldData.背包.金币 < costs.金币) {
            insufficientItems.push(`金币(差${costs.金币 - worldData.背包.金币})`);
        }
        
        for (const [item, amount] of Object.entries(costs)) {
            if (item === "金币") continue;
            if (!worldData.背包.材料[item] || worldData.背包.材料[item] < amount) {
                const current = worldData.背包.材料[item] || 0;
                insufficientItems.push(`${item}(差${amount - current})`);
            }
        }
    
        if (insufficientItems.length > 0) {
            e.reply(`强化所需材料不足：\n${insufficientItems.join('\n')}`);
            return;
        }
    
        // 扣除材料
        worldData.背包.金币 -= costs.金币;
        for (const [item, amount] of Object.entries(costs)) {
            if (item === "金币") continue;
            worldData.背包.材料[item] -= amount;
        }
    
        // 确定强化品质
        const quality = determineQuality();
    
        // 执行强化
        if (!worldData.强化等级) worldData.强化等级 = {};
        worldData.强化等级[partInfo] = currentLevel + 1;
    
        // 计算属性提升
        const attributeGains = {};
        for (const [attr, value] of Object.entries(partData.属性提升)) {
            attributeGains[attr] = Math.floor(value * levelEffect.倍率 * quality.倍率);
            worldData.属性[attr] = (worldData.属性[attr] || 0) + attributeGains[attr];
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成强化报告
        const strengthenReport = [
            `〓 魔法少女强化报告 〓\n`,
            `强化部位: ${partInfo}`,
            `当前等级: ${worldData.强化等级[partInfo]}`,
            `强化品质: ${quality.特效}`,
            `\n属性提升:`,
            ...Object.entries(attributeGains).map(([attr, value]) => 
                `✨ ${attr}+${value}`
            ),
            `\n消耗材料:`,
            ...Object.entries(costs).map(([item, amount]) => 
                `- ${item}: ${amount}`
            ),
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            levelEffect.特效 ? `\n✨ 激活特效: ${levelEffect.特效}` : "",
            `\n💡 提示: 强化等级越高,效果越好！`
        ].join('\n');
    
        e.reply(strengthenReport);
    }
    async healCompanion(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 治愈系统
        const healingSystem = {
            // 治愈方式
            methods: {
                "基础治愈": {
                    消耗: {
                        魔力: 20,
                        治疗药水: 1
                    },
                    效果: {
                        生命恢复: 30,
                        状态恢复: ["轻伤", "疲惫"]
                    },
                    成功率: 0.9,
                    冷却时间: 300000 // 5分钟
                },
                "高级治愈": {
                    消耗: {
                        魔力: 40,
                        高级治疗药水: 1
                    },
                    效果: {
                        生命恢复: 60,
                        状态恢复: ["重伤", "中毒", "诅咒"]
                    },
                    成功率: 0.8,
                    冷却时间: 600000 // 10分钟
                },
                "完美治愈": {
                    消耗: {
                        魔力: 80,
                        圣光精华: 1
                    },
                    效果: {
                        生命恢复: 100,
                        状态恢复: ["所有负面状态"],
                        额外效果: ["治愈之光", "生命祝福"]
                    },
                    成功率: 0.7,
                    冷却时间: 1800000 // 30分钟
                }
            },
    
            // 治愈加成系统
            bonusSystem: {
                "治愈天赋": {
                    等级加成: 0.1,
                    成功率提升: 0.05
                },
                "光明祝福": {
                    治疗效果: 0.2,
                    冷却减少: 0.1
                },
                "生命之力": {
                    生命上限提升: 0.1,
                    治疗消耗减少: 0.15
                }
            },
    
            // 特殊效果
            specialEffects: {
                "治愈之光": {
                    持续时间: 300000, // 5分钟
                    效果: "治疗效果提升30%"
                },
                "生命祝福": {
                    持续时间: 600000, // 10分钟
                    效果: "生命恢复速度提升50%"
                }
            }
        };
    
        // 获取治愈目标
        const targetId = e.at || userId;
        const targetData = targetId === userId ? worldData : 
                          JSON.parse(await redis.get(`world:user:${targetId}`));
    
        if (!targetData) {
            e.reply("治愈目标不存在！");
            return;
        }
    
        // 检查目标状态
        if (targetData.属性.生命值 >= 100 && !targetData.状态.负面状态?.length) {
            e.reply("目标状态良好,不需要治愈！");
            return;
        }
    
        // 选择合适的治愈方式
        let healMethod;
        if (targetData.状态.负面状态?.some(s => ["重伤", "中毒", "诅咒"].includes(s))) {
            healMethod = healingSystem.methods["高级治愈"];
        } else if (targetData.状态.负面状态?.some(s => ["所有负面状态"].includes(s))) {
            healMethod = healingSystem.methods["完美治愈"];
        } else {
            healMethod = healingSystem.methods["基础治愈"];
        }
    
        // 检查冷却时间
        const cooldown = await redis.get(`cooldown:heal:${userId}`);
        if (cooldown && Date.now() < parseInt(cooldown)) {
            const remainTime = Math.ceil((parseInt(cooldown) - Date.now()) / 1000);
            e.reply(`治愈能力冷却中,还需要${remainTime}秒！`);
            return;
        }
    
        // 计算治愈加成
        let totalBonus = {
            治疗效果: 1,
            成功率: 0,
            冷却减少: 0,
            消耗减少: 0
        };
    
        // 计算天赋加成
        if (worldData.天赋) {
            for (const [talent, bonus] of Object.entries(healingSystem.bonusSystem)) {
                if (worldData.天赋.includes(talent)) {
                    totalBonus.治疗效果 += bonus.治疗效果 || 0;
                    totalBonus.成功率 += bonus.成功率提升 || 0;
                    totalBonus.冷却减少 += bonus.冷却减少 || 0;
                    totalBonus.消耗减少 += bonus.治疗消耗减少 || 0;
                }
            }
        }
    
        // 检查消耗
        const actualCost = {};
        for (const [item, amount] of Object.entries(healMethod.消耗)) {
            actualCost[item] = Math.floor(amount * (1 - totalBonus.消耗减少));
            if (item === "魔力") {
                if (worldData.属性.魔力值 < actualCost[item]) {
                    e.reply(`魔力不足,需要${actualCost[item]}点魔力！`);
                    return;
                }
            } else {
                if (!worldData.背包.药水[item] || worldData.背包.药水[item] < actualCost[item]) {
                    e.reply(`缺少${item} x${actualCost[item]}！`);
                    return;
                }
            }
        }
    
        // 执行治愈
        const success = Math.random() < (healMethod.成功率 + totalBonus.成功率);
        if (!success) {
            // 仅扣除一半消耗
            for (const [item, amount] of Object.entries(actualCost)) {
                if (item === "魔力") {
                    worldData.属性.魔力值 -= Math.floor(amount / 2);
                } else {
                    worldData.背包.药水[item] -= Math.floor(amount / 2);
                }
            }
            
            await redis.set(`user:${userId}`, JSON.stringify(worldData));
            await saveUserData(userId, worldData);
            
            e.reply("治愈失败,但只消耗了一半材料...");
            return;
        }
    
        // 扣除消耗
        for (const [item, amount] of Object.entries(actualCost)) {
            if (item === "魔力") {
                worldData.属性.魔力值 -= amount;
            } else {
                worldData.背包.药水[item] -= amount;
            }
        }
    
        // 计算治愈效果
        const healAmount = Math.floor(healMethod.效果.生命恢复 * totalBonus.治疗效果);
        targetData.属性.生命值 = Math.min(100, targetData.属性.生命值 + healAmount);
    
        // 移除负面状态
        if (targetData.状态.负面状态) {
            targetData.状态.负面状态 = targetData.状态.负面状态.filter(
                status => !healMethod.效果.状态恢复.includes(status)
            );
        }
    
        // 添加特殊效果
        if (healMethod.效果.额外效果) {
            if (!targetData.状态.增益效果) targetData.状态.增益效果 = [];
            for (const effect of healMethod.效果.额外效果) {
                const specialEffect = healingSystem.specialEffects[effect];
                targetData.状态.增益效果.push({
                    名称: effect,
                    效果: specialEffect.效果,
                    结束时间: Date.now() + specialEffect.持续时间
                });
            }
        }
    
        // 设置冷却时间
        const actualCooldown = Math.floor(healMethod.冷却时间 * (1 - totalBonus.冷却减少));
        await redis.set(`cooldown:heal:${userId}`, Date.now() + actualCooldown);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
        if (targetId !== userId) {
            await redis.set(`world:user:${targetId}`, JSON.stringify(targetData));
            await saveUserData(targetId, targetData);
        }
    
        // 生成治愈报告
        const healReport = [
            `〓 治愈报告 〓\n`,
            `治愈目标: ${targetData.名字 || "魔法少女"}`,
            `\n治愈效果:`,
            `❤️ 生命恢复: ${healAmount}`,
            targetData.状态.负面状态?.length === 0 ? 
                `✨ 已清除所有负面状态` :
                `⚠️ 剩余负面状态: ${targetData.状态.负面状态?.join('、') || "无"}`,
            healMethod.效果.额外效果 ? 
                `\n获得特殊效果:\n${healMethod.效果.额外效果.map(effect => 
                    `- ${effect}: ${healingSystem.specialEffects[effect].效果}`
                ).join('\n')}` : "",
            `\n消耗:`,
            ...Object.entries(actualCost).map(([item, amount]) => 
                `- ${item}: ${amount}`
            ),
            `\n当前状态:`,
            `❤️ 生命值: ${targetData.属性.生命值}/100`,
            `✨ 魔力值: ${worldData.属性.魔力值}/100`,
            `\n💡 治愈冷却时间: ${actualCooldown/1000}秒`
        ].join('\n');
    
        e.reply(healReport);
    }
    async practiceMagic(e) {
        // 基础校验部分保持不变
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 魔法修炼系统
        const magicPracticeSystem = {
            // 修炼场所
            locations: {
                "魔法少女学院": {
                    等级要求: 1,
                    魔力消耗: 20,
                    基础经验: 30,
                    特殊效果: "魔力亲和提升",
                    场景描述: [
                        "在充满魔力的教室里专心练习魔法",
                        "和其他魔法少女一起研究新的魔法",
                        "在图书馆翻阅古老的魔法书籍"
                    ],
                    随机事件: {
                        "遇到魔法老师": {
                            概率: 0.2,
                            效果: "经验获取翻倍",
                            描述: "老师亲自指导魔法练习"
                        },
                        "结识新朋友": {
                            概率: 0.3,
                            效果: "获得友情点数",
                            描述: "和其他魔法少女成为了好朋友"
                        }
                    },
                    奖励道具: {
                        "魔法课堂笔记": 0.3,
                        "魔力糖果": 0.2,
                        "可爱发饰": 0.1
                    }
                },
                "星光花园": {
                    等级要求: 10,
                    魔力消耗: 35,
                    基础经验: 50,
                    特殊效果: "星光祝福",
                    场景描述: [
                        "在满天星光下练习魔法",
                        "和小动物们一起感受自然的魔力",
                        "在花丛中冥想提升魔力"
                    ],
                    随机事件: {
                        "遇到花仙子": {
                            概率: 0.2,
                            效果: "获得自然亲和",
                            描述: "花仙子教授了神秘的自然魔法"
                        },
                        "星光共鸣": {
                            概率: 0.3,
                            效果: "魔力恢复加快",
                            描述: "与星光产生了奇妙的共鸣"
                        }
                    },
                    奖励道具: {
                        "星光碎片": 0.3,
                        "魔法花朵": 0.2,
                        "星星发卡": 0.1
                    }
                },
                "梦幻阁楼": {
                    等级要求: 20,
                    魔力消耗: 50,
                    基础经验: 80,
                    特殊效果: "梦境加持",
                    场景描述: [
                        "在梦幻般的房间里练习高级魔法",
                        "透过魔法镜研究新的魔法组合",
                        "和闺蜜一起探讨魔法心得"
                    ],
                    随机事件: {
                        "梦境启示": {
                            概率: 0.2,
                            效果: "领悟新魔法",
                            描述: "在梦中获得了神奇的魔法灵感"
                        },
                        "魔法茶会": {
                            概率: 0.3,
                            效果: "恢复全部魔力",
                            描述: "参加了一场温馨的魔法茶会"
                        }
                    },
                    奖励道具: {
                        "梦境结晶": 0.3,
                        "魔法蛋糕": 0.2,
                        "可爱饰品": 0.1
                    }
                }
            },
    
            // 修炼方式
            methods: {
                "普通修炼": {
                    效率: 1.0,
                    魔力消耗: 1.0,
                    描述: [
                        "摆出可爱姿势施展魔法",
                        "哼唱魔法咒语",
                        "画出漂亮的魔法阵"
                    ],
                    特殊效果: {
                        "魅力提升": 1,
                        "幸运加成": 0.1
                    }
                },
                "认真修炼": {
                    效率: 1.2,
                    魔力消耗: 1.2,
                    描述: [
                        "专心致志地练习魔法",
                        "仔细研究魔法原理",
                        "记录魔法心得"
                    ],
                    特殊效果: {
                        "经验加成": 0.2,
                        "熟练度提升": 0.1
                    }
                },
                "梦幻修炼": {
                    效率: 1.5,
                    魔力消耗: 1.5,
                    描述: [
                        "沉浸在梦幻的魔法世界中",
                        "尝试创造新的魔法",
                        "追求完美的魔法表现"
                    ],
                    特殊效果: {
                        "魔力亲和": 0.3,
                        "灵感提升": 0.2
                    }
                }
            },
    
            // 心情系统
            moods: {
                "开心": {
                    效率加成: 0.2,
                    幸运提升: 0.1,
                    描述: "心情愉悦,修炼效果更好"
                },
                "普通": {
                    效率加成: 0,
                    幸运提升: 0,
                    描述: "心情平静,正常修炼"
                },
                "疲惫": {
                    效率加成: -0.1,
                    幸运提升: -0.1,
                    描述: "稍显疲惫,需要休息"
                }
            },
    
            // 成长系统
            growth: {
                "魔法亲和": {
                    经验要求: 1000,
                    效果: "魔力消耗降低10%",
                    描述: "对魔法的理解更深了"
                },
                "魔法天赋": {
                    经验要求: 2000,
                    效果: "魔法威力提升15%",
                    描述: "魔法天赋逐渐显现"
                },
                "魔法精通": {
                    经验要求: 5000,
                    效果: "解锁高级魔法",
                    描述: "成为了优秀的魔法少女"
                }
            }
        };
    
        // 解析修炼指令
        const practiceInfo = e.msg.replace('#修炼魔法', '').trim().split(' ');
        const location = practiceInfo[0] || "魔法少女学院";
        const method = practiceInfo[1] || "普通修炼";
    
        // 检查场所和修炼方式
        const locationInfo = magicPracticeSystem.locations[location];
        const methodInfo = magicPracticeSystem.methods[method];
        if (!locationInfo || !methodInfo) {
            let guide = ["〓 魔法少女修炼指南 〓\n"];
            guide.push("可选修炼场所:");
            for (const [name, info] of Object.entries(magicPracticeSystem.locations)) {
                guide.push(
                    `🌟 ${name}`,
                    `  等级要求: ${info.等级要求}`,
                    `  魔力消耗: ${info.魔力消耗}`,
                    `  特殊效果: ${info.特殊效果}`,
                    ""
                );
            }
            guide.push("修炼方式:");
            for (const [name, info] of Object.entries(magicPracticeSystem.methods)) {
                guide.push(
                    `✨ ${name}`,
                    `  效率: ${info.效率}`,
                    `  魔力消耗: ${info.魔力消耗}`,
                    ""
                );
            }
            guide.push(
                "💡 使用方法: #修炼魔法 场所 方式",
                "例如: #修炼魔法 魔法少女学院 普通修炼"
            );
            e.reply(guide.join('\n'));
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < locationInfo.等级要求) {
            e.reply(`等级不足哦~需要达到${locationInfo.等级要求}级才能在这里修炼呢~`);
            return;
        }
    
        // 计算实际消耗和收益
        const mood = determineCurrentMood(worldData);
        const moodInfo = magicPracticeSystem.moods[mood];
        const actualCost = Math.floor(locationInfo.魔力消耗 * methodInfo.魔力消耗);
        
        if (worldData.属性.魔力值 < actualCost) {
            e.reply(`魔力不足呢~需要${actualCost}点魔力才能继续修炼哦~`);
            return;
        }
    
        // 执行修炼逻辑
        const practiceResult = await executePractice(worldData, locationInfo, methodInfo, moodInfo);
    
        // 更新数据
        worldData.属性.魔力值 -= actualCost;
        worldData.经验值 += practiceResult.经验;
        worldData.魔法熟练度 = (worldData.魔法熟练度 || 0) + practiceResult.熟练度;
    
        // 检查成长
        const growthResult = checkGrowth(worldData, magicPracticeSystem.growth);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成修炼报告
        const report = generatePracticeReport(practiceResult, growthResult, locationInfo, methodInfo, moodInfo);
        e.reply(report);
    }
    
    async joinMagicRitual(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }

        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 魔法仪式系统
        const ritualSystem = {
            // 仪式场地
            locations: {
                "星光祭坛": {
                    等级要求: 10,
                    魔力消耗: 50,
                    材料消耗: {
                        "星光碎片": 3,
                        "魔法结晶": 2
                    },
                    成功率: 0.8,
                    特殊效果: "星光祝福",
                    解锁条件: "完成星光仪式入门任务"
                },
                "月华圣殿": {
                    等级要求: 20,
                    魔力消耗: 80,
                    材料消耗: {
                        "月光精华": 3,
                        "圣光宝石": 2
                    },
                    成功率: 0.7,
                    特殊效果: "月光加持",
                    解锁条件: "获得月光祭司认可"
                },
                "梦境神殿": {
                    等级要求: 30,
                    魔力消耗: 120,
                    材料消耗: {
                        "梦境碎片": 4,
                        "神圣结晶": 3
                    },
                    成功率: 0.6,
                    特殊效果: "梦境祝福",
                    解锁条件: "觉醒梦境之力"
                }
            },
    
            // 仪式类型
            types: {
                "净化仪式": {
                    效果: "清除负面状态",
                    持续时间: 3600000, // 1小时
                    额外奖励: {
                        "净化之光": 0.3,
                        "祝福碎片": 0.2
                    }
                },
                "强化仪式": {
                    效果: "提升属性",
                    持续时间: 7200000, // 2小时
                    额外奖励: {
                        "强化精华": 0.3,
                        "力量结晶": 0.2
                    }
                },
                "祝福仪式": {
                    效果: "增加幸运",
                    持续时间: 10800000, // 3小时
                    额外奖励: {
                        "幸运之星": 0.3,
                        "祝福之泪": 0.2
                    }
                }
            },
    
            // 仪式效果
            effects: {
                "星光祝福": {
                    属性加成: {
                        魔法攻击: 20,
                        魔法防御: 15
                    },
                    特殊效果: "施法速度提升20%"
                },
                "月光加持": {
                    属性加成: {
                        生命上限: 30,
                        魔力恢复: 25
                    },
                    特殊效果: "治疗效果提升30%"
                },
                "梦境祝福": {
                    属性加成: {
                        全属性: 15,
                        暴击率: 10
                    },
                    特殊效果: "技能冷却减少15%"
                }
            }
        };
    
        // 解析仪式指令
        const ritualInfo = e.msg.replace('#参加魔法仪式', '').trim().split(' ');
        const location = ritualInfo[0];
        const type = ritualInfo[1] || "净化仪式";
    
        // 如果没有指定地点,显示可用仪式场地
        if (!location) {
            let ritualGuide = ["〓 魔法仪式指南 〓\n"];
            for (const [name, info] of Object.entries(ritualSystem.locations)) {
                ritualGuide.push(
                    `🏛️ ${name}`,
                    `  等级要求: ${info.等级要求}`,
                    `  魔力消耗: ${info.魔力消耗}`,
                    `  成功率: ${info.成功率 * 100}%`,
                    `  特殊效果: ${info.特殊效果}`,
                    `  解锁条件: ${info.解锁条件}`,
                    `  需要材料:`,
                    ...Object.entries(info.材料消耗).map(([item, amount]) => 
                        `    - ${item} x${amount}`
                    ),
                    ""
                );
            }
    
            ritualGuide.push(
                "可选仪式类型:",
                ...Object.entries(ritualSystem.types).map(([name, info]) => 
                    `- ${name}: ${info.效果} (持续${info.持续时间/3600000}小时)`
                ),
                "\n💡 使用方法: #参加魔法仪式 场地名称 仪式类型",
                "例如: #参加魔法仪式 星光祭坛 净化仪式"
            );
    
            e.reply(ritualGuide.join('\n'));
            return;
        }
    
        // 检查场地是否存在和解锁
        const locationInfo = ritualSystem.locations[location];
        if (!locationInfo) {
            e.reply("该仪式场地不存在！");
            return;
        }
    
        // 检查解锁条件
        if (!checkRitualUnlock(worldData, locationInfo.解锁条件)) {
            e.reply(`你还未解锁该仪式场地！需要${locationInfo.解锁条件}`);
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < locationInfo.等级要求) {
            e.reply(`等级不足,需要达到${locationInfo.等级要求}级！`);
            return;
        }
    
        // 检查仪式类型
        const typeInfo = ritualSystem.types[type];
        if (!typeInfo) {
            e.reply("无效的仪式类型！");
            return;
        }
    
        // 检查魔力是否足够
        if (worldData.属性.魔力值 < locationInfo.魔力消耗) {
            e.reply(`魔力不足,需要${locationInfo.魔力消耗}点魔力！`);
            return;
        }
    
        // 检查材料是否足够
        let insufficientItems = [];
        for (const [item, amount] of Object.entries(locationInfo.材料消耗)) {
            if (!worldData.背包.材料[item] || worldData.背包.材料[item] < amount) {
                const current = worldData.背包.材料[item] || 0;
                insufficientItems.push(`${item}(差${amount - current})`);
            }
        }
        if (insufficientItems.length > 0) {
            e.reply(`仪式所需材料不足：\n${insufficientItems.join('\n')}`);
            return;
        }
    
        // 扣除材料和魔力
        worldData.属性.魔力值 -= locationInfo.魔力消耗;
        for (const [item, amount] of Object.entries(locationInfo.材料消耗)) {
            worldData.背包.材料[item] -= amount;
        }
    
        // 执行仪式
        const success = Math.random() < locationInfo.成功率;
        if (!success) {
            await redis.set(`user:${userId}`, JSON.stringify(worldData));
            await saveUserData(userId, worldData);
            e.reply("仪式失败了...材料和魔力消耗已扣除。");
            return;
        }
    
        // 应用仪式效果
        const effect = ritualSystem.effects[locationInfo.特殊效果];
        for (const [attr, value] of Object.entries(effect.属性加成)) {
            if (attr === "全属性") {
                for (const baseAttr of ["攻击力", "防御力", "魔法攻击", "魔法防御", "速度"]) {
                    worldData.属性[baseAttr] = Math.floor(worldData.属性[baseAttr] * (1 + value/100));
                }
            } else {
                worldData.属性[attr] = (worldData.属性[attr] || 0) + value;
            }
        }
    
        // 添加特殊效果
        if (!worldData.状态.增益效果) worldData.状态.增益效果 = [];
        worldData.状态.增益效果.push({
            名称: locationInfo.特殊效果,
            效果: effect.特殊效果,
            结束时间: Date.now() + typeInfo.持续时间
        });
    
        // 获得额外奖励
        let rewards = [];
        for (const [item, chance] of Object.entries(typeInfo.额外奖励)) {
            if (Math.random() < chance) {
                if (!worldData.背包.材料[item]) {
                    worldData.背包.材料[item] = 0;
                }
                worldData.背包.材料[item]++;
                rewards.push(item);
            }
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成仪式报告
        const ritualReport = [
            `〓 魔法仪式报告 〓\n`,
            `🏛️ 仪式场地: ${location}`,
            `✨ 仪式类型: ${type}`,
            `\n仪式效果:`,
            `🌟 ${locationInfo.特殊效果}`,
            ...Object.entries(effect.属性加成).map(([attr, value]) =>
                `- ${attr}+${value}`
            ),
            `- ${effect.特殊效果}`,
            `\n持续时间: ${typeInfo.持续时间/3600000}小时`,
            rewards.length > 0 ? `\n✨ 获得额外奖励:\n${rewards.map(item => `- ${item}`).join('\n')}` : "",
            `\n消耗:`,
            `✨ 魔力: ${locationInfo.魔力消耗}`,
            ...Object.entries(locationInfo.材料消耗).map(([item, amount]) =>
                `- ${item} x${amount}`
            ),
            `\n当前状态:`,
            `✨ 魔力值: ${worldData.属性.魔力值}`,
            `\n💡 提示: 不同的仪式场地会带来不同的特殊效果哦！`
        ].join('\n');
    
        e.reply(ritualReport);
    }
    
    async showCharacterInfo(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 角色信息展示系统
        const characterSystem = {
            // 基础属性展示
            basicInfo: {
                "个人信息": {
                    items: ["名字", "职业", "等级", "称号"],
                    icons: ["👤", "💼", "⭐", "👑"]
                },
                "状态数值": {
                    items: ["生命值", "魔力值", "体力值", "饱食度"],
                    icons: ["❤️", "✨", "💪", "🍖"]
                },
                "战斗属性": {
                    items: ["物理攻击", "魔法攻击", "物理防御", "魔法防御"],
                    icons: ["⚔️", "🔮", "🛡️", "🌟"]
                },
                "特殊属性": {
                    items: ["幸运值", "魅力值", "敏捷值", "魔法亲和"],
                    icons: ["🍀", "💝", "💨", "✨"]
                }
            },
    
            // 成长系统展示
            growthSystem: {
                "等级成长": (level) => ({
                    经验加成: level * 0.1,
                    属性加成: level * 0.05,
                    技能点数: Math.floor(level / 5)
                }),
                "技能熟练": (skills) => {
                    let masterCount = 0;
                    skills?.forEach(skill => {
                        if (skill.level >= 10) masterCount++;
                    });
                    return {
                        已掌握: masterCount,
                        总技能数: skills?.length || 0,
                        特殊加成: masterCount * 0.1
                    };
                }
            },
    
            // 成就系统展示
            achievementSystem: {
                "初心者": "完成新手教程",
                "魔法师学徒": "学会3个魔法",
                "舞蹈精灵": "学会3个舞蹈",
                "交际达人": "好感度超过100的NPC达到3个",
                "收藏家": "收集30种不同物品",
                "探险家": "探索所有地图区域"
            },
    
            // 装备展示系统
            equipmentDisplay: {
                "武器": "🗡️",
                "防具": "🛡️",
                "饰品": "💍",
                "法器": "📿"
            },
    
            // 状态效果展示
            statusEffects: {
                "正面效果": "🟢",
                "负面效果": "🔴",
                "中性效果": "⚪"
            }
        };
    
        // 计算角色综合评分
        const calculateCharacterScore = (data) => {
            let score = 0;
            // 基础分数
            score += data.等级 * 100;
            // 属性分数
            score += Object.values(data.属性).reduce((a, b) => a + b, 0);
            // 技能分数
            score += data.技能?.reduce((acc, skill) => acc + skill.level * 50, 0) || 0;
            // 成就分数
            score += Object.keys(data.成就 || {}).length * 200;
            // 装备分数
            score += Object.values(data.装备 || {}).length * 150;
            return Math.floor(score);
        };
    
        // 获取角色特殊状态
        const getSpecialStatus = (data) => {
            let status = [];
            if (data.状态.变身) status.push("魔法少女形态");
            if (data.状态.增益效果?.length > 0) {
                status.push(...data.状态.增益效果.map(effect => effect.名称));
            }
            return status;
        };
    
        // 生成角色信息报告
        const generateCharacterReport = (data) => {
            const score = calculateCharacterScore(data);
            const specialStatus = getSpecialStatus(data);
            const growth = characterSystem.growthSystem["等级成长"](data.等级);
            const skillInfo = characterSystem.growthSystem["技能熟练"](data.技能);
    
            let report = [
                `〓 ${data.名字 || "魔法少女"}的个人信息 〓\n`,
                `🎭 综合评分: ${score}`,
                `\n== 基础信息 ==`
            ];
    
            // 添加基础信息
            for (const [category, info] of Object.entries(characterSystem.basicInfo)) {
                report.push(`\n${category}:`);
                info.items.forEach((item, index) => {
                    const value = data[item] || data.属性?.[item] || "未知";
                    report.push(`${info.icons[index]} ${item}: ${value}`);
                });
            }
    
            // 添加成长信息
            report.push(
                `\n== 成长信息 ==`,
                `📈 经验加成: +${(growth.经验加成 * 100).toFixed(1)}%`,
                `💪 属性加成: +${(growth.属性加成 * 100).toFixed(1)}%`,
                `🎯 可用技能点: ${growth.技能点数}`,
                `\n技能掌握:`,
                `✨ 已掌握: ${skillInfo.已掌握}/${skillInfo.总技能数}`,
                `🌟 技能加成: +${(skillInfo.特殊加成 * 100).toFixed(1)}%`
            );
    
            // 添加装备信息
            report.push(`\n== 装备信息 ==`);
            for (const [slot, icon] of Object.entries(characterSystem.equipmentDisplay)) {
                const equipment = data.装备?.[slot] || "无";
                report.push(`${icon} ${slot}: ${equipment}`);
            }
    
            // 添加状态信息
            if (specialStatus.length > 0) {
                report.push(
                    `\n== 特殊状态 ==`,
                    ...specialStatus.map(status => `✨ ${status}`)
                );
            }
    
            // 添加成就信息
            const achievements = Object.entries(characterSystem.achievementSystem)
                .filter(([name]) => data.成就?.includes(name));
            if (achievements.length > 0) {
                report.push(
                    `\n== 获得成就 ==`,
                    ...achievements.map(([name, desc]) => `🏆 ${name}: ${desc}`)
                );
            }
    
            // 添加提示信息
            report.push(
                `\n💡 提示:`,
                `1. 使用 #升级属性 可以提升个人属性`,
                `2. 使用 #学习技能 可以学习新技能`,
                `3. 完成成就可以获得特殊奖励`
            );
    
            return report.join('\n');
        };
    
        // 发送角色信息
        e.reply(generateCharacterReport(worldData));
    }

    async learnNewSkill(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 技能学习系统
        const skillSystem = {
            // 基础技能
            基础技能: {
                "优雅舞步": {
                    类型: "舞蹈",
                    消耗: { 魔力: 15, 金币: 100 },
                    学习要求: { 等级: 1, 魅力值: 10 },
                    效果: "跳舞时魅力加成",
                    加成值: 10,
                    冷却: 3000, // 3秒
                    描述: "基础的舞蹈技巧",
                    进阶技能: ["华丽旋转", "星光舞步"]
                },
                "甜点制作": {
                    类型: "生活",
                    消耗: { 魔力: 10, 金币: 80 },
                    学习要求: { 等级: 1, 魅力值: 5 },
                    效果: "制作美味点心",
                    加成值: 8,
                    冷却: 5000, // 5秒
                    描述: "制作简单的甜点",
                    进阶技能: ["魔法甜点", "星光蛋糕"]
                }
            },
    
            // 进阶技能
            进阶技能: {
                "华丽旋转": {
                    类型: "舞蹈",
                    消耗: { 魔力: 25, 金币: 300 },
                    学习要求: { 等级: 10, 魅力值: 30 },
                    前置技能: "优雅舞步",
                    效果: "跳舞时大幅提升魅力",
                    加成值: 25,
                    冷却: 8000,
                    描述: "优美的旋转舞步",
                    进阶技能: ["星光华尔兹"]
                },
                "魔法甜点": {
                    类型: "生活",
                    消耗: { 魔力: 20, 金币: 250 },
                    学习要求: { 等级: 10, 魅力值: 25 },
                    前置技能: "甜点制作",
                    效果: "制作带有魔法效果的点心",
                    加成值: 20,
                    冷却: 10000,
                    描述: "注入魔力的特殊甜点",
                    进阶技能: ["星光糖果"]
                }
            },
    
            // 高级技能
            高级技能: {
                "星光华尔兹": {
                    类型: "舞蹈",
                    消耗: { 魔力: 50, 金币: 800 },
                    学习要求: { 等级: 30, 魅力值: 80 },
                    前置技能: "华丽旋转",
                    效果: "跳舞时产生星光效果",
                    加成值: 50,
                    冷却: 15000,
                    描述: "散发星光的梦幻舞步",
                    特殊效果: "夜间魅力加成翻倍"
                },
                "星光糖果": {
                    类型: "生活",
                    消耗: { 魔力: 40, 金币: 600 },
                    学习要求: { 等级: 30, 魅力值: 70 },
                    前置技能: "魔法甜点",
                    效果: "制作星光闪耀的糖果",
                    加成值: 40,
                    冷却: 20000,
                    描述: "充满星光能量的梦幻糖果",
                    特殊效果: "食用后获得星光祝福"
                }
            }
        };
    
        // 技能熟练度系统
        const proficiencySystem = {
            经验获得: {
                使用: 10,
                完美使用: 20,
                教导他人: 15
            },
            等级提升: {
                基础: { 经验: 100, 属性加成: 0.1 },
                熟练: { 经验: 300, 属性加成: 0.2 },
                精通: { 经验: 600, 属性加成: 0.3 },
                大师: { 经验: 1000, 属性加成: 0.5 }
            }
        };
    
        // 技能组合效果
        const skillCombination = {
            "优雅舞步+甜点制作": {
                名称: "下午茶派对",
                效果: "举办派对时魅力加成翻倍",
                解锁条件: "两个技能都达到5级"
            },
            "华丽旋转+魔法甜点": {
                名称: "魔法舞会",
                效果: "参加舞会时获得双倍经验",
                解锁条件: "两个技能都达到8级"
            },
            "星光华尔兹+星光糖果": {
                名称: "星光庆典",
                效果: "举办派对时所有参与者获得星光祝福",
                解锁条件: "两个技能都达到10级"
            }
        };
    
        // 解析学习指令
        const skillName = e.msg.replace('#学习新技能', '').trim();
    
        // 如果没有指定技能名称,显示可学习技能列表
        if (!skillName) {
            let skillList = ["〓 可学习的技能 〓\n"];
            
            // 遍历所有技能类别
            for (const [category, skills] of Object.entries(skillSystem)) {
                skillList.push(`== ${category} ==`);
                for (const [name, info] of Object.entries(skills)) {
                    const canLearn = worldData.等级 >= info.学习要求.等级 && 
                                    worldData.属性.魅力值 >= info.学习要求.魅力值;
                    
                    // 检查前置技能
                    let meetsPrerequisite = true;
                    if (info.前置技能) {
                        const prereqSkill = worldData.技能?.find(s => s.name === info.前置技能);
                        meetsPrerequisite = prereqSkill && prereqSkill.level >= 5;
                    }
    
                    skillList.push(
                        `${canLearn && meetsPrerequisite ? "✨" : "❌"} ${name}`,
                        `  类型: ${info.类型}`,
                        `  效果: ${info.效果}`,
                        `  加成值: ${info.加成值}`,
                        `  魔力消耗: ${info.消耗.魔力}`,
                        `  学习费用: ${info.消耗.金币}金币`,
                        `  要求等级: ${info.学习要求.等级}`,
                        `  要求魅力值: ${info.学习要求.魅力值}`,
                        info.前置技能 ? `  需要先学会: ${info.前置技能}` : "",
                        `  描述: ${info.描述}\n`
                    );
                }
            }
    
            // 显示已掌握的技能组合
            if (worldData.技能?.length >= 2) {
                skillList.push("== 技能组合 ==");
                for (const [combo, info] of Object.entries(skillCombination)) {
                    const skills = combo.split('+');
                    const hasSkills = skills.every(skill => 
                        worldData.技能.find(s => s.name === skill)
                    );
                    if (hasSkills) {
                        skillList.push(
                            `✨ ${info.名称}`,
                            `  需要技能: ${skills.join(' + ')}`,
                            `  效果: ${info.效果}`,
                            `  解锁条件: ${info.解锁条件}\n`
                        );
                    }
                }
            }
    
            skillList.push(
                "💡 学习技能指令: #学习新技能 技能名称",
                "例如: #学习新技能 优雅舞步"
            );
            e.reply(skillList.join('\n'));
            return;
        }
    
        // 查找技能信息
        let skillInfo = null;
        let skillCategory = null;
        for (const [category, skills] of Object.entries(skillSystem)) {
            if (skills[skillName]) {
                skillInfo = skills[skillName];
                skillCategory = category;
                break;
            }
        }
    
        if (!skillInfo) {
            e.reply("未找到该技能,请检查技能名称是否正确！");
            return;
        }
    
        // 检查是否已学习
        if (worldData.技能?.find(s => s.name === skillName)) {
            e.reply("你已经学会这个技能了！");
            return;
        }
    
        // 检查前置技能
        if (skillInfo.前置技能) {
            const prereqSkill = worldData.技能?.find(s => s.name === skillInfo.前置技能);
            if (!prereqSkill || prereqSkill.level < 5) {
                e.reply(`需要先将${skillInfo.前置技能}提升到5级才能学习这个技能！`);
                return;
            }
        }
    
        // 检查等级要求
        if (worldData.等级 < skillInfo.学习要求.等级) {
            e.reply(`等级不足,学习该技能需要达到${skillInfo.学习要求.等级}级！`);
            return;
        }
    
        // 检查魅力值要求
        if (worldData.属性.魅力值 < skillInfo.学习要求.魅力值) {
            e.reply(`魅力值不足,学习该技能需要${skillInfo.学习要求.魅力值}点魅力值！`);
            return;
        }
    
        // 检查金币是否足够
        if (worldData.背包.金币 < skillInfo.消耗.金币) {
            e.reply(`金币不足,学习该技能需要${skillInfo.消耗.金币}金币！`);
            return;
        }
    
        // 扣除金币
        worldData.背包.金币 -= skillInfo.消耗.金币;
    
        // 学习技能
        if (!worldData.技能) worldData.技能 = [];
        worldData.技能.push({
            name: skillName,
            type: skillInfo.类型,
            level: 1,
            exp: 0,
            nextLevelExp: proficiencySystem.等级提升.基础.经验
        });
    
        // 检查技能组合
        let unlockedCombos = [];
        for (const [combo, info] of Object.entries(skillCombination)) {
            const skills = combo.split('+');
            if (skills.every(skill => worldData.技能.find(s => s.name === skill))) {
                const meetsLevel = skills.every(skill => {
                    const s = worldData.技能.find(s => s.name === skill);
                    return s.level >= parseInt(info.解锁条件.match(/\d+/)[0]);
                });
                if (meetsLevel) {
                    unlockedCombos.push({
                        名称: info.名称,
                        效果: info.效果
                    });
                }
            }
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成学习报告
        const learnReport = [
            `〓 技能学习成功 〓\n`,
            `✨ 学会了${skillCategory}: ${skillName}`,
            `\n技能信息:`,
            `  类型: ${skillInfo.类型}`,
            `  效果: ${skillInfo.效果}`,
            `  基础加成: ${skillInfo.加成值}`,
            `  魔力消耗: ${skillInfo.消耗.魔力}`,
            `  冷却时间: ${skillInfo.冷却/1000}秒`,
            skillInfo.特殊效果 ? `  特殊效果: ${skillInfo.特殊效果}` : "",
            `\n消耗:`,
            `💰 金币: ${skillInfo.消耗.金币}`,
            unlockedCombos.length > 0 ? [
                `\n🎉 解锁技能组合:`,
                ...unlockedCombos.map(combo => 
                    `- ${combo.名称}: ${combo.效果}`
                )
            ].join('\n') : "",
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `✨ 已学技能数: ${worldData.技能.length}`,
            `\n💡 提示:`,
            `1. 使用技能可以获得熟练度`,
            `2. 技能等级越高,效果越好`,
            `3. 某些技能可以组合使用获得特殊效果`
        ].join('\n');
    
        e.reply(learnReport);
    }

    async interactWithCharacter(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 互动系统
        const interactionSystem = {
            // 互动场景
            locations: {
                "魔法学院": {
                    npcList: ["教师莉莉", "图书管理员艾米", "学生会长索菲亚"],
                    topics: ["魔法研究", "校园生活", "学习经验"],
                    specialEvents: {
                        "午间茶话": { 
                            time: "12:00-13:00",
                            affectionGain: 1.5
                        },
                        "晚间研讨": {
                            time: "19:00-21:00", 
                            affectionGain: 2.0
                        }
                    }
                },
                "花园咖啡厅": {
                    npcList: ["咖啡师安娜", "甜点师蒂娜", "服务生露西"],
                    topics: ["咖啡制作", "甜点烘焙", "店铺经营"],
                    specialEvents: {
                        "下午茶时光": {
                            time: "14:00-16:00",
                            affectionGain: 1.8
                        },
                        "甜点品鉴": {
                            time: "15:00-17:00",
                            affectionGain: 1.6
                        }
                    }
                }
            },
    
            // 互动方式
            methods: {
                "闲聊": {
                    cost: { stamina: 5 },
                    baseAffection: 2,
                    topics: ["天气", "兴趣爱好", "日常生活"],
                    successRate: 0.9
                },
                "送礼": {
                    cost: { gold: 100 },
                    baseAffection: 5,
                    gifts: {
                        "手工饰品": ["项链", "手链", "发饰"],
                        "美食": ["蛋糕", "曲奇", "巧克力"],
                        "书籍": ["魔法书", "小说", "诗集"]
                    },
                    successRate: 0.8
                },
                "邀请": {
                    cost: { gold: 200, stamina: 10 },
                    baseAffection: 8,
                    activities: ["逛街", "看电影", "野餐"],
                    successRate: 0.7
                }
            },
    
            // 情绪系统
            emotions: {
                "开心": {
                    affectionBonus: 1.5,
                    duration: 3600000, // 1小时
                    trigger: ["收到喜欢的礼物", "成功的互动"]
                },
                "难过": {
                    affectionBonus: 0.5,
                    duration: 1800000, // 30分钟
                    trigger: ["互动失败", "不喜欢的话题"]
                },
                "生气": {
                    affectionBonus: 0.2,
                    duration: 3600000, // 1小时
                    trigger: ["不当的言论", "令人不快的行为"]
                }
            }
        };
    
        // 解析互动指令
        const interactionInfo = e.msg.replace('#与角色互动', '').trim().split(' ');
        const targetName = interactionInfo[0];
        const method = interactionInfo[1] || "闲聊";
        const topic = interactionInfo[2];
    
        // 如果没有指定目标,显示可互动对象列表
        if (!targetName) {
            let interactionGuide = ["〓 互动指南 〓\n"];
            
            for (const [location, info] of Object.entries(interactionSystem.locations)) {
                interactionGuide.push(`== ${location} ==`);
                info.npcList.forEach(npc => {
                    const npcData = worldData.npcRelations?.[npc] || { 
                        affection: 0,
                        interactions: 0,
                        lastEmotion: null
                    };
                    interactionGuide.push(
                        `🎀 ${npc}`,
                        `  好感度: ${npcData.affection}`,
                        `  互动次数: ${npcData.interactions}`,
                        npcData.lastEmotion ? `  当前心情: ${npcData.lastEmotion}` : "",
                        ""
                    );
                });
            }
    
            interactionGuide.push(
                "互动方式:",
                ...Object.entries(interactionSystem.methods).map(([name, info]) => 
                    `- ${name}: 消耗${Object.entries(info.cost).map(([type, value]) => 
                        `${type === 'stamina' ? '体力' : '金币'}${value}`).join('/')}`
                ),
                "\n💡 使用方法: #与角色互动 角色名称 互动方式 话题",
                "例如: #与角色互动 教师莉莉 闲聊 魔法研究"
            );
    
            e.reply(interactionGuide.join('\n'));
            return;
        }
    
        // 检查角色是否存在
        let targetLocation = null;
        let targetNPC = null;
        for (const [location, info] of Object.entries(interactionSystem.locations)) {
            if (info.npcList.includes(targetName)) {
                targetLocation = location;
                targetNPC = targetName;
                break;
            }
        }
    
        if (!targetNPC) {
            e.reply("找不到该角色,请检查名字是否正确！");
            return;
        }
    
        // 检查互动方式是否存在
        const methodInfo = interactionSystem.methods[method];
        if (!methodInfo) {
            e.reply("无效的互动方式！");
            return;
        }
    
        // 检查消耗
        if (methodInfo.cost.stamina && worldData.属性.体力值 < methodInfo.cost.stamina) {
            e.reply(`体力不足,需要${methodInfo.cost.stamina}点体力！`);
            return;
        }
        if (methodInfo.cost.gold && worldData.背包.金币 < methodInfo.cost.gold) {
            e.reply(`金币不足,需要${methodInfo.cost.gold}金币！`);
            return;
        }
    
        // 初始化NPC关系数据
        if (!worldData.npcRelations) worldData.npcRelations = {};
        if (!worldData.npcRelations[targetNPC]) {
            worldData.npcRelations[targetNPC] = {
                affection: 0,
                interactions: 0,
                lastEmotion: null,
                lastInteractionTime: 0
            };
        }
    
        // 检查互动冷却
        const lastInteraction = worldData.npcRelations[targetNPC].lastInteractionTime;
        const cooldown = 300000; // 5分钟冷却
        if (Date.now() - lastInteraction < cooldown) {
            const remainTime = Math.ceil((cooldown - (Date.now() - lastInteraction)) / 1000);
            e.reply(`与${targetNPC}的互动还在冷却中,剩余${remainTime}秒！`);
            return;
        }
    
        // 执行互动
        const interactionResult = await executeInteraction(
            worldData,
            targetNPC,
            method,
            topic,
            interactionSystem,
            targetLocation
        );
    
        // 更新数据
        worldData.属性.体力值 -= methodInfo.cost.stamina || 0;
        worldData.背包.金币 -= methodInfo.cost.gold || 0;
        worldData.npcRelations[targetNPC].lastInteractionTime = Date.now();
        worldData.npcRelations[targetNPC].interactions += 1;
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成互动报告
        e.reply(generateInteractionReport(
            worldData,
            targetNPC,
            method,
            interactionResult,
            methodInfo
        ));
    }
    async joinBattle(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 战斗系统
        const battleSystem = {
            // 战斗场地
            battlegrounds: {
                "魔法训练场": {
                    等级要求: 1,
                    难度: "简单",
                    敌人类型: ["训练人偶", "木制靶子"],
                    掉落物: {
                        "魔法碎片": 0.5,
                        "木材": 0.3
                    },
                    经验倍率: 1.0
                },
                "花园迷宫": {
                    等级要求: 10,
                    难度: "普通", 
                    敌人类型: ["花精灵", "迷宫守卫"],
                    掉落物: {
                        "花精灵之翼": 0.4,
                        "魔法花瓣": 0.6
                    },
                    经验倍率: 1.5
                },
                "星光竞技场": {
                    等级要求: 20,
                    难度: "困难",
                    敌人类型: ["星光战士", "魔法傀儡"],
                    掉落物: {
                        "星光结晶": 0.3,
                        "魔力宝石": 0.2
                    },
                    经验倍率: 2.0
                }
            },
    
            // 战斗模式
            battleModes: {
                "练习战": {
                    难度倍率: 0.8,
                    经验倍率: 0.5,
                    失败惩罚: "无"
                },
                "排位战": {
                    难度倍率: 1.2,
                    经验倍率: 1.0,
                    失败惩罚: "排位分数减少"
                },
                "挑战战": {
                    难度倍率: 1.5,
                    经验倍率: 1.5,
                    失败惩罚: "体力大幅消耗"
                }
            },
    
            // 战斗技能
            battleSkills: {
                "星光闪耀": {
                    类型: "魔法攻击",
                    伤害倍率: 1.2,
                    魔力消耗: 20,
                    冷却时间: 3
                },
                "治愈之光": {
                    类型: "治疗",
                    恢复倍率: 1.5,
                    魔力消耗: 30,
                    冷却时间: 5
                },
                "防护结界": {
                    类型: "防御",
                    减伤倍率: 0.5,
                    魔力消耗: 25,
                    冷却时间: 8
                }
            },
    
            // 战斗装备效果
            equipmentEffects: {
                "星光法杖": {
                    攻击加成: 1.3,
                    魔力消耗减免: 0.2
                },
                "月光长袍": {
                    防御加成: 1.2,
                    魔力回复: 10
                },
                "魔法饰品": {
                    暴击率提升: 0.1,
                    技能冷却减少: 0.2
                }
            }
        };
    
        // 解析战斗指令
        const battleInfo = e.msg.replace('#参加战斗', '').trim().split(' ');
        const battleground = battleInfo[0];
        const mode = battleInfo[1] || "练习战";
    
        // 如果没有指定场地,显示战斗指南
        if (!battleground) {
            let battleGuide = ["〓 魔法少女战斗指南 〓\n"];
            
            // 显示可用场地
            battleGuide.push("== 战斗场地 ==");
            for (const [name, info] of Object.entries(battleSystem.battlegrounds)) {
                battleGuide.push(
                    `🏟️ ${name}`,
                    `  等级要求: ${info.等级要求}`,
                    `  难度: ${info.难度}`,
                    `  敌人类型: ${info.敌人类型.join('、')}`,
                    `  可能掉落:`,
                    ...Object.entries(info.掉落物).map(([item, rate]) => 
                        `    - ${item} (${rate * 100}%)`
                    ),
                    `  经验倍率: ${info.经验倍率}x\n`
                );
            }
    
            // 显示战斗模式
            battleGuide.push("== 战斗模式 ==");
            for (const [name, info] of Object.entries(battleSystem.battleModes)) {
                battleGuide.push(
                    `⚔️ ${name}`,
                    `  难度倍率: ${info.难度倍率}x`,
                    `  经验倍率: ${info.经验倍率}x`,
                    `  失败惩罚: ${info.失败惩罚}\n`
                );
            }
    
            battleGuide.push(
                "💡 使用方法: #参加战斗 场地名称 战斗模式",
                "例如: #参加战斗 魔法训练场 练习战"
            );
    
            e.reply(battleGuide.join('\n'));
            return;
        }
    
        // 检查战斗场地是否存在
        const groundInfo = battleSystem.battlegrounds[battleground];
        if (!groundInfo) {
            e.reply("该战斗场地不存在！");
            return;
        }
    
        // 检查战斗模式是否存在
        const modeInfo = battleSystem.battleModes[mode];
        if (!modeInfo) {
            e.reply("该战斗模式不存在！");
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < groundInfo.等级要求) {
            e.reply(`等级不足,需要等级${groundInfo.等级要求}！`);
            return;
        }
    
        // 检查体力和魔力
        if (worldData.属性.体力值 < 30) {
            e.reply("体力不足,无法参加战斗！");
            return;
        }
        if (worldData.属性.魔力值 < 50) {
            e.reply("魔力不足,无法参加战斗！");
            return;
        }
    
        // 生成敌人
        const enemy = generateEnemy(groundInfo, modeInfo);
    
        // 执行战斗
        const battleResult = await executeBattle(worldData, enemy, battleSystem);
    
        // 更新玩家数据
        if (battleResult.胜利) {
            // 计算奖励
            const expGain = Math.floor(
                enemy.经验值 * 
                groundInfo.经验倍率 * 
                modeInfo.经验倍率
            );
            const goldGain = Math.floor(
                enemy.金币 * 
                groundInfo.经验倍率
            );
    
            // 获得物品
            let items = [];
            for (const [item, rate] of Object.entries(groundInfo.掉落物)) {
                if (Math.random() < rate) {
                    if (!worldData.背包.材料[item]) {
                        worldData.背包.材料[item] = 0;
                    }
                    worldData.背包.材料[item]++;
                    items.push(item);
                }
            }
    
            // 更新数据
            worldData.经验值 += expGain;
            worldData.背包.金币 += goldGain;
            worldData.属性.体力值 -= 30;
            worldData.属性.魔力值 -= 50;
    
            // 检查升级
            if (worldData.经验值 >= worldData.升级所需经验) {
                worldData.等级 += 1;
                worldData.经验值 -= worldData.升级所需经验;
                worldData.升级所需经验 = Math.floor(worldData.升级所需经验 * 1.2);
            }
    
        } else {
            // 失败惩罚
            worldData.属性.体力值 -= 50;
            if (modeInfo.失败惩罚 === "排位分数减少") {
                worldData.排位分数 = (worldData.排位分数 || 1000) - 30;
            }
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成战斗报告
        const battleReport = [
            `〓 战斗报告 〓\n`,
            `地点: ${battleground}`,
            `模式: ${mode}`,
            `对手: ${enemy.名称} Lv.${enemy.等级}`,
            `\n战斗过程:`,
            ...battleResult.战斗记录,
            `\n战斗结果: ${battleResult.胜利 ? "胜利！" : "失败..."}`,
            battleResult.胜利 ? [
                `\n获得奖励:`,
                `✨ 经验值+${expGain}`,
                `💰 金币+${goldGain}`,
                items.length > 0 ? `🎁 获得物品: ${items.join('、')}` : ""
            ].join('\n') : "",
            `\n当前状态:`,
            `❤️ 生命值: ${worldData.属性.生命值}`,
            `✨ 魔力值: ${worldData.属性.魔力值}`,
            `💪 体力值: ${worldData.属性.体力值}`,
            `📈 经验值: ${worldData.经验值}/${worldData.升级所需经验}`,
            `💰 金币: ${worldData.背包.金币}`,
            mode === "排位战" ? `🏆 排位分数: ${worldData.排位分数}` : "",
            `\n💡 提示: 不同的战斗场地和模式会带来不同的挑战与奖励！`
        ].join('\n');
    
        e.reply(battleReport);
    }
    
    async collectMaterials(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 材料采集系统
        const materialSystem = {
            // 采集地点
            locations: {
                "魔法花园": {
                    等级要求: 1,
                    体力消耗: 10,
                    基础材料: {
                        "魔法花瓣": { 概率: 0.8, 数量: [1, 3] },
                        "蝴蝶翅膀": { 概率: 0.6, 数量: [1, 2] },
                        "彩虹露珠": { 概率: 0.4, 数量: [1, 2] }
                    },
                    稀有材料: {
                        "幸运四叶草": { 概率: 0.1, 数量: [1, 1] },
                        "星光精华": { 概率: 0.05, 数量: [1, 1] }
                    },
                    特殊效果: "心情愉悦"
                },
                "星光湖畔": {
                    等级要求: 10,
                    体力消耗: 15,
                    基础材料: {
                        "星光水晶": { 概率: 0.7, 数量: [1, 2] },
                        "月光草": { 概率: 0.5, 数量: [1, 3] },
                        "梦境之尘": { 概率: 0.4, 数量: [1, 2] }
                    },
                    稀有材料: {
                        "人鱼之泪": { 概率: 0.1, 数量: [1, 1] },
                        "湖底明珠": { 概率: 0.05, 数量: [1, 1] }
                    },
                    特殊效果: "魔力提升"
                },
                "梦幻森林": {
                    等级要求: 20,
                    体力消耗: 20,
                    基础材料: {
                        "精灵之翼": { 概率: 0.6, 数量: [1, 2] },
                        "魔法蘑菇": { 概率: 0.5, 数量: [1, 3] },
                        "森林果实": { 概率: 0.4, 数量: [1, 2] }
                    },
                    稀有材料: {
                        "独角兽之角": { 概率: 0.08, 数量: [1, 1] },
                        "精灵宝石": { 概率: 0.05, 数量: [1, 1] }
                    },
                    特殊效果: "自然祝福"
                }
            },
    
            // 采集工具
            tools: {
                "可爱小篮子": {
                    效率加成: 0.1,
                    稀有度提升: 0,
                    体力消耗减少: 1,
                    描述: "装满可爱心意的小篮子"
                },
                "星光采集包": {
                    效率加成: 0.2,
                    稀有度提升: 0.05,
                    体力消耗减少: 2,
                    描述: "闪耀着星光的魔法包包"
                },
                "梦境收集器": {
                    效率加成: 0.3,
                    稀有度提升: 0.1,
                    体力消耗减少: 3,
                    描述: "能收集梦境碎片的神奇道具"
                }
            },
    
            // 采集技能
            skills: {
                "温柔采集": {
                    等级加成: 0.05,
                    稀有度提升: 0.02,
                    描述: "温柔地采集不会伤害到植物"
                },
                "精灵之语": {
                    等级加成: 0.08,
                    体力消耗减少: 1,
                    描述: "与自然精灵对话,获得帮助"
                },
                "梦境感知": {
                    等级加成: 0.1,
                    稀有度提升: 0.05,
                    描述: "能感知到稀有材料的位置"
                }
            },
    
            // 特殊事件
            events: {
                "遇见小精灵": {
                    概率: 0.1,
                    效果: "采集效率翻倍",
                    持续时间: 300000 // 5分钟
                },
                "彩虹降临": {
                    概率: 0.05,
                    效果: "稀有材料概率提升50%",
                    持续时间: 600000 // 10分钟
                },
                "魔法时刻": {
                    概率: 0.03,
                    效果: "必定获得稀有材料",
                    持续时间: 60000 // 1分钟
                }
            }
        };
    
        // 解析采集指令
        const collectInfo = e.msg.replace('#采集素材', '').trim();
        const location = collectInfo || "魔法花园";
    
        // 检查采集地点是否存在
        const locationInfo = materialSystem.locations[location];
        if (!locationInfo) {
            let locationGuide = ["〓 采集指南 〓\n"];
            for (const [name, info] of Object.entries(materialSystem.locations)) {
                locationGuide.push(
                    `🌟 ${name}`,
                    `  等级要求: ${info.等级要求}`,
                    `  体力消耗: ${info.体力消耗}`,
                    `  可采集材料:`,
                    ...Object.keys(info.基础材料).map(material => 
                        `    - ${material}`
                    ),
                    ...Object.keys(info.稀有材料).map(material => 
                        `    - ${material}(稀有)`
                    ),
                    `  特殊效果: ${info.特殊效果}\n`
                );
            }
            locationGuide.push(
                "💡 使用方法: #采集素材 地点名称",
                "例如: #采集素材 魔法花园"
            );
            e.reply(locationGuide.join('\n'));
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < locationInfo.等级要求) {
            e.reply(`等级不足,需要等级${locationInfo.等级要求}！`);
            return;
        }
    
        // 检查体力
        const tool = worldData.装备.采集工具 ? 
                     materialSystem.tools[worldData.装备.采集工具] : null;
        const actualStamina = locationInfo.体力消耗 - 
                             (tool?.体力消耗减少 || 0);
        
        if (worldData.属性.体力值 < actualStamina) {
            e.reply(`体力不足,需要${actualStamina}点体力！`);
            return;
        }
    
        // 计算采集加成
        const calculateBonus = () => {
            let bonus = {
                效率: 0,
                稀有度: 0,
                体力消耗: 0
            };
    
            // 工具加成
            if (tool) {
                bonus.效率 += tool.效率加成;
                bonus.稀有度 += tool.稀有度提升;
                bonus.体力消耗 += tool.体力消耗减少;
            }
    
            // 技能加成
            for (const [skillName, skillInfo] of Object.entries(materialSystem.skills)) {
                const skill = worldData.技能.find(s => s.name === skillName);
                if (skill) {
                    bonus.效率 += skillInfo.等级加成 * skill.level;
                    bonus.稀有度 += skillInfo.稀有度提升 * skill.level;
                    if (skillInfo.体力消耗减少) {
                        bonus.体力消耗 += skillInfo.体力消耗减少 * skill.level;
                    }
                }
            }
    
            return bonus;
        };
    
        const bonus = calculateBonus();
    
        // 检查特殊事件
        let activeEvent = null;
        for (const [eventName, eventInfo] of Object.entries(materialSystem.events)) {
            if (Math.random() < eventInfo.概率) {
                activeEvent = {
                    名称: eventName,
                    ...eventInfo
                };
                break;
            }
        }
    
        // 执行采集
        const collectResult = {
            获得材料: [],
            经验值: 0,
            特殊发现: null
        };
    
        // 采集基础材料
        for (const [material, info] of Object.entries(locationInfo.基础材料)) {
            let probability = info.概率 * (1 + bonus.效率);
            if (activeEvent?.效果.includes('效率翻倍')) {
                probability *= 2;
            }
    
            if (Math.random() < probability) {
                const amount = Math.floor(
                    (info.数量[0] + Math.random() * (info.数量[1] - info.数量[0])) * 
                    (1 + bonus.效率)
                );
                collectResult.获得材料.push({
                    名称: material,
                    数量: amount,
                    类型: "基础"
                });
                collectResult.经验值 += amount * 10;
            }
        }
    
        // 采集稀有材料
        for (const [material, info] of Object.entries(locationInfo.稀有材料)) {
            let probability = info.概率 * (1 + bonus.稀有度);
            if (activeEvent?.效果.includes('稀有材料概率提升')) {
                probability *= 1.5;
            }
            if (activeEvent?.效果 === '必定获得稀有材料') {
                probability = 1;
            }
    
            if (Math.random() < probability) {
                const amount = Math.floor(
                    (info.数量[0] + Math.random() * (info.数量[1] - info.数量[0])) * 
                    (1 + bonus.效率)
                );
                collectResult.获得材料.push({
                    名称: material,
                    数量: amount,
                    类型: "稀有"
                });
                collectResult.经验值 += amount * 30;
            }
        }
    
        // 特殊发现
        if (locationInfo.特殊效果) {
            collectResult.特殊发现 = {
                效果: locationInfo.特殊效果,
                持续时间: 1800000 // 30分钟
            };
            collectResult.经验值 += 50;
        }
    
        // 更新玩家数据
        worldData.属性.体力值 -= actualStamina;
        worldData.经验值 += collectResult.经验值;
    
        // 添加材料到背包
        for (const material of collectResult.获得材料) {
            if (!worldData.背包.材料[material.名称]) {
                worldData.背包.材料[material.名称] = 0;
            }
            worldData.背包.材料[material.名称] += material.数量;
        }
    
        // 检查升级
        if (worldData.经验值 >= worldData.升级所需经验) {
            worldData.等级 += 1;
            worldData.经验值 -= worldData.升级所需经验;
            worldData.升级所需经验 = Math.floor(worldData.升级所需经验 * 1.2);
        }
    
        // 添加特殊效果
        if (collectResult.特殊发现) {
            if (!worldData.状态.增益效果) {
                worldData.状态.增益效果 = [];
            }
            worldData.状态.增益效果.push({
                名称: collectResult.特殊发现.效果,
                结束时间: Date.now() + collectResult.特殊发现.持续时间
            });
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成采集报告
        const collectReport = [
            `〓 采集报告 〓\n`,
            `📍 采集地点: ${location}`,
            tool ? `🛠️ 采集工具: ${worldData.装备.采集工具}` : "",
            activeEvent ? `\n✨ 触发特殊事件: ${activeEvent.名称}` : "",
            activeEvent ? `  效果: ${activeEvent.效果}` : "",
            `\n获得材料:`,
            collectResult.获得材料.length > 0 ?
                collectResult.获得材料.map(material => 
                    `${material.类型 === "稀有" ? "✨" : "🌟"} ${material.名称} x${material.数量}`
                ).join('\n') :
                "这次什么都没有采集到...",
            `\n采集成果:`,
            `📈 获得经验: ${collectResult.经验值}`,
            `💪 消耗体力: ${actualStamina}`,
            collectResult.特殊发现 ? 
                `\n✨ 获得特殊效果: ${collectResult.特殊发现.效果}` : "",
            `\n当前状态:`,
            `⭐ 等级: ${worldData.等级}`,
            `📊 经验值: ${worldData.经验值}/${worldData.升级所需经验}`,
            `💪 体力值: ${worldData.属性.体力值}/100`,
            `\n💡 提示:`,
            `1. 使用采集工具可以提高采集效率`,
            `2. 提升相关技能等级可以获得更好的收益`,
            `3. 某些时间段可能触发特殊事件哦~`
        ].join('\n');
    
        e.reply(collectReport);
    }

    async upgradeAttributes(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 属性提升系统
        const attributeSystem = {
            // 基础属性
            基础属性: {
                "魅力": {
                    描述: "影响与NPC互动效果",
                    基础消耗: 100,
                    成长倍率: 1.2,
                    最大值: 200,
                    关联属性: ["亲和力", "交际能力"]
                },
                "智慧": {
                    描述: "影响魔法学习速度",
                    基础消耗: 120,
                    成长倍率: 1.3,
                    最大值: 200,
                    关联属性: ["魔法亲和", "学习能力"] 
                },
                "体力": {
                    描述: "影响行动持续时间",
                    基础消耗: 80,
                    成长倍率: 1.1,
                    最大值: 200,
                    关联属性: ["耐力", "恢复力"]
                }
            },
    
            // 特殊属性
            特殊属性: {
                "魔法亲和": {
                    描述: "提升魔法效果",
                    前置要求: {
                        智慧: 50
                    },
                    基础消耗: 150,
                    成长倍率: 1.4,
                    最大值: 150
                },
                "幸运": {
                    描述: "提高稀有物品获取概率",
                    前置要求: {
                        魅力: 30
                    },
                    基础消耗: 200,
                    成长倍率: 1.5,
                    最大值: 100
                }
            },
    
            // 隐藏属性
            隐藏属性: {
                "梦想之力": {
                    描述: "解锁特殊剧情",
                    解锁条件: "完成主线任务[追寻梦想]",
                    基础消耗: 300,
                    成长倍率: 2.0,
                    最大值: 100
                },
                "星光亲和": {
                    描述: "增强星光系魔法",
                    解锁条件: "学会3个星光系魔法",
                    基础消耗: 250,
                    成长倍率: 1.8,
                    最大值: 100
                }
            }
        };
    
        // 属性提升方式
        const upgradeMethods = {
            "普通提升": {
                描述: "稳定提升属性",
                成功率: 1.0,
                属性增加: 1,
                消耗倍率: 1.0
            },
            "强化提升": {
                描述: "较大提升但有失败风险",
                成功率: 0.7,
                属性增加: 2,
                消耗倍率: 1.5
            },
            "觉醒提升": {
                描述: "巨大提升但风险很大",
                成功率: 0.4,
                属性增加: 3,
                消耗倍率: 2.0
            }
        };
    
        // 解析提升指令
        const upgradeInfo = e.msg.replace('#提升属性', '').trim().split(' ');
        const attrName = upgradeInfo[0];
        const method = upgradeInfo[1] || "普通提升";
    
        // 如果没有指定属性名称,显示属性信息
        if (!attrName) {
            let attrList = ["〓 属性提升指南 〓\n"];
            
            // 显示基础属性
            attrList.push("== 基础属性 ==");
            for (const [name, info] of Object.entries(attributeSystem.基础属性)) {
                const current = worldData.属性[name] || 0;
                attrList.push(
                    `💫 ${name} - 当前值:${current}/${info.最大值}`,
                    `  描述: ${info.描述}`,
                    `  提升消耗: ${Math.floor(info.基础消耗 * Math.pow(info.成长倍率, current))}金币`,
                    `  关联属性: ${info.关联属性.join('、')}\n`
                );
            }
    
            // 显示特殊属性
            attrList.push("== 特殊属性 ==");
            for (const [name, info] of Object.entries(attributeSystem.特殊属性)) {
                const current = worldData.属性[name] || 0;
                const meetsRequirement = Object.entries(info.前置要求).every(
                    ([attr, value]) => (worldData.属性[attr] || 0) >= value
                );
                attrList.push(
                    `${meetsRequirement ? "✨" : "❌"} ${name} - 当前值:${current}/${info.最大值}`,
                    `  描述: ${info.描述}`,
                    `  前置要求: ${Object.entries(info.前置要求)
                        .map(([attr, value]) => `${attr}${value}`)
                        .join('、')}`,
                    `  提升消耗: ${Math.floor(info.基础消耗 * Math.pow(info.成长倍率, current))}金币\n`
                );
            }
    
            // 显示已解锁的隐藏属性
            const unlockedHidden = Object.entries(attributeSystem.隐藏属性)
                .filter(([name, info]) => checkAttributeUnlock(worldData, info.解锁条件));
            
            if (unlockedHidden.length > 0) {
                attrList.push("== 隐藏属性 ==");
                for (const [name, info] of unlockedHidden) {
                    const current = worldData.属性[name] || 0;
                    attrList.push(
                        `🌟 ${name} - 当前值:${current}/${info.最大值}`,
                        `  描述: ${info.描述}`,
                        `  提升消耗: ${Math.floor(info.基础消耗 * Math.pow(info.成长倍率, current))}金币\n`
                    );
                }
            }
    
            // 显示提升方式
            attrList.push(
                "== 提升方式 ==",
                ...Object.entries(upgradeMethods).map(([name, info]) => 
                    `- ${name}: ${info.描述}\n` +
                    `  成功率:${info.成功率*100}% 提升:+${info.属性增加} 消耗:x${info.消耗倍率}`
                ),
                "\n💡 使用方法: #提升属性 属性名称 提升方式",
                "例如: #提升属性 魅力 普通提升"
            );
    
            e.reply(attrList.join('\n'));
            return;
        }
    
        // 查找属性信息
        let attrInfo = null;
        let attrCategory = null;
        for (const [category, attrs] of Object.entries(attributeSystem)) {
            if (attrs[attrName]) {
                attrInfo = attrs[attrName];
                attrCategory = category;
                break;
            }
        }
    
        if (!attrInfo) {
            e.reply("未找到该属性,请检查属性名称是否正确！");
            return;
        }
    
        // 检查提升方式
        const methodInfo = upgradeMethods[method];
        if (!methodInfo) {
            e.reply("无效的提升方式！");
            return;
        }
    
        // 检查是否达到属性上限
        const currentValue = worldData.属性[attrName] || 0;
        if (currentValue >= attrInfo.最大值) {
            e.reply(`${attrName}已达到最大值${attrInfo.最大值}！`);
            return;
        }
    
        // 检查前置要求
        if (attrCategory === "特殊属性") {
            for (const [attr, value] of Object.entries(attrInfo.前置要求)) {
                if ((worldData.属性[attr] || 0) < value) {
                    e.reply(`需要${attr}达到${value}才能提升该属性！`);
                    return;
                }
            }
        }
    
        // 检查隐藏属性解锁条件
        if (attrCategory === "隐藏属性" && 
            !checkAttributeUnlock(worldData, attrInfo.解锁条件)) {
            e.reply(`该属性尚未解锁！需要${attrInfo.解锁条件}`);
            return;
        }
    
        // 计算消耗
        const baseCost = Math.floor(
            attrInfo.基础消耗 * 
            Math.pow(attrInfo.成长倍率, currentValue) *
            methodInfo.消耗倍率
        );
    
        // 检查金币是否足够
        if (worldData.背包.金币 < baseCost) {
            e.reply(`金币不足,提升${attrName}需要${baseCost}金币！`);
            return;
        }
    
        // 执行提升
        const success = Math.random() < methodInfo.成功率;
        // 扣除金币
        worldData.背包.金币 -= baseCost;
    
        if (!success) {
            await redis.set(`user:${userId}`, JSON.stringify(worldData));
            await saveUserData(userId, worldData);
            e.reply([
                `提升失败...\n`,
                `💰 消耗${baseCost}金币`,
                `💰 剩余金币:${worldData.背包.金币}`,
                `\n💡 提示: 选择普通提升可以确保成功哦！`
            ].join('\n'));
            return;
        }
    
        // 提升属性
        worldData.属性[attrName] = (worldData.属性[attrName] || 0) + methodInfo.属性增加;
    
        // 更新关联属性
        if (attrInfo.关联属性) {
            for (const relatedAttr of attrInfo.关联属性) {
                worldData.属性[relatedAttr] = (worldData.属性[relatedAttr] || 0) + 
                    Math.floor(methodInfo.属性增加 * 0.5);
            }
        }
    
        // 检查是否触发特殊效果
        let specialEffect = null;
        if (Math.random() < 0.1) { // 10%概率触发特殊效果
            specialEffect = generateSpecialEffect(attrName, methodInfo.属性增加);
            applySpecialEffect(worldData, specialEffect);
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成提升报告
        const upgradeReport = [
            `〓 属性提升报告 〓\n`,
            `✨ ${attrName}提升成功！`,
            `  ${currentValue} → ${worldData.属性[attrName]} (+${methodInfo.属性增加})`,
            attrInfo.关联属性? [
                `\n关联属性提升:`,
                ...attrInfo.关联属性.map(attr => 
                    `- ${attr}: +${Math.floor(methodInfo.属性增加 * 0.5)}`
                )
            ].join('\n') : "",
            specialEffect ? [
                `\n🎉 触发特殊效果:`,
                `- ${specialEffect.名称}`,
                `  ${specialEffect.描述}`
            ].join('\n') : "",
            `\n消耗:`,
            `💰 金币: ${baseCost}`,
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `\n💡 提示: 属性越高,相关技能和魔法的效果越好！`
        ].join('\n');
    
        e.reply(upgradeReport);
    }
    async useItem(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 道具系统
        const itemSystem = {
            // 消耗品
            消耗品: {
                "治愈药水": {
                    类型: "恢复",
                    效果: {
                        生命值: 30,
                        状态恢复: ["轻伤", "中毒"]
                    },
                    持续时间: 0,
                    冷却时间: 30000, // 30秒
                    描述: "散发着淡淡花香的治愈药水"
                },
                "魔力药剂": {
                    类型: "恢复",
                    效果: {
                        魔力值: 40,
                        魔力恢复: 5
                    },
                    持续时间: 300000, // 5分钟
                    冷却时间: 60000, // 1分钟
                    描述: "闪烁着星光的魔力药剂"
                },
                "元气糖果": {
                    类型: "恢复",
                    效果: {
                        体力值: 25,
                        心情值: 10
                    },
                    持续时间: 0,
                    冷却时间: 300000, // 5分钟
                    描述: "充满能量的可爱糖果"
                }
            },
    
            // 增益道具
            增益道具: {
                "星光护符": {
                    类型: "增益",
                    效果: {
                        魔法伤害: 1.2,
                        魔力消耗: 0.9
                    },
                    持续时间: 1800000, // 30分钟
                    冷却时间: 3600000, // 1小时
                    描述: "闪耀着星光的神秘护符"
                },
                "幸运蝴蝶结": {
                    类型: "增益",
                    效果: {
                        幸运值: 1.3,
                        掉落率: 1.2
                    },
                    持续时间: 3600000, // 1小时
                    冷却时间: 7200000, // 2小时
                    描述: "带来好运的可爱蝴蝶结"
                }
            },
    
            // 特殊道具
            特殊道具: {
                "梦境之星": {
                    类型: "特殊",
                    效果: {
                        解锁: "梦境探索",
                        属性提升: {
                            魔力亲和: 10,
                            幸运值: 5
                        }
                    },
                    使用条件: {
                        等级要求: 10,
                        任务要求: "寻找梦境之星"
                    },
                    描述: "蕴含着梦境力量的神秘星星"
                },
                "魔法少女变身钥匙": {
                    类型: "特殊",
                    效果: {
                        解锁: "特殊变身形态",
                        属性提升: {
                            全属性: 15
                        }
                    },
                    使用条件: {
                        等级要求: 20,
                        好感度要求: {
                            "星光女神": 100
                        }
                    },
                    描述: "能够解锁特殊变身形态的神秘钥匙"
                }
            }
        };
    
        // 解析使用道具指令
        const itemInfo = e.msg.replace('#使用道具', '').trim().split(' ');
        const itemName = itemInfo[0];
        const target = itemInfo[1] || "自身";
    
        // 如果没有指定道具名称,显示可用道具列表
        if (!itemName) {
            let itemList = ["〓 可用道具一览 〓\n"];
            
            // 显示消耗品
            itemList.push("== 消耗品 ==");
            for (const [name, info] of Object.entries(itemSystem.消耗品)) {
                const amount = worldData.背包.道具[name] || 0;
                const cooldown = await redis.get(`cooldown:item:${userId}:${name}`);
                const isReady = !cooldown || Date.now() > parseInt(cooldown);
                
                itemList.push(
                    `${isReady ? "✨" : "⏳"} ${name} (${amount}个)`,
                    `  类型: ${info.类型}`,
                    `  效果: ${Object.entries(info.效果).map(([key, value]) => 
                        `${key}+${value}`).join(', ')}`,
                    info.持续时间 > 0 ? 
                        `  持续时间: ${info.持续时间/60000}分钟` : "",
                    `  冷却时间: ${info.冷却时间/1000}秒`,
                    `  描述: ${info.描述}\n`
                );
            }
    
            // 显示增益道具
            itemList.push("== 增益道具 ==");
            for (const [name, info] of Object.entries(itemSystem.增益道具)) {
                const amount = worldData.背包.道具[name] || 0;
                const cooldown = await redis.get(`cooldown:item:${userId}:${name}`);
                const isReady = !cooldown || Date.now() > parseInt(cooldown);
                
                itemList.push(
                    `${isReady ? "🌟" : "⏳"} ${name} (${amount}个)`,
                    `  类型: ${info.类型}`,
                    `  效果: ${Object.entries(info.效果).map(([key, value]) => 
                        `${key}x${value}`).join(', ')}`,
                    `  持续时间: ${info.持续时间/60000}分钟`,
                    `  冷却时间: ${info.冷却时间/3600000}小时`,
                    `  描述: ${info.描述}\n`
                );
            }
    
            // 显示特殊道具
            itemList.push("== 特殊道具 ==");
            for (const [name, info] of Object.entries(itemSystem.特殊道具)) {
                const amount = worldData.背包.道具[name] || 0;
                if (amount > 0) {
                    itemList.push(
                        `💫 ${name} (${amount}个)`,
                        `  类型: ${info.类型}`,
                        `  效果: 解锁${info.效果.解锁}`,
                        `  属性提升: ${Object.entries(info.效果.属性提升).map(([key, value]) => 
                            `${key}+${value}`).join(', ')}`,
                        `  等级要求: ${info.使用条件.等级要求}`,
                        `  描述: ${info.描述}\n`
                    );
                }
            }
    
            itemList.push(
                "💡 使用方法: #使用道具 道具名称 [目标]",
                "例如: #使用道具 治愈药水 自身"
            );
            
            e.reply(itemList.join('\n'));
            return;
        }
    
        // 查找道具信息
        let itemData = null;
        let itemCategory = null;
        for (const [category, items] of Object.entries(itemSystem)) {
            if (items[itemName]) {
                itemData = items[itemName];
                itemCategory = category;
                break;
            }
        }
    
        if (!itemData) {
            e.reply("未找到该道具,请检查道具名称是否正确！");
            return;
        }
    
        // 检查是否拥有道具
        if (!worldData.背包.道具[itemName] || worldData.背包.道具[itemName] <= 0) {
            e.reply(`你没有${itemName}可以使用！`);
            return;
        }
    
        // 检查冷却时间
        const cooldown = await redis.get(`cooldown:item:${userId}:${itemName}`);
        if (cooldown && Date.now() < parseInt(cooldown)) {
            const remainTime = Math.ceil((parseInt(cooldown) - Date.now()) / 1000);
            e.reply(`${itemName}还在冷却中,剩余${remainTime}秒！`);
            return;
        }
    
        // 检查使用条件
        if (itemCategory === "特殊道具") {
            if (worldData.等级 < itemData.使用条件.等级要求) {
                e.reply(`等级不足,需要等级${itemData.使用条件.等级要求}！`);
                return;
            }
            if (itemData.使用条件.任务要求 && 
                !worldData.任务进度?.[itemData.使用条件.任务要求]?.完成) {
                e.reply(`需要先完成任务[${itemData.使用条件.任务要求}]！`);
                return;
            }
            if (itemData.使用条件.好感度要求) {
                for (const [npc, required] of Object.entries(itemData.使用条件.好感度要求)) {
                    if ((worldData.好感度?.[npc] || 0) < required) {
                        e.reply(`需要与${npc}的好感度达到${required}！`);
                        return;
                    }
                }
            }
        }
    
        // 执行道具效果
        const useResult = await executeItemEffect(worldData, itemName, itemData, target);
        if (!useResult.success) {
            e.reply(useResult.message);
            return;
        }
    
        // 扣除道具
        worldData.背包.道具[itemName]--;
        if (worldData.背包.道具[itemName] <= 0) {
            delete worldData.背包.道具[itemName];
        }
    
        // 设置冷却时间
        if (itemData.冷却时间) {
            await redis.set(`cooldown:item:${userId}:${itemName}`, 
                Date.now() + itemData.冷却时间);
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成使用报告
        const useReport = [
            `〓 道具使用报告 〓\n`,
            `使用道具: ${itemName}`,
            `目标: ${target}`,
            `\n效果:`,
            ...useResult.effects,
            itemData.持续时间 ? 
                `\n持续时间: ${itemData.持续时间/60000}分钟` : "",
            `\n当前状态:`,
            `❤️ 生命值: ${worldData.属性.生命值}`,
            `✨ 魔力值: ${worldData.属性.魔力值}`,
            `💪 体力值: ${worldData.属性.体力值}`,
            `\n剩余数量: ${worldData.背包.道具[itemName] || 0}个`,
            `\n💡 提示: ${useResult.tip || "道具效果可以叠加哦！"}`
        ].join('\n');
    
        e.reply(useReport);
    }

    async visitShop(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 商店系统
        const shopSystem = {
            // 商店类型
            types: {
                "魔法道具店": {
                    shopkeeper: "莉莉安",
                    description: "充满魔法气息的精致小店",
                    openTime: "10:00-22:00",
                    specialTime: {
                        time: "15:00-17:00",
                        name: "下午茶特惠",
                        discount: 0.8
                    },
                    categories: ["魔法材料", "魔法书籍", "魔法饰品"]
                },
                "少女服装店": {
                    shopkeeper: "蒂芙尼",
                    description: "展示着各种可爱服装的温馨店铺",
                    openTime: "9:00-21:00", 
                    specialTime: {
                        time: "11:00-14:00",
                        name: "午间特卖",
                        discount: 0.85
                    },
                    categories: ["日常服装", "魔法服装", "特殊服装"]
                },
                "甜品咖啡店": {
                    shopkeeper: "安娜贝尔",
                    description: "弥漫着甜香的温暖小店",
                    openTime: "8:00-20:00",
                    specialTime: {
                        time: "14:00-16:00", 
                        name: "下午茶时光",
                        discount: 0.9
                    },
                    categories: ["甜点", "饮品", "礼盒"]
                }
            },
    
            // 商品分类
            categories: {
                "魔法材料": {
                    "魔法水晶": {
                        price: 100,
                        description: "蕴含魔力的美丽晶石",
                        effect: "制作魔法道具的基础材料",
                        limit: 10
                    },
                    "星光之尘": {
                        price: 150,
                        description: "闪烁着星光的神秘粉末",
                        effect: "增强魔法效果",
                        limit: 5
                    }
                },
                "魔法书籍": {
                    "初级魔法教程": {
                        price: 200,
                        description: "适合初学者的魔法入门书",
                        effect: "学习基础魔法",
                        limit: 1
                    },
                    "魔法少女手册": {
                        price: 300,
                        description: "记载着魔法少女秘密的手册",
                        effect: "提升魔法亲和",
                        limit: 1
                    }
                },
                "日常服装": {
                    "可爱连衣裙": {
                        price: 500,
                        description: "充满少女气息的连衣裙",
                        effect: "魅力+5",
                        limit: 1
                    },
                    "学园制服": {
                        price: 600,
                        description: "典雅的魔法学园制服",
                        effect: "学习效率+10%",
                        limit: 1
                    }
                }
            },
    
            // 会员系统
            memberSystem: {
                "普通会员": {
                    requirement: 0,
                    discount: 0,
                    points: 1
                },
                "白银会员": {
                    requirement: 1000,
                    discount: 0.05,
                    points: 1.2
                },
                "黄金会员": {
                    requirement: 5000,
                    discount: 0.1,
                    points: 1.5
                },
                "钻石会员": {
                    requirement: 20000,
                    discount: 0.15,
                    points: 2
                }
            }
        };
    
        // 解析指令
        const args = e.msg.replace('#访问商店', '').trim().split(' ');
        const shopType = args[0];
        const action = args[1];
        const itemName = args.slice(2).join(' ');
    
        // 如果没有指定商店类型,显示商店列表
        if (!shopType) {
            let shopList = ["〓 商店一览 〓\n"];
            for (const [name, info] of Object.entries(shopSystem.types)) {
                const isOpen = checkShopOpen(info.openTime);
                const isSpecial = checkSpecialTime(info.specialTime.time);
                shopList.push(
                    `${isOpen ? "🏪" : "🔒"} ${name}`,
                    `  店主: ${info.shopkeeper}`,
                    `  简介: ${info.description}`,
                    `  营业时间: ${info.openTime}`,
                    `  特惠时段: ${info.specialTime.time} (${info.specialTime.name})`,
                    `  商品类型: ${info.categories.join('、')}`,
                    isOpen ? (isSpecial ? `  ✨当前为特惠时段✨` : "") : "  ※当前休息中",
                    ""
                );
            }
            shopList.push(
                "💡 使用说明:",
                "1. #访问商店 商店名称 - 查看商店商品",
                "2. #访问商店 商店名称 购买 商品名称 - 购买商品",
                "3. #访问商店 商店名称 出售 商品名称 - 出售商品"
            );
            e.reply(shopList.join('\n'));
            return;
        }
    
        // 检查商店是否存在
        const shop = shopSystem.types[shopType];
        if (!shop) {
            e.reply("找不到该商店,请检查名称是否正确！");
            return;
        }
    
        // 检查商店是否营业
        if (!checkShopOpen(shop.openTime)) {
            e.reply(`${shopType}当前休息中,营业时间为${shop.openTime}`);
            return;
        }
    
        // 获取玩家会员等级
        const memberLevel = getMemberLevel(worldData.消费总额 || 0);
        const memberInfo = shopSystem.memberSystem[memberLevel];
    
        // 根据动作执行相应操作
        switch (action) {
            case "购买":
                await handlePurchase(e, worldData, shop, itemName, memberInfo);
                break;
            case "出售":
                await handleSell(e, worldData, shop, itemName, memberInfo);
                break;
            default:
                // 显示商店商品列表
                let shopMenu = [
                    `〓 ${shopType} 商品目录 〓\n`,
                    `店主 ${shop.shopkeeper}: 欢迎光临~`,
                    `会员等级: ${memberLevel} (${memberInfo.discount*100}%折扣)\n`
                ];
                
                const isSpecial = checkSpecialTime(shop.specialTime.time);
                if (isSpecial) {
                    shopMenu.push(
                        `✨ ${shop.specialTime.name}活动中 ✨`,
                        `所有商品额外${(1-shop.specialTime.discount)*100}%折扣\n`
                    );
                }
    
                for (const category of shop.categories) {
                    const items = shopSystem.categories[category];
                    if (items) {
                        shopMenu.push(`== ${category} ==`);
                        for (const [name, info] of Object.entries(items)) {
                            let price = info.price;
                            // 计算折扣
                            if (isSpecial) {
                                price *= shop.specialTime.discount;
                            }
                            price *= (1 - memberInfo.discount);
                            
                            const owned = worldData.背包.道具[name] || 0;
                            shopMenu.push(
                                `🏷️ ${name} - ${price}金币`,
                                `  简介: ${info.description}`,
                                `  效果: ${info.effect}`,
                                `  限购: ${info.limit}个`,
                                `  已拥有: ${owned}个\n`
                            );
                        }
                    }
                }
    
                shopMenu.push(
                    "💡 购买提示:",
                    "1. 特惠时段和会员折扣可叠加",
                    "2. 每日购买次数有限",
                    "3. 部分商品买卖价格会随时间浮动"
                );
                
                e.reply(shopMenu.join('\n'));
        }
    }
    async repairEquipment(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 修复系统
        const repairSystem = {
            // 修复场所
            locations: {
                "魔法工坊": {
                    等级要求: 1,
                    基础费用: 100,
                    成功率: 0.9,
                    特殊效果: "基础修复",
                    工匠: "莉娜",
                    描述: "温馨的小工坊,适合修复基础装备"
                },
                "星光铁匠铺": {
                    等级要求: 10,
                    基础费用: 200,
                    成功率: 0.8,
                    特殊效果: "星光强化",
                    工匠: "凯瑟琳",
                    描述: "专业的铁匠铺,可以修复高级装备"
                },
                "神秘修复室": {
                    等级要求: 20,
                    基础费用: 500,
                    成功率: 0.7,
                    特殊效果: "神秘强化",
                    工匠: "艾丽卡",
                    描述: "充满神秘气息的修复室,可能触发特殊效果"
                }
            },
    
            // 修复材料
            materials: {
                "修复精华": {
                    效果: "提升修复成功率",
                    加成: 0.1,
                    价格: 50
                },
                "强化水晶": {
                    效果: "提升装备品质",
                    加成: 0.2,
                    价格: 100
                },
                "神秘符文": {
                    效果: "概率触发特殊效果",
                    加成: 0.3,
                    价格: 200
                }
            },
    
            // 特殊效果
            effects: {
                "品质提升": {
                    概率: 0.1,
                    描述: "装备品质提升一级"
                },
                "属性强化": {
                    概率: 0.05,
                    描述: "随机一个属性永久提升5%"
                },
                "特效附魔": {
                    概率: 0.01,
                    描述: "获得随机特殊效果"
                }
            }
        };
    
        // 解析指令
        const args = e.msg.replace('#修复装备', '').trim().split(' ');
        const location = args[0] || "魔法工坊";
        const equipmentSlot = args[1];
    
        // 如果没有指定装备,显示修复指南
        if (!equipmentSlot) {
            let repairGuide = ["〓 装备修复指南 〓\n"];
            
            // 显示修复场所
            for (const [name, info] of Object.entries(repairSystem.locations)) {
                repairGuide.push(
                    `🏠 ${name}`,
                    `  工匠: ${info.工匠}`,
                    `  等级要求: ${info.等级要求}`,
                    `  基础费用: ${info.基础费用}金币`,
                    `  成功率: ${info.成功率 * 100}%`,
                    `  特殊效果: ${info.特殊效果}`,
                    `  描述: ${info.描述}\n`
                );
            }
    
            // 显示可用材料
            repairGuide.push("== 可用材料 ==");
            for (const [name, info] of Object.entries(repairSystem.materials)) {
                repairGuide.push(
                    `✨ ${name}`,
                    `  效果: ${info.效果}`,
                    `  加成: ${info.加成 * 100}%`,
                    `  价格: ${info.价格}金币\n`
                );
            }
    
            repairGuide.push(
                "💡 使用方法:",
                "1. #修复装备 场所名称 装备栏位",
                "2. 例如: #修复装备 魔法工坊 武器"
            );
    
            e.reply(repairGuide.join('\n'));
            return;
        }
    
        // 检查修复场所
        const locationInfo = repairSystem.locations[location];
        if (!locationInfo) {
            e.reply("无效的修复场所！");
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < locationInfo.等级要求) {
            e.reply(`等级不足,需要等级${locationInfo.等级要求}！`);
            return;
        }
    
        // 获取要修复的装备
        const equipment = worldData.装备[equipmentSlot];
        if (!equipment) {
            e.reply(`${equipmentSlot}栏位没有装备！`);
            return;
        }
    
        // 检查装备是否需要修复
        const equipDurability = worldData.装备耐久度?.[equipmentSlot] || 100;
        if (equipDurability >= 100) {
            e.reply("该装备不需要修复！");
            return;
        }
    
        // 计算修复费用
        const durabilityLoss = 100 - equipDurability;
        const baseCost = Math.floor(locationInfo.基础费用 * (durabilityLoss / 100));
        const materialCost = calculateMaterialCost(worldData, repairSystem.materials);
        const totalCost = baseCost + materialCost;
    
        // 检查金币是否足够
        if (worldData.背包.金币 < totalCost) {
            e.reply(`金币不足,修复需要${totalCost}金币！`);
            return;
        }
    
        // 计算修复成功率
        let successRate = locationInfo.成功率;
        successRate += calculateMaterialBonus(worldData, repairSystem.materials);
    
        // 执行修复
        const success = Math.random() < successRate;
        // 扣除金币
        worldData.背包.金币 -= totalCost;
    
        if (!success) {
            await redis.set(`user:${userId}`, JSON.stringify(worldData));
            await saveUserData(userId, worldData);
            e.reply([
                "修复失败...",
                `💰 消耗${totalCost}金币`,
                `💰 剩余金币:${worldData.背包.金币}`,
                `\n💡 提示: 使用修复材料可以提高成功率！`
            ].join('\n'));
            return;
        }
    
        // 修复成功
        worldData.装备耐久度[equipmentSlot] = 100;
    
        // 检查特殊效果
        let specialEffect = null;
        for (const [effect, info] of Object.entries(repairSystem.effects)) {
            if (Math.random() < info.概率) {
                specialEffect = {
                    名称: effect,
                    描述: info.描述
                };
                applySpecialRepairEffect(worldData, equipmentSlot, effect);
                break;
            }
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成修复报告
        const repairReport = [
            `〓 装备修复报告 〓\n`,
            `修复地点: ${location}`,
            `修复装备: ${equipment}`,
            `\n修复效果:`,
            `耐久度: ${equipDurability} → 100`,
            specialEffect ? [
                `\n✨ 触发特殊效果:`,
                `${specialEffect.名称}: ${specialEffect.描述}`
            ].join('\n') : "",
            `\n消耗:`,
            `💰 基础费用: ${baseCost}金币`,
            materialCost > 0 ? `💰 材料费用: ${materialCost}金币` : "",
            `💰 总计: ${totalCost}金币`,
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `\n💡 提示: 定期修复装备可以保持最佳状态！`
        ].join('\n');
    
        e.reply(repairReport);
    }
    
    async learnNewSpell(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 魔法学习系统
        const spellSystem = {
            // 基础魔法
            初级魔法: {
                "星光闪耀": {
                    类型: "光系",
                    消耗: { 魔力: 20, 金币: 100 },
                    学习要求: { 等级: 1, 魔法亲和: 0 },
                    效果: "造成光属性伤害",
                    伤害: 30,
                    冷却: 5000, // 5秒
                    描述: "召唤星光的基础魔法",
                    进阶魔法: ["星光风暴", "星辰陨落"]
                },
                "治愈微光": {
                    类型: "治疗",
                    消耗: { 魔力: 25, 金币: 150 },
                    学习要求: { 等级: 1, 魔法亲和: 5 },
                    效果: "恢复生命值",
                    恢复: 40,
                    冷却: 8000, // 8秒
                    描述: "温柔的治疗魔法",
                    进阶魔法: ["治愈之环", "生命绽放"]
                }
            },
            // 进阶魔法
            中级魔法: {
                "星光风暴": {
                    类型: "光系",
                    消耗: { 魔力: 40, 金币: 500 },
                    学习要求: { 等级: 10, 魔法亲和: 20 },
                    前置魔法: "星光闪耀",
                    效果: "范围光属性伤害",
                    伤害: 80,
                    冷却: 15000, // 15秒
                    描述: "召唤星光风暴攻击范围内的敌人",
                    进阶魔法: ["星光审判"]
                },
                "治愈之环": {
                    类型: "治疗",
                    消耗: { 魔力: 50, 金币: 600 },
                    学习要求: { 等级: 10, 魔法亲和: 25 },
                    前置魔法: "治愈微光",
                    效果: "范围治疗",
                    恢复: 60,
                    冷却: 20000, // 20秒
                    描述: "创造治愈能量场恢复范围内友方生命",
                    进阶魔法: ["生命之光"]
                }
            },
            // 高级魔法
            高级魔法: {
                "星光审判": {
                    类型: "光系",
                    消耗: { 魔力: 80, 金币: 2000 },
                    学习要求: { 等级: 30, 魔法亲和: 50 },
                    前置魔法: "星光风暴",
                    效果: "强大的光属性伤害",
                    伤害: 200,
                    冷却: 60000, // 60秒
                    描述: "召唤圣洁星光净化邪恶",
                    特殊效果: "概率眩晕敌人"
                },
                "生命之光": {
                    类型: "治疗",
                    消耗: { 魔力: 100, 金币: 3000 },
                    学习要求: { 等级: 30, 魔法亲和: 60 },
                    前置魔法: "治愈之环",
                    效果: "强力范围治疗",
                    恢复: 150,
                    冷却: 45000, // 45秒
                    描述: "释放生命能量治愈所有友方",
                    特殊效果: "附加生命恢复效果"
                }
            }
        };
    
        // 魔法熟练度系统
        const proficiencySystem = {
            经验获得: {
                使用: 10,
                完美使用: 20,
                连击使用: 15
            },
            等级提升: {
                初学: { 经验: 100, 属性加成: 0.1 },
                熟练: { 经验: 300, 属性加成: 0.2 },
                精通: { 经验: 600, 属性加成: 0.3 },
                大师: { 经验: 1000, 属性加成: 0.5 }
            }
        };
    
        // 解析学习指令
        const spellName = e.msg.replace('#学习新法术', '').trim();
        
        // 如果没有指定法术名称,显示可学习法术列表
        if (!spellName) {
            let spellList = ["〓 可学习的法术 〓\n"];
            
            // 遍历所有法术等级
            for (const [level, spells] of Object.entries(spellSystem)) {
                spellList.push(`== ${level} ==`);
                for (const [name, info] of Object.entries(spells)) {
                    const canLearn = worldData.等级 >= info.学习要求.等级 && 
                                    worldData.魔法亲和 >= info.学习要求.魔法亲和;
                    
                    // 检查前置法术
                    let meetsPrerequisite = true;
                    if (info.前置魔法) {
                        const prereqSpell = worldData.魔法?.find(s => s.name === info.前置魔法);
                        meetsPrerequisite = prereqSpell && prereqSpell.level >= 5;
                    }
    
                    spellList.push(
                        `${canLearn && meetsPrerequisite ? "✨" : "❌"} ${name}`,
                        `  类型: ${info.类型}`,
                        `  效果: ${info.效果}`,
                        info.伤害 ? `  伤害: ${info.伤害}` : "",
                        info.恢复 ? `  恢复: ${info.恢复}` : "",
                        `  魔力消耗: ${info.消耗.魔力}`,
                        `  学习费用: ${info.消耗.金币}金币`,
                        `  要求等级: ${info.学习要求.等级}`,
                        `  要求魔法亲和: ${info.学习要求.魔法亲和}`,
                        info.前置魔法 ? `  需要先掌握: ${info.前置魔法}` : "",
                        `  描述: ${info.描述}\n`
                    );
                }
            }
            
            spellList.push(
                "💡 学习法术指令: #学习新法术 法术名称",
                "例如: #学习新法术 星光闪耀"
            );
            
            e.reply(spellList.join('\n'));
            return;
        }
    
        // 查找法术信息
        let spellInfo = null;
        let spellLevel = null;
        for (const [level, spells] of Object.entries(spellSystem)) {
            if (spells[spellName]) {
                spellInfo = spells[spellName];
                spellLevel = level;
                break;
            }
        }
    
        if (!spellInfo) {
            e.reply("未找到该法术,请检查法术名称是否正确！");
            return;
        }
    
        // 检查是否已学习
        if (worldData.魔法?.find(s => s.name === spellName)) {
            e.reply("你已经学会这个法术了！");
            return;
        }
    
        // 检查前置法术
        if (spellInfo.前置魔法) {
            const prereqSpell = worldData.魔法?.find(s => s.name === spellInfo.前置魔法);
            if (!prereqSpell || prereqSpell.level < 5) {
                e.reply(`需要先将${spellInfo.前置魔法}提升到5级才能学习这个法术！`);
                return;
            }
        }
    
        // 检查等级要求
        if (worldData.等级 < spellInfo.学习要求.等级) {
            e.reply(`等级不足,学习该法术需要达到${spellInfo.学习要求.等级}级！`);
            return;
        }
    
        // 检查魔法亲和要求
        if (worldData.魔法亲和 < spellInfo.学习要求.魔法亲和) {
            e.reply(`魔法亲和不足,学习该法术需要${spellInfo.学习要求.魔法亲和}点魔法亲和！`);
            return;
        }
    
        // 检查金币是否足够
        if (worldData.背包.金币 < spellInfo.消耗.金币) {
            e.reply(`金币不足,学习该法术需要${spellInfo.消耗.金币}金币！`);
            return;
        }
    
        // 扣除金币
        worldData.背包.金币 -= spellInfo.消耗.金币;
    
        // 学习法术
        if (!worldData.魔法) worldData.魔法 = [];
        worldData.魔法.push({
            name: spellName,
            type: spellInfo.类型,
            level: 1,
            exp: 0,
            nextLevelExp: proficiencySystem.等级提升.初学.经验
        });
    
        // 更新魔法相关属性
        worldData.魔法亲和 += 1;
    
        // 检查是否触发特殊效果
        let specialEffect = null;
        if (Math.random() < 0.1) { // 10%概率触发特殊效果
            specialEffect = {
                名称: "法术共鸣",
                效果: "魔法亲和永久+1"
            };
            worldData.魔法亲和 += 1;
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成学习报告
        const learnReport = [
            `〓 法术学习成功 〓\n`,
            `✨ 学会了${spellLevel}: ${spellName}`,
            `\n法术信息:`,
            `  类型: ${spellInfo.类型}`,
            `  效果: ${spellInfo.效果}`,
            spellInfo.伤害 ? `  基础伤害: ${spellInfo.伤害}` : "",
            spellInfo.恢复 ? `  基础恢复: ${spellInfo.恢复}` : "",
            `  魔力消耗: ${spellInfo.消耗.魔力}`,
            `  冷却时间: ${spellInfo.冷却/1000}秒`,
            spellInfo.特殊效果 ? `  特殊效果: ${spellInfo.特殊效果}` : "",
            specialEffect ? [
                `\n🎉 触发特殊效果:`,
                `- ${specialEffect.名称}`,
                `- ${specialEffect.效果}`
            ].join('\n') : "",
            `\n消耗:`,
            `💰 金币: ${spellInfo.消耗.金币}`,
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `✨ 魔法亲和: ${worldData.魔法亲和}`,
            `📚 已学法术数: ${worldData.魔法.length}`,
            `\n💡 提示:`,
            `1. 使用法术可以获得熟练度`,
            `2. 法术等级越高,效果越好`,
            `3. 某些法术可以触发连锁效果`
        ].join('\n');
    
        e.reply(learnReport);
    }

    async castSpell(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 法术系统
        const spellSystem = {
            // 基础法术效果
            effects: {
                "伤害": (base, level, attributes) => {
                    return Math.floor(base * (1 + level * 0.1) * (1 + attributes.魔法攻击 * 0.01));
                },
                "治疗": (base, level, attributes) => {
                    return Math.floor(base * (1 + level * 0.1) * (1 + attributes.治疗效果 * 0.01));
                },
                "增益": (base, level, attributes) => {
                    return Math.floor(base * (1 + level * 0.08));
                }
            },
    
            // 元素相性系统
            elements: {
                "火": {
                    克制: "风",
                    被克制: "水",
                    增幅: 1.5,
                    减益: 0.7
                },
                "水": {
                    克制: "火",
                    被克制: "雷",
                    增幅: 1.5,
                    减益: 0.7
                },
                "风": {
                    克制: "雷",
                    被克制: "火",
                    增幅: 1.5,
                    减益: 0.7
                },
                "雷": {
                    克制: "水",
                    被克制: "风",
                    增幅: 1.5,
                    减益: 0.7
                }
            },
    
            // 连锁效果系统
            chainEffects: {
                "火+水": {
                    name: "蒸汽爆发",
                    effect: "范围伤害x1.3"
                },
                "水+雷": {
                    name: "感电",
                    effect: "眩晕2秒"
                },
                "风+火": {
                    name: "火焰龙卷",
                    effect: "持续伤害x1.5"
                }
            }
        };
    
        // 解析施法指令
        const spellInfo = e.msg.replace('#使用法术', '').trim().split(' ');
        const spellName = spellInfo[0];
        const target = spellInfo[1] || "目标";
    
        // 检查法术是否学会
        const spell = worldData.魔法?.find(s => s.name === spellName);
        if (!spell) {
            e.reply("你还没有学会这个法术！");
            return;
        }
    
        // 检查魔力是否足够
        if (worldData.属性.魔力值 < spell.消耗.魔力) {
            e.reply(`魔力不足,施展${spellName}需要${spell.消耗.魔力}点魔力！`);
            return;
        }
    
        // 检查冷却时间
        const cooldown = await redis.get(`cooldown:spell:${userId}:${spellName}`);
        if (cooldown && Date.now() < parseInt(cooldown)) {
            const remainTime = Math.ceil((parseInt(cooldown) - Date.now())/1000);
            e.reply(`法术冷却中,还需要${remainTime}秒！`);
            return;
        }
    
        // 计算法术效果
        const calculateSpellEffect = (spell, worldData) => {
            let effect = {
                damage: 0,
                healing: 0,
                buffs: [],
                description: []
            };
    
            // 基础效果计算
            if (spell.伤害) {
                effect.damage = spellSystem.effects.伤害(
                    spell.伤害,
                    spell.level,
                    worldData.属性
                );
                effect.description.push(`造成${effect.damage}点伤害`);
            }
    
            if (spell.治疗) {
                effect.healing = spellSystem.effects.治疗(
                    spell.治疗,
                    spell.level,
                    worldData.属性
                );
                effect.description.push(`恢复${effect.healing}点生命值`);
            }
    
            // 元素相性计算
            if (spell.元素) {
                const elementInfo = spellSystem.elements[spell.元素];
                if (target && target.元素 === elementInfo.克制) {
                    effect.damage = Math.floor(effect.damage * elementInfo.增幅);
                    effect.description.push("触发元素克制！");
                } else if (target && target.元素 === elementInfo.被克制) {
                    effect.damage = Math.floor(effect.damage * elementInfo.减益);
                    effect.description.push("受到元素抵抗！");
                }
            }
    
            // 检查连锁效果
            const lastSpell = worldData.lastSpell;
            if (lastSpell) {
                const chainKey = `${lastSpell.元素}+${spell.元素}`;
                const chainEffect = spellSystem.chainEffects[chainKey];
                if (chainEffect) {
                    effect.description.push(
                        `✨触发连锁效果: ${chainEffect.name}`,
                        `  ${chainEffect.effect}`
                    );
                    if (chainEffect.effect.includes('伤害')) {
                        const multiplier = parseFloat(chainEffect.effect.split('x')[1]);
                        effect.damage = Math.floor(effect.damage * multiplier);
                    }
                }
            }
    
            return effect;
        };
    
        // 执行法术效果
        const effect = calculateSpellEffect(spell, worldData);
    
        // 扣除魔力
        worldData.属性.魔力值 -= spell.消耗.魔力;
    
        // 设置冷却时间
        await redis.set(
            `cooldown:spell:${userId}:${spellName}`,
            Date.now() + spell.冷却
        );
    
        // 记录本次施法
        worldData.lastSpell = {
            name: spellName,
            元素: spell.元素,
            时间: Date.now()
        };
    
        // 增加熟练度
        spell.exp += 10;
        if (spell.exp >= spell.nextLevelExp) {
            spell.level += 1;
            spell.exp -= spell.nextLevelExp;
            spell.nextLevelExp = Math.floor(spell.nextLevelExp * 1.2);
            effect.description.push(
                `\n🎉 ${spellName}升级了！`,
                `当前等级: ${spell.level}`
            );
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成施法报告
        const castReport = [
            `〓 法术施放报告 〓\n`,
            `✨ 施放法术: ${spellName}`,
            `📍 目标: ${target}`,
            `\n效果:`,
            ...effect.description,
            `\n消耗:`,
            `✨ 魔力: ${spell.消耗.魔力}`,
            `⏳ 冷却时间: ${spell.冷却/1000}秒`,
            `\n当前状态:`,
            `✨ 魔力值: ${worldData.属性.魔力值}`,
            `📚 法术等级: ${spell.level}`,
            `📊 熟练度: ${spell.exp}/${spell.nextLevelExp}`,
            `\n💡 提示: 不同元素的法术可以触发连锁效果哦！`
        ].join('\n');
    
        e.reply(castReport);
    }

    async attendBanquet(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 宴会系统
        const banquetSystem = {
            // 宴会场所
            locations: {
                "星光舞厅": {
                    等级要求: 1,
                    入场费: 100,
                    氛围: "浪漫优雅",
                    特殊效果: "星光祝福",
                    活动: ["交谊舞", "品茶会", "甜点品鉴"],
                    可获得物品: {
                        "星光蛋糕": 0.3,
                        "舞会礼服": 0.1,
                        "优雅徽章": 0.2
                    }
                },
                "花园茶会": {
                    等级要求: 10,
                    入场费: 200,
                    氛围: "温馨典雅",
                    特殊效果: "花语祝福",
                    活动: ["花艺教学", "下午茶", "音乐会"],
                    可获得物品: {
                        "花语茶包": 0.4,
                        "花园礼帽": 0.15,
                        "茶会徽章": 0.25
                    }
                },
                "月光宴会厅": {
                    等级要求: 20,
                    入场费: 500,
                    氛围: "神秘高贵",
                    特殊效果: "月光眷顾",
                    活动: ["月光舞会", "诗歌朗诵", "魔法表演"],
                    可获得物品: {
                        "月光糕点": 0.3,
                        "宴会礼服": 0.1,
                        "贵族徽章": 0.2
                    }
                }
            },
    
            // 宴会礼仪系统
            etiquette: {
                "基础礼仪": {
                    加成效果: 0.1,
                    描述: "掌握基本的社交礼仪"
                },
                "优雅举止": {
                    加成效果: 0.2,
                    描述: "展现优雅得体的举止"
                },
                "贵族风范": {
                    加成效果: 0.3,
                    描述: "散发高贵典雅的气质"
                }
            },
    
            // 互动系统
            interactions: {
                "寒暄": {
                    好感度加成: 5,
                    成功率: 0.9,
                    描述: "与他人进行友好的交谈"
                },
                "共舞": {
                    好感度加成: 10,
                    成功率: 0.7,
                    描述: "邀请他人跳一支优雅的舞"
                },
                "表演": {
                    好感度加成: 15,
                    成功率: 0.5,
                    描述: "展示自己的才艺"
                }
            }
        };
    
        // 解析宴会指令
        const banquetInfo = e.msg.replace('#参加宴会', '').trim().split(' ');
        const location = banquetInfo[0] || "星光舞厅";
        const activity = banquetInfo[1];
    
        // 检查宴会场所
        const locationInfo = banquetSystem.locations[location];
        if (!locationInfo) {
            let locationGuide = ["〓 可参加的宴会 〓\n"];
            for (const [name, info] of Object.entries(banquetSystem.locations)) {
                locationGuide.push(
                    `🏰 ${name}`,
                    `  等级要求: ${info.等级要求}`,
                    `  入场费: ${info.入场费}金币`,
                    `  氛围: ${info.氛围}`,
                    `  特殊效果: ${info.特殊效果}`,
                    `  可参与活动: ${info.活动.join('、')}`,
                    `  可获得物品:`,
                    ...Object.entries(info.可获得物品).map(([item, chance]) => 
                        `    - ${item} (${chance * 100}%)`
                    ),
                    ""
                );
            }
            locationGuide.push(
                "💡 使用方法: #参加宴会 场所名称 [活动名称]",
                "例如: #参加宴会 星光舞厅 交谊舞"
            );
            e.reply(locationGuide.join('\n'));
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < locationInfo.等级要求) {
            e.reply(`等级不足,需要等级${locationInfo.等级要求}！`);
            return;
        }
    
        // 检查金币是否足够
        if (worldData.背包.金币 < locationInfo.入场费) {
            e.reply(`金币不足,参加宴会需要${locationInfo.入场费}金币！`);
            return;
        }
    
        // 扣除入场费
        worldData.背包.金币 -= locationInfo.入场费;
    
        // 计算礼仪加成
        let etiquetteBonus = 0;
        for (const [level, info] of Object.entries(banquetSystem.etiquette)) {
            if (worldData.礼仪等级?.[level]) {
                etiquetteBonus += info.加成效果;
            }
        }
    
        // 执行宴会活动
        let eventResults = [];
        let totalAffection = 0;
        let obtainedItems = [];
    
        // 随机互动次数
        const interactionCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < interactionCount; i++) {
            const interaction = Object.entries(banquetSystem.interactions)[
                Math.floor(Math.random() * Object.entries(banquetSystem.interactions).length)
            ][1];
    
            const success = Math.random() < (interaction.成功率 + etiquetteBonus);
            if (success) {
                const affectionGain = Math.floor(interaction.好感度加成 * (1 + etiquetteBonus));
                totalAffection += affectionGain;
                eventResults.push(`✨ ${interaction.描述}成功,获得${affectionGain}点好感度`);
            } else {
                eventResults.push(`💔 ${interaction.描述}失败...`);
            }
        }
    
        // 获得物品
        for (const [item, chance] of Object.entries(locationInfo.可获得物品)) {
            if (Math.random() < chance * (1 + etiquetteBonus)) {
                if (!worldData.背包.物品[item]) {
                    worldData.背包.物品[item] = 0;
                }
                worldData.背包.物品[item]++;
                obtainedItems.push(item);
            }
        }
    
        // 应用特殊效果
        if (locationInfo.特殊效果) {
            if (!worldData.状态.增益效果) {
                worldData.状态.增益效果 = [];
            }
            worldData.状态.增益效果.push({
                名称: locationInfo.特殊效果,
                效果: "参加社交活动效果提升20%",
                结束时间: Date.now() + 3600000 // 1小时
            });
        }
    
        // 更新玩家数据
        worldData.魅力值 += Math.floor(totalAffection * 0.1);
        worldData.社交经验 = (worldData.社交经验 || 0) + totalAffection;
    
        // 检查社交等级提升
        const nextLevelExp = (worldData.社交等级 || 1) * 100;
        if (worldData.社交经验 >= nextLevelExp) {
            worldData.社交等级 = (worldData.社交等级 || 1) + 1;
            worldData.社交经验 -= nextLevelExp;
            eventResults.push(`🎉 社交等级提升到${worldData.社交等级}级！`);
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成宴会报告
        const banquetReport = [
            `〓 宴会参与报告 〓\n`,
            `🏰 宴会场所: ${location}`,
            `🌟 场所氛围: ${locationInfo.氛围}`,
            `\n活动过程:`,
            ...eventResults,
            obtainedItems.length > 0 ? `\n获得物品:\n${obtainedItems.map(item => `- ${item}`).join('\n')}` : "",
            `\n最终成果:`,
            `💝 获得好感度: ${totalAffection}`,
            `✨ 魅力值提升: ${Math.floor(totalAffection * 0.1)}`,
            `📈 社交经验: ${worldData.社交经验}/${nextLevelExp}`,
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `💝 魅力值: ${worldData.魅力值}`,
            `🎭 社交等级: ${worldData.社交等级 || 1}`,
            `\n💡 提示: 提升礼仪等级可以增加互动成功率哦！`
        ].join('\n');
    
        e.reply(banquetReport);
    }

    async collectMemories(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 回忆系统
        const memorySystem = {
            // 回忆类型
            types: {
                "温馨回忆": {
                    描述: "充满温暖的美好记忆",
                    加成效果: "心情值+10",
                    获得概率: 0.4
                },
                "欢乐回忆": {
                    描述: "令人开心的快乐时光",
                    加成效果: "幸运值+5",
                    获得概率: 0.3
                },
                "珍贵回忆": {
                    描述: "难以忘怀的重要时刻",
                    加成效果: "魔法亲和+8",
                    获得概率: 0.2
                },
                "梦幻回忆": {
                    描述: "如梦似幻的奇妙经历",
                    加成效果: "全属性+3",
                    获得概率: 0.1
                }
            },
    
            // 收集地点
            locations: {
                "星光花园": {
                    描述: "繁星点缀的梦幻花园",
                    特殊效果: "增加获得梦幻回忆的概率",
                    时间限制: "夜晚"
                },
                "魔法学院": {
                    描述: "充满魔法气息的学习圣地",
                    特殊效果: "增加获得珍贵回忆的概率",
                    时间限制: "白天"
                },
                "甜品店": {
                    描述: "弥漫着甜香的温馨小店",
                    特殊效果: "增加获得温馨回忆的概率",
                    时间限制: "全天"
                }
            },
    
            // 特殊事件
            events: {
                "意外相遇": {
                    概率: 0.1,
                    效果: "获得双倍回忆",
                    描述: "邂逅了特别的人"
                },
                "魔法时刻": {
                    概率: 0.05,
                    效果: "必定获得梦幻回忆",
                    描述: "经历了不可思议的魔法时刻"
                }
            }
        };
    
        // 获取当前时间
        const currentHour = new Date().getHours();
        const timeOfDay = currentHour >= 6 && currentHour < 18 ? "白天" : "夜晚";
    
        // 解析收集地点
        const location = e.msg.replace('#收集回忆', '').trim() || "甜品店";
        const locationInfo = memorySystem.locations[location];
    
        if (!locationInfo) {
            let locationGuide = ["〓 回忆收集指南 〓\n"];
            for (const [name, info] of Object.entries(memorySystem.locations)) {
                locationGuide.push(
                    `🌟 ${name}`,
                    `  描述: ${info.描述}`,
                    `  特殊效果: ${info.特殊效果}`,
                    `  开放时间: ${info.时间限制}\n`
                );
            }
            locationGuide.push(
                "💡 使用方法: #收集回忆 地点名称",
                "例如: #收集回忆 星光花园"
            );
            e.reply(locationGuide.join('\n'));
            return;
        }
    
        // 检查时间限制
        if (locationInfo.时间限制 !== "全天" && locationInfo.时间限制 !== timeOfDay) {
            e.reply(`${location}只在${locationInfo.时间限制}开放哦~`);
            return;
        }
    
        // 初始化收集结果
        let collectedMemories = [];
        let totalEffect = {
            心情值: 0,
            幸运值: 0,
            魔法亲和: 0,
            全属性: 0
        };
    
        // 检查特殊事件
        let activeEvent = null;
        for (const [eventName, eventInfo] of Object.entries(memorySystem.events)) {
            if (Math.random() < eventInfo.概率) {
                activeEvent = {
                    名称: eventName,
                    ...eventInfo
                };
                break;
            }
        }
    
        // 收集回忆
        const collectTimes = activeEvent?.效果.includes('双倍') ? 2 : 1;
        for (let i = 0; i < collectTimes; i++) {
            for (const [type, info] of Object.entries(memorySystem.types)) {
                let probability = info.获得概率;
                
                // 应用地点特殊效果
                if (locationInfo.特殊效果.includes(type)) {
                    probability *= 1.5;
                }
    
                // 特殊事件：必定获得梦幻回忆
                if (activeEvent?.效果.includes('必定获得梦幻回忆') && type === "梦幻回忆") {
                    probability = 1;
                }
    
                if (Math.random() < probability) {
                    collectedMemories.push({
                        类型: type,
                        描述: info.描述,
                        效果: info.加成效果
                    });
    
                    // 应用效果
                    const effect = info.加成效果.split('+');
                    const value = parseInt(effect[1]);
                    if (effect[0] === "全属性") {
                        totalEffect.全属性 += value;
                    } else {
                        totalEffect[effect[0]] += value;
                    }
                }
            }
        }
    
        // 更新玩家数据
        if (!worldData.回忆收集) {
            worldData.回忆收集 = {
                总数: 0,
                类型统计: {},
                特殊事件记录: []
            };
        }
    
        worldData.回忆收集.总数 += collectedMemories.length;
        collectedMemories.forEach(memory => {
            worldData.回忆收集.类型统计[memory.类型] = 
                (worldData.回忆收集.类型统计[memory.类型] || 0) + 1;
        });
    
        if (activeEvent) {
            worldData.回忆收集.特殊事件记录.push({
                事件: activeEvent.名称,
                时间: new Date().toLocaleString()
            });
        }
    
        // 应用属性加成
        for (const [attr, value] of Object.entries(totalEffect)) {
            if (attr === "全属性") {
                for (const baseAttr of ["攻击力", "防御力", "魔法攻击", "魔法防御", "速度"]) {
                    worldData.属性[baseAttr] = Math.floor(worldData.属性[baseAttr] * (1 + value/100));
                }
            } else {
                worldData.属性[attr] = (worldData.属性[attr] || 0) + value;
            }
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成收集报告
        const collectionReport = [
            `〓 回忆收集报告 〓\n`,
            `📍 收集地点: ${location}`,
            activeEvent ? `\n✨ 触发特殊事件: ${activeEvent.名称}\n   ${activeEvent.描述}` : "",
            `\n收集到的回忆:`,
            collectedMemories.length > 0 ?
                collectedMemories.map(memory => 
                    `💫 ${memory.类型}\n   ${memory.描述}\n   效果: ${memory.效果}`
                ).join('\n') :
                "这次什么都没有收集到...",
            `\n获得效果:`,
            ...Object.entries(totalEffect)
                .filter(([_, value]) => value > 0)
                .map(([attr, value]) => `- ${attr}+${value}`),
            `\n收集统计:`,
            `📚 总收集数: ${worldData.回忆收集.总数}`,
            `\n类型统计:`,
            ...Object.entries(worldData.回忆收集.类型统计)
                .map(([type, count]) => `- ${type}: ${count}个`),
            `\n💡 提示: 在不同地点收集回忆会有不同的概率哦！`
        ].join('\n');
    
        e.reply(collectionReport);
    }

    async enhanceAffection(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 好感度系统
        const affectionSystem = {
            // 互动方式
            interactionTypes: {
                "聊天": {
                    基础好感度: 5,
                    成功率: 0.9,
                    消耗: {
                        体力: 10
                    },
                    特殊效果: "心情愉悦"
                },
                "送礼": {
                    基础好感度: 10,
                    成功率: 0.8,
                    消耗: {
                        金币: 100
                    },
                    特殊效果: "好感上升"
                },
                "约会": {
                    基础好感度: 15,
                    成功率: 0.7,
                    消耗: {
                        体力: 20,
                        金币: 200
                    },
                    特殊效果: "心动时刻"
                }
            },
            
            // 礼物系统
            gifts: {
                "手工饰品": {
                    价格: 100,
                    好感度加成: 1.2,
                    适用对象: ["少女", "魔法师"]
                },
                "魔法书": {
                    价格: 200,
                    好感度加成: 1.5,
                    适用对象: ["魔法师", "学者"]
                },
                "甜点": {
                    价格: 50,
                    好感度加成: 1.1,
                    适用对象: ["少女", "店主"]
                }
            },
    
            // 好感度等级
            levels: {
                "陌生": [0, 20],
                "熟悉": [21, 50],
                "友好": [51, 100],
                "亲密": [101, 200],
                "挚友": [201, 500],
                "灵魂伴侣": [501, 999]
            }
        };
    
        // 解析指令
        const args = e.msg.replace('#提升好感度', '').trim().split(' ');
        const target = args[0];
        const method = args[1] || "聊天";
    
        // 检查目标是否存在
        if (!worldData.npcRelations?.[target]) {
            let npcList = ["可互动的对象:"];
            for (const [npc, relation] of Object.entries(worldData.npcRelations || {})) {
                const level = getAffectionLevel(relation.affection);
                npcList.push(`${npc}: ${level} (好感度:${relation.affection})`);
            }
            e.reply(npcList.join('\n'));
            return;
        }
    
        // 获取互动方式信息
        const interactionInfo = affectionSystem.interactionTypes[method];
        if (!interactionInfo) {
            e.reply("无效的互动方式！");
            return;
        }
    
        // 检查消耗
        if (interactionInfo.消耗.体力 && worldData.属性.体力值 < interactionInfo.消耗.体力) {
            e.reply(`体力不足,需要${interactionInfo.消耗.体力}点体力！`);
            return;
        }
        if (interactionInfo.消耗.金币 && worldData.背包.金币 < interactionInfo.消耗.金币) {
            e.reply(`金币不足,需要${interactionInfo.消耗.金币}金币！`);
            return;
        }
    
        // 扣除消耗
        if (interactionInfo.消耗.体力) {
            worldData.属性.体力值 -= interactionInfo.消耗.体力;
        }
        if (interactionInfo.消耗.金币) {
            worldData.背包.金币 -= interactionInfo.消耗.金币;
        }
    
        // 计算好感度增加
        let affectionGain = interactionInfo.基础好感度;
        
        // 检查特殊加成
        if (worldData.属性.魅力值) {
            affectionGain *= (1 + worldData.属性.魅力值 / 100);
        }
        
        // 检查心情加成
        if (worldData.状态.心情 === "开心") {
            affectionGain *= 1.2;
        }
    
        // 执行互动
        const success = Math.random() < interactionInfo.成功率;
        if (success) {
            // 增加好感度
            worldData.npcRelations[target].affection = 
                (worldData.npcRelations[target].affection || 0) + affectionGain;
            
            // 记录互动次数
            worldData.npcRelations[target].interactions = 
                (worldData.npcRelations[target].interactions || 0) + 1;
    
            // 检查是否触发特殊事件
            let specialEvent = null;
            if (Math.random() < 0.1) { // 10%概率触发特殊事件
                specialEvent = generateSpecialEvent(target, worldData.npcRelations[target].affection);
            }
    
            // 保存数据
            await redis.set(`user:${userId}`, JSON.stringify(worldData));
            await saveUserData(userId, worldData);
    
            // 生成互动报告
            const interactionReport = [
                `〓 互动报告 〓\n`,
                `与 ${target} 进行了${method}`,
                `\n互动结果:`,
                `✨ 好感度+${affectionGain.toFixed(1)}`,
                `当前好感度: ${worldData.npcRelations[target].affection.toFixed(1)}`,
                `互动次数: ${worldData.npcRelations[target].interactions}`,
                specialEvent ? `\n🎉 触发特殊事件:\n${specialEvent}` : "",
                `\n当前状态:`,
                `💪 体力值: ${worldData.属性.体力值}`,
                `💰 金币: ${worldData.背包.金币}`,
                `\n💡 提示: 不同的互动方式会带来不同的效果哦！`
            ].join('\n');
    
            e.reply(interactionReport);
        } else {
            e.reply([
                `与${target}的互动似乎不太顺利...\n`,
                `消耗:`,
                interactionInfo.消耗.体力 ? `体力: ${interactionInfo.消耗.体力}` : "",
                interactionInfo.消耗.金币 ? `金币: ${interactionInfo.消耗.金币}` : "",
                `\n💡 提示: 可以尝试送些对方喜欢的礼物哦！`
            ].join('\n'));
        }
    }

    async learnNewDance(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 舞蹈系统
        const danceSystem = {
            // 基础舞蹈
            初级舞蹈: {
                "优雅旋转": {
                    类型: "古典",
                    消耗: { 体力: 20, 金币: 100 },
                    学习要求: { 等级: 1, 优雅值: 10 },
                    效果: "提升魅力",
                    加成值: 5,
                    持续时间: 1800000, // 30分钟
                    描述: "基础但优美的旋转舞步",
                    进阶舞蹈: ["花之华尔兹", "星光旋律"]
                },
                "甜心踢踏": {
                    类型: "现代",
                    消耗: { 体力: 15, 金币: 80 },
                    学习要求: { 等级: 1, 活力值: 8 },
                    效果: "提升敏捷",
                    加成值: 3,
                    持续时间: 1200000, // 20分钟
                    描述: "充满活力的踢踏舞步",
                    进阶舞蹈: ["欢乐踢踏", "雨点舞步"]
                }
            },
            
            // 进阶舞蹈
            中级舞蹈: {
                "花之华尔兹": {
                    类型: "古典",
                    消耗: { 体力: 35, 金币: 300 },
                    学习要求: { 等级: 10, 优雅值: 30 },
                    前置舞蹈: "优雅旋转",
                    效果: "大幅提升魅力并吸引花瓣",
                    加成值: 15,
                    持续时间: 3600000, // 1小时
                    描述: "伴随花瓣飞舞的华丽舞步",
                    进阶舞蹈: ["百花缭乱"]
                },
                "星光旋律": {
                    类型: "魔法",
                    消耗: { 体力: 40, 金币: 400 },
                    学习要求: { 等级: 15, 魔法亲和: 25 },
                    前置舞蹈: "优雅旋转",
                    效果: "产生星光效果并提升魔法",
                    加成值: 20,
                    持续时间: 2700000, // 45分钟
                    描述: "与星光共舞的神秘舞步",
                    进阶舞蹈: ["星辰舞曲"]
                }
            },
            
            // 高级舞蹈
            高级舞蹈: {
                "百花缭乱": {
                    类型: "古典",
                    消耗: { 体力: 60, 金币: 1000 },
                    学习要求: { 等级: 30, 优雅值: 80 },
                    前置舞蹈: "花之华尔兹",
                    效果: "召唤花海环绕",
                    加成值: 40,
                    持续时间: 7200000, // 2小时
                    描述: "让百花绽放的终极舞步",
                    特殊效果: "概率获得稀有花朵"
                },
                "星辰舞曲": {
                    类型: "魔法",
                    消耗: { 体力: 70, 金币: 1200 },
                    学习要求: { 等级: 35, 魔法亲和: 60 },
                    前置舞蹈: "星光旋律",
                    效果: "召唤星辰之力",
                    加成值: 50,
                    持续时间: 5400000, // 1.5小时
                    描述: "与星辰共鸣的至高舞步",
                    特殊效果: "夜晚效果翻倍"
                }
            }
        };
    
        // 舞蹈熟练度系统
        const proficiencySystem = {
            经验获得: {
                练习: 10,
                完美表演: 30,
                教导他人: 20
            },
            等级提升: {
                初学: { 经验: 100, 属性加成: 0.1 },
                熟练: { 经验: 300, 属性加成: 0.2 },
                精通: { 经验: 600, 属性加成: 0.3 },
                大师: { 经验: 1000, 属性加成: 0.5 }
            }
        };
    
        // 舞蹈组合效果
        const danceCombo = {
            "优雅旋转+甜心踢踏": {
                名称: "甜心华尔兹",
                效果: "魅力与活力加成翻倍",
                解锁条件: "两个舞蹈都达到5级"
            },
            "花之华尔兹+星光旋律": {
                名称: "星花协奏曲",
                效果: "同时获得花瓣和星光效果",
                解锁条件: "两个舞蹈都达到8级"
            }
        };
    
        // 解析学习指令
        const danceName = e.msg.replace('#学习新舞蹈', '').trim();
    
        // 如果没有指定舞蹈名称,显示可学习舞蹈列表
        if (!danceName) {
            let danceList = ["〓 可学习的舞蹈 〓\n"];
            
            // 遍历所有舞蹈等级
            for (const [level, dances] of Object.entries(danceSystem)) {
                danceList.push(`== ${level} ==`);
                for (const [name, info] of Object.entries(dances)) {
                    const canLearn = worldData.等级 >= info.学习要求.等级 && 
                                    worldData.属性[info.学习要求.优雅值 ? "优雅值" : "活力值"] >= 
                                    info.学习要求[info.学习要求.优雅值 ? "优雅值" : "活力值"];
                    
                    // 检查前置舞蹈
                    let meetsPrerequisite = true;
                    if (info.前置舞蹈) {
                        const prereqDance = worldData.舞蹈?.find(d => d.name === info.前置舞蹈);
                        meetsPrerequisite = prereqDance && prereqDance.level >= 5;
                    }
    
                    danceList.push(
                        `${canLearn && meetsPrerequisite ? "💃" : "❌"} ${name}`,
                        `  类型: ${info.类型}`,
                        `  效果: ${info.效果}`,
                        `  加成值: ${info.加成值}`,
                        `  体力消耗: ${info.消耗.体力}`,
                        `  学习费用: ${info.消耗.金币}金币`,
                        `  要求等级: ${info.学习要求.等级}`,
                        info.学习要求.优雅值 ? 
                            `  要求优雅值: ${info.学习要求.优雅值}` :
                            `  要求活力值: ${info.学习要求.活力值}`,
                        info.前置舞蹈 ? `  需要先掌握: ${info.前置舞蹈}` : "",
                        `  描述: ${info.描述}\n`
                    );
                }
            }
    
            // 显示已掌握的舞蹈组合
            if (worldData.舞蹈?.length >= 2) {
                danceList.push("== 舞蹈组合 ==");
                for (const [combo, info] of Object.entries(danceCombo)) {
                    const dances = combo.split('+');
                    const hasDances = dances.every(dance => 
                        worldData.舞蹈.find(d => d.name === dance)
                    );
                    if (hasDances) {
                        danceList.push(
                            `✨ ${info.名称}`,
                            `  需要舞蹈: ${dances.join(' + ')}`,
                            `  效果: ${info.效果}`,
                            `  解锁条件: ${info.解锁条件}\n`
                        );
                    }
                }
            }
    
            danceList.push(
                "💡 学习舞蹈指令: #学习新舞蹈 舞蹈名称",
                "例如: #学习新舞蹈 优雅旋转"
            );
    
            e.reply(danceList.join('\n'));
            return;
        }
    
        // 查找舞蹈信息
        let danceInfo = null;
        let danceLevel = null;
        for (const [level, dances] of Object.entries(danceSystem)) {
            if (dances[danceName]) {
                danceInfo = dances[danceName];
                danceLevel = level;
                break;
            }
        }
    
        if (!danceInfo) {
            e.reply("未找到该舞蹈,请检查舞蹈名称是否正确！");
            return;
        }
    
        // 检查是否已学习
        if (worldData.舞蹈?.find(d => d.name === danceName)) {
            e.reply("你已经学会这个舞蹈了！");
            return;
        }
    
        // 检查前置舞蹈
        if (danceInfo.前置舞蹈) {
            const prereqDance = worldData.舞蹈?.find(d => d.name === danceInfo.前置舞蹈);
            if (!prereqDance || prereqDance.level < 5) {
                e.reply(`需要先将${danceInfo.前置舞蹈}提升到5级才能学习这个舞蹈！`);
                return;
            }
        }
    
        // 检查等级要求
        if (worldData.等级 < danceInfo.学习要求.等级) {
            e.reply(`等级不足,学习该舞蹈需要达到${danceInfo.学习要求.等级}级！`);
            return;
        }
    
        // 检查属性要求
        const requiredStat = danceInfo.学习要求.优雅值 ? "优雅值" : "活力值";
        const requiredValue = danceInfo.学习要求[requiredStat];
        if (worldData.属性[requiredStat] < requiredValue) {
            e.reply(`${requiredStat}不足,学习该舞蹈需要${requiredValue}点${requiredStat}！`);
            return;
        }
    
        // 检查金币是否足够
        if (worldData.背包.金币 < danceInfo.消耗.金币) {
            e.reply(`金币不足,学习该舞蹈需要${danceInfo.消耗.金币}金币！`);
            return;
        }
    
        // 扣除金币
        worldData.背包.金币 -= danceInfo.消耗.金币;
    
        // 学习舞蹈
        if (!worldData.舞蹈) worldData.舞蹈 = [];
        worldData.舞蹈.push({
            name: danceName,
            type: danceInfo.类型,
            level: 1,
            exp: 0,
            nextLevelExp: proficiencySystem.等级提升.初学.经验
        });
    
        // 检查是否触发特殊效果
        let specialEffect = null;
        if (Math.random() < 0.1) { // 10%概率触发特殊效果
            specialEffect = {
                名称: "舞蹈天赋",
                效果: danceInfo.类型 === "古典" ? "优雅值永久+1" : "活力值永久+1"
            };
            worldData.属性[danceInfo.类型 === "古典" ? "优雅值" : "活力值"] += 1;
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成学习报告
        const learnReport = [
            `〓 舞蹈学习成功 〓\n`,
            `💃 学会了${danceLevel}: ${danceName}`,
            `\n舞蹈信息:`,
            `  类型: ${danceInfo.类型}`,
            `  效果: ${danceInfo.效果}`,
            `  加成值: ${danceInfo.加成值}`,
            `  持续时间: ${danceInfo.持续时间/60000}分钟`,
            danceInfo.特殊效果 ? `  特殊效果: ${danceInfo.特殊效果}` : "",
            specialEffect ? [
                `\n🎉 触发特殊效果:`,
                `- ${specialEffect.名称}`,
                `- ${specialEffect.效果}`
            ].join('\n') : "",
            `\n消耗:`,
            `💰 金币: ${danceInfo.消耗.金币}`,
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `💃 已学舞蹈数: ${worldData.舞蹈.length}`,
            `\n💡 提示:`,
            `1. 练习舞蹈可以获得熟练度`,
            `2. 舞蹈等级越高,效果越好`,
            `3. 某些舞蹈可以组合使用获得特殊效果`,
            `4. 在舞会上表演可以获得额外奖励`
        ].join('\n');
    
        e.reply(learnReport);
    }

    async performDance(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 舞蹈系统
        const danceSystem = {
            // 基础舞蹈
            基础舞蹈: {
                "优雅旋转": {
                    类型: "芭蕾",
                    消耗: { 体力: 20, 魔力: 10 },
                    学习要求: { 等级: 1, 魅力值: 10 },
                    效果: "提升周围友方心情",
                    加成值: 10,
                    冷却: 3000, // 3秒
                    描述: "基础的芭蕾旋转动作",
                    进阶舞蹈: ["星光旋舞", "月光华尔兹"]
                },
                "甜心舞步": {
                    类型: "街舞",
                    消耗: { 体力: 15, 魔力: 5 },
                    学习要求: { 等级: 1, 魅力值: 8 },
                    效果: "提升自身魅力",
                    加成值: 8,
                    冷却: 5000, // 5秒
                    描述: "充满活力的可爱舞步",
                    进阶舞蹈: ["流行热舞", "偶像舞步"]
                }
            },
    
            // 进阶舞蹈
            进阶舞蹈: {
                "星光旋舞": {
                    类型: "芭蕾",
                    消耗: { 体力: 30, 魔力: 20 },
                    学习要求: { 等级: 10, 魅力值: 30 },
                    前置舞蹈: "优雅旋转",
                    效果: "范围魅力提升",
                    加成值: 25,
                    冷却: 8000,
                    描述: "洒落星光的优美舞蹈",
                    进阶舞蹈: ["星光协奏曲"]
                },
                "流行热舞": {
                    类型: "街舞",
                    消耗: { 体力: 25, 魔力: 15 },
                    学习要求: { 等级: 10, 魅力值: 25 },
                    前置舞蹈: "甜心舞步",
                    效果: "范围活力提升",
                    加成值: 20,
                    冷却: 10000,
                    描述: "充满活力的现代舞蹈",
                    进阶舞蹈: ["偶像光芒"]
                }
            }
        };
    
        // 舞蹈表演场地
        const performanceVenues = {
            "魔法舞台": {
                等级要求: 1,
                魅力加成: 1.2,
                经验倍率: 1.0,
                特殊效果: "基础舞台效果",
                观众人数: "50-100",
                门票收入: 100
            },
            "星光剧场": {
                等级要求: 10,
                魅力加成: 1.5,
                经验倍率: 1.3,
                特殊效果: "星光闪耀",
                观众人数: "100-300",
                门票收入: 300
            },
            "梦幻大剧院": {
                等级要求: 20,
                魅力加成: 2.0,
                经验倍率: 1.8,
                特殊效果: "梦幻光环",
                观众人数: "300-1000",
                门票收入: 1000
            }
        };
    
        // 解析表演指令
        const performInfo = e.msg.replace('#表演舞蹈', '').trim().split(' ');
        const danceName = performInfo[0];
        const venue = performInfo[1] || "魔法舞台";
    
        // 如果没有指定舞蹈名称,显示可表演的舞蹈列表
        if (!danceName) {
            let danceList = ["〓 可表演的舞蹈 〓\n"];
            
            // 遍历所有舞蹈等级
            for (const [level, dances] of Object.entries(danceSystem)) {
                danceList.push(`== ${level} ==`);
                for (const [name, info] of Object.entries(dances)) {
                    const canPerform = worldData.等级 >= info.学习要求.等级 && 
                                     worldData.属性.魅力值 >= info.学习要求.魅力值;
                    
                    // 检查前置舞蹈
                    let meetsPrerequisite = true;
                    if (info.前置舞蹈) {
                        const prereqDance = worldData.舞蹈?.find(d => d.name === info.前置舞蹈);
                        meetsPrerequisite = prereqDance && prereqDance.level >= 5;
                    }
    
                    danceList.push(
                        `${canPerform && meetsPrerequisite ? "✨" : "❌"} ${name}`,
                        `  类型: ${info.类型}`,
                        `  效果: ${info.效果}`,
                        `  加成值: ${info.加成值}`,
                        `  体力消耗: ${info.消耗.体力}`,
                        `  魔力消耗: ${info.消耗.魔力}`,
                        `  要求等级: ${info.学习要求.等级}`,
                        `  要求魅力值: ${info.学习要求.魅力值}`,
                        info.前置舞蹈 ? `  需要先掌握: ${info.前置舞蹈}` : "",
                        `  描述: ${info.描述}\n`
                    );
                }
            }
    
            // 显示表演场地
            danceList.push("== 表演场地 ==");
            for (const [name, info] of Object.entries(performanceVenues)) {
                danceList.push(
                    `🏛️ ${name}`,
                    `  等级要求: ${info.等级要求}`,
                    `  魅力加成: ${info.魅力加成}x`,
                    `  经验倍率: ${info.经验倍率}x`,
                    `  特殊效果: ${info.特殊效果}`,
                    `  观众规模: ${info.观众人数}人`,
                    `  基础门票收入: ${info.门票收入}金币\n`
                );
            }
    
            danceList.push(
                "💡 表演方式: #表演舞蹈 舞蹈名称 场地名称",
                "例如: #表演舞蹈 优雅旋转 魔法舞台"
            );
    
            e.reply(danceList.join('\n'));
            return;
        }
    
        // 查找舞蹈信息
        let danceInfo = null;
        let danceLevel = null;
        for (const [level, dances] of Object.entries(danceSystem)) {
            if (dances[danceName]) {
                danceInfo = dances[danceName];
                danceLevel = level;
                break;
            }
        }
    
        if (!danceInfo) {
            e.reply("未找到该舞蹈,请检查舞蹈名称是否正确！");
            return;
        }
    
        // 检查场地是否存在
        const venueInfo = performanceVenues[venue];
        if (!venueInfo) {
            e.reply("该表演场地不存在！");
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < venueInfo.等级要求) {
            e.reply(`等级不足,需要等级${venueInfo.等级要求}才能在${venue}表演！`);
            return;
        }
    
        // 检查体力和魔力是否足够
        if (worldData.属性.体力值 < danceInfo.消耗.体力) {
            e.reply(`体力不足,表演${danceName}需要${danceInfo.消耗.体力}点体力！`);
            return;
        }
        if (worldData.属性.魔力值 < danceInfo.消耗.魔力) {
            e.reply(`魔力不足,表演${danceName}需要${danceInfo.消耗.魔力}点魔力！`);
            return;
        }
    
        // 检查冷却时间
        const cooldown = await redis.get(`cooldown:dance:${userId}:${danceName}`);
        if (cooldown && Date.now() < parseInt(cooldown)) {
            const remainTime = Math.ceil((parseInt(cooldown) - Date.now()) / 1000);
            e.reply(`该舞蹈还在冷却中,剩余${remainTime}秒！`);
            return;
        }
    
        // 执行表演
        const performanceResult = await executeDancePerformance(worldData, danceInfo, venueInfo);
    
        // 更新玩家数据
        worldData.属性.体力值 -= danceInfo.消耗.体力;
        worldData.属性.魔力值 -= danceInfo.消耗.魔力;
        worldData.经验值 += performanceResult.获得经验;
        worldData.背包.金币 += performanceResult.获得金币;
    
        // 检查升级
        if (worldData.经验值 >= worldData.升级所需经验) {
            worldData.等级 += 1;
            worldData.经验值 -= worldData.升级所需经验;
            worldData.升级所需经验 = Math.floor(worldData.升级所需经验 * 1.2);
        }
    
        // 设置冷却时间
        await redis.set(`cooldown:dance:${userId}:${danceName}`, 
            Date.now() + danceInfo.冷却);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成表演报告
        const performanceReport = [
            `〓 舞蹈表演报告 〓\n`,
            `🎭 表演舞蹈: ${danceName}`,
            `📍 表演场地: ${venue}`,
            `\n表演效果:`,
            ...performanceResult.表演过程,
            `\n观众反应:`,
            ...performanceResult.观众反应,
            `\n获得奖励:`,
            `✨ 经验值: +${performanceResult.获得经验}`,
            `💰 金币: +${performanceResult.获得金币}`,
            performanceResult.特殊奖励 ? `🎁 特殊奖励: ${performanceResult.特殊奖励}` : "",
            `\n当前状态:`,
            `💪 体力值: ${worldData.属性.体力值}`,
            `✨ 魔力值: ${worldData.属性.魔力值}`,
            `📈 经验值: ${worldData.经验值}/${worldData.升级所需经验}`,
            `💰 金币: ${worldData.背包.金币}`,
            `\n💡 提示: 不同场地会带来不同的表演效果和奖励！`
        ].join('\n');
    
        e.reply(performanceReport);
    }

    async learnNewElement(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 元素系统基础设置
        const elementSystem = {
            基础元素: {
                "火": {
                    描述: "充满热情的火焰元素",
                    基础亲和: 10,
                    属性加成: {
                        魔法攻击: 15,
                        火属性伤害: 20
                    },
                    解锁条件: {
                        等级: 1,
                        魔法亲和: 0
                    }
                },
                "水": {
                    描述: "柔和流动的水元素",
                    基础亲和: 10,
                    属性加成: {
                        治疗效果: 15,
                        水属性伤害: 15
                    },
                    解锁条件: {
                        等级: 1,
                        魔法亲和: 0
                    }
                }
                // ... 更多基础元素
            },
    
            进阶元素: {
                "冰": {
                    描述: "寒冷凝结的冰元素",
                    基础亲和: 20,
                    属性加成: {
                        魔法防御: 20,
                        冰属性伤害: 25
                    },
                    解锁条件: {
                        等级: 10,
                        魔法亲和: 20,
                        需求元素: ["水"]
                    }
                }
                // ... 更多进阶元素
            },
    
            特殊元素: {
                "星光": {
                    描述: "闪耀璀璨的星光元素",
                    基础亲和: 30,
                    属性加成: {
                        全属性: 10,
                        星光属性伤害: 30
                    },
                    解锁条件: {
                        等级: 20,
                        魔法亲和: 50,
                        成就要求: ["收集星光", "星光亲和"]
                    }
                }
                // ... 更多特殊元素
            }
        };
    
        // 获取要学习的元素
        const elementName = e.msg.replace('#学习新元素', '').trim();
        
        // 如果没有指定元素名称，显示可学习的元素列表
        if (!elementName) {
            let elementList = ["〓 可学习的元素 〓\n"];
            
            // 显示基础元素
            elementList.push("== 基础元素 ==");
            for (const [name, info] of Object.entries(elementSystem.基础元素)) {
                const canLearn = worldData.等级 >= info.解锁条件.等级 && 
                               worldData.魔法亲和 >= info.解锁条件.魔法亲和;
                elementList.push(
                    `${canLearn ? "✨" : "❌"} ${name}`,
                    `  描述: ${info.描述}`,
                    `  基础亲和: ${info.基础亲和}`,
                    `  属性加成:`,
                    ...Object.entries(info.属性加成).map(([attr, value]) => 
                        `    ${attr}+${value}`),
                    `  要求等级: ${info.解锁条件.等级}`,
                    `  要求魔法亲和: ${info.解锁条件.魔法亲和}\n`
                );
            }
    
            // 显示进阶元素
            elementList.push("== 进阶元素 ==");
            for (const [name, info] of Object.entries(elementSystem.进阶元素)) {
                const canLearn = worldData.等级 >= info.解锁条件.等级 && 
                               worldData.魔法亲和 >= info.解锁条件.魔法亲和 &&
                               info.解锁条件.需求元素.every(elem => 
                                   worldData.元素?.includes(elem));
                elementList.push(
                    `${canLearn ? "✨" : "❌"} ${name}`,
                    `  描述: ${info.描述}`,
                    `  基础亲和: ${info.基础亲和}`,
                    `  属性加成:`,
                    ...Object.entries(info.属性加成).map(([attr, value]) => 
                        `    ${attr}+${value}`),
                    `  要求等级: ${info.解锁条件.等级}`,
                    `  要求魔法亲和: ${info.解锁条件.魔法亲和}`,
                    `  需求元素: ${info.解锁条件.需求元素.join('、')}\n`
                );
            }
    
            // 显示特殊元素
            const unlockedSpecial = Object.entries(elementSystem.特殊元素)
                .filter(([name, info]) => 
                    info.解锁条件.成就要求.every(achievement => 
                        worldData.成就?.includes(achievement)));
                        
            if (unlockedSpecial.length > 0) {
                elementList.push("== 特殊元素 ==");
                for (const [name, info] of unlockedSpecial) {
                    const canLearn = worldData.等级 >= info.解锁条件.等级 && 
                                   worldData.魔法亲和 >= info.解锁条件.魔法亲和;
                    elementList.push(
                        `${canLearn ? "✨" : "❌"} ${name}`,
                        `  描述: ${info.描述}`,
                        `  基础亲和: ${info.基础亲和}`,
                        `  属性加成:`,
                        ...Object.entries(info.属性加成).map(([attr, value]) => 
                            `    ${attr}+${value}`),
                        `  要求等级: ${info.解锁条件.等级}`,
                        `  要求魔法亲和: ${info.解锁条件.魔法亲和}`,
                        `  需求成就: ${info.解锁条件.成就要求.join('、')}\n`
                    );
                }
            }
    
            elementList.push(
                "💡 学习元素指令: #学习新元素 元素名称",
                "例如: #学习新元素 火"
            );
            
            e.reply(elementList.join('\n'));
            return;
        }
    
        // 查找元素信息
        let elementInfo = null;
        let elementType = null;
        for (const [type, elements] of Object.entries(elementSystem)) {
            if (elements[elementName]) {
                elementInfo = elements[elementName];
                elementType = type;
                break;
            }
        }
    
        if (!elementInfo) {
            e.reply("未找到该元素,请检查元素名称是否正确！");
            return;
        }
    
        // 检查是否已学习
        if (worldData.元素?.includes(elementName)) {
            e.reply("你已经掌握了这个元素！");
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < elementInfo.解锁条件.等级) {
            e.reply(`等级不足,学习该元素需要达到${elementInfo.解锁条件.等级}级！`);
            return;
        }
    
        // 检查魔法亲和要求
        if (worldData.魔法亲和 < elementInfo.解锁条件.魔法亲和) {
            e.reply(`魔法亲和不足,学习该元素需要${elementInfo.解锁条件.魔法亲和}点魔法亲和！`);
            return;
        }
    
        // 检查前置元素要求
        if (elementInfo.解锁条件.需求元素) {
            const missingElements = elementInfo.解锁条件.需求元素
                .filter(elem => !worldData.元素?.includes(elem));
            if (missingElements.length > 0) {
                e.reply(`需要先掌握以下元素: ${missingElements.join('、')}`);
                return;
            }
        }
    
        // 检查成就要求
        if (elementInfo.解锁条件.成就要求) {
            const missingAchievements = elementInfo.解锁条件.成就要求
                .filter(achievement => !worldData.成就?.includes(achievement));
            if (missingAchievements.length > 0) {
                e.reply(`需要先完成以下成就: ${missingAchievements.join('、')}`);
                return;
            }
        }
    
        // 学习元素
        if (!worldData.元素) worldData.元素 = [];
        worldData.元素.push(elementName);
    
        // 初始化元素亲和度
        if (!worldData.元素亲和度) worldData.元素亲和度 = {};
        worldData.元素亲和度[elementName] = {
            等级: 1,
            经验值: 0,
            升级经验: 100,
            当前亲和: elementInfo.基础亲和
        };
    
        // 应用属性加成
        for (const [attr, value] of Object.entries(elementInfo.属性加成)) {
            if (attr === "全属性") {
                for (const baseAttr of ["攻击力", "防御力", "魔法攻击", "魔法防御", "速度"]) {
                    worldData.属性[baseAttr] = Math.floor(worldData.属性[baseAttr] * (1 + value/100));
                }
            } else {
                worldData.属性[attr] = (worldData.属性[attr] || 0) + value;
            }
        }
    
        // 检查元素组合效果
        const combinations = checkElementCombinations(worldData.元素);
        let newEffects = [];
        if (combinations.length > 0) {
            for (const combo of combinations) {
                applyElementCombination(worldData, combo);
                newEffects.push(combo);
            }
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成学习报告
        const learnReport = [
            `〓 元素学习成功 〓\n`,
            `✨ 掌握了${elementType}: ${elementName}`,
            `\n元素信息:`,
            `  描述: ${elementInfo.描述}`,
            `  基础亲和: ${elementInfo.基础亲和}`,
            `\n获得属性加成:`,
            ...Object.entries(elementInfo.属性加成).map(([attr, value]) => 
                `  ${attr}+${value}`),
            newEffects.length > 0 ? [
                `\n🎉 触发元素组合:`,
                ...newEffects.map(effect => 
                    `- ${effect.名称}: ${effect.描述}`
                )
            ].join('\n') : "",
            `\n当前状态:`,
            `✨ 元素亲和度: ${worldData.元素亲和度[elementName].当前亲和}`,
            `📚 已掌握元素: ${worldData.元素.length}个`,
            `\n💡 提示:`,
            `1. 使用元素魔法可以提升元素亲和度`,
            `2. 元素之间可以组合产生特殊效果`,
            `3. 提升元素亲和度可以解锁更强大的魔法`
        ].join('\n');
    
        e.reply(learnReport);
    }
    
    async elementFusion(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 元素融合系统
        const elementSystem = {
            // 基础元素
            基础元素: {
                "火": {
                    属性: "炎",
                    亲和力要求: 10,
                    基础伤害: 30,
                    特性: "灼烧"
                },
                "水": {
                    属性: "流",
                    亲和力要求: 10,
                    基础伤害: 25,
                    特性: "湿润"
                },
                "风": {
                    属性: "气",
                    亲和力要求: 10,
                    基础伤害: 20,
                    特性: "飘浮"
                },
                "地": {
                    属性: "岩",
                    亲和力要求: 10,
                    基础伤害: 35,
                    特性: "坚固"
                },
                "光": {
                    属性: "圣",
                    亲和力要求: 15,
                    基础伤害: 40,
                    特性: "净化"
                },
                "暗": {
                    属性: "影",
                    亲和力要求: 15,
                    基础伤害: 45,
                    特性: "侵蚀"
                }
            },
    
            // 元素融合规则
            融合规则: {
                "火+水": {
                    结果: "蒸汽",
                    描述: "炽热的水汽",
                    伤害倍率: 1.5,
                    特殊效果: "降低目标防御"
                },
                "火+风": {
                    结果: "烈焰风暴",
                    描述: "灼热的旋风",
                    伤害倍率: 1.8,
                    特殊效果: "范围伤害"
                },
                "水+风": {
                    结果: "冰霜",
                    描述: "凝结的寒气",
                    伤害倍率: 1.6,
                    特殊效果: "减速效果"
                },
                "光+暗": {
                    结果: "混沌",
                    描述: "矛盾的力量",
                    伤害倍率: 2.0,
                    特殊效果: "随机效果"
                }
            },
    
            // 融合要求
            融合要求: {
                最低等级: 10,
                魔力消耗: 50,
                冷却时间: 300000, // 5分钟
                成功率基数: 0.7
            },
    
            // 特殊组合
            特殊组合: {
                "火+水+风": {
                    结果: "三重元素风暴",
                    描述: "狂暴的元素混合",
                    伤害倍率: 2.5,
                    特殊效果: ["范围伤害", "持续伤害", "控制效果"],
                    要求等级: 30
                }
            }
        };
    
        // 解析融合指令
        const elements = e.msg.replace('#元素融合', '').trim().split('+').map(e => e.trim());
    
        // 检查元素数量
        if (elements.length < 2) {
            let fusionGuide = [
                "〓 元素融合指南 〓\n",
                "可用元素:",
                ...Object.entries(elementSystem.基础元素).map(([name, info]) => 
                    `- ${name}: ${info.描述}`
                ),
                "\n可用融合:",
                ...Object.entries(elementSystem.融合规则).map(([combo, info]) => 
                    `- ${combo} => ${info.结果} (${info.描述})`
                ),
                "\n特殊组合:",
                ...Object.entries(elementSystem.特殊组合).map(([combo, info]) => 
                    `- ${combo} => ${info.结果} (${info.描述})`
                ),
                "\n使用方法: #元素融合 元素1+元素2",
                "例如: #元素融合 火+水"
            ];
            e.reply(fusionGuide.join('\n'));
            return;
        }
    
        // 检查元素是否存在
        for (const element of elements) {
            if (!elementSystem.基础元素[element]) {
                e.reply(`未知的元素: ${element}`);
                return;
            }
        }
    
        // 检查等级要求
        if (worldData.等级 < elementSystem.融合要求.最低等级) {
            e.reply(`等级不足,需要等级${elementSystem.融合要求.最低等级}！`);
            return;
        }
    
        // 检查魔力是否足够
        if (worldData.属性.魔力值 < elementSystem.融合要求.魔力消耗) {
            e.reply(`魔力不足,需要${elementSystem.融合要求.魔力消耗}点魔力！`);
            return;
        }
    
        // 检查冷却时间
        const cooldown = await redis.get(`cooldown:fusion:${userId}`);
        if (cooldown && Date.now() < parseInt(cooldown)) {
            const remainTime = Math.ceil((parseInt(cooldown) - Date.now()) / 1000);
            e.reply(`元素融合还在冷却中,剩余${remainTime}秒！`);
            return;
        }
    
        // 获取融合组合
        const fusionKey = elements.join('+');
        let fusionInfo;
        
        if (elements.length >= 3 && elementSystem.特殊组合[fusionKey]) {
            // 特殊组合
            fusionInfo = elementSystem.特殊组合[fusionKey];
            if (worldData.等级 < fusionInfo.要求等级) {
                e.reply(`等级不足,该特殊组合需要等级${fusionInfo.要求等级}！`);
                return;
            }
        } else if (elementSystem.融合规则[fusionKey]) {
            // 普通融合
            fusionInfo = elementSystem.融合规则[fusionKey];
        } else {
            e.reply("无效的元素组合！");
            return;
        }
    
        // 计算成功率
        let successRate = elementSystem.融合要求.成功率基数;
        // 等级加成
        successRate += (worldData.等级 - elementSystem.融合要求.最低等级) * 0.01;
        // 元素亲和加成
        const elementAffinity = elements.reduce((sum, element) => 
            sum + (worldData.元素亲和?.[element] || 0), 0) / elements.length;
        successRate += elementAffinity * 0.02;
    
        // 执行融合
        const success = Math.random() < successRate;
        
        // 扣除魔力
        worldData.属性.魔力值 -= elementSystem.融合要求.魔力消耗;
    
        if (!success) {
            // 设置冷却时间
            await redis.set(`cooldown:fusion:${userId}`, 
                Date.now() + elementSystem.融合要求.冷却时间/2);
            
            // 保存数据
            await redis.set(`user:${userId}`, JSON.stringify(worldData));
            await saveUserData(userId, worldData);
            
            e.reply([
                "元素融合失败...",
                `消耗魔力: ${elementSystem.融合要求.魔力消耗}`,
                `剩余魔力: ${worldData.属性.魔力值}`,
                "\n💡 提示: 提升等级和元素亲和度可以提高融合成功率"
            ].join('\n'));
            return;
        }
    
        // 融合成功
        // 创建新法术
        const newSpell = {
            名称: fusionInfo.结果,
            类型: "融合法术",
            伤害: Math.floor(
                elements.reduce((sum, element) => 
                    sum + elementSystem.基础元素[element].基础伤害, 0) * 
                fusionInfo.伤害倍率
            ),
            魔力消耗: Math.floor(elementSystem.融合要求.魔力消耗 * 1.5),
            冷却时间: 30000, // 30秒
            特殊效果: fusionInfo.特殊效果,
            描述: fusionInfo.描述
        };
    
        // 添加到玩家法术列表
        if (!worldData.魔法) worldData.魔法 = [];
        const existingSpell = worldData.魔法.findIndex(s => s.名称 === newSpell.名称);
        if (existingSpell >= 0) {
            worldData.魔法[existingSpell].熟练度 = (worldData.魔法[existingSpell].熟练度 || 0) + 1;
        } else {
            worldData.魔法.push({
                ...newSpell,
                熟练度: 1
            });
        }
    
        // 提升元素亲和度
        elements.forEach(element => {
            if (!worldData.元素亲和) worldData.元素亲和 = {};
            worldData.元素亲和[element] = (worldData.元素亲和[element] || 0) + 1;
        });
    
        // 设置冷却时间
        await redis.set(`cooldown:fusion:${userId}`, 
            Date.now() + elementSystem.融合要求.冷却时间);
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成融合报告
        const fusionReport = [
            `〓 元素融合成功 〓\n`,
            `✨ 融合: ${elements.join('+')} => ${fusionInfo.结果}`,
            `\n法术信息:`,
            `  伤害: ${newSpell.伤害}`,
            `  魔力消耗: ${newSpell.魔力消耗}`,
            `  冷却时间: ${newSpell.冷却时间/1000}秒`,
            Array.isArray(newSpell.特殊效果) ?
                `  特殊效果: ${newSpell.特殊效果.join('、')}` :
                `  特殊效果: ${newSpell.特殊效果}`,
            `  描述: ${newSpell.描述}`,
            `\n元素亲和提升:`,
            ...elements.map(element => 
                `- ${element}: ${worldData.元素亲和[element]}`
            ),
            `\n当前状态:`,
            `✨ 魔力值: ${worldData.属性.魔力值}`,
            `\n💡 提示: 多次使用同一融合法术可以提升熟练度！`
        ].join('\n');
    
        e.reply(fusionReport);
    }

    async strengthenSkill(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 技能强化系统
        const skillSystem = {
            // 基础技能
            基础技能: {
                "优雅舞步": {
                    type: "舞蹈",
                    baseEffect: "魅力提升",
                    maxLevel: 10,
                    levelUpCost: {
                        gold: 100,
                        materials: ["舞蹈手册", "优雅丝带"]
                    },
                    levelEffects: {
                        1: { charm: 5 },
                        5: { charm: 15, special: "轻盈舞姿" },
                        10: { charm: 30, special: "完美舞姿" }
                    }
                },
                "甜点制作": {
                    type: "生活",
                    baseEffect: "料理成功率提升",
                    maxLevel: 10,
                    levelUpCost: {
                        gold: 80,
                        materials: ["食谱", "新鲜食材"]
                    },
                    levelEffects: {
                        1: { cookSuccess: 0.1 },
                        5: { cookSuccess: 0.3, special: "美味加成" },
                        10: { cookSuccess: 0.5, special: "完美料理" }
                    }
                }
            },
    
            // 进阶技能
            进阶技能: {
                "星光魔法": {
                    type: "魔法",
                    baseEffect: "魔法伤害提升",
                    maxLevel: 15,
                    requireSkills: ["基础魔法"],
                    levelUpCost: {
                        gold: 200,
                        materials: ["星光结晶", "魔法精髓"]
                    },
                    levelEffects: {
                        1: { magicDamage: 10 },
                        8: { magicDamage: 25, special: "星光闪耀" },
                        15: { magicDamage: 50, special: "星光风暴" }
                    }
                }
            },
    
            // 特殊技能
            特殊技能: {
                "月光共鸣": {
                    type: "特殊",
                    baseEffect: "夜间能力提升",
                    maxLevel: 20,
                    requireSkills: ["星光魔法"],
                    levelUpCost: {
                        gold: 500,
                        materials: ["月光精华", "神秘符文"]
                    },
                    levelEffects: {
                        1: { nightBonus: 0.15 },
                        10: { nightBonus: 0.3, special: "月光祝福" },
                        20: { nightBonus: 0.5, special: "月神眷顾" }
                    }
                }
            }
        };
    
        // 强化效果系统
        const enhanceSystem = {
            // 强化成功率计算
            calculateSuccess: (skill, currentLevel) => {
                const baseRate = 0.9;
                const levelPenalty = currentLevel * 0.05;
                return Math.max(0.1, baseRate - levelPenalty);
            },
    
            // 材料加成计算
            calculateMaterialBonus: (materials) => {
                let bonus = 0;
                materials.forEach(material => {
                    switch(material.quality) {
                        case "完美":
                            bonus += 0.2;
                            break;
                        case "优秀":
                            bonus += 0.1;
                            break;
                        default:
                            bonus += 0.05;
                    }
                });
                return bonus;
            },
    
            // 特殊效果触发
            triggerSpecialEffect: (skill, level) => {
                const effects = [];
                if (skill.levelEffects[level]?.special) {
                    effects.push({
                        name: skill.levelEffects[level].special,
                        description: `触发特殊效果: ${skill.levelEffects[level].special}`
                    });
                }
                return effects;
            }
        };
    
        const skillName = e.msg.replace('#强化技能', '').trim();
        let skillInfo = null;
        let skillCategory = null;
    
        // 查找技能信息
        for (const [category, skills] of Object.entries(skillSystem)) {
            if (skills[skillName]) {
                skillInfo = skills[skillName];
                skillCategory = category;
                break;
            }
        }
    
        if (!skillInfo) {
            e.reply("未找到该技能,请检查技能名称是否正确！");
            return;
        }
    
        // 检查技能是否已学习
        const userSkill = worldData.技能?.find(s => s.name === skillName);
        if (!userSkill) {
            e.reply("你还没有学习这个技能！");
            return;
        }
    
        // 检查等级上限
        if (userSkill.level >= skillInfo.maxLevel) {
            e.reply(`${skillName}已达到最高等级${skillInfo.maxLevel}！`);
            return;
        }
    
        // 检查前置技能
        if (skillInfo.requireSkills) {
            const missingSkills = skillInfo.requireSkills.filter(
                reqSkill => !worldData.技能.find(s => 
                    s.name === reqSkill && s.level >= 5
                )
            );
            if (missingSkills.length > 0) {
                e.reply(`需要先将以下技能提升到5级:\n${missingSkills.join('\n')}`);
                return;
            }
        }
    
        // 计算强化消耗
        const currentLevel = userSkill.level;
        const costMultiplier = Math.pow(1.2, currentLevel);
        const goldCost = Math.floor(skillInfo.levelUpCost.gold * costMultiplier);
        const materialCosts = {};
        skillInfo.levelUpCost.materials.forEach(material => {
            materialCosts[material] = Math.ceil(costMultiplier);
        });
    
        // 检查材料是否足够
        let insufficientItems = [];
        if (worldData.背包.金币 < goldCost) {
            insufficientItems.push(`金币(差${goldCost - worldData.背包.金币})`);
        }
        for (const [material, amount] of Object.entries(materialCosts)) {
            if (!worldData.背包.材料[material] || 
                worldData.背包.材料[material] < amount) {
                const current = worldData.背包.材料[material] || 0;
                insufficientItems.push(`${material}(差${amount - current})`);
            }
        }
    
        if (insufficientItems.length > 0) {
            e.reply(`强化所需材料不足：\n${insufficientItems.join('\n')}`);
            return;
        }
    
        // 计算强化成功率
        const baseSuccess = enhanceSystem.calculateSuccess(skillInfo, currentLevel);
        const materialBonus = enhanceSystem.calculateMaterialBonus(
            Object.keys(materialCosts).map(material => ({
                name: material,
                quality: worldData.背包.材料[material]?.quality || "普通"
            }))
        );
        const finalSuccess = Math.min(0.95, baseSuccess + materialBonus);
    
        // 执行强化
        const success = Math.random() < finalSuccess;
    
        // 扣除材料
        worldData.背包.金币 -= goldCost;
        for (const [material, amount] of Object.entries(materialCosts)) {
            worldData.背包.材料[material] -= amount;
            if (worldData.背包.材料[material] <= 0) {
                delete worldData.背包.材料[material];
            }
        }
    
        if (!success) {
            await redis.set(`user:${userId}`, JSON.stringify(worldData));
            await saveUserData(userId, worldData);
            e.reply([
                "强化失败...",
                `💰 消耗${goldCost}金币`,
                ...Object.entries(materialCosts).map(([material, amount]) =>
                    `📦 ${material} x${amount}`
                ),
                `\n当前状态:`,
                `💰 剩余金币: ${worldData.背包.金币}`,
                `\n💡 提示: 使用高品质材料可以提高成功率！`
            ].join('\n'));
            return;
        }
    
        // 强化成功
        userSkill.level += 1;
        
        // 获取等级效果
        const levelEffect = skillInfo.levelEffects[userSkill.level];
        const specialEffects = enhanceSystem.triggerSpecialEffect(
            skillInfo, 
            userSkill.level
        );
    
        // 应用属性加成
        if (levelEffect) {
            for (const [attr, value] of Object.entries(levelEffect)) {
                if (attr !== 'special') {
                    worldData.属性[attr] = (worldData.属性[attr] || 0) + value;
                }
            }
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成强化报告
        const enhanceReport = [
            `〓 技能强化报告 〓\n`,
            `✨ ${skillName}强化成功！`,
            `  ${currentLevel} → ${userSkill.level}`,
            `\n获得效果:`,
            ...Object.entries(levelEffect || {})
                .filter(([attr]) => attr !== 'special')
                .map(([attr, value]) => `- ${attr}+${value}`),
            specialEffects.length > 0 ? [
                `\n🎉 触发特殊效果:`,
                ...specialEffects.map(effect => 
                    `- ${effect.name}: ${effect.description}`
                )
            ].join('\n') : "",
            `\n消耗材料:`,
            `💰 金币: ${goldCost}`,
            ...Object.entries(materialCosts).map(([material, amount]) =>
                `📦 ${material} x${amount}`
            ),
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `\n💡 提示:`,
            `1. 技能等级越高,效果越好`,
            `2. 某些等级会解锁特殊效果`,
            `3. 使用高品质材料可以提高成功率`
        ].join('\n');
    
        e.reply(enhanceReport);
    }

    async strengthenSpell(e) {
        const userId = e.user_id;
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        const userData = await checkUserData(userId);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 法术强化系统
        const spellStrengthSystem = {
            // 强化材料需求
            materials: {
                基础强化: {
                    "魔法精华": 2,
                    "星光碎片": 1,
                    金币: 100
                },
                进阶强化: {
                    "高级魔法精华": 3,
                    "月光结晶": 2,
                    金币: 300
                },
                完美强化: {
                    "魔法核心": 1,
                    "彩虹水晶": 2,
                    金币: 500
                }
            },
    
            // 强化效果
            effects: {
                基础强化: {
                    伤害提升: 1.1,
                    魔力消耗: 0.95,
                    冷却时间: 0.98
                },
                进阶强化: {
                    伤害提升: 1.2,
                    魔力消耗: 0.9,
                    冷却时间: 0.95,
                    特殊效果: "概率触发法术共鸣"
                },
                完美强化: {
                    伤害提升: 1.3,
                    魔力消耗: 0.85,
                    冷却时间: 0.9,
                    特殊效果: "必定触发法术共鸣"
                }
            },
    
            // 强化概率
            successRate: {
                基础强化: 0.95,
                进阶强化: 0.8,
                完美强化: 0.6
            }
        };
    
        // 解析强化指令
        const [spellName, strengthType = "基础强化"] = e.msg.replace('#强化法术', '').trim().split(' ');
    
        // 检查法术是否存在
        const spell = worldData.魔法?.find(s => s.name === spellName);
        if (!spell) {
            e.reply("你还没有学会这个法术！");
            return;
        }
    
        // 获取强化信息
        const strengthInfo = spellStrengthSystem.materials[strengthType];
        if (!strengthInfo) {
            e.reply("无效的强化方式！");
            return;
        }
    
        // 检查材料是否足够
        const missingMaterials = [];
        for (const [material, amount] of Object.entries(strengthInfo)) {
            if (material === "金币") {
                if (worldData.背包.金币 < amount) {
                    missingMaterials.push(`金币不足(差${amount - worldData.背包.金币})`);
                }
            } else {
                const owned = worldData.背包.材料[material] || 0;
                if (owned < amount) {
                    missingMaterials.push(`${material}不足(差${amount - owned})`);
                }
            }
        }
    
        if (missingMaterials.length > 0) {
            e.reply([
                "强化所需材料不足：",
                ...missingMaterials
            ].join('\n'));
            return;
        }
    
        // 扣除材料
        for (const [material, amount] of Object.entries(strengthInfo)) {
            if (material === "金币") {
                worldData.背包.金币 -= amount;
            } else {
                worldData.背包.材料[material] -= amount;
            }
        }
    
        // 执行强化
        const success = Math.random() < spellStrengthSystem.successRate[strengthType];
        if (!success) {
            await redis.set(`user:${userId}`, JSON.stringify(worldData));
            await saveUserData(userId, worldData);
            e.reply([
                "强化失败...",
                "材料消耗已扣除",
                `当前强化等级: ${spell.level}`,
                "\n💡 提示: 使用更好的材料可以提高成功率"
            ].join('\n'));
            return;
        }
    
        // 应用强化效果
        const effect = spellStrengthSystem.effects[strengthType];
        spell.level += 1;
        spell.damage = Math.floor(spell.damage * effect.伤害提升);
        spell.manaCost = Math.floor(spell.manaCost * effect.魔力消耗);
        spell.cooldown = Math.floor(spell.cooldown * effect.冷却时间);
    
        // 检查是否触发特殊效果
        let specialEffect = null;
        if (effect.特殊效果) {
            specialEffect = {
                名称: effect.特殊效果,
                效果: "下次施法伤害翻倍"
            };
            if (!worldData.状态.增益效果) {
                worldData.状态.增益效果 = [];
            }
            worldData.状态.增益效果.push({
                名称: effect.特殊效果,
                效果: specialEffect.效果,
                持续时间: 3600000 // 1小时
            });
        }
    
        // 更新魔法熟练度
        if (!worldData.魔法熟练度) worldData.魔法熟练度 = {};
        if (!worldData.魔法熟练度[spellName]) {
            worldData.魔法熟练度[spellName] = {
                等级: 1,
                经验: 0,
                下一级经验: 100
            };
        }
        worldData.魔法熟练度[spellName].经验 += 50;
    
        // 检查熟练度升级
        const proficiency = worldData.魔法熟练度[spellName];
        if (proficiency.经验 >= proficiency.下一级经验) {
            proficiency.等级 += 1;
            proficiency.经验 -= proficiency.下一级经验;
            proficiency.下一级经验 = Math.floor(proficiency.下一级经验 * 1.2);
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成强化报告
        const strengthenReport = [
            `〓 法术强化报告 〓\n`,
            `✨ ${spellName} 强化成功！`,
            `当前等级: ${spell.level}`,
            `\n强化效果:`,
            `⚔️ 伤害: ${Math.floor(spell.damage/effect.伤害提升)} → ${spell.damage}`,
            `✨ 魔力消耗: ${Math.floor(spell.manaCost/effect.魔力消耗)} → ${spell.manaCost}`,
            `⏱️ 冷却时间: ${Math.floor(spell.cooldown/effect.冷却时间/1000)} → ${spell.cooldown/1000}秒`,
            specialEffect ? [
                `\n🎉 触发特殊效果:`,
                `- ${specialEffect.名称}`,
                `- ${specialEffect.效果}`
            ].join('\n') : "",
            `\n熟练度提升:`,
            `当前等级: ${proficiency.等级}`,
            `经验值: ${proficiency.经验}/${proficiency.下一级经验}`,
            `\n消耗材料:`,
            ...Object.entries(strengthInfo).map(([material, amount]) => 
                `- ${material}: ${amount}`
            ),
            `\n当前状态:`,
            `💰 剩余金币: ${worldData.背包.金币}`,
            `\n💡 提示: 法术等级越高,特殊效果触发概率越高！`
        ].join('\n');
    
        e.reply(strengthenReport);
    }

    async strengthenSpellEquipment(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !worldData || JSON.stringify(userData) !== JSON.stringify(worldData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 魔法装备强化系统
        const magicEquipSystem = {
            装备类型: {
                "魔法少女手杖": {
                    基础属性: {
                        魔法攻击: 30,
                        魔力加成: 20
                    },
                    强化属性: {
                        魔法攻击: 5,
                        魔力加成: 3
                    },
                    特殊效果: {
                        5: "星光闪耀",
                        10: "月光祝福",
                        15: "梦幻共鸣"
                    },
                    最大等级: 20
                },
                "魔法少女服装": {
                    基础属性: {
                        魔法防御: 25,
                        魔力回复: 15
                    },
                    强化属性: {
                        魔法防御: 4,
                        魔力回复: 2
                    },
                    特殊效果: {
                        5: "可爱光环",
                        10: "梦幻守护",
                        15: "星光庇护"
                    },
                    最大等级: 20
                },
                "魔法饰品": {
                    基础属性: {
                        魔法暴击: 10,
                        魔力上限: 50
                    },
                    强化属性: {
                        魔法暴击: 2,
                        魔力上限: 10
                    },
                    特殊效果: {
                        5: "幸运之星",
                        10: "魔力之心",
                        15: "梦想之翼"
                    },
                    最大等级: 20
                }
            },
    
            强化材料: {
                "魔法结晶": {
                    基础成功率: 0.8,
                    属性加成: 1.0
                },
                "星光精华": {
                    基础成功率: 0.9,
                    属性加成: 1.2
                },
                "梦境碎片": {
                    基础成功率: 1.0,
                    属性加成: 1.5
                }
            },
    
            幸运加成: {
                "幸运星饰品": 0.1,
                "魔法少女护符": 0.15,
                "梦想之心": 0.2
            }
        };
    
        // 解析指令
        const [equipType, material] = e.msg.replace('#强化法术装备', '').trim().split(' ');
    
        // 检查装备是否存在
        if (!worldData.装备[equipType]) {
            let equipList = ["当前可强化的装备：\n"];
            for (const [type, info] of Object.entries(magicEquipSystem.装备类型)) {
                if (worldData.装备[type]) {
                    const level = worldData.装备等级[type] || 0;
                    equipList.push(
                        `✨ ${type}`,
                        `当前等级: ${level}/${info.最大等级}`,
                        `下一级属性提升:`,
                        ...Object.entries(info.强化属性).map(([attr, val]) => 
                            `- ${attr}+${val}`
                        ),
                        level % 5 === 4 ? `下一级可获得特效: ${info.特殊效果[level+1]}` : "",
                        ""
                    );
                }
            }
            e.reply(equipList.join('\n'));
            return;
        }
    
        // 检查材料
        if (!material || !magicEquipSystem.强化材料[material]) {
            let materialList = ["可用的强化材料：\n"];
            for (const [name, info] of Object.entries(magicEquipSystem.强化材料)) {
                const owned = worldData.背包.材料[name] || 0;
                materialList.push(
                    `💎 ${name}`,
                    `持有数量: ${owned}`,
                    `成功率: ${info.基础成功率 * 100}%`,
                    `属性加成: ${info.属性加成 * 100}%\n`
                );
            }
            e.reply(materialList.join('\n'));
            return;
        }
    
        // 检查材料数量
        if (!worldData.背包.材料[material] || worldData.背包.材料[material] < 1) {
            e.reply(`强化失败：缺少${material}`);
            return;
        }
    
        // 获取当前装备信息
        const equipInfo = magicEquipSystem.装备类型[equipType];
        const currentLevel = worldData.装备等级[equipType] || 0;
    
        // 检查是否达到最大等级
        if (currentLevel >= equipInfo.最大等级) {
            e.reply("该装备已达到最大等级！");
            return;
        }
    
        // 计算成功率
        let successRate = magicEquipSystem.强化材料[material].基础成功率;
        // 计算幸运加成
        for (const [item, bonus] of Object.entries(magicEquipSystem.幸运加成)) {
            if (worldData.装备[item]) {
                successRate += bonus;
            }
        }
        // 等级越高成功率越低
        successRate *= (1 - currentLevel * 0.02);
    
        // 扣除材料
        worldData.背包.材料[material]--;
    
        // 执行强化
        const success = Math.random() < successRate;
        if (success) {
            // 更新装备等级
            worldData.装备等级[equipType] = currentLevel + 1;
            
            // 计算属性提升
            const attrBonus = magicEquipSystem.强化材料[material].属性加成;
            const newAttributes = {};
            for (const [attr, value] of Object.entries(equipInfo.强化属性)) {
                newAttributes[attr] = Math.floor(value * attrBonus);
                worldData.属性[attr] = (worldData.属性[attr] || 0) + newAttributes[attr];
            }
    
            // 检查是否获得特殊效果
            let specialEffect = null;
            if (equipInfo.特殊效果[currentLevel + 1]) {
                specialEffect = equipInfo.特殊效果[currentLevel + 1];
                if (!worldData.特殊效果) worldData.特殊效果 = [];
                worldData.特殊效果.push(specialEffect);
            }
    
            // 保存数据
            await redis.set(`user:${userId}`, JSON.stringify(worldData));
            await saveUserData(userId, worldData);
    
            // 生成强化报告
            const strengthenReport = [
                `〓 装备强化成功 〓\n`,
                `✨ ${equipType} 强化到 ${currentLevel + 1}级！`,
                `\n属性提升:`,
                ...Object.entries(newAttributes).map(([attr, val]) => 
                    `- ${attr}+${val}`
                ),
                specialEffect ? `\n🌟 解锁特殊效果: ${specialEffect}` : "",
                `\n消耗材料:`,
                `- ${material} x1`,
                `\n当前属性:`,
                ...Object.entries(worldData.属性).map(([attr, val]) => 
                    `- ${attr}: ${val}`
                )
            ].join('\n');
    
            e.reply(strengthenReport);
        } else {
            // 强化失败
            e.reply([
                "强化失败...",
                `消耗材料: ${material} x1`,
                `剩余数量: ${worldData.背包.材料[material]}`,
                "\n💡 提示: 使用更好的材料可以提高成功率"
            ].join('\n'));
        }
    }
    async exploreRuins(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        const redisUserData = JSON.parse(await redis.get(`user:${userId}`));
        const worldData = JSON.parse(await redis.get(`user:${userId}`));
        const banUntil = await redis.get(`ban:${userId}`);
        if (banUntil && Date.now() < parseInt(banUntil)) {
            e.reply("你已被封禁,无法进行操作。");
            return;
        }
        if (!userData || !redisUserData || JSON.stringify(userData) !== JSON.stringify(redisUserData)) {
            await this.banPlayer(userId, e);
            return;
        }
        if (!worldData) {
            e.reply("请先开始异世界生活！");
            return;
        }
    
        // 遗迹探索系统
        const ruinsSystem = {
            // 遗迹类型
            locations: {
                "古代魔法图书馆": {
                    等级要求: 10,
                    体力消耗: 30,
                    探索难度: "简单",
                    可能遇到: ["魔法书灵", "知识守护者"],
                    基础掉落: {
                        "古代魔法书": { 概率: 0.6, 数量: [1, 2] },
                        "魔法墨水": { 概率: 0.7, 数量: [1, 3] }
                    },
                    稀有掉落: {
                        "失落的魔法卷轴": { 概率: 0.1, 数量: [1, 1] },
                        "知识结晶": { 概率: 0.15, 数量: [1, 1] }
                    },
                    特殊事件: {
                        "知识启示": "获得随机魔法知识",
                        "图书馆的馈赠": "获得稀有魔法书"
                    }
                },
                "星光神殿遗迹": {
                    等级要求: 20,
                    体力消耗: 40,
                    探索难度: "中等",
                    可能遇到: ["星光守护者", "神殿使者"],
                    基础掉落: {
                        "星光碎片": { 概率: 0.5, 数量: [1, 3] },
                        "神殿石砖": { 概率: 0.6, 数量: [2, 4] }
                    },
                    稀有掉落: {
                        "星光之心": { 概率: 0.08, 数量: [1, 1] },
                        "神殿核心": { 概率: 0.12, 数量: [1, 1] }
                    },
                    特殊事件: {
                        "星光祝福": "获得星光属性加成",
                        "神殿的考验": "通过考验获得特殊奖励"
                    }
                },
                "梦境花园遗迹": {
                    等级要求: 30,
                    体力消耗: 50,
                    探索难度: "困难",
                    可能遇到: ["梦境精灵", "花园守护者"],
                    基础掉落: {
                        "梦境花瓣": { 概率: 0.4, 数量: [2, 4] },
                        "魔法花种": { 概率: 0.5, 数量: [1, 3] }
                    },
                    稀有掉落: {
                        "永恒之花": { 概率: 0.05, 数量: [1, 1] },
                        "梦境结晶": { 概率: 0.1, 数量: [1, 1] }
                    },
                    特殊事件: {
                        "花园的记忆": "获得特殊技能",
                        "梦境启示": "获得独特魔法"
                    }
                }
            },
    
            // 探索道具
            tools: {
                "探索者指南针": {
                    效果: "提高稀有物品发现率",
                    加成: 0.1,
                    持续时间: 1800000 // 30分钟
                },
                "魔法探测器": {
                    效果: "提高魔法物品掉落率",
                    加成: 0.15,
                    持续时间: 3600000 // 1小时
                },
                "遗迹地图": {
                    效果: "降低体力消耗",
                    加成: 0.2,
                    持续时间: 7200000 // 2小时
                }
            },
    
            // 特殊发现系统
            discoveries: {
                "隐藏宝箱": {
                    触发概率: 0.1,
                    奖励: ["稀有道具", "大量金币", "特殊材料"]
                },
                "神秘传送门": {
                    触发概率: 0.05,
                    效果: "传送到特殊区域"
                },
                "远古壁画": {
                    触发概率: 0.15,
                    效果: "获得历史知识和经验"
                }
            }
        };
    
        // 解析探索指令
        const ruinName = e.msg.replace('#探索遗迹', '').trim() || "古代魔法图书馆";
        
        // 检查遗迹是否存在
        const ruinInfo = ruinsSystem.locations[ruinName];
        if (!ruinInfo) {
            let ruinGuide = ["〓 可探索的遗迹 〓\n"];
            for (const [name, info] of Object.entries(ruinsSystem.locations)) {
                ruinGuide.push(
                    `🏛️ ${name}`,
                    `  等级要求: ${info.等级要求}`,
                    `  探索难度: ${info.探索难度}`,
                    `  体力消耗: ${info.体力消耗}`,
                    `  可能遇到: ${info.可能遇到.join('、')}`,
                    `  基础掉落:`,
                    ...Object.keys(info.基础掉落).map(item => `    - ${item}`),
                    `  稀有掉落:`,
                    ...Object.keys(info.稀有掉落).map(item => `    - ${item}`),
                    ""
                );
            }
            ruinGuide.push(
                "💡 探索方式: #探索遗迹 遗迹名称",
                "例如: #探索遗迹 古代魔法图书馆"
            );
            e.reply(ruinGuide.join('\n'));
            return;
        }
    
        // 检查等级要求
        if (worldData.等级 < ruinInfo.等级要求) {
            e.reply(`等级不足,探索${ruinName}需要达到${ruinInfo.等级要求}级！`);
            return;
        }
    
        // 检查体力
        if (worldData.属性.体力值 < ruinInfo.体力消耗) {
            e.reply(`体力不足,探索${ruinName}需要${ruinInfo.体力消耗}点体力！`);
            return;
        }
    
        // 计算探索加成
        const calculateBonus = () => {
            let bonus = {
                发现率: 0,
                掉落倍率: 1,
                体力消耗减免: 0
            };
            
            // 装备加成
            for (const [tool, info] of Object.entries(ruinsSystem.tools)) {
                if (worldData.装备[tool]) {
                    bonus.发现率 += info.加成;
                    if (info.效果.includes("掉落")) {
                        bonus.掉落倍率 += info.加成;
                    }
                    if (info.效果.includes("体力")) {
                        bonus.体力消耗减免 += info.加成;
                    }
                }
            }
    
            return bonus;
        };
    
        const bonus = calculateBonus();
    
        // 执行探索
        const exploreResult = {
            获得物品: [],
            特殊发现: null,
            经验值: 0
        };
    
        // 基础掉落
        for (const [item, info] of Object.entries(ruinInfo.基础掉落)) {
            if (Math.random() < info.概率 * (1 + bonus.发现率)) {
                const amount = Math.floor(
                    (info.数量[0] + Math.random() * (info.数量[1] - info.数量[0])) * 
                    bonus.掉落倍率
                );
                exploreResult.获得物品.push({
                    名称: item,
                    数量: amount,
                    类型: "基础"
                });
                exploreResult.经验值 += amount * 10;
            }
        }
    
        // 稀有掉落
        for (const [item, info] of Object.entries(ruinInfo.稀有掉落)) {
            if (Math.random() < info.概率 * (1 + bonus.发现率)) {
                const amount = Math.floor(
                    (info.数量[0] + Math.random() * (info.数量[1] - info.数量[0])) * 
                    bonus.掉落倍率
                );
                exploreResult.获得物品.push({
                    名称: item,
                    数量: amount,
                    类型: "稀有"
                });
                exploreResult.经验值 += amount * 30;
            }
        }
    
        // 特殊发现
        for (const [discovery, info] of Object.entries(ruinsSystem.discoveries)) {
            if (Math.random() < info.触发概率 * (1 + bonus.发现率)) {
                exploreResult.特殊发现 = {
                    名称: discovery,
                    效果: info.效果
                };
                exploreResult.经验值 += 50;
                break;
            }
        }
    
        // 更新玩家数据
        worldData.属性.体力值 -= Math.floor(ruinInfo.体力消耗 * (1 - bonus.体力消耗减免));
        worldData.经验值 += exploreResult.经验值;
    
        // 添加物品到背包
        for (const item of exploreResult.获得物品) {
            if (!worldData.背包.材料[item.名称]) {
                worldData.背包.材料[item.名称] = 0;
            }
            worldData.背包.材料[item.名称] += item.数量;
        }
    
        // 检查升级
        if (worldData.经验值 >= worldData.升级所需经验) {
            worldData.等级 += 1;
            worldData.经验值 -= worldData.升级所需经验;
            worldData.升级所需经验 = Math.floor(worldData.升级所需经验 * 1.2);
        }
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(worldData));
        await saveUserData(userId, worldData);
    
        // 生成探索报告
        const exploreReport = [
            `〓 遗迹探索报告 〓\n`,
            `探索地点: ${ruinName}`,
            `\n获得物品:`,
            exploreResult.获得物品.length > 0 ?
                exploreResult.获得物品.map(item => 
                    `${item.类型 === "稀有" ? "✨" : "🔮"} ${item.名称} x${item.数量}`
                ).join('\n') :
                "这次什么都没有发现...",
            exploreResult.特殊发现 ? [
                `\n✨ 特殊发现:`,
                `发现${exploreResult.特殊发现.名称}`,
                `效果: ${exploreResult.特殊发现.效果}`
            ].join('\n') : "",
            `\n探索成果:`,
            `📈 获得经验: ${exploreResult.经验值}`,
            `💪 消耗体力: ${Math.floor(ruinInfo.体力消耗 * (1 - bonus.体力消耗减免))}`,
            `\n当前状态:`,
            `⭐ 等级: ${worldData.等级}`,
            `📊 经验值: ${worldData.经验值}/${worldData.升级所需经验}`,
            `💪 体力值: ${worldData.属性.体力值}`,
            `\n💡 提示: 使用探索道具可以提高探索收益哦！`
        ].join('\n');
    
        e.reply(exploreReport);
    }
    async banPlayer(userId, e) {
        const userData = await checkUserData(userId);
        if (!userData) return false;
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
 // 辅助函数
 function determineCurrentMood(worldData) {
    // 根据角色状态确定心情
    if (worldData.属性.体力值 > 80 && worldData.属性.魔力值 > 80) return "开心";
    if (worldData.属性.体力值 < 30 || worldData.属性.魔力值 < 30) return "疲惫";
    return "普通";
}
function generatePracticeReport(practiceResult, growthResult, locationInfo, methodInfo, moodInfo) {
    const report = [
        `〓 魔法少女修炼报告 〓\n`,
        `🌟 ${practiceResult.场景描述}\n`,
        `修炼成果:`,
        `✨ 获得经验: ${practiceResult.经验}`,
        `📚 魔法熟练度: +${practiceResult.熟练度}`,
        `心情: ${moodInfo.描述}`
    ];

    if (practiceResult.触发事件.length > 0) {
        report.push('\n✨ 触发特殊事件:');
        practiceResult.触发事件.forEach(event => {
            report.push(`- ${event.名称}: ${event.描述}`);
        });
    }

    if (practiceResult.获得物品.length > 0) {
        report.push('\n🎁 获得物品:');
        practiceResult.获得物品.forEach(item => {
            report.push(`- ${item}`);
        });
    }

    if (growthResult.新解锁.length > 0) {
        report.push('\n🌟 解锁新能力:');
        growthResult.新解锁.forEach(ability => {
            report.push(`- ${ability.能力}: ${ability.描述}`);
        });
    }

    report.push(
        '\n💡 魔法成长进度:',
        ...Object.entries(growthResult.当前进度).map(([ability, progress]) => 
            `- ${ability}: ${progress}`
        ),
        '\n💕 继续加油修炼吧~'
    );

    return report.join('\n');
}
async function executePractice(worldData, locationInfo, methodInfo, moodInfo) {
    const result = {
        经验: 0,
        熟练度: 0,
        获得物品: [],
        触发事件: [],
        场景描述: ""
    };

    // 基础经验计算
    result.经验 = Math.floor(locationInfo.基础经验 * methodInfo.效率 * (1 + moodInfo.效率加成));
    result.熟练度 = Math.floor(10 * methodInfo.效率 * (1 + moodInfo.效率加成));

    // 随机场景描述
    result.场景描述 = locationInfo.场景描述[Math.floor(Math.random() * locationInfo.场景描述.length)];

    // 随机事件检查
    for (const [eventName, eventInfo] of Object.entries(locationInfo.随机事件)) {
        if (Math.random() < eventInfo.概率 * (1 + moodInfo.幸运提升)) {
            result.触发事件.push({
                名称: eventName,
                描述: eventInfo.描述,
                效果: eventInfo.效果
            });
        }
    }

    // 奖励道具检查
    for (const [item, chance] of Object.entries(locationInfo.奖励道具)) {
        if (Math.random() < chance * (1 + moodInfo.幸运提升)) {
            result.获得物品.push(item);
        }
    }

    return result;
}

function checkGrowth(worldData, growthSystem) {
    const result = {
        新解锁: [],
        当前进度: {}
    };

    for (const [ability, info] of Object.entries(growthSystem)) {
        if (!worldData.解锁能力?.includes(ability) && worldData.魔法熟练度 >= info.经验要求) {
            result.新解锁.push({
                能力: ability,
                效果: info.效果,
                描述: info.描述
            });
            if (!worldData.解锁能力) worldData.解锁能力 = [];
            worldData.解锁能力.push(ability);
        }
        result.当前进度[ability] = `${worldData.魔法熟练度}/${info.经验要求}`;
    }

    return result;
}

function getEquipmentStats(item) {
    // 获取装备的属性信息
    if (!item) return null;
    
    try {
        // 假设装备数据格式如下
        return {
            名称: item.名称,
            类型: item.类型,
            品质: item.品质,
            属性加成: {
                物理攻击: item.物理攻击 || 0,
                魔法攻击: item.魔法攻击 || 0,
                物理防御: item.物理防御 || 0,
                魔法防御: item.魔法防御 || 0,
                幸运值: item.幸运值 || 0,
                魅力值: item.魅力值 || 0,
                敏捷值: item.敏捷值 || 0
            },
            描述: item.描述
        };
    } catch (error) {
        console.error("获取装备属性时出错：", error);
        return null;
    }
}
 // 检查元素组合
 function checkElementCombinations(elements) {
    const elementCombos = {
        "火+水": {
            名称: "蒸汽之力",
            描述: "同时掌握火与水的力量,领悟蒸汽之力",
            效果: {
                魔法伤害: 20,
                范围攻击: 15
            }
        },
        "水+冰": {
            名称: "极寒之力",
            描述: "水与冰的结合带来极致寒冷",
            效果: {
                冰属性伤害: 30,
                减速效果: 20
            }
        }
        // ... 更多元素组合
    };

    let newCombos = [];
    for (const [combo, info] of Object.entries(elementCombos)) {
        const requiredElements = combo.split('+');
        if (requiredElements.every(elem => elements.includes(elem))) {
            newCombos.push(info);
        }
    }
    return newCombos;
}

// 应用元素组合效果
function applyElementCombination(worldData, combo) {
    for (const [attr, value] of Object.entries(combo.效果)) {
        worldData.属性[attr] = (worldData.属性[attr] || 0) + value;
    }
    if (!worldData.元素组合) worldData.元素组合 = [];
    worldData.元素组合.push(combo.名称);
}

    // 计算材料加成
    function calculateMaterialBonus(worldData, materials) {
        let bonus = 0;
        for (const [material, info] of Object.entries(materials)) {
            if (worldData.背包.材料[material]) {
                bonus += info.加成;
            }
        }
        return bonus;
    }
    
    // 计算材料费用
    function calculateMaterialCost(worldData, materials) {
        let cost = 0;
        for (const [material, info] of Object.entries(materials)) {
            if (worldData.背包.材料[material]) {
                cost += info.价格;
            }
        }
        return cost;
    }
    
    // 应用特殊修复效果
    function applySpecialRepairEffect(worldData, equipmentSlot, effect) {
        switch (effect) {
            case "品质提升":
                upgradeEquipmentQuality(worldData, equipmentSlot);
                break;
            case "属性强化":
                enhanceEquipmentAttribute(worldData, equipmentSlot);
                break;
            case "特效附魔":
                addEquipmentEnchantment(worldData, equipmentSlot);
                break;
        }
    }
    
    // 提升装备品质
    function upgradeEquipmentQuality(worldData, equipmentSlot) {
        const qualityLevels = ["普通", "精良", "稀有", "史诗", "传说"];
        const equipment = worldData.装备[equipmentSlot];
        const currentQuality = worldData.装备品质?.[equipmentSlot] || "普通";
        const currentIndex = qualityLevels.indexOf(currentQuality);
        
        if (currentIndex < qualityLevels.length - 1) {
            worldData.装备品质[equipmentSlot] = qualityLevels[currentIndex + 1];
        }
    }
    
    // 强化装备属性
    function enhanceEquipmentAttribute(worldData, equipmentSlot) {
        const attributes = ["攻击", "防御", "魔法", "敏捷"];
        const randomAttr = attributes[Math.floor(Math.random() * attributes.length)];
        
        if (!worldData.装备强化) worldData.装备强化 = {};
        if (!worldData.装备强化[equipmentSlot]) worldData.装备强化[equipmentSlot] = {};
        
        worldData.装备强化[equipmentSlot][randomAttr] = 
            (worldData.装备强化[equipmentSlot][randomAttr] || 0) + 0.05;
    }
    
    // 添加装备附魔
    function addEquipmentEnchantment(worldData, equipmentSlot) {
        const enchantments = [
            "星光祝福",
            "月华加持",
            "自然之力",
            "魔力涌动"
        ];
        
        const randomEnchant = enchantments[Math.floor(Math.random() * enchantments.length)];
        
        if (!worldData.装备附魔) worldData.装备附魔 = {};
        worldData.装备附魔[equipmentSlot] = randomEnchant;
    }

 // 检查商店是否营业
 function checkShopOpen(timeRange) {
    const [start, end] = timeRange.split('-');
    const now = new Date();
    const currentHour = now.getHours();
    const [startHour] = start.split(':').map(Number);
    const [endHour] = end.split(':').map(Number);
    
    return currentHour >= startHour && currentHour < endHour;
}

// 检查是否特惠时段
function checkSpecialTime(timeRange) {
    const [start, end] = timeRange.split('-');
    const now = new Date();
    const currentHour = now.getHours();
    const [startHour] = start.split(':').map(Number);
    const [endHour] = end.split(':').map(Number);
    
    return currentHour >= startHour && currentHour < endHour;
}

// 获取会员等级
function getMemberLevel(totalSpent) {
    if (totalSpent >= 20000) return "钻石会员";
    if (totalSpent >= 5000) return "黄金会员";
    if (totalSpent >= 1000) return "白银会员";
    return "普通会员";
}

// 处理购买
async function handlePurchase(e, worldData, shop, itemName, memberInfo) {
    // 查找商品信息
    let item = null;
    let category = null;
    for (const cat of shop.categories) {
        const items = shopSystem.categories[cat];
        if (items && items[itemName]) {
            item = items[itemName];
            category = cat;
            break;
        }
    }

    if (!item) {
        e.reply("找不到该商品,请检查名称是否正确！");
        return;
    }

    // 检查限购
    const owned = worldData.背包.道具[itemName] || 0;
    if (owned >= item.limit) {
        e.reply(`该商品限购${item.limit}个,你已达到购买上限！`);
        return;
    }

    // 计算实际价格
    let price = item.price;
    // 特惠时段折扣
    if (checkSpecialTime(shop.specialTime.time)) {
        price *= shop.specialTime.discount;
    }
    // 会员折扣
    price *= (1 - memberInfo.discount);
    price = Math.floor(price);

    // 检查金币是否足够
    if (worldData.背包.金币 < price) {
        e.reply(`金币不足,购买${itemName}需要${price}金币！`);
        return;
    }

    // 扣除金币
    worldData.背包.金币 -= price;
    // 添加商品
    if (!worldData.背包.道具[itemName]) {
        worldData.背包.道具[itemName] = 0;
    }
    worldData.背包.道具[itemName]++;
    // 更新消费总额
    worldData.消费总额 = (worldData.消费总额 || 0) + price;
    // 获得会员积分
    worldData.会员积分 = (worldData.会员积分 || 0) + Math.floor(price * memberInfo.points);

    // 保存数据
    await redis.set(`world:user:${e.user_id}`, JSON.stringify(worldData));
    await saveUserData(e.user_id, worldData);

    // 生成购买报告
    const purchaseReport = [
        `〓 购买成功 〓\n`,
        `商品: ${itemName}`,
        `分类: ${category}`,
        `原价: ${item.price}金币`,
        price !== item.price ? `折后价: ${price}金币` : "",
        `\n获得会员积分: ${Math.floor(price * memberInfo.points)}`,
        `当前积分: ${worldData.会员积分}`,
        `\n剩余金币: ${worldData.背包.金币}`,
        `当前持有: ${worldData.背包.道具[itemName]}/${item.limit}个`,
        `\n💡 提示: 特惠时段购物更划算哦！`
    ].join('\n');

    e.reply(purchaseReport);
}

// 处理出售
async function handleSell(e, worldData, shop, itemName, memberInfo) {
    // 查找商品信息
    let item = null;
    let category = null;
    for (const cat of shop.categories) {
        const items = shopSystem.categories[cat];
        if (items && items[itemName]) {
            item = items[itemName];
            category = cat;
            break;
        }
    }

    if (!item) {
        e.reply("找不到该商品,请检查名称是否正确！");
        return;
    }

    // 检查是否拥有商品
    if (!worldData.背包.道具[itemName] || worldData.背包.道具[itemName] <= 0) {
        e.reply(`你没有${itemName}可以出售！`);
        return;
    }

    // 计算出售价格(一般为原价的一半)
    let price = Math.floor(item.price * 0.5);
    // 会员额外加成
    price = Math.floor(price * (1 + memberInfo.discount));

    // 扣除商品
    worldData.背包.道具[itemName]--;
    if (worldData.背包.道具[itemName] <= 0) {
        delete worldData.背包.道具[itemName];
    }
    // 添加金币
    worldData.背包.金币 += price;

    // 保存数据
    await redis.set(`world:user:${e.user_id}`, JSON.stringify(worldData));
    await saveUserData(e.user_id, worldData);

    // 生成出售报告
    const sellReport = [
        `〓 出售成功 〓\n`,
        `商品: ${itemName}`,
        `分类: ${category}`,
        `基础回收价: ${Math.floor(item.price * 0.5)}金币`,
        `会员加成: ${Math.floor(price - item.price * 0.5)}金币`,
        `最终价格: ${price}金币`,
        `\n当前持有: ${worldData.背包.道具[itemName] || 0}个`,
        `当前金币: ${worldData.背包.金币}`,
        `\n💡 提示: 会员等级越高,出售价格越好哦！`
    ].join('\n');

    e.reply(sellReport);
}

  // 检查属性解锁条件
  function checkAttributeUnlock(worldData, condition) {
    if (condition.includes("完成主线任务")) {
        const questName = condition.match(/\[(.*?)\]/)[1];
        return worldData.任务进度?.[questName]?.完成 || false;
    }
    if (condition.includes("学会")) {
        const [count, type] = condition.match(/学会(\d+)个(.*)系魔法/);
        return worldData.魔法?.filter(magic => 
            magic.type === type
        ).length >= parseInt(count);
    }
    return false;
}

// 生成特殊效果
function generateSpecialEffect(attrName, increase) {
    const effects = {
        "魅力": [
            {
                名称: "魅力光环",
                描述: "短时间内与NPC互动好感度获得加倍",
                效果: {
                    类型: "好感度加成",
                    倍率: 2,
                    持续时间: 1800000 // 30分钟
                }
            },
            {
                名称: "魅力绽放",
                描述: "一定时间内商店购物享受折扣",
                效果: {
                    类型: "商店折扣",
                    折扣: 0.8,
                    持续时间: 3600000 // 1小时
                }
            }
        ],
        "智慧": [
            {
                名称: "智慧启迪",
                描述: "短时间内学习魔法消耗减少",
                效果: {
                    类型: "学习消耗减免",
                    减免: 0.3,
                    持续时间: 1800000
                }
            },
            {
                名称: "智慧之光",
                描述: "一定时间内魔法伤害提升",
                效果: {
                    类型: "魔法伤害加成",
                    加成: 0.2,
                    持续时间: 3600000
                }
            }
        ],
        "体力": [
            {
                名称: "体力充沛",
                描述: "短时间内体力消耗减少",
                效果: {
                    类型: "体力消耗减免",
                    减免: 0.3,
                    持续时间: 1800000
                }
            },
            {
                名称: "活力焕发",
                描述: "一定时间内体力恢复速度提升",
                效果: {
                    类型: "体力恢复加成",
                    加成: 0.5,
                    持续时间: 3600000
                }
            }
        ]
    };

    const attrEffects = effects[attrName];
    if (!attrEffects) return null;

    return attrEffects[Math.floor(Math.random() * attrEffects.length)];
}

// 应用特殊效果
function applySpecialEffect(worldData, effect) {
    if (!worldData.状态.增益效果) {
        worldData.状态.增益效果 = [];
    }
    worldData.状态.增益效果.push({
        名称: effect.名称,
        描述: effect.描述,
        效果: effect.效果,
        结束时间: Date.now() + effect.效果.持续时间
    });
}

 // 生成敌人
 function generateEnemy(groundInfo, modeInfo) {
    const enemyType = groundInfo.敌人类型[
        Math.floor(Math.random() * groundInfo.敌人类型.length)
    ];
    
    return {
        名称: enemyType,
        等级: groundInfo.等级要求,
        生命值: 100 * modeInfo.难度倍率,
        攻击力: 20 * modeInfo.难度倍率,
        防御力: 10 * modeInfo.难度倍率,
        经验值: 50 * groundInfo.经验倍率,
        金币: 100 * groundInfo.经验倍率
    };
}

// 执行战斗
async function executeBattle(playerData, enemy, battleSystem) {
    let battleLog = [];
    let playerHP = playerData.属性.生命值;
    let enemyHP = enemy.生命值;
    let round = 1;

    // 获取玩家装备加成
    const equipBonus = calculateEquipmentBonus(playerData, battleSystem);

    // 战斗循环
    while (playerHP > 0 && enemyHP > 0 && round <= 10) {
        battleLog.push(`\n第${round}回合:`);

        // 玩家回合
        const playerSkill = selectBattleSkill(playerData, battleSystem);
        if (playerSkill) {
            const damage = calculateDamage(
                playerData.属性.魔法攻击 * equipBonus.攻击加成,
                enemy.防御力,
                playerSkill.伤害倍率
            );
            enemyHP -= damage;
            battleLog.push(
                `🌟 使用${playerSkill.name}`,
                `造成${damage}点伤害`
            );
        }

        // 敌人回合
        if (enemyHP > 0) {
            const enemyDamage = calculateDamage(
                enemy.攻击力,
                playerData.属性.防御力 * equipBonus.防御加成,
                1
            );
            playerHP -= enemyDamage;
            battleLog.push(`⚔️ 受到${enemyDamage}点伤害`);
        }

        round++;
    }

    return {
        胜利: playerHP > 0,
        战斗记录: battleLog
    };
}

// 计算装备加成
function calculateEquipmentBonus(playerData, battleSystem) {
    let bonus = {
        攻击加成: 1.0,
        防御加成: 1.0,
        魔力消耗减免: 0,
        技能冷却减少: 0
    };

    for (const [slot, item] of Object.entries(playerData.装备)) {
        const effect = battleSystem.equipmentEffects[item];
        if (effect) {
            bonus.攻击加成 *= (effect.攻击加成 || 1);
            bonus.防御加成 *= (effect.防御加成 || 1);
            bonus.魔力消耗减免 += (effect.魔力消耗减免 || 0);
            bonus.技能冷却减少 += (effect.技能冷却减少 || 0);
        }
    }

    return bonus;
}

// 选择战斗技能
function selectBattleSkill(playerData, battleSystem) {
    // 获取可用技能
    const availableSkills = Object.entries(battleSystem.battleSkills)
        .filter(([name, skill]) => 
            playerData.魔法?.includes(name) && 
            playerData.属性.魔力值 >= skill.魔力消耗
        );

    if (availableSkills.length === 0) return null;

    // 根据情况选择技能
    if (playerData.属性.生命值 < 30) {
        // 生命值低时优先使用治疗技能
        const healSkill = availableSkills.find(([_, skill]) => 
            skill.类型 === "治疗"
        );
        if (healSkill) return healSkill;
    }

    // 随机选择攻击技能
    const attackSkills = availableSkills.filter(([_, skill]) =>
        skill.类型 === "魔法攻击"
    );
    
    if (attackSkills.length > 0) {
        const [name, skill] = attackSkills[
            Math.floor(Math.random() * attackSkills.length)
        ];
        return {
            name,
            ...skill
        };
    }

    return null;
}

// 计算伤害
function calculateDamage(attack, defense, multiplier) {
    const baseDamage = Math.max(0, attack - defense);
    const variation = 0.1; // 10%的伤害浮动
    const randomFactor = 1 + (Math.random() * 2 - 1) * variation;
    return Math.floor(baseDamage * multiplier * randomFactor);
}

 // 执行互动
 async function executeInteraction(worldData, targetNPC, method, topic, system, location) {
    const npcData = worldData.npcRelations[targetNPC];
    const methodInfo = system.methods[method];
    const locationInfo = system.locations[location];

    // 计算成功率
    let successRate = methodInfo.successRate;
    // 好感度影响
    successRate += npcData.affection * 0.001;
    // 话题影响
    if (topic && locationInfo.topics.includes(topic)) {
        successRate += 0.1;
    }
    // 特殊事件影响
    const currentHour = new Date().getHours();
    for (const [event, info] of Object.entries(locationInfo.specialEvents)) {
        const [startHour, endHour] = info.time.split('-').map(t => parseInt(t.split(':')[0]));
        if (currentHour >= startHour && currentHour < endHour) {
            successRate += 0.2;
            break;
        }
    }

    // 判定互动结果
    const success = Math.random() < successRate;
    if (!success) {
        return {
            success: false,
            emotion: "难过",
            affectionChange: -1,
            rewards: []
        };
    }

    // 计算好感度变化
    let affectionGain = methodInfo.baseAffection;
    // 特殊事件加成
    for (const [event, info] of Object.entries(locationInfo.specialEvents)) {
        const [startHour, endHour] = info.time.split('-').map(t => parseInt(t.split(':')[0]));
        if (currentHour >= startHour && currentHour < endHour) {
            affectionGain *= info.affectionGain;
            break;
        }
    }
    // 心情加成
    if (npcData.lastEmotion) {
        const emotionInfo = system.emotions[npcData.lastEmotion];
        affectionGain *= emotionInfo.affectionBonus;
    }

    // 生成奖励
    let rewards = [];
    if (Math.random() < 0.3) { // 30%概率获得奖励
        rewards = generateInteractionRewards(worldData, targetNPC, method, npcData.affection);
    }

    // 更新NPC心情
    const newEmotion = Math.random() < 0.8 ? "开心" : "难过";
    npcData.lastEmotion = newEmotion;
    npcData.affection += affectionGain;

    return {
        success: true,
        emotion: newEmotion,
        affectionChange: affectionGain,
        rewards
    };
}

// 生成互动奖励
function generateInteractionRewards(worldData, targetNPC, method, affection) {
    let rewards = [];
    const baseChance = 0.1 + (affection * 0.001); // 基础概率10% + 好感度加成

    // 根据互动方式生成不同奖励
    switch (method) {
        case "闲聊":
            if (Math.random() < baseChance) {
                rewards.push({
                    type: "情报",
                    item: ["任务线索", "秘密配方", "隐藏地点"][Math.floor(Math.random() * 3)]
                });
            }
            break;
        case "送礼":
            if (Math.random() < baseChance * 1.5) {
                rewards.push({
                    type: "礼物",
                    item: ["精美饰品", "特制甜点", "魔法书"][Math.floor(Math.random() * 3)]
                });
            }
            break;
        case "邀请":
            if (Math.random() < baseChance * 2) {
                rewards.push({
                    type: "特殊道具",
                    item: ["神秘钥匙", "魔法卷轴", "稀有配方"][Math.floor(Math.random() * 3)]
                });
            }
            break;
    }

    return rewards;
}

// 生成互动报告
function generateInteractionReport(worldData, targetNPC, method, result, methodInfo) {
    const npcData = worldData.npcRelations[targetNPC];
    
    let report = [
        `〓 互动报告 〓\n`,
        `互动对象: ${targetNPC}`,
        `互动方式: ${method}`,
        `\n互动结果: ${result.success ? "成功" : "失败"}`,
        result.success ? [
            `💗 好感度变化: +${result.affectionChange}`,
            `💭 对方心情: ${result.emotion}`,
            `当前好感度: ${npcData.affection}`,
            `累计互动: ${npcData.interactions}次`
        ].join('\n') : "互动失败,对方似乎不太高兴...",
        `\n消耗:`,
        methodInfo.cost.stamina ? `💪 体力: ${methodInfo.cost.stamina}` : "",
        methodInfo.cost.gold ? `💰 金币: ${methodInfo.cost.gold}` : ""
    ];

    if (result.rewards.length > 0) {
        report.push(
            `\n🎁 获得奖励:`,
            ...result.rewards.map(reward => `- ${reward.type}: ${reward.item}`)
        );
    }

    report.push(
        `\n当前状态:`,
        `💪 体力值: ${worldData.属性.体力值}`,
        `💰 金币: ${worldData.背包.金币}`,
        `\n💡 提示: 在特定时间互动可以获得额外加成哦！`
    );

    return report.join('\n');
}

 // 检查仪式解锁条件
 function checkRitualUnlock(worldData, condition) {
    switch (condition) {
        case "完成星光仪式入门任务":
            return worldData.任务进度?.["星光仪式入门"]?.完成 || false;
        case "获得月光祭司认可":
            return (worldData.好感度?.["月光祭司"] || 0) >= 100;
        case "觉醒梦境之力":
            return worldData.特殊能力?.includes("梦境之力") || false;
        default:
            return false;
    }
}
async function handlePlayerDate(e, playerData, dateSystem) {
    const targetId = e.at;
    const targetData = JSON.parse(await redis.get(`world:user:${targetId}`));
    
    if (!targetData) {
        e.reply("对方还未开始异世界生活,无法进行约会！");
        return;
    }

    // 获取约会地点
    const location = e.msg.replace('#约会', '').trim().split(' ')[1];
    
    if (!location) {
        // 显示约会指南
        let guide = generateDateGuide(dateSystem, true);
        e.reply(guide);
        return;
    }

    // 执行约会逻辑
    const result = await executePlayerDate(e, playerData, targetData, location, dateSystem);
    e.reply(result);
}
// NPC约会处理函数
async function handleNPCDate(e, playerData, targetName, location, dateSystem) {
    if (!targetName) {
        // 显示约会指南
        let guide = generateDateGuide(dateSystem, false);
        e.reply(guide);
        return;
    }

    // 检查NPC是否存在
    if (!dateSystem.npcs[targetName]) {
        e.reply("找不到该约会对象,请检查名字是否正确！");
        return;
    }

    // 执行约会逻辑
    const result = await executeNPCDate(e, playerData, targetName, location, dateSystem);
    e.reply(result);
}

// 生成约会指南
function generateDateGuide(dateSystem, isPlayerDate) {
    let guide = ["〓 约会指南 〓\n"];
    
    if (isPlayerDate) {
        guide.push("与玩家约会说明:");
        guide.push("1. 双方都需要有异世界存档");
        guide.push("2. 双方都需要支付约会费用");
        guide.push("3. 约会会增加双方好感度");
    } else {
        guide.push("可约会NPC:");
        for (const [name, info] of Object.entries(dateSystem.npcs)) {
            guide.push(`🎀 ${name} - ${info.身份}`);
            guide.push(`  性格: ${info.性格}`);
            guide.push(`  喜好: ${info.喜好.join('、')}\n`);
        }
    }

    guide.push("\n约会地点:");
    for (const [name, info] of Object.entries(dateSystem.locations)) {
        guide.push(
            `🏠 ${name}`,
            `  类型: ${info.类型}`,
            `  氛围: ${info.氛围}`,
            `  消费: ${info.消费}金币`,
            `  等级要求: ${info.解锁条件.等级}\n`
        );
    }

    guide.push(
        "\n💡 使用方法:",
        isPlayerDate ? 
            "#约会 @玩家 地点" :
            "#约会 NPC名称 地点",
        "例如: #约会 莉莉 星光咖啡厅"
    );

    return guide.join('\n');
}

// 执行玩家约会
async function executePlayerDate(e, playerData, targetData, location, dateSystem) {
    const locationInfo = dateSystem.locations[location];
    if (!locationInfo) {
        return "无效的约会地点！";
    }

    // 检查等级要求
    if (playerData.等级 < locationInfo.解锁条件.等级 || 
        targetData.等级 < locationInfo.解锁条件.等级) {
        return `约会地点等级不足,需要等级${locationInfo.解锁条件.等级}！`;
    }

    // 检查费用
    if (playerData.背包.金币 < locationInfo.消费 || 
        targetData.背包.金币 < locationInfo.消费) {
        return `约会费用不足,每人需要${locationInfo.消费}金币！`;
    }

    // 生成约会剧情
    const dateEvent = generateDateEvent(dateSystem, locationInfo);
    
    // 计算好感度增加
    const affectionGain = calculateAffectionGain(dateEvent, locationInfo);

    // 更新数据
    await updatePlayerDateData(e, playerData, targetData, locationInfo, affectionGain);

    // 生成约会报告
    return generateDateReport(playerData, targetData, location, dateEvent, locationInfo, affectionGain);
}

// 执行NPC约会
async function executeNPCDate(e, playerData, targetName, location, dateSystem) {
    const locationInfo = dateSystem.locations[location];
    const npcInfo = dateSystem.npcs[targetName];

    if (!locationInfo) {
        return "无效的约会地点！";
    }

    // 检查等级要求
    if (playerData.等级 < locationInfo.解锁条件.等级) {
        return `约会地点等级不足,需要等级${locationInfo.解锁条件.等级}！`;
    }

    // 检查费用
    if (playerData.背包.金币 < locationInfo.消费) {
        return `约会费用不足,需要${locationInfo.消费}金币！`;
    }

    // 生成约会剧情
    const dateEvent = generateDateEvent(dateSystem, locationInfo);
    
    // 计算好感度增加
    const affectionGain = calculateAffectionGain(dateEvent, locationInfo);

    // 更新数据
    await updateNPCDateData(e, playerData, targetName, locationInfo, affectionGain);

    // 生成约会报告
    return generateNPCDateReport(playerData, targetName, npcInfo, location, dateEvent, locationInfo, affectionGain);
}

// 生成约会事件
function generateDateEvent(dateSystem, locationInfo) {
    const random = Math.random();
    let eventPool;
    
    if (random < locationInfo.特殊事件概率) {
        eventPool = dateSystem.scenarios.浪漫剧情;
    } else if (random < 0.6) {
        eventPool = dateSystem.scenarios.特殊剧情;
    } else {
        eventPool = dateSystem.scenarios.普通剧情;
    }

    return eventPool[Math.floor(Math.random() * eventPool.length)];
}

// 计算好感度增加
function calculateAffectionGain(dateEvent, locationInfo) {
    let base = dateEvent.好感度;
    let bonus = locationInfo.好感度加成;
    
    // 获取当前时段
    const currentPeriod = getCurrentPeriod();
    if (locationInfo.推荐时段.includes(currentPeriod)) {
        bonus *= 1.5;
    }

    return Math.floor(base * bonus);
}

// 获取当前时段
function getCurrentPeriod() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "上午";
    if (hour >= 11 && hour < 17) return "下午";
    if (hour >= 17 && hour < 19) return "傍晚";
    if (hour >= 19 && hour < 23) return "晚上";
    return "深夜";
}

// 更新玩家约会数据
async function updatePlayerDateData(e, playerData, targetData, locationInfo, affectionGain) {
    // 扣除约会费用
    playerData.背包.金币 -= locationInfo.消费;
    targetData.背包.金币 -= locationInfo.消费;

    // 更新好感度
    if (!playerData.玩家好感度) playerData.玩家好感度 = {};
    if (!targetData.玩家好感度) targetData.玩家好感度 = {};
    
    playerData.玩家好感度[e.at] = (playerData.玩家好感度[e.at] || 0) + affectionGain;
    targetData.玩家好感度[e.user_id] = (targetData.玩家好感度[e.user_id] || 0) + affectionGain;

    // 保存数据
    await redis.set(`world:user:${e.user_id}`, JSON.stringify(playerData));
    await redis.set(`world:user:${e.at}`, JSON.stringify(targetData));
    await saveUserData(e.user_id, playerData);
    await saveUserData(e.at, targetData);
}

// 更新NPC约会数据
async function updateNPCDateData(e, playerData, targetName, locationInfo, affectionGain) {
    // 扣除约会费用
    playerData.背包.金币 -= locationInfo.消费;

    // 更新好感度
    if (!playerData.好感度) playerData.好感度 = {};
    playerData.好感度[targetName] = (playerData.好感度[targetName] || 0) + affectionGain;

    // 保存数据
    await redis.set(`world:user:${e.user_id}`, JSON.stringify(playerData));
    await saveUserData(e.user_id, playerData);
}

// 生成约会报告
function generateDateReport(playerData, targetData, location, dateEvent, locationInfo, affectionGain) {
    return [
        `〓 玩家约会报告 〓\n`,
        `约会对象: ${targetData.名字 || "魔法少女"}`,
        `地点: ${location}`,
        `\n发生的事件:`,
        dateEvent.描述,
        dateEvent.额外效果 ? `特殊效果: ${dateEvent.额外效果}` : "",
        `\n约会成果:`,
        `💗 双方好感度+${affectionGain}`,
        `💰 各消费${locationInfo.消费}金币`,
        `\n当前状态:`,
        `💝 对对方好感度: ${playerData.玩家好感度[targetData.user_id]}`,
        `💰 剩余金币: ${playerData.背包.金币}`,
        `\n💡 提示: 好感度越高,将解锁更多互动内容！`
    ].join('\n');
}

// 生成NPC约会报告
function generateNPCDateReport(playerData, targetName, npcInfo, location, dateEvent, locationInfo, affectionGain) {
    return [
        `〓 NPC约会报告 〓\n`,
        `约会对象: ${targetName}`,
        `身份: ${npcInfo.身份}`,
        `地点: ${location}`,
        `\n特殊对话:`,
        npcInfo.约会对话[Math.floor(Math.random() * npcInfo.约会特殊对话.length)],
        `\n发生的事件:`,
        dateEvent.描述,
        dateEvent.额外效果 ? `特殊效果: ${dateEvent.额外效果}` : "",
        `\n约会成果:`,
        `💗 好感度+${affectionGain}`,
        `💰 消费${locationInfo.消费}金币`,
        `\n当前状态:`,
        `💝 好感度: ${playerData.好感度[targetName]}`,
        `💰 剩余金币: ${playerData.背包.金币}`,
        `\n💡 提示: 多送${targetName}喜欢的礼物可以快速提升好感度哦！`
    ].join('\n');
}
// 获取成功率
function getSuccessRate(level) {
    let rate = 1.0;
    for (const [reqLevel, successRate] of Object.entries(magicUpgradeSystem.successRates)) {
        if (level >= parseInt(reqLevel)) {
            rate = successRate;
        }
    }
    return rate;
}
 // 获取等级效果
 function getLevelEffect(level) {
    let effect = {倍率: 1.0, 特效: "微弱光芒"};
    for (const [reqLevel, levelEffect] of Object.entries(strengthenSystem.levelEffects)) {
        if (level >= parseInt(reqLevel)) {
            effect = levelEffect;
        }
    }
    return effect;
}

// 确定强化品质
function determineQuality() {
    const random = Math.random();
    let accumulatedProb = 0;
    
    for (const [quality, info] of Object.entries(strengthenSystem.quality)) {
        accumulatedProb += info.概率;
        if (random <= accumulatedProb) {
            return {
                名称: quality,
                ...info
            };
        }
    }
    
    return strengthenSystem.quality.普通;
}
// 执行舞蹈表演的函数
async function executeDancePerformance(worldData, danceInfo, venueInfo) {
    // 表演结果对象
    const result = {
        表演过程: [],
        观众反应: [],
        获得经验: 0,
        获得金币: 0,
        特殊奖励: null
    };

    // 计算表演质量(0-100)
    const performanceQuality = calculatePerformanceQuality(worldData, danceInfo);
    
    // 根据表演质量生成表演过程描述
    if (performanceQuality >= 90) {
        result.表演过程.push(
            "✨ 完美的表演!你的舞姿优雅动人",
            "🌟 舞台上散发出迷人的光芒",
            "💫 每个动作都行云流水般自然"
        );
    } else if (performanceQuality >= 70) {
        result.表演过程.push(
            "💝 表演非常精彩!",
            "✨ 舞蹈动作干净利落",
            "🎵 与音乐完美契合"
        );
    } else if (performanceQuality >= 50) {
        result.表演过程.push(
            "🎀 表演还不错",
            "💫 虽有小失误但整体流畅",
            "✨ 展现出了不错的舞蹈功底"
        );
    } else {
        result.表演过程.push(
            "💭 表演有些生疏",
            "⭐ 还需要多加练习",
            "✨ 但仍然收获了宝贵的经验"
        );
    }

    // 生成观众反应
    if (performanceQuality >= 90) {
        result.观众反应.push(
            "👏 观众们热烈鼓掌，现场气氛高涨!",
            "🌹 有人向舞台上扔来玫瑰花",
            "💖 观众们纷纷高呼'Encore!'"
        );
    } else if (performanceQuality >= 70) {
        result.观众反应.push(
            "👏 观众们报以热烈的掌声",
            "💝 不少人站起来欢呼",
            "✨ 现场氛围很好"
        );
    } else if (performanceQuality >= 50) {
        result.观众反应.push(
            "👏 获得了礼貌的掌声",
            "💫 观众们露出赞赏的微笑",
            "✨ 整体反应还不错"
        );
    } else {
        result.观众反应.push(
            "👏 稀稀落落的掌声",
            "💭 观众们窃窃私语",
            "⭐ 反应略显冷淡"
        );
    }

    // 计算奖励
    // 基础经验
    result.获得经验 = Math.floor(50 * venueInfo.经验倍率 * (performanceQuality / 50));
    // 基础金币(根据场地门票收入和表演质量)
    result.获得金币 = Math.floor(venueInfo.门票收入 * (performanceQuality / 100));

    // 特殊奖励
    if (performanceQuality >= 95) {
        result.特殊奖励 = "获得了「完美表演」称号";
    } else if (performanceQuality >= 90) {
        result.特殊奖励 = "获得了「优秀舞者」称号";
    }

    return result;
}

// 计算表演质量的辅助函数
function calculatePerformanceQuality(worldData, danceInfo) {
    // 基础分数
    let quality = 60;
    
    // 根据玩家属性加成
    quality += Math.min(30, worldData.属性.魅力值 / 2);
    quality += Math.min(20, worldData.等级 * 2);
    
    // 随机波动(-10到+10)
    quality += Math.random() * 20 - 10;
    
    // 确保在0-100之间
    return Math.max(0, Math.min(100, quality));
}