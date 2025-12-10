# Use Node.js as the base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if present)
COPY package.json pnpm-lock.yaml scripts ./

# Install make and bash
RUN apk add --no-cache make bash

# Install development dependencies
RUN npm install -g pnpm@10.4.1

# Install the dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the NestJS source code
COPY . .

# Run the migration command instead of starting the app in development mode
CMD ["pnpm", "migration:run:all"]