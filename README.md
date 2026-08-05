# DancingStore

DancingStore 是 DancingMusic 视觉插件的公开 Registry：收集独立 `DancePlugin-*` 实现的版本记录，校验投稿内容，并生成供 DancingMusic 宿主与第三方应用读取的静态索引。

它不是插件商城后端，不处理商品、价格、订单、付款或用户授权，也不保存插件源码。插件协议由 [`DancePlugin`](https://github.com/DancingMusic/DancingPlugin) 定义；具体实现、构建和发布保留在各自的 `DancePlugin-*` 仓库。

## 仓库内容

| 路径 | 用途 |
| --- | --- |
| `registry/*.json` | 可审计的插件 manifest，一项插件一个文件 |
| `schema/plugin-manifest.schema.json` | Draft 2020-12 JSON Schema |
| `profiles/official-defaults.json` | 官方预置插件精确版本、顺序和安装角色 |
| `schema/official-defaults.schema.json` | 官方预置 profile JSON Schema |
| `dist/registry.json` | 从 manifest 确定性生成的公开索引，请勿手工编辑 |
| `dist/official-defaults.json` | 经 Registry 交叉校验后生成的官方预置 profile |
| `src/` | TypeScript 类型、校验器、索引构建器和只读客户端 |
| `scripts/generate-registry.ts` | Registry 校验与索引生成工具 |

## 使用 Registry

```ts
import { DancingStoreClient } from "@dancingmusic/dancing-store";

const store = new DancingStoreClient({
  registryUrl: "https://raw.githubusercontent.com/DancingMusic/DancingStore/main/dist/registry.json",
});

const visualizers = await store.list({
  capability: "audio-reactive",
  status: "published",
});

const mineradio = await store.get("mineradio");
```

也可以直接消费 npm 包中的 JSON：

```ts
import registry from "@dancingmusic/dancing-store/registry.json" with { type: "json" };
import officialDefaults from "@dancingmusic/dancing-store/official-defaults.json" with { type: "json" };
```

`officialDefaults` 只引用 Registry 中状态为 `published` 的精确版本。
`preinstalled` 表示 Release 可携带独立构建 artifact 作为离线 seed，仍不表示
插件源码属于宿主；`recommended` 表示仅在 Store 中推荐。当前升级交互统一为
`notify`，由宿主向用户确认后升级。

## Manifest 约束

Manifest 记录身份、版本、发布者、源码来源、许可证、协议兼容范围、固定版本 ESM 入口、能力、权限和生命周期状态。完整字段以 [`schema/plugin-manifest.schema.json`](schema/plugin-manifest.schema.json) 为准。

分发入口必须：

- 使用 HTTPS；
- 固定到与 manifest 一致的版本 tag 或完整 commit；
- 提供 ESM 构建；
- 不使用 `main`、`master` 或其他浮动分支；
- 必须填写 `integrity`，并使用合法的 SHA-256 SRI 值。

许可证不是装饰字段。宿主和用户可据 `commercialUse` 在加载前识别非商业限制；具体权利仍以插件仓库中的许可证原文为准。

## 投稿插件

1. 在独立 `DancePlugin-*` 仓库完成源码、测试、许可证、SemVer tag 和 ESM 构建发布。
2. 复制一个现有 manifest，在 `registry/<plugin-id>.json` 新建记录；文件名必须等于 `id`。
3. 声明最小必要的 `capabilities` 和 `permissions`，并使用固定版本的分发 URL。
4. 本地运行完整校验。
5. 提交 Pull Request；Registry CI 会阻止无效、重复或未生成的记录合入。

更新插件时修改原 manifest 的 `version`、分发 URL 和 `updatedAt`。永久停止分发时使用 `deprecated` 或 `withdrawn`，不要复用旧 ID 指向无关实现。

## 开发与验证

```bash
npm ci
npm run validate
npm test
npm run typecheck
npm run build
```

- `npm run registry:generate` 校验 `registry/` 并更新 `dist/registry.json`。
- `npm run validate` 生成后再次检查索引内容一致。
- `npm test` 覆盖 manifest 语义、重复 ID、确定性排序和客户端查询。
- CI 还会验证生成后 `dist/registry.json` 没有未提交差异。

## 边界与安全

- DancingStore 不运行插件、不代理音乐连接器、不保存宿主 UI 或运行时代码。
- 插件不得借 Registry 绕过宿主直接访问音乐连接器；音乐能力通过宿主数据或 `DanceHostActions` 提供。
- Manifest 和提交记录不得包含 Cookie、Token、签名私钥或其他凭据。
- Registry 审核不等于对第三方代码的安全担保；宿主仍需执行兼容性检查、权限确认和故障隔离。

## License

DancingStore 工具代码采用 [MIT](LICENSE) 许可证。每个插件保持自己的许可证，Registry 不改变其授权条件。
