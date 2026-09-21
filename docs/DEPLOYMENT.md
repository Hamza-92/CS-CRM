# CRM production deployment

A push to `main` runs PHP tests, frontend tests, TypeScript checks, and the Vite production build. If every check passes, GitHub Actions deploys the CRM to:

```text
/home/u496151366/domains/crm.counterpos.pk/public_html
```

The workflow preserves the production `.env` file and the complete `storage` directory. It uploads the tested application, production Composer dependencies, and compiled frontend assets, then runs central CRM migrations, rebuilds Laravel caches, restarts queue workers, and verifies the public URL.

## hPanel preparation

1. In **Websites → crm.counterpos.pk → PHP Configuration**, select PHP 8.3 and enable the extensions required by Laravel and MySQL.
2. In **Advanced → SSH Access**, enable SSH. Shared and cloud hosting normally use port `65002`.
3. Generate a dedicated Ed25519 deployment key on a trusted computer:

   ```bash
   ssh-keygen -t ed25519 -C "github-actions-cs-crm" -f cs-crm-deploy -N ""
   ```

4. Add the contents of `cs-crm-deploy.pub` to hPanel under **SSH Access → Add SSH key**. Keep `cs-crm-deploy` private.
5. In **File Manager**, open `/home/u496151366/domains/crm.counterpos.pk/public_html`.
6. Create `.env` from `.env.example` and set production values. At minimum configure:

   ```dotenv
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://crm.counterpos.pk
   APP_KEY=base64:generate-a-unique-key

   DB_CONNECTION=mysql
   DB_HOST=...
   DB_PORT=3306
   DB_DATABASE=...
   DB_USERNAME=...
   DB_PASSWORD=...

   QUEUE_CONNECTION=database

   COUNTERPOS_API_URL=https://admin.counterpos.pk/api/control/v1
   COUNTERPOS_API_KEY=...
   COUNTERPOS_API_SECRET=...

   HOSTINGER_API_TOKEN=...
   HOSTINGER_ACCOUNT_USERNAME=u496151366
   HOSTINGER_HOSTING_ORDER_ID=...
   HOSTINGER_PARENT_DOMAIN=counterpos.pk
   HOSTINGER_SUBDOMAIN_DIRECTORY=public
   HOSTINGER_DATABASE_HOST=...
   HOSTINGER_DATABASE_REMOTE_IP=...
   ```

   Keep the existing production `APP_KEY` if the CRM has ever encrypted production data. Never commit `.env`.

7. Ensure the CRM database exists and the `.env` database user can access it.
8. Add a custom cron job that starts an encrypted database-queue worker without overlapping another worker:

   ```bash
   flock -n /tmp/cs-crm-queue.lock /usr/bin/php /home/u496151366/domains/crm.counterpos.pk/public_html/artisan queue:work --stop-when-empty --tries=1 --timeout=900
   ```

   Run it every minute. If `flock` is unavailable, use every five minutes and verify that Hostinger does not launch a second copy while the previous command is running.

The repository includes a root `.htaccess` that internally routes web requests into Laravel's `public` directory because Hostinger web hosting keeps `public_html` as the fixed website root.

## GitHub preparation

1. Open the `Hamza-92/CS-CRM` repository.
2. Go to **Settings → Environments → New environment** and create `production`.
3. Restrict the environment deployment branch to `main`.
4. Add these environment secrets:

   - `HOSTINGER_SSH_HOST`: the Hostinger SSH hostname or server IP shown in hPanel.
   - `HOSTINGER_SSH_PORT`: normally `65002` for Hostinger web/cloud hosting.
   - `HOSTINGER_SSH_USER`: `u496151366`.
   - `HOSTINGER_SSH_PRIVATE_KEY`: the complete contents of the private `cs-crm-deploy` key.
   - `HOSTINGER_KNOWN_HOSTS`: the verified output of:

     On Windows PowerShell, use the newer OpenSSH bundled with Git for Windows:

     ```powershell
     & 'C:\Program Files\Git\usr\bin\ssh-keyscan.exe' -T 10 -p 65002 -t ed25519 109.106.254.181
     ```

     Save only the line beginning with `[109.106.254.181]:65002 ssh-ed25519` as the secret value. The Windows system `ssh-keyscan` may fail because its key-exchange support is older than Hostinger's server. Compare the SHA256 fingerprint with the server fingerprint shown by hPanel or by the first trusted SSH connection before saving it.

5. In **Settings → Branches**, protect `main`. Require pull requests and successful status checks if production changes should be reviewed before deployment.
6. Push this workflow commit to `main`, or run **Actions → Test and deploy CRM → Run workflow** for the first deployment.
7. Follow the first run in **Actions**. The workflow stops before uploading if the server `.env` is missing.
8. Open `https://crm.counterpos.pk`, sign in, and verify the dashboard and customer page.

## Deployment behavior

- Failed tests or builds do not modify production.
- `.env`, `storage`, and uploaded files are preserved.
- Only one production deployment runs at a time.
- Central CRM migrations run with `--force`.
- Tenant migrations are not run during CRM deployment. They remain explicit tenant provisioning operations.
- A failed deployment is marked failed in GitHub and attempts to leave Laravel maintenance mode.
- Rollback is performed by reverting the bad commit on `main`; the revert triggers a fresh tested deployment. Database migrations should remain backward compatible.
