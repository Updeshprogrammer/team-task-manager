# Team Task Manager

A role-based task management app built with Next.js App Router and MongoDB.

Admins can manage users, projects, and tasks. Members can track and update their assigned tasks with status changes and remarks.

## Features

- JWT cookie authentication (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`)
- Role-based access (`admin`, `member`) with route protection in `middleware.js`
- Project management (`/api/projects`, `/api/projects/[id]`)
- Task management (`/api/tasks`, `/api/tasks/[id]`)
- User administration (`/api/users`, `/api/users/[id]`)
- Profile update + avatar upload (`/api/profile`, `/api/profile/avatar`)
- Validation with Zod and persistence with Mongoose

## Tech Stack

- Next.js 16 (App Router)
- React 19
- MongoDB + Mongoose
- Zod
- JOSE (JWT signing/verification)
- bcryptjs

## Project Structure

- `app/` - pages, layouts, API routes
- `app/api/` - REST API handlers
- `models/` - MongoDB models (`User`, `Project`, `Task`)
- `lib/` - auth, db connection, validators, serializers, helpers
- `middleware.js` - auth + role-based route guard

## Local Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Create environment variables

Create `.env.local` in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret_at_least_16_chars
```

### 3) Run development server

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - create production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

## Roles and Access

- `admin`
  - Manage users
  - Create/update/delete projects
  - Create/update/delete tasks
- `member`
  - View and update own assigned tasks
  - Add remarks to own tasks
  - Update own profile

Newly registered users are created as `member` by default.

## Deployment (Vercel)

When deploying to Vercel, set these environment variables in Project Settings:

- `MONGODB_URI`
- `JWT_SECRET`

If these are missing, auth endpoints like `/api/auth/login` and `/api/auth/register` will return `500`.
