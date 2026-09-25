/* إعدادات منصة إشراق
 * ---------------------------------------------------------------
 * firebase: إعدادات Firebase Realtime Database. اجعلها null للعمل محلياً
 *           (تُحفظ البيانات في متصفح الجهاز فقط).
 * dbRoot:   المسار الجذري للبيانات داخل قاعدة البيانات.
 * adminCode: الرمز السري لدخول لوحة الإدارة.
 */
window.ISHRAQ_CONFIG = {
  firebase: {
    databaseURL: 'https://ishraq-c9328-default-rtdb.firebaseio.com'
    // يمكن إضافة بقية مفاتيح المشروع هنا (apiKey, authDomain, projectId ...) عند الحاجة
  },
  dbRoot: 'ishraq',
  adminCode: '2026',
  // رابط المنصة الذي يُرسل للأعضاء في رسالة معلومات الدخول
  siteUrl: 'https://hussain-al-hajji.github.io/Ishraq/'
};
