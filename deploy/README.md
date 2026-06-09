# GrowthOS Production Deploy

Target host: `39.105.5.32`

Recommended domain: `growth.familylove.space`

This deployment keeps the existing `familylove.space` service running and attaches GrowthOS to the existing Docker nginx network.

## Prerequisites

1. Add DNS A record: `growth.familylove.space -> 39.105.5.32`.
2. Prepare `/opt/growth_os/.env.production` on the server:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WECHAT_MINI_PROGRAM_APP_ID=
WECHAT_MINI_PROGRAM_APP_SECRET=
WECHAT_LOGIN_USER_SECRET=
LLM_PROVIDER=deepseek
LLM_API_KEY=
LLM_MODEL=deepseek-chat
LLM_BASE_URL=https://api.deepseek.com
LLM_JSON_MODE=true
```

## Deploy

```bash
cd /opt/growth_os
docker compose --env-file /opt/growth_os/.env.production -f deploy/growthos.compose.yml up -d --build
```

## Nginx

Copy `deploy/growthos.nginx.conf` to `/opt/yyy_love/nginx/growthos.conf`, then validate and reload the existing nginx container:

```bash
docker exec yyy_love-nginx-1 nginx -t
docker exec yyy_love-nginx-1 nginx -s reload
```

The HTTPS certificate must exist at:

```text
/opt/yyy_love/nginx/certbot/live/growth.familylove.space/fullchain.pem
/opt/yyy_love/nginx/certbot/live/growth.familylove.space/privkey.pem
```
