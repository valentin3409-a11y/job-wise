import { redirect } from 'next/navigation'

// Root page redirects to the trading bot dashboard
export default function Home() {
  redirect('/trading')
}
