# Besjaar
# Build a Complete E-Commerce Website and Management System for Besjaar

Create a modern, production-ready, fully functional e-commerce website for **Besjaar**.

The main business goal is to sell Besjaar products directly to customers online while managing products, inventory, orders, customers, payments, shipping, returns, and bol.com marketplace sales from one administration system.

Do not create only a visual prototype. Build the database, authentication, workflows, validations, dashboards, business logic, customer pages, admin pages, and integrations required for a functioning e-commerce business.

---

# 1. Business overview

Besjaar sells consumer products across several categories, including:

* Lighting and flashlights
* Outdoor and camping products
* Bathroom and shower products
* Home and security products
* Electronics and accessories
* Travel accessories
* Personal-care products
* Hair-styling products
* Kitchen products
* Garden products
* Creative products
* Household accessories

The system should support products from multiple brands, including:

* Besjaar
* RYNEX
* LYNEX

Besjaar should be the primary public-facing store brand.

The website must be designed for customers in the Netherlands and Europe.

The default language should be Dutch, but the technical structure must support:

* Dutch
* English
* German

The default currency should be EUR.

---

# 2. Design requirements

Create a clean, modern, friendly and trustworthy design.

Use:

* A light background
* Clear typography
* Large product images
* Rounded cards
* Soft shadows
* Consistent spacing
* Simple icons
* Clear calls to action
* Professional product presentation
* Responsive mobile-first design

The website should feel suitable for a reliable Dutch online retailer.

The interface must work correctly on:

* Mobile phones
* Tablets
* Laptops
* Desktop computers

Create a reusable design system for:

* Buttons
* Forms
* Input fields
* Cards
* Tables
* Modals
* Alerts
* Status badges
* Navigation
* Filters
* Pagination
* Empty states
* Loading states
* Error states

Main button labels should be written in Dutch.

Examples:

* In winkelwagen
* Nu kopen
* Bekijk product
* Bestelling plaatsen
* Mijn account
* Verder winkelen

---

# 3. Public website structure

Create the following public pages:

1. Home
2. Shop
3. Product category pages
4. Brand pages
5. Product detail pages
6. Search results
7. Shopping cart
8. Checkout
9. Order confirmation
10. Customer login
11. Customer registration
12. Forgot password
13. Customer dashboard
14. Order history
15. Order details
16. Wishlist
17. Saved addresses
18. Return request
19. Contact page
20. Frequently asked questions
21. About Besjaar
22. Shipping information
23. Returns and refunds
24. Warranty information
25. Privacy policy
26. Terms and conditions
27. Cookie policy
28. Blog or buying guides
29. 404 page

---

# 4. Website navigation

Create a responsive header with:

* Besjaar logo
* Category navigation
* Search bar
* Language selector
* Account icon
* Wishlist icon
* Shopping-cart icon
* Cart item quantity
* Mobile menu

Main navigation items:

* Home
* Shop
* Verlichting
* Badkamer
* Elektronica
* Huis & Beveiliging
* Persoonlijke Verzorging
* Tuin
* Keuken
* Reizen
* Merken
* Aanbiedingen
* Contact

Create a large category menu for desktop and an accordion-style navigation menu for mobile.

---

# 5. Home page

Create a complete home page with the following sections:

## Hero section

Include:

* Main promotional heading
* Supporting text
* Primary call-to-action button
* Secondary call-to-action button
* Featured product or lifestyle image

Example heading:

“Handige producten voor huis, tuin en onderweg.”

Buttons:

* Bekijk producten
* Ontdek aanbiedingen

## Featured categories

Display visual category cards for:

* Verlichting
* Badkamer
* Elektronica
* Huis & Beveiliging
* Persoonlijke Verzorging
* Tuin
* Keuken
* Reizen

## Featured products

Display products selected by administrators.

## Bestsellers

Automatically display products with the highest completed sales.

## New products

Display recently added active products.

## Current promotions

Display products with active promotional pricing.

## Brand section

Display Besjaar, RYNEX and LYNEX brand cards.

## Trust section

Include:

* Veilig betalen
* Snelle levering
* Eenvoudig retourneren
* Klantenservice
* Betrouwbare producten

## Newsletter section

Allow customers to subscribe with their email address.

Include consent validation and unsubscribe functionality.

## Reviews section

Display approved customer reviews.

