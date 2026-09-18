# 香水 · 自助试香终端项目

校园 & 社区自助香水试香终端：试香纸终端免费引流 + 单雾化头电控雾化终端付费试香（¥0.5 / 5 喷）+ 微信小程序承接正装转化。首期试点：河北师范大学 10 个点位。

## 仓库结构

```
perfume/
├── frontend/                  前端演示版（纯 HTML/CSS/JS + 全 Mock 接口，双击 index.html 即可预览）
│   ├── index.html             入口
│   ├── css/style.css          样式
│   └── js/mock.js|api.js|app.js   Mock 层 / 统一 API 层 / 页面逻辑
└── lcyperson/                 项目文档
    ├── 自产文件/              本项目产出：商业计划书、PRD、执行计划、接口文档
    └── 外来文件/              外部收集资料（报价、参考文章等）
```

## 核心文档

| 文档 | 说明 |
| ---- | ---- |
| `lcyperson/自产文件/自助试香终端项目商业计划书.md` | 商业模式、硬件方案、成本与盈利测算 |
| `lcyperson/自产文件/自助试香终端系统需求文档PRD.md` | 小程序 / 终端固件 / 后台的功能需求 |
| `lcyperson/自产文件/前端开发执行计划.md` | 前端任务分解、里程碑、验收标准 |
| `lcyperson/自产文件/接口文档.md` | 全部 Mock 接口契约（15 个），接真实后端前必读 |

## 快速预览前端

```bash
cd frontend
python -m http.server 8080
# 浏览器打开 http://127.0.0.1:8080
```

或直接双击 `frontend/index.html`。
