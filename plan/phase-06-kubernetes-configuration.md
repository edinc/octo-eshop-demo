# Phase 6: Kubernetes Configuration

## Overview
Create Kubernetes manifests for deploying all services to AKS, using Kustomize for environment-specific overlays.

## Prerequisites
- Phase 5 completed (Docker images available)
- kubectl installed
- Basic understanding of Kubernetes concepts

---

## Tasks

### 6.1 Base Kubernetes Manifests

**Objective:** Create base Kubernetes configurations that can be customized per environment.

#### Directory Structure:
```
kubernetes/
├── base/
│   ├── namespace.yaml
│   ├── kustomization.yaml
│   ├── configmaps/
│   │   └── app-config.yaml
│   ├── secrets/
│   │   └── app-secrets.yaml
│   └── services/
│       ├── frontend/
│       │   ├── deployment.yaml
│       │   ├── service.yaml
│       │   └── kustomization.yaml
│       ├── user-service/
│       │   ├── deployment.yaml
│       │   ├── service.yaml
│       │   └── kustomization.yaml
│       ├── product-service/
│       │   ├── deployment.yaml
│       │   ├── service.yaml
│       │   └── kustomization.yaml
│       ├── cart-service/
│       │   ├── deployment.yaml
│       │   ├── service.yaml
│       │   └── kustomization.yaml
│       ├── order-service/
│       │   ├── deployment.yaml
│       │   ├── service.yaml
│       │   └── kustomization.yaml
│       └── payment-service/
│           ├── deployment.yaml
│           ├── service.yaml
│           └── kustomization.yaml
├── overlays/
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml
│   │   └── patches/
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   └── production/
│       ├── kustomization.yaml
│       └── patches/
└── ingress/
    └── ingress.yaml
```

#### File: `kubernetes/base/namespace.yaml`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: octo-eshop
  labels:
    app.kubernetes.io/name: octo-eshop
    app.kubernetes.io/managed-by: kustomize
```

#### File: `kubernetes/base/kustomization.yaml`
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: octo-eshop

resources:
  - namespace.yaml
  - configmaps/app-config.yaml
  - services/frontend/
  - services/user-service/
  - services/product-service/
  - services/cart-service/
  - services/order-service/
  - services/payment-service/

commonLabels:
  app.kubernetes.io/part-of: octo-eshop
```

---

### 6.2 Service Deployments

#### File: `kubernetes/base/services/user-service/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  labels:
    app: user-service
    app.kubernetes.io/name: user-service
    app.kubernetes.io/component: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
        app.kubernetes.io/name: user-service
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: octo-eshop-sa
      containers:
        - name: user-service
          image: octoeshopacr.azurecr.io/user-service:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: user-service-secrets
                  key: database-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: user-service-secrets
                  key: jwt-secret
            - name: JWT_EXPIRES_IN
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: jwt-expires-in
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          securityContext:
            runAsNonRoot: true
            runAsUser: 1001
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - user-service
                topologyKey: kubernetes.io/hostname
```

#### File: `kubernetes/base/services/user-service/service.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service
  labels:
    app: user-service
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3000
      protocol: TCP
      name: http
  selector:
    app: user-service
```

#### File: `kubernetes/base/services/user-service/kustomization.yaml`
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
```

