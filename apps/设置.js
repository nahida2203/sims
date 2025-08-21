import { segment } from 'icqq'
import plugin from '../../../lib/plugins/plugin.js'
import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import { checkUserData } from '../function/function.js'
import { checkCooldown, setCooldown } from '../function/cooldown.js'
import puppeteer from "../../../lib/puppeteer/puppeteer.js"

const _path = process.cwd().replace(/\\/g, "/")
const CONFIG_DIR = './plugins/sims-plugin/config'

// 读取配置文件
function loadConfig(configName) {
  const configPath = path.join(process.cwd(), CONFIG_DIR, `${configName}.yaml`)
  if (fs.existsSync(configPath)) {
    return yaml.parse(fs.readFileSync(configPath, 'utf8'))
  }
  return null
}
function saveConfig(configName, configData) {
  const configPath = path.join(process.cwd(), CONFIG_DIR, `${configName}.yaml`)
  try {
    const yamlStr = yaml.stringify(configData)
    fs.writeFileSync(configPath, yamlStr, 'utf8')
    return true
  } catch (error) {
    console.error(`保存配置文件 ${configName}.yaml 出错:`, error)
    return false
  }
}

// 获取所有配置文件列表
function getConfigFiles() {
  const configPath = path.join(process.cwd(), CONFIG_DIR)
  const files = fs.readdirSync(configPath)
  return files.filter(file => file.endsWith('.yaml')).map(file => file.replace('.yaml', ''))
}

