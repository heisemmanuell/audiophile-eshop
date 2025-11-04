import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createOrder = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
    zipCode: v.string(),
    paymentMethod: v.string(),
    items: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
      })
    ),
    subtotal: v.number(),
    shipping: v.number(),
    taxes: v.number(),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.insert("orders", {
      ...args,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    return order;
  },
});

export const getOrder = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
