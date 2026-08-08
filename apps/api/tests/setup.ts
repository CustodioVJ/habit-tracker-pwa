import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the API package's .env file before any
// module (including the Prisma client) is imported.
dotenv.config({ path: path.resolve(__dirname, '../.env') });
