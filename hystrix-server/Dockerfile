FROM node:6.9.1-slim

WORKDIR /code

COPY package.json /code/package.json
RUN npm install && npm ls
RUN mv /code/node_modules /node_modules

COPY . /code
EXPOSE 8080 80

ENTRYPOINT ["node", "index.js"]