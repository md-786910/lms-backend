FROM node:22-alpine

# Set the working directory
WORKDIR /usr/src/app

RUN apk add chromium  tzdata curl

# Copy package.json and package-lock.json
COPY ./src/package.json /usr/src/app
COPY ./src/package-lock.json /usr/src/app
COPY ./src/pm2.config.js /usr/src/app


# Install dependencies
RUN npm ci
RUN npm install -g nodemon pm2
# Copy the rest of the application code

# permission to access the files with chown

COPY --chown=node ./entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh

#  Copy the rest of the application code
COPY --chown=node:node . /usr/src/app

ENTRYPOINT ["/usr/bin/entrypoint.sh"]