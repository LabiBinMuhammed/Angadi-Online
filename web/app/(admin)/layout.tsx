import Navbar from '../(main)/Navbar'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="panel-layout">
        <AdminSidebar />
        <main className="panel-main fade-up">{children}</main>
      </div>
    </>
  )
}
