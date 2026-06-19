FROM node:22

WORKDIR /authentication-server

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "start"]