"use client"
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'

export default function CustomerAnalyticsPage() {
  return <AnalyticsDashboard base="/api/customer/analytics" heading="Your Analytics" subtitle="How visitors engage with your card." />
}
