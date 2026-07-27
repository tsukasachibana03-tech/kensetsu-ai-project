FROM node:22-alpine

WORKDIR /srv
COPY postgres-handoff/api/package.json ./
RUN npm install --omit=dev

COPY postgres-handoff/api/server.mjs ./server.mjs
COPY index.html app.js styles.css company_stamp.png ./
COPY pdf.min.mjs pdf.worker.min.mjs tesseract-worker.min.js tesseract.min.js ./
RUN mkdir -p /srv/app \
  && mv /srv/index.html /srv/app/ \
  && mv /srv/app.js /srv/app/ \
  && mv /srv/styles.css /srv/app/ \
  && mv /srv/company_stamp.png /srv/app/ \
  && mv /srv/pdf.min.mjs /srv/app/ \
  && mv /srv/pdf.worker.min.mjs /srv/app/ \
  && mv /srv/tesseract-worker.min.js /srv/app/ \
  && mv /srv/tesseract.min.js /srv/app/

EXPOSE 8766
CMD ["node", "server.mjs"]
