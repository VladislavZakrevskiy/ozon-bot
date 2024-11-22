FROM node:21

WORKDIR /app

COPY ./package.json ./package.json

RUN npm install 

COPY ./src ./src

COPY ./prisma ./prisma

COPY ./scripts ./scripts

COPY /.env ./.env

COPY ./tsconfig.json ./tsconfig.json

RUN npm rebuild bcrypt --build-from-source

RUN npx prisma generate

RUN npm run build 

CMD ["npm", "run", "start:prod"]

EXPOSE 3000
