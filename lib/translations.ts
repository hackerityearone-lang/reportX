export type Language = "en" | "rw"

export const translations = {
  // Common
  common: {
    appName: { en: "ReportX Stock", rw: "ReportX Stock" },
    tagline: { en: "KIVU Quality SHEET ltd", rw: "Gucunga Stock Byoroshye" },
    loading: { en: "Loading...", rw: "Tegereza..." },
    save: { en: "Save", rw: "Bika" },
    cancel: { en: "Cancel", rw: "Hagarika" },
    delete: { en: "Delete", rw: "Siba" },
    edit: { en: "Edit", rw: "Hindura" },
    add: { en: "Add", rw: "Ongeraho" },
    search: { en: "Search", rw: "Shakisha" },
    filter: { en: "Filter", rw: "Shungura" },
    all: { en: "All", rw: "Byose" },
    yes: { en: "Yes", rw: "Yego" },
    no: { en: "No", rw: "Oya" },
    close: { en: "Close", rw: "Funga" },
    back: { en: "Back", rw: "Subira inyuma" },
    next: { en: "Next", rw: "Komeza" },
    submit: { en: "Submit", rw: "Ohereza" },
    success: { en: "Success", rw: "Byagenze neza" },
    error: { en: "Error", rw: "Ikosa" },
    required: { en: "Required", rw: "Birakenewe" },
  },

  // Navigation
  nav: {
    dashboard: { en: "Dashboard", rw: "Ikibaho" },
    products: { en: "Products", rw: "Ibicuruzwa" },
    stockIn: { en: "Stock In", rw: "Ibyinjiye" },
    stockOut: { en: "Stock Out", rw: "Ibisohotse" },
    credits: { en: "Credits", rw: "Amadeni" },
    reports: { en: "Reports", rw: "Raporo" },
    settings: { en: "Settings", rw: "Igenamiterere" },
  },

  // Auth
  auth: {
    login: { en: "Login", rw: "Injira" },
    logout: { en: "Logout", rw: "Sohoka" },
    signUp: { en: "Sign Up", rw: "Iyandikishe" },
    email: { en: "Email", rw: "Imeli" },
    password: { en: "Password", rw: "Ijambo ry'ibanga" },
    confirmPassword: { en: "Confirm Password", rw: "Emeza ijambo ry'ibanga" },
    fullName: { en: "Full Name", rw: "Amazina yombi" },
    role: { en: "Role", rw: "Umwanya" },
    user: { en: "User", rw: "Umukozi" },
    stockBoss: { en: "Stock Boss", rw: "Umuyobozi wa Stock" },
    noAccount: { en: "Don't have an account?", rw: "Nta konti ufite?" },
    haveAccount: { en: "Already have an account?", rw: "Ufite konti?" },
    loginSuccess: { en: "Login successful", rw: "Winjiye neza" },
    signUpSuccess: { en: "Account created! Check your email.", rw: "Konti yaremye! Reba imeli yawe." },
    invalidCredentials: { en: "Invalid email or password", rw: "Imeli cyangwa ijambo ry'ibanga sibyo" },
    notLoggedIn: { en: "Not logged in", rw: "Ntabwo winjiye mu konti" },
  },

  // Dashboard
  dashboard: {
    welcome: { en: "Welcome!", rw: "Murakaza neza!" },
    todayOverview: { en: "See how your stock is doing today", rw: "Reba uko stock yawe imeze uyu munsi" },
    totalProducts: { en: "Total Products", rw: "Ibicuruzwa Byose" },
    totalStock: { en: "Total Stock", rw: "Stock Yose" },
    lowStock: { en: "Low Stock", rw: "Stock Nke" },
    todaySales: { en: "Today's Sales", rw: "Ibyagurishijwe Uyu Munsi" },
    todayRevenue: { en: "Today's Revenue", rw: "Amafaranga y'Uyu Munsi" },
    pendingCredits: { en: "Pending Credits", rw: "Amadeni Ategereje" },
    quickActions: { en: "Quick Actions", rw: "Ibikorwa Byihuse" },
    recentTransactions: { en: "Recent Transactions", rw: "Ibyakozwe Vuba" },
    productsOverview: { en: "Products Overview", rw: "Incamake y'Ibicuruzwa" },
    aiInsights: { en: "AI Insights", rw: "Ubumenyi bwa AI" },
  },

  // Products
  products: {
    title: { en: "Products", rw: "Ibicuruzwa" },
    addProduct: { en: "Add Product", rw: "Ongeraho Igicuruzwa" },
    editProduct: { en: "Edit Product", rw: "Hindura Igicuruzwa" },
    deleteProduct: { en: "Delete Product", rw: "Siba Igicuruzwa" },
    productName: { en: "Product Name", rw: "Izina ry'igicuruzwa" },
    brand: { en: "Brand", rw: "Brand / Urwego" },
    quantity: { en: "Quantity", rw: "Umubare" },
    minStock: { en: "Minimum Stock", rw: "Stock Ntarengwa" },
    price: { en: "Price (RWF)", rw: "Igiciro (RWF)" },
    imageUrl: { en: "Image URL", rw: "URL y'Ifoto" },
    noProducts: { en: "No products yet", rw: "Nta bicuruzwa bihari" },
    addFirst: { en: "Add your first product to get started", rw: "Ongeraho igicuruzwa cya mbere" },
    stock: { en: "Stock", rw: "Stock" },
    outOfStock: { en: "Out of Stock", rw: "Birabuze" },
    deleteConfirm: {
      en: "Are you sure you want to delete this product?",
      rw: "Uzi neza ko ushaka gusiba iki gicuruzwa?",
    },
  },

  // Stock In/Out
  stock: {
    recordStockIn: { en: "Record Stock In", rw: "Andika Ibyinjiye" },
    recordStockOut: { en: "Record Stock Out", rw: "Andika Ibisohotse" },
    addStockToWarehouse: { en: "Add new stock to warehouse", rw: "Ongeraho stock bishya mu bubiko" },
    sellProduct: { en: "Sell a product - cash or credit", rw: "Gurisha igicuruzwa - cash cyangwa ideni" },
    selectProduct: { en: "Select Product", rw: "Hitamo igicuruzwa" },
    unitPrice: { en: "Unit Price (RWF)", rw: "Igiciro ku Kimwe (RWF)" },
    total: { en: "Total", rw: "Igiteranyo" },
    notes: { en: "Notes", rw: "Icyitonderwa" },
    addStock: { en: "Add Stock", rw: "Ongeraho Stock" },
    sell: { en: "Sell", rw: "Gurisha" },
    stockAdded: { en: "Stock added successfully!", rw: "Stock yongewe neza!" },
    saleRecorded: { en: "Sale recorded successfully!", rw: "Igurishwa ryanditswe neza!" },
    insufficientStock: { en: "Insufficient stock. Remaining:", rw: "Stock ntigihagije. Stock isigaye:" },
    recentStockIn: { en: "Recent Stock In", rw: "Ibyinjiye Vuba" },
    recentStockOut: { en: "Recent Stock Out", rw: "Ibisohotse Vuba" },
  },

  // Payment
  payment: {
    paymentMethod: { en: "Payment Method", rw: "Uburyo bwo Kwishyura" },
    cash: { en: "Cash", rw: "Amafaranga" },
    credit: { en: "Credit", rw: "Ideni" },
    customerInfo: { en: "Customer Information", rw: "Amakuru y'Umukiriya" },
    customerName: { en: "Customer Name", rw: "Izina ry'Umukiriya" },
    phone: { en: "Phone", rw: "Telefoni" },
    creditAdded: { en: "Credit added.", rw: "Ideni ryongerewe." },
  },

  // Credits
  credits: {
    title: { en: "Credits (Debts)", rw: "Amadeni" },
    manageCredits: { en: "Manage customer debts", rw: "Gucunga amadeni y'abakiriya" },
    creditsList: { en: "Credits List", rw: "Urutonde rw'Amadeni" },
    noCredits: { en: "No credits yet", rw: "Nta madeni ahari" },
    creditsAppearHere: {
      en: "Credits will appear here when you sell on credit",
      rw: "Amadeni azagaragara hano iyo ugurishije ku ideni",
    },
    totalOwed: { en: "Total Owed", rw: "Ideni ryose" },
    amountPaid: { en: "Amount Paid", rw: "Yishyuye" },
    remaining: { en: "Remaining", rw: "Asigaye" },
    paid: { en: "Paid", rw: "Yishyuwe" },
    pending: { en: "Pending", rw: "Bitegereje" },
    partial: { en: "Partial", rw: "Igice" },
    markAsPaid: { en: "Mark as Paid", rw: "Kwishyura" },
    payCredit: { en: "Pay Credit", rw: "Kwishyura Ideni" },
    paymentAmount: { en: "Payment Amount", rw: "Amafaranga yo Kwishyura" },
    paymentRecorded: { en: "Payment recorded successfully!", rw: "Kwishyura kwanditswe neza!" },
  },

  // Reports
  reports: {
    title: { en: "Reports", rw: "Raporo" },
    dailyReport: { en: "Daily Report", rw: "Raporo y'Umunsi" },
    weeklyReport: { en: "Weekly Report", rw: "Raporo y'Icyumweru" },
    monthlyReport: { en: "Monthly Report", rw: "Raporo y'Ukwezi" },
    stockReport: { en: "Stock Report", rw: "Raporo ya Stock" },
    creditReport: { en: "Credit Report", rw: "Raporo y'Amadeni" },
    day: { en: "Day", rw: "Umunsi" },
    week: { en: "Week", rw: "Icyumweru" },
    month: { en: "Month", rw: "Ukwezi" },
    times: { en: "Times", rw: "Inshuro" },
    items: { en: "Items", rw: "Ibicuruzwa" },
    salesTotal: { en: "Total Sales", rw: "Igiteranyo cy'Ibyagurishijwe" },
    stockValue: { en: "Stock Value", rw: "Agaciro ka Stock" },
    paymentProgress: { en: "Payment Progress", rw: "Urugendo rwo Kwishyura" },
    remainingToPay: { en: "Remaining to Pay", rw: "Asigaye Kwishyura" },
    paidAmount: { en: "Paid Amount", rw: "Yishyuwe" },
  },

  // AI Insights
  insights: {
    title: { en: "AI Insights", rw: "Ubumenyi bwa AI" },
    lowStockAlert: { en: "Low Stock Alert", rw: "Imenyesha rya Stock Nke" },
    creditRisk: { en: "Credit Risk", rw: "Akaga k'Ideni" },
    salesTrend: { en: "Sales Trend", rw: "Imigendekere y'Ubucuruzi" },
    restockRecommendation: { en: "Restock Recommendation", rw: "Icyifuzo cyo Kongera Stock" },
    weeklySummary: { en: "Weekly Summary", rw: "Incamake y'Icyumweru" },
    onlyUnitsLeft: { en: "only units left", rw: "gusa bisigaye" },
    minimumLevel: { en: "Minimum level is", rw: "Umubare ntarengwa ni" },
    outstandingBalance: { en: "has an outstanding balance of", rw: "afite ideni rya" },
    salesWorth: { en: "sales worth", rw: "zingana" },
    avgDaily: { en: "Average daily", rw: "Umubare ku munsi" },
    needRestocking: { en: "will need restocking soon", rw: "bazakenera stock vuba" },
  },

  // Settings
  settings: {
    title: { en: "Settings", rw: "Igenamiterere" },
    profile: { en: "Profile", rw: "Umwirondoro" },
    language: { en: "Language", rw: "Ururimi" },
    selectLanguage: { en: "Select Language", rw: "Hitamo Ururimi" },
    english: { en: "English", rw: "Icyongereza" },
    kinyarwanda: { en: "Kinyarwanda", rw: "Ikinyarwanda" },
    profileUpdated: { en: "Profile updated successfully!", rw: "Umwirondoro wahinduwe neza!" },
    notifications: { en: "Notifications", rw: "Imenyesha" },
  },

  // Time
  time: {
    today: { en: "Today", rw: "Uyu munsi" },
    yesterday: { en: "Yesterday", rw: "Ejo hashize" },
    thisWeek: { en: "This Week", rw: "Iki cyumweru" },
    thisMonth: { en: "This Month", rw: "Uku kwezi" },
    date: { en: "Date", rw: "Itariki" },
  },
} as const

export type TranslationKey = keyof typeof translations
export type TranslationSection<K extends TranslationKey> = keyof (typeof translations)[K]

export function t<K extends TranslationKey, S extends TranslationSection<K>>(
  section: K,
  key: S,
  lang: Language,
): string {
  const sectionData = translations[section]
  if (sectionData && key in sectionData) {
    const item = sectionData[key as keyof typeof sectionData] as { en: string; rw: string }
    return item[lang] || item.en
  }
  return String(key)
}
