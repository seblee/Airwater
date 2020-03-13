//index.js
//获取应用实例
var app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    //状态显示变量
    State:{
          runState: 0 ,//运行状态
          Temperture:23 ,//温度
          Humidity: 50 ,//湿度
          WaterLevel: 0 ,//水位
          WaterMake: 0 ,//制水
          Fan: 0 ,//风机
    },
    inputText: 'FFA50303010203B0',
    receiveText: '',
    name: '',
    deviceId: '',
    serviceId: {},
    characteristicsId_w: {},
    characteristicsId_r: {},
    connected: true

  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
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
    console.log('按键发送bindSend');    
    this.setData({
      'State.Humidity':55 ,
      'State.Temperture':23 ,
    })
    if (that.data.connected) {

      app.writeBuffer(that.data.inputText); //调用数据发送函数
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
//出常温水
outNormal: function () {
  var that = this
  console.log('出常温水outNormal');    

  if (that.data.connected) {
    app.writePack(app.globalData.txConfig.CoNormalWater.id,app.globalData.txConfig.CoNormalWater.value);//调用数据发送函数
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
    console.log('index页面onLoad');
    console.log("app.globalData.g_BdeviceId:",app.globalData.g_BdeviceId)
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
            app.globalData.g_BserviceId=that.data.serviceId;
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

      var receiveText = app.buf2hex(res.value)

      console.log('接收到数据：' + receiveText)
      that.setData({
        receiveText: receiveText
      })
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
//主页面数据刷新
homeDisplay:function(){

  console.log('主页面数据刷新')
  this.setData({
    'State.Humidity':app.globalData.rcvState.StHumidity.value[0]/10 ,
    'State.Temperture':app.globalData.rcvState.StAlarm1.value[5]/10,
  })
},
//protocol
//接收数据解析
receiveService:function(){
  var that = this;
  var length ;
  var checksum = 0 ;
  var address = 0 ;
  var i ;

  var receiveValue = app.string2buf(that.data.receiveText);
  var buffer = new Uint8Array(receiveValue); 
  if(buffer[0]==0xFF){//帧头
    if(buffer[1]==0xA5){     
      if((buffer[2]==0x01)||(buffer[2]==0x02)||(buffer[2]==0x03)){//功能码
        length=buffer[3];
        for(i=0;i<length+4;i++){
          checksum +=buffer[i];
        }
        checksum &= 0xFF;//校验和低位
        if(checksum==buffer[length+4]) {
          console.log('接收数据帧正确：', buffer); 
          address=buffer[4]<<8|buffer[5];//地址
          switch(address){
            case app.globalData.rcvState.StAlarm1.id :
            {
              var u8buffer=buffer.slice(6,18);
              app.globalData.rcvState.StAlarm1.value=app.u8ToU16(u8buffer);
              console.log('数据帧StAlarm1：', app.globalData.rcvState.StAlarm1.value);      
            }
              break;
            case app.globalData.rcvState.StHumidity.id :
            {
              var u8buffer=buffer.slice(6,18);
              app.globalData.rcvState.StHumidity.value=app.u8ToU16(u8buffer);
              console.log('数据帧StHumidity：', app.globalData.rcvState.StHumidity.value);      
            }
              break;
            default:
              break;
          }
          that.homeDisplay();
        }
        else{
          console.log('数据校验错误：', buffer);                
        }
      } 
    }     
  };
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
          /* 判断是否是我们需要的FFB1 */
          if (characteristics_slice == 'FFB1' || characteristics_slice == 'ffb1') {
            var index_uuid = index;
            that.setData({
              characteristicsId_w: characteristics[index_uuid].uuid, //确定的写入UUID
            });
            app.globalData.g_BcharacteristicId=that.data.characteristicsId_w;
          };
          /* 判断是否是我们需要的FFB2 */
          if (characteristics_slice == 'FFB2' || characteristics_slice == 'ffb2') {
            var index_uuid = index;
            that.setData({
              characteristicsId_r: characteristics[index_uuid].uuid //确定的写入UUID
            });
          };
        };
        console.log('写入characteristicsId', that.data.characteristicsId_w);
        console.log('读取characteristicsId', that.data.characteristicsId_r);
        //that.SendTap(); //发送指令
        //启用notify
        wx.notifyBLECharacteristicValueChange({
          state: true,
          deviceId: that.data.deviceId,
          serviceId: that.data.serviceId,
          characteristicId: that.data.characteristicsId_r,
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




})
