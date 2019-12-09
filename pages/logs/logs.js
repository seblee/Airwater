//logs.js
const util = require('../../utils/util.js')

Page({
  data: {
    logs: [],
    array: [{
      message: 'foo',
    }, {
      message: 'bar'
    }]
  },
  onLoad: function () {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(log => {
        return util.formatTime(new Date(log))
      })
    })
  }
})
