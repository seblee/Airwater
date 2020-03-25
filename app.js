//app.js
App({

  //======全局变量====== 
  globalData: {
    txConfig: {
      CoNormalWater: {
        id: 110,
        value: '00011388',
      },
      WaterStop: {
        id: 110,
        value: '00000000',
      },
      CoHeatWater: {
        id: 110,
        value: '00021388',
      },
      waterMakeOff: {
        id: 100,
        value: '0000',
      },
      waterMakeOn: {
        id: 100,
        value: '0001',
      },
    },
    rcvPara: {
      paraPowerMode: {
        id: 100,//连续6个寄存器
        value: 0,
      },
      paraStorge: {
        id: 184,//连续6个寄存器
        value: 0,
      },
    },

    rcvState: {
      StHardware: {
        id: 500,//连续6个寄存器
        value: 0,
      },
      StAlarm1: {
        id: 506,
        value: 0,
      },
      StHumidity: {
        id: 512,
        value: 0,
      },
      StAin4: {
        id: 518,
        value: 0,
      },
      StRuntimeComp2: {
        id: 524,
        value: 0,
      },
      StReserve: {
        id: 530,
        value: 0,
      },
      StStatusRemap: {
        id: 536,
        value: 0,
      },
    },
    rcvPageRefresh:{
      PageHome:'',
      PageSetup:'',
      PageLog:'',
    },

    userInfo: null,
    alarmList: [],
    BLE:{
      link: true,
      connected: true,
      refreshAddress:"",
    },
    inputText: 'FFA50303010203B0',
    BdeviceId: '',  
    receiveText: '',
    deviceId: '',
    deviceName: "",
    serviceId: {},
    characteristicsId_w: {},
    characteristicsId_r: {},
    connected: true,
    //
    StateTest: '',
  },

  //事件处理函数，跳转主页 
  goToPageIndex: function () {
    wx.switchTab({
      url: '/pages/index/index',
    });
  },

  //======应用程序全局方法======
  /**
* 将字符串转换成ArrayBufer
*/
  string2buf(str) {
    let val = ""
    if (!str) return;
    let length = str.length;
    let index = 0;
    let array = []
    while (index < length) {
      array.push(str.substring(index, index + 2));
      index = index + 2;
    }
    val = array.join(",");
    // 将16进制转化为ArrayBuffer
    return new Uint8Array(val.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    })).buffer
  },

  /**
   * 将ArrayBuffer转换成字符串
   */
  buf2hex(buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  },
  /**
   * 将Uint8Array转换成Uint16Array
   */
  u8ToU16(buffer) {
    var u16Buffer = new Uint16Array(buffer);
    var length = u16Buffer.byteLength / 2 / 2;

    for (var i = 0; i < length; i++) {
      u16Buffer[i] = u16Buffer[i * 2] << 8 | u16Buffer[i * 2 + 1]
    }
    var u16Array = u16Buffer.slice(0, i);
    return u16Array;
  },
  //关闭蓝牙连接
  closeBLEConnection: function () {
    var that = this
    var deviceId = that.globalData.deviceId;
    console.log("deviceId:", deviceId);
    wx.closeBLEConnection({
      deviceId: deviceId,
      success: function (res) {
        console.log('断开设备连接', res);
      }
    });
  },
  //存储ID
  setStorage_ID: function () {
    var that = this
    console.log("setStorage_ID:", that.globalData.deviceId);
    var BdeviceId=that.globalData.deviceId;
    wx.setStorageSync('BdeviceId', BdeviceId);
  },
  //获取ID
  getStorage_ID: function () {
    var that = this
    var BdeviceId=wx.getStorageSync('BdeviceId');
    that.globalData.deviceId=BdeviceId;
    console.log("getStorage_ID:", that.globalData.deviceId);
  },


  //连接蓝牙
  createBLEAdapter: function() {
    var that = this; 

    that.globalData.deviceName=that.globalData.deviceId;
    console.log('设备deviceName', that.globalData.deviceId);
    that.globalData.StateTest|=0x10;
    wx.closeBluetoothAdapter({
      success: function (res) {
        console.log('关闭蓝牙模块');
        that.globalData.StateTest|=0x20;
        /* 初始化蓝牙适配器 */
        wx.openBluetoothAdapter({
          success: function (res) {
            console.log('初始化蓝牙适配器成功');
            wx.hideLoading();
            wx.showLoading({
              title: '请稍后....',
            });
            wx.startBluetoothDevicesDiscovery({
              allowDuplicatesKey: false,
              success: function (res) {
                console.log('这里是开始搜索附近设备', res);
                wx.hideLoading();
                wx.showLoading({
                  title: '搜索设备....',
                });
                that.globalData.StateTest|=0x40;

                //添加延迟
                setTimeout(() => {
                  wx.getBluetoothDevices({
                    success: function (res) {
                      console.log(res);
                      //在搜索到的所有蓝牙中找到需要连接的那一个蓝牙
                      for (var i = 0; i < res.devices.length; i++) {
                        if (res.devices[i].name == that.globalData.deviceName) {
                          //that.setData({
                          //  deviceId: res.devices[i].deviceId,
                          //})
                          that.globalData.StateTest|=0x80;
                          that.globalData.deviceId =res.devices[i].deviceId,
                          console.log("搜索deviceId:",res.devices[i].deviceId)
                          wx.hideLoading();
                          /* 连接中动画 */
                          wx.showLoading({
                            title: '正在连接...',
                          });
                          that.createBLELink();

                        }
                      }
                    },
                    fail: function () {
                      that.globalData.StateTest|=0x100;
                      console.log("搜索蓝牙设备失败")
                    }
                  });
                }, 3000);
              },
              fail: function (res) {
                that.globalData.StateTest|=0x200;
                console.log('开始搜索蓝牙失败');
                wx.hideLoading();
                wx.showLoading({
                  title: '开始搜索蓝牙失败....',
                });
              },
            });
          },
          fail: function (res) {
            that.globalData.StateTest|=0x400;
            console.log('初始化蓝牙适配器失败');
            wx.hideLoading();
            wx.showLoading({
              title: '初始化蓝牙失败....',
            });
          },
        })
      },
      fail: function (res) {
        that.globalData.StateTest|=0x800;
        console.log('关闭蓝牙蓝牙失败');
        wx.hideLoading();
        wx.showLoading({
          title: '关闭蓝牙失败....',
        });
      },
    });     
  },
  //连接蓝牙
  createBLELink: function() {   
    var that = this;

    wx.stopBluetoothDevicesDiscovery({
      success: function(res) {
        console.log('停止搜索设备', res)
      }
    })
    /* 开始连接蓝牙设备 */
    wx.createBLEConnection({
      deviceId: that.globalData.deviceId,
      success: function (res) {
        console.log(res)
        wx.hideLoading()
        wx.showToast({
          title: '连接成功',
          icon: 'success',
          duration: 1000
        })
        //全局变量
        that.globalData.BLE.link=true;
        that.setStorage_ID();//存储deviceId
        that.goToPageIndex();//跳转主页
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

//蓝牙数据通信
createBLEConnected: function() {   
    var that = this;

  console.log("that.globalData.deviceId:", that.globalData.deviceId)

  /* 获取设备的服务UUID */
  wx.getBLEDeviceServices({
    deviceId: that.globalData.deviceId,
    success: function (service) {
      var all_UUID = service.services; //取出所有的服务
      console.log('所有的服务', all_UUID);
      var UUID_lenght = all_UUID.length; //获取到服务数组的长度
      /* 遍历服务数组 */
      for (var index = 0; index < UUID_lenght; index++) {
        var ergodic_UUID = all_UUID[index].uuid; //取出服务里面的UUID
        var UUID_slice = ergodic_UUID.slice(4, 8); //截取4到8位
        /* 判断是否是我们需要的FFE0 */
        if (UUID_slice == 'FFB0' || UUID_slice == 'ffb0') {
          var index_uuid = index;

          that.globalData.serviceId = all_UUID[index_uuid].uuid; //确定需要的服务UUID
        };
      };
      console.log('需要的服务UUID', that.globalData.serviceId)
      that.getCharacteristics(); //调用获取特征值函数
    },
  });

  //监听连接
  wx.onBLEConnectionStateChange(function (res) {
    console.log(res.connected)

    that.globalData.connected = res.connected;
  })

  //监听数据
  wx.onBLECharacteristicValueChange(function (res) {

    var receiveText = that.buf2hex(res.value);

    console.log('接收到数据：' + receiveText);

    that.globalData.receiveText = receiveText;
    that.receiveService();//接收数据解析
    /*
    const length = that.data.receiveText.length
    that.data.receiveText = [{id:length, data:receive}].concat(that.data.receiveText)
    that.setData({
      receiveText: that.data.receiveText
    })
    <view wx:for="{{receiveText}}" wx:for-index="idx" wx:for-item="item" style="font-size:medium;margin-top:10px">
    {{item.id}}:{{item.data}}
    </view>
  */
  })

},

//获取特征值
getCharacteristics: function () {
  var that = this;
  var device_characteristics = [];
  var characteristics_uuid = {};
  console.log('获取特征值deviceId', that.globalData.deviceId,'serviceId', that.globalData.serviceId);
  wx.getBLEDeviceCharacteristics({
    deviceId: that.globalData.deviceId,
    serviceId: that.globalData.serviceId,
    success: function (res) {
      var characteristics = res.characteristics; //获取到所有特征值
      var characteristics_length = characteristics.length; //获取到特征值数组的长度
      console.log('获取到特征值', characteristics);
      console.log('获取到特征值数组长度', characteristics_length);

      /* 遍历获取characteristicsId */
      for (var index = 0; index < characteristics_length; index++) {
        var characteristics_UUID = characteristics[index].uuid; //取出特征值里面的UUID
        var characteristics_slice = characteristics_UUID.slice(4, 8); //截取4到8位
        /* 判断是否是我们需要的FFB1 */
        if (characteristics_slice == 'FFB1' || characteristics_slice == 'ffb1') {
          var index_uuid = index;
          // that.setData({
          //   characteristicsId_w: characteristics[index_uuid].uuid, //确定的写入UUID
          // });
          that.globalData.characteristicsId_w = characteristics[index_uuid].uuid; //确定的写入UUID

        };
        /* 判断是否是我们需要的FFB2 */
        if (characteristics_slice == 'FFB2' || characteristics_slice == 'ffb2') {
          var index_uuid = index;
          // that.setData({
          //   characteristicsId_r: characteristics[index_uuid].uuid //确定的写入UUID
          // });
          that.globalData.characteristicsId_r = characteristics[index_uuid].uuid; //确定的写入UUID
        };
      };
      console.log('写入characteristicsId', that.globalData.characteristicsId_w);
      console.log('读取characteristicsId', that.globalData.characteristicsId_r);
      //that.SendTap(); //发送指令
      //启用notify
      wx.notifyBLECharacteristicValueChange({
        state: true,
        deviceId: that.globalData.deviceId,
        serviceId: that.globalData.serviceId,
        characteristicId: that.globalData.characteristicsId_r,
        success: function (res) {
          console.log('启用notify成功' + res.errMsg);
        },
        fail: function () {
          console.log('启动notify失败' + res.errMsg);
        },
      })
    },
    fail: function () {
      console.log("获取到特征值fail");
    },
  })
},

//protocol
  //接收数据解析
  receiveService: function () {
    var that = this;
    var checksum = 0;

    var receiveValue = that.string2buf(that.globalData.receiveText);
    var buffer = new Uint8Array(receiveValue);
    if (buffer[0] == 0xFF) {//帧头
      if (buffer[1] == 0xA5) {
        if ((buffer[2] == 0x01) || (buffer[2] == 0x02) || (buffer[2] == 0x03)) {//功能码
          var length = buffer[3];
          for (var i = 0; i < length + 4; i++) {
            checksum += buffer[i];
          }
          checksum &= 0xFF;//校验和低位
          if (checksum == buffer[length + 4]) {//接收数据正确
            console.log('接收数据帧正确：', buffer);
            var address = buffer[4] << 8 | buffer[5];//地址
            that.globalData.BLE.connected=true;
            that.globalData.BLE.refreshAddress=address;
            switch (address) {
              case that.globalData.rcvPara.paraStorge.id: 
              { 
                var u8buffer = buffer.slice(6, 18); 
                that.globalData.rcvPara.paraStorge.value = that.u8ToU16(u8buffer); 
                console.log('数据帧 paraStorge ', that.globalData.rcvPara.paraStorge.value); 
              } 
              break; 
              case that.globalData.rcvPara.paraPowerMode.id: 
                { 
                  var u8buffer = buffer.slice(6, 18); 
                  that.globalData.rcvPara.paraPowerMode.value = that.u8ToU16(u8buffer); 
                  console.log('数据帧 paraPowerMode ', that.globalData.rcvPara.paraPowerMode.value); 
                } 
                break;
              case that.globalData.rcvState.StHardware.id:
                {
                  var u8buffer = buffer.slice(6, 18);
                  that.globalData.rcvState.StHardware.value = that.u8ToU16(u8buffer);
                  console.log('数据帧 StHardware ', that.globalData.rcvState.StHardware.value);
                }
                break;
              case that.globalData.rcvState.StAlarm1.id:
                {
                  var u8buffer = buffer.slice(6, 18);
                  that.globalData.rcvState.StAlarm1.value = that.u8ToU16(u8buffer);
                  console.log('数据帧StAlarm1：', that.globalData.rcvState.StAlarm1.value);
                }
                break;
              case that.globalData.rcvState.StHumidity.id:
                {
                  var u8buffer = buffer.slice(6, 18);
                  that.globalData.rcvState.StHumidity.value = that.u8ToU16(u8buffer);
                  console.log('数据帧StHumidity：', that.globalData.rcvState.StHumidity.value);
                }
                break;
              default:
                break;
            }
//            that.homeDisplay(address);
          }
          else {
            console.log('数据校验错误：', buffer);
          }
        }
      }
    };
  },

  /* 写数据打包 */
  writePack: function (addr, str) {
    var that = this
    var u8Buffer = new Uint8Array(20);
    var u8Str = new Uint8Array(that.string2buf(str));

    u8Buffer[0] = 0xFF;
    u8Buffer[1] = 0xA5;
    u8Buffer[2] = 0x04;
    u8Buffer[3] = u8Str.byteLength + 2;
    u8Buffer[4] = addr >> 8;
    u8Buffer[5] = addr & 0xFF;
    for (var i = 0; i < u8Str.byteLength; i++) {
      u8Buffer[6 + i] = u8Str[i];
    }
    var checksum = 0;
    for (var j = 0; j < i + 6; j++) {
      checksum += u8Buffer[j];
    }
    u8Buffer[j] = checksum & 0xFF;
    var u8Array = u8Buffer.slice(0, j + 1);
    //  console.log("打包数据u8Buffer:",u8Buffer,"u8Array:",u8Array,"checksum:",checksum);   

    var strPack = that.buf2hex(u8Array);
    console.log("打包字符串strPack:", strPack);
    that.writebuffer(strPack);
  },

  /* 发送数据 */
  writebuffer: function (str) {
    var that = this;
    var value = str;

    var DeviceId = that.globalData.deviceId;
    var ServiceId = that.globalData.serviceId;
    var CharacteristicsId = that.globalData.characteristicsId_w;
    console.log('value', value);
    /* 将数值转为ArrayBuffer类型数据 */
    var buffer = that.string2buf(value);
    wx.writeBLECharacteristicValue({
      deviceId: DeviceId,
      serviceId: ServiceId,
      characteristicId: CharacteristicsId,
      value: buffer,
      success: function (res) {
        console.log('数据发送成功', buffer, res);
        wx.showToast({
          title: '发送成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: function (res) {
        console.log('调用失败', res);
        /* 调用失败时，再次调用 */
        wx.writeBLECharacteristicValue({
          deviceId: DeviceId,
          serviceId: ServiceId,
          characteristicId: CharacteristicsId,
          value: buffer,
          success: function (res) {
            console.log('第2次数据发送成功', res);
            wx.showToast({
              title: '发送成功',
              icon: 'success',
              duration: 2000
            })
          },
          fail: function (res) {
            console.log('第2次调用失败', res);
            /* 调用失败时，再次调用 */
            wx.writeBLECharacteristicValue({
              deviceId: DeviceId,
              serviceId: ServiceId,
              characteristicId: CharacteristicsId,
              value: buffer,
              success: function (res) {
                console.log('第3次数据发送成功', res);
                wx.showToast({
                  title: '发送成功',
                  icon: 'success',
                  duration: 2000
                })
              },
              fail: function (res) {
                console.log('第3次调用失败', res);
              }
            });
          }
        });
      }
    });
  },

  //======生命周期方法======
  onLaunch: function () {
    var that = this;  
    console.log('onLaunch');

    // console.log('BLE.link', that.globalData.BLE.link);
    // if(that.globalData.BLE.link==true){
    //   that.createBLEConnected();
    // }
    that.getStorage_ID();//获取ID
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
    console.log('onReady');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('onShow');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

    console.log('onHide');
    var that = this
    //that.closeBLEConnection();//关闭蓝牙连接
  },
  /**
 * 生命周期函数--错误
 */
  onError(msg) {
    console.log(msg)
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('onHide');
    var that = this
    that.closeBLEConnection();//关闭蓝牙连接
  },

})