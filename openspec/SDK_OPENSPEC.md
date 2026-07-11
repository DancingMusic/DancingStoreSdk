# OpenSpec: DancingStore Plugin Registry

- Spec-ID: `dancing-store-plugin-registry`
- Version: `3.0.0`
- Status: `Active`
- Last-Updated: `2026-07-12`

## Scope

`DancingStore` 是 DancingMusic 视觉插件实现的公开登记、校验、投稿和分发元数据仓库。它向 DancingMusic 宿主和第三方应用提供稳定、可机器读取的插件目录，但不保存插件实现源码，不定义插件运行时协议，也不承担支付或授权交易。

## Ownership

- `registry/*.json` 是插件登记记录的唯一来源；一个插件一个 manifest。
- `schema/plugin-manifest.schema.json` 定义可跨工具消费的 manifest JSON Schema。
- 构建工具校验全部 manifest，并生成确定性的 `dist/registry.json` 分发索引。
- `@dancingmusic/dancing-store` 导出 manifest 类型、校验器、查询工具和只读 Registry 客户端。
- 第三方通过 Pull Request 提交或更新 manifest；CI 是合入前的强制校验入口。

## Plugin manifest

每条记录 MUST 包含：

- `schemaVersion`：当前为 `1`。
- `id`、`name`、`summary`、`version`：稳定标识和 SemVer 版本。
- `publisher`、`repository`：发布者及可追溯源码仓库。
- `license`：许可证名称、许可证 URL 和商业使用标记。
- `compatibility`：依赖的 DancePlugin 协议包及 SemVer 范围，可选宿主版本范围。
- `distribution`：固定版本的 HTTPS ESM 构建入口，可选 SRI 完整性值。
- `capabilities`、`permissions`：供宿主在加载前展示和审查的声明。
- `status`、`submittedAt`、`updatedAt`：目录生命周期和审计时间。

Registry MUST NOT 使用浮动分支 URL 作为分发入口。分发 URL 必须固定到 tag 或不可变提交。

## Submission and distribution

1. 投稿者在独立的 `DancePlugin-*` 仓库维护源码、测试、版本、许可证和构建产物。
2. 投稿者新增或更新 `registry/<plugin-id>.json`，文件名必须与 manifest `id` 一致。
3. 本仓库 CI 执行 schema/语义校验、重复 ID 检查、索引确定性检查、测试、类型检查和构建。
4. 合并后生成的 `dist/registry.json` 是宿主和第三方应用的稳定发现入口。
5. 插件代码仍从 manifest 指向的独立版本化 URL 加载；Store 不复制或打包插件实现。

## Public API

- `PluginManifest`、`PluginRegistryIndex`、`PluginRegistryQuery`
- `validatePluginManifest()`、`assertPluginManifest()`、`buildRegistryIndex()`
- `DancingStoreClient.list()`、`DancingStoreClient.get()`、`DancingStoreClient.refresh()`

旧版 `StoreItem` / `StoreOrder` 商品订单模型和 `createOrder()` / `verifyOrder()` API 不属于当前 Store 边界，自 `1.0.0` 起移除。

## MUST

- 独立执行 `npm run validate && npm test && npm run typecheck && npm run build`。
- 仅通过 `src/index.ts` 导出公开 TypeScript API。
- Registry 输出按插件 `id` 排序，且相同输入产生相同内容。
- URL 使用 HTTPS；版本、日期、权限、能力和许可证字段均经过校验。
- 保留插件来源、许可证与协议兼容性，加载前可审计。

## MUST NOT

- 保存插件实现源码、构建插件或在 Store 内运行插件。
- 定义或复制 `DancePlugin` 协议类型。
- 直接依赖 DancingMusic 宿主或具体 `DancePlugin-*` 实现包。
- 恢复商品、价格、订单、支付、用户许可证或 DRM 模型。
- 保存 Token、Cookie、签名私钥或其他凭据。

## Release

1. 更新 manifest、OpenSpec、README 和变更版本。
2. 运行 `npm run validate && npm test && npm run typecheck && npm run build`。
3. 确认 `dist/registry.json` 已由生成器更新且无手工编辑。
4. 发布 npm 包、固定版本标签，并部署公开 registry 文件。
