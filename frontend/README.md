<div align="center">

# ⚡ Fluxo Control

**Personal Finance SaaS — Built to last, not just to work.**

[![Live App](https://img.shields.io/badge/App-fluxo--api.vercel.app-4f46e5?style=for-the-badge&logo=vercel)](https://fluxo-api.vercel.app)
[![API](https://img.shields.io/badge/API-Railway-0B0D0E?style=for-the-badge&logo=railway)](https://fluxo-api-production.up.railway.app)
[![Java](https://img.shields.io/badge/Java_17-Spring_Boot-6DB33F?style=for-the-badge&logo=spring)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/Frontend-React_+_Vite-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev)

*Full-stack SaaS for personal financial control — JWT auth, real persistence, mobile-first UX, and resilience when the network fails.*

</div>

---

## 📌 Overview

Fluxo Control is a **production-grade personal finance application** with a decoupled architecture — Spring Boot backend deployed on Railway, React frontend on Vercel, and a PostgreSQL database with real data persistence.

The goal was never to build a simple CRUD. The focus was on **engineering quality**: clean layered architecture, real security practices (JWT + BCrypt), cloud deployment, mobile-first experience, and network resilience that makes the app behave like a proper SaaS product.

---

## 🏗️ Architecture

```
┌─────────────────────┐        HTTPS         ┌─────────────────────────────┐
│   Frontend (Vercel) │ ─────────────────▶   │     Backend (Railway)       │
│   React + Vite      │                       │   Spring Boot + Security    │
│   PWA / Mobile-first│ ◀─────────────────── │   JWT Auth + REST API       │
└─────────────────────┘     JSON Responses    └───────────────┬─────────────┘
                                                              │  JPA / Hibernate
                                                              ▼
                                                  ┌───────────────────────┐
                                                  │  PostgreSQL (Railway) │
                                                  └───────────────────────┘
```

**Backend layers:**

| Layer | Responsibility |
|---|---|
| `controller/` | Request intake, input validation, HTTP responses |
| `service/` | Business rules, orchestration |
| `repository/` | Data access isolation via Spring Data JPA |
| `security/` | JWT filter chain, Spring Security config |
| `dto/` | Data transport — entities are never exposed directly |

---

## ⚙️ Tech Stack

### Backend
- **Java 17**
- **Spring Boot** — application framework
- **Spring Security** — route protection and auth filter
- **JWT** — stateless authentication (no server-side sessions)
- **BCrypt** — secure password hashing
- **JPA / Hibernate** — ORM
- **PostgreSQL** — relational persistence
- **Railway** — cloud deployment

### Frontend
- **React** (via Vite)
- **Axios** — HTTP client
- **PWA** — manifest + icons for installable mobile experience
- **Vercel** — edge deployment

---

## ✅ Features

### 🔐 Authentication & Security
- User registration and login
- Passwords hashed with **BCrypt**
- Stateless auth via **JWT tokens**
- Protected routes enforced by **Spring Security**
- Client-side logout with token cleanup

### 💸 Transactions
- Create transactions (income / expense)
- List, edit, and delete
- Filter by month
- Compact list with expand/collapse

### 📊 Financial Summary
- Balance, total income, total expenses — per month

### 🎯 Monthly Budget Goal
- Configurable spending limit (persisted via LocalStorage)
- Progress bar with percentage feedback (remaining / over budget)

### 📤 Export
- Export transactions as **CSV**

### 🌐 Network Resilience
- Offline/online detection
- Automatic data reload on reconnect
- User-friendly error messages during instability

---

## 🔌 API Reference

> Base URL: `https://fluxo-api-production.up.railway.app`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/cadastro` | Register new user |
| `POST` | `/auth/login` | Authenticate, receive JWT |

### Transactions *(protected — requires `Authorization: Bearer <token>`)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/lancamentos` | List all transactions |
| `POST` | `/api/lancamentos` | Create transaction |
| `PUT` | `/api/lancamentos/{id}` | Update transaction |
| `DELETE` | `/api/lancamentos/{id}` | Delete transaction |
| `GET` | `/api/lancamentos/resumo` | Monthly financial summary |

---

## 🔒 Environment Variables

All secrets are injected via environment variables on Railway. **No credentials are hardcoded.**

```bash
DB_URL=jdbc:postgresql://host:port/database
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_key
PORT=8080
```

`application.properties` uses placeholders:

```properties
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}

server.port=${PORT:8080}

app.jwt.secret=${JWT_SECRET}
app.jwt.expiration-minutes=60
```

---

## 🚀 Running Locally

The app is already live in production — just open the link. But if you want to run locally:

**Backend**
```bash
cd backend
./mvnw spring-boot:run
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

> Set the API base URL in `src/api.js` (or equivalent) to point to your local backend or the production URL.

---

## 🧠 Engineering Decisions

**JWT over sessions** — Stateless, scalable, and naturally compatible with SPAs. No session store needed on the server.

**BCrypt for password hashing** — Industry standard. Adaptive cost factor resists brute-force over time.

**Strict layered architecture** — `controller → service → repository` separation prevents logic sprawl and makes the codebase maintainable as it grows.

**Decoupled deployment (Vercel + Railway)** — Frontend and backend can be deployed, scaled, and versioned independently with no coupling.

**Mobile-first + PWA** — The product is designed for real usage on mobile devices, not just desktop demos.

---

## 🗺️ Roadmap

### Short-term (high impact)
- [ ] Password recovery via email
- [ ] Improved observability — structured logging + monitoring
- [ ] Dashboard with charts (spending trends, category breakdown)

### Medium-term (SaaS foundations)
- [ ] Refresh token rotation
- [ ] Rate limiting — protection against abuse
- [ ] Role-based access control (admin / user)

### Long-term (product)
- [ ] Subscription plans (free / pro) with usage limits and billing
- [ ] Robust multi-tenancy
- [ ] Audit log and financial reports

---

## 🔏 Security & Privacy Notice

As the server owner, I have technical access to the database — this is inherent to any self-hosted SaaS. The project handles this transparently and evolves continuously toward better practices:

- All secrets via environment variables — never committed to the repo
- Protected routes — unauthenticated requests are blocked
- No credentials hardcoded anywhere
- Continuous improvement of logging and monitoring

---

## 👤 Author

**Juan Ygor Delgado** · [Pcthelab](https://github.com/Pcthelab)

> Fluxo Control is an evolving project — used as a real foundation for studying advanced patterns and production-grade standards in Java + React development.
