import plugin from '../../../lib/plugins/plugin.js';
import { segment } from 'icqq';
import fs from 'fs';
import {
    saveUserData,
    checkUserData,
} from '../function/function.js';
import { checkCooldown, setCooldown } from '../function/cooldown.js';
import Redis from 'ioredis';
const redis = new Redis();
const netbarData = JSON.parse(fs.readFileSync('plugins/sims-plugin/data/netbar_data.json', 'utf8'));
export class NetbarVIP extends plugin {
    constructor() {
        super({
            name: '模拟人生-网吧VIP',
            dsc: '网吧VIP包间管理',
            event: 'message',
            priority: 600,
            rule: [
                {
                    reg: '^#开设包间.*$',
                    fnc: 'setupVipRoom'
                },
                {
                    reg: '^#包间预订.*$',
                    fnc: 'bookVipRoom'
                },
                {
                    reg: '^#包间状态$',
                    fnc: 'checkVipRoomStatus'
                },
                {
                    reg: '^#包间服务.*$',
                    fnc: 'vipRoomService'
                },
                {
                    reg: '^#包间维护.*$',
                    fnc: 'maintainVipRoom'
                },
                {
                    reg: '^#包间升级.*$',
                    fnc: 'upgradeVipRoom'
                }
            ]
        });
    }

    async setupVipRoom(e) {
        const remainingTime = checkCooldown(e.user_id, 'netbar', 'vip_setup');
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
        const params = e.msg.replace('#开设包间', '').trim().split(' ');
        if (params.length !== 1) {
            e.reply([
                "格式错误！正确格式：#开设包间 [类型]\n",
                "可选类型：\n",
                "1. 基础包间 (10000元)\n",
                "- 4台电脑，基础设施\n",
                "2. 豪华包间 (20000元)\n",
                "- 6台电脑，休息区，专属服务\n",
                "3. 至尊包间 (35000元)\n",
                "- 8台电脑，休息区，KTV设备，餐饮服务"
            ].join(''));
            return;
        }

        const roomType = params[0];
        const roomConfig = netbarData.vip_rooms.types[roomType];

        if (!roomConfig) {
            e.reply("无效的包间类型！");
            return;
        }

        // 检查等级限制
        const levelRequirement = {
            'basic': 2,
            'deluxe': 3,
            'premium': 4
        };

        if (userData.netbar.level < levelRequirement[roomType]) {
            e.reply(`网吧等级不足！开设${roomConfig.name}需要网吧等级${levelRequirement[roomType]}级。`);
            return;
        }

        // 检查包间数量限制
        const maxRooms = userData.netbar.level - 1;
        const currentRooms = userData.netbar.vipRooms ? userData.netbar.vipRooms.length : 0;
        
        if (currentRooms >= maxRooms) {
            e.reply(`当前网吧等级最多只能开设${maxRooms}个包间！`);
            return;
        }

        // 检查资金
        if (userData.money < roomConfig.price) {
            e.reply(`资金不足！开设${roomConfig.name}需要${roomConfig.price}元。`);
            return;
        }

        // 生成包间ID
        const roomId = `VIP${Date.now().toString(36).toUpperCase()}`;

        // 创建包间数据
        const newRoom = {
            id: roomId,
            type: roomType,
            name: roomConfig.name,
            status: "空闲",
            cleanliness: 100,
            maintenance: 100,
            computers: roomConfig.capacity,
            hourlyRate: roomConfig.hourly_rate,
            features: roomConfig.features,
            bookings: [],
            income: 0,
            lastMaintenance: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        // 更新数据
        userData.money -= roomConfig.price;
        userData.netbar.vipRooms = userData.netbar.vipRooms || [];
        userData.netbar.vipRooms.push(newRoom);
        userData.netbar.expenses += roomConfig.price;

        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'netbar', 'vip_setup');

        let data = {
            tplFile: './plugins/sims-plugin/resources/HTML/netbar_vip_setup.html',
            roomName: roomConfig.name,
            roomId: roomId,
            price: roomConfig.price,
            capacity: roomConfig.capacity,
            hourlyRate: roomConfig.hourly_rate,
            features: roomConfig.features,
            tips: [
                "定期维护保持设施完好",
                "保持环境整洁舒适",
                "提供优质专属服务",
                "合理定价吸引客户"
            ]
        };

        let img = await puppeteer.screenshot('netbar_vip_setup', {
            ...data,
            saveId: e.user_id
        });

        e.reply(img);
    }

