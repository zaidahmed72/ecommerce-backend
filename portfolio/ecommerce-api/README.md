# Zaid Store API

A responsive-client-ready REST API for a small online store. It includes customer/admin authorization, hashed passwords, short-lived JWTs, product search and pagination, persistent carts, immutable order line-item snapshots, stock validation, MongoDB transaction-based checkout, input limits, security headers, rate limiting, graceful shutdown and health checks.

## Run locally

Requirements: Node.js 20+, Docker Desktop with Compose. From this folder:

```sh
cp .env.example .env
# Set JWT_SECRET to a random value of at least 32 characters in .env
docker compose up --build
```

API: `http://localhost:4000`; liveness endpoint: `/health/live`. MongoDB runs as a single-node replica set because checkout uses transactions. Data persists in the `mongo_data` volume.

To stop the stack, run `docker compose down`. Add `-v` only when you also want to erase the local MongoDB data.

## Quick start

Register a customer:

```sh
curl -X POST http://localhost:4000/api/auth/register -H 'Content-Type: application/json' -d '{"name":"Demo Customer","email":"customer@example.com","password":"correct-horse-battery"}'
```

Login to receive a bearer token, then use `Authorization: Bearer <token>` on `/api/auth/me`, `/api/cart`, `/api/cart/items`, `/api/orders` and `/api/orders` (GET). Product browsing is public. Admin creation/editing and order status updates require an account whose `role` is `admin`; assign that role through a trusted administrative process, never from public registration.

## API outline

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Public | Create account / sign in |
| GET | `/api/auth/me` | Customer/admin | Current account |
| GET | `/api/products?q=&category=&page=&limit=` | Public | Search and browse |
| POST/PATCH/DELETE | `/api/products` | Admin | Create, edit, deactivate |
| GET/PUT/DELETE | `/api/cart`, `/api/cart/items` | Customer/admin | Read cart, set quantity, remove line |
| POST/GET | `/api/orders` | Customer/admin | Checkout / own order history (admin sees all) |
| PATCH | `/api/orders/:id/status` | Admin | Update fulfillment state |

All responses are JSON. Passwords are never returned. Checkout uses a MongoDB transaction so stock, order creation and cart clearing commit together. Payment processing, email, tax rules and address validation are intentionally integration points, not simulated claims.

## Development

```sh
npm install
npm run check
```

For local development, point `MONGODB_URI` at a MongoDB replica set (the Compose service is configured for that). Never commit `.env` or use the example JWT secret in a public deployment. Terminate TLS at a trusted ingress/proxy and set secrets in the deployment platform.

## Jenkins pipeline

The `Jenkinsfile` at this project root validates the JavaScript, builds the Compose stack with a commit-tagged API image, and smoke-checks `/health/live`. Use Jenkins LTS with Pipeline, Git, GitHub, Credentials Binding and Workspace Cleanup plugins; the agent needs Node.js 20+, Docker Compose v2 and `curl`. Configure the job from this repository with script path `Jenkinsfile`, then configure a GitHub push webhook to the secured Jenkins endpoint. Image publishing is opt-in and needs a `registry-credentials` username/password credential plus `IMAGE_REPOSITORY`. Production deployment is also opt-in, restricted to the default branch, and requires a protected `production` agent and a trusted `DEPLOY_COMMAND` environment value. Do not put registry or deployment secrets in this repository.
