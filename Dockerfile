FROM node:20.9.0-alpine
WORKDIR /src
COPY . .
RUN npm install

EXPOSE 4000
CMD ["node", "routes/f29C.js"]
