/* ============================================================
 * Mock 层：模拟后端全部接口
 * - 接口清单与《接口文档.md》一一对应，改接口先改文档再改这里
 * - 内存状态 + localStorage 持久化（key: ptf_mock_db_v1）
 * - 模拟 250~550ms 网络延迟，支付默认成功
 * 页面代码禁止直接调用 MockBackend，必须经 js/api.js
 * ============================================================ */
(function () {
  'use strict';

  var LS_KEY = 'ptf_mock_db_v1';

  /* ---------------- 静态数据 ---------------- */

  // 当前扫码终端（MP-01）
  var TERMINAL = {
    id: 'T-003',
    code: 'A03',
    name: '图书馆 2F 试香终端',
    location: '河北师范大学 · 图书馆 2F 电梯旁',
    status: 'online'          // online | offline | maintain
  };

  // 模拟用户（MP 登录态）
  var USER = {
    id: 'U-10086',
    nickname: '香友_8f2d',
    avatarEmoji: '☺',
    campus: '河北师大 · 新校区'
  };

  // 20 款香型（grad 为封面渐变色）
  var FRAGRANCES = [
    { id: 'f01', name: '晨雾柑橘', emoji: '🍊', top: ['柑橘', '佛手柑', '青柠'], heart: ['绿茶', '茉莉'], base: ['麝香', '雪松'], desc: '清晨果园般明亮的开场，适合日常通勤的第一支柑橘调。', price: 19.9, status: 'ok',    grad: ['#f6b56b', '#f48c5e'] },
    { id: 'f02', name: '白茶清竹', emoji: '🍵', top: ['白茶', '柠檬'], heart: ['竹叶', '铃兰'], base: ['白麝香', '木质香'], desc: '干净清透的茶感，像雨后的竹林，气质安静不扰人。', price: 19.9, status: 'ok',    grad: ['#a8cf91', '#6ea87c'] },
    { id: 'f03', name: '海盐鼠尾草', emoji: '🌊', top: ['海盐', '葡萄柚'], heart: ['鼠尾草', '薰衣草'], base: ['龙涎香', '雪松'], desc: '咸湿海风混着草本气息，中性清爽，男女通用。', price: 25.9, status: 'ok',    grad: ['#7fc4d8', '#4a8fb5'] },
    { id: 'f04', name: '玫瑰禁令', emoji: '🌹', top: ['荔枝', '粉红胡椒'], heart: ['大马士革玫瑰', '牡丹'], base: ['麝香', '广藿香'], desc: '多汁荔枝包裹盛放玫瑰，甜而不腻的约会战香。', price: 25.9, status: 'ok',    grad: ['#e0829c', '#a84a68'] },
    { id: 'f05', name: '蓝风铃', emoji: '🔔', top: ['蓝风铃', '柠檬'], heart: ['柿子', '野玫瑰'], base: ['白麝香'], desc: '清甜花果香，风铃草般轻盈灵动，学生党人气款。', price: 19.9, status: 'ok',    grad: ['#9db8e8', '#6d86c6'] },
    { id: 'f06', name: '英国梨与小苍兰', emoji: '🍐', top: ['香梨', '甜瓜'], heart: ['小苍兰', '玫瑰'], base: ['广藿香', '琥珀'], desc: '成熟多汁的梨子开场，优雅知性的秋日限定感。', price: 25.9, status: 'ok',    grad: ['#cddc81', '#8faa4e'] },
    { id: 'f07', name: '青梅煮酒', emoji: '🫐', top: ['青梅', '柑橘'], heart: ['桂花', '蜂蜜'], base: ['木质香'], desc: '微酸青梅配暖甜酒香，国风氛围感十足。', price: 19.9, status: 'soldout', grad: ['#8f9fd8', '#5b6bb0'] },
    { id: 'f08', name: '雪松之径', emoji: '🌲', top: ['柏树', '杜松'], heart: ['雪松', '紫罗兰叶'], base: ['香根草', '琥珀'], desc: '干燥木质森林感，沉稳内敛，适合图书馆自习。', price: 19.9, status: 'ok',    grad: ['#7ba47c', '#48705a'] },
    { id: 'f09', name: '乌木沉香', emoji: '🪵', top: ['藏红花', '肉豆蔻'], heart: ['乌木', '玫瑰'], base: ['沉香', '琥珀'], desc: '东方木质调，烟熏微苦，气场极强的夜晚用香。', price: 29.9, status: 'ok',    grad: ['#8a7059', '#4f3d30'] },
    { id: 'f10', name: '桂花乌龙', emoji: '🌼', top: ['桂花', '橙花'], heart: ['乌龙茶', '杏桃'], base: ['麝香', '木质香'], desc: '一杯温热的桂花乌龙，秋日午后的温柔甜香。', price: 19.9, status: 'ok',    grad: ['#e8c46a', '#c9973f'] },
    { id: 'f11', name: '空谷幽兰', emoji: '🤍', top: ['橙花', '柠檬'], heart: ['兰花', '小苍兰'], base: ['白麝香', '檀香'], desc: '清冷疏离的兰香，像空山新雨后的远山淡雾。', price: 25.9, status: 'ok',    grad: ['#c9cdd8', '#8d93a8'] },
    { id: 'f12', name: '蜜桃乌龙', emoji: '🍑', top: ['水蜜桃', '香柠檬'], heart: ['乌龙茶', '茉莉'], base: ['香草', '麝香'], desc: '软糯蜜桃撞上清茶，甜妹氛围拉满的春夏香。', price: 19.9, status: 'ok',    grad: ['#f4a8a0', '#dd7576'] },
    { id: 'f13', name: '馥奇苔藓', emoji: '🌿', top: ['薰衣草', '薄荷'], heart: ['天竺葵', '橡木苔'], base: ['香豆素', '零陵香豆'], desc: '经典馥奇架构，草本微苦，干净利落的皂感。', price: 19.9, status: 'ok',    grad: ['#9db98f', '#5e7f6a'] },
    { id: 'f14', name: '鸢尾粉感', emoji: '🪻', top: ['鸢尾', '醛香'], heart: ['紫罗兰', '含羞草'], base: ['鸢尾根', '麝香'], desc: '粉感鸢尾的高级哑光质感，清冷文艺挂。', price: 29.9, status: 'ok',    grad: ['#b39ac9', '#7d5fa0'] },
    { id: 'f15', name: '橙花日光', emoji: '☀️', top: ['橙花', '苦橙叶'], heart: ['茉莉', '依兰'], base: ['白木', '麝香'], desc: '地中海午后的橙花树影，明媚干净的白色花香。', price: 19.9, status: 'maint',  grad: ['#f5c96e', '#e0973f'] },
    { id: 'f16', name: '香草朗姆', emoji: '🍹', top: ['朗姆酒', '橙皮'], heart: ['香草', '肉桂'], base: ['檀香', '焦糖'], desc: '微醺甜品感美食调，冬天窝在毯子里的味道。', price: 19.9, status: 'ok',    grad: ['#d9a06a', '#a06a3f'] },
    { id: 'f17', name: '墨菊', emoji: '🖤', top: ['黑加仑', '粉椒'], heart: ['菊花', '皮革'], base: ['乳香', '桦木'], desc: '暗黑系花香，微涩皮革感，个性十足的小众香。', price: 29.9, status: 'ok',    grad: ['#8b8b9e', '#4a4a5e'] },
    { id: 'f18', name: '茉莉云', emoji: '☁️', top: ['青梨', '橘子'], heart: ['茉莉', '晚香玉'], base: ['白麝香', '开司米木'], desc: '蓬松如云的茉莉白花，柔和不冲，接受度极高。', price: 19.9, status: 'ok',    grad: ['#d8e3ef', '#9db4d0'] },
    { id: 'f19', name: '琥珀黄昏', emoji: '🌅', top: ['粉红胡椒', '苦橙'], heart: ['琥珀', '玫瑰'], base: ['香草', '没药'], desc: '温暖琥珀包裹花香，落日时分的松弛感。', price: 25.9, status: 'ok',    grad: ['#e0a175', '#b06a4a'] },
    { id: 'f20', name: '松间岛', emoji: '🏝️', top: ['椰子水', '青柠'], heart: ['鸡蛋花', '栀子'], base: ['龙涎香', '雪松'], desc: '热带海岛度假香，椰香花香的假日松弛感。', price: 19.9, status: 'ok',    grad: ['#8fd4c4', '#4fa898'] }
  ];

  /* ---------------- 可变状态（localStorage 持久化） ---------------- */

  var db = loadDb();

  function loadDb() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 忽略坏数据 */ }
    return { seq: 1000, trialOrders: [], shopOrders: [], coupons: [] };
  }
  function saveDb() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(db)); } catch (e) { /* 忽略 */ }
  }
  function resetDb() {
    localStorage.removeItem(LS_KEY);
    db = loadDb();
  }

  /* ---------------- 工具 ---------------- */

  var TRAIL_PRICE = 0.5;      // 试香单价（PRD MP-04）
  var SPRAY_TOTAL = 5;        // 单次凭证喷射次数（PRD HW-04）

  function delay() {
    var ms = 250 + Math.random() * 300;
    return new Promise(function (r) { setTimeout(r, ms); });
  }
  function ok(data)  { return { code: 0, msg: 'ok', data: data }; }
  function fail(code, msg) { return { code: code, msg: msg, data: null }; }

  function findFrag(id) {
    for (var i = 0; i < FRAGRANCES.length; i++) if (FRAGRANCES[i].id === id) return FRAGRANCES[i];
    return null;
  }
  function listItem(f) {  // 列表瘦身字段（MP-02）
    return { id: f.id, name: f.name, emoji: f.emoji, price: f.price, trialPrice: TRAIL_PRICE, status: f.status, grad: f.grad, brief: f.heart.join(' · ') };
  }
  function findTrial(id) {
    for (var i = 0; i < db.trialOrders.length; i++) if (db.trialOrders[i].id === id) return db.trialOrders[i];
    return null;
  }
  function findShop(id) {
    for (var i = 0; i < db.shopOrders.length; i++) if (db.shopOrders[i].id === id) return db.shopOrders[i];
    return null;
  }
  function now() { return Date.now(); }
  function fmtTime(ts) {
    var d = new Date(ts);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ---------------- 路由表：与《接口文档.md》严格对应 ---------------- */

  var routes = [

    /* 1. POST /api/session/scan —— 扫码进入（MP-01）
       handler 签名统一为 (params, query, body) */
    ['POST', '/api/session/scan', function (params, query, body) {
      if (!body || !body.terminalCode) return fail(400, '缺少 terminalCode');
      return ok({
        terminal: TERMINAL,
        user: USER,
        trialPrice: TRAIL_PRICE,
        sprayTotal: SPRAY_TOTAL
      });
    }],

    /* 2. GET /api/fragrances —— 香型列表（MP-02） */
    ['GET', '/api/fragrances', function () {
      return ok(FRAGRANCES.map(listItem));
    }],

    /* 3. GET /api/fragrances/:id —— 香型详情（MP-03） */
    ['GET', '/api/fragrances/:id', function (params) {
      var f = findFrag(params.id);
      if (!f) return fail(404, '香型不存在');
      return ok({
        id: f.id, name: f.name, emoji: f.emoji, grad: f.grad,
        topNotes: f.top, heartNotes: f.heart, baseNotes: f.base,
        desc: f.desc, price: f.price, trialPrice: TRAIL_PRICE, status: f.status
      });
    }],

    /* 4. GET /api/terminals/:code —— 终端状态（MP-01 / HW-10） */
    ['GET', '/api/terminals/:code', function (params) {
      return ok(TERMINAL);
    }],

    /* 5. POST /api/trial/orders —— 创建试香订单（MP-04） */
    ['POST', '/api/trial/orders', function (params, query, body) {
      var f = findFrag(body.fragranceId);
      if (!f) return fail(404, '香型不存在');
      if (f.status !== 'ok') return fail(409, '该香型当前不可试（' + (f.status === 'soldout' ? '已售罄' : '维护中') + '）');
      var order = {
        id: 'TB' + (db.seq++),
        fragranceId: f.id, fragranceName: f.name, emoji: f.emoji, grad: f.grad,
        terminalCode: TERMINAL.code,
        amount: TRAIL_PRICE,
        sprayTotal: SPRAY_TOTAL, sprayLeft: SPRAY_TOTAL, sprayUsed: 0,
        status: 'pending_pay',    // pending_pay | paid | finished | refunded
        createdAt: now()
      };
      db.trialOrders.unshift(order);
      saveDb();
      return ok(order);
    }],

    /* 6. POST /api/trial/orders/:id/pay —— 试香支付（模拟微信支付，MP-04）
       TODO(wx)：真实环境改为小程序拉起 wx.requestPayment，支付回调后置为 paid */
    ['POST', '/api/trial/orders/:id/pay', function (params) {
      var o = findTrial(params.id);
      if (!o) return fail(404, '订单不存在');
      if (o.status === 'pending_pay') {
        o.status = 'paid';
        o.paidAt = now();
        o.expiresAt = now() + 24 * 3600 * 1000;   // 凭证当日有效（MP-06）
      }
      saveDb();
      return ok(o);
    }],

    /* 7. GET /api/trial/orders/:id —— 试香订单详情（MP-05/MP-06） */
    ['GET', '/api/trial/orders/:id', function (params) {
      var o = findTrial(params.id);
      if (!o) return fail(404, '订单不存在');
      return ok(o);
    }],

    /* 8. POST /api/trial/orders/:id/spray —— 触发喷射（MP-05 / HW-02/04/05）
       返回 needFlush=true 时前端先播酒精冲洗动画（首次喷射前冲洗 2~3s） */
    ['POST', '/api/trial/orders/:id/spray', function (params) {
      var o = findTrial(params.id);
      if (!o) return fail(404, '订单不存在');
      if (o.status !== 'paid') return fail(409, '订单状态不允许喷射：' + o.status);
      if (o.sprayLeft <= 0) return fail(409, '喷射次数已用完');
      var needFlush = o.sprayUsed === 0;   // 首喷前冲洗管路
      o.sprayUsed++;
      o.sprayLeft--;
      if (o.sprayLeft === 0) o.status = 'finished';  // 5 喷用完自动完结
      saveDb();
      return ok({ orderId: o.id, needFlush: needFlush, sprayLeft: o.sprayLeft, sprayUsed: o.sprayUsed, status: o.status });
    }],

    /* 9. POST /api/trial/orders/:id/finish —— 完成试香并发券（MP-08）
       幂等：重复调用不重复发券 */
    ['POST', '/api/trial/orders/:id/finish', function (params) {
      var o = findTrial(params.id);
      if (!o) return fail(404, '订单不存在');
      var existed = null;
      db.coupons.forEach(function (c) { if (c.sourceOrderId === o.id) existed = c; });
      if (existed) return ok({ orderId: o.id, coupon: existed, repeat: true });
      var coupon = {
        id: 'CP' + (db.seq++),
        name: '正装立减券',
        amount: 3, threshold: 19,
        status: 'valid',          // valid | used | expired
        sourceOrderId: o.id,
        expireAt: now() + 7 * 24 * 3600 * 1000,
        issuedAt: now()
      };
      db.coupons.unshift(coupon);
      if (o.status === 'paid') o.status = 'finished';
      saveDb();
      return ok({ orderId: o.id, coupon: coupon, repeat: false });
    }],

    /* 10. POST /api/trial/orders/:id/refund —— 试香退款（MP-06 / HW-09）
        仅未喷射（sprayUsed=0）的付费订单可退 */
    ['POST', '/api/trial/orders/:id/refund', function (params) {
      var o = findTrial(params.id);
      if (!o) return fail(404, '订单不存在');
      if (o.status !== 'paid' && o.status !== 'pending_pay') return fail(409, '当前状态不可退款');
      if (o.sprayUsed > 0) return fail(409, '已使用喷射次数，不可退款');
      o.status = 'refunded';
      o.refundAt = now();
      saveDb();
      return ok({ orderId: o.id, refundAmount: o.amount, status: o.status });
    }],

    /* 11. POST /api/shop/orders —— 创建正装订单（MP-07） */
    ['POST', '/api/shop/orders', function (params, query, body) {
      var f = findFrag(body.fragranceId);
      if (!f) return fail(404, '香型不存在');
      if (f.status !== 'ok') return fail(409, '该商品暂不可购买');
      var discount = 0, couponId = null;
      if (body.couponId) {
        var c = null;
        db.coupons.forEach(function (x) { if (x.id === body.couponId) c = x; });
        if (!c) return fail(404, '优惠券不存在');
        if (c.status !== 'valid') return fail(409, '优惠券不可用');
        if (f.price < c.threshold) return fail(409, '未满足用券门槛 ¥' + c.threshold);
        discount = c.amount;
        couponId = c.id;
      }
      var order = {
        id: 'SP' + (db.seq++),
        fragranceId: f.id, fragranceName: f.name, emoji: f.emoji, grad: f.grad,
        price: f.price, discount: discount, couponId: couponId,
        payable: +(f.price - discount).toFixed(2),
        address: body.address || '河北师大新校区 · 6 号宿舍楼 · 传达室代收（演示地址）',
        deliveryType: 'campus',     // 试点期校内配送
        status: 'pending_pay',      // pending_pay | paid | delivering | done
        createdAt: now()
      };
      db.shopOrders.unshift(order);
      saveDb();
      return ok(order);
    }],

    /* 12. POST /api/shop/orders/:id/pay —— 正装支付（模拟微信支付，MP-07）
       TODO(wx)：真实环境拉起 wx.requestPayment */
    ['POST', '/api/shop/orders/:id/pay', function (params) {
      var o = findShop(params.id);
      if (!o) return fail(404, '订单不存在');
      if (o.status === 'pending_pay') {
        o.status = 'paid';       // 试点简化：支付后即进入校内配送
        o.paidAt = now();
        if (o.couponId) db.coupons.forEach(function (c) { if (c.id === o.couponId) c.status = 'used'; });
      }
      saveDb();
      return ok(o);
    }],

    /* 13. GET /api/orders?type=trial|shop —— 订单列表（MP-09） */
    ['GET', '/api/orders', function (params, query) {
      var type = (query.type || 'trial');
      if (type === 'shop') {
        return ok(db.shopOrders.map(function (o) {
          return { id: o.id, fragranceName: o.fragranceName, emoji: o.emoji, grad: o.grad, payable: o.payable, status: o.status, createdAt: fmtTime(o.createdAt) };
        }));
      }
      return ok(db.trialOrders.map(function (o) {
        return { id: o.id, fragranceName: o.fragranceName, emoji: o.emoji, grad: o.grad, amount: o.amount, sprayUsed: o.sprayUsed, sprayTotal: o.sprayTotal, status: o.status, createdAt: fmtTime(o.createdAt) };
      }));
    }],

    /* 14. GET /api/coupons —— 我的优惠券（MP-08） */
    ['GET', '/api/coupons', function () {
      var list = db.coupons.map(function (c) {
        return { id: c.id, name: c.name, amount: c.amount, threshold: c.threshold, status: c.status, expireAt: fmtTime(c.expireAt) };
      });
      return ok(list);
    }],

    /* 15. POST /api/dev/reset —— 演示专用：清空本地演示数据（不写入正式接口文档主表） */
    ['POST', '/api/dev/reset', function () {
      resetDb();
      return ok({ reset: true });
    }]
  ];

  /* ---------------- 调度器 ---------------- */

  function matchRoute(method, path) {
    var qIdx = path.indexOf('?');
    var queryStr = qIdx >= 0 ? path.slice(qIdx + 1) : '';
    var pathOnly = qIdx >= 0 ? path.slice(0, qIdx) : path;
    var parts = pathOnly.split('/').filter(Boolean);

    for (var i = 0; i < routes.length; i++) {
      var r = routes[i];
      if (r[0] !== method) continue;
      var seg = r[1].split('/').filter(Boolean);
      if (seg.length !== parts.length) continue;
      var params = {}, matched = true;
      for (var j = 0; j < seg.length; j++) {
        if (seg[j].charAt(0) === ':') params[seg[j].slice(1)] = decodeURIComponent(parts[j]);
        else if (seg[j] !== parts[j]) { matched = false; break; }
      }
      if (matched) {
        var query = {};
        queryStr.split('&').filter(Boolean).forEach(function (kv) {
          var p2 = kv.split('='); query[p2[0]] = decodeURIComponent(p2[1] || '');
        });
        return { handler: r[2], params: params, query: query };
      }
    }
    return null;
  }

  window.MockBackend = {
    call: function (method, path, body) {
      var m = matchRoute(method, path);
      if (!m) return Promise.resolve(fail(404, 'Mock 未定义接口：' + method + ' ' + path));
      var resp;
      try { resp = m.handler(m.params, m.query, body || {}); }
      catch (e) { resp = fail(500, 'Mock 异常：' + e.message); }
      return delay().then(function () { return resp; });
    }
  };
})();
