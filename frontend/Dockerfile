# Base image with Node.js
FROM node:20-alpine

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies using npm
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the Vite dev server port
EXPOSE 3000

# Start the development server with host 0.0.0.0 to allow external connections
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]