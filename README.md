# @dancingmusic/dancing-store-sdk

DancingStoreSdk is the standalone SDK for dancing-store domain capabilities.

## Install

```bash
npm install @dancingmusic/dancing-store-sdk
```

## Build

```bash
npm install
npm run build
```

## Quick Start

```ts
import { DancingStoreClient } from "@dancingmusic/dancing-store-sdk";

const client = new DancingStoreClient({
  baseUrl: "https://api.example.com",
  token: "your-token"
});

const items = await client.list({ page: 1, pageSize: 20 });
```

## Publish

```bash
npm publish
```

## GitHub Pages

This repository publishes a responsibility overview page from `docs/` via GitHub Actions.

- Expected URL: `https://dancingmusic.github.io/DancingStoreSdk/`
- Workflow: `.github/workflows/deploy-pages.yml`
