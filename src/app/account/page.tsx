/**
 * Account Root Page
 * Redirects to profile page
 */
import { redirect } from 'next/navigation';

export default function AccountPage() {
  redirect('/account/profile');
}
