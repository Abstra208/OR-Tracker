FROM node:latest

# Create the bot's directory
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

# Set environment variables
ENV DISCORD_CLIENT_ID=""
ENV DISCORD_TOKEN=""
ENV FIREBASE_API_KEY=""
ENV FIREBASE_AUTH_DOMAIN=""
ENV FIREBASE_DATABASE_URL=""
ENV FIREBASE_PROJECT_ID=""
ENV FIREBASE_STORAGE_BUCKET=""
ENV FIREBASE_MESSAGING_SENDER_ID=""
ENV FIREBASE_APP_ID=""
ENV DISCORD_GUILD_ID=""

COPY package.json /usr/src/bot
RUN npm install

COPY . /usr/src/bot

# Start the bot.
CMD ["node", "index.js"]