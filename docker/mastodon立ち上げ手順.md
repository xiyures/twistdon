# ���ؗpmastodon�T�[�o�[�����グ�菇

## �O��
  - Windows + wsl2(Ubuntu 20.4.5 LTS)
  - Docker

  ## Windows���ݒ�
  C:\Windows\System32\drivers\etc\hosts  
  �Ǘ��Ҍ����ŊJ���A�����ɒǉ�  
  ```
  127.0.0.1       mastodon.local  
  ```

## �T�[�o�[�ݒ�
```
cd docker  
git clone https://github.com/mastodon/mastodon.git  
cp -r nginx-docker .env.production docker-compose.yml mastodon  
cd mastodon  
mkdir postgres14  
mkdir redis  
docker compose build
```
�ȉ���2����s 
```
docker compose run --rm web rails secret  
```
**�o�͂��ꂽ�L�[��`.env.production`�̊Y������`SECRET_KEY_BASE` `OTP_SECRET`2�ӏ������������Ă���**
```
docker compose run --rm web rails db:migrate  
docker compose run --rm web rails assets:precompile  
```

## ���o�[�X�v���L�V�̐ݒ�
```
cd nginx-docker/nginx/ssl  
openssl genrsa -out ./server.key 4096  
openssl req -new -key ./server.key -out ./server.csr 
openssl x509 -days 3650 -req -signkey ./server.key -in ./server.csr -out ./server.crt  
```

## �����グ  
```
cd ../../
docker compose up -d  
cd ../  
docker compose up -d  
```
���̒i�K�ł��ł�``https://mastodon.local/``�������Ă܂�

## �Ǘ��҃A�J�E���g�쐬
```
docker compose exec --user root web /bin/sh  
RAILS_ENV=production  
bin/tootctl accounts create alice --email=alice@gmail.com --confirmed --role Admin  
```
**�p�X���[�h���R�s�y���Ă���**
```
chown -R mastodon /opt/mastodon/public/ 
exit
```