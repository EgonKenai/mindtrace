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
    history: "历史",
    longTerm: "长期摘要",
    overview: "总览",
    plans: "计划",
    productBoundary: "产品边界",
    safety: "安全资源",
    settings: "设置",
    today: "今日",
    trends: "趋势",
  },
  common: {
    cancel: "取消",
    loading: "正在处理…",
    retryAction: "重试",
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
      "使用 AI 反馈时，服务端会把评分、受控标签和截断后的日记文字发送给第三方 AI Provider。Provider 可能为滥用监测保留提示词和输出；MindTrace 不发送账户标识、Cookie 或 token。",
    aiCheckbox: "我同意当前版本的第三方 AI 数据处理说明。",
    aiOptionalHint:
      "此项可选。不同意不会影响日记、历史或趋势；系统不会调用第三方 AI Provider。",
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
    eyebrow: "MVP 演示路径",
    title: "从一次记录开始，看见趋势，再选择下一步",
    intro:
      "MindTrace 帮助成年人记录情绪、压力、精力、睡眠和生活事件，回看趋势与长期摘要。AI 相关内容仅供反思参考，不会自动替你做决定，也不是医疗诊断或治疗建议。",
    actionsLabel: "总览页主要操作",
    primaryAction: "记录今天",
    secondaryAction: "查看历史",
    demoTitle: "建议演示顺序",
    demoIntro:
      "如果数据还不够，可以先记录几天日记；趋势和长期摘要会明确显示空日期，不会伪造为 0。",
    demoSteps: [
      {
        title: "记录状态",
        body: "保存一条今日记录，包含评分、睡眠、事件标签和可选文字。",
        href: "/zh-CN/today",
      },
      {
        title: "回看历史",
        body: "按发生时间倒序查看记录，列表只展示安全预览。",
        href: "/zh-CN/history",
      },
      {
        title: "查看 7 天趋势",
        body: "按用户本地日期聚合同日多条记录，缺失日期保持为空。",
        href: "/zh-CN/trends",
      },
      {
        title: "查看长期摘要",
        body: "切换 7、14、30 天窗口，查看非诊断性的低风险回顾。",
        href: "/zh-CN/long-term",
      },
      {
        title: "创建手动计划",
        body: "先由用户创建和确认行动计划，AI 草稿不会自动保存为计划。",
        href: "/zh-CN/plans",
      },
    ],
    infoAriaLabel: "MindTrace 核心功能说明",
    infoCards: [
      {
        title: "每日记录",
        body: "同一天可以记录多次，系统使用服务端会话识别用户，不接受客户端传入的 ownerId。",
      },
      {
        title: "趋势与摘要",
        body: "趋势、长期摘要和计划都基于自己的记录生成，日期边界使用保存时的本地日期。",
      },
      {
        title: "AI 低风险草稿",
        body: "AI 反馈、计划建议和长期洞察都需要独立同意，只生成可选草稿或反思参考。",
      },
    ],
    aiBoundaryTitle: "AI 仅供反思参考",
    aiBoundaryBody:
      "MindTrace 不提供诊断、治疗、用药或紧急响应。AI 功能默认使用测试配置；真实 Gemini 需要手动配置并单独验证。",
    safetyAction: "查看安全资源",
    boundaryAction: "查看产品边界",
  },
  journal: {
    today: {
      eyebrow: "状态记录",
      title: "记录此刻的状态",
      intro: "记录情绪、压力、精力、睡眠和生活事件。同一天可以保存多条记录。",
    },
    form: {
      moodLabel: "情绪",
      moodHint: "1 表示很低，10 表示很好。",
      stressLabel: "压力",
      stressHint: "1 表示很低，10 表示很高。",
      energyLabel: "精力",
      energyHint: "1 表示很低，10 表示很充足。",
      sleepHoursLabel: "睡眠时长",
      sleepHoursHint: "输入 0 到 24 小时，可以使用小数。",
      hoursUnit: "小时",
      sleepQualityLabel: "睡眠质量",
      sleepQualityHint: "1 表示很差，10 表示很好。",
      eventTagsLabel: "生活事件",
      eventTagsHint: "选择 1 到 5 个最相关的标签。",
      noteLabel: "文字记录",
      noteHint: "可选。请避免记录不必要的身份信息。",
      occurredAtLabel: "发生时间",
      occurredAtHint: "默认是当前时间，你可以按实际情况修改。",
      characters: "字符",
    },
    actions: {
      submit: "保存记录",
      submitting: "正在保存",
      saveChanges: "保存修改",
      savingChanges: "正在保存",
      edit: "编辑记录",
      delete: "删除记录",
      viewEntry: "查看这条记录",
      continueEntry: "继续记录",
      viewHistory: "查看历史",
      loadMore: "加载更多",
      loadingMore: "正在加载",
      backToHistory: "返回历史记录",
    },
    errors: {
      mood: "请输入 1 到 10 的整数。",
      stress: "请输入 1 到 10 的整数。",
      energy: "请输入 1 到 10 的整数。",
      sleepHours: "请输入 0 到 24 之间的数字。",
      sleepQuality: "请输入 1 到 10 的整数。",
      eventTags: "请选择 1 到 5 个不重复的生活事件标签。",
      note: "文字记录不能超过 5000 个 Unicode 字符。",
      occurredAt: "请选择有效的发生时间。",
      invalidRequest: "部分内容不符合要求，请检查标出的字段。",
      loadFailed: "记录加载失败，请稍后重试。",
      saveFailed: "记录未能保存，请稍后重试。",
      deleteFailed: "记录未能删除，请稍后重试。",
      notFound: "无法找到这条记录。",
    },
    success: {
      title: "记录已保存",
      body: "这条记录已经安全保存到你的个人历史中。",
      updatedTitle: "修改已保存",
      updatedBody: "详情已刷新为最新版本。",
    },
    history: {
      eyebrow: "个人历史",
      title: "历史记录",
      intro: "按发生时间从新到旧查看记录，每次只加载一页。",
      loading: "正在加载历史记录…",
      emptyTitle: "还没有记录",
      emptyBody:
        "先去今日记录保存一条状态记录；之后它会出现在这里，列表只展示安全预览。",
      errorTitle: "无法加载历史记录",
      noMore: "已经显示全部记录。",
      noteEmpty: "没有文字记录",
    },
    detail: {
      eyebrow: "记录详情",
      title: "记录详情",
      loading: "正在加载记录…",
      editTitle: "编辑记录",
      fullNote: "文字记录",
      createdAt: "创建时间",
      updatedAt: "更新时间",
      revision: "版本",
      notFoundTitle: "记录不可用",
      notFoundBody: "这条记录不存在，或你没有权限查看。",
    },
    deleteDialog: {
      title: "确认删除这条记录",
      body: "删除后，这条记录将从当前数据中移除。此操作无法在页面中撤销。",
      confirm: "确认删除",
      deleting: "正在删除",
    },
    eventTags: {
      work: "工作",
      job_search: "求职",
      study: "学习",
      sleep: "睡眠",
      family: "家庭",
      relationship: "亲密关系",
      social: "社交",
      finance: "财务",
      health_routine: "健康习惯",
      travel: "出行",
      other: "其他",
    },
  },
  trends: {
    eyebrow: "最近状态",
    title: "最近 7 天趋势",
    intro:
      "按账户当前时区查看最近 7 个本地日期。每天的数值汇总该日期下的全部记录。",
    loading: "正在加载最近 7 天趋势…",
    errorTitle: "无法加载趋势",
    errorBody: "趋势数据暂时不可用，请稍后重试。",
    emptyTitle: "最近 7 天还没有记录",
    emptyBody:
      "先记录几天日记后再回来查看趋势。没有记录的日期会保留为空，不会显示为 0。",
    noData: "无记录",
    summaryTitle: (recordedDays: number, totalDays: number) =>
      `${totalDays} 天中有 ${recordedDays} 天留下记录`,
    summaryBody: (totalEntries: number, timeZone: string) =>
      `共汇总 ${totalEntries} 条记录，日期边界采用 ${timeZone}。`,
    aggregationNote:
      "同一本地日期有多条记录时，每项指标取当天全部记录的算术平均值，结果最多保留两位小数。",
    chartAriaLabel: (metric: string) => `${metric}最近 7 天图表`,
    pointAriaLabel: (date: string, value: string) => `${date}：${value}`,
    scaleLabel: (min: number, max: number, unit: string) =>
      `范围 ${min}–${max}${unit}`,
    tableTitle: "可访问数据表",
    tableIntro: "表格列出全部 7 个本地日期；无记录日期明确标记为空。",
    tableRegionLabel: "最近 7 天趋势数据表，可横向滚动",
    metrics: {
      mood: "情绪",
      stress: "压力",
      energy: "精力",
      sleepHours: "睡眠时长",
      sleepQuality: "睡眠质量",
    },
    units: {
      score: " 分",
      hours: " 小时",
    },
    table: {
      date: "本地日期",
      entryCount: "记录数",
    },
  },
  longTerm: {
    eyebrow: "长期回顾",
    title: "长期摘要",
    intro:
      "按用户本地日期回顾最近 7、14 或 30 天的记录。摘要由确定性算法生成，不调用 Gemini，也不复制完整日记正文。",
    loading: "正在加载长期摘要…",
    errorTitle: "无法加载长期摘要",
    errorBody: "长期摘要暂时不可用，请稍后重试。",
    noData: "无记录",
    windowLabel: (days: number) => `${days} 天`,
    summaryTitle: (days: number, startDate: string, endDate: string) =>
      `最近 ${days} 天：${startDate} 至 ${endDate}`,
    summaryBody: (entryCount: number, timeZone: string) =>
      `共汇总 ${entryCount} 条记录，窗口边界采用当前账户时区 ${timeZone}，分组采用记录保存时的本地日期。`,
    aggregationNote:
      "数值字段使用窗口内全部记录的算术平均值；缺失日期保留为空，不会显示为 0。",
    insufficientTitle: "数据仍然不足",
    insufficientBody:
      "这个窗口内还没有可汇总的记录。先记录几天日记后，这里会显示低风险、非诊断性的回顾。",
    commonTagsTitle: "常见生活事件",
    noTags: "暂无标签可汇总。",
    patternsTitle: "简短模式",
    noPatterns: "暂无可显示的模式。",
    missingDaysTitle: "缺失日期",
    missingDaysIntro: "这些本地日期在当前窗口内没有记录。",
    missingDaysRegionLabel: "长期摘要缺失日期表，可横向滚动",
    missingState: "状态",
    noMissingDays: "当前窗口内没有缺失日期。",
    noEntryForDay: "无记录",
    insights: {
      title: "AI 长期洞察草稿",
      intro:
        "可选功能：AI 只会基于长期摘要生成自我反思草稿，仅供反思参考，不是医疗建议，也不会自动创建计划或替你做决定。",
      disclaimer: "AI 洞察仅供自我反思参考，不是诊断、治疗或用药建议。",
      noAutoPlan: "保存洞察只会保留这份草稿，不会自动创建行动计划。",
      generate: "生成长期洞察草稿",
      generating: "正在生成洞察",
      save: "保存洞察",
      saving: "正在保存",
      dismiss: "忽略洞察",
      dismissing: "正在忽略",
      historyTitle: "历史洞察草稿",
      emptyHistory: "还没有长期洞察草稿。",
      patternsTitle: "可能的模式",
      strengthsTitle: "可以保留的部分",
      watchPointsTitle: "可以继续观察",
      suggestionsTitle: "温和建议",
      consentRequired:
        "需要先接受独立 AI 数据处理说明，才会向 AI Provider 发送最小化长期摘要。",
      insufficientData:
        "当前窗口数据不足，系统不会调用 AI Provider，也不会生成长期洞察草稿。",
      fallback:
        "本次没有生成可用洞察。系统已安全停止，不会显示 Provider 原始输出。",
      generatedStatus: "已生成洞察草稿，保存前请确认内容是否适合你。",
      savedStatus: "洞察已保存。",
      dismissedStatus: "洞察已忽略。",
      errors: {
        generic: "长期洞察暂时不可用，请稍后重试。",
        saveFailed: "洞察未能保存，请稍后重试。",
        dismissFailed: "洞察未能忽略，请稍后重试。",
      },
    },
  },
  plans: {
    eyebrow: "行动计划",
    title: "长期计划",
    intro:
      "创建手动计划和简单行动项。阶段 4A 不会让 AI 自动创建计划，未来 AI 建议也必须由用户确认后才保存。",
    loading: "正在加载计划…",
    emptyTitle: "还没有计划",
    emptyBody:
      "可以先创建一个手动计划。AI 计划建议只是可选草稿，保存前必须由你确认。",
    errorTitle: "无法加载计划",
    errorBody: "计划暂时不可用，请稍后重试。",
    noDescription: "没有描述。",
    actionsTitle: "行动项",
    noActions: "还没有行动项。",
    meta: (status: string, frequency: string) =>
      `状态：${status}；签到频率：${frequency}`,
    form: {
      titleLabel: "计划标题",
      descriptionLabel: "计划描述",
      actionTitleLabel: "行动项标题",
    },
    actions: {
      create: "创建计划",
      creating: "正在创建",
      delete: "删除计划",
      addAction: "添加行动项",
      completeAction: "标记完成",
    },
    suggestions: {
      title: "AI 计划建议草稿",
      intro:
        "可选功能：AI 只会根据长期摘要生成计划建议草稿，仅供反思参考，不会自动创建计划。保存前需要你确认。",
      disclaimer: "AI 建议仅供反思参考，不是诊断、治疗或医疗建议。",
      windowLabel: "摘要窗口",
      generate: "生成计划建议草稿",
      generating: "正在生成草稿",
      save: "保存为计划",
      saving: "正在保存",
      dismiss: "忽略建议",
      dismissing: "正在忽略",
      actionsTitle: "建议行动项",
      rationaleTitle: "建议依据",
      consentRequired:
        "需要先接受独立 AI 数据处理说明，才会向 AI Provider 发送最小化摘要。",
      insufficientData:
        "当前窗口数据不足，暂时不会调用 AI Provider，也不会生成计划草稿。",
      fallback:
        "本次没有生成可用草稿。系统已安全停止，不会显示 Provider 原始输出。",
      generatedStatus: "已生成草稿，保存前请确认内容是否适合你。",
      savedStatus: "草稿已保存为正式计划。",
      dismissedStatus: "草稿已忽略。",
      errors: {
        generic: "计划建议暂时不可用，请稍后重试。",
        saveFailed: "草稿未能保存为计划，请稍后重试。",
        dismissFailed: "草稿未能忽略，请稍后重试。",
      },
    },
    statuses: {
      active: "进行中",
      completed: "已完成",
      paused: "已暂停",
      abandoned: "已放弃",
    },
    actionStatuses: {
      todo: "待完成",
      done: "已完成",
      skipped: "已跳过",
    },
    frequencies: {
      none: "不提醒",
      daily: "每日",
      weekly: "每周",
    },
    errors: {
      actionTitleRequired: "请填写行动项标题。",
      saveFailed: "计划未能保存，请稍后重试。",
      deleteFailed: "计划未能删除，请稍后重试。",
    },
  },
  aiFeedback: {
    eyebrow: "可选功能",
    title: "AI 支持性反馈",
    intro:
      "你可以选择让 AI 对这条记录生成一段简短反思和至多一条低风险建议，仅供反思参考。",
    disclaimer:
      "这是一条记录辅助信息，不是诊断、治疗或用药建议，也不能替代专业人员或紧急服务。",
    actions: {
      generate: "生成 AI 反馈",
      checking: "正在检查同意状态",
      generating: "正在生成反馈",
    },
    consent: {
      title: "AI 数据处理说明",
      body: "生成反馈时，服务端会把五项状态数值、受控标签、截断后的日记文字、locale 和非识别性趋势摘要发送给第三方 AI Provider。",
      optional:
        "AI 反馈完全可选。拒绝不会影响日记、历史或趋势功能，也不会向 AI Provider 发送内容。",
      dataItems: [
        "不会发送 uid、邮箱、Cookie、token、IP 或 Firestore 路径。",
        "Provider 可能为滥用监测保留提示词和输出。",
        "你可以拒绝，并继续正常使用 MindTrace 的基础记录功能。",
      ],
      decline: "拒绝并关闭",
      accept: "同意并生成",
      saving: "正在保存选择",
      declinedStatus:
        "你已拒绝 AI 数据处理。本条记录未发送给 AI Provider，基础记录功能仍可正常使用。",
    },
    status: {
      generated: "支持性反馈",
      supportive: "建议先获得现实支持",
      crisis: "请立即寻求紧急支持",
      fallback: "暂时无法生成 AI 反馈",
    },
    suggestionsTitle: "可以考虑",
    fallback: {
      "not-configured": "AI Provider 尚未配置。你的日记仍已保存，可稍后再试。",
      timeout: "AI Provider 响应超时。没有返回原始错误或不完整内容。",
      "rate-limited": "AI Provider 当前请求较多，请稍后再试。",
      unavailable: "AI Provider 暂时不可用，请稍后再试。",
      blocked: "Provider 的安全过滤阻止了本次输出，已改用安全降级内容。",
      invalid: "Provider 输出未通过本地结构或安全校验，已被丢弃。",
      generic: "本次反馈未能安全生成，已改用安全降级内容。",
    },
    errors: {
      consentCheck: "无法确认 AI 同意状态，请稍后重试。",
      consentSave: "无法保存 AI 数据处理选择，请重试。",
      notFound: "无法为这条记录生成反馈。",
      timeout: "反馈请求超时，请稍后重试。",
      rateLimited: "反馈请求过多，请稍后重试。",
      generic: "反馈暂时不可用，请稍后重试。",
    },
    generated: {
      fallbackReflection:
        "你的记录已经保存。AI 反馈目前不可用，你仍可以稍后回看自己的记录。",
    },
    supportive: {
      reflection:
        "听起来你现在可能承受着很强的痛苦。MindTrace 无法判断紧急程度，也不能提供紧急援助。",
      suggestions: [
        "请现在联系一位你信任的人或专业支持，并直接说明你需要陪伴或帮助。",
      ],
    },
    crisis: {
      reflection:
        "你描述的情况可能涉及当前的紧急危险。MindTrace 不能提供紧急援助。",
      suggestions: [
        "如果危险正在发生，请立即联系当地紧急服务或前往最近的急诊机构。",
        "请现在联系一位可信任的人，清楚告诉对方你需要立即陪伴或帮助，并尽量不要独处。",
        "你也可以打开 MindTrace 的安全资源页面查找进一步支持。",
      ],
    },
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
