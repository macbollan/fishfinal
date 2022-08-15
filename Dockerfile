FROM node:14
RUN mkdir -p /src/user/app
WORKDIR /src/user/app
COPY package*json ./
copy . .
RUN npm install
CMD ["node","fisheriestrust.js"]