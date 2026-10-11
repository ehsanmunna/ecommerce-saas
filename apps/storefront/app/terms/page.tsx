import { StaticPage } from '../components/StaticPage';

export default function TermsPage() {
  return (
    <StaticPage title="Terms & Conditions">
      <p>
        By creating an account or placing an order on this store, you agree to these terms. Product availability,
        pricing, and promotions may change at any time without notice.
      </p>
      <p>
        Orders are confirmed once placed; delivery timeframes are estimates, not guarantees. See our Return &amp;
        Refund Policy for how to return or exchange an item.
      </p>
      <p>You are responsible for keeping your account credentials secure and for the accuracy of the information you provide at checkout.</p>
    </StaticPage>
  );
}
