import path from 'path'
import lodash from 'lodash'
import fs from 'fs'
import yaml from 'yaml'
import cfg from "./model/Cfg.js";
const _path = process.cwd() + "/plugins/sims-plugin"
// 支持锅巴
export function supportGuoba () {
  return {
    // 插件信息，将会显示在前端页面
    // 如果你的插件没有在插件库里，那么需要填上补充信息
    // 如果存在的话，那么填不填就无所谓了，填了就以你的信息为准
    pluginInfo: {
      // name 为插件唯一标识，尽量不要与其他插件重复
      name: 'sims-plugin',
      // title 为显示名称
      title: 'sims-Plugin',
      // 插件描述
      description: '为Yunzai-Bot打造的生活模拟游戏插件',
      // 作者可以为字符串也可以为数组，当有多个作者时建议使用数组
      author: [
        '@nahida22'
      ],
      // 作者主页地址。若author为数组，则authorLink也需要为数组，且需要与author一一对应
      authorLink: [
        'https://gitee.com/nahida22'
      ],
      // 仓库地址
      link: 'https://gitee.com/nahida22/sims-plugin',
      isV3: true,
      isV2: false,
      // 是否显示在左侧菜单，可选值：auto、true、false
      // 当为 auto 时，如果配置项大于等于 3 个，则显示在左侧菜单
      showInMenu: 'auto',
      // 显示图标，此为个性化配置
      // 图标可在 https://icon-sets.iconify.design 这里进行搜索
      icon: 'mdi:stove',
      // 图标颜色，例：#FF0000 或 rgb(255, 0, 0)
      iconColor: '#d19f56',
      // 如果想要显示成图片，也可以填写图标路径（绝对路径）
      iconPath: path.join(_path, 'resources/logo.png')
    },
    // 配置项信息
    configInfo: {
      // 配置项 schemas
      schemas: [
        {
          label: '模拟人生网吧配置',
          component: 'SOFT_GROUP_BEGIN'
        },
        {
          field: 'netbar.base.initial_money',
          label: '初始资金',
          bottomHelpMessage: '开设网吧的初始资金数量',
          component: 'InputNumber',
          componentProps: {
            min: 1000,
            max: 1000000,
            placeholder: '请输入初始资金'
          }
        },
        {
          field: 'netbar.base.max_level',
          label: '最大等级',
          bottomHelpMessage: '网吧可以升级的最大等级',
          component: 'InputNumber',
          componentProps: {
            min: 1,
            max: 10,
            placeholder: '请输入最大等级'
          }
        },
        {
          field: 'netbar.business.hourly_rate.basic',
          label: '基础时租费用',
          bottomHelpMessage: '基础电脑每小时的租用费用',
          component: 'InputNumber',
          componentProps: {
            min: 1,
            max: 100,
            placeholder: '请输入基础时租费用'
          }
        },
        {
          field: 'netbar.business.hourly_rate.standard',
          label: '标准时租费用',
          bottomHelpMessage: '标准电脑每小时的租用费用',
          component: 'InputNumber',
          componentProps: {
            min: 1,
            max: 100,
            placeholder: '请输入标准时租费用'
          }
        },
        {
          field: 'netbar.business.hourly_rate.premium',
          label: '高级时租费用',
          bottomHelpMessage: '高级电脑每小时的租用费用',
          component: 'InputNumber',
          componentProps: {
            min: 1,
            max: 100,
            placeholder: '请输入高级时租费用'
          }
        },
        {
          label: '模拟人生冷却时间配置',
          component: 'SOFT_GROUP_BEGIN'
        },
        {
          field: 'cooldown.stock.simulate',
          label: '股票模拟冷却时间',
          bottomHelpMessage: '模拟股票的冷却时间（秒）',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 3600,
            placeholder: '请输入冷却时间'
          }
        },
        {
          field: 'cooldown.stock.view',
          label: '查看股票冷却时间',
          bottomHelpMessage: '查看股票的冷却时间（秒）',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 3600,
            placeholder: '请输入冷却时间'
          }
        },
        {
          field: 'cooldown.mnrs.create',
          label: '创建角色冷却时间',
          bottomHelpMessage: '创建模拟人生角色的冷却时间（秒）',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 3600,
            placeholder: '请输入冷却时间'
          }
        },
        {
          field: 'cooldown.mnrs.daily_gift',
          label: '每日签到冷却时间',
          bottomHelpMessage: '每日签到的冷却时间（秒）',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 86400,
            placeholder: '请输入冷却时间'
          }
        },
        {
          field: 'cooldown.work.salary',
          label: '领取工资冷却时间',
          bottomHelpMessage: '领取工资的冷却时间（秒）',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 86400,
            placeholder: '请输入冷却时间'
          }
        },
        {
          label: '模拟人生警察系统',
          component: 'Divider'
        },
        {
          field: 'police.exp_rewards.case_solved',
          label: '破案经验奖励',
          bottomHelpMessage: '成功破案获得的经验值',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 1000,
            placeholder: '请输入经验值'
          }
        },
        {
          field: 'police.exp_rewards.case_complex',
          label: '复杂案件经验奖励',
          bottomHelpMessage: '处理复杂案件获得的额外经验值',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 1000,
            placeholder: '请输入经验值'
          }
        },
        {
          field: 'police.exp_rewards.promotion',
          label: '晋升经验奖励',
          bottomHelpMessage: '警察晋升获得的经验值',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 1000,
            placeholder: '请输入经验值'
          }
        },
        {
          label: '警察等级配置',
          component: 'Divider'
        },
        {
          field: 'police.rank1.name',
          label: '等级1名称',
          bottomHelpMessage: '第一级警察等级名称',
          component: 'Input',
          componentProps: {
            placeholder: '请输入等级名称'
          }
        },
        {
          field: 'police.rank1.exp_required',
          label: '等级1所需经验',
          bottomHelpMessage: '升至该等级所需经验值',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入所需经验'
          }
        },
        {
          field: 'police.rank1.salary',
          label: '等级1薪资',
          bottomHelpMessage: '该等级的基础薪资',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入薪资'
          }
        },
        {
          field: 'police.rank2.name',
          label: '等级2名称',
          bottomHelpMessage: '第二级警察等级名称',
          component: 'Input',
          componentProps: {
            placeholder: '请输入等级名称'
          }
        },
        {
          field: 'police.rank2.exp_required',
          label: '等级2所需经验',
          bottomHelpMessage: '升至该等级所需经验值',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入所需经验'
          }
        },
        {
          field: 'police.rank2.salary',
          label: '等级2薪资',
          bottomHelpMessage: '该等级的基础薪资',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入薪资'
          }
        },
        {
          field: 'police.rank3.name',
          label: '等级3名称',
          bottomHelpMessage: '第三级警察等级名称',
          component: 'Input',
          componentProps: {
            placeholder: '请输入等级名称'
          }
        },
        {
          field: 'police.rank3.exp_required',
          label: '等级3所需经验',
          bottomHelpMessage: '升至该等级所需经验值',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入所需经验'
          }
        },
        {
          field: 'police.rank3.salary',
          label: '等级3薪资',
          bottomHelpMessage: '该等级的基础薪资',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入薪资'
          }
        },
        {
          field: 'police.rank4.name',
          label: '等级4名称',
          bottomHelpMessage: '第四级警察等级名称',
          component: 'Input',
          componentProps: {
            placeholder: '请输入等级名称'
          }
        },
        {
          field: 'police.rank4.exp_required',
          label: '等级4所需经验',
          bottomHelpMessage: '升至该等级所需经验值',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入所需经验'
          }
        },
        {
          field: 'police.rank4.salary',
          label: '等级4薪资',
          bottomHelpMessage: '该等级的基础薪资',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入薪资'
          }
        },
        {
          field: 'police.rank5.name',
          label: '等级5名称',
          bottomHelpMessage: '第五级警察等级名称',
          component: 'Input',
          componentProps: {
            placeholder: '请输入等级名称'
          }
        },
        {
          field: 'police.rank5.exp_required',
          label: '等级5所需经验',
          bottomHelpMessage: '升至该等级所需经验值',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入所需经验'
          }
        },
        {
          field: 'police.rank5.salary',
          label: '等级5薪资',
          bottomHelpMessage: '该等级的基础薪资',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入薪资'
          }
        },
        {
          label: '警察装备配置',
          component: 'Divider'
        },
        {
          field: 'police.equipment.baton',
          label: '警棍价格',
          bottomHelpMessage: '警棍的购买价格',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入价格'
          }
        },
        {
          field: 'police.equipment.handcuffs',
          label: '手铐价格',
          bottomHelpMessage: '手铐的购买价格',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入价格'
          }
        },
        {
          field: 'police.equipment.radio',
          label: '对讲机价格',
          bottomHelpMessage: '对讲机的购买价格',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入价格'
          }
        },
        {
          field: 'police.equipment.vest',
          label: '防弹衣价格',
          bottomHelpMessage: '防弹衣的购买价格',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入价格'
          }
        },
        {
          field: 'police.equipment.gun',
          label: '手枪价格',
          bottomHelpMessage: '手枪的购买价格',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入价格'
          }
        },
        {
          field: 'police.equipment.computer',
          label: '警用电脑价格',
          bottomHelpMessage: '警用电脑的购买价格',
          component: 'InputNumber',
          componentProps: {
            min: 0,
            max: 10000,
            placeholder: '请输入价格'
          }
        }
      ],
      // 获取配置数据方法（用于前端填充显示数据）
      getConfigData () {
        let config = lodash.omit(cfg.merged, 'jwt')
        let host = lodash.get(config, 'server.host')
        if (Array.isArray(host)) {
          lodash.set(config, 'server.host', host[0])
        }
        
        // 读取模拟人生配置文件
        try {
          // 读取config.yaml
          const configYamlPath = path.join(process.cwd(), 'plugins/sims-plugin/config/config.yaml')
          if (fs.existsSync(configYamlPath)) {
            const netbarConfig = yaml.parse(fs.readFileSync(configYamlPath, 'utf8'))
            config.netbar = netbarConfig
          }
          
          // 读取cooldown.yaml
          const cooldownYamlPath = path.join(process.cwd(), 'plugins/sims-plugin/config/cooldown.yaml')
          if (fs.existsSync(cooldownYamlPath)) {
            const cooldownConfig = yaml.parse(fs.readFileSync(cooldownYamlPath, 'utf8'))
            config.cooldown = cooldownConfig
          }
          
          // 读取police.yaml
          const policeYamlPath = path.join(process.cwd(), 'plugins/sims-plugin/config/police.yaml')
          if (fs.existsSync(policeYamlPath)) {
            const policeConfig = yaml.parse(fs.readFileSync(policeYamlPath, 'utf8'))
            
            // 将警察等级信息转换为rank1, rank2等格式
            if (policeConfig.ranks && Array.isArray(policeConfig.ranks)) {
              for (let i = 0; i < policeConfig.ranks.length; i++) {
                const rankNum = i + 1
                policeConfig[`rank${rankNum}`] = {
                  name: policeConfig.ranks[i].name || '',
                  exp_required: policeConfig.ranks[i].exp_required || 0,
                  salary: policeConfig.ranks[i].salary || 0
                }
              }
            }
            
            // 将装备价格信息转换为equipment.baton等格式
            if (policeConfig.equipment_prices) {
              policeConfig.equipment = {
                baton: policeConfig.equipment_prices['警棍'] || 0,
                handcuffs: policeConfig.equipment_prices['手铐'] || 0,
                radio: policeConfig.equipment_prices['对讲机'] || 0,
                vest: policeConfig.equipment_prices['防弹衣'] || 0,
                gun: policeConfig.equipment_prices['手枪'] || 0,
                computer: policeConfig.equipment_prices['警用电脑'] || 0
              }
            }
            
            config.police = policeConfig
          }
        } catch (err) {
          console.error('读取模拟人生配置文件出错:', err)
        }
        
        return config
      },
      // 设置配置的方法（前端点确定后调用的方法）
      setConfigData (data, { Result }) {
        let config = {}
        for (let [keyPath, value] of Object.entries(data)) {
          // 特殊处理 server.host
          if (keyPath === 'server.host') {
            let host = cfg.get('server.host')
            if (Array.isArray(host)) {
              host[0] = value
              value = host
            }
          }
          
          // 处理警察系统配置
          if (keyPath.startsWith('police.')) {
            const policeYamlPath = path.join(process.cwd(), 'plugins/sims-plugin/config/police.yaml')
            try {
              let policeConfig = {}
              if (fs.existsSync(policeYamlPath)) {
                policeConfig = yaml.parse(fs.readFileSync(policeYamlPath, 'utf8'))
              }
              
              // 处理警察等级配置
              if (keyPath.startsWith('police.rank')) {
                // 例如：police.rank1.name
                const rankMatch = keyPath.match(/police\.rank(\d+)\.(\w+)/)
                if (rankMatch) {
                  const rankIndex = parseInt(rankMatch[1]) - 1
                  const property = rankMatch[2]
                  
                  // 确保ranks数组存在
                  if (!policeConfig.ranks) {
                    policeConfig.ranks = []
                  }
                  
                  // 确保该索引的等级存在
                  while (policeConfig.ranks.length <= rankIndex) {
                    policeConfig.ranks.push({
                      name: '',
                      exp_required: 0,
                      salary: 0
                    })
                  }
                  
                  // 设置属性值
                  policeConfig.ranks[rankIndex][property] = value
                  
                  // 保存到police.yaml
                  fs.writeFileSync(policeYamlPath, yaml.stringify(policeConfig), 'utf8')
                  continue
                }
              }
              
              // 处理装备价格配置
              if (keyPath.startsWith('police.equipment.')) {
                // 例如：police.equipment.baton
                const equipMatch = keyPath.match(/police\.equipment\.(\w+)/)
                if (equipMatch) {
                  const equipType = equipMatch[1]
                  
                  // 确保equipment_prices对象存在
                  if (!policeConfig.equipment_prices) {
                    policeConfig.equipment_prices = {}
                  }
                  
                  // 根据字段名映射到中文名称
                  let chineseName = ''
                  switch (equipType) {
                    case 'baton':
                      chineseName = '警棍'
                      break
                    case 'handcuffs':
                      chineseName = '手铐'
                      break
                    case 'radio':
                      chineseName = '对讲机'
                      break
                    case 'vest':
                      chineseName = '防弹衣'
                      break
                    case 'gun':
                      chineseName = '手枪'
                      break
                    case 'computer':
                      chineseName = '警用电脑'
                      break
                  }
                  
                  if (chineseName) {
                    // 设置装备价格
                    policeConfig.equipment_prices[chineseName] = value
                    
                    // 保存到police.yaml
                    fs.writeFileSync(policeYamlPath, yaml.stringify(policeConfig), 'utf8')
                    continue
                  }
                }
              }
              
              // 处理经验奖励配置
              if (keyPath.startsWith('police.exp_rewards.')) {
                const expField = keyPath.replace('police.exp_rewards.', '')
                
                // 确保exp_rewards存在
                if (!policeConfig.exp_rewards) {
                  policeConfig.exp_rewards = {}
                }
                
                // 设置值
                policeConfig.exp_rewards[expField] = value
                
                // 保存到police.yaml
                fs.writeFileSync(policeYamlPath, yaml.stringify(policeConfig), 'utf8')
                continue
              }
              
              // 处理其他警察系统配置
              const subPath = keyPath.replace('police.', '')
              if (subPath && !subPath.includes('.')) {
                policeConfig[subPath] = value
                fs.writeFileSync(policeYamlPath, yaml.stringify(policeConfig), 'utf8')
                continue
              }
            } catch (err) {
              console.error('保存警察系统配置出错:', err)
              return Result.err('保存警察系统配置出错')
            }
          }
          
          // 处理冷却时间配置
          if (keyPath.startsWith('cooldown.')) {
            const cooldownYamlPath = path.join(process.cwd(), 'plugins/sims-plugin/config/cooldown.yaml')
            try {
              let cooldownConfig = {}
              if (fs.existsSync(cooldownYamlPath)) {
                cooldownConfig = yaml.parse(fs.readFileSync(cooldownYamlPath, 'utf8'))
              }
              
              // 将keyPath中的cooldown.移除，并设置到cooldownConfig中
              const subPath = keyPath.replace('cooldown.', '')
              lodash.set(cooldownConfig, subPath, value)
              
              // 保存到cooldown.yaml
              fs.writeFileSync(cooldownYamlPath, yaml.stringify(cooldownConfig), 'utf8')
              continue
            } catch (err) {
              console.error('保存冷却时间配置出错:', err)
              return Result.err('保存冷却时间配置出错')
            }
          }
          
          // 处理网吧配置
          if (keyPath.startsWith('netbar.')) {
            const netbarYamlPath = path.join(process.cwd(), 'plugins/sims-plugin/config/config.yaml')
            try {
              let netbarConfig = {}
              if (fs.existsSync(netbarYamlPath)) {
                netbarConfig = yaml.parse(fs.readFileSync(netbarYamlPath, 'utf8'))
              }
              
              // 将keyPath中的netbar.移除，并设置到netbarConfig中
              const subPath = keyPath.replace('netbar.', '')
              lodash.set(netbarConfig, subPath, value)
              
              // 保存到config.yaml
              fs.writeFileSync(netbarYamlPath, yaml.stringify(netbarConfig), 'utf8')
              continue
            } catch (err) {
              console.error('保存网吧配置出错:', err)
              return Result.err('保存网吧配置出错')
            }
          }
          
          lodash.set(config, keyPath, value)
        }
        
        // 保存锅巴自身配置
        try {
          config = lodash.merge({}, cfg.merged || {}, config)
          
          // 添加安全检查
          if (cfg && cfg.config && cfg.config.reader && typeof cfg.config.reader.setData === 'function') {
            cfg.config.reader.setData(config)
          } else {
            // 备选保存方案：直接写入配置文件
            const configPath = path.join(process.cwd(), 'plugins/sims-plugin/config')
            if (!fs.existsSync(configPath)) {
              fs.mkdirSync(configPath, { recursive: true })
            }
          }
          
          return Result.ok({}, '保存成功~')
        } catch (e) {
          console.error('保存配置出错:', e)
          return Result.err('保存配置出错: ' + e.message)
        }
      },
    }
  }
}
