/* ============================================================
 * API 层：页面唯一的数据出口
 * - 页面只允许 import/调用这里的函数，禁止直接用 MockBackend
 * - 接真实后端：把 call() 内部替换为 fetch，函数签名不变
 * ============================================================ */
(function () {
  'use strict';

  /* TODO(backend)：接真实后端时，将 MockBackend.call 替换为真实请求，例如：
   *
   *   function call(method, path, body) {
   *     return fetch('https://api.example.com' + path, {
   *       method: method,
   *       headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
   *       body: method === 'GET' ? undefined : JSON.stringify(body || {})
   *     }).then(function (r) { return r.json(); });
   *   }
   */
  function call(method, path, body) {
    return window.MockBackend.call(method, path, body);
  }

  function request(method, path, body) {
    return call(method, path, body).then(function (resp) {
      if (!resp || resp.code !== 0) {
        var e = new Error((resp && resp.msg) || '请求失败');
        e.code = resp && resp.code;
        throw e;
      }
      return resp.data;
    });
  }

  window.API = {

    /* ---- 会话与终端 ---- */

    /** MP-01 扫码进入 */
    scan: function (terminalCode) {
      return request('POST', '/api/session/scan', { terminalCode: terminalCode });
    },

    /** MP-01/HW-10 终端状态 */
    getTerminal: function (code) {
      return request('GET', '/api/terminals/' + code);
    },

    /* ---- 香型 ---- */

    /** MP-02 香型列表 */
    listFragrances: function () {
      return request('GET', '/api/fragrances');
    },

    /** MP-03 香型详情 */
    getFragrance: function (id) {
      return request('GET', '/api/fragrances/' + id);
    },

    /* ---- 试香 ---- */

    /** MP-04 创建试香订单 */
    createTrialOrder: function (fragranceId) {
      return request('POST', '/api/trial/orders', { fragranceId: fragranceId, terminalCode: 'A03' });
    },

    /** MP-04 试香支付（TODO(wx)：wx.requestPayment） */
    payTrialOrder: function (orderId) {
      return request('POST', '/api/trial/orders/' + orderId + '/pay');
    },

    /** MP-05 试香订单详情 */
    getTrialOrder: function (orderId) {
      return request('GET', '/api/trial/orders/' + orderId);
    },

    /** MP-05/HW-02 触发喷射（needFlush=true 时先播冲洗动画） */
    spray: function (orderId) {
      return request('POST', '/api/trial/orders/' + orderId + '/spray');
    },

    /** MP-08 完成试香并发券 */
    finishTrial: function (orderId) {
      return request('POST', '/api/trial/orders/' + orderId + '/finish');
    },

    /** MP-06/HW-09 试香退款 */
    refundTrial: function (orderId) {
      return request('POST', '/api/trial/orders/' + orderId + '/refund');
    },

    /* ---- 正装购买 ---- */

    /** MP-07 创建正装订单 */
    createShopOrder: function (fragranceId, couponId, address) {
      return request('POST', '/api/shop/orders', { fragranceId: fragranceId, couponId: couponId || null, address: address || null });
    },

    /** MP-07 正装支付（TODO(wx)：wx.requestPayment） */
    payShopOrder: function (orderId) {
      return request('POST', '/api/shop/orders/' + orderId + '/pay');
    },

    /* ---- 订单与优惠券 ---- */

    /** MP-09 订单列表 type: trial | shop */
    listOrders: function (type) {
      return request('GET', '/api/orders?type=' + (type || 'trial'));
    },

    /** MP-08 我的优惠券 */
    listCoupons: function () {
      return request('GET', '/api/coupons');
    },

    /* ---- 演示辅助（不属正式接口） ---- */

    resetDemo: function () {
      return request('POST', '/api/dev/reset');
    }
  };
})();
