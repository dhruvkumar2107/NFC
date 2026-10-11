"use client"
import LeadsManager from '@/components/leads/LeadsManager'

export default function CustomerLeadsPage() {
  return <LeadsManager base="/api/customer/leads" heading="Your Leads" subtitle="Enquiries and messages received through your card." />
}
