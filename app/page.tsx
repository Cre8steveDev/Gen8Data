import { DataSetGenerator } from "@/components/data-set-generator"

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-4xl font-bold mb-6 text-center">Data Set Generator</h1>
      <p className="text-lg text-muted-foreground mb-8 text-center max-w-3xl mx-auto">
        Create customized data sets for analysis, testing, or development. Choose from predefined templates or generate
        AI-powered custom data.
      </p>
      <DataSetGenerator />
    </main>
  )
}
