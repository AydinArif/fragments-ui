# Use lightweight Node.js image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first (to leverage Docker caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose Parcel dev server port
EXPOSE 1234

# Run the development server
CMD ["npm", "start"]
