import { zhCN, type Messages } from "@/i18n/messages/zh-CN";

export const en = {
  ...zhCN,
  metadata: {
    title: "MindTrace",
    description: "A private mood, stress, sleep, and life-event journal",
  },
  brand: {
    name: "MindTrace",
    shortDescription: "Private state journal",
  },
  navigation: {
    ariaLabel: "Main navigation",
    demo: "Demo",
    history: "History",
    insights: "Insights",
    login: "Login",
    longTerm: "Long-term",
    overview: "Overview",
    plans: "Plans",
    productBoundary: "Product boundary",
    safety: "Safety resources",
    settings: "Settings",
    today: "Today",
    trends: "Trends",
  },
  common: {
    cancel: "Cancel",
    loading: "Working...",
    retryAction: "Retry",
    retry: "Please try again later.",
    required: "Required",
  },
  auth: {
    loginTitle: "Log in",
    loginIntro: "Continue to your private journal space.",
    registerTitle: "Create account",
    registerIntro: "Use email sign-in for your private MindTrace demo space.",
    emailLabel: "Email",
    passwordLabel: "Password",
    passwordHint: "At least 8 characters.",
    loginAction: "Log in",
    registerAction: "Register",
    logoutAction: "Log out",
    noAccount: "No account yet?",
    hasAccount: "Already have an account?",
    goToRegister: "Create account",
    goToLogin: "Back to login",
    errors: {
      invalidCredentials: "The email or password is not correct.",
      emailInUse: "This email is already registered. Please log in.",
      weakPassword: "The password must be at least 8 characters.",
      invalidEmail: "Please enter a valid email address.",
      sessionFailed: "Could not create a secure session. Please try again.",
      unknown: "The action could not be completed. Please try again later.",
    },
  },
  consent: {
    eyebrow: "First use",
    title: "Confirm product boundary and privacy",
    intro:
      "Complete these confirmations before using private journal features. Product boundary and safety resources remain available.",
    adultTitle: "Adult confirmation",
    adultBody:
      "MindTrace is only for users who have reached the legal adult age in their region.",
    adultCheckbox: "I confirm I am legally an adult in my region.",
    boundaryTitle: "Product boundary",
    boundaryBody:
      "MindTrace is a personal journaling tool. It does not diagnose, treat, provide medication guidance, or replace professionals or emergency services.",
    boundaryCheckbox: "I have read and understand the product boundary.",
    privacyTitle: "Privacy notice",
    privacyBody:
      "Account email is managed by Firebase Authentication. App data is isolated by user, and full journal text is not written to ordinary application logs.",
    privacyCheckbox: "I have read and accept the current privacy notice.",
    aiTitle: "AI data processing notice",
    aiBody:
      "When optional AI features are used, the server sends minimized journal or aggregate content to a third-party AI provider. The provider may retain prompts and outputs for abuse monitoring. MindTrace does not send account identifiers, cookies, or tokens.",
    aiCheckbox: "I accept the current third-party AI data processing notice.",
    aiOptionalHint:
      "This is optional. Declining does not affect journal, history, trends, long-term summaries, or manual plans.",
    languageTitle: "Display language",
    languageBody:
      "Choose the interface language to use after you finish confirmation.",
    languageLabel: "Language",
    languageHint:
      "This only changes the interface language. You can still switch in the header later.",
    timeZoneLabel: "Your time zone",
    timeZoneHint:
      "Used to calculate each entry's local date. You can change it later in settings.",
    submit: "Finish confirmation",
    errors: {
      incomplete: "Please complete all required confirmations.",
      invalidTimeZone:
        "Please enter a valid IANA time zone, such as America/New_York.",
      saveFailed: "Could not save your confirmation. Please try again.",
    },
  },
  landing: {
    eyebrow: "Private reflection for everyday growth",
    title: "Understand your emotions and turn daily moments into insight",
    intro:
      "MindTrace helps you record how life feels, reflect with more clarity, and notice gentle patterns over time. Optional AI drafts support self-reflection only; they are not diagnosis, treatment, medication, or emergency-response advice.",
    actionsLabel: "Start using MindTrace",
    startFree: "Start Free",
    login: "Login",
    visualTitle: "Today in MindTrace",
    visualMood: "Mood",
    visualStress: "Stress",
    visualReflection: "AI reflection",
    visualReflectionBody:
      "It may help to notice what felt heavy today, then choose one small next step.",
    visualPrivacy: "Private by design",
    howTitle: "How it works",
    howIntro:
      "Start with one simple record, then build your own history, trends, and action plans over time.",
    howSteps: [
      {
        title: "Record today",
        body: "Log mood, stress, energy, sleep, life-event tags, and an optional short note.",
      },
      {
        title: "Review patterns",
        body: "History, trends, and summaries are organized by the local date saved with each record.",
      },
      {
        title: "Choose a next step",
        body: "Create manual plans, or ask AI for reflection and plan suggestion drafts that require your confirmation.",
      },
    ],
    productPreviewTitle: "Product Preview",
    productPreviewIntro:
      "Follow the core MindTrace workflow from daily record to reflection and personal history.",
    productPreviewItems: [
      {
        imageSrc: "/images/today-preview.png",
        imageAlt: "MindTrace daily journaling form preview",
        title: "Record your daily state",
        body: "Track mood, stress, energy, sleep, and meaningful life events in one place.",
      },
      {
        imageSrc: "/images/ai-feedback-preview.png",
        imageAlt: "MindTrace AI reflection result preview",
        title: "Reflect with AI support",
        body: "Use AI to generate supportive reflections from your journal entries. AI helps you notice patterns but does not replace professional support or make decisions for you.",
      },
      {
        imageSrc: "/images/history-preview.png",
        imageAlt: "MindTrace personal history preview",
        title: "Build your personal history",
        body: "Review previous entries and understand how your experiences change over time.",
      },
    ],
    aiDemoTitle: "Optional AI reflection, safely bounded",
    aiDemoIntro:
      "AI features require separate consent. They do not save plans automatically or make decisions for you.",
    aiDemoCards: [
      {
        title: "AI feedback",
        body: "Generate a brief supportive reflection from minimized record content after local safety and schema validation.",
      },
      {
        title: "Long-term insights",
        body: "Draft cautious reflections from structured summaries without copying full journal text.",
      },
      {
        title: "Plan suggestions",
        body: "AI can draft plan ideas, but only your confirmation saves them as formal plans.",
      },
    ],
    benefitsTitle: "Why MindTrace",
    benefits: [
      {
        title: "Private by design",
        body: "Your reflections are treated as personal data, with account access and AI features kept behind clear consent boundaries.",
      },
      {
        title: "Understand your patterns",
        body: "Daily records become history, trends, and summaries that help you notice what changes over time.",
      },
      {
        title: "AI as a companion",
        body: "Optional AI can draft gentle reflections and plan ideas, while you stay in control of what to save or act on.",
      },
    ],
    ctaTitle: "Ready to start recording?",
    ctaBody:
      "Start free to save reflections, review your history, and track personal patterns over time. AI features remain optional.",
    footerTitle: "Feedback & Contact",
    footerBody:
      "Have suggestions, questions, or feedback about MindTrace? I would love to hear from early users and improve the product.",
    footerEmailLabel: "Email:",
    footerEmail: "yigang2790@gmail.com",
  },
  demo: {
    navLabel: "Demo page navigation",
    eyebrow: "Beta demo",
    title: "Try MindTrace with one free AI reflection",
    intro:
      "Experience one low-risk AI reflection without creating an account. Demo input is not saved and does not create Firebase user data.",
    showcaseEyebrow: "AI reflection preview",
    showcaseTitle: "Start with one honest journal moment",
    showcaseIntro:
      "Write a few lines about what is on your mind. MindTrace will return a brief, low-risk reflection so you can feel how the product supports private self-understanding.",
    formAriaLabel: "Demo AI reflection form",
    languageLabel: "Reflection language",
    inputLabel: "What would you like to reflect on today?",
    placeholder:
      "For example: I felt tense after work today, and I am trying to understand what made it hard to unwind.",
    characterCount: "{current}/{maximum} characters",
    privacyNotice:
      "Please do not enter identifying details, account data, contact information, or emergency requests. Demo text is used only for this AI reflection request and is not saved to the MindTrace database.",
    generate: "Generate AI reflection",
    generating: "Generating",
    resultEyebrow: "Demo result",
    resultTitle: "AI reflection result",
    reflectionTitle: "Emotional reflection",
    suggestionsTitle: "Simple suggestion",
    fallbackReflection:
      "Demo AI reflection is unavailable right now. Your demo input was temporary and was not saved to MindTrace.",
    createAccount: "Start Free",
    login: "Login",
    productOverview: "Explore how MindTrace works",
    startFree: "Start Free",
    remaining: "{count} demo reflections remaining in this browser session.",
    limitsTitle: "Demo limits",
    limits: [
      "The demo allows a small number of reflections to reduce abuse.",
      "Demo input is not saved and does not affect registered user data.",
      "AI-generated content is for reflection only and does not provide diagnosis, treatment, medication, or emergency-response advice.",
      "Create a free account to save reflections, review your history, and track patterns over time.",
    ],
    errors: {
      required: "Please write a short thought first.",
      invalid:
        "The input does not meet the requirements. Please shorten it and try again.",
      limitReached:
        "The demo limit has been reached. Start free to save reflections and track patterns in MindTrace.",
      generic:
        "Demo reflection is temporarily unavailable. Please try again later.",
    },
  },
  home: {
    eyebrow: "MVP demo path",
    title: "Record once, see patterns, then choose the next step",
    intro:
      "MindTrace helps adults record mood, stress, energy, sleep, and life events, then review trends and long-term summaries. AI features are optional low-risk reflection or draft suggestions. They do not make decisions for you and are not medical diagnosis or treatment.",
    actionsLabel: "Primary overview actions",
    primaryAction: "Record today",
    secondaryAction: "View history",
    demoTitle: "Suggested demo flow",
    demoIntro:
      "If there is not enough data yet, record a few journal entries first. Missing days stay empty and are never fabricated as zero.",
    demoSteps: [
      {
        title: "Record state",
        body: "Save one daily entry with scores, sleep, tags, and optional text.",
        href: "/en/today",
      },
      {
        title: "Review history",
        body: "View paginated entries in occurrence-time order with safe previews.",
        href: "/en/history",
      },
      {
        title: "See 7-day trends",
        body: "Aggregate same-day entries by local date and keep missing days empty.",
        href: "/en/trends",
      },
      {
        title: "Review long-term summary",
        body: "Switch 7, 14, and 30 day windows for non-diagnostic summaries.",
        href: "/en/long-term",
      },
      {
        title: "Create a manual plan",
        body: "Create plans manually, or ask AI to draft plan suggestions that require your confirmation.",
        href: "/en/plans",
      },
    ],
    infoAriaLabel: "MindTrace core feature summary",
    infoCards: [
      {
        title: "Daily journal",
        body: "Records are saved to your personal account so you can review history and generate trends.",
      },
      {
        title: "Trends and summaries",
        body: "Trends and summaries are organized by the local date when each record was saved.",
      },
      {
        title: "Optional AI drafts",
        body: "AI feedback, plan suggestions, and long-term insights require separate AI consent and remain low-risk drafts.",
      },
    ],
    aiBoundaryTitle: "AI is for reflection only",
    aiBoundaryBody:
      "AI-generated content is for reflection only and does not provide diagnosis, treatment, medication, or emergency-response advice.",
    safetyAction: "View safety resources",
    boundaryAction: "View product boundary",
  },
  journal: {
    ...zhCN.journal,
    today: {
      eyebrow: "State journal",
      title: "Record how things feel right now",
      intro:
        "Track mood, stress, energy, sleep, and life events. You can save multiple entries on the same day.",
    },
    form: {
      moodLabel: "Mood",
      moodHint: "1 means very low, 10 means very good.",
      stressLabel: "Stress",
      stressHint: "1 means very low, 10 means very high.",
      energyLabel: "Energy",
      energyHint: "1 means very low, 10 means very high.",
      sleepHoursLabel: "Sleep hours",
      sleepHoursHint: "Enter 0 to 24 hours. Decimals are allowed.",
      hoursUnit: "hours",
      sleepQualityLabel: "Sleep quality",
      sleepQualityHint: "1 means very poor, 10 means very good.",
      eventTagsLabel: "Life events",
      eventTagsHint: "Choose 1 to 5 relevant tags.",
      noteLabel: "Journal note",
      noteHint: "Optional. Avoid unnecessary identifying details.",
      occurredAtLabel: "Occurred at",
      occurredAtHint: "Defaults to now. You can adjust it to the actual time.",
      characters: "characters",
    },
    actions: {
      submit: "Save entry",
      submitting: "Saving",
      saveChanges: "Save changes",
      savingChanges: "Saving",
      edit: "Edit entry",
      delete: "Delete entry",
      viewEntry: "View this entry",
      continueEntry: "Continue journaling",
      viewHistory: "View history",
      loadMore: "Load more",
      loadingMore: "Loading",
      backToHistory: "Back to history",
    },
    errors: {
      mood: "Please enter an integer from 1 to 10.",
      stress: "Please enter an integer from 1 to 10.",
      energy: "Please enter an integer from 1 to 10.",
      sleepHours: "Please enter a number from 0 to 24.",
      sleepQuality: "Please enter an integer from 1 to 10.",
      eventTags: "Please choose 1 to 5 unique life event tags.",
      note: "Journal note cannot exceed 5000 Unicode characters.",
      occurredAt: "Please choose a valid occurrence time.",
      invalidRequest:
        "Some fields do not meet the requirements. Please check the highlighted fields.",
      loadFailed: "Entries could not be loaded. Please try again later.",
      saveFailed: "Entry could not be saved. Please try again later.",
      deleteFailed: "Entry could not be deleted. Please try again later.",
      notFound: "This entry could not be found.",
    },
    success: {
      title: "Entry saved",
      body: "This entry has been safely saved to your personal history.",
      updatedTitle: "Changes saved",
      updatedBody: "The detail view has been refreshed to the latest version.",
    },
    deleteDialog: {
      title: "Delete this entry?",
      body: "After deletion, this entry will be removed from your current data. This action cannot be undone from this page.",
      confirm: "Delete entry",
      deleting: "Deleting",
    },
    history: {
      eyebrow: "Personal history",
      title: "History",
      intro:
        "View entries from newest to oldest. Each page loads a limited batch.",
      loading: "Loading history...",
      emptyTitle: "No entries yet",
      emptyBody:
        "Save a state entry from Today first. It will appear here with a safe preview.",
      errorTitle: "Could not load history",
      noMore: "All entries are shown.",
      noteEmpty: "No note",
    },
    detail: {
      eyebrow: "Entry detail",
      title: "Entry detail",
      loading: "Loading entry...",
      editTitle: "Edit entry",
      fullNote: "Journal note",
      createdAt: "Created at",
      updatedAt: "Updated at",
      revision: "Revision",
      notFoundTitle: "Entry unavailable",
      notFoundBody:
        "This entry does not exist, or you do not have access to it.",
    },
    eventTags: {
      work: "Work",
      job_search: "Job search",
      study: "Study",
      sleep: "Sleep",
      family: "Family",
      relationship: "Relationship",
      social: "Social",
      finance: "Finance",
      health_routine: "Health routine",
      travel: "Travel",
      other: "Other",
    },
  },
  trends: {
    ...zhCN.trends,
    eyebrow: "Recent state",
    title: "Recent 7-day trends",
    intro:
      "Review the latest seven local dates in your account time zone. Same-day entries are averaged; missing dates stay empty.",
    loading: "Loading recent trends...",
    errorTitle: "Could not load trends",
    errorBody: "Trend data is temporarily unavailable. Please try again later.",
    emptyTitle: "No entries in the latest 7 days",
    emptyBody:
      "Record a few journal entries first. Dates without entries stay empty and are not shown as zero.",
    noData: "No entry",
    chartAriaLabel: (metric: string) => `${metric} over the recent 7 days`,
    pointAriaLabel: (date: string, value: string) => `${date}: ${value}`,
    scaleLabel: (min: number, max: number, unit: string) =>
      `Range ${min}–${max}${unit}`,
    summaryTitle: (recordedDays: number, totalDays: number) =>
      `${recordedDays} of ${totalDays} days have entries`,
    summaryBody: (totalEntries: number, timeZone: string) =>
      `${totalEntries} entries summarized. Date boundaries use ${timeZone}.`,
    aggregationNote:
      "When a local date has multiple entries, numeric fields use the arithmetic average.",
    tableTitle: "Accessible data table",
    tableIntro:
      "The table lists all seven local dates. Missing dates are marked empty.",
    tableRegionLabel: "Recent 7-day trend data table, horizontally scrollable",
    metrics: {
      mood: "Mood",
      stress: "Stress",
      energy: "Energy",
      sleepHours: "Sleep hours",
      sleepQuality: "Sleep quality",
    },
    units: {
      score: " pts",
      hours: " h",
    },
    table: {
      date: "Local date",
      entryCount: "Entries",
    },
  },
  longTerm: {
    ...zhCN.longTerm,
    eyebrow: "Long-term review",
    title: "Long-term summary",
    intro:
      "Review the last 7, 14, or 30 days using your local dates. Summaries are generated from structured record data, do not call Gemini, and do not copy full journal text.",
    loading: "Loading long-term summary...",
    errorTitle: "Could not load long-term summary",
    errorBody:
      "Long-term summary is temporarily unavailable. Please try again.",
    noData: "No entry",
    windowLabel: (days: number) => `${days} days`,
    summaryTitle: (days: number, startDate: string, endDate: string) =>
      `Latest ${days} days: ${startDate} to ${endDate}`,
    summaryBody: (entryCount: number, timeZone: string) =>
      `${entryCount} entries summarized. Window boundaries use account time zone ${timeZone}; grouping uses each entry's saved local date.`,
    aggregationNote:
      "Numeric fields use arithmetic averages. Missing dates stay empty, not zero.",
    insufficientTitle: "Not enough data yet",
    insufficientBody:
      "There are no entries to summarize in this window. Record a few days first.",
    commonTagsTitle: "Common life events",
    noTags: "No tags to summarize yet.",
    patternsTitle: "Brief patterns",
    noPatterns: "No displayable patterns yet.",
    missingDaysTitle: "Missing dates",
    missingDaysIntro:
      "These local dates have no entries in the current window.",
    missingDaysRegionLabel: "Long-term summary missing dates table",
    missingState: "State",
    noMissingDays: "No missing dates in this window.",
    noEntryForDay: "No entry",
    insights: {
      ...zhCN.longTerm.insights,
      title: "AI long-term insight draft",
      intro:
        "Optional: AI can draft a self-reflection insight from the long-term summary. It is for reflection only, not medical advice, and it never creates plans automatically.",
      disclaimer:
        "AI insights are for self-reflection only. They are not diagnosis, treatment, or medication guidance.",
      noAutoPlan:
        "Saving an insight only saves this draft. It does not create an action plan.",
      generate: "Generate long-term insight draft",
      generating: "Generating insight",
      save: "Save insight",
      saving: "Saving",
      dismiss: "Dismiss insight",
      dismissing: "Dismissing",
      historyTitle: "Past insight drafts",
      emptyHistory: "No long-term insight drafts yet.",
      patternsTitle: "Possible patterns",
      strengthsTitle: "Parts to keep",
      watchPointsTitle: "Things to keep observing",
      suggestionsTitle: "Gentle suggestions",
      consentRequired:
        "Accept the separate AI data processing notice before sending minimized summary data to an AI provider.",
      insufficientData:
        "There is not enough data in this window. The AI provider was not called.",
      fallback:
        "No usable insight was generated. The system stopped safely and did not show raw provider output.",
      generatedStatus:
        "Insight draft generated. Please review it before saving.",
      savedStatus: "Insight saved.",
      dismissedStatus: "Insight dismissed.",
      errors: {
        generic:
          "Long-term insight is temporarily unavailable. Please try again.",
        saveFailed: "Could not save the insight. Please try again.",
        dismissFailed: "Could not dismiss the insight. Please try again.",
      },
    },
  },
  plans: {
    ...zhCN.plans,
    eyebrow: "Action plans",
    title: "Plans",
    intro:
      "Create plans manually, or ask AI to draft plan suggestions that require your confirmation.",
    loading: "Loading plans...",
    emptyTitle: "No plans yet",
    emptyBody:
      "Create a manual plan first. AI plan suggestions are drafts and require confirmation.",
    errorTitle: "Could not load plans",
    errorBody: "Plans are temporarily unavailable. Please try again later.",
    noDescription: "No description.",
    actionsTitle: "Action items",
    noActions: "No action items yet.",
    meta: (status: string, frequency: string) =>
      `Status: ${status}; check-in: ${frequency}`,
    form: {
      titleLabel: "Plan title",
      descriptionLabel: "Plan description",
      actionTitleLabel: "Action item title",
    },
    actions: {
      create: "Create plan",
      creating: "Creating",
      delete: "Delete plan",
      addAction: "Add action item",
      completeAction: "Mark done",
    },
    statuses: {
      active: "In progress",
      completed: "Completed",
      paused: "Paused",
      abandoned: "Abandoned",
    },
    actionStatuses: {
      todo: "Pending",
      done: "Completed",
      skipped: "Skipped",
    },
    frequencies: {
      none: "No reminders",
      daily: "Daily",
      weekly: "Weekly",
    },
    suggestions: {
      ...zhCN.plans.suggestions,
      title: "AI plan suggestion draft",
      intro:
        "Optional: AI can draft plan ideas from a long-term summary. It never creates a plan automatically; you must confirm before saving.",
      disclaimer:
        "AI suggestions are for reflection only. They are not diagnosis, treatment, or medical advice.",
      windowLabel: "Summary window",
      generate: "Generate plan suggestion draft",
      generating: "Generating draft",
      save: "Save as plan",
      saving: "Saving",
      dismiss: "Dismiss suggestion",
      dismissing: "Dismissing",
      actionsTitle: "Suggested action items",
      rationaleTitle: "Why this was suggested",
      consentRequired:
        "Accept the separate AI data processing notice before sending minimized summary data to an AI provider.",
      insufficientData:
        "There is not enough data in this window. The AI provider was not called.",
      fallback:
        "No usable draft was generated. The system stopped safely and did not show raw provider output.",
      generatedStatus: "Draft generated. Please review it before saving.",
      savedStatus: "Draft saved as a formal plan.",
      dismissedStatus: "Draft dismissed.",
      errors: {
        generic:
          "Plan suggestion is temporarily unavailable. Please try again.",
        saveFailed: "Could not save the draft as a plan. Please try again.",
        dismissFailed: "Could not dismiss the draft. Please try again.",
      },
    },
  },
  aiFeedback: {
    ...zhCN.aiFeedback,
    eyebrow: "Optional feature",
    title: "AI supportive reflection",
    intro:
      "You can ask AI to generate a brief reflection and at most one low-risk suggestion for this entry.",
    disclaimer:
      "This is journaling support, not diagnosis, treatment, medication guidance, or a replacement for professionals or emergency services.",
    actions: {
      generate: "Generate AI feedback",
      checking: "Checking consent",
      generating: "Generating feedback",
    },
    consent: {
      title: "AI data processing notice",
      body: "To generate feedback, the server sends mood/stress/energy/sleep values, controlled tags, truncated note text, locale, and non-identifying trend summary to a third-party AI provider.",
      optional:
        "AI feedback is optional. Declining does not affect journal, history, trends, summaries, or plans.",
      dataItems: [
        "MindTrace does not send uid, email, cookies, tokens, IP, or Firestore paths.",
        "The provider may retain prompts and outputs for abuse monitoring.",
        "You may decline and continue using the core journal features.",
      ],
      decline: "Decline and close",
      accept: "Accept and generate",
      saving: "Saving choice",
      declinedStatus:
        "You declined AI data processing. This entry was not sent to an AI provider, and core journal features still work.",
    },
    status: {
      generated: "Supportive reflection",
      supportive: "Consider real-world support",
      crisis: "Seek urgent support now",
      fallback: "AI feedback unavailable",
    },
    suggestionsTitle: "You could consider",
    fallback: {
      "not-configured":
        "AI provider is not configured. Your journal entry is still saved.",
      timeout:
        "AI provider timed out. No raw error or partial output is shown.",
      "rate-limited": "AI provider is busy. Please try again later.",
      unavailable: "AI provider is temporarily unavailable.",
      blocked:
        "The provider safety filter blocked the output. A safe fallback is used.",
      invalid:
        "Provider output failed local schema or safety validation and was discarded.",
      generic:
        "Feedback could not be safely generated. A safe fallback is used.",
    },
    errors: {
      consentCheck: "Could not check AI consent. Please try again.",
      consentSave: "Could not save your AI data processing choice.",
      notFound: "Could not generate feedback for this entry.",
      timeout: "Feedback request timed out. Please try again later.",
      rateLimited: "Too many feedback requests. Please try again later.",
      generic: "Feedback is temporarily unavailable. Please try again.",
    },
    generated: {
      fallbackReflection:
        "Your entry was saved. AI feedback is unavailable right now, but you can still review this record later.",
    },
    supportive: {
      reflection:
        "It sounds like things may feel very heavy right now. MindTrace cannot judge urgency or provide emergency help.",
      suggestions: [
        "Please consider contacting someone you trust or a professional support person and clearly saying you need help or company.",
      ],
    },
    crisis: {
      reflection:
        "Your entry may describe immediate danger. MindTrace cannot provide emergency support.",
      suggestions: [
        "If danger is happening now, contact local emergency services or go to the nearest emergency department.",
        "Please contact a trusted person now and tell them you need immediate company or help.",
        "You can also open MindTrace safety resources for additional support options.",
      ],
    },
  },
  settings: {
    title: "Settings",
    accountSection: "Account status",
    timeZoneLabel: "Time zone",
    accessReady: "Personal features enabled",
    accessPending: "Adult confirmation and current consent are not complete",
    continueConsent: "Continue confirmation",
  },
  boundary: {
    title: "Product boundary",
    intro:
      "MindTrace helps adults record mood, stress, energy, sleep, and life events, then observe possible patterns in their own records.",
    notTherapyTitle: "Not therapy or diagnosis",
    notTherapyBody:
      "MindTrace does not diagnose any condition, provide medication advice, or replace doctors, therapists, or other professionals.",
    uncertaintyTitle: "Patterns are cautious",
    uncertaintyBody:
      "AI feedback and summaries may describe possible associations, not causal claims.",
    controlTitle: "You control your data",
    controlBody:
      "Personal features require login and server-side authorization. Future export and deletion flows must cover user data collections.",
  },
  safety: {
    title: "Crisis and safety resources",
    urgentTitle: "If danger is happening now",
    urgentBody:
      "If you or someone else may be in immediate danger, contact local emergency services or go to the nearest emergency department.",
    contactTitle: "Contact someone now",
    contactBody:
      "Try not to stay alone. Contact someone you trust and directly say you need company or help.",
    professionalTitle: "Seek professional support",
    professionalBody:
      "Contact local mental health professionals, crisis lines, or medical services. MindTrace cannot provide emergency response.",
    availability: "This page is always free and does not require login.",
  },
  notFound: {
    title: "Page not found",
    action: "Back to MindTrace",
  },
  api: {
    unauthorized: "Login required.",
    consentRequired: "Adult confirmation and current consent are required.",
  },
} satisfies Messages;
