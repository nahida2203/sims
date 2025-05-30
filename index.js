import fs from 'node:fs'
import Redis from 'ioredis'

if (!global.segment) {
  global.segment = (await import("oicq")).segment
}

if (!global.core) {
  try {
    global.core = (await import("oicq")).core
  } catch (err) {}
}

// 初始化Redis连接
const redis = new Redis();

// 初始化反作弊系统状态，如果不存在则默认为开启
const ANTI_CHEAT_STATUS_KEY = 'sims:anti_cheat_status';
const status = await redis.get(ANTI_CHEAT_STATUS_KEY);
if (status === null) {
  await redis.set(ANTI_CHEAT_STATUS_KEY, 'enabled');
  logger.info('[反作弊系统] 初始化反作弊系统状态为：已开启');
} else {
  logger.info(`[反作弊系统] 当前反作弊系统状态为：${status === 'enabled' ? '已开启' : '已关闭'}`);
}

let ret = []

logger.info('------(ˊ·ω·ˋ)------')
logger.info('sims-plugin载入成功!')
logger.info('仓库地址 https://gitee.com/nahida22/xierapi-plugin')
logger.info('插件群号: null')
logger.info('Created By nahida22')
logger.info('-------------------')

const files = fs
  .readdirSync('./plugins/sims-plugin/apps')
  .filter((file) => file.endsWith('.js'))

  files.forEach((file) => {
    ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
  let name = files[i].replace('.js', '')
  
  if (ret[i].status != 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
    }
    apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
export { apps }