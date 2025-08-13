// SalientTemplate.jsx
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function SalientTemplate({ children, logo, pages }) {
  return (
    <>
      <Header logo={logo} pages={pages} />
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
