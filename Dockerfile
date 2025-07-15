FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY ./package.json /app/
COPY ./package-lock.json /app/


# Install dependencies
RUN npm install 
RUN npm install ci -g nodemon pm2
# Copy the rest of the application code

# permission to access the files with chown

COPY --chown=node ./entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh


ENTRYPOINT ["tail", "-f", "/dev/null"]  