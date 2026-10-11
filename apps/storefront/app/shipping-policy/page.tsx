import { StaticPage } from '../components/StaticPage';

export default function ShippingPolicyPage() {
  return (
    <StaticPage title="Shipping & Delivery Policy">
      <p>
        We offer Standard and Express delivery at checkout. Orders are processed once payment is confirmed and
        typically ship within 1-2 business days.
      </p>
      <p>Free shipping applies to orders over $99; a flat shipping fee applies to all other orders.</p>
      <p>
        Delivery timeframes vary by destination. You can check the current status of your order from My Account →
        Orders at any time.
      </p>
    </StaticPage>
  );
}
