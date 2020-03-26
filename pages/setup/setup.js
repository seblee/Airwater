const util = require('../../utils/util.js')
var app = getApp()


Page({

  /**
   * 页面的初始数据
   */
  data: {
    waterFunIndex: 0,
    waterStorageIndex: 0,
    FunOpenClose: ['关闭', '开启'],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
    console.log('paraPowerMode[0]', app.globalData.rcvPara.paraPowerMode.value[0])
    console.log('paraStorge[0]', app.globalData.rcvPara.paraStorge.value[0])
    this.setData({
      waterFunIndex: app.globalData.rcvPara.paraPowerMode.value[0],
      waterStorageIndex: app.globalData.rcvPara.paraStorge.value[0],
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  /**
   * 制水功能
   * @param {*} e 
   */
  bindPickerChangeWaterFun: function (e) {
    console.log('picker 制水功能', e.detail.value)
    this.setData({
      waterFunIndex: e.detail.value
    })
    if (this.data.waterFunIndex == 0) {
      app.writePack(app.globalData.txConfig.waterMakeOff.id, app.globalData.txConfig.waterMakeOff.value);//调用数据发送函数
    } else if (this.data.waterFunIndex == 1) {
      app.writePack(app.globalData.txConfig.waterMakeOn.id, app.globalData.txConfig.waterMakeOn.value);//调用数据发送函数
    }
  },
  /**
   * 贮存功能
   * @param {*} e Picker return
   */
  bindPickerChangeStorage: function (e) {
    console.log('picker 贮存功能', e.detail.value)
    this.setData({
      waterStorageIndex: e.detail.value
    })
    if (this.data.waterStorageIndex == 0) {
      app.writePack(app.globalData.txConfig.waterMakeOff.id, app.globalData.txConfig.waterStoreOff.value);//调用数据发送函数
    } else if (this.data.waterStorageIndex == 1) {
      app.writePack(app.globalData.txConfig.waterMakeOn.id, app.globalData.txConfig.waterStoreOn.value);//调用数据发送函数
    }
  },
  //页面数据刷新
  showDisplay: function (address) {

    console.log('set页面数据刷新' + address)
    switch (address) {
      case app.globalData.rcvPara.paraPowerMode.id:
        this.setData({
          waterFunIndex: app.globalData.rcvPara.paraPowerMode.value[0],
        })
        break
      case app.globalData.rcvPara.paraStorge.id:
        this.setData({
          waterStorageIndex: app.globalData.rcvPara.paraStorge.value[0],
        })
        break
      default:
        break;
    }
  },
})
