import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Page() {
  const name = "initiative";
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold capitalize">{name}</h1>
          <p className="mt-4 text-white/50 text-lg">This page is under construction.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
