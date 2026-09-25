/* طبقة البيانات: Firebase Realtime Database مع بديل محلي (localStorage) */
const Store = (() => {
  const CFG = window.ISHRAQ_CONFIG || {};
  const LOCAL_KEY = 'ishraq-db-v1';
  const FB_VER = '10.12.2';
  let state = {};
  let mode = 'local';
  let rootRef = null;
  const subs = new Set();
  let notifyQueued = false;

  const parts = p => String(p || '').split('/').filter(Boolean);

  function getIn(obj, path) {
    return parts(path).reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  function setIn(obj, path, val) {
    const ps = parts(path);
    if (!ps.length) return val ?? {};
    let o = obj;
    for (let i = 0; i < ps.length - 1; i++) {
      if (o[ps[i]] == null || typeof o[ps[i]] !== 'object') o[ps[i]] = {};
      o = o[ps[i]];
    }
    const last = ps[ps.length - 1];
    if (val === undefined || val === null) delete o[last];
    else o[last] = val;
    return obj;
  }

  function clean(v) {
    // Firebase لا يقبل undefined
    return v === undefined ? null : JSON.parse(JSON.stringify(v));
  }

  function notify() {
    if (notifyQueued) return;
    notifyQueued = true;
    queueMicrotask(() => {
      notifyQueued = false;
      subs.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });
    });
  }

  function saveLocal() {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch (e) { console.warn(e); }
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src));
      document.head.appendChild(s);
    });
  }

  async function initFirebase() {
    await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app-compat.js`);
    await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-database-compat.js`);
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(CFG.firebase);
    rootRef = app.database().ref(CFG.dbRoot || 'ishraq');
    await new Promise((resolve, reject) => {
      let first = true;
      const t = setTimeout(() => first && reject(new Error('timeout')), 12000);
      rootRef.on('value', snap => {
        state = snap.val() || {};
        if (first) { first = false; clearTimeout(t); resolve(); }
        notify();
      }, err => { if (first) { clearTimeout(t); reject(err); } else console.error(err); });
    });
    mode = 'firebase';
  }

  function initLocal() {
    try { state = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') || {}; } catch { state = {}; }
    window.addEventListener('storage', e => {
      if (e.key !== LOCAL_KEY) return;
      try { state = JSON.parse(e.newValue || '{}') || {}; } catch { state = {}; }
      notify();
    });
    mode = 'local';
  }

  async function init() {
    if (CFG.firebase && CFG.firebase.databaseURL) {
      try { await initFirebase(); return mode; }
      catch (e) {
        console.error('Firebase unavailable, falling back to local storage', e);
        initLocal();
        mode = 'local-fallback';
        return mode;
      }
    }
    initLocal();
    return mode;
  }

  function set(path, val) {
    val = clean(val);
    state = setIn(state, path, val);
    if (rootRef) {
      const p = parts(path).join('/');
      (p ? rootRef.child(p) : rootRef).set(val).catch(err => {
        console.error(err);
        window.toast && toast('تعذّر الحفظ في قاعدة البيانات: ' + err.message, 'error');
      });
    } else saveLocal();
    notify();
  }

  function update(path, obj) {
    obj = clean(obj) || {};
    Object.entries(obj).forEach(([k, v]) => { state = setIn(state, parts(path).concat(k).join('/'), v); });
    if (rootRef) {
      const p = parts(path).join('/');
      (p ? rootRef.child(p) : rootRef).update(obj).catch(err => {
        console.error(err);
        window.toast && toast('تعذّر الحفظ في قاعدة البيانات: ' + err.message, 'error');
      });
    } else saveLocal();
    notify();
  }

  const remove = path => set(path, null);

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function push(path, obj) {
    const id = newId();
    set(`${path}/${id}`, { ...obj, id });
    return id;
  }

  const get = path => getIn(state, path);
  const list = path => Object.values(get(path) || {}).filter(Boolean);
  const subscribe = fn => { subs.add(fn); return () => subs.delete(fn); };

  return { init, get, list, set, update, remove, push, newId, subscribe, get mode() { return mode; } };
})();
