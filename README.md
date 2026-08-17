# Demo ECommerce Website By Next.js 15 & MongoDB

|                |                            |
| -------------- | -------------------------- |
| Framework      | Next.js 15, React 19       |
| UI             | Tailwind, Shadcn, Recharts |
| Database       | MongoDB, Mongoose          |
| Payment        | PayPal                     |
| Authentication | Auth.js, Google Auth       |
| Testing        | Playwright                 |
| Others         | Resend, Zod                |

## Run Locally

1. Clone repo

```sh
$ git clone git@github.com:patfranciso/amaxon-demo.git
$ cd amaxon-demo
```

2. Create Env File

- duplicate .example-env and rename it to .env.local

3. Setup MongoDB

- Cloud MongoDB
  - Create database at https://mongodb.com/
  - In .env.local file update MONGODB_URI to db url
- OR Local MongoDB
  - Install it from https://www.MongoDB.org/download
  - In .env.local file update MONGODB_URI to db url

4. Seed Data

```sh
  npm run seed
```

5. Install and Run

```sh
  npm install --legacy-peer-deps
  npm run dev
```

6. Admin Login

- Open http://localhost:3001
- Click Sign In button
- Enter admin email "admin@example.com" and password "123456" and click Sign In

## Testing with Playwright

setup mongodb as above
run the app

```sh
npm run dev
# or
npm run build
npm run start
```

Then run tests with

```sh
$ npm run e2e
```

## Feature Summary

**Core E-Commerce Functionality**

- Built a full e-commerce platform with home page carousels, product sliders, "Today's Deals", and best-selling products.
- Implemented product listing, product detail pages, search with filtering/sorting, and category sidebar/drawer navigation.
- Added browsing history functionality.
- Implemented cart page, cart sidebar, and add-to-cart functionality.

**Checkout & Payments**

- Added checkout page with order form and summary.
- Implemented order placement and creation.
- Integrated **PayPal** payment gateway.
- Added order details page and payment status updates (`updateOrderToPaid`).

**User & Authentication**

- Implemented user registration, login, Google Sign-In, and authorization.
- Added user profile/name update functionality.
- Implemented order history with pagination.

**Reviews & Ratings**

- Added product rating and review system.
- Implemented review email notifications.

**Admin & Management**

- Built admin dashboard with reporting features.
- Implemented admin product management (create/update products).
- Added admin order management and order status updates.
- Implemented admin user management and user editing.
- Added admin web pages management and public web page display.
- Implemented site settings page with multilingual support and theme/color customization.

**Testing**

- Set up **Playwright**.
- Added comprehensive E2E tests covering:
  - Product discovery & browsing
  - Product details
  - Cart and checkout
  - Admin dashboard and management
  - Mobile testing scenarios

## Contact Developer

Email: patfranciso@gmail.com
