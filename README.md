# 知时 Kairos

> 别错过任何一件重要的事。

> **English** — Kairos is a local-first to-do & daily planner PWA with three layers of
> reminders (system-calendar `.ics` export, persistent banner, full-screen alarm).
> No account, no server: all data stays in your own browser.
> Live demo: <https://echo0602.github.io/kairos/>

一个**纯本地**的待办与每日计划 PWA。为「明明列了待办却还是忘记去上课」这件事而做：
把提醒做成三层保险，让你没有任何机会悄悄错过。

- 无需注册、无需服务器，数据只存在你自己的浏览器里
- 手机浏览器打开 → 添加到主屏幕，就是一个全屏 App，离线可用
- 发个链接给同学就能用，各自的数据互不可见

## 它解决什么问题

口袋清单、番茄 ToDo 都很好，但「列了却忘记去」依然会发生——因为通知可以被划掉、
App 可以被关掉。知时把提醒做成三层，任何一层漏了还有下一层：

| 层 | 形式 | 什么时候起作用 |
| --- | --- | --- |
| 系统日历 | 一键导出 `.ics` 导入手机自带日历 | App 关着、手机锁屏也会响，**杀不死** |
| 置顶横幅 | 首页顶部常驻「下一件事」+ 实时倒计时 | 每次打开应用第一眼就看到 |
| 全屏强提醒 | 到点整屏变红、循环铃声 + 震动，必须手动确认 | 应用开着时拦得住你；关掉再打开还会再弹 |

强提醒可以**按条开关**（公共场合怕尴尬就只开横幅），也支持「10 分钟后再提醒我」贪睡。
未确认的提醒会一直追着你：关掉页面、重启浏览器，再打开它还在。

## 功能一览

**待办**
- 两种类型：定时事件（上课 / 开会，支持每天 / 每周 / 工作日重复）与截止任务（交报告 / 填表）
- 分类、优先级、备注、逾期高亮、归档
- 每条单独勾选提醒方式与提前分钟数

**每日计划与完成度**
- 今天该做的事自动汇总：当天发生的事件 + 到期与逾期的任务 + 手动加的临时项
- 点一下圆圈即完成，完成度环形进度实时变化
- 可前后翻日期补看任意一天；点日期标题展开月历，有安排的日子带小点，点一天直接跳过去

**导出与督促**
- 列计划前导出「今日计划」图片；一天结束导出「今日完成报告」图片（完成度、已完成数、连续天数）
- 自习室专注时段结束后生成「专注凭证」图片，发到学习群互相监督
- 统计页：当前连续天数、累计达标天数、累计完成项、累计专注分钟、最近 14 天完成度柱状图

**其他**
- 四套主题（清雅米绿 / 深色专注 / 纸质手账 / 极简黑白）+ 自定义主色
- JSON 一键备份 / 导入（合并或覆盖），换设备不丢数据

## 隐私

所有数据只存在你本机浏览器的 IndexedDB 中，**不上传任何服务器，也没有任何统计埋点**。
导出备份文件也只在你手里。这是刻意的设计：一个能看到你日程的工具，不值得信任。

## 本地开发

需要 Node.js ≥ 20。

```bash
npm install
npm run dev        # 启动后手机连同一 WiFi，访问 http://<电脑IP>:5173/kairos/ 即可真机预览
npm run build      # 产物在 dist/
npm run icons      # 修改 public/icon.svg 后重新生成各尺寸 PNG 图标
```

## 部署到 GitHub Pages

1. 把仓库推送到 GitHub，仓库名建议为 `kairos`
2. 仓库 Settings → Pages → Source 选 **GitHub Actions**
3. 推送 `main` 分支即自动构建部署（见 `.github/workflows/deploy.yml`）
4. 若仓库名不是 `kairos`，把 workflow 里的 `KAIROS_BASE` 改成 `/<你的仓库名>/`

## 手机上安装成 App

