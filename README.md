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

# Depoy To CloudFlare
  1. Go to CloudFlare page and strart from "Import an existing Git repository"
     
  3. Select this **Repository & Next**:
     
     **Project Name**: <Optional>
     
     **Production branch**: main

     
     *Build settings*
     
     Framework preset: `Next.js`
     
       Build command(Will be automatically entered): `npx @cloudflare/next-on-pages@1`
     
       Build output directory(Will be automatically entered): /`.vercel/output/static`

     
     Environment variables (advanced)
     
       Add Variable
     ̉
         Variable Name: `NODE_VERSION` = Value: `20`
     ̉
    Click **Depoy**
̉
    After depoy you need go to *Project Settings* and find *Runtime/Compatibility flags* and add `nodejs_compat`
Then, go to Deployments and **Retry deployments**.
 
## Similar Projects

- [koalahook](https://github.com/infamouskoala/koalahook) by [infamouskoala](https://github.com/infamouskoala)
