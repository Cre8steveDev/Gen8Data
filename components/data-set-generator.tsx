"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Loader2, FileSpreadsheet, FileDown, AlertCircle } from "lucide-react"
import { DataPreview } from "@/components/data-preview"
import { ColumnSelector } from "@/components/column-selector"
import { generateDataset } from "@/actions/generate-dataset"
import type { DataCategory, DatasetConfig } from "@/types/dataset"
import { dataCategories } from "@/lib/data-categories"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DataSetGenerator() {
  const [activeTab, setActiveTab] = useState<"template" | "ai">("template")
  const [selectedCategory, setSelectedCategory] = useState<string>(dataCategories[0].id)
  const [rowCount, setRowCount] = useState<number>(100)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatedData, setGeneratedData] = useState<any[] | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [aiPrompt, setAiPrompt] = useState<string>("")
  const [openAiAvailable, setOpenAiAvailable] = useState<boolean | null>(null)

  const activeCategory = dataCategories.find((cat) => cat.id === selectedCategory) as DataCategory

  // Check if OpenAI API key is available
  useEffect(() => {
    async function checkOpenAiAvailability() {
      try {
        const response = await fetch("/api/openai-key")
        const data = await response.json()
        setOpenAiAvailable(data.available)

        if (!data.available && activeTab === "ai") {
          setActiveTab("template")
          toast({
            title: "AI Generation Unavailable",
            description: data.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error checking OpenAI availability:", error)
        setOpenAiAvailable(false)
      }
    }

    checkOpenAiAvailability()
  }, [activeTab])

  // Initialize selected columns when category changes
  useEffect(() => {
    if (activeCategory && activeCategory.columns) {
      setSelectedColumns(activeCategory.columns.map((col) => col.id))
    }
  }, [selectedCategory, activeCategory])

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) => (prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]))
  }

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)

      const config: DatasetConfig = {
        type: activeTab,
        categoryId: selectedCategory,
        rowCount,
        columns: selectedColumns,
        aiPrompt: activeTab === "ai" ? aiPrompt : undefined,
      }

      const data = await generateDataset(config)
      setGeneratedData(data)
      toast({
        title: "Dataset Generated",
        description: `Successfully generated ${data.length} rows of data.`,
      })
    } catch (error) {
      console.error("Error generating dataset:", error)
      toast({
        title: "Generation Failed",
        description: "There was an error generating your dataset. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (format: "csv" | "xlsx") => {
    if (!generatedData) return

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: generatedData,
          format,
          filename: `${activeCategory.name.toLowerCase().replace(/\s+/g, "-")}-dataset`,
        }),
      })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${activeCategory.name.toLowerCase().replace(/\s+/g, "-")}-dataset.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download Complete",
        description: `Your dataset has been downloaded as a ${format.toUpperCase()} file.`,
      })
    } catch (error) {
      console.error("Error downloading dataset:", error)
      toast({
        title: "Download Failed",
        description: "There was an error downloading your dataset. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <Tabs defaultValue="template" value={activeTab} onValueChange={(v) => setActiveTab(v as "template" | "ai")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="template">Template-Based</TabsTrigger>
          <TabsTrigger value="ai" disabled={openAiAvailable === false}>
            AI-Generated
          </TabsTrigger>
        </TabsList>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Generate from Template</CardTitle>
              <CardDescription>Choose from our predefined data categories and customize your dataset.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Data Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeCategory && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label htmlFor="row-count">Number of Rows: {rowCount}</Label>
                    </div>
                    <Slider
                      id="row-count"
                      min={10}
                      max={1000}
                      step={10}
                      value={[rowCount]}
                      onValueChange={(values) => setRowCount(values[0])}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10</span>
                      <span>1000</span>
                    </div>
                  </div>

                  <ColumnSelector
                    columns={activeCategory.columns}
                    selectedColumns={selectedColumns}
                    onToggle={handleColumnToggle}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={handleGenerate} disabled={isGenerating || selectedColumns.length === 0}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Dataset"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Dataset</CardTitle>
              <CardDescription>
                Describe the data you need, and our AI will generate a custom dataset for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {openAiAvailable === false && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>OpenAI API Key Required</AlertTitle>
                  <AlertDescription>
                    To use AI-generated datasets, you need to configure an OpenAI API key in your environment variables.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Describe Your Dataset</Label>
                <textarea
                  id="ai-prompt"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="E.g., Create a dataset of fictional companies with their revenue, employee count, industry, and founding year."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={openAiAvailable === false}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label htmlFor="ai-row-count">Number of Rows: {rowCount}</Label>
                </div>
                <Slider
                  id="ai-row-count"
                  min={10}
                  max={500}
                  step={10}
                  value={[rowCount]}
                  onValueChange={(values) => setRowCount(values[0])}
                  className="py-4"
                  disabled={openAiAvailable === false}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10</span>
                  <span>500</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={handleGenerate} disabled={isGenerating || !aiPrompt.trim() || openAiAvailable === false}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Dataset"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {generatedData && generatedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Generated Dataset</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownload("csv")}>
                  <FileDown className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload("xlsx")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataPreview data={generatedData} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
