//app.js
App({

  //======全局变量====== 
  globalData: {
    userInfo: null,
    g_BdeviceId : "",
    g_BserviceId: "",
    g_BcharacteristicId: "",
  },
  //======应用程序全局方法======

  //======生命周期方法======
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    var that = this
    console.log("g_BdeviceId:",that.globalData.g_BdeviceId);
    var deviceId=that.globalData.g_BdeviceId;
    wx.closeBLEConnection({
      deviceId: deviceId,
      success: function(res) {
        console.log('断开设备连接', res);
      }
    });
  },
  /**
 * 生命周期函数--错误
 */ 
  onError (msg) {
    console.log(msg)
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    var that = this
    console.log("g_BdeviceId:",that.globalData.g_BdeviceId);
    var deviceId=that.globalData.g_BdeviceId;
    wx.closeBLEConnection({
      deviceId: deviceId,
      success: function(res) {
        console.log('断开设备连接', res);
      }
    });
  },

})