- **iOS**：Safari 打开 → 分享按钮 → 「添加到主屏幕」
- **Android / 桌面 Chrome**：地址栏或菜单里的「安装应用 / 添加到主屏幕」

安装后全屏运行、有独立图标，断网也能打开（数据在本地）。

## 目录结构

```
├─ index.html                  入口 HTML：meta、PWA 图标引用、页面标题
├─ vite.config.ts              构建配置：部署 base 路径、React 插件、PWA manifest 与 Service Worker
├─ scripts/gen-icons.mjs       用 sharp 把 public/icon.svg 栅格化成各尺寸 PNG 图标
├─ public/
│  ├─ icon.svg                 应用图标源文件（圆角版）
│  ├─ maskable.svg             自适应形状图标源文件（全出血版）
│  ├─ favicon.svg              浏览器标签页小图标
│  └─ icons/*.png              生成出的 PWA 安装图标（勿手改，用 npm run icons 重新生成）
└─ src/
   ├─ main.tsx                 React 挂载入口
   ├─ App.tsx                  应用外壳：页头、五个页签切换、主题变量注入、强提醒接线
   ├─ config.ts                应用名 / 版本号 / 提醒方式 / 主题等常量，改名只动这一个文件
   ├─ index.css                汇总引入 styles 下两个样式文件
   ├─ styles/
   │  ├─ tokens.css            四套主题的 CSS 变量（颜色 / 圆角 / 阴影 / 字体）
   │  └─ base.css              通用组件类：卡片、按钮、底部弹层、横幅、强提醒、统计条等
   ├─ data/
   │  ├─ types.ts              数据模型：Todo / DayItem / FocusSession / Settings / Backup
   │  ├─ db.ts                 IndexedDB 读写与备份导入导出，全项目唯一碰存储的地方
   │  └─ store.tsx             全局状态与所有增删改操作（React Context）
   ├─ hooks/
   │  └─ useReminders.ts       强提醒引擎：到点判定、确认与贪睡记录、铃声与震动
   ├─ lib/
   │  ├─ date.ts               日期键、重复事件展开、倒计时文案、ICS 时间格式
   │  ├─ plan.ts               把待办换算成「某一天的计划」，并计算完成度
   │  ├─ stats.ts              连续天数、达标天数、累计完成项、专注时长
   │  ├─ ics.ts                生成标准 .ics 日历文件（含 VALARM 提前提醒与 RRULE 重复）
   │  ├─ sharecard.ts          用 Canvas 把计划 / 报告 / 凭证绘制成可分享图片
   │  ├─ sound.ts              WebAudio 报警音与手机震动封装
   │  └─ id.ts                 ID 生成
   ├─ components/              可复用 UI：图标集、页签栏、下一件事横幅、强提醒层、
   │                           待办编辑表单、计划条目行、进度环、分享预览、提示条
   └─ views/                   五个页面：今日 / 待办 / 自习室 / 统计 / 设置
```

## 技术栈

React 19 · TypeScript · Vite · IndexedDB（idb）· vite-plugin-pwa（Workbox）
无 UI 库、无图标库、无后端。样式为手写 CSS 变量主题系统。

## 连续天数规则

- 当天有计划且完成度 ≥ 60%，记为达标一天
- 没有安排任何计划的天会跳过，既不计入也不打断连续
- 今天还没过完时不达标不算中断

规则在统计页内同样写明，不做暗箱。

## 路线图

- [ ] 多人自习室：实时看到谁在专注（需要后端，会做成可选模块）
- [ ] 课表导入（教务系统 / .ics 订阅）
- [ ] 桌面端常驻提醒进程
- [ ] 周报 / 月报图片

数据层（`src/data/db.ts`）是唯一接触存储的模块，将来加云同步或协作只需新增一个
实现相同函数的远程模块，业务层不感知存储位置。

## License

MIT © 2026 Kairos contributors
