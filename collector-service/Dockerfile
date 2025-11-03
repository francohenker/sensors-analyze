FROM node:20-alpine
WORKDIR /app
COPY collector_service.js .
RUN npm install express node-fetch@2
EXPOSE 5002
CMD ["node", "collector_service.js"]
