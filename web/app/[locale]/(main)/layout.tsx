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
        .page-scroll-area {
          flex: 1;
          overflow-y: auto;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .page-content-container {
          flex: 1;
          width: 100%;
          max-width: 1200px;
          margin-inline: auto;
          padding-inline: 1.25rem;
          padding-top: 1.5rem;
          padding-bottom: 2.5rem;
          box-sizing: border-box;
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
          .page-scroll-area {
            overflow-y: visible;
          }
        }
      `}} />
      <div className="main-layout-wrapper">
        <Sidebar />
        <div className="main-viewport">
          <div className="page-scroll-area">
            <main className="fade-up">
              {children}
            </main>
            <Footer />
          </div>
          <MobileFooter />
        </div>
      </div>
    </>
  )
}
