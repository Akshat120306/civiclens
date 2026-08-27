FROM node:20-alpine

WORKDIR /app

# Copy root and workspaces
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm --prefix backend install
RUN npm --prefix frontend install

# Copy source files
COPY . .

# Build frontend and seed initial database
RUN npm --prefix frontend run build
RUN npm --prefix backend run seed

# Expose port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production
ENV DEMO_MODE=true

# Start full-stack server
CMD ["node", "backend/src/server.js"]
