// index.js
// 快递公司识别规则（更宽松的匹配）
const expressRules = [
  {
    name: '顺丰速运',
    patterns: [/^sf/i]  // SF开头
  },
  {
    name: '圆通速递',
    patterns: [/^yt/i, /^yunda/i]  // YT开头
  },
  {
    name: '极兔速递',
    patterns: [/^jt/i]  // JT开头
  },
  {
    name: '京东物流',
    patterns: [/^jd/i, /^JDVA/i, /^JDVB/i, /^JDVC/i]  // JD开头
  },
  {
    name: 'EMS',
    patterns: [/^e[a-z]\d/i, /^ems/i, /^EA\d/i, /^EB\d/i, /^EC\d/i, /^ED\d/i, /^EE\d/i]  // EMS相关
  },
  {
    name: '中通快递',
    patterns: [/^7[3-5]\d{11}$/, /^2\d{11,12}$/]  // 73/74/75开头13位，或2开头12-13位
  },
  {
    name: '申通快递',
    patterns: [/^7[7-9]\d{11}$/, /^88\d{10,11}$/]  // 77/78/79开头13位，或88开头12-13位
  },
  {
    name: '百世快递',
    patterns: [/^70\d{11,12}$/, /^71\d{11,12}$/]  // 70/71开头13-14位
  },
  {
    name: '韵达快递',
    patterns: [/^\d{10,15}$/]  // 纯数字10-15位（最后匹配，避免误判）
  },
  {
    name: '邮政快递',
    patterns: [/^1[0-9]\d{11}$/, /^99\d{11}$/, /^98\d{11}$/]  // 1开头13位，或99/98开头13位
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

// 快递公司列表（用于手动选择）
const companyList = [
  '顺丰速运',
  '中通快递',
  '圆通速递',
  '韵达快递',
  '申通快递',
  '百世快递',
  '极兔速递',
  '邮政快递',
  'EMS',
  '京东物流'
];

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
    errorMessage: '',
    showManualSelect: false,
    companyList: companyList,
    companyIndex: -1
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
      trackingList: [],
      showManualSelect: false,
      companyIndex: -1
    });
  },

  onCompanyChange(e) {
    const index = e.detail.value;
    const companyName = companyList[index];
    const companyCode = expressCodeMap[companyName];
    const trackingNumber = this.data.trackingNumber.trim();
    
    this.setData({
      companyIndex: index,
      companyName: companyName,
      companyCode: companyCode,
      showResult: true,
      showError: false,
      isLoading: true
    });
    
    // 查询物流信息
    this.queryExpressInfo(trackingNumber, companyCode);
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
      // 本地无法识别，尝试使用快递100智能识别
      this.setData({
        showResult: true,
        companyName: '智能识别中...',
        isLoading: true
      });
      this.autoIdentifyAndQuery(trackingNumber);
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
  },

  // 快递100智能识别API
  autoIdentifyAndQuery(trackingNumber) {
    const that = this;
    
    wx.request({
      url: 'https://www.kuaidi100.com/autonumber/auto',
      data: {
        num: trackingNumber,
        key: API_CONFIG.key
      },
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.auto && res.data.auto.length > 0) {
          const companyCode = res.data.auto[0].comCode;
          const companyName = res.data.auto[0].name || '快递公司';
          
          that.setData({
            companyName: companyName,
            companyCode: companyCode
          });
          
          // 查询物流信息
          that.queryExpressInfo(trackingNumber, companyCode);
        } else {
          that.setData({
            isLoading: false,
            showError: true,
            errorMessage: '无法自动识别快递公司，请手动选择',
            showManualSelect: true
          });
        }
      },
      fail(err) {
        console.error('智能识别失败：', err);
        that.setData({
          isLoading: false,
          showError: true,
          errorMessage: '智能识别失败，请手动选择快递公司',
          showManualSelect: true
        });
      }
    });
  }
});