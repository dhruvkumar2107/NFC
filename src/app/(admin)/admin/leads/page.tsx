"use client"
import LeadsManager from '@/components/leads/LeadsManager'

export default function AdminLeadsPage() {
  return <LeadsManager base="/api/admin/leads" showCard subtitle="All enquiries captured across every card." />
}
