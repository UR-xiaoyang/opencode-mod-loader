# OpenCode Desktop MOD AI 开发手册

> 给负责实现 MOD 的 AI 使用。按本文操作即可创建一个可加载的 MOD；不需要阅读 OpenCode 或本仓库的源码。运行时完整规范见 [Desktop MOD Beta](../src/packages/desktop/MODS.md)。

## 目标与边界

将用户的需求实现为一个独立 MOD 文件夹，放入 OpenCode 的 MOD 文件夹后可通过 **Settings > MODs** 刷新、启用和使用。

先让用户在 OpenCode 的 **Settings > MODs > Open folder** 打开 MOD 文件夹。以下所有文件都必须创建在其中，且每个 MOD 只能占用一个同名子目录：

```text
<MOD folder>/
  acme.task-notes/
    mod.json
    index.html
    app.js
```

`acme.task-notes` 是示例 ID。文件夹名必须与 `mod.json` 的 `id` 完全一致。

不要修改 OpenCode 的安装文件、应用源码、配置插件或数据库。MOD 只能使用自己目录里的本地文件；不能依赖 CDN、远程脚本、远程样式、网络请求、iframe、表单、Node.js、Electron、文件系统或原始 IPC。

## 实现决策

根据需求选择最小能力，不要为了方便申请高权限：

| 用户需求 | 使用方式 | 必需权限 |
| --- | --- | --- |
| 单独工具窗口、设置页、表单、本地数据 | `entry` 指向独立 HTML 页面 | 仅按需添加 `storage`、`external.open` |
| 在左侧栏增加面板 | `contributes.sidebar` 指向独立 HTML 页面 | `ui.sidebar` |
| 在命令面板中打开 MOD 窗口或侧栏面板 | `contributes.commands` | `ui.command` |
| 调整现有 OpenCode UI 的 CSS | `contributes.styles` | `ui.style` |
| 直接读取、替换或监听 OpenCode 页面 DOM | `contributes.host` | `ui.host` |
| 修改本地 OpenCode 服务端行为 | `contributes.server` | `server.host` |
| 在服务端导入前接管进程级逻辑 | `contributes.serverBootstrap` | `server.host` |
| 开发版与生产版共用会话数据库 | `contributes.database` | `server.database` |

默认选择独立窗口或侧栏 iframe。只有需求必须触及现有 OpenCode DOM 时，才使用 `ui.host`。`ui.host` 和 `server.host` 都等同于执行受信任的本地应用代码。`serverBootstrap` 会在 OpenCode 服务模块导入前运行，适合安装请求代理、超时诊断等进程级接管逻辑，不能代替正常的工具或对话钩子。

## 必做流程

1. 为 MOD 生成全局唯一、小写的 ID，例如 `acme.task-notes`。ID 只能包含小写字母、数字、点、下划线和连字符，且必须以字母或数字开始。
2. 在 MOD 文件夹创建与该 ID 同名的目录。
3. 创建 `mod.json`，所有路径均相对 MOD 根目录，且不得以 `../` 跳出目录。
4. 创建清单中引用的本地 HTML、JS、CSS 文件。页面脚本使用普通浏览器 JavaScript；不要写 TypeScript，加载器不会编译它。
5. 刷新 MOD 列表并启用该 MOD。若出现冲突，优先改用唯一的侧栏和命令 ID；仅 CSS、host 或 server 行为的重叠才考虑调整加载优先级。
6. 验收具体功能，再刷新、禁用、重新启用一次，确认状态和清理行为正常。

## 最小可用模板

为普通独立窗口创建以下两个文件。这个模板没有高权限，适合先验证安装流程。

`mod.json`

```json
{
  "id": "acme.hello",
  "name": "Acme Hello",
  "version": "0.1.0",
  "description": "A small local OpenCode MOD.",
  "engines": {
    "opencode": "^1.18.0"
  },
  "permissions": [],
  "entry": "index.html",
  "window": {
    "width": 720,
    "height": 520
  }
}
```

