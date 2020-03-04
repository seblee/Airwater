//index.js
//获取应用实例
const app = getApp()

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
    var_Temp:20,
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    inputText: 'FFA50303010203B0',
    receiveText: '',
    name: '',
    deviceId: '',
    serviceId: {}, 
    writeWithoutResponseId: {},
    readNotifyId: {},
    connected: true
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
    //事件处理函数,按钮测试
  btn_Temp_Add:function(){
   this.setData({
      var_Temp:23
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
    if (that.data.connected) {

      that.writebuffer(that.data.inputText); //调用数据发送函数
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
    console.log(app.globalData.g_BdeviceId)
    that.setData({
      deviceId: app.globalData.g_BdeviceId
    })

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
      },
    });
    //监听连接
    wx.onBLEConnectionStateChange(function (res) {
      console.log(res.connected)
      that.setData({
        connected: res.connected
      })
    })
    //监听数据
    wx.onBLECharacteristicValueChange(function (res) {
      var receiveText = buf2hex(res.value)
      console.log('接收到数据：' + receiveText)
      that.setData({
        receiveText: receiveText
      })
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
              writeWithoutResponseId: characteristics[index_uuid].uuid //确定的写入UUID
            });
          };
          if (characteristics_slice == 'FFB2' || characteristics_slice == 'ffb2') {
            var index_uuid = index;
            that.setData({
              readNotifyId: characteristics[index_uuid].uuid //确定的read UUID
            });
          };
        };
        console.log('readNotifyId', that.data.readNotifyId);
        console.log('writeWithoutResponseId', that.data.writeWithoutResponseId);
        //that.SendTap(); //发送指令
        //启用notify
        wx.notifyBLECharacteristicValueChange({
          state: true,
          deviceId: that.data.deviceId,
          serviceId: that.data.serviceId,
          characteristicId: that.data.readNotifyId,
          success: function (res) {
            console.log('启用notify成功'+ res.errMsg);
          },            
          fail: function () {
            console.log('启动notify失败' + res.errMsg);
          },
        })
      },
    })
  },
  /* 发送指令 */
  SendTap: function() {
    var that = this;
    var value_ascii = "";
    var value_initial = "FF010203"; //发送的信息
    console.log('输入框中的值', value_initial);
    
    /* 以Ascii字符发送 */
    /*
    var value_split = value_initial.split(''); //将字符一个一个分开
    console.log('value_split', value_split);
    for (var i = 0; i < value_split.length; i++) {
      value_ascii = value_ascii + value_split[i].charCodeAt().toString(16); //转为Ascii字符后连接起
    }
    var value = value_ascii;
    console.log('转为Ascii码值', value);
    */
    var value = value_initial;
    var write_function = that.writebuffer(value); //调用数据发送函数
  },

    /* 写数据 */
  writebuffer: function(str) {
    var that = this;
    var value = str;
    console.log('value', value);
    /* 将数值转为ArrayBuffer类型数据 */
    var buffer = string2buf(value);
    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      characteristicId: that.data.writeWithoutResponseId,
      value: buffer,
      success: function(res) {
        console.log('数据发送成功', buffer,res);
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
          characteristicId: that.data.writeWithoutResponseId,
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
              characteristicId: that.data.writeWithoutResponseId,
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

})