#### File: `kubernetes/base/services/product-service/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
  labels:
    app: product-service
    app.kubernetes.io/name: product-service
    app.kubernetes.io/component: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: product-service
  template:
    metadata:
      labels:
        app: product-service
        app.kubernetes.io/name: product-service
    spec:
      serviceAccountName: octo-eshop-sa
      containers:
        - name: product-service
          image: octoeshopacr.azurecr.io/product-service:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: product-service-secrets
                  key: database-url
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          securityContext:
            runAsNonRoot: true
            runAsUser: 1001
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
```

#### File: `kubernetes/base/services/cart-service/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cart-service
  labels:
    app: cart-service
    app.kubernetes.io/name: cart-service
    app.kubernetes.io/component: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cart-service
  template:
    metadata:
      labels:
        app: cart-service
        app.kubernetes.io/name: cart-service
    spec:
      serviceAccountName: octo-eshop-sa
      containers:
        - name: cart-service
          image: octoeshopacr.azurecr.io/cart-service:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: cart-service-secrets
                  key: redis-url
            - name: PRODUCT_SERVICE_URL
              value: "http://product-service"
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "250m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          securityContext:
            runAsNonRoot: true
            runAsUser: 1001
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
```

#### File: `kubernetes/base/services/frontend/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  labels:
    app: frontend
    app.kubernetes.io/name: frontend
    app.kubernetes.io/component: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
        app.kubernetes.io/name: frontend
    spec:
      serviceAccountName: octo-eshop-sa
      containers:
        - name: frontend
          image: octoeshopacr.azurecr.io/frontend:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 80
              name: http
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "128Mi"
              cpu: "100m"
          livenessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5
          securityContext:
            runAsNonRoot: true
            runAsUser: 1001
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
          volumeMounts:
            - name: cache
              mountPath: /var/cache/nginx
            - name: run
              mountPath: /var/run
      volumes:
        - name: cache
          emptyDir: {}
        - name: run
          emptyDir: {}
```

---

### 6.3 ConfigMaps and Secrets

#### File: `kubernetes/base/configmaps/app-config.yaml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  jwt-expires-in: "15m"
  refresh-token-expires-in: "7d"
  log-level: "info"
  cors-origins: "https://octo-eshop.example.com"
```

#### File: `kubernetes/base/secrets/app-secrets.yaml` (template - actual secrets via External Secrets or sealed secrets)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: user-service-secrets
type: Opaque
stringData:
  database-url: "placeholder"  # Will be replaced by External Secrets
  jwt-secret: "placeholder"
---
apiVersion: v1
kind: Secret
metadata:
  name: product-service-secrets
type: Opaque
stringData:
  database-url: "placeholder"
---
apiVersion: v1
kind: Secret
metadata:
  name: cart-service-secrets
type: Opaque
stringData:
  redis-url: "placeholder"
---
apiVersion: v1
kind: Secret
metadata:
  name: order-service-secrets
type: Opaque
stringData:
  database-url: "placeholder"
```

---

### 6.4 Ingress Configuration

#### File: `kubernetes/ingress/ingress.yaml`
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: octo-eshop-ingress
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/ssl-redirect: "true"
    appgw.ingress.kubernetes.io/connection-draining: "true"
    appgw.ingress.kubernetes.io/connection-draining-timeout: "30"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - octo-eshop.example.com
      secretName: octo-eshop-tls
  rules:
    - host: octo-eshop.example.com
      http:
        paths:
          - path: /api/users
            pathType: Prefix
            backend:
              service:
                name: user-service
                port:
                  number: 80
          - path: /api/products
            pathType: Prefix
            backend:
              service:
                name: product-service
                port:
                  number: 80
          - path: /api/cart
            pathType: Prefix
            backend:
              service:
                name: cart-service
                port:
                  number: 80
          - path: /api/orders
            pathType: Prefix
            backend:
              service:
                name: order-service
                port:
                  number: 80
          - path: /api/payments
            pathType: Prefix
            backend:
              service:
                name: payment-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

---

### 6.5 Horizontal Pod Autoscaler

#### File: `kubernetes/base/services/product-service/hpa.yaml`
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: product-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: product-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

---

### 6.6 Pod Disruption Budget

#### File: `kubernetes/base/services/product-service/pdb.yaml`
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: product-service-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: product-service
```

---

### 6.7 Service Account and RBAC

#### File: `kubernetes/base/rbac/service-account.yaml`
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: octo-eshop-sa
  namespace: octo-eshop
  annotations:
    azure.workload.identity/client-id: "${AZURE_CLIENT_ID}"
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: octo-eshop-role
  namespace: octo-eshop
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: octo-eshop-rolebinding
  namespace: octo-eshop
subjects:
  - kind: ServiceAccount
    name: octo-eshop-sa
    namespace: octo-eshop
roleRef:
  kind: Role
  name: octo-eshop-role
  apiGroup: rbac.authorization.k8s.io
```

