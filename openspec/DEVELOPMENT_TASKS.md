# DancingStore Plugin Registry Tasks

- Last-Updated: `2026-07-12`

## Milestone A — 边界迁移 ✅

- [x] 移除旧商品、订单、支付与授权模型
- [x] 定义插件 manifest 和公开 Registry API
- [x] 明确独立实现仓库、Store 与宿主之间的边界

## Milestone B — Registry 工程化 ✅

- [x] 提供 JSON Schema 和首批官方插件 manifest
- [x] 提供语义校验、重复检查与确定性索引生成
- [x] 提供只读查询客户端
- [x] 添加单元测试与生成器集成测试
- [x] 添加 Registry CI
- [x] 更新 README 投稿与消费说明

## Milestone C — 后续分发能力

- [x] 为 published 产物强制要求 SHA-256，并在 CI 有界、无重定向地验证远端内容摘要
- [x] 生成确定性的 StoreService 未签名发布输入
- [ ] 增加签名 provenance / Sigstore 元数据
- [ ] 增加弃用和安全撤回公告 feed
- [ ] 与 DancingMusic 宿主完成 Registry 消费集成
- [ ] 将长期文档迁移至 DancingMusic `docs` 主仓
