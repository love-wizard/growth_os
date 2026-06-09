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

## Bootstrap Server

If the server does not already have a git checkout at `/opt/growth_os`, convert it once:

```bash
cd /opt
mv growth_os growth_os.backup.$(date +%Y%m%d-%H%M%S)
git clone git@github.com:love-wizard/growth_os.git growth_os
cp growth_os.backup.*/.env.production growth_os/.env.production
```

The server SSH key must already be authorized for this private repository.

## Deploy

```bash
cd /opt/growth_os
bash deploy/deploy.sh
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
