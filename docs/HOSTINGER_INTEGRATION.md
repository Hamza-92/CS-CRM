# Hostinger integration

Hostinger is connected only to the CRM. CounterPOS must never receive the Hostinger API token.

## Configuration

Create an API token in hPanel under **Profile → API**, then configure these values only on the CRM server:

```dotenv
HOSTINGER_API_URL=https://developers.hostinger.com
HOSTINGER_API_TOKEN=replace-with-your-hpanel-api-token
HOSTINGER_ACCOUNT_USERNAME=u123456789
HOSTINGER_HOSTING_ORDER_ID=123456789
HOSTINGER_PARENT_DOMAIN=counterpos.pk
HOSTINGER_SUBDOMAIN_DIRECTORY=public
HOSTINGER_DATABASE_HOST=your-hostinger-database-host
HOSTINGER_DATABASE_PORT=3306
HOSTINGER_DATABASE_REMOTE_IP=your-counterpos-server-public-ip
HOSTINGER_API_CONNECT_TIMEOUT=5
HOSTINGER_API_TIMEOUT=20
```

Do not commit the token. It inherits the permissions of the Hostinger account that created it.

Verify the connection with a read-only request:

```bash
php artisan hostinger:check
```

The command lists the accessible hosting accounts and order IDs, then verifies the configured default account, order, and database endpoint. It does not create, update, or delete a Hostinger resource.

## Implemented client operations

`HostingerClient` supports:

- listing accessible websites and discovering their hosting account username and order ID;
- creating a website on a selected hosting order;
- listing and creating databases for a hosting account;
- allowing one configured CounterPOS server IP to connect to each tenant database;
- reading and updating DNS records.

Database passwords are accepted only as transient method arguments. They are sent over HTTPS to Hostinger and are not persisted by this client or written to command output.

## Provisioning boundary

The CRM will coordinate the lifecycle in this order:

1. create or reuse a subdomain under the configured parent website and point it to the CounterPOS public directory;
2. create its database with a deterministic high-entropy password that can be reproduced for safe retries without being stored;
3. register the primary tenant domain in CounterPOS;
4. send the domain and database connection details through the signed CounterPOS API;
5. test the database, migrate it, seed the selected product template, and activate the tenant.

Destructive Hostinger operations are intentionally absent from the first connector. They can be added later with explicit workflow confirmation and audit records.