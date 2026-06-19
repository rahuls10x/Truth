# Build Stage

FROM node:22

WORKDIR /frontend-server

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production Stage

FROM nginx:alpine

COPY --from=0 /frontend-server/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD [ "nginx", "-g", "daemon off;" ]