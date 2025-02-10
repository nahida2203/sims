/*
* 请注意，系统不会读取help_default.js ！！！！
* 【请勿直接修改此文件，且可能导致后续冲突】
*
* 如需自定义可将文件【复制】一份，并重命名为 help.js
*
* */

// 帮助配置
export const helpCfg = {
  // 帮助标题
  title: '模拟人生帮助',

  // 帮助副标题
  subTitle: 'Yunzai-Bot & sims-Plugin',

  // 帮助表格列数，可选：2-5，默认3
  // 注意：设置列数过多可能导致阅读困难，请参考实际效果进行设置
  colCount: 3,

  // 单列宽度，默认265
  // 注意：过窄可能导致文字有较多换行，请根据实际帮助项设定
  colWidth: 265,

  // 皮肤选择，可多选，或设置为all
  // 皮肤包放置于 resources/help/theme
  // 皮肤名为对应文件夹名
  // theme: 'all', // 设置为全部皮肤
  // theme: ['default','theme2'], // 设置为指定皮肤
  theme: 'all',

  // 排除皮肤：在存在其他皮肤时会忽略该项内设置的皮肤
  // 默认忽略default：即存在其他皮肤时会忽略自带的default皮肤
  // 如希望default皮肤也加入随机池可删除default项
  themeExclude: ['default'],

  // 是否启用背景毛玻璃效果，若渲染遇到问题可设置为false关闭
  bgBlur: true
}

// 帮助菜单内容
export const helpList = [{
  group: '模拟人生核心功能',
  list: [{
    icon: 12,
    title: '#开始模拟人生',
    desc: '开始你的倒霉人生吧'
  }, {
    icon: 40,
    title: '游戏有反作弊功能',
    desc: '如果作弊会被封号哦'
  }]
}, {
  group: '功能',
  list: [{
    icon: 33,
    title: '#设置性别xx',
    desc: '顾名思义，设置性别'

  }, {
    icon: 31,
    title: '#改名xxx',
    desc: '顾名思义'
  }, {
    icon: 22,
    title: '#模拟人生信息',
    desc: '查看个人游戏信息'
  }]
}, {
  group: '职业【KTV】',
  list: [{
    icon: 57,
    title: '#开KTV',
    desc: '开KTV'
  }, {
    icon: 58,
    title: '#唱歌',
    desc: '就是唱歌'
  }, {
    icon: 59,
    title: '#购买歌曲',
    desc: '顾名思义'
  }, {
    icon: 21,
    title: '#购买装饰',
    desc: '购买装饰'
  }, {
    icon: 39,
    title: '#提升音质',
    desc: '没有介绍'
  }, {
    icon: 55,
    title: '#提升舞台效果',
    desc: '没有介绍'
  }, {
    icon: 52,
    title: '#购买灯光设备',
    desc: '没有介绍'
  }, {
    icon: 76,
    title: '#购买舞台设备',
    desc: '没有介绍'
  }, {
    icon: 78,
    title: '#购买DJ设备',
    desc: '没有介绍'
  }, {
    icon: 33,
    title: '#购买调酒设备',
    desc: '没有介绍'
  }, {
    icon: 31,
    title: '#雇佣调酒师',
    desc: '没有介绍'
  }
  , {
    icon: 34,
    title: '#雇佣厨师',
    desc: '没有介绍'
  }
  , {
    icon: 35,
    title: '#雇佣歌手',
    desc: '没有介绍'
  }
  , {
    icon: 36,
    title: '#雇佣舞蹈家',
    desc: '没有介绍'
  }
  , {
    icon: 37,
    title: '#购买厨师设备',
    desc: '没有介绍'
  }
  , {
    icon: 38,
    title: '#购买歌手服装',
    desc: '没有介绍'
  }
  , {
    icon: 39,
    title: '#购买舞蹈家服装',
    desc: '没有介绍'
  }
  , {
    icon: 40,
    title: '#提升KTV等级',
    desc: '没有介绍'
  }
  , {
    icon: 41,
    title: '#KTV信息',
    desc: '没有介绍'
  }
]
}, {
  group: '职业【家具店】',
  list: [{
    icon: 60,
    title: '#应聘家具店店员',
    desc: '没有介绍'
  }, {
    icon: 21,
    title: '#升级为家具店店主',
    desc: '没有介绍'
  }, {
    icon: 38,
    title: '#出售家具xxx',
    desc: '没有介绍'
  }, {
    icon: 43,
    title: '#家具进货',
    desc: '没有介绍'
  }, {
    icon: 22,
    title: '#查看家具库存',
    desc: '没有介绍'
  }, {
    icon: 54,
    title: '#家具销售榜',
    desc: '没有介绍'
  }, {
    icon: 55,
    title: '#查看销售记录',
    desc: '没有介绍'
  }, {
    icon: 71,
    title: '#家具店改名xxx',
    desc: '没有介绍'
  }, {
    icon: 74,
    title: '#升级店铺',
    desc: '没有介绍'
  }, {
    icon: 11,
    title: '#制作家具xxx',
    desc: '没有介绍'
  }, {
    icon: 80,
    title: '#查看家具蓝图',
    desc: '没有介绍'
  }, {
    icon: 70,
    title: '#发工资',
    desc: '仅店主可用'
  }]
}, {
  group: '管理命令，仅管理员可用',
  auth: 'master',
  list: [{
    icon: 95,
    title: '#模拟人生(强制)更新',
    desc: '更新模拟人生插件'
  }]
}]
