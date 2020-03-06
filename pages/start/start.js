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
    inputValue: '66:00:0A:0B:02:08', 
  },
 //事件处理函数，跳转主页 
  goToIndex: function() {
    wx.switchTab({
      url: '/pages/index/index',
    });
  },

  onLoad: function(options) {
    console.log('start页面onLoad');
    wx.showLoading({
      title: '请打开蓝牙',
    });
    console.log(options.id);
    this.setData({
      deviceName: options.id,
    });
    console.log('设备的Name', this.data.deviceName);
    var that = this;

    var deviceName = options.id;
    wx.closeBluetoothAdapter({
      success: function(res) {
        console.log('关闭蓝牙模块');
        /* 初始化蓝牙适配器 */
        wx.openBluetoothAdapter({
          success: function(res) {
            console.log('初始化蓝牙适配器成功');
            wx.hideLoading();
            wx.showLoading({
              title: '请稍后....',
            });
            wx.startBluetoothDevicesDiscovery({
              allowDuplicatesKey: false,
              success: function(res) {
                console.log('这里是开始搜索附近设备', res);
                //添加延迟
                setTimeout(() => {
                  wx.getBluetoothDevices({
                    success: function(res) {
                      console.log(res);
                      //在搜索到的所有蓝牙中找到需要连接的那一个蓝牙
                      for (var i = 0; i < res.devices.length; i++) {
                        if (res.devices[i].name == deviceName) {
                          that.setData({
                            deviceId: res.devices[i].deviceId,
                          })
                          console.log("deviceId:",res.devices[i].deviceId)
                          wx.hideLoading();
                          /* 连接中动画 */
                          wx.showLoading({
                            title: '正在连接...',
                          });
                          that.CreateBLEConnection();
                        }
                      }
                    },
                    fail: function() {
                      console.log("搜索蓝牙设备失败")
                    }
                  });
                }, 2000);
              },
            });
          },
        })
      }
    });
  },

  //连接蓝牙
  CreateBLEConnection: function() {   
    var that = this;
    wx.stopBluetoothDevicesDiscovery({
      success: function(res) {
        console.log('停止搜索设备', res)
      }
    })
    /* 开始连接蓝牙设备 */
    wx.createBLEConnection({
      deviceId: that.data.deviceId,
      success: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1000
        })
        //全局变量
        app.globalData.g_BdeviceId=that.data.deviceId,
        app.setStorage_ID();//存储deviceId
        that.goToIndex();//跳转主页
      },
      fail: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: '连接失败',
          showCancel: false
        })
      }
    })
  },

  // //连接蓝牙
  // CreateBLEConnection: function() {   
  //   var that = this;
  //   wx.stopBluetoothDevicesDiscovery({
  //     success: function(res) {
  //       console.log('停止搜索设备', res)
  //     }
  //   })
  //   /* 开始连接蓝牙设备 */
  //   wx.createBLEConnection({
  //     deviceId: that.data.deviceId,
  //     success: function(res) {
  //       console.log('连接成功', res);
  //       wx.hideLoading();
  //       /* 获取设备的服务UUID */
  //       wx.getBLEDeviceServices({
  //         deviceId: that.data.deviceId,
  //         success: function(service) {
  //           var all_UUID = service.services; //取出所有的服务
  //           console.log('所有的服务', all_UUID);
  //           var UUID_lenght = all_UUID.length; //获取到服务数组的长度
  //           /* 遍历服务数组 */
  //           for (var index = 0; index < UUID_lenght; index++) {
  //             var ergodic_UUID = all_UUID[index].uuid; //取出服务里面的UUID
  //             var UUID_slice = ergodic_UUID.slice(4, 8); //截取4到8位
  //             /* 判断是否是我们需要的FFE0 */
  //             if (UUID_slice == 'FFB0' || UUID_slice == 'ffb0') {
  //               var index_uuid = index;
  //               that.setData({
  //                 serviceId: all_UUID[index_uuid].uuid //确定需要的服务UUID
  //               });
  //             };
  //           };
  //           console.log('需要的服务UUID', that.data.serviceId)
  //           that.GetCharacteristics(); //调用获取特征值函数
  //           that.goToIndex();//跳转主页
  //         },
  //       });
  //     },
  //   })
  // },



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
  onReady: function() {
    var that = this;
    setTimeout(function() {
      that.setData({
        remind: ''
      });
    }, 100);

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
  },

})