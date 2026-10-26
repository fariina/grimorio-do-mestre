FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=10000 DATA_DIR=/var/data
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force && mkdir -p /var/data/backups && chown -R node:node /var/data
COPY --chown=node:node lib ./lib
COPY --chown=node:node public ./public
COPY --chown=node:node docs ./docs
COPY --chown=node:node reference/inventory.json reference/documents.json reference/translations-pt-br.json ./reference/
COPY --chown=node:node server.mjs README.md LICENSE ./
USER node
EXPOSE 10000
VOLUME ["/var/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
