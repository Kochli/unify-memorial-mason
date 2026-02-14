import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

/**
 * Singleton Stripe promise — loaded once and reused across the app.
 * Returns null if the publishable key is not configured.
 */
export const stripePromise = publishableKey?.trim()
  ? loadStripe(publishableKey.trim())
  : null;
