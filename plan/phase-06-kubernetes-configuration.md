# Phase 6: Kubernetes Configuration with Helm

## Overview
Create Helm charts for deploying all services to AKS, with one chart per microservice for independent releases and versioning.

## Prerequisites
- Phase 5 completed (Docker images available)
- kubectl installed
- Helm 3.x installed
- Basic understanding of Kubernetes and Helm concepts

---

## Tasks

### 6.1 Helm Chart Structure

**Objective:** Create Helm charts for each microservice with shared templates and values.

#### Directory Structure:
```
helm/
├── charts/
│   ├── frontend/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   ├── values-dev.yaml
│   │   ├── values-staging.yaml
│   │   ├── values-production.yaml
│   │   └── templates/
│   │       ├── _helpers.tpl
│   │       ├── deployment.yaml
│   │       ├── service.yaml
│   │       ├── ingress.yaml
│   │       ├── hpa.yaml
│   │       ├── pdb.yaml
│   │       ├── configmap.yaml
│   │       ├── serviceaccount.yaml
│   │       └── NOTES.txt
│   ├── user-service/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   ├── values-dev.yaml
│   │   ├── values-staging.yaml
│   │   ├── values-production.yaml
│   │   └── templates/
│   │       ├── _helpers.tpl
│   │       ├── deployment.yaml
│   │       ├── service.yaml
│   │       ├── hpa.yaml
│   │       ├── pdb.yaml
│   │       ├── configmap.yaml
│   │       ├── secret.yaml
│   │       ├── serviceaccount.yaml
│   │       └── NOTES.txt
│   ├── product-service/
│   │   └── ... (same structure)
│   ├── cart-service/
│   │   └── ... (same structure)
│   ├── order-service/
│   │   └── ... (same structure)
│   └── payment-service/
│       └── ... (same structure)
├── helmfile.yaml              # Optional: for managing multiple releases
└── environments/
    ├── dev.yaml
    ├── staging.yaml
    └── production.yaml
```

---

### 6.2 Base Helm Chart Template

**Objective:** Create a reusable chart structure that all services follow.

#### File: `helm/charts/user-service/Chart.yaml`
```yaml
apiVersion: v2
name: user-service
description: User authentication and profile management service for Octo E-Shop
type: application
version: 1.0.0
appVersion: "1.0.0"
keywords:
  - octo-eshop
  - microservice
  - user
  - authentication
maintainers:
  - name: Platform Team
    email: platform@octo-eshop.example.com
```

#### File: `helm/charts/user-service/values.yaml`
```yaml
# Default values for user-service

replicaCount: 2

image:
  repository: octoeshopacr.azurecr.io/user-service
  tag: "latest"
  pullPolicy: Always

imagePullSecrets: []

nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3000"
  prometheus.io/path: "/metrics"

podSecurityContext:
  fsGroup: 1001

securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

ingress:
  enabled: false
  className: "azure-application-gateway"
  annotations:
    appgw.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: api.octo-eshop.example.com
      paths:
        - path: /api/users
          pathType: Prefix
  tls:
    - secretName: octo-eshop-tls
      hosts:
        - api.octo-eshop.example.com

resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
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

pdb:
  enabled: true
  minAvailable: 1

nodeSelector: {}

tolerations: []

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app.kubernetes.io/name
                operator: In
                values:
                  - user-service
          topologyKey: kubernetes.io/hostname

# Application-specific configuration
config:
  nodeEnv: "production"
  port: "3000"
  logLevel: "info"
  jwtExpiresIn: "15m"
  refreshTokenExpiresIn: "7d"

# External secrets (from Azure Key Vault)
externalSecrets:
  enabled: true
  secretStoreRef: azure-keyvault
  secrets:
    - key: database-url
      remoteRef: user-db-connection-string
    - key: jwt-secret
      remoteRef: jwt-secret

# Inline secrets (for development only)
secrets: {}
  # database-url: ""
  # jwt-secret: ""

# Health checks
livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

# Volume mounts for tmp directory (required for read-only root filesystem)
extraVolumes:
  - name: tmp
    emptyDir: {}

extraVolumeMounts:
  - name: tmp
    mountPath: /tmp
```

---

### 6.3 Helm Templates

#### File: `helm/charts/user-service/templates/_helpers.tpl`
```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "user-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "user-service.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "user-service.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "user-service.labels" -}}
helm.sh/chart: {{ include "user-service.chart" . }}
{{ include "user-service.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: octo-eshop
app.kubernetes.io/component: backend
{{- end }}

{{/*
Selector labels
*/}}
{{- define "user-service.selectorLabels" -}}
app.kubernetes.io/name: {{ include "user-service.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "user-service.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "user-service.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
```

