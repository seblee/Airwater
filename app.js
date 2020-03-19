//app.js
App({

  //======全局变量====== 
  globalData: {
    txConfig:{
      CoNormalWater:{
        id : 110,
        value : '00011388',
      },      
      WaterStop:{
        id : 110,
        value : '00000000',
      },
      CoHeatWater:{
        id : 110,
        value : '00021388',
      },
    },
    rcvState:{
      StHardware:{
        id : 500,//连续6个寄存器
        value : 0,
      },
      StAlarm1:{
        id : 506,
        value : 0,
      },
      StHumidity :{
        id : 512,
        value : 0,
      }, 
      StAin4 :{
        id : 518,
        value : 0,
      }, 
      StRuntimeComp2:{
        id : 524,
        value : 0,
      }, 
      StReserve:{
        id : 530,
        value : 0,
      }, 
      StStatusRemap:{
        id : 536,
        value : 0,
      }, 
    },
    userInfo: null,
    g_BdeviceId : "",
    g_BserviceId: "",
    g_BcharacteristicId: "",
  },
  //======应用程序全局方法======
  /**
* 将字符串转换成ArrayBufer
*/
 string2buf(str) {
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
 u8ToU16(buffer){
  var u16Buffer= new Uint16Array(buffer);
  var length= u16Buffer.byteLength/2/2;

  for(var i=0;i<length;i++)
  {
    u16Buffer[i]=u16Buffer[i*2]<<8|u16Buffer[i*2+1]
  }
  var u16Array=u16Buffer.slice(0,i);
  return u16Array;
},
  //关闭蓝牙连接
  closeBLEConnection: function() {
    var that = this
    var deviceId=that.globalData.g_BdeviceId;
    console.log("deviceId:",deviceId);
    wx.closeBLEConnection({
      deviceId: deviceId,
      success: function(res) {
        console.log('断开设备连接', res);
      }
    });    
  },
  //存储ID
  setStorage_ID: function() {
    var that = this
    console.log("setStorage_ID:",that.globalData.g_BdeviceId);
    wx.setStorageSync('g_BdeviceId', that.globalData.g_BdeviceId);  
  },
  //获取ID
  getStorage_ID: function() {
    var that = this
    that.globalData.g_BdeviceId=wx.getStorageSync('g_BdeviceId');  
    console.log("getStorage_ID:",that.globalData.g_BdeviceId);
  },

  /* 写数据打包 */
  writePack: function(addr,str) {
    var that = this
    var u8Buffer= new Uint8Array(20);
    var u8Str= new Uint8Array(that.string2buf(str));

    u8Buffer[0]=0xFF;
    u8Buffer[1]=0xA5;
    u8Buffer[2]=0x04;
    u8Buffer[3]=u8Str.byteLength+2;
    u8Buffer[4]=addr>>8;
    u8Buffer[5]=addr&0xFF;
    for(var i=0;i<u8Str.byteLength;i++)
    {
      u8Buffer[6+i]=u8Str[i];
    }
    var checksum=0;
    for(var j=0;j<i+6;j++){
      checksum +=u8Buffer[j];
    }
    u8Buffer[j]=checksum&0xFF;
    var u8Array=u8Buffer.slice(0,j+1);
  //  console.log("打包数据u8Buffer:",u8Buffer,"u8Array:",u8Array,"checksum:",checksum);   

    var strPack= that.buf2hex(u8Array);
    console.log("打包字符串strPack:",strPack);   
    that.writebuffer(strPack);
  },

  /* 发送数据 */
  writebuffer: function(str) {
    var that = this;
    var value = str;

    var DeviceId = that.globalData.g_BdeviceId;
    var ServiceId = that.globalData.g_BserviceId;
    var CharacteristicsId = that.globalData.g_BcharacteristicId;
    console.log('value', value);
    /* 将数值转为ArrayBuffer类型数据 */
    var buffer = that.string2buf(value);
    wx.writeBLECharacteristicValue({
      deviceId: DeviceId,
      serviceId: ServiceId,
      characteristicId: CharacteristicsId,
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
          deviceId: DeviceId,
          serviceId: ServiceId,
          characteristicId: CharacteristicsId,
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
              deviceId: DeviceId,
              serviceId: ServiceId,
              characteristicId: CharacteristicsId,
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

  //======生命周期方法======
  onLaunch: function () {
    console.log('onLaunch');
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
  onError (msg) {
    console.log(msg)
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    console.log('onHide');
    var that = this
    that.closeBLEConnection();//关闭蓝牙连接
  },

})