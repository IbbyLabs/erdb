FROM node:20-alpine

WORKDIR /app

# System deps (git for cloning, fonts for rendering)
RUN apk add --no-cache git fontconfig ttf-dejavu ttf-freefont font-noto

# Fetch the app source
RUN git clone https://github.com/realbestia1/erdb.git .

# Install deps and build
RUN npm ci
RUN npm run build

# Runtime config
ENV NODE_ENV=production
ENV PORT=7860

# Persist cache/db (HF persistent storage can be mounted at /data if enabled)
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 7860
CMD ["sh", "-c", "npm run start -- -p ${PORT:-7860}"]
