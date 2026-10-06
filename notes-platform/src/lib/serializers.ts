import type { Note, Order, Coupon, User, Purchase, Transaction } from "@/generated/prisma/client";
import { discountPercent } from "@/lib/pricing";
import { decimalToNumber } from "@/lib/utils";

export function serializeNote(note: Note, owned = false) {
  const price = decimalToNumber(note.price);
  const finalPrice = decimalToNumber(note.finalPrice);
  return {
    id: note.id,
    name: note.name,
    title: note.title,
    description: note.description,
    coverImage: note.coverImage,
    hasPdf: Boolean(note.pdfPath),
    hasExternalLink: Boolean(note.notesLink),
    price,
    discountType: note.discountType,
    discountValue: decimalToNumber(note.discountValue),
    finalPrice,
    discountPercent: discountPercent(price, finalPrice),
    status: note.status,
    viewCount: note.viewCount,
    purchaseCount: note.purchaseCount,
    createdAt: note.createdAt.toISOString(),
    owned,
  };
}

export function serializeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    status: user.status,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export function serializeCoupon(coupon: Coupon & { couponNotes?: { noteId: string }[] }) {
  return {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: decimalToNumber(coupon.discountValue),
    maxUsers: coupon.maxUsers,
    usedCount: coupon.usedCount,
    validFrom: coupon.validFrom.toISOString(),
    validUntil: coupon.validUntil.toISOString(),
    minPurchaseAmount: decimalToNumber(coupon.minPurchaseAmount),
    maxDiscount: coupon.maxDiscount != null ? decimalToNumber(coupon.maxDiscount) : null,
    status: coupon.status,
    noteIds: coupon.couponNotes?.map((n) => n.noteId) ?? [],
  };
}

export function serializeOrder(order: Order & { items?: { noteId: string; finalPrice: unknown; note?: Note }[] }) {
  return {
    id: order.id,
    subtotal: decimalToNumber(order.subtotal),
    discount: decimalToNumber(order.discount),
    couponDiscount: decimalToNumber(order.couponDiscount),
    totalAmount: decimalToNumber(order.totalAmount),
    paymentStatus: order.paymentStatus,
    transactionStatus: order.transactionStatus,
    createdAt: order.createdAt.toISOString(),
    items: order.items?.map((i) => ({
      noteId: i.noteId,
      title: i.note?.title,
      finalPrice: decimalToNumber(i.finalPrice as { toString(): string }),
    })),
  };
}

export function serializeTransaction(tx: Transaction & { order?: Order; user?: User }) {
  return {
    id: tx.id,
    externalId: tx.externalId,
    amount: decimalToNumber(tx.amount),
    paymentStatus: tx.paymentStatus,
    paymentMethod: tx.paymentMethod,
    createdAt: tx.createdAt.toISOString(),
    orderId: tx.orderId,
    studentName: tx.user?.name,
    studentEmail: tx.user?.email,
    order: tx.order ? serializeOrder(tx.order) : undefined,
  };
}

export function serializePurchase(p: Purchase & { note?: Note }) {
  return {
    id: p.id,
    noteId: p.noteId,
    title: p.note?.title,
    coverImage: p.note?.coverImage,
    purchasedPrice: decimalToNumber(p.purchasedPrice),
    purchasedAt: p.purchasedAt.toISOString(),
    hasPdf: Boolean(p.note?.pdfPath),
    hasExternalLink: Boolean(p.note?.notesLink),
  };
}
