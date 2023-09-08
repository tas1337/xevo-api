# Use official Node.js image
FROM node:14

# Create working directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
COPY package-lock.json .
RUN npm install

# Bundle app source
COPY . .

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]