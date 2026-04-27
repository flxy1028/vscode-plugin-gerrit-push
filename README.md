# Gerrit Push Button

在 VS Code 源代码管理中添加一个按钮，一键将 `HEAD` 推送到 Gerrit 的 `refs/for/<branch>` 进行评审。

> English version: see `README.en.md`.

## 功能
- Source Control 标题栏按钮 + 命令面板命令：**Gerrit: Push HEAD to Gerrit**
- 执行 `git push <remote> HEAD:refs/for/<branch>`，提供分支选择器
- 可选输入 reviewer，推送为 `refs/for/<branch>%r=<reviewer>`
- 默认使用当前分支，可通过 `gerritPush.defaultBranch` 覆盖
- 默认远端为 `origin`，可通过 `gerritPush.remote` 设定

![snipshot](images/snipshot.png)

## 安装/调试
1) 在该目录执行：
```bash
npm install
```
2) 用 VS Code 打开 `vscode-gerrit-push` 目录。
3) 打开左侧 “Run and Debug” 面板，选择 `Run Extension` 配置并点击 “Run”（或按 F5）。这会启动 Extension Development Host，自动编译并加载插件。

## 使用
1) 打开一个 Git 工作区。
2) 在 Source Control 视图标题栏点击图标按钮 **Push HEAD to Gerrit**，或在命令面板运行同名命令。
3) 选择目标分支（当前分支、配置默认分支或自定义输入）。
4) 开启后可选择预设 reviewer 并/或输入 reviewer（逗号或空格分隔）。
5) 确认弹窗 `git push <remote> HEAD:refs/for/<branch>`。
6) 插件通过 VS Code 的 Git SCM（失败时回退 `git rev-parse`）解析仓库根目录，避免多仓库场景下推错路径。

## 设置
- `gerritPush.defaultBranch`：推送到 `refs/for/<branch>` 的默认分支，留空则使用当前分支。
- `gerritPush.remote`：推送使用的 Git 远端名，默认 `origin`。
- `gerritPush.enableReviewers`：开启 reviewer 选择。
- `gerritPush.reviewerPresets`：reviewer 预设列表，显示在 reviewer 选择器中。
- `gerritPush.confirmBeforePush`：推送前确认（默认 `true`）。
- `gerritPush.skipAllPrompts`：跳过所有提示，立即推送（默认 `true`）。
- `gerritPush.quickPush`：开启快速推送：添加所有文件，使用输入框中的 commit message（默认 `true`）。
- `gerritPush.autoAddChangeId`：开启自动添加 Change-Id 到 commit message（默认 `true`）。

> **注意：** `skipAllPrompts` 不建议用于生产环境。当 `skipAllPrompts` 为 `true` 时，将跳过所有提示并使用默认值：远端为 `origin`，分支为当前分支。
> `quickPush` 为 `true` 时，将添加所有文件并使用输入框中的 commit message 进行推送。推送前会 执行 `git add .`、`git commit -m <msg>`、`git pull --rebase`。

## 打包分发
1) 安装依赖（首次或更新时）：
```bash
npm install
```
2) 打包 VSIX：
```bash
npm run package
```
生成的 `.vsix` 可分发给其他用户，在 VS Code 扩展面板右上角菜单选择 “Install from VSIX...” 安装。

## 元信息
- 图标与图片由 Nano Banana Pro 生成（`images/icon.png`、`images/command-icon.png`）
- 仓库：<https://github.com/flxy1028/vscode-plugin-gerrit-push>
- 许可证：MIT（见 `LICENSE`）

> 本项目参考 [vscode-gerrit-push](https://github.com/liaojianjin/vscode-gerrit-push) 进行开发。