    async bookVipRoom(e) {
        const remainingTime = checkCooldown(e.user_id, 'netbar', 'vip_book');
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
        const params = e.msg.replace('#包间预订', '').trim().split(' ');
        if (params.length !== 2) {
            e.reply([
                "格式错误！正确格式：#包间预订 [包间ID] [小时数]\n",
                "\n当前可用包间：\n",
                ...(userData.netbar.vipRooms || []).map(room => 
                    `${room.name} (ID: ${room.id})\n` +
                    `状态：${room.status}\n` +
                    `每小时：${room.hourlyRate}元\n`
                )
            ].join(''));
            return;
        }

        const [roomId, hours] = params;
        const hoursNum = parseInt(hours);

        if (isNaN(hoursNum) || hoursNum <= 0) {
            e.reply("预订时间必须是大于0的数字！");
            return;
        }

        // 查找包间
        const room = userData.netbar.vipRooms.find(r => r.id === roomId);
        if (!room) {
            e.reply("未找到该包间！");
            return;
        }

        if (room.status !== "空闲") {
            e.reply("该包间当前不可预订！");
            return;
        }

        // 生成预订信息
        const totalCost = room.hourlyRate * hoursNum;
        const booking = {
            id: `BOOK${Date.now().toString(36).toUpperCase()}`,
            startTime: new Date().toISOString(),
            duration: hoursNum,
            cost: totalCost,
            status: "进行中"
        };

        // 更新包间状态
        room.status = "使用中";
        room.currentBooking = booking;
        room.bookings.push(booking);
        room.income += totalCost;

        // 更新网吧数据
        userData.netbar.income += totalCost;
        userData.netbar.statistics.vip_bookings = (userData.netbar.statistics.vip_bookings || 0) + 1;
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'netbar', 'vip_book');
        let data = {
            tplFile: './plugins/sims-plugin/resources/HTML/netbar_vip_book.html',
            bookingId: booking.id,
            roomName: room.name,
            duration: hoursNum,
            totalCost: totalCost,
            startTime: new Date().toLocaleString(),
            tips: [
                "请保持包间整洁",
                "爱护包间设施",
                "如需额外服务可使用 #包间服务 命令",
                "到期前15分钟会有提醒"
            ]
        };

        let img = await puppeteer.screenshot('netbar_vip_book', {
            ...data,
            saveId: e.user_id
        });

