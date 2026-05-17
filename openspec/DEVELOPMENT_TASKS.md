# DancingStoreSdk Tasks

- Last-Updated: `2026-05-17`

## Milestone A — 类型与骨架 ✅

- [x] 定义核心类型（`DanceItem`/`DanceOrder`/`DanceLicense`）
- [x] API 客户端骨架（`DancingStoreClient`）
- [x] 统一导出入口 `src/index.ts`
- [x] 文档站 `docs/index.html`（i18n/搜索/暗色模式）
- [x] OpenSpec 与任务文档

## Milestone B — API 完善

- [ ] 完善 HTTP 层实现（鉴权 token 管理、请求超时、错误码映射）
- [ ] 实现重试策略（指数退避 + 可配置上限）
- [ ] 实现 `list` / `get` / `createOrder` / `verifyOrder` / `getLicense` 完整逻辑
- [ ] 添加请求/响应拦截器支持
- [ ] README 有完整接口示例与配置说明

## Milestone C — 质量保障

- [ ] 添加单测（vitest）覆盖核心流程
- [ ] 添加契约测试（mock server 验证请求/响应格式）
- [ ] 发布 `v0.1.x` 正式标签
- [ ] CI 流水线配置（lint + typecheck + test）
