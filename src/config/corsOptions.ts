import { allowedOrigins } from "./allowedOrigins";

// const corsOptions = {
//   origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
//     if (!origin || allowedOrigins.indexOf(origin) !== -1  || origin === 'null') {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   optionsSuccessStatus: 200,
// };

const corsOptions = {
  origin: true, // This allows all origins
  optionsSuccessStatus: 200,
};


export { corsOptions };
// This code defines CORS options for an Express.js application, allowing specific origins to access the server.