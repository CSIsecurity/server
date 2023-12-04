FROM node:20.9.0-alpine
WORKDIR /app
COPY . .
RUN npm install


EXPOSE 4000
CMD ["node", "src/routes/f29C.js"]