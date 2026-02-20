

# Add shir@keren-hador.com as Admin

Two changes needed:

### 1. Add to allowed users whitelist
Insert `shir@keren-hador.com` into the `allowed_users` table so she can log in.

### 2. Update the auto-role trigger
The `handle_new_user()` database function has a hardcoded list of admin emails. When a new user signs in for the first time, this function checks the list and assigns either `admin` or `viewer`. We need to add `shir@keren-hador.com` to this list so she automatically gets the `admin` role on first login.

```text
Current admin list:
  - jkenigsberger@gmail.com
  - adi@keren-hador.com
  - gali@keren-hador.com
  - danielle@keren-hador.com
  - shahaf@glow-glamping.com
  - shelly@glow-glamping.com

Updated list adds:
  + shir@keren-hador.com
```

### Technical steps
- **Database data insert**: `INSERT INTO allowed_users (email) VALUES ('shir@keren-hador.com')`
- **Database migration**: Update `handle_new_user()` function to include `'shir@keren-hador.com'` in the admin email list
- No code changes needed

