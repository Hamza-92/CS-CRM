# Hostinger integration

Hostinger is connected only to the CRM. CounterPOS must never receive the Hostinger API token.

## Configuration

Create an API token in hPanel under **Profile → API**, then configure these values only on the CRM server:

```dotenv
HOSTINGER_API_URL=https://developers.hostinger.com
HOSTINGER_API_TOKEN=replace-with-your-hpanel-api-token
HOSTINGER_ACCOUNT_USERNAME=u123456789
HOSTINGER_HOSTING_ORDER_ID=123456789
HOSTINGER_DATABASE_HOST=your-hostinger-database-host
HOSTINGER_DATABASE_PORT=3306
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
- reading and updating DNS records.

Database passwords are accepted only as transient method arguments. They are sent over HTTPS to Hostinger and are not persisted by this client or written to command output.

## Provisioning boundary

The CRM will coordinate the lifecycle in this order:

1. create or select the Hostinger website and hosting account;
2. create its database and retain the generated password only long enough to configure CounterPOS;
3. configure DNS and wait for the domain to resolve;
4. send the domain and database connection details through the signed CounterPOS API;
5. test the database, migrate it, seed the selected product template, and activate the tenant.

Destructive Hostinger operations are intentionally absent from the first connector. They can be added later with explicit workflow confirmation and audit records.