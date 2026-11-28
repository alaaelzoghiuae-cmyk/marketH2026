import React from 'react';
import { renderCheckoutView as renderCheckoutViewImpl } from '@/sections/Checkout.jsx';

export default function LazyCheckout({ ctx }) {
  return renderCheckoutViewImpl(ctx);
}
