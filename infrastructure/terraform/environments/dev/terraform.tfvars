project_name = "octoeshop"
environment  = "dev"
location     = "swedencentral"
alert_email  = ""

vnet_address_space     = ["10.0.0.0/16"]
aks_subnet_prefix      = ["10.0.1.0/24"]
database_subnet_prefix = ["10.0.2.0/24"]
redis_subnet_prefix    = ["10.0.3.0/24"]

kubernetes_version = null
aks_node_count     = 1
aks_node_vm_size   = "Standard_D2s_v3"

acr_sku = "Basic"

postgresql_sku        = "B_Standard_B1ms"
postgresql_storage_mb = 32768

redis_sku      = "Basic"
redis_family   = "C"
redis_capacity = 0

servicebus_sku = "Basic"
