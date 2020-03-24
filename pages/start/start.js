//start.js
//获取应用实例
var app = getApp();

Page({
  data: {
    remind: '加载中',
    angle: 0,
    userInfo: {},
    moto: '设备配对中，请稍后！',
    deviceId: '',
    deviceName: "",
    inputValue: '66:00:0A:0B:02:0A',
  },
  //事件处理函数，跳转主页 
  goToIndex: function () {
    wx.switchTab({
      url: '/pages/index/index',
    });
  },

  onLoad: function(options) {
    var that = this;

    console.log('start页面onLoad');
    wx.showLoading({
      title: '请打开蓝牙',
    });
    console.log(options.id);
    if(options.id){
      that.setData({
        deviceName: options.id,
      });
      app.globalData.deviceId=options.id,
      console.log('设备options.id', options.id);
    }
    else{
      app.getStorage_ID();//获取ID
      that.setData({
        deviceName: app.globalData.deviceId,
      });
      console.log('设备g_BdeviceId', that.data.deviceName);
    }
    //TEST

    if(that.data.deviceName=="null")
    {
        console.log('未找到deviceName:', that.data.deviceName);   
        wx.hideLoading();
        /* 连接中动画 */
        wx.showLoading({
          title: '请微信扫码连接',
        });
    }
    else
    {
      console.log('找到deviceName:', that.data.deviceName);   
      app.createBLEAdapter();//蓝牙连接

    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  /*
  onUnload: function() {
    var that = this;
    wx.closeBLEConnection({
      deviceId: that.data.deviceId,
      success: function(res) {
        console.log('断开设备连接', res);
      }
    });
  },
  */
  /*****************启动界面***************** */
  onReady: function () {
    var that = this;
    setTimeout(function () {
      that.setData({
        remind: ''
      });
    }, 100);

    wx.onAccelerometerChange(function (res) {
      var angle = -(res.x * 30).toFixed(1);
      if (angle > 14) {
        angle = 14;
      } else if (angle < -14) {
        angle = -14;
      }
      if (that.data.angle !== angle) {
        that.setData({
          angle: angle
        });
      }
    });
  },

})