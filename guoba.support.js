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
          component: 'SOFT_GROUP_BEGIN'
        },
        {
          field: 'police.ranks',
          label: '警察等级配置',
          helpMessage: '配置警察系统的等级信息',
          component: 'JsonEditor',
        },
        {
          field: 'police.departments',
          label: '警察部门配置',
          helpMessage: '配置警察系统的部门信息',
          component: 'JsonEditor',
        },
        {
          field: 'police.case_types',
          label: '案件类型配置',
          helpMessage: '配置警察系统的案件类型信息',
          component: 'JsonEditor',
        },
        {
          field: 'police.equipment_prices',
          label: '装备价格配置',
          helpMessage: '配置警察系统的装备价格信息',
          component: 'JsonEditor',
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
          
          // 处理模拟人生配置
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
          
          // 处理警察系统配置
          if (keyPath.startsWith('police.')) {
            const policeYamlPath = path.join(process.cwd(), 'plugins/sims-plugin/config/police.yaml')
            try {
              let policeConfig = {}
              if (fs.existsSync(policeYamlPath)) {
                policeConfig = yaml.parse(fs.readFileSync(policeYamlPath, 'utf8'))
              }
              
              // 将keyPath中的police.移除，并设置到policeConfig中
              const subPath = keyPath.replace('police.', '')
              lodash.set(policeConfig, subPath, value)
              
              // 保存到police.yaml
              fs.writeFileSync(policeYamlPath, yaml.stringify(policeConfig), 'utf8')
              continue
            } catch (err) {
              console.error('保存警察系统配置出错:', err)
              return Result.err('保存警察系统配置出错')
            }
          }
          
          lodash.set(config, keyPath, value)
        }
        
        // 保存锅巴自身配置
        config = lodash.merge({}, cfg.merged, config)
        cfg.config.reader.setData(config)
        return Result.ok({}, '保存成功~')
      }
    }
  }
}
