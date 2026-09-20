import ComingSoonCategoryPage from './ComingSoonCategoryPage';

export default function BlogPage() {
  return (
    <ComingSoonCategoryPage
      title="Blog"
      description="In-depth guides on every ALLROUNDER HELPER tool — how it works, common mistakes, and worked examples."
      path="/blog"
      plannedTools={[
        'How CGPA Is Really Calculated', 'The 75% Attendance Rule Explained', 'Budgeting on a Student Income',
        'GPA vs Percentage: What Employers Actually Read', 'Building a Study Schedule That Sticks',
      ]}
    />
  );
}
