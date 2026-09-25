# QuickCal

QuickCal 是一个面向 Apple 用户的轻量日程工具：选择任务类型和时间，即可把日程快速加入 Apple 日历。

## 产品目标

把“打开日历—新建日程—填写标题—调整时间—保存”的多步操作，压缩成一个更轻、更直观的任务安排流程。

## 当前能力

- 工作、学习、会议、运动、个人事务等通用任务类型
- 支持自定义任务类型、图标、颜色和默认时长
- 今天、明天、后天和自定义日期选择
- 全天任务、快捷时间、15 分钟粒度调整
- 任务名称可选：不填写时自动使用任务类型名称
- Mac 端生成日历事件文件
- iPhone 端通过 `QuickCal-Calendar` 快捷指令写入 Apple 日历
- 仅在快捷指令回传成功凭证后显示“已确认加入 Apple 日历”

## 在线体验

[打开 QuickCal](https://quickcal-family.guoxiaoqing2003.chatgpt.site/)

> iPhone 首次使用时，网页会提供最新版 `QuickCal-Calendar` 的安装入口；安装一次后，即可从 QuickCal 一键发起日程创建。若检测到旧版或缺失回执，网页会直接引导重新安装，不会误报成功。

## 本地运行

```bash
npm run check
npm run build
npm test
python3 -m http.server 8080 -d site
```

然后访问 `http://localhost:8080`。

## 项目结构

```text
site/       网页界面与交互
worker/     日历文件服务
scripts/    构建、测试与预览脚本
experiments/shortcut-bridge-test/  iOS 快捷指令通信协议验证
```

## 技术说明

移动端通过 Apple Shortcuts 的 x-callback-url 传递结构化日程数据。QuickCal 会校验快捷指令返回的写入凭证，避免在日历事件未真正创建时误报成功。