## Footer

Include:

* Shop categories
* Customer service links
* Company information
* Legal pages
* Newsletter
* Social-media links
* Payment-method icons
* Shipping-carrier icons

---

# 6. Product catalogue

Create a complete product catalogue system.

Each product must support:

* Product name
* Short product name
* Slug
* Internal product ID
* Brand
* Category
* Subcategory
* Product status
* Short description
* Full description
* Selling points
* Specifications
* Product images
* Product video
* Main image
* Thumbnail images
* EAN number
* Internal SKU
* Supplier SKU
* bol.com offer ID
* bol.com product ID
* Regular price
* Sale price
* Purchase cost
* VAT percentage
* Profit margin
* Stock quantity
* Low-stock threshold
* Weight
* Length
* Width
* Height
* Shipping class
* Warranty period
* Return eligibility
* SEO title
* SEO description
* Search keywords
* Creation date
* Last updated date
* Publication date

Product statuses:

* Draft
* Active
* Out of stock
* Archived
* Discontinued

Only active products should appear publicly.

---

# 7. Product variants

Support products with multiple variants.

Examples:

* Colour
* Size
* Model
* Capacity
* Lumen output
* Power
* Cable length
* Bundle quantity
* Number of attachments
* Weight capacity
* Connector type

Each variant must support its own:

* Variant name
* EAN
* SKU
* bol.com offer ID
* Price
* Sale price
* Cost price
* Stock quantity
* Product image
* Weight
* Dimensions
* Status

Example product structure:

Product:

Besjaar Oplaadbare Zaklamp

Variants:

* 2000 lumen
* 5000 lumen
* 7400 lumen
* 7800 lumen
* Set van 2

Customers must select a valid variant before adding the product to the cart.

Do not allow unavailable variants to be purchased.

---

# 8. Product categories

Create a hierarchical category structure.

Initial categories:

## Lighting and outdoor

* Rechargeable flashlights
* Battery flashlights
* Headlamps
* UV flashlights
* Emergency lighting
* Solar lighting
* Security lighting
* Grow lights

## Bathroom

* Showerheads
* Shower hoses
* Filtered showerheads
* Replacement filters
* Bathroom accessories

## Electronics

* Powerbanks
* USB adapters
* Card readers
* Laptop stands
* Phone holders
* Charging accessories

## Home and security

* Wireless doorbells
* Security lights
* Household tools
* Pest-control products

## Personal care

* Airstylers
* Hair brushes
* Hair-styling tools
* Skincare accessories

## Kitchen

* Digital kitchen scales
* Kitchen accessories

## Garden

* Solar garden lights
* Grow lights
* Outdoor tools

## Travel

* Universal travel adapters
* Travel accessories

## Creative

* Alcohol markers
* Drawing products

Administrators must be able to create, edit, reorder and archive categories.

---

# 9. Product listing pages

Create product listing pages with:

* Product grid
* Product list mode
* Category title
* Category description
* Breadcrumbs
* Product count
* Filters
* Sorting
* Pagination
* Load-more option
* Active filter chips
* Clear filters button

Sorting options:

* Aanbevolen
* Nieuwste
* Prijs laag naar hoog
* Prijs hoog naar laag
* Best beoordeeld
* Meest verkocht
* Grootste korting

Filters:

* Category
* Brand
* Price range
* Availability
* Rating
* Colour
* Product attributes
* Discount
* New products

Category-specific filters must be supported.

Examples:

For flashlights:

* Lumen
* Rechargeable
* Battery type
* Waterproof rating
* Bundle quantity

For shower products:

* Spray settings
* Filter included
* Hose included
* Colour

For personal care:

* Number of attachments
* Heat settings
* Power
* Ion technology

For electronics:

* USB-C
* USB-A
* Device compatibility
* Capacity
* Connector type

---

# 10. Product detail page

Create a professional product detail page containing:

* Breadcrumb navigation
* Product image gallery
* Image zoom
* Thumbnail selector
* Optional video
* Brand
* Product name
* Average rating
* Review count
* Regular price
* Sale price
* Discount percentage
* VAT indication
* Stock status
* Delivery estimate
* Variant selector
* Quantity selector
* Add-to-cart button
* Buy-now button
* Wishlist button
* Product highlights
* Full description
* Specifications table
* EAN
* Shipping information
* Return information
* Warranty details
* Customer reviews
* Related products
* Frequently bought together
* Recently viewed products