#### File: `helm/charts/user-service/templates/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "user-service.fullname" . }}
  labels:
    {{- include "user-service.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "user-service.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        {{- with .Values.podAnnotations }}
        {{- toYaml . | nindent 8 }}
        {{- end }}
      labels:
        {{- include "user-service.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "user-service.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.targetPort }}
              protocol: TCP
          envFrom:
            - configMapRef:
                name: {{ include "user-service.fullname" . }}-config
            {{- if or .Values.externalSecrets.enabled .Values.secrets }}
            - secretRef:
                name: {{ include "user-service.fullname" . }}-secrets
            {{- end }}
          livenessProbe:
            {{- toYaml .Values.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.readinessProbe | nindent 12 }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          {{- with .Values.extraVolumeMounts }}
          volumeMounts:
            {{- toYaml . | nindent 12 }}
          {{- end }}
      {{- with .Values.extraVolumes }}
      volumes:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

#### File: `helm/charts/user-service/templates/service.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "user-service.fullname" . }}
  labels:
    {{- include "user-service.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "user-service.selectorLabels" . | nindent 4 }}
```

#### File: `helm/charts/user-service/templates/hpa.yaml`
```yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "user-service.fullname" . }}
  labels:
    {{- include "user-service.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "user-service.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
    {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
  {{- with .Values.autoscaling.behavior }}
  behavior:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}
```

#### File: `helm/charts/user-service/templates/pdb.yaml`
```yaml
{{- if .Values.pdb.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "user-service.fullname" . }}
  labels:
    {{- include "user-service.labels" . | nindent 4 }}
spec:
  {{- if .Values.pdb.minAvailable }}
  minAvailable: {{ .Values.pdb.minAvailable }}
  {{- end }}
  {{- if .Values.pdb.maxUnavailable }}
  maxUnavailable: {{ .Values.pdb.maxUnavailable }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "user-service.selectorLabels" . | nindent 6 }}
{{- end }}
```

#### File: `helm/charts/user-service/templates/configmap.yaml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "user-service.fullname" . }}-config
  labels:
    {{- include "user-service.labels" . | nindent 4 }}
data:
  NODE_ENV: {{ .Values.config.nodeEnv | quote }}
  PORT: {{ .Values.config.port | quote }}
  LOG_LEVEL: {{ .Values.config.logLevel | quote }}
  JWT_EXPIRES_IN: {{ .Values.config.jwtExpiresIn | quote }}
  REFRESH_TOKEN_EXPIRES_IN: {{ .Values.config.refreshTokenExpiresIn | quote }}
```

#### File: `helm/charts/user-service/templates/secret.yaml`
```yaml
{{- if and (not .Values.externalSecrets.enabled) .Values.secrets }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "user-service.fullname" . }}-secrets
  labels:
    {{- include "user-service.labels" . | nindent 4 }}
type: Opaque
stringData:
  {{- range $key, $value := .Values.secrets }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
{{- end }}
```

#### File: `helm/charts/user-service/templates/external-secret.yaml`
```yaml
{{- if .Values.externalSecrets.enabled }}
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: {{ include "user-service.fullname" . }}-secrets
  labels:
    {{- include "user-service.labels" . | nindent 4 }}
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: {{ .Values.externalSecrets.secretStoreRef }}
  target:
    name: {{ include "user-service.fullname" . }}-secrets
    creationPolicy: Owner
  data:
    {{- range .Values.externalSecrets.secrets }}
    - secretKey: {{ .key }}
      remoteRef:
        key: {{ .remoteRef }}
    {{- end }}
{{- end }}
```

#### File: `helm/charts/user-service/templates/ingress.yaml`
```yaml
{{- if .Values.ingress.enabled -}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "user-service.fullname" . }}
  labels:
    {{- include "user-service.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  {{- if .Values.ingress.className }}
  ingressClassName: {{ .Values.ingress.className }}
  {{- end }}
  {{- if .Values.ingress.tls }}
  tls:
    {{- range .Values.ingress.tls }}
    - hosts:
        {{- range .hosts }}
        - {{ . | quote }}
        {{- end }}
      secretName: {{ .secretName }}
    {{- end }}
  {{- end }}
  rules:
    {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
          {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ include "user-service.fullname" $ }}
                port:
                  number: {{ $.Values.service.port }}
          {{- end }}
    {{- end }}
{{- end }}
```

#### File: `helm/charts/user-service/templates/serviceaccount.yaml`
```yaml
{{- if .Values.serviceAccount.create -}}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "user-service.serviceAccountName" . }}
  labels:
    {{- include "user-service.labels" . | nindent 4 }}
  {{- with .Values.serviceAccount.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}
```

#### File: `helm/charts/user-service/templates/NOTES.txt`
```
Thank you for installing {{ .Chart.Name }}.

Your release is named {{ .Release.Name }}.

To learn more about the release, try:

  $ helm status {{ .Release.Name }}
  $ helm get all {{ .Release.Name }}

{{- if .Values.ingress.enabled }}

The service is available at:
{{- range .Values.ingress.hosts }}
  http{{ if $.Values.ingress.tls }}s{{ end }}://{{ .host }}{{ (first .paths).path }}
{{- end }}

{{- else }}

To access the service locally, run:

  kubectl port-forward svc/{{ include "user-service.fullname" . }} 8080:{{ .Values.service.port }}

Then visit http://localhost:8080

{{- end }}
```

---

### 6.4 Environment-Specific Values

#### File: `helm/charts/user-service/values-dev.yaml`
```yaml
# Development environment overrides

replicaCount: 1

image:
  tag: "dev"

autoscaling:
  enabled: false

pdb:
  enabled: false

resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "256Mi"
    cpu: "250m"

config:
  nodeEnv: "development"
  logLevel: "debug"

# Use inline secrets for dev (or local external secrets)
externalSecrets:
  enabled: false

secrets:
  DATABASE_URL: "postgresql://postgres:postgres@postgres-user:5432/userdb"
  JWT_SECRET: "dev-jwt-secret-not-for-production"
```

#### File: `helm/charts/user-service/values-staging.yaml`
```yaml
# Staging environment overrides

replicaCount: 2

image:
  tag: "staging"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5

resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "384Mi"
    cpu: "400m"

config:
  nodeEnv: "staging"
  logLevel: "info"

externalSecrets:
  enabled: true
  secretStoreRef: azure-keyvault-staging
```

#### File: `helm/charts/user-service/values-production.yaml`
```yaml
# Production environment overrides

replicaCount: 3

image:
  tag: "v1.0.0"

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10

pdb:
  enabled: true
  minAvailable: 2

resources:
  requests:
    memory: "256Mi"
    cpu: "200m"
  limits:
    memory: "512Mi"
    cpu: "500m"

config:
  nodeEnv: "production"
  logLevel: "warn"

ingress:
  enabled: true

externalSecrets:
  enabled: true
  secretStoreRef: azure-keyvault-production
```

---

### 6.5 Helmfile for Multi-Service Deployment

**Objective:** Manage all service deployments together using Helmfile.

#### File: `helm/helmfile.yaml`
```yaml
repositories: []

environments:
  dev:
    values:
      - environments/dev.yaml
  staging:
    values:
      - environments/staging.yaml
  production:
    values:
      - environments/production.yaml

---

releases:
  - name: user-service
    namespace: octo-eshop-{{ .Environment.Name }}
    chart: ./charts/user-service
    values:
      - charts/user-service/values.yaml
      - charts/user-service/values-{{ .Environment.Name }}.yaml
    set:
      - name: image.tag
        value: {{ .Environment.Values.imageTag | default "latest" }}

  - name: product-service
    namespace: octo-eshop-{{ .Environment.Name }}
    chart: ./charts/product-service
    values:
      - charts/product-service/values.yaml
      - charts/product-service/values-{{ .Environment.Name }}.yaml
    set:
      - name: image.tag
        value: {{ .Environment.Values.imageTag | default "latest" }}

  - name: cart-service
    namespace: octo-eshop-{{ .Environment.Name }}
    chart: ./charts/cart-service
    values:
      - charts/cart-service/values.yaml
      - charts/cart-service/values-{{ .Environment.Name }}.yaml
    set:
      - name: image.tag
        value: {{ .Environment.Values.imageTag | default "latest" }}

  - name: order-service
    namespace: octo-eshop-{{ .Environment.Name }}
    chart: ./charts/order-service
    values:
      - charts/order-service/values.yaml
      - charts/order-service/values-{{ .Environment.Name }}.yaml
    set:
      - name: image.tag
        value: {{ .Environment.Values.imageTag | default "latest" }}

  - name: payment-service
    namespace: octo-eshop-{{ .Environment.Name }}
    chart: ./charts/payment-service
    values:
      - charts/payment-service/values.yaml
      - charts/payment-service/values-{{ .Environment.Name }}.yaml
    set:
      - name: image.tag
        value: {{ .Environment.Values.imageTag | default "latest" }}

  - name: frontend
    namespace: octo-eshop-{{ .Environment.Name }}
    chart: ./charts/frontend
    values:
      - charts/frontend/values.yaml
      - charts/frontend/values-{{ .Environment.Name }}.yaml
    set:
      - name: image.tag
        value: {{ .Environment.Values.imageTag | default "latest" }}
```

#### File: `helm/environments/dev.yaml`
```yaml
imageTag: "dev"
```

#### File: `helm/environments/staging.yaml`
```yaml
imageTag: "staging"
```

#### File: `helm/environments/production.yaml`
```yaml
imageTag: "v1.0.0"
```

---

### 6.6 Frontend Chart Values

#### File: `helm/charts/frontend/values.yaml`
```yaml
# Frontend-specific values

replicaCount: 2

image:
  repository: octoeshopacr.azurecr.io/frontend
  tag: "latest"
  pullPolicy: Always

service:
  type: ClusterIP
  port: 80
  targetPort: 80

ingress:
  enabled: false
  className: "azure-application-gateway"
  annotations:
    appgw.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: octo-eshop.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: octo-eshop-tls
      hosts:
        - octo-eshop.example.com

resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "128Mi"
    cpu: "100m"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5
  targetCPUUtilizationPercentage: 70

livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 5
  periodSeconds: 5

# Nginx needs writable directories
extraVolumes:
  - name: cache
    emptyDir: {}
  - name: run
    emptyDir: {}

extraVolumeMounts:
  - name: cache
    mountPath: /var/cache/nginx
  - name: run
    mountPath: /var/run
```

---

### 6.7 Network Policies Chart

#### File: `helm/charts/network-policies/templates/default-deny.yaml`
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: {{ .Release.Namespace }}
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

#### File: `helm/charts/network-policies/templates/allow-internal.yaml`
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-internal-communication
  namespace: {{ .Release.Namespace }}
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/part-of: octo-eshop
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/part-of: octo-eshop
  egress:
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/part-of: octo-eshop
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

---

## Deployment Commands

### Individual Service Deployment

```bash
# Deploy user-service to dev
helm upgrade --install user-service ./helm/charts/user-service \
  --namespace octo-eshop-dev \
  --create-namespace \
  -f ./helm/charts/user-service/values.yaml \
  -f ./helm/charts/user-service/values-dev.yaml

# Deploy with specific image tag
helm upgrade --install user-service ./helm/charts/user-service \
  --namespace octo-eshop-dev \
  --set image.tag=abc123

# Dry run to see generated manifests
helm template user-service ./helm/charts/user-service \
  -f ./helm/charts/user-service/values-dev.yaml
```

### Multi-Service Deployment with Helmfile

```bash
# Install helmfile
brew install helmfile  # macOS
# or
curl -L https://github.com/helmfile/helmfile/releases/download/v0.159.0/helmfile_0.159.0_linux_amd64.tar.gz | tar xz

# Deploy all services to dev
cd helm
helmfile -e dev sync

# Deploy all services to staging
helmfile -e staging sync

# Deploy all services to production
helmfile -e production sync

# Diff before applying
helmfile -e dev diff

# Destroy all releases
helmfile -e dev destroy
```

### Useful Helm Commands

```bash
# List releases
helm list -n octo-eshop-dev

# Get release status
helm status user-service -n octo-eshop-dev

# Get release history
helm history user-service -n octo-eshop-dev

# Rollback to previous release
helm rollback user-service -n octo-eshop-dev

# Rollback to specific revision
helm rollback user-service 2 -n octo-eshop-dev

# Uninstall release
helm uninstall user-service -n octo-eshop-dev

# Lint chart
helm lint ./helm/charts/user-service

# Package chart
helm package ./helm/charts/user-service

# Test chart rendering
helm template user-service ./helm/charts/user-service --debug
```

---

## Chart Testing

#### File: `helm/charts/user-service/templates/tests/test-connection.yaml`
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "user-service.fullname" . }}-test-connection"
  labels:
    {{- include "user-service.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
spec:
  containers:
    - name: wget
      image: busybox
      command: ['wget']
      args: ['{{ include "user-service.fullname" . }}:{{ .Values.service.port }}/health']
  restartPolicy: Never
```

```bash
# Run chart tests
helm test user-service -n octo-eshop-dev
```

---

## Deliverables Checklist

- [ ] Helm chart for user-service with all templates
- [ ] Helm chart for product-service
- [ ] Helm chart for cart-service
- [ ] Helm chart for order-service
- [ ] Helm chart for payment-service
- [ ] Helm chart for frontend
- [ ] Helm chart for network-policies
- [ ] Environment-specific values files (dev, staging, production)
- [ ] Helmfile for multi-service deployment
- [ ] Chart tests for all services
- [ ] All charts pass `helm lint`
- [ ] All charts pass `helm template` rendering
- [ ] Documentation for deployment commands

---

## Dependencies

**Depends on:**
- Phase 5: Docker images

**Required by:**
- Phase 7: Azure infrastructure (AKS cluster)
- Phase 8: CI/CD pipeline (deployment commands updated)
