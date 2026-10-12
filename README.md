# Mini Task Manager

A small internal task manager where every change is traceable. Users can create tasks, move them through a fixed status flow, and see an audit log of who changed what and when.

- **Frontend:** React 19 + TypeScript (Vite, Tailwind + daisyUI)
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB (via Mongoose)

## Running the project

### Option A: Docker (one command)

Requires Docker. Starts MongoDB (single-node replica set), the backend and the frontend:

```bash
docker compose up --build
```

Open http://localhost:5173. No MongoDB account or URL needed.

### Option B: Node.js (no Docker, no MongoDB setup)

Requires Node.js 20+. If `MONGO_URI` is not set, the backend starts a throwaway in-memory MongoDB replica set (the first run downloads a `mongod` binary; data is lost on restart).

```bash
# terminal 1
cd backend
npm install
npm run dev              # http://localhost:5001

# terminal 2
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Vite proxies `/api` to `http://localhost:5001`, so start the backend first.

To use your own database instead, copy `backend/.env.example` to `backend/.env` and set `MONGO_URI`. It must support **transactions** (a replica set; MongoDB Atlas works, a standalone `mongod` does not).

Other backend scripts: `npm run build`, `npm start`, `npm run typecheck`.

## API

All routes are under `/api/task`. Write routes require an `x-user` header (see [Assumptions](#assumptions)).

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | List tasks (`?includeDeleted=true` to include deleted ones) |
| GET | `/:id` | Get one task |
| GET | `/:id/audit-logs` | Audit log for a task (newest first) |
| POST | `/` | Create task (always starts as `to_do`) |
| PUT | `/:id` | Update fields, including `progress` |
| PUT | `/:id/restore` | Restore a soft-deleted task |
| DELETE | `/:id` | Soft-delete a task |

Error codes: `400` invalid transition or validation, `401` missing `x-user`, `403` unknown user, `404` not found, `409` task deleted / already deleted / not deleted.

## Architecture

```
backend/src
  config/       db connection, predefined users
  middleware/   requireActor (validates x-user)
  models/       Task, AuditLog (Mongoose schemas)
  controllers/  taskController (request handling + transactions)
  utils/        status (transition rules), audit (diff + log write), httpError
  routes/       taskRoutes
frontend/src
  api/          axios calls
  hooks/        useTasks (data + actions)
  components/   TaskTable, TaskRow, TaskFormModal, AuditTimeline, ProgressTooltip
  pages/        HomePage, Navbar
  constants/    accounts, status transitions, badge styles
```

Key points:

- **Backend is the source of truth for rules.** The transition table lives in `utils/status.ts`. The frontend has a copy only to hide invalid options in the UI; the backend rejects invalid changes regardless.
- **Task change and audit log share one transaction.** `inTransaction` wraps the task write and the log write, so either both are committed or neither. If the log cannot be written, the task change is rolled back.
- **Audit logs record a diff.** Each log stores `action` (`create` / `update` / `delete` / `restore`), a `changes` object of `{ field: { from, to } }`, the actor (`performedBy`), the task id, and a `createdAt` timestamp. This answers: which task, who, from what to what, and when.
- **Idempotent updates.** The controller diffs the task before and after. If nothing changed (for example the same status again), nothing is saved and no log is created.

## Assumptions

- **No auth.** The actor is chosen from a hardcoded list (`Guest 1`, `Guest 2`, `Guest 3`) via a dropdown in the navbar and sent as an `x-user` header. The backend checks it against the same list. This is identification, not authentication: anyone can send any name.
- **Status flow.** The allowed transitions are:

  ```
  to_do        -> pending, in_progress
  pending      -> in_progress
  in_progress  -> pending, done
  done         -> (final)
  ```

  This is slightly looser than a strict `to_do → pending → in_progress → done` chain: a task may skip `pending` and go straight to `in_progress`, and may move back from `in_progress` to `pending` (for example, when blocked). This reflects real-world workflows, where a task can become pending either before work starts or partway through. `done` is final. If strict one-step-forward transitions are required, only `ALLOWED_TRANSITIONS` in `backend/src/utils/status.ts` (and its frontend copy) needs to change.
- **Delete is a soft delete** (`deletedAt`). The task's history must remain explainable, so deleting a task never removes its logs. Delete and restore are themselves logged.
- **Tracked fields.** Changes to `title`, `content`, `priority` and `progress` are all logged, not only status changes. This is a superset of the requirement.
- **Log order.** The API returns newest first; the UI reverses it to show a chronological timeline (oldest first).

## Trade-offs

- **MongoDB with transactions** instead of in-memory/JSON. Persistence and atomicity come for free, but setup is heavier (replica set required) and the project needs an external database to run.
- **Soft delete** keeps history intact but means every list query has to filter on `deletedAt`and make the database less lean
- **`changes` is a free-form `Mixed` field.** It is flexible and cheap to extend, but it is not schema-validated at the database level.
- **Hardcoded users in two places** (backend and frontend) is simple but must be kept in sync by hand.
- **Transition table duplicated in the frontend** gives a better UX without a round trip, at the cost of possible drift. The backend always wins.
- **No pagination** on tasks or logs, to keep the code small.

## If I had more time

- Add automated tests: transition rules, idempotency, rollback when the log write fails, and immutability of logs.
- Add automated deletion for soft deleted task after a set time period to keep database lean 
- Enforce audit-log immutability at the database level (see below).
- Optimistic concurrency (a version field) so two users editing the same task do not silently overwrite each other.
- Pagination and filtering for tasks and logs.
- Real authentication so the actor cannot be spoofed.

## Questions

### How do I make sure audit logs are not modified?

Currently at the application level, in `models/AuditLog.ts`:

- The API exposes no route that updates or deletes logs. Logs are only created, inside the same transaction as the task change.
- The Mongoose model has hooks that reject `updateOne`, `updateMany`, `replaceOne`, `findOneAndUpdate`, `findOneAndReplace`, `findOneAndDelete`, `deleteOne` and `deleteMany`, and reject `save()` on any document that is not new.
- `updatedAt` is disabled for logs, so the schema itself has no concept of an edit.

**Limitation:** these hooks only protect writes that go through this Mongoose model. Someone with direct database access, or code using the raw driver, can still modify the collection. 

For real tamper resistance I would use a database user for the app with only `insert` and `find` privileges on the audit collection, and optionally a hash chain (each log stores a hash of the previous one) so tampering is detectable.

### Which part is most risky with many users?

- **Concurrent updates to the same task.** There is no version check, so two users editing at the same time follow last-write-wins. Each log is still correct (the diff is computed inside the transaction), but one user's intent can be lost. Transaction write conflicts currently surface as a generic error rather than a retry.
- **The actor is not authenticated**, so the audit log is only as trustworthy as the honesty of the client.
- **Unpaginated list endpoints** will get slow as tasks and logs grow.
- **Transactions add latency and contention** on a hot task.

### If this grows into a large system, what do I refactor first?

The controller. It currently mixes HTTP handling, domain rules, and transaction management. I would extract a task service (domain logic and transaction boundary) so rules are testable without HTTP, and so the audit log can later move to an event/outbox pattern or its own store. Right behind it: a real identity layer replacing the `x-user` header, since the audit log's value depends on it.

## AI usage

This project was built with AI assistance (Claude Code). I set up the initial code skeleton for both the backend and frontend, then used Claude Code to complete them. In the backend, I preferred to have more control, so majority of the code was written manually. For the frontend, I built the UI skeleton, then used Claude Code to handle routing and polish the styling, since that involved a lot of repetitive work.

Validation:

- The TypeScript compiler (`npm run typecheck` in the backend, `npm run build` in the frontend) must pass.
- The behavior required by the brief was exercised manually through the UI and API (for example `backend/postman/` contains the requests used): invalid transitions return `400`, repeating the same status creates no new log, and the log timeline matches the task's actual history.
- The rules above (transition table, soft delete, transaction boundary) were reviewed so I can explain each one; they are intentionally small and kept in a few files.