Stock labels:

* Op voorraad
* Nog maar enkele beschikbaar
* Tijdelijk uitverkocht
* Niet meer leverbaar

Prevent customers from ordering more than the available quantity.

---

# 11. Search functionality

Create fast search functionality across:

* Product names
* Short names
* EAN numbers
* SKUs
* Brands
* Categories
* Descriptions
* Specifications
* Keywords

The search bar should display live suggestions containing:

* Product image
* Product name
* Price
* Stock status
* Category

Create a search-results page with filtering and sorting.

Track unsuccessful searches in the admin dashboard so administrators can understand what customers are looking for.

---

# 12. Shopping cart

Create a persistent shopping cart.

The cart must support:

* Guest customers
* Logged-in customers
* Product variants
* Quantity adjustment
* Product removal
* Stock validation
* Coupon codes
* Shipping estimate
* VAT calculation
* Discount calculation
* Cart subtotal
* Shipping cost
* Grand total
* Continue-shopping button
* Checkout button

Save the cart between sessions.

Merge the guest cart with the customer cart after login.

Prevent checkout when a product is out of stock or when requested quantity exceeds available stock.

---

# 13. Checkout

Create a multi-step checkout process.

Steps:

1. Customer information
2. Shipping address
3. Billing address
4. Shipping method
5. Payment method
6. Order review
7. Order confirmation

Support guest checkout and registered customer checkout.

Required fields:

* First name
* Last name
* Email
* Phone number
* Street
* House number
* Additional address information
* Postal code
* City
* Country

Include:

* “Billing address is the same as shipping address”
* Terms-and-conditions agreement
* Privacy-policy agreement
* Newsletter subscription checkbox
* Order notes
* Company name
* VAT number for business customers

Validate all fields.

Do not create duplicate orders when a customer refreshes the payment page.

---

# 14. Payments

Prepare payment integration with Mollie as the primary payment provider.

Support:

* iDEAL
* Credit card
* PayPal
* Bancontact
* Apple Pay
* Google Pay
* Klarna, when enabled
* Bank transfer, when enabled

Store all API credentials securely.

Never expose payment secrets in the frontend.

Create payment statuses:

* Pending
* Paid
* Failed
* Cancelled
* Expired
* Partially refunded
* Refunded

Create webhook handling to update orders after Mollie confirms payment.

Only mark an order as paid after verified confirmation from the payment provider.

Provide an admin setting to enable or disable each payment method.

If a live payment integration cannot be completed without credentials, build the complete integration structure and provide secure admin configuration fields.

---

# 15. Shipping

Create a flexible shipping system.

Support:

* PostNL
* DHL
* DPD
* Local pickup
* Free shipping
* Flat-rate shipping
* Weight-based shipping
* Order-value-based shipping

Allow administrators to configure:

* Shipping zones
* Countries
* Shipping rates
* Free-shipping threshold
* Estimated delivery time
* Handling time
* Carrier
* Tracking URL pattern

Shipping statuses:

* Not processed
* Processing
* Ready for shipment
* Shipped
* Delivered
* Delivery failed
* Returned

Store:

* Tracking number
* Carrier
* Shipment date
* Delivery date
* Shipping label
* Packing slip

Send tracking information to the customer by email.

---

# 16. Customer accounts

Create secure customer registration and authentication.

Support:

* Email registration
* Secure password login
* Email verification
* Forgot password
* Password reset
* Logout
* Session management

Customer dashboard sections:

* Account overview
* Personal information
* Order history
* Order details
* Invoices
* Shipping addresses
* Billing addresses
* Wishlist
* Returns
* Password settings
* Newsletter preference

Customers should be able to:

* View order status
* Download invoices
* Track shipments
* Request returns
* Reorder previous products
* Update profile details
* Delete their account, subject to legal data-retention rules

---

# 17. Orders

Create a complete order-management system.

Order information:

* Order number
* Customer
* Customer email
* Customer phone
* Sales channel
* Order date
* Payment status
* Fulfilment status
* Shipping status
* Return status
* Products
* Variants
* Quantities
* Unit prices
* Discounts
* VAT
* Shipping cost
* Total amount
* Shipping address
* Billing address
* Payment method
* Shipping carrier
* Tracking number
* Customer notes
* Internal notes

