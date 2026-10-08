import { StaticPage } from '../components/StaticPage';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What sizes do you carry?',
    a: 'Sizes vary by product — check each product page for the available sizes for that item.',
  },
  {
    q: 'How long does shipping take?',
    a: 'See our Shipping & Delivery Policy page for current delivery timeframes.',
  },
  {
    q: 'Can I return an item?',
    a: 'Yes — see our Return & Refund Policy page for eligibility and how to start a return.',
  },
  {
    q: 'How do I track my order?',
    a: 'Sign in and open My Account → Orders, then View Details on the order you want to track.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Online payment isn’t connected yet — orders are placed with payment collected on delivery.',
  },
];

export default function FaqPage() {
  return (
    <StaticPage title="Frequently Asked Questions">
      {FAQS.map((item) => (
        <div key={item.q}>
          <div className="font-bold text-[#2f2f2f] mb-1">{item.q}</div>
          <p>{item.a}</p>
        </div>
      ))}
    </StaticPage>
  );
}
