# MATAEPEDIA

마태도의 아이들이 만든 비공식 기록 보관소. [vinext](https://github.com/cloudflare/vinext),
Cloudflare Workers, D1과 Drizzle로 동작합니다.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run db:migrate:local
npm run dev
npm run build
```

로컬 개발에는 Wrangler의 로컬 D1이 사용됩니다.

## Cloudflare 무료 배포

`wrangler.jsonc`의 `DB` 바인딩은 `mataepedia-db`를 가리킵니다. 처음 한 번
Cloudflare에 로그인한 뒤 마이그레이션과 배포를 실행합니다.

```bash
npm run db:migrate:remote
npm run deploy:dry-run
npm run deploy
```

Workers Free와 D1 Free의 일일 한도를 넘으면 작업이 실패하며, 유료 플랜을
별도로 활성화하지 않는 한 초과 사용량이 자동 결제되지 않습니다.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build and verify the rendered site
- `npm run db:generate`: generate Drizzle migrations after schema changes
- `npm run db:migrate:local`: apply the baseline to the local D1
- `npm run db:migrate:remote`: apply pending migrations to the hosted D1
- `npm run deploy:dry-run`: validate the Worker package without publishing
- `npm run deploy`: publish to Cloudflare Workers

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