Sales channels:

* Besjaar website
* bol.com
* Manual order
* Other marketplace

Order statuses:

* New
* Awaiting payment
* Paid
* Processing
* Ready to ship
* Shipped
* Delivered
* Cancelled
* Return requested
* Returned
* Refunded

Create automatic human-readable order numbers.

Example:

BES-2026-000001

Administrators must be able to:

* View orders
* Search orders
* Filter orders
* Update order status
* Add internal notes
* Print packing slips
* Generate invoices
* Add tracking information
* Cancel orders
* Process refunds
* Resend customer emails

---

# 18. Inventory management

Create a central inventory-management system.

The physical warehouse stock should be the main stock source.

Use this logic:

Available website stock equals:

Physical warehouse stock
minus unfulfilled website orders
minus unfulfilled bol.com orders
minus configured safety stock.

Do not create fake transfers between warehouse stock and bol.com stock.

When a product is sold on bol.com, reduce the physical warehouse stock after the order is successfully imported and reserved.

When a product is sold on the Besjaar website, reserve the stock immediately after order creation.

Release reserved stock when:

* Payment expires
* Order is cancelled
* Administrator cancels the order
* bol.com order is cancelled

Inventory fields:

* Product
* Variant
* EAN
* SKU
* Warehouse quantity
* Available quantity
* Reserved quantity
* Damaged quantity
* Incoming quantity
* Safety-stock quantity
* bol.com visible stock
* Website visible stock
* Low-stock threshold
* Last movement date
* Last synchronization date

Although “reserved stock” is necessary internally for preventing overselling, do not display a confusing “Reserved” field on the public product page.

---

# 19. Stock movements

Create an immutable stock-movement history.

Movement types:

* WEBSITE_SALE
* BOL_SALE
* MANUAL_ORDER
* CUSTOMER_RETURN
* SUPPLIER_RECEIPT
* DAMAGED
* LOST
* MANUAL_CORRECTION
* ORDER_CANCELLATION
* STOCK_RESERVATION
* RESERVATION_RELEASE
* FULFILMENT_TRANSFER

Each stock movement must contain:

* Movement ID
* Product
* Variant
* EAN
* Quantity before
* Quantity changed
* Quantity after
* Movement type
* Related order
* Related return
* Reason
* User
* Date and time

Never directly overwrite inventory without creating a stock-movement record.

---

# 20. Low-stock alerts

Create intelligent low-stock alerts.

Do not show a product in the low-stock alert when both the warehouse stock and bol.com stock are zero and the product is intentionally inactive or discontinued.

For active products, use the following business rule:

If total sales during the previous four months are greater than current physical warehouse stock, show the product in the low-stock-alert list.

Create an ordering recommendation using sales from the previous six months.

Recommended order quantity should consider:

* Sales during the previous six months
* Current warehouse stock
* Incoming stock
* Safety stock
* Average monthly sales
* Lead time
* Minimum order quantity

Display:

* Product
* EAN
* Brand
* Current stock
* Four-month sales
* Six-month sales
* Average monthly sales
* Suggested order quantity
* Stock-coverage months
* Alert severity

Sort the low-stock list from the lowest stock coverage to the highest.

Alert levels:

* Critical
* High
* Medium
* Low

---

# 21. bol.com integration

Create an integration module for the official bol.com Retailer API.

Create secure configuration fields for:

* BOL_CLIENT_ID
* BOL_CLIENT_SECRET
* BOL_API_BASE_URL

Default API base URL:

https://api.bol.com/retailer

Never expose the bol.com client secret in the frontend.

Create OAuth token management.

Automatically refresh access tokens when required.

Support synchronization for:

* Offers
* Orders
* Order items
* Shipments
* Returns
* Inventory
* Prices where supported
* Product information
* Product content
* Shipping labels where supported
* Process statuses

Match bol.com products to internal products primarily by:

1. EAN
2. Existing bol.com offer ID
3. Manually confirmed mapping

Do not create duplicate products when the same EAN already exists.

Create a manual mapping interface for unmatched items.

---

# 22. bol.com synchronization rules

Create scheduled and manual synchronization.

Provide a “Nu synchroniseren” button.

Display:

