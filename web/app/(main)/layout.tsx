import Navbar from './Navbar'
import MobileFooter from './MobileFooter'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="container page fade-up">{children}</main>
      <MobileFooter />
    </>
  )
}
