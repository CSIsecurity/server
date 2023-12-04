FROM node:18.19.0
WORKDIR /app
COPY . .
RUN npm install

EXPOSE 4000
CMD ["node", "./src/routes/f29C.js"]
