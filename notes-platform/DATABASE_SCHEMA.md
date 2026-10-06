# Database schema overview

Source of truth: `prisma/schema.prisma`.

| Table | Purpose |
| --- | --- |
| `User` | Students and admins (`role`), bcrypt `passwordHash`, profile + status |
| `AdminProfile` | Admin metadata linked 1:1 to admin users |
| `Note` | Marketplace notes, pricing, cover URL, private `pdfPath`, external `notesLink` |
| `Coupon` | Coupon rules, validity window, usage limits |
| `CouponNote` | Optional note restrictions for a coupon |
| `CouponUsage` | One use per student per coupon (`@@unique([couponId, userId])`) |
| `CartItem` | Student cart (`@@unique([userId, noteId])`) |
| `Order` | Checkout totals (server-calculated), coupon linkage, payment/transaction status |
| `OrderItem` | Line items with snapshotted prices |
| `Transaction` | Payment records with unique `externalId` |
| `Purchase` | Entitlement table (`@@unique([userId, noteId])`) |

Apply schema:

```bash
npm run db:push
npm run db:seed
```
