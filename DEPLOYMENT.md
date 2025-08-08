# 🚀 Руководство по Развертыванию

## Обзор

Это веб-приложение для создания телеграм ботов и управления проектами с AI помощником. Приложение состоит из React frontend и Node.js/Express backend.

## 📦 Способы Развертывания

### 1. Развертывание на Replit (Рекомендуется)

Самый простой способ развернуть приложение:

1. Откройте проект в Replit
2. Убедитесь что установлен OpenAI API ключ в секретах
3. Нажмите кнопку "Deploy" в интерфейсе Replit
4. Приложение будет доступно по адресу `https://your-repl-name.replit.app`

### 2. Развертывание на VPS/Сервере

#### Требования:
- Node.js 18+
- PostgreSQL (опционально)
- PM2 для управления процессами

#### Инструкция:

```bash
# 1. Клонируйте репозиторий
git clone <your-repo-url>
cd telegram-bot-creator

# 2. Установите зависимости
npm install

# 3. Настройте переменные окружения
cp .env.example .env
# Отредактируйте .env файл

# 4. Создайте production build
npm run build

# 5. Запустите с PM2
npm install -g pm2
pm2 start ecosystem.config.js

# 6. Настройте Nginx (опционально)
sudo apt install nginx
# Скопируйте конфигурацию nginx
```

### 3. Docker Развертывание

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# Команды для сборки и запуска
docker build -t telegram-bot-creator .
docker run -p 5000:5000 -e OPENAI_API_KEY=your_key telegram-bot-creator
```

### 4. Создание Desktop Приложения (Альтернатива .exe)

Поскольку это веб-приложение, создание .exe файла не является стандартным подходом. Вместо этого рекомендуется:

#### Вариант A: Electron Wrapper
```bash
# Установите Electron
npm install -g electron

# Создайте main.js для Electron
# (см. пример ниже)

# Упакуйте приложение
npx electron-builder
```

#### Вариант B: PWA (Progressive Web App)
Добавьте Service Worker и манифест для установки как нативное приложение:

```json
// manifest.json
{
  "name": "Telegram Bot Creator",
  "short_name": "BotCreator",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0079f2",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

#### Вариант C: Tauri (Rust + Web)
Более легковесная альтернатива Electron:

```bash
# Установите Tauri
cargo install tauri-cli

# Инициализируйте Tauri проект
cargo tauri init

# Соберите приложение
cargo tauri build
```

## ⚙️ Переменные Окружения

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Database (опционально)
DATABASE_URL=postgresql://user:password@localhost:5432/botcreator

# GitHub Integration (опционально)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Application
NODE_ENV=production
PORT=5000
```

## 🔧 Production Оптимизации

### Nginx Конфигурация
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 Конфигурация
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'telegram-bot-creator',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
}
```

## 🔒 Безопасность

1. **Используйте HTTPS** в production
2. **Ограничьте CORS** для production доменов
3. **Настройте rate limiting** для API endpoints
4. **Валидируйте все пользовательские данные**
5. **Используйте секретные переменные** для API ключей

## 📱 Мобильная Поддержка

Приложение адаптивно и работает на мобильных устройствах. Для лучшего опыта:

1. Добавьте PWA манифест
2. Оптимизируйте изображения
3. Используйте Service Worker для кеширования

## 🐛 Troubleshooting

### Telegram Ошибки
- Проверьте валидность Telegram Bot токенов
- Убедитесь что боты не используют одинаковые токены

### OpenAI Ошибки
- Проверьте наличие API ключа
- Убедитесь в достаточном балансе на счету

### Database Ошибки
- Проверьте подключение к PostgreSQL
- Выполните миграции: `npm run db:migrate`

## 📊 Мониторинг

Рекомендуемые инструменты:
- **PM2 Monitoring**: `pm2 monit`
- **Application Logs**: Winston/Morgan
- **Error Tracking**: Sentry
- **Uptime Monitoring**: UptimeRobot

## 🔄 CI/CD

Пример GitHub Actions:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm test
      - name: Deploy to server
        run: |
          # Ваши команды развертывания
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи приложения
2. Убедитесь в правильности конфигурации
3. Обратитесь к документации API
4. Создайте issue в репозитории