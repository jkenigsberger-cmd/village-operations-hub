// Hebrew translations for the Aharonson Farm application
// All UI strings centralized for RTL Hebrew interface

export const HE = {
  // Navigation menu items
  nav: {
    overview: 'דף הבית',
    calendar: 'לוח שנה',
    neighborhoods: 'שכונות',
    facilities: 'מתקנים משותפים',
    bathrooms: 'שירותים ומקלחות',
    maintenance: 'תחזוקה',
    housekeeping: 'משק בית',
    notes: 'הערות חשובות',
    settings: 'הגדרות',
    checkIns: "צ'ק-אין",
    checkOuts: "צ'ק-אאוט",
    needsCleaning: 'דורשים ניקיון',
  },
  
  // Status labels
  status: {
    free: 'פנוי',
    reserved: 'שמור',
    occupied: 'תפוס',
    blocked: 'חסום',
    clean: 'נקי',
    needsCleaning: 'דורש ניקיון',
    inProgress: 'בתהליך...',
    working: 'תקין',
    broken: 'תקול',
    maintenance: 'תחזוקה',
    closed: 'סגור',
  },
  
  // Action buttons
  actions: {
    save: 'שמור',
    cancel: 'ביטול',
    delete: 'מחק',
    close: 'סגור',
    edit: 'ערוך',
    add: 'הוסף',
    saveAndExit: 'שמור וצא',
    reserve: 'הזמן',
    takePhoto: 'צלם תמונה',
    addPhoto: 'הוסף תמונה',
    reportIssue: 'דווח על בעיה',
    clickToReserve: 'לחץ להזמנה',
    viewAll: 'הצג הכל',
    back: 'חזור',
    done: 'סיום',
    confirm: 'אישור',
    clearAll: 'נקה הכל',
    markDirty: 'סמן כמלוכלך',
    markClean: 'סמן כנקי',
    submitReport: 'שלח דיווח',
    newReservation: 'הזמנה חדשה',
    goToToday: 'עבור להיום',
    removeImage: 'הסר',
  },
  
  // Date/Time related
  date: {
    today: 'היום',
    checkIn: "צ'ק-אין",
    checkOut: "צ'ק-אאוט",
    date: 'תאריך',
    time: 'שעה',
    from: 'מ-',
    to: 'עד',
    hour: 'שעה',
    day: 'יום',
    week: 'שבוע',
    month: 'חודש',
  },
  
  // Entities
  entities: {
    tent: 'אוהל',
    tents: 'אוהלים',
    bed: 'מיטה',
    beds: 'מיטות',
    group: 'קבוצה',
    guest: 'אורח',
    guests: 'אורחים',
    neighborhood: 'שכונה',
    facility: 'מתקן',
    facilities: 'מתקנים',
    bunk: 'מיטת קומתיים',
    single: 'מיטה בודדת',
    top: 'עליונה',
    bottom: 'תחתונה',
    toilet: 'שירותים',
    shower: 'מקלחת',
    reservation: 'הזמנה',
    reservations: 'הזמנות',
  },
  
  // Page titles and headers
  pages: {
    todayOverview: 'סקירת היום',
    todayOperations: 'פעולות היום',
    arrivals: 'הגעות',
    departures: 'עזיבות',
    needsCleaning: 'דורשים ניקיון',
    allNeighborhoods: 'כל השכונות',
    commonFacilities: 'מתקנים משותפים',
    bathroomsShowers: 'שירותים ומקלחות',
    settings: 'הגדרות',
    settingsData: 'הגדרות ונתונים',
    tentMap: 'מפת מיטות',
    groupInfo: 'פרטי קבוצה',
    tentStatus: 'מצב האוהל',
    bedMap: 'מפת מיטות',
    currentData: 'נתונים נוכחיים',
    exportData: 'ייצוא נתונים',
    importData: 'ייבוא נתונים',
    resetToDefault: 'איפוס לברירת מחדל',
    aboutDataStorage: 'אודות אחסון הנתונים',
  },
  
  // Messages
  messages: {
    noCheckIns: 'אין הגעות היום',
    noCheckOuts: 'אין עזיבות היום',
    noPendingCleaning: 'הכל נקי!',
    allClean: 'כל האוהלים נקיים! ✨',
    allFacilitiesWorking: 'כל המתקנים תקינים! ✓',
    reservationSuccess: 'ההזמנה נוצרה בהצלחה',
    issueReported: 'הבעיה דווחה בהצלחה',
    taskCompleted: 'המשימה הושלמה',
    dataExported: 'הנתונים יוצאו בהצלחה!',
    dataImported: 'הנתונים יובאו בהצלחה!',
    invalidJson: 'פורמט JSON לא תקין. בדוק את הנתונים.',
    pasteJson: 'הדבק נתוני JSON כאן...',
    confirmReset: 'האם אתה בטוח?',
    resetWarning: 'כל הנתונים יימחקו לצמיתות.',
    loading: 'טוען...',
    loadingVillage: 'טוען כפר...',
    noMatch: 'לא נמצאו תוצאות',
    noReservations: 'אין הזמנות',
    noGuest: 'אין אורח',
    groupsHosted: 'קבוצות מאוכסנות היום:',
    selectSpace: 'בחר מתקן',
    enterGroupName: 'הכנס שם קבוצה',
    endAfterStart: 'שעת הסיום חייבת להיות אחרי ההתחלה',
    timeConflict: 'הזמן מתנגש עם הזמנה קיימת',
    tentNotFound: 'אוהל לא נמצא',
    neighborhoodNotFound: 'שכונה לא נמצאה',
    tapToAddPhoto: 'הקש להוספת תמונה',
    describeIssue: 'תאר את הבעיה...',
    addNotes: 'הוסף הערות...',
    clearBedsConfirm: 'לנקות את כל המיטות?',
    clearBedsWarning: 'כל המיטות יוגדרו כפנויות ושמות האורחים יוסרו.',
    yesClearAll: 'כן, נקה הכל',
  },
  
  // Form labels
  forms: {
    groupName: 'שם הקבוצה',
    checkInDate: 'תאריך הגעה',
    checkOutDate: 'תאריך עזיבה',
    numberOfPeople: 'מספר אנשים',
    notes: 'הערות',
    cleaningStatus: 'מצב ניקיון',
    workingStatus: 'מצב תפעולי',
    guestName: 'שם האורח',
    issueType: 'סוג הבעיה',
    photo: 'תמונה',
    description: 'תיאור',
    optional: 'אופציונלי',
    startTime: 'שעת התחלה',
    endTime: 'שעת סיום',
  },
  
  // Gender
  gender: {
    female: 'נשים',
    male: 'גברים',
    mixed: 'מעורב',
    unisex: 'יוניסקס',
  },
  
  // Activity Spaces - with Hebrew names
  activitySpaces: {
    ohel_moed: 'אוהל מועד',
    bunker_6: 'ממד 6',
    bunker_7: 'ממד 7',
    bunker_8: 'ממד 8',
    dining_hall: 'חדר אוכל',
  },
  
  // Tabs
  tabs: {
    reservations: 'הזמנות',
    statusAndNotes: 'מצב והערות',
    grid: 'רשת',
    map: 'מפה',
  },
  
  // Filters
  filters: {
    all: 'הכל',
    dirty: '🧹 מלוכלך',
    checkin: "📅 צ'ק-אין היום",
    checkout: "📤 צ'ק-אאוט היום",
    full: '🔴 מלא',
    grouped: 'מקובצים',
    individual: 'בודדים',
  },
  
  // Stats
  stats: {
    neighborhoods: 'שכונות',
    beds: 'מיטות',
    facilities: 'מתקנים',
    groupsArriving: 'קבוצות מגיעות',
    groupsLeaving: 'קבוצות עוזבות',
    tentsToClean: 'אוהלים לניקיון',
    needsAttention: 'דורש תשומת לב',
    todaysArrivals: 'הגעות היום',
    todaysDepartures: 'עזיבות היום',
    tentsToCleanToday: 'אוהלים לניקיון',
    facilitiesAlert: 'התראת מתקנים',
    maintenanceHousekeeping: 'תחזוקה ומשק בית',
  },
  
  // Badges
  badges: {
    vip: 'VIP',
    accessible: 'נגיש',
    privateBath: 'אמבט פרטי',
    privateShower: 'מקלחת פרטית',
    doubleTent: 'אוהל כפול',
  },
  
  // Import/Export
  dataManagement: {
    downloadJson: 'הורד קובץ JSON',
    copyToClipboard: 'העתק ללוח',
    importFromJson: 'ייבא מ-JSON',
    chooseFile: 'בחר קובץ',
    orPasteBelow: 'או הדבק למטה',
    lastModified: 'עודכן לאחרונה:',
    dataStoredLocally: 'כל הנתונים נשמרים מקומית בדפדפן',
    dataPersists: 'הנתונים נשמרים עד ניקוי נתוני הדפדפן',
    exportRegularly: 'ייצא באופן קבוע ליצירת גיבויים',
    useImport: 'השתמש בייבוא להעברת נתונים בין מכשירים',
    noInternetRequired: 'לא נדרש חיבור אינטרנט לאחר הטעינה הראשונית',
    resetEverything: 'כן, אפס הכל',
    deleteWarning: 'כל ההקצאות, שמות האורחים, מצבי הניקיון וההזמנות יימחקו לצמיתות.',
  },
  
  // Calendar
  calendar: {
    dayView: 'יום',
    weekView: 'שבוע',
    monthView: 'חודש',
    showNeighborhoods: 'הצג שכונות',
    showFacilities: 'הצג מתקנים',
    showCheckIns: "הצג צ'ק-אין",
    showCheckOuts: "הצג צ'ק-אאוט",
    todayEvents: 'אירועים היום',
    noEvents: 'אין אירועים',
    legend: 'מקרא',
  },
  
  // Daily tasks
  tasks: {
    manualTasks: 'משימות ידניות',
    autoTasks: 'משימות אוטומטיות',
    addTask: 'הוסף משימה',
    taskType: 'סוג משימה',
    taskTitle: 'כותרת המשימה',
    taskDescription: 'תיאור',
    pending: 'ממתין',
    inProgress: 'בתהליך',
    completed: 'הושלם',
    checkoutTasks: "משימות צ'ק-אאוט",
    checkinTasks: "משימות צ'ק-אין",
    cleaningTasks: 'משימות ניקיון',
    maintenanceTasks: 'משימות תחזוקה',
    other: 'אחר',
  },
  
  // Breadcrumb
  breadcrumb: {
    home: 'דף הבית',
  },
  
  // Neighborhood names (keep original IDs but translate display names)
  neighborhoodNames: {
    N1: 'שכונה 1',
    N2: 'שכונה 2',
    N3: 'שכונה 3',
    N4: 'שכונה 4',
    N5: 'שכונה 5',
    N6: 'שכונה 6',
    N7: 'שכונה 7',
    VIP: 'שכונת VIP',
  },
  
  // Bulk actions
  bulkActions: {
    reserveNeighborhood: 'הזמן שכונה שלמה',
    markAllDirty: 'סמן הכל כמלוכלך',
    markAllClean: 'סמן הכל כנקי',
    releaseAllBeds: 'שחרר את כל המיטות',
    scheduledReservations: 'הזמנות מתוכננות',
    noUpcomingReservations: 'אין הזמנות קרובות',
    removeReservation: 'הסר הזמנה',
  },
};

export type TranslationKey = keyof typeof HE;
