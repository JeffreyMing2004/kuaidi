// index.js
// 快递公司识别规则
const expressRules = [
  {
    name: '顺丰速运',
    patterns: [/^SF\d{13}$/, /^sf\d{13}$/]
  },
  {
    name: '中通快递',
    patterns: [/^7[3-5]\d{11}$/, /^2\d{11}$/]
  },
  {
    name: '圆通速递',
    patterns: [/^YT\d{13}$/, /^yt\d{13}$/]
  },
  {
    name: '韵达快递',
    patterns: [/^\d{13}$/, /^\d{10}$/]
  },
  {
    name: '申通快递',
    patterns: [/^7[7-9]\d{11}$/, /^88\d{10}$/]
  },
  {
    name: '百世快递',
    patterns: [/^7\d{12}$/, /^70\d{11}$/]
  },
  {
    name: '极兔速递',
    patterns: [/^JT\d{13}$/, /^jt\d{13}$/]
  },
  {
    name: '邮政快递',
    patterns: [/^1[0-9]\d{11}$/, /^99\d{11}$/]
  },
  {
    name: 'EMS',
    patterns: [/^E[A-Z]\d{9}CN$/, /^e[a-z]\d{9}cn$/]
  },
  {
    name: '京东物流',
    patterns: [/^JD[A-Z]\d{11}$/, /^jd[a-z]\d{11}$/]
  }
];

// 快递公司名称到快递100编码的映射
const expressCodeMap = {
  '顺丰速运': 'shunfeng',
  '中通快递': 'zhongtong',
  '圆通速递': 'yuantong',
  '韵达快递': 'yunda',
  '申通快递': 'shentong',
  '百世快递': 'huitongkuaidi',
  '极兔速递': 'jtexpress',
  '邮政快递': 'youzhengguonei',
  'EMS': 'ems',
  '京东物流': 'jd'
};

// 快递100 API配置
const API_CONFIG = {
  key: 'MvRZNCip8908', // 用户提供的API key
  baseUrl: 'https://api.kuaidi100.com/api'
};

Page({
  data: {
    trackingNumber: '',
    companyName: '',
    companyCode: '',
    trackingInfo: '',
    trackingList: [],
    showResult: false,
    showError: false,
    isLoading: false,
    errorMessage: ''
  },

  onInput(e) {
    this.setData({
      trackingNumber: e.detail.value
    });
  },

  onClear() {
    this.setData({
      trackingNumber: '',
      showResult: false,
      showError: false,
      errorMessage: '',
      companyName: '',
      companyCode: '',
      trackingInfo: '',
      trackingList: []
    });
  },

  onQuery() {
    const trackingNumber = this.data.trackingNumber.trim();
    
    // 重置状态
    this.setData({
      showResult: false,
      showError: false,
      errorMessage: '',
      companyName: '',
      companyCode: '',
      trackingInfo: '',
      trackingList: []
    });
    
    // 验证输入
    if (!trackingNumber) {
      this.setData({
        showError: true,
        errorMessage: '请输入快递单号'
      });
      return;
    }
    
    // 识别快递公司
    const company = this.identifyExpressCompany(trackingNumber);
    
    if (company) {
      const companyCode = expressCodeMap[company];
      this.setData({
        showResult: true,
        companyName: company,
        companyCode: companyCode,
        isLoading: true
      });
      
      // 调用快递100 API查询物流信息
      this.queryExpressInfo(trackingNumber, companyCode);
    } else {
      this.setData({
        showError: true,
        errorMessage: '无法识别该快递单号，请检查单号是否正确'
      });
    }
  },

  identifyExpressCompany(trackingNumber) {
    for (const rule of expressRules) {
      for (const pattern of rule.patterns) {
        if (pattern.test(trackingNumber)) {
          return rule.name;
        }
      }
    }
    return null;
  },

  queryExpressInfo(trackingNumber, companyCode) {
    const that = this;
    
    // 构建API请求参数
    const param = {
      com: companyCode,
      nu: trackingNumber,
      show: '0', // 返回JSON格式
      muti: '1', // 返回多行信息
      order: 'desc' // 按时间倒序
    };
    
    // 发起请求
    wx.request({
      url: API_CONFIG.baseUrl,
      data: {
        id: API_CONFIG.key,
        com: param.com,
        nu: param.nu,
        show: param.show,
        muti: param.muti,
        order: param.order
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        that.setData({
          isLoading: false
        });
        
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          
          if (data.status === '1' && data.data && data.data.length > 0) {
            // 查询成功，显示物流信息
            const trackingList = data.data.map(item => ({
              time: item.time,
              context: item.context
            }));
            
            that.setData({
              trackingList: trackingList,
              trackingInfo: trackingList[0].context // 显示最新一条物流信息
            });
          } else {
            // 查询失败或无结果
            that.setData({
              showError: true,
              errorMessage: data.message || '暂无物流信息，请稍后再试'
            });
          }
        } else {
          that.setData({
            showError: true,
            errorMessage: '网络请求失败，请检查网络连接'
          });
        }
      },
      fail(err) {
        console.error('API请求失败：', err);
        that.setData({
          isLoading: false,
          showError: true,
          errorMessage: '网络请求失败，请检查网络连接'
        });
      }
    });
  }
});