* Last successful synchronization
* Last attempted synchronization
* Number of imported orders
* Number of updated products
* Number of stock updates
* Number of errors
* Current synchronization status

Suggested synchronization:

* New orders: every 5 to 15 minutes
* Stock updates: after each stock change and scheduled reconciliation
* Shipments: after fulfilment updates
* Returns: periodically
* Product data: daily or manually

Create background jobs rather than blocking the user interface.

Make all synchronization actions idempotent.

The same bol.com order must never be imported twice.

Use the bol.com order ID as an external unique identifier.

Create retry logic with exponential backoff.

Create detailed synchronization logs.

Log:

* Endpoint
* Request type
* Entity
* Status
* Error
* Retry count
* Creation time
* Completion time

Do not store complete secrets or sensitive authentication tokens in logs.

---

# 23. Product information from bol.com

Where supported and permitted, retrieve and map:

* Product title
* Product description
* Brand
* Category
* EAN
* Product images
* Specifications
* Offer price
* Offer status
* Stock information

Administrators must review imported information before it overwrites manually edited website content.

Create a field-level source setting:

* Manual
* bol.com
* Supplier import

Allow administrators to lock specific product fields from automatic updates.

---

# 24. Returns and refunds

Create a complete return system.

Customers can request a return from their account.

Return information:

* Return number
* Order
* Product
* Variant
* Quantity
* Reason
* Customer explanation
* Uploaded photos
* Request date
* Approval status
* Return tracking
* Received date
* Product condition
* Refund amount
* Restocking decision

Return reasons:

* Wrong product received
* Product damaged
* Product defective
* Product not as expected
* No longer needed
* Other

Return statuses:

* Requested
* Under review
* Approved
* Rejected
* Waiting for product
* Product received
* Refund processing
* Refunded
* Closed

Administrators must decide whether returned stock is:

* Returned to sellable stock
* Damaged
* Quarantined
* Discarded

Create the correct stock movement after the decision.

---

# 25. Reviews

Create a product-review system.

Customers can submit:

* Star rating from 1 to 5
* Review title
* Review text
* Optional images

Only customers with a completed order for the product can receive a “Geverifieerde aankoop” label.

Review statuses:

* Pending
* Approved
* Rejected
* Flagged

Administrators can approve, reject and reply to reviews.

Display:

* Average rating
* Rating distribution
* Number of reviews
* Verified-purchase label
* Review date
* Administrator response

---

# 26. Promotions and discount codes

Create a promotion-management system.

Support:

* Percentage discount
* Fixed-value discount
* Product discount
* Category discount
* Brand discount
* Free shipping
* Buy-one-get-one promotion
* Bundle promotion
* Minimum order amount
* Usage limit
* Per-customer usage limit
* Start date
* End date
* Automatic promotions
* Coupon-code promotions

Prevent incompatible promotions from being combined unless explicitly allowed.

Display the original price, sale price and discount percentage on product pages.

---

# 27. Wishlist and recently viewed products

Create:

* Customer wishlist
* Guest wishlist stored locally
* Wishlist merge after login
* Recently viewed product list
* Add-to-cart from wishlist
* Remove-from-wishlist functionality

---

# 28. Email notifications

Create professional Dutch email templates for:

* Welcome email
* Email verification
* Password reset
* Order confirmation
* Payment received
* Payment failed
* Order processing
* Order shipped
* Delivery update
* Order cancelled
* Return requested
* Return approved
* Refund completed
* Low-stock admin alert
* bol.com synchronization error
* Contact-form confirmation

All email templates must be editable in the admin area.

Use dynamic fields such as:

* Customer name
* Order number
* Product name
* Total amount
* Tracking number
* Tracking link
* Company name

---

# 29. Admin dashboard

Create a secure admin dashboard separated from the public website.

Admin navigation:

* Dashboard
* Products
* Categories
* Brands
* Inventory
* Stock movements
* Orders
* bol.com orders
* Shipments
* Returns
* Customers
* Reviews
* Promotions
* Coupons
* Content
* Reports
* Synchronization
* Users and roles
* Settings
* Audit logs

Dashboard cards:

* Revenue today
* Revenue this month
* Orders today
* Orders this month
* Average order value
* Pending orders
* Orders ready to ship
* Low-stock products
* Out-of-stock products
* Pending returns
* Failed payments
* bol.com sync errors

Dashboard charts:

* Revenue over time
* Orders over time
* Sales by channel
* Sales by category
* Sales by brand
* Bestselling products
* Low-performing products
* Website versus bol.com sales
* Inventory value

---

# 30. Admin product management

Create a product table with:

* Product image
* Product name
* EAN
* Brand
* Category
* Price
* Warehouse stock
* bol.com stock
* Website stock
* Status
* Last updated
* Actions

Functions:

* Add product
* Edit product
* Archive product
* Bulk edit
* Import products
* Export products
* Change category
* Change brand
* Change status
* Update prices
* Update stock
* Manage variants
* Manage images
* Manage SEO
* View stock history
* View sales history

Do not include a dangerous “Delete all products” button.

Use archive or soft-delete functionality rather than permanent deletion.

Require confirmation for destructive actions.

Avoid duplicate buttons or duplicate actions in the interface.

---

# 31. Product import and export

Support CSV and Excel product import/export.

Importable fields:

* Product name
* Short name
* EAN
* SKU
* Brand
* Category
* Description
* Price
* Cost
* VAT
* Stock
* Weight
* Dimensions
* Status

Provide:

* Downloadable import template
* Column mapping
* Data preview
* Validation report
* Error rows
* Duplicate detection
* Import summary

Do not import invalid EAN values without warning.

Do not overwrite existing products unless the administrator confirms the matching rule.

---

# 32. Customer management

Create a customer table with:

* Name
* Email
* Phone
* Account status
* Registration date
* Number of orders
* Total spending
* Last order date
* Newsletter status

Customer detail page:

* Profile
* Addresses
* Orders
* Returns
* Reviews
* Notes
* Total spending
* Average order value

Administrators may add internal customer notes.

Do not expose internal notes to customers.

---

# 33. Reporting

Create reports for:

* Revenue
* Gross profit
* Net sales
* VAT
* Discounts
* Refunds
* Shipping revenue
* Payment costs
* Sales by product
* Sales by category
* Sales by brand
* Sales by channel
* Inventory value
* Inventory turnover
* Low-stock products
* Out-of-stock products
* Returns
* Customer lifetime value
* New versus returning customers
* Coupon performance

Allow filtering by:

* Date range
* Product
* Category
* Brand
* Sales channel
* Order status

Allow CSV and Excel export.

---

# 34. Content-management system

Create a CMS for:

* Home-page sections
* Hero banners
* Promotional banners
* Category descriptions
* Brand pages
* About page
* FAQs
* Shipping page
* Return page
* Warranty page
* Contact page
* Blog posts
* Buying guides
* Footer content
* Navigation menus

Administrators must be able to reorder home-page sections.

Support scheduled publication.

---

# 35. Contact and customer service

Create a contact form with:

* Name
* Email
* Phone
* Subject
* Order number
* Message
* File attachment
* Privacy consent

Contact request categories:

* Product question
* Order question
* Delivery question
* Return
* Warranty
* Business request
* Other

Store contact submissions in the admin dashboard.

Statuses:

* New
* Open
* Waiting for customer
* Resolved
* Closed

---

# 36. Roles and permissions

Create role-based access control.

Roles:

## Super administrator

Full access.

## Store manager

Access to products, orders, customers, promotions, reports and content.

## Warehouse employee

Access to inventory, stock movements, picking, packing and shipping.

## Customer-service employee

Access to customers, orders, returns, reviews and support requests.

## Content editor

Access to products, descriptions, images, categories, blog posts and pages.

## Financial user

Access to revenue, invoices, refunds and financial reports.

Allow administrators to create custom roles.

Users must only see modules they are authorised to access.

---

# 37. Audit logging

Create an audit log for sensitive actions.

Log:

* User
* Action
* Entity
* Entity ID
* Previous value
* New value
* Date and time
* IP address where available

Audit events should include:

* Product changes
* Price changes
* Stock changes
* Order-status changes
* Refunds
* User-role changes
* Configuration changes
* API credential changes
* Product imports
* Manual bol.com synchronization

Audit logs must not be editable by normal administrators.

---

# 38. Database entities

Create relational database entities for:

