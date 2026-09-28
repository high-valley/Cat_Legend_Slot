import { Redirect } from 'expo-router';

// Web builds can be served from an unknown sub-path (e.g. an embedded page); send any unmatched URL to the party screen.
export default function NotFound() {
  return <Redirect href="/" />;
}
