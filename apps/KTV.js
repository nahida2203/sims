import { segment } from 'icqq';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
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
const redis = new Redis();
const PLUGIN_PATH = path.join(process.cwd(), 'plugins', 'sims-plugin');
const WEAPON_STORE_FILE_PATH = path.join(PLUGIN_PATH, 'weapon_store.json');

export class UserStart extends plugin {
    constructor() {
        super({
            name: 'UserStart',
            dsc: '游戏开始',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#开KTV$', fnc: 'Open_KTV' },
                { reg: '^#唱歌$', fnc: 'Sing_in_KTV' },
                { reg: '^#购买歌曲$', fnc: 'Buy_song' },
                { reg: '^#购买装饰$', fnc: 'Buy_decoration' },
                { reg: '^#提升音质$', fnc: 'Upgrade_sound_quality' },
                { reg: '^#提升舞台效果$', fnc: 'Upgrade_stage_effect' },
                { reg: '^#提升音响效果$', fnc: 'Upgrade_speaker_effect' },
                { reg: '^#提升灯光效果$', fnc: 'Upgrade_light_effect' },
                { reg: '^#雇佣服务员$', fnc: 'Hire_waiter' },
                { reg: '^#雇佣DJ师$', fnc: 'Hire_DJ' },
                { reg: '^#雇佣调酒师$', fnc: 'Hire_bartender' },
                { reg: '^#雇佣厨师$', fnc: 'Hire_chef' },
                { reg: '^#雇佣歌手$', fnc: 'Hire_singer' },
                { reg: '^#雇佣舞蹈家$', fnc: 'Hire_dancer' },
                { reg: '^#购买音响设备$', fnc: 'Buy_speaker' },
                { reg: '^#购买灯光设备$', fnc: 'Buy_light' },
                { reg: '^#购买舞台设备$', fnc: 'Buy_stage_equipment' },
                { reg: '^#购买DJ设备$', fnc: 'Buy_DJ_equipment' },
                { reg: '^#购买调酒设备$', fnc: 'Buy_bartender_equipment' },
                { reg: '^#购买厨师设备$', fnc: 'Buy_chef_equipment' },
                { reg: '^#购买歌手服装$', fnc: 'Buy_singer_clothes' },
                { reg: '^#购买舞蹈家服装$', fnc: 'Buy_dancer_clothes' },
                { reg: '^#提升KTV等级$', fnc: 'Upgrade_KTV_level' },
                { reg: '^#KTV信息$', fnc: 'Show_KTV_status' },
            ],
        });
    }

    generateConversionCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let conversionCode = '';
        for (let i = 0; i < 7; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            const randomChar = characters.charAt(randomIndex);
            conversionCode += randomChar;
        }
        return conversionCode;
    }

    async Open_KTV(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (userData.KTV) {
            e.reply("你已经拥有一家KTV了！");
            return;
        }
    
        // KTV开业系统
        const openingSystem = {
            // 店铺风格选项
            styles: {
                "时尚现代风": {
                    cost: 10000,
                    benefits: {
                        youngCustomer: 20,
                        atmosphere: 15,
                        popularity: 10
                    },
                    description: "充满现代感的装修风格，受年轻人欢迎"
                },
                "复古怀旧风": {
                    cost: 8000,
                    benefits: {
                        matureCustomer: 20,
                        comfort: 15,
                        uniqueness: 10
                    },
                    description: "温馨复古的装修风格，让人倍感亲切"
                },
                "豪华欧式风": {
                    cost: 15000,
                    benefits: {
                        luxuryCustomer: 20,
                        elegance: 15,
                        prestige: 10
                    },
                    description: "奢华大气的装修风格，彰显高端品位"
                }
            },
    
            // 开业活动选项
            openingEvents: {
                "明星助阵": {
                    cost: 5000,
                    effect: "提升开业人气",
                    bonus: 0.2
                },
                "优惠折扣": {
                    cost: 2000,
                    effect: "吸引首批客户",
                    bonus: 0.15
                },
                "抽奖活动": {
                    cost: 3000,
                    effect: "增加互动趣味",
                    bonus: 0.18
                }
            },
    
            // 初始设施配置
            baseEquipment: {
                basic: {
                    cost: 5000,
                    items: ["基础音响", "基础灯光", "简单装饰"]
                },
                standard: {
                    cost: 10000,
                    items: ["标准音响", "LED灯光", "精美装饰"]
                },
                premium: {
                    cost: 15000,
                    items: ["高级音响", "智能灯光", "豪华装饰"]
                }
            }
        };
    
        // 显示开业选项
        if (!e.msg.includes('确认')) {
            let optionsMessage = "🎵 开设KTV选项 🎵\n\n";
            
            optionsMessage += "装修风格：\n";
            for (const [style, info] of Object.entries(openingSystem.styles)) {
                optionsMessage += `${style}：${info.cost}元\n`;
                optionsMessage += `描述：${info.description}\n`;
                optionsMessage += `————————\n`;
            }
    
            optionsMessage += "\n开业活动：\n";
            for (const [event, info] of Object.entries(openingSystem.openingEvents)) {
                optionsMessage += `${event}：${info.cost}元\n`;
                optionsMessage += `效果：${info.effect}\n`;
                optionsMessage += `————————\n`;
            }
    
            optionsMessage += "\n设施配置：\n";
            for (const [level, info] of Object.entries(openingSystem.baseEquipment)) {
                optionsMessage += `${level}配置：${info.cost}元\n`;
                optionsMessage += `包含：${info.items.join('、')}\n`;
                optionsMessage += `————————\n`;
            }
    
            optionsMessage += "\n请选择你想要的风格、活动和配置，然后发送"+'#开KTV 确认 [风格] [活动] [配置]'+"进行确认。";
            e.reply(optionsMessage);
            return;
        }
    
        // 解析用户选择
        const choices = e.msg.split(' ');
        const style = choices[2];
        const event = choices[3];
        const equipment = choices[4];
    
        // 验证选择
        if (!openingSystem.styles[style] || 
            !openingSystem.openingEvents[event] || 
            !openingSystem.baseEquipment[equipment]) {
            e.reply("选择无效，请检查输入是否正确。");
            return;
        }
    
        // 计算总成本
        const totalCost = openingSystem.styles[style].cost + 
                         openingSystem.openingEvents[event].cost + 
                         openingSystem.baseEquipment[equipment].cost;
    
        if (userData.money < totalCost) {
            e.reply(`开设KTV需要${totalCost}元，你的资金不足。`);
            return;
        }
    
        // 初始化KTV数据
        userData.KTV = {
            name: `KTV${this.generateConversionCode()}`,
            level: 1,
            style: style,
            cleanliness: 100,
            reputation: 50,
            violations: 0,
            income: 0,
            expenses: totalCost,
            maintenance: 0,
            discount: 0,
            songs: [],
            decorations: openingSystem.baseEquipment[equipment].items,
            sound_quality: equipment === 'premium' ? 3 : equipment === 'standard' ? 2 : 1,
            stage_effect: 1,
            speaker_effect: equipment === 'premium' ? 3 : equipment === 'standard' ? 2 : 1,
            light_effect: equipment === 'premium' ? 3 : equipment === 'standard' ? 2 : 1,
            staff: {
                manager: true,
                waiter: false,
                DJ: false,
                bartender: false,
                chef: false,
                singer: false,
                dancer: false
            },
            equipment: {
                speaker: equipment === 'premium' ? 3 : equipment === 'standard' ? 2 : 1,
                light: equipment === 'premium' ? 3 : equipment === 'standard' ? 2 : 1,
                stage: 1,
                DJ: 1
            },
            clothes: {
                singer: null,
                dancer: null
            },
            openingEvent: event
        };
    
        userData.money -= totalCost;
    
        // 生成开业消息
        let openingMessage = `🎉 恭喜你开设了新的KTV！\n\n`;
        openingMessage += `店铺名称：${userData.KTV.name}\n`;
        openingMessage += `装修风格：${style}\n`;
        openingMessage += `开业活动：${event}\n`;
        openingMessage += `设施配置：${equipment}\n`;
        openingMessage += `总投资：${totalCost}元\n\n`;
    
        // 随机开业祝福
        const blessings = [
            "祝你生意兴隆，财源广进！",
            "愿你的KTV成为城中最热门的娱乐场所！",
            "相信在你的经营下，这里会成为欢乐的海洋！",
            "开业大吉，生意兴旺！"
        ];
        openingMessage += blessings[Math.floor(Math.random() * blessings.length)];
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        
        e.reply(openingMessage);
    }

    async Sing_in_KTV(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            e.reply("你还没有自己的KTV，无法在这里唱歌！");
            return;
        }
    
        // 歌唱基础属性计算
        const baseSkill = userData.singing_skill || 1;
        const moodFactor = userData.mood / 100;
        const equipmentBonus = (userData.KTV.sound_quality + userData.KTV.speaker_effect) / 2;
        
        // 随机歌唱质量计算
        const randomFactor = Math.random();
        const singingQuality = (baseSkill * moodFactor * equipmentBonus * randomFactor * 100).toFixed(2);
    
        // 观众反应系统
        const audienceReactions = {
            perfect: [
                "全场观众都被你的歌声陶醉了！",
                "有人激动地站起来为你鼓掌！",
                "甚至有人想要你的签名！",
                "观众们纷纷举起手机打光！"
            ],
            good: [
                "获得了热烈的掌声！",
                "观众们跟着节奏摇摆！",
                "有人为你欢呼喝彩！"
            ],
            normal: [
                "获得了礼貌的掌声",
                "观众们露出微笑",
                "气氛还不错"
            ],
            bad: [
                "观众们有些走神",
                "掌声稀稀落落",
                "气氛有点尴尬"
            ]
        };
    
        // 特殊事件系统
        const specialEvents = {
            superStar: {
                chance: 0.05,
                message: "一位音乐制作人正好在场，对你的表现很感兴趣！",
                reward: 1000
            },
            encore: {
                chance: 0.1,
                message: "观众们要求返场演唱！",
                reward: 500
            },
            duet: {
                chance: 0.15,
                message: "一位专业歌手邀请你合唱！",
                reward: 300
            }
        };
    
        // 收入计算系统
        let baseIncome = 0;
        let reputationGain = 0;
        let audienceReaction = "";
        let specialEventMessage = "";
    
        // 根据歌唱质量决定结果
        if (singingQuality >= 90) {
            baseIncome = Math.floor(Math.random() * 500) + 500;
            reputationGain = 5;
            audienceReaction = audienceReactions.perfect[Math.floor(Math.random() * audienceReactions.perfect.length)];
        } else if (singingQuality >= 70) {
            baseIncome = Math.floor(Math.random() * 300) + 200;
            reputationGain = 3;
            audienceReaction = audienceReactions.good[Math.floor(Math.random() * audienceReactions.good.length)];
        } else if (singingQuality >= 50) {
            baseIncome = Math.floor(Math.random() * 200) + 100;
            reputationGain = 1;
            audienceReaction = audienceReactions.normal[Math.floor(Math.random() * audienceReactions.normal.length)];
        } else {
            baseIncome = Math.floor(Math.random() * 100);
            reputationGain = -1;
            audienceReaction = audienceReactions.bad[Math.floor(Math.random() * audienceReactions.bad.length)];
        }
    
        // 特殊事件检查
        for (const [eventName, event] of Object.entries(specialEvents)) {
            if (Math.random() < event.chance && singingQuality >= 70) {
                specialEventMessage = event.message;
                baseIncome += event.reward;
                break;
            }
        }
    
        // 环境加成
        const environmentBonus = Math.min(
            (userData.KTV.cleanliness / 100) * 
            (userData.KTV.light_effect / 10) * 
            (userData.KTV.stage_effect / 10),
            2
        );
        baseIncome = Math.floor(baseIncome * environmentBonus);
    
        // 员工加成
        if (userData.KTV.staff.DJ) baseIncome *= 1.2;
        if (userData.KTV.staff.singer) baseIncome *= 1.1;
    
        // 更新数据
        userData.KTV.income += baseIncome;
        userData.money += baseIncome;
        userData.KTV.reputation = Math.min(Math.max(userData.KTV.reputation + reputationGain, 0), 100);
        userData.mood = Math.min(userData.mood + 10, 100);
    
        // 恋爱系统整合
        let romanceMessage = "";
        if (userData.partner && userData.relationshipStatus === "恋爱中") {
            userData.partnerAffection += 5;
            const romanceEvents = [
                "你的恋人在台下为你加油打气，感觉超暖心！",
                "唱情歌时，你们的眼神交汇，瞬间感觉整个世界都亮了起来~",
                "你的恋人偷偷录下了你唱歌的视频，说要永远珍藏！",
                "你们深情对唱了一首情歌，周围的人都被你们的甜蜜感染了！"
            ];
            romanceMessage = "\n" + romanceEvents[Math.floor(Math.random() * romanceEvents.length)];
        }
    
        // 随机小贴士
        const tips = [
            "小贴士：心情好的时候唱歌会发挥得更好哦~",
            "小贴士：保持KTV环境整洁可以提升顾客体验！",
            "小贴士：升级设备能让你的表演更出色！",
            "小贴士：多唱歌可以提升你的歌唱技巧哦！"
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
        // 保存数据
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    
        // 生成回复消息
        let replyMessage = `🎤 演唱评价：${singingQuality}分\n`;
        replyMessage += `👥 观众反应：${audienceReaction}\n`;
        replyMessage += `💰 获得收入：${baseIncome}元\n`;
        replyMessage += `✨ 声誉变化：${reputationGain > 0 ? '+' : ''}${reputationGain}\n`;
        if (specialEventMessage) replyMessage += `🎉 特殊事件：${specialEventMessage}\n`;
        if (romanceMessage) replyMessage += romanceMessage + "\n";
        replyMessage += `\n${randomTip}`;
    
        e.reply(replyMessage);
    }

    async Buy_song(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 歌曲系统
        const songSystem = {
            // 歌曲分类
            categories: {
                "流行热歌": {
                    basePrice: 500,
                    popularity: 1.2,
                    targetAudience: "年轻群体",
                    songs: [
                        { name: "爱你", singer: "王心凌", hot: 90 },
                        { name: "星晴", singer: "周杰伦", hot: 95 },
                        { name: "泡沫", singer: "邓紫棋", hot: 88 }
                    ]
                },
                "经典老歌": {
                    basePrice: 400,
                    popularity: 1.0,
                    targetAudience: "中年群体",
                    songs: [
                        { name: "上海滩", singer: "叶丽仪", hot: 85 },
                        { name: "月亮代表我的心", singer: "邓丽君", hot: 92 },
                        { name: "甜蜜蜜", singer: "邓丽君", hot: 90 }
                    ]
                },
                "抖音神曲": {
                    basePrice: 600,
                    popularity: 1.5,
                    targetAudience: "年轻群体",
                    songs: [
                        { name: "醉清风", singer: "弦子", hot: 88 },
                        { name: "爱情错觉", singer: "半吨兄弟", hot: 86 },
                        { name: "你的答案", singer: "阿冗", hot: 93 }
                    ]
                }
            },
    
            // 歌曲特性
            features: {
                "KTV特制版": {
                    price: 200,
                    effect: "优化KTV演唱效果",
                    bonus: 0.15
                },
                "高清MV": {
                    price: 300,
                    effect: "提供精美画面",
                    bonus: 0.2
                },
                "多人合唱版": {
                    price: 250,
                    effect: "适合团体演唱",
                    bonus: 0.18
                }
            }
        };
    
        const songName = e.msg.replace('#购买歌曲', '').trim();
    
        // 显示歌曲目录
        if (!songName) {
            let catalogMessage = "🎵 歌曲购买目录 🎵\n\n";
            
            for (const [category, info] of Object.entries(songSystem.categories)) {
                catalogMessage += `【${category}】\n`;
                catalogMessage += `基础价格：${info.basePrice}元\n`;
                catalogMessage += `适合人群：${info.targetAudience}\n`;
                catalogMessage += `热门歌曲：\n`;
                
                info.songs.forEach(song => {
                    catalogMessage += `- ${song.name}（${song.singer}）热度：${song.hot}\n`;
                });
                catalogMessage += `————————\n`;
            }
    
            catalogMessage += "\n🎼 歌曲特性：\n";
            for (const [feature, info] of Object.entries(songSystem.features)) {
                catalogMessage += `${feature}：+${info.price}元\n`;
                catalogMessage += `效果：${info.effect}\n`;
            }
    
            e.reply(catalogMessage);
            return;
        }
    
        // 查找歌曲
        let selectedSong = null;
        let selectedCategory = null;
        for (const [category, info] of Object.entries(songSystem.categories)) {
            const found = info.songs.find(song => song.name === songName);
            if (found) {
                selectedSong = found;
                selectedCategory = info;
                break;
            }
        }
    
        if (!selectedSong) {
            e.reply("未找到该歌曲，请检查名称是否正确。");
            return;
        }
    
        // 随机特性
        const randomFeature = this.getRandomSongFeature(songSystem.features);
        const basePrice = selectedCategory.basePrice;
        const totalPrice = basePrice + (randomFeature ? songSystem.features[randomFeature].price : 0);
    
        if (userData.money >= totalPrice) {
            // 购买逻辑
            userData.KTV.songs.push({
                name: selectedSong.name,
                singer: selectedSong.singer,
                hot: selectedSong.hot,
                feature: randomFeature
            });
            
            userData.money -= totalPrice;
    
            // 计算声望加成
            const reputationGain = Math.floor(selectedSong.hot / 10);
            userData.KTV.reputation = Math.min(userData.KTV.reputation + reputationGain, 100);
    
            // 生成购买消息
            let buyMessage = `🎵 购买成功！\n`;
            buyMessage += `歌曲：${selectedSong.name}\n`;
            buyMessage += `演唱：${selectedSong.singer}\n`;
            buyMessage += `热度：${selectedSong.hot}\n`;
            buyMessage += `价格：${totalPrice}元\n`;
            
            if (randomFeature) {
                buyMessage += `\n✨ 附赠特性：${randomFeature}\n`;
                buyMessage += `效果：${songSystem.features[randomFeature].effect}\n`;
            }
    
            // 随机顾客反馈
            const feedback = [
                "顾客们都说要来唱这首歌呢！",
                "这首歌最近很受欢迎哦～",
                "很多人都在期待这首歌呢！",
                "这首歌一定能让KTV更热闹！"
            ];
            buyMessage += `\n💭 ${feedback[Math.floor(Math.random() * feedback.length)]}`;
    
            e.reply(buyMessage);
        } else {
            e.reply(`购买这首歌需要${totalPrice}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Buy_decoration(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 装饰品分类系统
        const decorationTypes = {
            "墙饰": {
                "浪漫星空壁画": {
                    price: 1200,
                    effects: {
                        atmosphere: 8,
                        cleanliness: 3,
                        reputation: 5
                    },
                    description: "梦幻的星空壁画，让人感觉置身浪漫星空下",
                    customerPreference: ["年轻情侣", "少女"]
                },
                "复古唱片墙": {
                    price: 1500,
                    effects: {
                        atmosphere: 6,
                        reputation: 8,
                        musicAtmosphere: 10
                    },
                    description: "用经典唱片装饰的墙面，展现音乐的魅力",
                    customerPreference: ["音乐发烧友", "中年顾客"]
                }
            },
            "吊饰": {
                "水晶吊灯": {
                    price: 2000,
                    effects: {
                        atmosphere: 10,
                        reputation: 10,
                        luxury: 15
                    },
                    description: "奢华的水晶吊灯，让空间更显高贵",
                    customerPreference: ["商务人士", "高端客户"]
                },
                "LED星光球": {
                    price: 1000,
                    effects: {
                        atmosphere: 7,
                        partyAtmosphere: 12
                    },
                    description: "炫酷的LED灯球，适合营造派对氛围",
                    customerPreference: ["年轻人", "派对达人"]
                }
            },
            "植物": {
                "绿萝盆栽": {
                    price: 300,
                    effects: {
                        cleanliness: 5,
                        freshness: 8,
                        atmosphere: 3
                    },
                    description: "清新的绿植，提升空间的生机",
                    customerPreference: ["文艺青年", "环保人士"]
                },
                "日式盆景": {
                    price: 800,
                    effects: {
                        atmosphere: 6,
                        elegance: 10,
                        cleanliness: 4
                    },
                    description: "精致的盆景，增添东方韵味",
                    customerPreference: ["文化爱好者", "商务人士"]
                }
            }
        };
    
        // 显示装饰品列表
        const decorationName = e.msg.replace('#购买装饰', '').trim();
        if (!decorationName) {
            let catalogMessage = "🎵 KTV装饰品目录 🎵\n";
            for (const [category, items] of Object.entries(decorationTypes)) {
                catalogMessage += `\n【${category}】\n`;
                for (const [name, info] of Object.entries(items)) {
                    catalogMessage += `${name}：${info.price}元\n`;
                    catalogMessage += `描述：${info.description}\n`;
                    catalogMessage += `特别受欢迎：${info.customerPreference.join('、')}\n`;
                    catalogMessage += `————————\n`;
                }
            }
            e.reply(catalogMessage);
            return;
        }
    
        // 查找装饰品
        let selectedDecoration = null;
        let selectedDecorationName = null;
        for (const category of Object.values(decorationTypes)) {
            for (const [name, info] of Object.entries(category)) {
                if (name === decorationName) {
                    selectedDecoration = info;
                    selectedDecorationName = name;
                    break;
                }
            }
            if (selectedDecoration) break;
        }
    
        if (!selectedDecoration) {
            e.reply("未找到该装饰品，请检查名称是否正确。");
            return;
        }
    
        // 检查是否已拥有
        if (userData.KTV.decorations.includes(selectedDecorationName)) {
            e.reply("你已经购买过这个装饰品了哦！");
            return;
        }
    
        // 购买逻辑
        if (userData.money >= selectedDecoration.price) {
            userData.money -= selectedDecoration.price;
            userData.KTV.decorations.push(selectedDecorationName);
    
            // 应用装饰效果
            userData.KTV.cleanliness = Math.min(userData.KTV.cleanliness + (selectedDecoration.effects.cleanliness || 0), 100);
            userData.KTV.reputation += selectedDecoration.effects.reputation || 0;
    
            // 计算综合提升效果
            let totalEffect = 0;
            for (const [effect, value] of Object.entries(selectedDecoration.effects)) {
                totalEffect += value;
            }
    
            // 随机特殊效果
            const specialEffects = [
                "路过的顾客们都在称赞这个新装饰呢！",
                "服务员说这个装饰很受年轻人欢迎！",
                "有顾客专门拍照打卡，在社交媒体分享了呢！",
                "这个装饰为KTV增添了不少格调！"
            ];
    
            let replyMessage = `🎉 购买成功！\n`;
            replyMessage += `装饰品：${selectedDecorationName}\n`;
            replyMessage += `花费：${selectedDecoration.price}元\n`;
            replyMessage += `效果：\n`;
            for (const [effect, value] of Object.entries(selectedDecoration.effects)) {
                replyMessage += `- ${effect}: +${value}\n`;
            }
    
            // 随机触发特殊效果
            if (Math.random() < 0.3) {
                replyMessage += `\n✨ ${specialEffects[Math.floor(Math.random() * specialEffects.length)]}`;
            }
    
            // 装饰搭配建议
            const recommendedCombos = this.getRecommendedCombos(selectedDecorationName, userData.KTV.decorations);
            if (recommendedCombos.length > 0) {
                replyMessage += `\n\n💡 搭配建议：\n`;
                replyMessage += `这个装饰与以下物品搭配效果更好：\n`;
                replyMessage += recommendedCombos.join('\n');
            }
    
            e.reply(replyMessage);
        } else {
            e.reply(`你的资金不足，该装饰品需要${selectedDecoration.price}元。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
   
    async Upgrade_sound_quality(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 音质系统
        const soundSystem = {
            // 音质等级
            levels: {
                1: {
                    name: "基础音质",
                    cost: 1000,
                    effects: {
                        clarity: 10,
                        balance: 8,
                        fidelity: 5
                    },
                    description: "基础的音质配置"
                },
                2: {
                    name: "高清音质",
                    cost: 2000,
                    effects: {
                        clarity: 15,
                        balance: 12,
                        fidelity: 10
                    },
                    description: "高清的音质系统"
                },
                3: {
                    name: "专业音质",
                    cost: 3500,
                    effects: {
                        clarity: 20,
                        balance: 18,
                        fidelity: 15
                    },
                    description: "专业级音质系统"
                },
                4: {
                    name: "HiFi音质",
                    cost: 5000,
                    effects: {
                        clarity: 25,
                        balance: 22,
                        fidelity: 20
                    },
                    description: "HiFi级音质系统"
                },
                5: {
                    name: "顶级音质",
                    cost: 8000,
                    effects: {
                        clarity: 30,
                        balance: 28,
                        fidelity: 25
                    },
                    description: "顶级音质配置"
                }
            },
    
            // 音质增强
            enhancements: {
                "降噪系统": {
                    cost: 2000,
                    effect: "减少环境噪音",
                    bonus: 0.25
                },
                "音频处理器": {
                    cost: 1500,
                    effect: "优化音频效果",
                    bonus: 0.2
                },
                "混响处理": {
                    cost: 1800,
                    effect: "增加空间感",
                    bonus: 0.22
                }
            },
    
            // 音频模式
            modes: {
                "演唱模式": {
                    type: "人声优化",
                    bonus: 0.15,
                    description: "优化人声表现"
                },
                "乐器模式": {
                    type: "乐器平衡",
                    bonus: 0.18,
                    description: "平衡乐器声音"
                },
                "合唱模式": {
                    type: "多人优化",
                    bonus: 0.2,
                    description: "优化多人演唱"
                }
            },
    
            // 音频预设
            presets: {
                "流行音乐": {
                    genre: "流行",
                    bonus: 0.12,
                    settings: "适合流行歌曲"
                },
                "摇滚重金属": {
                    genre: "摇滚",
                    bonus: 0.15,
                    settings: "适合摇滚歌曲"
                },
                "抒情民谣": {
                    genre: "民谣",
                    bonus: 0.1,
                    settings: "适合民谣歌曲"
                }
            }
        };
    
        // 显示当前等级信息
        const currentLevel = userData.KTV.sound_quality;
        const maxLevel = Object.keys(soundSystem.levels).length;
    
        if (currentLevel >= maxLevel) {
            e.reply("你的音质已经达到最高级别了！");
            return;
        }
    
        const nextLevel = currentLevel + 1;
        const upgradeInfo = soundSystem.levels[nextLevel];
        const upgradeCost = upgradeInfo.cost;
    
        if (userData.money >= upgradeCost) {
            // 随机获得音质增强
            const randomEnhancement = this.getRandomSoundEnhancement(soundSystem.enhancements);
            
            // 随机获得音频模式
            const randomMode = this.getRandomAudioMode(soundSystem.modes);
    
            // 随机获得音频预设
            const randomPreset = this.getRandomAudioPreset(soundSystem.presets);
    
            // 更新数据
            userData.KTV.sound_quality = nextLevel;
            userData.money -= upgradeCost;
    
            // 生成升级消息
            let upgradeMessage = `🎵 音质升级成功！\n`;
            upgradeMessage += `当前等级：${upgradeInfo.name}\n`;
            upgradeMessage += `花费：${upgradeCost}元\n\n`;
    
            upgradeMessage += `📊 效果提升：\n`;
            for (const [effect, value] of Object.entries(upgradeInfo.effects)) {
                upgradeMessage += `- ${effect}: +${value}\n`;
            }
    
            if (randomEnhancement) {
                upgradeMessage += `\n✨ 获得音质增强：${randomEnhancement}\n`;
                upgradeMessage += `效果：${soundSystem.enhancements[randomEnhancement].effect}\n`;
                upgradeMessage += `提升：${(soundSystem.enhancements[randomEnhancement].bonus * 100).toFixed(0)}%\n`;
            }
    
            if (randomMode) {
                upgradeMessage += `\n🎼 推荐音频模式：${randomMode}\n`;
                upgradeMessage += `类型：${soundSystem.modes[randomMode].type}\n`;
                upgradeMessage += `描述：${soundSystem.modes[randomMode].description}\n`;
            }
    
            if (randomPreset) {
                upgradeMessage += `\n🎹 音频预设：${randomPreset}\n`;
                upgradeMessage += `类型：${soundSystem.presets[randomPreset].genre}\n`;
                upgradeMessage += `说明：${soundSystem.presets[randomPreset].settings}\n`;
            }
    
            // 随机评价
            const comments = [
                "音质提升后，歌声更加清晰动听了！",
                "现在的音质真是太棒了！",
                "这样的音质水平绝对能让顾客享受到最佳体验！",
                "整个KTV的档次都提升了！"
            ];
            upgradeMessage += `\n💭 ${comments[Math.floor(Math.random() * comments.length)]}`;
    
            e.reply(upgradeMessage);
        } else {
            e.reply(`升级到${upgradeInfo.name}需要${upgradeCost}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
   
    async Upgrade_stage_effect(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 舞台效果系统
        const stageEffectSystem = {
            // 效果等级
            levels: {
                1: {
                    name: "基础舞台",
                    cost: 800,
                    effects: {
                        visual: 10,
                        atmosphere: 8,
                        performance: 5
                    },
                    description: "基础的舞台效果设置"
                },
                2: {
                    name: "进阶舞台",
                    cost: 1500,
                    effects: {
                        visual: 15,
                        atmosphere: 12,
                        performance: 10
                    },
                    description: "改进的舞台效果系统"
                },
                3: {
                    name: "专业舞台",
                    cost: 2500,
                    effects: {
                        visual: 20,
                        atmosphere: 18,
                        performance: 15
                    },
                    description: "专业级舞台效果设置"
                },
                4: {
                    name: "豪华舞台",
                    cost: 4000,
                    effects: {
                        visual: 25,
                        atmosphere: 22,
                        performance: 20
                    },
                    description: "高端舞台效果系统"
                },
                5: {
                    name: "顶级舞台",
                    cost: 6000,
                    effects: {
                        visual: 30,
                        atmosphere: 28,
                        performance: 25
                    },
                    description: "顶级舞台效果配置"
                }
            },
    
            // 特殊效果
            specialEffects: {
                "全息投影": {
                    cost: 2000,
                    effect: "创造震撼视觉效果",
                    bonus: 0.25
                },
                "雾气系统": {
                    cost: 1500,
                    effect: "营造梦幻氛围",
                    bonus: 0.2
                },
                "激光阵列": {
                    cost: 1800,
                    effect: "打造绚丽光效",
                    bonus: 0.22
                }
            },
    
            // 舞台主题
            themes: {
                "未来科技": {
                    style: "现代感",
                    bonus: 0.15,
                    description: "充满科技感的未来风格"
                },
                "复古怀旧": {
                    style: "经典风",
                    bonus: 0.12,
                    description: "充满年代感的复古风格"
                },
                "梦幻童话": {
                    style: "浪漫风",
                    bonus: 0.18,
                    description: "梦幻唯美的童话风格"
                }
            }
        };
    
        const currentLevel = userData.KTV.stage_effect;
        const maxLevel = Object.keys(stageEffectSystem.levels).length;
    
        if (currentLevel >= maxLevel) {
            e.reply("你的舞台效果已经达到最高级别了！");
            return;
        }
    
        const nextLevel = currentLevel + 1;
        const upgradeInfo = stageEffectSystem.levels[nextLevel];
        const upgradeCost = upgradeInfo.cost;
    
        if (userData.money >= upgradeCost) {
            // 随机获得特殊效果
            const randomEffect = this.getRandomStageEffect(stageEffectSystem.specialEffects);
            
            // 随机获得主题
            const randomTheme = this.getRandomStageTheme(stageEffectSystem.themes);
    
            // 更新数据
            userData.KTV.stage_effect = nextLevel;
            userData.money -= upgradeCost;
    
            // 计算综合提升效果
            let totalEffect = 0;
            for (const value of Object.values(upgradeInfo.effects)) {
                totalEffect += value;
            }
            if (randomEffect) {
                totalEffect *= (1 + stageEffectSystem.specialEffects[randomEffect].bonus);
            }
            if (randomTheme) {
                totalEffect *= (1 + stageEffectSystem.themes[randomTheme].bonus);
            }
    
            // 生成升级消息
            let upgradeMessage = `🎭 舞台效果升级成功！\n`;
            upgradeMessage += `当前等级：${upgradeInfo.name}\n`;
            upgradeMessage += `花费：${upgradeCost}元\n\n`;
    
            upgradeMessage += `📊 效果提升：\n`;
            for (const [effect, value] of Object.entries(upgradeInfo.effects)) {
                upgradeMessage += `- ${effect}: +${value}\n`;
            }
    
            if (randomEffect) {
                upgradeMessage += `\n✨ 获得特效：${randomEffect}\n`;
                upgradeMessage += `效果：${stageEffectSystem.specialEffects[randomEffect].effect}\n`;
                upgradeMessage += `提升：${(stageEffectSystem.specialEffects[randomEffect].bonus * 100).toFixed(0)}%\n`;
            }
    
            if (randomTheme) {
                upgradeMessage += `\n🎨 推荐主题：${randomTheme}\n`;
                upgradeMessage += `风格：${stageEffectSystem.themes[randomTheme].style}\n`;
                upgradeMessage += `描述：${stageEffectSystem.themes[randomTheme].description}\n`;
            }
    
            // 随机评价
            const comments = [
                "舞台效果提升后，表演更加出色了！",
                "现在的舞台效果真是太棒了！",
                "顾客们一定会被这个效果震撼到的！",
                "整个表演空间都焕然一新了！"
            ];
            upgradeMessage += `\n💭 ${comments[Math.floor(Math.random() * comments.length)]}`;
    
            e.reply(upgradeMessage);
        } else {
            e.reply(`升级到${upgradeInfo.name}需要${upgradeCost}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
   
    async Upgrade_speaker_effect(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 音响效果系统
        const speakerSystem = {
            // 音响等级
            levels: {
                1: {
                    name: "基础音响",
                    cost: 1200,
                    effects: {
                        sound: 10,
                        clarity: 8,
                        bass: 5
                    },
                    description: "基础的音响系统配置"
                },
                2: {
                    name: "进阶音响",
                    cost: 2000,
                    effects: {
                        sound: 15,
                        clarity: 12,
                        bass: 10
                    },
                    description: "改进的音响系统"
                },
                3: {
                    name: "专业音响",
                    cost: 3500,
                    effects: {
                        sound: 20,
                        clarity: 18,
                        bass: 15
                    },
                    description: "专业级音响系统"
                },
                4: {
                    name: "豪华音响",
                    cost: 5000,
                    effects: {
                        sound: 25,
                        clarity: 22,
                        bass: 20
                    },
                    description: "高端音响系统"
                },
                5: {
                    name: "顶级音响",
                    cost: 8000,
                    effects: {
                        sound: 30,
                        clarity: 28,
                        bass: 25
                    },
                    description: "顶级音响配置"
                }
            },
    
            // 音效增强
            soundEnhancements: {
                "环绕声系统": {
                    cost: 2500,
                    effect: "创造沉浸式音效",
                    bonus: 0.25
                },
                "智能均衡器": {
                    cost: 1800,
                    effect: "自动优化音质",
                    bonus: 0.2
                },
                "超重低音": {
                    cost: 2000,
                    effect: "增强低频效果",
                    bonus: 0.22
                }
            },
    
            // 音响模式
            modes: {
                "演唱模式": {
                    type: "人声优化",
                    bonus: 0.15,
                    description: "优化人声表现"
                },
                "派对模式": {
                    type: "氛围营造",
                    bonus: 0.18,
                    description: "增强现场气氛"
                },
                "清晰模式": {
                    type: "音质优化",
                    bonus: 0.12,
                    description: "提升声音清晰度"
                }
            }
        };
    
        // 显示当前等级信息
        const currentLevel = userData.KTV.speaker_effect;
        const maxLevel = Object.keys(speakerSystem.levels).length;
    
        if (currentLevel >= maxLevel) {
            e.reply("你的音响效果已经达到最高级别了！");
            return;
        }
    
        const nextLevel = currentLevel + 1;
        const upgradeInfo = speakerSystem.levels[nextLevel];
        const upgradeCost = upgradeInfo.cost;
    
        if (userData.money >= upgradeCost) {
            // 随机获得音效增强
            const randomEnhancement = this.getRandomSoundEnhancement(speakerSystem.soundEnhancements);
            
            // 随机获得音响模式
            const randomMode = this.getRandomSpeakerMode(speakerSystem.modes);
    
            // 更新数据
            userData.KTV.speaker_effect = nextLevel;
            userData.money -= upgradeCost;
    
            // 计算综合提升效果
            let totalEffect = 0;
            for (const value of Object.values(upgradeInfo.effects)) {
                totalEffect += value;
            }
            if (randomEnhancement) {
                totalEffect *= (1 + speakerSystem.soundEnhancements[randomEnhancement].bonus);
            }
            if (randomMode) {
                totalEffect *= (1 + speakerSystem.modes[randomMode].bonus);
            }
    
            // 生成升级消息
            let upgradeMessage = `🔊 音响效果升级成功！\n`;
            upgradeMessage += `当前等级：${upgradeInfo.name}\n`;
            upgradeMessage += `花费：${upgradeCost}元\n\n`;
    
            upgradeMessage += `📊 效果提升：\n`;
            for (const [effect, value] of Object.entries(upgradeInfo.effects)) {
                upgradeMessage += `- ${effect}: +${value}\n`;
            }
    
            if (randomEnhancement) {
                upgradeMessage += `\n✨ 获得音效增强：${randomEnhancement}\n`;
                upgradeMessage += `效果：${speakerSystem.soundEnhancements[randomEnhancement].effect}\n`;
                upgradeMessage += `提升：${(speakerSystem.soundEnhancements[randomEnhancement].bonus * 100).toFixed(0)}%\n`;
            }
    
            if (randomMode) {
                upgradeMessage += `\n🎵 推荐音响模式：${randomMode}\n`;
                upgradeMessage += `类型：${speakerSystem.modes[randomMode].type}\n`;
                upgradeMessage += `描述：${speakerSystem.modes[randomMode].description}\n`;
            }
    
            // 随机评价
            const comments = [
                "音响效果提升后，歌声更动听了！",
                "现在的音质真是太棒了！",
                "顾客们一定会被这个音效震撼到的！",
                "整个空间的音响效果都提升了！"
            ];
            upgradeMessage += `\n💭 ${comments[Math.floor(Math.random() * comments.length)]}`;
    
            e.reply(upgradeMessage);
        } else {
            e.reply(`升级到${upgradeInfo.name}需要${upgradeCost}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
   
    async Upgrade_light_effect(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 灯光效果系统
        const lightSystem = {
            // 灯光等级
            levels: {
                1: {
                    name: "基础灯光",
                    cost: 1000,
                    effects: {
                        brightness: 10,
                        color: 8,
                        dynamic: 5
                    },
                    description: "基础的灯光系统配置"
                },
                2: {
                    name: "进阶灯光",
                    cost: 1800,
                    effects: {
                        brightness: 15,
                        color: 12,
                        dynamic: 10
                    },
                    description: "改进的灯光系统"
                },
                3: {
                    name: "专业灯光",
                    cost: 3000,
                    effects: {
                        brightness: 20,
                        color: 18,
                        dynamic: 15
                    },
                    description: "专业级灯光系统"
                },
                4: {
                    name: "豪华灯光",
                    cost: 4500,
                    effects: {
                        brightness: 25,
                        color: 22,
                        dynamic: 20
                    },
                    description: "高端灯光系统"
                },
                5: {
                    name: "顶级灯光",
                    cost: 7000,
                    effects: {
                        brightness: 30,
                        color: 28,
                        dynamic: 25
                    },
                    description: "顶级灯光配置"
                }
            },
    
            // 灯光特效
            lightEffects: {
                "激光投影": {
                    cost: 2000,
                    effect: "创造炫丽光效",
                    bonus: 0.25
                },
                "智能追踪": {
                    cost: 1500,
                    effect: "自动跟随表演",
                    bonus: 0.2
                },
                "全息投影": {
                    cost: 2500,
                    effect: "打造立体效果",
                    bonus: 0.3
                }
            },
    
            // 灯光场景
            scenes: {
                "浪漫粉色": {
                    mood: "温馨",
                    bonus: 0.15,
                    description: "营造温馨浪漫氛围"
                },
                "动感闪烁": {
                    mood: "热烈",
                    bonus: 0.18,
                    description: "打造活力派对氛围"
                },
                "梦幻星空": {
                    mood: "梦幻",
                    bonus: 0.2,
                    description: "创造梦幻奇幻氛围"
                }
            },
    
            // 智能控制系统
            smartControl: {
                "音乐互动": {
                    feature: "根据音乐节奏变化",
                    bonus: 0.12
                },
                "情景模式": {
                    feature: "一键切换多种场景",
                    bonus: 0.15
                },
                "远程控制": {
                    feature: "手机APP远程操作",
                    bonus: 0.1
                }
            }
        };
    
        const currentLevel = userData.KTV.light_effect;
        const maxLevel = Object.keys(lightSystem.levels).length;
    
        if (currentLevel >= maxLevel) {
            e.reply("你的灯光效果已经达到最高级别了！");
            return;
        }
    
        const nextLevel = currentLevel + 1;
        const upgradeInfo = lightSystem.levels[nextLevel];
        const upgradeCost = upgradeInfo.cost;
    
        if (userData.money >= upgradeCost) {
            // 随机获得特效
            const randomEffect = this.getRandomLightEffect(lightSystem.lightEffects);
            
            // 随机获得场景
            const randomScene = this.getRandomLightScene(lightSystem.scenes);
    
            // 随机获得智能控制
            const randomControl = this.getRandomSmartControl(lightSystem.smartControl);
    
            // 更新数据
            userData.KTV.light_effect = nextLevel;
            userData.money -= upgradeCost;
    
            // 计算综合提升效果
            let totalEffect = 0;
            for (const value of Object.values(upgradeInfo.effects)) {
                totalEffect += value;
            }
    
            // 应用各种加成
            if (randomEffect) {
                totalEffect *= (1 + lightSystem.lightEffects[randomEffect].bonus);
            }
            if (randomScene) {
                totalEffect *= (1 + lightSystem.scenes[randomScene].bonus);
            }
            if (randomControl) {
                totalEffect *= (1 + lightSystem.smartControl[randomControl].bonus);
            }
    
            // 生成升级消息
            let upgradeMessage = `💡 灯光效果升级成功！\n`;
            upgradeMessage += `当前等级：${upgradeInfo.name}\n`;
            upgradeMessage += `花费：${upgradeCost}元\n\n`;
    
            upgradeMessage += `📊 效果提升：\n`;
            for (const [effect, value] of Object.entries(upgradeInfo.effects)) {
                upgradeMessage += `- ${effect}: +${value}\n`;
            }
    
            if (randomEffect) {
                upgradeMessage += `\n✨ 获得特效：${randomEffect}\n`;
                upgradeMessage += `效果：${lightSystem.lightEffects[randomEffect].effect}\n`;
                upgradeMessage += `提升：${(lightSystem.lightEffects[randomEffect].bonus * 100).toFixed(0)}%\n`;
            }
    
            if (randomScene) {
                upgradeMessage += `\n🌈 推荐场景：${randomScene}\n`;
                upgradeMessage += `氛围：${lightSystem.scenes[randomScene].mood}\n`;
                upgradeMessage += `描述：${lightSystem.scenes[randomScene].description}\n`;
            }
    
            if (randomControl) {
                upgradeMessage += `\n🎮 智能控制：${randomControl}\n`;
                upgradeMessage += `功能：${lightSystem.smartControl[randomControl].feature}\n`;
            }
    
            // 随机评价
            const comments = [
                "灯光效果太棒了，整个空间都亮起来了！",
                "现在的灯光效果真是太炫酷了！",
                "顾客们一定会被这个灯光效果吸引的！",
                "整个氛围都变得更加梦幻了！"
            ];
            upgradeMessage += `\n💭 ${comments[Math.floor(Math.random() * comments.length)]}`;
    
            e.reply(upgradeMessage);
        } else {
            e.reply(`升级到${upgradeInfo.name}需要${upgradeCost}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    async Hire_waiter(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 服务员系统
        const waiterSystem = {
            baseSalary: 500,
            levels: {
                "实习生": {
                    salary: 500,
                    efficiency: 0.8,
                    experience: 0,
                    skills: ["基础服务"],
                    description: "刚入职的新人，充满热情但经验不足"
                },
                "普通服务员": {
                    salary: 800,
                    efficiency: 1.0,
                    experience: 100,
                    skills: ["基础服务", "礼仪接待"],
                    description: "有一定经验的服务员，能够胜任基本工作"
                },
                "资深服务员": {
                    salary: 1200,
                    efficiency: 1.2,
                    experience: 300,
                    skills: ["基础服务", "礼仪接待", "危机处理"],
                    description: "经验丰富的服务员，能处理各种突发情况"
                },
                "金牌服务员": {
                    salary: 2000,
                    efficiency: 1.5,
                    experience: 600,
                    skills: ["基础服务", "礼仪接待", "危机处理", "VIP服务"],
                    description: "顶级服务员，能为顾客提供极致服务体验"
                }
            },
            
            // 服务员特质系统
            traits: {
                "亲和力": {
                    effect: "提升顾客满意度10%",
                    bonus: 0.1
                },
                "细心": {
                    effect: "减少失误率15%",
                    bonus: 0.15
                },
                "高效": {
                    effect: "工作效率提升20%",
                    bonus: 0.2
                },
                "应变力": {
                    effect: "提升危机处理能力25%",
                    bonus: 0.25
                }
            }
        };
    
        // 如果已经雇佣了服务员
        if (userData.KTV.staff.waiter) {
            // 显示当前服务员信息
            const currentWaiter = userData.KTV.waiterInfo || {
                level: "实习生",
                experience: 0,
                traits: [],
                satisfaction: 100,
                workDays: 0
            };
    
            let waiterStatus = `📋 当前服务员信息：\n`;
            waiterStatus += `级别：${currentWaiter.level}\n`;
            waiterStatus += `经验：${currentWaiter.experience}\n`;
            waiterStatus += `特质：${currentWaiter.traits.join('、') || '无'}\n`;
            waiterStatus += `满意度：${currentWaiter.satisfaction}%\n`;
            waiterStatus += `工作天数：${currentWaiter.workDays}天\n`;
            
            // 显示升级进度
            const nextLevel = this.getNextWaiterLevel(currentWaiter.level);
            if (nextLevel) {
                const requiredExp = waiterSystem.levels[nextLevel].experience;
                const currentExp = currentWaiter.experience;
                waiterStatus += `\n📈 距离升级还需：${requiredExp - currentExp}经验\n`;
            }
    
            e.reply(waiterStatus);
            return;
        }
    
        // 招聘新服务员
        const hireCost = waiterSystem.baseSalary;
        if (userData.money >= hireCost) {
            // 随机生成服务员特质
            const randomTraits = this.generateRandomTraits(waiterSystem.traits);
            
            // 初始化服务员数据
            userData.KTV.waiterInfo = {
                level: "实习生",
                experience: 0,
                traits: randomTraits,
                satisfaction: 100,
                workDays: 0,
                lastPayday: Date.now()
            };
    
            userData.KTV.staff.waiter = true;
            userData.money -= hireCost;
    
            // 计算服务员带来的效果
            let totalBonus = 0;
            for (const trait of randomTraits) {
                totalBonus += waiterSystem.traits[trait].bonus;
            }
    
            // 生成雇佣结果消息
            let hireMessage = `🎉 招聘成功！\n`;
            hireMessage += `花费：${hireCost}元\n\n`;
            hireMessage += `👤 服务员信息：\n`;
            hireMessage += `级别：实习生\n`;
            hireMessage += `特质：${randomTraits.join('、')}\n`;
            
            // 特质效果说明
            hireMessage += `\n✨ 特质效果：\n`;
            for (const trait of randomTraits) {
                hireMessage += `${trait}：${waiterSystem.traits[trait].effect}\n`;
            }
    
            // 随机新人欢迎语
            const welcomeMessages = [
                "新来的服务员看起来很有干劲呢！",
                "服务员很快就融入了工作环境~",
                "看起来是个很有潜力的新人！",
                "相信她会为KTV带来更好的服务体验~"
            ];
            hireMessage += `\n💭 ${welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]}`;
    
            e.reply(hireMessage);
        } else {
            e.reply(`招聘服务员需要${hireCost}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Hire_DJ(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // DJ系统
        const DJSystem = {
            // DJ等级分类
            levels: {
                "新手DJ": {
                    salary: 600,
                    skills: ["基础打碟"],
                    experience: 0,
                    performance: 0.8,
                    description: "刚入行的DJ，富有热情但经验尚浅"
                },
                "进阶DJ": {
                    salary: 1000,
                    skills: ["基础打碟", "现场混音"],
                    experience: 100,
                    performance: 1.0,
                    description: "有一定经验的DJ，能带动现场气氛"
                },
                "专业DJ": {
                    salary: 1500,
                    skills: ["基础打碟", "现场混音", "气氛调节"],
                    experience: 300,
                    performance: 1.2,
                    description: "经验丰富的DJ，擅长带动全场"
                },
                "金牌DJ": {
                    salary: 2500,
                    skills: ["基础打碟", "现场混音", "气氛调节", "创意编曲"],
                    experience: 500,
                    performance: 1.5,
                    description: "顶级DJ，能创造独特的音乐体验"
                }
            },
    
            // DJ特长
            specialties: {
                "电音达人": {
                    effect: "电子音乐效果提升25%",
                    bonus: 0.25
                },
                "氛围大师": {
                    effect: "现场气氛提升20%",
                    bonus: 0.2
                },
                "混音专家": {
                    effect: "混音效果提升30%",
                    bonus: 0.3
                },
                "节奏掌控": {
                    effect: "带动效果提升22%",
                    bonus: 0.22
                }
            },
    
            // 音乐风格
            styles: {
                "流行电音": {
                    popularity: 1.2,
                    targetAudience: "年轻群体"
                },
                "House音乐": {
                    popularity: 1.1,
                    targetAudience: "派对达人"
                },
                "复古混音": {
                    popularity: 1.0,
                    targetAudience: "怀旧群体"
                }
            }
        };
    
        if (userData.KTV.staff.DJ) {
            // 显示当前DJ信息
            const currentDJ = userData.KTV.DJInfo || {
                level: "新手DJ",
                experience: 0,
                specialties: [],
                style: "流行电音",
                performance: 80,
                workDays: 0
            };
    
            let DJStatus = `🎧 当前DJ信息：\n`;
            DJStatus += `等级：${currentDJ.level}\n`;
            DJStatus += `经验：${currentDJ.experience}\n`;
            DJStatus += `特长：${currentDJ.specialties.join('、') || '无'}\n`;
            DJStatus += `擅长风格：${currentDJ.style}\n`;
            DJStatus += `表现评分：${currentDJ.performance}分\n`;
            DJStatus += `工作天数：${currentDJ.workDays}天\n`;
    
            // 显示升级进度
            const nextLevel = this.getNextDJLevel(currentDJ.level);
            if (nextLevel) {
                const requiredExp = DJSystem.levels[nextLevel].experience;
                const currentExp = currentDJ.experience;
                DJStatus += `\n📈 距离升级还需：${requiredExp - currentExp}经验\n`;
            }
    
            e.reply(DJStatus);
            return;
        }
    
        // 雇佣新DJ
        const randomLevel = this.getRandomDJLevel(DJSystem.levels);
        const hireCost = DJSystem.levels[randomLevel].salary;
    
        if (userData.money >= hireCost) {
            // 随机生成特长和风格
            const randomSpecialties = this.generateRandomSpecialties(DJSystem.specialties);
            const randomStyle = this.getRandomStyle(DJSystem.styles);
    
            // 初始化DJ数据
            userData.KTV.DJInfo = {
                level: randomLevel,
                experience: DJSystem.levels[randomLevel].experience,
                specialties: randomSpecialties,
                style: randomStyle,
                performance: 80,
                workDays: 0,
                lastPayday: Date.now()
            };
    
            userData.KTV.staff.DJ = true;
            userData.money -= hireCost;
    
            // 计算DJ带来的效果提升
            let totalBonus = 0;
            for (const specialty of randomSpecialties) {
                totalBonus += DJSystem.specialties[specialty].bonus;
            }
    
            // 生成雇佣结果消息
            let hireMessage = `🎉 雇佣成功！\n`;
            hireMessage += `DJ等级：${randomLevel}\n`;
            hireMessage += `月薪：${hireCost}元\n`;
            hireMessage += `擅长风格：${randomStyle}\n\n`;
            
            hireMessage += `✨ 特长：\n`;
            for (const specialty of randomSpecialties) {
                hireMessage += `- ${specialty}：${DJSystem.specialties[specialty].effect}\n`;
            }
    
            hireMessage += `\n🎵 掌握技能：\n`;
            for (const skill of DJSystem.levels[randomLevel].skills) {
                hireMessage += `- ${skill}\n`;
            }
    
            // 随机欢迎语
            const welcomes = [
                "这位DJ的混音风格很独特呢！",
                "看来能给KTV带来不一样的氛围！",
                "相信会给顾客带来精彩的表演！",
                "专业水平很不错，是个好选择！"
            ];
            hireMessage += `\n💭 ${welcomes[Math.floor(Math.random() * welcomes.length)]}`;
    
            e.reply(hireMessage);
        } else {
            e.reply(`雇佣${randomLevel}需要${hireCost}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    async Hire_bartender(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 调酒师系统
        const bartenderSystem = {
            // 调酒师等级
            levels: {
                "初级调酒师": {
                    salary: 1000,
                    skills: ["基础调酒"],
                    experience: 0,
                    performance: 0.8,
                    description: "刚入行的调酒师,擅长制作简单鸡尾酒"
                },
                "中级调酒师": {
                    salary: 1800,
                    skills: ["基础调酒", "花式调酒"],
                    experience: 100,
                    performance: 1.0,
                    description: "有经验的调酒师,能调制经典鸡尾酒"
                },
                "高级调酒师": {
                    salary: 2800,
                    skills: ["基础调酒", "花式调酒", "创意调酒"],
                    experience: 300,
                    performance: 1.2,
                    description: "专业调酒师,擅长创新配方"
                },
                "首席调酒师": {
                    salary: 4000,
                    skills: ["基础调酒", "花式调酒", "创意调酒", "分子调酒"],
                    experience: 500,
                    performance: 1.5,
                    description: "顶级调酒师,能打造独特的饮品体验"
                }
            },
    
            // 调酒师特长
            specialties: {
                "花式调酒": {
                    effect: "表演效果提升25%",
                    bonus: 0.25
                },
                "口感调配": {
                    effect: "饮品口感提升20%",
                    bonus: 0.2
                },
                "创意研发": {
                    effect: "新品开发效率提升30%",
                    bonus: 0.3
                },
                "视觉呈现": {
                    effect: "饮品颜值提升22%",
                    bonus: 0.22
                }
            },
    
            // 特色酒单
            specialDrinks: {
                "经典系列": {
                    drinks: ["莫吉托", "长岛冰茶", "玛格丽特"],
                    price: "中等",
                    popularity: "高"
                },
                "创意系列": {
                    drinks: ["蓝色珊瑚", "彩虹极光", "星空梦境"],
                    price: "高",
                    popularity: "中高"
                },
                "无酒精系列": {
                    drinks: ["水果莫吉托", "薄荷柠檬", "莓果气泡"],
                    price: "中低",
                    popularity: "中"
                }
            },
    
            // 调酒师状态
            conditions: {
                "灵感迸发": {
                    performance: 1.3,
                    duration: "4小时",
                    description: "适合创新调制"
                },
                "状态稳定": {
                    performance: 1.0,
                    duration: "6小时",
                    description: "正常工作状态"
                },
                "略感疲惫": {
                    performance: 0.8,
                    duration: "3小时",
                    description: "需要休息"
                }
            }
        };
    
        if (userData.KTV.staff.bartender) {
            // 显示当前调酒师信息
            const currentBartender = userData.KTV.bartenderInfo || {
                level: "初级调酒师",
                experience: 0,
                specialties: [],
                specialDrinks: [],
                condition: "状态稳定",
                performance: 80,
                satisfaction: 100,
                workDays: 0,
                createdDrinks: 0
            };
    
            let bartenderStatus = `🍸 当前调酒师信息：\n`;
            bartenderStatus += `等级：${currentBartender.level}\n`;
            bartenderStatus += `经验：${currentBartender.experience}\n`;
            bartenderStatus += `特长：${currentBartender.specialties.join('、') || '无'}\n`;
            bartenderStatus += `特色酒品：${currentBartender.specialDrinks.join('、') || '暂无'}\n`;
            bartenderStatus += `当前状态：${currentBartender.condition}\n`;
            bartenderStatus += `表现评分：${currentBartender.performance}分\n`;
            bartenderStatus += `满意度：${currentBartender.satisfaction}%\n`;
            bartenderStatus += `工作天数：${currentBartender.workDays}天\n`;
            bartenderStatus += `创作饮品：${currentBartender.createdDrinks}款\n`;
    
            // 显示升级进度
            const nextLevel = this.getNextBartenderLevel(currentBartender.level);
            if (nextLevel) {
                const requiredExp = bartenderSystem.levels[nextLevel].experience;
                const currentExp = currentBartender.experience;
                bartenderStatus += `\n📈 距离升级还需：${requiredExp - currentExp}经验\n`;
            }
    
            // 状态建议
            if (currentBartender.satisfaction < 80) {
                bartenderStatus += `\n💡 提示：调酒师的满意度较低，建议改善工作环境`;
            }
            if (currentBartender.condition === "略感疲惫") {
                bartenderStatus += `\n💡 提示：调酒师较为疲惫，建议安排休息`;
            }
            if (currentBartender.condition === "灵感迸发") {
                bartenderStatus += `\n💡 提示：调酒师正在创作状态，可以开发新饮品`;
            }
    
            e.reply(bartenderStatus);
            return;
        }
    
        // 雇佣新调酒师
        const randomLevel = this.getRandomBartenderLevel(bartenderSystem.levels);
        const hireCost = bartenderSystem.levels[randomLevel].salary;
    
        if (userData.money >= hireCost) {
            // 随机生成特长和特色酒品
            const randomSpecialties = this.generateRandomBartenderSpecialties(bartenderSystem.specialties);
            const randomDrinks = this.getRandomSpecialDrinks(bartenderSystem.specialDrinks);
            const randomCondition = this.getRandomBartenderCondition(bartenderSystem.conditions);
    
            // 初始化调酒师数据
            userData.KTV.bartenderInfo = {
                level: randomLevel,
                experience: bartenderSystem.levels[randomLevel].experience,
                specialties: randomSpecialties,
                specialDrinks: randomDrinks,
                condition: randomCondition,
                performance: 80,
                satisfaction: 100,
                workDays: 0,
                createdDrinks: Math.floor(Math.random() * 15),
                lastPayday: Date.now()
            };
    
            userData.KTV.staff.bartender = true;
            userData.money -= hireCost;
    
            // 生成雇佣结果消息
            let hireMessage = `🍸 调酒师雇佣成功！\n`;
            hireMessage += `等级：${randomLevel}\n`;
            hireMessage += `月薪：${hireCost}元\n`;
            hireMessage += `当前状态：${randomCondition}\n\n`;
    
            hireMessage += `✨ 特长：\n`;
            for (const specialty of randomSpecialties) {
                hireMessage += `- ${specialty}：${bartenderSystem.specialties[specialty].effect}\n`;
            }
    
            hireMessage += `\n🍹 掌握技能：\n`;
            for (const skill of bartenderSystem.levels[randomLevel].skills) {
                hireMessage += `- ${skill}\n`;
            }
    
            hireMessage += `\n🥂 特色酒品：\n`;
            for (const drink of randomDrinks) {
                hireMessage += `- ${drink}\n`;
            }
    
            // 随机欢迎语
            const welcomes = [
                "这位调酒师的手艺真是一流呢！",
                "期待能品尝到独特的特调鸡尾酒～",
                "看起来是位很有经验的调酒师呢！",
                "相信能为顾客带来美妙的饮品体验！"
            ];
            hireMessage += `\n💭 ${welcomes[Math.floor(Math.random() * welcomes.length)]}`;
    
            // 随机小贴士
            const tips = [
                "提示：定期更新酒单可以保持新鲜感哦！",
                "提示：注意吧台卫生，保持良好的工作环境～",
                "提示：可以让调酒师研发新饮品，增添选择多样性！",
                "提示：优质的调酒工具能让调酒师发挥更好的水平！"
            ];
            hireMessage += `\n\n💡 ${tips[Math.floor(Math.random() * tips.length)]}`;
    
            e.reply(hireMessage);
        } else {
            e.reply(`雇佣${randomLevel}需要${hireCost}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Hire_chef(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 厨师系统
        const chefSystem = {
            // 厨师等级
            levels: {
                "初级厨师": {
                    salary: 1200,
                    skills: ["基础烹饪"],
                    experience: 0,
                    performance: 0.8,
                    description: "刚入行的厨师,擅长制作简单小食"
                },
                "中级厨师": {
                    salary: 2000,
                    skills: ["基础烹饪", "特色小吃"],
                    experience: 100,
                    performance: 1.0,
                    description: "有经验的厨师,能制作多样化菜品"
                },
                "高级厨师": {
                    salary: 3000,
                    skills: ["基础烹饪", "特色小吃", "创意料理"],
                    experience: 300,
                    performance: 1.2,
                    description: "资深厨师,擅长创新菜品"
                },
                "特级厨师": {
                    salary: 5000,
                    skills: ["基础烹饪", "特色小吃", "创意料理", "主题宴会"],
                    experience: 500,
                    performance: 1.5,
                    description: "顶级厨师,能打造美食盛宴"
                }
            },
    
            // 厨师特长
            specialties: {
                "中式烹饪": {
                    effect: "中式菜品品质提升25%",
                    bonus: 0.25
                },
                "西式料理": {
                    effect: "西式菜品品质提升20%",
                    bonus: 0.2
                },
                "甜点制作": {
                    effect: "甜点品质提升30%",
                    bonus: 0.3
                },
                "创意摆盘": {
                    effect: "菜品颜值提升22%",
                    bonus: 0.22
                }
            },
    
            // 擅长菜系
            cuisines: {
                "粤式": {
                    popularity: 1.3,
                    targetAudience: "商务人士",
                    description: "精致的粤式美食"
                },
                "川式": {
                    popularity: 1.2,
                    targetAudience: "年轻群体",
                    description: "麻辣鲜香的川菜"
                },
                "创意小食": {
                    popularity: 1.4,
                    targetAudience: "休闲客人",
                    description: "新颖的创意小食"
                }
            },
    
            // 特色菜单
            specialMenu: {
                "下酒小菜": {
                    items: ["麻辣花生", "卤味拼盘", "炸物拼盘"],
                    price: "中等",
                    popularity: "高"
                },
                "精致主食": {
                    items: ["海鲜炒饭", "担担面", "意大利面"],
                    price: "中高",
                    popularity: "中"
                },
                "特色甜点": {
                    items: ["提拉米苏", "抹茶慕斯", "水果拼盘"],
                    price: "高",
                    popularity: "高"
                }
            },
    
            // 厨师状态
            conditions: {
                "精力充沛": {
                    performance: 1.2,
                    duration: "6小时",
                    description: "状态极佳，适合大量制作"
                },
                "略感疲惫": {
                    performance: 0.8,
                    duration: "3小时",
                    description: "需要适当休息"
                },
                "创作灵感涌现": {
                    performance: 1.3,
                    duration: "4小时",
                    description: "适合尝试新菜品"
                }
            }
        };
    
        if (userData.KTV.staff.chef) {
            // 显示当前厨师信息
            const currentChef = userData.KTV.chefInfo || {
                level: "初级厨师",
                experience: 0,
                specialties: [],
                cuisine: "创意小食",
                specialMenu: [],
                condition: "精力充沛",
                performance: 80,
                satisfaction: 100,
                workDays: 0,
                createdDishes: 0
            };
    
            let chefStatus = `👨‍🍳 当前厨师信息：\n`;
            chefStatus += `等级：${currentChef.level}\n`;
            chefStatus += `经验：${currentChef.experience}\n`;
            chefStatus += `特长：${currentChef.specialties.join('、') || '无'}\n`;
            chefStatus += `擅长菜系：${currentChef.cuisine}\n`;
            chefStatus += `特色菜品：${currentChef.specialMenu.join('、') || '暂无'}\n`;
            chefStatus += `当前状态：${currentChef.condition}\n`;
            chefStatus += `表现评分：${currentChef.performance}分\n`;
            chefStatus += `满意度：${currentChef.satisfaction}%\n`;
            chefStatus += `工作天数：${currentChef.workDays}天\n`;
            chefStatus += `创作菜品：${currentChef.createdDishes}道\n`;
    
            // 显示升级进度
            const nextLevel = this.getNextChefLevel(currentChef.level);
            if (nextLevel) {
                const requiredExp = chefSystem.levels[nextLevel].experience;
                const currentExp = currentChef.experience;
                chefStatus += `\n📈 距离升级还需：${requiredExp - currentExp}经验\n`;
            }
    
            // 状态建议
            if (currentChef.satisfaction < 80) {
                chefStatus += `\n💡 提示：厨师的满意度较低，建议改善工作环境或提供更好的设备`;
            }
            if (currentChef.condition === "略感疲惫") {
                chefStatus += `\n💡 提示：厨师较为疲惫，建议安排休息`;
            }
            if (currentChef.condition === "创作灵感涌现") {
                chefStatus += `\n💡 提示：厨师正在创作状态，可以尝试开发新菜品`;
            }
    
            e.reply(chefStatus);
            return;
        }
    
        // 雇佣新厨师
        const randomLevel = this.getRandomChefLevel(chefSystem.levels);
        const hireCost = chefSystem.levels[randomLevel].salary;
    
        if (userData.money >= hireCost) {
            // 随机生成特长和菜系
            const randomSpecialties = this.generateRandomChefSpecialties(chefSystem.specialties);
            const randomCuisine = this.getRandomCuisine(chefSystem.cuisines);
            const randomMenu = this.getRandomSpecialMenu(chefSystem.specialMenu);
            const randomCondition = this.getRandomChefCondition(chefSystem.conditions);
    
            // 初始化厨师数据
            userData.KTV.chefInfo = {
                level: randomLevel,
                experience: chefSystem.levels[randomLevel].experience,
                specialties: randomSpecialties,
                cuisine: randomCuisine,
                specialMenu: randomMenu,
                condition: randomCondition,
                performance: 80,
                satisfaction: 100,
                workDays: 0,
                createdDishes: Math.floor(Math.random() * 20),
                lastPayday: Date.now()
            };
    
            userData.KTV.staff.chef = true;
            userData.money -= hireCost;
    
            // 生成雇佣结果消息
            let hireMessage = `👨‍🍳 厨师雇佣成功！\n`;
            hireMessage += `等级：${randomLevel}\n`;
            hireMessage += `月薪：${hireCost}元\n`;
            hireMessage += `擅长菜系：${randomCuisine}\n`;
            hireMessage += `当前状态：${randomCondition}\n\n`;
    
            hireMessage += `✨ 特长：\n`;
            for (const specialty of randomSpecialties) {
                hireMessage += `- ${specialty}：${chefSystem.specialties[specialty].effect}\n`;
            }
    
            hireMessage += `\n🍳 掌握技能：\n`;
            for (const skill of chefSystem.levels[randomLevel].skills) {
                hireMessage += `- ${skill}\n`;
            }
    
            hireMessage += `\n🍽️ 特色菜品：\n`;
            for (const dish of randomMenu) {
                hireMessage += `- ${dish}\n`;
            }
    
            // 随机欢迎语
            const welcomes = [
                "这位厨师的厨艺真是一流呢！",
                "期待能尝到他的拿手好菜～",
                "看起来是位很有经验的厨师呢！",
                "相信他能为顾客带来美味的享受！"
            ];
            hireMessage += `\n💭 ${welcomes[Math.floor(Math.random() * welcomes.length)]}`;
    
            // 随机小贴士
            const tips = [
                "提示：定期更新菜单可以保持新鲜感哦！",
                "提示：注意厨房卫生，保持良好的工作环境～",
                "提示：可以让厨师研发新菜品，增添菜单多样性！",
                "提示：优质的厨具能让厨师发挥更好的水平！"
            ];
            hireMessage += `\n\n💡 ${tips[Math.floor(Math.random() * tips.length)]}`;
    
            e.reply(hireMessage);
        } else {
            e.reply(`雇佣${randomLevel}需要${hireCost}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Hire_singer(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 歌手系统
        const singerSystem = {
            // 歌手等级
            levels: {
                "新人歌手": {
                    salary: 1000,
                    skills: ["基础演唱"],
                    experience: 0,
                    performance: 0.8,
                    description: "刚入行的歌手,声音甜美但需要磨练"
                },
                "进阶歌手": {
                    salary: 1500,
                    skills: ["基础演唱", "即兴演唱"],
                    experience: 100,
                    performance: 1.0,
                    description: "有经验的歌手,能带动气氛"
                },
                "专业歌手": {
                    salary: 2500,
                    skills: ["基础演唱", "即兴演唱", "和声演唱"],
                    experience: 300,
                    performance: 1.2,
                    description: "专业的歌手,演唱技巧出众"
                },
                "金牌歌手": {
                    salary: 4000,
                    skills: ["基础演唱", "即兴演唱", "和声演唱", "舞台表演"],
                    experience: 500,
                    performance: 1.5,
                    description: "顶级歌手,能带来精彩的视听盛宴"
                }
            },
    
            // 歌手特长
            specialties: {
                "高音": {
                    effect: "高音部分更有张力",
                    bonus: 0.25
                },
                "低音": {
                    effect: "低音部分更有磁性",
                    bonus: 0.2
                },
                "情感表达": {
                    effect: "演唱更具感染力",
                    bonus: 0.3
                },
                "舞台魅力": {
                    effect: "表演更有感染力",
                    bonus: 0.22
                }
            },
    
            // 擅长曲风
            genres: {
                "流行": {
                    popularity: 1.3,
                    targetAudience: "大众群体",
                    description: "流行音乐驻唱"
                },
                "民谣": {
                    popularity: 1.1,
                    targetAudience: "文艺青年",
                    description: "温柔的民谣演唱"
                },
                "摇滚": {
                    popularity: 1.2,
                    targetAudience: "年轻群体",
                    description: "富有激情的摇滚演唱"
                }
            },
    
            // 歌手形象
            appearance: {
                "清新邻家": {
                    charm: 1.2,
                    style: "甜美",
                    description: "给人温暖亲切的感觉"
                },
                "成熟知性": {
                    charm: 1.3,
                    style: "优雅",
                    description: "散发成熟魅力"
                },
                "个性潮流": {
                    charm: 1.25,
                    style: "时尚",
                    description: "充满个性的潮流形象"
                }
            },
    
            // 歌手状态效果
            conditions: {
                "精神饱满": {
                    performance: 1.2,
                    duration: "4小时",
                    description: "状态极佳，适合长时间演出"
                },
                "略感疲惫": {
                    performance: 0.8,
                    duration: "2小时",
                    description: "需要适当休息"
                },
                "声音状态佳": {
                    performance: 1.1,
                    duration: "3小时",
                    description: "声音状态很好"
                }
            }
        };
    
        if (userData.KTV.staff.singer) {
            // 显示当前歌手信息
            const currentSinger = userData.KTV.singerInfo || {
                level: "新人歌手",
                experience: 0,
                specialties: [],
                genre: "流行",
                appearance: "清新邻家",
                performance: 80,
                condition: "精神饱满",
                satisfaction: 100,
                workDays: 0,
                fanBase: 0
            };
    
            let singerStatus = `🎤 当前歌手信息：\n`;
            singerStatus += `等级：${currentSinger.level}\n`;
            singerStatus += `经验：${currentSinger.experience}\n`;
            singerStatus += `特长：${currentSinger.specialties.join('、') || '无'}\n`;
            singerStatus += `擅长曲风：${currentSinger.genre}\n`;
            singerStatus += `形象风格：${currentSinger.appearance}\n`;
            singerStatus += `当前状态：${currentSinger.condition}\n`;
            singerStatus += `表现评分：${currentSinger.performance}分\n`;
            singerStatus += `满意度：${currentSinger.satisfaction}%\n`;
            singerStatus += `工作天数：${currentSinger.workDays}天\n`;
            singerStatus += `粉丝数量：${currentSinger.fanBase}人\n`;
    
            // 显示升级进度
            const nextLevel = this.getNextSingerLevel(currentSinger.level);
            if (nextLevel) {
                const requiredExp = singerSystem.levels[nextLevel].experience;
                const currentExp = currentSinger.experience;
                singerStatus += `\n📈 距离升级还需：${requiredExp - currentExp}经验\n`;
            }
    
            // 状态建议
            if (currentSinger.satisfaction < 80) {
                singerStatus += `\n💡 提示：歌手的满意度较低，建议适当提高待遇或改善工作环境`;
            }
            if (currentSinger.condition === "略感疲惫") {
                singerStatus += `\n💡 提示：歌手较为疲惫，建议安排休息`;
            }
    
            e.reply(singerStatus);
            return;
        }
    
        // 雇佣新歌手
        const randomLevel = this.getRandomSingerLevel(singerSystem.levels);
        const hireCost = singerSystem.levels[randomLevel].salary;
    
        if (userData.money >= hireCost) {
            // 随机生成特长和风格
            const randomSpecialties = this.generateRandomSingerSpecialties(singerSystem.specialties);
            const randomGenre = this.getRandomMusicGenre(singerSystem.genres);
            const randomAppearance = this.getRandomSingerAppearance(singerSystem.appearance);
            const randomCondition = this.getRandomSingerCondition(singerSystem.conditions);
    
            // 初始化歌手数据
            userData.KTV.singerInfo = {
                level: randomLevel,
                experience: singerSystem.levels[randomLevel].experience,
                specialties: randomSpecialties,
                genre: randomGenre,
                appearance: randomAppearance,
                condition: randomCondition,
                performance: 80,
                satisfaction: 100,
                workDays: 0,
                fanBase: Math.floor(Math.random() * 100),
                lastPayday: Date.now()
            };
    
            userData.KTV.staff.singer = true;
            userData.money -= hireCost;
    
            // 生成雇佣结果消息
            let hireMessage = `🎤 歌手雇佣成功！\n`;
            hireMessage += `等级：${randomLevel}\n`;
            hireMessage += `月薪：${hireCost}元\n`;
            hireMessage += `形象：${randomAppearance}\n`;
            hireMessage += `擅长曲风：${randomGenre}\n`;
            hireMessage += `当前状态：${randomCondition}\n\n`;
    
            hireMessage += `✨ 特长：\n`;
            for (const specialty of randomSpecialties) {
                hireMessage += `- ${specialty}：${singerSystem.specialties[specialty].effect}\n`;
            }
    
            hireMessage += `\n🎵 掌握技能：\n`;
            for (const skill of singerSystem.levels[randomLevel].skills) {
                hireMessage += `- ${skill}\n`;
            }
    
            // 随机欢迎语
            const welcomes = [
                "这位歌手的声音真是太棒了！",
                "她的演唱一定能让KTV更加精彩！",
                "看起来是个很有实力的歌手呢～",
                "相信她能为顾客带来美妙的歌声！"
            ];
            hireMessage += `\n💭 ${welcomes[Math.floor(Math.random() * welcomes.length)]}`;
    
            // 随机小贴士
            const tips = [
                "提示：定期给歌手更新曲库可以提升演出效果哦！",
                "提示：注意关注歌手的嗓子状态，适时安排休息～",
                "提示：可以让歌手尝试不同风格的歌曲，增添演出多样性！",
                "提示：良好的后勤保障能让歌手更好地发挥！"
            ];
            hireMessage += `\n\n💡 ${tips[Math.floor(Math.random() * tips.length)]}`;
    
            e.reply(hireMessage);
        } else {
            e.reply(`雇佣${randomLevel}需要${hireCost}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Hire_dancer(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 舞者系统
        const dancerSystem = {
            // 舞者等级
            levels: {
                "新人舞者": {
                    salary: 800,
                    skills: ["基础舞蹈"],
                    experience: 0,
                    performance: 0.8,
                    description: "刚入行的舞者,充满活力但需要历练"
                },
                "进阶舞者": {
                    salary: 1200,
                    skills: ["基础舞蹈", "现代舞"],
                    experience: 100,
                    performance: 1.0,
                    description: "有一定经验的舞者,舞姿优美"
                },
                "专业舞者": {
                    salary: 2000,
                    skills: ["基础舞蹈", "现代舞", "爵士舞"],
                    experience: 300,
                    performance: 1.2,
                    description: "经验丰富的舞者,表现力强"
                },
                "金牌舞者": {
                    salary: 3000,
                    skills: ["基础舞蹈", "现代舞", "爵士舞", "编舞"],
                    experience: 500,
                    performance: 1.5,
                    description: "顶级舞者,能带来精彩的表演"
                }
            },
    
            // 舞者特长
            specialties: {
                "柔韧性": {
                    effect: "舞蹈动作更加优美",
                    bonus: 0.25
                },
                "表现力": {
                    effect: "表演更具感染力",
                    bonus: 0.2
                },
                "即兴创作": {
                    effect: "能随音乐即兴舞蹈",
                    bonus: 0.3
                },
                "群舞领舞": {
                    effect: "擅长带领群舞",
                    bonus: 0.22
                }
            },
    
            // 舞蹈风格
            styles: {
                "韩式舞蹈": {
                    popularity: 1.3,
                    targetAudience: "年轻群体",
                    description: "充满活力的韩式舞蹈"
                },
                "现代芭蕾": {
                    popularity: 1.2,
                    targetAudience: "艺术爱好者",
                    description: "优雅的现代芭蕾"
                },
                "街舞": {
                    popularity: 1.1,
                    targetAudience: "潮流人群",
                    description: "富有动感的街舞"
                }
            },
    
            // 舞者外貌
            appearance: {
                "清纯可爱": {
                    charm: 1.2,
                    style: "甜美",
                    description: "给人温暖阳光的感觉"
                },
                "性感妩媚": {
                    charm: 1.3,
                    style: "性感",
                    description: "散发成熟魅力"
                },
                "高贵优雅": {
                    charm: 1.25,
                    style: "优雅",
                    description: "举手投足间尽显优雅"
                }
            }
        };
    
        if (userData.KTV.staff.dancer) {
            // 显示当前舞者信息
            const currentDancer = userData.KTV.dancerInfo || {
                level: "新人舞者",
                experience: 0,
                specialties: [],
                style: "韩式舞蹈",
                appearance: "清纯可爱",
                performance: 80,
                satisfaction: 100,
                workDays: 0
            };
    
            let dancerStatus = `💃 当前舞者信息：\n`;
            dancerStatus += `等级：${currentDancer.level}\n`;
            dancerStatus += `经验：${currentDancer.experience}\n`;
            dancerStatus += `特长：${currentDancer.specialties.join('、') || '无'}\n`;
            dancerStatus += `擅长风格：${currentDancer.style}\n`;
            dancerStatus += `形象风格：${currentDancer.appearance}\n`;
            dancerStatus += `表现评分：${currentDancer.performance}分\n`;
            dancerStatus += `满意度：${currentDancer.satisfaction}%\n`;
            dancerStatus += `工作天数：${currentDancer.workDays}天\n`;
    
            // 显示升级进度
            const nextLevel = this.getNextDancerLevel(currentDancer.level);
            if (nextLevel) {
                const requiredExp = dancerSystem.levels[nextLevel].experience;
                const currentExp = currentDancer.experience;
                dancerStatus += `\n📈 距离升级还需：${requiredExp - currentExp}经验\n`;
            }
    
            e.reply(dancerStatus);
            return;
        }
    
        // 雇佣新舞者
        const randomLevel = this.getRandomDancerLevel(dancerSystem.levels);
        const hireCost = dancerSystem.levels[randomLevel].salary;
    
        if (userData.money >= hireCost) {
            // 随机生成特长和风格
            const randomSpecialties = this.generateRandomDancerSpecialties(dancerSystem.specialties);
            const randomStyle = this.getRandomDanceStyle(dancerSystem.styles);
            const randomAppearance = this.getRandomDancerAppearance(dancerSystem.appearance);
    
            // 初始化舞者数据
            userData.KTV.dancerInfo = {
                level: randomLevel,
                experience: dancerSystem.levels[randomLevel].experience,
                specialties: randomSpecialties,
                style: randomStyle,
                appearance: randomAppearance,
                performance: 80,
                satisfaction: 100,
                workDays: 0,
                lastPayday: Date.now()
            };
    
            userData.KTV.staff.dancer = true;
            userData.money -= hireCost;
    
            // 生成雇佣结果消息
            let hireMessage = `💃 舞者雇佣成功！\n`;
            hireMessage += `等级：${randomLevel}\n`;
            hireMessage += `月薪：${hireCost}元\n`;
            hireMessage += `形象：${randomAppearance}\n`;
            hireMessage += `擅长风格：${randomStyle}\n\n`;
    
            hireMessage += `✨ 特长：\n`;
            for (const specialty of randomSpecialties) {
                hireMessage += `- ${specialty}：${dancerSystem.specialties[specialty].effect}\n`;
            }
    
            hireMessage += `\n💫 掌握技能：\n`;
            for (const skill of dancerSystem.levels[randomLevel].skills) {
                hireMessage += `- ${skill}\n`;
            }
    
            // 随机欢迎语
            const welcomes = [
                "这位舞者的舞姿真是太优美了！",
                "她的表演一定能让KTV更加精彩！",
                "看起来是个很有天赋的舞者呢～",
                "相信她能为顾客带来精彩的表演！"
            ];
            hireMessage += `\n💭 ${welcomes[Math.floor(Math.random() * welcomes.length)]}`;
    
            // 随机小贴士
            const tips = [
                "提示：定期给舞者更新服装可以提升表演效果哦！",
                "提示：注意关注舞者的满意度，保持良好的工作环境～",
                "提示：可以让舞者尝试不同风格的表演，增添节目多样性！",
                "提示：舞者也需要适当休息，别忘了给她们放假哦！"
            ];
            hireMessage += `\n\n💡 ${tips[Math.floor(Math.random() * tips.length)]}`;
    
            e.reply(hireMessage);
        } else {
            e.reply(`雇佣${randomLevel}需要${hireCost}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    async Buy_speaker(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;

        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }

        const upgradeCost = 1500; // 示例价格
        if (userData.money >= upgradeCost) {
            userData.KTV.equipment.speaker += 1;
            userData.money -= upgradeCost;
            e.reply(`你成功购买了音响设备，花费了${upgradeCost}元。`);
        } else {
            e.reply("你的钱不够，无法购买音响设备。");
        }

        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Buy_light(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 灯光系统
        const lightSystem = {
            // 灯光设备类型
            types: {
                "LED舞台灯": {
                    price: 1200,
                    effects: {
                        brightness: 15,
                        atmosphere: 10,
                        energy: 12
                    },
                    features: ["多彩变换", "节奏同步"],
                    description: "炫彩的LED灯光，能随音乐节奏变化"
                },
                "激光灯": {
                    price: 1500,
                    effects: {
                        brightness: 18,
                        atmosphere: 15,
                        special: 20
                    },
                    features: ["图案投影", "立体效果"],
                    description: "专业的激光投影设备，创造梦幻效果"
                },
                "智能追光灯": {
                    price: 2000,
                    effects: {
                        brightness: 20,
                        atmosphere: 18,
                        focus: 25
                    },
                    features: ["自动追踪", "智能调节"],
                    description: "高端智能追光系统，突出表演重点"
                }
            },
    
            // 灯光效果
            effects: {
                "炫彩模式": {
                    bonus: 0.15,
                    description: "绚丽的色彩变换效果"
                },
                "律动模式": {
                    bonus: 0.2,
                    description: "随音乐节奏闪烁的动感效果"
                },
                "梦幻模式": {
                    bonus: 0.18,
                    description: "柔和渐变的梦幻氛围"
                }
            },
    
            // 场景预设
            scenes: {
                "派对狂欢": {
                    popularity: 1.2,
                    targetMood: "热闹"
                },
                "浪漫氛围": {
                    popularity: 1.1,
                    targetMood: "温馨"
                },
                "舞台聚焦": {
                    popularity: 1.0,
                    targetMood: "专注"
                }
            }
        };
    
        // 显示灯光设备目录
        if (!e.msg.includes('购买')) {
            let catalogMessage = "💡 灯光设备目录 💡\n\n";
            
            for (const [type, info] of Object.entries(lightSystem.types)) {
                catalogMessage += `【${type}】\n`;
                catalogMessage += `价格：${info.price}元\n`;
                catalogMessage += `描述：${info.description}\n`;
                catalogMessage += `特性：${info.features.join('、')}\n`;
                catalogMessage += `效果：\n`;
                for (const [effect, value] of Object.entries(info.effects)) {
                    catalogMessage += `- ${effect}: +${value}\n`;
                }
                catalogMessage += `————————\n`;
            }
    
            e.reply(catalogMessage);
            return;
        }
    
        const lightType = e.msg.replace('#购买灯光设备', '').trim();
        const selectedLight = lightSystem.types[lightType];
    
        if (!selectedLight) {
            e.reply("未找到该灯光设备，请检查名称是否正确。");
            return;
        }
    
        if (userData.money >= selectedLight.price) {
            // 随机获得特殊效果
            const randomEffect = this.getRandomLightEffect(lightSystem.effects);
            
            // 更新数据
            userData.KTV.equipment.light += 1;
            userData.money -= selectedLight.price;
    
            // 计算综合提升效果
            let totalEffect = 0;
            for (const value of Object.values(selectedLight.effects)) {
                totalEffect += value;
            }
            if (randomEffect) {
                totalEffect *= (1 + lightSystem.effects[randomEffect].bonus);
            }
    
            // 生成购买消息
            let buyMessage = `✨ 购买成功！\n`;
            buyMessage += `设备：${lightType}\n`;
            buyMessage += `价格：${selectedLight.price}元\n\n`;
            
            buyMessage += `🎯 设备特性：\n`;
            for (const feature of selectedLight.features) {
                buyMessage += `- ${feature}\n`;
            }
    
            buyMessage += `\n📊 效果提升：\n`;
            for (const [effect, value] of Object.entries(selectedLight.effects)) {
                buyMessage += `- ${effect}: +${value}\n`;
            }
    
            if (randomEffect) {
                buyMessage += `\n🎁 额外获得效果：${randomEffect}\n`;
                buyMessage += `描述：${lightSystem.effects[randomEffect].description}\n`;
                buyMessage += `提升：${(lightSystem.effects[randomEffect].bonus * 100).toFixed(0)}%\n`;
            }
    
            // 随机反馈
            const feedback = [
                "灯光效果太棒了，整个房间都亮起来了！",
                "顾客们都说新的灯光很有氛围呢～",
                "这个灯光效果真是太适合表演了！",
                "整个KTV的格调都提升了不少！"
            ];
            buyMessage += `\n💭 ${feedback[Math.floor(Math.random() * feedback.length)]}`;
    
            e.reply(buyMessage);
        } else {
            e.reply(`购买${lightType}需要${selectedLight.price}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    async Buy_stage_equipment(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 舞台设备系统
        const stageSystem = {
            // 舞台设备类型
            equipment: {
                "专业舞台": {
                    price: 2000,
                    size: "4x6米",
                    effects: {
                        performance: 20,
                        visibility: 15,
                        stability: 18
                    },
                    features: ["防滑设计", "模块化组装"],
                    description: "专业级表演舞台，稳固耐用"
                },
                "LED地板屏": {
                    price: 3500,
                    size: "全舞台",
                    effects: {
                        visual: 25,
                        atmosphere: 20,
                        interaction: 15
                    },
                    features: ["动态图案", "互动效果"],
                    description: "带LED显示的智能舞台地板"
                },
                "升降舞台": {
                    price: 5000,
                    size: "3x3米",
                    effects: {
                        special: 30,
                        flexibility: 25,
                        impression: 20
                    },
                    features: ["电动升降", "高度可调"],
                    description: "可升降的动态舞台系统"
                }
            },
    
            // 舞台特效
            specialEffects: {
                "烟雾效果": {
                    price: 800,
                    effect: "营造神秘氛围",
                    bonus: 0.15
                },
                "喷火效果": {
                    price: 1200,
                    effect: "制造震撼瞬间",
                    bonus: 0.25
                },
                "泡泡效果": {
                    price: 500,
                    effect: "增添梦幻气息",
                    bonus: 0.1
                }
            },
    
            // 舞台主题
            themes: {
                "星空梦幻": {
                    style: "浪漫",
                    popularity: 1.2,
                    description: "满天星光的梦幻舞台"
                },
                "未来科技": {
                    style: "现代",
                    popularity: 1.3,
                    description: "充满科技感的未来舞台"
                },
                "复古怀旧": {
                    style: "经典",
                    popularity: 1.1,
                    description: "带有年代感的复古舞台"
                }
            }
        };
    
        // 显示舞台设备目录
        if (!e.msg.includes('购买')) {
            let catalogMessage = "🎭 舞台设备目录 🎭\n\n";
            
            for (const [type, info] of Object.entries(stageSystem.equipment)) {
                catalogMessage += `【${type}】\n`;
                catalogMessage += `价格：${info.price}元\n`;
                catalogMessage += `尺寸：${info.size}\n`;
                catalogMessage += `描述：${info.description}\n`;
                catalogMessage += `特性：${info.features.join('、')}\n`;
                catalogMessage += `效果：\n`;
                for (const [effect, value] of Object.entries(info.effects)) {
                    catalogMessage += `- ${effect}: +${value}\n`;
                }
                catalogMessage += `————————\n`;
            }
    
            catalogMessage += "\n✨ 可选特效：\n";
            for (const [effect, info] of Object.entries(stageSystem.specialEffects)) {
                catalogMessage += `${effect}：${info.price}元\n`;
                catalogMessage += `效果：${info.effect}\n`;
                catalogMessage += `————————\n`;
            }
    
            e.reply(catalogMessage);
            return;
        }
    
        const stageType = e.msg.replace('#购买舞台设备', '').trim();
        const selectedStage = stageSystem.equipment[stageType];
    
        if (!selectedStage) {
            e.reply("未找到该舞台设备，请检查名称是否正确。");
            return;
        }
    
        if (userData.money >= selectedStage.price) {
            // 随机获得特效
            const randomEffect = this.getRandomStageEffect(stageSystem.specialEffects);
            
            // 随机获得主题
            const randomTheme = this.getRandomStageTheme(stageSystem.themes);
    
            // 更新数据
            userData.KTV.equipment.stage += 1;
            userData.money -= selectedStage.price;
    
            // 计算综合提升效果
            let totalEffect = 0;
            for (const value of Object.values(selectedStage.effects)) {
                totalEffect += value;
            }
            if (randomEffect) {
                totalEffect *= (1 + stageSystem.specialEffects[randomEffect].bonus);
            }
    
            // 生成购买消息
            let buyMessage = `🎭 舞台设备购买成功！\n`;
            buyMessage += `设备：${stageType}\n`;
            buyMessage += `价格：${selectedStage.price}元\n`;
            buyMessage += `尺寸：${selectedStage.size}\n\n`;
    
            buyMessage += `✨ 设备特性：\n`;
            for (const feature of selectedStage.features) {
                buyMessage += `- ${feature}\n`;
            }
    
            buyMessage += `\n📊 效果提升：\n`;
            for (const [effect, value] of Object.entries(selectedStage.effects)) {
                buyMessage += `- ${effect}: +${value}\n`;
            }
    
            if (randomEffect) {
                buyMessage += `\n🎁 赠送特效：${randomEffect}\n`;
                buyMessage += `效果：${stageSystem.specialEffects[randomEffect].effect}\n`;
                buyMessage += `提升：${(stageSystem.specialEffects[randomEffect].bonus * 100).toFixed(0)}%\n`;
            }
    
            if (randomTheme) {
                buyMessage += `\n🎨 推荐主题：${randomTheme}\n`;
                buyMessage += `风格：${stageSystem.themes[randomTheme].style}\n`;
                buyMessage += `描述：${stageSystem.themes[randomTheme].description}\n`;
            }
    
            // 随机评价
            const comments = [
                "这个舞台太棒了，表演效果一定很震撼！",
                "舞台效果很专业，观众们一定会喜欢的！",
                "整个表演空间都提升了一个档次呢！",
                "这样的舞台配置绝对能吸引更多顾客！"
            ];
            buyMessage += `\n💭 ${comments[Math.floor(Math.random() * comments.length)]}`;
    
            e.reply(buyMessage);
        } else {
            e.reply(`购买${stageType}需要${selectedStage.price}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    async Buy_DJ_equipment(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // DJ设备系统
        const DJEquipmentSystem = {
            // 主控设备
            mainEquipment: {
                "专业打碟机": {
                    price: 3000,
                    effects: {
                        mixing: 20,
                        control: 15,
                        quality: 18
                    },
                    features: ["双碟播放", "效果器控制"],
                    description: "专业级DJ打碟设备，音质出众"
                },
                "数字控制台": {
                    price: 4500,
                    effects: {
                        digital: 25,
                        flexibility: 20,
                        precision: 22
                    },
                    features: ["多轨控制", "数字效果"],
                    description: "全数字化DJ控制系统"
                },
                "混音工作站": {
                    price: 6000,
                    effects: {
                        professional: 30,
                        versatility: 25,
                        creativity: 28
                    },
                    features: ["专业混音", "实时效果"],
                    description: "顶级DJ工作站，功能全面"
                }
            },
    
            // 辅助设备
            accessories: {
                "监听耳机": {
                    price: 800,
                    effect: "精确监听音轨",
                    bonus: 0.15
                },
                "效果器": {
                    price: 1200,
                    effect: "添加专业音效",
                    bonus: 0.2
                },
                "采样器": {
                    price: 1500,
                    effect: "自定义音效制作",
                    bonus: 0.25
                }
            },
    
            // 音效包
            soundPacks: {
                "电音包": {
                    style: "电子舞曲",
                    popularity: 1.3,
                    effects: ["Bass提升", "节奏打击"]
                },
                "流行包": {
                    style: "流行音乐",
                    popularity: 1.2,
                    effects: ["人声增强", "旋律优化"]
                },
                "嘻哈包": {
                    style: "说唱音乐",
                    popularity: 1.1,
                    effects: ["节奏重音", "Beat加强"]
                }
            }
        };
    
        // 显示设备目录
        if (!e.msg.includes('购买')) {
            let catalogMessage = "🎛️ DJ设备目录 🎛️\n\n";
            
            for (const [type, info] of Object.entries(DJEquipmentSystem.mainEquipment)) {
                catalogMessage += `【${type}】\n`;
                catalogMessage += `价格：${info.price}元\n`;
                catalogMessage += `描述：${info.description}\n`;
                catalogMessage += `特性：${info.features.join('、')}\n`;
                catalogMessage += `效果：\n`;
                for (const [effect, value] of Object.entries(info.effects)) {
                    catalogMessage += `- ${effect}: +${value}\n`;
                }
                catalogMessage += `————————\n`;
            }
    
            catalogMessage += "\n🎧 辅助设备：\n";
            for (const [acc, info] of Object.entries(DJEquipmentSystem.accessories)) {
                catalogMessage += `${acc}：${info.price}元\n`;
                catalogMessage += `效果：${info.effect}\n`;
                catalogMessage += `————————\n`;
            }
    
            e.reply(catalogMessage);
            return;
        }
    
        const equipmentType = e.msg.replace('#购买DJ设备', '').trim();
        const selectedEquipment = DJEquipmentSystem.mainEquipment[equipmentType];
    
        if (!selectedEquipment) {
            e.reply("未找到该DJ设备，请检查名称是否正确。");
            return;
        }
    
        if (userData.money >= selectedEquipment.price) {
            // 随机获得辅助设备
            const randomAccessory = this.getRandomDJAccessory(DJEquipmentSystem.accessories);
            
            // 随机获得音效包
            const randomSoundPack = this.getRandomSoundPack(DJEquipmentSystem.soundPacks);
    
            // 更新数据
            userData.KTV.equipment.DJ += 1;
            userData.money -= selectedEquipment.price;
    
            // 计算综合提升效果
            let totalEffect = 0;
            for (const value of Object.values(selectedEquipment.effects)) {
                totalEffect += value;
            }
            if (randomAccessory) {
                totalEffect *= (1 + DJEquipmentSystem.accessories[randomAccessory].bonus);
            }
    
            // 生成购买消息
            let buyMessage = `🎛️ DJ设备购买成功！\n`;
            buyMessage += `设备：${equipmentType}\n`;
            buyMessage += `价格：${selectedEquipment.price}元\n\n`;
    
            buyMessage += `✨ 设备特性：\n`;
            for (const feature of selectedEquipment.features) {
                buyMessage += `- ${feature}\n`;
            }
    
            buyMessage += `\n📊 效果提升：\n`;
            for (const [effect, value] of Object.entries(selectedEquipment.effects)) {
                buyMessage += `- ${effect}: +${value}\n`;
            }
    
            if (randomAccessory) {
                buyMessage += `\n🎁 赠送配件：${randomAccessory}\n`;
                buyMessage += `效果：${DJEquipmentSystem.accessories[randomAccessory].effect}\n`;
                buyMessage += `提升：${(DJEquipmentSystem.accessories[randomAccessory].bonus * 100).toFixed(0)}%\n`;
            }
    
            if (randomSoundPack) {
                buyMessage += `\n🎵 赠送音效包：${randomSoundPack}\n`;
                buyMessage += `风格：${DJEquipmentSystem.soundPacks[randomSoundPack].style}\n`;
                buyMessage += `效果：${DJEquipmentSystem.soundPacks[randomSoundPack].effects.join('、')}\n`;
            }
    
            // 随机评价
            const comments = [
                "这套设备的音质真是太棒了！",
                "专业的DJ设备就是不一样呢～",
                "现在可以制作更多炫酷的音效了！",
                "设备升级后，整个氛围都不一样了！"
            ];
            buyMessage += `\n💭 ${comments[Math.floor(Math.random() * comments.length)]}`;
    
            e.reply(buyMessage);
        } else {
            e.reply(`购买${equipmentType}需要${selectedEquipment.price}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    async Buy_bartender_equipment(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 调酒设备系统
        const bartenderSystem = {
            // 主要设备
            mainEquipment: {
                "专业调酒台": {
                    price: 3000,
                    effects: {
                        efficiency: 20,
                        presentation: 15,
                        variety: 18
                    },
                    features: ["工作台", "酒品展示", "制冰系统"],
                    description: "专业的调酒工作站，美观实用"
                },
                "智能酒柜": {
                    price: 4500,
                    effects: {
                        storage: 25,
                        preservation: 20,
                        display: 22
                    },
                    features: ["温度控制", "湿度调节", "LED展示"],
                    description: "智能化酒品储存展示系统"
                },
                "高端调酒套装": {
                    price: 6000,
                    effects: {
                        quality: 30,
                        precision: 25,
                        style: 28
                    },
                    features: ["全套工具", "特制器具", "展示道具"],
                    description: "顶级调酒设备，尽显专业"
                }
            },
    
            // 特色工具
            tools: {
                "分子调酒套件": {
                    price: 1200,
                    effect: "制作创意鸡尾酒",
                    bonus: 0.2
                },
                "火焰调酒工具": {
                    price: 800,
                    effect: "制作视觉特效",
                    bonus: 0.15
                },
                "花式调酒器具": {
                    price: 1000,
                    effect: "表演花式调酒",
                    bonus: 0.18
                }
            },
    
            // 酒品配方
            recipes: {
                "经典系列": {
                    style: "传统经典",
                    popularity: 1.2,
                    drinks: ["莫吉托", "玛格丽特", "长岛冰茶"]
                },
                "创意系列": {
                    style: "独特创新",
                    popularity: 1.3,
                    drinks: ["蓝色珊瑚", "彩虹极光", "星空梦境"]
                },
                "特调系列": {
                    style: "店铺特色",
                    popularity: 1.4,
                    drinks: ["KTV之夜", "歌者之魂", "舞动心情"]
                }
            }
        };
    
        // 显示设备目录
        if (!e.msg.includes('购买')) {
            let catalogMessage = "🍸 调酒设备目录 🍸\n\n";
            
            for (const [type, info] of Object.entries(bartenderSystem.mainEquipment)) {
                catalogMessage += `【${type}】\n`;
                catalogMessage += `价格：${info.price}元\n`;
                catalogMessage += `描述：${info.description}\n`;
                catalogMessage += `特性：${info.features.join('、')}\n`;
                catalogMessage += `效果：\n`;
                for (const [effect, value] of Object.entries(info.effects)) {
                    catalogMessage += `- ${effect}: +${value}\n`;
                }
                catalogMessage += `————————\n`;
            }
    
            catalogMessage += "\n🔧 特色工具：\n";
            for (const [tool, info] of Object.entries(bartenderSystem.tools)) {
                catalogMessage += `${tool}：${info.price}元\n`;
                catalogMessage += `效果：${info.effect}\n`;
                catalogMessage += `————————\n`;
            }
    
            e.reply(catalogMessage);
            return;
        }
    
        const equipmentType = e.msg.replace('#购买调酒设备', '').trim();
        const selectedEquipment = bartenderSystem.mainEquipment[equipmentType];
    
        if (!selectedEquipment) {
            e.reply("未找到该调酒设备，请检查名称是否正确。");
            return;
        }
    
        if (userData.money >= selectedEquipment.price) {
            // 随机获得特色工具
            const randomTool = this.getRandomBartenderTool(bartenderSystem.tools);
            
            // 随机获得配方系列
            const randomRecipe = this.getRandomRecipeSet(bartenderSystem.recipes);
    
            // 更新数据
            userData.KTV.equipment.bartender += 1;
            userData.money -= selectedEquipment.price;
    
            // 计算综合提升效果
            let totalEffect = 0;
            for (const value of Object.values(selectedEquipment.effects)) {
                totalEffect += value;
            }
            if (randomTool) {
                totalEffect *= (1 + bartenderSystem.tools[randomTool].bonus);
            }
    
            // 生成购买消息
            let buyMessage = `🍸 调酒设备购买成功！\n`;
            buyMessage += `设备：${equipmentType}\n`;
            buyMessage += `价格：${selectedEquipment.price}元\n\n`;
    
            buyMessage += `✨ 设备特性：\n`;
            for (const feature of selectedEquipment.features) {
                buyMessage += `- ${feature}\n`;
            }
    
            buyMessage += `\n📊 效果提升：\n`;
            for (const [effect, value] of Object.entries(selectedEquipment.effects)) {
                buyMessage += `- ${effect}: +${value}\n`;
            }
    
            if (randomTool) {
                buyMessage += `\n🎁 赠送工具：${randomTool}\n`;
                buyMessage += `效果：${bartenderSystem.tools[randomTool].effect}\n`;
                buyMessage += `提升：${(bartenderSystem.tools[randomTool].bonus * 100).toFixed(0)}%\n`;
            }
    
            if (randomRecipe) {
                buyMessage += `\n📖 赠送配方：${randomRecipe}\n`;
                buyMessage += `风格：${bartenderSystem.recipes[randomRecipe].style}\n`;
                buyMessage += `特色酒品：${bartenderSystem.recipes[randomRecipe].drinks.join('、')}\n`;
            }
    
            // 随机评价
            const comments = [
                "这套设备太专业了，调制出的酒一定很棒！",
                "有了这些设备，可以制作更多特色鸡尾酒了！",
                "顾客们一定会喜欢这里的特调酒品的！",
                "调酒台看起来特别高端，很有格调！"
            ];
            buyMessage += `\n💭 ${comments[Math.floor(Math.random() * comments.length)]}`;
    
            e.reply(buyMessage);
        } else {
            e.reply(`购买${equipmentType}需要${selectedEquipment.price}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    async Buy_chef_equipment(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 厨房设备系统
        const kitchenSystem = {
            // 主要设备
            mainEquipment: {
                "商用厨房台": {
                    price: 5000,
                    effects: {
                        efficiency: 25,
                        capacity: 20,
                        hygiene: 18
                    },
                    features: ["工作台", "储物空间", "消毒系统"],
                    description: "专业的商用厨房工作站，卫生高效"
                },
                "智能烹饪系统": {
                    price: 8000,
                    effects: {
                        quality: 30,
                        speed: 25,
                        consistency: 22
                    },
                    features: ["温度控制", "定时系统", "智能提醒"],
                    description: "智能化烹饪设备，保证出品质量"
                },
                "豪华厨具套装": {
                    price: 12000,
                    effects: {
                        versatility: 35,
                        precision: 28,
                        presentation: 30
                    },
                    features: ["全套厨具", "特制器皿", "摆盘工具"],
                    description: "高端厨房设备，提供完整解决方案"
                }
            },
    
            // 特色工具
            specialTools: {
                "分子料理工具": {
                    price: 2000,
                    effect: "制作创意美食",
                    bonus: 0.25
                },
                "日式料理套件": {
                    price: 1500,
                    effect: "制作精致小食",
                    bonus: 0.2
                },
                "西式烘焙工具": {
                    price: 1800,
                    effect: "制作特色甜点",
                    bonus: 0.22
                }
            },
    
            // 菜品配方
            recipes: {
                "精致小食": {
                    style: "休闲简餐",
                    popularity: 1.3,
                    dishes: ["黄金炸物", "迷你披萨", "特制三明治"]
                },
                "特色主食": {
                    style: "正餐料理",
                    popularity: 1.4,
                    dishes: ["招牌炒饭", "特制面食", "烤肉拼盘"]
                },
                "甜点系列": {
                    style: "精致甜品",
                    popularity: 1.5,
                    dishes: ["提拉米苏", "水果慕斯", "巧克力熔岩"]
                }
            },
    
            // 厨房主题
            themes: {
                "现代简约": {
                    style: "简洁大方",
                    bonus: 0.15,
                    description: "时尚清爽的设计风格"
                },
                "工业风格": {
                    style: "专业厨房",
                    bonus: 0.2,
                    description: "专业感十足的设计"
                },
                "复古风情": {
                    style: "怀旧温馨",
                    bonus: 0.18,
                    description: "温馨舒适的氛围"
                }
            }
        };
    
        // 显示设备目录
        if (!e.msg.includes('购买')) {
            let catalogMessage = "👨‍🍳 厨房设备目录 👨‍🍳\n\n";
            
            for (const [type, info] of Object.entries(kitchenSystem.mainEquipment)) {
                catalogMessage += `【${type}】\n`;
                catalogMessage += `价格：${info.price}元\n`;
                catalogMessage += `描述：${info.description}\n`;
                catalogMessage += `特性：${info.features.join('、')}\n`;
                catalogMessage += `效果：\n`;
                for (const [effect, value] of Object.entries(info.effects)) {
                    catalogMessage += `- ${effect}: +${value}\n`;
                }
                catalogMessage += `————————\n`;
            }
    
            catalogMessage += "\n🔧 特色工具：\n";
            for (const [tool, info] of Object.entries(kitchenSystem.specialTools)) {
                catalogMessage += `${tool}：${info.price}元\n`;
                catalogMessage += `效果：${info.effect}\n`;
                catalogMessage += `————————\n`;
            }
    
            e.reply(catalogMessage);
            return;
        }
    
        const equipmentType = e.msg.replace('#购买厨师设备', '').trim();
        const selectedEquipment = kitchenSystem.mainEquipment[equipmentType];
    
        if (!selectedEquipment) {
            e.reply("未找到该厨房设备，请检查名称是否正确。");
            return;
        }
    
        if (userData.money >= selectedEquipment.price) {
            // 随机获得特色工具
            const randomTool = this.getRandomKitchenTool(kitchenSystem.specialTools);
            
            // 随机获得配方系列
            const randomRecipe = this.getRandomRecipeSet(kitchenSystem.recipes);
            
            // 随机获得主题
            const randomTheme = this.getRandomKitchenTheme(kitchenSystem.themes);
    
            // 更新数据
            userData.KTV.equipment.chef += 1;
            userData.money -= selectedEquipment.price;
    
            // 生成购买消息
            let buyMessage = `👨‍🍳 厨房设备购买成功！\n`;
            buyMessage += `设备：${equipmentType}\n`;
            buyMessage += `价格：${selectedEquipment.price}元\n\n`;
    
            buyMessage += `✨ 设备特性：\n`;
            for (const feature of selectedEquipment.features) {
                buyMessage += `- ${feature}\n`;
            }
    
            if (randomTool) {
                buyMessage += `\n🎁 赠送工具：${randomTool}\n`;
                buyMessage += `效果：${kitchenSystem.specialTools[randomTool].effect}\n`;
            }
    
            if (randomRecipe) {
                buyMessage += `\n📖 赠送配方：${randomRecipe}\n`;
                buyMessage += `特色菜品：${kitchenSystem.recipes[randomRecipe].dishes.join('、')}\n`;
            }
    
            if (randomTheme) {
                buyMessage += `\n🎨 推荐主题：${randomTheme}\n`;
                buyMessage += `风格：${kitchenSystem.themes[randomTheme].style}\n`;
            }
    
            // 随机评价
            const comments = [
                "这套设备太专业了，可以制作更多美味料理！",
                "厨房设备升级后，出品质量一定会更好！",
                "顾客们一定会喜欢这里的美食的！",
                "设备很齐全，可以尝试更多新菜品了！"
            ];
            buyMessage += `\n💭 ${comments[Math.floor(Math.random() * comments.length)]}`;
    
            e.reply(buyMessage);
        } else {
            e.reply(`购买${equipmentType}需要${selectedEquipment.price}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    async Buy_singer_clothes(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 歌手服装系统
        const clothingSystem = {
            // 服装类型
            categories: {
                "舞台礼服": {
                    styles: {
                        "星光闪耀": {
                            price: 2000,
                            effects: {
                                charm: 20,
                                stage: 15,
                                elegance: 18
                            },
                            features: ["亮片装饰", "轻盈面料"],
                            description: "闪耀的舞台礼服，让人眼前一亮"
                        },
                        "优雅长裙": {
                            price: 2500,
                            effects: {
                                charm: 25,
                                elegance: 20,
                                grace: 15
                            },
                            features: ["拖地长裙", "高贵面料"],
                            description: "典雅的长裙设计，展现高贵气质"
                        }
                    }
                },
                "演出套装": {
                    styles: {
                        "潮流时尚": {
                            price: 1800,
                            effects: {
                                charm: 18,
                                modern: 20,
                                style: 15
                            },
                            features: ["个性设计", "舒适面料"],
                            description: "时尚的演出套装，展现个性魅力"
                        },
                        "动感舞台": {
                            price: 2200,
                            effects: {
                                charm: 22,
                                energy: 18,
                                performance: 16
                            },
                            features: ["易活动", "炫酷设计"],
                            description: "动感十足的舞台装，适合活力表演"
                        }
                    }
                }
            },
    
            // 服装配饰
            accessories: {
                "闪亮头饰": {
                    price: 500,
                    effect: "增添璀璨光彩",
                    bonus: 0.15
                },
                "精美腰带": {
                    price: 300,
                    effect: "突出腰线美感",
                    bonus: 0.12
                },
                "舞台手套": {
                    price: 200,
                    effect: "增添表演效果",
                    bonus: 0.1
                }
            },
    
            // 特殊效果
            specialEffects: {
                "变色面料": {
                    effect: "随灯光改变颜色",
                    bonus: 0.2
                },
                "荧光元素": {
                    effect: "在暗处发光",
                    bonus: 0.18
                },
                "可拆卸设计": {
                    effect: "一衣多穿",
                    bonus: 0.15
                }
            }
        };
    
        // 显示服装目录
        if (!e.msg.includes('购买')) {
            let catalogMessage = "👗 歌手服装目录 👗\n\n";
            
            for (const [category, info] of Object.entries(clothingSystem.categories)) {
                catalogMessage += `【${category}】\n`;
                for (const [style, details] of Object.entries(info.styles)) {
                    catalogMessage += `${style}：${details.price}元\n`;
                    catalogMessage += `描述：${details.description}\n`;
                    catalogMessage += `特点：${details.features.join('、')}\n`;
                    catalogMessage += `效果：\n`;
                    for (const [effect, value] of Object.entries(details.effects)) {
                        catalogMessage += `- ${effect}: +${value}\n`;
                    }
                    catalogMessage += `————————\n`;
                }
            }
    
            catalogMessage += "\n💝 配饰系列：\n";
            for (const [acc, info] of Object.entries(clothingSystem.accessories)) {
                catalogMessage += `${acc}：${info.price}元\n`;
                catalogMessage += `效果：${info.effect}\n`;
                catalogMessage += `————————\n`;
            }
    
            e.reply(catalogMessage);
            return;
        }
    
        const clothingName = e.msg.replace('#购买歌手服装', '').trim();
        let selectedClothing = null;
        let selectedStyle = null;
    
        // 查找选择的服装
        for (const category of Object.values(clothingSystem.categories)) {
            for (const [style, info] of Object.entries(category.styles)) {
                if (style === clothingName) {
                    selectedClothing = info;
                    selectedStyle = style;
                    break;
                }
            }
            if (selectedClothing) break;
        }
    
        if (!selectedClothing) {
            e.reply("未找到该服装，请检查名称是否正确。");
            return;
        }
    
        if (userData.money >= selectedClothing.price) {
            // 随机获得配饰
            const randomAccessory = this.getRandomAccessory(clothingSystem.accessories);
            
            // 随机获得特殊效果
            const randomEffect = this.getRandomClothingEffect(clothingSystem.specialEffects);
    
            // 更新数据
            userData.KTV.clothes.singer = selectedStyle;
            userData.money -= selectedClothing.price;
    
            // 生成购买消息
            let buyMessage = `👗 服装购买成功！\n`;
            buyMessage += `款式：${selectedStyle}\n`;
            buyMessage += `价格：${selectedClothing.price}元\n\n`;
    
            buyMessage += `✨ 服装特点：\n`;
            for (const feature of selectedClothing.features) {
                buyMessage += `- ${feature}\n`;
            }
    
            buyMessage += `\n📊 效果加成：\n`;
            for (const [effect, value] of Object.entries(selectedClothing.effects)) {
                buyMessage += `- ${effect}: +${value}\n`;
            }
    
            if (randomAccessory) {
                buyMessage += `\n🎁 赠送配饰：${randomAccessory}\n`;
                buyMessage += `效果：${clothingSystem.accessories[randomAccessory].effect}\n`;
            }
    
            if (randomEffect) {
                buyMessage += `\n✨ 特殊效果：${randomEffect}\n`;
                buyMessage += `效果：${clothingSystem.specialEffects[randomEffect].effect}\n`;
            }
    
            // 随机评价
            const comments = [
                "这件服装太适合舞台表演了！",
                "穿上这件衣服一定很亮眼！",
                "这个设计真的很独特呢！",
                "绝对能成为全场焦点！"
            ];
            buyMessage += `\n💭 ${comments[Math.floor(Math.random() * comments.length)]}`;
    
            e.reply(buyMessage);
        } else {
            e.reply(`购买${selectedStyle}需要${selectedClothing.price}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    async Buy_dancer_clothes(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // 舞者服装系统
        const dancerClothingSystem = {
            // 服装类型
            categories: {
                "演出服装": {
                    styles: {
                        "星光闪耀": {
                            price: 2500,
                            effects: {
                                charm: 25,
                                performance: 20,
                                stage: 18
                            },
                            features: ["亮片装饰", "轻盈面料", "舒适剪裁"],
                            description: "闪耀的舞台装，让人眼前一亮"
                        },
                        "优雅芭蕾": {
                            price: 3000,
                            effects: {
                                elegance: 30,
                                grace: 25,
                                beauty: 20
                            },
                            features: ["蓬蓬裙", "网纱设计", "轻薄面料"],
                            description: "典雅的芭蕾风格，展现优美曲线"
                        },
                        "动感街舞": {
                            price: 2000,
                            effects: {
                                energy: 28,
                                style: 22,
                                freedom: 25
                            },
                            features: ["潮流设计", "弹力面料", "个性印花"],
                            description: "充满活力的街舞风格，展现青春活力"
                        }
                    }
                },
                "练习服装": {
                    styles: {
                        "基础练习服": {
                            price: 1000,
                            effects: {
                                comfort: 20,
                                durability: 15,
                                flexibility: 18
                            },
                            features: ["透气面料", "弹力设计", "耐磨耐洗"],
                            description: "舒适的练习服，适合日常训练"
                        },
                        "专业练功服": {
                            price: 1500,
                            effects: {
                                performance: 22,
                                comfort: 20,
                                professional: 15
                            },
                            features: ["专业剪裁", "速干面料", "贴身设计"],
                            description: "专业的练功服，提升训练效果"
                        }
                    }
                }
            },
    
            // 服装配饰
            accessories: {
                "头饰": {
                    "璀璨皇冠": {
                        price: 800,
                        effect: "增添高贵气质",
                        bonus: 0.15
                    },
                    "羽毛发饰": {
                        price: 500,
                        effect: "增添优雅气息",
                        bonus: 0.12
                    }
                },
                "手套": {
                    "蕾丝手套": {
                        price: 300,
                        effect: "增添古典美感",
                        bonus: 0.1
                    },
                    "亮片手套": {
                        price: 400,
                        effect: "增添闪耀效果",
                        bonus: 0.12
                    }
                },
                "鞋子": {
                    "芭蕾舞鞋": {
                        price: 600,
                        effect: "提升舞蹈优雅度",
                        bonus: 0.15
                    },
                    "现代舞鞋": {
                        price: 500,
                        effect: "提升舞蹈灵活性",
                        bonus: 0.12
                    }
                }
            },
    
            // 特殊效果
            specialEffects: {
                "变色面料": {
                    effect: "随灯光改变颜色",
                    bonus: 0.2
                },
                "闪光元素": {
                    effect: "增添舞台效果",
                    bonus: 0.18
                },
                "轻纱飘逸": {
                    effect: "增添舞蹈韵律",
                    bonus: 0.15
                }
            },
    
            // 服装套装
            sets: {
                "梦幻精灵": {
                    items: ["星光闪耀", "璀璨皇冠", "芭蕾舞鞋"],
                    bonus: 0.25,
                    description: "犹如精灵般梦幻的舞台造型"
                },
                "街舞女王": {
                    items: ["动感街舞", "现代舞鞋", "亮片手套"],
                    bonus: 0.2,
                    description: "充满活力的街舞风格搭配"
                }
            }
        };
    
        // 显示服装目录
        if (!e.msg.includes('购买')) {
            let catalogMessage = "👗 舞者服装目录 👗\n\n";
            
            // 展示演出服装
            catalogMessage += "【演出服装】\n";
            for (const [style, info] of Object.entries(dancerClothingSystem.categories["演出服装"].styles)) {
                catalogMessage += `${style}：${info.price}元\n`;
                catalogMessage += `描述：${info.description}\n`;
                catalogMessage += `特点：${info.features.join('、')}\n`;
                catalogMessage += `效果：\n`;
                for (const [effect, value] of Object.entries(info.effects)) {
                    catalogMessage += `- ${effect}: +${value}\n`;
                }
                catalogMessage += `————————\n`;
            }
    
            // 展示练习服装
            catalogMessage += "\n【练习服装】\n";
            for (const [style, info] of Object.entries(dancerClothingSystem.categories["练习服装"].styles)) {
                catalogMessage += `${style}：${info.price}元\n`;
                catalogMessage += `描述：${info.description}\n`;
                catalogMessage += `特点：${info.features.join('、')}\n`;
                catalogMessage += `效果：\n`;
                for (const [effect, value] of Object.entries(info.effects)) {
                    catalogMessage += `- ${effect}: +${value}\n`;
                }
                catalogMessage += `————————\n`;
            }
    
            // 展示配饰
            catalogMessage += "\n💝 配饰系列：\n";
            for (const [type, items] of Object.entries(dancerClothingSystem.accessories)) {
                catalogMessage += `【${type}】\n`;
                for (const [name, info] of Object.entries(items)) {
                    catalogMessage += `${name}：${info.price}元\n`;
                    catalogMessage += `效果：${info.effect}\n`;
                    catalogMessage += `————————\n`;
                }
            }
    
            // 展示套装
            catalogMessage += "\n✨ 推荐套装：\n";
            for (const [set, info] of Object.entries(dancerClothingSystem.sets)) {
                catalogMessage += `【${set}】\n`;
                catalogMessage += `包含：${info.items.join('、')}\n`;
                catalogMessage += `描述：${info.description}\n`;
                catalogMessage += `套装加成：${info.bonus * 100}%\n`;
                catalogMessage += `————————\n`;
            }
    
            e.reply(catalogMessage);
            return;
        }
    
        // 购买逻辑
        const clothingName = e.msg.replace('#购买舞者服装', '').trim();
        let selectedClothing = null;
        let selectedCategory = null;
    
        // 查找选择的服装
        for (const [category, info] of Object.entries(dancerClothingSystem.categories)) {
            for (const [style, details] of Object.entries(info.styles)) {
                if (style === clothingName) {
                    selectedClothing = details;
                    selectedCategory = category;
                    break;
                }
            }
            if (selectedClothing) break;
        }
    
        if (!selectedClothing) {
            e.reply("未找到该服装，请检查名称是否正确。");
            return;
        }
    
        if (userData.money >= selectedClothing.price) {
            // 随机获得配饰
            const randomAccessory = this.getRandomDancerAccessory(dancerClothingSystem.accessories);
            // 随机获得特殊效果
            const randomEffect = this.getRandomClothingEffect(dancerClothingSystem.specialEffects);
    
            // 更新数据
            userData.KTV.clothes.dancer = clothingName;
            userData.money -= selectedClothing.price;
    
            // 生成购买消息
            let buyMessage = `👗 舞者服装购买成功！\n`;
            buyMessage += `服装：${clothingName}\n`;
            buyMessage += `类型：${selectedCategory}\n`;
            buyMessage += `价格：${selectedClothing.price}元\n\n`;
    
            buyMessage += `✨ 服装特点：\n`;
            for (const feature of selectedClothing.features) {
                buyMessage += `- ${feature}\n`;
            }
    
            buyMessage += `\n📊 效果加成：\n`;
            for (const [effect, value] of Object.entries(selectedClothing.effects)) {
                buyMessage += `- ${effect}: +${value}\n`;
            }
    
            if (randomAccessory) {
                buyMessage += `\n🎁 赠送配饰：${randomAccessory}\n`;
                const accessoryInfo = this.findAccessoryInfo(dancerClothingSystem.accessories, randomAccessory);
                if (accessoryInfo) {
                    buyMessage += `效果：${accessoryInfo.effect}\n`;
                }
            }
    
            if (randomEffect) {
                buyMessage += `\n✨ 特殊效果：${randomEffect}\n`;
                buyMessage += `效果：${dancerClothingSystem.specialEffects[randomEffect].effect}\n`;
            }
    
            // 搭配建议
            const matchingSets = this.findMatchingSets(clothingName, dancerClothingSystem.sets);
            if (matchingSets.length > 0) {
                buyMessage += `\n💡 搭配建议：\n`;
                buyMessage += `此服装可以搭配以下套装：\n`;
                for (const set of matchingSets) {
                    buyMessage += `- ${set}\n`;
                }
            }
    
            // 随机评价
            const comments = [
                "这件服装太适合舞台表演了！",
                "穿上这件衣服一定很吸引眼球！",
                "这个设计真的很独特呢！",
                "舞者穿上一定很漂亮！"
            ];
            buyMessage += `\n💭 ${comments[Math.floor(Math.random() * comments.length)]}`;
    
            // 保养建议
            const tips = [
                "提示：记得定期清洗保养，延长服装使用寿命～",
                "提示：建议购买备用服装，以备不时之需！",
                "提示：可以搭配不同配饰，创造多种风格！",
                "提示：注意存放环境，避免受潮或变形哦！"
            ];
            buyMessage += `\n\n💡 ${tips[Math.floor(Math.random() * tips.length)]}`;
    
            e.reply(buyMessage);
        } else {
            e.reply(`购买${clothingName}需要${selectedClothing.price}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async Upgrade_KTV_level(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            await this.initializeKTV(userId, userData);
        }
    
        // KTV等级系统
        const ktvLevelSystem = {
            maxLevel: 10,
            levels: {
                1: {
                    name: "小型KTV",
                    cost: 5000,
                    capacity: 50,
                    roomTypes: ["小包间", "中包间"],
                    benefits: {
                        income: 1.0,
                        reputation: 1.0
                    }
                },
                2: {
                    name: "标准KTV",
                    cost: 10000,
                    capacity: 100,
                    roomTypes: ["小包间", "中包间", "大包间"],
                    benefits: {
                        income: 1.2,
                        reputation: 1.1
                    }
                },
                3: {
                    name: "豪华KTV",
                    cost: 20000,
                    capacity: 200,
                    roomTypes: ["小包间", "中包间", "大包间", "豪华包间"],
                    benefits: {
                        income: 1.5,
                        reputation: 1.3
                    }
                },
                4: {
                    name: "精品KTV",
                    cost: 35000,
                    capacity: 300,
                    roomTypes: ["小包间", "中包间", "大包间", "豪华包间", "主题包间"],
                    benefits: {
                        income: 1.8,
                        reputation: 1.5
                    }
                },
                5: {
                    name: "顶级KTV",
                    cost: 50000,
                    capacity: 500,
                    roomTypes: ["小包间", "中包间", "大包间", "豪华包间", "主题包间", "VIP包间"],
                    benefits: {
                        income: 2.0,
                        reputation: 2.0
                    }
                }
            },
    
            // 升级特权
            privileges: {
                "高端会员制": {
                    effect: "解锁VIP会员系统",
                    bonus: 0.2
                },
                "品牌效应": {
                    effect: "提升知名度和口碑",
                    bonus: 0.15
                },
                "活动策划": {
                    effect: "可举办特色主题活动",
                    bonus: 0.18
                },
                "商务合作": {
                    effect: "开启企业合作渠道",
                    bonus: 0.25
                }
            }
        };
    
        const currentLevel = userData.KTV.level;
        if (currentLevel >= ktvLevelSystem.maxLevel) {
            e.reply("你的KTV已经达到最高等级啦！");
            return;
        }
    
        const nextLevel = currentLevel + 1;
        const upgradeInfo = ktvLevelSystem.levels[nextLevel];
        const upgradeCost = upgradeInfo.cost;
    
        // 检查升级条件
        const requirementsMet = this.checkUpgradeRequirements(userData.KTV, nextLevel);
        if (!requirementsMet.met) {
            e.reply(`升级失败：${requirementsMet.reason}`);
            return;
        }
    
        if (userData.money >= upgradeCost) {
            // 随机获得特权
            const randomPrivilege = this.getRandomPrivilege(ktvLevelSystem.privileges);
            
            // 更新数据
            userData.KTV.level = nextLevel;
            userData.money -= upgradeCost;
            
            // 计算升级后的综合提升
            const totalBonus = upgradeInfo.benefits.income + 
                              (randomPrivilege ? ktvLevelSystem.privileges[randomPrivilege].bonus : 0);
    
            // 生成升级消息
            let upgradeMessage = `🎉 KTV升级成功！\n`;
            upgradeMessage += `当前等级：${upgradeInfo.name}\n`;
            upgradeMessage += `容纳人数：${upgradeInfo.capacity}人\n`;
            upgradeMessage += `包间类型：${upgradeInfo.roomTypes.join('、')}\n`;
            upgradeMessage += `花费：${upgradeCost}元\n\n`;
    
            // 效果说明
            upgradeMessage += `✨ 升级效果：\n`;
            upgradeMessage += `- 收入提升：${((upgradeInfo.benefits.income - 1) * 100).toFixed(0)}%\n`;
            upgradeMessage += `- 声誉提升：${((upgradeInfo.benefits.reputation - 1) * 100).toFixed(0)}%\n`;
    
            // 特权说明
            if (randomPrivilege) {
                upgradeMessage += `\n🎁 获得特权：${randomPrivilege}\n`;
                upgradeMessage += `效果：${ktvLevelSystem.privileges[randomPrivilege].effect}\n`;
                upgradeMessage += `额外收益：${(ktvLevelSystem.privileges[randomPrivilege].bonus * 100).toFixed(0)}%\n`;
            }
    
            // 随机庆祝语
            const celebrations = [
                "装修一新的KTV看起来更气派了！",
                "顾客们都说环境变得更好了呢～",
                "这下可以接待更多客人啦！",
                "整个KTV的档次都提升了不少！"
            ];
            upgradeMessage += `\n💭 ${celebrations[Math.floor(Math.random() * celebrations.length)]}`;
    
            // 经营建议
            if (nextLevel < ktvLevelSystem.maxLevel) {
                upgradeMessage += `\n\n💡 经营建议：\n`;
                upgradeMessage += `- 可以考虑增加特色活动吸引客人\n`;
                upgradeMessage += `- 注意维护设备保持良好体验\n`;
                upgradeMessage += `- 适时推出会员优惠提高忠诚度`;
            }
    
            e.reply(upgradeMessage);
        } else {
            e.reply(`升级到${upgradeInfo.name}需要${upgradeCost}元，你的资金不足。`);
        }
    
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }
    
    async Show_KTV_status(e) {
        const userId = e.user_id;
        const userData = await this.getUserDataWithCheck(e);
        if (!userData) return;
        if (!userData.KTV) {
            e.reply("你还没有自己的KTV，无法查看信息！");
            return;
        }
    
        // KTV状态分析系统
        const statusAnalysis = {
            // 经营状况评级
            getBusinessRating(ktv) {
                const factors = {
                    income: ktv.income * 0.4,
                    reputation: ktv.reputation * 0.3,
                    cleanliness: ktv.cleanliness * 0.2,
                    equipment: this.calculateEquipmentScore(ktv.equipment) * 0.1
                };
                
                const totalScore = Object.values(factors).reduce((a, b) => a + b, 0);
                
                if (totalScore >= 90) return "S";
                if (totalScore >= 80) return "A";
                if (totalScore >= 70) return "B";
                if (totalScore >= 60) return "C";
                return "D";
            },
    
            // 设备评分计算
            calculateEquipmentScore(equipment) {
                const weights = {
                    speaker: 0.3,
                    light: 0.2,
                    stage: 0.3,
                    DJ: 0.2
                };
                
                let score = 0;
                for (const [type, level] of Object.entries(equipment)) {
                    score += level * weights[type];
                }
                return score * 10;
            },
    
            // 员工管理评估
            evaluateStaffManagement(staff) {
                let staffScore = 0;
                const staffWeights = {
                    waiter: 15,
                    DJ: 20,
                    bartender: 15,
                    chef: 15,
                    singer: 20,
                    dancer: 15
                };
    
                for (const [role, hired] of Object.entries(staff)) {
                    if (hired && staffWeights[role]) {
                        staffScore += staffWeights[role];
                    }
                }
                return staffScore;
            },
    
            // 环境氛围评估
            evaluateAtmosphere(ktv) {
                const factors = {
                    sound_quality: ktv.sound_quality * 0.3,
                    stage_effect: ktv.stage_effect * 0.2,
                    speaker_effect: ktv.speaker_effect * 0.3,
                    light_effect: ktv.light_effect * 0.2
                };
                
                return Object.values(factors).reduce((a, b) => a + b, 0) * 10;
            }
        };
    
        // 生成详细报告
        const businessRating = statusAnalysis.getBusinessRating(userData.KTV);
        const equipmentScore = statusAnalysis.calculateEquipmentScore(userData.KTV.equipment);
        const staffScore = statusAnalysis.evaluateStaffManagement(userData.KTV.staff);
        const atmosphereScore = statusAnalysis.evaluateAtmosphere(userData.KTV);
    
        // 经营建议生成
        const generateAdvice = (ktv) => {
            const advice = [];
            
            if (ktv.cleanliness < 70) {
                advice.push("建议提升环境卫生，保持良好的消费体验");
            }
            if (ktv.reputation < 60) {
                advice.push("可以考虑举办特色活动提升声誉");
            }
            if (equipmentScore < 60) {
                advice.push("设备有待升级，建议适时更新设备");
            }
            if (staffScore < 50) {
                advice.push("可以考虑扩充员工团队，提升服务质量");
            }
            
            return advice;
        };
    
        const advice = generateAdvice(userData.KTV);
    
        // 生成状态报告
        let statusMessage = `📊 KTV经营状况报告 📊\n`;
        statusMessage += `\n基本信息：`;
        statusMessage += `\n店铺名称：${userData.KTV.name}`;
        statusMessage += `\n经营等级：${userData.KTV.level}级`;
        statusMessage += `\n经营评级：${businessRating}`;
        
        statusMessage += `\n\n💰 财务状况：`;
        statusMessage += `\n总收入：${userData.KTV.income}元`;
        statusMessage += `\n总支出：${userData.KTV.expenses}元`;
        statusMessage += `\n维护费用：${userData.KTV.maintenance}元`;
        statusMessage += `\n当前折扣：${userData.KTV.discount}%`;
        
        statusMessage += `\n\n🎵 设施评分：`;
        statusMessage += `\n设备综合：${equipmentScore.toFixed(1)}分`;
        statusMessage += `\n环境氛围：${atmosphereScore.toFixed(1)}分`;
        statusMessage += `\n清洁程度：${userData.KTV.cleanliness}分`;
        
        statusMessage += `\n\n👥 员工管理：`;
        statusMessage += `\n团队评分：${staffScore}分`;
        statusMessage += `\n在职员工：${Object.entries(userData.KTV.staff)
            .filter(([_, hired]) => hired)
            .map(([role]) => role)
            .join('、')}`;
        
        statusMessage += `\n\n🎪 娱乐资源：`;
        statusMessage += `\n歌曲数量：${userData.KTV.songs.length}首`;
        statusMessage += `\n装饰数量：${userData.KTV.decorations.length}个`;
        
        if (advice.length > 0) {
            statusMessage += `\n\n💡 经营建议：`;
            advice.forEach((item, index) => {
                statusMessage += `\n${index + 1}. ${item}`;
            });
        }
    
        // 随机鼓励语
        const encouragements = [
            "继续加油，你的KTV一定会越来越好的！",
            "经营有道，生意兴隆！",
            "用心经营，顾客自然会感受到！",
            "相信你能把KTV经营得更好！"
        ];
        statusMessage += `\n\n${encouragements[Math.floor(Math.random() * encouragements.length)]}`;
    
        e.reply(statusMessage);
    }

    async initializeKTV(userId, userData) {
        // 初始化KTV数据
        userData.KTV = {
            name: `KTV${this.generateConversionCode()}`,
            level: 1,
            cleanliness: 100,
            reputation: 50,
            violations: 0,
            income: 0,
            expenses: 0,
            maintenance: 0,
            discount: 0,
            songs: [],
            decorations: [],
            sound_quality: 1,
            stage_effect: 1,
            speaker_effect: 1,
            light_effect: 1,
            staff: {
                manager: true,
                waiter: false,
                DJ: false,
                bartender: false,
                chef: false,
                singer: false,
                dancer: false,
            },
            equipment: {
                speaker: 1,
                light: 1,
                stage: 1,
                DJ: 1,
            },
            clothes: {
                singer: null,
                dancer: null,
            },
        };

        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
    }

    async getUserDataWithCheck(e) {
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
            return ;
        }

        return userData;
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
     
     // 获取舞者下一个等级
     getNextDancerLevel(currentLevel) {
        const levelOrder = ["新人舞者", "进阶舞者", "专业舞者", "金牌舞者"];
        const currentIndex = levelOrder.indexOf(currentLevel);
        if (currentIndex < levelOrder.length - 1) {
            return levelOrder[currentIndex + 1];
        }
        return null;
    }
    
    // 随机获取舞者等级
    getRandomDancerLevel(levels) {
        const levelNames = Object.keys(levels);
        const weights = [0.4, 0.3, 0.2, 0.1]; // 各等级出现概率
        const random = Math.random();
        let sum = 0;
        for (let i = 0; i < weights.length; i++) {
            sum += weights[i];
            if (random <= sum) {
                return levelNames[i];
            }
        }
        return levelNames[0];
    }
    
    // 随机生成舞者特长
    generateRandomDancerSpecialties(specialties) {
        const specialtyNames = Object.keys(specialties);
        const selectedSpecialties = [];
        const specialtyCount = Math.floor(Math.random() * 2) + 1; // 随机1-2个特长
        while (selectedSpecialties.length < specialtyCount && specialtyNames.length > 0) {
            const randomIndex = Math.floor(Math.random() * specialtyNames.length);
            const selectedSpecialty = specialtyNames.splice(randomIndex, 1)[0];
            selectedSpecialties.push(selectedSpecialty);
        }
        return selectedSpecialties;
    }
    
    // 获取随机舞蹈风格
    getRandomDanceStyle(styles) {
        const styleNames = Object.keys(styles);
        return styleNames[Math.floor(Math.random() * styleNames.length)];
    }
    
    // 获取随机舞者形象
    getRandomDancerAppearance(appearances) {
        const appearanceNames = Object.keys(appearances);
        return appearanceNames[Math.floor(Math.random() * appearanceNames.length)];
    }

    // 随机获取音质增强
    getRandomSoundEnhancement(enhancements) {
        if (Math.random() < 0.3) {
            const enhancementNames = Object.keys(enhancements);
            return enhancementNames[Math.floor(Math.random() * enhancementNames.length)];
        }
        return null;
    }
    
    // 随机获取音频模式
    getRandomAudioMode(modes) {
        if (Math.random() < 0.4) {
            const modeNames = Object.keys(modes);
            return modeNames[Math.floor(Math.random() * modeNames.length)];
        }
        return null;
    }
    
    // 随机获取音频预设
    getRandomAudioPreset(presets) {
        if (Math.random() < 0.35) {
            const presetNames = Object.keys(presets);
            return presetNames[Math.floor(Math.random() * presetNames.length)];
        }
        return null;
    }

    // 获取服务员下一个等级
    getNextWaiterLevel(currentLevel) {
        const levelOrder = ["实习生", "普通服务员", "资深服务员", "金牌服务员"];
        const currentIndex = levelOrder.indexOf(currentLevel);
        if (currentIndex < levelOrder.length - 1) {
            return levelOrder[currentIndex + 1];
        }
        return null;
    }
    
    // 随机生成服务员特质
    generateRandomTraits(traitPool) {
        const traitNames = Object.keys(traitPool);
        const selectedTraits = [];
        const traitCount = Math.floor(Math.random() * 2) + 1; // 随机1-2个特质
    
        while (selectedTraits.length < traitCount && traitNames.length > 0) {
            const randomIndex = Math.floor(Math.random() * traitNames.length);
            const selectedTrait = traitNames.splice(randomIndex, 1)[0];
            selectedTraits.push(selectedTrait);
        }
    
        return selectedTraits;
    }
     // 装饰搭配推荐系统
     getRecommendedCombos(newDecoration, existingDecorations) {
        const decorationCombos = {
            "浪漫星空壁画": ["LED星光球", "水晶吊灯"],
            "复古唱片墙": ["绿萝盆栽", "日式盆景"],
            "水晶吊灯": ["浪漫星空壁画", "日式盆景"],
            "LED星光球": ["浪漫星空壁画"],
            "绿萝盆栽": ["复古唱片墙", "日式盆景"],
            "日式盆景": ["水晶吊灯", "复古唱片墙"]
        };
    
        const recommendations = [];
        if (decorationCombos[newDecoration]) {
            for (const combo of decorationCombos[newDecoration]) {
                if (!existingDecorations.includes(combo)) {
                    recommendations.push(combo);
                }
            }
        }
    
        return recommendations;
    }
     // 随机获取音效特性
     getRandomSoundFeature(features) {
        const featureNames = Object.keys(features);
        if (Math.random() < 0.3) { // 30%概率获得特性
            return featureNames[Math.floor(Math.random() * featureNames.length)];
        }
        return null;
    }
     // 检查升级条件
     checkUpgradeRequirements(ktv, targetLevel) {
        const minReputation = 50 * targetLevel;
        const minSongs = 10 * targetLevel;
        
        if (ktv.reputation < minReputation) {
            return {
                met: false,
                reason: `需要至少${minReputation}点声誉才能升级`
            };
        }
        
        if (ktv.songs.length < minSongs) {
            return {
                met: false,
                reason: `需要至少${minSongs}首歌曲才能升级`
            };
        }
    
        return { met: true };
    }
    
    // 随机获取特权
    getRandomPrivilege(privileges) {
        if (Math.random() < 0.4) { // 40%概率获得特权
            const privilegeNames = Object.keys(privileges);
            return privilegeNames[Math.floor(Math.random() * privilegeNames.length)];
        }
        return null;
    }
 // 随机获取歌曲特性
 getRandomSongFeature(features) {
    if (Math.random() < 0.3) { // 30%概率获得特性
        const featureNames = Object.keys(features);
        return featureNames[Math.floor(Math.random() * featureNames.length)];
    }
    return null;
}
// 获取随机DJ等级
getRandomDJLevel(levels) {
    const levelNames = Object.keys(levels);
    const weights = [0.4, 0.3, 0.2, 0.1]; // 各等级出现概率
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
        sum += weights[i];
        if (random <= sum) {
            return levelNames[i];
        }
    }
    return levelNames[0];
}

// 随机生成特长
generateRandomSpecialties(specialties) {
    const specialtyNames = Object.keys(specialties);
    const selectedSpecialties = [];
    const specialtyCount = Math.floor(Math.random() * 2) + 1; // 随机1-2个特长

    while (selectedSpecialties.length < specialtyCount && specialtyNames.length > 0) {
        const randomIndex = Math.floor(Math.random() * specialtyNames.length);
        const selectedSpecialty = specialtyNames.splice(randomIndex, 1)[0];
        selectedSpecialties.push(selectedSpecialty);
    }

    return selectedSpecialties;
}

// 获取随机音乐风格
getRandomStyle(styles) {
    const styleNames = Object.keys(styles);
    return styleNames[Math.floor(Math.random() * styleNames.length)];
}

// 获取DJ下一个等级
getNextDJLevel(currentLevel) {
    const levelOrder = ["新手DJ", "进阶DJ", "专业DJ", "金牌DJ"];
    const currentIndex = levelOrder.indexOf(currentLevel);
    if (currentIndex < levelOrder.length - 1) {
        return levelOrder[currentIndex + 1];
    }
    return null;
}

// 随机获取灯光效果
getRandomLightEffect(effects) {
    if (Math.random() < 0.3) { // 30%概率获得特效
        const effectNames = Object.keys(effects);
        return effectNames[Math.floor(Math.random() * effectNames.length)];
    }
    return null;
}

// 随机获取舞台特效
getRandomStageEffect(effects) {
    if (Math.random() < 0.3) { // 30%概率获得特效
        const effectNames = Object.keys(effects);
        return effectNames[Math.floor(Math.random() * effectNames.length)];
    }
    return null;
}

// 随机获取舞台主题
getRandomStageTheme(themes) {
    if (Math.random() < 0.4) { // 40%概率获得主题推荐
        const themeNames = Object.keys(themes);
        return themeNames[Math.floor(Math.random() * themeNames.length)];
    }
    return null;
}
 // 随机获取DJ配件
 getRandomDJAccessory(accessories) {
    if (Math.random() < 0.3) { // 30%概率获得配件
        const accessoryNames = Object.keys(accessories);
        return accessoryNames[Math.floor(Math.random() * accessoryNames.length)];
    }
    return null;
}

// 随机获取音效包
getRandomSoundPack(soundPacks) {
    if (Math.random() < 0.4) { // 40%概率获得音效包
        const packNames = Object.keys(soundPacks);
        return packNames[Math.floor(Math.random() * packNames.length)];
    }
    return null;
}
 // 随机获取调酒工具
 getRandomBartenderTool(tools) {
    if (Math.random() < 0.3) { // 30%概率获得工具
        const toolNames = Object.keys(tools);
        return toolNames[Math.floor(Math.random() * toolNames.length)];
    }
    return null;
}

// 随机获取配方系列
getRandomRecipeSet(recipes) {
    if (Math.random() < 0.4) { // 40%概率获得配方
        const recipeNames = Object.keys(recipes);
        return recipeNames[Math.floor(Math.random() * recipeNames.length)];
    }
    return null;
}
 // 随机获取厨房工具
 getRandomKitchenTool(tools) {
    if (Math.random() < 0.3) {
        const toolNames = Object.keys(tools);
        return toolNames[Math.floor(Math.random() * toolNames.length)];
    }
    return null;
}

// 随机获取配方系列
getRandomRecipeSet(recipes) {
    if (Math.random() < 0.4) {
        const recipeNames = Object.keys(recipes);
        return recipeNames[Math.floor(Math.random() * recipeNames.length)];
    }
    return null;
}

// 随机获取厨房主题
getRandomKitchenTheme(themes) {
    if (Math.random() < 0.35) {
        const themeNames = Object.keys(themes);
        return themeNames[Math.floor(Math.random() * themeNames.length)];
    }
    return null;
}
 // 随机获取特殊效果
 getRandomStageEffect(effects) {
    if (Math.random() < 0.3) {
        const effectNames = Object.keys(effects);
        return effectNames[Math.floor(Math.random() * effectNames.length)];
    }
    return null;
}

// 随机获取舞台主题
getRandomStageTheme(themes) {
    if (Math.random() < 0.4) {
        const themeNames = Object.keys(themes);
        return themeNames[Math.floor(Math.random() * themeNames.length)];
    }
    return null;
}
 // 随机获取音效增强
 getRandomSoundEnhancement(enhancements) {
    if (Math.random() < 0.3) {
        const enhancementNames = Object.keys(enhancements);
        return enhancementNames[Math.floor(Math.random() * enhancementNames.length)];
    }
    return null;
}

// 随机获取音响模式
getRandomSpeakerMode(modes) {
    if (Math.random() < 0.4) {
        const modeNames = Object.keys(modes);
        return modeNames[Math.floor(Math.random() * modeNames.length)];
    }
    return null;
}

    // 随机获取灯光特效
    getRandomLightEffect(effects) {
        if (Math.random() < 0.3) {
            const effectNames = Object.keys(effects);
            return effectNames[Math.floor(Math.random() * effectNames.length)];
        }
        return null;
    }
    
    // 随机获取灯光场景
    getRandomLightScene(scenes) {
        if (Math.random() < 0.4) {
            const sceneNames = Object.keys(scenes);
            return sceneNames[Math.floor(Math.random() * sceneNames.length)];
        }
        return null;
    }
    
    // 随机获取智能控制
    getRandomSmartControl(controls) {
        if (Math.random() < 0.35) {
            const controlNames = Object.keys(controls);
            return controlNames[Math.floor(Math.random() * controlNames.length)];
        }
        return null;
    }
// 随机获取配饰
getRandomAccessory(accessories) {
    if (Math.random() < 0.3) {
        const accessoryNames = Object.keys(accessories);
        return accessoryNames[Math.floor(Math.random() * accessoryNames.length)];
    }
    return null;
}

// 随机获取特殊效果
getRandomClothingEffect(effects) {
    if (Math.random() < 0.25) {
        const effectNames = Object.keys(effects);
        return effectNames[Math.floor(Math.random() * effectNames.length)];
    }
    return null;
}
}