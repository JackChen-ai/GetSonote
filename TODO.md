# Sonote 开发计划

> 企业级批量音频转录工具 - 开发进度追踪

## 项目概述

**Sonote** 是一个批量音频转录工具，核心功能：
- 音频转录：阿里云 Paraformer ASR
- 文本润色：Qwen/DeepSeek LLM
- 批量处理：并发队列管理
- 导出功能：JSON/TXT 格式

## 技术栈

| 层级 | 技术 | 状态 |
|------|------|------|
| 前端 | React 19 + TypeScript + Vite | ✅ 完成 |
| 样式 | TailwindCSS (CDN) | ✅ 完成 |
| 后端 | Python 3.11 + FastAPI | ✅ 完成 |
| ASR | 阿里云 Paraformer (DashScope) | ✅ 已集成 |
| LLM | Qwen-Max / DeepSeek | ✅ 已集成 |
| 部署 | Docker + Nginx | ✅ 已配置 |

---

## 开发进度

### Phase 0: 项目初始化 ✅
- [x] 前端 UI 组件开发
- [x] 队列处理逻辑
- [x] 结果展示面板
- [x] 项目结构标准化 (src/)
- [x] 项目重命名为 Sonote

### Phase 1: 后端基础架构 ✅
- [x] 1.1 初始化 FastAPI 项目 (`backend/`)
- [x] 1.2 实现 `POST /api/transcribe` 端点
- [x] 1.3 实现 `POST /api/polish` 端点
- [x] 1.4 配置 CORS 跨域支持
- [x] 1.5 前后端联调成功

### Phase 2: 第三方 API 集成 ✅
- [x] 2.1 LLM 服务 (`llm_service.py`) - 支持 DashScope (Qwen) 和 DeepSeek
- [x] 2.2 ASR 服务 (`asr_service.py`) - 阿里云 Paraformer
- [x] 2.3 配置检测端点 `GET /api/config`
- [x] 2.4 Mock 模式自动降级

### Phase 3: 前端完善
- [ ] 3.1 创建前端环境配置文件
- [ ] 3.2 错误重试机制
- [ ] 3.3 加载状态优化

### Phase 4: 部署与运维 ✅
- [x] 4.1 后端 Dockerfile
- [x] 4.2 前端 Dockerfile (多阶段构建)
- [x] 4.3 docker-compose.yml
- [x] 4.4 Nginx 反向代理配置
- [x] 4.5 .dockerignore 文件

---

## 本地开发

### 前端 (端口 3000)
```bash
cd /Users/jack/DEV/GetSonote
npm install
npm run dev
```

### 后端 (端口 3001)
```bash
cd /Users/jack/DEV/GetSonote/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
```

### API 文档
- Swagger UI: http://localhost:3001/docs
- ReDoc: http://localhost:3001/redoc

---

## Docker 部署

### 快速启动 (Mock 模式)
```bash
docker-compose up -d
```

### 生产部署 (真实 API)
```bash
# 1. 复制环境变量模板
cp .env.docker .env

# 2. 编辑 .env，配置 API Key
vim .env

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

### 带 Nginx 反向代理
```bash
docker-compose --profile production up -d
```

### 访问地址
| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3000 |
| 后端 API | http://localhost:3001 |
| API 文档 | http://localhost:3001/docs |
| Nginx (生产) | http://localhost:80 |

### 常用命令
```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 重启服务
docker-compose restart backend

# 停止所有服务
docker-compose down

# 重新构建
docker-compose build --no-cache
```

---

## 目录结构

```
GetSonote/
├── src/                      # 前端源码
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   ├── services/
│   └── types/
├── backend/                  # 后端源码
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── services/
│   │   └── core/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── nginx/                    # Nginx 配置
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
├── Dockerfile                # 前端 Dockerfile
├── docker-compose.yml
├── nginx.conf                # 前端 Nginx 配置
├── .env.docker               # Docker 环境变量模板
└── TODO.md
```

---

## 环境变量

### 后端 (.env)
```env
# Mock Mode
USE_MOCK=true

# DashScope (必需)
DASHSCOPE_API_KEY=sk-xxx

# DeepSeek (可选)
DEEPSEEK_API_KEY=sk-xxx
LLM_PROVIDER=dashscope
```

### 启用真实 API
1. 获取 DashScope API Key: https://dashscope.console.aliyun.com/
2. 编辑 `.env` 文件
3. 设置 `USE_MOCK=false`
4. 验证: `curl http://localhost:3001/api/config`

---

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/config | 配置状态 |
| POST | /api/transcribe | 音频转录 |
| POST | /api/polish | 文本润色 |

---

## 更新日志

### 2024-12-04
- ✅ 项目重命名为 Sonote
- ✅ 前端代码重构，标准化目录结构
- ✅ 创建 FastAPI 后端项目
- ✅ 集成 DashScope LLM (Qwen-Max) 和 ASR (Paraformer)
- ✅ 支持 DeepSeek 作为备选 LLM
- ✅ 添加 Docker 部署配置
- ✅ 配置 Nginx 反向代理
- ✅ Mock 模式自动降级
