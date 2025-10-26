# HƯỚNG DẪN SỬ DỤNG EVER GAUZY PLATFORM

## 📋 MỤC LỤC

1. [Giới thiệu về Ever Gauzy](#giới-thiệu-về-ever-gauzy)
2. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
3. [Cài đặt môi trường phát triển](#cài-đặt-môi-trường-phát-triển)
4. [Chạy dự án với Docker](#chạy-dự-án-với-docker)
5. [Chạy dự án thủ công](#chạy-dự-án-thủ-công)
6. [Cấu hình cơ sở dữ liệu](#cấu-hình-cơ-sở-dữ-liệu)
7. [Cấu hình các dịch vụ bên ngoài](#cấu-hình-các-dịch-vụ-bên-ngoài)
8. [Build và deploy](#build-và-deploy)
9. [Desktop Apps](#desktop-apps)
10. [Troubleshooting](#troubleshooting)

---

## 🌟 GIỚI THIỆU VỀ EVER GAUZY

Ever® Gauzy™ là một nền tảng quản lý kinh doanh mã nguồn mở toàn diện bao gồm:

- **Enterprise Resource Planning (ERP)**
- **Customer Relationship Management (CRM)**
- **Human Resource Management (HRM)**
- **Applicant Tracking System (ATS)**
- **Work and Project Management (PM)**
- **Employee Time-Tracking & Activity Monitoring**

### Tính năng chính:
- Dashboard tổng quan với các chỉ số quan trọng
- Quản lý thời gian và theo dõi hoạt động
- Quản lý nhân viên và tuyển dụng
- Quản lý dự án và nhiệm vụ
- Kế toán, hóa đơn và thanh toán
- Quản lý khách hàng và nhà cung cấp
- Báo cáo và phân tích

---

## 💻 YÊU CẦU HỆ THỐNG

### Yêu cầu tối thiểu:
- **Node.js**: phiên bản 20.18.1 trở lên
- **Yarn**: phiên bản 1.22.19 trở lên
- **RAM**: ít nhất 8GB (khuyến nghị 16GB)
- **Ổ cứng**: ít nhất 10GB dung lượng trống

### Yêu cầu cho production:
- **PostgreSQL**: phiên bản 16.x (khuyến nghị)
- **Redis**: để caching và session
- **MinIO/AWS S3**: để lưu trữ file
- **Docker**: phiên bản 2.20+ (nếu sử dụng Docker)

### Hệ điều hành được hỗ trợ:
- macOS (Intel & Apple Silicon)
- Windows 10/11
- Linux (Ubuntu, CentOS, etc.)

---

## 🚀 CÀI ĐẶT MÔI TRƯỜNG PHÁT TRIỂN

### Bước 1: Cài đặt Node.js và Yarn

```bash
# Cài đặt Node.js (sử dụng nvm - khuyến nghị)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20.18.1
nvm use 20.18.1

# Cài đặt Yarn
npm install -g yarn
```

### Bước 2: Clone repository

```bash
git clone https://github.com/ever-co/ever-gauzy.git
cd ever-gauzy
```

### Bước 3: Cài đặt dependencies

```bash
# Bootstrap toàn bộ dự án
yarn bootstrap

# Chuẩn bị Husky (nếu bạn sẽ commit code)
yarn prepare:husky
```

### Bước 4: Cấu hình environment

```bash
# Copy file cấu hình mẫu
cp .env.sample .env

# Hoặc sử dụng cấu hình local
cp .env.sample .env.local
```

---

## 🐳 CHẠY DỰ ÁN VỚI DOCKER

Docker là cách dễ nhất để chạy Ever Gauzy với tất cả các dịch vụ cần thiết.

### Demo nhanh (khuyến nghị cho lần đầu):

```bash
# Chạy demo với cấu hình cơ bản
docker-compose -f docker-compose.demo.yml up

# Truy cập ứng dụng:
# Web UI: http://localhost:4200
# API: http://localhost:3000
```

**Thông tin đăng nhập demo:**
- Super Admin: `admin@ever.co` / `admin`
- Employee: `employee@ever.co` / `123456`

### Production với Docker:

```bash
# 1. Cấu hình file .env.compose (tùy chọn)
cp .env.sample .env.compose
nano .env.compose

# 2. Chạy production
docker-compose up -d

# 3. Kiểm tra logs
docker-compose logs -f api
docker-compose logs -f webapp
```

### Build từ source:

```bash
# Build tất cả từ source code (mất nhiều thời gian)
docker-compose -f docker-compose.build.yml up -d
```

### Các dịch vụ được khởi động:

Với `docker-compose.yml` đầy đủ, các dịch vụ sau sẽ được khởi động:

- **PostgreSQL** (port 5432): Cơ sở dữ liệu chính
- **Pgweb** (port 8081): Web UI cho PostgreSQL
- **Redis** (port 6379): Cache và session
- **MinIO** (port 9000): Object storage (AWS S3 compatible)
- **OpenSearch** (port 9200): Search engine
- **OpenSearch Dashboards** (port 5601): Search dashboard
- **Cube.js** (port 4000): Analytics và reporting
- **Jitsu** (port 8001): Data ingestion
- **Zipkin** (port 9411): Distributed tracing

---

## 🔧 CHẠY DỰ ÁN THỦ CÔNG

### Bước 1: Cấu hình cơ sở dữ liệu (tùy chọn)

**Sử dụng SQLite (mặc định - cho demo):**
```bash
# Không cần cấu hình gì thêm, SQLite sẽ được tạo tự động
```

**Sử dụng PostgreSQL (khuyến nghị cho production):**

```bash
# 1. Cài đặt PostgreSQL
# macOS:
brew install postgresql@16
brew services start postgresql@16

# Ubuntu:
sudo apt update
sudo apt install postgresql-16 postgresql-contrib

# 2. Tạo database và user
sudo -u postgres psql
CREATE DATABASE gauzy;
CREATE USER gauzy_user WITH PASSWORD 'gauzy_password';
GRANT ALL PRIVILEGES ON DATABASE gauzy TO gauzy_user;
\q

# 3. Cấu hình trong .env
echo "DB_TYPE=postgres" >> .env
echo "DB_HOST=localhost" >> .env
echo "DB_PORT=5432" >> .env
echo "DB_NAME=gauzy" >> .env
echo "DB_USER=gauzy_user" >> .env
echo "DB_PASS=gauzy_password" >> .env
```

### Bước 2: Cấu hình Redis (tùy chọn nhưng khuyến nghị)

```bash
# macOS:
brew install redis
brew services start redis

# Ubuntu:
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Cấu hình trong .env
echo "REDIS_ENABLED=true" >> .env
echo "REDIS_URL=redis://localhost:6379" >> .env
```

### Bước 3: Chạy ứng dụng

```bash
# Chạy cả API và Web UI cùng lúc
yarn start

# Hoặc chạy riêng từng phần:
# Terminal 1 - API
yarn start:api

# Terminal 2 - Web UI
yarn start:gauzy
```

### Bước 4: Seed dữ liệu (lần đầu)

```bash
# Seed dữ liệu cơ bản
yarn seed

# Seed tất cả dữ liệu (bao gồm dữ liệu demo - mất ~10 phút)
yarn seed:all
```

### Bước 5: Truy cập ứng dụng

- **Web UI**: http://localhost:4200
- **API Documentation**: http://localhost:3000/api/docs
- **API GraphQL**: http://localhost:3000/graphql

---

## 💾 CẤU HÌNH CƠ SỞ DỮ LIỆU

### SQLite (Mặc định)
```bash
DB_TYPE=better-sqlite3
# Database file sẽ được tạo tự động tại: ./.temp/gauzy.sqlite
```

### PostgreSQL (Khuyến nghị cho production)
```bash
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gauzy
DB_USER=postgres
DB_PASS=your_password
DB_SSL_MODE=false
DB_LOGGING=false
DB_POOL_SIZE=40
```

### MySQL
```bash
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gauzy
DB_USER=root
DB_PASS=your_password
```

### Migrations và Schema

```bash
# Chạy migrations
yarn migration:run

# Tạo migration mới
yarn migration:generate -- AddNewTable

# Rollback migration
yarn migration:revert
```

---

## ☁️ CẤU HÌNH CÁC DỊCH VỤ BEN NGOÀI

### File Storage

**Local (Mặc định):**
```bash
FILE_PROVIDER=LOCAL
```

**AWS S3:**
```bash
FILE_PROVIDER=S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

**Wasabi:**
```bash
FILE_PROVIDER=WASABI
WASABI_ACCESS_KEY_ID=your_access_key
WASABI_SECRET_ACCESS_KEY=your_secret_key
WASABI_REGION=us-east-1
WASABI_S3_BUCKET=your-bucket-name
```

**Cloudinary:**
```bash
FILE_PROVIDER=CLOUDINARY
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Email Configuration (SMTP)

```bash
MAIL_FROM_ADDRESS=noreply@yourcompany.com
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

### OAuth Providers

**Google OAuth:**
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

**GitHub OAuth:**
```bash
GAUZY_GITHUB_OAUTH_CLIENT_ID=your_github_client_id
GAUZY_GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret
GAUZY_GITHUB_OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

### Monitoring và Analytics

**Sentry:**
```bash
SENTRY_DSN=your_sentry_dsn
SENTRY_HTTP_TRACING_ENABLED=true
SENTRY_PROFILING_ENABLED=true
```

**PostHog:**
```bash
POSTHOG_KEY=your_posthog_key
POSTHOG_HOST=https://app.posthog.com
POSTHOG_ENABLED=true
```

---

## 🏗️ BUILD VÀ DEPLOY

### Development Build

```bash
# Build tất cả packages
yarn build

# Build riêng API
yarn build:api

# Build riêng Web UI
yarn build:gauzy
```

### Production Build

```bash
# Build cho production
yarn build:prod

# Build với Docker
yarn build:prod:docker
```

### Environment Configuration

**Development:**
```bash
yarn config:dev
```

**Production:**
```bash
yarn config:prod
```

### Deploy lên các platforms

**Digital Ocean App Platform:**
```bash
# Sử dụng các file cấu hình trong .do/
```

**Kubernetes:**
```bash
# Sử dụng các file cấu hình trong .deploy/k8s/
kubectl apply -f .deploy/k8s/
```

**Docker Swarm:**
```bash
docker stack deploy -c docker-compose.yml gauzy-stack
```

---

## 🖥️ DESKTOP APPS

Ever Gauzy cung cấp nhiều Desktop Apps khác nhau:

### 1. Gauzy Desktop App

**Build từ source:**
```bash
# Build cho macOS
yarn build:desktop:mac

# Build cho Windows
yarn build:desktop:windows

# Build cho Linux
yarn build:desktop:linux

# Test local
yarn build:desktop:local
```

### 2. Gauzy Desktop Timer

**Build Timer App:**
```bash
# Build cho macOS
yarn build:desktop-timer:mac

# Build cho Windows
yarn build:desktop-timer:windows

# Build cho Linux
yarn build:desktop-timer:linux
```

### 3. Gauzy Server (Standalone)

**Build Server App:**
```bash
# Build cho macOS
yarn build:gauzy-server:mac

# Build cho Windows
yarn build:gauzy-server:windows

# Build cho Linux
yarn build:gauzy-server:linux
```

### Cấu hình Desktop Apps

```bash
# Cấu hình cho desktop app
yarn config:desktop:prod

# Cấu hình cho timer app
yarn config:desktop-timer:prod

# Cấu hình cho server app
yarn config:server:prod
```

---

## 🔧 TROUBLESHOOTING

### Các lỗi thường gặp

**1. Lỗi memory heap:**
```bash
# Tăng memory limit
export NODE_OPTIONS="--max-old-space-size=12288"
yarn start
```

**2. Lỗi port đã được sử dụng:**
```bash
# Kiểm tra port đang được sử dụng
lsof -ti:3000 # API port
lsof -ti:4200 # UI port

# Kill process
kill -9 $(lsof -ti:3000)
```

**3. Lỗi database connection:**
```bash
# Kiểm tra PostgreSQL
pg_isready -h localhost -p 5432

# Reset database
yarn seed

# Check logs
docker-compose logs db
```

**4. Lỗi yarn install:**
```bash
# Clear cache
yarn cache clean

# Remove node_modules và reinstall
rm -rf node_modules
rm yarn.lock
yarn install
```

**5. Lỗi build:**
```bash
# Clean build
yarn prebuild
yarn build

# Build từng package riêng
yarn build:package:all
```

### Debug mode

```bash
# Chạy API trong debug mode
yarn start:api --inspect

# Chạy với debug logs
NODE_ENV=development DEBUG=* yarn start
```

### Performance tuning

```bash
# Tăng performance cho development
yarn config:dev
export NODE_ENV=development
export NODE_OPTIONS="--max-old-space-size=12288"

# Disable unnecessary features
FEATURE_EMAIL_VERIFICATION=false
FEATURE_OPEN_STATS=false
```

### Logs và monitoring

```bash
# API logs
tail -f logs/api.log

# Docker logs
docker-compose logs -f api
docker-compose logs -f webapp

# Check system resources
htop
docker stats
```

---

## 📖 TÀI LIỆU THAM KHẢO

### Links hữu ích:
- **Trang chủ**: https://gauzy.co
- **Demo online**: https://demo.gauzy.co
- **Documentation**: https://docs.gauzy.co
- **GitHub**: https://github.com/ever-co/ever-gauzy
- **Wiki**: https://github.com/ever-co/ever-gauzy/wiki

### Cộng đồng hỗ trợ:
- **Slack**: [Gauzy Community](https://join.slack.com/t/gauzy/shared_invite/...)
- **Discord**: https://discord.gg/hKQfn4j
- **Email**: gauzy@ever.co

### Downloads:
- **Desktop Apps**: https://gauzy.co/downloads
- **Server Releases**: https://github.com/ever-co/ever-gauzy-server/releases

---

## 📝 GHI CHÚ QUAN TRỌNG

### Security
- Đổi mật khẩu mặc định trong production
- Sử dụng HTTPS trong production
- Cấu hình firewall cho các ports cần thiết
- Backup database định kỳ

### Performance
- Sử dụng PostgreSQL cho production
- Enable Redis caching
- Cấu hình CDN cho static assets
- Monitor và optimize queries

### Maintenance
- Update dependencies định kỳ
- Monitor logs và errors
- Backup data trước khi update
- Test trên staging trước khi deploy production

---

**© 2024 Ever Co. LTD - Ever® Gauzy™ Platform**

Hướng dẫn này được cập nhật cho phiên bản mới nhất. Nếu gặp vấn đề, vui lòng tham khảo [GitHub Issues](https://github.com/ever-co/ever-gauzy/issues) hoặc liên hệ cộng đồng hỗ trợ.
