FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY dist/ ./dist/

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "dist/index.cjs"]