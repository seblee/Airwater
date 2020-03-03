//start.js
//获取应用实例
var app = getApp();

/**
* 将字符串转换成ArrayBufer
*/
function string2buf(str) {
  let val = ""
  if(!str) return;
  let length = str.length;
  let index = 0;
  let array = []
  while(index < length){
    array.push(str.substring(index,index+2));
    index = index + 2;
  }
  val = array.join(",");
  // 将16进制转化为ArrayBuffer
  return new Uint8Array(val.match(/[\da-f]{2}/gi).map(function (h) {
    return parseInt(h, 16)
  })).buffer
}

/**
 * 将ArrayBuffer转换成字符串
 */
function buf2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

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
                console.log('deviceName', deviceName);
                //添加延迟
                setTimeout(() => {
                  wx.getBluetoothDevices({
                    success: function(res) {
                      console.log(res);
                      //在搜索到的所有蓝牙中找到需要连接的那一个蓝牙
                      for (var i = 0; i < res.devices.length; i++) {
                        if (res.devices[i].name == deviceName) {
                        //if (res.devices[i].name == that.data.inputValue) {
                          that.setData({
                            deviceId: res.devices[i].deviceId,
                          })
                          console.log(res.devices[i].deviceId)
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
      success: function(res) {
        console.log('连接成功', res);
        wx.hideLoading();
        /* 获取设备的服务UUID */
        wx.getBLEDeviceServices({
          deviceId: that.data.deviceId,
          success: function(service) {
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
                that.setData({
                  serviceId: all_UUID[index_uuid].uuid //确定需要的服务UUID
                });
              };
            };
            console.log('需要的服务UUID', that.data.serviceId)
            that.GetCharacteristics(); //调用获取特征值函数
            that.goToIndex();//跳转主页
          },
        });
      },
    })
  },

  //获取特征值
  GetCharacteristics: function() {
    var that = this;
    var device_characteristics = [];
    var characteristics_uuid = {};
    wx.getBLEDeviceCharacteristics({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      success: function(res) {
        var characteristics = res.characteristics; //获取到所有特征值
        var characteristics_length = characteristics.length; //获取到特征值数组的长度
        console.log('获取到特征值', characteristics);
        console.log('获取到特征值数组长度', characteristics_length);

        /* 遍历获取characteristicsId */
        for (var index = 0; index < characteristics_length; index++) {
          var characteristics_UUID = characteristics[index].uuid; //取出特征值里面的UUID
          var characteristics_slice = characteristics_UUID.slice(4, 8); //截取4到8位
          /* 判断是否是我们需要的FFE1 */
          if (characteristics_slice == 'FFB1' || characteristics_slice == 'ffb1') {
            var index_uuid = index;
            that.setData({
              characteristicsId: characteristics[index_uuid].uuid //确定的写入UUID
            });
          };
        };
        console.log('写入characteristicsId', that.data.characteristicsId);
        that.SendTap(); //发送指令
      },
    })
  },
  /* 发送指令 */
  SendTap: function() {
    var that = this;
    var value_ascii = "";
    var value_initial = "01"; //发送的信息
    console.log('输入框中的值', value_initial);
    /* 以Ascii字符发送 */
    var value_split = value_initial.split(''); //将字符一个一个分开
    console.log('value_split', value_split);
    for (var i = 0; i < value_split.length; i++) {
      value_ascii = value_ascii + value_split[i].charCodeAt().toString(16); //转为Ascii字符后连接起
    }
    var value = value_ascii;
    console.log('转为Ascii码值', value);
    var write_function = that.writebuffer(value); //调用数据发送函数
  },
   /* 写数据 */
  writebuffer: function(str) {
    var that = this;
    var value = str;
    console.log('value', value);
    /* 将数值转为ArrayBuffer类型数据 */
    /*
    var typedArray = new Uint8Array(value.match(/[\da-f]{2}/gi).map(function(h) {
      return parseInt(h, 16)
    }));
    var buffer = typedArray.buffer;
    */
    var buffer = string2buf(value);
    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      characteristicId: that.data.characteristicsId,
      value: buffer,
      success: function(res) {
        console.log('数据发送成功', res);
        wx.showToast({
          title: '发送成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: function(res) {
        console.log('调用失败', res);
        /* 调用失败时，再次调用 */
        wx.writeBLECharacteristicValue({
          deviceId: that.data.deviceId,
          serviceId: that.data.serviceId,
          characteristicId: that.data.characteristicsId,
          value: buffer,
          success: function(res) {
            console.log('第2次数据发送成功', res);
            wx.showToast({
              title: '发送成功',
              icon: 'success',
              duration: 2000
            })
          },
          fail: function(res) {
            console.log('第2次调用失败', res);
            /* 调用失败时，再次调用 */
            wx.writeBLECharacteristicValue({
              deviceId: that.data.deviceId,
              serviceId: that.data.serviceId,
              characteristicId: that.data.characteristicsId,
              value: buffer,
              success: function(res) {
                console.log('第3次数据发送成功', res);
                wx.showToast({
                  title: '发送成功',
                  icon: 'success',
                  duration: 2000
                })
              },
              fail: function(res) {
                console.log('第3次调用失败', res);
              }
            });
          }
        });
      }
    });
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
  },
})