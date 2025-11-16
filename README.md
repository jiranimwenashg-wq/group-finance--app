# FinanceFlow AI

Effortlessly manage your community group's finances with AI-powered tools.

## About The Project

FinanceFlow AI is a comprehensive web application designed to simplify financial management for community groups, such as chamas or savings clubs. Built with a modern tech stack, it automates tedious tasks, provides clear financial overviews, and enhances member communication, allowing you to focus on what truly matters—your group's goals.

From AI-powered bookkeeping that understands M-Pesa messages to an interactive constitution assistant, this application is your all-in-one solution for transparent and efficient group finance management.

## Key Features

-   **Instant Financial Dashboard**: Get a real-time snapshot of your group's financial health. Track income, monitor expenses, and visualize progress with beautiful charts.
-   **AI-Powered Bookkeeping**: Paste an M-Pesa SMS and our AI instantly parses it into a structured, categorized transaction record.
-   **Easy Member Management**: Keep your member list organized and up-to-date. Add new members individually or import your entire list in seconds with our simple CSV tool.
-   **Insurance Premium Tracking**: Create custom policies and tick off payments month by month, ensuring every member is covered.
-   **AI Constitution Assistant**: Upload your group's constitution and ask questions in plain English to get instant, accurate answers from our AI.
-   **Automated Savings Schedule**: Generate a fair, randomized "merry-go-round" savings schedule with a single click.
-   **WhatsApp Export**: Easily format and export transaction summaries to share with your group members on WhatsApp.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore, Authentication)
-   **Generative AI**: [Genkit](https://firebase.google.com/docs/genkit) with Google's Gemini models

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18 or later)
-   npm

### Installation

1.  Clone the repository (or have it set up in your local environment).
2.  Install NPM packages.
    ```sh
    npm install
    ```
3.  Set up your environment variables. Create a `.env` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```
4.  Ensure your Firebase project is configured correctly in `src/firebase/config.ts`.

### Running the Application

To run the application in development mode:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Available Scripts

In the project directory, you can run:

-   `npm run dev`: Runs the app in development mode.
-   `npm run build`: Builds the app for production.
-   `npm run start`: Starts a production server.
-   `npm run lint`: Lints the project files.
-   `npm run genkit:dev`: Starts the Genkit development server for AI flows.
