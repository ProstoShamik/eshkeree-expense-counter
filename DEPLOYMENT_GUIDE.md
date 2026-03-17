# Руководство по развертыванию (Deployment Guide)

Данное руководство описывает, как перенести проект на ваш сервер Ubuntu (`linuxuser@70.34.196.153`) и запустить его.

## 1. Подготовка сервера

Подключитесь к вашему серверу:
```bash
ssh linuxuser@70.34.196.153
```

Убедитесь, что у вас установлены `git`, `docker` и `docker-compose` (или `docker compose` plugin).
```bash
# Если docker еще не установлен:
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER
# После usermod потребуется переподключиться к SSH
```

## 2. Перенос кода на сервер

У вас есть два пути: **Git** или **SCP**.

### Вариант A: Использование Git (Рекомендуется)
Если ваш код лежит на GitHub/GitLab:
1. Зайдите по SSH на сервер.
2. Склонируйте репозиторий:
```bash
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> eshkeree
cd eshkeree
```

### Вариант Б: Копирование файлов напрямую (SCP)
Выполните эту команду на **вашем локальном компьютере** в папке с проектом:
```bash
scp -r . linuxuser@70.34.196.153:~/eshkeree
```
*Примечание: Если папка `node_modules` и `venv` огромные, лучше использовать Git, иначе `scp` будет идти очень долго, предварительно убедившись, что они добавлены в `.gitignore`.*

## 3. Как перенести `.env` файл

Поскольку файл `.env` обычно игнорируется `git` (он есть в `.gitignore`), его нужно перенести отдельно напрямую с вашего компьютера на сервер.

**Выполните эту команду на вашем локальном компьютере** (находясь в папке `e:\code\eshkeree`):
```bash
# Копируем .env для бэкенда
scp backend/.env linuxuser@70.34.196.153:~/eshkeree/backend/.env

# Если у вас есть переменные для фронтенда (.env.production):
# scp frontend/.env linuxuser@70.34.196.153:~/eshkeree/frontend/.env

# Если у вас есть общий файл переменных окружения в корне проекта:
# scp .env linuxuser@70.34.196.153:~/eshkeree/.env
```
Убедитесь, что внутри `backend/.env` прописаны правильные данные для продакшен базы данных:
```env
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=eshkeree_db
DATABASE_URL=postgresql+asyncpg://myuser:mypassword@postgres:5432/eshkeree_db
```
*(Обратите внимание: хост БД = `postgres`, так как это имя сервиса в docker-compose).*

## 4. Запуск проекта на сервере

На сервере (`linuxuser@70.34.196.153`) перейдите в папку с проектом:
```bash
cd ~/eshkeree
```

Запустите сборку и старт контейнеров в фоновом режиме:
```bash
docker-compose up --build -d
```

Проверьте, что всё запустилось и работает:
```bash
docker-compose ps
docker-compose logs -f
```

## 5. Создание глобальных категорий

Я создал для вас скрипт `seed_global_categories.py`. После того как контейнеры запустятся, и база данных будет инициализирована (через alembic или sync`ами алхимии), выполните следующую команду **на сервере**, чтобы добавить глобальные категории в базу:

```bash
docker-compose exec backend python seed_global_categories.py
```

## Что было настроено:
1. **Frontend / Nginx**: Nginx теперь собирает фронтенд (React/Vite) через `npm run build` и сервит статику на порту 80.
2. **Reverse Proxy**: Тот же Nginx проксирует все запросы начинающиеся с `/api/` в контейнер `backend` на порт 8000. Это решает проблему с CORS.
3. **Backend Requirements**: Был исправлен файл зависимостей (`requirments.txt` переименован в правильный `requirements.txt` с корректной кодировкой UTF-8).
4. **Global Categories**: Скрипт `backend/seed_global_categories.py` позволяет создать категории у которых `user_id = Null`. В вашей логике `services/categories.py` они уже подхватываются как общие.

Теперь ваш сайт будет доступен по адресу: `http://70.34.196.153/`
