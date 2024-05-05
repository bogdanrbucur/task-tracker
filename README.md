### Setup Primsa with SQLite

1. `npm install prisma --save-dev`
2. `npx prisma init --datasource-provider sqlite`
3. Configure `./prisma/schema.prisma` to setup some models
4. `npx prisma migrate dev --name init` and `npx prisma migrate --name change` for every new change
5. `npx prisma generate` to generate the client
6. `npx prisma studio` to open the studio

### Setup shadcn-ui

[Follow instructions](https://ui.shadcn.com/docs/installation/next).

### Setup authentication and authorization with Lucia and Oslo

[Follow instructions](https://www.robinwieruch.de/next-authentication/).