* Users
* Roles
* Permissions
* Customers
* Customer addresses
* Brands
* Categories
* Products
* Product variants
* Product images
* Product attributes
* Attribute values
* Channel listings
* Inventory locations
* Inventory balances
* Stock reservations
* Stock movements
* Orders
* Order items
* Payments
* Shipments
* Returns
* Return items
* Reviews
* Wishlists
* Wishlist items
* Carts
* Cart items
* Coupons
* Promotions
* Newsletter subscribers
* Contact requests
* Pages
* Blog posts
* Email templates
* Synchronization jobs
* Synchronization logs
* Audit logs
* Application settings

Create proper relationships and indexes.

Use unique constraints for:

* EAN where appropriate
* SKU
* Order number
* External bol.com order ID
* Customer email
* Coupon code
* Slug

Do not store product variants as unstructured text when relational fields are needed.

---

# 39. Security

Implement:

* Secure authentication
* Password hashing
* Role-based permissions
* Protected admin routes
* Server-side validation
* Client-side validation
* Rate limiting for login and contact forms
* CSRF protection where applicable
* Secure session handling
* Input sanitisation
* File-upload validation
* API credential encryption
* Webhook signature verification
* Protection against duplicate payment callbacks
* Protection against SQL injection
* Protection against cross-site scripting
* Protection against unauthorised data access

Never place secrets inside frontend code.

Create environment variables for:

* Database credentials
* Authentication secret
* Mollie API key
* bol.com client ID
* bol.com client secret
* Email provider credentials
* Storage credentials
* Webhook secrets

---

# 40. GDPR and privacy

Make the website GDPR-friendly.

Include:

* Cookie-consent banner
* Necessary cookies
* Analytics cookies
* Marketing cookies
* Consent storage
* Privacy-policy page
* Cookie-policy page
* Data-export request
* Account-deletion request
* Newsletter consent
* Contact-form consent
* Data-retention settings

Do not enable non-essential tracking before consent.

---

# 41. SEO

Implement:

* Editable page titles
* Meta descriptions
* Canonical URLs
* Clean slugs
* Open Graph metadata
* Product structured data
* Breadcrumb structured data
* Organisation structured data
* Sitemap
* Robots configuration
* Alt text for images
* Category descriptions
* Search-friendly product URLs
* Redirect management

Example URL structure:

* /producten
* /categorie/verlichting
* /merken/besjaar
* /product/besjaar-oplaadbare-zaklamp-5000-lumen

---

# 42. Performance

Optimise:

* Product images
* Lazy loading
* Database queries
* Product filtering
* Search performance
* Mobile loading speed
* Pagination
* API calls
* Background synchronization

Use loading skeletons instead of empty screens.

Display friendly error messages.

Do not expose technical stack traces to customers.

---

# 43. Initial sample products

Create sample product records that administrators can replace with actual data.

Examples:

1. Besjaar Oplaadbare Zaklamp 5000 Lumen
2. Besjaar Zaklamp 7400 Lumen
3. Besjaar UV Zaklamp
4. Besjaar Hoofdlamp
5. Besjaar Filter Douchekop – 10 Standen
6. Besjaar Doucheslang
7. Besjaar Draadloze Deurbel
8. Besjaar Solar Beveiligingslamp
9. Besjaar Powerbank
10. RYNEX Universele Reisadapter
11. RYNEX Verstelbare Laptopstandaard
12. RYNEX USB-C Kaartlezer
13. RYNEX Telefoonhouder
14. RYNEX Digitale Keukenweegschaal 5 kg
15. RYNEX Digitale Keukenweegschaal 10 kg
16. RYNEX Alcohol Markers
17. LYNEX 5-in-1 Airstyler
18. LYNEX 7-in-1 Airstyler
19. LYNEX Thermische Haarborstel
20. Besjaar Full-Spectrum Groeilamp

Use generic placeholder images until approved product images are uploaded.

Do not scrape or reuse copyrighted marketplace images without permission.

---

# 44. Settings

Create settings pages for:

## Store settings

* Store name
* Logo
* Favicon
* Company name
* Chamber of Commerce number
* VAT number
* Business email
* Customer-service phone
* Address
* Default language
* Default currency
* Time zone

Use Europe/Amsterdam as the default time zone.

## Order settings

* Order-number format
* Automatic cancellation period
* Invoice-number format
* Default VAT rate

## Inventory settings

* Safety stock
* Low-stock logic
* Backorders
* Stock reservation duration

## Payment settings

* Mollie credentials
* Enabled payment methods
* Test mode
* Live mode