        e.reply(img);
    }

    async checkVipRoomStatus(e) {
        const remainingTime = checkCooldown(e.user_id, 'netbar', 'vip_status');
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

        // 检查是否有包间
        if (!userData.netbar.vipRooms || userData.netbar.vipRooms.length === 0) {
            e.reply("你还没有开设任何VIP包间！");
            return;
        }
        setCooldown(e.user_id, 'netbar', 'vip_status');

        let data = {
            tplFile: './plugins/sims-plugin/resources/HTML/netbar_vip_status.html',
            rooms: userData.netbar.vipRooms.map(room => ({
                name: room.name,
                id: room.id,
                status: room.status,
                cleanliness: room.cleanliness,
                maintenance: room.maintenance,
                hourlyRate: room.hourlyRate,
                currentBooking: room.currentBooking ? {
                    id: room.currentBooking.id,
                    remainingTime: this.calculateRemainingTime(room.currentBooking)
                } : null,
                income: room.income,
                features: room.features
            })),
            tips: [
                "使用 #包间维护 [包间ID] 提升维护状态",
                "保持清洁度在80%以上最佳",
                "定期检查设施完好情况",
                "关注客户满意度反馈"
            ]
        };

        let img = await puppeteer.screenshot('netbar_vip_status', {
            ...data,
            saveId: e.user_id
        });

        e.reply(img);
    }

    async vipRoomService(e) {
        const remainingTime = checkCooldown(e.user_id, 'netbar', 'vip_service');
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
        const params = e.msg.replace('#包间服务', '').trim().split(' ');
        if (params.length !== 2) {
            e.reply([
                "格式错误！正确格式：#包间服务 [包间ID] [服务类型]\n",
                "可选服务：\n",
                "1. 清洁服务 (100元)\n",
                "2. 餐饮服务 (根据点单计费)\n",
                "3. 设备检查 (50元)\n",
                "4. 续时服务 (按小时收费)"
            ].join(''));
            return;
        }

        const [roomId, serviceType] = params;

        // 查找包间
        const room = userData.netbar.vipRooms.find(r => r.id === roomId);
        if (!room) {
            e.reply("未找到该包间！");
            return;
        }

        switch (serviceType) {
            case "清洁服务":
                if (userData.money < 100) {
                    e.reply("资金不足！清洁服务需要100元。");
                    return;
                }
                userData.money -= 100;
                room.cleanliness = 100;
                e.reply("清洁服务已完成，包间焕然一新！");
                break;

            case "餐饮服务":
                // 显示菜单
                e.reply([
                    "🍽️ 包间餐饮服务菜单\n",
                    "饮品：\n",
                    "1. 可乐 3元\n",
                    "2. 咖啡 8元\n",
                    "3. 奶茶 6元\n",
                    "食品：\n",
                    "1. 泡面 8元\n",
                    "2. 盒饭 15元\n",
                    "3. 小吃拼盘 20元\n",
                    "\n请使用 #点餐 [包间ID] [商品] [数量] 进行点单"
                ].join(''));
                break;

            case "设备检查":
                if (userData.money < 50) {
                    e.reply("资金不足！设备检查服务需要50元。");
                    return;
                }
                userData.money -= 50;
                room.maintenance = 100;
                e.reply("设备检查完成，所有设备运行正常！");
                break;

            case "续时服务":
                e.reply([
                    "续时服务说明：\n",
                    `当前包间每小时${room.hourlyRate}元\n`,
                    "请使用 #包间预订 [包间ID] [小时数] 进行续时"
                ].join(''));
                break;

            default:
                e.reply("无效的服务类型！");
                return;
        }
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'netbar', 'vip_service');
    }

    async maintainVipRoom(e) {
        const remainingTime = checkCooldown(e.user_id, 'netbar', 'vip_maintain');
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
        const params = e.msg.replace('#包间维护', '').trim().split(' ');
        if (params.length !== 1) {
            e.reply([
                "格式错误！正确格式：#包间维护 [包间ID]\n",
                "\n维护费用：\n",
                "基础包间：200元\n",
                "豪华包间：300元\n",
                "至尊包间：500元"
            ].join(''));
            return;
        }

        const roomId = params[0];

        // 查找包间
        const room = userData.netbar.vipRooms.find(r => r.id === roomId);
        if (!room) {
            e.reply("未找到该包间！");
            return;
        }

        // 计算维护费用
        const maintenanceCost = {
            'basic': 200,
            'deluxe': 300,
            'premium': 500
        }[room.type];

        // 检查资金
        if (userData.money < maintenanceCost) {
            e.reply(`资金不足！维护${room.name}需要${maintenanceCost}元。`);
            return;
        }

        // 更新数据
        userData.money -= maintenanceCost;
        room.maintenance = 100;
        room.lastMaintenance = new Date().toISOString();
        userData.netbar.expenses += maintenanceCost;
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        await saveUserData(userId, userData);
        setCooldown(e.user_id, 'netbar', 'vip_maintain');

        let data = {
            tplFile: './plugins/sims-plugin/resources/HTML/netbar_vip_maintain.html',
            roomName: room.name,
            cost: maintenanceCost,
            maintenance: room.maintenance,
            tips: [
                "定期维护延长设备寿命",
                "保持良好状态提升用户体验",
                "及时处理故障隐患",
                "记录维护时间便于管理"
            ]
        };

        let img = await puppeteer.screenshot('netbar_vip_maintain', {
            ...data,
            saveId: e.user_id
        });

        e.reply(img);
    }

    calculateRemainingTime(booking) {
        if (!booking) return 0;
        const startTime = new Date(booking.startTime);
        const endTime = new Date(startTime.getTime() + booking.duration * 60 * 60 * 1000);
        const now = new Date();
        const remainingHours = (endTime - now) / (1000 * 60 * 60);
        return Math.max(0, Math.round(remainingHours * 10) / 10);
    }
}