import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import {
    saveBanData,
    loadBanList,
    saveBanList
} from '../function/function.js';
import Redis from 'ioredis';

const redis = new Redis();
const PLUGIN_PATH = path.join(path.resolve(), 'plugins', 'sims-plugin');
const BAN_LIST_FILE_PATH = path.join(PLUGIN_PATH, 'data', 'ban_list.json');
export class UserStart extends plugin {
    constructor() {
        super({
            name: 'UserStart',
            dsc: '游戏开始',
            event: 'message',
            priority: 6,
            rule: [
                {
                    reg: '^#解除封禁\\s+([A-Fa-f0-9]+|\\d+)',
                    fnc: 'UnbanUser',
                
                },{
                    reg: '^#封禁用户\\s+([A-Fa-f0-9]+|\\d+)',
                    fnc: 'BanUser',
                
                },
            ],
        });
       
    }
    async BanUser(e) {
        const userId = e.msg.match(/#封禁用户\s+([A-Fa-f0-9]+)/)[1];
        const banDays = Math.floor(Math.random() * (180 - 7 + 1)) + 7; 
        const banUntil = Date.now() + banDays * 24 * 60 * 60 * 1000; 
        const banData = { userId, banUntil };
        try {
            await saveBanData(banData); 
            e.reply(`用户${userId}已被封禁${banDays}天，封禁到${new Date(banUntil).toLocaleString()}`);
           // scheduleUnban(userId, banUntil); 
        } catch (error) {
            console.error("保存封禁信息时出错:", error); 
            e.reply("封禁用户时发生错误，请稍后重试。");
        }
    }
    async UnbanUser(e) {
        try {
            const userId = e.msg.match(/#解除封禁\s+([A-Fa-f0-9]+)/)[1];
            if (!userId) {
                return await e.reply('请提供正确的用户ID');
            }

            const banList = await loadBanList();
            
            if (banList[userId]) {
                delete banList[userId];
                await saveBanList(banList);
                await redis.del(`ban:${userId}`);
                return await e.reply(`用户${userId}已解除封禁`);
            } else {
                return await e.reply(`用户${userId}未被封禁`);
            }
        } catch (error) {
            console.error("解除封禁时出错:", error);
            return await e.reply("解除封禁时发生错误，请确保输入的用户ID格式正确");
        }
    }
    }