## Shipping settings

* Carriers
* Shipping zones
* Shipping prices
* Free-shipping threshold

## bol.com settings

* Client ID
* Client secret
* API environment
* Synchronization frequency
* Stock buffer
* Automatic stock update
* Automatic order import
* Retry settings

## Email settings

* Sender name
* Sender email
* Reply-to email
* Email provider
* Email templates

---

# 45. Required workflows

Implement these complete workflows:

## Website purchase workflow

1. Customer selects product and variant.
2. System validates stock.
3. Customer adds product to cart.
4. Customer completes checkout.
5. Order is created.
6. Stock is reserved.
7. Customer completes payment.
8. Payment webhook confirms payment.
9. Order becomes paid.
10. Warehouse processes the order.
11. Shipment and tracking are added.
12. Customer receives shipment email.
13. Order becomes delivered.
14. Reserved stock becomes final sold stock.

## Failed-payment workflow

1. Order is created.
2. Stock is temporarily reserved.
3. Payment fails or expires.
4. Order becomes failed or expired.
5. Stock reservation is released.
6. Customer may retry payment.

## bol.com order workflow

1. Scheduled job retrieves new bol.com orders.
2. System checks the external order ID.
3. Existing orders are skipped.
4. Products are matched by EAN or offer ID.
5. Order is imported.
6. Warehouse stock is reserved.
7. Order appears in the central order dashboard.
8. Warehouse fulfils the order.
9. Shipment information is sent to bol.com.
10. Stock levels are reconciled.
11. All actions are logged.

## Return workflow

1. Customer requests return.
2. Administrator reviews request.
3. Customer receives instructions.
4. Returned product is received.
5. Warehouse records product condition.
6. Administrator approves refund.
7. Payment provider processes refund.
8. Stock is updated according to condition.
9. Customer receives confirmation.

---

# 46. Acceptance criteria

The build is complete only when:

* Customers can browse real database products.
* Customers can search and filter products.
* Customers can select product variants.
* Customers can add products to a persistent cart.
* Customers can complete checkout.
* Orders are stored in the database.
* Stock is validated before ordering.
* Inventory decreases through controlled stock movements.
* Customers can create accounts and view orders.
* Administrators can create and edit products.
* Administrators can manage categories and brands.
* Administrators can manage inventory.
* Administrators can process orders.
* Administrators can manage returns.
* Administrators can create promotions.
* Administrators can manage website content.
* Role-based access works.
* Audit logs are created.
* bol.com configuration is available.
* bol.com synchronization architecture is implemented.
* Payment configuration is secure.
* Mobile and desktop layouts work.
* Forms contain validation and error handling.
* Empty, loading and error states are designed.
* No important button leads to a blank or placeholder page.
* No secret credentials are hardcoded.
* No destructive “Delete All” feature is available.
* All important business workflows are functional.

---

# 47. Build priority

Build the system in this order:

## Phase 1

* Database
* Authentication
* Roles and permissions
* Product catalogue
* Categories
* Brands
* Product variants
* Product images
* Inventory

## Phase 2

* Public storefront
* Search
* Filters
* Cart
* Checkout
* Customer accounts

## Phase 3

* Orders
* Payments
* Shipping
* Invoices
* Email notifications

## Phase 4

* Admin dashboard
* Returns
* Reviews
* Promotions
* Reports
* CMS

## Phase 5

* bol.com integration
* Synchronization jobs
* Error handling
* Stock reconciliation
* Marketplace reporting

---

# Final instruction

Build the complete application inside Base44.

Do not generate only static pages.

Use real Base44 database entities, relationships, authentication, permissions, forms, queries, actions and workflows.

Connect every button to a working action.

Use reusable components.

Use realistic Dutch sample content.

Make all important data manageable from the admin dashboard.

Where external credentials are required, create secure configuration fields and a clear setup state rather than hardcoding demo credentials.

Before considering the project complete, test:

* Registration
* Login
* Product creation
* Product editing
* Variant selection
* Search
* Filtering
* Cart
* Checkout
* Stock validation
* Order creation
* Order-status updates
* Returns
* Role restrictions
* Mobile responsiveness
* Error handling

The result should be a complete, scalable e-commerce and warehouse-management platform for Besjaar, suitable for direct online sales and integration with bol.com.
