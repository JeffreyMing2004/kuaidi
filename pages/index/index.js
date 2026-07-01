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

Page({
  data: {
    trackingNumber: '',
    companyName: '',
    trackingInfo: '',
    showResult: false,
    showError: false,
    errorMessage: ''
  },

  onInput(e) {
    this.setData({
      trackingNumber: e.detail.value
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
      trackingInfo: ''
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
      this.setData({
        showResult: true,
        companyName: company,
        trackingInfo: '暂无物流信息（如需查询物流信息，请集成快递查询API）'
      });
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
  }
});