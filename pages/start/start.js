//start.js
//获取应用实例
var app = getApp();
Page({
  data: {
    remind: '加载中',
    angle: 0,
    userInfo: {},
    moto: '设备配对中，请稍后！',
  },
 //事件处理函数，跳转主页 
  goToIndex: function() {
    wx.switchTab({
      url: '/pages/index/index',
    });
  },
  onLoad: function(options) {
    var that = this
//    wx.setNavigationBarTitle({
//      title: wx.getStorageSync('Airwater')
//    })

    if (options.q !== undefined) {
      var scan_url = decodeURIComponent(options.q);
      console.log(scan_url);
      }else{
        console.log(123);
      }
  },

  onReady: function() {
    var that = this;
    setTimeout(function() {
      that.setData({
        remind: ''
      });
    }, 1000);

    wx.onAccelerometerChange(function(res) {
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
  }
});