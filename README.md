# WindSurf Analytics

A powerful web application for managing and displaying Power BI dashboards with role-based access control.

## Features

- **User Authentication**: Secure login and registration system
- **Role-Based Access Control**: Different dashboards for different user roles
- **Power BI Integration**: Seamless embedding of Power BI reports
- **Responsive Design**: Works on desktop and mobile devices
- **Admin Dashboard**: Manage users and reports

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- MongoDB (v4.4 or later)
- Power BI account (for report embedding)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/windsurf-analytics.git
   cd windsurf-analytics
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/windsurf-analytics
   SESSION_SECRET=your-session-secret
   NODE_ENV=development
   ```

4. Build the CSS (run this in a separate terminal):
   ```bash
   npm run build:css
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port to run the server on | 3000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/windsurf-analytics |
| SESSION_SECRET | Secret for session encryption | (required) |
| NODE_ENV | Application environment (development/production) | development |

## Available Scripts

- `npm start`: Start the production server
- `npm run dev`: Start the development server with nodemon
- `npm run build:css`: Build the Tailwind CSS file
- `npm run watch:css`: Watch for CSS changes and rebuild

## Project Structure

```
windsurf-analytics/
├── config/               # Configuration files
├── middleware/           # Express middleware
│   └── auth.js           # Authentication middleware
├── models/               # Mongoose models
│   └── User.js           # User model
├── public/               # Static files
│   ├── css/              # Compiled CSS
│   ├── js/               # Client-side JavaScript
│   └── images/           # Image assets
├── routes/               # Route handlers
│   ├── auth.js           # Authentication routes
│   ├── dashboard.js      # Dashboard routes
│   └── index.js          # Main routes
├── views/                # EJS templates
│   ├── auth/             # Authentication views
│   ├── dashboard/        # Dashboard views
│   ├── layouts/          # Layout templates
│   ├── about.ejs         # About page
│   ├── error.ejs         # Error page
│   └── index.ejs         # Home page
├── .env.example          # Example environment variables
├── app.js                # Express application setup
├── package.json          # Project dependencies
└── README.md             # This file
```

## Security Considerations

- Always use HTTPS in production
- Keep your `.env` file secure and never commit it to version control
- Use strong session secrets
- Implement rate limiting for authentication endpoints
- Keep dependencies up to date

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [Passport.js](http://www.passportjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Power BI Embedded](https://powerbi.microsoft.com/en-us/power-bi-embedded/)