---

### 6.8 Environment Overlays

#### File: `kubernetes/overlays/dev/kustomization.yaml`
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: octo-eshop-dev

resources:
  - ../../base

namePrefix: dev-

commonLabels:
  environment: dev

replicas:
  - name: user-service
    count: 1
  - name: product-service
    count: 1
  - name: cart-service
    count: 1
  - name: order-service
    count: 1
  - name: payment-service
    count: 1
  - name: frontend
    count: 1

images:
  - name: octoeshopacr.azurecr.io/user-service
    newTag: dev
  - name: octoeshopacr.azurecr.io/product-service
    newTag: dev
  - name: octoeshopacr.azurecr.io/cart-service
    newTag: dev
  - name: octoeshopacr.azurecr.io/order-service
    newTag: dev
  - name: octoeshopacr.azurecr.io/payment-service
    newTag: dev
  - name: octoeshopacr.azurecr.io/frontend
    newTag: dev

patches:
  - path: patches/resource-limits.yaml
```

#### File: `kubernetes/overlays/dev/patches/resource-limits.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  template:
    spec:
      containers:
        - name: user-service
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "250m"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
spec:
  template:
    spec:
      containers:
        - name: product-service
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "250m"
```

#### File: `kubernetes/overlays/production/kustomization.yaml`
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: octo-eshop-prod

resources:
  - ../../base
  - ../../ingress

namePrefix: prod-

commonLabels:
  environment: production

replicas:
  - name: user-service
    count: 3
  - name: product-service
    count: 3
  - name: cart-service
    count: 3
  - name: order-service
    count: 2
  - name: payment-service
    count: 2
  - name: frontend
    count: 3

images:
  - name: octoeshopacr.azurecr.io/user-service
    newTag: v1.0.0
  - name: octoeshopacr.azurecr.io/product-service
    newTag: v1.0.0
  - name: octoeshopacr.azurecr.io/cart-service
    newTag: v1.0.0
  - name: octoeshopacr.azurecr.io/order-service
    newTag: v1.0.0
  - name: octoeshopacr.azurecr.io/payment-service
    newTag: v1.0.0
  - name: octoeshopacr.azurecr.io/frontend
    newTag: v1.0.0

patches:
  - path: patches/resource-limits.yaml
  - path: patches/hpa.yaml
```

---

## Deployment Commands

```bash
# Preview dev deployment
kubectl kustomize kubernetes/overlays/dev

# Apply dev deployment
kubectl apply -k kubernetes/overlays/dev

# Preview production deployment
kubectl kustomize kubernetes/overlays/production

# Apply production deployment
kubectl apply -k kubernetes/overlays/production

# Check deployment status
kubectl get deployments -n octo-eshop-dev
kubectl get pods -n octo-eshop-dev
kubectl get services -n octo-eshop-dev

# View logs
kubectl logs -f deployment/user-service -n octo-eshop-dev

# Port forward for local testing
kubectl port-forward svc/frontend 8080:80 -n octo-eshop-dev
```

---

## Deliverables Checklist

- [ ] Base namespace configuration
- [ ] Deployment manifests for all 6 services
- [ ] Service manifests for all services
- [ ] ConfigMap for application configuration
- [ ] Secret templates (to be managed by External Secrets)
- [ ] Ingress configuration for Azure Application Gateway
- [ ] HorizontalPodAutoscaler for scalable services
- [ ] PodDisruptionBudget for high availability
- [ ] ServiceAccount and RBAC configuration
- [ ] Dev environment overlay with reduced resources
- [ ] Staging environment overlay
- [ ] Production environment overlay with full resources
- [ ] Kustomization files for all components
- [ ] All manifests validate with `kubectl apply --dry-run`

---

## Dependencies

**Depends on:**
- Phase 5: Docker images

**Required by:**
- Phase 7: Azure infrastructure (AKS cluster)
- Phase 8: CI/CD pipeline (deployment targets)
