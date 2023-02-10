# 検証用mastodonサーバー立ち上げ手順

## 前提
  - Windows + wsl2(Ubuntu 20.4.5 LTS)
  - Docker

  ## Windows側設定
  C:\Windows\System32\drivers\etc\hosts  
  管理者権限で開き、末尾に追加  
  ```
  127.0.0.1       mastodon.local  
  ```

## サーバー設定
```
cd docker  
git clone https://github.com/mastodon/mastodon.git  
cp -r nginx-docker .env.production docker-compose.yml mastodon  
cd mastodon  
mkdir postgres14  
mkdir redis  
docker compose build
```
以下を2回実行 
```
docker compose run --rm web rails secret  
```
**出力されたキーで`.env.production`の該当部分`SECRET_KEY_BASE` `OTP_SECRET`2箇所を書き換えておく**
```
docker compose run --rm web rails db:migrate  
docker compose run --rm web rails assets:precompile  
```

## リバースプロキシの設定
```
cd nginx-docker/nginx/ssl  
openssl genrsa -out ./server.key 4096  
openssl req -new -key ./server.key -out ./server.csr 
openssl x509 -days 3650 -req -signkey ./server.key -in ./server.csr -out ./server.crt  
```

## 立ち上げ  
```
cd ../../
docker compose up -d  
cd ../  
docker compose up -d  
```
この段階ですでに``https://mastodon.local/``が動いてます

## 管理者アカウント作成
```
docker compose exec --user root web /bin/sh  
RAILS_ENV=production  
bin/tootctl accounts create alice --email=alice@gmail.com --confirmed --role Admin  
```
**パスワードをコピペしておく**
```
chown -R mastodon /opt/mastodon/public/ 
exit
```