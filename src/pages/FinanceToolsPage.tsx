import ComingSoonCategoryPage from './ComingSoonCategoryPage';

export default function FinanceToolsPage() {
  return (
    <ComingSoonCategoryPage
      title="Finance Tools"
      description="EMI, SIP, GST, and budgeting calculators for everyday student finances."
      path="/finance-tools"
      plannedTools={[
        'EMI Calculator', 'SIP Calculator', 'Compound Interest', 'GST Calculator',
        'Profit & Loss', 'Discount Calculator', 'Savings Calculator', 'Currency Converter',
        'Loan Calculator', 'Budget Calculator',
      ]}
    />
  );
}
