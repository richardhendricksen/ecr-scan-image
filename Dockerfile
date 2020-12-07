FROM node:12-alpine

COPY package.json /
WORKDIR /
RUN yarn install && yarn cache clean --all

# copy source code
COPY LICENSE.txt README.md pipe.yml /
COPY pipe /

ENTRYPOINT ["node", "/index.js"]
