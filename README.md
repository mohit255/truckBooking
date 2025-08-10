## Way & Wheels Transports - Internal System

Node.js + Express + EJS (ejs-mate) app with Prisma (MySQL).

### Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `SESSION_SECRET`.
2. Install deps:

```
npm install
```

3. Generate client and run migrations (first time):

```
npx prisma generate
npx prisma migrate dev --name init
```

4. Seed (optional):

```
npm run seed
```

5. Start:

```
npm run dev
```

Open `http://localhost:3000`

### Modules
- Vehicle Master
- Booking Management
- Commission & Payment Tracker
- Reports + CSV export

### Notes
- Roles/auth optional and not included.
- Add validations and security before production use.

