# Phase 9: Observability & Security

## Overview
Configure comprehensive monitoring, logging, alerting, and security measures for the production environment.

## Prerequisites
- Phase 7 completed (Azure infrastructure with monitoring resources)
- Phase 8 completed (CI/CD pipeline)
- Services deployed to AKS

---

## Tasks

### 9.1 Centralized Logging

**Objective:** Set up centralized logging with Azure Log Analytics and structured logging in services.

#### File: `services/user-service/src/utils/logger.ts`
```typescript
import { createLogger, format, transports } from 'winston';
import { ApplicationInsights } from '@azure/monitor-opentelemetry';

const { combine, timestamp, json, errors } = format;

// Initialize Azure Application Insights
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  ApplicationInsights.setup({
    azureMonitorExporterOptions: {
      connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    },
  });
}

interface LogContext {
  service: string;
  environment: string;
  version: string;
  correlationId?: string;
  userId?: string;
  [key: string]: unknown;
}

const defaultContext: LogContext = {
  service: process.env.SERVICE_NAME || 'unknown',
  environment: process.env.NODE_ENV || 'development',
  version: process.env.APP_VERSION || '0.0.0',
};

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: defaultContext,
  transports: [
    new transports.Console({
      format: process.env.NODE_ENV === 'development'
        ? format.combine(format.colorize(), format.simple())
        : format.json(),
    }),
  ],
});

// Structured logging helpers
export const logRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: Partial<LogContext>
): void => {
  logger.info('HTTP Request', {
    ...context,
    http: {
      method,
      path,
      statusCode,
      duration,
    },
  });
};

export const logError = (
  error: Error,
  context?: Partial<LogContext>
): void => {
  logger.error('Error occurred', {
    ...context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  });
};

export const logBusinessEvent = (
  event: string,
  data: Record<string, unknown>,
  context?: Partial<LogContext>
): void => {
  logger.info('Business Event', {
    ...context,
    event,
    data,
  });
};
```

#### File: `services/user-service/src/middleware/requestLogger.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      startTime: number;
    }
  }
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate or extract correlation ID
  req.correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  req.startTime = Date.now();

  // Add correlation ID to response headers
  res.setHeader('x-correlation-id', req.correlationId);

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    logRequest(req.method, req.path, res.statusCode, duration, {
      correlationId: req.correlationId,
      userId: req.user?.userId,
    });
  });

  next();
};
```

---

### 9.2 Metrics and Monitoring

**Objective:** Expose Prometheus metrics and configure Azure Monitor dashboards.

#### File: `services/user-service/src/metrics/index.ts`
```typescript
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export const databaseQueryDuration = new client.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// Business metrics
export const userRegistrations = new client.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  registers: [register],
});

export const loginAttempts = new client.Counter({
  name: 'login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status'],
  registers: [register],
});

// Export registry for /metrics endpoint
export { register };
```

#### File: `services/user-service/src/routes/metricsRoutes.ts`
```typescript
import { Router, Request, Response } from 'express';
import { register } from '../metrics';

const router = Router();