`index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Acme Hello</title>
    <style>
      body { margin: 24px; font: 14px/1.5 system-ui, sans-serif; color: #1f2937; }
      button { padding: 8px 12px; }
    </style>
  </head>
  <body>
    <h1>Acme Hello</h1>
    <p id="status">Ready.</p>
    <button id="close" type="button">Close</button>
    <script src="app.js"></script>
  </body>
</html>
```

`app.js`

```js
document.querySelector("#close").addEventListener("click", () => {
  window.opencodeMod.close()
})
```

## 常用能力模板

### 持久化本地数据

在 `permissions` 中加入 `"storage"`。值只能是字符串；复杂数据使用 `JSON.stringify` 和 `JSON.parse`。

```js
const key = "draft"
const saved = await window.opencodeMod.storage.get(key)
const draft = saved ? JSON.parse(saved) : { text: "" }

await window.opencodeMod.storage.set(key, JSON.stringify({ text: "hello" }))
await window.opencodeMod.storage.delete(key)
```

### 打开外部链接

在 `permissions` 中加入 `"external.open"`，并只传入 `http:` 或 `https:` URL。

```js
await window.opencodeMod.openExternal("https://example.com")
```

### 侧栏和命令

侧栏页面运行在受限 iframe 内，不能使用 `window.opencodeMod`。通过 `postMessage` 请求宿主操作。

`mod.json` 中加入：

```json
{
  "permissions": ["storage", "external.open", "ui.sidebar", "ui.command"],
  "contributes": {
    "sidebar": [
      {
        "id": "acme-notes-panel",
        "title": "Acme Notes",
        "entry": "sidebar.html",
        "order": 10
      }
    ],
    "commands": [
      {
        "id": "acme-open-notes",
        "title": "Open Acme Notes",
        "description": "Show the Acme notes panel.",
        "panel": "acme-notes-panel"
      }
    ]
  }
}
```

`sidebar.html` 中使用下面的帮助函数：

```js
function request(action, fields = {}) {
  const requestID = crypto.randomUUID()
  parent.postMessage({ source: "opencode-mod", requestID, action, ...fields }, "*")
  return new Promise((resolve, reject) => {
    const receive = (event) => {
      if (event.data?.source !== "opencode-host" || event.data.requestID !== requestID) return
      removeEventListener("message", receive)
      event.data.ok ? resolve(event.data.value) : reject(new Error(event.data.error))
    }
    addEventListener("message", receive)
  })
}

const draft = await request("storage.get", { key: "draft" })
await request("storage.set", { key: "draft", value: "hello" })
await request("external.open", { url: "https://example.com" })
await request("window.open")
```

支持的 action 仅有 `storage.get`、`storage.set`、`storage.delete`、`external.open` 和 `window.open`。没有 `panel` 的命令会打开 MOD 独立窗口。

### 注入样式

在 `permissions` 中加入 `"ui.style"`，并声明 `contributes.styles`：

```json
{
  "permissions": ["ui.style"],
  "contributes": {
    "styles": "theme.css"
  }
}
```

将 CSS 写入 `theme.css`。它会直接作用于 OpenCode 主界面，因此规则必须尽量具体并带有 MOD 自己的类名或属性前缀，避免全局覆盖。

### 可信宿主脚本

仅在需要操作现有 OpenCode DOM 时使用。清单：

```json
{
  "permissions": ["ui.host"],
  "contributes": {
    "host": "host.js"
  }
}
```

`host.js` 必须在顶层立即获取当前 MOD 的作用域对象：

```js
const mod = window.opencodeHost.forScript()
const root = mod.ui.mount("toolbar", "[data-component='titlebar']")
root.textContent = "Acme"

mod.ui.style("toolbar", "[data-opencode-mod-host='acme.hello.toolbar'] { margin-left: 8px; }")
mod.events.on("opencode:acme-refresh", () => console.log("refresh"))

mod.commands.register({
  id: "toggle-toolbar",
  title: "Toggle Acme toolbar",
  onSelect() {
    root.hidden = !root.hidden
  }
})
```

可用 API：

