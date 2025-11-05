# Audiophile E-commerce

A modern, responsive e-commerce website for high-end audio equipment, built with Next.js, TypeScript, and Convex. Features a seamless shopping experience with product browsing, cart management, secure checkout, and transactional email confirmations.

## Features

- **Product Catalog**: Browse headphones, speakers, and earphones with detailed product pages
- **Shopping Cart**: Add/remove items, update quantities, persistent cart state
- **Secure Checkout**: Form validation, payment processing, order confirmation
- **Order Management**: Track orders with Convex database integration
- **Email Notifications**: Automated confirmation emails with Resend
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices


## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **Backend**: Convex (serverless database and functions)
- **Email Service**: Resend (transactional emails)
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: React Context (cart)

## Prerequisites

- Node.js 18+
- npm or yarn
- Convex account
- Resend account

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/heisemmanuell/audiophile-eshop.git
   cd audiophile-eshop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Convex
   NEXT_PUBLIC_CONVEX_URL=your_convex_url

   # Resend
   RESEND_API_KEY=your_resend_api_key

   # Email Configuration
   FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Convex Setup**
   ```bash
   npx convex dev --once
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment on vercel

1. **Connect Repository**
   - Link your GitHub repository to Render
   - Set build command: `npm run build`
   - Set start command: `npm start`

2. **Environment Variables**
   Add the following environment variables in Render dashboard:
   ```
   NEXT_PUBLIC_CONVEX_URL
   RESEND_API_KEY
   FROM_EMAIL
   ```

3. **Convex Deployment**
   ```bash
   npx convex deploy
   ```

4. **Database Setup**
   Ensure your Convex database is properly configured and deployed.

## Email Configuration

The app uses Resend for sending transactional emails. 

Key email features:
- Order confirmation with customer details
- Order summary and shipping information
- Support contact information
- Responsive HTML templates