router.get('/metrics', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export { router as metricsRoutes };
```

---

### 9.3 Azure Monitor Dashboard

#### File: `infrastructure/terraform/modules/monitoring/dashboard.tf`
```hcl
resource "azurerm_portal_dashboard" "main" {
  name                = "${var.project_name}-${var.environment}-dashboard"
  resource_group_name = var.resource_group_name
  location            = var.location

  dashboard_properties = jsonencode({
    lenses = {
      "0" = {
        order = 0
        parts = {
          "0" = {
            position = {
              x      = 0
              y      = 0
              rowSpan = 4
              colSpan = 6
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              inputs = [
                {
                  name  = "resourceType"
                  value = "Microsoft.ContainerService/managedClusters"
                },
                {
                  name  = "metricName"
                  value = "node_cpu_usage_percentage"
                }
              ]
            }
          }
          "1" = {
            position = {
              x      = 6
              y      = 0
              rowSpan = 4
              colSpan = 6
            }
            metadata = {
              type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
              inputs = [
                {
                  name  = "resourceType"
                  value = "Microsoft.ContainerService/managedClusters"
                },
                {
                  name  = "metricName"
                  value = "node_memory_rss_percentage"
                }
              ]
            }
          }
        }
      }
    }
  })

  tags = var.tags
}
```

---

### 9.4 Alerting Configuration

#### File: `infrastructure/terraform/modules/monitoring/alerts.tf`
```hcl
# High CPU Alert
resource "azurerm_monitor_metric_alert" "high_cpu" {
  name                = "${var.project_name}-${var.environment}-high-cpu"
  resource_group_name = var.resource_group_name
  scopes              = [var.aks_cluster_id]
  description         = "Alert when CPU usage exceeds 80%"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_cpu_usage_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# High Memory Alert
resource "azurerm_monitor_metric_alert" "high_memory" {
  name                = "${var.project_name}-${var.environment}-high-memory"
  resource_group_name = var.resource_group_name
  scopes              = [var.aks_cluster_id]
  description         = "Alert when memory usage exceeds 80%"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_memory_rss_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Pod Restart Alert
resource "azurerm_monitor_scheduled_query_rules_alert_v2" "pod_restarts" {
  name                = "${var.project_name}-${var.environment}-pod-restarts"
  resource_group_name = var.resource_group_name
  location            = var.location
  scopes              = [azurerm_log_analytics_workspace.main.id]
  description         = "Alert when pods restart frequently"
  severity            = 3
  
  evaluation_frequency = "PT5M"
  window_duration      = "PT15M"

  criteria {
    query = <<-QUERY
      KubePodInventory
      | where TimeGenerated > ago(15m)
      | where Namespace startswith "octo-eshop"
      | summarize RestartCount = sum(PodRestartCount) by PodName
      | where RestartCount > 3
    QUERY
    
    time_aggregation_method = "Count"
    operator                = "GreaterThan"
    threshold               = 0
    
    failing_periods {
      minimum_failing_periods_to_trigger_alert = 1
      number_of_evaluation_periods             = 1
    }
  }

  action {
    action_groups = [azurerm_monitor_action_group.main.id]
  }

  tags = var.tags
}

# HTTP 5xx Errors Alert
resource "azurerm_monitor_scheduled_query_rules_alert_v2" "http_errors" {
  name                = "${var.project_name}-${var.environment}-http-5xx"
  resource_group_name = var.resource_group_name
  location            = var.location
  scopes              = [azurerm_application_insights.main.id]
  description         = "Alert when HTTP 5xx errors exceed threshold"
  severity            = 2
  
  evaluation_frequency = "PT5M"
  window_duration      = "PT15M"

  criteria {
    query = <<-QUERY
      requests
      | where timestamp > ago(15m)
      | where resultCode startswith "5"
      | summarize ErrorCount = count() by bin(timestamp, 5m)
      | where ErrorCount > 10
    QUERY
    
    time_aggregation_method = "Count"
    operator                = "GreaterThan"
    threshold               = 0
    
    failing_periods {
      minimum_failing_periods_to_trigger_alert = 1
      number_of_evaluation_periods             = 1
    }
  }

  action {
    action_groups = [azurerm_monitor_action_group.main.id]
  }

  tags = var.tags
}
```

---

### 9.5 Security Configuration

#### Network Policies

#### File: `kubernetes/base/network-policies/default-deny.yaml`
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: octo-eshop
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-ingress
  namespace: octo-eshop
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 80
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-service-communication
  namespace: octo-eshop
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/component: backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/part-of: octo-eshop
      ports:
        - protocol: TCP
          port: 3000
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

#### Pod Security Policy

#### File: `kubernetes/base/security/pod-security.yaml`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: octo-eshop
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: v1.28
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

---

### 9.6 API Rate Limiting

#### File: `services/user-service/src/middleware/rateLimiter.ts`
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// General API rate limiter
export const apiRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  },
});

// Strict rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 failed attempts per hour
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return `auth:${req.ip}:${req.body?.email || 'unknown'}`;
  },
});
```

---

### 9.7 Security Headers Middleware

#### File: `services/user-service/src/middleware/security.ts`
```typescript
import helmet from 'helmet';
import { Express } from 'express';

export const configureSecurityHeaders = (app: Express): void => {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-site' },
      dnsPrefetchControl: true,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    })
  );
};
```

---

### 9.8 Secrets Management with External Secrets

#### File: `kubernetes/base/external-secrets/secret-store.yaml`
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: azure-keyvault
spec:
  provider:
    azurekv:
      authType: WorkloadIdentity
      vaultUrl: "https://octoeshop-keyvault.vault.azure.net"
      serviceAccountRef:
        name: octo-eshop-sa
        namespace: octo-eshop
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: user-service-secrets
  namespace: octo-eshop
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: azure-keyvault
  target:
    name: user-service-secrets
    creationPolicy: Owner
  data:
    - secretKey: database-url
      remoteRef:
        key: user-db-connection-string
    - secretKey: jwt-secret
      remoteRef:
        key: jwt-secret
```

---

## Deliverables Checklist

### Logging
- [ ] Structured JSON logging in all services
- [ ] Correlation ID propagation
- [ ] Request/response logging middleware
- [ ] Error logging with stack traces
- [ ] Business event logging

### Metrics
- [ ] Prometheus metrics endpoint in all services
- [ ] HTTP request duration histogram
- [ ] Request count by status code
- [ ] Custom business metrics
- [ ] Database query duration metrics

### Monitoring
- [ ] Azure Monitor dashboard
- [ ] Application Insights integration
- [ ] Container Insights enabled on AKS

### Alerting
- [ ] High CPU alert
- [ ] High memory alert
- [ ] Pod restart alert
- [ ] HTTP 5xx errors alert
- [ ] Database connection alerts

### Security
- [ ] Network policies configured
- [ ] Pod security standards enforced
- [ ] Rate limiting on all endpoints
- [ ] Auth rate limiting
- [ ] Security headers (helmet)
- [ ] External Secrets Operator for Key Vault
- [ ] RBAC configured for service accounts

---

## Dependencies

**Depends on:**
- Phase 7: Azure infrastructure (monitoring resources)
- Phase 8: CI/CD pipeline (deployed services)

**Required by:**
- Phase 10: Documentation
