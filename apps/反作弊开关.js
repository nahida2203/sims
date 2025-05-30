import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import {
    loadBanList,
    saveBanList
} from '../function/function.js';
import Redis from 'ioredis';

const redis = new Redis();
const PLUGIN_PATH = path.join(path.resolve(), 'plugins', 'sims-plugin');
const BAN_LIST_FILE_PATH = path.join(PLUGIN_PATH, 'data', 'ban_list.json');

// 存储反作弊系统状态的Redis键
const ANTI_CHEAT_STATUS_KEY = 'sims:anti_cheat_status';

export class AntiCheatToggle extends plugin {
    constructor() {
        super({
            name: 'AntiCheatToggle',
            dsc: '反作弊系统开关',
            event: 'message',
            priority: 6,
            rule: [
                {
                    reg: '^#开启反作弊$',
                    fnc: 'enableAntiCheat',
                    permission: 'master'
                },
                {
                    reg: '^#关闭反作弊$',
                    fnc: 'disableAntiCheat',
                    permission: 'master'
                },
                {
                    reg: '^#反作弊状态$',
                    fnc: 'checkAntiCheatStatus'
                }
            ],
        });
        
        // 初始化时检查反作弊系统状态，如果不存在则默认为开启
        this.initAntiCheatStatus();
    }

    async initAntiCheatStatus() {
        const status = await redis.get(ANTI_CHEAT_STATUS_KEY);
        if (status === null) {
            await redis.set(ANTI_CHEAT_STATUS_KEY, 'enabled');
        }
    }

    async enableAntiCheat(e) {
        await redis.set(ANTI_CHEAT_STATUS_KEY, 'enabled');
        logger.info('[反作弊系统] 反作弊系统已开启');
        return await e.reply('反作弊系统已开启，检测到数据不一致的用户将被封禁。');
    }

    async disableAntiCheat(e) {
        // 关闭反作弊系统
        await redis.set(ANTI_CHEAT_STATUS_KEY, 'disabled');
        
        // 清空Redis中的所有封禁记录
        const banKeys = await redis.keys('ban:*');
        if (banKeys.length > 0) {
            await redis.del(...banKeys);
        }
        
        // 清空本地JSON封禁列表
        await saveBanList({});
        
        logger.info('[反作弊系统] 反作弊系统已关闭，所有封禁记录已清空');
        return await e.reply('反作弊系统已关闭，所有封禁记录已清空。当检测到数据不一致时，系统将不会封禁用户，而是继续执行功能。');
    }

    async checkAntiCheatStatus(e) {
        const status = await redis.get(ANTI_CHEAT_STATUS_KEY);
        if (status === 'enabled') {
            return await e.reply('反作弊系统当前状态：已开启');
        } else {
            return await e.reply('反作弊系统当前状态：已关闭');
        }
    }
}

// 导出一个用于检查反作弊系统状态的函数，供其他文件使用
export async function isAntiCheatEnabled() {
    const redis = new Redis();
    const status = await redis.get(ANTI_CHEAT_STATUS_KEY);
    return status === 'enabled';
} 