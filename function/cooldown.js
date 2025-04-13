import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const PLUGIN_PATH = path.join(path.resolve(), 'plugins', 'sims-plugin');

// 读取冷却配置
const cooldownConfig = yaml.parse(fs.readFileSync(path.join(PLUGIN_PATH, 'config/cooldown.yaml'), 'utf8'));

// 冷却数据
let cooldowns = {};

/**
 * 检查用户操作是否在冷却中
 * @param {string} userId 用户ID
 * @param {string} category 功能分类（如stock, mnrs, cafe等）
 * @param {string} type 操作类型
 * @returns {number} 剩余冷却时间（秒），0表示不在冷却中
 */
export function checkCooldown(userId, category, type) {
    const key = `${userId}-${category}-${type}`;
    const now = Date.now();
    
    // 获取冷却时间配置，默认60秒
    let cooldownTime = 60;
    if (cooldownConfig[category] && cooldownConfig[category][type]) {
        cooldownTime = cooldownConfig[category][type];
    }
    
    cooldownTime = cooldownTime * 1000; // 转换为毫秒
    
    if (cooldowns[key] && now < cooldowns[key]) {
        const remainingTime = Math.ceil((cooldowns[key] - now) / 1000);
        return remainingTime;
    }
    return 0;
}

/**
 * 设置用户操作的冷却
 * @param {string} userId 用户ID
 * @param {string} category 功能分类（如stock, mnrs, cafe等）
 * @param {string} type 操作类型
 */
export function setCooldown(userId, category, type) {
    const key = `${userId}-${category}-${type}`;
    
    // 获取冷却时间配置，默认60秒
    let cooldownTime = 60;
    if (cooldownConfig[category] && cooldownConfig[category][type]) {
        cooldownTime = cooldownConfig[category][type];
    }
    
    cooldownTime = cooldownTime * 1000; // 转换为毫秒
    cooldowns[key] = Date.now() + cooldownTime;
}

/**
 * 获取冷却配置
 * @returns {Object} 冷却配置对象
 */
export function getCooldownConfig() {
    return cooldownConfig;
}

/**
 * 重置用户的所有冷却
 * @param {string} userId 用户ID
 */
export function resetUserCooldowns(userId) {
    for (const key in cooldowns) {
        if (key.startsWith(`${userId}-`)) {
            delete cooldowns[key];
        }
    }
}

/**
 * 清理过期的冷却数据
 */
export function cleanupCooldowns() {
    const now = Date.now();
    for (const key in cooldowns) {
        if (cooldowns[key] < now) {
            delete cooldowns[key];
        }
    }
}

// 定期清理过期的冷却数据
setInterval(cleanupCooldowns, 3600000); // 每小时清理一次 