// Home has its own full-screen WA layout — no shared container/page wrapper needed
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
