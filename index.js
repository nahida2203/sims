import fs from 'node:fs'
if (!global.segment) {
  global.segment = (await import("oicq")).segment
}

if (!global.core) {
  try {
    global.core = (await import("oicq")).core
  } catch (err) {}
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