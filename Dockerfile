# -----------------------------
# Stage 1 – Build the static site
# -----------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy only the package files first to leverage layer caching
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci

# Copy the rest of the app and build the optimized static files
COPY . .
RUN npm run build

# -----------------------------
# Stage 2 – Production server
# -----------------------------
FROM nginx:alpine

# Copy the optimized build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 and use NGINX to serve
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]