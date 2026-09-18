/* ============================================================
 * 试香吧 · C 端页面逻辑（hash 路由 + 视图渲染）
 * 页面对应 PRD：MP-01 ~ MP-09
 * 数据一律经 window.API（js/api.js），不直接碰 Mock
 * ============================================================ */
(function () {
  'use strict';

  var view = document.getElementById('view');
  var navTitle = document.getElementById('navTitle');
  var navBack = document.getElementById('navBack');
  var tabbar = document.getElementById('tabbar');
  var toastEl = document.getElementById('toast');
  var loadingEl = document.getElementById('loading');

  var appState = {
    session: null,      // scan() 结果缓存
    activeTab: 'home'
  };

  /* ---------------- 基础 UI 工具 ---------------- */

  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.hidden = true; }, ms || 1800);
  }

  function loading(show) { loadingEl.hidden = !show; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function go(hash) { location.hash = hash; }

  function setChrome(title, back, tab) {
    navTitle.textContent = title;
    navBack.hidden = !back;
    appState.activeTab = tab || null;
    Array.prototype.forEach.call(tabbar.children, function (b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
  }

  /* ---------------- 路由 ---------------- */

  var routes = [
    { re: /^#?\/?$/,                view: pageHome,   chrome: ['试香吧', false, 'home'] },
    { re: /^#\/home$/,              view: pageHome,   chrome: ['试香吧', false, 'home'] },
    { re: /^#\/detail\/(\w+)$/,     view: pageDetail, chrome: ['香型详情', true, 'home'] },
    { re: /^#\/spray\/(\w+)$/,      view: pageSpray,  chrome: ['雾化试香', true, null] },
    { re: /^#\/result\/(\w+)$/,     view: pageResult, chrome: ['试香完成', true, null] },
    { re: /^#\/buy\/(\w+)$/,        view: pageBuy,    chrome: ['确认订单', true, null] },
    { re: /^#\/orders(?:\?tab=(\w+))?$/, view: pageOrders, chrome: ['我的订单', false, 'orders'] },
    { re: /^#\/mine$/,              view: pageMine,   chrome: ['我的', false, 'mine'] }
  ];

  function render() {
    var hash = location.hash || '';
    for (var i = 0; i < routes.length; i++) {
      var m = hash.match(routes[i].re);
      if (m) {
        var c = routes[i].chrome;
        setChrome(c[0], c[1], c[2]);
        view.scrollTop = 0;
        routes[i].view.apply(null, m.slice(1));
        return;
      }
    }
    go('#/home');
  }

  window.addEventListener('hashchange', render);

  tabbar.addEventListener('click', function (e) {
    var btn = e.target.closest('.tab');
    if (!btn) return;
    go('#/' + btn.dataset.tab);
  });
  navBack.addEventListener('click', function () { history.back(); });

  /* ============================================================
   * 页面：首页（MP-01 / MP-02）
   * ============================================================ */

  function pageHome() {
    loading(true);
    Promise.all([API.scan('A03'), API.listFragrances()])
      .catch(function (err) { toast(err.message || '加载失败'); return [null, []]; })
      .then(function (rs) {
        loading(false);
        appState.session = rs[0];
        var term = rs[0] && rs[0].terminal;
        var list = rs[1] || [];

        var cards = list.map(function (f) {
          var dim = f.status !== 'ok';
          var badge = f.status === 'soldout' ? '<span class="card-badge">已售罄</span>'
                    : f.status === 'maint'  ? '<span class="card-badge">维护中</span>' : '';
          return (
            '<div class="card ' + (dim ? 'dim' : '') + '" data-id="' + f.id + '">' +
              badge +
              '<div class="card-cover" style="background:linear-gradient(135deg,' + f.grad[0] + ',' + f.grad[1] + ')">' + f.emoji + '</div>' +
              '<div class="card-body">' +
                '<div class="card-name">' + esc(f.name) + '</div>' +
                '<div class="card-notes">' + esc(f.brief) + '</div>' +
                '<div class="card-foot">' +
                  '<div class="card-price"><em>¥' + f.trialPrice + '</em>试香<span class="full">正装 ¥' + f.price + '</span></div>' +
                  '<button class="card-btn" ' + (dim ? 'disabled' : '') + '>试香</button>' +
                '</div>' +
              '</div>' +
            '</div>'
          );
        }).join('');

        view.innerHTML =
          '<div class="hero">' +
            '<div class="hero-badge">MOBILE FRAGRANCE BAR</div>' +
            '<h1>先闻后买 · 0.5 元试香</h1>' +
            '<p>20 款小众香 · 单次付费 5 喷 · 试完再决定要不要正装</p>' +
            '<div class="hero-term"><span class="hero-dot"></span>' + esc(term ? term.location : '河北师范大学') + ' · 终端 ' + esc(term ? term.code : 'A03') + '</div>' +
            '<div class="hero-perfume">🧪</div>' +
          '</div>' +
          '<div class="section-head"><h2>本机在售香型</h2><span>共 ' + list.length + ' 款 · 售罄/维护不可试</span></div>' +
          '<div class="grid">' + cards + '</div>';

        view.querySelectorAll('.card').forEach(function (card) {
          card.addEventListener('click', function () {
            var f = list.filter(function (x) { return x.id === card.dataset.id; })[0];
            if (f.status !== 'ok') { toast(f.status === 'soldout' ? '该香型已售罄，看看别的吧' : '该香型维护中，稍后再来'); return; }
            go('#/detail/' + f.id);
          });
        });
      });
  }

  /* ============================================================
   * 页面：香型详情（MP-03）+ 模拟支付（MP-04）
   * ============================================================ */

  function pageDetail(id) {
    appState.lastFragId = id;
    loading(true);
    API.getFragrance(id).then(function (f) {
      loading(false);
      if (f.status !== 'ok') { toast('该香型暂不可试'); }

      function chips(arr) { return arr.map(function (n) { return '<span class="chip">' + esc(n) + '</span>'; }).join(''); }

      view.innerHTML =
        '<div class="dt-cover" style="background:linear-gradient(135deg,' + f.grad[0] + ',' + f.grad[1] + ')">' +
          '<span class="dt-emoji">' + f.emoji + '</span>' +
          '<span class="dt-en">EAU DE PARFUM</span>' +
        '</div>' +
        '<div class="dt-head"><h2>' + esc(f.name) + '</h2>' +
          '<div class="dt-price">¥' + f.price + ' <em>/ 30ml 正装</em></div></div>' +
        '<p class="dt-desc">' + esc(f.desc) + '</p>' +

        '<div class="note-block">' +
          '<div class="note-row"><span class="note-label">前调</span><div class="note-chips">' + chips(f.topNotes) + '</div></div>' +
          '<div class="note-row"><span class="note-label">中调</span><div class="note-chips">' + chips(f.heartNotes) + '</div></div>' +
          '<div class="note-row"><span class="note-label">后调</span><div class="note-chips">' + chips(f.baseNotes) + '</div></div>' +
        '</div>' +

        '<div class="notice">' +
          '<b>试香须知</b><br>' +
          '· ¥0.5 / 次，单次 5 喷，手持喷嘴可喷于耳后、手腕、衣物<br>' +
          '· 每次试香前设备自动酒精冲洗管路 2~3 秒，防串味<br>' +
          '· 试香凭证当日有效，未使用可退款；试香完成自动发放正装立减券' +
        '</div>' +

        '<div class="actionbar">' +
          '<button class="btn ghost" id="btn-buy">¥' + f.price + ' 直接买正装</button>' +
          '<button class="btn" id="btn-trial" ' + (f.status !== 'ok' ? 'disabled' : '') + '>¥0.5 立即试香</button>' +
        '</div>';

      document.getElementById('btn-buy').addEventListener('click', function () { go('#/buy/' + f.id); });

      var trialBtn = document.getElementById('btn-trial');
      if (f.status === 'ok') {
        trialBtn.addEventListener('click', function () { showPaySheet(f); });
      }
    }).catch(function (err) { loading(false); toast(err.message); });

    /* 模拟支付弹层 */
    function showPaySheet(f) {
      var sheet = document.createElement('div');
      sheet.className = 'mask';
      sheet.innerHTML =
        '<div class="sheet">' +
          '<span class="sheet-close">✕</span>' +
          '<h3>确认试香</h3>' +
          '<div class="pay-amount"><em>¥</em><b>0.50</b></div>' +
          '<div class="pay-row"><span>香型</span><b>' + esc(f.name) + ' · 5 喷</b></div>' +
          '<div class="pay-row"><span>终端</span><b>' + esc(appState.session ? appState.session.terminal.code : 'A03') + ' 号机</b></div>' +
          '<div class="pay-row"><span>支付方式</span><b>微信支付（模拟）</b></div>' +
          '<div style="margin-top:16px"><button class="btn block" id="mock-pay">模拟支付 ¥0.50</button></div>' +
        '</div>';
      document.querySelector('.phone').appendChild(sheet);
      sheet.querySelector('.sheet-close').addEventListener('click', function () { sheet.remove(); });
      sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.remove(); });

      /* TODO(wx)：真实环境此处调用 wx.requestPayment，支付成功回调后再跳转 */
      sheet.querySelector('#mock-pay').addEventListener('click', function () {
        var btn = this;
        btn.disabled = true; btn.textContent = '支付中…';
        API.createTrialOrder(f.id)
          .then(function (order) { return API.payTrialOrder(order.id); })
          .then(function (order) {
            sheet.remove();
            toast('支付成功，凭证当日有效');
            setTimeout(function () { go('#/spray/' + order.id); }, 400);
          })
          .catch(function (err) { btn.disabled = false; btn.textContent = '模拟支付 ¥0.50'; toast(err.message); });
      });
    }
  }

  /* ============================================================
   * 页面：雾化试香（MP-05 / MP-06，HW-02/04/05）
   * ============================================================ */

  function pageSpray(orderId) {
    loading(true);
    API.getTrialOrder(orderId).then(function (o) {
      loading(false);

      var state = {
        left: o.sprayLeft,
        total: o.sprayTotal,
        busy: false,
        done: o.status === 'finished' || o.sprayLeft === 0
      };

      view.innerHTML =
        '<div class="spray-status">' +
          '<div class="frag-mini" style="background:linear-gradient(135deg,' + o.grad[0] + ',' + o.grad[1] + ')">' + o.emoji + '</div>' +
          '<div><div class="frag-name">' + esc(o.fragranceName) + '</div>' +
            '<div class="frag-sub">订单 ' + esc(o.id) + ' · ' + state.total + ' 喷 / 次</div></div>' +
          '<div class="left-pill"><b id="sp-left">' + state.left + '</b>剩余次数</div>' +
        '</div>' +

        '<div class="steps">' +
          '<div class="step done"><i></i>扫码支付</div>' +
          '<div class="step done"><i></i>冲洗管路</div>' +
          '<div class="step' + (state.done ? ' done' : '') + '"><i></i>雾化试香</div>' +
          '<div class="step"><i></i>领券下单</div>' +
        '</div>' +

        '<div class="spray-stage">' +
          '<button class="spray-btn" id="spray-btn">' +
            '<span class="sp-ico">🌬</span>' +
            '<span class="sp-txt" id="sp-txt">' + (state.done ? '已完成' : '轻触喷雾') + '</span>' +
            '<span class="sp-sub" id="sp-sub">' + (state.done ? '去领优惠券吧' : '对准手腕 / 耳后，按一次喷一次') + '</span>' +
          '</button>' +
          '<div class="spray-hint">每次试香前设备自动用酒精冲洗管路 2~3 秒防串味<br>喷嘴为手持式，可喷于耳后、手腕、衣物</div>' +
        '</div>' +

        '<div class="actionbar">' +
          (state.left === o.total && !state.done
            ? '<button class="btn ghost" id="btn-refund">未使用 · 申请退款</button>'
            : '') +
          '<button class="btn" id="btn-goresult">' + (state.done ? '完成 · 领取优惠券' : '不喷了，直接完成') + '</button>' +
        '</div>';

      var btn = document.getElementById('spray-btn');
      var leftEl = document.getElementById('sp-left');

      function refreshDone() {
        state.done = true;
        document.getElementById('sp-txt').textContent = '已完成';
        document.getElementById('sp-sub').textContent = '去领优惠券吧';
        btn.disabled = true;
        document.querySelectorAll('.step')[2].classList.add('done');
        document.getElementById('btn-goresult').textContent = '完成 · 领取优惠券';
      }

      function playFlush(cb) {
        var overlay = document.createElement('div');
        overlay.className = 'flush-overlay';
        overlay.innerHTML =
          '<div class="flush-box">' +
            '<div class="spin-lg"></div>' +
            '<h4>酒精冲洗管路中…</h4>' +
            '<p>正在冲刷管路残留，防止不同香型串味（约 3 秒）</p>' +
            '<div class="flush-bar"><i id="flush-i"></i></div>' +
          '</div>';
        document.querySelector('.phone').appendChild(overlay);
        var bar = overlay.querySelector('#flush-i');
        var t = 0;
        var timer = setInterval(function () { t += 0.3; bar.style.width = Math.min(100, t / 3 * 100) + '%'; }, 300);
        setTimeout(function () {
          clearInterval(timer);
          overlay.remove();
          toast('管路冲洗完成，开始试香');
          cb();
        }, 3000);
      }

      btn.addEventListener('click', function () {
        if (state.busy || state.done) return;
        state.busy = true;
        API.spray(orderId).then(function (r) {
          var after = function () {
            state.left = r.sprayLeft;
            leftEl.textContent = state.left;
            var mist = document.createElement('span');
            mist.className = 'mist';
            btn.appendChild(mist);
            setTimeout(function () { mist.remove(); }, 750);
            state.busy = false;
            if (state.left === 0) {
              refreshDone();
              setTimeout(function () { go('#/result/' + orderId); }, 900);
            }
          };
          if (r.needFlush) playFlush(after);   // 首喷：先冲洗（HW-02）
          else after();
        }).catch(function (err) { state.busy = false; toast(err.message); });
      });

      document.getElementById('btn-goresult').addEventListener('click', function () { go('#/result/' + orderId); });

      var refundBtn = document.getElementById('btn-refund');
      if (refundBtn) refundBtn.addEventListener('click', function () {
        refundBtn.disabled = true; refundBtn.textContent = '退款中…';
        API.refundTrial(orderId).then(function () {
          toast('已退款 ¥0.50，1 分钟内到账（模拟）');
          setTimeout(function () { go('#/orders?tab=trial'); }, 700);
        }).catch(function (err) { refundBtn.disabled = false; refundBtn.textContent = '未使用 · 申请退款'; toast(err.message); });
      });
    }).catch(function (err) { loading(false); toast(err.message); });
  }

  /* ============================================================
   * 页面：试香完成 / 发券（MP-08）
   * ============================================================ */

  function pageResult(orderId) {
    loading(true);
    API.finishTrial(orderId).then(function (r) {   // 幂等发券
      loading(false);
      var c = r.coupon;
      view.innerHTML =
        '<div class="done-hero">' +
          '<span class="done-ico">🎉</span>' +
          '<h2>试香完成！</h2>' +
          '<p>感谢体验，送你一张正装立减券，7 天内有效</p>' +
        '</div>' +
        '<div class="coupon">' +
          '<div class="amt"><em>¥</em><b>' + c.amount + '</b><em>立减</em></div>' +
          '<div class="info"><b>' + esc(c.name) + '（满 ' + c.threshold + ' 可用）</b>' +
            '<span>来源：试香订单 ' + esc(orderId) + '</span>' +
            '<span>有效期至 ' + esc(fmtTs(c.expireAt)) + '</span></div>' +
        '</div>' +
        '<div style="margin-top:22px; display:flex; flex-direction:column; gap:10px;">' +
          '<button class="btn gold block" id="r-buy">用券下单正装 · 立省 ¥' + c.amount + '</button>' +
          '<button class="btn ghost block" id="r-again">再试一款</button>' +
        '</div>';
      document.getElementById('r-buy').addEventListener('click', function () {
        go('#/buy/' + (appState.lastFragId || 'f01'));
      });
      document.getElementById('r-again').addEventListener('click', function () { go('#/home'); });
    }).catch(function (err) { loading(false); toast(err.message); });
  }

  function fmtTs(ts) {
    var d = new Date(ts);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /* ============================================================
   * 页面：正装下单（MP-07）
   * ============================================================ */

  function pageBuy(fid) {
    appState.lastFragId = fid;
    loading(true);
    Promise.all([API.getFragrance(fid), API.listCoupons()])
      .then(function (rs) {
        loading(false);
        var f = rs[0], coupons = rs[1] || [];
        var usable = coupons.filter(function (c) { return c.status === 'valid' && f.price >= c.threshold; });
        var sel = null;
        usable.sort(function (a, b) { return b.amount - a.amount; });
        if (usable.length) sel = usable[0];

        function renderBody() {
          var discount = sel ? sel.amount : 0;
          var payable = (f.price - discount).toFixed(2);
          var couponRows = usable.length
            ? usable.map(function (c) {
                return '<div class="coupon-select" data-cid="' + c.id + '">' +
                  '<span>' + esc(c.name) + '（满' + c.threshold + '减' + c.amount + '）</span>' +
                  '<span class="val' + (sel && sel.id === c.id ? '' : ' none') + '">' + (sel && sel.id === c.id ? '−¥' + c.amount : '不使用') + '</span></div>';
              }).join('')
            : '<div class="coupon-select"><span>暂无可用优惠券</span><span class="val none">—</span></div>';

          return (
            '<div class="form-card"><div class="form-title">收货信息 <span>试点期 · 校内配送</span></div>' +
              '<div class="addr"><span class="addr-ico">📍</span><div>' +
                '<div class="addr-line1">6 号宿舍楼 · 传达室代收</div>' +
                '<div class="addr-line2">河北师大新校区（演示地址）· 收件人：香友_8f2d · 138****6666</div>' +
              '</div></div></div>' +

            '<div class="form-card"><div class="form-title">商品信息</div>' +
              '<div class="goods-row">' +
                '<div class="goods-thumb" style="background:linear-gradient(135deg,' + f.grad[0] + ',' + f.grad[1] + ')">' + f.emoji + '</div>' +
                '<div><div class="goods-name">' + esc(f.name) + ' · 30ml 正装</div>' +
                  '<div class="goods-sub">试香同款 · 校内次日达</div></div>' +
                '<div class="goods-price"><b>¥' + f.price + '</b><span>试香价可抵心智</span></div>' +
              '</div></div>' +

            '<div class="form-card"><div class="form-title">选择优惠券</div>' + couponRows + '</div>' +

            '<div class="form-card">' +
              '<div class="sum-row"><span>商品金额</span><span>¥' + f.price.toFixed(2) + '</span></div>' +
              '<div class="sum-row"><span>优惠券</span><span class="discount">' + (discount ? '−¥' + discount.toFixed(2) : '无') + '</span></div>' +
              '<div class="sum-row"><span>配送费</span><span>校内免运费</span></div>' +
              '<div class="sum-row total"><span>应付</span><span><b>¥' + payable + '</b></span></div>' +
            '</div>' +

            '<div class="actionbar">' +
              '<button class="btn block" id="btn-pay" ' + (f.status !== 'ok' ? 'disabled' : '') + '>模拟支付 ¥' + payable + '</button>' +
            '</div>'
          );
        }

        function mount() {
          view.innerHTML = renderBody();
          view.querySelectorAll('.coupon-select[data-cid]').forEach(function (row) {
            row.addEventListener('click', function () {
              if (sel && sel.id === row.dataset.cid) { sel = null; }
              else { sel = usable.filter(function (c) { return c.id === row.dataset.cid; })[0]; }
              mount();
            });
          });
          document.getElementById('btn-pay').addEventListener('click', function () {
            var btn = this;
            btn.disabled = true; btn.textContent = '支付中…';
            /* TODO(wx)：wx.requestPayment */
            API.createShopOrder(f.id, sel ? sel.id : null, null)
              .then(function (order) { return API.payShopOrder(order.id); })
              .then(function () {
                toast('支付成功，商品即将从校内仓发出');
                setTimeout(function () { go('#/orders?tab=shop'); }, 700);
              })
              .catch(function (err) { btn.disabled = false; btn.textContent = '重新支付'; toast(err.message); });
          });
        }
        mount();
      })
      .catch(function (err) { loading(false); toast(err.message); });
  }

  /* ============================================================
   * 页面：订单列表（MP-09）
   * ============================================================ */

  function pageOrders(tab) {
    var type = tab === 'shop' ? 'shop' : 'trial';
    loading(true);
    API.listOrders(type).then(function (list) {
      loading(false);

      var trialState = { pending_pay: ['待支付', 'pending'], paid: ['试香中', 'paid'], finished: ['已完成', 'done'], refunded: ['已退款', 'refund'] };
      var shopState = { pending_pay: ['待支付', 'pending'], paid: ['配送中', 'paid'], delivering: ['配送中', 'paid'], done: ['已完成', 'done'] };

      var rows;
      if (!list.length) {
        rows = '<div class="empty"><span class="empty-ico">🧾</span>还没有' + (type === 'shop' ? '正装' : '试香') + '订单<br>去首页试试 0.5 元试香吧</div>';
      } else {
        rows = list.map(function (o) {
          var st = type === 'shop' ? shopState[o.status] : trialState[o.status];
          var sub = type === 'shop'
            ? '校内配送 · 下单时间 ' + o.createdAt
            : '已喷 ' + o.sprayUsed + '/' + o.sprayTotal + ' 次 · ' + o.createdAt;
          var amt = type === 'shop' ? o.payable : o.amount;
          return (
            '<div class="order-card">' +
              '<div class="order-top"><span class="order-no">单号 ' + esc(o.id) + '</span>' +
                '<span class="order-state ' + st[1] + '">' + st[0] + '</span></div>' +
              '<div class="order-main">' +
                '<div class="goods-thumb" style="background:linear-gradient(135deg,' + o.grad[0] + ',' + o.grad[1] + ')">' + o.emoji + '</div>' +
                '<div><div class="g-name">' + esc(o.fragranceName) + '</div><div class="g-sub">' + esc(sub) + '</div></div>' +
                '<div class="g-amt">¥' + amt + '</div>' +
              '</div>' +
              (type === 'trial' && o.status === 'paid'
                ? '<div class="order-foot"><button class="btn ghost sm" data-resume="' + esc(o.id) + '">继续试香</button></div>' : '') +
            '</div>'
          );
        }).join('');
      }

      view.innerHTML =
        '<div class="seg">' +
          '<button data-t="trial" class="' + (type === 'trial' ? 'active' : '') + '">试香记录</button>' +
          '<button data-t="shop" class="' + (type === 'shop' ? 'active' : '') + '">正装订单</button>' +
        '</div>' + rows;

      view.querySelectorAll('.seg button').forEach(function (b) {
        b.addEventListener('click', function () { go('#/orders?tab=' + b.dataset.t); });
      });
      view.querySelectorAll('[data-resume]').forEach(function (b) {
        b.addEventListener('click', function () { go('#/spray/' + b.dataset.resume); });
      });
    }).catch(function (err) { loading(false); toast(err.message); });
  }

  /* ============================================================
   * 页面：我的（优惠券，MP-08）
   * ============================================================ */

  function pageMine() {
    loading(true);
    Promise.all([API.scan('A03'), API.listCoupons()]).then(function (rs) {
      loading(false);
      var u = rs[0].user;
      var coupons = rs[1] || [];
      var cpRows = coupons.length ? coupons.map(function (c) {
        return (
          '<div class="coupon ' + (c.status !== 'valid' ? 'used' : '') + '">' +
            '<div class="amt"><em>¥</em><b>' + c.amount + '</b><em>立减</em></div>' +
            '<div class="info"><b>' + esc(c.name) + '（满 ' + c.threshold + ' 可用）</b>' +
              '<span>' + (c.status === 'valid' ? '有效期至 ' + esc(c.expireAt) : (c.status === 'used' ? '已使用' : '已过期')) + '</span></div>' +
          '</div>'
        );
      }).join('') : '<div class="empty" style="padding:30px 0">暂无优惠券<br>完成试香即可获得正装立减券</div>';

      view.innerHTML =
        '<div class="me-card">' +
          '<div class="me-avatar">' + u.avatarEmoji + '</div>' +
          '<div><div class="me-name">' + esc(u.nickname) + '</div>' +
            '<div class="me-sub">' + esc(u.campus) + ' · 微信一键登录（模拟）</div></div>' +
        '</div>' +
        '<div class="section-head"><h2>我的优惠券</h2><span>' + coupons.filter(function (c) { return c.status === 'valid'; }).length + ' 张可用</span></div>' +
        cpRows +
        '<div class="me-menu" style="margin-top:18px">' +
          '<div class="me-item" id="mi-reset"><span class="mi-ico">♻️</span>重置演示数据<span class="mi-arrow">›</span></div>' +
          '<div class="me-item" id="mi-about"><span class="mi-ico">ℹ️</span>关于本演示<span class="mi-arrow">›</span></div>' +
        '</div>';

      document.getElementById('mi-reset').addEventListener('click', function () {
        API.resetDemo().then(function () { toast('演示数据已重置'); setTimeout(function () { go('#/home'); location.reload(); }, 600); });
      });
      document.getElementById('mi-about').addEventListener('click', function () {
        toast('前端样式演示版 · 接口全部 Mock，详见《接口文档.md》', 2600);
      });
    }).catch(function (err) { loading(false); toast(err.message); });
  }

  /* ---------------- 启动 ---------------- */

  render();
})();
