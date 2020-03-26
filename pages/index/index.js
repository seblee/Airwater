var util = require('../../utils/util.js')
var app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    //状态显示变量
    State: {
      workState: '优',
      runState: 0,//运行状态
      Temperture: 23,//温度
      Humidity: 50,//湿度
      WaterLevel: 0,//水位
      WaterMake: 0,//制水
      Fan: false,//风机
      PM25: 40,//pm2.5
      waterOut: false,
    },

    yearMonth: '2020.01',
    day: '00',
    week: '周周'


  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  //输入框
  bindInput: function (e) {
    this.setData({
      inputText: e.detail.value
    })
    console.log(e.detail.value)
  },
  //按键发送
  bindSend: function () {
    var that = this
    console.log('按键发送bindSend');
    this.setData({
      'State.Humidity': 55,
      'State.Temperture': 23,
    })
    if (that.data.connected) {

      app.writeBuffer(that.data.inputText); //调用数据发送函数
    }
    else {
      wx.showModal({
        title: '提示',
        content: '蓝牙已断开',
        showCancel: false,
        success: function (res) {
          that.setData({
            searching: false
          })
        }
      })
    }
  },
  //出常温水
  outNormal: function () {
    var that = this
    console.log('出常温水outNormal');
    if (that.data.connected) {

      if (that.data.State.waterOut) {
        app.writePack(app.globalData.txConfig.WaterStop.id, app.globalData.txConfig.WaterStop.value);//调用数据发送函数
      } else {
        app.writePack(app.globalData.txConfig.CoNormalWater.id, app.globalData.txConfig.CoNormalWater.value);//调用数据发送函数
      }
    }
    else {
      wx.showModal({
        title: '提示',
        content: '蓝牙已断开',
        showCancel: false,
        success: function (res) {
          that.setData({
            searching: false
          })
        }
      })
    }
  },

  //页面启动进入
  onLoad: function () {
    var that = this

    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate()
    var weekNum = now.getDay();
    if (month < 10) {
      month = '0' + month;
    };
    if (day < 10) {
      day = '0' + day;
    };
    var week = ""
    switch (weekNum) {
      case 0:
        week = "周日"
        break;
      case 1:
        week = "周一"
        break;
      case 2:
        week = "周二"
        break;
      case 3:
        week = "周三"
        break;
      case 4:
        week = "周四"
        break;
      case 5:
        week = "周五"
        break;
      case 6:
        week = "周六"
        break;
    }

    that.setData({
      yearMonth: year + '.' + month,
      day: day,
      week: week
    })

    console.log('index页面onLoad');

    //蓝牙数据通信
    app.createBLEConnected();
  },
  //主页面数据刷新
  onShow: function () {

    console.log('主页面数据刷新')

    var level = 0;
    //水位状态
    if ((app.globalData.rcvState.StHardware.value[3] & 0x0008) === 0)//到达低水位
    {
      level = 1;

      if ((app.globalData.rcvState.StHardware.value[3] & 0x0020) !== 0)//饮水箱4浮球
      {
        if ((app.globalData.rcvState.StHardware.value[3] & 0x0040) === 0)//到达中水位
        {
          level = 2;
          if ((app.globalData.rcvState.StHardware.value[3] & 0x0010) === 0)//到达满水位
          {
            level = 3;
          }
          else {
            level = 2;
          }
        }
        else {
          level = 1;
        }
      }
      else {
        if ((app.globalData.rcvState.StHardware.value[3] & 0x0010) === 0)//到达满水位
        {
          level = 3;
        }
        else {
          level = 1;
        }
      }
    }
    else//缺水
    {
      level = 0;
    }
    //运行状态
    var workstate = '优'
    if (app.globalData.rcvState.StHardware.value[2] & 0x4000)
      workstate = '异常'
    else
      workstate = '优'

    this.setData({
      'State.waterOut': (app.globalData.rcvState.StHardware.value[2] & 0x0004),
      'State.Fan': (app.globalData.rcvState.StHardware.value[4] & 0x0008),
      'State.WaterLevel': level,
      'State.workState': workstate,
    })
    console.log('告警:' + app.globalData.rcvState.StHardware.value[2] + ' ' + workstate + ' ' + this.data.State.workState)
    //温度 湿度
    this.setData({
      'State.Temperture': app.globalData.rcvState.StAlarm1.value[5] / 10,
      'State.Humidity': app.globalData.rcvState.StHumidity.value[0] / 10,
    })
  },

  //主页面数据刷新
  showDisplay: function (address) {

    console.log('index页面数据刷新' + address)
    switch (address) {
      case app.globalData.rcvState.StHardware.id:
        var level = 0;
        //水位状态
        if ((app.globalData.rcvState.StHardware.value[3] & 0x0008) === 0)//到达低水位
        {
          level = 1;

          if ((app.globalData.rcvState.StHardware.value[3] & 0x0020) !== 0)//饮水箱4浮球
          {
            if ((app.globalData.rcvState.StHardware.value[3] & 0x0040) === 0)//到达中水位
            {
              level = 2;
              if ((app.globalData.rcvState.StHardware.value[3] & 0x0010) === 0)//到达满水位
              {
                level = 3;
              }
              else {
                level = 2;
              }
            }
            else {
              level = 1;
            }
          }
          else {
            if ((app.globalData.rcvState.StHardware.value[3] & 0x0010) === 0)//到达满水位
            {
              level = 3;
            }
            else {
              level = 1;
            }
          }
        }
        else//缺水
        {
          level = 0;
        }
        var workstate = '优'
        if (app.globalData.rcvState.StHardware.value[2] & 0x4000)
          workstate = '异常'
        else
          workstate = '优'

        this.setData({
          'State.waterOut': (app.globalData.rcvState.StHardware.value[2] & 0x0004),
          'State.Fan': (app.globalData.rcvState.StHardware.value[4] & 0x0008),
          'State.WaterLevel': level,
          'State.workState': workstate,
        })
        console.log(app.globalData.rcvState.StHardware.value[2] + ' ' + workstate + ' ' + this.data.State.workState)
        break
      case app.globalData.rcvState.StAlarm1.id:
        this.setData({
          'State.Temperture': app.globalData.rcvState.StAlarm1.value[5] / 10,
        })
        break
      case app.globalData.rcvState.StHumidity.id:
        this.setData({
          'State.Humidity': app.globalData.rcvState.StHumidity.value[0] / 10,
        })
        break;

      default:
        break;
    }
  },
})
