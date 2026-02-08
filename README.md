This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Self-hosting
First, clone the repository:

```bash
git clone https://github.com/WarFiN123/webhook-multitool && cd webhook-multitool
```

Then, install all dependencies:

```bash
bun install
```

## Running the development server (if you are editing the source code and want to see the changes real-time)

```bash
bun run dev
```

## Production Build (if you want to publish the site)

Building:
```bash
bun run build
```

Running:
```bash
bun run start
```

# Deploy to Cloudflare Pages

### 1. Connect Git

Go to **Workers & Pages** > **Create application** > **Pages** and connect your Git repository.

### 2. Build Settings

Select **Next.js** as the framework preset. Ensure these values are set:

* **Build command:**
  ```bash
  bunx @cloudflare/next-on-pages@1
  ```

* **Build output directory:**
  ```bash
  .vercel/output/static
  ```

### 3. Environment Variables

Under **Environment variables (advanced)**, add:
  
|Variable Name| Value
|-------|-------|
|NODE_VERSION| 20

**Deploy**
### 4. Enable Compatibility (Crucial)

After the first deployment starts/fails:

1. Go to **Settings** > **Runtime**.

2. In **Compatibility flags**, add:
   ```bash
   nodejs_compat
   ```

4. Go to **Deployments** and click **Retry deployment**.
   
## Similar Projects

- [koalahook](https://github.com/infamouskoala/koalahook) by [infamouskoala](https://github.com/infamouskoala)
