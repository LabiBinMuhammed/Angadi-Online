import MobileFooter from './MobileFooter'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .main-layout-wrapper {
          display: flex;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: var(--bg-base);
        }
        .main-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100vh;
          overflow: hidden;
        }
        main.page {
          flex: 1;
          overflow-y: auto;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        
        @media (max-width: 767px) {
          .main-layout-wrapper {
            display: block;
            height: auto;
            overflow: visible;
          }
          .main-viewport {
            display: block;
            height: auto;
            overflow: visible;
          }
          main.page {
            overflow-y: visible;
          }
        }
      `}} />
      <div className="main-layout-wrapper">
        <Sidebar />
        <div className="main-viewport">
          <main className="container page fade-up" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ flex: 1 }}>{children}</div>
            <Footer />
          </main>
          <MobileFooter />
        </div>
      </div>
    </>
  )
}
