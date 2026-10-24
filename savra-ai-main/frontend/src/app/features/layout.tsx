import { Navbar } from "@/components/navbar";

export default function FeaturesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <div className="pt-16 md:pt-24">{children}</div>
    </>
  );
}
