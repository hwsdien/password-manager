# 小红密码管理器

安全、本地优先的密码管理器，基于 Tauri + React + TypeScript 构建。

## 功能特性

- **安全加密**：所有密码使用 AES-256-GCM 加密，密钥派生采用 Argon2id
- **本地存储**：密码仅存储在本地，不会上传至任何服务器
- **主密码保护**：单一主密码保护您的整个密码库
- **密码生成器**：内置随机密码生成器，支持自定义长度和符号
- **明暗主题**：支持暗黑模式和明亮模式切换
- **双语支持**：简体中文和 English
- **导入导出**：备份和恢复加密的密码库文件

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Tailwind CSS
- **后端**：Rust + Tauri
- **加密**：Argon2id + AES-256-GCM

## 快速开始

### 环境要求

- Node.js >= 18
- Rust >= 1.85
- Xcode Command Line Tools (macOS)

### 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（热重载）
npm run tauri dev
```

### 构建

```bash
# 构建生产版本
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`。

## 项目结构

```
password-manager/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   │   ├── VaultList.tsx  # 密码列表
│   │   ├── EntryForm.tsx  # 添加/编辑密码表单
│   │   ├── SettingsPanel.tsx # 设置面板
│   │   └── ...
│   ├── lib/
│   │   ├── tauri.ts       # Tauri API 绑定
│   │   ├── theme.ts       # 主题管理
│   │   └── i18n.ts        # 国际化
│   └── App.tsx             # 主应用组件
├── src-tauri/              # Rust 后端
│   └── src/
│       ├── commands/       # Tauri 命令
│       ├── crypto/         # 加密工具
│       ├── vault/          # 密码库文件处理
│       └── models.rs       # 数据模型
└── dist/                   # 构建后的前端资源
```

## 安全架构

应用采用双层密钥设计：

1. **主密码** → Argon2id → KEK（密钥加密密钥）
2. **KEK** → 解密 → DEK（数据加密密钥）
3. **DEK** → 加密/解密 → 密码条目

修改主密码时只需重新加密 DEK，无需改动所有数据。

## 数据存储位置

| 平台 | 路径 |
|------|------|
| macOS | `~/Library/Application Support/me.yhz.passwordmanager.app/passwords.vault` |
| Windows | `%APPDATA%\me.yhz.passwordmanager.app\passwords.vault` |
| Linux | `~/.local/share/me.yhz.passwordmanager.app/passwords.vault` |

## 开源协议

Apache-2.0 license
