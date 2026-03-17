# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy the custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite build output to Nginx HTML root (Vite outputs to 'dist' by default)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
