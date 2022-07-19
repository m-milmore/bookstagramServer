# Bookstagram API

> Backend API for Bookstagram Project, which is a archive of image of books with their title.

## Usage

Rename "config/config.env.env" to "config/config.env" and update the values/settings to your own.

## Install dependencies
```
npm install
```

## Run App
```
# Run in dev mode
npm run dev

# Run in prod mode
npm start
```

## Database Seeder

To seed the database with books and users with data "_data" folder, run:
```
# Destroy all data
node seeder -d

# Import all data
node seeder -i
```

- Version: 1.0.0
- License: MIT