export class SimsSettings extends plugin {
  constructor() {
    super({
      name: 'SimsSettings',
      dsc: '模拟人生插件设置系统',
      event: 'message',
      priority: 600,
      rule: [
        { reg: '^#模拟人生设置$', fnc: 'showSettings' },
        { reg: '^#查看配置\\s*(.+)?$', fnc: 'viewConfig' },
        { reg: '^#查看配置项\\s+([\\w_]+)\\s+(.+)$', fnc: 'viewConfigItem' },
        { reg: '^#修改配置\\s+([\\w_]+)\\s+(.+)\\s+(.+)$', fnc: 'modifyConfig' },
        { reg: '^#重置配置\\s+([\\w_]+)$', fnc: 'resetConfig' },
        { reg: '^#模拟人生配置帮助$', fnc: 'showHelp' }
      ]
    })
  }
  async showSettings(e) {
    if (!e.isMaster) {
      e.reply("只有机器人主人才能使用设置功能")
      return
    }
    const remainingTime = checkCooldown(e.user_id, 'mnrs', 'show_status')
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`)
      return
    }
    setCooldown(e.user_id, 'mnrs', 'show_status')

    // 获取所有配置文件
    const configFiles = getConfigFiles()
    
    try {
      const data = {
        configFiles,
        time: new Date().toLocaleString()
      }
      
    image(e, 'settings', { 
           data
        });
    } catch (err) {
      logger.error(err)
      e.reply(`渲染设置界面出错: ${err.message}`)
      e.reply(`可用的配置文件：${configFiles.join('、')}`)
    }
  }

  async viewConfig(e) {
    if (!e.isMaster) {
      e.reply("只有机器人主人才能查看配置文件")
      return
    }
    const configName = e.msg.replace(/^#查看配置\s*/, '').trim()
    
    if (!configName) {
      const configFiles = getConfigFiles()
      e.reply(`请指定要查看的配置文件名称，可用的配置文件：${configFiles.join('、')}`)
      return
    }
    const config = loadConfig(configName)
    if (!config) {
      e.reply(`未找到配置文件: ${configName}.yaml`)
      return
    }
    
    try {
      const configStr = yaml.stringify(config)
      const maxLength = 1000
      if (configStr.length <= maxLength) {
        e.reply(`${configName}.yaml 配置内容：\n${configStr}`)
      } else {
        const parts = Math.ceil(configStr.length / maxLength)
        for (let i = 0; i < parts; i++) {
          const part = configStr.substring(i * maxLength, (i + 1) * maxLength)
          e.reply(`${configName}.yaml 配置内容 (${i+1}/${parts})：\n${part}`)
        }
      }
    } catch (err) {
      logger.error(err)
      e.reply(`读取配置文件出错: ${err.message}`)
    }
  }

  // 查看配置项
  async viewConfigItem(e) {
    // 权限检查
    if (!e.isMaster) {
      e.reply("只有机器人主人才能查看配置项")
      return
    }

    // 解析参数
    const match = e.msg.match(/^#查看配置项\s+([a-zA-Z0-9_]+)\s+(.+)$/)
    if (!match) {
      e.reply("命令格式不正确，请使用：#查看配置项 [配置文件名] [配置项路径]")
      return
    }
    
    const configName = match[1]
    const itemPath = match[2]
    
    // 读取配置文件
    const config = loadConfig(configName)
    if (!config) {
      e.reply(`未找到配置文件: ${configName}.yaml`)
      return
    }
    
    try {
      const pathParts = itemPath.split('.')
      let value = config
      for (const part of pathParts) {
        if (value[part] === undefined) {
          e.reply(`配置项 ${itemPath} 不存在于 ${configName}.yaml 中`)
          return
        }
        value = value[part]
      }
      if (typeof value === 'object') {
        e.reply(`配置项 ${itemPath} 的值：\n${yaml.stringify(value)}`)
      } else {
        e.reply(`配置项 ${itemPath} 的值：${value}`)
      }
    } catch (err) {
      logger.error(err)
      e.reply(`读取配置项出错: ${err.message}`)
    }
  }
  async modifyConfig(e) {
    if (!e.isMaster) {
      e.reply("只有机器人主人才能修改配置")
      return
    }
    const match = e.msg.match(/^#修改配置\s+([a-zA-Z0-9_]+)\s+(.+)\s+(.+)$/)
    if (!match) {
      e.reply("命令格式不正确，请使用：#修改配置 [配置文件名] [配置项路径] [新值]")
      return
    }
    
    const configName = match[1]
    const itemPath = match[2]
    let newValue = match[3]
    const config = loadConfig(configName)
    if (!config) {
      e.reply(`未找到配置文件: ${configName}.yaml`)
      return
    }
    
    try {
      if (newValue === 'true') newValue = true
      else if (newValue === 'false') newValue = false
      else if (!isNaN(newValue) && newValue.trim() !== '') newValue = Number(newValue)
      const pathParts = itemPath.split('.')
      let current = config
      // 遍历路径直到倒数第二个部分
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i]
        if (current[part] === undefined) {
          current[part] = {}
        }
        current = current[part]
      }
      const lastPart = pathParts[pathParts.length - 1]
      current[lastPart] = newValue
      if (saveConfig(configName, config)) {
        e.reply(`已成功修改配置项 ${itemPath} 的值为 ${newValue}`)
      } else {
        e.reply("保存配置文件失败")
      }
    } catch (err) {
      logger.error(err)
      e.reply(`修改配置项出错: ${err.message}`)
    }
  }

  async resetConfig(e) {
    if (!e.isMaster) {
      e.reply("只有机器人主人才能重置配置")
      return
    }
    const match = e.msg.match(/^#重置配置\s+([a-zA-Z0-9_]+)$/)
    if (!match) {
      e.reply("命令格式不正确，请使用：#重置配置 [配置文件名]")
      return
    }
    const configName = match[1]
    const defaultConfigPath = path.join(process.cwd(), CONFIG_DIR, `${configName}_default.yaml`)
    if (!fs.existsSync(defaultConfigPath)) {
      e.reply(`未找到默认配置文件: ${configName}_default.yaml，无法重置`)
      return
    }
    
    try {
      const defaultConfig = yaml.parse(fs.readFileSync(defaultConfigPath, 'utf8'))
      if (saveConfig(configName, defaultConfig)) {
        e.reply(`已成功将 ${configName}.yaml 重置为默认配置`)
      } else {
        e.reply("重置配置文件失败")
      }
    } catch (err) {
      logger.error(err)
      e.reply(`重置配置出错: ${err.message}`)
    }
  }
  async showHelp(e) {
    const helpText = `【模拟人生配置系统帮助】
1. #模拟人生设置 - 显示设置菜单
2. #查看配置 [配置文件名] - 查看完整配置文件
3. #查看配置项 [配置文件名] [配置项路径] - 查看特定配置项
4. #修改配置 [配置文件名] [配置项路径] [新值] - 修改配置项
5. #重置配置 [配置文件名] - 重置配置文件到默认值

配置文件名示例: config, cooldown, police
配置项路径示例: base.initial_money, staff.max_work_hours

注意: 所有设置功能仅机器人主人可用`

    e.reply(helpText)
  }
}
async function image(e, flie, obj) {
    let data = {
      quality: 100,
      tplFile: `./plugins/sims-plugin/resources/HTML/${flie}.html`,
      ...obj,
    }
    let img = await puppeteer.screenshot('sims-plugin', {
      ...data,
    })
   
    e.reply([img])
  }