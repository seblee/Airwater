//logs.js
const util = require('../../utils/util.js')
var app = getApp()

Page({
  data: {
    logs: [],
    array: [{
      message: 'foo',
    }, {
      message: 'bar'
    }],
    alarmList: [],
    alarmState: 0,
    alarmDescription: [
      "E0(出水故障)",
      "E1(DT高水位)",
      "E2(ST高水位)",
      "E3(浮球开关)",
      "E4(门未关)",
      "E5(温湿度)",
      "E6(NTC)",
      "E7(风机故障)",
      "E8(UV故障)",
      "E9(ST高液位超时)",
      "E10(漏水)",
      "E11(排气高温)",
      "E12(排气高温锁死)",
      "E13",
      "E14",
      "E15",
    ]
  },
  onLoad: function () {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(log => {
        return util.formatTime(new Date(log))
      }),
    })

  },
  onShow: function () {
    this.setData({
      alarmState: app.globalData.rcvState.StHardware.value[5],
    })
    var list = [];
    for (let i = 0; i < 16; i++) {
      if (this.data.alarmState & (1 << i)) {
        list.push(this.data.alarmDescription[i])
      }
    }
    this.setData({
      alarmList: list,
    })
  },

  //页面数据刷新
  showDisplay: function (address) {

    console.log('log页面数据刷新' + address)
    switch (address) {
      case app.globalData.rcvState.StHardware.id:
        this.setData({
          alarmState: app.globalData.rcvState.StHardware.value[5],
        })
        var list = [];
        for (let i = 0; i < 16; i++) {
          if (this.data.alarmState & (1 << i)) {
            list.push(this.data.alarmDescription[i])
          }
        }
        this.setData({
          alarmList: list,
        })
        break
      default:
        break;
    }
  },
})
