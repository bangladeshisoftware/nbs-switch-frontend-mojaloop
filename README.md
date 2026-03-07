# R Switch Portal — Frontend

React frontend for Mojaloop R Switch Hub Management Portal.

## Setup

```bash
npm install
cp .env.example .env
# Set REACT_APP_API_URL to your backend API URL
```

## Run Development

```bash
npm start
# Opens at http://localhost:3000
```

## Build Production

```bash
npm run build
```

## Deploy to Kubernetes

```bash
# 1. Build and push Docker image
docker build -t your-registry/r-switch-frontend:latest .
docker push your-registry/r-switch-frontend:latest

# 2. Apply to cluster
kubectl apply -f k8s/deployment.yaml

# 3. Add DNS record
# portal.mojaloop.xyz → 95.111.247.250

# 4. Check status
kubectl get pods -n bscao | grep r-switch
```

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Login | /login | JWT Authentication |
| Dashboard | / | KPIs, charts, top DFSPs |
| Transactions | /transactions | All transfers with filters |
| Transfer Detail | /transactions/:id | Full timeline + state history |
| Reconciliation | /reconciliation | Records + net position report |
| Settlement | /settlement | Windows + net positions |
| DFSP Management | /dfsps | Add/edit DFSPs |
| Users | /users | User management |

## Default Login

```
Username: admin
Password: Admin@123
```
# nbs-switch-frontend-mojaloop

