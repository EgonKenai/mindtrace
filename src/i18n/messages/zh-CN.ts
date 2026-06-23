export const zhCN = {
  metadata: {
    title: "MindTrace",
    description: "个人情绪、压力与睡眠记录工具",
  },
  brand: {
    name: "MindTrace",
    shortDescription: "个人状态记录",
  },
  navigation: {
    ariaLabel: "主导航",
    productBoundary: "产品边界",
    safety: "安全资源",
    settings: "设置",
    today: "今日",
  },
  common: {
    loading: "正在处理…",
    retry: "请稍后重试。",
    required: "必填",
  },
  auth: {
    loginTitle: "登录",
    loginIntro: "继续查看你的个人记录。",
    registerTitle: "创建账户",
    registerIntro: "使用邮箱建立你的私人记录空间。",
    emailLabel: "邮箱",
    passwordLabel: "密码",
    passwordHint: "至少 8 个字符",
    loginAction: "登录",
    registerAction: "注册",
    logoutAction: "退出登录",
    noAccount: "还没有账户？",
    hasAccount: "已经有账户？",
    goToRegister: "创建账户",
    goToLogin: "返回登录",
    errors: {
      invalidCredentials: "邮箱或密码不正确。",
      emailInUse: "该邮箱已注册，请直接登录。",
      weakPassword: "密码至少需要 8 个字符。",
      invalidEmail: "请输入有效邮箱。",
      sessionFailed: "无法建立安全会话，请重试。",
      unknown: "操作未完成，请稍后重试。",
    },
  },
  consent: {
    eyebrow: "首次使用",
    title: "确认产品边界与隐私",
    intro:
      "完成以下确认后，才能进入个人记录功能。你仍可随时查看产品边界和安全资源。",
    adultTitle: "成年确认",
    adultBody: "MindTrace 仅面向达到所在地区法定成年年龄的用户。",
    adultCheckbox: "我确认自己已达到所在地区的法定成年年龄。",
    boundaryTitle: "产品边界",
    boundaryBody:
      "MindTrace 是个人记录工具，不提供疾病诊断、治疗、药物建议，也不替代专业人员或紧急援助。",
    boundaryCheckbox: "我已阅读并理解产品边界。",
    privacyTitle: "隐私说明",
    privacyBody:
      "账户邮箱由 Firebase Authentication 管理。应用数据按用户隔离，日记原文不会写入普通应用日志。",
    privacyCheckbox: "我已阅读并接受当前隐私说明。",
    aiTitle: "AI 数据处理说明",
    aiBody:
      "后续启用 AI 功能时，请求将由服务端最小化处理并发送给配置的 AI 供应商。当前阶段尚未启用 AI。",
    aiCheckbox: "我已阅读并接受当前 AI 数据处理说明。",
    timeZoneLabel: "你的时区",
    timeZoneHint: "用于确定记录所属的本地日期，可稍后在设置中修改。",
    submit: "完成确认",
    errors: {
      incomplete: "请完成全部确认。",
      invalidTimeZone: "请输入有效的 IANA 时区，例如 Asia/Tokyo。",
      saveFailed: "保存确认失败，请重试。",
    },
  },
  home: {
    todayTitle: "今日",
    readyTitle: "账户已准备好",
    pendingFeature: "今日记录尚未开放。",
  },
  settings: {
    title: "设置",
    accountSection: "账户状态",
    timeZoneLabel: "时区",
    accessReady: "个人功能已启用",
    accessPending: "尚未完成成年确认和当前版本同意",
    continueConsent: "继续完成确认",
  },
  boundary: {
    title: "产品边界",
    intro:
      "MindTrace 帮助成年人记录情绪、压力、精力、睡眠和生活事件，并观察个人记录中可能出现的规律。",
    notTherapyTitle: "不是治疗或诊断工具",
    notTherapyBody:
      "MindTrace 不诊断任何疾病，不提供药物建议，也不替代医生、心理咨询师或其他专业人员。",
    uncertaintyTitle: "谨慎描述规律",
    uncertaintyBody:
      "未来的 AI 反馈只会描述可能的关联，不会把相关性表述为因果关系。",
    controlTitle: "你控制自己的数据",
    controlBody:
      "用户可以访问、导出和删除自己的数据。个人功能必须经过登录和服务端授权。",
  },
  safety: {
    title: "危机与安全资源",
    urgentTitle: "如果危险正在发生",
    urgentBody:
      "如果你或他人可能立即受伤，请立即联系当地紧急服务，或前往最近的急诊机构。",
    contactTitle: "现在联系一个人",
    contactBody:
      "尽量不要独处。联系一位你信任的人，直接告诉对方你现在需要陪伴或帮助。",
    professionalTitle: "寻求专业支持",
    professionalBody:
      "联系当地心理健康专业人员、危机热线或医疗机构。MindTrace 不能提供紧急援助。",
    availability: "此页面始终免费，无需登录。",
  },
  notFound: {
    title: "页面不存在",
    action: "返回 MindTrace",
  },
  api: {
    unauthorized: "需要登录。",
    consentRequired: "需要先完成成年确认和当前版本同意。",
  },
} as const;

export type Messages = typeof zhCN;
