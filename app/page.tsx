import { DataSetGenerator } from "@/components/data-set-generator";

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-6 text-center">
        Gen8Data by Cre8steve
      </h1>
      <p className="text-sm sm:text-lg text-muted-foreground sm:mb-8 text-center max-w-3xl mx-auto">
        Create customized data sets for analysis, testing, or development.
        Choose from predefined templates or generate AI-powered custom data.
      </p>
      <DataSetGenerator />
    </main>
  );
}
