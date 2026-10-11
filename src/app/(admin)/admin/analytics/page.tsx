"use client"
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'

export default function AdminAnalyticsPage() {
  return <AnalyticsDashboard base="/api/admin/analytics" showPlatform subtitle="Platform-wide card performance and engagement." />
}
