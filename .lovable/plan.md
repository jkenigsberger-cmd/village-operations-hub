

# Add 3 New Admin Users

Adding the following emails as admin users:
- liza@kerenhador.com
- omrielbm@gmail.com
- Shelly.fleischman@gmail.com

### Step 1: Whitelist all three emails
Insert each email into the `allowed_users` table so they can log in.

### Step 2: Update the auto-role trigger
Add all three emails to the hardcoded admin list in the `handle_new_user()` database function so they automatically receive the `admin` role on first sign-in.

```text
Current admin list:
  - jkenigsberger@gmail.com
  - adi@keren-hador.com
  - gali@keren-hador.com
  - danielle@keren-hador.com
  - shahaf@glow-glamping.com
  - shelly@glow-glamping.com
  - shir@keren-hador.com

Adding:
  + liza@kerenhador.com
  + omrielbm@gmail.com
  + shelly.fleischman@gmail.com
```

### Technical steps
- **Database inserts**: 3 rows into `allowed_users`
- **Database migration**: Update `handle_new_user()` function to include all 3 new emails in the admin list
- No code changes needed

