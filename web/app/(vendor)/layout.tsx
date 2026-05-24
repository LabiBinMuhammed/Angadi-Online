import Navbar from '../(main)/Navbar'
import VendorSidebar from './VendorSidebar'
import './vendor.css'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="vendor-premium-body">
      <Navbar />
      <div className="vp-layout">
        <VendorSidebar />
        <main className="vp-main vp-fade-up">{children}</main>
      </div>
    </div>
  )
}
