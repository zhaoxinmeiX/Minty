# Minty - 极简个人财务记账应用

Minty 是一款使用 **React Native + Expo** 构建的轻量级、功能丰富的个人财务管理应用。它采用离线优先的设计理念，支持多账本管理、多维统计、日历视图以及数据导入导出，旨在提供最顺滑的记账体验。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Expo](https://img.shields.io/badge/platform-Expo-black.svg)
![React Native](https://img.shields.io/badge/framework-React_Native-61DAFB.svg)

---

## ✨ 核心功能

- 📂 **多账本管理**：支持创建多个独立账本（如：个人、家庭、旅行），轻松隔离账目。
- 🔢 **智能输入**：金额输入框内置计算器，支持 `+ - × ÷` 实时评估，备注录入更快捷。
- 🗂️ **两级分类**：支持自定义一级和二级分类，内置数十款精美图标（Lucide Icons）。
- 📅 **日历视图**：集成月度日历，显示每日收支总计，并支持**农历**显示。
- 📊 **多维统计**：提供饼图分析、分类排行，支持按周、月、年或自定义范围筛选。
- 📤 **数据自由**：支持将账本完整导出为 Excel (`.xlsx`) 文件，或从 Excel 批量导入数据。
- 🔒 **本地优先**：所有数据存储在本地 SQLite 数据库中，不上传至云端，保护用户隐私。

---

## 🛠️ 技术栈

- **框架**: [Expo](https://expo.dev/) (SDK 54) + [React Native](https://reactnative.dev/)
- **路由**: Expo Router (基于文件的路由系统)
- **数据库**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand) + 持久化存储
- **图标**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
- **表格处理**: [xlsx](https://sheetjs.com/) (Excel 导入导出)
- **图表**: React Native Chart Kit

---

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-username/Minty.git
cd Minty
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动应用
```bash
npx expo start
```
你可以使用 iOS 模拟器、Android 模拟器，或在真机上安装 **Expo Go** 扫描二维码查看效果。

---

## 📁 目录结构简述

- `app/`: 基于 Expo Router 的页面路由（首页、日历、添加、统计、设置）。
- `components/`: 可复用的 UI 组件（分类网格、数字键盘、底部详情页等）。
- `src/db/`: 数据库 Schema 定义及 CRUD 核心操作。
- `src/hooks/`: 自定义业务 Hooks（分类管理、账单加载等）。
- `src/utils/`: 工具函数（Excel 处理、农历转换、日期格式化）。
- `assets/`: 字体及静态资源文件。

---

## 📄 许可证

该项目基于 **MIT License** 开源。
