import Link from 'next/link';
import { StaticPage } from '../components/StaticPage';

export default function ReturnPolicyPage() {
  return (
    <StaticPage title="Return & Refund Policy">
      <p>
        You can cancel an order yourself from My Account → Orders while it&apos;s still Pending or Confirmed —
        after that, please{' '}
        <Link href="/contact" className="font-bold text-[#252b42] hover:text-link-hover">
          contact us
        </Link>{' '}
        to arrange a return.
      </p>
      <p>Refunds are issued to your original payment method once a return is received and inspected.</p>
    </StaticPage>
  );
}
