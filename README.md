# Sonote

> 音频转录 + AI 润色工具 MVP

**结论：建议 Pivot 或放弃该赛道。** 详见 [PRODUCT_ANALYSIS.md](./PRODUCT_ANALYSIS.md)

---

## 项目状态

这是一个**产品探索项目**，包含：
- 可运行的 MVP 代码
- 深度产品分析报告（核心价值）

### 核心发现

| 方向 | 可行性 | 结论 |
|------|--------|------|
| 通用音频转录 | :x: | 讯飞/阿里/腾讯已做到极致 |
| 会议纪要工作流 | :x: | 钉钉闪记/企微/飞书妙记已覆盖 |
| 集成钉钉/企微 | :x: | 核心功能不开放给第三方 |
| 播客字幕生成 | :warning: | 剪映强势，但有缝隙市场 |
| 对标闪念贝壳 | :x: | 团队背景/iOS生态/先发优势差距大 |

**一句话结论：** 2025年音频转录赛道已被大厂占据，第三方只能在缝隙市场生存。

---

## 技术栈

### 前端
- React 19 + TypeScript
- Vite
- TailwindCSS

### 后端
- FastAPI (Python)
- 阿里云 DashScope ASR
- Qwen/DeepSeek LLM

### 部署
- Docker + Docker Compose
- Nginx

---

## 快速开始

### 前端

```bash
npm install
npm run dev
```

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 DASHSCOPE_API_KEY

uvicorn app.main:app --reload --port 3001
```

### Docker 部署

```bash
docker-compose up -d
```

---

## 项目结构

```
GetSonote/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── hooks/              # 自定义 Hooks
│   ├── services/           # API 服务
│   └── types/              # TypeScript 类型
├── backend/                # FastAPI 后端
│   └── app/
│       ├── api/            # API 路由
│       ├── services/       # 业务逻辑
│       └── core/           # 配置
├── PRODUCT_ANALYSIS.md     # 产品分析报告 ⭐
├── PM_REVIEW.md            # PM 走查报告
└── docker-compose.yml      # Docker 配置
```

---

## 产品分析文档

本项目的核心价值是**产品分析报告**，包含：

- [x] 竞品分析（讯飞听见、飞书妙记、钉钉闪记、企业微信、闪念贝壳）
- [x] 市场份额数据（2025 Q1）
- [x] 定价策略对标
- [x] 用户场景分析
- [x] 为什么不应该对标剪映
- [x] 为什么不应该对标闪念贝壳
- [x] 钉钉/企业微信生态调研
- [x] 最终结论与建议

**阅读完整报告：** [PRODUCT_ANALYSIS.md](./PRODUCT_ANALYSIS.md)

---

## 如果你想继续这个项目

**必须先完成的验证：**

1. 找 5 个目标用户（播客主播/专业剪辑师）
2. 问他们现在怎么做字幕/会议纪要
3. 问他们对现有工具最不满意的点
4. 问他们愿意为解决这个痛点付多少钱
5. 如果答案是"剪映/钉钉够用了"，立即放弃

---

## License

MIT

---

*分析日期: 2025-12-05*