- `mod.ui.mount(id, selector?)`：在选择器匹配节点下创建自动清理的容器，默认 `body`。
- `mod.ui.style(id, css)`：注入自动清理的样式。
- `mod.ui.observe(selector, callback)`：对当前及未来出现的匹配节点执行回调。
- `mod.commands.register({ id, title, description?, onSelect })`：注册自动加上 MOD 命名空间的运行时命令。
- `mod.events.emit(type, detail?)` 与 `mod.events.on(type, listener)`：MOD 内事件。
- `mod.storage.get/set/delete`、`mod.openExternal`：分别仍需 `"storage"`、`"external.open"` 权限。
- `mod.desktop`：完整桌面 bridge；这是高风险能力。
- `mod.reload()`：重载渲染器。

不要把依赖初始化写在 `forScript()` 之前；不要手动清理由上述作用域 API 创建的资源，加载器会在禁用或刷新时清理。

### 服务端插件

仅在需求明确需要本地 OpenCode 服务端 hook 时使用。服务端文件必须是本地 ESM JavaScript，不能是 TypeScript。

```json
{
  "permissions": ["server.host"],
  "contributes": {
    "server": "server.js"
  }
}
```

```js
export default {
  id: "acme-retry-timeouts",
  async server() {
    return {
      "chat.retry": async (input, output) => {
        const message = input.error?.data?.message ?? input.error?.message ?? ""
        if (!/aborted due to timeout/i.test(message)) return
        output.retry = {
          message: `Provider ${input.providerID} timed out; retry ${input.attempt + 1} starts shortly.`,
        }
        output.delay = 1000
      }
    }
  }
}
```

启用、禁用、刷新或调整这类 MOD 的优先级会重启 Desktop sidecar。它只影响本地 Desktop sidecar，不影响 WSL 或远程服务器。

### 共享生产会话数据库

这是开发安装专用的声明式功能，不可指定任意数据库路径：

```json
{
  "permissions": ["server.database"],
  "contributes": {
    "database": {
      "source": "production"
    }
  }
}
```

不要在生产版和开发版同时写入同一个会话数据库。

## 清单规则

- 必填字段：`id`、`name`、`version`、`entry`。`permissions` 可以省略，等同于空数组。
- `window.width` 和 `window.height` 必须是 320 至 2400 的整数。
- `engines.opencode` 可省略、设为 `"*"`、精确版本如 `"1.18.0"`，或使用 `^` / `~` 范围，例如 `"^1.18.0"`。
- `sidebar` 和 `commands` 最多各 256 项；同一 MOD 内每类 ID 必须唯一。
- `commands[].panel` 必须引用本 MOD 已声明的 `sidebar[].id`。
- 所有 `entry`、`styles`、`host`、`server` 和侧栏 `entry` 路径必须位于 MOD 目录内。
- MOD 页面只加载自己的本地资源。将图片、字体、脚本和样式一并放入该目录。

## 冲突、加载与恢复

- 侧栏 ID 和命令 ID 需使用带组织前缀的唯一名称，例如 `acme-notes-panel`，避免确定性冲突。
- 多个样式、host 脚本或 server 插件可能相互影响。加载优先级范围是 `-1000` 到 `1000`；数值越高，加载越晚。它只能解决后加载覆盖前加载的情况，无法修复不兼容的 JavaScript 行为。
- 普通页面改动后使用 **Refresh**。启用、禁用或刷新 `ui.host` MOD 会重载渲染器；涉及 `server.host` 或 `server.database` 会重启 sidecar。
- 若 MOD 破坏 UI，使用命令面板的 **Disable all MODs (Safe Mode)**。若命令面板不可用，按 `Ctrl+Shift+Alt+M`（macOS 为 `Cmd+Shift+Alt+M`）切换安全模式。

## 交付前检查

- [ ] MOD 文件夹名与 `mod.json.id` 完全一致。
- [ ] 每个声明的文件路径都存在，且没有外部依赖或目录穿越路径。
- [ ] 只申请实际使用的权限。
- [ ] `ui.sidebar`、`ui.command`、`ui.style`、`ui.host`、`server.host`、`server.database` 均已声明对应权限；`serverBootstrap` 也需要 `server.host`。
- [ ] 侧栏和命令 ID 带唯一前缀，并检查了与已启用 MOD 的冲突。
- [ ] 已在 Settings > MODs 中刷新、启用并验证用户需求。
- [ ] 已验证禁用后不再生效；若使用 storage，则重启后数据符合预期。
